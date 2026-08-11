// ═══════════════════════════════════════════════════════════
//  diagnostics/PerformanceMonitor.js
//  Relocated from the monolith, byte-identical body.
// ═══════════════════════════════════════════════════════════
import { Logger } from './Logger.js';

/**
 * Performance module — timing and cache-rate instrumentation.
 * @summary Purpose: a single place to record how long things take
 *   (Dijkstra, findOptimal, route reconstruction, Places latency, AI
 *   latency, static-layer regen, dynamic-overlay render, frame time)
 *   and how often caches hit vs. miss, plus JS heap usage where the
 *   browser exposes it. Used by the dev overlay, exportDebugReport(),
 *   and the entry-point wrapping done elsewhere in this file.
 * @method time - wraps a sync/async call, records its duration under `label`
 * @method record - records a duration directly under `label`
 * @method recordCacheHit / recordCacheMiss - increments a named counter
 * @method summary - returns {label: {count,avgMs,maxMs,minMs}} for every recorded label
 * @method cacheSummary - returns {label: {hits,misses,hitRatePct}} for every counter
 * @method memoryUsage - returns {usedMB,totalMB,limitMB} or null if unsupported
 * @sideEffects Accumulates in-memory metrics/counters for the life of
 *   the page; also writes to Logger.performance() for each recording.
 */
export const PerfMonitor = (function(){
  const metrics = {};   // label -> {count,totalMs,maxMs,minMs}
  const counters = {};  // label -> {hits,misses}

  function nowMs(){ return (typeof performance!=='undefined'?performance.now():Date.now()); }
  function record(label, ms){
    const m = metrics[label] = metrics[label] || {count:0,totalMs:0,maxMs:-Infinity,minMs:Infinity};
    m.count++; m.totalMs+=ms; m.maxMs=Math.max(m.maxMs,ms); m.minMs=Math.min(m.minMs,ms);
    Logger.performance('PerfMonitor', `${label}: ${ms.toFixed(2)}ms`);
  }
  // Wraps a sync or async call purely for timing — used both for the
  // optional entry-point instrumentation below and for ad-hoc timing
  // anywhere else in the app that opts in.
  function time(label, fn){
    const t0 = nowMs();
    const result = fn();
    if (result && typeof result.then === 'function'){
      return result.then(v => { record(label, nowMs()-t0); return v; });
    }
    record(label, nowMs()-t0);
    return result;
  }
  function recordCacheHit(label){ (counters[label]=counters[label]||{hits:0,misses:0}).hits++; }
  function recordCacheMiss(label){ (counters[label]=counters[label]||{hits:0,misses:0}).misses++; }
  function summary(){
    const out={};
    for (const [label,m] of Object.entries(metrics)){
      out[label] = { count:m.count, avgMs:+(m.totalMs/m.count).toFixed(3), maxMs:+m.maxMs.toFixed(3), minMs:+m.minMs.toFixed(3) };
    }
    return out;
  }
  function cacheSummary(){
    const out={};
    for (const [label,c] of Object.entries(counters)){
      const total=c.hits+c.misses;
      out[label] = { hits:c.hits, misses:c.misses, hitRatePct: total?+(c.hits/total*100).toFixed(1):null };
    }
    return out;
  }
  function memoryUsage(){
    if (typeof performance!=='undefined' && performance.memory){
      return {
        usedMB: +(performance.memory.usedJSHeapSize/1048576).toFixed(1),
        totalMB: +(performance.memory.totalJSHeapSize/1048576).toFixed(1),
        limitMB: +(performance.memory.jsHeapSizeLimit/1048576).toFixed(1),
      };
    }
    return null; // not available in this browser
  }
  return { record, time, recordCacheHit, recordCacheMiss, summary, cacheSummary, memoryUsage };
})();
