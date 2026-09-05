#!/usr/bin/env bash
# Shared invariants for the Bindbee docs skills.
#
# Every skill in the review chain ends by running this. It is the single place
# the mechanical rules live, so a later pass cannot silently undo an earlier one.
#
#   usage: .claude/skills/bindbee-docs-checks.sh [section-dir]
#          defaults to guides/troubleshooting
#
# Exit 0 = all invariants hold. Exit 1 = at least one regressed.

set -uo pipefail
SECTION="${1:-guides/troubleshooting}"
SKILLS=".claude/skills"
fail=0

red()  { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; fail=1; }
ok()   { printf '  \033[32mok\033[0m    %s\n' "$1"; }
head_() { printf '\n\033[1m%s\033[0m\n' "$1"; }

desc_of() { awk '/^description:/{sub(/^description: *"?/,""); sub(/"$/,""); print; exit}' "$1"; }

# ---------------------------------------------------------------- style
head_ "style — frontmatter"
for f in "$SECTION"/*.mdx; do
  d=$(desc_of "$f")
  b=$(basename "$f")
  [ -z "$d" ] && red "$b: no description" && continue
  [ ${#d} -gt 110 ] && red "$b: description ${#d} chars (cap 110)"
  echo "$d" | grep -qE '^(The|A|An|Where|What|How|Why) ' && red "$b: description opens on a noun phrase - lead with a verb"
  echo "$d" | grep -qE ', (and|or) |; |\. .' && red "$b: description is compound - keep one clause"
  echo "$d" | grep -qiE '^(Tell|Address|Handle) ' && red "$b: description opens on an ambiguous verb - pick the verb with one reading"
done
[ $fail = 0 ] && ok "descriptions: within cap, verb-first, single clause"

# How-To titles start with a verb; sidebarTitle required past ~28 chars.
# Verb detection is heuristic, so an unrecognised opener is a note, not a failure.
VERBS="Check|Find|Fix|Read|Trace|Resolve|Reconcile|Relink|Re-authorise|Create|Add|Remove|Update|Configure|Set|Send|Enable|Disable|Handle|Diagnose|Detect|Monitor|Write|Sync|Get|Inspect|Identify|Restrict|Force|Choose|Build|Connect|Migrate|Verify|Review"
h=0
for f in "$SECTION"/*.mdx; do
  grep -q '<Steps>' "$f" || continue            # How-To pages only
  b=$(basename "$f")
  t=$(awk '/^title:/{sub(/^title: *"?/,""); sub(/"$/,""); print; exit}' "$f")
  sb=$(awk '/^sidebarTitle:/{sub(/^sidebarTitle: *"?/,""); sub(/"$/,""); print; exit}' "$f")
  echo "$t" | grep -qE "^($VERBS) " || { printf '  \033[33mnote\033[0m  %s: How-To title "%s" may not start with a verb\n' "$b" "$t"; h=1; }
  [ ${#t} -gt 28 ] && [ -z "$sb" ] && red "$b: title is ${#t} chars with no sidebarTitle"
  [ -n "$sb" ] && [ ${#sb} -gt 28 ] && red "$b: sidebarTitle ${#sb} chars (max 28)"
done
[ $h = 0 ] && ok "How-To titles are verb-first"

# ---------------------------------------------------------- humaniser
head_ "humaniser — prose"
h=0
for f in "$SECTION"/*.mdx; do
  n=$(grep -o '—' "$f" | wc -l | tr -d ' ')
  [ "$n" != 0 ] && red "$(basename "$f"): $n em dash(es); house separator is ' - '" && h=1
done
[ $h = 0 ] && ok "no em dashes"

h=0
for f in "$SECTION"/*.mdx; do
  # table cells carry Usually/Often as answer *values*; only prose counts
  n=$(grep -v '^\s*|' "$f" | grep -oiE '\b(usually|often|typically|commonly|generally|almost always|nearly always)\b' | wc -l | tr -d ' ')
  [ "$n" -gt 1 ] && red "$(basename "$f"): $n prose hedges (budget 1)" && h=1
done
[ $h = 0 ] && ok "hedge budget respected"

# lexical tells (Wikipedia "Signs of AI writing")
h=0
for f in "$SECTION"/*.mdx; do
  hits=$(grep -oiE '\b(additionally|moreover|furthermore|testament|showcas[a-z]*|delve|leverage|seamless|robust|in order to|due to the fact that|serves as|boasts|has the ability to)\b' "$f" | sort -u | tr '\n' ' ')
  [ -n "$hits" ] && red "$(basename "$f"): lexical tell(s): $hits" && h=1
done
[ $h = 0 ] && ok "no lexical AI tells"

# throat-clearing and back-reference lead-ins (anywhere, including inside callouts)
h=0
for f in "$SECTION"/*.mdx; do
  n=$(grep -cE "^\s*(Before you |It's worth |Note that |In order to |This section |Let's |Everything above |Everything below |As mentioned|Now that you|At this point|So far,|With that in place)" "$f")
  [ "$n" -gt 0 ] && red "$(basename "$f"): $n throat-clearing / back-reference lead-in(s)" && h=1
done
[ $h = 0 ] && ok "no throat-clearing or back-reference lead-ins"

# invented table headers, and routing tables that should be link lists
h=0
for f in "$SECTION"/*.mdx; do
  b=$(basename "$f")
  hits=$(grep -oiE '^\s*\| *(What it settles|When you.re done here|Why it matters|What this means|What to know|Key takeaway)[^|]*\|' "$f" | tr -d '|' | tr -s ' ' | sort -u | tr '\n' ';')
  [ -n "$hits" ] && red "$b: invented table header(s): $hits" && h=1
  # a table whose first column is a link is routing - use a list
  grep -qE '^\s*\| *\[[^]]+\]\(/' "$f" && { printf '  \033[33mnote\033[0m  %s: table with links in the first column - routing belongs in a link list\n' "$b"; h=1; }
done
[ $h = 0 ] && ok "no invented table headers or routing tables"

# -------------------------------------------------------- consistency
head_ "consistency — one fact, one home"
ov="$SECTION/overview.mdx"
if [ -f "$ov" ]; then
  n=$(grep -c '<Step title=' "$ov")
  [ "$n" != 0 ] && red "overview.mdx carries $n <Step> - orientation pages must not hold a procedure" \
                || ok "overview.mdx carries no procedure"
fi

# A canonical term must not appear in competing prose forms.
# Internal markers ({/* VERIFY ... */}) are notes to writers, not prose - skip them.
h=0
for bad in "still unsupported" "sits outside the connector's scoping" "not-supported"; do
  hits=$(grep -rn "$bad" "$SECTION" 2>/dev/null | grep -v '{/\*' | cut -d: -f1 | sort -u || true)
  [ -n "$hits" ] && red "non-canonical phrasing \"$bad\" in: $(echo "$hits" | tr '\n' ' ')" && h=1
