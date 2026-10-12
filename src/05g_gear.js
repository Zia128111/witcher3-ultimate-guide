<script>
"use strict";
/* =====================================================================
   8g. ARMORY
   School crests, an armor stand with the upgrade path drawn as connected
   tier medallions, a weapon rack and a craftsmen ladder. Images are
   hotlinked from the Witcher fandom wiki CDN (inventory icons, set renders
   and school-gear quest screenshots); the emblem shows if one fails.
   ===================================================================== */
const SCHOOL_META = {
  feline:{color:"#c8a456", icon:"ph-cat", short:"Feline"}, griffin:{color:"#5a86c9", icon:"ph-bird", short:"Griffin"},
  ursine:{color:"#a0663f", icon:"ph-paw-print", short:"Ursine"}, wolven:{color:"#9aa3ad", icon:"ph-dog", short:"Wolven"},
  manticore:{color:"#b1332c", icon:"ph-bug-beetle", short:"Manticore"}, viper:{color:"#6aa25c", icon:"ph-wave-sine", short:"Viper"}
};
const TIER_LABEL = {basic:"Basic", enhanced:"Enhanced", superior:"Superior", mastercrafted:"Mastercrafted", grandmaster:"Grandmaster", single:"Set"};
const TIER_SMITH = {
  basic:{who:"Any journeyman armorer or blacksmith", pins:[]},
  enhanced:{who:"Craftsman tier not confirmed in our sources", pins:[]},
  superior:{who:"Craftsman tier not confirmed in our sources", pins:[]},
  mastercrafted:{who:"A master: Yoana (armor) or Eibhear Hattori (swords)", pins:["ve-yoana", "no-hattori"]},
  grandmaster:{who:"Lazare Lafargue in Toussaint (Blood and Wine)", pins:["to-lafargue"]},
  single:{who:"Diagrams from the Hearts of Stone quests listed below", pins:[]}
};
const wikiImg = (p, w) => `https://static.wikia.nocookie.net/witcher/images/${p}/revision/latest${w ? "/scale-to-width-down/" + w : ""}`;
const gImg = (p, w, cls = "", alt = "") => p ? `<img class="${cls}" src="${wikiImg(p, w)}" alt="${esc(alt)}" loading="lazy" decoding="async" onload="this.classList.add('ok')" onerror="this.remove()">` : "";

