
/**
 * Sherpa ONNX TTS Integration
 * Lightweight WASM-based TTS for Mobile
 */

import type { Language } from '../types';

// Configuration for models located in public/sherpa/
const CONFIG = {
    en: {
        female: {
            model: '/sherpa/en_US-amy-low.onnx',
            config: '/sherpa/en_US-amy-low.onnx.json',
            tokens: '/sherpa/tokens.txt',
        },
        male: {
            model: '/sherpa/en_US-ryan-medium.onnx',
            config: '/sherpa/en_US-ryan-medium.onnx.json',
            tokens: '/sherpa/tokens_male_en.txt',
        }
    },
    es: {
        female: {
            model: '/sherpa/es_ES-sharvard-medium.onnx',
            config: '/sherpa/es_ES-sharvard-medium.onnx.json',
            tokens: '/sherpa/es_tokens.txt',
        },
        male: {
            model: '/sherpa/es_ES-davefx-medium.onnx',
            config: '/sherpa/es_ES-davefx-medium.onnx.json',
            tokens: '/sherpa/tokens_male_es.txt',
        }
    }
};

let sherpaModule: any = null;
let ttsEngine: any = null;
let currentLanguage: Language | null = null;
let currentGender: 'female' | 'male' | null = null;
let isInitializing = false;
let lastError: string | null = null;

export function getSherpaError(): string | null {
    return lastError;
}

// Helper to load external script
function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
    });
}

export async function initSherpa(language: Language, gender: 'female' | 'male' = 'female'): Promise<boolean> {
    if (ttsEngine && currentLanguage === language && currentGender === gender) return true;
    if (isInitializing) return false; // Prevent race conditions

    isInitializing = true;
    lastError = null;
    console.log(`Initializing Sherpa TTS for ${language} (${gender})...`);

    try {
        // 1. Load the WASM loader script
        await loadScript('/sherpa/sherpa-onnx-wasm-main-tts.js');

        // 2. Wait for Module to be ready (Emscripten pattern)
        // @ts-ignore
        if (!window.Module) {
            // @ts-ignore
            window.Module = {};
        }

        // @ts-ignore
        const Module = window.Module;

        // 3. Initialize if not already done
        if (!sherpaModule) {
            sherpaModule = await new Promise((resolve) => {
                Module.onRuntimeInitialized = () => {
                    resolve(Module);
                };
                // Trigger WASM load if it hasn't started
                if (Module.calledRun) {
                    resolve(Module);
                }
            });
        }

        // 4. Free previous engine if exists
        if (ttsEngine) {
            try {
                ttsEngine.delete();
                ttsEngine = null;
            } catch (e) {
                console.warn('Failed to cleanup old Sherpa engine', e);
            }
        }

        // 5. Initialize TTS Engine with Model
        const config = CONFIG[language][gender];

        // We need to fetch the files and pass them to the WASM filesystem
        // Emscripten FS handling
        const fetchAndWrite = async (url: string, filename: string) => {
            console.log(`[Sherpa] Fetching ${url}...`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
            }
            const buffer = await response.arrayBuffer();
            sherpaModule.FS.writeFile(filename, new Uint8Array(buffer));
            console.log(`[Sherpa] Wrote ${filename} to WASM FS`);
            return filename;
        };

        console.log('Downloading Sherpa models...');
        await Promise.all([
            fetchAndWrite(config.model, 'model.onnx'),
            fetchAndWrite(config.config, 'model.json'),
            fetchAndWrite(config.tokens, 'tokens.txt')
        ]);

        console.log('Creating OfflineTts...');
        // Create the engine instance
        const offlineTtsConfig = {
            model: {
                vits: {
                    model: 'model.onnx',
                    lexicon: '',
                    tokens: 'tokens.txt',
                    dataDir: '',
                    noiseScale: 0.667,
                    noiseScaleW: 0.8,
                    lengthScale: 1.0,
                },
                provider: 'cpu',
                debug: 0,
                numThreads: 1,
            },
            ruleFsts: '',
            maxNumSentences: 1,
        };

        ttsEngine = new sherpaModule.OfflineTts(offlineTtsConfig);

        currentLanguage = language;
        currentGender = gender;
        isInitializing = false;
        console.log('Sherpa TTS Initialized!');
        return true;

    } catch (error: any) {
        console.error('Sherpa TTS Initialization failed:', error);
        lastError = error.message || String(error);
        isInitializing = false;
        return false;
    }
}

export async function generateSpeechSherpa(text: string, language: Language, gender: 'female' | 'male' = 'female'): Promise<Blob | null> {
    try {
        console.log(`[Sherpa] Request: ${language} (${gender}) | Current: ${currentLanguage} (${currentGender})`);

        if (!ttsEngine || currentLanguage !== language || currentGender !== gender) {
            console.log('[Sherpa] Switching engine...');
            const success = await initSherpa(language, gender);
            if (!success) throw new Error('Could not init Sherpa');
        }

        // Generate audio
        // The API usually returns an object with .samples (Float32Array) and .sampleRate
        const audio = ttsEngine.generate({
            text: text,
            sid: 0,
            speed: 1.0,
        });

        if (!audio || !audio.samples) {
            throw new Error('No audio generated');
        }

        // Convert Float32Array to WAV Blob
        return encodeWAV(audio.samples, audio.sampleRate);

    } catch (error) {
        console.error('Sherpa generation failed:', error);
        return null;
    }
}

// Helper to convert Float32Array to WAV Blob
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
}
