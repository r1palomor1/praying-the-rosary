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
        const date = new Date(dateStr);
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', options);
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
                    title={translations.startDateTooltip}
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
