import React, { useMemo, useState } from 'react';
import { Dialog, Switch, Tabs } from '@base-ui/react';
import {
  Apple,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Droplets,
  Flame,
  LayoutGrid,
  Leaf,
  Plus,
  Search,
  Sparkles,
  Utensils,
  Wheat
} from 'lucide-react';

type Day = {
  label: string;
  date: string;
  kcal: number;
  target: number;
  protein: number;
  fiber: number;
  water: number;
  score: number;
};

const DAYS: Day[] = [
  { label: 'Lun', date: '3 AGO', kcal: 1910, target: 2200, protein: 92, fiber: 24, water: 5, score: 78 },
  { label: 'Mar', date: '4 AGO', kcal: 2280, target: 2200, protein: 118, fiber: 31, water: 7, score: 86 },
  { label: 'Mié', date: '5 AGO', kcal: 2040, target: 2200, protein: 104, fiber: 28, water: 6, score: 82 },
  { label: 'Jue', date: '6 AGO', kcal: 1486, target: 2200, protein: 83, fiber: 22, water: 4, score: 91 },
  { label: 'Vie', date: '7 AGO', kcal: 860, target: 2200, protein: 46, fiber: 15, water: 3, score: 74 }
];

const MEALS = [
  { time: '08:10', title: 'Yogur, higos y trigo sarraceno', meta: '420 kcal · 28 g proteína', tone: 'berry' },
  { time: '13:35', title: 'Lentejas cítricas con hojas crujientes', meta: '638 kcal · 34 g proteína', tone: 'leaf' },
  { time: '17:20', title: 'Manzana, tahini y sal marina', meta: '182 kcal · 6 g proteína', tone: 'sun' }
];

const WEEK = [
  { day: 'L', kcal: 1910, fiber: 24 },
  { day: 'M', kcal: 2280, fiber: 31 },
  { day: 'X', kcal: 2040, fiber: 28 },
  { day: 'J', kcal: 1486, fiber: 22 },
  { day: 'V', kcal: 860, fiber: 15 },
  { day: 'S', kcal: 0, fiber: 0 },
  { day: 'D', kcal: 0, fiber: 0 }
];

