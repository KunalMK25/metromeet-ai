// ═══════════════════════════════════════════════════════════
//  rendering/scheduler.js
//  Relocated from the monolith's "Rendering scheduler" comment
//  block. PROTECTED — do not modify requestRedraw's behavior.
//
//  NOTE ON THE setDrawCallback SEAM: the monolith's requestRedraw()
//  called performDraw() directly by name (both were in the same
//  script, so no import was needed). In the modular build,
//  renderer.js (which defines performDraw) necessarily imports
//  viewport.js, and viewport.js necessarily imports requestRedraw
//  from here — so this file must NOT import renderer.js, or the
//  three files would form a circular import
//  (scheduler → renderer → viewport → scheduler).
//  setDrawCallback() is the standard dependency-inversion fix:
//  main.js wires `setDrawCallback(performDraw)` once at startup,
//  and requestRedraw() calls whatever was registered — the observed
//  behavior (one coalesced performDraw() per animation frame) is
//  unchanged; only how the two functions find each other changed.
// ═══════════════════════════════════════════════════════════

// Every state change that affects the map (pan, zoom, resize, hover,
// friend markers, meetup marker) calls requestRedraw() instead of
// drawing immediately. Multiple invalidations within the same frame
// (e.g. several mousemove events) collapse into a single rAF-scheduled
// draw, and if nothing ever changes, no draw ever runs.
let redrawRequested=false;

let _drawCallback = () => {};
/** Registers the function requestRedraw() invokes each scheduled frame (wired once in main.js to performDraw). */
export function setDrawCallback(fn){ _drawCallback = fn; }

export function requestRedraw(){
  if(redrawRequested) return;
  redrawRequested=true;
  requestAnimationFrame(()=>{ redrawRequested=false; _drawCallback(); });
}
