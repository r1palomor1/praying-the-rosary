import type { Language } from '../types';
import { sanitizeTextForSpeech } from './textSanitizer';

interface TTSSegment {
    text: string;
    gender: 'female' | 'male';
    rate?: number;
    postPause?: number;
    onStart?: () => void;
}

class UnifiedTTSManager {
    private language: Language = 'en';
    private volume: number = 0.8;
    private synth: SpeechSynthesis;
    private onEndCallback?: () => void;
    private onBoundaryCallback?: (event: SpeechSynthesisEvent) => void;
    private playbackId: number = 0;
    private segments: TTSSegment[] = [];
    private activeUtterance: SpeechSynthesisUtterance | null = null;

    // Getter to satisfy linter and potentially for debugging
    get activeUtteranceRef() {
        return this.activeUtterance;
    }

    constructor() {
        this.synth = window.speechSynthesis;
    }

    /**
     * Set language
     */
    async setLanguage(language: Language) {
        this.language = language;
    }

    /**
     * Set volume
     */
    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Set end callback
     */
    setOnEnd(callback: () => void) {
        this.onEndCallback = callback;
    }

    /**
     * Set boundary callback
     */
    setOnBoundary(callback: (event: SpeechSynthesisEvent) => void) {
        this.onBoundaryCallback = callback;
    }

    /**
     * Get current engine (always Web Speech API now)
     */
    getCurrentEngine(): 'webspeech' {
        return 'webspeech';
    }

    /**
     * Check if currently speaking
     */
    isSpeaking(): boolean {
        return this.synth.speaking;
    }

    /**
     * Speak segments using Web Speech API
     */
    async speakSegments(segments: TTSSegment[]): Promise<void> {
        this.segments = segments;

        // Stop previous playback and increment ID to invalidate any pending async operations
        this.stop();
        const currentId = this.playbackId;

        this.speakWithWebSpeech(currentId);
    }

    /**
     * Speak using Web Speech API
     */
    private speakWithWebSpeech(playbackId: number) {
        let currentIndex = 0;

        const speakNext = () => {
            // Check cancellation
            if (this.playbackId !== playbackId) return;

            if (currentIndex >= this.segments.length) {
                if (this.onEndCallback) {
                    this.onEndCallback();
                }
                return;
            }

            const segment = this.segments[currentIndex];
            const sanitized = sanitizeTextForSpeech(segment.text);

            const utterance = new SpeechSynthesisUtterance(sanitized);
            this.activeUtterance = utterance; // Prevent GC
            utterance.lang = this.language === 'en' ? 'en-US' : 'es-ES';
            utterance.volume = this.volume;
            utterance.rate = segment.rate || 0.85;
            utterance.pitch = 1.0;

            const voice = this.getWebSpeechVoice(segment.gender);
            if (voice) {
                utterance.voice = voice;
            }

            utterance.onstart = () => {
                // Call segment-specific onStart callback if provided
                if (this.playbackId === playbackId && segment.onStart) {
                    segment.onStart();
                }
            };

            utterance.onboundary = (event) => {
                if (this.playbackId === playbackId && this.onBoundaryCallback) {
                    this.onBoundaryCallback(event);
                }
            };

            utterance.onend = () => {
                if (this.playbackId === playbackId) {
                    const nextStep = () => {
                        currentIndex++;
                        speakNext();
                    };

                    // Handle programmable pause after this segment
                    if (segment.postPause && segment.postPause > 0) {
                        setTimeout(nextStep, segment.postPause);
                    } else {
                        nextStep();
                    }
                }
            };

            utterance.onerror = (event) => {
                // Ignore interruption errors (caused by stop/cancel)
                if (event.error === 'interrupted' || event.error === 'canceled') {
                    return;
                }
                console.error('Speech synthesis error:', event);
                if (this.playbackId === playbackId) {
                    currentIndex++;
                    speakNext();
                }
            };

            this.synth.speak(utterance);
        };

        speakNext();
    }

    /**
     * Get Web Speech API voice
     */
    private getWebSpeechVoice(gender: 'female' | 'male'): SpeechSynthesisVoice | null {
        const voices = this.synth.getVoices();
        const targetLang = this.language === 'en' ? 'en' : 'es';
        const languageVoices = voices.filter(v => v.lang.startsWith(targetLang));

        if (languageVoices.length === 0) return null;

        const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'monica', 'lucia'];
        const maleKeywords = ['male', 'man', 'david', 'daniel', 'diego', 'jorge'];
        const keywords = gender === 'female' ? femaleKeywords : maleKeywords;

        const match = languageVoices.find(v =>
            keywords.some(k => v.name.toLowerCase().includes(k))
        );

        return match || languageVoices[0];
    }

    /**
     * Stop all audio
     */
    stop() {
        // Increment playback ID to invalidate any pending operations
        this.playbackId++;
        this.synth.cancel();
        this.activeUtterance = null;
    }

    /**
     * Pause audio
     */
    pause() {
        if (this.synth.speaking) {
            this.synth.pause();
        }
    }

    /**
     * Resume audio
     */
    resume() {
        if (this.synth.paused) {
            this.synth.resume();
        }
    }
}

// Export singleton instance
export const ttsManager = new UnifiedTTSManager();
