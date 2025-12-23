import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Language, MysterySetType, AppSettings, UserSession } from '../types';
import { getTodaysMystery, getISODate } from '../utils/mysterySelector';
import { loadSettings, saveSettings, getDefaultSettings, loadSession, saveSession, clearSession as clearStoredSession, clearPrayerProgress, loadPrayerProgress } from '../utils/storage';
import { ttsManager } from '../utils/ttsManager';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';

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
    fontSize: 'normal' | 'large' | 'xl';
    setFontSize: (size: 'normal' | 'large' | 'xl') => void;
    mysteryLayout: 'classic' | 'cinematic';
    setMysteryLayout: (layout: 'classic' | 'cinematic') => void;

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
        textOrSegments: string | { text: string; gender: 'female' | 'male'; rate?: number; postPause?: number }[],
        onEnd?: () => void
    ) => void;
    pauseAudio: () => void;
    stopAudio: () => void;
    currentEngine: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    // Settings state
    const [language, setLanguageState] = useState<Language>('en');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [volume, setVolumeState] = useState(0.8);
    const [speechRate, setSpeechRateState] = useState(0.85);
    const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xl'>('normal');
    const [mysteryLayout, setMysteryLayout] = useState<'classic' | 'cinematic'>('cinematic');

    // Session state
    // Load last active mystery from storage, ONLY if it was set 'today' AND matches today's recommended mystery
    const [currentMysterySet, setCurrentMysterySet] = useState<MysterySetType>(() => {
        const todaysMystery = getTodaysMystery();

        try {
            const savedDate = localStorage.getItem('last_active_date');
            const today = getISODate();

            // If the saved mystery is from TODAY, we respect it (user manually selected it or refreshed)
            if (savedDate === today) {
                const saved = localStorage.getItem('last_active_mystery');
                if (saved && ['joyful', 'sorrowful', 'glorious', 'luminous'].includes(saved)) {
                    // Check if this mystery actually has progress!
                    // If user cleared it, we shouldn't force them back to an empty state
                    const progress = loadPrayerProgress(saved as MysterySetType);
                    if (progress) {
                        // IMPORTANT: Only use saved mystery if it's today's recommended mystery
                        // OR if today's mystery is already complete
                        const todaysProgress = loadPrayerProgress(todaysMystery);
                        const todaysEngine = todaysProgress ? new PrayerFlowEngine(todaysMystery as any, 'en') : null;
                        if (todaysEngine && todaysProgress) {
                            todaysEngine.jumpToStep(todaysProgress.currentStepIndex);
                        }
                        const todaysComplete = todaysEngine ? todaysEngine.getProgress() >= 99 : false;

                        // If today's mystery is complete, allow switching to other mysteries
                        // Otherwise, force today's mystery
                        if (saved === todaysMystery || todaysComplete) {
                            return saved as MysterySetType;
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error loading last mystery', e);
        }
        // Default to the canonical mystery of the day
        return todaysMystery;
    });
    const [currentMysteryNumber, setCurrentMysteryNumber] = useState(1);
    const [currentBeadNumber, setCurrentBeadNumber] = useState(0);
    const [isSessionActive, setIsSessionActive] = useState(false);

    // Audio state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentEngine, setCurrentEngine] = useState('initializing');

    // Initialize settings from localStorage
    useEffect(() => {
        const settings = loadSettings() || getDefaultSettings();
        setLanguageState(settings.language);
        setTheme(settings.theme);
        setAudioEnabled(settings.audioEnabled);
        setVolumeState(settings.volume);
        if (settings.speechRate) setSpeechRateState(settings.speechRate);
        if (settings.fontSize) setFontSizeState(settings.fontSize);
        if (settings.mysteryLayout) setMysteryLayout(settings.mysteryLayout);

        // Apply theme to document
        // Apply theme and font size to document
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.documentElement.setAttribute('data-font-size', settings.fontSize || 'normal');

        // Helper for session validation
        const todaysMystery = getTodaysMystery();
        // setCurrentMysterySet(todaysMystery); // Disabled to allow persistence

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
            speechRate,
            fontSize,
            mysteryLayout
        };
        saveSettings(settings);

        // Configure audio player
        ttsManager.setLanguage(language);
        ttsManager.setVolume(volume);
    }, [language, theme, audioEnabled, volume, speechRate, fontSize, mysteryLayout]);

    // Apply font size to document whenever it changes
    useEffect(() => {
        document.documentElement.setAttribute('data-font-size', fontSize);
    }, [fontSize]);

    // Poll current engine status
    useEffect(() => {
        const updateEngine = () => {
            setCurrentEngine(ttsManager.getCurrentEngine());
        };

        // Update immediately
        updateEngine();

        // Then poll every second
        const interval = setInterval(updateEngine, 1000);
        return () => clearInterval(interval);
    }, []);

    // Save current mystery set whenever it changes
    useEffect(() => {
        localStorage.setItem('last_active_mystery', currentMysterySet);
        localStorage.setItem('last_active_date', getISODate());
    }, [currentMysterySet]);

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
        ttsManager.setVolume(clampedVolume);
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
        textOrSegments: string | { text: string; gender: 'female' | 'male'; rate?: number; postPause?: number }[],
        onEnd?: () => void
    ) => {
        if (audioEnabled) {
            // Configure with specific onEnd if provided, otherwise default
            ttsManager.setLanguage(language);
            ttsManager.setVolume(volume);
            ttsManager.setOnEnd(() => {
                setIsPlaying(false);
                if (onEnd) onEnd();
            });

            if (typeof textOrSegments === 'string') {
                // For simple string, use default rate
                ttsManager.speakSegments([{ text: textOrSegments, gender: 'female', rate: speechRate }]);
            } else {
                // For segments, inject default rate if missing
                const segmentsWithRate = textOrSegments.map(s => ({
                    ...s,
                    rate: s.rate || speechRate
                }));
                ttsManager.speakSegments(segmentsWithRate);
            }
            setIsPlaying(true);
        }
    };

    const pauseAudio = () => {
        // Check if currently paused - if so, resume
        if (!ttsManager.isSpeaking()) {
            ttsManager.resume();
            setIsPlaying(true);
        } else {
            // Otherwise, pause
            ttsManager.pause();
            setIsPlaying(false);
        }
    };

    const stopAudio = () => {
        ttsManager.stop();
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
        fontSize,
        setFontSize: setFontSizeState,
        mysteryLayout,
        setMysteryLayout,
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
        stopAudio,
        currentEngine
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
