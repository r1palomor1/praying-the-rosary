// Language types
export type Language = 'en' | 'es';

// Mystery set types
export type MysterySetType = 'joyful' | 'sorrowful' | 'glorious' | 'luminous';

// Day of week mapping
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Individual mystery
export interface Mystery {
    number: 1 | 2 | 3 | 4 | 5;
    title: {
        en: string;
        es: string;
    };
    scripture: {
        en: {
            reference: string;
            text: string;
        };
        es: {
            reference: string;
            text: string;
        };
    };
    reflection: {
        en: string;
        es: string;
    };
    fruit?: {
        en: string;
        es: string;
    };
    imageUrl: string;
}

// Mystery set (collection of 5 mysteries)
export interface MysterySet {
    type: MysterySetType;
    name: {
        en: string;
        es: string;
    };
    days: DayOfWeek[];
    mysteries: Mystery[];
    gradientImage?: string; // Optional gradient background for mystery card
}

// Prayer text
export interface Prayer {
    name: {
        en: string;
        es: string;
    };
    text: {
        en: string;
        es: string;
    };
}

// Prayer sequence for a decade
export interface PrayerSequence {
    ourFather: Prayer;
    hailMary: Prayer;
    gloryBe: Prayer;
    oMyJesus: Prayer;
}

// Closing prayers
export interface ClosingPrayers {
    hailHolyQueen: Prayer;
    litany: Prayer;
    finalPrayer: Prayer;
    signOfTheCross: Prayer;
}

// User session state
export interface UserSession {
    date: string; // ISO date string
    mysterySetType: MysterySetType;
    currentMysteryNumber: 1 | 2 | 3 | 4 | 5;
    currentBeadNumber: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; // 0 = Our Father, 1-10 = Hail Marys
    completed: boolean;
    language: Language;
}

// App settings
export interface AppSettings {
    language: Language;
    theme: 'light' | 'dark';
    audioEnabled: boolean;
    volume: number; // 0-1
    speechRate?: number; // 0.5-2.0, default 0.85
    femaleVoiceName?: string; // Name of preferred female voice
    maleVoiceName?: string; // Name of preferred male voice
}

// Prayer stage (what prayer is currently being displayed)
export type PrayerStage =
    | 'opening-sign-of-cross'
    | 'apostles-creed'
    | 'our-father'
    | 'hail-mary'
    | 'glory-be'
    | 'o-my-jesus'
    | 'mystery-intro'
    | 'closing-prayers'
    | 'complete';

// Current prayer state
export interface PrayerState {
    stage: PrayerStage;
    mysteryNumber: number;
    beadNumber: number;
    isPlaying: boolean;
}
