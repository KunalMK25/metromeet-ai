// ═══════════════════════════════════════════════════════════
//  places/PlacesService.js
//  Relocated from the monolith, byte-identical bodies.
//  PROTECTED — Places provider/service behavior must not change.
// ═══════════════════════════════════════════════════════════
import { PLACES_DB } from '../data/places-db.js';
import { StaticPlacesProvider } from './providers/StaticPlacesProvider.js';
import { OSMPlacesProvider } from './providers/OSMPlacesProvider.js';
import { GooglePlacesProvider } from './providers/GooglePlacesProvider.js';

// Registry of available providers, keyed by name.
export const NEARBY_PLACE_PROVIDERS = {
  static: new StaticPlacesProvider(PLACES_DB),
  osm: new OSMPlacesProvider(),
  googlePlaces: new GooglePlacesProvider(),
};

// Which provider to try first for live data. Swap this one line to
// prefer a different live source later (e.g. 'googlePlaces' once
// implemented) — everything downstream is unaffected.
export const LIVE_NEARBY_PROVIDER = 'osm';

// stationKey -> Promise<NormalizedPlace[]> — caches the FULL
// (all-categories) result per station, so switching the vibe filter
// re-fetches nothing; it just filters what's already cached.
export const _nearbyPlacesCache = {};

/**
 * Places module — cached, fallback-safe places lookup facade.
 * @summary Purpose: the single entry point the rest of the app calls
 *   for "places near this station". Tries LIVE_NEARBY_PROVIDER first,
 *   transparently falls back to StaticPlacesProvider on any failure
 *   or empty result, and caches the (all-categories) result per
 *   station so repeated lookups/vibe-filter changes never re-fetch.
 * @param {string} stationKey - station name
 * @returns {Promise<Array>} normalized place list for that station
 * @complexity O(1) on cache hit; provider-dependent on cache miss.
 * @sideEffects Populates _nearbyPlacesCache[stationKey]; may perform
 *   a network request (via the live provider) on first call.
 */
export async function getNearbyPlacesForStation(stationKey){
  if(_nearbyPlacesCache[stationKey]) return _nearbyPlacesCache[stationKey];

  const promise = (async () => {
    const live = NEARBY_PLACE_PROVIDERS[LIVE_NEARBY_PROVIDER];
    try {
      const results = await live.getNearbyPlaces(stationKey, ['all']);
      if(results && results.length) return results;
      throw new Error('live provider returned no results');
    } catch(err){
      console.warn(`[places] "${live.name}" provider failed for "${stationKey}" — falling back to static. (${err.message})`);
      return NEARBY_PLACE_PROVIDERS.static.getNearbyPlaces(stationKey, ['all']);
    }
  })();

  _nearbyPlacesCache[stationKey] = promise;
  return promise;
}

// ── Optional production timing instrumentation ─────────────
// See core/dijkstra.js for why this lives here instead of being
// applied externally by Diagnostics.
import { DEBUG, FEATURE_FLAGS } from '../config/FeatureFlags.js';
import { PerfMonitor } from '../diagnostics/PerformanceMonitor.js';
if (DEBUG && FEATURE_FLAGS.DIAGNOSTICS) {
  const _getNearbyPlacesForStation = getNearbyPlacesForStation;
  getNearbyPlacesForStation = function(...args){ return PerfMonitor.time('placesLookup', ()=>_getNearbyPlacesForStation.apply(this,args)); };
}
