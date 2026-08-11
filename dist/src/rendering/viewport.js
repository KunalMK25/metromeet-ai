// ═══════════════════════════════════════════════════════════
//  rendering/viewport.js
//  Relocated from the monolith's "CANVAS MAP ENGINE" section,
//  byte-identical bodies (resize/resetView/zoom's calls to
//  requestRedraw() now go through the imported function instead
//  of an implicit same-scope reference — identical behavior).
// ═══════════════════════════════════════════════════════════
import { requestRedraw } from './scheduler.js';
import { schematicNorm } from './schematic.js';

export const canvas = document.getElementById('mapCanvas');
export const ctx    = canvas.getContext('2d');

// Viewport state
export let vpX=0, vpY=0, vpScale=1;
export let isDragging=false, dragStartX=0, dragStartY=0, dragVpX=0, dragVpY=0;

// Setters — needed because ES module imports of primitive bindings
// are read-only views; anything outside this file that must
// reassign (not just read) these values uses one of these instead
// of `vpX = ...` directly. Internal callers here still assign the
// bare identifiers exactly as the monolith did.
export function setDragState(v){ isDragging = v; }
export function setDragStart(x,y){ dragStartX = x; dragStartY = y; }
export function setDragVp(x,y){ dragVpX = x; dragVpY = y; }
export function setViewport(x,y,scale){ vpX = x; vpY = y; vpScale = scale; }

export function normToCanvas(nx,ny){
  const W=canvas.width, H=canvas.height;
  return {
    x: vpX + nx*W*vpScale,
    y: vpY + ny*H*vpScale,
  };
}

export function canvasToNorm(cx,cy){
  const W=canvas.width, H=canvas.height;
  return {
    nx:(cx-vpX)/(W*vpScale),
    ny:(cy-vpY)/(H*vpScale),
  };
}

export function resize(){
  const wrap=document.querySelector('.map-wrap');
  canvas.width  = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  if(vpScale===1&&vpX===0&&vpY===0) resetView();
  else requestRedraw();
}

export function resetView(){
  vpScale=1; vpX=0; vpY=0; requestRedraw();
}

export function zoom(factor){
  const cx=canvas.width/2, cy=canvas.height/2;
  vpX = cx - (cx-vpX)*factor;
  vpY = cy - (cy-vpY)*factor;
  vpScale *= factor;
  vpScale = Math.max(0.5, Math.min(8, vpScale));
  requestRedraw();
}

// Look up a station's on-screen position (schematic grid → normalized → canvas px)
export function stationCanvasPos(stationKey){
  const n = schematicNorm(stationKey);
  return normToCanvas(n.x, n.y);
}
