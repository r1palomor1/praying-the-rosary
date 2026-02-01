import { Type, Bell } from 'lucide-react';

interface DisplaySectionProps {
    textSize: 'normal' | 'large' | 'extra-large';
    dailyReminderEnabled: boolean;
    onTextSizeClick: () => void;
    onReminderToggle: (enabled: boolean) => void;
    translations: {
        display: string;
        textSize: string;
        normal: string;
        large: string;
        extraLarge: string;
        dailyRosaryReminder: string;
        reminderDesc: string;
    };
}

export function DisplaySection({
    textSize,
    dailyReminderEnabled,
    onTextSizeClick,
    onReminderToggle,
    translations
}: DisplaySectionProps) {
    const getTextSizeLabel = () => {
        switch (textSize) {
            case 'large': return translations.large;
            case 'extra-large': return translations.extraLarge;
            default: return translations.normal;
        }
    };

    return (
        <section>
            <h2 className="settings-section-header">
                {translations.display}
            </h2>
            <div className="settings-card">
                {/* Text Size */}
                <button
                    className="settings-list-item"
                    onClick={onTextSizeClick}
                >
                    <div className="settings-item-left">
                        <Type className="settings-icon" size={20} />
                        <span className="settings-item-label">{translations.textSize}</span>
                    </div>
                    <div className="settings-item-right">
                        <span className="settings-item-value">{getTextSizeLabel()}</span>
                        <span className="settings-chevron">›</span>
                    </div>
                </button>

                {/* Daily Reminder Toggle */}
                <div className="settings-list-item settings-toggle-item">
                    <div className="settings-item-left">
                        <Bell className="settings-icon" size={20} />
                        <div className="settings-item-text">
                            <span className="settings-item-label">{translations.dailyRosaryReminder}</span>
                            <span className="settings-item-desc">{translations.reminderDesc}</span>
                        </div>
                    </div>
                    <div className="settings-item-right">
                        <label className="settings-toggle">
                            <input
                                type="checkbox"
                                checked={dailyReminderEnabled}
                                onChange={(e) => onReminderToggle(e.target.checked)}
                                className="settings-toggle-input"
                            />
                            <span className="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        </section>
    );
}
