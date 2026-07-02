// UI Module - Handle interactive elements and detail panel

// ---------------------------------------------------------------------------
// Message Explorer (Phase 6) — each message opens as a full Lesson-Spine node,
// concept BEFORE payload. The panel reads top-to-bottom as a story:
//   business story → why it exists → who creates/receives → business process
//   → visual flow → business components → message components → XML →
//   validation → what breaks → interview questions → related messages.
// The raw XML appears only after the business story, never first. Reuses
// existing detail / spotlight / lesson CSS classes — no new styles.
// ---------------------------------------------------------------------------
// Phase 7 — the explorer now opens as a centered POPUP (an "Outlook-style"
// reading window) over a dimmed backdrop, instead of the old slide-in side
// panel. Same renderMessageNode content; click-outside or Esc closes it.
function openDetailPanel(messageCode) {
    const message = getMessageByCode(messageCode);
    if (!message) return;
    let overlay = document.getElementById('msg-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'msg-modal-overlay';
        overlay.className = 'msg-modal-overlay';
        overlay.addEventListener('click', e => { if (e.target === overlay) closeDetailPanel(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetailPanel(); });
        document.body.appendChild(overlay);
    }
    overlay.dataset.messageCode = messageCode;
    overlay.innerHTML = `<div class="msg-modal" role="dialog" aria-modal="true" aria-label="${message.code} details">${renderMessageNode(message)}</div>`;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('open'));
    const body = overlay.querySelector('.detail-panel-content');
    if (body) body.scrollTop = 0;
    if (window.Motion) Motion.scan(overlay);
}

// A labelled block: monospace eyebrow label + free HTML body.
function renderDetailSection(label, bodyHtml) {
    if (!bodyHtml) return '';
    return `
        <div class="detail-section">
            <div class="detail-label">${label}</div>
            ${bodyHtml}
        </div>`;
}

// Plain-English left → meaning right rows (business / message components,
// validation). Reuses .spotlight-fields styling.
function renderMeaningRows(rows) {
    return `<div class="spotlight-fields">${rows.map(r => `
        <div class="spotlight-field">
            <span class="spotlight-field-tag">${r.tag}</span>
            <span class="spotlight-field-meaning">${r.meaning}</span>
        </div>`).join('')}</div>`;
}

