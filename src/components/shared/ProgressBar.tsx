interface ProgressBarProps {
    progress: number;
    color?: string;
}

export function ProgressBar({ progress, color }: ProgressBarProps) {
    return (
        <div className="progress-bar-container">
            <div
                className="progress-bar-fill"
                style={{
                    width: `${progress}%`,
                    ...(color ? { backgroundColor: color } : {})
                }}
            />
        </div>
    );
}
