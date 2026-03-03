import { useState, useEffect, useMemo } from 'react';

// Key for localStorage
export const BIBLE_START_DATE_KEY = 'bible_start_date';
export const BIBLE_COMPLETED_DAYS_KEY = 'bible_completed_days';
export const BIBLE_COMPLETED_CHAPTERS_KEY = 'bible_completed_chapters';
export const BIBLE_BACKUP_DAYS_KEY = 'bible_backup_days';
export const BIBLE_BACKUP_CHAPTERS_KEY = 'bible_backup_chapters';

export const hasBibleBackup = (): boolean => {
    return localStorage.getItem(BIBLE_BACKUP_DAYS_KEY) !== null ||
        localStorage.getItem(BIBLE_BACKUP_CHAPTERS_KEY) !== null;
};

export const resetBibleProgress = () => {
    // 1. Create safety backup
    const currentDays = localStorage.getItem(BIBLE_COMPLETED_DAYS_KEY);
    const currentChapters = localStorage.getItem(BIBLE_COMPLETED_CHAPTERS_KEY);

    if (currentDays) localStorage.setItem(BIBLE_BACKUP_DAYS_KEY, currentDays);
    if (currentChapters) localStorage.setItem(BIBLE_BACKUP_CHAPTERS_KEY, currentChapters);

    // 2. Wipe active data
    localStorage.removeItem(BIBLE_COMPLETED_DAYS_KEY);
    localStorage.removeItem(BIBLE_COMPLETED_CHAPTERS_KEY);

    // 3. Notify app to sink states globally
    window.dispatchEvent(new Event('bible-progress-updated'));
};

export const restoreBibleBackup = () => {
    // 1. Get safety backup
    const backupDays = localStorage.getItem(BIBLE_BACKUP_DAYS_KEY);
    const backupChapters = localStorage.getItem(BIBLE_BACKUP_CHAPTERS_KEY);

    // 2. Restore data
    if (backupDays) {
        localStorage.setItem(BIBLE_COMPLETED_DAYS_KEY, backupDays);
    } else {
        localStorage.removeItem(BIBLE_COMPLETED_DAYS_KEY);
    }

    if (backupChapters) {
        localStorage.setItem(BIBLE_COMPLETED_CHAPTERS_KEY, backupChapters);
    } else {
        localStorage.removeItem(BIBLE_COMPLETED_CHAPTERS_KEY);
    }

    // 3. Remove backup since it's restored
    localStorage.removeItem(BIBLE_BACKUP_DAYS_KEY);
    localStorage.removeItem(BIBLE_BACKUP_CHAPTERS_KEY);

    // 4. Notify app to sink states globally
    window.dispatchEvent(new Event('bible-progress-updated'));
};

export interface BibleProgress {
    bibleStartDate: string | null; // ISO Date string (YYYY-MM-DD)
    completedDays: number[]; // Array of day numbers (1-365)
    completedChapters: Record<number, string[]>; // Map of day -> array of completed chapter titles
    missedDays: number[]; // Array of missed day numbers based on start date
    expectedDay: number; // What day user "should" be on (1-based relative to start)
    markDayComplete: (day: number) => void;
    unmarkDay: (day: number) => void;
    isDayComplete: (day: number) => boolean;
    markChapterComplete: (day: number, chapterId: string) => void;
    unmarkChapter: (day: number, chapterId: string) => void;
    isChapterComplete: (day: number, chapterId: string) => boolean;
    getMissedDaysCount: () => number;
}

