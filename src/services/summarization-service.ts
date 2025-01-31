import { Notice } from 'obsidian';
import type AiVoiceMemoPlugin from '../main';
import type { AiVoiceMemoSettings } from '../types/settings';
import { TranscriptionError, TranscriptionErrorCode } from '../utils/errors';

interface SummaryOptions {
    maxLength?: number;
    style?: 'concise' | 'detailed' | 'bullet-points';
    focusAreas?: ('actions' | 'decisions' | 'topics' | 'questions')[];
}

interface SummaryResult {
    summary: string;
    topics?: string[];
    decisions?: string[];
    questions?: string[];
}

/**
 * Manages the generation of intelligent summaries from transcribed text.
 * Uses text analysis and chunking to create concise, meaningful summaries.
 */
export class SummarizationService {
    private plugin: AiVoiceMemoPlugin;
    private readonly CHUNK_SIZE = 1000; // Characters per chunk
    private readonly CHUNK_OVERLAP = 200; // Overlap between chunks

    constructor(plugin: AiVoiceMemoPlugin) {
        this.plugin = plugin;
    }

    /**
     * Generates a summary of the transcribed text.
     * @param text - The text to summarize
     * @param options - Summarization options
     * @returns The generated summary result
     */
    async summarize(text: string, options: SummaryOptions = {}): Promise<SummaryResult> {
        try {
            // Split long text into manageable chunks
            const chunks = this.chunkText(text);
            
            // Generate summaries for each chunk
            const chunkSummaries = await Promise.all(
                chunks.map(chunk => this.summarizeChunk(chunk, options))
            );
            
            // Combine chunk summaries
            const combinedSummary = this.combineChunkSummaries(chunkSummaries);
            
            // Extract additional insights
            return {
                summary: combinedSummary,
                topics: this.extractTopics(text),
                decisions: this.extractDecisions(text),
                questions: this.extractQuestions(text)
            };
        } catch (error) {
            console.error('Summarization failed:', error);
            throw new TranscriptionError(
                'Failed to generate summary',
                TranscriptionErrorCode.UNKNOWN,
                error
            );
        }
    }

    /**
     * Splits text into overlapping chunks for processing.
     * @param text - The text to split
     * @returns Array of text chunks
     */
    private chunkText(text: string): string[] {
        if (!text || text.length === 0) {
            return [];
        }

        const chunks: string[] = [];
        let startIndex = 0;

        while (startIndex < text.length) {
            const endIndex = Math.min(startIndex + this.CHUNK_SIZE, text.length);
            
            // Find a good break point (end of sentence)
            let breakPoint = endIndex;
            if (endIndex < text.length) {
                const searchStart = Math.max(startIndex, endIndex - 50);
                const nextPeriod = text.indexOf('.', searchStart);
                if (nextPeriod !== -1 && nextPeriod < endIndex + 50) {
                    breakPoint = nextPeriod + 1;
                }
            }

            const chunk = text.slice(startIndex, breakPoint).trim();
            if (chunk) {
                chunks.push(chunk);
            }
            
            startIndex = Math.min(breakPoint, text.length);
            if (startIndex < text.length) {
                startIndex = Math.max(startIndex - this.CHUNK_OVERLAP, 0);
            }
        }

        return chunks;
    }

    /**
     * Summarizes a single chunk of text.
     * @param chunk - The text chunk to summarize
     * @param options - Summarization options
     * @returns Summary of the chunk
     */
    private async summarizeChunk(chunk: string, options: SummaryOptions): Promise<string> {
        // TODO: Implement actual summarization logic
        // This could use OpenAI's API or a local model
        return chunk.split('.')[0] + '.'; // Temporary: just return first sentence
    }

    /**
     * Combines summaries from multiple chunks into a coherent summary.
     * @param summaries - Array of chunk summaries
     * @returns Combined summary
     */
    private combineChunkSummaries(summaries: string[]): string {
        // TODO: Implement proper summary combination
        return summaries.join('\n\n');
    }

    /**
     * Extracts main topics from the text.
     * @param text - The text to analyze
     * @returns Array of main topics
     */
    private extractTopics(text: string): string[] {
        const topics = new Set<string>();
        
        // Look for topic indicators
        const topicPatterns = [
            /discussed?\s+(\w+(?:\s+\w+){0,3})/gi,
            /regarding\s+(\w+(?:\s+\w+){0,3})/gi,
            /about\s+(\w+(?:\s+\w+){0,3})/gi,
            /topic:\s*(\w+(?:\s+\w+){0,3})/gi
        ];

        for (const pattern of topicPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    topics.add(match[1].trim());
                }
            }
        }

        return Array.from(topics);
    }

    /**
     * Extracts decisions from the text.
     * @param text - The text to analyze
     * @returns Array of decisions
     */
    private extractDecisions(text: string): string[] {
        const decisions = new Set<string>();
        
        // Look for decision indicators
        const decisionPatterns = [
            /decided\s+to\s+([^.!?\n]+[.!?\n])/gi,
            /decision:\s*([^.!?\n]+[.!?\n])/gi,
            /agreed\s+to\s+([^.!?\n]+[.!?\n])/gi,
            /conclusion:\s*([^.!?\n]+[.!?\n])/gi
        ];

        for (const pattern of decisionPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    decisions.add(match[1].trim());
                }
            }
        }

        return Array.from(decisions);
    }

    /**
     * Extracts questions from the text.
     * @param text - The text to analyze
     * @returns Array of questions
     */
    private extractQuestions(text: string): string[] {
        const questions = new Set<string>();
        
        // Split text into sentences and identify questions
        const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [];
        for (const sentence of sentences) {
            if (
                sentence.trim().endsWith('?') ||
                /^(?:what|who|where|when|why|how)\b/i.test(sentence.trim())
            ) {
                questions.add(sentence.trim());
            }
        }

        return Array.from(questions);
    }

    /**
     * Formats the summary result into a markdown string.
     * @param result - The summary result to format
     * @returns Formatted markdown string
     */
    formatSummary(result: SummaryResult): string {
        const parts: string[] = [
            '## Summary',
            '',
            result.summary,
            ''
        ];

        if (result.topics && result.topics.length > 0) {
            parts.push(
                '',
                '### Topics Discussed',
                ...result.topics.map(topic => `- ${topic}`),
                ''
            );
        }

        if (result.decisions && result.decisions.length > 0) {
            parts.push(
                '',
                '### Decisions Made',
                ...result.decisions.map(decision => `- ${decision}`),
                ''
            );
        }

        if (result.questions && result.questions.length > 0) {
            parts.push(
                '',
                '### Questions Raised',
                ...result.questions.map(question => `- ${question}`),
                ''
            );
        }

        return parts.join('\n');
    }
}
