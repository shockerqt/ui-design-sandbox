import React, { useEffect, useRef, useState } from 'react';
import { Accordion, Dialog, Popover, Switch, Tabs, Tooltip } from '@base-ui/react';
import { ChevronDown } from 'lucide-react';

/**
 * Observa los atributos data-* y aria-* reales de un elemento del DOM.
 * No refleja el estado de React: lee lo que Base UI escribe en el nodo,
 * que es exactamente contra lo que se escriben los selectores CSS.
 */
function useAttrSpy<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [attrs, setAttrs] = useState<Record<string, string>>({});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let previous = '';
    const read = () => {
      const next: Record<string, string> = {};
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('data-') || attr.name.startsWith('aria-')) {
          // Se conserva el valor vacio tal cual: asi es como aparece en devtools,
          // y un [data-checked] engancha en CSS sin importar su valor.
          next[attr.name] = attr.value;
        }
      }
      const serialized = JSON.stringify(next);
      if (serialized !== previous) {
        previous = serialized;
        setAttrs(next);
      }
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return [ref, attrs] as const;
}

const StateReadout: React.FC<{ attrs: Record<string, string>; observing: string }> = ({
  attrs,
  observing
}) => {
  const entries = Object.entries(attrs).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.55)',
        border: '1px solid #1a1a1a',
        borderRadius: '10px',
        padding: '14px 16px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        lineHeight: '1.9',
        minWidth: 0
      }}
    >
      <div
        style={{
          color: 'var(--text-dim)',
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '2px'
        }}
      >
        estado en el DOM
      </div>
      <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', marginBottom: '10px' }}>
        observando {observing}
      </div>

      {entries.length === 0 ? (
        <div style={{ color: 'var(--text-dim)' }}>sin atributos de estado</div>
      ) : (
        entries.map(([name, value]) => (
          <div key={name} style={{ display: 'flex', gap: '6px', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>{name}</span>
            {/* Un atributo sin valor se muestra solo con su nombre, como en devtools */}
            {value !== '' && (
              <>
                <span style={{ color: '#333' }}>=</span>
                {/* key={value} remonta el span, por lo que el destello se repite en cada cambio */}
                <span key={value} className="attr-value" style={{ color: 'var(--primary)' }}>
                  {value}
                </span>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const Bench: React.FC<{
  module: string;
  summary: string;
  attrs: Record<string, string>;
  observing: string;
  children: React.ReactNode;
}> = ({ module, summary, attrs, observing, children }) => (
  <section
    style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 280px)',
      gap: '24px',
      alignItems: 'start',
      padding: '28px 0',
      borderTop: '1px solid #141414'
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--primary)',
          marginBottom: '6px'
        }}
      >
        {module}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '18px', maxWidth: '46ch' }}>
        {summary}
      </p>
      {children}
    </div>

    <StateReadout attrs={attrs} observing={observing} />
  </section>
);

const triggerStyle: React.CSSProperties = {
  background: '#111111',
  border: '1px solid #262626',
  color: '#ffffff',
  font: 'inherit',
  fontSize: '0.825rem',
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer'
};

export const PrimitivesWorkbench: React.FC = () => {
  const [switchRef, switchAttrs] = useAttrSpy<HTMLButtonElement>();
  const [tabRef, tabAttrs] = useAttrSpy<HTMLButtonElement>();
  const [accordionRef, accordionAttrs] = useAttrSpy<HTMLButtonElement>();
  const [dialogRef, dialogAttrs] = useAttrSpy<HTMLButtonElement>();
  const [tooltipRef, tooltipAttrs] = useAttrSpy<HTMLButtonElement>();
  const [popoverRef, popoverAttrs] = useAttrSpy<HTMLButtonElement>();

  const [checked, setChecked] = useState(false);

  return (
    <div style={{ padding: '40px 32px 48px', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '8px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            marginBottom: '10px'
          }}
        >
          Primitivas Base UI
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '58ch', lineHeight: '1.6' }}>
          Base UI no trae estilos: cada primitiva publica su estado como atributos en el
          nodo del DOM, y ahi es donde engancha el CSS. Interactua con cualquiera y mira
          los atributos cambiar en vivo.
        </p>
      </header>

      <Bench
        module="@base-ui/react/switch"
        summary="Alterna un valor booleano. El fondo y la posicion del thumb se resuelven en CSS con el selector [data-checked]."
        attrs={switchAttrs}
        observing="Switch.Root"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Switch.Root
            ref={switchRef}
            className="base-Switch-root"
            checked={checked}
            onCheckedChange={setChecked}
          >
            <Switch.Thumb className="base-Switch-thumb" />
          </Switch.Root>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Notificaciones {checked ? 'activadas' : 'desactivadas'}
          </span>
        </div>
      </Bench>

      <Bench
        module="@base-ui/react/tabs"
        summary="El indicador se posiciona con las variables --active-tab-width y --active-tab-left que Base UI calcula y escribe en el DOM."
        attrs={tabAttrs}
        observing="Tabs.Tab «Resumen»"
      >
        <Tabs.Root defaultValue="resumen">
          <Tabs.List className="base-Tabs-list">
            <Tabs.Tab ref={tabRef} className="base-Tabs-tab" value="resumen">
              Resumen
            </Tabs.Tab>
            <Tabs.Tab className="base-Tabs-tab" value="consumo">
              Consumo
            </Tabs.Tab>
            <Tabs.Tab className="base-Tabs-tab" value="alertas">
              Alertas
            </Tabs.Tab>
            <Tabs.Indicator className="base-Tabs-indicator" />
          </Tabs.List>

          <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', paddingTop: '14px' }}>
            <Tabs.Panel value="resumen">Estado general del sistema en las ultimas 24 horas.</Tabs.Panel>
            <Tabs.Panel value="consumo">Caudal acumulado por punto de medicion.</Tabs.Panel>
            <Tabs.Panel value="alertas">Ninguna alerta activa en este momento.</Tabs.Panel>
          </div>
        </Tabs.Root>
      </Bench>

      <Bench
        module="@base-ui/react/accordion"
        summary="El trigger recibe data-panel-open mientras su panel esta desplegado. El chevron gira desde CSS, sin estado en React."
        attrs={accordionAttrs}
        observing="el primer Accordion.Trigger"
      >
        <Accordion.Root style={{ borderTop: '1px solid #1a1a1a' }}>
          <Accordion.Item className="base-Accordion-item">
            <Accordion.Header>
              <Accordion.Trigger ref={accordionRef} className="base-Accordion-trigger">
                Como se registra un mockup
                <ChevronDown className="base-Accordion-chevron" size={15} />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="base-Accordion-panel">
              Se agrega una entrada a mockupRegistry con su id en kebab-case. La ruta
              /m/&lt;id&gt; se resuelve sola desde ahi.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item className="base-Accordion-item">
            <Accordion.Header>
              <Accordion.Trigger className="base-Accordion-trigger">
                Donde viven los estilos compartidos
                <ChevronDown className="base-Accordion-chevron" size={15} />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="base-Accordion-panel">
              En src/index.css, bajo las clases .base-* y las variables de :root.
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      </Bench>

      <Bench
        module="@base-ui/react/dialog"
        summary="El popup se monta en un portal fuera del arbol. El trigger es el que conserva el estado, por eso el inspector lo observa a el."
        attrs={dialogAttrs}
        observing="Dialog.Trigger"
      >
        <Dialog.Root>
          <Dialog.Trigger ref={dialogRef} style={triggerStyle}>
            Abrir modal
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="base-Dialog-backdrop" />
            <Dialog.Popup className="base-Dialog-popup">
              <Dialog.Title
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  marginBottom: '8px'
                }}
              >
                Confirmar despliegue
              </Dialog.Title>
              <Dialog.Description style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Se recompila el bundle y se recarga Nginx. El sitio queda unos segundos
                sirviendo la version anterior.
              </Dialog.Description>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Dialog.Close style={triggerStyle}>Cancelar</Dialog.Close>
                <Dialog.Close
                  style={{ ...triggerStyle, background: '#ffffff', color: '#000000', borderColor: '#ffffff' }}
                >
                  Desplegar
                </Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </Bench>

      <Bench
        module="@base-ui/react/tooltip"
        summary="Se abre con hover y tambien con foco de teclado. Prueba llegar con Tab para ver el mismo atributo activarse."
        attrs={tooltipAttrs}
        observing="Tooltip.Trigger"
      >
        <Tooltip.Root>
          <Tooltip.Trigger ref={tooltipRef} style={triggerStyle}>
            Pasa el mouse o enfoca
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup className="base-Tooltip-popup">
                Se cierra al salir o con Escape
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Bench>

      <Bench
        module="@base-ui/react/popover"
        summary="A diferencia del tooltip, atrapa el foco y admite contenido interactivo dentro."
        attrs={popoverAttrs}
        observing="Popover.Trigger"
      >
        <Popover.Root>
          <Popover.Trigger ref={popoverRef} style={triggerStyle}>
            Ver detalle
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className="base-Popover-popup">
                <Popover.Title style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  Punto de medicion 04
                </Popover.Title>
                <Popover.Description style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Ultima lectura hace 3 minutos. Caudal dentro del rango esperado.
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </Bench>
    </div>
  );
};
