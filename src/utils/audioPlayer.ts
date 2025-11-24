import type { Language } from '../types';

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
    speak(text: string): void {
        // Cancel any ongoing speech
        this.stop();

        this.utterance = new SpeechSynthesisUtterance(text);
        this.utterance.lang = this.language === 'en' ? 'en-US' : 'es-ES';
        this.utterance.volume = this.volume;
        this.utterance.rate = 0.85; // Slower for prayer (was 0.9)
        this.utterance.pitch = 1.0;

        // Select the best available voice
        const voices = this.synth.getVoices();
        const targetLang = this.language === 'en' ? 'en' : 'es';

        // Filter voices by language
        const languageVoices = voices.filter(voice =>
            voice.lang.startsWith(targetLang)
        );

        if (languageVoices.length > 0) {
            // Prioritize high-quality voices (in order of preference)
            const preferredVoice =
                // 1. Try Google voices (usually highest quality)
                languageVoices.find(v => v.name.toLowerCase().includes('google')) ||
                // 2. Try Premium/Enhanced voices
                languageVoices.find(v =>
                    v.name.toLowerCase().includes('premium') ||
                    v.name.toLowerCase().includes('enhanced')
                ) ||
                // 3. Try Neural voices
                languageVoices.find(v => v.name.toLowerCase().includes('neural')) ||
                // 4. Try natural-sounding voices
                languageVoices.find(v => v.name.toLowerCase().includes('natural')) ||
                // 5. For Spanish, prefer specific locales (Mexico, Spain)
                (targetLang === 'es' ? (
                    languageVoices.find(v => v.lang === 'es-MX') ||
                    languageVoices.find(v => v.lang === 'es-ES')
                ) : null) ||
                // 6. Fall back to first available voice for the language
                languageVoices[0];

            if (preferredVoice) {
                this.utterance.voice = preferredVoice;
                console.log(`Using voice: ${preferredVoice.name} (${preferredVoice.lang})`);
            }
        }

        // Handle end event
        if (this.onEndCallback) {
            this.utterance.onend = this.onEndCallback;
        }

        this.synth.speak(this.utterance);
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
