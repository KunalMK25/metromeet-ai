// ═══════════════════════════════════════════════════════════
//  diagnostics/Diagnostics.js
//  Relocated from the monolith's DEBUG-gated Diagnostics block.
//  Test assertions below are byte-identical to the monolith.
//
//  TWO NECESSARY ADAPTATIONS FOR ES MODULES (documented, not
//  behavior changes):
//  1. The monolith's DEBUG gate (`if (DEBUG && FEATURE_FLAGS.
//     DIAGNOSTICS) { ... }`) wrapped this whole block inline. In
//     the modular build, main.js decides whether to *import* this
//     file at all based on that same condition (see main.js) — so
//     when DEBUG=false, this module is never loaded/evaluated,
//     which is an even stronger guarantee of zero overhead than
//     the monolith's runtime `if` check.
//  2. The AI 'context builder' test restores vibe/lastResult/
//     lastDisplayedPlaces after a synthetic run. ES module imports
//     of primitive bindings can't be reassigned by the importer
//     (only the module that exports them can), so the three
//     direct reassignments now call rendering/state.js's setters
//     instead — mechanically identical, same restore behavior.
//  The 'production timing instrumentation' section that used to
//  live at the end of this block has been relocated into each
//  wrapped function's own module (see the matching comment in
//  core/dijkstra.js) for the same reason as #2 — it reassigned
//  imported bindings, which only their owning module can do.
// ═══════════════════════════════════════════════════════════
import { GRAPH, STATION_LINES, STOP_MIN } from '../core/graph.js';
import { dijkstra } from '../core/dijkstra.js';
import { getRouteDetail } from '../core/routing.js';
import { calcFare } from '../core/fares.js';
import { findOptimal } from '../core/optimization.js';
import { ATTRACTIVENESS_WEIGHT } from '../core/optimization.js';
import { ST } from '../data/stations.js';
import { NEARBY_PLACE_PROVIDERS, getNearbyPlacesForStation, _nearbyPlacesCache } from '../places/PlacesService.js';
import { SCHEMATIC, SCHEMATIC_W, SCHEMATIC_H, LINE_GEOMETRY_CACHE, STATION_GEOMETRY_CACHE } from '../rendering/schematic.js';
import { computeLabelLayout } from '../rendering/labels.js';
import { ctx, vpX, vpY, vpScale, normToCanvas, canvasToNorm, setViewport } from '../rendering/viewport.js';
import { friends, lastResult, vibe, lastDisplayedPlaces, setLastResult, setVibeState, setLastDisplayedPlaces } from '../rendering/state.js';
import { buildAppContext } from '../ai/ContextBuilder.js';
import { contextAwareAnswer } from '../ai/DirectAnswers.js';
import { askClaudeWithContext } from '../ai/ClaudeProvider.js';
import { offlineBotReply } from '../ai/OfflineBot.js';

export const Diagnostics = (function(){
  const registry = [];   // [{suite,name,fn}]
  const timings = {};    // label -> [durations in ms]

  function now(){ return (typeof performance!=='undefined' ? performance.now() : Date.now()); }
  function register(suite, name, fn){ registry.push({ suite, name, fn }); }
  function recordTiming(label, ms){ (timings[label] = timings[label]||[]).push(ms); }

  // Wraps a call (sync or async) purely for timing — used both by
  // the optional production instrumentation below and by tests that
  // want to report how long a piece of setup took.
  function time(label, fn){
    const t0 = now();
    const result = fn();
    if (result && typeof result.then === 'function'){
      return result.then(v => { recordTiming(label, now()-t0); return v; });
    }
    recordTiming(label, now()-t0);
    return result;
  }

  function assert(cond, msg){ if(!cond) throw new Error(msg || 'Assertion failed'); }

  async function runDiagnostics(){
    const results = [];
    const overallStart = now();
    for (const {suite, name, fn} of registry){
      const t0 = now();
      let status='pass', error=null;
      try { await fn(); }
      catch(e){ status='fail'; error = e.message; }
      results.push({ suite, name, status, ms:+(now()-t0).toFixed(2), error });
    }
    const executionMs = +(now()-overallStart).toFixed(2);
    const passed = results.filter(r=>r.status==='pass').length;
    const failed = results.length - passed;

    const coverage = {};
    for (const r of results){
      const c = coverage[r.suite] = coverage[r.suite] || {total:0,passed:0,failed:0};
      c.total++; c[r.status==='pass'?'passed':'failed']++;
    }

    const timingSummary = {};
    for (const [label, arr] of Object.entries(timings)){
      timingSummary[label] = {
        count: arr.length,
        avgMs: +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(3),
        maxMs: +Math.max(...arr).toFixed(3),
      };
    }

    const report = { totalTests:results.length, passed, failed, executionMs, coverage, timings:timingSummary, results };
    printReport(report);
    return report;
  }

  function printReport(report){
    console.log('%c═══ METROMEET DIAGNOSTICS REPORT ═══', 'font-weight:bold;color:#67e7fb');
    for (const r of report.results){
      const mark = r.status==='pass' ? '✓' : '✗';
      console.log(`${mark} [${r.suite}] ${r.name}${r.error?' — '+r.error:''} (${r.ms}ms)`);
    }
    console.log(`\n${report.passed}/${report.totalTests} passed, ${report.failed} failed — total ${report.executionMs}ms`);
    console.log('Coverage by suite:', report.coverage);
    console.log('Timings (production instrumentation, if any calls were made):', report.timings);
  }

  return { register, recordTiming, time, assert, runDiagnostics };
})();