function renderMessageNode(message) {
    const n = message.node || {};

    const flowHtml = (n.flow && n.flow.length) ? `
        <div class="process-map">
            <div class="process-map-flow" data-flow>
                ${n.flow.map((step, i) => `${i > 0 ? '<span class="process-map-arrow">→</span>' : ''}<span class="process-map-step">${step}</span>`).join('')}
            </div>
        </div>` : '';

    const bizCompHtml = (n.businessComponents && n.businessComponents.length)
        ? renderMeaningRows(n.businessComponents.map(c => ({ tag: c.name, meaning: c.plain }))) : '';

    const msgCompRows = (n.messageComponents && n.messageComponents.length)
        ? n.messageComponents.map(c => ({ tag: c.tag, meaning: c.plain }))
        : (message.fields || []).map(f => ({ tag: f, meaning: '' }));
    const msgCompHtml = renderMeaningRows(msgCompRows);

    const validationHtml = (n.validation && n.validation.length)
        ? renderMeaningRows(n.validation.map(v => ({
            tag: v.tag,
            meaning: `${v.rule}<br><span style="opacity:.7"><strong>Fails when:</strong> ${v.fails}</span>`
        }))) : '';

    const breaksHtml = (n.breaks && n.breaks.length)
        ? renderWhyCards(n.breaks.map(b => ({ label: b.symptom, text: `<strong>Why:</strong> ${b.cause}<br><strong>Fix:</strong> ${b.fix}` }))) : '';

    const interviewHtml = (n.interview && n.interview.length) ? `
        <div class="lesson-why-section">${n.interview.map(it => `
            <div class="lesson-why-card">
                <div class="lesson-why-label">Q · ${it.q}</div>
                <p class="lesson-why-text">${it.a}</p>
            </div>`).join('')}</div>` : '';

    const relatedCodes = (n.related || []).filter(c => getMessageByCode(c));
    const relatedHtml = relatedCodes.length ? `
        <div class="tags">${relatedCodes.map(c => {
            const m = getMessageByCode(c);
            return `<span class="tag" style="cursor:pointer" title="${m.subtitle}" onclick="openDetailPanel('${c}')">${c} →</span>`;
        }).join('')}</div>` : '';

    return `
        <div class="detail-panel-content">
            <button onclick="closeDetailPanel()" aria-label="Close" style="cursor:pointer; background:transparent; border:1px solid var(--border); color:var(--text-muted); border-radius:8px; padding:6px 12px; font-size:12px; letter-spacing:0.04em; margin-bottom:20px;">✕ Close</button>

            <div class="detail-header">
                <div class="detail-title">${message.code}</div>
                <div class="detail-subtitle">${message.subtitle}</div>
            </div>

            ${renderDetailSection('The Story', n.story ? `<p class="detail-description">${n.story}</p>` : `<p class="detail-description">${message.purpose}</p>`)}
            ${renderDetailSection('Why This Message Exists', n.whyExists ? `<p class="detail-description">${n.whyExists}</p>` : '')}

            ${renderDetailSection('Who Creates It', n.createdBy ? `<div class="detail-value">${n.createdBy}</div>` : `<div class="detail-value">${message.direction}</div>`)}
            ${renderDetailSection('Who Receives It', n.receivedBy ? `<div class="detail-value">${n.receivedBy}</div>` : '')}

            ${flowHtml ? renderDetailSection('Business Process', flowHtml) : ''}
            ${bizCompHtml ? renderDetailSection('Business Components', bizCompHtml) : ''}
            ${renderDetailSection('Message Components', msgCompHtml)}

            <div class="detail-section">
                <div class="detail-label">The XML — only now</div>
                <div class="xml-editor-shell">
                    <div class="xml-editor-toolbar">
                        <span class="xml-editor-dot"></span>
                        <span class="xml-editor-dot"></span>
                        <span class="xml-editor-dot"></span>
                        <span class="xml-editor-filename">${message.code.toLowerCase()}.xml</span>
                    </div>
                    <pre class="xml-editor xml-readonly"><code>${escapeHtml(message.example)}</code></pre>
                </div>
            </div>

            ${validationHtml ? renderDetailSection('Validation Rules', validationHtml) : ''}
            ${breaksHtml ? renderDetailSection('What Breaks', breaksHtml) : ''}
            ${interviewHtml ? renderDetailSection('Interview Questions', interviewHtml) : ''}
            ${relatedHtml ? renderDetailSection('Related Messages', relatedHtml) : ''}
        </div>
    `;
}

