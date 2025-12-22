import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

interface MysteryNavigationProps {
    onHome: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onLearnMore: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
    hasEducationalContent: boolean;
    language: 'en' | 'es';
}

export function MysteryNavigation({
    onHome,
    onPrevious,
    onNext,
    onLearnMore,
    isFirstStep,
    isLastStep,
    hasEducationalContent,
    language
}: MysteryNavigationProps) {
    const t = language === 'es' ? {
        back: 'Inicio',
        previous: 'Anterior',
        next: 'Siguiente',
        finish: 'Finalizar',
        learnMore: 'Profundizar'
    } : {
        back: 'Home',
        previous: 'Previous',
        next: 'Next',
        finish: 'Finish',
        learnMore: 'Learn More'
    };

    return (
        <div className="bottom-section">
            <div className="mystery-bottom-nav">
                <button
                    className="mystery-nav-btn"
                    onClick={onHome}
                    aria-label={t.back}
                    title={t.back}
                >
                    <span className="material-icons">home</span>
                    <span className="mystery-nav-label">{t.back}</span>
                </button>

                <div className="mystery-nav-center">
                    <button
                        className="mystery-nav-btn"
                        onClick={onPrevious}
                        disabled={isFirstStep}
                        aria-label={t.previous}
                        title={t.previous}
                    >
                        <ChevronLeft size={24} strokeWidth={3} />
                        <span className="mystery-nav-label">{t.previous}</span>
                    </button>

                    <button
                        className="mystery-nav-btn"
                        onClick={onNext}
                        disabled={isLastStep}
                        aria-label={isLastStep ? t.finish : t.next}
                        title={isLastStep ? t.finish : t.next}
                    >
                        <ChevronRight size={24} strokeWidth={3} />
                        <span className="mystery-nav-label">{isLastStep ? t.finish : t.next}</span>
                    </button>
                </div>

                <button
                    className={`mystery-nav-btn ${!hasEducationalContent ? 'nav-btn-dimmed' : ''}`}
                    onClick={() => hasEducationalContent && onLearnMore()}
                    disabled={!hasEducationalContent}
                    aria-label={t.learnMore}
                    title={t.learnMore}
                >
                    <Lightbulb size={24} strokeWidth={3} />
                    <span className="mystery-nav-label">{t.learnMore}</span>
                </button>
            </div>
        </div>
    );
}
