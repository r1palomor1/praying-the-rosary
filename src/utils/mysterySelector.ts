import type { MysterySetType, DayOfWeek } from '../types';
import { mysterySets } from '../data/mysteries';

// Map day of week to mystery set type
const dayToMysteryMap: Record<DayOfWeek, MysterySetType> = {
    monday: 'joyful',
    tuesday: 'sorrowful',
    wednesday: 'glorious',
    thursday: 'luminous',
    friday: 'sorrowful',
    saturday: 'joyful',
    sunday: 'glorious'
};

/**
 * Get the current day of the week as a DayOfWeek type
 */
export function getCurrentDay(): DayOfWeek {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    return days[today];
}

/**
 * Get the mystery set type for a given day
 */
export function getMysteryForDay(day: DayOfWeek): MysterySetType {
    return dayToMysteryMap[day];
}

/**
 * Get the mystery set type for today
 */
export function getTodaysMystery(): MysterySetType {
    const today = getCurrentDay();
    return getMysteryForDay(today);
}

/**
 * Get the full mystery set data for a given type
 */
export function getMysterySet(type: MysterySetType) {
    return mysterySets.find(set => set.type === type);
}

/**
 * Get today's mystery set data
 */
export function getTodaysMysterySet() {
    const type = getTodaysMystery();
    return getMysterySet(type);
}

/**
 * Get formatted date string
 */
export function getFormattedDate(locale: string = 'en-US'): string {
    return new Date().toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Get ISO date string (for storage)
 */
export function getISODate(): string {
    return new Date().toISOString().split('T')[0];
}
