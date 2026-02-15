import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ChevronRight, Loader2 } from 'lucide-react'; // Added Loader2
import { useApp } from '../context/AppContext';
import { SettingsModalV2 as SettingsModal } from './settings/SettingsModalV2';
import { getVersionInfo, type VersionInfo } from '../utils/version';
import { LiturgicalCard } from './LiturgicalCard';
import { fetchLiturgicalDay, type LiturgicalDay, getLiturgicalColorHex } from '../utils/liturgicalCalendar'; // Import fetcher
import './PrayerSelectionScreen.css';
import { hasCompletionOnDate } from '../utils/prayerHistory';
import { useBibleProgress } from '../hooks/useBibleProgress';

interface PrayerSelectionScreenProps {
    onSelectRosary: () => void;
    onSelectSacredPrayers: () => void;
    onSelectDailyReadings: () => void;
    onSelectBibleInYear?: () => void;
    onResetProgress?: () => void;
}

export function PrayerSelectionScreen({ onSelectRosary, onSelectSacredPrayers, onSelectDailyReadings, onSelectBibleInYear, onResetProgress }: PrayerSelectionScreenProps) {
    const { language } = useApp();
    const [showSettings, setShowSettings] = useState(false);
    const [appVersion, setAppVersion] = useState<VersionInfo | null>(null);


    // Liturgical data guaranteed non-null via fallback
    const [liturgicalData, setLiturgicalData] = useState<LiturgicalDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRosaryCompleted, setIsRosaryCompleted] = useState(false);
    const [isReminderEnabled, setIsReminderEnabled] = useState(false);

    // Bible Progress
    const { missedDays, expectedDay, isDayComplete, bibleStartDate } = useBibleProgress();

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

        // Check settings & completion status
        const reminderSetting = localStorage.getItem('rosary_reminder_enabled') === 'true';
        setIsReminderEnabled(reminderSetting);

        if (reminderSetting) {
            // Check rosary completion status (Flag OR Persistent History)
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;

            const lastCompletedFlag = localStorage.getItem('rosary_last_completed');
            const hasHistoryCompletion = hasCompletionOnDate(todayStr); // Check persistent history

            if (lastCompletedFlag === todayStr || hasHistoryCompletion) {
                setIsRosaryCompleted(true);
                // Sync the flag so next time it's faster
                if (hasHistoryCompletion && lastCompletedFlag !== todayStr) {
                    localStorage.setItem('rosary_last_completed', todayStr);
                }
            } else {
                setIsRosaryCompleted(false);
            }
        } else {
            // Default to OFF (Status Quo)
            setIsRosaryCompleted(false);
        }

        initScreen();
    }, [language, showSettings]);

    // Calculate liturgical color hex for Rosary card styling
    const rosaryColorHex = liturgicalData?.celebrations?.[0]?.colour
        ? getLiturgicalColorHex(liturgicalData.celebrations[0].colour)
        : '#10B981';

    // Determine if we should show the glow (Only if reminder ON and NOT completed)
    const showGlow = isReminderEnabled && !isRosaryCompleted;

    const handleReset = () => {
        localStorage.removeItem('rosary_last_completed');
        setIsRosaryCompleted(false);
        if (onResetProgress) onResetProgress();
    };

    const t = {
        en: {
            title: 'Choose Prayer',
            rosary: 'Holy Rosary',
            rosarySubtitle: 'Mysteries of faith and hope',
            sacredPrayers: 'Sacred Prayers',
            sacredPrayersSubtitle: 'Communion with the Most High',
            dailyReadings: 'Daily Readings',
            dailyReadingsSubtitle: 'The living word of God',
            bibleInAYear: 'Bible in a Year',
            bibleInAYearSubtitle: 'Day {day} of 365',
            settings: 'Settings',
            prayed: 'Prayed'
        },
        es: {
            title: 'Elegir Oración',
            rosary: 'Santo Rosario',
            rosarySubtitle: 'Misterios de fe y esperanza',
            sacredPrayers: 'Oraciones Sagradas',
            sacredPrayersSubtitle: 'Comunión con el Altísimo',
            dailyReadings: 'Lecturas Diarias',
            dailyReadingsSubtitle: 'La palabra viva de Dios',
            bibleInAYear: 'Biblia en un Año',
            bibleInAYearSubtitle: 'Día {day} de 365',
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

                {/* Divider */}
                <div className="decorative-divider">
                    <div className="divider-line divider-line-left"></div>
                    <span className="material-symbols-outlined divider-icon">church</span>
                    <div className="divider-line divider-line-right"></div>
                </div>

                {/* Bible in a Year Card */}
                <button onClick={() => onSelectBibleInYear?.()} className="prayer-card">
                    <div className="card-image-container">
                        <div className="card-image">
                            <img src="/bible_year_icon.png" alt={t.bibleInAYear} />
                        </div>
                    </div>
                    <div className="card-content">
                        <h2 className="card-title">{t.bibleInAYear.toUpperCase()}</h2>
                        <p className="card-subtitle">
                            {(() => {
                                if (!bibleStartDate) return t.bibleInAYearSubtitle.replace('{day}', '1');

                                // Logic:
                                // 1. If missed days exist -> Show first missed day + "X missed"
                                // 2. If expected day is complete -> Show "Day X • Complete"
                                // 3. Else -> Show "Day X of 365"

                                if (missedDays.length > 0) {
                                    const resumeDay = missedDays[0];
                                    return `Resume Day ${resumeDay} (${missedDays.length} missed)`;
                                }

                                if (isDayComplete(expectedDay)) {
                                    return `Day ${expectedDay} • Complete`;
                                }

                                return t.bibleInAYearSubtitle.replace('{day}', expectedDay.toString());
                            })()}
                        </p>
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
                <button
                    onClick={onSelectRosary}
                    className="prayer-card"
                    style={{
                        // When completed or disabled, use default border (undefined)
                        // When reminder active and NOT completed, use colored border
                        border: showGlow ? `1px solid ${rosaryColorHex}` : undefined,
                        boxShadow: showGlow ? `0 0 15px ${rosaryColorHex}40` : 'none',
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
                            backgroundColor: 'rgba(255, 255, 255, 0.05)', // Subtle glassy background
                            border: `1px solid ${rosaryColorHex}`, // Colored border matches text
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 10px ${rosaryColorHex}30` // Subtle glow matching theme
                        }}>
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: '20px',
                                    color: rosaryColorHex // Icon takes the liturgical color (like text)
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
