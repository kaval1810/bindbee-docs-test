---
name: bindbee-docs-humaniser
description: Strip AI-generated texture from Bindbee docs prose. Use after drafting or restructuring any .mdx page, and whenever a page reads as machine-written - stacked hedges, negative definitions, restated points, mechanical bolding, rule-of-three lists. Also defines the SCREENSHOT NEEDED tag. Runs after bindbee-docs-style, which owns structure; this skill owns the sentences.
---

> **Position in the chain: 5 of 5.** Runs last, after `bindbee-docs-linking`. Sequenced by `bindbee-docs-review`, which explains why.
>
> **This skill owns:** Sentences: wording, hedges, bolding, punctuation.
> **It must not change:** page anatomy (style), callout type (affordances), which page owns a fact (consistency). Flag those and hand them to the owner.
>
> **On finishing, run** `.claude/skills/bindbee-docs-checks.sh <section>`. A red line means this pass regressed an earlier one.

# Bindbee docs humaniser

`bindbee-docs-style` decides what a page contains and how it is shaped. This skill decides how the sentences read.

Apply it as a **pass over finished prose**, not while drafting. The failure it exists to catch is a page that is structurally correct and still unmistakably machine-written.

---

## The four rules

Everything below is an instance of one of these.

1. **Lead with the action.** The reader came to do something. Put the verb first and the context after, or drop the context.
2. **Say it once.** A point made twice is made weaker, not clearer.
3. **Say what is, not what isn't.** Negation makes the reader hold two states in mind to keep one.
4. **Stop when the point lands.** The sentence explaining the previous sentence is almost always deletable.

The benchmark is Stripe's docs. An entire Stripe page carries about two hedges and no dramatic framing at all, and every step opens with a verb.

---

## Fingerprints

### 1. Negative definition

The strongest tell. AI defines a thing by contrast with what it is not, because contrast is easy to generate and reads as insight.

| Instead of | Write |
| --- | --- |
| Logs are the last step, not the first. | Come here once sync status and the error source haven't explained it. |
| That isn't a partial sync. The model loaded. | The model loaded; the fields weren't populated. |
| Skipped and Not supported are not errors. | Skipped means you switched the model off. Not supported means Bindbee doesn't unify it yet. |
| This is a separate track from the sync-failure flow. | A relink is the whole connection losing its credentials, so the per-model breakdown stays clean. |

Headings too: `## What logs cannot tell you` → `## Limits`.

Negation earns its place when the wrong belief is **actively expensive** - an upstream `403` read as a Bindbee auth failure, a retry that duplicates a record. Keep those. Cut the rest.

### 1a. Throat-clearing

The sentence before the instruction, explaining why the instruction is coming. AI writes it because it reads as considerate; the reader skips it, or worse, reads it and still doesn't know what to do.

| Instead of | Write |
| --- | --- |
| Before investigating missing data, it's worth establishing what the last sync did. Open the connector… | Open the connector and read the per-model breakdown of its last run. |
| Read what the connector's last sync did, model by model. Most data questions are answered here. | Open the connector and go to **Syncs**. Most data questions are answered here. |
| This section covers how to relink a connector. | *(delete - the heading said that)* |

**Keep the context only where it changes what the reader does**, and put it after the action. Stripe's construction is the model: purpose clause first *only* when it lets a reader skip the sentence - *To customise the invoice template, go to Brand settings* - and the verb otherwise.

Openers that are almost always throat-clearing: *Before you…*, *It's worth…*, *Note that…*, *In order to understand…*, *This section…*, *Let's…*

**The back-reference is the same move pointing backwards.** It positions the reader relative to the page before saying anything, and the page already did that:

> ~~Everything above is a check you run after someone reports a problem.~~ Subscribe to the **Connector Sync Error** webhook event…
> Subscribe to the **Connector Sync Error** webhook event…

Back-reference openers: *Everything above…*, *Everything below…*, *As mentioned…*, *Now that you've…*, *At this point…*, *So far…*, *With that in place…*

**Check inside callouts too.** A `<Note>` is one or two sentences by design, so a lead-in eats half of it - and callouts are where this survives longest, because the eye reads them as separate from the prose.

### 1b. One verb doing every job

Imperative mood solves the passive-voice problem and creates a new one: the same verb opening every step. A reader scanning `Open… Open… Open…` stops seeing the verb, which is the word carrying the instruction.

**`Open` is the usual culprit**, because most dashboard steps genuinely begin by opening something. Reach for the verb that names the actual action:

| Instead of | Write |
| --- | --- |
| Open the connector's page | **Select** the connector |
| Open the run | **Click into** the run |
| Open Logs for the connector | **Go to** Logs |
| Open it under Connectors | **Locate** it under Connectors |
| Open the per-model breakdown | **Read** the per-model breakdown |

