import React from 'react';
import { Link } from 'wouter';
import { MockupItem } from '../types';

/**
 * Una fila del registro. El slug se muestra como la ruta real (/m/<id>)
 * porque ese es el dato que se comparte, no un identificador interno.
 */
export const MockupRow: React.FC<{ mockup: MockupItem }> = ({ mockup }) => (
  <Link href={`/m/${mockup.id}`} className="register-row">
    <span className="register-title">{mockup.title}</span>

    <span className="register-slug">
      <span className="prefix">/m/</span>
      {mockup.id}
    </span>

    <span style={{ color: 'var(--fg-quiet)', fontSize: '0.8rem' }}>{mockup.category}</span>

    <span className="mono" style={{ color: 'var(--fg-faint)' }}>
      {mockup.version}
    </span>

    <span className="mono" style={{ color: 'var(--fg-faint)' }}>
      {mockup.updatedAt}
    </span>
  </Link>
);
