import {chunkArray, Filter, makeResponse, parseDateToYMD} from "@/helper";
import Accounts from "@/lib/accounts";
import {SIMCard, SIMStatus, Team, User} from "@/models";
import {generateTeamReports} from "@/app/dashboard/report/utils/reportGenerator";
import {DateTime} from "luxon";
import simService from "@/services/simService";
import {supabaseAdmin} from "@/lib/supabase/server";
import {admin_id} from "@/services/helper";
import {DatabaseRecord, SafaricomRecord} from "@/app/dashboard/report/types";

// Background task tracking interface
interface SyncTask {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    total: number;
    processed: number;
    startTime: Date;
    endTime?: Date;
    error?: string;
    userId: string;
    metadata?: any;
}

// Database-based task storage service
class TaskStorage {
    private static async createTask(task: SyncTask): Promise<void> {
        const { error } = await supabaseAdmin
            .from('task_status')
            .insert({
                id: task.id,
                user_id: task.userId,
                status: task.status,
                progress: task.progress,
                total_records: task.total,
                processed_records: task.processed,
                start_time: task.startTime.toISOString(),
                end_time: task.endTime?.toISOString(),
                error_message: task.error,
                metadata: task.metadata || {}
            });
        
        if (error) {
            console.error('Error creating task:', error);
            throw new Error(`Failed to create task: ${error.message}`);
        }
    }

    private static async updateTask(taskId: string, updates: Partial<SyncTask>): Promise<void> {
        const updateData: any = {};
        
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.progress !== undefined) updateData.progress = updates.progress;
        if (updates.processed !== undefined) updateData.processed_records = updates.processed;
        if (updates.endTime !== undefined) updateData.end_time = updates.endTime.toISOString();
        if (updates.error !== undefined) updateData.error_message = updates.error;
        if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
        
        const { error } = await supabaseAdmin
            .from('task_status')
            .update(updateData)
            .eq('id', taskId);
        
        if (error) {
            console.error('Error updating task:', error);
            throw new Error(`Failed to update task: ${error.message}`);
        }
    }

    private static async getTask(taskId: string): Promise<SyncTask | null> {
        const { data, error } = await supabaseAdmin
            .from('task_status')
            .select('*')
            .eq('id', taskId)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Error fetching task:', error);
            throw new Error(`Failed to fetch task: ${error.message}`);
        }
        
        return {
            id: data.id,
            status: data.status,
            progress: data.progress,
            total: data.total_records,
            processed: data.processed_records,
            startTime: new Date(data.start_time),
            endTime: data.end_time ? new Date(data.end_time) : undefined,
            error: data.error_message,
            userId: data.user_id,
            metadata: data.metadata
        };
    }

    private static async cleanupOldTasks(): Promise<void> {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 24); // 24 hours ago
        
        const { error } = await supabaseAdmin
            .from('task_status')
            .delete()
            .lt('created_at', cutoffDate.toISOString())
            .in('status', ['completed', 'failed']);
        
        if (error) {
            console.error('Error cleaning up old tasks:', error);
        }
    }

    // Public interface
    static async set(taskId: string, task: SyncTask): Promise<void> {
        await this.createTask(task);
    }

    static async get(taskId: string): Promise<SyncTask | null> {
        return await this.getTask(taskId);
    }

    static async update(taskId: string, updates: Partial<SyncTask>): Promise<void> {
        await this.updateTask(taskId, updates);
    }

    static async delete(taskId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('task_status')
            .delete()
            .eq('id', taskId);
        
        if (error) {
            console.error('Error deleting task:', error);
        }
    }

    static async cleanup(): Promise<void> {
        await this.cleanupOldTasks();
    }
}

class ReportActions {
    static async generate_excel_report(data: any) {
        try {
            // Get the current user
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {startDate, endDate} = data;

            // Fetch SIM cards data with date filters
            const simCards = await ReportActions.fetchSimCards(user, startDate, endDate);

            // Process the data for the report
            const processedReport = await ReportActions.processReportData(simCards, user);
            const cols = [
                {header: 'Serial', key: 'simSerialNumber', width: 25},
                {header: 'Team', key: 'team', width: 25},
                {header: 'Activation Date', key: 'activationDate', width: 18},
                {header: 'Top Up Date', key: 'topUpDate', width: 15},
                {header: 'Top Up Amount', key: 'topUpAmount', width: 15},
                {header: 'Usage', key: 'cumulativeUsage', width: 15},
                {header: 'BA', key: 'ba', width: 15},
                {header: 'Till/Mobigo', key: 'mobigo', width: 15},
                {header: 'Quality', key: 'quality', width: 15},
            ];
            // Generate the Excel report
            const report = await generateTeamReports(processedReport as any,
                    cols
                )
            ;
            return makeResponse({
                ok: true,
                data: {
                    buffer: Buffer.from(report.rawData).toString('base64'),
                    summary: {
                        totalRecords: processedReport.matchedCount,
                        qualityCount: processedReport.qualityCount,
                        teamCount: processedReport.teamReports.length
                    }
                },
                message: "Excel report generated successfully"
            });
        } catch (error) {
            console.error("Error generating Excel report:", error);
            return makeResponse({error: (error as Error).message});
        }
    }

