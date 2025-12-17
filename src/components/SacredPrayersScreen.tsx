import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, StopCircle, Settings as SettingsIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { SettingsModal } from './SettingsModal';
import { SacredPrayerFlowEngine } from '../utils/SacredPrayerFlowEngine';
import { savePrayerProgress, loadPrayerProgress, hasValidPrayerProgress, clearPrayerProgress, clearSession } from '../utils/storage';
import { wakeLockManager } from '../utils/wakeLock';
import { ResponsiveImage } from './ResponsiveImage';
import { sanitizeTextForSpeech } from '../utils/textSanitizer';

// Reuse MysteryScreen styles to ensure exact match
import './MysteryScreen.css';
import './MysteryBottomNav.css';

interface SacredPrayersScreenProps {
    onComplete: () => void;
    onBack: () => void;
}

// Reuse Icon Components from MysteryScreen
const BookOpenIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M14.5 2H9l-.35.15-.65.64-.65-.64L7 2H1.5l-.5.5v10l.5.5h5.29l.86.85h.7l.86-.85h5.29l.5-.5v-10l-.5-.5zm-7 10.32l-.18-.17L7 12H2V3h4.79l.74.74-.03 8.58zM14 12H9l-.35.15-.14.13V3.7l.7-.7H14v9zM6 5H3v1h3V5zm0 4H3v1h3V9zM3 7h3v1H3V7zm10-2h-3v1h3V5zm-3 2h3v1h-3V7zm0 2h3v1h-3V9z" />
    </svg>
);

const BookClosedIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path style={{ fill: '#B1974D', stroke: '#705F2E', strokeWidth: 3 }} d="M 22,10 77,2 77,27 22,28 z" />
        <path style={{ fill: '#B1974D', stroke: '#705F2E', strokeWidth: 3 }} d="m 34,20 58,-7 0,76 -58,7 z" />
        <path style={{ fill: '#5B4335', stroke: '#2E241F', strokeWidth: 3, strokeLinejoin: 'bevel' }} d="M 34,20 34,96 21,98 7,89 7,12 22,10 7,12 21,22 z" />
        <path style={{ fill: '#D2D2B3' }} d="M 10,13 77,3 c 0,0 -2,5 2,7 4,2 9,2 9,2 l -67,9 z" />
        <path style={{ fill: 'none', stroke: '#836959', strokeWidth: 3 }} d="m 21,23 0,74" />
    </svg>
);

const LayoutModeIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className}>
        <g>
            <path d="M43.636,40.727v273.455h285.091V40.727H43.636z M311.273,296.727H61.091v-33.588l102.251-80.725l147.931,98.621V296.727z M311.272,260.056l-81.673-54.448l32.818-28.716l48.855,34.198V260.056z M311.273,189.783l-50.054-35.037l-46.665,40.832l-52.077-34.718l-101.385,80.04V58.182h250.182V189.783z" />
        </g>
        <g>
            <path d="M369.455,157.091V0H2.909v354.909h139.636V512h366.545V157.091H369.455z M369.455,215.273h81.455v238.545H200.727v-98.909h168.727V215.273z M20.364,337.455v-320H352v320H20.364z M491.636,494.545H160V354.909h23.273v116.364h285.091V197.818h-98.909v-23.273h122.182V494.545z" />
        </g>
        <g>
            <path d="M122.182,75.636c-20.852,0-37.818,16.965-37.818,37.818c0,20.854,16.966,37.818,37.818,37.818S160,134.308,160,113.455C160,92.601,143.034,75.636,122.182,75.636z M122.182,133.818c-11.228,0-20.364-9.136-20.364-20.364c0-11.228,9.136-20.364,20.364-20.364s20.364,9.136,20.364,20.364C142.545,124.682,133.41,133.818,122.182,133.818z" />
        </g>
        <g>
            <rect x="197.818" y="87.273" width="81.455" height="17.455" />
        </g>
        <g>
            <rect x="180.364" y="122.182" width="23.273" height="17.455" />
        </g>
        <g>
            <rect x="215.273" y="122.182" width="23.273" height="17.455" />
        </g>
    </svg>
);

