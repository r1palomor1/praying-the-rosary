import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, StopCircle, Settings as SettingsIcon, Lightbulb } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SettingsModal } from './SettingsModal';
import { LearnMoreModal, type EducationalContent } from './LearnMoreModal';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import type { MysteryType } from '../utils/prayerFlowEngine';
import { savePrayerProgress, loadPrayerProgress, hasValidPrayerProgress, clearPrayerProgress, clearSession } from '../utils/storage';
import { wakeLockManager } from '../utils/wakeLock';
import educationalDataEs from '../data/es-rosary-educational-content.json';
import educationalDataEn from '../data/en-rosary-educational-content.json';

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
        mysteryLayout
    } = useApp();
    const [showSettings, setShowSettings] = useState(false);
    const [showLearnMore, setShowLearnMore] = useState(false);

    const [flowEngine] = useState(() => {
        const engine = new PrayerFlowEngine(currentMysterySet as MysteryType, language);

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
        textSize: 'Tamaño de texto',
        settings: 'Configuración',
        learnMore: 'Profundizar'
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
        textSize: 'Text Size',
        settings: 'Settings',
        learnMore: 'Learn More'
    };

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

    // Handle clearing only the current mystery's progress
    const handleResetCurrentMystery = () => {
        console.log('Resetting current mystery:', currentMysterySet);

        // Clear only this mystery's progress
        clearPrayerProgress(currentMysterySet);
        clearSession();

        // Navigate back to home
        onBack();
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

    // Auto-start continuous mode if requested from home screen
    useEffect(() => {
        if (startWithContinuous && !continuousMode && !isPlaying) {
            console.log('[MysteryScreen] Auto-starting continuous mode');
            handleToggleContinuous();
        }
    }, [startWithContinuous]);

    // Check for Intro Prayers
    const introPrayers = [
        'Sign of the Cross', 'Señal de la Cruz',
        'Opening Invocation', 'Invocación Inicial',
        'Act of Contrition', 'Acto de Contrición',
        'Apostles\' Creed', 'Credo de los Apóstoles',
        'Invocation to the Holy Spirit', 'Invocación al Espíritu Santo',
        'Moments of Intentions', 'Momentos de Intenciones',
        'Moment of Intentions', 'Momento de Intenciones'
    ];

    // Check for Closing Prayers (with images, excluding litany)
    const closingPrayerTypes = [
        'final_jaculatory_start',
        'final_hail_mary_intro',
        'hail_holy_queen',
        'closing_under_your_protection',
        'final_collect',
        'sign_of_cross_end'
    ];

    const stepTitle = currentStep?.title;
    const isIntroPrayer = stepTitle ? introPrayers.some(t => stepTitle.includes(t)) : false;
    const isClosingPrayer = closingPrayerTypes.includes(currentStep?.type as string);

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
                                loading="lazy" decoding="async" />
                            <div className="immersive-overlay"></div>
                        </div>

                        <div className="immersive-content">


                            <main className="immersive-main">
                                <div className="text-center space-y-6">


                                    <div className="space-y-4 pt-4 text-center">
                                        <h3 className="section-label">
                                            {language === 'es' ? 'REFLEXIÓN' : 'REFLECTION'}
                                        </h3>
                                        <p className="font-sans text-lg leading-relaxed text-gray-200">
                                            {step.text}
                                        </p>
                                    </div>

                                    {decadeInfo && (decadeInfo.fruit || decadeInfo.scripture) && (
                                        <div className="pt-8">
                                            {decadeInfo.fruit && (
                                                <h3 className="section-label">
                                                    {language === 'es' ? 'FRUTO: ' : 'FRUIT: '}{decadeInfo.fruit.toUpperCase()}
                                                </h3>
                                            )}
                                            {decadeInfo.scripture && (
                                                <blockquote className="border-l-2 border-primary-50 pl-4">
                                                    <p className="font-sans text-base italic leading-relaxed text-gray-300">
                                                        "{decadeInfo.scripture.text}"
                                                    </p>
                                                    <footer className="text-right text-sm text-gray-400 mt-2">
                                                        {decadeInfo.scripture.reference}
                                                    </footer>
                                                </blockquote>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </main>
                        </div>




                    </div>
                );
            }

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
                                            <h3 className="section-label">{language === 'es' ? 'Fruto:' : 'Fruit:'} {decadeInfo.fruit}</h3>
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


        // Special rendering for Our Father in Cinematic mode
        if (step.type === 'decade_our_father' && mysteryLayout === 'cinematic') {
            const decadeInfo = flowEngine.getCurrentDecadeInfo();


            return (
                <div className="immersive-mystery-container">
                    <div className="immersive-bg">
                        {(decadeInfo?.imageUrl || step.imageUrl) && (
                            <img
                                src={decadeInfo?.imageUrl || step.imageUrl}
                                alt={decadeInfo?.title || step.title}
                                className="immersive-img"
                                style={currentMysterySet === 'sorrowful' && decadeInfo?.number === 5 ? { transform: 'translateY(20px)' } : undefined}
                                loading="lazy" decoding="async" />
                        )}
                        <div className="immersive-overlay"></div>
                    </div>

                    <div className="immersive-content">


                        <main className="immersive-main flex flex-col h-full">
                            <div className="text-center space-y-8">
                                <h1 className="font-display text-2xl font-bold immersive-mystery-title tracking-wide mb-8">
                                    {(step.title || '').toUpperCase()}
                                </h1>


                                <div className="max-w-2xl mx-auto px-6">
                                    <p className="font-sans text-xl leading-loose text-gray-100 text-center drop-shadow-md">
                                        {step.text}
                                    </p>
                                </div>
                            </div>
                        </main>
                    </div>




                </div>
            );
        }

        // Unified Cinematic Rendering for Decade Prayers (Hail Mary, Glory Be, Jaculatory, Fatima Prayer)
        if (['decade_hail_mary', 'decade_glory_be', 'decade_jaculatory', 'fatima_prayer'].includes(step.type) && mysteryLayout === 'cinematic') {
            const decadeInfo = flowEngine.getCurrentDecadeInfo();


            return (
                <div className="immersive-mystery-container">
                    <div className="immersive-bg">
                        {(decadeInfo?.imageUrl || (step as any).imageUrl) && (
                            <img
                                src={decadeInfo?.imageUrl || (step as any).imageUrl}
                                alt={decadeInfo?.title || step.title}
                                className="immersive-img"

                                loading="lazy" decoding="async" />
                        )}
                        <div className="immersive-overlay"></div>
                    </div>

                    <div className="immersive-content">
                        <main className="immersive-main flex flex-col h-full">
                            <div className="text-center space-y-8">
                                <h1 className="font-display text-2xl font-bold immersive-mystery-title tracking-wide mb-8">
                                    {(step.title || '').toUpperCase()}
                                </h1>


                                <div className="max-w-2xl mx-auto px-6">
                                    <p className="font-sans text-xl leading-loose text-gray-100 text-center drop-shadow-md">
                                        {step.text}
                                    </p>
                                </div>

                                {/* Bead Counter for Hail Mary */}
                                {step.type === 'decade_hail_mary' && step.hailMaryNumber && (
                                    <div className="bead-counter mt-8 justify-center">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bead) => (
                                            <div
                                                key={bead}
                                                className={`bead ${bead <= step.hailMaryNumber! ? 'bead-active' : ''}`}
                                                style={{
                                                    borderColor: 'rgba(255,255,255,0.3)',
                                                    background: bead <= step.hailMaryNumber! ? '#D4AF37' : 'rgba(255,255,255,0.1)'
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            );
        }
        // Closing Prayers - Support both classic and cinematic with images (same pattern as intro prayers)
        if (isClosingPrayer) {
            // Cinematic mode with image
            if (mysteryLayout === 'cinematic' && step.imageUrl) {
                return (
                    <div className="immersive-mystery-container">
                        <div className="immersive-bg">
                            <img
                                src={step.imageUrl}
                                alt={step.title}
                                className="immersive-img"
                                loading="lazy" decoding="async" />
                            <div className="immersive-overlay"></div>
                        </div>

                        <div className="immersive-content">
                            <main className="immersive-main flex flex-col h-full">
                                <div className="text-center space-y-8">
                                    <h1 className="font-display text-2xl font-bold immersive-mystery-title tracking-wide mb-8">
                                        {(step.title || '').toUpperCase()}
                                    </h1>

                                    <div className="max-w-2xl mx-auto px-6">
                                        {/* Handle Final Hail Marys with two parts */}
                                        {step.type === 'final_hail_mary_intro' ? (
                                            (() => {
                                                const parts = step.text.split('\n\n');
                                                return (
                                                    <>
                                                        <p className="font-sans text-xl leading-loose text-gray-100 text-center drop-shadow-md">
                                                            {parts[0]}
                                                        </p>
                                                        {parts[1] && (
                                                            <p className="font-sans text-xl leading-loose text-center drop-shadow-md mt-4" style={{ color: '#FBBF24', fontStyle: 'italic' }}>
                                                                {parts[1]}
                                                            </p>
                                                        )}
                                                    </>
                                                );
                                            })()
                                        ) : (
                                            <p className="font-sans text-xl leading-loose text-gray-100 text-center drop-shadow-md">
                                                {step.text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </main>
                        </div>
                    </div>
                );
            }

            // Classic mode - prayer text (unboxed) with image rendered separately below
            if (step.imageUrl) {
                // Handle Final Hail Marys with two parts
                if (step.type === 'final_hail_mary_intro') {
                    const parts = step.text.split('\n\n');
                    return (
                        <div className="mystery-prayer-card">
                            <h2 className="mystery-title">{step.title || ''}</h2>
                            <div className="mystery-divider"></div>
                            <div className="mystery-text">
                                <div>{parts[0]}</div>
                                {parts[1] && (
                                    <div style={{ color: '#FBBF24', marginTop: '1rem', fontStyle: 'italic', fontWeight: 'normal' }}>
                                        {parts[1]}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }

                // All other closing prayers
                return (
                    <div className="mystery-prayer-card">
                        <h2 className="mystery-title">{step.title || ''}</h2>
                        <div className="mystery-divider"></div>
                        <p className="mystery-text">{step.text}</p>
                    </div>
                );
            }

            // Fallback for closing prayers without images
            return (
                <div className="intro-prayer-card">
                    <h2 className="intro-title">{step.title || ''}</h2>
                    <div className="intro-divider"></div>
                    <p className="intro-text">{step.text}</p>
                </div>
            );
        }



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

        // Intro Prayers - Support both classic and cinematic with images
        if (isIntroPrayer) {
            // Cinematic mode with image
            if (mysteryLayout === 'cinematic' && step.imageUrl) {
                return (
                    <div className="immersive-mystery-container">
                        <div className="immersive-bg">
                            <img
                                src={step.imageUrl}
                                alt={step.title}
                                className="immersive-img"
                                loading="lazy" decoding="async" />
                            <div className="immersive-overlay"></div>
                        </div>

                        <div className="immersive-content">
                            <main className="immersive-main flex flex-col h-full">
                                <div className="text-center space-y-8">
                                    <h1 className="font-display text-2xl font-bold immersive-mystery-title tracking-wide mb-8">
                                        {(step.title || '').toUpperCase()}
                                    </h1>

                                    <div className="max-w-2xl mx-auto px-6">
                                        <p className="font-sans text-xl leading-loose text-gray-100 text-center drop-shadow-md">
                                            {step.text}
                                        </p>
                                    </div>
                                </div>
                            </main>
                        </div>
                    </div>
                );
            }

            // Classic mode - prayer text (unboxed) with image rendered separately below
            if (step.imageUrl) {
                return (
                    <div className="mystery-prayer-card">
                        <h2 className="mystery-title">{step.title || ''}</h2>
                        <div className="mystery-divider"></div>
                        <p className="mystery-text">{step.text}</p>
                    </div>
                );
            }

            // Fallback for intro prayers without images
            return (
                <div className="intro-prayer-card">
                    <h2 className="intro-title">{step.title || ''}</h2>
                    <div className="intro-divider"></div>
                    <p className="intro-text">{step.text}</p>
                </div>
            );
        }

        // Mystery Prayer Card for all decade prayers (Classic Mode only)
        const decadePrayerTypes = ['decade_our_father', 'decade_hail_mary', 'decade_glory_be', 'decade_jaculatory', 'fatima_prayer'];
        if (mysteryLayout !== 'cinematic' && decadePrayerTypes.includes(step.type)) {
            return (
                <div className="mystery-prayer-card">
                    <h2 className="mystery-title">{step.title}</h2>
                    <div className="mystery-divider"></div>
                    <p className="mystery-text">{step.text}</p>
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

        // Check for intro prayers with images
        if (isIntroPrayer && currentStep.imageUrl) {
            return (
                <div className="mystery-intro" style={{ paddingTop: 'var(--spacing-sm)' }}>
                    <div className="mystery-content-card">
                        <div className="mystery-image-container">
                            <MysteryImage
                                src={currentStep.imageUrl}
                                alt={currentStep.title}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // Check for closing prayers with images
        if (isClosingPrayer && currentStep.imageUrl) {
            return (
                <div className="mystery-intro" style={{ paddingTop: 'var(--spacing-sm)' }}>
                    <div className="mystery-content-card">
                        <div className="mystery-image-container">
                            <MysteryImage
                                src={currentStep.imageUrl}
                                alt={currentStep.title}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // Check for decade prayers with images
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

    return (
        <div className="mystery-screen-container">
            <div className="mystery-screen-header">
                <button
                    className="continuous-audio-btn-header"
                    onClick={handleToggleContinuous}
                    aria-label={(continuousMode || isPlaying) ? t.stopContinuous : t.continuousMode}
                >
                    {(continuousMode || isPlaying) ? (
                        <StopCircle size={20} strokeWidth={3} />
                    ) : (
                        <Volume2 size={20} strokeWidth={3} />
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
                    <SettingsIcon size={20} strokeWidth={3} />
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
                        {currentStep.type !== 'decade_announcement' &&
                            !isIntroPrayer &&
                            currentStep.type !== 'litany_of_loreto' &&
                            currentStep.type !== 'final_jaculatory_start' &&
                            !['final_hail_mary_intro', 'final_hail_mary_1', 'final_hail_mary_2', 'final_hail_mary_3', 'final_hail_mary_4', 'hail_holy_queen', 'closing_under_your_protection', 'final_collect', 'sign_of_cross_end'].includes(currentStep.type) &&
                            !(mysteryLayout !== 'cinematic' && ['decade_our_father', 'decade_hail_mary', 'decade_glory_be', 'decade_jaculatory', 'fatima_prayer'].includes(currentStep.type)) &&
                            !(mysteryLayout === 'cinematic' && ['decade_our_father', 'decade_hail_mary', 'decade_glory_be', 'decade_jaculatory', 'fatima_prayer'].includes(currentStep.type)) && (
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
                            <ChevronLeft size={24} strokeWidth={3} />
                            <span className="mystery-nav-label">{t.previous}</span>
                        </button>

                        <button
                            className="mystery-nav-btn"
                            onClick={handleNext}
                            disabled={flowEngine.isLastStep()}
                            aria-label={flowEngine.isLastStep() ? t.finish : t.next}
                            title={flowEngine.isLastStep() ? t.finish : t.next}
                        >
                            <ChevronRight size={24} strokeWidth={3} />
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
                        <Lightbulb size={24} strokeWidth={3} />
                        <span className="mystery-nav-label">{t.learnMore}</span>
                    </button>
                </div>
            </div>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={handleResetCurrentMystery}
                currentMysteryName={flowEngine.getMysteryName()}
            />

            {/* Learn More Modal */}
            <LearnMoreModal
                isOpen={showLearnMore}
                onClose={() => setShowLearnMore(false)}
                data={currentEducationalData}
                language={language}
            />
        </div >
    );
}

export default MysteryScreen;
