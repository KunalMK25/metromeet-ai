// ═══════════════════════════════════════════════════════════
//  rendering/renderer.js
//  Relocated from the monolith, byte-identical bodies.
//  PROTECTED — renderer behavior must not change.
// ═══════════════════════════════════════════════════════════
import { FEATURE_FLAGS } from '../config/FeatureFlags.js';
import { Logger } from '../diagnostics/Logger.js';
import { PerfMonitor } from '../diagnostics/PerformanceMonitor.js';
import { ErrorBoundary } from '../diagnostics/ErrorBoundary.js';
import { SCHEMATIC_W, SCHEMATIC_H, LINE_GEOMETRY_CACHE, STATION_GEOMETRY_CACHE } from './schematic.js';
import { canvas, ctx, vpX, vpY, vpScale, normToCanvas } from './viewport.js';
import { getLabelLayout } from './labels.js';
import { drawHoverOverlay, drawFriendMarkers, drawMeetupMarker } from './overlays.js';
import { requestRedraw, setDrawCallback } from './scheduler.js';

// ═══════════════════════════════════════════════════════════
//  OFFSCREEN STATIC LAYER (background · grid · lines · stations · labels)
//  Regenerated only when the viewport (pan/zoom/resize) actually
//  changes — see performDraw(). Every other redraw (hover, friend
//  markers, meetup marker) just blits this cached bitmap and paints
//  a small dynamic overlay on top, without touching any of this.
// ═══════════════════════════════════════════════════════════
export const staticCanvas = document.createElement('canvas');
export const staticCtx = staticCanvas.getContext('2d');
if (!staticCtx) ErrorBoundary.missingAsset('offscreen static-layer canvas context');
export let lastStaticVpKey=null;
let lastDotPositions={};

/**
 * Renderer module — regenerates the cached static map bitmap.
 * @summary Purpose: draw the background grid, all metro lines, all
 *   station dots, and all visible labels onto the offscreen
 *   `staticCanvas`. Only called by performDraw() when the viewport
 *   (pan/zoom/resize) actually changed, or when FEATURE_FLAGS.
 *   RENDER_CACHE is off — this is the "expensive" pass the caching
 *   strategy exists to avoid running every frame.
 * @param {number} W - canvas width in px
 * @param {number} H - canvas height in px
 * @returns {Object<string,{x:number,y:number}>} this frame's canvas
 *   pixel position for every operational station (reused by the
 *   dynamic-overlay pass so it never recomputes normToCanvas itself).
 * @complexity O(N) over stations/line-segments/visible labels.
 * @sideEffects Mutates staticCanvas/staticCtx (the offscreen bitmap)
 *   and lastDotPositions/lastStaticVpKey (via its caller, performDraw).
 */
export function renderStaticLayer(W,H){
  staticCanvas.width=W; staticCanvas.height=H;
  const sctx=staticCtx;
  sctx.clearRect(0,0,W,H);

  sctx.fillStyle='#060a12';
  sctx.fillRect(0,0,W,H);

  // subtle schematic-space grid (pans/zooms with the map, purely decorative)
  sctx.strokeStyle='rgba(30,47,72,0.4)';
  sctx.lineWidth=0.5;
  const gridStep=100;
  for(let gx=0; gx<=SCHEMATIC_W; gx+=gridStep){
    const c=normToCanvas(gx/SCHEMATIC_W,0), c2=normToCanvas(gx/SCHEMATIC_W,1);
    sctx.beginPath();sctx.moveTo(c.x,c.y);sctx.lineTo(c2.x,c2.y);sctx.stroke();
  }
  for(let gy=0; gy<=SCHEMATIC_H; gy+=gridStep){
    const c=normToCanvas(0,gy/SCHEMATIC_H), c2=normToCanvas(1,gy/SCHEMATIC_H);
    sctx.beginPath();sctx.moveTo(c.x,c.y);sctx.lineTo(c2.x,c2.y);sctx.stroke();
  }

  // metro lines — smooth rounded joins/caps, from cached geometry
  sctx.lineJoin='round';
  sctx.lineCap='round';
  for(const line of LINE_GEOMETRY_CACHE){
    if(line.points.length<2) continue;
    sctx.beginPath();
    let first=true;
    for(const p of line.points){
      const c=normToCanvas(p.x/SCHEMATIC_W, p.y/SCHEMATIC_H);
      if(first){ sctx.moveTo(c.x,c.y); first=false; } else sctx.lineTo(c.x,c.y);
    }
    sctx.strokeStyle=line.color;
    sctx.lineWidth=Math.max(2,3*vpScale);
    sctx.globalAlpha=0.85;
    sctx.stroke();
    sctx.globalAlpha=1;
  }
  sctx.lineJoin='miter';
  sctx.lineCap='butt';

  // stations, from cached geometry — also records this frame's pixel
  // positions so the dynamic-overlay pass (hover/friends/meetup) can
  // reuse them without recomputing normToCanvas() again.
  const dotPositions={};
  for(const s of STATION_GEOMETRY_CACHE){
    const c=normToCanvas(s.x/SCHEMATIC_W, s.y/SCHEMATIC_H);
    dotPositions[s.key]=c;
    const r=s.isIx ? Math.max(5,7*vpScale) : Math.max(3,4.5*vpScale);

    sctx.beginPath();
    sctx.arc(c.x,c.y,r,0,Math.PI*2);
    sctx.fillStyle=s.color;
    sctx.fill();
    sctx.strokeStyle='#060a12';
    sctx.lineWidth=s.isIx?2:1.2;
    sctx.stroke();

    if(s.isIx){
      sctx.beginPath();
      sctx.arc(c.x,c.y,r+3,0,Math.PI*2);
      sctx.strokeStyle=s.color;
      sctx.lineWidth=1.5;
      sctx.globalAlpha=0.4;
      sctx.stroke();
      sctx.globalAlpha=1;
    }
  }

  // labels — reuse the scale/size-keyed layout cache; only the
  // per-frame pan offset (already baked into dotPositions) is added.
  const layout = getLabelLayout(vpScale,W,H);
  for(const item of layout){
    const base=dotPositions[item.key];
    if(!base) continue;
    const x=base.x+item.dx, y=base.y+item.dy;
    sctx.font=item.font;
    sctx.fillStyle=item.isIx?'#fff':'rgba(216,234,248,0.85)';
    sctx.textAlign='left';
    sctx.textBaseline='top';
    sctx.fillText(item.key, x - sctx.measureText(item.key).width/2, y);
  }

  return dotPositions;
}

