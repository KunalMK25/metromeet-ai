// ═══════════════════════════════════════════════════════════
//  diagnostics/Logger.js
//  Relocated from the monolith, byte-identical body.
// ═══════════════════════════════════════════════════════════
import { DEBUG } from '../config/FeatureFlags.js';

// ── Centralized Logger ───────────────────────────────────────
// Timestamped, grouped-by-subsystem logging. warn/error/info always
// surface to the console (normal production diagnostic practice —
// this doesn't change any user-visible behavior); debug/performance
// are dev-only noise gated by DEBUG so a production console stays quiet.
export const Logger = (function(){
  const buffer = [];
  const MAX_BUFFER = 500;
  const subsystems = new Set();

  function shouldPrint(level){
    if (level==='error' || level==='warn' || level==='info') return true;
    return DEBUG;
  }
  function record(level, subsystem, message, data){
    const entry = { ts:new Date().toISOString(), level, subsystem, message, data: data!==undefined?data:null };
    buffer.push(entry);
    if (buffer.length>MAX_BUFFER) buffer.shift();
    subsystems.add(subsystem);
    if (shouldPrint(level)){
      const prefix = `[${entry.ts}] [${subsystem}] [${level.toUpperCase()}]`;
      const out = level==='error' ? console.error : level==='warn' ? console.warn : console.log;
      if (data!==undefined && data!==null) out(prefix, message, data); else out(prefix, message);
    }
    return entry;
  }
  return {
    debug:(s,m,d)=>record('debug',s,m,d),
    info:(s,m,d)=>record('info',s,m,d),
    warn:(s,m,d)=>record('warn',s,m,d),
    error:(s,m,d)=>record('error',s,m,d),
    performance:(s,m,d)=>record('performance',s,m,d),
    getRecent:(n)=> n ? buffer.slice(-n) : buffer.slice(),
    getSubsystems:()=>Array.from(subsystems),
  };
})();
