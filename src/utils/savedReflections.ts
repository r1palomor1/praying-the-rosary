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
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveReflection(item: Omit<SavedReflection, 'id' | 'date'>): SavedReflection {
    const reflections = loadReflections();
    const newItem: SavedReflection = {
        ...item,
        id: Date.now().toString(),
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

export const ALL_CATEGORIES = ['All', 'Scripture', 'Reflection', 'Prayer', 'History', 'Application', 'Catechism', 'Rosary', 'Personal'];
