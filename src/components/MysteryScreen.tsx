import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, StopCircle, Settings as SettingsIcon, Lightbulb } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SettingsModal } from './SettingsModal';
import { LearnMoreModal, type EducationalContent } from './LearnMoreModal';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import { sanitizeTextForSpeech } from '../utils/textSanitizer';
import type { MysteryType } from '../utils/prayerFlowEngine';
import { savePrayerProgress, loadPrayerProgress, hasValidPrayerProgress, clearPrayerProgress, clearSession } from '../utils/storage';
import { wakeLockManager } from '../utils/wakeLock';
import { ttsManager } from '../utils/ttsManager';
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

const BookIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M14.5 2H9l-.35.15-.65.64-.65-.64L7 2H1.5l-.5.5v10l.5.5h5.29l.86.85h.7l.86-.85h5.29l.5-.5v-10l-.5-.5zm-7 10.32l-.18-.17L7 12H2V3h4.79l.74.74-.03 8.58zM14 12H9l-.35.15-.14.13V3.7l.7-.7H14v9zM6 5H3v1h3V5zm0 4H3v1h3V9zM3 7h3v1H3V7zm10-2h-3v1h3V5zm-3 2h3v1h-3V7zm0 2h3v1h-3V9z" />
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

export function MysteryScreen({ onComplete, onBack, startWithContinuous = false }: MysteryScreenProps) {
    const {
        language,
        currentMysterySet,
        isPlaying,
        playAudio,
        stopAudio,
        mysteryLayout,
        setMysteryLayout
    } = useApp();
    const [showSettings, setShowSettings] = useState(false);
    const [showLearnMore, setShowLearnMore] = useState(false);
    // User-controlled text visibility preference (persists across prayers)
    const [userWantsTextHidden, setUserWantsTextHidden] = useState(false);
    const [showPrayerText, setShowPrayerText] = useState(true);

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
    const [continuousMode, setContinuousMode] = useState(isPlaying);
    const audioEndedRef = useRef(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Handle text visibility based on user preference
    useEffect(() => {
        if (userWantsTextHidden) {
            // User explicitly toggled text off - hide after 2.5s
            const timeoutId = setTimeout(() => {
                setShowPrayerText(false);
            }, 2500);
            return () => clearTimeout(timeoutId);
        } else {
            // User wants text visible - show immediately
            setShowPrayerText(true);
        }
    }, [userWantsTextHidden]);


    // Sync continuous mode with playing state on mount
    // This handles the case where user navigates away and back while audio is playing
    useEffect(() => {
        if (isPlaying && !continuousMode) {
            setContinuousMode(true);
            audioEndedRef.current = true;
        }
    }, []);

    // --- Audio Highlighting Logic (Sentence Level) ---
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [highlightingEnabled, setHighlightingEnabled] = useState(startWithContinuous || false); // Auto-enable if starting with audio

    // Helper to split text into sentences
    // Keeps punctuation attached to the sentence
    const getSentences = (text: string) => {
        if (!text) return [];
        return text.match(/[^.!?:]+([.!?:]+|\s*$)/g) || [text];
    };

    // Helper to render text with optional highlighting
    const renderTextWithHighlighting = (text: string) => {
        if (!text) return text; // Return empty string if no text

        // If highlighting is disabled, return text as-is
        if (!highlightingEnabled) {
            return text;
        }

        // Try to split into sentences for highlighting
        try {
            const sentences = getSentences(text);

            // Only apply highlighting if we successfully got sentences
            if (sentences && sentences.length > 0) {
                return sentences.map((sentence, idx) => (
                    <span key={idx} className={idx === highlightIndex ? "highlighted-sentence" : ""}>
                        {sentence}
                    </span>
                ));
            }
        } catch (error) {
            console.error('[Highlighting] Error splitting sentences:', error);
        }

        // Fallback: always return the original text if anything goes wrong
        return text;
    };

    // Reset highlight when step changes
    useEffect(() => {
        setHighlightIndex(-1);
    }, [currentStep]);

    // Track audio boundary events for highlighting
    // NOTE: Using time-based estimation because onboundary is unreliable across browsers
    useEffect(() => {
        // Apply highlighting to all prayers when enabled
        if (!isPlaying || !highlightingEnabled) {
            setHighlightIndex(-1);
            return;
        }

        console.log('[Highlight Debug] Starting time-based highlighting for current prayer');
        console.log('[Highlight Debug] Step type:', currentStep.type, 'Has litanyData:', !!currentStep.litanyData);

        const isLitany = currentStep.type === 'litany_of_loreto';

        // For litanies, use fixed timing per invocation
        if (isLitany && currentStep.litanyData) {
            console.log('[Highlight Debug] Using LITANY timing');
            const data = currentStep.litanyData;
            const timeouts: number[] = [];

            // Count total invocations
            const allInvocations = [
                ...data.initial_petitions,
                ...data.trinity_invocations,
                ...data.mary_invocations
            ];

            // Calculate timing based on word count for each invocation
            // Litanies are read at ~2.5 words per second at 0.85 rate
            const wordsPerSecond = 2.5 * 0.85;
            let cumulativeTime = 0;

            allInvocations.forEach((item: any, i: number) => {
                let duration;

                if (i < 3) {
                    // First 3 invocations: use fixed timing (they have pauses)
                    duration = 3500; // 3.5 seconds
                } else {
                    // Rest: calculate based on word count
                    const callWords = (item.call || '').trim().split(/\s+/).length;
                    const responseWords = (item.response || '').trim().split(/\s+/).length;
                    const totalWords = callWords + responseWords;
                    duration = (totalWords / wordsPerSecond) * 1000;
                }

                const timeout = setTimeout(() => {
                    console.log('[Highlight Debug] Litany row', i, 'duration:', duration);
                    setHighlightIndex(i);
                }, cumulativeTime);

                timeouts.push(timeout);
                cumulativeTime += duration;
            });

            // Clear highlight at the end
            const finalTimeout = setTimeout(() => {
                setHighlightIndex(-1);
            }, cumulativeTime);
            timeouts.push(finalTimeout);

            return () => {
                console.log('[Highlight Debug] Cleaning up timeouts');
                timeouts.forEach(t => clearTimeout(t));
            };
        }

        // For regular prayers, use word-count-based timing
        const text = currentStep.text || '';
        const sanitizedText = sanitizeTextForSpeech(text);
        const sentences = getSentences(sanitizedText);

        // Calculate timing for each sentence based on word count
        // Average speech rate: ~3.0 words per second at 0.85 rate (adjusted for better sync)
        const wordsPerSecond = 3.0 * 0.85;

        const timeouts: number[] = [];
        let cumulativeTime = 0;

        sentences.forEach((sentence, index) => {
            const words = sentence.trim().split(/\s+/).length;
            const duration = (words / wordsPerSecond) * 1000; // milliseconds

            const timeout = setTimeout(() => {
                console.log('[Highlight Debug] Highlighting sentence', index, ':', sentence.substring(0, 30));
                setHighlightIndex(index);
            }, cumulativeTime);

            timeouts.push(timeout);
            cumulativeTime += duration;
        });

        // Clear highlight at the end
        const finalTimeout = setTimeout(() => {
            setHighlightIndex(-1);
        }, cumulativeTime);
        timeouts.push(finalTimeout);

        return () => {
            console.log('[Highlight Debug] Cleaning up timeouts');
            timeouts.forEach(t => clearTimeout(t));
        };
    }, [currentStep, isPlaying, highlightingEnabled]);

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
        if (continuousMode) {
            // Stop continuous mode
            setContinuousMode(false);
            continuousModeRef.current = false;

            // LAYER 2: Invalidate all pending callbacks
            playbackIdRef.current++;

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
        if (startWithContinuous && !continuousMode) {
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
                            <div className="immersive-overlay-darker"></div>
                        </div>

                        <div className="immersive-content">


                            <main className="immersive-main">
                                <div className="text-center space-y-6">


                                    <div className="space-y-4 pt-4 text-center">
                                        <h3 className="section-label">
                                            {language === 'es' ? 'REFLEXIÓN' : 'REFLECTION'}
                                        </h3>
                                        <p className="font-sans text-lg leading-relaxed text-gray-200">
                                            {renderTextWithHighlighting(step.text)}
                                        </p>
                                    </div>

                                    {decadeInfo && (decadeInfo.fruit || decadeInfo.scripture) && (
                                        <div className="pt-8">
                                            {decadeInfo.fruit && (
                                                <h3 className="section-label" style={{ color: '#FFD700' }}>
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
                            <p className="reflection-text">{renderTextWithHighlighting(step.text)}</p>

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
                                {/* Title and Fruit grouped together */}
                                <div className="space-y-2">
                                    <h1 className="font-display text-2xl font-bold immersive-mystery-title tracking-wide">
                                        {(step.title || '').toUpperCase()}
                                    </h1>

                                    {/* Show Fruit for Our Father */}
                                    {decadeInfo?.fruit && (
                                        <div className="text-center">
                                            <span className="font-display text-lg font-bold tracking-wide" style={{ color: '#D4AF37' }}>
                                                {language === 'es' ? 'FRUTO: ' : 'FRUIT: '}
                                            </span>
                                            <span className="font-display text-lg font-bold tracking-wide" style={{ color: '#D4AF37' }}>
                                                {decadeInfo.fruit.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>


                                <div className="max-w-2xl mx-auto px-6">
                                    <p className="font-sans text-xl leading-loose text-gray-100 text-center drop-shadow-md">
                                        {renderTextWithHighlighting(step.text)}
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
                                <div className="space-y-2">
                                    <h1 className="font-display text-2xl font-bold immersive-mystery-title tracking-wide">
                                        {(step.title || '').toUpperCase()}
                                    </h1>

                                    {/* Show Fruit for decade prayers */}
                                    {step.decadeNumber && (() => {
                                        const decadeInfo = flowEngine.getCurrentDecadeInfo();
                                        return decadeInfo?.fruit ? (
                                            <div className="text-center">
                                                <span className="font-display text-lg font-bold tracking-wide" style={{ color: '#D4AF37' }}>
                                                    {language === 'es' ? 'FRUTO: ' : 'FRUIT: '}
                                                </span>
                                                <span className="font-display text-lg font-bold tracking-wide" style={{ color: '#D4AF37' }}>
                                                    {decadeInfo.fruit.toUpperCase()}
                                                </span>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>


                                <div className="max-w-2xl mx-auto px-6">
                                    <p className="font-sans text-xl leading-loose text-gray-100 text-center drop-shadow-md">
                                        {renderTextWithHighlighting(step.text)}
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
                                                    background: bead <= step.hailMaryNumber! ? '#7C3AED' : 'rgba(255,255,255,0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {bead <= step.hailMaryNumber! && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: '700',
                                                        color: 'white',
                                                        lineHeight: '1'
                                                    }}>{bead}</span>
                                                )}
                                            </div>
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
                            <div className="immersive-overlay-darker"></div>
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
                                                {renderTextWithHighlighting(step.text)}
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
                        <p className="mystery-text">{renderTextWithHighlighting(step.text)}</p>
                    </div>
                );
            }

            // Fallback for closing prayers without images
            return (
                <div className="intro-prayer-card">
                    <h2 className="intro-title">{step.title || ''}</h2>
                    <div className="intro-divider"></div>
                    <p className="intro-text">{renderTextWithHighlighting(step.text)}</p>
                </div>
            );
        }



        // Special rendering for Litany of Loreto
        if ((step.type as any) === 'litany_of_loreto' && step.litanyData) {
            const data = step.litanyData;

            // Helper to render a row with alternating background (full call and response)
            const renderRow = (call: string, response: string, index: number, globalIndex: number) => (
                <div
                    key={`${index}-${globalIndex}`}
                    className={`litany-row-new ${globalIndex % 2 === 0 ? 'litany-row-highlight' : ''} ${highlightingEnabled && highlightIndex === globalIndex ? 'litany-row-active' : ''}`}
                >
                    <div className="litany-call-new">{call}</div>
                    <div className="litany-response-new">{response}</div>
                </div>
            );

            // Helper to render call-only row (for Mary invocations after the first)
            const renderCallOnly = (call: string, index: number, globalIndex: number) => (
                <div
                    key={`${index}-${globalIndex}`}
                    className={`litany-row-new ${globalIndex % 2 === 0 ? 'litany-row-highlight' : ''} ${highlightingEnabled && highlightIndex === globalIndex ? 'litany-row-active' : ''}`}
                >
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
            const renderContent = () => renderTextWithHighlighting(step.text || '');

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
                            <div className="immersive-overlay-darker"></div>
                        </div>

                        <div className="immersive-content">
                            <main className="immersive-main flex flex-col h-full">
                                <div className="text-center space-y-8">
                                    <h1 className="font-display text-2xl font-bold immersive-mystery-title tracking-wide mb-8">
                                        {(step.title || '').toUpperCase()}
                                    </h1>

                                    <div className="max-w-2xl mx-auto px-6">
                                        <p className="font-sans text-xl leading-loose text-gray-100 text-center drop-shadow-md">
                                            {renderContent()}
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
                        <p className="mystery-text">{renderContent()}</p>
                    </div>
                );
            }

            // Fallback for intro prayers without images
            return (
                <div className="intro-prayer-card">
                    <h2 className="intro-title">{step.title || ''}</h2>
                    <div className="intro-divider"></div>
                    <p className="intro-text">{renderContent()}</p>
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
                    <p className="mystery-text">{renderTextWithHighlighting(step.text)}</p>
                </div>
            );
        }

        // Default rendering for all other prayers
        return (
            <div className="prayer-content">
                <p className="prayer-text-main">{renderTextWithHighlighting(step.text)}</p>
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
                            style={{
                                borderColor: 'rgba(255,255,255,0.3)',
                                background: bead <= step.hailMaryNumber! ? '#7C3AED' : 'rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {bead <= step.hailMaryNumber! && (
                                <span className="bead-number">{bead}</span>
                            )}
                        </div>
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
        <div className={`mystery-screen-container ${!showPrayerText ? 'prayer-text-hidden' : ''}`}>
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

                <button
                    className={`text-visibility-btn-header ${isPlaying ? 'pulsate-book-icon' : ''}`}
                    onClick={() => {
                        // Toggle user preference
                        const newPreference = !userWantsTextHidden;
                        setUserWantsTextHidden(newPreference);
                        // If turning text back on, show immediately
                        if (!newPreference) {
                            setShowPrayerText(true);
                        }
                    }}
                    aria-label={userWantsTextHidden ? "Show prayer text" : "Hide prayer text"}
                    style={{ marginLeft: '12px' }}
                >
                    <BookIcon size={20} className={userWantsTextHidden ? "opacity-50" : ""} />
                </button>

                <button
                    className={`text-visibility-btn-header ${highlightingEnabled ? 'pulsate-book-icon' : ''}`}
                    onClick={() => setHighlightingEnabled(!highlightingEnabled)}
                    aria-label={highlightingEnabled ? "Disable highlighting" : "Enable highlighting"}
                    style={{ marginLeft: '12px' }}
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 36 36"
                        fill="currentColor"
                        className={highlightingEnabled ? "" : "opacity-50"}
                    >
                        <path d="M15.82,26.06a1,1,0,0,1-.71-.29L8.67,19.33a1,1,0,0,1-.29-.71,1,1,0,0,1,.29-.71L23,3.54a5.55,5.55,0,1,1,7.85,7.86L16.53,25.77A1,1,0,0,1,15.82,26.06Zm-5-7.44,5,5L29.48,10a3.54,3.54,0,0,0,0-5,3.63,3.63,0,0,0-5,0Z" />
                        <path d="M10.38,28.28A1,1,0,0,1,9.67,28L6.45,24.77a1,1,0,0,1-.22-1.09l2.22-5.44a1,1,0,0,1,1.63-.33l6.45,6.44A1,1,0,0,1,16.2,26l-5.44,2.22A1.33,1.33,0,0,1,10.38,28.28ZM8.33,23.82l2.29,2.28,3.43-1.4L9.74,20.39Z" />
                        <path d="M8.94,30h-5a1,1,0,0,1-.84-1.55l3.22-4.94a1,1,0,0,1,1.55-.16l3.21,3.22a1,1,0,0,1,.06,1.35L9.7,29.64A1,1,0,0,1,8.94,30ZM5.78,28H8.47L9,27.34l-1.7-1.7Z" />
                        <rect x="3.06" y="31" width="30" height="3" />
                    </svg>
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
                    className="layout-mode-btn-header"
                    onClick={() => {
                        const newLayout = mysteryLayout === 'classic' ? 'cinematic' : 'classic';
                        setMysteryLayout(newLayout);
                    }}
                    aria-label={`Switch to ${mysteryLayout === 'classic' ? 'cinematic' : 'classic'} mode`}
                    style={{ marginRight: '12px' }}
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
