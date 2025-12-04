import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, StopCircle, Settings as SettingsIcon, Lightbulb } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SettingsModal } from './SettingsModal';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import type { MysteryType } from '../utils/prayerFlowEngine';
import { savePrayerProgress, loadPrayerProgress, hasValidPrayerProgress, clearPrayerProgress } from '../utils/storage';
import { wakeLockManager } from '../utils/wakeLock';

import './MysteryScreen.css';
import './MysteryBottomNav.css';
import educationalDataEs from '../data/es-rosary-educational-content.json';
import educationalDataEn from '../data/en-rosary-educational-content.json';
import { LearnMoreModal, type EducationalContent } from './LearnMoreModal';

interface MysteryScreenProps {
    onComplete: () => void;
    onBack: () => void;
    startWithContinuous?: boolean;
}

interface MysteryImageProps {
    src?: string;
    alt?: string;
    number?: number;
}

const MysteryImage = ({ src, alt, number }: MysteryImageProps) => {
    const [error, setError] = useState(false);

    // Reset error state if src changes
    useEffect(() => {
        setError(false);
    }, [src]);

    if (src && !error) {
        return (
            <div
                className="mystery-image-bg"
                style={{ backgroundImage: `url('${src}')` }}
                role="img"
                aria-label={alt}
            >
                <img
                    src={src}
                    style={{ display: 'none' }}
                    onError={() => setError(true)}
                    alt=""
                />
            </div>
        );
    }

    return (
        <div className="mystery-image-placeholder">
            <span className="mystery-number">{number}</span>
        </div>
    );
};

