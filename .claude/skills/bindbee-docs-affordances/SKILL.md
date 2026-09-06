---
name: bindbee-docs-affordances
description: Decide where a page needs a screenshot, and which lines belong in a Note, Warning, Info or Tip rather than plain prose. Use after a page's content is settled but before it ships - when prose is carrying something the reader will skim past, when a step describes a dashboard screen in words, or when callouts have been sprinkled by feel rather than by rule.
---

> **Position in the chain: 4 of 6.** Sequenced by `bindbee-docs-review`, which explains why.
>
> **This skill owns:** Callout type, and where screenshots belong.
> **It must not change:** page anatomy (style), sentence wording (humaniser), which page owns a fact (consistency). Flag those and hand them to the owner.
>
> **On finishing, run** `.claude/skills/bindbee-docs-checks.sh <section>`. A red line means this pass regressed an earlier one.

# Bindbee docs affordances

Content decides *what* a page says. This skill decides **what gets lifted out of the prose** - into a callout, or into a picture.

Both choices fail the same way: applied by feel, they inflate. A page where four things are boxed has emphasised nothing, and a page with a screenshot of every screen has buried the one screen that mattered.

---

## Callouts

### The vocabulary

Four components, and the repo already uses them consistently. Match the existing pattern rather than inventing a fifth.

| Component | Carries | Repo count |
| --- | --- | --- |
| `<Info>` | Preconditions. **25 of 29 uses are the `**Before you start**` block** - treat that as its job | 35 |
| `<Warning>` | A trap with a cost: irreversible action, silent data loss, code that breaks on an edge case | 56 |
| `<Note>` | A supplementary fact that changes what the reader expects, with no cost attached | 32 |
| `<Tip>` | A better way to do the thing they're already doing. Rare - don't reach for it | 14 |

### The test

Ask what happens to a reader who **skims past the line**.

| Consequence of missing it | Form |
| --- | --- |
| They break something, lose data, or ship a bug | `<Warning>` |
| They're surprised later, but nothing breaks | `<Note>` |
| They start the task unprepared | `<Info>` — preconditions |
| They do it a slightly longer way | `<Tip>` |
| Nothing - it's the argument of the paragraph | **Plain prose** |

**Most lines are the last row.** A callout works by interrupting; a page that interrupts constantly reads as flat.

### The other direction

A callout is also wrong when it *hides* something. **A recommended action the reader must take belongs in a callout only if the surrounding prose has a different job.** Where the action is the point of the section, it's a heading and a sentence, not a box.

Conversely, an instruction buried mid-paragraph that the reader is expected to act on - a setup step in a page about something else - is exactly what `<Note>` is for.

### Budget

`bindbee-docs-style` caps callouts at **2 per page** for Explanation pages, and warns that a page running a table, a diagram, a `<Note>` and a `<Warning>` is at its limit. Procedure pages carry more, because `<Info>` preconditions and per-step warnings are structural.

Count before adding:

```bash
for f in guides/troubleshooting/*.mdx; do
  printf "%-32s Note:%s Warning:%s Info:%s Tip:%s\n" "$(basename $f)" \
    "$(grep -c '<Note>' $f)" "$(grep -c '<Warning>' $f)" "$(grep -c '<Info>' $f)" "$(grep -c '<Tip>' $f)"
done
```

If `<Warning>` outnumbers everything on a page, the page has stopped distinguishing severity.

### Name the thing you're referencing

A callout pointing at a feature must say **what kind of thing it is**. "Set up Connector Sync Error" assumes the reader knows that's a webhook event; "subscribe to the `connector_sync_error` webhook event" tells them where to go look.

Check any capitalised product noun in a callout: does the sentence say whether it's a webhook event, a dashboard screen, a connector state, or an API field?

---

## Screenshots

### Count screens, not pages

**The unit is the screen, not the page.** A procedure that walks the reader through four dashboard screens needs four images. One screenshot on a five-screen page is worse than none: it signals the page is illustrated while leaving the reader to guess at the other four.

So the question is never "does this page deserve a screenshot?" It is: **list the screens this page asks the reader to visit, then account for every one.**

```
Sync status walks: Connectors list → connector's Syncs tab → a run → per-model breakdown
                   = 3-4 distinct screens = 3-4 images
```

### Tables and screenshots are not substitutes

The trap that produces under-illustrated pages:

> *"There's already a table of what each status means, so the screenshot is redundant."*

It isn't. **A table carries meaning; a screenshot carries location and recognition.** A reader who knows `Partial` means "some models loaded" still can't find where the dashboard says it. Pages describing a UI usually need both, next to each other.

### The decision

