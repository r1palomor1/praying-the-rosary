import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import type { MysteryType } from '../utils/prayerFlowEngine';
import './MysteryScreen.css';

interface MysteryScreenProps {
    onComplete: () => void;
    onBack: () => void;
}

export function MysteryScreen({ onComplete, onBack }: MysteryScreenProps) {
    const {
        language,
        currentMysterySet,
        isPlaying,
        playAudio,
        stopAudio,
        audioEnabled
    } = useApp();

    const [flowEngine] = useState(() => new PrayerFlowEngine(currentMysterySet as MysteryType, language));
    const [currentStep, setCurrentStep] = useState(flowEngine.getCurrentStep());

    // Update language when it changes
    useEffect(() => {
        flowEngine.setLanguage(language);
        setCurrentStep(flowEngine.getCurrentStep());
    }, [language, flowEngine]);

    const handleNext = () => {
        const nextStep = flowEngine.getNextStep();
        if (nextStep) {
            setCurrentStep(nextStep);
            if (nextStep.type === 'complete') {
                onComplete();
            }
        }
    };

    const handlePrevious = () => {
        const prevStep = flowEngine.getPreviousStep();
        if (prevStep) {
            setCurrentStep(prevStep);
        }
    };

    const handlePlayAudio = () => {
        if (isPlaying) {
            stopAudio();
        } else {
            playAudio(currentStep.text);
        }
    };

    const t = language === 'es' ? {
        back: 'Volver',
        step: 'Paso',
        of: 'de',
        previous: 'Anterior',
        next: 'Siguiente',
        finish: 'Finalizar',
        stopAudio: 'Detener audio',
        playAudio: 'Reproducir audio',
        reflection: 'Reflexión',
        mystery: 'Misterio',
        mysteryOrdinal: 'º'
    } : {
        back: 'Back',
        step: 'Step',
        of: 'of',
        previous: 'Previous',
        next: 'Next',
        finish: 'Finish',
        stopAudio: 'Stop audio',
        playAudio: 'Play audio',
        reflection: 'Reflection',
        mystery: 'Mystery',
        mysteryOrdinal: ''
    };

    const getStepTypeLabel = (): string => {
        const decadeInfo = flowEngine.getCurrentDecadeInfo();
        if (decadeInfo) {
            return `${decadeInfo.number}${t.mysteryOrdinal} ${t.mystery}`;
        }
        return '';
    };

    const renderStepContent = () => {
        const step = currentStep;

        // Special rendering for decade announcement
        if (step.type === 'decade_announcement') {
            const decadeInfo = flowEngine.getCurrentDecadeInfo();
            return (
                <div className="mystery-intro">
                    <div className="mystery-badge">{getStepTypeLabel()}</div>
                    <h2 className="mystery-title">{decadeInfo?.title}</h2>

                    <div className="mystery-image-container">
                        <div className="mystery-image-placeholder">
                            <span className="mystery-number">{step.decadeNumber}</span>
                        </div>
                    </div>

                    <div className="reflection-section">
                        <h3 className="section-label">{t.reflection}</h3>
                        <p className="reflection-text">{step.text}</p>
                    </div>
                </div>
            );
        }

        // Special rendering for litany (call and response format)
        if (step.type === 'litany_of_loreto') {
            const lines = step.text.split('\n');
            return (
                <div className="litany-content">
                    <div className="litany-call">{lines[0]}</div>
                    <div className="litany-response">{lines[1]}</div>
                </div>
            );
        }

        // Special rendering for final Hail Mary intros
        if (step.type === 'final_hail_mary_intro') {
            const parts = step.text.split('\n\n');
            return (
                <div className="final-hail-mary-content">
                    <div className="invocation-text">{parts[0]}</div>
                    <div className="prayer-text-main">{parts[1]}</div>
                </div>
            );
        }

        // Default rendering for all other prayers
        return (
            <div className="prayer-content">
                <p className="prayer-text-main">{step.text}</p>
            </div>
        );
    };

    const renderBeadCounter = () => {
        const step = currentStep;

        // Show bead counter only for Hail Marys within decades
        if (step.type === 'decade_hail_mary' && step.hailMaryNumber) {
            return (
                <div className="bead-counter">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bead) => (
                        <div
                            key={bead}
                            className={`bead ${bead <= step.hailMaryNumber! ? 'bead-active' : ''}`}
                        />
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mystery-screen-container">
            <div className="mystery-screen-header">
                <button className="btn-icon" onClick={onBack} aria-label={t.back}>
                    <Home size={24} />
                </button>
                <div className="mystery-progress">
                    <div className="mystery-set-name">{flowEngine.getMysteryName()}</div>
                    <div className="progress-info">
                        {t.step} {flowEngine.getCurrentStepNumber()} {t.of} {flowEngine.getTotalSteps()}
                    </div>
                </div>
                <div className="mystery-header-spacer" />
            </div>

            <div className="progress-bar-container">
                <div
                    className="progress-bar-fill"
                    style={{ '--progress': `${flowEngine.getProgress()}%` } as React.CSSProperties}
                />
            </div>

            <div className="mystery-screen-content">
                <div className="prayer-section">
                    <div className="prayer-header">
                        <h3 className="prayer-name">{currentStep.title}</h3>
                        {audioEnabled && (
                            <button
                                className="btn-icon audio-btn"
                                onClick={handlePlayAudio}
                                aria-label={isPlaying ? t.stopAudio : t.playAudio}
                            >
                                {isPlaying ? <VolumeX size={24} /> : <Volume2 size={24} />}
                            </button>
                        )}
                    </div>

                    {renderStepContent()}
                    {renderBeadCounter()}
                </div>

                <div className="navigation-buttons">
                    <button
                        className="btn btn-outline"
                        onClick={handlePrevious}
                        disabled={flowEngine.isFirstStep()}
                    >
                        <ChevronLeft size={20} />
                        {t.previous}
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={handleNext}
                        disabled={flowEngine.isLastStep()}
                    >
                        {flowEngine.isLastStep() ? t.finish : t.next}
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
