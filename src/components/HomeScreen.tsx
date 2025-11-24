import { useState } from 'react';
import { Play, RotateCcw, Settings as SettingsIcon, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodaysMysterySet, getFormattedDate, getCurrentDay, getMysteryForDay } from '../utils/mysterySelector';
import { hasActiveSession } from '../utils/storage';
import { SettingsModal } from './SettingsModal';
import type { DayOfWeek } from '../types';
import './HomeScreen.css';

interface HomeScreenProps {
    onStartPrayer: () => void;
}

export function HomeScreen({ onStartPrayer }: HomeScreenProps) {
    const { language, currentMysterySet, setCurrentMysterySet, startNewSession, resumeSession } = useApp();
    const [showSettings, setShowSettings] = useState(false);
    const [showDaySelector, setShowDaySelector] = useState(false);

    const hasSession = hasActiveSession();
    const mysterySet = getTodaysMysterySet();

    const translations = {
        en: {
            title: 'Praying the Rosary',
            subtitle: 'Daily Catholic Prayer Guide',
            todaysMystery: "Today's Mystery",
            start: 'Start Praying',
            resume: 'Resume Prayer',
            changeDay: 'Change Day',
            settings: 'Settings',
            days: {
                monday: 'Monday',
                tuesday: 'Tuesday',
                wednesday: 'Wednesday',
                thursday: 'Thursday',
                friday: 'Friday',
                saturday: 'Saturday',
                sunday: 'Sunday'
            },
            mysteries: {
                joyful: 'Joyful Mysteries',
                sorrowful: 'Sorrowful Mysteries',
                glorious: 'Glorious Mysteries',
                luminous: 'Luminous Mysteries'
            }
        },
        es: {
            title: 'Rezando el Rosario',
            subtitle: 'Guía Diaria de Oración Católica',
            todaysMystery: 'Misterio de Hoy',
            start: 'Comenzar a Rezar',
            resume: 'Continuar Oración',
            changeDay: 'Cambiar Día',
            settings: 'Configuración',
            days: {
                monday: 'Lunes',
                tuesday: 'Martes',
                wednesday: 'Miércoles',
                thursday: 'Jueves',
                friday: 'Viernes',
                saturday: 'Sábado',
                sunday: 'Domingo'
            },
            mysteries: {
                joyful: 'Misterios Gozosos',
                sorrowful: 'Misterios Dolorosos',
                glorious: 'Misterios Gloriosos',
                luminous: 'Misterios Luminosos'
            }
        }
    };

    const t = translations[language];
    const currentDate = getFormattedDate(language === 'en' ? 'en-US' : 'es-ES');

    const handleStart = () => {
        startNewSession(currentMysterySet);
        onStartPrayer();
    };

    const handleResume = () => {
        resumeSession();
        onStartPrayer();
    };

    const handleDayChange = (day: DayOfWeek) => {
        const mysteryType = getMysteryForDay(day);
        setCurrentMysterySet(mysteryType);
        setShowDaySelector(false);
    };

    const dayOptions: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div className="home-container">
            <div className="home-header">
                <div className="home-title-section">
                    <h1 className="home-title">{t.title}</h1>
                    <p className="home-subtitle">{t.subtitle}</p>
                </div>

                <button
                    className="btn-icon settings-btn"
                    onClick={() => setShowSettings(true)}
                    aria-label={t.settings}
                >
                    <SettingsIcon size={24} />
                </button>
            </div>

            <div className="home-content">
                <div className="date-card">
                    <Calendar size={24} />
                    <span>{currentDate}</span>
                </div>

                <div className="mystery-card">
                    <h2 className="mystery-label">{t.todaysMystery}</h2>
                    <h3 className="mystery-name">{mysterySet ? mysterySet.name[language] : ''}</h3>

                    <button
                        className="btn-outline change-day-btn"
                        onClick={() => setShowDaySelector(!showDaySelector)}
                    >
                        <Calendar size={20} />
                        {t.changeDay}
                    </button>

                    {showDaySelector && (
                        <div className="day-selector">
                            {dayOptions.map((day) => (
                                <button
                                    key={day}
                                    className={`day-option ${getCurrentDay() === day ? 'current' : ''}`}
                                    onClick={() => handleDayChange(day)}
                                >
                                    <span className="day-name">{t.days[day]}</span>
                                    <span className="day-mystery">{t.mysteries[getMysteryForDay(day)]}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="action-buttons">
                    {hasSession ? (
                        <button className="btn btn-primary" onClick={handleResume}>
                            <RotateCcw size={20} />
                            {t.resume}
                        </button>
                    ) : null}

                    <button className="btn btn-primary" onClick={handleStart}>
                        <Play size={20} />
                        {t.start}
                    </button>
                </div>
            </div>

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </div>
    );
}
