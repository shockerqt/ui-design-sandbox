import { useState } from 'react';
import { Switch } from '@base-ui/react/switch';
import { BENCH, RACK, Rack, Ruler } from './ApartmentFloorPlan';
import './BedroomFloorPlan.css';

// cm; origin at window's left corner, +y towards opposite wall.
// User: room280×350; beds200×110 and200×90; uncut rubber200×200.
// docs/bedroom-floor-plan.md records sources, positions and remaining assumptions.
const ROOM = { width: 280, depth: 350 };
const MAT = { x: 40, y: 0, size: 200 };
const SID = { x: 140, y: 95 }; // Existing geometry; rear discs end at21.05.
const BEDS = [{ id: 'wide', width: 110 }, { id: 'narrow', width: 90 }];
const BED_LENGTH = 200;
// Front-hook bar at room y123.45; bench98.45..235.45, front feet220.45..227.45.
// The front feet fall outside the uncut mat ending at200; do not imply support.
const BENCH_HEAD = SID.y + RACK.barY - BENCH.headOffset;
const BENCH_END = BENCH_HEAD + BENCH.length;
const cm = (value: number) => value.toLocaleString('es-CL', { maximumFractionDigits: 1 });

export function BedroomFloorPlan() {
  const [lengthwise, setLengthwise] = useState(false);
  const [showBench, setShowBench] = useState(true);

  return <div className="af-simple bedroom-plan">
    <header className="bedroom-header">
      <h1>Pieza · SID y cama</h1>
      <p>280 × 350 cm · Caucho completo de 200 × 200 cm · SID de espalda al ventanal</p>
      <div className="bedroom-controls">
        <label><Switch.Root checked={lengthwise} onCheckedChange={setLengthwise} className="bedroom-switch"><Switch.Thumb /></Switch.Root>Girar camas 90°</label>
        <label><Switch.Root checked={showBench} onCheckedChange={setShowBench} className="bedroom-switch"><Switch.Thumb /></Switch.Root>Mostrar banca TT1001</label>
      </div>
    </header>
    {BEDS.map(bed => {
      // Default: long edge against the opposite wall. Rotated: head at that wall.
      const width = lengthwise ? bed.width : BED_LENGTH;
      const depth = lengthwise ? BED_LENGTH : bed.width;
      const x = (ROOM.width - width) / 2;
      const y = ROOM.depth - depth;
      const gap = y - (MAT.y + MAT.size);
      const rackEnd = SID.y + RACK.depth / 2;
      const benchGap = y - BENCH_END;

      return <section key={bed.id} data-bedroom={bed.id} data-orientation={lengthwise ? 'lengthwise' : 'across'}>
        <h2>Cama 200 × {bed.width} cm</h2>
        <p className={`bedroom-gap${gap < 0 ? ' bedroom-overlap' : ''}`}>
          {gap >= 0 ? `${cm(gap)} cm libres entre cama y caucho` : `Cama y caucho se superponen ${cm(-gap)} cm`}
        </p>
        <svg viewBox="-40 -42 360 426" role="img" aria-label={`Pieza con SID y cama de 200 por ${bed.width} centímetros${lengthwise ? ', girada hacia el ventanal' : ', con lado largo contra pared del fondo'}`}>
          <rect data-part="bedroom-room" width={ROOM.width} height={ROOM.depth} fill="#fbfdfd" />
          <rect data-part="uncut-rubber" x={MAT.x} y={MAT.y} width={MAT.size} height={MAT.size} fill="#cad4cf" stroke="#6b8377" strokeWidth="1" />
          <path data-part="uncut-tile-joints" d="M140 0V200 M40 100H240" fill="none" stroke="#9eafa4" strokeWidth=".6" />
          <text x="140" y="190" style={{fontSize:7}}>4 planchetas enteras · 200 × 200</text>
          <rect data-part="bed-envelope" x={x} y={y} width={width} height={depth} rx="2" fill="#e4d1b9" stroke="#917c65" strokeWidth="1" />
          <g data-part="bedding" fill="#f3e9dc" stroke="#bcaa97" strokeWidth=".6">
            {lengthwise
              ? <><rect x={x+5} y={y+6} width={width-10} height={depth-37} rx="2" /><rect x={x+10} y={ROOM.depth-27} width={width-20} height="20" rx="4" /></>
              : <><rect x={x+37} y={y+5} width={width-43} height={depth-10} rx="2" /><rect x={x+7} y={y+10} width="23" height={depth-20} rx="4" /></>}
          </g>
          <text x="140" y={y+depth/2} style={{fontSize:9}}>Cama · 200 × {bed.width}</text>
          {showBench && <rect data-part="bench-off-rubber" x={SID.x-BENCH.width/2} y={MAT.y+MAT.size} width={BENCH.width} height={BENCH_END-MAT.y-MAT.size} fill="#bd9463" fillOpacity=".15" stroke="#aa8053" strokeWidth=".7" strokeDasharray="3 2" />}
          {gap < 0 && <g data-part="mat-bed-overlap">
            <rect x={Math.max(x,MAT.x)} y={y} width={Math.min(x+width,MAT.x+MAT.size)-Math.max(x,MAT.x)} height={-gap} fill="#bc6754" fillOpacity=".2" stroke="#a75d4c" strokeDasharray="3 2" />
            <text x="140" y="179" style={{fontSize:7,fill:'#984c3e'}}>50 cm sobre el caucho</text>
          </g>}
          <g data-part="bedroom-sid" transform={`translate(${SID.x} ${SID.y})`}><Rack turn={0} showBench={showBench} widthRulerY={35} hookPosition="front" /></g>
          <path d="M0 0V350H280V0" fill="none" stroke="#263f48" strokeWidth="4" />
          <path d="M0 0H280" stroke="#73a8b8" strokeWidth="5" />
          <text x="140" y="-10">Ventanal · 280 cm</text>
          <Ruler x={0} y={-28} length={ROOM.width} label="280 cm" />
          <Ruler x={-24} y={ROOM.depth} length={ROOM.depth} label="350 cm" vertical />
          <Ruler x={40} y={211} length={200} label="Caucho · 200 cm" />
          <Ruler x={302} y={200} length={200} label="200 cm" vertical />
          <Ruler x={x} y={366} length={width} label={`${width} cm`} />
          <Ruler x={302} y={350} length={depth} label={`${depth} cm`} vertical />
          {gap >= 0 && <Ruler x={265} y={y} length={gap} label={`${gap} cm libres`} vertical />}
          <Ruler x={0} y={73} length={30} label="30 cm" />
          <Ruler x={250} y={73} length={30} label="30 cm" />
        </svg>
        <p className="af-plan-caption">Barra libre 220 cm · 30 cm hasta cada pared. Discos traseros a ≈21 cm del ventanal.</p>
        {gap < 0 && <p className="af-plan-caption bedroom-overlap">La cama entra ≈{cm(rackEnd-y)} cm en la envolvente frontal del rack{showBench ? ` y ≈${cm(-benchGap)} cm en la de la banca` : ''}. Revisar apoyos y alturas.</p>}
        {showBench && <>
          <p className={`af-plan-caption${benchGap < 0 ? ' bedroom-overlap' : ''}`} data-part="bench-bed-gap">Press en ganchos delanteros · Banca 137 × 57 cm · {benchGap >= 0 ? `≈${cm(benchGap)} cm hasta cama` : `Solape con cama: ≈${cm(-benchGap)} cm`}.</p>
          <p className="af-plan-caption bedroom-overlap">La banca sale ≈{cm(BENCH_END-MAT.y-MAT.size)} cm del caucho; apoyo delantero fuera. Ajustar altura de barra y seguros.</p>
        </>}
      </section>;
    })}
    <p className="bedroom-notes">Camas centradas. Medidas dadas usadas como envolvente exterior; confirmar estructura. Puerta y clóset pendientes de ubicar. Los pasos indicados son distancias en planta.</p>
  </div>;
}
