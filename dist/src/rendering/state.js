// ═══════════════════════════════════════════════════════════
//  rendering/state.js
//  Relocated from the monolith's "STATE" section, byte-identical.
//
//  NOTE ON PLACEMENT: this holds cross-cutting mutable app state
//  (friends, vibe, lastResult, meetContext, lastDisplayedPlaces)
//  that the monolith kept as plain module-level `let` bindings,
//  read by rendering (overlays), ai (ContextBuilder), and ui
//  (FriendsPanel/Drawer) alike. The target tree has no dedicated
//  state module, and placing it in ui/ would force rendering to
//  import from ui/ — backwards per the stated one-directional
//  dependency order (data→core→places→rendering→ai→ui→main).
//  Putting it here, in rendering/ (a layer both ai/ and ui/ are
//  already allowed to depend on), avoids that inversion without
//  changing any function's body or signature — call sites still
//  read/write the exact same bare names, just via ES module
//  live-binding imports instead of implicit global scope.
// ═══════════════════════════════════════════════════════════
export let friends=[], vibe='all', lastResult=null, meetContext=null;
export let lastDisplayedPlaces=[]; // mirrors whatever renderPlaces() last drew, for the AI assistant's context
export const COLORS=['#ff6b35','#38bdf8','#4ade80','#a78bfa','#fb7185','#fbbf24'];

// ES module bindings for primitives (numbers/strings/null) are
// live but read-only to importers — a module that needs to
// reassign vibe/lastResult/meetContext/lastDisplayedPlaces (not
// just mutate an array/object in place) uses these setters so the
// single source of truth stays here.
export function setVibeState(v){ vibe = v; }
export function setLastResult(v){ lastResult = v; }
export function setMeetContext(v){ meetContext = v; }
export function setLastDisplayedPlaces(v){ lastDisplayedPlaces = v; }
