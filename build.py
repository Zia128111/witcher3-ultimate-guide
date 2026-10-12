"""Build index.html from the parts in src/.

    python build.py          build index.html, then run the checks
    python build.py --check  run the checks on the current index.html only

The site ships as one file, but it is edited as parts. The parts are joined
in the order listed in PARTS; nothing else is transformed. Never edit
index.html directly: change src/ and rebuild.

Checks:
  * every <script> block passes `node --check` (skipped if Node is missing)
  * no em dashes or en dashes anywhere (house style)
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
OUT = os.path.join(ROOT, "index.html")

# Order matters: data before core, core before views, events last.
PARTS = [
    "01_head.html",      # <head>, all CSS (one block per section)
    "02_body.html",      # app shell: sidebar, topbar, overlays, tooltip, toasts
    "03_data.js",        # 1. core data: SOURCES, VERIFY, ART, REGIONS, LOCATIONS, QUESTS, BUILDS, GEAR, MONSTERS, MONEY, DLC, NGPLUS...
    "03b_mapdata.js",    # 1b. witcher3map marker data (CC BY-NC-SA 4.0)
    "03c_skilldata.js",  # 1c. Remastered SKILL_TREES
    "03d_enrich.js",     # 1d. images and extras: MONSTER_IMG, GEAR_IMG, ALC_ICON, ACH_ICON, SHOPS/SALE_*, DLC_TALES, QUEST_EXTRA
    "04_core.js",        # 2-7. state, sanitize, utilities, routing, nav, search, detail modals
    "05_views.js",       # 8. shared view helpers, quest rows, Sources page
    "05b_map.js",        # 8b. interactive map
    "05c_skills.js",     # 8c. skill planner
    "05d_bestiary.js",   # 8d. bestiary codex
    "05e_gwent.js",      # 8e. Gwent cabinet
    "05f_quests.js",     # 8f. quest journal
    "05g_gear.js",       # 8g. armory
    "05h_alchemy.js",    # 8h. alchemist's workbench
    "05i_collect.js",    # 8i. trophy hall (collectibles)
    "05j_money.js",      # 8j. market square (money)
    "05k_dlc.js",        # 8k. expansion tales (DLC and NG+)
    "05l_world.js",      # 8l. atlas (World Explorer)
    "05m_home.js",       # 8m. the medallion (home)
    "05n_journal.js",    # 8n. the witcher's tome (My Journal)
    "05o_hall.js",       # 8o. witchers' hall (builds and planner page)
    "06_events.js",      # 9-10. event handlers, tooltips, sidebar rail, init
]


def build():
    missing = [p for p in PARTS if not os.path.exists(os.path.join(SRC, p))]
    if missing:
        sys.exit("Missing parts in src/: " + ", ".join(missing))
    html = "".join(open(os.path.join(SRC, p), encoding="utf-8").read() for p in PARTS)
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    print(f"Built index.html ({len(html.encode('utf-8')):,} bytes) from {len(PARTS)} parts")
    return html


def check(html):
    ok = True
    dashes = html.count("—") + html.count("–")
    if dashes:
        print(f"FAIL: {dashes} em/en dash(es) found; use commas, colons or 'to' instead")
        ok = False
    else:
        print("OK: no em/en dashes")
    node = shutil.which("node")
    if not node:
        print("SKIP: Node.js not found, JS syntax not checked")
        return ok
    js = "\n;\n".join(re.findall(r"<script>(.*?)</script>", html, re.S))
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as t:
        t.write(js)
        path = t.name
    try:
        r = subprocess.run([node, "--check", path], capture_output=True, text=True)
    finally:
        os.unlink(path)
    if r.returncode:
        print("FAIL: JS syntax error\n" + r.stderr)
        ok = False
    else:
        print("OK: JS syntax")
    return ok


if __name__ == "__main__":
    if "--check" in sys.argv:
        html = open(OUT, encoding="utf-8").read()
    else:
        html = build()
    sys.exit(0 if check(html) else 1)