// ── Graph integrity ────────────────────────────────────────
Diagnostics.register('Graph', 'every edge is bidirectional', ()=>{
  for (const [node, edges] of Object.entries(GRAPH)){
    for (const e of edges){
      const back = GRAPH[e.to] || [];
      Diagnostics.assert(back.some(b=>b.to===node), `No return edge ${e.to} -> ${node}`);
    }
  }
});
Diagnostics.register('Graph', 'no orphan stations', ()=>{
  for (const [key,s] of Object.entries(ST)){
    if (!s.op) continue;
    const hasNode = Object.keys(GRAPH).some(id => id.startsWith(key+'::'));
    Diagnostics.assert(hasNode, `Station "${key}" has no graph node`);
  }
});
Diagnostics.register('Graph', 'all stations reachable from an arbitrary origin', ()=>{
  const start = Object.keys(ST).find(k=>ST[k].op);
  const r = dijkstra(start);
  for (const [key,s] of Object.entries(ST)){
    if (!s.op) continue;
    Diagnostics.assert(r.dist[key]!==undefined && r.dist[key]<Infinity, `"${key}" unreachable from "${start}"`);
  }
});
Diagnostics.register('Graph', 'interchange consistency (ST.li matches multi-line membership)', ()=>{
  for (const [key,s] of Object.entries(ST)){
    if (!s.op) continue;
    const lineCount = (STATION_LINES[key]?.size)||0;
    if (s.li==='Interchange') Diagnostics.assert(lineCount>1, `"${key}" marked Interchange but serves ${lineCount} line(s)`);
    if (lineCount>1) Diagnostics.assert(s.li==='Interchange', `"${key}" serves ${lineCount} lines but isn't marked Interchange`);
  }
});
Diagnostics.register('Graph', 'no duplicate edges per node', ()=>{
  for (const [node, edges] of Object.entries(GRAPH)){
    const seen = new Set();
    for (const e of edges){
      const sig = e.to+'|'+e.line;
      Diagnostics.assert(!seen.has(sig), `Duplicate edge ${node} -> ${sig}`);
      seen.add(sig);
    }
  }
});

