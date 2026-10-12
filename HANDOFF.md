# Handoff: The Witcher 3 Ultimate Guide

## What exists
- `index.html` is the whole site: HTML, CSS and vanilla JS in one file, with no build step. Open it directly in a browser.
- The JS sections are labelled in order: 1 Data, 2 State and persistence, 3 Utilities, 4 Modals, 5 Navigation and routing, 6 Search, 7 Detail modals, 8 Views, 9 Interactions, 10 Init.
- Progress is stored in `localStorage` under the key `w3guide:v1` (versioned). JSON export and import go through `sanitize()`, which validates and drops anything malformed.

## Deviation from CLAUDE.md
The user explicitly asked for a single vanilla HTML file with no Next.js, Tailwind or shadcn/ui. That means the shadcn preset `b3ktYM0tU` was **not applied**: this deliverable contains no shadcn setup at all. If the project later moves to the Next.js plan in `witcher_3_ultimate_guide_claude_prompts.md`, the preset has to be applied then.

## Verified in the browser (local preview at 375, 746, 1180, 1366 and 1440 px)
- Every route and tab renders with no console errors. No horizontal overflow at 375 px.
- Checklists persist across a reload. URL filters work.
- Search palette: keyboard navigation and opening detail views.
- Skill planner (Remastered): unlock rules, stranding guard, rank and point caps, equip slots and mutagen groups, mutations, presets, forecast numbers, save build, share link (and a damaged link is rejected).
- Gwent ownership, missing-card filter and deck rules (22+ units, ≤10 specials), including custom cards.
- Alchemy prep list totals. Favorites. Night and parchment themes. Import sanitizing.

## Not tested
- Opening via `file://` in each browser. Chrome supports localStorage on file:// but this wasn't exercised.
- The real export download dialog.
- Screen-reader passes with NVDA or VoiceOver.

## Data coverage and backlog
See the in-app page "Sources and Data" for per-dataset verification counts. Gaps:
- Monster nests, merchants and signposts are incomplete.
- No crafting materials, item stats or crown amounts.

The research relied on community wikis (fandom was read via its MediaWiki API, plus Fextralife and game-checklists). Records tagged "Unverified" need checking in game.

