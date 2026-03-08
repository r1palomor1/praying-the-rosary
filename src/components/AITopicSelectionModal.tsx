import { Sparkles, X, ChevronRight, MessageCircle, Bookmark, Book, BookOpenText, MessageSquareQuote } from 'lucide-react';
import './AITopicSelectionModal.css';

export interface TopicOption {
  id: string;
  type: 'section' | 'chapter' | 'general' | 'divider';
  title: string;
  subtitle?: string;
  topicName: string;
  contextStr: string;
  source: string;
  previewText?: string;
  iconType?: 'book' | 'reading' | 'chat';
  eyebrow?: string;
  eyebrowHighlight?: string;
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

  const renderIcon = (type?: string) => {
    switch (type) {
      case 'book':
        return <Book size={20} />;
      case 'reading':
        return <BookOpenText size={20} />;
      case 'chat':
      default:
        return <MessageSquareQuote size={20} />;
    }
  };

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
              opt.type === 'divider' ? (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', margin: '8px 0', opacity: 0.8 }}>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(212,175,55,0) 0%, rgba(212,175,55,0.3) 100%)' }} />
                  <span className="material-symbols-outlined" style={{ color: 'var(--gold, #d4af37)', margin: '0 12px', fontSize: '1.1rem', opacity: 0.8 }}>church</span>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0) 100%)' }} />
                </div>
              ) : (
                <div
                  key={opt.id}
                  className={`ai-topic-card ${opt.type === 'general' ? 'general-card' : ''} ${opt.type === 'section' ? 'section-card' : ''}`}
                  onClick={() => onSelect(opt)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="ai-topic-card-icon">
                    {renderIcon(opt.iconType)}
                  </div>
                  <div className="ai-topic-card-content">
                    {opt.eyebrow && (
                      <span className="ai-topic-card-eyebrow">
                        {opt.eyebrow}
                        {opt.eyebrowHighlight && (
                          <>
                            <span style={{ margin: '0 4px', color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
                            <span style={{ color: '#fff' }}>{opt.eyebrowHighlight}</span>
                          </>
                        )}
                      </span>
                    )}
                    <span className="ai-topic-card-title">
                      {opt.title} {opt.subtitle ? ` | ${opt.subtitle}` : ''}
                    </span>
                    {opt.previewText && (
                      <span className="ai-topic-card-preview">
                        "{opt.previewText}"
                      </span>
                    )}
                  </div>
                  <div className="ai-topic-card-arrow">
                    <ChevronRight size={20} />
                  </div>
                </div>
              )
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


