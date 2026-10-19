import React from 'react';
import './ApartmentFloorPlan.css';

/*
 * All SVG coordinates are centimetres; origin is the window's left corner.
 * User measurements: original main-area sketch 350 × ~300; left door y=210 (width 80
 * provisional). Island x=210, y=190, 140 × 57. Fridge 70 × 70, right gap 5;
 * window-to-fridge gap ≈70 (user estimate); island removed for remodel. Rubber floor: 200 × 200.
 *
 * Rack: https://sdmed.cl/productos/jaula-rack-ws-barbell-stack-rowing-sid-srhsrhd/
 * Photos: https://sdmed.cl/wp-content/uploads/2023/02/1-8.jpg
 * Side angle: https://sdmed.cl/wp-content/uploads/2023/02/4-8.jpg
 * Published 221.8 × 138.9 × 165.8, without axis labels. Provisional model:
 * width 165.8, depth 138.9, height 221.8. Rear horns ~25 per side, main post
 * centres ±54.4. Side-angle refinement: rear posts ~18 from back, main
 * posts ~55 from front foot tips; J-hook bar seat ~14 ahead of main posts,
 * safeties ~48 long. These are rounded visual estimates, not measured cotas.
 * The near base spans ~319 image pixels; rear-post-to-base-end gap ~40 px
 * suggests ~17–19 cm setback when scaled to provisional 138.9 cm depth.
 * Far-side base shows a similar relative setback. Perspective and peg
 * projection prevent exact reconstruction. Stored discs assume
 * Ø45 and ~20 stack thickness. Four storage levels overlap in top view.
 * Rear disc overhang is now max(0, 22.5 - 18) ≈4.5 cm, previously 12.5.
 * Lateral horn/stack lengths cannot be refined from this nearly end-on view.
 * The published empty-rack envelope remains unchanged; no double counting.
 *
 * Bench: https://sdmed.cl/productos/banco-doble-regulacion-y-soporte-serie-tts-tt1001/
 * Published 137 × 57; flat position not dimensioned. Pad/feet are illustrative.
 * Head end is 25 behind bar; bar length is 220. No ergonomic fit is inferred.
 * Rack placements preserved: A (125,105), 0°; B (75,130), 270°.
 * Rubber subsequently moved to(25,55) to include bike (see LAYOUTS).
 * B bar tips: y=20..240 (20 cm to window).
 * B assumed rear discs leave 75 - 51.45 - 22.5 ≈1.05 cm to left wall.
 * SID rear-post bench study (user request): J-hook seat assumed 14 cm
 * inward from rear post, barY=-51.45+14=-37.45; same head offset25.
 * Rear-post perforations/J-hook compatibility and crossmember/bench vertical
 * clearance are unverified. Dashed rear hooks are proposed, not supplied parts.
 * Existing front spotters remain drawn in their original locations: they do
 * NOT cover the proposed rear bar position. Interior protection is unresolved.
 * Bench longitudinal envelope: local -62.45..74.55; A room y42.55..179.55,
 * B room x12.55..149.55. Rear bench ends now lie outside shifted rubber.
 * This is a plan-space study, not a verified pressing setup or clearances.
 * Edit these constants/figures directly for the next iteration.
 */
/* New private depa2.png annotation (Drive reference only; image not published):
 * Green sink run: 53 wide × 88 long, immediately after island at y=190+57=247.
 * Cyan kitchen: 53 deep, starting at y=247+88=335, ending y=388.
 * Left passage clear-width note: 115; partition starts 13 before kitchen,
 * at y=322, and continues to bottom. Kitchen width 350-115=235 is derived.
 * The previous ~300 depth described the cropped main area, not this extension.
 * Bottom-left passage stays open; wall thickness/opening beyond view unknown.
 * Red cooktop position follows annotation; assumed 28×43 silhouette only.
 */
