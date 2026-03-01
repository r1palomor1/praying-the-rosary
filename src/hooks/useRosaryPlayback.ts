import { useState, useRef, useCallback, useEffect } from 'react';
import { PrayerFlowEngine, type MysteryType } from '../utils/prayerFlowEngine';
import { useApp } from '../context/AppContext';
import { loadPrayerProgress, savePrayerProgress } from '../utils/storage';

interface UseRosaryPlaybackOptions {
    onComplete?: () => void;
    autoStart?: boolean;
}

export function useRosaryPlayback(mysteryType: MysteryType, options: UseRosaryPlaybackOptions = {}) {
    const { language, playAudio, stopAudio } = useApp();
    const { onComplete, autoStart = false } = options;

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(() => {
        // Load saved progress on init
        const saved = loadPrayerProgress(mysteryType);
        return saved?.currentStepIndex || 0;
    });
    const isPlayingRef = useRef(false);
    const playbackIdRef = useRef(0);

    // Create engine and update when language changes
    const engineRef = useRef(new PrayerFlowEngine(mysteryType, language));

    // Update engine when language changes
    useEffect(() => {
        engineRef.current = new PrayerFlowEngine(mysteryType, language);
        // Restore current position
        if (currentStepIndex > 0) {
            engineRef.current.jumpToStep(currentStepIndex);
        }
    }, [language, mysteryType, currentStepIndex]);

    // Get audio text for a step
    const getAudioText = useCallback((step: any): string => {
        if (!step || !step.text) return '';

        // For decade announcements, include title, reflection, fruit, and scripture
        if (step.type === 'decade_announcement') {
            const engine = engineRef.current;
            const decadeInfo = engine.getCurrentDecadeInfo();
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
            return text;
        }

        // For litany, build complete text from all invocations
        if (step.type === 'litany_of_loreto' && step.litanyData) {
            const data = step.litanyData;
            const parts: string[] = [];

            // Add all petitions and invocations
            [...data.initial_petitions].forEach((item: any) => {
                parts.push(`${item.call}. ${item.response}`);
            });

            [...data.trinity_invocations, ...data.mary_invocations, ...data.agnus_dei].forEach((item: any) => {
                parts.push(`${item.call}. ${item.response}`);
            });

            return parts.join('. ');
        }

        // For all other prayers, just use the text as-is
        // (We don't split into call/response for background playback - simpler)
        return step.text;
    }, [language]);

    // Save progress helper
    const saveProgress = useCallback((stepIndex: number) => {
        const progress = {
            mysteryType,
            currentStepIndex: stepIndex,
            date: new Date().toISOString().split('T')[0],
            language
        };
        savePrayerProgress(progress);
    }, [mysteryType, language]);

    // Recursive playback function
    const playSequence = useCallback((stepIndex: number) => {
        if (!isPlayingRef.current) return;

        const currentPlaybackId = playbackIdRef.current;
        const engine = engineRef.current;
        engine.jumpToStep(stepIndex);
        const step = engine.getCurrentStep();

        if (!step) {
            setIsPlaying(false);
            isPlayingRef.current = false;
            return;
        }

        setCurrentStepIndex(stepIndex);
        saveProgress(stepIndex); // Save progress at each step

        // Check if complete
        if (step.type === 'complete') {
            const completionText = language === 'es'
                ? 'Has completado el Santo Rosario. Que Dios te bendiga por tu fiel devoción.'
                : 'You have completed the Holy Rosary. May God bless you for your faithful devotion.';

            playAudio(completionText, () => {
                setIsPlaying(false);
                isPlayingRef.current = false;
                onComplete?.();
            });
            return;
        }

        const audioText = getAudioText(step);

        playAudio(audioText, () => {
            // Check if playback was cancelled
            if (playbackIdRef.current !== currentPlaybackId) return;
            if (!isPlayingRef.current) return;

            // Move to next step
            const nextStepIndex = stepIndex + 1;
            if (nextStepIndex < engine.getTotalSteps()) {
                setTimeout(() => {
                    playSequence(nextStepIndex);
                }, 500); // Small delay between prayers
            } else {
                setIsPlaying(false);
                isPlayingRef.current = false;
                onComplete?.();
            }
        });
    }, [playAudio, getAudioText, onComplete, saveProgress]);

    // Start playback
    const play = useCallback(() => {
        const engine = engineRef.current;
        engine.jumpToStep(currentStepIndex);
        const step = engine.getCurrentStep();

        // If already at completion step, just play the blessing
        if (step?.type === 'complete') {
            setIsPlaying(true);
            isPlayingRef.current = true;
            const completionText = language === 'es'
                ? 'Has completado el Santo Rosario. Que Dios te bendiga por tu fiel devoción.'
                : 'You have completed the Holy Rosary. May God bless you for your faithful devotion.';

            playAudio(completionText, () => {
                setIsPlaying(false);
                isPlayingRef.current = false;
                onComplete?.();
            });
            return;
        }

        setIsPlaying(true);
        isPlayingRef.current = true;
        playbackIdRef.current++;
        playSequence(currentStepIndex);
    }, [playSequence, currentStepIndex, playAudio, language, onComplete]);

    // Stop playback
    const stop = useCallback(() => {
        setIsPlaying(false);
        isPlayingRef.current = false;
        playbackIdRef.current++;
        saveProgress(currentStepIndex); // Save position when stopped
        stopAudio();
    }, [stopAudio, saveProgress, currentStepIndex]);

    // Auto-start if requested
    useEffect(() => {
        if (autoStart && !isPlaying) {
            play();
        }
    }, [autoStart]); // Only run on mount

    return {
        isPlaying,
        currentStepIndex,
        play,
        stop,
        engine: engineRef.current
    };
}
