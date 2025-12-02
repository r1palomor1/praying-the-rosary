import type { MysterySetType } from '../types';

/**
 * Gets the recommended mystery for a given day of the week
 * Following traditional Catholic Rosary schedule
 */
export function getTodaysMystery(): MysterySetType {
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

    switch (dayOfWeek) {
        case 1: // Monday
        case 6: // Saturday
            return 'joyful';
        case 2: // Tuesday
        case 5: // Friday
            return 'sorrowful';
        case 0: // Sunday
        case 3: // Wednesday
            return 'glorious';
        case 4: // Thursday
            return 'luminous';
        default:
            return 'joyful';
    }
}

/**
 * Checks if a mystery has in-progress state (started but not completed)
 */
export function hasInProgressMystery(_mysteryType: MysterySetType, progressPercentage: number | null): boolean {
    return progressPercentage !== null && progressPercentage > 0 && progressPercentage < 100;
}

/**
 * Sorts mysteries with smart prioritization:
 * 1. In-Progress Mystery (if exists and not 100% complete)
 * 2. Today's Recommended Mystery
 * 3. Remaining Mysteries (in traditional order: Joyful, Sorrowful, Glorious, Luminous)
 */
export function sortMysteriesWithPriority<T extends { type: MysterySetType }>(
    mysteries: T[],
    progressData: Record<string, { percentage: number } | null>
): T[] {
    const todaysMystery = getTodaysMystery();

    // Find in-progress mystery (if any)
    const inProgressMystery = mysteries.find(m =>
        hasInProgressMystery(m.type, progressData[m.type]?.percentage ?? null)
    );

    // Traditional order for remaining mysteries
    const traditionalOrder: MysterySetType[] = ['joyful', 'sorrowful', 'glorious', 'luminous'];

    // Build sorted array
    const sorted: T[] = [];
    const used = new Set<MysterySetType>();

    // 1. Add in-progress mystery first (if exists and different from today's)
    if (inProgressMystery && inProgressMystery.type !== todaysMystery) {
        sorted.push(inProgressMystery);
        used.add(inProgressMystery.type);
    }

    // 2. Add today's mystery
    const todaysMysteryObj = mysteries.find(m => m.type === todaysMystery);
    if (todaysMysteryObj) {
        sorted.push(todaysMysteryObj);
        used.add(todaysMystery);
    }

    // 3. Add remaining mysteries in traditional order
    traditionalOrder.forEach(type => {
        if (!used.has(type)) {
            const mystery = mysteries.find(m => m.type === type);
            if (mystery) {
                sorted.push(mystery);
            }
        }
    });

    return sorted;
}
