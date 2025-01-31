# Codebase Summary

## Key Components and Their Interactions

### 1. Core Plugin Components
- **AiVoiceMemoPlugin** (`src/main.ts`)
  - Main plugin entry point
  - Manages plugin lifecycle
  - Coordinates between managers
  - Handles error recovery

- **VoiceRecorderManager** (`src/managers/voice-recorder-manager.ts`)
  - Handles audio recording initialization
  - Manages recording states
  - Interfaces with Web Audio API
  - Implements compression and storage logic
  - Supports configurable audio quality

- **SettingsManager** (`src/managers/settings-manager.ts`)
  - Manages plugin settings
  - Handles settings persistence
  - Provides settings UI
  - Validates configuration

- **UiManager** (`src/managers/ui-manager.ts`)
  - Manages UI elements
  - Handles ribbon icons
  - Controls status bar
  - Provides visual feedback

- **CommandManager** (`src/managers/command-manager.ts`)
  - Registers plugin commands
  - Handles keyboard shortcuts
  - Manages command execution
  - Coordinates with UI

### 2. Worker Components
- **WhisperWorker** (`src/workers/whisper-worker.ts`)
  - Handles transcription processing
  - Manages memory usage
  - Provides progress updates
  - Implements error handling

- **WhisperModelHandler** (`src/workers/whisper-model-handler.ts`)
  - Manages Whisper model lifecycle
  - Handles model initialization
  - Controls resource cleanup
  - Provides model status

- **WhisperWorkerMonitor** (`src/workers/whisper-worker-utils.ts`)
  - Tracks performance metrics
  - Monitors memory usage
  - Provides progress reporting
  - Manages resource limits

- **NoteManager**
  - Will create and update markdown notes
  - Will manage folder structure
  - Will handle file naming and organization
  - Will implement backlink creation

### 3. Service Components
- **TranscriptionService** (`src/services/transcription-service.ts`)
  - Manages transcription workflow
  - Coordinates with workers
  - Handles API integration
  - Provides progress updates

- **WhisperLocalService** (`src/services/whisper-local-service.ts`)
  - Manages local model operations
  - Handles worker communication
  - Controls resource usage
  - Provides status updates

- **WhisperApiClient** (`src/services/whisper-api-client.ts`)
  - Handles API communication
  - Manages API keys
  - Provides error handling
  - Controls rate limiting

## Data Flow

### 1. Recording Flow
```
User Input → RecordingPanel → VoiceRecorderManager → Audio Storage
                                      ↓
                            TranscriptionService
                                      ↓
                               NoteManager
```

### 2. Settings Flow
```
User Input → SettingsPanel → SettingsManager → Configuration Storage
                                   ↓
                           Component Updates
```

### 3. Note Creation Flow
```
TranscriptionService → NoteManager → File System
                          ↓
                    Backlink Creation
                          ↓
                    Note Organization
```

## External Dependencies

### Core Dependencies
- Obsidian Plugin API
- Web Audio API
- OpenAI Whisper
- TypeScript Runtime

### Development Dependencies
- TypeScript
- ESLint
- Prettier
- Jest (for testing)

## Recent Significant Changes

### Code Organization (2025-01-31)
- Refactored into manager-based architecture
- Implemented worker-based transcription system
- Added performance monitoring and memory management
- Enhanced error handling and type safety
- Created modular component structure

### Documentation Updates
- Added detailed project structure documentation
- Updated codebase summary to reflect current architecture
- Established clear coding conventions and best practices
- Created comprehensive development guidelines

## User Feedback Integration

### Feedback Channels
- GitHub Issues
- Obsidian Community
- Direct user feedback

### Integration Process
1. Feedback collection
2. Priority assessment
3. Implementation planning
4. Development and testing
5. Release and validation

## Related Documents

### Development Guides
- [Project Roadmap](projectRoadmap.md)
- [Current Task](currentTask.md)
- [Tech Stack](techStack.md)
- [Deployment Plan](deploymentPlan.md)
- [Testing Guide](testing.md)

### Additional Resources
- [PRD](prd.md)
- User Guide (Coming Soon)
- API Documentation (Coming Soon)

## Future Development Areas

### Planned Improvements
- Enhanced error handling
- Performance optimizations
- Additional AI model support
- Mobile experience enhancements

### Technical Debt
- Initial error handling simplification
- Basic caching implementation
- Limited offline support

### Monitoring Points
- Transcription accuracy
- Processing performance
- Storage efficiency
- User interaction patterns
