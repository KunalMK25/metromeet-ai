// ═══════════════════════════════════════════════════════════
//  config/FeatureFlags.js
//  Relocated from the monolith's "PRODUCTION READINESS &
//  OBSERVABILITY LAYER" section, byte-identical bodies.
// ═══════════════════════════════════════════════════════════

// ── Single DEBUG flag — gates the Diagnostics suite and the dev
// overlay. Flip to true and reload to enable either (each also has
// its own FEATURE_FLAGS switch below).
export const DEBUG = false;

/**
 * Feature Flags module — single source of truth for togglable behavior.
 * @summary Purpose: every subsystem below reads one of these instead
 *   of a hardcoded boolean, so a feature can be turned on/off in
 *   exactly one place (here) without editing the subsystem itself.
 *   DIAGNOSTICS and PERFORMANCE_OVERLAY additionally require DEBUG=true.
 * @property {boolean} AI_ASSISTANT - context-aware chat + Claude/offline fallback (read by sendMsg)
 * @property {boolean} LIVE_PLACES - try the live (OSM) places provider before static (read by fetchPlaces)
 * @property {boolean} RENDER_CACHE - cache the static map layer between frames (read by performDraw)
 * @property {boolean} DIAGNOSTICS - load the Diagnostics test suite (read at script load)
 * @property {boolean} PERFORMANCE_OVERLAY - show the on-screen dev overlay (read at script load)
 * @sideEffects None — a plain data object; toggling a value takes
 *   effect the next time the relevant subsystem reads it.
 */
// ── Feature flags — every subsystem reads one of these instead of
// a hardcoded true/false, so a feature can be toggled in exactly
// one place without touching the subsystem itself.
export const FEATURE_FLAGS = {
  AI_ASSISTANT: true,        // context-aware chat + Claude/offline fallback
  LIVE_PLACES: true,         // try the live (OSM) places provider before static
  RENDER_CACHE: true,        // cache the static map layer between frames
  DIAGNOSTICS: true,         // load the Diagnostics test suite (also needs DEBUG=true)
  PERFORMANCE_OVERLAY: true, // show the on-screen dev overlay (also needs DEBUG=true)
};
