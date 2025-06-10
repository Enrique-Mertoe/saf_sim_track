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

// Rate limiting utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Semaphore to limit concurrent requests
class Semaphore {
    private permits: number;
    private waiting: Array<() => void> = [];

    constructor(permits: number) {
        this.permits = permits;
    }

    async acquire(): Promise<void> {
        if (this.permits > 0) {
            this.permits--;
            return;
        }

        return new Promise<void>(resolve => {
            this.waiting.push(resolve);
        });
    }

    release(): void {
        this.permits++;
        const next = this.waiting.shift();
        if (next) {
            this.permits--;
            next();
        }
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        await this.acquire();
        try {
            return await fn();
        } finally {
            this.release();
        }
    }
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
    const batchSize = 250; // Reduced batch size
    const results: DatabaseRecord[] = [];
    const totalBatches = Math.ceil(simSerialNumbers.length / batchSize);

    for (let i = 0; i < simSerialNumbers.length; i += batchSize) {
        const batchIndex = Math.floor(i / batchSize);
        const batch = simSerialNumbers.slice(i, i + batchSize);
        const naturalProgress = ((batchIndex + 0.5) / totalBatches) * 100;

        progressCallback(mapProgressToRange(naturalProgress));

        try {
            const {data, error} = await simService.getSimCardsBySerialBatch(user, batch);
            if (error || !data) {
                console.warn(`Batch ${batchIndex} failed:`, error);
                continue;
            }

            const simData = data as SimAdapter[];

            const batchMatches = simData.map((sim) => ({
                simSerialNumber: sim.serial_number,
                simId: sim.id,
                team: sim.team_id.name,
                uploadedBy: sim?.assigned_to_user_id?.full_name ?? "Not assigned",
                createdAt: new Date(sim.created_at).toISOString(),
            }));

            results.push(...batchMatches);

            // Add small delay between batches to prevent overwhelming the server
            if (batchIndex < totalBatches - 1) {
                await sleep(100);
            }
        } catch (error) {
            console.error(`Error processing batch ${batchIndex}:`, error);
            // Continue with next batch instead of failing completely
        }
    }

    progressCallback(30);
    return results;
};

const syncMatch = async (
    databaseRecords: DatabaseRecord[],
    records: SafaricomRecord[],
    progressCallback: () => void,
    user: User,
    semaphore: Semaphore
) => {
    const recordMap = new Map(
        records.filter(r => r.simSerialNumber).map(r => [r.simSerialNumber, r])
    );

    // Process records in smaller chunks with controlled concurrency
    const chunkSize = 50; // Process 50 records at a time
    const chunks = chunkArray(databaseRecords, chunkSize);

    for (const chunk of chunks) {
        await Promise.allSettled(chunk.map(async (record) => {
            return semaphore.execute(async () => {
                const sourceRecord = recordMap.get(record.simSerialNumber);
                if (!sourceRecord) {
                    progressCallback();
                    return;
                }

                try {
                    const isQuality = sourceRecord.quality == "Y";
                    const qualityStatus = isQuality ? SIMStatus.QUALITY : SIMStatus.NONQUALITY;

                    const simId = record.simId;

                    // Add retry logic for database operations
                    let retries = 3;
                    let existingSim;
                    let error;

                    while (retries > 0) {
                        const result = await simCardService.DB
                            .from('sim_cards')
                            .select('status, activation_date,registered_on,usage')
                            .eq('id', simId)
                            .single();

                        if (!result.error) {
                            existingSim = result.data;
                            error = null;
                            break;
                        }

                        error = result.error;
                        retries--;

                        if (retries > 0) {
                            await sleep(1000 * (4 - retries)); // Exponential backoff
                        }
                    }

                    if (error || !existingSim) {
                        console.warn(`Failed to fetch SIM ${simId} after retries:`, error);
                        return;
                    }

                    const updateFields: any = {
                        match: SIMStatus.MATCH,
                        quality: qualityStatus,
                        top_up_amount: +sourceRecord.topUpAmount || null,
                        usage: +sourceRecord.cumulativeUsage || null
                    };

                    const parsedDate = parseDateToYMD(sourceRecord.dateId);

                    // if (!existingSim.activation_date) {
                        updateFields.activation_date = parsedDate;
                    // }

                    if (!existingSim.registered_on) {
                        const date = new Date(sourceRecord.tmDate);
                        updateFields.registered_on = date.toISOString().split('T')[0];
                    }

                    if (existingSim.status !== SIMStatus.ACTIVATED) {
                        updateFields.status = SIMStatus.ACTIVATED;
                    }

                    if (Object.keys(updateFields).length > 0) {
                        // Add retry logic for updates too
                        retries = 3;
                        while (retries > 0) {
                            try {
                                await simService.updateSIMCard(simId, updateFields, user);
                                break;
                            } catch (updateError) {
                                retries--;
                                if (retries > 0) {
                                    await sleep(1000 * (4 - retries));
                                } else {
                                    console.error(`Failed to update SIM ${simId}:`, updateError);
                                }
                            }
                        }
                    }

                } catch (err) {
                    console.error(`Error processing record ${record.simSerialNumber}:`, err);
                } finally {
                    progressCallback();
                }
            });
        }));

        // Small delay between chunks
        await sleep(200);
    }
};

