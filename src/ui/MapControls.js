// ═══════════════════════════════════════════════════════════
//  ui/MapControls.js
//  Relocated from the monolith's "MOUSE INTERACTIONS" section.
//  Behavior is byte-identical; direct reassignments of imported
//  viewport/overlay state (vpX/vpY/vpScale/isDragging/dragStart*/
//  dragVp*/hoveredStationKey) go through the setter functions
//  exported by rendering/viewport.js and rendering/overlays.js,
//  since ES module imports of primitive bindings can't be
//  reassigned directly from outside the module that owns them.
// ═══════════════════════════════════════════════════════════
import { ST } from '../data/stations.js';
import {
  canvas, vpX, vpY, vpScale, isDragging, dragStartX, dragStartY, dragVpX, dragVpY,
  stationCanvasPos, resize, setDragState, setDragStart, setDragVp, setViewport,
} from '../rendering/viewport.js';
import { hoveredStationKey, setHoveredStationKey } from '../rendering/overlays.js';
import { requestRedraw } from '../rendering/scheduler.js';

// ── MOUSE INTERACTIONS ──
canvas.addEventListener('mousedown',e=>{
  setDragState(true);
  setDragStart(e.clientX, e.clientY);
  setDragVp(vpX, vpY);
});
canvas.addEventListener('mousemove',e=>{
  if(isDragging){
    setViewport(dragVpX+(e.clientX-dragStartX), dragVpY+(e.clientY-dragStartY), vpScale);
    requestRedraw();
    return;
  }
  // hover tooltip
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left, my=e.clientY-rect.top;
  let found=null, foundDist=Infinity;
  for(const [name,s] of Object.entries(ST)){
    if(!s.op) continue;
    const c=stationCanvasPos(name);
    const dist=Math.hypot(mx-c.x,my-c.y);
    if(dist<12 && dist<foundDist){ foundDist=dist; found={name,s}; }
  }
  // Only trigger a redraw when the hovered STATION actually changes —
  // not on every mousemove tick while sitting over the same station.
  const newHoverKey = found ? found.name : null;
  if(newHoverKey !== hoveredStationKey){
    setHoveredStationKey(newHoverKey);
    requestRedraw();
  }
  const tt=document.getElementById('tt');
  if(found){
    tt.style.display='block';
    tt.style.left=(e.clientX-canvas.getBoundingClientRect().left+14)+'px';
    tt.style.top=(e.clientY-canvas.getBoundingClientRect().top-10)+'px';
    document.getElementById('tt-name').textContent=found.name+(found.s.aka?` (${found.s.aka})`:'');
    document.getElementById('tt-line').innerHTML=`<span style="color:${found.s.co}">● ${found.s.li} Line</span>`;
    document.getElementById('tt-note').textContent=found.s.ix?`🔄 Interchange: ${found.s.ix}`:found.s.note||'';
  } else {
    tt.style.display='none';
  }
});
canvas.addEventListener('mouseup',()=>{ setDragState(false); });
canvas.addEventListener('mouseleave',()=>{
  setDragState(false);
  document.getElementById('tt').style.display='none';
  if(hoveredStationKey!==null){ setHoveredStationKey(null); requestRedraw(); }
});
canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left, my=e.clientY-rect.top;
  const factor=e.deltaY<0?1.15:0.87;
  setViewport(
    mx-(mx-vpX)*factor,
    my-(my-vpY)*factor,
    Math.max(0.5,Math.min(8,vpScale*factor)),
  );
  requestRedraw();
},{passive:false});

// Touch support
let lastTouchDist=0;
canvas.addEventListener('touchstart',e=>{
  if(e.touches.length===1){
    setDragState(true);
    setDragStart(e.touches[0].clientX, e.touches[0].clientY);
    setDragVp(vpX, vpY);
  } else if(e.touches.length===2){
    lastTouchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
  }
},{passive:true});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  if(e.touches.length===1&&isDragging){
    setViewport(dragVpX+(e.touches[0].clientX-dragStartX), dragVpY+(e.touches[0].clientY-dragStartY), vpScale);
    requestRedraw();
  } else if(e.touches.length===2){
    const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    const factor=d/lastTouchDist;
    const mx=(e.touches[0].clientX+e.touches[1].clientX)/2;
    const my=(e.touches[0].clientY+e.touches[1].clientY)/2;
    const rect=canvas.getBoundingClientRect();
    const cx=mx-rect.left, cy=my-rect.top;
    setViewport(cx-(cx-vpX)*factor, cy-(cy-vpY)*factor, Math.max(0.5,Math.min(8,vpScale*factor)));
    lastTouchDist=d;
    requestRedraw();
  }
},{passive:false});
canvas.addEventListener('touchend',()=>{ setDragState(false); },{passive:true});

window.addEventListener('resize', resize);
