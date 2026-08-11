# API Reference

Every function below is `export`ed from its listed module. This is a
reference for the **most important, stable** entry points — for the full
list, the source is the ground truth (each function also carries a JSDoc
block in-file with complexity and side-effect notes).

## `core/graph.js`

```js
buildGraph() -> { graph, stationLines }
```
Builds the line-aware weighted graph from `ST`/`SEQS`. Runs once at import
time; `GRAPH` and `STATION_LINES` are the exported results.

## `core/dijkstra.js`

```js
dijkstra(srcKey: string) -> { dist, ixCnt, prev, bestNode }
```
Shortest path (travel time + interchange penalty) from `srcKey` to every
reachable station.

## `core/routing.js`

```js
getPath(dResult, src, dst) -> string[]
getDetailedPath(dResult, src, dst) -> Array<{station, line}>
getRouteDetail(fromKey, toKey, dResult) -> {
  from, to, path, detailed, costMin, stopCount, linesUsed,
  interchanges, interchangeStations, interchangeCount,
  noInterchange, hints, fare: {normal, smart}
}
detectInterchanges(detailedPath) -> Array<{station, fromLine, toLine}>
getLinesInOrder(detailedPath) -> string[]
collapseToStationLine(detailedPath) -> Array<{station, line}>
```

## `core/fares.js`

```js
calcFare(stopCount: number) -> { normal: number, smart: number }
```
Official BMRCL fare slabs.

## `core/optimization.js`

```js
findOptimal(friendStKeys: string[]) -> Candidate | null
getStationAttractiveness(stationKey: string) -> number
```
`Candidate` = `{ key, ...ST[key], costs, totalIx, dResults, attractiveness, attractivenessBonus }`.

## `places/PlacesService.js`

```js
getNearbyPlacesForStation(stationKey: string) -> Promise<NormalizedPlace[]>
```
`NormalizedPlace` = `{ name, category, latitude, longitude, rating, distance, source }`.

## `places/providers/*.js`

Every provider class implements:
```js
async getNearbyPlaces(stationKey: string, categories: string[]) -> Promise<NormalizedPlace[]>
```

## `rendering/viewport.js`

```js
normToCanvas(nx, ny) -> {x, y}
canvasToNorm(cx, cy) -> {nx, ny}
stationCanvasPos(stationKey) -> {x, y}
resize() / resetView() / zoom(factor)
```

## `rendering/schematic.js`

```js
buildSchematicCoords() -> Object<string, {x, y}>
schematicNorm(stationKey) -> {x, y}   // normalized [0,1] space
```

## `rendering/renderer.js`

```js
performDraw()          // single-frame draw entry point — call requestRedraw() instead
renderStaticLayer(W, H) -> dotPositions
draw()                  // backward-compatible alias for requestRedraw()
```

## `rendering/scheduler.js`

```js
requestRedraw()                 // coalesced, rAF-scheduled
setDrawCallback(fn)             // wiring hook (used once, by main.js)
```

## `ai/ContextBuilder.js`

```js
buildAppContext() -> { friends, vibe, meetup, routes, nearbyPlacesShown }
```

## `ai/DirectAnswers.js`

```js
contextAwareAnswer(q: string, ctx: object) -> string | null
```

## `ai/ClaudeProvider.js`

```js
async askClaudeWithContext(userMsg: string, ctx: object) -> Promise<string>
```
Throws on any failure (network, non-OK response, empty text) — callers
should catch and fall back.

## `ai/OfflineBot.js`

```js
offlineBotReply(msg: string) -> string
```
Always returns a non-empty, helpful string — the final fallback layer.

## `diagnostics/Diagnostics.js` *(DEBUG-only)*

```js
Diagnostics.register(suite: string, name: string, fn: () => void | Promise<void>)
Diagnostics.assert(cond: boolean, message?: string)
await Diagnostics.runDiagnostics() -> {
  totalTests, passed, failed, executionMs, coverage, timings, results
}
```

## `diagnostics/PerformanceMonitor.js`

```js
PerfMonitor.time(label, fn)
PerfMonitor.record(label, ms)
PerfMonitor.recordCacheHit(label) / recordCacheMiss(label)
PerfMonitor.summary() / cacheSummary() / memoryUsage()
```

## `diagnostics/Logger.js`

```js
Logger.debug/info/warn/error/performance(subsystem: string, message: string, data?: object)
Logger.getRecent(n?: number)
Logger.getSubsystems()
```

## `diagnostics/ErrorBoundary.js`

```js
ErrorBoundary.guard(subsystem, fn, fallbackValue, context?)
ErrorBoundary.guardAsync(subsystem, fn, fallbackValue, context?)
ErrorBoundary.missingStation(stationKey) / missingRoute(from, to) / missingAsset(name)
```

## `main.js`

```js
window.exportDebugReport() -> object   // always available, no PII
window.runDiagnostics()                 // only when DEBUG && FEATURE_FLAGS.DIAGNOSTICS
```
