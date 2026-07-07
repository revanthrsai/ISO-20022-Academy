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
        const html = toHtml(expandChecks(expandFlows(expandEmbeds(body)), id));
        cache[id] = { entry, meta, html };
        return cache[id];
    }

    // ---- The Learn index (grouped by level) ------------------------------
    function indexHtml() {
        const levels = Object.keys(ACADEMY_LEVELS).map(Number).sort((a, b) => a - b);
        const sections = levels.map(lvl => {
            const meta = ACADEMY_LEVELS[lvl];
            const items = getArticlesByLevel(lvl);
            if (!items.length) return '';
            const cards = items.map(cardHtml).join('');
            const published = items.filter(a => a.status !== 'draft');
            const done = (typeof Progress !== 'undefined')
                ? published.filter(a => Progress.isLearned(a.id)).length : 0;
            const pct = published.length ? Math.round(done / published.length * 100) : 0;
            const complete = published.length > 0 && done === published.length;
            const countHtml = complete
                ? `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Shelf complete`
                : `${done}/${published.length} learned`;
            const shelfProgress = published.length ? `
                        <div class="shelf-progress${done ? '' : ' is-empty'}${complete ? ' is-complete' : ''}" aria-label="${complete ? 'Shelf complete' : done + ' of ' + published.length + ' lessons learned'}">
                            <span class="shelf-progress-count">${countHtml}</span>
                            <span class="shelf-progress-track"><span class="shelf-progress-fill" style="width:${pct}%"></span></span>
                        </div>` : '';
            return `
                <section class="learn-level" data-reveal="up">
                    <div class="learn-level-head">
                        <span class="learn-level-num">${lvl}</span>
                        <div>
                            <h3 class="learn-level-name">${esc(meta.name)}</h3>
                            <p class="learn-level-blurb">${esc(meta.blurb)}</p>
                        </div>${shelfProgress}
                    </div>
                    <div class="learn-grid">${cards}</div>
                    ${(typeof Quiz !== 'undefined' && Quiz.ctaHtml) ? Quiz.ctaHtml(lvl) : ''}
                </section>`;
        }).join('');

        return `
            <div class="learn-head" data-reveal-group>
                <div class="eyebrow" data-reveal="fade">The Library</div>
                <h2 class="section-title" data-reveal="up">Read your way up.</h2>
                <p class="section-description" data-reveal="up">
                    Long-form articles, each starting with a problem — never a tag. Climb from how money
                    physically moves (100) through the standard's architecture (200), into message-by-message
                    deep dives (300), and out to the exceptions that break payments in the real world (400).
                </p>
            </div>
            ${progressNote()}
            ${sections}`;
    }

    function cardHtml(a) {
        const draft = a.status === 'draft';
        const learned = (typeof Progress !== 'undefined') && Progress.isLearned(a.id);
        const tags = (a.tags || []).slice(0, 3)
            .map(t => `<span class="learn-tag">${esc(t)}</span>`).join('');
        return `
            <article class="learn-card${draft ? ' is-draft' : ''}${learned ? ' is-learned' : ''}" role="button" tabindex="0"
                onclick="openArticle('${a.id}')"
                onkeydown="if(event.key==='Enter'){openArticle('${a.id}')}">
                <div class="learn-card-top">
                    <span class="learn-card-num">${a.num}</span>
                    ${draft ? '<span class="learn-card-status">Draft</span>'
                            : learned ? '<span class="learn-card-done"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Learned</span>'
                            : '<span class="learn-card-min">' + a.minutes + ' min read</span>'}
                </div>
                <h4 class="learn-card-title">${titleHtml(a.title, 'title-tail title-tail-sm')}</h4>
                <p class="learn-card-summary">${esc(a.summary)}</p>
                <div class="learn-card-foot">
                    <div class="learn-tags">${tags}</div>
                    <span class="learn-card-go" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </span>
                </div>
            </article>`;
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
                    <button class="article-back" onclick="navigate('library')">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
                        The Library
                    </button>
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
}
