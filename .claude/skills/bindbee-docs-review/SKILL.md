---
name: bindbee-docs-review
description: Run the Bindbee docs skills in the right order without them undoing each other. Use this as the entry point whenever more than one docs skill applies - after restructuring a section, before a review branch goes out, or when a page has been rewritten and needs the full pass. Defines the sequence, what each skill owns, and the invariants no later pass may break.
---

# Bindbee docs review

Seven skills act on the same files. Run in the wrong order they rewrite each other's output; run without boundaries they fight over the same sentence. This skill is the entry point that sequences them.

**If only one skill applies, invoke it directly.** This is for when two or more do.

---

## The sequence

**Text-moving passes run before text-polishing passes.** Anything that relocates, generates, or rewraps prose has to finish before anything that tunes wording, or the tuning is thrown away.

| # | Skill | Acts on | Why here |
| --- | --- | --- | --- |
| 0 | `bindbee-docs-intake` | The facts a new page needs, and where it lands in the nav | Only for pages that don't exist yet. Skip for edits to existing pages |
| 1 | `bindbee-docs-style` | Page shape: quadrant, anatomy, headings, frontmatter keys | Everything downstream assumes the page is the right *kind* of page |
| 2 | `bindbee-docs-persona` | Whether the content is **true**, and whether it serves the reader it is written for | The only pass that may delete a step or invert a warning. Deciding who owns a fact is pointless before the fact is known to be right |
| 3 | `bindbee-docs-consistency` | Which page owns which fact; terminology across the section | Moves and deletes whole blocks. Cheapest to do before anyone words them carefully |
| 4 | `bindbee-docs-affordances` | Callout type, screenshots, diagrams; lifts lines out of prose | Changes what is prose and what is a box, and can add new prose |
| 5 | `bindbee-docs-linking` | Cross-links between pages | Can only link content that already exists, and it adds prose the next pass must polish |
| 6 | `bindbee-docs-humaniser` | Sentences | **Last.** It is the only pass whose output nothing else rewrites |

<Note>
The failure this ordering fixes is real and was observed: the humaniser ran second,
then consistency reworded its sentences and affordances rewrote them again. One
sentence in `errors-and-issues.mdx` was written three times by three passes.
</Note>

<Warning>
**Five of these passes check form. Only `persona` checks truth.** A page reached
zero mechanical failures, clean reading passes and resolving links while telling a
benefits platform to expand the wrong relation, filter out customers it needed, and
read a model for a field that does not do its job. Form passing is not correctness.
</Warning>

### Skipping

Skipping forward is fine; going back is not. If a late pass turns up a structural defect - a page in the wrong quadrant, a duplicated procedure - **stop, fix it at its own stage, and resume from there.** Patching it in place is how the sequence stops meaning anything.

---

## Two layers

The seven skills are not peers. They split by **when** they act, and that is what keeps `bindbee-docs-style` from being redundant now that five passes exist.

| Layer | Skills | Answers |
| --- | --- | --- |
| **Write-time** | `intake`, `style` | What should this page contain, and what does correct look like? |
| **Review-time** | `persona`, `consistency`, `affordances`, `linking`, `humaniser` | Is what's on the page true, and where does it fall short? |

`style` is the **specification** - the vocabulary, anatomy, naming and quadrant rules a page is measured against. Each pass is **detection and repair** for one defect class. They quote `style`; they don't replace it:

| `style` states the rule | The pass supplies |
| --- | --- |
| Terminology is fixed across pages | `consistency` - how to find drift and who owns the term |
| One bolded clause per paragraph | `humaniser` - spotting the AI habit of bolding every opener |
| Max 2 callouts per page | `affordances` - which of the four to use, and when prose is right |
| `description` cap of 110 chars | `humaniser` - rewriting a long one to a single clause |

**Keep the layers clean.** A specification that drifts into a pass, or a pass that starts defining vocabulary, is how the two ended up fighting before. The test: *would a writer need this before typing the first sentence?* Yes → `style`. Only when reviewing text that already exists → the pass.

Write-time skills are also the only ones a **new page** needs. Run `intake` → `style`, write the page, and only then run the review chain over it.

## Ownership

