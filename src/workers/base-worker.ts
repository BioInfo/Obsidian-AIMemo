/**
 * Base class for worker message handling and lifecycle management
 */
export abstract class BaseWorker {
    protected abstract handleInitialize(config: unknown): Promise<void>;
    protected abstract handleMessage(event: MessageEvent): Promise<void>;
    protected abstract handleCleanup(): Promise<void>;

    constructor() {
        self.onmessage = this.onMessage.bind(this);
    }

    /**
     * Main message handler that provides error handling and cleanup
     */
    private async onMessage(event: MessageEvent): Promise<void> {
        try {
            await this.handleMessage(event);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Posts a message back to the main thread
     */
    protected postMessage(message: unknown): void {
        self.postMessage(message);
    }

    /**
     * Handles and formats errors before sending them to the main thread
     */
    protected abstract handleError(error: unknown): void;

    /**
     * Validates that required properties exist in a message
     */
    protected validateMessage(message: unknown, requiredProps: string[]): void {
        if (!message || typeof message !== 'object') {
            throw new Error('Invalid message format');
        }

        for (const prop of requiredProps) {
            if (!(prop in (message as Record<string, unknown>))) {
                throw new Error(`Missing required property: ${prop}`);
            }
        }
    }

    /**
     * Ensures cleanup is performed even if an error occurs
     */
    protected async withErrorHandling<T>(
        operation: () => Promise<T>,
        cleanup?: () => Promise<void>
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            this.handleError(error);
            throw error;
        } finally {
            if (cleanup) {
                try {
                    await cleanup();
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError);
                }
            }
        }
    }

    /**
     * Creates a timeout promise that rejects after the specified time
     */
    protected createTimeout(ms: number, message: string): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(message)), ms);
        });
    }

    /**
     * Runs an operation with a timeout
     */
    protected async withTimeout<T>(
        operation: Promise<T>,
        timeoutMs: number,
        timeoutMessage: string
    ): Promise<T> {
        return Promise.race([
            operation,
            this.createTimeout(timeoutMs, timeoutMessage)
        ]);
    }
}
