// ─── Saved Sermons — Single Source of Truth ───────────────────────────
// localStorage key: sermonAI_saved_sermons
// Used by: SermonAIScreen (Saved Tab)
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sermonAI_saved_sermons';

export interface SavedSermon {
    id: string;
    date: string;                   // ISO "YYYY-MM-DD"
    sourceText: string;             // What the sermon was based on (e.g., Reading citation or custom topic)
    mode: string;                   // 'standard' | 'abstract'
    duration: string;               // 'short' | 'medium' | 'long'
    tone: string;                   // 'pastoral' | 'teaching' | etc.
    response: string;               // AI response text (original language)
    lang: string;                   // origin language: 'en' | 'es'
    response_translated?: string;   // cached translation
    isTemporary?: boolean;          // true if just history, false if explicitly saved
    isFavorite?: boolean;           // true if starred
    timestamp?: number;             // to calculate 48 hour expiry
}

// ─── CRUD ──────────────────────────────────────────────────────────────────
export function loadSavedSermons(): SavedSermon[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const items: SavedSermon[] = JSON.parse(raw);

        // Auto-cleanup temporary sermons older than 48 hours
        const now = Date.now();
        const fortyEightHours = 48 * 60 * 60 * 1000;
        const validItems = items.filter(item => {
            if (!item.isTemporary) return true; // Keep all permanent saves
            const age = now - (item.timestamp || parseInt(item.id) || 0);
            return age < fortyEightHours; // Keep recent temporary history
        });

        // If we cleaned up, save the cleaned array back
        if (validItems.length !== items.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems));
        }

        return validItems;
    } catch {
        return [];
    }
}

export function saveSermon(item: Omit<SavedSermon, 'id' | 'date'>): SavedSermon {
    const sermons = loadSavedSermons();
    const newItem: SavedSermon = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        lang: item.lang || 'en',
    };
    sermons.unshift(newItem); // newest first
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sermons));
    return newItem;
}

export function deleteSavedSermon(id: string): void {
    const sermons = loadSavedSermons().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sermons));
}

export function updateSavedSermonTranslation(id: string, response_translated: string): void {
    const sermons = loadSavedSermons().map(r =>
        r.id === id ? { ...r, response_translated } : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sermons));
}

export function updateSavedSermonFlags(id: string, flags: { isTemporary?: boolean, isFavorite?: boolean, timestamp?: number }): SavedSermon | undefined {
    let updatedItem: SavedSermon | undefined;
    const sermons = loadSavedSermons().map(r => {
        if (r.id === id) {
            updatedItem = { ...r, ...flags };
            return updatedItem;
        }
        return r;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sermons));
    return updatedItem;
}
