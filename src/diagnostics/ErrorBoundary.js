// ═══════════════════════════════════════════════════════════
//  diagnostics/ErrorBoundary.js
//  Relocated from the monolith, byte-identical body.
// ═══════════════════════════════════════════════════════════
import { Logger } from './Logger.js';

// ── Error Boundary helpers ───────────────────────────────────
// Wrap a risky call so one failure (Places API down, AI request
// failing, a canvas draw exception, a missing station/route/asset)
// degrades gracefully instead of breaking the rest of the app.
export const ErrorBoundary = {
  guard(subsystem, fn, fallbackValue, context){
    try { return fn(); }
    catch(e){ Logger.error(subsystem, e.message, {context}); return fallbackValue; }
  },
  async guardAsync(subsystem, fn, fallbackValue, context){
    try { return await fn(); }
    catch(e){ Logger.error(subsystem, e.message, {context}); return fallbackValue; }
  },
  missingStation(stationKey){
    Logger.warn('ErrorBoundary', `Missing station "${stationKey}"`, {stationKey});
    return null;
  },
  missingRoute(from, to){
    Logger.warn('ErrorBoundary', `No route data for ${from} -> ${to}`, {from,to});
    return null;
  },
  missingAsset(assetName){
    Logger.warn('ErrorBoundary', `Missing map asset "${assetName}"`, {assetName});
  },
};
