import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, ChevronDown, Play, Square, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { useAI } from '../context/AIContext';
import { ttsManager } from '../utils/ttsManager';
import { sanitizeAIResponseForSpeech } from '../utils/textSanitizer';
import {
  saveReflection, deleteReflection, loadReflections, deriveCategory,
  ALL_CATEGORIES, type SavedReflection
} from '../utils/savedReflections';
import type { Language } from '../types';
import './AIChatWindow.css';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isError?: boolean;
  savedId?: string; // set after saving
}

interface AIChatWindowProps {
  contextStr: string;
  topicName?: string;
  source?: string;       // "Daily Readings" | "Bible in a Year" | etc.
  initialMessage?: string;
  language?: string;
  startTab?: 'chat' | 'saved';
}

type ActiveTab = 'chat' | 'saved';

export function AIChatWindow({ contextStr, topicName, source = 'Daily Readings', initialMessage, language = 'en', startTab = 'chat' }: AIChatWindowProps) {
  const { sendMessage, aiEnabled } = useAI();
  const [activeTab, setActiveTab] = useState<ActiveTab>(startTab);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<SavedReflection[]>(() => loadReflections());
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setMessages([{ id: Date.now().toString(), role: 'ai', content: initialMessage }]);
    }
  }, [initialMessage, messages.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (guideRef.current && !guideRef.current.contains(e.target as Node)) {
        setIsGuideOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => { ttsManager.stop(); };
  }, []);

  // Refresh saved list and reset filter when switching to saved tab
  useEffect(() => {
    if (activeTab === 'saved') {
      setSavedItems(loadReflections());
      setCategoryFilter('All');
    }
  }, [activeTab]);

  const PROMPTS: Record<string, Record<string, string[]>> = {
    en: {
      'Words of the Pope': [
        'Summarize the core message of this reflection.',
        'Explain the context and audience of this message.',
        'Unpack any challenging perspectives in this reflection.',
        'How does this apply to my life today?',
        'Give me 3 reflection questions based on this.',
        'Give me one practical action I can take from this.',
        'How does this papal reflection inspire a Rosary mystery?',
        'Write a short prayer based on this reflection.',
      ],
      'default': [
        'Summarize this reading and its key highlights.',
        'Explain the historical context of this passage.',
        'Unpack any difficult passages or concepts here.',
        'How does this apply to my life today?',
        'Give me 3 reflection questions based on this reading.',
        'Give me one practical action I can take from this.',
        'How does this reading connect to the Rosary mysteries?',
        'Write a short prayer based on this reading.',
      ],
    },
    es: {
      'Words of the Pope': [
        'Resume el mensaje central de esta reflexión.',
        'Explica el contexto y la audiencia de este mensaje.',
        'Desarrolla las perspectivas difíciles de esta reflexión.',
        '¿Cómo puedo aplicar esto en mi vida hoy?',
        'Dame 3 preguntas de reflexión basadas en esto.',
        'Dame una acción práctica que pueda tomar de esto.',
        '¿Cómo inspira esta reflexión papal un misterio del Rosario?',
        'Escribe una breve oración basada en esta reflexión.',
      ],
      'default': [
        'Resume esta lectura y sus puntos clave.',
        'Explica el contexto histórico de este pasaje.',
        'Desarrolla los pasajes o conceptos difíciles aquí.',
        '¿Cómo puedo aplicar esto en mi vida hoy?',
        'Dame 3 preguntas de reflexión basadas en esta lectura.',
        'Dame una acción práctica que pueda tomar de esto.',
        '¿Cómo se relaciona esta lectura con los misterios del Rosario?',
        'Escribe una breve oración basada en esta lectura.',
      ],
    },
  };

  const lang = language === 'es' ? 'es' : 'en';
  const guidancePrompts: string[] = PROMPTS[lang][source] ?? PROMPTS[lang]['default'];




  const handleSelectPrompt = (prompt: string) => {
    setInputValue(prompt);
    setIsGuideOpen(false);
  };

  const handlePlayMessage = async (msgId: string, text: string) => {
    if (playingMsgId === msgId) {
      ttsManager.stop();
      setPlayingMsgId(null);
      return;
    }
    ttsManager.stop();
    setPlayingMsgId(msgId);
    await ttsManager.setLanguage(language as Language);
    ttsManager.setOnEnd(() => setPlayingMsgId(null));
    const clean = sanitizeAIResponseForSpeech(text);
    const chunks = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const segments = chunks.map((chunk, i) => ({
      text: chunk.trim(),
      gender: 'female' as const,
      postPause: i < chunks.length - 1 ? 150 : 0,
    }));
    try {
      await ttsManager.speakSegments(segments);
    } catch {
      setPlayingMsgId(null);
    }
  };

  const handleSaveMessage = (msg: Message, question: string) => {
    if (msg.savedId) return; // already saved
    const { category, categoryIcon } = deriveCategory(question);
    const saved = saveReflection({
      source,
      topic: topicName || source,
      question,
      category,
      categoryIcon,
      response: msg.content,
    });
    // Mark the message as saved so the button turns into a checkmark
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, savedId: saved.id } : m));
    setSavedItems(loadReflections());
  };

  const handleDeleteSaved = (id: string) => {
    deleteReflection(id);
    setSavedItems(loadReflections());
  };

  const handlePlaySaved = async (item: SavedReflection) => {
    const key = `saved-${item.id}`;
    if (playingMsgId === key) {
      ttsManager.stop();
      setPlayingMsgId(null);
      return;
    }
    ttsManager.stop();
    setPlayingMsgId(key);
    await ttsManager.setLanguage(language as Language);
    ttsManager.setOnEnd(() => setPlayingMsgId(null));
    const clean = sanitizeAIResponseForSpeech(item.response);
    const chunks = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const segments = chunks.map((c, i) => ({ text: c.trim(), gender: 'female' as const, postPause: i < chunks.length - 1 ? 150 : 0 }));
    try { await ttsManager.speakSegments(segments); } catch { setPlayingMsgId(null); }
  };

  const handleSend = async (forcedText?: string) => {
    const textToSubmit = forcedText || inputValue;
    if (!textToSubmit.trim() || !aiEnabled || isLoading) return;
    ttsManager.stop();
    setPlayingMsgId(null);
    const userText = textToSubmit.trim();
    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const { response, error } = await sendMessage({ mysteryName: topicName, contextStr, language, userPrompt: userText });
    setIsLoading(false);

    if (error) {
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`, role: 'ai',
        content: language === 'es' ? 'Lo siento, no pude procesar tu solicitud en este momento.' : 'I am sorry, I could not process your request at this time.',
        isError: true,
      }]);
    } else if (response) {
      const aiMsg: Message = { id: `ai-${Date.now()}`, role: 'ai', content: response };
      setMessages(prev => {
        const updated = [...prev, aiMsg];
        // Auto-derive the question that prompted this response (last user message)
        return updated;
      });
      // Store user's question alongside so save button knows what was asked
      setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, _question: userText } as any : m));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Saved tab filtered list
  const filteredSaved = categoryFilter === 'All'
    ? savedItems
    : savedItems.filter(r => r.category === categoryFilter);

  const savedCount = savedItems.length;

  // Tab labels
  const chatLabel = language === 'es' ? 'Chat' : 'Chat';
  const savedLabel = language === 'es' ? `Guardado (${savedCount})` : `Saved (${savedCount})`;

  if (!aiEnabled) {
    return (
      <div className="ai-chat-container" style={{ padding: '20px', textAlign: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
          {language === 'es' ? 'El Compañero de IA está desactivado.' : 'AI Companion is disabled.'}
        </p>
      </div>
    );
  }

  return (
    <div className="ai-chat-container">
      {/* Tab Strip */}
      <div className="ai-tab-strip">
        <button className={`ai-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          {chatLabel}
        </button>
        <button className={`ai-tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
          {savedLabel}
        </button>
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Chat Messages */}
          <div className="ai-messages-list">
            {messages.map((msg, idx) => {
              // Find the preceding user message to use as the question for save
              const question = (msg as any)._question ||
                [...messages].reverse().find((m, ri) => ri > messages.length - 1 - idx && m.role === 'user')?.content || '';
              return (
                <div key={msg.id} className={`ai-message-wrapper ${msg.role}`}>
                  <div className={`ai-message ${msg.role}`}>
                    {msg.isError && <AlertCircle size={16} style={{ marginRight: '8px', color: '#ff6b6b', flexShrink: 0 }} />}
                    {msg.content}
                  </div>
                  {msg.role === 'ai' && !msg.isError && (
                    <div className="ai-message-actions">
                      <button
                        className={`ai-action-btn ai-play-btn ${playingMsgId === msg.id ? 'playing' : ''}`}
                        onClick={() => handlePlayMessage(msg.id, msg.content)}
                        aria-label={playingMsgId === msg.id ? 'Stop audio' : 'Play audio'}
                      >
                        {playingMsgId === msg.id ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />}
                      </button>
                      <button
                        className={`ai-action-btn ai-save-btn ${msg.savedId ? 'saved' : ''}`}
                        onClick={() => handleSaveMessage(msg, question)}
                        aria-label={msg.savedId ? 'Saved' : 'Save reflection'}
                        title={msg.savedId ? (language === 'es' ? 'Guardado' : 'Saved') : (language === 'es' ? 'Guardar reflexión' : 'Save reflection')}
                      >
                        {msg.savedId ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="ai-loading-indicator">
                <div className="ai-loading-dot"></div>
                <div className="ai-loading-dot"></div>
                <div className="ai-loading-dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Row */}
          <div className="ai-input-container">
            <div className="ai-guide-wrapper" ref={guideRef}>
              <button className="ai-guide-btn" onClick={() => setIsGuideOpen(prev => !prev)} disabled={isLoading}>
                <span className="ai-guide-label">{language === 'es' ? 'Guíame' : 'Guide'}</span>
                <ChevronDown size={14} className={`ai-guide-chevron ${isGuideOpen ? 'open' : ''}`} />
              </button>
              {isGuideOpen && (
                <div className="ai-guide-dropdown">
                  {guidancePrompts.map((prompt, i) => (
                    <button key={i} className="ai-guide-option" onClick={() => handleSelectPrompt(prompt)}>{prompt}</button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              className="ai-chat-input"
              placeholder={language === 'es' ? 'Haz una pregunta espiritual...' : 'Ask a spiritual question...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button className="ai-send-button" onClick={() => handleSend()} disabled={!inputValue.trim() || isLoading} aria-label="Send message">
              <Send size={18} />
            </button>
          </div>
        </>
      ) : (
        /* ─── Saved Tab ─── */
        <div className="ai-saved-tab">
          {/* Category Filter */}
          <div className="ai-saved-filter-row">
            <select
              className="ai-saved-filter-select"
              aria-label={language === 'es' ? 'Filtrar por categoria' : 'Filter by category'}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All" style={{ background: '#1e1e2e', color: '#fff' }}>
                {language === 'es' ? `Todo (${savedItems.length})` : `All (${savedItems.length})`}
              </option>
              {ALL_CATEGORIES.filter(cat => cat !== 'All' && savedItems.some(r => r.category === cat)).map(cat => {
                const count = savedItems.filter(r => r.category === cat).length;
                const icon = savedItems.find(r => r.category === cat)?.categoryIcon ?? '';
                return (
                  <option key={cat} value={cat} style={{ background: '#1e1e2e', color: '#fff' }}>
                    {icon} {cat} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {filteredSaved.length === 0 ? (
            <div className="ai-saved-empty">
              {language === 'es'
                ? 'No hay reflexiones guardadas aún. Chatea con el compañero y guarda las respuestas que te inspiren.'
                : 'No saved reflections yet. Chat with the companion and save the responses that inspire you.'}
            </div>
          ) : (
            <div className="ai-saved-list">
              {filteredSaved.map(item => (
                <div key={item.id} className="ai-saved-card">
                  <div className="ai-saved-card-header">
                    <span className="ai-saved-category">
                      {item.categoryIcon} {item.category}
                      <span style={{ opacity: 0.6, fontSize: '0.85em', marginLeft: '6px' }}>• {item.source}</span>
                    </span>
                    <span className="ai-saved-date">{new Date(item.date + 'T12:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="ai-saved-topic">{item.topic}</div>
                  <div className="ai-saved-question">"{item.question}"</div>
                  <div className={`ai-saved-response ${expandedCards.has(item.id) ? 'expanded' : ''}`}>
                    {item.response}
                  </div>
                  {item.response.length > 200 && (
                    <button
                      className="ai-saved-expand-btn"
                      onClick={() => setExpandedCards(prev => {
                        const next = new Set(prev);
                        next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                        return next;
                      })}
                    >
                      {expandedCards.has(item.id)
                        ? (language === 'es' ? 'Ver menos ▲' : 'Show less ▲')
                        : (language === 'es' ? 'Ver más ▼' : 'Show more ▼')}
                    </button>
                  )}
                  <div className="ai-saved-card-actions">
                    <button
                      className={`ai-action-btn ai-play-btn ${playingMsgId === `saved-${item.id}` ? 'playing' : ''}`}
                      onClick={() => handlePlaySaved(item)}
                      aria-label="Play"
                    >
                      {playingMsgId === `saved-${item.id}` ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />}
                    </button>
                    <button className="ai-action-btn ai-delete-btn" onClick={() => handleDeleteSaved(item.id)} aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
