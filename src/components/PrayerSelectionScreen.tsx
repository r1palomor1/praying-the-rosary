import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ChevronRight, Loader2 } from 'lucide-react'; // Added Loader2
import { useApp } from '../context/AppContext';
import { SettingsModal } from './SettingsModal';
import { getVersionInfo, type VersionInfo } from '../utils/version';
import { LiturgicalCard } from './LiturgicalCard';
import { fetchLiturgicalDay, type LiturgicalDay } from '../utils/liturgicalCalendar'; // Import fetcher
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

    useEffect(() => {
        const initScreen = async () => {
            try {
                // Parallel fetch for speed
                const [version, liturgy] = await Promise.all([
                    getVersionInfo(),
                    fetchLiturgicalDay(new Date(), language)
                ]);

                setAppVersion(version);
                
                // If romcal returned fallback data, try to enhance with USCCB title
                if (liturgy && liturgy.celebrations[0].rank === 'WEEKDAY') {
                    // Likely a fallback - try USCCB for actual feast name
                    try {
                        const today = new Date();
                        const mm = (today.getMonth() + 1).toString().padStart(2, '0');
                        const dd = today.getDate().toString().padStart(2, '0');
                        const yy = today.getFullYear().toString().slice(-2);
                        const dateParam = `${mm}${dd}${yy}`;
                        
                        const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';
                        const usccbResponse = await fetch(`${API_BASE}/api/readings?date=${dateParam}&lang=${language}`);
                        
                        if (usccbResponse.ok) {
                            const usccbData = await usccbResponse.json();
                            if (usccbData.title) {
                                // Replace fallback title with USCCB title
                                liturgy.celebrations[0].title = usccbData.title;
                            }
                        }
                    } catch (e) {
                        console.log('USCCB title fetch failed, using fallback', e);
                    }
                }
                
                setLiturgicalData(liturgy);


            } catch (e) {
                console.error("Failed to load screen data", e);
            } finally {
                setLoading(false);
            }
        };

        initScreen();
    }, [language]);

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

    // BLOCKING LOAD - Show nothing or simple spinner until data is ready
    if (loading) {
        return (
            <div className="selection-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin" size={48} color="#D4AF37" />
            </div>
        );
    }

    // liturgicalData is guaranteed non-null due to fallback logic
    return (
        <div className="selection-container fade-in" style={{ position: 'relative' }}>
            {/* Minimal Header for Settings Icon Only */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
                <button
                    className="header-btn"
                    onClick={() => setShowSettings(true)}
                    aria-label={t.settings}
                    style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                    }}
                >
                    <SettingsIcon size={21} strokeWidth={3} />
                </button>
            </div>

            <main className="selection-main" style={{ paddingTop: 0 }}>
                {/* 1. Liturgical Status (Top) - Pass Data Directly */}
                {liturgicalData && <LiturgicalCard dayData={liturgicalData} />}

                {/* 2. Action Header (Title) */}
                <h1
                    className="selection-title"
                    style={{
                        margin: '0.75rem 0 -0.4rem', // Negative margin matches gap to 0.6rem
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
                <div className="decorative-divider" style={{ opacity: 0.6, marginBottom: '0.75rem' }}>
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
