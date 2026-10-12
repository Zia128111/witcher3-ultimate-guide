<script>
"use strict";
/* =====================================================================
   8o. WITCHERS' HALL (Builds and Skill Planner)
   The build library as a hall of school banners: the chosen build is
   shown as a constellation of all four trees with its skills lit by rank,
   plus mutagens, mutations, playstyle and gear. The planner gains a
   banner with live per-tree gauges.
   ===================================================================== */
const MUTAGEN_HEX = {red:"#c4453a", blue:"#5a86c9", green:"#6aa25c"};
function hlBuildTrees(alloc){
  const all = allSkills(), by = {combat:0, signs:0, alchemy:0, general:0};
  for(const [id, n] of Object.entries(alloc || {})) if(all[id]) by[all[id].tree] += n;
  return by;
}
function hlDominant(by){ const e = Object.entries(by).sort((a, b) => b[1] - a[1])[0]; return e && e[1] ? e[0] : "general"; }
/* A compact drawing of one tree with the build's ranks and equipped skills. */
function hlMiniTree(tree, alloc, equip){
  const T = SKILL_TREES[tree], col = TREE_META[tree].color, maxY = Math.max(...T.nodes.map(n => n.y)), H = 100 + maxY * SK_STEP;
  const X = n => 50 + n.x * 100, Y = n => 50 + n.y * SK_STEP, eq = new Set((equip || []).filter(Boolean));
  const seen = new Set(); let lines = "";
  T.nodes.forEach(n => n.pre.forEach(pid => { const k = [n.id, pid].sort().join("|"); if(seen.has(k)) return; seen.add(k);
    const p = T.nodes.find(x => x.id === pid); if(!p) return; const on = alloc[n.id] && alloc[pid];
    lines += `<line x1="${X(p)}" y1="${Y(p)}" x2="${X(n)}" y2="${Y(n)}" class="${on ? "on" : ""}"/>`; }));
  const pts = T.nodes.reduce((a, n) => a + (alloc[n.id] || 0), 0);
  const dots = T.nodes.map(n => { const r = alloc[n.id] || 0;
    return `<span class="hl-dot ${r ? "r" + r : ""} ${eq.has(n.id) ? "eq" : ""}" style="left:${(X(n) / SK_W * 100).toFixed(2)}%;top:${(Y(n) / H * 100).toFixed(2)}%" data-tip="${esc(n.name)}${r ? ` · rank ${r}/3` : ""}${eq.has(n.id) ? " · equipped" : ""}">${r ? icon(n.icon) : ""}</span>`; }).join("");
  return `<div class="hl-tree ${pts ? "" : "idle"}" style="--tc:${col}">
    <div class="hl-tree-head">${icon(TREE_META[tree].sigil)}<b>${esc(T.name)}</b><span class="mono">${pts}</span></div>
    <div class="hl-tree-canvas" style="aspect-ratio:${SK_W}/${H}"><svg viewBox="0 0 ${SK_W} ${H}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${dots}</div>
  </div>`;
}
function hlLibrary(){
  const b = BUILDS.find(x => x.id === P("b")) || BUILDS[0];
  const by = hlBuildTrees(b.alloc), pts = Object.values(by).reduce((a, n) => a + n, 0), mutAp = b.mutations.reduce((a, id) => a + ((MUTATIONS.find(m => m.id === id) || {}).ap || 0), 0);
  const dom = hlDominant(by), all = allSkills();
  return `
  <nav class="hl-banners" aria-label="Recommended builds">${BUILDS.map(x => { const d = hlDominant(hlBuildTrees(x.alloc));
    return `<button class="hl-banner" style="--tc:${TREE_META[d].color}" aria-pressed="${x.id === b.id}" data-action="set-param" data-k="b" data-v="${x.id === BUILDS[0].id ? "" : x.id}">${art(x.art)}<span class="hl-banner-sigil">${icon(TREE_META[d].sigil)}</span><b>${esc(x.name)}</b><small>${esc(x.tag)} · ${esc(x.gear)}</small></button>`; }).join("")}</nav>
  <section class="hl-show" style="--tc:${TREE_META[dom].color}" aria-labelledby="hlTitle">
    <header class="hl-show-head">
      <div><span class="label">${esc(b.tag)} build · from level ${b.level}</span><h2 id="hlTitle">${esc(b.name)}</h2><p>${esc(b.summary)}</p></div>
      <div class="hl-show-actions">${favBtn("build", b.id, b.name, false)}<button class="btn btn-primary" data-action="load-build" data-id="${esc(b.id)}">${icon("ph-arrow-square-in")}Load into planner</button></div>
    </header>
    <div class="hl-split" aria-label="Points by tree">${Object.entries(by).filter(([, n]) => n).map(([t, n]) => `<i style="flex:${n};background:${TREE_META[t].color}" data-tip="${esc(SKILL_TREES[t].name)}: ${n} points"><span>${esc(SKILL_TREES[t].name)} ${n}</span></i>`).join("")}</div>
    <div class="hl-stats">
      <div><b class="mono">${pts}</b><span>skill points</span></div>
      <div><b class="mono">${b.equip.filter(Boolean).length}</b><span>skills slotted</span></div>
      <div><b class="mono">${mutAp}</b><span>mutation points</span></div>
      <div class="hl-mutagens"><span class="label">Mutagens</span><div>${b.mutagens.map(m => `<span class="hl-mutagen ${m || "empty"}" style="${m ? `--mc:${MUTAGEN_HEX[m]}` : ""}" data-tip="${m ? esc(MUTAGEN_COLORS[m].label + ": boosts " + MUTAGEN_COLORS[m].hint) : "Empty mutagen slot"}">${icon("ph-drop")}</span>`).join("")}</div></div>
    </div>
    <div class="hl-constellation">${Object.keys(SKILL_TREES).map(t => hlMiniTree(t, b.alloc, b.equip)).join("")}</div>
    <p class="hl-legend" aria-hidden="true"><span><i class="hl-dot r3"></i>Rank 3</span><span><i class="hl-dot r1"></i>Rank 1 to 2</span><span><i class="hl-dot eq r2"></i>Equipped</span><span><i class="hl-dot"></i>Not taken</span></p>
    <div class="hl-cols">
      <section><h3>${icon("ph-sword")}How it plays</h3><ol class="hl-steps">${b.playstyle.map(p => `<li>${esc(p)}</li>`).join("")}</ol></section>
      <section><h3>${icon("ph-shield-chevron")}Kit</h3><ul class="hl-kit">${b.equipment.map(e => `<li>${esc(e)}</li>`).join("")}</ul>
        ${b.mutations.length ? `<h3 style="margin-top:16px">${icon("ph-dna")}Mutations</h3><div class="hl-muts">${b.mutations.map(id => { const m = MUTATIONS.find(x => x.id === id); return `<span class="hl-mut" data-tip="${esc(m.cost)}">${esc(m.name)} <b class="mono">${m.ap} AP</b></span>`; }).join(`<i class="ph ph-arrow-right" aria-hidden="true"></i>`)}</div><p class="dim" style="font-size:.8rem;margin:6px 0 0">Requires Blood and Wine.</p>` : ""}
      </section>
    </div>
    <p class="src">Editorial recommendation for the Remastered skill trees, not an official build. Skill names, ranks and connections come from the wiki.</p>
  </section>
  <section class="section" aria-labelledby="savedTitle"><h2 id="savedTitle" class="sr-only">Your saved builds</h2>${jnScrolls()}</section>`;
}
function hlPlannerBanner(){
  const p = PL(), by = hlBuildTrees(p.alloc), pts = Object.values(by).reduce((a, n) => a + n, 0), dom = hlDominant(by);
  const read = !pts ? "An empty slate" : by[dom] / pts >= .6 ? `${SKILL_TREES[dom].name}-focused` : "Hybrid";
  return `<section class="hl-plan-banner" style="--tc:${TREE_META[dom].color}">
    <span class="hl-plan-sigil">${icon(TREE_META[dom].sigil)}</span>
    <div class="hl-plan-id"><span class="label">Current build</span><b>${esc(p.name || "Untitled build")}</b><span class="dim">${read} · level ${p.level}</span></div>
    <div class="hl-gauges">${Object.keys(SKILL_TREES).map(t => { const v = pts ? by[t] / Math.max(...Object.values(by)) * 100 : 0;
      return `<button class="hl-gauge" style="--gc:${TREE_META[t].color};--p:${v.toFixed(1)}" data-action="set-param" data-k="tree" data-v="${t}" data-tip="${esc(SKILL_TREES[t].name)}: ${by[t]} point${by[t] === 1 ? "" : "s"}" aria-label="${esc(SKILL_TREES[t].name)} tree, ${by[t]} points"><span class="mono">${by[t]}</span>${icon(TREE_META[t].sigil)}</button>`; }).join("")}</div>
  </section>`;
}
VIEWS.builds = () => {
  const tab = P("tab") === "planner" ? "planner" : "library";
  return `
  <header class="page-head"><h1>Builds and Skill Planner</h1>
    <p>Study proven builds in the hall, then plan your own across the four Remastered skill trees and forecast the damage.</p></header>
  <div class="qx-tabs" role="tablist">${[["library", "Witchers' hall", "ph-castle-turret", BUILDS.length + state.builds.length], ["planner", "Skill planner", "ph-tree-structure", Object.values(PL().alloc).reduce((a, n) => a + n, 0)]].map(([k, l, ic, n]) =>
    `<button class="qx-tab" role="tab" aria-selected="${tab === k}" data-action="set-param" data-k="tab" data-v="${k === "library" ? "" : k}">${icon(ic)}<span>${l}</span><span class="mono">${n}</span></button>`).join("")}</div>
  ${tab === "planner" ? hlPlannerBanner() + plannerHtml() : hlLibrary()}`;
};
</script>
