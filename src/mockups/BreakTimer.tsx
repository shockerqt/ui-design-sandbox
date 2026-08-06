import React, { useState, useEffect, useRef } from 'react';
import { Tabs } from '@base-ui/react';
import { Play, Pause, RotateCcw, BookmarkPlus, Volume2, VolumeX, Coffee, Footprints, Activity, Eye, Droplet, HeadphoneOff, Sparkles, Trash2, Clock } from 'lucide-react';

/* Pieles disponibles */
const SKINS = [
  { key: 'nocturno', label: 'Instrumento Nocturno' },
  { key: 'tabla', label: 'Tabla Técnica' },
  { key: 'editorial', label: 'Sobremesa Editorial' },
  { key: 'ficha', label: 'Expediente Ficha' }
] as const;

type SkinKey = (typeof SKINS)[number]['key'];

interface BreakLog {
  id: string;
  timestamp: string;
  durationMs: number;
  mode: string;
  tag: string;
  tagIcon: string;
  note: string;
}

const TAG_OPTIONS = [
  { id: 'cafe', label: 'Café / Snack', icon: '☕' },
  { id: 'caminata', label: 'Caminata', icon: '🚶' },
  { id: 'estiramiento', label: 'Estiramiento', icon: '🧘' },
  { id: 'visual', label: 'Pausa Visual', icon: '👁️' },
  { id: 'agua', label: 'Hidratación', icon: '💧' },
  { id: 'meditacion', label: 'Desconexión', icon: '🎧' }
];

