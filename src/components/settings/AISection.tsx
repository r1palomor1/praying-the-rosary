import { Sparkles, Check } from 'lucide-react';
import { useAI } from '../../context/AIContext';

interface AISectionProps {
    translations: {
        aiFeatures: string;
        aiDescription: string;
    };
    currentLanguage: string;
}

export function AISection({ translations, currentLanguage }: AISectionProps) {
    const { aiEnabled, setAiEnabled } = useAI();

    return (
        <div className="settings-section">
            <h3 className="settings-section-title">
                <Sparkles size={18} className="settings-section-icon" />
                {translations.aiFeatures || (currentLanguage === 'es' ? 'Compañero de IA' : 'AI Companion')}
            </h3>

            <div className="settings-card">
                <div 
                    className="settings-row clickable"
                    onClick={() => setAiEnabled(!aiEnabled)}
                >
                    <div className="settings-row-content">
                        <span className="settings-row-title">
                            {translations.aiFeatures || (currentLanguage === 'es' ? 'Habilitar Funciones de IA' : 'Enable AI Features')}
                        </span>
                        <span className="settings-row-subtitle">
                            {translations.aiDescription || (currentLanguage === 'es' 
                                ? 'Proporciona explicaciones espirituales utilizando inteligencia artificial segura y católica.' 
                                : 'Provides spiritual explanations using safe, Catholic AI.')}
                        </span>
                    </div>
                    <div className={`checkbox-circle ${aiEnabled ? 'checked' : ''}`}>
                        {aiEnabled && <Check size={16} strokeWidth={3} />}
                    </div>
                </div>
            </div>
        </div>
    );
}