/**
 * Configuration for the Whisper model worker
 */
export interface WhisperModelConfig {
    modelPath: string;
    language?: string;
    device: 'cpu' | 'gpu';
    threads: number;
    maxMemoryMB?: number;
}

/**
 * Progress information for transcription process
 */
export interface TranscriptionProgress {
    percent: number;
    stage: string;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
    };
}

/**
 * Status information from the worker
 */
export interface WorkerStatus {
    initialized: boolean;
    memoryUsage: {
        heapUsed: number;
        heapTotal: number;
    };
    modelInfo?: {
        size: number;
        device: string;
        threads: number;
    };
}

/**
 * Statistics for model performance tracking
 */
export interface ModelStats {
    totalProcessingTime: number;
    processedSamples: number;
    averageProcessingTime: number;
    peakMemoryUsage: number;
}

/**
 * Message types that can be sent to the worker
 */
export interface WhisperWorkerMessage {
    type: 'initialize' | 'transcribe' | 'cleanup' | 'status';
    config?: WhisperModelConfig;
    audioData?: ArrayBuffer;
    requestId?: string;
}

/**
 * Response types that can be received from the worker
 */
export interface WhisperWorkerResponse {
    type: 'initialized' | 'transcribed' | 'error' | 'progress' | 'status';
    text?: string;
    error?: {
        message: string;
        code: string;
        details?: unknown;
    };
    progress?: TranscriptionProgress;
    status?: WorkerStatus;
    requestId?: string;
}

export type ProgressCallback = (progress: TranscriptionProgress) => void;
