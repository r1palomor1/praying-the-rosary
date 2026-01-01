import { X } from 'lucide-react';
import type { VersionInfo } from '../utils/version';
import './VersionModal.css';

interface VersionModalProps {
    versionInfo: VersionInfo;
    onClose: () => void;
    language: 'en' | 'es';
}

export function VersionModal({ versionInfo, onClose, language }: VersionModalProps) {
    const t = {
        en: {
            title: 'Version Information',
            commitHash: 'Commit Hash',
            commitDate: 'Commit Date',
            commitMessage: 'Commit Message',
            environment: 'Environment',
            lastUpdated: 'Last Updated',
            close: 'Close'
        },
        es: {
            title: 'Información de Versión',
            commitHash: 'Hash de Commit',
            commitDate: 'Fecha de Commit',
            commitMessage: 'Mensaje de Commit',
            environment: 'Entorno',
            lastUpdated: 'Última Actualización',
            close: 'Cerrar'
        }
    }[language];

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="version-modal-overlay" onClick={onClose}>
            <div className="version-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="version-modal-header">
                    <h2 className="version-modal-title">{t.title}</h2>
                    <button
                        onClick={onClose}
                        className="version-modal-close"
                        aria-label={t.close}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="version-modal-content">
                    <div className="version-info-grid">
                        <div className="version-info-item">
                            <span className="version-info-label">{t.commitHash}:</span>
                            <span className="version-info-value version-hash">{versionInfo.hash}</span>
                        </div>

                        <div className="version-info-item">
                            <span className="version-info-label">{t.commitDate}:</span>
                            <span className="version-info-value">{versionInfo.date}</span>
                        </div>

                        <div className="version-info-item">
                            <span className="version-info-label">{t.environment}:</span>
                            <span className={`version-info-value version-env ${versionInfo.environment}`}>
                                {versionInfo.environment}
                            </span>
                        </div>

                        <div className="version-info-item version-message">
                            <span className="version-info-label">{t.commitMessage}:</span>
                            <span className="version-info-value">{versionInfo.message}</span>
                        </div>

                        <div className="version-info-item">
                            <span className="version-info-label">{t.lastUpdated}:</span>
                            <span className="version-info-value version-timestamp">
                                {formatDateTime(versionInfo.timestamp)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
