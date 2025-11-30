import { useState, useEffect } from 'react';
import { Moon, Sun, Volume2, VolumeX, Languages, Trash2, Gauge, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { clearPrayerProgress } from '../utils/storage';
import { getSherpaError, getSherpaState } from '../utils/sherpaTTS';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { language, setLanguage, theme, toggleTheme, audioEnabled, setAudioEnabled, volume, setVolume, speechRate, setSpeechRate, currentEngine } = useApp();
    const [sherpaState, setSherpaState] = useState(getSherpaState());

    useEffect(() => {
        if (isOpen) {
            setSherpaState(getSherpaState());
            const interval = setInterval(() => {
                setSherpaState(getSherpaState());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClearProgress = () => {
        if (confirm(language === 'es'
            ? '¿Estás seguro de que quieres borrar tu progreso de oración?'
            : 'Are you sure you want to clear your prayer progress?')) {
            clearPrayerProgress();
            alert(language === 'es'
                ? 'Progreso borrado exitosamente'
                : 'Progress cleared successfully');
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
            close: 'Close'
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
            close: 'Cerrar'
        }
    };

    const t = translations[language];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', width: '100%' }}>
                    <button className="btn btn-outline" onClick={onClose} style={{ minWidth: '120px' }}>
                        {t.close}
                    </button>
                </div>
                <div className="modal-header" style={{ justifyContent: 'center' }}>
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

                    {audioEnabled && (
                        <>
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

                            {/* Voice Download - Desktop Only (Piper) */}
                            {!/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) && (
                                <div className="setting-item">
                                    <div className="setting-label">
                                        <Download size={20} />
                                        <span>{language === 'es' ? 'Voces Mejoradas' : 'Better Voices'}</span>
                                    </div>
                                    <div className="setting-control">
                                        <button
                                            className="setting-btn"
                                            onClick={() => {
                                                // Reset dismissal flag to show banner again
                                                localStorage.removeItem(`voice-download-dismissed-final-${language}`);
                                                // Force reload to trigger banner check
                                                window.location.reload();
                                            }}
                                        >
                                            {language === 'es' ? 'Descargar' : 'Download'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

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
                </div>

                {/* Debug: Sherpa Error Display */}
                {getSherpaError() && (
                    <div className="setting-item" style={{ marginTop: '1rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '8px', border: '1px solid #ef4444' }}>
                        <div className="setting-label" style={{ color: '#b91c1c', fontSize: '0.8rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 'bold' }}>TTS Error:</span>
                            <span style={{ fontFamily: 'monospace' }}>{getSherpaError()}</span>
                        </div>
                    </div>
                )}

                {/* Debug: Sherpa State Display */}
                <div className="setting-item" style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f3f4f6', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                    <div className="setting-label" style={{ color: '#374151', fontSize: '0.8rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold' }}>Active Engine:</span>
                        <span style={{ fontFamily: 'monospace', marginBottom: '0.5rem' }}>{currentEngine}</span>
                        <span style={{ fontWeight: 'bold' }}>Sherpa Status:</span>
                        <span style={{ fontFamily: 'monospace' }}>{sherpaState}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
