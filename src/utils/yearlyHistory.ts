import { getPrayerHistory, type PrayerCompletion } from './prayerHistory';
import { getSacredPrayerHistory, type SacredPrayerCompletion } from './sacredHistory';
import { getRosaryStartDate, getSacredStartDate, calculateYTDGoal, calculateMTDGoal, calculateDayOfYearFromStart } from './progressSettings';

/**
 * Year-to-Date stats for a specific month/year
 */
export interface YTDStats {
    totalCompletions: number;
    currentStreak: number;
    bestStreak: number;
    completionsByMystery?: {
        joyful: number;
        sorrowful: number;
        glorious: number;
        luminous: number;
    };
}

/**
 * Yearly archive data (stored for December of each year)
 */
export interface YearlyArchive {
    year: number;
    totalCompletions: number;
    bestStreak: number;
    finalStreak: number; // Streak as of Dec 31
    completionsByMystery?: {
        joyful: number;
        sorrowful: number;
        glorious: number;
        luminous: number;
    };
}

/**
 * Get local date string in YYYY-MM-DD format
 */
function getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get all unique years that have prayer data
 */
export function getAvailableYears(type: 'rosary' | 'sacred'): number[] {
    const history = type === 'rosary' ? getPrayerHistory() : getSacredPrayerHistory();

    if (history.length === 0) return [new Date().getFullYear()];

    const years = new Set<number>();
    history.forEach(completion => {
        const year = parseInt(completion.date.split('-')[0]);
        years.add(year);
    });

    // Always include current year
    years.add(new Date().getFullYear());

    return Array.from(years).sort((a, b) => b - a); // Descending order
}

/**
 * Get completions for a specific year
 */
export function getCompletionsForYear(year: number, type: 'rosary' | 'sacred'): (PrayerCompletion | SacredPrayerCompletion)[] {
    const history = type === 'rosary' ? getPrayerHistory() : getSacredPrayerHistory();
    const yearStr = `${year}-`;
    return history.filter(completion => completion.date.startsWith(yearStr));
}

/**
 * Get completions up to and including a specific month in a year
 */
export function getCompletionsUpToMonth(year: number, month: number, type: 'rosary' | 'sacred'): (PrayerCompletion | SacredPrayerCompletion)[] {
    const yearCompletions = getCompletionsForYear(year, type);

    return yearCompletions.filter(completion => {
        const [, completionMonth] = completion.date.split('-').map(Number);
        return completionMonth <= month + 1; // month is 0-indexed
    });
}

/**
 * Calculate streak up to a specific date
 */
