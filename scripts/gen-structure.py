#!/usr/bin/env python3
"""Regenerate STRUCTURE.md from docs.json.

The tree mirrors the sidebar, so it uses each page's `sidebarTitle` where one is
set and falls back to `title`. Where the two differ the page title is shown after
the path - that divergence is deliberate on 30-odd pages and easy to lose track of.
Generated endpoint stubs carry no title at all, only `openapi:`, so their method
and path stand in as the label.

Usage: python3 scripts/gen-structure.py
"""
import json, re, pathlib, datetime, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
FM = re.compile(r"^---\s*\n(.*?)\n---", re.S)
METHODS = ("get", "post", "put", "patch", "delete", "head", "options")


def field(fm, name):
    m = re.search(rf'^{name}:\s*(.*?)\s*$', fm, re.M)
    return m.group(1).strip().strip('"').strip("'") if m else None


def meta(slug):
    """(sidebar label, page title or None if same, kind)."""
    f = ROOT / (slug + ".mdx")
    if not f.exists():
        return ("MISSING FILE", None, "missing")
    m = FM.match(f.read_text())
    if not m:
        return (slug.rsplit("/", 1)[-1], None, "page")
    fm = m.group(1)
    title, side = field(fm, "title"), field(fm, "sidebarTitle")
    if title or side:
        label = side or title
        return (label, title if (side and title and side != title) else None, "page")
    op = field(fm, "openapi")
    if op:
        parts = op.split(None, 1)
        if len(parts) == 2 and parts[0].lower() in METHODS:
            op = f"{parts[0].upper()} {parts[1]}"
        return (op, None, "endpoint")
    return (slug.rsplit("/", 1)[-1], None, "page")


stats = {"page": 0, "endpoint": 0, "missing": 0}
in_nav, lines = set(), []


def emit(items, prefix):
    for i, item in enumerate(items):
        last = i == len(items) - 1
        elbow, cont = ("└── ", "    ") if last else ("├── ", "│   ")
        if isinstance(item, dict):
            bits = [b for b in (item.get("tag"),
                                "expanded" if item.get("expanded") else None,
                                item.get("icon")) if b]
            suffix = "  [" + ", ".join(bits) + "]" if bits else ""
            lines.append(f"{prefix}{elbow}{item.get('group', '?')}/{suffix}")
            emit(item.get("pages", item.get("groups", [])), prefix + cont)
        else:
            in_nav.add(item)
            label, title, kind = meta(item)
            stats[kind] += 1
            mark = "!! " if kind == "missing" else ""
            note = f'  ·  title: {title}' if title else ""
            lines.append(f"{prefix}{elbow}{mark}{label}   ({item}){note}")


d = json.load(open(ROOT / "docs.json"))
per_tab = []
for t in d["navigation"]["tabs"]:
    before = sum(stats.values())
    lines.append("")
    lines.append(t["tab"])
    emit(t.get("pages", t.get("groups", [])), "")
    per_tab.append((t["tab"], sum(stats.values()) - before))

all_mdx = sorted(
    str(p.relative_to(ROOT))[:-4]
    for p in ROOT.rglob("*.mdx")
    if not any(x.startswith((".", "_")) or x == "node_modules" for x in p.parts)
)
orphans = [s for s in all_mdx if s not in in_nav]
redirects = len(d.get("redirects", []))
sha = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "--short", "HEAD"],
                     capture_output=True, text=True).stdout.strip() or "unknown"

o = [
    "# Bindbee docs — structure (v3)",
    "",
    f"Generated from `docs.json` on {datetime.date.today().isoformat()} at commit `{sha}`.",
    "Run `python3 scripts/gen-structure.py` to refresh; hand edits will drift from the nav.",
    "",
    "## Summary",
    "",
    "| Tab | Pages |",
    "| --- | ---: |",
]
o += [f"| {n} | {c} |" for n, c in per_tab]
o += [
    f"| **Total in nav** | **{sum(stats.values())}** |",
    "",
    f"**{stats['page']}** are written pages; **{stats['endpoint']}** are generated endpoint "
    "stubs whose frontmatter is a single `openapi:` line, rendered from `spec.json`.",
    f"`docs.json` also carries **{redirects}** redirects.",
]
if stats["missing"]:
    o.append("")
    o.append(f"**{stats['missing']} nav entries have no matching file** — marked `!!` below.")
o += [
    "",
    "### Reading the tree",
    "",
    "- A trailing `/` marks a group rather than a page.",
    "- Brackets carry the group's `docs.json` flags: a tag (`BETA`), `expanded` if it opens "
    "by default, and the Lucide icon name.",
    "- Page rows show the **sidebar label**, then the path. Where a page's `title` differs "
    "from its `sidebarTitle` the title follows after `·` — the sidebar stays short while the "
    "page heading and search result stay descriptive.",
    "",
    "## Tree",
    "",
    "```",
    *lines[1:],
    "```",
    "",
    "## Not in the navigation",
    "",
]
if orphans:
    o.append(f"{len(orphans)} `.mdx` files exist but are reachable only by direct URL:")
    o.append("")
    o += [f"- `{s}`" for s in orphans]
else:
    o.append("None.")
o.append("")

(ROOT / "STRUCTURE.md").write_text("\n".join(o))
print(f"STRUCTURE.md: {sum(stats.values())} nav pages "
      f"({stats['page']} written / {stats['endpoint']} endpoints), "
      f"{stats['missing']} missing, {len(orphans)} orphans, {redirects} redirects")
