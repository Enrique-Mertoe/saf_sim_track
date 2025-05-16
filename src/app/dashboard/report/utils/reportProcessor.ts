// src/pages/Reports/utils/reportProcessor.ts
import {Report, ProcessedReport, ProcessedRecord, DatabaseRecord, TeamReport} from '../types';
import simService from "@/services/simService";
import {SIMCard, Team, User} from "@/models";

type SimAdapter = SIMCard & {
    team_id: Team;
    sold_by_user_id: User;
    qualityStatus: string;
    matchStatus: string;
}
const fetchSimCardDataFromDatabase = async (simSerialNumbers: string[], user: User): Promise<DatabaseRecord[]> => {
    const {data, error} = await simService.getAllSimCards(user);
    if (error)
        return []

    return (data as SimAdapter[]).filter(sim => simSerialNumbers.includes(sim.id))
        .map((serNum) => ({
            simSerialNumber: serNum.serial_number,
            team: serNum.team_id.name,
            uploadedBy: serNum.sold_by_user_id.full_name,
            createdAt: new Date(serNum.created_at).toISOString(),
        }));
};

/**
 * Process the report by comparing with database records
 */
export const processReport = async (
    report: Report,
    user: User,
    progressCallback: (progress: number) => void
): Promise<ProcessedReport> => {
    // Extract all SIM serial numbers for batch lookup
    const simSerialNumbers = report.records.map(record => record.simSerialNumber);

    // Update progress
    progressCallback(20);

    // Fetch matching records from a database
    const databaseRecords = await fetchSimCardDataFromDatabase(simSerialNumbers, user);

    // Create a map for a quick lookup
    const simDataMap = new Map<string, DatabaseRecord>();
    databaseRecords.forEach(record => {
        simDataMap.set(record.simSerialNumber, record);
    });

    // Update progress
    progressCallback(50);

    // Process each record
    const processedRecords: ProcessedRecord[] = report.records.map(record => {
        const dbRecord = simDataMap.get(record.simSerialNumber);
        const matched = !!dbRecord;
        const qualitySim = matched && record.topUpAmount >= 50;

        return {
            ...record,
            matched,
            qualitySim,
            team: dbRecord?.team || 'Unknown',
            uploadedBy: dbRecord?.uploadedBy || 'Unknown',
        };
    });

    // Update progress
    progressCallback(70);

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

    // Create mock Excel data (in a real app, this would be the actual raw data)
    const rawData = new Uint8Array([1, 2, 3, 4, 5]); // Placeholder

    // Update progress
    progressCallback(100);

    return {
        rawRecords: processedRecords,
        teamReports,
        matchedCount,
        qualityCount,
        unmatchedCount,
        totalCount: processedRecords.length,
        rawData,
    };
};