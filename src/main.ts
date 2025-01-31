import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { VoiceRecorderManager } from './managers/voice-recorder-manager';
import { TranscriptionService } from './services/transcription-service';
import { DEFAULT_SETTINGS, AiVoiceMemoSettings } from './types/settings';
import { VoiceRecorderError, TranscriptionError } from './utils/errors';

export default class AiVoiceMemoPlugin extends Plugin {
    settings!: AiVoiceMemoSettings;
    voiceRecorderManager!: VoiceRecorderManager;
    transcriptionService!: TranscriptionService;
    private ribbonIcon: HTMLElement | null = null;

    private setRibbonIcon(isRecording: boolean): void {
        if (this.ribbonIcon) {
            const buttonEl = this.ribbonIcon.querySelector('.ribbon-button') as HTMLElement;
            if (isRecording) {
                buttonEl.innerHTML = '<svg viewBox="0 0 100 100" class="svg-icon"><rect width="100" height="100"/></svg>';
                buttonEl.setAttribute('aria-label', 'Stop Recording');
                this.ribbonIcon.addClass('recording-active');
            } else {
                buttonEl.innerHTML = '<svg viewBox="0 0 100 100" class="svg-icon"><circle cx="50" cy="50" r="40"/></svg>';
                buttonEl.setAttribute('aria-label', 'Start Voice Recording');
                this.ribbonIcon.removeClass('recording-active');
            }
        }
    }

