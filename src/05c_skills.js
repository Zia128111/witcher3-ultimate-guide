<script>
"use strict";
/* =====================================================================
   8c. SKILL TREE PLANNER (Remastered)
   Unlock rule (wiki): a tree's starting nodes are always available; any
   other node needs a point in at least one of its listed prerequisites.
   Removing a point is refused if it would strand an invested node.
   The forecast pulls every number from the node's level text with a
   regex, so nothing is typed in by hand. It is a simplified estimate.
   ===================================================================== */
const TREE_META = {
  combat:{color:"#c4453a", mutagen:"red", sigil:"ph-sword"},
  signs:{color:"#5a86c9", mutagen:"blue", sigil:"ph-hexagon"},
  alchemy:{color:"#6aa25c", mutagen:"green", sigil:"ph-flask"},
  general:{color:"#c8a456", mutagen:null, sigil:"ph-compass-rose"}
};
const MUTAGEN_COLORS = {red:{label:"Red mutagen", hint:"attack power"}, blue:{label:"Blue mutagen", hint:"Sign intensity"}, green:{label:"Green mutagen", hint:"Vitality"}};
const SIM_DEFAULTS = {weapon:1000, intensity:100, vitality:5000, bomb:300, adrenaline:3, toxicity:50, armor:"medium", pieces:4};
const SK_STEP = 95, SK_W = 500;
const PL = () => state.planner;
const rankOf = id => PL().alloc[id] || 0;
const nodeOf = id => allSkills()[id];
const isRoot = id => !nodeOf(id).pre.length;
const canUnlock = (id, alloc = PL().alloc) => isRoot(id) || nodeOf(id).pre.some(p => (alloc[p] || 0) > 0);
function reachable(alloc){
  const ok = new Set(); let grew = true;
  while(grew){ grew = false;
    for(const id in alloc){ if(ok.has(id) || !alloc[id]) continue;
      if(isRoot(id) || nodeOf(id).pre.some(p => ok.has(p))){ ok.add(id); grew = true; } } }
  return ok;
}
function planValid(alloc = PL().alloc){ const r = reachable(alloc); return Object.keys(alloc).every(id => !alloc[id] || r.has(id)); }
function treePoints(tree){ let n = 0; for(const id in PL().alloc) if(nodeOf(id).tree === tree) n += PL().alloc[id]; return n; }
function planStats(){
  const p = PL();
  const available = Math.max(0, p.level - 1) + p.pop + p.bonus;
  const skillSpent = Object.values(p.alloc).reduce((a, n) => a + n, 0);
  const mutSpent = p.mutations.reduce((a, id) => a + MUTATIONS.find(m => m.id === id).ap, 0);
  const extraSlots = MUTATION_SLOT_STEPS.filter(n => p.mutations.length >= n).length;
  const passive = {};
  for(const t in SKILL_TREES){ passive[t] = 0; SKILL_TREES[t].nodes.forEach(n => { const r = rankOf(n.id); if(r) passive[t] += n.passive[r - 1]; }); }
  return {available, skillSpent, mutSpent, remaining: available - skillSpent - mutSpent, slots: 12 + extraSlots, extraSlots,
    mutagenSlots: MUTAGEN_SLOT_LEVELS.filter(l => p.level >= l).length, passive};
}
function equipSlots(){ const n = planStats().slots; const e = PL().equip.slice(0, n); while(e.length < n) e.push(null); return e; }