const runParallelSync = async (
    databaseRecords: DatabaseRecord[],
    records: SafaricomRecord[],
    progressCallback: (progress: number) => void,
    user: User
) => {
    // Limit concurrent requests to prevent resource exhaustion
    const semaphore = new Semaphore(10); // Max 10 concurrent requests
    const batchSize = 100; // Smaller batches
    const batches = chunkArray(databaseRecords, batchSize);
    const totalRecords = databaseRecords.length;

    let processed = 0;

    const updateProgress = () => {
        processed += 1;
        const percent = Math.floor(30 + ((processed / totalRecords) * 50)); // Progress from 30% to 80%
        progressCallback(percent);
    };

    // Process batches sequentially to avoid overwhelming resources
    for (const batch of batches) {
        await syncMatch(batch, records, updateProgress, user, semaphore);

        // Brief pause between batches
        await sleep(100);
    }

    progressCallback(80);
};

// Bulk update optimization (if your API supports it)
const bulkUpdateSIMCards = async (
    updates: Array<{id: string, fields: any}>,
    user: User,
    semaphore: Semaphore
): Promise<void> => {
    const batchSize = 100;
    const batches = chunkArray(updates, batchSize);

    for (const batch of batches) {
        await semaphore.execute(async () => {
            try {
                // If your API supports bulk updates, use this approach
                // Otherwise, fall back to individual updates with controlled concurrency

                await Promise.allSettled(batch.map(async (update) => {
                    let retries = 3;
                    while (retries > 0) {
                        try {
                            await simService.updateSIMCard(update.id, update.fields, user);
                            break;
                        } catch (error) {
                            retries--;
                            if (retries > 0) {
                                await sleep(1000 * (4 - retries));
                            } else {
                                console.error(`Failed to update SIM ${update.id}:`, error);
                            }
                        }
                    }
                }));
            } catch (error) {
                console.error('Bulk update batch failed:', error);
            }
        });

        await sleep(500); // Longer delay between bulk batches
    }
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

    try {
        // Fetch matching records from database
        const databaseRecords = await fetchSimCardDataFromDatabase({
            simSerialNumbers,
            user,
            progressCallback
        });

        const simDataMap = new Map<string, DatabaseRecord>();
        databaseRecords.forEach(record => {
            simDataMap.set(record.simSerialNumber, record);
        });

        Signal.trigger("add-process", "Uploading bundle data...");

        // Run the sync process with improved resource management
        await runParallelSync(databaseRecords, report.records, progressCallback, user);

        // Update progress
        progressCallback(85);

        // Process each record
        const processedRecords: ProcessedRecord[] = report.records.map(record => {
            const dbRecord = simDataMap.get(record.simSerialNumber);
            const matched = !!dbRecord;
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
        progressCallback(100);

        return {
            rawRecords: processedRecords,
            teamReports,
            matchedCount,
            qualityCount,
            unmatchedCount,
            totalCount: processedRecords.length,
        };

    } catch (error) {
        console.error('Error processing report:', error);
        throw new Error(`Report processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};