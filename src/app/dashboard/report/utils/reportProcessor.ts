import {DatabaseRecord, ProcessedRecord, ProcessedReport, Report, SafaricomRecord, TeamReport} from '../types';
import simService from "@/services/simService";
import simCardService from "@/services/simService";
import {SIMCard, Team, User} from "@/models";
import {SIMStatus} from "@/models/types";
import Signal from "@/lib/Signal";
import {chunkArray, parseDateToYMD} from "@/helper";

type SimAdapter = SIMCard & {
    team_id: Team;
    assigned_to_user_id?: User;
    qualityStatus: string;
}
const mapProgressToRange = (naturalProgress: number, min = 11, max = 29) => {
    return min + ((naturalProgress / 100) * (max - min));
};
const fetchSimCardDataFromDatabase = async ({
                                                progressCallback,
                                                simSerialNumbers,
                                                user
                                            }: {
                                                progressCallback: (progress: number) => void,
                                                simSerialNumbers: string[];
                                                user: User
                                            }
): Promise<DatabaseRecord[]> => {
    const batchSize = 500;
    const results: DatabaseRecord[] = [];
    const totalBatches = Math.ceil(simSerialNumbers.length / batchSize);
    for (let i = 0; i < simSerialNumbers.length; i += batchSize) {
        const batchIndex = Math.floor(i / batchSize);
        const batch = simSerialNumbers.slice(i, i + batchSize);
        const naturalProgress = ((batchIndex + 0.5) / totalBatches) * 100;

        progressCallback(mapProgressToRange(naturalProgress));
        const {data, error} = await simService.getSimCardsBySerialBatch(user, batch);
        if (error || !data) continue;

        const simData = data as SimAdapter[];

        const batchMatches = simData.map((sim) => ({
            simSerialNumber: sim.serial_number,
            simId: sim.id,
            team: sim.team_id.name,
            uploadedBy: sim?.assigned_to_user_id?.full_name ?? "Not assigned",
            createdAt: new Date(sim.created_at).toISOString(),
        }));

        results.push(...batchMatches);
    }
    progressCallback(30);
    return results;
};

const syncMatch = async (
    databaseRecords: DatabaseRecord[],
    records: SafaricomRecord[],
    progressCallback: () => void,
    user: User
) => {
    const recordMap = new Map(
        records.filter(r => r.simSerialNumber).map(r => [r.simSerialNumber, r])
    );

    await Promise.allSettled(databaseRecords.map(async (record) => {
        const sourceRecord = recordMap.get(record.simSerialNumber);
        if (!sourceRecord) return;

        try {
            const isQuality = sourceRecord.quality == "Y";
            const qualityStatus = isQuality ? SIMStatus.QUALITY : SIMStatus.NONQUALITY;

            const simId = record.simId;
            const {data: existingSim, error} = await simCardService.DB
                .from('sim_cards')
                .select('status, activation_date,registered_on,usage')
                .eq('id', simId)
                .single();

            if (error || !existingSim) return;

            const updateFields: any = {
                match: SIMStatus.MATCH,
                quality: qualityStatus,
                top_up_amount: +sourceRecord.topUpAmount || null,
                usage : +sourceRecord.cumulativeUsage || null
            };

            // if (!existingSim.activation_date) {
            //     console.log("ppp",parsedDate,sourceRecord.dateId)
                updateFields.activation_date = parseDateToYMD(sourceRecord.dateId);
            // }


            if (!existingSim.registered_on) {
                const date = new Date(sourceRecord.tmDate);
                updateFields.registered_on = date.toISOString().split('T')[0];
            }

            if (existingSim.status !== SIMStatus.ACTIVATED) {
                updateFields.status = SIMStatus.ACTIVATED;
            }

            if (Object.keys(updateFields).length > 0) {
                await simService.updateSIMCard(simId, updateFields, user);
            }

        } finally {
            progressCallback();
        }
    }));
};




