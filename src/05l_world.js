<script>
"use strict";
/* =====================================================================
   8l. ATLAS (World Explorer)
   Region medallions with progress rings, a field chart built from the
   interactive map's own low-zoom tiles with the region's journal
   locations pinned on it, an inspector for the chosen place, and a
   filterable ledger of every location card.
   ===================================================================== */
const WX_Z = 2;
function wxLocs(r){ return LOCATIONS.filter(l => !r || l.region === r); }
function wxRing(done, total, size = 64){
  const p = pct(done, total);
  return `<span class="wx-ring" style="--p:${p};--s:${size}px"><b class="mono">${p}<small>%</small></b></span>`;
}
function wxTileErr(img){ const h = +img.dataset.h + 1; if(h < TILE_HOSTS.length){ img.dataset.h = h; img.src = TILE_HOSTS[h](img.dataset.m, WX_Z, img.dataset.x, img.dataset.y); } else img.remove(); }
/* Pin position as % of the map's unit bounds. */
function wxPos(mid, pinId){
  const M = MAP_DEFS[mid], mk = markerById(pinId); if(!mk) return null;
  const b = unitBounds(M), u = toUnits(M, mk.lat, mk.lng);
  return [(u[0] - b[0]) / (b[2] - b[0]) * 100, (u[1] - b[1]) / (b[3] - b[1]) * 100];
}
function wxChart(reg, sel){
  const mid = REGION_TO_MAP[reg.id], M = MAP_DEFS[mid];
  if(!M) return `<div class="wx-nomap">${art(reg.art)}<div>${icon("ph-compass")}<b>No game map for ${esc(reg.name)}</b><span>The interactive map data covers White Orchard, Velen and Novigrad, Skellige, Kaer Morhen and Toussaint. Use the ledger below for this region.</span></div></div>`;
  const b = unitBounds(M), W = b[2] - b[0], H = b[3] - b[1], s = 2 ** WX_Z, ts = 256 / s;
  let tiles = "";
  for(let tx = Math.floor(b[0] / ts); tx * ts < b[2]; tx++) for(let ty = Math.floor(b[1] / ts); ty * ts < b[3]; ty++){
    const f = tileFile(M, WX_Z, tx, ty); if(!f) continue;
    tiles += `<img class="wx-tile" alt="" loading="lazy" decoding="async" data-h="0" data-m="${mid}" data-x="${f[0]}" data-y="${f[1]}" src="${TILE_HOSTS[0](mid, WX_Z, f[0], f[1])}" onerror="wxTileErr(this)"
      style="left:${((tx * ts - b[0]) / W * 100).toFixed(3)}%;top:${((ty * ts - b[1]) / H * 100).toFixed(3)}%;width:${(ts / W * 100).toFixed(3)}%;height:${(ts / H * 100).toFixed(3)}%">`;
  }
  const signs = MAP_MARKERS[mid].filter(m => m.cat === "signpost").map(m => { const p = wxPos(mid, m.id); return p ? `<i class="wx-dot" style="left:${p[0].toFixed(2)}%;top:${p[1].toFixed(2)}%"></i>` : ""; }).join("");
  const t = P("t");
  const pins = wxLocs(reg.id).filter(l => LOCATION_PINS[l.id] && (!t || l.type === t)).map(l => {
    const p = wxPos(mid, LOCATION_PINS[l.id].pins[0]); if(!p) return "";
    const on = isChecked(l.id);
    return `<button class="wx-pin ${l.type} ${on ? "done" : ""} ${sel === l.id ? "sel" : ""} ${p[0] < 25 ? "edge-l" : p[0] > 75 ? "edge-r" : ""} ${p[1] < 12 ? "edge-t" : ""}" style="left:${p[0].toFixed(2)}%;top:${p[1].toFixed(2)}%" data-action="wx-sel" data-id="${l.id}" aria-label="${esc(l.name)}${on ? ", visited" : ""}" aria-pressed="${sel === l.id}">${icon(LOCATION_TYPES[l.type].icon)}<span class="wx-pin-tip">${esc(l.name)}</span></button>`;
  }).join("");
  return `<div class="wx-chart" style="aspect-ratio:${(W / H).toFixed(4)}"><div class="wx-tiles">${tiles}</div><div class="wx-dots" aria-hidden="true">${signs}</div><div class="wx-pins">${pins}</div></div>`;
}
function wxInspector(reg, l){
  if(!l){
    const ls = wxLocs(reg.id), d = ls.filter(x => isChecked(x.id)).length, linked = ls.filter(x => LOCATION_PINS[x.id]).length;
    return `<div class="wx-insp-head">${wxRing(d, ls.length, 72)}<div><span class="label">Region</span><h3>${esc(reg.name)}</h3><span class="dim">${d} of ${ls.length} visited</span></div></div>
      <p class="wx-blurb">${esc(reg.blurb)}</p>
      <dl class="kv"><dt>Suggested level</dt><dd class="mono">${esc(reg.level)}${reg.lvlNote ? ` <span class="dim">(${esc(reg.lvlNote)})</span>` : ""}</dd><dt>Places of Power</dt><dd class="mono">${reg.pop}</dd>${reg.dlc ? `<dt>Expansion</dt><dd>${esc(dlcLabel(reg.dlc))}</dd>` : ""}<dt>On the chart</dt><dd class="mono">${linked} of ${ls.length}</dd></dl>
      ${reg.popNote ? `<p class="src">${esc(reg.popNote)}</p>` : ""}
      <p class="wx-hint">${icon("ph-hand-pointing")}Pick a pin on the chart or a card in the ledger.</p>
      <a class="btn btn-sm" href="#/map${REGION_TO_MAP[reg.id] ? "?m=" + REGION_TO_MAP[reg.id] : ""}">${icon("ph-map-trifold")}Open the full map</a>`;
  }
  const lt = LOCATION_TYPES[l.type], on = isChecked(l.id), lp = LOCATION_PINS[l.id];
  return `<div class="wx-insp-head"><span class="wx-badge ${l.type}">${icon(lt.icon)}</span><div><span class="label">${esc(lt.label)} · ${esc(regionName(l.region))}</span><h3>${esc(l.name)}</h3>${l.v === "unverified" ? vTag("unverified") : ""}</div></div>
    <p class="wx-blurb">${esc(l.hint)}</p>
    <label class="wx-visit ${on ? "on" : ""}"><input type="checkbox" data-check="${esc(l.id)}" ${on ? "checked" : ""}><span>${icon(on ? "ph-seal-check ph-fill" : "ph-seal")}</span>${on ? "Visited" : "Mark as visited"}</label>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
      ${lp ? lp.pins.map((p, i) => `<button class="btn btn-sm" data-action="loc-map" data-id="${esc(l.id)}" data-i="${i}">${icon("ph-map-pin")}${lp.pins.length > 1 ? `Map pin ${i + 1}` : "Show on full map"}</button>`).join("") : `<span class="dim" style="font-size:.84rem">Not linked to a map marker.</span>`}
      ${favBtn("loc", l.id, l.name, false)}
      <button class="btn btn-sm btn-ghost" data-action="wx-sel" data-id="">${icon("ph-x")}Close</button>
    </div>
    ${lp ? `<p class="src" style="margin-top:12px">Map link: ${esc(lp.how)}.${lp.note ? " " + esc(lp.note) : ""}</p>` : ""}`;
}

