import { useState, useEffect } from 'react';
import { Info, Bug } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { clearPrayerProgress, clearSession as clearLocalStorageSession } from '../../utils/storage';
import { getVersionInfo, formatDateTime, type VersionInfo } from '../../utils/version';
import { getRosaryStartDate, setRosaryStartDate, getSacredStartDate, setSacredStartDate, getBibleStartDate, setBibleStartDate } from '../../utils/progressSettings';
import { VersionModal } from '../VersionModal';
import { TextSizeModal } from './TextSizeModal';
import { DateEditModal } from './DateEditModal';
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
    const { language, setLanguage, speechRate, setSpeechRate, fontSize, setFontSize, setDebugOpen } = useApp();
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const [rosaryStartDate, setRosaryStartDateState] = useState<string>('');
    const [sacredStartDate, setSacredStartDateState] = useState<string>('');
    const [bibleStartDate, setBibleStartDateState] = useState<string>('');
    const [rosaryReminder, setRosaryReminder] = useState(() => {
        return localStorage.getItem('rosary_reminder_enabled') === 'true';
    });

    // Modal states
    const [showTextSizeModal, setShowTextSizeModal] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [showVersionModal, setShowVersionModal] = useState(false);

    // Fetch version info and start dates on mount
    useEffect(() => {

        getVersionInfo().then(setVersionInfo);
        setRosaryStartDateState(getRosaryStartDate() || '');
        setSacredStartDateState(getSacredStartDate() || '');
        setBibleStartDateState(getBibleStartDate() || '');
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
            reminderDesc: 'Liturgical glow on active cards',
            sacredPrayers: 'Sacred Prayers'
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
            reminderDesc: 'Brillo litúrgico en tarjetas activas',
            sacredPrayers: 'Oraciones Sagradas'
        }
    };

    const t = translations[language];
    const currentLanguage = language === 'en' ? 'English' : 'Español';

    // Helper function for text size labels
    const getTextSizeLabel = (size: 'normal' | 'large' | 'xl') => {
        switch (size) {
            case 'normal': return language === 'en' ? 'Normal' : 'Normal';
            case 'large': return language === 'en' ? 'Large' : 'Grande';
            case 'xl': return language === 'en' ? 'Extra Large' : 'Extra Grande';
        }
    };

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

    const handleDateApply = () => {
        setRosaryStartDate(rosaryStartDate);
        setSacredStartDate(sacredStartDate);
        setBibleStartDate(bibleStartDate);
    };

    return (
        <div className="settings-modal-v2">
            <div className="settings-content">
                {/* Header */}
                <header className="settings-header">
                    <h1 className="settings-title">{t.title}</h1>
                    <button className="settings-close-button" onClick={onClose} aria-label={t.close}>
                        {t.close}
                    </button>
                </header>

                {/* Sections */}
                <div className="settings-sections">
                    <GeneralSection
                        language={language}
                        onLanguageChange={setLanguage}
                        onResetClick={handleResetClick}
                        showConfirmReset={showConfirmReset}
                        translations={t}
                        currentLanguage={currentLanguage}
                    />

                    <ProgressTrackingSection
                        rosaryStartDate={rosaryStartDate}
                        sacredStartDate={sacredStartDate}
                        bibleStartDate={bibleStartDate}
                        onEditClick={() => setShowDateModal(true)}
                        translations={t}
                        language={language}
                    />

                    <DisplaySection
                        fontSize={fontSize}
                        onTextSizeClick={() => setShowTextSizeModal(true)}
                        rosaryReminder={rosaryReminder}
                        onReminderToggle={handleReminderToggle}
                        translations={t}
                        textSizeLabel={getTextSizeLabel(fontSize)}
                    />

                    <AudioSection
                        playbackSpeed={speechRate}
                        onSpeedChange={setSpeechRate}
                        translations={t}
                    />
                </div>

                {/* Footer */}
                <footer className="settings-footer">
                    <div className="settings-footer-row">
                        {versionInfo && (
                            <button
                                className="settings-version-button"
                                onClick={() => setShowVersionModal(true)}
                                aria-label="View version information"
                            >
                                <span className="settings-version-text">
                                    {t.lastUpdated}: {formatDateTime(versionInfo.timestamp, language)}
                                </span>
                                <Info size={16} className="settings-version-icon" />
                            </button>
                        )}
                        <button
                            onClick={() => setDebugOpen(true)}
                            className="settings-debug-button"
                            aria-label="Open Debug Console"
                        >
                            <Bug size={16} />
                        </button>
                    </div>
                </footer>
            </div>

            {/* Version Modal */}
            {showVersionModal && versionInfo && (
                <VersionModal
                    versionInfo={versionInfo}
                    onClose={() => setShowVersionModal(false)}
                    language={language}
                />
            )}

            {/* Text Size Modal */}
            <TextSizeModal
                isOpen={showTextSizeModal}
                onClose={() => setShowTextSizeModal(false)}
                currentSize={fontSize}
                onSelect={setFontSize}
                language={language}
            />

            {/* Date Edit Modal */}
            <DateEditModal
                isOpen={showDateModal}
                onClose={() => setShowDateModal(false)}
                rosaryStartDate={rosaryStartDate}
                sacredStartDate={sacredStartDate}
                bibleStartDate={bibleStartDate}
                onRosaryDateChange={setRosaryStartDateState}
                onSacredDateChange={setSacredStartDateState}
                onBibleDateChange={setBibleStartDateState}
                onApply={handleDateApply}
                language={language}
            />
        </div>
    );
}