const ROOM = { width: 350, depth: 388, doorY: 210, doorWidth: 80 };
const KITCHEN = { passage: 115, sinkX: 297, sinkY: 247, sinkWidth: 53, sinkLength: 88, y: 335, depth: 53, partitionY: 322 };
// Remodel: user estimates 70 cm window-to-fridge; table spans y140..247 =107.
// Litter-box outline (60×45) and overhead platforms (30×25) are schematic,
// not supplied measurements. Dashed platforms stagger toward fridge; heights TBD.
// TV is a schematic 32-inch 16:9 panel (~71×40), seen edge-on on right wall.
// Its mounting height and cat-platform heights are not measured in this plan.
const FRIDGE = { x: 275, y: 70, width: 70, depth: 70 };
const TABLE = { width: 70 };
const RACK = { width: 165.8, depth: 138.9, postX: 54.4, rearY: -51.45, frontY: 14.45, barY: 28.45 };
/* Force USA MyRack Folding, US current F-MR-BASE-SPACESAVER-V2:
 * https://www.forceusa.com/products/myrack-folding-power-rack
 * https://force-manuals.nmg.io/F-MR-BASE-SPACESAVER-V2.pdf (steps1..5)
 * Official current page: W120×D140×H221 cm, interior depth74, posts60mm.
 * Rounded metric figures are used as listed, not converted to false precision.
 * Older/regional folding listings give different envelopes (e.g.124×105);
 * do not mix these revisions. Current-page overall depth is conservatively
 * retained as dashed footprint; manual supplies topology, not component cotas.
 * Four posts, rear crossmember, hinged upper/lower side links, front pivoting
 * feet and rear feet/bar-storage sleeves. No FTR stacks/pulleys/pegboard.
 * Post centres x±57, y±40 infer74 clear between6cm posts. Distribution within
 * the140 depth envelope and individual feet/sleeves/pivots are schematic.
 * Dashed top side links project above bottom links; not floor obstructions.
 * Rear-facing bench study: optional inward J-hooks seat12 ahead of rearpost,
 * barY=-28; head=-53, bench end84. Optional safety slings between posts are
 * illustrative only; no accessory included, exact part/mounting/height assumed.
 * C centre(125,75) and D(75,130) put rear envelope5 from window/left wall;
 * D bar tips remain20cm from window. Same bench/bar/rubber; no folded state,
 * folding sweep, certified bench clearance or stored-accessory footprint shown.
 */
const FOLDING = { width: 120, depth: 140, postX: 57, rearY: -40, frontY: 40, barY: -28 };
const BENCH = { width: 57, length: 137, headOffset: 25 };
// Rubber moved to x25..225,y55..255 in all four figures: covers bike
// x90..221,y200..253.5. Rear rack feet/parts now extend outside this200×200
// square; moving it cannot cover the full rack+bike longitudinal envelope.
const LAYOUTS = [
  { id: 'a', title: 'A · SID · Espalda al ventanal · Banca dentro*', floorX: 25, floorY: 55, x: 125, y: 105, angle: 0, model: 'sid' },
  { id: 'b', title: 'B · SID · Espalda a la pared de la puerta · Banca dentro*', floorX: 25, floorY: 55, x: 75, y: 130, angle: 270, model: 'sid' },
  { id: 'c', title: 'C · MyRack Folding · Espalda al ventanal', floorX: 25, floorY: 55, x: 125, y: 75, angle: 0, model: 'folding' },
  { id: 'd', title: 'D · MyRack Folding · Espalda a la pared de la puerta', floorX: 25, floorY: 55, x: 75, y: 130, angle: 270, model: 'folding' }
];

// Ultimate Fitness P900 Premium, product3386:
// https://ultimatefitness.cl/producto/bicicleta-spinning-magnetica-p900-premium?id=3386
// Published product dimensions131×53.5×1295 cm: final height appears mistyped;
// use only131 length×53.5 width for plan; no height inferred/corrected here.
// Shared trial: x90..221,y200..253.5, handlebar toward +x/right-wall TV.
// Front-to-table gap59; counter gap81.5; partition-top gap68.5. These are
// unoccupied footprint gaps, not measured mounting/pedalling clearances.
// Bike centre y226.75 is33.25 below TV centre193.5; not exactly head-on.
// Rear flywheel, frame, pedals, saddle/handlebar shapes schematic from listing.
const BIKE = { x: 90, y: 200, length: 131, width: 53.5 };

