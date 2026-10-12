<script>
"use strict";
/* =====================================================================
   8d. BESTIARY CODEX
   Index rail + specimen plate. The weakness wheel and hunt kit are drawn
   straight from each MONSTERS record (in-game bestiary data via
   Fextralife); nothing is inferred. Study marks live in state.checks as
   "beast:<id>".
   ===================================================================== */
const SIGNS = [
  {name:"Aard", icon:"ph-wind"}, {name:"Igni", icon:"ph-fire"}, {name:"Yrden", icon:"ph-hexagon"},
  {name:"Quen", icon:"ph-shield-star"}, {name:"Axii", icon:"ph-eye"}
];
const CAT_META = {
  "Beasts":{icon:"ph-paw-print", note:"Wild animals. Dangerous in packs."},
  "Cursed Ones":{icon:"ph-moon-stars", note:"Born of curses; some can be lifted."},
  "Draconids":{icon:"ph-feather", note:"Winged reptiles. Bring them down to the ground."},
  "Elementa":{icon:"ph-mountains", note:"Magical constructs bound to an element."},
  "Hybrids":{icon:"ph-bird", note:"Part beast, part bird or woman."},
  "Insectoids":{icon:"ph-bug", note:"Armored, often venomous swarms."},
  "Necrophages":{icon:"ph-skull", note:"Corpse-eaters that gather where the dead lie."},
  "Ogroids":{icon:"ph-hand-fist", note:"Brutes with great strength and thick hides."},
  "Relicts":{icon:"ph-tree", note:"Ancient beings from before the Conjunction."},
  "Specters":{icon:"ph-ghost", note:"Spirits bound to a place or a wrong."},
  "Vampires":{icon:"ph-drop", note:"Blood-drinkers, lesser and higher."}
};
/* Only monsters with a matching Witcher 3 wallpaper get art; the rest use their category emblem. */
const MONSTER_ART = {fiend:"bestiary", leshen:"collect", griffin:"whiteorchard", golem:"golem", "earth-elemental":"golem"};
const beastKey = id => "beast:" + id;
/* Monster renders hotlinked from the fandom wiki CDN at a scaled width; the category emblem shows until load and on error. */
const bxImg = (m, w) => `https://static.wikia.nocookie.net/witcher/images/${m.img}/revision/latest/scale-to-width-down/${w}`;
const bxPic = (m, w, cls = "") => m.img ? `<img class="bx-pic ${cls}" src="${bxImg(m, w)}" alt="" loading="lazy" decoding="async" onload="this.parentNode.classList.add('img-ok')" onerror="this.remove()">` : "";
const recipeByName = name => ALCHEMY.find(a => a.name === name);
function monsterContracts(m){
  // Whole-word match on the full name, falling back to a distinctive last word ("Ice Giant" -> "giant").
  const key = m.name.split(" (")[0].toLowerCase(), last = key.split(" ").pop();
  const word = w => new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
  return QUESTS.filter(q => q.type === "contract" && q.target && (word(key).test(q.target) || (last.length > 4 && word(last).test(q.target))));
}
function huntKit(m){
  const out = [];
  if(m.oil) out.push({kind:"Oil", name:m.oil, icon:"ph-drop-half"});
  m.bombs.forEach(b => out.push({kind:"Bomb", name:b, icon:"ph-bomb"}));
  m.potions.forEach(p => out.push({kind:"Potion", name:p, icon:"ph-flask"}));
  return out.map(k => Object.assign(k, {recipe: recipeByName(k.name)}));
}

