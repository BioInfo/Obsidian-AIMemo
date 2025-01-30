import { App, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';

interface RibbonItem {
    getIcon(): string;
    setIcon(icon: string): void;
    setTooltip(tooltip: string): void;
}

interface AIVoiceMemoSettings {
	whisperModel: string;
	saveAudioFiles: boolean;
	autoTranscribe: boolean;
	summaryLength: 'short' | 'medium' | 'long';
	folderPath: string;
}

const DEFAULT_SETTINGS: AIVoiceMemoSettings = {
	whisperModel: 'base',
	saveAudioFiles: true,
	autoTranscribe: true,
	summaryLength: 'medium',
	folderPath: 'AI-Memo'
};

export default class AIVoiceMemoPlugin extends Plugin {
	settings: AIVoiceMemoSettings;
	private recorder: MediaRecorder | null = null;
	private audioChunks: Blob[] = [];
	private isRecording: boolean = false;
	private ribbonIcon: HTMLElement | null = null;

	private setRibbonIcon(isRecording: boolean) {
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

		// Add ribbon icon for recording
		this.ribbonIcon = this.addRibbonIcon(
			'microphone',
			'Start Voice Recording',
			async () => {
				if (this.isRecording) {
					await this.stopRecording();
				} else {
					await this.startRecording();
				}
			}
		);

		// Add settings tab
		this.addSettingTab(new AIVoiceMemoSettingTab(this.app, this));

		// Add commands
		this.addCommand({
			id: 'start-voice-recording',
			name: 'Start Voice Recording',
			callback: async () => {
				if (!this.isRecording) {
					await this.startRecording();
				}
			}
		});

		this.addCommand({
			id: 'stop-voice-recording',
			name: 'Stop Voice Recording',
			callback: async () => {
				if (this.isRecording) {
					await this.stopRecording();
				}
			}
		});
	}

	onunload() {
		if (this.isRecording) {
			this.stopRecording();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async startRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			this.audioChunks = [];
			this.recorder = new MediaRecorder(stream);

			this.recorder.addEventListener('dataavailable', (event) => {
				this.audioChunks.push(event.data);
			});

			this.recorder.addEventListener('stop', async () => {
				const audioBlob = new Blob(this.audioChunks, { type: 'audio/ogg; codecs=opus' });
				await this.processRecording(audioBlob);
				
				// Clean up
				stream.getTracks().forEach(track => track.stop());
				this.recorder = null;
				this.audioChunks = [];
			});

			this.recorder.start();
			this.isRecording = true;
			
			// Update UI to show recording state
			this.setRibbonIcon(true);
		} catch (error) {
			console.error('Failed to start recording:', error);
			new Notice('Failed to start recording. Please check microphone permissions.');
		}
	}

	private async stopRecording() {
		if (this.recorder && this.isRecording) {
			this.recorder.stop();
			this.isRecording = false;

			// Update UI to show stopped state
			this.setRibbonIcon(false);
		}
	}

	private async processRecording(audioBlob: Blob) {
		try {
			// Create folder if it doesn't exist
			const folderPath = this.settings.folderPath;
			if (!(await this.app.vault.adapter.exists(folderPath))) {
				await this.app.vault.createFolder(folderPath);
			}

			// Save audio file if enabled
			if (this.settings.saveAudioFiles) {
				const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
				const audioFileName = `${folderPath}/${timestamp}.ogg`;
				const arrayBuffer = await audioBlob.arrayBuffer();
				await this.app.vault.createBinary(audioFileName, arrayBuffer);
			}

			// Create note file
			const noteFileName = `${folderPath}/${new Date().toISOString().split('T')[0]}.md`;
			let noteContent = await this.createNoteContent(audioBlob);
			
			if (await this.app.vault.adapter.exists(noteFileName)) {
				const existingContent = await this.app.vault.adapter.read(noteFileName);
				noteContent = existingContent + '\n\n' + noteContent;
			}

			await this.app.vault.adapter.write(noteFileName, noteContent);
			
			new Notice('Voice memo saved successfully');
		} catch (error) {
			console.error('Failed to process recording:', error);
			new Notice('Failed to save voice memo');
		}
	}

	private async createNoteContent(audioBlob: Blob): Promise<string> {
		const timestamp = new Date().toLocaleTimeString();
		return `## Voice Memo - ${timestamp}\n\n` +
			`*Transcription pending...*\n\n` +
			`---\n`;
	}
}

class AIVoiceMemoSettingTab extends PluginSettingTab {
	plugin: AIVoiceMemoPlugin;

	constructor(app: App, plugin: AIVoiceMemoPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'AI Voice Memo Settings' });

		new Setting(containerEl)
			.setName('Whisper Model')
			.setDesc('Choose the Whisper model to use for transcription')
			.addDropdown(dropdown => dropdown
				.addOption('base', 'Base')
				.addOption('small', 'Small')
				.addOption('medium', 'Medium')
				.addOption('large', 'Large')
				.setValue(this.plugin.settings.whisperModel)
				.onChange(async (value) => {
					this.plugin.settings.whisperModel = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Save Audio Files')
			.setDesc('Keep the original audio files after transcription')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.saveAudioFiles)
				.onChange(async (value) => {
					this.plugin.settings.saveAudioFiles = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto Transcribe')
			.setDesc('Automatically transcribe recordings when completed')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoTranscribe)
				.onChange(async (value) => {
					this.plugin.settings.autoTranscribe = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Summary Length')
			.setDesc('Choose the length of generated summaries')
			.addDropdown(dropdown => dropdown
				.addOption('short', 'Short')
				.addOption('medium', 'Medium')
				.addOption('long', 'Long')
				.setValue(this.plugin.settings.summaryLength)
				.onChange(async (value: 'short' | 'medium' | 'long') => {
					this.plugin.settings.summaryLength = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Folder Path')
			.setDesc('Path where voice memos will be saved')
			.addText(text => text
				.setPlaceholder('AI-Memo')
				.setValue(this.plugin.settings.folderPath)
				.onChange(async (value) => {
					this.plugin.settings.folderPath = value;
					await this.plugin.saveSettings();
				}));
	}
}