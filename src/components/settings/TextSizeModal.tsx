import { X } from 'lucide-react';

interface TextSizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSize: 'normal' | 'large' | 'xl';
    onSelect: (size: 'normal' | 'large' | 'xl') => void;
    language: 'en' | 'es';
}

export function TextSizeModal({ isOpen, onClose, currentSize, onSelect, language }: TextSizeModalProps) {
    if (!isOpen) return null;

    const translations = {
        en: {
            title: 'Text Size',
            normal: 'Normal',
            large: 'Large',
            extraLarge: 'Extra Large'
        },
        es: {
            title: 'Tamaño de Texto',
            normal: 'Normal',
            large: 'Grande',
            extraLarge: 'Extra Grande'
        }
    };

    const t = translations[language];

    const sizes: Array<{ value: 'normal' | 'large' | 'xl'; label: string }> = [
        { value: 'normal', label: t.normal },
        { value: 'large', label: t.large },
        { value: 'xl', label: t.extraLarge }
    ];

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-picker-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-picker-header">
                    <h2 className="settings-picker-title">{t.title}</h2>
                    <button className="settings-picker-close" onClick={onClose} aria-label="Close">
                        <X size={24} />
                    </button>
                </div>
                <div className="settings-picker-options">
                    {sizes.map((size) => (
                        <button
                            key={size.value}
                            className={`settings-picker-option ${currentSize === size.value ? 'active' : ''}`}
                            onClick={() => {
                                onSelect(size.value);
                                onClose();
                            }}
                        >
                            {size.label}
                            {currentSize === size.value && <span className="settings-picker-check">✓</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
