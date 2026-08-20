import React, { useEffect, useRef } from 'react';
import { BalanceVimLog } from './BalanceVimLog';

const NAV_KEYS = new Set(['h', 'j', 'k', 'l', 'H', 'L']);
const ACTION_KEYS = new Set(['a', 'A', 'o', 'O', 'd', 'x', 'y', 'p', 'v', 'V', 't', 'u', 'Escape']);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const BalanceVimLogReactive: React.FC = () => {
  const orbARef = useRef<HTMLDivElement>(null);
  const orbBRef = useRef<HTMLDivElement>(null);
  const orbCRef = useRef<HTMLDivElement>(null);
  const countRef = useRef('');
  const energyRef = useRef(0);
  const offsetRef = useRef({ x: 0, y: 0 });
  const lastCommandRef = useRef({ key: '', at: 0 });
  const decayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const resetAmbient = () => {
      energyRef.current = 0;
      offsetRef.current = { x: 0, y: 0 };

      [orbARef.current, orbBRef.current, orbCRef.current].forEach((orb) => {
        if (!orb) return;
        orb.style.transform = 'translate3d(0, 0, 0) scale(1)';
        orb.style.opacity = '';
      });
    };

    const pulse = (key: string, count = 1) => {
      const now = performance.now();
      const repeated = lastCommandRef.current.key === key && now - lastCommandRef.current.at < 220;
      lastCommandRef.current = { key, at: now };

      const directions: Record<string, { x: number; y: number }> = {
        h: { x: -1, y: 0 },
        H: { x: -1, y: 0 },
        l: { x: 1, y: 0 },
        L: { x: 1, y: 0 },
        j: { x: 0, y: 1 },
        k: { x: 0, y: -1 },
      };

      const direction = directions[key] ?? { x: 0, y: 0 };
      const countBoost = NAV_KEYS.has(key) ? 1 + Math.min(1.9, Math.log2(count + 1) * 0.34) : 1;
      const commandBoost = key === 'H' || key === 'L' ? 1.35 : 1;
      const repeatBoost = repeated ? 1.28 : 1;
      const strength = countBoost * commandBoost * repeatBoost;

      energyRef.current = clamp(
        energyRef.current + (NAV_KEYS.has(key) ? 0.9 : 0.55) * strength,
        0,
        7
      );

      const nextX = clamp(offsetRef.current.x + direction.x * 13 * strength, -46, 46);
      const nextY = clamp(offsetRef.current.y + direction.y * 10 * strength, -34, 34);
      offsetRef.current = { x: nextX, y: nextY };

      const energy = energyRef.current;
      const scaleA = 1 + energy * 0.014;
      const scaleB = 1 + energy * 0.011;
      const scaleC = 1 + energy * 0.009;

      if (orbARef.current) {
        orbARef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) scale(${scaleA})`;
        orbARef.current.style.opacity = String(0.14 + energy * 0.018);
      }
      if (orbBRef.current) {
        orbBRef.current.style.transform = `translate3d(${-nextX * 0.68}px, ${-nextY * 0.55}px, 0) scale(${scaleB})`;
        orbBRef.current.style.opacity = String(0.13 + energy * 0.015);
      }
      if (orbCRef.current) {
        orbCRef.current.style.transform = `translate3d(${nextX * 0.3}px, ${-nextY * 0.36}px, 0) scale(${scaleC})`;
        orbCRef.current.style.opacity = String(0.1 + energy * 0.012);
      }

      if (decayTimerRef.current !== null) window.clearTimeout(decayTimerRef.current);
      decayTimerRef.current = window.setTimeout(resetAmbient, 520);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT'
        || target?.tagName === 'TEXTAREA'
        || target?.isContentEditable;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (/^[1-9]$/.test(event.key) || (/^[0-9]$/.test(event.key) && countRef.current.length > 0)) {
        countRef.current = `${countRef.current}${event.key}`.slice(0, 4);
        return;
      }

      if (NAV_KEYS.has(event.key)) {
        const count = Number.parseInt(countRef.current, 10) || 1;
        countRef.current = '';
        pulse(event.key, count);
        return;
      }

      if (ACTION_KEYS.has(event.key)) {
        countRef.current = '';
        pulse(event.key);
        return;
      }

      if (countRef.current) countRef.current = '';
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (decayTimerRef.current !== null) window.clearTimeout(decayTimerRef.current);
    };
  }, []);

  return (
    <div className="bt-reactive-shell">
      <div className="bt-reactive-ambient" aria-hidden="true">
        <div ref={orbARef} className="bt-reactive-orb bt-reactive-orb-a" />
        <div ref={orbBRef} className="bt-reactive-orb bt-reactive-orb-b" />
        <div ref={orbCRef} className="bt-reactive-orb bt-reactive-orb-c" />
      </div>

      <div className="bt-reactive-stage">
        <BalanceVimLog />
      </div>

      <style>{reactiveStyles}</style>
    </div>
  );
};

const reactiveStyles = `
  .bt-reactive-shell {
    position: relative;
    min-height: 100dvh;
    overflow: hidden;
    isolation: isolate;
    background: #06090e;
  }

  .bt-reactive-ambient {
    position: fixed;
    z-index: 0;
    inset: -14%;
    overflow: hidden;
    pointer-events: none;
  }

  .bt-reactive-orb {
    position: absolute;
    width: min(680px, 48vw);
    aspect-ratio: 1;
    border-radius: 999px;
    filter: blur(82px);
    will-change: transform, opacity;
    transition:
      transform 560ms cubic-bezier(0.2, 0.8, 0.2, 1),
      opacity 520ms ease;
  }

  .bt-reactive-orb-a {
    top: -8%;
    left: -7%;
    opacity: 0.14;
    background: radial-gradient(circle, rgba(64, 120, 255, 0.95), rgba(64, 120, 255, 0) 69%);
  }

  .bt-reactive-orb-b {
    top: 0;
    right: -9%;
    opacity: 0.13;
    background: radial-gradient(circle, rgba(78, 166, 255, 0.9), rgba(78, 166, 255, 0) 69%);
  }

  .bt-reactive-orb-c {
    left: 27%;
    bottom: -31%;
    opacity: 0.1;
    background: radial-gradient(circle, rgba(44, 88, 188, 0.84), rgba(44, 88, 188, 0) 71%);
  }

  .bt-reactive-stage {
    position: relative;
    z-index: 1;
    min-height: 100dvh;
  }

  .bt-reactive-stage .bt-root {
    --bt-bg: #090d12;
    --bt-panel: #0c1117;
    --bt-group: #0d1218;
    --bt-row: #14243b;
    --bt-text: #dce6f0;
    --bt-muted: #7c8895;
    --bt-faint: #293440;
    --bt-accent: #6ea8ff;
    --bt-selected: #182d4b;
    min-height: 100dvh;
    padding: clamp(12px, 3vw, 36px);
    background: transparent;
  }

  .bt-reactive-stage .bt-terminal {
    border-color: #263443;
    background: rgba(9, 13, 18, 0.94);
    box-shadow:
      0 22px 80px rgba(0, 0, 0, 0.32),
      0 0 0 1px rgba(110, 168, 255, 0.025);
    backdrop-filter: blur(10px);
  }

  .bt-reactive-stage .bt-mini-cell {
    background: #3a4550;
  }

  .bt-reactive-stage .bt-mini-cell.is-outside {
    border-color: #2f3a45;
    background: transparent;
  }

  .bt-reactive-stage .bt-group-head {
    border-left: 0;
    background: #0d1218;
  }

  .bt-reactive-stage .bt-food-row:hover {
    background: #101722;
  }

  .bt-reactive-stage .bt-food-row.is-cursor {
    background: color-mix(in srgb, var(--bt-accent) 14%, #0c1219);
    outline: 1px solid color-mix(in srgb, var(--bt-accent) 44%, transparent);
    outline-offset: -1px;
  }

  .bt-reactive-stage .bt-food-row.is-selected {
    background: #182d4b;
    color: #f2f7ff;
  }

  .bt-reactive-stage .bt-command {
    background: #080c12;
  }

  .bt-reactive-stage .bt-mode {
    color: #07111f;
  }

  @media (prefers-reduced-motion: reduce) {
    .bt-reactive-orb {
      transition: none;
    }
  }
`;
