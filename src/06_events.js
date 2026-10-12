<script>
"use strict";
/* =====================================================================
   9. INTERACTIONS (event delegation)
   ===================================================================== */
function toggleFav(kind, id){
  const i = state.favorites.findIndex(f => f.kind === kind && f.id === id);
  if(i >= 0){ state.favorites.splice(i, 1); toast("Removed from favorites."); }
  else{ state.favorites.unshift({kind, id}); toast("Saved to your journal."); }
  save();
  const on = isFav(kind, id);
  $$(`.fav-btn[data-kind="${kind}"][data-id="${CSS.escape(id)}"]`).forEach(b => {
    const name = b.getAttribute("aria-label").replace(/^(Save|Remove) /, "").replace(/ (to|from) favorites$/, "");
    b.setAttribute("aria-pressed", on);
    b.setAttribute("aria-label", `${on ? "Remove" : "Save"} ${name} ${on ? "from" : "to"} favorites`);
    b.dataset.tip = on ? "Saved" : "Save to journal";
    const i = b.querySelector(".ph"); if(i) i.className = "ph " + (on ? "ph-bookmark-simple ph-fill" : "ph-bookmark-simple");
    const sp = b.querySelector("span"); if(sp) sp.textContent = on ? "Saved" : "Save";
  });
  if(route.name === "journal") render(true);
  renderNav();
}
function softRefresh(){
  // After a checklist change: refresh nav counts and any live list without losing scroll.
  renderNav();
  const y = window.scrollY;
  const keep = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.check : null;
  if(VIEWS[route.name + "_list"] && $("#list") && (P("hide") || P("status"))){ $("#list").innerHTML = VIEWS[route.name + "_list"](); }
  else if(["world","collect","dlc","journal","gear","home"].includes(route.name)) render(true);
  window.scrollTo(0, y);
  if(keep){ const el = $(`[data-check="${CSS.escape(keep)}"]`); el && el.focus(); }
}
function rerenderList(){
  const box = $("#list");
  if(box && VIEWS[route.name + "_list"]) box.innerHTML = VIEWS[route.name + "_list"]();
}
const onFilterInput = debounce((el) => {
  const k = el.dataset.filter;
  const v = el.type === "checkbox" ? (el.checked ? "1" : "") : el.value.trim();
  setParams({[k]: v});
  if(k === "deckf"){ state.gwent.deck.faction = v; state.gwent.deck.cards = state.gwent.deck.cards.filter(id => { const c = GWENT_CARDS.find(x => x.id === id); return c.faction === v || c.faction === "neutral"; }); save(); render(true); return; }
  if(["all","miss","missable"].includes(k) && !$("#list")) { render(true); return; }
  if($("#list") && VIEWS[route.name + "_list"]) rerenderList(); else render(true);
}, 160);

