import { useState, useEffect } from 'react';
import { Moon, Sun, Volume2, VolumeX, Languages, Trash2, Gauge, Type, Layout } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { clearPrayerProgress } from '../utils/storage';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { language, setLanguage, theme, toggleTheme, audioEnabled, setAudioEnabled, volume, setVolume, speechRate, setSpeechRate, fontSize, setFontSize, mysteryLayout, setMysteryLayout } = useApp();
    const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Get browser voices
            const updateVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                setBrowserVoices(voices);
            };
            updateVoices();
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClearProgress = () => {
        console.log('[Clear Progress] Button clicked');
        const confirmed = window.confirm(language === 'es'
            ? '¿Estás seguro de que quieres borrar tu progreso de oración? La página se recargará.'
            : 'Are you sure you want to clear your prayer progress? The page will reload.');

        console.log('[Clear Progress] User confirmed:', confirmed);

        if (confirmed) {
            console.log('[Clear Progress] Clearing all prayer progress...');
            // Clear all prayer progress
            clearPrayerProgress();
            console.log('[Clear Progress] Progress cleared, reloading page...');
            // Reload the page to reset all state
            window.location.reload();
        } else {
            console.log('[Clear Progress] User cancelled');
        }
    };

    const translations = {
        en: {
            title: 'Settings',
            language: 'Language',
            theme: 'Theme',
            audio: 'Audio',
            volume: 'Volume',
            light: 'Light',
            dark: 'Dark',
            enabled: 'Enabled',
            disabled: 'Disabled',
            clearProgress: 'Clear Prayer Progress',
            close: 'Close',
            textSize: 'Text Size',
            normal: 'Normal',
            large: 'Large',
            extraLarge: 'Extra Large',
            mysteryLayout: 'Mystery Layout',
            classic: 'Classic',
            cinematic: 'Cinematic'
        },
        es: {
            title: 'Configuración',
            language: 'Idioma',
            theme: 'Tema',
            audio: 'Audio',
            volume: 'Volumen',
            light: 'Claro',
            dark: 'Oscuro',
            enabled: 'Activado',
            disabled: 'Desactivado',
            clearProgress: 'Borrar Progreso de Oración',
            close: 'Cerrar',
            textSize: 'Tamaño de Texto',
            normal: 'Normal',
            large: 'Grande',
            extraLarge: 'Extra Grande',
            mysteryLayout: 'Diseño de Misterios',
            classic: 'Clásico',
            cinematic: 'Cinematográfico'
        }
    };

    const t = translations[language];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="close-button-container">
                    <button className="btn btn-primary" onClick={onClose}>
                        {t.close}
                    </button>
                </div>
                <div className="modal-header modal-header-centered">
                    <h2>{t.title}</h2>
                </div>

                <div className="settings-section">
                    <div className="setting-item">
                        <div className="setting-label">
                            <Languages size={20} />
                            <span>{t.language}</span>
                        </div>
                        <div className="setting-control">
                            <button
                                className={`setting-btn ${language === 'en' ? 'active' : ''}`}
                                onClick={() => setLanguage('en')}
                            >
                                English
                            </button>
                            <button
                                className={`setting-btn ${language === 'es' ? 'active' : ''}`}
                                onClick={() => setLanguage('es')}
                            >
                                Español
                            </button>
                        </div>
                    </div>

                    <div className="setting-item">
                        <div className="setting-label">
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            <span>{t.theme}</span>
                        </div>
                        <div className="setting-control">
                            <button
                                className={`setting-btn ${theme === 'light' ? 'active' : ''}`}
                                onClick={toggleTheme}
                            >
                                {t.light}
                            </button>
                            <button
                                className={`setting-btn ${theme === 'dark' ? 'active' : ''}`}
                                onClick={toggleTheme}
                            >
                                {t.dark}
                            </button>
                        </div>
                    </div>

                    <div className="setting-item">
                        <div className="setting-label">
                            <Layout size={20} />
                            <span>{t.mysteryLayout}</span>
                        </div>
                        <div className="setting-control">
                            <button
                                className={`setting-btn ${mysteryLayout === 'classic' ? 'active' : ''}`}
                                onClick={() => setMysteryLayout('classic')}
                            >
                                {t.classic}
                            </button>
                            <button
                                className={`setting-btn ${mysteryLayout === 'cinematic' ? 'active' : ''}`}
                                onClick={() => setMysteryLayout('cinematic')}
                            >
                                {t.cinematic}
                            </button>
                        </div>
                    </div>

                    <div className="setting-item">
                        <div className="setting-label">
                            <Type size={20} />
                            <span>{t.textSize}</span>
                        </div>
                        <div className="setting-control">
                            <button
                                className={`setting-btn ${fontSize === 'normal' ? 'active' : ''}`}
                                onClick={() => setFontSize('normal')}
                            >
                                {t.normal}
                            </button>
                            <button
                                className={`setting-btn ${fontSize === 'large' ? 'active' : ''}`}
                                onClick={() => setFontSize('large')}
                            >
                                {t.large}
                            </button>
                            <button
                                className={`setting-btn ${fontSize === 'xl' ? 'active' : ''}`}
                                onClick={() => setFontSize('xl')}
                            >
                                {t.extraLarge}
                            </button>
                        </div>
                    </div>

                    <div className="setting-item">
                        <div className="setting-label">
                            <Trash2 size={20} />
                            <span>{t.clearProgress}</span>
                        </div>
                        <div className="setting-control">
                            <button
                                className="setting-btn danger"
                                onClick={handleClearProgress}
                            >
                                {t.clearProgress}
                            </button>
                        </div>
                    </div>

                    {audioEnabled && (
                        <>
                            <div className="setting-item">
                                <div className="setting-label">
                                    <Gauge size={20} />
                                    <span>{language === 'es' ? 'Velocidad' : 'Speed'}</span>
                                </div>
                                <div className="setting-control">
                                    <input
                                        type="range"
                                        min="50"
                                        max="150"
                                        step="5"
                                        value={speechRate * 100}
                                        onChange={(e) => setSpeechRate(parseInt(e.target.value) / 100)}
                                        aria-label={language === 'es' ? 'Velocidad' : 'Speed'}
                                        className="volume-slider"
                                    />
                                    <span className="volume-value">{Math.round(speechRate * 100)}%</span>
                                </div>
                            </div>

                            <div className="setting-item">
                                <div className="setting-label">
                                    <Volume2 size={20} />
                                    <span>{t.volume}</span>
                                </div>
                                <div className="setting-control">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume * 100}
                                        onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
                                        aria-label={t.volume}
                                        className="volume-slider"
                                    />
                                    <span className="volume-value">{Math.round(volume * 100)}%</span>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="setting-item">
                        <div className="setting-label">
                            {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            <span>{t.audio}</span>
                        </div>
                        <div className="setting-control">
                            <button
                                className={`setting-btn ${audioEnabled ? 'active' : ''}`}
                                onClick={() => setAudioEnabled(!audioEnabled)}
                            >
                                {audioEnabled ? t.enabled : t.disabled}
                            </button>
                        </div>
                    </div>
                </div>

                {/* TTS Engine Status */}
                <div className="setting-item tts-status-container">
                    <div className="setting-label tts-status-label">
                        <span className="tts-engine-title">TTS Engine:</span>
                        <span className="tts-engine-name">Web Speech API</span>
                        <span className="tts-engine-description">
                            Using browser's built-in voices
                        </span>
                        {browserVoices.length > 0 && (
                            <>
                                <span className="tts-voices-title">Active Voices:</span>
                                <div className="tts-voices-list">
                                    {browserVoices
                                        .filter((v: SpeechSynthesisVoice) => v.lang.startsWith(language === 'en' ? 'en' : 'es'))
                                        .slice(0, 3)
                                        .map((v: SpeechSynthesisVoice, i: number) => (
                                            <div key={i} className="tts-voice-item">
                                                • {v.name} ({v.lang})
                                            </div>
                                        ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