    static async generate_team_excel_report(data: any) {
        try {
            // Get the current user
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {startDate, endDate, teamId, teamName} = data;

            // Fetch SIM cards data with date filters
            const teamSimCards = await ReportActions.fetchSimCards(user, startDate, endDate, [
                ["team_id", teamId]
            ]);

            // Process the data for the report
            const processedReport = await ReportActions.processReportData(teamSimCards, user);
            const cols = [
                {header: 'Serial', key: 'simSerialNumber', width: 25},
                {header: 'Team', key: 'team', width: 25},
                {header: 'Activation Date', key: 'activationDate', width: 18},
                {header: 'Top Up Date', key: 'topUpDate', width: 15},
                {header: 'Top Up Amount', key: 'topUpAmount', width: 15},
                {header: 'Usage', key: 'cumulativeUsage', width: 15},
                {header: 'BA', key: 'ba', width: 15},
                {header: 'Till/Mobigo', key: 'mobigo', width: 15},
                {header: 'Quality', key: 'quality', width: 15},
            ]
            // Generate the Excel report
            const report = await generateTeamReports(processedReport as any, cols);

            return makeResponse({
                ok: true,
                data: {
                    buffer: Buffer.from(report.rawData).toString('base64'),
                    summary: {
                        totalRecords: processedReport.matchedCount,
                        qualityCount: processedReport.qualityCount,
                        teamName: teamName
                    }
                },
                message: `Excel report for team ${teamName} generated successfully`
            });
        } catch (error) {
            console.error("Error generating team Excel report:", error);
            return makeResponse({error: (error as Error).message});
        }
    }

    // Helper method to fetch SIM cards with date filters
    private static async fetchSimCards(user: User, startDate: string, endDate: string, filters: Filter[] = []) {
        const dateStart = DateTime.fromISO(startDate).startOf('day');
        const dateEnd = DateTime.fromISO(endDate).endOf('day');

        // Fetch SIM cards using the simService
        return await new Promise<(SIMCard & { team: Team })[]>((resolve) => {
            const cards: any = [];
            simService.streamChunks<{ team: Team }>(user, (simCards, end) => {
                cards.push(...simCards);
                if (end) {
                    resolve(cards.map((sim: any) => ({
                        simSerialNumber: sim.serial_number,
                        dateId: sim.created_at,
                        topUpAmount: sim.top_up_amount,
                        bundleAmount: '-',
                        bundlePurchaseDate: '-',
                        agentMSISDN: '-',
                        ba: sim.ba_msisdn,
                        //@ts-ignore
                        mobigo: sim.mobigo,
                        team_id: sim.team_id,
                        cumulativeUsage: parseFloat(sim.usage ?? '') || 0,
                        quality: sim.quality === SIMStatus.QUALITY ? 'Y' : 'N',
                    })));
                }
            }, {
                filters: [
                    ["activation_date", "not", "is", null],
                    ["status", SIMStatus.ACTIVATED],
                    ["activation_date", "gte", dateStart.toISO()],
                    ["activation_date", "lte", dateEnd.toISO()],
                    ...filters
                ]
            });
        });
    }

