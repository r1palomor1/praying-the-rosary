import type { MysterySetType } from '../types';

/**
 * Clean up contaminated prayer history by removing non-Rosary mystery types
 * This fixes the bug where Sacred Prayer completions were being saved to rosary_prayer_history
 */
export function cleanupPrayerHistory(): { removed: number; remaining: number } {
    try {
        const STORAGE_KEY = 'rosary_prayer_history';
        const data = localStorage.getItem(STORAGE_KEY);

        if (!data) {
            return { removed: 0, remaining: 0 };
        }

        const history = JSON.parse(data);
        const validMysteryTypes: MysterySetType[] = ['joyful', 'sorrowful', 'glorious', 'luminous'];

        const originalLength = history.length;
        const cleanedHistory = history.filter((completion: any) =>
            validMysteryTypes.includes(completion.mysteryType as MysterySetType)
        );

        const removed = originalLength - cleanedHistory.length;

        if (removed > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedHistory));
            console.log(`Cleaned up ${removed} invalid entries from prayer history`);
        }

        return { removed, remaining: cleanedHistory.length };
    } catch (error) {
        console.error('Error cleaning up prayer history:', error);
        return { removed: 0, remaining: 0 };
    }
}