function Bike() {
  const b = BIKE, middle = b.width/2;
  return <g data-part="bike" transform={`translate(${b.x} ${b.y})`}>
    <rect data-part="bike-envelope" width={b.length} height={b.width} rx="3" fill="#d6e4e8" fillOpacity=".45" stroke="#6c8997" strokeDasharray="3 2" />
    {[8,121].map(x=><rect key={x} x={x} y="0" width="5" height={b.width} rx="2" fill="#536c79" />)}
    <rect x="22" y={middle-3} width="22" height="6" rx="2" fill="#839ca8" stroke="#4a6471" />
    <path d={`M10 ${middle}H124 M33 ${middle}L48 ${middle}L72 ${middle}H110`} fill="none" stroke="#647f8e" strokeWidth="6" strokeLinejoin="round" />
    <path d={`M72 ${middle-18}V${middle+18}`} stroke="#a8b6be" strokeWidth="2" />
    {[middle-20,middle+16].map(y=><rect key={y} x="65" y={y} width="14" height="4" rx="1" fill="#4a606c" />)}
    <path d={`M39 ${middle-6}Q45 ${middle-12} 58 ${middle-6}L56 ${middle+6}Q45 ${middle+12} 39 ${middle+6}Z`} fill="#536573" />
    <path d={`M102 7H114V${b.width-7}H102 M109 ${middle}H122`} fill="none" stroke="#405b6c" strokeWidth="3" strokeLinecap="round" />
    <rect x="114" y={middle-6} width="9" height="12" rx="1" fill="#91a7b5" stroke="#405b6c" />
    <text x="77" y={middle+5} style={{fontSize:6.5}}>P900</text>
    <Ruler x={0} y={b.width+12} length={b.length} label="Bici 131 cm" />
    <Ruler x={-9} y={b.width} length={b.width} label="53,5 cm" vertical />
    <Ruler x={b.length} y={10} length={59} label="59 cm a mesa" />
  </g>;
}

// Static dimension lines only; no editor state or measurement engine.
function Ruler({ x, y, length, label, vertical = false, at = 0.5, flip = false }: { x: number; y: number; length: number; label: string; vertical?: boolean; at?: number; flip?: boolean }) {
  return <g className="af-ruler" transform={`translate(${x} ${y})${vertical ? ' rotate(-90)' : ''}`}>
    <path d={`M0 0h${length} M0 -3v6 M${length} -3v6`} />
    <text x={length*at} y="-4" transform={flip ? `rotate(180 ${length*at} -4)` : undefined}>{label}</text>
  </g>;
}

function Rack({ turn }: { turn: number }) {
  const r = RACK;
  const insideBarY = r.rearY + 14;
  return <>
    <path d={`M${-r.postX} ${r.rearY}H${r.postX}`} stroke="#40545b" strokeWidth="5" />
    {[-1, 1].map(side => <g key={side}>
      <rect className="af-rack" x={side*r.postX-3.5} y={-r.depth/2+5} width="7" height={r.depth-5} />
      <rect className="af-rack" x={side*r.postX-5} y={r.depth/2-7} width="10" height="7" />
      <rect x={side < 0 ? -r.width/2 : r.postX} y={r.rearY-2.5} width="28.5" height="5" fill="#718489" />
      {[0, 1, 2].map(i => <rect key={i} x={side < 0 ? -r.width/2+3+i*6.5 : r.postX+4+i*6.5} y={r.rearY-22.5} width="6" height="45" rx="1" fill="#68716d" stroke="#dce4df" strokeWidth=".8" />)}
      <rect x={side*r.postX-3.5} y={r.frontY} width="7" height="48" fill="#819397" stroke="#344e57" strokeWidth="1" />
      {[r.rearY, r.frontY].map(y => <rect key={y} className="af-rack" x={side*r.postX-3.5} y={y-3.5} width="7" height="7" />)}
      <path data-part="proposed-rear-hook" d={`M${side*r.postX-4} ${r.rearY}v16h8v-4`} fill="none" stroke="#a7713d" strokeWidth="2.5" strokeDasharray="3 1" />
    </g>)}
    <BenchAndBar barY={insideBarY} turn={turn} />
    <text x="0" y={r.depth/2+34} style={{fontSize:6.5}} transform={turn === 270 ? `rotate(90 0 ${r.depth/2+34})` : undefined}>*Montaje interior por confirmar</text>
    <Ruler x={-r.postX+13} y={r.rearY} length={18} label="≈18 cm" vertical flip={turn === 270} />
    <Ruler x={-r.width/2} y={turn === 270 ? -r.depth/2+12 : -r.depth/2-18} length={r.width} label="Rack ≈165,8 cm" />
    <Ruler x={r.width/2+12} y={r.depth/2} length={r.depth} label="≈138,9 cm" vertical flip={turn === 270} />
  </>;
}