export function MysteryScreen({ onComplete, onBack, startWithContinuous = false }: MysteryScreenProps) {
    const {
        language,
        currentMysterySet,
        isPlaying,
        playAudio,
        stopAudio,
        mysteryLayout
    } = useApp();
    const [showSettings, setShowSettings] = useState(false);
    const [showLearnMore, setShowLearnMore] = useState(false);

    const [flowEngine] = useState(() => {
        const engine = new PrayerFlowEngine(currentMysterySet as MysteryType, language);

        const savedProgress = loadPrayerProgress(currentMysterySet);
        if (savedProgress) {
            console.log('Restoring progress to step:', savedProgress.currentStepIndex);
            engine.jumpToStep(savedProgress.currentStepIndex);
        }

        return engine;
    });

    const [currentStep, setCurrentStep] = useState(flowEngine.getCurrentStep());
    const [continuousMode, setContinuousMode] = useState(startWithContinuous);
    const continuousModeRef = useRef(startWithContinuous);
    const playbackIdRef = useRef(0);
    const contentRef = useRef<HTMLDivElement>(null);

    // Get current educational data
    const currentData = language === 'es' ? educationalDataEs : educationalDataEn;

    // Helper to get current educational content
    const getCurrentEducationalContent = (): EducationalContent | null => {
        const decadeInfo = flowEngine.getCurrentDecadeInfo();

        const mysteryNameMap: Record<string, Record<string, string>> = {
            'es': {
                'joyful': 'Misterios Gozosos',
                'luminous': 'Misterios Luminosos',
                'sorrowful': 'Misterios Dolorosos',
                'glorious': 'Misterios Gloriosos'
            },
            'en': {
                'joyful': 'Joyful Mysteries',
                'luminous': 'Luminous Mysteries',
                'sorrowful': 'Sorrowful Mysteries',
                'glorious': 'Glorious Mysteries'
            }
        };

        if (decadeInfo) {
            const targetName = mysteryNameMap[language]?.[currentMysterySet];
            if (!targetName) return null;

            // Find matching data in JSON
            // Note: The JSON uses 1-based indexing for mystery_number
            const data = currentData.mysteries.find((item: any) =>
                item.mystery_name === targetName &&
                item.mystery_number === decadeInfo.number
            );
            return (data as EducationalContent) || null;
        }

        // If not in a decade (start or end), show global intro
        return currentData.global_intro as EducationalContent;
    };

    const currentEducationalData = getCurrentEducationalContent();
    const hasEducationalContent = !!currentEducationalData;

    // Update engine language when app language changes
    useEffect(() => {
        flowEngine.setLanguage(language);
        setCurrentStep(flowEngine.getCurrentStep());
    }, [language, flowEngine]);

    // Save progress whenever step changes
    useEffect(() => {
        const progress = {
            mysteryType: currentMysterySet,
            currentStepIndex: flowEngine.getCurrentStepNumber(),
            date: new Date().toISOString().split('T')[0],
            language
        };
        savePrayerProgress(progress);
    }, [currentStep, currentMysterySet, language, flowEngine]);

    // Handle visibility change to stop audio if app goes background
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && continuousMode) {
                console.log('[Continuous Mode] Page hidden - stopping to prevent callback issues');
                setContinuousMode(false);
                continuousModeRef.current = false;
                playbackIdRef.current++; // Invalidate pending callbacks
                stopAudio();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [continuousMode, stopAudio]);

    // Handle continuous mode wake lock
    useEffect(() => {
        if (continuousMode) {
            wakeLockManager.request();
        } else {
            wakeLockManager.release();
        }
        return () => {
            wakeLockManager.release();
        };
    }, [continuousMode]);

    // Start continuous mode on mount if requested
    useEffect(() => {
        if (startWithContinuous) {
            handleToggleContinuous();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Scroll to top when step changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [currentStep]);

    const getAudioSegments = (step: any): { text: string; gender: 'female' | 'male' }[] => {
        // Helper to create segments
        const createSegments = (call: string, response: string) => [
            { text: call, gender: 'female' as const },
            { text: response, gender: 'male' as const }
        ];

        if (step.type === 'decade_announcement') {
            const decadeInfo = flowEngine.getCurrentDecadeInfo();
            const reflectionLabel = language === 'es' ? 'Reflexión' : 'Reflection';
            let text = `${step.title}. ${reflectionLabel}. ${step.text}`;

            if (decadeInfo) {
                const ordinal = getSpelledOrdinal(decadeInfo.number);
                const mysteryWord = language === 'es' ? 'Misterio' : 'Mystery';
                text = `${ordinal} ${mysteryWord}. ${step.title}. ${reflectionLabel}. ${step.text}`;
            }
            return [{ text, gender: 'female' }];
        }

        const text = step.text;

        // Sign of the Cross
        if (step.title === 'The Sign of the Cross' || step.title === 'La Señal de la Cruz') {
            return [{ text, gender: 'female' }];
        }

        // Apostles Creed
        if (step.title === "Apostles' Creed" || step.title === 'Credo de los Apóstoles') {
            return [{ text, gender: 'female' }];
        }

        // Our Father
        if (step.title === 'Our Father' || step.title === 'Padre Nuestro') {
            const splitPhrase = language === 'es' ? 'Danos hoy' : 'Give us this day';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }

        // Hail Mary
        if (step.title === 'Hail Mary' || step.title === 'Ave María') {
            const splitPhrase = language === 'es' ? 'Santa María' : 'Holy Mary';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }

        // Glory Be
        if (step.title === 'Glory Be' || step.title === 'Gloria') {
            const splitPhrase = language === 'es' ? 'Como era' : 'As it was';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }

        // Fatima Prayer
        if (step.title === 'Fatima Prayer' || step.title === 'Oh Jesús Mío') {
            return [{ text, gender: 'female' }]; // Usually recited together or by leader
        }

        // Hail Holy Queen
        if (step.title.includes('Hail Holy Queen') || step.title.includes('La Salve')) {
            const splitPhrase = language === 'es' ? 'Ea, pues' : 'Turn then';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }

        // Default: All Female
        return [{ text: step.text, gender: 'female' }];
    };

    const getSpelledOrdinal = (num: number) => {
        const ordinals = language === 'es'
            ? ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto']
            : ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
        return ordinals[num - 1] || `${num}th`;
    };

    // Recursive function to play audio sequence
    const playSequence = (step: any) => {
        if (!continuousModeRef.current) return;

        // Capture current playback session ID
        const currentPlaybackId = playbackIdRef.current;

        playAudio(getAudioSegments(step), () => {
            // LAYER 2: Validate this callback is not stale
            if (playbackIdRef.current !== currentPlaybackId) {
                console.log('[Continuous Mode] Stale callback detected (playback session changed) - ignoring');
                return; // Don't advance - this callback is from an old session
            }

            // Double check mode hasn't been turned off
            if (!continuousModeRef.current) {
                console.log('[Continuous Mode] Mode turned off during playback - stopping');
                return;
            }

            const nextStep = flowEngine.getNextStep();
            if (nextStep) {
                setCurrentStep(nextStep);
                if (nextStep.type === 'complete') {
                    setContinuousMode(false);
                    const progress = {
                        mysteryType: currentMysterySet,
                        currentStepIndex: flowEngine.getCurrentStepNumber() - 1,
                        date: new Date().toISOString().split('T')[0],
                        language
                    };
                    savePrayerProgress(progress);
                    onComplete();
                } else {
                    // Continue to next step after delay
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
        if (continuousMode || isPlaying) {
            // Stop continuous mode
            setContinuousMode(false);
            continuousModeRef.current = false;

            // LAYER 2: Invalidate all pending callbacks
            playbackIdRef.current++;
            console.log('[Continuous Mode] Stopped - invalidating callbacks (session:', playbackIdRef.current, ')');

            stopAudio();

            // LAYER 1: Release wake lock
            wakeLockManager.release();
        } else {
            // Start continuous mode
            setContinuousMode(true);
            // We need to set the ref immediately for the first call
            continuousModeRef.current = true;

            // LAYER 1: Request wake lock to keep screen on (non-blocking)
            wakeLockManager.request().then(wakeLockAcquired => {
                if (wakeLockAcquired) {
                    console.log('🔒 Screen will stay on during continuous mode');
                } else {
                    console.log('⚠️ Wake Lock not available - screen may turn off');
                }
            });

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
                const progress = {
                    mysteryType: currentMysterySet,
                    currentStepIndex: flowEngine.getCurrentStepNumber() - 1,
                    date: new Date().toISOString().split('T')[0],
                    language
                };
                savePrayerProgress(progress);
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

    const t = {
        back: language === 'es' ? 'Volver' : 'Back',
        of: language === 'es' ? 'de' : 'of',
        complete: language === 'es' ? 'completado' : 'complete',
        previous: language === 'es' ? 'Anterior' : 'Previous',
        next: language === 'es' ? 'Siguiente' : 'Next',
        finish: language === 'es' ? 'Terminar' : 'Finish',
        stopAudio: language === 'es' ? 'Detener audio' : 'Stop audio',
        playAudio: language === 'es' ? 'Reproducir audio' : 'Play audio',
        continuousMode: language === 'es' ? 'Modo Continuo' : 'Continuous Mode',
        stopContinuous: language === 'es' ? 'Detener' : 'Stop',
        reflection: language === 'es' ? 'Reflexión' : 'Reflection',
        mystery: language === 'es' ? 'Misterio' : 'Mystery',
        mysteryOrdinal: '',
        textSize: language === 'es' ? 'Tamaño de Texto' : 'Text Size',
        settings: language === 'es' ? 'Configuración' : 'Settings',
        learnMore: language === 'es' ? 'Aprender Más' : 'Learn More'
    };

    const isIntroPrayer = ['The Sign of the Cross', 'Apostles\' Creed', 'La Señal de la Cruz', 'Credo de los Apóstoles'].includes(currentStep.title || '');

    const renderStepContent = () => {
        const step = currentStep;

        // Special rendering for decade announcement
        if (step.type === 'decade_announcement') {
            const decadeInfo = flowEngine.getCurrentDecadeInfo();

            if (mysteryLayout === 'cinematic') {

                return (
                    <div className="immersive-mystery-container">
                        <div className="immersive-bg">
                            <img
                                src={decadeInfo?.imageUrl || step.imageUrl}
                                alt={step.title}
                                className="immersive-img"
                            />
                            <div className="immersive-overlay" />
                        </div>

                        <div className="immersive-content">
                            <div className="immersive-header">
                                <span className="immersive-number">{getSpelledOrdinal(decadeInfo?.number || 1)} {t.mystery}</span>
                                <h2 className="immersive-title">{step.title}</h2>
                            </div>

                            {decadeInfo && (
                                <div className="immersive-body">
                                    {decadeInfo.fruit && (
                                        <div className="immersive-fruit">
                                            <span className="fruit-label">{language === 'es' ? 'Fruto:' : 'Fruit:'}</span>
                                            <span className="fruit-value">{decadeInfo.fruit}</span>
                                        </div>
                                    )}

                                    <div className="immersive-reflection">
                                        <p>{step.text}</p>
                                    </div>

                                    {decadeInfo.scripture && (
                                        <div className="scripture-container">
                                            <p className="scripture-text">"{decadeInfo.scripture.text}"</p>
                                            <p className="scripture-ref">{decadeInfo.scripture.reference}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            // Classic Layout
            return (
                <div className="prayer-content">
                    <p className="prayer-text-main">{step.text}</p>
                    {decadeInfo?.scripture && (
                        <div className="scripture-container">
                            <p className="scripture-text">"{decadeInfo.scripture.text}"</p>
                            <p className="scripture-ref">{decadeInfo.scripture.reference}</p>
                        </div>
                    )}
                </div>
            );
        }

        const isIntroPrayer = ['The Sign of the Cross', 'Apostles\' Creed', 'La Señal de la Cruz', 'Credo de los Apóstoles'].includes(step.title);

        // Special rendering for Litany of Loreto
        if ((step.type as any) === 'litany_of_loreto' && step.litanyData) {
            const data = step.litanyData;

            // Helper to render a row with alternating background (full call and response)
            const renderRow = (call: string, response: string, index: number, globalIndex: number) => (
                <div key={`${index}-${globalIndex}`} className={`litany-row-new ${globalIndex % 2 === 0 ? 'litany-row-highlight' : ''}`}>
                    <div className="litany-call-new">{call}</div>
                    <div className="litany-response-new">{response}</div>
                </div>
            );

            // Helper to render call-only row (for Mary invocations after the first)
            const renderCallOnly = (call: string, index: number, globalIndex: number) => (
                <div key={`${index}-${globalIndex}`} className={`litany-row-new ${globalIndex % 2 === 0 ? 'litany-row-highlight' : ''}`}>
                    <div className="litany-call-new">{call}</div>
                </div>
            );

            let globalCount = 0;

            return (
                <div className="prayer-section litany-container-new">
                    <h2 className="litany-title-new">{(step.title || '').toUpperCase()}</h2>

                    <div className="litany-list-new">
                        {data.initial_petitions.map((item: any, i: number) => renderRow(item.call, item.response, i, globalCount++))}

                        {data.trinity_invocations.map((item: any, i: number) => renderRow(item.call, item.response, i, globalCount++))}

                        {/* Instruction reminder before Mary invocations */}
                        <div className="litany-reminder">
                            {language === 'es' ? (
                                <>
                                    (Repetir respuesta de oración: <span className="litany-reminder-highlight">Ruega por nosotros</span>)
                                </>
                            ) : (
                                <>
                                    (Repeat prayer response: <span className="litany-reminder-highlight">Pray for us</span>)
                                </>
                            )}
                        </div>

                        {/* Mary Invocations - Show first one fully, then only calls */}
                        {data.mary_invocations.map((item: any, i: number) => {
                            const response = item.response || (language === 'es' ? 'Ruega por nosotros' : 'Pray for us');
                            // Show first invocation with full response, rest with call only
                            if (i === 0) {
                                return renderRow(item.call, response, i, globalCount++);
                            } else {
                                return renderCallOnly(item.call, i, globalCount++);
                            }
                        })}

                        {data.agnus_dei.map((item: any, i: number) => renderRow(item.call, item.response, i, globalCount++))}
                    </div>
                </div>
            );
        }

        if (isIntroPrayer) {
            return (
                <div className="intro-prayer-card">
                    <h2 className="intro-title">{step.title || ''}</h2>
                    <div className="intro-divider"></div>
                    <p className="intro-text">{step.text}</p>
                </div>
            );
        }

        // Default rendering for all other prayers
        return (
            <div className="prayer-content">
                <p className="prayer-text-main">{step.text}</p>
            </div>
        );
    };

    const renderBeadCounter = () => {
        // Hide in cinematic mode (rendered inside layout)
        if (mysteryLayout === 'cinematic') return null;

        const step = currentStep;

        // Show bead counter only for Hail Marys within decades
        if (step.type === 'decade_hail_mary' && step.hailMaryNumber) {
            return (
                <div className="bead-counter">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bead) => (
                        <div
                            key={bead}
                            className={`bead ${bead <= step.hailMaryNumber! ? 'bead-active' : ''}`}
                        />
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderMysteryImageFooter = () => {
        // Don't show if in cinematic mode
        if (mysteryLayout === 'cinematic') return null;

        // Don't show on decade announcement as it already has it
        if (currentStep.type === 'decade_announcement') return null;

        const decadeInfo = flowEngine.getCurrentDecadeInfo();
        if (decadeInfo && decadeInfo.imageUrl) {
            return (
                <div className="mystery-intro" style={{ paddingTop: 'var(--spacing-sm)' }}>
                    <div className="mystery-content-card">
                        {decadeInfo.fruit && (
                            <div className="fruit-container" style={{ marginBottom: 'var(--spacing-sm)', textAlign: 'center', padding: '0 var(--spacing-md)' }}>
                                <span className="fruit-label">{language === 'es' ? 'Fruto:' : 'Fruit:'}</span>
                                <span className="fruit-text">{decadeInfo.fruit}</span>
                            </div>
                        )}
                        <div className="mystery-image-container">
                            <MysteryImage
                                src={decadeInfo.imageUrl}
                                alt={decadeInfo.title}
                                number={decadeInfo.number}
                            />
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Handle resetting progress for current mystery
    const handleResetProgress = () => {
        console.log('[MysteryScreen] Resetting progress for', currentMysterySet);

        // 1. Clear storage for this mystery
        clearPrayerProgress(currentMysterySet);

        // 2. Reset flow engine to step 0
        flowEngine.jumpToStep(0);

        // 3. Update local state to reflect step 0
        const initialStep = flowEngine.getCurrentStep();
        setCurrentStep(initialStep);

        // 4. Close settings
        setShowSettings(false);

        // 5. Ensure continuous mode is off
        setContinuousMode(false);
        stopAudio();
    };

    return (
        <div className="mystery-screen-container">
            <div className="mystery-screen-header">
                <button
                    className="continuous-audio-btn-header"
                    onClick={handleToggleContinuous}
                    aria-label={(continuousMode || isPlaying) ? t.stopContinuous : t.continuousMode}
                >
                    {(continuousMode || isPlaying) ? (
                        <StopCircle size={20} />
                    ) : (
                        <Volume2 size={20} />
                    )}
                </button>

                <div className="mystery-progress">
                    {/* First row: mystery set name (large) */}
                    <div className="mystery-set-name">{flowEngine.getMysteryName()}</div>
                    {/* Second row: current decade subheader, same size as mystery name */}
                    {(() => {
                        // If it's the decade announcement, show the full title here
                        if (currentStep.type === 'decade_announcement') {
                            return (
                                <div className="mystery-set-name current-decade-info">
                                    {currentStep.title}
                                </div>
                            );
                        }

                        // Otherwise show the summary info
                        const decadeInfo = flowEngine.getCurrentDecadeInfo();
                        if (decadeInfo) {
                            const getSpelledOrdinal = (num: number) => {
                                const ordinals = language === 'es'
                                    ? ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto']
                                    : ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
                                return ordinals[num - 1] || `${num}th`;
                            };
                            const mysteryWord = language === 'es' ? 'Misterio' : 'Mystery';
                            return (
                                <div className="mystery-set-name current-decade-info">
                                    {getSpelledOrdinal(decadeInfo.number)} {mysteryWord}: {decadeInfo.title}
                                </div>
                            );
                        }
                        return null;
                    })()}
                    {/* Third row: progress info, smaller */}
                    <div className="progress-info progress-info-small">
                        {Math.round(flowEngine.getProgress())}% {t.complete}
                    </div>
                </div>

                <button
                    className="settings-btn-header"
                    onClick={() => setShowSettings(true)}
                    aria-label={t.settings}
                >
                    <SettingsIcon size={20} />
                </button>
            </div>

            <div className="progress-bar-container">
                <div
                    className="progress-bar-fill"
                    style={{ '--progress': `${flowEngine.getProgress()}%` } as React.CSSProperties}
                />
            </div>

            <div className="mystery-screen-content" ref={contentRef}>
                <div className="prayer-section">
                    <div className="prayer-header">
                        {currentStep.type !== 'decade_announcement' && !isIntroPrayer && currentStep.type !== 'litany_of_loreto' && !(mysteryLayout === 'cinematic' && ['decade_our_father', 'decade_hail_mary', 'decade_glory_be', 'decade_jaculatory', 'fatima_prayer', 'final_jaculatory_start', 'final_hail_mary_intro', 'hail_holy_queen', 'closing_under_your_protection', 'final_collect', 'sign_of_cross_end'].includes(currentStep.type)) && (
                            <h3 className="prayer-name">{currentStep.title}</h3>
                        )}
                        <div className="audio-controls">
                            {/* Duplicate audio button removed */}
                        </div>
                    </div>

                    {renderStepContent()}
                    {renderBeadCounter()}
                    {renderMysteryImageFooter()}
                </div>
            </div>

            {/* Fixed Bottom Navigation Bar */}
            <div className="bottom-section">
                <div className="mystery-bottom-nav">
                    <button
                        className="mystery-nav-btn"
                        onClick={onBack}
                        aria-label={t.back}
                        title={t.back}
                    >
                        <span className="material-icons">home</span>
                        <span className="mystery-nav-label">{t.back}</span>
                    </button>

                    <div className="mystery-nav-center">
                        <button
                            className="mystery-nav-btn"
                            onClick={handlePrevious}
                            disabled={flowEngine.isFirstStep()}
                            aria-label={t.previous}
                            title={t.previous}
                        >
                            <ChevronLeft size={24} strokeWidth={5} />
                            <span className="mystery-nav-label">{t.previous}</span>
                        </button>

                        <button
                            className="mystery-nav-btn"
                            onClick={handleNext}
                            disabled={flowEngine.isLastStep()}
                            aria-label={flowEngine.isLastStep() ? t.finish : t.next}
                            title={flowEngine.isLastStep() ? t.finish : t.next}
                        >
                            <ChevronRight size={24} strokeWidth={5} />
                            <span className="mystery-nav-label">{flowEngine.isLastStep() ? t.finish : t.next}</span>
                        </button>
                    </div>

                    <button
                        className={`mystery-nav-btn ${!hasEducationalContent ? 'nav-btn-dimmed' : ''}`}
                        onClick={() => hasEducationalContent && setShowLearnMore(true)}
                        disabled={!hasEducationalContent}
                        aria-label={t.learnMore}
                        title={t.learnMore}
                    >
                        <Lightbulb size={24} strokeWidth={hasEducationalContent ? 2 : 1.5} />
                        <span className="mystery-nav-label">{t.learnMore}</span>
                    </button>
                </div>
            </div>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={handleResetProgress}
                currentMysteryName={flowEngine.getMysteryName()}
            />

            {/* Learn More Modal */}
            <LearnMoreModal
                isOpen={showLearnMore}
                onClose={() => setShowLearnMore(false)}
                data={currentEducationalData}
                language={language}
            />
        </div>
    );
}
