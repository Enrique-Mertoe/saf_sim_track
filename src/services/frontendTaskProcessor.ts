import {SafaricomRecord} from "@/app/dashboard/report/types";
import {$} from "@/lib/request";
import Signal from "@/lib/Signal";

interface ProcessingConfig {
  chunkSize: number;
  concurrency: number;
  retryAttempts: number;
  retryDelay: number;
  pauseBetweenChunks: number;
}

interface ProcessingProgress {
  totalRecords: number;
  processedRecords: number;
  currentChunk: number;
  totalChunks: number;
  percentage: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  errors: string[];
  startTime: Date;
  estimatedTimeRemaining?: number;
}

interface ChunkResult {
  success: boolean;
  processedCount: number;
  error?: string;
  retryable?: boolean;
}

class FrontendTaskProcessor {
  private config: ProcessingConfig;
  private progress: ProcessingProgress;
  private isPaused: boolean = false;
  private isAborted: boolean = false;
  private progressCallback?: (progress: ProcessingProgress) => void;

  constructor(config: Partial<ProcessingConfig> = {}) {
    this.config = {
      chunkSize: 100,          // Process 100 records at a time
      concurrency: 3,          // Max 3 concurrent API calls
      retryAttempts: 3,        // Retry failed chunks 3 times
      retryDelay: 2000,        // 2 second delay between retries
      pauseBetweenChunks: 500, // 500ms pause between chunks
      ...config
    };

    this.progress = {
      totalRecords: 0,
      processedRecords: 0,
      currentChunk: 0,
      totalChunks: 0,
      percentage: 0,
      status: 'pending',
      errors: [],
      startTime: new Date()
    };
  }