    // Helper method to process report data
    private static async processReportData(simCards: any[], user: User) {
        // Group SIM cards by team
        const teamGroups: { [teamName: string]: { quality: any[]; nonQuality: any[] } } = {};
        const unknownSims: any[] = [];

        // Get all team records for name lookup
        const {data: teams, error} = await supabaseAdmin
            .from('teams')
            .select('*, users!leader_id(*)').eq('admin_id', await admin_id(user));

        // Create a fast lookup map from team ID to name
        const teamMap = new Map<string, string>();
        for (const team of teams ?? []) {
            teamMap.set(team.id, team.name);
        }

        for (const sim of simCards) {
            const teamName = teamMap.get(sim.team_id) || 'Unknown';
            sim.team = teamName;

            if (teamName === 'Unknown') {
                unknownSims.push(sim);
            } else {
                if (!teamGroups[teamName]) {
                    teamGroups[teamName] = {quality: [], nonQuality: []};
                }

                if (sim.quality === SIMStatus.QUALITY) {
                    teamGroups[teamName].quality.push(sim);
                } else {
                    teamGroups[teamName].nonQuality.push(sim);
                }
            }
        }

        // Build the team reports
        const teamReports = Object.entries(teamGroups).map(([teamName, data]) => {
            const qualityCount = data.quality.length;
            const nonQualityCount = data.nonQuality.length;
            const totalCount = qualityCount + nonQualityCount;

            return {
                teamName,
                records: [...data.quality, ...data.nonQuality].filter(r => r.quality == "N"),
                qualityCount,
                matchedCount: totalCount
            };
        });

        // Add unknown team report
        if (unknownSims.length > 0) {
            teamReports.push({
                teamName: 'Unknown',
                records: unknownSims,
                qualityCount: 0,
                matchedCount: unknownSims.length
            });
        }

        // Calculate totals
        const totalQualityCount = teamReports.reduce((sum, team) => sum + team.qualityCount, 0);
        const totalMatchedCount = teamReports.reduce((sum, team) => sum + team.matchedCount, 0);

        return {
            rawRecords: simCards,
            teamReports,
            qualityCount: totalQualityCount,
            matchedCount: totalMatchedCount
        };
    }

    // Start streaming sync task (fetch-process-fetch pattern) with chunked processing
    private static async sync(data: { simSerialNumbers: string[], records: SafaricomRecord[] }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { simSerialNumbers, records } = data;
            
            // Limit payload size for Vercel constraints - smaller batches for better timeout handling
            const MAX_RECORDS_PER_BATCH = 2000; // Reduced for Vercel timeouts
            if (records.length > MAX_RECORDS_PER_BATCH) {
                // Auto-chunk large datasets into multiple tasks
                const chunks = [];
                for (let i = 0; i < records.length; i += MAX_RECORDS_PER_BATCH) {
                    chunks.push({
                        records: records.slice(i, i + MAX_RECORDS_PER_BATCH),
                        serials: simSerialNumbers.slice(i, i + MAX_RECORDS_PER_BATCH)
                    });
                }
                
                const parentTaskId = `sync_parent_${Date.now()}_${user.id}`;
                const childTaskIds: string[] = [];
                
                // Create parent task to track overall progress
                const parentTask: SyncTask = {
                    id: parentTaskId,
                    status: 'running',
                    progress: 0,
                    total: simSerialNumbers.length,
                    processed: 0,
                    startTime: new Date(),
                    userId: user.id,
                    metadata: {
                        type: 'parent_task',
                        totalChunks: chunks.length,
                        childTasks: childTaskIds
                    }
                };
                
                await TaskStorage.set(parentTaskId, parentTask);
                
                // Create and start child tasks
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    const childTaskId = `sync_child_${i}_${Date.now()}_${user.id}`;
                    childTaskIds.push(childTaskId);
                    
                    const childTask: SyncTask = {
                        id: childTaskId,
                        status: 'pending',
                        progress: 0,
                        total: chunk.serials.length,
                        processed: 0,
                        startTime: new Date(),
                        userId: user.id,
                        metadata: {
                            parentTaskId: parentTaskId,
                            chunkIndex: i,
                            totalChunks: chunks.length
                        }
                    };
                    
                    await TaskStorage.set(childTaskId, childTask);
                    
                    // Start child task with delay to spread load
                    setTimeout(() => {
                        ReportActions.performStreamingSync(childTaskId, chunk.serials, chunk.records, user)
                            .catch(async error => {
                                console.error(`Child sync ${childTaskId} failed:`, error);
                                await TaskStorage.update(childTaskId, {
                                    status: 'failed',
                                    error: error.message,
                                    endTime: new Date()
                                });
                            });
                    }, i * 2000); // 2 second delay between starts
                }
                
                // Update parent task with child task IDs
                await TaskStorage.update(parentTaskId, {
                    metadata: {
                        ...parentTask.metadata,
                        childTasks: childTaskIds
                    }
                });
                
                return makeResponse({ 
                    ok: true, 
                    data: { 
                        taskId: parentTaskId,
                        chunked: true,
                        totalChunks: chunks.length,
                        childTasks: childTaskIds
                    },
                    message: `Large dataset chunked into ${chunks.length} tasks` 
                });
            }
            
            // Generate unique task ID
            const taskId = `sync_${Date.now()}_${user.id}`;
            
