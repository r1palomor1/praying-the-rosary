
import { useEffect, useRef } from 'react';
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
    const { language, playAudio } = useApp();

    // Get the mystery name safely
    const mysteryData = prayerData[language]?.mysteries_data?.[mysteryType];
    const mysteryName = mysteryData ? mysteryData.name : '';

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

    const hasPlayedRef = useRef(false);

    // Play completion audio on mount
    useEffect(() => {
        if (!hasPlayedRef.current) {
            const text = mysteryName
                ? `${t.title}. ${mysteryName}. ${t.subtitle}`
                : `${t.title}. ${t.subtitle}`;
            playAudio([{ text, gender: 'female' }]);
            hasPlayedRef.current = true;
        }
    }, [language, playAudio, t.title, t.subtitle, mysteryName]);

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
