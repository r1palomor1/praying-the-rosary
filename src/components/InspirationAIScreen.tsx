import { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Volume2, 
  Square, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  ChevronRight, 
  Settings, 
  Sparkles, 
  BookOpen,
  Type,
  List,
  Bookmark,
  BookmarkCheck,
  Star,
  Trash2,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
import { sanitizeAIResponseForSpeech } from '../utils/textSanitizer';
import { saveInspiration, updateSavedInspirationTranslation, updateSavedInspirationFlags, loadSavedInspirations, deleteSavedInspiration, type SavedInspiration } from '../utils/savedInspirations';
import { SettingsModalV2 as SettingsModal } from './settings/SettingsModalV2';
import './InspirationAIScreen.css';

/* ─── Strip markdown & structural labels from LLM output for visual display ─── */
function sanitizeInspirationDisplay(text: string): string {
  return text
    .replace(/^\**\s*\d+\.\s*[A-ZÁÉÍÓÚÑ\s&:()\-]+\**\s*$/gm, '')
    .replace(/^#{1,6}\s*.+$/gm, '')
    .replace(/\*{3}([\s\S]+?)\*{3}/g, '$1')
    .replace(/\*{2}([\s\S]+?)\*{2}/g, '$1')
    .replace(/\*([\s\S]+?)\*/g, '$1')
    .replace(/_{2}([\s\S]+?)_{2}/g, '$1')
    .replace(/_([\s\S]+?)_/g, '$1')
    .replace(/[\*\#\_]/g, '')
    .replace(/^\d+\.\s*[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s&:()\-]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ─── Static suggestion data ─── */
const STARTERS_EN = [
  { id: 's1',  icon: '🕊️', title: 'What does mercy really mean?',         sub: 'Exploring forgiveness in the Gospels' },
  { id: 's2',  icon: '✝️', title: 'The meaning of suffering',              sub: 'A Christian reflection on pain and grace' },
  { id: 's3',  icon: '🙏', title: 'Pray without ceasing',                  sub: 'What perseverance in prayer looks like' },
  { id: 's4',  icon: '📖', title: 'The Beatitudes and daily life',          sub: 'How the 8 Beatitudes shape how we live' },
  { id: 's5',  icon: '❤️', title: 'Love your enemy',                       sub: 'The radical call of Christ\'s teaching' },
  { id: 's6',  icon: '🌿', title: 'Forgiveness and reconciliation',         sub: 'Healing in the Sacrament of Confession' },
  { id: 's7',  icon: '⭐', title: 'The virtue of hope',                    sub: 'What the Church teaches about Christian hope' },
  { id: 's8',  icon: '🕯️', title: 'Advent: waiting and longing',           sub: 'Themes of preparation and expectation' },
  { id: 's9',  icon: '🌊', title: 'Baptism and new life',                  sub: 'What it means to die and rise with Christ' },
  { id: 's10', icon: '✨', title: 'The Resurrection today',                sub: 'What the Risen Christ means for us now' },
];

const STARTERS_ES = [
  { id: 's1',  icon: '🕊️', title: '¿Qué significa realmente la misericordia?', sub: 'Explorando el perdón en los Evangelios' },
  { id: 's2',  icon: '✝️', title: 'El significado del sufrimiento',             sub: 'Reflexión cristiana sobre el dolor y la gracia' },
  { id: 's3',  icon: '🙏', title: 'Orad sin cesar',                             sub: 'Cómo es la perseverancia en la oración' },
  { id: 's4',  icon: '📖', title: 'Las Bienaventuranzas y la vida diaria',       sub: 'Cómo moldean nuestra vida' },
  { id: 's5',  icon: '❤️', title: 'Ama a tus enemigos',                        sub: 'La llamada radical de la enseñanza de Cristo' },
  { id: 's6',  icon: '🌿', title: 'El perdón y la reconciliación',              sub: 'Sanación en el Sacramento de la Confesión' },
  { id: 's7',  icon: '⭐', title: 'La virtud de la esperanza',                  sub: 'Lo que la Iglesia enseña sobre la esperanza cristiana' },
  { id: 's8',  icon: '🕯️', title: 'Adviento: espera y anhelo',                 sub: 'Temas de preparación y expectativa' },
  { id: 's9',  icon: '🌊', title: 'El Bautismo y la vida nueva',               sub: 'Lo que significa morir y resucitar con Cristo' },
  { id: 's10', icon: '✨', title: 'La Resurrección hoy',                       sub: 'Lo que el Cristo Resucitado significa para nosotros' },
];

/* ─── Types ─── */
type InputMode   = 'readings' | 'suggestions' | 'custom';
type InspirationMode  = 'standard' | 'abstract';
type InspirationLen   = 'short' | 'medium' | 'long';
type InspirationTone  = 'pastoral' | 'reflective' | 'teaching';

interface ReadingOption { label: string; citation: string; }

const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';

export default function InspirationAIScreen({ onBack, initialDate }: { onBack: () => void; initialDate?: Date }) {
  const { language } = useApp();
  const starters = language === 'es' ? STARTERS_ES : STARTERS_EN;

  /* Tabs State */
  const [activeTab, setActiveTab] = useState<'build' | 'saved'>('build');
  const [savedTabFilter, setSavedTabFilter] = useState<'all' | 'favorites' | 'recent'>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [playingSavedId, setPlayingSavedId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const toggleAllGroups = () => {
    const allGroups = ['readings', 'starters', 'custom'];
    if (expandedGroups.size > 0) {
      setExpandedGroups(new Set());
    } else {
      setExpandedGroups(new Set(allGroups));
    }
  };

  /* Wizard State - Persisted via localStorage */
  const [inputMode, setInputMode] = useState<InputMode>(() => (localStorage.getItem('sermonAI_inputMode') as InputMode) || 'readings');
  
  /* Step 1: Source */
  const [readingsDate, setReadingsDate] = useState(() => {
    return initialDate || new Date();
  });
  const [readingOptions, setReadingOptions]         = useState<ReadingOption[]>([]);
  const [selectedReadingIdx, setSelectedReadingIdx] = useState(() => Number(localStorage.getItem('sermonAI_selectedReadingIdx')) || 0);
  const [loadingReadings, setLoadingReadings]       = useState(false);
  const [selectedStarterId, setSelectedStarterId]   = useState<string | null>(() => localStorage.getItem('sermonAI_selectedStarterId') || null);
  const [showStartersList, setShowStartersList]     = useState(false);
  const [showInputModeOptions, setShowInputModeOptions] = useState(false);
  const [showReadingOptions, setShowReadingOptions]     = useState(false);
  const [customText, setCustomText]                 = useState(() => localStorage.getItem('sermonAI_customText') || '');

  /* Step 2: Style */
  const [inspirationMode,   setInspirationMode]   = useState<InspirationMode>(() => (localStorage.getItem('sermonAI_sermonMode') as InspirationMode) || 'standard');
  const [inspirationLength, setInspirationLength] = useState<InspirationLen>(() => (localStorage.getItem('sermonAI_sermonLength') as InspirationLen) || 'medium');
  const [inspirationTone,   setInspirationTone]   = useState<InspirationTone>(() => (localStorage.getItem('sermonAI_sermonTone') as InspirationTone) || 'pastoral');
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /* Output & Result State */
  const [isGenerating, setIsGenerating] = useState(false);
  const [output,       setOutput]       = useState(() => localStorage.getItem('sermonAI_lastOutput') || '');
  const [translatedOutput, setTranslatedOutput] = useState(() => localStorage.getItem('sermonAI_lastOutput_translated') || '');
  const [originLang, setOriginLang] = useState(() => localStorage.getItem('sermonAI_lastOutput_originLang') || language);
  const [activeInspirationId, setActiveInspirationId] = useState<string | null>(() => localStorage.getItem('sermonAI_lastOutput_id') || null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [genError,     setGenError]     = useState('');
  const [isExpanded,   setIsExpanded]   = useState(false);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [copySuccess,  setCopySuccess]  = useState(false);
  const [savedItems, setSavedItems] = useState(loadSavedInspirations());

  /* Refs */
  const dateInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  const readingDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (showInputModeOptions && sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target as Node)) {
        setShowInputModeOptions(false);
      }
      if (showReadingOptions && readingDropdownRef.current && !readingDropdownRef.current.contains(e.target as Node)) {
        setShowReadingOptions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showInputModeOptions, showReadingOptions]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      ttsManager.stop();
    };
  }, []);

  const prevDeps = useRef([
    inputMode, 
    readingsDate.toISOString(), 
    selectedReadingIdx, 
    selectedStarterId, 
    customText, 
    inspirationMode, 
    inspirationLength, 
    inspirationTone
  ]);

  /* ── Persistence Logic ── */
  useEffect(() => {
    localStorage.setItem('sermonAI_inputMode', inputMode);
    localStorage.setItem('sermonAI_selectedReadingIdx', String(selectedReadingIdx));
    if (selectedStarterId) localStorage.setItem('sermonAI_selectedStarterId', selectedStarterId);
    else localStorage.removeItem('sermonAI_selectedStarterId');
    localStorage.setItem('sermonAI_customText', customText);
    localStorage.setItem('sermonAI_sermonMode', inspirationMode);
    localStorage.setItem('sermonAI_sermonLength', inspirationLength);
    localStorage.setItem('sermonAI_sermonTone', inspirationTone);
    if (output) {
      localStorage.setItem('sermonAI_lastOutput', output);
      localStorage.setItem('sermonAI_lastOutput_translated', translatedOutput);
      localStorage.setItem('sermonAI_lastOutput_originLang', originLang);
      if (activeInspirationId) localStorage.setItem('sermonAI_lastOutput_id', activeInspirationId);
    } else {
      localStorage.removeItem('sermonAI_lastOutput');
      localStorage.removeItem('sermonAI_lastOutput_translated');
      localStorage.removeItem('sermonAI_lastOutput_originLang');
      localStorage.removeItem('sermonAI_lastOutput_id');
    }
  }, [inputMode, selectedReadingIdx, selectedStarterId, customText, inspirationMode, inspirationLength, inspirationTone, output, translatedOutput, originLang, activeInspirationId]);

  useEffect(() => {
    const currentDeps = [
      inputMode, 
      readingsDate.toISOString(), 
      selectedReadingIdx, 
      selectedStarterId, 
      customText, 
      inspirationMode, 
      inspirationLength, 
      inspirationTone
    ];
    
    // Check if dependencies truly changed to avoid React Strict Mode / mount bugs
    const changed = prevDeps.current.some((dep, i) => dep !== currentDeps[i]);
    if (changed) {
      if (output) {
        setOutput('');
        setTranslatedOutput('');
        setActiveInspirationId(null);
      }
    }
    prevDeps.current = currentDeps;
  }, [inputMode, readingsDate, selectedReadingIdx, selectedStarterId, customText, inspirationMode, inspirationLength, inspirationTone]);

  // Caveman simple: whenever the language toggles, re-read the background translation from memory!
  useEffect(() => {
    setTranslatedOutput(localStorage.getItem('sermonAI_lastOutput_translated') || '');
  }, [language]);

  /* ── Fetch readings ── */
  const formatDateParam = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = d.getFullYear().toString().slice(-2);
    return `${mm}${dd}${yy}`;
  };

  useEffect(() => {
    let cancelled = false;
    setLoadingReadings(true);
    fetch(`${API_BASE}/api/readings?date=${formatDateParam(readingsDate)}&lang=${language}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return;
        const opts: ReadingOption[] = (data?.readings ?? []).map((r: any) => ({
          label:    r.title ?? '',
          citation: r.citation ?? '',
        }));
        setReadingOptions(opts);
        setSelectedReadingIdx(prev => prev >= opts.length ? 0 : prev);
      })
      .catch(() => { if (!cancelled) setReadingOptions([]); })
      .finally(() => { if (!cancelled) setLoadingReadings(false); });
    return () => { cancelled = true; };
  }, [readingsDate, language]);

  /* ── Prompt Resolution ── */
  const getPromptValue = (): string => {
    if (inputMode === 'readings') {
      const opt = readingOptions[selectedReadingIdx];
      if (!opt) return '';
      return opt.citation ? `${opt.label} — ${opt.citation}` : opt.label;
    }
    if (inputMode === 'suggestions') {
      return starters.find(s => s.id === selectedStarterId)?.title ?? '';
    }
    return customText.trim();
  };

  const canGenerate = getPromptValue().length > 0 && !isGenerating;

  /* ── Action Handlers ── */
  const handleGenerate = async () => {
    const sourceText = getPromptValue();
    if (!sourceText) return;
    if (isPlaying) { ttsManager.stop(); setIsPlaying(false); }
    setIsGenerating(true);
    setOutput('');
    setTranslatedOutput('');
    setGenError('');
    setIsExpanded(false);
    
    try {
      const res = await fetch('/api/sermon', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ 
          sourceText, 
          mode: inspirationMode, 
          tone: inspirationTone === 'reflective' ? 'contemplative' : inspirationTone, 
          duration: inspirationLength, 
          language 
        }),
      });

      const rawText = await res.text();
      if (!rawText || !rawText.trim().startsWith('{')) {
        throw new Error(res.status === 404 ? 'API not available in local dev.' : `Server error (${res.status})`);
      }

      const data = JSON.parse(rawText);
      if (!res.ok) throw new Error(data.message || 'Failed to generate.');
      
      const finalOutput = sanitizeInspirationDisplay(data.response ?? '');
      setOutput(finalOutput);
      setOriginLang(language);
      
      // Save to 48-hour history
      const saved = saveInspiration({
        sourceText,
        sourceType: inputMode === 'suggestions' ? 'starters' : inputMode,
        mode: inspirationMode,
        duration: inspirationLength,
        tone: inspirationTone,
        response: finalOutput,
        lang: language,
        isTemporary: true
      });
      setActiveInspirationId(saved.id);
      setSavedItems(loadSavedInspirations());
      
      // Scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // Background Translation
      setIsTranslating(true);
      const otherLang = language === 'es' ? 'en' : 'es';
      fetch('/api/translate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: [finalOutput], from: language, to: otherLang })
      }).then(r => r.json()).then(transData => {
        if (transData?.translated?.length === 1) {
          const trans = transData.translated[0];
          setTranslatedOutput(trans);
          localStorage.setItem('sermonAI_lastOutput_translated', trans);
          updateSavedInspirationTranslation(saved.id, trans);
          setSavedItems(loadSavedInspirations());
        }
      }).catch(e => console.warn('[InspirationAIScreen] Background auto-translation failed', e))
        .finally(() => setIsTranslating(false));

    } catch (err: any) {
      setGenError(err.message || 'An error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleBookmark = () => {
    if (!activeInspirationId) return;
    const item = savedItems.find(r => r.id === activeInspirationId);
    if (!item) return;

    const newTempStatus = !item.isTemporary;
    updateSavedInspirationFlags(activeInspirationId, {
      isTemporary: newTempStatus,
      isFavorite: newTempStatus ? false : item.isFavorite,
      ...(newTempStatus ? { timestamp: Date.now() } : {})
    });
    setSavedItems(loadSavedInspirations());
  };

  const handleToggleFavorite = () => {
    if (!activeInspirationId) return;
    const item = savedItems.find(r => r.id === activeInspirationId);
    if (!item) return;

    const newFav = !item.isFavorite;
    if (newFav) {
      updateSavedInspirationFlags(activeInspirationId, { isFavorite: true, isTemporary: false });
    } else {
      updateSavedInspirationFlags(activeInspirationId, { isFavorite: false });
    }
    setSavedItems(loadSavedInspirations());
  };

  const activeInspirationRecord = savedItems.find(r => r.id === activeInspirationId);

  const handleDeleteSaved = (id: string) => {
    deleteSavedInspiration(id);
    setSavedItems(loadSavedInspirations());
  };

  const getInspirationChunkProgress = (inspirationId: string): number => {
    const val = localStorage.getItem(`sermonAI_chunk_progress_${inspirationId}`);
    return val ? parseInt(val, 10) : -1;
  };

  const saveInspirationChunkProgress = (inspirationId: string, chunkIndex: number) => {
    localStorage.setItem(`sermonAI_chunk_progress_${inspirationId}`, chunkIndex.toString());
  };

  const clearInspirationChunkProgress = (inspirationId: string) => {
    localStorage.removeItem(`sermonAI_chunk_progress_${inspirationId}`);
  };

  const handlePlaySaved = async (item: SavedInspiration) => {
    if (playingSavedId === item.id) {
      ttsManager.stop();
      setPlayingSavedId(null);
      return;
    }
    ttsManager.stop();
    setIsPlaying(false);
    setPlayingSavedId(item.id);
    await ttsManager.setLanguage(language as any);
    
    const originLang = item.lang || 'en';
    const textToSpeak = (originLang !== language && item.response_translated) ? item.response_translated : item.response;
    const spokenText = sanitizeAIResponseForSpeech(textToSpeak, language);
    const chunks = spokenText.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) ?? [spokenText];
    
    const savedProgress = getInspirationChunkProgress(item.id);
    
    const segments = chunks.map((text, i) => {
      if (savedProgress >= 0 && i < savedProgress) {
        return null;
      }
      
      const isLast = i === chunks.length - 1;
      return {
        text: text.trim(),
        gender: 'female' as const,
        postPause: isLast ? 0 : 200,
        onStart: () => {
          if (isLast) {
            clearInspirationChunkProgress(item.id);
          } else {
            saveInspirationChunkProgress(item.id, i);
          }
        }
      };
    }).filter(Boolean) as any[];

    if (segments.length === 0) {
      clearInspirationChunkProgress(item.id);
      handlePlaySaved(item);
      return;
    }

    ttsManager.setOnEnd(() => setPlayingSavedId(null));

    try {
      await ttsManager.speakSegments(segments);
    } catch { 
      setPlayingSavedId(null); 
    }
  };

  const handleToggleSavedBookmark = (item: SavedInspiration) => {
    const newTempStatus = !item.isTemporary;
    updateSavedInspirationFlags(item.id, {
      isTemporary: newTempStatus,
      isFavorite: newTempStatus ? false : item.isFavorite,
      ...(newTempStatus ? { timestamp: Date.now() } : {})
    });
    setSavedItems(loadSavedInspirations());
  };

  const handleToggleSavedFavorite = (item: SavedInspiration) => {
    const newFav = !item.isFavorite;
    if (newFav) {
      updateSavedInspirationFlags(item.id, { isFavorite: true, isTemporary: false });
    } else {
      updateSavedInspirationFlags(item.id, { isFavorite: false });
    }
    setSavedItems(loadSavedInspirations());
  };

  const handleCopyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); }
    catch { 
      const t = document.createElement('textarea'); 
      t.value = text; 
      document.body.appendChild(t); 
      t.select(); 
      document.execCommand('copy'); 
      t.remove(); 
    }
  };

  const handleSpeak = async () => {
    if (!output) return;
    
    const inspirationId = activeInspirationId || 'active';

    if (isPlaying) { 
      ttsManager.stop(); 
      setIsPlaying(false); 
      return; 
    }

    if (playingSavedId) {
      ttsManager.stop();
      setPlayingSavedId(null);
    }

    await ttsManager.setLanguage(language);
    
    const textToSpeak = (originLang !== language && translatedOutput) ? translatedOutput : output;
    const spokenText = sanitizeAIResponseForSpeech(textToSpeak, language);
    const chunks = spokenText.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) ?? [spokenText];
    
    const savedProgress = getInspirationChunkProgress(inspirationId);
    
    const segments = chunks.map((text, i) => {
      if (savedProgress >= 0 && i < savedProgress) {
        return null;
      }
      
      const isLast = i === chunks.length - 1;
      return {
        text: text.trim(),
        gender: 'female' as const,
        postPause: isLast ? 0 : 200,
        onStart: () => {
          if (isLast) {
            clearInspirationChunkProgress(inspirationId);
          } else {
            saveInspirationChunkProgress(inspirationId, i);
          }
        }
      };
    }).filter(Boolean) as any[];

    if (segments.length === 0) {
      clearInspirationChunkProgress(inspirationId);
      handleSpeak();
      return;
    }

    setIsPlaying(true);
    ttsManager.setOnEnd(() => setIsPlaying(false));
    
    try {
      await ttsManager.speakSegments(segments);
    } catch { 
      setIsPlaying(false); 
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    const textToCopy = (originLang !== language && translatedOutput) ? translatedOutput : output;
    try { await navigator.clipboard.writeText(textToCopy); }
    catch { 
      const t = document.createElement('textarea'); 
      t.value = output; 
      document.body.appendChild(t); 
      t.select(); 
      document.execCommand('copy'); 
      t.remove(); 
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1500);
  };

  const triggerDatePicker = () => {
    if ((dateInputRef.current as any)?.showPicker) (dateInputRef.current as any).showPicker();
    else dateInputRef.current?.click();
  };

  const yyyy = readingsDate.getFullYear();
  const mStr = String(readingsDate.getMonth() + 1).padStart(2, '0');
  const dStr = String(readingsDate.getDate()).padStart(2, '0');
  const htmlDate = `${yyyy}-${mStr}-${dStr}`;

  const renderSavedCard = (item: SavedInspiration) => {
    const originLang = item.lang || 'en';
    const responseDisplay = (originLang !== language && item.response_translated) ? item.response_translated : item.response;
    const isExpanded = expandedCards.has(item.id);
    const isPlayingThis = playingSavedId === item.id;
    const toggleExpand = () => setExpandedCards(prev => { 
      const next = new Set(prev); 
      next.has(item.id) ? next.delete(item.id) : next.add(item.id); 
      return next; 
    });

    return (
      <div key={item.id} className={`inspiration-saved-card ${isExpanded ? 'expanded' : ''}`} onClick={toggleExpand}>
        <div className="inspiration-saved-card-header">
          <div className="inspiration-saved-card-title-area">
            <div className="inspiration-saved-card-title">{item.sourceText}</div>
            <div className="inspiration-saved-card-meta">
              {item.mode === 'standard' ? (language === 'es' ? 'Estándar' : 'Standard') : (language === 'es' ? 'Abstracto' : 'Abstract')} • {item.duration} • {item.tone}
            </div>
            <div className="inspiration-saved-card-actions" onClick={(e) => e.stopPropagation()}>
              <button className={`inspiration-icon-btn ${isPlayingThis ? 'playing' : ''}`} onClick={(e) => { e.stopPropagation(); handlePlaySaved(item); }}>
                {isPlayingThis ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
              </button>
              <button className={`inspiration-icon-btn ${!item.isTemporary ? 'saved' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggleSavedBookmark(item); }}>
                {!item.isTemporary ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>
              <button className={`inspiration-icon-btn ${item.isFavorite ? 'saved' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggleSavedFavorite(item); }}>
                <Star size={16} fill={item.isFavorite ? 'currentColor' : 'none'} color={item.isFavorite ? 'inherit' : 'currentColor'} />
              </button>
              <button className="inspiration-icon-btn" onClick={(e) => { e.stopPropagation(); handleCopyText(responseDisplay); }} title={language === 'es' ? 'Copiar' : 'Copy'}>
                <Copy size={16} />
              </button>
              <button 
                className="inspiration-icon-btn inspiration-card-trash" 
                style={{ marginLeft: '12px' }} 
                onClick={(e) => { e.stopPropagation(); handleDeleteSaved(item.id); }}
                title={language === 'es' ? 'Eliminar' : 'Delete'}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="inspiration-saved-card-right">
             <div className="inspiration-saved-card-date">
                {new Date(item.date + 'T12:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
             </div>
             <div className="inspiration-saved-card-chevron">
                {isExpanded ? <ChevronUp size={18} color="var(--inspiration-gold)" /> : <ChevronDown size={18} color="rgba(244, 231, 212, 0.4)" />}
             </div>
          </div>
        </div>
        {isExpanded && (
          <div className="inspiration-saved-card-content" onClick={e => e.stopPropagation()}>
            <div className="inspiration-saved-card-response">{responseDisplay}</div>
            <div className="inspiration-saved-card-footer">
              <span className="inspiration-badge-draft">{originLang.toUpperCase()}</span>
              <button className="inspiration-saved-card-discard" onClick={(e) => { e.stopPropagation(); handleDeleteSaved(item.id); }}>
                <Trash2 size={14} />
                {language === 'es' ? 'DESCARTAR' : 'DISCARD'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── UI Strings ── */
  const t = {
    title: language === 'es' ? 'Inspiración IA' : 'Inspiration AI',
    subtitle: language === 'es' ? 'Crea inspiraciones católicas llenas de fe en minutos.' : 'Create faith-filled, Catholic inspirations in minutes.',
    step1: language === 'es' ? 'Fuente' : 'Source',
    step1Desc: language === 'es' ? '¿En qué se basa la inspiración?' : 'What is the inspiration based on?',
    step2: language === 'es' ? 'Estilo' : 'Style',
    step2Desc: language === 'es' ? 'Elige cómo debe sonar tu inspiración.' : 'Choose how your inspiration should sound.',
    step3: language === 'es' ? 'Generar' : 'Generate',
    step3Desc: language === 'es' ? 'Revisa tus selecciones.' : 'Review your selections.',
    generateBtn: language === 'es' ? 'Crear Inspiración' : 'Build Inspiration',
    generating: language === 'es' ? 'Creando...' : 'Building...',
    security: language === 'es' ? 'Tu contenido es privado y seguro.' : 'Your content is private and secure.',
    yourSermon: language === 'es' ? 'Reflexión' : 'Reflection',
    draft: language === 'es' ? 'Borrador' : 'Draft',
    listen: language === 'es' ? 'Escuchar' : 'Listen',
    copy: language === 'es' ? 'Copiar' : 'Copy',
    expand: language === 'es' ? 'Expandir inspiración completa' : 'Expand full inspiration',
    collapse: language === 'es' ? 'Contraer' : 'Collapse',
    helper: language === 'es' ? 'Estos ajustes ayudan a dar forma al tono y la profundidad.' : 'These settings help shape the tone and depth.',
    dailyReadings: language === 'es' ? 'Lecturas Diarias' : 'Daily Readings',
    starters: language === 'es' ? 'Sugerencias' : 'Starters / Suggestions',
    custom: language === 'es' ? 'Texto Propio' : 'Custom Input',
    placeholder: language === 'es' ? 'Ej: Lucas 5; Fiesta de la Ascensión; una reflexión sobre la misericordia…' : 'E.g.: Luke 5; Feast of the Ascension; a reflection on mercy…',
    tapToChange: language === 'es' ? 'Toca para cambiar' : 'Tap to change',
  };

  return (
    <div className="inspiration-screen">
      {/* ── Header ── */}
      <header className="inspiration-header">
        <button className="inspiration-back-btn-abs" onClick={onBack} aria-label={language === 'es' ? 'Volver' : 'Back'}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>family_home</span>
        </button>
        <div className="inspiration-brand-group">
          <h1 className="inspiration-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} color="var(--inspiration-gold)" />
            {t.title}
          </h1>
        </div>
        <button className="inspiration-help-btn-abs" onClick={() => setShowSettings(true)} aria-label="Settings">
          <Settings size={22} />
        </button>
      </header>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <div className="inspiration-body">
        
        {activeTab === 'build' ? (
          <>
            {/* ── Step 1: Source ── */}
        <section className="inspiration-step-card">
          <div className="inspiration-step-header">
            <h2 className="inspiration-step-title">{t.step1}</h2>
          </div>
          <p className="inspiration-step-desc">{t.step1Desc}</p>

          <div className="inspiration-control-group" ref={sourceDropdownRef}>
            <div className="inspiration-select-with-action">
              <div style={{ flex: 1, position: 'relative' }}>
                <div 
                  className="inspiration-style-summary" 
                  style={{ 
                    margin: 0, 
                    opacity: showInputModeOptions ? 0 : 1, 
                    pointerEvents: showInputModeOptions ? 'none' : 'auto' 
                  }} 
                  onClick={() => setShowInputModeOptions(true)}
                >
                  <div className="inspiration-style-summary-content">
                    <span className="inspiration-input-icon" style={{ position: 'static', transform: 'none', color: 'var(--inspiration-gold)' }}>
                      {inputMode === 'readings' ? <BookOpen size={18} /> : inputMode === 'suggestions' ? <List size={18} /> : <Type size={18} />}
                    </span>
                    <span className="inspiration-style-summary-values" style={{ color: 'var(--inspiration-text)' }}>
                      {inputMode === 'readings' ? t.dailyReadings : inputMode === 'suggestions' ? t.starters : t.custom}
                    </span>
                  </div>
                  <ChevronDown size={18} className={`inspiration-style-expand-icon${showInputModeOptions ? ' expanded' : ''}`} />
                </div>

                {showInputModeOptions && (
                  <div className="inspiration-starter-select-list inspiration-floating-dropdown">
                    <div className={`inspiration-starter-item${inputMode === 'readings' ? ' selected' : ''}`} onClick={() => { setInputMode('readings'); setShowInputModeOptions(false); }}>
                      <BookOpen size={18} className="inspiration-starter-item-icon" style={{ color: 'var(--inspiration-gold)' }} />
                      <div className="inspiration-starter-item-text">
                         <span className="inspiration-starter-item-title">{t.dailyReadings}</span>
                      </div>
                    </div>
                    <div className={`inspiration-starter-item${inputMode === 'suggestions' ? ' selected' : ''}`} onClick={() => { setInputMode('suggestions'); setShowInputModeOptions(false); }}>
                      <List size={18} className="inspiration-starter-item-icon" style={{ color: 'var(--inspiration-gold)' }} />
                      <div className="inspiration-starter-item-text">
                         <span className="inspiration-starter-item-title">{t.starters}</span>
                      </div>
                    </div>
                    <div className={`inspiration-starter-item${inputMode === 'custom' ? ' selected' : ''}`} onClick={() => { setInputMode('custom'); setShowInputModeOptions(false); }}>
                      <Type size={18} className="inspiration-starter-item-icon" style={{ color: 'var(--inspiration-gold)' }} />
                      <div className="inspiration-starter-item-text">
                         <span className="inspiration-starter-item-title">{t.custom}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {inputMode === 'readings' && (
                <div style={{ position: 'relative' }}>
                  <button 
                    className="inspiration-inline-action-btn" 
                    onClick={triggerDatePicker}
                    aria-label="Select date"
                  >
                    <Calendar size={20} />
                  </button>
                  <input ref={dateInputRef} type="date" value={htmlDate}
                    onChange={e => { if (e.target.value) { const [y,mo,d] = e.target.value.split('-').map(Number); setReadingsDate(new Date(y, mo-1, d)); }}}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', right: 0, top: 0, width: '100%', height: '100%' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Content based on Source */}
          {inputMode === 'readings' && (
            <div className="inspiration-control-group" ref={readingDropdownRef}>
              <label className="inspiration-label">{language === 'es' ? 'Lectura' : 'Reading'}</label>
              <div style={{ position: 'relative' }}>
                <div 
                  className="inspiration-style-summary" 
                  style={{ 
                    margin: 0,
                    opacity: showReadingOptions ? 0 : 1,
                    pointerEvents: showReadingOptions ? 'none' : 'auto'
                  }} 
                  onClick={() => setShowReadingOptions(true)}
                >
                  <div className="inspiration-style-summary-content">
                     <span className="inspiration-style-summary-values" style={{ color: 'var(--inspiration-text)' }}>
                       {loadingReadings ? (language === 'es' ? 'Cargando...' : 'Loading...') : readingOptions.length > 0 ? (readingOptions[selectedReadingIdx]?.label + (readingOptions[selectedReadingIdx]?.citation ? ` — ${readingOptions[selectedReadingIdx].citation}` : '')) : (language === 'es' ? 'No hay lecturas' : 'No readings')}
                     </span>
                  </div>
                  <ChevronDown size={18} className={`inspiration-style-expand-icon${showReadingOptions ? ' expanded' : ''}`} />
                </div>

                {showReadingOptions && readingOptions.length > 0 && (
                  <div className="inspiration-starter-select-list inspiration-floating-dropdown">
                    {readingOptions.map((opt, i) => (
                      <div key={i} className={`inspiration-starter-item${selectedReadingIdx === i ? ' selected' : ''}`} onClick={() => { setSelectedReadingIdx(i); setShowReadingOptions(false); }}>
                        <div className="inspiration-starter-item-text">
                           <span className="inspiration-starter-item-title">{opt.label}</span>
                           {opt.citation && <span className="inspiration-starter-item-sub">{opt.citation}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {inputMode === 'suggestions' && (
            <div className="inspiration-starter-select-list">
              {selectedStarterId && !showStartersList ? (
                <div className="inspiration-starter-item selected" onClick={() => setShowStartersList(true)}>
                  <span className="inspiration-starter-item-icon">{starters.find(s => s.id === selectedStarterId)?.icon}</span>
                  <div className="inspiration-starter-item-text">
                    <span className="inspiration-starter-item-title">{starters.find(s => s.id === selectedStarterId)?.title}</span>
                    <span className="inspiration-starter-item-sub">{t.tapToChange}</span>
                  </div>
                  <ChevronDown size={18} color="var(--inspiration-gold)" />
                </div>
              ) : (
                starters.map(s => (
                  <div key={s.id} className={`inspiration-starter-item${selectedStarterId === s.id ? ' selected' : ''}`} onClick={() => { setSelectedStarterId(s.id); setShowStartersList(false); }}>
                    <span className="inspiration-starter-item-icon">{s.icon}</span>
                    <div className="inspiration-starter-item-text">
                      <span className="inspiration-starter-item-title">{s.title}</span>
                      <span className="inspiration-starter-item-sub">{s.sub}</span>
                    </div>
                    <ChevronRight size={18} color="var(--inspiration-text-dim)" />
                  </div>
                ))
              )}
            </div>
          )}

          {inputMode === 'custom' && (
            <div className="inspiration-textarea-wrapper" style={{ position: 'relative' }}>
              <textarea 
                className="inspiration-textarea" 
                value={customText} 
                onChange={e => setCustomText(e.target.value)}
                placeholder={t.placeholder}
                style={{ paddingRight: '40px' }}
              />
              {customText && (
                <button 
                  className="inspiration-textarea-clear" 
                  onClick={() => setCustomText('')}
                  style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px', 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--inspiration-text-dim)', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Step 2: Style (Collapsible + Chips) ── */}
        <section className="inspiration-step-card">
          <div className="inspiration-step-header">
            <h2 className="inspiration-step-title">{t.step2}</h2>
          </div>

          <div className="inspiration-style-summary" onClick={() => setShowStyleOptions(!showStyleOptions)}>
            <div className="inspiration-style-summary-content">
              <span className="inspiration-style-summary-values">
                {inspirationMode === 'standard' ? (language === 'es' ? 'Estándar' : 'Standard') : (language === 'es' ? 'Abstracto' : 'Abstract')} • {inspirationLength === 'short' ? 'Short' : inspirationLength === 'medium' ? 'Medium' : 'Long'} • {inspirationTone.charAt(0).toUpperCase() + inspirationTone.slice(1)}
              </span>
            </div>
            <ChevronDown size={18} className={`inspiration-style-expand-icon${showStyleOptions ? ' expanded' : ''}`} />
          </div>

          {showStyleOptions && (
            <>
              <div className="inspiration-control-group">
                <label className="inspiration-label">{language === 'es' ? 'Modo' : 'Mode'}</label>
                <div className="inspiration-segments">
                  <button className={`inspiration-segment-btn${inspirationMode === 'standard' ? ' active' : ''}`} onClick={() => setInspirationMode('standard')}>
                    {language === 'es' ? 'Estándar' : 'Standard'}
                  </button>
                  <button className={`inspiration-segment-btn${inspirationMode === 'abstract' ? ' active' : ''}`} onClick={() => setInspirationMode('abstract')}>
                    {language === 'es' ? 'Abstracto' : 'Abstract'}
                  </button>
                </div>
              </div>

              <div className="inspiration-control-group">
                <label className="inspiration-label">{language === 'es' ? 'Duración' : 'Length'}</label>
                <div className="inspiration-segments">
                  <button className={`inspiration-segment-btn${inspirationLength === 'short' ? ' active' : ''}`} onClick={() => setInspirationLength('short')}>
                    {language === 'es' ? 'Corto' : 'Short'}
                  </button>
                  <button className={`inspiration-segment-btn${inspirationLength === 'medium' ? ' active' : ''}`} onClick={() => setInspirationLength('medium')}>
                    {language === 'es' ? 'Medio' : 'Medium'}
                  </button>
                  <button className={`inspiration-segment-btn${inspirationLength === 'long' ? ' active' : ''}`} onClick={() => setInspirationLength('long')}>
                    {language === 'es' ? 'Largo' : 'Long'}
                  </button>
                </div>
              </div>

              <div className="inspiration-control-group">
                <label className="inspiration-label">{language === 'es' ? 'Tono' : 'Tone'}</label>
                <div className="inspiration-segments">
                  <button className={`inspiration-segment-btn${inspirationTone === 'pastoral' ? ' active' : ''}`} onClick={() => setInspirationTone('pastoral')}>
                    {language === 'es' ? 'Pastoral' : 'Pastoral'}
                  </button>
                  <button className={`inspiration-segment-btn${inspirationTone === 'reflective' ? ' active' : ''}`} onClick={() => setInspirationTone('reflective')}>
                    {language === 'es' ? 'Reflexivo' : 'Reflective'}
                  </button>
                  <button className={`inspiration-segment-btn${inspirationTone === 'teaching' ? ' active' : ''}`} onClick={() => setInspirationTone('teaching')}>
                    {language === 'es' ? 'Didáctico' : 'Teaching'}
                  </button>
                </div>
              </div>

              <div className="inspiration-helper-box">
                <Sparkles size={14} />
                <span>{t.helper}</span>
              </div>
            </>
          )}
        </section>

        {/* ── Step 3: Generate ── */}
        <section className="inspiration-step-card inspiration-generate-card">
          <div className="inspiration-step-header" style={{ alignSelf: 'flex-start' }}>
            <h2 className="inspiration-step-title">{t.step3}</h2>
          </div>
          <p className="inspiration-step-desc" style={{ alignSelf: 'flex-start', textAlign: 'left' }}>{t.step3Desc}</p>

          <button className="inspiration-btn-generate" onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
            {isGenerating ? (
              <>
                <div className="inspiration-spinner" />
                <span>{t.generating}</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>{t.generateBtn}</span>
              </>
            )}
          </button>
        </section>

        {/* ── Result Preview Card ── */}
        {(output || genError) && (
          <div className="inspiration-result-card" ref={resultRef}>
            {genError ? (
              <div className="inspiration-error-msg">{genError}</div>
            ) : (
              <>
                <div className="inspiration-result-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="inspiration-result-title-group">
                    <h3 className="inspiration-result-title">{t.yourSermon}</h3>
                  </div>
                  <div className="inspiration-result-meta" style={{ fontSize: '0.75rem', color: 'var(--inspiration-text-dim)', letterSpacing: '0.02em' }}>
                    {getPromptValue().split(' — ')[1] || getPromptValue()} • {inspirationMode === 'standard' ? 'Standard' : 'Abstract'} • {inspirationLength} • {inspirationTone}
                  </div>
                </div>

                <div className={`inspiration-result-body${!isExpanded ? ' inspiration-text-collapsed' : ''}`}>
                  {(originLang !== language && translatedOutput) ? translatedOutput : output}
                  {(originLang !== language && !translatedOutput && isTranslating) && (
                    <span className="ai-translating-indicator" style={{fontStyle: 'italic', opacity: 0.7}}> {language === 'es' ? '(traduciendo...)' : '(translating...)'}</span>
                  )}
                </div>

                <div className="inspiration-result-footer-actions">
                  <button className="inspiration-icon-btn" onClick={handleSpeak} title={isPlaying ? 'Stop' : 'Listen'}>
                    {isPlaying ? <Square size={18} fill="currentColor" /> : <Volume2 size={18} />}
                  </button>
                  <button className={`inspiration-icon-btn ${activeInspirationRecord && !activeInspirationRecord.isTemporary ? 'saved' : ''}`} onClick={handleToggleBookmark} title={language === 'es' ? 'Guardar' : 'Save'}>
                    {(activeInspirationRecord && !activeInspirationRecord.isTemporary) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                  <button className={`inspiration-icon-btn ${activeInspirationRecord?.isFavorite ? 'saved' : ''}`} onClick={handleToggleFavorite} title={language === 'es' ? 'Favorito' : 'Favorite'}>
                    <Star size={18} fill={activeInspirationRecord?.isFavorite ? 'currentColor' : 'none'} color={activeInspirationRecord?.isFavorite ? 'inherit' : 'currentColor'} />
                  </button>
                  <button className="inspiration-icon-btn" onClick={handleCopy} title={language === 'es' ? 'Copiar' : 'Copy'}>
                    {copySuccess ? <Check size={18} color="#4ade80" /> : <Copy size={18} />}
                  </button>
                </div>

                <button className="inspiration-expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
                  <span>{isExpanded ? t.collapse : t.expand}</span>
                  <ChevronDown size={18} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </>
            )}
          </div>
        )}
          </>
        ) : (
          <div className="inspiration-saved-tab">
            <div className="inspiration-saved-tab-header">
                <div className="inspiration-saved-filter-scroll">
                  <div className="inspiration-saved-filter-row">
                    {['All Inspirations', 'Favorites', 'Recent 48h history'].map((tabStr, idx) => {
                      const tabVal = ['all', 'favorites', 'recent'][idx] as 'all' | 'favorites' | 'recent';
                      const langStr = language === 'es'
                        ? ['Inspiraciones', 'Favoritos', 'Historial 48h'][idx]
                        : tabStr;

                      const count = savedItems.filter(item => {
                        if (tabVal === 'favorites') return item.isFavorite;
                        if (tabVal === 'recent') return item.isTemporary;
                        return !item.isTemporary;
                      }).length;

                      return (
                        <button
                          key={tabVal}
                          onClick={() => setSavedTabFilter(tabVal)}
                          className={`inspiration-saved-filter-btn ${savedTabFilter === tabVal ? 'active' : ''}`}
                        >
                          {langStr} ( {count} )
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="inspiration-view-toggle" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                  <button
                    className={`inspiration-view-toggle-btn ${expandedGroups.size > 0 ? 'active' : ''}`}
                    onClick={toggleAllGroups}
                    title={expandedGroups.size > 0 ? (language === 'es' ? 'Contraer todo' : 'Collapse all') : (language === 'es' ? 'Expandir todo' : 'Expand all')}
                  >
                    {expandedGroups.size > 0 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {savedItems.filter(item => {
                if (savedTabFilter === 'favorites') return item.isFavorite;
                if (savedTabFilter === 'recent') return item.isTemporary;
                return !item.isTemporary;
              }).length === 0 ? (
                <div className="inspiration-saved-empty">
                  {language === 'es' ? 'No hay inspiraciones guardadas aún.' : 'No saved inspirations yet.'}
                </div>
              ) : (
                <div className="inspiration-saved-groups">
                  {Object.entries(
                    savedItems.filter(item => {
                      if (savedTabFilter === 'favorites') return item.isFavorite;
                      if (savedTabFilter === 'recent') return item.isTemporary;
                      return !item.isTemporary;
                    }).reduce((acc, item) => {
                      const group = item.sourceType || 'custom';
                      if (!acc[group]) acc[group] = [];
                      acc[group].push(item);
                      return acc;
                    }, {} as Record<string, SavedInspiration[]>)
                  ).sort((a, b) => a[0].localeCompare(b[0])).map(([group, items]) => {
                    const isExpanded = expandedGroups.has(group);
                    const toggleGroup = () => setExpandedGroups(prev => {
                      const next = new Set(prev);
                      next.has(group) ? next.delete(group) : next.add(group);
                      return next;
                    });
                    
                    const groupIcons: Record<string, string> = { readings: '📖', starters: '✨', custom: '✍️' };
                    const groupNames: Record<string, string> = {
                      readings: t.dailyReadings,
                      starters: t.starters,
                      custom: t.custom
                    };

                    return (
                      <div key={group} className="inspiration-saved-group-container">
                        <div className="inspiration-saved-group-header" onClick={toggleGroup}>
                          <div className="inspiration-saved-group-title">
                            <span style={{ fontSize: '1.1rem' }}>{groupIcons[group] || '📁'}</span>
                            {groupNames[group] || group} ({items.length})
                          </div>
                          {isExpanded ? <ChevronUp size={18} color="var(--inspiration-gold)" /> : <ChevronDown size={18} color="var(--inspiration-text-dim)" />}
                        </div>
                        {isExpanded && (
                          <div className="inspiration-saved-group-content">
                            {items.map(item => renderSavedCard(item))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

      </div>

      <div className="inspiration-tab-strip">
        <button className={`inspiration-tab ${activeTab === 'build' ? 'active' : ''}`} onClick={() => setActiveTab('build')}>
          <Sparkles size={20} />
          <span>{language === 'es' ? 'Crear' : 'Build'}</span>
        </button>
        <button className={`inspiration-tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
          <Bookmark size={20} />
          <span>{language === 'es' ? 'Guardado' : 'Saved'}</span>
        </button>
      </div>
    </div>
  );
}
