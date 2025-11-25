
import { X, Moon, Sun, Volume2, VolumeX, Languages, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { clearPrayerProgress } from '../utils/storage';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { language, setLanguage, theme, toggleTheme, audioEnabled, setAudioEnabled, volume, setVolume } = useApp();

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
                <div className="modal-header">
                    <h2>{t.title}</h2>
                    <button className="btn-icon" onClick={onClose} aria-label={t.close}>
                        <X size={24} />
                    </button>
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
            </div>
        </div>
    );
}
