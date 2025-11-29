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
            this.utterance = new SpeechSynthesisUtterance(segment.text);
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

        // Try to find voice matching gender
        // Note: Voice names often contain "Female" or "Male", or specific names
        // This is a heuristic and depends on the OS/Browser
        const genderKeywords = gender === 'female'
            ? ['female', 'woman', 'girl', 'samantha', 'victoria', 'zira', 'google us english', 'google español']
            : ['male', 'man', 'boy', 'david', 'mark', 'google uk english male'];

        const genderVoice = languageVoices.find(v =>
            genderKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
        );

        if (genderVoice) return genderVoice;

        // Fallback strategies if specific gender not found

        // If we want female but didn't find one, try to avoid known male names
        if (gender === 'female') {
            const notMale = languageVoices.find(v =>
                !['male', 'man', 'david', 'mark'].some(k => v.name.toLowerCase().includes(k))
            );
            if (notMale) return notMale;
        }

        // If we want male, try to find one explicitly, otherwise fallback to any
        if (gender === 'male') {
            // If we couldn't find a "male" keyword, just pick a different voice than the default if possible?
            // Or just return the first available one that might be male-sounding?
            // For now, return the first one that isn't explicitly female if possible
            const notFemale = languageVoices.find(v =>
                !['female', 'woman', 'samantha', 'victoria'].some(k => v.name.toLowerCase().includes(k))
            );
            if (notFemale) return notFemale;
        }

        // Ultimate fallback
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
