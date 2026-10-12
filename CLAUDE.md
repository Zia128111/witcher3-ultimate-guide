# Project Rules — The Witcher 3 Ultimate Guide

## READ FIRST: current state of the project (overrides the stack rules below)

The owner explicitly chose a **single-file vanilla HTML/CSS/JS site** instead of the Next.js + shadcn plan described further down. Those stack, shadcn-preset and seven-phase rules are **superseded** and kept only for history. The visual direction, data-accuracy and code-quality rules still apply.

- **Live site:** https://witcher3-ultimate-guide.vercel.app (Vercel project `witcher3-ultimate-guide` in team "Zia's projects"). Every push to `main` auto-deploys to production.
- **Repo:** https://github.com/Zia128111/witcher3-ultimate-guide (public, branch `main`).
- **Full feature docs:** `HANDOFF.md`. Read it before changing a section.

### How to work on it
1. **Never edit `index.html` by hand.** It is generated. Edit the parts in `src/`, then run `python build.py`. That joins the parts in order and checks the JS syntax with `node --check` and that there are no em or en dashes.
2. **Where things live:**
   - CSS is in `src/01_head.html`, one commented block per section (e.g. `/* ---------- Atlas (World Explorer) ---------- */`).
   - Game data is in `src/03*.js`.
   - Each immersive section is its own file, `src/05b…05o_*.js`, with a header comment numbered `8b`–`8o`.
   - Events are in `src/06_events.js`.
   - The part order is listed in `build.py`.
3. **Test in a browser** before committing. Serve the folder (`python -m http.server 5517`) and check:
   - every touched route at 1440px and 375px;
   - no horizontal overflow and no console errors.

   Then clear the test `localStorage` (key `w3guide:v1`).
4. **Commit and push only when the owner asks.** Pushes go to the owner's personal GitHub account:
   - Run `gh auth switch -u Zia128111` before pushing, commit as `Zia128111 <mziaali128111@gmail.com>`, then switch back with `gh auth switch -u ziaali-dotcom`.
   - Update `HANDOFF.md` with every feature change.

### Conventions
- **Architecture:**
  - Hash router: `#/route?params`, with views in `VIEWS.<route>` and optional `VIEWS.<route>_list` for filterable lists in `#list`.
  - Use URL params for shareable state: `setParams()` then `render(true)`.
  - Actions use event delegation through `data-action` / `data-open="kind:id"` / `data-check="id"`.
- **State:** `state` (checks, favorites, builds, planner, gwent, prep, settings) is validated by `sanitize()` on load and import. New settings must be added to the defaults and to `sanitize`.
- **Look and feel:** the house style is "immersive like the skill tree":
  - dark engraved boards (`linear-gradient(#141517,#0d0e0f)`) with a sticky inspector;
  - ring/progress medallions via `conic-gradient`;
  - antique gold `#c8a456` / `#e8c675` and crimson `#7a2822` / `#a8362c`;
  - tree colours from `TREE_META`;
  - Phosphor icons only; verify an icon exists before use (`ph-scorpion` and `ph-anvil` do not).
- **Text:** no em/en dashes, plain wording, and verification tags on facts (`vTag`: wiki / guide / unverified / rec).
- **Images:** hotlinked from the fandom CDN through helpers (`wikiImg`, `bxImg`, `gImg`, `art(key)`), with an `onerror` fallback to an icon. witcher3map.com blocks hotlinking; tiles come from raw.githubusercontent / jsDelivr.
- **Tooltips:** add `data-tip="..."` (and `data-tip-side="right"` if needed). Icon-only buttons with an `aria-label` get a tooltip automatically.
- **Accuracy:** never invent stats, coordinates, rewards or exploit status. Research comes from the fandom MediaWiki API (`action=parse`, `prop=wikitext`) via `curl`; WebFetch on fandom returns 402. Label anything single-sourced or undocumented.

### Decisions already made (do not re-litigate without the owner)
- **Hosting:** stay on Vercel Hobby (free, non-commercial). Move to Cloudflare Pages if the site ever becomes commercial or outgrows 100 GB a month.
- **No ads for now.** The witcher3map data is CC BY-NC-SA (non-commercial). CD PROJEKT RED does not allow monetising its IP without permission. The wallpapercave art is used as non-commercial.
- **Donations instead:** optional, never paywalled. The owner is in Pakistan, where PayPal and Stripe are unavailable, so Ko-fi and Buy Me a Coffee are not viable. The plan is **Patreon paid out through Payoneer** (the owner already has Payoneer), then to a Pakistani bank.
- **Pending:** when the owner shares the Patreon URL, add a "Support this guide" button: sidebar footer (an icon in the collapsed rail), a home page card, and the My Journal backup tab, with the note "The guide is and will stay free."

## Project purpose

Build a premium, responsive, interactive companion website for **The Witcher 3: Wild Hunt**, including **Hearts of Stone** and **Blood and Wine**.