Count them before shipping a section:

```bash
grep -rhoE '^\s*(Open|Click|Go|Read|Find|Select|Review|Locate) ' guides/troubleshooting/*.mdx \
  | tr -d ' ' | sort | uniq -c | sort -rn
```

**No single verb should own more than about a third of the openings.** Where one does, the steps have collapsed into one shape and the variety has to come from naming what actually differs between them.

### 2. The restated point

Two sentences carrying one idea, the second opening with *which means*, *in other words*, *that is*, *so effectively*, or a comma splice doing the same work.

> Skipped means the model is disabled in scoping. ~~Nothing is broken, and there is nothing to debug.~~

Delete the second. If the first sentence needed the rescue, fix the first sentence.

### 3. Explaining the documentation

Prose about the page's own structure. The nav and the headings already carry this.

- ~~"which is why this page comes before the logs, not after"~~
- ~~"Everything below splits along that line."~~
- ~~"The three pages below run most to least frequent."~~
- ~~"Work through them in this order - each is cheaper to check than the next."~~ → order is implied by `<Steps>`

### 4. Hedge stacking

`usually`, `often`, `typically`, `commonly`, `generally`, `almost always`, `nearly always`, `the overwhelming majority`, `in most cases`.

**Budget: one per page.** Stripe's entire no-code guide carries two, across a page many times our length. Spend yours where the exception genuinely changes what the reader does; everywhere else, state the thing.

> ~~Almost always the two numbers are counting different things rather than one being wrong.~~
> The two numbers are counting different populations.

Where the exception matters, name it instead of hedging. `Most platforms return a terminal status; Workday excludes them` beats `terminated employees are usually returned`.

### 5. Dramatic framing

Stakes-raising that carries no information: *the failure mode that costs most*, *the one that catches people*, *what separates X from Y*, *this is where it gets interesting*, *the single most useful*.

Cut the frame, keep the fact.

### 6. Rule of three

Three parallel items where the content has two or five. Symptom: a count in the prose - *three very different problems*, *the two big ones*, *five distinct causes*.

Drop the count. It dates the moment someone adds a sixth, and it is a tell on its own.

### 7. Mechanical bolding

AI treats "one bolded clause per paragraph" as a quota and bolds the first clause of every paragraph, so the skim path becomes noise.

`bindbee-docs-style` splits the rule by quadrant: **on How-To pages bold is UI labels only**, on Explanation pages it carries the argument at roughly **one paragraph in four**. Check which kind of page you're on before counting.

The tell on a procedure page is a bold that isn't something you can click:

```
✅  Click **Relink Connector**.
❌  **The connector keeps its ID**, so nothing you stored needs updating.
```

### 8. Punctuation tells

- **Em dash for drama.** House separator is a spaced hyphen ` - `. Never `—`, `–`, or ` -- `. Grep for `—` before shipping.
- **The dramatic colon.** *There is only one fix: relink.* → *Relink it.*
- **Sentence fragments as emphasis.** *A real investigation, on evidence.* Write the sentence.

### 9. Symmetry that wasn't in the facts

Tables where every row is the same shape, `<Accordion>` sets that alternate problem/cause/problem/cause, four bullets each one clause long. Real material is lumpy. If a row needs two sentences and another needs three words, leave them uneven.

### 10. The bloated `description`

Frontmatter `description` is where this texture concentrates, because nothing in the page pushes back on its length. AI writes it as a summary of everything below - clauses joined with dashes and semicolons, the whole flow of the page compressed into one line.

<!-- MIRROR:description-cap START -->
**Target 60-90 characters. Hard cap 110.** Measured across the repo: median 108, p75 129 - the long tail is the defect, not the norm. Nav cards and search results truncate, so a description that needs a second clause has stopped being a description.
<!-- MIRROR:description-cap END -->

Mirrored verbatim from `bindbee-docs-style` → Frontmatter → Description length, which owns it. `bindbee-docs-checks.sh` fails if the two copies drift.

| | Chars | |
| --- | --- | --- |
| The two workspace roles, and what a Member cannot do. | 53 | ✅ |
| How often a Production connector syncs, and how to change it. | 61 | ✅ |
| Fetch the exact request schema a connector expects before you write to it. | 74 | ✅ |
| Credentials expire, get rotated, or lose permissions and the connector stops syncing. Detect that state, regenerate the link, and get your customer to re-authorise without breaking stored IDs. | 192 | ❌ |

Rewrite a long one by asking what the page *is*, rather than what it covers:

> Spot a connector whose credentials stopped working, and get it re-authorised. - 76

Three tells, each meaning cut:

- **A dash or semicolon joining two independent clauses.** Keep the first.
- **A list of three.** *sync status, then the error's source, then logs* - the page has headings for that.
- **Restating the title.** `title: "Logs"` with a description opening *The per-request audit…* is fine; one opening *Logs are…* is not.