const saviaStyles = `
  .savia-app {
    --ink: #17261d;
    --paper: #f4f1e8;
    --paper-2: #ebe7da;
    --acid: #c8f45d;
    --plum: #b99df6;
    --tomato: #f16a50;
    --sky: #8fd9d0;
    min-height: 100%;
    color: var(--ink);
    background:
      radial-gradient(circle at 68% 4%, rgba(185, 157, 246, .24), transparent 25rem),
      var(--paper);
    font-family: Inter, sans-serif;
    display: grid;
    grid-template-columns: 228px minmax(0, 1fr);
  }

  .savia-app * { box-sizing: border-box; }
  .savia-app button { font: inherit; }

  .savia-sidebar {
    min-height: 100%;
    padding: 28px 20px 22px;
    border-right: 1px solid rgba(23, 38, 29, .16);
    display: flex;
    flex-direction: column;
    background: rgba(244, 241, 232, .72);
    backdrop-filter: blur(16px);
  }

  .savia-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 850;
    letter-spacing: -.04em;
    font-size: 1.2rem;
  }

  .savia-brand-mark {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 50% 50% 46% 54%;
    color: var(--acid);
    background: var(--ink);
    transform: rotate(-8deg);
  }

  .savia-side-label {
    margin: 42px 8px 10px;
    color: rgba(23, 38, 29, .48);
    font: 650 .62rem/1 IBM Plex Mono, monospace;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .savia-side-nav { display: grid; gap: 5px; }

  .savia-side-button {
    border: 0;
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    padding: 11px 12px;
    color: rgba(23, 38, 29, .62);
    background: transparent;
    border-radius: 12px;
    text-align: left;
    cursor: pointer;
  }

  .savia-side-button[data-active='true'] {
    color: var(--ink);
    background: rgba(23, 38, 29, .075);
    font-weight: 760;
  }

  .savia-orbit {
    width: 8px;
    height: 8px;
    margin-left: auto;
    border: 2px solid currentColor;
    border-radius: 50%;
  }

  .savia-side-note {
    margin-top: auto;
    padding: 16px;
    border: 1px solid rgba(23, 38, 29, .14);
    border-radius: 18px;
    background: rgba(255,255,255,.26);
  }

  .savia-side-note strong { display: block; font-size: .82rem; margin: 8px 0 5px; }
  .savia-side-note p { margin: 0; color: rgba(23,38,29,.58); font-size: .72rem; line-height: 1.45; }

  .savia-main { min-width: 0; padding: clamp(20px, 3vw, 42px); }
  .savia-shell { max-width: 1220px; margin: 0 auto; }

  .savia-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 34px;
  }

  .savia-mobile-brand { display: none; }

  .savia-eyebrow {
    margin: 0 0 7px;
    font: 650 .66rem/1 IBM Plex Mono, monospace;
    letter-spacing: .13em;
    color: rgba(23, 38, 29, .48);
  }

  .savia-title {
    margin: 0;
    font: 400 clamp(2rem, 4.2vw, 4rem)/.92 Instrument Serif, serif;
    letter-spacing: -.04em;
  }

  .savia-top-actions { display: flex; align-items: center; gap: 9px; }

  .savia-icon-button,
  .savia-avatar {
    width: 42px;
    height: 42px;
    border: 1px solid rgba(23, 38, 29, .18);
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--ink);
    background: rgba(255,255,255,.25);
    cursor: pointer;
    transition: transform .2s ease, background .2s ease;
  }

  .savia-icon-button:hover { transform: translateY(-2px); background: white; }
  .savia-avatar { background: var(--plum); border-color: var(--ink); }

  .savia-date-stepper {
    display: flex;
    align-items: center;
    gap: 3px;
    border: 1px solid rgba(23,38,29,.18);
    border-radius: 999px;
    padding: 3px;
  }

  .savia-date-stepper button {
    width: 33px;
    height: 33px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    display: grid;
    place-items: center;
    cursor: pointer;
  }

  .savia-date-stepper button:disabled { opacity: .25; cursor: default; }
  .savia-date-value { min-width: 88px; text-align: center; font: 700 .7rem IBM Plex Mono, monospace; }

  .savia-tabs-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
  }

  .savia-tabs-list { display: flex; gap: 22px; }

  .savia-tab {
    position: relative;
    border: 0;
    padding: 0 0 8px;
    color: rgba(23,38,29,.43);
    background: transparent;
    cursor: pointer;
    font-weight: 750;
  }

  .savia-tab[data-active] { color: var(--ink); }
  .savia-tab[data-active]::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 3px;
    background: var(--ink);
    border-radius: 99px;
  }

  .savia-focus-control { display: flex; align-items: center; gap: 9px; font-size: .76rem; font-weight: 720; }
  .savia-switch { width: 38px; height: 22px; padding: 2px; border: 0; border-radius: 99px; background: #cfcbbf; cursor: pointer; }
  .savia-switch[data-checked] { background: var(--ink); }
  .savia-switch-thumb { display: block; width: 18px; height: 18px; border-radius: 50%; background: var(--paper); transition: transform .2s ease; }
  .savia-switch[data-checked] .savia-switch-thumb { transform: translateX(16px); background: var(--acid); }

  .savia-dashboard-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(280px, .7fr);
    gap: 14px;
  }

  .savia-card { border-radius: 26px; overflow: hidden; }

  .savia-primary {
    position: relative;
    min-height: 395px;
    padding: clamp(22px, 3vw, 38px);
    color: #f5f3ea;
    background: var(--ink);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(230px, .75fr);
    gap: 20px;
  }

  .savia-primary::before {
    content: '';
    position: absolute;
    width: 260px;
    height: 260px;
    right: -70px;
    top: -90px;
    border: 1px solid rgba(200,244,93,.32);
    border-radius: 50%;
    box-shadow: 0 0 0 28px rgba(200,244,93,.035), 0 0 0 58px rgba(200,244,93,.025);
  }

  .savia-card-kicker {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(245,243,234,.62);
    font: 650 .65rem IBM Plex Mono, monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  .savia-card-kicker i { width: 7px; height: 7px; border-radius: 50%; background: var(--acid); box-shadow: 0 0 0 4px rgba(200,244,93,.12); }

  .savia-big-number { margin: 42px 0 2px; font: 430 clamp(4rem, 8vw, 7rem)/.8 Instrument Serif, serif; letter-spacing: -.065em; }
  .savia-unit { font: 500 .74rem IBM Plex Mono, monospace; color: rgba(245,243,234,.52); }

  .savia-progress-line { height: 5px; margin-top: 30px; background: rgba(245,243,234,.13); border-radius: 99px; overflow: hidden; }
  .savia-progress-line span { display: block; height: 100%; border-radius: inherit; background: var(--acid); transition: width .4s ease; }
  .savia-progress-caption { margin-top: 9px; display: flex; justify-content: space-between; color: rgba(245,243,234,.55); font-size: .7rem; }

  .savia-primary-copy { max-width: 380px; margin: 22px 0 0; color: rgba(245,243,234,.68); font-size: .86rem; line-height: 1.5; }
  .savia-primary-copy strong { color: var(--acid); font-weight: 720; }

  .savia-macro-stack { align-self: end; display: grid; gap: 9px; position: relative; z-index: 1; }
  .savia-macro {
    display: grid;
    grid-template-columns: 40px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border: 1px solid rgba(245,243,234,.13);
    border-radius: 16px;
    background: rgba(245,243,234,.045);
    backdrop-filter: blur(6px);
  }

  .savia-macro-icon { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; color: var(--ink); }
  .savia-macro-name { font-size: .7rem; color: rgba(245,243,234,.52); }
  .savia-macro strong { display: block; margin-top: 2px; font-size: .86rem; }
  .savia-macro-goal { font: 550 .64rem IBM Plex Mono, monospace; color: rgba(245,243,234,.48); }

  .savia-side-stack { display: grid; grid-template-rows: 1fr 1fr; gap: 14px; }

  .savia-score-card { padding: 24px; background: var(--plum); display: flex; flex-direction: column; justify-content: space-between; min-height: 190px; }
  .savia-card-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .savia-card-heading h3 { margin: 0; font-size: .86rem; letter-spacing: -.02em; }
  .savia-mini-arrow { width: 30px; height: 30px; border: 1px solid rgba(23,38,29,.25); border-radius: 50%; display: grid; place-items: center; }
  .savia-score { display: flex; align-items: flex-end; justify-content: space-between; gap: 15px; }
  .savia-score strong { font: 450 4rem/.78 Instrument Serif, serif; letter-spacing: -.06em; }
  .savia-score span { max-width: 122px; font-size: .69rem; line-height: 1.35; }

  .savia-water-card { padding: 22px 24px; background: var(--sky); min-height: 190px; }
  .savia-water-count { margin: 24px 0 18px; display: flex; align-items: baseline; gap: 6px; }
  .savia-water-count strong { font: 450 3.4rem/.8 Instrument Serif, serif; }
  .savia-water-count span { font-size: .72rem; opacity: .65; }
  .savia-water-dots { display: flex; align-items: center; gap: 6px; }
  .savia-water-dot { width: 18px; height: 25px; border: 1.5px solid var(--ink); border-radius: 50% 50% 46% 46%; opacity: .3; }
  .savia-water-dot[data-filled='true'] { background: var(--ink); opacity: 1; }
  .savia-water-add { margin-left: auto; width: 28px; height: 28px; border: 1px solid var(--ink); border-radius: 50%; background: transparent; display: grid; place-items: center; cursor: pointer; }

  .savia-lower-grid { margin-top: 14px; display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(270px, .75fr); gap: 14px; }
  .savia-meals { padding: clamp(22px, 3vw, 32px); border: 1px solid rgba(23,38,29,.14); background: rgba(255,255,255,.24); }
  .savia-section-head { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-bottom: 22px; }
  .savia-section-head h2 { margin: 0; font: 400 1.65rem Instrument Serif, serif; }
  .savia-section-head button { border: 0; background: transparent; color: inherit; display: flex; align-items: center; gap: 6px; font-weight: 750; font-size: .72rem; cursor: pointer; }

  .savia-meal-row { display: grid; grid-template-columns: 54px 44px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 13px 0; border-top: 1px solid rgba(23,38,29,.12); }
  .savia-meal-time { font: 650 .64rem IBM Plex Mono, monospace; color: rgba(23,38,29,.48); }
  .savia-food-orb { width: 40px; height: 40px; border-radius: 50%; position: relative; overflow: hidden; }
  .savia-food-orb::after { content: ''; position: absolute; width: 55%; height: 55%; right: 4px; top: 3px; border-radius: 50%; background: rgba(255,255,255,.45); }
  .savia-food-orb[data-tone='berry'] { background: #b99df6; box-shadow: inset 9px -8px 0 #8160c8; }
  .savia-food-orb[data-tone='leaf'] { background: #8fae50; box-shadow: inset -10px 8px 0 #d4f07b; }
  .savia-food-orb[data-tone='sun'] { background: #f2b84d; box-shadow: inset 10px -7px 0 #ec7558; }
  .savia-meal-copy { min-width: 0; }
  .savia-meal-copy strong { display: block; font-size: .83rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .savia-meal-copy span { display: block; margin-top: 4px; color: rgba(23,38,29,.48); font-size: .68rem; }
  .savia-row-arrow { width: 29px; height: 29px; border: 1px solid rgba(23,38,29,.18); border-radius: 50%; display: grid; place-items: center; }

  .savia-plant-card { padding: 26px; background: var(--tomato); position: relative; min-height: 280px; }
  .savia-plant-card h2 { margin: 10px 0 0; max-width: 220px; font: 400 2rem/.95 Instrument Serif, serif; }
  .savia-plant-figure { width: 150px; height: 150px; margin: 18px auto -32px; position: relative; border-radius: 50%; border: 1px solid rgba(23,38,29,.35); }
  .savia-plant-figure::before, .savia-plant-figure::after { content: ''; position: absolute; background: var(--ink); border-radius: 90% 0 90% 0; transform-origin: 0 100%; }
  .savia-plant-figure::before { width: 54px; height: 83px; left: 74px; top: 17px; transform: rotate(22deg); }
  .savia-plant-figure::after { width: 45px; height: 70px; left: 68px; top: 62px; transform: rotate(-72deg); }
  .savia-plant-stem { position: absolute; width: 2px; height: 116px; background: var(--ink); left: 74px; top: 17px; transform: rotate(8deg); }
  .savia-plant-badge { position: absolute; right: 18px; bottom: 18px; width: 62px; height: 62px; border-radius: 50%; background: var(--acid); display: grid; place-items: center; text-align: center; font: 750 .58rem/1.2 IBM Plex Mono, monospace; transform: rotate(7deg); }

  .savia-week-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(260px, .6fr); gap: 14px; }
  .savia-chart-card { padding: clamp(24px, 4vw, 38px); background: var(--ink); color: #f5f3ea; min-height: 480px; }
  .savia-chart-card h2 { margin: 9px 0 4px; font: 400 2.5rem Instrument Serif, serif; }
  .savia-chart-card > p { margin: 0; color: rgba(245,243,234,.55); font-size: .77rem; }
  .savia-bars { height: 255px; display: grid; grid-template-columns: repeat(7, 1fr); gap: clamp(7px, 2vw, 18px); align-items: end; margin-top: 44px; border-bottom: 1px solid rgba(245,243,234,.17); }
  .savia-bar-column { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 9px; }
  .savia-bar { width: min(34px, 70%); min-height: 4px; border-radius: 99px 99px 4px 4px; background: var(--acid); position: relative; }
  .savia-bar::after { content: ''; position: absolute; left: 50%; top: 8px; width: 4px; height: var(--fiber-height, 30%); transform: translateX(-50%); border-radius: 99px; background: var(--ink); opacity: .45; }
  .savia-bar[data-empty='true'] { height: 4px !important; background: rgba(245,243,234,.2); }
  .savia-bar-label { font: 600 .62rem IBM Plex Mono, monospace; color: rgba(245,243,234,.48); transform: translateY(25px); }

  .savia-week-side { display: grid; gap: 14px; }
  .savia-week-mini { padding: 25px; border: 1px solid rgba(23,38,29,.14); background: rgba(255,255,255,.28); }
  .savia-week-mini h3 { margin: 0 0 20px; font: 400 1.5rem Instrument Serif, serif; }
  .savia-goal-row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid rgba(23,38,29,.12); font-size: .75rem; }
  .savia-goal-row strong { font-family: IBM Plex Mono, monospace; font-size: .67rem; }
  .savia-week-quote { padding: 25px; background: var(--acid); display: flex; flex-direction: column; justify-content: space-between; min-height: 170px; }
  .savia-week-quote p { margin: 0; font: 400 1.5rem/1.05 Instrument Serif, serif; }
  .savia-week-quote span { font: 650 .62rem IBM Plex Mono, monospace; }

  .savia-fab { position: fixed; right: 24px; bottom: 24px; border: 0; border-radius: 999px; padding: 14px 18px; display: flex; align-items: center; gap: 8px; color: var(--paper); background: var(--ink); box-shadow: 0 10px 30px rgba(23,38,29,.22); cursor: pointer; font-weight: 800; z-index: 3; }

  .savia-dialog-backdrop { position: fixed; inset: 0; background: rgba(14,22,17,.58); backdrop-filter: blur(7px); z-index: 20; }
  .savia-dialog-popup { position: fixed; z-index: 21; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(470px, calc(100vw - 28px)); max-height: min(680px, calc(100vh - 28px)); overflow: auto; padding: 28px; color: var(--ink); background: var(--paper); border: 1px solid var(--ink); border-radius: 26px; box-shadow: 0 28px 90px rgba(0,0,0,.28); }
  .savia-dialog-title { margin: 0; font: 400 2.25rem Instrument Serif, serif; }
  .savia-dialog-description { margin: 7px 0 24px; color: rgba(23,38,29,.57); font-size: .8rem; line-height: 1.5; }
  .savia-search-box { display: flex; align-items: center; gap: 9px; padding: 12px 14px; border: 1px solid rgba(23,38,29,.18); border-radius: 14px; background: rgba(255,255,255,.34); }
  .savia-search-box input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; color: inherit; font: inherit; }
  .savia-quick-list { display: grid; gap: 7px; margin: 18px 0 24px; }
  .savia-quick-item { border: 1px solid rgba(23,38,29,.13); border-radius: 14px; padding: 12px; background: transparent; color: inherit; display: flex; align-items: center; justify-content: space-between; gap: 10px; cursor: pointer; text-align: left; }
  .savia-quick-item[data-selected='true'] { border-color: var(--ink); background: var(--acid); }
  .savia-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }
  .savia-dialog-actions button { border: 1px solid var(--ink); border-radius: 999px; padding: 10px 16px; color: inherit; background: transparent; cursor: pointer; font-weight: 750; }
  .savia-dialog-actions .savia-save { color: var(--paper); background: var(--ink); }

  @media (max-width: 980px) {
    .savia-app { grid-template-columns: 76px minmax(0, 1fr); }
    .savia-sidebar { align-items: center; padding-inline: 12px; }
    .savia-brand span, .savia-side-label, .savia-side-button span, .savia-orbit, .savia-side-note { display: none; }
    .savia-side-button { justify-content: center; width: 44px; height: 44px; padding: 0; }
    .savia-dashboard-grid, .savia-lower-grid { grid-template-columns: 1fr; }
    .savia-side-stack { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
    .savia-week-grid { grid-template-columns: 1fr; }
    .savia-week-side { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 680px) {
    .savia-app { display: block; }
    .savia-sidebar { display: none; }
    .savia-main { padding: 18px 14px 88px; }
    .savia-mobile-brand { display: flex; align-items: center; gap: 8px; font-weight: 850; }
    .savia-mobile-brand .savia-brand-mark { width: 29px; height: 29px; }
    .savia-topbar { align-items: flex-start; margin-bottom: 24px; }
    .savia-heading .savia-eyebrow { display: none; }
    .savia-title { margin-top: 18px; font-size: 2.65rem; }
    .savia-top-actions .savia-icon-button, .savia-top-actions .savia-avatar { display: none; }
    .savia-date-stepper { margin-top: 4px; }
    .savia-date-value { min-width: 72px; font-size: .62rem; }
    .savia-tabs-row { align-items: center; }
    .savia-focus-control > span { display: none; }
    .savia-primary { grid-template-columns: 1fr; min-height: auto; }
    .savia-big-number { margin-top: 30px; }
    .savia-macro-stack { grid-template-columns: repeat(3, minmax(0,1fr)); margin-top: 10px; }
    .savia-macro { display: block; padding: 10px; }
    .savia-macro-icon { width: 28px; height: 28px; margin-bottom: 8px; }
    .savia-macro-goal { display: block; margin-top: 5px; }
    .savia-side-stack { grid-template-columns: 1fr; }
    .savia-score-card, .savia-water-card { min-height: 175px; }
    .savia-meal-row { grid-template-columns: 42px 38px minmax(0,1fr); gap: 8px; }
    .savia-row-arrow { display: none; }
    .savia-plant-card { min-height: 260px; }
    .savia-week-side { grid-template-columns: 1fr; }
    .savia-bars { gap: 5px; }
    .savia-fab { right: 14px; bottom: 14px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .savia-app *, .savia-app *::before, .savia-app *::after { scroll-behavior: auto !important; transition: none !important; }
  }
`;

