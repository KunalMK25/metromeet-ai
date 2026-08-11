# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses its own `appVersion` (see `src/config/Version.js`)
rather than strict SemVer, since it's an application, not a published
package.

## [6.0.0] — Modular architecture & production readiness

### Added
- Full migration from a single-file monolith to a modular ES module
  architecture (`data/ → core/ → places/ → rendering/ → ai/ → ui/ → main.js`)
  with zero behavioral changes.
- **Diagnostics framework**: 29 automated tests across Graph, Routing,
  Optimization, Places, Renderer, and AI suites — DEBUG-gated, isolated from
  production paths.
- **Performance layer**: `PerformanceMonitor` (timing + cache hit/miss +
  memory usage), a DEBUG-gated developer overlay, and `exportDebugReport()`.
- **Feature flags**: `AI_ASSISTANT`, `LIVE_PLACES`, `RENDER_CACHE`,
  `DIAGNOSTICS`, `PERFORMANCE_OVERLAY` — every subsystem reads from these
  instead of hardcoded booleans.
- **Error boundaries** for Places provider failures, AI request failures,
  canvas rendering exceptions, and missing station/route/asset lookups.
- **Rendering performance rewrite**: requestAnimationFrame-coalesced redraw
  scheduler, cached offscreen static bitmap (regenerated only on real
  viewport changes), and a zoom/size-keyed label-collision-layout cache.
- **Context-aware AI assistant**: a structured `buildAppContext()` snapshot,
  a data-grounded direct-answer layer, and a real Claude API integration
  with automatic offline fallback.
- **Modular Places provider architecture**: `StaticPlacesProvider`,
  `OSMPlacesProvider` (live Overpass API), and a `GooglePlacesProvider` stub,
  behind one shared interface with automatic fallback and per-station caching.
- **Schematic (BMRCL-style) map renderer** replacing the earlier
  geography-accurate map — even stop-spacing, proper line branching (Yellow
  Line branches from Green at RV Road), collision-avoiding labels.
- **Searchable station autocomplete** (keyboard + mouse navigable) replacing
  the original `<select>` dropdown.
- Comprehensive JSDoc across every major module; a full architecture summary
  and release checklist at the top of the (then-monolithic) source.

### Changed
- Meetup recommendation scoring extended to include a **Station
  Attractiveness Score** (nearby cafes/restaurants/malls/parks/arcades/bars,
  within ~5km) as a tie-breaker, behind travel fairness and interchange count.

### Fixed
- **Interchange detection bug**: routes that stayed on a single line through
  a physical interchange station (e.g. Green Line via RV Road) were
  incorrectly charged an interchange penalty. Fixed by deriving interchanges
  from the actual line-aware graph traversal instead of a station-name flag —
  regression-tested in the Diagnostics Routing suite.
- Dropped station-spacing checkpoints that crammed 12 real stations into the
  shortest schematic segment on the map while giving a 1-station segment the
  most space — rebalanced to even per-stop spacing.
- A dropped `const canvas = ...` declaration during the renderer migration
  (caught immediately via a full functional boot test, not just a syntax
  check).

## [5.x] — Feature build-out (pre-modularization)

- Weighted graph + Dijkstra routing engine (replacing an earlier array-based
  line model).
- Fairness-first meetup optimization algorithm.
- Full route reconstruction (station-by-station path, fare, interchange
  detection) per friend.
- Initial nearby-places drawer (static curated dataset).
- Offline rule-based chatbot (routes, fares, interchanges, timings).

## [1.0.0] — Initial release

- Single-file HTML/CSS/JS application.
- Static station/line data for Purple, Green, and Yellow lines.
- Basic meetup-point suggestion.
