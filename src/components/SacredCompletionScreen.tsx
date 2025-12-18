import { useEffect } from 'react';
import { Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { saveSacredCompletion } from '../utils/sacredHistory';
import './CompletionScreen.css';

interface SacredCompletionScreenProps {
    onHome: () => void;
}

export default function SacredCompletionScreen({ onHome }: SacredCompletionScreenProps) {
    const { language } = useApp();

    useEffect(() => {
        saveSacredCompletion();
        // Also clear progress (already handled by logic, but ensuring cleanup)
    }, []);

    const t = language === 'es' ? {
        title: 'Oraciones Sagradas Completadas',
        subtitle: 'Que Dios te bendiga por tu fiel oración',
        home: 'Volver al Menú'
    } : {
        title: 'Sacred Prayers Completed',
        subtitle: 'May God bless you for your faithful prayer',
        home: 'Return to Menu'
    };

    return (
        <div className="completion-container fade-in">
            <div className="completion-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h1 className="completion-title">{t.title}</h1>
                <p className="completion-subtitle">{t.subtitle}</p>

                <div className="completion-actions">
                    <button className="btn" onClick={onHome}>
                        <Home size={20} style={{ marginRight: '8px' }} />
                        <span className="btn-label">{t.home}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