  /**
   * Process sync operation in chunks on frontend
   */
  async processSyncOperation(
    simSerialNumbers: string[],
    records: SafaricomRecord[],
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<ProcessingProgress> {
    this.progressCallback = onProgress;
    this.isAborted = false;
    this.isPaused = false;

    // Initialize progress
    this.progress = {
      totalRecords: simSerialNumbers.length,
      processedRecords: 0,
      currentChunk: 0,
      totalChunks: Math.ceil(simSerialNumbers.length / this.config.chunkSize),
      percentage: 0,
      status: 'processing',
      errors: [],
      startTime: new Date()
    };

    this.updateProgress();
    Signal.trigger("add-process", `Starting sync of ${simSerialNumbers.length} records...`);

    try {
      // Create chunks of serial numbers and corresponding records
      const chunks = this.createChunks(simSerialNumbers, records);
      
      // Process chunks with controlled concurrency
      await this.processChunksWithConcurrency(chunks);
      
      this.progress.status = 'completed';
      this.progress.percentage = 100;
      this.updateProgress();
      
      Signal.trigger("add-process", `Sync completed successfully! Processed ${this.progress.processedRecords}/${this.progress.totalRecords} records.`);
      
      return this.progress;

    } catch (error) {
      this.progress.status = 'failed';
      this.progress.errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.updateProgress();
      
      Signal.trigger("add-process", `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      throw error;
    }
  }

  /**
   * Create chunks from serial numbers and records
   */
  private createChunks(
    simSerialNumbers: string[], 
    records: SafaricomRecord[]
  ): Array<{ serials: string[], records: SafaricomRecord[] }> {
    const chunks = [];
    const recordMap = new Map(records.map(r => [r.simSerialNumber, r]));

    for (let i = 0; i < simSerialNumbers.length; i += this.config.chunkSize) {
      const chunkSerials = simSerialNumbers.slice(i, i + this.config.chunkSize);
      const chunkRecords = chunkSerials
        .map(serial => recordMap.get(serial))
        .filter(record => record !== undefined) as SafaricomRecord[];

      chunks.push({
        serials: chunkSerials,
        records: chunkRecords
      });
    }

    return chunks;
  }

  /**
   * Process chunks with controlled concurrency
   */
  private async processChunksWithConcurrency(
    chunks: Array<{ serials: string[], records: SafaricomRecord[] }>
  ): Promise<void> {
    const semaphore = new Semaphore(this.config.concurrency);
    
    // Process chunks in parallel with concurrency control
    const chunkPromises = chunks.map(async (chunk, index) => {
      return semaphore.execute(async () => {
        if (this.isAborted) return;
        
        // Wait if paused
        while (this.isPaused && !this.isAborted) {
          await this.sleep(100);
        }
        
        if (this.isAborted) return;
        
        this.progress.currentChunk = index + 1;
        this.updateProgress();
        
        Signal.trigger("add-process", `Processing chunk ${index + 1}/${chunks.length}...`);
        
        const result = await this.processChunkWithRetry(chunk, index);
        
        if (result.success) {
          this.progress.processedRecords += result.processedCount;
          this.progress.percentage = Math.floor((this.progress.processedRecords / this.progress.totalRecords) * 100);
          this.updateProgress();
        } else {
          this.progress.errors.push(`Chunk ${index + 1}: ${result.error}`);
        }
        
        // Pause between chunks to avoid overwhelming the server
        if (index < chunks.length - 1 && !this.isAborted) {
          await this.sleep(this.config.pauseBetweenChunks);
        }
      });
    });

    await Promise.all(chunkPromises);
  }

  /**
   * Process a single chunk with retry logic
   */
  private async processChunkWithRetry(
    chunk: { serials: string[], records: SafaricomRecord[] },
    chunkIndex: number
  ): Promise<ChunkResult> {
    let lastError = '';
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      if (this.isAborted) {
        return { success: false, processedCount: 0, error: 'Operation aborted' };
      }
      
      try {
        Signal.trigger("add-process", `Processing chunk ${chunkIndex + 1}, attempt ${attempt}...`);
        
        const result = await this.processSingleChunk(chunk.serials, chunk.records);
        
        if (result.success) {
          return {
            success: true,
            processedCount: chunk.serials.length
          };
        } else {
          lastError = result.error || 'Unknown error';
          if (!result.retryable) break;
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Network error';
        console.error(`Chunk ${chunkIndex + 1} attempt ${attempt} failed:`, error);
      }
      
      // Wait before retry (except for last attempt)
      if (attempt < this.config.retryAttempts) {
        Signal.trigger("add-process", `Chunk ${chunkIndex + 1} failed, retrying in ${this.config.retryDelay / 1000}s...`);
        await this.sleep(this.config.retryDelay * attempt); // Exponential backoff
      }
    }
    
    return {
      success: false,
      processedCount: 0,
      error: lastError,
      retryable: false
    };
  }

  /**
   * Process a single chunk via API
   */
  private async processSingleChunk(
    serials: string[], 
    records: SafaricomRecord[]
  ): Promise<{ success: boolean, error?: string, retryable?: boolean }> {
    return new Promise((resolve) => {
      $.post({
        url: "/api/actions",
        contentType: $.JSON,
        data: {
          action: "report",
          target: "sync_single_chunk", // New API endpoint for single chunk
          data: {
            simSerialNumbers: serials,
            records: records
          }
        }
      }).then(result => {
        if (result.ok) {
          resolve({ success: true });
        } else {
          resolve({ 
            success: false,
            //@ts-ignore
            error: result.data || 'API error',
            //@ts-ignore
            retryable: result.status !== 400 // Don't retry validation errors
          });
        }
      }).catch(error => {
        resolve({ 
          success: false, 
          error: 'Network error: ' + error.message,
          retryable: true 
        });
      });
    });
  }

  /**
   * Pause processing
   */
  pause(): void {
    this.isPaused = true;
    this.progress.status = 'paused';
    this.updateProgress();
    Signal.trigger("add-process", "Processing paused by user");
  }

  /**
   * Resume processing
   */
  resume(): void {
    this.isPaused = false;
    this.progress.status = 'processing';
    this.updateProgress();
    Signal.trigger("add-process", "Processing resumed");
  }

  /**
   * Abort processing
   */
  abort(): void {
    this.isAborted = true;
    this.progress.status = 'failed';
    this.progress.errors.push('Operation aborted by user');
    this.updateProgress();
    Signal.trigger("add-process", "Processing aborted by user");
  }

  /**
   * Get current progress
   */
  getProgress(): ProcessingProgress {
    return { ...this.progress };
  }

  /**
   * Update progress and call callback
   */
  private updateProgress(): void {
    // Calculate estimated time remaining
    if (this.progress.processedRecords > 0) {
      const elapsed = Date.now() - this.progress.startTime.getTime();
      const rate = this.progress.processedRecords / elapsed; // records per ms
      const remaining = this.progress.totalRecords - this.progress.processedRecords;
      this.progress.estimatedTimeRemaining = Math.round(remaining / rate);
    }

    this.progressCallback?.(this.progress);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Semaphore for controlling concurrency
 */
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

/**
 * Factory function to create processor with optimal config
 */
export function createTaskProcessor(
  estimatedRecordCount: number,
  config: Partial<ProcessingConfig> = {}
): FrontendTaskProcessor {
  // Adaptive configuration based on record count
  const adaptiveConfig: ProcessingConfig = {
    chunkSize: estimatedRecordCount > 10000 ? 50 : 100,
    concurrency: estimatedRecordCount > 5000 ? 2 : 3,
    retryAttempts: 3,
    retryDelay: 2000,
    pauseBetweenChunks: estimatedRecordCount > 10000 ? 1000 : 500,
    ...config
  };

  return new FrontendTaskProcessor(adaptiveConfig);
}

export default FrontendTaskProcessor;
export type { ProcessingConfig, ProcessingProgress, ChunkResult };