export const BreakTimer: React.FC = () => {
  const [skin, setSkin] = useState<SkinKey>('nocturno');
  const [mode, setMode] = useState<'stopwatch' | '5min' | '15min' | 'custom'>('stopwatch');
  const [customMinutes, setCustomMinutes] = useState<number>(10);

  // Timer States
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [targetMs, setTargetMs] = useState<number>(0); // 0 for stopwatch, >0 for countdown
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active Break Metadata
  const [selectedTag, setSelectedTag] = useState<string>('cafe');
  const [noteText, setNoteText] = useState<string>('');

  // Key press visual feedback
  const [spacePressed, setSpacePressed] = useState<boolean>(false);

  // History logs stored in state & localStorage
  // `localStorage` puede no existir o lanzar (modo privado, cookies
  // bloqueadas), asi que se accede siempre a traves de esta guarda.
  const storage = (): Storage | null => {
    try {
      return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
      return null;
    }
  };

  const [logs, setLogs] = useState<BreakLog[]>(() => {
    try {
      const saved = storage()?.getItem('sandbox_break_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);

  // Save logs to localStorage
  useEffect(() => {
    try {
      storage()?.setItem('sandbox_break_logs', JSON.stringify(logs));
    } catch {
      // Sin almacenamiento disponible: el registro vive solo en memoria
    }
  }, [logs]);

  /**
   * Un solo AudioContext para toda la vida del componente. Antes se
   * creaba uno por sonido y nunca se cerraba: los navegadores limitan
   * los contextos simultaneos (~6 en Chrome) y a partir de ahi el
   * audio moria en silencio, tragado por el catch.
   */
  const audioRef = useRef<AudioContext | null>(null);

  const getAudioContext = (): AudioContext | null => {
    if (audioRef.current) return audioRef.current;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    audioRef.current = new AudioCtx();
    return audioRef.current;
  };

  useEffect(() => () => { audioRef.current?.close(); }, []);

  const playSound = (type: 'start' | 'pause' | 'finish' | 'log') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      // El navegador suspende el contexto hasta que hay gesto del usuario
      if (ctx.state === 'suspended') void ctx.resume();
      
      const playTone = (freq: number, startSec: number, durationSec: number, type: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startSec);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + startSec);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startSec + durationSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startSec);
        osc.stop(ctx.currentTime + startSec + durationSec);
      };

      if (type === 'start') {
        playTone(523.25, 0, 0.12); // C5
        playTone(659.25, 0.1, 0.18); // E5
      } else if (type === 'pause') {
        playTone(659.25, 0, 0.1);
        playTone(523.25, 0.08, 0.15);
      } else if (type === 'finish') {
        playTone(523.25, 0, 0.15);
        playTone(659.25, 0.15, 0.15);
        playTone(783.99, 0.3, 0.35); // G5
      } else if (type === 'log') {
        playTone(880, 0, 0.1); // A5
      }
    } catch {
      // Audio not allowed or failed
    }
  };

  // Timer Tick Logic
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now();
      timerRef.current = window.setInterval(() => {
        const now = performance.now();
        const delta = now - startTimeRef.current;
        const total = accumulatedMsRef.current + delta;

        if (targetMs > 0 && total >= targetMs) {
          // Countdown finished
          setElapsedMs(targetMs);
          setIsRunning(false);
          if (timerRef.current) clearInterval(timerRef.current);
          playSound('finish');
        } else {
          setElapsedMs(total);
        }
      }, 30);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      accumulatedMsRef.current = elapsedMs;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, targetMs]);

  // Handle Mode Change
  const handleModeChange = (newMode: string) => {
    setIsRunning(false);
    setElapsedMs(0);
    accumulatedMsRef.current = 0;
    setMode(newMode as any);

    if (newMode === '5min') setTargetMs(5 * 60 * 1000);
    else if (newMode === '15min') setTargetMs(15 * 60 * 1000);
    else if (newMode === 'custom') setTargetMs(customMinutes * 60 * 1000);
    else setTargetMs(0); // stopwatch
  };

  // Toggle Start / Pause
  const toggleTimer = () => {
    setIsRunning(prev => {
      const next = !prev;
      playSound(next ? 'start' : 'pause');
      return next;
    });
  };

  // Reset Timer
  const resetTimer = () => {
    setIsRunning(false);
    setElapsedMs(0);
    accumulatedMsRef.current = 0;
    playSound('pause');
  };

  // Record / Log Break
  const handleRecordBreak = () => {
    if (elapsedMs < 1000) return; // Don't log under 1s

    const tagObj = TAG_OPTIONS.find(t => t.id === selectedTag) || TAG_OPTIONS[0];
    const newLog: BreakLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMs: elapsedMs,
      mode: mode === 'stopwatch' ? 'Cronómetro' : `${Math.round((targetMs || elapsedMs) / 60000)}m Temporizador`,
      tag: tagObj.label,
      tagIcon: tagObj.icon,
      note: noteText.trim() || 'Sin notas'
    };

    setLogs(prev => [newLog, ...prev]);
    setNoteText('');
    playSound('log');
  };

  // Delete single log
  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  // Clear all logs
  const clearLogs = () => {
    if (window.confirm('¿Deseas borrar todo el historial de descansos?')) {
      setLogs([]);
    }
  };

  // Keyboard Shortcuts (Spacebar to Toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInputField) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setSpacePressed(true);
        toggleTimer();
      } else if (e.code === 'KeyR' || e.key.toLowerCase() === 'r') {
        resetTimer();
      } else if (e.code === 'KeyL' || e.key.toLowerCase() === 'l') {
        handleRecordBreak();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRunning, elapsedMs, targetMs, selectedTag, noteText, mode]);

  // Display Calculations
  const isCountdown = targetMs > 0;
  const displayMs = isCountdown ? Math.max(0, targetMs - elapsedMs) : elapsedMs;

  const totalSec = Math.floor(displayMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const millis = Math.floor((displayMs % 1000) / 10);

  const formattedMin = String(minutes).padStart(2, '0');
  const formattedSec = String(seconds).padStart(2, '0');
  const formattedMs = String(millis).padStart(2, '0');

  // Radial progress
  const progressRatio = isCountdown && targetMs > 0 ? Math.min(1, elapsedMs / targetMs) : 0;
  const strokeDashoffset = 502 - 502 * progressRatio;

  // Stats Calculations
  const totalBreaksCount = logs.length;
  const totalRestMs = logs.reduce((acc, curr) => acc + curr.durationMs, 0);
  const totalRestMinutes = Math.round(totalRestMs / 60000);
  const avgRestMinutes = totalBreaksCount > 0 ? (totalRestMs / totalBreaksCount / 60000).toFixed(1) : '0';

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Control del laboratorio / Selector de Piel */}
      <div className="skin-picker" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--fg-faint)',
              marginRight: 4
            }}
          >
            Estilo Visual
          </span>

          {SKINS.map(s => (
            <button
              key={s.key}
              className="skin-picker-btn"
              data-active={skin === s.key}
              aria-pressed={skin === s.key}
              onClick={() => setSkin(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Shortcut Banner Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            borderRadius: 999,
            background: spacePressed ? 'var(--signal)' : 'var(--rail-hi)',
            border: '1px solid var(--line)',
            color: spacePressed ? 'var(--ink)' : 'var(--fg)',
            transition: 'all 0.15s ease',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem'
          }}
        >
          <kbd
            style={{
              background: spacePressed ? 'var(--ink)' : 'var(--rail)',
              color: spacePressed ? 'var(--fg)' : 'var(--signal)',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid var(--line)',
              fontWeight: 700
            }}
          >
            ESPACIO
          </kbd>
          <span>{isRunning ? 'Pausar Cronómetro' : 'Iniciar Cronómetro'}</span>
        </div>
      </div>

      {/* Main Container under .skin */}
      <div
        className={`skin skin-${skin}`}
        style={{
          flex: 1,
          background: 'var(--sk-bg)',
          color: 'var(--sk-ink)',
          padding: '36px 24px 80px',
          fontFamily: 'var(--sk-font-ui)'
        }}
      >
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div
              className="mono"
              style={{
                color: 'var(--sk-accent)',
                letterSpacing: '0.18em',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Clock size={14} /> Control de Tiempo & Pausas Activas
            </div>
            <h1
              className="display"
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                color: 'var(--sk-ink)',
                marginBottom: 8
              }}
            >
              Cronómetro de Descansos
            </h1>
            <p style={{ color: 'var(--sk-quiet)', fontSize: '0.88rem', maxWidth: '52ch', margin: '0 auto' }}>
              Mide tus pausas de trabajo en tiempo real. Activa o pausa instantáneamente con la tecla <strong style={{ color: 'var(--sk-signal)' }}>Espacio</strong>.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <Tabs.Root value={mode} onValueChange={v => handleModeChange(v as string)}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <Tabs.List
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: 4,
                  background: 'var(--sk-panel)',
                  borderRadius: 'var(--sk-radius)',
                  border: '1px solid var(--sk-line)'
                }}
              >
                <Tabs.Tab
                  value="stopwatch"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'calc(var(--sk-radius) - 2px)',
                    background: mode === 'stopwatch' ? 'var(--sk-ink)' : 'transparent',
                    color: mode === 'stopwatch' ? 'var(--sk-bg)' : 'var(--sk-quiet)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  ⏱️ Cronómetro Libre
                </Tabs.Tab>

                <Tabs.Tab
                  value="5min"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'calc(var(--sk-radius) - 2px)',
                    background: mode === '5min' ? 'var(--sk-ink)' : 'transparent',
                    color: mode === '5min' ? 'var(--sk-bg)' : 'var(--sk-quiet)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  ☕ Corto (5 min)
                </Tabs.Tab>

                <Tabs.Tab
                  value="15min"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'calc(var(--sk-radius) - 2px)',
                    background: mode === '15min' ? 'var(--sk-ink)' : 'transparent',
                    color: mode === '15min' ? 'var(--sk-bg)' : 'var(--sk-quiet)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  🚶 Largo (15 min)
                </Tabs.Tab>
              </Tabs.List>
            </div>
          </Tabs.Root>

          {/* MAIN TIMER DISPLAY CARD */}
          <div
            style={{
              background: 'var(--sk-panel)',
              border: '1px solid var(--sk-line)',
              borderRadius: 'var(--sk-radius)',
              padding: '36px 24px',
              textAlign: 'center',
              position: 'relative',
              boxShadow: isRunning ? '0 0 40px color-mix(in srgb, var(--sk-signal) 12%, transparent)' : 'none',
              transition: 'box-shadow 0.3s ease',
              marginBottom: 24
            }}
          >
            {/* Top Bar inside Display: Sound Toggle & Status Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isRunning ? 'var(--sk-signal)' : elapsedMs > 0 ? 'var(--sk-quiet)' : 'var(--sk-faint)',
                    boxShadow: isRunning ? '0 0 8px color-mix(in srgb, var(--sk-signal) 60%, transparent)' : 'none'
                  }}
                />
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--sk-quiet)', textTransform: 'uppercase' }}>
                  {isRunning ? 'Cronómetro Activo' : elapsedMs > 0 ? 'Pausado' : 'Listo'}
                </span>
              </div>

              <button
                onClick={() => setSoundEnabled(s => !s)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: soundEnabled ? 'var(--sk-signal)' : 'var(--sk-faint)',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)'
                }}
                title={soundEnabled ? 'Sonido Activado' : 'Sonido Silenciado'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>{soundEnabled ? 'Audio ON' : 'Audio OFF'}</span>
              </button>
            </div>

            {/* Circular Ring + Digital Counter */}
            <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto 24px' }}>
              <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle
                  cx="110"
                  cy="110"
                  r="80"
                  stroke="var(--sk-line)"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Ring */}
                {isCountdown && (
                  <circle
                    cx="110"
                    cy="110"
                    r="80"
                    stroke="var(--sk-signal)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="502"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                  />
                )}
              </svg>

              {/* Digital Time Center */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: '2.6rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: isRunning ? 'var(--sk-ink)' : 'var(--sk-quiet)',
                    lineHeight: 1
                  }}
                >
                  {formattedMin}:{formattedSec}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--sk-signal)',
                    marginTop: 4,
                    fontWeight: 600
                  }}
                >
                  .{formattedMs}
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Spacebar Start / Pause Button */}
              <button
                onClick={toggleTimer}
                style={{
                  padding: '12px 28px',
                  borderRadius: 'var(--sk-radius)',
                  background: isRunning ? 'var(--sk-ink)' : 'var(--sk-signal)',
                  color: isRunning ? 'var(--sk-bg)' : 'var(--sk-ink)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 4px 14px color-mix(in srgb, var(--sk-shadow) 20%, transparent)',
                  transition: 'transform 0.1s ease, background 0.2s ease'
                }}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
                <kbd
                  style={{
                    background: 'color-mix(in srgb, var(--sk-shadow) 15%, transparent)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    marginLeft: 4
                  }}
                >
                  ESPACIO
                </kbd>
              </button>

              {/* Reset Button */}
              <button
                onClick={resetTimer}
                style={{
                  padding: '12px 18px',
                  borderRadius: 'var(--sk-radius)',
                  background: 'transparent',
                  color: 'var(--sk-quiet)',
                  border: '1px solid var(--sk-line)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
                title="Reiniciar (Tecla R)"
              >
                <RotateCcw size={16} /> Reiniciar
              </button>

              {/* Log Break Button */}
              <button
                onClick={handleRecordBreak}
                disabled={elapsedMs < 1000}
                style={{
                  padding: '12px 20px',
                  borderRadius: 'var(--sk-radius)',
                  background: elapsedMs >= 1000 ? 'var(--sk-panel)' : 'transparent',
                  color: elapsedMs >= 1000 ? 'var(--sk-accent)' : 'var(--sk-faint)',
                  border: '1px solid var(--sk-line)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: elapsedMs >= 1000 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: elapsedMs >= 1000 ? 1 : 0.5
                }}
                title="Registrar Descanso (Tecla L)"
              >
                <BookmarkPlus size={16} /> Registrar Descanso
              </button>
            </div>
          </div>

          {/* BREAK METADATA FORM & TAG PICKER */}
          <div
            style={{
              background: 'var(--sk-panel)',
              border: '1px solid var(--sk-line)',
              borderRadius: 'var(--sk-radius)',
              padding: '20px 24px',
              marginBottom: 32
            }}
          >
            <div className="label" style={{ marginBottom: 12 }}>
              Etiquetar este Descanso
            </div>

            {/* Tag Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: selectedTag === tag.id ? 'var(--sk-ink)' : 'transparent',
                    color: selectedTag === tag.id ? 'var(--sk-bg)' : 'var(--sk-quiet)',
                    border: '1px solid var(--sk-line)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: selectedTag === tag.id ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.12s ease'
                  }}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.label}</span>
                </button>
              ))}
            </div>

            {/* Note Input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Nota rápida sobre esta pausa (ej. Caminé por la terraza, bebí un vaso de agua)..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--sk-radius)',
                  background: 'var(--sk-bg)',
                  border: '1px solid var(--sk-line)',
                  color: 'var(--sk-ink)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* STATS & HISTORIAL SECTION */}
          <div>
            {/* Header with Clear Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="label" style={{ fontSize: '0.72rem' }}>
                📊 Resumen & Historial de Descansos
              </div>

              {logs.length > 0 && (
                <button
                  onClick={clearLogs}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--sk-faint)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Trash2 size={13} /> Limpiar Historial
                </button>
              )}
            </div>

            {/* Stats Cards Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                marginBottom: 20
              }}
            >
              <div
                style={{
                  background: 'var(--sk-panel)',
                  border: '1px solid var(--sk-line)',
                  borderRadius: 'var(--sk-radius)',
                  padding: '14px 18px'
                }}
              >
                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--sk-quiet)' }}>
                  Total Descansos
                </div>
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sk-ink)' }}>
                  {totalBreaksCount}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--sk-panel)',
                  border: '1px solid var(--sk-line)',
                  borderRadius: 'var(--sk-radius)',
                  padding: '14px 18px'
                }}
              >
                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--sk-quiet)' }}>
                  Tiempo Total Reposado
                </div>
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sk-signal)' }}>
                  {totalRestMinutes} min
                </div>
              </div>

              <div
                style={{
                  background: 'var(--sk-panel)',
                  border: '1px solid var(--sk-line)',
                  borderRadius: 'var(--sk-radius)',
                  padding: '14px 18px'
                }}
              >
                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--sk-quiet)' }}>
                  Promedio por Descanso
                </div>
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sk-ink)' }}>
                  {avgRestMinutes} min
                </div>
              </div>
            </div>

            {/* Logs Table / List */}
            {logs.length === 0 ? (
              <div
                style={{
                  background: 'var(--sk-panel)',
                  border: '1px dashed var(--sk-line)',
                  borderRadius: 'var(--sk-radius)',
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--sk-quiet)',
                  fontSize: '0.85rem'
                }}
              >
                <Sparkles size={24} style={{ marginBottom: 8, color: 'var(--sk-faint)' }} />
                <p>Aún no has registrado descansos en esta sesión.</p>
                <p style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--sk-faint)' }}>
                  Presiona <strong style={{ color: 'var(--sk-signal)' }}>Espacio</strong> para iniciar un cronómetro y luego haz clic en "Registrar Descanso".
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--sk-panel)',
                  border: '1px solid var(--sk-line)',
                  borderRadius: 'var(--sk-radius)',
                  overflow: 'hidden'
                }}
              >
                {logs.map((log, idx) => {
                  const secTotal = Math.floor(log.durationMs / 1000);
                  const m = Math.floor(secTotal / 60);
                  const s = secTotal % 60;
                  const durationStr = m > 0 ? `${m}m ${s}s` : `${s}s`;

                  return (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        borderBottom: idx < logs.length - 1 ? '1px solid var(--sk-line)' : 'none',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: '1.2rem' }}>{log.tagIcon}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--sk-ink)' }}>
                            {log.tag} <span className="mono" style={{ color: 'var(--sk-quiet)', fontSize: '0.7rem' }}>({log.mode})</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--sk-quiet)', marginTop: 2 }}>
                            {log.note}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div className="mono" style={{ fontWeight: 700, color: 'var(--sk-signal)' }}>
                            {durationStr}
                          </div>
                          <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--sk-faint)' }}>
                            {log.timestamp}
                          </div>
                        </div>

                        <button
                          onClick={() => deleteLog(log.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--sk-faint)',
                            cursor: 'pointer',
                            padding: 4
                          }}
                          title="Eliminar registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
