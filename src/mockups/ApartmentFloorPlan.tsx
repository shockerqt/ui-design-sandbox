import React, { useId, useRef, useState } from 'react';
import { Switch } from '@base-ui/react/switch';
import './ApartmentFloorPlan.css';
import { useApartmentGym, GYM_EXPORT_STYLE } from './ApartmentGym';

const INITIAL = { width: 350, depth: 300, doorY: 210, doorWidth: 80, islandX: 210, islandY: 190, islandDepth: 57, fridgeY: 5, fridgeGap: 5 };
type Plan = typeof INITIAL;
const fmt = (n: number) => `${(n / 100).toLocaleString('es-CL', { maximumFractionDigits: 2 })} m`;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
function normalize(p: Plan): Plan {
  const width = clamp(p.width, 150, 1000), depth = clamp(p.depth, 150, 1000);
  const doorY = clamp(p.doorY, 0, depth - 40);
  const islandY = clamp(p.islandY, 75, depth - 20);
  return { width, depth, doorY, doorWidth: clamp(p.doorWidth, 40, depth - doorY), islandX: clamp(p.islandX, 0, width - 20), islandY, islandDepth: clamp(p.islandDepth, 20, depth - islandY), fridgeY: clamp(p.fridgeY, 0, islandY - 70), fridgeGap: clamp(p.fridgeGap, 0, width - 70) };
}

export function ApartmentFloorPlan() {
  const [plan, setPlan] = useState<Plan>(INITIAL);
  return <div className="apartment-compare"><header className="af-compare-header"><p className="af-eyebrow">DEPARTAMENTO / COMPARAR DISTRIBUCIONES</p><h1>Dos orientaciones para el press banca.</h1><p>Misma escala y medidas del departamento. Rack, banca y caucho se ajustan por separado en cada versión.</p></header><div className="af-compare-grid"><ApartmentPlanView variant="window" plan={plan} setPlan={setPlan} /><ApartmentPlanView variant="door" plan={plan} setPlan={setPlan} /></div></div>;
}

