import React, { createContext, useContext, useState, useCallback, type ReactNode, useRef } from 'react';
import '../components/Toast.css';
import { Check, Info } from 'lucide-react';

export type ToastType = 'success' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
    isExiting?: boolean;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastIdCounter = useRef(0);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = toastIdCounter.current++;
        const newToast: Toast = { id, message, type };

        setToasts((prev) => [...prev, newToast]);

        // Trigger exit animation before removing
        setTimeout(() => {
            setToasts((prev) =>
                prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
            );
            // Remove from DOM after animation completes
            setTimeout(() => {
                removeToast(id);
            }, 300); // Matches CSS animation duration
        }, 2000); // Duration to show toast
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast-message ${toast.type} ${toast.isExiting ? 'toast-exit' : ''}`}
                    >
                        <div className="toast-icon">
                            {toast.type === 'success' ? <Check size={16} /> : <Info size={16} />}
                        </div>
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
