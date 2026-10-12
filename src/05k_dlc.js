<script>
"use strict";
/* =====================================================================
   8k. EXPANSION TALES (DLC and New Game+)
   Each expansion's main quests as a tale tree: choose at each decision
   and the path runs on to its ending; picking an ending fills in the
   choices that reach it. NG+ is laid out as a crossing ledger.
   ===================================================================== */
const DL_ICON = {hos:"ph-heart-break", baw:"ph-wine", ng:"ph-arrows-clockwise"};
const dlQuest = name => QUESTS.find(q => q.name === name);
const dlChoice = id => P("d_" + id);

/* Walk a tale with the current choices: returns {html, ends:Set of reachable ending ids, reached} */
function dlWalk(t, steps, depth = 0){
  let html = "", reached = null, open = false;
  for(const s of steps){
    if(open) break;
    if(s.q){ html += dlNode(s); continue; }
    if(s.par){ html += `<div class="dl-par">${s.par.map(dlNode).join("")}</div>${s.note ? `<p class="dl-par-note">${esc(s.note)}</p>` : ""}`; continue; }
    if(s.end){ reached = s.end; html += dlEnd(t, s.end, true); continue; }
    if(s.dec){
      const d = t.decisions[s.dec], pick = dlChoice(s.dec), o = d.opts.find(x => x.id === pick);
      html += `<div class="dl-dec ${o ? "made" : ""} ${d.soft ? "soft" : ""}" role="group" aria-label="${esc(d.title)}">
        <div class="dl-dec-head">${icon("ph-git-fork")}<div><b>${esc(d.title)}</b><span>${esc(d.where)}</span></div></div>
        ${d.note ? `<p class="dl-dec-note">${esc(d.note)}</p>` : ""}${d.soft && !o ? `<p class="dl-dec-note">Optional for the path; it only changes details or later outcomes.</p>` : ""}
        <div class="dl-opts">${d.opts.map(x => `<button class="dl-opt" aria-pressed="${x.id === pick}" data-action="dl-pick" data-d="${s.dec}" data-v="${x.id}"><b>${esc(x.label)}</b><span>${esc(x.body)}</span></button>`).join("")}</div>
      </div>`;
      if(!o){ if(d.soft) continue; open = true; break; }
      let next = o.next;
      if(o.cases){
        const keys = [...new Set(o.cases.flatMap(c => Object.keys(c.when || {})))], unset = keys.filter(k => !dlChoice(k));
        if(unset.length){ html += `<div class="dl-wait">${icon("ph-hand-pointing")}This outcome depends on: ${unset.map(k => esc(t.decisions[k].title)).join(" and ")}. Choose above.</div>`; open = true; break; }
        const c = o.cases.find(c => !c.when || Object.entries(c.when).every(([k, v]) => dlChoice(k) === v)); next = c ? c.next : [];
      }
      const r = dlWalk(t, next || [], depth + 1);
      html += r.html; if(r.reached) reached = r.reached; if(r.open) open = true;
    }
  }
  return {html, reached, open};
}
function dlNode(s){
  const q = dlQuest(s.q), on = q && isChecked(q.id);
  return `<div class="dl-node ${on ? "done" : ""}">
    ${q ? `<label class="dl-seal" title="${on ? "Completed" : "Mark complete"}"><input type="checkbox" data-check="${esc(q.id)}" ${on ? "checked" : ""} aria-label="${esc(s.q)} completed">${icon(on ? "ph-check" : "ph-scroll")}</label>` : `<span class="dl-seal off" aria-hidden="true">${icon("ph-scroll")}</span>`}
    <div class="dl-node-body"><div class="row" style="gap:8px;flex-wrap:wrap">${q ? `<button class="linkish dl-qname" data-open="quest:${q.id}">${esc(s.q)}</button>` : `<b class="dl-qname">${esc(s.q)}</b>`}${s.lvl ? `<span class="mono dl-lvl">Lv ${s.lvl}</span>` : ""}${q && q.missable ? `<span class="dl-miss">${icon("ph-hourglass-medium")}Missable</span>` : ""}</div>
      ${s.note ? `<p>${esc(s.note)}</p>` : ""}</div>
  </div>`;
}
function dlEnd(t, id, live){
  const e = t.endings[id];
  return `<div class="dl-end ${e.tone} ${live ? "live" : ""}">${icon(e.tone === "good" ? "ph-sun-horizon" : e.tone === "unknown" ? "ph-question" : e.tone === "mid" ? "ph-scales" : "ph-skull")}
    <div><span class="label">${live ? "Your ending" : "Ending"}</span><b>${esc(e.title)}</b><p>${esc(e.body)}</p>
    ${e.rewards ? `<ul>${e.rewards.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}</div></div>`;
}
function dlReachable(t, e){
  const cur = Object.keys(t.decisions).reduce((o, k) => (dlChoice(k) && (o[k] = dlChoice(k)), o), {});
  return Object.entries(e.path || {}).every(([k, v]) => !cur[k] || cur[k] === v);
}

VIEWS.dlc = () => {
  const tab = ["hos", "baw", "ng"].includes(P("tab")) ? P("tab") : "hos";
  return `
  <header class="page-head"><h1>DLC and New Game+</h1><p>Walk each expansion's tale, make its choices and see where they lead, then prepare your save for New Game+.</p></header>
  <div class="qx-tabs" role="tablist">${[["hos", "Hearts of Stone"], ["baw", "Blood and Wine"], ["ng", "New Game+"]].map(([k, l]) => {
    const qs = k === "ng" ? NGPLUS.prep : QUESTS.filter(q => q.type === k), d = qs.filter(q => isChecked(q.id)).length;
    return `<button class="qx-tab" role="tab" aria-selected="${tab === k}" data-action="set-param" data-k="tab" data-v="${k === "hos" ? "" : k}">${icon(DL_ICON[k])}<span>${l}</span><span class="mono">${d}/${qs.length}</span></button>`; }).join("")}</div>
  ${tab === "ng" ? ngCrossing() : dlTale(tab)}`;
};
function dlTale(k){
  const d = DLC[k], t = DLC_TALES[k], w = dlWalk(t, t.steps);
  const anyChoice = Object.keys(t.decisions).some(x => dlChoice(x));
  const ends = Object.entries(t.endings).filter(([, e]) => !e.hidden);
  return `<div class="dl-hero">${art(k)}<div class="dl-hero-copy"><span class="label">Expansion · recommended level <span class="mono">${esc(d.level)}</span></span><h2>${esc(d.name)}</h2><p>${icon("ph-door-open")}${esc(d.start)}</p></div></div>
  <div class="dl-layout">
    <section class="dl-board" aria-labelledby="dlTreeTitle">
      <div class="dl-board-head"><h2 id="dlTreeTitle">The tale</h2>${anyChoice ? `<button class="btn btn-sm" data-action="dl-reset">${icon("ph-arrow-counter-clockwise")}Clear choices</button>` : ""}</div>
      <div class="dl-path">${w.html}${w.open && !/dl-wait/.test(w.html.slice(-400)) ? `<div class="dl-wait">${icon("ph-hand-pointing")}Choose above to continue the tale.</div>` : ""}
        ${t.epilogue && w.reached && w.reached !== "baw-unknown" ? dlNode(t.epilogue) : ""}</div>
    </section>
    <aside class="dl-side">
      <section class="dl-endings"><h3>Endings</h3><p class="dim">Pick an ending to set the choices that reach it.</p>
        ${ends.map(([id, e]) => { const r = dlReachable(t, e), live = w.reached === id;
          return `<button class="dl-endpick ${e.tone} ${live ? "live" : ""} ${r ? "" : "closed"}" data-action="dl-end" data-id="${id}"><b>${esc(e.title)}</b><span>${live ? "Your path ends here" : r ? "Still reachable" : "Closed by your choices"}</span></button>`; }).join("")}
        ${w.reached === "baw-unknown" ? `<p class="dl-unknown">${icon("ph-question")}${esc(t.endings["baw-unknown"].body)}</p>` : ""}
      </section>
      <section class="dl-codex"><h3>What it adds</h3><ul class="clean">${d.features.map(f => `<li>${esc(f)}</li>`).join("")}</ul>
        <h3 style="margin-top:16px">New enemies</h3>
        <div class="dl-foes">${d.enemies.map(e => { const m = MONSTERS.find(x => x.name === e || e.startsWith(x.name));
          return m ? `<button class="dl-foe" data-open="monster:${m.id}"><span class="dl-foe-pic">${m.img ? `<img src="${bxImg(m, 80)}" alt="" loading="lazy" onload="this.classList.add('ok')" onerror="this.remove()">` : ""}${icon("ph-skull")}</span>${esc(e)}</button>` : `<span class="dl-foe plain"><span class="dl-foe-pic">${icon("ph-skull")}</span>${esc(e)}</span>`; }).join("")}</div>
      </section>
    </aside>
  </div>
  ${srcLine([...t.src, ...d.src])}`;
}
function ngCrossing(){
  const done = NGPLUS.prep.filter(p => isChecked(p.id)).length, pct = Math.round(done / NGPLUS.prep.length * 100);
  return `<div class="ng-gate">
      <div class="ng-ring" style="--p:${pct}"><span class="mono">${done}/${NGPLUS.prep.length}</span><small>ready</small></div>
      <div><span class="label">Requirement</span><p>${esc(NGPLUS.requirement)}</p></div>
    </div>
    <section class="ng-cross" aria-label="What crosses into New Game+">
      <div class="ng-col keep"><h3>${icon("ph-check-circle")}Crosses over</h3><ul>${NGPLUS.keeps.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="ng-river" aria-hidden="true">${icon("ph-arrows-clockwise")}</div>
      <div class="ng-col lose"><h3>${icon("ph-x-circle")}Left behind</h3><ul>${NGPLUS.loses.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
    </section>
    <section class="section"><h2 style="margin-bottom:12px">How the world scales</h2>
      <div class="ng-scale">${NGPLUS.scaling.map((x, i) => `<div class="ng-scale-step"><span class="mono">${i + 1}</span><p>${esc(x)}</p></div>`).join("")}</div></section>
    <section class="section"><div class="row between"><h2>Before you cross</h2><span class="mono dim">${done}/${NGPLUS.prep.length}</span></div>
      <div class="ng-prep">${NGPLUS.prep.map(p => { const on = isChecked(p.id);
        return `<label class="ng-rite ${on ? "on" : ""}"><input type="checkbox" data-check="${p.id}" ${on ? "checked" : ""}><span class="ng-rite-box">${icon(on ? "ph-check" : "ph-circle")}</span><span>${esc(p.text)}</span></label>`; }).join("")}</div>
      ${srcLine(NGPLUS.src)}</section>`;
}
function dlPick(d, v){ setParams({["d_" + d]: dlChoice(d) === v ? "" : v}); render(true); }
function dlEndPick(id){
  const k = P("tab") || "hos", t = DLC_TALES[k], e = t && t.endings[id]; if(!e) return;
  const clear = Object.keys(t.decisions).reduce((o, x) => (o["d_" + x] = "", o), {});
  for(const [x, v] of Object.entries(e.path)) clear["d_" + x] = v;
  setParams(clear); render(true);
  $(".dl-end.live")?.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block:"center"});
}
function dlReset(){ const k = P("tab") || "hos", t = DLC_TALES[k]; setParams(Object.keys(t.decisions).reduce((o, x) => (o["d_" + x] = "", o), {})); render(true); }
</script>
