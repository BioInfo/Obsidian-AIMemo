export interface AiVoiceMemoSettings {
    audioFormat: 'ogg' | 'wav';
    transcriptionModel: 'whisper-1' | 'local';
    autoTranscribe: boolean;
    saveAudioFiles: boolean;
    memoStoragePath: string;
    audioQuality: 'low' | 'medium' | 'high';
    openaiApiKey: string;
    validateApiKey: boolean;
}

export const DEFAULT_SETTINGS: AiVoiceMemoSettings = {
    audioFormat: 'ogg',
    transcriptionModel: 'whisper-1',
    autoTranscribe: true,
    saveAudioFiles: true,
    memoStoragePath: 'voice-memos',
    audioQuality: 'medium',
    openaiApiKey: '',
    validateApiKey: true
};
