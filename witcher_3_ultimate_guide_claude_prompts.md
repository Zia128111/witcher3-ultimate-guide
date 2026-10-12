# The Witcher 3 Ultimate Guide — Claude Code Master Prompt Pack

A phased implementation plan for building a premium, interactive companion website for **The Witcher 3: Wild Hunt**, including **Hearts of Stone** and **Blood and Wine**.

## How to use this file

1. Open the project folder in Claude Code.
2. Run **Phase 1** first and let Claude finish it.
3. Review the result and run the next phase prompt only after the previous phase is complete.
4. Keep this file in the repository so Claude can refer to it between sessions.
5. At the beginning of each phase, Claude must inspect `PROJECT_OVERVIEW.md`, `HANDOFF.md`, and the relevant source code before editing anything.

> **Important:** The website must not present invented game facts as verified. A complete, accurate game encyclopedia requires research and source validation; implement the application and expand verified content in manageable stages.

---

# Shared instructions for every phase

Include these rules in every phase. Phase 1 establishes the foundation; later phases must preserve it.

## 1. Mandatory shadcn/ui preset

I have already created a custom shadcn/ui preset. **Use this exact preset:**

`b3ktYM0tU`

If shadcn/ui has not been initialized, use the official CLI and the preset:

```bash
npx shadcn@latest init --preset b3ktYM0tU
```

Before running the command, inspect the existing repository and follow the current official shadcn/ui CLI behavior. If the project already has shadcn/ui configured, inspect its setup and determine the safest supported way to apply or preserve the preset. Do not blindly overwrite working configuration.

Non-negotiable rules:

- Do not substitute another preset or silently fall back to the default.
- Do not recreate the preset's styling manually before attempting to apply it.
- Preserve the preset's generated design tokens, theme variables, component conventions, and configuration.
- If the preset cannot be applied, stop and report the exact issue rather than silently using another setup.
- Do not reinitialize shadcn/ui in later phases.
- Document the applied preset and relevant setup in `PROJECT_OVERVIEW.md`.

Official documentation: https://ui.shadcn.com/

## 2. UI and technical stack

Prefer the following when starting from an empty project, but respect a suitable existing stack:

- Next.js App Router
- TypeScript with strict typing
- Tailwind CSS
- shadcn/ui using the preset above
- Lucide React icons
- React Hook Form and Zod when forms and validation are needed
- Recharts for useful statistics and progress visualizations
- A suitable interactive map library or a verified map-image overlay system

Use shadcn/ui as the primary component system. Use its components where appropriate, including `Button`, `Input`, `Card`, `Badge`, `Separator`, `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `DropdownMenu`, `Popover`, `Command`, `Tabs`, `Accordion`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `Table`, `Pagination`, `ScrollArea`, `Tooltip`, `Breadcrumb`, `Progress`, `Skeleton`, and `Alert`.

Specialized features such as map canvases, skill trees, and charts may use purpose-built implementations, but their surrounding UI must follow the same design system.

Do not install another UI framework such as Material UI, Chakra UI, or Ant Design. Avoid unnecessary dependencies.

## 3. Visual direction

Create a premium dark-fantasy field-journal aesthetic that suits The Witcher 3 without copying proprietary artwork or logos.

- Near-black and charcoal surfaces
- Muted steel borders
- Warm ivory and muted-gray text
- Restrained crimson accents
- Antique-gold highlights for rare discoveries
- Elegant serif headings paired with highly readable sans-serif body text
- Intentional spacing, clear hierarchy, subtle texture, and restrained motion
- Responsive layouts and accessible contrast

Respect the preset's design tokens and conventions. Customize them intentionally rather than leaving the default look untouched, but do not discard the preset to force the visual direction.

## 4. Architecture and code quality

- Inspect before editing; preserve existing working code.
- Keep game data separate from UI components.
- Use reusable, typed data schemas and stable record IDs.
- Keep shared UI primitives separate from feature-specific components.
- Use URL state for shareable filters and views where appropriate.
- Ensure buttons, filters, search, checklists, and other interactive controls actually work.
- Provide loading, empty, error, and success states.
- Support keyboard access, focus states, and accessible labels.
- Optimize for desktop, tablet, and mobile.
- Do not claim functionality or content is complete unless it has been implemented and tested.
- Run the available type checks, linting, build, and relevant tests after each phase.
- Update `PROJECT_OVERVIEW.md` and `HANDOFF.md` at the end of every phase, including completed work, commands run, data coverage, known issues, and next steps.

## 5. Accuracy and research

Research game mechanics, quests, maps, items, recipes, skills, Gwent cards, achievements, expansions, and patch differences using reliable sources. Respect source terms, attribution requirements, and applicable content licenses.

Every factual record should support source references and a verification status. Distinguish verified facts from estimates, community recommendations, and version-dependent methods. Never fabricate map coordinates, item stats, recipes, quest consequences, rewards, or current exploit status.

If complete coverage cannot be verified in a phase, deliver the working system and a clearly identified, measurable content backlog instead of inventing data.

---

# Phase 1 — Foundation, preset setup, and design system

**Goal:** Establish the working application foundation and design system before building complex features.

```text
# PHASE 1 — THE WITCHER 3 ULTIMATE COMPANION: FOUNDATION

