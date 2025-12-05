import React from 'react';
import { X, BookOpen, Heart, Lightbulb, Anchor, History, Sparkles } from 'lucide-react';
import './LearnMoreModal.css';

export interface GlobalContent {
    title: string;
    theological_foundation: string;
    gospel_compendium: string;
}

export interface MysteryContent {
    mystery_name: string;
    mystery_number: number;
    title: string;
    meaning: string;
    scripture_primary: string;
    scripture_secondary: string;
    fruit: string;
    fruit_explanation: string;
    life_application: string;
    meditation: string;
    deeper_theology: string;
    historical_context: string;
    mary_and_christ_role: string;
    virtue_formation: string;
}

export type EducationalContent = GlobalContent | MysteryContent;

interface LearnMoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: EducationalContent | null;
    language: 'en' | 'es';
}

export function LearnMoreModal({ isOpen, onClose, data, language }: LearnMoreModalProps) {
    if (!isOpen || !data) return null;

    const t = language === 'es' ? {
        title: 'Profundizar',
        meaning: 'Significado',
        scripture: 'Sagradas Escrituras',
        fruit: 'Fruto Espiritual',
        meditation: 'Meditación',
        theology: 'Teología Profunda',
        application: 'Aplicación de Vida',
        history: 'Contexto Histórico',
        close: 'Cerrar'
    } : {
        title: 'Learn More',
        meaning: 'Meaning',
        scripture: 'Scripture',
        fruit: 'Spiritual Fruit',
        meditation: 'Meditation',
        theology: 'Deeper Theology',
        application: 'Life Application',
        history: 'Historical Context',
        close: 'Close'
    };

    const [activeTab, setActiveTab] = React.useState<'context' | 'reflection'>('context');

    // Reset tab when data changes
    React.useEffect(() => {
        setActiveTab('context');
    }, [data]);

    const isGlobal = (content: EducationalContent): content is GlobalContent => {
        return 'theological_foundation' in content;
    };

    if (isGlobal(data)) {
        return (
            <div className="learn-more-overlay" onClick={onClose}>
                <div className="learn-more-content" onClick={(e) => e.stopPropagation()}>
                    <header className="learn-more-header">
                        <div className="header-title-container">
                            <Lightbulb className="header-icon" size={24} />
                            <h2>{t.title}</h2>
                        </div>
                        <button className="btn-close-learn-more" onClick={onClose} aria-label={t.close}>
                            <X size={24} />
                        </button>
                    </header>
                    <main className="learn-more-body">
                        <h1 className="mystery-title-large">{data.title}</h1>

                        <div className="global-intro-card">
                            <div className="global-intro-card-header">
                                <Anchor size={20} style={{ color: 'var(--color-text-secondary)' }} />
                                <h2 className="global-intro-card-title">
                                    {language === 'es' ? 'FUNDAMENTO TEOLÓGICO' : 'THEOLOGICAL FOUNDATION'}
                                </h2>
                            </div>
                            <p className="global-intro-text">
                                {data.theological_foundation}
                            </p>
                        </div>

                        <div className="global-intro-card">
                            <div className="global-intro-card-header">
                                <BookOpen size={20} style={{ color: 'var(--color-text-secondary)' }} />
                                <h2 className="global-intro-card-title">
                                    {language === 'es' ? 'COMPENDIO DEL EVANGELIO' : 'GOSPEL COMPENDIUM'}
                                </h2>
                            </div>
                            <p className="global-intro-text">
                                {data.gospel_compendium}
                            </p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="learn-more-overlay" onClick={onClose}>
            <div className="learn-more-content mystery-mode" onClick={(e) => e.stopPropagation()}>
                <header className="learn-more-header">
                    <div className="header-title-container">
                        <Lightbulb className="header-icon" size={24} />
                        <h2>{t.title}</h2>
                    </div>
                    <button className="btn-close-learn-more" onClick={onClose} aria-label={t.close}>
                        <X size={24} />
                    </button>
                </header>

                <main className="learn-more-body">
                    <h1 className="mystery-title-large">{data.title}</h1>

                    <div className="learn-more-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'context' ? 'active' : ''}`}
                            onClick={() => setActiveTab('context')}
                        >
                            {language === 'es' ? 'CONTEXTO' : 'CONTEXT'}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'reflection' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reflection')}
                        >
                            {language === 'es' ? 'REFLEXIÓN' : 'REFLECTION'}
                        </button>
                    </div>

                    {activeTab === 'context' ? (
                        <div className="tab-content fade-in">
                            <section className="highlight-section">
                                <p className="meaning-text">{data.meaning}</p>
                            </section>

                            <div className="space-y-8">
                                <section className="info-card">
                                    <div className="scripture-row">
                                        <div className="card-header">
                                            <BookOpen size={20} />
                                            <h3>{t.scripture}</h3>
                                        </div>
                                        <div className="scripture-refs">
                                            <p>{data.scripture_primary}</p>
                                            {data.scripture_secondary && (
                                                <p>{data.scripture_secondary}</p>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="info-card">
                                    <div className="card-header">
                                        <History size={20} />
                                        <h3>{t.history}</h3>
                                    </div>
                                    <div className="card-body">
                                        <p>{data.historical_context}</p>
                                    </div>
                                </section>

                                <section className="info-card">
                                    <div className="card-header">
                                        <Anchor size={20} />
                                        <h3>{language === 'es' ? 'ROL DE CRISTO Y MARÍA' : 'ROLE OF CHRIST & MARY'}</h3>
                                    </div>
                                    <div className="card-body">
                                        <p>{data.mary_and_christ_role}</p>
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div className="tab-content fade-in">
                            <div className="space-y-8">
                                <section className="info-card" style={{ borderTop: 'none', paddingTop: 0 }}>
                                    <div className="card-header">
                                        <Heart size={20} />
                                        <h3>{t.fruit}: {data.fruit}</h3>
                                    </div>
                                    <div className="card-body">
                                        <p>{data.fruit_explanation}</p>
                                    </div>
                                </section>

                                <section className="info-card">
                                    <div className="card-header">
                                        <Sparkles size={20} />
                                        <h3>{t.meditation}</h3>
                                    </div>
                                    <div className="card-body">
                                        <p>{data.meditation}</p>
                                    </div>
                                </section>

                                <section className="info-card">
                                    <div className="card-header">
                                        <Anchor size={20} />
                                        <h3>{t.theology}</h3>
                                    </div>
                                    <div className="card-body">
                                        <p>{data.deeper_theology}</p>
                                    </div>
                                </section>

                                <section className="application-section">
                                    <div className="card-header">
                                        <BookOpen size={20} />
                                        <h3>{t.application}</h3>
                                    </div>
                                    <div className="card-body">
                                        <p>{data.life_application}</p>
                                    </div>
                                    <div className="virtue-tag">
                                        <span className="label">{language === 'es' ? 'VIRTUD:' : 'VIRTUE:'}</span>
                                        <span className="value">{data.virtue_formation}</span>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
