import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSacredStats, getSacredCompletionsForMonth, hasSacredCompletionOnDate, getMysteryTypeForDate } from '../utils/sacredHistory';
import './ProgressScreen.css'; // Reusing the same styles as Rosary progress

export function SacredProgressModal() {
    const { language } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());

    const stats = getSacredStats();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const completions = getSacredCompletionsForMonth(currentYear, currentMonth);

    const translations = {
        en: {
            title: 'Your Prayer Journey',
            streak: 'Day Streak',
            total: 'Total Completed',
            bestStreak: 'Best streak',
            thisMonth: 'This month',
            days: 'days',
            times: 'times'
        },
        es: {
            title: 'Tu Camino de Oración',
            streak: 'Días Seguidos',
            total: 'Total Completado',
            bestStreak: 'Mejor racha',
            thisMonth: 'Este mes',
            days: 'días',
            times: 'veces'
        }
    };

    const t = translations[language];

    const monthNames = {
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    };

    const dayNames = {
        en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        es: ['D', 'L', 'M', 'M', 'J', 'V', 'S']
    };

    const getMysteryColor = (mysteryType: string): string => {
        const colors: Record<string, string> = {
            joyful: '#D4AF37',    // Gold
            sorrowful: '#4C6EF5', // Deep Blue
            glorious: '#E5E7EB',  // Silver/White
            luminous: '#FCD34D'   // Soft Yellow
        };
        return colors[mysteryType] || '#D4AF37';
    };

    const getMysteryTextColor = (mysteryType: string): string => {
        const textColors: Record<string, string> = {
            joyful: 'white',
            sorrowful: 'white',
            glorious: '#1F2937',
            luminous: '#1F2937'
        };
        return textColors[mysteryType] || 'white';
    };

    const renderCalendar = () => {
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const days = [];

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day-v2 empty"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            const isCompleted = hasSacredCompletionOnDate(dateStr);
            const mysteryType = isCompleted ? getMysteryTypeForDate(dateStr) : null;

            const today = new Date();
            const isToday = date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();

            days.push(
                <div
                    key={day}
                    className={`calendar-day-v2 ${isToday ? 'today' : ''}`}
                >
                    <span
                        className={`${isCompleted ? '' : 'day-number-v2'} ${isToday && !isCompleted ? 'today-number' : ''}`}
                        style={isCompleted && mysteryType ? {
                            backgroundColor: getMysteryColor(mysteryType),
                            color: getMysteryTextColor(mysteryType),
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: 'var(--font-size-sm)'
                        } : undefined}
                    >
                        {day}
                    </span>
                </div>
            );
        }

        return days;
    };

    const goToPreviousMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    const goToNextMonth = () => {
        const today = new Date();
        if (currentYear < today.getFullYear() || (currentYear === today.getFullYear() && currentMonth < today.getMonth())) {
            setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
        }
    };
    const canGoNext = () => {
        const today = new Date();
        return currentYear < today.getFullYear() || (currentYear === today.getFullYear() && currentMonth < today.getMonth());
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            padding: '16px'
        }}>
            <div style={{
                background: '#1a1a2e',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '512px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh'
            }}>

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-center items-center bg-[#16213e]">
                    <h2 className="text-xl font-serif text-[#D4AF37]" style={{ textAlign: 'center' }}>{t.title}</h2>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 space-y-6 custom-scrollbar">

                    {/* Stats Grid */}
                    <div className="stats-grid-v2">
                        <div className="stat-card-v2 streak-card-v2">
                            <div className="stat-card-header">
                                <span className="stat-emoji">🔥</span>
                                <div className="stat-values">
                                    <div className="stat-value-v2">{t.streak}: {stats.currentStreak}</div>
                                </div>
                            </div>
                            <p className="stat-subtext">
                                {t.bestStreak}: {stats.longestStreak} {t.days}
                            </p>
                        </div>
                        <div className="stat-card-v2 total-card-v2">
                            <div className="stat-card-header">
                                <span className="stat-emoji">✨</span>
                                <div className="stat-values">
                                    <div className="stat-value-v2">{t.total}: {stats.totalCompletions}</div>
                                </div>
                            </div>
                            <p className="stat-subtext">
                                {t.thisMonth}: {completions.length}
                            </p>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="calendar-section-v2">
                        <div className="calendar-header-v2">
                            <button className="month-nav-btn-v2" onClick={goToPreviousMonth}><ChevronLeft size={20} /></button>
                            <h2 className="calendar-month-v2">
                                {monthNames[language][currentMonth].toUpperCase()} {currentYear}
                            </h2>
                            <button className="month-nav-btn-v2" onClick={goToNextMonth} disabled={!canGoNext()}><ChevronRight size={20} /></button>
                        </div>
                        <div className="calendar-grid-v2">
                            {dayNames[language].map((day, i) => (
                                <div key={i} className="calendar-day-header-v2">{day}</div>
                            ))}
                            {renderCalendar()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
