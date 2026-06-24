# Learning Journey — Redesign Concept
### "Follow the Money: Bob & Sweety's Journey Through Global Finance"

---

## 1. Information Architecture

Stop thinking "6 modules." Think **one story, told in chapters**, bookended by a Prologue and an Epilogue.

```
PROLOGUE (Hero)
  → Bob & Sweety's situation. The single question the whole page answers:
    "What actually happens when Bob sends money home?"

CHAPTER 0 — Foundations            "Before the money moves, every bank needs to agree on a language"
CHAPTER 1 — Payments & Cash Mgmt   "Bob hits send. Follow the transfer."
CHAPTER 2 — Foreign Exchange       "Bob's dirhams become Sweety's rupees"
CHAPTER 3 — Cards                  "Sweety taps her card. The money's last mile."
CHAPTER 4 — Trade Finance          "Where did Bob's salary come from in the first place?"
CHAPTER 5 — Securities             "What Sweety does with what's left over"

EPILOGUE — Mastery
  → "You now see the financial system the way a payments engineer does."
    Certificate-style close + replay/explore-freely mode.
```

Why this order (vs. the current list order): it follows **causality**, not alphabetical/catalog order. Money is earned (Trade Finance) → sent (Payments) → converted (FX) → spent (Cards) → and what's left is invested (Securities). Foundations stays the bridge from History, right where it is now. This reordering is the single highest-leverage change — it's the difference between "topics" and "a story."

