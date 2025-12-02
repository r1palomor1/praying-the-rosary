
import { CheckCircle, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { prayerData } from '../data/prayerData';
import type { MysterySetType } from '../types';
import './CompletionScreen.css';

interface CompletionScreenProps {
    onHome: () => void;
    onRestart: () => void;
    mysteryType: MysterySetType;
}

export function CompletionScreen({ onHome, mysteryType }: CompletionScreenProps) {
    const { language } = useApp();

    // Get the mystery name
    const mysteryName = prayerData[language].mysteries_data[mysteryType].name;

    const translations = {
        en: {
            title: 'Rosary Completed',
            subtitle: 'May God bless you for your faithful prayer',
            home: 'Return Home'
        },
        es: {
            title: 'Rosario Completado',
            subtitle: 'Que Dios te bendiga por tu fiel oración',
            home: 'Volver al Inicio'
        }
    };

    const t = translations[language];

    return (
        <div className="completion-container">
            <div className="completion-content">
                <div className="completion-icon">
                    <CheckCircle size={80} />
                </div>

                <h1 className="completion-title">{t.title}: {mysteryName}</h1>
                <p className="completion-subtitle">{t.subtitle}</p>

                <div className="completion-actions">
                    <button className="btn btn-outline" onClick={onHome}>
                        <Home size={20} />
                        {t.home}
                    </button>
                </div>
            </div>
        </div>
    );
}
