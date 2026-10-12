<script>
"use strict";
/* =====================================================================
   8n. THE WITCHER'S TOME (My Journal)
   A leather journal with ribbon bookmarks: the chronicle (story acts and
   wax-seal progress), keepsakes (favorites as cards), build scrolls (saved
   builds with their tree split) and the binding (settings and backups).
   ===================================================================== */
const JN_TABS = [["chronicle", "Chronicle", "ph-book-open-text"], ["keepsakes", "Keepsakes", "ph-bookmark-simple"], ["scrolls", "Build scrolls", "ph-scroll"], ["binding", "Settings and backup", "ph-gear-six"]];
const JN_ACTS = ["Prologue", "Act I: Velen", "Act I: Novigrad", "Act I: Skellige", "Act II", "Act III"];
const jnFavName = f => {
  const map = {quest:QUESTS, monster:MONSTERS, loc:LOCATIONS, gear:GEAR_SETS, weapon:WEAPONS, alchemy:ALCHEMY, card:GWENT_CARDS, ach:ACHIEVEMENTS, build:BUILDS};
  const x = (map[f.kind] || []).find(y => y.id === f.id); return x ? x.name : null;
};

VIEWS.journal = () => {
  const tab = JN_TABS.some(t => t[0] === P("jt")) ? P("jt") : "chronicle";
  const n = {keepsakes: state.favorites.filter(f => jnFavName(f)).length, scrolls: state.builds.length};
  return `
  <header class="page-head"><h1>My Journal</h1><p>Your chronicle, keepsakes, saved builds and settings, all bound in this browser.</p></header>
  ${storageOK ? "" : `<div class="notice danger" style="margin-bottom:18px">${icon("ph-warning-octagon")}<div><strong>Browser storage is unavailable.</strong> Changes will last until you close this tab. Export a backup to keep them.</div></div>`}
  <div class="jn-tome">
    <nav class="jn-ribbons" role="tablist" aria-label="Journal sections">${JN_TABS.map(([k, l, ic]) => `<button class="jn-ribbon" role="tab" aria-label="${l}" aria-selected="${tab === k}" data-action="set-param" data-k="jt" data-v="${k === "chronicle" ? "" : k}">${icon(ic)}<span>${l}</span>${n[k] ? `<b class="mono">${n[k]}</b>` : ""}</button>`).join("")}</nav>
    <div class="jn-page">${tab === "keepsakes" ? jnKeepsakes() : tab === "scrolls" ? jnScrolls() : tab === "binding" ? jnBinding() : jnChronicle()}</div>
  </div>`;
};
function jnChronicle(){
  const ps = computeProgress(), main = QUESTS.filter(q => q.type === "main");
  const acts = JN_ACTS.map(a => { const qs = main.filter(q => q.act === a); return {a, qs, d: qs.filter(q => isChecked(q.id)).length}; }).filter(x => x.qs.length);
  const cur = acts.find(x => x.d < x.qs.length);
  const checks = Object.keys(state.checks).length;
  return `<section class="jn-acts" aria-labelledby="actsTitle">
      <div class="jn-sec-head"><h2 id="actsTitle">The story so far</h2><span class="mono dim">${main.filter(q => isChecked(q.id)).length}/${main.length} main quests</span></div>
      <ol class="jn-actline">${acts.map(x => { const v = pct(x.d, x.qs.length), st = v === 100 ? "done" : x === cur ? "cur" : "";
        return `<li class="jn-act ${st}" style="--p:${v}"><a href="#/quests?type=main" class="jn-act-seal" aria-label="${esc(x.a)}: ${x.d} of ${x.qs.length}">${v === 100 ? icon("ph-check") : `<span class="mono">${v}</span>`}</a><b>${esc(x.a)}</b><span class="mono">${x.d}/${x.qs.length}</span>${x === cur ? `<em>You are here</em>` : ""}</li>`; }).join("")}</ol>
      ${cur ? `<p class="jn-act-next">${icon("ph-crown-simple")}Next in ${esc(cur.a)}: <button class="linkish" data-open="quest:${esc(cur.qs.find(q => !isChecked(q.id)).id)}">${esc(cur.qs.find(q => !isChecked(q.id)).name)}</button></p>` : `<p class="jn-act-next">${icon("ph-seal-check")}The main story is complete.</p>`}
    </section>
    <section class="section" aria-labelledby="sealTitle">
      <div class="jn-sec-head"><h2 id="sealTitle">Seals of progress</h2><span class="mono dim">${checks} entr${checks === 1 ? "y" : "ies"} ticked</span></div>
      <div class="jn-seals">${ps.map(p => { const v = pct(p.done, p.total);
        return `<a class="jn-seal ${v === 100 ? "full" : v ? "lit" : ""}" href="#/${p.route}" style="--p:${v}" data-tip="${p.done} of ${p.total}">
          <span class="jn-wax">${icon(HM_ICON[p.key] || "ph-circle")}</span><b>${esc(p.label)}</b><span class="mono">${v}%</span></a>`; }).join("")}</div>
    </section>`;
}
function jnKeepsakes(){
  const all = state.favorites.map(f => ({f, name: jnFavName(f)})).filter(x => x.name);
  const k = all.some(x => x.f.kind === P("fk")) ? P("fk") : "";
  if(!all.length) return emptyState("ph-bookmark-simple", "No keepsakes yet", "Use the bookmark button on any quest, monster, recipe, card or place to keep it here.");
  const kinds = [...new Set(all.map(x => x.f.kind))], list = all.filter(x => !k || x.f.kind === k);
  return `<div class="jn-sec-head"><h2>Keepsakes</h2><span class="mono dim">${all.length} saved</span></div>
    ${kinds.length > 1 ? chipsHtml("fk", [["", "All"], ...kinds.map(x => [x, (KIND_META[x] || {}).label || x])], k, "Filter keepsakes") : ""}
    <div class="jn-keeps">${list.map(({f, name}) => { const m = KIND_META[f.kind] || KIND_META.page;
      return `<article class="jn-keep ${esc(f.kind)}"><span class="jn-keep-ico">${icon(m.icon)}</span>
        <div><span class="label">${esc(m.label)}</span><button class="jn-keep-name" data-action="open-result" data-kind="${esc(f.kind)}" data-id="${esc(f.id)}">${esc(name)}</button></div>
        <button class="btn btn-sm btn-icon btn-ghost" data-action="fav" data-kind="${esc(f.kind)}" data-id="${esc(f.id)}" aria-pressed="true" aria-label="Remove ${esc(name)} from keepsakes">${icon("ph-x")}</button></article>`; }).join("")}</div>`;
}
function jnScrolls(){
  if(!state.builds.length) return emptyState("ph-scroll", "No build scrolls yet", "Open the planner, allocate points and press Save build.", `<a class="btn" href="#/builds?tab=planner">Open planner</a>`);
  const all = allSkills();
  return `<div class="jn-sec-head"><h2>Build scrolls</h2><span class="mono dim">${state.builds.length} saved</span></div>
    <div class="jn-scrolls">${state.builds.map(b => {
      const by = {combat:0, signs:0, alchemy:0, general:0}; for(const [id, n] of Object.entries(b.alloc)) if(all[id]) by[all[id].tree] = (by[all[id].tree] || 0) + n;
      const pts = Object.values(by).reduce((a, n) => a + n, 0), top = Object.entries(by).sort((a, c) => c[1] - a[1])[0];
      return `<article class="jn-scroll" style="--tc:${TREE_META[top[1] ? top[0] : "general"].color}">
        <div class="jn-scroll-head"><span class="jn-scroll-sigil">${icon(TREE_META[top[1] ? top[0] : "general"].sigil)}</span><div><h3>${esc(b.name)}</h3><span class="dim">Saved ${timeAgo(b.created)}</span></div></div>
        <div class="jn-split" aria-label="Points by tree">${pts ? Object.entries(by).filter(([, n]) => n).map(([t, n]) => `<i style="flex:${n};background:${TREE_META[t].color}" data-tip="${esc(SKILL_TREES[t].name)}: ${n} point${n === 1 ? "" : "s"}"></i>`).join("") : `<i style="flex:1;background:var(--line)"></i>`}</div>
        <div class="jn-scroll-stats"><span><b class="mono">${pts}</b> points</span><span><b class="mono">${b.level}</b> level</span><span><b class="mono">${b.mutations.length}</b> mutation${b.mutations.length === 1 ? "" : "s"}</span></div>
        <div class="row" style="gap:6px"><button class="btn btn-sm btn-primary" data-action="build-load-saved" data-id="${esc(b.id)}">${icon("ph-tree-structure")}Open in planner</button><button class="btn btn-sm btn-icon btn-danger" data-action="build-del" data-id="${esc(b.id)}" aria-label="Delete ${esc(b.name)}">${icon("ph-trash")}</button></div>
      </article>`; }).join("")}</div>`;
}
function jnBinding(){
  const s = state.settings;
  let bytes = 0; try{ bytes = (localStorage.getItem(STORE_KEY) || "").length; }catch(e){}
  const opts = [
    ["theme", "Parchment theme", "A light reading theme. Night is the default.", s.theme === "parchment", "ph-sun"],
    ["reduceMotion", "Reduce motion", "Turns off page and hover animations. Your system setting is always respected.", s.reduceMotion, "ph-wind"],
    ["spoilers", "Spoiler shield", "Blurs quest rewards, consequences and walkthrough steps until you click them.", s.spoilers, "ph-eye-slash"],
    ["navCollapsed", "Compact sidebar", "Fold the sidebar into an icon rail on wide screens. Shortcut: [", s.navCollapsed, "ph-sidebar-simple"]
  ];
  return `<div class="jn-sec-head"><h2>Settings</h2></div>
    <div class="jn-runes">${opts.map(([k, l, d, on, ic]) => `<label class="jn-rune ${on ? "on" : ""}"><span class="jn-rune-ico">${icon(ic)}</span><div><b>${esc(l)}</b><span>${esc(d)}</span></div><input type="checkbox" class="switch" data-setting="${k}" ${on ? "checked" : ""} aria-label="${esc(l)}"></label>`).join("")}</div>
    <div class="jn-sec-head section"><h2>Backup</h2><span class="mono dim">${(bytes / 1024).toFixed(1)} KB stored</span></div>
    <div class="jn-backup">
      <div class="jn-bk"><span class="jn-bk-ico">${icon("ph-download-simple")}</span><div><b>Export</b><p>Save every checklist, keepsake, build, card and setting as a JSON file.</p></div><button class="btn btn-primary" data-action="export">Export progress</button></div>
      <div class="jn-bk"><span class="jn-bk-ico">${icon("ph-upload-simple")}</span><div><b>Import</b><p>Restore a backup. Imports are validated, and unknown or malformed fields are ignored.</p></div><button class="btn" data-action="import">Import backup</button></div>
      <div class="jn-bk danger"><span class="jn-bk-ico">${icon("ph-trash")}</span><div><b>Burn the journal</b><p>Erase all progress stored by this guide in this browser. You will be asked to confirm.</p></div><button class="btn btn-danger" data-action="reset-all">Reset all progress</button></div>
    </div>`;
}
</script>
