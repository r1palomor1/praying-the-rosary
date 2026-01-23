
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
    if (lower.includes('green') || lower.includes('verde')) return '#10B981'; // emerald-500
    if (lower.includes('violet') || lower.includes('purple') || lower.includes('morado') || lower.includes('violeta')) return '#8B5CF6'; // violet-500
    if (lower.includes('white') || lower.includes('blanco')) return '#F3F4F6'; // gray-100
    if (lower.includes('red') || lower.includes('rojo')) return '#EF4444'; // red-500
    if (lower.includes('rose') || lower.includes('pink') || lower.includes('rosa')) return '#EC4899'; // pink-500
    if (lower.includes('black') || lower.includes('negro')) return '#6B7280'; // gray-500
    if (lower.includes('gold') || lower.includes('oro') || lower.includes('dorado')) return '#F59E0B'; // amber-500
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

// Calculate Easter Sunday using Meeus/Jones/Butcher algorithm
function calculateEaster(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

// Generate fallback liturgical data based on date-aware logic
export function getFallbackLiturgicalData(date: Date, language: string): LiturgicalDay {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const day = date.getDate();
    
    const easter = calculateEaster(year);
    const ashWednesday = new Date(easter);
    ashWednesday.setDate(easter.getDate() - 46);
    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49);
    
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long' });
    
    let season = 'ordinary_time';
    let colour = 'green';
    let title = '';
    
    // Advent: December 1-24
    if (month === 11 && day >= 1 && day <= 24) {
        season = 'advent';
        colour = 'violet';
        title = language === 'es' 
            ? `${dayOfWeek} de la Tercera Semana de Adviento`
            : `${dayOfWeek} of the Third Week of Advent`;
    }
    // Christmas: December 25 - January 6
    else if ((month === 11 && day >= 25) || (month === 0 && day <= 6)) {
        season = 'christmas';
        colour = 'white';
        title = language === 'es'
            ? `${dayOfWeek} de la Octava de Navidad`
            : `${dayOfWeek} within the Octave of Christmas`;
    }
    // Lent: Ash Wednesday to Holy Saturday
    else if (date >= ashWednesday && date < easter) {
        season = 'lent';
        colour = 'violet';
        const weekNum = Math.floor((date.getTime() - ashWednesday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        title = language === 'es'
            ? `${dayOfWeek} de la ${weekNum}ª Semana de Cuaresma`
            : `${dayOfWeek} of the ${weekNum}${weekNum === 1 ? 'st' : weekNum === 2 ? 'nd' : weekNum === 3 ? 'rd' : 'th'} Week of Lent`;
    }
    // Easter: Easter Sunday to Pentecost
    else if (date >= easter && date <= pentecost) {
        season = 'easter';
        colour = 'white';
        const weekNum = Math.floor((date.getTime() - easter.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        title = language === 'es'
            ? `${dayOfWeek} de la ${weekNum}ª Semana de Pascua`
            : `${dayOfWeek} of the ${weekNum}${weekNum === 1 ? 'st' : weekNum === 2 ? 'nd' : weekNum === 3 ? 'rd' : 'th'} Week of Easter`;
    }
    // Ordinary Time
    else {
        season = 'ordinary_time';
        colour = 'green';
        title = language === 'es'
            ? `${dayOfWeek} de la Tercera Semana del Tiempo Ordinario`
            : `${dayOfWeek} of the Third Week in Ordinary Time`;
    }
    
    return {
        date: dateStr,
        season: season,
        season_week: 3,
        weekday: dayOfWeek,
        celebrations: [{
            title: title,
            colour: colour,
            rank: 'WEEKDAY',
            rank_num: 13
        }]
    };
}

export const fetchLiturgicalDay = async (date?: Date, language: string = 'en'): Promise<LiturgicalDay> => {
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
        const fallbackDate = date || new Date();
        return getFallbackLiturgicalData(fallbackDate, language);
    }
};
