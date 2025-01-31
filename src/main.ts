import { Plugin } from 'obsidian';
import { VoiceRecorderManager } from './managers/voice-recorder-manager';
import { TranscriptionService } from './services/transcription-service';
import { AiVoiceMemoSettings } from './types/settings';
import { UiManager } from './managers/ui-manager';
import { CommandManager } from './managers/command-manager';
import { SettingsManager } from './managers/settings-manager';
import { ErrorHandler } from './utils/error-handler';

export default class AiVoiceMemoPlugin extends Plugin {
    settings!: AiVoiceMemoSettings;
    voiceRecorderManager!: VoiceRecorderManager;
    transcriptionService!: TranscriptionService;
    private uiManager!: UiManager;
    private commandManager!: CommandManager;
    private settingsManager!: SettingsManager;

    async onload() {
        try {
            // Initialize managers
            this.settingsManager = new SettingsManager(this);
            await this.settingsManager.loadSettings();

            this.uiManager = new UiManager(this);
            this.transcriptionService = new TranscriptionService(this);
            this.voiceRecorderManager = new VoiceRecorderManager(this, this.transcriptionService);
            this.commandManager = new CommandManager(this, this.voiceRecorderManager, this.uiManager);

            // Set up UI and commands
            this.commandManager.registerCommands();
            this.commandManager.setupRibbonIcon();
            this.settingsManager.setupSettingsTab();
        } catch (error) {
            ErrorHandler.handleError(error);
        }
    }

    onunload() {
        try {
            this.voiceRecorderManager.cleanup();
            this.transcriptionService.cleanup();
            this.uiManager.cleanup();
            this.settingsManager.cleanup();
        } catch (error) {
            ErrorHandler.logError(error, 'Plugin Unload');
        }
    }

    async saveSettings() {
        await this.settingsManager.saveSettings();
    }

    setStatusBarText(text: string, timeout: number = 0): void {
        this.uiManager.setStatusBarText(text, timeout);
    }
}
