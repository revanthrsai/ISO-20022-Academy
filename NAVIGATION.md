# ISO Academy — Navigation & Route Structure

> **Status:** Locked in Session 1.1. This is the canonical top-level IA and URL
> scheme. Session 1.3 (Page Templates) implements it; Sessions 2–5 fill it in.
> Do not add a sixth top-level section without a blueprint decision.

This document is the companion to `PHILOSOPHY.md`. Philosophy answers *why* and
*how we teach*; this answers *where everything lives and how you get to it*.

---

## 1. The four-question framing → four sections

The entire product is organized around the four questions in the blueprint
vision. There are **exactly four** top-level destinations. Each one answers one
question and nothing else.

| Question | Section | Route | Purpose (one line) |
|---|---|---|---|
| Why does ISO 20022 exist? | **History** | `#/history` | A cinematic, chapter-by-chapter story. |
| How does it work? | **Library** | `#/library` | The educational heart — levels 100–500. |
| Can I work with it? | **Playground** | `#/playground` | Hands-on tools that feel like real software. |
| What does this term mean? | **Glossary** | `#/glossary` | A fast, searchable reference. |

The home route `#/` redirects to `#/history` — History is the front door, the
opening scene of the film the whole site continues.

---

## 2. Route scheme

Hash-based routing (`#/…`), matching the current no-build, single-page setup.
One reserved query string (`?`) layer for filter/search state so a filtered
view is shareable and survives reload.

```
#/                              → redirect to #/history
#/history                       → History landing (chapter index / first scene)
#/history/<chapter-slug>        → a single History chapter

#/library                       → Library landing (the five levels as an index)
#/library/<level>               → a level overview        (level ∈ 100|200|300|400|500)
#/library/<level>/<topic-slug>  → a single lesson (the nine-beat Lesson Spine)

#/playground                    → Playground landing (the five tools as a workspace)
#/playground/<tool-slug>        → a single tool, optionally deep-linked to a sample

#/glossary                      → Glossary landing (all terms)
#/glossary?category=<cat-slug>  → filtered to one category
#/glossary?q=<query>            → search results
#/glossary/<term-slug>          → a single term's detail
```

**Slug rules:** lowercase, hyphenated, derived from the human title
(`clearing-vs-settlement`, not `104`). Levels are the bare number (`100`). Tool
and category slugs are the short kebab names listed below.

---

## 3. Section sub-structure

These sub-routes are *named here, built later*. The names below are the
contract; the slugs are final.

### History — `#/history/<chapter-slug>`
Five chapters, read in order (Phase 2):

1. `evolution-of-payments`
2. `swift-and-mt-messages`
3. `problems-with-legacy-standards`
4. `birth-of-iso-20022`
5. `global-migration-timeline`

### Library — `#/library/<level>/<topic-slug>`
Five levels, five topics each (Phase 3). Levels are routed by number; topics by
slug.

- **`100` Fundamentals** — `what-is-money`, `what-is-a-payment`, `payment-lifecycle`, `clearing-vs-settlement`, `payment-participants`
- **`200` Architecture** — `payment-systems`, `payment-gateway`, `payment-hub`, `payment-switch`, `real-time-payments`
- **`300` Messages** — `pain-family`, `pacs-family`, `camt-family`, `head-and-admi`, `message-lifecycle`
- **`400` Exceptions** — `reject`, `return`, `recall`, `reversal`, `investigations`
- **`500` Case Studies** — `customer-transfer`, `payroll`, `cross-border-payment`, `treasury`, `end-to-end-payment-flow`

### Playground — `#/playground/<tool-slug>`
Five tools (Phase 4):

1. `xml-viewer`
2. `transformer`
3. `validator`
4. `comparator`
5. `samples` (Sample Message Library)

A tool may accept a sample via query, e.g. `#/playground/xml-viewer?sample=pacs-008-customer-transfer`, so the five tools can pass one message between them (the Phase 4.6 integration goal).

### Glossary — `#/glossary?category=<cat-slug>`
Five categories (Phase 5):

1. `business-terms`
2. `iso-20022-terms`
3. `message-elements`
4. `technical-terms`
5. `acronyms`

---

## 4. Top-level nav component (spec for 1.2 / 1.3)

The persistent header shows the four sections, in question order:

```
History   ·   Library   ·   Playground   ·   Glossary
```

- Active section is highlighted; the sliding indicator already exists and should
  be reused.
- The logo links to `#/` (→ History).
- No fifth item. (See Backlog re: the current "Learning Journey".)
- Sub-navigation (level rail, tool tabs, category filters) lives *inside* each
  section, not in the global header — the global header never grows past four
  items.

---

## 5. Mapping from the current code (for Session 1.3)

The existing implementation predates this IA. 1.3 implements the table below;
1.1 only records it. **No code is changed in 1.1.**

| Current `navigate()` key | Target section | Target route |
|---|---|---|
| `history` | History | `#/history` |
| `learn` | Library | `#/library` |
| `playground` | Playground | `#/playground` |
| `glossary` | Glossary | `#/glossary` |
| `journey` (Learning Journey) | — none — | see Backlog |

The rename `learn → library` and the disposition of `journey` are decisions for
1.3 to execute against this document, logged so they aren't re-litigated.
