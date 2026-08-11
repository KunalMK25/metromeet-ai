import { ST } from '../data/stations.js';
import { SEQS } from '../data/sequences.js';
import { SEQ_COLOR } from '../data/colors.js';
import { ErrorBoundary } from '../diagnostics/ErrorBoundary.js';

// ═══════════════════════════════════════════════════════════
//  SCHEMATIC MAP GEOMETRY — visual only, never touched by routing
//  Purely a rendering concern: it decides WHERE a station is drawn,
//  never whether it's reachable or how routes are computed. The
//  graph (SEQS, buildGraph, dijkstra, findOptimal) knows nothing
//  about this and doesn't need to.
//
//  Each line is a small ordered list of "checkpoints" — a station
//  key plus an (x,y) position on an abstract 0–1000 unit grid.
//  Every other station on that line is then spaced EVENLY between
//  the two checkpoints it falls between, in official sequence
//  order (SEQS). This is how real schematic transit maps are
//  drawn: even stop-spacing rather than true geographic distance,
//  which is exactly what keeps a dense city-centre stretch (many
//  stations, short real distance) readable while a long outer
//  stretch (few stations, long real distance) stays compact and
//  proportional.
//
//  Shared interchange stations (Majestic, RV Road) use the exact
//  same (x,y) in every line that lists them as a checkpoint, so
//  the lines visually meet at one point.
//
//  TO ADD A FUTURE LINE (Blue, Pink, Airport, ...): add one new
//  entry below with its own checkpoints — no other rendering code
//  needs to change.
// ═══════════════════════════════════════════════════════════
export const SCHEMATIC_W = 1000, SCHEMATIC_H = 1000;

export const LINE_CHECKPOINTS = {
  Purple: [
    // Segment lengths below are chosen proportional to how many
    // stations fall between each pair of checkpoints, so no stretch
    // of the line gets crammed relative to how many stops it holds
    // (this was the cause of overlapping stations/markers near
    // Kengeri/Challaghatta — that 12-gap stretch was squeezed into
    // the shortest segment on the whole line).
    {station:'Whitefield',        x:860, y:410},
    {station:'Baiyappanahalli',   x:575, y:410},
    {station:'Trinity',           x:490, y:385},
    {station:'MG Road',           x:468, y:373},
    {station:'Visvesvaraya',      x:413, y:412},
    {station:'Majestic',          x:400, y:430}, // ⇄ Green
    {station:'Magadi Road',       x:357, y:439},
    {station:'Challaghatta',      x:95,  y:486},
  ],
  Green: [
    {station:'Madavara',          x:400, y:46},
    {station:'Yeshwanthpur',      x:400, y:262},
    {station:'Majestic',          x:400, y:430}, // ⇄ Purple
    {station:'Jayanagar',         x:400, y:593},
    {station:'RV Road',           x:400, y:620}, // ⇄ Yellow
    {station:'Silk Institute',    x:400, y:788},
  ],
  Yellow: [
    {station:'RV Road',           x:400,   y:620}, // ⇄ Green (branch point)
    {station:'Central Silk Board',x:485.8, y:662.9},
    {station:'Electronic City',   x:626.6, y:754.5},
    {station:'Bommasandra',       x:703.4, y:812.1},
  ],
};

// Evenly place every station in `seq` along the straight segments
// joining consecutive checkpoints (checkpoints sorted by their
// position in `seq`, so this works regardless of declaration order).
export function interpolateLineSchematic(seq, checkpoints){
  const idxOf = {};
  seq.forEach((s,i)=>{ idxOf[s]=i; });
  const cps = checkpoints
    .filter(c=>idxOf[c.station]!==undefined)
    .sort((a,b)=>idxOf[a.station]-idxOf[b.station]);

  const coords = {};
  for(let c=0;c<cps.length-1;c++){
    const a=cps[c], b=cps[c+1];
    const iA=idxOf[a.station], iB=idxOf[b.station];
    const span=iB-iA;
    for(let i=iA;i<=iB;i++){
      const t = span>0 ? (i-iA)/span : 0;
      coords[seq[i]] = { x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t };
    }
  }
  return coords;
}

