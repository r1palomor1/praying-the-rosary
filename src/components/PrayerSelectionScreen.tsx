import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SettingsModal } from './SettingsModal';
import { getVersionInfo, type VersionInfo } from '../utils/version';
import { LiturgicalCard } from './LiturgicalCard';
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
    const [headerColor, setHeaderColor] = useState<string | null>(null);

    useEffect(() => {
        getVersionInfo().then(setAppVersion).catch(console.error);
    }, []);

    const t = {
        en: {
            title: 'Choose Prayer',
            sacredPrayers: 'Sacred Prayers',
            sacredPrayersSubtitle: 'Communion with the Most High',
            rosary: 'The Rosary',
            rosarySubtitle: 'Mysteries of faith and hope',
            dailyReadings: 'Daily Readings',
            dailyReadingsSubtitle: 'The living word of God',
            back: 'Back',
            settings: 'Settings'
        },
        es: {
            title: 'Elegir Oración',
            sacredPrayers: 'Oraciones Sagradas',
            sacredPrayersSubtitle: 'Comunión con el Altísimo',
            rosary: 'El Rosario',
            rosarySubtitle: 'Misterios de fe y esperanza',
            dailyReadings: 'Lecturas Diarias',
            dailyReadingsSubtitle: 'La palabra viva de Dios',
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
            <header className="selection-header">
                <div className="header-divider"></div>
                <div className="header-row">
                    <div className="header-spacer"></div>
                    <h1
                        className="selection-title"
                        style={headerColor ? {
                            background: 'none',
                            WebkitTextFillColor: headerColor,
                            color: headerColor,
                            textShadow: `0 0 20px ${headerColor}50`
                        } : {}}
                    >
                        {t.title}
                    </h1>
                    <button
                        className="header-btn"
                        onClick={() => setShowSettings(true)}
                        aria-label={t.settings}
                        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    >
                        <SettingsIcon size={20} />
                    </button>
                </div>
            </header>

            <main className="selection-main">
                {/* Liturgical Day Card */}
                <LiturgicalCard onColorChange={setHeaderColor} />

                {/* Divider after Liturgical Card */}
                <div className="decorative-divider" style={{ opacity: 0.6 }}>
                    <div className="divider-line divider-line-left"></div>
                    <span className="material-symbols-outlined divider-icon">church</span>
                    <div className="divider-line divider-line-right"></div>
                </div>

                {/* Daily Readings Card */}
                <button onClick={onSelectDailyReadings} className="prayer-card">
                    <div className="card-image-container">
                        <div className="card-image">
                            <img src="/daily_readings_icon.png" alt={t.dailyReadings} />
                        </div>
                    </div>
                    <div className="card-content">
                        <h2 className="card-title">{t.dailyReadings.toUpperCase()}</h2>
                        <p className="card-subtitle">{t.dailyReadingsSubtitle}</p>
                    </div>
                    <ChevronRight className="card-chevron" size={24} />
                </button>

                {/* Divider */}
                <div className="decorative-divider">
                    <div className="divider-line divider-line-left"></div>
                    <span className="material-symbols-outlined divider-icon">church</span>
                    <div className="divider-line divider-line-right"></div>
                </div>

                {/* Rosary Card */}
                <button onClick={onSelectRosary} className="prayer-card">
                    <div className="card-image-container">
                        <div className="card-image">
                            <img src="/rosary_icon.png" alt={t.rosary} />
                        </div>
                    </div>
                    <div className="card-content">
                        <h2 className="card-title">{t.rosary.toUpperCase()}</h2>
                        <p className="card-subtitle">{t.rosarySubtitle}</p>
                    </div>
                    <ChevronRight className="card-chevron" size={24} />
                </button>

                {/* Divider */}
                <div className="decorative-divider">
                    <div className="divider-line divider-line-left"></div>
                    <span className="material-symbols-outlined divider-icon">church</span>
                    <div className="divider-line divider-line-right"></div>
                </div>

                {/* Sacred Prayers Card */}
                <button onClick={onSelectSacredPrayers} className="prayer-card">
                    <div className="card-image-container">
                        <div className="card-image">
                            <img src="/sacred_prayers_icon.png" alt={t.sacredPrayers} />
                        </div>
                    </div>
                    <div className="card-content">
                        <h2 className="card-title">{t.sacredPrayers.toUpperCase()}</h2>
                        <p className="card-subtitle">{t.sacredPrayersSubtitle}</p>
                    </div>
                    <ChevronRight className="card-chevron" size={24} />
                </button>
            </main>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={handleReset}
            />

            {/* Version Indicator */}
            {appVersion && (
                <div className="version-indicator">
                    App updated: {(() => {
                        const d = new Date(appVersion.timestamp);
                        const month = (d.getMonth() + 1).toString().padStart(2, '0');
                        const day = d.getDate().toString().padStart(2, '0');
                        const year = d.getFullYear().toString().slice(-2);
                        let hours = d.getHours();
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        hours = hours % 12;
                        hours = hours ? hours : 12;
                        const minutes = d.getMinutes().toString().padStart(2, '0');
                        return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
                    })()}
                </div>
            )}
        </div>
    );
}

export default PrayerSelectionScreen;
