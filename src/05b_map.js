<script>
"use strict";
/* =====================================================================
   8b. INTERACTIVE MAP
   A small vanilla tile viewer (no map library). Tiles are 256px TMS PNGs
   from the witcher3map project. Two projections, matching its Leaflet 0.7
   setup: Web Mercator for White Orchard and Skellige, CRS.Simple for the
   rest. Both are linear in 2^zoom, so positions are stored as "units"
   (pixels / 2^zoom) and multiplied up for the current zoom.
   ===================================================================== */
const TILE_HOSTS = [
  (p, z, x, y) => `https://raw.githubusercontent.com/witcher3map/witcher3map-maps/master/${p}/${z}/${x}/${y}.png`,
  (p, z, x, y) => `https://cdn.jsdelivr.net/gh/witcher3map/witcher3map-maps@master/${p}/${z}/${x}/${y}.png`
];
const MAP_MIN_ZOOM = 2;
const MAP_GROUPS = {
  power:{label:"Places of Power"}, explore:{label:"Exploration"}, quest:{label:"Quests and people"},
  treasure:{label:"Treasure"}, danger:{label:"Danger"}, service:{label:"Services"}
};
const MAP_CATS = {
  pop:{label:"Places of Power", icon:"ph-sparkle", group:"power"},
  signpost:{label:"Signposts", icon:"ph-signpost", group:"explore"},
  poi:{label:"Points of interest", icon:"ph-push-pin", group:"explore"},
  entrance:{label:"Cave and ruin entrances", icon:"ph-door-open", group:"explore", off:true},
  harbor:{label:"Harbors", icon:"ph-anchor", group:"explore"},
  signalfire:{label:"Signal fires", icon:"ph-fire", group:"explore"},
  sidequests:{label:"Side quests", icon:"ph-scroll", group:"quest"},
  contracts:{label:"Contracts", icon:"ph-file-text", group:"quest"},
  notice:{label:"Notice boards", icon:"ph-clipboard-text", group:"quest", off:true},
  gwent:{label:"Gwent players", icon:"ph-cards", group:"quest"},
  pid:{label:"People in distress", icon:"ph-lifebuoy", group:"quest"},
  kid:{label:"Knights errant in distress", icon:"ph-shield-warning", group:"quest"},
  guarded:{label:"Guarded treasure", icon:"ph-treasure-chest", group:"treasure"},
  hidden:{label:"Hidden treasure", icon:"ph-diamond", group:"treasure"},
  spoils:{label:"Spoils of war", icon:"ph-sword", group:"treasure"},
  smugglers:{label:"Smugglers' caches", icon:"ph-package", group:"treasure"},
  monsternest:{label:"Monster nests", icon:"ph-skull", group:"danger"},
  monsterden:{label:"Monster dens", icon:"ph-paw-print", group:"danger"},
  banditcamp:{label:"Bandit camps", icon:"ph-campfire", group:"danger"},
  abandoned:{label:"Abandoned sites", icon:"ph-house-line", group:"danger"},
  hansebase:{label:"Hanse bases", icon:"ph-castle-turret", group:"danger"},
  vineyardinfestation:{label:"Vineyard infestations", icon:"ph-bug", group:"danger"},
  blacksmith:{label:"Blacksmiths", icon:"ph-hammer", group:"service"},
  armourer:{label:"Armorers", icon:"ph-shield", group:"service"},
  herbalist:{label:"Herbalists", icon:"ph-plant", group:"service"},
  alchemy:{label:"Alchemy supplies", icon:"ph-flask", group:"service"},
  innkeep:{label:"Innkeeps", icon:"ph-beer-stein", group:"service"},
  shopkeeper:{label:"Shopkeepers", icon:"ph-storefront", group:"service"},
  barber:{label:"Barbers", icon:"ph-scissors", group:"service"},
  brothel:{label:"Brothels", icon:"ph-heart", group:"service"},
  grindstone:{label:"Grindstones", icon:"ph-gear", group:"service", off:true},
  armourerstable:{label:"Armorer's tables", icon:"ph-table", group:"service", off:true}
};
const REGION_TO_MAP = {"white-orchard":"white_orchard", "velen":"velen", "novigrad":"velen", "skellige":"skellige", "kaer-morhen":"kaer_morhen", "toussaint":"toussaint"};

