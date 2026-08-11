// ═══════════════════════════════════════════════════════════
//  rendering/labels.js
//  Relocated from the monolith, byte-identical bodies.
// ═══════════════════════════════════════════════════════════
import { SCHEMATIC_W, SCHEMATIC_H, STATION_GEOMETRY_CACHE } from './schematic.js';
import { ctx } from './viewport.js';

// ── Label placement helper — tries a few candidate offsets around a
// station dot and skips the label entirely if none are free, so
// crowded stretches stay readable instead of turning into a smear
// of overlapping text. `placed` accumulates this frame's boxes.
export function placeLabel(ctx, text, x, y, r, placed){
  const w = ctx.measureText(text).width;
  const h = 11;
  const pad = 2;
  const candidates = [
    {x: x - w/2,        y: y - r - h - 3},        // above
    {x: x - w/2,        y: y + r + 3},             // below
    {x: x + r + 4,       y: y - h/2},               // right
    {x: x - r - 4 - w,   y: y - h/2},               // left
  ];
  for(const box of candidates){
    const bx = {l:box.x-pad, r:box.x+w+pad, t:box.y-pad, b:box.y+h+pad};
    const overlaps = placed.some(p=>!(bx.r<p.l || bx.l>p.r || bx.b<p.t || bx.t>p.b));
    if(!overlaps){
      placed.push(bx);
      return { x: box.x + w/2, y: box.y, above: box===candidates[0] };
    }
  }
  return null; // no free spot — skip this label
}

// ── Label layout cache ───────────────────────────────────────
// Collision-avoidance placement only depends on ZOOM (vpScale) and
// canvas size — panning translates every point equally, so it never
// changes which labels overlap or which offset was chosen. Layout is
// computed in "pan-independent" pixel space (vpX/vpY = 0) and cached
// by (scale,W,H); a pure pan redraw reuses it untouched, which is
// what requirement 5 ("avoid recomputing label placement every
// frame") is about — panning/hovering/friend updates never touch
// this pass, only an actual zoom or resize does.
export let labelLayoutCache=null; // { scale, W, H, items:[{key,dx,dy,font,isIx}] }

/**
 * Renderer module — collision-avoiding label layout (cached).
 * @summary Purpose: decide which station labels to draw and where,
 *   trying above/below/left/right offsets around each dot and
 *   skipping a label entirely if no free spot exists. Computed in
 *   pan-independent pixel space (translation doesn't change which
 *   labels collide), so callers cache the result by (scale,W,H) and
 *   only add the current pan offset at draw time — see getLabelLayout.
 * @param {number} scale - current vpScale (zoom level)
 * @param {number} W - canvas width in px
 * @param {number} H - canvas height in px
 * @returns {Array<{key:string,dx:number,dy:number,font:string,isIx:boolean}>}
 *   one entry per station whose label is actually shown.
 * @complexity O(N log N) dominated by the collision-check pass over
 *   visible stations (N ≤ total operational stations).
 * @sideEffects Uses the shared canvas `ctx` for text measurement only.
 */
export function computeLabelLayout(scale,W,H){
  const showTier1 = scale > 1.1;
  const showTier2 = scale > 1.8;
  const placed=[];
  const items=[];
  for(const s of STATION_GEOMETRY_CACHE){
    if(s.tier===1 && !showTier1) continue;
    if(s.tier===2 && !showTier2) continue;
    const isIx = s.tier===0;
    const r = isIx ? Math.max(5,7*scale) : Math.max(3,4.5*scale);
    // pan-independent pixel position (same math as normToCanvas minus vpX/vpY)
    const x = (s.x/SCHEMATIC_W) * W * scale;
    const y = (s.y/SCHEMATIC_H) * H * scale;
    const font = `${isIx?'bold ':''} ${Math.min(11,9*scale)}px 'Bricolage Grotesque',sans-serif`;
    ctx.font = font;
    const pos = placeLabel(ctx, s.key, x, y, r, placed);
    if(pos) items.push({ key:s.key, dx:pos.x-x, dy:pos.y-y, font, isIx });
  }
  return items;
}

export function getLabelLayout(scale,W,H){
  const c = labelLayoutCache;
  if(c && c.scale===scale && c.W===W && c.H===H) return c.items;
  const items = computeLabelLayout(scale,W,H);
  labelLayoutCache = { scale, W, H, items };
  return items;
}
