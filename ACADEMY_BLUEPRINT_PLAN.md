# ISO 20022 Academy — Knowledge-Base Transformation Plan

> **Core philosophy (non-negotiable):**
> **Every lesson must begin with a human question, not a technical concept.**
>
> XML is the *last* thing a learner meets, never the first. We teach *why money
> moves* before *how a message is written*. The academy is a story a person
> lives through, not documentation they read.

This is the master execution plan. It is built to be run **one phase per
session** (you mentioned per-session limits). Each phase below is
self-contained: it states its goal, the source material it draws from, the exact
files it touches, and a "Definition of Done" so any session can pick up cleanly.

---

## Progress tracker

- ✅ **Phase 0** — Freeze rule acknowledged.
- ✅ **Phase 1** — `PHILOSOPHY.md` written (5 answers + 9-beat Lesson Spine + acceptance test + Bob & Sweety canon).
- ✅ **Phase 2** — `assets/js/knowledge-nodes.js` created: node schema + IA layers + helpers + **Foundations** and **Payments** fully built and passing the self-check. Additive, nothing rendered yet — app runs unchanged.
- ✅ **Phase 3** — Foundations renders **semantic-first**. `ui.js` gains `renderKnowledgeLesson()` (strict 9-beat order, XML only at beat 7), gated by `KNOWLEDGE_LESSON_IDS` (currently `['foundations']`); `loadLessonModule()` branches to it; `index.html` loads `knowledge-nodes.js`. Reuses existing CSS only — no new styles. Verified: beat order correct, XML after the semantic model.
- ✅ **Phase 4** — History rebuilt as **seven human stories** (Trust → Trade → Money → Communication → Banking → SWIFT → ISO) in `app.js`'s scrub timeline. Each entry = a human question → what broke → what was invented (invention in bold). Pin shows thematic words, not years; intro retuned ("Five thousand years, one problem"); no section leads with a bare year. One small CSS fit: pin-year size trimmed (`style.css`) so word tokens fit the column. Verified via DOM.
- ✅ **Phase 5** — Business Catalogue: all five domains (Payments, FX, Cards, Securities, Trade) authored as 9-beat knowledge nodes and enabled via the knowledge path; `relatedNodes` cross-linked across the journey. `KNOWLEDGE_LESSON_IDS` now holds all six chapters. Verified: each renders question-first with XML after the semantic model; "Where This Connects" resolves to real node titles.
- ✅ **Phase 6** — Message Explorer: every message in `DATA.messages` enriched with a Lesson-Spine `node` (story → why → who creates/receives → business process & flow → business components → message components → XML → validation → what breaks → interview questions → related messages). `ui.js` detail panel rebuilt as `renderMessageNode()` — concept-before-payload, XML never first, every message has ≥1 "what breaks" and ≥1 interview question. Explorer is now reachable: beat-6 message rows in the journey (and message spotlights) open the panel; related-message tags cross-navigate. Reuses existing detail/spotlight/lesson CSS — no new styles.
- ✅ **Phase 7** — Knowledge graph closed + 5 gap nodes built. `knowledge-nodes.js` gains **The Three Layers (metamodel)**, **Regional Dialects (networks)**, **Routing & Cover Payments (physics)**, **Tracking Identifiers (physics: MsgId vs EndToEndId vs UETR)**, and **The Envelope & Extensions (payload: head.001 + SplmtryData)** — each a full 9-beat node, beat-1 human-question test passing. Existing chapters cross-link into them (Payments → identifiers/routing/networks). `ui.js`: related-idea links are now **clickable** ("You'll want to understand…" opens the node; "Look up" chips jump to the filtered glossary), gap nodes render via `openKnowledgeNode()` with their IA-layer label (no journey module needed), and a **"Go Deeper" rail** on the roadmap surfaces all five layers so they're reachable, not buried. Glossary gained UETR, HVPS+, Cover Payment, Business Application Header, Data Dictionary, Structured Address so every link resolves — no dead ends. **Plus (user request):** the Message Explorer now opens as an **Outlook-style popup** (centered reading window over a blurred backdrop, Esc / click-out to close) instead of the side panel.
- ✅ **Phase 8** — Plain-English pass across the content built in 3–7. The two house-style analogies are now in canon: the **Lego box** (shared studs → a payments block snaps into a securities/trade message) in Foundations, and the **smart passport** (each fact in its own labelled box instead of one cramped line that trips screening on a word like "LONDON") in Payments. Acronyms are unpacked on first use throughout — pain/pacs/camt expanded to payment-initiation / clearing-&-settlement / cash-management, plus MT↔MX, RTGS, UUID/RFC 4122, BIC, MT101/MT940/MT564, KYC. Content-only edits in `knowledge-nodes.js` + `data.js`; no structural or CSS change. DoD: Foundations + Payments are now completable with zero finance background.
- ✅ **Phase 9** — Named-human stories layered in. Each of the six chapters now ends its story beat with an explicit **"Congratulations — you just learned…"** payoff that names retroactively the ISO roles the Bob & Sweety scene just dramatized (Payments → Debtor / Debtor Agent / Clearing System / Creditor Agent / Creditor / Settlement; FX → counterparties / settlement agent / currency pair / PvP; Cards → cardholder / merchant / acquirer / issuer; Trade → applicant / beneficiary / issuing & advising bank / letter of credit; Securities → investor / broker / depository / custodian). New `story.rolesLearned` field in `knowledge-nodes.js`, rendered as a structured term→who reveal in `ui.js` (reuses existing lesson + spotlight classes — no new CSS). DoD: every domain tells the story first, then names the vocabulary it taught.
- ✅ **Phase 10** — Design freeze lifted (final). The **Playground** is now live: a real MT103 → pacs.008 transformer (`assets/js/playground.js`, `Playground` module; `initPlayground()` runs on navigation). **Slice A** — the canonical Bob → Sweety payment is an editable MT103 (8 SWIFT fields) on the left; the pacs.008 rebuilds **live** on the right on every keystroke, field by field; a **Plain English ⇄ XML** toggle renders the logical tree (every cryptic tag swapped for its human name from a `PLAIN` dictionary); hovering/focusing a source field lights up exactly where it lands in the XML *and* in the validator (shared `data-from` keys). **Slice B** — a live validator runs the concrete failure modes the message lessons teach (placeholder/over-length EndToEndId, malformed BIC, bad amount/currency, missing UTC offset, invalid UETR variant bits) and an MT-truncation **warning** (>35-char name); **"What breaks" injectors** trigger each fault (truncate name, placeholder reference, drop timezone, corrupt UETR) and reset to Bob → Sweety. New CSS section **14b** in `style.css` (the freeze is lifted, so new layout is allowed); reuses existing tokens/glass/mono. The old static "In development" preview page is replaced. Slice C (multi-party cover-payment routing visualizer, schema-repair exercises) is flagged as "Coming next" on the page and left for a future session. DoD: the Playground is interactive end-to-end, teaches MT→MX losslessly, and catches real validation failures in real time.

