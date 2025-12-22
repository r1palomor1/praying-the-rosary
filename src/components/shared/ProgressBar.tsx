interface ProgressBarProps {
    progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div className="progress-bar-container">
            <div
                className="progress-bar-fill"
                style={{ '--progress': `${progress}%` } as React.CSSProperties}
            />
        </div>
    );
}
