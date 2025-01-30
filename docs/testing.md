# Testing the AI Voice Memo Plugin

## Development Setup

1. Clone the plugin to your Obsidian test vault:
   ```bash
   cd YOUR_OBSIDIAN_VAULT/.obsidian/plugins/
   git clone https://github.com/yourusername/obsidian-ai-voice-memo.git
   ```

2. Install dependencies:
   ```bash
   cd obsidian-ai-voice-memo
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. Enable the plugin in Obsidian:
   - Open Obsidian Settings
   - Go to Community Plugins
   - Enable "AI Voice Memo" in the list
   - Grant microphone permissions when prompted

## Testing Features

### 1. Voice Recording
- Click the microphone icon in the left ribbon
- Verify the icon changes to indicate recording status
- Check that the recording animation works
- Test stopping the recording
- Verify the audio file is saved in the AI-Memo folder

### 2. Settings
- Open plugin settings
- Test each setting option:
  - Whisper model selection
  - Audio file saving toggle
  - Auto-transcription toggle
  - Summary length selection
  - Folder path configuration

### 3. Commands
- Open Command Palette (Cmd/Ctrl + P)
- Test "Start Voice Recording" command
- Test "Stop Voice Recording" command
- Verify keyboard shortcuts work

### 4. File Organization
- Check that files are created in the correct folder
- Verify date-based organization
- Confirm proper file naming

### 5. Error Handling
- Test with microphone disconnected
- Try recording with no permissions
- Attempt invalid folder paths
- Check error messages

## Reporting Issues

If you encounter any issues:

1. Check the console for error messages
2. Verify your Obsidian version
3. Check plugin settings
4. Report issues with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Console logs
   - System information

## Development Testing

### Running in Development Mode
1. Start development build:
   ```bash
   npm run dev
   ```
2. Changes will automatically rebuild

### Debug Mode
- Enable debug mode in settings
- Check console for detailed logs
- Use development tools for inspection

### Cross-Platform Testing
- Test on Windows, macOS, and Linux
- Verify mobile compatibility
- Check different Obsidian versions

## Performance Testing

### Recording
- Test long recordings (>30 minutes)
- Monitor memory usage
- Check file sizes

### Processing
- Test transcription performance
- Monitor CPU usage
- Check response times

## Security Testing

- Verify audio data handling
- Check permission management
- Test data storage security
- Validate API key handling