const MacroCard: React.FC<{ icon: React.ReactNode; name: string; value: string; goal: string; color: string }> = ({ icon, name, value, goal, color }) => (
  <div className="savia-macro">
    <span className="savia-macro-icon" style={{ background: color }}>{icon}</span>
    <span>
      <span className="savia-macro-name">{name}</span>
      <strong>{value}</strong>
    </span>
    <span className="savia-macro-goal">{goal}</span>
  </div>
);

export const SaviaNutrition: React.FC = () => {
  const [dayIndex, setDayIndex] = useState(3);
  const [water, setWater] = useState(DAYS[3].water);
  const [focusFiber, setFocusFiber] = useState(true);
  const [section, setSection] = useState('pulso');
  const [selectedFood, setSelectedFood] = useState('Tofu dorado y sésamo');
  const [savedFood, setSavedFood] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState('Hoy');

  const day = DAYS[dayIndex];
  const progress = Math.min(100, Math.round((day.kcal / day.target) * 100));
  const remaining = Math.max(0, day.target - day.kcal);

  const insight = useMemo(() => {
    if (focusFiber) return `Te faltan ${Math.max(0, 30 - day.fiber)} g de fibra. Añade legumbres o semillas en la cena.`;
    return `Te faltan ${remaining.toLocaleString('es-ES')} kcal para cerrar el rango de energía de hoy.`;
  }, [day.fiber, focusFiber, remaining]);

  const changeDay = (next: number) => {
    setDayIndex(next);
    setWater(DAYS[next].water);
    setSavedFood(null);
  };

  return (
    <div className="savia-app">
      <style>{saviaStyles}</style>

      <aside className="savia-sidebar" aria-label="Navegación de Savia">
        <div className="savia-brand">
          <span className="savia-brand-mark"><Leaf size={17} /></span>
          <span>Savia</span>
        </div>

        <span className="savia-side-label">Tu espacio</span>
        <nav className="savia-side-nav">
          {[
            { label: 'Hoy', icon: <LayoutGrid size={18} /> },
            { label: 'Comidas', icon: <Utensils size={18} /> },
            { label: 'Progreso', icon: <Sparkles size={18} /> },
            { label: 'Agenda', icon: <CalendarDays size={18} /> }
          ].map(item => (
            <button
              key={item.label}
              className="savia-side-button"
              data-active={activeNav === item.label}
              onClick={() => setActiveNav(item.label)}
            >
              {item.icon}<span>{item.label}</span><i className="savia-orbit" />
            </button>
          ))}
        </nav>

        <div className="savia-side-note">
          <Sparkles size={16} />
          <strong>Racha de 12 días</strong>
          <p>Tu registro es más constante que el 86% de tus semanas.</p>
        </div>
      </aside>

      <main className="savia-main">
        <div className="savia-shell">
          <header className="savia-topbar">
            <div className="savia-heading">
              <div className="savia-mobile-brand"><span className="savia-brand-mark"><Leaf size={15} /></span> Savia</div>
              <p className="savia-eyebrow">JUEVES · {day.date} · {activeNav.toUpperCase()}</p>
              <h1 className="savia-title">Tu ritmo, en equilibrio.</h1>
            </div>

            <div className="savia-top-actions">
              <div className="savia-date-stepper" aria-label="Cambiar día">
                <button aria-label="Día anterior" disabled={dayIndex === 0} onClick={() => changeDay(dayIndex - 1)}><ChevronLeft size={16} /></button>
                <span className="savia-date-value">{day.label} · {day.date}</span>
                <button aria-label="Día siguiente" disabled={dayIndex === DAYS.length - 1} onClick={() => changeDay(dayIndex + 1)}><ChevronRight size={16} /></button>
              </div>
              <button className="savia-icon-button" aria-label="Buscar"><Search size={17} /></button>
              <button className="savia-avatar" aria-label="Abrir perfil"><CircleUserRound size={19} /></button>
            </div>
          </header>

          <Tabs.Root value={section} onValueChange={value => setSection(String(value))}>
            <div className="savia-tabs-row">
              <Tabs.List className="savia-tabs-list" aria-label="Vista de nutrición">
                <Tabs.Tab className="savia-tab" value="pulso">Pulso diario</Tabs.Tab>
                <Tabs.Tab className="savia-tab" value="semana">La semana</Tabs.Tab>
              </Tabs.List>

              <label className="savia-focus-control">
                <span>Priorizar fibra</span>
                <Switch.Root className="savia-switch" checked={focusFiber} onCheckedChange={setFocusFiber}>
                  <Switch.Thumb className="savia-switch-thumb" />
                </Switch.Root>
              </label>
            </div>

            <Tabs.Panel value="pulso">
              <div className="savia-dashboard-grid">
                <section className="savia-card savia-primary">
                  <div>
                    <div className="savia-card-kicker"><i /> Energía disponible</div>
                    <div className="savia-big-number">{remaining.toLocaleString('es-ES')}</div>
                    <div className="savia-unit">KCAL RESTANTES · {progress}% DEL DÍA</div>
                    <div className="savia-progress-line"><span style={{ width: `${progress}%` }} /></div>
                    <div className="savia-progress-caption"><span>{day.kcal.toLocaleString('es-ES')} consumidas</span><span>{day.target.toLocaleString('es-ES')} objetivo</span></div>
                    <p className="savia-primary-copy"><strong>Pista del día.</strong> {insight}</p>
                  </div>

                  <div className="savia-macro-stack">
                    <MacroCard icon={<Flame size={16} />} name="Proteína" value={`${day.protein} g`} goal="META 110" color="var(--plum)" />
                    <MacroCard icon={<Wheat size={16} />} name="Fibra" value={`${day.fiber} g`} goal="META 30" color="var(--acid)" />
                    <MacroCard icon={<Apple size={16} />} name="Vegetales" value="4 porciones" goal="META 6" color="var(--tomato)" />
                  </div>
                </section>

                <div className="savia-side-stack">
                  <section className="savia-card savia-score-card">
                    <div className="savia-card-heading"><h3>Calidad del día</h3><span className="savia-mini-arrow"><ArrowUpRight size={14} /></span></div>
                    <div className="savia-score"><strong>{day.score}</strong><span>Buena variedad y pocos ultraprocesados.</span></div>
                  </section>

                  <section className="savia-card savia-water-card">
                    <div className="savia-card-heading"><h3>Hidratación</h3><Droplets size={17} /></div>
                    <div className="savia-water-count"><strong>{water}</strong><span>de 8 vasos</span></div>
                    <div className="savia-water-dots">
                      {Array.from({ length: 8 }, (_, index) => <i key={index} className="savia-water-dot" data-filled={index < water} />)}
                      <button className="savia-water-add" aria-label="Añadir un vaso de agua" onClick={() => setWater(current => Math.min(8, current + 1))}><Plus size={14} /></button>
                    </div>
                  </section>
                </div>
              </div>

              <div className="savia-lower-grid">
                <section className="savia-card savia-meals">
                  <div className="savia-section-head"><h2>Lo que te ha nutrido</h2><button onClick={() => setSection('semana')}>Ver patrón <ArrowUpRight size={14} /></button></div>
                  {MEALS.map(meal => (
                    <div className="savia-meal-row" key={meal.time}>
                      <span className="savia-meal-time">{meal.time}</span>
                      <i className="savia-food-orb" data-tone={meal.tone} />
                      <span className="savia-meal-copy"><strong>{meal.title}</strong><span>{meal.meta}</span></span>
                      <span className="savia-row-arrow"><ChevronRight size={14} /></span>
                    </div>
                  ))}
                  {savedFood && (
                    <div className="savia-meal-row">
                      <span className="savia-meal-time">AHORA</span>
                      <i className="savia-food-orb" data-tone="leaf" />
                      <span className="savia-meal-copy"><strong>{savedFood}</strong><span>Registrado · 320 kcal estimadas</span></span>
                      <span className="savia-row-arrow"><ChevronRight size={14} /></span>
                    </div>
                  )}
                </section>

                <section className="savia-card savia-plant-card">
                  <div className="savia-card-kicker" style={{ color: 'rgba(23,38,29,.58)' }}><i style={{ background: 'var(--ink)' }} /> Biodiversidad</div>
                  <h2>17 plantas distintas esta semana</h2>
                  <div className="savia-plant-figure"><i className="savia-plant-stem" /></div>
                  <span className="savia-plant-badge">+3<br />NUEVAS</span>
                </section>
              </div>
            </Tabs.Panel>

            <Tabs.Panel value="semana">
              <div className="savia-week-grid">
                <section className="savia-card savia-chart-card">
                  <div className="savia-card-kicker"><i /> Tu energía · 7 días</div>
                  <h2>Constancia, no perfección.</h2>
                  <p>Las barras muestran energía; la línea interior, densidad de fibra.</p>
                  <div className="savia-bars" role="img" aria-label="Gráfico de energía semanal">
                    {WEEK.map(item => (
                      <div className="savia-bar-column" key={item.day}>
                        <div
                          className="savia-bar"
                          data-empty={item.kcal === 0}
                          style={{
                            height: `${Math.max(4, (item.kcal / 2400) * 100)}%`,
                            '--fiber-height': `${Math.min(84, item.fiber * 2.4)}%`
                          } as React.CSSProperties}
                          title={item.kcal ? `${item.kcal} kcal · ${item.fiber} g fibra` : 'Sin registro'}
                        />
                        <span className="savia-bar-label">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="savia-week-side">
                  <section className="savia-card savia-week-mini">
                    <h3>Objetivos en curso</h3>
                    <div className="savia-goal-row"><span>Proteína</span><strong>4 / 5 DÍAS</strong></div>
                    <div className="savia-goal-row"><span>Fibra</span><strong>3 / 5 DÍAS</strong></div>
                    <div className="savia-goal-row"><span>Agua</span><strong>2 / 5 DÍAS</strong></div>
                    <div className="savia-goal-row"><span>Variedad</span><strong>17 / 30 PLANTAS</strong></div>
                  </section>
                  <section className="savia-card savia-week-quote">
                    <Sparkles size={18} />
                    <p>“Tu mejor comida es la que puedes repetir sin pensarlo.”</p>
                    <span>NOTA DE SAVIA · 06</span>
                  </section>
                </div>
              </div>
            </Tabs.Panel>
          </Tabs.Root>
        </div>
      </main>

      <Dialog.Root>
        <Dialog.Trigger className="savia-fab"><Plus size={17} /> Registrar alimento</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="savia-dialog-backdrop" />
          <Dialog.Popup className="savia-dialog-popup">
            <Dialog.Title className="savia-dialog-title">¿Qué te ha nutrido?</Dialog.Title>
            <Dialog.Description className="savia-dialog-description">Busca un alimento o elige una de tus combinaciones recientes.</Dialog.Description>
            <label className="savia-search-box"><Search size={17} /><input aria-label="Buscar alimento" placeholder="Buscar alimento o plato…" /></label>
            <div className="savia-quick-list">
              {['Tofu dorado y sésamo', 'Pan de centeno con aguacate', 'Kéfir, pera y nueces'].map(food => (
                <button key={food} className="savia-quick-item" data-selected={selectedFood === food} onClick={() => setSelectedFood(food)}>
                  <span>{food}</span>{selectedFood === food ? <Sparkles size={15} /> : <Plus size={15} />}
                </button>
              ))}
            </div>
            <div className="savia-dialog-actions">
              <Dialog.Close>Cancelar</Dialog.Close>
              <Dialog.Close className="savia-save" onClick={() => setSavedFood(selectedFood)}>Añadir al día</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
