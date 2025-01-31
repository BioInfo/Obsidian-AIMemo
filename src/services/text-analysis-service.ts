import { Notice } from 'obsidian';
import type AiVoiceMemoPlugin from '../main';
import type { AiVoiceMemoSettings } from '../types/settings';

interface ExtractedTask {
    text: string;
    priority?: 'high' | 'medium' | 'low';
    dueDate?: string;
    tags?: string[];
    context?: string;
}

interface AnalysisResult {
    tasks: ExtractedTask[];
    summary?: string;
    keyPoints?: string[];
}

/**
 * Analyzes transcribed text to extract tasks, summaries, and key points.
 * Uses pattern matching and NLP techniques to identify actionable items.
 */
export class TextAnalysisService {
    private plugin: AiVoiceMemoPlugin;
    private taskPatterns: RegExp[] = [];

    constructor(plugin: AiVoiceMemoPlugin) {
        this.plugin = plugin;
        this.initializePatterns();
    }

    /**
     * Initializes regex patterns for task detection.
     * These patterns match common task-related phrases and formats.
     */
    private initializePatterns(): void {
        this.taskPatterns = [
            // Action items with priority indicators
            /(?:high priority|urgent|asap):?\s*([^.!?\n]+[.!?\n])/gi,
            
            // Task markers
            /(?:todo|task|action item):?\s*([^.!?\n]+[.!?\n])/gi,
            
            // Need to/Have to phrases
            /(?:need to|have to|must)\s+([^.!?\n]+[.!?\n])/gi,
            
            // Remember to phrases
            /(?:remember to|don't forget to)\s+([^.!?\n]+[.!?\n])/gi,
            
            // Time-based tasks
            /(?:by|before|due)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week)\s*[,:]\s*([^.!?\n]+[.!?\n])/gi,
            
            // Assignment phrases
            /(?:assigned to|delegate to)\s+\w+\s*[,:]\s*([^.!?\n]+[.!?\n])/gi
        ];
    }

    /**
     * Analyzes transcribed text to extract tasks and other insights.
     * @param text - The transcribed text to analyze
     * @returns Analysis results including tasks and insights
     */
    analyze(text: string): AnalysisResult {
        const tasks = this.extractTasks(text);
        return {
            tasks,
            keyPoints: this.extractKeyPoints(text)
        };
    }

    /**
     * Extracts tasks from the given text using pattern matching.
     * @param text - The text to analyze
     * @returns Array of extracted tasks
     */
    private extractTasks(text: string): ExtractedTask[] {
        const tasks: ExtractedTask[] = [];
        const processedLines = new Set<string>(); // Avoid duplicates

        // Process each pattern
        for (const pattern of this.taskPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const taskText = match[1]?.trim();
                if (taskText && !processedLines.has(taskText.toLowerCase())) {
                    processedLines.add(taskText.toLowerCase());
                    
                    const task: ExtractedTask = {
                        text: taskText,
                        priority: this.detectPriority(match[0]),
                        dueDate: this.extractDate(match[0]),
                        tags: this.extractTags(taskText),
                        context: this.extractContext(text, match.index || 0)
                    };
                    
                    tasks.push(task);
                }
            }
        }

        return tasks;
    }

    /**
     * Detects task priority based on keywords and context.
     * @param text - The task text to analyze
     * @returns Priority level or undefined
     */
    private detectPriority(text: string): ExtractedTask['priority'] {
        const lowercaseText = text.toLowerCase();
        
        if (/urgent|asap|high priority|critical|immediately/i.test(lowercaseText)) {
            return 'high';
        }
        
        if (/soon|important|medium priority/i.test(lowercaseText)) {
            return 'medium';
        }
        
        if (/eventually|when possible|low priority/i.test(lowercaseText)) {
            return 'low';
        }

        return undefined;
    }

    /**
     * Extracts date information from task text.
     * @param text - The text to analyze
     * @returns Formatted date string or undefined
     */
    private extractDate(text: string): string | undefined {
        const dateMatch = text.match(
            /(?:by|before|due|on)\s+((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week)|(?:\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i
        );

        if (dateMatch) {
            // TODO: Implement proper date parsing and formatting
            return dateMatch[1];
        }

        return undefined;
    }

    /**
     * Extracts hashtags and mentions from task text.
     * @param text - The text to analyze
     * @returns Array of tags
     */
    private extractTags(text: string): string[] {
        const tags: string[] = [];
        
        // Extract hashtags
        const hashTags = text.match(/#[\w-]+/g);
        if (hashTags) {
            tags.push(...hashTags);
        }
        
        // Extract @mentions
        const mentions = text.match(/@[\w-]+/g);
        if (mentions) {
            tags.push(...mentions);
        }

        return tags;
    }

    /**
     * Extracts surrounding context for a task.
     * @param fullText - The complete text
     * @param matchIndex - The index where the task was found
     * @returns Context string
     */
    private extractContext(fullText: string, matchIndex: number): string {
        const contextWindow = 100; // Characters before and after
        const start = Math.max(0, matchIndex - contextWindow);
        const end = Math.min(fullText.length, matchIndex + contextWindow);
        
        return fullText.slice(start, end).trim();
    }

    /**
     * Extracts key points from the text.
     * @param text - The text to analyze
     * @returns Array of key points
     */
    private extractKeyPoints(text: string): string[] {
        const keyPoints: string[] = [];
        const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [];

        for (const sentence of sentences) {
            if (this.isKeyPoint(sentence)) {
                keyPoints.push(sentence.trim());
            }
        }

        return keyPoints;
    }

    /**
     * Determines if a sentence is likely a key point.
     * @param sentence - The sentence to analyze
     * @returns True if the sentence is a key point
     */
    private isKeyPoint(sentence: string): boolean {
        const keyPhrases = [
            /\b(?:key|main|important|significant|notable)\s+point\b/i,
            /\b(?:primarily|mainly|essentially|fundamentally)\b/i,
            /\b(?:in\s+summary|to\s+summarize|in\s+conclusion)\b/i,
            /\b(?:highlight|emphasize|stress|note)\b/i
        ];

        return keyPhrases.some(pattern => pattern.test(sentence));
    }

    /**
     * Formats extracted tasks into Obsidian task format.
     * @param tasks - The tasks to format
     * @returns Formatted task strings
     */
    formatTasks(tasks: ExtractedTask[]): string[] {
        return tasks.map(task => {
            const parts = [`- [ ] ${task.text}`];
            
            if (task.priority) {
                parts.push(`[Priority: ${task.priority}]`);
            }
            
            if (task.dueDate) {
                parts.push(`[Due: ${task.dueDate}]`);
            }
            
            if (task.tags && task.tags.length > 0) {
                parts.push(task.tags.join(' '));
            }

            return parts.join(' ');
        });
    }
}