Follow the seven-phase implementation plan in `witcher_3_ultimate_guide_claude_prompts.md` (or the project's prompt pack). Implement phases in order and do not skip ahead unless explicitly instructed.

## Mandatory shadcn/ui preset

The project must use this exact custom shadcn/ui preset:

`b3ktYM0tU`

If shadcn/ui is not configured, initialize it with the official CLI and this preset:

```bash
npx shadcn@latest init --preset b3ktYM0tU
```

Follow the current official CLI behavior. If shadcn/ui is already configured, inspect the setup and determine the safest supported way to apply or preserve the preset. Never overwrite existing configuration blindly.

Non-negotiable rules:

- Never silently substitute another preset or fall back to the default.
- Do not manually recreate the preset's styling before attempting to apply it.
- Preserve the preset's generated theme variables, design tokens, component conventions, and configuration.
- Do not reinitialize shadcn/ui during later phases.
- If the preset cannot be applied, report the exact issue rather than silently switching to another setup.
- Document the applied preset in `PROJECT_OVERVIEW.md`.

Official documentation: https://ui.shadcn.com/

## Technology and UI

Use the existing suitable stack. For a new project, prefer:

- Next.js App Router
- TypeScript with strict typing
- Tailwind CSS
- shadcn/ui using the preset above
- Lucide React icons

Use React Hook Form and Zod for forms and validation when appropriate, Recharts for useful visualizations, and a suitable map library or verified map-image overlay system for interactive maps.

Use shadcn/ui as the primary component system. Compose and reuse its components instead of introducing another UI framework. Do not add Material UI, Chakra UI, or Ant Design. Specialized map canvases, skill trees, and charts may use dedicated implementations, but their surrounding controls and panels must follow the same design system.

## Visual direction

Create a premium dark-fantasy field-journal aesthetic suited to The Witcher 3 without copying proprietary artwork or logos.

- Near-black and charcoal surfaces
- Muted steel borders
- Warm ivory and muted-gray text
- Restrained crimson accents
- Antique-gold highlights for rare discoveries
- Elegant serif headings and readable sans-serif body text
- Clear information hierarchy, intentional spacing, subtle textures, and restrained motion
- Responsive layouts and accessible contrast

Respect the shadcn/ui preset's design tokens. Customize intentionally without discarding the preset.

## Architecture and code quality

- Inspect the repository before editing.
- Read `PROJECT_OVERVIEW.md` and `HANDOFF.md` before each phase when they exist.
- Preserve existing working code and functionality.
- Keep game data separate from UI components.
- Use typed, reusable data schemas and stable record IDs.
- Keep shared UI primitives separate from feature-specific components.
- Use URL state for shareable filters and views where appropriate.
- Make every button, filter, search field, checklist, and interactive control functional.
- Provide loading, empty, error, and success states where appropriate.
- Support keyboard navigation, visible focus states, accessible labels, and screen-reader usability.
- Optimize for desktop, tablet, and mobile.
- Avoid unnecessary dependencies and duplicated implementations.
- Do not claim functionality or content is complete unless it has been implemented and tested.
- Run available type checks, linting, builds, and relevant tests after each phase.
- Update `PROJECT_OVERVIEW.md` and `HANDOFF.md` at the end of every phase with completed work, commands run, test results, data coverage, known issues, and next steps.

## Game-data accuracy and research

Research game mechanics, quests, maps, items, recipes, skills, Gwent cards, achievements, expansions, and patch differences using reliable sources. Respect source terms, attribution requirements, and applicable content licenses.

- Never fabricate map coordinates, item stats, recipes, quest consequences, rewards, or exploit status.
- Keep source references and verification status for factual records.
- Distinguish verified facts from estimates, community recommendations, and version-dependent information.
- Clearly label incomplete or unverified content.
- Do not claim an exploit works on the current version without reliable evidence.
- If complete coverage cannot be verified, deliver the working system and a clearly identified content backlog rather than inventing information.

## Product scope

The website should progressively implement:

1. Homepage, responsive layout, design system, and navigation
2. Interactive regional maps and location database
3. Builds library and functional skill planner
4. Quest walkthroughs, gear, bestiary, alchemy, and crafting
5. Money-making guides, Gwent, collectibles, and achievements
6. DLC guides, New Game Plus, saved builds, and progress tracking
7. Final QA, accuracy review, performance, accessibility, and documentation

Use the detailed phase prompts as the implementation source of truth.

## Persistence and player data

Use a suitable persistence strategy for saved builds, preferences, and progress. Local storage is acceptable for an initial single-device experience if appropriate. Structure data so accounts or cloud synchronization can be added later without rewriting the whole application. Validate imported backups and handle malformed data safely.

## Definition of done

A phase is complete only when its implemented features work, available checks have been run, known gaps are documented, and the handoff notes are updated.

Always report honestly what is implemented, verified, incomplete, and untested. Do not hide failed checks or claim success for untested behavior.