| Situation | Screenshot? |
| --- | --- |
| A step says open, click, go to, select, or find | ✅ One per distinct screen it lands on |
| Reading a screen correctly *is* the diagnostic step | ✅ The highest-value case - never skip it |
| A status, badge, or state the reader must recognise on sight | ✅ Even where a table already defines it |
| A dialog with non-obvious fields or defaults | ✅ |
| Two steps act on the same screen | One image, placed at the first |
| The step is a `curl`, a payload, or a concept | ❌ Code block or table |
| Pure navigation chrome with nothing to read on it | ❌ |

Staleness is a real cost, but it is a cost of *having a UI*, not a reason to describe screens in prose. Fix stale images; don't avoid images.

### The tag

Where a screenshot is warranted and no asset exists, tag it rather than describing the UI in prose or referencing a path that will 404.

**The tag must render on the site.** An MDX comment is invisible to everyone reviewing the docs in a browser - and the people who decide whether a screen needs capturing are reading the rendered page, not the source. A gap nobody can see is a gap nobody fills.

<!-- MIRROR:screenshot-tag START -->
```mdx
<Warning>
  **SCREENSHOT NEEDED** (review marker - strip before merge): <what to capture> - <what the reader should be able to see in it>
</Warning>
```
<!-- MIRROR:screenshot-tag END -->

Mirrored verbatim in `bindbee-docs-humaniser` → Screenshots. `bindbee-docs-checks.sh` fails if the two copies drift.

The second half is the part that matters. "Screenshot of sync status" can't be actioned by whoever takes it; "the per-model breakdown showing Success, Skipped, Not supported and Failed side by side" can.

This deliberately breaks the callout vocabulary above - `<Warning>` means *a trap with a cost*, and a review marker is neither. That mismatch is the point: it looks wrong on the page, which is what stops it shipping. **It is scaffolding, not content.**

### Stripping before merge

Every marker is removed or replaced with the real image before the branch merges. Audit, then strip:

```bash
# what is still outstanding
grep -rn "SCREENSHOT NEEDED" --include='*.mdx' .

# remove the marker blocks entirely (run from repo root, review the diff after)
python3 - <<'EOF'
import glob, re
pat = re.compile(r'^[ \t]*<Warning>\n[ \t]*\*\*SCREENSHOT NEEDED\*\*.*?\n[ \t]*</Warning>\n', re.M | re.S)
for p in glob.glob('guides/**/*.mdx', recursive=True):
    s = open(p).read()
    n = pat.sub('', s)
    if n != s: open(p, 'w').write(n); print('stripped', p)
EOF
```

Replacing a marker with the real asset is the better outcome - same position, wrapped in `<Frame>`.

### Coverage check

Count UI actions against images. A page with more navigation verbs than screens covered is under-illustrated.

```bash
for f in guides/troubleshooting/*.mdx; do
  ui=$(grep -cE '(In the dashboard|Open \*\*|Click \*\*|go to \*\*|Find it under|select \*\*)' "$f")
  img=$(( $(grep -c 'src="/images' "$f") + $(grep -c 'SCREENSHOT NEEDED' "$f") ))
  [ "$ui" -gt 0 ] && printf "%-32s ui-steps:%s  covered:%s%s\n" \
    "$(basename $f)" "$ui" "$img" "$([ "$img" -lt "$ui" ] && echo '   <-- under-illustrated')"
done
```

The check is a prompt, not a verdict - two steps on one screen legitimately share an image. Reconcile it by listing the screens, not by matching the numbers.

### Placement

Inside the `<Step>` whose screen it shows, after the `**Result:**` line. Wrap in `<Frame>` and write a real `alt` describing what's visible, not what the page is about.

---

## Tables

A table is the fourth thing lifted out of prose, and the one most often reached for by reflex.

### Routing is a list, not a table

**When the rows are "go to this page", write a link list.** Stripe never tables its routing:

> - [Sell and get paid online](…): Accept payments without building a website or app.
> - [Get and retain subscribers](…): Support and automate your subscribers' lifecycle.

`[Destination](/path): one sentence, verb first.` That's the whole pattern.

A table for the same job forces you to invent column headers, and inventing headers is where the AI texture comes from:

```
❌  | Page | What it settles | When you're done here |
✅  - [Sync status](/…): Read which models loaded and which failed.
```

### When a table is right

Comparing **the same attribute across several items**: status → meaning, model → required access, field → values. The reader scans one column and finds their row.

| | |
| --- | --- |
| ✅ | `\| Model status \| What it means \|` - one attribute, looked up by name |
| ✅ | `\| Component \| Description \|` - Stripe's only table on the page |
| ❌ | `\| Page \| What it settles \| When you're done here \|` - routing, and two invented headers |

### Rules

