export const STATION_OPTIONS = [
  {v:'Whitefield',l:'Whitefield (Kadugodi)',line:'Purple'},
  {v:'Hopefarm',l:'Hopefarm Channasandra',line:'Purple'},
  {v:'Kadugodi Tree Park',l:'Kadugodi Tree Park',line:'Purple'},
  {v:'Pattandur Agrahara',l:'Pattandur Agrahara (ITPL)',line:'Purple'},
  {v:'Sri Sathya Sai Hospital',l:'Sri Sathya Sai Hospital',line:'Purple'},
  {v:'Nallurhalli',l:'Nallurhalli',line:'Purple'},
  {v:'Kundalahalli',l:'Kundalahalli',line:'Purple'},
  {v:'Seetharamapalya',l:'Seetharamapalya',line:'Purple'},
  {v:'Hoodi',l:'Hoodi',line:'Purple'},
  {v:'Garudacharpalya',l:'Garudacharpalya',line:'Purple'},
  {v:'KR Puram',l:'Singayyanapalya / KR Puram area',line:'Purple'},
  {v:'Benniganahalli',l:'Benniganahalli (Tin Factory)',line:'Purple'},
  {v:'Baiyappanahalli',l:'Baiyappanahalli',line:'Purple'},
  {v:'Swami Vivekananda Road',l:'Swami Vivekananda Road',line:'Purple'},
  {v:'Indiranagar',l:'Indiranagar',line:'Purple'},
  {v:'Halasuru',l:'Halasuru (Ulsoor)',line:'Purple'},
  {v:'Trinity',l:'Trinity Circle',line:'Purple'},
  {v:'MG Road',l:'MG Road',line:'Purple'},
  {v:'Cubbon Park',l:'Cubbon Park',line:'Purple'},
  {v:'Vidhana Soudha',l:'Vidhana Soudha',line:'Purple'},
  {v:'Visvesvaraya',l:'Sir M. Visvesvaraya (Central College)',line:'Purple'},
  {v:'Majestic',l:'Majestic / KSR ⇄ Green',line:'Purple'},
  {v:'City Railway Stn',l:'City Railway Station (KSR)',line:'Purple'},
  {v:'Magadi Road',l:'Magadi Road',line:'Purple'},
  {v:'Hosahalli',l:'Hosahalli',line:'Purple'},
  {v:'Vijayanagar',l:'Vijayanagar',line:'Purple'},
  {v:'Attiguppe',l:'Attiguppe',line:'Purple'},
  {v:'Deepanjali Nagar',l:'Deepanjali Nagar',line:'Purple'},
  {v:'Mysuru Road',l:'Mysuru Road',line:'Purple'},
  {v:'Nayandahalli',l:'Nayandahalli / Pantharapalya',line:'Purple'},
  {v:'RR Nagar',l:'Rajarajeshwari Nagar',line:'Purple'},
  {v:'Jnanabharathi',l:'Jnanabharathi',line:'Purple'},
  {v:'Pattanagere',l:'Pattanagere',line:'Purple'},
  {v:'Kengeri Bus Stn',l:'Kengeri Bus Terminal',line:'Purple'},
  {v:'Kengeri',l:'Kengeri',line:'Purple'},
  {v:'Challaghatta',l:'Challaghatta',line:'Purple'},
  {v:'Madavara',l:'Madavara (BIEC)',line:'Green'},
  {v:'Chikkabidarakallu',l:'Chikkabidarakallu (Jindal)',line:'Green'},
  {v:'Manjunathanagara',l:'Manjunathanagara',line:'Green'},
  {v:'Nagasandra',l:'Nagasandra',line:'Green'},
  {v:'Dasarahalli',l:'Dasarahalli',line:'Green'},
  {v:'Jalahalli',l:'Jalahalli',line:'Green'},
  {v:'Peenya Industry',l:'Peenya Industry',line:'Green'},
  {v:'Peenya',l:'Peenya',line:'Green'},
  {v:'Goraguntepalya',l:'Goraguntepalya',line:'Green'},
  {v:'Yeshwanthpur',l:'Yeshwanthpur (Orion Mall)',line:'Green'},
  {v:'Sandal Soap',l:'Sandal Soap Factory',line:'Green'},
  {v:'Mahalakshmi',l:'Mahalakshmi (ISKCON)',line:'Green'},
  {v:'Sampige Road',l:'Sampige Road (Malleshwaram)',line:'Green'},
  {v:'Rajajinagar',l:'Rajajinagar',line:'Green'},
  {v:'Kuvempu Road',l:'Kuvempu Road',line:'Green'},
  {v:'Srirampura',l:'Srirampura',line:'Green'},
  {v:'Chickpete',l:'Chickpete',line:'Green'},
  {v:'KR Market',l:'Krishna Rajendra Market (KR Market)',line:'Green'},
  {v:'National College',l:'National College (Basavanagudi)',line:'Green'},
  {v:'Lalbagh',l:'Lalbagh',line:'Green'},
  {v:'South End Circle',l:'South End Circle',line:'Green'},
  {v:'Jayanagar',l:'Jayanagar',line:'Green'},
  {v:'RV Road',l:'RV Road ⇄ Yellow',line:'Green'},
  {v:'JP Nagar',l:'Jaya Prakash Nagar (JP Nagar / Sarakki)',line:'Green'},
  {v:'Banashankari',l:'Banashankari',line:'Green'},
  {v:'Yelachenahalli',l:'Yelachenahalli',line:'Green'},
  {v:'Konanakunte',l:'Konanakunte Cross',line:'Green'},
  {v:'Doddakallasandra',l:'Doddakallasandra',line:'Green'},
  {v:'Thalaghattapura',l:'Thalaghattapura',line:'Green'},
  {v:'Silk Institute',l:'Silk Institute (south terminal)',line:'Green'},
  {v:'Ragigudda',l:'Ragigudda',line:'Yellow'},
  {v:'Jayadeva Hospital',l:'Jayadeva Hospital',line:'Yellow'},
  {v:'BTM Layout',l:'BTM Layout',line:'Yellow'},
  {v:'Central Silk Board',l:'Central Silk Board',line:'Yellow'},
  {v:'Bommanahalli',l:'Bommanahalli (HSR Layout area)',line:'Yellow'},
  {v:'Hongasandra',l:'Hongasandra',line:'Yellow'},
  {v:'Kudlu Gate',l:'Kudlu Gate',line:'Yellow'},
  {v:'Singasandra',l:'Singasandra',line:'Yellow'},
  {v:'Hosa Road',l:'Hosa Road',line:'Yellow'},
  {v:'Beratena Agrahara',l:'Beratena Agrahara',line:'Yellow'},
  {v:'Electronic City',l:'Electronic City',line:'Yellow'},
  {v:'Konappana Agrahara',l:'Infosys Foundation Konappana Agrahara',line:'Yellow'},
  {v:'Huskur Road',l:'Huskur Road',line:'Yellow'},
  {v:'Hebbagodi',l:'Biocon Hebbagodi',line:'Yellow'},
  {v:'Bommasandra',l:'Delta Electronics Bommasandra',line:'Yellow'},
];

