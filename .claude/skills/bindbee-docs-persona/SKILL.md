---
name: bindbee-docs-persona
description: Read a page as the person who has to act on it - a developer running the code, or the platform whose job the page describes - and check the content is true and useful for them. Use on any page carrying endpoints, parameters, enums or a worked procedure, and on every use-case page. Catches the defect class the other passes cannot see: a page that is well-formed and wrong.
---

> **Position in the chain: 2 of 6.** Sequenced by `bindbee-docs-review`, which explains why.
>
> **This skill owns:** whether the content is factually correct, and whether it serves the reader it is written for.
> **It must not change:** page anatomy (style), which page owns a fact (consistency), callout type (affordances), link placement (linking), sentence wording (humaniser). Flag those and hand them to the owner.
>
> **On finishing, run** `.claude/skills/bindbee-docs-checks.sh <section>`. A red line means this pass regressed an earlier one.

# Bindbee docs persona

The other five passes check **form**. None of them checks whether the page is **right**.

A page can carry a verb-first description, zero em dashes, one callout, a `## Related` list, balanced bolding, no duplicated facts, and every link resolving - and still tell a benefits platform to fetch the wrong field, filter out the customers it needs, and read a model for data it does not hold. That page passes the whole chain.

This skill is the pass that opens the page as the person who has to act on it.

<Note>
This is not a proofreading pass. It is the only pass permitted to **delete a step, invert
a warning, or change what the page instructs**. That is why it runs before `consistency` -
deciding which page owns a fact is pointless until the fact is known to be true.
</Note>

---

## The two personas

| | **Developer** | **ICP** |
| --- | --- | --- |
| Asks | Will this run, and is it the right call? | Is this the job I actually have? |
| Authority | `spec.json`, and the dashboard for labels | The reader definition below, and the domain |
| Finds | Paths, params, enums, fields, limits | Framing, wrong-field-for-the-job, borrowed context |

**Run both on use-case pages.** They catch different halves of the same defect: the developer persona finds that `expand=work_locations` is a valid parameter, and the ICP persona finds that it is the wrong one for the job the page describes.

### Which to run

| Page carries | Developer | ICP |
| --- | --- | --- |
| A `curl`, endpoint, parameter or enum | ✅ | if it also describes a job |
| A use case, or any "what you'll use" inventory | ✅ | ✅ |
| A concept or orientation page, no code | skip | ✅ |
| Dashboard-only procedure | skip | ✅ |

---

# Persona A - the developer

## The evidence rule

**Every path, parameter, field, enum value and limit is checked against `spec.json` before you accept it, and again before you write one.** Never from memory, and never from the surrounding prose - the prose is what you are auditing.

```bash
S=spec.json

# does the path exist, exactly as written?
python3 -c "import json;print([p for p in json.load(open('$S'))['paths'] if 'employees' in p])"

# what fields does the model really carry?
python3 -c "
import json;s=json.load(open('$S'))['components']['schemas']
print(sorted(s['HrisEmployeeResponse']['properties']))"

# what values does an enum really take?
python3 -c "
import json;s=json.load(open('$S'))['components']['schemas']
print(s['HrisDependent']['properties']['relationship'])"

# what does the endpoint actually accept, and what are the limits?
python3 -c "
import json;s=json.load(open('$S'))
for n,o in s['paths']['/api/hris/v1/employees'].items():
    for p in o.get('parameters',[]): print(p['name'], p.get('schema'))"
```

`spec.json` is a read-only mirror of the upstream OpenAPI document. **A mismatch is a docs bug, never a spec bug** - fix the page, and raise the spec upstream. See `bindbee-docs-style` → API Reference.

## Fingerprints

### D1. A path, parameter or field that does not exist

The cheapest defect and the most embarrassing. Grep it, don't trust it.

### D2. The right field for the sentence, the wrong field for the job

**The one the other passes will never catch**, because nothing about it is malformed.

> Step: *"Keep date of birth, home postcode and location, because carriers rate on those."*
> Code: `?expand=work_locations`

`HrisEmployeeResponse` carries **both** `home_location` and `work_location`. The parameter is valid, the relation is real, the request returns `200`. It is still the wrong one, and the step directly above says so.

**Check every field reference against the sentence that motivates it.**

### D3. A filter that silently drops valid rows

A filter narrows a set. Ask what it removed and whether the reader wanted it gone.

> `?employment_status=ACTIVE`

The real enum is `ACTIVE, PENDING, INACTIVE, ACTIVE_EXTERNAL, INACTIVE_EXTERNAL, -, LEAVE, DECEASED, RETIRED`. `LEAVE` is still enrolled. `RETIRED` may be a quoted population. `PENDING` is a new hire inside the waiting period. The request succeeds and the answer is wrong.

**For every filter in an example, print the full enum and name what the filter excludes.**

### D4. A dashboard label used as an API value

The dashboard shows **Synced** for `Done`, a percentage for `Syncing`, and **Partial**, which has no API equivalent at all. Model-level statuses appear in no schema.

**A value the reader will type goes in `code`; a value they will see on screen goes in bold.** Mixing them produces a filter that 400s.

### D5. An inventory that the procedure never uses

A "What you'll use" block listing five models where the steps call one. Either the steps are incomplete or the list is decoration - both mislead a developer estimating the work.

```bash
F=<page>
sed -n '/What you.ll use/,/^## /p' $F | grep -o '\[[a-z ]*\]'      # listed
sed -n '/## Steps/,/<\/Steps>/p' $F | grep -oE 'v1/[a-z-]+'        # actually called
```

