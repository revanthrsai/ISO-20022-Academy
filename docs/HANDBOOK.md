# ISO 20022 Academy — The Handbook

> The single project document. Everything that was previously spread across
> PHILOSOPHY.md, NAVIGATION.md, COMPONENTS.md, DESIGN_TOKENS.css, TEMPLATE.html,
> ACADEMY_BLUEPRINT_PLAN.md, AUTHORING.md and IMPROVEMENTS.txt now lives here,
> curated. The originals are in git history if ever needed.

**Contents**

1. [Vision & Status](#1-vision--status)
2. [Teaching Philosophy](#2-teaching-philosophy)
3. [Information Architecture & Routes](#3-information-architecture--routes)
4. [Design System](#4-design-system)
5. [Code Map](#5-code-map)
6. [Authoring & Publishing Articles](#6-authoring--publishing-articles) ← day-to-day guide
7. [Content Roadmap (SME Review)](#7-content-roadmap-sme-review)
8. [Working Agreements](#8-working-agreements)

---

## 1. Vision & Status

ISO Academy is a premium educational platform dedicated exclusively to ISO 20022.
The goal is not the largest financial knowledge base — it is **the best place on
the internet to understand, explore, and experiment with ISO 20022**.

Every feature answers one of four questions:

| Question | Section | Route |
|---|---|---|
| Why does ISO 20022 exist? | **History** | `#/history` |
| How does it work? | **Library** | `#/library` |
| Can I work with it? | **Playground** | `#/playground` |
| What does this term mean? | **Glossary** | `#/glossary` |

**Status (2026-07):** all five build phases complete and signed off — Foundation
(2026-06-28), History (06-28), Library (06-29), Playground (06-30), Glossary
(07-01) — plus backlog burn-down and the Phase 7 quality pass. The site is live
on Netlify with Decap CMS at `/admin`; the Library registry is generated from
content frontmatter on every deploy (see §6).

**Design principles:** simplicity over feature count · learning before
implementation · consistency over novelty · typography before decoration ·
motion with purpose · quality over quantity.

**Long-term direction:** evolve gradually; expand only after the existing
experience reaches production quality; avoid feature creep. The objective is to
be the definitive ISO 20022 learning platform, not a general financial
education site.

---

## 2. Teaching Philosophy

> **The one law everything else obeys:**
> **Every lesson must begin with a human question, not a technical concept.**

If a lesson and this section disagree, the lesson is wrong.

### The promise

> **You will never be shown a tag before you've been shown the human problem it
> solves.** XML is the *last* thing a learner meets in any lesson, never the
> first. Syntax is a costume the meaning wears.

### What a learner should feel — in this order

1. **Curiosity** — every lesson opens with a question they actually want answered.
2. **Recognition** — "that's a problem I've sort of felt myself."
3. **Competence** — "I get it now, and I could explain it to someone else."

What a learner must **never** feel: overwhelmed. Confusion is not rigor. Every
cryptic tag or acronym is a tax on attention — spend that budget only on real
understanding.

### Voice

- **Cinematic and real** — stories about real money in motion, never "the standard specifies that…"
- **Second-person and present** — the learner is inside the moment.
- **Plain before precise** — "the receiving bank — the **Creditor Agent** —", never the reverse.
- **Confident, not academic** — short sentences, concrete nouns.
- **Real over invented** — real stakes (a payroll run, a stuck wire), no recurring fictional cast, no emoji, no jokes.

> **The voice test:** read any paragraph aloud. If it sounds like documentation,
> it's wrong. If it sounds like a good engineer walking a colleague through
> something genuinely interesting, it's right.

### The Lesson Spine — the fixed nine-beat order

Every unit of knowledge is taught in this order. Never reorder; never let a
later beat leak into an earlier one (no tags in beat 1, no XML before beat 7).

| # | Beat | What it must do |
|---|------|-----------------|
| 1 | **The Human Question** | One sentence a non-banker would ask out loud. No tag, acronym, or the words XML/schema/message. |
| 2 | **Who feels this** | The role in pain before the solution existed, and what it cost them. |
| 3 | **The Story** | A real, concrete scenario from the Working Set below. |
| 4 | **How the world solved it** | The business process in plain English. Diagrams in business terms, not tags. |
| 5 | **How ISO models it** | Debtor, Creditor, Agent, Amount as *concepts*. Still no tags. |
| 6 | **The message(s)** | Named in business terms first ("the bank-to-bank credit transfer — `pacs.008`"). |
| 7 | **The real XML** | *Only now.* Tags translated inline on first sight. |
| 8 | **What breaks** | A concrete real failure — truncated name trips sanctions, bad UETR. Never hand-wavy. |
| 9 | **You can now…** | One earned skill stated plainly, plus 2–4 links to related ideas. |

**Acceptance test (run on every lesson):** read beat 1 aloud — contains a tag
name, acronym, or XML/schema/message? **Fail.** Any beat before 7 shows raw
XML? **Fail.** A lesson that cannot pass does not ship.

### The Working Set — canon scenarios

Every story draws from five fixed real-world scenarios (they are exactly the
five 500-level Case Studies, so earlier lessons foreshadow the capstones):

| Use case | Signature moment | Messages | Failure variant |
|---|---|---|---|
| **Customer Transfer** | A customer pays her landlord $1,200. One tap, three institutions. | pain.001 → pacs.008 → camt.054 | Malformed account → **Reject** |
| **Payroll** | Five thousand salaries at 6 a.m. on the 1st. One bounces. | Bulk pain.001, pacs.002 | Closed account → **Return** |
| **Cross-border** | A worker sends $400 home across two currencies, three banks, one sanctions filter. | pacs.008, pacs.009 COV, FX | Truncated name → **Reject** |
| **Treasury** | A multinational sweeps every subsidiary account into one pool, nightly. | camt.053/054, liquidity | Wrong subsidiary → **Reversal** |
| **End-to-End Flow** | One payment followed from initiation to reconciliation. | The full chain | Goes missing → **Recall / Investigation** |

Rules: pull from this table first; use real institutional roles and realistic
specifics (never "Company A"); a new scenario is allowed but must be added to
this table immediately; no persistent personalities or storyline.

> **The single sentence to remember:** introduce the real scenario before the
> syntax. A real payment, a real failure, a real institution — the tag comes
> last, if at all.

---

## 3. Information Architecture & Routes

Exactly **four** top-level sections, in question order — the global header never
grows past four items: `History · Library · Playground · Glossary`. The home
route `#/` redirects to `#/history`.

Hash-based routing, with one query-string layer for shareable filter state:

```
#/                              → redirect to #/history
#/history/<chapter-slug>        → a single History chapter
#/library                       → Library landing (shelves index)
#/library/<level>               → a shelf overview (100…600)
#/library/<level>/<topic-slug>  → a single lesson
#/playground/<tool-slug>        → a tool (xml-viewer|transformer|validator|comparator|samples)
#/playground/<tool>?sample=…    → tool deep-linked to a sample message
#/glossary?category=<cat>       → filtered glossary  (also ?q=<query>)
#/glossary/<term-slug>          → a single term (scrolls + highlights the card)
```

**Slug rules:** lowercase, hyphenated, derived from the human title. Levels are
bare numbers.

**Fixed sub-structure:** History has five chapters (`evolution-of-payments`,
`swift-and-mt-messages`, `problems-with-legacy-standards`, `birth-of-iso-20022`,
`global-migration-timeline`). Glossary has five categories (`business-terms`,
`iso-20022-terms`, `message-elements`, `technical-terms`, `acronyms`). The
Library shelves are defined in §6.

---

## 4. Design System

### Tokens — the live source is `assets/css/style.css :root`

Never hard-code a color, radius, shadow, or duration; a new hex in a component
is a bug. Dark emerald is the default theme; `body.light-mode` flips the token
set. Core palette:

```
--bg #060A09 · --bg-deep #040706 · --surface #0C1311 · --surface-alt #111A17 · --surface-hi #16201C
--primary #10B981 · --primary-hover #34D399 · --primary-bright #5EEAD4 · --primary-deep #059669
--text #F4F8F6 · --text-muted #8FA39B · --text-faint #5A6B64 · --border #1B2723 · --border-hi #26352F
--glow rgba(16,185,129,.45) · status: --danger --warning --success --info (semantic only)
fonts: --font-sans Inter · --font-display Plus Jakarta Sans · --font-serif Newsreader · --font-mono JetBrains Mono
```

Surface hierarchy (darkest → lightest): `bg-deep · bg · surface · surface-alt ·
surface-hi` — every panel picks the level above its parent so depth stays legible.

### Component conventions (every component obeys these)

- **Tokens, never literals.**
- **State is a modifier class** (`.active`, `.open`, `.header-scrolled`) toggled by JS — never inline style.
- **Uniform hover physics** — cards lift `--hover-lift` to a `--primary` border; pressables compress to `--press-scale`.
- **No jarring modals** — lean on slide-in panels, grids, transitions.
- **Content carries the voice** — whatever goes in a component must pass the §2 acceptance test; `xml-example` is beat 7 only.
- **Add to the inventory before building a new shared component.**

### Shared component inventory (name → purpose)

- **Shell:** `header` (glass top bar) · `nav` (4 items + one gliding `.nav-indicator`) · `logo` · `theme-toggle` · `main-container`/`content-area` (`#content` mount) · `scroll-rail` · `site-footer`
- **Cards:** `card` (generic) · `family-card` (selectable list, `.active` inverts) · `message-card` (compact tile) · `pillar-card` (icon + count tile) · `participant-card` (role chip) · `glossary-card` (term + accent rule)
- **Content blocks:** `section-title`/`section-description` · `highlight-box` (accent callout) · `hero` (gradient banner, sparingly) · `timeline` · `stats-strip` · `process-map` (business-terms flow strip) · `flow-diagram` (authored as `{{flow:…}}`, see §6) · `tags`/`tag` (static pills) · `xml-example` (beat-7 code well)
- **Reading surface:** `msg-modal` (centered dialog) sharing `.detail-panel-content` with the slide-in `detail-panel` → `detail-header`, `detail-tabs`, `detail-section`, `spotlight-fields` (tag → plain-English rows)
- **Controls:** `btn` · `search-box` · `filter-bar`/`filter-chip` (stateful, `.active` inverts; `tag` is static-only) · `pager` (prev/next reader nav for sequenced chapters/lessons)
- **Grids:** `.grid-2/3/4`, `.pillar-grid`, `.participant-cards`, `.glossary-grid`, `.message-grid`, `.explorer-container` (280px rail + fluid) — all gap `--space-lg`, all collapse on mobile

---

## 5. Code Map

Zero-dependency vanilla HTML/CSS/JS. No frameworks, no build step for the site
itself (the only build-time step is TOC generation).

```
index.html                 page shell + script includes
netlify.toml               deploy config: runs scripts/build-toc.js, redirects
admin/                     Decap CMS (config.yml + entry page) at /admin
content/*.md               Library lessons (frontmatter + Markdown + tokens)
scripts/build-toc.js       generates assets/js/toc.data.js from content/ frontmatter
assets/css/style.css       ALL styling; :root is the design-token source of truth
assets/js/app.js           hash routing, page templates, History chapters
assets/js/toc.js           Library shelf definitions + lookup helpers
assets/js/toc.data.js      GENERATED article registry — never edit by hand
assets/js/markdown.js      lesson engine: frontmatter, marked.js, {{embed}}/{{check}}/{{flow}}
assets/js/flow-diagram.js  beat-4 business-terms flow diagram
assets/js/data.js          glossary terms (87) + Progress store (localStorage)
assets/js/ui.js            glossary rendering, detail panel/modal, theme toggle
assets/js/xml-viewer.js / transformer.js / validator.js / comparator.js / samples.js
                           the five Playground tools (shared message hand-off)
assets/js/motion.js        motion design system (reduced-motion gated)
assets/js/preloader.js     one-time intro animation
```

**The hybrid content model:** `data.js` powers the *interactive* surfaces
(Playground, Message Explorer, Glossary); `content/*.md` + the generated TOC
power *reading*. An article hands off to an interactive surface via
`{{embed:…}}` tokens.

**Architectural rules:** structural data lives only in `data.js` (`DATA`
object); UI state/components in `ui.js`; routing/views in `app.js`; never
hardcode content into UI script or HTML.

---

## 6. Authoring & Publishing Articles

*The day-to-day guide. You write markdown anywhere, paste it into the CMS, and
the article appears on the right shelf automatically.*

### The pipeline

```
write markdown → /admin (Decap CMS) → Drafts → In Review → Ready → Publish
   → commit to content/<num>-<slug>.md on main
   → Netlify deploy runs node scripts/build-toc.js
   → regenerates assets/js/toc.data.js from every file's frontmatter
   → article appears on its shelf. Done.
```

You never touch `toc.js`/`toc.data.js` — frontmatter decides everything.
Working locally: drop the `.md` in `content/`, run `node scripts/build-toc.js`,
refresh.

### The shelves

| Level | Shelf | What belongs |
|---|---|---|
| 100 | Fundamentals | banking concepts, money movement, clearing. No XML. |
| 200 | Architecture | payment systems, gateway, hub, switch, real-time rails |
| 300 | Message Deep Dives | pain, pacs, camt, head families + single-message reads |
| 400 | Exceptions | reject, return, recall, reversal, investigations |
| 500 | Case Studies | end-to-end flows walked message by message |
| 600 | Field Guides | one structured field per read (remittance, address, LEI, UETR…) |

Empty shelves stay hidden until their first article is published.

### The frontmatter

`level` = the shelf; `num` = position on it. That's how the markdown itself
declares where the article sits.

```yaml
---
title: "Remittance Information: The Invoice Inside the Payment"
slug: remittance-information
level: 600
num: 601
summary: "The field that says WHY money moved — and the reason ISO 20022 exists at all."
minutes: 8
updated: 2026-07-02
tags: [remittance, structured data, rmtinf, reconciliation]
related: [301-pacs-008, 303-camt-family]
earnedSkill: "Tell structured from unstructured remittance info."
status: published
---
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Pattern: `Thing: What It Actually Does` |
| `level` | yes | The shelf (table above) |
| `num` | yes | Order within the shelf; falls back to filename prefix |
| `summary` | yes | 1–2 sentences, *tension + promise*, never a definition |
| `minutes` | yes | Word count ÷ 200 |
| `tags` | no | 3–5 lowercase topics, inline `[a, b, c]` only |
| `related` | no | Sibling article ids (filename without `.md`) |
| `earnedSkill` | no | "After this you can …" |
| `status` | no | `published` (default) or `draft` (visible, badged Draft) |
| `updated` | no | `YYYY-MM-DD` |

⚠️ The YAML parser is deliberately tiny: one line per key, inline lists only, no
nesting, no multi-line strings. Quote any value containing a colon.

### The body — markdown + four superpowers

Standard markdown works. Four tokens on top (each alone on its own line, except
`{{link}}`):

```
{{embed:playground|Try it live in the Playground}}          ← hand-off card
{{embed:explorer:PACS.008|Open pacs.008 in the Explorer}}
{{embed:article:301-pacs-008|Read the deep dive}}
{{embed:page:glossary|Look it up in the Glossary}}

…as we saw in {{link:explorer:PACS.008|pacs.008}}, the…     ← inline link

{{flow:Title|Stop ~ caption|-> arrow label|Stop ~ caption}}  ← animated flow diagram

{{check:Question?|Correct answer|Distractor|Distractor}}     ← quiz card (first = correct, auto-shuffled)
```

### House style checklist per article

1. Problem-first cold open — `> **The problem first.**` blockquote, concrete tension. Never open with a definition.
2. One idea per article (800–1,600 words; longer = split it).
3. Story → mechanism → message; XML last (Lesson Spine, §2).
4. One memorable hook phrase, written before the article.
5. Walk one payment through with concrete numbers.
6. End with 1–2 `{{embed:…}}` hand-offs and 1–2 `{{check:…}}` quizzes.

### Draft-with-AI prompt

> Write a ~1,200-word explainer on **[TOPIC]** for payments professionals new to
> ISO 20022. Open with a concrete problem scenario featuring a named person, not
> a definition. Story → mechanism → (only then) message fields. One memorable
> catchphrase. Plain markdown, `##` sections, no images. End with 3 quiz
> questions, each with 1 correct answer + 2 plausible distractors.

Then: paste into the CMS body, convert quizzes to `{{check:…}}`, add embeds,
fill the frontmatter form.

### Publishing steps

1. `/admin` → Library Articles → **New Library Article**.
2. Fill the form (shelf, number = next free slot, title, slug, summary, minutes, tags, earned skill) and paste the body.
3. Save → sits in *Drafts*. Iterate freely; nothing is live.
4. Drag to *Ready* → **Publish** → Netlify deploys (~1 min) → on the shelf.

---

## 7. Content Roadmap (SME Review)

*From a working-payments-architect review (2026-07): the curriculum teaches "how
a payment message works" very well; these gaps cover "how ISO 20022 shows up in
a practitioner's life in 2026." In priority order:*

1. **The migration story** *(highest leverage — the question every learner
   actually has)*. MT→MX coexistence for cross-border ended 22 Nov 2025;
   unstructured postal addresses stop being accepted 22 Nov 2026; MT101/CBPR+
   coexistence ends 14 Nov 2026; MT9xx retire 2027-28 toward camt.052/053/054.
   → Lesson: "The Migration: Why Every Bank Is Doing This Right Now."
2. **Direct debits don't exist in the curriculum.** pain.008 / pacs.003 /
   mandate flow — the payee *pulls*. → A 300-family lesson + a 500 case study
   ("Subscription Billing: When the Payee Pulls the Money").
3. **Reason-code literacy** *(cheapest, highest daily value)*. AC04, AM04,
   RC01, MD07, NARR… → "Reading a Reason Code" reference, cross-linked from all
   five exception lessons.
4. **Why structured beats free text** — the standard's actual value
   proposition: structured remittance, structured addresses (the Nov 2026
   deadline), LEI, purpose codes, charge-bearer DEBT/CRED/SHAR/SLEV. → Perfect
   600 Field Guide material.
5. **Real scheme grounding.** SEPA (SCT/SCT Inst/SDD), TARGET2/T2, CHAPS,
   Fedwire (ISO-native since 2025), FedNow, UPI, PIX, RTP. → "Which scheme am I
   actually using?" mapping lesson.
6. **Compliance/screening touchpoint.** Sanctions/AML in the lifecycle —
   "Why Is My Payment Stuck? The Screening Step Nobody Talks About."
7. **Smaller:** message versioning (pacs.008.001.08 vs .09), CBPR+/HVPS+ usage
   guidelines, MyStandards, business-vs-message component hierarchy (the
   beat-6→7 bridge), batch booking (`BtchBookg`). Fold into existing lessons or
   the glossary.

---

## 8. Working Agreements

- **One session = one scoped task.** Review existing files before writing code;
  if a prompt is ambiguous between designs or architectures, stop and align
  first. No trial-and-error loops — plan complete logic upfront.
- **Only touch the files a task needs.** Mid-task urges go to §7 / a backlog
  note, not into the current change.
- **No frameworks or external dependencies.** Raw CSS variables + vanilla DOM.
  (Runtime CDN exceptions already in place: marked.js, Decap CMS on /admin.)
- **Data in `data.js`, UI state in `ui.js`, routing in `app.js`, articles in
  `content/`.**
- **Every new UI element inherits the established theme tokens** and the §4
  conventions; no jarring modal popups.
- **A lesson ships only if it passes the §2 acceptance test.**