function loadPlan(plan, label){
  state.planner = cleanPlan(plan, false);
  save();
  closeModal();
  go("builds", {tab:"planner"});
  toast(`${label} loaded into the planner.`);
}
function exportData(){
  try{
    const blob = new Blob([JSON.stringify(Object.assign({app:"w3-ultimate-guide", exported:new Date().toISOString()}, state), null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `witcher3-guide-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Backup downloaded.");
  }catch(e){ toast("Export failed in this browser.", "err"); }
}
function importData(file){
  if(!file) return;
  if(file.size > 2_000_000) return toast("That file is too large to be a backup.", "err");
  const r = new FileReader();
  r.onload = () => {
    try{
      const parsed = JSON.parse(r.result);
      if(parsed.app && parsed.app !== "w3-ultimate-guide") throw new Error("Not a backup from this guide.");
      const next = sanitize(parsed);
      const n = Object.keys(next.checks).length + Object.keys(next.gwent.owned).length + next.builds.length + next.favorites.length;
      confirmDialog("Replace current progress?", `This backup contains ${n} saved items. Importing replaces everything currently stored in this browser.`, "Import backup", () => {
        state = next; save(); applySettings(); render(); toast("Backup imported.");
      });
    }catch(e){ toast("Import failed: the file is not a valid backup.", "err"); }
  };
  r.onerror = () => toast("Could not read that file.", "err");
  r.readAsText(file);
}
function applySettings(){
  document.documentElement.dataset.theme = state.settings.theme;
  document.documentElement.classList.toggle("reduce-motion", state.settings.reduceMotion);
  const b = $("#themeBtn");
  b.innerHTML = icon(state.settings.theme === "night" ? "ph-moon-stars" : "ph-sun");
  b.setAttribute("aria-label", state.settings.theme === "night" ? "Switch to parchment theme" : "Switch to night theme");
  b.dataset.tip = state.settings.theme === "night" ? "Parchment theme" : "Night theme";
  const rail = state.settings.navCollapsed, nb = $("#navCollapse");
  document.querySelector(".app").classList.toggle("nav-collapsed", rail);
  nb.setAttribute("aria-expanded", String(!rail));
  nb.setAttribute("aria-label", rail ? "Expand sidebar" : "Collapse sidebar");
  nb.dataset.tip = rail ? "Expand sidebar  [" : "Collapse sidebar  [";
  nb.dataset.tipSide = "right";
  nb.querySelector(".ph").className = "ph " + (rail ? "ph-caret-double-right" : "ph-caret-double-left");
}
function toggleNav(){
  if(matchMedia("(max-width:1024px)").matches) return;
  state.settings.navCollapsed = !state.settings.navCollapsed; save(); tipHide(); applySettings(); renderNav();
}

/* Tooltips: one floating element for every [data-tip], plus icon-only controls
   (no visible text) that carry an aria-label. Positioned in the viewport so
   scrolling containers never clip it. */
const TIP = {target:null, timer:0, touch:false};
function tipText(t){
  if(t.dataset.tip) return t.dataset.tip;
  if(!t.textContent.trim() && t.getAttribute("aria-label")) return t.getAttribute("aria-label");
  return "";
}
function tipTarget(n){
  const t = n && n.closest ? n.closest("[data-tip], button[aria-label], a[aria-label], [role=button][aria-label]") : null;
  return t && tipText(t) ? t : null;
}
function tipShow(t){
  const el = $("#tip"), txt = tipText(t); if(!txt) return;
  TIP.target = t; el.textContent = txt; el.hidden = false; el.className = "tip";
  const r = t.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight, g = 8;
  let side = t.dataset.tipSide || "top", x, y;
  if(side === "right" && r.right + g + w > vw - 8) side = "top";
  if(side === "top" && r.top - g - h < 8) side = "bottom";
  if(side === "right"){ x = r.right + g; y = r.top + r.height / 2 - h / 2; }
  else { x = r.left + r.width / 2 - w / 2; y = side === "top" ? r.top - g - h : r.bottom + g; }
  x = Math.max(8, Math.min(x, vw - w - 8)); y = Math.max(8, Math.min(y, vh - h - 8));
  el.style.left = x + "px"; el.style.top = y + "px";
  void el.offsetWidth; el.classList.add("on", side);
}
function tipHide(){ clearTimeout(TIP.timer); TIP.target = null; const el = $("#tip"); el.hidden = true; el.className = "tip"; }
document.addEventListener("pointerdown", e => { TIP.touch = e.pointerType === "touch"; tipHide(); }, true);
document.addEventListener("mouseover", e => {
  if(TIP.touch) return;
  const t = tipTarget(e.target); if(t === TIP.target) return;
  clearTimeout(TIP.timer); if(!t){ tipHide(); return; }
  const warm = !!TIP.target;
  TIP.timer = setTimeout(() => t.isConnected && tipShow(t), warm ? 0 : 280);
});
document.addEventListener("focusin", e => { const t = tipTarget(e.target); if(t && t.matches(":focus-visible")) tipShow(t); else tipHide(); });
document.addEventListener("focusout", () => tipHide());
window.addEventListener("scroll", () => TIP.target && tipHide(), true);
window.addEventListener("resize", () => TIP.target && tipHide());
function planSaveDialog(){
  const name = ($("#planName") && $("#planName").value.trim()) || state.planner.name;
  openModal(modalShell("Save build", `
    <form id="saveBuildForm" class="stack" novalidate>
      <label class="field"><span>Build name</span><input class="input" name="name" maxlength="60" value="${esc(name)}" required autofocus aria-describedby="sbErr sbHelp"></label>
      <p id="sbHelp" class="src" style="margin:0">Saved builds stay in this browser and are included in backups.</p>
      <p id="sbErr" class="src" style="color:var(--accent-text);margin:0" aria-live="polite"></p>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Save</button></div>
    </form>`));
  $("#saveBuildForm").addEventListener("submit", e => {
    e.preventDefault();
    const n = e.target.name.value.trim();
    if(!n){ $("#sbErr").textContent = "Give the build a name."; e.target.name.focus(); return; }
    if(!Object.keys(state.planner.alloc).length){ $("#sbErr").textContent = "The planner is empty. Allocate at least one point first."; return; }
    const existing = state.builds.find(b => b.name.toLowerCase() === n.toLowerCase());
    const rec = cleanPlan(Object.assign({}, state.planner, {name:n, id: existing ? existing.id : uid(), created: Date.now()}), true);
    if(existing) Object.assign(existing, rec); else state.builds.unshift(rec);
    state.planner.name = n; save(); closeModal(); render(true);
    toast(existing ? `Updated "${n}".` : `Saved "${n}".`);
  });
}
function copyText(text){
  if(navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  return new Promise((res, rej) => { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try{ document.execCommand("copy") ? res() : rej(); }catch(e){ rej(e); } t.remove(); });
}

document.addEventListener("click", e => {
  const t = e.target.closest("[data-action],[data-open],[data-pal-kind],[data-pal-try],[data-pal-index],[data-pal-close]");
  if(!t) return;
  if(t.dataset.open){ e.preventDefault(); const [k, ...rest] = t.dataset.open.split(":"); if(!$("#modalOverlay").hidden) closeModal(); openDetail(k, rest.join(":")); return; }
  if(t.dataset.palKind !== undefined){ palKind = t.dataset.palKind; $$("#paletteFilters .chip").forEach(c => c.setAttribute("aria-pressed", c === t)); runPalette(); $("#paletteInput").focus(); return; }
  if(t.dataset.palTry){ $("#paletteInput").value = t.dataset.palTry; runPalette(); $("#paletteInput").focus(); return; }
  if(t.dataset.palIndex){ palOpen(+t.dataset.palIndex); return; }
  if(t.dataset.palClose !== undefined){ closePalette(); return; }
  const a = t.dataset.action, id = t.dataset.id;
  switch(a){
    case "fav": toggleFav(t.dataset.kind, id); break;
    case "close-modal": closeModal(); break;
    case "pal-open": openPalette(); break;
    case "reveal": t.classList.add("revealed"); t.removeAttribute("role"); break;
    case "open-result": openResult(t.dataset.kind, id); break;
    case "set-param": {
      setParams({[t.dataset.k]: t.dataset.v, open:""});
      if(["r","type","cat","f","tab","kind","tree","g"].includes(t.dataset.k) && t.dataset.k !== "q"){ /* keep other filters */ }
      render(true);
      const f = $(`[data-action="set-param"][data-k="${t.dataset.k}"][data-v="${CSS.escape(t.dataset.v)}"]`); f && f.focus();
      break;
    }
    case "wx-sel": wxSelect(t.dataset.id, t.dataset.r); break;
    case "dl-pick": dlPick(t.dataset.d, t.dataset.v); { const b = $(`[data-action="dl-pick"][data-d="${t.dataset.d}"][data-v="${t.dataset.v}"]`); b && b.focus({preventScroll:true}); } break;
    case "dl-end": dlEndPick(t.dataset.id); break;
    case "dl-reset": dlReset(); break;
    case "set-params": setParams(JSON.parse(t.dataset.p)); render(true); break;
    case "clear-filters": { const keep = {}; ["tab","type","kind","r"].forEach(k => { if(route.name !== "world" && P(k)) keep[k] = P(k); }); route.params = new URLSearchParams(keep); setParams({}); render(true); break; }
    case "acc": {
      const body = $("#acc-" + id), open = t.getAttribute("aria-expanded") === "true";
      t.setAttribute("aria-expanded", !open); body.hidden = open; setParams({set: open ? "" : id}); break;
    }
    case "cmp-clear": setParams({cmp:""}); render(true); break;
    case "skill-inc": skillInc(id); break;
    case "skill-dec": skillDec(id); break;
    case "skill-equip": skillEquip(id); break;
    case "skill-select": selectSkill(id); break;
    case "skill-close": setParams({skill:""}); $("#skInspector").innerHTML = inspectorHtml(null, P("tree") && SKILL_TREES[P("tree")] ? P("tree") : "combat"); $$(".sk-node.sel").forEach(b => b.classList.remove("sel")); break;
    case "plan-sync-pop": state.planner.pop = Math.min(30, LOCATIONS.filter(l => l.type === "pop" && isChecked(l.id)).length); save(); refreshPlanner(); toast("Places of Power synced from your checklist."); break;
    case "plan-save": planSaveDialog(); break;
    case "plan-share": {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(cleanPlan(state.planner, false)))));
      const url = location.href.split("#")[0] + "#/builds?tab=planner&plan=" + code;
      copyText(url).then(() => toast("Share link copied."), () => { openModal(modalShell("Share link", `<label class="field"><span>Copy this link</span><input class="input" value="${esc(url)}" readonly autofocus onfocus="this.select()"></label>`)); });
      break;
    }
    case "plan-reset": confirmDialog("Reset the planner?", "This clears all allocated points, equipped skills and mutations in the planner. Saved builds are not affected.", "Reset planner", () => { state.planner = defaultState().planner; save(); render(true); toast("Planner reset."); }); break;
    case "load-build": { const b = BUILDS.find(x => x.id === id); loadPlan(Object.assign({level:40, pop:0, bonus:0}, b, {name:b.name, sim:Object.assign({}, SIM_DEFAULTS, b.sim)}), b.name); break; }
    case "build-load-saved": { const b = state.builds.find(x => x.id === id); if(b) loadPlan(b, b.name); break; }
    case "build-del": { const b = state.builds.find(x => x.id === id); if(!b) break; confirmDialog("Delete build?", `"${b.name}" will be removed from this browser.`, "Delete", () => { state.builds = state.builds.filter(x => x.id !== id); save(); render(true); toast("Build deleted."); }); break; }
    case "prep-add": state.prep[id] = Math.min(99, (state.prep[id] || 0) + 1); save(); alRefresh(); toast(`${ALCHEMY.find(x => x.id === id).name} added to your prep list.`); break;
    case "prep-inc": state.prep[id] = Math.min(99, state.prep[id] + 1); save(); alRefresh(); break;
    case "prep-dec": if(state.prep[id] > 1) state.prep[id]--; else delete state.prep[id]; save(); alRefresh(); break;
    case "prep-clear": state.prep = {}; state.prepDone = {}; save(); alRefresh(); toast("Preparation list cleared."); break;
    case "deck-add": {
      const c = cardById(id), n = state.gwent.deck.cards.filter(x => x === id).length, cap = P("all") ? c.copies : ownedN(id);
      if(n >= cap){ toast(P("all") ? `All ${c.copies} copies of ${c.name} are on the table.` : `You own ${cap} ${cap === 1 ? "copy" : "copies"} of ${c.name}.`, "err"); break; }
      state.gwent.deck.cards.push(id); save(); gwRefreshCabinet(); break;
    }
    case "deck-remove": { const d = state.gwent.deck, i = d.cards.indexOf(id); if(i >= 0) d.cards.splice(i, 1); save(); gwRefreshCabinet(); break; }
    case "gw-select": {
      setParams({c:id});
      const box = $("#gwInspector"); if(box){ box.innerHTML = inspectCard(cardById(id)); $$(".gw-grid .gw-card.sel").forEach(b => b.classList.remove("sel")); $(`.gw-grid .gw-card[data-id="${CSS.escape(id)}"]`)?.classList.add("sel");
        if(matchMedia("(max-width:1100px)").matches) box.scrollIntoView({behavior: state.settings.reduceMotion ? "auto" : "smooth", block:"start"}); }
      break;
    }
    case "gw-noop": break;
    case "gw-own": { const c = cardById(id); gwSetOwned(id, +t.dataset.d); toast(ownedN(id) ? `${c.name}: ${ownedN(id)} of ${c.copies} owned.` : `${c.name} removed from your collection.`); gwRefreshCabinet(); break; }
    case "gw-add-deck": {
      const c = cardById(id), d = state.gwent.deck;
      if(c.faction !== "neutral" && c.faction !== d.faction){
        if(d.cards.some(x => cardById(x).faction !== "neutral")){ toast(`Your deck is ${FACTIONS[d.faction].name}. Switch factions on the deck table first.`, "err"); break; }
        d.faction = c.faction; d.leader = null;
      }
      if(d.cards.filter(x => x === id).length >= c.copies){ toast(`All ${c.copies} copies of ${c.name} are already in the deck.`, "err"); break; }
      d.cards.push(id); save(); toast(`${c.name} added to your ${FACTIONS[d.faction].name} deck.`); break;
    }
    case "gw-leader": {
      const c = cardById(id), d = state.gwent.deck;
      if(c.faction !== d.faction){ if(d.cards.some(x => cardById(x).faction !== "neutral")){ toast(`${c.name} leads ${FACTIONS[c.faction].name}. Switch the deck faction first.`, "err"); break; } d.faction = c.faction; }
      d.leader = id; save(); toast(`${c.name} leads your deck.`); if(route.name === "gwent" && P("tab") === "deck") gwRefreshCabinet(); break;
    }
    case "gw-leader-clear": state.gwent.deck.leader = null; save(); gwRefreshCabinet(); break;
    case "gw-faction": {
      const d = state.gwent.deck; if(d.faction === id) break;
      const before = d.cards.length;
      d.faction = id; d.cards = d.cards.filter(x => ["neutral", id].includes(cardById(x).faction)); if(d.leader && cardById(d.leader).faction !== id) d.leader = null;
      save(); gwRefreshCabinet(); toast(before !== d.cards.length ? `Switched to ${FACTIONS[id].name}. Faction cards from the old deck were removed.` : `Switched to ${FACTIONS[id].name}.`); break;
    }
    case "deck-custom-remove": state.gwent.deck.custom = state.gwent.deck.custom.filter(x => x.id !== id); save(); render(true); break;
    case "deck-clear": confirmDialog("Clear this deck?", "Every card and the leader will be taken off the table.", "Clear deck", () => { state.gwent.deck.cards = []; state.gwent.deck.leader = null; save(); render(true); toast("Deck cleared."); }); break;
    case "map-switch": setParams({m:id, z:"", c:"", pin:"", mq:""}); render(true); break;
    case "map-zoom": mapZoom(+id); break;
    case "map-reset": mapReset(); break;
    case "map-full": { const fr = $(".map-frame"); if(document.fullscreenElement) document.exitFullscreen(); else if(fr.requestFullscreen) fr.requestFullscreen().catch(() => toast("Full screen is not available here.", "err")); else toast("Full screen is not available here.", "err"); break; }
    case "map-cats": { const ids = Object.keys(MAP_CATS); state.map.off = id === "none" ? ids : []; save(); $$("[data-map-cat]").forEach(cb => cb.checked = id !== "none"); refreshPinVisibility(); break; }
    case "map-goto": mapGoto(id); break;
    case "bx-select": bxSelect(id); break;
    case "qx-select": qxSelect(id); break;
    case "gr-weapon": grWeapon(id); break;
    case "cl-sendpop": { const n = Math.min(30, LOCATIONS.filter(l => l.type === "pop" && isChecked(l.id)).length); state.planner.pop = n; save(); toast(`Skill planner now counts ${n} Place${n === 1 ? "" : "s"} of Power.`); break; }
    case "al-select": alSelect(id); break;
    case "al-ing": alIng(id); break;
    case "al-goto": alGoto(id); break;
    case "qx-close": setParams({qid:""}); $("#qxInspector").innerHTML = questInspector(null); $$("[data-action='qx-select'].sel").forEach(b => b.classList.remove("sel")); break;
    case "bx-close": bxSelect(""); break;
    case "bx-kit": bxAddKit(id); break;
    case "loc-map": showOnMap(id, +(t.dataset.i || 0)); break;
    case "map-close-card": $("#mapCard").hidden = true; $$(".pin.sel").forEach(p => p.classList.remove("sel")); MV.sel = null; syncMapUrl(); if(MV.el) MV.el.focus({preventScroll:true}); break;
    case "export": exportData(); break;
    case "import": $("#importFile").click(); break;
    case "reset-all": confirmDialog("Reset all progress?", "Every checklist, favorite, saved build, Gwent card, deck and setting stored by this guide will be erased from this browser. Export a backup first if you might want it back.", "Erase everything", () => {
      state = defaultState(); save(); applySettings(); render(); toast("All progress has been reset."); }); break;
  }
});

document.addEventListener("change", e => {
  const el = e.target;
  if(el.dataset.check){
    setCheck(el.dataset.check, el.checked);
    const mirrors = typeof linkedChecks === "function" ? linkedChecks(el.dataset.check) : [];
    mirrors.forEach(mid => {
      setCheck(mid, el.checked);
      $$(`[data-check="${CSS.escape(mid)}"]`).forEach(x => { x.checked = el.checked; const rw = x.closest("[data-row]"); if(rw) rw.classList.toggle("done", el.checked); });
      if(mid.startsWith("m:") && typeof mapOnCheck === "function") mapOnCheck(mid, el.checked);
    });
    const row = el.closest("[data-row]"); if(row) row.classList.toggle("done", el.checked);
    $$(`[data-check="${CSS.escape(el.dataset.check)}"]`).forEach(x => { if(x !== el) x.checked = el.checked; });
    toast(el.checked ? (el.dataset.check.startsWith("m:") ? "Marked as found." : "Marked complete.") : "Unmarked.");
    if(el.dataset.check.startsWith("m:") && typeof mapOnCheck === "function") mapOnCheck(el.dataset.check, el.checked);
    if(route.name === "quests" || route.name === "gear"){ renderNav(); const y = window.scrollY, k = el.dataset.check; render(true); window.scrollTo(0, y); $(`[data-check="${CSS.escape(k)}"]`)?.focus({preventScroll:true}); return; }
    if(el.dataset.check.startsWith("beast:") && route.name === "bestiary"){ renderNav(); const y = window.scrollY; render(true); window.scrollTo(0, y); $(`[data-check="${CSS.escape(el.dataset.check)}"]`)?.focus({preventScroll:true}); return; }
    if($("#modalOverlay").hidden) softRefresh(); else renderNav();
    return;
  }
  if(el.dataset.gwentOwn){
    const id = el.dataset.gwentOwn;
    if(el.checked) state.gwent.owned[id] = true; else delete state.gwent.owned[id];
    save(); renderNav();
    const card = el.closest(".gcard"); if(card) card.classList.toggle("owned", el.checked);
    toast(el.checked ? "Card added to collection." : "Card removed from collection.");
    if(P("own") && $("#list")) rerenderList();
    return;
  }
  if(el.dataset.cmp){
    let cmp = (P("cmp") || "").split(",").filter(Boolean).filter(x => x !== el.dataset.cmp);
    if(el.checked){ if(cmp.length >= 2){ el.checked = false; return toast("You can compare two sets at a time.", "err"); } cmp.push(el.dataset.cmp); }
    setParams({cmp: cmp.join(",")});
    if($("#modalOverlay").hidden){ const y = window.scrollY; render(true); window.scrollTo(0, y); }
    return;
  }
  if(el.dataset.mut){
    const p = state.planner, m = MUTATIONS.find(x => x.id === el.dataset.mut);
    if(el.checked){
      if(!m.req.every(r => p.mutations.includes(r))){ el.checked = false; return toast("Research its prerequisites first.", "err"); }
      if(planStats().remaining < m.ap){ el.checked = false; return toast(`Needs ${m.ap} ability points. Not enough left.`, "err"); }
      p.mutations.push(m.id);
    }else{
      const dep = MUTATIONS.find(x => p.mutations.includes(x.id) && x.req.includes(m.id));
      if(dep){ el.checked = true; return toast(`${dep.name} depends on it. Remove that first.`, "err"); }
      p.mutations = p.mutations.filter(x => x !== m.id);
      if(p.activeMut === m.id) p.activeMut = null;
      const slots = planStats().slots; if(p.equip.length > slots) p.equip = p.equip.slice(0, slots);
    }
    save(); refreshPlanner(); return;
  }
  if(el.dataset.mapCat){
    const c = el.dataset.mapCat;
    state.map.off = el.checked ? state.map.off.filter(x => x !== c) : [...new Set([...state.map.off, c])];
    save(); refreshPinVisibility(); return;
  }
  if(el.id === "mapLinkedOnly"){ state.map.linkedOnly = el.checked; save(); refreshPinVisibility(); toast(el.checked ? "Showing journal locations only." : "Showing all markers."); return; }
  if(el.id === "mapHideFound"){ state.map.hideFound = el.checked; save(); refreshPinVisibility(); toast(el.checked ? "Found markers hidden." : "Found markers shown."); return; }
  if(el.dataset.sim){
    const sim = Object.assign({}, state.planner.sim, {[el.dataset.sim]: el.value});
    state.planner.sim = cleanPlan(Object.assign({}, state.planner, {sim}), false).sim;
    save(); refreshPlanner(); return;
  }
  if(el.dataset.mutagen){
    const m = state.planner.mutagens.slice(); m[+el.dataset.mutagen] = el.value; state.planner.mutagens = m;
    save(); refreshPlanner(); return;
  }
  if(el.dataset.planMut !== undefined){ state.planner.activeMut = el.value || null; save(); toast(el.value ? "Active mutation set." : "No active mutation."); return; }
  if(el.dataset.plan){
    const lim = {level:[1, 100], pop:[0, 30], bonus:[0, 20]}[el.dataset.plan];
    const v = clampInt(el.value, lim[0], lim[1]);
    const before = state.planner[el.dataset.plan];
    state.planner[el.dataset.plan] = v;
    if(planStats().remaining < 0){ state.planner[el.dataset.plan] = before; el.value = before; toast("That would leave fewer points than you have spent. Remove points first.", "err"); return; }
    save(); refreshPlanner(); return;
  }
  if(el.dataset.setting){
    const k = el.dataset.setting;
    if(k === "theme") state.settings.theme = el.checked ? "parchment" : "night"; else state.settings[k] = el.checked;
    save(); applySettings(); renderNav();
    if(route.name === "journal"){ render(true); $(`[data-setting="${k}"]`)?.focus({preventScroll:true}); }
    toast("Setting saved."); return;
  }
  if(el.dataset.prepDone){ if(el.checked) state.prepDone[el.dataset.prepDone] = true; else delete state.prepDone[el.dataset.prepDone]; save(); alRefresh(); return; }
  if(el.dataset.filter && el.tagName === "SELECT" || (el.dataset.filter && el.type === "checkbox")) onFilterInput(el);
  if(el.id === "importFile"){ importData(el.files[0]); el.value = ""; }
});
document.addEventListener("input", e => {
  const el = e.target;
  if(el.dataset.filter && el.type !== "checkbox" && el.tagName !== "SELECT") onFilterInput(el);
  if(el.id === "paletteInput") runPalette();
  if(el.id === "mapSearch"){ $("#mapResults").innerHTML = mapResultsHtml(MV.mid, el.value); setParams({mq:el.value.trim()}); }
  if(el.id === "mnVal"){ const v = parseInt(el.value, 10); setParams({val: Number.isFinite(v) && v > 0 && v !== 100 ? Math.min(v, 99999) : ""}); mnRefresh(); }
  if(el.id === "planName"){ state.planner.name = el.value.slice(0, 60); save(); }
});
document.addEventListener("submit", e => {
  if(e.target.id === "customCardForm"){
    e.preventDefault();
    const f = e.target, name = f.name.value.trim();
    if(!name){ $("#ccErr").textContent = "Enter the card's name."; f.name.focus(); return; }
    state.gwent.deck.custom.push({id: uid(), name: name.slice(0, 60), str: clampInt(f.str.value, 0, 20), type: f.type.value === "special" ? "special" : "unit", hero: f.hero.checked});
    save(); render(true); toast(`${name} added to the deck.`);
  }
});
document.addEventListener("keydown", e => {
  const pal = !$("#paletteOverlay").hidden, mod = !$("#modalOverlay").hidden;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if(pal){
    if(e.key === "Escape"){ e.preventDefault(); closePalette(); }
    else if(e.key === "ArrowDown"){ e.preventDefault(); palMove(1); }
    else if(e.key === "ArrowUp"){ e.preventDefault(); palMove(-1); }
    else if(e.key === "Enter" && document.activeElement.id === "paletteInput"){ e.preventDefault(); palOpen(palSel); }
    else trapFocus(e, $("#paletteOverlay .modal"));
    return;
  }
  if(mod){ if(e.key === "Escape"){ e.preventDefault(); closeModal(); } else trapFocus(e, $("#modal")); return; }
  if(e.key === "Escape" && $("#sidebar").classList.contains("open")){ closeDrawer(); $("#menuBtn").focus(); return; }
  if(e.key === "Escape" && TIP.target){ tipHide(); }
  if(e.key === "[" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey){ e.preventDefault(); toggleNav(); return; }
  if((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey))){ e.preventDefault(); openPalette(); return; }
  if((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.action === "reveal"){ e.preventDefault(); e.target.click(); }
});
$("#paletteOverlay").addEventListener("mousedown", e => { if(e.target.id === "paletteOverlay") closePalette(); });
$("#modalOverlay").addEventListener("mousedown", e => { if(e.target.id === "modalOverlay") closeModal(); });
$("#searchBtn").addEventListener("click", () => openPalette());
$("#themeBtn").addEventListener("click", () => { state.settings.theme = state.settings.theme === "night" ? "parchment" : "night"; save(); applySettings(); if(route.name === "journal") render(true); });
$("#navCollapse").addEventListener("click", toggleNav);
$("#menuBtn").addEventListener("click", () => $("#sidebar").classList.contains("open") ? closeDrawer() : openDrawer());
$("#scrim").addEventListener("click", closeDrawer);
window.addEventListener("hashchange", () => { tipHide(); closeModal(); closePaletteIfOpen(); render(); window.scrollTo(0, 0); $("#view").focus({preventScroll:true}); });
function closePaletteIfOpen(){ if(!$("#paletteOverlay").hidden) closePalette(); }
window.addEventListener("storage", e => { if(e.key === STORE_KEY){ state = load(); applySettings(); render(true); } });

/* =====================================================================
   10. INIT
   ===================================================================== */
applySettings();
if(!location.hash) history.replaceState(null, "", "#/home");
render();
if(!storageOK) toast("Browser storage is blocked. Progress will not persist after this tab closes.", "err");
</script>
</body>
</html>
