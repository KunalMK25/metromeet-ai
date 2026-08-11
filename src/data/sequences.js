// ═══════════════════════════════════════════════════════════
//  data/sequences.js
//  Relocated from the monolith, byte-identical bodies.
// ═══════════════════════════════════════════════════════════

// Area select → station key  (covers all dropdown option values)
export const AM = {
  // Purple
  "Whitefield":"Whitefield","Hopefarm":"Hopefarm",
  "Kadugodi Tree Park":"Kadugodi Tree Park","Pattandur Agrahara":"Pattandur Agrahara",
  "Sri Sathya Sai Hospital":"Sri Sathya Sai","Nallurhalli":"Nallurhalli",
  "Kundalahalli":"Kundalahalli","Seetharamapalya":"Seetharamapalya",
  "Hoodi":"Hoodi","Garudacharpalya":"Garudacharpalya","KR Puram":"Krishnarajapura",
  "Benniganahalli":"Benniganahalli","Baiyappanahalli":"Baiyappanahalli",
  "Swami Vivekananda Road":"Swami Vivekananda","Indiranagar":"Indiranagar",
  "Halasuru":"Halasuru","Trinity":"Trinity","MG Road":"MG Road",
  "Cubbon Park":"Cubbon Park","Vidhana Soudha":"Vidhana Soudha",
  "Visvesvaraya":"Visvesvaraya","Majestic":"Majestic",
  "City Railway Stn":"City Railway Stn","Magadi Road":"Magadi Road",
  "Hosahalli":"Hosahalli","Vijayanagar":"Vijayanagar","Attiguppe":"Attiguppe",
  "Deepanjali Nagar":"Deepanjali Nagar","Mysuru Road":"Mysuru Road",
  "Nayandahalli":"Nayandahalli","RR Nagar":"RR Nagar","Jnanabharathi":"Jnanabharathi",
  "Pattanagere":"Pattanagere","Kengeri Bus Stn":"Kengeri Bus Stn",
  "Kengeri":"Kengeri","Challaghatta":"Challaghatta",
  // Green NW
  "Madavara":"Madavara","Chikkabidarakallu":"Chikkabidarakallu",
  "Manjunathanagara":"Manjunathanagara","Nagasandra":"Nagasandra",
  "Dasarahalli":"Dasarahalli","Jalahalli":"Jalahalli",
  "Peenya Industry":"Peenya Industry","Peenya":"Peenya",
  "Goraguntepalya":"Goraguntepalya","Yeshwanthpur":"Yeshwanthpur",
  "Sandal Soap":"Sandal Soap","Mahalakshmi":"Mahalakshmi",
  "Sampige Road":"Sampige Road","Rajajinagar":"Rajajinagar",
  "Kuvempu Road":"Kuvempu Road","Srirampura":"Srirampura",
  // Green NE (future — not currently operational)
  // "Yelahanka","Hebbal","Nagawara" removed — not on current Green line
  // Green South
  "Chickpete":"Chickpete","KR Market":"KR Market",
  "National College":"National College","Lalbagh":"Lalbagh",
  "South End Circle":"South End Circle","Jayanagar":"Jayanagar",
  "RV Road":"RV Road","JP Nagar":"JP Nagar","Banashankari":"Banashankari",
  "Yelachenahalli":"Yelachenahalli","Konanakunte":"Konanakunte Cross",
  "Doddakallasandra":"Doddakallasandra","Thalaghattapura":"Thalaghattapura",
  "Silk Institute":"Silk Institute",
  // Yellow
  "Ragigudda":"Ragigudda","Jayadeva Hospital":"Jayadeva Hospital",
  "BTM Layout":"BTM Layout","Central Silk Board":"Central Silk Board",
  "Bommanahalli":"Bommanahalli","Hongasandra":"Hongasandra",
  "Kudlu Gate":"Kudlu Gate","Singasandra":"Singasandra",
  "Hosa Road":"Hosa Road","Beratena Agrahara":"Beratena Agrahara",
  "Electronic City":"Electronic City","Konappana Agrahara":"Konappana Agrahara",
  "Huskur Road":"Huskur Road","Hebbagodi":"Biocon Hebbagodi",
  "Bommasandra":"Bommasandra",
};

export const SEQS = {
  Purple: ["Whitefield","Hopefarm","Kadugodi Tree Park","Pattandur Agrahara","Sri Sathya Sai","Nallurhalli","Kundalahalli","Seetharamapalya","Hoodi","Garudacharpalya","Singayyanapalya","Krishnarajapura","Benniganahalli","Baiyappanahalli","Swami Vivekananda","Indiranagar","Halasuru","Trinity","MG Road","Cubbon Park","Vidhana Soudha","Visvesvaraya","Majestic","City Railway Stn","Magadi Road","Hosahalli","Vijayanagar","Attiguppe","Deepanjali Nagar","Mysuru Road","Nayandahalli","RR Nagar","Jnanabharathi","Pattanagere","Kengeri Bus Stn","Kengeri","Challaghatta"],
  // Single Green line: Madavara → Majestic → Silk Institute
  Green: ["Madavara","Chikkabidarakallu","Manjunathanagara","Nagasandra","Dasarahalli","Jalahalli","Peenya Industry","Peenya","Goraguntepalya","Yeshwanthpur","Sandal Soap","Mahalakshmi","Sampige Road","Rajajinagar","Kuvempu Road","Srirampura","Majestic","Chickpete","KR Market","National College","Lalbagh","South End Circle","Jayanagar","RV Road","JP Nagar","Banashankari","Yelachenahalli","Konanakunte Cross","Doddakallasandra","Thalaghattapura","Silk Institute"],
  // Yellow line: RV Road → Bommasandra
  Yellow: ["RV Road","Ragigudda","Jayadeva Hospital","BTM Layout","Central Silk Board","Bommanahalli","Hongasandra","Kudlu Gate","Singasandra","Hosa Road","Beratena Agrahara","Electronic City","Konappana Agrahara","Huskur Road","Biocon Hebbagodi","Bommasandra"],
};
