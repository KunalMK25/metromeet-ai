import { ST } from '../data/stations.js';
import { SEQ_COLOR } from '../data/colors.js';
import { TYPE_EMOJI } from '../data/places-db.js';
import { FEATURE_FLAGS } from '../config/FeatureFlags.js';
import { ErrorBoundary } from '../diagnostics/ErrorBoundary.js';
import { findOptimal } from '../core/optimization.js';
import { getRouteDetail, collapseToStationLine } from '../core/routing.js';
import { NEARBY_PLACE_PROVIDERS, getNearbyPlacesForStation } from '../places/PlacesService.js';
import { SCHEMATIC, SCHEMATIC_W, SCHEMATIC_H } from '../rendering/schematic.js';
import { canvas, setViewport } from '../rendering/viewport.js';
import { draw } from '../rendering/renderer.js';
import { friends, vibe, lastResult, setVibeState, setLastResult, setMeetContext, setLastDisplayedPlaces } from '../rendering/state.js';

export function setVibe(btn,v){
  setVibeState(v);
  document.querySelectorAll('.vc').forEach(b=>b.classList.toggle('on',b===btn));
  if(lastResult) fetchPlaces(lastResult);
}

export async function findMeet(){
  if(friends.length<2)return;
  document.getElementById('drawerContent').innerHTML=
    `<div class="loading-row"><div class="spin"></div>Running graph routing across 83 stations…</div>`;
  openDrawer();

  // Use graph-based Dijkstra algorithm
  const friendKeys = friends.map(f=>f.stKey);
  const opt = findOptimal(friendKeys);
  if(!opt){ alert('Could not find a route. Try different areas.'); return; }

  // Per-friend route details using the dijkstra results stored in opt
  const routeDetails = friends.map((f,i)=>
    getRouteDetail(f.stKey, opt.key, opt.dResults[i])
  );

  const costs  = routeDetails.map(r=>r.costMin);
  const maxT   = Math.max(...costs);
  const avgT   = Math.round(costs.reduce((a,b)=>a+b,0)/costs.length);
  const totalIx= opt.totalIx;

  setLastResult({opt, friends:[...friends], costs, maxT, avgT, routeDetails});
  setMeetContext(lastResult);

  // Pan + zoom canvas to fit everyone
  const allKeys = [opt.key, ...friends.map(f=>f.stKey)];
  const pts = allKeys.map(k=>SCHEMATIC[k]).filter(Boolean);
  const midX = (Math.max(...pts.map(p=>p.x)) + Math.min(...pts.map(p=>p.x))) / 2;
  const midY = (Math.max(...pts.map(p=>p.y)) + Math.min(...pts.map(p=>p.y))) / 2;
  const midNorm = { x: midX/SCHEMATIC_W, y: midY/SCHEMATIC_H };
  setViewport(canvas.width/2 - midNorm.x*canvas.width*1.6, canvas.height/2 - midNorm.y*canvas.height*1.6, 1.6);
  draw();

  const nb = opt.li==='Yellow'?'<span class="new-b">NEW</span>':'';
  const ib = opt.li==='Interchange'?'<span class="new-b" style="background:var(--green);color:#000">HUB</span>':'';

  const spread = maxT - Math.min(...costs);
  const fairnessPct = Math.max(0, Math.round(100 - (spread / Math.max(maxT,1)) * 100));
  const fairnessColor = fairnessPct>=80?'var(--green)':fairnessPct>=60?'var(--yellow)':'#f87171';
  const fairnessLabel = fairnessPct>=80?'Very Fair ✓':fairnessPct>=60?'Acceptable':'Uneven';
  lastResult.spread = spread;
  lastResult.fairnessPct = fairnessPct;

  const routeRows = friends.map((f,i)=>{
    const rd = routeDetails[i];
    const fare = rd.fare;
    const hintHtml = rd.hints.map(h=>`<div class="r-note">🔄 ${h}</div>`).join('');
    const sameStation = f.stKey === opt.key;

    // ── Full station-by-station route panel (collapsed by default) ──
    // Built directly from the same detailed Dijkstra path used above,
    // so it always matches the route actually computed.
    let fullDetailHtml = '';
    if (!sameStation) {
      const routeChips = collapseToStationLine(rd.detailed).map(s=>{
        const c = SEQ_COLOR[s.line] || 'var(--text)';
        const isIx = rd.interchangeStations.includes(s.station);
        return `<span style="font-family:'DM Mono',monospace;font-size:.58rem;padding:2px 6px;border-radius:4px;background:${c}18;color:${c};border:1px solid ${c}40${isIx?`;box-shadow:0 0 0 1px ${c}`:''}">${s.station}</span>`;
      }).join('<span style="color:var(--muted);font-size:.55rem">→</span>');

      const lineBadges = rd.linesUsed.map(l=>{
        const c = SEQ_COLOR[l] || 'var(--text)';
        return `<span style="font-family:'DM Mono',monospace;font-size:.58rem;padding:2px 9px;border-radius:10px;background:${c}22;color:${c};border:1px solid ${c}44">${l} Line</span>`;
      }).join('');

      const ixSummary = rd.noInterchange
        ? `<span style="color:var(--green)">✓ No Interchange</span>`
        : `<span style="color:var(--yellow)">🔄 ${rd.interchangeCount} Interchange${rd.interchangeCount>1?'s':''} — ${rd.interchangeStations.join(', ')}</span>`;

      fullDetailHtml = `
      <div id="rdet-${i}" style="display:none;width:100%;margin-top:8px;padding:10px 12px;background:rgba(4,6,14,.5);border:1px solid var(--bdr2);border-radius:8px">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px;font-family:'DM Mono',monospace;font-size:.6rem;color:var(--muted2)">
          <span><strong style="color:var(--text)">Origin:</strong> ${f.stKey}</span>
          <span><strong style="color:var(--text)">Destination:</strong> ${opt.key}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:2px;margin-bottom:9px">${routeChips}</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px">${lineBadges}</div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;font-family:'DM Mono',monospace;font-size:.6rem;color:var(--muted2);margin-bottom:7px">
          <span>🚉 ${rd.stopCount} stations</span>
          <span>⏱ ~${rd.costMin} min</span>
          <span>💰 ₹${fare.normal} · Smart ₹${fare.smart}</span>
        </div>
        <div style="font-family:'DM Mono',monospace;font-size:.61rem">${ixSummary}</div>
      </div>`;
    }

    return `<div class="rrow">
      <div class="r-av" style="background:${f.color}22;color:${f.color}">${f.name[0].toUpperCase()}</div>
      <div class="r-nm">${f.name}</div>
      <div class="r-arr">→</div>
      <span class="r-st o">${f.stKey.split(' ')[0]}</span>
      <div class="r-arr">→→</div>
      <span class="r-st d">${opt.key.split(' ')[0]}</span>
      <div class="r-tm">~${rd.costMin} min</div>
      <div style="width:100%;padding-left:30px;margin-top:3px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <span style="font-size:.58rem;font-family:'DM Mono',monospace;color:var(--muted2)">${sameStation?'Already here!':rd.stopCount+' stops'}</span>
        ${!sameStation?`<span style="font-size:.58rem;font-family:'DM Mono',monospace;background:rgba(252,211,77,.08);color:var(--yellow);border:1px solid rgba(252,211,77,.2);padding:1px 7px;border-radius:4px">💰 ₹${fare.normal} · Smart ₹${fare.smart}</span>`:''}
        ${rd.noInterchange&&!sameStation?'<span style="font-size:.58rem;font-family:\'DM Mono\',monospace;color:var(--green)">✓ No interchange</span>':''}
        ${!sameStation?`<span onclick="toggleRouteDetail(${i})" style="cursor:pointer;font-size:.58rem;font-family:'DM Mono',monospace;color:var(--ai);border:1px solid rgba(103,231,251,.25);padding:1px 7px;border-radius:4px;background:rgba(103,231,251,.06)">🗺️ Full route</span>`:''}
      </div>
      ${hintHtml}
      ${fullDetailHtml}
    </div>`;
  }).join('');

  document.getElementById('drawerContent').innerHTML=`
    <div class="opt-banner">
      <div style="font-size:1.6rem">🚇</div>
      <div style="flex:1">
        <div class="opt-name">${opt.key} ${nb}${ib}</div>
        <div class="opt-sub">
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${opt.co};margin-right:5px;vertical-align:middle"></span>
          ${opt.li} Line · Fairness-optimised meetpoint
        </div>
      </div>
    </div>

    <div style="background:rgba(13,21,38,.7);border:1px solid var(--bdr2);border-radius:10px;padding:12px 14px;margin-bottom:12px;backdrop-filter:blur(4px)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px">
        <span style="font-size:.6rem;font-family:'DM Mono',monospace;color:var(--muted2);text-transform:uppercase;letter-spacing:1.5px">⚖️ Fairness Score</span>
        <span style="font-size:.75rem;font-weight:700;color:${fairnessColor}">${fairnessPct}% — ${fairnessLabel}</span>
      </div>
      <div style="height:5px;background:var(--bdr2);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${fairnessPct}%;background:linear-gradient(90deg,${fairnessColor},${fairnessColor}88);border-radius:3px"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:.57rem;font-family:'DM Mono',monospace;color:var(--muted2)">
        <span>Gap between fastest & slowest: ${spread} min</span>
        <span>Max: ${maxT}m · Avg: ${avgT}m</span>
      </div>
    </div>

    <div class="stats">
      <div class="stat"><div class="big">${maxT}m</div><div class="lbl2">Longest</div></div>
      <div class="stat"><div class="big">${avgT}m</div><div class="lbl2">Average</div></div>
      <div class="stat"><div class="big">${spread}m</div><div class="lbl2">Gap</div></div>
      <div class="stat"><div class="big">${totalIx}</div><div class="lbl2">Total IX</div></div>
    </div>
    <div class="lbl">Individual Routes <span style="font-size:.55rem;color:var(--muted2);font-family:'DM Mono',monospace;letter-spacing:0">Graph-routed · fare included</span></div>
    <div class="rcard" style="margin-bottom:11px">${routeRows}</div>
    <div style="background:rgba(13,21,38,.7);border:1px solid var(--bdr2);border-radius:9px;padding:11px 14px;margin-bottom:11px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;backdrop-filter:blur(4px)">
      <div style="font-size:1.4rem">🚇</div>
      <div style="flex:1;min-width:180px">
        <div style="font-weight:700;font-size:.82rem;margin-bottom:4px">Namma Metro (BMRCL)</div>
        <div style="font-size:.65rem;font-family:'DM Mono',monospace;color:var(--muted2);line-height:1.8">
          📞 <a href="tel:18004252424" style="color:var(--ai);text-decoration:none">1800-425-2424</a> (Toll Free)<br>
          🌐 <a href="https://www.bmrcl.com" target="_blank" style="color:var(--ai);text-decoration:none">www.bmrcl.com</a><br>
          📱 App: <span style="color:var(--text)">Namma Metro</span> on Play Store / App Store<br>
          💬 WhatsApp: <a href="https://wa.me/919591112171" target="_blank" style="color:var(--ai);text-decoration:none">+91 95911 12171</a>
        </div>
      </div>
      <div style="font-size:.62rem;font-family:'DM Mono',monospace;color:var(--muted2);text-align:right;min-width:100px">
        Smart Card<br><span style="color:var(--yellow);font-size:.78rem;font-weight:700">10% OFF</span><br>every ride
      </div>
    </div>
    <div class="lbl">Nearby Places <span style="font-size:.55rem;color:var(--muted2);font-family:'DM Mono',monospace;letter-spacing:0">5km radius · AI-curated + live data</span></div>
    <div class="vrow" style="margin:7px 0">
      <button class="vc ${vibe==='all'?'on':''}" onclick="setVibe(this,'all')">🌟 All</button>
      <button class="vc ${vibe==='mall'?'on':''}" onclick="setVibe(this,'mall')">🛍️ Mall</button>
      <button class="vc ${vibe==='cafe'?'on':''}" onclick="setVibe(this,'cafe')">☕ Cafe</button>
      <button class="vc ${vibe==='arcade'?'on':''}" onclick="setVibe(this,'arcade')">🕹️ Arcade</button>
      <button class="vc ${vibe==='restaurant'?'on':''}" onclick="setVibe(this,'restaurant')">🍽️ Food</button>
      <button class="vc ${vibe==='park'?'on':''}" onclick="setVibe(this,'park')">🌳 Park</button>
      <button class="vc ${vibe==='bar'?'on':''}" onclick="setVibe(this,'bar')">🍻 Bar</button>
    </div>
    <div id="placesGrid" class="pg"></div>`;

  fetchPlaces(lastResult);
}

