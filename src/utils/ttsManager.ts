/**
 * Unified TTS Manager
 * Automatically uses Piper TTS when available, falls back to Web Speech API
 */

import type { Language } from '../types';
import * as piperTTS from './piperTTS';
import { sanitizeTextForSpeech } from './textSanitizer';

type TTSEngine = 'piper' | 'webspeech' | 'none';

interface TTSSegment {
    text: string;
    gender: 'female' | 'male';
    rate?: number;
}

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

    constructor() {
        this.synth = window.speechSynthesis;
        this.initializeTTS();
    }

    /**
     * Initialize TTS engines
     */
    private async initializeTTS() {
        // Try to initialize Piper TTS
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
        } else if (this.currentEngine === 'piper') {
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
        this.stop();

        // Determine which engine to use
        const usePiper = await this.isPiperReady();

        if (usePiper) {
            console.log('🎵 Using Piper TTS');
            await this.speakWithPiper();
        } else {
            console.log('🔊 Using Web Speech API');
            this.speakWithWebSpeech();
        }
    }

    /**
     * Speak using Piper TTS
     */
    private async speakWithPiper() {
        this.audioQueue = [];

        try {
            // Generate all audio segments
            for (const segment of this.segments) {
                const sanitized = sanitizeTextForSpeech(segment.text);
                const audioBlob = await piperTTS.generateSpeech(
                    sanitized,
                    this.language,
                    segment.gender
                );

                const audio = new Audio();
                audio.src = URL.createObjectURL(audioBlob);
                audio.volume = this.volume;

                // Adjust playback rate if specified
                if (segment.rate) {
                    audio.playbackRate = segment.rate;
                }

                this.audioQueue.push(audio);
            }

            // Play audio queue
            this.playNextPiperAudio();
        } catch (error) {
            console.error('Piper TTS failed, falling back to Web Speech:', error);
            this.speakWithWebSpeech();
        }
    }

    /**
     * Play next audio in Piper queue
     */
    private playNextPiperAudio() {
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
            this.currentSegmentIndex++;
            this.playNextPiperAudio();
        };

        audio.onerror = (error) => {
            console.error('Audio playback error:', error);
            this.currentSegmentIndex++;
            this.playNextPiperAudio();
        };

        audio.play().catch(error => {
            console.error('Failed to play audio:', error);
            this.currentSegmentIndex++;
            this.playNextPiperAudio();
        });
    }

    /**
     * Speak using Web Speech API (fallback)
     */
    private speakWithWebSpeech() {
        let currentIndex = 0;

        const speakNext = () => {
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
            let requestedGender = segment.gender;
            if (this.language === 'es') {
                requestedGender = segment.gender === 'female' ? 'male' : 'female';
            }

            const voice = this.getWebSpeechVoice(requestedGender);
            if (voice) {
                utterance.voice = voice;
            }

            utterance.onend = () => {
                currentIndex++;
                speakNext();
            };

            utterance.onerror = (error) => {
                console.error('Speech synthesis error:', error);
                currentIndex++;
                speakNext();
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
        this.synth.cancel();

        // Stop and clean up Piper audio
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
        } else if (this.currentEngine === 'piper' && this.audioQueue.length > 0) {
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
        } else if (this.currentEngine === 'piper' && this.audioQueue.length > 0) {
            const current = this.audioQueue[this.currentSegmentIndex];
            if (current) {
                current.play();
            }
        }
    }
}

// Export singleton instance
export const ttsManager = new UnifiedTTSManager();
