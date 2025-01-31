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
    analysis: {
        extractTasks: boolean;
        extractKeyPoints: boolean;
        includeTaskContext: boolean;
        includeTaskPriority: boolean;
        includeTaskDates: boolean;
        taskKeywords: string[];
    };
    summarization: {
        enabled: boolean;
        style: 'concise' | 'detailed' | 'bullet-points';
        maxLength: number;
        includeSections: {
            topics: boolean;
            decisions: boolean;
            questions: boolean;
        };
        chunkSize: number;
        chunkOverlap: number;
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
    },
    analysis: {
        extractTasks: true,
        extractKeyPoints: true,
        includeTaskContext: true,
        includeTaskPriority: true,
        includeTaskDates: true,
        taskKeywords: [
            'todo',
            'task',
            'action item',
            'need to',
            'have to',
            'must',
            'remember to',
            'don\'t forget'
        ]
    },
    summarization: {
        enabled: true,
        style: 'detailed',
        maxLength: 500,
        includeSections: {
            topics: true,
            decisions: true,
            questions: true
        },
        chunkSize: 1000,
        chunkOverlap: 200
    }
};