function BenchAndBar({ barY, turn }: { barY: number; turn: number }) {
  const head = barY - BENCH.headOffset;
  return <>
    <g data-part="bench">
      {[head+15, head+122].map(y => <rect key={y} x={-BENCH.width/2} y={y} width={BENCH.width} height="7" rx="1" fill="#786260" />)}
      <rect x="-3" y={head+15} width="6" height="114" fill="#786260" />
      <rect x="-15" y={head+2} width="30" height="83" rx="5" fill="#b48073" stroke="#714f49" />
      <rect x="-14" y={head+89} width="28" height="29" rx="4" fill="#bc8f83" stroke="#714f49" />
    </g>
    <g data-part="bar" fill="#bdcbd0" stroke="#38505a" strokeWidth=".7">
      <rect x="-110" y={barY-1.4} width="220" height="2.8" />
      <rect x="-110" y={barY-2.5} width="41" height="5" /><rect x="69" y={barY-2.5} width="41" height="5" />
    </g>
    <Ruler x={-110} y={barY-8} length={220} label="Barra 220 cm" at={0.16} />
    <Ruler x={BENCH.width/2+8} y={head+BENCH.length} length={BENCH.length} label="Banca 137 cm" vertical flip={turn === 270} />
    <Ruler x={-BENCH.width/2} y={head+BENCH.length+10} length={BENCH.width} label="57 cm" />
  </>;
}

function FoldingRack({ turn }: { turn: number }) {
  const r = FOLDING;
  return <g data-model="folding">
    <rect data-part="rack-envelope" x={-r.width/2} y={-r.depth/2} width={r.width} height={r.depth} fill="none" stroke="#78939f" strokeWidth=".7" strokeDasharray="3 3" />
    <path d={`M${-r.postX} ${r.rearY}H${r.postX}`} stroke="#40545b" strokeWidth="6" />
    {[-1,1].map(side => <g key={side}>
      {[r.rearY,r.frontY].map(y=><g key={y}>
        <rect data-part="folding-foot" x={side*r.postX-3} y={y < 0 ? -70 : 30} width="6" height="40" rx="1" fill="#70848c" stroke="#40545b" />
        <rect data-part="folding-post" className="af-rack" x={side*r.postX-3} y={y-3} width="6" height="6" />
      </g>)}
      <g data-part="hinged-links">
        <path d={`M${side*r.postX} ${r.rearY}V${r.frontY}`} stroke="#4b646e" strokeWidth="4" />
        <path d={`M${side*(r.postX-7)} ${r.rearY}V${r.frontY}`} stroke="#7c939d" strokeWidth="2" strokeDasharray="3 2" />
        {[r.rearY,r.frontY].map(y=><circle key={y} cx={side*r.postX} cy={y} r="2" fill="#c5d4da" stroke="#40545b" strokeWidth=".6" />)}
      </g>
      <circle data-part="bar-storage-sleeve" cx={side*(r.postX-7)} cy={r.rearY-8} r="3" fill="#b4c6cd" stroke="#40545b" />
      <path data-part="optional-safety-sling" d={`M${side*(r.postX-4)} ${r.rearY}Q${side*(r.postX-10)} 0 ${side*(r.postX-4)} ${r.frontY}`} fill="none" stroke="#a18b6f" strokeWidth="2" strokeDasharray="3 2" />
      <path data-part="folding-hook" d={`M${side*r.postX-4} ${r.rearY}v14h8v-4`} fill="none" stroke="#a7713d" strokeWidth="2.5" />
    </g>)}
    <BenchAndBar barY={r.barY} turn={turn} />
    <Ruler x={-r.width/2} y={-r.depth/2+12} length={r.width} label="MyRack ≈120 cm" />
    <Ruler x={r.width/2+13} y={r.depth/2} length={r.depth} label="Abierto ≈140 cm" vertical flip={turn === 270} />
    <Ruler x={-r.postX+19} y={r.frontY-3} length={74} label="Interior 74 cm" vertical flip={turn === 270} />
  </g>;
}

