// =============================================================================
// PLAYGROUND · LIVE TRANSLATOR (rules engine + AI)
// -----------------------------------------------------------------------------
// Pick a Source format (or just paste: the Source is detected). The Destination
// is always the Source's direct equivalent, so every result is a faithful
// translation. Each Source loads a valid sample of that format.
//
// Translate first checks the message (POST /api/check). If it has errors, the
// visitor chooses: Fix, then translate, or Translate anyway.
// Hybrid: the server's rules engine translates and fixes every message it has
// rules for, instantly; the AI (Google ADK on Gemini) takes over only when the
// engine can't. Every result comes back with the same checks, shown here,
// along with which of the two did the work.
//
// Self-contained: one global `Translator`. Styles live in style.css (".tr-").
// =============================================================================

const Translator = (function () {
    'use strict';

    // The AI API. Swap to 'http://localhost:8000' to test against a local server.
    const AI_API = 'https://iso20022academy-ai-api.onrender.com';
    const TIMEOUT_MS = 120000;

    // Every Source the Translator offers, its direct equivalent, and its sample file.
    const FORMATS = {
        'pacs.008':  { std: 'MX', name: 'FI-to-FI customer credit transfer', pair: 'MT103', file: 'pacs.008' },
        'pacs.004':  { std: 'MX', name: 'Payment return', pair: 'MT103 RETN', file: 'pacs.004' },
        'pacs.002':  { std: 'MX', name: 'FI-to-FI payment status report', pair: 'MT199', file: 'pacs.002' },
        'pain.001':  { std: 'MX', name: 'Customer credit transfer initiation', pair: 'MT101', file: 'pain.001' },
        'pain.002':  { std: 'MX', name: 'Customer payment status report', pair: 'MT199', file: 'pain.002' },
        'pain.008':  { std: 'MX', name: 'Customer direct debit initiation', pair: 'MT104', file: 'pain.008' },
        'camt.053':  { std: 'MX', name: 'Bank-to-customer statement', pair: 'MT940', file: 'camt.053' },
        'camt.054':  { std: 'MX', name: 'Debit / credit notification', pair: 'MT900 / MT910', file: 'camt.054' },
        'camt.056':  { std: 'MX', name: 'Payment cancellation request', pair: 'MT192', file: 'camt.056' },
        'MT103':         { std: 'MT', name: 'Single customer credit transfer', pair: 'pacs.008', file: 'MT103' },
        'MT103 RETN':    { std: 'MT', name: 'Customer transfer used as a return', pair: 'pacs.004', file: 'MT103-RETN' },
        'MT101':         { std: 'MT', name: 'Request for transfer', pair: 'pain.001', file: 'MT101' },
        'MT104':         { std: 'MT', name: 'Direct debit and request for debit transfer', pair: 'pain.008', file: 'MT104' },
        'MT940':         { std: 'MT', name: 'Customer statement', pair: 'camt.053', file: 'MT940' },
        'MT900 / MT910': { std: 'MT', name: 'Confirmation of debit / credit', pair: 'camt.054', file: 'MT910' },
        'MT192':         { std: 'MT', name: 'Request for cancellation', pair: 'camt.056', file: 'MT192' },
        'MT199':         { std: 'MT', name: 'Free format message', pair: null, file: 'MT199' }
    };
    const ORDER_MX = ['pacs.008', 'pacs.004', 'pacs.002', 'pain.001', 'pain.002', 'pain.008', 'camt.053', 'camt.054', 'camt.056'];
    const ORDER_MT = ['MT103', 'MT103 RETN', 'MT101', 'MT104', 'MT940', 'MT900 / MT910', 'MT192', 'MT199'];

    let mountId = 'tr-root';
    let detected = null;        // { code, std, version } or null
    let current = 'pacs.008';   // the selected Source
    let sampleText = '';        // the sample currently in the box, untouched
    const samples = {};         // code → text cache
    let busy = false;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function $(id) { return document.getElementById(id); }
    function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

    // ── Detection ───────────────────────────────────────────────────────────
    function detect(text) {
        const t = (text || '').trim();
        if (!t) return null;
        if (t.charAt(0) === '<') {
            const all = t.match(/urn:iso:std:iso:20022:tech:xsd:[a-z]{4}\.\d{3}\.\d{3}\.\d{2}/g) || [];
            const ns = all.map(function (u) { return u.replace(/^.*xsd:/, ''); }).filter(function (c) { return c.indexOf('head.') !== 0; });
            return ns.length ? { code: ns[0].slice(0, 8), std: 'MX', version: ns[0] } : { code: null, std: 'MX', version: null };
        }
        const b2 = t.match(/\{2:[IO](\d{3})/);
        const retn = /:72:\s*\/RETN\//.test(t);
        if (b2) {
            const n = b2[1];
            if (n === '103') return { code: retn ? 'MT103 RETN' : 'MT103', std: 'MT' };
            if (n === '900' || n === '910') return { code: 'MT900 / MT910', std: 'MT' };
            return { code: 'MT' + n, std: 'MT' };
        }
        const has = function (tag) { return new RegExp('(^|\\n)\\s*:' + tag + ':').test(t); };
        if (retn && has('32A')) return { code: 'MT103 RETN', std: 'MT' };
        if (has('28D')) return { code: 'MT101', std: 'MT' };
        if ((has('60F') || has('60M')) && (has('62F') || has('62M'))) return { code: 'MT940', std: 'MT' };
        if (has('11S')) return { code: 'MT192', std: 'MT' };
        if (has('19') && has('30') && has('32B')) return { code: 'MT104', std: 'MT' };
        if (has('23B') || (has('32A') && (has('50K') || has('50A') || has('50F')) && (has('59') || has('59A') || has('59F')))) return { code: 'MT103', std: 'MT' };
        if (has('21') && has('25') && has('32A')) return { code: 'MT900 / MT910', std: 'MT' };
        if (has('79') && !has('32A')) return { code: 'MT199', std: 'MT' };
        if (/(^|\n)\s*:\d{2}[A-Z]?:/.test(t)) return { code: null, std: 'MT' };
        return null;
    }

    // Only direct equivalents are offered: { ok, direct, title, body }.
    function checkPair(src, tgt) {
        const S = FORMATS[src];
        if (!S) return { ok: false, title: src + ' isn’t supported yet.', body: 'Pick one of the listed Source formats.' };
        if (!S.pair) return { ok: false, title: src + ' has no structured equivalent.', body: 'It’s free text, so there is nothing faithful to translate it into.' };
        if (tgt && tgt !== S.pair) return { ok: false, title: src + ' translates to ' + S.pair + '.', body: 'The Translator only produces direct equivalents.' };
        return { ok: true, direct: true };
    }

    // camt.054 → MT900 for a debit, MT910 for a credit; the label follows the message.
    function destinationLabel(code, text) {
        const f = FORMATS[code];
        if (!f) return { label: '—', note: 'not supported' };
        if (!f.pair) return { label: 'No equivalent', note: 'free text' };
        if (code === 'camt.054') {
            const m = /<CdtDbtInd>\s*(CRDT|DBIT)\s*<\/CdtDbtInd>/.exec(text || '');
            if (m) return { label: m[1] === 'DBIT' ? 'MT900' : 'MT910', note: m[1] === 'DBIT' ? 'confirmation of debit' : 'confirmation of credit' };
        }
        return { label: f.pair, note: FORMATS[f.pair] ? FORMATS[f.pair].name.toLowerCase() : '' };
    }

    // ── Rendering ───────────────────────────────────────────────────────────
    function sourceOptions() {
        const group = function (label, list) {
            return '<optgroup label="' + label + '">' + list.map(function (c) {
                return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
            }).join('') + '</optgroup>';
        };
        return group('ISO 20022', ORDER_MX) + group('SWIFT MT', ORDER_MT);
    }

    function rowsHtml(list) {
        return list.map(function (c) {
            const f = FORMATS[c];
            const state = f.pair ? '<span class="tr-state is-live">Translates</span>' : '<span class="tr-state is-none">No equivalent</span>';
            return '<li class="tr-row" data-src="' + esc(c) + '">'
                + '<span class="tr-row-pair"><code>' + esc(c) + '</code><span class="tr-row-arrow" aria-hidden="true">&rarr;</span><code>' + esc(f.pair || '—') + '</code></span>'
                + '<span class="tr-row-name">' + esc(f.name) + '</span>' + state + '</li>';
        }).join('');
    }

    function sectionHtml(std, code, title, blurb, list) {
        const n = list.filter(function (c) { return FORMATS[c].pair; }).length;
        return '<li class="cs-item"><details class="course-sec tr-sec" data-std="' + std + '">'
            + '<summary class="cs-head"><span class="cs-code">' + code + '</span>'
            + '<span class="cs-head-text"><span class="cs-name">' + title + '</span><span class="cs-blurb">' + blurb + '</span></span>'
            + '<span class="cs-meta">' + n + ' of ' + list.length + ' translate</span>'
            + '<span class="cs-chev" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>'
            + '</summary><div class="cs-body"><ol class="tr-rows">' + rowsHtml(list) + '</ol></div></details></li>';
    }

    const SPARK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 5.6L19.5 9l-5.7 1.4L12 16l-1.8-5.6L4.5 9l5.7-1.4z"/><path d="M19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9z" opacity=".7"/></svg>';

    function render() {
        const el = $(mountId);
        if (!el) return;
        el.innerHTML =
            '<div class="tr">'
            + '<div class="tr-toolbar">'
            +   '<div class="tr-tools-left">'
            +     '<label class="tr-field"><span class="tr-label">Source</span>'
            +       '<select id="tr-source" class="tr-select" onchange="Translator.onSource()">' + sourceOptions() + '</select></label>'
            +     '<span class="tr-arrow" aria-hidden="true">&rarr;</span>'
            +     '<div class="tr-field"><span class="tr-label">Destination</span>'
            +       '<div id="tr-target" class="tr-dest" aria-live="polite" title="Always the Source’s direct equivalent"></div></div>'
            +     '<div class="tr-actions">'
            +       '<button type="button" class="tr-go" id="tr-go" onclick="Translator.translate()">' + SPARK + ' Translate</button>'
            +     '</div>'
            +   '</div>'
            +   '<div class="tr-tools-right">'
            +     '<button type="button" class="tr-copy" id="tr-copy" onclick="Translator.copy(this)" disabled>Copy</button>'
            +   '</div>'
            + '</div>'
            + '<div class="tr-notice" id="tr-notice" hidden></div>'
            + '<div class="tr-grid">'
            +   '<section class="tr-pane" aria-label="Your message">'
            +     '<div class="tr-bar"><span class="tr-bar-title">Your message</span><span class="tr-version" id="tr-version"></span>'
            +       '<span class="tr-bar-tools">'
            +         '<button type="button" class="tr-mini" onclick="Translator.pasteOwn()">Paste your own</button>'
            +         '<button type="button" class="tr-mini" onclick="Translator.loadSample()">Load sample</button>'
            +       '</span></div>'
            +     '<textarea id="tr-src" class="tr-src" spellcheck="false" autocomplete="off" aria-label="Message"'
            +       ' placeholder="Paste a pacs.008, pain.001, camt.053, MT103… message here" oninput="Translator.onInput()"></textarea>'
            +     '<div class="tr-privacy">Don’t paste real customer data. Your message is translated on our server and never stored. Only a message the rules engine can’t handle is passed to Google Gemini.</div>'
            +   '</section>'
            +   '<section class="tr-pane tr-pane-out" aria-label="Result" aria-live="polite">'
            +     '<div class="tr-bar"><span class="tr-bar-title" id="tr-out-title">Translation</span><span class="tr-badge" id="tr-badge"></span></div>'
            +     '<div class="tr-out" id="tr-out">' + emptyOutHtml() + '</div>'
            +   '</section>'
            + '</div>'
            + '<div class="course-bar" id="tr-pairs"><span class="course-bar-label">Supported translations</span></div>'
            + '<ol class="course-outline">'
            +   sectionHtml('MX', 'MX', 'ISO 20022 → SWIFT MT', 'Each ISO 20022 message translates into the MT message that carries the same information.', ORDER_MX)
            +   sectionHtml('MT', 'MT', 'SWIFT MT → ISO 20022', 'Each MT translates into the ISO 20022 message that replaces it. MT199 is free text, so it has no equivalent.', ORDER_MT)
            + '</ol>'
            + '</div>';
    }

    function emptyOutHtml() {
        const f = FORMATS[current];
        return '<div class="tr-empty"><p><strong>Your translation appears here.</strong></p>'
            + '<p>The message on the left is a valid ' + esc(current) + ' sample' + (f && f.pair ? '. Press <b>Translate</b> to turn it into ' + esc(destinationLabel(current, getSource()).label) + '.' : '.')
            + ' Pick another Source to see its sample, or paste your own message.</p></div>';
    }

    // ── State updates ───────────────────────────────────────────────────────
    function syncDestination() {
        const d = destinationLabel(current, getSource());
        const box = $('tr-target');
        if (box) {
            box.className = 'tr-dest' + (FORMATS[current] && FORMATS[current].pair ? '' : ' is-none');
            box.innerHTML = '<span class="tr-dest-code">' + esc(d.label) + '</span>' + (d.note ? '<span class="tr-dest-note">' + esc(d.note) + '</span>' : '');
        }
        const go = $('tr-go');
        if (go && !busy) go.disabled = !(FORMATS[current] && FORMATS[current].pair);
        const v = $('tr-version');
        if (v) v.textContent = (detected && detected.version) ? detected.version : '';
    }

    function onInput() {
        const src = $('tr-src');
        const text = src ? src.value : '';
        detected = detect(text);
        hideNotice();
        if (detected && detected.code && FORMATS[detected.code]) {
            current = detected.code;
            const sel = $('tr-source'); if (sel) sel.value = current;
        }
        const out = $('tr-out');
        if (out && out.querySelector('.tr-empty') && text.trim() && text !== sampleText) {
            out.innerHTML = '<div class="tr-empty"><p><strong>Ready when you are.</strong></p><p>Check the Source above, then press <b>Translate</b>. Your message is checked first, and if it has errors you can have them fixed.</p></div>';
        }
        if (detected && detected.code && !FORMATS[detected.code]) {
            showNotice('warn', detected.code + ' isn’t supported yet.', 'The Translator covers the formats listed below.', true);
        }
        syncDestination();
    }

    // Picking a Source loads its sample, unless the box holds the visitor's own message.
    function onSource() {
        const sel = $('tr-source');
        current = sel ? sel.value : current;
        hideNotice();
        const text = getSource().trim();
        const own = text && text !== sampleText.trim();
        if (own) {
            const d = detect(text);
            if (d && d.code && d.code !== current) {
                showNotice('warn', 'Your message is a ' + d.code + ', not a ' + current + '.',
                    'Paste a ' + current + ' message, or load the sample to see what one looks like.', false, true);
            } else {
                showNotice('info', 'Source set to ' + current + '.', 'Your message is still in the box.', false, true);
            }
            syncDestination();
            return;
        }
        loadSample();
    }

    function hideNotice() { const n = $('tr-notice'); if (n) { n.hidden = true; n.innerHTML = ''; } }
    function showNotice(kind, title, body, withPairs, withSample) {
        const n = $('tr-notice');
        if (!n) return;
        n.className = 'tr-notice is-' + kind;
        n.innerHTML = '<div class="tr-notice-title">' + esc(title) + '</div>'
            + (body ? '<p>' + esc(body) + '</p>' : '')
            + (withSample ? '<button type="button" class="tr-notice-link" onclick="Translator.loadSample()">Load the ' + esc(current) + ' sample</button> ' : '')
            + (withPairs ? '<button type="button" class="tr-notice-link" onclick="Translator.showPairs()">See the supported translations &darr;</button>' : '');
        n.hidden = false;
    }

    function showPairs() {
        const std = FORMATS[current] && FORMATS[current].std;
        document.querySelectorAll('.tr-sec').forEach(function (d) { if (!std || d.dataset.std === std) d.open = true; });
        document.querySelectorAll('.tr-row.is-hit').forEach(function (r) { r.classList.remove('is-hit'); });
        const row = document.querySelector('.tr-row[data-src="' + current.replace(/"/g, '') + '"]');
        if (row) row.classList.add('is-hit');
        const anchor = $('tr-pairs');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function setOut(html, badgeHtml, copyable, title) {
        const out = $('tr-out'), badge = $('tr-badge'), copyBtn = $('tr-copy'), t = $('tr-out-title');
        if (out) out.innerHTML = html;
        if (badge) badge.innerHTML = badgeHtml || '';
        if (copyBtn) copyBtn.disabled = !copyable;
        if (t && title) t.textContent = title;
    }
    function setBusy(on) {
        busy = on;
        const go = $('tr-go'); if (go) go.disabled = on || !(FORMATS[current] && FORMATS[current].pair);
    }

    // ── The flow: check → (fix?) → translate ────────────────────────────────
    function readSource() {
        const text = getSource().trim();
        hideNotice();
        if (!text) { showNotice('warn', 'Paste a message first.', 'Or press Load sample.'); return null; }
        detected = detect(text);
        if (!detected) {
            showNotice('warn', 'This doesn’t look like a payment message.', 'Paste ISO 20022 XML (it starts with <) or a SWIFT MT message (fields like :20: and :32A:).');
            return null;
        }
        if (FORMATS[current] && FORMATS[current].std !== detected.std) {
            showNotice('err', 'The message doesn’t match the Source.', 'What you pasted is ' + (detected.std === 'MX' ? 'ISO 20022 XML' : 'a SWIFT MT message') + ', but Source is ' + current + '.', false, true);
            return null;
        }
        if (detected.code && detected.code !== current && FORMATS[detected.code]) current = detected.code;
        const verdict = checkPair(current);
        if (!verdict.ok) { showNotice('err', verdict.title, verdict.body, true); return null; }
        return { text: text, srcCode: current, target: FORMATS[current].pair };
    }

    function loading(what, flow) {
        setOut('<div class="tr-loading"><span class="tr-spin" aria-hidden="true"></span><div><strong>' + what + '</strong><br>'
            + 'The rules engine applies the field rules for this pair and our checks compare every value with your original. '
            + 'Usually instant; the AI steps in only for a message the rules don’t cover. The first request can take a while if the service has been asleep.</div></div>',
            '<span class="tr-badge-pill">' + flow + '</span>', false, 'Translation');
    }

    function translate() {
        if (busy) return;
        const src = readSource();
        if (!src) return;
        setBusy(true);
        setOut('<div class="tr-loading"><span class="tr-spin" aria-hidden="true"></span><div><strong>Checking your ' + esc(src.srcCode) + '…</strong></div></div>',
            '<span class="tr-badge-pill">' + esc(src.srcCode) + ' &rarr; ' + esc(destinationLabel(src.srcCode, src.text).label) + '</span>', false, 'Translation');
        call('/api/check', { source: src.text, sourceType: src.srcCode }).then(function (r) {
            const errs = ((r.validation && r.validation.findings) || []).filter(function (f) { return f.severity === 'error'; });
            if (!errs.length) { runTranslate(src, null); return; }
            setBusy(false);
            renderInputErrors(src, errs);
        }).catch(function () { runTranslate(src, false); });   // checker unreachable: translate, the result still carries its checks
    }

    function runTranslate(src, fix) {
        setBusy(true);
        const text = src.text, dest = destinationLabel(src.srcCode, text).label;
        loading((fix ? 'Fixing and translating ' : 'Translating ') + esc(src.srcCode) + ' into ' + esc(dest) + '…', esc(src.srcCode) + ' &rarr; ' + esc(dest));
        call('/api/translate', { source: text, target: src.target, sourceType: src.srcCode, fix: !!fix })
            .then(function (r) { renderTranslate(r, text, fix); })
            .catch(function (e) { renderError(e); })
            .then(function () { setBusy(false); });
    }

    // One request: the server fixes what rules can prove, then translates; the AI only for what rules can't.
    function fixThenTranslate() {
        const src = readSource();
        if (src && !busy) runTranslate(src, true);
    }

    function translateAnyway() {
        const src = readSource();
        if (src && !busy) runTranslate(src, false);
    }

    function call(path, body) {
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
        return fetch(AI_API.replace(/\/+$/, '') + path, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined
        }).then(function (res) {
            clearTimeout(timer);
            return res.json().catch(function () { return {}; }).then(function (j) {
                if (!res.ok || !j || j.ok === false) {
                    const e = new Error((j && j.message) || 'The Translator service returned an error.');
                    e.status = res.status;
                    throw e;
                }
                return j;
            });
        }, function (err) {
            clearTimeout(timer);
            const e = new Error(err && err.name === 'AbortError'
                ? 'The Translator took too long. It may have been asleep; try again in a moment.'
                : 'Couldn’t reach the Translator service. It may be waking up; try again in a few seconds.');
            e.network = true;
            throw e;
        });
    }

    // ── Results ─────────────────────────────────────────────────────────────
    function renderInputErrors(src, errs) {
        setOut('<div class="tr-inerr">'
            + '<div class="tr-inerr-title">Your ' + esc(src.srcCode) + ' has ' + plural(errs.length, 'error') + '</div>'
            + '<p>Translating keeps every value exactly as it is, so these errors would be carried into the ' + esc(src.target) + '.</p>'
            + '<ul class="tr-flags">' + errs.map(function (f) { return '<li class="is-bad"><b>' + esc(f.rule) + '</b> ' + esc(f.message) + (f.where ? ' <span class="tr-where">' + esc(f.where) + '</span>' : '') + '</li>'; }).join('') + '</ul>'
            + '<div class="tr-inerr-actions">'
            +   '<button type="button" class="tr-go" onclick="Translator.fixThenTranslate()">' + SPARK + ' Fix, then translate</button>'
            +   '<button type="button" class="tr-copy" onclick="Translator.translateAnyway()">Translate anyway</button>'
            + '</div></div>',
            '<span class="tr-badge-pill is-err">' + plural(errs.length, 'error') + ' in your message</span>', false, 'Translation');
    }

    function checksHtml(r) {
        const v = r.validation || { findings: [] };
        const errs = (v.findings || []).filter(function (f) { return f.severity === 'error'; });
        const warns = (v.findings || []).filter(function (f) { return f.severity !== 'error'; });
        const fid = r.fidelity || { invented: [], dropped: [] };
        const inv = fid.invented || [], drop = fid.dropped || [];
        const wrongType = r.outputType && r.targetType && r.outputType !== r.targetType;
        const chip = function (cls, label, text) { return '<span class="tr-check ' + cls + '"><b>' + label + '</b> ' + text + '</span>'; };
        let html = '<div class="tr-checks">'
            + (wrongType ? chip('is-bad', 'Type', 'not ' + esc(r.targetType)) : '')
            + (errs.length ? chip('is-bad', 'Rules', plural(errs.length, 'broken')) : chip('is-good', 'Rules', warns.length ? 'all met, ' + plural(warns.length, 'warning') : 'all met'))
            + (inv.length ? chip('is-bad', 'Values', inv.length + ' not in your message') : chip('is-good', 'Values', 'all match your message'))
            + (drop.length ? chip('is-warn', 'Left out', plural(drop.length, 'value')) : '')
            + '</div>';
        if (inv.length || errs.length || wrongType) {
            html += '<ul class="tr-flags">'
                + (wrongType ? '<li class="is-bad"><b>Wrong format</b> The result is a ' + esc(r.outputType) + ' instead of a ' + esc(r.targetType) + '. Don’t use it; press Translate again.</li>' : '')
                + inv.map(function (x) { return '<li class="is-bad"><b>' + esc(x.kind) + ' ' + esc(x.value) + '</b> is in the result but not in your message. Check it before using this.</li>'; }).join('')
                + errs.map(function (f) { return '<li class="is-bad"><b>' + esc(f.rule) + '</b> ' + esc(f.message) + (f.where ? ' <span class="tr-where">' + esc(f.where) + '</span>' : '') + '</li>'; }).join('')
                + '</ul>';
        }
        return html;
    }

    function table(title, cols, rows, open) {
        if (!rows.length) return '';
        return '<details class="tr-det"' + (open ? ' open' : '') + '><summary>' + esc(title) + ' <span class="tr-det-n">' + rows.length + '</span></summary>'
            + '<div class="tr-table-wrap"><table class="tr-table"><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>'
            + rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (i < r.length - 1 ? ' class="tr-mono"' : '') + '>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('')
            + '</tbody></table></div></details>';
    }

    function renderTranslate(r, text, fix) {
        const bad = (r.fidelity && r.fidelity.invented && r.fidelity.invented.length) || (r.validation && !r.validation.valid)
            || (r.outputType && r.targetType && r.outputType !== r.targetType);
        const byAI = r.engine === 'ai';
        const isSample = sampleText && text.trim() === sampleText.trim();
        let fixed = '';
        if (fix) {
            const ch = r.fixed || [], un = r.unresolved || [];
            const moved = !!r.repairedSource;
            if (moved) {   // the fixed message replaces the broken one, so what's on the left is what was translated
                const box = $('tr-src');
                if (box) { box.value = r.repairedSource; detected = detect(r.repairedSource); syncDestination(); }
            }
            fixed = '<div class="tr-fixed"><div class="tr-fixed-title">' + (ch.length ? 'Fixed first: ' + plural(ch.length, 'change') : 'Nothing could be fixed safely') + '</div>'
                + '<p>' + (moved ? 'The fixed message is now on the left.' : 'Your message on the left is unchanged.') + '</p>'
                + (un.length ? '<ul class="tr-unres">' + un.map(function (u) { return '<li><b>' + esc(u.issue) + '</b> ' + esc(u.reason) + '</li>'; }).join('') + '</ul>' : '')
                + '</div>'
                + table('Changes', ['Field', 'Before', 'After', 'Why'], ch.map(function (c) { return [c.field, c.before, c.after, c.reason]; }), true);
        }
        const who = byAI
            ? '<div class="tr-who is-ai"><b>Translated by the AI.</b> ' + esc(r.fallbackReason || 'The rules engine couldn’t do this one.') + '</div>'
            : '<div class="tr-who"><b>Translated by the rules engine</b> in ' + (r.ms != null ? esc(String(r.ms)) + ' ms' : 'an instant') + ', following the published ' + esc(r.sourceType || '') + ' → ' + esc(r.targetType || '') + ' field rules.</div>';
        setOut(fixed + who + checksHtml(r)
            + (r.notes ? '<div class="tr-note">' + esc(r.notes) + '</div>' : '')
            + '<pre class="tr-result" id="tr-result">' + esc(r.message) + '</pre>'
            + '<div class="tr-dets">'
            + table('Carried over, checked by code', ['Kind', 'Value'], (r.carried || []).map(function (m) { return [m.kind, m.value]; }), false)
            + table(byAI ? 'Filled in by the AI' : 'Filled in', ['Field', 'Value', 'Why'], (r.filled || []).map(function (m) { return [m.field, m.value, m.reason]; }), true)
            + table('Not carried over', ['Field', 'Value', 'Why'], (r.dropped || []).map(function (m) { return [m.field, m.value, m.reason]; }), true)
            + '</div>'
            + '<div class="tr-foot">' + (byAI ? 'Written by AI' : 'Written by the rules engine') + ', checked against the ' + esc(r.sourceType || '') + ' → ' + esc(r.targetType || '') + ' rules. Verify every field before using it anywhere real. '
            + (isSample ? '<b>That was the sample.</b> Now <button type="button" class="tr-inline" onclick="Translator.pasteOwn()">paste your own message</button>.' : '') + '</div>',
            '<span class="tr-badge-pill ' + (bad ? 'is-err' : 'is-ok') + '">' + (bad ? 'Check the flags' : (byAI ? 'AI' : 'Rules engine') + ' &middot; checked &#10003;') + '</span>'
            + '<span class="tr-flow">' + esc(r.sourceType || '') + ' &rarr; ' + esc(r.outputType || r.targetType || '') + '</span>', true, 'Translation');
    }

    function renderError(e) {
        setOut('<div class="tr-error"><strong>' + esc(e && e.message || 'Something went wrong.') + '</strong>'
            + (e && (e.network || e.status === 502 || e.status === 504) ? '<p>Press Translate again in a moment. Nothing was lost: your message is still on the left.</p>' : '')
            + '</div>', '<span class="tr-badge-pill is-err">No result</span>', false, 'Translation');
    }

    // ── Misc ────────────────────────────────────────────────────────────────
    function copy(btn) {
        const pre = $('tr-result');
        if (!pre) return;
        const txt = pre.textContent || '';
        const done = function () { const o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1500); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { selectPre(pre); });
        else selectPre(pre);
    }
    function selectPre(pre) {
        const r = document.createRange(); r.selectNodeContents(pre);
        const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }

    function loadSample() {
        const code = current;
        const f = FORMATS[code];
        if (!f) return;
        const fill = function (text) {
            if (code !== current) return;           // the visitor moved on while it loaded
            const src = $('tr-src');
            sampleText = text;
            if (src) src.value = text;
            hideNotice();
            onInput();
            setOut(emptyOutHtml(), '', false, 'Translation');
        };
        if (samples[code]) { fill(samples[code]); return; }
        fetch('/samples/' + encodeURIComponent(f.file) + '.json').then(function (r) { return r.json(); }).then(function (j) {
            samples[code] = (j && (j.xml || j.message)) || '';
            fill(samples[code]);
        }).catch(function () { showNotice('warn', 'The ' + code + ' sample couldn’t be loaded.', 'Check your connection and try again.'); });
    }

    function pasteOwn() {
        const src = $('tr-src');
        if (!src) return;
        src.value = '';
        sampleText = '';
        onInput();
        setOut('<div class="tr-empty"><p><strong>Paste your message on the left.</strong></p><p>ISO 20022 XML or SWIFT MT. The Source and its version are detected as you paste, and the Destination follows.</p></div>', '', false, 'Translation');
        src.focus();
    }

    // Free hosting sleeps: wake the AI service as soon as the Translator opens.
    let warmed = false;
    function warm() {
        if (warmed) return;
        warmed = true;
        try { fetch(AI_API.replace(/\/+$/, '') + '/api/health', { cache: 'no-store' }).catch(function () {}); } catch (e) { /* nothing to warm */ }
    }

    function getSource() { const s = $('tr-src'); return s ? s.value : ''; }

    function init(id) {
        mountId = id || 'tr-root';
        current = 'pacs.008';
        render();
        const sel = $('tr-source'); if (sel) sel.value = current;
        syncDestination();
        loadSample();
        warm();
    }

    return { init: init, onInput: onInput, onSource: onSource, translate: translate, fixThenTranslate: fixThenTranslate,
             translateAnyway: translateAnyway, copy: copy, loadSample: loadSample, loadExample: loadSample, pasteOwn: pasteOwn,
             showPairs: showPairs, getSource: getSource, detect: detect, checkPair: checkPair, destinationLabel: destinationLabel,
             FORMATS: FORMATS, AI_API: AI_API };
})();
window.Translator = Translator;
