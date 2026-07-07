// =============================================================================
// deadlines.js  —  ISO 20022 compliance-calendar widget (Track 2 / task 11)
// -----------------------------------------------------------------------------
// Renders a live countdown to the nearest upcoming milestone plus a compact
// timeline of all milestones, from ACADEMY_DEADLINES (deadlines.data.js).
// Self-contained: one global `Deadlines` object, its own injected styles
// (theme-aware via shared CSS variables), and a 1s ticking countdown. Mounted
// onto the History landing by renderHistoryChapterIndex() in app.js.
// =============================================================================

const Deadlines = (function () {
    let tickTimer = null;

    function items() {
        if (typeof ACADEMY_DEADLINES === 'undefined') return [];
        return (ACADEMY_DEADLINES.items || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    }
    function now() { return new Date(); }
    function daysUntil(dateStr) {
        return Math.ceil((new Date(dateStr + 'T00:00:00') - now()) / 86400000);
    }
    function statusOf(dateStr) {
        const d = daysUntil(dateStr);
        if (d < 0) return 'past';
        if (d <= 90) return 'imminent';
        return 'upcoming';
    }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function fmtDate(it) {
        const d = new Date(it.date + 'T00:00:00');
        const month = d.toLocaleString('en-US', { month: 'long' });
        if (it.precision === 'month') return month + ' ' + d.getFullYear();
        return d.getDate() + ' ' + month + ' ' + d.getFullYear();
    }

    // The nearest milestone still in the future (or, if none, the latest past one).
    function heroItem() {
        const list = items();
        const upcoming = list.filter(it => daysUntil(it.date) >= 0);
        if (upcoming.length) return upcoming[0];
        return list.length ? list[list.length - 1] : null;
    }

    function countdownCells(dateStr) {
        let diff = new Date(dateStr + 'T00:00:00') - now();
        if (diff < 0) diff = 0;
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const cell = (n, l) => `<span class="dl-cd-cell"><span class="dl-cd-num">${String(n).padStart(2, '0')}</span><span class="dl-cd-lbl">${l}</span></span>`;
        return cell(d, 'days') + cell(h, 'hrs') + cell(m, 'min') + cell(s, 'sec');
    }

    function heroHtml(it) {
        if (!it) return '';
        const past = daysUntil(it.date) < 0;
        const learn = it.ref ? `<a class="dl-hero-learn" href="javascript:void(0)" onclick="openArticle('${esc(it.ref)}')">Learn what changes →</a>` : '';
        const countdown = past
            ? `<div class="dl-hero-done">✓ Completed ${esc(fmtDate(it))}</div>`
            : `<div class="dl-countdown" id="dl-countdown" data-date="${esc(it.date)}">${countdownCells(it.date)}</div>`;
        return `
            <div class="dl-hero">
                <div class="dl-hero-tag">${past ? 'Most recent milestone' : 'Next deadline'} · ${esc(it.scope)}</div>
                <h3 class="dl-hero-title">${esc(it.title)}</h3>
                <div class="dl-hero-date">${esc(fmtDate(it))}${it.precision === 'month' ? ' <span class="dl-approx">(approx.)</span>' : ''}</div>
                ${countdown}
                <p class="dl-hero-summary">${esc(it.summary)}</p>
                ${learn}
            </div>`;
    }

    function timelineHtml() {
        const rows = items().map(it => {
            const st = statusOf(it.date);
            const d = daysUntil(it.date);
            const pill = st === 'past' ? '<span class="dl-pill dl-past">Completed</span>'
                : st === 'imminent' ? `<span class="dl-pill dl-imminent">In ${d} day${d === 1 ? '' : 's'}</span>`
                    : `<span class="dl-pill dl-upcoming">In ${d} days</span>`;
            const click = it.ref ? ` role="button" tabindex="0" onclick="openArticle('${esc(it.ref)}')" onkeydown="if(event.key==='Enter'){openArticle('${esc(it.ref)}')}"` : '';
            return `
                <li class="dl-row dl-${st}"${click}>
                    <span class="dl-row-date">${esc(fmtDate(it))}</span>
                    <span class="dl-row-body">
                        <span class="dl-row-title">${esc(it.title)}</span>
                        <span class="dl-row-scope">${esc(it.scope)}</span>
                    </span>
                    ${pill}
                </li>`;
        }).join('');
        return `<ul class="dl-timeline">${rows}</ul>`;
    }

    function sectionHtml() {
        const updated = (typeof ACADEMY_DEADLINES !== 'undefined' && ACADEMY_DEADLINES.meta && ACADEMY_DEADLINES.meta.updated) || '';
        return `
            <div class="learn-head" data-reveal-group>
                <div class="eyebrow" data-reveal="fade">Compliance calendar</div>
                <h2 class="section-title" data-reveal="up">The deadlines that matter.</h2>
                <p class="section-description" data-reveal="up">The migration didn't end when MT retired. These are the dated milestones the industry is working toward now — a live countdown, and what each one actually changes.</p>
            </div>
            <div class="dl-wrap" data-reveal="up">
                ${heroHtml(heroItem())}
                ${timelineHtml()}
                ${updated ? `<p class="dl-updated">Calendar updated ${esc(updated)} · dates per Swift / CBPR+ guidance.</p>` : ''}
            </div>`;
    }

    function startTick() {
        stopTick();
        const el = document.getElementById('dl-countdown');
        if (!el) return;
        const date = el.getAttribute('data-date');
        tickTimer = setInterval(() => {
            const node = document.getElementById('dl-countdown');
            if (!node) { stopTick(); return; }
            node.innerHTML = countdownCells(date);
        }, 1000);
    }
    function stopTick() { if (tickTimer) { clearInterval(tickTimer); tickTimer = null; } }

    // Append the calendar as a <section> onto a page element (the History landing).
    function mount(pageEl) {
        if (!pageEl || document.getElementById('dl-section')) return;
        injectStyles();
        const section = document.createElement('section');
        section.id = 'dl-section';
        section.className = 'reveal-section';
        section.style.cssText = 'max-width:1180px; margin:clamp(80px,14vw,150px) auto 0;';
        section.innerHTML = sectionHtml();
        pageEl.appendChild(section);
        if (window.Motion) Motion.scan(section);
        startTick();
    }

    function injectStyles() {
        if (typeof document === 'undefined' || !document.head) return;
        if (document.getElementById('deadlines-styles')) return;
        const css = `
        .dl-wrap{margin-top:32px;display:grid;grid-template-columns:1.1fr .9fr;gap:24px;align-items:start}
        .dl-hero{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg,18px);padding:var(--space-2xl,40px);box-shadow:var(--shadow-sm)}
        .dl-hero-tag{font-size:var(--fs-eyebrow,12px);text-transform:uppercase;letter-spacing:.08em;color:var(--primary);font-weight:var(--fw-semibold,600);margin-bottom:12px}
        .dl-hero-title{font-family:var(--font-display,var(--font-sans));font-size:var(--fs-h3,24px);line-height:var(--lh-tight,1.15);margin:0 0 6px}
        .dl-hero-date{font-size:var(--fs-lead,17px);font-weight:var(--fw-semibold,600);color:var(--text);margin-bottom:20px}
        .dl-approx{color:var(--text-muted);font-weight:var(--fw-regular,400);font-size:var(--fs-small,14px)}
        .dl-countdown{display:flex;gap:10px;margin-bottom:20px}
        .dl-cd-cell{flex:1;background:var(--surface-alt,rgba(0,0,0,.04));border:1px solid var(--border);border-radius:var(--radius-md,14px);padding:12px 6px;text-align:center;font-variant-numeric:tabular-nums}
        .dl-cd-num{display:block;font-family:var(--font-mono,monospace);font-size:var(--fs-h3,24px);font-weight:var(--fw-bold,700);color:var(--primary);line-height:1}
        .dl-cd-lbl{display:block;font-size:var(--fs-micro,11px);text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-top:6px}
        .dl-hero-done{display:inline-block;background:color-mix(in srgb,var(--success,#0B8A60) 12%,var(--surface));color:var(--success,#0B8A60);border-radius:var(--radius-pill,999px);padding:8px 16px;font-weight:var(--fw-semibold,600);font-size:var(--fs-small,14px);margin-bottom:20px}
        .dl-hero-summary{color:var(--text-secondary,var(--text-muted));font-size:var(--fs-body,16px);line-height:var(--lh-relaxed,1.6);margin:0 0 16px}
        .dl-hero-learn{color:var(--primary);font-weight:var(--fw-semibold,600);font-size:var(--fs-body,16px);text-decoration:none}
        .dl-hero-learn:hover{text-decoration:underline}

        .dl-timeline{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
        .dl-row{display:flex;align-items:center;gap:14px;background:var(--surface);border:1px solid var(--border);border-left-width:3px;border-radius:var(--radius-md,14px);padding:14px 16px;transition:transform var(--dur-fast,.15s),border-color var(--dur-fast,.15s)}
        .dl-row[role=button]{cursor:pointer}
        .dl-row[role=button]:hover{transform:translateX(3px);border-color:var(--primary)}
        .dl-row.dl-past{border-left-color:var(--success,#0B8A60);opacity:.72}
        .dl-row.dl-imminent{border-left-color:var(--danger,#C13543)}
        .dl-row.dl-upcoming{border-left-color:var(--primary)}
        .dl-row-date{flex:none;width:104px;font-size:var(--fs-small,14px);font-weight:var(--fw-semibold,600);color:var(--text)}
        .dl-row-body{flex:1;min-width:0}
        .dl-row-title{display:block;font-size:var(--fs-body,16px);font-weight:var(--fw-medium,500);line-height:var(--lh-snug,1.3)}
        .dl-row-scope{display:block;font-size:var(--fs-small,13px);color:var(--text-muted);margin-top:2px}
        .dl-pill{flex:none;font-size:var(--fs-micro,11px);font-weight:var(--fw-semibold,600);text-transform:uppercase;letter-spacing:.04em;border-radius:var(--radius-pill,999px);padding:5px 11px;white-space:nowrap}
        .dl-pill.dl-past{background:color-mix(in srgb,var(--success,#0B8A60) 12%,transparent);color:var(--success,#0B8A60)}
        .dl-pill.dl-imminent{background:color-mix(in srgb,var(--danger,#C13543) 12%,transparent);color:var(--danger,#C13543)}
        .dl-pill.dl-upcoming{background:color-mix(in srgb,var(--primary) 12%,transparent);color:var(--primary)}
        .dl-updated{grid-column:1 / -1;margin:8px 0 0;font-size:var(--fs-micro,12px);color:var(--text-faint,var(--text-muted))}
        @media (max-width:820px){.dl-wrap{grid-template-columns:1fr}.dl-row-date{width:88px}}
        `;
        const style = document.createElement('style');
        style.id = 'deadlines-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    return { mount, sectionHtml, injectStyles, statusOf, heroItem };
})();