/**
 * Process the report by comparing with database records
 */
export const processReport = async (
    report: Report,
    user: User,
    progressCallback: (progress: number) => void,
    startDate?: string,
    endDate?: string
): Promise<ProcessedReport> => {
    Signal.trigger("add-process", "Extracting serials...");
    // Extract all SIM serial numbers for batch lookup
    const simSerialNumbers = report.records.map(record => record.simSerialNumber);

    // Update progress
    progressCallback(10);
    Signal.trigger("add-process", "Checking SIM cards...");
    // Fetch matching records from a database
    const databaseRecords = await fetchSimCardDataFromDatabase({simSerialNumbers, user, progressCallback});

    const simDataMap = new Map<string, DatabaseRecord>();
    databaseRecords.forEach(record => {
        simDataMap.set(record.simSerialNumber, record);
    });
    Signal.trigger("add-process", "Uploading bundle data...");
    // await new Promise(()=>{
    //     console.log("record",report.records.map(e=>({usage:e.cumulativeUsage,quality:e.quality})))
    // })
    // await syncMatch(databaseRecords, report.records, progressCallback, user)
    await runParallelSync(databaseRecords, report.records, progressCallback, user);

    // Update progress
    progressCallback(80);


    // Process each record
    const processedRecords: ProcessedRecord[] = report.records.map(record => {
        const dbRecord = simDataMap.get(record.simSerialNumber);
        const matched = !!dbRecord;
        // const qualitySim = matched && record.topUpAmount >= 50;
        const qualitySim = record.quality == "Y";

        return {
            ...record,
            matched,
            qualitySim,
            team: dbRecord?.team || 'Unknown',
            uploadedBy: dbRecord?.uploadedBy || 'Unknown',
        };
    });

    // Update progress
    progressCallback(90);
    Signal.trigger("add-process", "Finalizing...");

    // Group by team
    const teamMap = new Map<string, ProcessedRecord[]>();
    processedRecords.forEach(record => {
        const team = record.team;
        if (!teamMap.has(team)) {
            teamMap.set(team, []);
        }
        teamMap.get(team)?.push(record);
    });

    // Create team reports
    const teamReports: TeamReport[] = Array.from(teamMap.entries()).map(([teamName, records]) => {
        const matchedCount = records.filter(r => r.matched).length;
        const qualityCount = records.filter(r => r.qualitySim).length;

        return {
            teamName,
            records,
            matchedCount,
            qualityCount,
        };
    });

    // Sort team reports by matched count (descending)
    teamReports.sort((a, b) => b.matchedCount - a.matchedCount);

    // Calculate totals
    const matchedCount = processedRecords.filter(r => r.matched).length;
    const qualityCount = processedRecords.filter(r => r.qualitySim).length;
    const unmatchedCount = processedRecords.filter(r => !r.matched).length;

    // Update progress
    progressCallback(90);

    // // Create mock Excel data (in a real app, this would be the actual raw data)
    // const rawData = new Uint8Array([1, 2, 3, 4, 5]); // Placeholder

    // Update progress
    progressCallback(100);

    return {
        rawRecords: processedRecords,
        teamReports,
        matchedCount,
        qualityCount,
        unmatchedCount,
        totalCount: processedRecords.length,
    };
};

const runParallelSync = async (
    databaseRecords: DatabaseRecord[],
    records: SafaricomRecord[],
    progressCallback: (progress: number) => void,
    user: User
) => {
    const batchSize = 250;
    const batches = chunkArray(databaseRecords, batchSize);
    const totalRecords = databaseRecords.length;

    let processed = 0;

    const updateProgress = () => {
        const percent = Math.floor((processed / totalRecords) * 100);
        progressCallback(percent);
    };

    await Promise.all(
        batches.map(batch => syncMatch(batch, records, () => {
            processed += 1;
            updateProgress();
        }, user))
    );

    progressCallback(100);
};

