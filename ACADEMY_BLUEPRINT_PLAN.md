# ISO Academy — Product Roadmap

> **Current Vision**
>
> ISO Academy is a premium educational platform dedicated exclusively to ISO 20022.
>
> Our goal is not to build the largest financial knowledge base.
>
> Our goal is to build the best place on the internet to understand, explore, and experiment with ISO 20022.
>
> Every feature should answer one of four questions:
>
> * **History** → Why does ISO 20022 exist?
> * **Library** → How does it work?
> * **Playground** → Can I work with it?
> * **Glossary** → What does this term mean?

---

# How This Document Is Used

This file is the project's memory across sessions — Claude Design does not remember
previous sessions, so this file is what carries context forward instead.

Rules for any session, for both Revanth and Claude:

* **One session = one numbered Session below** (e.g. "Session 3.2"), never a
  whole Phase. Phases are too big to finish — and verify — in one sitting.
* **Only touch the files listed under that session's "Touches."** If a file
  isn't listed, leave it alone unless the session explicitly requires it.
* **Don't make unscheduled structural or visual changes.** If something
  occurs to you mid-session, add it to the Backlog at the bottom instead of
  acting on it now.
* **At the end of every session:** update the Session Log — status, date,
  what shipped, anything deferred — then commit. A session isn't done until
  the log is updated.
* **If a session is dragging** (several rounds of "no, I meant…"), stop.
  Write a one-paragraph handoff note in the log and start fresh next time
  rather than pushing through a degraded context window.
* **At the end of every session, hand back a bundle of the modified files.**
  After updating the Session Log, package the files that changed (plus this
  plan) as a downloadable bundle so the changes can be moved back into the
  repo as the source of truth.

A typical session kickoff looks like:

> "Read ACADEMY_BLUEPRINT_PLAN.md. Run Session 3.2 exactly as scoped. Only
> touch the files listed for it."

---

# Current Status

The project is currently undergoing a complete product redesign.

Phase 1 (Product Foundation) is **complete and signed off** (Session 1.4, 2026-06-28): philosophy, navigation/IA, design tokens, component inventory, and the shared page shell are all locked, and every planned Phase 2–5 page has been validated against the shell. Next up: Phase 2 — History.

This roadmap replaces the previous implementation plan.

Completed work from earlier iterations may be reused where appropriate, but no previous UI or information architecture should be treated as final.

The priority is to establish a clean, scalable foundation before expanding content.

---

# Phase 1 — Product Foundation (Current)

Status: 🟡 Complete — signed off Session 1.4 (2026-06-28)

Goal:

Define the identity, structure, and user experience of ISO Academy.

Deliverables:

* Finalize product philosophy
* Finalize navigation architecture
* Establish design system
* Define reusable UI components
* Create consistent page templates
* Validate information architecture

Outcome:

A stable foundation that every future feature can build upon.

## Session Plan

### Session 1.1 — Philosophy & Navigation
**Goal:** Lock the four-question framing (History/Library/Playground/Glossary) into a short written philosophy, and finalize top-level nav + URL/route structure.
**Touches:** new `PHILOSOPHY.md`; nav scaffold only — no visual build yet.
**DoD:** Philosophy doc exists; nav structure is written down with routes named, ready for Session 1.3 to implement.
**Note:** this is mostly decision-making and writing — light enough to do in a regular chat instead of Claude Design if you want to save quota for the heavier sessions below.

### Session 1.2 — Design System
**Goal:** Define color/type/spacing/motion tokens and inventory the reusable components (nav, cards, detail panel, buttons, etc.) every future page will share.
**Touches:** design tokens file (CSS variables or equivalent); a component spec doc.
**DoD:** Every token has a value; every component has a name, props, and one example.

### Session 1.3 — Page Templates
**Goal:** Build the shared page shell (header, content area, footer) that History/Library/Playground/Glossary will all extend.
**Touches:** the shell/template file(s); wires in tokens + components from 1.2.
**DoD:** One working template renders with placeholder content; nothing section-specific yet.

