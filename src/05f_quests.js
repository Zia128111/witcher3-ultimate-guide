<script>
"use strict";
/* =====================================================================
   8f. QUEST JOURNAL
   Chronicle (main story path), notice board (contracts) and journal
   (everything else), sharing one inspector. The chronicle follows the
   order of the guide's main-quest list; Act I regions can be played in
   any order, so they are drawn as parallel lanes.
   ===================================================================== */
const QX_W = 500, QX_STEP = 92;
const CHAPTERS = [
  {act:"Prologue", title:"Prologue", sub:"White Orchard and Vizima", color:"#c8a456", lane:250},
  {act:"Act I: Velen", title:"Velen", sub:"Act I", color:"#a5824a", lane:90, group:"act1"},
  {act:"Act I: Novigrad", title:"Novigrad", sub:"Act I", color:"#5a86c9", lane:250, group:"act1"},
  {act:"Act I: Skellige", title:"Skellige", sub:"Act I", color:"#4fa3a5", lane:410, group:"act1"},
  {act:"Act II", title:"Act II", sub:"The gathering storm", color:"#b1332c", lane:250},
  {act:"Act III", title:"Act III", sub:"The final battles", color:"#c4453a", lane:250}
];
const qById = id => QUESTS.find(q => q.id === id);
const stepKey = (q, i) => `qs:${q.id}:${i}`;
const mainQuests = () => QUESTS.filter(q => q.type === "main");
const nextMain = () => mainQuests().find(q => !isChecked(q.id));
function contractMonster(q){
  if(q.type !== "contract" || !q.target) return null;
  const t = q.target.toLowerCase();
  const names = MONSTERS.map(m => [m, m.name.split(" (")[0].toLowerCase()]).sort((a, b) => b[1].length - a[1].length);
  const hit = names.find(([, n]) => new RegExp("\\b" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "s?\\b").test(t));
  return hit ? hit[0] : null;
}
function questDest(q){ return q.type === "main" ? "" : q.type === "contract" ? "board" : "journal"; }

/* ---------- Layout of the chronicle ---------- */
function chronicleLayout(){
  const nodes = [], labels = [], edges = [];
  let y = 40;
  const place = (ch, list, startY) => list.map((q, i) => ({q, ch, x:ch.lane, y:startY + i * QX_STEP}));
  const pro = CHAPTERS[0], proQ = mainQuests().filter(q => q.act === pro.act);
  labels.push({x:pro.lane, y, ch:pro}); y += 78;
  const proN = place(pro, proQ, y); nodes.push(...proN); y += proQ.length * QX_STEP;
  labels.push({x:250, y:y + 4, title:"Act I", sub:"Three regions, any order", color:"#b3ad9f", wide:true}); y += 66;
  const lanes = CHAPTERS.filter(c => c.group === "act1").map(ch => {
    labels.push({x:ch.lane, y, ch}); return {ch, list:mainQuests().filter(q => q.act === ch.act)}; });
  y += 70;
  const laneN = lanes.map(l => place(l.ch, l.list, y));
  laneN.forEach(n => nodes.push(...n));
  y += Math.max(...lanes.map(l => l.list.length)) * QX_STEP;
  const tail = [];
  for(const ch of CHAPTERS.slice(4)){
    labels.push({x:ch.lane, y:y + 10, ch}); y += 88;
    const n = place(ch, mainQuests().filter(q => q.act === ch.act), y); nodes.push(...n); tail.push(n);
    y += n.length * QX_STEP;
  }
  const seq = arr => arr.forEach((n, i) => { if(i) edges.push([arr[i - 1], n]); });
  seq(proN); laneN.forEach(seq); tail.forEach(seq);
  laneN.forEach(n => { if(n.length){ edges.push([proN[proN.length - 1], n[0]]); if(tail[0] && tail[0].length) edges.push([n[n.length - 1], tail[0][0]]); } });
  if(tail[0] && tail[1] && tail[1].length) edges.push([tail[0][tail[0].length - 1], tail[1][0]]);
  return {nodes, labels, edges, H:y + 20};
}