Each skill edits one surface. A skill that finds a defect outside its surface **flags it and hands it to the owner** rather than fixing it in passing. That single rule is what stops later passes overriding earlier ones.

| Surface | Owner | Others may |
| --- | --- | --- |
| Whether a page should exist, and its nav placement | intake | flag |
| Quadrant, page anatomy, heading structure | style | flag |
| `description` and other frontmatter | style | flag |
| Whether a claim is factually true, checked against `spec.json` | persona | flag |
| Whether the content serves its reader, and the reader it addresses | persona | flag |
| Which page holds a fact; canonical terms | consistency | flag |
| Callout type (`Note`/`Warning`/`Info`/`Tip`) | affordances | flag |
| Whether a diagram is needed | affordances | flag |
| Mermaid type, syntax and styling | style | flag |
| Where a cross-link belongs, and its anchor text | linking | flag |
| Screenshots and `SCREENSHOT NEEDED` markers | affordances | flag |
| Sentence wording, hedges, bolding, punctuation | humaniser | flag |

Worked example: the affordances pass finds a sentence that should be a `<Note>` but is also badly worded. It moves the sentence into the `<Note>` - its surface - and leaves the wording alone. The humaniser fixes the wording afterwards, in place, without touching the callout.

---

## Invariants

`.claude/skills/bindbee-docs-checks.sh` holds every mechanical rule from all the skills in one file. **Each skill ends by running it**, so a later pass cannot silently break an earlier one.

```bash
.claude/skills/bindbee-docs-checks.sh guides/troubleshooting
```

It asserts:

- descriptions present and within the cap (style)
- no em dashes, hedge budget respected (humaniser)
- orientation pages carry no procedure, canonical terms in prose (consistency)
- callouts balanced, every screenshot marker says what the reader should see (affordances)
- **mirrored blocks between skills are byte-identical**
- every internal link resolves

A red line means the pass you just ran regressed something an earlier pass established. Fix it before moving on; do not proceed with a failing check.

### A green script is not a finished page

`bindbee-docs-checks.sh` only checks what grep can see. **Negative definition, dramatic framing, forced triplets and restatement are invisible to it**, and they are the usual reason a page passes every check and still reads as machine-written.

So the definition of done has two halves, and the second is not optional:

| | |
| --- | --- |
| **Mechanical** | `bindbee-docs-checks.sh <section>` exits green |
| **Reading** | The four passes below, walked per page |

```bash
.claude/skills/bindbee-docs-checks.sh --read <file.mdx>
```

That prints the material for each pass; the judgement is yours.

1. **Bold clauses, in order.** Do they read as the argument? On a How-To, are they UI labels only?
2. **First sentence of each section.** Verb first, or clearing its throat?
3. **Every negation.** Does the wrong belief cost the reader anything? If not, state it positively.
4. **Paragraph-final sentences.** Does any restate the one before it?

Then read the page start to finish and ask whether a support engineer would write these sentences in a ticket reply.

<Warning>
  Reporting a page as done on a green script alone is the failure this gate exists to prevent.
  It has happened: a page passed every mechanical check while opening both of its sibling
  pages with a negative definition, which is fingerprint 1 in `bindbee-docs-humaniser`.
</Warning>

### Mirrored blocks

Some rules are duplicated across skills on purpose, so each works standalone. Duplication is allowed; **drift is not.** Wrap both copies in markers and the checker enforces they stay identical:

```
<!-- MIRROR:<name> START -->
…identical text…
<!-- MIRROR:<name> END -->
```

Register the new pair in `check_mirror` at the bottom of the checks script. Current pairs: `description-cap` (style ↔ humaniser), `screenshot-tag` (affordances ↔ humaniser).

---

## The run

```bash
# 0. baseline - know what was already failing before you start
.claude/skills/bindbee-docs-checks.sh guides/troubleshooting

# 1-5. one skill at a time, checks after each
#      a red line after a pass means that pass regressed something
```

Then, before the branch goes out:

```bash
grep -rn "SCREENSHOT NEEDED" --include='*.mdx' .   # strip or fill each
grep -rn "VERIFY:" --include='*.mdx' .             # resolve or carry forward knowingly
```

Finally read the section start to finish in nav order. **The checks catch regressions; only reading catches a section that is individually correct and collectively wrong.**