### D6. Placeholder drift

Measured in this repo: **8 forms of the API key** and **4 of the connector token**.

```
64 ✅  Bearer <BINDBEE_API_KEY>        61 ✅  X-Connector-Token: <CONNECTOR_TOKEN>
 5 ❌  Bearer YOUR_BINDBEE_API_KEY      2 ❌  X-Connector-Token: END_USER_CONNECTOR_TOKEN
 4 ❌  Bearer <YOUR_API_KEY>            1 ❌  X-Connector-Token: YOUR_CONNECTOR_TOKEN
 …
```

A reader copying two snippets from two pages gets two conventions. `bindbee-docs-checks.sh` fails on any form outside the canonical two.

### D7. A limit asserted without checking

`page_size=200` is correct - the schema says `maximum: 200`. Assert nothing about caps, windows or rates without reading the schema, and where the schema is silent, say the docs are silent rather than inventing a number.

### D8. Would it run?

Read each snippet as a shell command. Auth header present? Required parameters supplied? Path matching the spec exactly, including `/api/hris/v1`? A snippet that cannot be pasted and run is a snippet the reader debugs instead of using.

---

# Persona B - the ICP

## Who the reader is

The docs establish this on the front page, and every page inherits it:

> *"Your customers keep their employee data in whichever system they already bought… Bindbee sits between those systems and yours."*

| Term | Means | Never means |
| --- | --- | --- |
| **you** / **your product** | The platform integrating Bindbee - benefits admin, HR tech, broker tech | Bindbee, or the employer |
| **your customer** / **the customer** | The employer whose HR system is connected | The employee, or the reader |
| **downstream vendor** | A third party the reader sends data to - a carrier, a payroll provider | Anyone the page addresses |

**The reader is never the third party.** They assemble data for one, or receive it from one.

## Fingerprints

### I1. The reader placed in someone else's chair

> ❌ *"A carrier cannot quote without a census: who is eligible, how old they are…"*
> ✅ *"You assemble the census a carrier quotes from: who is eligible, how old they are…"*

The first sentence states a third party's requirement as the page's subject. Compare the siblings that get it right - *"When **you** need to revoke access…"*, *"Creating an employee writes a person into the customer's system of record."*

**Test: whose job is the first sentence about?** If the answer is not the reader's, the page opens in the wrong chair.

### I2. Domain vocabulary borrowed from the wrong side

The same entity called **the customer** in four places and **the group** in two. *Group* is what a carrier calls an employer. Using both names for one entity makes the reader work out whether they are the same thing.

**Check every domain noun: is this the word our reader uses, or the word their counterparty uses?**

### I3. Advice that is right in a different context

> *"Counting dependent records instead of coverage inflates the census."*

True at renewal, where you reconcile against who is enrolled. Backwards for a new quote, where you want everyone **eligible** - current enrolment understates the population. Correct sentence, wrong page.

**For every warning, name the situation it protects against, then check that situation is the one the page is about.**

### I4. The right model, the wrong field

> *"Read dependents for their dates of birth."*

`HrisDependent` carries `date_of_birth`, so this is not false. But `relationship` (`CHILD | SPOUSE | DOMESTIC_PARTNER | SIBLING | PARENT`) is what builds the tier the quote is priced on, and DOB cannot distinguish a 24-year-old spouse from a 24-year-old child. The page names a real field that does not do the reader's job.

**For each field the page tells the reader to read, ask what they do with it next.**

### I5. What the reader's counterparty requires, unstated

The page told a reader to keep two rating factors. The model also carries `gender` and `tobacco_use`, both of which a carrier rates on. A census missing them comes back for a second pass.

**Enumerate what the reader's downstream needs, then diff it against what the page collects.**

### I6. A limit the reader will hunt for

`HrisEmployment` has no hours-worked field anywhere. A reader building eligibility logic will look, and not find it. **Stating a limit flatly is cheaper than the support ticket** - see `bindbee-docs-style` → Voice.

---

## The pass

1. **Establish the reader.** Who acts on this page, and what do they do immediately after reading it?
2. **Developer sweep** - every path, param, field, enum and limit against `spec.json`. Cite what you checked.
3. **Motivation check** - for each field and filter, read the sentence that justifies it. Do they agree? (D2, D3)
4. **Job check** - for each field the reader is told to fetch, what do they do with it next? (I4)
5. **Downstream diff** - what does the reader's counterparty require that the page never collects? (I5)
6. **Chair check** - whose job is the first sentence about? (I1)
7. **Context check** - for every warning, is its situation this page's situation? (I3)
8. **Hand off.** Wording, callouts, links and structure are not yours. Flag and move on.

## Before you finish

```bash
# nothing asserted that the spec does not carry
grep -oE '`[a-z_]+`' <page> | sort -u          # then check each against the schema

# every listed model is actually called
sed -n '/What you.ll use/,/^## /p' <page> | grep -o '\[[a-z ]*\]'

# placeholders canonical
grep -rhoE 'Bearer [<A-Za-z_>{}]+' --include='*.mdx' . | sort | uniq -c

# the reader is never the third party
grep -nE '^(A|The) (carrier|payroll provider|vendor)' <page>
```

**Then state what you verified and against what.** A persona pass that reports "looks correct" has not run. The output is a list of claims checked, each with its source - or the defect it found.