/* Expand flat arrays once into marker records with stable ids. */
const MAP_MARKERS = {};
for(const mid in MAP_PTS){
  MAP_MARKERS[mid] = [];
  for(const cat in MAP_PTS[mid]){
    const a = MAP_PTS[mid][cat];
    for(let i = 0, n = 0; i < a.length; i += 4, n++){
      MAP_MARKERS[mid].push({id:`m:${mid}:${cat}:${n}`, map:mid, cat, lat:a[i], lng:a[i + 1], label:MAP_STR[a[i + 2]] || (MAP_CATS[cat] || {}).label || cat, desc:MAP_STR[a[i + 3]] || ""});
    }
  }
}
/* Journal location -> map marker links. Generated offline and reviewed by hand.
   A link is made only on an exact signpost name, a unique nearest signpost, or a
   quest or role named in the marker text. Ambiguous entries stay unlinked. */
const LOCATION_PINS = {
  "wo-sp-sawmill":{"pins":["m:white_orchard:signpost:3"],"how":"exact signpost name"},
  "wo-sp-mill":{"pins":["m:white_orchard:signpost:4"],"how":"exact signpost name"},
  "wo-sp-garrison":{"pins":["m:white_orchard:signpost:5"],"how":"exact signpost name"},
  "wo-sp-bridge":{"pins":["m:white_orchard:signpost:1"],"how":"exact signpost name"},
  "wo-sp-abandoned":{"pins":["m:white_orchard:signpost:0"],"how":"exact signpost name"},
  "ve-sp-crows":{"pins":["m:velen:signpost:59"],"how":"exact signpost name"},
  "ve-sp-midcopse":{"pins":["m:velen:signpost:63"],"how":"exact signpost name"},
  "ve-sp-downwarren":{"pins":["m:velen:signpost:88"],"how":"exact signpost name"},
  "ve-sp-oak":{"pins":["m:velen:signpost:87"],"how":"exact signpost name"},
  "no-sp-electors":{"pins":["m:velen:signpost:4"],"how":"exact signpost name"},
  "no-sp-hierarch":{"pins":["m:velen:signpost:0"],"how":"exact signpost name"},
  "sk-sp-kt":{"pins":["m:skellige:signpost:49"],"how":"exact signpost name"},
  "sk-sp-svorlag":{"pins":["m:skellige:signpost:13"],"how":"exact signpost name"},
  "sk-sp-gedyneith":{"pins":["m:skellige:signpost:43"],"how":"exact signpost name"},
  "sk-sp-harviken":{"pins":["m:skellige:signpost:1"],"how":"exact signpost name"},
  "to-sp-tourney":{"pins":["m:toussaint:signpost:18"],"how":"exact signpost name"},
  "to-sp-gelenser":{"pins":["m:toussaint:signpost:12"],"how":"exact signpost name"},
  "wo-pop-quen1":{"pins":["m:white_orchard:pop:0"],"how":"nearest signpost: Broken Bridge"},
  "ve-pop-lornruk":{"pins":["m:velen:pop:2"],"how":"nearest signpost: Lornruk"},
  "ve-pop-midcopse":{"pins":["m:velen:pop:4"],"how":"marker names Wandering in the Dark"},
  "ve-pop-downwarren":{"pins":["m:velen:pop:7"],"how":"nearest signposts: Dragonslayer's Grotto, Downwarren"},
  "ve-pop-bald":{"pins":["m:velen:pop:5"],"how":"marker names the Bald Mountain quest"},
  "no-pop-igni":{"pins":["m:velen:pop:0"],"how":"nearest signposts: Cavern, Electors' Square"},
  "no-pop-axii":{"pins":["m:velen:pop:1"],"how":"nearest signpost: Alness"},
  "sk-pop-svorlag":{"pins":["m:skellige:pop:2"],"how":"nearest signpost: Svorlag"},
  "sk-pop-urialla":{"pins":["m:skellige:pop:1"],"how":"nearest signpost: Yngvar's Fang"},
  "sk-pop-kt-quen":{"pins":["m:skellige:pop:6"],"how":"marker names King's Gambit"},
  "sk-pop-kt-igni":{"pins":["m:skellige:pop:8"],"how":"marker names The Sunstone"},
  "sk-pop-druids":{"pins":["m:skellige:pop:5"],"how":"nearest signpost: Druids' Camp"},
  "sk-pop-fornhala":{"pins":["m:skellige:pop:3"],"how":"nearest signposts: Holmstein's Port, Fornhala"},
  "sk-pop-harviken":{"pins":["m:skellige:pop:0"],"how":"nearest signpost: Harviken"},
  "km-pop":{"pins":["m:kaer_morhen:pop:0"],"how":"only Place of Power on the map"},
  "to-pop-termes":{"pins":["m:toussaint:pop:0"],"how":"nearest signpost: Termes Palace ruins"},
  "to-pop-rioux":{"pins":["m:toussaint:pop:1"],"how":"nearest signpost: Rioux-Cannes Outpost"},
  "to-pop-arthach":{"pins":["m:toussaint:pop:4"],"how":"nearest signpost: Arthach Palace Ruins"},
  "wo-smith-garrison":{"pins":["m:white_orchard:blacksmith:0"],"how":"nearest signpost: Nilfgaardian Garrison"},
  "ve-lindenvale":{"pins":["m:velen:blacksmith:6"],"how":"nearest signpost: Lindenvale"},
  "ve-smiths":{"pins":["m:velen:blacksmith:4","m:velen:blacksmith:5"],"how":"nearest signposts: Blackbough, Oreton","note":"The Bald Mountain smith has no marker on the map."},
  "no-hattori":{"pins":["m:velen:blacksmith:0"],"how":"marker names Of Swords and Dumplings"},
  "no-journey":{"pins":["m:velen:blacksmith:3"],"how":"nearest signposts: Novigrad Gate, Oxenfurt Harbor","note":"Only the Oxenfurt smith could be matched; the Fish Market smith is not linked."},
  "sk-smith":{"pins":["m:skellige:blacksmith:8","m:skellige:blacksmith:4"],"how":"nearest signposts: Bridge to Kaer Trolde, Kaer Muire"},
  "to-lafargue":{"pins":["m:toussaint:armourer:2"],"how":"marker names Lafargue"},
  "to-tourney-smith":{"pins":["m:toussaint:blacksmith:1"],"how":"nearest signpost: Tourney Grounds","note":"The Arthach Palace ruins smith has no marker on the map."},
  "ve-fergus":{"pins":["m:velen:armourer:3"],"how":"journeyman armorer by Crow's Perch"},
  "ve-yoana":{"pins":["m:velen:armourer:5"],"how":"marker names Master Armorers"},
  "no-otto":{"pins":["m:velen:herbalist:3"],"how":"nearest signpost: Herbalist's Hut"},
  "ve-gwent-inn":{"pins":["m:velen:innkeep:8"],"how":"marker named Inn at the Crossroads"},
  "ve-gwent-boat":{"pins":["m:velen:gwent:37"],"how":"only Gwent player by Oreton"},
  "sk-gwent-urialla":{"pins":["m:skellige:innkeep:2"],"how":"marker named Urialla Harbour Inn"},
  "to-gwent-barrel":{"pins":["m:toussaint:innkeep:5"],"how":"marker named The Barrel and Bung Inn"},
  "sk-tr-bearxbow":{"pins":["m:skellige:poi:10"],"how":"marker named Ursine Crossbow"}
};
const PIN_TO_LOC = {};
for(const lid in LOCATION_PINS) LOCATION_PINS[lid].pins.forEach(p => (PIN_TO_LOC[p] = PIN_TO_LOC[p] || []).push(lid));
/* Checks mirror only across one-to-one links, so ticking a multi-pin entry never marks pins it does not cover. */
function linkedChecks(id){
  if(LOCATION_PINS[id]) return LOCATION_PINS[id].pins.length === 1 ? LOCATION_PINS[id].pins : [];
  if(PIN_TO_LOC[id]) return PIN_TO_LOC[id].filter(l => LOCATION_PINS[l].pins.length === 1);
  return [];
}
function showOnMap(locId, i = 0){ const p = LOCATION_PINS[locId].pins[i]; closeModal(); go("map", {m:p.split(":")[1], pin:p, z:5}); }
function markerById(id){ const mid = id.split(":")[1]; return (MAP_MARKERS[mid] || []).find(m => m.id === id); }

