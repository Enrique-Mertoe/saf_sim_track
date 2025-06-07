import {DatabaseRecord, ProcessedRecord, ProcessedReport, Report, SafaricomRecord, TeamReport} from '../types';
import simService from "@/services/simService";
import simCardService from "@/services/simService";
import {SIMCard, Team, User} from "@/models";
import {SIMStatus} from "@/models/types";
import Signal from "@/lib/Signal";

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


const syncMatch = async (databaseRecords: DatabaseRecord[], records: SafaricomRecord[], progressCallback: (progress: number) => void, user: User) => {
    const totalRecords = databaseRecords.length;
    const progressRange = 31;
    const recordMap = new Map(
        records.filter(r => r.simSerialNumber).map(r => [r.simSerialNumber, r])
    );

    for (let i = 0; i < totalRecords; i++) {
        const record = databaseRecords[i];
        const sourceRecord = recordMap.get(record.simSerialNumber);
        if (!sourceRecord) continue;

        // Determine quality status
        const isQuality = sourceRecord.quality === "Y";
        // && parseFloat(sourceRecord.topUpAmount.toString()) >= 50;
        const qualityStatus = isQuality ? SIMStatus.QUALITY : SIMStatus.NONQUALITY;


        const simId = record.simId;
        const {data: existingSim, error} = await simCardService.DB
            .from('sim_cards')
            .select('status, activation_date,registered_on,usage')
            .eq('id', simId)
            .single();

        if (error) {
            Signal.trigger("add-process", {label: "Failed step", error: true});
            throw new Error("Something went wrong");
        }
        if (!existingSim) {
            Signal.trigger("add-process", {label: "Failed step", error: true});
            throw new Error("SIM card not found");
        }

        const updateFields: any = {
            match: SIMStatus.MATCH,
            quality: qualityStatus,
            top_up_amount: sourceRecord.topUpAmount,
        };

// ✅ Only set `activation_date` if it's currently null
        const parsedDate = parseDateToYMD(sourceRecord.topUpDate);

        if (!existingSim.activation_date && parsedDate) {
            updateFields.activation_date = parsedDate;
        }
        if (!existingSim.usage) {
            updateFields.usage = sourceRecord.cumulativeUsage;
        }

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
        const progress = 31 + Math.floor((i / totalRecords) * progressRange);
        progressCallback(progress)

    }
    progressCallback(49);
}

function parseDateToYMD(input: string | number | Date | null | undefined): string | null {
    if (!input) return null;

    try {
        if (typeof input === 'string') {
            // Handle compact format like "20250604"
            if (/^\d{8}$/.test(input)) {
                const formatted = `${input.slice(0, 4)}-${input.slice(4, 6)}-${input.slice(6, 8)}`;
                const d = new Date(formatted);
                if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
            }

            // Handle ISO-like or valid formats
            const d = new Date(input);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        }

        if (typeof input === 'number') {
            // Unix timestamp or Excel-style date
            const d = new Date(input);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        }

        if (input instanceof Date) {
            if (!isNaN(input.getTime())) return input.toISOString().split('T')[0];
        }
    } catch (e) {
        console.warn("Date parsing error:", e);
    }

    return null; // Invalid or unknown format
}

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
    await syncMatch(databaseRecords, report.records, progressCallback, user)
    // Update progress
    progressCallback(80);


    // Process each record
    const processedRecords: ProcessedRecord[] = report.records.map(record => {
        const dbRecord = simDataMap.get(record.simSerialNumber);
        const matched = !!dbRecord;
        // const qualitySim = matched && record.topUpAmount >= 50;
        const qualitySim = matched && record.quality == "Y";

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
