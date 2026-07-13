# ISO 20022 Academy

**The best place on the internet to understand, explore, and experiment with ISO 20022 — the language of modern payments.**

🌐 **Live:** [iso20022academy.in](https://iso20022academy.in) &nbsp;·&nbsp; 🟢 **Status:** [iso20022academy.in/status](https://iso20022academy.in/status/) &nbsp;·&nbsp; ⚙️ **Engine health:** [/api/health](https://iso20022academy-transform-api.onrender.com/api/health)

---

ISO 20022 Academy is a self-taught, ground-up learning platform for the global payments-messaging standard — built the way I wished someone had built it for me on day one. It began as one person's study notes and grew into a **full-stack product**: an interactive academy of long-form lessons, a live message playground, a searchable glossary, and — behind it — a **real Java + Prowide engine that transforms live between the legacy SWIFT MT world and ISO 20022 MX**.

It is deliberately not the largest financial knowledge base. It is meant to be the *clearest* one.

---

## ✨ Highlights

- **A live MT ⇄ MX transformation engine.** Paste an `MT103` and a real backend converts it to `pacs.008` (and back) — parsed with **Prowide Core** on a **Spring Boot** service, deployed and monitored. Not a client-side toy; an actual API.
- **44 long-form lessons** that always open with a human problem and only reach XML at the very end — from "what is money" to `camt.110/111`, the new investigations model, and the November 2026 structured-address deadline.
- **An interactive Playground** — browse the ISO 20022 catalogue as cards, open any message in a collapsible reader, and transform it two ways (instant in-browser, or through the live engine).
- **A live compliance calendar** counting down to the real 2026/2027 migration deadlines, and a **chronometer** timeline that sweeps across 5,000 years of payments history as you scroll.
- **Quizzes, an 87-term glossary, ⌘K command-palette search**, and **per-lesson SEO pages** so every topic is individually discoverable on Google.
- **Zero-dependency frontend** (vanilla HTML/CSS/JS, no framework) on free static hosting, plus a **containerised Java backend** — the whole stack runs on free tiers.

---

## 🏛 Architecture

Two independently deployed halves, one repository:

```
                            ┌─────────────────────────────────────────────┐
   Browser  ───────────────▶│  STATIC SITE  ·  GitHub Pages                │
                            │  iso20022academy.in                          │
                            │  vanilla HTML/CSS/JS · no framework          │
                            │  lessons · playground · glossary · search    │
                            └───────────────┬─────────────────────────────┘
                                            │  fetch (CORS)
                                            ▼
                            ┌─────────────────────────────────────────────┐
      "Run the live         │  TRANSFORM API  ·  Render (Docker)           │
       engine" button ─────▶│  Spring Boot 3 · Java 17 · Prowide Core      │
                            │  POST /api/transform  (MT103 ⇄ pacs.008)     │
                            └─────────────────────────────────────────────┘
                                            ▲
                     UptimeRobot ───────────┘  pings /api/health every 10 min
                                               (keeps the free instance warm)
```

The **frontend is static** — GitHub Pages can't run code, so the site stays fast, free, and resilient. The **backend is a separate deployable** — the one thing that genuinely needs a server (real message parsing) lives on Render. They talk over a small CORS-enabled JSON API.

---

## 🔁 The live MT ⇄ MX transformer

The headline feature, and the reason there's a backend at all.

- **What it does:** converts a legacy SWIFT **MT103** (the payment message that moved the world's money for a generation) into an **ISO 20022 `pacs.008`**, and back the other way.
- **How:** MT parsing uses [**Prowide Core**](https://www.prowidesoftware.com/development-tools/core) (Apache 2.0) — the genuinely hard part. The field mapping is coded explicitly and auditably, so no commercial translator is required.
- **Where it lives:** [`/transform-api`](./transform-api) — a Spring Boot service with a clean REST surface.

```bash
curl -X POST https://iso20022academy-transform-api.onrender.com/api/transform \
  -H 'Content-Type: application/json' \
  -d '{ "direction": "MT_TO_MX",
        "source": ":20:BOB-INV0042\n:23B:CRED\n:32A:260627USD400,00\n:50K:Bob Marsh\n:52A:EBILAEAD\n:57A:HDFCINBB\n:59:Sweety Rao\n:70:Invoice 0042\n:71A:SHA" }'
```

Returns a full, well-formed `pacs.008` with a freshly generated UETR. In the Playground, the **"Run through the live engine"** button surfaces this result badged *"transformed by a live Java + Prowide server."* The instant in-browser transform stays as the fast, always-available layer; the API is the real engine on top — with a graceful "warming up…" state for cold starts.

---

## 🧩 What's inside

| Area | What it is |
|---|---|
| **History** | A five-chapter documentary of how money became information, with a live compliance-deadline calendar and a scroll-driven chronometer. |
| **Library** | 44 long-form lessons across six levels — fundamentals → architecture → message deep-dives → exceptions → case studies → field guides. |
| **Playground** | The ISO 20022 catalogue as cards → open any of 18 sample messages in a reader → transform MT ⇄ MX (instant + live engine). |
| **Glossary** | 87 cross-linked terms, from IBAN to settlement, filterable and searchable. |
| **Extras** | ⌘K search, per-level quizzes, per-lesson SEO pages, email capture, and a live status page. |

---

## 🗂 Repository structure

Each folder has one job. The web-facing folders **must** stay at the repo root — GitHub Pages serves the root and the app uses absolute paths (`/assets`, `/content`, `/samples`).

| Path | Purpose | Served? |
|---|---|---|
| `index.html` | The single-page app shell + script includes | ✅ web root |
| `assets/` | All CSS, JS modules, and images. `style.css :root` is the design-token source of truth | ✅ |
| `content/` | The 44 lessons as Markdown (frontmatter + prose + custom tokens) — **source of truth for reading** | ✅ (fetched) |
| `samples/` | The 18 ISO 20022 sample messages as JSON — fetched on demand by the Playground | ✅ (fetched) |
| `status/` | The standalone live status page (`/status/`) | ✅ |
| `admin/` | Decap CMS panel at `/admin` for authoring lessons | ✅ |
| `scripts/` | Zero-dependency Node build scripts (run in CI) — see below | build-time |
| `transform-api/` | The **Spring Boot + Prowide** backend (deployed separately to Render) | separate |
| `docs/` | Project documentation — start with [`HANDBOOK.md`](./docs/HANDBOOK.md) | — |
| `.github/workflows/` | The GitHub Pages deploy pipeline | CI |

**Generated at build time (git-ignored, never edited by hand):** `library/` (per-lesson SEO pages), `sitemap.xml`, `robots.txt`, and `samples/manifest.json`.

---

## 🛠 Tech & services

Everything runs on free tiers.

| Concern | Choice |
|---|---|
| **Frontend** | Vanilla HTML/CSS/JS — **no framework, no build step** for the app itself |
| **Static hosting** | GitHub Pages (custom domain, GitHub Actions deploy) |
| **Backend** | Spring Boot 3.3 · Java 17 · [Prowide Core](https://central.sonatype.com/artifact/com.prowidesoftware/pw-swift-core) `SRU2025-10.3.13` (Apache 2.0) |
| **Backend hosting** | Render (Docker, scales to zero) |
| **Uptime / keep-warm** | UptimeRobot (pings `/api/health` every 10 min) |
| **Analytics** | Cloudflare Web Analytics (cookieless) |
| **Email capture** | Formspree (no backend) |
| **Markdown / fonts** | `marked.js` (CDN) · Google Fonts (Inter, Plus Jakarta Sans, Newsreader, JetBrains Mono) |
| **Domain** | `.in` via the National Internet Exchange of India (NIXI) registry |

---

## 🚀 Build & deploy

There are **two pipelines**, one per half of the stack.

**1 · The site (automatic, on every push to `main`)** — `.github/workflows/pages.yml` runs three zero-dependency Node scripts, then deploys to GitHub Pages:

- `scripts/build-toc.js` → regenerates the Library registry (`assets/js/toc.data.js`) from every lesson's frontmatter.
- `scripts/build-seo.js` → generates a crawlable `/library/<id>/` page per lesson, plus `sitemap.xml` and `robots.txt`.
- `scripts/build-samples.js` → regenerates `samples/manifest.json` from the sample files.

Add a lesson (`content/*.md`) or a sample (`samples/*.json`), push, and everything regenerates itself. Nothing is hardcoded.

**2 · The transform API (manual, from `/transform-api`)** — deployed to Render as a Docker service (root directory `transform-api`, using its `Dockerfile`). It reads `$PORT`, so it drops onto Render / Railway / Cloud Run unchanged. See [`transform-api/README.md`](./transform-api/README.md).

---

## 💻 Local development

**The site** (any static server; no build needed to view):

```bash
# from the repo root — e.g. VS Code Live Server on port 5500, or:
npx serve .
# then open http://localhost:5500
# after adding a lesson or sample, refresh the generated files:
node scripts/build-toc.js && node scripts/build-samples.js
```

**The API** (JDK 17+ and Maven):

```bash
cd transform-api
mvn spring-boot:run          # → http://localhost:8080
curl http://localhost:8080/api/health
```

To point the Playground at your local API during development, change `TRANSFORM_API` at the top of `assets/js/transformer.js` to `http://localhost:8080`.

---

## ✍️ Adding a lesson

Lessons are Markdown with a tiny frontmatter contract and a few custom tokens (`{{flow}}`, `{{check}}`, `{{embed}}`, `{{link}}`). The **golden rule**: every lesson opens with a human question and only reaches XML at the very end. Full authoring guide, design system, and teaching philosophy are in [`docs/HANDBOOK.md`](./docs/HANDBOOK.md).

---

## 📈 Status & monitoring

- **Live status page:** [iso20022academy.in/status](https://iso20022academy.in/status/) — a real-time health check of the site and the transform engine, with response times.
- **Footer pill:** every page shows a pulsing **"Page status: Live"** indicator that turns red if the engine is unreachable.
- **UptimeRobot** keeps the free Render instance warm so visitors don't hit cold starts.

---

## 🎯 Objective & status

**Objective:** be the definitive place to *learn* ISO 20022 — clarity over coverage, understanding before implementation — and to prove the concepts with a working, real-world transformation engine rather than screenshots.

**Status:** Live and complete. The academy (History, Library, Playground, Glossary), the static-JSON catalogue, the SEO layer, the live MT ⇄ MX backend, and the monitoring/status stack are all in production.

---

## 🙏 Credits

Designed, written, and built by **[Revanth Sai Rayapati](https://www.linkedin.com/in/revanth-sai-2002/)**.

Standing on the shoulders of the open-source **[Prowide](https://www.prowidesoftware.com/)** libraries, **Spring Boot**, and **marked.js**. All lesson content is original.

> Money stopped being something you move. It became something you *describe* — and the description has to survive the journey. This is a place to learn that language.
