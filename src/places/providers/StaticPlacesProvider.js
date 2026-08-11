// ═══════════════════════════════════════════════════════════
//  places/providers/StaticPlacesProvider.js
//  Relocated from the monolith, byte-identical body.
//  PROTECTED — Places provider behavior must not change.
// ═══════════════════════════════════════════════════════════
import { ST } from '../../data/stations.js';
import { hashBearing, offsetLatLon } from '../../utils/geometry.js';

/**
 * Places module — curated static provider (always-available fallback).
 * @summary Purpose: wrap the hand-curated PLACES_DB behind the same
 *   getNearbyPlaces(station, categories) interface every provider
 *   implements. Always succeeds, so it's also what every live
 *   provider falls back to on failure (see getNearbyPlacesForStation).
 * @method getNearbyPlaces
 * @param {string} stationKey - station name (falls back to a partial
 *   name match, then to "MG Road", if no exact entry exists)
 * @param {string[]} categories - category filters, or ['all']
 * @returns {Promise<Array<{name,category,latitude,longitude,rating,
 *   distance,source,emoji,note}>>} normalized place list
 * @complexity O(P) over the station's curated place list.
 * @sideEffects None — pure read of the immutable PLACES_DB.
 */
export class StaticPlacesProvider {
  constructor(db){ this.db = db; this.name = 'static'; }
  async getNearbyPlaces(stationKey, categories){
    let list = this.db[stationKey];
    if(!list){
      const keys = Object.keys(this.db);
      const partial = keys.find(k => stationKey.includes(k) || k.includes(stationKey.split(' ')[0]));
      list = partial ? this.db[partial] : null;
    }
    if(!list) list = this.db['MG Road'] || [];

    const st = ST[stationKey] || {};
    const wantAll = !categories || categories.includes('all');
    return list
      .filter(p => wantAll || categories.includes(p.t))
      .map(p => {
        const distance = parseFloat(p.d) || 0.5;
        const coords = offsetLatLon(st.la, st.lo, distance, hashBearing(p.n));
        return {
          name: p.n,
          category: p.t,
          latitude: coords.lat,
          longitude: coords.lon,
          rating: parseFloat(p.r) || null,
          distance,
          source: this.name,
          emoji: p.e,
          note: p.note,
        };
      });
  }
}
