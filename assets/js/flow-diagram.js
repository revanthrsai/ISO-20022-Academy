// ===========================================================================
// flow-diagram.js  —  Beat-4 business-terms flow diagram (Session 7.6)
// ===========================================================================
//
// A reusable "how the world solved it" flow — sender → message → clearing →
// receiver — in BUSINESS TERMS ONLY (no tags, no XML), as docs/HANDBOOK.md (Philosophy)
// requires for beat 4 of the Lesson Spine.
//
// Authored in lessons as a one-line token (expanded by markdown.js):
//
//   {{flow:Title|Stop name ~ caption|-> arrow label|Next stop ~ caption|...}}
//
//   · The first segment is the diagram title (kicker).
//   · A segment starting with "->" labels the connector that follows the
//     previous stop. If omitted, a plain arrow is drawn.
//   · Every other segment is a stop: "Name ~ caption" (caption optional).
//
// The rendered wrapper carries data-flow and the stops/arrows carry the
// process-map-step / process-map-arrow classes, so motion.js's existing
// LIVING PROCESS MAPS engine animates it for free (actors appear in
// sequence, then a value pulse travels stop to stop) — including the
// prefers-reduced-motion gate and the dead-IntersectionObserver fallbacks.
// All colors come from style.css :root tokens variables, so both themes work.
//
// Global API:
//   FlowDiagram.html(spec)  — spec is the token's inner text; returns the
//                             diagram HTML (one line, marked.js-safe), or
//                             '' if the spec has fewer than two stops.
// ---------------------------------------------------------------------------

const FlowDiagram = (function () {

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ---- Parse the token spec ---------------------------------------------
    // Returns { title, stops:[{name, caption}], labels:[string|null] } where
    // labels[i] annotates the connector between stops[i] and stops[i+1].
    function parse(spec) {
        const parts = String(spec).split('|').map(s => s.trim());
        const title = parts.shift() || '';
        const stops = [];
        const labels = [];
        let pendingLabel = null;
        parts.forEach(p => {
            if (!p) return;
            if (p.startsWith('->')) {
                pendingLabel = p.slice(2).trim() || null;
                return;
            }
            const tilde = p.indexOf('~');
            const name = (tilde === -1 ? p : p.slice(0, tilde)).trim();
            const caption = (tilde === -1 ? '' : p.slice(tilde + 1)).trim();
            if (!name) return;
            if (stops.length) labels.push(pendingLabel);
            pendingLabel = null;
            stops.push({ name, caption });
        });
        return { title, stops, labels };
    }

    // ---- Render ------------------------------------------------------------
    function html(spec) {
        const { title, stops, labels } = parse(spec);
        if (stops.length < 2) return '';

        const aria = title + ': ' + stops.map(s => s.name).join(', then ') + '.';
        const pieces = [];
        stops.forEach((s, i) => {
            if (i > 0) {
                const label = labels[i - 1];
                pieces.push(
                    '<span class="fd-arrow process-map-arrow" aria-hidden="true">'
                    + (label ? '<span class="fd-arrow-label">' + esc(label) + '</span>' : '')
                    + '<span class="fd-arrow-line"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M14 6l6 6-6 6"/></svg></span>'
                    + '</span>');
            }
            pieces.push(
                '<span class="fd-stop process-map-step">'
                + '<span class="fd-dot" aria-hidden="true">' + (i + 1) + '</span>'
                + '<span class="fd-name">' + esc(s.name) + '</span>'
                + (s.caption ? '<span class="fd-caption">' + esc(s.caption) + '</span>' : '')
                + '</span>');
        });

        return '<div class="flow-diagram" data-flow role="img" aria-label="' + esc(aria) + '">'
            + (title ? '<div class="fd-title">' + esc(title) + '</div>' : '')
            + '<div class="fd-track">' + pieces.join('') + '</div>'
            + '</div>';
    }

    // ---- Self-injected, token-driven styles (theme-aware) ------------------
    const CSS = `
/* ==== flow-diagram (Session 7.6) — beat-4 business-terms flow ============ */
.flow-diagram {
    margin: 26px 0;
    padding: 22px 24px 24px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg, 18px);
    backdrop-filter: var(--glass-blur, blur(18px));
    -webkit-backdrop-filter: var(--glass-blur, blur(18px));
    box-shadow: var(--glass-shadow);
}
.fd-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-faint);
    margin-bottom: 18px;
}
.fd-track {
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 10px;
    row-gap: 16px;
}
/* Stop — overrides the base .process-map-step chip while keeping motion.js's
   flow-in / flow-active hooks. */
.flow-diagram .fd-stop {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    flex: 1 1 130px;
    min-width: min-content;
    max-width: 300px;
    padding: 12px 14px;
    background: var(--surface-alt);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, 12px);
    font-family: var(--font-sans, inherit);
    font-size: 13px;
    text-transform: none;
    letter-spacing: normal;
    white-space: normal;
    overflow-wrap: normal;
    color: var(--text);
    box-shadow: none;
}
.flow-diagram .fd-dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    margin-bottom: 5px;
    border-radius: 50%;
    background: var(--glass-tint-strong);
    border: 1px solid var(--border-hi);
    color: var(--primary-bright);
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    transition: background var(--dur-fast, 0.22s) var(--ease-out), color var(--dur-fast, 0.22s) var(--ease-out);
}
.flow-diagram .fd-name {
    font-size: 14px;
    font-weight: 650;
    color: var(--text);
    line-height: 1.25;
    white-space: normal;
    max-width: 100%;
}
.flow-diagram .fd-caption {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.35;
    white-space: normal;
    max-width: 100%;
}
/* Connector — overrides the base .process-map-arrow glyph. */
.flow-diagram .fd-arrow {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    align-self: center;
    flex: 0 0 auto;
    max-width: 130px;
    padding: 0 2px;
    font-size: inherit;
    color: var(--text-faint);
}
.flow-diagram .fd-arrow-label {
    font-family: var(--font-sans, inherit);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--text-muted);
    text-align: center;
    line-height: 1.3;
    white-space: normal;
}
.flow-diagram .fd-arrow-line { display: inline-flex; color: var(--text-faint); }
/* The traveling value pulse (class set by motion.js). */
.flow-diagram .fd-stop.flow-active {
    border-color: var(--primary);
    background: var(--glass-tint-strong);
    color: var(--text);
    box-shadow: 0 0 0 1px var(--primary) inset, 0 6px 22px -10px var(--glow, rgba(16,185,129,0.3));
}
.flow-diagram .fd-stop.flow-active .fd-dot {
    background: var(--primary);
    border-color: var(--primary);
    color: var(--bg);
}
/* Narrow screens — stack vertically, arrows point down. */
@media (max-width: 560px) {
    .fd-track { flex-direction: column; align-items: stretch; }
    .flow-diagram .fd-stop { flex: 1 1 auto; }
    .flow-diagram .fd-arrow { flex-direction: row; gap: 8px; max-width: none; padding: 2px 0; }
    .flow-diagram .fd-arrow-line svg { transform: rotate(90deg); }
    .flow-diagram .fd-arrow-label { text-align: left; }
}
`;

    (function inject() {
        const style = document.createElement('style');
        style.id = 'flow-diagram-styles';
        style.textContent = CSS;
        document.head.appendChild(style);
    })();

    return { html };
})();

// Expose for markdown.js's token expander.
window.FlowDiagram = FlowDiagram;
