# ISO 20022 Academy

A course, not a reference. Learn the language of modern payments — from how money
actually moves to reading and validating real ISO 20022 messages — through long-form
lessons that always start with a human problem, never a tag. Built with plain HTML,
CSS, and JavaScript: no frameworks, no build step.

## Running it

Open `index.html` in a browser. That's it — no install, no server required.
(To refresh the Library index after adding articles locally: `node scripts/build-toc.js`.)

## Sections

- **The History** — five cinematic chapters on how the world's money messaging evolved:
  from paper and telegrams, through SWIFT MT, to the ISO 20022 migration. Routed at
  `#/history/<chapter-slug>`.
- **The Library** — long-form lessons shelved by level (100 Fundamentals → 600 Field
  Guides), each following the nine-beat Lesson Spine from `docs/HANDBOOK.md`. Includes
  knowledge checks, a persisted "mark as learned" toggle, and beat-4 flow diagrams.
  Lessons live as Markdown in `content/`, published via Decap CMS at `/admin`, routed
  at `#/library`.
- **The Playground** — five integrated tools that share one message hand-off: XML Viewer,
  Transformer (MT ⇄ MX), Validator, Comparator, and a Sample Message Library. Routed at
  `#/playground/<tool>`.
- **The Glossary** — 87 searchable, category-filtered payment terms with cross-links into
  the Library and Playground. Routed at `#/glossary`.

## File structure

```
index.html                 page shell: header/nav, content container, script includes
netlify.toml               deploy config: TOC build command, redirects
package.json               repo metadata (no runtime dependencies)
content/*.md               the Library lessons (frontmatter + Markdown + tokens)
admin/                     Decap CMS (config.yml + entry page) — publish at /admin
scripts/build-toc.js       generates assets/js/toc.data.js from content/ frontmatter
assets/css/style.css       all styling; :root is the design-token source of truth
assets/js/app.js           routing (hash), page templates, History chapters
assets/js/toc.js           Library shelf definitions + lookup helpers
assets/js/toc.data.js      GENERATED article registry — do not edit by hand
assets/js/markdown.js      lesson engine: frontmatter, Markdown, {{embed}}/{{check}}/{{flow}} tokens
assets/js/flow-diagram.js  beat-4 business-terms flow diagram component
assets/js/data.js          glossary terms + Progress store (localStorage)
assets/js/ui.js            glossary rendering, detail panel, theme toggle
assets/js/xml-viewer.js    Playground: XML tree viewer
assets/js/transformer.js   Playground: MT ⇄ MX transformer
assets/js/validator.js     Playground: message validator
assets/js/comparator.js    Playground: message comparator
assets/js/samples.js       Playground: sample message library
assets/js/motion.js        motion design system (reduced-motion gated)
assets/js/preloader.js     one-time intro animation
docs/HANDBOOK.md           THE project doc: vision, philosophy, IA, design system,
                           code map, authoring guide (§6), content roadmap
```

## Documentation

Everything lives in one curated file: **`docs/HANDBOOK.md`**. Writing an
article? Jump straight to §6 (Authoring & Publishing).

This repo is still under development — feel free to reach out for updates if you like it!
