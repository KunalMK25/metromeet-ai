# Performance

## Rendering: cache everything that doesn't have to be recomputed

| What | Cached by | Invalidated when |
|---|---|---|
| Static bitmap (grid, lines, stations, labels) | `renderer.js` (`lastStaticVpKey`) | pan, zoom, or canvas resize |
| Label collision layout | `labels.js` (`labelLayoutCache`, keyed by scale+size) | zoom or resize — **not** by panning |
| Places lookups | `PlacesService.js` (`_nearbyPlacesCache`, per station) | never (session-lifetime cache) |
| Station attractiveness score | `optimization.js` (`_attractivenessCache`, per station) | never (session-lifetime cache) |

## Render scheduling

`requestRedraw()` coalesces every invalidation (pan, zoom, hover change,
friend add/remove, meetup found) into a single `requestAnimationFrame`
callback. Multiple calls within the same frame collapse into one draw; if
nothing changes, nothing redraws.

## `PerformanceMonitor`

A dependency-safe, always-available timing/counter sink (`PerfMonitor`,
importable by any module without triggering the "nothing may depend on
Diagnostics" rule):

```js
PerfMonitor.time('label', () => expensiveCall())      // times sync or async
PerfMonitor.recordCacheHit('staticLayer')              // hit/miss counters
PerfMonitor.summary()                                  // {label: {count,avgMs,maxMs,minMs}}
PerfMonitor.cacheSummary()                              // {label: {hits,misses,hitRatePct}}
PerfMonitor.memoryUsage()                                // {usedMB,totalMB,limitMB} or null
```

Tracked out of the box: `dijkstra`, `findOptimal`, `placesLookup`,
`aiContextBuild`, `renderPipeline`, `staticCacheRegeneration`,
`dynamicOverlayRender`, `frameRender`.

## Dev overlay

DEBUG + `FEATURE_FLAGS.PERFORMANCE_OVERLAY` gated. A small floating readout
(own DOM element, own `requestAnimationFrame` tick loop) showing FPS, frame
time, zoom, pan offset, static/label cache status, places-cache size, friend
count, hover/meetup state.

## `exportDebugReport()`

Always available (not DEBUG-gated — it's read-only and has no UI effect).
Returns performance metrics, cache statistics, feature flags, browser info,
app version, and recent logs as JSON — **excludes friend names, stations,
and chat content**, only counts.

```js
window.exportDebugReport()
```

## Why timing wraps live beside the function they wrap

ES modules don't allow an importing module to reassign an imported binding —
only the module that `export`s a function can later reassign its own
reference. So the timing instrumentation for `dijkstra`, `findOptimal`,
`getNearbyPlacesForStation`, and `buildAppContext` lives as a small
self-wrapping block at the end of each function's *own* module (see the
comment in `core/dijkstra.js`), not centralized in `diagnostics/`. Same
observable effect (every real call gets timed when DEBUG is on), same
gating, zero overhead when DEBUG is off.
