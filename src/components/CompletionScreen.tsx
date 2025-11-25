
import { CheckCircle, Home, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { prayers } from '../data/prayers';
import './CompletionScreen.css';

interface CompletionScreenProps {
    onHome: () => void;
    onRestart: () => void;
}

export function CompletionScreen({ onHome, onRestart }: CompletionScreenProps) {
    const { language } = useApp();

    const translations = {
        en: {
            title: 'Rosary Completed',
            subtitle: 'May God bless you for your faithful prayer',
            closingPrayers: 'Closing Prayers',
            hailHolyQueen: 'Hail Holy Queen',
            finalPrayer: 'Final Prayer',
            signOfTheCross: 'Sign of the Cross',
            home: 'Return Home',
            restart: 'Pray Again'
        },
        es: {
            title: 'Rosario Completado',
            subtitle: 'Que Dios te bendiga por tu fiel oración',
            closingPrayers: 'Oraciones Finales',
            hailHolyQueen: 'Salve Regina',
            finalPrayer: 'Oración Final',
            signOfTheCross: 'Señal de la Cruz',
            home: 'Volver al Inicio',
            restart: 'Rezar de Nuevo'
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

                <div className="closing-prayers-section">
                    <h2 className="section-title">{t.closingPrayers}</h2>

                    <div className="prayer-card">
                        <h3 className="prayer-title">{prayers.closing.hailHolyQueen.name[language]}</h3>
                        <p className="prayer-text">{prayers.closing.hailHolyQueen.text[language]}</p>
                    </div>

                    <div className="prayer-card">
                        <h3 className="prayer-title">{prayers.closing.litany.name[language]}</h3>
                        <p className="prayer-text" style={{ whiteSpace: 'pre-line' }}>{prayers.closing.litany.text[language]}</p>
                    </div>

                    <div className="prayer-card">
                        <h3 className="prayer-title">{prayers.closing.finalPrayer.name[language]}</h3>
                        <p className="prayer-text">{prayers.closing.finalPrayer.text[language]}</p>
                    </div>

                    <div className="prayer-card">
                        <h3 className="prayer-title">{prayers.closing.signOfTheCross.name[language]}</h3>
                        <p className="prayer-text">{prayers.closing.signOfTheCross.text[language]}</p>
                    </div>
                </div>

                <div className="completion-actions">
                    <button className="btn btn-outline" onClick={onHome}>
                        <Home size={20} />
                        {t.home}
                    </button>

                    <button className="btn btn-primary" onClick={onRestart}>
                        <RotateCcw size={20} />
                        {t.restart}
                    </button>
                </div>
            </div>
        </div>
    );
}
