
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMysterySet } from '../utils/mysterySelector';
import { prayers } from '../data/prayers';
import { BeadCounter } from './BeadCounter.tsx';
import './MysteryScreen.css';

interface MysteryScreenProps {
    onComplete: () => void;
    onBack: () => void;
}

export function MysteryScreen({ onComplete, onBack }: MysteryScreenProps) {
    const {
        language,
        currentMysterySet,
        currentMysteryNumber,
        setCurrentMysteryNumber,
        currentBeadNumber,
        setCurrentBeadNumber,
        isPlaying,
        playAudio,
        stopAudio,
        audioEnabled
    } = useApp();

    const mysterySet = getMysterySet(currentMysterySet);
    const mystery = mysterySet?.mysteries[currentMysteryNumber - 1];

    const translations = {
        en: {
            mysteryOf: 'Mystery',
            ourFather: 'Our Father',
            hailMary: 'Hail Mary',
            gloryBe: 'Glory Be',
            oMyJesus: 'O My Jesus',
            previous: 'Previous',
            next: 'Next',
            complete: 'Complete Rosary',
            scripture: 'Scripture',
            reflection: 'Reflection'
        },
        es: {
            mysteryOf: 'Misterio',
            ourFather: 'Padre Nuestro',
            hailMary: 'Ave María',
            gloryBe: 'Gloria',
            oMyJesus: 'Oh Jesús Mío',
            previous: 'Anterior',
            next: 'Siguiente',
            complete: 'Completar Rosario',
            scripture: 'Escritura',
            reflection: 'Reflexión'
        }
    };

    const t = translations[language];

    if (!mystery) return null;

    const handleNext = () => {
        if (currentBeadNumber < 10) {
            setCurrentBeadNumber(currentBeadNumber + 1);
        } else if (currentMysteryNumber < 5) {
            setCurrentMysteryNumber(currentMysteryNumber + 1);
            setCurrentBeadNumber(0);
        } else {
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentBeadNumber > 0) {
            setCurrentBeadNumber(currentBeadNumber - 1);
        } else if (currentMysteryNumber > 1) {
            setCurrentMysteryNumber(currentMysteryNumber - 1);
            setCurrentBeadNumber(10);
        }
    };

    const getCurrentPrayer = () => {
        if (currentBeadNumber === 0) {
            return prayers.sequence.ourFather.text[language];
        } else if (currentBeadNumber <= 10) {
            return prayers.sequence.hailMary.text[language];
        }
        return '';
    };

    const getCurrentPrayerName = () => {
        if (currentBeadNumber === 0) return t.ourFather;
        if (currentBeadNumber <= 10) return `${t.hailMary} (${currentBeadNumber}/10)`;
        return '';
    };

    const handlePlayAudio = () => {
        if (isPlaying) {
            stopAudio();
        } else {
            const text = getCurrentPrayer();
            playAudio(text);
        }
    };

    return (
        <div className="mystery-screen-container">
            <div className="mystery-screen-header">
                <button className="btn-icon" onClick={onBack} aria-label={t.previous}>
                    <ChevronLeft size={24} />
                </button>
                <div className="mystery-progress">
                    <span>{t.mysteryOf} {currentMysteryNumber} / 5</span>
                </div>
                <div className="mystery-header-spacer" />
            </div>

            <div className="mystery-screen-content">
                <div className="mystery-intro">
                    <h2 className="mystery-title">{mystery.title[language]}</h2>

                    <div className="mystery-image-container">
                        <div className="mystery-image-placeholder">
                            <span className="mystery-number">{currentMysteryNumber}</span>
                        </div>
                    </div>

                    <div className="scripture-section">
                        <h3 className="section-label">{t.scripture}</h3>
                        <p className="scripture-reference">{mystery.scripture[language].reference}</p>
                        <p className="scripture-text">{mystery.scripture[language].text}</p>
                    </div>

                    <div className="reflection-section">
                        <h3 className="section-label">{t.reflection}</h3>
                        <p className="reflection-text">{mystery.reflection[language]}</p>
                    </div>
                </div>

                <div className="prayer-section">
                    <div className="prayer-header">
                        <h3 className="prayer-name">{getCurrentPrayerName()}</h3>
                        {audioEnabled && (
                            <button
                                className="btn-icon audio-btn"
                                onClick={handlePlayAudio}
                                aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
                            >
                                {isPlaying ? <VolumeX size={24} /> : <Volume2 size={24} />}
                            </button>
                        )}
                    </div>

                    <p className="prayer-text">{getCurrentPrayer()}</p>

                    <BeadCounter
                        currentBead={currentBeadNumber}
                        onBeadClick={(bead: number) => setCurrentBeadNumber(bead)}
                    />
                </div>

                <div className="navigation-buttons">
                    <button
                        className="btn btn-outline"
                        onClick={handlePrevious}
                        disabled={currentMysteryNumber === 1 && currentBeadNumber === 0}
                    >
                        <ChevronLeft size={20} />
                        {t.previous}
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={handleNext}
                    >
                        {currentMysteryNumber === 5 && currentBeadNumber === 10 ? t.complete : t.next}
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
