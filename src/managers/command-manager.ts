import { Notice, Plugin } from 'obsidian';
import { VoiceRecorderManager } from './voice-recorder-manager';
import { UiManager } from './ui-manager';
import { VoiceRecorderError } from '../utils/errors';

/**
 * Manages plugin commands and their handlers
 */
export class CommandManager {
    private plugin: Plugin;
    private voiceRecorderManager: VoiceRecorderManager;
    private uiManager: UiManager;

    constructor(
        plugin: Plugin,
        voiceRecorderManager: VoiceRecorderManager,
        uiManager: UiManager
    ) {
        this.plugin = plugin;
        this.voiceRecorderManager = voiceRecorderManager;
        this.uiManager = uiManager;
    }

    /**
     * Registers all plugin commands
     */
    registerCommands(): void {
        this.registerStartRecordingCommand();
        this.registerStopRecordingCommand();
    }

    /**
     * Handles errors from command execution
     */
    private handleError(error: unknown): void {
        if (error instanceof VoiceRecorderError) {
            new Notice(error.message);
        } else {
            console.error('Unexpected error:', error);
            new Notice('An unexpected error occurred');
        }
        this.uiManager.setRibbonIcon(false);
    }

    /**
     * Registers the start recording command
     */
    private registerStartRecordingCommand(): void {
        this.plugin.addCommand({
            id: 'start-voice-memo',
            name: 'Start Voice Memo',
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'r' }],
            callback: async () => {
                try {
                    await this.voiceRecorderManager.startRecording();
                    this.uiManager.setRibbonIcon(true);
                } catch (error) {
                    this.handleError(error);
                }
            },
        });
    }

    /**
     * Registers the stop recording command
     */
    private registerStopRecordingCommand(): void {
        this.plugin.addCommand({
            id: 'stop-voice-memo',
            name: 'Stop Voice Memo',
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 's' }],
            callback: async () => {
                try {
                    await this.voiceRecorderManager.stopRecording();
                    this.uiManager.setRibbonIcon(false);
                } catch (error) {
                    this.handleError(error);
                }
            },
        });
    }

    /**
     * Sets up the ribbon icon click handler
     */
    setupRibbonIcon(): void {
        this.uiManager.addRibbonIcon(async () => {
            try {
                if (this.voiceRecorderManager.isRecording()) {
                    await this.voiceRecorderManager.stopRecording();
                    this.uiManager.setRibbonIcon(false);
                } else {
                    await this.voiceRecorderManager.startRecording();
                    this.uiManager.setRibbonIcon(true);
                }
            } catch (error) {
                this.handleError(error);
            }
        });
    }
}
