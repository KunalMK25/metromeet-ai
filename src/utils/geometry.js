// ═══════════════════════════════════════════════════════════
//  utils/geometry.js
//  Relocated from the monolith's places-provider "shared helpers"
//  section, byte-identical bodies.
// ═══════════════════════════════════════════════════════════

export function haversineKm(lat1,lon1,lat2,lon2){
  if([lat1,lon1,lat2,lon2].some(v=>v===undefined||v===null||Number.isNaN(v))) return null;
  const R=6371, toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
// Deterministic pseudo-bearing from a name, so the same place always
// lands at the same approximate spot instead of jumping around.
export function hashBearing(str){
  let h=0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))>>>0;
  return h%360;
}
export function offsetLatLon(lat, lon, km, bearingDeg){
  if(lat==null||lon==null) return {lat:12.9716, lon:77.5946}; // Bangalore-centre fallback
  const R=6371, brng=bearingDeg*Math.PI/180;
  const lat1=lat*Math.PI/180, lon1=lon*Math.PI/180;
  const lat2=Math.asin(Math.sin(lat1)*Math.cos(km/R)+Math.cos(lat1)*Math.sin(km/R)*Math.cos(brng));
  const lon2=lon1+Math.atan2(Math.sin(brng)*Math.sin(km/R)*Math.cos(lat1), Math.cos(km/R)-Math.sin(lat1)*Math.sin(lat2));
  return { lat: lat2*180/Math.PI, lon: lon2*180/Math.PI };
}
