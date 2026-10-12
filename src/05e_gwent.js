<script>
"use strict";
/* =====================================================================
   8e. GWENT CABINET
   Cards are drawn as framed Gwent cards with a faction emblem in place
   of artwork (no licensed card art is available). Ownership is stored
   as copies owned per card: state.gwent.owned[id] = n.
   ===================================================================== */
const FACTION_META = {
  nr:{color:"#4f7fc4", icon:"ph-crown-simple"}, nilf:{color:"#c8a456", icon:"ph-sun"}, st:{color:"#6aa25c", icon:"ph-leaf"},
  mon:{color:"#b1332c", icon:"ph-skull"}, sk:{color:"#4fa3a5", icon:"ph-anchor"}, neutral:{color:"#9a958a", icon:"ph-scales"}
};
const ROW_META = {close:{label:"Close Combat", icon:"ph-sword"}, ranged:{label:"Ranged", icon:"ph-crosshair"}, siege:{label:"Siege", icon:"ph-castle-turret"}, agile:{label:"Agile", icon:"ph-arrows-left-right"}};
const ABILITY_GLYPHS = [[/Tight Bond/i, "ph-link", "Tight Bond"], [/Medic/i, "ph-first-aid", "Medic"], [/\bSpy\b/i, "ph-eye", "Spy"], [/Muster/i, "ph-users-three", "Muster"],
  [/Morale/i, "ph-arrow-fat-up", "Morale boost"], [/Commander's Horn|Doubles the strength/i, "ph-megaphone", "Horn"], [/Scorch|strongest/i, "ph-fire", "Scorch"],
  [/Berserker|bear/i, "ph-paw-print", "Berserker"], [/Mardroeme/i, "ph-plant", "Mardroeme"], [/summons|Avenger/i, "ph-arrow-u-up-right", "Summon"], [/Swap with a card/i, "ph-user-switch", "Decoy"]];
const glyphsOf = c => ABILITY_GLYPHS.filter(([re]) => re.test(c.ability)).slice(0, 2);
const collectible = () => GWENT_CARDS.filter(c => !c.token);
const ownedN = id => state.gwent.owned[id] || 0;
const cardById = id => GWENT_CARDS.find(c => c.id === id);
/* Card faces are hotlinked from the Witcher fandom wiki CDN at a scaled width; on error the card falls back to the emblem design. */
const gwImg = (c, w) => `https://static.wikia.nocookie.net/witcher/images/${c.img}/revision/latest/scale-to-width-down/${w}`;
const typeLabel = c => c.type === "unit" ? (c.hero ? "Hero" : "Unit") : c.type[0].toUpperCase() + c.type.slice(1);

function gwCard(c, opts = {}){
  const fm = FACTION_META[c.faction], owned = ownedN(c.id) > 0, cnt = opts.count;
  const corner = c.type === "unit" ? `<span class="gw-str">${c.str ?? "-"}</span>` : `<span class="gw-str gw-str-ico">${icon(c.type === "weather" ? "ph-cloud-lightning" : c.type === "leader" ? "ph-crown" : "ph-star-four")}</span>`;
  const w = opts.size === "sm" ? 160 : opts.size === "lg" ? 400 : 260;
  return `<button class="gw-card ${c.img ? "has-img" : ""} ${opts.size || ""} ${c.hero ? "hero" : ""} ${c.type} ${owned || opts.forceOwned ? "" : "missing"} ${opts.sel ? "sel" : ""}" style="--fc:${fm.color}"
      data-action="${opts.action || "gw-select"}" data-id="${c.id}" aria-label="${esc(c.name)}, ${typeLabel(c)}${c.str != null ? ", strength " + c.str : ""}${owned ? ", owned" : ", not collected"}">
    <span class="gw-frame">${c.img ? `<img class="gw-img" src="${gwImg(c, w)}" alt="" loading="lazy" decoding="async" onload="this.closest('.gw-card').classList.add('img-ok')" onerror="this.closest('.gw-card').classList.remove('has-img');this.remove()">` : ""}${corner}
      <span class="gw-portrait"><i class="ph ${fm.icon} gw-emblem" aria-hidden="true"></i>
        ${c.row ? `<span class="gw-row tooltip" data-tip="${ROW_META[c.row].label}">${icon(ROW_META[c.row].icon)}</span>` : ""}
        <span class="gw-glyphs">${glyphsOf(c).map(([, ic]) => icon(ic)).join("")}</span></span>
      <span class="gw-name">${esc(c.name)}</span>
      <span class="gw-sub">${esc(typeLabel(c))}${c.row ? " · " + ROW_META[c.row].label : ""}</span>
    </span>
    ${cnt ? `<span class="gw-count">×${cnt}</span>` : ""}${!owned && !opts.forceOwned && !opts.size ? `<span class="gw-missing">Not collected</span>` : ""}
  </button>`;
}

VIEWS.gwent = () => {
  const tab = P("tab", "collection"), f = P("f");
  const all = collectible(), own = all.filter(c => ownedN(c.id)).length;
  const banner = (k, label) => { const cs = all.filter(c => !k || c.faction === k), o = cs.filter(c => ownedN(c.id)).length, fm = FACTION_META[k] || {color:"#9a958a", icon:"ph-cards"};
    return `<button class="gw-banner" style="--fc:${fm.color}" aria-pressed="${f === (k || "")}" data-action="set-param" data-k="f" data-v="${k || ""}">${icon(fm.icon)}<span>${esc(label)}</span><span class="mono">${o}/${cs.length}</span></button>`; };
  return `
  <header class="page-head"><h1>Gwent</h1><p>Every card in The Witcher 3 and both expansions: ${all.length} cards across six factions. Track your collection, see where to win each card, and lay out a deck on the table.</p></header>
  <div class="gw-hall">
    <div class="gw-tally"><span class="label">Collection</span><div class="pct" style="margin-top:6px">${own}<small>/ ${all.length}</small></div>${meter(pct(own, all.length), own === all.length)}</div>
    <div class="gw-banners" role="group" aria-label="Faction">${banner("", "All factions")}${Object.entries(FACTIONS).map(([k, x]) => banner(k, x.name)).join("")}</div>
    ${f && FACTIONS[f] ? `<p class="gw-ability" style="--fc:${FACTION_META[f].color}">${icon(FACTION_META[f].icon)}<span><strong>${esc(FACTIONS[f].name)}.</strong> ${esc(FACTIONS[f].ability)}</span></p>` : ""}
  </div>
  ${tabsHtml("tab", [["collection", "Card cabinet"], ["deck", "Deck table"]], tab)}
  ${tab === "deck" ? deckTable() : cabinetHtml()}`;
};
function cabinetHtml(){
  const sel = cardById(P("c"));
  return `<div class="gw-cabinet">
    <div>
      <div class="toolbar">
        ${searchField("q", "Search cards", "Card, ability or where to win it")}
        ${selectField("own", "Show", [["", "All cards"], ["missing", "Missing only"], ["owned", "Owned only"]], P("own"))}
        ${selectField("kind", "Type", [["", "Any type"], ["unit", "Units"], ["hero", "Heroes"], ["special", "Specials"], ["weather", "Weather"], ["leader", "Leaders"]], P("kind"))}
        ${selectField("row", "Row", [["", "Any row"], ...Object.entries(ROW_META).map(([k, r]) => [k, r.label])], P("row"))}
      </div>
      <div id="list" aria-live="polite">${VIEWS.gwent_list()}</div>
    </div>
    <aside class="gw-inspector" id="gwInspector" aria-live="polite">${inspectCard(sel)}</aside>
  </div>`;
}
VIEWS.gwent_list = () => {
  const f = P("f"), q = P("q").toLowerCase(), own = P("own"), kind = P("kind"), row = P("row"), selId = P("c");
  const list = collectible().filter(c => (!f || c.faction === f) && (!own || (own === "owned") === ownedN(c.id) > 0)
    && (!kind || (kind === "hero" ? c.hero : kind === "unit" ? c.type === "unit" && !c.hero : c.type === kind))
    && (!row || c.row === row) && (!q || (c.name + " " + c.acquire + " " + c.ability).toLowerCase().includes(q)));
  if(!list.length) return own === "missing" ? emptyState("ph-seal-check", "Nothing missing here", "You own every card in this filter.") : emptyState("ph-cards", "No cards match", "Try another faction or filter.", `<button class="btn" data-action="clear-filters">Clear filters</button>`);
  return `<p class="dim" style="font-size:.88rem;margin:0 0 10px">${list.length} cards</p><div class="gw-grid">${list.map(c => `<div class="gw-cell">${gwCard(c, {sel: selId === c.id})}
    <button class="gw-own ${ownedN(c.id) ? "on" : ""}" data-action="gw-own" data-id="${c.id}" data-d="${ownedN(c.id) ? -99 : 1}" aria-pressed="${ownedN(c.id) > 0}" aria-label="${ownedN(c.id) ? "Unmark" : "Mark"} ${esc(c.name)} as owned">${icon(ownedN(c.id) ? "ph-check-square ph-fill" : "ph-square")}${ownedN(c.id) ? (c.copies > 1 ? `Owned ${ownedN(c.id)}/${c.copies}` : "Owned") : "Mark owned"}</button></div>`).join("")}</div>`;
};
function inspectCard(c){
  if(!c) return `<div class="gw-insp-empty">${icon("ph-cards")}<h3>Choose a card</h3><p class="muted">Select any card to see its ability, where to win or buy it, and how many copies exist.</p>
    <div class="gw-key"><span>${icon("ph-sword")}Close</span><span>${icon("ph-crosshair")}Ranged</span><span>${icon("ph-castle-turret")}Siege</span><span>${icon("ph-arrows-left-right")}Agile</span></div></div>`;
  const n = ownedN(c.id), fm = FACTION_META[c.faction];
  const canDeck = c.type !== "leader" && !c.token;
  return `<div class="gw-insp-card">${gwCard(c, {size:"lg", action:"gw-noop", forceOwned:true})}</div>
    <p class="src" style="text-align:center;margin:-8px 0 12px">Card art: The Witcher 3, via the Witcher fandom wiki.</p>
    <div class="gw-insp-body">
      <span class="label" style="color:${fm.color}">${esc(FACTIONS[c.faction].name)}</span>
      <h3>${esc(c.name)}</h3>
      <dl class="kv"><dt>Type</dt><dd>${esc(typeLabel(c))}</dd>${c.row ? `<dt>Row</dt><dd>${esc(ROW_META[c.row].label)}</dd>` : ""}${c.str != null ? `<dt>Strength</dt><dd class="mono">${c.str}</dd>` : ""}
        <dt>Ability</dt><dd>${esc(c.ability)}</dd><dt>How to get</dt><dd>${esc(c.acquire.replace(/; /g, "; "))}</dd><dt>Copies</dt><dd class="mono">${c.copies}</dd></dl>
      ${c.token ? `<div class="notice info" style="margin-top:12px">${icon("ph-info")}<div>${esc(c.token)}</div></div>` : `
      <div class="gw-copies"><span>Owned</span>
        <button class="btn btn-sm btn-icon" data-action="gw-own" data-id="${c.id}" data-d="-1" ${n ? "" : "disabled"} aria-label="One fewer copy">${icon("ph-minus")}</button>
        <span class="mono">${n}/${c.copies}</span>
        <button class="btn btn-sm btn-icon" data-action="gw-own" data-id="${c.id}" data-d="1" ${n < c.copies ? "" : "disabled"} aria-label="One more copy">${icon("ph-plus")}</button></div>`}
      <div class="row" style="margin-top:12px">${favBtn("card", c.id, c.name, false)}${canDeck ? `<button class="btn" data-action="gw-add-deck" data-id="${c.id}">${icon("ph-plus")}Add to deck</button>` : c.type === "leader" ? `<button class="btn" data-action="gw-leader" data-id="${c.id}">${icon("ph-crown")}Use as leader</button>` : ""}</div>
      ${srcLine(c.src)}
    </div>`;
}

/* ---------- Deck table ---------- */
function deckState(){
  const d = state.gwent.deck;
  const cards = d.cards.map(cardById).filter(Boolean);
  const units = cards.filter(c => c.type === "unit"), specials = cards.filter(c => c.type !== "unit");
  const byRow = r => units.filter(c => c.row === r);
  return {d, cards, units, specials, byRow, strength: units.reduce((a, c) => a + (c.str || 0), 0), heroes: cards.filter(c => c.hero).length, leader: cardById(d.leader)};
}
function deckTable(){
  const st = deckState(), d = st.d, fm = FACTION_META[d.faction], showAll = P("all");
  const inDeck = id => d.cards.filter(x => x === id).length;
  const cap = c => showAll ? c.copies : ownedN(c.id);
  const pool = collectible().filter(c => c.type !== "leader" && (c.faction === d.faction || c.faction === "neutral") && cap(c) > inDeck(c.id));
  const leaders = collectible().filter(c => c.type === "leader" && c.faction === d.faction);
  const errs = [];
  if(st.units.length < GWENT_RULES.minUnits) errs.push(`At least ${GWENT_RULES.minUnits} unit cards (${st.units.length} now).`);
  if(st.specials.length > GWENT_RULES.maxSpecials) errs.push(`At most ${GWENT_RULES.maxSpecials} special and weather cards (${st.specials.length} now).`);
  if(!st.leader) errs.push("Choose a leader.");
  const lane = (title, ic, cs) => {
    const grouped = [...new Set(cs.map(c => c.id))].map(id => [cardById(id), cs.filter(c => c.id === id).length]);
    return `<div class="gw-lane"><div class="gw-lane-head">${icon(ic)}<span>${esc(title)}</span><span class="mono">${cs.filter(c => c.type === "unit").reduce((a, c) => a + (c.str || 0), 0) || ""}</span></div>
      <div class="gw-lane-cards">${grouped.length ? grouped.map(([c, n]) => gwCard(c, {size:"sm", action:"deck-remove", count: n > 1 ? n : 0, forceOwned:true})).join("") : `<span class="gw-lane-empty">Empty</span>`}</div></div>`;
  };
  return `<div class="gw-table-wrap">
    <div class="gw-factions" role="group" aria-label="Deck faction">${Object.entries(FACTIONS).filter(([k]) => k !== "neutral").map(([k, x]) =>
      `<button class="gw-banner" style="--fc:${FACTION_META[k].color}" aria-pressed="${d.faction === k}" data-action="gw-faction" data-id="${k}">${icon(FACTION_META[k].icon)}<span>${esc(x.name)}</span></button>`).join("")}</div>
    <section class="gw-table" style="--fc:${fm.color}" aria-label="Deck table">
      <div class="gw-table-side">
        <div class="gw-leader-slot">${st.leader ? gwCard(st.leader, {size:"md", action:"gw-leader-clear", forceOwned:true}) : `<div class="gw-slot-empty">${icon("ph-crown")}<span>No leader</span></div>`}</div>
        <div class="gw-plaques">
          <div class="${st.units.length >= GWENT_RULES.minUnits ? "ok" : ""}"><span>Units</span><b class="mono">${st.units.length}<small>/${GWENT_RULES.minUnits}+</small></b></div>
          <div class="${st.specials.length > GWENT_RULES.maxSpecials ? "bad" : ""}"><span>Specials</span><b class="mono">${st.specials.length}<small>/${GWENT_RULES.maxSpecials}</small></b></div>
          <div><span>Strength</span><b class="mono">${st.strength}</b></div>
          <div class="gold"><span>Heroes</span><b class="mono">${st.heroes}</b></div>
        </div>
        ${errs.length ? `<ul class="gw-rules">${errs.map(e => `<li>${icon("ph-warning")}${esc(e)}</li>`).join("")}</ul>` : `<p class="gw-legal">${icon("ph-seal-check")}Deck is legal.</p>`}
        <p class="gw-ability" style="--fc:${fm.color};margin:0">${icon(fm.icon)}<span>${esc(FACTIONS[d.faction].ability)}</span></p>
        ${d.cards.length ? `<button class="btn btn-ghost btn-sm" data-action="deck-clear">${icon("ph-trash")}Clear deck</button>` : ""}
      </div>
      <div class="gw-board">
        ${lane("Siege", "ph-castle-turret", st.byRow("siege"))}
        ${lane("Ranged", "ph-crosshair", st.byRow("ranged"))}
        ${lane("Close Combat", "ph-sword", st.byRow("close"))}
        ${lane("Agile (close or ranged)", "ph-arrows-left-right", st.byRow("agile"))}
        ${lane("Specials and weather", "ph-star-four", st.specials)}
        <p class="src" style="margin:0">Click a card on the table to take it back. Lanes show where each card can be played; the table is a planning view, not a match.</p>
      </div>
    </section>
    <section class="section">
      <div class="row between"><h2>Leaders</h2></div>
      <div class="gw-pool" style="margin-top:12px">${leaders.map(c => `<div class="gw-cell">${gwCard(c, {size:"sm", action:"gw-leader", sel: d.leader === c.id, forceOwned: !!showAll})}</div>`).join("")}</div>
    </section>
    <section class="section">
      <div class="row between" style="align-items:flex-end"><h2>Card pool <span class="mono dim" style="font-size:.9rem">${pool.length}</span></h2>${switchField("all", "Include cards I don't own")}</div>
      ${pool.length ? `<div class="gw-pool" style="margin-top:12px">${pool.map(c => `<div class="gw-cell">${gwCard(c, {size:"sm", action:"deck-add", forceOwned: !!showAll, count: cap(c) - inDeck(c.id) > 1 ? cap(c) - inDeck(c.id) : 0})}</div>`).join("")}</div>`
        : emptyState("ph-cards", "No cards left to add", showAll ? "Every copy for this faction is already on the table." : "Mark cards as owned in the cabinet, or include cards you don't own.")}
      <p class="src" style="margin-top:10px">Click a card to add one copy. The number shows copies still available (owned copies, or all copies when "include cards I don't own" is on).</p>
    </section>
  </div>`;
}
function gwSetOwned(id, delta){
  const c = cardById(id); if(!c || c.token) return;
  const n = Math.max(0, Math.min(c.copies, ownedN(id) + delta));
  if(n) state.gwent.owned[id] = n; else delete state.gwent.owned[id];
  save(); renderNav();
}
function gwRefreshCabinet(){
  const y = window.scrollY, ae = document.activeElement, sel = ae && ae.dataset && ae.dataset.action && ae.dataset.id ? `[data-action="${ae.dataset.action}"][data-id="${ae.dataset.id}"]` : null;
  render(true); window.scrollTo(0, y);
  if(sel){ const el = $(sel); if(el && !el.disabled) el.focus({preventScroll:true}); }
}
</script>