export function calculateStreakUpToDate(endDate: Date, type: 'rosary' | 'sacred'): number {
    const history = type === 'rosary' ? getPrayerHistory() : getSacredPrayerHistory();
    if (history.length === 0) return 0;

    const endDateStr = getLocalDateString(endDate);

    // Get all dates up to and including endDate
    const relevantDates = [...new Set(history.map(c => c.date))]
        .filter(date => date <= endDateStr)
        .sort()
        .reverse();

    if (relevantDates.length === 0) return 0;

    let streak = 0;
    const currentDate = new Date(endDate);

    // Check if endDate has a completion
    const hasCompletedOnEndDate = relevantDates.includes(endDateStr);

    if (!hasCompletedOnEndDate) {
        // Start from the day before
        currentDate.setDate(currentDate.getDate() - 1);
    }

    for (const date of relevantDates) {
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
 * Calculate best streak within a date range
 */
export function calculateBestStreakInRange(startDate: Date, endDate: Date, type: 'rosary' | 'sacred'): number {
    const history = type === 'rosary' ? getPrayerHistory() : getSacredPrayerHistory();
    if (history.length === 0) return 0;

    const startDateStr = getLocalDateString(startDate);
    const endDateStr = getLocalDateString(endDate);

    // Get unique dates within range
    const uniqueDates = [...new Set(history.map(c => c.date))]
        .filter(date => date >= startDateStr && date <= endDateStr)
        .sort();

    if (uniqueDates.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);

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
 * Get Year-to-Date stats for a specific month/year
 */
export function getYTDStats(year: number, month: number, type: 'rosary' | 'sacred'): YTDStats {
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, month + 1, 0); // Last day of the month

    // For current month, use today's date for streak calculation
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const streakEndDate = isCurrentMonth ? today : endDate;

    const completions = getCompletionsUpToMonth(year, month, type);

    const stats: YTDStats = {
        totalCompletions: completions.length,
        currentStreak: calculateStreakUpToDate(streakEndDate, type),
        bestStreak: calculateBestStreakInRange(startDate, streakEndDate, type)
    };

    // Add mystery breakdown for Rosary
    if (type === 'rosary') {
        const rosaryCompletions = completions as PrayerCompletion[];
        stats.completionsByMystery = {
            joyful: rosaryCompletions.filter(c => c.mysteryType === 'joyful').length,
            sorrowful: rosaryCompletions.filter(c => c.mysteryType === 'sorrowful').length,
            glorious: rosaryCompletions.filter(c => c.mysteryType === 'glorious').length,
            luminous: rosaryCompletions.filter(c => c.mysteryType === 'luminous').length
        };
    }

    return stats;
}

/**
 * Get year-end archive stats (December stats represent the full year)
 */
export function getYearEndArchive(year: number, type: 'rosary' | 'sacred'): YearlyArchive {
    const decemberStats = getYTDStats(year, 11, type); // December is month 11

    const archive: YearlyArchive = {
        year,
        totalCompletions: decemberStats.totalCompletions,
        bestStreak: decemberStats.bestStreak,
        finalStreak: decemberStats.currentStreak
    };

    if (type === 'rosary' && decemberStats.completionsByMystery) {
        archive.completionsByMystery = decemberStats.completionsByMystery;
    }

    return archive;
}

/**
 * Check if we should show year-end archive view for a given month
 * (Only December of past years shows as archive)
 */
export function isYearEndArchiveView(year: number, month: number): boolean {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // If it's a past year and December, show as archive
    return year < currentYear && month === 11;
}

/**
 * Calculate MTD (Month-to-Date) current streak
 * Only counts consecutive days within the current month
 */
export function calculateMTDCurrentStreak(year: number, month: number, type: 'rosary' | 'sacred'): number {
    const history = type === 'rosary' ? getPrayerHistory() : getSacredPrayerHistory();
    if (history.length === 0) return 0;

    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

    // For current month, use today; for past months, use last day of month
    const endDay = isCurrentMonth ? today.getDate() : getDaysInMonth(year, month);

    // Get dates only within this month
    const monthDates = [...new Set(history.map(c => c.date))]
        .filter(date => {
            const [y, m] = date.split('-').map(Number);
            return y === year && m === month + 1;
        })
        .sort()
        .reverse();

    if (monthDates.length === 0) return 0;

    let streak = 0;
    let checkDay = endDay;
    const yearStr = String(year);
    const monthStr = String(month + 1).padStart(2, '0');

    for (const date of monthDates) {
        const checkDate = `${yearStr}-${monthStr}-${String(checkDay).padStart(2, '0')}`;

        if (date === checkDate) {
            streak++;
            checkDay--;
            if (checkDay < 1) break;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Calculate MTD (Month-to-Date) best streak
 * Only counts consecutive days within the specified month
 */
export function calculateMTDBestStreak(year: number, month: number, type: 'rosary' | 'sacred'): number {
    const history = type === 'rosary' ? getPrayerHistory() : getSacredPrayerHistory();
    if (history.length === 0) return 0;

    // Get unique dates within this month
    const uniqueDates = [...new Set(history.map(c => c.date))]
        .filter(date => {
            const [y, m] = date.split('-').map(Number);
            return y === year && m === month + 1;
        })
        .sort();

    if (uniqueDates.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1] + 'T00:00:00');
        const currDate = new Date(uniqueDates[i] + 'T00:00:00');

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
 * Get year-over-year comparison percentage
 * Compares current period to same period last year
 */
export function getYearOverYearComparison(year: number, month: number, type: 'rosary' | 'sacred'): number | null {
    const currentYearCompletions = getCompletionsUpToMonth(year, month, type).length;
    const previousYearCompletions = getCompletionsUpToMonth(year - 1, month, type).length;

    if (previousYearCompletions === 0) return null;

    const percentChange = ((currentYearCompletions - previousYearCompletions) / previousYearCompletions) * 100;
    return Math.round(percentChange);
}

/**
 * Get days in a specific year (accounting for leap years)
 */
export function getDaysInYear(year: number): number {
    return isLeapYear(year) ? 366 : 365;
}

/**
 * Check if a year is a leap year
 */
function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Get days in a specific month
 */
export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get day of year (1-365/366)
 */
export function getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

/**
 * Get enhanced YTD stats with MTD breakdown
 */
export interface EnhancedYTDStats extends YTDStats {
    mtdTotal: number;
    mtdCurrentStreak: number;
    mtdBestStreak: number;
    yearOverYearPercent: number | null;
    daysInYear: number;
    daysInMonth: number;
    dayOfYear: number;
    yearProgress: number; // 0-100
    monthProgress: number; // 0-100
}

export function getEnhancedYTDStats(year: number, month: number, type: 'rosary' | 'sacred'): EnhancedYTDStats {
    const baseStats = getYTDStats(year, month, type);
    const monthCompletions = getCompletionsForYear(year, type).filter(c => {
        const [, m] = c.date.split('-').map(Number);
        return m === month + 1;
    }).length;

    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const currentDayOfMonth = isCurrentMonth ? today.getDate() : daysInMonth;
    const daysInYear = getDaysInYear(year);

    // Get start date for this prayer type
    const startDateStr = type === 'rosary' ? getRosaryStartDate() : getSacredStartDate();

    // Calculate adjusted goals based on start date
    const ytdGoalAdjusted = calculateYTDGoal(year, startDateStr, daysInYear);
    const mtdGoalAdjusted = calculateMTDGoal(year, month, startDateStr, daysInMonth);
    const dayOfYearAdjusted = calculateDayOfYearFromStart(year, month, startDateStr, getDayOfYear(new Date(year, month, currentDayOfMonth)));

    return {
        ...baseStats,
        mtdTotal: monthCompletions,
        mtdCurrentStreak: calculateMTDCurrentStreak(year, month, type),
        mtdBestStreak: calculateMTDBestStreak(year, month, type),
        yearOverYearPercent: getYearOverYearComparison(year, month, type),
        daysInYear: ytdGoalAdjusted, // Use adjusted goal instead of full year
        daysInMonth: mtdGoalAdjusted, // Use adjusted goal instead of full month
        dayOfYear: dayOfYearAdjusted, // Use adjusted day count
        // Fix: Use total days in year (365/366) not elapsed days
        yearProgress: ytdGoalAdjusted > 0 ? Math.round((baseStats.totalCompletions / ytdGoalAdjusted) * 100) : 0,
        // Fix: Use total days in month (28-31) not elapsed days
        monthProgress: mtdGoalAdjusted > 0 ? Math.round((monthCompletions / mtdGoalAdjusted) * 100) : 0
    };
}
