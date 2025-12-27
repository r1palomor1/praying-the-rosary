import { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SettingsModal } from './SettingsModal';
import './PrayerSelectionScreen.css';

interface PrayerSelectionScreenProps {
    onSelectRosary: () => void;
    onSelectSacredPrayers: () => void;
    onResetProgress?: () => void;
}

export function PrayerSelectionScreen({ onSelectRosary, onSelectSacredPrayers, onResetProgress }: PrayerSelectionScreenProps) {
    const { language } = useApp();
    const [showSettings, setShowSettings] = useState(false);

    const t = {
        en: {
            title: 'Choose Prayer',
            sacredPrayers: 'Sacred Prayers',
            rosary: 'The Rosary',
            back: 'Back',
            settings: 'Settings'
        },
        es: {
            title: 'Elegir Oración',
            sacredPrayers: 'Oraciones Sagradas',
            rosary: 'El Rosario',
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
                    className="icon-btn"
                    onClick={() => setShowSettings(true)}
                    aria-label={t.settings}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem'
                    }}
                >
                    <SettingsIcon size={21} />
                </button>
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2rem',
                padding: '2rem'
            }}>
                <button
                    onClick={onSelectSacredPrayers}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        width: '100%',
                        maxWidth: '380px',
                        height: '245px',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        padding: 0,
                        background: 'none',
                        border: 'none',
                        borderRadius: '16px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0, 0, 0, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <img
                        src="/images/sacred-prayers-bg.jpg"
                        alt="Sacred Prayers"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '135%',
                            height: '115%',
                            objectFit: 'contain',
                            objectPosition: 'center center',
                            borderRadius: '16px'
                        }}
                    />
                    <span style={{
                        fontSize: '1.375rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        color: 'white',
                        zIndex: 2,
                        textShadow: '0 3px 8px rgba(0, 0, 0, 0.9)',
                        padding: '1.25rem 1.5rem',
                        width: '100%',
                        textAlign: 'center',
                        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 70%, transparent 100%)',
                        position: 'relative',
                        borderRadius: '0 0 16px 16px'
                    }}>{t.sacredPrayers}</span>
                </button>

                <button
                    onClick={onSelectRosary}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        width: '100%',
                        maxWidth: '380px',
                        height: '245px',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        padding: 0,
                        background: 'none',
                        border: 'none',
                        borderRadius: '16px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0, 0, 0, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <img
                        src="/images/rosary-bg.jpg"
                        alt="The Rosary"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '135%',
                            height: '115%',
                            objectFit: 'contain',
                            objectPosition: 'center center',
                            borderRadius: '16px'
                        }}
                    />
                    <span style={{
                        fontSize: '1.375rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        color: 'white',
                        zIndex: 2,
                        textShadow: '0 3px 8px rgba(0, 0, 0, 0.9)',
                        padding: '1.25rem 1.5rem',
                        width: '100%',
                        textAlign: 'center',
                        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 70%, transparent 100%)',
                        position: 'relative',
                        borderRadius: '0 0 16px 16px'
                    }}>{t.rosary}</span>
                </button>
            </div>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={handleReset}
            />
        </div>
    );
}

export default PrayerSelectionScreen;