// ── Routing ─────────────────────────────────────────────────
Diagnostics.register('Routing', 'shortest path matches a known adjacent-stop cost', ()=>{
  const r = Diagnostics.time('dijkstra', ()=>dijkstra('Jayanagar'));
  // "RV Road" is Jayanagar's immediate next stop on the Green line
  // (same line, no interchange), so it should cost exactly STOP_MIN.
  Diagnostics.assert(r.dist['RV Road']===STOP_MIN, `Expected ${STOP_MIN} min to an adjacent same-line stop, got ${r.dist['RV Road']}`);
});
Diagnostics.register('Routing', 'fare calculation matches documented tiers', ()=>{
  Diagnostics.assert(calcFare(0).normal===10, 'stopCount 0 should be ₹10');
  Diagnostics.assert(calcFare(5).normal===20, 'stopCount 5 should be ₹20');
  Diagnostics.assert(calcFare(30).normal===70, 'stopCount 30 (max tier) should be ₹70');
});
Diagnostics.register('Routing', 'travel time in getRouteDetail matches dijkstra distance', ()=>{
  const r = dijkstra('Whitefield');
  const rd = getRouteDetail('Whitefield','MG Road', r);
  Diagnostics.assert(rd.costMin === r.dist['MG Road'], 'getRouteDetail travel time should equal dijkstra dist');
});
Diagnostics.register('Routing', 'route reconstruction starts/ends at the requested stations', ()=>{
  const r = dijkstra('Whitefield');
  const rd = getRouteDetail('Whitefield','Electronic City', r);
  Diagnostics.assert(rd.path[0]==='Whitefield', 'path should start at origin');
  Diagnostics.assert(rd.path[rd.path.length-1]==='Electronic City', 'path should end at destination');
});
Diagnostics.register('Routing', 'interchange detection: same-line trip reports zero interchanges', ()=>{
  const r = dijkstra('Jayanagar');
  const rd = getRouteDetail('Jayanagar','Banashankari', r); // Green -> Green through RV Road
  Diagnostics.assert(rd.noInterchange===true, 'Green->Green via RV Road should report noInterchange');
});
Diagnostics.register('Routing', 'interchange detection: cross-line trip reports the right hub', ()=>{
  const r = dijkstra('MG Road');
  const rd = getRouteDetail('MG Road','Rajajinagar', r); // Purple -> Green via Majestic
  Diagnostics.assert(rd.interchangeStations.includes('Majestic'), 'Purple->Green trip should interchange at Majestic');
});

// ── Meetup optimization ─────────────────────────────────────
Diagnostics.register('Optimization', 'findOptimal produces internally consistent stats', ()=>{
  const opt = Diagnostics.time('findOptimal', ()=>findOptimal(['Whitefield','Jayanagar','Electronic City']));
  Diagnostics.assert(!!opt, 'findOptimal should find a candidate for a normal input');
  const maxCost = Math.max(...opt.costs);
  const avgCost = opt.costs.reduce((a,b)=>a+b,0)/opt.costs.length;
  Diagnostics.assert(maxCost>=avgCost, 'max travel time should be >= average travel time');
});
Diagnostics.register('Optimization', 'longest traveler is identifiable from costs[]', ()=>{
  const opt = findOptimal(['Whitefield','Jayanagar','Electronic City']);
  const maxIdx = opt.costs.indexOf(Math.max(...opt.costs));
  Diagnostics.assert(maxIdx>=0 && maxIdx<opt.costs.length, 'should be able to locate the longest traveler by index');
});
Diagnostics.register('Optimization', 'attractiveness bonus is attractiveness × weight', ()=>{
  const opt = findOptimal(['Whitefield','Jayanagar']);
  const expected = +(opt.attractiveness*ATTRACTIVENESS_WEIGHT).toFixed(6);
  const actual = +opt.attractivenessBonus.toFixed(6);
  Diagnostics.assert(expected===actual, `attractivenessBonus mismatch: expected ${expected}, got ${actual}`);
});
Diagnostics.register('Optimization', 'deterministic ranking (same input -> same pick)', ()=>{
  const a = findOptimal(['Whitefield','Jayanagar','Electronic City']);
  const b = findOptimal(['Whitefield','Jayanagar','Electronic City']);
  Diagnostics.assert(a.key===b.key, `findOptimal should be deterministic; got "${a.key}" then "${b.key}"`);
});

