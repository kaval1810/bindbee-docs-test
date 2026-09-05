---
name: bindbee-docs-linking
description: Find where a reader is stuck on one page while the answer sits on another, and add the jump. Use after a page's content is settled - especially on API Reference pages, which readers land on from search and which rarely point anywhere. Owns link opportunity; bindbee-docs-style owns link format.
---

# Bindbee docs linking

> **Position in the chain: 4 of 5.** Runs after `bindbee-docs-affordances`, before `bindbee-docs-humaniser`. Sequenced by `bindbee-docs-review`.
>
> **This skill owns:** where a cross-link belongs, and its anchor text.
> **It must not change:** page structure (style), which page owns a fact (consistency), callouts or images (affordances). Flag those and hand them to the owner.
>
> **On finishing, run** `.claude/skills/bindbee-docs-checks.sh <section>`.

`bindbee-docs-consistency` links **instead of** duplicating - it removes a second copy and points at the first. This skill links **in addition to** what is there: the reader has what this page offers and would go further if they knew where.

Those are opposite motions, which is why they are separate passes.

---

## The asymmetry to fix

Readers arrive at API Reference from search, having never seen the guides. Measured in this repo:

| Direction | Links |
| --- | --- |
| `guides/` + `get-started/` → `api-reference/` | 42 |
| `api-reference/` + `hris/` + `ats/` + `lms/` → `guides/` | 18 |

**Reference is where readers land and where the docs stop talking to them.** `guides/reading-writing/reading-data/expand.mdx` explains a parameter that appears across the HRIS endpoints, and carries **zero** inbound links from any reference page.

## Reference pages can carry prose

The style guide's "frontmatter stub, no body" describes 102 of 139 operation pages. **The other 37 already carry a body, and it renders** - `api-reference/connectors/resync-connector.mdx` is the model:

```mdx
---
title: "Force Resync a Connector"
openapi: post /api/embedded/v1/connectors/resync
---

## Overview

This guide demonstrates how to use the Resync API to force a sync of a connector.
```

The `openapi:` key still drives the generated request/response block; the body renders above it. So a one-line pointer on an operation page is available, cheap, and already established practice.

<Note>
Editing the body is docs-side and safe. Editing the *generated* content is not - that
comes from `spec.json`, and the fix belongs upstream. See `bindbee-docs-style` → API Reference.
</Note>

---

## Where links belong

Work outward from the reader's position, not from the sitemap.

| The reader is… | Link to | Example |
| --- | --- | --- |
| On an endpoint with a parameter they don't know | The guide that explains the parameter | `expand`, `modified_after`, filters |
| On an endpoint that serves a known job | The use case that uses it | Create Employee → `/get-started/use-cases/create-an-employee` |
| Meeting a term for the first time on this page | The page that defines it | `RELINK_NEEDED`, `connector_token` |
| At the end of a procedure with an obvious next move | The next procedure | Relink → Sync status |
| On a concept page wanting to try it | The endpoint | Expand guide → the HRIS endpoints |

### The test

**Would the reader have to search for this, and would the search be a good one?**

- Yes to both → link it
- They wouldn't think to search → link it, and say why in the anchor text
- The search would be better than your link → skip; don't compete with search

## Rules

1. **First meaningful mention only.** Link a term once per page, where the reader first needs it. A term linked in every paragraph reads as noise and dilutes the one that matters.
2. **Anchor text names the destination.** `see [Expand](/guides/reading-writing/reading-data/expand)` - never "click here", "this page", or a bare URL.
3. **Say what they get.** On `## Related` lists the repo convention is `- [Page](/path) - why you'd follow it`. Carry that intent into inline links where the destination isn't obvious from its title.
4. **Never link inside a code block or a table cell that is a value.** Link the prose that introduces it.
5. **Don't link forward into a page that assumes what this one teaches.** A tutorial linking to an advanced guide mid-flow loses the reader.

### Budget

A paragraph with three links has no emphasis, the same way a page with four callouts has none. **Cap at roughly one link per paragraph**, plus the `## Related` list.

```bash
# paragraphs carrying 3+ links
grep -nE '(\]\([^)]*\).*){3,}' --include='*.mdx' -r guides/
```

---

## The audit

```bash
S=guides/troubleshooting     # or api-reference, hris, ...

# 1. Pages that link nowhere - dead ends
for f in $S/*.mdx; do
  n=$(grep -c '](/' "$f")
  [ "$n" = 0 ] && echo "dead end: $f"
done

# 2. Reference -> guide coverage, by directory
for d in api-reference hris ats lms webhooks; do
  printf "%-14s %s\n" "$d" "$(grep -rho '](/guides/[a-z0-9/-]*' $d 2>/dev/null | wc -l)"
done

# 3. A guide with no inbound links is invisible
TARGET=/guides/reading-writing/reading-data/expand
grep -rn "$TARGET" --include='*.mdx' . | wc -l

# 4. Orphans: every guide page, ranked by inbound count
for f in guides/**/*.mdx; do
  p="/${f%.mdx}"
  printf "%3s  %s\n" "$(grep -rl "($p)" --include='*.mdx' . | wc -l | tr -d ' ')" "$p"
done | sort -n | head -20
```

**An orphan page is a page that does not exist.** Zero inbound links means it is reachable only from the nav, by someone already looking for it.

## Before you finish

- Every new link target resolves - `bindbee-docs-checks.sh` covers this
- No page gained a second link to the same destination
- Anchor text reads as a destination, not as an instruction
- The prose still reads if you ignore every link. **Links are an addition to a sentence, never its subject.**