- ✅ **Phase 11 — Markdown content architecture** (post-blueprint refactor). The academy gains a scalable, Markdown-driven **Library** for long-form articles, on a **hybrid** model: `data.js` / `knowledge-nodes.js` stay the source for the *interactive* surfaces (Playground, Message Explorer, Journey, Glossary); Markdown is the source for *reading*. New pieces: `content/*.md` (articles with **YAML frontmatter**: title, level, summary, minutes, tags, related, earnedSkill); `assets/js/toc.js` (the table-of-contents registry + the university-style level map — **100** Fundamentals / **200** Architecture / **300** Message Deep Dives / **400** Exceptions); `assets/js/markdown.js` (`Articles` module — frontmatter splitter, **marked.js** via CDN with a tiny offline fallback, `{{embed:…}}` / `{{link:…}}` tokens that hand off to interactive surfaces, plus the grouped index + single-article renderers); a **Library** nav item and `learn` route in `index.html` / `app.js`; CSS **§15 ARTICLES** (Newsreader-serif reader, problem-first blockquote callout, embed cards, level/index grid — all on existing theme tokens). Seed content: two full articles (`101-nostro-vostro`, `301-pacs-008`) written problem-first, plus four stubs (`102`, `201`, `302`, `401`) so every level is represented. The `301` article embeds live hand-offs to the Playground and the `PACS.008` Explorer node. DoD: a new article is "drop a `.md` + one `toc.js` entry"; nothing in the interactive app was removed. *(Note: client-side `fetch` of `.md` requires the site be served over HTTP — GitHub Pages or any static server — not opened from `file://`.)*

