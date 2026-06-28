# ISO Academy — Component Spec

> **Status:** Locked in Session 1.2. The shared component inventory every future
> page draws from. Each entry has a **name**, its **props** (the modifier classes,
> required structure, and attributes that configure it), and **one example**.
>
> Companions: `DESIGN_TOKENS.css` (the values these consume), `NAVIGATION.md`
> (where these get used), `PHILOSOPHY.md` (the voice their content must carry).

## How to read this doc

These are **CSS-class components**, not a JS framework. A component's "props" are:
- **Modifier classes** — e.g. `.active`, `.header-scrolled` — that switch state.
- **Required structure** — the child elements a component expects to be well-formed.
- **Attributes** — `data-page`, `aria-*`, handlers like `onclick="navigate(...)"`.

All visual values come from tokens in `DESIGN_TOKENS.css`; a component never
hard-codes a color, radius, or duration. Add a component here before building a
new one in a page template (Session 1.3+).

**Scope:** this inventory covers the **shared** vocabulary — the shell, cards,
content blocks, the detail/reading surface, controls, and layout grids — that
History / Library / Playground / Glossary all reuse. Page-specific set pieces
(the intro preloader, kinetic headline, History scrub-timeline, Journey route
map) are **not** shared components and are intentionally excluded; they live with
their one page.

---

## 1. App Shell

The persistent frame every page renders inside. Defined once in `index.html`,
never rebuilt per page.

### `header` — global top bar
- **Props:** `.header-scrolled` (glass crystallizes once scrolled off the top),
  `.header-hidden` (slides up out of view). Both toggled by `motion.js`.
- **Structure:** `.header-left` (holding `.logo` + `.nav`) and `.header-right`
  (holding `.theme-toggle`). Sticky, `z-index:1000`.
- **Example:**
  ```html
  <header class="header" id="header">
    <div class="header-left"> …logo… …nav… </div>
    <div class="header-right"> …theme-toggle… </div>
  </header>
  ```

### `nav` — top-level section nav (4 items)
- **Props (per item):** `.nav-item`, add `.active` for the current section;
  `data-page="<key>"`; `onclick="navigate('<key>', event)"`.
