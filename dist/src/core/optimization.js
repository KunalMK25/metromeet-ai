import { ST } from '../data/stations.js';
import { PLACES_DB } from '../data/places-db.js';
import { dijkstra } from './dijkstra.js';

//  STATION ATTRACTIVENESS — PLUGGABLE PLACE-PROVIDER LAYER
//  Scores how good the hangout options are within ~5km of a
//  candidate meetup station, so the recommendation can prefer a
//  livelier spot when travel times are close between candidates.
//  Data access is abstracted behind a small provider interface so
//  a future live API (Google Places, OpenStreetMap, Foursquare,
//  ...) can be plugged in later just by implementing its
//  getPlacesNear() and flipping ACTIVE_PLACE_PROVIDER — nothing
//  else here, and nothing in the routing engine, needs to change.
// ═══════════════════════════════════════════════════════════

// Attractiveness radius — matches the existing "Nearby Places" drawer (5km)
export const ATTRACTIVENESS_RADIUS_KM = 5;

// Relative importance per hangout category. "entertainment" is kept
// as its own bucket for future data sources (movies, gaming lounges,
// etc.) even though today's static provider files most of that
// under "arcade".
export const CATEGORY_WEIGHTS = {
  cafe: 1.0,
  restaurant: 1.1,
  mall: 1.3,
  park: 1.0,
  arcade: 1.0,
  bar: 1.0,
  entertainment: 1.0,
};

// A place provider only needs to implement getPlacesNear(stationKey)
// and resolve to [{type, rating, distanceKm}, ...]. Swap which
// provider is ACTIVE below to upgrade data sources — the scoring
// function and the routing engine never need to change.
export const PlaceProviders = {
  // Wraps today's curated static database (PLACES_DB) — the
  // provider in use until a live API is wired in.
  static: {
    name: 'static-db',
    getPlacesNear(stationKey) {
      let list = PLACES_DB[stationKey];
      if (!list) {
        const keys = Object.keys(PLACES_DB);
        const partial = keys.find(k => stationKey.includes(k) || k.includes(stationKey.split(' ')[0]));
        list = partial ? PLACES_DB[partial] : null;
      }
      if (!list) return [];
      return list.map(p => ({
        type: p.t,
        rating: parseFloat(p.r) || 0,
        distanceKm: parseFloat(p.d) || ATTRACTIVENESS_RADIUS_KM,
      }));
    },
  },
  // Placeholders for future data sources — implement getPlacesNear()
  // against the real API and set ACTIVE_PLACE_PROVIDER to switch.
  googlePlaces: { name: 'google-places', getPlacesNear(stationKey) { throw new Error('googlePlaces provider not implemented yet'); } },
  osm:          { name: 'openstreetmap', getPlacesNear(stationKey) { throw new Error('osm provider not implemented yet'); } },
  foursquare:   { name: 'foursquare',    getPlacesNear(stationKey) { throw new Error('foursquare provider not implemented yet'); } },
};

// The provider currently powering attractiveness scoring. Change
// this one line to upgrade the data source later.
export const ACTIVE_PLACE_PROVIDER = PlaceProviders.static;

const _attractivenessCache = {};

// Station Attractiveness Score for a candidate meetup station: sums
// nearby places (within ATTRACTIVENESS_RADIUS_KM), weighted by
// category and rating, with closer places counting slightly more
// and a small bonus for category variety. Higher = more attractive.
/**
 * Optimization module — Station Attractiveness Score.
 * @summary Purpose: quantify how good the hangout options are near a
 *   candidate meetup station (cafes/restaurants/malls/parks/arcades/
 *   bars within ATTRACTIVENESS_RADIUS_KM), so findOptimal() can use
 *   it as a tie-breaker when travel fairness is close between two
 *   candidates. Results are memoized per station for the session.
 * @param {string} stationKey - candidate station name
 * @returns {number} raw attractiveness score (higher = more attractive)
 * @complexity O(P) where P = places returned by ACTIVE_PLACE_PROVIDER
 *   for that station; O(1) on cache hit.
 * @sideEffects Writes to the module-level _attractivenessCache.
 */
export function getStationAttractiveness(stationKey) {
  if (_attractivenessCache[stationKey] !== undefined) return _attractivenessCache[stationKey];

  const places = ACTIVE_PLACE_PROVIDER.getPlacesNear(stationKey)
    .filter(p => p.distanceKm <= ATTRACTIVENESS_RADIUS_KM);

  let score = 0;
  const categoriesSeen = new Set();
  for (const p of places) {
    const weight = CATEGORY_WEIGHTS[p.type] ?? 1.0;
    const proximityFactor = Math.max(0.4, 1 - (p.distanceKm / ATTRACTIVENESS_RADIUS_KM) * 0.6);
    score += (p.rating || 3.5) * weight * proximityFactor;
    categoriesSeen.add(p.type);
  }
  score += categoriesSeen.size * 2; // reward variety of hangout options

  _attractivenessCache[stationKey] = score;
  return score;
}

