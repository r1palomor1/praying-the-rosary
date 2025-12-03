import { Moon, Sun, Volume2, Languages, Trash2, Gauge, Type, Layout, Music } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { clearPrayerProgress } from '../utils/storage';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { language, setLanguage, theme, toggleTheme, audioEnabled, setAudioEnabled, volume, setVolume, speechRate, setSpeechRate, fontSize, setFontSize, mysteryLayout, setMysteryLayout } = useApp();

    if (!isOpen) return null;

    const handleClearProgress = () => {
        const confirmed = window.confirm(language === 'es'
            ? '¿Estás seguro de que quieres borrar tu progreso de oración? La página se recargará.'
            : 'Are you sure you want to clear your prayer progress? The page will reload.');

        if (confirmed) {
            clearPrayerProgress();
            window.location.reload();
        }
    };

    const translations = {
        en: {
            title: 'SETTINGS',
            general: 'General',
            language: 'Language',
            theme: 'Theme',
            display: 'Display',
            audio: 'Audio',
            volume: 'Volume',
            speed: 'Speed',
            light: 'Light',
            dark: 'Dark',
            enabled: 'Enabled',
            disabled: 'Disabled',
            clearProgress: 'Clear Prayer Progress',
            close: 'CLOSE',
            textSize: 'Text Size',
            normal: 'Normal',
            large: 'Large',
            extraLarge: 'Extra Large',
            mysteryLayout: 'Mystery Layout',
            classic: 'Classic',
            cinematic: 'Cinematic',
            audioToggle: 'Audio'
        },
        es: {
            title: 'CONFIGURACIÓN',
            general: 'General',
            language: 'Idioma',
            theme: 'Tema',
            display: 'Pantalla',
            audio: 'Audio',
            volume: 'Volumen',
            speed: 'Velocidad',
            light: 'Claro',
            dark: 'Oscuro',
            enabled: 'Activado',
            disabled: 'Desactivado',
            clearProgress: 'Borrar Progreso',
            close: 'CERRAR',
            textSize: 'Tamaño de Texto',
            normal: 'Normal',
            large: 'Grande',
            extraLarge: 'Extra Grande',
            mysteryLayout: 'Diseño',
            classic: 'Clásico',
            cinematic: 'Cine',
            audioToggle: 'Audio'
        }
    };

    const t = translations[language];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <header className="settings-header">
                    <button className="btn-close-settings" onClick={onClose}>
                        {t.close}
                    </button>
                    <h1 className="settings-title">{t.title}</h1>
                </header>

                <main className="settings-main">
                    {/* General Section */}
                    <div className="settings-card">
                        <h2 className="card-title">{t.general}</h2>

                        <div className="setting-group">
                            <div className="setting-header">
                                <Languages size={20} />
                                <h3>{t.language}</h3>
                            </div>
                            <div className="setting-grid-2">
                                <button
                                    className={`btn-option ${language === 'en' ? 'active' : 'inactive'}`}
                                    onClick={() => setLanguage('en')}
                                >
                                    English
                                </button>
                                <button
                                    className={`btn-option ${language === 'es' ? 'active' : 'inactive'}`}
                                    onClick={() => setLanguage('es')}
                                >
                                    Español
                                </button>
                            </div>
                        </div>

                        <div className="setting-group">
                            <div className="setting-header">
                                <Trash2 size={20} />
                                <h3>{t.clearProgress}</h3>
                            </div>
                            <button className="btn-clear" onClick={handleClearProgress}>
                                {t.clearProgress}
                            </button>
                        </div>
                    </div>

                    {/* Display Section */}
                    <div className="settings-card">
                        <h2 className="card-title">{t.display}</h2>

                        <div className="setting-group">
                            <div className="setting-header">
                                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                                <h3>{t.theme}</h3>
                            </div>
                            <div className="setting-grid-2">
                                <button
                                    className={`btn-option ${theme === 'light' ? 'active' : 'inactive'}`}
                                    onClick={() => theme === 'dark' && toggleTheme()}
                                >
                                    {t.light}
                                </button>
                                <button
                                    className={`btn-option ${theme === 'dark' ? 'active' : 'inactive'}`}
                                    onClick={() => theme === 'light' && toggleTheme()}
                                >
                                    {t.dark}
                                </button>
                            </div>
                        </div>

                        <div className="setting-group">
                            <div className="setting-header">
                                <Layout size={20} />
                                <h3>{t.mysteryLayout}</h3>
                            </div>
                            <div className="setting-grid-2">
                                <button
                                    className={`btn-option ${mysteryLayout === 'classic' ? 'active' : 'inactive'}`}
                                    onClick={() => setMysteryLayout('classic')}
                                >
                                    {t.classic}
                                </button>
                                <button
                                    className={`btn-option ${mysteryLayout === 'cinematic' ? 'active' : 'inactive'}`}
                                    onClick={() => setMysteryLayout('cinematic')}
                                >
                                    {t.cinematic}
                                </button>
                            </div>
                        </div>

                        <div className="setting-group">
                            <div className="setting-header">
                                <Type size={20} />
                                <h3>{t.textSize}</h3>
                            </div>
                            <div className="setting-grid-3">
                                <button
                                    className={`btn-option ${fontSize === 'normal' ? 'active' : 'inactive'}`}
                                    onClick={() => setFontSize('normal')}
                                >
                                    {t.normal}
                                </button>
                                <button
                                    className={`btn-option ${fontSize === 'large' ? 'active' : 'inactive'}`}
                                    onClick={() => setFontSize('large')}
                                >
                                    {t.large}
                                </button>
                                <button
                                    className={`btn-option ${fontSize === 'xl' ? 'active' : 'inactive'}`}
                                    onClick={() => setFontSize('xl')}
                                >
                                    {t.extraLarge}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Audio Section */}
                    <div className="settings-card">
                        <h2 className="card-title">{t.audio}</h2>

                        {audioEnabled && (
                            <>
                                <div className="setting-group">
                                    <div className="range-header">
                                        <div className="flex items-center gap-3">
                                            <Gauge size={20} className="mr-3" />
                                            <h3>{t.speed}</h3>
                                        </div>
                                        <span className="range-value">{Math.round(speechRate * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="150"
                                        step="5"
                                        value={speechRate * 100}
                                        onChange={(e) => setSpeechRate(parseInt(e.target.value) / 100)}
                                        className="range-input"
                                    />
                                </div>

                                <div className="setting-group">
                                    <div className="range-header">
                                        <div className="flex items-center gap-3">
                                            <Volume2 size={20} className="mr-3" />
                                            <h3>{t.volume}</h3>
                                        </div>
                                        <span className="range-value">{Math.round(volume * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume * 100}
                                        onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
                                        className="range-input"
                                    />
                                </div>
                            </>
                        )}

                        <div className="setting-group">
                            <div className="setting-header">
                                <Music size={20} />
                                <h3>{t.audioToggle}</h3>
                            </div>
                            <div className="setting-grid-2">
                                <button
                                    className={`btn-option ${audioEnabled ? 'active' : 'inactive'}`}
                                    onClick={() => setAudioEnabled(true)}
                                >
                                    {t.enabled}
                                </button>
                                <button
                                    className={`btn-option ${!audioEnabled ? 'active' : 'inactive'}`}
                                    onClick={() => setAudioEnabled(false)}
                                >
                                    {t.disabled}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
