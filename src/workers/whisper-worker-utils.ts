import { ModelStats, TranscriptionProgress, WhisperWorkerResponse } from '../types/whisper';

/**
 * Utility class for monitoring worker performance and memory usage
 */
export class WhisperWorkerMonitor {
    private stats: ModelStats = {
        totalProcessingTime: 0,
        processedSamples: 0,
        averageProcessingTime: 0,
        peakMemoryUsage: 0
    };
    private processingStart: number | null = null;
    private lastProgressUpdate: number = 0;
    private readonly PROGRESS_UPDATE_INTERVAL = 100; // ms

    /**
     * Updates processing statistics
     */
    updateStats(processingTime: number, sampleSize: number): void {
        this.stats.totalProcessingTime += processingTime;
        this.stats.processedSamples++;
        this.stats.averageProcessingTime = 
            this.stats.totalProcessingTime / this.stats.processedSamples;
    }

    /**
     * Starts tracking processing time
     */
    startProcessing(): void {
        this.processingStart = performance.now();
    }

    /**
     * Ends tracking processing time and updates stats
     */
    endProcessing(sampleSize: number): number {
        if (!this.processingStart) {
            return 0;
        }
        const processingTime = performance.now() - this.processingStart;
        this.updateStats(processingTime, sampleSize);
        this.processingStart = null;
        return processingTime;
    }

    /**
     * Updates memory usage statistics
     */
    updateMemoryUsage(currentUsage: number): void {
        this.stats.peakMemoryUsage = Math.max(
            this.stats.peakMemoryUsage,
            currentUsage
        );
    }

    /**
     * Gets current memory usage
     */
    getMemoryInfo(): { heapUsed: number; heapTotal: number } {
        return {
            heapUsed: performance.memory?.usedJSHeapSize ?? 0,
            heapTotal: performance.memory?.jsHeapSizeLimit ?? 0
        };
    }

    /**
     * Checks if memory usage is within limits
     */
    checkMemoryLimit(maxMemoryMB: number): boolean {
        if (!performance.memory) {
            return true;
        }
        const maxBytes = maxMemoryMB * 1024 * 1024;
        return performance.memory.jsHeapSizeLimit <= maxBytes;
    }

    /**
     * Creates a progress update if enough time has passed
     */
    createProgressUpdate(
        percent: number, 
        stage: 'loading' | 'processing' | 'finalizing'
    ): WhisperWorkerResponse | null {
        const now = performance.now();
        if (now - this.lastProgressUpdate >= this.PROGRESS_UPDATE_INTERVAL) {
            this.lastProgressUpdate = now;
            return {
                type: 'progress',
                progress: {
                    percent,
                    stage,
                    memoryUsage: this.getMemoryInfo()
                }
            };
        }
        return null;
    }

    /**
     * Gets current performance statistics
     */
    getStats(): ModelStats {
        return { ...this.stats };
    }

    /**
     * Resets all statistics
     */
    reset(): void {
        this.stats = {
            totalProcessingTime: 0,
            processedSamples: 0,
            averageProcessingTime: 0,
            peakMemoryUsage: 0
        };
        this.processingStart = null;
        this.lastProgressUpdate = 0;
    }
}
