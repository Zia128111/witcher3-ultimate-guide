<script>
"use strict";
/* =====================================================================
   8i. TROPHY HALL (Collectibles and Achievements)
   Places of Power as sign runes per region, a treasure ledger counted
   live from found map markers, and achievement medals with the game's
   own icons (fandom wiki CDN; locked variants where the wiki has them).
   ===================================================================== */
const SIGN_META = {
  Aard:{icon:"ph-wind", color:"#6f9fd8"}, Igni:{icon:"ph-fire", color:"#d1573f"}, Yrden:{icon:"ph-hexagon", color:"#9a7ad0"},
  Quen:{icon:"ph-shield-star", color:"#d6a849"}, Axii:{icon:"ph-eye", color:"#6aa25c"}, "":{icon:"ph-sparkle", color:"#9a958a"}
};
const TREASURE_CATS = ["guarded", "hidden", "spoils", "smugglers"];
const MAP_ART = {white_orchard:"whiteorchard", velen:"velen", skellige:"skellige", kaer_morhen:"kaermorhen", toussaint:"toussaint"};
const popSign = l => (l.name.match(/^(Aard|Igni|Yrden|Quen|Axii)\b/) || ["", ""])[1];
const popPlace = l => (l.name.match(/\(([^)]+)\)/) || ["", l.name])[1];

