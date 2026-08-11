import { IX_PENALTY, DEFAULT_IX_PENALTY } from './graph.js';
import { calcFare } from './fares.js';

// Reconstruct the detailed (station, line) chain for a route, then
// collapse it into a plain list of physical stations for display.
export function getDetailedPath(dResult, src, dst) {
  const startNode = dResult.bestNode[dst];
  if (startNode === undefined) return [];
  const chain = [];
  let cur = startNode;
  while (cur !== undefined) {
    const sep = cur.lastIndexOf('::');
    chain.unshift({ station: cur.slice(0, sep), line: cur.slice(sep + 2) });
    cur = dResult.prev[cur];
  }
  return chain;
}

// Reconstruct path (plain station keys) from src to dst
export function getPath(dResult, src, dst) {
  const detailed = getDetailedPath(dResult, src, dst);
  const path = [];
  for (const step of detailed) {
    if (path[path.length - 1] !== step.station) path.push(step.station);
  }
  if (path.length === 0) path.push(dst);
  if (path[0] !== src) path.unshift(src);
  return path;
}

// ── REUSABLE ROUTE-EXPLANATION HELPERS ──────────────────────
// These all work off the detailed (station, line) chain that
// getDetailedPath() produces for an actual Dijkstra route, so
// every interchange they report is one the route really takes —
// never a hardcoded station-name lookup.

// Every point along a route where the line actually changes at the
// same physical station: [{station, fromLine, toLine}, ...]
export function detectInterchanges(detailedPath) {
  const out = [];
  for (let i = 0; i < detailedPath.length - 1; i++) {
    const cur = detailedPath[i], nxt = detailedPath[i + 1];
    if (cur.station === nxt.station && cur.line !== nxt.line) {
      out.push({ station: cur.station, fromLine: cur.line, toLine: nxt.line });
    }
  }
  return out;
}

// Ordered, de-duplicated list of lines ridden along a route
// (e.g. ["Purple","Green"] for a Purple→Green trip via Majestic)
export function getLinesInOrder(detailedPath) {
  const lines = [];
  for (const step of detailedPath) {
    if (lines[lines.length - 1] !== step.line) lines.push(step.line);
  }
  return lines;
}

// Collapse the detailed chain down to one entry per physical station
// visited (tagging each with the line it was reached on), for
// station-by-station display purposes.
export function collapseToStationLine(detailedPath) {
  const out = [];
  for (const step of detailedPath) {
    if (out.length === 0 || out[out.length - 1].station !== step.station) {
      out.push({ station: step.station, line: step.line });
    }
  }
  return out;
}

// Get a full, structured route description for one friend's journey
// to the meet station — origin, destination, complete station-by-
// station path, lines used, stop count, travel time, fare, and the
// exact interchange stations (if any), all reconstructed from the
// actual Dijkstra predecessor chain in `dResult`.
/**
 * Routing module — reconstructs a full turn-by-turn route.
 * @summary Purpose: given an already-computed dijkstra() result,
 *   rebuild the actual station-by-station path, lines used, fare,
 *   and interchange stations for one origin/destination pair. Never
 *   re-runs the search — dResult must already contain fromKey/toKey.
 * @param {string} fromKey - origin station name
 * @param {string} toKey - destination station name
 * @param {ReturnType<typeof dijkstra>} dResult - dijkstra() output for fromKey
 * @returns {{from:string, to:string, path:string[], detailed:Array,
 *   costMin:number, stopCount:number, linesUsed:string[],
 *   interchanges:Array, interchangeStations:string[],
 *   interchangeCount:number, noInterchange:boolean, hints:string[],
 *   fare:{normal:number,smart:number}}}
 * @complexity O(P) where P is the number of hops in the path.
 * @sideEffects None — pure function over dResult/GRAPH/ST.
 */
export function getRouteDetail(fromKey, toKey, dResult) {
  const detailed = getDetailedPath(dResult, fromKey, toKey);
  const path = getPath(dResult, fromKey, toKey);
  const costMin = Math.round(dResult.dist[toKey] ?? 0);
  const stopCount = Math.max(0, path.length - 1);

  // Interchanges are derived straight from the route actually taken —
  // this works for Majestic/RV Road today and any future interchange
  // station automatically, with no station names hardcoded.
  const interchanges = detectInterchanges(detailed);
  const interchangeStations = interchanges.map(ix => ix.station);
  const linesUsedList = getLinesInOrder(detailed);
  const hints = interchanges.map(ix => {
    const penalty = IX_PENALTY[ix.station] ?? DEFAULT_IX_PENALTY;
    return `Change at ${ix.station} for ${ix.toLine} Line (~${penalty} min walk)`;
  });
  const fare = calcFare(stopCount);

  return {
    from: fromKey, to: toKey,
    path, detailed,
    costMin, stopCount,
    linesUsed: linesUsedList,
    interchanges,                              // [{station, fromLine, toLine}]
    interchangeStations,                        // plain station names
    interchangeCount: interchanges.length,
    noInterchange: interchanges.length === 0,   // true → show "No Interchange"
    hints,
    fare,
  };
}

