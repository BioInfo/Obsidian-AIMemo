import { Notice } from 'obsidian';
import { VoiceRecorderError, TranscriptionError } from './errors';

/**
 * Centralizes error handling logic
 */
export class ErrorHandler {
    /**
     * Handles errors from any plugin operation
     */
    static handleError(error: unknown): void {
        if (error instanceof VoiceRecorderError || error instanceof TranscriptionError) {
            new Notice(error.message);
        } else {
            console.error('Unexpected error:', error);
            new Notice('An unexpected error occurred');
        }
    }

    /**
     * Logs an error with optional context
     */
    static logError(error: unknown, context?: string): void {
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (context) {
            console.error(`[${context}] ${message}`, error);
        } else {
            console.error(message, error);
        }
    }

    /**
     * Shows a notice to the user
     */
    static showNotice(message: string): void {
        new Notice(message);
    }
}