VIEWS.bestiary = () => {
  const cat = P("cat"), sign = P("sign");
  const sel = MONSTERS.find(m => m.id === P("m")) || null;
  const studied = MONSTERS.filter(m => isChecked(beastKey(m.id))).length;
  return `
  <header class="page-head"><h1>Bestiary</h1>
    <p>A hunter's codex of ${MONSTERS.length} monsters: what each one fears, what to brew before the fight, and where the contracts are.</p></header>
  <div class="bx-shell">
    <aside class="bx-index" aria-label="Codex index">
      <div class="bx-progress"><div><span class="label">Studied</span><div class="pct" style="font-size:1.6rem;margin-top:4px">${studied}<small>/ ${MONSTERS.length}</small></div></div>${meter(pct(studied, MONSTERS.length), studied === MONSTERS.length)}</div>
      <div class="bx-cats" role="group" aria-label="Category">
        <button class="bx-cat" aria-pressed="${!cat}" data-action="set-param" data-k="cat" data-v="">${icon("ph-books")}<span>All</span><span class="mono">${MONSTERS.length}</span></button>
        ${CATS.map(c => `<button class="bx-cat" aria-pressed="${cat === c}" data-action="set-param" data-k="cat" data-v="${esc(c)}">${icon(CAT_META[c].icon)}<span>${esc(c)}</span><span class="mono">${MONSTERS.filter(m => m.cat === c).length}</span></button>`).join("")}
      </div>
      <label class="field" style="margin-top:14px"><span>Search the codex</span><span class="input-wrap">${icon("ph-magnifying-glass")}<input class="input" type="search" data-filter="q" value="${esc(P("q"))}" placeholder="Name, oil, bomb"></span></label>
      <div class="bx-signs" role="group" aria-label="Filter by Sign weakness">${SIGNS.map(s => `<button class="bx-sign tooltip" data-tip="Weak to ${s.name}" aria-pressed="${sign === s.name}" aria-label="Weak to ${s.name}" data-action="set-param" data-k="sign" data-v="${sign === s.name ? "" : s.name}">${icon(s.icon)}</button>`).join("")}</div>
      <div id="list" class="bx-list" aria-live="polite">${VIEWS.bestiary_list()}</div>
    </aside>
    <section class="bx-plate-wrap" id="bxPlate" aria-live="polite">${sel ? plateHtml(sel) : plateEmpty(cat)}</section>
  </div>`;
};
VIEWS.bestiary_list = () => {
  const cat = P("cat"), q = P("q").toLowerCase(), sign = P("sign"), selId = P("m");
  const list = MONSTERS.filter(m => (!cat || m.cat === cat) && (!sign || m.signs.includes(sign))
    && (!q || [m.name, m.cat, m.oil, ...m.signs, ...m.bombs, ...m.potions].join(" ").toLowerCase().includes(q)));
  if(!list.length) return emptyState("ph-skull", "Nothing in the codex", "No monster matches these filters.", `<button class="btn btn-sm" data-action="clear-filters">Clear filters</button>`);
  return list.map(m => `<button class="bx-row ${selId === m.id ? "sel" : ""} ${isChecked(beastKey(m.id)) ? "studied" : ""}" data-action="bx-select" data-id="${m.id}" aria-current="${selId === m.id}">
      <span class="bx-emblem">${bxPic(m, 96)}${icon(CAT_META[m.cat].icon)}</span>
      <span class="bx-row-main"><span class="bx-row-name">${esc(m.name)}</span><span class="bx-row-sub">${esc(m.cat)}${m.dlc ? " · " + esc(dlcLabel(m.dlc)) : ""}</span></span>
      <span class="bx-glyphs" aria-label="Weak to ${m.signs.length ? esc(m.signs.join(", ")) : "no listed Sign"}">${SIGNS.map(s => `<i class="ph ${s.icon} ${m.signs.includes(s.name) ? "on" : ""}" aria-hidden="true"></i>`).join("")}</span>
      ${isChecked(beastKey(m.id)) ? `<i class="ph ph-seal-check bx-seal" aria-hidden="true"></i>` : ""}
    </button>`).join("");
};
function plateEmpty(cat){
  const c = cat && CAT_META[cat];
  return `<div class="bx-plate bx-empty">
    <div class="bx-emblem big">${icon(c ? c.icon : "ph-books")}</div>
    <h2>${c ? esc(cat) : "Choose a specimen"}</h2>
    <p class="muted">${c ? esc(c.note) + " " : ""}Select a monster from the codex to see its weaknesses, the hunt kit to prepare and related contracts.</p>
    ${(() => { const pool = MONSTERS.filter(x => x.img && x.id !== "archespore" && (!cat || x.cat === cat)).slice(0, 7); return pool.length ? `<div class="bx-parade" aria-hidden="true">${pool.map(x => `<span>${bxPic(x, 160)}</span>`).join("")}</div>` : ""; })()}
    <div class="bx-legend"><span>${icon("ph-circle-fill")} Lit Sign: listed weakness</span><span>${icon("ph-seal-check")} Studied</span></div>
  </div>`;
}
function plateHtml(m){
  const c = CAT_META[m.cat], kit = huntKit(m), contracts = monsterContracts(m), studied = isChecked(beastKey(m.id));
  const artKey = MONSTER_ART[m.id];
  // Weakness wheel: 5 Sign stations around the specimen emblem.
  const R = 104, C = 140;
  const pos = SIGNS.map((s, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return {s, x:C + R * Math.cos(a), y:C + R * Math.sin(a), on:m.signs.includes(s.name)}; });
  const wheel = `<div class="bx-wheel" role="img" aria-label="Sign weaknesses: ${m.signs.length ? esc(m.signs.join(", ")) : "none listed"}">
    <svg viewBox="0 0 280 280" aria-hidden="true">
      <circle cx="${C}" cy="${C}" r="${R}" class="ring"/><circle cx="${C}" cy="${C}" r="${R - 26}" class="ring faint"/>
      ${pos.map(p => `<line x1="${C}" y1="${C}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" class="${p.on ? "on" : ""}"/>`).join("")}
    </svg>
    <span class="bx-wheel-core">${bxPic(m, 200)}${icon(c.icon)}</span>
    ${pos.map(p => `<span class="bx-wheel-sign ${p.on ? "on" : ""}" style="left:${(p.x / 280 * 100).toFixed(2)}%;top:${(p.y / 280 * 100).toFixed(2)}%">${icon(p.s.icon)}<b>${p.s.name}</b></span>`).join("")}
  </div>`;
  return `<article class="bx-plate">
    <header class="bx-head ${artKey ? "has-art" : ""}">
      ${artKey ? art(artKey) : `<div class="bx-head-emblem" aria-hidden="true">${icon(c.icon)}</div>`}
      ${m.img ? `<div class="bx-specimen ${m.id === "archespore" ? "icon" : ""}">${bxPic(m, 520)}</div>` : ""}
      <div class="bx-head-copy">
        <span class="label">${esc(m.cat)}${m.dlc ? " · " + esc(dlcLabel(m.dlc)) : ""}</span>
        <h2>${esc(m.name)}</h2>
        <div class="row" style="gap:8px;margin-top:10px">
          <label class="bx-study ${studied ? "on" : ""}"><input type="checkbox" data-check="${beastKey(m.id)}" ${studied ? "checked" : ""}>${icon(studied ? "ph-seal-check" : "ph-seal")}<span>${studied ? "Studied" : "Mark as studied"}</span></label>
          ${favBtn("monster", m.id, m.name, false)}
          <button class="btn btn-ghost btn-icon btn-sm" data-action="bx-close" aria-label="Close specimen" style="margin-left:auto">${icon("ph-x")}</button>
        </div>
      </div>
    </header>
    <div class="bx-body">
      <section class="bx-sec"><h3>Weaknesses</h3>${wheel}
        <p class="src" style="text-align:center;margin:6px 0 0">${m.signs.length ? `Weak to ${esc(m.signs.join(" and "))}.` : "No Sign weakness listed in the bestiary."}</p></section>
      <section class="bx-sec"><h3>Hunt kit</h3>
        ${kit.length ? `<div class="bx-kit">${kit.map(k => `<button class="bx-socket" ${k.recipe ? `data-open="alchemy:${k.recipe.id}"` : "disabled"}>
            <span class="bx-socket-ico">${icon(k.icon)}</span><span><span class="label" style="font-size:.64rem">${k.kind}</span><span class="bx-socket-name">${esc(k.name)}</span>
            <span class="bx-socket-sub">${k.recipe ? k.recipe.ings.map(i => `${i[1]}× ${esc(i[0])}`).join(", ") : "Recipe not in this guide yet"}</span></span></button>`).join("")}</div>
          <button class="btn btn-primary" data-action="bx-kit" data-id="${m.id}" style="margin-top:12px" ${kit.some(k => k.recipe) ? "" : "disabled"}>${icon("ph-list-plus")}Add kit to prep list</button>`
          : `<p class="muted">No oil, bomb or potion is listed for this monster.</p>`}
      </section>
      <section class="bx-sec bx-note"><h3>${icon("ph-feather")}Hunter's notes</h3>
        ${m.tip ? `<p>${esc(m.tip)}</p>` : `<p class="muted">No verified tactic recorded yet. ${esc(c.note)}</p>`}
        ${m.loot ? `<p><span class="label">Loot</span><br>${esc(m.loot)}</p>` : ""}
        ${m.flag ? `<p class="src">${icon("ph-warning")} ${esc(m.flag)}</p>` : ""}
      </section>
      <section class="bx-sec"><h3>Where to hunt</h3>
        ${m.regions.length ? `<div class="chips">${m.regions.map(r => `<a class="chip" href="#/world?r=${esc(r)}">${icon("ph-map-pin")}${esc(regionName(r))}</a>`).join("")}</div>` : `<p class="muted" style="margin:0">Regions not recorded for this monster yet.</p>`}
        ${contracts.length ? `<h4 style="margin:16px 0 8px">Contracts</h4><div class="list">${contracts.map(q => `<div class="item ${isChecked(q.id) ? "done" : ""}" data-row="${esc(q.id)}">${checkbox(q.id, "Mark " + q.name + " complete")}<div><div class="item-title"><button data-open="quest:${esc(q.id)}">${esc(q.name)}</button></div><div class="item-meta"><span>${esc(q.target)}</span>${q.level ? `<span class="mono">Lv ${q.level}</span>` : ""}<span>${esc(regionName(q.region))}</span></div></div><span></span></div>`).join("")}</div>` : ""}
      </section>
    </div>
    <footer class="bx-foot"><span class="row" style="gap:8px">${vTag(m.v)}${m.srcUrl ? `<a class="src" href="${esc(m.srcUrl)}" target="_blank" rel="noopener noreferrer">Fextralife page</a>` : ""}</span>${srcLine(m.src)}</footer>
  </article>`;
}
function bxSelect(id){
  setParams({m:id || ""});
  const plate = $("#bxPlate"); if(!plate) return;
  const m = MONSTERS.find(x => x.id === id);
  plate.innerHTML = m ? plateHtml(m) : plateEmpty(P("cat"));
  $$(".bx-row").forEach(r => { const on = r.dataset.id === id; r.classList.toggle("sel", on); r.setAttribute("aria-current", on); });
  if(m && matchMedia("(max-width:1100px)").matches) plate.scrollIntoView({behavior: state.settings.reduceMotion ? "auto" : "smooth", block:"start"});
}
function bxAddKit(id){
  const m = MONSTERS.find(x => x.id === id); if(!m) return;
  const got = huntKit(m).filter(k => k.recipe);
  got.forEach(k => { state.prep[k.recipe.id] = Math.min(99, (state.prep[k.recipe.id] || 0) + 1); });
  save();
  toast(`${got.length} recipe${got.length === 1 ? "" : "s"} for the ${m.name} added to your prep list.`);
}
</script>