### Session 1.4 — IA Validation & Sign-off
**Goal:** Walk every planned page from Phases 2–5 through the Phase 1 template and components. Fix gaps. Close out Phase 1.
**Touches:** whatever 1.2/1.3 produced — patch, don't rebuild.
**DoD:** Phase 1 marked ✅ in Current Status; Session Log updated for 1.1–1.4.

---

# Phase 2 — History

Status: ⏳ Planned

Purpose:

Create a cinematic introduction to ISO 20022.

Focus areas:

* Evolution of Payments
* SWIFT & MT Messages
* Problems with Legacy Standards
* Birth of ISO 20022
* Global Migration Timeline

History is a storytelling experience, not documentation.

## Session Plan

### Session 2.1 — Evolution of Payments + SWIFT & MT Messages
**Goal:** First two chapters, written and rendering on the History page template from Phase 1.
**Touches:** history content + route (path finalized in 1.3).
**DoD:** Both chapters read end-to-end without a tag, acronym, or "XML" in the opening line.

### Session 2.2 — Problems with Legacy Standards + Birth of ISO 20022
**Goal:** Next two chapters — the "what broke, what was invented" pivot of the story.
**Touches:** same as 2.1.
**DoD:** The ISO 20022 origin reads as a consequence of 2.1–2.2's problems, not a standalone fact.

### Session 2.3 — Global Migration Timeline + polish pass
**Goal:** Final chapter, plus whatever motion/transition polish the cinematic framing needs.
**Touches:** same content area; light CSS/motion only here, not earlier.
**DoD:** History reads as one continuous story; Phase 2 marked ✅.

---

# Phase 3 — Library

Status: ⏳ Planned

Purpose:

Build the educational heart of ISO Academy.

Initial architecture:

100 Fundamentals

* What is Money?
* What is a Payment?
* Payment Lifecycle
* Clearing vs Settlement
* Payment Participants

200 Architecture

* Payment Systems
* Payment Gateway
* Payment Hub
* Payment Switch
* Real-Time Payments

300 ISO 20022 Messages

* pain Family
* pacs Family
* camt Family
* head & admi
* Message Lifecycle

400 Exceptions

* Reject
* Return
* Recall
* Reversal
* Investigations

500 Case Studies

* Customer Transfer
* Payroll
* Cross-border Payment
* Treasury
* End-to-End Payment Flow

The Library should scale naturally as new content is created.

## Session Plan

### Session 3.1 — 100 Fundamentals
**Goal:** All five Fundamentals topics, written and indexed.
**Touches:** Library content area + TOC/index entry for level 100.
**DoD:** All five render; each readable with zero finance background.

### Session 3.2 — 200 Architecture
**Goal:** All five Architecture topics.
**Touches:** same content area; TOC entry for level 200.
**DoD:** All five render and cross-link back to relevant 100-level terms.

### Session 3.3 — 300 Messages, part A (pain + pacs)
**Goal:** pain and pacs family write-ups.
**Touches:** Library content area; links out to whatever Explorer/Playground surface already exists for these messages.
**DoD:** Each family page explains purpose + lifecycle before showing a sample message.

### Session 3.4 — 300 Messages, part B (camt + head & admi + Message Lifecycle)
**Goal:** Remaining message families + the lifecycle overview tying 300 together.
**Touches:** same as 3.3.
**DoD:** Level 300 is complete; Message Lifecycle page links to all four families.

### Session 3.5 — 400 Exceptions
**Goal:** Reject, Return, Recall, Reversal, Investigations — all five.
**Touches:** Library content area; TOC entry for level 400.
**DoD:** Each exception type states which message(s) trigger it and what the resolution flow looks like.

### Session 3.6 — 500 Case Studies, part A
**Goal:** First 2–3 case studies (e.g. Customer Transfer, Payroll, Cross-border).
**Touches:** Library content area; TOC entry for level 500.
**DoD:** Each case study walks an end-to-end flow referencing real message types from 300.

### Session 3.7 — 500 Case Studies, part B
**Goal:** Remaining case studies + cross-links across the whole Library.
**Touches:** same as 3.6.
**DoD:** Level 500 complete; Phase 3 marked ✅.