/* Projection to "units": pixels at zoom z are units * 2^z. */
function toUnits(M, lat, lng){
  if(M.proj === "merc"){
    const r = lat * Math.PI / 180;
    return [(lng + 180) / 360 * 256, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 256];
  }
  return [lng, -lat];
}
function unitBounds(M){
  const a = toUnits(M, M.sw[0], M.sw[1]), b = toUnits(M, M.ne[0], M.ne[1]);
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
}
function tileFile(M, z, tx, ty){
  if(M.proj === "merc"){ const n = 2 ** z; if(tx < 0 || ty < 0 || tx >= n || ty >= n) return null; return [tx, n - 1 - ty]; }
  const fy = -ty - 1; if(tx < 0 || fy < 0) return null; return [tx, fy];
}

/* Viewer state (one live instance at a time). */
const MV = {el:null, layer:null, tiles:null, pins:null, M:null, mid:null, z:3, ox:0, oy:0, sel:null, ro:null, animating:false, raf:0, urlTimer:0};
function mapDestroy(){ if(MV.ro){ MV.ro.disconnect(); MV.ro = null; } MV.el = null; cancelAnimationFrame(MV.raf); clearTimeout(MV.urlTimer); }
function mapOff(){ return new Set(state.map.off); }
function mapVisible(m){ return !mapOff().has(m.cat) && !(state.map.hideFound && isChecked(m.id)) && !(state.map.linkedOnly && !PIN_TO_LOC[m.id]); }

