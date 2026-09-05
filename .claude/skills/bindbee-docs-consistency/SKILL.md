---
name: bindbee-docs-consistency
description: Audit a docs section for duplicated procedures, terminology drift, and contradictory instructions - the defects that are invisible page-by-page and only appear when you read a section end to end. Use after restructuring a section, after merging pages, when adding an overview or index page, or whenever two pages might both claim to be the authority on the same thing.
---

> **Position in the chain: 2 of 5.** Sequenced by `bindbee-docs-review`, which explains why.
>
> **This skill owns:** Which page owns which fact, and canonical terminology across a section.
> **It must not change:** page anatomy (style), callout type (affordances), sentence wording (humaniser). Flag those and hand them to the owner.
>
> **On finishing, run** `.claude/skills/bindbee-docs-checks.sh <section>`. A red line means this pass regressed an earlier one.

# Bindbee docs consistency

`bindbee-docs-style` reviews a page against the spec. `bindbee-docs-humaniser` reviews a sentence. **This skill reviews everything in between** - within one page, and across a section. Both are invisible at the altitudes the other skills work at.

| Grain | Caught by |
| --- | --- |
| A restated sentence | humaniser, fingerprint 2 |
| **The same fact in four sections of one page** | **this skill, defect 4** |
| **The same procedure on two pages** | **this skill, defect 1** |
| A claim repeated across a whole section | humaniser, fingerprint 11 |

---

## The rule

**One fact, one home.** Every procedure, term, and claim is owned by exactly one page. Every other page links to it.

A reader who meets the same instruction twice, worded differently, has to work out whether the difference is meaningful. It usually isn't - and the cost of checking is paid on every read.

---

## The three defects

### 1. Duplicated procedure

Two pages walk the same steps. Nearly always an overview or index page that summarises a procedure *and* links to it.

The tell is a `<Step>` on one page whose body is a compressed version of three `<Step>`s on another.

| | |
| --- | --- |
| **Overview** | "Open the connector and read the per-model breakdown of its last run." → links to Sync status |
| **Sync status** | Step 1 "Open the connector's sync history" · Step 2 "Open the most recent run and read the per-model breakdown" · Step 3 "Read the status on each model" |

**Fix:** the orientation page states *what the step achieves and why it comes first*, never *how to do it*. One sentence and a link.

### 2. Terminology drift

The same concept under different names on different pages. `bindbee-docs-style` calls this a defect; this is how you find it.

Three renderings of one set of four states:

- *loaded / sits outside the connector's scoping / is still unsupported / failed*
- *Success / Skipped / Not supported / Failed*
- *Skipped / Not supported / Failed / Success, on a partial run*

**Fix:** pick the canonical form - **whatever the product UI actually shows** - and use it verbatim everywhere, including in prose. Where a page needs to gloss a term, gloss it after the canonical label, never instead of it.

### 3. Conflicting instruction

Two pages give a different first move for the same situation, or route the same symptom to different destinations.

Watch for:

- **Different entry points.** One page opens "start at sync status"; another starts the same task at filters.
- **Mis-routes.** An index sending a symptom to the page next to the one that owns it.
- **Order disagreements.** A flow diagram whose sequence contradicts the numbered steps beside it.

**Fix:** decide which is right, change the other. Where both are right because the *tasks* differ, say which task each serves - the ambiguity is the defect, not the difference.

### 4. Within-page duplication

The same fact defined more than once **on a single page**, usually in different words, because the page grew by accretion or was merged from several sources.

It hides well: each section reads fine on its own, and nobody reads a 270-line page start to finish often enough to notice the fourth restatement.

The signature is a **term defined more than once**. Referencing a term repeatedly is fine and expected; *defining* it repeatedly is the defect.

```bash
F=guides/troubleshooting/connections-to-relink.mdx

# how often does a key term appear, and how often is it DEFINED?
grep -c "RELINK_NEEDED" $F
grep -n "RELINK_NEEDED" $F | grep -iE "means|becomes|is when|Credentials that|^\s*\|"

# a page carrying an unresolved merge note is prime suspect
grep -rn "CONTENT PASS" --include='*.mdx' .
```

**Fix:** define once, at the point the reader first needs it, and reference everywhere else. Where a warning must repeat because its cost is irreversible, keep it short and link to the definition rather than restating it.

<Note>
A page merged from several sources often carries a `CONTENT PASS` comment naming the
duplication it created. Treat those as a worklist - they are duplication someone already
found and deferred.
</Note>

**Escalate rather than patch** when the duplication is structural: a page defining a term four times across two `<Steps>` blocks and a reference section is not a wording problem, it is one page doing three jobs. Hand it to `bindbee-docs-intake` §Shape of the deliverable.

