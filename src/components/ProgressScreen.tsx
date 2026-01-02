import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMysteryForDate } from '../utils/prayerHistory';
import { getAvailableYears, getEnhancedYTDStats, isYearEndArchiveView } from '../utils/yearlyHistory';
import { BottomNav } from './BottomNav';
import { useNavigationHandler } from '../hooks/useNavigationHandler';
import { EnhancedStatsCards } from './EnhancedStatsCards';
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
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Get enhanced YTD stats with MTD breakdown
    const stats = getEnhancedYTDStats(currentYear, currentMonth, 'rosary');
    const availableYears = getAvailableYears('rosary');
    const isArchiveView = isYearEndArchiveView(currentYear, currentMonth);

    const translations = {
        en: {
            title: 'Your Prayer Journey',
            streak: 'Day Streak',
            total: 'Total Rosaries',
            totalYTD: 'Total Rosaries YTD',
            bestStreak: 'Best streak',
            thisMonth: 'This month MTD',
            yearEndMonth: 'Year-End Total',
            days: 'days',
            mysteriesPrayed: 'Mysteries Prayed',
            joyful: 'Joyful Mysteries',
            sorrowful: 'Sorrowful Mysteries',
            glorious: 'Glorious Mysteries',
            luminous: 'Luminous Mysteries',
            times: 'times',
            selectYear: 'Select Year',
            yearEnd: 'Year-End Stats'
        },
        es: {
            title: 'Tu Camino de Oración',
            streak: 'Días Seguidos',
            total: 'Rosarios Totales',
            totalYTD: 'Rosarios Totales ATF',
            bestStreak: 'Mejor racha',
            thisMonth: 'Este mes MTD',
            yearEndMonth: 'Total de Fin de Año',
            days: 'días',
            mysteriesPrayed: 'Misterios Rezados',
            joyful: 'Misterios Gozosos',
            sorrowful: 'Misterios Dolorosos',
            glorious: 'Misterios Gloriosos',
            luminous: 'Misterios Luminosos',
            times: 'veces',
            selectYear: 'Seleccionar Año',
            yearEnd: 'Estadísticas de Fin de Año'
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

            // Determine if we should show the "today" highlight
            // Remove highlight if today's recommended mystery is completed
            // Keep highlight if only other mysteries are completed (as a reminder)
            let showTodayHighlight = isToday;
            if (isToday && mysteryType) {
                // Get today's recommended mystery
                const dayOfWeek = date.getDay();
                const dayToMystery: { [key: number]: MysterySetType } = {
                    0: 'glorious',   // Sunday
                    1: 'joyful',     // Monday
                    2: 'sorrowful',  // Tuesday
                    3: 'glorious',   // Wednesday
                    4: 'luminous',   // Thursday
                    5: 'sorrowful',  // Friday
                    6: 'joyful'      // Saturday
                };
                const todaysRecommendedMystery = dayToMystery[dayOfWeek];

                // Only remove highlight if the completed mystery IS today's recommended mystery
                if (mysteryType === todaysRecommendedMystery) {
                    showTodayHighlight = false;
                }
                // If mysteryType !== todaysRecommendedMystery, keep the highlight (blended look)
            }

            days.push(
                <div
                    key={day}
                    className={`calendar-day-v2 ${showTodayHighlight ? 'today' : ''}`}
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
                {/* Enhanced Stats Cards */}
                <EnhancedStatsCards
                    ytdTotal={stats.totalCompletions}
                    ytdCurrentStreak={stats.currentStreak}
                    ytdBestStreak={stats.bestStreak}
                    ytdProgress={stats.yearProgress}
                    ytdGoal={stats.daysInYear}
                    mtdTotal={stats.mtdTotal}
                    mtdCurrentStreak={stats.mtdCurrentStreak}
                    mtdBestStreak={stats.mtdBestStreak}
                    mtdProgress={stats.monthProgress}
                    mtdGoal={stats.daysInMonth}
                    yearOverYearPercent={stats.yearOverYearPercent}
                    year={currentYear}
                    monthName={monthNames[language][currentMonth]}
                    language={language}
                />

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

                        <div className="calendar-header-inline">
                            <h2 className="calendar-month-v2">
                                {monthNames[language][currentMonth].toUpperCase()}
                                {isArchiveView && <span className="text-sm opacity-75"> - {t.yearEnd}</span>}
                            </h2>

                            {/* Inline Year Selector */}
                            {availableYears.length > 1 && (
                                <select
                                    value={selectedYear || currentYear}
                                    onChange={(e) => {
                                        const year = parseInt(e.target.value);
                                        setSelectedYear(year);
                                        // Default to December for past years, current month for current year
                                        const today = new Date();
                                        const targetMonth = year < today.getFullYear() ? 11 : today.getMonth();
                                        setCurrentDate(new Date(year, targetMonth, 1));
                                    }}
                                    className="year-selector-inline"
                                    aria-label={t.selectYear}
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
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
