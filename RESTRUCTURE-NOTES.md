# Documentation Restructure — Handoff Notes

Restructure of the Bindbee docs against the *Bindbee API Doc & DX Assessment*, using the
Diátaxis framework (Tutorials / How-To / Reference / Explanation).

**Date:** 2026-07-31

---

## What changed

### Navigation (`docs.json`)

Replaced the four mixed-axis anchors (Documentation / SDK / Webhooks / Custom Fields, with
five sub-tabs mixing intent-based and product-based grouping) with **four intent-based tabs**:

```
Get Started | Explanation | How-To | API Reference
```

Integrations & Coverage and the Platform Tour sit inside **Get Started** rather than in a
separate Resources tab — "Resources" read as a synonym for Get Started and split the
evaluator's path across two tabs.

Fixes the three UX problems in §5 of the assessment:

| Problem | Fix |
| --- | --- |
| Mixed organizing principle in top nav | All four tabs are now intent-based; products are groups *inside* API Reference |
| Persistent sidebar items across all tabs | Webhooks and Custom Fields are no longer floating anchors. Their **endpoints** sit under API Reference → Platform; their **guides** moved to How-To and Explanation |
| Flat alphabetical model list (16 HRIS models) | **Partially fixed.** Models are now ordered by relatedness rather than alphabetically, so Benefits / Employer Benefits / Dependent Benefits / Dependents / Benefit Coverage sit together and Employee leads the list. See note below |

**On model grouping:** an intermediate category layer (Core / Compensation & Payroll / Benefits /
Time & Attendance / Banking, and the ATS and LMS equivalents) was built and then removed by
request, to keep the sidebar at two levels — product → model → endpoints.

The models are therefore a flat list again, but **ordered logically instead of alphabetically**,
which retains most of the benefit: related models are adjacent, and Employee — the hub model
almost everything hangs off — is first rather than buried between Dependent Benefits and Employee
Payroll Runs.

The residual cost is scanning: HRIS has 18 model groups and ATS 16 in a single ungrouped column.
If that proves hard to scan in practice, restoring the category layer for HRIS only is a
two-line change.

Also added:
- `contextual.options` (`copy`, `view`, `chatgpt`, `claude`) — the unused Mintlify AI features in §4.2. This gives the per-page "copy as markdown / open in Claude" menu, addressing the *"can I give context to my coding agent?"* builder gap.
- Global anchors linking to `status.bindbee.dev` and `trust.bindbee.dev` (§2.1 security question).

### API Reference is five groups

```
API Basics   →  auth, pagination, sync frequency, rate limits
Platform     →  Connectors · Integrations · Embedded Link · Custom Fields ·
                Webhooks · Meta APIs · Passthrough      (org-level, category-independent)
HRIS         →  18 models
ATS          →  16 models
LMS          →   7 models
```

Platform holds everything that is **not** scoped to a product category, matching the
assessment's §7.1 tree ("Platform — fixed for all selector changes", with Custom Fields and
Supplemental nested inside it). An earlier draft broke Webhooks, Custom Fields and Supplemental
out as siblings of HRIS/ATS/LMS, which wrongly implied they were peers of the product APIs.

Nesting is capped at two levels everywhere: **group → resource → endpoints**.

Every top-level group carries a FontAwesome `icon`.

<!-- prettier-ignore -->
> **Mintlify constraint:** the `expanded` property only affects *nested* groups. Top-level groups
> always render expanded and cannot be collapsed. So API Basics / Platform / HRIS / ATS / LMS are
> permanent section headers; the resource groups inside them (Employee, Connectors, Passthrough…)
> are the collapsible dropdowns, collapsed by default.
>
> To make the products themselves collapsible they would have to become nested groups under a
> single top-level wrapper — which re-adds the nesting level removed earlier. Not done; flagged
> as a trade-off.

### Custom Fields pages split by type

The Custom Fields section mixed reference and guidance. It is now split by what each page is:

| Page | Moved to |
| --- | --- |
| 13 endpoint pages (Lookup, CRUD, Mappings, Discovery) | API Reference → Platform → Custom Fields |
| `custom-fields/dashboard.mdx`, `custom-fields/api-workflow.mdx` | How-To → Working with Data |
| `custom-fields/overview.mdx` | Explanation → Integration Patterns |

No files moved on disk — URLs unchanged. See open item 8 for the content overlap this exposes.

### One page merged, one redirect added

