import { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { AIChatWindow } from './AIChatWindow';
import './AIModal.css';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextStr?: string; // made optional
  topicName?: string; // made optional
  source?: string;
  language?: string;
  startTab?: 'chat' | 'saved';
}

export function AIModal({ isOpen, onClose, contextStr = '', topicName = '', source = 'Daily Readings', language = 'en', startTab = 'chat' }: AIModalProps) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const initialGreeting = language === 'es'
    ? `He leído la lectura completa de hoy: ${topicName}. ¿Sobre qué parte te gustaría reflexionar o hacer una pregunta?`
    : `I have read today's complete section for: ${topicName}. What part would you like to reflect on or ask a question about?`;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <h2 className="ai-modal-title">
            <Sparkles size={20} />
            Companion (IA)
          </h2>
          <button className="ai-modal-close" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="ai-modal-body">
          <AIChatWindow
            contextStr={contextStr}
            topicName={topicName}
            source={source}
            language={language}
            initialMessage={initialGreeting}
            startTab={startTab}
          />
        </div>
      </div>
    </div>
  );
}
