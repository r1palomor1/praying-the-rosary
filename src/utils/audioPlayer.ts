import type { Language } from '../types';
import { sanitizeTextForSpeech } from './textSanitizer';

interface AudioPlayerOptions {
    language: Language;
    volume: number;
    onEnd?: () => void;
}

class AudioPlayer {
    private synth: SpeechSynthesis;
    private utterance: SpeechSynthesisUtterance | null = null;
    private language: Language;
    private volume: number;
    private onEndCallback?: () => void;

    constructor() {
        this.synth = window.speechSynthesis;
        this.language = 'en';
        this.volume = 0.8;
    }

    /**
     * Configure audio player
     */
    configure(options: AudioPlayerOptions): void {
        this.language = options.language;
        this.volume = options.volume;
        this.onEndCallback = options.onEnd;
    }

    /**
     * Speak text using Web Speech API
     */
    speak(text: string, gender: 'female' | 'male' = 'female'): void {
        this.speakSegments([{ text, gender }]);
    }

    /**
     * Speak a sequence of segments with different voices
     */
    speakSegments(segments: { text: string; gender: 'female' | 'male'; rate?: number }[]): void {
        // Cancel any ongoing speech
        this.stop();

        let currentIndex = 0;

        const speakNext = () => {
            if (currentIndex >= segments.length) {
                if (this.onEndCallback) {
                    this.onEndCallback();
                }
                return;
            }

            const segment = segments[currentIndex];
            // Sanitize text to remove inverted punctuation marks that TTS might mispronounce
            const sanitizedText = sanitizeTextForSpeech(segment.text);
            this.utterance = new SpeechSynthesisUtterance(sanitizedText);
            this.utterance.lang = this.language === 'en' ? 'en-US' : 'es-ES';
            this.utterance.volume = this.volume;
            this.utterance.rate = segment.rate || 0.85;
            this.utterance.pitch = 1.0;

            // Select voice based on gender
            const voice = this.getVoice(segment.gender);
            if (voice) {
                this.utterance.voice = voice;
                console.log(`Using voice for ${segment.gender}: ${voice.name}`);
            }

            this.utterance.onend = () => {
                currentIndex++;
                speakNext();
            };

            this.synth.speak(this.utterance);
        };

        speakNext();
    }

    private getVoice(gender: 'female' | 'male'): SpeechSynthesisVoice | null {
        const voices = this.synth.getVoices();
        const targetLang = this.language === 'en' ? 'en' : 'es';

        // Filter by language
        const languageVoices = voices.filter(voice =>
            voice.lang.startsWith(targetLang)
        );

        if (languageVoices.length === 0) return null;

        // Comprehensive gender keywords for both English and Spanish voices
        // Includes common voice names across Windows, macOS, iOS, Android, and Chrome
        const femaleKeywords = [
            'female', 'woman', 'girl', 'femenino', 'mujer',
            // English female names
            'samantha', 'victoria', 'zira', 'susan', 'karen', 'moira', 'tessa', 'fiona',
            // Spanish female names
            'monica', 'paulina', 'sabina', 'carmen', 'lucia', 'isabel', 'elena',
            // Google voices
            'google us english', 'google español', 'google español de estados unidos'
        ];

        const maleKeywords = [
            'male', 'man', 'boy', 'masculino', 'hombre',
            // English male names
            'david', 'mark', 'daniel', 'alex', 'tom', 'james', 'george',
            // Spanish male names
            'diego', 'jorge', 'juan', 'carlos', 'miguel', 'andres', 'emilio',
            // Google voices
            'google uk english male'
        ];

        const keywords = gender === 'female' ? femaleKeywords : maleKeywords;
        const oppositeKeywords = gender === 'female' ? maleKeywords : femaleKeywords;

        // First try: Find exact gender match
        const genderVoice = languageVoices.find(v =>
            keywords.some(keyword => v.name.toLowerCase().includes(keyword))
        );

        if (genderVoice) {
            console.log(`Found ${gender} voice: ${genderVoice.name}`);
            return genderVoice;
        }

        // Second try: Find voice that doesn't match opposite gender
        const notOppositeGender = languageVoices.find(v =>
            !oppositeKeywords.some(k => v.name.toLowerCase().includes(k))
        );

        if (notOppositeGender) {
            console.log(`Using neutral voice for ${gender}: ${notOppositeGender.name}`);
            return notOppositeGender;
        }

        // Third try: If we have multiple voices, alternate between them
        if (languageVoices.length > 1) {
            const voiceIndex = gender === 'female' ? 0 : 1;
            console.log(`Using alternating voice for ${gender}: ${languageVoices[voiceIndex].name}`);
            return languageVoices[voiceIndex];
        }

        // Ultimate fallback: return first available voice
        console.log(`Using fallback voice for ${gender}: ${languageVoices[0].name}`);
        return languageVoices[0];
    }

    /**
     * Pause speech
     */
    pause(): void {
        if (this.synth.speaking) {
            this.synth.pause();
        }
    }

    /**
     * Resume speech
     */
    resume(): void {
        if (this.synth.paused) {
            this.synth.resume();
        }
    }

    /**
     * Stop speech
     */
    stop(): void {
        this.synth.cancel();
        // Clear utterance to prevent zombie events
        this.utterance = null;
    }

    /**
     * Check if currently speaking
     */
    isSpeaking(): boolean {
        return this.synth.speaking;
    }

    /**
     * Check if paused
     */
    isPaused(): boolean {
        return this.synth.paused;
    }

    /**
     * Set volume
     */
    setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.utterance) {
            this.utterance.volume = this.volume;
        }
    }
}

// Export singleton instance
export const audioPlayer = new AudioPlayer();
