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
 *
 * Register semantics are still under design review. Shortcut intent is recorded
 * here, but persistence/identity behavior around yank/delete/paste is not final.
 */
export const BALANCE_VIM_SHORTCUTS: BalanceShortcutSection[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'j / k', action: 'Move cursor one food down / up', state: 'active' },
      { keys: '[count]j / [count]k', action: 'Move cursor N foods', state: 'planned' },
      { keys: 'h / l', action: 'Previous / next day buffer', state: 'active' },
      { keys: 'H / L', action: 'Previous / next week', state: 'active' },
      { keys: '[count]h / [count]l', action: 'Move N days', state: 'active' },
      { keys: '[count]H / [count]L', action: 'Move N weeks', state: 'active' },
      { keys: 'gt', action: 'Return to today', state: 'planned', note: 'Replaces the current t binding so lowercase t can mean time editing.' },
      { keys: 'gg', action: 'Jump to first food in the day', state: 'planned' },
      { keys: 'G', action: 'Jump to last food in the day', state: 'planned' },
      { keys: '[n]G', action: 'Jump to food N, 1-based', state: 'planned' },
    ],
  },
  {
    title: 'Selection & text objects',
    shortcuts: [
      { keys: 'Space / v', action: 'Enter or leave contiguous VISUAL selection', state: 'partial', note: 'v works; Space is the preferred alias and is pending.' },
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
      { keys: 'y', action: 'Yank current VISUAL selection', state: 'partial', note: 'Currently also yanks the current row directly in NORMAL; operator semantics are planned.' },
      { keys: 'd', action: 'Cut current VISUAL selection', state: 'partial', note: 'Currently also cuts the current row directly in NORMAL; operator semantics are planned.' },
      { keys: 'x', action: 'Delete current food / VISUAL selection without changing register', state: 'active' },
      { keys: 'p / P', action: 'Paste after / before', state: 'partial', note: 'Desired UX keeps the register available for repeated pastes. Exact register identity semantics remain under review.' },
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
    title: 'Edit quantity',
    shortcuts: [
      { keys: 'e', action: 'Edit quantity of current food inline', state: 'planned' },
      { keys: 'click qty', action: 'Enter the same inline quantity editor', state: 'planned' },
      { keys: 'Tab', action: 'Cycle to the next valid unit without moving focus', state: 'planned' },
      { keys: 'Shift+Tab', action: 'Cycle to the previous valid unit without moving focus', state: 'planned' },
      { keys: 'Enter / Esc', action: 'Confirm / cancel quantity + unit draft', state: 'planned' },
    ],
  },
  {
    title: 'Edit time',
    shortcuts: [
      { keys: 't', action: 'Edit time of current food inline', state: 'planned', note: 'Lowercase t becomes time now that today moves to gt.' },
      { keys: 'VISUAL + t', action: 'Edit time for all selected foods', state: 'planned' },
      { keys: 't 1430', action: 'Assign absolute time; every selected food becomes 14:30', state: 'planned' },
      { keys: 't +30 / t -15', action: 'Shift each selected timestamp relatively by minutes', state: 'planned' },
      { keys: 't +1h / t -2h', action: 'Shift each selected timestamp relatively by hours', state: 'planned' },
      { keys: '=iw / =ib', action: 'Normalize current hour block to the timestamp of the cursor food', state: 'planned' },
      { keys: '=aw / =ab', action: 'Alias for hour-block normalization for now', state: 'planned' },
      { keys: 'VISUAL + =', action: 'Normalize selection to the timestamp of the cursor food', state: 'planned' },
      { keys: 'click time', action: 'Enter the same inline time editor', state: 'planned' },
      { keys: 'Enter / Esc', action: 'Confirm / cancel time draft', state: 'planned' },
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
    title: 'Persistence & sync',
    shortcuts: [
      { keys: 'Enter', action: 'Commit the current inline edit locally', state: 'planned', note: 'NORMAL represents locally persisted state; editors are temporary drafts.' },
      { keys: 'Esc', action: 'Discard the current inline draft', state: 'planned' },
      { keys: ':w', action: 'No binding for now', state: 'planned', note: 'Manual save/flush is intentionally deferred. Fast local-first sync should make it unnecessary unless real usage proves otherwise.' },
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      { keys: '?', action: 'Toggle this canonical shortcut reference', state: 'active' },
    ],
  },
];
