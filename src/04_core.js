<script>
"use strict";
/* =====================================================================
   2. STATE AND PERSISTENCE
   One versioned object in localStorage. Shape is account-ready: it can be
   synced to a server later by replacing load()/save().
   ===================================================================== */
const STORE_KEY = "w3guide:v1";
const STATE_VERSION = 1;
function defaultState(){
  return {
    version: STATE_VERSION,
    checks: {},            // id -> true (quests, locations, achievements, gear tiers, NG+ prep)
    favorites: [],         // [{kind, id}]
    recent: [],            // [{route, title, at}]
    builds: [],            // saved planner builds
    planner: {level: 30, pop: 0, bonus: 0, alloc: {}, equip: [], mutagens: ["", "", "", ""], mutations: [], activeMut: null, name: "", sim: {}},
    gwent: {owned: {}, deck: {faction: "nr", cards: [], leader: null}},
    prep: {},              // alchemy recipe id -> quantity
    prepDone: {},          // ingredient name -> true
    map: {off: ["entrance", "notice", "grindstone", "armourerstable"], hideFound: false, linkedOnly: false},
    settings: {theme: "night", reduceMotion: false, spoilers: false, navCollapsed: false}
  };
}
let storageOK = true;
function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return defaultState();
    return sanitize(JSON.parse(raw));
  }catch(e){
    storageOK = false;
    return defaultState();
  }
}
/* Merge an untrusted object into a fresh default state, keeping only known
   keys and correct types. Used for both localStorage and JSON import. */
function sanitize(obj){
  const d = defaultState();
  if(!obj || typeof obj !== "object") throw new Error("Not a JSON object.");
  const isObj = v => v && typeof v === "object" && !Array.isArray(v);
  const boolMap = v => { const o = {}; if(isObj(v)) for(const k in v){ if(v[k] === true && typeof k === "string" && k.length < 120) o[k] = true; } return o; };
  d.checks = boolMap(obj.checks);
  if(Array.isArray(obj.favorites)) d.favorites = obj.favorites.filter(f => isObj(f) && typeof f.kind === "string" && typeof f.id === "string").slice(0, 500)
    .map(f => f.kind === "card" && typeof GWENT_LEGACY !== "undefined" && GWENT_LEGACY[f.id] ? {kind:"card", id:GWENT_LEGACY[f.id]} : f);
  if(Array.isArray(obj.recent)) d.recent = obj.recent.filter(r => isObj(r) && typeof r.route === "string" && typeof r.title === "string").slice(0, 12);
  if(Array.isArray(obj.builds)) d.builds = obj.builds.filter(b => isObj(b) && typeof b.name === "string" && isObj(b.alloc)).map(b => cleanPlan(b, true)).slice(0, 100);
  if(isObj(obj.planner)) d.planner = cleanPlan(obj.planner, false);
  if(isObj(obj.gwent)){
    const mapId = id => (typeof GWENT_LEGACY !== "undefined" && GWENT_LEGACY[id]) || id;
    const card = id => GWENT_CARDS.find(c => c.id === mapId(id));
    if(isObj(obj.gwent.owned)) for(const k in obj.gwent.owned){
      const c = card(k); const v = obj.gwent.owned[k];
      if(c && !c.token && (v === true || typeof v === "number")) d.gwent.owned[c.id] = Math.max(1, Math.min(c.copies, v === true ? 1 : Math.floor(v)));
    }
    const dk = obj.gwent.deck;
    if(isObj(dk)){
      if(FACTIONS[dk.faction] && dk.faction !== "neutral") d.gwent.deck.faction = dk.faction;
      const f = d.gwent.deck.faction;
      if(Array.isArray(dk.cards)) dk.cards.forEach(id => { const c = card(id);
        if(c && !c.token && c.type !== "leader" && (c.faction === f || c.faction === "neutral") && d.gwent.deck.cards.filter(x => x === c.id).length < c.copies) d.gwent.deck.cards.push(c.id); });
      const L = dk.leader && card(dk.leader);
      if(L && L.type === "leader" && L.faction === f) d.gwent.deck.leader = L.id;
    }
  }
  if(isObj(obj.prep)) for(const k in obj.prep){ if(ALCHEMY.some(a => a.id === k)) d.prep[k] = clampInt(obj.prep[k], 1, 99); }
  d.prepDone = boolMap(obj.prepDone);
  if(isObj(obj.map)){
    if(Array.isArray(obj.map.off)) d.map.off = obj.map.off.filter(c => typeof c === "string" && /^[a-z]{2,24}$/.test(c)).slice(0, 40);
    d.map.hideFound = obj.map.hideFound === true;
    d.map.linkedOnly = obj.map.linkedOnly === true;
  }
  if(isObj(obj.settings)){
    d.settings.theme = obj.settings.theme === "parchment" ? "parchment" : "night";
    d.settings.reduceMotion = obj.settings.reduceMotion === true;
    d.settings.spoilers = obj.settings.spoilers === true;
    d.settings.navCollapsed = obj.settings.navCollapsed === true;
  }
  return d;
}
function cleanPlan(p, withMeta){
  const all = allSkills();
  const alloc = {};
  if(p.alloc && typeof p.alloc === "object") for(const k in p.alloc){ const s = all[k]; if(s) { const n = clampInt(p.alloc[k], 0, s.max); if(n) alloc[k] = n; } }
  const sim = {};
  if(p.sim && typeof p.sim === "object"){
    for(const [k, lo, hi] of [["weapon",1,99999],["intensity",0,1000],["vitality",1,99999],["bomb",0,99999],["adrenaline",0,3],["toxicity",0,150],["pieces",0,4]]) if(p.sim[k] != null) sim[k] = clampInt(p.sim[k], lo, hi);
    if(["light","medium","heavy"].includes(p.sim.armor)) sim.armor = p.sim.armor;
  }
  const out = {
    level: clampInt(p.level, 1, 100), pop: clampInt(p.pop, 0, 30), bonus: clampInt(p.bonus, 0, 20), alloc,
    equip: Array.isArray(p.equip) ? p.equip.slice(0, 16).map(id => (typeof id === "string" && alloc[id]) ? id : null).filter((id, i, a) => !id || a.indexOf(id) === i) : [],
    mutagens: [0, 1, 2, 3].map(i => Array.isArray(p.mutagens) && ["red","blue","green"].includes(p.mutagens[i]) ? p.mutagens[i] : ""),
    sim,
    mutations: Array.isArray(p.mutations) ? p.mutations.filter(id => MUTATIONS.some(m => m.id === id)) : [],
    activeMut: MUTATIONS.some(m => m.id === p.activeMut) ? p.activeMut : null,
    name: typeof p.name === "string" ? p.name.slice(0, 60) : ""
  };
  if(withMeta){ out.id = typeof p.id === "string" ? p.id : uid(); out.created = typeof p.created === "number" ? p.created : Date.now(); }
  return out;
}
function clampInt(v, lo, hi){ v = parseInt(v, 10); if(isNaN(v)) v = lo; return Math.max(lo, Math.min(hi, v)); }
function uid(){ return Math.random().toString(36).slice(2, 10); }

