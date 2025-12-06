import { useState } from 'react';
import { Settings as SettingsIcon, Volume2, StopCircle, Lightbulb } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mysterySets } from '../data/mysteries';
import { hasActiveSession, loadPrayerProgress, hasValidPrayerProgress, clearPrayerProgress, clearSession } from '../utils/storage';
import { PrayerFlowEngine, type MysteryType } from '../utils/prayerFlowEngine';
import { SettingsModal } from './SettingsModal';
import { BottomNav } from './BottomNav';
import { getTodaysDevotion } from '../data/devotions';
import { useNavigationHandler } from '../hooks/useNavigationHandler';
import './HomeScreen.css';
import educationalDataEs from '../data/es-rosary-educational-content.json';
import educationalDataEn from '../data/en-rosary-educational-content.json';
import { LearnMoreModal, type EducationalContent } from './LearnMoreModal';

interface HomeScreenProps {
    onStartPrayer: () => void;
    onStartPrayerWithContinuous: () => void;
    onNavigateToMysteries: () => void;
    onNavigateToPrayers: () => void;
    onNavigateToProgress?: () => void;
}

export function HomeScreen({ onStartPrayer, onStartPrayerWithContinuous, onNavigateToMysteries, onNavigateToPrayers, onNavigateToProgress }: HomeScreenProps) {
    const { language, currentMysterySet, startNewSession, resumeSession, playAudio, audioEnabled, stopAudio } = useApp();
    const [showSettings, setShowSettings] = useState(false);
    const [showLearnMore, setShowLearnMore] = useState(false);
    const [isPlayingHomeAudio, setIsPlayingHomeAudio] = useState(false);

    const hasSession = hasActiveSession();
    const mysterySet = mysterySets.find(m => m.type === currentMysterySet);
    const devotion = getTodaysDevotion();

    const translations = {
        en: {
            title: 'The Rosary',
            todaysMystery: 'Today\'s Mystery',
            forDays: 'For',
            dailyDevotion: 'DAILY DEVOTION',
            readMore: 'Read More',
            readLess: 'Read Less',
            settings: 'Settings',
            continuousAudio: 'Continuous Audio',
            stopAudio: 'Stop Audio',
            dailyDevotionAudio: 'Daily Devotion',
            learnMore: 'Learn More',
            days: {
                monday: 'Monday',
                tuesday: 'Tuesday',
                wednesday: 'Wednesday',
                thursday: 'Thursday',
                friday: 'Friday',
                saturday: 'Saturday',
                sunday: 'Sunday'
            }
        },
        es: {
            title: 'El Rosario',
            todaysMystery: 'Misterio de Hoy',
            forDays: 'Para',
            dailyDevotion: 'DEVOCIÓN DIARIA',
            readMore: 'Leer Más',
            readLess: 'Leer Menos',
            settings: 'Configuración',
            continuousAudio: 'Audio Continuo',
            stopAudio: 'Detener Audio',
            dailyDevotionAudio: 'Devoción Diaria',
            learnMore: 'Profundizar',
            days: {
                monday: 'Lunes',
                tuesday: 'Martes',
                wednesday: 'Miércoles',
                thursday: 'Jueves',
                friday: 'Viernes',
                saturday: 'Sábado',
                sunday: 'Domingo'
            }
        }
    };

    const t = translations[language];

    const handleStart = () => {
        // Check if rosary is complete BEFORE session management
        // startNewSession/resumeSession will reset the state and wipe completion
        const savedProgress = loadPrayerProgress(currentMysterySet);
        if (savedProgress && hasValidPrayerProgress(currentMysterySet)) {
            const engine = new PrayerFlowEngine(currentMysterySet as MysteryType, language);
            engine.jumpToStep(savedProgress.currentStepIndex);
            const progress = engine.getProgress();

            if (progress >= 99) {
                // Already complete - skip session management, just navigate
                onStartPrayer();
                return;
            }
        }

        if (hasSession) {
            resumeSession();
        } else {
            startNewSession(currentMysterySet);
        }
        onStartPrayer();
    };

    const handleContinuousStart = () => {
        // Check if there's saved progress
        const savedProgress = loadPrayerProgress(currentMysterySet);
        const hasProgress = savedProgress && hasValidPrayerProgress(currentMysterySet);

        console.log('[Continuous Audio] savedProgress:', savedProgress);
        console.log('[Continuous Audio] hasProgress:', hasProgress);
        console.log('[Continuous Audio] audioEnabled:', audioEnabled);
        console.log('[Continuous Audio] mysterySet:', mysterySet);
        console.log('[Continuous Audio] devotion:', devotion);

        if (hasProgress) {
            console.log('[Continuous Audio] Has progress - navigating to mystery screen');
            // Has progress - navigate directly to mystery screen
            const engine = new PrayerFlowEngine(currentMysterySet as MysteryType, language);
            engine.jumpToStep(savedProgress.currentStepIndex);
            const progress = engine.getProgress();

            if (progress >= 99) {
                // Already complete - go to completion screen with audio
                onStartPrayerWithContinuous();
                return;
            }

            // Resume with continuous mode
            if (hasSession) {
                resumeSession();
            } else {
                startNewSession(currentMysterySet);
            }
            onStartPrayerWithContinuous();
        } else {
            console.log('[Continuous Audio] No progress - playing home audio first');
            // No progress - play home page audio first
            if (audioEnabled && mysterySet && devotion) {
                console.log('[Continuous Audio] Playing home audio...');

                // Get the daily devotion label for audio
                const dailyDevotionLabel = t.dailyDevotionAudio;

                // Build audio segments for mystery name, daily devotion heading, title, and text
                const audioSegments = [
                    {
                        text: `${mysterySet.name[language]}. ${dailyDevotionLabel}. ${devotion.title[language]}. ${devotion.fullText[language]}`,
                        gender: 'female' as const
                    }
                ];

                // Set playing state
                setIsPlayingHomeAudio(true);

                // Play audio, then navigate to mystery screen
                playAudio(audioSegments, () => {
                    console.log('[Continuous Audio] Home audio complete - navigating to mystery screen');
                    setIsPlayingHomeAudio(false);
                    // Start new session
                    startNewSession(currentMysterySet);
                    // Navigate to mystery screen with continuous mode
                    onStartPrayerWithContinuous();
                });
            } else {
                console.log('[Continuous Audio] Audio disabled or missing data - navigating directly');
                // Audio disabled - just navigate
                startNewSession(currentMysterySet);
                onStartPrayerWithContinuous();
            }
        }
    };

    const handleStopHomeAudio = () => {
        console.log('[Home Audio] Stopping audio');
        setIsPlayingHomeAudio(false);
        stopAudio();
    };

    const getDaysText = () => {
        if (!mysterySet) return '';
        return mysterySet.days.map(day => t.days[day]).join(' & ');
    };

    const handleTabChange = useNavigationHandler({
        onNavigateToProgress,
        onNavigateToMysteries,
        onNavigateToPrayers
    });

    return (
        <div className="home-container">
            {/* Hero Section with Overlay Header */}
            <div className="hero-section">
                <div className="hero-image"></div>
                <div className="hero-overlay"></div>

                <div className="hero-header">
                    <button
                        className="icon-btn"
                        onClick={isPlayingHomeAudio ? handleStopHomeAudio : handleContinuousStart}
                        aria-label={isPlayingHomeAudio ? t.stopAudio : t.continuousAudio}
                    >
                        {isPlayingHomeAudio ? <StopCircle size={20} /> : <Volume2 size={20} />}
                    </button>

                    <h1 className="hero-title">{t.title}</h1>

                    <div className="header-actions">
                        <button
                            className="icon-btn"
                            onClick={() => setShowLearnMore(true)}
                            aria-label={t.learnMore}
                        >
                            <Lightbulb size={20} />
                        </button>
                        <button
                            className="icon-btn"
                            onClick={() => setShowSettings(true)}
                            aria-label={t.settings}
                        >
                            <SettingsIcon size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Overlapping Hero */}
            <main className="home-main">
                {/* Mystery Card */}
                <div className="glass-card">
                    <h2 className="mystery-card-title">{mysterySet ? mysterySet.name[language] : ''}</h2>
                    <p className="mystery-card-subtitle">{t.forDays} {getDaysText()}</p>
                </div>

                {/* Daily Devotion */}
                <div className="glass-card">
                    <p className="devotion-label">{t.dailyDevotion}</p>
                    <h3 className="devotion-title">{devotion.title[language]}</h3>
                    <p className="devotion-text">
                        {devotion.fullText[language]}
                    </p>
                </div>
            </main>

            {/* Sticky Bottom Section */}
            <div className="bottom-section">
                <BottomNav
                    activeTab="progress"
                    onTabChange={handleTabChange}
                    onStartPrayer={handleStart}
                    showProgress={true}
                />
            </div>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={() => {
                    // Check if there's active progress for the current mystery
                    const savedProgress = loadPrayerProgress(currentMysterySet);
                    if (hasSession || (savedProgress && hasValidPrayerProgress(currentMysterySet))) {
                        clearPrayerProgress(currentMysterySet);
                        clearSession();
                        window.location.reload();
                    } else {
                        // If no specific active mystery, we can either do nothing or let the modal handle global clear
                        // By returning undefined here, the modal falls back to global clear? 
                        // Actually, we should probably handle it here to be explicit
                        // But to match the requested behavior: "if user ... decide to clear progress... it should only clear Joyful"
                        // If valid progress exists, we clear IT.
                        // If NO valid progress exists, we probably want to allow clearing ALL?
                        // For safety, let's just trigger global clear here or let the modal do it.
                        // Given the modal logic: if onResetProgress is passed, it uses it.
                        // So we should handle the fallback logic too if we want "Clear All" when no active session.

                        // Fallback to clearing everything if no specific active session found
                        const keys = Object.keys(localStorage);
                        keys.forEach(key => {
                            if (key.startsWith('rosary_prayer_progress') || key.startsWith('rosary_session')) {
                                localStorage.removeItem(key);
                            }
                        });
                        window.location.reload();
                    }
                }}
                currentMysteryName={(hasSession || hasValidPrayerProgress(currentMysterySet)) && mysterySet ? mysterySet.name[language] : undefined}
            />

            <LearnMoreModal
                isOpen={showLearnMore}
                onClose={() => setShowLearnMore(false)}
                data={(language === 'es' ? educationalDataEs.global_intro : educationalDataEn.global_intro) as EducationalContent}
                language={language}
            />
        </div>
    );
}

export default HomeScreen;
