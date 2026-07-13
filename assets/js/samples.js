// =============================================================================
// PLAYGROUND · ISO 20022 CATALOGUE  (compact collapsible tree)
// -----------------------------------------------------------------------------
// The left navigator of the Playground workspace. The catalogue renders as a
// collapsible tree — business domain → message family → message. Selecting a
// message fetches its sample on demand from /samples/<code>.json, loads it into
// the XML viewer on the right, updates the workspace top bar, and toggles the
// Transform button (only pacs.008 is engine-transformable today).
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

    // ── one message = one leaf button ───────────────────────────────────────
    function leafHtml(m) {
        var xf = isTransformable(m.code)
            ? '<span class="smp-leaf-x" title="Transformable through the live engine">&#9889;</span>' : '';
        return '<button class="smp-leaf" type="button" data-code="' + esc(m.code) + '"'
            + ' onclick="SampleLibrary.open(\'' + esc(m.code) + '\')" title="' + esc(m.sub || m.label) + '">'
            + '<span class="smp-leaf-code">' + esc(m.label || m.code) + '</span>'
            + '<span class="smp-leaf-name">' + esc(m.sub || '') + '</span>'
            + xf
            + '</button>';
    }

    function render() {
        var root = document.getElementById(mountId);
        if (!root) return;
        if (!manifest) { root.innerHTML = '<div class="smp-loading">Loading the catalogue&hellip;</div>'; return; }

        var byFamily = {};
        manifest.forEach(function (m) { (byFamily[m.family] = byFamily[m.family] || []).push(m); });
        Object.keys(byFamily).forEach(function (f) { byFamily[f].sort(function (a, b) { return a.code.localeCompare(b.code); }); });

        var html = DOMAINS.map(function (d, i) {
            var fams = d.families.filter(function (f) { return byFamily[f] && byFamily[f].length; });
            if (!fams.length) return '';
            var count = fams.reduce(function (n, f) { return n + byFamily[f].length; }, 0);
            var groups = fams.map(function (f) {
                return '<div class="smp-fam">'
                    + '<div class="smp-fam-head"><span class="smp-fam-code">' + esc(f) + '</span>'
                    + '<span class="smp-fam-name">' + esc(FAMILY_NAMES[f] || '') + '</span></div>'
                    + byFamily[f].map(leafHtml).join('')
                    + '</div>';
            }).join('');
            return '<details class="smp-dom"' + (i === 0 ? ' open' : '') + '>'
                + '<summary class="smp-dom-sum"><span class="smp-twist" aria-hidden="true">&#9656;</span>'
                + '<span class="smp-dom-title">' + esc(d.label) + '</span>'
                + '<span class="smp-dom-count">' + count + '</span></summary>'
                + '<div class="smp-dom-body">' + groups + '</div>'
                + '</details>';
        }).join('');
        root.innerHTML = html || '<div class="smp-loading">No messages found.</div>';
        if (activeCode) markActive(activeCode);
    }

    // Highlight the selected leaf and make sure its domain is expanded.
    function markActive(code) {
        var root = document.getElementById(mountId);
        if (!root) return;
        root.querySelectorAll('.smp-leaf.is-active').forEach(function (el) { el.classList.remove('is-active'); });
        var sel = (window.CSS && CSS.escape) ? CSS.escape(code) : code;
        var leaf = root.querySelector('.smp-leaf[data-code="' + sel + '"]');
        if (leaf) {
            leaf.classList.add('is-active');
            var det = leaf.closest('.smp-dom');
            if (det && !det.open) det.open = true;
        }
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
                    ? 'Run this pacs.008 through the live MT ⇄ MX engine'
                    : 'The live engine currently transforms pacs.008 ⇄ MT103';
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
            + '.smp-dom{border-bottom:1px solid var(--border)}'
            + '.smp-dom:last-child{border-bottom:none}'
            + '.smp-dom-sum{display:flex;align-items:center;gap:9px;padding:12px 12px;cursor:pointer;list-style:none;user-select:none}'
            + '.smp-dom-sum::-webkit-details-marker{display:none}'
            + '.smp-dom-sum:hover{background:var(--surface-alt)}'
            + '.smp-twist{color:var(--text-faint);font-size:10px;transition:transform var(--dur-fast,.15s) var(--ease-out,ease)}'
            + '.smp-dom[open]>.smp-dom-sum .smp-twist{transform:rotate(90deg)}'
            + '.smp-dom-title{font-family:var(--font-display,var(--font-sans));font-weight:var(--fw-bold,700);font-size:14px;color:var(--text)}'
            + '.smp-dom-count{margin-left:auto;font-family:var(--font-mono,monospace);font-size:10.5px;color:var(--text-faint);background:var(--surface-alt);border-radius:var(--radius-pill,999px);padding:1px 8px}'
            + '.smp-dom-body{padding:2px 8px 10px}'
            + '.smp-fam{margin:6px 0 10px}'
            + '.smp-fam-head{display:flex;align-items:baseline;gap:8px;padding:4px 8px 6px}'
            + '.smp-fam-code{font-family:var(--font-mono,monospace);font-size:12px;font-weight:var(--fw-bold,700);color:var(--primary)}'
            + '.smp-fam-name{font-size:11px;color:var(--text-faint)}'
            + '.smp-leaf{display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:transparent;border:1px solid transparent;border-radius:var(--radius-sm,10px);padding:8px 10px;cursor:pointer;font:inherit;color:var(--text);transition:background var(--dur-fast,.15s) var(--ease-out,ease),border-color var(--dur-fast,.15s) var(--ease-out,ease)}'
            + '.smp-leaf:hover{background:var(--surface-alt);border-color:var(--border)}'
            + '.smp-leaf.is-active{background:var(--glass-tint-strong,rgba(16,185,129,.1));border-color:var(--primary)}'
            + '.smp-leaf-code{flex:none;font-family:var(--font-mono,monospace);font-size:12.5px;font-weight:var(--fw-bold,700);color:var(--text)}'
            + '.smp-leaf.is-active .smp-leaf-code{color:var(--primary-deep,var(--primary))}'
            + '.smp-leaf-name{flex:1;min-width:0;font-size:11.5px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
            + '.smp-leaf-x{flex:none;font-size:12px;color:var(--primary);line-height:1}';
        var style = document.createElement('style');
        style.id = 'smp-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    return { init: init, open: open };
})();
window.SampleLibrary = SampleLibrary;