// ── Places providers ────────────────────────────────────────
Diagnostics.register('Places', 'cache avoids a second live-provider call for the same station', async ()=>{
  const origFetch = globalThis.fetch;
  let calls=0;
  const stubFetch = async()=>{ calls++; throw new Error('stub: force fallback, just counting calls'); };
  globalThis.fetch = stubFetch;
  const key='__diagnostics_cache_test_station__';
  const hadStation = Object.prototype.hasOwnProperty.call(ST, key);
  try {
    delete _nearbyPlacesCache[key];
    if (!hadStation) ST[key] = { la:12.97, lo:77.59, li:'Purple', co:'#9b72f5', op:true };
    await Diagnostics.time('placesLookup', ()=>getNearbyPlacesForStation(key));
    const callsAfterFirst = calls;
    await getNearbyPlacesForStation(key);
    Diagnostics.assert(calls===callsAfterFirst, 'second lookup for the same station should not hit the live provider again');
  } finally {
    globalThis.fetch = origFetch;
    delete _nearbyPlacesCache[key];
    if (!hadStation) delete ST[key]; // never leave synthetic test data in production state
  }
});
Diagnostics.register('Places', 'automatic fallback to static provider on live failure', async ()=>{
  const results = await NEARBY_PLACE_PROVIDERS.static.getNearbyPlaces('MG Road', ['all']);
  Diagnostics.assert(Array.isArray(results) && results.length>0, 'static provider should always return data for a seeded station');
});
Diagnostics.register('Places', 'normalized shape has all required fields', async ()=>{
  const results = await NEARBY_PLACE_PROVIDERS.static.getNearbyPlaces('MG Road', ['all']);
  for (const p of results){
    for (const field of ['name','category','latitude','longitude','distance','source']){
      Diagnostics.assert(p[field]!==undefined, `normalized place missing "${field}"`);
    }
  }
});
Diagnostics.register('Places', 'category filtering returns only the requested category', async ()=>{
  const results = await NEARBY_PLACE_PROVIDERS.static.getNearbyPlaces('MG Road', ['cafe']);
  Diagnostics.assert(results.every(p=>p.category==='cafe'), 'all results should be category "cafe"');
});

// ── Map renderer ────────────────────────────────────────────
Diagnostics.register('Renderer', 'every operational station has schematic coordinates', ()=>{
  for (const [key,s] of Object.entries(ST)){
    if (!s.op) continue;
    Diagnostics.assert(!!SCHEMATIC[key], `"${key}" has no schematic coordinate`);
  }
});
Diagnostics.register('Renderer', 'every line has at least 2 drawable points', ()=>{
  for (const line of LINE_GEOMETRY_CACHE){
    Diagnostics.assert(line.points.length>=2, `A line has only ${line.points.length} point(s)`);
  }
});
Diagnostics.register('Renderer', 'shared interchange stations align across lines', ()=>{
  Diagnostics.assert(SCHEMATIC['Majestic'] && SCHEMATIC['RV Road'], 'interchange stations should have coordinates');
});
Diagnostics.register('Renderer', 'label layout produces no overlapping boxes', ()=>{
  const items = computeLabelLayout(2.0, 800, 600);
  const boxes = items.map(it=>{
    const w = ctx.measureText(it.key).width, h=11;
    const x = (STATION_GEOMETRY_CACHE.find(s=>s.key===it.key).x/SCHEMATIC_W)*800*2.0 + it.dx;
    const y = (STATION_GEOMETRY_CACHE.find(s=>s.key===it.key).y/SCHEMATIC_H)*600*2.0 + it.dy;
    return {l:x-w/2,r:x+w/2,t:y,b:y+h};
  });
  for (let i=0;i<boxes.length;i++){
    for (let j=i+1;j<boxes.length;j++){
      const a=boxes[i], b=boxes[j];
      const overlap = !(a.r<b.l || a.l>b.r || a.b<b.t || a.t>b.b);
      Diagnostics.assert(!overlap, `Labels "${items[i].key}" and "${items[j].key}" overlap`);
    }
  }
});
Diagnostics.register('Renderer', 'viewport transform round-trips (canvasToNorm ∘ normToCanvas = identity)', ()=>{
  const savedX=vpX, savedY=vpY, savedScale=vpScale;
  setViewport(37, -19, 1.6);
  try {
    const c = normToCanvas(0.4, 0.7);
    const back = canvasToNorm(c.x, c.y);
    Diagnostics.assert(Math.abs(back.nx-0.4)<1e-9 && Math.abs(back.ny-0.7)<1e-9, 'viewport transform should round-trip');
  } finally {
    setViewport(savedX, savedY, savedScale);
  }
});