## Interactive map
- Route `#/map`, JS section "8b. INTERACTIVE MAP". It's a vanilla tile viewer, no map library: 256px TMS tiles, drag, wheel, pinch and keyboard pan/zoom, URL state (`m`, `z`, `c`, `pin`, `mq`).
- Tiles and the 1,219 markers come from witcher3map (github.com/witcher3map/witcher3map), CC BY-NC-SA 4.0, last updated in 2016. Map data is in section "1b. MAP DATA", extracted with HTML stripped. Hearts of Stone data duplicated Velen and was dropped.
- Projections: Web Mercator for White Orchard and Skellige, Leaflet CRS.Simple for Velen, Toussaint and Kaer Morhen. Tile y follows Leaflet 0.7 TMS rules. Alignment was checked visually (Crow's Perch, the White Orchard inn, Kaer Trolde Harbor).
- Tile hosts: raw.githubusercontent.com, then jsDelivr. witcher3map.com sends 403 to foreign referrers (hotlink protection), so it is deliberately not used.
- Found state is stored in `state.checks` as `m:<map>:<category>:<index>`. Hidden categories and "hide found" are in `state.map`.
- Marker positions are community data and were not independently verified.
- Journal links: `LOCATION_PINS` (in the map section) links 51 of 91 World Explorer entries to markers. They were generated offline and reviewed. A link is made only on an exact signpost name, a unique nearest signpost, or a quest or role named in the marker text. Each link records its reason (`how`) and any partial-coverage `note`.
- Unlinked on purpose (ambiguous): the two White Orchard "Sawmill" and two Velen "Ancient Oak" Places of Power, the Kaer Trolde Axii and Gedyneith Places of Power (elimination only), most named Gwent players, Tomira, Yolar, Trentin, the Upper Mill smith, and the Aerondight hermit (marker contradicts our record).
- Visited and found ticks mirror only across one-to-one links (`linkedChecks`). Multi-pin entries such as "Amateur blacksmiths" don't mirror.
- Marker ids (`m:<map>:<cat>:<index>`) depend on the order of the embedded map data. Regenerate `LOCATION_PINS` if that data is ever re-extracted.

## Skill trees (Remastered)
- JS section "1c. SKILL TREES" (generated) and section "8c. SKILL TREE PLANNER". The classic 4.0x tree was removed.
- Data: all 80 nodes (4 trees of 20) with 3 ranks each, per-rank effect text, per-point tree passive, and prerequisites. Parsed from the fandom wiki pages "The Witcher 3 abilities/Combat|Signs|Alchemy|General"; the prerequisites match Fextralife's Remastered tables.
- Rules from the wiki: starting nodes are Combat's top row (Muscle Memory, Arrow Deflection), Signs' 5, Alchemy's 3, and General's 6 school nodes. Any other node needs a point in one listed prerequisite. Removing a point is refused if it would strand an invested node.
- The x/y layout of each tree is this guide's own drawing; no in-game layout image was available. Connections are from the wiki.
- Hit forecast: every number is regex-extracted from the current rank's text (`forecast()`). Percent bonuses are summed within a hit and procs applied on top. Armor, resistances, crits and the real stacking order are not modelled, and the UI says so.
- Mutagen groups: slots 1-12 form 4 groups of 3; a group's bonus shows as active when all three skills match its mutagen colour. Bonus magnitudes are not stated in the source, so none are shown.
- Not modelled: per-level slot unlock schedule (wiki: all 12 open by level 30), Ciri's abilities, and mutation colour restrictions on the extra slots.
- Old saved builds that used classic skill ids load with those skills dropped (`cleanPlan` filters unknown ids).

## Bestiary codex
- JS section "8d. BESTIARY CODEX" replaces the old list view. It has an index rail (category, Sign weakness, search) and a specimen plate (URL param `m`).
- The weakness wheel and hunt kit come straight from each `MONSTERS` record. Kit sockets link to `ALCHEMY` recipes by exact name, and "Add kit to prep list" increments `state.prep`.
- Study marks: `state.checks["beast:<id>"]`, shown in the index, the plate and the progress overview.
- Contracts are matched by whole word on the monster name (or a distinctive last word). So "Wraith" no longer matches Noonwraith, and "Griffin" doesn't claim archgriffin contracts.
- Art: every monster has its Witcher 3 bestiary render (`MONSTER_IMG` in section 1d, fandom CDN paths, mostly `Tw3_journal_*.png`; Archespore only has its bestiary icon). Renders appear in index rows, the plate header (right side) and the centre of the weakness wheel. The category emblem shows until load and on error. Wallpapers stay behind the header for the fiend, leshen, griffin, golem and earth elemental.
- All monster links (search, alchemy chips, DLC enemy chips) now open the codex plate instead of a modal.

## Alchemist's workbench
- JS section "8h. ALCHEMIST'S WORKBENCH" replaces the old alchemy list. Tabs for potions, decoctions, oils, bombs and ingredients (URL `kind`). The shelf of vials shows real inventory icons (`ALC_ICON` in section 1d, fandom CDN paths). The bench (`r`) shows a brewing ring with ingredient icons and quantities, a satchel stepper, and "Effective against" monster renders. The ingredient bench (`ing`) lists the recipes that use it.
- Satchel: `state.prep` and `state.prepDone`, same keys as before. `prepHtml` and `prepTotals` keep their names, and all prep actions refresh through `alRefresh()`, so the bestiary "Add kit" still works.
- No icon on the wiki: Water Hag and Chort decoctions, and the monster mutagens (their colour isn't confirmed, so they show a DNA emblem).

## Trophy hall (collectibles)
- JS section "8i. TROPHY HALL" replaces the old collectibles view. There are three tabs, stored in the URL as `tab`.
- **Places of Power:** 27 sign runes grouped by region. The sign is parsed from each location's name. The ability-point total feeds the skill planner through the "Use N in skill planner" action (`cl-sendpop`, which sets `state.planner.pop`). There is a Map button on each stone linked in `LOCATION_PINS`.
- **Treasure ledger:** per-map cards with found/total counts for the guarded, hidden, spoils and smugglers markers. These counts come from the markers you tick on the interactive map. The tab also lists named treasures and diagram-hunt quests.
- **Trophy hall:** 41 achievement medals on shelves for the base game, HoS and BaW. Icons come from `ACH_ICON` in section 1d. The base game has separate locked and unlocked art; DLC icons have no locked variant, so they are grayscaled when locked. Filter with `af`: unlocked, locked or missable.
- The achievement detail modal (`openDetail("ach")`) now redirects to the trophy hall.
- Backlog: two Toussaint Places of Power and the Through Space and Time one are not listed. The achievement list is a 41-entry selection, not the full list.

## Witchers' hall (Builds and Planner)
- JS section "8o. WITCHERS' HALL" replaces the old `VIEWS.builds`, `libraryHtml` and `savedBuildsHtml`. Tabs: Witchers' hall (default) and Skill planner (`tab=planner`).
- **Hall:**
  - Four school banners select a recommended build (URL param `b`), each tinted by its dominant tree.
  - The showcase has a points-by-tree split bar, stats (points, slotted skills, mutation AP), mutagen orbs with tooltips, and a constellation of all four trees drawn from `SKILL_TREES` coordinates. Allocated skills are lit by rank and equipped skills ringed, with a tooltip per node.
  - It also has numbered playstyle steps, the kit, the mutation chain and "Load into planner" (existing `load-build` action).
  - Saved builds below reuse the journal's `jnScrolls()`.
- **Planner banner:** the current build name, a live read ("Alchemy-focused", "Hybrid", "An empty slate"), level, and four tree gauges scaled to the largest tree. Clicking a gauge switches the tree. The planner re-renders on every change, so the banner stays live.
- Opening a build favourite or `openDetail("build")` now goes to the hall (`#/builds?b=<id>`) instead of a modal. `DETAIL.build` is unused.

## The witcher's tome (My Journal)
- JS section "8n. THE WITCHER'S TOME" replaces the old journal view. It is a leather tome with ribbon-bookmark tabs (URL param `jt`).
- **Chronicle:**
  - A story act line covering the 38 main quests grouped by `act`: Prologue, Act I Velen, Novigrad and Skellige, Act II and Act III. Each act has a progress seal, a "You are here" marker and the next quest.
  - Nine wax "seals of progress" from `computeProgress()`.
- **Keepsakes:** favourites as cards with a kind filter (`fk`). A stale filter falls back to All.
- **Build scrolls:** saved builds with a points-by-tree split bar (tree colours from `TREE_META`, a tooltip per segment), level, mutations, an open-in-planner button and delete.
- **Settings and backup:**
  - Rune toggles for theme, reduce motion, spoiler shield and the new compact sidebar setting. Changing one re-renders the page and keeps focus.
  - Export, import and reset cards, plus the KB stored.
- `savedBuildsHtml()` is kept for the builds page.

## Sidebar rail and tooltips
- **Collapsible sidebar:** on desktop (1025px and wider), the sidebar folds into a 76px icon rail.
  - Toggle with the "Collapse" button at the foot of the nav, or the `[` key when not typing.
  - The state is saved as `state.settings.navCollapsed` and validated in `sanitize`. `applySettings()` applies the `.app.nav-collapsed` class and updates the button's label, icon and `aria-expanded`.
  - In rail mode, nav links get right-side tooltips with their label and count.
  - Below 1025px the toggle is hidden and the mobile drawer is unchanged.
- **Tooltips:** one floating `#tip` element (fixed position, so scroll containers never clip it) replaces the old CSS `::after` tooltips.
  - It shows for any `[data-tip]`, and automatically for icon-only buttons and links that have an `aria-label` and no visible text.
  - `data-tip-side="right"` places it to the right. It flips to below when there's no room above and is clamped to the viewport.
  - It shows on hover after a short delay, or immediately on keyboard focus (`:focus-visible`). It hides on scroll, resize, route change, Escape or touch.
- **Tooltips added:** nav counts ("12 of 115 quests completed") and the theme toggle.
- **Test note:** in a hidden or background browser pane, CSS transitions freeze, so measured widths can lag one toggle behind. With reduced motion on, every toggle measured correctly.

## The medallion (home)
- JS section "8m. THE MEDALLION" replaces the old home view.
- **Medallion:** the hero holds a progress medallion. The core ring is the average of the nine `computeProgress()` categories, shown with one decimal below 10%. Each category node sits on a spoke whose gold length is its percentage.
- **Selecting a node:** sets URL param `hn`. The inspector then shows done/total and a next step from `hmNext()`: the next main quest, a missable side quest, an unclaimed Place of Power, an unvisited location (deep-links into the atlas), cards missing, a missable achievement, or an unstudied monster.
- **Below the hero:**
  - "The path ahead": last page, next main quest with a tick box, and the earliest missable checkpoint.
  - "Codex" doors: a bento grid of artwork links.
  - "Waypoints": 12 quick links.
  - "Recent trail".
- `completionGrid()` and `computeProgress()` are kept for My Journal.

## Atlas (World Explorer)
- JS section "8l. ATLAS" replaces the old World Explorer view.
- **Region selector:** a bar of region medallions with progress rings (URL param `r`). With no region chosen, each region gets a large card with art, a progress ring and per-type counts.
- **Field chart:** built from the interactive map's zoom-2 tiles. It reuses `TILE_HOSTS`, `tileFile`, `unitBounds` and `toUnits`, with a fallback host on error.
  - Signposts are faint dots, and journal locations with a `LOCATION_PINS` link are type-coloured pins.
  - Clicking a pin sets `sel`, and the legend chips filter pins by type (`t`).
  - Velen and Novigrad share one chart.
  - Vizima and Isle of Mists have no map in the data, so they show an artwork panel saying so.
- **Inspector:** a sticky panel. It shows the region summary, or the selected place with a visited toggle, map buttons (one per pin), a favourite button and how the map link was made.
- **Field ledger:** location cards with the same filters as before (`q`, `t`, `hide`, `onmap`) through `#list`/`world_list`. A card's name selects it on the chart, switching region if needed. Regions with no locations show a backlog empty state.

## Expansion tales (DLC and New Game+)
- **Where it lives:** JS section "8k. EXPANSION TALES" replaces the old DLC view. The data is in section 1d as `DLC_TALES`. Sources are the fandom main-quest tables for each expansion, "Whatsoever a Man Soweth...", and "The Witcher 3 decision checklist" (source keys `fandomHoSQ`, `fandomBaWQ`, `fandomDecide`).
- **Tale tree:** the main quests run on a spine with checkable seals; nodes tick off journal quests where a matching record exists. Decisions are stored in the URL as `d_<id>`, so a path can be shared.
  - Soft decisions (journal, story, Dettlaff) don't block the walk.
  - A decision whose outcome depends on unset soft choices asks for them first.
  - The endings panel shows whether each ending is reachable. Clicking an ending applies its `path`.
- **Endings covered:**
  - **Hearts of Stone:** 2 endings (pact dissolved or fulfilled), each with its rewards.
  - **Blood and Wine:** 4 endings (sisters reconcile, blood at the ceremony, duchess mourns, both sisters die).
  - **Undocumented case:** investigating without the journal and story is labelled "Outcome not documented", because the checklist doesn't describe it.
- **Quests not in the journal data:** several Blood and Wine main quests (e.g. Where Children Toil, The Man from Cintra, Beyond Hill and Dale..., Blood Simple, What Lies Unseen, Pomp and Strange Circumstance, Burlap is the New Stripe) show as uncheckable nodes. Adding them to `QUESTS` would make them checkable.
- **New Game+ tab:** a readiness ring over the prep checklist (same `ng-*` check ids), plus the crosses-over / left-behind ledger and the scaling steps.

## Market square (money making)
- JS section "8j. MARKET SQUARE" replaces the old money view.
- **Data:** the selling rules live in section 1d as `SHOPS`, `SALE_PLACES`, `SALE_ITEMS` and `SALE_FACTS`. They come from these Witcher Wiki pages, with source key `fandomMerch`: The Witcher 3 merchants, Armorer, Blacksmith, Herbalist, Innkeeper and The Witcher 3 junk.
- **Sale calculator:** URL params are `it` (item type), `pl` (where you sell) and `val` (face value, updated live without a re-render via `mnRefresh`).
  - Each stall's estimate is face value × shop tier × the wiki's bonus. The tiers are village 20%, Skellige 35% and large city 41.5%. The bonuses are armorer and blacksmith +20%, innkeeper +5–12% on food and +5–15% on junk.
  - The herbalist has no figure on the wiki, so the stall says "Top price" instead of a number. Every estimate is labelled as an estimate.
- **Coin trails:** the early and late methods from `MONEY`. The 1.12 tip (Skellige prices drop 10% after The Lord of Undvik) was added.
- **Exploit notice board:** 15 entries, each with a `kind`. Filter by `ek` (type) and `ex` (status).
  - Every "patched" entry quotes a fandom patch-notes page (1.04 to 1.30). I read all 31 Witcher 3 patch pages, including 4.x and 5.x, for exploit lines.
  - The two "unverified" entries have no evidence either way.
  - **"Reported working" status (18 entries now):**
    - **Pang of Conscience sword respawn:** fandom lists it as a bug, and no patch from 1.01 to 5.01 mentions a fix. One guide (GamingProMax, 29 Sep 2026) says it survived Remastered 5.0. It is not reported on 5.01 and was not tested by us.
    - **White Orchard chort farm:** fandom says only one chort spawns at a time now; no version is named.
    - Each reported notice shows its steps, the last reported version and its source links.
  - Also added: the cow-hide farm, countered in 1.05 by the Bovine Defense Force.
  - **Rejected for weak evidence:** the Hanse base bandit loot farm, which only one guide claims respawns. The PC `addmoney` console command is not an exploit.
  - **Latest patch is 5.01** (8 Oct 2026). Re-check the reported entries when new reports appear.

## Armory (gear)
- JS section "8g. ARMORY" replaces the old accordion and compare modal. It has three tabs (URL `tab`: empty, `weapons`, `crafting`).
- Armory: a school crest rail (`s`) and an armor stand. The stand shows the set render (Griffin, Manticore, Viper) or the selected tier's inventory icon, over the school-gear quest screenshot, with grandmaster sword icons. The upgrade path is drawn as tier medallions with icons (`t` selects a tier) and a crafted toggle (`gear:<set>:<tier>`, as before). "Forged by" links to Yoana, Hattori and Lafargue map pins. Comparison is inline (`vs`).
- Weapon rack: page images for 7 of 12 weapons (emblem otherwise), an inspector (`w`) and a collected toggle (`own:<id>`).
- Craftsmen: a ladder (grandmaster, master, journeyman, amateur) classified from the location name and hint text, with map and details links.
- `GEAR_IMG` (section 1d) holds fandom CDN paths. Ursine and Wolven have no grandmaster armor icon on the wiki, so their grandmaster medallion shows the school emblem.

## Quest journal
- JS section "8f. QUEST JOURNAL" replaces the old list view (`questRow` stays for other pages). It has three tabs (URL `tab`: empty, `board`, `journal`) and one inspector (URL `qid`; `q` remains the search box).
- Chronicle: the main quests drawn as a path from `chronicleLayout()`. The Prologue is one trail, Act I splits into parallel Velen, Novigrad and Skellige lanes, and the path rejoins for Acts II and III. Order follows the guide's main-quest list, not a verified play order. The next unfinished main quest pulses; missable quests carry an hourglass badge. A "Points of no return" list shows open missables.
- Notice board: contracts as parchment notices. The target monster (whole-word match against `MONSTERS`) shows its render and a "Know your foe" link to the bestiary. Contracts whose target isn't in the bestiary show no art.
- Walkthrough steps can be ticked individually: `state.checks["qs:<questId>:<i>"]`.
- All quest links across the site open the journal inspector instead of a modal.

## Gwent cabinet
- JS section "8e. GWENT CABINET" replaces the old Gwent view. It has a card cabinet (faction banners, filters, inspector; URL params `f`, `c`) and a deck table (leader slot, rule plaques, lanes per row, card pool).
- `GWENT_CARDS` is the full list: 186 cards (183 collectible; Hemdall, Bovine Defense Force and Roach are flagged as tokens). It was parsed from the rendered fandom deck pages, with rows read from the row icon and `copies` counted from the source text.
- Card art: each card's `img` is its card-face path on the fandom CDN (`static.wikia.nocookie.net/witcher/images/<img>`), loaded at a scaled width. Cards show the emblem design until the image loads, and fall back to it on error.
- Ownership is stored as copies per card (`state.gwent.owned[id] = n`). The deck allows up to the owned copies, or all copies with "include cards I don't own". `GWENT_LEGACY` migrates old card ids, decks and favorites. The custom-card form was removed now that the list is complete.

## Fextralife enrichment
- JS section "1d. ENRICHMENT" merges research into `MONSTERS` and `QUESTS` at load time, filling gaps only: monster regions (merged), loot, tips and DLC tags; quest walkthrough steps, start, level and rewards for 38 quests. All text is paraphrased, and each record links to its Fextralife page.
- Fixes: Water Hag Signs are Igni and Quen (confirmed on Fextralife and fandom). Conflicts are shown on the Alp and Katakan plates.
- Fextralife region lists are thin, so regions mean "confirmed on page", not "complete".

## Artwork
Witcher 3 wallpapers are hotlinked from wallpapercave.com at the user's request, for personal use. Each falls back to a picsum.photos photo, then to a CSS gradient. Don't deploy publicly without replacing them with licensed art.