export function useBibleProgress(): BibleProgress {
    // --- State ---
    const [bibleStartDate, setBibleStartDateState] = useState<string | null>(() => {
        return localStorage.getItem(BIBLE_START_DATE_KEY);
    });

    const [completedDays, setCompletedDays] = useState<number[]>(() => {
        const saved = localStorage.getItem(BIBLE_COMPLETED_DAYS_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        return parsed;
    });

    const [completedChapters, setCompletedChaptersState] = useState<Record<number, string[]>>(() => {
        const saved = localStorage.getItem(BIBLE_COMPLETED_CHAPTERS_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        return parsed;
    });

    // Calculate Expected Day
    const expectedDay = useMemo(() => {
        if (!bibleStartDate) return 1;
        const [y, m, d] = bibleStartDate.split('-').map(Number);
        const start = new Date(y, m - 1, d);
        const today = new Date();
        start.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(1, diffDays + 1);
    }, [bibleStartDate]);

    // Calculate Missed Days
    const missedDays = useMemo(() => {
        if (!bibleStartDate) return [];
        const missed: number[] = [];
        const checkLimit = Math.min(expectedDay, 366);
        for (let d = 1; d < checkLimit; d++) {
            if (!completedDays.includes(d)) {
                missed.push(d);
            }
        }
        return missed;
    }, [bibleStartDate, expectedDay, completedDays]);

    // --- Effects ---

    // 0. Listen for localStorage changes (when Settings modal updates the date)
    useEffect(() => {
        const handleStorageChange = () => {
            const newDate = localStorage.getItem(BIBLE_START_DATE_KEY);
            setBibleStartDateState(newDate);
        };

        // Listen for storage events (cross-tab) and custom events (same-tab)
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('bible-start-date-changed', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('bible-start-date-changed', handleStorageChange);
        };
    }, []);

    // 0.5. Sync cross-component state and focus state for completions
    useEffect(() => {
        const syncCompletions = () => {
            const savedDays = localStorage.getItem(BIBLE_COMPLETED_DAYS_KEY);
            if (savedDays) {
                setCompletedDays(JSON.parse(savedDays));
            } else {
                setCompletedDays([]);
            }

            const savedChapters = localStorage.getItem(BIBLE_COMPLETED_CHAPTERS_KEY);
            if (savedChapters) {
                setCompletedChaptersState(JSON.parse(savedChapters));
            } else {
                setCompletedChaptersState({});
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                syncCompletions();
            }
        };

        window.addEventListener('bible-progress-updated', syncCompletions);
        window.addEventListener('focus', syncCompletions);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('bible-progress-updated', syncCompletions);
            window.removeEventListener('focus', syncCompletions);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);




    // --- Actions ---

    const markDayComplete = (day: number) => {
        const saved = localStorage.getItem(BIBLE_COMPLETED_DAYS_KEY);
        const prev = saved ? JSON.parse(saved) : [];
        if (prev.includes(day)) return; // Already complete

        const newCompleted = [...prev, day].sort((a, b) => a - b);

        localStorage.setItem(BIBLE_COMPLETED_DAYS_KEY, JSON.stringify(newCompleted));
        setCompletedDays(newCompleted);
        window.dispatchEvent(new Event('bible-progress-updated'));
    };

    const unmarkDay = (day: number) => {
        const saved = localStorage.getItem(BIBLE_COMPLETED_DAYS_KEY);
        const prev = saved ? JSON.parse(saved) : [];
        const newCompleted = prev.filter((d: number) => d !== day);

        localStorage.setItem(BIBLE_COMPLETED_DAYS_KEY, JSON.stringify(newCompleted));
        setCompletedDays(newCompleted);
        window.dispatchEvent(new Event('bible-progress-updated'));
    };

    const markChapterComplete = (day: number, chapterId: string) => {
        const saved = localStorage.getItem(BIBLE_COMPLETED_CHAPTERS_KEY);
        const prev = saved ? JSON.parse(saved) : {};
        const dayChapters = prev[day] || [];
        if (dayChapters.includes(chapterId)) return;

        const updated = { ...prev, [day]: [...dayChapters, chapterId] };

        localStorage.setItem(BIBLE_COMPLETED_CHAPTERS_KEY, JSON.stringify(updated));
        setCompletedChaptersState(updated);
        window.dispatchEvent(new Event('bible-progress-updated'));
    };

    const unmarkChapter = (day: number, chapterId: string) => {
        const saved = localStorage.getItem(BIBLE_COMPLETED_CHAPTERS_KEY);
        const prev = saved ? JSON.parse(saved) : {};
        const dayChapters = prev[day] || [];
        if (!dayChapters.includes(chapterId)) return;

        const updated = { ...prev, [day]: dayChapters.filter((id: string) => id !== chapterId) };
        localStorage.setItem(BIBLE_COMPLETED_CHAPTERS_KEY, JSON.stringify(updated));
        setCompletedChaptersState(updated);
        window.dispatchEvent(new Event('bible-progress-updated'));
    };

    const isDayComplete = (day: number) => completedDays.includes(day);

    // It's also complete if the day is fully complete, to avoid edge cases.
    const isChapterComplete = (day: number, chapterId: string) =>
        isDayComplete(day) || (completedChapters[day] || []).includes(chapterId);

    const getMissedDaysCount = () => missedDays.length;

    return {
        bibleStartDate,
        completedDays,
        completedChapters,
        missedDays,
        expectedDay,
        markDayComplete,
        unmarkDay,
        isDayComplete,
        markChapterComplete,
        unmarkChapter,
        isChapterComplete,
        getMissedDaysCount,
    };
}
