import { useState } from 'react';
import { Moon, Sun, Languages, Trash2, Gauge, Type } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { clearPrayerProgress, clearSession as clearLocalStorageSession } from '../utils/storage';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResetProgress?: () => void;
    currentMysteryName?: string;
}

export function SettingsModal({ isOpen, onClose, onResetProgress, currentMysteryName: _currentMysteryName }: SettingsModalProps) {
    const { language, setLanguage, theme, toggleTheme, speechRate, setSpeechRate, fontSize, setFontSize } = useApp();
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    if (!isOpen) return null;

    const handleClearProgress = () => {
        if (!showConfirmClear) {
            // First click - show confirmation state
            setShowConfirmClear(true);
            return;
        }

        // Second click - actually clear
        console.log('Confirmed. Clearing data...');

        // If a specific reset handler is provided (e.g., from MysteryScreen), use it
        if (onResetProgress) {
            onResetProgress();
            onClose();
            return;
        }

        // Fallback: Global Clear (e.g., from Home Screen)
        const keysBefore = Object.keys(localStorage);
        console.log('Keys before:', keysBefore);

        // 1. Aggressive Clear
        clearPrayerProgress();
        clearLocalStorageSession();

        // Clear specific known keys manually
        try {
            localStorage.removeItem('rosary_session');
            localStorage.removeItem('rosary_prayer_progress');
            keysBefore.forEach(key => {
                if (key.startsWith('rosary_prayer_progress') || key.startsWith('rosary_session')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.error('Manual clear failed:', e);
        }

        console.log('Keys after:', Object.keys(localStorage));

        // 2. Force Hard Reset to Home
        window.location.href = '/';
    };

    const translations = {
        en: {
            title: 'SETTINGS',
            general: 'General',
            language: 'Language',
            theme: 'Theme',
            display: 'Display',
            audio: 'Audio',
            speed: 'Speed',
            light: 'Light',
            dark: 'Dark',
            clearProgress: 'Clear Prayer Progress',
            close: 'CLOSE',
            textSize: 'Text Size',
            normal: 'Normal',
            large: 'Large',
            extraLarge: 'Extra Large'
        },
        es: {
            title: 'CONFIGURACIÓN',
            general: 'General',
            language: 'Idioma',
            theme: 'Tema',
            display: 'Pantalla',
            audio: 'Audio',
            speed: 'Velocidad',
            light: 'Claro',
            dark: 'Oscuro',
            clearProgress: 'Borrar Progreso',
            close: 'CERRAR',
            textSize: 'Tamaño de Texto',
            normal: 'Normal',
            large: 'Grande',
            extraLarge: 'Extra Grande'
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
                            <button
                                className={`btn-clear ${showConfirmClear ? 'btn-clear-confirm' : ''}`}
                                onClick={handleClearProgress}
                            >
                                {showConfirmClear
                                    ? (language === 'es' ? '¡Haz clic de nuevo para confirmar!' : 'Click again to confirm!')
                                    : t.clearProgress
                                }
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
                                aria-label={t.speed}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
