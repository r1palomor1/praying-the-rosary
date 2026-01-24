
import { useApp } from '../context/AppContext';
import { getLiturgicalColorHex, getSeasonName, type LiturgicalDay } from '../utils/liturgicalCalendar';
import './LiturgicalCard.css';

interface LiturgicalCardProps {
    dayData: LiturgicalDay; // Required prop
}

export function LiturgicalCard({ dayData }: LiturgicalCardProps) {
    const { language } = useApp();
    // No internal state or fetching. Pure presentation.

    // Safety check (though parent ensures data exists)
    if (!dayData || !dayData.celebrations || dayData.celebrations.length === 0) return null;

    const primaryCelebration = dayData.celebrations[0];
    const colorHex = getLiturgicalColorHex(primaryCelebration.colour);

    return (
        <div className="liturgical-container">
            {/* Season Name */}
            <div className="liturgical-season-large" style={{ color: colorHex }}>
                {getSeasonName(dayData.season, language)}
            </div>

            {/* Top Divider */}
            <div className="church-divider" style={{ opacity: 0.8, margin: '0.2rem 0 0.2rem 0' }}>
                <div
                    className="divider-line"
                    style={{ background: `linear-gradient(to right, transparent, ${colorHex})` }}
                ></div>
                <span
                    className="material-symbols-outlined divider-icon"
                    style={{ color: colorHex }}
                >
                    church
                </span>
                <div
                    className="divider-line"
                    style={{ background: `linear-gradient(to left, transparent, ${colorHex})` }}
                ></div>
            </div>

            {/* Date */}
            <div className="liturgical-date-simple">
                {(() => {
                    // Explicitly parse YYYY-MM-DD to local time to avoid UTC timezone shifts
                    const [year, month, day] = dayData.date.split('-').map(Number);
                    const localDate = new Date(year, month - 1, day);
                    return localDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                    });
                })()}
            </div>

            {/* Feast Name */}
            <div className="liturgical-feast-name" style={{ color: colorHex }}>
                {primaryCelebration.title}
            </div>

            {/* Bottom Divider */}
            <div className="church-divider" style={{ opacity: 0.8, margin: '0.5rem 0' }}>
                <div
                    className="divider-line"
                    style={{ background: `linear-gradient(to right, transparent, ${colorHex})` }}
                ></div>
                <span
                    className="material-symbols-outlined divider-icon"
                    style={{ color: colorHex }}
                >
                    church
                </span>
                <div
                    className="divider-line"
                    style={{ background: `linear-gradient(to left, transparent, ${colorHex})` }}
                ></div>
            </div>
        </div>
    );
}
