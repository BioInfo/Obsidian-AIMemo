import { Notice } from 'obsidian';
import { TranscriptionError, TranscriptionErrorCode } from '../utils/errors';
import type AiVoiceMemoPlugin from '../main';

interface WhisperModelConfig {
    modelPath: string;
    language?: string;
    device: 'cpu' | 'gpu';
    threads: number;
}

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
    async transcribe(audioBlob: Blob): Promise<string> {
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
                    if (event.data.type === 'transcribed') {
                        this.worker?.removeEventListener('message', handleTranscribeMessage);
                        resolve(event.data.text || '');
                    } else if (event.data.type === 'error') {
                        this.worker?.removeEventListener('message', handleTranscribeMessage);
                        reject(new Error(event.data.error?.message));
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
                threads: navigator.hardwareConcurrency || 4
            };
        }

        Object.assign(this.modelConfig, config);

        // Reinitialize if already initialized
        if (this.isInitialized) {
            this.cleanup();
            await this.initialize();
        }
    }

    /**
     * Cleans up resources used by the local model.
     */
    /**
     * Handles messages from the worker thread
     */
    private handleWorkerMessage(event: MessageEvent): void {
        // Handle any general messages not caught by specific promise handlers
        if (event.data.type === 'error') {
            console.error('Worker error:', event.data.error?.message);
        }
    }

    /**
     * Handles worker errors
     */
    private handleWorkerError(error: ErrorEvent): void {
        console.error('Worker error:', error);
        this.cleanup();
    }

    cleanup(): void {
        if (this.worker) {
            this.worker.postMessage({ type: 'cleanup' });
            this.worker.terminate();
            this.worker = null;
        }
        this.isInitialized = false;
        this.workerReady = null;
    }

    /**
     * Checks if the local model is ready for transcription.
     */
    isReady(): boolean {
        return this.isInitialized && !!this.worker;
    }
}