> **To commit Phase 2:** add `<script src="assets/js/knowledge-nodes.js"></script>`
> to `index.html` after `data.js` and before `ui.js`. (Optional until Phase 3 —
> the file is inert until something renders it.)

---

## 0. How to use this document

- **Sources** (already extracted to plain text in `uploads/` so we never re-parse `.docx`):
  - `uploads/_x_Financial_Communication_History_Research.txt` → **History** rebuild (Phase 4)
  - `uploads/_x_ISO_20022_Business_Domains_Guide.txt` → **Business Catalogue + Message Explorer** (Phases 5–6)
  - `uploads/_x_ISO_20022_Technical_Handbook.txt` → **Foundations / metamodel / Playground** (Phases 3, 6, 8)
  - `uploads/_x_Refined_Research_Plan_for_ISO_20022_Academy_Blueprint.txt` → **pedagogy, sandbox, IA, roadmap** (cross-cutting)
  - `learning-journey-redesign.md` (in repo) → the Bob & Sweety journey concept (already partly built)
- **Live code** lives in the GitHub repo `revanthrsai/iso-premium-v2`:
  - `index.html` — shell, header/nav, content + detail-panel containers
  - `assets/js/data.js` — message catalog, `pillars`, `glossary`, `learningJourney`, `ProgressEngine`
  - `assets/js/app.js` — routing + page templates
  - `assets/js/ui.js` — detail panel, explorer/glossary/journey rendering, theme
  - `assets/js/motion.js` / `preloader.js` — animation only
  - `assets/css/style.css` — all styling + theme tokens
- **Golden rule for every phase:** content changes flow into `data.js` first
  (structured knowledge), then `app.js`/`ui.js` render it, then `style.css` only
  if a genuinely new layout is needed. **Never** start a phase in CSS.

---

## Phase 0 — Freeze the design (the discipline)

**Goal:** Stop touching visuals. The V1 look is already good; the problem is
*pedagogy*, not pixels. Both the Google review and your ChatGPT roadmap open with
this, and they are right: polishing now is how we lost the learner last time.

**Rules for every phase after this, until Phase 10:**
- No new colors, fonts, animations, or "premium" passes.
- Reuse existing components (story prose blocks, process maps, who's-involved
  cards, detail panel, glossary list). We feed them better *content*, not
  prettier *chrome*.
- If something *must* change visually to hold new content, note it in a
  "Deferred polish" list at the bottom of this file — don't do it now.

**Definition of Done:** This rule is acknowledged and a "Deferred polish"
backlog section exists at the end of this file.

---

## Phase 1 — Write the Academy philosophy (the constitution)

**Goal:** Before any content, commit the teaching contract in writing so every
later lesson is measured against it. This is the single source of voice + structure.

**Deliverable — a new file `PHILOSOPHY.md`** answering, in plain prose:
1. **Why we teach ISO 20022** — not "to pass a migration deadline" but "to let a
   person understand how trust and value move across the world."
2. **What a learner should *feel*** — curiosity first, competence second,
   never overwhelm. (Maps to the report's Cognitive Load Theory: minimize
   *extraneous* load from cryptic tags; spend the learner's attention on
   *germane* load — real understanding.)
3. **The promise** — "You will never be shown a tag before you've been shown the
   human problem it solves."
4. **Voice** — cinematic, second-person, the tone the History page already nails.
   The Learning Journey must read like *the next scene of the same film*.
5. **What makes us different from documentation** — docs answer "what is the
   field"; we answer "why does this field exist, and who got hurt before it did."

**The canonical Lesson Spine (define it here, reuse it everywhere).** Every
concept node in the academy — a domain, a message, a term — is taught in this
fixed order. This *is* the core philosophy made concrete:

