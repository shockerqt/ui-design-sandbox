import React, { useRef, useState } from 'react';

type Rect = { x: number; y: number; width: number; height: number };
type Gym = { floorX: number; floorY: number; x: number; y: number; angle: number; swap: boolean; discs: boolean; access: boolean };
const INITIAL: Gym = { floorX: 10, floorY: 5, x: 125, y: 105, angle: 0, swap: false, discs: true, access: false };
const SOURCE = 'https://sdmed.cl/productos/jaula-rack-ws-barbell-stack-rowing-sid-srhsrhd/';
export const GYM_EXPORT_STYLE = '.af-gym text{font-family:Arial,sans-serif;text-anchor:middle;fill:#33494c}.af-gym .gym-caption{font-size:7px}.af-gym .gym-small{font-size:6px}.gym-frame{fill:#485a60;stroke:#263c43;stroke-width:1}.gym-safety{fill:#819397;stroke:#344e57;stroke-width:1}.gym-bar{fill:#bdcbd0;stroke:#38505a;stroke-width:.7}.gym-cote{fill:none;stroke:#617c80;stroke-width:.6}';
const overlap = (a: Rect, b: Rect) => a.x < b.x+b.width-.01 && a.x+a.width > b.x+.01 && a.y < b.y+b.height-.01 && a.y+a.height > b.y+.01;
const outside = (r: Rect, width: number, depth: number) => r.x < -.01 || r.y < -.01 || r.x+r.width > width+.01 || r.y+r.height > depth+.01;
export function useApartmentGym(width: number, depth: number, island: Rect, fridge: Rect, select: () => void) {
  const [gym, setGym] = useState<Gym>(INITIAL);
  const drag = useRef<{ clientX: number; clientY: number; x: number; y: number; part: 'rack' | 'floor' } | null>(null);
  const update = (patch: Partial<Gym>) => setGym(g => ({ ...g, ...patch }));
  const rw = gym.swap ? 138.9 : 165.8, rd = gym.swap ? 165.8 : 138.9;
  const postX = rw/2-28.5, rearY = -rd/2+10, frontY = rd/2-60, barY = frontY+8;
  const rad = gym.angle*Math.PI/180;
  const point = (x: number, y: number) => ({ x: gym.x+x*Math.cos(rad)-y*Math.sin(rad), y: gym.y+x*Math.sin(rad)+y*Math.cos(rad) });
  const bounds = (r: Rect): Rect => {
    const ps = [point(r.x,r.y),point(r.x+r.width,r.y),point(r.x,r.y+r.height),point(r.x+r.width,r.y+r.height)];
    const xs=ps.map(p=>p.x),ys=ps.map(p=>p.y);
    return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
  };
  const floor = {x:gym.floorX,y:gym.floorY,width:200,height:200};
  const body = bounds({x:-rw/2,y:-rd/2,width:rw,height:rd});
  const bar = bounds({x:-110,y:barY-2.5,width:220,height:5});
  const plates = [-1,1].map(side => bounds({x:side===-1?-rw/2+3:postX+4,y:rearY-22.5,width:21.5,height:45}));
  const physical: [string,Rect][] = [['Rack (envolvente)',body],['Barra',bar],...(gym.discs ? plates.map((r,i)=>[`Discos ${i+1}`,r] as [string,Rect]) : [])];
  const envelope = { width: Math.max(...physical.map(([,r])=>r.x+r.width))-Math.min(...physical.map(([,r])=>r.x)), depth: Math.max(...physical.map(([,r])=>r.y+r.height))-Math.min(...physical.map(([,r])=>r.y)) };
  const warnings: string[]=[];
  for (const [name,r] of physical) {
    if (outside(r,width,depth)) warnings.push(`${name}: sobresale de los límites del espacio.`);
    if (overlap(r,island)) warnings.push(`${name}: coincide con la isla en planta.`);
    if (overlap(r,fridge)) warnings.push(`${name}: coincide con el refrigerador en planta.`);
  }
  if (outside(floor,width,depth)) warnings.push('El caucho sobresale del espacio.');
  if (overlap(floor,island)) warnings.push('El caucho coincide con la isla.');
  if (overlap(floor,fridge)) warnings.push('El caucho coincide con el refrigerador.');
  const containing = (inner: Rect, outer: Rect) => inner.x>=outer.x-.01 && inner.y>=outer.y-.01 && inner.x+inner.width<=outer.x+outer.width+.01 && inner.y+inner.height<=outer.y+outer.height+.01;
  if (!containing(body,floor)) warnings.push('Parte del rack queda fuera del caucho.');
  const sleeves = [-1,1].map(s => bounds({x:s===-1?-160:110,y:barY-22.5,width:50,height:45}));
  const limitedAccess = sleeves.some(r=>outside(r,width,depth)||overlap(r,island)||overlap(r,fridge));
  const handles = (part: 'rack'|'floor') => ({
    onPointerDown: (e: React.PointerEvent<SVGGElement>) => {
      e.stopPropagation();select();
      const matrix=e.currentTarget.ownerSVGElement?.getScreenCTM();if(!matrix)return;
      const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
      drag.current={clientX:p.x,clientY:p.y,x:part==='rack'?gym.x:gym.floorX,y:part==='rack'?gym.y:gym.floorY,part};
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent<SVGGElement>) => {
      if(!drag.current)return;e.stopPropagation();
      const matrix=e.currentTarget.ownerSVGElement?.getScreenCTM();if(!matrix)return;
      const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse()),d=drag.current;
      const x=Math.round(d.x+p.x-d.clientX),y=Math.round(d.y+p.y-d.clientY);
      update(d.part==='rack'?{x,y}:{floorX:x,floorY:y});
    },
    onPointerUp:()=>{drag.current=null;},onPointerCancel:()=>{drag.current=null;},
    onClick:select,
    onKeyDown:(e:React.KeyboardEvent<SVGGElement>)=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();select();return;}
      if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
      e.preventDefault();select();const dx=e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0,dy=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0;
      update(part==='rack'?{x:gym.x+dx,y:gym.y+dy}:{floorX:gym.floorX+dx,floorY:gym.floorY+dy});
    }
  });
  const floorDrawing = <g className="af-gym gym-floor" role="button" tabIndex={0} aria-label="Mover piso de caucho con las flechas o arrastrando" {...handles('floor')}>
    <defs><pattern id="gym-rubber" width="25" height="25" patternUnits="userSpaceOnUse"><rect width="25" height="25" fill="#cad4cf" /><path d="M25 0H0V25" fill="none" stroke="#aabbb3" strokeWidth=".6" /><circle cx="6" cy="9" r=".6" fill="#a3b5ac" /><circle cx="17" cy="20" r=".5" fill="#a3b5ac" /></pattern></defs>
    <rect data-gym="floor" {...floor} fill="url(#gym-rubber)" stroke="#6b8377" strokeWidth="1" strokeDasharray="3 2" />
    <text x={floor.x+100} y={floor.y+192} className="gym-caption">CAUCHO 200 × 200 cm · 4 m²</text>
  </g>;
  const drawing = <g className="af-gym gym-rack" role="button" tabIndex={0} aria-label="Mover rack y barra juntos con las flechas o arrastrando" {...handles('rack')}>
    <g transform={`translate(${gym.x} ${gym.y}) rotate(${gym.angle})`} data-gym="rack">
      <rect x={-rw/2} y={-rd/2} width={rw} height={rd} fill="none" stroke="#8d7972" strokeWidth=".7" strokeDasharray="3 2" />
      {gym.access && sleeves.map((_,i)=><rect key={i} x={i===0?-160:110} y={barY-22.5} width="50" height="45" fill="#f1d9aa" fillOpacity=".45" stroke="#a07833" strokeWidth=".7" strokeDasharray="3 2" />)}
      <rect className="gym-frame" x={-postX-3.5} y={rearY-5} width={postX*2+7} height="5" />
      {[-1,1].map(s=><g key={s}>
        <rect className="gym-frame" x={s*postX-3.5} y={-rd/2+5} width="7" height={rd-5} />
        <rect x={s*postX-5} y={rd/2-7} width="10" height="7" fill="#37494f" />
        <path d={`M${s*postX} ${frontY}v${rd/2-frontY-10}`} stroke="#667b83" strokeWidth="3" />
        <rect x={s===-1?-rw/2:postX} y={rearY-2.5} width="28.5" height="5" fill="#667b83" stroke="#3c545e" strokeWidth=".7" />
        {gym.discs && [0,1,2].map(i=><rect key={i} x={s===-1?-rw/2+3+i*6.5:postX+4+i*6.5} y={rearY-22.5} width="6" height="45" rx="1" fill="#68716d" stroke="#dae0db" strokeWidth=".8" />)}
        <rect className="gym-safety" x={s*postX-3.5} y={frontY} width="7" height="50" rx="1" />
        <rect x={s*postX-5} y={frontY+46} width="10" height="4" fill="#344e57" />
        <rect className="gym-frame" x={s*postX-3.5} y={rearY-3.5} width="7" height="7" />
        <rect className="gym-frame" x={s*postX-3.5} y={frontY-3.5} width="7" height="7" />
        <path d={`M${s*postX-4} ${frontY}v10h8v-4`} fill="none" stroke="#a7713d" strokeWidth="2.5" />
      </g>)}
      <rect data-gym="bar" x="-110" y={barY-1.4} width="220" height="2.8" className="gym-bar" />
      <rect x="-110" y={barY-2.5} width="41" height="5" className="gym-bar" /><rect x="69" y={barY-2.5} width="41" height="5" className="gym-bar" />
      <text x="0" y={rearY+28} className="gym-small">STORAGE TRASERO · 4 SOPORTES/LADO</text>
      <text x="0" y={frontY-12} className="gym-caption">SID-SRHSRHD</text>
      <text x="0" y={barY+15} className="gym-small">BARRA 220 cm · J-HOOKS ESTIMADOS</text>
      <text x="0" y={rd/2-10} className="gym-small">↓ FRENTE · SEGUROS Y PATAS</text>
      <path className="gym-cote" d={`M${-rw/2} ${-rd/2-7}h${rw} M${-rw/2} ${-rd/2-10}v6 M${rw/2} ${-rd/2-10}v6`} />
      <text x="0" y={-rd/2-11} className="gym-caption">≈ {rw.toLocaleString('es-CL')} cm</text>
      <text transform={`translate(${rw/2+10} 0) rotate(-90)`} className="gym-small">≈ {rd.toLocaleString('es-CL')} cm DE FONDO</text>
    </g>
  </g>;
  const number = (label: string,key:'x'|'y'|'floorX'|'floorY')=><label className="af-field"><span>{label}</span><span className="af-number"><input type="number" step="1" min="-1000" max="1000" aria-label={label} value={Math.round(gym[key]*100)/100} onChange={e=>{if(e.target.value!==''&&Number.isFinite(e.target.valueAsNumber))update({[key]:Math.max(-1000,Math.min(1000,e.target.valueAsNumber))});}} /><span>cm</span></span></label>;
  const panel = <section className="gym-panel"><h2>Rack + piso de caucho</h2><p>Arrastra el rack y la barra juntos. El caucho se mueve por separado. El frente apunta hacia abajo en 0°.</p>
    {number('Centro del rack · X','x')}{number('Centro del rack · Y','y')}
    <label className="af-field"><span>Orientación</span><select aria-label="Orientación del rack" value={gym.angle} onChange={e=>update({angle:Number(e.target.value)})}>{[0,90,180,270].map(a=><option key={a} value={a}>{a}°</option>)}</select></label>
    {number('Caucho · X izquierda','floorX')}{number('Caucho · Y superior','floorY')}
    <label className="gym-check"><input type="checkbox" checked={gym.discs} onChange={e=>update({discs:e.target.checked})} />Discos guardados · Ø 45 cm supuesto</label>
    <label className="gym-check"><input type="checkbox" checked={gym.access} onChange={e=>update({access:e.target.checked})} />Ver 50 cm extra para cargar por extremo</label>
    <label className="gym-check"><input type="checkbox" checked={gym.swap} onChange={e=>update({swap:e.target.checked})} />Intercambiar ancho y fondo de la ficha</label>
    <div className="gym-spec"><strong>Publicadas / asignación provisional</strong><p>Alto: 221,8 cm. Modelo en planta: {rw.toLocaleString('es-CL')} de ancho × {rd.toLocaleString('es-CL')} de fondo. La ficha no identifica ejes.</p><a href={SOURCE} target="_blank" rel="noreferrer">Ficha SDMED ↗</a> · <a href="https://sdmed.cl/wp-content/uploads/2023/02/1-8.jpg" target="_blank" rel="noreferrer">Foto analizada ↗</a></div>
    <details className="gym-detail"><summary>Cómo interpreté las piezas</summary><p>Estimaciones para dibujar, no cotas del fabricante:</p><ul><li>Marco exterior ≈ {(rw-50).toLocaleString('es-CL')} cm de ancho; postes de 7 × 5 cm.</li><li>Storage lateral ≈ 25 cm por lado. Los 4 niveles se superponen al mirar desde arriba.</li><li>Postes traseros a 10 cm del borde; principales a 60 cm de la punta de las patas.</li><li>J-hooks ≈ 8 cm delante del eje principal; barra centrada entre ellos.</li><li>Seguros ≈ 50 cm delante de los postes; patas llegan hasta el límite exterior.</li><li>Discos verticales vistos de canto: Ø 45 cm y pila de ≈ 20 cm por lado, ambos supuestos.</li></ul><p>La envolvente de la ficha ya se usa como límite del rack vacío; no sumo nuevamente patas o storage. Los discos cargados sí pueden sobresalir hacia atrás. Banco y accesorios de remo/fondos no están desplegados.</p></details>
    <div className="gym-status" role="status"><p><b>Envolvente en planta: {envelope.width.toLocaleString('es-CL', {maximumFractionDigits:1})} × {envelope.depth.toLocaleString('es-CL', {maximumFractionDigits:1})} cm</b><br />Incluye barra{gym.discs ? ' y discos supuestos' : ''}; excluye espacio para cargar.</p><strong>{warnings.length?'Revisar coincidencias':'Sin coincidencias con isla o refri'}</strong>{warnings.map((s,i)=><p key={i}>{s}</p>)}<p>{limitedAccess?'El escenario de 50 cm por extremo para cargar la barra invade un límite u otro elemento.':'El escenario de 50 cm por extremo para cargar la barra cabe en planta.'}</p><p>La barra supera 20 cm al caucho en su eje. El margen de carga es una referencia para distribución, no una holgura certificada. Falta comprobar altura de techo.</p></div>
  </section>;
  return {floorDrawing,drawing,panel,reset:()=>setGym(INITIAL)};
}