Read the shared instructions in this prompt pack. Inspect the repository, existing framework, dependencies, and current implementation before editing.

MANDATORY: Use my exact shadcn/ui preset `b3ktYM0tU`. If shadcn/ui is not configured, initialize it using the official CLI with `npx shadcn@latest init --preset b3ktYM0tU`, following the current CLI behavior. If already configured, inspect the setup and apply or preserve the preset safely. Never silently substitute another preset.

Create the foundation for a premium, responsive Witcher 3 companion website. Use the established shadcn/ui preset, Tailwind CSS, TypeScript, and the existing project architecture.

Create:
- Responsive application shell and navigation
- Global search entry point
- Homepage dashboard
- Reusable page templates
- Consistent typography, spacing, borders, focus states, buttons, cards, badges, tables, dialogs, tabs, tooltips, and forms
- Breadcrumbs and related-content navigation
- Loading, empty, and error states
- Responsive desktop, tablet, and mobile layouts

Create functional routes for:
- `/`
- `/maps`
- `/builds`
- `/quests`
- `/gear`
- `/bestiary`
- `/alchemy`
- `/money-making`
- `/gwent`
- `/collectibles`
- `/characters`
- `/endings`
- `/dlc`
- `/new-game-plus`
- `/tracker`
- `/search`

Design typed, reusable data schemas for locations, quests, items, skills, monsters, recipes, Gwent cards, achievements, and guides. Each schema should support stable IDs, category, descriptions, expansion requirements where relevant, source references, verification status, and relationships to other records.

Keep data separate from UI components. Do not try to fill the entire encyclopedia in this phase.

Homepage sections:
- Universal search
- Quick links to maps, builds, quests, gear, Gwent, and money-making
- Popular guides and beginner help
- Recommended builds
- DLC shortcuts
- A continue-your-adventure area prepared for later progress tracking

Any sample content must be clearly labeled as sample or unverified. Do not present invented facts as verified.

At the end, verify the app runs, routes render, navigation works, and the layout is responsive. Run available checks and fix errors. Create/update `PROJECT_OVERVIEW.md` and `HANDOFF.md` documenting the preset, architecture, routes, commands run, limitations, and next phase.

Do not proceed to Phase 2 until this phase is working and documented.
```

---

# Phase 2 — Interactive maps and locations

**Goal:** Build the core map experience and verified location database.

```text
# PHASE 2 — INTERACTIVE WORLD MAP SYSTEM

Continue the existing project. Read `PROJECT_OVERVIEW.md`, `HANDOFF.md`, and relevant source files first. Preserve Phase 1 and the exact shadcn/ui preset `b3ktYM0tU`. Do not rebuild the project or reinitialize shadcn/ui.

