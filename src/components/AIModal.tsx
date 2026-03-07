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

  const initialGreeting = topicName && topicName !== 'General'
    ? (language === 'es'
      ? `He leído la lectura de: ${topicName}. ¿Sobre qué te gustaría reflexionar o hacer una pregunta?`
      : `I have read the section for: ${topicName}. What would you like to reflect on or ask a question about?`)
    : (language === 'es'
      ? '¿Sobre qué te gustaría reflexionar o hacer una pregunta?'
      : 'What would you like to reflect on or ask a question about?');

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <h2 className="ai-modal-title">
            <Sparkles size={20} />
            {language === 'es' ? 'Compañero IA' : 'AI Companion'}
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

