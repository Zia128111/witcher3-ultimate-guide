<script>
"use strict";
/* =====================================================================
   8h. ALCHEMIST'S WORKBENCH
   Shelf of vials (real inventory icons from the fandom wiki CDN), a
   brewing ring for the selected recipe, and a satchel that totals the
   ingredients for everything queued. Monster mutagens and two decoctions
   have no icon on the wiki and show an emblem instead.
   ===================================================================== */
const ALC_KIND = {
  potion:{label:"Potions", one:"Potion", icon:"ph-flask", color:"#5a86c9"},
  decoction:{label:"Decoctions", one:"Decoction", icon:"ph-dna", color:"#6aa25c"},
  oil:{label:"Oils", one:"Blade oil", icon:"ph-drop-half", color:"#c8a456"},
  bomb:{label:"Bombs", one:"Bomb", icon:"ph-bomb", color:"#c4453a"},
  ingredients:{label:"Ingredients", one:"Ingredient", icon:"ph-plant", color:"#a5824a"}
};
const alcIcon = (key, w = 128, cls = "") => { const p = ALC_ICON[key]; return p ? `<img class="${cls}" src="${wikiImg(p, null)}" alt="" loading="lazy" decoding="async" onload="this.classList.add('ok')" onerror="this.remove()">` : ""; };
const ingIcon = name => alcIcon("i:" + name);
const recipeIcon = a => alcIcon("r:" + a.id);
const allIngredients = () => [...new Set(ALCHEMY.flatMap(a => a.ings.map(i => i[0])))].sort();
const usesOf = name => ALCHEMY.filter(a => a.ings.some(i => i[0] === name));
const vsMonsters = a => a.kind === "oil" ? MONSTERS.filter(m => m.oil === a.name) : MONSTERS.filter(m => m.bombs.includes(a.name) || m.potions.includes(a.name));

