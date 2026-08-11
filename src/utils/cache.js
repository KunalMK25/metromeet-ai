// ═══════════════════════════════════════════════════════════
//  utils/cache.js
//
//  The monolith's caches (places/PlacesService.js's per-station
//  Promise cache, rendering/labels.js's scale-keyed label layout
//  cache, rendering/renderer.js's viewport-keyed static-bitmap
//  cache, core/optimization.js's attractiveness cache) were each
//  purpose-built with different keying/invalidation strategies —
//  there was no shared generic cache helper to extract without
//  inventing new behavior that wasn't in the original code.
//
//  Kept as the home for a future generic cache primitive (e.g. an
//  LRU cache) if one is introduced later; exports nothing today.
// ═══════════════════════════════════════════════════════════
export {};
