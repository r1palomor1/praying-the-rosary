
import { CheckCircle, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { prayerData } from '../data/prayerData';
import type { MysterySetType } from '../types';
import './CompletionScreen.css';
import { useEffect } from 'react';

interface CompletionScreenProps {
    onHome: () => void;
    onRestart: () => void;
    mysteryType: MysterySetType;
}

export function CompletionScreen({ onHome, mysteryType }: CompletionScreenProps) {
    const { language, playAudio, audioEnabled } = useApp();

    // Get the mystery name
    const mysteryName = prayerData[language].mysteries_data[mysteryType].name;

    const translations = {
        en: {
            title: 'Rosary Completed',
            subtitle: 'May God bless you for your faithful prayer',
            home: 'Return Home',
            completionAudio: 'Rosary Completed',
            blessing: 'May the Lord bless you and keep you. May His face shine upon you and give you peace. Amen.'
        },
        es: {
            title: 'Rosario Completado',
            subtitle: 'Que Dios te bendiga por tu fiel oración',
            home: 'Volver al Inicio',
            completionAudio: 'Rosario Completado',
            blessing: 'Que el Señor te bendiga y te guarde. Que su rostro brille sobre ti y te dé la paz. Amén.'
        }
    };

    const t = translations[language];

    // Play completion audio when screen mounts
    useEffect(() => {
        if (audioEnabled) {
            const completionMessage = `${t.completionAudio}: ${mysteryName}. ${t.blessing}`;
            // Use female voice for the completion announcement
            playAudio([{ text: completionMessage, gender: 'female' }]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only run once on mount

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

