import React from 'react';
import { Button, Input, Toggle } from '@base-ui/react';
import { ArrowRight, Check, CreditCard, Layers3, Palette, Search, Sparkles } from 'lucide-react';
import './BaseUIColorSystem.css';

type Variant = 'solid' | 'soft' | 'outline' | 'ghost';
type Tone = 'accent' | 'lavender' | 'mint' | 'amber' | 'rose';

const variants: Variant[] = ['solid', 'soft', 'outline', 'ghost'];
const tones: Array<{ id: Tone; label: string; token: string }> = [
  { id: 'accent', label: 'Accent', token: 'oklch(78% .16 255)' },
  { id: 'lavender', label: 'Lavender', token: 'oklch(80% .15 300)' },
  { id: 'mint', label: 'Mint', token: 'oklch(82% .13 165)' },
  { id: 'amber', label: 'Amber', token: 'oklch(84% .15 80)' },
  { id: 'rose', label: 'Rose', token: 'oklch(79% .16 18)' }
];

const surfaces = [
  ['Background', '--surface-0', 'oklch(13.5% .035 255)'],
  ['Surface 1', '--surface-1', 'oklch(17% .040 255)'],
  ['Surface 2', '--surface-2', 'oklch(21% .045 255)'],
  ['Surface 3', '--surface-3', 'oklch(25.5% .052 255)'],
  ['Surface 4', '--surface-4', 'oklch(30% .058 255)'],
  ['Surface 5', '--surface-5', 'oklch(35% .062 255)']
] as const;

const ButtonDemo: React.FC<{
  variant: Variant;
  tone?: Tone;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ variant, tone = 'accent', children, disabled }) => (
  <Button
    className={`ucs-button ucs-${variant} ucs-tone-${tone}`}
    disabled={disabled}
  >
    {children}
  </Button>
);

const ChipDemo: React.FC<{
  variant: Variant;
  tone?: Tone;
  children: React.ReactNode;
  defaultPressed?: boolean;
}> = ({ variant, tone = 'accent', children, defaultPressed = false }) => (
  <Toggle
    className={`ucs-chip ucs-${variant} ucs-tone-${tone}`}
    defaultPressed={defaultPressed}
  >
    <Check className="ucs-chip-check" size={13} strokeWidth={2.5} />
    {children}
  </Toggle>
);