---

## Page roles

Most duplication traces back to a page taking the wrong shape. Assign every page in the section exactly one role before auditing.

| Role | Carries | Never carries |
| --- | --- | --- |
| **Orientation** (overview, index) | Routing table, flow diagram, one line per destination | `<Steps>`, `**Result:**`, a procedure |
| **Procedure** (how-to) | `<Steps>` with `**Result:**`, one task start to finish | The neighbouring task's steps |
| **Reference** | Tables, field lists, states | Instructions |

**An orientation page carrying `<Steps>` is the single most reliable predictor of a duplicated procedure.** It has taken the shape of the page it is supposed to point at.

### Routing must beat the sidebar

The nav already lists every page and shows each one's `description` on its card. **A routing list that restates those descriptions is duplication with the sidebar** - it costs a screen and tells the reader nothing new.

Routing earns its place by supplying what the nav cannot:

| The nav gives you | Routing can add |
| --- | --- |
| Page names, in nav order | The **symptom** in the reader's words, not the page's |
| Each page's description | An ordering: which to try first, and why |
| A flat list | Grouping: these three are one flow, these four are separate entries |

The test: **cover the link and read the line.** If what's left is the page's own description, cut the entry or rewrite it around the symptom.

```
❌  - [Connector relink](…): Re-authorise a connector whose credentials expired.
      …and the page's description is "Re-authorise a connector whose credentials stopped working."

✅  - [Connector relink](…) - when reads return stale data and the connector shows `RELINK_NEEDED`
```

### One link section per page

`## Related` is the house footer on 52 pages, and its entries already carry a condition - *"when the gap is a real absence"*, *"when credentials work and a model still fails"*. **That is routing.**

So a second link section under its own heading is nearly always the same list twice under two names. Fold routing into `## Related` and put the section-internal destinations first, ahead of the wider-context links.

Keep a separate routing block only where the reader needs it **before** the body rather than after - an index page whose entire job is dispatch, with no body to reach.

---

## The audit

Run over the whole section directory, not page by page.

```bash
S=guides/troubleshooting

# 1. Every step title in the section. Read them in one list - compressed
#    restatements of another page's sequence stand out immediately.
for f in $S/*.mdx; do
  n=$(grep -c '<Step title=' "$f")
  [ "$n" != 0 ] && { echo "--- $f ($n)"; grep -o '<Step title="[^"]*"' "$f" | sed 's/<Step title="/    /;s/"$//'; }
done

# 2. Orientation pages carrying a procedure
grep -ln '<Step title=' $S/overview.mdx $S/index.mdx 2>/dev/null

# 3. Repeated tables - same leading column header on two pages
grep -rn "^| Model status |\|^| Status |\|^| Symptom |" $S

# 4. A canonical term used consistently. Run per term that matters.
grep -rn "Not supported\|not supported\|unsupported" $S | cut -c1-110

# 5. An instruction appearing more than once
grep -rn "Connector Sync Error" $S | cut -c1-110
```

Anything appearing on three or more pages is a fact without a home.

---

## Assigning an owner

When the audit finds a duplicated fact, the owner is the page where a reader **arrives already asking that question** - not the page that mentions it first, and not the broadest page.

| Fact | Owner | Why |
| --- | --- | --- |
| What each model status means | Sync status | The reader is looking at those statuses |
| How to alert on sync failure | Sync status | It is sync health, not error triage |
| What relinking preserves | Connector relink | The reader is deciding whether to relink or delete |

Then apply the ladder, in order:

1. **Link.** Default. The other page names the fact and links.
2. **One-line summary plus link.** Where the reader needs the conclusion to decide whether to follow the link at all.
3. **Restate in full.** Only for a warning whose cost is irreversible - data loss, a broken ID. Even then, keep the wording identical across both copies so drift is greppable.

---

## Before you finish

```bash
# no orientation page carries steps
grep -c '<Step title=' guides/troubleshooting/overview.mdx    # expect 0

# canonical terms appear verbatim, glosses come after the label
grep -rn "Skipped" guides/troubleshooting/ | grep -v '`Skipped`\|| Skipped\|Skipped and\|Skipped means'

# links still resolve after repointing
grep -rhoE '\]\(/[a-zA-Z0-9/_-]+(#[a-z0-9-]+)?\)' --include='*.mdx' . \
  | sed -E 's/^\]\(//; s/\)$//; s/#.*$//' | sort -u \
  | while read -r l; do [ -f ".$l.mdx" ] || echo "BROKEN: $l"; done
```

Then read the section start to finish in nav order. **Does any page tell you to do something the previous page already told you to do?**
