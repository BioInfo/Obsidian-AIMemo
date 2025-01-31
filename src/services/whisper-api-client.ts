import { Notice } from 'obsidian';
import { TranscriptionError, TranscriptionErrorCode } from '../utils/errors';

interface WhisperAPIResponse {
    text: string;
    task?: string;
    language?: string;
    duration?: number;
}

/**
 * Client for interacting with OpenAI's Whisper API.
 * Handles audio transcription requests and responses.
 */
export class WhisperAPIClient {
    private apiKey: string;
    private baseUrl = 'https://api.openai.com/v1/audio/transcriptions';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Transcribes audio using OpenAI's Whisper API.
     * @param audioBlob - The audio data to transcribe
     * @returns The transcribed text
     * @throws {TranscriptionError} If the API request fails
     */
    async transcribe(audioBlob: Blob): Promise<string> {
        if (!this.apiKey) {
            throw new TranscriptionError(
                'OpenAI API key not configured',
                TranscriptionErrorCode.API_ERROR
            );
        }

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.wav');
            formData.append('model', 'whisper-1');
            formData.append('response_format', 'json');

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
                throw new TranscriptionError(
                    `API Error: ${error.error?.message || response.statusText}`,
                    TranscriptionErrorCode.API_ERROR
                );
            }

            const result = await response.json() as WhisperAPIResponse;
            
            if (!result.text) {
                throw new TranscriptionError(
                    'API returned empty transcription',
                    TranscriptionErrorCode.API_ERROR
                );
            }

            return result.text;

        } catch (error) {
            if (error instanceof TranscriptionError) {
                throw error;
            }

            console.error('Whisper API error:', error);
            throw new TranscriptionError(
                'Failed to transcribe audio',
                TranscriptionErrorCode.API_ERROR,
                error
            );
        }
    }

    /**
     * Updates the API key.
     * @param newKey - The new API key to use
     */
    updateApiKey(newKey: string): void {
        this.apiKey = newKey;
    }

    /**
     * Validates the current API key by making a test request.
     * @throws {TranscriptionError} If the API key is invalid
     */
    async validateApiKey(): Promise<void> {
        if (!this.apiKey) {
            throw new TranscriptionError(
                'OpenAI API key not configured',
                TranscriptionErrorCode.API_ERROR
            );
        }

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                }
            });

            if (!response.ok) {
                throw new TranscriptionError(
                    'Invalid API key',
                    TranscriptionErrorCode.API_ERROR
                );
            }
        } catch (error) {
            throw new TranscriptionError(
                'Failed to validate API key',
                TranscriptionErrorCode.API_ERROR,
                error
            );
        }
    }
}
