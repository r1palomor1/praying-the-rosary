import { useState, useRef, useCallback, useEffect } from 'react';
import { SacredPrayerFlowEngine } from '../utils/SacredPrayerFlowEngine';
import { useApp } from '../context/AppContext';
import { loadPrayerProgress, savePrayerProgress, hasValidPrayerProgress } from '../utils/storage';

interface UseSacredPrayersPlaybackOptions {
    onComplete?: () => void;
    autoStart?: boolean;
}

const SACRED_MYSTERY_KEY = 'sacred_prayers';

export function useSacredPrayersPlayback(options: UseSacredPrayersPlaybackOptions = {}) {
    const { language, playAudio, stopAudio } = useApp();
    const { onComplete, autoStart = false } = options;

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(() => {
        // Load saved progress on init
        const saved = loadPrayerProgress(SACRED_MYSTERY_KEY);
        if (saved && hasValidPrayerProgress(SACRED_MYSTERY_KEY)) {
            return saved.currentStepIndex;
        }
        return 0;
    });
    const isPlayingRef = useRef(false);
    const playbackIdRef = useRef(0);

    // Create engine and update when language changes
    const engineRef = useRef(new SacredPrayerFlowEngine(language));

    // Update engine when language changes
    useEffect(() => {
        engineRef.current = new SacredPrayerFlowEngine(language);
        // Restore current position
        if (currentStepIndex > 0) {
            engineRef.current.jumpToStep(currentStepIndex);
        }
    }, [language, currentStepIndex]);

    // Wake Lock: Keep screen on during playback
    useEffect(() => {
        let wakeLock: any = null;

        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    // @ts-ignore - Navigator type might not include wakeLock yet
                    wakeLock = await navigator.wakeLock.request('screen');
                } catch (err) {
                    console.log('Wake Lock denied/error:', err);
                }
            }
        };

        if (isPlaying) {
            requestWakeLock();
        }

        return () => {
            if (wakeLock) {
                wakeLock.release().catch(console.error);
                wakeLock = null;
            }
        };
    }, [isPlaying]);

    // Get audio segments for a step (handle call/response prayers)
    const getAudioSegments = useCallback((step: any): { text: string; gender: 'female' | 'male' }[] => {
        if (!step || !step.text) return [{ text: '', gender: 'female' }];

        const text = step.text;

        // For prayers with call/response pattern
        const createSegments = (call: string, response: string) => [
            { text: call, gender: 'female' as const },
            { text: response, gender: 'male' as const }
        ];

        // Check for specific prayer types that have call/response
        const splitPhrases = [
            'Lord, have mercy on us.',
            'Señor, ten piedad de nosotros.',
            'Christ, have mercy on us.',
            'Cristo, ten piedad de nosotros.',
            'Holy Mary, pray for us.',
            'Santa María, ruega por nosotros.',
            'Let us pray.',
            'Oremos.'
        ];

        for (const phrase of splitPhrases) {
            if (text.includes(phrase)) {
                const parts = text.split(phrase);
                if (parts.length > 1) {
                    return createSegments(parts[0], phrase + parts.slice(1).join(phrase));
                }
            }
        }

        // Default: single female voice
        return [{ text: step.text, gender: 'female' }];
    }, []);

    // Save progress helper
    const saveProgress = useCallback((stepIndex: number) => {
        const progress = {
            mysteryType: SACRED_MYSTERY_KEY,
            currentStepIndex: stepIndex,
            date: new Date().toISOString().split('T')[0],
            language
        };
        savePrayerProgress(progress);
    }, [language]);

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
                ? 'Has completado las Oraciones Sagradas. Que Dios te bendiga por tu fiel devoción.'
                : 'You have completed the Sacred Prayers. May God bless you for your faithful devotion.';

            playAudio(completionText, () => {
                setIsPlaying(false);
                isPlayingRef.current = false;
                onComplete?.();
            });
            return;
        }

        const segments = getAudioSegments(step);

        playAudio(segments, () => {
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
    }, [playAudio, getAudioSegments, onComplete, saveProgress]);

    // Start playback
    const play = useCallback(() => {
        // ALWAYS reload progress from localStorage to get latest position
        // (in case user navigated to SacredPrayersScreen and advanced)
        const saved = loadPrayerProgress(SACRED_MYSTERY_KEY);
        const latestStepIndex = (saved && hasValidPrayerProgress(SACRED_MYSTERY_KEY)) ? saved.currentStepIndex : 0;
        setCurrentStepIndex(latestStepIndex);

        const engine = engineRef.current;
        engine.jumpToStep(latestStepIndex);
        const step = engine.getCurrentStep();

        // If already at completion step, just play the blessing
        if (step?.type === 'complete') {
            setIsPlaying(true);
            isPlayingRef.current = true;
            const completionText = language === 'es'
                ? 'Has completado las Oraciones Sagradas. Que Dios te bendiga por tu fiel devoción.'
                : 'You have completed the Sacred Prayers. May God bless you for your faithful devotion.';

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
        playSequence(latestStepIndex);
    }, [playSequence, playAudio, language, onComplete]);

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

    // Check if completed
    const isComplete = currentStepIndex >= engineRef.current.getTotalSteps() - 1;

    return {
        isPlaying,
        currentStepIndex,
        play,
        stop,
        isComplete,
        engine: engineRef.current
    };
}
