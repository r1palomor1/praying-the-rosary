import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, Square } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import type { MysteryType } from '../utils/prayerFlowEngine';
import { savePrayerProgress, loadPrayerProgress, hasValidPrayerProgress } from '../utils/storage';
import { wakeLockManager } from '../utils/wakeLock';

import './MysteryScreen.css';
import './MysteryBottomNav.css';

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
        audioEnabled
    } = useApp();

    const [flowEngine] = useState(() => {
        const engine = new PrayerFlowEngine(currentMysterySet as MysteryType, language);

        // Load saved progress for this specific mystery type
        const savedProgress = loadPrayerProgress(currentMysterySet);
        if (savedProgress && hasValidPrayerProgress(currentMysterySet) && savedProgress.mysteryType === currentMysterySet) {
            // Check if the saved progress is at the complete step (last step)
            // If so, we should immediately show the completion screen
            if (savedProgress.currentStepIndex >= engine.getTotalSteps() - 1) {
                // Trigger completion immediately
                setTimeout(() => {
                    onComplete();
                }, 0);
            } else {
                engine.jumpToStep(savedProgress.currentStepIndex);
            }
        }

        return engine;
    });

    const [currentStep, setCurrentStep] = useState(flowEngine.getCurrentStep());
    const [continuousMode, setContinuousMode] = useState(false);
    const audioEndedRef = useRef(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Sync continuous mode with playing state on mount
    // This handles the case where user navigates away and back while audio is playing
    useEffect(() => {
        if (isPlaying && !continuousMode) {
            setContinuousMode(true);
            audioEndedRef.current = true;
        }
    }, []);

    // Cleanup: Release wake lock when component unmounts
    useEffect(() => {
        return () => {
            wakeLockManager.release();
        };
    }, []);

    // LAYER 4: Stop continuous mode when page becomes hidden (screen off, background)
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
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [continuousMode, stopAudio]);

    // Update language when it changes
    useEffect(() => {
        flowEngine.setLanguage(language);
        setCurrentStep(flowEngine.getCurrentStep());
    }, [language, flowEngine]);

    // Scroll to top when step changes
    useEffect(() => {
        // Small timeout to ensure DOM has updated before scrolling
        const timer = setTimeout(() => {
            if (contentRef.current) {
                contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [currentStep]);

    // Save progress whenever step changes
    useEffect(() => {
        const progress = {
            mysteryType: currentMysterySet,
            currentStepIndex: flowEngine.getCurrentStepNumber() - 1,
            date: new Date().toISOString().split('T')[0],
            language
        };
        savePrayerProgress(progress);
    }, [currentStep, currentMysterySet, language, flowEngine]);

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
        mystery: 'Misterio',
        mysteryOrdinal: 'º',
        textSize: 'Tamaño de texto'
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
        mystery: 'Mystery',
        mysteryOrdinal: '',
        textSize: 'Text Size'
    };

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
                if (decadeInfo.fruit) {
                    const fruitLabel = language === 'es' ? 'Fruto del misterio: ' : 'Fruit of the mystery: ';
                    text += `. ${fruitLabel}${decadeInfo.fruit}`;
                }
                if (decadeInfo.scripture) {
                    const scriptureLabel = language === 'es' ? 'Lectura: ' : 'Scripture: ';
                    text += `. ${scriptureLabel}${decadeInfo.scripture.text}`;
                }
            }
            // Announcement is all female (Call)
            return [{ text, gender: 'female' }];
        }

        // Litany of Loreto
        if (step.type === 'litany_of_loreto' && step.litanyData) {
            const data = step.litanyData;
            const segments: { text: string; gender: 'female' | 'male'; rate?: number }[] = [];

            // Add all sections with call and response
            [...data.initial_petitions, ...data.trinity_invocations, ...data.mary_invocations, ...data.agnus_dei].forEach((item: any) => {
                segments.push({ text: item.call, gender: 'female', rate: 1.0 });
                segments.push({ text: item.response, gender: 'male', rate: 1.0 });
            });

            return segments;
        }

        // Final Hail Marys (Intro + Prayer)
        if (step.type === 'final_hail_mary_intro') {
            const parts = step.text.split('\n\n');
            if (parts.length > 1) {
                return createSegments(parts[0], parts[1]);
            }
            // If only one part (e.g. the 4th one), it's all female
            return [{ text: step.text, gender: 'female' }];
        }

        // Standard Prayers - Split logic
        const text = step.text;

        // Our Father
        if (step.title.includes('Our Father') || step.title.includes('Padre Nuestro')) {
            const splitPhrase = language === 'es' ? 'Danos hoy' : 'Give us this day';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }

        // Hail Mary
        if (step.title.includes('Hail Mary') || step.title.includes('Ave María')) {
            const splitPhrase = language === 'es' ? 'Santa María' : 'Holy Mary';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }

        // Glory Be
        if (step.title.includes('Glory Be') || step.title.includes('Gloria')) {
            const splitPhrase = language === 'es' ? 'Como era' : 'As it was';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }

        // O My Jesus
        if (step.title.includes('O My Jesus') || step.title.includes('Oh Jesús Mío')) {
            const splitPhrase = language === 'es' ? 'lleva al cielo' : 'and lead all souls';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
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

    // Ref to track continuous mode state inside callbacks
    const continuousModeRef = useRef(continuousMode);

    // Keep ref in sync with state and handle cleanup
    useEffect(() => {
        continuousModeRef.current = continuousMode;
        return () => {
            continuousModeRef.current = false;
        };
    }, [continuousMode]);

    // Track playback session to invalidate stale callbacks
    const playbackIdRef = useRef(0);

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

            // LAYER 3: Check if continuous mode is still active
            if (!continuousModeRef.current) {
                console.log('[Continuous Mode] Stopped during playback - staying on current prayer:', currentStep.title);
                return; // Don't advance - user will resume from current prayer
            }

            // All validations passed - safe to advance
            const nextStep = flowEngine.getNextStep();
            if (nextStep) {
                setCurrentStep(nextStep);

                if (nextStep.type === 'complete') {
                    setContinuousMode(false);

                    // Save completion
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

    const handleToggleContinuous = async () => {
        if (continuousMode || isPlaying) {
            // Stop continuous mode
            setContinuousMode(false);
            continuousModeRef.current = false;

            // LAYER 2: Invalidate all pending callbacks
            playbackIdRef.current++;
            console.log('[Continuous Mode] Stopped - invalidating callbacks (session:', playbackIdRef.current, ')');

            stopAudio();

            // LAYER 1: Release wake lock to allow screen to turn off
            await wakeLockManager.release();
        } else {
            // Start continuous mode
            setContinuousMode(true);
            // We need to set the ref immediately for the first call
            continuousModeRef.current = true;

            // LAYER 1: Request wake lock to keep screen on
            const wakeLockAcquired = await wakeLockManager.request();
            if (wakeLockAcquired) {
                console.log('🔒 Screen will stay on during continuous mode');
            } else {
                console.log('⚠️ Wake Lock not available - screen may turn off');
            }

            playSequence(currentStep);
        }
    };

    // Auto-start continuous mode if requested from home screen
    useEffect(() => {
        if (startWithContinuous && !continuousMode && !isPlaying) {
            // Small delay to ensure component is fully mounted
            const timer = setTimeout(() => {
                handleToggleContinuous();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [startWithContinuous]);

    const renderStepContent = () => {
        const step = currentStep;

        // Special rendering for decade announcement
        if (step.type === 'decade_announcement') {
            const decadeInfo = flowEngine.getCurrentDecadeInfo();
            return (
                <div className="mystery-intro">
                    <div className="mystery-content-card">
                        <div className="mystery-image-container">
                            <MysteryImage
                                src={step.imageUrl}
                                alt={step.title}
                                number={step.decadeNumber}
                            />
                        </div>

                        <div className="mystery-card-body">
                            <h3 className="section-label">{t.reflection}</h3>
                            <p className="reflection-text">{step.text}</p>

                            {decadeInfo && (decadeInfo.fruit || decadeInfo.scripture) && (
                                <div className="meditation-footer" style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border-light)' }}>
                                    {decadeInfo.fruit && (
                                        <div className="fruit-container">
                                            <span className="fruit-label">{language === 'es' ? 'Fruto:' : 'Fruit:'}</span>
                                            <span className="fruit-text">{decadeInfo.fruit}</span>
                                        </div>
                                    )}

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
                </div>
            );
        }


        // Special rendering for final Hail Mary intros
        if (step.type === 'final_hail_mary_intro') {
            const parts = step.text.split('\n\n');
            return (
                <div className="final-hail-mary-container">
                    <div className="final-hail-mary-invocation">
                        {parts[0]}
                    </div>
                    {parts[1] && (
                        <>
                            <div className="final-hail-mary-spacer"></div>
                            <div className="final-hail-mary-prayer">
                                {parts[1]}
                            </div>
                        </>
                    )}
                </div>
            );
        }

        // Special rendering for Litany of Loreto
        if ((step.type as any) === 'litany_of_loreto' && step.litanyData) {
            const data = step.litanyData;
            const repeatText = language === 'es' ? '(Repetir respuesta: Ruega por nosotros)' : '(Repeat response: Pray for us)';

            return (
                <div className="prayer-section litany-container">
                    {/* Initial Petitions - Stacked */}
                    {data.initial_petitions.map((item: any, i: number) => (
                        <div key={`init-${i}`} className="litany-row litany-row-stacked">
                            <span className="litany-call">{item.call}</span>
                            <span className="litany-response">{item.response}</span>
                        </div>
                    ))}

                    <div className="litany-spacer"></div>

                    {/* Trinity Invocations - Stacked */}
                    {data.trinity_invocations.map((item: any, i: number) => (
                        <div key={`trin-${i}`} className="litany-row litany-row-stacked">
                            <span className="litany-call">{item.call}</span>
                            <span className="litany-response">{item.response}</span>
                        </div>
                    ))}

                    <div className="litany-spacer"></div>

                    {/* Mary Invocations - First with response, rest call-only */}
                    <div className="litany-instruction">{repeatText}</div>
                    {data.mary_invocations.map((item: any, i: number) => (
                        <div key={`mary-${i}`} className={i === 0 ? "litany-row litany-row-stacked" : "litany-row litany-row-call-only"}>
                            <span className="litany-call">{item.call}</span>
                            {i === 0 && <span className="litany-response">{item.response}</span>}
                        </div>
                    ))}

                    <div className="litany-spacer"></div>

                    {/* Agnus Dei - Stacked Layout */}
                    {data.agnus_dei.map((item: any, i: number) => (
                        <div key={`agnus-${i}`} className="litany-row litany-row-stacked">
                            <span className="litany-call">{item.call}</span>
                            <span className="litany-response">{item.response}</span>
                        </div>
                    ))}
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
        // Don't show on decade announcement as it already has it
        if (currentStep.type === 'decade_announcement') return null;

        const decadeInfo = flowEngine.getCurrentDecadeInfo();
        if (decadeInfo && decadeInfo.imageUrl) {
            return (
                <div className="mystery-intro" style={{ paddingTop: 'var(--spacing-sm)' }}>
                    <div className="mystery-content-card">
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

    return (
        <div className="mystery-screen-container">
            <div className="mystery-screen-header">
                <div className="mystery-header-spacer" />
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
                <div className="mystery-header-spacer" />
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
                        {currentStep.type !== 'decade_announcement' && (
                            <h3 className="prayer-name">{currentStep.title}</h3>
                        )}
                        <div className="audio-controls">
                            {audioEnabled && (
                                <button
                                    className={`btn-icon continuous-btn ${(continuousMode || isPlaying) ? 'active' : ''}`}
                                    onClick={handleToggleContinuous}
                                    aria-label={(continuousMode || isPlaying) ? t.stopContinuous : t.continuousMode}
                                    title={(continuousMode || isPlaying) ? t.stopContinuous : t.continuousMode}
                                >
                                    {(continuousMode || isPlaying) ? <Square size={28} /> : <Volume2 size={28} />}
                                </button>
                            )}
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
                </div>
            </div>
        </div>
    );
}
