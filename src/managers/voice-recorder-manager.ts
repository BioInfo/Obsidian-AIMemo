import { Notice } from 'obsidian';
import type AiVoiceMemoPlugin from '../main';
import { VoiceRecorderError, VoiceRecorderErrorCode, TranscriptionError } from '../utils/errors';
import type { AiVoiceMemoSettings } from '../types/settings';
import type { TranscriptionService } from '../services/transcription-service';

/**
 * Manages voice recording functionality using the Web Audio API.
 * Handles recording, saving, and cleanup of audio recordings.
 */
export class VoiceRecorderManager {
    private plugin: AiVoiceMemoPlugin;
    private transcriptionService: TranscriptionService;
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private _isRecording: boolean = false;
    private stream: MediaStream | null = null;

    constructor(plugin: AiVoiceMemoPlugin, transcriptionService: TranscriptionService) {
        this.plugin = plugin;
        this.transcriptionService = transcriptionService;
    }

    isRecording(): boolean {
        return this._isRecording;
    }

    /**
     * Starts a new voice recording session.
     * @throws {VoiceRecorderError} If recording fails to start or format is unsupported
     */
    async startRecording(): Promise<void> {
        if (this.isRecording()) {
            throw new VoiceRecorderError(
                'Already recording!',
                VoiceRecorderErrorCode.ALREADY_RECORDING
            );
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const mimeType = this.getMimeType(this.plugin.settings);
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                throw new VoiceRecorderError(
                    `Audio format ${mimeType} is not supported by your browser`,
                    VoiceRecorderErrorCode.UNSUPPORTED_FORMAT
                );
            }
            
            const options: MediaRecorderOptions = {
                mimeType,
                audioBitsPerSecond: this.getAudioBitrate(this.plugin.settings.audioQuality)
            };
            
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            this.mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
                this.audioChunks.push(event.data);
            });

            this.mediaRecorder.addEventListener('stop', () => {
                this.handleRecordingComplete();
            });

            this.mediaRecorder.start();
            this._isRecording = true;
            new Notice('Recording started');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            new Notice('Failed to start recording. Please check microphone permissions.');
        }
    }

    /**
     * Stops the current recording session.
     * @throws {VoiceRecorderError} If no active recording exists
     */
    async stopRecording(): Promise<void> {
        if (!this._isRecording || !this.mediaRecorder) {
            throw new VoiceRecorderError(
                'No active recording!',
                VoiceRecorderErrorCode.NO_RECORDING_ACTIVE
            );
        }

        this.mediaRecorder.stop();
        this.stream?.getTracks().forEach(track => track.stop());
        this._isRecording = false;
        new Notice('Recording stopped');
    }

    private async handleRecordingComplete(): Promise<void> {
        try {
            const audioBlob = new Blob(this.audioChunks, { 
                type: this.getMimeType(this.plugin.settings)
            });

            if (this.plugin.settings.saveAudioFiles) {
                await this.saveAudioFile(audioBlob);
            }

            if (this.plugin.settings.autoTranscribe) {
                const jobId = await this.transcriptionService.transcribe(audioBlob);
                new Notice('Transcription started. Job ID: ' + jobId);
            }
        } catch (error) {
            if (error instanceof TranscriptionError) {
                new Notice(`Transcription error: ${error.message}`);
            } else if (error instanceof VoiceRecorderError) {
                new Notice(`Recording error: ${error.message}`);
            } else {
                console.error('Unexpected error:', error);
                new Notice('An unexpected error occurred');
            }
            throw error;
        } finally {
            this.cleanup();
        }
    }

    /**
     * Saves the recorded audio blob to the vault.
     * @param audioBlob - The recorded audio data
     * @throws {VoiceRecorderError} If saving fails
     */
    private async saveAudioFile(audioBlob: Blob): Promise<void> {
        try {
            const fileName = `voice-memo-${new Date().toISOString()}.${this.plugin.settings.audioFormat}`;
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            await this.plugin.app.vault.adapter.writeBinary(
                `${this.plugin.settings.memoStoragePath}/${fileName}`,
                arrayBuffer
            );
            
        } catch (error) {
            console.error('Error saving audio file:', error);
            throw new VoiceRecorderError(
                'Failed to save audio file',
                VoiceRecorderErrorCode.SAVE_FAILED,
                error
            );
        }
    }

    /**
     * Gets the appropriate MIME type based on settings.
     * @param settings - The plugin settings
     * @returns The MIME type string
     */
    private getMimeType(settings: AiVoiceMemoSettings): string {
        return settings.audioFormat === 'ogg' ? 'audio/ogg' : 'audio/wav';
    }

    /**
     * Determines the audio bitrate based on quality setting.
     * @param quality - The quality level
     * @returns The bitrate in bits per second
     */
    private getAudioBitrate(quality: 'low' | 'medium' | 'high'): number {
        switch (quality) {
            case 'low':
                return 96000;  // 96kbps
            case 'medium':
                return 128000; // 128kbps
            case 'high':
                return 192000; // 192kbps
            default:
                return 128000; // Default to medium quality
        }
    }

    cleanup(): void {
        if (this._isRecording) {
            this.stopRecording();
        }
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
    }
}
