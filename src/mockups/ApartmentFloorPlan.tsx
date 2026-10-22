import React from 'react';
import './ApartmentFloorPlan.css';

/*
 * Current dimensions, sources, layout modes, cuts and pending measurements:
 * docs/apartment-floor-plan.md (update it when changing these figures).
 * All SVG coordinates are centimetres; origin is the window's left corner.
 * User measurements: original main-area sketch 350 × ~300; left door y=210 (width 80
 * provisional). Island x=210, y=190, 140 × 57. Fridge 70 × 70, right gap 5;
 * window-to-fridge gap ≈70 (user estimate); island removed for remodel. Rubber: three100×100 tiles; current cuts below.
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
 * Head end is 25 behind bar; SID bar length is 220. No ergonomic fit is inferred.
 * Rack placements preserved: A (125,105), 0°; B (75,130), 270°.
 * Current rubber: fixed140×150, shared V1 and V2 (see CUT_TILES).
 * B bar tips: y=20..240 (20 cm to window).
 * B assumed rear discs leave 75 - 51.45 - 22.5 ≈1.05 cm to left wall.
 * SID rear-post bench study (user request): J-hook seat assumed 14 cm
 * inward from rear post, barY=-51.45+14=-37.45; same head offset25.
 * Rear-post perforations/J-hook compatibility and crossmember/bench vertical
 * clearance are unverified. Dashed rear hooks are proposed, not supplied parts.
 * Existing front spotters remain drawn in their original locations: they do
 * NOT cover the proposed rear bar position. Interior protection is unresolved.
 * Bench longitudinal envelope: local -62.45..74.55; A room y42.55..179.55,
 * B room x12.55..149.55. Main rubber piece covers bench supports.
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
export const RACK = { width: 165.8, depth: 138.9, postX: 54.4, rearY: -51.45, frontY: 14.45, barY: 28.45 };
/* Force USA G3 V1: https://force-manuals.nmg.io/F-G3-B.pdf
 * PDF p7: 203 W × 142 D × 219.5 H cm assembled. Main frame ≈122 W per user.
 * PDF p17–19: Smith rollers23/24 run on ROUND guides38 behind the front
 * cable-trolley uprights6. Intermediate posts7 carry cable plate loaders8.
 * Parts97 (Ø50×33.5) are SMITH SLEEVES fitted to bar42, not rear storage!
 * Rear storage: six rods15 (24.5) with sleeves51 (21), three heights per side.
 * Side elevation scaled against142 D gives these rounded PLAN estimates:
 * rear storage tip−71, rear post2−50, Smith guide38−9, intermediate7+7,
 * front post6+27, front safety tip+71. Smith is≈36 behind front uprights.
 * The 44cm front arms are user-confirmed and INCLUDED in142, not added to it.
 * Two long ground rails, rear bent connecting member, overhead side beams and
 * front pull-up member follow assembly topology. Dashed beams are overhead.
 * Exact post/rail offsets, 8cm front J-hook seat and 15cm rear loading access
 * are estimates. Draw Ø45 stored discs edge-on with an assumed12cm stack.
 * Free bar200 sits on FRONT J-hooks at+35. Solid TT1001 bench137×57 uses
 * head25 behind bar: local10..147. Dashed alternate bench under Smith−9:
 * local−34..103. These are alternative positions for ONE bench, not two benches.
 * Free bench local10..147 is covered by fixed mat−75..75 plus detachable
 * shared V1 extension75..175. Its joint at75 is between feet25..32 and132..139.
 * Smith alternate local−34..103 is an alternative placement, not a second bench.
 * This is horizontal placement only; bar-to-chest/head offset and clearances
 * depend on the actual person, bench adjustment and equipment heights.
 */