export async function fetchPlaces(r) {
  const grid = document.getElementById('placesGrid');
  if (!grid) return;
  const stationKey = r.opt.key;

  grid.innerHTML = `<div style="color:var(--muted2);font-size:.78rem;padding:16px;text-align:center">Finding nearby spots…</div>`;

  // FEATURE_FLAGS.LIVE_PLACES gates whether we even try the live
  // provider chain — when off, go straight to the static provider.
  // Either way, a failure degrades gracefully via ErrorBoundary
  // rather than leaving the drawer stuck on "Finding nearby spots…".
  const places = await ErrorBoundary.guardAsync('Places', async () => {
    return FEATURE_FLAGS.LIVE_PLACES
      ? await getNearbyPlacesForStation(stationKey)
      : await NEARBY_PLACE_PROVIDERS.static.getNearbyPlaces(stationKey, ['all']);
  }, [], { stationKey });

  const filtered = vibe === 'all' ? places : places.filter(p => p.category === vibe);
  renderPlaces(filtered.length ? filtered : places);
}

export function gmapsUrl(name, stationKey) {
  const st = ST[stationKey] || {};
  // Search near station lat/lon for better results
  if (st.la && st.lo) {
    return `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${st.la},${st.lo},15z`;
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(name + ' Bangalore')}`;
}

export function renderPlaces(places) {
  setLastDisplayedPlaces(places || []);
  const grid = document.getElementById('placesGrid');
  if (!grid || !places.length) {
    if (grid) grid.innerHTML = `<div style="color:var(--muted2);font-size:.78rem;padding:16px;text-align:center">No ${vibe} spots found nearby.<br>Try <strong>All</strong> vibe!</div>`;
    return;
  }
  const stKey = lastResult?.opt?.key || '';
  grid.innerHTML = places.map((p, i) => {
    const mapsUrl = gmapsUrl(p.name, stKey);
    const emoji = p.emoji || TYPE_EMOJI[p.category] || '📍';
    return `
    <div class="pc" style="animation-delay:${i*.05}s" onclick="window.open('${mapsUrl}','_blank')">
      <div class="pc-hd">
        <div class="pc-em">${emoji}</div>
        <div><div class="pc-nm">${p.name}</div><div class="pc-tp">${p.category}</div></div>
      </div>
      <div class="pc-nt">${p.note||''}</div>
      <div class="pc-tgs">
        <span class="pc-t d">📍 ${p.distance!=null ? p.distance.toFixed(1)+'km' : '~2km'}</span>
        ${p.rating?`<span class="pc-t r" style="color:var(--yellow);border-color:rgba(252,211,77,.25);background:rgba(252,211,77,.06)">⭐ ${p.rating}</span>`:''}
        <span class="pc-t gmaps">🗺 Open in Maps</span>
      </div>
    </div>`;
  }).join('');
}

export function openDrawer() { document.getElementById('drawer').classList.add('open'); }

export function closeDrawer(){ document.getElementById('drawer').classList.remove('open'); }

// Show/hide a friend's full station-by-station route panel
export function toggleRouteDetail(i){
  const el = document.getElementById(`rdet-${i}`);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}


export function sw(id,btn){
  ['friends','lines','guide'].forEach(t=>document.getElementById('p-'+t).style.display=t===id?'block':'none');
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
}

