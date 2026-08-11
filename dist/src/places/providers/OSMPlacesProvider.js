// ═══════════════════════════════════════════════════════════
//  places/providers/OSMPlacesProvider.js
//  Relocated from the monolith, byte-identical body.
//  PROTECTED — Places provider behavior must not change.
// ═══════════════════════════════════════════════════════════
import { ST } from '../../data/stations.js';
import { OSM_TAGS, TYPE_EMOJI } from '../../data/places-db.js';
import { haversineKm } from '../../utils/geometry.js';

// Only this provider actually uses a search radius (StaticPlacesProvider
// works off pre-curated distances; the registry doesn't need this
// value), so it's defined here rather than in PlacesService.js — the
// service importing OSMPlacesProvider (to build its registry) while
// this file also imported a constant back from the service would be
// a circular import.
export const NEARBY_RADIUS_KM = 5;

// ── Provider: live OpenStreetMap data via the Overpass API ──
// Queries real places around the station's actual coordinates.
// Any failure (network, rate limit, empty result) is left to the
// caller (getNearbyPlacesForStation) to catch and fall back from.
/**
 * Places module — live OpenStreetMap/Overpass provider.
 * @summary Purpose: query real nearby places from the Overpass API
 *   around a station's actual lat/lon. Any failure (network, rate
 *   limit, empty result) is intentionally left uncaught here — the
 *   caller (getNearbyPlacesForStation) is responsible for catching
 *   it and falling back to StaticPlacesProvider.
 * @method getNearbyPlaces
 * @param {string} stationKey - station name (must exist in ST with lat/lon)
 * @param {string[]} categories - category filters, or ['all']
 * @returns {Promise<Array<{name,category,latitude,longitude,rating,
 *   distance,source,emoji}>>} normalized place list, nearest first
 * @throws if the station has no coordinates, the HTTP request fails,
 *   or Overpass returns zero elements.
 * @complexity Network-bound; O(E) to normalize E returned elements.
 * @sideEffects Performs a network fetch() to overpass-api.de.
 */
export class OSMPlacesProvider {
  constructor(){ this.name = 'osm'; }
  async getNearbyPlaces(stationKey, categories){
    const st = ST[stationKey];
    if(!st || st.la==null || st.lo==null) throw new Error(`No coordinates for station "${stationKey}"`);

    const wantAll = !categories || categories.includes('all');
    const cats = wantAll ? Object.keys(OSM_TAGS).filter(c=>c!=='all') : categories;
    const tagPairs = cats.flatMap(c => OSM_TAGS[c] || []);
    if(!tagPairs.length) return [];

    const radiusM = NEARBY_RADIUS_KM * 1000;
    const clauses = tagPairs.map(([k,v]) => `node["${k}"="${v}"](around:${radiusM},${st.la},${st.lo});`).join('');
    const query = `[out:json][timeout:12];(${clauses});out center 25;`;
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

    const res = await fetch(url);
    if(!res.ok) throw new Error(`Overpass request failed (${res.status})`);
    const data = await res.json();
    const elements = data?.elements || [];
    if(!elements.length) throw new Error('Overpass returned no elements');

    return elements
      .filter(el => el.tags?.name)
      .map(el => {
        const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
        const category = this._categoryFromTags(el.tags);
        return {
          name: el.tags.name,
          category,
          latitude: lat,
          longitude: lon,
          rating: null, // Overpass/OSM doesn't carry ratings
          distance: haversineKm(st.la, st.lo, lat, lon) ?? NEARBY_RADIUS_KM,
          source: this.name,
          emoji: TYPE_EMOJI[el.tags.amenity || el.tags.shop || el.tags.leisure] || '📍',
        };
      })
      .sort((a,b)=>a.distance-b.distance)
      .slice(0, 20);
  }
  _categoryFromTags(tags){
    for(const [cat, pairs] of Object.entries(OSM_TAGS)){
      if(cat==='all') continue;
      if(pairs.some(([k,v]) => tags[k]===v)) return cat;
    }
    return tags.amenity || tags.shop || tags.leisure || 'other';
  }
}
