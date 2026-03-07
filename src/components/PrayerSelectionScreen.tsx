import { useState, useEffect, useRef, useMemo } from 'react';
import { Settings as SettingsIcon, ChevronRight, Loader2, Square, Sparkles } from 'lucide-react'; // Added Square

import { useApp } from '../context/AppContext';
import { useAI } from '../context/AIContext';
import { SettingsModalV2 as SettingsModal } from './settings/SettingsModalV2';
import { AIModal } from './AIModal';
import { getVersionInfo, type VersionInfo } from '../utils/version';
import { LiturgicalCard } from './LiturgicalCard';
import { fetchLiturgicalDay, type LiturgicalDay, getLiturgicalColorHex } from '../utils/liturgicalCalendar';
import './PrayerSelectionScreen.css';
import { hasCompletionOnDate } from '../utils/prayerHistory';
import { useBibleProgress } from '../hooks/useBibleProgress';
import { useRosaryPlayback } from '../hooks/useRosaryPlayback';
import { useDailyReadingsPlayback } from '../hooks/useDailyReadingsPlayback';
import { useBiblePlayback, getBiblePlaying } from '../hooks/useBiblePlayback';
import { useSacredPrayersPlayback } from '../hooks/useSacredPrayersPlayback';
import { getDailyReadingsPlaying } from '../hooks/useDailyReadingsPlayback';
import type { MysteryType } from '../utils/prayerFlowEngine';
import { mysterySets } from '../data/mysteries';
import { getTodaysDevotion } from '../data/devotions';