function closeDetailPanel() {
    const overlay = document.getElementById('msg-modal-overlay');
    if (overlay) {
        overlay.classList.remove('open');
        setTimeout(() => { if (overlay && !overlay.classList.contains('open')) overlay.innerHTML = ''; }, 240);
    }
    document.body.style.overflow = '';
    // Legacy side panel (kept harmless): close it too if present.
    const panel = document.getElementById('detail-panel');
    if (panel) { panel.classList.remove('open'); panel.innerHTML = ''; }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


// Stacked labelled cards (who-feels-it, what-breaks). Reuses .lesson-why-*.
function renderWhyCards(cards) {
    return `<div class="lesson-why-section">${cards.map(c => `
        <div class="lesson-why-card ${c.solution ? 'lesson-why-card-solution' : ''}">
            <div class="lesson-why-label">${c.label}</div>
            <p class="lesson-why-text">${c.text}</p>
        </div>`).join('')}</div>`;
}

// ── GLOSSARY (Phase 5) ──────────────────────────────────────────────────
// Category filter + free-text search share one state object; either one
// narrows the same list. State lives here so the chips, the search box and
// the URL stay in sync.
const glossaryState = { category: 'all', q: '', focus: '' };

function gEsc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Terms passing BOTH the active category AND the search query.
function glossaryMatches() {
    const q = glossaryState.q.trim().toLowerCase();
    return (DATA.glossary || []).filter(item => {
        if (glossaryState.category !== 'all' && item.category !== glossaryState.category) return false;
        if (!q) return true;
        const hay = (item.term + ' ' + item.definition + ' ' + glossaryCategoryLabel(item.category)).toLowerCase();
        return hay.includes(q);
    });
}

// Category filter bar: All + one chip per category. Each count reflects how
// many terms match the current SEARCH within that category, so the chips stay
// honest as you type.
function renderGlossaryFilterBar() {
    const bar = document.getElementById('glossary-filter');
    if (!bar) return;
    const q = glossaryState.q.trim().toLowerCase();
    const inSearch = (item) => !q || (item.term + ' ' + item.definition + ' ' + glossaryCategoryLabel(item.category)).toLowerCase().includes(q);
    const all = (DATA.glossary || []).filter(inSearch);
    const chip = (slug, label, count) =>
        '<button type="button" class="filter-chip' + (glossaryState.category === slug ? ' active' : '') + '" ' +
        'aria-pressed="' + (glossaryState.category === slug) + '" onclick="setGlossaryCategory(\'' + slug + '\')">' +
        gEsc(label) + '<span class="filter-chip-count">' + count + '</span></button>';
    let html = chip('all', 'All', all.length);
    GLOSSARY_CATEGORIES.forEach(c => {
        html += chip(c.slug, c.label, all.filter(i => i.category === c.slug).length);
    });
    bar.innerHTML = html;
}

// Render glossary (reads glossaryState; no args — call after changing state).
function renderGlossary() {
    const glossaryGrid = document.getElementById('glossary-grid') || document.querySelector('.glossary-grid');
    if (!glossaryGrid) return;
    renderGlossaryFilterBar();

    const items = glossaryMatches();
    const countEl = document.getElementById('glossary-count');
    if (countEl) {
        const total = (DATA.glossary || []).length;
        const scope = glossaryState.category === 'all' ? '' : ' in ' + glossaryCategoryLabel(glossaryState.category);
        countEl.textContent = items.length + ' of ' + total + ' terms' + scope;
    }

    if (items.length === 0) {
        glossaryGrid.innerHTML = '<div class="glossary-empty">No terms match' +
            (glossaryState.q.trim() ? ' \u201c' + gEsc(glossaryState.q.trim()) + '\u201d' : ' this filter') + '.</div>';
    } else {
        const labelStyle = 'font-family:var(--font-mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-faint)';
        glossaryGrid.innerHTML = items.map((item, i) => {
            const related = (item.related || [])
                .map(getGlossaryTerm).filter(Boolean)
                .map(r => '<button type="button" class="tag" style="cursor:pointer" onclick="gotoGlossaryTerm(\'' + r.slug + '\')">' + gEsc(r.term) + '</button>')
                .join('');
            const outbound = (item.links || []).map(l => {
                const kind = l.article ? 'article' : (l.tool ? 'tool' : '');
                const target = l.article || l.tool || '';
                if (!kind) return '';
                return '<button type="button" class="tag" style="cursor:pointer;border-color:var(--primary);color:var(--primary)" onclick="gotoGlossaryLink(\'' + kind + '\',\'' + gEsc(target) + '\')">' + gEsc(l.label) + ' \u2197</button>';
            }).join('');
            return '' +
            '<div class="glossary-card" id="gloss-' + gEsc(item.slug) + '" data-slug="' + gEsc(item.slug) + '" data-reveal="up" data-reveal-delay="' + (Math.min(i, 8) * 55) + '" data-tilt>' +
                '<button type="button" class="tag" style="cursor:pointer;margin-bottom:14px" onclick="setGlossaryCategory(\'' + item.category + '\')">' + gEsc(glossaryCategoryLabel(item.category)) + '</button>' +
                '<div class="glossary-term">' + gEsc(item.term) + '</div>' +
                '<div class="glossary-definition">' + gEsc(item.definition) + '</div>' +
                (related ? '<div style="margin-top:16px;display:flex;flex-wrap:wrap;align-items:center;gap:8px"><span style="' + labelStyle + '">See also</span>' + related + '</div>' : '') +
                (outbound ? '<div style="margin-top:12px;display:flex;flex-wrap:wrap;align-items:center;gap:8px"><span style="' + labelStyle + '">Go deeper</span>' + outbound + '</div>' : '') +
            '</div>';
        }).join('');
    }

    if (glossaryState.focus) {
        const card = document.getElementById('gloss-' + glossaryState.focus);
        if (card) {
            card.style.transition = 'box-shadow .35s ease';
            card.style.boxShadow = '0 0 0 2px var(--primary), 0 0 44px -10px var(--primary)';
            const y = card.getBoundingClientRect().top + window.scrollY - 130;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            setTimeout(function(){ if (card) card.style.boxShadow = ''; }, 2600);
        }
    }

    if (window.Motion) Motion.scan(glossaryGrid);
}

// Pick a category (or 'all'); reflects to the URL for shareability.
function setGlossaryCategory(slug) {
    glossaryState.category = slug || 'all';
    glossaryState.focus = '';
    syncGlossaryHash();
    renderGlossary();
}

// Search-box handler — keeps its (query) signature so existing callers work.
function filterGlossary(query) {
    glossaryState.q = query || '';
    glossaryState.focus = '';
    syncGlossaryHash();
    renderGlossary();
}

// Jump to one term (from a "See also" chip): clear the category, search it.
function gotoGlossaryTerm(slug) {
    if (!getGlossaryTerm(slug)) return;
    const target = '#/glossary/' + slug;
    if (location.hash === target) { applyGlossaryHash(); renderGlossary(); }
    else location.hash = target;   // the hash router re-renders + focuses the card
}

// Outbound cross-link from a glossary term into a Library article or a Playground
// tool (item 6 — the glossary is no longer a dead end).
function gotoGlossaryLink(kind, target) {
    if (kind === 'article' && typeof openArticle === 'function') openArticle(target);
    else if (kind === 'tool' && typeof openPlaygroundTool === 'function') openPlaygroundTool(target);
}

// Reflect filter + search into #/glossary?category=&q= so a filtered view is
// shareable / reload-safe (docs/HANDBOOK.md (IA) §2). Write-only (replaceState, no
// reload); routeOnLoad / applyGlossaryHash read it back.
function syncGlossaryHash() {
    if (typeof location === 'undefined' || typeof history === 'undefined') return;
    if (glossaryState.focus) {
        const ft = '#/glossary/' + glossaryState.focus;
        if (location.hash !== ft) history.replaceState(null, '', ft);
        return;
    }
    const params = [];
    if (glossaryState.category && glossaryState.category !== 'all') params.push('category=' + encodeURIComponent(glossaryState.category));
    if (glossaryState.q.trim()) params.push('q=' + encodeURIComponent(glossaryState.q.trim()));
    const target = '#/glossary' + (params.length ? '?' + params.join('&') : '');
    if (location.hash !== target) history.replaceState(null, '', target);
}

// Seed glossaryState from the URL (called on glossary navigate / first paint).
function applyGlossaryHash() {
    const h = location.hash || '';
    glossaryState.category = 'all';
    glossaryState.q = '';
    glossaryState.focus = '';
    const term = h.match(/^#\/glossary\/([a-z0-9-]+)$/);
    if (term && getGlossaryTerm(term[1])) {
        glossaryState.focus = term[1];
    } else {
        const m = h.match(/^#\/glossary(?:\?(.*))?$/);
        if (m && m[1]) {
            const sp = new URLSearchParams(m[1]);
            const cat = sp.get('category');
            if (cat && GLOSSARY_CATEGORIES.some(c => c.slug === cat)) glossaryState.category = cat;
            glossaryState.q = sp.get('q') || '';
        }
    }
    const box = document.getElementById('glossary-search');
    if (box) box.value = glossaryState.q;
}

// Theme management
function toggleTheme() {
    const toggle = document.querySelector('.theme-toggle');
    const isDark = toggle.classList.contains('active');

    if (isDark) {
        setTheme('light');
        toggle.classList.remove('active');
    } else {
        setTheme('dark');
        toggle.classList.add('active');
    }
}

function setTheme(theme) {
    const toggle = document.querySelector('.theme-toggle');

    if (theme === 'dark') {
        document.body.classList.remove('light-mode');
        toggle.classList.add('active');
        localStorage.setItem('iso-theme', 'dark');
    } else {
        document.body.classList.add('light-mode');
        toggle.classList.remove('active');
        localStorage.setItem('iso-theme', 'light');
    }
}

// Initialize theme from localStorage
if (localStorage.getItem('iso-theme') === 'light') {
    setTheme('light');
} else {
    setTheme('dark');
}
