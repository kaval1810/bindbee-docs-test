#!/usr/bin/env python3
"""Regenerate the integration tables in get-started/integrations.mdx from the sheet.

The tables are GENERATED rather than fetched at runtime, unlike the matrix on
/get-started/model-availability. Two reasons, both specific to this page:

  1. Mintlify does not server-render MDX components - their output appears only
     inside <script> as compiled _jsx() calls. A component would take all 70
     integration names and slugs out of the indexable HTML, and this is the page
     people reach by searching for a vendor name.
  2. The published-CSV endpoint answers in 0.9-2.7s behind a 307 redirect. That
     is fine for a tool page you deliberately open, not for a landing page.

Generating keeps the sheet as the source of truth and the HTML static. The cost
is that a sheet edit does not appear until someone runs this.

The tab is located by matching its header row, so adding tabs or reordering them
in the sheet cannot break this - there is no gid to keep in sync.

Usage: python3 scripts/gen-integrations.py [--check] [--force]
       --check exits 1 if the page is out of date, for CI.
       --force writes even when the row count collapses (see SHRINK_GUARD).
"""
import csv, io, pathlib, re, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "get-started" / "integrations.mdx"

SHEET_BASE = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTx0G0yItXlZKO4Zep8wst"
    "ZuvvO7bgOxFXBVK_1vvQnxpG8H2hP9n9M8kmZMfIoo7ZO4e7_utrz3_XB/pub"
)

REQUIRED = ("category", "system", "slug", "type")
LOGO_COL = "logo link"  # optional

# The logo URL is interpolated into an HTML attribute, so it is checked rather
# than trusted. A row with an odd URL keeps its name and loses only the icon.
SAFE_LOGO = re.compile(r"^https://[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+$")

# API and SFTP only. An SFTP connector is a separate slug with its own coverage
# (adp vs adp_sftp), so a combined "Both" would not say which one a reader wants.
TYPES = {"API": "API", "SFTP": "SFTP"}

# Heading and base path per category, and the order they appear on the page.
SECTIONS = [
    ("HRIS", "HRIS, Payroll & Directory", "/api/hris/v1/"),
    ("ATS", "Recruiting (ATS)", "/api/ats/v1/"),
    ("LMS", "Learning (LMS)", "/api/lms/v1/"),
]

START = "{/* GENERATED:integrations START - edit the sheet, then run scripts/gen-integrations.py */}"
END = "{/* GENERATED:integrations END */}"

# A half-filled tab is indistinguishable from a finished one, and running against
# it silently replaced 70 live rows with 2 the first time this was used. Anything
# that drops the published list below this fraction now has to be confirmed.
SHRINK_GUARD = 0.5


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "bindbee-docs-gen"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def tab_gids():
    """Every gid the published document exposes, in the order it lists them."""
    html = get(SHEET_BASE + "html")
    seen, out = set(), []
    for gid in re.findall(r"gid=(\d+)", html):
        if gid not in seen:
            seen.add(gid)
            out.append(gid)
    return out


def read_tab(gid):
    csv_url = SHEET_BASE + "?gid=%s&single=true&output=csv" % gid
    return list(csv.reader(io.StringIO(get(csv_url))))


def find_rows():
    """The tab whose header row carries Category, System, Slug and Type."""
    for gid in tab_gids():
        rows = read_tab(gid)
        if not rows:
            continue
        header = [c.strip().lower() for c in rows[0]]
        if all(col in header for col in REQUIRED):
            idx = {col: header.index(col) for col in REQUIRED}
            if LOGO_COL in header:
                idx["logo"] = header.index(LOGO_COL)
            out = []
            for r in rows[1:]:
                rec = {k: (r[i].strip() if i < len(r) else "") for k, i in idx.items()}
                rec.setdefault("logo", "")
                if rec["system"] and rec["slug"] and rec["category"]:
                    out.append(rec)
            return gid, out
    raise SystemExit(
        "No tab found with headers: %s.\n"
        "Add them to row 1 of the Integrations tab and republish the sheet."
        % ", ".join(REQUIRED)
    )


