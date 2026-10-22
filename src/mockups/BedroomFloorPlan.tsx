import { useState } from 'react';
import { BENCH, RACK, Rack, Ruler } from './ApartmentFloorPlan';
import './BedroomFloorPlan.css';

// cm; user: room280×350, beds200×110/200×90, pillar60×60, door70.
// TV42in,7cm protrusion,95cm from window;95 assumed to near edge.
// Approx93cm panel width from16:9; actual frame/height pending.
// Origin: window's left corner, +y towards opposite wall. Door hinge assumed
// at pillar's upper-right corner; exact swing remains schematic.
// docs/bedroom-floor-plan.md records sources and all current coordinates.
const ROOM = { width: 280, depth: 350 };
const PILLAR = { x: 220, y: 290, size: 60 };
const DOOR = { x: 280, hingeY: 290, width: 70 };
const TV = { y: 95, length: 93, depth: 7 };
const BAR_LENGTH = 220;
const LAYOUTS = [
  // Rear stored discs:83.95-51.45-22.5=10cm to window (visual estimate).
  { id: 'window', title: 'Espalda al ventanal', x: 140, y: 83.95, angle: 0, matX: 40, matY: 0 },
  { id: 'left', title: 'Espalda a pared izquierda', x: 95, y: 120, angle: 270, matX: 0, matY: 20 }
];
const BEDS = [{ id: 'wide', width: 110 }, { id: 'narrow', width: 90 }];
const BED_LENGTH = 200;
const BENCH_HEAD = RACK.barY - BENCH.headOffset; // Local3.45..140.45.
const BENCH_END = BENCH_HEAD + BENCH.length;
const cm = (value: number) => Number(value.toFixed(2)).toLocaleString('es-CL', { maximumFractionDigits: 1 });

