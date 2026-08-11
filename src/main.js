// ═══════════════════════════════════════════════════════════
//  main.js
//  Application entry point. Loaded via <script type="module"
//  src="main.js"> from index.html.
//
//  Import order follows the stated dependency direction:
//  data → core → places → rendering → ai → ui → main. Diagnostics
//  is loaded dynamically (only when DEBUG && FEATURE_FLAGS.
//  DIAGNOSTICS) so its code doesn't even get fetched/parsed in a
//  production build — nothing else may depend on it.
//
//  Relocated from the monolith's final "window.X = ..." exposures
//  and the closing `window.addEventListener('load', ...)` boot
//  block, plus the DEBUG-gated dev overlay (kept here rather than
//  in ui/ or diagnostics/ since it reads state from every layer).
// ═══════════════════════════════════════════════════════════
import { DEBUG, FEATURE_FLAGS } from './config/FeatureFlags.js';
import { APP_VERSION } from './config/Version.js';
import { Logger } from './diagnostics/Logger.js';
import { PerfMonitor } from './diagnostics/PerformanceMonitor.js';

import { friends, lastResult, vibe } from './rendering/state.js';
import { canvas, ctx, vpX, vpY, vpScale, resize, resetView, zoom } from './rendering/viewport.js';
import { hoveredStationKey } from './rendering/overlays.js';
import { lastStaticVpKey } from './rendering/renderer.js';
import { labelLayoutCache } from './rendering/labels.js';
import { STATION_GEOMETRY_CACHE } from './rendering/schematic.js';
import './rendering/renderer.js'; // self-registers with the scheduler on import

import { _nearbyPlacesCache } from './places/PlacesService.js';

import { addFriend, removeFriend } from './ui/FriendsPanel.js';
import { setVibe, findMeet, openDrawer, closeDrawer, toggleRouteDetail, sw } from './ui/Drawer.js';
import { sendMsg, qa, ck, ar } from './ui/Chat.js';
import { attachStationAutocomplete } from './ui/Autocomplete.js';
import './ui/MapControls.js'; // side-effect import: registers canvas pan/zoom/touch handlers

// ── Expose UI entry points for the existing inline HTML handlers ──
// (onclick="addFriend()" etc.) — a <script type="module"> doesn't
// leak top-level names onto window the way a classic script did, so
// this replaces that implicit exposure with an explicit one. No
// behavior change: the same functions, called the same way.
window.addFriend = addFriend;
window.removeFriend = removeFriend;
window.setVibe = setVibe;
window.findMeet = findMeet;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.toggleRouteDetail = toggleRouteDetail;
window.sw = sw;
window.sendMsg = sendMsg;
window.qa = qa;
window.ck = ck;
window.ar = ar;
window.resetView = resetView;
window.zoom = zoom;

// Station search autocomplete for the "Add Your Crew" area field
attachStationAutocomplete(
  document.getElementById('frAreaSearch'),
  document.getElementById('frAreaList'),
  document.getElementById('frArea')
);

// ═══════════════════════════════════════════════════════════
//  DEVELOPER OVERLAY — DEBUG + FEATURE_FLAGS.PERFORMANCE_OVERLAY only
//  A small floating readout, entirely separate DOM from the rest of
//  the UI, so it never touches existing markup/styling. Ticks on its
//  own requestAnimationFrame loop (only started when enabled) purely
//  to keep FPS/frame-time live; it does not call performDraw itself
//  and has no effect on the render scheduler.
// ═══════════════════════════════════════════════════════════
let devOverlayEl = null;
function ensureDevOverlay(){
  if (devOverlayEl) return devOverlayEl;
  devOverlayEl = document.createElement('div');
  devOverlayEl.id = 'devOverlay';
  devOverlayEl.style.cssText =
    'position:fixed;top:8px;right:8px;z-index:9999;'+
    'background:rgba(6,10,18,0.9);color:#c8dff5;border:1px solid #1e2f4a;'+
    'border-radius:8px;padding:8px 10px;font:11px/1.5 "DM Mono",monospace;'+
    'min-width:200px;pointer-events:none;white-space:pre;';
  document.body.appendChild(devOverlayEl);
  return devOverlayEl;
}

let _overlayLastTs = null;
let _overlayFps = 0;