VIEWS.gear = () => {
  const tab = P("tab");
  const tiersAll = GEAR_SETS.flatMap(g => setTiers(g).map(t => `gear:${g.id}:${t}`)), td = tiersAll.filter(isChecked).length;
  const wd = WEAPONS.filter(w => isChecked("own:" + w.id)).length;
  return `
  <header class="page-head"><h1>Gear and Equipment</h1><p>Witcher school sets and their upgrade paths, the notable weapons and crossbows, and who can forge what.</p></header>
  <div class="qx-tabs" role="tablist">
    ${[["", "Armory", "ph-shield-chevron", `${td}/${tiersAll.length}`], ["weapons", "Weapon rack", "ph-sword", `${wd}/${WEAPONS.length}`], ["crafting", "Craftsmen", "ph-hammer", ""]].map(([k, l, ic, n]) =>
      `<button class="qx-tab" role="tab" aria-selected="${tab === k}" data-action="set-param" data-k="tab" data-v="${k}">${icon(ic)}<span>${l}</span><span class="mono">${n}</span></button>`).join("")}
  </div>
  ${tab === "weapons" ? rackHtml() : tab === "crafting" ? craftsmenHtml() : armoryHtml()}`;
};
function setTiers(g){ return Object.keys(g.levels); }
function armoryHtml(){
  const g = GEAR_SETS.find(x => x.id === P("s")) || GEAR_SETS[0];
  const meta = SCHOOL_META[g.id], im = GEAR_IMG.sets[g.id] || {tiers:{}, swords:[]};
  const tiers = setTiers(g), tsel = tiers.includes(P("t")) ? P("t") : (tiers.find(t => !isChecked(`gear:${g.id}:${t}`)) || tiers[tiers.length - 1]);
  const smith = TIER_SMITH[tsel], done = isChecked(`gear:${g.id}:${tsel}`);
  const vs = GEAR_SETS.find(x => x.id === P("vs") && x.id !== g.id);
  const tierImg = im.tiers[tsel] || im.tiers.mastercrafted || Object.values(im.tiers)[0];
  // tier path geometry
  const n = tiers.length, X = i => n === 1 ? 50 : 8 + i * (84 / (n - 1));
  return `
  <div class="gr-crests" role="group" aria-label="Witcher school">${GEAR_SETS.map(s => { const m = SCHOOL_META[s.id], ts = setTiers(s), d = ts.filter(t => isChecked(`gear:${s.id}:${t}`)).length;
    return `<button class="gr-crest" style="--sc:${m.color}" aria-pressed="${s.id === g.id}" data-action="set-params" data-p='${esc(JSON.stringify({s:s.id, t:"", vs:P("vs")}))}'>
      <span class="gr-crest-medal">${icon(m.icon)}</span><span class="gr-crest-name">${esc(m.short)}</span><span class="gr-crest-sub">${esc(s.weight)} · <span class="mono">${d}/${ts.length}</span></span></button>`; }).join("")}</div>
  <section class="gr-stand" style="--sc:${meta.color}" aria-label="${esc(g.name)}">
    ${im.bg ? `<div class="gr-stand-bg">${gImg(im.bg, 1200)}</div>` : ""}
    <div class="gr-display">
      <div class="gr-pedestal">${im.render ? gImg(im.render, 520, "gr-render", g.name) : tierImg ? gImg(tierImg, null, "gr-icon-big", `${g.name} ${TIER_LABEL[tsel]}`) : ""}<i class="ph ${meta.icon} gr-fallback" aria-hidden="true"></i></div>
      ${im.swords.length ? `<div class="gr-arms"><span class="label">${g.id === "viper" ? "Viper swords" : "Grandmaster swords"}</span><div>${im.swords.map((p, i) => `<span class="gr-arm">${gImg(p, null, "", i ? "Silver sword" : "Steel sword")}<small>${i ? "Silver" : "Steel"}</small></span>`).join("")}</div></div>` : ""}
    </div>
    <div class="gr-info">
      <span class="label" style="color:${meta.color}">${esc(g.weight)} armor${g.dlc ? " · " + esc(dlcLabel(g.dlc)) : ""}</span>
      <h2>${esc(g.name)}</h2>
      <div class="gr-path" aria-label="Upgrade path">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">${tiers.slice(1).map((t, i) => `<line x1="${X(i)}" y1="10" x2="${X(i + 1)}" y2="10" class="${isChecked(`gear:${g.id}:${tiers[i]}`) && isChecked(`gear:${g.id}:${t}`) ? "on" : ""}"/>`).join("")}</svg>
        ${tiers.map((t, i) => { const d = isChecked(`gear:${g.id}:${t}`), ip = im.tiers[t];
          return `<button class="gr-tier ${d ? "done" : ""} ${t === tsel ? "sel" : ""} ${t === "grandmaster" ? "gm" : ""}" style="left:${X(i)}%" data-action="set-param" data-k="t" data-v="${t}" aria-pressed="${t === tsel}" aria-label="${TIER_LABEL[t]}, level ${g.levels[t]}${d ? ", crafted" : ""}">
            <span class="gr-tier-medal">${ip ? gImg(ip, null) : ""}<i class="ph ${meta.icon}" aria-hidden="true"></i>${d ? `<i class="ph ph-check-fat ph-fill gr-tier-check" aria-hidden="true"></i>` : ""}</span>
            <span class="gr-tier-name">${TIER_LABEL[t]}</span><span class="gr-tier-lvl mono">Lv ${g.levels[t]}</span></button>`; }).join("")}
      </div>
      <div class="gr-tier-card">
        <div class="row between" style="align-items:flex-start;gap:10px"><div><span class="label">${TIER_LABEL[tsel]} tier</span><h3>Required level <span class="mono">${g.levels[tsel]}</span></h3></div>
          <label class="bx-study ${done ? "on" : ""}"><input type="checkbox" data-check="gear:${g.id}:${tsel}" ${done ? "checked" : ""}>${icon(done ? "ph-seal-check" : "ph-seal")}<span>${done ? "Crafted" : "Mark crafted"}</span></label></div>
        <p class="gr-smith">${icon("ph-hammer")}<span><b>Forged by:</b> ${esc(smith.who)}</span></p>
        ${smith.pins.length ? `<div class="row" style="gap:6px">${smith.pins.filter(id => LOCATION_PINS[id]).map(id => `<button class="chip" data-action="loc-map" data-id="${id}" data-i="0">${icon("ph-map-pin")}${esc(LOCATIONS.find(l => l.id === id).name.split(" (")[0])}</button>`).join("")}</div>` : ""}
        ${g.levelNote ? `<p class="src" style="margin:8px 0 0">${esc(g.levelNote)}</p>` : ""}
      </div>
      <div class="row" style="gap:8px;margin-top:12px">${favBtn("gear", g.id, g.name, false)}
        <label class="field gr-vs"><span class="sr-only">Compare with</span><select class="select" data-filter="vs"><option value="">Compare with...</option>${GEAR_SETS.filter(x => x.id !== g.id).map(x => `<option value="${x.id}" ${vs && vs.id === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label></div>
    </div>
  </section>
  <div class="gr-lore">
    <section class="gr-plaque"><h3>${icon("ph-map-trifold")}Where to start</h3><p>${esc(g.basic)}</p>${g.upgrades ? `<h4>Upgrades</h4><p>${esc(g.upgrades)}</p>` : ""}
      ${QUESTS.filter(q => q.type === "treasure" && q.name.toLowerCase().includes((meta.short === "Feline" ? "cat" : meta.short === "Ursine" ? "bear" : meta.short === "Wolven" ? "wolf" : meta.short).toLowerCase())).map(q => `<button class="chip" data-open="quest:${q.id}" style="margin:4px 6px 0 0">${icon("ph-scroll")}${esc(q.name)}</button>`).join("")}</section>
    <section class="gr-plaque gold"><h3>${icon("ph-crown")}Grandmaster set bonus</h3>
      ${g.gm.map(b => { const m = b.match(/^(\d) pieces?:\s*(.*)$/); return m ? `<div class="gr-bonus"><span class="gr-pcs mono">${m[1]}</span><p>${esc(m[2])}</p></div>` : `<p>${esc(b)}</p>`; }).join("")}
      ${g.versionNote ? `<p class="src">${icon("ph-git-diff")} ${esc(g.versionNote)}</p>` : ""}</section>
  </div>
  ${vs ? compareHtml(g, vs) : ""}
  <p class="src" style="margin-top:8px">${vTag(g.v)} Images: The Witcher 3 via the Witcher fandom wiki. ${srcLine(g.src).replace(/^<p class="src">|<\/p>$/g, "")}</p>`;
}
function compareHtml(a, b){
  const allT = ["basic", "enhanced", "superior", "mastercrafted", "grandmaster", "single"].filter(t => a.levels[t] || b.levels[t]);
  const col = s => `<div class="gr-cmp-col" style="--sc:${SCHOOL_META[s.id].color}"><div class="gr-cmp-head">${icon(SCHOOL_META[s.id].icon)}<b>${esc(s.name)}</b><span class="dim">${esc(s.weight)}${s.dlc ? " · " + esc(dlcLabel(s.dlc)) : ""}</span></div>
    <dl class="kv">${allT.map(t => `<dt>${TIER_LABEL[t]}</dt><dd class="mono">${s.levels[t] ? "Lv " + s.levels[t] : "-"}</dd>`).join("")}</dl>
    <ul class="clean" style="margin-top:10px">${s.gm.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
  return `<section class="section" aria-labelledby="cmpT"><div class="row between"><h2 id="cmpT">Side by side</h2><button class="btn btn-ghost btn-sm" data-action="set-param" data-k="vs" data-v="">${icon("ph-x")}Close</button></div>
    <div class="gr-cmp">${col(a)}${col(b)}</div></section>`;
}
function rackHtml(){
  const kind = P("kind"), sel = WEAPONS.find(w => w.id === P("w"));
  const list = WEAPONS.filter(w => !kind || w.kind.toLowerCase().startsWith(kind));
  return `<div class="qx-stage">
    <div class="qx-main">
      ${chipsHtml("kind", [["", "All"], ["steel", "Steel swords"], ["silver", "Silver swords"], ["crossbow", "Crossbows"]], kind, "Weapon type")}
      <div class="gr-rack">${list.map(w => { const d = isChecked("own:" + w.id), p = GEAR_IMG.weapons[w.id];
        return `<button class="gr-weapon ${d ? "done" : ""} ${sel && sel.id === w.id ? "sel" : ""} ${w.rarity === "Relic" ? "relic" : ""}" data-action="gr-weapon" data-id="${w.id}">
          <span class="gr-weapon-art">${p ? gImg(p, 520) : ""}<i class="ph ${w.kind === "Crossbow" ? "ph-crosshair" : "ph-sword"}" aria-hidden="true"></i></span>
          <span class="gr-weapon-body"><b>${esc(w.name)}</b><span>${esc(w.kind)} · <span class="gr-rarity">${esc(w.rarity)}</span>${w.dlc ? " · " + esc(dlcLabel(w.dlc)) : ""}</span></span>
          ${d ? `<span class="qx-seal gr-seal" aria-hidden="true">${icon("ph-check-fat ph-fill")}</span>` : ""}</button>`; }).join("")}</div>
      <p class="src" style="margin-top:10px">Weapon damage changes with level, patch and NG+ scaling, so the rack lists how to obtain each item rather than numbers.</p>
    </div>
    <aside class="qx-inspector" id="grInspector" aria-live="polite">${weaponInspector(sel)}</aside>
  </div>`;
}
function weaponInspector(w){
  if(!w) return `<div class="qx-insp-empty">${icon("ph-sword")}<h3>The weapon rack</h3><p class="muted">Select a weapon to see how to obtain it and mark it as collected.</p></div>`;
  const d = isChecked("own:" + w.id), p = GEAR_IMG.weapons[w.id];
  return `${p ? `<div class="gr-insp-art">${gImg(p, 700, "", w.name)}</div>` : ""}
    <span class="label">${esc(w.kind)} · ${esc(w.rarity)}</span><h3 style="font-size:1.5rem;margin:4px 0 12px">${esc(w.name)}</h3>
    <div class="row" style="margin-bottom:14px"><label class="bx-study qx-done ${d ? "on" : ""}"><input type="checkbox" data-check="own:${w.id}" ${d ? "checked" : ""}>${icon(d ? "ph-seal-check" : "ph-seal")}<span>${d ? "Collected" : "Mark collected"}</span></label>${favBtn("weapon", w.id, w.name, false)}</div>
    <dl class="kv"><dt>How to get</dt><dd>${esc(w.how)}</dd>${w.dlc ? `<dt>Expansion</dt><dd>${esc(dlcLabel(w.dlc))}</dd>` : ""}</dl>
    <div class="row" style="margin-top:12px">${vTag(w.v)}</div>${srcLine(w.src)}`;
}
function craftsmenHtml(){
  const smiths = LOCATIONS.filter(l => l.type === "blacksmith" || l.type === "armorer");
  const rank = l => /grandmaster/i.test(l.name + l.hint) ? 3 : /\bmaster\b/i.test(l.name) || /master (armorer|blacksmith)/i.test(l.hint) ? 2 : /journeyman/i.test(l.name + l.hint) ? 1 : 0;
  const tiers = [[3, "Grandmaster", "Forges Grandmaster gear (Blood and Wine)"], [2, "Master", "Forges Mastercrafted gear"], [1, "Journeyman", "Forges basic and lower-tier gear"], [0, "Amateur and others", "Repairs and simple crafting"]];
  return `<section class="gr-ladder">${tiers.map(([r, title, sub], i) => { const ls = smiths.filter(l => rank(l) === r);
    return `<div class="gr-rung r${r}"><div class="gr-rung-head"><span class="gr-rung-medal">${icon(r === 3 ? "ph-crown" : r === 2 ? "ph-hammer" : r === 1 ? "ph-hammer" : "ph-wrench")}</span><div><b>${title}</b><span>${sub}</span></div></div>
      <div class="gr-rung-list">${ls.length ? ls.map(l => `<div class="gr-smith-card"><b>${esc(l.name)}</b><span>${esc(regionName(l.region))}</span><p>${esc(l.hint)}</p>
        <div class="row" style="gap:6px">${LOCATION_PINS[l.id] ? `<button class="btn btn-sm" data-action="loc-map" data-id="${l.id}" data-i="0">${icon("ph-map-pin")}Map</button>` : ""}<button class="btn btn-sm btn-ghost" data-open="loc:${l.id}">Details</button></div></div>`).join("") : `<p class="dim">None recorded.</p>`}</div></div>`; }).join("")}</section>
  <section class="section"><h2>How upgrades work</h2><ol class="steps" style="margin-top:12px">${CRAFTSMEN_RULES.map(r => `<li>${esc(r)}</li>`).join("")}</ol>
    <div class="notice" style="margin-top:16px">${icon("ph-warning")}<div><strong>Materials not listed.</strong> Per-tier crafting material lists were not verified, so they are not shown. Check the diagram in game.</div></div></section>`;
}
function grWeapon(id){
  setParams({w:id});
  const box = $("#grInspector"); if(box) box.innerHTML = weaponInspector(WEAPONS.find(w => w.id === id));
  $$(".gr-weapon.sel").forEach(b => b.classList.remove("sel")); $(`.gr-weapon[data-id="${CSS.escape(id)}"]`)?.classList.add("sel");
  if(box && matchMedia("(max-width:1100px)").matches) box.scrollIntoView({behavior: state.settings.reduceMotion ? "auto" : "smooth", block:"start"});
}
</script>