export function BedroomFloorPlan() {
  const [leftShift, setLeftShift] = useState(3);

  return <div className="af-simple bedroom-plan">
    <header className="bedroom-header">
      <h1>Pieza · SID, press banca y cama</h1>
      <p>280 × 350 cm · Caucho entero 200 × 200 · Pilar 60 × 60 · Puerta 70 cm</p>
      <div className="bedroom-controls">
        <label htmlFor="bedroom-left-shift">Rack al ventanal · mover hacia la izquierda</label>
        <input id="bedroom-left-shift" type="range" min="0" max="25" step="1" value={leftShift} onChange={event => setLeftShift(Number(event.target.value))} />
        <output htmlFor="bedroom-left-shift">{leftShift} cm</output>
      </div>
    </header>
    {LAYOUTS.flatMap(base => BEDS.map(bed => {
      const layout = base.id === 'window' ? { ...base, x: base.x-leftShift, matX: base.matX-leftShift } : base;
      const left = layout.angle === 270;
      const width = BED_LENGTH;
      const depth = bed.width;
      const x = 0; // Across beds shifted left to clear the fixed pillar.
      const y = ROOM.depth - depth;
      const matEnd = layout.matY + 200;
      const gap = y - matEnd;
      const bench = left
        ? { x: layout.x+BENCH_HEAD, y: layout.y-BENCH.width/2, w: BENCH.length, h: BENCH.width }
        : { x: layout.x-BENCH.width/2, y: layout.y+BENCH_HEAD, w: BENCH.width, h: BENCH.length };
      const benchGap = y - bench.y - bench.h;
      const benchOverhang = left ? bench.x+bench.w-layout.matX-200 : bench.y+bench.h-matEnd;
      const barGap = left ? y-layout.y-110 : null;
      const rearGap = (left ? layout.x : layout.y) + RACK.rearY - 22.5;
      const barLeft = layout.x-BAR_LENGTH/2;
      const tvGap = barLeft-TV.depth;

      return <section key={`${layout.id}-${bed.id}`} data-bedroom={bed.id} data-rack-position={layout.id} data-orientation="across">
        <h2>{layout.title} · Cama 200 × {bed.width}</h2>
        <p className={`bedroom-gap${gap < 0 ? ' bedroom-overlap' : ''}`}>{gap >= 0 ? `${cm(gap)} cm entre cama y caucho` : `Cama y caucho se superponen ${cm(-gap)} cm`}</p>
        <svg viewBox="-40 -42 360 426" role="img" aria-label={`${layout.title}, cama de 200 por ${bed.width}, pilar y puerta de 70 centímetros`}>
          <rect data-part="bedroom-room" width={ROOM.width} height={ROOM.depth} fill="#fbfdfd" />
          <rect data-part="uncut-rubber" x={layout.matX} y={layout.matY} width="200" height="200" fill="#cad4cf" stroke="#6b8377" strokeWidth="1" />
          <path data-part="uncut-tile-joints" d={`M${layout.matX+100} ${layout.matY}v200 M${layout.matX} ${layout.matY+100}h200`} fill="none" stroke="#9eafa4" strokeWidth=".6" />
          <text x={layout.matX+100} y={layout.matY+190} style={{fontSize:7}}>4 planchetas enteras · 200 × 200</text>
          <rect data-part="bed-envelope" x={x} y={y} width={width} height={depth} rx="2" fill="#e4d1b9" stroke="#917c65" strokeWidth="1" />
          <g data-part="bedding" fill="#f3e9dc" stroke="#bcaa97" strokeWidth=".6">
            <rect x={x+37} y={y+5} width={width-43} height={depth-10} rx="2" /><rect x={x+7} y={y+10} width="23" height={depth-20} rx="4" />
          </g>
          <text x={x+width/2} y={y+depth/2} style={{fontSize:9}}>Cama · 200 × {bed.width}</text>
          <>
            <rect data-part="bench-envelope" x={bench.x} y={bench.y} width={bench.w} height={bench.h} fill="none" stroke="#b48073" strokeWidth=".6" />
            <rect data-part="bench-off-rubber" x={left ? layout.matX+200 : bench.x} y={left ? bench.y : matEnd} width={left ? benchOverhang : bench.w} height={left ? bench.h : benchOverhang} fill="#bd9463" fillOpacity=".15" stroke="#aa8053" strokeWidth=".7" strokeDasharray="3 2" />
          </>
          <g data-part="bedroom-sid" transform={`translate(${layout.x} ${layout.y}) rotate(${layout.angle})`}><Rack turn={layout.angle} showBench={true} widthRulerY={-12} hookPosition="front" /></g>
          <path d={`M0 0V350H280V${DOOR.hingeY} M280 ${DOOR.hingeY-DOOR.width}V0`} fill="none" stroke="#263f48" strokeWidth="4" />
          <path d="M0 0H280" stroke="#73a8b8" strokeWidth="5" />
          <g data-part="bedroom-tv">
            <rect data-part="tv-envelope" x="0" y={TV.y} width={TV.depth} height={TV.length} fill="#667b87" stroke="#3c5563" strokeWidth=".8" />
            <text x="-8" y={TV.y+TV.length/2} style={{fontSize:6.5}} transform={`rotate(-90 -8 ${TV.y+TV.length/2})`}>TV 42″ · sale 7 cm</text>
          </g>
          {!left && <>
            {tvGap > 0
              ? <Ruler x={TV.depth} y={layout.y+RACK.barY-12} length={tvGap} label={`${cm(tvGap)} cm`} />
              : <rect data-part="tv-bar-overlap" x={Math.max(0,barLeft)} y={layout.y+RACK.barY-3} width={Math.max(.5,TV.depth-Math.max(0,barLeft))} height="6" fill="#b85646" />}
          </>}
          <g data-part="bedroom-pillar">
            <rect x={PILLAR.x} y={PILLAR.y} width={PILLAR.size} height={PILLAR.size} fill="#8d9b9e" stroke="#53676e" strokeWidth="1" />
            <text x="250" y="316" style={{fontSize:7,fill:'#fbfdfd'}}>Pilar</text><text x="250" y="328" style={{fontSize:7,fill:'#fbfdfd'}}>60 × 60</text>
          </g>
          <g data-part="bedroom-door">
            <path data-part="door-sweep" d={`M280 290V220A70 70 0 0 0 210 290Z`} fill="#d4a86a" fillOpacity=".12" stroke="#b28a50" strokeWidth=".7" strokeDasharray="3 2" />
            <path d="M280 290H210" stroke="#a77c43" strokeWidth="2" />
            <circle cx="280" cy="290" r="1.8" fill="#a77c43" />
            <text x="271" y="255" style={{fontSize:6}} transform="rotate(-90 271 255)">Puerta 70</text>
          </g>
          <text x="140" y="-10">Ventanal · 280 cm</text>
          <Ruler x={0} y={-28} length={ROOM.width} label="280 cm" />
          <Ruler x={-24} y={ROOM.depth} length={ROOM.depth} label="350 cm" vertical />
          {!left && <Ruler x={24} y={rearGap} length={rearGap} label={`≈${cm(rearGap)} cm detrás`} vertical />}
          <Ruler x={layout.matX} y={matEnd+11} length={200} label="Caucho · 200 cm" />
          <Ruler x={302} y={matEnd} length={200} label="200 cm" vertical />
          <Ruler x={x} y={366} length={width} label={`${width} cm`} />
          <Ruler x={302} y={350} length={depth} label={`${depth} cm`} vertical />
          {gap >= 0 && <Ruler x={205} y={y} length={gap} label={`${gap} cm`} vertical />}
        </svg>
        {!left && <p data-part="tv-bar-gap" data-gap={tvGap} className={`af-plan-caption${tvGap <= 0 ? ' bedroom-overlap' : ''}`}>{tvGap > 0 ? `${cm(tvGap)} cm entre punta de barra y TV` : tvGap === 0 ? 'La punta de la barra toca la proyección de la TV' : `Solape barra/TV: ${cm(-tvGap)} cm`}. Separación en planta; comprobar altura y maniobra con discos.</p>}
        <p className="af-plan-caption">Barra 220 cm · {left ? '10 cm al ventanal' : `Punta izquierda a ${cm(barLeft)} cm del muro · Punta derecha a ${cm(ROOM.width-layout.x-BAR_LENGTH/2)} cm del muro · Discos a ≈${cm(rearGap)} cm del ventanal`}{left && barGap !== null ? barGap >= 0 ? ` · ${cm(barGap)} cm hasta cama` : ' · Su proyección cruza la cama: comprobar alturas' : ''}.</p>
        <>
          <p className={`af-plan-caption${benchGap < 0 ? ' bedroom-overlap' : ''}`} data-part="bench-bed-gap">Press en ganchos delanteros · Banca 137 × 57 · {benchGap >= 0 ? `≈${cm(benchGap)} cm hasta cama` : `Solape con cama: ≈${cm(-benchGap)} cm`}.</p>
          <p className="af-plan-caption bedroom-overlap">Banca ≈{cm(benchOverhang)} cm fuera del caucho; apoyo delantero fuera. Ajustar altura de barra y seguros.</p>
        </>
      </section>;
    }))}
    <p className="bedroom-notes">Camas atravesadas desplazadas a la izquierda: 20 cm hasta pilar y 10 cm hasta el barrido supuesto de la puerta. Bisagra dibujada junto al pilar; confirmar giro real. Medidas de cama usadas como envolvente exterior. TV dibujada desde 95 cm del ventanal (borde cercano supuesto), ancho ≈93 cm para 42″; marco y altura pendientes. Clóset pendiente.</p>
  </div>;
}
