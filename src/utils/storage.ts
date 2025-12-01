import type { UserSession, AppSettings, Language } from '../types';

const STORAGE_KEYS = {
    SESSION: 'rosary_session',
    SETTINGS: 'rosary_settings',
    LANGUAGE: 'rosary_language',
    PRAYER_PROGRESS: 'rosary_prayer_progress'
} as const;

export interface PrayerProgress {
    mysteryType: string;
    currentStepIndex: number;
    date: string;
    language: string;
}

/**
 * Save user session to localStorage
 */
export function saveSession(session: UserSession): void {
    try {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch (error) {
        console.error('Failed to save session:', error);
    }
}

/**
 * Load user session from localStorage
 */
export function loadSession(): UserSession | null {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SESSION);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to load session:', error);
        return null;
    }
}

/**
 * Clear user session from localStorage
 */
export function clearSession(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (error) {
        console.error('Failed to clear session:', error);
    }
}

/**
 * Check if there's an active session for today
 */
export function hasActiveSession(): boolean {
    const session = loadSession();
    if (!session) return false;

    const today = new Date().toISOString().split('T')[0];
    return session.date === today && !session.completed;
}

/**
 * Save app settings to localStorage
 */
export function saveSettings(settings: AppSettings): void {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

/**
 * Load app settings from localStorage
 */
export function loadSettings(): AppSettings | null {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to load settings:', error);
        return null;
    }
}

/**
 * Get default settings
 */
export function getDefaultSettings(): AppSettings {
    return {
        language: 'en',
        theme: 'dark',
        audioEnabled: true,
        volume: 0.8,
        fontSize: 'normal'
    };
}

/**
 * Save language preference
 */
export function saveLanguage(language: Language): void {
    try {
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch (error) {
        console.error('Failed to save language:', error);
    }
}

/**
 * Load language preference
 */
export function loadLanguage(): Language | null {
    try {
        const lang = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
        return (lang === 'en' || lang === 'es') ? lang : null;
    } catch (error) {
        console.error('Failed to load language:', error);
        return null;
    }
}

/**
 * Save prayer progress (current step in prayer flow)
 * Now supports per-mystery storage
 */
export function savePrayerProgress(progress: PrayerProgress): void {
    try {
        // Store progress with mystery type in the key for independent tracking
        const key = `${STORAGE_KEYS.PRAYER_PROGRESS}_${progress.mysteryType}`;
        localStorage.setItem(key, JSON.stringify(progress));
    } catch (error) {
        console.error('Failed to save prayer progress:', error);
    }
}

/**
 * Load prayer progress for a specific mystery type
 */
export function loadPrayerProgress(mysteryType?: string): PrayerProgress | null {
    try {
        if (mysteryType) {
            // Load progress for specific mystery
            const key = `${STORAGE_KEYS.PRAYER_PROGRESS}_${mysteryType}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } else {
            // Legacy: try to load from old single-key storage
            const data = localStorage.getItem(STORAGE_KEYS.PRAYER_PROGRESS);
            return data ? JSON.parse(data) : null;
        }
    } catch (error) {
        console.error('Failed to load prayer progress:', error);
        return null;
    }
}

/**
 * Clear prayer progress for a specific mystery type, or all if not specified
 */
export function clearPrayerProgress(mysteryType?: string): void {
    try {
        if (mysteryType) {
            // Clear specific mystery progress
            const key = `${STORAGE_KEYS.PRAYER_PROGRESS}_${mysteryType}`;
            localStorage.removeItem(key);
        } else {
            // Clear all prayer progress (all mystery types)
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(STORAGE_KEYS.PRAYER_PROGRESS)) {
                    localStorage.removeItem(key);
                }
            });
        }
    } catch (error) {
        console.error('Failed to clear prayer progress:', error);
    }
}

/**
 * Check if there's valid prayer progress for today for a specific mystery
 */
export function hasValidPrayerProgress(mysteryType?: string): boolean {
    const progress = loadPrayerProgress(mysteryType);
    if (!progress) return false;

    const today = new Date().toISOString().split('T')[0];
    return progress.date === today;
}
