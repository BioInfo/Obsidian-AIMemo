import { Notice } from 'obsidian';
import { TranscriptionError, TranscriptionErrorCode } from '../utils/errors';
import type AiVoiceMemoPlugin from '../main';

interface WhisperModelConfig {
    modelPath: string;
    language?: string;
    device: 'cpu' | 'gpu';
    threads: number;
    maxMemoryMB?: number;
}

interface TranscriptionProgress {
    percent: number;
    stage: string;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
    };
}

interface WorkerStatus {
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

type ProgressCallback = (progress: TranscriptionProgress) => void;

/**
 * Manages local Whisper model for offline transcription.
 * Handles model initialization, audio processing, and resource management.
 */
export class WhisperLocalService {
    private plugin: AiVoiceMemoPlugin;
    private isInitialized: boolean = false;
    private modelConfig: WhisperModelConfig | null = null;
    private worker: Worker | null = null;
    private workerReady: Promise<void> | null = null;

    constructor(plugin: AiVoiceMemoPlugin) {
        this.plugin = plugin;
    }

    /**
     * Initializes the local Whisper model.
     * Downloads the model if not present and sets up processing resources.
     * @throws {TranscriptionError} If initialization fails
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Create and initialize worker
            this.worker = new Worker(
                new URL('../workers/whisper-worker.ts', import.meta.url),
                { type: 'module' }
            );

            // Set up worker message handling
            this.worker.onmessage = this.handleWorkerMessage.bind(this);
            this.worker.onerror = this.handleWorkerError.bind(this);

            // Initialize worker with config
            this.workerReady = new Promise((resolve, reject) => {
                if (!this.worker) {
                    reject(new Error('Worker not created'));
                    return;
                }

                const config = {
                    modelPath: this.modelConfig?.modelPath || 'models/whisper-base.bin',
                    device: this.modelConfig?.device || 'cpu',
                    threads: this.modelConfig?.threads || navigator.hardwareConcurrency || 4,
                    language: this.modelConfig?.language
                };

                const handleInitMessage = (event: MessageEvent) => {
                    if (event.data.type === 'initialized') {
                        this.worker?.removeEventListener('message', handleInitMessage);
                        this.isInitialized = true;
                        resolve();
                    } else if (event.data.type === 'error') {
                        this.worker?.removeEventListener('message', handleInitMessage);
                        reject(new Error(event.data.error?.message));
                    }
                };

                this.worker.addEventListener('message', handleInitMessage);
                this.worker.postMessage({ type: 'initialize', config });
            });

            await this.workerReady;
        } catch (error) {
            if (error instanceof TranscriptionError) {
                throw error;
            }
            throw new TranscriptionError(
                'Failed to initialize local Whisper model',
                TranscriptionErrorCode.LOCAL_MODEL_ERROR,
                error
            );
        }
    }

    /**
     * Transcribes audio using the local Whisper model.
     * @param audioBlob - The audio data to transcribe
     * @returns The transcribed text
     * @throws {TranscriptionError} If transcription fails
     */
    async transcribe(audioBlob: Blob, onProgress?: ProgressCallback): Promise<string> {
        if (!this.isInitialized || !this.worker) {
            await this.initialize();
        }

        if (!this.worker) {
            throw new TranscriptionError(
                'Worker not initialized',
                TranscriptionErrorCode.LOCAL_MODEL_ERROR
            );
        }

        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            const transcription = await new Promise<string>((resolve, reject) => {
                if (!this.worker) {
                    reject(new Error('Worker not initialized'));
                    return;
                }

                const handleTranscribeMessage = (event: MessageEvent) => {
                    switch (event.data.type) {
                        case 'transcribed':
                            this.worker?.removeEventListener('message', handleTranscribeMessage);
                            resolve(event.data.text || '');
                            break;
                            
                        case 'error':
                            this.worker?.removeEventListener('message', handleTranscribeMessage);
                            const error = new TranscriptionError(
                                event.data.error?.message || 'Unknown error',
                                event.data.error?.code || TranscriptionErrorCode.UNKNOWN,
                                event.data.error?.details
                            );
                            reject(error);
                            break;
                            
                        case 'progress':
                            if (onProgress && event.data.progress) {
                                onProgress(event.data.progress);
                            }
                            break;
                    }
                };

                this.worker.addEventListener('message', handleTranscribeMessage);
                this.worker.postMessage({ type: 'transcribe', audioData: arrayBuffer });
            });

            return transcription;
        } catch (error) {
            if (error instanceof TranscriptionError) {
                throw error;
            }
            throw new TranscriptionError(
                'Failed to transcribe audio using local model',
                TranscriptionErrorCode.LOCAL_MODEL_ERROR,
                error
            );
        }
    }