---

# Phase 4 — Playground

Status: ⏳ Planned

Purpose:

Transform learning into experimentation.

Core tools:

* XML Viewer
* Message Transformer
* Schema Validator
* Message Comparator
* Sample Message Library

The Playground should feel like professional software rather than documentation.

## Session Plan

### Session 4.1 — XML Viewer
**Goal:** Standalone viewer — paste/load an ISO 20022 XML message, see it rendered readably (collapsible tree, plain-English labels toggle).
**Touches:** new Playground tool module.
**DoD:** Viewer handles at least one message from each family in 300.

### Session 4.2 — Message Transformer
**Goal:** Format conversion tool (e.g. MT ⇄ MX), live as you edit.
**Touches:** new Playground tool module; may reuse logic from the Viewer.
**DoD:** At least one transformation pair works end-to-end with live updates.

### Session 4.3 — Schema Validator
**Goal:** Standalone validator — checks a pasted/loaded message against real failure modes (bad BIC, truncated fields, missing required elements, etc.).
**Touches:** new Playground tool module.
**DoD:** Validator catches at least 4–5 concrete, named failure modes with clear error messages.

### Session 4.4 — Message Comparator
**Goal:** Side-by-side diff of two messages (e.g. before/after a transformation, or two versions of the same message type).
**Touches:** new Playground tool module.
**DoD:** Diff highlights field-level differences, not just raw text diff.

### Session 4.5 — Sample Message Library
**Goal:** A browsable set of real, valid sample messages per family, loadable directly into the other four tools.
**Touches:** sample data file(s); light UI to browse/select.
**DoD:** At least 2–3 samples per message family, each loadable into Viewer/Transformer/Validator.

### Session 4.6 — Integration & polish
**Goal:** Wire the five tools together (load a sample → view → transform → validate → compare) so Playground feels like one workspace, not five separate pages.
**Touches:** whatever connects the tool modules; no new tools.
**DoD:** A user can move a message through all five tools without re-pasting it; Phase 4 marked ✅.

---

# Phase 5 — Glossary

Status: ⏳ Planned

Purpose:

Provide a fast, searchable reference.

Categories:

* Business Terms
* ISO 20022 Terms
* Message Elements
* Technical Terms
* Acronyms

## Session Plan

### Session 5.1 — Data model + categorization + filter UI
**Goal:** Define the term schema (term, definition, category, related links) and build category filtering + search on top of the Phase 1 template.
**Touches:** glossary data file; glossary page/template.
**DoD:** Filtering and search both work against a handful of seed terms in each category.

### Session 5.2 — Populate terms
**Goal:** Fill out the full term set across all five categories, cross-linking to Library/Playground where relevant.
**Touches:** glossary data file only.
**DoD:** Every category has a meaningful term count; no term is an orphan (each links to at least one related page where applicable). Phase 5 marked ✅.

---

# Design Principles

Every decision should reinforce these principles:

* Simplicity over feature count
* Learning before implementation
* Consistency over novelty
* Typography before decoration
* Motion with purpose
* Quality over quantity

---

# Long-Term Direction

The platform should evolve gradually.

Expand only after the existing experience reaches production quality.

Avoid feature creep.

Protect the clarity of the product.

The objective is not to become a general financial education platform.

The objective is to become the definitive learning platform for ISO 20022.

---

# Backlog

*(Unscheduled ideas or visual/structural urges that came up mid-session —
log them here instead of acting on them. Revisit when planning a future
session, not during the current one.)*

- **Disposition of the current "Learning Journey" page** (`navigate('journey')`).
  ~~The new four-question IA has no fifth top-level section...~~ **Resolved in
  Session 1.3 — disposition (c):** retired from the global nav, kept as a non-nav
  deep route (still reachable from in-page CTAs; `PAGES.journey` / `renderRoadmapView()`
  untouched).
- ~~**Rename `learn → library` in code**~~ **Done in Session 1.3.** The
  `navigate()` key `learn` is now `library` across `index.html`, `app.js`, and
  `markdown.js`. (The internal `learn-root` element id was left as-is — it is
  plumbing, not the route key.)