/**
 * Renderer module — builds the schematic (BMRCL-style) map layout.
 * @summary Purpose: convert each line's real station sequence into an
 *   evenly-spaced schematic position using LINE_CHECKPOINTS as anchor
 *   points, so dense real-world clusters and long sparse stretches
 *   both render at readable, even stop-spacing (not true geographic
 *   distance). Shared interchange stations (Majestic, RV Road) land
 *   on the exact same coordinate from every line that lists them.
 *   Runs once at load; never touches ST/SEQS/the routing graph.
 * @returns {Object<string,{x:number,y:number}>} station name ->
 *   position on the abstract SCHEMATIC_W × SCHEMATIC_H grid.
 * @complexity O(S) total across all lines (S = stations per line).
 * @sideEffects None — pure function of LINE_CHECKPOINTS/SEQS/ST.
 */
export function buildSchematicCoords(){
  const coords = {};
  for(const [lineName, checkpoints] of Object.entries(LINE_CHECKPOINTS)){
    const seq = SEQS[lineName];
    if(!seq) continue;
    const lineCoords = interpolateLineSchematic(seq, checkpoints);
    for(const [st,pt] of Object.entries(lineCoords)){
      if(!coords[st]) coords[st] = pt; // shared interchange stations already agree
    }
  }
  return coords;
}

// stationKey -> {x,y} in the abstract 0–1000 schematic grid
export const SCHEMATIC = buildSchematicCoords();

export function schematicNorm(stationKey){
  const p = SCHEMATIC[stationKey];
  if(!p){ ErrorBoundary.missingStation(stationKey); return {x:0.5,y:0.5}; } // safety fallback, should never hit for a valid station
  return { x:p.x/SCHEMATIC_W, y:p.y/SCHEMATIC_H };
}

// Station "importance" tier for label decluttering — 0 = interchange
// (always try to label), 1 = line terminus, 2 = everything else.
// Purely presentational; has no bearing on routing.
export function stationLabelTier(stationKey, s){
  if(s.li==='Interchange') return 0;
  for(const seq of Object.values(SEQS)){
    if(seq[0]===stationKey || seq[seq.length-1]===stationKey) return 1;
  }
  return 2;
}



// ═══════════════════════════════════════════════════════════
//  CACHED STATIC GEOMETRY
//  Built ONCE from ST/SEQS/SCHEMATIC at load time. The per-frame
//  draw path never iterates Object.entries(ST)/Object.entries(SEQS)
//  or calls stationLabelTier() again — it only reads these flat
//  arrays. None of this touches the routing graph itself; it's a
//  read-only presentational snapshot of it.
//
//  NOTE ON PLACEMENT: kept here (not renderer.js) because both
//  renderer.js and labels.js need these caches, and putting them in
//  either of those two would create a circular import between them.
//  schematic.js is a lower-level leaf both can safely depend on.
// ═══════════════════════════════════════════════════════════
export const LINE_GEOMETRY_CACHE = Object.entries(SEQS).map(([seqKey,seq])=>({
  color: SEQ_COLOR[seqKey] || '#22d3a0',
  points: seq.filter(n=>ST[n]).map(n=>SCHEMATIC[n]).filter(Boolean), // schematic-space {x,y}
}));

export const STATION_GEOMETRY_CACHE = Object.entries(ST)
  .filter(([,s])=>s.op)
  .map(([key,s])=>({
    key,
    x: SCHEMATIC[key]?.x ?? 0,
    y: SCHEMATIC[key]?.y ?? 0,
    isIx: s.li==='Interchange',
    color: s.co,
    tier: stationLabelTier(key,s),
  }));