| # | Beat | What it does | Source pattern |
|---|------|--------------|----------------|
| 1 | **The Human Question** | One sentence a non-banker would actually ask. *"How do I know the money I sent really arrived?"* | Your core law |
| 2 | **Who feels this** | The person/role in pain before the solution existed | Business Domains "Pain Points" |
| 3 | **The Story** | A concrete named human (Rahul buys a laptop / Bob pays Sweety) living the problem | ChatGPT Phase 9; redesign md |
| 4 | **How the world solved it** | The business process + participants, in plain English | Business Domains "Workflows / Participants" |
| 5 | **How ISO *models* it** | Semantic roles (Debtor, Creditor, Agent) — concepts, not tags | Technical Handbook "Party/Agent/Address" |
| 6 | **The message(s)** | Which message carries this, named in business terms | Business Domains "Business Catalogue" |
| 7 | **The real XML** | *Only now* — the serialization, shown as "one way to write" beat 5 | Blueprint "semantic-first progression" |
| 8 | **What breaks** | Common errors / validation (truncation, bad UETR, missing codeword) | Blueprint Ch.3; History "compliance crisis" |
| 9 | **You can now…** | One concrete earned skill + links to related nodes | redesign md "unlocked skill" |

> **Acceptance test for any future lesson:** read beat 1 aloud. If it contains
> a tag name, an acronym, or the word "XML/schema/message," it fails. Rewrite
> until a curious 15-year-old would ask it.

**Definition of Done:** `PHILOSOPHY.md` exists with the 5 answers + the 9-beat
Lesson Spine table + the acceptance test. Nothing in the code yet.

---

## Phase 2 — Design the Knowledge Architecture (nodes, not pages)

**Goal:** Restructure `data.js` from "lists of messages" into a **graph of
knowledge nodes**, each shaped like the Lesson Spine. This is the highest-leverage
structural change and everything downstream renders from it.

**The Information Architecture** (from the Google review's 7-layer model — it
descends from human trust to technical rules, which is exactly our philosophy):

```
1. THE CONCEPT    Why money moves — value, trust, clearing
2. THE DICTIONARY Syntax-independent semantics (Debtor, Creditor, Agent, Amount)
3. THE TAXONOMY   Domain families (pain, pacs, camt, sese, …)
4. THE NETWORKS   Regional dialects (CBPR+, TARGET2, FedNow, CHAPS)
5. THE PHYSICS    Routing, hops, cover payments, UETR tracking
6. THE PAYLOAD    The envelope — Business Application Header (head.001)
7. THE RULES      Validation, character sets, structured address
```

**Work in this phase (data only, no rendering yet):**
- Define a single node schema in `data.js`, e.g. `knowledgeNodes = { … }` where
  each node has: `id`, `humanQuestion`, `whoFeelsIt`, `story`, `worldProcess`,
  `semanticModel`, `messages[]`, `xml`, `breaks[]`, `earnedSkill`,
  `relatedNodes[]`, `glossaryTerms[]`.
- Map the **existing** `pillars` and `learningJourney` entries onto this schema
  (they already carry `what/why/who/how/story/unlockedSkill` — we're renaming and
  reshaping, not inventing from scratch).
- Add `relatedNodes` links so the graph connects (Phase 7 surfaces them).
- **Do not delete** `DATA.messages` — it stays as the physical reference layer
  (beat 7). Nodes *link into* it by `code`, exactly as `messageCodes` does today.

**Definition of Done:** `data.js` has a `knowledgeNodes` structure populated for
at least Foundations + Payments, validated against the Lesson Spine, with no
rendering changes. App still runs unchanged.

---

## Phase 3 — Rewrite Foundations (semantic-first)

**Goal:** Fix "The Syntax Trap" the Google review calls out — today Foundations
shows `<Dbtr>`/`<Cdtr>` before teaching the syntax-independent Data Dictionary.

**Content (from Technical Handbook + History report), taught as a story:**
- Open with humanity, not ISO: *Why humans invented value → why trust matters →
  why banks exist → why messages exist → why standards exist → why ISO exists.*
  (ChatGPT Phase 3.) The History report's "Birth of Value" section (clay tokens →
  literal contract → double-entry → bills of exchange) is the raw material — it is
  *already* a story about trust, not technology.
- Then, and only then, the **Data Dictionary** idea: a word like `DebtorAgent`
  means the same thing everywhere, *before* it is ever written as a tag.
