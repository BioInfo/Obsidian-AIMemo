Obsidian AI Voice Memo Plugin - Full Feature Specification

Overview

The Obsidian AI Voice Memo Plugin is designed to enhance productivity by enabling users to record voice memos, transcribe them, and generate structured notes with summaries and tasks. The plugin leverages OpenAI's Whisper (local or API-based) for transcription and supports integration with Obsidian's core features, such as backlinks, task management, and note linking.

Goals

Provide seamless voice recording functionality within Obsidian.

Automate transcription, summarization, and task extraction using AI.

Organize all memos under an AI-Memo folder, categorized by date.

Allow customization of transcription and summarization settings.

Ensure compatibility with other popular Obsidian plugins.

Features

1. Voice Recording

Description: Users can start and stop recording voice memos using a keyboard shortcut or command palette.

Recording Process:

Initiated via keyboard shortcut or command palette.

Mobile users can access recordings through quick commands.

Audio Format:

Audio is saved in a compressed .ogg format to minimize file size.

Files are stored under AI-Memo/YYYYMMDD/ within the user's Obsidian vault.

2. Transcription

Description: Automatically transcribe recorded audio using Whisper (local or API).

Integration:

Users can choose between local processing (Whisper) or API-based processing.

Transcription appears in real-time or after recording.

Output:

Well-formatted text with timestamps (optional).

Bullet points and sections for readability.

3. Summarization & Action Item Extraction

Description: Generate summaries and identify tasks from the transcriptions.

Summarization:

High-level TLDR summary inserted at the top of the note.

Detailed outline follows, structured by key sections.

Action Items:

Tasks are extracted automatically based on keywords (e.g., "next step," "to-do").

Tasks are inserted as Obsidian tasks (- [ ] Task) and linked to related notes.

4. Note Organization

Description: Organize notes and memos under the AI-Memo folder, with automatic date-based categorization.

Structure:

Notes are saved in YYYYMMDD.md files.

Each note contains sections for the summary, detailed transcription, and tasks.

5. Customization

Description: Users can configure plugin settings, including transcription, summarization, and task extraction preferences.

Settings:

Whisper model options (e.g., language, accuracy vs. speed).

Summarization length and style.

Keywords for task extraction.

6. Integration with Obsidian Features

Description: Leverage core Obsidian features to enhance note linking and task management.

Backlinks:

Summaries and tasks automatically reference related notes.

Compatibility:

Supports integration with Daily Notes, Kanban boards, and other task management plugins.

7. Permissions & Security

Description: Ensure secure handling of audio recordings and transcriptions.

Permissions:

The plugin requests microphone access during recording.

Audio data is only processed locally unless the user opts for an API.

Security:

No external data uploads without user consent.

Audio and transcription files are encrypted (optional).

8. User Interface

Description: Provide an intuitive interface for managing recordings and transcriptions.

Recording Panel:

Start/stop buttons with visual indicators.

Status updates (e.g., "Recording in progress...").

Settings Panel:

Accessible via the Obsidian settings menu.

Options for customizing transcription, summarization, and tasks.

9. Error Handling

Description: Handle errors gracefully to minimize disruptions.

Initial Implementation:

Basic error messages (e.g., "Recording failed").

Retry options for failed transcriptions.

Future Enhancements:

Detailed error logging and reporting.

Technical Requirements

1. Technology Stack

Frontend:

Obsidian Plugin API (TypeScript)

Web Audio API (for voice recording)

Backend:

OpenAI Whisper (local model or API integration)

2. External Dependencies

Audio Processing: Web Audio API

Transcription: OpenAI Whisper

Summarization: OpenAI GPT (optional future enhancement)

3. Data Storage

Audio files and notes are saved locally within the Obsidian vault.

4. Platform Support

Desktop (Windows, macOS, Linux)

Mobile (iOS, Android)

Development Phases

Phase 1: Core Features

Implement voice recording and audio file storage.

Develop transcription integration using Whisper.

Generate structured notes with summaries and tasks.

Phase 2: Customization & Integration

Add settings for transcription, summarization, and task preferences.

Integrate with Obsidian features (backlinks, Daily Notes).

Phase 3: Testing & Deployment

Conduct cross-platform testing.

Publish the plugin on Obsidian's community plugin marketplace.

Phase 4: Enhancements

Implement advanced error handling.

Add support for refining transcriptions and summaries.

Explore offline mode support.

Documentation

User Guide: Instructions on installing and using the plugin.

Developer Documentation: Overview of the codebase, architecture, and APIs.

Completion Criteria

Fully functional plugin with all core features implemented.

Positive user feedback from beta testing.

Published and available in the Obsidian community plugin marketplace.

Notes

Consider scalability for supporting additional AI models and APIs.

Regularly update the plugin based on user feedback and evolving requirements.

