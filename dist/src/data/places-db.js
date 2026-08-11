// ═══════════════════════════════════════════════════════════
//  data/places-db.js
//  Relocated from the monolith, byte-identical bodies.
// ═══════════════════════════════════════════════════════════

export const OSM_TAGS = {
  all:        [["amenity","restaurant"],["amenity","cafe"],["shop","mall"],["leisure","park"],["amenity","bar"]],
  mall:       [["shop","mall"],["shop","supermarket"]],
  cafe:       [["amenity","cafe"]],
  arcade:     [["leisure","arcade"],["leisure","bowling_alley"]],
  restaurant: [["amenity","restaurant"],["amenity","fast_food"]],
  park:       [["leisure","park"],["leisure","garden"]],
  bar:        [["amenity","bar"],["amenity","pub"],["amenity","brewery"]],
};
export const TYPE_EMOJI = {restaurant:"🍽️",cafe:"☕",fast_food:"🍟",bar:"🍻",pub:"🍻",brewery:"🍺",
                   park:"🌳",garden:"🌿",mall:"🛍️",supermarket:"🛒",arcade:"🕹️",bowling_alley:"🎳"};


export const PLACES_DB = {
  "MG Road":        [
    {n:"1MG Lakeview Mall",t:"mall",e:"🛍️",d:"0.5km",r:"4.2",note:"Right on MG Road"},
    {n:"UB City Mall",t:"mall",e:"🛍️",d:"1.2km",r:"4.5",note:"Luxury mall, rooftop dining"},
    {n:"Cubbon Park",t:"park",e:"🌳",d:"0.4km",r:"4.6",note:"120-acre city park"},
    {n:"Koshy's Cafe",t:"cafe",e:"☕",d:"0.9km",r:"4.5",note:"Iconic BLR cafe since 1940"},
    {n:"Church Street Social",t:"bar",e:"🍻",d:"1.0km",r:"4.4",note:"Day-to-night hotspot"},
    {n:"The Biere Club",t:"bar",e:"🍻",d:"1.3km",r:"4.4",note:"Pioneer craft beer"},
    {n:"Bowled Over",t:"arcade",e:"🕹️",d:"1.5km",r:"4.1",note:"Bowling + gaming"},
    {n:"Toscano",t:"restaurant",e:"🍽️",d:"1.2km",r:"4.3",note:"Italian fine dining"},
    {n:"Vidyarthi Bhavan",t:"restaurant",e:"🍽️",d:"4.5km",r:"4.8",note:"Legendary dosa since 1943"},
  ],
  "Indiranagar":    [
    {n:"Toit Brewpub",t:"bar",e:"🍻",d:"0.7km",r:"4.6",note:"Best craft brewery in India"},
    {n:"Third Wave Coffee",t:"cafe",e:"☕",d:"0.5km",r:"4.5",note:"Specialty coffee roasters"},
    {n:"100 Feet Road Food Street",t:"restaurant",e:"🍽️",d:"0.3km",r:"4.5",note:"Every cuisine imaginable"},
    {n:"Windmill Craftworks",t:"bar",e:"🍻",d:"1.2km",r:"4.3",note:"Rooftop craft beers"},
    {n:"Smaaash",t:"arcade",e:"🕹️",d:"0.8km",r:"4.2",note:"VR + sports gaming"},
    {n:"Bangalore Central Mall",t:"mall",e:"🛍️",d:"1.0km",r:"4.0",note:"Good variety"},
    {n:"Cubbon Park",t:"park",e:"🌳",d:"3.5km",r:"4.6",note:"Metro accessible!"},
    {n:"Smoke House Deli",t:"restaurant",e:"🍽️",d:"0.9km",r:"4.4",note:"Great brunch"},
  ],
  "Trinity":        [
    {n:"MG Road Pub Street",t:"bar",e:"🍻",d:"0.5km",r:"4.3",note:"BLR's famous pub mile"},
    {n:"Hard Rock Cafe",t:"bar",e:"🍻",d:"0.8km",r:"4.2",note:"Live music + food"},
    {n:"1MG Mall",t:"mall",e:"🛍️",d:"0.6km",r:"4.2",note:"Right on the strip"},
    {n:"Levi's Store",t:"mall",e:"🛍️",d:"0.4km",r:"4.0",note:"Brigade Road shopping"},
    {n:"Toit Brewpub",t:"bar",e:"🍻",d:"1.5km",r:"4.6",note:"Best brewery in India"},
    {n:"Third Wave Coffee",t:"cafe",e:"☕",d:"1.2km",r:"4.5",note:"Specialty brews"},
    {n:"Cubbon Park",t:"park",e:"🌳",d:"1.0km",r:"4.6",note:"Perfect morning walk"},
  ],
  "Majestic":       [
    {n:"CTR (Central Tiffin Room)",t:"restaurant",e:"🍽️",d:"2.0km",r:"4.7",note:"Legendary masala dosa"},
    {n:"Kamat Hotel",t:"restaurant",e:"🍽️",d:"0.6km",r:"4.3",note:"Classic South Indian"},
    {n:"Cubbon Park",t:"park",e:"🌳",d:"1.5km",r:"4.6",note:"City's green lung"},
    {n:"Commercial Street",t:"mall",e:"🛍️",d:"2.5km",r:"4.3",note:"Best street shopping in BLR"},
    {n:"Tipu Sultan's Palace",t:"park",e:"🏛️",d:"1.0km",r:"4.4",note:"Historic monument"},
  ],
  "Yeshwanthpur":   [
    {n:"Orion Mall",t:"mall",e:"🛍️",d:"0.8km",r:"4.5",note:"Premium mall + IMAX"},
    {n:"PVR IMAX Orion",t:"arcade",e:"🕹️",d:"0.9km",r:"4.4",note:"Best IMAX in BLR"},
    {n:"Monkey Bar",t:"bar",e:"🍻",d:"1.5km",r:"4.3",note:"Fun cocktails + food"},
    {n:"Third Wave Coffee",t:"cafe",e:"☕",d:"1.1km",r:"4.5",note:"Great brews"},
    {n:"Lumbini Gardens",t:"park",e:"🌳",d:"2.5km",r:"4.2",note:"Lake views + paddle boats"},
    {n:"Sankey Tank",t:"park",e:"🌳",d:"3.0km",r:"4.5",note:"Beautiful lake walk"},
    {n:"Empire Restaurant",t:"restaurant",e:"🍽️",d:"2.0km",r:"4.3",note:"Iconic BLR biryani"},
  ],
  "Rajajinagar":    [
    {n:"Orion Mall",t:"mall",e:"🛍️",d:"2.5km",r:"4.5",note:"Best mall in west BLR"},
    {n:"Empire Restaurant",t:"restaurant",e:"🍽️",d:"0.5km",r:"4.3",note:"Iconic BLR biryani"},
    {n:"Sankey Tank",t:"park",e:"🌳",d:"1.2km",r:"4.5",note:"Beautiful lakeside walk"},
    {n:"A2B (Adyar Ananda Bhavan)",t:"restaurant",e:"🍽️",d:"0.7km",r:"4.2",note:"South Indian chain"},
    {n:"Big Brewsky",t:"bar",e:"🍻",d:"4.0km",r:"4.4",note:"Massive craft brewery"},
  ],
  "Jayanagar":      [
    {n:"Lalbagh Botanical Garden",t:"park",e:"🌳",d:"1.8km",r:"4.7",note:"BLR's iconic garden"},
    {n:"Vidyarthi Bhavan",t:"restaurant",e:"🍽️",d:"0.4km",r:"4.8",note:"Legendary dosa since 1943"},
    {n:"Matteo Coffea",t:"cafe",e:"☕",d:"0.6km",r:"4.5",note:"Best specialty coffee south BLR"},
    {n:"Jayanagar 4th Block",t:"restaurant",e:"🍽️",d:"0.5km",r:"4.4",note:"Street food heaven"},
    {n:"South End Circle Market",t:"mall",e:"🛍️",d:"1.0km",r:"4.0",note:"Local shopping hub"},
    {n:"Janatha Hotel",t:"restaurant",e:"🍽️",d:"0.8km",r:"4.5",note:"Authentic Udupi food"},
  ],
  "JP Nagar":       [
    {n:"Gopalan Arcade Mall",t:"mall",e:"🛍️",d:"0.5km",r:"4.1",note:"Local favourite"},
    {n:"Bannerghatta National Park",t:"park",e:"🌳",d:"4.5km",r:"4.4",note:"Safari + zoo"},
    {n:"Third Wave Coffee",t:"cafe",e:"☕",d:"0.8km",r:"4.4",note:"Great beans"},
    {n:"Tamarind Tree",t:"restaurant",e:"🍽️",d:"1.2km",r:"4.3",note:"Beautiful garden dining"},
    {n:"Meenakshi Mall",t:"mall",e:"🛍️",d:"2.0km",r:"4.0",note:"Good shopping options"},
  ],
  "Jayadeva Hospital":[
    {n:"Forum Mall Koramangala",t:"mall",e:"🛍️",d:"2.0km",r:"4.3",note:"Popular south BLR mall"},
    {n:"Arbor Brewing Co.",t:"bar",e:"🍻",d:"2.5km",r:"4.4",note:"American craft brewery"},
    {n:"Matteo Coffea",t:"cafe",e:"☕",d:"1.8km",r:"4.5",note:"Top specialty coffee"},
    {n:"Lalbagh Garden",t:"park",e:"🌳",d:"3.0km",r:"4.7",note:"Must visit"},
    {n:"Koramangala Social",t:"restaurant",e:"🍽️",d:"2.2km",r:"4.3",note:"Trendy day-to-night"},
  ],
  "BTM Layout":     [
    {n:"Forum Value Mall",t:"mall",e:"🛍️",d:"1.5km",r:"4.0",note:"Good everyday shopping"},
    {n:"BTM Food Court",t:"restaurant",e:"🍽️",d:"0.3km",r:"4.2",note:"Loads of local food"},
    {n:"Starbucks BTM",t:"cafe",e:"☕",d:"0.5km",r:"4.1",note:"Reliable coffee"},
    {n:"Koramangala Social",t:"bar",e:"🍻",d:"2.0km",r:"4.3",note:"Classic hangout"},
    {n:"27th Main HSR",t:"restaurant",e:"🍽️",d:"2.5km",r:"4.5",note:"BLR's best food street"},
  ],
  "Central Silk Board":[
    {n:"27th Main HSR Layout",t:"restaurant",e:"🍽️",d:"2.0km",r:"4.5",note:"Incredible food street"},
    {n:"Hole in the Wall Cafe",t:"cafe",e:"☕",d:"2.5km",r:"4.5",note:"Cosy cafe in HSR"},
    {n:"Decathlon HSR",t:"mall",e:"🛍️",d:"2.0km",r:"4.4",note:"Sports paradise"},
    {n:"Agara Lake",t:"park",e:"🌳",d:"1.5km",r:"4.2",note:"Peaceful lake walk"},
    {n:"The White Owl",t:"bar",e:"🍻",d:"3.0km",r:"4.3",note:"Great craft beer"},
  ],
  "Electronic City": [
    {n:"Forum Shantiniketan Mall",t:"mall",e:"🛍️",d:"1.0km",r:"4.2",note:"Primary mall in E-City"},
    {n:"Eco World Park",t:"park",e:"🌳",d:"1.2km",r:"4.0",note:"Green space in tech hub"},
    {n:"Third Wave Coffee",t:"cafe",e:"☕",d:"0.8km",r:"4.4",note:"Quality brews"},
    {n:"Byg Brewski Sarjapur",t:"bar",e:"🍻",d:"4.0km",r:"4.5",note:"Outdoor brewery"},
    {n:"Biryani Zone",t:"restaurant",e:"🍽️",d:"0.4km",r:"4.3",note:"Quick & flavourful"},
  ],
  "RV Road":        [
    {n:"Lalbagh Botanical Garden",t:"park",e:"🌳",d:"1.0km",r:"4.7",note:"150-acre stunning garden"},
    {n:"Vidyarthi Bhavan",t:"restaurant",e:"🍽️",d:"1.5km",r:"4.8",note:"Legendary dosa"},
    {n:"National College Ground",t:"park",e:"🌳",d:"0.5km",r:"4.0",note:"Open grounds"},
    {n:"Matteo Coffea",t:"cafe",e:"☕",d:"2.0km",r:"4.5",note:"Top specialty coffee"},
    {n:"Jayanagar 4th Block",t:"restaurant",e:"🍽️",d:"2.0km",r:"4.4",note:"Food heaven"},
  ],
};