export default function SacredPrayersScreen({ onComplete, onBack }: SacredPrayersScreenProps) {
    const {
        language,
        isPlaying,
        playAudio,
        stopAudio,
        mysteryLayout,
        setMysteryLayout
    } = useApp();
    const { showToast } = useToast();
    const [showSettings, setShowSettings] = useState(false);

    // User-controlled text visibility preference
    const [userWantsTextHidden, setUserWantsTextHidden] = useState(false);
    const [showPrayerText, setShowPrayerText] = useState(true);

    // Highlighting state
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [highlightingEnabled, setHighlightingEnabled] = useState(false);
    const [userDisabledHighlighting] = useState(() => {
        try {
            const saved = localStorage.getItem('rosary_highlight_preference');
            return saved ? JSON.parse(saved) : false;
        } catch (e) {
            return false;
        }
    });

    const sacredMysteryKey = 'sacred_prayers';

    const [flowEngine] = useState(() => {
        try {
            const engine = new SacredPrayerFlowEngine(language);
            const savedProgress = loadPrayerProgress(sacredMysteryKey);
            // Note: hasValidPrayerProgress checks date, so it resets daily
            if (savedProgress && hasValidPrayerProgress(sacredMysteryKey)) {
                if (savedProgress.currentStepIndex >= engine.getTotalSteps() - 1) {
                    setTimeout(() => onComplete(), 0);
                } else {
                    engine.jumpToStep(savedProgress.currentStepIndex);
                }
            }
            return engine;
        } catch (e) {
            console.error("Failed to init SacredPrayerFlowEngine", e);
            throw e;
        }
    });

    const [currentStep, setCurrentStep] = useState(() => {
        try {
            return flowEngine.getCurrentStep();
        } catch (e) {
            console.error("Failed to get current step", e);
            return null;
        }
    });

    const [continuousMode, setContinuousMode] = useState(isPlaying);
    const contentRef = useRef<HTMLDivElement>(null);
    const continuousModeRef = useRef(continuousMode);
    const playbackIdRef = useRef(0);

    // --- Effects ---

    // Sync continuous mode ref
    useEffect(() => {
        continuousModeRef.current = continuousMode;
        return () => { continuousModeRef.current = false; };
    }, [continuousMode]);

    // Update language
    useEffect(() => {
        flowEngine.setLanguage(language);
        setCurrentStep(flowEngine.getCurrentStep());
    }, [language, flowEngine]);

    // Handle text visibility
    useEffect(() => {
        setShowPrayerText(!userWantsTextHidden);
    }, [userWantsTextHidden]);

    // Scroll to top on step change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (contentRef.current) {
                contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
    }, [currentStep]);

    // Save progress
    useEffect(() => {
        if (!currentStep) return;
        const progress = {
            mysteryType: sacredMysteryKey,
            currentStepIndex: flowEngine.getCurrentStepNumber() - 1,
            date: new Date().toISOString().split('T')[0],
            language
        };
        savePrayerProgress(progress);
    }, [currentStep, language, flowEngine]);

    // Save highlighting preference
    useEffect(() => {
        localStorage.setItem('rosary_highlight_preference', JSON.stringify(userDisabledHighlighting));
    }, [userDisabledHighlighting]);

    // Reset highlight when step changes
    useEffect(() => {
        setHighlightIndex(-1);
    }, [currentStep]);

    // --- Audio & Highlighting Logic ---

    // Highlighting Effect
    useEffect(() => {
        if (!isPlaying || !currentStep) {
            setHighlightIndex(-1);
            return;
        }

        const text = currentStep.text || '';
        const sanitizedText = sanitizeTextForSpeech(text);
        const sentences = sanitizedText.match(/[^.!?:]+([.!?:]+|\s*$)/g) || [text];

        // Average speech rate: ~3.0 words per second at 0.85 rate
        const wordsPerSecond = 3.0 * 0.85;

        const timeouts: number[] = [];
        let cumulativeTime = 0;

        sentences.forEach((sentence, index) => {
            const words = sentence.trim().split(/\s+/).length;
            const duration = (words / wordsPerSecond) * 1000;

            const timeout = setTimeout(() => {
                setHighlightIndex(index);
            }, cumulativeTime);

            timeouts.push(timeout);
            cumulativeTime += duration;
        });

        return () => {
            timeouts.forEach(t => clearTimeout(t));
        };
    }, [currentStep, isPlaying]);


    const getAudioSegments = (step: any): { text: string; gender: 'female' | 'male' }[] => {
        const createSegments = (call: string, response: string) => [
            { text: call, gender: 'female' as const },
            { text: response, gender: 'male' as const }
        ];

        const text = step.text;
        const splitPhrases = [
            language === 'es' ? 'Danos hoy' : 'Give us this day', // Our Father
            language === 'es' ? 'Santa María' : 'Holy Mary',    // Hail Mary
            language === 'es' ? 'Como era' : 'As it was',       // Glory Be
            language === 'es' ? 'lleva al cielo' : 'and lead all souls', // Fatima
            language === 'es' ? 'Ea, pues' : 'Turn then'        // Hail Holy Queen
        ];

        for (const phrase of splitPhrases) {
            if (text.includes(phrase)) {
                const parts = text.split(phrase);
                if (parts.length > 1) {
                    return createSegments(parts[0], phrase + parts.slice(1).join(phrase));
                }
            }
        }

        // Final Hail Mary Intros might be split by double newline
        if (step.type === 'final_hail_mary_intro' && text.includes('\n\n')) {
            const parts = text.split('\n\n');
            return createSegments(parts[0], parts[1]);
        }

        return [{ text: step.text, gender: 'female' }];
    };

    const playSequence = (step: any) => {
        if (!continuousModeRef.current) return;
        const currentPlaybackId = playbackIdRef.current;

        playAudio(getAudioSegments(step), () => {
            if (playbackIdRef.current !== currentPlaybackId) return;
            if (!continuousModeRef.current) return;

            const nextStep = flowEngine.getNextStep();
            if (nextStep) {
                setCurrentStep(nextStep);
                if (nextStep.type === 'complete') {
                    setContinuousMode(false);
                    onComplete();
                } else {
                    setTimeout(() => {
                        playSequence(nextStep);
                    }, 500);
                }
            } else {
                setContinuousMode(false);
            }
        });
    };

    const handleToggleContinuous = () => {
        if (continuousMode) {
            setContinuousMode(false);
            continuousModeRef.current = false;
            playbackIdRef.current++;
            stopAudio();
            wakeLockManager.release();
            showToast(language === 'es' ? 'Audio detenido' : 'Audio stopped', 'info');
        } else {
            showToast(language === 'es' ? 'Modo continuo activado' : 'Continuous mode enabled', 'success');
            setContinuousMode(true);
            continuousModeRef.current = true;
            if (!userDisabledHighlighting) setHighlightingEnabled(true);
            wakeLockManager.request();
            playSequence(currentStep);
        }
    };

    const handleNext = () => {
        setContinuousMode(false);
        continuousModeRef.current = false;
        stopAudio();
        const nextStep = flowEngine.getNextStep();
        if (nextStep) {
            setCurrentStep(nextStep);
            if (nextStep.type === 'complete') {
                onComplete();
            }
        }
    };

    const handlePrevious = () => {
        setContinuousMode(false);
        continuousModeRef.current = false;
        stopAudio();
        const prevStep = flowEngine.getPreviousStep();
        if (prevStep) {
            setCurrentStep(prevStep);
        }
    };

    const handleBackWithReset = () => {
        onBack();
    };

    const handleReset = () => {
        clearPrayerProgress(sacredMysteryKey);
        clearSession();
        window.location.reload();
    };

    // --- Render Helpers ---

    const renderTextWithHighlighting = (text: string, sentenceOffset: number = 0) => {
        if (!text) return text;
        if (!highlightingEnabled) return text;

        try {
            const sentences = text.match(/[^.!?:]+([.!?:]+|\s*$)/g) || [text];
            if (sentences && sentences.length > 0) {
                return sentences.map((sentence, idx) => (
                    <span key={idx} className={(idx + sentenceOffset) === highlightIndex ? "highlighted-sentence" : ""}>
                        {sentence}
                    </span>
                ));
            }
        } catch (e) {
            console.error(e);
        }
        return text;
    };

    const t = language === 'es' ? {
        back: 'Inicio',
        step: 'Paso',
        of: 'de',
        complete: 'completo',
        previous: 'Anterior',
        next: 'Siguiente',
        finish: 'Finalizar',
        stopAudio: 'Detener audio',
        playAudio: 'Reproducir audio',
        continuousMode: 'Modo Continuo',
        stopContinuous: 'Detener',
        reflection: 'Reflexión',
        menu: 'Menú',
        settings: 'Configuración'
    } : {
        back: 'Home',
        step: 'Step',
        of: 'of',
        complete: 'complete',
        previous: 'Previous',
        next: 'Next',
        finish: 'Finish',
        stopAudio: 'Stop audio',
        playAudio: 'Play audio',
        continuousMode: 'Continuous Mode',
        stopContinuous: 'Stop',
        reflection: 'Reflection',
        menu: 'Menu',
        settings: 'Settings'
    };

    if (!currentStep) {
        return <div className="p-8 text-center text-white">Loading...</div>;
    }

    const { imageUrl } = currentStep;

    return (
        <div className={`mystery-screen-container ${!showPrayerText ? 'prayer-text-hidden' : ''}`} ref={contentRef}>
            {/* Header */}
            <div className="mystery-screen-header">
                <div className="header-top-row" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>

                    {/* Left Icons */}
                    <div className="header-left-icons" style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                            className="continuous-audio-btn-header"
                            onClick={handleToggleContinuous}
                            aria-label={(continuousMode || isPlaying) ? t.stopContinuous : t.continuousMode}
                        >
                            {(continuousMode || isPlaying) ? <StopCircle size={20} strokeWidth={3} /> : <Volume2 size={20} strokeWidth={3} />}
                        </button>

                        <button
                            className="text-visibility-btn-header"
                            onClick={() => setUserWantsTextHidden(!userWantsTextHidden)}
                            style={{ marginLeft: '12px' }}
                        >
                            {userWantsTextHidden ? <BookClosedIcon size={20} /> : <BookOpenIcon size={20} />}
                        </button>
                    </div>

                    {/* Right Icons */}
                    <div className="header-right-icons" style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                            className="layout-mode-btn-header"
                            onClick={() => {
                                const newLayout = mysteryLayout === 'classic' ? 'cinematic' : 'classic';
                                setMysteryLayout(newLayout);
                                showToast(newLayout === 'cinematic' ? 'Cinematic mode enabled' : 'Classic mode enabled', 'success');
                            }}
                            style={{ marginRight: '12px' }}
                        >
                            <LayoutModeIcon size={20} />
                        </button>

                        <button className="settings-btn-header" onClick={() => setShowSettings(true)}>
                            <SettingsIcon size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div className="mystery-progress" style={{ width: '100%', textAlign: 'center' }}>
                    <div className="mystery-set-name">Sacred Prayers</div>
                </div>
            </div>

            <div className="progress-bar-container">
                <div
                    className="progress-bar-fill"
                    style={{ '--progress': `${flowEngine.getProgress()}%` } as React.CSSProperties}
                />
            </div>

            {/* Main Content */}
            <div className="mystery-screen-content">
                {/* Cinematic Mode */}
                {(mysteryLayout === 'cinematic' && imageUrl) ? (
                    <div className="immersive-mystery-container">
                        <div className="immersive-bg">
                            <ResponsiveImage imageUrl={imageUrl} className="immersive-backdrop-blur" alt="" />
                            <ResponsiveImage imageUrl={imageUrl} alt={currentStep.title} className="immersive-img mystery-img" loading="lazy" />
                            <div className="immersive-overlay-darker"></div>
                        </div>

                        <div className="immersive-content">
                            <main className="immersive-main flex flex-col h-full">
                                <div className="text-center space-y-8">
                                    <h1 className="font-display text-2xl font-bold immersive-mystery-title tracking-wide mb-8">
                                        {(currentStep.title || '').toUpperCase()}
                                    </h1>
                                    <div className="max-w-2xl mx-auto px-6">
                                        <p className="font-sans text-xl leading-loose text-gray-100 text-center drop-shadow-md">
                                            {renderTextWithHighlighting(currentStep.text)}
                                        </p>
                                    </div>
                                </div>
                            </main>
                        </div>
                    </div>
                ) : (
                    // Classic Mode (or no image)
                    <div className="prayer-section">
                        <div className="mystery-prayer-card">
                            <h2 className="mystery-title">{currentStep.title}</h2>
                            <div className="mystery-divider"></div>
                            <p className="mystery-text">{renderTextWithHighlighting(currentStep.text)}</p>
                        </div>

                        {/* Footer Image for Classic Mode */}
                        {imageUrl && (
                            <div className="mystery-intro" style={{ paddingTop: 'var(--spacing-sm)' }}>
                                <div className="mystery-content-card">
                                    <div className="mystery-image-container">
                                        <div className="mystery-image-wrapper">
                                            <ResponsiveImage imageUrl={imageUrl} alt={currentStep.title || ''} className="mystery-image-bg" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="bottom-section">
                <div className="mystery-bottom-nav">
                    <button className="mystery-nav-btn" onClick={handleBackWithReset}>
                        <span className="material-icons">home</span>
                        <span className="mystery-nav-label">{t.back}</span>
                    </button>

                    <div className="mystery-nav-center">
                        <button className="mystery-nav-btn" onClick={handlePrevious} disabled={flowEngine.isFirstStep()}>
                            <ChevronLeft size={24} strokeWidth={3} />
                            <span className="mystery-nav-label">{t.previous}</span>
                        </button>
                        <button className="mystery-nav-btn" onClick={handleNext}>
                            <ChevronRight size={24} strokeWidth={3} />
                            <span className="mystery-nav-label">{flowEngine.isLastStep() ? t.finish : t.next}</span>
                        </button>
                    </div>

                    <button className="mystery-nav-btn nav-btn-dimmed">
                        {/* Placeholder for symmetry (maybe settings or help later) */}
                    </button>
                </div>
            </div>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={handleReset}
            />
        </div>
    );
}