Build an interactive map system for The Witcher 3: Wild Hunt, Hearts of Stone, and Blood and Wine.

Support these regions where verified map data is available:
- White Orchard
- Velen and No Man's Land
- Novigrad
- Oxenfurt
- Skellige
- Kaer Morhen
- Toussaint
- Relevant islands, caves, interiors, and quest-specific areas where practical

Map requirements:
- Zoom and pan
- Clickable markers
- Category filters and region switching
- Search locations
- Selected-location detail panel
- Marker clustering if useful
- Mobile-friendly map controls
- Deep links to regions and selected markers
- Completion status and hide-completed filter

Categories should include:
- Signposts and fast-travel points
- Places of Power
- Witcher gear diagrams
- Hidden and guarded treasures
- Smuggler's caches
- Monster nests and bandit camps
- Abandoned sites
- Notice boards
- Merchants, blacksmiths, armorers, and alchemists
- Quest starters and objectives
- Gwent opponents and collectible cards
- Horse races and fistfights
- Caves, ruins, secrets, and other points of interest
- Rare equipment and crafting materials

A location panel should display verified details where available:
- Name, region, and category
- Map position and directions
- Recommended level
- Prerequisites
- Enemies or hazards
- Rewards and loot
- Related quests, items, and guides
- Source references and verification status
- Completion toggle

Use authentic, legally usable map assets or verified map data. If using image overlays, store marker positions in a stable coordinate system and preserve alignment during zooming and resizing. Do not fabricate coordinates or substitute a decorative map that pretends to be accurate.

Use shadcn/ui for surrounding controls and panels: Sheet or Drawer, Popover, Select, Checkbox, Badge, Tooltip, and related components as appropriate.

Create a normalized location data model. Seed only researched, traceable records. Clearly show which regions or categories remain incomplete. Do not claim full map coverage until it is measured and verified.

Test filters, zoom, pan, marker alignment, detail panels, deep links, empty states, and mobile controls. Update project documentation and handoff with supported regions, actual data coverage, limitations, and next steps.
```

---

# Phase 3 — Builds, skills, and interactive build planner

**Goal:** Make a genuinely functional build calculator, not a static build gallery.

```text
# PHASE 3 — BUILDS AND SKILL PLANNER

Continue the existing project. Read the handoff documentation and reuse existing components, data schemas, and the shadcn/ui preset `b3ktYM0tU`. Do not replace the established design system.

Build a researched build library for:
- Fast-attack combat
- Strong-attack combat
- Alchemy and toxicity
- Euphoria, where applicable to the selected game version
- Sign-focused builds
- Igni and Aard specialization
- Quen and defensive builds
- Critical hits and damage-over-time strategies
- Hybrid combat and signs
- Beginner progression
- Death March
- Endgame
- New Game Plus
- Blood and Wine mutation-based builds

Every build guide should include:
- Intended playstyle and strengths/weaknesses
- Recommended level and skill-point budget
- Exact skill selections, levels, and prerequisites
- Skill-slot and mutagen arrangements
- Mutation requirements where applicable
- Recommended gear, weapons, enchantments, and runewords
- Potions, decoctions, oils, and bombs
- Combat strategy and progression by early, mid, and endgame
- Alternative equipment when the ideal gear is not available
- Expansion and game-version requirements

Build a real interactive planner that supports:
- Selecting skills and ranks
- Validating prerequisites
- Counting available and spent skill points
- Configuring active skill slots and mutagens
- Selecting mutations where unlocked
- Selecting equipment
- Showing missing requirements and invalid choices
- Resetting the build
- Saving and reopening builds
- Duplicating and comparing builds
- Copying a build summary or generating a shareable configuration/link

Enforce actual game rules. Do not let users equip every skill simultaneously or select expansion-only mechanics without the relevant expansion. Verify skill names, ranks, effects, prerequisites, slot limits, mutations, and version differences against reliable references.

Use shadcn/ui components such as Tabs, Card, Slider, Select, Dialog, Badge, and Tooltip where appropriate. Keep the skill-tree visualization specialized if needed.