    /**
     * Updates the model configuration.
     * @param config - The new model configuration
     * @throws {TranscriptionError} If configuration is invalid
     */
    async updateConfig(config: Partial<WhisperModelConfig>): Promise<void> {
        if (!this.modelConfig) {
            this.modelConfig = {
                modelPath: 'models/whisper-base.bin',
                device: 'cpu',
                threads: navigator.hardwareConcurrency || 4,
                maxMemoryMB: 1024 // Default to 1GB limit
            };
        }

        // Validate configuration
        if (config.threads && config.threads < 1) {
            throw new TranscriptionError(
                'Thread count must be at least 1',
                TranscriptionErrorCode.INVALID_OPTIONS
            );
        }

        if (config.maxMemoryMB && config.maxMemoryMB < 256) {
            throw new TranscriptionError(
                'Memory limit must be at least 256MB',
                TranscriptionErrorCode.INVALID_OPTIONS
            );
        }

        Object.assign(this.modelConfig, config);

        // Reinitialize if already initialized
        if (this.isInitialized) {
            await this.cleanup();
            await this.initialize();
        }
    }

    /**
     * Gets the current status of the worker including memory usage and model info.
     */
    async getStatus(): Promise<WorkerStatus> {
        if (!this.worker) {
            return {
                initialized: false,
                memoryUsage: { heapUsed: 0, heapTotal: 0 }
            };
        }

        return new Promise<WorkerStatus>((resolve) => {
            const worker = this.worker;
            if (!worker) {
                resolve({
                    initialized: false,
                    memoryUsage: { heapUsed: 0, heapTotal: 0 }
                });
                return;
            }

            const handleStatusMessage = (event: MessageEvent) => {
                if (event.data.type === 'status') {
                    worker.removeEventListener('message', handleStatusMessage);
                    resolve(event.data.status || {
                        initialized: false,
                        memoryUsage: { heapUsed: 0, heapTotal: 0 }
                    });
                }
            };

            worker.addEventListener('message', handleStatusMessage);
            worker.postMessage({ type: 'status' });
        });
    }

    /**
     * Cleans up resources used by the local model.
     */
    /**
     * Handles messages from the worker thread
     */
    private handleWorkerMessage(event: MessageEvent): void {
        const { type, error, progress } = event.data;
        
        switch (type) {
            case 'error':
                if (error?.message) {
                    console.error('Worker error:', error.message);
                    this.plugin.setStatusBarText(`Error: ${error.message}`, 5000);
                }
                break;
                
            case 'progress':
                if (progress?.stage === 'processing' && typeof progress.percent === 'number') {
                    this.plugin.setStatusBarText(
                        `Transcribing: ${progress.percent}%`,
                        0
                    );
                }
                break;
                
            case 'status':
                // Log status updates if needed
                break;
        }
    }

    /**
     * Handles worker errors
     */
    private handleWorkerError(error: ErrorEvent): void {
        console.error('Worker error:', error);
        this.cleanup();
    }

    async cleanup(): Promise<void> {
        if (!this.worker) {
            return;
        }

        try {
            // Wait for cleanup to complete
            await new Promise<void>((resolve, reject) => {
                const cleanup = () => {
                    if (this.worker) {
                        this.worker.terminate();
                        this.worker = null;
                    }
                    this.isInitialized = false;
                    this.workerReady = null;
                    resolve();
                };

                const currentWorker = this.worker;
                if (!currentWorker) {
                    cleanup();
                    return;
                }

                const handleCleanupMessage = (event: MessageEvent) => {
                    if (event.data.type === 'status' && event.data.status && !event.data.status.initialized) {
                        currentWorker.removeEventListener('message', handleCleanupMessage);
                        currentWorker.removeEventListener('error', handleCleanupError);
                        cleanup();
                    }
                };

                const handleCleanupError = (error: ErrorEvent) => {
                    currentWorker.removeEventListener('message', handleCleanupMessage);
                    currentWorker.removeEventListener('error', handleCleanupError);
                    console.error('Cleanup error:', error);
                    cleanup();
                    reject(error);
                };

                currentWorker.addEventListener('message', handleCleanupMessage);
                currentWorker.addEventListener('error', handleCleanupError);
                currentWorker.postMessage({ type: 'cleanup' });

                // Timeout after 5 seconds
                setTimeout(() => {
                    cleanup();
                    reject(new Error('Cleanup timeout'));
                }, 5000);
            });
        } catch (error) {
            console.error('Failed to cleanup worker:', error);
            // Ensure cleanup even if promise fails
            if (this.worker) {
                this.worker.terminate();
                this.worker = null;
            }
            this.isInitialized = false;
            this.workerReady = null;
        }
    }

    /**
     * Checks if the local model is ready for transcription.
     */
    isReady(): boolean {
        return this.isInitialized && !!this.worker;
    }
}
