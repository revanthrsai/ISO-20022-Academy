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
//   {{embed:page:journey|Label}}          → navigates to any page
//   {{link:explorer:PACS.008|pacs.008}}   → inline link variant
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
        const html = toHtml(expandEmbeds(body));
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
            return `
                <section class="learn-level" data-reveal="up">
                    <div class="learn-level-head">
                        <span class="learn-level-num">${lvl}</span>
                        <div>
                            <h3 class="learn-level-name">${esc(meta.name)}</h3>
                            <p class="learn-level-blurb">${esc(meta.blurb)}</p>
                        </div>
                    </div>
                    <div class="learn-grid">${cards}</div>
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
            ${sections}`;
    }

    function cardHtml(a) {
        const draft = a.status === 'draft';
        const tags = (a.tags || []).slice(0, 3)
            .map(t => `<span class="learn-tag">${esc(t)}</span>`).join('');
        return `
            <article class="learn-card${draft ? ' is-draft' : ''}" role="button" tabindex="0"
                onclick="openArticle('${a.id}')"
                onkeydown="if(event.key==='Enter'){openArticle('${a.id}')}">
                <div class="learn-card-top">
                    <span class="learn-card-num">${a.num}</span>
                    ${draft ? '<span class="learn-card-status">Draft</span>'
                            : '<span class="learn-card-min">' + a.minutes + ' min read</span>'}
                </div>
                <h4 class="learn-card-title">${esc(a.title)}</h4>
                <p class="learn-card-summary">${esc(a.summary)}</p>
                <div class="learn-card-foot">
                    <div class="learn-tags">${tags}</div>
                    <span class="learn-card-go" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </span>
                </div>
            </article>`;
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

        return `
            <article class="article-page">
                <button class="article-back" onclick="navigate('library')">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
                    The Library
                </button>

                <header class="article-head">
                    <div class="article-kicker">
                        <span class="article-level-pill">${esc(lvl.tag || lvl.name)}</span>
                        ${minutes ? '<span class="article-min">' + minutes + ' min read</span>' : ''}
                    </div>
                    <h1 class="article-title">${esc(title)}</h1>
                    ${meta.summary ? '<p class="article-standfirst">' + esc(meta.summary) + '</p>' : ''}
                </header>

                <div class="md-body">${html}</div>
                ${earned}
                ${relatedHtml}
            </article>`;
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

    // Reflect "Learn" as the active section while reading.
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const learnNav = document.querySelector('.nav-item[data-page="learn"]');
    if (learnNav) learnNav.classList.add('active');
    if (typeof moveNavIndicator === 'function') moveNavIndicator();

    content.innerHTML = '<div class="page"><div class="article-loading">Loading the article…</div></div>';
    try {
        const loaded = await Articles.load(id);
        content.innerHTML = Articles.articleHtml(loaded);
        if (window.Motion) Motion.scan(content);
    } catch (e) {
        content.innerHTML = `<div class="page"><div class="article-error">
            <h3>That article wouldn't load.</h3>
            <p>${(e && e.message) ? e.message : 'Unknown error.'}</p>
            <button class="article-back" onclick="navigate('library')">← Back to the Library</button>
        </div></div>`;
    }
}
