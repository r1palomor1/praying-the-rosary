import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { SettingsModal } from './SettingsModal';
import { LearnMoreModal, type EducationalContent } from './LearnMoreModal';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import { sanitizeTextForSpeech } from '../utils/textSanitizer';
import type { MysteryType } from '../utils/prayerFlowEngine';
import { savePrayerProgress, loadPrayerProgress, hasValidPrayerProgress, clearPrayerProgress, clearSession } from '../utils/storage';
import { wakeLockManager } from '../utils/wakeLock';
import educationalDataEs from '../data/es-rosary-educational-content.json';
import educationalDataEn from '../data/en-rosary-educational-content.json';
import { HighlightErrorBoundary } from './HighlightErrorBoundary';
import { DebugOpacitySlider } from './DebugOpacitySlider';

// NEW: Import shared components and view components
import { MysteryHeader } from './shared/MysteryHeader';
import { MysteryNavigation } from './shared/MysteryNavigation';
import { ProgressBar } from './shared/ProgressBar';
import { ClassicMysteryView } from './ClassicMysteryView';
import { CinematicMysteryView } from './CinematicMysteryView';

import './MysteryScreen.css';
import './MysteryBottomNav.css';

interface MysteryScreenProps {
    onComplete: () => void;
    onBack: () => void;
    startWithContinuous?: boolean;
}

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
    const { showToast } = useToast();
    const [showSettings, setShowSettings] = useState(false);
    const [showLearnMore, setShowLearnMore] = useState(false);
    const [userWantsTextHidden, setUserWantsTextHidden] = useState(false);
    const [showPrayerText, setShowPrayerText] = useState(true);

    // DEBUG: Opacity sliders
    const [debugBaseOpacity, setDebugBaseOpacity] = useState(() => {
        const saved = localStorage.getItem('debug_base_opacity');
        return saved ? parseFloat(saved) : 55;  // Default to 55% for text-hidden state
    });
    const [debugSecondaryOpacity, setDebugSecondaryOpacity] = useState(() => {
        const saved = localStorage.getItem('debug_secondary_opacity');
        return saved ? parseFloat(saved) : 0;  // Default to 0% for text-hidden state
    });

    const [flowEngine] = useState(() => {
        const engine = new PrayerFlowEngine(currentMysterySet as MysteryType, language);
        const savedProgress = loadPrayerProgress(currentMysterySet);
        if (savedProgress && hasValidPrayerProgress(currentMysterySet) && savedProgress.mysteryType === currentMysterySet) {
            if (savedProgress.currentStepIndex >= engine.getTotalSteps() - 1) {
                setTimeout(() => onComplete(), 0);
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

    // Handle text visibility
    useEffect(() => {
        setShowPrayerText(!userWantsTextHidden);
    }, [userWantsTextHidden]);

    // Sync continuous mode
    useEffect(() => {
        if (isPlaying && !continuousMode) {
            setContinuousMode(true);
            audioEndedRef.current = true;
        }
    }, []);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    // Dynamic scrolling in cinematic mode
    useEffect(() => {
        if (mysteryLayout === 'cinematic') {
            const checkOverflow = () => {
                const body = document.body;
                const html = document.documentElement;
                const hasOverflow = Math.max(
                    body.scrollHeight,
                    body.offsetHeight,
                    html.clientHeight,
                    html.scrollHeight,
                    html.offsetHeight
                ) > window.innerHeight;

                if (hasOverflow) {
                    document.body.style.overflowY = 'auto';
                } else {
                    document.body.style.overflowY = 'hidden';
                }
            };

            checkOverflow();
            const timer = setTimeout(checkOverflow, 500);
            return () => {
                clearTimeout(timer);
                document.body.style.overflowY = 'auto';
            };
        } else {
            document.body.style.overflowY = 'auto';
        }
    }, [currentStep, mysteryLayout]);

    // Audio Highlighting Logic
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

    const getSentences = (text: string) => {
        if (!text) return [];
        return text.match(/[^.!?:]+([.!?:]+|\s*$)/g) || [text];
    };

    const renderTextWithHighlighting = (text: string, sentenceOffset: number = 0) => {
        if (!text) return text;
        if (!highlightingEnabled) return text;

        try {
            const sentences = getSentences(text);
            if (sentences && sentences.length > 0) {
                return sentences.map((sentence, idx) => (
                    <span key={idx} className={(idx + sentenceOffset) === highlightIndex ? "highlighted-sentence" : ""}>
                        {sentence}
                    </span>
                ));
            }
        } catch (error) {
            console.error('[Highlighting] Error splitting sentences:', error);
        }
        return text;
    };

    // Reset highlight when step changes
    useEffect(() => {
        setHighlightIndex(-1);
    }, [currentStep]);

    // Save highlighting preference
    useEffect(() => {
        localStorage.setItem('rosary_highlight_preference', JSON.stringify(userDisabledHighlighting));
    }, [userDisabledHighlighting]);

    // Track audio boundary events for highlighting
    useEffect(() => {
        if (!isPlaying) {
            setHighlightIndex(-1);
            return;
        }

        const isLitany = currentStep.type === 'litany_of_loreto';
        if (isLitany) return; // No highlighting for litanies

        const text = currentStep.text || '';
        const sanitizedText = sanitizeTextForSpeech(text);
        const sentences = getSentences(sanitizedText);
        const wordsPerSecond = 3.0 * 0.85;
        const timeouts: number[] = [];
        let cumulativeTime = 0;

        if (currentStep.type === 'decade_announcement') {
            const reflectionLabel = language === 'es' ? 'Reflexión' : 'Reflection';
            const titleWords = (currentStep.title || '').trim().split(/\s+/).length;
            const labelWords = reflectionLabel.split(/\s+/).length;
            const initialDelay = ((titleWords + labelWords) / wordsPerSecond) * 1000;
            cumulativeTime = initialDelay;
        }

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

    // Cleanup: Release wake lock
    useEffect(() => {
        return () => {
            wakeLockManager.release();
        };
    }, []);

    // Stop continuous mode when page hidden
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && continuousMode) {
                setContinuousMode(false);
                continuousModeRef.current = false;
                playbackIdRef.current++;
                stopAudio();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [continuousMode, stopAudio]);

    // Update language
    useEffect(() => {
        flowEngine.setLanguage(language);
        setCurrentStep(flowEngine.getCurrentStep());
    }, [language, flowEngine]);

    // Scroll to top when step changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (contentRef.current) {
                contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [currentStep]);

    // Save progress
    useEffect(() => {
        const progress = {
            mysteryType: currentMysterySet,
            currentStepIndex: flowEngine.getCurrentStepNumber() - 1,
            date: new Date().toISOString().split('T')[0],
            language
        };
        savePrayerProgress(progress);
    }, [currentStep, currentMysterySet, language, flowEngine]);



    // Get current educational data
    const currentData = language === 'es' ? educationalDataEs : educationalDataEn;

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
            const data = currentData.mysteries.find((item: any) =>
                item.mystery_name === targetName &&
                item.mystery_number === decadeInfo.number
            );
            return (data as EducationalContent) || null;
        }
        return currentData.global_intro as EducationalContent;
    };

    const currentEducationalData = getCurrentEducationalContent();
    const hasEducationalContent = !!currentEducationalData;

    const getAudioSegments = (step: any): { text: string; gender: 'female' | 'male' }[] => {
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
            return [{ text, gender: 'female' }];
        }

        if (step.type === 'litany_of_loreto' && step.litanyData) {
            const data = step.litanyData;
            const segments: { text: string; gender: 'female' | 'male'; rate?: number; postPause?: number }[] = [];
            [...data.initial_petitions].forEach((item: any) => {
                segments.push({ text: item.call, gender: 'female', rate: 1.0, postPause: 300 });
                segments.push({ text: item.response, gender: 'male', rate: 1.0 });
            });
            [...data.trinity_invocations, ...data.mary_invocations, ...data.agnus_dei].forEach((item: any) => {
                segments.push({ text: item.call, gender: 'female', rate: 1.0 });
                segments.push({ text: item.response, gender: 'male', rate: 1.0 });
            });
            return segments;
        }

        if (step.type === 'final_hail_mary_intro') {
            const parts = step.text.split('\n\n');
            if (parts.length > 1) {
                return createSegments(parts[0], parts[1]);
            }
            return [{ text: step.text, gender: 'female' }];
        }

        const text = step.text;
        if (step.title.includes('Our Father') || step.title.includes('Padre Nuestro')) {
            const splitPhrase = language === 'es' ? 'Danos hoy' : 'Give us this day';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }
        if (step.title.includes('Hail Mary') || step.title.includes('Ave María')) {
            const splitPhrase = language === 'es' ? 'Santa María' : 'Holy Mary';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }
        if (step.title.includes('Glory Be') || step.title.includes('Gloria')) {
            const splitPhrase = language === 'es' ? 'Como era' : 'As it was';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }
        if (step.title.includes('O My Jesus') || step.title.includes('Oh Jesús Mío')) {
            const splitPhrase = language === 'es' ? 'lleva al cielo' : 'and lead all souls';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }
        if (step.title.includes('Hail Holy Queen') || step.title.includes('La Salve')) {
            const splitPhrase = language === 'es' ? 'Ea, pues' : 'Turn then';
            const parts = text.split(splitPhrase);
            if (parts.length > 1) {
                return createSegments(parts[0], splitPhrase + parts.slice(1).join(splitPhrase));
            }
        }
        return [{ text: step.text, gender: 'female' }];
    };

    const continuousModeRef = useRef(continuousMode);
    useEffect(() => {
        continuousModeRef.current = continuousMode;
        return () => {
            continuousModeRef.current = false;
        };
    }, [continuousMode]);

    const playbackIdRef = useRef(0);

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
                    const progress = {
                        mysteryType: currentMysterySet,
                        currentStepIndex: flowEngine.getCurrentStepNumber() - 1,
                        date: new Date().toISOString().split('T')[0],
                        language
                    };
                    savePrayerProgress(progress);
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

    const handleResetCurrentMystery = () => {
        clearPrayerProgress(currentMysterySet);
        clearSession();
        onBack();
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
            if (!userDisabledHighlighting) {
                setHighlightingEnabled(true);
            }
            wakeLockManager.request().then(_wakeLockAcquired => {
                // Lock acquired or failed
            });
            playSequence(currentStep);
        }
    };

    // Auto-start continuous mode
    useEffect(() => {
        if (startWithContinuous && !continuousMode) {
            handleToggleContinuous();
        }
    }, [startWithContinuous]);

    // Get decade info for current step
    const decadeInfo = flowEngine.getCurrentDecadeInfo();

    // Get current decade title for header
    const getCurrentDecadeTitle = () => {
        if (currentStep.type === 'decade_announcement') {
            return currentStep.title;
        }
        const decadeInfo = flowEngine.getCurrentDecadeInfo();
        if (decadeInfo) {
            const getSpelledOrdinal = (num: number) => {
                const ordinals = language === 'es'
                    ? ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto']
                    : ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
                return ordinals[num - 1] || `${num}th`;
            };
            const mysteryWord = language === 'es' ? 'Misterio' : 'Mystery';
            return `${getSpelledOrdinal(decadeInfo.number)} ${mysteryWord}: ${decadeInfo.title}`;
        }
        return undefined;
    };

    // Bead counter info (currently unused but kept for future use)
    // const beadCount = currentStep.type === 'decade_hail_mary' && currentStep.hailMaryNumber ? 10 : 0;
    // const currentBead = currentStep.hailMaryNumber || 0;

    return (
        <div className={`mystery-screen-container ${!showPrayerText ? 'prayer-text-hidden' : ''}`}>
            {/* NEW: Use shared MysteryHeader component */}
            <MysteryHeader
                mysteryLayout={mysteryLayout}
                currentStepType={currentStep.type}
                userWantsTextHidden={userWantsTextHidden}
                setUserWantsTextHidden={setUserWantsTextHidden}
                onAudioToggle={handleToggleContinuous}
                isAudioPlaying={continuousMode || isPlaying}
                onSettingsClick={() => setShowSettings(true)}
                onLayoutToggle={() => {
                    const newLayout = mysteryLayout === 'classic' ? 'cinematic' : 'classic';
                    setMysteryLayout(newLayout);
                }}
                highlightingEnabled={highlightingEnabled}
                isPlaying={isPlaying}
                language={language}
                showToast={showToast}
                setUserDisabledHighlighting={setUserDisabledHighlighting}
                setHighlightingEnabled={setHighlightingEnabled}
                mysteryName={flowEngine.getMysteryName()}
                currentDecadeTitle={getCurrentDecadeTitle()}
                progress={flowEngine.getProgress()}
            />

            {/* NEW: Use shared ProgressBar component */}
            <ProgressBar progress={flowEngine.getProgress()} />

            <HighlightErrorBoundary>
                {/* NEW: ROUTER PATTERN - Switch between Classic and Cinematic views */}
                {mysteryLayout === 'cinematic' ? (
                    <CinematicMysteryView
                        currentStep={currentStep}
                        decadeInfo={decadeInfo}
                        showPrayerText={showPrayerText}
                        language={language}
                        renderTextWithHighlighting={renderTextWithHighlighting}
                        getSentences={getSentences}
                        spokenIndex={highlightIndex}
                    />
                ) : (
                    <div className="mystery-screen-content" ref={contentRef}>
                        <ClassicMysteryView
                            currentStep={currentStep}
                            decadeInfo={decadeInfo}
                            userWantsTextHidden={userWantsTextHidden}
                            language={language}
                            renderTextWithHighlighting={renderTextWithHighlighting}
                            getSentences={getSentences}
                            spokenIndex={highlightIndex}
                        />
                    </div>
                )}
            </HighlightErrorBoundary>

            {/* NEW: Use shared MysteryNavigation component */}
            <MysteryNavigation
                onHome={onBack}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onLearnMore={() => setShowLearnMore(true)}
                isFirstStep={flowEngine.isFirstStep()}
                isLastStep={flowEngine.isLastStep()}
                hasEducationalContent={hasEducationalContent}
                language={language}
            />

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

            {/* DEBUG: Opacity Sliders */}
            <DebugOpacitySlider
                baseOpacity={debugBaseOpacity}
                secondaryOpacity={debugSecondaryOpacity}
                onBaseOpacityChange={setDebugBaseOpacity}
                onSecondaryOpacityChange={setDebugSecondaryOpacity}
                visible={mysteryLayout === 'cinematic' && userWantsTextHidden}
            />

            {/* DEBUG: Dynamic CSS Override for Opacity */}
            {
                mysteryLayout === 'cinematic' && userWantsTextHidden && (
                    <style>{`
                    .cinematic-overlay,
                    .cinematic-overlay-darker {
                        background: linear-gradient(to bottom, 
                            rgba(0, 0, 0, ${debugBaseOpacity / 100}) 0%, 
                            rgba(0, 0, 0, ${(debugBaseOpacity - 15) / 100}) 30%, 
                            rgba(0, 0, 0, ${(debugBaseOpacity - 35) / 100}) 60%, 
                            rgba(0, 0, 0, ${debugSecondaryOpacity / 100}) 90%) !important;
                    }
                `}</style>
                )
            }
        </div>
    );
}

export default MysteryScreen;
