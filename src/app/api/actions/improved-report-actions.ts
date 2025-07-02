import {chunkArray, Filter, makeResponse, parseDateToYMD} from "@/helper";
import Accounts from "@/lib/accounts";
import {SIMCard, SIMStatus, Team, User} from "@/models";
import {generateTeamReports} from "@/app/dashboard/report/utils/reportGenerator";
import {DateTime} from "luxon";
import simService from "@/services/simService";
import {supabaseAdmin} from "@/lib/supabase/server";
import {admin_id} from "@/services/helper";
import {DatabaseRecord, SafaricomRecord} from "@/app/dashboard/report/types";

// 1. Unified Configuration System
interface TaskConfig {
  processing: {
    batchSize: number;
    chunkSize: number;
    maxConcurrency: number;
    retryAttempts: number;
    backoffMultiplier: number;
  };
  timeouts: {
    maxExecutionTime: number;
    bufferTime: number;
    checkInterval: number;
  };
  storage: {
    cleanupInterval: number;
    maxTaskAge: number;
  };
}

const DEFAULT_CONFIG: TaskConfig = {
  processing: {
    batchSize: 500,
    chunkSize: 50,
    maxConcurrency: 5,
    retryAttempts: 3,
    backoffMultiplier: 2
  },
  timeouts: {
    maxExecutionTime: 105000, // 105 seconds
    bufferTime: 15000, // 15 second buffer
    checkInterval: 5000 // 5 second checks
  },
  storage: {
    cleanupInterval: 3600000, // 1 hour
    maxTaskAge: 86400000 // 24 hours
  }
};

// 2. Enhanced Task Interface with Better Typing
interface TaskMetrics {
  startTime: Date;
  endTime?: Date;
  processingTime?: number;
  recordsPerSecond?: number;
  memoryUsageMB?: number;
  errorCount: number;
}

interface EnhancedTask {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total: number;
  processed: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  userId: string;
  priority: 'low' | 'normal' | 'high';
  metrics: TaskMetrics;
  dependencies?: string[];
  continuationOf?: string;
  children?: string[];
  metadata: any;
}

// 3. Enhanced Task Storage with Better Error Handling
class EnhancedTaskStorage {
  private static async createTask(task: EnhancedTask): Promise<void> {
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
        metadata: {
          ...task.metadata,
          priority: task.priority,
          metrics: task.metrics,
          dependencies: task.dependencies,
          continuationOf: task.continuationOf,
          children: task.children
        }
      });
    
    if (error) {
      console.error('Error creating enhanced task:', error);
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  private static async updateTask(taskId: string, updates: Partial<EnhancedTask>): Promise<void> {
    const updateData: any = {};
    
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.processed !== undefined) updateData.processed_records = updates.processed;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime.toISOString();
    if (updates.error !== undefined) updateData.error_message = updates.error;
    
    if (updates.metadata !== undefined || updates.priority !== undefined || 
        updates.metrics !== undefined || updates.dependencies !== undefined ||
        updates.children !== undefined) {
      // Get current task to merge metadata
      const currentTask = await this.getTask(taskId);
      if (currentTask) {
        updateData.metadata = {
          ...currentTask.metadata,
          ...updates.metadata,
          priority: updates.priority || currentTask.priority,
          metrics: updates.metrics || currentTask.metrics,
          dependencies: updates.dependencies || currentTask.dependencies,
          children: updates.children || currentTask.children
        };
      }
    }
    
    const { error } = await supabaseAdmin
      .from('task_status')
      .update(updateData)
      .eq('id', taskId);
    
    if (error) {
      console.error('Error updating enhanced task:', error);
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  private static async getTask(taskId: string): Promise<EnhancedTask | null> {
    const { data, error } = await supabaseAdmin
      .from('task_status')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching enhanced task:', error);
      throw new Error(`Failed to fetch task: ${error.message}`);
    }
    
    const metadata = data.metadata || {};
    
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
      priority: metadata.priority || 'normal',
      metrics: metadata.metrics || {
        startTime: new Date(data.start_time),
        errorCount: 0
      },
      dependencies: metadata.dependencies,
      continuationOf: metadata.continuationOf,
      children: metadata.children,
      metadata: metadata
    };
  }

  static async set(taskId: string, task: EnhancedTask): Promise<void> {
    await this.createTask(task);
  }

  static async get(taskId: string): Promise<EnhancedTask | null> {
    return await this.getTask(taskId);
  }

  static async update(taskId: string, updates: Partial<EnhancedTask>): Promise<void> {
    await this.updateTask(taskId, updates);
  }

  static async delete(taskId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('task_status')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      console.error('Error deleting enhanced task:', error);
    }
  }

  static async cleanup(): Promise<void> {
    const completedCutoff = new Date();
    completedCutoff.setHours(completedCutoff.getHours() - 1);
    
    const failedCutoff = new Date();
    failedCutoff.setHours(failedCutoff.getHours() - 24);
    
    const stuckCutoff = new Date();
    stuckCutoff.setHours(stuckCutoff.getHours() - 2);
    
    // Cleanup in parallel for better performance
    await Promise.allSettled([
      supabaseAdmin.from('task_status').delete()
        .lt('created_at', completedCutoff.toISOString())
        .eq('status', 'completed'),
      supabaseAdmin.from('task_status').delete()
        .lt('created_at', failedCutoff.toISOString())
        .eq('status', 'failed'),
      supabaseAdmin.from('task_status').delete()
        .lt('created_at', stuckCutoff.toISOString())
        .in('status', ['pending', 'running'])
    ]);
  }
}

