import { meetContext } from '../rendering/state.js';

export const BOT_KB = {
  // Fare lookups by stop count keywords
  fare: {
    response: (q) => {
      const fareTable = [
        {max:2,  n:10,  s:10},
        {max:5,  n:20,  s:18},
        {max:8,  n:30,  s:27},
        {max:12, n:40,  s:36},
        {max:16, n:50,  s:45},
        {max:21, n:60,  s:54},
        {max:99, n:70,  s:63},
      ];
      return `💰 **Namma Metro Fare Slabs:**\n\n` +
        `• 1–2 stops: ₹10 (Smart: ₹10)\n` +
        `• 3–5 stops: ₹20 (Smart: ₹18)\n` +
        `• 6–8 stops: ₹30 (Smart: ₹27)\n` +
        `• 9–12 stops: ₹40 (Smart: ₹36)\n` +
        `• 13–16 stops: ₹50 (Smart: ₹45)\n` +
        `• 17–21 stops: ₹60 (Smart: ₹54)\n` +
        `• 22+ stops: ₹70 (Smart: ₹63)\n\n` +
        `🎫 **Smart Card** = 10% off every ride. Get one at any station counter for ₹100 deposit + ₹50 minimum balance.\n\n` +
        `One ticket covers the entire journey even across line changes — no re-entry fee! 🚇`;
    }
  },

  // Route rules: [from keywords] → [to keywords] → response
  routes: [
    {
      from: ['whitefield','kadugodi','itpl','pattandur','hopefarm'],
      to:   ['electronic city','ec','bommasandra','biocon','infosys','konappana'],
      ans:  `🟣→🟢→🟡 **Whitefield → Electronic City:**\n\n1. Board **Purple Line** at Whitefield heading towards **Challaghatta** (westbound)\n2. Ride to **Majestic** (~35 min, ~20 stops)\n3. 🔄 Change to **Green Line** at Majestic — follow signs to elevated platform (~5 min walk)\n4. Take Green Line southbound towards **Silk Institute**\n5. At **RV Road**, 🔄 change to **Yellow Line** (same level, follow signs)\n6. Ride Yellow Line to **Electronic City** (~8 stops, ~16 min)\n\n⏱ Total: ~60–65 min | 💰 ₹70 (Smart: ₹63)`
    },
    {
      from: ['indiranagar','halasuru','trinity'],
      to:   ['electronic city','ec','bommasandra','biocon'],
      ans:  `🟣→🟢→🟡 **Indiranagar → Electronic City:**\n\n1. Board **Purple Line** at Indiranagar heading **west** towards Challaghatta\n2. Ride to **Majestic** (~10 min, ~6 stops)\n3. 🔄 Change to **Green Line** — elevated platform (~5 min walk)\n4. Take Green Line south to **RV Road** (~8 stops)\n5. 🔄 Change to **Yellow Line** at RV Road (same level)\n6. Ride to **Electronic City** (~8 stops, ~16 min)\n\n⏱ Total: ~40 min | 💰 ₹50 (Smart: ₹45)`
    },
    {
      from: ['mg road','brigade','cubbon','trinity','indiranagar'],
      to:   ['yeshwanthpur','orion','rajajinagar','malleshwaram'],
      ans:  `🟣→🟢 **MG Road → Yeshwanthpur:**\n\n1. Board **Purple Line** at MG Road heading **west** towards Challaghatta\n2. Ride to **Majestic** (~5 min, 2 stops)\n3. 🔄 Change to **Green Line** at Majestic — follow signs to elevated platform (~5 min walk)\n4. Take Green Line **north** towards Madavara\n5. Alight at **Yeshwanthpur** (~4 stops, ~8 min)\n\n⏱ Total: ~20 min | 💰 ₹20 (Smart: ₹18)\n\n🛍️ **Orion Mall** is a 10-min walk from Yeshwanthpur station!`
    },
    {
      from: ['silk institute','jp nagar','banashankari','jayanagar'],
      to:   ['whitefield','itpl','indiranagar','baiyappanahalli'],
      ans:  `🟢→🟣 **South Green Line → East Purple Line:**\n\n1. Board **Green Line** heading **north** towards Madavara\n2. Ride to **Majestic** (~15–20 min)\n3. 🔄 Change to **Purple Line** at Majestic (underground platform)\n4. Take Purple Line **east** towards Whitefield\n5. Alight at your destination\n\nℹ️ No need to change at RV Road — that's only for Yellow Line!`
    },
    {
      from: ['btm','hsr','bommanahalli','koramangala','silk board'],
      to:   ['mg road','indiranagar','whitefield','majestic'],
      ans:  `🟡→🟢→🟣 **Yellow Line → North/East:**\n\n1. Board **Yellow Line** heading **north** towards RV Road\n2. Ride to **RV Road** (~4–8 stops)\n3. 🔄 Change to **Green Line** at RV Road (same level — easy!)\n4. Take Green Line **north** through Majestic\n5. At **Majestic**, 🔄 change to **Purple Line** if going east (Indiranagar, Whitefield)\n\n⏱ BTM→MG Road: ~30 min | 💰 ₹40 (Smart: ₹36)`
    },
  ],

  // Keyword → canned response map
  keywords: [
    {
      keys: ['majestic','interchange','change','switch','transfer'],
      ans:  `🔄 **Changing Lines at Majestic:**\n\n**Purple → Green (or vice versa):**\n• Purple Line is **underground**\n• Green Line is **elevated** (above ground)\n• Follow the colour-coded walkway signs\n• Walk time: **~5 minutes**\n• Look for **Gate 5** exit if coming from Purple\n• No extra ticket needed — one ticket covers both!\n\n⏱ Add 5–7 min to your journey for the walk and waiting for the next train.`
    },
    {
      keys: ['rv road','yellow','yellow line'],
      ans:  `🟡 **Yellow Line (Inaugurated Aug 2025):**\n\nRoute: **RV Road ↔ Delta Electronics Bommasandra**\n16 stations · 19 km\n\nKey stations:\n• RV Road 🔄 (Green Line interchange)\n• Ragigudda\n• Jayadeva Hospital\n• BTM Layout\n• Central Silk Board (future Blue line)\n• Bommanahalli (HSR Layout area)\n• Electronic City\n• Infosys Konappana Agrahara\n• Biocon Hebbagodi\n• Bommasandra\n\n🔄 **Interchange at RV Road** with Green Line — same level, easiest interchange in the network!\n\n💡 Great for: BTM, HSR, Electronic City, Infosys, Biocon corridors`
    },
    {
      keys: ['smart card','card','discount','token'],
      ans:  `🎫 **Smart Card vs Token:**\n\n**Smart Card:**\n• ₹100 refundable deposit + ₹50 minimum balance\n• **10% discount** on every ride\n• Recharge at any counter or kiosk\n• Tap-in tap-out — faster boarding\n• Available at all station counters\n\n**Single Journey Token:**\n• Buy at kiosk or counter\n• No discount\n• Use once and return\n\n**Verdict:** If you'll use metro more than 5 times, Smart Card pays for itself! 💚\n\n📱 Also available: **Namma Metro App** — QR tickets on your phone!`
    },
    {
      keys: ['timing','time','first train','last train','hours','open','close'],
      ans:  `🕐 **Namma Metro Timings:**\n\n• First train: **~5:00 AM**\n• Last train: **~11:00 PM**\n\n**Frequency:**\n• Peak hours (8–10 AM, 5–8 PM): every **3–5 minutes**\n• Off-peak: every **7–12 minutes**\n• Sundays: starts from **7:00 AM**\n\n💡 Tip: Arrive 5 min before your preferred train during peak hours — it gets crowded fast!`
    },
    {
      keys: ['indiranagar','100 feet','toit','brewpub','windmill'],
      ans:  `🍻 **Hangout Spots near Indiranagar Metro:**\n\n🍺 **Toit Brewpub** (0.7km) — Best craft brewery in India, rating 4.6 ⭐\n☕ **Third Wave Coffee** (0.5km) — Specialty coffee paradise, rating 4.5 ⭐\n🍽️ **100 Feet Road** (0.3km) — BLR's best food street, rating 4.5 ⭐\n🍻 **Windmill Craftworks** (1.2km) — Rooftop craft beers, rating 4.3 ⭐\n🕹️ **Smaaash** (0.8km) — VR + sports gaming, rating 4.2 ⭐\n\n📍 All within easy walking distance from Indiranagar station exit!`
    },
    {
      keys: ['mg road','church street','brigade','koshy'],
      ans:  `🎉 **Hangout Spots near MG Road Metro:**\n\n🛍️ **1MG Lakeview Mall** (0.5km) — Right on MG Road, rating 4.2 ⭐\n🌳 **Cubbon Park** (0.4km) — 120-acre city park, rating 4.6 ⭐\n☕ **Koshy's Cafe** (0.9km) — Iconic BLR cafe since 1940, rating 4.5 ⭐\n🍻 **Church Street Social** (1.0km) — Day-to-night hotspot, rating 4.4 ⭐\n🍻 **The Biere Club** (1.3km) — Pioneer craft beer in BLR, rating 4.4 ⭐\n🛍️ **UB City Mall** (1.2km) — Luxury mall + rooftop dining, rating 4.5 ⭐\n\n📍 MG Road is the best-connected station for central BLR hangouts!`
    },
    {
      keys: ['orion','yeshwanthpur','rajajinagar'],
      ans:  `🛍️ **Hangout Spots near Yeshwanthpur Metro:**\n\n🛍️ **Orion Mall** (0.8km) — Premium mall + IMAX cinema, rating 4.5 ⭐\n🎬 **PVR IMAX** (0.9km) — Best IMAX screen in BLR, rating 4.4 ⭐\n🍻 **Monkey Bar** (1.5km) — Fun cocktails + food, rating 4.3 ⭐\n🌳 **Lumbini Gardens** (2.5km) — Lake views + paddle boats, rating 4.2 ⭐\n🌳 **Sankey Tank** (3.0km) — Beautiful lakeside walk, rating 4.5 ⭐`
    },
    {
      keys: ['lalbagh','jayanagar','vidyarthi','matteo'],
      ans:  `🌳 **Hangout Spots near Jayanagar Metro:**\n\n🌳 **Lalbagh Botanical Garden** (1.8km) — BLR's iconic 150-acre garden, rating 4.7 ⭐\n🍽️ **Vidyarthi Bhavan** (0.4km) — Legendary masala dosa since 1943, rating 4.8 ⭐\n☕ **Matteo Coffea** (0.6km) — Best specialty coffee in south BLR, rating 4.5 ⭐\n🍽️ **Jayanagar 4th Block** (0.5km) — Street food heaven, rating 4.4 ⭐`
    },
    {
      keys: ['electronic city','forum','biocon','infosys','e-city'],
      ans:  `💻 **Hangout Spots near Electronic City Metro:**\n\n🛍️ **Forum Shantiniketan Mall** (1.0km) — Primary mall in E-City, rating 4.2 ⭐\n🌳 **Eco World Park** (1.2km) — Green space in the tech hub, rating 4.0 ⭐\n☕ **Third Wave Coffee** (0.8km) — Quality brews, rating 4.4 ⭐\n🍻 **Byg Brewski Sarjapur** (4.0km) — Massive outdoor brewery, rating 4.5 ⭐\n🍽️ **Biryani Zone** (0.4km) — Quick & flavourful, rating 4.3 ⭐`
    },
    {
      keys: ['contact','number','phone','website','helpline','bmrcl'],
      ans:  `📞 **Namma Metro Contact Info:**\n\n• **Helpline:** 1800-425-2424 (Toll Free)\n• **Website:** www.bmrcl.com\n• **App:** Namma Metro (Play Store / App Store)\n• **WhatsApp:** +91 95911 12171\n• **Email:** info@bmrcl.com\n\n🕐 Helpline available during metro operating hours (5 AM – 11 PM)`
    },
    {
      keys: ['airport','kial','terminal','fly','flight'],
      ans:  `✈️ **Airport Connectivity (Upcoming):**\n\nThe **Blue Line (Phase 2A)** will connect **KR Puram → KIAL Airport** once operational.\n\n**Currently:** No direct metro to Kempegowda International Airport.\n\n**Best options now:**\n• KIAS Shuttle bus from MG Road / Hebbal\n• Ola/Uber (~45–90 min depending on traffic)\n• BMTC Vayu Vajra bus from various city points\n\n💡 The Blue Line airport connection is expected in the next few years!`
    },
    {
      keys: ['accessible','wheelchair','lift','disability','ramp'],
      ans:  `♿ **Accessibility at Namma Metro:**\n\n• **Lifts** at all stations (both entrance and platform)\n• **Ramps** at all entry/exit points\n• **Wheelchair-accessible coaches** — Coach 1 of every train\n• **Priority seating** near all doors\n• **Tactile paths** for visually impaired\n• **Audio announcements** in Kannada, Hindi & English\n• **Braille signage** at key locations\n\n💚 Namma Metro is one of India's most accessible transit systems!`
    },
  ]
};

