import { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SettingsModal } from './SettingsModal';
import { getVersionInfo, type VersionInfo } from '../utils/version';
import './PrayerSelectionScreen.css';

interface PrayerSelectionScreenProps {
    onSelectRosary: () => void;
    onSelectSacredPrayers: () => void;
    onSelectDailyReadings: () => void;
    onResetProgress?: () => void;
}

export function PrayerSelectionScreen({ onSelectRosary, onSelectSacredPrayers, onSelectDailyReadings, onResetProgress }: PrayerSelectionScreenProps) {
    const { language } = useApp();
    const [showSettings, setShowSettings] = useState(false);
    const [appVersion, setAppVersion] = useState<VersionInfo | null>(null);

    useEffect(() => {
        getVersionInfo().then(setAppVersion).catch(console.error);
    }, []);

    const t = {
        en: {
            title: 'Choose Prayer',
            sacredPrayers: 'Sacred Prayers',
            rosary: 'The Rosary',
            dailyReadings: 'Daily Readings',
            back: 'Back',
            settings: 'Settings'
        },
        es: {
            title: 'Elegir Oración',
            sacredPrayers: 'Oraciones Sagradas',
            rosary: 'El Rosario',
            dailyReadings: 'Lecturas Diarias',
            back: 'Volver',
            settings: 'Configuración'
        }
    }[language];

    const handleReset = () => {
        if (onResetProgress) {
            onResetProgress();
        }
        setShowSettings(false);
    };

    return (
        <div className="selection-container fade-in">
            <div className="selection-header">
                <h1 className="hero-title">{t.title}</h1>
                <button
                    className="icon-btn settings-btn"
                    onClick={() => setShowSettings(true)}
                    aria-label={t.settings}
                >
                    <SettingsIcon size={21} />
                </button>
            </div>

            <div className="prayer-options-container">
                <button
                    onClick={onSelectSacredPrayers}
                    className="prayer-selection-btn"
                >
                    <img
                        src="/images/sacred-prayers-bg.jpg"
                        alt="Sacred Prayers"
                        className="prayer-selection-img"
                    />
                    <span className="prayer-selection-label">{t.sacredPrayers}</span>
                </button>

                <button
                    onClick={onSelectRosary}
                    className="prayer-selection-btn"
                >
                    <img
                        src="/images/rosary-bg.jpg"
                        alt="The Rosary"
                        className="prayer-selection-img"
                    />
                    <span className="prayer-selection-label">{t.rosary}</span>
                </button>

                <button
                    onClick={onSelectDailyReadings}
                    className="prayer-selection-btn"
                >
                    <img
                        src="/images/intro-prayers.jpg"
                        alt="Daily Readings"
                        className="prayer-selection-img readings-img-filter"
                    />
                    <span className="prayer-selection-label">{t.dailyReadings}</span>
                </button>
            </div>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={handleReset}
            />

            {/* Version Indicator */}
            {appVersion && (
                <div className="version-indicator">
                    Updated: {(() => {
                        const d = new Date(appVersion.timestamp);
                        const month = (d.getMonth() + 1).toString().padStart(2, '0');
                        const day = d.getDate().toString().padStart(2, '0');
                        const year = d.getFullYear().toString().slice(-2);
                        let hours = d.getHours();
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        hours = hours % 12;
                        hours = hours ? hours : 12; // the hour '0' should be '12'
                        const minutes = d.getMinutes().toString().padStart(2, '0');
                        return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
                    })()}
                </div>
            )}
        </div>
    );
}

export default PrayerSelectionScreen;