// ── AI assistant ────────────────────────────────────────────
Diagnostics.register('AI', 'context builder returns the expected shape', ()=>{
  const savedFriends=friends.slice(), savedLastResult=lastResult, savedVibe=vibe, savedPlaces=lastDisplayedPlaces;
  try {
    friends.length=0;
    const ctx = Diagnostics.time('aiContextBuild', ()=>buildAppContext());
    Diagnostics.assert(Array.isArray(ctx.friends), 'ctx.friends should be an array');
    Diagnostics.assert(Array.isArray(ctx.routes), 'ctx.routes should be an array');
    Diagnostics.assert('vibe' in ctx, 'ctx should include vibe');
    Diagnostics.assert('nearbyPlacesShown' in ctx, 'ctx should include nearbyPlacesShown');
  } finally {
    friends.length=0; friends.push(...savedFriends);
    setLastResult(savedLastResult); setVibeState(savedVibe); setLastDisplayedPlaces(savedPlaces);
  }
});
Diagnostics.register('AI', 'direct-answer layer recognises a known app-state question', ()=>{
  const ctx = { friends:[], vibe:'all', meetup:{station:'MG Road',line:'Purple',longestTravelMin:10,averageTravelMin:8,fairnessGapMin:2,fairnessPercent:90,totalInterchanges:0,stationAttractivenessScore:5}, routes:[], nearbyPlacesShown:[] };
  const ans = contextAwareAnswer('why was this meetup station chosen?', ctx);
  Diagnostics.assert(typeof ans==='string' && ans.includes('MG Road'), 'should answer the "why chosen" question using ctx.meetup');
});
Diagnostics.register('AI', 'direct-answer layer returns null for unrelated questions', ()=>{
  const ctx = { friends:[], vibe:'all', meetup:null, routes:[], nearbyPlacesShown:[] };
  const ans = contextAwareAnswer('what is the capital of karnataka?', ctx);
  Diagnostics.assert(ans===null, 'unrelated questions should fall through (null) to Claude/offline');
});
Diagnostics.register('AI', 'Claude call surfaces a clear error when unreachable (caller can fall back)', async ()=>{
  const origFetch = globalThis.fetch;
  const stub = async()=>({ ok:false, status:503 });
  globalThis.fetch = stub;
  try {
    let threw=false;
    try { await askClaudeWithContext('hello', {}); } catch(e){ threw=true; }
    Diagnostics.assert(threw, 'askClaudeWithContext should throw on a non-OK response so sendMsg can fall back');
  } finally {
    globalThis.fetch = origFetch;
  }
});
Diagnostics.register('AI', 'offline fallback always returns a non-empty reply', ()=>{
  const reply = offlineBotReply('asdkjfhaslkjdfh nonsense question');
  Diagnostics.assert(typeof reply==='string' && reply.length>0, 'offlineBotReply should always return something helpful');
});

// ── AI assistant — nearby-place (availability) queries ──────
// Regression tests for the smoke-test issue: when nearby places are
// already displayed, the direct-answer layer must answer from
// ctx.nearbyPlacesShown instead of falling through to the generic
// help response. Uses ONLY ctx.nearbyPlacesShown (never invents a
// place). The fix lives in DirectAnswers.js's nearby-place handler.
function _nearbyCtx(places){ return { friends:[], vibe:'all', meetup:{station:'MG Road'}, routes:[], nearbyPlacesShown: places }; }
function _place(name, category, distanceKm, opts){ return Object.assign({ name, category, distanceKm, latitude:12.97, longitude:77.59, rating:null, source:'static' }, opts||{}); }

