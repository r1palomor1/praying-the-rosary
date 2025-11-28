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
    playAudio: (text: string) => void;
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
            volume
        };
        saveSettings(settings);

        // Configure audio player
        audioPlayer.configure({
            language,
            volume,
            onEnd: () => setIsPlaying(false)
        });
    }, [language, theme, audioEnabled, volume]);

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

        // Clear old prayer progress when completing today's mystery
        // This resets any unfinished mysteries from previous days
        clearPrayerProgress();
    };

    const clearSession = () => {
        clearStoredSession();
        setIsSessionActive(false);
        setCurrentMysteryNumber(1);
        setCurrentBeadNumber(0);
    };

    // Audio controls
    const playAudio = (text: string) => {
        if (audioEnabled) {
            audioPlayer.speak(text);
            setIsPlaying(true);
        }
    };

    const pauseAudio = () => {
        audioPlayer.pause();
        setIsPlaying(false);
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
