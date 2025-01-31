import { Plugin } from 'obsidian';

/**
 * Manages UI elements like ribbon icons and status bar
 */
export class UiManager {
    private plugin: Plugin;
    private ribbonIcon: HTMLElement | null = null;
    private statusBarItem: HTMLElement | null = null;
    private statusBarTimeout: NodeJS.Timeout | null = null;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    /**
     * Adds and configures the ribbon icon
     */
    addRibbonIcon(onClick: () => void): void {
        this.ribbonIcon = this.plugin.addRibbonIcon(
            'mic',
            'Start Voice Recording',
            onClick
        );
    }

    /**
     * Updates the ribbon icon state
     */
    setRibbonIcon(isRecording: boolean): void {
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

    /**
     * Sets text in the status bar with optional timeout
     */
    setStatusBarText(text: string, timeout: number = 0): void {
        if (!this.statusBarItem) {
            this.statusBarItem = this.plugin.addStatusBarItem();
        }

        this.statusBarItem.setText(text);

        if (this.statusBarTimeout) {
            clearTimeout(this.statusBarTimeout);
            this.statusBarTimeout = null;
        }

        if (timeout > 0) {
            this.statusBarTimeout = setTimeout(() => {
                this.statusBarItem?.setText('');
            }, timeout);
        }
    }

    /**
     * Cleans up UI resources
     */
    cleanup(): void {
        if (this.statusBarTimeout) {
            clearTimeout(this.statusBarTimeout);
            this.statusBarTimeout = null;
        }

        if (this.statusBarItem) {
            this.statusBarItem.remove();
            this.statusBarItem = null;
        }

        if (this.ribbonIcon) {
            this.ribbonIcon.remove();
            this.ribbonIcon = null;
        }
    }
}