Test several builds, including a beginner build and an expansion-dependent endgame build. Verify persistence and validation. Update `PROJECT_OVERVIEW.md` and `HANDOFF.md`, preserving all earlier functionality.
```

---

# Phase 4 — Quests, gear, bestiary, alchemy, and crafting

**Goal:** Create the connected gameplay encyclopedia.

```text
# PHASE 4 — GAMEPLAY ENCYCLOPEDIA

Continue the existing implementation. Read the handoff and preserve the current design system, shadcn/ui preset `b3ktYM0tU`, map system, and build planner.

Build connected databases for quests, equipment, monsters, alchemy, and crafting.

A. QUESTS
Cover main quests, secondary quests, Witcher contracts, treasure hunts, races, fistfights, Gwent quests, and expansion quests.

Each quest guide should include:
- Starting location and NPC
- Prerequisites and recommended level
- Step-by-step walkthrough
- Important dialogue choices and verified consequences
- Rewards and experience where verified
- Failure conditions and missable content
- Related quests, characters, items, and map markers
- Spoiler-free summary with optional full spoilers

Build quest chains and dependency links. Add point-of-no-return warnings only when verified.

B. GEAR AND EQUIPMENT
Build a searchable database of Witcher school gear, swords, armor, crossbows, horse equipment, relic equipment, runestones, glyphs, runewords, and relevant unique items.

Cover relevant sets such as Griffin, Cat, Bear, Wolf, Manticore, and Viper, while accurately distinguishing actual Witcher gear from other themed equipment. Include applicable upgrade tiers.

Show verified stats, level requirements, bonuses, resistances, diagrams, locations, ingredients, crafting profession, costs where available, prerequisites, missability, and recommended builds.

C. BESTIARY
Cover relevant monster families and individual enemies. Include classifications, known locations, recommended preparation, weaknesses, oils, bombs, signs, combat tactics, attack patterns where verified, loot, and associated quests.

Distinguish confirmed weaknesses from general tactical advice.

D. ALCHEMY AND CRAFTING
Create searchable databases for potions, decoctions, bombs, oils, ingredients, monster parts, crafting materials, recipes, mutagens, and equipment upgrades.

Show ingredient quantities, effects, duration, toxicity where applicable, recipe acquisition, crafting requirements, and farming or merchant links.

E. CROSS-LINKING
A gear guide should link to its diagrams, map markers, required quests, ingredients, crafting NPCs, and compatible builds. A quest should link to its starting location, objectives, rewards, related characters, and relevant equipment.

Use structured records rather than duplicating content across pages. Use shadcn/ui components such as Table, Accordion, Tabs, Badge, Breadcrumb, Alert, and responsive cards.

Maintain source references and verification status. Do not invent steps, stats, recipes, consequences, or rewards. Clearly mark incomplete records.

Test search, filters, guide pages, related links, spoiler controls, and map integration. Document data coverage and gaps in `HANDOFF.md`.
```

---

# Phase 5 — Money making, Gwent, collectibles, and achievements

**Goal:** Add completionist tools and practical gameplay strategies.

```text
# PHASE 5 — ECONOMY, GWENT, COLLECTIBLES AND ACHIEVEMENTS

Continue the existing project and preserve all working features, the design system, and shadcn/ui preset `b3ktYM0tU`.

A. MONEY-MAKING HUB
Create early-game, mid-game, endgame, and expansion-specific guides for:
- Valuable loot routes
- Selling and dismantling decisions
- Merchant and blacksmith locations
- Monster-part and crafting-material farming
- Crafting economics
- Inventory and repair-cost optimization
- Documented repeatable farming methods and exploits

Each method should state the location, prerequisites, steps, time investment and expected rewards when evidence supports those estimates, plus version limitations and verification status.

Separate legitimate methods, version-dependent exploits, and patched methods. Never claim a method works on the current version without reliable evidence.

B. GWENT
Build a searchable card encyclopedia and collection tracker for the base-game factions and applicable expansion content.