VIEWS.alchemy = () => {
  const kind = ALC_KIND[P("kind")] ? P("kind") : "potion";
  const sel = ALCHEMY.find(a => a.id === P("r"));
  const queued = Object.values(state.prep).reduce((x, n) => x + n, 0);
  return `
  <header class="page-head"><h1>Alchemy and Crafting</h1><p>Base recipes on the shelf, the brewing ring for each one, and a satchel that totals every ingredient you need before a hunt.</p></header>
  <div class="qx-tabs al-tabs" role="tablist">${Object.entries(ALC_KIND).map(([k, m]) => `<button class="qx-tab" role="tab" aria-selected="${k === kind}" style="--ac:${m.color}" data-action="set-params" data-p='${esc(JSON.stringify({kind:k, r:"", q:""}))}'>${icon(m.icon)}<span>${m.label}</span><span class="mono">${k === "ingredients" ? allIngredients().length : ALCHEMY.filter(a => a.kind === k).length}</span></button>`).join("")}</div>
  <div class="qx-stage">
    <div class="qx-main">
      <div class="al-meditate">${icon("ph-moon-stars")}<p><b>Refills while you meditate.</b> An hour of meditation with strong alcohol (White Gull, Alcohest or Dwarven Spirit) refills potions, decoctions and bombs. Beer and wine do not count; oils never need refilling.</p></div>
      ${kind === "ingredients" ? ingredientShelf() : `<div class="toolbar al-search">${searchField("q", "Search the shelf", "Recipe or ingredient")}</div><div id="list" aria-live="polite">${VIEWS.alchemy_list()}</div>`}
    </div>
    <aside class="qx-inspector al-bench" id="alBench" aria-live="polite">${kind === "ingredients" ? ingredientBench(P("ing")) : benchHtml(sel, kind)}</aside>
  </div>
  <section class="section al-satchel-wrap" aria-labelledby="satchelT">
    <div class="row between"><h2 id="satchelT">${icon("ph-backpack")} Satchel</h2><span class="mono dim">${queued} queued</span></div>
    <div class="al-satchel" id="prepBox">${prepHtml()}</div>
  </section>`;
};
VIEWS.alchemy_list = () => {
  const kind = ALC_KIND[P("kind")] && P("kind") !== "ingredients" ? P("kind") : "potion", q = P("q").toLowerCase(), selId = P("r");
  const list = ALCHEMY.filter(a => a.kind === kind && (!q || (a.name + " " + a.ings.map(i => i[0]).join(" ") + " " + (a.effect || "")).toLowerCase().includes(q)));
  if(!list.length) return emptyState("ph-flask", "Nothing on this shelf", "Try another ingredient name.", `<button class="btn" data-action="clear-filters">Clear filters</button>`);
  return `<div class="al-shelf" style="--ac:${ALC_KIND[kind].color}">${list.map(a => `<button class="al-vial ${selId === a.id ? "sel" : ""}" data-action="al-select" data-id="${a.id}" aria-label="${esc(a.name)}${state.prep[a.id] ? `, ${state.prep[a.id]} queued` : ""}">
      <span class="al-vial-glass">${recipeIcon(a)}<i class="ph ${ALC_KIND[a.kind].icon}" aria-hidden="true"></i></span>
      <span class="al-vial-name">${esc(a.name)}</span>
      <span class="al-vial-fx">${esc(a.effect || "")}</span>
      ${state.prep[a.id] ? `<span class="al-qty mono">×${state.prep[a.id]}</span>` : ""}${a.v === "unverified" ? `<span class="al-flag" title="Unverified recipe">${icon("ph-warning")}</span>` : ""}
    </button>`).join("")}</div>`;
};
function brewRing(center, ings, color){
  const n = ings.length, R = 104, C = 140;
  const pos = ings.map((g, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return {g, x:C + R * Math.cos(a), y:C + R * Math.sin(a)}; });
  return `<div class="al-ring" style="--ac:${color}" role="img" aria-label="Ingredients: ${esc(ings.map(([nm, q]) => q + " " + nm).join(", "))}">
    <svg viewBox="0 0 280 280" aria-hidden="true"><circle cx="${C}" cy="${C}" r="${R}" class="ring"/><circle cx="${C}" cy="${C}" r="${R - 30}" class="ring faint"/>
      ${pos.map(p => `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${C}" y2="${C}"/>`).join("")}</svg>
    <span class="al-ring-core">${center}</span>
    ${pos.map(p => `<button class="al-ring-ing" style="left:${(p.x / 280 * 100).toFixed(2)}%;top:${(p.y / 280 * 100).toFixed(2)}%" data-action="al-ing" data-id="${esc(p.g[0])}" aria-label="${p.g[1]} ${esc(p.g[0])}">
      ${ingIcon(p.g[0])}<i class="ph ${p.g[0].includes("Mutagen") ? "ph-dna" : "ph-leaf"}" aria-hidden="true"></i><b class="mono">${p.g[1]}</b><span>${esc(p.g[0])}</span></button>`).join("")}
  </div>`;
}
function benchHtml(a, kind){
  if(!a){
    const m = ALC_KIND[kind];
    return `<div class="qx-insp-empty">${icon(m.icon)}<h3>The workbench</h3><p class="muted">Choose ${m.label.toLowerCase()} from the shelf to see the brewing ring, where the formula is found and what it is good against.</p></div>`;
  }
  const m = ALC_KIND[a.kind], vs = vsMonsters(a), n = state.prep[a.id] || 0;
  return `<div class="al-bench-head"><span class="label" style="color:${m.color}">${esc(m.one)}</span><h3>${esc(a.name)}</h3>${a.effect ? `<p class="muted" style="margin:0">${esc(a.effect)}</p>` : ""}</div>
    ${brewRing(`${recipeIcon(a)}<i class="ph ${m.icon}" aria-hidden="true"></i>`, a.ings, m.color)}
    <div class="al-brew">
      <span>In satchel</span>
      <button class="btn btn-sm btn-icon" data-action="prep-dec" data-id="${a.id}" ${n ? "" : "disabled"} aria-label="One fewer ${esc(a.name)}">${icon("ph-minus")}</button>
      <span class="mono al-brew-n">${n}</span>
      <button class="btn btn-sm btn-icon" data-action="prep-add" data-id="${a.id}" aria-label="One more ${esc(a.name)}">${icon("ph-plus")}</button>
      ${favBtn("alchemy", a.id, a.name)}
    </div>
    <dl class="kv" style="margin-top:14px">${a.where ? `<dt>Formula</dt><dd>${esc(a.where)}</dd>` : `<dt>Formula</dt><dd class="dim">Location not recorded</dd>`}${a.target ? `<dt>Target</dt><dd>${esc(a.target)}</dd>` : ""}</dl>
    ${a.flag ? `<div class="notice" style="margin-top:12px">${icon("ph-warning")}<div>${esc(a.flag)}</div></div>` : ""}
    ${vs.length ? `<h4 class="sk-h4">Effective against</h4><div class="al-foes">${vs.map(x => `<button class="al-foe" data-open="monster:${x.id}">${x.img ? `<img src="${bxImg(x, 96)}" alt="" loading="lazy" onerror="this.remove()">` : icon("ph-skull")}<span>${esc(x.name)}</span></button>`).join("")}</div>` : ""}
    <div class="row" style="margin-top:12px">${vTag(a.v)}</div>${srcLine(a.src)}`;
}
function ingredientShelf(){
  const q = P("q").toLowerCase(), sel = P("ing");
  const list = allIngredients().filter(n => !q || n.toLowerCase().includes(q));
  return `<div class="toolbar al-search">${searchField("q", "Search ingredients", "e.g. Celandine")}</div>
    <div class="al-shelf ing" style="--ac:${ALC_KIND.ingredients.color}">${list.map(n => { const u = usesOf(n);
      return `<button class="al-vial ${sel === n ? "sel" : ""}" data-action="al-ing" data-id="${esc(n)}"><span class="al-vial-glass">${ingIcon(n)}<i class="ph ${n.includes("Mutagen") ? "ph-dna" : "ph-leaf"}" aria-hidden="true"></i></span>
        <span class="al-vial-name">${esc(n)}</span><span class="al-vial-fx">Used in ${u.length} recipe${u.length === 1 ? "" : "s"}</span></button>`; }).join("")}</div>`;
}
function ingredientBench(name){
  if(!name || !allIngredients().includes(name)) return `<div class="qx-insp-empty">${icon("ph-plant")}<h3>Ingredients</h3><p class="muted">Choose an ingredient to see where it grows or drops and which recipes use it.</p></div>`;
  const info = INGREDIENTS.find(i => i.name === name || name.startsWith(i.name)), uses = usesOf(name);
  return `<div class="al-ing-hero"><span class="al-vial-glass big">${ingIcon(name)}<i class="ph ${name.includes("Mutagen") ? "ph-dna" : "ph-leaf"}" aria-hidden="true"></i></span><div><span class="label">Ingredient</span><h3>${esc(name)}</h3></div></div>
    <dl class="kv"><dt>Where</dt><dd>${info ? esc(info.where) : '<span class="dim">Not recorded in this guide yet</span>'}</dd></dl>
    <h4 class="sk-h4">Used in</h4><div class="al-uses">${uses.map(a => `<button class="al-use" data-action="al-goto" data-id="${a.id}">${recipeIcon(a)}<span><b>${esc(a.name)}</b><span class="dim">${a.ings.find(i => i[0] === name)[1]}× · ${esc(ALC_KIND[a.kind].one)}</span></span></button>`).join("")}</div>`;
}
function prepTotals(){
  const tot = {};
  for(const id in state.prep){ const a = ALCHEMY.find(x => x.id === id); if(!a) continue; a.ings.forEach(([n, q]) => tot[n] = (tot[n] || 0) + q * state.prep[id]); }
  return tot;
}
function prepHtml(){
  const ids = Object.keys(state.prep);
  if(!ids.length) return `<div class="al-satchel-empty">${icon("ph-backpack")}<p>Your satchel is empty. Add recipes from the workbench, or use "Add kit to prep list" on a bestiary page.</p></div>`;
  const tot = prepTotals(), names = Object.keys(tot).sort(), got = names.filter(n => state.prepDone[n]).length;
  return `<div class="al-sat-grid">
    <div><div class="row between"><span class="label">Brewing</span><button class="btn btn-ghost btn-sm" data-action="prep-clear">${icon("ph-trash")}Empty satchel</button></div>
      <div class="al-sat-list">${ids.map(id => { const a = ALCHEMY.find(x => x.id === id); return `<div class="al-sat-row"><span class="al-mini">${recipeIcon(a)}<i class="ph ${ALC_KIND[a.kind].icon}" aria-hidden="true"></i></span><button class="linkish" data-action="al-goto" data-id="${id}">${esc(a.name)}</button>
        <span class="row" style="gap:4px;margin-left:auto"><button class="btn btn-sm btn-icon" data-action="prep-dec" data-id="${id}" aria-label="One fewer ${esc(a.name)}">${icon("ph-minus")}</button><span class="mono" style="width:24px;text-align:center">${state.prep[id]}</span><button class="btn btn-sm btn-icon" data-action="prep-inc" data-id="${id}" aria-label="One more ${esc(a.name)}">${icon("ph-plus")}</button></span></div>`; }).join("")}</div></div>
    <div><div class="row between"><span class="label">To gather</span><span class="mono dim">${got}/${names.length}</span></div>
      <div class="al-gather">${names.map(n => `<label class="al-gem ${state.prepDone[n] ? "got" : ""}"><input type="checkbox" data-prep-done="${esc(n)}" ${state.prepDone[n] ? "checked" : ""}><span class="al-mini">${ingIcon(n)}<i class="ph ${n.includes("Mutagen") ? "ph-dna" : "ph-leaf"}" aria-hidden="true"></i></span><span><b class="mono">${tot[n]}×</b> ${esc(n)}</span></label>`).join("")}</div></div>
  </div>`;
}
function alRefresh(){
  if(route.name !== "alchemy"){ const box = $("#prepBox"); if(box) box.innerHTML = prepHtml(); return; }
  const ae = document.activeElement, y = window.scrollY;
  const sel = ae && ae.dataset && ae.dataset.action && ae.dataset.id ? `[data-action="${ae.dataset.action}"][data-id="${CSS.escape(ae.dataset.id)}"]` : ae && ae.dataset && ae.dataset.prepDone ? `[data-prep-done="${CSS.escape(ae.dataset.prepDone)}"]` : null;
  render(true); window.scrollTo(0, y);
  if(sel){ const el = $(sel); if(el && !el.disabled) el.focus({preventScroll:true}); }
}
function alSelect(id){
  setParams({r:id});
  const box = $("#alBench"); if(box) box.innerHTML = benchHtml(ALCHEMY.find(a => a.id === id), P("kind") || "potion");
  $$(".al-vial.sel").forEach(b => b.classList.remove("sel")); $(`.al-vial[data-id="${CSS.escape(id)}"]`)?.classList.add("sel");
  if(box && matchMedia("(max-width:1100px)").matches) box.scrollIntoView({behavior: state.settings.reduceMotion ? "auto" : "smooth", block:"start"});
}
function alIng(name){
  if((P("kind") || "potion") !== "ingredients"){ go("alchemy", {kind:"ingredients", ing:name}); return; }
  setParams({ing:name});
  const box = $("#alBench"); if(box) box.innerHTML = ingredientBench(name);
  $$(".al-vial.sel").forEach(b => b.classList.remove("sel")); $(`.al-vial[data-id="${CSS.escape(name)}"]`)?.classList.add("sel");
}
function alGoto(id){ const a = ALCHEMY.find(x => x.id === id); if(a) go("alchemy", {kind:a.kind, r:id}); }
</script>