`sdk/integrations.mdx` and the connector coverage page were merged into a single
[`/integrations`](integrations.mdx) page — slugs, connection type, models, and how to check a
live connector's real coverage now live in one place. A redirect from `/sdk/integrations`
keeps the old URL working.

Every other existing URL is unchanged: no other files were moved or renamed, only re-parented
in navigation.

### New content (32 pages)

**Get Started** (`get-started/`) — the 2/10 Tutorials quadrant
- `what-is-bindbee.mdx`
- `quickstart.mdx` — signup → first unified employee record, ~10 min, with a troubleshooting table
- `core-concepts.mdx`
- `tutorials/connect-your-first-customer.mdx`
- `tutorials/read-employee-data.mdx`
- `tutorials/read-benefits-and-payroll-data.mdx`
- `tutorials/handle-webhooks.mdx`
- `tutorials/write-data-back.mdx`

**Explanation** (`explanation/`) — the other 2/10 quadrant
- `how-syncing-works.mdx`
- `connector-lifecycle.mdx`
- `data-freshness.mdx`
- `hris-model-relationships.mdx`
- `benefits-models.mdx` — Benefit vs Employer Benefit vs Dependent Benefit
- `field-semantics.mdx` — answers *"why is [field] null?"* and *"modified_at updated but the data didn't change"*, both marked **Not addressed** in the assessment
- `passthrough-when-and-why.mdx`
- `custom-fields-mental-model.mdx`
- `meta-api-schema-discovery.mdx`
- `sftp-vs-api.mdx`
- `webhooks-vs-polling.mdx`
- `security-and-compliance.mdx`

**How-To** (`how-to/`)
- `authenticate.mdx` — the step-by-step path the assessment flagged as **broken**
- `install-sdks.mdx`
- `paginate.mdx`
- `filter-with-modified-after.mdx`
- `map-custom-fields.mdx`
- `use-passthrough.mdx`
- `handle-errors.mdx`
- `validate-webhook-signatures.mdx`
- `monitor-sync-status.mdx`
- `force-a-resync.mdx`
- `go-live-checklist.mdx`

**Root**
- `integrations.mdx` — merged integration slug list + coverage guidance

### Roadmap coverage (assessment §6)

| Pri | Item | Status |
| --- | --- | --- |
| P0 | Quickstart / build-your-first-integration | Done |
| P0 | Fix the authentication path | Done |
| P0 | Connector Coverage Matrix | **Partial** — see open item 1 |
| P0 | Changelog | **Dropped** — see open item 3 |
| P0 | Verify the SDK claim | **Needs product input** — see open item 2 |
| P1 | Explanation layer | Done |
| P1 | How-to guides | Done |
| P1 | Top-nav restructure | Done |
| P1 | Help Center seeded from ClearFeed | Not done — needs ClearFeed access |
| P1 | MCP server + Claude Code Skills | Not done — `contextual` options added as a partial step |
| P2 | Domain cookbooks (ICHRA, census, deductions) | Not done — needs domain SME input |
| P2 | ClearFeed→FAQ pipeline, metrics dashboard | Not done — outside the docs repo |

---

## Open items needing product/engineering confirmation

These are the places where the repo did not contain enough information to write something
verifiable. Everything else in the new content is grounded in `spec.json`, existing pages, or
the OpenAPI schemas.

### 1. Connector coverage matrix — per-connector model/field support

`integrations.mdx` lists **every integration, its slug, and its connection type
(API vs SFTP)** — all verifiable from the previous integrations page. It does **not** contain a
per-connector × per-model support grid, because that data lives in the portal, not in this repo.

The page currently teaches readers to query coverage themselves via `/api/{category}/v1/integrations`
and per-model probe requests. That is honest and useful, but it is not the searchable matrix the
assessment asks for.

**To finish it:** export the model/field support data from the portal and render it as a
filterable table. If an endpoint exposing it exists or is planned, the page should link to it.

### 2. SDK claim (Python / Node / Go)

The assessment notes the website mentions SDKs that aren't in the docs. **I could only verify two
Bindbee-published packages in this repo:**

- `@bindbee/react-link` (npm) — frontend Embed hook
- `https://cdn.bindbee.dev/initialize.min.js` — frontend Embed via CDN

I found **no evidence of server-side SDKs** for Python, Node or Go.

