import React from 'react';
import './ApartmentFloorPlan.css';

/*
 * All SVG coordinates are centimetres; origin is the window's left corner.
 * User measurements: room 350 × ~300; left door starts at y=210 (width 80
 * provisional). Island x=210, y=190, 140 × 57. Fridge 70 × 70, right gap 5;
 * its y=5 placement remains provisional. Rubber floor: 200 × 200.
 *
 * Rack: https://sdmed.cl/productos/jaula-rack-ws-barbell-stack-rowing-sid-srhsrhd/
 * Photo: https://sdmed.cl/wp-content/uploads/2023/02/1-8.jpg
 * Published 221.8 × 138.9 × 165.8, without axis labels. Provisional model:
 * width 165.8, depth 138.9, height 221.8. Rear horns ~25 per side, main post
 * centres ±54.4; rear posts 10 from back, main posts 60 from front foot tips.
 * J-hooks/bar 8 ahead of main posts; safeties 50 long. Stored discs assume
 * Ø45 and ~20 stack thickness. Four storage levels overlap in top view.
 *
 * Bench: https://sdmed.cl/productos/banco-doble-regulacion-y-soporte-serie-tts-tt1001/
 * Published 137 × 57; flat position not dimensioned. Pad/feet are illustrative.
 * Head end is 25 behind bar; bar length is 220. No ergonomic fit is inferred.
 * Preserved layouts: A floor (10,5), rack (125,105), 0°; B floor (10,10),
 * rack (90,120), 270° (rear toward left/door wall). Initial bench overhang:
 * A 29.45 below floor; B 9.45 right. A floorY=35 covers bare rack + bench.
 * B head offset=35 also covers the bench, but posture needs confirmation.
 * Edit these constants/figures directly for the next iteration.
 */
const ROOM = { width: 350, depth: 300, doorY: 210, doorWidth: 80 };
const RACK = { width: 165.8, depth: 138.9, postX: 54.4, rearY: -59.45, frontY: 9.45, barY: 17.45 };
const BENCH = { width: 57, length: 137, headOffset: 25 };
const LAYOUTS = [
  { id: 'a', title: 'A · Espalda al ventanal', floorX: 10, floorY: 5, x: 125, y: 105, angle: 0 },
  { id: 'b', title: 'B · Espalda a la pared de la puerta', floorX: 10, floorY: 10, x: 90, y: 120, angle: 270 }
];

function Rack() {
  const r = RACK, head = r.barY - BENCH.headOffset;
  return <>
    <path d={`M${-r.postX} ${r.rearY}H${r.postX}`} stroke="#40545b" strokeWidth="5" />
    {[-1, 1].map(side => <g key={side}>
      <rect className="af-rack" x={side*r.postX-3.5} y={-r.depth/2+5} width="7" height={r.depth-5} />
      <rect className="af-rack" x={side*r.postX-5} y={r.depth/2-7} width="10" height="7" />
      <rect x={side < 0 ? -r.width/2 : r.postX} y={r.rearY-2.5} width="28.5" height="5" fill="#718489" />
      {[0, 1, 2].map(i => <rect key={i} x={side < 0 ? -r.width/2+3+i*6.5 : r.postX+4+i*6.5} y={r.rearY-22.5} width="6" height="45" rx="1" fill="#68716d" stroke="#dce4df" strokeWidth=".8" />)}
      <rect x={side*r.postX-3.5} y={r.frontY} width="7" height="50" fill="#819397" stroke="#344e57" strokeWidth="1" />
      <path d={`M${side*r.postX-4} ${r.frontY}v10h8v-4`} fill="none" stroke="#a7713d" strokeWidth="2.5" />
    </g>)}
    <g data-part="bench">
      {[head+15, head+122].map(y => <rect key={y} x={-BENCH.width/2} y={y} width={BENCH.width} height="7" rx="1" fill="#786260" />)}
      <rect x="-3" y={head+15} width="6" height="114" fill="#786260" />
      <rect x="-15" y={head+2} width="30" height="83" rx="5" fill="#b48073" stroke="#714f49" />
      <rect x="-14" y={head+89} width="28" height="29" rx="4" fill="#bc8f83" stroke="#714f49" />
    </g>
    <g data-part="bar" fill="#bdcbd0" stroke="#38505a" strokeWidth=".7">
      <rect x="-110" y={r.barY-1.4} width="220" height="2.8" />
      <rect x="-110" y={r.barY-2.5} width="41" height="5" /><rect x="69" y={r.barY-2.5} width="41" height="5" />
    </g>
  </>;
}

export function ApartmentFloorPlan() {
  return <div className="af-simple">{LAYOUTS.map(layout => <section key={layout.id} aria-label={layout.title}>
    <h2>{layout.title}</h2>
    <svg viewBox={`-20 -25 ${ROOM.width+40} ${ROOM.depth+45}`} role="img" aria-label={`Plano ${layout.id.toUpperCase()} con rack, banca, barra y caucho`}>
      <defs><pattern id={`rubber-${layout.id}`} width="25" height="25" patternUnits="userSpaceOnUse"><rect width="25" height="25" fill="#cad4cf" /><path d="M25 0H0V25" fill="none" stroke="#b4c3ba" strokeWidth=".5" /></pattern></defs>
      <rect width={ROOM.width} height={ROOM.depth} fill="#fbfdfd" />
      <rect data-part="floor" x={layout.floorX} y={layout.floorY} width="200" height="200" fill={`url(#rubber-${layout.id})`} stroke="#6b8377" strokeWidth="1" />
      <path d={`M0 ${ROOM.doorY}V0H${ROOM.width}V${ROOM.depth}H0V${ROOM.doorY+ROOM.doorWidth}`} fill="none" stroke="#263f48" strokeWidth="5" />
      <path d={`M3 0H${ROOM.width-3}`} stroke="#73a8b8" strokeWidth="6" />
      <text x={ROOM.width/2} y="-10">Ventanal</text>
      <rect x="275" y="5" width="70" height="70" rx="2" fill="#d5e7ed" stroke="#456d7a" strokeWidth="1.5" /><text x="310" y="42">Refri</text>
      <rect x="210" y="190" width="140" height="57" fill="#e4d1aa" stroke="#8b7044" strokeWidth="1.5" /><text x="280" y="222">Isla</text>
      <g data-part="rack" transform={`translate(${layout.x} ${layout.y}) rotate(${layout.angle})`}><Rack /></g>
    </svg>
  </section>)}</div>;
}
