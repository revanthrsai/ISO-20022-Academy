// ===========================================================================
// markdown.js  —  Markdown article engine (frontmatter + marked.js + embeds)
// ===========================================================================
//
// Fetches a /content/*.md file, splits its YAML frontmatter from the body,
// expands {{embed:...}} / {{link:...}} tokens into interactive cards/links,
// renders the body with marked.js (loaded from CDN in index.html), and builds
// both the Learn index and a single-article view — styled to feel native to
// the academy (see style.css § 15. ARTICLES).
//
// Global API (called from app.js routing):
//   renderArticleIndex()   — fill #learn-root with the grouped table of contents
//   openArticle(id)        — fetch + render one article into #content
//
// Embed tokens (each on its own line for a card; inline for a link):
//   {{embed:playground|Label}}            → opens the Playground
//   {{embed:explorer:PACS.008|Label}}     → opens that message in the Explorer
//   {{embed:page:glossary|Label}}         → navigates to any page
//   {{embed:article:505-...|Label}}        → opens a Library lesson
//   {{link:explorer:PACS.008|pacs.008}}   → inline link variant
//   {{flow:Title|Stop ~ caption|-> label|Stop ~ caption}}
//                                         → beat-4 business flow (flow-diagram.js)
// ---------------------------------------------------------------------------

