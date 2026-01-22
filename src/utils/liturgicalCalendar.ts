
// Interface matching our API response
export interface LiturgicalCelebration {
    title: string;
    colour: string;
    rank: string;
    rank_num: number;
}

export interface LiturgicalDay {
    date: string;
    season: string;
    season_week: number;
    celebrations: LiturgicalCelebration[];
    weekday: string;
}

// Map Romcal colors to our specific hex values
export const getLiturgicalColorHex = (colorName: string): string => {
    const lower = colorName ? colorName.toLowerCase() : 'green';
    if (lower.includes('green')) return '#10B981'; // emerald-500
    if (lower.includes('violet') || lower.includes('purple')) return '#8B5CF6'; // violet-500
    if (lower.includes('white')) return '#F3F4F6'; // gray-100
    if (lower.includes('red')) return '#EF4444'; // red-500
    if (lower.includes('rose') || lower.includes('pink')) return '#EC4899'; // pink-500
    if (lower.includes('black')) return '#6B7280'; // gray-500
    if (lower.includes('gold')) return '#F59E0B'; // amber-500
    return '#10B981'; // default
};

export const getSeasonName = (season: string, language: string = 'en'): string => {
    if (!season) return language === 'es' ? 'Tiempo Ordinario' : 'Ordinary Time';

    // Normalize: replace underscores with spaces and convert to lowercase
    const normalized = season.replace(/_/g, ' ').toLowerCase();

    // Handle specific Spanish translations
    if (language === 'es') {
        if (normalized.includes('ordinary')) return 'Tiempo Ordinario';
        if (normalized.includes('advent')) return 'Adviento';
        if (normalized.includes('christmas')) return 'Navidad';
        if (normalized.includes('lent')) return 'Cuaresma';
        if (normalized.includes('easter')) return 'Pascua';
    }

    // Default English formatting: capitalize first letter of each word
    return normalized
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';
const API_URL = `${API_BASE}/api/liturgy`;

export const fetchLiturgicalDay = async (date?: Date, language: string = 'en'): Promise<LiturgicalDay | null> => {
    try {
        let url = API_URL;
        const params = new URLSearchParams();

        if (date) {
            const dateStr = date.toISOString().split('T')[0];
            params.append('date', dateStr);
        }

        params.append('locale', language);

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        console.log('Fetching liturgical data from proxy:', url);
        const response = await fetch(url);

        if (!response.ok) {
            const errText = await response.text();
            console.error('Liturgical API Error:', errText);
            throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();
        return data as LiturgicalDay;
    } catch (error) {
        console.error('Liturgical Calendar Fetch Error:', error);
        return null;
    }
};
