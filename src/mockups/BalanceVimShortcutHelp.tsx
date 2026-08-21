import React from 'react';
import { BALANCE_VIM_SHORTCUTS } from './balanceVimShortcutSpec';

export const BalanceVimShortcutHelp: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <aside className="bt-help" aria-label="Balance Vim shortcut specification">
    <div className="bt-help-head">
      <div>
        <strong>balance://shortcuts</strong>
        <span>canonical mockup spec · active / partial / planned</span>
      </div>
      <button type="button" onClick={onClose}>esc</button>
    </div>

    <div className="bt-help-grid">
      {BALANCE_VIM_SHORTCUTS.map((section) => (
        <section key={section.title} className="bt-help-section">
          <h3>{section.title}</h3>
          {section.shortcuts.map((shortcut) => (
            <div className="bt-help-row" key={`${section.title}-${shortcut.keys}`}>
              <code>{shortcut.keys}</code>
              <div>
                <span>{shortcut.action}</span>
                {shortcut.note && <small>{shortcut.note}</small>}
              </div>
              <i className={`is-${shortcut.state}`}>{shortcut.state}</i>
            </div>
          ))}
        </section>
      ))}
    </div>
  </aside>
);

export const balanceVimShortcutHelpStyles = `
  .bt-help-trigger {
    position: fixed;
    z-index: 4;
    right: 18px;
    bottom: 18px;
    width: 30px;
    height: 30px;
    border: 1px solid #2e3c4b;
    border-radius: 5px;
    background: rgba(9, 13, 18, 0.9);
    color: #6ea8ff;
    font: 700 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    cursor: pointer;
    backdrop-filter: blur(8px);
  }

  .bt-help-trigger:hover { border-color: #6ea8ff; }

  .bt-help {
    position: fixed;
    z-index: 5;
    top: clamp(12px, 3vw, 36px);
    right: clamp(12px, 3vw, 36px);
    bottom: clamp(12px, 3vw, 36px);
    width: min(720px, calc(100vw - 24px));
    overflow: auto;
    border: 1px solid #344454;
    border-radius: 8px;
    background: rgba(7, 11, 16, 0.97);
    color: #dce6f0;
    box-shadow: 0 22px 80px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(18px);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  }

  .bt-help-head {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 13px 14px;
    border-bottom: 1px solid #273441;
    background: rgba(9, 13, 18, 0.97);
  }

  .bt-help-head strong { display: block; color: #6ea8ff; font-size: 12px; font-weight: 600; }
  .bt-help-head span { display: block; margin-top: 3px; color: #6f7d8b; font-size: 9px; }
  .bt-help-head button { border: 0; background: transparent; color: #71808f; font: inherit; font-size: 10px; cursor: pointer; }
  .bt-help-grid { padding: 4px 14px 18px; }
  .bt-help-section { padding-top: 15px; }
  .bt-help-section h3 { margin: 0 0 6px; color: #8493a2; font-size: 9px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; }

  .bt-help-row {
    display: grid;
    grid-template-columns: 160px minmax(0, 1fr) 54px;
    gap: 12px;
    align-items: start;
    min-height: 31px;
    padding: 6px 0;
    border-bottom: 1px solid rgba(49, 62, 75, 0.45);
    font-size: 10px;
  }

  .bt-help-row code { color: #d9e6f7; font: inherit; white-space: nowrap; }
  .bt-help-row div > span { display: block; color: #a6b2be; }
  .bt-help-row small { display: block; margin-top: 3px; color: #667482; font-size: 9px; line-height: 1.4; }
  .bt-help-row i { justify-self: end; color: #61707e; font-size: 8px; font-style: normal; text-transform: uppercase; }
  .bt-help-row i.is-active { color: #6ea8ff; }
  .bt-help-row i.is-partial { color: #c5a85a; }

  @media (max-width: 620px) {
    .bt-help-row { grid-template-columns: 116px minmax(0, 1fr); }
    .bt-help-row i { grid-column: 2; justify-self: start; margin-top: -3px; }
  }
`;