---

# Session Log

| Session | Status | Date | Shipped / DoD met | Deferred |
|---|---|---|---|---|
| 1.1 Philosophy & Navigation | ✅ Done | 2026-06-28 | `PHILOSOPHY.md` locks the four-question framing + nine-beat Lesson Spine; `NAVIGATION.md` names the four top-level sections, the full `#/…` hash-route scheme, every section's final sub-route slugs, and the current-code → target-route mapping. No visual build (per scope). | `journey` page disposition + `learn → library` rename → Backlog (both for 1.3). |
| 1.2 Design System | ✅ Done | 2026-06-28 | `DESIGN_TOKENS.css` — canonical single-source token set (color incl. light theme, type scale, spacing, radius, elevation, glass, icon, motion); every token has a value. `COMPONENTS.md` — shared component inventory (shell/nav, 6 card variants, content blocks, reading surface, controls, layout grids); each has name, props, and one example. Both extracted from the live `assets/css/style.css` so spec and code agree. | None new. (Nav `learn → library` rename + `journey` disposition already in Backlog for 1.3; documented in `COMPONENTS.md` §1, not acted on.) |
| 1.3 Page Templates | ✅ Done | 2026-06-28 | Shared page shell now has all three regions: `TEMPLATE.html` (new) is the standalone shell — header + content-area + **footer** — rendering generic placeholder content built from 1.2 tokens + components (no section-specific content). Live shell wired to match: new `site-footer` (markup in `index.html`, styles appended to `assets/css/style.css`, spec added to `COMPONENTS.md` §1). Both Backlog items executed: `learn → library` renamed across `index.html`, `app.js`, `markdown.js`; "Learning Journey" retired from global nav — `journey` kept as a non-nav deep route (disposition c). | `learn-root` DOM id left unchanged (internal plumbing, not the route key). |
| 1.4 IA Validation & Sign-off | ✅ Done | 2026-06-28 | Walked every planned Phase 2–5 page through the Phase 1 shell (`TEMPLATE.html`) + component inventory. Result: all pages render through the shell. Two shared controls were missing and patched in (no rebuild): **`pager`** (sequential prev/next — History chapters read in order, Library lesson sequence) and **`filter-bar`/`filter-chip`** (Glossary `?category=` filter; reusable as Library level filter). Each added in three places — `assets/css/style.css`, `COMPONENTS.md` §5, and demoed in `TEMPLATE.html`. New §7 in `COMPONENTS.md` records the full coverage matrix + gap decisions. No tokens added (both resolve from existing `DESIGN_TOKENS.css`). Playground tool interiors confirmed **page-owned** (Phase 4), same status as History's scrub-timeline. **Phase 1 marked ✅** in Current Status. | None. |
| 2.1 Evolution of Payments + SWIFT/MT | ⏳ Not started | | | |
| 2.2 Legacy Problems + Birth of ISO | ⏳ Not started | | | |
| 2.3 Migration Timeline + polish | ⏳ Not started | | | |
| 3.1 100 Fundamentals | ⏳ Not started | | | |
| 3.2 200 Architecture | ⏳ Not started | | | |
| 3.3 300 Messages (pain + pacs) | ⏳ Not started | | | |
| 3.4 300 Messages (camt + head&admi) | ⏳ Not started | | | |
| 3.5 400 Exceptions | ⏳ Not started | | | |
| 3.6 500 Case Studies (A) | ⏳ Not started | | | |
| 3.7 500 Case Studies (B) | ⏳ Not started | | | |
| 4.1 XML Viewer | ⏳ Not started | | | |
| 4.2 Message Transformer | ⏳ Not started | | | |
| 4.3 Schema Validator | ⏳ Not started | | | |
| 4.4 Message Comparator | ⏳ Not started | | | |
| 4.5 Sample Message Library | ⏳ Not started | | | |
| 4.6 Integration & polish | ⏳ Not started | | | |
| 5.1 Data model + filter UI | ⏳ Not started | | | |
| 5.2 Populate terms | ⏳ Not started | | | |