// ═══════════════════════════════════════════════════════════
//  rendering/overlays.js
//  Relocated from the monolith, byte-identical bodies.
// ═══════════════════════════════════════════════════════════
import { ST } from '../data/stations.js';
import { ctx, vpScale, stationCanvasPos } from './viewport.js';
import { friends, lastResult } from './state.js';

// ═══════════════════════════════════════════════════════════
//  DYNAMIC OVERLAY LAYERS
//  Repainted every visible frame on top of the (possibly reused)
//  static bitmap. Each is independent, so a future animated-train or
//  live-vehicle overlay can be added the same way — its own function,
//  called from performDraw(), touching nothing else here.
// ═══════════════════════════════════════════════════════════
export let hoveredStationKey=null; // set by the mousemove handler below

/** Reassigns hoveredStationKey — used by the mousemove handler (ui/MapControls.js) since imported primitive bindings can't be reassigned directly from outside this module. */
export function setHoveredStationKey(key){ hoveredStationKey = key; }

export function drawHoverOverlay(dotPositions){
  if(!hoveredStationKey) return;
  const s=ST[hoveredStationKey];
  if(!s || !s.op) return;
  const c=dotPositions[hoveredStationKey] || stationCanvasPos(hoveredStationKey);
  const base = s.li==='Interchange' ? Math.max(5,7*vpScale) : Math.max(3,4.5*vpScale);
  ctx.beginPath();
  ctx.arc(c.x,c.y,base+5,0,Math.PI*2);
  ctx.strokeStyle='#67e7fb';
  ctx.lineWidth=2;
  ctx.globalAlpha=0.85;
  ctx.stroke();
  ctx.globalAlpha=1;
}

export function drawFriendMarkers(dotPositions){
  friends.forEach(f=>{
    const c=dotPositions[f.stKey] || stationCanvasPos(f.stKey);
    const r=Math.min(13, Math.max(8,10*vpScale));
    ctx.beginPath();
    ctx.arc(c.x,c.y,r,0,Math.PI*2);
    ctx.fillStyle=f.color;
    ctx.fill();
    ctx.strokeStyle='#fff';
    ctx.lineWidth=2;
    ctx.stroke();
    ctx.fillStyle='#fff';
    ctx.font=`bold ${Math.min(12,10*vpScale)}px 'Bricolage Grotesque',sans-serif`;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(f.name[0].toUpperCase(),c.x,c.y);
  });
}

export function drawMeetupMarker(dotPositions){
  if(!lastResult) return;
  const c=dotPositions[lastResult.opt.key] || stationCanvasPos(lastResult.opt.key);
  const r=Math.min(17, Math.max(10,14*vpScale));
  const grd=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,r*1.8);
  grd.addColorStop(0,'rgba(255,107,53,0.35)');
  grd.addColorStop(1,'rgba(255,107,53,0)');
  ctx.beginPath();ctx.arc(c.x,c.y,r*1.8,0,Math.PI*2);
  ctx.fillStyle=grd;ctx.fill();
  ctx.beginPath();ctx.arc(c.x,c.y,r,0,Math.PI*2);
  ctx.fillStyle='#ff6b35';ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.stroke();
  ctx.font=`${Math.min(16,14*vpScale)}px serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('🚇',c.x,c.y);
}