export const BaseUIColorSystem: React.FC = () => {
  return (
    <main className="ucs-root">
      <div className="ucs-shell">
        <header className="ucs-hero">
          <div>
            <div className="ucs-eyebrow">Base UI · color system specimen</div>
            <h1>Dark blue, not dead gray.</h1>
            <p>
              One accent family, a deeper chromatic surface ladder and pastel tones with enough
              intensity to survive a real interface.
            </p>
          </div>
          <div className="ucs-hero-mark" aria-hidden="true">
            <Palette size={24} />
          </div>
        </header>

        <section className="ucs-section">
          <div className="ucs-section-head">
            <div>
              <span className="ucs-index">01</span>
              <h2>Surfaces</h2>
            </div>
            <p>Six levels from app background to the most elevated container.</p>
          </div>
          <div className="ucs-surface-grid">
            {surfaces.map(([label, token, value], index) => (
              <article
                className="ucs-surface-swatch"
                style={{ '--surface-index': index } as React.CSSProperties}
                key={token}
              >
                <div className="ucs-swatch-fill" />
                <div className="ucs-swatch-copy">
                  <strong>{label}</strong>
                  <code>{token}</code>
                  <span>{value}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ucs-section">
          <div className="ucs-section-head">
            <div>
              <span className="ucs-index">02</span>
              <h2>Tones</h2>
            </div>
            <p>The accent is the only generic interaction color. The rest are contextual tones.</p>
          </div>
          <div className="ucs-tone-grid">
            {tones.map((tone) => (
              <article className={`ucs-tone-card ucs-tone-${tone.id}`} key={tone.id}>
                <div className="ucs-tone-orb" />
                <div>
                  <strong>{tone.label}</strong>
                  <code>{tone.token}</code>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ucs-section">
          <div className="ucs-section-head">
            <div>
              <span className="ucs-index">03</span>
              <h2>Buttons</h2>
            </div>
            <p>Same semantic tone, four levels of visual weight.</p>
          </div>
          <div className="ucs-component-panel">
            <div className="ucs-variant-head" aria-hidden="true">
              <span />
              {variants.map((variant) => <span key={variant}>{variant}</span>)}
            </div>
            {tones.map((tone) => (
              <div className="ucs-variant-row" key={tone.id}>
                <div className={`ucs-row-label ucs-tone-${tone.id}`}>
                  <span className="ucs-row-dot" />
                  {tone.label}
                </div>
                {variants.map((variant) => (
                  <ButtonDemo variant={variant} tone={tone.id} key={variant}>
                    Button
                  </ButtonDemo>
                ))}
              </div>
            ))}
            <div className="ucs-disabled-row">
              <span>Disabled</span>
              <ButtonDemo variant="solid" disabled>Button</ButtonDemo>
              <ButtonDemo variant="soft" disabled>Button</ButtonDemo>
              <ButtonDemo variant="outline" disabled>Button</ButtonDemo>
              <ButtonDemo variant="ghost" disabled>Button</ButtonDemo>
            </div>
          </div>
        </section>

        <section className="ucs-section">
          <div className="ucs-section-head">
            <div>
              <span className="ucs-index">04</span>
              <h2>Chips</h2>
            </div>
            <p>Built with Base UI Toggle. Press them to inspect the selected state.</p>
          </div>
          <div className="ucs-component-panel">
            <div className="ucs-variant-head" aria-hidden="true">
              <span />
              {variants.map((variant) => <span key={variant}>{variant}</span>)}
            </div>
            <div className="ucs-variant-row">
              <div className="ucs-row-label ucs-tone-accent">
                <span className="ucs-row-dot" />
                Accent
              </div>
              {variants.map((variant, index) => (
                <ChipDemo variant={variant} defaultPressed={index === 1} key={variant}>
                  Chip
                </ChipDemo>
              ))}
            </div>
            <div className="ucs-chip-tones">
              {tones.map((tone, index) => (
                <ChipDemo
                  variant="soft"
                  tone={tone.id}
                  defaultPressed={index < 2}
                  key={tone.id}
                >
                  {tone.label}
                </ChipDemo>
              ))}
            </div>
          </div>
        </section>

        <div className="ucs-two-column">
          <section className="ucs-section ucs-section-compact">
            <div className="ucs-section-head">
              <div>
                <span className="ucs-index">05</span>
                <h2>Text</h2>
              </div>
            </div>
            <div className="ucs-type-card">
              <div className="ucs-type-display">Make the hierarchy obvious.</div>
              <div className="ucs-type-title">Product title</div>
              <p className="ucs-type-body">
                Primary body text should feel calm against a chromatic dark surface, not glow like
                a dashboard from 2013.
              </p>
              <p className="ucs-type-secondary">Secondary copy carries context without competing.</p>
              <p className="ucs-type-muted">Muted metadata · updated 2 minutes ago</p>
            </div>
          </section>

          <section className="ucs-section ucs-section-compact">
            <div className="ucs-section-head">
              <div>
                <span className="ucs-index">06</span>
                <h2>Inputs</h2>
              </div>
            </div>
            <div className="ucs-input-stack">
              <label className="ucs-field">
                <span>Search</span>
                <div className="ucs-input-wrap">
                  <Search size={16} aria-hidden="true" />
                  <Input className="ucs-input" placeholder="Search components" />
                </div>
              </label>
              <label className="ucs-field">
                <span>Project name</span>
                <Input className="ucs-input ucs-input-standalone" defaultValue="Astra" />
              </label>
              <label className="ucs-field">
                <span>Disabled</span>
                <Input className="ucs-input ucs-input-standalone" defaultValue="Read only" disabled />
              </label>
            </div>
          </section>
        </div>

        <section className="ucs-section">
          <div className="ucs-section-head">
            <div>
              <span className="ucs-index">07</span>
              <h2>Cards</h2>
            </div>
            <p>Surfaces get meaning when content actually has to live on them.</p>
          </div>
          <div className="ucs-card-grid">
            <article className="ucs-product-card ucs-card-a">
              <div className="ucs-card-icon ucs-tone-accent"><CreditCard size={18} /></div>
              <div className="ucs-card-kicker">Available balance</div>
              <div className="ucs-metric">$12,480.32</div>
              <div className="ucs-delta">+8.4% this month</div>
              <div className="ucs-meter"><span /></div>
            </article>

            <article className="ucs-product-card ucs-card-b">
              <div className="ucs-card-icon ucs-tone-lavender"><Layers3 size={18} /></div>
              <div>
                <div className="ucs-card-kicker">Surface discipline</div>
                <h3>Elevation without fake depth.</h3>
                <p>Use another surface level before reaching for a shadow.</p>
              </div>
              <div className="ucs-mini-stack" aria-hidden="true">
                <span /><span /><span />
              </div>
            </article>

            <article className="ucs-product-card ucs-card-c">
              <div className="ucs-card-icon ucs-tone-mint"><Sparkles size={18} /></div>
              <div>
                <div className="ucs-card-kicker">Next step</div>
                <h3>Turn the specimen into tokens.</h3>
                <p>Keep component aliases semantic and let the palette do the tedious part.</p>
              </div>
              <ButtonDemo variant="soft" tone="mint">
                Explore tokens <ArrowRight size={15} />
              </ButtonDemo>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
};
