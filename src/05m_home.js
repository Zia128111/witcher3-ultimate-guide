<script>
"use strict";
/* =====================================================================
   8m. THE MEDALLION (Home)
   The hero carries a progress medallion: overall completion at the core
   and nine category nodes on spokes whose gold fills with progress, like
   the skill tree. Picking a node shows its next step. Below: the path
   ahead, codex doors and the recent trail.
   ===================================================================== */
const HM_ICON = {main:"ph-crown-simple", side:"ph-scroll", pop:"ph-sparkle", loc:"ph-map-trifold", gwent:"ph-cards", ach:"ph-trophy", gear:"ph-shield-chevron", beast:"ph-skull", map:"ph-map-pin"};
function hmNext(key){
  const un = arr => arr.find(x => !isChecked(x.id));
  switch(key){
    case "main": { const q = QUESTS.find(q => q.type === "main" && !isChecked(q.id)); return q ? {text:`Next: ${q.name}`, sub:q.act || "", open:`quest:${q.id}`} : {text:"Main story complete", sub:"Time to prepare for New Game+.", href:"#/dlc?tab=ng"}; }
    case "side": { const q = QUESTS.find(q => q.type !== "main" && q.missable && !isChecked(q.id)); return q ? {text:`Missable: ${q.name}`, sub:q.missable, open:`quest:${q.id}`} : {text:"No missable side quests left unchecked", href:"#/quests"}; }
    case "pop": { const l = un(LOCATIONS.filter(l => l.type === "pop")); return l ? {text:`Unclaimed: ${l.name}`, sub:l.hint, href:"#/collect"} : {text:"Every listed stone claimed", href:"#/collect"}; }
    case "loc": { const l = un(LOCATIONS); return l ? {text:`Unvisited: ${l.name}`, sub:l.hint, href:`#/world?r=${l.region}&sel=${l.id}`} : {text:"Every listed location visited", href:"#/world"}; }
    case "gwent": { const miss = GWENT_CARDS.filter(c => !c.token && !state.gwent.owned[c.id]).length; return {text:`${miss} card${miss === 1 ? "" : "s"} still to collect`, sub:"Track copies and build decks in the Gwent cabinet.", href:"#/gwent"}; }
    case "ach": { const a = ACHIEVEMENTS.find(a => a.missable && !isChecked(a.id)) || un(ACHIEVEMENTS); return a ? {text:`${a.missable ? "Missable: " : ""}${a.name}`, sub:a.how, href:"#/collect?tab=ach"} : {text:"Trophy hall complete", href:"#/collect?tab=ach"}; }
    case "gear": return {text:"Track witcher school gear by tier", sub:"Mark each diagram tier as crafted in the armory.", href:"#/gear"};
    case "beast": { const m = MONSTERS.find(m => !isChecked("beast:" + m.id)); return m ? {text:`Unstudied: ${m.name}`, sub:m.cat || "", open:`monster:${m.id}`} : {text:"Every monster studied", href:"#/bestiary"}; }
    case "map": return {text:"Tick markers as you find them", sub:"Treasure, signposts and more on the interactive map.", href:"#/map"};
  }
  return {text:"", href:"#/"};
}
function hmMedallion(ps, sel){
  const total = ps.reduce((a, p) => a + pct(p.done, p.total), 0) / ps.length, R = 41;
  const pos = ps.map((p, i) => { const a = (i / ps.length) * Math.PI * 2 - Math.PI / 2; return [50 + R * Math.cos(a), 50 + R * Math.sin(a)]; });
  return `<div class="hm-medal" role="group" aria-label="Completion medallion">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="hm-orbit" cx="50" cy="50" r="${R}"/><circle class="hm-orbit faint" cx="50" cy="50" r="${R - 9}"/>
      ${pos.map(([x, y], i) => { const f = pct(ps[i].done, ps[i].total) / 100, ix = 50 + (x - 50) * 0.36, iy = 50 + (y - 50) * 0.36, ox = ix + (x - ix) * f, oy = iy + (y - iy) * f;
        return `<line class="hm-spoke" x1="${ix.toFixed(2)}" y1="${iy.toFixed(2)}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}"/>${f ? `<line class="hm-spoke lit ${ps[i].key === sel ? "sel" : ""}" x1="${ix.toFixed(2)}" y1="${iy.toFixed(2)}" x2="${ox.toFixed(2)}" y2="${oy.toFixed(2)}"/>` : ""}`; }).join("")}
    </svg>
    <button class="hm-core ${!sel ? "sel" : ""}" style="--p:${total.toFixed(1)}" data-action="set-param" data-k="hn" data-v="" aria-pressed="${!sel}" aria-label="Overall completion ${Math.round(total)} percent"><b class="mono">${total > 0 && total < 10 ? total.toFixed(1) : Math.round(total)}<small>%</small></b><span>Journey</span></button>
    ${ps.map((p, i) => { const v = pct(p.done, p.total);
      return `<button class="hm-node ${v === 100 ? "full" : v ? "lit" : ""} ${p.key === sel ? "sel" : ""}" style="left:${pos[i][0].toFixed(2)}%;top:${pos[i][1].toFixed(2)}%;--p:${v}" data-action="set-param" data-k="hn" data-v="${p.key === sel ? "" : p.key}" aria-pressed="${p.key === sel}" aria-label="${esc(p.label)}: ${p.done} of ${p.total}">${icon(HM_ICON[p.key] || "ph-circle")}<span class="hm-node-lbl">${esc(p.label)}</span></button>`; }).join("")}
  </div>`;
}
function hmInspector(ps, sel){
  const p = ps.find(x => x.key === sel);
  if(!p){
    const best = [...ps].sort((a, b) => pct(b.done, b.total) - pct(a.done, a.total))[0], low = [...ps].sort((a, b) => pct(a.done, a.total) - pct(b.done, b.total))[0];
    const any = ps.some(x => x.done);
    return `<span class="label">Your journey</span><h3>${any ? "The path so far" : "A fresh contract"}</h3>
      <p>${any ? `Strongest: <b>${esc(best.label)}</b> at ${pct(best.done, best.total)}%. Most left: <b>${esc(low.label)}</b>.` : "Nothing ticked yet. Each node fills as you mark quests, places, cards and kills across the journal."}</p>
      <p class="dim">Pick a node on the medallion to see its next step.</p>`;
  }
  const v = pct(p.done, p.total), n = hmNext(p.key);
  return `<span class="label">${icon(HM_ICON[p.key])} ${esc(p.label)}</span><h3><span class="mono">${p.done}</span><small> / ${p.total}</small> <em class="mono">${v}%</em></h3>
    ${meter(v, v === 100)}
    <div class="hm-next">${n.open ? `<button class="linkish" data-open="${esc(n.open)}">${esc(n.text)}</button>` : `<a href="${esc(n.href)}">${esc(n.text)}</a>`}${n.sub ? `<span>${esc(n.sub)}</span>` : ""}</div>
    <a class="btn btn-sm" href="#/${p.route}">${icon("ph-arrow-right")}Open ${esc(p.label.toLowerCase())}</a>`;
}

