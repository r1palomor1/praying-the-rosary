import { Sparkles } from 'lucide-react';
import { useAI } from '../../context/AIContext';

interface AISectionProps {
    translations: any;
    currentLanguage: string;
}

export function AISection({ translations, currentLanguage }: AISectionProps) {
    const { aiEnabled, setAiEnabled } = useAI();
    const isEs = currentLanguage === 'es';

    return (
        <section>
            <h2 className="settings-section-header">
                {translations.aiFeatures || (isEs ? 'Compañero de IA' : 'AI Companion')}
            </h2>

            <div className="settings-card">
                <button 
                    className="settings-list-item"
                    onClick={() => setAiEnabled(!aiEnabled)}
                    style={{ borderBottom: 'none' }}
                >
                    <div className="settings-item-left">
                        <Sparkles className="settings-icon" size={20} style={{ color: aiEnabled ? '#D4AF37' : '#888' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                            <span className="settings-item-label">
                                {translations.aiFeatures || (isEs ? 'Habilitar Compañero' : 'Enable AI Features')}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--settings-text-muted)', marginTop: '2px', lineHeight: '1.2' }}>
                                {translations.aiDescription || (isEs 
                                    ? 'Proporciona explicaciones utilizando tecnología segura y católica.' 
                                    : 'Provides spiritual explanations using safe, Catholic tech.')}
                            </span>
                        </div>
                    </div>
                    <div className="settings-item-right">
                        <div 
                            style={{
                                width: '40px',
                                height: '22px',
                                borderRadius: '12px',
                                backgroundColor: aiEnabled ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                                position: 'relative',
                                transition: 'background-color 0.2s',
                                flexShrink: 0
                            }}
                        >
                            <div 
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    backgroundColor: aiEnabled ? '#1a1a1a' : '#888',
                                    position: 'absolute',
                                    top: '2px',
                                    left: aiEnabled ? '20px' : '2px',
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            />
                        </div>
                    </div>
                </button>
            </div>
        </section>
    );
}