Each chapter keeps exactly what already works (story prose, why/problem-solution, process map, who's involved, XML workshop) — but it's now **scoped to one moment in Bob & Sweety's day**, not an abstract domain overview.

---

## 2. Page Layout (top to bottom)

```
┌─────────────────────────────────────────────┐
│  HERO — full-bleed, cinematic                │
│  "Bob just sent Sweety money. Here's          │
│   everywhere it goes before she sees it."     │
│  [Begin the Journey →]                        │
├─────────────────────────────────────────────┤
│  CONTINUE BANNER (returning users only)       │
│  "You're with Bob in Chapter 2 — FX"          │
│  [Resume →]                                   │
├─────────────────────────────────────────────┤
│  JOURNEY MAP (hero-weighted, 3-tier focus)    │
│   ▸ CURRENT — large, animated, glowing        │
│   ▸ UP NEXT — medium, visible preview         │
│   ▸ THE PATH AHEAD — small, silhouette/locked │
├─────────────────────────────────────────────┤
│  MASTERY STRIP                                │
│  progress ring + "3 of 6 chapters" + streak   │
└─────────────────────────────────────────────┘
```

This replaces the flat "all 6 equal-weight flags" layout entirely. Only one module is ever visually dominant.

---

## 3. Hero Section — Copy

```
Eyebrow:     CHAPTER ONE OF YOUR JOURNEY

Headline:    Bob just sent Sweety $400.
             Here's everywhere it goes before she sees it.

Subhead:     A payment looks instant. It isn't. Behind that single
             transfer, six financial systems hand the money to each
             other — speaking the exact language you just learned
             ISO 20022 created. Follow it, step by step, as Bob and
             Sweety would live it.

Primary CTA: Follow the Money →
Secondary:   (returning user) Resume where you left off
```

Visual: a single animated line (the "money") tracing from a small avatar (Bob, left) toward another avatar (Sweety, right), passing through faint icons for bank → clearing → FX → card — establishing the path metaphor before the learner even scrolls. This single motif (a traveling dot/line) becomes the page's visual signature and reappears in the journey map below.

---

## 4. Progress System

Replace the binary locked/unlocked/completed pill with a system that *feels* like advancement:

- **Mastery Ring** (top of page, persistent): a circular progress ring, segmented into 6 arcs (one per chapter), filling as completed. Center shows "3/6" and a small label like "Halfway through Bob's transfer."
- **Per-chapter micro-state**, not just locked/unlocked:
  - `Not yet reached` — dim, silhouette, no detail shown (preserves anticipation)
  - `Up next` — visible title + one-line teaser, soft glow border
  - `In progress` — fully expanded, large, glowing accent, "Continue" CTA
  - `Mastered` — checkmark + a small "what you unlocked" stat (e.g., "You can now read a PACS.008 message")
- **Narrative milestones, not percentages**: instead of "50% complete," surface "Bob's money has left the bank — next, it crosses a border." Tie the number to the story.
- **Streak/momentum** (optional, lightweight): "You've continued this journey 3 days running" — Duolingo-style without gamification clutter (no points/leaderboards — keep it premium, not arcade).

---

## 5. Journey Visualization Concept

Drop the flat zig-zag flag row. Replace with a **horizontal "route line"** (think Apple Music's now-playing scrubber crossed with a subway map):

```
●━━━━━━━━━━━●╍╍╍╍╍╍╍○┄┄┄┄┄○┄┄┄┄┄○┄┄┄┄┄○
Trade Finance Payments  FX    Cards  Securities
 (mastered)  (current) (next) (path ahead →)
```

- Solid line = traveled ground (mastered chapters).
- Dashed/glowing line = the active edge (current chapter, animated — a slow pulse traveling along it, reinforcing "the money is moving right now").
- Dotted/faint line = unexplored future (low-contrast, intentionally vague — silhouette icons, no full labels, to preserve curiosity).
- Each "stop" is a small avatar-adjacent marker — e.g., a bank icon at Payments, a currency-exchange icon at FX, a card icon at Cards — not a generic flag. The icon itself tells you what the chapter is about before you read a word.
- On mobile: same metaphor, rotated vertical, scroll-driven (the line "draws itself in" as you scroll — a single, tasteful scroll-linked animation rather than per-card fades).

This is the one element worth real engineering investment — it's the visual that makes the page feel like Stripe/Linear rather than an LMS, because it communicates *progression through a path* at a glance, with zero reading required.

---

## 6. Module Presentation Redesign

Each chapter, when active, opens not as "a lesson page" but as **a scene**:

- **Chapter header** reframes the existing pillar content as a moment in the story, e.g.:
  - Old: "Foreign Exchange — learn FX concepts"
  - New: *"Bob earns in AED. Sweety needs rupees. Someone, somewhere, has to make that conversion — and ISO 20022 has to describe it precisely enough that no money disappears in the process."*
- **The existing why/problem-solution block stays** — it's good content — but is now voiced as "what would go wrong if this step didn't exist" *for Bob and Sweety specifically*, not abstractly.
- **The existing process map stays** (it's already the right shape — a flow of steps) — but each step gets relabeled with Bob/Sweety where natural (e.g., "Bob's Bank → Clearing System → Sweety's Bank" instead of generic role names), so the diagram visually continues the story rather than switching into "documentation mode."
- **The workshop (XML editor) becomes "Prove it happened."** Frame: "Here's the actual message your bank would have sent for Bob's transfer. Edit it, verify it, and you've just done what a payments engineer does daily." Same mechanic, reframed stakes.
- **Completion moment**: instead of a small toast ("✓ Module complete"), a brief, satisfying full-width transition: the route line animates one more segment as filled, and the next chapter's preview card expands into focus. This is the single most important micro-interaction on the page — completing a chapter should feel like a small "level-up," not a form submission.

---

## 7. Visual Hierarchy Recommendations

1. **One hero element per screen.** Never show the hero video/copy and the full journey map competing for attention simultaneously — stack them, don't grid them.
2. **Size = status**, not just color. Current chapter card should be visibly 1.5–2x the visual weight (size, contrast, motion) of "up next," which is itself heavier than "path ahead." Today everything is equal-weight — that's the core LMS smell.
3. **Typography**: hero headline 56–72px, chapter titles 28–32px, body 15–16px with generous 1.7+ line-height — matches the existing History page's "big fonts" instinct the user already validated.
4. **Color discipline**: keep emerald (`--primary`) reserved for "active/progress" states only. Locked/future states should be desaturated (`--text-muted`, `--border`) so the eye is pulled toward what's actionable.
5. **Whitespace over borders**: replace remaining hard `1px solid var(--border)` card outlines on primary content with spacing + subtle shadow/glass (`--glass-bg`, `--glass-shadow`) — borders read as "form/admin," soft elevation reads as "product."

---

## 8. Motion & Interaction Ideas

- **Route line pulse**: a soft glow travels along the active (dashed) segment of the journey line on a slow loop — signals "in progress" without needing a spinner or text.
- **Scroll-linked reveal**: the route line draws itself in as the page is scrolled (stroke-dashoffset animation), rather than cards fading in independently — ties motion to the *path* metaphor instead of generic "scroll reveal."
- **Chapter transition**: when a chapter completes, don't hard-cut back to the map — animate the lesson panel collapsing into its now-"mastered" marker on the route line (the content visibly "becomes" the small icon it now is). This is the kind of transition Linear/Arc are known for and is worth the engineering cost.
- **Hover micro-feedback**: "up next" cards lift slightly and brighten on hover, signaling "you could go here" without being clickable yet if still locked — curiosity, not frustration.
- **Avatar continuity**: Bob/Sweety's small avatar icons travel with the active position on the route line — a tiny visual anchor that's present in the hero, the map, and inside each chapter's header, reinforcing "this is still their story."

---

## 9. Premium UX Improvements

- **Resume, don't restart**: returning users land on a "Continue Bob's journey" banner above the fold, not back at chapter 1 — respect their time.
- **Ambient progress, not nagging progress**: the mastery ring is always visible (e.g., pinned in the page header while scrolling) but never modal/interruptive.
- **Earned vocabulary, surfaced**: on completing a chapter, briefly surface one real term/message code the learner can now recognize (e.g., "You can now read a PACS.008") — ties abstract completion to a tangible, flex-worthy skill, which is what makes Brilliant/Duolingo completions feel earned rather than arbitrary.
- **No dead ends**: every locked "path ahead" chapter still shows its title + one-line hook (not just a lock icon) — curiosity is a retention driver; total opacity is not.
- **Consistent narrator voice**: the existing History page already nails tone (cinematic, second-person-adjacent storytelling) — the Learning Journey copy should read like the *next scene of the same film*, not a tonal reset into textbook language.

---

## 10. Wireframe-Level Structure

```
[HERO]
  Eyebrow / Headline / Subhead / Primary CTA
  Bob ●───────────────────────────────● Sweety  (ambient animated line)

[RESUME BANNER]  (conditional)
  "Continue with Bob — Chapter 3: Cards"  [Resume →]

[MASTERY RING]
  ◐ 3/6   "Bob's money has crossed the border — next, it reaches Sweety's card."

[ROUTE LINE — horizontal scroll-synced map]
  ● mastered ── ● mastered ── ◉ CURRENT (large, glowing) ┄ ○ next ┄ ○ ahead ┄ ○ ahead

[CURRENT CHAPTER — large, expanded by default]
  Chapter eyebrow + cinematic header line (Bob/Sweety framing)
  Story prose (existing content, reframed)
  Why it matters (problem → fix, existing content)
  Process map (relabeled with Bob/Sweety roles)
  Who's involved
  [Open Workshop →]  (XML editor lives in its own focused view, not always-visible split-screen)

[UP NEXT — medium card, teaser only]
  Title + one-line hook + faded preview icon

[THE PATH AHEAD — compact row, silhouette]
  Small icons + titles only, no detail, "Locked" implied by dimness not a padlock graphic

[EPILOGUE — shown after chapter 6]
  "You've followed Bob's $400 all the way to Sweety. You now see the
   financial system the way the people who built it do."
  [Explore any chapter freely →]
```

---

## What this keeps from the current build (low-risk reuse)
Story prose, why/problem-solution, process maps, who's-involved cards, and the XML workshop mechanic all stay — they're already good content. The redesign's real work is in **information architecture (reordered into causality), visual hierarchy (one focal chapter instead of six equals), the route-line journey map (replacing the flag/wave layout), and copy reframing (Bob/Sweety voice threaded through every section)**.

## What this would require to build
- `data.js`: reorder `learningJourney`, add Bob/Sweety framing lines to each module's `story`/process steps, add one "unlocked skill" stat per chapter.
- `ui.js`: new hero render function, mastery-ring component, route-line map (likely SVG path + scroll listener), three-tier card rendering (current/next/ahead) replacing the flat flag loop, chapter-completion transition logic.
- `style.css`: new hero/ring/route-line classes; de-emphasized "ahead" card styles; glass-based elevation replacing remaining hard borders.

This is a structural rebuild of the page, not a styling pass — happy to start once you've sanity-checked the direction above.
