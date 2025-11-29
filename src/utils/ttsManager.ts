import type { Language } from '../types';
import * as piperTTS from './piperTTS';
import { generateSpeechSherpa } from './sherpaTTS';
import { sanitizeTextForSpeech } from './textSanitizer';

type TTSEngine = 'piper' | 'sherpa' | 'webspeech' | 'none';

interface TTSSegment {
    text: string;
    gender: 'female' | 'male';
    rate?: number;
}

// Simple mobile detection
const isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

class UnifiedTTSManager {
    private currentEngine: TTSEngine = 'none';
    private language: Language = 'en';
    private volume: number = 0.8;
    private synth: SpeechSynthesis;
    private piperInitialized: boolean = false;
    private audioQueue: HTMLAudioElement[] = [];
    private currentSegmentIndex: number = 0;
    private segments: TTSSegment[] = [];
    private onEndCallback?: () => void;
    private playbackId: number = 0;

    constructor() {
        this.synth = window.speechSynthesis;
        this.initializeTTS();
    }

    /**
     * Initialize TTS engines
     */
    private async initializeTTS() {
        // Mobile: Default to Sherpa (will init on first use)
        if (isMobile()) {
            this.currentEngine = 'sherpa';
            console.log('📱 Mobile detected: Using Sherpa TTS');
            return;
        }

        // Desktop: Try Piper
        const piperAvailable = await piperTTS.initializePiper();

        if (piperAvailable) {
            this.piperInitialized = true;
            console.log('✓ Piper TTS available');

            // Check if voices are downloaded for current language
            const hasVoices = await piperTTS.hasVoicesForLanguage(this.language);
            this.currentEngine = hasVoices ? 'piper' : 'webspeech';
        } else {
            this.currentEngine = 'webspeech';
            console.log('→ Using Web Speech API');
        }
    }

