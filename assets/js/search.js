// =============================================================================
// search.js  —  Site-wide command palette (Track 2 / task 14)
// -----------------------------------------------------------------------------
// A Raycast-style search across the whole Academy: lessons (ACADEMY_TOC),
// glossary terms (DATA.glossary), messages (DATA.messages), and the main pages.
// Open with the header button, Ctrl/Cmd-K, or "/". Keyboard-navigable
// (up/down/enter, Esc to close). Self-contained: one global `Search` object +
// global openSearch(), theme-aware injected styles, index built once (lazily).
// =============================================================================

const Search = (function () {
    let index = null;
    let overlay = null;
    let inputEl = null;
    let listEl = null;
    let results = [];
    let active = 0;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // ---- build the index once ----------------------------------------------
    function buildIndex() {
        const items = [];
        // Lessons
        if (typeof ACADEMY_TOC !== 'undefined') {
            ACADEMY_TOC.forEach(a => {
                if (a.status === 'draft') return;
                items.push({
                    type: 'Lesson', label: a.title, sub: a.summary || '',
                    kw: ((a.tags || []).join(' ') + ' ' + a.id + ' level ' + a.level).toLowerCase(),
                    badge: String(a.level), run: () => { if (typeof openArticle === 'function') openArticle(a.id); }
                });
            });
        }
        // Glossary
        if (typeof DATA !== 'undefined' && Array.isArray(DATA.glossary)) {
            DATA.glossary.forEach(t => {
                items.push({
                    type: 'Glossary', label: t.term, sub: t.definition || '',
                    kw: (t.slug + ' ' + (t.related || []).join(' ')).toLowerCase(),
                    badge: 'A–Z', run: () => { if (typeof gotoGlossaryTerm === 'function') gotoGlossaryTerm(t.slug); }
                });
            });
        }
        // Messages (Explorer)
        if (typeof DATA !== 'undefined' && DATA.messages) {
            Object.keys(DATA.messages).forEach(fam => {
                (DATA.messages[fam] || []).forEach(m => {
                    items.push({
                        type: 'Message', label: m.code || m.title, sub: m.purpose || m.subtitle || '',
                        kw: ((m.code || '') + ' ' + fam + ' ' + (m.useCases || []).join(' ')).toLowerCase(),
                        badge: fam, run: () => { if (typeof openDetailPanel === 'function') openDetailPanel(m.code); }
                    });
                });
            });
        }
        // Dictionary (messages + elements) — the reference tab
        if (typeof DICTIONARY !== 'undefined') {
            Object.keys(DICTIONARY.MESSAGES || {}).forEach(code => {
                const m = DICTIONARY.MESSAGES[code];
                items.push({ type: 'Dictionary', label: code, sub: m.name || '',
                    kw: (code + ' ' + (m.name || '') + ' ' + (m.mt || '')).toLowerCase(), badge: 'msg',
                    run: () => { if (typeof dictMessage === 'function') dictMessage(code); } });
            });
            Object.keys(DICTIONARY.ELEMENTS || {}).forEach(name => {
                const e = DICTIONARY.ELEMENTS[name];
                items.push({ type: 'Dictionary', label: name, sub: (e.def || '').split('. ')[0],
                    kw: name.toLowerCase(), badge: 'field',
                    run: () => { if (typeof dictElement === 'function') dictElement('', name); } });
            });
        }
        // Pages
        [['History', 'history'], ['Library', 'library'], ['Playground', 'playground'], ['Glossary', 'glossary'], ['Dictionary', 'dictionary']].forEach(([label, page]) => {
            items.push({ type: 'Page', label, sub: 'Go to the ' + label + ' section', kw: page, badge: '↵',
                run: () => { if (typeof navigate === 'function') navigate(page); } });
        });
        return items;
    }

    // ---- query ---------------------------------------------------------------
    function query(q) {
        q = (q || '').trim().toLowerCase();
        if (!index) index = buildIndex();
        if (!q) {
            // default: a few lessons to start
            return index.filter(i => i.type === 'Lesson').slice(0, 6);
        }
        const tokens = q.split(/\s+/);
        const scored = [];
        for (const it of index) {
            const label = it.label.toLowerCase();
            const hay = label + ' ' + (it.sub || '').toLowerCase() + ' ' + it.kw;
            if (!tokens.every(t => hay.includes(t))) continue;
            let score = 0;
            if (label === q) score = 200;
            else if (label.startsWith(q)) score = 120;
            else if (label.includes(q)) score = 80;
            else if (it.kw.includes(q)) score = 45;
            else score = 20;
            if (it.type === 'Lesson') score += 6; // gentle preference
            scored.push({ it, score });
        }
        scored.sort((a, b) => b.score - a.score || a.it.label.length - b.it.label.length);
        return scored.slice(0, 40).map(s => s.it);
    }

    // ---- render --------------------------------------------------------------
    function render(q) {
        results = query(q);
        active = 0;
        if (!results.length) {
            listEl.innerHTML = `<div class="sp-empty">No matches for “${esc(q)}”. Try a message code, a term, or a topic.</div>`;
            return;
        }
        listEl.innerHTML = results.map((it, i) => `
            <div class="sp-item${i === 0 ? ' is-active' : ''}" data-i="${i}" role="option" aria-selected="${i === 0}">
                <span class="sp-type">${esc(it.type)}</span>
                <span class="sp-main">
                    <span class="sp-label">${esc(it.label)}</span>
                    <span class="sp-sub">${esc((it.sub || '').slice(0, 96))}${(it.sub || '').length > 96 ? '…' : ''}</span>
                </span>
                <span class="sp-badge">${esc(it.badge || '')}</span>
            </div>`).join('');
        Array.from(listEl.querySelectorAll('.sp-item')).forEach(el => {
            el.addEventListener('click', () => choose(Number(el.getAttribute('data-i'))));
            el.addEventListener('mousemove', () => setActive(Number(el.getAttribute('data-i'))));
        });
    }

    function setActive(i) {
        const els = listEl.querySelectorAll('.sp-item');
        if (!els.length) return;
        active = (i + els.length) % els.length;
        els.forEach((el, idx) => {
            const on = idx === active;
            el.classList.toggle('is-active', on);
            el.setAttribute('aria-selected', on ? 'true' : 'false');
            if (on) el.scrollIntoView({ block: 'nearest' });
        });
    }

    function choose(i) {
        const it = results[i];
        if (!it) return;
        close();
        setTimeout(() => { try { it.run(); } catch (e) {} }, 0);
    }

    // ---- open / close --------------------------------------------------------
    function open() {
        injectStyles();
        if (!overlay) buildDom();
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        inputEl.value = '';
        render('');
        setTimeout(() => inputEl.focus(), 20);
    }
    function close() {
        if (!overlay) return;
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
    }
    function isOpen() { return overlay && overlay.classList.contains('is-open'); }

    function buildDom() {
        overlay = document.createElement('div');
        overlay.className = 'sp-overlay';
        overlay.innerHTML = `
            <div class="sp-panel" role="dialog" aria-label="Search the Academy">
                <div class="sp-inputrow">
                    <svg class="sp-ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                    <input class="sp-input" type="text" placeholder="Search lessons, terms, messages…" aria-label="Search" autocomplete="off" spellcheck="false" />
                    <span class="sp-esc">Esc</span>
                </div>
                <div class="sp-list" role="listbox"></div>
                <div class="sp-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>
            </div>`;
        document.body.appendChild(overlay);
        inputEl = overlay.querySelector('.sp-input');
        listEl = overlay.querySelector('.sp-list');
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
        inputEl.addEventListener('input', () => render(inputEl.value));
        inputEl.addEventListener('keydown', onKey);
    }

    function onKey(e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
        else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
        else if (e.key === 'Escape') { e.preventDefault(); close(); }
    }

    // ---- global shortcuts ----------------------------------------------------
    function initShortcuts() {
        document.addEventListener('keydown', e => {
            const k = e.key.toLowerCase();
            if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); isOpen() ? close() : open(); return; }
            const typing = /^(input|textarea|select)$/i.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable);
            if (e.key === '/' && !typing && !isOpen()) { e.preventDefault(); open(); }
        });
    }

    function injectStyles() {
        if (typeof document === 'undefined' || !document.head) return;
        if (document.getElementById('search-styles')) return;
        const css = `
        .sp-overlay{position:fixed;inset:0;z-index:2000;background:rgba(10,15,13,.42);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity var(--dur,.22s) var(--ease-out,ease);display:flex;align-items:flex-start;justify-content:center;padding:14vh 20px 20px}
        .sp-overlay.is-open{opacity:1;pointer-events:auto}
        .sp-panel{width:100%;max-width:620px;background:var(--surface,#fff);border:1px solid var(--border);border-radius:var(--radius-lg,18px);box-shadow:var(--shadow-lg,0 30px 60px -20px rgba(0,0,0,.3));overflow:hidden;transform:translateY(-8px) scale(.985);transition:transform var(--dur,.22s) var(--ease-out,ease)}
        .sp-overlay.is-open .sp-panel{transform:none}
        .sp-inputrow{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid var(--border)}
        .sp-ico{color:var(--text-muted);flex:none}
        .sp-input{flex:1;border:none;background:none;outline:none;font:inherit;font-size:var(--fs-lead,17px);color:var(--text)}
        .sp-input::placeholder{color:var(--text-faint,var(--text-muted))}
        .sp-esc{flex:none;font-size:var(--fs-micro,11px);color:var(--text-muted);border:1px solid var(--border);border-radius:6px;padding:3px 7px}
        .sp-list{max-height:min(52vh,440px);overflow-y:auto;padding:8px}
        .sp-item{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:var(--radius-md,12px);cursor:pointer}
        .sp-item.is-active{background:color-mix(in srgb,var(--primary) 10%,var(--surface))}
        .sp-type{flex:none;width:74px;font-size:var(--fs-micro,11px);text-transform:uppercase;letter-spacing:.05em;color:var(--primary);font-weight:var(--fw-semibold,600)}
        .sp-main{flex:1;min-width:0}
        .sp-label{display:block;font-size:var(--fs-body,16px);font-weight:var(--fw-medium,500);color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sp-sub{display:block;font-size:var(--fs-small,13px);color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sp-badge{flex:none;font-family:var(--font-mono,monospace);font-size:var(--fs-micro,11px);color:var(--text-muted);background:var(--surface-alt,rgba(0,0,0,.04));border:1px solid var(--border);border-radius:6px;padding:3px 7px}
        .sp-empty{padding:28px 16px;text-align:center;color:var(--text-muted);font-size:var(--fs-body,15px)}
        .sp-foot{display:flex;gap:16px;padding:10px 16px;border-top:1px solid var(--border);color:var(--text-muted);font-size:var(--fs-micro,11px)}
        .sp-foot kbd{font-family:var(--font-mono,monospace);border:1px solid var(--border);border-radius:5px;padding:1px 5px;margin-right:2px}
        /* header trigger */
        .nav-search{display:inline-flex;align-items:center;gap:8px;background:var(--surface-alt,rgba(0,0,0,.04));border:1px solid var(--border);border-radius:var(--radius-pill,999px);padding:7px 12px;color:var(--text-muted);cursor:pointer;font:inherit;font-size:var(--fs-small,13px);transition:border-color var(--dur-fast,.15s),color var(--dur-fast,.15s)}
        .nav-search:hover{border-color:var(--primary);color:var(--primary)}
        .nav-search-kbd{font-family:var(--font-mono,monospace);font-size:var(--fs-micro,11px);opacity:.8}
        @media (max-width:640px){.nav-search-label,.nav-search-kbd{display:none}.sp-overlay{padding-top:8vh}}
        `;
        const style = document.createElement('style');
        style.id = 'search-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    return { open, close, initShortcuts, injectStyles };
})();

function openSearch() { Search.open(); }

if (typeof document !== 'undefined') {
    const boot = () => { Search.injectStyles(); Search.initShortcuts(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
}
