import { TranscriptionError, TranscriptionErrorCode } from '../utils/errors';
import { BaseWorker } from './base-worker';
import { WhisperWorkerMonitor } from './whisper-worker-utils';
import { WhisperModelHandler } from './whisper-model-handler';
import {
    WhisperModelConfig,
    WhisperWorkerMessage,
    WhisperWorkerResponse
} from '../types/whisper';

/**
 * Web Worker for handling Whisper model operations.
 * Runs in a separate thread to prevent blocking the main UI.
 * Implements memory management, performance tracking, and detailed error handling.
 */
class WhisperWorker extends BaseWorker {
    private model: WhisperModelHandler;
    private monitor: WhisperWorkerMonitor;

    constructor() {
        super();
        this.model = new WhisperModelHandler();
        this.monitor = new WhisperWorkerMonitor();
    }

    protected async handleMessage(event: MessageEvent<WhisperWorkerMessage>): Promise<void> {
        const { type, requestId } = event.data;

        try {
            switch (type) {
                case 'initialize':
                    await this.handleInitialize(event.data.config);
                    break;

                case 'transcribe':
                    if (!event.data.audioData) {
                        throw new TranscriptionError(
                            'Audio data required for transcription',
                            TranscriptionErrorCode.INVALID_AUDIO
                        );
                    }
                    const text = await this.handleTranscribe(event.data.audioData);
                    this.postMessage({ type: 'transcribed', text, requestId });
                    break;

                case 'cleanup':
                    await this.handleCleanup();
                    break;

                case 'status':
                    await this.handleStatus(requestId);
                    break;

                default:
                    throw new TranscriptionError(
                        `Unknown message type: ${type}`,
                        TranscriptionErrorCode.UNKNOWN
                    );
            }
        } catch (error) {
            this.handleError(error, requestId);
        }
    }

    protected async handleInitialize(config?: WhisperModelConfig): Promise<void> {
        if (!config) {
            throw new TranscriptionError(
                'Configuration required for initialization',
                TranscriptionErrorCode.INVALID_OPTIONS
            );
        }

        const progress = (percent: number) => {
            const update = this.monitor.createProgressUpdate(percent, 'loading');
            if (update) {
                this.postMessage(update);
            }
        };

        progress(0);

        if (config.maxMemoryMB && !this.monitor.checkMemoryLimit(config.maxMemoryMB)) {
            throw new TranscriptionError(
                'Insufficient memory for model initialization',
                TranscriptionErrorCode.LOCAL_MODEL_ERROR
            );
        }

        progress(25);
        await this.model.initialize(config);
        progress(100);

        this.postMessage({ type: 'initialized' });
    }

    protected async handleTranscribe(audioData: ArrayBuffer): Promise<string> {
        this.monitor.startProcessing();

        const progress = (percent: number) => {
            const update = this.monitor.createProgressUpdate(percent, 'processing');
            if (update) {
                this.postMessage(update);
            }
        };

        try {
            progress(0);
            const text = await this.model.transcribe(audioData);
            progress(100);
            return text;
        } finally {
            this.monitor.endProcessing(audioData.byteLength);
            if (typeof global.gc === 'function') {
                global.gc();
            }
        }
    }

    protected async handleCleanup(): Promise<void> {
        await this.withTimeout(
            this.model.cleanup(),
            5000,
            'Model cleanup timeout'
        );
        this.monitor.reset();
    }

    private async handleStatus(requestId?: string): Promise<void> {
        const memoryInfo = this.monitor.getMemoryInfo();
        const config = this.model.getConfig();
        const stats = this.monitor.getStats();

        this.postMessage({
            type: 'status',
            requestId,
            status: {
                initialized: this.model.isInitialized(),
                memoryUsage: memoryInfo,
                modelInfo: this.model.isInitialized() ? {
                    size: stats.peakMemoryUsage,
                    device: config?.device || 'unknown',
                    threads: config?.threads || 1
                } : undefined
            }
        });
    }

    protected handleError(error: unknown, requestId?: string): void {
        const errorResponse: WhisperWorkerResponse = {
            type: 'error',
            requestId,
            error: {
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                code: error instanceof TranscriptionError 
                    ? error.code 
                    : TranscriptionErrorCode.UNKNOWN,
                details: error instanceof TranscriptionError ? error.originalError : error
            }
        };
        this.postMessage(errorResponse);
    }
}

// Initialize the worker
new WhisperWorker();
