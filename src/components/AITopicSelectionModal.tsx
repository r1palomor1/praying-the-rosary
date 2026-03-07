import { Sparkles, X, ChevronRight, MessageCircle, Bookmark } from 'lucide-react';
import './AITopicSelectionModal.css';

export interface TopicOption {
  id: string;
  type: 'section' | 'chapter' | 'general';
  title: string;
  subtitle?: string;
  topicName: string;
  contextStr: string;
  source: string;
}

interface AITopicSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: TopicOption[];
  onSelect: (option: TopicOption) => void;
  onOpenChat?: () => void;
  onOpenSaved?: () => void;
  language: string;
}

export function AITopicSelectionModal({ isOpen, onClose, options, onSelect, onOpenChat, onOpenSaved, language }: AITopicSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="ai-topic-modal-overlay" onClick={onClose}>
      <div className="ai-topic-modal-content" onClick={e => e.stopPropagation()}>
        <div className="ai-topic-modal-header">
          <div className="ai-topic-modal-title">
            <Sparkles size={20} color="#d4af37" />
            <span>{language === 'es' ? 'Compañero IA' : 'AI Companion'}</span>
          </div>
          <button className="ai-topic-modal-close" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        
        <div className="ai-topic-modal-body">
          <h3 className="ai-topic-prompt">
            {language === 'es' ? '¿Sobre qué te gustaría reflexionar o discutir?' : 'What would you like to reflect or discuss?'}
          </h3>
          
          <div className="ai-topic-list">
            {options.map((opt) => (
              <button
                key={opt.id}
                className={`ai-topic-btn ai-topic-btn-${opt.type}`}
                onClick={() => onSelect(opt)}
              >
                <div className="ai-topic-btn-text">
                  <span className="ai-topic-title">{opt.title}</span>
                  {opt.subtitle && <span className="ai-topic-subtitle">{opt.subtitle}</span>}
                </div>
                <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
              </button>
            ))}
          </div>
        </div>

        {(onOpenChat || onOpenSaved) && (
          <div className="ai-topic-modal-footer">
            {onOpenChat && (
              <button className="ai-topic-footer-btn" onClick={onOpenChat}>
                <MessageCircle size={18} />
                <span>{language === 'es' ? 'Ir al Chat' : 'Go to Chat'}</span>
              </button>
            )}
            {onOpenSaved && (
              <button className="ai-topic-footer-btn" onClick={onOpenSaved}>
                <Bookmark size={18} />
                <span>{language === 'es' ? 'Ver Guardados' : 'View Saved'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

