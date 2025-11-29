import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Language, MysterySetType, AppSettings, UserSession } from '../types';
import { getTodaysMystery, getISODate } from '../utils/mysterySelector';
import { loadSettings, saveSettings, getDefaultSettings, loadSession, saveSession, clearSession as clearStoredSession, clearPrayerProgress } from '../utils/storage';
import { audioPlayer } from '../utils/audioPlayer';

interface AppContextType {
    // Settings
    language: Language;
    setLanguage: (lang: Language) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    audioEnabled: boolean;
    setAudioEnabled: (enabled: boolean) => void;
    volume: number;
    setVolume: (volume: number) => void;
    speechRate: number;
    setSpeechRate: (rate: number) => void;

    // Session
    currentMysterySet: MysterySetType;
    setCurrentMysterySet: (type: MysterySetType) => void;
    currentMysteryNumber: number;
    setCurrentMysteryNumber: (num: number) => void;
    currentBeadNumber: number;
    setCurrentBeadNumber: (num: number) => void;
    isSessionActive: boolean;
    startNewSession: (mysteryType?: MysterySetType) => void;
    resumeSession: () => void;
    completeSession: () => void;
    clearSession: () => void;

    // Audio
    isPlaying: boolean;
    playAudio: (
        textOrSegments: string | { text: string; gender: 'female' | 'male'; rate?: number }[],
        onEnd?: () => void
    ) => void;
    pauseAudio: () => void;
    stopAudio: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    // Settings state
    const [language, setLanguageState] = useState<Language>('en');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [volume, setVolumeState] = useState(0.8);
    const [speechRate, setSpeechRateState] = useState(0.85);

    // Session state
    const [currentMysterySet, setCurrentMysterySet] = useState<MysterySetType>(getTodaysMystery());
    const [currentMysteryNumber, setCurrentMysteryNumber] = useState(1);
    const [currentBeadNumber, setCurrentBeadNumber] = useState(0);
    const [isSessionActive, setIsSessionActive] = useState(false);

    // Audio state
    const [isPlaying, setIsPlaying] = useState(false);

    // Initialize settings from localStorage
    useEffect(() => {
        const settings = loadSettings() || getDefaultSettings();
        setLanguageState(settings.language);
        setTheme(settings.theme);
        setAudioEnabled(settings.audioEnabled);
        setVolumeState(settings.volume);
        if (settings.speechRate) setSpeechRateState(settings.speechRate);

        // Apply theme to document
        document.documentElement.setAttribute('data-theme', settings.theme);

        // Always set today's mystery first
        const todaysMystery = getTodaysMystery();
        setCurrentMysterySet(todaysMystery);

        // Check for existing session
        const session = loadSession();
        if (session && session.date === getISODate() && !session.completed) {
            // Session is from today - restore it if it matches today's mystery
            if (session.mysterySetType === todaysMystery) {
                setCurrentMysteryNumber(session.currentMysteryNumber);
                setCurrentBeadNumber(session.currentBeadNumber);
                setIsSessionActive(true);
            }
            // Note: We don't clear the session if it's a different mystery from today
            // This allows users to manually select and resume it
        }
        // Note: We intentionally DON'T clear old sessions from previous days
        // They will be preserved so users can resume unfinished mysteries
        // Old sessions will be cleared when today's mystery is completed
    }, []);

    // Save settings whenever they change
    useEffect(() => {
        const settings: AppSettings = {
            language,
            theme,
            audioEnabled,
            volume,
            speechRate
        };
        saveSettings(settings);

        // Configure audio player
        audioPlayer.configure({
            language,
            volume,
            onEnd: () => setIsPlaying(false)
        });
    }, [language, theme, audioEnabled, volume, speechRate]);

    // Save session whenever it changes
    useEffect(() => {
        if (isSessionActive) {
            const session: UserSession = {
                date: getISODate(),
                mysterySetType: currentMysterySet,
                currentMysteryNumber: currentMysteryNumber as 1 | 2 | 3 | 4 | 5,
                currentBeadNumber: currentBeadNumber as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
                completed: false,
                language
            };
            saveSession(session);
        }
    }, [isSessionActive, currentMysterySet, currentMysteryNumber, currentBeadNumber, language]);