def system_cell(row):
    """Vendor name, with its logo inline when the sheet has a usable one.

    Raw <img> rather than markdown image syntax: Mintlify wraps markdown images
    in a zoom button, which is absurd on a 16px row icon. The name stays plain
    text either way, so the cell is still readable and still indexable.
    """
    logo = row.get("logo", "").strip()
    if not logo:
        return row["system"]
    if not SAFE_LOGO.match(logo):
        print("  skipped logo for %s - not a plain https URL: %r" % (row["system"], logo))
        return row["system"]
    return '<img src="%s" alt="" className="bb-int-logo" /> %s' % (logo, row["system"])


def build(rows):
    """The generated block: one wrapped section per category.

    The wrapper div is what the filter component scopes to - it hides whole
    sections and individual rows without the content ever leaving the HTML.
    """
    out = [START, ""]
    for key, heading, base in SECTIONS:
        got = [r for r in rows if r["category"].strip().upper() == key]
        if not got:
            continue
        got.sort(key=lambda r: r["system"].lower())
        out += [
            '<div className="bb-int-section" data-category="%s">' % key,
            "",
            "## %s" % heading,
            "",
            "Base path `%s` · category `%s`" % (base, key),
            "",
            "| System | Slug | Type |",
            "| --- | --- | --- |",
        ]
        for r in got:
            out.append(
                "| %s | `%s` | %s |" % (system_cell(r), r["slug"], r["type"])
            )
        out += ["", "</div>", ""]
    out.append(END)
    return "\n".join(out)


def splice(page, block):
    if START in page and END in page:
        return re.sub(
            re.escape(START) + r".*?" + re.escape(END), lambda _: block, page, flags=re.S
        )
    raise SystemExit(
        "Markers not found in %s.\nAdd these two lines around the tables:\n  %s\n  %s"
        % (PAGE.name, START, END)
    )


def check_types(rows):
    """Reject anything outside the vocabulary before it reaches the page."""
    bad = [r for r in rows if r["type"].strip().upper() not in TYPES]
    if bad:
        lines = "\n".join(
            "  %-28s %-22s Type = %r" % (r["system"], r["slug"], r["type"]) for r in bad
        )
        raise SystemExit(
            "%d row(s) have a Type outside %s:\n%s\n\n"
            "Each connection path is its own row and its own slug, so a combined\n"
            "value can't say which one a reader should connect through."
            % (len(bad), " / ".join(sorted(TYPES)), lines)
        )
    for r in rows:
        r["type"] = TYPES[r["type"].strip().upper()]


def main():
    gid, rows = find_rows()
    if not rows:
        raise SystemExit("The Integrations tab has headers but no rows.")
    check_types(rows)
    page = PAGE.read_text()
    updated = splice(page, build(rows))

    live = len(re.findall(r"^\| .+ \| `.*` \| .+ \|$", page, re.M))
    if live and len(rows) < live * SHRINK_GUARD and "--force" not in sys.argv:
        print(
            "REFUSED: the page lists %d integrations, the sheet has %d.\n"
            "That usually means the tab is still being filled in, or a column got\n"
            "cleared. Rows need Category, System and Slug to count.\n"
            "If the drop is intentional, re-run with --force." % (live, len(rows))
        )
        return 1

    if "--check" in sys.argv:
        if updated != page:
            print("OUT OF DATE - run: python3 scripts/gen-integrations.py")
            return 1
        print("up to date (%d integrations)" % len(rows))
        return 0

    if updated == page:
        print("no change (%d integrations, gid %s)" % (len(rows), gid))
        return 0

    PAGE.write_text(updated)
    counts = ", ".join(
        "%s %d" % (k, sum(1 for r in rows if r["category"].strip().upper() == k))
        for k, _, _ in SECTIONS
    )
    print("wrote %s - %d integrations (%s) from gid %s" % (PAGE.name, len(rows), counts, gid))
    return 0


if __name__ == "__main__":
    sys.exit(main())
