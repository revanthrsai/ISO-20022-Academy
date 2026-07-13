// =============================================================================
// PLAYGROUND · ISO 20022 CATALOGUE  (card catalogue + static JSON)
// -----------------------------------------------------------------------------
// The left navigator of the Playground workspace. The catalogue renders as cards
// grouped by business domain → message family. Selecting a card fetches its
// sample on demand from /samples/<code>.json, loads it into the XML viewer on
// the right, updates the workspace top bar, and toggles the Transform button
// (only pacs.008 is engine-transformable today).
//
// Metadata comes from /samples/manifest.json; the domain grouping is the map
// below. Self-contained: one global `SampleLibrary` object + injected styles.
// Public API: init(mountId), open(code).
// =============================================================================

const SampleLibrary = (function () {
    const BASE = '/samples/';

    const DOMAINS = [
        { id: 'payments',   label: 'Payments',         sub: 'pain · pacs · camt · head · admi', families: ['pain', 'pacs', 'camt', 'head', 'admi'] },
        { id: 'securities', label: 'Securities',       sub: 'sese · semt',                       families: ['sese', 'semt'] },
        { id: 'trade',      label: 'Trade Finance',    sub: 'tsin',                              families: ['tsin'] },
        { id: 'cards',      label: 'Cards',            sub: 'caaa',                              families: ['caaa'] },
        { id: 'fx',         label: 'Foreign Exchange', sub: 'fxtr',                              families: ['fxtr'] }
    ];
    const FAMILY_NAMES = {
        pain: 'Payments Initiation', pacs: 'Payments Clearing & Settlement',
        camt: 'Cash Management', head: 'Business Application Header',
        admi: 'Administration', sese: 'Securities Settlement',
        semt: 'Securities Management', tsin: 'Trade Services Initiation',
        caaa: 'Acceptor to Acquirer', fxtr: 'FX Trade'
    };

    let manifest = null;
    let byCode = {};
    const cache = {};
    let mountId = 'smp-root';
    let activeCode = null;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function loadManifest() {
        if (manifest) return Promise.resolve(manifest);
        return fetch(BASE + 'manifest.json', { cache: 'no-cache' })
            .then(function (r) { return r.json(); })
            .then(function (j) {
                manifest = j;
                byCode = {};
                (j || []).forEach(function (m) { byCode[m.code] = m; });
                return j;
            });
    }
    function loadSample(code) {
        if (cache[code]) return Promise.resolve(cache[code]);
        return fetch(BASE + encodeURIComponent(code) + '.json', { cache: 'no-cache' })
            .then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); })
            .then(function (j) { cache[code] = j; return j; });
    }

    function isTransformable(code) {
        var m = byCode[code];
        return !!(m && Array.isArray(m.dest) && m.dest.indexOf('transformer') >= 0);
    }

    // ── one message = one card ──────────────────────────────────────────────
    function cardHtml(m) {
        var badge = isTransformable(m.code) ? '<span class="smp-card-badge">Transformable &#9889;</span>' : '';
        return '<button class="smp-card" type="button" data-code="' + esc(m.code) + '"'
            + ' onclick="SampleLibrary.open(\'' + esc(m.code) + '\')" aria-label="Open ' + esc(m.label) + ' in the viewer">'
            + '<span class="smp-card-top"><span class="smp-card-code">' + esc(m.label || m.code) + '</span>'
            + '<span class="smp-card-kind">' + esc(m.kind || '') + '</span></span>'
            + '<span class="smp-card-sub">' + esc(m.sub || '') + '</span>'
            + (m.note ? '<span class="smp-card-note">' + esc(m.note) + '</span>' : '')
            + '<span class="smp-card-foot">' + badge + '<span class="smp-card-go">Open in reader &rarr;</span></span>'
            + '</button>';
    }

    function render() {
        var root = document.getElementById(mountId);
        if (!root) return;
        if (!manifest) { root.innerHTML = '<div class="smp-loading">Loading the catalogue&hellip;</div>'; return; }

        var byFamily = {};
        manifest.forEach(function (m) { (byFamily[m.family] = byFamily[m.family] || []).push(m); });
        Object.keys(byFamily).forEach(function (f) { byFamily[f].sort(function (a, b) { return a.code.localeCompare(b.code); }); });

        var html = DOMAINS.map(function (d) {
            var fams = d.families.filter(function (f) { return byFamily[f] && byFamily[f].length; });
            if (!fams.length) return '';
            var groups = fams.map(function (f) {
                return '<div class="smp-family">'
                    + '<div class="smp-family-head"><span class="smp-family-code">' + esc(f) + '</span>'
                    + '<span class="smp-family-name">' + esc(FAMILY_NAMES[f] || '') + '</span></div>'
                    + '<div class="smp-grid">' + byFamily[f].map(cardHtml).join('') + '</div>'
                    + '</div>';
            }).join('');
            return '<section class="smp-domain">'
                + '<div class="smp-domain-head"><h3 class="smp-domain-title">' + esc(d.label) + '</h3>'
                + '<span class="smp-domain-sub">' + esc(d.sub) + '</span></div>'
                + groups
                + '</section>';
        }).join('');
        root.innerHTML = html || '<div class="smp-loading">No messages found.</div>';
        if (activeCode) markActive(activeCode);
    }

    // Highlight the selected card.
    function markActive(code) {
        var root = document.getElementById(mountId);
        if (!root) return;
        root.querySelectorAll('.smp-card.is-active').forEach(function (el) { el.classList.remove('is-active'); });
        var sel = (window.CSS && CSS.escape) ? CSS.escape(code) : code;
        var card = root.querySelector('.smp-card[data-code="' + sel + '"]');
        if (card) card.classList.add('is-active');
    }

    // ── select a message → drive the viewer + top bar + Transform button ────
    function open(code) {
        return loadSample(code).then(function (s) {
            activeCode = code;
            if (window.XmlViewer && typeof XmlViewer.loadXml === 'function') XmlViewer.loadXml(s.xml);

            var bar = document.getElementById('pg2-msg');
            if (bar) {
                bar.innerHTML = '<span class="pg2-msg-code">' + esc(s.label || code) + '</span>'
                    + '<span class="pg2-msg-sub">' + esc(s.sub || '') + '</span>';
            }
            var xf = document.getElementById('pg2-xform');
            if (xf) {
                var ok = isTransformable(code);
                xf.disabled = !ok;
                xf.title = ok
                    ? 'Run this message through the live MT ⇄ MX engine'
                    : 'This message has no MT equivalent — nothing to transform to';
            }
            markActive(code);
        }).catch(function () { /* a missing sample must not blank the workspace */ });
    }

    function init(id) {
        mountId = id || 'smp-root';
        injectStyles();
        render();
        loadManifest().then(function () {
            render();
            // Select a sensible default so the viewer, top bar and Transform
            // button start in sync — prefer the transformable pacs.008.
            var def = byCode['pacs.008'] ? 'pacs.008' : (manifest[0] && manifest[0].code);
            if (def) open(def);
        }).catch(function () {
            var root = document.getElementById(mountId);
            if (root) root.innerHTML = '<div class="smp-loading">Couldn&rsquo;t load the catalogue &mdash; please refresh.</div>';
        });
    }

    function injectStyles() {
        if (typeof document === 'undefined' || !document.head) return;
        if (document.getElementById('smp-styles')) return;
        var css = ''
            + '.smp-loading{padding:28px 14px;text-align:center;color:var(--text-muted);font-size:var(--fs-small,13px)}'
            + '.smp-domain{padding:16px 14px 6px}'
            + '.smp-domain + .smp-domain{border-top:1px solid var(--border)}'
            + '.smp-domain-head{display:flex;align-items:baseline;gap:10px;margin-bottom:12px}'
            + '.smp-domain-title{font-family:var(--font-display,var(--font-sans));font-size:15px;margin:0;font-weight:var(--fw-bold,700);color:var(--text)}'
            + '.smp-domain-sub{font-family:var(--font-mono,monospace);font-size:10.5px;color:var(--text-faint)}'
            + '.smp-family{margin-bottom:16px}'
            + '.smp-family-head{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}'
            + '.smp-family-code{font-family:var(--font-mono,monospace);font-size:12.5px;font-weight:var(--fw-bold,700);color:var(--primary)}'
            + '.smp-family-name{font-size:11px;color:var(--text-muted)}'
            + '.smp-grid{display:grid;grid-template-columns:1fr;gap:10px}'
            + '.smp-card{display:flex;flex-direction:column;gap:5px;text-align:left;background:var(--surface,#fff);border:1px solid var(--border);border-radius:var(--radius-md,14px);padding:13px 14px;cursor:pointer;font:inherit;color:var(--text);transition:border-color var(--dur-fast,.15s) var(--ease-out,ease),transform var(--dur-fast,.15s) var(--ease-out,ease),box-shadow var(--dur-fast,.15s) var(--ease-out,ease)}'
            + '.smp-card:hover{border-color:var(--primary);transform:translateY(-1px);box-shadow:var(--shadow-sm)}'
            + '.smp-card.is-active{border-color:var(--primary);background:var(--glass-tint-strong,rgba(16,185,129,.08))}'
            + '.smp-card-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}'
            + '.smp-card-code{font-family:var(--font-mono,monospace);font-size:15px;font-weight:var(--fw-bold,700);color:var(--text)}'
            + '.smp-card-kind{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--primary);font-weight:var(--fw-semibold,600)}'
            + '.smp-card-sub{font-size:13px;font-weight:var(--fw-medium,500);color:var(--text-secondary,var(--text))}'
            + '.smp-card-note{font-size:12px;color:var(--text-muted);line-height:1.4}'
            + '.smp-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:3px}'
            + '.smp-card-badge{font-size:10px;font-weight:var(--fw-semibold,600);color:var(--primary);background:color-mix(in srgb,var(--primary) 12%,transparent);border-radius:var(--radius-pill,999px);padding:2px 8px}'
            + '.smp-card-go{margin-left:auto;font-size:12.5px;font-weight:var(--fw-semibold,600);color:var(--primary)}';
        var style = document.createElement('style');
        style.id = 'smp-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    return { init: init, open: open };
})();
window.SampleLibrary = SampleLibrary;