/* ---------- Views ---------- */
VIEWS.quests = () => {
  const tab = P("tab");
  const main = mainQuests(), md = main.filter(q => isChecked(q.id)).length;
  const con = QUESTS.filter(q => q.type === "contract"), cd = con.filter(q => isChecked(q.id)).length;
  const other = QUESTS.filter(q => q.type !== "main" && q.type !== "contract"), od = other.filter(q => isChecked(q.id)).length;
  const sel = qById(P("qid"));
  return `
  <header class="page-head"><h1>Quest Guides</h1>
    <p>The main story as a path, contracts on the notice board, and every other quest in the journal. Missable quests show their point of no return.</p></header>
  <div class="qx-tabs" role="tablist">
    ${[["", "Chronicle", "ph-path", `${md}/${main.length}`], ["board", "Notice board", "ph-push-pin", `${cd}/${con.length}`], ["journal", "Journal", "ph-book-open-text", `${od}/${other.length}`]].map(([k, l, ic, n]) =>
      `<button class="qx-tab" role="tab" aria-selected="${tab === k}" data-action="set-param" data-k="tab" data-v="${k}">${icon(ic)}<span>${l}</span><span class="mono">${n}</span></button>`).join("")}
  </div>
  <div class="qx-stage">
    <div class="qx-main">${tab === "board" ? boardHtml() : tab === "journal" ? journalHtml() : chronicleHtml()}</div>
    <aside class="qx-inspector" id="qxInspector" aria-live="polite">${questInspector(sel)}</aside>
  </div>`;
};
function chronicleHtml(){
  const L = chronicleLayout(), nx = nextMain(), selId = P("qid");
  const lines = L.edges.map(([a, b]) => { const on = isChecked(a.q.id) && isChecked(b.q.id), open = isChecked(a.q.id) && !isChecked(b.q.id);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${on ? "on" : open ? "open" : ""}" style="--tc:${b.ch.color}"/>`; }).join("");
  const nodes = L.nodes.map((n, i) => { const q = n.q, d = isChecked(q.id);
    return `<button class="qx-node ${d ? "done" : ""} ${nx && nx.id === q.id ? "next" : ""} ${selId === q.id ? "sel" : ""}" style="left:${n.x / QX_W * 100}%;top:${n.y / L.H * 100}%;--tc:${n.ch.color};--i:${i}"
      data-action="qx-select" data-id="${q.id}" aria-label="${esc(q.name)}${d ? ", completed" : nx && nx.id === q.id ? ", next" : ""}${q.missable ? ", has a missable warning" : ""}">
      <span class="qx-medal">${icon(d ? "ph-check" : "ph-crown-simple")}${q.missable ? `<i class="ph ph-hourglass-medium qx-badge" aria-hidden="true"></i>` : ""}</span>
      <span class="qx-name">${esc(q.name)}</span>${q.level ? `<span class="qx-lvl mono">Lv ${q.level}</span>` : ""}</button>`; }).join("");
  const labels = L.labels.map(l => { const t = l.ch ? l.ch.title : l.title, s = l.ch ? l.ch.sub : l.sub, c = l.ch ? l.ch.color : l.color;
    return `<div class="qx-chapter ${l.wide ? "wide" : ""}" style="left:${l.x / QX_W * 100}%;top:${l.y / L.H * 100}%;--tc:${c}"><b>${esc(t)}</b><span>${esc(s)}</span></div>`; }).join("");
  const misses = mainQuests().concat(QUESTS.filter(q => q.type !== "main")).filter(q => q.missable && !isChecked(q.id)).slice(0, 6);
  return `<section class="qx-board" aria-label="Main story path">
      <div class="qx-canvas" style="aspect-ratio:${QX_W}/${L.H}">
        <svg class="qx-lines" viewBox="0 0 ${QX_W} ${L.H}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${labels}${nodes}</div>
      <div class="qx-legend" aria-hidden="true"><span><i class="lg qx-lg-done"></i>Completed</span><span><i class="lg qx-lg-next"></i>Next</span><span>${icon("ph-hourglass-medium")}Missable warning</span></div>
      <p class="src" style="margin:6px 0 0;text-align:center">Order follows the guide's main-quest list. Act I regions can be played in any order.</p>
    </section>
    ${misses.length ? `<section class="section"><h2>Points of no return</h2><div class="qx-misses">${misses.map(q => `<button class="qx-miss" data-action="qx-select" data-id="${q.id}">${icon("ph-hourglass-medium")}<span><b>${esc(q.name)}</b><span>${esc(q.missable)}</span></span></button>`).join("")}</div></section>` : ""}`;
}
function boardHtml(){
  const r = P("r"), st = P("status"), selId = P("qid");
  const regs = [...new Set(QUESTS.filter(q => q.type === "contract").map(q => q.region))];
  const list = QUESTS.filter(q => q.type === "contract" && (!r || q.region === r) && (!st || (st === "done") === isChecked(q.id)));
  return `<section class="qx-noticeboard" aria-label="Contract notice board">
    <div class="qx-nb-head"><div class="chips">${[["", "All regions"], ...regs.map(x => [x, regionName(x)])].map(([v, l]) => `<button class="chip" aria-pressed="${r === v}" data-action="set-param" data-k="r" data-v="${v}">${esc(l)}</button>`).join("")}</div>
      ${selectField("status", "Status", [["", "Any"], ["open", "Open"], ["done", "Completed"]], st)}</div>
    ${list.length ? `<div class="qx-notices">${list.map((q, i) => { const m = contractMonster(q), d = isChecked(q.id);
      return `<button class="qx-notice ${d ? "done" : ""} ${selId === q.id ? "sel" : ""}" style="--tilt:${(i % 3 - 1) * 0.8}deg" data-action="qx-select" data-id="${q.id}" aria-label="${esc(q.name)}${d ? ", completed" : ""}">
        <span class="qx-pin" aria-hidden="true"></span>
        ${m && m.img ? `<span class="qx-notice-art"><img src="${bxImg(m, 220)}" alt="" loading="lazy" onerror="this.remove()"></span>` : `<span class="qx-notice-art qx-noart">${icon("ph-skull")}</span>`}
        <span class="qx-notice-kicker">Witcher wanted</span>
        <span class="qx-notice-title">${esc(q.name.replace(/^Contract: /, ""))}</span>
        <span class="qx-notice-target">${esc(q.target || "")}</span>
        <span class="qx-notice-meta">${esc(regionName(q.region))}${q.level ? ` · Lv ${q.level}` : ""}</span>
        ${d ? `<span class="qx-seal" aria-hidden="true">${icon("ph-check-fat ph-fill")}</span>` : ""}
      </button>`; }).join("")}</div>` : emptyState("ph-push-pin", "Nothing pinned here", "No contracts match these filters.", `<button class="btn" data-action="clear-filters">Clear filters</button>`)}
  </section>`;
}
function journalHtml(){
  const type = P("type");
  const types = Object.entries(QUEST_TYPES).filter(([k]) => k !== "main");
  return `<div class="chips qx-types" role="group" aria-label="Quest type">${[["", "All", "ph-books"], ...types.map(([k, t]) => [k, t.label, t.icon])].map(([k, l, ic]) =>
      `<button class="chip" aria-pressed="${type === k}" data-action="set-param" data-k="type" data-v="${k}">${icon(ic)}${esc(l)}<span class="n">${QUESTS.filter(q => (k ? q.type === k : q.type !== "main")).length}</span></button>`).join("")}</div>
    <div class="toolbar" style="margin-top:12px">
      ${searchField("q", "Search quests", "Quest, monster or reward")}
      ${selectField("r", "Region", [["", "All regions"], ...REGIONS.map(r => [r.id, r.name])], P("r"))}
      ${selectField("status", "Status", [["", "Any"], ["open", "Not done"], ["done", "Completed"]], P("status"))}
      ${selectField("sort", "Sort", [["", "Guide order"], ["level", "Level"], ["name", "Name"]], P("sort"))}
      ${switchField("missable", "Missable only")}
    </div>
    <div id="list" aria-live="polite">${VIEWS.quests_list()}</div>`;
}
VIEWS.quests_list = () => {
  const type = P("type"), r = P("r"), q = P("q").toLowerCase(), st = P("status"), sort = P("sort"), miss = P("missable"), selId = P("qid");
  let list = QUESTS.filter(x => x.type !== "main" && (!type || x.type === type) && (!r || x.region === r) && (!miss || x.missable)
    && (!st || (st === "done" ? isChecked(x.id) : !isChecked(x.id)))
    && (!q || [x.name, x.target, x.rewards, x.missable, x.note, x.start].join(" ").toLowerCase().includes(q)));
  if(sort === "level") list = [...list].sort((a, b) => (a.level ?? 999) - (b.level ?? 999));
  if(sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  if(!list.length) return emptyState("ph-scroll", "No entries match", "Try another type, region or status.", `<button class="btn" data-action="clear-filters">Clear filters</button>`);
  return `<p class="dim" style="font-size:.88rem;margin:0 0 8px">${list.length} entries, ${list.filter(x => isChecked(x.id)).length} completed</p>
    <div class="qx-entries">${list.map(x => { const t = QUEST_TYPES[x.type], d = isChecked(x.id), m = contractMonster(x);
      return `<button class="qx-entry ${d ? "done" : ""} ${selId === x.id ? "sel" : ""}" data-action="qx-select" data-id="${x.id}">
        <span class="qx-entry-medal">${m && m.img ? `<img src="${bxImg(m, 96)}" alt="" loading="lazy" onerror="this.remove()">` : ""}${icon(d ? "ph-check" : t.icon)}</span>
        <span class="qx-entry-main"><span class="qx-entry-name">${esc(x.name)}</span>
          <span class="qx-entry-meta">${esc(t.label)} · ${esc(regionName(x.region))}${x.level ? ` · Lv ${x.level}` : ""}${x.steps ? ` · ${x.steps.filter((s, i) => isChecked(stepKey(x, i))).length}/${x.steps.length} steps` : ""}</span></span>
        ${x.missable ? `<span class="tag tag-warn">${icon("ph-hourglass-medium")}Missable</span>` : ""}
      </button>`; }).join("")}</div>`;
};

/* ---------- Inspector ---------- */
function questInspector(q){
  if(!q){
    const nx = nextMain();
    return `<div class="qx-insp-empty">${icon("ph-book-open-text")}<h3>Witcher's journal</h3><p class="muted">Select a quest to read its details, tick off walkthrough steps and see any point of no return.</p>
      ${nx ? `<button class="btn btn-primary" data-action="qx-select" data-id="${nx.id}">${icon("ph-crown-simple")}Next: ${esc(nx.name)}</button>` : `<p class="dim">Main story complete.</p>`}</div>`;
  }
  const t = QUEST_TYPES[q.type], d = isChecked(q.id), m = contractMonster(q), nx = nextMain();
  const ch = CHAPTERS.find(c => c.act === q.act), tc = ch ? ch.color : "#b1332c";
  const stepsDone = q.steps ? q.steps.filter((s, i) => isChecked(stepKey(q, i))).length : 0;
  return `<div class="qx-insp-head" style="--tc:${tc}">
      <span class="qx-medal lg">${icon(d ? "ph-check" : t.icon)}</span>
      <div><span class="label">${esc(t.label)}${q.act ? " · " + esc(q.act) : ""}</span><h3>${esc(q.name)}</h3>
        <span class="qx-status ${d ? "done" : nx && nx.id === q.id ? "next" : ""}">${d ? "Completed" : nx && nx.id === q.id ? "Next in the story" : "Not completed"}</span></div>
      <button class="btn btn-ghost btn-icon btn-sm" data-action="qx-close" aria-label="Close quest" style="margin-left:auto">${icon("ph-x")}</button>
    </div>
    <div class="row" style="margin:14px 0">
      <label class="bx-study qx-done ${d ? "on" : ""}"><input type="checkbox" data-check="${esc(q.id)}" ${d ? "checked" : ""}>${icon(d ? "ph-seal-check" : "ph-seal")}<span>${d ? "Completed" : "Mark complete"}</span></label>
      ${favBtn("quest", q.id, q.name, false)}
    </div>
    ${q.missable ? `<div class="notice danger" style="margin-bottom:14px">${icon("ph-hourglass-medium")}<div><strong>Point of no return.</strong> ${spoil(esc(q.missable))}</div></div>` : ""}
    <dl class="kv">
      <dt>Region</dt><dd><a href="#/world?r=${esc(q.region)}">${esc(regionName(q.region))}</a>${REGION_TO_MAP[q.region] ? ` · <a href="#/map?m=${REGION_TO_MAP[q.region]}">map</a>` : ""}</dd>
      <dt>Level</dt><dd>${q.level ? `<span class="mono">${q.level}</span>` : '<span class="dim">Not stated</span>'}</dd>
      ${q.start ? `<dt>Starts</dt><dd>${esc(q.start)}</dd>` : ""}
      ${q.prereq ? `<dt>Prerequisite</dt><dd>${esc(q.prereq)}</dd>` : ""}
      ${q.target ? `<dt>Target</dt><dd>${esc(q.target)}</dd>` : ""}
      ${q.rewards ? `<dt>Rewards</dt><dd>${spoil(esc(q.rewards))}</dd>` : ""}
    </dl>
    ${m ? `<button class="qx-foe" data-open="monster:${m.id}">${m.img ? `<img src="${bxImg(m, 200)}" alt="" loading="lazy" onerror="this.remove()">` : icon("ph-skull")}
      <span><span class="label">Know your foe</span><b>${esc(m.name)}</b><span class="dim">${m.signs.length ? "Weak to " + esc(m.signs.join(", ")) : "No Sign weakness listed"}${m.oil ? " · " + esc(m.oil) : ""}</span><span class="qx-foe-link">Open in bestiary ${icon("ph-arrow-right")}</span></span></button>` : ""}
    <h4 class="sk-h4">Walkthrough ${q.steps ? `<span class="mono dim" style="font-size:.85rem">${stepsDone}/${q.steps.length}</span>` : ""}</h4>
    ${q.steps ? spoil(`<ol class="qx-steps">${q.steps.map((s, i) => `<li class="${isChecked(stepKey(q, i)) ? "done" : ""}"><label class="check"><input type="checkbox" data-check="${stepKey(q, i)}" ${isChecked(stepKey(q, i)) ? "checked" : ""}><span>${esc(s)}</span></label></li>`).join("")}</ol>`)
      + (q.srcUrl ? `<p class="src" style="margin-top:8px">Steps paraphrased from <a href="${esc(q.srcUrl)}" target="_blank" rel="noopener noreferrer">this page</a>. Verify in game.</p>` : "")
      : `<p class="muted" style="font-size:.92rem">No walkthrough written for this quest yet.</p>`}
    ${q.note ? `<div class="notice info" style="margin-top:12px">${icon("ph-info")}<div>${esc(q.note)}</div></div>` : ""}
    <div class="row" style="margin-top:14px">${vTag(q.v)}</div>${srcLine(q.src)}`;
}
function qxSelect(id){
  const q = qById(id); if(!q) return;
  const dest = questDest(q);
  if((P("tab") || "") !== dest){ go("quests", {tab:dest, qid:id}); return; }
  setParams({qid:id});
  const box = $("#qxInspector"); if(box) box.innerHTML = questInspector(q);
  $$("[data-action='qx-select'].sel").forEach(b => b.classList.remove("sel"));
  $$(`.qx-node[data-id="${CSS.escape(id)}"], .qx-notice[data-id="${CSS.escape(id)}"], .qx-entry[data-id="${CSS.escape(id)}"]`).forEach(b => b.classList.add("sel"));
  if(box && matchMedia("(max-width:1100px)").matches) box.scrollIntoView({behavior: state.settings.reduceMotion ? "auto" : "smooth", block:"start"});
}
</script>