            // Create task record
            const task: SyncTask = {
                id: taskId,
                status: 'pending',
                progress: 0,
                total: simSerialNumbers.length,
                processed: 0,
                startTime: new Date(),
                userId: user.id,
                metadata: {
                    recordCount: Math.min(records.length, MAX_RECORDS_PER_BATCH),
                    serialNumberCount: simSerialNumbers.length
                }
            };
            
            await TaskStorage.set(taskId, task);

            // Start streaming background process (don't await)
            ReportActions.performStreamingSync(taskId, simSerialNumbers, records, user)
                .catch(async error => {
                    console.error('Background sync failed:', error);
                    await TaskStorage.update(taskId, {
                        status: 'failed',
                        error: error.message,
                        endTime: new Date()
                    });
                });

            // Return task ID immediately
            return makeResponse({ 
                ok: true, 
                data: { taskId },
                message: "Streaming sync started" 
            });

        } catch (e) {
            console.error("Sync initiation error:", e);
            return makeResponse({error: (e as Error).message});
        }
    }

    // Optimized streaming sync worker (fetch-process-fetch pattern)
    private static async performStreamingSync(
        taskId: string, 
        simSerialNumbers: string[], 
        records: SafaricomRecord[], 
        user: User
    ) {
        const task = await TaskStorage.get(taskId);
        if (!task) return;

        // Vercel timeout handling
        const startTime = Date.now();
        const VERCEL_TIMEOUT_BUFFER = 10000; // 10 second buffer
        const MAX_EXECUTION_TIME = process.env.VERCEL_FUNCTION_TIMEOUT ? 
            (parseInt(process.env.VERCEL_FUNCTION_TIMEOUT) * 1000 - VERCEL_TIMEOUT_BUFFER) : 
            50000; // Default 50 seconds for hobby plan with buffer
        
        const isTimeoutApproaching = () => {
            return (Date.now() - startTime) > MAX_EXECUTION_TIME;
        };

        try {
            await TaskStorage.update(taskId, { status: 'running' });
            
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

            // Create records map for fast lookup
            const recordMap = new Map(
                records.filter(r => r.simSerialNumber).map(r => [r.simSerialNumber, r])
            );

            // Conservative settings for Vercel timeout constraints
            const fetchBatchSize = 500; // Smaller fetch batches for faster processing
            const processBatchSize = 50; // Smaller process batches
            const processChunkSize = 5; // Fewer concurrent operations
            const semaphore = new Semaphore(4); // Fewer concurrent database operations

            let totalProcessed = 0;
            const totalSerials = simSerialNumbers.length;
            const batches = chunkArray(simSerialNumbers, fetchBatchSize);

            console.log(`Starting streaming sync for ${totalSerials} records in ${batches.length} fetch batches`);

            // Process each fetch batch with timeout checking
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                // Check timeout before processing each batch
                if (isTimeoutApproaching()) {
                    console.log(`Timeout approaching, stopping at batch ${batchIndex}/${batches.length}`);
                    
                    // Save progress and create continuation task
                    const remainingSerials = simSerialNumbers.slice(batchIndex * fetchBatchSize);
                    const remainingRecords = records.filter(r => 
                        remainingSerials.includes(r.simSerialNumber)
                    );
                    
                    if (remainingSerials.length > 0) {
                        // Create continuation task
                        const continuationTaskId = `sync_cont_${Date.now()}_${user.id}`;
                        const continuationTask: SyncTask = {
                            id: continuationTaskId,
                            status: 'pending',
                            progress: 0,
                            total: remainingSerials.length,
                            processed: 0,
                            startTime: new Date(),
                            userId: user.id,
                            metadata: {
                                ...task.metadata,
                                continuationOf: taskId,
                                batchStartIndex: batchIndex
                            }
                        };
                        
                        await TaskStorage.set(continuationTaskId, continuationTask);
                        
                        // Start continuation task asynchronously
                        setTimeout(() => {
                            ReportActions.performStreamingSync(continuationTaskId, remainingSerials, remainingRecords, user)
                                .catch(async error => {
                                    console.error('Continuation sync failed:', error);
                                    await TaskStorage.update(continuationTaskId, {
                                        status: 'failed',
                                        error: error.message,
                                        endTime: new Date()
                                    });
                                });
                        }, 1000); // Small delay to ensure current function can complete
                        
                        // Update current task as partially completed
                        await TaskStorage.update(taskId, {
                            status: 'completed',
                            progress: Math.floor((totalProcessed / task.total) * 100),
                            endTime: new Date(),
                            metadata: {
                                ...task.metadata,
                                continuedBy: continuationTaskId,
                                partialCompletion: true
                            }
                        });
                        
                        return; // Exit current execution
                    }
                }
                
                const serialBatch = batches[batchIndex];
                
                console.log(`Processing fetch batch ${batchIndex + 1}/${batches.length} (${serialBatch.length} serials)`);

                // STEP 1: Fetch database records for this batch
                let databaseRecords: DatabaseRecord[] = [];
                try {
                    const {data, error} = await simService.getSimCardsBySerialBatch(user, serialBatch,supabaseAdmin);
                    if (error || !data) {
                        console.warn(`Fetch batch ${batchIndex} failed:`, error);
                        totalProcessed += serialBatch.length;
                        continue;
                    }

                    const simData = data as any[];
                    databaseRecords = simData.map((sim) => ({
                        simSerialNumber: sim.serial_number,
                        simId: sim.id,
                        team: sim.team_id.name,
                        uploadedBy: sim?.assigned_to_user_id?.full_name ?? "Not assigned",
                        createdAt: new Date(sim.created_at).toISOString(),
                    }));

                    console.log(`Fetched ${databaseRecords.length} database records for batch ${batchIndex + 1}`);
                } catch (error) {
                    console.error(`Error fetching batch ${batchIndex}:`, error);
                    totalProcessed += serialBatch.length;
                    continue;
                }

                // STEP 2: Process the fetched records immediately in smaller batches
                const processBatches = chunkArray(databaseRecords, processBatchSize);
                
                for (const processBatch of processBatches) {
                    const processChunks = chunkArray(processBatch, processChunkSize);
                    
                    for (const chunk of processChunks) {
                        await Promise.allSettled(chunk.map(async (record) => {
                            return semaphore.execute(async () => {
                                const sourceRecord = recordMap.get(record.simSerialNumber);
                                if (!sourceRecord) {
                                    return;
                                }

                                try {
                                    const isQuality = sourceRecord.quality == "Y";
                                    const qualityStatus = isQuality ? SIMStatus.QUALITY : SIMStatus.NONQUALITY;

                                    const simId = record.simId;

                                    // Optimized database operations with retry
                                    let retries = 2; // Reduced retries for speed
                                    let existingSim;
                                    let error;

                                    while (retries > 0) {
                                        const result = await simService.DB
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
                                            await sleep(500); // Shorter backoff for streaming
                                        }
                                    }

                                    if (error || !existingSim) {
                                        console.warn(`Failed to fetch SIM ${simId}:`, error);
                                        return;
                                    }

                                    const updateFields: any = {
                                        match: SIMStatus.MATCH,
                                        quality: qualityStatus,
                                        top_up_amount: +sourceRecord.topUpAmount || null,
                                        usage: +sourceRecord.cumulativeUsage || null
                                    };

                                    const parsedDate = parseDateToYMD(sourceRecord.dateId);

                                    if (!existingSim.activation_date) {
                                        updateFields.activation_date = parsedDate;
                                    }

                                    if (!existingSim.registered_on) {
                                        const date = new Date(sourceRecord.tmDate);
                                        updateFields.registered_on = date.toISOString().split('T')[0];
                                    }

                                    if (existingSim.status !== SIMStatus.ACTIVATED) {
                                        updateFields.status = SIMStatus.ACTIVATED;
                                    }

                                    if (Object.keys(updateFields).length > 0) {
                                        retries = 2;
                                        while (retries > 0) {
                                            try {
                                                await simService.updateSIMCard(simId, updateFields, user);
                                                break;
                                            } catch (updateError) {
                                                retries--;
                                                if (retries > 0) {
                                                    await sleep(500);
                                                } else {
                                                    console.error(`Failed to update SIM ${simId}:`, updateError);
                                                }
                                            }
                                        }
                                    }

                                } catch (err) {
                                    console.error(`Error processing record ${record.simSerialNumber}:`, err);
                                }
                            });
                        }));

                        // Very short delay between chunks for optimal throughput
                        await sleep(50);
                    }

                    // Update progress after each process batch
                    totalProcessed += processBatch.length;
                    const progress = Math.floor((totalProcessed / task.total) * 100);
                    await TaskStorage.update(taskId, {
                        processed: totalProcessed,
                        progress: progress
                    });
                }

                // Handle unmatched serials from this fetch batch
                const matchedSerials = new Set(databaseRecords.map(r => r.simSerialNumber));
                const unmatchedCount = serialBatch.filter(serial => !matchedSerials.has(serial)).length;
                if (unmatchedCount > 0) {
                    totalProcessed += unmatchedCount;
                    const progress = Math.floor((totalProcessed / task.total) * 100);
                    await TaskStorage.update(taskId, {
                        processed: totalProcessed,
                        progress: progress
                    });
                }

                const currentTask = await TaskStorage.get(taskId);
                console.log(`Completed batch ${batchIndex + 1}/${batches.length}. Progress: ${currentTask?.progress || 0}%`);

                // Short delay between fetch batches to prevent overwhelming the database
                // Also check timeout before continuing
                if (batchIndex < batches.length - 1) {
                    await sleep(200);
                    
                    if (isTimeoutApproaching()) {
                        console.log(`Timeout approaching after batch ${batchIndex + 1}, will check before next batch`);
                    }
                }
            }

            // Mark task as completed
            await TaskStorage.update(taskId, {
                status: 'completed',
                endTime: new Date(),
                progress: 100
            });

            console.log(`Streaming sync task ${taskId} completed successfully. Processed ${totalProcessed} records.`);
            
            // Update parent task if this is a child task
            await ReportActions.updateParentTaskProgress(taskId);

        } catch (error) {
            console.error(`Streaming sync ${taskId} failed:`, error);
            await TaskStorage.update(taskId, {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                endTime: new Date()
            });
            
            // Update parent task if this is a child task
            await ReportActions.updateParentTaskProgress(taskId);
        }
    }

    // Helper method to update parent task progress when child tasks complete
    private static async updateParentTaskProgress(childTaskId: string) {
        try {
            const childTask = await TaskStorage.get(childTaskId);
            if (!childTask?.metadata?.parentTaskId) {
                return; // Not a child task
            }
            
            const parentTaskId = childTask.metadata.parentTaskId;
            const parentTask = await TaskStorage.get(parentTaskId);
            if (!parentTask) {
                return;
            }
            
            const childTaskIds = parentTask.metadata?.childTasks || [];
            
            // Get status of all child tasks
            const childTasks = await Promise.all(
                childTaskIds.map(async (id: string) => await TaskStorage.get(id))
            );
            
            const validChildTasks = childTasks.filter(task => task !== null);
            const completedTasks = validChildTasks.filter(task => task!.status === 'completed');
            const failedTasks = validChildTasks.filter(task => task!.status === 'failed');
            const totalProcessed = validChildTasks.reduce((sum, task) => sum + (task!.processed || 0), 0);
            
            // Calculate parent progress
            const parentProgress = Math.floor((totalProcessed / parentTask.total) * 100);
            
            // Determine parent status
            let parentStatus: 'pending' | 'running' | 'completed' | 'failed' = 'running';
            if (completedTasks.length === validChildTasks.length) {
                parentStatus = 'completed';
            } else if (failedTasks.length > 0 && (completedTasks.length + failedTasks.length) === validChildTasks.length) {
                parentStatus = 'failed';
            }
            
            // Update parent task
            await TaskStorage.update(parentTaskId, {
                progress: parentProgress,
                processed: totalProcessed,
                status: parentStatus,
                endTime: parentStatus === 'completed' || parentStatus === 'failed' ? new Date() : undefined,
                error: failedTasks.length > 0 ? `${failedTasks.length} child tasks failed` : undefined
            });
            
        } catch (error) {
            console.error('Error updating parent task progress:', error);
        }
    }

    // Legacy background sync worker (kept for compatibility)
    private static async performBackgroundSync(
        taskId: string, 
        databaseRecords: DatabaseRecord[], 
        records: SafaricomRecord[], 
        user: User
    ) {
        const task = await TaskStorage.get(taskId);
        if (!task) return;

        try {
            await TaskStorage.update(taskId, { status: 'running' });
            
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

            const recordMap = new Map(
                records.filter(r => r.simSerialNumber).map(r => [r.simSerialNumber, r])
            );

            // Conservative settings for large datasets
            const semaphore = new Semaphore(5); // Reduce to 5 concurrent requests
            const batchSize = 50; // Smaller batches for better memory management
            const batches = chunkArray(databaseRecords, batchSize);

            let processedCount = 0;

            // Process batches sequentially to avoid overwhelming resources
            for (const batch of batches) {
                // Process records in smaller chunks with controlled concurrency
                const chunkSize = 25; // Further reduce chunk size
                const chunks = chunkArray(batch, chunkSize);

                for (const chunk of chunks) {
                    await Promise.allSettled(chunk.map(async (record) => {
                        return semaphore.execute(async () => {
                            const sourceRecord = recordMap.get(record.simSerialNumber);
                            if (!sourceRecord) {
                                processedCount++;
                                await TaskStorage.update(taskId, {
                                    processed: processedCount,
                                    progress: Math.floor((processedCount / task.total) * 100)
                                });
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
                                    const result = await simService.DB
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
                                        await sleep(2000 * (4 - retries)); // Longer backoff for stability
                                    }
                                }

                                if (error || !existingSim) {
                                    console.warn(`Failed to fetch SIM ${simId} after retries:`, error);
                                    processedCount++;
                                    await TaskStorage.update(taskId, {
                                        processed: processedCount,
                                        progress: Math.floor((processedCount / task.total) * 100)
                                    });
                                    return;
                                }

                                const updateFields: any = {
                                    match: SIMStatus.MATCH,
                                    quality: qualityStatus,
                                    top_up_amount: +sourceRecord.topUpAmount || null,
                                    usage: +sourceRecord.cumulativeUsage || null
                                };

                                const parsedDate = parseDateToYMD(sourceRecord.dateId);

                                if (!existingSim.activation_date) {
                                    updateFields.activation_date = parsedDate;
                                }

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
                                                await sleep(2000 * (4 - retries));
                                            } else {
                                                console.error(`Failed to update SIM ${simId}:`, updateError);
                                            }
                                        }
                                    }
                                }

                            } catch (err) {
                                console.error(`Error processing record ${record.simSerialNumber}:`, err);
                            } finally {
                                processedCount++;
                                await TaskStorage.update(taskId, {
                                    processed: processedCount,
                                    progress: Math.floor((processedCount / task.total) * 100)
                                });
                            }
                        });
                    }));

                    // Longer delay between chunks for stability
                    await sleep(500);
                }

                // Longer pause between batches for large datasets
                await sleep(1000);
            }

            // Mark task as completed
            await TaskStorage.update(taskId, {
                status: 'completed',
                endTime: new Date(),
                progress: 100
            });

            console.log(`Sync task ${taskId} completed successfully. Processed ${processedCount} records.`);

        } catch (error) {
            console.error(`Background sync ${taskId} failed:`, error);
            await TaskStorage.update(taskId, {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                endTime: new Date()
            });
        }
    }

    // Get task status
    private static async sync_status(data: { taskId: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { taskId } = data;
            const task = await TaskStorage.get(taskId);
            
            if (!task) {
                return makeResponse({ error: "Task not found" });
            }

            // Check if task belongs to user
            if (task.userId !== user.id) {
                return makeResponse({ error: "Unauthorized access to task" });
            }

            // If this is a parent task, also include child task statuses
            let childTaskStatuses = [];
            if (task.metadata?.type === 'parent_task' && task.metadata?.childTasks) {
                const childTasks = await Promise.all(
                    task.metadata.childTasks.map(async (childId: string) => {
                        const childTask = await TaskStorage.get(childId);
                        return childTask ? {
                            id: childTask.id,
                            status: childTask.status,
                            progress: childTask.progress,
                            processed: childTask.processed,
                            total: childTask.total,
                            error: childTask.error
                        } : null;
                    })
                );
                childTaskStatuses = childTasks.filter(task => task !== null);
            }

            return makeResponse({ 
                ok: true, 
                data: {
                    id: task.id,
                    status: task.status,
                    progress: task.progress,
                    processed: task.processed,
                    total: task.total,
                    startTime: task.startTime,
                    endTime: task.endTime,
                    error: task.error,
                    metadata: task.metadata,
                    childTasks: childTaskStatuses
                }
            });

        } catch (e) {
            console.error("Task status error:", e);
            return makeResponse({error: (e as Error).message});
        }
    }

    // Fetch SIM card data from database server-side
    private static async fetch_database_records(data: { simSerialNumbers: string[] }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { simSerialNumbers } = data;
            const batchSize = 500; // Reduced batch size
            const results: DatabaseRecord[] = [];
            const totalBatches = Math.ceil(simSerialNumbers.length / batchSize);

            // Rate limiting utility
            const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            for (let i = 0; i < simSerialNumbers.length; i += batchSize) {
                const batchIndex = Math.floor(i / batchSize);
                const batch = simSerialNumbers.slice(i, i + batchSize);

                try {
                    const {data, error} = await simService.getSimCardsBySerialBatch(user, batch,supabaseAdmin);
                    if (error || !data) {
                        console.warn(`Batch ${batchIndex} failed:`, error);
                        continue;
                    }
                    const simData = data as any[];
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

            return makeResponse({ 
                ok: true, 
                data: { databaseRecords: results },
                message: "Database records fetched successfully" 
            });

        } catch (e) {
            console.error("Database fetch error:", e);
            return makeResponse({error: (e as Error).message});
        }
    }

    // Clean up completed tasks (call periodically)
    private static async cleanup_tasks() {
        try {
            await TaskStorage.cleanup();
            return makeResponse({ ok: true, message: "Cleanup completed" });
        } catch (e) {
            return makeResponse({error: (e as Error).message});
        }
    }

    // Generate Excel report with chunked processing for large datasets
    static async generate_chunked_excel_report(data: any) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {startDate, endDate, chunkSize = 1000} = data;
            
            // Validate chunk size
            const maxChunkSize = 2000;
            const actualChunkSize = Math.min(chunkSize, maxChunkSize);

            // Fetch SIM cards data with date filters in chunks
            const simCards = await ReportActions.fetchSimCards(user, startDate, endDate);
            
            if (simCards.length > actualChunkSize) {
                // Process in chunks and return task ID for streaming
                const taskId = `report_${Date.now()}_${user.id}`;
                
                // Start background processing
                ReportActions.processLargeReportBackground(taskId, simCards, user)
                    .catch(error => {
                        console.error('Background report generation failed:', error);
                    });
                
                return makeResponse({
                    ok: true,
                    data: { 
                        taskId,
                        totalRecords: simCards.length,
                        chunked: true 
                    },
                    message: "Large report processing started in background"
                });
            } else {
                // Process normally for small datasets
                const processedReport = await ReportActions.processReportData(simCards, user);
                const cols = [
                    {header: 'Serial', key: 'simSerialNumber', width: 25},
                    {header: 'Team', key: 'team', width: 25},
                    {header: 'Activation Date', key: 'activationDate', width: 18},
                    {header: 'Top Up Date', key: 'topUpDate', width: 15},
                    {header: 'Top Up Amount', key: 'topUpAmount', width: 15},
                    {header: 'Usage', key: 'cumulativeUsage', width: 15},
                    {header: 'BA', key: 'ba', width: 15},
                    {header: 'Till/Mobigo', key: 'mobigo', width: 15},
                    {header: 'Quality', key: 'quality', width: 15},
                ];
                
                const report = await generateTeamReports(processedReport as any, cols);
                
                return makeResponse({
                    ok: true,
                    data: {
                        buffer: Buffer.from(report.rawData).toString('base64'),
                        summary: {
                            totalRecords: processedReport.matchedCount,
                            qualityCount: processedReport.qualityCount,
                            teamCount: processedReport.teamReports.length
                        }
                    },
                    message: "Excel report generated successfully"
                });
            }
        } catch (error) {
            console.error("Error generating chunked Excel report:", error);
            return makeResponse({error: (error as Error).message});
        }
    }

    // Background processing for large reports
    private static async processLargeReportBackground(taskId: string, simCards: any[], user: User) {
        const task: SyncTask = {
            id: taskId,
            status: 'running',
            progress: 0,
            total: simCards.length,
            processed: 0,
            startTime: new Date(),
            userId: user.id,
            metadata: { type: 'report_generation' }
        };
        
        await TaskStorage.set(taskId, task);
        
        try {
            // Process data
            const processedReport = await ReportActions.processReportData(simCards, user);
            await TaskStorage.update(taskId, { progress: 80 });
            
            // Generate report
            const cols = [
                {header: 'Serial', key: 'simSerialNumber', width: 25},
                {header: 'Team', key: 'team', width: 25},
                {header: 'Activation Date', key: 'activationDate', width: 18},
                {header: 'Top Up Date', key: 'topUpDate', width: 15},
                {header: 'Top Up Amount', key: 'topUpAmount', width: 15},
                {header: 'Usage', key: 'cumulativeUsage', width: 15},
                {header: 'BA', key: 'ba', width: 15},
                {header: 'Till/Mobigo', key: 'mobigo', width: 15},
                {header: 'Quality', key: 'quality', width: 15},
            ];
            
            const report = await generateTeamReports(processedReport as any, cols);
            
            // Store result in task metadata
            const resultMetadata = {
                ...task.metadata,
                result: {
                    buffer: Buffer.from(report.rawData).toString('base64'),
                    summary: {
                        totalRecords: processedReport.matchedCount,
                        qualityCount: processedReport.qualityCount,
                        teamCount: processedReport.teamReports.length
                    }
                }
            };
            
            await TaskStorage.update(taskId, {
                status: 'completed',
                progress: 100,
                endTime: new Date(),
                metadata: resultMetadata
            });
            
        } catch (error) {
            await TaskStorage.update(taskId, {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                endTime: new Date()
            });
        }
    }


    static async builder(target: string, data: any) {
        try {
            const action = (ReportActions as any)[target];
            if (typeof action === 'function') {
                return await action(data);
            } else {
                throw new Error(`Action '${target}' is not a function`);
            }
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }
}

export default ReportActions;