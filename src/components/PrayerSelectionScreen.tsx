import { useApp } from '../context/AppContext';
import './PrayerSelectionScreen.css';

interface PrayerSelectionScreenProps {
    onSelectRosary: () => void;
    onSelectSacredPrayers: () => void;
}

export function PrayerSelectionScreen({ onSelectRosary, onSelectSacredPrayers }: PrayerSelectionScreenProps) {
    const { language } = useApp();

    const t = {
        en: {
            title: 'Choose Prayer',
            sacredPrayers: 'Sacred Prayers',
            rosary: 'The Rosary',
            back: 'Back'
        },
        es: {
            title: 'Elegir Oración',
            sacredPrayers: 'Oraciones Sagradas',
            rosary: 'El Rosario',
            back: 'Volver'
        }
    }[language];



    return (
        <div className="selection-container fade-in">
            <div className="selection-header">
                <h1>{t.title}</h1>
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
        </div>
    );
}

export default PrayerSelectionScreen;