function Kitchen() {
  const k = KITCHEN;
  return <g data-part="kitchen">
    <rect data-part="sink-run" x={k.sinkX} y={k.sinkY} width={k.sinkWidth} height={k.sinkLength} fill="#d1e7d5" stroke="#509265" strokeWidth="1.3" />
    <rect x={k.sinkX+7} y={k.sinkY+24} width="39" height="46" rx="5" fill="#e9f4eb" stroke="#72a782" />
    <circle cx={k.sinkX+26.5} cy={k.sinkY+47} r="2" fill="#72a782" />
    {[8,12,16].map(y=><path key={y} d={`M${k.sinkX+8} ${k.sinkY+y}h37`} stroke="#8cb698" strokeWidth=".8" />)}
    <text x={k.sinkX+k.sinkWidth/2} y={k.y-7} style={{fontSize:7}}>Lavaplatos</text>
    <rect data-part="kitchen-counter" x={k.passage} y={k.y} width={ROOM.width-k.passage} height={k.depth} fill="#d1eaf1" stroke="#67a5b8" strokeWidth="1.3" />
    <text x="195" y={k.y+30}>Cocina</text>
    <rect data-part="cooktop" x="262" y={k.y+3} width="28" height="43" rx="2" fill="#f1cecb" stroke="#c46f68" strokeWidth="1" />
    {[270,282].flatMap(x=>[k.y+14,k.y+34].map(y=><circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill="none" stroke="#b3625c" strokeWidth=".8" />))}
  </g>;
}

function Remodel() {
  const start = FRIDGE.y + FRIDGE.depth;
  const length = KITCHEN.sinkY - start;
  const screenY = start + (length-71)/2;
  return <g data-part="remodel">
    <g data-part="cat-zone">
      <rect data-part="litter-box" x="280" y="12" width="60" height="45" rx="7" fill="#ece2da" stroke="#a18b7e" />
      <text x="310" y="38" style={{fontSize:7}}>Arenero*</text>
      <g data-part="cat-platforms" fill="#c4b0da" fillOpacity=".35" stroke="#9474b2" strokeDasharray="3 2">
        <rect x="275" y="4" width="30" height="25" rx="2" />
        <rect x="310" y="40" width="30" height="25" rx="2" />
        <path d="M290 16L325 52L325 85" fill="none" />
      </g>
      <text x="251" y="33" style={{fontSize:6.5}} transform="rotate(-90 251 33)">2 peldaños arriba*</text>
      <Ruler x={363} y={FRIDGE.y} length={FRIDGE.y} label="≈70 cm" vertical />
    </g>
    <rect data-part="table" x={ROOM.width-TABLE.width} y={start} width={TABLE.width} height={length} fill="#e4d1aa" stroke="#8b7044" strokeWidth="1.5" />
    <text x={ROOM.width-TABLE.width/2} y={start+length/2+18}>Mesa</text>
    <g data-part="tv" stroke="#647381" strokeWidth="1">
      <path d={`M350 ${screenY+35.5}h-8`} />
      <rect x="340" y={screenY} width="3" height="71" rx="1" fill="#5b6c7a" />
      <text x="329" y={screenY+35.5} stroke="none" transform={`rotate(-90 329 ${screenY+35.5})`}>TV 32″ · sobre mesa</text>
    </g>
    <rect data-part="fridge" x={FRIDGE.x} y={FRIDGE.y} width={FRIDGE.width} height={FRIDGE.depth} rx="2" fill="#d5e7ed" stroke="#456d7a" strokeWidth="1.5" />
    <text x={FRIDGE.x+FRIDGE.width/2} y={FRIDGE.y+40}>Refri</text>
    <Ruler x={ROOM.width-TABLE.width} y={start+length-12} length={TABLE.width} label="70 cm" />
    <Ruler x={363} y={KITCHEN.sinkY} length={length} label={`Mesa ≈${length} cm`} vertical />
    <Ruler x={FRIDGE.x} y={FRIDGE.y+FRIDGE.depth+10} length={FRIDGE.width} label="70 cm" />
    <Ruler x={363} y={FRIDGE.y+FRIDGE.depth} length={FRIDGE.depth} label="70 cm" vertical />
  </g>;
}