- Introduce the **three-layer model** as the academy's mental backbone:
  **Conceptual (what it means) → Logical (how it's structured) → Physical (how
  it's written).** Frame XML as just the *physical* skin over a meaning.

**Files:** `data.js` (Foundations node prose), `app.js`/`ui.js` (render the new
ordering — semantic blocks before the spotlight XML), no new CSS.

**Definition of Done:** A learner reaching the first XML block in Foundations has
already been taught the concept of a debtor/creditor *as a role*, and understands
XML is one serialization of a meaning. Beat-1 acceptance test passes.

---

## Phase 4 — Rebuild History as story, not dates

**Goal:** Replace the timeline-of-years with a **chain of human problems**. People
remember stories, not 1977/2004/2025.

**New spine (from the History report — it is structured exactly this way):**
```
The History of Trust       (clay tokens, bullae, Code of Hammurabi)
   ↓
The History of Trade       (Roman literal contract — debt without moving coin)
   ↓
The History of Money       (double-entry bookkeeping, goldsmith notes)
   ↓
The History of Communication (telegraph → Telex → its insecurity)
   ↓
The History of Banking     (Fedwire, ACH, Herstatt risk → RTGS, CLS)
   ↓
The History of SWIFT       (MT messages, the 35-char truncation crisis)
   ↓
The History of ISO         (FATF Rec.16, the compliance crisis, the 3-layer fix)
```
Each link uses the **same Lesson Spine**: the human question → who hurt → what
broke → what was invented. Every era in the report explicitly states the
"Business Problem Solved" — that becomes beat 1/2.

**Anchor facts to keep accurate** (from the report's timeline): 1974 Herstatt
settlement risk → RTGS; 1977 SWIFT MT launch; 2004 ISO 20022; Mar 2023 CBPR+
coexistence start; **Nov 2025 coexistence end** (MT103/MT202 retired); **Nov 2026
structured-address mandate**; Jul 2025 Fedwire big-bang.

**Files:** `data.js` (history node content), `app.js`/`ui.js` (history page render),
no new CSS — reuse existing history components the user already validated.

**Definition of Done:** History reads as seven cause-and-effect stories; no
section leads with a bare year; the MT→MX "why" is felt, not listed.

---

## Phase 5 — Rebuild the Business Catalogue (uniform flow per domain)

**Goal:** The biggest job. Every one of the five domains follows the **identical
Lesson Spine** so the learner internalizes a reusable mental model. XML is almost
last in each.

**Source:** `_x_ISO_20022_Business_Domains_Guide.txt` is a turnkey script — it
already provides, per domain: history, business purpose, **pain points**,
**participants** (role table), **message hierarchy/catalogue**, and a **visual
process map**. Map those directly onto beats 2/4/5/6.

**The five domains + their human questions (beat 1 drafts):**
| Domain | Namespaces | Human question (beat 1) | Hero message(s) |
|---|---|---|---|
| Payments & Cash Mgmt | pain, pacs, camt, remt | *"I tapped send — where does my money actually go before it arrives?"* | pain.001, pacs.008, camt.054/053 |
| Securities | sese, semt, seev, colr | *"I bought one share — who makes sure it's really mine?"* | sese.023, seev.031/033 |
| Trade Services | tsrv, tsmt | *"Two strangers across an ocean — how does either trust the other to pay/ship?"* | tsrv.001, tsrv.013 |
| Cards | caaa, cain, catp, catm | *"I tapped my card — how did four companies agree in under a second?"* | caaa.001, cain.001 |
| Foreign Exchange | fxtr | *"My dirhams became her rupees — who guarantees the rate didn't vanish?"* | fxtr.014 |

**Per-domain build order (repeat 5×):** human question → who feels the pain (use
the report's "Pain Points") → story → participants table → process map (the
report's ASCII flows convert straight to the existing process-map component) →
how ISO models it → messages → real XML → what breaks → earned skill + related links.

**Files:** `data.js` (extend each domain node), `app.js`/`ui.js` (render). The
existing `pillars` already cover Payments/Securities/Cards/Trade/FX skeletally —
we deepen them with the report's real content.

**Definition of Done:** All five domains taught with one identical, repeatable
flow; XML appears only after the business story in each; each ends with a
concrete earned skill.

---

## Phase 6 — Rebuild the Message Explorer (concept before payload)

**Goal:** Today: `pacs.008 → XML`. Tomorrow each message is a full Lesson-Spine
node, XML near the end.

**New message-node order (from your ChatGPT Phase 6 + Blueprint progression):**
```
Business story → why this message exists → who creates it → who receives it →
business process → visual flow → business components → message components →
XML → validation → common errors → interview questions → related messages
```

**Content fuel:**
- Beat 4/5/6 (process, components): Business Domains Guide message tables +
  Technical Handbook "Message Definitions and Building Blocks", "Party/Agent/Address".
- Beat 8 (validation/errors): Blueprint Ch.3 — the concrete failure modes are
  gold: invalid UETR variant bits, `EndToEndId` placeholder "NOT PROVIDED",
  missing TARGET2 `RTGS` codeword, name+address present when BIC given, timezone
  offset omitted. These make "what breaks" *specific*, not hand-wavy.
- **Interview questions** per message (a differentiator for payments-domain job
  seekers — your audience). e.g. *"What's the difference between MsgId,
  EndToEndId, and UETR?"* (point-to-point vs end-to-end vs global tracking).

**Files:** `data.js` (enrich each entry in `DATA.messages` with the node beats —
they currently only have purpose/fields/example), `ui.js` (the detail-panel
render — `loadLessonModule`/detail-panel functions).

**Definition of Done:** Opening any message in the explorer tells its human story
and business role *before* its XML; every message has ≥1 "what breaks" and ≥1
interview question.

---

## Phase 7 — Build the knowledge graph (links through ideas, not menus)

**Goal:** Make it addictive. Every node links to related concepts so a learner
follows curiosity, not navigation. "Through ideas, not through menus."

**Work:** Use the `relatedNodes` / `glossaryTerms` fields seeded in Phase 2.
Render inline "you'll want to understand…" links at the end of each node:
History ↔ Glossary ↔ Business Process ↔ Components ↔ Messages ↔ Playground ↔
Domains ↔ Case Studies. Cross-link the obvious chains, e.g. Payments node →
`pacs.008` message → UETR glossary term → "The Physics: routing & cover
payments" → `pacs.009 COV`.

**Also in this phase — close the 5 knowledge gaps the Google review flags** (these
are net-new nodes, sourced from the Blueprint):
1. **The Metamodel** (Conceptual/Logical/Physical, EMOF/UML) — a "Dictionary" node.
2. **Regional dialects** (CBPR+, HVPS+, TARGET2, FedNow, CHAPS) — a "Networks" node.
3. **Routing & cover payments** (`pacs.009 COV`, serial vs cover leg) — a "Physics" node.
4. **Technical identifiers** (UETR UUIDv4 structure, MsgId vs EndToEndId, Block 3) — a "Physics" node.
5. **Schema extensions** (`<SplmtryData>`, Business Application Header `head.001`) — a "Payload" node.

**Files:** `data.js` (relations + 5 new nodes), `ui.js` (inline related-links
renderer), `app.js` (routing to the new nodes). Reuse existing card components.

**Definition of Done:** Every node ends with 2–4 idea links; the 5 gap nodes
exist and are reachable; no dead-ends (every locked/future item still shows a
one-line hook, per the redesign md).

---

## Phase 8 — Rewrite everything in plain English

**Goal:** The "explain it to my younger brother" pass across all content written
in Phases 3–7. Possibly the most important phase.

**Method:**
- Run every node's beats 1–4 through the test: *would a non-banker understand
  this with zero glossary lookups?* If not, add an analogy.
- Use the report's two ready-made analogies as house style:
  - **Smart Passport** — MT crams everything on one line and screening flags
    "LONDON"; ISO gives every fact its own labeled box. (For structured data /
    address mandate.)
  - **Lego blocks** — standardized connectors let a payments block snap to a
    securities block. (For reusable components / the dictionary.)
- Keep cryptic tags translated inline the first time (`CdtrAgt` → "Creditor Agent
  = the receiving bank"). This directly lowers the report's *extraneous cognitive
  load*.

**Files:** content edits across `data.js`; no structural change.

**Definition of Done:** A reader with no finance background can complete
Foundations + Payments without getting stuck. Every acronym is unpacked on first use.

---

## Phase 9 — Add the stories (experience, don't memorize)

**Goal:** Layer the named-human narratives so learners *experience* roles instead
of memorizing definitions. The redesign md already establishes **Bob & Sweety**
("Follow the Money") as the through-line — extend that, don't replace it.

**Pattern (ChatGPT Phase 9):** tell the story first, *then* reveal that the
learner just learned the vocabulary:
> *Rahul buys a laptop. His bank sends money. The seller waits. Another bank
> receives. Settlement happens. The seller ships.*
> **→ "Congratulations — you just learned Debtor, Creditor, Debtor Agent,
> Creditor Agent, and Settlement."**

**Threads to weave (already scaffolded in `learningJourney`):**
- Payments: Bob sends Sweety $400 (pacs.008, camt.054).
- FX: Bob's AED → Sweety's INR (fxtr).
- Cards: Sweety taps at the pharmacy (caaa.001).
- Trade: where Bob's salary came from — a letter of credit (tsrv.001).
- Securities: Sweety invests the remainder (seev.001 dividend).

**Files:** `data.js` story fields; reuse the journey rendering already built.

**Definition of Done:** Each domain has a named-human story that *precedes* its
vocabulary, and a "you just learned…" payoff that names the roles retroactively.

---

## Phase 10 — *Only now* improve the UI

**Goal:** With every page, story, term, domain, message, and analogy in place, we
finally know *what deserves animation*. Pull from the "Deferred polish" backlog
and the redesign md's motion ideas (route-line pulse, scroll-linked reveal,
chapter-completion transition, mastery ring).

**Candidate enhancements (decide with real content in front of us):**
- The "Follow the Money" route-line journey map (redesign md §5/§8).
- Split-pane Playground: XML editor + live logical tree that translates tags to
  plain labels + inline validation (Blueprint Ch.5 wireframe).
- Multi-party routing visualizer for cover payments (Blueprint Ch.5).
- Progress as narrative milestones, not percentages.

**Definition of Done:** Animation/polish is added *only* where content earns it;
nothing decorative blocks comprehension.

---

## Cross-cutting: the Playground (sandbox) — staged, not big-bang

The Blueprint's sandbox is ambitious. Build it in slices aligned to the phases
above rather than all at once:
- **Slice A (Phase 10 — ✅ done):** editable MT103 → live pacs.008 transform with
  a logical tree view that renames every tag to plain English (toggle) and a
  hover-link that maps each source field to where it lands in the XML.
- **Slice B (Phase 10 — ✅ done):** live validation for the concrete failure modes
  (placeholder/over-length EndToEndId, bad BIC, amount/currency, missing UTC
  offset, UETR variant bits) plus the MT 35-char truncation warning, with
  "what breaks" fault injectors.
- **Slice C (future):** routing/cover-payment visualizer; "Schema Repair"
  broken-payload exercises; minimal/maximal/idempotency test profiles. Flagged
  "Coming next" on the Playground page.

---

## Sequencing summary (one phase ≈ one session)

| Phase | Output | Touches | Source |
|---|---|---|---|
| 0 | Freeze rule + backlog | this file | both reviews |
| 1 | `PHILOSOPHY.md` + Lesson Spine | new file | core law |
| 2 | `knowledgeNodes` schema | data.js | Blueprint IA |
| 3 | Foundations semantic-first | data/app/ui | Handbook + History |
| 4 | History as story | data/app/ui | History report |
| 5 | 5 domains, uniform flow | data/app/ui | Domains guide |
| 6 | Message Explorer nodes | data/ui | Domains + Handbook + Blueprint |
| 7 | Knowledge graph + 5 gap nodes | data/app/ui | Blueprint |
| 8 | Plain-English pass | data | Domains analogies |
| 9 | Named-human stories | data | redesign md |
| 10 | UI/animation | css/ui/motion | redesign md + Blueprint |

**Order rationale:** content + structure (1–9) before any polish (10) — because,
as both reviews insist and as we learned last time, polishing before the learner
is served is how we lost the learner.

---

## Deferred polish backlog (fill during Phases 1–9, build in Phase 10)
- _(add items here as we notice them — do NOT build during content phases)_