const Articles = (function () {

    const cache = {};   // id -> { meta, html }

    // ---- YAML frontmatter (a deliberately small subset) -------------------
    function splitFrontmatter(raw) {
        const text = raw.replace(/^\uFEFF/, '');
        if (!text.startsWith('---')) return { meta: {}, body: text };
        const end = text.indexOf('\n---', 3);
        if (end === -1) return { meta: {}, body: text };
        const block = text.slice(3, end).trim();
        const body = text.slice(end + 4).replace(/^\s*\n/, '');
        return { meta: parseYaml(block), body };
    }

    // Supports: key: scalar  ·  key: "quoted"  ·  key: [a, b, c]
    function parseYaml(block) {
        const meta = {};
        block.split('\n').forEach(line => {
            if (!line.trim() || /^\s*#/.test(line)) return;
            const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
            if (!m) return;
            const key = m[1];
            let val = m[2].trim();
            if (val.startsWith('[') && val.endsWith(']')) {
                val = val.slice(1, -1).split(',')
                    .map(s => unquote(s.trim())).filter(Boolean);
            } else {
                val = unquote(val);
                if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
            }
            meta[key] = val;
        });
        return meta;
    }
    function unquote(s) {
        if ((s.startsWith('"') && s.endsWith('"')) ||
            (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
        return s;
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ---- Split-title treatment (premium heading) ---------------------------
    // "What Is Money? The IOU You Forgot Was an IOU" → main "What Is Money?"
    // + tail "The IOU You Forgot Was an IOU" (rendered soft-blurred, sharpens
    // on hover). Splits at the first '?' (kept) or ':' (dropped).
    function splitTitle(t) {
        t = String(t || '');
        const q = t.indexOf('?');
        const c = t.indexOf(':');
        let cut = -1, keep = 0;
        if (q !== -1 && (c === -1 || q < c)) { cut = q; keep = 1; }
        else if (c !== -1) { cut = c; keep = 0; }
        if (cut === -1 || cut >= t.length - 2) return { main: t, tail: '' };
        return {
            main: t.slice(0, cut + keep).trim(),
            tail: t.slice(cut + 1).trim()
        };
    }
    function titleHtml(t, tailClass) {
        const p = splitTitle(t);
        return esc(p.main) + (p.tail
            ? ` <span class="${tailClass}">${esc(p.tail)}</span>` : '');
    }

    // ---- {{embed}} / {{link}} expansion -----------------------------------
    function actionFor(spec) {
        // spec like "playground" | "explorer:PACS.008" | "page:journey"
        const parts = spec.split(':');
        const kind = parts[0];
        const arg = parts[1];
        if (kind === 'playground') {
            return { onclick: "navigate('playground')", kicker: 'Interactive',
                     title: 'Open the live Playground',
                     sub: 'Edit an MT103 and watch the pacs.008 rebuild — with live validation.' };
        }
        if (kind === 'explorer' && arg) {
            return { onclick: `openDetailPanel('${esc(arg)}')`, kicker: 'Message Explorer',
                     title: 'Inspect ' + esc(arg),
                     sub: 'Open the full lesson node for this message — story, fields, and what breaks.' };
        }
        if (kind === 'article' && arg) {
            const art = (typeof getArticle === 'function') ? getArticle(arg) : null;
            return { onclick: `openArticle('${esc(arg)}')`, kicker: 'Lesson',
                     title: art ? esc(art.title) : ('Open ' + esc(arg)),
                     sub: art && art.summary ? esc(art.summary)
                          : 'Open this lesson in the Library.' };
        }
        if (kind === 'page' && arg) {
            const labels = { journey: 'Open the Learning Journey', history: 'Open the History',
                             glossary: 'Open the Glossary', playground: 'Open the Playground' };
            return { onclick: `navigate('${esc(arg)}')`, kicker: 'Go to',
                     title: labels[arg] || ('Open ' + esc(arg)),
                     sub: 'Jump to the interactive ' + esc(arg) + ' view.' };
        }
        return null;
    }

    function expandEmbeds(body) {
        // Block cards: a whole line that is just {{embed:...}}
        body = body.replace(/^[ \t]*\{\{embed:([^}]+)\}\}[ \t]*$/gm, (full, inner) => {
            const [spec, label] = inner.split('|');
            const a = actionFor(spec.trim());
            if (!a) return full;
            const title = label ? esc(label.trim()) : a.title;
            return `\n<div class="md-embed" role="button" tabindex="0" onclick="${a.onclick}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${a.onclick}}">`
                + `<span class="md-embed-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>`
                + `<span class="md-embed-body"><span class="md-embed-kicker">${a.kicker}</span>`
                + `<span class="md-embed-title">${title}</span>`
                + `<span class="md-embed-sub">${a.sub}</span></span>`
                + `<span class="md-embed-go">Open</span></div>\n`;
        });
        // Inline links
        body = body.replace(/\{\{link:([^}]+)\}\}/g, (full, inner) => {
            const [spec, label] = inner.split('|');
            const a = actionFor(spec.trim());
            if (!a) return full;
            const text = label ? esc(label.trim()) : a.title;
            return `<a class="md-inline-link" href="javascript:void(0)" onclick="${a.onclick}">${text}</a>`;
        });
        return body;
    }

    // ---- {{flow:...}} — beat-4 flow diagrams (Session 7.6) ----------------
    // One per line: {{flow:Title|Stop ~ caption|-> arrow label|Stop ~ caption}}
    // Rendered by the FlowDiagram module (assets/js/flow-diagram.js); animated
    // by motion.js's living process-map engine via the data-flow attribute.
    function expandFlows(body) {
        return body.replace(/^[ \t]*\{\{flow:([^}]+)\}\}[ \t]*$/gm, (full, inner) => {
            if (typeof FlowDiagram === 'undefined') return full;
            const html = FlowDiagram.html(inner);
            return html ? '\n' + html + '\n' : full;
        });
    }

    // ---- {{check:...}} — knowledge checks (Session 7.5) -------------------
    // One per line: {{check:Question?|Correct answer|Distractor|Distractor}}
    // The FIRST option is the correct one; options are shuffled at render.
    // Answers are recorded per lesson + question index in the Progress store.
    function expandChecks(body, articleId) {
        let qIndex = 0;
        return body.replace(/^[ \t]*\{\{check:([^}]+)\}\}[ \t]*$/gm, (full, inner) => {
            const parts = inner.split('|').map(s => s.trim()).filter(Boolean);
            if (parts.length < 3) return full;
            const q = parts[0];
            const options = parts.slice(1).map((text, i) => ({ text, correct: i === 0 }));
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }
            const opts = options.map(o =>
                `<button type="button" class="kc-opt" data-correct="${o.correct ? 1 : 0}" onclick="kcAnswer(this)">${esc(o.text)}</button>`
            ).join('');
            const idx = qIndex++;
            return `\n<div class="kc-card" data-lesson="${esc(articleId)}" data-q="${idx}"><div class="kc-kicker">Knowledge check</div><p class="kc-q">${esc(q)}</p><div class="kc-options">${opts}</div><p class="kc-result" role="status"></p></div>\n`;
        });
    }

    // ---- {{think}} … {{reveal}} … {{/think}} — Socratic derive-it-first ---
    // A challenge the reader reasons through before the reasoning unlocks. Both
    // halves are full markdown (rendered here, then passed through marked as an
    // opaque block). This is the spine of the Fundamentals hub.
    function expandThink(body) {
        return body.replace(
            /\{\{think\}\}\s*\n([\s\S]*?)\n\s*\{\{reveal\}\}\s*\n([\s\S]*?)\n\s*\{\{\/think\}\}/g,
            (full, prompt, reveal) => {
                const p = toHtml(expandEmbeds(prompt.trim()));
                const r = toHtml(expandEmbeds(reveal.trim()));
                return '\n\n<div class="md-think">'
                    + '<div class="md-think-head"><span class="md-think-badge">Your turn</span>'
                    + '<span class="md-think-hint">reason it out before you open it</span></div>'
                    + '<div class="md-think-prompt">' + p + '</div>'
                    + '<button type="button" class="md-think-btn" onclick="revealAnswer(this)">'
                    + 'Reveal the reasoning'
                    + '<span class="md-think-caret" aria-hidden="true">&darr;</span></button>'
                    + '<div class="md-think-reveal" hidden>' + r + '</div>'
                    + '</div>\n\n';
            });
    }

    // ---- {{aside:kind|Title}} … {{/aside}} — reference-grade hub callouts --
    // kind ∈ model | chair | breaks | map | ref. Inner is full markdown.
    const ASIDE_IC = {
        model:  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>',
        chair:  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 8 9 12 5 16"/><line x1="12" y1="16" x2="19" y2="16"/></svg>',
        breaks: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="17.1"/></svg>',
        map:    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="7" r="2"/><circle cx="18" cy="17" r="2"/><path d="M8 7h6a3 3 0 0 1 3 3v5"/></svg>',
        ref:    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>'
    };
    function expandAsides(body) {
        return body.replace(
            /\{\{aside:([a-z]+)\|([^}\n]*)\}\}\s*\n([\s\S]*?)\n\s*\{\{\/aside\}\}/g,
            (full, kind, title, inner) => {
                const ic = ASIDE_IC[kind] || '';
                const t = esc((title || '').trim());
                const bodyHtml = toHtml(expandEmbeds(inner.trim()));
                return '\n\n<div class="md-aside is-' + esc(kind) + '">'
                    + '<div class="md-aside-head"><span class="md-aside-ic" aria-hidden="true">' + ic + '</span>'
                    + '<span class="md-aside-title">' + t + '</span></div>'
                    + '<div class="md-aside-body">' + bodyHtml + '</div>'
                    + '</div>\n\n';
            });
    }

    // ---- marked.js (with a tiny offline fallback) -------------------------
    function toHtml(md) {
        if (window.marked) {
            const parse = window.marked.parse || window.marked;
            try {
                if (window.marked.setOptions) window.marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });
            } catch (e) { /* older/newer marked: ignore */ }
            return parse(md);
        }
        return fallbackMd(md);
    }

    // Minimal renderer so a dropped CDN doesn't leave a wall of raw text.
    function fallbackMd(md) {
        const blocks = md.split('\n\n');
        return blocks.map(b => {
            b = b.trim();
            if (!b) return '';
            if (/^<\w/.test(b)) return b;                                   // passthrough HTML (embeds)
            if (b.startsWith('```')) {
                return '<pre><code>' + esc(b.replace(/```[a-z]*\n?/g, '')) + '</code></pre>';
            }
            const h = b.match(/^(#{1,4})\s+(.*)$/);
            if (h) { const n = h[1].length; return `<h${n}>${inline(h[2])}</h${n}>`; }
            if (b.startsWith('>')) return `<blockquote>${inline(b.replace(/^>\s?/gm, ''))}</blockquote>`;
            if (/^[-*]\s+/.test(b)) {
                const items = b.split('\n').map(l => l.replace(/^[-*]\s+/, '')).map(t => `<li>${inline(t)}</li>`).join('');
                return `<ul>${items}</ul>`;
            }
            return `<p>${inline(b)}</p>`;
        }).join('\n');
        function inline(t) {
            return esc(t)
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
                .replace(/&lt;(\/?(div|span|a|svg|path)[^&]*?)&gt;/g, '<$1>'); // keep embed html
        }
    }

    // ---- Load + render one article ---------------------------------------
    async function load(id) {
        if (cache[id]) return cache[id];
        const entry = getArticle(id);
        if (!entry) throw new Error('Unknown article: ' + id);
        const res = await fetch('content/' + entry.file);
        if (!res.ok) throw new Error('Could not load ' + entry.file + ' (' + res.status + ')');
        const raw = await res.text();
        const { meta, body } = splitFrontmatter(raw);
        // Socratic + hub blocks first (they render their own inner markdown),
        // then the inline/flow/check tokens, then marked for the rest.
        const pre = expandAsides(expandThink(body));
        const html = toHtml(expandChecks(expandFlows(expandEmbeds(pre)), id));
        cache[id] = { entry, meta, html };
        return cache[id];
    }

    // ---- The Learn index (grouped by level) ------------------------------
    // ---- The Library index: a course outline --------------------------------
    // Sections (100 Fundamentals, 200 Architecture, …) are collapsed rows; a
    // click opens one to its numbered chapters. Open sections are remembered on
    // this device. Each chapter is a real <a href> to its static /library/ page
    // so crawlers can follow it; a normal click opens it in the app instead.
    const OUTLINE_KEY = 'academy.library.open';
    function openSections() {
        try { return JSON.parse(localStorage.getItem(OUTLINE_KEY) || '[]').map(Number); }
        catch (e) { return []; }
    }

    function lessonRowHtml(a) {
        const draft = a.status === 'draft';
        const learned = !draft && (typeof Progress !== 'undefined') && Progress.isLearned(a.id);
        const t = splitTitle(a.title);
        const state = draft ? '<span class="cs-state is-soon">Coming soon</span>'
            : learned ? '<span class="cs-state is-done"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Learned</span>'
            : `<span class="cs-state">${a.minutes} min</span>`;
        const inner = `
                        <span class="cs-num">${a.num}</span>
                        <span class="cs-title"><span class="cs-title-main">${esc(t.main)}</span>${t.tail ? `<span class="cs-title-tail">${esc(t.tail)}</span>` : ''}</span>
                        ${state}`;
        return draft
            ? `<li class="cs-lesson is-draft"><span class="cs-lesson-row">${inner}</span></li>`
            : `<li class="cs-lesson${learned ? ' is-learned' : ''}"><a class="cs-lesson-row" href="/library/${a.id}/"
                    onclick="if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey){event.preventDefault();openArticle('${a.id}')}">${inner}</a></li>`;
    }

    function indexHtml() {
        const levels = Object.keys(ACADEMY_LEVELS).map(Number).sort((a, b) => a - b);
        const opened = openSections();
        let totalMinutes = 0;
        const sections = levels.map(lvl => {
            const meta = ACADEMY_LEVELS[lvl];
            const items = getArticlesByLevel(lvl);
            if (!items.length) return '';
            const published = items.filter(a => a.status !== 'draft');
            const minutes = published.reduce((s, a) => s + (Number(a.minutes) || 0), 0);
            totalMinutes += minutes;
            const done = (typeof Progress !== 'undefined')
                ? published.filter(a => Progress.isLearned(a.id)).length : 0;
            const pct = published.length ? Math.round(done / published.length * 100) : 0;
            const complete = published.length > 0 && done === published.length;
            const progress = done
                ? `<span class="cs-progress${complete ? ' is-complete' : ''}" aria-label="${done} of ${published.length} learned"><span class="cs-progress-track"><span class="cs-progress-fill" style="width:${pct}%"></span></span>${complete ? 'Complete' : done + '/' + published.length}</span>`
                : '';
            return `
                <li class="cs-item">
                    <details class="course-sec" data-level="${lvl}"${opened.includes(lvl) ? ' open' : ''} ontoggle="Articles.rememberSection(this)">
                        <summary class="cs-head">
                            <span class="cs-code">${lvl}</span>
                            <span class="cs-head-text">
                                <span class="cs-name">${esc(meta.name)}</span>
                                <span class="cs-blurb">${esc(meta.blurb)}</span>
                            </span>
                            <span class="cs-meta">${items.length} chapters &middot; ${minutes} min</span>
                            ${progress}
                            <span class="cs-chev" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>
                        </summary>
                        <div class="cs-body">
                            <ol class="cs-lessons">${items.map(lessonRowHtml).join('')}</ol>
                            ${(typeof Quiz !== 'undefined' && Quiz.ctaHtml) ? Quiz.ctaHtml(lvl).replace(' data-reveal="up"', '') : ''}
                        </div>
                    </details>
                </li>`;
        }).join('');

        const termCount = (typeof DATA !== 'undefined' && DATA.glossary) ? DATA.glossary.length : 0;
        // Honest proof numbers for the hero strip — counted from the data, never typed in.
        const lessonCount = (typeof ACADEMY_TOC !== 'undefined')
            ? ACADEMY_TOC.filter(a => a.status !== 'draft').length : 0;
        const workshopCount = (typeof WORKSHOPS !== 'undefined' && Array.isArray(WORKSHOPS.LIST))
            ? WORKSHOPS.LIST.length : 0;
        const hours = Math.round(totalMinutes / 6) / 10;

        // The Library is the site's front door: a short course header, then the
        // full course outline filling the page. The Glossary is reached from the
        // footer and ⌘K, so it no longer competes here.
        return `
            <div class="course">
                <div class="learn-head course-head" data-reveal-group>
                    <div class="learn-head-copy">
                        <div class="eyebrow" data-reveal="fade">The course &middot; free &middot; no signup</div>
                        <h1 class="section-title" data-reveal="up">Learn ISO&nbsp;20022 the way you wish someone had taught you.</h1>
                        <p class="section-description" data-reveal="up">
                            ${levels.length} sections, from &ldquo;what is money&rdquo; to reading a real pacs.008.
                            Open a section to see its chapters, or start at the beginning.
                        </p>
                        <div class="learn-hero-ctas" data-reveal="up">
                            <button class="learn-hero-cta learn-hero-cta-primary" onclick="openArticle('101-what-is-money')">Start with Chapter&nbsp;101 &rarr;</button>
                            <button class="learn-hero-cta" onclick="dictHome(event)">Open the Playground</button>
                        </div>
                        <div class="learn-hero-proof" data-reveal="up" aria-label="What's inside">
                            <span>${lessonCount} lessons</span><span class="learn-hero-proof-dot" aria-hidden="true">&middot;</span>
                            <span>about ${hours} hours</span><span class="learn-hero-proof-dot" aria-hidden="true">&middot;</span>
                            <span>${workshopCount} workshops</span><span class="learn-hero-proof-dot" aria-hidden="true">&middot;</span>
                            <span>${termCount} glossary terms</span>
                        </div>
                    </div>
                </div>
                ${(typeof Progress !== 'undefined' && Progress.learnedCount()) ? progressNote() : ''}
                <div class="course-bar">
                    <span class="course-bar-label">Course outline</span>
                    <button type="button" class="course-toggle" onclick="Articles.toggleAllSections(this)">Expand all</button>
                </div>
                <ol class="course-outline">${sections}</ol>
            </div>`;
    }

    function rememberSection(el) {
        try {
            const set = new Set(openSections());
            const lvl = Number(el.dataset.level);
            if (el.open) set.add(lvl); else set.delete(lvl);
            localStorage.setItem(OUTLINE_KEY, JSON.stringify([...set]));
        } catch (e) { /* storage blocked — the outline still works, it just forgets */ }
        const btn = document.querySelector('.course-toggle');
        if (btn) btn.textContent = document.querySelector('.course-sec:not([open])') ? 'Expand all' : 'Collapse all';
    }

    function toggleAllSections(btn) {
        const all = [...document.querySelectorAll('.course-sec')];
        const open = all.some(d => !d.open);
        all.forEach(d => { d.open = open; });
        if (btn) btn.textContent = open ? 'Collapse all' : 'Expand all';
    }

    // ---- On-this-page TOC: give every h2 an id, collect the outline -------
    function outline(html) {
        const items = [];
        const withIds = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, inner) => {
            const text = inner.replace(/<[^>]+>/g, '')
                .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&').trim();
            let id = 'sec-' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            let n = 2;
            while (items.some(i => i.id === id)) id = id + '-' + n++;
            items.push({ id, text });
            return `<h2 id="${id}">${inner}</h2>`;
        });
        return { withIds, items };
    }

    // ---- The single-article view -----------------------------------------
    function articleHtml(loaded) {
        const { entry, meta, html } = loaded;
        const lvl = ACADEMY_LEVELS[entry.level] || { name: '', tag: '' };
        const title = meta.title || entry.title;
        const minutes = meta.minutes || entry.minutes;
        const related = (meta.related || entry.related || [])
            .map(getArticle).filter(a => a && a.id !== entry.id);

        const relatedHtml = related.length ? `
            <div class="article-related">
                <div class="article-related-label">Keep reading</div>
                <div class="article-related-grid">
                    ${related.map(r => `
                        <a class="article-related-card" href="javascript:void(0)" onclick="openArticle('${r.id}')">
                            <span class="article-related-num">${r.num}</span>
                            <span class="article-related-title">${esc(r.title)}</span>
                        </a>`).join('')}
                </div>
            </div>` : '';

        const earned = (meta.earnedSkill) ? `
            <div class="article-earned">
                <div class="article-earned-badge">You can now</div>
                <p>${esc(meta.earnedSkill)}</p>
            </div>` : '';

        const toc = outline(html);
        const tocHtml = toc.items.length > 1 ? `
            <aside class="article-toc" aria-label="On this page">
                <div class="article-toc-label">On this page</div>
                <nav class="article-toc-list">
                    ${toc.items.map(i => `<a class="article-toc-link" href="javascript:void(0)" data-target="${i.id}" onclick="articleTocGo('${i.id}')">${esc(i.text)}</a>`).join('')}
                </nav>
            </aside>` : '';

        return `
            <div class="article-layout${tocHtml ? ' has-toc' : ''}">
            <article class="article-page">
                <div class="article-topbar">
                    <button class="article-share" onclick="shareArticle('${entry.id}', this)" aria-label="Share this lesson" title="Copy a link to this lesson">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>
                        <span class="article-share-label">Share</span>
                    </button>
                </div>

                <header class="article-head">
                    <div class="article-kicker">
                        <span class="article-level-pill">${esc(lvl.tag || lvl.name)}</span>
                        ${minutes ? '<span class="article-min">' + minutes + ' min read</span>' : ''}
                    </div>
                    <h1 class="article-title">${titleHtml(title, 'title-tail')}</h1>
                    ${meta.summary ? '<p class="article-standfirst">' + esc(meta.summary) + '</p>' : ''}
                </header>

                <div class="md-body">${toc.withIds}</div>
                ${earned}
                ${learnedRowHtml(entry.id)}
                ${relatedHtml}
            </article>
            ${tocHtml}
            </div>`;
    }

    // ---- "Mark as learned" (Session 7.5) ----------------------------------
    function learnedRowHtml(id) {
        const learned = (typeof Progress !== 'undefined') && Progress.isLearned(id);
        return `
            <div class="article-learned-row">
                <button type="button" class="learned-toggle${learned ? ' is-learned' : ''}" onclick="toggleLearned('${id}', this)" aria-pressed="${learned}">
                    <span class="learned-tick" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>
                    <span class="learned-label">${learned ? 'Learned' : 'Mark as learned'}</span>
                </button>
                <span class="learned-hint">${learned ? 'Saved — this lesson shows as learned in the Library.' : 'Track your progress — saved on this device.'}</span>
            </div>`;
    }

    // ---- Library progress note (Session 7.5) ------------------------------
    function progressNote() {
        if (typeof Progress === 'undefined' || typeof ACADEMY_TOC === 'undefined') return '';
        const n = Progress.learnedCount();
        const total = ACADEMY_TOC.length;
        if (!n) {
            const first = (typeof getArticlesByLevel === 'function' && (getArticlesByLevel(100) || [])
                .filter(a => a.status !== 'draft')[0]) || null;
            if (!first) return '';
            return `<div class="learn-progress" data-reveal="fade">
                New here? Start with
                <a href="javascript:void(0)" class="learn-progress-start" onclick="openArticle('${first.id}')">${esc(first.title.split(/[?:]/)[0])}</a>
                and read your way up the shelves. Finish a lesson and mark it learned — the shelves keep your place.</div>`;
        }
        return `<div class="learn-progress" data-reveal="fade"><span class="learn-progress-count">${n} of ${total}</span> lessons marked learned</div>`;
    }

    return {
        load,
        indexHtml,
        rememberSection,
        toggleAllSections,
        articleHtml,
        // expose for debugging
        _splitFrontmatter: splitFrontmatter
    };
})();

// ---- Globals the router calls --------------------------------------------
function renderArticleIndex() {
    const root = document.getElementById('learn-root');
    if (!root) return;
    root.innerHTML = Articles.indexHtml();
    if (window.Motion) Motion.scan(root);
}

// ---- Floating "back to the Library" button ---------------------------------
// Lessons have no side rail; one button, pinned bottom-right, is the way back.
// It lives on <body> (the page wrapper animates with a transform, which would
// trap position:fixed) and removes itself as soon as the article is gone,
// whichever route replaced it.
let __backFabObserver = null;
function showArticleBack(content) {
    let btn = document.getElementById('article-back-fab');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'article-back-fab';
        btn.type = 'button';
        btn.className = 'article-back-fab';
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg><span>The Library</span>';
        btn.addEventListener('click', () => navigate('library'));
        document.body.appendChild(btn);
    }
    if (__backFabObserver) __backFabObserver.disconnect();
    if (typeof MutationObserver !== 'undefined' && content) {
        __backFabObserver = new MutationObserver(() => {
            if (!content.querySelector('.article-page')) hideArticleBack();
        });
        __backFabObserver.observe(content, { childList: true });
    }
}
function hideArticleBack() {
    if (__backFabObserver) { __backFabObserver.disconnect(); __backFabObserver = null; }
    const btn = document.getElementById('article-back-fab');
    if (btn) btn.remove();
}

async function openArticle(id) {
    const content = document.getElementById('content');
    if (!content) return;
    closeDetailPanel();
    window.scrollTo({ top: 0, behavior: 'auto' });

    // Record reading context so the header arrows step between articles.
    window.__currentArticle = id;
    window.__currentHistory = null;

    // Keep the Library lit in the global nav while reading an article.
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const libNav = document.querySelector('.nav-item[data-page="library"]');
    if (libNav) libNav.classList.add('active');
    if (typeof moveNavIndicator === 'function') moveNavIndicator();
    if (typeof updateNavArrows === 'function') updateNavArrows();

    content.innerHTML = '<div class="page"><div class="article-loading">Loading the article…</div></div>';
    try {
        const loaded = await Articles.load(id);
        content.innerHTML = Articles.articleHtml(loaded);
        showArticleBack(content);
        if (window.Motion) Motion.scan(content);
        initArticleToc();
    } catch (e) {
        content.innerHTML = `<div class="page"><div class="article-error">
            <h3>That article wouldn't load.</h3>
            <p>${(e && e.message) ? e.message : 'Unknown error.'}</p>
            <button class="article-back" onclick="navigate('library')">← Back to the Library</button>
        </div></div>`;
    }
}

// ---- On-this-page TOC: smooth-scroll + scroll-spy --------------------------
let __tocObserver = null;
function articleTocGo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function initArticleToc() {
    if (__tocObserver) { __tocObserver.disconnect(); __tocObserver = null; }
    const links = Array.from(document.querySelectorAll('.article-toc-link'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    const heads = links
        .map(l => document.getElementById(l.getAttribute('data-target')))
        .filter(Boolean);
    const setActive = (id) => links.forEach(l =>
        l.classList.toggle('is-on', l.getAttribute('data-target') === id));
    __tocObserver = new IntersectionObserver((entries) => {
        // The active section is the last heading above the reading line.
        const line = window.innerHeight * 0.3;
        let current = heads[0] && heads[0].id;
        for (const h of heads) {
            if (h.getBoundingClientRect().top <= line) current = h.id;
        }
        if (current) setActive(current);
    }, { rootMargin: '-20% 0px -60% 0px', threshold: [0, 1] });
    heads.forEach(h => __tocObserver.observe(h));
    if (heads[0]) setActive(heads[0].id);
}

// ---- Share a lesson by link (Track 2) -------------------------------------
// Builds the deep link (#/library/<id>) that routeOnLoad/hashchange resolve to
// this exact article. Uses the native share sheet on mobile, clipboard on
// desktop, with inline "Copied" feedback.
function shareArticle(id, btn) {
    const url = location.origin + location.pathname + '#/library/' + id;
    const titleEl = document.querySelector('.article-title');
    const title = (titleEl ? titleEl.textContent.trim() : 'ISO 20022 Academy') + ' — ISO 20022 Academy';
    const flash = (text) => {
        const label = btn && btn.querySelector('.article-share-label');
        if (!label) return;
        const prev = label.textContent;
        label.textContent = text;
        btn.classList.add('is-copied');
        setTimeout(() => { label.textContent = prev; btn.classList.remove('is-copied'); }, 1800);
    };
    const copy = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => flash('Link copied ✓')).catch(() => legacyCopy());
        } else legacyCopy();
    };
    const legacyCopy = () => {
        try {
            const ta = document.createElement('textarea');
            ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta); flash('Link copied ✓');
        } catch (e) { flash('Copy failed'); }
    };
    if (navigator.share) {
        navigator.share({ title, url }).catch(() => { /* user dismissed — no-op */ });
    } else {
        copy();
    }
}

// ---- Socratic reveal (Fundamentals hub) -----------------------------------
function revealAnswer(btn) {
    const card = btn.closest('.md-think');
    if (!card) return;
    const rev = card.querySelector('.md-think-reveal');
    if (rev) rev.hidden = false;
    card.classList.add('is-open');
    btn.setAttribute('hidden', '');
}

// ---- Knowledge check + learned toggle handlers (Session 7.5) --------------
function kcAnswer(btn) {
    const card = btn.closest('.kc-card');
    if (!card || card.classList.contains('is-answered')) return;
    card.classList.add('is-answered');
    const correct = btn.getAttribute('data-correct') === '1';
    btn.classList.add(correct ? 'is-right' : 'is-wrong');
    card.querySelectorAll('.kc-opt').forEach(b => {
        b.disabled = true;
        if (b.getAttribute('data-correct') === '1') b.classList.add('is-answer');
    });
    const result = card.querySelector('.kc-result');
    if (result) {
        result.textContent = correct
            ? 'Correct.'
            : 'Not quite — the highlighted answer is the right one.';
        result.classList.add(correct ? 'is-right' : 'is-wrong');
    }
    if (typeof Progress !== 'undefined') {
        Progress.recordCheck(card.getAttribute('data-lesson'), Number(card.getAttribute('data-q')), correct);
    }
}

function toggleLearned(id, btn) {
    if (typeof Progress === 'undefined') return;
    const next = !Progress.isLearned(id);
    Progress.setLearned(id, next);
    btn.classList.toggle('is-learned', next);
    btn.setAttribute('aria-pressed', String(next));
    const label = btn.querySelector('.learned-label');
    if (label) label.textContent = next ? 'Learned' : 'Mark as learned';
    const hint = btn.parentElement && btn.parentElement.querySelector('.learned-hint');
    if (hint) {
        hint.textContent = next
            ? 'Saved — this lesson shows as learned in the Library.'
            : 'Track your progress — saved on this device.';
    }
    if (window.Spine) Spine.refresh(); // the rail's counts just changed
}
