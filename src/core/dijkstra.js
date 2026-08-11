import { GRAPH, STATION_LINES, nodeId } from './graph.js';

// for interchange edges, and is 0 for every same-line travel edge).
/**
 * Routing module — Dijkstra's algorithm over the line-aware graph.
 * @summary Purpose: find the minimum-cost path from srcKey to every
 *   reachable station, where cost = travel time + interchange
 *   penalty. Runs over "Station::Line" nodes internally so a penalty
 *   is only charged when the line actually changes, then collapses
 *   back down to plain station keys for the caller.
 * @param {string} srcKey - origin station name (a key in ST)
 * @returns {{dist:Object<string,number>, ixCnt:Object<string,number>,
 *   prev:Object<string,string>, bestNode:Object<string,string>}}
 *   dist/ixCnt are keyed by plain station name; prev/bestNode are
 *   keyed by graph node id and used by getPath/getDetailedPath to
 *   reconstruct the actual route.
 * @complexity O(V log V + E) with the array-based priority queue
 *   used here degrading to O(V^2) in the worst case — acceptable at
 *   this graph's size (~90 nodes).
 * @sideEffects None — reads only the module-level GRAPH/STATION_LINES.
 */
export function dijkstra(srcKey) {
  const dist     = {};   // nodeId -> min cost in minutes
  const ixCnt    = {};   // nodeId -> number of interchanges needed
  const prevNode = {};   // nodeId -> previous nodeId (for path reconstruction)
  const visited  = new Set();

  for (const id of Object.keys(GRAPH)) { dist[id] = Infinity; ixCnt[id] = 0; }

  const srcLines = STATION_LINES[srcKey] ? Array.from(STATION_LINES[srcKey]) : [];
  const pq = [];
  for (const line of srcLines) {
    const id = nodeId(srcKey, line);
    dist[id] = 0;
    pq.push([0, id]);
  }

  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);         // simple min-heap via sorted array (small graph, fine)
    const [curCost, cur] = pq.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    const curLine = cur.slice(cur.lastIndexOf('::') + 2);

    for (const edge of (GRAPH[cur] || [])) {
      const nxt = edge.to;
      // The edge weight is travel time PLUS interchange penalty:
      // travel edges carry cost = STOP_MIN with the same line as `cur`,
      // interchange edges carry cost = penalty with a DIFFERENT line —
      // so this is the same weight either way, no separate branch needed.
      const newCost = curCost + edge.cost;
      const isTransfer = edge.line !== curLine;
      if (newCost < dist[nxt]) {
        dist[nxt]     = newCost;
        ixCnt[nxt]    = ixCnt[cur] + (isTransfer ? 1 : 0);
        prevNode[nxt] = cur;
        pq.push([newCost, nxt]);
      }
    }
  }

  // Collapse per-line nodes back down to one result per physical
  // station (take whichever line-node reaches it fastest).
  const stationDist = {}, stationIx = {}, bestNode = {};
  for (const id of Object.keys(GRAPH)) {
    const station = id.slice(0, id.lastIndexOf('::'));
    if (dist[id] < (stationDist[station] ?? Infinity)) {
      stationDist[station] = dist[id];
      stationIx[station]   = ixCnt[id];
      bestNode[station]    = id;
    }
  }

  return { dist: stationDist, ixCnt: stationIx, prev: prevNode, bestNode };
}

// ── Optional production timing instrumentation ─────────────
// In the monolith this wrap was applied externally (Diagnostics
// reassigned `dijkstra = function(...)`), which is impossible for an
// imported ES module binding — only the owning module can reassign
// its own exported function. Relocated here, self-contained, with
// identical gating (DEBUG && FEATURE_FLAGS.DIAGNOSTICS) and identical
// observable effect: every real call gets timed via PerfMonitor when
// diagnostics are enabled; zero overhead otherwise.
import { DEBUG, FEATURE_FLAGS } from '../config/FeatureFlags.js';
import { PerfMonitor } from '../diagnostics/PerformanceMonitor.js';
if (DEBUG && FEATURE_FLAGS.DIAGNOSTICS) {
  const _dijkstra = dijkstra;
  dijkstra = function(...args){ return PerfMonitor.time('dijkstra', ()=>_dijkstra.apply(this,args)); };
}
