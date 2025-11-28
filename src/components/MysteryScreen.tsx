import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import type { MysteryType } from '../utils/prayerFlowEngine';
import { savePrayerProgress, loadPrayerProgress, hasValidPrayerProgress } from '../utils/storage';

import './MysteryScreen.css';
import './MysteryBottomNav.css';

interface MysteryScreenProps {
    onComplete: () => void;
    onBack: () => void;
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

export function MysteryScreen({ onComplete, onBack }: MysteryScreenProps) {
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

        // Load saved progress if available
        const savedProgress = loadPrayerProgress();
        if (savedProgress && hasValidPrayerProgress() && savedProgress.mysteryType === currentMysterySet) {
            engine.jumpToStep(savedProgress.currentStepIndex);
        }



        return engine;
    });

    const [currentStep, setCurrentStep] = useState(flowEngine.getCurrentStep());
    const [continuousMode, setContinuousMode] = useState(false);
    const audioEndedRef = useRef(false);
    const contentRef = useRef<HTMLDivElement>(null);

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

    const getAudioText = (step: any) => {
        if (step.type === 'decade_announcement') {
            return `${step.title}. ${step.text}`;
        }

        // Build audio text for litany from structured data
        if (step.type === 'litany_of_loreto' && step.litanyData) {
            const data = step.litanyData;
            const parts: string[] = [];

            // Add all sections with call and response
            [...data.initial_petitions, ...data.trinity_invocations, ...data.mary_invocations, ...data.agnus_dei].forEach(item => {
                parts.push(`${item.call} ${item.response}`);
            });

            return parts.join('. ');
        }

        return step.text;
    };

    // Handle continuous audio mode
    useEffect(() => {
        if (continuousMode && !isPlaying && audioEndedRef.current) {
            audioEndedRef.current = false;
            // Auto-advance to next step
            const nextStep = flowEngine.getNextStep();
            if (nextStep) {
                setCurrentStep(nextStep);
                if (nextStep.type !== 'complete') {
                    setTimeout(() => {
                        playAudio(getAudioText(nextStep));
                        audioEndedRef.current = true;
                    }, 500); // Small delay between prayers
                } else {
                    setContinuousMode(false);
                    onComplete();
                }
            }
        }
    }, [isPlaying, continuousMode, flowEngine, playAudio, onComplete]);

    const handleNext = () => {
        stopAudio(); // Stop any playing audio
        const nextStep = flowEngine.getNextStep();
        if (nextStep) {
            setCurrentStep(nextStep);
            if (nextStep.type === 'complete') {
                onComplete();
            }
        }
    };

    const handlePrevious = () => {
        stopAudio(); // Stop any playing audio
        const prevStep = flowEngine.getPreviousStep();
        if (prevStep) {
            setCurrentStep(prevStep);
        }
    };

    const handlePlayAudio = () => {
        if (isPlaying) {
            stopAudio();
            setContinuousMode(false);
        } else {
            playAudio(getAudioText(currentStep));
        }
    };

    const handleToggleContinuous = () => {
        if (continuousMode) {
            // Stop continuous mode
            setContinuousMode(false);
            stopAudio();
        } else {
            // Start continuous mode
            setContinuousMode(true);
            audioEndedRef.current = true;
            playAudio(getAudioText(currentStep));
        }
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
        stopContinuous: 'Detener Continuo',
        reflection: 'Reflexión',
        mystery: 'Misterio',
        mysteryOrdinal: 'º'
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
        stopContinuous: 'Stop Continuous',
        reflection: 'Reflection',
        mystery: 'Mystery',
        mysteryOrdinal: ''
    };

    const renderStepContent = () => {
        const step = currentStep;

        // Special rendering for decade announcement
        if (step.type === 'decade_announcement') {
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
                                <>
                                    <button
                                        className="btn-icon audio-btn"
                                        onClick={handlePlayAudio}
                                        aria-label={isPlaying ? t.stopAudio : t.playAudio}
                                        title={isPlaying ? t.stopAudio : t.playAudio}
                                    >
                                        {isPlaying ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </button>
                                    <button
                                        className={`btn-icon continuous-btn ${continuousMode ? 'active' : ''}`}
                                        onClick={handleToggleContinuous}
                                        aria-label={continuousMode ? t.stopContinuous : t.continuousMode}
                                        title={continuousMode ? t.stopContinuous : t.continuousMode}
                                    >
                                        {continuousMode ? <Pause size={24} /> : <Play size={24} />}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {renderStepContent()}
                    {renderBeadCounter()}
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
                            <ChevronLeft size={24} />
                            <span className="mystery-nav-label">{t.previous}</span>
                        </button>

                        <button
                            className="mystery-nav-btn"
                            onClick={handleNext}
                            disabled={flowEngine.isLastStep()}
                            aria-label={flowEngine.isLastStep() ? t.finish : t.next}
                            title={flowEngine.isLastStep() ? t.finish : t.next}
                        >
                            <ChevronRight size={24} />
                            <span className="mystery-nav-label">{flowEngine.isLastStep() ? t.finish : t.next}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
