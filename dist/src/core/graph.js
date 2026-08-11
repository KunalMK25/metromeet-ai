import { ST } from '../data/stations.js';
import { SEQS } from '../data/sequences.js';

// ═══════════════════════════════════════════════════════════
//  GRAPH-BASED ROUTING ENGINE — WEIGHTED GRAPH + DIJKSTRA
//
//  The metro network is modelled as a true weighted graph:
//  every station is a node, and every pair of adjacent stations
//  on a line is an EDGE carrying {destination, travel time, line}.
//
//  Interchanges are NEVER hardcoded to a station name. Instead,
//  a physical station that is served by more than one line is
//  represented internally as one graph-node PER LINE (e.g. RV
//  Road becomes "RV Road::Green" and "RV Road::Yellow"), and
//  those per-line nodes are linked by an "interchange edge"
//  whose weight is the transfer penalty. A route that travels
//  straight through on a single line simply never touches that
//  interchange edge — so Green→Green at RV Road, or Purple→Purple
//  anywhere, can never be charged a penalty. A penalty is only
//  ever applied when the previous edge and the next edge actually
//  belong to different lines.
//
//  Adding a future metro line is a one-line change to LINES below
//  — no interchange logic needs to be touched.
// ═══════════════════════════════════════════════════════════

// Stop-to-stop: ~2 min average on Bangalore metro
// Interchange penalty: +7 min (walk + wait) at Majestic, +4 min at RV Road
export const STOP_MIN          = 2;   // minutes per inter-station hop
export const IX_PENALTY         = { "Majestic": 7, "RV Road": 4 };
export const DEFAULT_IX_PENALTY = 5;  // fallback transfer penalty for any future interchange

// Line definitions — the graph, Dijkstra routing, and interchange
// detection all derive from this map. To add a new line (e.g. a
// future Blue or Pink Line), just add its station sequence here.
export const LINES = { Purple: SEQS.Purple, Green: SEQS.Green, Yellow: SEQS.Yellow };

export const nodeId = (station, line) => `${station}::${line}`;

// Build a line-aware weighted graph.
//  graph:        nodeId ("Station::Line") -> [{to, cost, line, station}]
//  stationLines: station -> Set of line names that serve it
/**
 * Graph module — builds a line-aware weighted graph from ST/SEQS.
 * @summary Purpose: turn the flat per-line station sequences (SEQS)
 *   into a proper graph where every physical station served by more
 *   than one line becomes several graph nodes (one per line), linked
 *   by "interchange edges" carrying the transfer penalty. This is
 *   what lets Dijkstra treat a same-line trip and a line-changing
 *   trip correctly without any hardcoded per-station logic.
 * @returns {{graph: Object<string,Array>, stationLines: Object<string,Set<string>>}}
 *   graph: nodeId ("Station::Line") -> [{to, cost, line, station}]
 *   stationLines: station name -> Set of line names serving it
 * @complexity O(S + E) where S = total stations across all lines and
 *   E = edges produced (line hops + interchange links); runs once.
 * @sideEffects None — pure function, reads only the module-level
 *   ST/SEQS/IX_PENALTY/DEFAULT_IX_PENALTY constants above it.
 */
export function buildGraph() {
  const graph = {};
  const stationLines = {};

  const ensureNode = (id) => { if (!graph[id]) graph[id] = []; };

  for (const [lineName, seq] of Object.entries(LINES)) {
    for (const st of seq) {
      if (!ST[st]) continue;
      if (!stationLines[st]) stationLines[st] = new Set();
      stationLines[st].add(lineName);
    }
    for (let i = 0; i < seq.length - 1; i++) {
      const a = seq[i], b = seq[i + 1];
      if (!ST[a] || !ST[b]) continue;
      const na = nodeId(a, lineName), nb = nodeId(b, lineName);
      ensureNode(na); ensureNode(nb);
      // Edge weight = travel time only. Line is carried on the edge
      // itself so Dijkstra can tell whether a hop changes lines.
      graph[na].push({ to: nb, cost: STOP_MIN, line: lineName, station: b });
      graph[nb].push({ to: na, cost: STOP_MIN, line: lineName, station: a });
    }
  }

  // Interchange edges: for any physical station served by 2+ lines,
  // connect every pair of its line-nodes with the transfer penalty.
  // This is the ONLY place an interchange penalty is introduced —
  // it is derived purely from a station appearing on multiple line
  // sequences, never from a hardcoded station name check.
  for (const [station, lineSet] of Object.entries(stationLines)) {
    const lineArr = Array.from(lineSet);
    if (lineArr.length < 2) continue; // single-line station: no penalty edges
    const penalty = IX_PENALTY[station] ?? DEFAULT_IX_PENALTY;
    for (const fromLine of lineArr) {
      for (const toLine of lineArr) {
        if (fromLine === toLine) continue;
        const from = nodeId(station, fromLine), to = nodeId(station, toLine);
        ensureNode(from); ensureNode(to);
        graph[from].push({ to, cost: penalty, line: toLine, station });
      }
    }
  }

  return { graph, stationLines };
}

export const { graph: GRAPH, stationLines: STATION_LINES } = buildGraph();

