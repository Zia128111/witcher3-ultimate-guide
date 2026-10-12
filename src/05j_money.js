<script>
"use strict";
/* =====================================================================
   8j. MARKET SQUARE (Money making)
   A sale calculator over the six shop types (wiki percentages turned into
   labelled estimates), coin trails for early and late methods, and a
   notice board of exploits stamped with their patch status.
   ===================================================================== */
const EX_KIND = {money:"Money", xp:"Experience", combat:"Combat", gwent:"Gwent"};
const fmtCr = n => Math.round(n).toLocaleString("en-US");
function mnVal(){ const v = parseInt(P("val"), 10); return Number.isFinite(v) && v > 0 ? Math.min(v, 99999) : 100; }

VIEWS.money = () => {
  const it = SALE_ITEMS.find(i => i.id === P("it")) || SALE_ITEMS[0];
  const pl = SALE_PLACES.find(p => p.id === P("pl")) || SALE_PLACES[2];
  const ex = P("ex");
  const ek = P("ek");
  const exList = MONEY.exploits.filter(e => (!ex || e.status === ex) && (!ek || e.kind === ek));
  return `
  <header class="page-head"><h1>Money Making</h1><p>Find the shop that pays most for what you carry, follow proven ways to earn crowns, and check which exploits were patched.</p></header>
  <section class="mn-market" aria-labelledby="mnTitle">
    <div class="mn-controls">
      <h2 id="mnTitle">Market square</h2>
      <p class="muted">Pick what you are selling and where. The stalls show who pays most.</p>
      <span class="label">Item type</span>
      <div class="mn-items" role="group" aria-label="Item type">${SALE_ITEMS.map(i => `<button class="mn-item" aria-pressed="${i.id === it.id}" data-action="set-param" data-k="it" data-v="${i.id === SALE_ITEMS[0].id ? "" : i.id}">${icon(i.icon)}<span>${esc(i.name)}</span></button>`).join("")}</div>
      <label class="label" for="mnVal">Item face value (crowns)</label>
      <div class="mn-val"><span class="mn-coin" aria-hidden="true">${icon("ph-coin")}</span><input id="mnVal" type="number" min="1" max="99999" inputmode="numeric" value="${mnVal()}"></div>
      <span class="label">Where you sell</span>
      <div class="mn-places" role="group" aria-label="Where you sell">${SALE_PLACES.map(p => `<button class="mn-place" aria-pressed="${p.id === pl.id}" data-action="set-param" data-k="pl" data-v="${p.id === "city" ? "" : p.id}"><b>${esc(p.name)}</b><span>${esc(p.note)}</span></button>`).join("")}</div>
    </div>
    <div class="mn-board">
      <div id="mnStalls" class="mn-stalls" aria-live="polite">${stallsHtml(it, pl, mnVal())}</div>
      <p class="mn-note">${icon("ph-info")}Estimates only: face value × shop tier × the wiki's bonus. Real prices also depend on hidden item flags, area discounts earned through quests, and each shop's crowns on hand.</p>
    </div>
  </section>
  <p class="src" style="margin-top:8px">Selling rules: Witcher Wiki pages for merchants, armorers, blacksmiths, herbalists, innkeepers and junk. ${srcLine(["fandomMerch"]).replace(/^<p class="src">|<\/p>$/g, "")}</p>

  <div class="mn-facts section">${SALE_FACTS.map(f => `<div class="mn-fact">${icon(f.icon)}<div><b>${esc(f.title)}</b><p>${esc(f.body)}</p></div></div>`).join("")}</div>

  <section class="section" aria-labelledby="trailTitle">
    <h2 id="trailTitle" style="margin-bottom:14px">Coin trails</h2>
    <div class="mn-trails">
      ${[["Early game", "ph-plant", MONEY.early], ["Late game", "ph-crown-simple", MONEY.late]].map(([t, ic, arr]) => `<div class="mn-trail"><h3>${icon(ic)}${t}</h3><ol>${arr.map((m, i) => `<li><span class="mn-step mono" aria-hidden="true">${i + 1}</span><div><div class="row" style="gap:8px;flex-wrap:wrap"><b>${esc(m.title)}</b>${vTag(m.v)}</div><p>${esc(m.body)}</p></div></li>`).join("")}</ol></div>`).join("")}
    </div>
  </section>

  <section class="section" aria-labelledby="exTitle">
    <div class="row between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px"><h2 id="exTitle">Exploit notice board</h2>
      <div class="row" style="gap:8px;flex-wrap:wrap">${chipsHtml("ek", [["", "All types"], ...Object.entries(EX_KIND)], ek, "Exploit type")}${chipsHtml("ex", [["", "Any status"], ["reported", "Reported working"], ["patched", "Patched"], ["unverified", "Unverified"]], ex, "Exploit status")}</div></div>
    <div class="notice danger" style="margin-bottom:16px">${icon("ph-warning-octagon")}<div><strong>None of these were tested here.</strong> Patched entries are confirmed fixed by official patch notes. Reported working means no patch note fixes it and a source says it worked on a recent version; it may still fail on the current Remastered 5.01. Unverified entries have no evidence either way.</div></div>
    <div class="mn-notices">${exList.map((e, i) => `<article class="mn-notice ${e.status}" style="--tilt:${[-1.2, .8, -.5, 1.1, -.9, .6][i % 6]}deg">
      <span class="mn-nail" aria-hidden="true"></span>
      <span class="mn-kind">${esc(EX_KIND[e.kind] || "Other")}</span>
      <h3>${esc(e.name)}</h3>
      ${e.steps ? `<p class="mn-steps">${esc(e.steps)}</p>` : ""}
      ${e.note ? `<p>${esc(e.note)}</p>` : ""}
      ${e.ver ? `<p class="mn-ver">Last reported: ${esc(e.ver)}</p>` : ""}
      ${e.status === "reported" ? `<p class="mn-srcs">${e.src.map(k => SOURCES[k]).filter(Boolean).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join(" · ")}</p>` : ""}
      <span class="mn-stamp">${e.status === "patched" ? `Patched${e.patch ? " · " + esc(e.patch) : ""}` : e.status === "reported" ? "Reported working" : "Unverified"}</span>
    </article>`).join("") || `<p class="muted">No exploits match this filter.</p>`}</div>
    ${srcLine(["fandomPatch"])}
  </section>`;
};
function stallsHtml(it, pl, val){
  const rank = s => { const b = it.buyers[s.id]; return b ? (b.best ? 0 : 1) : 2; };
  return [...SHOPS].sort((a, b) => rank(a) - rank(b)).map(s => {
    const b = it.buyers[s.id];
    let est = "", bar = 0, state = "none", tag = "No bonus listed";
    if(b){
      state = b.best ? "best" : "buys"; tag = b.best ? "Best buyer" : "Also buys";
      if(b.bonus){ const lo = val * pl.rate * b.bonus[0], hi = val * pl.rate * b.bonus[1];
        est = Math.round(lo) === Math.round(hi) ? `≈ ${fmtCr(lo)}` : `≈ ${fmtCr(lo)} to ${fmtCr(hi)}`; bar = Math.min(100, hi / val * 200); }
      else est = b.best ? "Top price" : "Below herbalist";
    }
    return `<div class="mn-stall ${state}">
      <span class="mn-sign">${gImg(s.icon, 64, "", "")}${icon("ph-storefront")}</span>
      <div class="mn-stall-body"><div class="row between" style="gap:6px"><b>${esc(s.name)}</b><span class="mn-tag">${b && b.best ? icon("ph-crown-simple ph-fill") : ""}${tag}</span></div>
        <div class="mn-est mono">${est ? `${est}${b.bonus ? ` <small>crowns</small>` : ""}` : `<small>The wiki names no special rate for ${esc(it.name.toLowerCase())}</small>`}</div>
        ${bar ? `<div class="mn-bar" aria-hidden="true"><i style="width:${bar.toFixed(1)}%"></i></div>` : ""}
        ${b ? `<p>${esc(b.why)}</p>` : ""}</div>
    </div>`;
  }).join("");
}
function mnRefresh(){
  const it = SALE_ITEMS.find(i => i.id === P("it")) || SALE_ITEMS[0], pl = SALE_PLACES.find(p => p.id === P("pl")) || SALE_PLACES[2];
  const box = $("#mnStalls"); if(box) box.innerHTML = stallsHtml(it, pl, mnVal());
}
</script>
