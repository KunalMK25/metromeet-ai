// ═══════════════════════════════════════════════════════════
//  places/providers/GooglePlacesProvider.js
//  Relocated from the monolith, byte-identical body.
//  PROTECTED — Places provider behavior must not change.
// ═══════════════════════════════════════════════════════════

// ── Provider: Google Places (future) ─────────────────────────
// Stub only — wire up an API key + Nearby Search/Places API call
// here to enable it, then add 'googlePlaces' to NEARBY_PLACE_PROVIDERS
// below (or make it LIVE_NEARBY_PROVIDER). Nothing else changes.
export class GooglePlacesProvider {
  constructor(){ this.name = 'google-places'; }
  async getNearbyPlaces(stationKey, categories){
    throw new Error('GooglePlacesProvider not implemented yet');
  }
}
