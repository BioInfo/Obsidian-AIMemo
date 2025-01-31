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

## [Unreleased]
### Planned
- OpenAI Whisper API integration
- Local Whisper model support
- Task extraction from transcriptions
- Smart summaries of voice memos
- Mobile-specific UI improvements
- Cross-platform testing and optimization
