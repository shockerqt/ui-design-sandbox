import React, { useEffect, useState } from 'react';
import { BalanceVimLogReactive } from './BalanceVimLogReactive';
import { BalanceVimShortcutHelp, balanceVimShortcutHelpStyles } from './BalanceVimShortcutHelp';

export const BalanceVimLogWithHelp: React.FC = () => {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT'
        || target?.tagName === 'TEXTAREA'
        || target?.isContentEditable;

      if (event.key === 'Escape' && helpOpen) {
        event.preventDefault();
        setHelpOpen(false);
        return;
      }

      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== '?') return;
      event.preventDefault();
      setHelpOpen((open) => !open);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [helpOpen]);

  return (
    <div className="bt-help-shell">
      <BalanceVimLogReactive />
      <button
        type="button"
        className="bt-help-trigger"
        aria-label="Toggle Balance keyboard shortcut reference"
        aria-expanded={helpOpen}
        onClick={() => setHelpOpen((open) => !open)}
      >
        ?
      </button>
      {helpOpen && <BalanceVimShortcutHelp onClose={() => setHelpOpen(false)} />}
      <style>{balanceVimShortcutHelpStyles}</style>
    </div>
  );
};
