# Obsidian AI Voice Memo Plugin

Record, transcribe, and organize voice memos with AI-powered features in Obsidian.

## Features

- 🎙️ **Voice Recording**: Record voice memos directly within Obsidian
- 🤖 **AI Transcription**: Automatically transcribe recordings using OpenAI's Whisper
- 📝 **Smart Summaries**: Generate concise summaries of your voice memos
- ✅ **Task Extraction**: Automatically identify and create tasks from your recordings
- 📁 **Organized Storage**: Automatically organize memos by date
- 🔄 **Cross-Platform**: Works on desktop and mobile devices

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "AI Voice Memo"
4. Click Install
5. Enable the plugin

### Manual Installation

1. Download the latest release from the [releases page](https://github.com/BioInfo/Obsidian-AIMemo/releases)
2. Extract the files to your vault's `.obsidian/plugins/obsidian-ai-voice-memo` directory
3. Reload Obsidian
4. Enable the plugin in Community Plugins settings

## Usage

### Recording a Voice Memo

1. Click the microphone icon in the left ribbon or use the command palette
2. Start speaking
3. Click the stop button when finished
4. Your memo will be automatically transcribed and saved

### Configuration

Configure the plugin in Settings:

- **Whisper Model**: Choose between different Whisper models
- **Auto-Transcribe**: Enable/disable automatic transcription
- **Save Audio**: Choose to keep or delete original audio files
- **Audio Quality**: Set recording quality (low/medium/high)
- **Summary Style**: Choose between concise, detailed, or bullet-point summaries
- **Storage Location**: Set where memos are saved

## Changelog

### 0.1.0 (2025-01-31)

- 🎉 First stable release
- ✨ Automatic audio format detection for better browser compatibility
- 🎨 Improved error handling and user feedback
- 🔧 Fixed file naming issues
- 📝 Enhanced transcription note formatting
- 🚀 Performance improvements

### Keyboard Shortcuts

- Start/Stop Recording: Configurable in Obsidian Hotkeys settings
- You can assign custom shortcuts to all plugin commands

## Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Obsidian 1.0.0+

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/BioInfo/Obsidian-AIMemo.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

### Testing

See [Testing Guide](docs/testing.md) for detailed testing instructions.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Obsidian](https://obsidian.md/) for the amazing platform
- [OpenAI](https://openai.com/) for Whisper
- All our [contributors](https://github.com/BioInfo/Obsidian-AIMemo/graphs/contributors)

## Support

If you encounter any issues or have questions:

1. Check the [FAQ](docs/FAQ.md)
2. Search [existing issues](https://github.com/BioInfo/Obsidian-AIMemo/issues)
3. Create a new issue if needed

## Author

Developed by J&S Group, LLC