let state = load();
let saveTimer = null;
function save(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); storageOK = true; }
    catch(e){ if(storageOK) toast("Could not save progress. Browser storage is blocked or full.", "err"); storageOK = false; }
  }, 120);
}

/* =====================================================================
   3. UTILITIES
   ===================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const ESC = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ESC[c]);
const icon = (name, extra = "") => `<i class="ph ${name} ${extra}" aria-hidden="true"></i>`;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const regionName = id => (REGIONS.find(r => r.id === id) || {}).name || id || "Various";
const dlcLabel = d => d === "hos" ? "Hearts of Stone" : d === "baw" ? "Blood and Wine" : "";
function allSkills(){
  if(allSkills.cache) return allSkills.cache;
  const map = {};
  for(const tk in SKILL_TREES) SKILL_TREES[tk].nodes.forEach(n => { map[n.id] = Object.assign({tree: tk, max: 3, desc: n.levels[0].join(" ")}, n); });
  return (allSkills.cache = map);
}
function debounce(fn, ms){ let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function imgErr(img){
  const fb = img.dataset.fb;
  if(fb && !img.dataset.tried){ img.dataset.tried = "1"; img.src = fb; }
  else img.classList.add("failed");
}
function art(key, eager){
  const a = ART[key]; if(!a) return `<div class="img"></div>`;
  return `<div class="img"><img src="${esc(a.src)}" data-fb="${esc(a.fb)}" alt="" style="object-position:${esc(a.pos)}" loading="${eager ? "eager" : "lazy"}" decoding="async" ${eager ? 'fetchpriority="high"' : ""} onload="this.classList.add('loaded')" onerror="imgErr(this)"></div>`;
}
function vTag(v){ const x = VERIFY[v] || VERIFY.guide; return `<span class="tag ${x.cls} tooltip" tabindex="0" data-tip="${esc(x.tip)}">${esc(x.label)}</span>`; }
function srcLine(keys){
  if(!keys || !keys.length) return `<p class="src">Source: none found yet.</p>`;
  return `<p class="src">Source: ${keys.map(k => SOURCES[k] ? (SOURCES[k].url ? `<a href="${esc(SOURCES[k].url)}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[k].name)}</a>` : esc(SOURCES[k].name)) : esc(k)).join("; ")}</p>`;
}
function isChecked(id){ return !!state.checks[id]; }
function setCheck(id, val){ if(val) state.checks[id] = true; else delete state.checks[id]; save(); }
function checkbox(id, label, extra = ""){
  return `<label class="check"><input type="checkbox" data-check="${esc(id)}" ${isChecked(id) ? "checked" : ""} ${extra}><span class="sr-only">${esc(label)}</span></label>`;
}
function isFav(kind, id){ return state.favorites.some(f => f.kind === kind && f.id === id); }
function favBtn(kind, id, label, small = true){
  const on = isFav(kind, id);
  return `<button class="btn ${small ? "btn-sm btn-icon" : ""} fav-btn tooltip" data-action="fav" data-kind="${esc(kind)}" data-id="${esc(id)}" aria-pressed="${on}" aria-label="${on ? "Remove" : "Save"} ${esc(label)} ${on ? "from" : "to"} favorites" data-tip="${on ? "Saved" : "Save to journal"}">${icon(on ? "ph-bookmark-simple ph-fill" : "ph-bookmark-simple")}${small ? "" : `<span>${on ? "Saved" : "Save"}</span>`}</button>`;
}
function emptyState(ic, title, body, actionHtml = ""){
  return `<div class="empty">${icon(ic)}<h3>${esc(title)}</h3><p>${esc(body)}</p>${actionHtml}</div>`;
}
function spoil(html){ return state.settings.spoilers ? `<div class="spoiler" tabindex="0" role="button" aria-label="Hidden to avoid spoilers. Activate to reveal." data-action="reveal">${html}</div>` : html; }

/* Toasts */
function toast(msg, kind = "ok"){
  const box = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast" + (kind === "err" ? " err" : "");
  el.innerHTML = `${icon(kind === "err" ? "ph-warning-circle" : "ph-check-circle")}<span>${esc(msg)}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 260); }, 2800);
}

/* =====================================================================
   4. MODALS (focus-trapped, Esc to close, focus restored)
   ===================================================================== */
let lastFocus = null;
function openModal(html, wide){
  lastFocus = document.activeElement;
  const ov = $("#modalOverlay"), m = $("#modal");
  m.className = "modal" + (wide ? " wide" : "");
  m.innerHTML = html;
  ov.hidden = false;
  document.body.style.overflow = "hidden";
  const f = m.querySelector("[autofocus]") || m.querySelector(".close") || m;
  setTimeout(() => f.focus(), 20);
}
function closeModal(){
  const ov = $("#modalOverlay");
  if(ov.hidden) return;
  ov.hidden = true;
  document.body.style.overflow = "";
  if(lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
function modalShell(title, body, foot = "", sub = ""){
  return `<div class="modal-head"><div class="stack" style="gap:6px">${sub}<h2 id="modalTitle">${esc(title)}</h2></div>
    <button class="btn btn-ghost btn-icon close" data-action="close-modal" aria-label="Close dialog">${icon("ph-x")}</button></div>
    <div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ""}`;
}
function confirmDialog(title, body, okLabel, onOk, danger = true){
  openModal(modalShell(title, `<p class="muted">${esc(body)}</p>`,
    `<button class="btn" data-action="close-modal">Cancel</button><button class="btn ${danger ? "btn-primary" : "btn-primary"}" id="confirmOk" autofocus>${esc(okLabel)}</button>`));
  $("#confirmOk").addEventListener("click", () => { closeModal(); onOk(); }, {once: true});
}
function trapFocus(e, container){
  if(e.key !== "Tab") return;
  const f = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', container).filter(el => el.offsetParent !== null);
  if(!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if(e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
  else if(!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
}

/* =====================================================================
   5. NAVIGATION AND ROUTING
   Hash routes: #/section?param=value. Filters live in the query string so
   any filtered view can be bookmarked or shared.
   ===================================================================== */
const NAV = [
  {group:"Journal", items:[
    {id:"home", label:"Home", icon:"ph-house-line"},
    {id:"world", label:"World Explorer", icon:"ph-map-trifold"},
    {id:"map", label:"Interactive Map", icon:"ph-map-pin"},
    {id:"quests", label:"Quest Guides", icon:"ph-scroll"},
    {id:"builds", label:"Builds and Planner", icon:"ph-tree-structure"}]},
  {group:"Arsenal", items:[
    {id:"gear", label:"Gear and Equipment", icon:"ph-sword"},
    {id:"bestiary", label:"Bestiary", icon:"ph-skull"},
    {id:"alchemy", label:"Alchemy and Crafting", icon:"ph-flask"}]},
  {group:"Pursuits", items:[
    {id:"gwent", label:"Gwent", icon:"ph-cards"},
    {id:"collect", label:"Collectibles", icon:"ph-trophy"},
    {id:"money", label:"Money Making", icon:"ph-coins"}]},
  {group:"Expansions", items:[
    {id:"dlc", label:"DLC and New Game+", icon:"ph-wine"}]},
  {group:"Yours", items:[
    {id:"journal", label:"My Journal", icon:"ph-book-bookmark"},
    {id:"sources", label:"Sources and Data", icon:"ph-books"}]}
];
const ROUTE_TITLES = {}; NAV.forEach(g => g.items.forEach(i => ROUTE_TITLES[i.id] = i.label));
let route = {name:"home", params:new URLSearchParams()};

function parseHash(){
  const h = location.hash.replace(/^#\/?/, "");
  const [path, qs] = h.split("?");
  const name = ROUTE_TITLES[path] ? path : "home";
  return {name, params:new URLSearchParams(qs || "")};
}
function go(name, params){
  const qs = params ? new URLSearchParams(params).toString() : "";
  const target = "#/" + name + (qs ? "?" + qs : "");
  if(location.hash === target) render(); else location.hash = target;
}
/* Update query params without re-rendering the whole view. */
function setParams(obj){
  for(const k in obj){ if(obj[k] === "" || obj[k] == null || obj[k] === false) route.params.delete(k); else route.params.set(k, obj[k]); }
  const qs = route.params.toString();
  history.replaceState(null, "", "#/" + route.name + (qs ? "?" + qs : ""));
}
function P(k, d = ""){ return route.params.get(k) || d; }

function renderNav(){
  const qDone = QUESTS.filter(q => isChecked(q.id)).length;
  const owned = Object.keys(state.gwent.owned).length;
  const counts = {quests:`${qDone}/${QUESTS.length}`, gwent:`${owned}/${GWENT_CARDS.filter(c => !c.token).length}`, journal: state.favorites.length ? String(state.favorites.length) : ""};
  const countTip = {quests:`${qDone} of ${QUESTS.length} quests completed`, gwent:`${owned} of ${GWENT_CARDS.filter(c => !c.token).length} cards collected`, journal:`${state.favorites.length} saved favorite${state.favorites.length === 1 ? "" : "s"}`};
  const rail = state.settings.navCollapsed;
  $("#nav").innerHTML = NAV.map(g => `<div class="nav-group"><span class="label">${esc(g.group)}</span>${g.items.map(i =>
    `<a href="#/${i.id}" ${route.name === i.id ? 'aria-current="page"' : ""} ${rail ? `data-tip="${esc(i.label)}${counts[i.id] ? " · " + counts[i.id] : ""}" data-tip-side="right"` : ""}>${icon(i.icon)}<span>${esc(i.label)}</span>${counts[i.id] ? `<span class="count" ${rail ? "" : `data-tip="${esc(countTip[i.id])}"`}>${counts[i.id]}</span>` : ""}</a>`).join("")}</div>`).join("");
}
function renderCrumbs(extra){
  const c = $("#crumbs");
  c.innerHTML = route.name === "home" ? `<span aria-current="page">Home</span>`
    : `<a href="#/home">Home</a>${icon("ph-caret-right")}<span ${extra ? "" : 'aria-current="page"'}>${esc(ROUTE_TITLES[route.name])}</span>${extra ? `${icon("ph-caret-right")}<span aria-current="page">${esc(extra)}</span>` : ""}`;
}
function pushRecent(){
  if(route.name === "home") return;
  const r = "#/" + route.name;
  state.recent = [{route:r, title:ROUTE_TITLES[route.name], at:Date.now()}, ...state.recent.filter(x => x.route !== r)].slice(0, 8);
  save();
}
const VIEWS = {};
function render(soft){
  if(typeof mapDestroy === "function") mapDestroy();
  route = parseHash();
  const view = $("#view");
  closeDrawer();
  renderNav();
  renderCrumbs();
  try{
    view.innerHTML = VIEWS[route.name]();
    if(VIEWS[route.name + "_after"]) VIEWS[route.name + "_after"]();
  }catch(err){
    console.error(err);
    view.innerHTML = emptyState("ph-warning-octagon", "This page failed to load", "Something went wrong while drawing this section. Your saved progress is untouched.", `<a class="btn" href="#/home">Back to home</a>`);
  }
  if(!soft && !state.settings.reduceMotion){ view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter"); }
  document.title = (route.name === "home" ? "" : ROUTE_TITLES[route.name] + " | ") + "The Witcher 3 Ultimate Guide";
  pushRecent();
  const open = P("open");
  if(open){ const [k, id] = open.split(":"); setTimeout(() => openDetail(k, id, true), 30); }
}
function openDrawer(){ $("#sidebar").classList.add("open"); $("#scrim").hidden = false; $("#menuBtn").setAttribute("aria-expanded", "true"); $("#nav a")?.focus(); }
function closeDrawer(){ $("#sidebar").classList.remove("open"); $("#scrim").hidden = true; $("#menuBtn").setAttribute("aria-expanded", "false"); }

/* =====================================================================
   6. SEARCH (command palette over every dataset)
   ===================================================================== */
const KIND_META = {
  quest:{label:"Quests", icon:"ph-scroll", route:"quests"},
  monster:{label:"Monsters", icon:"ph-skull", route:"bestiary"},
  loc:{label:"Locations", icon:"ph-map-pin", route:"world"},
  region:{label:"Regions", icon:"ph-map-trifold", route:"world"},
  gear:{label:"Gear", icon:"ph-shield", route:"gear"},
  weapon:{label:"Weapons", icon:"ph-sword", route:"gear"},
  alchemy:{label:"Alchemy", icon:"ph-flask", route:"alchemy"},
  card:{label:"Gwent", icon:"ph-cards", route:"gwent"},
  ach:{label:"Achievements", icon:"ph-trophy", route:"collect"},
  skill:{label:"Skills", icon:"ph-lightning", route:"builds"},
  build:{label:"Builds", icon:"ph-tree-structure", route:"builds"},
  pin:{label:"Map markers", icon:"ph-map-pin", route:"map"},
  page:{label:"Pages", icon:"ph-compass", route:"home"}
};
let INDEX = null;
function buildIndex(){
  const ix = [];
  const add = (kind, id, title, sub, extra = "") => ix.push({kind, id, title, sub, hay:(title + " " + sub + " " + extra).toLowerCase()});
  NAV.forEach(g => g.items.forEach(i => add("page", i.id, i.label, "Section")));
  QUESTS.forEach(q => add("quest", q.id, q.name, `${QUEST_TYPES[q.type].label} · ${regionName(q.region)}`, (q.target || "") + " " + (q.rewards || "")));
  MONSTERS.forEach(m => add("monster", m.id, m.name, m.cat, [m.oil, ...m.signs, ...m.bombs].join(" ")));
  LOCATIONS.forEach(l => add("loc", l.id, l.name, `${LOCATION_TYPES[l.type].label} · ${regionName(l.region)}`, l.hint));
  REGIONS.forEach(r => add("region", r.id, r.name, "Region"));
  GEAR_SETS.forEach(g => add("gear", g.id, g.name, `${g.weight} armor set`));
  WEAPONS.forEach(w => add("weapon", w.id, w.name, w.kind, w.how));
  ALCHEMY.forEach(a => add("alchemy", a.id, a.name, a.kind[0].toUpperCase() + a.kind.slice(1), a.ings.map(i => i[0]).join(" ")));
  GWENT_CARDS.forEach(c => add("card", c.id, c.name, `${FACTIONS[c.faction].name} ${c.type}`, c.acquire));
  ACHIEVEMENTS.forEach(a => add("ach", a.id, a.name, "Achievement", a.how));
  Object.values(allSkills()).forEach(s => add("skill", s.id, s.name, `${SKILL_TREES[s.tree].name} skill`, s.desc));
  BUILDS.forEach(b => add("build", b.id, b.name, `${b.tag} build`, b.summary));
  // Map markers with a unique name on their map (signposts, named sites, quests). Generic ones like "Hidden Treasure" are skipped.
  if(typeof MAP_MARKERS !== "undefined") for(const mid in MAP_MARKERS){
    const counts = {}; MAP_MARKERS[mid].forEach(m => counts[m.label] = (counts[m.label] || 0) + 1);
    MAP_MARKERS[mid].forEach(m => { if(counts[m.label] === 1) add("pin", m.id, m.label, `${(MAP_CATS[m.cat] || {}).label || m.cat} · ${MAP_DEFS[mid].name} map`, m.desc); });
  }
  return ix;
}
function searchIndex(q, kind){
  INDEX = INDEX || buildIndex();
  const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let res = INDEX.filter(x => (!kind || x.kind === kind));
  if(!terms.length) return kind ? res.slice(0, 40) : [];
  res = res.filter(x => terms.every(t => x.hay.includes(t)));
  const score = x => { const t = x.title.toLowerCase(); const q0 = terms.join(" "); return (t === q0 ? 0 : t.startsWith(q0) ? 1 : t.includes(q0) ? 2 : 3); };
  return res.sort((a, b) => score(a) - score(b) || a.title.localeCompare(b.title)).slice(0, 60);
}
function highlight(text, q){
  const t = esc(text); const terms = q.trim().split(/\s+/).filter(Boolean).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if(!terms.length) return t;
  return t.replace(new RegExp("(" + terms.map(esc).join("|") + ")", "gi"), "<mark>$1</mark>");
}
let palKind = "", palSel = 0, palResults = [];
function openPalette(prefill = ""){
  lastFocus = document.activeElement;
  $("#paletteOverlay").hidden = false;
  document.body.style.overflow = "hidden";
  const inp = $("#paletteInput");
  inp.value = prefill;
  $("#paletteFilters").innerHTML = [["", "All"], ...Object.entries(KIND_META).filter(([k]) => k !== "page").map(([k, m]) => [k, m.label])]
    .map(([k, l]) => `<button class="chip" data-pal-kind="${k}" aria-pressed="${palKind === k}">${esc(l)}</button>`).join("");
  runPalette();
  setTimeout(() => inp.focus(), 20);
}
function closePalette(){ $("#paletteOverlay").hidden = true; document.body.style.overflow = ""; if(lastFocus && document.contains(lastFocus)) lastFocus.focus(); }
function runPalette(){
  const q = $("#paletteInput").value;
  palResults = searchIndex(q, palKind);
  palSel = 0;
  const box = $("#paletteResults");
  if(!q.trim() && !palKind){
    const recent = state.recent.slice(0, 5);
    box.innerHTML = `<div class="stack" style="padding:10px 12px;gap:6px"><span class="label">Try</span><div class="chips">${["Leshen","Swallow","Griffin","Geralt of Rivia","Place of Power","Missable"].map(s => `<button class="chip" data-pal-try="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>` +
      (recent.length ? `<div style="padding:4px 12px"><span class="label">Recently viewed</span></div>` + recent.map(r => `<a class="result" href="${esc(r.route)}" data-pal-close>${icon("ph-clock-counter-clockwise")}<span>${esc(r.title)}</span></a>`).join("") : "");
    $("#paletteCount").textContent = "";
    return;
  }
  if(!palResults.length){
    box.innerHTML = `<div class="empty" style="margin:8px;border:0">${icon("ph-magnifying-glass")}<h3>No matches</h3><p>Nothing in the journal matches "${esc(q)}". Try a shorter word or another filter.</p></div>`;
    $("#paletteCount").textContent = "0 results";
    return;
  }
  box.innerHTML = palResults.map((r, i) => `<button class="result" role="option" id="pal-${i}" aria-selected="${i === 0}" data-pal-index="${i}">${icon(KIND_META[r.kind].icon)}<span><span>${highlight(r.title, q)}</span><span class="result-sub" style="display:block">${esc(r.sub)}</span></span></button>`).join("");
  $("#paletteCount").textContent = `${palResults.length} result${palResults.length === 1 ? "" : "s"}`;
}
function palMove(d){
  if(!palResults.length) return;
  palSel = (palSel + d + palResults.length) % palResults.length;
  $$("#paletteResults .result").forEach((el, i) => el.setAttribute("aria-selected", i === palSel));
  const el = $("#pal-" + palSel); el && el.scrollIntoView({block:"nearest"});
  $("#paletteInput").setAttribute("aria-activedescendant", "pal-" + palSel);
}
function palOpen(i){
  const r = palResults[i]; if(!r) return;
  closePalette();
  openResult(r.kind, r.id);
}
function openResult(kind, id){
  if(kind === "page") return go(id);
  if(kind === "skill"){ go("builds", {tab:"planner", tree: allSkills()[id].tree, skill:id}); return; }
  if(kind === "build"){ go("builds", {b:id}); return; }
  if(kind === "region"){ go("world", {r:id}); return; }
  if(kind === "pin"){ go("map", {m:id.split(":")[1], pin:id, z:5}); return; }
  go(KIND_META[kind].route, {open: kind + ":" + id});
}

