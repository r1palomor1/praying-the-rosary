// ─── Saved Reflections — Single Source of Truth ───────────────────────────
// localStorage key: ai_saved_reflections
// Used by: AIChatWindow (Chat tab), future Spiritual Journal screen
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ai_saved_reflections';

export interface SavedReflection {
    id: string;
    date: string;                   // ISO "YYYY-MM-DD"
    source: string;                 // "Daily Readings" | "Bible in a Year" | "Rosary" | "Sacred Prayers"
    topic: string;                  // e.g. "First Reading (Jeremiah 17:5-10)"
    question: string;               // the user's prompt
    category: string;               // e.g. "Scripture"
    categoryIcon: string;           // emoji
    response: string;               // AI response text (original language)
    lang: string;                   // origin language: 'en' | 'es'
    response_translated?: string;   // cached Helsinki-NLP translation of response
    topic_translated?: string;
    question_translated?: string;
    isTemporary?: boolean;          // true if just history, false if explicitly saved
    isFavorite?: boolean;           // true if starred
    timestamp?: number;             // to calculate 48 hour expiry for temporary items
}

// ─── Category derivation (zero API cost — derived from prompt text) ────────
const CATEGORY_MAP: Array<{ keywords: string[]; category: string; icon: string }> = [
    { keywords: ['reflection', 'reflexión', 'reflexion'], category: 'Reflection', icon: '💭' },
    { keywords: ['explain', 'meaning', 'explicar', 'significado'], category: 'Scripture', icon: '📖' },
    { keywords: ['historical', 'history', 'context', 'histórico', 'historia', 'contexto'], category: 'History', icon: '🏛️' },
    { keywords: ['daily life', 'apply', 'practical', 'vida', 'aplicar', 'práctica'], category: 'Application', icon: '🌿' },
    { keywords: ['church teach', 'doctrine', 'catechism', 'iglesia', 'doctrina', 'catecismo'], category: 'Catechism', icon: '✝️' },
    { keywords: ['rosary', 'mystery', 'mysteries', 'rosario', 'misterio'], category: 'Rosary', icon: '📿' },
    { keywords: ['pray', 'prayer', 'orar', 'oración', 'oracion'], category: 'Prayer', icon: '🙏' },
];

export function deriveCategory(question: string): { category: string; categoryIcon: string } {
    const lower = question.toLowerCase();
    for (const { keywords, category, icon } of CATEGORY_MAP) {
        if (keywords.some(k => lower.includes(k))) {
            return { category, categoryIcon: icon };
        }
    }
    return { category: 'Personal', categoryIcon: '💬' };
}

// ─── CRUD ──────────────────────────────────────────────────────────────────
export function loadReflections(): SavedReflection[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const items: SavedReflection[] = JSON.parse(raw);

        // Auto-cleanup temporary reflections older than 48 hours
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

export function saveReflection(item: Omit<SavedReflection, 'id' | 'date'>): SavedReflection {
    const reflections = loadReflections();
    const newItem: SavedReflection = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        lang: item.lang || 'en',
    };
    reflections.unshift(newItem); // newest first
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
    return newItem;
}

export function deleteReflection(id: string): void {
    const reflections = loadReflections().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
}

/** Cache Helsinki-NLP translations on an existing saved reflection */
export function updateReflectionTranslation(id: string, translations: { response_translated?: string, topic_translated?: string, question_translated?: string }): void {
    const reflections = loadReflections().map(r =>
        r.id === id ? { ...r, ...translations } : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
}

export function updateReflectionFlags(id: string, flags: { isTemporary?: boolean, isFavorite?: boolean, timestamp?: number }): SavedReflection | undefined {
    let updatedItem: SavedReflection | undefined;
    const reflections = loadReflections().map(r => {
        if (r.id === id) {
            updatedItem = { ...r, ...flags };
            return updatedItem;
        }
        return r;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
    return updatedItem;
}

export const ALL_CATEGORIES = ['All', 'Scripture', 'Reflection', 'Prayer', 'History', 'Application', 'Catechism', 'Rosary', 'Personal'];
