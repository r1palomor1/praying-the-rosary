import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ScrollText, Calendar, Volume2, Square, Copy, Check, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
import './SermonAIScreen.css';

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
type SermonTone  = 'pastoral' | 'teaching' | 'contemplative' | 'urgent';

interface ReadingOption { label: string; citation: string; }

const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';

/* ─── Component ─── */
export default function SermonAIScreen({ onBack }: { onBack: () => void }) {
  const { language } = useApp();
  const starters = language === 'es' ? STARTERS_ES : STARTERS_EN;

  /* Input mode */
  const [inputMode, setInputMode] = useState<InputMode>('readings');

  /* Daily Readings */
  const [readingsDate, setReadingsDate]             = useState(new Date());
  const [readingOptions, setReadingOptions]         = useState<ReadingOption[]>([]);
  const [selectedReadingIdx, setSelectedReadingIdx] = useState(0);
  const [loadingReadings, setLoadingReadings]       = useState(false);

  /* Suggestions */
  const [selectedStarterId, setSelectedStarterId] = useState<string | null>(null);

  /* Custom */
  const [customText, setCustomText] = useState('');

  /* Controls */
  const [sermonMode,   setSermonMode]   = useState<SermonMode>('standard');
  const [sermonLength, setSermonLength] = useState<SermonLen>('medium');
  const [sermonTone,   setSermonTone]   = useState<SermonTone>('pastoral');

  /* Output */
  const [isGenerating, setIsGenerating] = useState(false);
  const [output,       setOutput]       = useState('');
  const [genError,     setGenError]     = useState('');

  /* TTS / Copy */
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [copySuccess,  setCopySuccess]  = useState(false);

  /* Date picker ref */
  const dateInputRef = useRef<HTMLInputElement>(null);

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
        setSelectedReadingIdx(0);
      })
      .catch(() => { if (!cancelled) setReadingOptions([]); })
      .finally(() => { if (!cancelled) setLoadingReadings(false); });
    return () => { cancelled = true; };
  }, [readingsDate, language]);

  /* ── Resolved prompt ── */
  const getPrompt = (): string => {
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

  const canGenerate = getPrompt().length > 0 && !isGenerating;

  /* ── Generate ── */
  const handleGenerate = async () => {
    const sourceText = getPrompt();
    if (!sourceText) return;
    if (isPlaying) { ttsManager.stop(); setIsPlaying(false); }
    setIsGenerating(true);
    setOutput('');
    setGenError('');
    try {
      const res = await fetch('/api/sermon', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sourceText, mode: sermonMode, tone: sermonTone, duration: sermonLength, language }),
      });

      // Guard against empty or non-JSON responses (e.g. local dev 404)
      const rawText = await res.text();
      if (!rawText || !rawText.trim().startsWith('{')) {
        throw new Error(
          res.status === 404
            ? 'Sermon API not available in local dev. Deploy to Vercel to test.'
            : `Server error (${res.status}). Please try again.`
        );
      }

      const data = JSON.parse(rawText);
      if (!res.ok) throw new Error(data.details || data.message || data.error || 'Failed to generate.');
      setOutput(data.response ?? '');
    } catch (err: any) {
      setGenError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };


  /* ── Clear ── */
  const handleClear = () => {
    if (isPlaying) { ttsManager.stop(); setIsPlaying(false); }
    setOutput(''); setGenError(''); setCustomText(''); setSelectedStarterId(null);
  };

  /* ── TTS ── */
  const handleSpeak = async () => {
    if (!output) return;
    if (isPlaying) { ttsManager.stop(); setIsPlaying(false); return; }
    await ttsManager.setLanguage(language);
    ttsManager.setOnEnd(() => setIsPlaying(false));
    const chunks = output.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) ?? [output];
    setIsPlaying(true);
    try {
      await ttsManager.speakSegments(
        chunks.map((text, i) => ({ text: text.trim(), gender: 'female' as const, postPause: i < chunks.length - 1 ? 200 : 0 }))
      );
    } catch { setIsPlaying(false); }
  };

  /* ── Copy ── */
  const handleCopy = async () => {
    if (!output) return;
    try { await navigator.clipboard.writeText(output); }
    catch { const t = document.createElement('textarea'); t.value = output; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1500);
  };

  /* ── Date picker ── */
  const triggerDatePicker = () => {
    if ((dateInputRef.current as any)?.showPicker) (dateInputRef.current as any).showPicker();
    else dateInputRef.current?.click();
  };
  const yyyy = readingsDate.getFullYear();
  const mStr = String(readingsDate.getMonth() + 1).padStart(2, '0');
  const dStr = String(readingsDate.getDate()).padStart(2, '0');
  const htmlDate = `${yyyy}-${mStr}-${dStr}`;

  /* ── Badge labels ── */
  const lenLabel  = sermonLength === 'short' ? (language === 'es' ? 'Aprox. 1-2 min' : 'Approx. 1-2 min')
                  : sermonLength === 'long'  ? (language === 'es' ? 'Aprox. 5+ min'  : 'Approx. 5+ min')
                  :                           (language === 'es' ? 'Aprox. 3-4 min' : 'Approx. 3-4 min');
  const toneLabel = ({ pastoral: language === 'es' ? 'Pastoral' : 'Pastoral', teaching: language === 'es' ? 'Didáctico' : 'Teaching', contemplative: language === 'es' ? 'Contemplativo' : 'Contemplative', urgent: language === 'es' ? 'Profético' : 'Prophetic' } as Record<SermonTone, string>)[sermonTone];

  /* ── Render ── */
  return (
    <div className="sermon-screen">

      {/* ── Header ── */}
      <header className="sermon-header">
        <button className="sermon-nav-btn" onClick={onBack} aria-label={language === 'es' ? 'Volver' : 'Back'}>
          <ArrowLeft size={22} />
        </button>
        <div className="sermon-header-brand">
          <ScrollText size={18} />
          <span>{language === 'es' ? 'Borrador de Sermón IA' : 'AI Sermon Draft'}</span>
        </div>
        <div style={{ width: 40 }} />
      </header>

      <div className="sermon-body">

        {/* ── Card 1: Source ── */}
        <div className="sermon-card">
          <p className="sermon-card-question">
            {language === 'es'
              ? '¿En qué deseas basar tu sermón?'
              : 'What would you like your sermon to be based on?'}
          </p>

          {/* Pills */}
          <div className="sermon-pills">
            {(['readings', 'suggestions', 'custom'] as InputMode[]).map(m => (
              <button
                key={m}
                className={`sermon-pill${inputMode === m ? ' active' : ''}`}
                onClick={() => setInputMode(m)}
              >
                {m === 'readings'    ? (language === 'es' ? 'Lecturas del Día' : 'Daily Readings') :
                 m === 'suggestions' ? (language === 'es' ? 'Ideas de Sermones' : 'Sermon Starters') :
                                       (language === 'es' ? 'Texto Libre'       : 'Custom')}
              </button>
            ))}
          </div>

          {/* ── Mode: Daily Readings ── */}
          {inputMode === 'readings' && (
            <div className="sermon-readings-panel">
              <div className="sermon-readings-row">
                <span className="sermon-readings-date-label">
                  {readingsDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <button className="sermon-icon-btn" onClick={triggerDatePicker} aria-label="Select date">
                    <Calendar size={16} />
                  </button>
                  <input ref={dateInputRef} type="date" value={htmlDate}
                    onChange={e => { if (e.target.value) { const [y,mo,d] = e.target.value.split('-').map(Number); setReadingsDate(new Date(y, mo-1, d)); }}}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', inset: 0, width: '100%', height: '100%' }}
                  />
                </div>
              </div>

              {loadingReadings
                ? <p className="sermon-muted">{language === 'es' ? 'Cargando lecturas…' : 'Loading readings…'}</p>
                : readingOptions.length === 0
                  ? <p className="sermon-muted">{language === 'es' ? 'No se encontraron lecturas.' : 'No readings found.'}</p>
                  : (
                    <select className="sermon-select" value={selectedReadingIdx}
                      onChange={e => setSelectedReadingIdx(Number(e.target.value))}>
                      {readingOptions.map((opt, i) => (
                        <option key={i} value={i}>
                          {opt.label}{opt.citation ? ` — ${opt.citation}` : ''}
                        </option>
                      ))}
                    </select>
                  )
              }
            </div>
          )}

          {/* ── Mode: Sermon Starters ── */}
          {inputMode === 'suggestions' && (
            <div className="sermon-starters-list">
              {starters.map(s => (
                <div
                  key={s.id}
                  className={`sermon-starter-card${selectedStarterId === s.id ? ' selected' : ''}`}
                  onClick={() => setSelectedStarterId(s.id)}
                  role="button" tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedStarterId(s.id)}
                >
                  <span className="sermon-starter-icon">{s.icon}</span>
                  <div className="sermon-starter-text">
                    <span className="sermon-starter-title">{s.title}</span>
                    <span className="sermon-starter-sub">{s.sub}</span>
                  </div>
                  <ChevronRight size={16} className="sermon-starter-arrow" />
                </div>
              ))}
            </div>
          )}

          {/* ── Mode: Custom ── */}
          {inputMode === 'custom' && (
            <textarea
              className="sermon-textarea"
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              placeholder={language === 'es'
                ? 'Ej: Lucas 5, Fiesta de la Ascensión, una reflexión sobre la misericordia…'
                : 'E.g.: Luke 5, Feast of the Ascension, a teaching on mercy…'}
              rows={4}
            />
          )}
        </div>

        {/* ── Card 2: Controls ── */}
        <div className="sermon-card">
          {/* Mode toggle */}
          <div className="sermon-controls-row">
            <div className="sermon-mode-section">
              <span className="sermon-control-label">{language === 'es' ? 'Modo' : 'Mode'}</span>
              <div className="sermon-mode-tabs">
                <button
                  className={`sermon-mode-tab${sermonMode === 'standard' ? ' active-standard' : ''}`}
                  onClick={() => setSermonMode('standard')}
                >
                  {language === 'es' ? 'Estándar' : 'Standard'}
                </button>
                <button
                  className={`sermon-mode-tab${sermonMode === 'abstract' ? ' active-abstract' : ''}`}
                  onClick={() => setSermonMode('abstract')}
                >
                  {language === 'es' ? 'Abstracto' : 'Abstract'}
                </button>
              </div>
            </div>

            <div className="sermon-selects-row">
              <div className="sermon-select-group">
                <label className="sermon-control-label" htmlFor="sermon-length">
                  {language === 'es' ? 'Duración' : 'Length'}
                </label>
                <select id="sermon-length" className="sermon-select" value={sermonLength}
                  onChange={e => setSermonLength(e.target.value as SermonLen)}>
                  <option value="short">{language === 'es' ? 'Corto (1-2 min)' : 'Short (1-2 min)'}</option>
                  <option value="medium">{language === 'es' ? 'Estándar (3-4 min)' : 'Standard (3-4 min)'}</option>
                  <option value="long">{language === 'es' ? 'Largo (5+ min)' : 'Long (5+ min)'}</option>
                </select>
              </div>

              <div className="sermon-select-group">
                <label className="sermon-control-label" htmlFor="sermon-tone">
                  {language === 'es' ? 'Tono' : 'Tone'}
                </label>
                <select id="sermon-tone" className="sermon-select" value={sermonTone}
                  onChange={e => setSermonTone(e.target.value as SermonTone)}>
                  <option value="pastoral">{language === 'es' ? 'Pastoral'      : 'Pastoral'}</option>
                  <option value="teaching">{language === 'es' ? 'Didáctico'     : 'Teaching'}</option>
                  <option value="contemplative">{language === 'es' ? 'Contemplativo' : 'Contemplative'}</option>
                  <option value="urgent">{language === 'es' ? 'Profético'     : 'Prophetic'}</option>
                </select>
              </div>
            </div>
          </div>

          <p className="sermon-mode-note">
            {sermonMode === 'abstract'
              ? (language === 'es' ? 'Modo Abstracto: reflexión contemplativa y poética.' : 'Abstract mode: contemplative, poetic reflection shaped for the selected length.')
              : (language === 'es' ? 'Modo Estándar: homilía pastoral con estructura litúrgica.' : 'Standard mode: pastoral homily with liturgical structure.')}
          </p>

          {/* Actions */}
          <div className="sermon-actions">
            <button className="sermon-btn-primary" onClick={handleGenerate} disabled={!canGenerate}>
              {isGenerating
                ? (language === 'es' ? 'Generando…' : 'Generating…')
                : (language === 'es' ? 'Generar' : 'Generate')}
            </button>
            <button className="sermon-btn-secondary" onClick={handleClear}>
              {language === 'es' ? 'Limpiar' : 'Clear'}
            </button>
          </div>
        </div>

        {/* ── Card 3: Output ── */}
        <div className="sermon-card sermon-output-card">
          <div className="sermon-output-header">
            <div className="sermon-output-meta">
              <span><strong>{language === 'es' ? 'Modo:' : 'Mode:'}</strong> {sermonMode === 'abstract' ? (language === 'es' ? 'Abstracto' : 'Abstract') : (language === 'es' ? 'Estándar' : 'Standard')}</span>
              <span><strong>{language === 'es' ? 'Duración:' : 'Length:'}</strong> {lenLabel}</span>
              <span><strong>{language === 'es' ? 'Tono:' : 'Tone:'}</strong> {toneLabel}</span>
            </div>
            <div className="sermon-output-tools">
              <button className="sermon-tool-btn" onClick={handleSpeak} disabled={!output || isGenerating}
                aria-label={isPlaying ? 'Stop' : 'Listen'} title={isPlaying ? 'Stop' : 'Listen'}>
                {isPlaying ? <Square size={15} fill="currentColor" /> : <Volume2 size={15} />}
              </button>
              <button className="sermon-tool-btn" onClick={handleCopy} disabled={!output || isGenerating}
                aria-label="Copy" title="Copy">
                {copySuccess ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {isGenerating && (
            <div className="sermon-generating">
              <div className="sermon-spinner" />
              <span>{language === 'es' ? 'Preparando el sermón…' : 'Preparing your sermon…'}</span>
            </div>
          )}

          {genError && <p className="sermon-error">{genError}</p>}

          {output && !isGenerating && (
            <div className="sermon-output-text">{output}</div>
          )}

          {!output && !isGenerating && !genError && (
            <p className="sermon-placeholder">
              {language === 'es' ? 'Tu borrador de sermón aparecerá aquí.' : 'Your sermon draft will appear here.'}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
