import {DatabaseRecord, ProcessedRecord, ProcessedReport, Report, TeamReport} from '../types';
import {SIMCard, Team, User} from "@/models";
import Signal from "@/lib/Signal";
import {$} from "@/lib/request";

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
// Poll task status with progress updates
const pollTaskStatus = async (taskId: string, progressCallback: (progress: number) => void): Promise<void> => {
    const pollInterval = 2000; // Poll every 2 seconds
    let lastProgress = 30; // Start from where database fetch ended

    return new Promise((resolve, reject) => {
        const poll = async () => {
            try {
                const response = await new Promise<any>((res, rej) => {
                    $.post({
                        url: "/api/actions",
                        contentType: $.JSON,
                        data: {
                            action: "report",
                            target: "sync_status",
                            data: { taskId }
                        }
                    }).then(result => {
                        if (result.ok) res(result.data);
                        else rej(result.data);
                    }).catch(rej);
                });

                const { status, progress, error } = response;

                // Update progress smoothly
                if (progress > lastProgress) {
                    // Map progress from 0-100 to 30-85
                    const mappedProgress = 30 + ((progress / 100) * 55);
                    progressCallback(Math.floor(mappedProgress));
                    lastProgress = mappedProgress;
                    
                    Signal.trigger("add-process", `Syncing records... ${progress}%`);
                }

                switch (status) {
                    case 'completed':
                        progressCallback(85);
                        Signal.trigger("add-process", "Sync completed successfully");
                        resolve();
                        return;
                        
                    case 'failed':
                        Signal.trigger("add-process", `Sync failed: ${error || 'Unknown error'}`);
                        reject(new Error(`Sync failed: ${error || 'Unknown error'}`));
                        return;
                        
                    case 'pending':
                    case 'running':
                        // Continue polling
                        setTimeout(poll, pollInterval);
                        break;
                        
                    default:
                        reject(new Error(`Unknown task status: ${status}`));
                        return;
                }
            } catch (error) {
                console.error('Error polling task status:', error);
                reject(error);
            }
        };

        // Start polling
        poll();
    });
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
    
    // Chunk large datasets to avoid 413 errors
    const MAX_RECORDS_PER_CHUNK = 5000;
    const recordChunks = [];
    const serialChunks = [];
    
    for (let i = 0; i < report.records.length; i += MAX_RECORDS_PER_CHUNK) {
        recordChunks.push(report.records.slice(i, i + MAX_RECORDS_PER_CHUNK));
        serialChunks.push(simSerialNumbers.slice(i, i + MAX_RECORDS_PER_CHUNK));
    }

    // Update progress
    progressCallback(10);
    Signal.trigger("add-process", `Processing ${recordChunks.length} chunk(s)...`);

    try {
        const taskIds: string[] = [];
        
        // Process each chunk separately
        for (let chunkIndex = 0; chunkIndex < recordChunks.length; chunkIndex++) {
            const recordChunk = recordChunks[chunkIndex];
            const serialChunk = serialChunks[chunkIndex];
            
            Signal.trigger("add-process", `Starting sync for chunk ${chunkIndex + 1}/${recordChunks.length}...`);

            // Start optimized streaming sync (fetch-process-fetch pattern)
            const syncResponse = await new Promise<{taskId: string}>((resolve, reject) => {
                $.post({
                    url: "/api/actions",
                    contentType: $.JSON,
                    data: {
                        action: "report",
                        target: "sync",
                        data: {
                            simSerialNumbers: serialChunk,
                            records: recordChunk,
                        }
                    }
                }).then(res => {
                    if (res.ok)
                        resolve(res.data as {taskId: string})
                    else reject(res.data)
                }).catch(reject)
            });
            
            if (syncResponse.taskId) {
                taskIds.push(syncResponse.taskId);
            }
        }

        // Poll all tasks for completion
        if (taskIds.length > 0) {
            await Promise.all(taskIds.map(taskId => 
                pollTaskStatus(taskId, (progress) => {
                    // Adjust progress for multiple chunks
                    const adjustedProgress = 30 + ((progress - 30) / taskIds.length);
                    progressCallback(Math.floor(adjustedProgress));
                })
            ));
        }

        // After sync is complete, we need to fetch the processed database records for UI display
        Signal.trigger("add-process", "Fetching final database records...");
        const databaseResponse = await new Promise<{databaseRecords: DatabaseRecord[]}>((resolve, reject) => {
            $.post({
                url: "/api/actions",
                contentType: $.JSON,
                data: {
                    action: "report",
                    target: "fetch_database_records",
                    data: {
                        simSerialNumbers
                    }
                }
            }).then(res => {
                if (res.ok)
                    resolve(res.data as {databaseRecords: DatabaseRecord[]})
                else reject(res.data)
            }).catch(reject)
        });

        const databaseRecords = databaseResponse.databaseRecords;
        const simDataMap = new Map<string, DatabaseRecord>();
        databaseRecords.forEach(record => {
            simDataMap.set(record.simSerialNumber, record);
        });

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
                records: records,
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
        console.log(teamReports)

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