// Precomputed once at load: lowercase search text + word-initial
// "abbreviation" per station (e.g. "MG Road" → initials "mr", but
// "mg" itself is already literally in the label so plain substring
// matching handles the examples in the spec). Filtering a list this
// size — or even many times larger — by substring is effectively
// instant, so this comfortably scales if the network doubles.
export const STATION_SEARCH_INDEX = STATION_OPTIONS.map(o => {
  const words = o.l.replace(/[()/⇄]/g, ' ').split(/\s+/).filter(Boolean);
  return {
    ...o,
    searchText: (o.l + ' ' + o.v).toLowerCase(),
    initials: words.map(w => w[0]).join('').toLowerCase(),
  };
});

export function filterStations(query) {
  const q = query.trim().toLowerCase();
  if (!q) return STATION_SEARCH_INDEX;
  return STATION_SEARCH_INDEX.filter(s => s.searchText.includes(q) || s.initials.includes(q));
}

export function escapeHtml(s){
  return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

// Wraps the matching portion of a label in <mark> for highlighting
export function highlightStationMatch(label, query){
  const q = query.trim();
  if (!q) return escapeHtml(label);
  const idx = label.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return escapeHtml(label);
  const before = escapeHtml(label.slice(0, idx));
  const match  = escapeHtml(label.slice(idx, idx + q.length));
  const after  = escapeHtml(label.slice(idx + q.length));
  return `${before}<mark>${match}</mark>${after}`;
}

// Reusable searchable-station autocomplete. Attach it to any
// visible text <input>, a results container <div>, and a hidden
// <input> that ends up holding the selected station's value — the
// same contract the old <select id="frArea"> exposed, so downstream
// code (addFriend, etc.) needs zero changes. Call this again for
// any future station input (e.g. a second "meet near" field) to
// get the exact same search behaviour.
export function attachStationAutocomplete(searchInput, listEl, hiddenInput, onSelect){
  let matches = [];
  let activeIdx = -1;

  function renderList(){
    if (!matches.length){
      listEl.innerHTML = `<div class="ac-empty">No stations found</div>`;
      listEl.style.display = 'block';
      return;
    }
    listEl.innerHTML = matches.map((s,i)=>
      `<div class="ac-item${i===activeIdx?' on':''}" data-idx="${i}">${highlightStationMatch(s.l, searchInput.value)}</div>`
    ).join('');
    listEl.style.display = 'block';
  }

  function setActive(i){
    activeIdx = i;
    [...listEl.children].forEach((el,idx)=>el.classList.toggle('on', idx===activeIdx));
    const el = listEl.children[activeIdx];
    if (el) el.scrollIntoView({block:'nearest'});
  }

  function open(){
    matches = filterStations(searchInput.value);
    activeIdx = matches.length ? 0 : -1;
    renderList();
  }

  function close(){
    listEl.style.display = 'none';
    activeIdx = -1;
  }

  function choose(i){
    const s = matches[i];
    if (!s) return;
    searchInput.value = s.l;
    hiddenInput.value = s.v;
    close();
    if (onSelect) onSelect(s);
  }

  searchInput.addEventListener('input', ()=>{ hiddenInput.value = ''; open(); });
  searchInput.addEventListener('focus', open);
  searchInput.addEventListener('keydown', e=>{
    if (listEl.style.display === 'none' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){
      e.preventDefault(); open(); return;
    }
    if (e.key === 'ArrowDown'){
      e.preventDefault();
      if (matches.length) setActive((activeIdx + 1) % matches.length);
    } else if (e.key === 'ArrowUp'){
      e.preventDefault();
      if (matches.length) setActive((activeIdx - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter'){
      if (activeIdx >= 0){ e.preventDefault(); choose(activeIdx); }
    } else if (e.key === 'Escape'){
      close();
    }
    // Tab: intentionally left alone so focus moves naturally
  });
  // Use mousedown (fires before blur) so a click always registers as a selection
  listEl.addEventListener('mousedown', e=>{
    const item = e.target.closest('.ac-item');
    if (!item) return;
    e.preventDefault();
    choose(parseInt(item.dataset.idx, 10));
  });
  document.addEventListener('click', e=>{
    if (e.target !== searchInput && !listEl.contains(e.target)) close();
  });

  return { close, open, reset(){ searchInput.value=''; hiddenInput.value=''; close(); } };
}