const G3 = {
  width: 122, depth: 142, smithWidth: 203, postX: 58.5,
  rearPostY: -50, smithY: -9, intermediateY: 7, frontPostY: 27,
  rearY: -71, frontY: 71, spotter: 44, rearGap: 15, freeBarY: 35
};
const BENCH = { width: 57, length: 137, headOffset: 25 };
// User's200cm free-bar trial applies only to G3; Smith stays203 and SID220.
// Total length alone does not establish rackability: exact between-sleeve
// span is unknown. Shaft/sleeve partition below remains a schematic138cm.
const G3_FREE_BAR = 200;
// Three nominal100×100 tiles; no blade loss or puzzle-edge allowance assumed.
// Base140×150: R1 100×100, R2 40×100, R3 100×50, R4 40×50.
// Keep the old left edge: widening R2/R4 adds5cm on the right only.
// Entire P2 remainder V1=60×100; entire P3 remainder V2=60×50.
// V1 alone extends bench60×100; rotated V1+V2 make bike150×60.
// Each room configuration uses V1 once. Total30000cm², nominal scraps0.
const RUBBER_COLOR = { rack: '#cad4cf', bike: '#bdd9e1' };
const RACK_FLOOR_PARTS = [
  { id: 'R3', x: 0, y: 0, w: 100, h: 50 },
  { id: 'R4', x: 100, y: 0, w: 40, h: 50 },
  { id: 'R1', x: 0, y: 50, w: 100, h: 100 },
  { id: 'R2', x: 100, y: 50, w: 40, h: 100 }
];
const CUT_TILES = [
  [{ id: 'R1', use: 'rack', x: 0, y: 0, w: 100, h: 100 }],
  [{ id: 'R2', use: 'rack', x: 0, y: 0, w: 40, h: 100 },
   { id: 'V1', use: 'bike', x: 40, y: 0, w: 60, h: 100 }],
  [{ id: 'R3', use: 'rack', x: 0, y: 0, w: 100, h: 50 },
   { id: 'R4', use: 'rack', x: 0, y: 50, w: 40, h: 50 },
   { id: 'V2', use: 'bike', x: 40, y: 50, w: 60, h: 50 }]
] as const;
const LAYOUTS = [
  { id: 'a', title: 'A · SID · Espalda al ventanal · Banca dentro*', floorX: 57.5, floorW: 140, x: 125, y: 105, angle: 0, model: 'sid' },
  { id: 'b', title: 'B · SID · Espalda a la pared de la puerta · Banca dentro*', floorX: 0, floorW: 150, x: 75, y: 130, angle: 270, model: 'sid' },
  // Static Smith-tip/wall gap10; this does not certify plate-loading access.
  { id: 'c', title: 'C · Force USA G3 V1 · Espalda al ventanal', floorX: 44, floorW: 140, x: 111.5, y: 86, angle: 0, model: 'g3' },
  // Smith203 limits window approach:20+203/2=121.5,8.5 closer than before.
  { id: 'd', title: 'D · Force USA G3 V1 · Espalda a la pared de la puerta', floorX: 11, floorW: 150, x: 86, y: 121.5, angle: 270, model: 'g3' }
];
// P900 footprint131×53.5 from the provided Ultimate Fitness listing.
// Ordinary bike body x90,y272.25; mat x88,y269 is150×60.
// Bench V1 extension C ends y261:8cm to bike-mat location. Mat ends329,
// 6cm before kitchen335. V1 is under bench OR bike, never both at once.
// Only footprint fit is shown; occupied mounting/pedalling access is unmeasured.
const BIKE = { x: 90, y: 272.25, length: 131, width: 53.5 };
type StorageMode = 'exercise' | 'bench-stored' | 'all-stored';
// G3 storage is a plan study, not a folding/vertical-storage claim. Bench stays
// 137×57, horizontal, head−54..tail83; feet−39..−32 and68..75 stay on fixed mat.
// Rear brace/bench vertical clearance must be checked on the real equipment.
// Bike C rotates90° at(263.5,40): body x210..263.5,y40..171; its mat is60×150.
// Bike D parks at(90,215): body x90..221,y215..268.5, beyond door's assumed80.
// Bodies clear fixed rails, loader horns, stored discs and fridge in plan.
// G3 bars stay203/200 wide at the same local axes, dashed when elevated.
// P900 listing still says height1295cm (apparent typo): no height clearance is
// derived. Confirm raised bars clear saddle/handlebar and any mounted tablet.
const STORED_BENCH_HEAD = -54;

function ModularFloor({ extension, turn }: { extension: boolean; turn: number }) {
  return <g data-part="modular-floor">
    <rect data-part="floor" x="-67.5" y="-75" width="140" height="150" fill={RUBBER_COLOR.rack} stroke="#6b8377" strokeWidth="1" />
    <path data-part="rack-floor-seams" d="M32.5 -75V75 M-67.5 -25H72.5" fill="none" stroke="#9eafa4" strokeWidth=".7" />
    {extension && <>
      <rect data-part="bench-floor" data-piece="V1" x="-30" y="75" width="60" height="100" fill={RUBBER_COLOR.bike} fillOpacity=".75" stroke="#a17f49" strokeWidth="1" strokeDasharray="4 2" />
      <text x="-36" y="125" transform={`rotate(${turn === 270 ? 90 : -90} -36 125)`} style={{fontSize:6.5}}>V1 · 60 × 100</text>
    </>}
  </g>;
}

