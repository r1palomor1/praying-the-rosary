import { useState, useEffect } from 'react';

// Key for localStorage
export const BIBLE_START_DATE_KEY = 'bible_start_date';
export const BIBLE_COMPLETED_DAYS_KEY = 'bible_completed_days';

export interface BibleProgress {
    bibleStartDate: string | null; // ISO Date string (YYYY-MM-DD)
    completedDays: number[]; // Array of day numbers (1-365)
    missedDays: number[]; // Array of missed day numbers based on start date
    expectedDay: number; // What day user "should" be on (1-based relative to start)
    setBibleStartDate: (date: string | null) => void;
    markDayComplete: (day: number) => void;
    unmarkDay: (day: number) => void;
    isDayComplete: (day: number) => boolean;
    getMissedDaysCount: () => number;
}

export function useBibleProgress(): BibleProgress {
    // --- State ---
    const [bibleStartDate, setBibleStartDateState] = useState<string | null>(() => {
        return localStorage.getItem(BIBLE_START_DATE_KEY);
    });

    const [completedDays, setCompletedDays] = useState<number[]>(() => {
        const saved = localStorage.getItem(BIBLE_COMPLETED_DAYS_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    const [missedDays, setMissedDays] = useState<number[]>([]);
    const [expectedDay, setExpectedDay] = useState<number>(1);

    // --- Effects ---

    // 1. Calculate Missed Days whenever Start Date or Completed Days change
    useEffect(() => {
        if (!bibleStartDate) {
            setMissedDays([]);
            setExpectedDay(1);
            return;
        }

        // Parse start date explicitly as local time to avoid UTC shifts
        const [y, m, d] = bibleStartDate.split('-').map(Number);
        const start = new Date(y, m - 1, d); // Month is 0-indexed

        const today = new Date();

        // Normalize to midnight to avoid time issues
        start.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Calculate diff in days
        const diffTime = today.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // 0-based index from start

        // If start date is in future, expected day is 1 (or 0/negative logic)
        // We treat "Day 1" as index 0 in calculation terms, but 1-based for UI
        // So if today == start date, expectedDay is 1.
        const currentExpected = Math.max(1, diffDays + 1);

        // Build list of missed days
        // Logic: Loop from Day 1 to currentExpected - 1
        // (We don't count "Today" as missed until tomorrow)
        const missed: number[] = [];

        // Cap at 365 (plan limit)
        const checkLimit = Math.min(currentExpected, 366);

        for (let d = 1; d < checkLimit; d++) {
            if (!completedDays.includes(d)) {
                missed.push(d);
            }
        }

        setExpectedDay(currentExpected);
        setMissedDays(missed);

    }, [bibleStartDate, completedDays]);


    // --- Actions ---

    const setBibleStartDate = (date: string | null) => {
        if (date) {
            localStorage.setItem(BIBLE_START_DATE_KEY, date);
        } else {
            localStorage.removeItem(BIBLE_START_DATE_KEY);
        }
        setBibleStartDateState(date);
    };

    const markDayComplete = (day: number) => {
        if (completedDays.includes(day)) return; // Already complete

        const newCompleted = [...completedDays, day].sort((a, b) => a - b);
        setCompletedDays(newCompleted);
        localStorage.setItem(BIBLE_COMPLETED_DAYS_KEY, JSON.stringify(newCompleted));
    };

    const unmarkDay = (day: number) => {
        const newCompleted = completedDays.filter(d => d !== day);
        setCompletedDays(newCompleted);
        localStorage.setItem(BIBLE_COMPLETED_DAYS_KEY, JSON.stringify(newCompleted));
    };

    const isDayComplete = (day: number) => completedDays.includes(day);

    const getMissedDaysCount = () => missedDays.length;

    return {
        bibleStartDate,
        completedDays,
        missedDays,
        expectedDay,
        setBibleStartDate,
        markDayComplete,
        unmarkDay,
        isDayComplete,
        getMissedDaysCount,
    };
}