// Weight applied to attractiveness inside the final meetup score —
// tune to make nearby hangouts matter more or less vs. travel time.
export const ATTRACTIVENESS_WEIGHT = 1.0;

/**
 * Optimization module — fairness-first, context-aware meetup picker.
 * @summary Purpose: choose the single best meetup station out of every
 *   operational station, given each friend's home station. Uses
 *   dijkstra() (Routing) for travel data and getStationAttractiveness()
 *   for nearby-hangout data — never recomputes either from scratch,
 *   and never mutates the graph or routing state.
 * @param {string[]} friendStKeys - one station name per friend
 * @returns {(Object|null)} the winning candidate: {key, ...ST[key],
 *   costs, totalIx, dResults, attractiveness, attractivenessBonus} —
 *   or null if no station is reachable from every friend.
 * @complexity O(N × D) where N = number of operational stations and
 *   D = cost of one dijkstra() call (see dijkstra's own complexity).
 * @sideEffects None on the graph/optimization data; reads the
 *   attractiveness cache (may populate it via getStationAttractiveness).
 */
// THE MAIN ALGORITHM — FAIRNESS-FIRST, CONTEXT-AWARE
// Goal: find the station where NO ONE person has to travel significantly
// more than anyone else, breaking near-ties in favour of a livelier
// surrounding area. Spread (max-min) is still the PRIMARY objective.
//
// Final Score (lower = better) =
//     Travel Score + Fairness Score + Interchange Penalty − Station Attractiveness Bonus
//
//   Travel Score        = maxCost × 2.5  +  total × 0.5
//                         (strongly punish the longest journey, small weight for total efficiency)
//   Fairness Score       = spread² × 3.0
//                         (heavily penalise inequality — squared = exponential pain for outliers)
//   Interchange Penalty  = totalIx × 8
//                         (prefer fewer interchanges)
//   Attractiveness Bonus = Station Attractiveness Score × ATTRACTIVENESS_WEIGHT
//                         (subtracted — a livelier station scores better)
//
// This means: if two stations have nearly identical travel/fairness
// scores, the one with meaningfully better nearby hangout options
// wins. Travel time and fairness still dominate the decision overall.
export function findOptimal(friendStKeys) {
  const dResults = friendStKeys.map(k => dijkstra(k));

  let best = null, bestScore = Infinity;
  for (const [candKey, candSt] of Object.entries(ST)) {
    if (!candSt.op) continue;

    const costs = dResults.map(r => r.dist[candKey] ?? Infinity);
    if (costs.some(c => c === Infinity)) continue;

    const total   = costs.reduce((a, b) => a + b, 0);
    const maxCost = Math.max(...costs);
    const minCost = Math.min(...costs);
    const spread  = maxCost - minCost;
    const totalIx = dResults.reduce((sum, r) => sum + (r.ixCnt[candKey] || 0), 0);

    const travelScore        = (maxCost * 2.5) + (total * 0.5);
    const fairnessScore      = spread * spread * 3.0;
    const interchangePenalty = totalIx * 8;
    const attractiveness     = getStationAttractiveness(candKey);
    const attractivenessBonus = attractiveness * ATTRACTIVENESS_WEIGHT;

    // Final Score = Travel Score + Fairness Score + Interchange Penalty − Station Attractiveness Bonus
    const score = travelScore + fairnessScore + interchangePenalty - attractivenessBonus;

    if (score < bestScore) {
      bestScore = score;
      best = {
        key: candKey,
        ...candSt,
        name: candKey,
        costs,
        totalIx,
        dResults,
        attractiveness,        // raw Station Attractiveness Score (nearby hangouts, ~5km)
        attractivenessBonus,   // weighted bonus subtracted from the final score
      };
    }
  }
  return best;
}

// ── Optional production timing instrumentation ─────────────
// See core/dijkstra.js for why this lives here instead of being
// applied externally by Diagnostics (ES modules can't reassign an
// imported binding from outside its owning module).
import { DEBUG, FEATURE_FLAGS } from '../config/FeatureFlags.js';
import { PerfMonitor } from '../diagnostics/PerformanceMonitor.js';
if (DEBUG && FEATURE_FLAGS.DIAGNOSTICS) {
  const _findOptimal = findOptimal;
  findOptimal = function(...args){ return PerfMonitor.time('findOptimal', ()=>_findOptimal.apply(this,args)); };
}