done
[ $h = 0 ] && ok "model-status terms canonical in prose"

# a page carrying more than one procedure is usually more than one page
h=0
for f in "$SECTION"/*.mdx; do
  n=$(grep -c '<Steps>' "$f")
  [ "$n" -gt 1 ] && printf '  \033[33mnote\033[0m  %s carries %s <Steps> blocks - check it is one job, not two\n' "$(basename "$f")" "$n" && h=1
done
[ $h = 0 ] && ok "no page carries a second procedure"

# unresolved merge debt left by an earlier consolidation
debt=$(grep -rln "CONTENT PASS" "$SECTION" 2>/dev/null | wc -l | tr -d ' ')
[ "$debt" != 0 ] && printf '  \033[33mnote\033[0m  %s page(s) carry an unresolved CONTENT PASS note\n' "$debt" \
                 || ok "no unresolved CONTENT PASS notes"

# ------------------------------------------------------- affordances
head_ "affordances — callouts and screenshots"
h=0
for f in "$SECTION"/*.mdx; do
  for c in Note Warning Info Tip; do
    o=$(grep -c "<$c>" "$f"); cl=$(grep -c "</$c>" "$f")
    [ "$o" != "$cl" ] && red "$(basename "$f"): <$c> unbalanced ($o open, $cl close)" && h=1
  done
done
[ $h = 0 ] && ok "all callouts balanced"

markers=$(grep -rc "SCREENSHOT NEEDED" "$SECTION"/*.mdx 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
if [ "$markers" -gt 0 ]; then
  printf '  \033[33mnote\033[0m  %s SCREENSHOT NEEDED marker(s) outstanding - strip before merge\n' "$markers"
  h=0
  while IFS= read -r line; do
    case "$line" in *"a reader should be able to see"*) ;; *) red "marker lacks a what-the-reader-sees clause: $(echo "$line" | cut -c1-70)"; h=1;; esac
  done < <(grep -rh "SCREENSHOT NEEDED" "$SECTION"/*.mdx 2>/dev/null)
  [ $h = 0 ] && ok "every marker says what the reader should see"
fi

# ------------------------------------------------- mirrored blocks
head_ "skills — mirrored blocks in sync"
extract() { awk "/MIRROR:$2 START/{flag=1;next} /MIRROR:$2 END/{flag=0} flag" "$1" 2>/dev/null | md5 -q 2>/dev/null || \
            awk "/MIRROR:$2 START/{flag=1;next} /MIRROR:$2 END/{flag=0} flag" "$1" 2>/dev/null | md5sum | cut -d' ' -f1; }
check_mirror() {
  local name="$1"; shift
  local first="" f h=""
  for f in "$@"; do
    [ -f "$f" ] || { red "mirror $name: missing $f"; return; }
    h=$(extract "$f" "$name")
    [ -z "$h" ] && { red "mirror $name: no MIRROR:$name block in $(basename "$(dirname "$f")")"; return; }
    if [ -z "$first" ]; then first="$h"
    elif [ "$h" != "$first" ]; then red "mirror $name: DRIFTED between copies"; return; fi
  done
  ok "mirror $name identical across $# file(s)"
}
check_mirror description-cap "$SKILLS/bindbee-docs-style/SKILL.md" "$SKILLS/bindbee-docs-humaniser/SKILL.md"
check_mirror screenshot-tag  "$SKILLS/bindbee-docs-affordances/SKILL.md" "$SKILLS/bindbee-docs-humaniser/SKILL.md"

# ------------------------------------------------------------ links
head_ "links"
broken=$(grep -rhoE '\]\(/[a-zA-Z0-9/_-]+(#[a-zA-Z0-9-]+)?\)' --include='*.mdx' . \
  | sed -E 's/^\]\(//; s/\)$//; s/#.*$//' | sort -u \
  | while IFS= read -r l; do [ -f ".$l.mdx" ] || echo "$l"; done)
[ -n "$broken" ] && red "unresolved link target(s): $(echo "$broken" | tr '\n' ' ')" || ok "all internal links resolve"

printf '\n'
[ $fail = 0 ] && printf '\033[32mAll invariants hold.\033[0m\n' || printf '\033[31mAt least one invariant regressed.\033[0m\n'
exit $fail
