export type BalanceShortcutState = 'active' | 'partial' | 'planned';

export type BalanceShortcut = {
  keys: string;
  action: string;
  state: BalanceShortcutState;
  note?: string;
};

export type BalanceShortcutSection = {
  title: string;
  shortcuts: BalanceShortcut[];
};

export const BALANCE_VIM_SHORTCUTS: BalanceShortcutSection[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'j / k', action: 'Move cursor one food down / up', state: 'active' },
      { keys: '[count]j / [count]k', action: 'Move cursor N foods', state: 'active' },
      { keys: 'h / l', action: 'Previous / next day buffer', state: 'active' },
      { keys: 'H / L', action: 'Previous / next week', state: 'active' },
      { keys: '[count]h / [count]l', action: 'Move N days', state: 'active' },
      { keys: '[count]H / [count]L', action: 'Move N weeks', state: 'active' },
      { keys: 'gt', action: 'Return to today', state: 'active' },
      { keys: 'gg', action: 'Jump to first food in the day', state: 'active' },
      { keys: 'G', action: 'Jump to last food in the day', state: 'active' },
      { keys: '[n]G', action: 'Jump to food N, 1-based', state: 'active' },
      { keys: '[ / ]', action: 'Previous / next hour block', state: 'active' },
      { keys: '[count][ / [count]]', action: 'Move N hour blocks', state: 'active' },
    ],
  },
  {
    title: 'Selection & text objects',
    shortcuts: [
      { keys: 'Space / v', action: 'Enter or leave contiguous VISUAL selection', state: 'active' },
      { keys: 'V', action: 'Select the complete current hour block', state: 'active' },
      { keys: 'viw / vib', action: 'Select current hour block', state: 'active' },
      { keys: 'vaw / vab', action: 'Alias for current hour block for now', state: 'active' },
      { keys: 'Esc', action: 'Return to NORMAL / cancel selection or editor', state: 'active' },
    ],
  },
  {
    title: 'Operators & register',
    shortcuts: [
      { keys: 'yy', action: 'Yank current food into unnamed register', state: 'active' },
      { keys: 'dd', action: 'Delete current food into unnamed register', state: 'active' },
      { keys: 'D', action: 'Delete current food through the end of its hour block', state: 'active' },
      { keys: 'x / [count]x', action: 'Quick-delete current food or N foods into register', state: 'active' },
      { keys: 'yiw / yib / yaw / yab', action: 'Yank current hour block', state: 'active' },
      { keys: 'diw / dib / daw / dab', action: 'Delete current hour block into register', state: 'active' },
      { keys: 'd{motion} / y{motion}', action: 'Apply delete/yank to motions such as j, k, G, gg, [ and ]', state: 'active' },
      { keys: 'd2j / 2d3j', action: 'Operator and motion counts compose; operator and motion counts multiply', state: 'active' },
      { keys: 'VISUAL + d / y', action: 'Delete / yank the current selection', state: 'active' },
      { keys: 'p / P', action: 'Paste after / before in NORMAL; register persists', state: 'active' },
      { keys: '[count]p / [count]P', action: 'Paste N copies after / before', state: 'active' },
      { keys: 'VISUAL + p / P', action: 'Replace selection with register; displaced selection becomes the new register', state: 'active' },
    ],
  },
  {
    title: 'Move foods',
    shortcuts: [
      { keys: '> / <', action: 'Move current food or VISUAL selection down / up one position', state: 'active' },
      { keys: '[count]> / [count]<', action: 'Move current food or selection N positions', state: 'active' },
    ],
  },
  {
    title: 'Add & replace food',
    shortcuts: [
      { keys: 'o / a', action: 'Open food picker and insert below current food at the same time', state: 'active' },
      { keys: 'O', action: 'Open food picker and insert above current food at the same time', state: 'active' },
      { keys: 'A', action: 'Open food picker at the current wall-clock time on the selected day', state: 'active' },
      { keys: '[HH]a / [HH]A', action: 'Add at explicit hour, e.g. 13a → 13:00', state: 'active' },
      { keys: '[HHMM]a / [HHMM]A', action: 'Add at explicit time, e.g. 1330a → 13:30', state: 'active' },
      { keys: 'r', action: 'Replace current food while preserving time and compatible quantity/unit', state: 'active' },
    ],
  },
  {
    title: 'Edit quantity',
    shortcuts: [
      { keys: 'e / click qty', action: 'Edit quantity of current food inline', state: 'active' },
      { keys: 'Tab', action: 'Cycle to the next valid unit without moving focus', state: 'active' },
      { keys: 'Shift+Tab', action: 'Cycle to the previous valid unit without moving focus', state: 'active' },
      { keys: 'Enter / Esc', action: 'Confirm / cancel quantity + unit draft', state: 'active' },
    ],
  },
  {
    title: 'Edit time',
    shortcuts: [
      { keys: 't / click time', action: 'Edit time of current food inline', state: 'active' },
      { keys: 'VISUAL + t', action: 'Edit time for all selected foods', state: 'active' },
      { keys: 't 1430', action: 'Assign absolute time; every selected food becomes 14:30', state: 'active' },
      { keys: 't +30 / t -15', action: 'Shift each selected timestamp relatively by minutes', state: 'active' },
      { keys: 't +1h / t -2h', action: 'Shift each selected timestamp relatively by hours', state: 'active' },
      { keys: '=iw / =ib / =aw / =ab', action: 'Normalize current hour block to the timestamp of the cursor food', state: 'active' },
      { keys: 'VISUAL + =', action: 'Normalize selection to the timestamp of the cursor food', state: 'active' },
      { keys: 'Enter / Esc', action: 'Confirm / cancel time draft', state: 'active' },
    ],
  },
  {
    title: 'History & repeat',
    shortcuts: [
      { keys: 'u / [count]u', action: 'Undo one or N buffer mutations', state: 'active' },
      { keys: 'U / [count]U', action: 'Redo one or N buffer mutations', state: 'active' },
      { keys: 'Ctrl+r', action: 'Redo alias in NORMAL/VISUAL; Ctrl+Shift+r remains available for browser hard reload', state: 'active' },
      { keys: '.', action: 'Repeat the last semantic edit when compatible', state: 'active' },
    ],
  },
  {
    title: 'Search',
    shortcuts: [
      { keys: '/', action: 'Search foods already registered in the current day', state: 'active' },
      { keys: 'n / N', action: 'Next / previous match', state: 'active' },
    ],
  },
  {
    title: 'Food picker',
    shortcuts: [
      { keys: 'Tab / Shift+Tab', action: 'Next / previous search result while input keeps focus', state: 'active' },
      { keys: 'Alt+j / Alt+k', action: 'Next / previous search result while input keeps focus', state: 'active' },
      { keys: '↑ / ↓', action: 'Next / previous search result', state: 'active' },
      { keys: 'Enter', action: 'Add highlighted result', state: 'active' },
      { keys: 'Esc', action: 'Cancel picker and return focus to terminal', state: 'active' },
    ],
  },
  {
    title: 'Persistence & sync',
    shortcuts: [
      { keys: 'Enter', action: 'Commit the current inline edit locally', state: 'active', note: 'NORMAL represents locally persisted state; editors are temporary drafts.' },
      { keys: 'Esc', action: 'Discard the current inline draft', state: 'active' },
      { keys: ':w', action: 'No binding for now', state: 'planned', note: 'Manual save/flush stays intentionally deferred; the statusline models fast local-first sync instead.' },
    ],
  },
  {
    title: 'Help',
    shortcuts: [{ keys: '?', action: 'Toggle this canonical shortcut reference', state: 'active' }],
  },
];