`how-to/install-sdks.mdx` therefore documents the two verified frontend packages and provides a
production-shaped **HTTP client** (retry, pagination, both auth headers) in Python, Node and Go
instead of claiming SDKs that may not exist.

**Action required:** confirm whether server-side SDKs exist.
- If they do → replace the hand-rolled clients on that page with install instructions.
- If they don't → the website claim should be corrected.

### 3. Changelog — dropped by request

The changelog page was removed. This leaves the assessment's maintainer question *"Did Bindbee
change something? Where's the changelog?"* unanswered — it was a P0 with "Exists for all"
competitors.

Two notes if it is ever revisited:

- The gap is real but it is a **process** problem, not a docs problem. A changelog only helps if
  entries ship with the change; a stale one is worse than none.
- The **breaking-change policy** is the part builders actually need, and it now has no home.
  Specifically: new enum values are additive and ship without notice, which is why
  [field-semantics](explanation/field-semantics.mdx) tells readers never to write an exhaustive
  switch over a Bindbee enum. Consider stating that policy somewhere permanent.

### 4. Sync internals

`explanation/how-syncing-works.mdx` describes the sync lifecycle from observable behaviour —
status fields, `sync_progress`, webhook events, the 24-hour default. It deliberately does **not**
claim whether syncs are full or incremental upstream, because the repo doesn't say.

If Bindbee does incremental extraction, saying so would strengthen the page. Worth an
engineering review pass.

### 5. Security certifications

`explanation/security-and-compliance.mdx` covers API-level security (credential scope, environment
isolation, regions, webhook signing, shared responsibility) and **points at
`trust.bindbee.dev` as the authority** for SOC 2 / HIPAA / GDPR rather than restating claims that
would go stale. Confirm that is the preferred posture.

### 6. `modified_after` endpoint coverage

`how-to/filter-with-modified-after.mdx` notes the parameter is available across unified list
endpoints. It is confirmed on `/api/hris/v1/employees` in `spec.json`; a sweep confirming which
endpoints accept it would let that hedge be removed.

### 8. Custom Fields content overlap

Re-filing the Custom Fields guides by type put them next to the new pages, which makes a real
duplication visible:

| Existing page | Overlaps |
| --- | --- |
| `custom-fields/overview.mdx` | `explanation/custom-fields-mental-model.mdx` |
| `custom-fields/dashboard.mdx` + `custom-fields/api-workflow.mdx` | `how-to/map-custom-fields.mdx` |

Both pairs are now adjacent in the sidebar, so a reader sees two answers to the same question.
The existing pages are good and were written recently — this is not a quality problem, it is a
"say it once" problem.

Suggested resolution: keep `custom-fields/overview.mdx` as the conceptual page and fold the
unique parts of the new mental-model page into it; keep `how-to/map-custom-fields.mdx` as the
task page and let `dashboard.mdx` / `api-workflow.mdx` become the tool-specific detail it links
to. Left alone pending a decision, since it means editing pages that were not part of this
restructure.

### 7. Help Center

The assessment proposes `help.bindbee.dev` (§7.2). It does not appear to exist yet, so it is
**not** linked from the nav — a dead nav link is worse than an absent one. Add the global anchor
once it's live.

---

## Pre-existing issues found (not introduced by this work)

| File | Issue |
| --- | --- |
| `untitled-page.mdx` | Duplicate of `meta-apis-for-write-operations.mdx`, `hidden: true`. Safe to delete |
| `dashbaord-analytics-api.md` | Orphaned (also misspelled filename). Not in nav before or after |
| `vms/**` (6 pages) | VMS endpoints on disk with no nav entry. Either add a VMS section or remove |
| `README.md` | Still the unmodified Mintlify starter kit README; references `mint.json`, which this project doesn't use |
| `features/issues.mdx` | Images hotlinked from `media.discordapp.net` — will break; also has two typos (`perticular`, `incase`) |
| `features/overview.mdx` | "Issues" card links to `/features/logs` instead of `/features/issues` |

None were changed, since they're outside the restructure scope. The Discord-hosted images are the
most urgent — those URLs expire.

---

## Verification performed

```
docs.json parses as valid JSON
180 nav entries → 0 missing files, 0 duplicates
Redirect /sdk/integrations -> /integrations resolves
All internal links across all .mdx/.md files resolve to existing pages
32 new MDX files → frontmatter valid, code fences balanced, no stray JSX
```

Recommend a `mintlify dev` run before merging to confirm rendering.