function ApartmentPlanView({ variant, plan, setPlan }: { variant: 'window' | 'door'; plan: Plan; setPlan: React.Dispatch<React.SetStateAction<Plan>> }) {
  const title = variant === 'window' ? 'A · Espalda hacia el ventanal' : 'B · Espalda hacia la pared de la puerta';
  const gridId = `apartment-grid-${useId().replace(/:/g, '')}`;
  const [grid, setGrid] = useState(true);
  const [dimensions, setDimensions] = useState(true);
  const [selected, setSelected] = useState<'room' | 'island' | 'fridge' | 'gym'>('gym');
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ y: number; initial: number } | null>(null);
  const update = (key: keyof Plan, value: number) => {
    if (Number.isFinite(value)) setPlan(p => normalize({ ...p, [key]: value }));
  };
  const w = plan.width, h = plan.depth;
  const islandWidth = w - plan.islandX;
  const fridgeX = w - 70 - plan.fridgeGap;
  const gym = useApartmentGym(w, h, { x: plan.islandX, y: plan.islandY, width: islandWidth, height: plan.islandDepth }, { x: fridgeX, y: plan.fridgeY, width: 70, height: 70 }, () => setSelected('gym'), variant);
  const field = (label: string, key: keyof Plan, min: number, max: number, hint?: string) => (
    <label className="af-field" key={key}><span>{label}{hint && <small>{hint}</small>}</span><span className="af-number"><input aria-label={label} type="number" min={min} max={max} step="1" value={plan[key]} onChange={e => { if (e.target.value !== '') update(key, e.target.valueAsNumber); }} /><span>cm</span></span></label>
  );
  const dim = (x1: number, y1: number, x2: number, y2: number, text: string, vertical = false) => (
    <g className="af-dimension" key={`${x1}-${y1}-${text}`}>
      <path d={`M${x1},${y1} L${x2},${y2}`} />
      {vertical ? <><path d={`M${x1-4},${y1}h8 M${x2-4},${y2}h8`} /><text transform={`translate(${x1-9} ${(y1+y2)/2}) rotate(-90)`}>{text}</text></> : <><path d={`M${x1},${y1-4}v8 M${x2},${y2-4}v8`} /><text x={(x1+x2)/2} y={y1-8}>{text}</text></>}
    </g>
  );
  function download() {
    if (!svgRef.current) return;
    const copy = svgRef.current.cloneNode(true) as SVGSVGElement;
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    copy.querySelectorAll('g[role]').forEach(g => { g.removeAttribute('tabindex'); g.removeAttribute('role'); });
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = 'text{font-family:Arial,sans-serif;fill:#263f48;font-size:10px;text-anchor:middle}.af-wall{fill:none;stroke:#263f48;stroke-width:6}.af-dimension path{stroke:#60808b;fill:none;stroke-width:.7}.af-dimension text{font-size:9px}.af-fridge-body{fill:#d5e7ed;stroke:#456d7a;stroke-width:1.5}.af-island-body{fill:#e4d1aa;stroke:#8b7044;stroke-width:1.5}.af-furniture-name{font-size:11px;font-weight:bold}.af-furniture-size{font-size:9px}.af-note{font-size:8px;fill:#687f86}';
    style.textContent += GYM_EXPORT_STYLE;
    copy.prepend(style);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }));
    const a = document.createElement('a'); a.href = url; a.download = `plano-departamento-${variant}.svg`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="apartment-plan" aria-label={title}>
    <header className="af-header"><div><h2>{title}</h2><p>{variant === 'window' ? 'Orientación original · frente hacia abajo' : 'Giro de 270° · frente hacia la derecha'}</p></div><button onClick={download}>Descargar SVG ↗</button></header>
    <div className="af-layout">
      <main className="af-drawing">
        <div className="af-drawing-top"><span>Planta + banca <b>{variant === 'window' ? 'A' : 'B'}</b></span><span>{fmt(w)} × {fmt(h)} · {(w*h/10000).toLocaleString('es-CL', { maximumFractionDigits: 2 })} m²</span></div>
        <svg ref={svgRef} className="af-svg" viewBox={`-65 -65 ${w+130} ${h+130}`} aria-label="Plano a escala del departamento, con ventanal arriba, puerta izquierda, isla y refrigerador a la derecha, piso de caucho y rack con barra de 220 cm" role="img" onPointerMove={e => {
          if (!drag.current || !svgRef.current) return;
          const matrix = svgRef.current.getScreenCTM(); if (!matrix) return;
          const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
          update('fridgeY', Math.round(drag.current.initial + point.y - drag.current.y));
        }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
          <defs><pattern id={gridId} width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#bdced2" strokeWidth="0.35" /></pattern></defs>
          <rect x="-65" y="-65" width={w+130} height={h+130} fill="#f1f6f7" />
          <rect width={w} height={h} fill="#fbfdfd" />
          {grid && <rect width={w} height={h} fill={`url(#${gridId})`} />}
          {gym.floorDrawing}
          <path className="af-wall" d={`M0,${plan.doorY} V0 H${w} V${h} H0 V${plan.doorY+plan.doorWidth}`} />
          <path d={`M3 0 H${w-3}`} stroke="#66a3b5" strokeWidth="7" /><path d={`M3 0 H${w-3}`} stroke="#ebf7fb" strokeWidth="2" />
          <text x={w/2} y="-13" className="af-furniture-name">VENTANAL</text>
          <path d={`M0 ${plan.doorY} V${plan.doorY+plan.doorWidth}`} stroke="#bc895b" strokeWidth="2" strokeDasharray="4 3" />
          <text transform={`translate(-15 ${plan.doorY+plan.doorWidth/2}) rotate(-90)`} className="af-note">PUERTA · ANCHO POR MEDIR</text>
          <g role="button" tabIndex={0} aria-label="Seleccionar isla" onClick={() => setSelected('island')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected('island'); } }}>
            <rect className="af-island-body" x={plan.islandX} y={plan.islandY} width={islandWidth} height={plan.islandDepth} rx="1" />
            {selected === 'island' && <rect x={plan.islandX-3} y={plan.islandY-3} width={islandWidth+6} height={plan.islandDepth+6} fill="none" stroke="#926e37" strokeDasharray="3 2" />}
            <text className="af-furniture-name" x={plan.islandX+islandWidth/2} y={plan.islandY+plan.islandDepth/2-3}>ISLA</text>
            <text className="af-furniture-size" x={plan.islandX+islandWidth/2} y={plan.islandY+plan.islandDepth/2+11}>{islandWidth} × {plan.islandDepth} cm</text>
          </g>
          <g role="button" tabIndex={0} aria-label="Seleccionar refrigerador. Flechas arriba y abajo para mover un centímetro" className="af-fridge" onClick={() => setSelected('fridge')} onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected('fridge'); }
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); setSelected('fridge'); update('fridgeY', plan.fridgeY + (e.key === 'ArrowDown' ? 1 : -1)); }
          }} onPointerDown={e => {
            const matrix = svgRef.current?.getScreenCTM(); if (!matrix) return;
            const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
            setSelected('fridge'); drag.current = { y: point.y, initial: plan.fridgeY }; e.currentTarget.setPointerCapture(e.pointerId);
          }}>
            <rect className="af-fridge-body" x={fridgeX} y={plan.fridgeY} width="70" height="70" rx="2" />
            <path d={`M${fridgeX+6} ${plan.fridgeY+54}h58`} stroke="#7395a0" strokeWidth="1" />
            <text className="af-furniture-name" x={fridgeX+35} y={plan.fridgeY+29}>REFRI</text><text className="af-furniture-size" x={fridgeX+35} y={plan.fridgeY+43}>70 × 70</text>
            {selected === 'fridge' && <rect x={fridgeX-3} y={plan.fridgeY-3} width="76" height="76" fill="none" stroke="#456d7a" strokeDasharray="3 2" />}
          </g>
          {gym.drawing}
          {dimensions && <>
            {dim(0, -38, w, -38, fmt(w))}
            {dim(-42, 0, -42, h, `≈ ${fmt(h)}`, true)}
            {dim(-20, 0, -20, plan.doorY, fmt(plan.doorY), true)}
            {dim(0, h+27, plan.islandX, h+27, fmt(plan.islandX))}
            {dim(plan.islandX, h+27, w, h+27, fmt(islandWidth))}
            {dim(w+28, 0, w+28, plan.islandY, fmt(plan.islandY), true)}
            {dim(w+28, plan.islandY, w+28, plan.islandY+plan.islandDepth, fmt(plan.islandDepth), true)}
          </>}
          <text x={w/2} y={h+54} className="af-note">Fondo aproximado · puerta y posición del refri pendientes de confirmar</text>
        </svg>
        {gym.benchReadout}
        <footer className="af-legend"><span><i className="af-dot window" />Ventanal</span><span><i className="af-dot island" />Isla fija a pared</span><span><i className="af-dot fridge" />Refri movible</span><span><i className="af-dot rubber" />Caucho 2 × 2 m</span><span>Rack: despiece estimado</span><span>Retícula: 10 cm</span></footer>
      </main>
      <aside className="af-sidebar">
        <div className="af-tabs" aria-label="Elemento a editar">{(['room','island','fridge','gym'] as const).map((id,i) => <button key={id} aria-pressed={selected===id} onClick={() => setSelected(id)}>{['Espacio','Isla','Refri','Rack'][i]}</button>)}</div>
        {selected === 'room' && <section><h2>La envolvente</h2><p>El ventanal define el lado superior del plano.</p>{field('Ancho del ventanal','width',150,1000)}{field('Fondo del espacio','depth',150,1000,'Aproximado')}{field('Ventanal → puerta','doorY',0,h-40,'Hasta el borde más cercano')}{field('Ancho de puerta','doorWidth',40,h-plan.doorY,'Provisional: 80 cm; falta medir')}</section>}
        {selected === 'island' && <section><h2>La isla</h2><p>Adosada a la pared derecha. Su largo se calcula a partir del espacio disponible.</p>{field('Pared izquierda → isla','islandX',0,w-20)}{field('Ventanal → isla','islandY',75,h-20)}{field('Ancho de la isla','islandDepth',20,h-plan.islandY)}<div className="af-result">Largo resultante <strong>{fmt(islandWidth)}</strong></div></section>}
        {selected === 'fridge' && <section><h2>El refrigerador</h2><p>70 × 70 cm. Arrástralo hacia arriba o abajo, usa las flechas al seleccionarlo o ajusta las medidas.</p>{field('Separación pared derecha','fridgeGap',0,w-70)}{field('Ventanal → refri','fridgeY',0,plan.islandY-70,'Posición provisional: falta medir')}<div className="af-result">Huella <strong>0,49 m²</strong></div></section>}
        {selected === 'gym' && gym.panel}
        <section className="af-view"><h2>Lectura del plano</h2>{([['Retícula de 10 cm',grid,setGrid],['Mostrar cotas',dimensions,setDimensions]] as const).map(([label,value,set]) => <label className="af-toggle" key={label}><span>{label}</span><Switch.Root checked={value} onCheckedChange={set} className="af-switch" aria-label={label}><Switch.Thumb className="af-thumb" /></Switch.Root></label>)}</section>
        <div className="af-assumptions"><strong>Por confirmar</strong><p>Fondo de unos 3 m. Ancho y apertura de la puerta. Distancia del refri al ventanal; por ahora se deja a 5 cm.</p><p>Los cambios se conservan mientras este lienzo esté abierto. Descarga el plano para guardar una versión.</p></div>
        <button className="af-reset" onClick={() => { gym.reset(); setSelected('gym'); setGrid(true); setDimensions(true); }}>Restablecer rack y banca</button>
      </aside>
    </div>
  </section>;
}
