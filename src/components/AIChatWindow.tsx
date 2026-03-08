import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, ChevronDown, ChevronUp, Play, Square, Bookmark, BookmarkCheck, Trash2, Star } from 'lucide-react';
import { useAI } from '../context/AIContext';
import { ttsManager } from '../utils/ttsManager';
import { sanitizeAIResponseForSpeech } from '../utils/textSanitizer';
import { saveReflection, loadReflections, deleteReflection, updateReflectionFlags, updateReflectionTranslation, deriveCategory, type SavedReflection } from '../utils/savedReflections';

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
  const [savedTab, setSavedTab] = useState<'all' | 'favorites' | 'recent'>('all');
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

  const handleToggleBookmark = (msg: Message | { savedId?: string }) => {
    if (!msg.savedId) return;
    const item = savedItems.find(r => r.id === msg.savedId);
    if (!item) return;

    // Toggle temporary status
    const newTempStatus = !item.isTemporary;

    updateReflectionFlags(msg.savedId, {
      isTemporary: newTempStatus,
      // If reverting to recent history, remove favorite status and restart the 48h clock
      isFavorite: newTempStatus ? false : item.isFavorite,
      ...(newTempStatus ? { timestamp: Date.now() } : {})
    });
    setSavedItems(loadReflections());
  };

  const handleToggleFavorite = (msg: Message | { savedId?: string }) => {
    if (!msg.savedId) return;
    const item = savedItems.find(r => r.id === msg.savedId);
    if (!item) return;

    const newFav = !item.isFavorite;

    if (newFav) {
      // Favoriting explicitly saves it permanently
      updateReflectionFlags(msg.savedId, { isFavorite: true, isTemporary: false });
    } else {
      // Un-favoriting leaves it in the "All Saved" (Bookmarked) state permanently
      updateReflectionFlags(msg.savedId, { isFavorite: false, isTemporary: false });
    }

    setSavedItems(loadReflections());
  };

  // No translation on manual save toggle now; it happens dynamically


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
      // Auto-save every response as temporary implicitly
      const { category, categoryIcon } = deriveCategory(userText);
      const saved = saveReflection({
        source,
        topic: topicName || source,
        question: userText,
        category,
        categoryIcon,
        response: response,
        lang: language,
        isTemporary: true,
        isFavorite: false,
      });
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

      const aiMsg: Message = { id: `ai-${Date.now()}`, role: 'ai', content: response, savedId: saved.id };
      setMessages(prev => {
        const updated = [...prev, aiMsg];
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
  const filteredSaved = savedItems.filter(item => {
    if (savedTab === 'favorites') return item.isFavorite;
    if (savedTab === 'recent') return item.isTemporary;
    return !item.isTemporary; // 'all' means all permanently saved items
  });

  // Tab labels
  const chatLabel = language === 'es' ? 'Chat' : 'Chat';
  const savedLabel = language === 'es' ? 'Guardado' : 'Saved';

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
            {messages.map((msg) => {
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
                        className={`ai-action-btn ai-save-btn ${msg.savedId && !savedItems.find(r => r.id === msg.savedId)?.isTemporary ? 'saved' : ''}`}
                        onClick={() => handleToggleBookmark(msg)}
                        aria-label={msg.savedId && !savedItems.find(r => r.id === msg.savedId)?.isTemporary ? 'Saved' : 'Save reflection'}
                        title={msg.savedId && !savedItems.find(r => r.id === msg.savedId)?.isTemporary ? (language === 'es' ? 'Guardado' : 'Saved') : (language === 'es' ? 'Guardar reflexión' : 'Save reflection')}
                      >
                        {msg.savedId && !savedItems.find(r => r.id === msg.savedId)?.isTemporary ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                      <button
                        className="ai-action-btn ai-star-btn"
                        onClick={() => handleToggleFavorite(msg)}
                        title={language === 'es' ? 'Favorito' : 'Favorite'}
                      >
                        <Star size={16} fill={savedItems.find(r => r.id === msg.savedId)?.isFavorite ? 'currentColor' : 'none'} color={savedItems.find(r => r.id === msg.savedId)?.isFavorite ? 'inherit' : 'currentColor'} />
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

          {/* Filter Tabs */}
          <div className="ai-saved-filter-row" style={{ display: 'flex', gap: '8px', padding: '0 24px 16px', overflowX: 'auto' }}>
            {['All Saved', 'Favorites', 'Recent 48h history'].map((tabStr, idx) => {
              const tabVal = ['all', 'favorites', 'recent'][idx] as 'all' | 'favorites' | 'recent';
              const langStr = language === 'es'
                ? ['Todo Guardado', 'Favoritos', 'Historial 48h'][idx]
                : tabStr;

              const count = savedItems.filter(item => {
                if (tabVal === 'favorites') return item.isFavorite;
                if (tabVal === 'recent') return item.isTemporary;
                return !item.isTemporary;
              }).length;

              return (
                <button
                  key={tabVal}
                  onClick={() => setSavedTab(tabVal)}
                  style={{
                    background: savedTab === tabVal ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${savedTab === tabVal ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: savedTab === tabVal ? '#D4AF37' : 'rgba(255,255,255,0.7)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                  {langStr} ( {count} )
                </button>
              );
            })}
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
                let topicDisplay = (originLang !== language && item.topic_translated) ? item.topic_translated : item.topic;

                if (item.source === 'Bible in a Year') {
                  topicDisplay = topicDisplay.replace(/^(Day|Día)\s+\d+\s+[—\-]\s*/i, '');
                }

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
                        <button
                          className={`ai-action-btn ai-save-btn ${!item.isTemporary ? 'saved' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleToggleBookmark({ savedId: item.id } as Message); }}
                          aria-label={!item.isTemporary ? 'Saved' : 'Save reflection'}
                          title={!item.isTemporary ? (language === 'es' ? 'Guardado' : 'Saved') : (language === 'es' ? 'Guardar reflexión' : 'Save reflection')}
                        >
                          {!item.isTemporary ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        </button>
                        <button
                          className={`ai-action-btn ai-star-btn ${item.isFavorite ? 'saved' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleToggleFavorite({ savedId: item.id } as Message); }}
                          title={language === 'es' ? 'Favorito' : 'Favorite'}
                        >
                          <Star size={16} fill={item.isFavorite ? 'currentColor' : 'none'} color={item.isFavorite ? 'inherit' : 'currentColor'} />
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
