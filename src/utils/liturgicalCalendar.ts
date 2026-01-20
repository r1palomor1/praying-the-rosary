
// Emergency Stub to prevent Romcal crash
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

export const getLiturgicalColorHex = (colorName: string): string => {
    return '#10B981';
};

export const getSeasonName = (season: string): string => {
    return 'Ordinary Time';
};

export const fetchLiturgicalDay = async (): Promise<LiturgicalDay | null> => {
    console.warn('Liturgical Calendar disabled due to library incompatibility');
    return null;
};