VIEWS.map = () => {
  const mid = MAP_DEFS[P("m")] ? P("m") : "velen";
  const M = MAP_DEFS[mid];
  const markers = MAP_MARKERS[mid];
  const found = markers.filter(m => isChecked(m.id)).length;
  const off = mapOff();
  const cats = Object.keys(MAP_CATS).filter(c => markers.some(m => m.cat === c));
  return `
  <header class="page-head"><h1>Interactive Map</h1>
    <p>Game map tiles with ${Object.values(MAP_MARKERS).reduce((a, m) => a + m.length, 0).toLocaleString()} community-plotted markers across ${Object.keys(MAP_DEFS).length} regions. Drag to pan, scroll or pinch to zoom, and tick off what you've found.</p></header>
  <div class="tabs" role="tablist" aria-label="Choose a map">${Object.entries(MAP_DEFS).map(([k, d]) => `<button class="tab" role="tab" aria-selected="${k === mid}" data-action="map-switch" data-id="${k}">${esc(d.name)}<span class="n">${MAP_MARKERS[k].filter(m => isChecked(m.id)).length}/${MAP_MARKERS[k].length}</span></button>`).join("")}</div>
  <div class="map-shell">
    <div class="map-frame">
      <div class="map-viewport" id="mapViewport" tabindex="0" role="application" aria-roledescription="map" aria-label="${esc(M.name)} map. Arrow keys pan, plus and minus zoom, 0 resets the view." aria-describedby="mapHelp">
        <div class="map-layer" id="mapLayer"><div class="map-tiles" id="mapTiles"></div><div class="map-pins" id="mapPins"></div></div>
      </div>
      <div class="map-controls" role="group" aria-label="Map controls">
        <button class="btn btn-icon btn-sm" data-action="map-zoom" data-id="1" aria-label="Zoom in">${icon("ph-plus")}</button>
        <button class="btn btn-icon btn-sm" data-action="map-zoom" data-id="-1" aria-label="Zoom out">${icon("ph-minus")}</button>
        <button class="btn btn-icon btn-sm" data-action="map-reset" aria-label="Reset view">${icon("ph-corners-in")}</button>
        <button class="btn btn-icon btn-sm" data-action="map-full" aria-label="Toggle full screen">${icon("ph-arrows-out")}</button>
      </div>
      <div class="map-card" id="mapCard" hidden aria-live="polite"></div>
      <div class="map-status" id="mapStatus" aria-live="polite"></div>
      <p class="map-attrib">Tiles and markers: <a href="https://github.com/witcher3map/witcher3map" target="_blank" rel="noopener noreferrer">witcher3map</a> (CC BY-NC-SA 4.0). Map art © CD PROJEKT RED.</p>
    </div>
    <aside class="map-side" aria-label="Map filters">
      <div class="row between"><span class="label">${esc(M.name)}</span><span class="mono dim">${found}/${markers.length} found</span></div>
      ${meter(pct(found, markers.length), found === markers.length)}
      <label class="field" style="margin-top:14px"><span>Find a marker</span><span class="input-wrap">${icon("ph-magnifying-glass")}<input class="input" type="search" id="mapSearch" value="${esc(P("mq"))}" placeholder="e.g. Crow's Perch, Place of Power" aria-controls="mapResults"></span></label>
      <div id="mapResults" class="map-results">${mapResultsHtml(mid, P("mq"))}</div>
      <label class="row" style="gap:10px;margin:12px 0 4px"><input type="checkbox" class="switch" id="mapHideFound" ${state.map.hideFound ? "checked" : ""}><span class="muted">Hide found markers</span></label>
      <label class="row" style="gap:10px;margin:4px 0"><input type="checkbox" class="switch" id="mapLinkedOnly" ${state.map.linkedOnly ? "checked" : ""}><span class="muted">Journal locations only <span class="mono dim">(${markers.filter(m => PIN_TO_LOC[m.id]).length})</span></span></label>
      <div class="row between" style="margin-top:10px"><span class="label">Categories</span><span class="row" style="gap:4px"><button class="btn btn-ghost btn-sm" data-action="map-cats" data-id="all">All</button><button class="btn btn-ghost btn-sm" data-action="map-cats" data-id="none">None</button></span></div>
      ${Object.entries(MAP_GROUPS).map(([g, G]) => { const cs = cats.filter(c => MAP_CATS[c].group === g); if(!cs.length) return "";
        return `<fieldset class="map-group"><legend>${esc(G.label)}</legend>${cs.map(c => { const all = markers.filter(m => m.cat === c); const f = all.filter(m => isChecked(m.id)).length;
          return `<label class="map-cat"><input type="checkbox" data-map-cat="${c}" ${off.has(c) ? "" : "checked"}><span class="pin-dot g-${g}" aria-hidden="true">${icon(MAP_CATS[c].icon)}</span><span class="grow">${esc(MAP_CATS[c].label)}</span><span class="mono dim">${f}/${all.length}</span></label>`; }).join("")}</fieldset>`; }).join("")}
      <p class="src" id="mapHelp" style="margin-top:14px">Markers with a gold dot are linked to a World Explorer entry. Marker positions and descriptions come from the open-source witcher3map project and were not independently verified. Hearts of Stone content shares the Velen and Novigrad map.</p>
    </aside>
  </div>`;
};
function mapResultsHtml(mid, q){
  q = (q || "").trim().toLowerCase();
  if(q.length < 2) return "";
  const terms = q.split(/\s+/);
  const res = MAP_MARKERS[mid].filter(m => terms.every(t => (m.label + " " + m.desc + " " + (MAP_CATS[m.cat] || {}).label).toLowerCase().includes(t))).slice(0, 40);
  if(!res.length) return `<p class="dim" style="font-size:.9rem;margin:8px 0 0">No markers match on this map.</p>`;
  return `<div class="list" role="list">${res.map(m => `<button class="map-result" role="listitem" data-action="map-goto" data-id="${esc(m.id)}">${icon((MAP_CATS[m.cat] || {}).icon || "ph-map-pin")}<span><span class="item-title">${esc(m.label)}</span><span class="dim" style="display:block;font-size:.8rem">${esc((MAP_CATS[m.cat] || {}).label || m.cat)}${isChecked(m.id) ? " · found" : ""}</span></span></button>`).join("")}</div>`;
}

