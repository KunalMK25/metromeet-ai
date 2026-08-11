import { friends } from '../rendering/state.js';
import { findOptimal } from '../core/optimization.js';

/**
 * AI module — data-grounded direct-answer layer.
 * @summary Purpose: answer the questions the app can precisely answer
 *   from ctx alone (why this station, longest traveler, interchange
 *   count, closest place, a named friend's route, a "what if X left"
 *   hypothetical) with zero network calls. Returns null for anything
 *   it doesn't recognize so sendMsg() falls through to Claude/offline.
 * @param {string} q - the user's message, already lower-cased
 * @param {Object} ctx - a buildAppContext() snapshot
 * @returns {(string|null)} a formatted answer, or null if unmatched
 * @complexity O(1)–O(N) depending on pattern (the "remove a friend"
 *   hypothetical calls findOptimal() once on a smaller friend list).
 * @sideEffects None.
 */
export function contextAwareAnswer(q, ctx){
  const has = w => q.includes(w);

  // "Why was this meetup station chosen?"
  if (ctx.meetup && has('why') && (has('meet') || has('station') || has('chosen') || has('pick'))){
    const m = ctx.meetup;
    return `🚇 **${m.station}** was chosen because it minimises the *worst-case* journey while keeping everyone's travel time close together — not just the shortest total.\n\n`
      + `• Longest journey: **${m.longestTravelMin} min**\n`
      + `• Average journey: **${m.averageTravelMin} min**\n`
      + `• Fairness gap (slowest − fastest): **${m.fairnessGapMin} min** (${m.fairnessPercent}% fair)\n`
      + `• Total interchanges across the group: **${m.totalInterchanges}**\n`
      + (m.stationAttractivenessScore!=null ? `• Nearby hangout options were factored in too (Station Attractiveness Score: **${m.stationAttractivenessScore}**)\n` : '')
      + `\nOther candidates either made someone travel much further, or needed more interchanges.`;
  }

  // "Which station would change if <friend> were removed / left / dropped out?"
  if (ctx.meetup && friends.length>2 && (has('remove')||has('without')||has('left')||has('drop')||has("weren't")||has('werent'))){
    const target = friends.find(f => q.includes(f.name.toLowerCase()));
    if (target){
      const remainingKeys = friends.filter(f=>f!==target).map(f=>f.stKey);
      // Reuses the existing, unmodified findOptimal()/dijkstra() engine —
      // this is a real "what-if" query, not a duplicated algorithm.
      const altOpt = findOptimal(remainingKeys);
      if (altOpt){
        return altOpt.key === ctx.meetup.station
          ? `🔍 Even without **${target.name}**, the best meetup station stays **${altOpt.key}** — it's still the fairest pick for the rest of the group.`
          : `🔍 Without **${target.name}**, the optimiser would pick **${altOpt.key}** (${altOpt.li} Line) instead of **${ctx.meetup.station}**.`;
      }
    }
  }

  // "Which friend travels the longest / most / farthest?"
  if (ctx.routes.length && (has('longest')||has('farthest')||has('furthest')||((has('most'))&&(has('travel')||has('time')||has('far'))))){
    const worst = ctx.routes.reduce((a,b)=> b.travelMinutes>a.travelMinutes?b:a);
    return `⏱️ **${worst.friend}** has the longest journey — **${worst.travelMinutes} min** from ${worst.from} to ${ctx.meetup.station} (${worst.stops} stops, ${worst.interchangeCount} interchange${worst.interchangeCount!==1?'s':''}).`;
  }

  // "How many interchanges are required/needed?"
  if (ctx.meetup && has('interchange') && (has('how many')||has('how much')||has('required')||has('need')||has('total'))){
    const breakdown = ctx.routes.map(r=>`• **${r.friend}**: ${r.interchangeCount===0?'No interchange':r.interchangeCount+' at '+r.interchangeStations.join(', ')}`).join('\n');
    return `🔄 Across the group: **${ctx.meetup.totalInterchanges}** total interchange${ctx.meetup.totalInterchanges!==1?'s':''} needed.\n\n${breakdown}`;
  }

  // "Which café / restaurant / mall / bar / park / arcade is closest?"
  // and the broader family of nearby-place queries the user can ask when
  // places are already displayed — e.g. "Is there any mall nearby?",
  // "Any cafes nearby?", "Are there restaurants?", "Show me nearby
  // restaurants", "What's the closest mall?". All answered from
  // ctx.nearbyPlacesShown (the actually-loaded place data) — never
  // invented.
  const placeCat = (has('cafe')||has('coffee')) ? 'cafe'
                 : (has('restaurant')||has('food')) ? 'restaurant'
                 : has('mall') ? 'mall'
                 : (has('bar')||has('pub')) ? 'bar'
                 : has('park') ? 'park'
                 : has('arcade') ? 'arcade'
                 : null;
  const closestIntent = has('closest') || has('nearest');
  // A "nearby-place question" iff the user asks about proximity AND a
  // place-y intent (closest/nearest, or listing/availability wording).
  // The bare presence of "nearby"/"near" alone is NOT enough — that
  // would also swallow "where is the nearest X to my house?" style
  // general questions we should hand to Claude. We additionally
  // require a recognized proximity/availability cue so unrelated
  // questions still fall through.
  const listIntent = has('nearby') || has('near') || has('any')
                  || has('are there') || has('is there') || has("isn't there")
                  || has('show') || has("what's") || has('where') || has('list');
  // A category-less aggregate query ("what's nearby?", "show me nearby
  // places", "any spots near here?") is only treated as a nearby-place
  // question when the user explicitly says "places"/"spots"/"hangouts"
  // alongside a proximity/availability cue — so we don't accidentally
  // swallow "what's near MG Road?" (general) and hand it to Claude.
  const aggregateIntent = (has('places')||has('spots')||has('hangouts')||has('hangout'))
                        && (has('nearby')||has('near')||has('any')||has('show')||has("what's")||has('where')||has('list'));
  if (closestIntent || (placeCat!=null && listIntent) || aggregateIntent){
    const pool = placeCat ? ctx.nearbyPlacesShown.filter(p=>p.category===placeCat)
                          : ctx.nearbyPlacesShown;
    const stationName = ctx.meetup?.station;

    // ── No nearby-place data loaded at all: say so explicitly. ──
    // This is the core fix: previously "Is there any mall nearby?"
    // fell through to the generic help response because no block
    // recognized the existence/availability form.
    if (!ctx.nearbyPlacesShown.length){
      const what = placeCat || 'place';
      return `📍 No nearby places are currently loaded${stationName?` for **${stationName}**`:''}. Open the **Nearby Places** drawer (or run a meetup search) first, then ask me about ${what}s.`;
    }

    // ── Places are loaded, but none match the requested category. ──
    if (!pool.length){
      return `📍 I don't see any **${placeCat}** spots in the places currently loaded${stationName?` near **${stationName}**`:''}. Try switching the vibe filter to **${placeCat}** (or **All**) in the Nearby Places drawer, or pick a different category.`;
    }

    // ── Matches found. Format with name / category / distance /
    // rating / Maps link, using the already-computed place data. ──
    const mapsLink = p => {
      if (p.latitude!=null && p.longitude!=null){
        return `https://www.google.com/maps/search/${encodeURIComponent(p.name)}/@${p.latitude},${p.longitude},15z`;
      }
      return `https://www.google.com/maps/search/${encodeURIComponent((p.name||'')+' Bangalore')}`;
    };

    // Single-closest answer for "closest X" / "what's the closest X".
    if (closestIntent){
      const closest = pool.reduce((a,b)=> (b.distanceKm??99) < (a.distanceKm??99) ? b : a);
      const dkm = closest.distanceKm;
      return `📍 The closest ${placeCat||'spot'} currently shown is **${closest.name}** — about **${dkm}km** away${closest.rating?` (⭐ ${closest.rating})`:''}.\n🗺️ [Open in Maps](${mapsLink(closest)})`;
    }

    // Listing answer for "is there any / any / are there / show me".
    const shown = pool.slice(0, 5)
      .map(p => `• **${p.name}** — ${p.category}, ~${p.distanceKm}km${p.rating?` · ⭐ ${p.rating}`:''}\n  🗺️ [Open in Maps](${mapsLink(p)})`)
      .join('\n');
    const more = pool.length>5 ? `\n_(…and ${pool.length-5} more in the Nearby Places drawer.)_` : '';
    const header = placeCat
      ? `📍 ${pool.length} **${placeCat}** ${pool.length===1?'spot is':'spots are'} currently shown`
      : `📍 ${pool.length} ${pool.length===1?'place is':'places are'} currently shown`;
    const where = stationName ? ` near **${stationName}**` : '';
    return `${header}${where}:\n\n${shown}${more}`;
  }

  // "What route should <friend> take?" / "how does <friend> get there?"
  const mentioned = ctx.routes.find(r => q.includes(r.friend.toLowerCase()));
  if (mentioned && (has('route')||has('how')||has('go')||has('take')||has('reach')||has('get to'))){
    const r = mentioned;
    return `🗺️ **${r.friend}**'s route: ${r.fullPath.join(' → ')}\n\n`
      + `Lines: ${r.linesUsed.join(' → ')} · ${r.stops} stops · ~${r.travelMinutes} min\n`
      + `${r.interchangeCount ? '🔄 Interchange at '+r.interchangeStations.join(', ') : '✓ No interchange'}\n`
      + `💰 Fare: ₹${r.fareNormal} (Smart Card ₹${r.fareSmartCard})`;
  }

  return null; // not a recognised app-state question — let the caller fall through
}
