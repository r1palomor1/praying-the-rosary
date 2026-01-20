
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

const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';
const API_URL = `${API_BASE}/api/calendar`;

export const fetchLiturgicalDay = async (): Promise<LiturgicalDay | null> => {
    try {
        console.log('Fetching liturgical data from:', API_URL);
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errText = await response.text();
            console.error('Liturgical API Error Body:', errText);
            throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();
        console.log('Liturgical Data:', data);
        return data as LiturgicalDay;
    } catch (error) {
        console.error('Liturgical Calendar Fetch Error:', error);
        return null;
    }
};

export const getLiturgicalColorHex = (colorName: string): string => {
    switch (colorName.toLowerCase()) {
        case 'green': return '#10B981'; // emerald-500
        case 'violet': return '#8B5CF6'; // violet-500
        case 'purple': return '#8B5CF6';
        case 'white': return '#F3F4F6'; // gray-100 (needs dark text usually, or use a Gold for feast)
        case 'red': return '#EF4444'; // red-500
        case 'rose': return '#EC4899'; // pink-500
        case 'black': return '#6B7280'; // gray-500
        case 'gold': return '#F59E0B'; // amber-500
        default: return '#10B981'; // default green
    }
};

export const getSeasonName = (season: string): string => {
    switch (season) {
        case 'advent': return 'Advent';
        case 'christmas': return 'Christmas';
        case 'lent': return 'Lent';
        case 'easter': return 'Easter';
        case 'ordinary': return 'Ordinary Time';
        default: return season.charAt(0).toUpperCase() + season.slice(1);
    }
};
