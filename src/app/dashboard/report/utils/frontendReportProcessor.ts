import {DatabaseRecord, ProcessedRecord, ProcessedReport, Report, TeamReport} from '../types';
import {User} from "@/models";
import Signal from "@/lib/Signal";
import {$} from "@/lib/request";
import FrontendTaskProcessor, {createTaskProcessor, ProcessingProgress} from "@/services/frontendTaskProcessor";

/**
 * Frontend-based report processor that handles chunking and async processing on the client side
 * This approach is more reliable than server-side background tasks
 */
export const processFrontendReport = async (
    report: Report,
    user: User,
    progressCallback: (progress: number) => void,
    startDate?: string,
    endDate?: string
): Promise<ProcessedReport> => {
    Signal.trigger("add-process", "Initializing frontend processing...");

    // Extract all SIM serial numbers
    const simSerialNumbers = report.records.map(record => record.simSerialNumber);

    console.log(`Frontend processing: ${simSerialNumbers.length} records`);
    
    // Update initial progress
    progressCallback(5);
    Signal.trigger("add-process", `Processing ${report.records.length} record(s) using frontend chunking...`);

    try {
        // Create task processor with adaptive configuration
        const processor = createTaskProcessor(simSerialNumbers.length, {
            chunkSize: simSerialNumbers.length > 5000 ? 50 : 100,
            concurrency: simSerialNumbers.length > 10000 ? 2 : 3,
            retryAttempts: 3,
            retryDelay: 2000,
            pauseBetweenChunks: simSerialNumbers.length > 5000 ? 800 : 400
        });

        // Track progress mapping
        let lastReportedProgress = 5;
        const maxProgressForSync = 80; // Reserve 80% for sync, 20% for final processing

        // Start processing
        const result = await processor.processSyncOperation(
            simSerialNumbers,
            report.records,
            (progress: ProcessingProgress) => {
                // Map processor progress (0-100%) to our progress (5-80%)
                const mappedProgress = 5 + Math.floor((progress.percentage / 100) * (maxProgressForSync - 5));
                
                if (mappedProgress > lastReportedProgress) {
                    progressCallback(mappedProgress);
                    lastReportedProgress = mappedProgress;
                }

                // Update status message with detailed info
                if (progress.status === 'processing') {
                    const eta = progress.estimatedTimeRemaining 
                        ? ` (ETA: ${Math.round(progress.estimatedTimeRemaining / 1000)}s)`
                        : '';
                    
                    Signal.trigger("add-process", 
                        `Processing chunk ${progress.currentChunk}/${progress.totalChunks} - ` +
                        `${progress.processedRecords}/${progress.totalRecords} records${eta}`
                    );
                }
            }
        );

        // Check if processing completed successfully
        if (result.status !== 'completed') {
            throw new Error(`Processing failed: ${result.errors.join(', ')}`);
        }

        progressCallback(85);
        Signal.trigger("add-process", "Sync completed! Fetching final database records...");

        // Fetch final database records for UI display
        const databaseResponse = await fetchDatabaseRecords(simSerialNumbers);
        const databaseRecords = databaseResponse.databaseRecords;

        progressCallback(90);
        Signal.trigger("add-process", "Building final report...");

        // Create lookup map
        const simDataMap = new Map<string, DatabaseRecord>();
        databaseRecords.forEach(record => {
            simDataMap.set(record.simSerialNumber, record);
        });

        // Process each record for final report
        const processedRecords: ProcessedRecord[] = report.records.map(record => {
            const dbRecord = simDataMap.get(record.simSerialNumber);
            const matched = !!dbRecord;
            const qualitySim = record.quality === "Y";
            
            return {
                ...record,
                matched,
                qualitySim,
                team: dbRecord?.team || 'Unknown',
                uploadedBy: dbRecord?.uploadedBy || 'Unknown',
            };
        });

        progressCallback(95);
        Signal.trigger("add-process", "Generating team reports...");

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

        progressCallback(100);
        Signal.trigger("add-process", "Report processing completed successfully!");

        console.log('Frontend processing completed:', {
            totalRecords: processedRecords.length,
            matchedCount,
            qualityCount,
            unmatchedCount,
            teamCount: teamReports.length
        });

        return {
            rawRecords: processedRecords,
            teamReports,
            matchedCount,
            qualityCount,
            unmatchedCount,
            totalCount: processedRecords.length,
        };

    } catch (error) {
        console.error('Frontend report processing failed:', error);
        Signal.trigger("add-process", `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw new Error(`Frontend report processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Fetch database records after sync completion
 */
async function fetchDatabaseRecords(simSerialNumbers: string[]): Promise<{ databaseRecords: DatabaseRecord[] }> {
    return new Promise((resolve, reject) => {
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
            if (res.ok) {
                resolve(res.data as { databaseRecords: DatabaseRecord[] });
            } else {
                reject(new Error(res.data || 'Failed to fetch database records'));
            }
        }).catch(reject);
    });
}

/**
 * Utility to create a pausable/resumable processor with user controls
 */
export class ControllableReportProcessor {
    private processor?: FrontendTaskProcessor;
    private isProcessing = false;

    async startProcessing(
        report: Report,
        user: User,
        progressCallback: (progress: number) => void,
        onComplete?: (result: ProcessedReport) => void,
        onError?: (error: Error) => void
    ): Promise<void> {
        if (this.isProcessing) {
            throw new Error('Processing already in progress');
        }

        this.isProcessing = true;

        try {
            const result = await processFrontendReport(report, user, progressCallback);
            this.isProcessing = false;
            onComplete?.(result);
        } catch (error) {
            this.isProcessing = false;
            onError?.(error as Error);
            throw error;
        }
    }

    pauseProcessing(): void {
        this.processor?.pause();
    }

    resumeProcessing(): void {
        this.processor?.resume();
    }

    abortProcessing(): void {
        this.processor?.abort();
        this.isProcessing = false;
    }

    getProgress(): ProcessingProgress | null {
        return this.processor?.getProgress() || null;
    }

    isCurrentlyProcessing(): boolean {
        return this.isProcessing;
    }
}

/**
 * Factory function for different processing strategies
 */
export function createReportProcessor(strategy: 'fast' | 'balanced' | 'conservative' = 'balanced') {
    const configs = {
        fast: {
            chunkSize: 150,
            concurrency: 4,
            retryAttempts: 2,
            retryDelay: 1000,
            pauseBetweenChunks: 200
        },
        balanced: {
            chunkSize: 100,
            concurrency: 3,
            retryAttempts: 3,
            retryDelay: 2000,
            pauseBetweenChunks: 500
        },
        conservative: {
            chunkSize: 50,
            concurrency: 2,
            retryAttempts: 4,
            retryDelay: 3000,
            pauseBetweenChunks: 1000
        }
    };

    return (estimatedRecordCount: number) => 
        createTaskProcessor(estimatedRecordCount, configs[strategy]);
}

export default processFrontendReport;