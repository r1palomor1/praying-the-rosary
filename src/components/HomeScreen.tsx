import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Volume2, StopCircle, Lightbulb, ArrowLeft } from 'lucide-react';
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
    onNavigateToSelection?: () => void;
}

export function HomeScreen({ onStartPrayer, onStartPrayerWithContinuous, onNavigateToMysteries, onNavigateToPrayers, onNavigateToProgress, onNavigateToSelection }: HomeScreenProps) {
    const { language, currentMysterySet, startNewSession, resumeSession, playAudio, stopAudio, isPlaying } = useApp();
    const [showSettings, setShowSettings] = useState(false);
    const [showLearnMore, setShowLearnMore] = useState(false);


    const hasSession = hasActiveSession();
    const mysterySet = mysterySets.find(m => m.type === currentMysterySet);
    const devotion = getTodaysDevotion();

    // Match nav width to content width
    useEffect(() => {
        const updateNavWidth = () => {
            const homeMain = document.querySelector('.home-main') as HTMLElement;
            const bottomSection = document.querySelector('.bottom-section') as HTMLElement;

            if (homeMain && bottomSection) {
                const contentWidth = homeMain.offsetWidth;
                bottomSection.style.maxWidth = `${contentWidth}px`;
                console.log('Home nav width set to:', contentWidth);
            }
        };

        const timer = setTimeout(updateNavWidth, 100);
        window.addEventListener('resize', updateNavWidth);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateNavWidth);
        };
    }, []);

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
            returnToMenu: 'Back to Selection',
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
            returnToMenu: 'Volver a la Selección',
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
        // Toggle Logic: If playing, STOP.
        if (isPlaying) {
            stopAudio();
            return;
        }

        // Logic to START (existing code)
        const savedProgress = loadPrayerProgress(currentMysterySet);
        // Treat step 0 as no progress (beginning of prayer)
        const hasProgress = savedProgress && hasValidPrayerProgress(currentMysterySet) && savedProgress.currentStepIndex > 0;

        if (hasProgress) {
            // Has progress - navigate directly to mystery screen at saved position
            const engine = new PrayerFlowEngine(currentMysterySet as MysteryType, language);
            engine.jumpToStep(savedProgress.currentStepIndex);
            const progress = engine.getProgress();

            if (progress >= 99) {
                // Already complete - go to completion screen with audio
                onStartPrayerWithContinuous();
                return;
            }

            // Resume with continuous mode at saved position
            if (hasSession) {
                resumeSession();
            }
            onStartPrayerWithContinuous();
        } else {
            // No progress - Play home page audio FIRST, then navigate
            startNewSession(currentMysterySet);

            // Build complete audio: Mystery Name + "Daily Devotion" + Devotion Title + Devotion Text
            const mysteryName = mysterySet ? mysterySet.name[language] : '';
            const dailyDevotionLabel = t.dailyDevotion;
            const devotionTitle = devotion.title[language];
            const devotionText = devotion.fullText[language];

            const completeAudioText = `${mysteryName}. ${dailyDevotionLabel}. ${devotionTitle}. ${devotionText}`;

            // Play audio and wait for completion before navigating
            playAudio(completeAudioText, () => {
                // After home audio completes, navigate to prayer screen
                onStartPrayerWithContinuous();
            });
        }
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
                    <div className="header-top-row">
                        <div className="flex items-center gap-2">
                            {onNavigateToSelection && (
                                <button
                                    className="icon-btn"
                                    onClick={onNavigateToSelection}
                                    aria-label={t.returnToMenu}
                                >
                                    <ArrowLeft size={21} />
                                </button>
                            )}
                            <button
                                className="icon-btn"
                                onClick={handleContinuousStart}
                                aria-label={isPlaying ? t.stopAudio : t.continuousAudio}
                            >
                                {isPlaying ? <StopCircle size={21} /> : <Volume2 size={21} />}
                            </button>
                        </div>

                        <div className="header-actions">
                            <button
                                className="icon-btn"
                                onClick={() => setShowLearnMore(true)}
                                aria-label={t.learnMore}
                            >
                                <Lightbulb size={21} />
                            </button>
                            <button
                                className="icon-btn"
                                onClick={() => setShowSettings(true)}
                                aria-label={t.settings}
                            >
                                <SettingsIcon size={21} />
                            </button>
                        </div>
                    </div>

                    <div className="header-title-row">
                        <h1 className="hero-title">{t.title}</h1>
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
                    // ALWAYS clear only the current mystery being viewed
                    // This ensures completed mysteries are not affected when clearing a different mystery
                    clearPrayerProgress(currentMysterySet);
                    clearSession();
                    window.location.reload();
                }}
                currentMysteryName={mysterySet ? mysterySet.name[language] : undefined}
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
