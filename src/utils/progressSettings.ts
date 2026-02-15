/**
 * Progress tracking settings - start dates for goal calculations
 */

const ROSARY_START_DATE_KEY = 'rosary_start_date';
const SACRED_START_DATE_KEY = 'sacred_start_date';
const BIBLE_START_DATE_KEY = 'bible_start_date';

export interface ProgressSettings {
    rosaryStartDate: string | null; // YYYY-MM-DD format
    sacredStartDate: string | null; // YYYY-MM-DD format
    bibleStartDate: string | null; // YYYY-MM-DD format
}

/**
 * Get rosary start date
 */
export function getRosaryStartDate(): string | null {
    try {
        return localStorage.getItem(ROSARY_START_DATE_KEY);
    } catch {
        return null;
    }
}

/**
 * Set rosary start date
 */
export function setRosaryStartDate(date: string | null): void {
    try {
        if (date) {
            localStorage.setItem(ROSARY_START_DATE_KEY, date);
        } else {
            localStorage.removeItem(ROSARY_START_DATE_KEY);
        }
    } catch (e) {
        console.error('Failed to save rosary start date:', e);
    }
}

/**
 * Get sacred prayers start date
 */
export function getSacredStartDate(): string | null {
    try {
        return localStorage.getItem(SACRED_START_DATE_KEY);
    } catch {
        return null;
    }
}

/**
 * Set sacred prayers start date
 */
export function setSacredStartDate(date: string | null): void {
    try {
        if (date) {
            localStorage.setItem(SACRED_START_DATE_KEY, date);
        } else {
            localStorage.removeItem(SACRED_START_DATE_KEY);
        }
    } catch (e) {
        console.error('Failed to save sacred start date:', e);
    }
}

/**
 * Get bible in a year start date
 */
export function getBibleStartDate(): string | null {
    try {
        return localStorage.getItem(BIBLE_START_DATE_KEY);
    } catch {
        return null;
    }
}

/**
 * Set bible in a year start date
 */
export function setBibleStartDate(date: string | null): void {
    try {
        if (date) {
            localStorage.setItem(BIBLE_START_DATE_KEY, date);
        } else {
            localStorage.removeItem(BIBLE_START_DATE_KEY);
        }
        // Dispatch custom event to notify hook of change
        window.dispatchEvent(new Event('bible-start-date-changed'));
    } catch (e) {
        console.error('Failed to save bible start date:', e);
    }
}

/**
 * Get all progress settings
 */
export function getProgressSettings(): ProgressSettings {
    return {
        rosaryStartDate: getRosaryStartDate(),
        sacredStartDate: getSacredStartDate(),
        bibleStartDate: getBibleStartDate()
    };
}

/**
 * Calculate days between two dates (inclusive of both start and end)
 * Example: Jan 3 to Jan 5 = 3 days (3, 4, 5)
 */
export function daysBetween(start: Date, end: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const startMs = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endMs = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    const daysDiff = Math.floor((endMs - startMs) / msPerDay);
    return daysDiff + 1; // +1 to include both start and end dates
}

/**
 * Calculate YTD goal based on start date
 * Returns number of days from start date to end of year
 */
export function calculateYTDGoal(year: number, startDateStr: string | null, daysInYear: number): number {
    if (!startDateStr) {
        return daysInYear; // Full year
    }

    // Parse date as local (avoid timezone issues)
    const [y, m, d] = startDateStr.split('-').map(Number);
    const startDate = new Date(y, m - 1, d); // month is 0-indexed
    const startYear = startDate.getFullYear();

    // If start date is before current year, use full year
    if (startYear < year) {
        return daysInYear;
    }

    // If start date is after current year, return 0
    if (startYear > year) {
        return 0;
    }

    // Calculate days from start date to Dec 31
    const endOfYear = new Date(year, 11, 31);
    const days = daysBetween(startDate, endOfYear);
    return days;
}

/**
 * Calculate MTD goal based on start date
 * Returns number of days from start date to end of month
 */
export function calculateMTDGoal(year: number, month: number, startDateStr: string | null, daysInMonth: number): number {
    if (!startDateStr) {
        return daysInMonth; // Full month
    }

    // Parse date as local (avoid timezone issues)
    const [y, m, d] = startDateStr.split('-').map(Number);
    const startDate = new Date(y, m - 1, d);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    // If start date is before this month, use full month
    if (startDate < monthStart) {
        return daysInMonth;
    }

    // If start date is after this month, return 0
    if (startDate > monthEnd) {
        return 0;
    }

    // Calculate days from start date to end of month
    return daysBetween(startDate, monthEnd);
}

/**
 * Calculate day of year from start date
 * Returns number of days from start date to today (or end of year if viewing past year)
 */
export function calculateDayOfYearFromStart(year: number, month: number, startDateStr: string | null, currentDayOfYear: number): number {
    if (!startDateStr) {
        return currentDayOfYear; // Use regular day of year
    }

    // Parse date as local (avoid timezone issues)
    const [y, m, d] = startDateStr.split('-').map(Number);
    const startDate = new Date(y, m - 1, d);
    const startYear = startDate.getFullYear();

    // If start date is before current year, use regular day of year
    if (startYear < year) {
        return currentDayOfYear;
    }

    // If start date is after current year, return 0
    if (startYear > year) {
        return 0;
    }

    // Calculate days from start date to current point in year
    const today = new Date();
    const isCurrentYear = year === today.getFullYear();
    const endDate = isCurrentYear
        ? new Date(year, month, Math.min(today.getDate(), new Date(year, month + 1, 0).getDate()))
        : new Date(year, month + 1, 0); // End of viewing month

    // If we're before the start date, return 0
    if (endDate < startDate) {
        return 0;
    }

    return daysBetween(startDate, endDate);
}
