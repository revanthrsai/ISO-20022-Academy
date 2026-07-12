// =============================================================================
// PLAYGROUND · SAMPLE MESSAGE LIBRARY  (Phase 2 — card catalogue + static JSON)
// -----------------------------------------------------------------------------
// The ISO 20022 catalogue as a grid of cards. Click a message and its sample is
// fetched on demand from /samples/<code>.json and opened in the Viewer — so the
// XML lives in static files, not bundled in this script. Metadata comes from
// /samples/manifest.json; the domain/family grouping is the small map below.
//
// Self-contained: one global `SampleLibrary` object + its own injected styles.
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
    const cache = {};
    let mountId = 'smp-root';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function loadManifest() {
        if (manifest) return Promise.resolve(manifest);
        return fetch(BASE + 'manifest.json', { cache: 'no-cache' })
            .then(function (r) { return r.json(); })
            .then(function (j) { manifest = j; return j; });
    }
    function loadSample(code) {
        if (cache[code]) return Promise.resolve(cache[code]);
        return fetch(BASE + encodeURIComponent(code) + '.json', { cache: 'no-cache' })
            .then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); })
            .then(function (j) { cache[code] = j; return j; });
    }

    function cardHtml(m) {
        var canTransform = Array.isArray(m.dest) && m.dest.indexOf('transformer') >= 0;
        var badge = canTransform ? '<span class="smp-card-badge">Transformable</span>' : '';
        return '<button class="smp-card" onclick="SampleLibrary.open(\'' + esc(m.code) + '\')" aria-label="Open ' + esc(m.label) + ' in the reader">'
            + '<span class="smp-card-top"><span class="smp-card-code">' + esc(m.label) + '</span><span class="smp-card-kind">' + esc(m.kind || '') + '</span></span>'
            + '<span class="smp-card-sub">' + esc(m.sub || '') + '</span>'
            + '<span class="smp-card-note">' + esc(m.note || '') + '</span>'
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
                    + '<div class="smp-family-head"><span class="smp-family-code">' + esc(f) + '</span><span class="smp-family-name">' + esc(FAMILY_NAMES[f] || '') + '</span></div>'
                    + '<div class="smp-grid">' + byFamily[f].map(cardHtml).join('') + '</div>'
                    + '</div>';
            }).join('');
            return '<section class="smp-domain">'
                + '<div class="smp-domain-head"><h3 class="smp-domain-title">' + esc(d.label) + '</h3><span class="smp-domain-sub">' + esc(d.sub) + '</span></div>'
                + groups
                + '</section>';
        }).join('');
        root.innerHTML = html || '<div class="smp-loading">No samples found.</div>';
    }

    function open(code) {
        loadSample(code).then(function (s) {
            if (typeof window.setPlaygroundTool === 'function') window.setPlaygroundTool('viewer');
            var ta = document.getElementById('xv-src');
            if (ta && window.XmlViewer) {
                ta.value = s.xml;
                if (typeof XmlViewer.onInput === 'function') XmlViewer.onInput();
                var meta = document.querySelector('.xv-src-sub');
                if (meta) meta.textContent = (s.label || code) + ' — ' + (s.sub || '');
            }
        }).catch(function () { /* a missing sample must not blank the reader */ });
    }

    function init(id) {
        mountId = id || 'smp-root';
        injectStyles();
        render();
        loadManifest().then(render).catch(function () {
            var root = document.getElementById(mountId);
            if (root) root.innerHTML = '<div class="smp-loading">Couldn&rsquo;t load the catalogue &mdash; please refresh.</div>';
        });
    }

    function injectStyles() {
        if (typeof document === 'undefined' || !document.head) return;
        if (document.getElementById('smp-styles')) return;
        var css = ''
            + '.smp-loading{padding:48px 16px;text-align:center;color:var(--text-muted);font-size:var(--fs-body,16px)}'
            + '.smp-domain{margin-bottom:var(--space-2xl,40px)}'
            + '.smp-domain-head{display:flex;align-items:baseline;gap:12px;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border)}'
            + '.smp-domain-title{font-family:var(--font-display,var(--font-sans));font-size:var(--fs-h3,22px);margin:0}'
            + '.smp-domain-sub{font-family:var(--font-mono,monospace);font-size:var(--fs-small,13px);color:var(--text-muted)}'
            + '.smp-family{margin-bottom:var(--space-lg,24px)}'
            + '.smp-family-head{display:flex;align-items:baseline;gap:9px;margin-bottom:10px}'
            + '.smp-family-code{font-family:var(--font-mono,monospace);font-size:var(--fs-body,15px);font-weight:var(--fw-bold,700);color:var(--primary)}'
            + '.smp-family-name{font-size:var(--fs-small,13px);color:var(--text-muted)}'
            + '.smp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}'
            + '.smp-card{display:flex;flex-direction:column;gap:6px;text-align:left;background:var(--surface,#fff);border:1px solid var(--border);border-radius:var(--radius-md,14px);padding:16px;cursor:pointer;font:inherit;color:var(--text);transition:border-color .15s,transform .15s,box-shadow .15s}'
            + '.smp-card:hover{border-color:var(--primary);transform:translateY(-2px);box-shadow:var(--shadow-sm)}'
            + '.smp-card-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}'
            + '.smp-card-code{font-family:var(--font-mono,monospace);font-size:var(--fs-body,16px);font-weight:var(--fw-bold,700);color:var(--text)}'
            + '.smp-card-kind{font-size:var(--fs-micro,11px);text-transform:uppercase;letter-spacing:.05em;color:var(--primary);font-weight:var(--fw-semibold,600)}'
            + '.smp-card-sub{font-size:var(--fs-small,13.5px);font-weight:var(--fw-medium,500);color:var(--text-secondary,var(--text))}'
            + '.smp-card-note{font-size:var(--fs-small,13px);color:var(--text-muted);line-height:var(--lh-snug,1.35)}'
            + '.smp-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px}'
            + '.smp-card-badge{font-size:var(--fs-micro,10.5px);font-weight:var(--fw-semibold,600);color:var(--primary);background:color-mix(in srgb,var(--primary) 12%,transparent);border-radius:var(--radius-pill,999px);padding:2px 8px}'
            + '.smp-card-go{margin-left:auto;font-size:var(--fs-small,13px);font-weight:var(--fw-semibold,600);color:var(--primary)}'
            + '@media (max-width:520px){.smp-grid{grid-template-columns:1fr}}';
        var style = document.createElement('style');
        style.id = 'smp-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    return { init: init, open: open };
})();