    /**
     * Set language
     */
    async setLanguage(language: Language) {
        this.language = language;

        if (isMobile()) {
            this.currentEngine = 'sherpa';
            return;
        }

        // Check if we should switch engines
        if (this.piperInitialized) {
            const hasVoices = await piperTTS.hasVoicesForLanguage(language);
            this.currentEngine = hasVoices ? 'piper' : 'webspeech';
        }
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
     * Check if Piper is available and ready
     */
    async isPiperReady(): Promise<boolean> {
        if (isMobile()) return false; // Never use Piper on mobile
        if (!this.piperInitialized) return false;
        return await piperTTS.hasVoicesForLanguage(this.language);
    }

    /**
     * Get current engine
     */
    getCurrentEngine(): TTSEngine {
        return this.currentEngine;
    }

    /**
     * Check if currently speaking
     */
    isSpeaking(): boolean {
        if (this.currentEngine === 'webspeech') {
            return this.synth.speaking;
        } else if (this.currentEngine === 'piper' || this.currentEngine === 'sherpa') {
            return this.audioQueue.length > 0 && !this.audioQueue[this.currentSegmentIndex]?.paused;
        }
        return false;
    }

    /**
     * Speak segments with automatic engine selection
     */
    async speakSegments(segments: TTSSegment[]): Promise<void> {
        this.segments = segments;
        this.currentSegmentIndex = 0;

        // Stop previous playback and increment ID to invalidate any pending async operations
        this.stop();
        const currentId = this.playbackId;

        // Check if we were stopped/cancelled during the await
        if (this.playbackId !== currentId) return;

        if (isMobile()) {
            console.log('📱 Using Sherpa TTS (Mobile)');
            await this.speakWithSherpa(currentId);
        } else {
            const usePiper = await this.isPiperReady();
            if (usePiper) {
                console.log('🎵 Using Piper TTS');
                await this.speakWithPiper(currentId);
            } else {
                console.log('🔊 Using Web Speech API');
                this.speakWithWebSpeech(currentId);
            }
        }
    }

    /**
     * Speak using Sherpa TTS (Mobile)
     */
    private async speakWithSherpa(playbackId: number) {
        this.audioQueue = [];

        try {
            // Generate all audio segments
            for (const segment of this.segments) {
                if (this.playbackId !== playbackId) return;

                const sanitized = sanitizeTextForSpeech(segment.text);
                console.log(`[TTS Manager] Generating Sherpa audio for: "${segment.text.substring(0, 20)}..." | Gender: ${segment.gender}`);
                const audioBlob = await generateSpeechSherpa(sanitized, this.language, segment.gender);

                if (this.playbackId !== playbackId) return;

                if (!audioBlob) {
                    throw new Error('Sherpa generation returned null');
                }

                const audio = new Audio();
                audio.src = URL.createObjectURL(audioBlob);
                audio.volume = this.volume;
                if (segment.rate) audio.playbackRate = segment.rate;

                this.audioQueue.push(audio);
            }

            if (this.playbackId !== playbackId) return;
            this.playNextAudio(playbackId);

        } catch (error) {
            console.error('Sherpa TTS failed, falling back to Web Speech:', error);
            if (this.playbackId === playbackId) {
                this.speakWithWebSpeech(playbackId);
            }
        }
    }

    /**
     * Speak using Piper TTS
     */
    private async speakWithPiper(playbackId: number) {
        this.audioQueue = [];

        try {
            // Generate all audio segments
            for (const segment of this.segments) {
                // Check cancellation before expensive operation
                if (this.playbackId !== playbackId) return;

                const sanitized = sanitizeTextForSpeech(segment.text);
                const audioBlob = await piperTTS.generateSpeech(
                    sanitized,
                    this.language,
                    segment.gender
                );

                // Check cancellation after await
                if (this.playbackId !== playbackId) return;

                const audio = new Audio();
                audio.src = URL.createObjectURL(audioBlob);
                audio.volume = this.volume;

                // Adjust playback rate if specified
                if (segment.rate) {
                    audio.playbackRate = segment.rate;
                }

                this.audioQueue.push(audio);
            }

            // Check cancellation before playing
            if (this.playbackId !== playbackId) return;

            // Play audio queue
            this.playNextAudio(playbackId);
        } catch (error) {
            console.error('Piper TTS failed, falling back to Web Speech:', error);

            // Disable Piper for future attempts if it fails critically
            // This prevents repeated delays and "interrupted" errors
            this.piperInitialized = false;
            this.currentEngine = 'webspeech';

            // Only fallback if we haven't been cancelled
            if (this.playbackId === playbackId) {
                this.speakWithWebSpeech(playbackId);
            }
        }
    }

    /**
     * Play next audio in queue (Shared for Piper and Sherpa)
     */
    private playNextAudio(playbackId: number) {
        // Check cancellation
        if (this.playbackId !== playbackId) return;

        if (this.currentSegmentIndex >= this.audioQueue.length) {
            if (this.onEndCallback) {
                this.onEndCallback();
            }
            // Clean up audio URLs
            this.audioQueue.forEach(audio => URL.revokeObjectURL(audio.src));
            this.audioQueue = [];
            return;
        }

        const audio = this.audioQueue[this.currentSegmentIndex];

        audio.onended = () => {
            if (this.playbackId === playbackId) {
                this.currentSegmentIndex++;
                this.playNextAudio(playbackId);
            }
        };

        audio.onerror = (error) => {
            console.error('Audio playback error:', error);
            if (this.playbackId === playbackId) {
                this.currentSegmentIndex++;
                this.playNextAudio(playbackId);
            }
        };

        audio.play().catch(error => {
            console.error('Failed to play audio:', error);
            if (this.playbackId === playbackId) {
                this.currentSegmentIndex++;
                this.playNextAudio(playbackId);
            }
        });
    }

    /**
     * Speak using Web Speech API (fallback)
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
            utterance.lang = this.language === 'en' ? 'en-US' : 'es-ES';
            utterance.volume = this.volume;
            utterance.rate = segment.rate || 0.85;
            utterance.pitch = 1.0;

            // Apply Spanish voice gender correction
            // Removed: User reported "all male" issues, likely due to this swap or voice availability.
            // Trusting the requested gender is safer for fallback.
            const requestedGender = segment.gender;

            const voice = this.getWebSpeechVoice(requestedGender);
            if (voice) {
                utterance.voice = voice;
            }

            utterance.onend = () => {
                if (this.playbackId === playbackId) {
                    currentIndex++;
                    speakNext();
                }
            };

            utterance.onerror = (error) => {
                console.error('Speech synthesis error:', error);
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

        // Stop and clean up Piper/Sherpa audio
        this.audioQueue.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            URL.revokeObjectURL(audio.src);
        });
        this.audioQueue = [];
        this.currentSegmentIndex = 0;
    }

    /**
     * Pause audio (Web Speech only)
     */
    pause() {
        if (this.currentEngine === 'webspeech' && this.synth.speaking) {
            this.synth.pause();
        } else if ((this.currentEngine === 'piper' || this.currentEngine === 'sherpa') && this.audioQueue.length > 0) {
            const current = this.audioQueue[this.currentSegmentIndex];
            if (current) {
                current.pause();
            }
        }
    }

    /**
     * Resume audio (Web Speech only)
     */
    resume() {
        if (this.currentEngine === 'webspeech' && this.synth.paused) {
            this.synth.resume();
        } else if ((this.currentEngine === 'piper' || this.currentEngine === 'sherpa') && this.audioQueue.length > 0) {
            const current = this.audioQueue[this.currentSegmentIndex];
            if (current) {
                current.play();
            }
        }
    }
}

// Export singleton instance
export const ttsManager = new UnifiedTTSManager();