VIEWS.collect = () => {
  const tab = P("tab") || "pop";
  const pops = LOCATIONS.filter(l => l.type === "pop"), pd = pops.filter(l => isChecked(l.id)).length;
  const tm = Object.values(MAP_MARKERS).flat().filter(m => TREASURE_CATS.includes(m.cat)), td = tm.filter(m => isChecked(m.id)).length;
  const ad = ACHIEVEMENTS.filter(a => isChecked(a.id)).length;
  return `
  <header class="page-head"><h1>Collectibles and Achievements</h1><p>Places of Power, the treasure you have looted across every map, and the achievements on your shelf.</p></header>
  <div class="qx-tabs" role="tablist">
    ${[["pop", "Places of Power", "ph-sparkle", `${pd}/${pops.length}`], ["treasure", "Treasure ledger", "ph-treasure-chest", `${td}/${tm.length}`], ["ach", "Trophy hall", "ph-trophy", `${ad}/${ACHIEVEMENTS.length}`]].map(([k, l, ic, n]) =>
      `<button class="qx-tab" role="tab" aria-selected="${tab === k}" data-action="set-param" data-k="tab" data-v="${k === "pop" ? "" : k}">${icon(ic)}<span>${l}</span><span class="mono">${n}</span></button>`).join("")}
  </div>
  ${tab === "treasure" ? ledgerHtml() : tab === "ach" ? hallHtml() : runesHtml()}`;
};
function runesHtml(){
  const pops = LOCATIONS.filter(l => l.type === "pop"), pd = pops.filter(l => isChecked(l.id)).length;
  const regs = REGIONS.filter(r => pops.some(l => l.region === r.id));
  return `<section class="cl-power">
    <div class="cl-power-head">
      <div><span class="label">Ability points from Places of Power</span><div class="cl-big mono">+${pd}<small> of ${pops.length} listed · 30 in game</small></div>
        <p class="muted" style="margin:6px 0 0;font-size:.92rem">Each stone grants 1 ability point the first time you draw from it, and again in New Game+.</p></div>
      <button class="btn btn-primary" data-action="cl-sendpop">${icon("ph-tree-structure")}Use ${pd} in skill planner</button>
    </div>
    <div class="cl-signs" aria-hidden="true">${Object.entries(SIGN_META).filter(([k]) => k).map(([k, s]) => `<span style="--sg:${s.color}">${icon(s.icon)}${k} <b class="mono">${pops.filter(l => popSign(l) === k && isChecked(l.id)).length}/${pops.filter(l => popSign(l) === k).length}</b></span>`).join("")}</div>
    ${regs.map(r => { const rp = pops.filter(l => l.region === r.id), d = rp.filter(l => isChecked(l.id)).length;
      return `<div class="cl-region"><div class="cl-region-head"><h3>${esc(r.name)}</h3><span class="mono dim">${d}/${rp.length}</span>${d === rp.length ? `<span class="tag tag-rare">${icon("ph-crown")}All claimed</span>` : ""}</div>
        <div class="cl-stones">${rp.map(l => { const sg = popSign(l), s = SIGN_META[sg], on = isChecked(l.id);
          return `<div class="cl-stone ${on ? "on" : ""}" style="--sg:${s.color}">
            <label class="cl-rune" title="${on ? "Claimed" : "Not claimed"}"><input type="checkbox" data-check="${esc(l.id)}" ${on ? "checked" : ""} aria-label="${esc(l.name)} claimed">${icon(s.icon)}</label>
            <div class="cl-stone-body"><b>${esc(popPlace(l))}</b><span>${sg ? sg : "Sign not confirmed"} · ${esc(l.hint)}</span>
              <div class="row" style="gap:6px;margin-top:6px">${LOCATION_PINS[l.id] ? `<button class="btn btn-sm" data-action="loc-map" data-id="${l.id}" data-i="0">${icon("ph-map-pin")}Map</button>` : `<span class="dim" style="font-size:.76rem">Not linked to a map pin</span>`}</div></div>
          </div>`; }).join("")}</div></div>`; }).join("")}
    <p class="src">Two Toussaint Places of Power and the one from Through Space and Time are not listed yet. ${srcLine(["gcPop", "witcherhour"]).replace(/^<p class="src">|<\/p>$/g, "")}</p>
  </section>`;
}
function ledgerHtml(){
  const named = LOCATIONS.filter(l => l.type === "treasure"), hunts = QUESTS.filter(q => q.type === "treasure");
  return `<div class="cl-ledger">${Object.keys(MAP_DEFS).map(mid => { const ms = MAP_MARKERS[mid].filter(m => TREASURE_CATS.includes(m.cat)), d = ms.filter(m => isChecked(m.id)).length;
      return `<article class="cl-chest">${art(MAP_ART[mid])}
        <div class="cl-chest-body"><div class="row between"><h3>${esc(MAP_DEFS[mid].name)}</h3><span class="mono">${d}/${ms.length}</span></div>
          <div class="cl-counts">${TREASURE_CATS.filter(c => ms.some(m => m.cat === c)).map(c => { const cs = ms.filter(m => m.cat === c), cd = cs.filter(m => isChecked(m.id)).length;
            return `<span class="cl-count ${cd === cs.length ? "full" : ""}">${icon(MAP_CATS[c].icon)}<span>${esc(MAP_CATS[c].label)}</span><b class="mono">${cd}/${cs.length}</b></span>`; }).join("")}</div>
          <a class="btn btn-sm" href="#/map?m=${mid}">${icon("ph-map-trifold")}Hunt on the map</a></div></article>`; }).join("")}</div>
    <p class="src" style="margin-top:8px">Counts come from the treasure markers you tick as found on the interactive map (witcher3map data).</p>
    <div class="two-col section">
      <section><h2 style="margin-bottom:12px">Named treasures</h2><div class="cl-named">${named.map(l => { const on = isChecked(l.id);
        return `<div class="cl-named-row ${on ? "on" : ""}"><label class="cl-rune small" style="--sg:#c8a456"><input type="checkbox" data-check="${esc(l.id)}" ${on ? "checked" : ""} aria-label="${esc(l.name)} found">${icon("ph-treasure-chest")}</label>
          <div><b>${esc(l.name)}</b><span>${esc(regionName(l.region))} · ${esc(l.hint)}</span></div>${LOCATION_PINS[l.id] ? `<button class="btn btn-sm btn-icon" data-action="loc-map" data-id="${l.id}" data-i="0" aria-label="Show on map">${icon("ph-map-pin")}</button>` : ""}</div>`; }).join("")}</div></section>
      <section><h2 style="margin-bottom:12px">Diagram hunts</h2><div class="cl-named">${hunts.map(q => { const on = isChecked(q.id);
        return `<div class="cl-named-row ${on ? "on" : ""}"><label class="cl-rune small" style="--sg:#5a86c9"><input type="checkbox" data-check="${esc(q.id)}" ${on ? "checked" : ""} aria-label="${esc(q.name)} complete">${icon("ph-scroll")}</label>
          <div><button class="linkish" data-open="quest:${q.id}">${esc(q.name)}</button><span>${esc(regionName(q.region))}${q.level ? " · Lv " + q.level : ""}</span></div></div>`; }).join("")}</div></section>
    </div>`;
}
function hallHtml(){
  const f = P("af");
  const groups = [["base", "The Witcher 3: Wild Hunt"], ["hos", "Hearts of Stone"], ["baw", "Blood and Wine"]];
  const keep = a => !f || (f === "missable" ? a.missable : f === "locked" ? !isChecked(a.id) : isChecked(a.id));
  return `${chipsHtml("af", [["", "All"], ["unlocked", "Unlocked"], ["locked", "Locked"], ["missable", "Missable"]], f, "Filter achievements")}
    ${groups.map(([g, title]) => { const all = ACHIEVEMENTS.filter(a => a.group === g), list = all.filter(keep), d = all.filter(a => isChecked(a.id)).length;
      if(!list.length) return "";
      return `<section class="cl-shelf"><div class="cl-shelf-head"><h2>${esc(title)}</h2><span class="mono dim">${d}/${all.length}</span></div>
        <div class="cl-medals">${list.map(a => { const on = isChecked(a.id), ic = ACH_ICON[a.id], src = ic ? (on ? ic.on : (ic.off || ic.on)) : null;
          return `<label class="cl-medal ${on ? "on" : ""} ${ic && !ic.off ? "mono-lock" : ""}">
            <input type="checkbox" data-check="${esc(a.id)}" ${on ? "checked" : ""} aria-label="${esc(a.name)} unlocked">
            <span class="cl-medal-img">${src ? `<img src="${wikiImg(src)}" alt="" loading="lazy" onload="this.classList.add('ok')" onerror="this.remove()">` : ""}${icon("ph-trophy")}</span>
            <b>${esc(a.name)}</b><span class="cl-medal-how">${esc(a.how)}</span>
            ${a.missable ? `<span class="cl-miss">${icon("ph-hourglass-medium")}Missable</span>` : ""}
            <span class="cl-medal-state">${on ? icon("ph-seal-check ph-fill") + "Unlocked" : "Locked"}</span>
          </label>`; }).join("")}</div></section>`; }).join("")}
    <p class="src">A selection of ${ACHIEVEMENTS.length} achievements from the wiki table. Missable flags come from third-party guides. Icons: The Witcher 3 via the Witcher fandom wiki.</p>`;
}
</script>