/**
 * Renderer module — single-frame draw entry point.
 * @summary Purpose: the only function requestRedraw() calls. Blits
 *   the cached static bitmap (regenerating it first only if the
 *   viewport actually changed — or every time if RENDER_CACHE is
 *   off) then paints the dynamic overlays (hover ring, friend
 *   markers, meetup marker) on top. Call requestRedraw() to schedule
 *   a frame — never call this directly from application code.
 * @returns {void}
 * @complexity O(1) amortized (static layer reuse) up to O(N) on a
 *   viewport-change frame (N = stations/lines/labels).
 * @sideEffects Draws to the visible canvas; records timing via
 *   PerfMonitor. Wrapped below with a try/catch so a rendering
 *   exception is logged instead of breaking future frames.
 */
// ── DRAW ── (rAF-scheduled entry point — call requestRedraw(), not this, directly)
export function performDraw(){
  const t0 = (typeof performance!=='undefined'?performance.now():Date.now());
  const W=canvas.width, H=canvas.height;

  // Regenerate the cached static bitmap (grid+lines+stations+labels)
  // ONLY when the viewport actually changed since the last frame (and
  // only when FEATURE_FLAGS.RENDER_CACHE is on — turning it off makes
  // every frame regenerate, useful for isolating a rendering issue).
  // Every other trigger (hover, friend add/remove, meetup found)
  // reuses it untouched and just repaints the dynamic overlays.
  const vpKey = vpX+'|'+vpY+'|'+vpScale+'|'+W+'|'+H;
  let dotPositions = lastDotPositions;
  if(!FEATURE_FLAGS.RENDER_CACHE || vpKey !== lastStaticVpKey){
    PerfMonitor.recordCacheMiss('staticLayer');
    dotPositions = PerfMonitor.time('staticCacheRegeneration', ()=>renderStaticLayer(W,H));
    lastDotPositions = dotPositions;
    lastStaticVpKey = vpKey;
  } else {
    PerfMonitor.recordCacheHit('staticLayer');
  }

  ctx.clearRect(0,0,W,H);
  ctx.drawImage(staticCanvas,0,0);
  PerfMonitor.time('dynamicOverlayRender', ()=>{
    drawHoverOverlay(dotPositions);
    drawFriendMarkers(dotPositions);
    drawMeetupMarker(dotPositions);
  });

  PerfMonitor.record('frameRender', ((typeof performance!=='undefined'?performance.now():Date.now())) - t0);
}

// Canvas rendering exceptions never take down the rest of the app —
// wrapping the reference (not editing performDraw's own body, and not
// touching requestRedraw/the scheduler) so a single bad frame just
// gets logged instead of breaking every future redraw.
(function makeRenderResilient(){
  const _performDraw = performDraw;
  performDraw = function(...args){
    try { return _performDraw.apply(this, args); }
    catch(e){ Logger.error('Renderer', 'performDraw threw: '+e.message, {error:e.message}); }
  };
})();

// ── Optional production timing instrumentation ─────────────
// See core/dijkstra.js for why this lives here (self-wrapping)
// instead of being applied externally by Diagnostics.
import { DEBUG } from '../config/FeatureFlags.js';
if (DEBUG && FEATURE_FLAGS.DIAGNOSTICS) {
  const _performDrawForTiming = performDraw;
  performDraw = function(...args){ return PerfMonitor.time('renderPipeline', ()=>_performDrawForTiming.apply(this,args)); };
}

// Backward-compatible alias — anything elsewhere in the app that
// still calls draw() gets scheduled through the same rAF path rather
// than forcing an immediate synchronous redraw.
export function draw(){ requestRedraw(); }

// Wire the scheduler to this module's performDraw — see the note in
// scheduler.js on why this indirection exists (avoids a circular
// import between scheduler.js, renderer.js, and viewport.js).
setDrawCallback((...args)=>performDraw(...args));
