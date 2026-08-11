# Bindbee Documentation

Source for [docs.bindbee.dev](https://docs.bindbee.dev), built with [Mintlify](https://mintlify.com).

## Local development

```bash
npm i -g mint     # once
mint dev          # serves on http://localhost:3000
```

Run from the repo root — the folder containing `docs.json`. If the dev server misbehaves, `mint update` pulls the latest CLI.

## How this repo is organized

Configuration lives in **`docs.json`** — navigation, theming, redirects, and the OpenAPI wiring. There is no `mint.json`.

In Mintlify **the file path is the URL**, so the directory tree is the URL tree. Content is organized on one rule:

> Narrative pages live under their [Diátaxis](https://diataxis.fr) type. Reference pages live under `api-reference/`, organized by product domain.

| Directory | Holds | Tab |
| --- | --- | --- |
| `get-started/` | Landing page, prerequisites, and `tutorials/` — the seven-lesson tutorial | Get Started |
| `explanation/` | Concepts: how syncing works, what the unified model guarantees, why data goes missing | Explanation |
| `how-to/` | Task guides, each answering one question | How-To |
| `api-reference/` | Auth, pagination, rate limits, and platform endpoints | API Reference |
| `hris/` `ats/` `lms/` | Per-model endpoint pages, generated against `spec.json` | API Reference |
| `custom-fields/` `sdk/` `webhooks/` | Reference endpoint pages only | API Reference |
| `features/` | Dashboard product tour | Get Started |
| `integrations.mdx` | Supported systems, slugs, and connection type | Get Started |

Two directories are deliberate exceptions, documented rather than accidental: `integrations.mdx` sits at the root because it is the most-linked page in the repo, and the per-model endpoint directories have not yet been consolidated under `api-reference/`.

## Conventions

- **Endpoint paths must match `spec.json`.** Connector endpoints are category-scoped — `/api/hris/v1/connectors`, never `/api/v1/connectors`.
- **Shell variables**: `$BINDBEE_API_KEY` and `$CONNECTOR_TOKEN`. Use these names everywhere so examples remain copy-pasteable across pages.
- **Moving or renaming a page changes its public URL.** Add an entry to `redirects` in `docs.json` in the same commit.
- **Tutorial lessons** follow a fixed shape: an objective line, `Context`, three to five imperative steps each ending in a **Result**, `What you just did`, and `If this didn't work`.

## Before opening a PR

1. `mint dev` renders without errors and no navigation group is empty.
2. Every internal link resolves to a file on disk or to a redirect source.
3. Every `docs.json` navigation entry points at a file that exists.

## Deployment

Merging to `main` deploys automatically via the Mintlify GitHub App.
