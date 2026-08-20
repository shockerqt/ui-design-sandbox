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

/**
 * Canonical keyboard decisions for the Balance terminal mockup.
 *
 * This is intentionally broader than the current implementation. The mockup is
 * being used as a UX specification for the real Balance app, so shortcuts stay
 * documented here even while their behavior is still being prototyped.
 */
export const BALANCE_VIM_SHORTCUTS: BalanceShortcutSection[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'j / k', action: 'Move cursor one food down / up', state: 'active' },
      { keys: '[count]j / [count]k', action: 'Move cursor N foods', state: 'partial', note: 'Counts are currently implemented for day navigation only.' },
      { keys: 'h / l', action: 'Previous / next day buffer', state: 'active' },
      { keys: 'H / L', action: 'Previous / next week', state: 'active' },
      { keys: '[count]h / [count]l', action: 'Move N days', state: 'active' },
      { keys: '[count]H / [count]L', action: 'Move N weeks', state: 'active' },
      { keys: 't', action: 'Return to today', state: 'active' },
      { keys: 'gg', action: 'Jump to first food in the day', state: 'planned' },
      { keys: 'G', action: 'Jump to last food in the day', state: 'planned' },
      { keys: '[n]G', action: 'Jump to food N, 1-based', state: 'planned' },
    ],
  },
  {
    title: 'Selection & text objects',
    shortcuts: [
      { keys: 'Space / v', action: 'Enter or leave contiguous VISUAL selection', state: 'partial', note: 'v works; Space is decided but pending.' },
      { keys: 'V', action: 'Select the complete current hour block', state: 'active' },
      { keys: 'viw / vib', action: 'Select inner hour block', state: 'planned', note: 'w and b are aliases for the Balance hour-block object.' },
      { keys: 'vaw / vab', action: 'Select around hour block', state: 'planned', note: 'inner/around are equivalent while group headers remain derived presentation.' },
      { keys: 'Esc', action: 'Return to NORMAL / cancel selection or editor', state: 'active' },
    ],
  },
  {
    title: 'Operators & register',
    shortcuts: [
      { keys: 'yy', action: 'Yank current food into register', state: 'planned' },
      { keys: 'dd', action: 'Cut current food into register', state: 'planned' },
      { keys: 'yiw / yib / yaw / yab', action: 'Yank current hour block', state: 'planned' },
      { keys: 'diw / dib / daw / dab', action: 'Cut current hour block', state: 'planned' },
      { keys: 'y', action: 'Yank current VISUAL selection', state: 'partial', note: 'Currently also yanks the current row directly in NORMAL.' },
      { keys: 'd', action: 'Cut current VISUAL selection', state: 'partial', note: 'Currently also cuts the current row directly in NORMAL.' },
      { keys: 'x', action: 'Delete current food / VISUAL selection without changing register', state: 'active' },
      { keys: 'p / P', action: 'Paste after / before; register persists after paste', state: 'partial', note: 'p works, but cut register is currently consumed and P is pending.' },
      { keys: '[count]p / [count]P', action: 'Paste N copies after / before', state: 'planned' },
      { keys: 'u', action: 'Undo latest buffer mutation', state: 'active' },
    ],
  },
  {
    title: 'Move foods',
    shortcuts: [
      { keys: '> / <', action: 'Move current food or VISUAL selection down / up one position', state: 'planned', note: 'Movement must keep timestamp ordering coherent.' },
      { keys: '[count]> / [count]<', action: 'Move current food or selection N positions', state: 'planned' },
    ],
  },
  {
    title: 'Add food',
    shortcuts: [
      { keys: 'o / a', action: 'Open food picker and insert below current food at the same time', state: 'partial', note: 'a currently opens the picker; o is pending.' },
      { keys: 'O', action: 'Open food picker and insert above current food at the same time', state: 'planned' },
      { keys: 'A', action: 'Open food picker at the current wall-clock time on the selected day', state: 'planned' },
      { keys: '[HH]a / [HH]A', action: 'Add at explicit hour, e.g. 13a → 13:00', state: 'planned' },
      { keys: '[HHMM]a / [HHMM]A', action: 'Add at explicit time, e.g. 1330a → 13:30', state: 'planned' },
    ],
  },
  {
    title: 'Edit food',
    shortcuts: [
      { keys: 'e', action: 'Edit quantity of current food inline', state: 'planned' },
      { keys: 'click qty', action: 'Edit quantity inline', state: 'planned' },
      { keys: 'T', action: 'Edit time of current food', state: 'planned' },
      { keys: 'VISUAL + T', action: 'Set the same time on every selected food', state: 'planned' },
      { keys: 'click time', action: 'Edit food time inline', state: 'planned' },
      { keys: 'Enter / Esc', action: 'Confirm / cancel inline editor', state: 'planned' },
    ],
  },
  {
    title: 'Food picker',
    shortcuts: [
      { keys: 'Tab / Shift+Tab', action: 'Next / previous search result while input keeps focus', state: 'planned' },
      { keys: 'Alt+j / Alt+k', action: 'Next / previous search result while input keeps focus', state: 'planned' },
      { keys: '↑ / ↓', action: 'Next / previous search result', state: 'active' },
      { keys: 'Enter', action: 'Add highlighted result', state: 'active' },
      { keys: 'Esc', action: 'Cancel picker and return focus to terminal', state: 'partial', note: 'Picker closes; explicit terminal focus restoration is pending.' },
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      { keys: '?', action: 'Toggle this canonical shortcut reference', state: 'active' },
    ],
  },
];