/* ---------- Forecast ---------- */
function forecast(alloc){
  const s = Object.assign({}, SIM_DEFAULTS, PL().sim);
  const R = id => alloc[id] || 0;
  const T = id => R(id) ? nodeOf(id).levels[R(id) - 1].join(" ") : "";
  const N = (id, re, g = 1) => { const m = T(id).match(re); return m ? parseFloat(m[g]) : 0; };
  const pcs = k => s.armor === k ? s.pieces : 0;
  const light = pcs("light"), med = pcs("medium"), heavy = pcs("heavy"), A = s.adrenaline;
  const pas = t => SKILL_TREES[t].nodes.reduce((a, n) => a + (R(n.id) ? n.passive[R(n.id) - 1] : 0), 0);
  const v = {
    catFast:N("g-cat-school-techniques", /Fast Attack damage by (\d+)%/), catCrit:N("g-cat-school-techniques", /critical hit damage by (\d+)%/),
    wolfW:N("g-wolf-school-techniques", /weapon damage by (\d+)%/), wolfS:N("g-wolf-school-techniques", /Sign intensity by (\d+)%/),
    bearV:N("g-bear-school-techniques", /Vitality by (\d+)%/), bearS:N("g-bear-school-techniques", /Strong Attack damage by (\d+)%/),
    grifS:N("g-griffin-school-techniques", /Sign intensity by (\d+)%/), grifR:N("g-griffin-school-techniques", /Stamina regeneration by ([\d.]+)/),
    manS:N("g-manticore-school-techniques", /sword damage by (\d+)%/), manB:N("g-manticore-school-techniques", /bomb damage by (\d+)%/),
    vipV:N("g-viper-school-techniques", /Vitality by (\d+)%/),
    mm:N("c-muscle-memory", /(\d+)% additional damage/), mmHits:R("c-muscle-memory") ? (N("c-muscle-memory", /next (\d+) Fast/) || 1) : 0,
    st:N("c-strength-training", /damage by (\d+)%/), cbC:N("c-crushing-blow", /(\d+)% chance/), cbB:N("c-crushing-blow", /by (\d+)%/),
    ca:N("c-counterattack", /deals (\d+)% additional damage/), rend:N("c-rend", /by (\d+)% per point/), crip:N("c-crippling-strike", /taken (\d+)%/),
    sunder:N("c-sunder-armor", /by (\d+)%/), sunderN:N("c-sunder-armor", /up to (\d+)/),
    eos:N("g-element-of-surprise", /melee damage by (\d+)%/), elem:N("g-elemental-attunement", /by (\d+)%/),
    bf:N("g-battle-frenzy", /by (\d+)% per Adrenaline/), surv:N("g-survival-instinct", /Vitality by (\d+)%/),
    burst:N("g-adrenaline-burst", /generation by (\d+)%/), razor:N("c-razor-focus", /strikes by (\d+)%/),
    focus:N("s-focus", /by (\d+)% per Adrenaline/), flood:N("c-flood-of-anger", /Sign intensity by (\d+)%/),
    chain:N("s-chain-reaction", /by (\d+)%/), chainN:N("s-chain-reaction", /up to (\d+)/), catalyst:N("s-catalyst", /intensity by (\d+)%/),
    reson:N("s-resonance", /equal to (\d+)% Sign intensity/),
    pyro:N("a-pyrotechnics", /deal (\d+) damage/), vol:N("a-volatile-compound", /by ([\d.]+)% per point/),
    clN:N("a-cluster-bombs", /into (\d+) fragments/), clP:N("a-cluster-bombs", /dealing (\d+)%/),
    tissue:N("a-tissue-transmutation", /by (\d+) for/), endure:N("a-endure-pain", /by (\d+)% if/), potent:N("a-potent-sting", /additional (\d+)% damage/)
  };
  const D = s.weapon, fast = D * (1 + (v.catFast * light + v.wolfW * med + v.manS * med) / 100);
  const strong = D * (1 + (v.bearS * heavy + v.wolfW * med + v.manS * med) / 100);
  const I = s.intensity + v.wolfS * med + v.grifS * med + v.focus * A;
  const V = s.vitality * (1 + (pas("general") + v.surv + v.bearV * heavy + v.vipV * med) / 100);
  const bomb = (s.bomb + v.pyro) * (1 + (pas("alchemy") + v.manB * med) / 100);
  const row = (label, base, value, show, note) => ({label, base, value, show: show !== false, note: note || ""});
  return {
    v,
    melee:{base:D, unit:"", rows:[
      row("Fast attack", D, fast),
      row(`Fast attack after a dodge${v.mmHits > 1 ? ` (next ${v.mmHits})` : ""}`, D, fast * (1 + v.mm / 100), !!v.mm),
      row("Strong attack", D, strong),
      row("Strong attack after fast attacks", D, strong * (1 + v.st / 100), !!v.st),
      row(`Strong attack, Crushing Blow proc (${v.cbC}% chance)`, D, strong * (1 + v.cbB / 100), !!v.cbB),
      row("Next attack after a counter or dodge", D, fast * (1 + v.ca / 100), !!v.ca),
      row(`Rend at ${A} adrenaline`, D, strong * (1 + v.rend * A / 100), !!v.rend, "Plus stamina-scaled damage, which is not modelled. Ignores defenses."),
      row("Hit on a crippled enemy", D, fast * (1 + v.crip / 100), !!v.crip),
      row("Melee hit after a bomb", D, fast * (1 + v.eos / 100), !!v.eos),
      row("Poisoned blade hit", D, fast * (1 + v.potent / 100), !!v.potent)
    ]},
    signs:{base:s.intensity, unit:"%", rows:[
      row("Sign intensity", s.intensity, I),
      row("Cast with Flood of Anger", s.intensity, I + v.flood, !!v.flood, "Consumes 3 adrenaline."),
      row(`Full Chain Reaction (${v.chainN} stacks)`, s.intensity, I + v.chain * v.chainN, !!v.chain),
      row("Aard or Igni vs enemies in Yrden", s.intensity, I + v.catalyst, !!v.catalyst)
    ]},
    survival:{base:s.vitality, unit:"", rows:[
      row("Maximum Vitality", s.vitality, V),
      row("With a decoction active", s.vitality, V + v.tissue, !!v.tissue),
      row("Above the safe Toxicity threshold", s.vitality, V * (1 + v.endure / 100), !!v.endure)
    ]},
    bombs:{base:s.bomb, unit:"", rows:[
      row("Bomb hit", s.bomb, bomb),
      row(`At ${s.toxicity} Toxicity (Volatile Compound)`, s.bomb, bomb * (1 + v.vol * s.toxicity / 100), !!v.vol),
      row("Fire or frost bomb (Elemental Attunement)", s.bomb, bomb * (1 + v.elem / 100), !!v.elem),
      row(`Cluster fragments (${v.clN} at ${v.clP}%)`, s.bomb, bomb * v.clN * v.clP / 100, !!v.clN, "Total if every fragment hits.")
    ]},
    totals:[
      ["Adrenaline gain", `+${(pas("combat") + v.burst).toFixed(0)}%`],
      ["Adrenaline from weapon hits", v.razor ? `+${v.razor}%` : "0%"],
      ["Stamina regen in combat", `+${(pas("signs") + v.grifR * med).toFixed(1)}/s`],
      ["Potion duration", `+${pas("alchemy")}%`],
      ["Crit damage (Cat school)", `+${v.catCrit * light}%`],
      ["Crit chance per adrenaline", `+${v.bf}%`],
      ["Enemy resistance (Sunder)", v.sunder ? `-${v.sunder}% ×${v.sunderN}` : "0%"]
    ]
  };
}
const fmtN = (x, unit) => unit === "%" ? Math.round(x) + "%" : Math.round(x).toLocaleString();

