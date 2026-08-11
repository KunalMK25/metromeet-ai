// ═══════════════════════════════════════════════════════════
//  config/Constants.js
//
//  Every constant in the original monolith turned out to belong
//  naturally to a specific domain module rather than a generic
//  "misc constants" bucket, so nothing was force-relocated here
//  just to fill this file:
//    - graph/routing constants (STOP_MIN, IX_PENALTY, ...)  → core/graph.js
//    - fare slabs                                            → core/fares.js
//    - attractiveness weighting                              → core/optimization.js
//    - schematic map geometry (SCHEMATIC_W/H, checkpoints)   → rendering/schematic.js
//    - places radius/category weights                        → places/, data/places-db.js
//
//  This file is kept (per the target architecture) as the home
//  for any FUTURE constant that is genuinely cross-cutting and
//  doesn't belong to one specific module.
// ═══════════════════════════════════════════════════════════
export {};