/* =====================================================================
   7. DETAIL MODALS
   ===================================================================== */
function openDetail(kind, id, fromRoute){
  if(kind === "quest"){ closeModal(); const q = QUESTS.find(x => x.id === id); if(q){ if(route.name === "quests" && (P("tab") || "") === questDest(q)) qxSelect(id); else go("quests", {tab:questDest(q), qid:id}); } return; }
  if(kind === "gear"){ closeModal(); go("gear", {s:id}); return; }
  if(kind === "weapon"){ closeModal(); go("gear", {tab:"weapons", w:id}); return; }
  if(kind === "alchemy"){ closeModal(); alGoto(id); return; }
  if(kind === "ach"){ closeModal(); go("collect", {tab:"ach"}); return; }
  if(kind === "build"){ closeModal(); go("builds", {b:id}); return; }
  if(kind === "card"){ closeModal(); const c = GWENT_CARDS.find(x => x.id === id); go("gwent", {c:id, f: c ? c.faction : ""}); return; }
  if(kind === "monster"){ closeModal(); go("bestiary", Object.assign({m:id}, route.name === "bestiary" && P("cat") ? {cat:P("cat")} : {})); return; }
  const fn = DETAIL[kind];
  if(!fn){ return; }
  const html = fn(id);
  if(!html){ toast("That entry could not be found.", "err"); return; }
  openModal(html, kind === "build");
  if(fromRoute){ setParams({open:""}); }
}
const DETAIL = {
  quest(id){
    const q = QUESTS.find(x => x.id === id); if(!q) return null;
    const t = QUEST_TYPES[q.type];
    const body = `
      <div class="row" style="margin-bottom:16px">${checkboxLabeled(q.id, "Completed")}${favBtn("quest", q.id, q.name, false)}</div>
      <dl class="kv">
        <dt>Type</dt><dd>${esc(t.label)}${q.act ? " · " + esc(q.act) : ""}</dd>
        <dt>Region</dt><dd>${esc(regionName(q.region))}</dd>
        ${q.start ? `<dt>Starts</dt><dd>${esc(q.start)}</dd>` : ""}
        <dt>Suggested level</dt><dd>${q.level ? `<span class="mono">${q.level}</span>` : '<span class="dim">Not stated in our sources</span>'}</dd>
        ${q.target ? `<dt>Target</dt><dd>${esc(q.target)}</dd>` : ""}
        ${q.prereq ? `<dt>Prerequisite</dt><dd>${esc(q.prereq)}</dd>` : ""}
        ${q.rewards ? `<dt>Rewards</dt><dd>${spoil(esc(q.rewards))}</dd>` : ""}
      </dl>
      ${q.missable ? `<div class="notice danger" style="margin-top:18px">${icon("ph-hourglass-medium")}<div><strong>Missable.</strong> ${spoil(esc(q.missable))}</div></div>` : ""}
      ${q.note ? `<div class="notice info" style="margin-top:12px">${icon("ph-info")}<div>${esc(q.note)}</div></div>` : ""}
      <h4 style="margin:22px 0 10px">Walkthrough</h4>
      ${q.steps ? spoil(`<ol class="steps">${q.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>`) : `<p class="muted">A verified step-by-step walkthrough has not been written for this quest yet. It is on the content backlog; the source below covers it.</p>`}
      ${q.steps && q.srcUrl ? `<p class="src" style="margin-top:8px">Walkthrough paraphrased from <a href="${esc(q.srcUrl)}" target="_blank" rel="noopener noreferrer">this page</a>. Verify in game.</p>` : ""}
      <div class="row" style="margin-top:18px">${vTag(q.v)}</div>${srcLine(q.src)}`;
    return modalShell(q.name, body, "", `<span class="label">${esc(t.label)}</span>`);
  },
  monster(id){
    const m = MONSTERS.find(x => x.id === id); if(!m) return null;
    const weak = (arr, cls) => arr.length ? arr.map(s => `<span class="tag ${cls}">${esc(s)}</span>`).join(" ") : '<span class="dim">None listed</span>';
    const contracts = QUESTS.filter(q => q.type === "contract" && q.target && q.target.toLowerCase().includes(m.name.toLowerCase().split(" ")[0]));
    const body = `
      <div class="row" style="margin-bottom:16px">${favBtn("monster", m.id, m.name, false)}${m.dlc ? `<span class="tag">${esc(dlcLabel(m.dlc))}</span>` : ""}</div>
      <dl class="kv">
        <dt>Category</dt><dd>${esc(m.cat)}</dd>
        <dt>Oil</dt><dd>${m.oil ? `<button class="linkish" data-open="alchemy:${esc((ALCHEMY.find(a => a.name === m.oil) || {}).id || "")}">${esc(m.oil)}</button>` : "None listed"}</dd>
        <dt>Signs</dt><dd class="vuln">${weak(m.signs, "tag-accent")}</dd>
        <dt>Bombs</dt><dd class="vuln">${weak(m.bombs, "")}</dd>
        <dt>Potions</dt><dd class="vuln">${weak(m.potions, "")}</dd>
        <dt>Regions</dt><dd>${m.regions.length ? m.regions.map(regionName).map(esc).join(", ") : '<span class="dim">Not recorded yet</span>'}</dd>
        ${m.loot ? `<dt>Loot</dt><dd>${esc(m.loot)}</dd>` : ""}
      </dl>
      ${m.tip ? `<div class="notice info" style="margin-top:18px">${icon("ph-lightbulb")}<div><strong>Tactics.</strong> ${esc(m.tip)}</div></div>` : ""}
      ${contracts.length ? `<h4 style="margin:22px 0 8px">Related contracts</h4><ul class="clean">${contracts.map(c => `<li><button class="linkish" data-open="quest:${esc(c.id)}">${esc(c.name)}</button> <span class="dim">(${esc(c.target)})</span></li>`).join("")}</ul>` : ""}
      <div class="row" style="margin-top:18px">${vTag(m.v)}</div>${srcLine(m.src)}`;
    return modalShell(m.name, body, "", `<span class="label">${esc(m.cat)}</span>`);
  },
  loc(id){
    const l = LOCATIONS.find(x => x.id === id); if(!l) return null;
    const body = `<div class="row" style="margin-bottom:16px">${checkboxLabeled(l.id, "Visited")}${favBtn("loc", l.id, l.name, false)}</div>
      <dl class="kv"><dt>Type</dt><dd>${esc(LOCATION_TYPES[l.type].label)}</dd><dt>Region</dt><dd>${esc(regionName(l.region))}</dd><dt>Where</dt><dd>${esc(l.hint)}</dd></dl>
      ${LOCATION_PINS[l.id] ? `<div class="notice info" style="margin-top:16px">${icon("ph-map-pin")}<div>Linked to ${LOCATION_PINS[l.id].pins.length === 1 ? "a map marker" : LOCATION_PINS[l.id].pins.length + " map markers"}. Matched by ${esc(LOCATION_PINS[l.id].how)}.${LOCATION_PINS[l.id].pins.length === 1 ? " Ticking this entry also marks the marker as found, and the other way round." : ""}${LOCATION_PINS[l.id].note ? " " + esc(LOCATION_PINS[l.id].note) : ""}</div></div>`
        : `<div class="notice info" style="margin-top:16px">${icon("ph-map-pin-line")}<div>Not linked to a map marker: no single marker matched this entry with confidence. ${REGION_TO_MAP[l.region] ? "Try searching the map by name." : "This area has no interactive map."}</div></div>`}
      <div class="row" style="margin-top:18px">${vTag(l.v)}</div>${srcLine(l.src)}`;
    const pins = LOCATION_PINS[l.id] ? LOCATION_PINS[l.id].pins : [];
    return modalShell(l.name, body, `${pins.length ? pins.map((p, i) => `<button class="btn btn-primary" data-action="loc-map" data-id="${esc(l.id)}" data-i="${i}">${icon("ph-map-pin")}Show on map${pins.length > 1 ? ` (${i + 1} of ${pins.length})` : ""}</button>`).join("") : REGION_TO_MAP[l.region] ? `<a class="btn" href="#/map?m=${REGION_TO_MAP[l.region]}" data-action="close-modal">${icon("ph-map-pin")}Open map</a>` : ""}<a class="btn" href="#/world?r=${esc(l.region)}" data-action="close-modal">Open ${esc(regionName(l.region))}</a>`, `<span class="label">${esc(LOCATION_TYPES[l.type].label)}</span>`);
  },
  weapon(id){
    const w = WEAPONS.find(x => x.id === id); if(!w) return null;
    const body = `<div class="row" style="margin-bottom:16px">${checkboxLabeled("own:" + w.id, "Collected")}${favBtn("weapon", w.id, w.name, false)}${w.dlc ? `<span class="tag">${esc(dlcLabel(w.dlc))}</span>` : ""}</div>
      <dl class="kv"><dt>Type</dt><dd>${esc(w.kind)}</dd><dt>Rarity</dt><dd>${esc(w.rarity)}</dd><dt>How to get</dt><dd>${esc(w.how)}</dd></dl>
      <p class="muted" style="margin-top:14px">Stats vary by level, patch and NG+ scaling, so none are listed here.</p>
      <div class="row" style="margin-top:12px">${vTag(w.v)}</div>${srcLine(w.src)}`;
    return modalShell(w.name, body, "", `<span class="label">${esc(w.kind)}</span>`);
  },
  alchemy(id){
    const a = ALCHEMY.find(x => x.id === id); if(!a) return null;
    const vs = a.kind === "oil" ? MONSTERS.filter(m => m.oil === a.name) : MONSTERS.filter(m => m.bombs.includes(a.name) || m.potions.includes(a.name));
    const body = `<div class="row" style="margin-bottom:16px">${favBtn("alchemy", a.id, a.name, false)}<button class="btn btn-sm" data-action="prep-add" data-id="${esc(a.id)}">${icon("ph-plus")}Add to prep list</button></div>
      <dl class="kv"><dt>Kind</dt><dd>${esc(a.kind)}</dd>${a.effect ? `<dt>Effect</dt><dd>${esc(a.effect)}</dd>` : ""}${a.where ? `<dt>Formula</dt><dd>${esc(a.where)}</dd>` : ""}</dl>
      <h4 style="margin:20px 0 10px">Ingredients (base recipe)</h4>
      <div class="ingredients">${a.ings.map(([n, q]) => `<span class="ing"><b>${q}×</b>${esc(n)}</span>`).join("")}</div>
      ${a.flag ? `<div class="notice" style="margin-top:16px">${icon("ph-warning")}<div>${esc(a.flag)}</div></div>` : ""}
      ${vs.length ? `<h4 style="margin:20px 0 8px">Effective against</h4><div class="chips">${vs.map(m => `<button class="chip" data-open="monster:${esc(m.id)}">${esc(m.name)}</button>`).join("")}</div>` : ""}
      <div class="row" style="margin-top:18px">${vTag(a.v)}</div>${srcLine(a.src)}`;
    return modalShell(a.name, body, "", `<span class="label">${esc(a.kind)}</span>`);
  },
  card(id){
    const c = GWENT_CARDS.find(x => x.id === id); if(!c) return null;
    const owned = !!state.gwent.owned[c.id];
    const body = `<div class="row" style="margin-bottom:16px"><label class="check"><input type="checkbox" data-gwent-own="${esc(c.id)}" ${owned ? "checked" : ""}><span>Owned</span></label>${favBtn("card", c.id, c.name, false)}${c.hero ? '<span class="tag tag-rare">Hero</span>' : ""}</div>
      <dl class="kv"><dt>Faction</dt><dd>${esc(FACTIONS[c.faction].name)}</dd><dt>Type</dt><dd>${esc(c.type)}</dd>${c.str != null ? `<dt>Strength</dt><dd class="mono">${c.str}</dd>` : ""}<dt>Ability</dt><dd>${esc(c.ability)}</dd><dt>How to get</dt><dd>${esc(c.acquire)}</dd></dl>
      ${c.hero ? `<p class="muted" style="margin-top:14px">Hero cards are immune to special cards, weather and abilities.</p>` : ""}
      <div class="row" style="margin-top:12px">${vTag(c.v)}</div>${srcLine(c.src)}`;
    return modalShell(c.name, body, "", `<span class="label">${esc(FACTIONS[c.faction].name)}</span>`);
  },
  ach(id){
    const a = ACHIEVEMENTS.find(x => x.id === id); if(!a) return null;
    const body = `<div class="row" style="margin-bottom:16px">${checkboxLabeled(a.id, "Unlocked")}${favBtn("ach", a.id, a.name, false)}${a.missable ? '<span class="tag tag-warn">Missable</span>' : ""}</div><p>${esc(a.how)}</p>
      ${a.missable ? `<p class="muted">Missable flags come from third-party guides, not the wiki table.</p>` : ""}${srcLine(a.src)}`;
    return modalShell(a.name, body, "", `<span class="label">${a.group === "base" ? "Base game" : esc(dlcLabel(a.group))}</span>`);
  },
  build(id){
    const b = BUILDS.find(x => x.id === id); if(!b) return null;
    const sk = allSkills();
    const pts = Object.values(b.alloc).reduce((a, n) => a + n, 0);
    const byTree = {};
    Object.entries(b.alloc).forEach(([k, n]) => { const s = sk[k]; (byTree[s.tree] = byTree[s.tree] || []).push(`${s.name} <span class="mono dim">${n}/${s.max}</span>`); });
    const body = `<div class="row" style="margin-bottom:14px">${favBtn("build", b.id, b.name, false)}<span class="tag tag-accent">${esc(b.tag)}</span><span class="tag">${esc(b.gear)}</span><span class="tag mono">${pts + b.mutations.reduce((a, id) => a + MUTATIONS.find(m => m.id === id).ap, 0)} points</span><span class="tag mono">Planned for level ${b.level}</span></div>
      <p class="muted">${esc(b.summary)}</p>
      <div class="two-col" style="margin-top:18px">
        <div><h4 style="margin-bottom:10px">Playstyle</h4><ul class="clean">${b.playstyle.map(p => `<li>${esc(p)}</li>`).join("")}</ul>
        <h4 style="margin:18px 0 10px">Recommended equipment</h4><ul class="clean">${b.equipment.map(p => `<li>${esc(p)}</li>`).join("")}</ul>
        ${b.mutations.length ? `<h4 style="margin:18px 0 10px">Mutations</h4><p class="muted">${b.mutations.map(id => esc(MUTATIONS.find(m => m.id === id).name)).join(" → ")} (Blood and Wine)</p>` : ""}</div>
        <div><h4 style="margin-bottom:10px">Skill allocation</h4>${Object.entries(byTree).map(([t, arr]) => `<p style="margin-bottom:10px"><span class="label">${esc(SKILL_TREES[t].name)}</span><br>${arr.join("<br>")}</p>`).join("")}</div>
      </div>
      <div class="notice info" style="margin-top:16px">${icon("ph-info")}<div>This is an editorial recommendation built on the Remastered skill trees, not an official build. Skill names, ranks and connections come from the wiki.</div></div>`;
    return modalShell(b.name, body, `<button class="btn" data-action="close-modal">Close</button><button class="btn btn-primary" data-action="load-build" data-id="${esc(b.id)}">${icon("ph-arrow-square-in")}Load into planner</button>`, `<span class="label">${esc(b.tag)} build</span>`);
  }
};
function checkboxLabeled(id, label){
  return `<label class="check"><input type="checkbox" data-check="${esc(id)}" ${isChecked(id) ? "checked" : ""}><span>${esc(label)}</span></label>`;
}
</script>
