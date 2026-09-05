---
name: bindbee-docs-intake
description: Collect the facts a new page needs before writing a word of it, and decide where the page belongs in the nav. Use whenever a new page or section is proposed - the interview that turns "we should document X" into a brief specific enough to write from. Runs before bindbee-docs-style.
---

# Bindbee docs intake

> **Position in the chain: 0 of 5.** Runs before `bindbee-docs-style`. Sequenced by `bindbee-docs-review`.
>
> **This skill owns:** the questions asked before a page exists, and where the page lands in the nav.
> **It must not change:** existing pages. Its output is a brief, not prose.
>
> **On finishing:** hand the brief to `bindbee-docs-style` and write. Then run the chain.

A docs page is mostly facts the writer doesn't have: what the dashboard actually shows, which permission the sync needs, why the platform behaves that way. **Write first and ask later and you produce confident fiction** - fluent, plausible, and wrong in the specifics that make docs worth reading.

This skill front-loads the asking.

---

## Before any questions

### 1. Does this need a new page?

Most "we need a page on X" is a section on a page that already exists. A new page costs a nav slot, inbound links, and a fact that now has two homes.

```bash
grep -rln "<the concept>" --include='*.mdx' .
```

| Finding | Do |
| --- | --- |
| An existing page already covers it thinly | Expand that page |
| Two pages half-cover it | `bindbee-docs-consistency` first - the duplication is the real defect |
| Genuinely absent, and a reader would search for it by name | New page |

### 2. Answer everything you can without asking

**Never spend a question on something greppable.** Field names, enum values, status codes and endpoint paths come from `spec.json`; nav placement and existing coverage come from the repo. Arrive at the interview with those already resolved.

```bash
# the API contract
python3 -c "
import json; s=json.load(open('spec.json'))
print(list(s['components']['schemas']['HrisEmployeeResponse']['properties']))"

# what the published site already says
grep -rn "<the concept>" --include='*.mdx' .
```

Three sources, in order of authority:

| Source | Authoritative for | Reach it by |
| --- | --- | --- |
| `spec.json` | Paths, fields, enums, status codes | The snippet above. **Never write a field name from memory** |
| The published docs | What has already been promised to customers | Repo grep, or the Bindbee docs MCP server if connected |
| The person you're interviewing | Intent, rationale, what actually breaks | The questions below |

What is left after the first two is what only a person knows.

### 2a. Fact-check the answers you get

An interview produces claims, and claims from memory drift the same way documentation does. **Check every answer that names something checkable before it reaches the page.**

| The answer names… | Check against | If they disagree |
| --- | --- | --- |
| A field, enum, path, status code | `spec.json` | Go back to them. One of the two is wrong, and it matters which |
| A dashboard label | The dashboard, or a screenshot | Prefer the rendered string; label the source |
| Behaviour already documented | The existing page | A contradiction is a defect on *one* of the pages - find out which before writing a third version |

A disagreement is a finding, not an obstacle. **The spec being wrong is worth knowing; so is the SME being right about something the spec never captured** - a dashboard-only state, for instance, which then ships with a `VERIFY` marker explaining exactly that.

Never resolve a conflict silently by picking the more plausible answer.

### 3. Fix the quadrant

The question set depends on it, so decide first - see `bindbee-docs-style`.

| The reader… | Quadrant | Shape |
| --- | --- | --- |
| has a goal and is stuck | How-to | `<Steps>` + `**Result:**` |
| was surprised and wants to understand | Explanation | no `<Steps>` |
| is looking up a fact | Reference | generated from `spec.json` - **no interview** |
| is learning the product first time | Tutorial | numbered H2s |

---

## The questions

Ask in **one batch**, not a drip. Mark each **[blocking]** or **[fills a gap]** so the answerer can triage - a page can ship with gaps marked `VERIFY`, but not with a blocking question open.

### Every page

1. **[blocking]** Who lands here, and what just happened to them? *A support engineer whose customer says data is missing. A developer whose write returned 422.*
2. **[blocking]** What do they already have - connector ID, dashboard access, API key, a route to the customer's admin?
3. **[blocking]** What does done look like? How do they know they succeeded?
4. **[fills a gap]** What is the single most common way this goes wrong in real tickets?
5. **[fills a gap]** Is any of this integration-specific? Workday and BambooHR differ enough that "it depends" is an answer worth capturing.
6. **[fills a gap]** Which existing page loses content to this one?

### How-to, additionally

