# Changelog

All notable changes to the Obsidian AI Voice Memo Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha.1] - 2025-01-31

### Added
- Initial plugin structure and core functionality
- Voice recording capabilities with configurable quality settings
- Support for OGG and WAV audio formats
- Basic transcription service architecture
- Settings panel with audio format and quality controls
- Keyboard shortcuts for recording (Mod+Shift+R to start, Mod+Shift+S to stop)
- Ribbon icon with recording status indication
- Error handling system for recording and transcription
- Documentation framework

### Technical
- TypeScript strict mode configuration
- Modular architecture for recording and transcription services
- Queue-based transcription processing system
- Comprehensive error handling with custom error types
- Support for both local and cloud-based Whisper integration (stubbed)

### Documentation
- Initial README with features and installation instructions
- Contributing guidelines
- Project structure documentation
- Development setup instructions

## [0.1.0-alpha.3] - 2025-01-31

### Added
- Local Whisper model infrastructure with Web Worker support
- Local model configuration options (threads, device, language)
- Worker-based transcription processing
- Enhanced settings UI for local model configuration

### Changed
- Improved error handling for both API and local transcription
- Updated settings organization with conditional sections
- Enhanced worker communication system

## [0.1.0-alpha.2] - 2025-01-31

### Added
- OpenAI Whisper API integration with queue management
- API key configuration in settings
- API key validation functionality
- Secure API key storage

### Changed
- Enhanced settings UI with organized sections
- Improved error handling for API interactions

## [0.1.0-alpha.4] - 2025-01-31

### Added
- Task extraction from transcriptions
- Key points identification
- Configurable task detection settings
- Task priority and due date detection
- Context-aware task extraction
- Enhanced note formatting with tasks and key points

### Changed
- Updated settings UI with analysis configuration
- Improved note creation with structured sections
- Enhanced error handling for analysis features

## [0.1.0-alpha.5] - 2025-01-31

### Added
- Smart summaries of voice memos with configurable styles
- Topic, decision, and question extraction
- Chunk-based processing for long transcriptions
- Advanced summarization settings
- Conditional UI for summary configuration

### Changed
- Enhanced note creation with structured summaries
- Improved error handling for summarization
- Updated settings UI with summarization section

## [Unreleased]
### Planned
- Mobile-specific UI improvements
- Cross-platform testing and optimization