1. **Two columns unless a third is genuinely a third attribute.** A third column is usually the second one's consequence, and belongs in the same cell or in prose.
2. **Headers name the thing, plainly.** `Status`, `Meaning`, `Component`, `Description`. If you had to invent a phrase for a header - *What it settles*, *When you're done here*, *Why it matters* - the content isn't tabular.
3. **Don't force every cell into the same grammatical shape.** Three cells all opening *Which…* is symmetry you imposed, not structure you found - see `bindbee-docs-humaniser` fingerprint 9.
4. **One clause per cell.** `Report it, or take a permission back to the customer` is two answers in a box the reader is scanning.

---

## Tabs

`<Tabs>` splits a step by **route**, when the same goal is reachable two ways. In this repo that is almost always **Dashboard** and **API**.

```mdx
<Tabs>
  <Tab title="Dashboard">Click **Force Sync** on the connector's Overview tab.</Tab>
  <Tab title="API">```bash
  curl --request POST --url '…/connectors/resync' …
  ```</Tab>
</Tabs>
```

It earns its place twice over: the reader picks the route they work in, and the two tabs break the `Open… Open… Open…` monotony that pure dashboard steps fall into - see `bindbee-docs-humaniser` fingerprint 1b.

### Only where the alternative exists

**Verify the endpoint in `spec.json` before adding an API tab.** A tab promising an API route that isn't there is worse than no tab, because the reader goes looking.

Worked example from this repo:

| Step | API route? | Treatment |
| --- | --- | --- |
| Find the connector | `GET /api/hris/v1/connectors` | ✅ Tabs |
| Retry the sync | `POST /api/embedded/v1/connectors/resync` | ✅ Tabs |
| Read the per-model breakdown | **None** - the connector endpoint returns one `sync_status` for the whole run | ❌ Prose, plus a `<Note>` saying it is dashboard-only |

**Where no API route exists, say so.** That sentence is more useful than a tab would have been - it stops the reader searching for an endpoint, and points them at webhooks instead.

### Rules

1. **Same goal, different route.** Tabs are not for sequential stages, and not for variants of one route.
2. **Two or three tabs.** More means the step is doing too much.
3. **Consistent titles across a page.** `Dashboard` / `API`, in that order, every time.
4. **Each tab stands alone.** A reader on the API tab must not need the Dashboard tab for a step.

---

## Diagrams

The third thing that gets lifted out of prose. **Three skills touch a diagram, and each owns one stage:**

| Stage | Owner | Question |
| --- | --- | --- |
| **Decide** one is needed | **this skill** | Does the shape of this survive being written as sentences? |
| **Content** - what it must show | `bindbee-docs-intake` for a new page; the author otherwise | Which entities, which edges? |
| **Render** - type, syntax, styling | `bindbee-docs-style` → Mermaid house style | `erDiagram` or `stateDiagram-v2`? How are edges labelled? |

### Deciding

A diagram earns its place when **the content is a shape**: a lifecycle, a hierarchy, a set of relations, an exchange between parties. Prose describes those badly because it forces one linear order onto something that isn't linear.

| Situation | Diagram? |
| --- | --- |
| States and the transitions between them | ✅ `stateDiagram-v2` |
| Which model points at which, and by what key | ✅ `erDiagram` with the FK on the edge |
| A branching decision the reader has to make | ✅ `flowchart TB` |
| A sequence of calls between two parties | ✅ `sequenceDiagram` |
| A list of things with no relationship between them | ❌ That's a table |
| A procedure the reader follows in order | ❌ That's `<Steps>` |
| Restating a paragraph that already reads clearly | ❌ Decoration |

**A flowchart of a linear process is a numbered list drawn badly.** If every node has exactly one outgoing edge, use `<Steps>`.

### Keep it readable

`bindbee-docs-style` caps diagrams at ~6 edges, and that cap is the whole readability rule. **A diagram that needs a legend has failed** - the labels belong on the edges.

Where a diagram would exceed the cap, the section is doing too much: split it, or diagram only the part the reader gets wrong.

### The tag

Same reasoning as screenshots: a gap nobody can see is a gap nobody fills.

```mdx
<Warning>
  **DIAGRAM NEEDED** (review marker - strip before merge): <type> showing <what> - <what the reader should be able to work out from it>
</Warning>
```

`bindbee-docs-style` also defines an invisible `{/* DIAGRAM (tier 2): ... */}` marker for backlog items nobody is expected to action this cycle. Use the visible form when the diagram blocks the page from being correct, the invisible one when it would merely improve it.

---

## The pass

1. Read the page and mark every line a reader **must not miss**. Apply the consequence test to each; most will come back as prose.
2. Count callouts. Where `<Warning>` dominates, demote the ones with no cost attached to `<Note>`.
3. Check every capitalised product noun in a callout names its own type.
4. **List the screens the page walks through**, then account for every one - image or tag. Run the coverage check as a prompt.
5. Confirm every `SCREENSHOT NEEDED` tag says what the reader should *see*.
6. Re-read the page ignoring the boxes. **Does the argument still hold?** If the prose stops making sense without them, content has leaked into the callouts.