VIEWS.world = () => {
  const reg = REGIONS.find(x => x.id === P("r"));
  const sel = LOCATIONS.find(l => l.id === P("sel") && (!reg || l.region === reg.id));
  const typeOpts = [["", "All types"], ...Object.entries(LOCATION_TYPES).map(([k, t]) => [k, t.label])];
  const all = LOCATIONS, ad = all.filter(l => isChecked(l.id)).length;
  return `
  <header class="page-head"><h1>World Explorer</h1><p>Travel the realms: chart each region's places, mark where you've been, and jump to the full map.</p></header>
  <nav class="wx-realms" aria-label="Choose a region">
    <button class="wx-realm all" aria-pressed="${!reg}" data-action="set-params" data-p='{"r":"","sel":""}'><span class="wx-realm-art">${icon("ph-globe-hemisphere-west")}</span>${wxRing(ad, all.length, 44)}<b>All realms</b><small>${ad}/${all.length}</small></button>
    ${REGIONS.map(x => { const ls = wxLocs(x.id), d = ls.filter(l => isChecked(l.id)).length;
      return `<button class="wx-realm" aria-pressed="${reg && reg.id === x.id}" data-action="set-params" data-p='{"r":"${x.id}","sel":""}'><span class="wx-realm-art">${art(x.art)}</span>${wxRing(d, ls.length, 44)}<b>${esc(x.name)}</b><small>${d}/${ls.length}</small></button>`; }).join("")}
  </nav>
  ${reg ? `<section class="wx-stage" aria-label="${esc(reg.name)} field chart">
      <div class="wx-board">
        <div class="wx-board-head"><div><span class="label">Field chart</span><h2>${esc(reg.name)}</h2></div>
          <div class="wx-legend">${Object.entries(LOCATION_TYPES).filter(([k]) => wxLocs(reg.id).some(l => l.type === k && LOCATION_PINS[l.id])).map(([k, t]) => `<button class="wx-key ${k}" aria-pressed="${P("t") === k}" data-action="set-param" data-k="t" data-v="${P("t") === k ? "" : k}">${icon(t.icon)}${esc(t.label)}</button>`).join("")}</div></div>
        ${wxChart(reg, sel && sel.id)}
        ${REGION_TO_MAP[reg.id] ? `<p class="wx-note">${icon("ph-info")}Pins show journal locations matched to a map marker. Faint dots are signposts. ${REGION_TO_MAP[reg.id] === "velen" ? "Velen and Novigrad share one map." : ""}</p>` : ""}
      </div>
      <aside class="wx-insp" aria-live="polite">${wxInspector(reg, sel)}</aside>
    </section>`
  : `<section class="wx-realm-grid">${REGIONS.map(x => { const ls = wxLocs(x.id), d = ls.filter(l => isChecked(l.id)).length;
      return `<button class="wx-tome" data-action="set-params" data-p='{"r":"${x.id}","sel":""}'>${art(x.art)}<div class="wx-tome-body"><div class="row between"><h3>${esc(x.name)}</h3>${wxRing(d, ls.length, 48)}</div>
        <p>${esc(x.blurb)}</p><div class="wx-tome-types">${Object.entries(LOCATION_TYPES).map(([k, t]) => { const n = ls.filter(l => l.type === k); return n.length ? `<span>${icon(t.icon)}<b class="mono">${n.filter(l => isChecked(l.id)).length}/${n.length}</b></span>` : ""; }).join("")}</div>
        <span class="wx-tome-meta mono">Lv ${esc(x.level)}${x.dlc ? " · " + esc(dlcLabel(x.dlc)) : ""}</span></div></button>`; }).join("")}</section>`}
  <section class="section" aria-labelledby="ledgerTitle">
    <h2 id="ledgerTitle" style="margin-bottom:12px">Field ledger${reg ? `: ${esc(reg.name)}` : ""}</h2>
    <div class="toolbar">
      ${searchField("q", "Search locations", "Name or hint, e.g. Crow's Perch")}
      ${selectField("t", "Type", typeOpts, P("t"))}
      ${switchField("hide", "Hide visited")}
      ${switchField("onmap", "On the map only")}
    </div>
    <div id="list" aria-live="polite">${VIEWS.world_list()}</div>
  </section>`;
};
VIEWS.world_list = () => {
  const r = P("r"), t = P("t"), q = P("q").toLowerCase(), hide = P("hide"), onmap = P("onmap"), sel = P("sel");
  const list = LOCATIONS.filter(l => (!r || l.region === r) && (!t || l.type === t) && (!hide || !isChecked(l.id)) && (!onmap || LOCATION_PINS[l.id]) && (!q || (l.name + " " + l.hint).toLowerCase().includes(q)));
  if(!list.length){
    if(r && !LOCATIONS.some(l => l.region === r)) return emptyState("ph-compass", "No locations recorded here yet", "This region has no verified journal locations yet. It is on the content backlog.");
    if(t === "nest") return emptyState("ph-skull", "No verified nest records yet", "Monster nest locations are on the content backlog. We list nothing rather than guess.");
    return emptyState("ph-map-pin", "No locations match", "Clear the search or pick another type or region.", `<button class="btn" data-action="clear-filters">Clear filters</button>`);
  }
  return `<p class="dim" style="font-size:.88rem;margin-bottom:8px">${list.length} location${list.length === 1 ? "" : "s"}</p>
  <div class="wx-cards">${list.map(l => { const lt = LOCATION_TYPES[l.type], on = isChecked(l.id);
    return `<article class="wx-card ${l.type} ${on ? "done" : ""} ${sel === l.id ? "sel" : ""}" data-row="${esc(l.id)}">
      <label class="wx-badge ${l.type}" title="${on ? "Visited" : "Mark visited"}"><input type="checkbox" data-check="${esc(l.id)}" ${on ? "checked" : ""} aria-label="Mark ${esc(l.name)} visited">${icon(on ? "ph-check" : lt.icon)}</label>
      <div class="wx-card-body"><button class="wx-card-name" data-action="wx-sel" data-id="${esc(l.id)}" data-r="${esc(l.region)}">${esc(l.name)}</button>
        <span class="wx-card-meta">${esc(lt.label)} · ${esc(regionName(l.region))}${LOCATION_PINS[l.id] ? ` · ${icon("ph-map-pin")}charted` : ""}</span>
        <p>${esc(l.hint)}</p></div>
      ${favBtn("loc", l.id, l.name)}
    </article>`; }).join("")}</div>`;
};
function wxSelect(id, r){
  const y = window.scrollY;
  const smooth = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  if(id && r){ setParams({r, sel:id}); render(true); $(".wx-stage")?.scrollIntoView({block:"start", behavior:smooth}); return; }
  setParams({sel: P("sel") === id ? "" : id}); render(true); window.scrollTo(0, y);
  const b = id && $(`.wx-pin[data-id="${CSS.escape(id)}"]`); if(b) b.focus({preventScroll:true});
}
</script>
