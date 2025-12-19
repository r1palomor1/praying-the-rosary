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
 * Get local date string in YYYY-MM-DD format (not UTC)
 */
function getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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
        const today = getLocalDateString();

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

    let streak = 0;
    const today = new Date();
    const todayStr = getLocalDateString(today);

    // Check if today has a completion
    const hasCompletedToday = uniqueDates.includes(todayStr);

    // Start counting from today if completed, otherwise from yesterday
    const currentDate = hasCompletedToday ? new Date() : new Date(today.getTime() - 24 * 60 * 60 * 1000);

    for (const date of uniqueDates) {
        const checkDate = getLocalDateString(currentDate);

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
    // Filter to only include valid Rosary mystery types
    const validMysteryTypes: MysterySetType[] = ['joyful', 'sorrowful', 'glorious', 'luminous'];
    const rosaryHistory = getPrayerHistory().filter(completion =>
        validMysteryTypes.includes(completion.mysteryType as MysterySetType)
    );

    return {
        currentStreak: calculateCurrentStreak(),
        longestStreak: calculateLongestStreak(),
        totalCompletions: rosaryHistory.length,  // Only count Rosary completions
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
 * If multiple completions exist, prioritize the mystery that matches the day of the week
 */
export function getMysteryForDate(date: string): MysterySetType | null {
    const history = getPrayerHistory();
    const completions = history.filter(c => c.date === date);

    if (completions.length === 0) return null;
    if (completions.length === 1) return completions[0].mysteryType;

    // Multiple completions - find the one that matches the day of the week
    const dateObj = new Date(date + 'T12:00:00'); // Use noon to avoid timezone issues
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Map day of week to expected mystery type
    const dayToMystery: { [key: number]: MysterySetType } = {
        0: 'glorious',   // Sunday
        1: 'joyful',     // Monday
        2: 'sorrowful',  // Tuesday
        3: 'glorious',   // Wednesday
        4: 'luminous',   // Thursday
        5: 'sorrowful',  // Friday
        6: 'joyful'      // Saturday
    };

    const expectedMystery = dayToMystery[dayOfWeek];

    // Try to find the completion that matches the day's mystery
    const matchingCompletion = completions.find(c => c.mysteryType === expectedMystery);

    // Return the matching one if found, otherwise return the first one
    return matchingCompletion ? matchingCompletion.mysteryType : completions[0].mysteryType;
}
