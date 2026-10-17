# ISO 20022 Academy

**The best place on the internet to understand, explore, and experiment with ISO 20022 — the language of modern payments.**

🌐 **Live:** [iso20022academy.in](https://iso20022academy.in) &nbsp;·&nbsp; 🟢 **Status:** [iso20022academy.in/status](https://iso20022academy.in/status/) &nbsp;·&nbsp; ⚙️ **Translator health:** [/api/health](https://iso20022academy-ai-api.onrender.com/api/health)

---

ISO 20022 Academy is a self-taught, ground-up learning platform for the global payments-messaging standard — built the way I wished someone had built it for me on day one. It began as one person's study notes and grew into a **full-stack product**: long-form lessons, hands-on workshops, a reference of every element and code, and a **Live Translator** that converts between ISO 20022 (MX) and SWIFT MT with a rules engine first and AI as the fallback.

It is deliberately not the largest financial knowledge base. It is meant to be the *clearest* one.

---

## ✨ Highlights

- **A hybrid Live Translator.** Pick a Source format (a valid sample loads) or paste your own message; the Destination is always its direct equivalent. A **rules engine** translates all 16 directions by the published field rules, instantly and the same way every time, and safely fixes what can be proven wrong. **Google ADK agents on Gemini** step in only for messages the rules don't cover. Every result, whoever wrote it, is checked: the format, the pair's field rules, and every amount, BIC, account, date and reference against the original.
- **44 long-form lessons** that always open with a human problem and only reach XML at the very end — from "what is money" to `camt.110/111`, the new investigations model, and the November 2026 structured-address deadline.
- **Hands-on workshops** where you repair broken messages and are graded by code.
- **A live compliance calendar** counting down to the real 2026/2027 migration deadlines, and a **chronometer** timeline that sweeps across 5,000 years of payments history.
- **Quizzes, an 87-term glossary, a message dictionary, ⌘K search**, and **per-lesson SEO pages** so every topic is individually discoverable on Google.
- **Zero-dependency frontend** (vanilla HTML/CSS/JS) on free static hosting, plus one small Python service. The whole stack runs on free tiers.

---

## 🏛 Architecture

```
   Browser  ──────────▶  STATIC SITE · GitHub Pages            iso20022academy.in
                         vanilla HTML/CSS/JS · lessons, workshops, reference, translator
                                   │  fetch (CORS)
                                   ▼
                         TRANSLATOR API · Render (Docker, FastAPI)     /ai-api
                           1. rules engine: translate + safe repairs (instant, free)
                           2. Google ADK + Gemini: only when the engine declines
                           3. the same checks on every result
                                   │
                                   └──▶ Cloudflare Web Analytics API (owner-only /insights/)
```

The **frontend is static**, so it stays fast, free and resilient. The **Translator service** is the one part that needs a server.

---

## 🔁 The Live Translator

| ISO 20022 | ⇄ | SWIFT MT |
|---|---|---|
| `pacs.008` FI-to-FI credit transfer | ⇄ | `MT103` |
| `pacs.004` payment return | ⇄ | `MT103 RETN` |
| `pain.001` credit transfer initiation | ⇄ | `MT101` |
| `pain.008` direct debit initiation | ⇄ | `MT104` |
| `camt.053` statement | ⇄ | `MT940` |
| `camt.054` debit/credit notification | ⇄ | `MT900 / MT910` |
| `camt.056` cancellation request | ⇄ | `MT192` |
| `pacs.002` / `pain.002` status report | → | `MT199` (free text, one way) |

- **Rules engine** (`ai-api/app/engine`): readers that remember what they used, so anything without a place in the target is listed as *not carried over* rather than lost; an MX with several transactions becomes one MT per transaction; it declines rather than guesses.
- **Safe repairs:** counts and control sums, unambiguous dates, decimals, MT amount commas, header addresses. What only the sender can know (a wrong IBAN, a missing name) is reported, never guessed.
- **AI fallback:** called only when the engine can't do it. If the AI is unavailable, the visitor still gets the engine's result with its flags.
- Details, endpoints, limits and environment variables: [`ai-api/README.md`](./ai-api/README.md).

---

## 🧩 What's inside

| Area | What it is |
|---|---|
| **Library** | 44 long-form lessons across six levels, laid out as a course: fundamentals → architecture → message deep-dives → exceptions → case studies → field guides. |
| **History** | A documentary of how money became information, with a scroll-driven chronometer. |
| **Playground** | The Live Translator. |
| **Workshop** | Scenario-based exercises: fix a broken payment, migrate MT to MX, trace an R-transaction. |
| **Reference** | Glossary (87 terms) and Dictionary (elements, code sets, what's changing). |
| **Extras** | ⌘K search, per-level quizzes, per-lesson SEO pages, email capture, a live status page, and an owner-only traffic dashboard. |

---

## 🗂 Repository structure

The web-facing folders **must** stay at the repo root — GitHub Pages serves the root and the app uses absolute paths (`/assets`, `/content`, `/samples`).

| Path | Purpose | Served? |
|---|---|---|
| `index.html` | The single-page app shell + script includes | ✅ web root |
| `assets/` | CSS, JS modules and images. `style.css :root` is the design-token source of truth | ✅ |
| `content/` | The 44 lessons as Markdown — **source of truth for reading** | ✅ (fetched) |
| `samples/` | The 17 sample messages (one per Translator source) as JSON | ✅ (fetched) |
| `status/` | The public status page (`/status/`) | ✅ |
| `insights/` | The owner-only traffic dashboard (`/insights/`, key required) | ✅ (no data without the key) |
| `admin/` | Decap CMS panel at `/admin` for authoring lessons | ✅ |
| `scripts/` | Zero-dependency Node build scripts (run in CI) | build-time |
| `ai-api/` | The **Translator service**: rules engine + Google ADK/Gemini fallback (Render) | separate, not published |
| `transform-api/` | The retired Java + Prowide engine, kept for reference | not published |
| `docs/` | Project documentation — start with [`HANDBOOK.md`](./docs/HANDBOOK.md) | — |
| `.github/workflows/` | The GitHub Pages deploy pipeline | CI |

**Generated at build time (git-ignored):** one folder per page for clean URLs (`library/`, `history/`, `playground/`, `workshop/`, `glossary/`, `dictionary/`, `whats-new/`, `journey/`, `reference/`), each holding the app with that page's title, description and content pre-written for search engines; plus `404.html`, `sitemap.xml`, `robots.txt` and `samples/manifest.json`.

---

## 🛠 Tech & services

Everything runs on free tiers.

| Concern | Choice |
|---|---|
| **Frontend** | Vanilla HTML/CSS/JS — no framework |
| **Static hosting** | GitHub Pages (custom domain, GitHub Actions deploy) |
| **Translator service** | Python 3.12 · FastAPI · lxml · Google ADK + Gemini (fallback) |
| **Service hosting** | Render (Docker, free plan) |
| **Analytics** | Cloudflare Web Analytics (cookieless), read by `/insights/` through the service |
| **Email capture** | Formspree |
| **Markdown / fonts** | `marked.js` (CDN) · Google Fonts |
| **Domain** | `.in` via NIXI |

---

## 🚀 Build & deploy

**1 · The site (automatic, on every push to `main`)** — `.github/workflows/pages.yml` regenerates the Library registry, the SEO pages + sitemap, and the sample manifest, minifies JS/CSS, and publishes only the web-facing folders to GitHub Pages.

**2 · The Translator service (automatic on Render)** — Render builds `ai-api/` from its `Dockerfile` on every push. Environment variables are set in Render only (never in the repo): see [`ai-api/README.md`](./ai-api/README.md).

---

## 💻 Local development

```bash
# the site: generate the per-page folders (clean URLs), then any static server from the repo root
node scripts/build-toc.js && node scripts/build-seo.js && node scripts/build-samples.js
npx serve .

# the Translator service
cd ai-api
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
pytest -q                                  # the engine runs with no key or network
uvicorn app.main:app --reload --port 8000  # then set AI_API in assets/js/translator.js to http://localhost:8000
```

---

## ✍️ Adding a lesson

Lessons are Markdown with a tiny frontmatter contract and a few custom tokens (`{{flow}}`, `{{check}}`, `{{embed}}`, `{{link}}`). The **golden rule**: every lesson opens with a human question and only reaches XML at the very end. Full authoring guide, design system, and teaching philosophy are in [`docs/HANDBOOK.md`](./docs/HANDBOOK.md).

---

## 📈 Status & monitoring

- **Status page:** [iso20022academy.in/status](https://iso20022academy.in/status/) — the website, the Translator (rules engine) with its response time, and whether the AI fallback is available or paused at its usage limit.
- **Traffic:** `/insights/` (owner only) shows visits, pages, referrers, countries and devices from Cloudflare Web Analytics.

---

## 🎯 Objective & status

**Objective:** be the definitive place to *learn* ISO 20022 — clarity over coverage, understanding before implementation — and to prove the concepts with a working translator rather than screenshots.

**Status:** Live. Library, History, Playground (Live Translator), Workshop, Reference, the SEO layer, the Translator service and the status page are in production.

---

## 🙏 Credits

Designed, written, and built by **[Revanth Sai Rayapati](https://www.linkedin.com/in/revanth-sai-2002/)**.

Standing on the shoulders of the open-source **[Prowide](https://www.prowidesoftware.com/)** libraries, **Spring Boot**, and **marked.js**. All lesson content is original.

---

## 📄 License

© 2026 **Revanth Sai Rayapati**. All rights reserved.

This project is **source-available, not open-source**. You're welcome to read, learn from, and reference it — but copying, cloning, republishing, or reusing the code, lesson content, or design in another project is **not permitted** without written permission. See [`LICENSE`](./LICENSE) for the full terms. Third-party components (Prowide, marked.js) keep their own licenses.

> Money stopped being something you move. It became something you *describe* — and the description has to survive the journey. This is a place to learn that language.
