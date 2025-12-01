import { useState } from 'react';
import { Settings as SettingsIcon, Volume2, Square } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mysterySets } from '../data/mysteries';
import { hasActiveSession, loadPrayerProgress, hasValidPrayerProgress } from '../utils/storage';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import { SettingsModal } from './SettingsModal';
import { BottomNav } from './BottomNav';
import { getTodaysDevotion } from '../data/devotions';
import './HomeScreen.css';

interface HomeScreenProps {
    onStartPrayer: () => void;
    onStartPrayerWithContinuous: () => void;
    onNavigateToMysteries: () => void;
    onNavigateToPrayers: () => void;
}

export function HomeScreen({ onStartPrayer, onStartPrayerWithContinuous, onNavigateToMysteries, onNavigateToPrayers }: HomeScreenProps) {
    const { language, currentMysterySet, startNewSession, resumeSession, playAudio, audioEnabled, stopAudio } = useApp();
    const [showSettings, setShowSettings] = useState(false);
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
            const engine = new PrayerFlowEngine(currentMysterySet as any, language);
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
            const engine = new PrayerFlowEngine(currentMysterySet as any, language);
            engine.jumpToStep(savedProgress.currentStepIndex);
            const progress = engine.getProgress();

            if (progress >= 99) {
                // Already complete - go to completion screen
                onStartPrayer();
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

    return (
        <div className="home-container">
            {/* Header */}
            <header className="home-header">
                <button
                    className="continuous-audio-btn-header"
                    onClick={isPlayingHomeAudio ? handleStopHomeAudio : handleContinuousStart}
                    aria-label={isPlayingHomeAudio ? t.stopAudio : t.continuousAudio}
                    title={isPlayingHomeAudio ? t.stopAudio : t.continuousAudio}
                >
                    {isPlayingHomeAudio ? (
                        <Square size={20} />
                    ) : (
                        <Volume2 size={20} />
                    )}
                </button>
                <h1 className="home-title">{t.title}</h1>
                <button
                    className="settings-btn-header"
                    onClick={() => setShowSettings(true)}
                    aria-label={t.settings}
                >
                    <SettingsIcon size={20} />
                </button>
            </header>

            {/* Main Content */}
            <main className="home-main">
                {/* Hero Image */}
                <div className="hero-image"></div>

                {/* Mystery Card */}
                <div className="mystery-card-new">
                    <div className="mystery-gradient"></div>
                    <div className="mystery-content">
                        <h2 className="mystery-title-new">{mysterySet ? mysterySet.name[language] : ''}</h2>
                        <p className="mystery-days">{t.forDays} {getDaysText()}</p>
                    </div>
                </div>

                {/* Daily Devotion */}
                <div className="devotion-card">
                    <p className="devotion-label">{t.dailyDevotion}</p>
                    <h3 className="devotion-title">{devotion.title[language]}</h3>
                    <div className="devotion-content">
                        <p className="devotion-text">
                            {devotion.fullText[language]}
                        </p>
                    </div>
                </div>
            </main>

            {/* Sticky Bottom Section */}
            <div className="bottom-section">
                <BottomNav
                    activeTab="home"
                    onTabChange={(tab) => {
                        if (tab === 'mysteries') {
                            onNavigateToMysteries();
                        } else if (tab === 'prayers') {
                            onNavigateToPrayers();
                        }
                    }}
                    onStartPrayer={handleStart}
                />
            </div>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </div>
    );
}