    async onload() {
        await this.loadSettings();
        
        // Initialize services
        this.transcriptionService = new TranscriptionService(this);
        this.voiceRecorderManager = new VoiceRecorderManager(this, this.transcriptionService);
        
        // Add ribbon icon for recording
        this.ribbonIcon = this.addRibbonIcon(
            'mic',
            'Start Voice Recording',
            async () => {
                try {
                    if (this.voiceRecorderManager.isRecording()) {
                        await this.voiceRecorderManager.stopRecording();
                        this.setRibbonIcon(false);
                    } else {
                        await this.voiceRecorderManager.startRecording();
                        this.setRibbonIcon(true);
                    }
                } catch (error) {
                    this.handleError(error);
                    this.setRibbonIcon(false);
                }
            }
        );
        
        // Add settings tab
        this.addSettingTab(new AiVoiceMemoSettingTab(this.app, this));
        
        // Add voice memo commands
        this.addCommand({
            id: 'start-voice-memo',
            name: 'Start Voice Memo',
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'r' }],
            callback: async () => {
                try {
                    await this.voiceRecorderManager.startRecording();
                    this.setRibbonIcon(true);
                } catch (error) {
                    this.handleError(error);
                    this.setRibbonIcon(false);
                }
            },
        });

        this.addCommand({
            id: 'stop-voice-memo',
            name: 'Stop Voice Memo',
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 's' }],
            callback: async () => {
                try {
                    await this.voiceRecorderManager.stopRecording();
                    this.setRibbonIcon(false);
                } catch (error) {
                    this.handleError(error);
                    this.setRibbonIcon(false);
                }
            },
        });
    }

    /**
     * Handles errors from the voice recorder and transcription services
     */
    private handleError(error: unknown): void {
        if (error instanceof VoiceRecorderError || error instanceof TranscriptionError) {
            new Notice(error.message);
        } else {
            console.error('Unexpected error:', error);
            new Notice('An unexpected error occurred');
        }
    }

    onunload() {
        this.voiceRecorderManager.cleanup();
        this.transcriptionService.cleanup();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

export class AiVoiceMemoSettingTab extends PluginSettingTab {
    plugin: AiVoiceMemoPlugin;

    constructor(app: App, plugin: AiVoiceMemoPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display(): Promise<void> {
        const { containerEl } = this;
        containerEl.empty();

        // API Configuration Section
        containerEl.createEl('h3', { text: 'API Configuration' });

        const apiKeySetting = new Setting(containerEl)
            .setName('OpenAI API Key')
            .setDesc('Your OpenAI API key for Whisper transcription')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.openaiApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openaiApiKey = value;
                    await this.plugin.saveSettings();
                    this.plugin.transcriptionService.updateSettings(this.plugin.settings);
                })
                .inputEl.setAttribute('type', 'password'));

        // Add validate button next to API key
        apiKeySetting.addButton(button => button
            .setButtonText('Validate')
            .onClick(async () => {
                button.setDisabled(true);
                try {
                    await this.plugin.transcriptionService.validateApiKey();
                    new Notice('API key is valid');
                } catch (error) {
                    if (error instanceof TranscriptionError) {
                        new Notice(error.message);
                    } else {
                        new Notice('Failed to validate API key');
                    }
                } finally {
                    button.setDisabled(false);
                }
            }));

        new Setting(containerEl)
            .setName('Validate API Key on Change')
            .setDesc('Automatically validate API key when it is changed')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.validateApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.validateApiKey = value;
                    await this.plugin.saveSettings();
                }));

        // Recording Configuration Section
        containerEl.createEl('h3', { text: 'Recording Configuration' });

        new Setting(containerEl)
            .setName('Audio Format')
            .setDesc('Choose the format for saving audio files')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'ogg': 'OGG (Better Compression)',
                    'wav': 'WAV (Better Quality)'
                })
                .setValue(this.plugin.settings.audioFormat)
                .onChange(async (value) => {
                    this.plugin.settings.audioFormat = value as 'ogg' | 'wav';
                    await this.plugin.saveSettings();
                }));

        // Transcription Configuration Section
        containerEl.createEl('h3', { text: 'Transcription Configuration' });

        const modelSetting = new Setting(containerEl)
            .setName('Transcription Model')
            .setDesc('Select the Whisper model to use for transcription')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'whisper-1': 'OpenAI Whisper (Cloud)',
                    'local': 'Local Whisper Model'
                })
                .setValue(this.plugin.settings.transcriptionModel)
                .onChange(async (value) => {
                    this.plugin.settings.transcriptionModel = value as 'whisper-1' | 'local';
                    await this.plugin.saveSettings();
                    // Refresh display to show/hide relevant settings
                    this.display();
                }));

        // Show local model settings only when local model is selected
        if (this.plugin.settings.transcriptionModel === 'local') {
            containerEl.createEl('h3', { text: 'Local Model Configuration' });

            new Setting(containerEl)
                .setName('Model Path')
                .setDesc('Path to the Whisper model file')
                .addText(text => text
                    .setPlaceholder('models/whisper-base.bin')
                    .setValue(this.plugin.settings.localModel.modelPath)
                    .onChange(async (value) => {
                        this.plugin.settings.localModel.modelPath = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Processing Device')
                .setDesc('Select the device to use for transcription')
                .addDropdown(dropdown => dropdown
                    .addOptions({
                        'cpu': 'CPU',
                        'gpu': 'GPU (if available)'
                    })
                    .setValue(this.plugin.settings.localModel.device)
                    .onChange(async (value) => {
                        this.plugin.settings.localModel.device = value as 'cpu' | 'gpu';
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Thread Count')
                .setDesc('Number of threads to use for processing (default: auto)')
                .addSlider(slider => slider
                    .setLimits(1, Math.max(navigator.hardwareConcurrency || 4, 1), 1)
                    .setValue(this.plugin.settings.localModel.threads)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.localModel.threads = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Language')
                .setDesc('Optional: Specify language for better accuracy (leave empty for auto-detect)')
                .addText(text => text
                    .setPlaceholder('en, fr, de, etc.')
                    .setValue(this.plugin.settings.localModel.language || '')
                    .onChange(async (value) => {
                        this.plugin.settings.localModel.language = value || undefined;
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName('Auto-Transcribe')
            .setDesc('Automatically transcribe recordings when they finish')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoTranscribe)
                .onChange(async (value) => {
                    this.plugin.settings.autoTranscribe = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Save Audio Files')
            .setDesc('Keep the audio files after transcription')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.saveAudioFiles)
                .onChange(async (value) => {
                    this.plugin.settings.saveAudioFiles = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Storage Path')
            .setDesc('Path where voice memos will be stored')
            .addText(text => text
                .setPlaceholder('voice-memos')
                .setValue(this.plugin.settings.memoStoragePath)
                .onChange(async (value) => {
                    this.plugin.settings.memoStoragePath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Audio Quality')
            .setDesc('Set the quality level for audio recording')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'low': 'Low (Smaller Files)',
                    'medium': 'Medium (Balanced)',
                    'high': 'High (Better Quality)'
                })
                .setValue(this.plugin.settings.audioQuality)
                .onChange(async (value) => {
                    this.plugin.settings.audioQuality = value as 'low' | 'medium' | 'high';
                    await this.plugin.saveSettings();
                }));

        // Analysis Configuration Section
        containerEl.createEl('h3', { text: 'Analysis Configuration' });

        new Setting(containerEl)
            .setName('Extract Tasks')
            .setDesc('Automatically identify and extract tasks from transcriptions')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.analysis.extractTasks)
                .onChange(async (value) => {
                    this.plugin.settings.analysis.extractTasks = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Extract Key Points')
            .setDesc('Identify and extract key points from transcriptions')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.analysis.extractKeyPoints)
                .onChange(async (value) => {
                    this.plugin.settings.analysis.extractKeyPoints = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Include Task Context')
            .setDesc('Include surrounding context with extracted tasks')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.analysis.includeTaskContext)
                .onChange(async (value) => {
                    this.plugin.settings.analysis.includeTaskContext = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Include Task Priority')
            .setDesc('Detect and include task priority levels')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.analysis.includeTaskPriority)
                .onChange(async (value) => {
                    this.plugin.settings.analysis.includeTaskPriority = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Include Task Dates')
            .setDesc('Extract and include due dates from tasks')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.analysis.includeTaskDates)
                .onChange(async (value) => {
                    this.plugin.settings.analysis.includeTaskDates = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Task Keywords')
            .setDesc('Keywords used to identify tasks (comma-separated)')
            .addTextArea(text => text
                .setPlaceholder('todo, task, need to, have to, must')
                .setValue(this.plugin.settings.analysis.taskKeywords.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.analysis.taskKeywords = value
                        .split(',')
                        .map(keyword => keyword.trim())
                        .filter(keyword => keyword.length > 0);
                    await this.plugin.saveSettings();
                }));

        // Summarization Configuration Section
        containerEl.createEl('h3', { text: 'Summarization Configuration' });

        new Setting(containerEl)
            .setName('Enable Summaries')
            .setDesc('Automatically generate summaries for voice memos')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.summarization.enabled)
                .onChange(async (value) => {
                    this.plugin.settings.summarization.enabled = value;
                    await this.plugin.saveSettings();
                    // Refresh display to show/hide related settings
                    this.display();
                }));

        if (this.plugin.settings.summarization.enabled) {
            new Setting(containerEl)
                .setName('Summary Style')
                .setDesc('Choose how summaries should be formatted')
                .addDropdown(dropdown => dropdown
                    .addOptions({
                        'concise': 'Concise (Brief overview)',
                        'detailed': 'Detailed (Comprehensive)',
                        'bullet-points': 'Bullet Points (Key items)'
                    })
                    .setValue(this.plugin.settings.summarization.style)
                    .onChange(async (value) => {
                        this.plugin.settings.summarization.style = value as 'concise' | 'detailed' | 'bullet-points';
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Maximum Length')
                .setDesc('Maximum length of generated summaries (in characters)')
                .addSlider(slider => slider
                    .setLimits(100, 1000, 100)
                    .setValue(this.plugin.settings.summarization.maxLength)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.summarization.maxLength = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Include Topics')
                .setDesc('Extract and list main topics discussed')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.summarization.includeSections.topics)
                    .onChange(async (value) => {
                        this.plugin.settings.summarization.includeSections.topics = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Include Decisions')
                .setDesc('Extract and list decisions made')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.summarization.includeSections.decisions)
                    .onChange(async (value) => {
                        this.plugin.settings.summarization.includeSections.decisions = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Include Questions')
                .setDesc('Extract and list questions raised')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.summarization.includeSections.questions)
                    .onChange(async (value) => {
                        this.plugin.settings.summarization.includeSections.questions = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Advanced: Chunk Size')
                .setDesc('Size of text chunks for processing (in characters)')
                .addSlider(slider => slider
                    .setLimits(500, 2000, 100)
                    .setValue(this.plugin.settings.summarization.chunkSize)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.summarization.chunkSize = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Advanced: Chunk Overlap')
                .setDesc('Overlap between text chunks for better context')
                .addSlider(slider => slider
                    .setLimits(50, 500, 50)
                    .setValue(this.plugin.settings.summarization.chunkOverlap)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.summarization.chunkOverlap = value;
                        await this.plugin.saveSettings();
                    }));
        }
    }
}