export function offlineBotReply(msg) {
  const q = msg.toLowerCase();

  // Check direct route patterns first
  for (const route of BOT_KB.routes) {
    const fromMatch = route.from.some(f => q.includes(f));
    const toMatch   = route.to.some(t => q.includes(t));
    if (fromMatch && toMatch) return route.ans;
  }

  // Check keyword patterns
  for (const kb of BOT_KB.keywords) {
    if (kb.keys.some(k => q.includes(k))) return kb.ans;
  }

  // Fare question
  if (q.includes('fare') || q.includes('cost') || q.includes('price') || q.includes('₹') || q.includes('rupee')) {
    return BOT_KB.fare.response(q);
  }

  // Meet context aware response
  if (meetContext && (q.includes('meet') || q.includes('station') || q.includes('where') || q.includes('which'))) {
    const opt = meetContext.opt;
    const maxT = meetContext.maxT;
    const avgT = meetContext.avgT;
    return `🚇 Based on your current group, the best meet point is **${opt.key}** (${opt.li} Line).\n\nLongest journey: ~${maxT} min · Average: ~${avgT} min\n\nFrom there, check the **Nearby Places** section in the drawer for hangout spots! You can also ask me about specific places near **${opt.key}**.`;
  }

  // Generic helpful fallback
  return `🤖 I can help you with:\n\n• 🗺 **Routes** — "How to go from Whitefield to Electronic City?"\n• 💰 **Fares** — "What is the fare from MG Road to Silk Board?"\n• 🔄 **Interchanges** — "How to change lines at Majestic?"\n• 🟡 **Yellow Line** — "Tell me about the Yellow Line"\n• 🎫 **Smart Card** — "How to get a smart card?"\n• 🕐 **Timings** — "What time is the first train?"\n• 🍽️ **Hangouts** — "Best spots near Indiranagar metro?"\n• 📞 **Contact** — "Namma Metro helpline number?"\n\nTry one of the quick buttons below or type your question! 👇`;
}
