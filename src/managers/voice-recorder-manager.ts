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
    private audioFormat: string = 'audio/webm';
    
    private readonly SUPPORTED_FORMATS = [
        'audio/webm',
        'audio/ogg',
        'audio/wav',
        'audio/mp4'
    ];

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

        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('MediaDevices API not supported');
            throw new VoiceRecorderError(
                'Your system does not support audio recording. Please ensure you are using a supported browser.',
                VoiceRecorderErrorCode.UNSUPPORTED_BROWSER
            );
        }

        try {
            console.log('Attempting to access microphone...');
            try {
                // List available audio devices first
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioDevices = devices.filter(device => device.kind === 'audioinput');
                console.log('Available audio devices:', audioDevices.map(d => ({ deviceId: d.deviceId, label: d.label })));
                
                // Request microphone access with specific constraints
                // Request basic audio access first
                this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('Microphone access granted successfully');
            } catch (error) {
                if (error instanceof DOMException && error.name === 'NotAllowedError') {
                    throw new VoiceRecorderError(
                        'Microphone access was denied. Please enable microphone access in your system settings:\n' +
                        '1. Open System Settings → Privacy & Security → Microphone\n' +
                        '2. Find Obsidian in the list\n' +
                        '3. Toggle the switch next to Obsidian to ON\n' +
                        '4. Restart Obsidian and try again',
                        VoiceRecorderErrorCode.PERMISSION_DENIED,
                        error
                    );
                }
                throw error;
            }
            
            // Test and select the best supported audio format
            this.audioFormat = await this.getBestAudioFormat();
            console.log(`Using audio format: ${this.audioFormat}`);
            
            const options: MediaRecorderOptions = {
                mimeType: this.audioFormat,
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
                type: this.audioFormat
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
            const extension = this.audioFormat.split('/')[1].split(';')[0];
            const timestamp = new Date().toISOString()
                .replace(/:/g, '-')
                .replace(/\./g, '-')
                .slice(0, 19);
            const fileName = `voice-memo-${timestamp}.${extension}`;
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
     * Tests audio formats and returns the best supported one.
     * @returns The best supported audio format
     */
    private async getBestAudioFormat(): Promise<string> {
        // Try different mime types in order of preference
        const mimeTypes = [
            'audio/webm',           // Most modern browsers
            'audio/webm;codecs=opus',// Chrome, Firefox
            'audio/ogg',            // Firefox
            'audio/ogg;codecs=opus', // Firefox
            'audio/mp4',            // Safari
            'audio/wav',            // Fallback
        ];

        // Find the first supported mime type
        const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
        if (!supportedType) {
            throw new VoiceRecorderError(
                'No supported audio format found. Please try using a different browser.',
                VoiceRecorderErrorCode.UNSUPPORTED_FORMAT
            );
        }

        return supportedType;
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