function Bike({ parking, mat = true }: { parking?: number; mat?: boolean } = {}) {
  const b = BIKE, middle = b.width/2;
  const pose = parking === 0 ? { x: 263.5, y: 40, angle: 90 }
    : parking === 270 ? { x: 90, y: 215, angle: 0 }
    : { x: b.x, y: b.y, angle: 0 };
  return <g data-part="bike-zone" data-parking={parking === undefined ? 'use' : 'stored'} transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle})`}>
    {mat && <g data-part="bike-rubber">
    <rect data-part="bike-floor" x="-2" y="-3.25" width="150" height="60" fill={RUBBER_COLOR.bike} fillOpacity=".7" stroke="#648b99" strokeWidth="1" strokeDasharray="4 2" />
    <path data-part="bike-floor-seam" d="M98 -3.25v60" stroke="#7ba0ac" strokeWidth=".8" />
    <Ruler x={-2} y={62.75} length={150} label="V1 + V2 · 150 × 60" />
    <Ruler x={155} y={56.75} length={60} label="60 cm" vertical />
    </g>}
    <g data-part="bike">
      <rect data-part="bike-envelope" width={b.length} height={b.width} rx="3" fill="none" stroke="#6c8997" strokeWidth=".7" strokeDasharray="3 2" />
      {[8,121].map(x=><rect key={x} data-part="bike-foot" x={x} y="0" width="5" height={b.width} rx="2" fill="#536c79" />)}
      <path d={`M10 ${middle}H124 M72 ${middle-17}V${middle+17}`} fill="none" stroke="#647f8e" strokeWidth="4" />
      {[middle-19,middle+15].map(y=><rect key={y} x="65" y={y} width="14" height="4" rx="1" fill="#4a606c" />)}
      <path d={`M38 ${middle-6}Q45 ${middle-12}58 ${middle-6}L56 ${middle+6}Q45 ${middle+12}38 ${middle+6}Z`} fill="#536573" />
      <path d={`M103 7h12v${b.width-14}h-12`} fill="none" stroke="#405b6c" strokeWidth="3" />
      <text x="78" y="10" style={{fontSize:6}}>P900 · 131 × 53,5</text>
    </g>
  </g>;
}

// Static dimension lines only; no editor state or measurement engine.
export function Ruler({ x, y, length, label, vertical = false, at = 0.5, flip = false }: { x: number; y: number; length: number; label: string; vertical?: boolean; at?: number; flip?: boolean }) {
  return <g className="af-ruler" transform={`translate(${x} ${y})${vertical ? ' rotate(-90)' : ''}`}>
    <path d={`M0 0h${length} M0 -3v6 M${length} -3v6`} />
    <text x={length*at} y="-4" transform={flip ? `rotate(180 ${length*at} -4)` : undefined}>{label}</text>
  </g>;
}

export function Rack({ turn, showBench = true, widthRulerY }: { turn: number; showBench?: boolean; widthRulerY?: number }) {
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
    <BenchAndBar barY={insideBarY} turn={turn} showBench={showBench} />
    {showBench && <text x="0" y={r.depth/2+34} style={{fontSize:6.5}} transform={turn === 270 ? `rotate(90 0 ${r.depth/2+34})` : undefined}>*Montaje interior por confirmar</text>}
    <Ruler x={-r.postX+13} y={r.rearY} length={18} label="≈18 cm" vertical flip={turn === 270} />
    <Ruler x={-r.width/2} y={widthRulerY ?? (turn === 270 ? -r.depth/2+12 : -r.depth/2-18)} length={r.width} label="Rack ≈165,8 cm" />
    <Ruler x={r.width/2+12} y={r.depth/2} length={r.depth} label="≈138,9 cm" vertical flip={turn === 270} />
  </>;
}

function BenchAndBar({ barY, turn, stored = false, raised = false, barLength = 220, showBench = true }: { barY: number; turn: number; stored?: boolean; raised?: boolean; barLength?: number; showBench?: boolean }) {
  const head = stored ? STORED_BENCH_HEAD : barY - BENCH.headOffset;
  return <>
    {showBench && <g data-part="bench" data-stored={stored}>
      {[head+15, head+122].map(y => <rect key={y} x={-BENCH.width/2} y={y} width={BENCH.width} height="7" rx="1" fill="#786260" />)}
      <rect x="-3" y={head+15} width="6" height="114" fill="#786260" />
      <rect x="-15" y={head+2} width="30" height="83" rx="5" fill="#b48073" stroke="#714f49" />
      <rect x="-14" y={head+89} width="28" height="29" rx="4" fill="#bc8f83" stroke="#714f49" />
    </g>}
    <g data-part="bar" data-elevated={raised} className={raised ? 'af-raised-bar' : undefined} fill="#bdcbd0" stroke="#38505a" strokeWidth=".7">
      <rect x={-barLength/2} y={barY-1.4} width={barLength} height="2.8" />
      <rect x={-barLength/2} y={barY-2.5} width={(barLength-138)/2} height="5" /><rect x="69" y={barY-2.5} width={(barLength-138)/2} height="5" />
    </g>
    <Ruler x={-barLength/2} y={barY-8} length={barLength} label={`Barra ${barLength} cm${raised ? ' ↑' : ''}`} at={0.16} />
    {showBench && <>
      <Ruler x={BENCH.width/2+8} y={head+BENCH.length} length={BENCH.length} label="Banca 137 cm" vertical flip={turn === 270} />
      <Ruler x={-BENCH.width/2} y={head+BENCH.length+(stored ? 3 : 10)} length={BENCH.width} label="57 cm" />
    </>}
  </>;
}

function G3Rack({ turn, benchStored = false, bikeStored = false }: { turn: number; benchStored?: boolean; bikeStored?: boolean }) {
  const r = G3;
  const smithHead = r.smithY - BENCH.headOffset;
  const freeHead = benchStored ? STORED_BENCH_HEAD : r.freeBarY - BENCH.headOffset;
  return <g data-model="g3-v1">
    <rect data-part="g3-envelope" x={-r.smithWidth/2} y={r.rearY} width={r.smithWidth} height={r.depth} fill="none" stroke="#78939f" strokeWidth=".6" strokeDasharray="3 3" />
    <rect data-part="rear-disc-clearance" x="-81" y={r.rearY-r.rearGap} width="162" height={r.rearGap} fill="#d8c8aa" fillOpacity=".2" stroke="#a48a60" strokeWidth=".6" strokeDasharray="2 2" />
    {/* Rear connecting frame only: no floor crossbar closing the front opening. */}
    <path data-part="rear-crossmember" d={`M${-r.postX} ${r.rearPostY}l13 -6h${2*r.postX-26}l13 6`} fill="none" stroke="#485a60" strokeWidth="5" />
    {[-1,1].map(side => <g key={side}>
      <rect data-part="base-rail" className="af-rack" x={side*r.postX-3.5} y={r.rearY} width="7" height={r.depth-2} rx="2" />
      {[r.rearY, r.frontY-7].map(y => <rect key={y} data-part="base-foot" x={side*r.postX-5} y={y} width="10" height="5" rx="1" fill="#53676e" />)}
      <path data-part="overhead-side-frame" d={`M${side*r.postX} ${r.rearPostY}V${r.frontPostY}`} fill="none" stroke="#809397" strokeWidth="2" strokeDasharray="4 3" />
      {[r.rearPostY, r.frontPostY].map(y => <rect key={y} data-part={y === r.rearPostY ? 'rear-post' : 'front-cable-post'} className="af-rack" x={side*r.postX-2.5} y={y-2.5} width="5" height="5" />)}
      <rect data-part="intermediate-loader-post" x={side*r.postX-2.5} y={r.intermediateY-2.5} width="5" height="5" fill="#83939a" stroke="#40545b" strokeWidth=".7" />
      <path data-part="cable-loader-horn" d={`M${side*r.postX} ${r.intermediateY}h${side*20}`} stroke="#84969c" strokeWidth="3" />
      <rect data-part="smith-slider" x={side*r.postX-4} y={r.smithY-5} width="8" height="10" rx="1" fill="#a9c5cb" stroke="#316a77" strokeWidth="1" />
      <circle data-part="smith-guide-38" cx={side*r.postX} cy={r.smithY} r="1.3" fill="#e4f3f4" stroke="#316a77" strokeWidth=".7" />
      <rect data-part="spotter-arm" x={side*r.postX-3} y={r.frontPostY} width="6" height={r.spotter} rx="1" fill="#84969a" stroke="#40545b" strokeWidth=".8" />
      <path data-part="rear-plate-horn" d={`M${side*r.postX} ${r.rearPostY}V${r.rearY}`} stroke="#9c8060" strokeWidth="2.5" />
      <g data-part="stored-discs" fill="#bcb8ad" stroke="#827b6e" strokeWidth=".6">
        <rect x={side*r.postX-22.5} y={r.rearY+4} width="45" height="12" rx="1" />
        {[7,10,13].map(d => <path key={d} d={`M${side*r.postX-22.5} ${r.rearY+d}h45`} />)}
      </g>
      <path data-part="front-j-hook" d={`M${side*r.postX-4} ${r.frontPostY}v10h8v-4`} fill="none" stroke="#a7713d" strokeWidth="2.5" />
    </g>)}
    <path data-part="overhead-pullup-bar" d={`M${-r.postX} ${r.frontPostY}H${r.postX}`} stroke="#809397" strokeWidth="2" strokeDasharray="4 3" />
    {/* One bench, two alternative placements: solid=free bar; dashed=Smith. */}
    {!benchStored && <g data-part="smith-bench-alternative" fill="none" stroke="#39818a" strokeWidth="1" strokeDasharray="4 3">
      <rect x={-BENCH.width/2} y={smithHead} width={BENCH.width} height={BENCH.length} rx="3" />
      <rect x="-15" y={smithHead+2} width="30" height="83" rx="5" />
    </g>}
    <rect data-part="free-bench-envelope" x={-BENCH.width/2} y={freeHead} width={BENCH.width} height={BENCH.length} rx="3" fill="none" stroke="#b48073" strokeWidth=".6" />
    <BenchAndBar barY={r.freeBarY} turn={turn} stored={benchStored} raised={bikeStored} barLength={G3_FREE_BAR} />
    {/* Smith bar42 and its sleeves97 sit on guides38, behind the front posts6. */}
    <g data-part="smith-bar" data-elevated={bikeStored} className={bikeStored ? 'af-raised-bar' : undefined} fill="#6698a4" stroke="#316a77" strokeWidth=".7">
      <rect x={-r.smithWidth/2} y={r.smithY-1.4} width={r.smithWidth} height="2.8" />
      <rect x={-r.smithWidth/2} y={r.smithY-2.5} width="33.5" height="5" />
      <rect x="68" y={r.smithY-2.5} width="33.5" height="5" />
    </g>
    <Ruler x={-r.width/2} y={r.rearPostY+12} length={r.width} label="Bastidor ≈122 cm" />
    <Ruler x={-r.smithWidth/2} y={r.smithY-8} length={r.smithWidth} label={bikeStored ? 'Smith 203 cm ↑' : 'Smith 203 cm'} at={.17} />
    <Ruler x={bikeStored && turn === 0 ? -r.smithWidth/2-12 : r.smithWidth/2+12} y={r.frontY} length={r.depth} label="Equipo 142 cm" vertical flip={turn === 270} />
    <Ruler x={-92} y={r.rearY} length={r.rearGap} label="15 cm carga" vertical flip={turn === 270} />
    <Ruler x={r.width/2+8} y={r.frontY} length={r.spotter} label="Spotter 44 cm" vertical flip={turn === 270} />
    <Ruler x={-r.width/2-8} y={r.frontPostY} length={r.frontPostY-r.smithY} label="Smith ≈36 cm atrás" vertical flip={turn === 270} />
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

// IKEA GLOSTAD50489012: published121 W ×78 D cm, facing +x.
// https://www.ikea.com/cl/es/p/glostad-sofa-2-cuerpos-knisa-gris-oscuro-50489012/
// Keep previous back/top anchor90,175: bounds90..168,175..296.
// Gap39 to kitchen335 is narrow;112 to table280,6 to stored bench tail169.
// Assumed seated eye(120,235.5) to TV(341.5,193.5):~2.25m,~11° off-axis.
// Upholstery and cushions schematic; only the outer footprint is published.
function Sofa() {
  return <g data-part="sofa">
    <rect data-part="sofa-envelope" x="90" y="175" width="78" height="121" rx="4" fill="#b9c0c3" stroke="#596a70" strokeWidth="1" />
    {[179,237].map(y=><rect key={y} x="111" y={y} width="54" height="55" rx="4" fill="#d7dcde" stroke="#87969c" strokeWidth=".7" />)}
    <rect x="92" y="179" width="12" height="113" rx="3" fill="#95a2a8" />
    {[175,292.5].map(y=><rect key={y} x="99" y={y} width="67" height="3.5" rx="1.5" fill="#95a2a8" />)}
    <text x="137" y="204" style={{fontSize:7}}>GLOSTAD</text>
    <text x="137" y="215" style={{fontSize:6.5}}>121 × 78 cm</text>
    <path d="M168 235.5h9l-3 -3m3 3l-3 3" fill="none" stroke="#596a70" strokeWidth="1" />
    <Ruler x={168} y={250} length={112} label="112 cm hasta mesa" />
    <Ruler x={215} y={335} length={39} label="39 cm · cocina · estrecho" vertical />
  </g>;
}

// Fridge front assumed atx275; confirmed right hinge when facing fridge maps
// to lower-plan corner(275,140). Hypothetical70cm door reaches(205,140) at90°.
// Real leaf width/hinge offset/handle and equipment heights are unknown.
// Free-bar tip(211.5,121) lies inside this sector; Smith tip(213,77) does not.
// The parked bike also enters the sector. Show geometry, not certified opening.
function FridgeClearance({ rackX }: { rackX: number }) {
  const smithLeft = rackX-G3.smithWidth/2, smithRight = rackX+G3.smithWidth/2;
  const freeRight = rackX+G3_FREE_BAR/2;
  const hingeY = FRIDGE.y+FRIDGE.depth;
  return <g data-part="fridge-clearance">
    <path data-part="fridge-door-sweep" d={`M${FRIDGE.x} ${hingeY}V${FRIDGE.y}A70 70 0 0 0 ${FRIDGE.x-70} ${hingeY}Z`} fill="#d4a86a" fillOpacity=".12" stroke="#b28a50" strokeWidth=".8" strokeDasharray="3 2" />
    <path data-part="fridge-door-open" d={`M${FRIDGE.x} ${hingeY}h-70`} stroke="#a77c43" strokeWidth="2" />
    <circle data-part="fridge-hinge" cx={FRIDGE.x} cy={hingeY} r="1.8" fill="#a77c43" />
    <text x="242" y="151" style={{fontSize:6}}>90° · puerta ≈70*</text>
    <Ruler x={0} y={65} length={smithLeft} label={`${smithLeft} cm`} />
    <path d={`M${smithLeft} 65V77 M${smithRight} 65V77 M${FRIDGE.x} 65V77 M${freeRight} 121v12`} fill="none" stroke="#69818a" strokeWidth=".5" />
    <Ruler x={smithRight} y={65} length={FRIDGE.x-smithRight} label={`${FRIDGE.x-smithRight} cm · Smith/refri`} />
    <Ruler x={freeRight} y={133} length={FRIDGE.x-freeRight} label="63,5 cm · barra/refri" />
  </g>;
}

export function ApartmentFloorPlan() {
  const [mode, setMode] = React.useState<StorageMode>('bench-stored');
  const [showBike, setShowBike] = React.useState(false);
  return <div className="af-simple">{LAYOUTS.map((layout,index) => {
    const benchStored = layout.model === 'g3' && mode !== 'exercise';
    const bikeVisible = layout.model !== 'g3' || showBike;
    const bikeStored = bikeVisible && layout.model === 'g3' && mode === 'all-stored';
    const sofaVisible = layout.id === 'c' && benchStored && !bikeVisible;
    return <React.Fragment key={layout.id}>
    {index === 2 && <div className="af-mode-controls" data-part="storage-controls">
      <label htmlFor="apartment-bike-location">G3 · Bici</label>
      <select id="apartment-bike-location" value={showBike ? 'living' : 'bedroom'} onChange={event=>{
        const visible = event.target.value === 'living';
        setShowBike(visible);
        if (!visible && mode === 'all-stored') setMode('bench-stored');
      }}>
        <option value="bedroom">Sin bici · en la pieza</option>
        <option value="living">Con bici en el living</option>
      </select>
      <label htmlFor="apartment-storage-mode">G3 · Distribución</label>
      <select id="apartment-storage-mode" value={mode} onChange={event=>setMode(event.target.value as StorageMode)}>
        <option value="exercise">En uso</option>
        <option value="bench-stored">Banca guardada</option>
        <option value="all-stored" disabled={!showBike}>Banca y bici guardadas · barras arriba</option>
      </select>
      {mode !== 'exercise' && <p>Guardado horizontal aproximado: comprobar travesaño trasero{bikeStored ? ' y altura de barras sobre la bici' : ''}.</p>}
    </div>}
    <section className="af-layout" data-layout={layout.id} data-mode={layout.model === 'g3' ? mode : 'baseline'} data-bike={bikeVisible ? 'living' : 'bedroom'} aria-label={layout.title}>
    <h2>{layout.title}{benchStored ? ' · Guardado' : ''}{!bikeVisible ? ' · Sin bici' : ''}</h2>
    {layout.model === 'g3' && <p className="af-plan-caption">{benchStored ? 'Banca horizontal al fondo · 137 × 57 cm' : 'Banca sólida: barra libre · Contorno: Smith · V1 bajo banca'}{' · Barra libre 2 m · Apoyos por confirmar'}{layout.id === 'd' ? ' · 8,5 cm hacia ventanal' : ''}{bikeStored ? ' · Barras elevadas en trazo punteado' : ''}{bikeVisible && !benchStored ? ' · Bici sin caucho' : ''}{sofaVisible ? ' · GLOSTAD · TV ≈2,25 m · Cocina: 39 cm' : ''}</p>}
    <svg viewBox={`-45 -45 ${ROOM.width+90} ${ROOM.depth+75}`} role="img" aria-label={`Plano ${layout.id.toUpperCase()} con rack, banca, barra, caucho y cocina en L${sofaVisible ? ', sofá GLOSTAD frente a la tele' : ''}`}>
      <rect width={ROOM.width} height={ROOM.depth} fill="#fbfdfd" />
      <g transform={`translate(${layout.x} ${layout.y}) rotate(${layout.angle})`}><ModularFloor extension={layout.model === 'g3' && !benchStored} turn={layout.angle} /></g>
      <Kitchen />
      <path d={`M0 ${ROOM.doorY}V0H${ROOM.width}V${ROOM.depth}H${KITCHEN.passage}V${KITCHEN.partitionY} M0 ${ROOM.doorY+ROOM.doorWidth}V${ROOM.depth}`} fill="none" stroke="#263f48" strokeWidth="5" />
      <path d={`M3 0H${ROOM.width-3}`} stroke="#73a8b8" strokeWidth="6" />
      <text x={ROOM.width/2} y="-10">Ventanal</text>
      <Remodel />
      {layout.id === 'c' && <FridgeClearance rackX={layout.x} />}
      {bikeVisible && <Bike parking={bikeStored ? layout.angle : undefined} mat={layout.model !== 'g3' || benchStored} />}
      {sofaVisible && <Sofa />}
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
      <Ruler x={layout.floorX} y={sofaVisible ? 308 : bikeStored ? (layout.angle === 270 ? 205 : 190) : 252} length={layout.floorW} label="R · Caucho fijo 140 × 150 cm" />
      {layout.angle === 270 && <Ruler x={layout.x+(layout.model === 'g3' ? G3.smithY : RACK.barY)+10} y={20} length={20} label={layout.model === 'g3' ? 'Smith: 20 cm' : '20 cm'} vertical />}
      <g data-part="rack" transform={`translate(${layout.x} ${layout.y}) rotate(${layout.angle})`}>{layout.model === 'g3' ? <G3Rack turn={layout.angle} benchStored={benchStored} bikeStored={bikeStored} /> : <Rack turn={layout.angle} />}</g>
    </svg>
    {layout.id === 'c' && <p className="af-plan-caption">*Puerta de 70 cm aproximada · Bisagra derecha. El barrido cruza la barra libre{bikeStored ? ' y la bici' : ''}; comprobar alturas y modelo del refri.</p>}
  </section></React.Fragment>; })}<RubberCutPlan /></div>;
}

function RubberCutPlan() {
  return <section className="af-cut-plan" aria-label="Plan de cortes de tres planchetas">
    <h2>Cortes · 3 planchetas de 100 × 100 cm</h2>
    <p className="af-cut-note">R: base fija · V1: banca o bici · V2: completa la bici. V1 se mueve entre ambas configuraciones.</p>
    <div className="af-cut-grid">
      <svg data-part="source-tiles" viewBox="-15 -22 245 285" role="img" aria-label="Cortes y medidas de tres planchetas de un metro cuadrado">
        {CUT_TILES.map((pieces,i)=><g key={i} data-part="cut-tile" data-tile={i+1} transform={`translate(${(i%2)*115} ${Math.floor(i/2)*130})`}>
          <text x="50" y="-8" style={{fontSize:7}}>Plancheta {i+1} · 100 × 100</text>
          {pieces.map(piece=><g key={piece.id}>
            <rect data-part="cut-piece" data-piece={piece.id} data-use={piece.use} x={piece.x} y={piece.y} width={piece.w} height={piece.h} fill={RUBBER_COLOR[piece.use]} stroke="#6b8377" strokeWidth=".6" />
            <text x={piece.x+piece.w/2} y={piece.y+piece.h/2-2} style={{fontSize:6.5}}>
              <tspan x={piece.x+piece.w/2}>{piece.id}</tspan>
              <tspan x={piece.x+piece.w/2} dy="9">{piece.w} × {piece.h}</tspan>
            </text>
          </g>)}
          <rect width="100" height="100" fill="none" stroke="#405b62" strokeWidth="1" />
        </g>)}
        <text x="165" y="175" style={{fontSize:7}}>Base: 2,1 m²</text>
        <text x="165" y="188" style={{fontSize:7}}>V1 + V2: 0,9 m²</text>
        <text x="107.5" y="250" style={{fontSize:7}}>Total nominal: 3 m² · Sin retazos</text>
      </svg>
      <svg data-part="assembled-modules" viewBox="-10 -22 285 315" role="img" aria-label="Alternativas: V1 como extensión de banca o V1 más V2 para bici">
        <Ruler x={0} y={-3} length={140} label="R · 140 cm" />
        {RACK_FLOOR_PARTS.map(piece=><g key={piece.id}>
          <rect data-part="assembled-rack-piece" data-piece={piece.id} x={piece.x} y={piece.y} width={piece.w} height={piece.h} fill={RUBBER_COLOR.rack} stroke="#6b8377" strokeWidth=".6" />
          <text x={piece.x+piece.w/2} y={piece.y+piece.h/2} style={{fontSize:7}}>{piece.id}</text>
        </g>)}
        <rect data-part="assembled-bench-piece" data-piece="V1" x="37.5" y="150" width="60" height="100" fill={RUBBER_COLOR.bike} stroke="#648b99" strokeWidth="1" strokeDasharray="3 2" />
        <g data-part="cut-rack-supports" fill="#53676e">
          {[9,126].map(x=><g key={x}><rect x={x-3.5} y="4" width="7" height="140" rx="1" /><rect x={x-5} y="4" width="10" height="5" /><rect x={x-5} y="139" width="10" height="5" /></g>)}
        </g>
        <rect x="39" y="85" width="57" height="137" rx="3" fill="none" stroke="#a77165" strokeWidth=".9" strokeDasharray="3 2" />
        {[100,207].map(y=><rect key={y} x="39" y={y} width="57" height="7" fill="#aa8175" fillOpacity=".7" />)}
        <text x="67.5" y="237" style={{fontSize:7}}>V1 · 60 × 100</text>
        <Ruler x={150} y={150} length={150} label="150 cm" vertical />
        <Ruler x={37.5} y={260} length={60} label="60 cm" />
        <text x="67.5" y="280" style={{fontSize:7}}>Banca · V2 guardado</text>
        <text x="215" y="55" style={{fontSize:7}}>Alternativa: bici</text>
        <text x="215" y="67" style={{fontSize:7}}>Misma V1 + V2</text>
        <rect data-part="assembled-bike-piece" data-piece="V1" x="185" y="90" width="60" height="100" fill={RUBBER_COLOR.bike} stroke="#648b99" strokeWidth=".6" />
        <rect data-part="assembled-bike-piece" data-piece="V2" x="185" y="190" width="60" height="50" fill={RUBBER_COLOR.bike} stroke="#648b99" strokeWidth=".6" />
        <rect x="188.25" y="92" width="53.5" height="131" rx="2" fill="none" stroke="#536c79" strokeWidth=".7" strokeDasharray="3 2" />
        {[100,213].map(y=><rect key={y} x="188.25" y={y} width="53.5" height="5" fill="#536c79" />)}
        <text x="215" y="140">V1</text><text x="215" y="220">V2</text>
        <Ruler x={257} y={240} length={150} label="150 cm" vertical />
        <Ruler x={185} y={260} length={60} label="60 cm" />
      </svg>
    </div>
    <p className="af-cut-note">Medidas nominales en cm. Confirmar lado útil, encastres y bases reales del rack antes de cortar.</p>
  </section>;
}
