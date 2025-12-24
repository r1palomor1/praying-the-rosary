import { X } from 'lucide-react';
import './ConfirmModal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onCancel}>
            <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="confirm-modal-close" onClick={onCancel} aria-label="Close">
                    <X size={24} />
                </button>

                <h2 className="confirm-modal-title">{title}</h2>
                <p className="confirm-modal-message">{message}</p>

                <div className="confirm-modal-actions">
                    <button className="confirm-modal-btn confirm-modal-btn-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className="confirm-modal-btn confirm-modal-btn-confirm" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