Include card effects, strength, faction, acquisition method, missability, opponents, deck strategies, tournament walkthroughs, and related quests. Add beginner and advanced strategy guides, opponent directories, and a card-completion checklist.

Verify acquisition requirements. Distinguish collectible cards from other Gwent-related content.

C. COLLECTIBLES
Create checklists for:
- Places of Power
- Gwent cards
- Witcher gear diagrams
- Treasure hunts
- Unique weapons and armor
- Hidden quests and discoveries
- Achievements and trophies
- Optional bosses and monsters
- Expansion-specific content

Link checklist entries to the relevant map marker and guide.

D. ACHIEVEMENTS
Show verified requirements, missability, prerequisites, recommended preparation, and relevant walkthroughs. Where useful, provide completion routes and warn about content that can be permanently missed.

E. PLAYER CHECKLISTS
Allow users to mark records as not started, in progress, completed, or missed/unavailable where applicable. Provide category, region, expansion, and completion filters, plus progress summaries.

Use shadcn/ui Table, Checkbox, Progress, Command, Badge, and Card components where appropriate.

Use reliable references and label unverified content. Test collection filters, persistence, links, and progress calculations. Update the project handoff with actual content coverage and remaining gaps.
```

---

# Phase 6 — DLC, New Game Plus, personalization, and progress

**Goal:** Finish the personalized companion experience.

```text
# PHASE 6 — DLC, NEW GAME PLUS AND PLAYER PROGRESSION

Continue the existing project. Preserve all earlier work, the established design system, and shadcn/ui preset `b3ktYM0tU`.

A. EXPANSIONS
Create dedicated Hearts of Stone and Blood and Wine guides covering story quests, side quests, bosses, unique gear, mechanics, rewards, missable content, and expansion-specific builds.

Clearly label which content requires each expansion.

B. NEW GAME PLUS
Create a guide explaining how to unlock NG+, what carries over, what resets, enemy scaling, gear progression, build changes, mutation preparation, and common mistakes. Verify game mechanics and version-specific behavior.

C. PLAYER PROFILE AND PREFERENCES
Allow players to set:
- Owned expansions
- Platform and game version
- Difficulty
- Current character level and region
- Current quests
- Preferred build
- Casual or completionist playstyle
- Spoiler preference

D. PERSONALIZED DASHBOARD
Use these preferences and saved progress to suggest relevant next steps:
- Nearby discoveries
- Uncompleted Places of Power
- Available gear upgrades
- Relevant side quests
- Recommended skill upgrades
- Suitable money-making strategies
- Missable-content warnings
- Progress toward selected achievements

Do not make recommendations based on progress that has not been recorded.

E. PERSISTENCE
Persist settings, checklists, saved builds, and progress between sessions. Use local storage for an initial single-device experience if suitable. Structure the data model so optional accounts and cloud synchronization can be added later.

Provide export and import of progress backups. Validate imported data and handle invalid or incompatible backups safely.

Use shadcn/ui Tabs, Progress, Checkbox, Dialog, AlertDialog, Sheet, and other appropriate components.

Test persistence across refreshes, export/import, expansion filters, spoiler preferences, and recommendation logic. Update the documentation and handoff with implemented behavior and remaining limitations.
```

---

# Phase 7 — Quality assurance, accuracy, performance, and final polish

**Goal:** Audit the entire product, fix issues, and ensure that features work in practice.

```text
# PHASE 7 — FULL PRODUCT QA AND FINAL POLISH

Audit the complete Witcher 3 Ultimate Guide project. Read `PROJECT_OVERVIEW.md`, `HANDOFF.md`, and inspect the implementation before making changes.

Preserve the shadcn/ui preset `b3ktYM0tU`, design tokens, architecture, and existing working features. Do not redesign or rebuild the site unnecessarily.

1. FUNCTIONAL TESTING
Test every route, navigation link, search result, filter, dialog, map marker, map control, build-planner rule, save action, checklist, progress calculation, export/import workflow, and related-content link.