    // Language setter
    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    // Theme toggle
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // Volume setter
    const setVolume = (vol: number) => {
        const clampedVolume = Math.max(0, Math.min(1, vol));
        setVolumeState(clampedVolume);
        audioPlayer.setVolume(clampedVolume);
    };

    // Speech rate setter
    const setSpeechRate = (rate: number) => {
        const clampedRate = Math.max(0.5, Math.min(2.0, rate));
        setSpeechRateState(clampedRate);
    };

    // Session management
    const startNewSession = (mysteryType?: MysterySetType) => {
        const type = mysteryType || getTodaysMystery();
        setCurrentMysterySet(type);
        setCurrentMysteryNumber(1);
        setCurrentBeadNumber(0);
        setIsSessionActive(true);
    };

    const resumeSession = () => {
        const session = loadSession();
        if (session && session.date === getISODate() && !session.completed) {
            setCurrentMysterySet(session.mysterySetType);
            setCurrentMysteryNumber(session.currentMysteryNumber);
            setCurrentBeadNumber(session.currentBeadNumber);
            setIsSessionActive(true);
        }
    };

    const completeSession = () => {
        const session: UserSession = {
            date: getISODate(),
            mysterySetType: currentMysterySet,
            currentMysteryNumber: 5,
            currentBeadNumber: 10,
            completed: true,
            language
        };
        saveSession(session);
        setIsSessionActive(false);

        // Clear old unfinished mysteries from previous days
        // But DON'T clear the current mystery's progress - keep it at completion step
        // so we can detect it's complete when user presses Pray again
        const allMysteryTypes: MysterySetType[] = ['joyful', 'sorrowful', 'glorious', 'luminous'];
        allMysteryTypes.forEach(mysteryType => {
            if (mysteryType !== currentMysterySet) {
                clearPrayerProgress(mysteryType);
            }
        });
    };

    const clearSession = () => {
        clearStoredSession();
        setIsSessionActive(false);
        setCurrentMysteryNumber(1);
        setCurrentBeadNumber(0);
    };

    // Audio controls
    const playAudio = (
        textOrSegments: string | { text: string; gender: 'female' | 'male'; rate?: number }[],
        onEnd?: () => void
    ) => {
        if (audioEnabled) {
            // Configure with specific onEnd if provided, otherwise default
            audioPlayer.configure({
                language,
                volume,
                onEnd: () => {
                    setIsPlaying(false);
                    if (onEnd) onEnd();
                }
            });

            if (typeof textOrSegments === 'string') {
                // For simple string, use default rate
                audioPlayer.speakSegments([{ text: textOrSegments, gender: 'female', rate: speechRate }]);
            } else {
                // For segments, inject default rate if missing
                const segmentsWithRate = textOrSegments.map(s => ({
                    ...s,
                    rate: s.rate || speechRate
                }));
                audioPlayer.speakSegments(segmentsWithRate);
            }
            setIsPlaying(true);
        }
    };

    const pauseAudio = () => {
        // Check if currently paused - if so, resume
        if (audioPlayer.isPaused()) {
            audioPlayer.resume();
            setIsPlaying(true);
        } else {
            // Otherwise, pause
            audioPlayer.pause();
            setIsPlaying(false);
        }
    };

    const stopAudio = () => {
        audioPlayer.stop();
        setIsPlaying(false);
    };

    const value: AppContextType = {
        language,
        setLanguage,
        theme,
        toggleTheme,
        audioEnabled,
        setAudioEnabled,
        volume,
        setVolume,
        speechRate,
        setSpeechRate,
        currentMysterySet,
        setCurrentMysterySet,
        currentMysteryNumber,
        setCurrentMysteryNumber,
        currentBeadNumber,
        setCurrentBeadNumber,
        isSessionActive,
        startNewSession,
        resumeSession,
        completeSession,
        clearSession,
        isPlaying,
        playAudio,
        pauseAudio,
        stopAudio
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
