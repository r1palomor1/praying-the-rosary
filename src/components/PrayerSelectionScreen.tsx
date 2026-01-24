import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ChevronRight, Loader2 } from 'lucide-react'; // Added Loader2
import { useApp } from '../context/AppContext';
import { SettingsModal } from './SettingsModal';
import { getVersionInfo, type VersionInfo } from '../utils/version';
import { LiturgicalCard } from './LiturgicalCard';
import { fetchLiturgicalDay, type LiturgicalDay, getLiturgicalColorHex } from '../utils/liturgicalCalendar'; // Import fetcher
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


    // Liturgical data guaranteed non-null via fallback
    const [liturgicalData, setLiturgicalData] = useState<LiturgicalDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRosaryCompleted, setIsRosaryCompleted] = useState(false);

    useEffect(() => {
        const initScreen = async () => {
            try {
                // Parallel fetch for speed
                const [version, liturgy] = await Promise.all([
                    getVersionInfo(),
                    fetchLiturgicalDay(new Date(), language)
                ]);

                setAppVersion(version);
                setLiturgicalData(liturgy);
            } catch (e) {
                console.error("Failed to load screen data", e);
            } finally {
                setLoading(false);
            }
        };

        // Check rosary completion status
        const lastCompleted = localStorage.getItem('rosary_last_completed');
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (lastCompleted === todayStr) {
            setIsRosaryCompleted(true);
        }

        initScreen();
    }, [language]);

    // Calculate liturgical color hex for Rosary card styling
    const rosaryColorHex = liturgicalData?.celebrations?.[0]?.colour
        ? getLiturgicalColorHex(liturgicalData.celebrations[0].colour)
        : '#10B981';

    const handleReset = () => {
        localStorage.removeItem('rosary_last_completed');
        setIsRosaryCompleted(false);
        if (onResetProgress) onResetProgress();
    };

    const t = {
        en: {
            title: 'Choose Prayer',
            rosary: 'Holy Rosary',
            rosarySubtitle: 'Joyful, Sorrowful, Glorious & Luminous',
            sacredPrayers: 'Sacred Prayers',
            sacredPrayersSubtitle: 'Essential Catholic Prayers',
            dailyReadings: 'Daily Readings',
            dailyReadingsSubtitle: 'Today\'s Mass Readings',
            settings: 'Settings',
            prayed: 'Prayed'
        },
        es: {
            title: 'Elegir Oración',
            rosary: 'Santo Rosario',
            rosarySubtitle: 'Gozosos, Dolorosos, Gloriosos y Luminosos',
            sacredPrayers: 'Oraciones Sagradas',
            sacredPrayersSubtitle: 'Oraciones Católicas Esenciales',
            dailyReadings: 'Lecturas Diarias',
            dailyReadingsSubtitle: 'Lecturas de la Misa de Hoy',
            settings: 'Ajustes',
            prayed: 'Completado'
        }
    }[language];



    // Show loading state
    if (loading) {
        return (
            <div className="selection-container">
                <main className="selection-main">
                    <div className="loading-spinner-container">
                        <Loader2 className="spinner-icon" size={48} />
                    </div>
                </main>
            </div>
        );
    }

    // liturgicalData is guaranteed non-null due to fallback logic
    return (
        <div className="selection-container fade-in" style={{ position: 'relative' }}>
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={handleReset}
            />

            <div className="selection-header" style={{ position: 'absolute', top: '1rem', right: '1rem', width: 'auto', padding: 0, zIndex: 10 }}>
                <button
                    className="settings-button"
                    onClick={() => setShowSettings(true)}
                    aria-label={t.settings}
                    style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        padding: '8px'
                    }}
                >
                    <SettingsIcon size={24} strokeWidth={2.5} />
                </button>
            </div>

            <main className="selection-main" style={{ paddingTop: 0 }}>
                {/* 1. Liturgical Status (Top) - Pass Data Directly */}
                {liturgicalData && <LiturgicalCard dayData={liturgicalData} />}

                {/* 2. Action Header (Title) */}
                <h1
                    className="selection-title"
                    style={{
                        margin: '-0.4rem 0 -0.4rem', // symmetrical negative spacing
                        fontSize: '1.5rem',
                        letterSpacing: '0.15em',
                        color: '#E5E7EB', // Action header is neutral/white
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        fontWeight: 300, // Removed boldness
                        textAlign: 'center',
                        width: '100%'
                    }}
                >
                    {t.title.toUpperCase()}
                </h1>

                {/* 3. Helper Divider (Below Title) - Reduced spacing */}
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

                {/* Divider (Between Readings & Rosary) */}
                <div className="decorative-divider">
                    <div className="divider-line divider-line-left"></div>
                    <span className="material-symbols-outlined divider-icon">church</span>
                    <div className="divider-line divider-line-right"></div>
                </div>

                {/* Rosary Card */}
                <button
                    onClick={onSelectRosary}
                    className="prayer-card"
                    style={{
                        // When completed, use default border (undefined). When active, use colored border.
                        border: isRosaryCompleted ? undefined : `1px solid ${rosaryColorHex}`,
                        boxShadow: isRosaryCompleted ? 'none' : `0 0 15px ${rosaryColorHex}40`,
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div className="card-image-container">
                        <div className="card-image">
                            <img src="/rosary_icon.png" alt={t.rosary} />
                        </div>
                    </div>
                    <div className="card-content">
                        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {t.rosary.toUpperCase()}
                        </h2>
                        <p className="card-subtitle">{t.rosarySubtitle}</p>
                    </div>
                    {isRosaryCompleted ? (
                        <div style={{
                            backgroundColor: rosaryColorHex,
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: '20px',
                                    color: (rosaryColorHex === '#F3F4F6' || rosaryColorHex === '#F59E0B') ? '#1F2937' : '#fff' // Black icon for White/Gold 
                                }}
                            >
                                check
                            </span>
                        </div>
                    ) : (
                        <ChevronRight className="card-chevron" size={24} />
                    )}
                </button>

                {/* Divider (Between Rosary & Sacred Prayers) */}
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
