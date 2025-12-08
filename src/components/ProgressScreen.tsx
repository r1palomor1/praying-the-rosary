import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPrayerStats, getCompletionsForMonth, getMysteryForDate } from '../utils/prayerHistory';
import { BottomNav } from './BottomNav';
import { useNavigationHandler } from '../hooks/useNavigationHandler';
import type { MysterySetType } from '../types';
import './ProgressScreen.css';

interface ProgressScreenProps {
    onNavigateHome: () => void;
    onNavigateToMysteries?: () => void;
    onNavigateToPrayers?: () => void;
    onStartPrayer?: () => void;
}

export function ProgressScreen({ onNavigateHome, onNavigateToMysteries, onNavigateToPrayers, onStartPrayer }: ProgressScreenProps) {
    const { language } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());

    const stats = getPrayerStats();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const completions = getCompletionsForMonth(currentYear, currentMonth);

    const translations = {
        en: {
            title: 'Your Prayer Journey',
            streak: 'Day Streak',
            total: 'Total Rosaries',
            bestStreak: 'Best streak',
            thisMonth: 'This month',
            days: 'days',
            mysteriesPrayed: 'Mysteries Prayed',
            joyful: 'Joyful Mysteries',
            sorrowful: 'Sorrowful Mysteries',
            glorious: 'Glorious Mysteries',
            luminous: 'Luminous Mysteries',
            times: 'times'
        },
        es: {
            title: 'Tu Camino de Oración',
            streak: 'Días Seguidos',
            total: 'Rosarios Totales',
            bestStreak: 'Mejor racha',
            thisMonth: 'Este mes',
            days: 'días',
            mysteriesPrayed: 'Misterios Rezados',
            joyful: 'Misterios Gozosos',
            sorrowful: 'Misterios Dolorosos',
            glorious: 'Misterios Gloriosos',
            luminous: 'Misterios Luminosos',
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

    const getMysteryColor = (mysteryType: MysterySetType): string => {
        const colors = {
            joyful: '#D4AF37',    // Gold
            sorrowful: '#4C6EF5', // Deep Blue
            glorious: '#E5E7EB',  // Silver/White
            luminous: '#FCD34D'   // Soft Yellow
        };
        return colors[mysteryType];
    };

    const getMysteryEmoji = (mysteryType: MysterySetType): string => {
        const emojis = {
            joyful: '👑',
            sorrowful: '✝️',
            glorious: '✨',
            luminous: '💡'
        };
        return emojis[mysteryType];
    };

    const getMysteryTextColor = (mysteryType: MysterySetType): string => {
        // Use dark text for light backgrounds (luminous and glorious)
        // Use white text for dark backgrounds (joyful and sorrowful)
        const textColors = {
            joyful: 'white',      // Gold background - white text
            sorrowful: 'white',   // Blue background - white text
            glorious: '#1F2937',  // Light background - dark text
            luminous: '#1F2937'   // Yellow background - dark text
        };
        return textColors[mysteryType];
    };

    const getMysteryGradient = (mysteryType: MysterySetType): string => {
        const gradients = {
            joyful: 'from-amber-300 to-amber-500',
            sorrowful: 'from-blue-400 to-indigo-600',
            glorious: 'from-gray-200 to-gray-400 dark:from-gray-500 dark:to-gray-300',
            luminous: 'from-yellow-200 to-orange-300'
        };
        return gradients[mysteryType];
    };

    const getMaxCount = () => {
        const counts = Object.values(stats.completionsByMystery);
        return Math.max(...counts, 1); // Avoid division by zero
    };

    const getProgressPercentage = (count: number): number => {
        const max = getMaxCount();
        return (count / max) * 100;
    };

    const renderCalendar = () => {
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day-v2 empty"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            const mysteryType = getMysteryForDate(dateStr);

            // Use local date comparison to avoid timezone issues
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
                        className={`${mysteryType ? '' : 'day-number-v2'} ${isToday && !mysteryType ? 'today-number' : ''}`}
                        style={mysteryType ? {
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

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

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

    // Calculate this month's completions
    const thisMonthCount = completions.length;

    // Navigation handler for BottomNav
    const handleTabChange = useNavigationHandler({
        onNavigateHome,
        onNavigateToProgress: undefined,
        onNavigateToMysteries,
        onNavigateToPrayers
    });

    const handleStartPrayer = () => {
        if (onStartPrayer) {
            onNavigateHome(); // Go to home first, then start prayer
            setTimeout(() => onStartPrayer(), 100);
        }
    };

    return (
        <div className="progress-container-v2">
            <header className="progress-header-v2">
                <h1 className="progress-title-v2">{t.title}</h1>
            </header>

            <main className="progress-main-v2">
                {/* Stats Cards */}
                <div className="stats-grid-v2">
                    {/* Streak Card */}
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

                    {/* Total Card with Gradient */}
                    <div className="stat-card-v2 total-card-v2">
                        <div className="stat-card-header">
                            <span className="stat-emoji">🙏</span>
                            <div className="stat-values">
                                <div className="stat-value-v2">{t.total}: {stats.totalCompletions}</div>
                            </div>
                        </div>
                        <p className="stat-subtext">
                            {t.thisMonth}: {thisMonthCount}
                        </p>
                    </div>
                </div>

                {/* Calendar */}
                <div className="calendar-section-v2">
                    <div className="calendar-header-v2">
                        <button
                            className="month-nav-btn-v2"
                            onClick={goToPreviousMonth}
                            aria-label="Previous month"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="calendar-month-v2">
                            {monthNames[language][currentMonth].toUpperCase()} {currentYear}
                        </h2>
                        <button
                            className="month-nav-btn-v2"
                            onClick={goToNextMonth}
                            disabled={!canGoNext()}
                            aria-label="Next month"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="calendar-grid-v2">
                        {/* Day headers */}
                        {dayNames[language].map((day, index) => (
                            <div key={index} className="calendar-day-header-v2">
                                {day}
                            </div>
                        ))}

                        {/* Calendar days */}
                        {renderCalendar()}
                    </div>
                </div>

                {/* Mystery Breakdown with Progress Bars */}
                <div className="mysteries-section-v2">
                    <h2 className="section-title-v2">{t.mysteriesPrayed}</h2>

                    <div className="mystery-list-v2">
                        {/* Joyful */}
                        <div className="mystery-item-v2">
                            <span className="mystery-emoji-v2">{getMysteryEmoji('joyful')}</span>
                            <div className="mystery-content">
                                <div className="mystery-header">
                                    <span className="mystery-name-v2">{t.joyful}</span>
                                    <span className="mystery-count-v2">
                                        {stats.completionsByMystery.joyful} {t.times}
                                    </span>
                                </div>
                                <div className="progress-bar-container">
                                    <div
                                        className={`progress-bar bg-gradient-to-r ${getMysteryGradient('joyful')}`}
                                        style={{ width: `${getProgressPercentage(stats.completionsByMystery.joyful)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Sorrowful */}
                        <div className="mystery-item-v2">
                            <span className="mystery-emoji-v2">{getMysteryEmoji('sorrowful')}</span>
                            <div className="mystery-content">
                                <div className="mystery-header">
                                    <span className="mystery-name-v2">{t.sorrowful}</span>
                                    <span className="mystery-count-v2">
                                        {stats.completionsByMystery.sorrowful} {t.times}
                                    </span>
                                </div>
                                <div className="progress-bar-container">
                                    <div
                                        className={`progress-bar bg-gradient-to-r ${getMysteryGradient('sorrowful')}`}
                                        style={{ width: `${getProgressPercentage(stats.completionsByMystery.sorrowful)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Glorious */}
                        <div className="mystery-item-v2">
                            <span className="mystery-emoji-v2">{getMysteryEmoji('glorious')}</span>
                            <div className="mystery-content">
                                <div className="mystery-header">
                                    <span className="mystery-name-v2">{t.glorious}</span>
                                    <span className="mystery-count-v2">
                                        {stats.completionsByMystery.glorious} {t.times}
                                    </span>
                                </div>
                                <div className="progress-bar-container">
                                    <div
                                        className={`progress-bar bg-gradient-to-r ${getMysteryGradient('glorious')}`}
                                        style={{ width: `${getProgressPercentage(stats.completionsByMystery.glorious)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Luminous */}
                        <div className="mystery-item-v2">
                            <span className="mystery-emoji-v2">{getMysteryEmoji('luminous')}</span>
                            <div className="mystery-content">
                                <div className="mystery-header">
                                    <span className="mystery-name-v2">{t.luminous}</span>
                                    <span className="mystery-count-v2">
                                        {stats.completionsByMystery.luminous} {t.times}
                                    </span>
                                </div>
                                <div className="progress-bar-container">
                                    <div
                                        className={`progress-bar bg-gradient-to-r ${getMysteryGradient('luminous')}`}
                                        style={{ width: `${getProgressPercentage(stats.completionsByMystery.luminous)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Navigation */}
            <div className="bottom-section">
                <BottomNav
                    activeTab="home"
                    onTabChange={handleTabChange}
                    onStartPrayer={handleStartPrayer}
                    showProgress={false}
                />
            </div>
        </div>
    );
}

export default ProgressScreen;
