import { friends, vibe, lastResult, lastDisplayedPlaces } from '../rendering/state.js';

/**
 * AI module — application-state context builder.
 * @summary Purpose: assemble a single, plain, serializable snapshot
 *   of everything the assistant might need — friends, vibe, the
 *   chosen meetup station, every friend's route, and the places
 *   currently displayed — by reading already-computed data (never
 *   recomputing dijkstra/findOptimal/route details itself).
 * @returns {{friends:Array, vibe:string, meetup:(Object|null),
 *   routes:Array, nearbyPlacesShown:Array}}
 * @complexity O(F) where F = number of friends (routes/costs are
 *   already computed; this just reshapes them).
 * @sideEffects None — pure read of module-level friends/vibe/
 *   lastResult/lastDisplayedPlaces.
 */
// A structured, serializable snapshot of the current app state.
export function buildAppContext(){
  const ctx = {
    friends: friends.map(f => ({ name: f.name, station: f.stKey })),
    vibe,
    meetup: null,
    routes: [],
    nearbyPlacesShown: lastDisplayedPlaces.slice(0, 15).map(p => ({
      name: p.name,
      category: p.category,
      distanceKm: p.distance!=null ? Math.round(p.distance*100)/100 : null,
      latitude: p.latitude,
      longitude: p.longitude,
      rating: p.rating,
      source: p.source,
    })),
  };

  if (lastResult){
    const opt = lastResult.opt;
    ctx.meetup = {
      station: opt.key,
      line: opt.li,
      isInterchangeHub: opt.li === 'Interchange',
      longestTravelMin: lastResult.maxT,
      averageTravelMin: lastResult.avgT,
      fairnessGapMin: lastResult.spread,
      fairnessPercent: lastResult.fairnessPct,
      totalInterchanges: opt.totalIx,
      stationAttractivenessScore: typeof opt.attractiveness==='number' ? Math.round(opt.attractiveness*10)/10 : null,
    };
    // Routes are read straight from the routeDetails already produced by
    // getRouteDetail()/Dijkstra in findMeet() — never recomputed here.
    ctx.routes = lastResult.friends.map((f,i) => {
      const rd = lastResult.routeDetails[i];
      return {
        friend: f.name,
        from: f.stKey,
        to: opt.key,
        travelMinutes: rd.costMin,
        stops: rd.stopCount,
        linesUsed: rd.linesUsed,
        interchangeCount: rd.interchangeCount,
        interchangeStations: rd.interchangeStations,
        fareNormal: rd.fare.normal,
        fareSmartCard: rd.fare.smart,
        fullPath: rd.path,
      };
    });
  }
  return ctx;
}

// ── Optional production timing instrumentation ─────────────
// See core/dijkstra.js for why this lives here instead of being
// applied externally by Diagnostics.
import { DEBUG, FEATURE_FLAGS } from '../config/FeatureFlags.js';
import { PerfMonitor } from '../diagnostics/PerformanceMonitor.js';
if (DEBUG && FEATURE_FLAGS.DIAGNOSTICS) {
  const _buildAppContext = buildAppContext;
  buildAppContext = function(...args){ return PerfMonitor.time('aiContextBuild', ()=>_buildAppContext.apply(this,args)); };
}
