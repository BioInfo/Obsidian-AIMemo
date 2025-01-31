import { Notice } from 'obsidian';
import type AiVoiceMemoPlugin from '../main';
import type { AiVoiceMemoSettings } from '../types/settings';
import { TranscriptionError, TranscriptionErrorCode } from '../utils/errors';
import { WhisperAPIClient } from './whisper-api-client';

/**
 * Represents a transcription job in the queue
 */
interface TranscriptionJob {
    id: string;
    audioBlob: Blob;
    timestamp: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: string;
    error?: string;
}

/**
 * Manages audio transcription using OpenAI's Whisper model.
 * Supports both local and API-based transcription with queue management.
 */
export class TranscriptionService {
    private plugin: AiVoiceMemoPlugin;
    private queue: TranscriptionJob[] = [];
    private isProcessing: boolean = false;
    private apiClient: WhisperAPIClient;

    constructor(plugin: AiVoiceMemoPlugin) {
        this.plugin = plugin;
        this.apiClient = new WhisperAPIClient(this.plugin.settings.openaiApiKey);
    }

    /**
     * Adds an audio blob to the transcription queue.
     * @param audioBlob - The audio data to transcribe
     * @returns The job ID for tracking
     */
    async transcribe(audioBlob: Blob): Promise<string> {
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const job: TranscriptionJob = {
            id: jobId,
            audioBlob,
            timestamp: Date.now(),
            status: 'pending'
        };

        this.queue.push(job);
        this.processQueue();

        return jobId;
    }

    /**
     * Processes the transcription queue.
     * Handles one job at a time to manage resources effectively.
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        if (this.queue.length >= 10) {
            throw new TranscriptionError(
                'Transcription queue is full. Please wait for current jobs to complete.',
                TranscriptionErrorCode.QUEUE_FULL
            );
        }

        this.isProcessing = true;
        const job = this.queue[0];
        job.status = 'processing';

        try {
            const transcription = await this.processTranscription(job.audioBlob);
            job.status = 'completed';
            job.result = transcription;

            // Create note with transcription
            await this.createTranscriptionNote(job);
            
            new Notice('Transcription completed');
        } catch (error) {
            console.error('Transcription failed:', error);
            job.status = 'failed';
            
            if (error instanceof TranscriptionError) {
                job.error = `${error.code}: ${error.message}`;
            } else {
                job.error = error instanceof Error ? error.message : 'Unknown error';
                error = new TranscriptionError(
                    job.error,
                    TranscriptionErrorCode.UNKNOWN,
                    error
                );
            }
            
            new Notice(`Transcription failed: ${job.error}`);
            throw error; // Re-throw for proper error handling upstream
        }

        // Remove completed/failed job and process next
        this.queue.shift();
        this.isProcessing = false;
        this.processQueue();
    }

    /**
     * Processes a single transcription using the configured method.
     * @param audioBlob - The audio data to transcribe
     * @returns The transcribed text
     */
    private async processTranscription(audioBlob: Blob): Promise<string> {
        const settings = this.plugin.settings;

        if (settings.transcriptionModel === 'local') {
            return this.processLocalTranscription(audioBlob);
        } else {
            return this.processApiTranscription(audioBlob);
        }
    }

    /**
     * Processes transcription using local Whisper model.
     * @param audioBlob - The audio data to transcribe
     * @returns The transcribed text
     */
    private async processLocalTranscription(audioBlob: Blob): Promise<string> {
        // TODO: Implement local Whisper model integration
        throw new TranscriptionError(
            'Local transcription not yet implemented',
            TranscriptionErrorCode.LOCAL_MODEL_ERROR
        );
    }

    /**
     * Processes transcription using OpenAI's Whisper API.
     * @param audioBlob - The audio data to transcribe
     * @returns The transcribed text
     */
    /**
     * Updates the API client with new settings
     * @param settings - The new plugin settings
     */
    updateSettings(settings: AiVoiceMemoSettings): void {
        this.apiClient.updateApiKey(settings.openaiApiKey);
    }

    /**
     * Validates the current API key configuration
     * @throws {TranscriptionError} If the API key is invalid
     */
    async validateApiKey(): Promise<void> {
        await this.apiClient.validateApiKey();
    }

    private async processApiTranscription(audioBlob: Blob): Promise<string> {
        if (!this.plugin.settings.openaiApiKey) {
            throw new TranscriptionError(
                'OpenAI API key not configured. Please add your API key in settings.',
                TranscriptionErrorCode.API_ERROR
            );
        }

        return this.apiClient.transcribe(audioBlob);
    }

    /**
     * Creates a new note with the transcription result.
     * @param job - The completed transcription job
     */
    private async createTranscriptionNote(job: TranscriptionJob): Promise<void> {
        if (!job.result) {
            throw new TranscriptionError(
                'No transcription result available',
                TranscriptionErrorCode.NOTE_CREATION_FAILED
            );
        }

        const timestamp = new Date(job.timestamp);
        const fileName = `voice-memo-${timestamp.toISOString()}.md`;
        const content = [
            '---',
            'type: voice-memo',
            `created: ${timestamp.toISOString()}`,
            '---',
            '',
            '# Voice Memo Transcription',
            '',
            job.result
        ].join('\n');

        await this.plugin.app.vault.create(
            `${this.plugin.settings.memoStoragePath}/${fileName}`,
            content
        );
    }

    /**
     * Gets the status of a transcription job.
     * @param jobId - The ID of the job to check
     * @returns The job status and result if available
     */
    getJobStatus(jobId: string): Pick<TranscriptionJob, 'status' | 'result' | 'error'> | null {
        const job = this.queue.find(j => j.id === jobId);
        if (!job) {
            return null;
        }

        return {
            status: job.status,
            result: job.result,
            error: job.error
        };
    }

    /**
     * Cleans up any resources and pending jobs.
     */
    cleanup(): void {
        this.queue = [];
        this.isProcessing = false;
    }
}