function updateDevOverlay(){
  const el = ensureDevOverlay();
  const t = (typeof performance!=='undefined'?performance.now():Date.now());
  if (_overlayLastTs!=null){
    const delta = t-_overlayLastTs;
    if (delta>0) _overlayFps = Math.round(1000/delta);
  }
  _overlayLastTs = t;

  const perf = PerfMonitor.summary();
  const frameStat = perf.frameRender ? `${perf.frameRender.avgMs}ms avg / ${perf.frameRender.maxMs}ms max` : 'n/a';
  const staticStatus = FEATURE_FLAGS.RENDER_CACHE ? (lastStaticVpKey ? 'warm (cached)' : 'cold') : 'disabled';
  const labelStatus = labelLayoutCache ? `warm @${labelLayoutCache.scale.toFixed(2)}x` : 'cold';
  const mem = PerfMonitor.memoryUsage();

  el.textContent =
`FPS: ${_overlayFps}
Frame time: ${frameStat}
Zoom: ${vpScale.toFixed(2)}x
Pan: ${Math.round(vpX)}, ${Math.round(vpY)}
Static cache: ${staticStatus}
Label cache: ${labelStatus}
Places cache: ${Object.keys(_nearbyPlacesCache).length} station(s)
Friends: ${friends.length}
Visible stations: ${STATION_GEOMETRY_CACHE.length}
Hovered: ${hoveredStationKey||'—'}
Meetup: ${lastResult?.opt?.key||'—'}
Avg render: ${frameStat}${mem?`\nMemory: ${mem.usedMB}MB / ${mem.limitMB}MB`:''}`;

  requestAnimationFrame(updateDevOverlay);
}

// ═══════════════════════════════════════════════════════════
//  exportDebugReport() — always available (read-only, no UI
//  effect), for support/debugging even outside DEBUG mode. Excludes
//  friend names/stations and chat content — only counts/flags/timings.
// ═══════════════════════════════════════════════════════════
let diagnosticsLoaded = false; // set true once the dynamic import below resolves

function exportDebugReport(){
  return {
    generatedAt: new Date().toISOString(),
    appVersion: { ...APP_VERSION },
    featureFlags: { ...FEATURE_FLAGS },
    debugMode: DEBUG,
    performance: PerfMonitor.summary(),
    cacheStatistics: {
      ...PerfMonitor.cacheSummary(),
      placesCacheEntries: Object.keys(_nearbyPlacesCache).length,
      staticLayerStatus: lastStaticVpKey ? 'warm' : 'cold',
      labelLayoutStatus: labelLayoutCache ? 'warm' : 'cold',
    },
    memory: PerfMonitor.memoryUsage(),
    viewport: {
      vpX: Math.round(vpX), vpY: Math.round(vpY), vpScale: +vpScale.toFixed(3),
      canvasWidth: (typeof canvas!=='undefined'?canvas.width:null),
      canvasHeight: (typeof canvas!=='undefined'?canvas.height:null),
    },
    appState: {
      friendsCount: friends.length,
      hasMeetupResult: !!lastResult,
      vibe,
    },
    browser: {
      userAgent: (typeof navigator!=='undefined'?navigator.userAgent:'n/a'),
      language: (typeof navigator!=='undefined'?navigator.language:'n/a'),
      platform: (typeof navigator!=='undefined'?navigator.platform:'n/a'),
      viewportSize: (typeof window!=='undefined' && window.innerWidth?`${window.innerWidth}x${window.innerHeight}`:'n/a'),
    },
    diagnosticsSummary: {
      loaded: diagnosticsLoaded,
      note: diagnosticsLoaded
        ? 'Diagnostics loaded — call runDiagnostics() for a full test report'
        : 'Diagnostics not loaded (requires DEBUG=true and FEATURE_FLAGS.DIAGNOSTICS=true)',
    },
    recentLogs: Logger.getRecent(50),
  };
}
window.exportDebugReport = exportDebugReport;
window.Logger = Logger;
window.PerfMonitor = PerfMonitor;
window.FEATURE_FLAGS = FEATURE_FLAGS;
window.APP_VERSION = APP_VERSION;

// ── Boot ──────────────────────────────────────────────────────
window.addEventListener('load', async () => {
  resize();
  Logger.info('App', `MetroMeet AI ${APP_VERSION.appVersion} booted`, { buildDate: APP_VERSION.buildDate });

  if (DEBUG && FEATURE_FLAGS.DIAGNOSTICS) {
    const { Diagnostics } = await import('./diagnostics/Diagnostics.js');
    diagnosticsLoaded = true;
    window.Diagnostics = Diagnostics;
    window.runDiagnostics = Diagnostics.runDiagnostics;
    console.log('[Diagnostics] DEBUG=true — framework loaded. Run runDiagnostics() in the console to test.');
  }

  if (DEBUG && FEATURE_FLAGS.PERFORMANCE_OVERLAY) requestAnimationFrame(updateDevOverlay);
});