Diagnostics.register('AI Nearby Places', 'mall availability query is answered from currently displayed places', ()=>{
  const places = [ _place('1MG Lakeview Mall','mall',0.5,{rating:4.2}), _place('UB City Mall','mall',1.2,{rating:4.5}), _place('Koshy\'s Cafe','cafe',0.9,{rating:4.5}) ];
  const ctx = _nearbyCtx(places);
  const ans = contextAwareAnswer('is there any mall nearby?', ctx);
  Diagnostics.assert(typeof ans==='string', 'should answer the mall query (not null)');
  Diagnostics.assert(ans.includes('1MG Lakeview Mall'), 'answer should include the matching mall name from currently loaded places');
  Diagnostics.assert(ans.includes('MG Road'), 'answer should respect the currently selected meetup station');
  Diagnostics.assert(!ans.includes('Koshy'), 'answer should not leak non-mall places into a category-filtered reply');
});
Diagnostics.register('AI Nearby Places', 'cafe availability query (Any cafes nearby?) is answered from currently displayed places', ()=>{
  const places = [ _place('Toit Brewpub','bar',0.7,{rating:4.6}), _place('Third Wave Coffee','cafe',0.5,{rating:4.5}), _place('Bangalore Central Mall','mall',1.0,{rating:4.0}) ];
  const ctx = _nearbyCtx(places);
  const ans = contextAwareAnswer('any cafes nearby?', ctx);
  Diagnostics.assert(typeof ans==='string', 'should answer the cafe query (not null)');
  Diagnostics.assert(ans.includes('Third Wave Coffee'), 'answer should include the matching cafe name from currently loaded places');
  Diagnostics.assert(ans.toLowerCase().includes('cafe'), 'answer should mention the requested category label');
});
Diagnostics.register('AI Nearby Places', 'restaurant existence query (Are there restaurants?) is answered from currently displayed places', ()=>{
  const places = [ _place('100 Feet Road Food Street','restaurant',0.3,{rating:4.5}), _place('Smoke House Deli','restaurant',0.9,{rating:4.4}), _place('Toit Brewpub','bar',0.7,{rating:4.6}) ];
  const ctx = _nearbyCtx(places);
  const ans = contextAwareAnswer('are there restaurants?', ctx);
  Diagnostics.assert(typeof ans==='string', 'should answer the restaurant query (not null)');
  Diagnostics.assert(ans.includes('100 Feet Road Food Street'), 'answer should include a matching restaurant name from currently loaded places');
  Diagnostics.assert(ans.includes('restaurant'), 'answer should mention the requested category label');
  Diagnostics.assert(!ans.includes('Toit Brewpub'), 'answer should not leak non-restaurant places into a category-filtered reply');
});
Diagnostics.register('AI Nearby Places', 'closest-place query (What is the closest mall?) returns a single closest match with a Maps link', ()=>{
  const places = [ _place('Orion Mall','mall',2.5,{rating:4.5}), _place('1MG Lakeview Mall','mall',0.5,{rating:4.2}), _place('UB City Mall','mall',1.2,{rating:4.5}), _place('Koshy\'s Cafe','cafe',0.9,{rating:4.5}) ];
  const ctx = _nearbyCtx(places);
  const ans = contextAwareAnswer("what's the closest mall?", ctx);
  Diagnostics.assert(typeof ans==='string', 'should answer the closest-mall query (not null)');
  Diagnostics.assert(ans.includes('1MG Lakeview Mall'), 'should pick the closest mall by distanceKm');
  Diagnostics.assert(!ans.includes('Orion Mall'), 'should not list farther malls in the single-closest reply');
  Diagnostics.assert(ans.includes('maps.google.com') || /google\.com\/maps/.test(ans), 'should include a Maps link for the closest place');
});
Diagnostics.register('AI Nearby Places', 'no-results query says so explicitly instead of falling through to the generic help response', ()=>{
  // Cafes are loaded, but the user asks about "bars" — no match.
  const places = [ _place('Third Wave Coffee','cafe',0.5,{rating:4.5}), _place('Matteo Coffea','cafe',2.0,{rating:4.5}) ];
  const ctx = _nearbyCtx(places);
  const ans = contextAwareAnswer('is there any bar nearby?', ctx);
  Diagnostics.assert(typeof ans==='string', 'no-match should still be answered by the direct layer, NOT fall through to null/help');
  Diagnostics.assert(/bar/i.test(ans), 'should explicitly mention the requested category');
  Diagnostics.assert(ans.includes('MG Road'), 'should respect the currently selected meetup station in the no-match reply');
  Diagnostics.assert(ans.toLowerCase().includes("don't") || ans.toLowerCase().includes('no ') || ans.toLowerCase().includes('not'), 'should explicitly say none are currently available');
});
Diagnostics.register('AI Nearby Places', 'nothing loaded at all: availability query says no places are loaded (NOT the generic help response)', ()=>{
  const ctx = _nearbyCtx([]); // empty nearby places
  const ans = contextAwareAnswer('is there any mall nearby?', ctx);
  Diagnostics.assert(typeof ans==='string', 'no-data query should be answered by the direct layer, NOT fall through to null/help');
  Diagnostics.assert(!/I can help you with/i.test(ans), 'must NOT fall through to the generic offline help response');
  Diagnostics.assert(ans.toLowerCase().includes('no nearby places') || ans.toLowerCase().includes('not') || ans.toLowerCase().includes("don't"), 'should explicitly say no nearby places are loaded');
});
Diagnostics.register('AI Nearby Places', 'unrelated question still falls through to null (preserves Claude fallback)', ()=>{
  const places = [ _place('1MG Lakeview Mall','mall',0.5,{rating:4.2}) ];
  const ctx = _nearbyCtx(places);
  const ans = contextAwareAnswer('what is the capital of karnataka?', ctx);
  Diagnostics.assert(ans===null, 'unrelated question must still fall through to Claude/offline');
});
