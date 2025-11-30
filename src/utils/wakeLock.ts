/**
 * Wake Lock Manager
 * Prevents screen from turning off during continuous prayer mode
 */

class WakeLockManager {
    private wakeLock: WakeLockSentinel | null = null;
    private isSupported: boolean = false;

    constructor() {
        // Check if Wake Lock API is supported
        this.isSupported = 'wakeLock' in navigator;

        if (!this.isSupported) {
            console.warn('Wake Lock API not supported on this device');
        }

        // Re-acquire wake lock when page becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.wakeLock !== null) {
                this.request();
            }
        });
    }

    /**
     * Request wake lock to keep screen on
     */
    async request(): Promise<boolean> {
        if (!this.isSupported) {
            console.log('Wake Lock not supported, screen may turn off');
            return false;
        }

        try {
            // Release existing lock if any
            await this.release();

            // Request new wake lock
            this.wakeLock = await navigator.wakeLock.request('screen');

            console.log('✅ Wake Lock acquired - screen will stay on');

            // Listen for wake lock release
            this.wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released');
            });

            return true;
        } catch (err) {
            console.error('Failed to acquire Wake Lock:', err);
            return false;
        }
    }

    /**
     * Release wake lock to allow screen to turn off
     */
    async release(): Promise<void> {
        if (this.wakeLock !== null) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                console.log('Wake Lock manually released');
            } catch (err) {
                console.error('Failed to release Wake Lock:', err);
            }
        }
    }

    /**
     * Check if wake lock is currently active
     */
    isActive(): boolean {
        return this.wakeLock !== null && !this.wakeLock.released;
    }

    /**
     * Check if Wake Lock API is supported
     */
    isWakeLockSupported(): boolean {
        return this.isSupported;
    }
}

// Export singleton instance
export const wakeLockManager = new WakeLockManager();
