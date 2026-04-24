import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
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
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
import { sanitizeAIResponseForSpeech } from '../utils/textSanitizer';
import { saveSermon, updateSavedSermonTranslation, updateSavedSermonFlags, loadSavedSermons, deleteSavedSermon, type SavedSermon } from '../utils/savedSermons';
import { SettingsModalV2 as SettingsModal } from './settings/SettingsModalV2';
import './SermonAIScreen.css';

/* ─── Strip markdown & structural labels from LLM output for visual display ─── */
function sanitizeSermonDisplay(text: string): string {
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
type SermonMode  = 'standard' | 'abstract';
type SermonLen   = 'short' | 'medium' | 'long';
type SermonTone  = 'pastoral' | 'reflective' | 'teaching';

interface ReadingOption { label: string; citation: string; }

const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';

export default function SermonAIScreen({ onBack }: { onBack: () => void }) {
  const { language } = useApp();
  const starters = language === 'es' ? STARTERS_ES : STARTERS_EN;

  /* Tabs State */
  const [activeTab, setActiveTab] = useState<'build' | 'saved'>('build');
  const [savedTabFilter, setSavedTabFilter] = useState<'all' | 'favorites' | 'recent'>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [playingSavedId, setPlayingSavedId] = useState<string | null>(null);

  /* Wizard State - Persisted via localStorage */
  const [inputMode, setInputMode] = useState<InputMode>(() => (localStorage.getItem('sermonAI_inputMode') as InputMode) || 'readings');
  
  /* Step 1: Source */
  const [readingsDate, setReadingsDate] = useState(() => {
    const saved = localStorage.getItem('sermonAI_readingsDate');
    return saved ? new Date(saved) : new Date();
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
  const [sermonMode,   setSermonMode]   = useState<SermonMode>(() => (localStorage.getItem('sermonAI_sermonMode') as SermonMode) || 'standard');
  const [sermonLength, setSermonLength] = useState<SermonLen>(() => (localStorage.getItem('sermonAI_sermonLength') as SermonLen) || 'medium');
  const [sermonTone,   setSermonTone]   = useState<SermonTone>(() => (localStorage.getItem('sermonAI_sermonTone') as SermonTone) || 'pastoral');
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /* Output & Result State */
  const [isGenerating, setIsGenerating] = useState(false);
  const [output,       setOutput]       = useState(() => localStorage.getItem('sermonAI_lastOutput') || '');
  const [translatedOutput, setTranslatedOutput] = useState(() => localStorage.getItem('sermonAI_lastOutput_translated') || '');
  const [originLang, setOriginLang] = useState(() => localStorage.getItem('sermonAI_lastOutput_originLang') || language);
  const [activeSermonId, setActiveSermonId] = useState<string | null>(() => localStorage.getItem('sermonAI_lastOutput_id') || null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [genError,     setGenError]     = useState('');
  const [isExpanded,   setIsExpanded]   = useState(false);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [copySuccess,  setCopySuccess]  = useState(false);
  const [savedItems, setSavedItems] = useState(loadSavedSermons());

  /* Refs */
  const dateInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const prevDeps = useRef([
    inputMode, 
    readingsDate.toISOString(), 
    selectedReadingIdx, 
    selectedStarterId, 
    customText, 
    sermonMode, 
    sermonLength, 
    sermonTone
  ]);

  /* ── Persistence Logic ── */
  useEffect(() => {
    localStorage.setItem('sermonAI_inputMode', inputMode);
    localStorage.setItem('sermonAI_readingsDate', readingsDate.toISOString());
    localStorage.setItem('sermonAI_selectedReadingIdx', String(selectedReadingIdx));
    if (selectedStarterId) localStorage.setItem('sermonAI_selectedStarterId', selectedStarterId);
    else localStorage.removeItem('sermonAI_selectedStarterId');
    localStorage.setItem('sermonAI_customText', customText);
    localStorage.setItem('sermonAI_sermonMode', sermonMode);
    localStorage.setItem('sermonAI_sermonLength', sermonLength);
    localStorage.setItem('sermonAI_sermonTone', sermonTone);
    if (output) {
      localStorage.setItem('sermonAI_lastOutput', output);
      localStorage.setItem('sermonAI_lastOutput_translated', translatedOutput);
      localStorage.setItem('sermonAI_lastOutput_originLang', originLang);
      if (activeSermonId) localStorage.setItem('sermonAI_lastOutput_id', activeSermonId);
    } else {
      localStorage.removeItem('sermonAI_lastOutput');
      localStorage.removeItem('sermonAI_lastOutput_translated');
      localStorage.removeItem('sermonAI_lastOutput_originLang');
      localStorage.removeItem('sermonAI_lastOutput_id');
    }
  }, [inputMode, readingsDate, selectedReadingIdx, selectedStarterId, customText, sermonMode, sermonLength, sermonTone, output, translatedOutput, originLang, activeSermonId]);

  useEffect(() => {
    const currentDeps = [
      inputMode, 
      readingsDate.toISOString(), 
      selectedReadingIdx, 
      selectedStarterId, 
      customText, 
      sermonMode, 
      sermonLength, 
      sermonTone
    ];
    
    // Check if dependencies truly changed to avoid React Strict Mode / mount bugs
    const changed = prevDeps.current.some((dep, i) => dep !== currentDeps[i]);
    if (changed) {
      if (output) {
        setOutput('');
        setTranslatedOutput('');
        setActiveSermonId(null);
      }
    }
    prevDeps.current = currentDeps;
  }, [inputMode, readingsDate, selectedReadingIdx, selectedStarterId, customText, sermonMode, sermonLength, sermonTone]);

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
          mode: sermonMode, 
          tone: sermonTone === 'reflective' ? 'contemplative' : sermonTone, 
          duration: sermonLength, 
          language 
        }),
      });

      const rawText = await res.text();
      if (!rawText || !rawText.trim().startsWith('{')) {
        throw new Error(res.status === 404 ? 'API not available in local dev.' : `Server error (${res.status})`);
      }

      const data = JSON.parse(rawText);
      if (!res.ok) throw new Error(data.message || 'Failed to generate.');
      
      const finalOutput = sanitizeSermonDisplay(data.response ?? '');
      setOutput(finalOutput);
      setOriginLang(language);
      
      // Save to 48-hour history
      const saved = saveSermon({
        sourceText,
        mode: sermonMode,
        duration: sermonLength,
        tone: sermonTone,
        response: finalOutput,
        lang: language,
        isTemporary: true
      });
      setActiveSermonId(saved.id);
      setSavedItems(loadSavedSermons());
      
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
          updateSavedSermonTranslation(saved.id, trans);
          setSavedItems(loadSavedSermons());
        }
      }).catch(e => console.warn('[SermonAIScreen] Background auto-translation failed', e))
        .finally(() => setIsTranslating(false));

    } catch (err: any) {
      setGenError(err.message || 'An error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleBookmark = () => {
    if (!activeSermonId) return;
    const item = savedItems.find(r => r.id === activeSermonId);
    if (!item) return;

    const newTempStatus = !item.isTemporary;
    updateSavedSermonFlags(activeSermonId, {
      isTemporary: newTempStatus,
      isFavorite: newTempStatus ? false : item.isFavorite,
      ...(newTempStatus ? { timestamp: Date.now() } : {})
    });
    setSavedItems(loadSavedSermons());
  };

  const handleToggleFavorite = () => {
    if (!activeSermonId) return;
    const item = savedItems.find(r => r.id === activeSermonId);
    if (!item) return;

    const newFav = !item.isFavorite;
    if (newFav) {
      updateSavedSermonFlags(activeSermonId, { isFavorite: true, isTemporary: false });
    } else {
      updateSavedSermonFlags(activeSermonId, { isFavorite: false });
    }
    setSavedItems(loadSavedSermons());
  };

  const activeSermonRecord = savedItems.find(r => r.id === activeSermonId);

  const handleDeleteSaved = (id: string) => {
    deleteSavedSermon(id);
    setSavedItems(loadSavedSermons());
  };

  const handlePlaySaved = async (item: SavedSermon) => {
    if (playingSavedId === item.id) {
      ttsManager.stop();
      setPlayingSavedId(null);
      return;
    }
    ttsManager.stop();
    setIsPlaying(false);
    setPlayingSavedId(item.id);
    await ttsManager.setLanguage(language as any);
    ttsManager.setOnEnd(() => setPlayingSavedId(null));
    
    const originLang = item.lang || 'en';
    const textToSpeak = (originLang !== language && item.response_translated) ? item.response_translated : item.response;
    const spokenText = sanitizeAIResponseForSpeech(textToSpeak, language);
    const chunks = spokenText.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) ?? [spokenText];
    try {
      await ttsManager.speakSegments(
        chunks.map((text, i) => ({ text: text.trim(), gender: 'female' as const, postPause: i < chunks.length - 1 ? 200 : 0 }))
      );
    } catch { setPlayingSavedId(null); }
  };

  const handleToggleSavedBookmark = (item: SavedSermon) => {
    const newTempStatus = !item.isTemporary;
    updateSavedSermonFlags(item.id, {
      isTemporary: newTempStatus,
      isFavorite: newTempStatus ? false : item.isFavorite,
      ...(newTempStatus ? { timestamp: Date.now() } : {})
    });
    setSavedItems(loadSavedSermons());
  };

  const handleToggleSavedFavorite = (item: SavedSermon) => {
    const newFav = !item.isFavorite;
    if (newFav) {
      updateSavedSermonFlags(item.id, { isFavorite: true, isTemporary: false });
    } else {
      updateSavedSermonFlags(item.id, { isFavorite: false });
    }
    setSavedItems(loadSavedSermons());
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
    if (isPlaying) { ttsManager.stop(); setIsPlaying(false); return; }
    await ttsManager.setLanguage(language);
    ttsManager.setOnEnd(() => setIsPlaying(false));
    
    const textToSpeak = (originLang !== language && translatedOutput) ? translatedOutput : output;
    const spokenText = sanitizeAIResponseForSpeech(textToSpeak, language);
    const chunks = spokenText.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) ?? [spokenText];
    setIsPlaying(true);
    try {
      await ttsManager.speakSegments(
        chunks.map((text, i) => ({ text: text.trim(), gender: 'female' as const, postPause: i < chunks.length - 1 ? 200 : 0 }))
      );
    } catch { setIsPlaying(false); }
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

  /* ── UI Strings ── */
  const t = {
    title: language === 'es' ? 'Sermón IA' : 'Sermon AI',
    subtitle: language === 'es' ? 'Crea sermones católicos llenos de fe en minutos.' : 'Create faith-filled, Catholic sermons in minutes.',
    step1: language === 'es' ? 'Fuente' : 'Source',
    step1Desc: language === 'es' ? '¿En qué deseas basar tu sermón?' : 'What would you like your sermon to be based on?',
    step2: language === 'es' ? 'Estilo' : 'Style',
    step2Desc: language === 'es' ? 'Elige cómo debe sonar tu sermón.' : 'Choose how your sermon should sound.',
    step3: language === 'es' ? 'Generar' : 'Generate',
    step3Desc: language === 'es' ? 'Revisa tus selecciones.' : 'Review your selections.',
    generateBtn: language === 'es' ? 'Crear Sermón' : 'Build Sermon',
    generating: language === 'es' ? 'Creando...' : 'Building...',
    security: language === 'es' ? 'Tu contenido es privado y seguro.' : 'Your content is private and secure.',
    yourSermon: language === 'es' ? 'Tu Sermón IA' : 'Your Sermon AI',
    draft: language === 'es' ? 'Borrador' : 'Draft',
    listen: language === 'es' ? 'Escuchar' : 'Listen',
    copy: language === 'es' ? 'Copiar' : 'Copy',
    expand: language === 'es' ? 'Expandir sermón completo' : 'Expand full sermon',
    collapse: language === 'es' ? 'Contraer' : 'Collapse',
    helper: language === 'es' ? 'Estos ajustes ayudan a dar forma al tono y la profundidad.' : 'These settings help shape the tone and depth.',
    dailyReadings: language === 'es' ? 'Lecturas del Día' : 'Daily Readings',
    starters: language === 'es' ? 'Ideas de Sermones' : 'Sermon Starters',
    custom: language === 'es' ? 'Texto Libre' : 'Custom',
    placeholder: language === 'es' ? 'Ej: Lucas 5; Fiesta de la Ascensión; una reflexión sobre la misericordia…' : 'E.g.: Luke 5; Feast of the Ascension; a reflection on mercy…',
    tapToChange: language === 'es' ? 'Toca para cambiar' : 'Tap to change',
  };

  return (
    <div className="sermon-screen">
      {/* ── Header ── */}
      <header className="sermon-header">
        <button className="sermon-back-btn-abs" onClick={onBack} aria-label={language === 'es' ? 'Volver' : 'Back'}>
          <ArrowLeft size={24} />
        </button>
        <div className="sermon-brand-group">
          <h1 className="sermon-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} color="var(--sermon-gold)" />
            {t.title}
          </h1>
        </div>
        <button className="sermon-help-btn-abs" onClick={() => setShowSettings(true)} aria-label="Settings">
          <Settings size={22} />
        </button>
      </header>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <div className="sermon-tab-strip">
        <button className={`sermon-tab ${activeTab === 'build' ? 'active' : ''}`} onClick={() => setActiveTab('build')}>
          {language === 'es' ? 'Crear' : 'Build'}
        </button>
        <button className={`sermon-tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
          {language === 'es' ? 'Guardado' : 'Saved'}
        </button>
      </div>

      <div className="sermon-body">
        
        {activeTab === 'build' ? (
          <>
            {/* ── Step 1: Source ── */}
        <section className="sermon-step-card">
          <div className="sermon-step-header">
            <h2 className="sermon-step-title">{t.step1}</h2>
          </div>
          <p className="sermon-step-desc">{t.step1Desc}</p>

          <div className="sermon-control-group">
            <div className="sermon-select-with-action">
              <div className="sermon-style-summary" style={{ flex: 1, margin: 0 }} onClick={() => setShowInputModeOptions(!showInputModeOptions)}>
                <div className="sermon-style-summary-content">
                  <span className="sermon-input-icon" style={{ position: 'static', transform: 'none', color: 'var(--sermon-gold)' }}>
                    {inputMode === 'readings' ? <BookOpen size={18} /> : inputMode === 'suggestions' ? <List size={18} /> : <Type size={18} />}
                  </span>
                  <span className="sermon-style-summary-values" style={{ color: 'var(--sermon-text)' }}>
                    {inputMode === 'readings' ? t.dailyReadings : inputMode === 'suggestions' ? t.starters : t.custom}
                  </span>
                </div>
                <ChevronDown size={18} className={`sermon-style-expand-icon${showInputModeOptions ? ' expanded' : ''}`} />
              </div>

              {inputMode === 'readings' && (
                <div style={{ position: 'relative' }}>
                  <button 
                    className="sermon-inline-action-btn" 
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

            {showInputModeOptions && (
              <div className="sermon-starter-select-list" style={{ marginTop: '4px' }}>
                  <div className={`sermon-starter-item${inputMode === 'readings' ? ' selected' : ''}`} onClick={() => { setInputMode('readings'); setShowInputModeOptions(false); }}>
                    <BookOpen size={18} className="sermon-starter-item-icon" style={{ color: 'var(--sermon-gold)' }} />
                    <div className="sermon-starter-item-text">
                       <span className="sermon-starter-item-title">{t.dailyReadings}</span>
                    </div>
                  </div>
                  <div className={`sermon-starter-item${inputMode === 'suggestions' ? ' selected' : ''}`} onClick={() => { setInputMode('suggestions'); setShowInputModeOptions(false); }}>
                    <List size={18} className="sermon-starter-item-icon" style={{ color: 'var(--sermon-gold)' }} />
                    <div className="sermon-starter-item-text">
                       <span className="sermon-starter-item-title">{t.starters}</span>
                    </div>
                  </div>
                  <div className={`sermon-starter-item${inputMode === 'custom' ? ' selected' : ''}`} onClick={() => { setInputMode('custom'); setShowInputModeOptions(false); }}>
                    <Type size={18} className="sermon-starter-item-icon" style={{ color: 'var(--sermon-gold)' }} />
                    <div className="sermon-starter-item-text">
                       <span className="sermon-starter-item-title">{t.custom}</span>
                    </div>
                  </div>
              </div>
            )}
          </div>

          {/* Dynamic Content based on Source */}
          {inputMode === 'readings' && (
            <div className="sermon-control-group">
              <label className="sermon-label">{language === 'es' ? 'Lectura' : 'Reading'}</label>
              <div className="sermon-style-summary" style={{ margin: 0 }} onClick={() => setShowReadingOptions(!showReadingOptions)}>
                <div className="sermon-style-summary-content">
                   <span className="sermon-style-summary-values" style={{ color: 'var(--sermon-text)' }}>
                     {loadingReadings ? (language === 'es' ? 'Cargando...' : 'Loading...') : readingOptions.length > 0 ? (readingOptions[selectedReadingIdx]?.label + (readingOptions[selectedReadingIdx]?.citation ? ` — ${readingOptions[selectedReadingIdx].citation}` : '')) : (language === 'es' ? 'No hay lecturas' : 'No readings')}
                   </span>
                </div>
                <ChevronDown size={18} className={`sermon-style-expand-icon${showReadingOptions ? ' expanded' : ''}`} />
              </div>

              {showReadingOptions && readingOptions.length > 0 && (
                <div className="sermon-starter-select-list" style={{ marginTop: '4px' }}>
                  {readingOptions.map((opt, i) => (
                    <div key={i} className={`sermon-starter-item${selectedReadingIdx === i ? ' selected' : ''}`} onClick={() => { setSelectedReadingIdx(i); setShowReadingOptions(false); }}>
                      <div className="sermon-starter-item-text">
                         <span className="sermon-starter-item-title">{opt.label}</span>
                         {opt.citation && <span className="sermon-starter-item-sub">{opt.citation}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {inputMode === 'suggestions' && (
            <div className="sermon-starter-select-list">
              {selectedStarterId && !showStartersList ? (
                <div className="sermon-starter-item selected" onClick={() => setShowStartersList(true)}>
                  <span className="sermon-starter-item-icon">{starters.find(s => s.id === selectedStarterId)?.icon}</span>
                  <div className="sermon-starter-item-text">
                    <span className="sermon-starter-item-title">{starters.find(s => s.id === selectedStarterId)?.title}</span>
                    <span className="sermon-starter-item-sub">{t.tapToChange}</span>
                  </div>
                  <ChevronDown size={18} color="var(--sermon-gold)" />
                </div>
              ) : (
                starters.map(s => (
                  <div key={s.id} className={`sermon-starter-item${selectedStarterId === s.id ? ' selected' : ''}`} onClick={() => { setSelectedStarterId(s.id); setShowStartersList(false); }}>
                    <span className="sermon-starter-item-icon">{s.icon}</span>
                    <div className="sermon-starter-item-text">
                      <span className="sermon-starter-item-title">{s.title}</span>
                      <span className="sermon-starter-item-sub">{s.sub}</span>
                    </div>
                    <ChevronRight size={18} color="var(--sermon-text-dim)" />
                  </div>
                ))
              )}
            </div>
          )}

          {inputMode === 'custom' && (
            <textarea 
              className="sermon-textarea" 
              value={customText} 
              onChange={e => setCustomText(e.target.value)}
              placeholder={t.placeholder}
            />
          )}
        </section>

        {/* ── Step 2: Style (Collapsible + Chips) ── */}
        <section className="sermon-step-card">
          <div className="sermon-step-header">
            <h2 className="sermon-step-title">{t.step2}</h2>
          </div>

          <div className="sermon-style-summary" onClick={() => setShowStyleOptions(!showStyleOptions)}>
            <div className="sermon-style-summary-content">
              <span className="sermon-style-summary-values">
                {sermonMode === 'standard' ? (language === 'es' ? 'Estándar' : 'Standard') : (language === 'es' ? 'Abstracto' : 'Abstract')} • {sermonLength === 'short' ? 'Short' : sermonLength === 'medium' ? 'Medium' : 'Long'} • {sermonTone.charAt(0).toUpperCase() + sermonTone.slice(1)}
              </span>
            </div>
            <ChevronDown size={18} className={`sermon-style-expand-icon${showStyleOptions ? ' expanded' : ''}`} />
          </div>

          {showStyleOptions && (
            <>
              <div className="sermon-control-group">
                <label className="sermon-label">{language === 'es' ? 'Modo' : 'Mode'}</label>
                <div className="sermon-segments">
                  <button className={`sermon-segment-btn${sermonMode === 'standard' ? ' active' : ''}`} onClick={() => setSermonMode('standard')}>
                    {language === 'es' ? 'Estándar' : 'Standard'}
                  </button>
                  <button className={`sermon-segment-btn${sermonMode === 'abstract' ? ' active' : ''}`} onClick={() => setSermonMode('abstract')}>
                    {language === 'es' ? 'Abstracto' : 'Abstract'}
                  </button>
                </div>
              </div>

              <div className="sermon-control-group">
                <label className="sermon-label">{language === 'es' ? 'Duración' : 'Length'}</label>
                <div className="sermon-segments">
                  <button className={`sermon-segment-btn${sermonLength === 'short' ? ' active' : ''}`} onClick={() => setSermonLength('short')}>
                    {language === 'es' ? 'Corto' : 'Short'}
                  </button>
                  <button className={`sermon-segment-btn${sermonLength === 'medium' ? ' active' : ''}`} onClick={() => setSermonLength('medium')}>
                    {language === 'es' ? 'Medio' : 'Medium'}
                  </button>
                  <button className={`sermon-segment-btn${sermonLength === 'long' ? ' active' : ''}`} onClick={() => setSermonLength('long')}>
                    {language === 'es' ? 'Largo' : 'Long'}
                  </button>
                </div>
              </div>

              <div className="sermon-control-group">
                <label className="sermon-label">{language === 'es' ? 'Tono' : 'Tone'}</label>
                <div className="sermon-segments">
                  <button className={`sermon-segment-btn${sermonTone === 'pastoral' ? ' active' : ''}`} onClick={() => setSermonTone('pastoral')}>
                    {language === 'es' ? 'Pastoral' : 'Pastoral'}
                  </button>
                  <button className={`sermon-segment-btn${sermonTone === 'reflective' ? ' active' : ''}`} onClick={() => setSermonTone('reflective')}>
                    {language === 'es' ? 'Reflexivo' : 'Reflective'}
                  </button>
                  <button className={`sermon-segment-btn${sermonTone === 'teaching' ? ' active' : ''}`} onClick={() => setSermonTone('teaching')}>
                    {language === 'es' ? 'Didáctico' : 'Teaching'}
                  </button>
                </div>
              </div>

              <div className="sermon-helper-box">
                <Sparkles size={14} />
                <span>{t.helper}</span>
              </div>
            </>
          )}
        </section>

        {/* ── Step 3: Generate ── */}
        <section className="sermon-step-card sermon-generate-card">
          <div className="sermon-step-header" style={{ alignSelf: 'flex-start' }}>
            <h2 className="sermon-step-title">{t.step3}</h2>
          </div>
          <p className="sermon-step-desc" style={{ alignSelf: 'flex-start', textAlign: 'left' }}>{t.step3Desc}</p>

          <button className="sermon-btn-generate" onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
            {isGenerating ? (
              <>
                <div className="sermon-spinner" />
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
          <div className="sermon-result-card" ref={resultRef}>
            {genError ? (
              <div className="sermon-error-msg">{genError}</div>
            ) : (
              <>
                <div className="sermon-result-header">
                  <div className="sermon-result-title-group">
                    <h3 className="sermon-result-title">{t.yourSermon}</h3>
                  </div>
                </div>

                <div className={`sermon-result-body${!isExpanded ? ' sermon-text-collapsed' : ''}`}>
                  {(originLang !== language && translatedOutput) ? translatedOutput : output}
                  {(originLang !== language && !translatedOutput && isTranslating) && (
                    <span className="ai-translating-indicator" style={{fontStyle: 'italic', opacity: 0.7}}> {language === 'es' ? '(traduciendo...)' : '(translating...)'}</span>
                  )}
                </div>

                <div className="sermon-result-footer-actions">
                  <button className="sermon-icon-btn" onClick={handleSpeak} title={isPlaying ? 'Stop' : 'Listen'}>
                    {isPlaying ? <Square size={18} fill="currentColor" /> : <Volume2 size={18} />}
                  </button>
                  <button className={`sermon-icon-btn ${activeSermonRecord && !activeSermonRecord.isTemporary ? 'saved' : ''}`} onClick={handleToggleBookmark} title={language === 'es' ? 'Guardar' : 'Save'}>
                    {(activeSermonRecord && !activeSermonRecord.isTemporary) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                  <button className={`sermon-icon-btn ${activeSermonRecord?.isFavorite ? 'saved' : ''}`} onClick={handleToggleFavorite} title={language === 'es' ? 'Favorito' : 'Favorite'}>
                    <Star size={18} fill={activeSermonRecord?.isFavorite ? 'currentColor' : 'none'} color={activeSermonRecord?.isFavorite ? 'inherit' : 'currentColor'} />
                  </button>
                  <button className="sermon-icon-btn" onClick={handleCopy} title={language === 'es' ? 'Copiar' : 'Copy'}>
                    {copySuccess ? <Check size={18} color="#4ade80" /> : <Copy size={18} />}
                  </button>
                </div>

                <button className="sermon-expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
                  <span>{isExpanded ? t.collapse : t.expand}</span>
                  <ChevronDown size={18} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                <div className="sermon-result-footer">
                  {readingsDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {getPromptValue().split(' — ')[1] || getPromptValue()} • {sermonMode === 'standard' ? 'Standard' : 'Abstract'} • {sermonLength} • {sermonTone}
                </div>
              </>
            )}
          </div>
        )}
          </>
        ) : (
          <div className="sermon-saved-tab">
            <div className="sermon-saved-filter-row">
              {['All Saved', 'Favorites', 'Recent 48h history'].map((tabStr, idx) => {
                const tabVal = ['all', 'favorites', 'recent'][idx] as 'all' | 'favorites' | 'recent';
                const langStr = language === 'es' ? ['Todo Guardado', 'Favoritos', 'Historial 48h'][idx] : tabStr;
                const count = savedItems.filter(item => {
                  if (tabVal === 'favorites') return item.isFavorite;
                  if (tabVal === 'recent') return item.isTemporary;
                  return !item.isTemporary;
                }).length;
                return (
                  <button key={tabVal} onClick={() => setSavedTabFilter(tabVal)} className={`sermon-saved-filter-btn ${savedTabFilter === tabVal ? 'active' : ''}`}>
                    {langStr} ({count})
                  </button>
                );
              })}
            </div>
            
            {savedItems.filter(item => {
              if (savedTabFilter === 'favorites') return item.isFavorite;
              if (savedTabFilter === 'recent') return item.isTemporary;
              return !item.isTemporary;
            }).length === 0 ? (
              <div className="sermon-saved-empty">
                {language === 'es' ? 'No hay sermones guardados aún.' : 'No saved sermons yet.'}
              </div>
            ) : (
              <div className="sermon-saved-list">
                {savedItems.filter(item => {
                  if (savedTabFilter === 'favorites') return item.isFavorite;
                  if (savedTabFilter === 'recent') return item.isTemporary;
                  return !item.isTemporary;
                }).map(item => {
                  const originLang = item.lang || 'en';
                  const responseDisplay = (originLang !== language && item.response_translated) ? item.response_translated : item.response;
                  const isExpanded = expandedCards.has(item.id);
                  const isPlayingThis = playingSavedId === item.id;
                  const toggleExpand = () => setExpandedCards(prev => { const next = new Set(prev); next.has(item.id) ? next.delete(item.id) : next.add(item.id); return next; });

                  return (
                    <div key={item.id} className={`sermon-saved-card ${isExpanded ? 'expanded' : ''}`} onClick={toggleExpand}>
                      <div className="sermon-saved-card-header">
                        <div className="sermon-saved-card-title-area">
                          <div className="sermon-saved-card-title">{item.sourceText}</div>
                          <div className="sermon-saved-card-meta">
                            {item.mode === 'standard' ? (language === 'es' ? 'Estándar' : 'Standard') : (language === 'es' ? 'Abstracto' : 'Abstract')} • {item.duration} • {item.tone}
                          </div>
                          <div className="sermon-saved-card-actions" onClick={(e) => e.stopPropagation()}>
                            <button className={`sermon-icon-btn ${isPlayingThis ? 'playing' : ''}`} onClick={(e) => { e.stopPropagation(); handlePlaySaved(item); }}>
                              {isPlayingThis ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
                            </button>
                            <button className={`sermon-icon-btn ${!item.isTemporary ? 'saved' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggleSavedBookmark(item); }}>
                              {!item.isTemporary ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                            </button>
                            <button className={`sermon-icon-btn ${item.isFavorite ? 'saved' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggleSavedFavorite(item); }}>
                              <Star size={16} fill={item.isFavorite ? 'currentColor' : 'none'} color={item.isFavorite ? 'inherit' : 'currentColor'} />
                            </button>
                            <button className="sermon-icon-btn" onClick={(e) => { e.stopPropagation(); handleCopyText(responseDisplay); }}>
                              <Copy size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="sermon-saved-card-right">
                           <div className="sermon-saved-card-date">
                             {new Date(item.date + 'T12:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                           </div>
                           <div className="sermon-saved-card-chevron">
                             {isExpanded ? <ChevronUp size={18} color="var(--sermon-gold)" /> : <ChevronDown size={18} color="rgba(244, 231, 212, 0.4)" />}
                           </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="sermon-saved-card-content" onClick={e => e.stopPropagation()}>
                          <div className="sermon-saved-card-response">{responseDisplay}</div>
                          <div className="sermon-saved-card-footer">
                            <span className="sermon-badge-draft">{originLang.toUpperCase()}</span>
                            <button className="sermon-saved-card-discard" onClick={(e) => { e.stopPropagation(); handleDeleteSaved(item.id); }}>
                              <Trash2 size={14} />
                              {language === 'es' ? 'DESCARTAR' : 'DISCARD'}
                            </button>
                          </div>
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
    </div>
  );
}
