/**
 * Base class for custom plugin errors
 */
export abstract class PluginError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly originalError?: unknown
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class VoiceRecorderError extends PluginError {
    constructor(
        message: string,
        public readonly code: VoiceRecorderErrorCode,
        originalError?: unknown
    ) {
        super(message, code, originalError);
    }
}

export class TranscriptionError extends PluginError {
    constructor(
        message: string,
        public readonly code: TranscriptionErrorCode,
        originalError?: unknown
    ) {
        super(message, code, originalError);
    }
}

export enum VoiceRecorderErrorCode {
    ALREADY_RECORDING = 'ALREADY_RECORDING',
    NO_RECORDING_ACTIVE = 'NO_RECORDING_ACTIVE',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
    SAVE_FAILED = 'SAVE_FAILED',
    UNKNOWN = 'UNKNOWN'
}

export enum TranscriptionErrorCode {
    INVALID_AUDIO = 'INVALID_AUDIO',
    API_ERROR = 'API_ERROR',
    MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
    QUEUE_FULL = 'QUEUE_FULL',
    NOTE_CREATION_FAILED = 'NOTE_CREATION_FAILED',
    LOCAL_MODEL_ERROR = 'LOCAL_MODEL_ERROR',
    UNKNOWN = 'UNKNOWN'
}

export class SummarizationError extends PluginError {
    constructor(
        message: string,
        public readonly code: SummarizationErrorCode,
        originalError?: unknown
    ) {
        super(message, code, originalError);
    }
}

export enum SummarizationErrorCode {
    TEXT_TOO_LONG = 'TEXT_TOO_LONG',
    PROCESSING_FAILED = 'PROCESSING_FAILED',
    INVALID_OPTIONS = 'INVALID_OPTIONS',
    MODEL_ERROR = 'MODEL_ERROR',
    UNKNOWN = 'UNKNOWN'
}
