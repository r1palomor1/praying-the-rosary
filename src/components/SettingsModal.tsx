import { useState, useEffect } from 'react';
import { Languages, Trash2, Gauge, Type, Info, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { clearPrayerProgress, clearSession as clearLocalStorageSession } from '../utils/storage';
import { getVersionInfo, formatDateTime, type VersionInfo } from '../utils/version';
import { getRosaryStartDate, setRosaryStartDate, getSacredStartDate, setSacredStartDate } from '../utils/progressSettings';
import { VersionModal } from './VersionModal';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResetProgress?: () => void;
    currentMysteryName?: string;
}

export function SettingsModal({ isOpen, onClose, onResetProgress, currentMysteryName: _currentMysteryName }: SettingsModalProps) {
    const { language, setLanguage, speechRate, setSpeechRate, fontSize, setFontSize } = useApp();
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const [showVersionModal, setShowVersionModal] = useState(false);
    const [rosaryStartDate, setRosaryStartDateState] = useState<string>('');
    const [sacredStartDate, setSacredStartDateState] = useState<string>('');
    const [showProgressInfo, setShowProgressInfo] = useState(false);

    // Fetch version info and start dates on mount
    useEffect(() => {
        getVersionInfo().then(setVersionInfo);
        setRosaryStartDateState(getRosaryStartDate() || '');
        setSacredStartDateState(getSacredStartDate() || '');
    }, []);



    if (!isOpen) return null;

    const handleClearProgress = () => {
        if (!showConfirmClear) {
            // First click - show confirmation state
            setShowConfirmClear(true);
            return;
        }

        // Second click - actually clear
        // If a specific reset handler is provided (e.g., from MysteryScreen), use it
        if (onResetProgress) {
            onResetProgress();
            onClose();
            return;
        }

        // Fallback: Global Clear (SAFETY FALLBACK ONLY - should not execute in normal usage)
        // All screens (HomeScreen, MysteryScreen) now provide onResetProgress to clear only the current mystery
        // This fallback exists for edge cases or if called from an unexpected context
        const keysBefore = Object.keys(localStorage);

        // 1. Aggressive Clear ALL mysteries (not recommended - use onResetProgress instead)
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

        // 2. Force Hard Reset to Home
        window.location.href = '/';
    };

    const handleRosaryStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRosaryStartDateState(value);
        setRosaryStartDate(value || null);

        // Auto-sync Sacred date to match Rosary date (user can override)
        if (value && !sacredStartDate) {
            setSacredStartDateState(value);
            setSacredStartDate(value);
        }
    };

    const handleSacredStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSacredStartDateState(value);
        setSacredStartDate(value || null);
    };

    const handleApplyDates = () => {
        // Reload to recalculate stats with new dates
        window.location.reload();
    };

    // Preset handlers
    const setToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setRosaryStartDateState(today);
        setSacredStartDateState(today);
        setRosaryStartDate(today);
        setSacredStartDate(today);
    };

    const setFirstOfMonth = () => {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString().split('T')[0];
        setRosaryStartDateState(firstOfMonth);
        setSacredStartDateState(firstOfMonth);
        setRosaryStartDate(firstOfMonth);
        setSacredStartDate(firstOfMonth);
    };

    const setFirstOfYear = () => {
        const year = new Date().getFullYear();
        const firstOfYear = `${year}-01-01`;
        setRosaryStartDateState(firstOfYear);
        setSacredStartDateState(firstOfYear);
        setRosaryStartDate(firstOfYear);
        setSacredStartDate(firstOfYear);
    };

    const resetToFullYear = () => {
        setRosaryStartDateState('');
        setSacredStartDateState('');
        setRosaryStartDate(null);
        setSacredStartDate(null);
        window.location.reload();
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
            extraLarge: 'Extra Large',
            lastUpdated: 'Last updated',
            progressTracking: 'Progress Tracking',
            rosaryStartDate: 'Rosary Start Date',
            sacredStartDate: 'Sacred Prayers Start Date',
            startDateHelp: 'Set your start dates, then click Apply to recalculate goals. Change anytime for what-if scenarios.',
            startDateTooltip: 'Started praying mid-year? No problem! Your goals will adjust so you\'re never "behind". Try different dates to see what-if scenarios.',
            quickPresets: 'Quick Presets:',
            today: 'Today',
            thisMonth: 'This Month',
            thisYear: 'This Year',
            clearCustomDates: 'Clear Custom Start Dates',
            clear: 'Clear',
            apply: 'Apply Changes'
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
            clearProgress: 'Borrar Progreso de Oración',
            close: 'CERRAR',
            textSize: 'Tamaño de Texto',
            normal: 'Normal',
            large: 'Grande',
            extraLarge: 'Extra Grande',
            lastUpdated: 'Última actualización',
            progressTracking: 'Seguimiento de Progreso',
            rosaryStartDate: 'Fecha de Inicio del Rosario',
            sacredStartDate: 'Fecha de Inicio de Oraciones Sagradas',
            startDateHelp: 'Establece tus fechas de inicio, luego haz clic en Aplicar para recalcular metas. Cambia en cualquier momento para escenarios hipotéticos.',
            startDateTooltip: '¿Empezaste a rezar a mitad de año? ¡No hay problema! Tus metas se ajustarán para que nunca estés "atrasado". Prueba diferentes fechas para ver escenarios hipotéticos.',
            quickPresets: 'Atajos Rápidos:',
            today: 'Hoy',
            thisMonth: 'Este Mes',
            thisYear: 'Este Año',
            clearCustomDates: 'Borrar Fechas de Inicio Personalizadas',
            clear: 'Borrar',
            apply: 'Aplicar Cambios'
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

                    {/* Progress Tracking Section */}
                    <div className="settings-card">
                        <div className="card-title-with-info">
                            <h2 className="card-title">{t.progressTracking}</h2>
                            <button
                                className="info-icon-btn"
                                onClick={() => setShowProgressInfo(!showProgressInfo)}
                                aria-label="Information about progress tracking"
                            >
                                <Info size={18} />
                            </button>
                        </div>

                        {/* Collapsible Info */}
                        {showProgressInfo && (
                            <div className="feature-info-box">
                                <div className="info-content">
                                    <p className="info-text">{t.startDateTooltip}</p>
                                    <p className="info-example">
                                        {language === 'en'
                                            ? "Example: Started on March 1st? Your yearly goal becomes 306 days (Mar-Dec) instead of 365 days. You'll never feel \"behind\"!"
                                            : "Ejemplo: ¿Empezaste el 1 de marzo? Tu meta anual se convierte en 306 días (Mar-Dic) en lugar de 365 días. ¡Nunca te sentirás \"atrasado\"!"}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Quick Presets */}
                        <div className="date-presets">
                            <p className="preset-label">{t.quickPresets}</p>
                            <div className="preset-buttons">
                                <button onClick={setToday} className="btn-preset">{t.today}</button>
                                <button onClick={setFirstOfMonth} className="btn-preset">{t.thisMonth}</button>
                                <button onClick={setFirstOfYear} className="btn-preset">{t.thisYear}</button>
                            </div>
                        </div>

                        <p className="preset-divider">Or set custom dates:</p>

                        <div className="setting-group">
                            <div className="setting-header">
                                <Calendar size={20} />
                                <h3>{t.rosaryStartDate}</h3>
                            </div>
                            <div className="date-input-group">
                                <input
                                    type="date"
                                    value={rosaryStartDate}
                                    onChange={handleRosaryStartDateChange}
                                    className="date-input"
                                    max={new Date().toISOString().split('T')[0]}
                                    aria-label={t.rosaryStartDate}
                                />
                                {rosaryStartDate && (
                                    <button
                                        onClick={() => {
                                            setRosaryStartDateState('');
                                            setRosaryStartDate(null);
                                        }}
                                        className="btn-clear-date"
                                    >
                                        {t.clear}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="setting-group">
                            <div className="setting-header">
                                <Calendar size={20} />
                                <h3>{t.sacredStartDate}</h3>
                            </div>
                            <div className="date-input-group">
                                <input
                                    type="date"
                                    value={sacredStartDate}
                                    onChange={handleSacredStartDateChange}
                                    className="date-input"
                                    max={new Date().toISOString().split('T')[0]}
                                    aria-label={t.sacredStartDate}
                                />
                                {sacredStartDate && (
                                    <button
                                        onClick={() => {
                                            setSacredStartDateState('');
                                            setSacredStartDate(null);
                                        }}
                                        className="btn-clear-date"
                                    >
                                        {t.clear}
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="setting-help-text">
                            ℹ️ {t.startDateHelp}
                        </p>

                        {/* Apply Button */}
                        <button
                            onClick={handleApplyDates}
                            className="btn-apply-dates"
                        >
                            {t.apply}
                        </button>

                        {/* Clear Custom Start Dates Button */}
                        {(rosaryStartDate || sacredStartDate) && (
                            <button
                                onClick={resetToFullYear}
                                className="btn-reset-year"
                            >
                                {t.clearCustomDates}
                            </button>
                        )}
                    </div>

                    {/* Display Section */}
                    <div className="settings-card">
                        <h2 className="card-title">{t.display}</h2>

                        {/* Theme toggle - HIDDEN: Dark mode only
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
                        */}

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

                {/* Version Info Footer */}
                {versionInfo && (
                    <footer className="settings-footer">
                        <button
                            className="version-info-button"
                            onClick={() => setShowVersionModal(true)}
                            aria-label="View version information"
                        >
                            <span className="version-text">
                                {t.lastUpdated}: {formatDateTime(versionInfo.timestamp, language)}
                            </span>
                            <Info size={16} className="version-icon" />
                        </button>
                    </footer>
                )}
            </div>

            {/* Version Modal */}
            {showVersionModal && versionInfo && (
                <VersionModal
                    versionInfo={versionInfo}
                    onClose={() => setShowVersionModal(false)}
                    language={language}
                />
            )}
        </div>
    );
}
