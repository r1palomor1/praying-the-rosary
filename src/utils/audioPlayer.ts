import type { Language } from '../types';
import { ttsManager } from './ttsManager';

interface AudioPlayerOptions {
    language: Language;
    volume: number;
    onEnd?: () => void;
}

class AudioPlayer {
    constructor() {
        // Initialize TTS manager on construction
    }

    /**
     * Configure audio player
     */
    configure(options: AudioPlayerOptions): void {
        // Update TTS manager
        ttsManager.setLanguage(options.language);
        ttsManager.setVolume(options.volume);
        if (options.onEnd) {
            ttsManager.setOnEnd(options.onEnd);
        }
    }

    /**
     * Speak simple text
     */
    speak(text: string): void {
        // Convert to segment format
        this.speakSegments([{ text, gender: 'female', rate: 0.85 }]);
    }

    /**
     * Speak a sequence of segments with different voices
     */
    async speakSegments(segments: { text: string; gender: 'female' | 'male'; rate?: number }[]): Promise<void> {
        await ttsManager.speakSegments(segments);
    }

    /**
     * Stop speech
     */
    stop(): void {
        ttsManager.stop();
    }

    /**
     * Pause speech
     */
    pause(): void {
        ttsManager.pause();
    }

    /**
     * Resume speech
     */
    resume(): void {
        ttsManager.resume();
    }

    /**
     * Check if Piper TTS is ready
     */
    async isPiperReady(): Promise<boolean> {
        return await ttsManager.isPiperReady();
    }

    /**
     * Get current TTS engine
     */
    getCurrentEngine(): string {
        return ttsManager.getCurrentEngine();
    }

    /**
     * Set volume
     */
    setVolume(volume: number): void {
        ttsManager.setVolume(volume);
    }

    /**
     * Check if paused (for Web Speech API compatibility)
     */
    isPaused(): boolean {
        return !ttsManager.isSpeaking();
    }
}

// Export singleton instance
export const audioPlayer = new AudioPlayer();