// 4. Enhanced Semaphore with Priority Support
class PrioritySemaphore {
  private permits: number;
  private waiting: Array<{
    resolve: () => void;
    priority: number;
  }> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(priority: number = 0): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>(resolve => {
      this.waiting.push({ resolve, priority });
      // Sort by priority (higher priority first)
      this.waiting.sort((a, b) => b.priority - a.priority);
    });
  }

  release(): void {
    this.permits++;
    const next = this.waiting.shift();
    if (next) {
      this.permits--;
      next.resolve();
    }
  }

  async execute<T>(fn: () => Promise<T>, priority: number = 0): Promise<T> {
    await this.acquire(priority);
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// 5. Processing Strategy Pattern
abstract class ProcessingStrategy {
  protected config: TaskConfig;
  
  constructor(config: TaskConfig = DEFAULT_CONFIG) {
    this.config = config;
  }
//@ts-ignore
  abstract async process(
    taskId: string,
    data: any[],
    onProgress: (processed: number) => Promise<void>,
    user: User
  ): Promise<void>;

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async yieldAndCheckTimeout(startTime: number): Promise<boolean> {
    await new Promise(resolve => setImmediate(resolve));
    const elapsed = Date.now() - startTime;
    console.log(`Execution time: ${elapsed}ms / ${this.config.timeouts.maxExecutionTime}ms`);
    return elapsed > this.config.timeouts.maxExecutionTime;
  }
}

// 6. Streaming Strategy Implementation
class StreamingSyncStrategy extends ProcessingStrategy {
  //@ts-ignore
  async process(
    taskId: string,
    data: { simSerialNumbers: string[], records: SafaricomRecord[] },
    onProgress: (processed: number) => Promise<void>,
    user: User
  ): Promise<void> {
    const { simSerialNumbers, records } = data;
    const startTime = Date.now();
    
    // Create records map for fast lookup
    const recordMap = new Map(
      records.filter(r => r.simSerialNumber).map(r => [r.simSerialNumber, r])
    );

    const semaphore = new PrioritySemaphore(this.config.processing.maxConcurrency);
    let totalProcessed = 0;
    const batches = chunkArray(simSerialNumbers, this.config.processing.batchSize);

    console.log(`Starting streaming sync for ${simSerialNumbers.length} records in ${batches.length} fetch batches`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      // Check timeout before processing each batch
      if (await this.yieldAndCheckTimeout(startTime)) {
        console.log(`Timeout approaching, stopping at batch ${batchIndex}/${batches.length}`);
        await this.createContinuationTask(taskId, simSerialNumbers, records, batchIndex, user);
        return;
      }
      
      const serialBatch = batches[batchIndex];
      console.log(`Processing fetch batch ${batchIndex + 1}/${batches.length} (${serialBatch.length} serials)`);

      // Fetch database records for this batch
      const databaseRecords = await this.fetchDatabaseBatch(serialBatch, user);
      
      // Process the fetched records in smaller chunks
      const processChunks = chunkArray(databaseRecords, this.config.processing.chunkSize);
      
      for (const chunk of processChunks) {
        await Promise.allSettled(chunk.map(record => 
          semaphore.execute(() => this.processRecord(record, recordMap, user), 1)
        ));
        
        totalProcessed += chunk.length;
        await onProgress(totalProcessed);
        
        // Short delay between chunks
        await this.sleep(50);
      }

      // Handle unmatched serials
      const matchedSerials = new Set(databaseRecords.map(r => r.simSerialNumber));
      const unmatchedCount = serialBatch.filter(serial => !matchedSerials.has(serial)).length;
      if (unmatchedCount > 0) {
        totalProcessed += unmatchedCount;
        await onProgress(totalProcessed);
      }

      // Delay between batches
      if (batchIndex < batches.length - 1) {
        await this.sleep(200);
      }
    }
  }

  private async fetchDatabaseBatch(serialBatch: string[], user: User): Promise<DatabaseRecord[]> {
    try {
      const { data, error } = await simService.getSimCardsBySerialBatch(user, serialBatch, supabaseAdmin);
      if (error || !data) {
        console.warn(`Fetch batch failed:`, error);
        return [];
      }

      const simData = data as any[];
      return simData.map((sim) => ({
        simSerialNumber: sim.serial_number,
        simId: sim.id,
        team: sim.team_id.name,
        uploadedBy: sim?.assigned_to_user_id?.full_name ?? "Not assigned",
        createdAt: new Date(sim.created_at).toISOString(),
      }));
    } catch (error) {
      console.error(`Error fetching batch:`, error);
      return [];
    }
  }

  private async processRecord(
    record: DatabaseRecord, 
    recordMap: Map<string, SafaricomRecord>, 
    user: User
  ): Promise<void> {
    const sourceRecord = recordMap.get(record.simSerialNumber);
    if (!sourceRecord) return;

    try {
      const isQuality = sourceRecord.quality === "Y";
      const qualityStatus = isQuality ? SIMStatus.QUALITY : SIMStatus.NONQUALITY;

      // Fetch existing SIM with retry
      let existingSim;
      for (let attempt = 0; attempt < this.config.processing.retryAttempts; attempt++) {
        const result = await simService.DB
          .from('sim_cards')
          .select('status, activation_date, registered_on, usage')
          .eq('id', record.simId)
          .single();

        if (!result.error) {
          existingSim = result.data;
          break;
        }

        if (attempt < this.config.processing.retryAttempts - 1) {
          await this.sleep(1000 * Math.pow(this.config.processing.backoffMultiplier, attempt));
        }
      }

      if (!existingSim) {
        console.warn(`Failed to fetch SIM ${record.simId} after retries`);
        return;
      }

      // Prepare update fields
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

      // Update SIM with retry
      if (Object.keys(updateFields).length > 0) {
        for (let attempt = 0; attempt < this.config.processing.retryAttempts; attempt++) {
          try {
            await simService.updateSIMCard(record.simId, updateFields, user);
            break;
          } catch (updateError) {
            if (attempt < this.config.processing.retryAttempts - 1) {
              await this.sleep(1000 * Math.pow(this.config.processing.backoffMultiplier, attempt));
            } else {
              console.error(`Failed to update SIM ${record.simId}:`, updateError);
            }
          }
        }
      }

    } catch (err) {
      console.error(`Error processing record ${record.simSerialNumber}:`, err);
    }
  }

  private async createContinuationTask(
    originalTaskId: string,
    simSerialNumbers: string[],
    records: SafaricomRecord[],
    batchIndex: number,
    user: User
  ): Promise<void> {
    const remainingSerials = simSerialNumbers.slice(batchIndex * this.config.processing.batchSize);
    const remainingRecords = records.filter(r => 
      remainingSerials.includes(r.simSerialNumber)
    );

    if (remainingSerials.length === 0) return;

    const continuationTaskId = `sync_cont_${Date.now()}_${user.id}`;
    const continuationTask: EnhancedTask = {
      id: continuationTaskId,
      status: 'pending',
      progress: 0,
      total: remainingSerials.length,
      processed: 0,
      startTime: new Date(),
      userId: user.id,
      priority: 'high', // Continuation tasks get high priority
      metrics: {
        startTime: new Date(),
        errorCount: 0
      },
      continuationOf: originalTaskId,
      metadata: {
        batchStartIndex: batchIndex,
        type: 'continuation'
      }
    };

    await EnhancedTaskStorage.set(continuationTaskId, continuationTask);

    // Start continuation task asynchronously
    setTimeout(() => {
      EnhancedTaskManager.getInstance().processTask(
        continuationTaskId,
        { simSerialNumbers: remainingSerials, records: remainingRecords },
          //@ts-ignore
        new StreamingSyncStrategy()
      ).catch(error => {
        console.error('Continuation sync failed:', error);
      });
    }, 1000);

    // Update original task as partially completed
    const originalTask = await EnhancedTaskStorage.get(originalTaskId);
    if (originalTask) {
      await EnhancedTaskStorage.update(originalTaskId, {
        status: 'completed',
        progress: 100, // Consider it completed for this batch
        endTime: new Date(),
        metadata: {
          ...originalTask.metadata,
          continuedBy: continuationTaskId,
          partialCompletion: true
        }
      });
    }
  }
}

// 7. Enhanced Task Manager with Better Resource Management
class EnhancedTaskManager {
  private static instance: EnhancedTaskManager;
  private config: TaskConfig;
  private activeProcessors = new Map<string, AbortController>();
  private metrics = new Map<string, TaskMetrics>();

  private constructor(config: TaskConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  static getInstance(config?: TaskConfig): EnhancedTaskManager {
    if (!EnhancedTaskManager.instance) {
      EnhancedTaskManager.instance = new EnhancedTaskManager(config);
    }
    return EnhancedTaskManager.instance;
  }

  async startTask<T>(
    taskId: string,
    data: T,
    strategy: ProcessingStrategy,
    options: {
      priority?: 'low' | 'normal' | 'high';
      dependencies?: string[];
      userId: string;
      total: number;
    }
  ): Promise<string> {
    // Check if dependencies are complete
    await this.waitForDependencies(options.dependencies);

    // Create task with enhanced metadata
    const task: EnhancedTask = {
      id: taskId,
      status: 'pending',
      progress: 0,
      total: options.total,
      processed: 0,
      startTime: new Date(),
      userId: options.userId,
      priority: options.priority || 'normal',
      dependencies: options.dependencies,
      metrics: {
        startTime: new Date(),
        errorCount: 0
      },
      metadata: {}
    };

    await EnhancedTaskStorage.set(taskId, task);

    // Clean up old tasks opportunistically
    EnhancedTaskStorage.cleanup().catch(error => {
      console.error('Background cleanup failed:', error);
    });

    // Start processing with abort capability
    const abortController = new AbortController();
    this.activeProcessors.set(taskId, abortController);

    this.processTask(taskId, data, strategy, abortController.signal)
      .catch(error => this.handleTaskError(taskId, error))
      .finally(() => this.cleanup(taskId));

    return taskId;
  }

  async processTask<T>(
    taskId: string,
    data: T,
    strategy: ProcessingStrategy,
    signal?: AbortSignal
  ): Promise<void> {
    await EnhancedTaskStorage.update(taskId, { status: 'running' });

    const startTime = Date.now();
    let processed = 0;

    const onProgress = async (newProcessed: number) => {
      processed = newProcessed;
      const task = await EnhancedTaskStorage.get(taskId);
      if (!task) return;

      const progress = Math.floor((processed / task.total) * 100);
      const elapsed = Date.now() - startTime;
      const recordsPerSecond = processed / (elapsed / 1000);

      await EnhancedTaskStorage.update(taskId, {
        processed,
        progress,
        metrics: {
          ...task.metrics,
          recordsPerSecond,
          processingTime: elapsed
        }
      });

      // Check if task should be aborted
      if (signal?.aborted) {
        throw new Error('Task aborted');
      }
    };

    try {
      const user = await Accounts.user();
      if (!user) throw new Error('User not authenticated');
//@ts-ignore
      await strategy.process(taskId, data, onProgress, user);

      await EnhancedTaskStorage.update(taskId, {
        status: 'completed',
        progress: 100,
        endTime: new Date(),
        //@ts-ignore
        metrics: {
          ...((await EnhancedTaskStorage.get(taskId))?.metrics || {}),
          endTime: new Date(),
          processingTime: Date.now() - startTime
        }
      });

    } catch (error) {
      //@ts-ignore
      if (error.message === 'Task aborted') {
        await EnhancedTaskStorage.update(taskId, { status: 'cancelled' });
      } else {
        throw error;
      }
    }
  }

  async abortTask(taskId: string): Promise<boolean> {
    const controller = this.activeProcessors.get(taskId);
    if (controller) {
      controller.abort();
      return true;
    }
    return false;
  }

  async getTaskStatus(taskId: string, userId: string): Promise<any> {
    const task = await EnhancedTaskStorage.get(taskId);
    
    if (!task) {
      return makeResponse({ error: "Task not found" });
    }

    if (task.userId !== userId) {
      return makeResponse({ error: "Unauthorized access to task" });
    }

    // Include child task statuses if this is a parent task
    //@ts-ignore
    let childTaskStatuses = [];
    if (task.metadata?.type === 'parent_task' && task.children) {
      const childTasks = await Promise.all(
        task.children.map(async (childId: string) => {
          const childTask = await EnhancedTaskStorage.get(childId);
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
        ...task,
        //@ts-ignore
        childTasks: childTaskStatuses
      }
    });
  }

  private async waitForDependencies(dependencies?: string[]): Promise<void> {
    if (!dependencies?.length) return;

    const pollInterval = 1000;
    const maxWait = 300000; // 5 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const dependencyStatuses = await Promise.all(
        dependencies.map(id => EnhancedTaskStorage.get(id))
      );

      const allComplete = dependencyStatuses.every(
        task => task?.status === 'completed'
      );

      if (allComplete) return;

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Dependency timeout: Some dependencies did not complete in time');
  }

  private async handleTaskError(taskId: string, error: Error): Promise<void> {
    console.error(`Task ${taskId} failed:`, error);

    await EnhancedTaskStorage.update(taskId, {
      status: 'failed',
      error: error.message,
      endTime: new Date()
    });
  }

  private cleanup(taskId: string): void {
    this.activeProcessors.delete(taskId);
    this.metrics.delete(taskId);
  }
}

// 8. Improved Report Actions Class
class ImprovedReportActions {
  private static taskManager = EnhancedTaskManager.getInstance();

  static async generate_excel_report(data: any) {
    try {
      const user = await Accounts.user();
      if (!user) {
        return makeResponse({error: "User not authenticated"});
      }

      const {startDate, endDate} = data;
      const simCards = await ImprovedReportActions.fetchSimCards(user, startDate, endDate);
      const processedReport = await ImprovedReportActions.processReportData(simCards, user);
      
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
    } catch (error) {
      console.error("Error generating Excel report:", error);
      return makeResponse({error: (error as Error).message});
    }
  }

  static async sync(data: { simSerialNumbers: string[], records: SafaricomRecord[] }) {
    try {
      const user = await Accounts.user();
      if (!user) {
        return makeResponse({ error: "User not authenticated" });
      }

      const { simSerialNumbers, records } = data;
      const taskId = `sync_${Date.now()}_${user.id}`;
      
      const strategy = new StreamingSyncStrategy();
      
      await ImprovedReportActions.taskManager.startTask(
        taskId,
        { simSerialNumbers, records },
          //@ts-ignore
        strategy,
        {
          priority: 'high',
          userId: user.id,
          total: simSerialNumbers.length
        }
      );

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

  static async sync_status(data: { taskId: string }) {
    try {
      const user = await Accounts.user();
      if (!user) {
        return makeResponse({ error: "User not authenticated" });
      }

      return await ImprovedReportActions.taskManager.getTaskStatus(data.taskId, user.id);

    } catch (e) {
      console.error("Task status error:", e);
      return makeResponse({error: (e as Error).message});
    }
  }

  static async fetch_database_records(data: { simSerialNumbers: string[] }) {
    try {
      const user = await Accounts.user();
      if (!user) {
        return makeResponse({ error: "User not authenticated" });
      }

      const { simSerialNumbers } = data;
      const batchSize = 500;
      const results: DatabaseRecord[] = [];
      const totalBatches = Math.ceil(simSerialNumbers.length / batchSize);

      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < simSerialNumbers.length; i += batchSize) {
        const batchIndex = Math.floor(i / batchSize);
        const batch = simSerialNumbers.slice(i, i + batchSize);

        try {
          const {data, error} = await simService.getSimCardsBySerialBatch(user, batch, supabaseAdmin);
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
          
          if (batchIndex < totalBatches - 1) {
            await sleep(100);
          }
        } catch (error) {
          console.error(`Error processing batch ${batchIndex}:`, error);
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

  static async cleanup_tasks() {
    try {
      await EnhancedTaskStorage.cleanup();
      return makeResponse({ ok: true, message: "Cleanup completed" });
    } catch (e) {
      return makeResponse({error: (e as Error).message});
    }
  }

  // Helper methods (same as before but cleaner)
  private static async fetchSimCards(user: User, startDate: string, endDate: string, filters: Filter[] = []) {
    const dateStart = DateTime.fromISO(startDate).startOf('day');
    const dateEnd = DateTime.fromISO(endDate).endOf('day');

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

  private static async processReportData(simCards: any[], user: User) {
    const teamGroups: { [teamName: string]: { quality: any[]; nonQuality: any[] } } = {};
    const unknownSims: any[] = [];

    const {data: teams} = await supabaseAdmin
      .from('teams')
      .select('*, users!leader_id(*)')
      .eq('admin_id', await admin_id(user));

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

    if (unknownSims.length > 0) {
      teamReports.push({
        teamName: 'Unknown',
        records: unknownSims,
        qualityCount: 0,
        matchedCount: unknownSims.length
      });
    }

    const totalQualityCount = teamReports.reduce((sum, team) => sum + team.qualityCount, 0);
    const totalMatchedCount = teamReports.reduce((sum, team) => sum + team.matchedCount, 0);

    return {
      rawRecords: simCards,
      teamReports,
      qualityCount: totalQualityCount,
      matchedCount: totalMatchedCount
    };
  }

  static async builder(target: string, data: any) {
    try {
      const action = (ImprovedReportActions as any)[target];
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

export default ImprovedReportActions;
export { EnhancedTaskManager, StreamingSyncStrategy, ProcessingStrategy };