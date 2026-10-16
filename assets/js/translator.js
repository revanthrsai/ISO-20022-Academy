// =============================================================================
// PLAYGROUND · LIVE TRANSLATOR (AI)
// -----------------------------------------------------------------------------
// Paste any ISO 20022 or SWIFT MT message and press:
//   AI Translate  → the message in the chosen Destination format, any pair
//   AI Repair     → the same message with its errors fixed
//
// The work is done by the AI API (/ai-api: Google ADK agents on Gemini). Every
// answer comes back with the server's own checks attached, and this module
// shows them plainly: format check, values that don't match the source (red),
// what was filled in or left out, and every change a repair made.
//
// Self-contained: one global `Translator`. Styles live in style.css (".tr-").
// =============================================================================

const Translator = (function () {
    'use strict';

    // The AI API. Swap to 'http://localhost:8000' to test against a local server.
    const AI_API = 'https://iso20022academy-ai-api.onrender.com';
    const TIMEOUT_MS = 90000;

    // Every format the Translator offers. `pair` is the direct equivalent in the
    // other standard: same information, same meaning. Any other pair is a
    // rebuild, and the visitor is told so before the AI runs.
    const FORMATS = {
        'pacs.008':  { std: 'MX', name: 'FI-to-FI customer credit transfer', role: 'a bank-to-bank customer credit transfer', pair: 'MT103' },
        'pacs.004':  { std: 'MX', name: 'Payment return', role: 'a payment return', pair: 'MT103 RETN' },
        'pacs.002':  { std: 'MX', name: 'FI-to-FI payment status report', role: 'a bank-to-bank status report', pair: 'MT199' },
        'pain.001':  { std: 'MX', name: 'Customer credit transfer initiation', role: 'a customer-to-bank payment instruction', pair: 'MT101' },
        'pain.002':  { std: 'MX', name: 'Customer payment status report', role: 'a bank-to-customer status report', pair: 'MT199' },
        'pain.008':  { std: 'MX', name: 'Customer direct debit initiation', role: 'a customer direct debit instruction', pair: 'MT104' },
        'camt.053':  { std: 'MX', name: 'Bank-to-customer statement', role: 'an end-of-day account statement', pair: 'MT940' },
        'camt.054':  { std: 'MX', name: 'Debit / credit notification', role: 'a debit or credit notification', pair: 'MT900 / MT910' },
        'camt.056':  { std: 'MX', name: 'Payment cancellation request', role: 'a cancellation request', pair: 'MT192' },
        'MT103':         { std: 'MT', name: 'Single customer credit transfer', role: 'a bank-to-bank customer credit transfer', pair: 'pacs.008' },
        'MT103 RETN':    { std: 'MT', name: 'Customer transfer used as a return', role: 'an MT103 used to return a payment', pair: 'pacs.004' },
        'MT101':         { std: 'MT', name: 'Request for transfer', role: 'a customer-to-bank request for transfer', pair: 'pain.001' },
        'MT104':         { std: 'MT', name: 'Direct debit and request for debit transfer', role: 'a direct debit instruction', pair: 'pain.008' },
        'MT940':         { std: 'MT', name: 'Customer statement', role: 'an end-of-day account statement', pair: 'camt.053' },
        'MT900 / MT910': { std: 'MT', name: 'Confirmation of debit / credit', role: 'a debit or credit confirmation', pair: 'camt.054' },
        'MT192':         { std: 'MT', name: 'Request for cancellation', role: 'a cancellation request', pair: 'camt.056' },
        'MT199':         { std: 'MT', name: 'Free format message', role: 'a free-text message', pair: null }
    };
    const ORDER_MX = ['pacs.008', 'pacs.004', 'pacs.002', 'pain.001', 'pain.002', 'pain.008', 'camt.053', 'camt.054', 'camt.056'];
    const ORDER_MT = ['MT103', 'MT103 RETN', 'MT101', 'MT104', 'MT940', 'MT900 / MT910', 'MT192', 'MT199'];
    const EXAMPLE_URL = '/samples/pacs.008.json';

    let mountId = 'tr-root';
    let detected = null;      // { code, std } or null
    let exampleXml = '';
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
            const all = t.match(/urn:iso:std:iso:20022:tech:xsd:([a-z]{4}\.\d{3})\.\d{3}\.\d{2}/g) || [];
            const codes = all.map(function (u) { return u.replace(/^.*xsd:([a-z]{4}\.\d{3}).*$/, '$1'); })
                .filter(function (c) { return c.indexOf('head.') !== 0; });
            return codes.length ? { code: codes[0], std: 'MX' } : { code: null, std: 'MX' };
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

    // ── Pair rules ──────────────────────────────────────────────────────────
    // { ok, direct, title, body }. ok:false stops the request. ok:true with
    // direct:false runs it, but the visitor is told it's a rebuild first.
    function checkPair(src, tgt) {
        if (!FORMATS[tgt]) return { ok: false, title: 'Choose a destination format.', body: '' };
        if (src === tgt) return { ok: false, title: 'That message is already a ' + src + '.', body: 'Pick a different destination format.' };
        const S = FORMATS[src], T = FORMATS[tgt];
        if (S && S.pair === tgt) return { ok: true, direct: true };
        let body;
        if (!S) body = src + ' isn’t one of the listed formats, so the AI will rebuild it as best it can.';
        else if (!S.pair) body = src + ' is free text with no structured equivalent. The AI will pull whatever it can from the narrative into ' + tgt + ', and leave the rest as placeholders.';
        else body = src + ' is ' + S.role + ', while ' + tgt + ' is ' + T.role + '. The AI will rebuild the closest ' + tgt + ' it can, but the meaning changes, so it isn’t a translation. ' + src + '’s direct equivalent is ' + S.pair + '.';
        return { ok: true, direct: false, title: src + ' → ' + tgt + ' is a rebuild, not a translation.', body: body };
    }

    // ── Rendering ───────────────────────────────────────────────────────────
    function formatOptions(first) {
        const group = function (label, list) {
            return '<optgroup label="' + label + '">' + list.map(function (c) {
                return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
            }).join('') + '</optgroup>';
        };
        return '<option value="">' + first + '</option>' + group('ISO 20022', ORDER_MX) + group('SWIFT MT', ORDER_MT);
    }

    function rowsHtml(list) {
        return list.map(function (c) {
            const f = FORMATS[c];
            const state = f.pair ? '<span class="tr-state is-live">Direct</span>' : '<span class="tr-state is-none">No equivalent</span>';
            return '<li class="tr-row" data-src="' + esc(c) + '">'
                + '<span class="tr-row-pair"><code>' + esc(c) + '</code><span class="tr-row-arrow" aria-hidden="true">&rarr;</span><code>' + esc(f.pair || '—') + '</code></span>'
                + '<span class="tr-row-name">' + esc(f.name) + '</span>' + state + '</li>';
        }).join('');
    }

    function sectionHtml(std, code, title, blurb, list) {
        const direct = list.filter(function (c) { return FORMATS[c].pair; }).length;
        return '<li class="cs-item"><details class="course-sec tr-sec" data-std="' + std + '">'
            + '<summary class="cs-head"><span class="cs-code">' + code + '</span>'
            + '<span class="cs-head-text"><span class="cs-name">' + title + '</span><span class="cs-blurb">' + blurb + '</span></span>'
            + '<span class="cs-meta">' + direct + ' direct &middot; ' + list.length + ' formats</span>'
            + '<span class="cs-chev" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>'
            + '</summary><div class="cs-body"><ol class="tr-rows">' + rowsHtml(list) + '</ol></div></details></li>';
    }

    const SPARK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 5.6L19.5 9l-5.7 1.4L12 16l-1.8-5.6L4.5 9l5.7-1.4z"/><path d="M19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9z" opacity=".7"/></svg>';
    const WRENCH = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>';

    function render() {
        const el = $(mountId);
        if (!el) return;
        el.innerHTML =
            '<div class="tr">'
            + '<div class="tr-toolbar">'
            +   '<div class="tr-tools-left">'
            +     '<label class="tr-field"><span class="tr-label">Source</span>'
            +       '<select id="tr-source" class="tr-select" onchange="Translator.onTarget()">' + formatOptions('Detect automatically') + '</select></label>'
            +     '<span class="tr-arrow" aria-hidden="true">&rarr;</span>'
            +     '<label class="tr-field"><span class="tr-label">Destination</span>'
            +       '<select id="tr-target" class="tr-select" onchange="Translator.onTarget()">' + formatOptions('Choose a format…') + '</select></label>'
            +     '<div class="tr-actions">'
            +       '<button type="button" class="tr-go" id="tr-go" onclick="Translator.translate()">' + SPARK + ' AI Translate</button>'
            +       '<button type="button" class="tr-go tr-go-alt" id="tr-repair" onclick="Translator.repair()" title="Find what’s wrong with the message and fix it">' + WRENCH + ' AI Repair</button>'
            +     '</div>'
            +   '</div>'
            +   '<div class="tr-tools-right">'
            +     '<button type="button" class="tr-copy" id="tr-copy" onclick="Translator.copy(this)" disabled>Copy</button>'
            +   '</div>'
            + '</div>'
            + '<div class="tr-notice" id="tr-notice" hidden></div>'
            + '<div class="tr-grid">'
            +   '<section class="tr-pane" aria-label="Your message">'
            +     '<div class="tr-bar"><span class="tr-bar-title">Your message</span>'
            +       '<span class="tr-bar-tools">'
            +         '<button type="button" class="tr-mini" onclick="Translator.pasteOwn()">Paste your own</button>'
            +         '<button type="button" class="tr-mini" onclick="Translator.loadExample()">Example</button>'
            +       '</span></div>'
            +     '<textarea id="tr-src" class="tr-src" spellcheck="false" autocomplete="off" aria-label="Message"'
            +       ' placeholder="Paste a pacs.008, pain.001, camt.053, MT103… message here" oninput="Translator.onInput()"></textarea>'
            +     '<div class="tr-privacy">Don’t paste real customer data. Messages are sent to Google Gemini to process and are not stored by us.</div>'
            +   '</section>'
            +   '<section class="tr-pane tr-pane-out" aria-label="Result" aria-live="polite">'
            +     '<div class="tr-bar"><span class="tr-bar-title" id="tr-out-title">Result</span><span class="tr-badge" id="tr-badge"></span></div>'
            +     '<div class="tr-out" id="tr-out">' + emptyOutHtml() + '</div>'
            +   '</section>'
            + '</div>'
            + '<div class="course-bar" id="tr-pairs"><span class="course-bar-label">Direct equivalents</span></div>'
            + '<ol class="course-outline">'
            +   sectionHtml('MX', 'MX', 'ISO 20022 → SWIFT MT', 'The legacy MT message that carries the same information as each ISO 20022 message.', ORDER_MX)
            +   sectionHtml('MT', 'MT', 'SWIFT MT → ISO 20022', 'The ISO 20022 message that replaces each MT. Any other pair is a rebuild, and the Translator says so.', ORDER_MT)
            + '</ol>'
            + '</div>';
    }

    function emptyOutHtml() {
        return '<div class="tr-empty"><p><strong>Your result appears here.</strong></p>'
            + '<p>The example on the left is a real pacs.008: Bob paying Sweety $400. Press <b>AI Translate</b> to turn it into an MT103, or <b>AI Repair</b> to check it and fix anything wrong. Then paste your own message.</p></div>';
    }

    // ── State updates ───────────────────────────────────────────────────────
    function onInput() {
        const src = $('tr-src');
        detected = detect(src ? src.value : '');
        const sel = $('tr-target');
        hideNotice();
        const out = $('tr-out');
        if (out && out.querySelector('.tr-empty')) {
            const own = src && src.value.trim() && !(exampleXml && src.value.trim() === exampleXml.trim());
            if (own) out.innerHTML = '<div class="tr-empty"><p><strong>Ready when you are.</strong></p><p>Pick a <b>Destination</b> and press <b>AI Translate</b>, or press <b>AI Repair</b> to fix the message as it is.</p></div>';
        }
        const srcSel = $('tr-source');
        if (!srcSel || !sel) return;
        if (!detected || !detected.code || !FORMATS[detected.code]) { srcSel.value = ''; return; }
        srcSel.value = detected.code;
        const f = FORMATS[detected.code];
        if (f.pair && FORMATS[f.pair]) sel.value = f.pair;
    }
    function onTarget() { hideNotice(); }

    function hideNotice() { const n = $('tr-notice'); if (n) { n.hidden = true; n.innerHTML = ''; } }
    function showNotice(kind, title, body, withPairs) {
        const n = $('tr-notice');
        if (!n) return;
        n.className = 'tr-notice is-' + kind;
        n.innerHTML = '<div class="tr-notice-title">' + esc(title) + '</div>'
            + (body ? '<p>' + esc(body) + '</p>' : '')
            + (withPairs ? '<button type="button" class="tr-notice-link" onclick="Translator.showPairs()">See the direct equivalents &darr;</button>' : '');
        n.hidden = false;
    }

    function showPairs() {
        const std = detected && detected.std;
        document.querySelectorAll('.tr-sec').forEach(function (d) { if (!std || d.dataset.std === std) d.open = true; });
        document.querySelectorAll('.tr-row.is-hit').forEach(function (r) { r.classList.remove('is-hit'); });
        if (detected && detected.code) {
            const row = document.querySelector('.tr-row[data-src="' + detected.code.replace(/"/g, '') + '"]');
            if (row) row.classList.add('is-hit');
        }
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
        ['tr-go', 'tr-repair'].forEach(function (id) { const b = $(id); if (b) b.disabled = on; });
    }

    // Shared front checks for both buttons. Returns { text, srcCode } or null.
    function readSource() {
        const srcEl = $('tr-src');
        const text = srcEl ? srcEl.value.trim() : '';
        hideNotice();
        if (!text) { showNotice('warn', 'Paste a message first.', 'Or press Example to load a pacs.008.'); return null; }
        detected = detect(text);
        if (!detected) {
            showNotice('warn', 'This doesn’t look like a payment message.', 'Paste ISO 20022 XML (it starts with <) or a SWIFT MT message (fields like :20: and :32A:).');
            return null;
        }
        const srcSel = $('tr-source');
        const chosen = srcSel && srcSel.value;
        if (chosen && FORMATS[chosen] && FORMATS[chosen].std !== detected.std) {
            showNotice('err', 'The message doesn’t match the Source you chose.', 'What you pasted is ' + (detected.std === 'MX' ? 'ISO 20022 XML' : 'a SWIFT MT message') + ', but Source is set to ' + chosen + '. Set Source to “Detect automatically” or pick the right format.');
            return null;
        }
        const srcCode = chosen || detected.code;
        if (!srcCode) {
            showNotice('warn', 'The message type isn’t recognised.', detected.std === 'MX'
                ? 'Set Source to the right format, or add the ISO 20022 namespace on <Document>, such as urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08.'
                : 'Set Source to the right format, or include the MT block 2 header (for example {2:I103…}).');
            return null;
        }
        return { text: text, srcCode: srcCode };
    }

    function loading(what, flow, title) {
        setOut('<div class="tr-loading"><span class="tr-spin" aria-hidden="true"></span><div><strong>' + what + '</strong><br>'
            + 'The AI writes the message, then our checks validate it and compare every value with your original. '
            + 'This usually takes 10 to 30 seconds, a little longer if the service has been asleep.</div></div>',
            '<span class="tr-badge-pill">' + flow + '</span>', false, title);
    }

    function translate() {
        if (busy) return;
        const src = readSource();
        if (!src) return;
        const sel = $('tr-target');
        const tgt = sel ? sel.value : '';
        if (!tgt) { showNotice('warn', 'Choose a destination format.', FORMATS[src.srcCode] && FORMATS[src.srcCode].pair ? src.srcCode + '’s direct equivalent is ' + FORMATS[src.srcCode].pair + '.' : ''); return; }
        const verdict = checkPair(src.srcCode, tgt);
        if (!verdict.ok) { showNotice('err', verdict.title, verdict.body); return; }
        if (!verdict.direct) showNotice('warn', verdict.title, verdict.body, true);

        setBusy(true);
        loading('AI is translating ' + esc(src.srcCode) + ' into ' + esc(tgt) + '…', esc(src.srcCode) + ' &rarr; ' + esc(tgt), 'Translation');
        call('/api/translate', { source: src.text, target: tgt, sourceType: FORMATS[src.srcCode] ? src.srcCode : null })
            .then(function (r) { renderTranslate(r, src.text); })
            .catch(function (e) { renderError(e, 'Translation'); })
            .then(function () { setBusy(false); });
    }

    function repair() {
        if (busy) return;
        const src = readSource();
        if (!src) return;
        setBusy(true);
        loading('AI is checking and repairing this ' + esc(src.srcCode) + '…', 'Repair &middot; ' + esc(src.srcCode), 'Repaired message');
        call('/api/repair', { source: src.text, sourceType: FORMATS[src.srcCode] ? src.srcCode : null })
            .then(function (r) { renderRepair(r, src.text); })
            .catch(function (e) { renderError(e, 'Repaired message'); })
            .then(function () { setBusy(false); });
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
                    const e = new Error((j && j.message) || 'The AI service returned an error.');
                    e.status = res.status;
                    throw e;
                }
                return j;
            });
        }, function (err) {
            clearTimeout(timer);
            const e = new Error(err && err.name === 'AbortError'
                ? 'The AI took too long. It may have been asleep; try again in a moment.'
                : 'Couldn’t reach the AI service. It may be waking up; try again in a few seconds.');
            e.network = true;
            throw e;
        });
    }

    // ── Results ─────────────────────────────────────────────────────────────
    function checksHtml(r) {
        const v = r.validation || { findings: [] };
        const errs = (v.findings || []).filter(function (f) { return f.severity === 'error'; });
        const warns = (v.findings || []).filter(function (f) { return f.severity !== 'error'; });
        const fid = r.fidelity || { invented: [], dropped: [] };
        const inv = fid.invented || [], drop = fid.dropped || [];
        const chip = function (cls, label, text) { return '<span class="tr-check ' + cls + '"><b>' + label + '</b> ' + text + '</span>'; };
        let html = '<div class="tr-checks">'
            + (errs.length ? chip('is-bad', 'Format', plural(errs.length, 'error')) : chip('is-good', 'Format', warns.length ? 'valid, ' + plural(warns.length, 'warning') : 'valid'))
            + (inv.length ? chip('is-bad', 'Values', plural(inv.length, 'not in your message', 'not in your message')) : chip('is-good', 'Values', 'all match your message'))
            + (drop.length ? chip('is-warn', 'Left out', plural(drop.length, 'value')) : '')
            + '</div>';
        const wrongType = r.kind === 'translate' && r.outputType && r.targetType && r.outputType !== r.targetType;
        if (wrongType) html = html.replace('<div class="tr-checks">', '<div class="tr-checks">' + chip('is-bad', 'Type', 'not ' + esc(r.targetType)));
        if (inv.length || errs.length || wrongType) {
            html += '<ul class="tr-flags">'
                + (wrongType ? '<li class="is-bad"><b>Wrong format</b> You asked for ' + esc(r.targetType) + ', but the AI returned a ' + esc(r.outputType) + '. Don\u2019t use this result; press AI Translate again.</li>' : '')
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

    function footHtml(text) {
        const isExample = exampleXml && text === exampleXml.trim();
        return '<div class="tr-foot">Written by AI and checked by our validator. Verify every field before using it anywhere real. '
            + (isExample ? '<b>That was the example.</b> Now <button type="button" class="tr-inline" onclick="Translator.pasteOwn()">paste your own message</button>.' : '')
            + '</div>';
    }

    function badgeFor(r, flow) {
        const bad = (r.fidelity && r.fidelity.invented && r.fidelity.invented.length) || (r.validation && !r.validation.valid)
            || (r.kind === 'translate' && r.outputType && r.targetType && r.outputType !== r.targetType);
        return '<span class="tr-badge-pill ' + (bad ? 'is-err' : 'is-ok') + '">' + (bad ? 'Check the flags' : 'AI &middot; checked &#10003;') + '</span><span class="tr-flow">' + flow + '</span>';
    }

    function renderTranslate(r, text) {
        const note = (!r.direct ? '<div class="tr-rebuild"><b>Rebuild, not a translation.</b> ' + esc(r.notes || '') + '</div>'
            : (r.notes ? '<div class="tr-note">' + esc(r.notes) + '</div>' : ''));
        setOut(checksHtml(r) + note
            + '<pre class="tr-result" id="tr-result">' + esc(r.message) + '</pre>'
            + '<div class="tr-dets">'
            + table('Field mapping', ['From', 'To', 'Value'], (r.mapping || []).map(function (m) { return [m.source_field, m.target_field, m.value]; }), false)
            + table('Filled in by the AI', ['Field', 'Value', 'Why'], (r.filled || []).map(function (m) { return [m.field, m.value, m.reason]; }), true)
            + table('Not carried over', ['Field', 'Value', 'Why'], (r.dropped || []).map(function (m) { return [m.field, m.value, m.reason]; }), true)
            + '</div>' + footHtml(text),
            badgeFor(r, esc(r.sourceType || '') + ' &rarr; ' + esc(r.targetType || '')), true, 'Translation');
    }

    function renderRepair(r, text) {
        const before = (r.validationBefore && r.validationBefore.findings || []).filter(function (f) { return f.severity === 'error'; }).length;
        const changes = r.changes || [], unresolved = r.unresolved || [];
        const lead = changes.length
            ? '<div class="tr-note"><b>' + plural(changes.length, 'fix', 'fixes') + '.</b> ' + esc(r.summary || '') + '</div>'
            : '<div class="tr-note"><b>Nothing was changed.</b> ' + esc(r.summary || (before ? '' : 'The message already passes our checks.')) + '</div>';
        const un = unresolved.length
            ? '<div class="tr-unresolved"><div class="tr-unresolved-title">Needs the sender (' + unresolved.length + ')</div><ul>'
              + unresolved.map(function (u) { return '<li><b>' + esc(u.issue) + '</b> ' + esc(u.reason) + '</li>'; }).join('') + '</ul></div>'
            : '';
        setOut(checksHtml(r) + lead + un
            + table('Changes', ['Field', 'Before', 'After', 'Why'], changes.map(function (c) { return [c.field, c.before, c.after, c.reason]; }), true)
            + '<pre class="tr-result" id="tr-result">' + esc(r.message) + '</pre>'
            + footHtml(text),
            badgeFor(r, 'Repair &middot; ' + esc(r.sourceType || '') + (before ? ' &middot; ' + plural(before, 'error') + ' found' : '')), changes.length > 0, 'Repaired message');
    }

    function renderError(e, title) {
        setOut('<div class="tr-error"><strong>' + esc(e && e.message || 'Something went wrong.') + '</strong>'
            + (e && (e.network || e.status === 502 || e.status === 504) ? '<p>Press the button again in a moment. Nothing was lost: your message is still on the left.</p>' : '')
            + '</div>', '<span class="tr-badge-pill is-err">No result</span>', false, title);
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

    function loadExample() {
        const fill = function () {
            const src = $('tr-src');
            if (src) src.value = exampleXml;
            onInput();
            setOut(emptyOutHtml(), '', false, 'Result');
        };
        if (exampleXml) { fill(); return; }
        fetch(EXAMPLE_URL).then(function (r) { return r.json(); }).then(function (j) {
            exampleXml = (j && j.xml) || '';
            fill();
        }).catch(function () { /* offline: the box simply stays empty */ });
    }

    function pasteOwn() {
        const src = $('tr-src');
        if (!src) return;
        src.value = '';
        onInput();
        const sel = $('tr-target'); if (sel) sel.value = '';
        const ss = $('tr-source'); if (ss) ss.value = '';
        setOut('<div class="tr-empty"><p><strong>Paste your message on the left.</strong></p><p>ISO 20022 XML or SWIFT MT. Source is detected as you paste and the direct equivalent is picked as the Destination. Change it to any format you like.</p></div>', '', false, 'Result');
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
        render();
        loadExample();
        warm();
    }

    return { init: init, onInput: onInput, onTarget: onTarget, translate: translate, repair: repair, copy: copy,
             loadExample: loadExample, pasteOwn: pasteOwn, showPairs: showPairs, getSource: getSource,
             detect: detect, checkPair: checkPair, FORMATS: FORMATS, AI_API: AI_API };
})();
window.Translator = Translator;
