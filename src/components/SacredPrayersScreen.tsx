import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, StopCircle, Settings as SettingsIcon, CalendarCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { SettingsModal } from './SettingsModal';
import { SacredProgressModal } from './SacredProgressModal';
import { SacredPrayerFlowEngine } from '../utils/SacredPrayerFlowEngine';
import { savePrayerProgress, loadPrayerProgress, hasValidPrayerProgress, clearPrayerProgress, clearSession } from '../utils/storage';
import { wakeLockManager } from '../utils/wakeLock';

import { sanitizeTextForSpeech } from '../utils/textSanitizer';
import { ClassicMysteryView } from './ClassicMysteryView';
import { CinematicMysteryView } from './CinematicMysteryView';


// Reuse MysteryScreen styles to ensure exact match
import './MysteryScreen.css';
import './MysteryBottomNav.css';
import './SacredPrayersScreen.css';

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
        <path className="book-closed-icon-cover" d="M 22,10 77,2 77,27 22,28 z" />
        <path className="book-closed-icon-pages" d="m 34,20 58,-7 0,76 -58,7 z" />
        <path className="book-closed-icon-spine" d="M 34,20 34,96 21,98 7,89 7,12 22,10 7,12 21,22 z" />
        <path className="book-closed-icon-highlight" d="M 10,13 77,3 c 0,0 -2,5 2,7 4,2 9,2 9,2 l -67,9 z" />
        <path className="book-closed-icon-binding" d="m 21,23 0,74" />
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

