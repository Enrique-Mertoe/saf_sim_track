import {chunkArray, Filter, makeResponse, parseDateToYMD} from "@/helper";
import Accounts from "@/lib/accounts";
import {SIMCard, SIMStatus, Team, User} from "@/models";
import {generateTeamReports} from "@/app/dashboard/report/utils/reportGenerator";
import {DateTime} from "luxon";
import simService from "@/services/simService";
import {supabaseAdmin} from "@/lib/supabase/server";
import {admin_id} from "@/services/helper";
import {DatabaseRecord, SafaricomRecord} from "@/app/dashboard/report/types";

// Background task tracking
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

// In-memory task storage (in production, use Redis or database)
const activeTasks = new Map<string, SyncTask>();

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
                    raw: {
                        data: processedReport,
                        cols
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
                    raw: {
                        data: processedReport,
                        cols
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

    // Start streaming sync task (fetch-process-fetch pattern)
    private static async sync(data: { simSerialNumbers: string[], records: SafaricomRecord[] }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({ error: "User not authenticated" });
            }

            const { simSerialNumbers, records } = data;
            
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
                    recordCount: records.length,
                    serialNumberCount: simSerialNumbers.length
                }
            };
            
            activeTasks.set(taskId, task);

            // Start streaming background process (don't await)
            ReportActions.performStreamingSync(taskId, simSerialNumbers, records, user)
                .catch(error => {
                    console.error('Background sync failed:', error);
                    const task = activeTasks.get(taskId);
                    if (task) {
                        task.status = 'failed';
                        task.error = error.message;
                        task.endTime = new Date();
                    }
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
        const task = activeTasks.get(taskId);
        if (!task) return;

        try {
            task.status = 'running';
            
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

            // Optimized settings for streaming processing
            const fetchBatchSize = 1000; // Fetch 1000 at a time
            const processBatchSize = 100; // Process 100 at a time
            const processChunkSize = 10; // Process 10 concurrently
            const semaphore = new Semaphore(8); // 8 concurrent database operations

            let totalProcessed = 0;
            const totalSerials = simSerialNumbers.length;
            const batches = chunkArray(simSerialNumbers, fetchBatchSize);

            console.log(`Starting streaming sync for ${totalSerials} records in ${batches.length} fetch batches`);

            // Process each fetch batch
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const serialBatch = batches[batchIndex];
                
                console.log(`Processing fetch batch ${batchIndex + 1}/${batches.length} (${serialBatch.length} serials)`);

                // STEP 1: Fetch database records for this batch
                let databaseRecords: DatabaseRecord[] = [];
                try {
                    const {data, error} = await simService.getSimCardsBySerialBatch(user, serialBatch);
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
                    task.processed = totalProcessed;
                    task.progress = Math.floor((totalProcessed / task.total) * 100);
                }

                // Handle unmatched serials from this fetch batch
                const matchedSerials = new Set(databaseRecords.map(r => r.simSerialNumber));
                const unmatchedCount = serialBatch.filter(serial => !matchedSerials.has(serial)).length;
                if (unmatchedCount > 0) {
                    totalProcessed += unmatchedCount;
                    task.processed = totalProcessed;
                    task.progress = Math.floor((totalProcessed / task.total) * 100);
                }

                console.log(`Completed batch ${batchIndex + 1}/${batches.length}. Progress: ${task.progress}%`);

                // Short delay between fetch batches to prevent overwhelming the database
                if (batchIndex < batches.length - 1) {
                    await sleep(200);
                }
            }

            // Mark task as completed
            task.status = 'completed';
            task.endTime = new Date();
            task.progress = 100;

            console.log(`Streaming sync task ${taskId} completed successfully. Processed ${totalProcessed} records.`);

        } catch (error) {
            console.error(`Streaming sync ${taskId} failed:`, error);
            task.status = 'failed';
            task.error = error instanceof Error ? error.message : 'Unknown error';
            task.endTime = new Date();
        }
    }

    // Legacy background sync worker (kept for compatibility)
    private static async performBackgroundSync(
        taskId: string, 
        databaseRecords: DatabaseRecord[], 
        records: SafaricomRecord[], 
        user: User
    ) {
        const task = activeTasks.get(taskId);
        if (!task) return;

        try {
            task.status = 'running';
            
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
                                task.processed = processedCount;
                                task.progress = Math.floor((processedCount / task.total) * 100);
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
                                    task.processed = processedCount;
                                    task.progress = Math.floor((processedCount / task.total) * 100);
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
                                task.processed = processedCount;
                                task.progress = Math.floor((processedCount / task.total) * 100);
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
            task.status = 'completed';
            task.endTime = new Date();
            task.progress = 100;

            console.log(`Sync task ${taskId} completed successfully. Processed ${processedCount} records.`);

        } catch (error) {
            console.error(`Background sync ${taskId} failed:`, error);
            task.status = 'failed';
            task.error = error instanceof Error ? error.message : 'Unknown error';
            task.endTime = new Date();
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
            const task = activeTasks.get(taskId);
            
            if (!task) {
                return makeResponse({ error: "Task not found" });
            }

            // Check if task belongs to user
            if (task.userId !== user.id) {
                return makeResponse({ error: "Unauthorized access to task" });
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
                    metadata: task.metadata
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
            const now = new Date();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            for (const [taskId, task] of activeTasks.entries()) {
                if (task.endTime && (now.getTime() - task.endTime.getTime()) > maxAge) {
                    activeTasks.delete(taskId);
                }
            }

            return makeResponse({ ok: true, message: "Cleanup completed" });
        } catch (e) {
            return makeResponse({error: (e as Error).message});
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