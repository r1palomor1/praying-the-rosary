import { Info } from 'lucide-react';

interface ProgressTrackingSectionProps {
    rosaryStartDate: string;
    sacredStartDate: string;
    onEditClick: () => void;
    translations: {
        progressTracking: string;
        startDateTooltip: string;
    };
    language: 'en' | 'es';
}

export function ProgressTrackingSection({
    rosaryStartDate,
    onEditClick,
    translations,
    language
}: ProgressTrackingSectionProps) {
    // Format date for display
    const formatDate = (dateStr: string) => {
        if (!dateStr) return language === 'es' ? 'Hoy' : 'Today';

        // Parse as UTC to avoid timezone issues
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[date.getUTCMonth()];
        const dayNum = String(date.getUTCDate()).padStart(2, '0');
        const yearNum = date.getUTCFullYear();

        return `${monthName} ${dayNum}, ${yearNum}`;
    };

    const today = language === 'es' ? 'Hoy' : 'Today';
    const startDateDisplay = formatDate(rosaryStartDate);

    return (
        <section>
            <h2 className="settings-section-header">
                {translations.progressTracking}
                <Info
                    className="settings-info-icon"
                    size={16}
                />
            </h2>
            <div className="settings-card settings-progress-card">
                <div className="settings-progress-content">
                    <div className="settings-progress-info">
                        <p className="settings-progress-label">
                            {language === 'es' ? 'Período Actual' : 'Current Period'}
                        </p>
                        <p className="settings-progress-dates">
                            {startDateDisplay} — {today}
                        </p>
                    </div>
                    <button
                        className="settings-edit-button"
                        onClick={onEditClick}
                    >
                        {language === 'es' ? 'EDITAR' : 'EDIT'}
                    </button>
                </div>
            </div>
        </section>
    );
}