- **Structure:** the four section buttons **plus** one `.nav-indicator` — the
  single gliding pill that slides between items (driven by `ui.js`; reuse it,
  don't recreate per item). Contract is **exactly four** items, in question
  order: History · Library · Playground · Glossary (`NAVIGATION.md` §4).
- **Note:** Session 1.3 retired the 5th item ("Learning Journey") from the global
  nav and renamed the legacy `learn` key to `library` across `index.html`,
  `app.js`, and `markdown.js`. The `journey` route is kept as a non-nav deep
  link (disposition c). The contract is now exactly four items, as shown.
- **Example:**
  ```html
  <nav class="nav" id="nav">
    <button class="nav-item active" data-page="history"    onclick="navigate('history', event)">History</button>
    <button class="nav-item"        data-page="library"    onclick="navigate('library', event)">Library</button>
    <button class="nav-item"        data-page="playground" onclick="navigate('playground', event)">Playground</button>
    <button class="nav-item"        data-page="glossary"   onclick="navigate('glossary', event)">Glossary</button>
    <span class="nav-indicator" id="nav-indicator" aria-hidden="true"></span>
  </nav>
  ```

### `logo` — wordmark, links home
- **Props:** none. Always links `#/` → History via `navigate('history', event)`.
- **Structure:** `.logo-icon` (gradient squircle + inline SVG mark) followed by
  `.logo-text` (the `<em>` inside renders "Academy" muted).
- **Example:**
  ```html
  <a class="logo" href="#/" onclick="navigate('history', event)">
    <div class="logo-icon" aria-hidden="true"><svg>…peak mark…</svg></div>
    <span class="logo-text">ISO&nbsp;20022 <em>Academy</em></span>
  </a>
  ```

### `theme-toggle` — dark ⇄ light switch
- **Props:** `.active` = light mode engaged (slides `.toggle-thumb` across).
  Drives `body.light-mode`, which flips the token set. `onclick="toggleTheme()"`.
- **Structure:** one `.toggle-thumb` child. `role="button"`, `tabindex="0"`,
  `aria-label="Toggle theme"`.
- **Example:**
  ```html
  <div class="theme-toggle" onclick="toggleTheme()" role="button" aria-label="Toggle theme" tabindex="0">
    <div class="toggle-thumb"></div>
  </div>
  ```

### `main-container` / `content-area`
- **Props:** none. `content-area` is the single scroll/flow region pages mount
  into (`#content`); padding is `--content-pad`. Optional `.sidebar` and
  `.detail-panel` flank it (both width:0 until opened).
- **Example:**
  ```html
  <div class="main-container">
    <main class="content-area" id="content"><!-- page mounts here --></main>
  </div>
  ```

### `scroll-rail` — top-of-page progress bar
- **Props:** none. `.scroll-rail-fill` width is driven by `--scroll-progress`.
- **Example:**
  ```html
  <div class="scroll-rail" aria-hidden="true"><div class="scroll-rail-fill" id="scroll-rail-fill"></div></div>
  ```

### `site-footer` — shared shell footer (added Session 1.3)
- **Props:** none. Sits once below `.main-container`, shared by all four sections.
  Tokens only; `--bg-deep` ground with a `--border` top rule, mirroring the
  header's calm register.
- **Structure:** `.site-footer-inner` holds `.site-footer-brand` (the `logo`
  reused + `.site-footer-mission` line) and `.site-footer-nav` (the eyebrow
  `.site-footer-nav-label` + the **four** section links, question order — same
  contract as the header `nav`). A closing `.site-footer-base` strip carries the
  wordmark + one-line descriptor. Collapses to a single column at 768px.
- **Example:**
  ```html
  <footer class="site-footer">
    <div class="site-footer-inner">
      <div class="site-footer-brand"> …logo… <p class="site-footer-mission">…</p> </div>
      <nav class="site-footer-nav" aria-label="Sections">
        <span class="site-footer-nav-label">Explore</span>
        <a href="#/history" onclick="navigate('history', event)">History</a>
        <a href="#/library" onclick="navigate('library', event)">Library</a>
        <a href="#/playground" onclick="navigate('playground', event)">Playground</a>
        <a href="#/glossary" onclick="navigate('glossary', event)">Glossary</a>
      </nav>
    </div>
    <div class="site-footer-base"><span>ISO&nbsp;20022 Academy</span>…</div>
  </footer>
  ```

---

## 2. Cards

All cards share the same resting recipe — `--surface` fill, `--border`, hover
lifts to `--primary` border + `--shadow`. Pick the variant by content type.

### `card` — generic content card
- **Props:** optional `.card-title` + `.card-description` children. Drop into a
  `.grid-2/3/4`.
- **Example:**
  ```html
  <div class="card">
    <div class="card-title">Clearing vs Settlement</div>
    <p class="card-description">Two words people use interchangeably — and the moment money actually moves.</p>
  </div>
  ```

### `family-card` — selectable list item (message families, levels)
- **Props:** `.active` = selected (inverts to `--primary` fill). Children:
  `.family-card-title`, `.family-card-count`.
- **Example:**
  ```html
  <div class="family-card active">
    <div class="family-card-title">pacs</div>
    <div class="family-card-count">5 messages</div>
  </div>
  ```

### `message-card` — compact tappable tile in a 2-up grid
- **Props:** `.active`. Centered, single-line; lives in `.message-grid`.
- **Example:** `<div class="message-card">pacs.008</div>`

### `pillar-card` — icon + label tile (catalogue index)
- **Props:** `.active`. Children: `.pillar-card-icon`, `.pillar-card-title`,
  `.pillar-card-count`. Auto-fills `.pillar-grid` (min 220px).
- **Example:**
  ```html
  <div class="pillar-card">
    <div class="pillar-card-icon">▣</div>
    <div class="pillar-card-title">Architecture</div>
    <div class="pillar-card-count">5 topics</div>
  </div>
  ```

### `participant-card` — small role chip with avatar circle
- **Props:** none. Children: `.participant-icon` (round token), `.participant-role`.
  Auto-fills `.participant-cards` (min 150px).
- **Example:**
  ```html
  <div class="participant-card">
    <div class="participant-icon">⌂</div>
    <div class="participant-role">Creditor Agent</div>
  </div>
  ```

### `glossary-card` — term + definition, accent rule
- **Props:** none. Left `4px --primary` rule. Children: `.glossary-term`
  (mono, accent), `.glossary-definition`. Lives in `.glossary-grid` (2-up).
- **Example:**
  ```html
  <div class="glossary-card">
    <div class="glossary-term">UETR</div>
    <p class="glossary-definition">The end-to-end reference that lets one payment be tracked across every bank it touches.</p>
  </div>
  ```

---

## 3. Content Blocks

The editorial building blocks for a page body. These carry the lesson voice
(`PHILOSOPHY.md`) — plain language first, the tag last.

### `section-title` / `section-description`
- **Props:** none. The standard page/section heading + lead paragraph
  (`section-description` is capped to a readable measure).
- **Example:**
  ```html
  <h2 class="section-title">200 — Architecture</h2>
  <p class="section-description">How the plumbing behind a payment is actually laid out.</p>
  ```

### `highlight-box` — callout with accent rule
- **Props:** none. `--surface-alt` fill, left `4px --primary` rule. For a key
  takeaway or aside.
- **Example:** `<div class="highlight-box">A payment "clears" before it "settles" — the promise comes before the money.</div>`

### `hero` — full-width gradient banner
- **Props:** none. `--primary → --primary-hover` gradient, centered. Children:
  `<h1>` + `<p>`. Use for a landing statement, sparingly.
- **Example:**
  ```html
  <div class="hero"><h1>How money moves</h1><p>Told through ISO 20022.</p></div>
  ```

### `timeline` — vertical dotted history list
- **Props:** none. Repeat `.timeline-item` (each = `.timeline-dot` +
  `.timeline-content` with `<h3>` + `<p>`).
- **Example:**
  ```html
  <div class="timeline">
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content"><h3>1973</h3><p>SWIFT is founded.</p></div>
    </div>
  </div>
  ```

### `stats-strip` — row of live figures (glass)
- **Props:** none. Repeat `.stat` (each = `.stat-value` with optional
  `.stat-prefix`/`.stat-suffix`, plus `.stat-label`). Stacks on mobile.
- **Example:**
  ```html
  <div class="stats-strip">
    <div class="stat"><div class="stat-value">11,000<span class="stat-suffix">+</span></div><div class="stat-label">institutions</div></div>
  </div>
  ```

### `process-map` — horizontal business-flow strip
- **Props:** none. `.process-map-title` then `.process-map-flow` holding
  `.process-map-step` chips separated by `.process-map-arrow`. Business terms
  only (no tags) per the Lesson Spine beat 4.
- **Example:**
  ```html
  <div class="process-map">
    <div class="process-map-title">How the world solved it</div>
    <div class="process-map-flow">
      <span class="process-map-step">Payer's bank</span>
      <span class="process-map-arrow">→</span>
      <span class="process-map-step">Clearing</span>
    </div>
  </div>
  ```

### `tags` / `tag` — metadata pills
- **Props:** none. `.tags` wrapper, `.tag` per chip.
- **Example:** `<div class="tags"><span class="tag">Credit transfer</span></div>`

### `xml-example` — raw-XML code well
- **Props:** none. Mono, accent text on `--surface-alt`. **Lesson Spine beat 7
  only** — never render this before the human problem (`PHILOSOPHY.md` §3).
- **Example:** `<pre class="xml-example">&lt;CdtTrfTxInf&gt;…&lt;/CdtTrfTxInf&gt;</pre>`

---

## 4. Reading Surface (Detail Panel / Message Modal)

The deep-read surface a lesson or message opens into. Two shells, **one shared
inner layout** (`.detail-panel-content`): a slide-in side `detail-panel` and a
centered `msg-modal` popup. Current build uses the modal (`ui.js` `openDetailPanel`).

### `msg-modal` — centered reading window
- **Props:** `.open` on `.msg-modal-overlay` fades the dim/blur backdrop in and
  un-shrinks the card. Closes on backdrop click or Esc.
- **Structure:** `.msg-modal-overlay` > `.msg-modal[role=dialog]` >
  `.detail-panel-content` (the shared inner layout below).
- **Example:**
  ```html
  <div class="msg-modal-overlay open" id="msg-modal-overlay">
    <div class="msg-modal" role="dialog" aria-modal="true">
      <div class="detail-panel-content"> …detail sections… </div>
    </div>
  </div>
  ```

### `detail-tabs` — in-panel tab row
- **Props (per tab):** `.detail-tab`, add `.active` for the open tab.
- **Example:**
  ```html
  <div class="detail-tabs">
    <button class="detail-tab active">Story</button>
    <button class="detail-tab">XML</button>
  </div>
  ```

### `detail-header` — panel title block
- **Props:** none. Children: `.detail-title`, `.detail-subtitle`.
- **Example:**
  ```html
  <div class="detail-header"><div class="detail-title">pacs.008</div><div class="detail-subtitle">Bank-to-bank credit transfer</div></div>
  ```

### `detail-section` — labelled content block
- **Props:** none. A monospace `.detail-label` eyebrow over free HTML body.
  Built by `ui.js` `renderDetailSection(label, html)`.
- **Example:**
  ```html
  <div class="detail-section"><div class="detail-label">What breaks</div><p class="detail-description">A truncated name trips a sanctions match.</p></div>
  ```

### `spotlight-fields` — plain-English meaning rows
- **Props:** none. Repeat `.spotlight-field` (each = `.spotlight-field-tag` +
  `.spotlight-field-meaning`). Built by `ui.js` `renderMeaningRows(rows)`; used
  to translate tags inline on first sight (Lesson Spine beat 7).
- **Example:**
  ```html
  <div class="spotlight-fields">
    <div class="spotlight-field"><span class="spotlight-field-tag">CdtrAgt</span><span class="spotlight-field-meaning">the receiving bank</span></div>
  </div>
  ```

---

## 5. Controls

### `btn` — primary action button
- **Props:** none (single primary style). `--primary` fill, lifts on hover.
- **Example:** `<button class="btn">Open in Playground</button>`

### `search-box` — text input / filter field
- **Props:** none. Focus shows a `--primary` border + glow ring. Used for the
  Glossary search (`NAVIGATION.md` `#/glossary?q=`).
- **Example:** `<input class="search-box" type="search" placeholder="Search terms…">`

### `filter-bar` / `filter-chip` — stateful category / segment filter (added Session 1.4)
- **Props (per chip):** `.filter-chip`, add `.active` for the selected filter
  (inverts to `--primary` fill). Optional `.filter-chip-count` child shows a
  muted tally. Wrap chips in a `.filter-bar` (wraps to multiple rows).
- **Why it exists:** `.tag` is a *static* metadata pill; this is the *pressable,
  stateful* control. IA-validation gap fix for the Glossary category filter
  (`#/glossary?category=<cat-slug>`); the Library level index can reuse it.
- **Example:**
  ```html
  <div class="filter-bar" role="group" aria-label="Categories">
    <button class="filter-chip active">All</button>
    <button class="filter-chip">Acronyms <span class="filter-chip-count">24</span></button>
    <button class="filter-chip">Message Elements <span class="filter-chip-count">31</span></button>
  </div>
  ```

### `pager` — sequential prev / next reader nav (added Session 1.4)
- **Props:** `.pager-link` carries direction modifier `.pager-prev` or
  `.pager-next` (the latter right-aligns); add `.pager-disabled` to grey out and
  disable an edge (first/last item). Children: `.pager-dir` (mono eyebrow) +
  `.pager-label` (the destination title).
- **Why it exists:** History chapters are *read in order* (Phase 2) and a Library
  level is a *five-lesson sequence* (Phase 3). Both need the same foot-of-column
  reader nav — shared, not page-owned. Collapses to one column at 768px.
- **Example:**
  ```html
  <nav class="pager" aria-label="Chapters">
    <a class="pager-link pager-prev" href="#/history/evolution-of-payments">
      <span class="pager-dir">← Previous</span><span class="pager-label">Evolution of Payments</span>
    </a>
    <a class="pager-link pager-next" href="#/history/problems-with-legacy-standards">
      <span class="pager-dir">Next →</span><span class="pager-label">Problems with Legacy Standards</span>
    </a>
  </nav>
  ```

---

## 6. Layout Grids

Responsive column scaffolds; all gap `--space-lg`, all collapse to 1 column on
mobile.

| Class | Columns | Collapses |
|---|---|---|
| `.grid-2` | 2 equal | → 1 at 768px |
| `.grid-3` | 3 equal | → 1 at 768px |
| `.grid-4` | 4 equal | → 2 at 1200px, 1 at 768px |
| `.pillar-grid` | auto-fill, min 220px | naturally |
| `.participant-cards` | auto-fill, min 150px | naturally |
| `.glossary-grid` | 2 equal | → 1 at 1200px |
| `.message-grid` | 2 equal | → 1 at 1200px |
| `.explorer-container` | 280px rail + fluid | → 1 at 1200px |

- **Example:** `<div class="grid-3"> …three .card… </div>`

---

## Conventions every component obeys

- **Tokens, never literals.** Color/radius/shadow/duration come from
  `DESIGN_TOKENS.css`. A new hex in a component is a bug.
- **State is a modifier class** (`.active`, `.open`, `.header-scrolled`) toggled
  by JS — not an inline style.
- **Hover physics are uniform:** cards lift `--hover-lift` to a `--primary`
  border; pressables compress to `--press-scale`. Don't invent per-component
  hover behavior.
- **Content carries the voice.** A component is a vessel; what goes in it must
  pass the `PHILOSOPHY.md` acceptance test (no tag before the human problem;
  `xml-example` is beat 7).
- **Add before you build.** New shared component → add an entry here first so
  1.3+ templates have one contract to wire against.

---

## 7. Phase 1 IA Validation (Session 1.4)

Every planned page from Phases 2–5 walked through the Phase 1 shell
(`TEMPLATE.html`) + this inventory. Each page must resolve to: a route
(`NAVIGATION.md`), the shared shell region it mounts into, and either shared
components or an explicitly **page-owned** set piece. Result: **all pages
covered**; two shared controls were missing and have been added (above).

### Coverage by section

- **History** (Phase 2) — chapter index renders as `card`/`pillar-card` grid;
  chapter body uses `section-title`/`-description`, `timeline`, `stats-strip`,
  `process-map`, `highlight-box`, `hero`. The cinematic set pieces
  (`scrub-section` pinned timeline, `history-cinematic-break` video) are
  **page-owned** — already in `style.css`, intentionally excluded from this
  shared inventory. **Gap found:** no sequential "read in order" nav → added
  **`pager`**.
- **Library** (Phase 3) — levels index = `pillar-card` + `.pillar-grid`; level
  rail = `family-card` + `.explorer-container`; topic tiles = `message-card` +
  `.message-grid`; the nine-beat lesson opens in the reading surface
  (`msg-modal`/`detail-panel` → `detail-header`, `detail-tabs`,
  `detail-section`, `spotlight-fields`, `xml-example`); supporting blocks
  `process-map`, `participant-card`, `tags`. Cross-links (DoD 3.2) are plain
  `<a>` on token link styles. **Fully covered** (lesson sequence also uses the
  new `pager`).
- **Playground** (Phase 4) — landing/workspace = `pillar-card` grid +
  `.explorer-container` (rail + fluid pane); `btn`, `search-box`, `tags` for
  chrome. The five tool interiors (XML viewer tree, transformer panes, validator
  result list, comparator diff) are **page-owned modules** built per Phase 4
  session — same status as History's scrub-timeline, **out of shared scope by
  design**. No shared gap; flagged so Phase 4 owns its tool chrome knowingly.
- **Glossary** (Phase 5) — terms grid = `glossary-card` + `.glossary-grid`;
  search = `search-box`; term detail = reading surface. **Gap found:** no
  interactive category filter (`?category=`) — `tag` is static-only → added
  **`filter-bar`/`filter-chip`**.

### Gaps fixed (patch, not rebuild)

| Gap | Needed by | Resolution |
|---|---|---|
| Sequential reader nav | History chapters (P2), Library lessons (P3) | New shared **`pager`** (§5) — `style.css` + this spec + demo in `TEMPLATE.html`. |
| Interactive category filter | Glossary `?category=` (P5.1) | New shared **`filter-bar`/`filter-chip`** (§5) — same three places. |

No tokens were added (both controls resolve entirely from existing
`DESIGN_TOKENS.css` values). No existing component was rebuilt. With these two
additions every Phase 2–5 page renders through the Phase 1 shell — **Phase 1
foundation signed off.**