Fix dead buttons, placeholder interactions, broken routes, incorrect states, and runtime errors.

2. DATA ACCURACY
Audit source references and verification status for locations, coordinates, quests, rewards, item stats, recipes, skill rules, Gwent cards, achievements, DLC requirements, and exploits.

Flag unverified claims. Remove or clearly label fabricated, unsupported, or outdated information. Do not claim complete game coverage unless it is measured and supported.

3. SHADCN/UI CONSISTENCY
Verify that the exact preset remains applied. Audit shared component usage, tokens, focus states, accessible labels, keyboard navigation, contrast, dialogs, dropdowns, and mobile drawers.

Do not replace the preset with another design system.

4. RESPONSIVE AND ACCESSIBILITY AUDIT
Test desktop, tablet, and mobile layouts. Check overflow, tables, map controls, sidebars, search, typography, focus visibility, keyboard operation, and screen-reader labels.

5. PERFORMANCE
Inspect unnecessary re-renders, oversized bundles, large datasets, map marker rendering, images, and search performance. Add pagination, virtualization, lazy loading, or indexing only where appropriate.

6. ENGINEERING CHECKS
Run the available formatter, lint, type checks, production build, and tests. Resolve errors introduced by the project. Do not hide failures or report a check as passed if it was not run successfully.

7. DOCUMENTATION
Update:
- `PROJECT_OVERVIEW.md`
- `HANDOFF.md`
- Setup and development instructions
- Data-source and attribution documentation
- Known issues and verified coverage
- A checklist of features that are complete, partial, or not implemented

Finish with a concise audit report containing commands run, test results, fixes made, data limitations, and remaining work.

Do not merely produce an audit document: fix the issues you can verify and reproduce. Do not claim success for untested functionality.
```

---

# Optional: Project-wide Claude instructions

Save this as `CLAUDE.md` in the project root if you want Claude Code to retain the essential rules across sessions.

```text
# Project Rules — The Witcher 3 Ultimate Guide

- Build a premium, responsive, interactive companion website for The Witcher 3: Wild Hunt and both major expansions.
- Use the exact shadcn/ui preset `b3ktYM0tU`.
- If shadcn/ui is not configured, initialize it using `npx shadcn@latest init --preset b3ktYM0tU`, following the current official CLI behavior.
- Never silently replace the preset or reinitialize shadcn/ui during later phases.
- Use the existing suitable stack; otherwise prefer Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and Lucide React.
- Follow the project prompt pack's seven phases in order.
- Before every phase, inspect `PROJECT_OVERVIEW.md`, `HANDOFF.md`, and relevant code.
- Preserve existing working functionality. Do not rebuild the project unnecessarily.
- Keep game data separate from UI code and use typed, reusable schemas.
- Never invent game facts, coordinates, statistics, quest consequences, crafting recipes, or exploit status.
- Track sources and verification status; clearly identify incomplete data.
- Ensure all controls work and all pages handle loading, empty, and error states.
- Maintain accessibility, responsive layouts, and the established design system.
- After each phase, run available checks, fix issues, and update `PROJECT_OVERVIEW.md` and `HANDOFF.md`.
- Report honestly what is implemented, verified, incomplete, and untested.
```

## Recommended project structure

```text
witcher-3-ultimate-guide/
├── CLAUDE.md
├── PROJECT_OVERVIEW.md
├── HANDOFF.md
├── app/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── layout/
│   ├── maps/
│   ├── builds/
│   ├── guides/
│   ├── database/
│   └── tracker/
├── data/
│   ├── locations/
│   ├── quests/
│   ├── gear/
│   ├── skills/
│   ├── bestiary/
│   ├── alchemy/
│   ├── gwent/
│   └── achievements/
├── lib/
├── public/
│   └── maps/
└── tests/
```

**Execution tip:** Complete Phase 1 first and check that your shadcn/ui preset is actually applied before continuing. For the map system and game encyclopedia, prioritize a reliable data model and verified sources over trying to populate every single entry immediately.