VIEWS.map_after = () => {
  const mid = MAP_DEFS[P("m")] ? P("m") : "velen";
  MV.el = $("#mapViewport"); MV.layer = $("#mapLayer"); MV.tiles = $("#mapTiles"); MV.pins = $("#mapPins");
  MV.M = MAP_DEFS[mid]; MV.mid = mid; MV.sel = null;
  const zq = parseInt(P("z"), 10);
  MV.z = Math.max(MAP_MIN_ZOOM, Math.min(MV.M.maxZoom, isNaN(zq) ? 3 : zq));
  const c = P("c").split(",").map(Number);
  const cu = c.length === 2 && c.every(isFinite) ? c : toUnits(MV.M, MV.M.center[0], MV.M.center[1]);
  mapCenterOn(cu[0], cu[1]);
  buildPins();
  mapDraw();
  bindMapEvents();
  MV.ro = new ResizeObserver(() => { if(MV.el){ clampPan(); mapDraw(); } });
  MV.ro.observe(MV.el);
  const pin = P("pin");
  if(pin && markerById(pin)) setTimeout(() => mapSelect(pin, !P("c")), 30);
};
function vpSize(){ return [MV.el.clientWidth, MV.el.clientHeight]; }
function mapCenterOn(ux, uy, fy = .5){
  const [W, H] = vpSize(), s = 2 ** MV.z;
  MV.ox = W / 2 - ux * s; MV.oy = H * fy - uy * s;
  clampPan();
}
function clampPan(){
  const [W, H] = vpSize(), s = 2 ** MV.z, b = unitBounds(MV.M);
  const x0 = b[0] * s, y0 = b[1] * s, x1 = b[2] * s, y1 = b[3] * s;
  const pad = 80;
  MV.ox = (x1 - x0 + 2 * pad <= W) ? (W - (x0 + x1)) / 2 : Math.min(-x0 + pad, Math.max(W - x1 - pad, MV.ox));
  MV.oy = (y1 - y0 + 2 * pad <= H) ? (H - (y0 + y1)) / 2 : Math.min(-y0 + pad, Math.max(H - y1 - pad, MV.oy));
}
function scheduleDraw(){ cancelAnimationFrame(MV.raf); MV.raf = requestAnimationFrame(mapDraw); }
function mapDraw(){
  if(!MV.el) return;
  const [W, H] = vpSize(), z = MV.z, s = 2 ** z, b = unitBounds(MV.M), mid = MV.mid;
  MV.ox = Math.round(MV.ox); MV.oy = Math.round(MV.oy);
  MV.layer.style.transform = `translate(${MV.ox}px,${MV.oy}px)`;
  const tx0 = Math.floor(Math.max(-MV.ox, b[0] * s) / 256), tx1 = Math.floor((Math.min(W - MV.ox, b[2] * s) - 1) / 256);
  const ty0 = Math.floor(Math.max(-MV.oy, b[1] * s) / 256), ty1 = Math.floor((Math.min(H - MV.oy, b[3] * s) - 1) / 256);
  const want = new Set();
  for(let tx = tx0; tx <= tx1; tx++) for(let ty = ty0; ty <= ty1; ty++){
    const f = tileFile(MV.M, z, tx, ty); if(!f) continue;
    const key = `${z}/${tx}/${ty}`; want.add(key);
    if(!MV.tiles.querySelector(`[data-k="${key}"]`)){
      const img = new Image(256, 256);
      img.alt = ""; img.decoding = "async"; img.draggable = false;
      img.dataset.k = key; img.dataset.h = "0";
      img.style.transform = `translate(${tx * 256}px,${ty * 256}px)`;
      img.onload = () => img.classList.add("on");
      img.onerror = () => { const h = +img.dataset.h + 1; if(h < TILE_HOSTS.length){ img.dataset.h = h; img.src = TILE_HOSTS[h](mid, z, f[0], f[1]); } else { img.classList.add("missing"); mapStatus("Some map tiles could not be loaded. Check your connection."); } };
      img.src = TILE_HOSTS[0](mid, z, f[0], f[1]);
      MV.tiles.appendChild(img);
    }
  }
  $$("img", MV.tiles).forEach(img => { if(!want.has(img.dataset.k)) img.remove(); });
}
function buildPins(){
  const s = 2 ** MV.z;
  MV.pins.classList.toggle("z-low", MV.z <= 3);
  MV.pins.innerHTML = MAP_MARKERS[MV.mid].map(m => {
    const C = MAP_CATS[m.cat] || {icon:"ph-map-pin", group:"explore"};
    const [ux, uy] = toUnits(MV.M, m.lat, m.lng);
    return `<button class="pin g-${C.group} ${PIN_TO_LOC[m.id] ? "linked" : ""} ${isChecked(m.id) ? "found" : ""} ${MV.sel === m.id ? "sel" : ""}" data-pin="${esc(m.id)}" tabindex="-1" style="transform:translate(${(ux * s).toFixed(1)}px,${(uy * s).toFixed(1)}px)" ${mapVisible(m) ? "" : "hidden"} aria-label="${esc(m.label)}">${icon(C.icon)}</button>`;
  }).join("");
}
function refreshPinVisibility(){
  $$(".pin", MV.pins).forEach(p => { const m = markerById(p.dataset.pin); p.hidden = !mapVisible(m); p.classList.toggle("found", isChecked(m.id)); });
}
function mapStatus(msg){ const s = $("#mapStatus"); if(!s) return; s.textContent = msg; s.classList.add("show"); clearTimeout(s._t); s._t = setTimeout(() => s.classList.remove("show"), 2600); }
function syncMapUrl(){
  clearTimeout(MV.urlTimer);
  MV.urlTimer = setTimeout(() => {
    if(!MV.el) return;
    const [W, H] = vpSize(), s = 2 ** MV.z;
    setParams({m:MV.mid, z:MV.z, c:`${((W / 2 - MV.ox) / s).toFixed(2)},${((H / 2 - MV.oy) / s).toFixed(2)}`, pin:MV.sel || ""});
  }, 250);
}
/* Zoom keeps the world point under (fx, fy) fixed. Old tiles stay scaled underneath until the new ones load. */
function mapZoom(dz, fx, fy){
  if(!MV.el || MV.animating) return;
  const nz = Math.max(MAP_MIN_ZOOM, Math.min(MV.M.maxZoom, MV.z + dz));
  if(nz === MV.z){ mapStatus(dz > 0 ? "Maximum zoom" : "Minimum zoom"); return; }
  const [W, H] = vpSize();
  if(fx == null){ fx = W / 2; fy = H / 2; }
  const k = 2 ** (nz - MV.z), wx = fx - MV.ox, wy = fy - MV.oy;
  let nox = fx - wx * k, noy = fy - wy * k;
  const reduce = state.settings.reduceMotion || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const commit = () => {
    const old = MV.tiles;
    old.removeAttribute("id"); old.classList.add("map-tiles-old");
    old.style.transform = `scale(${k})`;
    const fresh = document.createElement("div"); fresh.className = "map-tiles"; fresh.id = "mapTiles";
    MV.layer.insertBefore(fresh, MV.pins);
    MV.tiles = fresh;
    MV.layer.style.transition = "";
    MV.z = nz; MV.ox = nox; MV.oy = noy; clampPan();
    buildPins(); mapDraw();
    setTimeout(() => old.remove(), 900);
    MV.animating = false;
    syncMapUrl();
  };
  if(reduce){ commit(); return; }
  MV.animating = true;
  MV.layer.style.transition = "transform .24s cubic-bezier(.2,.7,.2,1)";
  MV.layer.style.transform = `translate(${nox}px,${noy}px) scale(${k})`;
  setTimeout(commit, 250);
}
function mapSelect(id, center = true){
  const m = markerById(id); if(!m || !MV.el) return;
  MV.sel = id;
  $$(".pin.sel", MV.pins).forEach(p => p.classList.remove("sel"));
  const pin = $(`.pin[data-pin="${CSS.escape(id)}"]`, MV.pins);
  if(pin){ pin.classList.add("sel"); pin.hidden = false; }
  if(center){ const [ux, uy] = toUnits(MV.M, m.lat, m.lng); mapCenterOn(ux, uy, MV.el.clientWidth < 720 ? .26 : .5); mapDraw(); }
  const C = MAP_CATS[m.cat] || {label:m.cat, icon:"ph-map-pin", group:"explore"};
  const card = $("#mapCard");
  card.innerHTML = `<div class="row between" style="align-items:flex-start;gap:10px"><div class="row" style="gap:10px;align-items:flex-start"><span class="pin-dot g-${C.group}" aria-hidden="true">${icon(C.icon)}</span><div><span class="label" style="font-size:.66rem">${esc(C.label)}</span><h3 style="font-size:1.25rem;margin-top:2px">${esc(m.label)}</h3></div></div>
    <button class="btn btn-ghost btn-icon btn-sm" data-action="map-close-card" aria-label="Close marker details">${icon("ph-x")}</button></div>
    ${m.desc && m.desc !== m.label ? `<p class="muted" style="font-size:.92rem;margin:10px 0 0">${esc(m.desc)}</p>` : ""}
    <div class="row" style="margin-top:12px">${checkboxLabeled(m.id, "Found")}${(PIN_TO_LOC[m.id] || []).map(lid => `<button class="btn btn-sm" data-open="loc:${esc(lid)}">${icon("ph-book-open")}Journal entry</button>`).join("")}</div>
    ${(PIN_TO_LOC[m.id] || []).map(lid => { const l = LOCATIONS.find(x => x.id === lid); return `<p class="src" style="margin:8px 0 0">Linked to "${esc(l.name)}" (${esc(LOCATION_PINS[lid].how)}).</p>`; }).join("")}`;
  card.hidden = false;
  syncMapUrl();
}
function mapGoto(id){
  const m = markerById(id); if(!m) return;
  if(mapOff().has(m.cat)){ state.map.off = state.map.off.filter(c => c !== m.cat); save(); const cb = $(`[data-map-cat="${m.cat}"]`); if(cb) cb.checked = true; refreshPinVisibility(); }
  const target = Math.max(MV.z, MV.M.maxZoom - 1);
  if(target !== MV.z){ MV.z = target; MV.tiles.innerHTML = ""; buildPins(); }
  mapSelect(id, true);
  MV.el.focus({preventScroll:true});
}
function mapOnCheck(id, on){
  if(!MV.el) return;
  const p = $(`.pin[data-pin="${CSS.escape(id)}"]`, MV.pins);
  if(p){ p.classList.toggle("found", on); if(state.map.hideFound && on && MV.sel !== id) p.hidden = true; }
  const ms = MAP_MARKERS[MV.mid], f = ms.filter(m => isChecked(m.id)).length;
  const side = $(".map-side .mono"); if(side) side.textContent = `${f}/${ms.length} found`;
  const meterI = $(".map-side .meter i"); if(meterI) meterI.style.width = pct(f, ms.length) + "%";
  const cat = markerById(id).cat, all = ms.filter(m => m.cat === cat);
  const lab = $(`[data-map-cat="${cat}"]`)?.closest(".map-cat")?.querySelector(".mono"); if(lab) lab.textContent = `${all.filter(m => isChecked(m.id)).length}/${all.length}`;
  const tab = $(`[data-action="map-switch"][data-id="${MV.mid}"] .n`); if(tab) tab.textContent = `${f}/${ms.length}`;
}
function bindMapEvents(){
  const el = MV.el;
  const pts = new Map();
  let drag = null, pinch = null, moved = false, dragEnd = 0, wheelAcc = 0, wheelT = 0;
  const local = e => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  el.addEventListener("pointerdown", e => {
    if(e.button !== 0 && e.pointerType === "mouse") return;
    el.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, local(e));
    moved = false;
    if(pts.size === 1){ const [x, y] = local(e); drag = {x, y, ox:MV.ox, oy:MV.oy}; el.classList.add("grabbing"); }
    if(pts.size === 2){ const [a, b] = [...pts.values()]; pinch = {d:Math.hypot(a[0] - b[0], a[1] - b[1]), mx:(a[0] + b[0]) / 2, my:(a[1] + b[1]) / 2, k:1}; drag = null; }
  });
  el.addEventListener("pointermove", e => {
    if(!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, local(e));
    if(pinch && pts.size === 2){
      const [a, b] = [...pts.values()];
      pinch.k = Math.max(.25, Math.min(4, Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d));
      const tx = pinch.mx - (pinch.mx - MV.ox) * pinch.k, ty = pinch.my - (pinch.my - MV.oy) * pinch.k;
      MV.layer.style.transform = `translate(${tx}px,${ty}px) scale(${pinch.k})`;
      moved = true; return;
    }
    if(drag){
      const [x, y] = local(e);
      if(Math.abs(x - drag.x) + Math.abs(y - drag.y) > 4) moved = true;
      MV.ox = drag.ox + x - drag.x; MV.oy = drag.oy + y - drag.y; clampPan(); scheduleDraw();
    }
  });
  const end = e => {
    if(!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if(pinch && pts.size < 2){
      const dz = Math.round(Math.log2(pinch.k));
      MV.layer.style.transform = `translate(${MV.ox}px,${MV.oy}px)`;
      if(dz) mapZoom(dz, pinch.mx, pinch.my);
      pinch = null; drag = null;
    }
    if(!pts.size){ drag = null; el.classList.remove("grabbing"); if(moved){ dragEnd = Date.now(); syncMapUrl(); } moved = false; }
  };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  el.addEventListener("click", e => {
    if(Date.now() - dragEnd < 250) return;
    const p = e.target.closest(".pin"); if(p) mapSelect(p.dataset.pin, false);
  });
  el.addEventListener("dblclick", e => { if(!e.target.closest(".pin")){ const [x, y] = local(e); mapZoom(1, x, y); } });
  el.addEventListener("wheel", e => {
    e.preventDefault();
    const now = Date.now(); if(now - wheelT > 300) wheelAcc = 0; wheelT = now;
    wheelAcc += e.deltaY;
    if(Math.abs(wheelAcc) >= 50 && !MV.animating){ const [x, y] = local(e); mapZoom(wheelAcc < 0 ? 1 : -1, x, y); wheelAcc = 0; }
  }, {passive:false});
  el.addEventListener("keydown", e => {
    const step = 90, k = e.key;
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(k)){
      e.preventDefault();
      MV.ox += k === "ArrowLeft" ? step : k === "ArrowRight" ? -step : 0;
      MV.oy += k === "ArrowUp" ? step : k === "ArrowDown" ? -step : 0;
      clampPan(); mapDraw(); syncMapUrl();
    } else if(k === "+" || k === "="){ e.preventDefault(); mapZoom(1); }
    else if(k === "-" || k === "_"){ e.preventDefault(); mapZoom(-1); }
    else if(k === "0"){ e.preventDefault(); mapReset(); }
  });
}
function mapReset(){
  if(!MV.el) return;
  MV.z = 3; MV.tiles.innerHTML = "";
  const c = toUnits(MV.M, MV.M.center[0], MV.M.center[1]);
  mapCenterOn(c[0], c[1]); buildPins(); mapDraw(); syncMapUrl();
}
</script>