VIEWS.home = () => {
  const ps = computeProgress(), sel = ps.some(p => p.key === P("hn")) ? P("hn") : "";
  const nextMain = QUESTS.find(q => q.type === "main" && !isChecked(q.id));
  const nextMiss = QUESTS.find(q => q.missable && !isChecked(q.id));
  const recent = state.recent.slice(0, 6), last = recent[0];
  const doors = [
    ["builds?tab=planner", "Skill planner", "Allocate points across all four trees, slot skills and research mutations.", "builds", "ph-tree-structure"],
    ["bestiary", "Bestiary", `Oils, signs and bombs for ${MONSTERS.length} monsters.`, "bestiary", "ph-skull"],
    ["quests", "Quest journal", `${QUESTS.filter(q => q.missable).length} quests with known points of no return.`, "quests", "ph-scroll"],
    ["gwent", "Gwent cabinet", "Track every card and build decks.", "gwent", "ph-cards"],
    ["dlc", "Expansion tales", "Walk Hearts of Stone and Blood and Wine to every ending.", "hos", "ph-wine"],
    ["money", "Market square", "Where to sell, and which exploits were patched.", "money", "ph-coins"]
  ];
  const quick = [["world","World Explorer","ph-globe-hemisphere-west"],["map","Interactive Map","ph-map-pin"],["quests","Quests","ph-scroll"],["builds","Skills","ph-tree-structure"],["gear","Armory","ph-sword"],["bestiary","Bestiary","ph-skull"],["alchemy","Alchemy","ph-flask"],["gwent","Gwent","ph-cards"],["collect","Trophies","ph-trophy"],["money","Money","ph-coins"],["dlc","Expansions","ph-wine"],["journal","My Journal","ph-notebook"]];
  return `
  <section class="hm-hero" aria-labelledby="heroTitle">
    ${art("hero", true)}
    <div class="hm-hero-copy hero-anim">
      <span class="label">Wild Hunt, Hearts of Stone and Blood and Wine</span>
      <h1 id="heroTitle">Hunt smarter. Miss <em>nothing</em>.</h1>
      <p>Regions, quests, builds and Gwent in one witcher's journal, with missable warnings and progress kept in your browser.</p>
      <div class="search-big">
        <a class="btn btn-primary" href="#/map">${icon("ph-map-trifold")}Open the map</a>
        <button class="btn" data-action="pal-open">${icon("ph-magnifying-glass")}Search<kbd style="margin-left:6px">/</kbd></button>
      </div>
    </div>
    <div class="hm-hero-medal">
      ${hmMedallion(ps, sel)}
      <div class="hm-insp" aria-live="polite">${hmInspector(ps, sel)}</div>
    </div>
  </section>

  <section class="hm-path section" aria-labelledby="pathTitle">
    <h2 id="pathTitle">The path ahead</h2>
    <ol class="hm-trail">
      ${last ? `<li class="hm-step"><span class="hm-step-ico">${icon("ph-clock-counter-clockwise")}</span><div><span class="label">Where you left off · ${timeAgo(last.at)}</span><a href="${esc(last.route)}">${esc(last.title)}</a></div></li>` : `<li class="hm-step"><span class="hm-step-ico">${icon("ph-footprints")}</span><div><span class="label">First steps</span><p>Tick quests and places as you play. The journal remembers where you left off.</p></div></li>`}
      ${nextMain ? `<li class="hm-step main"><span class="hm-step-ico">${icon("ph-crown-simple")}</span><div><span class="label">Next main quest${nextMain.act ? " · " + esc(nextMain.act) : ""}</span><button class="linkish" data-open="quest:${esc(nextMain.id)}">${esc(nextMain.name)}</button></div>${checkbox(nextMain.id, "Mark " + nextMain.name + " complete")}</li>`
        : `<li class="hm-step main"><span class="hm-step-ico">${icon("ph-seal-check")}</span><div><span class="label">Main story</span><a href="#/dlc?tab=ng">Complete. Prepare for New Game+</a></div></li>`}
      ${nextMiss ? `<li class="hm-step warn"><span class="hm-step-ico">${icon("ph-hourglass-medium")}</span><div><span class="label">Earliest missable checkpoint</span><button class="linkish" data-open="quest:${esc(nextMiss.id)}">${esc(nextMiss.name)}</button><p>${esc(nextMiss.missable)}</p></div></li>` : ""}
    </ol>
  </section>

  <section class="section" aria-labelledby="featTitle">
    <h2 id="featTitle" style="margin-bottom:14px">Codex</h2>
    <div class="hm-doors">${doors.map(([r, t, d, a, ic], i) => `<a class="hm-door ${i === 0 ? "wide" : ""}" href="#/${r}">${art(a)}<span class="hm-door-sigil">${icon(ic)}</span><div><h3>${esc(t)}</h3><p>${esc(d)}</p></div></a>`).join("")}</div>
  </section>

  <section class="section" aria-labelledby="quickTitle">
    <h2 id="quickTitle" style="margin-bottom:14px">Waypoints</h2>
    <nav class="hm-runes" aria-label="Quick navigation">${quick.map(([r, l, i]) => `<a href="#/${r}"><span>${icon(i)}</span>${esc(l)}</a>`).join("")}</nav>
  </section>

  <section class="section" aria-labelledby="recentTitle">
    <h2 id="recentTitle" style="margin-bottom:12px">Recent trail</h2>
    ${recent.length ? `<div class="recent-row">${recent.map(r => `<a class="chip" href="${esc(r.route)}">${esc(r.title)}<span class="n">${timeAgo(r.at)}</span></a>`).join("")}</div>`
      : emptyState("ph-footprints", "Nothing yet", "Pages you open will appear here so you can jump back in.")}
  </section>`;
};
</script>