interface PrayerSelectionScreenProps {
    onSelectRosary: () => void;
    onStartRosaryWithContinuous?: () => void;
    onSelectSacredPrayers: () => void;
    onSelectDailyReadings: () => void;
    onSelectBibleInYear?: () => void;
    onResetProgress?: () => void;
    onStartSacredWithContinuous?: () => void;
}

    export function PrayerSelectionScreen({ onSelectRosary, onStartRosaryWithContinuous, onSelectSacredPrayers, onStartSacredWithContinuous, onSelectDailyReadings, onSelectBibleInYear, onResetProgress }: PrayerSelectionScreenProps) {
    const { language, currentMysterySet, playAudio } = useApp();
    const { aiEnabled } = useAI();
    const [showSettings, setShowSettings] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
const [appVersion, setAppVersion] = useState<VersionInfo | null>(null);


    // Liturgical data guaranteed non-null via fallback
    const [liturgicalData, setLiturgicalData] = useState<LiturgicalDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRosaryCompleted, setIsRosaryCompleted] = useState(false);
    const [isSacredCompleted, setIsSacredCompleted] = useState(false);
    const [isReminderEnabled, setIsReminderEnabled] = useState(false);

    // Bible Progress
    const { missedDays, expectedDay, isDayComplete, bibleStartDate } = useBibleProgress();

    // Determine which Bible day to play (same logic as BibleInYearScreen)
    const bibleDayToPlay = useMemo(() => {
        return missedDays.length > 0 ? missedDays[0] : expectedDay;
    }, [missedDays, expectedDay]);

    // Rosary quick play from church icon
    const rosaryPlayback = useRosaryPlayback(currentMysterySet as MysteryType, {
        onComplete: () => {
            setIsQuickPlayActive(false);
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            localStorage.setItem('rosary_last_completed', todayStr);
            setIsRosaryCompleted(true);
        }
    });

    // Daily Readings quick play
    const dailyReadingsPlayback = useDailyReadingsPlayback(new Date(), {
        onComplete: () => {
            setIsDailyReadingsQuickPlayActive(false);
        }
    });

    // Sacred Prayers quick play
    const sacredPlayback = useSacredPrayersPlayback({
        onComplete: () => {
            setIsSacredQuickPlayActive(false);
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            localStorage.setItem('sacred_last_completed', todayStr);
            setIsSacredCompleted(true);
        }
    });

    // Bible in Year quick play
    const biblePlaybackOptions = useMemo(() => ({
        onComplete: () => {
            setIsBibleQuickPlayActive(false);
        }
    }), []);
    const biblePlayback = useBiblePlayback(bibleDayToPlay, biblePlaybackOptions);

    const [isQuickPlayActive, setIsQuickPlayActive] = useState(false);
    const [rosaryIntroSubtitle, setRosaryIntroSubtitle] = useState<string | null>(null);
    const isQuickPlayActiveRef = useRef(false);

    const [isDailyReadingsQuickPlayActive, setIsDailyReadingsQuickPlayActive] = useState(false);
    const isDailyReadingsQuickPlayActiveRef = useRef(false);

    // Event-driven: tracks Daily Readings audio that outlives this component (after navigation)
    const [isDailyReadingsGlobalActive, setIsDailyReadingsGlobalActive] = useState(() => getDailyReadingsPlaying());
    useEffect(() => {
        const handler = (e: Event) =>
            setIsDailyReadingsGlobalActive((e as CustomEvent).detail.playing);
        window.addEventListener('dailyReading:playState', handler);
        return () => window.removeEventListener('dailyReading:playState', handler);
    }, []);

    const [isBibleQuickPlayActive, setIsBibleQuickPlayActive] = useState(false);
    const isBibleQuickPlayActiveRef = useRef(false);

    const [isSacredQuickPlayActive, setIsSacredQuickPlayActive] = useState(false);
    const isSacredQuickPlayActiveRef = useRef(false);

    // Event-driven tracks Bible audio that outlives component
    const [isBibleGlobalActive, setIsBibleGlobalActive] = useState(() => getBiblePlaying());
    useEffect(() => {
        const handler = (e: Event) => setIsBibleGlobalActive((e as CustomEvent).detail.playing);
        window.addEventListener('bible:playState', handler);
        return () => window.removeEventListener('bible:playState', handler);
    }, []);

    useEffect(() => {
        isQuickPlayActiveRef.current = isQuickPlayActive;
    }, [isQuickPlayActive]);

    useEffect(() => {
        isDailyReadingsQuickPlayActiveRef.current = isDailyReadingsQuickPlayActive;
    }, [isDailyReadingsQuickPlayActive]);

    useEffect(() => {
        isBibleQuickPlayActiveRef.current = isBibleQuickPlayActive;
    }, [isBibleQuickPlayActive]);

    useEffect(() => {
        isSacredQuickPlayActiveRef.current = isSacredQuickPlayActive;
    }, [isSacredQuickPlayActive]);

    // Church icon hint (shows on first load each session, hides when any icon clicked)
    const [showChurchHint, setShowChurchHint] = useState(() => {
        return sessionStorage.getItem('church_hint_dismissed') !== 'true';
    });

    const hideChurchHint = () => {
        setShowChurchHint(false);
        sessionStorage.setItem('church_hint_dismissed', 'true');
    };

    useEffect(() => {
        const initScreen = async () => {
            try {
                // Parallel fetch for speed
                const [version, liturgy] = await Promise.all([
                    getVersionInfo(),
                    fetchLiturgicalDay(new Date(), language)
                ]);

                setAppVersion(version);
                setLiturgicalData(liturgy);
            } catch (e) {
                console.error("Failed to load screen data", e);
            } finally {
                setLoading(false);
            }
        };

        const checkCompletion = () => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;

            const reminderSetting = localStorage.getItem('rosary_reminder_enabled') === 'true';
            setIsReminderEnabled(reminderSetting);// 1. Rosary Completion
            const lastCompletedFlag = localStorage.getItem('rosary_last_completed');
            const hasHistoryCompletion = hasCompletionOnDate(todayStr); // Check persistent history

            if (lastCompletedFlag === todayStr || hasHistoryCompletion) {
                setIsRosaryCompleted(true);
                if (hasHistoryCompletion && lastCompletedFlag !== todayStr) {
                    localStorage.setItem('rosary_last_completed', todayStr);
                }
            } else {
                setIsRosaryCompleted(false);
            }

            // 2. Sacred Prayers Completion
            const sacredLastCompletedFlag = localStorage.getItem('sacred_last_completed');
            if (sacredLastCompletedFlag === todayStr) {
                setIsSacredCompleted(true);
            } else {
                setIsSacredCompleted(false);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkCompletion();
            }
        };

        checkCompletion();
        initScreen();

        window.addEventListener('focus', checkCompletion);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', checkCompletion);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [language, showSettings]);

    // Calculate liturgical color hex for Rosary card styling
    const rosaryColorHex = liturgicalData?.celebrations?.[0]?.colour
        ? getLiturgicalColorHex(liturgicalData.celebrations[0].colour)
        : '#10B981';

    // Determine if we should show the glow (Only if reminder ON and NOT completed)
    const showGlow = isReminderEnabled && !isRosaryCompleted;

    // Get mystery color for visual feedback
    const getMysteryColor = (): string => {
        const colors = {
            joyful: '#D4AF37',
            sorrowful: '#4C6EF5',
            glorious: '#E5E7EB',
            luminous: '#FCD34D'
        };
        return colors[currentMysterySet] || '#D4AF37';
    };

    // Handle church icon click - play/stop rosary
    const handleRosaryQuickPlay = () => {
        hideChurchHint();
        if (isQuickPlayActive || rosaryPlayback.isPlaying) {
            // Stop playback (works during intro or prayers)
            setIsQuickPlayActive(false);
            setRosaryIntroSubtitle(null);
            rosaryPlayback.stop();
        } else {
            // Set active immediately to show stop icon
            setIsQuickPlayActive(true);

            // Check if this is initial start (at step 0)
            const isInitialStart = rosaryPlayback.currentStepIndex === 0;

            if (isInitialStart) {
                // Play HomeScreen intro first, then start prayers
                const mysterySet = mysterySets.find(m => m.type === currentMysterySet);
                const devotion = getTodaysDevotion();

                if (mysterySet && devotion) {
                    const mysteryName = mysterySet.name[language];
                    const daysText = mysterySet.days.map(day => {
                        const dayNames = {
                            en: {
                                monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
                                thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
                            },
                            es: {
                                monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
                                thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
                            }
                        };
                        return dayNames[language][day];
                    }).join(' & ');

                    const forDays = language === 'es' ? 'Para' : 'For';
                    const dailyDevotionLabel = language === 'es' ? 'DEVOCIÓN DIARIA' : 'DAILY DEVOTION';
                    const devotionTitle = devotion.title[language];
                    const devotionText = devotion.fullText[language];

                    const introAudioText = `${mysteryName}. ${forDays} ${daysText}. ${dailyDevotionLabel}. ${devotionTitle}. ${devotionText}`;

                    setRosaryIntroSubtitle(mysteryName);

                    // Play intro, then start prayers
                    playAudio(introAudioText, () => {
                        setRosaryIntroSubtitle(null);
                        // Only continue if still active (user didn't stop during intro)
                        if (isQuickPlayActiveRef.current) {
                            rosaryPlayback.play();
                        }
                    });
                } else {
                    rosaryPlayback.play();
                }
            } else {
                // Resume from where we left off
                rosaryPlayback.play();
            }
        }
    };

    // Handle Rosary card click - navigate to appropriate screen
    const handleRosaryCardClick = () => {
        if (isQuickPlayActive || rosaryPlayback.isPlaying) {
            // Stop the hook's playback and let MysteryScreen take over with continuous mode
            setIsQuickPlayActive(false);
            setRosaryIntroSubtitle(null);
            rosaryPlayback.stop();
            // Navigate with continuous mode enabled
            if (onStartRosaryWithContinuous) {
                onStartRosaryWithContinuous();
            } else {
                onSelectRosary();
            }
        } else {
            // Not playing - go to home or prayer screen based on progress
            onSelectRosary();
        }
    };

    // Handle Daily Readings quick play
    const handleDailyReadingsQuickPlay = () => {
        hideChurchHint();
        const isActive = isDailyReadingsQuickPlayActive || dailyReadingsPlayback.isPlaying || isDailyReadingsGlobalActive;
        if (isActive) {
            // stop() fires killDailyReadingsPlayback internally (increments _playVersion + events)
            setIsDailyReadingsQuickPlayActive(false);
            dailyReadingsPlayback.stop();
        } else {
            setIsDailyReadingsQuickPlayActive(true);
            dailyReadingsPlayback.play();
        }
    };

    // Handle Bible in Year quick play
    const handleBibleQuickPlay = () => {
        hideChurchHint();
        const isActive = isBibleQuickPlayActive || biblePlayback.isPlaying || isBibleGlobalActive;
        if (isActive) {
            setIsBibleQuickPlayActive(false);
            biblePlayback.stop();
        } else {
            setIsBibleQuickPlayActive(true);
            biblePlayback.play();
        }
    };

    // Handle Sacred Prayers quick play
    const handleSacredQuickPlay = () => {
        hideChurchHint();
        if (isSacredQuickPlayActive || sacredPlayback.isPlaying) {
            setIsSacredQuickPlayActive(false);
            isSacredQuickPlayActiveRef.current = false;
            sacredPlayback.stop();
        } else {
            setIsSacredQuickPlayActive(true);
            isSacredQuickPlayActiveRef.current = true;
            sacredPlayback.play();
        }
    };

    const handleReset = () => {
        localStorage.removeItem('rosary_last_completed');
        setIsRosaryCompleted(false);
        if (onResetProgress) onResetProgress();
    };

    const t = {
        en: {
            title: 'Choose Prayer',
            rosary: 'Holy Rosary',
            rosarySubtitle: 'Mysteries of faith and hope',
            sacredPrayers: 'Sacred Prayers',
            sacredPrayersSubtitle: 'Communion with the Most High',
            dailyReadings: 'Daily Readings',
            dailyReadingsSubtitle: 'The living word of God',
            bibleInAYear: 'Bible in a Year',
            bibleInAYearSubtitle: 'Day {day} of 365',
            settings: 'Settings',
            prayed: 'Prayed'
        },
        es: {
            title: 'Elegir Oración',
            rosary: 'Santo Rosario',
            rosarySubtitle: 'Misterios de fe y esperanza',
            sacredPrayers: 'Oraciones Sagradas',
            sacredPrayersSubtitle: 'Comunión con el Altísimo',
            dailyReadings: 'Lecturas Diarias',
            dailyReadingsSubtitle: 'La palabra viva de Dios',
            bibleInAYear: 'Biblia en un Año',
            bibleInAYearSubtitle: 'Día {day} de 365',
            settings: 'Ajustes',
            prayed: 'Completado'
        }
    }[language];



    // Show loading state
    if (loading) {
        return (
            <div className="selection-container">
                <main className="selection-main">
                    <div className="loading-spinner-container">
                        <Loader2 className="spinner-icon" size={48} />
                    </div>
                </main>
            </div>
        );
    }

    // liturgicalData is guaranteed non-null due to fallback logic

    return (
        <div className="selection-container fade-in" style={{ position: 'relative' }}>
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={handleReset}
            />
            {isAIModalOpen && (
                <AIModal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    contextStr=""
                    topicName="General"
                    source="Home Screen"
                    language={language}
                    startTab="chat"
                />
            )}

            <div className="selection-header" style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: 'auto',
                padding: 0,
                zIndex: 10,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                {aiEnabled && (
                    <button
                        className="settings-button"
                        onClick={() => setIsAIModalOpen(true)}
                        aria-label="Ask AI Companion"
                        style={{
                            color: 'var(--gold, #d4af37)',
                            background: 'transparent',
                            border: 'none',
                            boxShadow: 'none',
                            padding: '8px',
                            position: 'relative'
                        }}
                    >
                        <Sparkles size={24} strokeWidth={2} />
                    </button>
                )}
                <button
                    className="settings-button"
                    onClick={() => setShowSettings(true)}
                    aria-label={t.settings}
                    style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        padding: '8px'
                    }}
                >
                    <SettingsIcon size={24} strokeWidth={2.5} />
                </button>
            </div>

            <main className="selection-main" style={{ paddingTop: 0 }}>
                {/* 1. Liturgical Status (Top) - Pass Data Directly */}
                {liturgicalData && <LiturgicalCard dayData={liturgicalData} />}

                {/* 2. Action Header (Title) */}
                <h1
                    className="selection-title"
                    style={{
                        margin: '-0.4rem 0 -0.4rem', // symmetrical negative spacing
                        fontSize: '1.5rem',
                        letterSpacing: '0.15em',
                        color: '#E5E7EB', // Action header is neutral/white
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        fontWeight: 300, // Removed boldness
                        textAlign: 'center',
                        width: '100%'
                    }}
                >
                    {t.title.toUpperCase()}
                </h1>

                {/* 3. Helper Divider (Below Title) - Reduced spacing */}
                <div className="decorative-divider" style={{ opacity: 0.6, position: 'relative' }}>
                    <div className="divider-line divider-line-left"></div>
                    <button
                        onClick={handleDailyReadingsQuickPlay}
                        disabled={dailyReadingsPlayback.loading || !dailyReadingsPlayback.hasReadings}
                        className="church-icon-button"
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: dailyReadingsPlayback.loading || !dailyReadingsPlayback.hasReadings ? 'not-allowed' : 'pointer',
                            opacity: dailyReadingsPlayback.loading || !dailyReadingsPlayback.hasReadings ? 0.3 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        aria-label={(isDailyReadingsQuickPlayActive || dailyReadingsPlayback.isPlaying || isDailyReadingsGlobalActive) ? 'Stop Daily Readings' : 'Play All Daily Readings'}
                    >
                        {(isDailyReadingsQuickPlayActive || dailyReadingsPlayback.isPlaying || isDailyReadingsGlobalActive) ? (
                            <Square
                                size={20}
                                fill={dailyReadingsPlayback.liturgicalColor}
                                stroke={dailyReadingsPlayback.liturgicalColor}
                            />
                        ) : (
                            <span className="material-symbols-outlined divider-icon">church</span>
                        )}
                    </button>
                    <div className="divider-line divider-line-right"></div>
                </div>

                {/* Daily Readings Card */}
                <button
                    onClick={onSelectDailyReadings}
                    className="prayer-card"
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        border: (isDailyReadingsQuickPlayActive || dailyReadingsPlayback.isPlaying || isDailyReadingsGlobalActive) ? `1px solid ${dailyReadingsPlayback.liturgicalColor}` : undefined,
                        boxShadow: (isDailyReadingsQuickPlayActive || dailyReadingsPlayback.isPlaying || isDailyReadingsGlobalActive) ? `0 0 15px ${dailyReadingsPlayback.liturgicalColor}40` : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div className="card-image-container">
                        <div className="card-image">
                            <img src="/images/daily_readings_icon.png" alt={t.dailyReadings} />
                        </div>
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
                        {/* Title Row */}
                        <div className="card-title-row">
                            <h2 className="card-title">{t.dailyReadings.toUpperCase()}</h2>
                            {/* Percentage / Flag (Only show if not complete and progress > 0) */}
                            {(!dailyReadingsPlayback.isComplete && dailyReadingsPlayback.progressPercentage > 0) && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#D4AF37',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    letterSpacing: '0.02em',
                                    opacity: 0.95
                                }}>
                                    {Math.round(dailyReadingsPlayback.progressPercentage)}%
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>flag</span>
                                </div>
                            )}
                        </div>

                        {/* Inline Progress Bar */}
                        {!dailyReadingsPlayback.isComplete && (
                            <div style={{
                                width: '100%',
                                height: '2px',
                                background: 'rgba(255, 255, 255, 0.15)',
                                marginBottom: '10px',
                                borderRadius: '1px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${dailyReadingsPlayback.progressPercentage}%`,
                                    background: '#D4AF37',
                                    transition: 'width 0.3s linear'
                                }} />
                            </div>
                        )}

                        {/* Subtitle */}
                        <p className="card-subtitle" style={{
                            margin: 0,
                            ...(((isDailyReadingsQuickPlayActive || dailyReadingsPlayback.isPlaying) && dailyReadingsPlayback.currentSubtitle)
                                ? { color: dailyReadingsPlayback.liturgicalColor, fontWeight: 500, opacity: 0.95, filter: 'brightness(1.4)' }
                                : {})
                        }}>
                            {((isDailyReadingsQuickPlayActive || dailyReadingsPlayback.isPlaying) && dailyReadingsPlayback.currentSubtitle)
                                ? dailyReadingsPlayback.currentSubtitle
                                : t.dailyReadingsSubtitle}
                        </p>
                    </div>
                    {dailyReadingsPlayback.isComplete ? (
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${dailyReadingsPlayback.liturgicalColor}`,
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 10px ${dailyReadingsPlayback.liturgicalColor}30`
                        }}>
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: '20px',
                                    color: dailyReadingsPlayback.liturgicalColor
                                }}
                            >
                                check
                            </span>
                        </div>
                    ) : (
                        <ChevronRight className="card-chevron" size={24} />
                    )}
                </button>

                {/* Divider with clickable church icon for Bible in Year quick play */}
                <div className="decorative-divider" style={{ position: 'relative' }}>
                    <div className="divider-line divider-line-left"></div>
                    <button
                        onClick={handleBibleQuickPlay}
                        disabled={biblePlayback.loading || !biblePlayback.hasReadings}
                        className="church-icon-button"
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: biblePlayback.loading || !biblePlayback.hasReadings ? 'not-allowed' : 'pointer',
                            opacity: biblePlayback.loading || !biblePlayback.hasReadings ? 0.3 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        aria-label={(isBibleQuickPlayActive || biblePlayback.isPlaying || isBibleGlobalActive) ? 'Stop Bible Reading' : 'Play Bible Reading'}
                    >
                        {(isBibleQuickPlayActive || biblePlayback.isPlaying || isBibleGlobalActive) ? (
                            <Square
                                size={20}
                                fill={biblePlayback.liturgicalColor}
                                stroke={biblePlayback.liturgicalColor}
                            />
                        ) : (
                            <span className="material-symbols-outlined divider-icon">church</span>
                        )}
                    </button>
                    <div className="divider-line divider-line-right"></div>
                </div>

                {/* Bible in a Year Card */}
                <button
                    onClick={() => onSelectBibleInYear?.()}
                    className="prayer-card"
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        border: (isBibleQuickPlayActive || biblePlayback.isPlaying || isBibleGlobalActive) ? `1px solid ${biblePlayback.liturgicalColor}` : undefined,
                        boxShadow: (isBibleQuickPlayActive || biblePlayback.isPlaying || isBibleGlobalActive) ? `0 0 15px ${biblePlayback.liturgicalColor}40` : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div className="card-image-container">
                        <div className="card-image">
                            <img src="/images/bible_year_icon.png" alt={t.bibleInAYear} />
                        </div>
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
                        {/* Title Row */}
                        <div className="card-title-row">
                            <h2 className="card-title">{t.bibleInAYear.toUpperCase()}</h2>

                            {/* Percentage / Flag (Only show if not complete and progress > 0) */}
                            {(!isDayComplete(bibleDayToPlay) && biblePlayback.progressPercentage > 0) && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#D4AF37',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    letterSpacing: '0.02em',
                                    opacity: 0.95
                                }}>
                                    {Math.round(biblePlayback.progressPercentage)}%
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>flag</span>
                                </div>
                            )}
                        </div>

                        {/* Inline Progress Bar */}
                        {!isDayComplete(bibleDayToPlay) && (
                            <div style={{
                                width: '100%',
                                height: '2px',
                                background: 'rgba(255, 255, 255, 0.15)',
                                marginBottom: '10px',
                                borderRadius: '1px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${biblePlayback.progressPercentage}%`,
                                    background: '#D4AF37',
                                    transition: 'width 0.3s linear'
                                }} />
                            </div>
                        )}

                        {/* Subtitle */}
                        <p className="card-subtitle" style={{
                            margin: 0,
                            ...(((isBibleQuickPlayActive || biblePlayback.isPlaying) && biblePlayback.currentSubtitle)
                                ? { color: biblePlayback.liturgicalColor, fontWeight: 500, opacity: 0.95, filter: 'brightness(1.4)' }
                                : {})
                        }}>
                            {((isBibleQuickPlayActive || biblePlayback.isPlaying) && biblePlayback.currentSubtitle)
                                ? biblePlayback.currentSubtitle
                                : (() => {
                                    if (!bibleStartDate) return t.bibleInAYearSubtitle.replace('{day}', '1');

                                    if (missedDays.length > 0) {
                                        const resumeDay = missedDays[0];
                                        const count = missedDays.length;
                                        if (language === 'es') {
                                            return count === 1 ? `Continuar Día ${resumeDay} ( 1 día perdido )` : `Continuar Día ${resumeDay} ( ${count} días perdidos )`;
                                        } else {
                                            return count === 1 ? `Resume Day ${resumeDay} ( 1 day missed )` : `Resume Day ${resumeDay} ( ${count} days missed )`;
                                        }
                                    }

                                    if (isDayComplete(expectedDay)) {
                                        return language === 'es' ? `Día ${expectedDay} • Completado` : `Day ${expectedDay} • Complete`;
                                    }

                                    return t.bibleInAYearSubtitle.replace('{day}', expectedDay.toString());
                                })()}
                        </p>
                    </div>
                    {missedDays.length === 0 && isDayComplete(expectedDay) ? (
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${biblePlayback.liturgicalColor}`,
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 10px ${biblePlayback.liturgicalColor}30`
                        }}>
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: '20px',
                                    color: biblePlayback.liturgicalColor
                                }}
                            >
                                check
                            </span>
                        </div>
                    ) : (
                        <ChevronRight className="card-chevron" size={24} />
                    )}
                </button>

                {/* Divider with clickable church icon for quick play */}
                <div className="decorative-divider">
                    <div className="divider-line divider-line-left"></div>
                    <button
                        onClick={handleRosaryQuickPlay}
                        className="divider-icon-button"
                        aria-label={(isQuickPlayActive || rosaryPlayback.isPlaying) ? "Stop Rosary" : "Play Rosary"}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {(isQuickPlayActive || rosaryPlayback.isPlaying) ? (
                            <Square size={20} fill="currentColor" style={{ color: getMysteryColor() }} />
                        ) : (
                            <span className="material-symbols-outlined divider-icon">church</span>
                        )}
                    </button>
                    <div className="divider-line divider-line-right"></div>
                </div>

                {/* Rosary Card */}
                <button
                    onClick={handleRosaryCardClick}
                    className="prayer-card"
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        // When completed or disabled, use default border (undefined)
                        // When reminder active and NOT completed OR if playing audio, use colored border
                        border: (showGlow || isQuickPlayActive || rosaryPlayback.isPlaying) ? `1px solid ${rosaryColorHex}` : undefined,
                        boxShadow: (showGlow || isQuickPlayActive || rosaryPlayback.isPlaying) ? `0 0 15px ${rosaryColorHex}40` : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div className="card-image-container">
                        <div className="card-image">
                            <img src="/images/rosary_icon.png" alt={t.rosary} />
                        </div>
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
                        {/* Title Row */}
                        <div className="card-title-row">
                            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {t.rosary.toUpperCase()}
                            </h2>
                            {(!isRosaryCompleted && rosaryPlayback.progressPercentage > 0) && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#D4AF37',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    letterSpacing: '0.02em',
                                    opacity: 0.95
                                }}>
                                    {Math.round(rosaryPlayback.progressPercentage)}%
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>flag</span>
                                </div>
                            )}
                        </div>

                        {/* Inline Progress Bar */}
                        {!isRosaryCompleted && (
                            <div style={{
                                width: '100%',
                                height: '2px',
                                background: 'rgba(255, 255, 255, 0.15)',
                                marginBottom: '10px',
                                borderRadius: '1px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${rosaryPlayback.progressPercentage}%`,
                                    background: '#D4AF37',
                                    transition: 'width 0.3s linear'
                                }} />
                            </div>
                        )}

                        {/* Subtitle */}
                        <p className="card-subtitle" style={{
                            margin: 0,
                            ...(((isQuickPlayActive || rosaryPlayback.isPlaying) && (rosaryPlayback.currentSubtitle || rosaryIntroSubtitle))
                                ? { color: rosaryColorHex, fontWeight: 500, opacity: 0.95, filter: 'brightness(1.4)' }
                                : {})
                        }}>
                            {((isQuickPlayActive || rosaryPlayback.isPlaying) && (rosaryPlayback.currentSubtitle || rosaryIntroSubtitle))
                                ? (rosaryPlayback.currentSubtitle || rosaryIntroSubtitle)
                                : t.rosarySubtitle}
                        </p>
                    </div>
                    {isRosaryCompleted ? (
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)', // Subtle glassy background
                            border: `1px solid ${rosaryColorHex}`, // Colored border matches text
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 10px ${rosaryColorHex}30` // Subtle glow matching theme
                        }}>
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: '20px',
                                    color: rosaryColorHex // Icon takes the liturgical color (like text)
                                }}
                            >
                                check
                            </span>
                        </div>
                    ) : (
                        <ChevronRight className="card-chevron" size={24} />
                    )}
                </button>

                {/* Divider (Between Rosary & Sacred Prayers) */}
                <div className="decorative-divider" style={{ opacity: 0.6, position: 'relative' }}>
                    <div className="divider-line divider-line-left"></div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSacredQuickPlay();
                        }}
                        className="church-icon-button"
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            outline: 'none'
                        }}
                        aria-label={(isSacredQuickPlayActive || sacredPlayback.isPlaying) ? "Stop Sacred Prayers" : "Quick Play Sacred Prayers"}
                        title="Quick Play Sacred Prayers"
                    >
                        {(isSacredQuickPlayActive || sacredPlayback.isPlaying) ? (
                            <Square
                                size={20}
                                fill={rosaryColorHex}
                                stroke={rosaryColorHex}
                            />
                        ) : (
                            <span className="material-symbols-outlined divider-icon">church</span>
                        )}
                    </button>
                    <div className="divider-line divider-line-right"></div>
                </div>

                {/* Sacred Prayers Card */}
                <button
                    onClick={() => {
                        if (isSacredQuickPlayActive || sacredPlayback.isPlaying) {
                            setIsSacredQuickPlayActive(false);
                            sacredPlayback.stop();
                            if (onStartSacredWithContinuous) {
                                onStartSacredWithContinuous();
                            } else {
                                onSelectSacredPrayers();
                            }
                        } else {
                            onSelectSacredPrayers();
                        }
                    }}
                    className="prayer-card"
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        border: (isSacredQuickPlayActive || sacredPlayback.isPlaying) ? `1px solid ${rosaryColorHex}` : undefined,
                        boxShadow: (isSacredQuickPlayActive || sacredPlayback.isPlaying) ? `0 0 15px ${rosaryColorHex}40` : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div className="card-image-container">
                        <div className="card-image">
                            <img src="/images/sacred_prayers_icon.png" alt={t.sacredPrayers} />
                        </div>
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
                        {/* Title Row */}
                        <div className="card-title-row">
                            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {t.sacredPrayers.toUpperCase()}
                            </h2>
                            {(!isSacredCompleted && sacredPlayback.progressPercentage > 0) && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#D4AF37',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    letterSpacing: '0.02em',
                                    opacity: 0.95
                                }}>
                                    {Math.round(sacredPlayback.progressPercentage)}%
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>flag</span>
                                </div>
                            )}
                        </div>

                        {/* Inline Progress Bar */}
                        {!isSacredCompleted && (
                            <div style={{
                                width: '100%',
                                height: '2px',
                                background: 'rgba(255, 255, 255, 0.15)',
                                marginBottom: '10px',
                                borderRadius: '1px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${sacredPlayback.progressPercentage}%`,
                                    background: '#D4AF37',
                                    transition: 'width 0.3s linear'
                                }} />
                            </div>
                        )}

                        {/* Subtitle */}
                        <p className="card-subtitle" style={{
                            margin: 0,
                            ...(((isSacredQuickPlayActive || sacredPlayback.isPlaying) && sacredPlayback.currentSubtitle)
                                ? { color: rosaryColorHex, fontWeight: 500, opacity: 0.95, filter: 'brightness(1.4)' }
                                : {})
                        }}>
                            {((isSacredQuickPlayActive || sacredPlayback.isPlaying) && sacredPlayback.currentSubtitle)
                                ? sacredPlayback.currentSubtitle
                                : t.sacredPrayersSubtitle}
                        </p>
                    </div>
                    {isSacredCompleted ? (
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${rosaryColorHex}`,
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 10px ${rosaryColorHex}30`
                        }}>
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: '20px',
                                    color: rosaryColorHex
                                }}
                            >
                                check
                            </span>
                        </div>
                    ) : (
                        <ChevronRight className="card-chevron" size={24} />
                    )}
                </button>
            </main>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={handleReset}
            />

            {/* Version Indicator */}
            {appVersion && (
                <div className="version-indicator">
                    App updated: {(() => {
                        const d = new Date(appVersion.timestamp);
                        const month = (d.getMonth() + 1).toString().padStart(2, '0');
                        const day = d.getDate().toString().padStart(2, '0');
                        const year = d.getFullYear().toString().slice(-2);
                        let hours = d.getHours();
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        hours = hours % 12;
                        hours = hours ? hours : 12;
                        const minutes = d.getMinutes().toString().padStart(2, '0');
                        return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
                    })()}
                </div>
            )}

            {/* Church Icon Hint */}
            {showChurchHint && (
                <div style={{
                    position: 'fixed',
                    bottom: '0.5rem',
                    right: '1rem',
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.3)',
                    zIndex: 10,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                    fontFamily: 'monospace'
                }}>
                    Tap ⛪ to play
                </div>
            )}
        </div>
    );
}

export default PrayerSelectionScreen;





