import { useState, useEffect } from 'react';
import { Info, Settings, HelpCircle, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { clearPrayerProgress, clearSession as clearLocalStorageSession } from '../../utils/storage';
import { getVersionInfo, formatDateTime, type VersionInfo } from '../../utils/version';
import { getRosaryStartDate, setRosaryStartDate, getSacredStartDate, setSacredStartDate } from '../../utils/progressSettings';
import { GeneralSection } from './GeneralSection';
import { ProgressTrackingSection } from './ProgressTrackingSection';
import { DisplaySection } from './DisplaySection';
import { AudioSection } from './AudioSection';
import './SettingsV2.css';

interface SettingsModalV2Props {
    isOpen: boolean;
    onClose: () => void;
    onResetProgress?: () => void;
    currentMysteryName?: string; // Optional, for compatibility
}

export function SettingsModalV2({ isOpen, onClose, onResetProgress, currentMysteryName: _currentMysteryName }: SettingsModalV2Props) {
    const { language, setLanguage, speechRate, setSpeechRate, fontSize, setFontSize } = useApp();
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const [rosaryStartDate, setRosaryStartDateState] = useState<string>('');
    const [sacredStartDate, setSacredStartDateState] = useState<string>('');
    const [rosaryReminder, setRosaryReminder] = useState(() => {
        return localStorage.getItem('rosary_reminder_enabled') === 'true';
    });

    // Modal states
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showTextSizeModal, setShowTextSizeModal] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    // Fetch version info and start dates on mount
    useEffect(() => {
        getVersionInfo().then(setVersionInfo);
        setRosaryStartDateState(getRosaryStartDate() || '');
        setSacredStartDateState(getSacredStartDate() || '');
    }, []);

    if (!isOpen) return null;

    // Translations
    const translations = {
        en: {
            title: 'SETTINGS',
            general: 'General',
            language: 'Language',
            clearProgress: 'Clear Prayer Progress',
            display: 'Display',
            audio: 'Audio',
            speed: 'Playback Speed',
            close: 'CLOSE',
            textSize: 'Text Size',
            normal: 'Normal',
            large: 'Large',
            extraLarge: 'Extra Large',
            lastUpdated: 'Last updated',
            progressTracking: 'Progress Tracking',
            startDateTooltip: 'Started praying mid-year? No problem! Your goals will adjust so you\'re never "behind". Try different dates to see what-if scenarios.',
            dailyRosaryReminder: 'Daily Rosary Reminder',
            reminderDesc: 'Liturgical glow on active cards'
        },
        es: {
            title: 'CONFIGURACIÓN',
            general: 'General',
            language: 'Idioma',
            clearProgress: 'Borrar Progreso de Oración',
            display: 'Pantalla',
            audio: 'Audio',
            speed: 'Velocidad de Reproducción',
            close: 'CERRAR',
            textSize: 'Tamaño de Texto',
            normal: 'Normal',
            large: 'Grande',
            extraLarge: 'Extra Grande',
            lastUpdated: 'Última actualización',
            progressTracking: 'Seguimiento de Progreso',
            startDateTooltip: '¿Empezaste a rezar a mitad de año? ¡No hay problema! Tus metas se ajustarán para que nunca estés "atrasado". Prueba diferentes fechas para ver escenarios hipotéticos.',
            dailyRosaryReminder: 'Recordatorio Diario del Rosario',
            reminderDesc: 'Brillo litúrgico en tarjetas activas'
        }
    };

    const t = translations[language];
    const currentLanguage = language === 'en' ? 'English' : 'Español';

    // Handlers
    const handleReminderToggle = (enabled: boolean) => {
        setRosaryReminder(enabled);
        localStorage.setItem('rosary_reminder_enabled', enabled.toString());
    };

    const handleResetClick = () => {
        if (!showConfirmReset) {
            setShowConfirmReset(true);
            setTimeout(() => setShowConfirmReset(false), 3000);
            return;
        }

        if (onResetProgress) {
            onResetProgress();
        } else {
            clearPrayerProgress();
            clearLocalStorageSession();
        }
        setShowConfirmReset(false);
        onClose();
    };

    return (
        <div className="settings-modal-v2">
            <div className="settings-content">
                {/* Header */}
                <header className="settings-header">
                    <h1 className="settings-title">{t.title}</h1>
                    <button className="settings-close-button" onClick={onClose}>
                        {t.close}
                    </button>
                </header>

                {/* Sections */}
                <div className="settings-sections">
                    <GeneralSection
                        language={language}
                        onLanguageClick={() => setShowLanguageModal(true)}
                        onResetClick={handleResetClick}
                        translations={t}
                        currentLanguage={currentLanguage}
                    />

                    <ProgressTrackingSection
                        rosaryStartDate={rosaryStartDate}
                        sacredStartDate={sacredStartDate}
                        onEditClick={() => setShowDateModal(true)}
                        translations={t}
                        language={language}
                    />

                    <DisplaySection
                        textSize={fontSize}
                        dailyReminderEnabled={rosaryReminder}
                        onTextSizeClick={() => setShowTextSizeModal(true)}
                        onReminderToggle={handleReminderToggle}
                        translations={t}
                    />

                    <AudioSection
                        playbackSpeed={speechRate}
                        onSpeedChange={setSpeechRate}
                        translations={t}
                    />
                </div>

                {/* Footer */}
                <footer className="settings-footer">
                    {versionInfo && (
                        <div className="settings-version-badge">
                            <Info className="settings-version-icon" size={14} />
                            <span className="settings-version-text">
                                {t.lastUpdated}: {formatDateTime(versionInfo.timestamp, language)}
                            </span>
                        </div>
                    )}
                    <div className="settings-footer-icons">
                        <Settings className="settings-footer-icon active" size={20} />
                        <HelpCircle className="settings-footer-icon" size={20} />
                        <Shield className="settings-footer-icon" size={20} />
                    </div>
                </footer>
            </div>

            {/* TODO: Add modals for language, text size, and date editing */}
            {/* These will be implemented in the next phase */}
        </div>
    );
}
