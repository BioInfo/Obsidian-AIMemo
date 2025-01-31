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

        new Setting(containerEl)
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
                }));

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
    }
}
