import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, ChevronDown, ChevronUp, Play, Square, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { useAI } from '../context/AIContext';
import { ttsManager } from '../utils/ttsManager';
import { sanitizeAIResponseForSpeech } from '../utils/textSanitizer';
import {
  saveReflection, deleteReflection, loadReflections, deriveCategory,
  updateReflectionTranslation,
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
  const [translating, setTranslating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);

  const localizeSource = (src: string) => {
    if (language !== 'es') return src;
    if (src === 'Daily Readings') return 'Lecturas Diarias';
    if (src === 'Bible in a Year') return 'Biblia en un Año';
    if (src === 'Rosary') return 'Rosario';
    if (src === 'Sacred Prayers') return 'Oraciones Sagradas';
    return src;
  };

  const localizeCategory = (cat: string) => {
    if (language !== 'es') return cat;
    const catMap: Record<string, string> = {
      'Reflection': 'Reflexión',
      'Scripture': 'Escritura',
      'History': 'Historia',
      'Application': 'Aplicación',
      'Catechism': 'Catecismo',
      'Rosary': 'Rosario',
      'Prayer': 'Oración',
      'Personal': 'Personal',
      'All': 'Todo'
    };
    return catMap[cat] || cat;
  };


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

  // Refresh saved list, reset filter, and trigger lazy translation when switching to saved tab
  useEffect(() => {
    if (activeTab === 'saved') {
      const fresh = loadReflections();
      setSavedItems(fresh);
      setCategoryFilter('All');

      // Lazy translate: find cards whose origin lang differs from current lang and have no cached translation
      const needsTranslation = fresh.filter(r => (r.lang || 'en') !== language && !r.response_translated);
      if (needsTranslation.length === 0) return;

      const API_BASE = '';
      setTranslating(true);

      (async () => {
        for (const item of needsTranslation) {
          try {
            const res = await fetch(`${API_BASE}/api/translate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ texts: [item.topic, item.question, item.response], from: item.lang || 'en', to: language }),
            });
            if (res.ok) {
              const { translated } = await res.json();
              if (translated && translated.length === 3) {
                updateReflectionTranslation(item.id, {
                  topic_translated: translated[0],
                  question_translated: translated[1],
                  response_translated: translated[2],
                });
              }
            }
          } catch (e) {
            console.warn('[AIChatWindow] Translation failed for item', item.id, e);
          }
        }
        setSavedItems(loadReflections()); // re-render with translations
        setTranslating(false);
      })();
    }
  }, [activeTab, language]);


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
      lang: language,
    });
    // Mark the message as saved so the button turns into a checkmark
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, savedId: saved.id } : m));
    setSavedItems(loadReflections());

    // Instantly trigger background translation to the other language so it's ready when they switch
    const otherLang = language === 'es' ? 'en' : 'es';
    fetch(`/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: [saved.topic, saved.question, saved.response], from: language, to: otherLang })
    }).then(res => res.json()).then(data => {
      if (data?.translated?.length === 3) {
        updateReflectionTranslation(saved.id, {
          topic_translated: data.translated[0],
          question_translated: data.translated[1],
          response_translated: data.translated[2]
        });
        setSavedItems(loadReflections());
      }
    }).catch(e => console.warn('[AIChatWindow] Background auto-translation failed', e));
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
    // Use translated content if available and current lang differs from origin
    const originLang = item.lang || 'en';
    const textToSpeak = (originLang !== language && item.response_translated)
      ? item.response_translated
      : item.response;
    const clean = sanitizeAIResponseForSpeech(textToSpeak);
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

          {/* New Header */}
          <div className="ai-saved-tab-header">
            <h2 className="ai-saved-tab-title">
              {language === 'es' ? 'Respuestas Sagradas' : 'Sacred Responses'}
            </h2>
            <p className="ai-saved-tab-subtitle">
              {language === 'es'
                ? 'Contemplaciones guiadas por IA según el intento de tu corazón'
                : 'AI-guided contemplations based on your heart\'s intent'}
            </p>
          </div>

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
                const displayCat = localizeCategory(cat);
                return (
                  <option key={cat} value={cat} style={{ background: '#1e1e2e', color: '#fff' }}>
                    {icon} {displayCat} ({count})
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
              {filteredSaved.map(item => {
                const originLang = item.lang || 'en';
                const topicDisplay = (originLang !== language && item.topic_translated) ? item.topic_translated : item.topic;
                const questionDisplay = (originLang !== language && item.question_translated) ? item.question_translated : item.question;
                const isExpanded = expandedCards.has(item.id);
                const isPlaying = playingMsgId === `saved-${item.id}`;

                const toggleExpand = () => setExpandedCards(prev => {
                  const next = new Set(prev);
                  next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                  return next;
                });

                return (
                  <div key={item.id} className={`ai-saved-card-v2 ${isExpanded ? 'expanded' : ''}`} onClick={toggleExpand}>
                    <div className="ai-saved-card-v2-header">
                      <div className="ai-saved-card-v2-icon">
                        {item.categoryIcon}
                      </div>
                      <div className="ai-saved-card-v2-title-area">
                        <div className="ai-saved-card-v2-title">{topicDisplay}</div>
                        <div className="ai-saved-card-v2-question-preview">"{questionDisplay}"</div>
                        <div className="ai-saved-card-v2-subtitle">
                          {localizeCategory(item.category)} • {new Date(item.date + 'T12:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="ai-saved-card-v2-actions">
                        <button
                          className={`ai-action-btn ai-play-btn-v2 ${isPlaying ? 'playing' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handlePlaySaved(item); }}
                          aria-label="Play"
                        >
                          {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />}
                        </button>
                        {isExpanded ? <ChevronUp size={16} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.3)" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="ai-saved-card-v2-content" onClick={e => e.stopPropagation()}>
                        <div className="ai-saved-card-v2-response">
                          {/* Show translated content if current lang differs from origin and translation exists */}
                          {(originLang !== language && item.response_translated) ? item.response_translated : item.response}
                          {(originLang !== language && !item.response_translated && translating) && (
                            <span className="ai-translating-indicator"> {language === 'es' ? '(traduciendo...)' : '(translating...)'}</span>
                          )}
                        </div>

                        <div className="ai-saved-card-v2-footer">
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className={`ai-lang-tag ai-lang-tag--${originLang}`}>{originLang.toUpperCase()}</span>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{localizeSource(item.source)}</span>
                          </div>
                          <button
                            className="ai-saved-card-v2-discard"
                            onClick={(e) => { e.stopPropagation(); handleDeleteSaved(item.id); }}
                          >
                            <Trash2 size={14} />
                            {language === 'es' ? 'DESCARTAR' : 'DISCARD'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