7. **[blocking]** The exact sequence - click path or API calls, in order. Not the summary; the steps.
8. **[blocking]** After each step, what does the reader see? (These become the `**Result:**` lines.)
9. **[blocking]** Which dashboard screens does this cross? Name each one - they drive screenshots in `bindbee-docs-affordances`.
10. **[fills a gap]** Real failure text. The actual error string beats a paraphrase, because readers paste it into search.
11. **[fills a gap]** What must be true before starting? (The `<Info> Before you start` block.)
12. **[fills a gap]** What is the destructive mistake here - the action that can't be walked back?

### Explanation, additionally

7. **[blocking]** What do people get wrong about this? Name the misconception; the page exists to correct it.
8. **[blocking]** Why is it built this way? Design rationale is the one thing no amount of reading the code recovers.
9. **[fills a gap]** What would a reasonable person expect instead, and why isn't it that?
10. **[fills a gap]** What breaks downstream if they assume wrong?

### Tutorial, additionally

7. **[blocking]** What is the single worked example carried start to finish?
8. **[blocking]** What can they see or run at the end that proves it worked?

---

## Shape of the deliverable

Before placement, decide how many pages this is. A brief that says "document relinking" can land as one page, three pages, or a section on a page that already exists.

### One page, or several?

Count the **jobs**, not the words. A job is one reader arriving with one goal.

| Signal | Reading |
| --- | --- |
| Two `<Steps>` blocks serving *different* goals | **Two pages.** One page, one procedure |
| A reference section bolted onto a procedure (states, field tables, enums) | **Split the reference out**, or move it to the page that owns those states |
| The `<Info> Before you start` preconditions differ between halves | **Two pages.** Different preconditions means a different reader |
| Two `<Steps>` blocks that are stages of *one* goal | One page. Sequential stages are not separate jobs |
| Long, but a single continuous argument | One page. Length alone never justifies a split |

```bash
# pages carrying more than one procedure
for f in guides/**/*.mdx; do
  n=$(grep -c '<Steps>' "$f")
  [ "$n" -gt 1 ] && echo "$n  $f"
done
```

### Subpage, or section of an existing page?

| | Choose |
| --- | --- |
| A reader would search for it by its own name | Its own page |
| It only makes sense after reading the parent | Section of the parent |
| It has its own preconditions and its own success condition | Its own page |
| It is one step of the parent's procedure, explained at length | Section, or a `<Note>` in the parent |

Mintlify nests by nav group, not by file path - a subpage is a page in a group, so this is a nav decision rather than a directory one.

### A new group, or an existing one?

**Default to an existing group.** A new group costs a nav heading readers must scan past on every visit.

Justified only when: three or more pages share a reader the existing groups don't serve, and no existing group's name honestly covers them. Two pages is a section; one page is never a group.

## Placement

Decide before writing - it changes the title, the `sidebarTitle`, and every inbound link.

| Question | Resolve by |
| --- | --- |
| Which tab? | Reader intent: first-time (Get Started), task or concept (Guide), lookup (API Reference) |
| Which group? | The seven Guide groups are in `docs.json`; pick the one whose other pages share this reader |
| Where in the group? | Groups run in reading order, not alphabetical. A page the others depend on goes first |
| Replacing anything? | `git mv`, repoint inbound links, add a `redirects` entry - never leave a dead path |

```bash
python3 -c "
import json; d=json.load(open('docs.json'))
for t in d['navigation']['tabs']:
    print('TAB:', t.get('tab'))
    for g in t.get('pages', t.get('groups', [])):
        if isinstance(g, dict): print('  ', g.get('group'), len(g.get('pages', [])))"
```

**A page nobody can reach from the nav does not exist.** Adding the `docs.json` entry is part of creating the page, not a follow-up.

---

## The brief

Write the answers down before writing prose. Keep it with the draft:

```
PAGE:       guides/troubleshooting/<slug>
QUADRANT:   how-to
NAV:        Guide → Troubleshooting, after "Sync status"
READER:     support engineer, customer reports missing data
HAS:        connector ID, dashboard access
DONE WHEN:  they can name which model failed and why
SCREENS:    Connectors list → Syncs tab → run detail
VERIFIED:   model statuses ✓ spec.json (absent - dashboard-only, VERIFY marker)
OPEN:       [Q10] real error text for a Workday ISU permission failure
```

Every `OPEN` item becomes a `{/* VERIFY: ... */}` marker in the draft, with why it matters. **Unanswered is fine; unmarked is not.**

---

## Stop rules

- **A blocking question is unanswered.** Ask again. Do not fill it with a plausible guess - that is the failure mode this skill exists to prevent.
- **The answers describe two different readers.** You have two pages, or one page in the wrong quadrant.
- **Every answer came from you, not the interviewee.** You are documenting your assumptions. Find someone who has done the task.

Then hand the brief to `bindbee-docs-style` and write.
