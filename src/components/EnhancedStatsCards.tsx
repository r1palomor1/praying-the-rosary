import { TrendingUp, TrendingDown, Flame, Calendar } from 'lucide-react';
import './EnhancedStatsCards.css';

interface EnhancedStatsCardsProps {
    ytdTotal: number;
    ytdCurrentStreak: number;
    ytdBestStreak: number;
    ytdProgress: number;
    ytdGoal: number;
    ytdLastYear: number;
    mtdTotal: number;
    mtdCurrentStreak: number;
    mtdBestStreak: number;
    mtdProgress: number;
    mtdGoal: number;
    mtdLastYear: number;
    yearOverYearPercent: number | null;
    year: number;
    monthName: string;
    language: 'en' | 'es';
    prayerType?: 'rosaries' | 'prayers';
}

export function EnhancedStatsCards({
    ytdTotal,
    ytdBestStreak,
    ytdProgress,
    ytdGoal,
    ytdLastYear,
    mtdTotal,
    mtdCurrentStreak,
    mtdProgress,
    mtdGoal,
    mtdLastYear,
    yearOverYearPercent,
    year,
    monthName,
    language,
    prayerType = 'rosaries'
}: EnhancedStatsCardsProps) {

    const t = {
        en: {
            ytd: 'YEAR TO DATE',
            mtd: 'CURRENT MONTH',
            total: prayerType === 'rosaries' ? 'Total Rosaries' : 'Total Prayers',
            monthly: prayerType === 'rosaries' ? 'Monthly Rosaries' : 'Monthly Prayers',
            longestStreak: 'Longest Streak',
            activeStreak: 'Active Streak',
            annualGoal: 'Annual Goal',
            monthlyGoal: 'Monthly Goal',
            target: 'Target',
            rosariesBy: prayerType === 'rosaries' ? 'Rosaries by' : 'Prayers by',
            vsPreviousYear: 'vs. Last Year',
            days: 'Days',
            daysLeft: 'Days Left',
            keepGoing: 'Keep it going!',
            bestIn: 'Best in'
        },
        es: {
            ytd: 'AÑO HASTA LA FECHA',
            mtd: 'MES ACTUAL',
            total: prayerType === 'rosaries' ? 'Rosarios Totales' : 'Oraciones Totales',
            monthly: prayerType === 'rosaries' ? 'Rosarios Mensuales' : 'Oraciones Mensuales',
            longestStreak: 'Racha Más Larga',
            activeStreak: 'Racha Activa',
            annualGoal: 'Meta Anual',
            monthlyGoal: 'Meta Mensual',
            target: 'Meta',
            rosariesBy: prayerType === 'rosaries' ? 'Rosarios para' : 'Oraciones para',
            vsPreviousYear: 'vs. Año Pasado',
            days: 'Días',
            daysLeft: 'Días Restantes',
            keepGoing: '¡Sigue así!',
            bestIn: 'Mejor en'
        }
    }[language];


    const yoyPositive = yearOverYearPercent && yearOverYearPercent > 0;
    const monthAbbr = monthName.substring(0, 3);
    const lastDayOfMonth = new Date(year, new Date().getMonth() + 1, 0).getDate();

    // Calculate total days for targets (based on full year/month)
    const totalDaysInYear = 365; // Could be 366 for leap years
    const totalDaysInMonth = lastDayOfMonth;

    return (
        <div className="enhanced-stats-container-v2">
            {/* YTD Section */}
            <div className="stats-section ytd-section">
                <div className="section-header">
                    <Calendar size={18} />
                    <h3>{t.ytd}</h3>
                </div>

                <div className="stats-row">
                    {/* Total */}
                    <div className="stat-col">
                        <span className="stat-label">{t.total}</span>
                        <div className="stat-value-group">
                            <span className="stat-value">{ytdTotal}</span>
                            <div className={`yoy-badge ${yoyPositive ? 'positive' : 'negative'}`}>
                                {yoyPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span>{yoyPositive ? '+' : ''}{yearOverYearPercent || 0}%</span>
                            </div>
                        </div>
                        <span className="stat-sublabel">{t.vsPreviousYear} ({ytdLastYear})</span>
                    </div>

                    {/* Longest Streak */}
                    <div className="stat-col divider-left">
                        <span className="stat-label">{t.longestStreak}</span>
                        <div className="stat-value-group">
                            <span className="stat-value">{ytdBestStreak}</span>
                            <span className="stat-unit">{t.days}</span>
                        </div>
                    </div>

                    {/* Annual Goal */}
                    <div className="stat-col divider-left">
                        <div className="goal-header-inline">
                            <span className="stat-label">{t.annualGoal}</span>
                            <span className="goal-percent">{ytdProgress}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill ytd-fill" style={{ width: `${Math.min(ytdProgress, 100)}%` }}></div>
                        </div>
                        <div className="goal-details-stacked">
                            <span>{t.daysLeft}: {ytdGoal - ytdTotal}</span>
                            <span>{t.target}: {totalDaysInYear} days by Dec 31</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MTD Section */}
            <div className="stats-section mtd-section">
                <div className="section-header">
                    <Calendar size={18} />
                    <h3>{t.mtd}</h3>
                </div>

                <div className="stats-row">
                    {/* Total */}
                    <div className="stat-col">
                        <span className="stat-label">{t.monthly}</span>
                        <div className="stat-value-group">
                            <span className="stat-value">{mtdTotal}</span>
                            <div className={`yoy-badge ${yoyPositive ? 'positive' : 'negative'}`}>
                                {yoyPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span>{yoyPositive ? '+' : ''}{yearOverYearPercent || 0}%</span>
                            </div>
                        </div>
                        <span className="stat-sublabel">{t.vsPreviousYear} ({mtdLastYear})</span>
                    </div>

                    {/* Active Streak */}
                    <div className="stat-col divider-left">
                        <span className="stat-label">{t.activeStreak}</span>
                        <div className="stat-value-group">
                            <span className="stat-value">{mtdCurrentStreak}</span>
                            <span className="stat-unit">{t.days}</span>
                        </div>
                        {mtdCurrentStreak > 0 && (
                            <div className="streak-encouragement">
                                <Flame size={14} className="flame-icon" />
                                <span>{t.keepGoing}</span>
                            </div>
                        )}
                    </div>

                    {/* Monthly Goal */}
                    <div className="stat-col divider-left">
                        <div className="goal-header-inline">
                            <span className="stat-label">{t.monthlyGoal}</span>
                            <span className="goal-percent">{mtdProgress}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill mtd-fill" style={{ width: `${Math.min(mtdProgress, 100)}%` }}></div>
                        </div>
                        <div className="goal-details-stacked">
                            <span>{t.daysLeft}: {mtdGoal - mtdTotal}</span>
                            <span>{t.target}: {totalDaysInMonth} days by {monthAbbr} {lastDayOfMonth}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