export function ApartmentFloorPlan() {
  return <div className="af-simple">{LAYOUTS.map(layout => <section key={layout.id} aria-label={layout.title}>
    <h2>{layout.title}</h2>
    <svg viewBox={`-45 -45 ${ROOM.width+90} ${ROOM.depth+75}`} role="img" aria-label={`Plano ${layout.id.toUpperCase()} con rack, banca, barra, caucho y cocina en L`}>
      <defs><pattern id={`rubber-${layout.id}`} width="25" height="25" patternUnits="userSpaceOnUse"><rect width="25" height="25" fill="#cad4cf" /><path d="M25 0H0V25" fill="none" stroke="#b4c3ba" strokeWidth=".5" /></pattern></defs>
      <rect width={ROOM.width} height={ROOM.depth} fill="#fbfdfd" />
      <rect data-part="floor" x={layout.floorX} y={layout.floorY} width="200" height="200" fill={`url(#rubber-${layout.id})`} stroke="#6b8377" strokeWidth="1" />
      <Kitchen />
      <path d={`M0 ${ROOM.doorY}V0H${ROOM.width}V${ROOM.depth}H${KITCHEN.passage}V${KITCHEN.partitionY} M0 ${ROOM.doorY+ROOM.doorWidth}V${ROOM.depth}`} fill="none" stroke="#263f48" strokeWidth="5" />
      <path d={`M3 0H${ROOM.width-3}`} stroke="#73a8b8" strokeWidth="6" />
      <text x={ROOM.width/2} y="-10">Ventanal</text>
      <Remodel />
      <Bike />
      <Ruler x={0} y={-31} length={ROOM.width} label="350 cm" />
      <Ruler x={-32} y={ROOM.depth} length={ROOM.depth} label="≈388 cm" vertical />
      <Ruler x={-14} y={ROOM.doorY} length={ROOM.doorY} label="210 cm hasta puerta" vertical />
      <Ruler x={-14} y={ROOM.doorY+ROOM.doorWidth} length={ROOM.doorWidth} label="≈80 cm" vertical />
      <Ruler x={0} y={358} length={KITCHEN.passage} label="Paso 115 cm" />
      <Ruler x={KITCHEN.passage+13} y={KITCHEN.y} length={13} label="13 cm" vertical />
      <Ruler x={KITCHEN.sinkX} y={KITCHEN.y-13} length={KITCHEN.sinkWidth} label="53 cm" />
      <Ruler x={363} y={KITCHEN.y} length={KITCHEN.sinkLength} label="88 cm" vertical />
      <Ruler x={363} y={ROOM.depth} length={KITCHEN.depth} label="53 cm" vertical />
      <Ruler x={KITCHEN.passage} y={ROOM.depth+13} length={ROOM.width-KITCHEN.passage} label="Cocina 235 cm" />
      <Ruler x={layout.floorX} y={280} length={200} label="Caucho 200 × 200 cm" />
      {layout.angle === 270 && <Ruler x={layout.x+(layout.model === 'folding' ? FOLDING.barY : RACK.barY)+10} y={20} length={20} label="20 cm" vertical />}
      <g data-part="rack" transform={`translate(${layout.x} ${layout.y}) rotate(${layout.angle})`}>{layout.model === 'folding' ? <FoldingRack turn={layout.angle} /> : <Rack turn={layout.angle} />}</g>
    </svg>
  </section>)}</div>;
}
