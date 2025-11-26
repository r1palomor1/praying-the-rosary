
import { CheckCircle, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './CompletionScreen.css';

interface CompletionScreenProps {
    onHome: () => void;
    onRestart: () => void;
}

export function CompletionScreen({ onHome }: CompletionScreenProps) {
    const { language } = useApp();

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

                <h1 className="completion-title">{t.title}</h1>
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