const HighlighterIcon = ({ size = 20, className = '', enabled = false }: { size?: number; className?: string; enabled?: boolean }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="currentColor"
        className={`${className} ${enabled ? "" : "opacity-50"}`}
    >
        <path d="M15.82,26.06a1,1,0,0,1-.71-.29L8.67,19.33a1,1,0,0,1-.29-.71,1,1,0,0,1,.29-.71L23,3.54a5.55,5.55,0,1,1,7.85,7.86L16.53,25.77A1,1,0,0,1,15.82,26.06Zm-5-7.44,5,5L29.48,10a3.54,3.54,0,0,0,0-5,3.63,3.63,0,0,0-5,0Z" />
        <path d="M10.38,28.28A1,1,0,0,1,9.67,28L6.45,24.77a1,1,0,0,1-.22-1.09l2.22-5.44a1,1,0,0,1,1.63-.33l6.45,6.44A1,1,0,0,1,16.2,26l-5.44,2.22A1.33,1.33,0,0,1,10.38,28.28ZM8.33,23.82l2.29,2.28,3.43-1.4L9.74,20.39Z" />
        <path d="M8.94,30h-5a1,1,0,0,1-.84-1.55l3.22-4.94a1,1,0,0,1,1.55-.16l3.21,3.22a1,1,0,0,1,.06,1.35L9.7,29.64A1,1,0,0,1,8.94,30ZM5.78,28H8.47L9,27.34l-1.7-1.7Z" />
        <rect x="3.06" y="31" width="30" height="3" />
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
    const [showProgress, setShowProgress] = useState(false);

    // User-controlled text visibility preference
    const [userWantsTextHidden, setUserWantsTextHidden] = useState(false);
    const [showPrayerText, setShowPrayerText] = useState(true);

    // Highlighting state
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [highlightingEnabled, setHighlightingEnabled] = useState(false);
    const [userDisabledHighlighting, setUserDisabledHighlighting] = useState(() => {
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

    // Update highlighting enabled state based on playing status and user preference
    useEffect(() => {
        if (isPlaying && !userDisabledHighlighting) {
            setHighlightingEnabled(true);
        } else {
            setHighlightingEnabled(false);
        }
    }, [isPlaying, userDisabledHighlighting]);

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
                // Clear saved progress so it starts fresh next time
                clearPrayerProgress(sacredMysteryKey);
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
        // If on first page, go back to Prayer Selection
        if (flowEngine.isFirstStep()) {
            onBack();
        } else {
            // If on sub-prayer, go back to first page (Sacred Prayers menu)
            setContinuousMode(false);
            continuousModeRef.current = false;
            stopAudio();
            flowEngine.jumpToStep(0);
            setCurrentStep(flowEngine.getCurrentStep());
        }
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

    const getSentences = (text: string) => {
        if (!text) return [];
        return text.match(/[^.!?:]+([.!?:]+|\s*$)/g) || [text];
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
        settings: 'Configuración',
        progress: 'Progreso'
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
        settings: 'Settings',
        progress: 'Progress'
    };

    if (!currentStep) {
        return <div className="p-8 text-center text-white">Loading...</div>;
    }


    return (
        <div className={`mystery-screen-container ${!showPrayerText ? 'prayer-text-hidden' : ''}`} ref={contentRef}>
            {/* Header */}
            {/* Header */}
            <div className="mystery-screen-header">
                <div className="mystery-header-row">


                    {/* Left Icons */}
                    <div className="mystery-header-icons-left">

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
                            aria-label={userWantsTextHidden ? "Show Text" : "Hide Text"}
                        >
                            {userWantsTextHidden ? <BookClosedIcon size={20} /> : <BookOpenIcon size={20} />}
                        </button>

                        <button
                            className={`highlighter-btn-header ${isPlaying && !userWantsTextHidden ? 'active' : ''} ${!highlightingEnabled && isPlaying && !userWantsTextHidden ? 'disabled-highlight' : ''} ${highlightingEnabled && !userWantsTextHidden ? 'pulsate-book-icon' : ''}`}
                            onClick={(e) => {
                                e.currentTarget.blur();
                                if (!isPlaying) return;
                                const newState = !highlightingEnabled;
                                setHighlightingEnabled(newState);
                                setUserDisabledHighlighting(!newState);
                                localStorage.setItem('rosary_highlight_preference', JSON.stringify(!newState));
                                showToast(
                                    newState
                                        ? (language === 'es' ? 'Resaltado activado' : 'Highlighting enabled')
                                        : (language === 'es' ? 'Resaltado desactivado' : 'Highlighting disabled'),
                                    'success'
                                );
                            }}
                            aria-label={highlightingEnabled ? "Disable Highlighting" : "Enable Highlighting"}
                            disabled={!isPlaying || userWantsTextHidden}
                        >
                            <HighlighterIcon size={20} enabled={highlightingEnabled} />
                        </button>
                    </div>

                    {/* Right Icons */}
                    <div className="mystery-header-icons-right">
                        <button
                            className="layout-mode-btn-header"
                            onClick={() => {
                                const newLayout = mysteryLayout === 'classic' ? 'cinematic' : 'classic';
                                setMysteryLayout(newLayout);
                                showToast(newLayout === 'cinematic' ? 'Cinematic mode enabled' : 'Classic mode enabled', 'success');
                            }}
                            aria-label="Toggle Layout Mode"
                        >
                            <LayoutModeIcon size={20} />
                        </button>

                        <button
                            className="settings-btn-header"
                            onClick={() => setShowSettings(true)}
                            aria-label={t.settings}
                        >
                            <SettingsIcon size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div className="mystery-progress mystery-progress-centered">
                    <div className="mystery-set-name">Sacred Prayers</div>
                </div>
            </div>

            <div className="progress-bar-container">
                <div
                    className="progress-bar-fill"
                    ref={(el) => {
                        if (el) {
                            el.style.setProperty('--progress', `${flowEngine.getProgress()}%`);
                        }
                    }}
                />
            </div>

            {/* Main Content - Use shared view components */}
            <div className="mystery-screen-content">
                {mysteryLayout === 'cinematic' ? (
                    <CinematicMysteryView
                        currentStep={currentStep}
                        decadeInfo={null}
                        showPrayerText={showPrayerText}
                        language={language}
                        renderTextWithHighlighting={renderTextWithHighlighting}
                        getSentences={getSentences}
                        spokenIndex={highlightIndex}
                        revealedRows={[]}
                    />
                ) : (
                    <ClassicMysteryView
                        currentStep={currentStep}
                        decadeInfo={null}
                        userWantsTextHidden={userWantsTextHidden}
                        language={language}
                        renderTextWithHighlighting={renderTextWithHighlighting}
                        getSentences={getSentences}
                        spokenIndex={highlightIndex}
                        revealedRows={[]}
                    />
                )}
            </div>

            {/* Footer Navigation */}
            <div className="bottom-section">
                <div className="mystery-bottom-nav">
                    <button
                        className="mystery-nav-btn"
                        onClick={handleBackWithReset}
                    >
                        {flowEngine.isFirstStep() ? (
                            <ChevronLeft size={24} strokeWidth={3} />
                        ) : (
                            <span className="material-icons">home</span>
                        )}
                        <span className="mystery-nav-label">
                            {flowEngine.isFirstStep() ? (language === 'es' ? 'Volver' : 'Back') : t.back}
                        </span>
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

                    {/* Progress button - show on all pages except completion */}
                    {currentStep?.type !== 'complete' && (
                        <button
                            className="mystery-nav-btn"
                            onClick={() => setShowProgress(true)}
                            aria-label={t.progress}
                        >
                            <CalendarCheck size={24} strokeWidth={2} />
                            <span className="mystery-nav-label">{t.progress}</span>
                        </button>
                    )}
                </div>
            </div>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={handleReset}
            />

            {showProgress && (
                <SacredProgressModal onClose={() => setShowProgress(false)} />
            )}
        </div>
    );
}
