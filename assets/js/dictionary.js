// =============================================================================
// THE ISO 20022 DICTIONARY — module
// -----------------------------------------------------------------------------
// A browsable, deep-linkable reference. Three views, all rendered into one mount:
//   • Landing  — search + families → messages.
//   • Message  — metadata + the INTERACTIVE ANATOMY: the real sample XML rendered
//                as a tree, every element linking to its dictionary entry.
//   • Element  — a deep-linkable card: definition, cardinality, codes, example,
//                and every message it appears in.
//
// Anatomy structure comes live from /samples/<code>.json (accurate by
// construction); meaning comes from DICTIONARY.ELEMENTS keyed by localName.
// Self-contained: one global `AcademyDictionary` + injected styles.
// =============================================================================

const AcademyDictionary = (function () {
    const D = (typeof DICTIONARY !== 'undefined') ? DICTIONARY : { FAMILIES: [], MESSAGES: {}, ELEMENTS: {}, SAMPLE_FOR: {} };
    const C = (typeof CODESETS !== 'undefined') ? CODESETS : { SETS: [] };
    let mountId = 'dict-root';
    const xmlCache = {};        // code → parsed sample xml string
    let appearsIn = null;       // localName → [codes] (built lazily from samples)

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function root() { return document.getElementById(mountId); }

    function sampleCode(code) { return (D.SAMPLE_FOR && D.SAMPLE_FOR[code]) || code; }

    function loadXml(code) {
        const key = sampleCode(code);
        if (xmlCache[key] != null) return Promise.resolve(xmlCache[key]);
        return fetch('/samples/' + encodeURIComponent(key) + '.json', { cache: 'no-cache' })
            .then(function (r) { if (!r.ok) throw new Error('no sample'); return r.json(); })
            .then(function (j) { xmlCache[key] = j.xml || ''; return xmlCache[key]; })
            .catch(function () { xmlCache[key] = ''; return ''; });
    }

    // ── LANDING ─────────────────────────────────────────────────────────────
    function showLanding() {
        const el = root();
        if (!el) return;
        const byFam = {};
        Object.keys(D.MESSAGES).forEach(function (code) {
            const m = D.MESSAGES[code];
            (byFam[m.family] = byFam[m.family] || []).push(code);
        });
        const fams = D.FAMILIES.filter(function (f) { return byFam[f.id] && byFam[f.id].length; });

        const cards = fams.map(function (f) {
            const msgs = byFam[f.id].sort().map(function (code) {
                const m = D.MESSAGES[code];
                return '<button class="dict-msg" onclick="dictMessage(\'' + esc(code) + '\')">'
                    + '<span class="dict-msg-code">' + esc(code) + '</span>'
                    + '<span class="dict-msg-name">' + esc(m.name) + '</span>'
                    + '</button>';
            }).join('');
            return '<section class="dict-fam">'
                + '<div class="dict-fam-head"><span class="dict-fam-id">' + esc(f.id) + '</span>'
                + '<span class="dict-fam-name">' + esc(f.name) + '</span></div>'
                + '<p class="dict-fam-blurb">' + esc(f.blurb) + '</p>'
                + '<div class="dict-msg-grid">' + msgs + '</div>'
                + '</section>';
        }).join('');

        el.innerHTML =
            '<div class="dict-hero">'
            + '<div class="eyebrow">Reference</div>'
            + '<h2 class="section-title">The ISO 20022 Dictionary</h2>'
            + '<p class="section-description">Every message, every element — definition, cardinality, valid codes, and a live example. Open any message to explore its real anatomy, field by field.</p>'
            + '<input type="text" class="dict-search" id="dict-search" placeholder="Search elements and messages — try ChrgBr, UETR, pacs.008…" oninput="AcademyDictionary.filter(this.value)" autocomplete="off">'
            + '<div class="dict-results" id="dict-results" hidden></div>'
            + '</div>'
            + codeSetsSectionHtml()
            + '<div class="dict-families"><div class="dict-sec-label">Messages</div>' + cards + '</div>';
    }

    function codeSetsSectionHtml() {
        if (!C.SETS.length) return '';
        const cards = C.SETS.map(function (s) {
            return '<button class="dict-cset" onclick="dictCodeSet(\'' + esc(s.id) + '\')">'
                + '<span class="dict-cset-name">' + esc(s.name) + '</span>'
                + '<span class="dict-cset-count">' + s.codes.length + '</span>'
                + '<span class="dict-cset-blurb">' + esc(s.blurb) + '</span>'
                + '</button>';
        }).join('');
        return '<div class="dict-csets"><div class="dict-sec-label">Code sets</div>'
            + '<div class="dict-cset-grid">' + cards + '</div></div>';
    }

    // Client-side search across elements + messages.
    function filter(q) {
        const box = document.getElementById('dict-results');
        const fams = document.querySelector('.dict-families');
        if (!box) return;
        q = (q || '').trim().toLowerCase();
        if (!q) { box.hidden = true; box.innerHTML = ''; if (fams) fams.style.display = ''; return; }
        const hits = [];
        Object.keys(D.MESSAGES).forEach(function (code) {
            const m = D.MESSAGES[code];
            if (code.toLowerCase().indexOf(q) >= 0 || (m.name && m.name.toLowerCase().indexOf(q) >= 0)) {
                hits.push({ t: 'msg', code: code, label: code, sub: m.name });
            }
        });
        Object.keys(D.ELEMENTS).forEach(function (name) {
            const e = D.ELEMENTS[name];
            if (name.toLowerCase().indexOf(q) >= 0 || (e.def && e.def.toLowerCase().indexOf(q) >= 0)) {
                hits.push({ t: 'el', name: name, label: name, sub: (e.def || '').split('.')[0] });
            }
        });
        C.SETS.forEach(function (s) {
            if (s.name.toLowerCase().indexOf(q) >= 0) hits.push({ t: 'cset', id: s.id, label: s.name, sub: s.blurb });
            s.codes.forEach(function (c) {
                if (c.code.toLowerCase().indexOf(q) >= 0 || (c.name && c.name.toLowerCase().indexOf(q) >= 0)) {
                    hits.push({ t: 'code', id: s.id, code: c.code, label: c.code, sub: c.name + ' · ' + s.name });
                }
            });
        });
        hits.sort(function (a, b) { return a.label.length - b.label.length; });
        box.innerHTML = hits.slice(0, 40).map(function (h) {
            if (h.t === 'msg') {
                return '<button class="dict-hit" onclick="dictMessage(\'' + esc(h.code) + '\')">'
                    + '<span class="dict-hit-kind">message</span><span class="dict-hit-code">' + esc(h.label) + '</span>'
                    + '<span class="dict-hit-sub">' + esc(h.sub) + '</span></button>';
            }
            if (h.t === 'cset') {
                return '<button class="dict-hit" onclick="dictCodeSet(\'' + esc(h.id) + '\')">'
                    + '<span class="dict-hit-kind">code set</span><span class="dict-hit-code">' + esc(h.label) + '</span>'
                    + '<span class="dict-hit-sub">' + esc(h.sub) + '</span></button>';
            }
            if (h.t === 'code') {
                return '<button class="dict-hit" onclick="dictCodeSet(\'' + esc(h.id) + '\',\'' + esc(h.code) + '\')">'
                    + '<span class="dict-hit-kind">code</span><span class="dict-hit-code">' + esc(h.label) + '</span>'
                    + '<span class="dict-hit-sub">' + esc(h.sub) + '</span></button>';
            }
            return '<button class="dict-hit" onclick="dictElement(\'\',\'' + esc(h.name) + '\')">'
                + '<span class="dict-hit-kind">element</span><span class="dict-hit-code">' + esc(h.label) + '</span>'
                + '<span class="dict-hit-sub">' + esc(h.sub) + '</span></button>';
        }).join('') || '<div class="dict-noresults">No match. Try a shorter query.</div>';
        box.hidden = false;
        if (fams) fams.style.display = 'none';
    }

    // ── MESSAGE (interactive anatomy) ───────────────────────────────────────
    function showMessage(code) {
        const el = root();
        const m = D.MESSAGES[code];
        if (!el) return;
        if (!m) { showLanding(); return; }
        el.innerHTML =
            '<button class="dict-back" onclick="dictHome()">&larr; The Dictionary</button>'
            + '<div class="dict-msg-hero">'
            + '<div class="dict-msg-hero-top"><span class="dict-msg-hero-code">' + esc(code) + '</span>'
            + '<span class="dict-msg-hero-ver">' + esc(m.version) + '</span></div>'
            + '<h2 class="dict-msg-hero-name">' + esc(m.name) + '</h2>'
            + '<p class="dict-msg-hero-purpose">' + esc(m.purpose) + '</p>'
            + '<div class="dict-msg-meta">'
            + '<span class="dict-meta"><b>Direction</b> ' + esc(m.dir) + '</span>'
            + '<span class="dict-meta"><b>MT predecessor</b> ' + esc(m.mt) + '</span>'
            + '<span class="dict-meta"><b>Family</b> ' + esc(m.family) + '</span>'
            + '</div></div>'
            + '<div class="dict-anatomy-head"><h3>Anatomy</h3><span class="dict-anatomy-hint">hover a field for its meaning · click to open its entry</span></div>'
            + '<div class="dict-anatomy" id="dict-anatomy"><div class="dict-loading">Loading the message&hellip;</div></div>';

        loadXml(code).then(function (xml) {
            const wrap = document.getElementById('dict-anatomy');
            if (!wrap) return;
            const tree = buildTree(xml, code);
            wrap.innerHTML = tree || '<div class="dict-loading">No sample available for this message yet.</div>';
        });
    }

    function buildTree(xml, code) {
        if (!xml) return '';
        let doc;
        try { doc = new DOMParser().parseFromString(xml, 'application/xml'); }
        catch (e) { return ''; }
        if (!doc || doc.querySelector('parsererror') || !doc.documentElement) return '';
        return '<div class="dict-tree">' + renderNode(doc.documentElement, 0, code) + '</div>';
    }

    function renderNode(node, depth, code) {
        const kids = [];
        for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === 1) kids.push(node.childNodes[i]);
        }
        const name = node.localName || node.nodeName;
        const entry = D.ELEMENTS[name];
        const def = entry ? entry.def : '';
        const known = entry ? ' is-known' : '';
        const title = def ? ' title="' + esc(def) + '"' : '';
        const nameHtml = '<span class="dict-el' + known + '"' + title
            + ' onclick="dictElement(\'' + esc(code) + '\',\'' + esc(name) + '\')">' + esc(name) + '</span>';

        // leaf?
        if (kids.length === 0) {
            const val = (node.textContent || '').trim();
            const attrs = attrHtml(node);
            const valHtml = val ? '<span class="dict-val">' + esc(val) + '</span>' : '';
            return '<div class="dict-row" style="--d:' + depth + '">' + nameHtml + attrs
                + (val || attrs ? '<span class="dict-colon">:</span>' : '') + valHtml + '</div>';
        }
        const inner = kids.map(function (k) { return renderNode(k, depth + 1, code); }).join('');
        return '<div class="dict-branch" style="--d:' + depth + '">' + nameHtml + attrHtml(node)
            + '<span class="dict-count">' + kids.length + '</span></div>' + inner;
    }

    function attrHtml(node) {
        const out = [];
        for (let i = 0; i < (node.attributes ? node.attributes.length : 0); i++) {
            const a = node.attributes[i];
            if (a.name === 'xmlns' || a.name.indexOf('xmlns:') === 0) continue;
            out.push('<span class="dict-attr">' + esc(a.name) + '="' + esc(a.value) + '"</span>');
        }
        return out.length ? '<span class="dict-attrs">' + out.join(' ') + '</span>' : '';
    }

    // ── ELEMENT (deep-linkable card) ────────────────────────────────────────
    function buildAppearsIn() {
        if (appearsIn) return Promise.resolve(appearsIn);
        appearsIn = {};
        const codes = Object.keys(D.MESSAGES);
        return Promise.all(codes.map(function (code) {
            return loadXml(code).then(function (xml) {
                if (!xml) return;
                let doc; try { doc = new DOMParser().parseFromString(xml, 'application/xml'); } catch (e) { return; }
                if (!doc || !doc.documentElement || doc.querySelector('parsererror')) return;
                const seen = {};
                const all = doc.getElementsByTagName('*');
                for (let i = 0; i < all.length; i++) {
                    const n = all[i].localName || all[i].nodeName;
                    if (!seen[n]) { seen[n] = 1; (appearsIn[n] = appearsIn[n] || []).push(code); }
                }
            });
        })).then(function () { return appearsIn; });
    }

    function showElement(code, name) {
        const el = root();
        if (!el) return;
        const entry = D.ELEMENTS[name];
        const back = code && D.MESSAGES[code]
            ? '<button class="dict-back" onclick="dictMessage(\'' + esc(code) + '\')">&larr; ' + esc(code) + '</button>'
            : '<button class="dict-back" onclick="dictHome()">&larr; The Dictionary</button>';

        if (!entry) {
            el.innerHTML = back + '<div class="dict-el-hero"><h2 class="dict-el-name">&lt;' + esc(name) + '&gt;</h2>'
                + '<p class="dict-el-def">This element isn’t in the dictionary yet. Its structure is still visible in any message that carries it.</p></div>'
                + '<div class="dict-appears" id="dict-appears"></div>';
        } else {
            const codesHtml = entry.codes && entry.codes.length
                ? '<div class="dict-card"><div class="dict-card-h">Valid codes</div><ul class="dict-codes">'
                + entry.codes.map(function (c) { return '<li><code>' + esc(c.split(' — ')[0]) + '</code>' + (c.indexOf(' — ') >= 0 ? '<span>' + esc(c.split(' — ').slice(1).join(' — ')) + '</span>' : '') + '</li>'; }).join('')
                + '</ul></div>' : '';
            const exHtml = entry.ex ? '<div class="dict-card"><div class="dict-card-h">Example</div><pre class="dict-ex">' + esc(entry.ex) + '</pre></div>' : '';
            const noteHtml = entry.note ? '<div class="dict-note"><b>Watch out.</b> ' + esc(entry.note) + '</div>' : '';
            el.innerHTML = back
                + '<div class="dict-el-hero">'
                + '<div class="dict-el-tag">&lt;' + esc(name) + '&gt;</div>'
                + '<p class="dict-el-def">' + esc(entry.def) + '</p>'
                + '<div class="dict-el-meta"><span class="dict-meta"><b>Cardinality</b> <code>' + esc(entry.c || '—') + '</code></span></div>'
                + noteHtml
                + '</div>'
                + '<div class="dict-cards">' + codesHtml + exHtml + '</div>'
                + '<div class="dict-appears" id="dict-appears"><div class="dict-loading">Finding where it appears&hellip;</div></div>';
        }

        buildAppearsIn().then(function (map) {
            const box = document.getElementById('dict-appears');
            if (!box) return;
            const list = (map[name] || []).sort();
            if (!list.length) { box.innerHTML = ''; return; }
            box.innerHTML = '<div class="dict-card-h">Appears in</div><div class="dict-appears-list">'
                + list.map(function (c) { return '<button class="dict-chip" onclick="dictMessage(\'' + esc(c) + '\')">' + esc(c) + '</button>'; }).join('')
                + '</div>';
        });
    }

    // ── CODE SETS ───────────────────────────────────────────────────────────
    function showCodeSets() {
        const el = root();
        if (!el) return;
        const cards = C.SETS.map(function (s) {
            return '<button class="dict-cset" onclick="dictCodeSet(\'' + esc(s.id) + '\')">'
                + '<span class="dict-cset-name">' + esc(s.name) + '</span>'
                + '<span class="dict-cset-count">' + s.codes.length + '</span>'
                + '<span class="dict-cset-blurb">' + esc(s.blurb) + '</span></button>';
        }).join('');
        el.innerHTML = '<button class="dict-back" onclick="dictHome()">&larr; The Dictionary</button>'
            + '<div class="dict-el-hero"><h2 class="dict-el-name">Code sets</h2>'
            + '<p class="dict-el-def">The external code lists a payments engineer looks up constantly — reason, purpose, status, settlement, and the small closed lists.</p></div>'
            + '<div class="dict-cset-grid">' + cards + '</div>';
    }

    function showCodeSet(id, q) {
        const el = root();
        if (!el) return;
        const s = C.SETS.filter(function (x) { return x.id === id; })[0];
        if (!s) { showCodeSets(); return; }
        const rows = s.codes.map(function (c) {
            return '<tr class="dict-crow" data-kw="' + esc((c.code + ' ' + c.name + ' ' + c.desc).toLowerCase()) + '">'
                + '<td class="dict-ccode">' + esc(c.code) + '</td>'
                + '<td class="dict-cname">' + esc(c.name) + '</td>'
                + '<td class="dict-cdesc">' + esc(c.desc) + '</td></tr>';
        }).join('');
        const note = s.note ? '<p class="dict-cset-note">' + esc(s.note) + '</p>' : '';
        el.innerHTML = '<button class="dict-back" onclick="dictCodes()">&larr; Code sets</button>'
            + '<div class="dict-msg-hero"><div class="dict-msg-hero-top"><span class="dict-msg-hero-code">' + esc(s.name) + '</span>'
            + '<span class="dict-msg-hero-ver">' + s.codes.length + ' codes</span></div>'
            + '<p class="dict-msg-hero-purpose">' + esc(s.blurb) + '</p>'
            + '<div class="dict-msg-meta"><span class="dict-meta"><b>Carried in</b> ' + esc(s.field) + '</span></div>' + note + '</div>'
            + '<input type="text" class="dict-search" id="dict-cfilter" placeholder="Filter these codes…" oninput="AcademyDictionary.filterCodes(this.value)" autocomplete="off">'
            + '<div class="dict-ctable-wrap"><table class="dict-ctable"><thead><tr><th>Code</th><th>Name</th><th>Meaning</th></tr></thead>'
            + '<tbody id="dict-ctbody">' + rows + '</tbody></table></div>';
        if (q) { const f = document.getElementById('dict-cfilter'); if (f) { f.value = q; filterCodes(q); } }
    }

    function filterCodes(q) {
        q = (q || '').trim().toLowerCase();
        const rows = document.querySelectorAll('#dict-ctbody .dict-crow');
        for (let i = 0; i < rows.length; i++) {
            const kw = rows[i].getAttribute('data-kw') || '';
            rows[i].style.display = (!q || kw.indexOf(q) >= 0) ? '' : 'none';
        }
    }

    // ── styles ──────────────────────────────────────────────────────────────
    function injectStyles() {
        if (typeof document === 'undefined' || !document.head || document.getElementById('dict-styles')) return;
        const css = ''
            + '.dict-hero{max-width:760px;margin:0 auto 28px}'
            + '.dict-search{width:100%;margin-top:18px;padding:13px 16px;font:inherit;font-size:15px;color:var(--text);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-pill,999px);outline:none}'
            + '.dict-search:focus{border-color:var(--primary);box-shadow:var(--ring)}'
            + '.dict-results{margin-top:12px;display:flex;flex-direction:column;gap:6px}'
            + '.dict-hit{display:flex;align-items:center;gap:10px;text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm,10px);padding:9px 12px;cursor:pointer;font:inherit;color:var(--text)}'
            + '.dict-hit:hover{border-color:var(--primary)}'
            + '.dict-hit-kind{font-family:var(--font-mono,monospace);font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-faint);background:var(--surface-alt);border-radius:999px;padding:2px 7px;flex:none}'
            + '.dict-hit-code{font-family:var(--font-mono,monospace);font-weight:700;font-size:13px;color:var(--primary-deep,var(--primary));flex:none}'
            + '.dict-hit-sub{font-size:12.5px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
            + '.dict-noresults{padding:16px;text-align:center;color:var(--text-muted)}'
            + '.dict-families{display:flex;flex-direction:column;gap:10px}'
            + '.dict-fam{padding:18px 0;border-top:1px solid var(--border)}'
            + '.dict-fam-head{display:flex;align-items:baseline;gap:11px}'
            + '.dict-fam-id{font-family:var(--font-mono,monospace);font-weight:700;font-size:15px;color:var(--primary)}'
            + '.dict-fam-name{font-family:var(--font-display,var(--font-sans));font-weight:700;font-size:18px;color:var(--text)}'
            + '.dict-fam-blurb{margin:5px 0 14px;color:var(--text-muted);font-size:14px}'
            + '.dict-msg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}'
            + '.dict-msg{display:flex;flex-direction:column;gap:3px;text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md,14px);padding:12px 14px;cursor:pointer;font:inherit;color:var(--text);transition:border-color .15s,transform .15s}'
            + '.dict-msg:hover{border-color:var(--primary);transform:translateY(-2px)}'
            + '.dict-msg-code{font-family:var(--font-mono,monospace);font-weight:700;font-size:14px;color:var(--text)}'
            + '.dict-msg-name{font-size:12.5px;color:var(--text-muted)}'
            + '.dict-back{display:inline-flex;align-items:center;gap:6px;margin:0 0 18px;padding:6px 14px;background:transparent;border:1px solid var(--border);border-radius:var(--radius-pill,999px);cursor:pointer;font-family:var(--font-mono,monospace);font-size:11.5px;color:var(--text-muted)}'
            + '.dict-back:hover{border-color:var(--primary);color:var(--text)}'
            + '.dict-msg-hero{padding:20px 22px;background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--primary);border-radius:var(--radius-md,14px);margin-bottom:22px}'
            + '.dict-msg-hero-top{display:flex;align-items:baseline;gap:12px}'
            + '.dict-msg-hero-code{font-family:var(--font-mono,monospace);font-weight:700;font-size:22px;color:var(--text)}'
            + '.dict-msg-hero-ver{font-family:var(--font-mono,monospace);font-size:12px;color:var(--text-faint)}'
            + '.dict-msg-hero-name{margin:6px 0 8px;font-size:18px;color:var(--text)}'
            + '.dict-msg-hero-purpose{margin:0 0 14px;color:var(--text-muted);font-size:14.5px;line-height:1.6;max-width:70ch}'
            + '.dict-msg-meta{display:flex;flex-wrap:wrap;gap:8px}'
            + '.dict-meta{font-size:12px;color:var(--text-muted);background:var(--surface-alt);border:1px solid var(--border);border-radius:999px;padding:4px 11px}'
            + '.dict-meta b{color:var(--text-faint);font-weight:600;margin-right:5px;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em}'
            + '.dict-anatomy-head{display:flex;align-items:baseline;gap:12px;margin-bottom:10px}'
            + '.dict-anatomy-head h3{margin:0;font-size:15px}'
            + '.dict-anatomy-hint{font-size:11.5px;color:var(--text-faint);font-style:italic}'
            + '.dict-anatomy{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md,14px);padding:14px 16px;overflow-x:auto}'
            + '.dict-tree{font-family:var(--font-mono,monospace);font-size:13px;line-height:1.7}'
            + '.dict-row,.dict-branch{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;padding-left:calc(var(--d,0) * 18px)}'
            + '.dict-branch{margin-top:1px}'
            + '.dict-el{color:var(--text-faint);cursor:default;border-radius:4px;padding:0 3px}'
            + '.dict-el.is-known{color:var(--primary-bright,var(--primary));cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px}'
            + '.dict-el.is-known:hover{background:var(--glass-tint-strong,rgba(16,185,129,.12));color:var(--primary-deep,var(--primary))}'
            + '.dict-count{font-size:10px;color:var(--text-faint);background:var(--surface-alt);border-radius:999px;padding:0 7px}'
            + '.dict-colon{color:var(--text-faint)}'
            + '.dict-val{color:var(--text)}'
            + '.dict-attrs{margin-left:2px}'
            + '.dict-attr{font-size:11px;color:var(--warning)}'
            + '.dict-el-hero{padding:20px 22px;background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--primary);border-radius:var(--radius-md,14px);margin-bottom:18px}'
            + '.dict-el-tag,.dict-el-name{font-family:var(--font-mono,monospace);font-weight:700;font-size:22px;color:var(--text);margin:0 0 10px}'
            + '.dict-el-def{margin:0 0 12px;font-size:15.5px;line-height:1.65;color:var(--text)}'
            + '.dict-el-meta{display:flex;gap:8px}'
            + '.dict-el-meta code,.dict-meta code{font-family:var(--font-mono,monospace);color:var(--primary-deep,var(--primary))}'
            + '.dict-note{margin-top:12px;padding:11px 14px;background:color-mix(in srgb,var(--warning) 8%,var(--surface));border:1px solid var(--border);border-left:3px solid var(--warning);border-radius:var(--radius-sm,10px);font-size:13.5px;color:var(--text-muted)}'
            + '.dict-note b{color:var(--text)}'
            + '.dict-cards{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:18px}'
            + '.dict-card{flex:1;min-width:260px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md,14px);padding:14px 16px}'
            + '.dict-card-h{font-family:var(--font-mono,monospace);font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--primary);margin-bottom:10px}'
            + '.dict-codes{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}'
            + '.dict-codes li{display:flex;align-items:baseline;gap:9px}'
            + '.dict-codes code{font-family:var(--font-mono,monospace);font-weight:700;font-size:12.5px;color:var(--text);background:var(--surface-alt);border-radius:6px;padding:2px 8px;flex:none}'
            + '.dict-codes span{font-size:13px;color:var(--text-muted)}'
            + '.dict-ex{margin:0;padding:12px;background:var(--bg-deep,var(--surface-alt));border-radius:var(--radius-sm,10px);font-family:var(--font-mono,monospace);font-size:12.5px;color:var(--text);white-space:pre-wrap;word-break:break-word}'
            + '.dict-appears{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md,14px);padding:14px 16px}'
            + '.dict-appears-list{display:flex;flex-wrap:wrap;gap:8px}'
            + '.dict-chip{font-family:var(--font-mono,monospace);font-size:12.5px;font-weight:700;color:var(--primary-deep,var(--primary));background:var(--surface-alt);border:1px solid var(--border);border-radius:999px;padding:5px 13px;cursor:pointer}'
            + '.dict-chip:hover{border-color:var(--primary)}'
            + '.dict-loading{padding:20px;text-align:center;color:var(--text-muted);font-size:13px}'
            + '.dict-sec-label{font-family:var(--font-mono,monospace);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint);margin:0 0 12px}'
            + '.dict-csets{margin:0 0 30px}'
            + '.dict-cset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}'
            + '.dict-cset{display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto;gap:2px 8px;text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md,14px);padding:13px 15px;cursor:pointer;font:inherit;color:var(--text);transition:border-color .15s,transform .15s}'
            + '.dict-cset:hover{border-color:var(--primary);transform:translateY(-2px)}'
            + '.dict-cset-name{font-family:var(--font-display,var(--font-sans));font-weight:700;font-size:14.5px;color:var(--text)}'
            + '.dict-cset-count{font-family:var(--font-mono,monospace);font-size:10.5px;color:var(--text-faint);background:var(--surface-alt);border-radius:999px;padding:1px 8px;align-self:start}'
            + '.dict-cset-blurb{grid-column:1 / -1;font-size:12px;color:var(--text-muted);line-height:1.45}'
            + '.dict-cset-note{margin:12px 0 0;font-size:12.5px;color:var(--text-faint);font-style:italic}'
            + '.dict-ctable-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md,14px);overflow:hidden;margin-top:14px}'
            + '.dict-ctable{width:100%;border-collapse:collapse;font-size:13.5px}'
            + '.dict-ctable thead th{text-align:left;font-family:var(--font-mono,monospace);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-faint);padding:11px 16px;background:var(--bg-deep,var(--surface-alt));border-bottom:1px solid var(--border)}'
            + '.dict-crow{border-bottom:1px solid var(--border)}'
            + '.dict-crow:last-child{border-bottom:none}'
            + '.dict-crow:hover{background:var(--surface-alt)}'
            + '.dict-crow td{padding:11px 16px;vertical-align:top}'
            + '.dict-ccode{font-family:var(--font-mono,monospace);font-weight:700;color:var(--primary-deep,var(--primary));white-space:nowrap}'
            + '.dict-cname{font-family:var(--font-mono,monospace);font-size:12.5px;color:var(--text);white-space:nowrap}'
            + '.dict-cdesc{color:var(--text-muted);line-height:1.5}'
            + '@media (max-width:640px){.dict-cname{display:none}.dict-ctable thead th:nth-child(2){display:none}}';
        const s = document.createElement('style');
        s.id = 'dict-styles';
        s.textContent = css;
        document.head.appendChild(s);
    }

    function init(id) {
        mountId = id || 'dict-root';
        injectStyles();
        showLanding();
    }

    return { init: init, showLanding: showLanding, showMessage: showMessage, showElement: showElement, filter: filter, showCodeSets: showCodeSets, showCodeSet: showCodeSet, filterCodes: filterCodes };
})();
window.AcademyDictionary = AcademyDictionary;
