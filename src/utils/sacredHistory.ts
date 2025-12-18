export interface SacredPrayerCompletion {
    date: string; // ISO date format "2025-12-05"
}

export interface SacredPrayerStats {
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
}

const STORAGE_KEY = 'sacred_prayer_history';

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
 * Get all sacred prayer completions from storage
 */
export function getSacredPrayerHistory(): SacredPrayerCompletion[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading sacred prayer history:', error);
        return [];
    }
}

/**
 * Save a new sacred prayer completion
 */
export function saveSacredCompletion(): void {
    try {
        const history = getSacredPrayerHistory();
        const today = getLocalDateString();

        // Check if already completed today
        const alreadyCompleted = history.some(
            completion => completion.date === today
        );

        if (!alreadyCompleted) {
            history.push({
                date: today
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        }
    } catch (error) {
        console.error('Error saving sacred prayer completion:', error);
    }
}

/**
 * Calculate current streak
 */
export function calculateSacredCurrentStreak(): number {
    const history = getSacredPrayerHistory();
    if (history.length === 0) return 0;

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
export function calculateSacredLongestStreak(): number {
    const history = getSacredPrayerHistory();
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
 * Get sacred prayer stats
 */
export function getSacredStats(): SacredPrayerStats {
    return {
        currentStreak: calculateSacredCurrentStreak(),
        longestStreak: calculateSacredLongestStreak(),
        totalCompletions: getSacredPrayerHistory().length
    };
}

/**
 * Get completions for a specific month
 */
export function getSacredCompletionsForMonth(year: number, month: number): SacredPrayerCompletion[] {
    const history = getSacredPrayerHistory();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    return history.filter(completion => completion.date.startsWith(monthStr));
}

/**
 * Check if a specific date has a completion
 */
export function hasSacredCompletionOnDate(date: string): boolean {
    const history = getSacredPrayerHistory();
    return history.some(completion => completion.date === date);
}

/**
 * Helper to get the mystery type color associated with a specific date
 * (Used to match Rosary day coloring)
 */
export function getMysteryTypeForDate(dateStr: string): 'joyful' | 'sorrowful' | 'glorious' | 'luminous' {
    const dateObj = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday

    const dayToMystery = {
        0: 'glorious',   // Sunday
        1: 'joyful',     // Monday
        2: 'sorrowful',  // Tuesday
        3: 'glorious',   // Wednesday
        4: 'luminous',   // Thursday
        5: 'sorrowful',  // Friday
        6: 'joyful'      // Saturday
    } as const;

    return dayToMystery[dayOfWeek as keyof typeof dayToMystery];
}
