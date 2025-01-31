import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { DEFAULT_SETTINGS, AiVoiceMemoSettings } from '../types/settings';
import { TranscriptionError } from '../utils/errors';
import { ErrorHandler } from '../utils/error-handler';
import type AiVoiceMemoPlugin from '../main';

class AiVoiceMemoSettingTab extends PluginSettingTab {
    plugin: AiVoiceMemoPlugin;

    constructor(app: App, plugin: AiVoiceMemoPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display(): Promise<void> {
        const { containerEl } = this;
        containerEl.empty();

        this.renderApiConfiguration(containerEl);
        this.renderRecordingConfiguration(containerEl);
        this.renderTranscriptionConfiguration(containerEl);
        this.renderAnalysisConfiguration(containerEl);
        this.renderSummarizationConfiguration(containerEl);
    }

    private renderApiConfiguration(containerEl: HTMLElement): void {
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
    }

    private renderRecordingConfiguration(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Recording Configuration' });

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
    }

    private renderTranscriptionConfiguration(containerEl: HTMLElement): void {
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
                    this.display();
                }));

        if (this.plugin.settings.transcriptionModel === 'local') {
            this.renderLocalModelConfiguration(containerEl);
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
    }

    private renderLocalModelConfiguration(containerEl: HTMLElement): void {
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

    private renderAnalysisConfiguration(containerEl: HTMLElement): void {
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
    }

    private renderSummarizationConfiguration(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Summarization Configuration' });

        new Setting(containerEl)
            .setName('Enable Summaries')
            .setDesc('Automatically generate summaries for voice memos')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.summarization.enabled)
                .onChange(async (value) => {
                    this.plugin.settings.summarization.enabled = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.summarization.enabled) {
            this.renderSummarizationDetails(containerEl);
        }
    }

    private renderSummarizationDetails(containerEl: HTMLElement): void {
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

        this.renderSummarizationSections(containerEl);
        this.renderAdvancedSummarizationSettings(containerEl);
    }

    private renderSummarizationSections(containerEl: HTMLElement): void {
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
    }

    private renderAdvancedSummarizationSettings(containerEl: HTMLElement): void {
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

export class SettingsManager {
    private plugin: AiVoiceMemoPlugin;
    private settingsTab: AiVoiceMemoSettingTab | null = null;

    constructor(plugin: AiVoiceMemoPlugin) {
        this.plugin = plugin;
    }

    async loadSettings(): Promise<void> {
        try {
            this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
        } catch (error) {
            ErrorHandler.logError(error, 'Settings Load');
            this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
        }
    }

    async saveSettings(): Promise<void> {
        try {
            await this.plugin.saveData(this.plugin.settings);
        } catch (error) {
            ErrorHandler.logError(error, 'Settings Save');
            throw error;
        }
    }

    setupSettingsTab(): void {
        this.settingsTab = new AiVoiceMemoSettingTab(this.plugin.app, this.plugin);
        this.plugin.addSettingTab(this.settingsTab);
    }

    cleanup(): void {
        if (this.settingsTab) {
            // Clean up any resources if needed
            this.settingsTab = null;
        }
    }
}