/* ---------- Rendering ---------- */
function plannerHtml(){
  const shared = P("plan");
  if(shared){
    try{ state.planner = cleanPlan(JSON.parse(decodeURIComponent(escape(atob(shared)))), false); save(); setParams({plan:""}); setTimeout(() => toast("Shared build loaded into the planner."), 50); }
    catch(e){ setParams({plan:""}); setTimeout(() => toast("That share link is damaged and could not be loaded.", "err"), 50); }
  }
  const want = P("skill") && nodeOf(P("skill")) ? P("skill") : null;
  const tree = SKILL_TREES[P("tree")] ? P("tree") : want ? nodeOf(want).tree : "combat";
  const sel = want && nodeOf(want).tree === tree ? want : null;
  const st = planStats(), p = PL();
  return `
  <section class="sk-ledger" aria-label="Skill points">
    <div class="sk-led"><span class="label">Available</span><b class="mono">${st.available}</b></div>
    <div class="sk-led"><span class="label">Spent</span><b class="mono">${st.skillSpent + st.mutSpent}</b></div>
    <div class="sk-led ${st.remaining < 0 ? "neg" : st.remaining === 0 ? "zero" : ""}"><span class="label">Remaining</span><b class="mono">${st.remaining}</b></div>
    <label class="sk-led field"><span class="label">Level</span><input class="input" type="number" min="1" max="100" value="${p.level}" data-plan="level"></label>
    <label class="sk-led field"><span class="label">Places of Power</span><input class="input" type="number" min="0" max="30" value="${p.pop}" data-plan="pop"></label>
    <label class="sk-led field"><span class="label">Bonus points</span><input class="input" type="number" min="0" max="20" value="${p.bonus}" data-plan="bonus"></label>
  </section>
  <div class="sk-sigils" role="tablist" aria-label="Skill trees">${Object.entries(SKILL_TREES).map(([k, t]) =>
    `<button class="sk-sigil" role="tab" aria-selected="${k === tree}" style="--tc:${TREE_META[k].color}" data-action="set-param" data-k="tree" data-v="${k}">${icon(TREE_META[k].sigil)}<span>${esc(t.name)}</span><span class="mono">${treePoints(k)}</span></button>`).join("")}</div>
  <div class="sk-stage">
    <div class="sk-board">${treeCanvas(tree, sel)}
      <div class="sk-legend" aria-hidden="true"><span><i class="lg lg-has"></i>Invested</span><span><i class="lg lg-avail"></i>Can unlock</span><span><i class="lg lg-locked"></i>Locked</span><span><i class="lg lg-eq"></i>Equipped</span></div>
      <p class="src" style="margin:6px 0 0">Shift-click or press + on a skill to add a rank, - to remove, E to equip. Connections follow the wiki; the drawing is this guide's own.</p>
    </div>
    <aside class="sk-inspector" id="skInspector" aria-live="polite">${inspectorHtml(sel, tree)}</aside>
  </div>
  ${slotsHtml(st)}
  ${forecastHtml()}
  <details class="panel sk-more">
    <summary>${icon("ph-dna")}Mutations (Blood and Wine) <span class="mono dim">${p.mutations.length}/12 researched</span></summary>
    <div class="sk-muts">${MUTATIONS.map(m => { const has = p.mutations.includes(m.id); const ok = m.req.every(r => p.mutations.includes(r));
      return `<label class="check" style="opacity:${has || ok ? 1 : .5}"><input type="checkbox" data-mut="${m.id}" ${has ? "checked" : ""} ${!has && !ok ? "disabled" : ""}><span>${esc(m.name)} <span class="mono dim">${m.ap} AP</span></span></label>`; }).join("")}</div>
    <label class="field" style="max-width:320px;margin-top:12px"><span>Active mutation</span><select class="select" data-plan-mut>${[["", "None"], ...MUTATIONS.filter(m => p.mutations.includes(m.id)).map(m => [m.id, m.name])].map(([v, l]) => `<option value="${v}" ${p.activeMut === v || (!p.activeMut && !v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
    <p class="src">Researching 2, 4, 8 and 12 mutations opens up to 4 extra skill slots. Mutation costs come from the wiki's Blood and Wine mutation page.</p>
  </details>
  <div class="sk-actions">
    <label class="field" style="flex:1 1 220px"><span>Build name</span><input class="input" id="planName" value="${esc(p.name)}" maxlength="60" placeholder="e.g. Toussaint Igni"></label>
    <button class="btn btn-primary" data-action="plan-save">${icon("ph-floppy-disk")}Save build</button>
    <button class="btn" data-action="plan-share">${icon("ph-link")}Copy link</button>
    <button class="btn" data-action="plan-sync-pop">${icon("ph-arrows-clockwise")}Use my Places of Power (${LOCATIONS.filter(l => l.type === "pop" && isChecked(l.id)).length})</button>
    <button class="btn btn-danger" data-action="plan-reset">${icon("ph-arrow-counter-clockwise")}Reset</button>
  </div>
  <p class="src">Points: 1 per level-up, 1 per Place of Power, 2 per magic acorn, 1 per golden egg (wiki). Points can be refunded with a Potion of Clearance. Pre-Remastered saves are reset automatically.</p>`;
}
function treeCanvas(tree, sel){
  const T = SKILL_TREES[tree], col = TREE_META[tree].color;
  const maxY = Math.max(...T.nodes.map(n => n.y));
  const H = 100 + maxY * SK_STEP;
  const X = n => 50 + n.x * 100, Y = n => 50 + n.y * SK_STEP;
  const seen = new Set();
  let lines = "";
  T.nodes.forEach(n => n.pre.forEach(pid => {
    const key = [n.id, pid].sort().join("|"); if(seen.has(key)) return; seen.add(key);
    const p = nodeOf(pid), a = rankOf(n.id), b = rankOf(pid);
    const cls = a && b ? "on" : (a || b) ? "open" : "";
    lines += `<line x1="${X(p)}" y1="${Y(p)}" x2="${X(n)}" y2="${Y(n)}" class="${cls}"/>`;
  }));
  const eq = new Set(PL().equip.filter(Boolean));
  const nodes = T.nodes.map((n, i) => {
    const r = rankOf(n.id), unlock = canUnlock(n.id);
    const state_ = r ? "has" : unlock ? "avail" : "locked";
    return `<button class="sk-node ${state_} ${r === 3 ? "max" : ""} ${eq.has(n.id) ? "eq" : ""} ${sel === n.id ? "sel" : ""}" style="left:${X(n) / SK_W * 100}%;top:${Y(n) / H * 100}%;--i:${i}"
      data-skill="${n.id}" aria-label="${esc(n.name)}, rank ${r} of 3${!unlock && !r ? ", locked" : ""}${eq.has(n.id) ? ", equipped" : ""}" aria-pressed="${sel === n.id}">
      <span class="sk-medal">${icon(n.icon)}${!unlock && !r ? `<i class="ph ph-lock-simple sk-lock" aria-hidden="true"></i>` : ""}</span>
      <span class="sk-pips" aria-hidden="true">${[1, 2, 3].map(k => `<i class="${k <= r ? "on" : ""}"></i>`).join("")}</span>
      <span class="sk-name">${esc(n.name)}</span></button>`;
  }).join("");
  return `<div class="sk-canvas" style="aspect-ratio:${SK_W}/${H};--tc:${col}" data-tree="${tree}">
    <div class="sk-watermark" aria-hidden="true">${esc(T.name)}</div>
    <svg class="sk-lines" viewBox="0 0 ${SK_W} ${H}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${nodes}</div>`;
}
function inspectorHtml(id, tree){
  if(!id){
    const T = SKILL_TREES[tree];
    return `<div class="sk-insp-empty"><span class="sk-sig-big" style="--tc:${TREE_META[tree].color}">${icon(TREE_META[tree].sigil)}</span>
      <h3>${esc(T.name)} tree</h3><p class="muted">Select a skill to read all three ranks, see what it connects to and how it changes your forecast.</p>
      <dl class="kv"><dt>Starting skills</dt><dd>${T.roots.map(r => esc(nodeOf(r).name)).join(", ")}</dd><dt>Per point</dt><dd>${esc(T.passive.label)} +${T.nodes[0].passive[0]}${esc(T.passive.unit)}</dd><dt>Points here</dt><dd class="mono">${treePoints(tree)}</dd></dl></div>`;
  }
  const n = nodeOf(id), r = rankOf(id), unlock = canUnlock(id), meta = TREE_META[n.tree], T = SKILL_TREES[n.tree];
  const leads = T.nodes.filter(x => x.pre.includes(id));
  const eqd = PL().equip.includes(id);
  const status = r ? `Rank ${r} of 3` : isRoot(id) ? "Starting skill: available now" : unlock ? "Available: a connected skill is invested" : `Locked: put a point into ${n.pre.map(p => nodeOf(p).name).join(" or ")}`;
  // Forecast impact of the next rank
  let impact = "";
  if(r < 3){
    const now = forecast(PL().alloc), next = forecast(Object.assign({}, PL().alloc, {[id]: r + 1}));
    const diffs = [];
    for(const k of ["melee", "signs", "survival", "bombs"]) next[k].rows.forEach((row, i) => { const a = now[k].rows[i]; if(row.show && Math.round(row.value) !== Math.round(a.value)) diffs.push(`<li><span>${esc(row.label)}</span><span class="mono">${a.show ? fmtN(a.value, now[k].unit) : "-"} → <b>${fmtN(row.value, now[k].unit)}</b></span></li>`); });
    next.totals.forEach((t, i) => { if(t[1] !== now.totals[i][1]) diffs.push(`<li><span>${esc(t[0])}</span><span class="mono">${esc(now.totals[i][1])} → <b>${esc(t[1])}</b></span></li>`); });
    impact = `<h4 class="sk-h4">Next rank changes</h4>${diffs.length ? `<ul class="sk-diff">${diffs.join("")}</ul>` : `<p class="dim" style="font-size:.88rem;margin:0">No modelled number changes. The effect is situational; see the rank text.</p>`}`;
  }
  return `<div class="sk-insp-head" style="--tc:${meta.color}"><span class="sk-medal sm">${icon(n.icon)}</span><div><span class="label">${esc(T.name)}</span><h3>${esc(n.name)}</h3><span class="sk-status ${r ? "has" : unlock ? "avail" : "locked"}">${esc(status)}</span></div>
      <button class="btn btn-ghost btn-icon btn-sm" data-action="skill-close" aria-label="Close skill details" style="margin-left:auto">${icon("ph-x")}</button></div>
    <div class="sk-ctl">
      <button class="btn" data-action="skill-dec" data-id="${id}" ${r ? "" : "disabled"} aria-label="Remove a rank">${icon("ph-minus")}</button>
      <span class="sk-rank mono" aria-label="Rank ${r} of 3">${r}<small>/3</small></span>
      <button class="btn btn-primary" data-action="skill-inc" data-id="${id}" ${r < 3 && unlock ? "" : "disabled"} aria-label="Add a rank">${icon("ph-plus")}</button>
      <button class="btn ${eqd ? "fav-btn" : ""}" aria-pressed="${eqd}" data-action="skill-equip" data-id="${id}" ${r ? "" : "disabled"}>${icon(eqd ? "ph-star ph-fill" : "ph-star")}${eqd ? "Equipped" : "Equip"}</button>
    </div>
    <ol class="sk-levels">${n.levels.map((lv, i) => `<li class="${i + 1 === r ? "cur" : i + 1 <= r ? "done" : i === r ? "next" : ""}"><span class="label">Rank ${i + 1}${i + 1 === r ? " · current" : i === r && unlock ? " · next" : ""}</span>
      ${lv.map(t => `<p>${esc(t)}</p>`).join("")}<p class="sk-passive">${esc(T.passive.label)} +${n.passive[i]}${esc(T.passive.unit)}</p></li>`).join("")}</ol>
    ${impact}
    <h4 class="sk-h4">Connections</h4>
    <div class="sk-conn">${n.pre.length ? `<div><span class="dim">Unlocked from</span>${n.pre.map(p => `<button class="chip" data-action="skill-select" data-id="${p}">${esc(nodeOf(p).name)}${rankOf(p) ? ` <span class="n">${rankOf(p)}</span>` : ""}</button>`).join("")}</div>` : ""}
      ${leads.length ? `<div><span class="dim">Leads to</span>${leads.map(x => `<button class="chip" data-action="skill-select" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div>` : ""}</div>
    ${srcLine(["fandomRm", "fextraRm"])}`;
}
function slotsHtml(st){
  const slots = equipSlots(), p = PL();
  const group = g => {
    const ids = slots.slice(g * 3, g * 3 + 3);
    const mut = p.mutagens[g] || "";
    const trees = ids.map(id => id ? nodeOf(id).tree : null);
    const match = mut && ids.every(Boolean) && trees.every(t => TREE_META[t].mutagen === mut);
    return `<div class="sk-group ${match ? "match" : ""}">
      <label class="sk-mutagen ${mut ? "m-" + mut : ""}" title="${mut ? esc(MUTAGEN_COLORS[mut].label) : "No mutagen"}">${icon("ph-diamond ph-fill")}<span class="sr-only">Mutagen for group ${g + 1}</span>
        <select data-mutagen="${g}"><option value="">None</option>${Object.entries(MUTAGEN_COLORS).map(([k, m]) => `<option value="${k}" ${mut === k ? "selected" : ""}>${m.label} (${m.hint})</option>`).join("")}</select></label>
      <div class="sk-group-slots">${ids.map((id, i) => slotHtml(id, g * 3 + i)).join("")}</div>
      <span class="sk-group-note">${match ? `${icon("ph-check-circle")}Mutagen bonus active` : mut ? "Fill all 3 with " + esc(MUTAGEN_COLORS[mut].label.split(" ")[0].toLowerCase()) + " skills" : st.mutagenSlots > g ? "Pick a mutagen" : `Mutagen slot opens at level ${MUTAGEN_SLOT_LEVELS[g]}`}</span></div>`;
  };
  return `<section class="sk-slots section" aria-labelledby="slotsTitle">
    <div class="row between"><h2 id="slotsTitle">Equipped skills</h2><span class="mono dim">${slots.filter(Boolean).length}/${st.slots}</span></div>
    <div class="sk-groups">${[0, 1, 2, 3].map(group).join("")}</div>
    ${st.extraSlots ? `<div class="sk-group extra"><span class="label">Mutation slots</span><div class="sk-group-slots">${slots.slice(12).map((id, i) => slotHtml(id, 12 + i)).join("")}</div><span class="sk-group-note">No mutagen bonus in these slots.</span></div>` : ""}
    <p class="src">All 12 slots are open by level 30 (wiki); the per-level unlock schedule is not modelled. A group gets its mutagen bonus when all three skills match the mutagen colour (red Combat, blue Signs, green Alchemy). General skills never match.</p>
  </section>`;
}
function slotHtml(id, idx){
  if(!id) return `<span class="sk-slot empty">Empty</span>`;
  const n = nodeOf(id);
  return `<button class="sk-slot" style="--tc:${TREE_META[n.tree].color}" data-action="skill-select" data-id="${id}" title="${esc(n.name)}">${icon(n.icon)}<span>${esc(n.name)}</span><span class="mono">${rankOf(id)}</span></button>`;
}
function forecastHtml(){
  const s = Object.assign({}, SIM_DEFAULTS, PL().sim);
  const f = forecast(PL().alloc);
  const card = (key, title, ic, inputs) => {
    const c = f[key], rows = c.rows.filter(r => r.show);
    const max = Math.max(...rows.map(r => r.value), c.base) || 1;
    return `<article class="sk-fc"><header>${icon(ic)}<h3>${esc(title)}</h3></header>${inputs}
      <ul>${rows.map(r => { const d = r.base ? Math.round((r.value - r.base) / r.base * 100) : 0; return `<li>
        <div class="sk-fc-row"><span>${esc(r.label)}</span><span class="mono">${fmtN(r.value, c.unit)}${d ? ` <em class="${d > 0 ? "up" : "down"}">${d > 0 ? "+" : ""}${d}%</em>` : ""}</span></div>
        <div class="sk-bar" role="presentation"><i class="base" style="left:${c.base / max * 100}%"></i><i class="val" style="width:${r.value / max * 100}%"></i></div>
        ${r.note ? `<p class="src" style="margin:4px 0 0">${esc(r.note)}</p>` : ""}</li>`; }).join("")}</ul></article>`;
  };
  const num = (k, label, min, max, step = 1) => `<label class="field"><span>${esc(label)}</span><input class="input" type="number" data-sim="${k}" value="${s[k]}" min="${min}" max="${max}" step="${step}"></label>`;
  return `<section class="section sk-forecast" aria-labelledby="fcTitle">
    <div class="row between" style="align-items:flex-end"><div><h2 id="fcTitle">Hit forecast</h2><p class="muted" style="margin:6px 0 0;max-width:70ch">How your invested ranks change damage, Sign intensity, Vitality and bombs. Numbers are read from each rank's text.</p></div></div>
    <div class="sk-fc-inputs">
      <label class="field"><span>Armor weight</span><select class="select" data-sim="armor">${["light", "medium", "heavy"].map(a => `<option value="${a}" ${s.armor === a ? "selected" : ""}>${a[0].toUpperCase() + a.slice(1)}</option>`).join("")}</select></label>
      ${num("pieces", "Armor pieces", 0, 4)}${num("adrenaline", "Adrenaline points", 0, 3)}
    </div>
    <div class="sk-fc-grid">
      ${card("melee", "Melee", "ph-sword", `<div class="sk-fc-in">${num("weapon", "Weapon damage", 1, 99999)}</div>`)}
      ${card("signs", "Signs", "ph-hexagon", `<div class="sk-fc-in">${num("intensity", "Base Sign intensity (%)", 0, 1000)}</div>`)}
      ${card("survival", "Survival", "ph-heartbeat", `<div class="sk-fc-in">${num("vitality", "Base Vitality", 1, 99999)}</div>`)}
      ${card("bombs", "Bombs", "ph-bomb", `<div class="sk-fc-in">${num("bomb", "Bomb damage", 0, 99999)}${num("toxicity", "Toxicity", 0, 150)}</div>`)}
    </div>
    <dl class="sk-totals">${f.totals.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="mono">${esc(v)}</dd></div>`).join("")}</dl>
    <div class="notice" style="margin-top:14px">${icon("ph-warning")}<div><strong>Simplified estimate.</strong> Percent bonuses within a hit are added together and situational procs are applied on top. Enemy armor, resistances, critical hits, difficulty and the game's real stacking order are not modelled.</div></div>
  </section>`;
}

/* ---------- Mutations of the plan ---------- */
function selectSkill(id){
  setParams({skill:id || "", tree: id ? nodeOf(id).tree : P("tree")});
  const box = $("#skInspector");
  if(box && id && $(`.sk-canvas[data-tree="${nodeOf(id).tree}"]`)){
    box.innerHTML = inspectorHtml(id, nodeOf(id).tree);
    $$(".sk-node.sel").forEach(b => { b.classList.remove("sel"); b.setAttribute("aria-pressed", "false"); });
    const b = $(`.sk-node[data-skill="${id}"]`); if(b){ b.classList.add("sel"); b.setAttribute("aria-pressed", "true"); }
    if(matchMedia("(max-width:1100px)").matches) box.scrollIntoView({block:"nearest", behavior:"smooth"});
  } else refreshPlanner();
}
function skillInc(id){
  const n = nodeOf(id), p = PL(), r = rankOf(id);
  if(r >= 3) return toast(`${n.name} is already at rank 3.`, "err");
  if(!canUnlock(id)) return toast(`Locked. Invest in ${n.pre.map(x => nodeOf(x).name).join(" or ")} first.`, "err");
  if(planStats().remaining <= 0) return toast("No points left. Raise the level or add Places of Power.", "err");
  p.alloc[id] = r + 1; save(); refreshPlanner();
}
function skillDec(id){
  const p = PL(), r = rankOf(id); if(!r) return;
  const next = Object.assign({}, p.alloc); if(r === 1) delete next[id]; else next[id] = r - 1;
  if(!planValid(next)){
    const reach = reachable(next);
    const stranded = Object.keys(next).filter(k => !reach.has(k)).map(k => nodeOf(k).name);
    return toast(`${stranded.join(", ")} would lose ${stranded.length > 1 ? "their" : "its"} connection. Remove ${stranded.length > 1 ? "those" : "that"} first.`, "err");
  }
  p.alloc = next;
  if(!next[id]) p.equip = p.equip.map(x => x === id ? null : x);
  save(); refreshPlanner();
}
function skillEquip(id){
  const p = PL();
  if(p.equip.includes(id)){ p.equip = p.equip.map(x => x === id ? null : x); save(); refreshPlanner(); return toast(`${nodeOf(id).name} unequipped.`); }
  if(!rankOf(id)) return toast("Put at least one point into a skill before equipping it.", "err");
  const slots = equipSlots(), free = slots.indexOf(null);
  if(free < 0) return toast("All skill slots are full. Unequip one first.", "err");
  slots[free] = id; p.equip = slots; save(); refreshPlanner();
  toast(`${nodeOf(id).name} equipped in slot ${free + 1}.`);
}
function refreshPlanner(){
  const ae = document.activeElement, y = window.scrollY;
  const sel = ae && ae.dataset && ae.dataset.skill ? `[data-skill="${ae.dataset.skill}"]`
    : ae && ae.dataset && ae.dataset.action && ae.dataset.id ? `[data-action="${ae.dataset.action}"][data-id="${ae.dataset.id}"]`
    : ae && ae.dataset && ae.dataset.plan ? `[data-plan="${ae.dataset.plan}"]` : ae && ae.dataset && ae.dataset.sim ? `[data-sim="${ae.dataset.sim}"]`
    : ae && ae.dataset && ae.dataset.mut ? `[data-mut="${ae.dataset.mut}"]` : null;
  render(true);
  window.scrollTo(0, y);
  if(sel){ const el = $(sel); if(el && !el.disabled) el.focus({preventScroll:true}); else $("#skInspector .btn:not([disabled])")?.focus({preventScroll:true}); }
}
/* Node clicks and keys (delegated; nodes are re-rendered often). */
document.addEventListener("click", e => {
  const b = e.target.closest(".sk-node"); if(!b) return;
  if(e.shiftKey){ skillInc(b.dataset.skill); return; }
  selectSkill(b.dataset.skill);
});
document.addEventListener("keydown", e => {
  const b = e.target.closest && e.target.closest(".sk-node"); if(!b) return;
  const id = b.dataset.skill;
  if(e.key === "+" || e.key === "="){ e.preventDefault(); skillInc(id); }
  else if(e.key === "-" || e.key === "_"){ e.preventDefault(); skillDec(id); }
  else if(e.key.toLowerCase() === "e"){ e.preventDefault(); skillEquip(id); }
});
</script>