Check the whole section at once:

```bash
for f in guides/troubleshooting/*.mdx; do
  d=$(awk '/^description:/{sub(/^description: *"?/,""); sub(/"$/,""); print; exit}' "$f")
  [ ${#d} -gt 110 ] && printf "%3d  %s\n" "${#d}" "$f"
done
```

### 11. Covering everything in one sentence

The instinct behind most of the fingerprints above, and the one that survives after the others are fixed. AI writes a sentence that anticipates every follow-up, because a sentence that answers one thing feels incomplete to it.

| | |
| --- | --- |
| ❌ | Where to start when a connector misbehaves, and which page to open next. |
| ✅ | Identify where to start when a connector misbehaves. |

The second clause is always the tell: `, and …`, `, or …`, `; …`, or a second sentence doing cleanup. **Write the first clause. Delete the rest.** If the dropped half matters, it is a sentence of its own or it belongs in a heading.

This applies hardest to `description`, where `bindbee-docs-style` makes it a rule, but it runs through body prose too:

> ~~A partial sync means some models loaded and others didn't, so the fix differs from a total failure.~~
> A partial sync means some models loaded and others didn't.

### 12. Lexical tells

From Wikipedia's *Signs of AI writing*, via [blader/humanizer](https://github.com/blader/humanizer). Our pages currently carry none of these - the list is a guard, not a backlog.

| Class | Examples | Fix |
| --- | --- | --- |
| **Inflated vocabulary** | additionally, moreover, furthermore, landscape, testament, showcasing, delve, leverage, robust, seamless, crucial, vital, realm | Cut, or use the plain word |
| **Weak verbs** | serves as, acts as, functions as, boasts, plays a key role, is designed to | `is`, `has`, or the actual verb |
| **Filler** | in order to, due to the fact that, it is important to note, has the ability to | to, because, *(delete)*, can |
| **False ranges** | "everything from webhooks to rate limits" | List the items |

```bash
grep -rnoiE '\b(additionally|moreover|furthermore|landscape|testament|showcas\w*|delve|leverage|robust|seamless|crucial|vital|realm)\b' --include='*.mdx' guides/
grep -rnoiE '\b(serves as|acts as|boasts|plays a (key|vital|crucial) role|in order to|due to the fact that|has the ability to)\b' --include='*.mdx' guides/
```

### 13. Cross-page repetition

The worst offender in a linked section, and invisible page by page. A fact repeated on four pages reads as padding by the third.

**State it once, on the page that owns it. Link from the others.**

```bash
# before shipping a section, check the claims you repeated
grep -rn "leaves nothing in the logs" --include='*.mdx' guides/troubleshooting/
grep -rn "delete and recreate" --include='*.mdx' guides/
```

---

## Screenshots

<!-- Mirrored in bindbee-docs-affordances → Screenshots, which owns the fuller
     when-to-screenshot rules. Change one, change both. -->

Where a dashboard screen is the thing being described, tag it rather than describing the UI in prose.

<!-- MIRROR:screenshot-tag START -->
```mdx
<Warning>
  **SCREENSHOT NEEDED** (review marker - strip before merge): <what to capture> - <what the reader should be able to see in it>
</Warning>
```
<!-- MIRROR:screenshot-tag END -->

**It renders on the site on purpose.** Reviewers read the rendered page, not the source, so an invisible comment is a gap nobody can see. Strip every marker before merge - `bindbee-docs-affordances` carries the strip script.

```bash
grep -rn "SCREENSHOT NEEDED" --include='*.mdx' .
```

Count screens, not pages: a procedure walking four dashboard screens needs four images. `bindbee-docs-affordances` owns the fuller rules.

---

## The pass

### Mechanical - the script enforces these

`bindbee-docs-checks.sh <section>` fails on all four.

1. Em dashes. House separator is ` - `.
2. Every `description`: within the cap, verb-first, one clause.
3. Hedges: one per page.
4. Lexical tells, throat-clearing and back-reference lead-ins.

### Judgement - nothing enforces these but you

A green script says nothing about any of these, and they are the usual reason a page still reads AI-written. Run `bindbee-docs-checks.sh --read <file>` to put the material in front of you.

5. **Bold clauses, in order.** Do they read as the argument? On a How-To, are they UI labels only, and under a quarter of paragraphs?
6. **First sentence of each section.** Verb first, or clearing its throat?
7. **Every negation.** Does the wrong belief cost the reader anything? If not, state it positively.
8. **Paragraph-final sentences.** Does any restate the one before it?
9. **Repeated claims across the section.** Grep the ones you wrote twice.
10. **Read it start to finish.** Would a support engineer write these sentences in a ticket reply?
