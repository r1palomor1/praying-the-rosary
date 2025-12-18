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
                <h1>{t.title}</h1>
                <button
                    className="settings-btn-header"
                    onClick={() => setShowSettings(true)}
                    aria-label={t.settings}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        color: 'var(--color-text-primary)',
                        transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <SettingsIcon size={24} strokeWidth={2} />
                </button>
            </div>

            <div className="selection-content">
                <button
                    className="selection-card sacred-prayers-card"
                    onClick={onSelectSacredPrayers}
                >
                    <span className="card-label">{t.sacredPrayers}</span>
                </button>

                <button
                    className="selection-card rosary-card"
                    onClick={onSelectRosary}
                >
                    <span className="card-label">{t.rosary}</span>
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
