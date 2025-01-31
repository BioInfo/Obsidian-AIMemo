export interface AiVoiceMemoSettings {
    audioFormat: 'ogg' | 'wav';
    transcriptionModel: 'whisper-1' | 'local';
    autoTranscribe: boolean;
    saveAudioFiles: boolean;
    memoStoragePath: string;
    audioQuality: 'low' | 'medium' | 'high';
    openaiApiKey: string;
    validateApiKey: boolean;
    localModel: {
        modelPath: string;
        device: 'cpu' | 'gpu';
        threads: number;
        language?: string;
    };
}

export const DEFAULT_SETTINGS: AiVoiceMemoSettings = {
    audioFormat: 'ogg',
    transcriptionModel: 'whisper-1',
    autoTranscribe: true,
    saveAudioFiles: true,
    memoStoragePath: 'voice-memos',
    audioQuality: 'medium',
    openaiApiKey: '',
    validateApiKey: true,
    localModel: {
        modelPath: 'models/whisper-base.bin',
        device: 'cpu',
        threads: navigator.hardwareConcurrency || 4
    }
};
