import { MockupItem } from '../types';
import { BaseUIShowcase } from './BaseUIShowcase';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SaaSPricing } from './SaaSPricing';
import { CommandPalette } from './CommandPalette';
import { MobileFintechWallet } from './MobileFintechWallet';
import { AIChatDashboard } from './AIChatDashboard';

export const mockupRegistry: MockupItem[] = [
  {
    id: 'tableros-chat-ia',
    title: 'Tablero Control Chat IA & Agentes',
    category: 'Dashboards',
    description: 'Tablero de control para interacción con Agentes de IA, flujo de mensajes en directo, telemetría y modales de configuración Base UI (Estilo Sora / Tableros CloudFront).',
    tags: ['Chat IA', 'Sora Font', 'Base UI Dialog', 'Base UI Switch', 'Telemetría'],
    version: 'v1.0.0',
    updatedAt: '2026-08-05',
    component: AIChatDashboard,
    previewGradient: 'linear-gradient(135deg, rgba(131, 149, 213, 0.4), rgba(79, 110, 247, 0.2))',
    codeSnippet: `<div style={{ background: '#0d1117', color: '#8b95b0', fontFamily: "'Sora', sans-serif" }}>
  <Dialog.Root>
    <Dialog.Trigger>Configurar Prompt</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Popup className="base-Dialog-popup" style={{ background: '#161b27' }}>
        <h3>Ajustes del Prompt</h3>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
</div>`
  },
  {
    id: 'base-ui-primitives',
    title: 'Base UI Headless Components Lab',
    category: 'Base UI Primitives',
    description: 'Interactive test laboratory for @base-ui/react unstyled primitives (Tooltip, Dialog, Tabs, Switch, Accordion).',
    tags: ['React 19', 'Base UI', 'Tooltips', 'Modals', 'Tabs', 'Switch'],
    version: 'v1.7.0',
    updatedAt: '2026-08-05',
    component: BaseUIShowcase,
    previewGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.2))',
    codeSnippet: `import { Tooltip, Dialog, Tabs, Switch, Accordion } from '@base-ui/react';

// Render accessible Base UI primitives styled with custom CSS variables
export const MyComponent = () => (
  <Tabs.Root defaultValue="tab1">
    <Tabs.List className="base-TabsList-root">
      <Tabs.Tab value="tab1" className="base-Tab-root">Design Tokens</Tabs.Tab>
    </Tabs.List>
  </Tabs.Root>
);`
  },
  {
    id: 'analytics-dashboard',
    title: 'Futuristic Telemetry & Analytics',
    category: 'Dashboards',
    description: 'High-density telemetry dashboard featuring glow KPI cards, live SVG throughput charts, and system audit logs.',
    tags: ['Dashboard', 'Glow Cards', 'SVG Chart', 'Telemetry', 'Base UI Tooltip'],
    version: 'v2.1.0',
    updatedAt: '2026-08-05',
    component: AnalyticsDashboard,
    previewGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(16, 185, 129, 0.2))',
    codeSnippet: `// KPI Stats with sparklines and Base UI tooltips
const KPIStat = ({ title, value, change, color }) => (
  <div className="glass-panel" style={{ padding: '20px' }}>
    <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{value}</div>
    <span style={{ color }}>{change}</span>
  </div>
);`
  },
  {
    id: 'saas-pricing',
    title: 'Cyber SaaS Pricing & Tier Checkout',
    category: 'SaaS & Pricing',
    description: 'Tiered subscription pricing grid with monthly/annual billing switch and Base UI checkout modal dialog.',
    tags: ['Pricing', 'Switch', 'Base UI Dialog', 'Glassmorphism', 'SaaS'],
    version: 'v1.4.0',
    updatedAt: '2026-08-05',
    component: SaaSPricing,
    previewGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(99, 102, 241, 0.2))',
    codeSnippet: `<Switch.Root checked={isYearly} onCheckedChange={setIsYearly} className="base-Switch-root">
  <Switch.Thumb className="base-Switch-thumb" />
</Switch.Root>`
  },
  {
    id: 'command-palette',
    title: 'Spotlight Search & Tabbed Settings',
    category: 'Settings & Modals',
    description: 'Developer ⌘K command palette spotlight powered by Base UI Dialog and tabbed preferences form.',
    tags: ['⌘K Palette', 'Base UI Dialog', 'Base UI Tabs', 'Settings'],
    version: 'v1.1.0',
    updatedAt: '2026-08-05',
    component: CommandPalette,
    previewGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(99, 102, 241, 0.2))',
    codeSnippet: `<Dialog.Root open={openCommand} onOpenChange={setOpenCommand}>
  <Dialog.Portal>
    <Dialog.Backdrop className="base-Dialog-backdrop" />
    <Dialog.Popup className="base-Dialog-popup">
      <SearchInput />
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>`
  },
  {
    id: 'mobile-fintech-wallet',
    title: 'Glassmorphic Mobile Card Wallet',
    category: 'Fintech & Cards',
    description: 'Responsive mobile wallet interface featuring a neon debit card, instant transfer modal, and activity feed.',
    tags: ['Fintech', 'Mobile UI', 'Neon Card', 'Glassmorphism', 'Base UI Modal'],
    version: 'v1.0.0',
    updatedAt: '2026-08-05',
    component: MobileFintechWallet,
    previewGradient: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(236, 72, 153, 0.2))',
    codeSnippet: `// Neon Glassmorphic Card Container
<div style={{
  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
  borderRadius: '20px',
  padding: '24px'
}}>
  <div>•••• •••• •••• 8842</div>
</div>`
  }
];
