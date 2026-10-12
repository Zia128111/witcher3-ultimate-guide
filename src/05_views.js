<script>
"use strict";
/* =====================================================================
   8. RENDERING: VIEWS
   Each view returns HTML. Views with live filters expose VIEWS.x_list()
   so typing re-renders only the results, not the whole page.
   ===================================================================== */
const tabsHtml = (key, items, cur) => `<div class="tabs" role="tablist">${items.map(([v, l, n]) =>
  `<button class="tab" role="tab" aria-selected="${cur === v}" data-action="set-param" data-k="${key}" data-v="${esc(v)}">${esc(l)}${n != null ? `<span class="n">${n}</span>` : ""}</button>`).join("")}</div>`;
const chipsHtml = (key, items, cur, label) => `<div class="chips" role="group" aria-label="${esc(label)}">${items.map(([v, l, n]) =>
  `<button class="chip" aria-pressed="${cur === v}" data-action="set-param" data-k="${key}" data-v="${esc(v)}">${esc(l)}${n != null ? `<span class="n">${n}</span>` : ""}</button>`).join("")}</div>`;
const searchField = (key, label, ph) => `<label class="field grow"><span>${esc(label)}</span><span class="input-wrap">${icon("ph-magnifying-glass")}<input class="input" type="search" data-filter="${key}" value="${esc(P(key))}" placeholder="${esc(ph)}"></span></label>`;
const selectField = (key, label, opts, cur) => `<label class="field"><span>${esc(label)}</span><select class="select" data-filter="${key}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${cur === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
const switchField = (key, label) => `<label class="row" style="gap:10px;height:40px"><input type="checkbox" class="switch" data-filter="${key}" ${P(key) ? "checked" : ""}><span class="muted">${esc(label)}</span></label>`;
const meter = (p, rare) => `<div class="meter ${rare ? "rare" : ""}" role="presentation"><i style="width:${p}%"></i></div>`;

function computeProgress(){
  const c = arr => arr.filter(x => isChecked(x.id)).length;
  const main = QUESTS.filter(q => q.type === "main");
  const side = QUESTS.filter(q => q.type !== "main");
  const pops = LOCATIONS.filter(l => l.type === "pop");
  const tiers = []; GEAR_SETS.forEach(g => Object.keys(g.levels).forEach(t => tiers.push({id:`gear:${g.id}:${t}`})));
  return [
    {key:"main", label:"Main quests", done:c(main), total:main.length, route:"quests?type=main"},
    {key:"side", label:"Other quests", done:c(side), total:side.length, route:"quests"},
    {key:"pop", label:"Places of Power", done:c(pops), total:pops.length, route:"collect"},
    {key:"loc", label:"Locations visited", done:c(LOCATIONS), total:LOCATIONS.length, route:"world"},
    {key:"gwent", label:"Gwent cards", done:GWENT_CARDS.filter(c => !c.token && state.gwent.owned[c.id]).length, total:GWENT_CARDS.filter(c => !c.token).length, route:"gwent"},
    {key:"ach", label:"Achievements", done:c(ACHIEVEMENTS), total:ACHIEVEMENTS.length, route:"collect?tab=ach"},
    {key:"gear", label:"Witcher gear tiers", done:c(tiers), total:tiers.length, route:"gear"},
    {key:"beast", label:"Monsters studied", done:MONSTERS.filter(m => isChecked("beast:" + m.id)).length, total:MONSTERS.length, route:"bestiary"},
    {key:"map", label:"Map markers found", done:Object.keys(state.checks).filter(k => k.startsWith("m:")).length, total:Object.values(MAP_MARKERS).reduce((a, m) => a + m.length, 0), route:"map"}
  ];
}
function completionGrid(){
  return `<div class="comp-list">${computeProgress().map(p => { const v = pct(p.done, p.total); return `<a href="#/${p.route}" style="text-decoration:none;color:inherit">
    <div class="lbl"><span>${esc(p.label)}</span><span class="mono dim">${p.done}/${p.total}</span></div>
    <div class="pct">${v}<small>%</small></div>${meter(v, v === 100)}</a>`; }).join("")}</div>`;
}

/* Home: see section 8m. */
function timeAgo(t){
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if(s < 60) return "just now"; const m = Math.round(s / 60); if(m < 60) return m + "m ago";
  const h = Math.round(m / 60); if(h < 48) return h + "h ago"; return Math.round(h / 24) + "d ago";
}

/* World Explorer: see section 8l. */

/* ---------- Quests ---------- */
/* Quests view: see section 8f. questRow is kept for other pages. */
function questRow(x){
  const t = QUEST_TYPES[x.type];
  return `<div class="item ${isChecked(x.id) ? "done" : ""}" data-row="${esc(x.id)}">
    ${checkbox(x.id, "Mark " + x.name + " complete")}
    <div><div class="item-title"><button data-open="quest:${esc(x.id)}">${esc(x.name)}</button></div>
      <div class="item-meta"><span class="row" style="gap:5px">${icon(t.icon)}${esc(t.label)}</span><span>${esc(regionName(x.region))}</span>${x.level ? `<span class="mono">Lv ${x.level}</span>` : ""}${x.target ? `<span>${esc(x.target)}</span>` : ""}${x.missable ? '<span class="tag tag-warn">Missable</span>' : ""}${x.v === "unverified" ? vTag("unverified") : ""}</div></div>
    ${favBtn("quest", x.id, x.name)}</div>`;
}

/* Builds library and planner page: see section 8o. */

/* Planner: see section 8c. */

/* Gear: see section 8g. */

/* Bestiary: see section 8d. */

/* Alchemy: see section 8h. */

/* Money: see section 8j. */

/* Gwent: see section 8e. */

/* Collectibles: see section 8i. */

/* DLC and New Game+: see section 8k. */

/* My Journal: see section 8n. */

/* ---------- Sources and data status ---------- */
VIEWS.sources = () => {
  const sets = [["Locations", LOCATIONS], ["Quests", QUESTS], ["Monsters", MONSTERS], ["Recipes", ALCHEMY], ["Gwent cards", GWENT_CARDS], ["Witcher sets", GEAR_SETS], ["Weapons", WEAPONS], ["Achievements", ACHIEVEMENTS]];
  return `
  <header class="page-head"><h1>Sources and Data</h1><p>What this guide covers, where each fact comes from, and what is still missing. The dataset is a scoped starter set, not a complete encyclopedia.</p></header>
  <div class="table-wrap"><table><thead><tr><th scope="col">Dataset</th><th scope="col">Records</th><th scope="col">Wiki-sourced</th><th scope="col">Community guide</th><th scope="col">Unverified</th></tr></thead><tbody>
    ${sets.map(([n, a]) => `<tr><td>${esc(n)}</td><td class="mono">${a.length}</td><td class="mono">${a.filter(x => x.v === "wiki").length}</td><td class="mono">${a.filter(x => x.v === "guide").length}</td><td class="mono">${a.filter(x => x.v === "unverified").length}</td></tr>`).join("")}
    <tr><td>Map markers (witcher3map)</td><td class="mono">${Object.values(MAP_MARKERS).reduce((a, m) => a + m.length, 0)}</td><td class="mono">0</td><td class="mono">${Object.values(MAP_MARKERS).reduce((a, m) => a + m.length, 0)}</td><td class="mono">0</td></tr>
    <tr><td>Skills (Remastered)</td><td class="mono">${Object.keys(allSkills()).length}</td><td class="mono">${Object.keys(allSkills()).length}</td><td class="mono">0</td><td class="mono">0</td></tr>
  </tbody></table></div>
  <div class="two-col section">
    <section><h2 style="margin-bottom:12px">Known gaps</h2><ul class="clean">
      <li>Map markers come from the witcher3map project (last updated 2016) and are not independently verified. ${Object.keys(LOCATION_PINS).length} of ${LOCATIONS.length} journal locations are linked to markers; the rest had no confident one-to-one match.</li>
      <li>Monster nests, most merchants and per-region signpost lists are incomplete.</li>
      <li>Walkthroughs cover ${QUESTS.filter(q => q.steps).length} of ${QUESTS.length} quests (paraphrased from Fextralife, fandom for a few).</li>
      <li>Gwent lists every card from the wiki deck pages; Hemdall, the Bovine Defense Force and Roach are shown as tokens, not collectibles.</li>
      <li>Crafting material lists, item stats and crown amounts are deliberately omitted.</li>
      <li>The skill tree drawing is this guide's own layout; the connections and rank text are from the wiki. The hit forecast is a simplified estimate.</li>
      <li>Enhanced and superior recipe tiers are not listed.</li>
    </ul></section>
    <section><h2 style="margin-bottom:12px">Sources</h2><ul class="clean">${Object.values(SOURCES).filter(s => s.url).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a></li>`).join("")}</ul></section>
  </div>
  <section class="section"><h2>Map tiles and markers</h2><p class="muted prose" style="margin-top:10px">The interactive map uses tiles and marker data from <a href="https://github.com/witcher3map/witcher3map" target="_blank" rel="noopener noreferrer">witcher3map</a> by untamed0 and contributors, licensed CC BY-NC-SA 4.0. The tiles were extracted from the game, and the map art belongs to CD PROJEKT RED. Tiles load from the project's public GitHub repository, with jsDelivr as a fallback.</p></section>
  <section class="section"><h2>Artwork</h2><p class="muted prose" style="margin-top:10px">Witcher 3 wallpapers are loaded from wallpapercave.com for personal, non-commercial use and remain the property of CD PROJEKT RED. If they fail to load, Unsplash-licensed photos from picsum.photos are used instead, then a plain gradient.</p></section>`;
};
</script>
