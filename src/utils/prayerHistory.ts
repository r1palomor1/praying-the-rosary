import type { MysterySetType } from '../types';

export interface PrayerCompletion {
    date: string; // ISO date format "2025-12-05"
    mysteryType: MysterySetType;
}

export interface PrayerStats {
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    completionsByMystery: {
        joyful: number;
        sorrowful: number;
        glorious: number;
        luminous: number;
    };
}

const STORAGE_KEY = 'rosary_prayer_history';

/**
 * Get all prayer completions from storage
 */
export function getPrayerHistory(): PrayerCompletion[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading prayer history:', error);
        return [];
    }
}

/**
 * Save a new prayer completion
 */
export function savePrayerCompletion(mysteryType: MysterySetType): void {
    try {
        const history = getPrayerHistory();
        const today = new Date().toISOString().split('T')[0];

        // Check if already completed today
        const alreadyCompleted = history.some(
            completion => completion.date === today && completion.mysteryType === mysteryType
        );

        if (!alreadyCompleted) {
            history.push({
                date: today,
                mysteryType
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        }
    } catch (error) {
        console.error('Error saving prayer completion:', error);
    }
}

/**
 * Calculate current streak (consecutive days with at least 1 completion)
 */
export function calculateCurrentStreak(): number {
    const history = getPrayerHistory();
    if (history.length === 0) return 0;

    // Get unique dates and sort descending
    const uniqueDates = [...new Set(history.map(c => c.date))].sort().reverse();

    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let currentDate = new Date(today);

    for (const date of uniqueDates) {
        const checkDate = currentDate.toISOString().split('T')[0];

        if (date === checkDate) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Calculate longest streak ever
 */
export function calculateLongestStreak(): number {
    const history = getPrayerHistory();
    if (history.length === 0) return 0;

    const uniqueDates = [...new Set(history.map(c => c.date))].sort();

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);

        // Check if dates are consecutive
        const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }

    return longestStreak;
}

/**
 * Get total completions by mystery type
 */
export function getCompletionsByMystery() {
    const history = getPrayerHistory();

    return {
        joyful: history.filter(c => c.mysteryType === 'joyful').length,
        sorrowful: history.filter(c => c.mysteryType === 'sorrowful').length,
        glorious: history.filter(c => c.mysteryType === 'glorious').length,
        luminous: history.filter(c => c.mysteryType === 'luminous').length
    };
}

/**
 * Get all prayer statistics
 */
export function getPrayerStats(): PrayerStats {
    return {
        currentStreak: calculateCurrentStreak(),
        longestStreak: calculateLongestStreak(),
        totalCompletions: getPrayerHistory().length,
        completionsByMystery: getCompletionsByMystery()
    };
}

/**
 * Get completions for a specific month
 */
export function getCompletionsForMonth(year: number, month: number): PrayerCompletion[] {
    const history = getPrayerHistory();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    return history.filter(completion => completion.date.startsWith(monthStr));
}

/**
 * Check if a specific date has a completion
 */
export function hasCompletionOnDate(date: string): boolean {
    const history = getPrayerHistory();
    return history.some(completion => completion.date === date);
}

/**
 * Get mystery type for a specific date (if completed)
 */
export function getMysteryForDate(date: string): MysterySetType | null {
    const history = getPrayerHistory();
    const completion = history.find(c => c.date === date);
    return completion ? completion.mysteryType : null;
}
