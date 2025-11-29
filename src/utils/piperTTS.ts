/**
 * Piper TTS Integration
 * Provides high-quality text-to-speech using Piper TTS Web
 * Falls back to Web Speech API if unavailable
 */

import type { Language } from '../types';

// Dynamic import to avoid issues if not supported
let piperTTS: any = null;
let piperSupported = false;

// Voice configurations
const VOICE_CONFIG = {
    en: {
        female: 'en_US-lessac-medium', // Natural female voice
        male: 'en_US-hfc_male-medium'   // Natural male voice
    },
    es: {
        female: 'es_ES-sharvard-medium', // Spanish female
        male: 'es_ES-davefx-medium'      // Spanish male
    }
};

/**
 * Initialize Piper TTS
 */
export async function initializePiper(): Promise<boolean> {
    try {
        // Check browser support
        if (!window.WebAssembly) {
            console.log('WebAssembly not supported, Piper TTS unavailable');
            return false;
        }

        // Dynamic import
        piperTTS = await import('@mintplex-labs/piper-tts-web');
        piperSupported = true;
        console.log('Piper TTS initialized successfully');
        return true;
    } catch (error) {
        console.warn('Piper TTS not available:', error);
        piperSupported = false;
        return false;
    }
}

/**
 * Check if Piper TTS is supported
 */
export function isPiperSupported(): boolean {
    return piperSupported && piperTTS !== null;
}

/**
 * Get list of downloaded voice models
 */
export async function getDownloadedVoices(): Promise<string[]> {
    if (!isPiperSupported()) return [];

    try {
        return await piperTTS.stored();
    } catch (error) {
        console.error('Error checking stored voices:', error);
        return [];
    }
}

/**
 * Check if required voices are downloaded for a language
 */
export async function hasVoicesForLanguage(language: Language): Promise<boolean> {
    const downloaded = await getDownloadedVoices();
    const config = VOICE_CONFIG[language];

    return downloaded.includes(config.female) && downloaded.includes(config.male);
}

/**
 * Download voice models for a language
 */
export async function downloadVoices(
    language: Language,
    onProgress?: (progress: { url: string; loaded: number; total: number }) => void
): Promise<void> {
    if (!isPiperSupported()) {
        throw new Error('Piper TTS not supported');
    }

    const config = VOICE_CONFIG[language];

    // Download female voice
    await piperTTS.download(config.female, onProgress);

    // Download male voice
    await piperTTS.download(config.male, onProgress);
}

/**
 * Generate speech using Piper TTS
 */
export async function generateSpeech(
    text: string,
    language: Language,
    gender: 'female' | 'male'
): Promise<Blob> {
    if (!isPiperSupported()) {
        throw new Error('Piper TTS not supported');
    }

    const voiceId = VOICE_CONFIG[language][gender];

    try {
        const wav = await piperTTS.predict({
            text,
            voiceId
        });

        return wav;
    } catch (error) {
        console.error('Piper TTS generation failed:', error);
        throw error;
    }
}

/**
 * Remove downloaded voices for a language
 */
export async function removeVoices(language: Language): Promise<void> {
    if (!isPiperSupported()) return;

    const config = VOICE_CONFIG[language];

    try {
        await piperTTS.remove(config.female);
        await piperTTS.remove(config.male);
    } catch (error) {
        console.error('Error removing voices:', error);
    }
}

/**
 * Get all available voices
 */
export async function getAvailableVoices(): Promise<Record<string, any>> {
    if (!isPiperSupported()) return {};

    try {
        return await piperTTS.voices();
    } catch (error) {
        console.error('Error getting available voices:', error);
        return {};
    }
}

/**
 * Get download size estimate for a language
 */
export function getDownloadSize(language: Language): number {
    // Approximate sizes in MB
    const sizes = {
        en: 35, // ~35MB for both English voices
        es: 30  // ~30MB for both Spanish voices
    };

    return sizes[language];
}
