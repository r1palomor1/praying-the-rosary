// ─── Saved Inspirations — Single Source of Truth ───────────────────────────
// localStorage key: sermonAI_saved_sermons (kept for backward compatibility)
// Used by: InspirationAIScreen (Saved Tab)
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sermonAI_saved_sermons';

export interface SavedInspiration {
    id: string;
    date: string;                   // ISO "YYYY-MM-DD"
    sourceText: string;             // What the inspiration was based on (e.g., Reading citation or custom topic)
    mode: string;                   // 'standard' | 'abstract'
    duration: string;               // 'short' | 'medium' | 'long'
    tone: string;                   // 'pastoral' | 'teaching' | etc.
    sourceType: 'readings' | 'starters' | 'custom'; // categorization
    response: string;               // AI response text (original language)
    lang: string;                   // origin language: 'en' | 'es'
    response_translated?: string;   // cached translation
    isTemporary?: boolean;          // true if just history, false if explicitly saved
    isFavorite?: boolean;           // true if starred
    timestamp?: number;             // to calculate 48 hour expiry
}

// ─── CRUD ──────────────────────────────────────────────────────────────────
export function loadSavedInspirations(): SavedInspiration[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const items: SavedInspiration[] = JSON.parse(raw);

        // Auto-cleanup temporary inspirations older than 48 hours
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

export function saveInspiration(item: Omit<SavedInspiration, 'id' | 'date'>): SavedInspiration {
    const inspirations = loadSavedInspirations();
    
    // De-duplication check: if an inspiration with same response/source exists within last 5 mins
    const now = Date.now();
    const duplicate = inspirations.find(s => 
        s.response === item.response && 
        s.sourceText === item.sourceText && 
        (now - (s.timestamp || 0)) < 5 * 60 * 1000
    );
    if (duplicate) return duplicate;

    const newItem: SavedInspiration = {
        ...item,
        id: now.toString(),
        timestamp: now,
        date: new Date().toISOString().split('T')[0],
        lang: item.lang || 'en',
    };
    inspirations.unshift(newItem); // newest first
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inspirations));
    return newItem;
}

export function deleteSavedInspiration(id: string): void {
    const inspirations = loadSavedInspirations().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inspirations));
}

export function updateSavedInspirationTranslation(id: string, response_translated: string): void {
    const inspirations = loadSavedInspirations().map(r =>
        r.id === id ? { ...r, response_translated } : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inspirations));
}

export function updateSavedInspirationFlags(id: string, flags: { isTemporary?: boolean, isFavorite?: boolean, timestamp?: number }): SavedInspiration | undefined {
    let updatedItem: SavedInspiration | undefined;
    const inspirations = loadSavedInspirations().map(r => {
        if (r.id === id) {
            updatedItem = { ...r, ...flags };
            return updatedItem;
        }
        return r;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inspirations));
    return updatedItem;
}
