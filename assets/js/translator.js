// =============================================================================
// PLAYGROUND · LIVE TRANSLATOR
// -----------------------------------------------------------------------------
// Paste any ISO 20022 or SWIFT MT message, see what it is, and translate it on
// the live Java + Prowide engine (transform-api). One example ships with the
// page (the Bob → Sweety pacs.008); everything else is the visitor's own message.
//
// The engine does the translating. This module only:
//   1. detects the message type (XML namespace, or MT block 2 / field shape),
//   2. offers a target format and refuses pairs that aren't real equivalents,
//      explaining why and pointing at the table of available translations,
//   3. runs the request through MsgTransformer.callEngine and shows the result.
//
// Self-contained: one global `Translator`. Styles live in style.css (".tr-").
// =============================================================================

const Translator = (function () {
    'use strict';

    // Every format the Translator knows. `pair` is the real equivalent in the
    // other standard; `live` says whether the engine translates that direction.
    const FORMATS = {
        'pacs.008':  { std: 'MX', name: 'FI-to-FI customer credit transfer', role: 'a bank-to-bank customer credit transfer', pair: 'MT103', live: true },
        'pacs.004':  { std: 'MX', name: 'Payment return', role: 'a payment return', pair: 'MT103 RETN', live: true },
        'pacs.002':  { std: 'MX', name: 'FI-to-FI payment status report', role: 'a bank-to-bank status report', pair: 'MT199', live: true },
        'pain.001':  { std: 'MX', name: 'Customer credit transfer initiation', role: 'a customer-to-bank payment instruction', pair: 'MT101', live: true },
        'pain.002':  { std: 'MX', name: 'Customer payment status report', role: 'a bank-to-customer status report', pair: 'MT199', live: true },
        'pain.008':  { std: 'MX', name: 'Customer direct debit initiation', role: 'a customer direct debit instruction', pair: 'MT104', live: true },
        'camt.053':  { std: 'MX', name: 'Bank-to-customer statement', role: 'an end-of-day account statement', pair: 'MT940', live: true },
        'camt.054':  { std: 'MX', name: 'Debit / credit notification', role: 'a debit or credit notification', pair: 'MT900 / MT910', live: true },
        'camt.056':  { std: 'MX', name: 'Payment cancellation request', role: 'a cancellation request', pair: 'MT192', live: true },
        'MT103':         { std: 'MT', name: 'Single customer credit transfer', role: 'a bank-to-bank customer credit transfer', pair: 'pacs.008', live: true },
        'MT103 RETN':    { std: 'MT', name: 'Customer transfer used as a return', role: 'an MT103 used to return a payment', pair: 'pacs.004', live: false },
        'MT101':         { std: 'MT', name: 'Request for transfer', role: 'a customer-to-bank request for transfer', pair: 'pain.001', live: false },
        'MT104':         { std: 'MT', name: 'Direct debit and request for debit transfer', role: 'a direct debit instruction', pair: 'pain.008', live: false },
        'MT940':         { std: 'MT', name: 'Customer statement', role: 'an end-of-day account statement', pair: 'camt.053', live: false },
        'MT900 / MT910': { std: 'MT', name: 'Confirmation of debit / credit', role: 'a debit or credit confirmation', pair: 'camt.054', live: false },
        'MT192':         { std: 'MT', name: 'Request for cancellation', role: 'a cancellation request', pair: 'camt.056', live: false },
        'MT199':         { std: 'MT', name: 'Free format message', role: 'a free-text message', pair: null, live: false }
    };
    const STD_NAME = { MX: 'ISO 20022', MT: 'SWIFT MT' };
    const ORDER_MX = ['pacs.008', 'pacs.004', 'pacs.002', 'pain.001', 'pain.002', 'pain.008', 'camt.053', 'camt.054', 'camt.056'];
    const ORDER_MT = ['MT103', 'MT103 RETN', 'MT101', 'MT104', 'MT940', 'MT900 / MT910', 'MT192', 'MT199'];
    const EXAMPLE_URL = '/samples/pacs.008.json';

    let mountId = 'tr-root';
    let detected = null;      // { code, std } or null
    let exampleXml = '';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function $(id) { return document.getElementById(id); }

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
    // Returns { ok: true } or { ok: false, title, body, focus } where focus is the
    // section of the translations table worth opening.
    function checkPair(src, tgt) {
        const S = FORMATS[src], T = FORMATS[tgt];
        if (!S) {
            return { ok: false, focus: null, title: src + ' isn’t in the Translator yet.',
                body: 'The live engine translates the messages listed below. ' + src + ' has no translation here yet.' };
        }
        if (src === tgt) {
            return { ok: false, focus: S.std, title: 'That message is already a ' + src + '.',
                body: 'Pick the format you want it translated into. ' + pairSentence(src) };
        }
        if (!S.pair) {
            return { ok: false, focus: S.std, title: 'You can\u2019t convert ' + src + ' \u2192 ' + tgt + '.',
                body: pairSentence(src) + ' The Translator only converts messages with a structured equivalent.' };
        }
        if (S.std === T.std) {
            const other = S.std === 'MX' ? 'SWIFT MT' : 'ISO 20022';
            return { ok: false, focus: S.std, title: 'You can’t convert ' + src + ' → ' + tgt + '.',
                body: 'Both are ' + STD_NAME[S.std] + ' messages. The Translator converts between ISO 20022 and SWIFT MT, so choose a ' + other + ' format. ' + pairSentence(src) };
        }
        if (S.pair !== tgt) {
            return { ok: false, focus: S.std, title: 'You can’t convert ' + src + ' → ' + tgt + '.',
                body: src + ' is ' + S.role + ', while ' + tgt + ' is ' + T.role + '. They don’t carry the same thing, so there’s no faithful translation. ' + pairSentence(src) };
        }
        if (!S.live) {
            return { ok: false, focus: S.std, title: src + ' → ' + tgt + ' is coming soon.',
                body: 'That’s the right pair, but the engine doesn’t translate this direction yet. Today it translates ISO 20022 into SWIFT MT, plus MT103 into pacs.008.' };
        }
        return { ok: true };
    }
    function pairSentence(src) {
        const S = FORMATS[src];
        if (!S.pair) return src + ' is free text, so it has no structured ISO 20022 equivalent.';
        return src + ' translates to ' + S.pair + (S.live ? '.' : ' (coming soon).');
    }

    // ── Rendering ───────────────────────────────────────────────────────────
    function targetOptions() {
        const group = function (label, list) {
            return '<optgroup label="' + label + '">' + list.map(function (c) {
                return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
            }).join('') + '</optgroup>';
        };
        return '<option value="">Choose a format…</option>'
            + group('SWIFT MT', ORDER_MT) + group('ISO 20022', ORDER_MX);
    }

    function rowsHtml(list) {
        return list.map(function (c) {
            const f = FORMATS[c];
            const state = f.pair
                ? (f.live ? '<span class="tr-state is-live">Live</span>' : '<span class="tr-state is-soon">Coming soon</span>')
                : '<span class="tr-state is-none">No equivalent</span>';
            return '<li class="tr-row" data-src="' + esc(c) + '">'
                + '<span class="tr-row-pair"><code>' + esc(c) + '</code><span class="tr-row-arrow" aria-hidden="true">&rarr;</span><code>' + esc(f.pair || '—') + '</code></span>'
                + '<span class="tr-row-name">' + esc(f.name) + '</span>'
                + state + '</li>';
        }).join('');
    }

    function sectionHtml(std, code, title, blurb, list) {
        const live = list.filter(function (c) { return FORMATS[c].live; }).length;
        return '<li class="cs-item"><details class="course-sec tr-sec" data-std="' + std + '">'
            + '<summary class="cs-head">'
            + '<span class="cs-code">' + code + '</span>'
            + '<span class="cs-head-text"><span class="cs-name">' + title + '</span><span class="cs-blurb">' + blurb + '</span></span>'
            + '<span class="cs-meta">' + live + ' live &middot; ' + list.length + ' formats</span>'
            + '<span class="cs-chev" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>'
            + '</summary>'
            + '<div class="cs-body"><ol class="tr-rows">' + rowsHtml(list) + '</ol></div>'
            + '</details></li>';
    }

    function render() {
        const el = $(mountId);
        if (!el) return;
        el.innerHTML =
            '<div class="tr">'
            + '<div class="tr-grid">'
            +   '<section class="tr-pane" aria-label="Your message">'
            +     '<div class="tr-bar">'
            +       '<span class="tr-bar-title">Your message</span>'
            +       '<span class="tr-detected" id="tr-detected"></span>'
            +       '<span class="tr-bar-tools">'
            +         '<button type="button" class="tr-mini" onclick="Translator.pasteOwn()">Paste your own</button>'
            +         '<button type="button" class="tr-mini" onclick="Translator.loadExample()">Example</button>'
            +       '</span>'
            +     '</div>'
            +     '<textarea id="tr-src" class="tr-src" spellcheck="false" autocomplete="off" aria-label="Message to translate"'
            +       ' placeholder="Paste a pacs.008, pain.001, camt.053, MT103… message here" oninput="Translator.onInput()"></textarea>'
            +     '<div class="tr-controls">'
            +       '<label class="tr-label" for="tr-target">Translate to</label>'
            +       '<select id="tr-target" class="tr-select" onchange="Translator.onTarget()">' + targetOptions() + '</select>'
            +       '<button type="button" class="tr-go" id="tr-go" onclick="Translator.translate()">Translate <span aria-hidden="true">&rarr;</span></button>'
            +     '</div>'
            +     '<div class="tr-notice" id="tr-notice" hidden></div>'
            +   '</section>'
            +   '<section class="tr-pane tr-pane-out" aria-label="Translation" aria-live="polite">'
            +     '<div class="tr-bar"><span class="tr-bar-title">Translation</span><span class="tr-badge" id="tr-badge"></span>'
            +       '<span class="tr-bar-tools"><button type="button" class="tr-mini" id="tr-copy" onclick="Translator.copy(this)" hidden>Copy</button></span></div>'
            +     '<div class="tr-out" id="tr-out">' + emptyOutHtml() + '</div>'
            +   '</section>'
            + '</div>'
            + '<div class="course-bar" id="tr-pairs"><span class="course-bar-label">Available translations</span></div>'
            + '<ol class="course-outline">'
            +   sectionHtml('MX', 'MX', 'ISO 20022 → SWIFT MT', 'Every ISO 20022 message here translates into its legacy SWIFT MT equivalent on the live engine.', ORDER_MX)
            +   sectionHtml('MT', 'MT', 'SWIFT MT → ISO 20022', 'MT103 translates into pacs.008 today. The other reverse directions are being added to the engine.', ORDER_MT)
            + '</ol>'
            + '</div>';
    }

    function emptyOutHtml() {
        return '<div class="tr-empty"><p><strong>Your translation appears here.</strong></p>'
            + '<p>The example on the left is a real pacs.008: Bob paying Sweety $400. Press <b>Translate</b> to turn it into an MT103, then paste your own message and try it.</p></div>';
    }

    // ── State updates ───────────────────────────────────────────────────────
    function onInput() {
        const src = $('tr-src');
        detected = detect(src ? src.value : '');
        const badge = $('tr-detected');
        const sel = $('tr-target');
        hideNotice();
        // While nothing has been translated yet, keep the right pane's hint true
        // to what is in the box: the example, or the visitor's own message.
        const out = $('tr-out');
        if (out && out.querySelector('.tr-empty')) {
            const own = src && src.value.trim() && !(exampleXml && src.value.trim() === exampleXml.trim());
            if (own) out.innerHTML = '<div class="tr-empty"><p><strong>Ready when you are.</strong></p><p>Check the detected type and the format on the left, then press <b>Translate</b>.</p></div>';
        }
        if (!badge) return;
        if (!detected) { badge.className = 'tr-detected'; badge.textContent = ''; return; }
        if (!detected.code) {
            badge.className = 'tr-detected is-unknown';
            badge.textContent = detected.std === 'MX' ? 'XML, type not recognised' : 'MT, type not recognised';
            return;
        }
        const f = FORMATS[detected.code];
        badge.className = 'tr-detected' + (f ? '' : ' is-unknown');
        badge.textContent = 'Detected ' + detected.code + (f ? ' · ' + f.name : '');
        if (sel && f && f.pair && FORMATS[f.pair]) sel.value = f.pair;
        else if (sel && f && detected.code === 'camt.054') sel.value = 'MT900 / MT910';
    }
    function onTarget() { hideNotice(); }

    function hideNotice() { const n = $('tr-notice'); if (n) { n.hidden = true; n.innerHTML = ''; } }
    function showNotice(kind, title, body, focus) {
        const n = $('tr-notice');
        if (!n) return;
        n.className = 'tr-notice is-' + kind;
        n.innerHTML = '<div class="tr-notice-title">' + esc(title) + '</div>'
            + (body ? '<p>' + esc(body) + '</p>' : '')
            + (focus !== undefined ? '<button type="button" class="tr-notice-link" onclick="Translator.showPairs(' + (focus ? '\'' + focus + '\'' : 'null') + ')">See the available translations &darr;</button>' : '');
        n.hidden = false;
    }

    function showPairs(std) {
        const secs = document.querySelectorAll('.tr-sec');
        secs.forEach(function (d) { if (!std || d.dataset.std === std) d.open = true; });
        document.querySelectorAll('.tr-row.is-hit').forEach(function (r) { r.classList.remove('is-hit'); });
        if (detected && detected.code) {
            const row = document.querySelector('.tr-row[data-src="' + detected.code.replace(/"/g, '') + '"]');
            if (row) row.classList.add('is-hit');
        }
        const anchor = $('tr-pairs');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function setOut(html, badgeHtml, copyable) {
        const out = $('tr-out'), badge = $('tr-badge'), copyBtn = $('tr-copy');
        if (out) out.innerHTML = html;
        if (badge) badge.innerHTML = badgeHtml || '';
        if (copyBtn) copyBtn.hidden = !copyable;
    }

    function translate() {
        const srcEl = $('tr-src'), sel = $('tr-target');
        const text = srcEl ? srcEl.value.trim() : '';
        hideNotice();
        if (!text) { showNotice('warn', 'Paste a message first.', 'Or press Example to load a pacs.008.'); return; }
        detected = detect(text);
        if (!detected) {
            showNotice('warn', 'This doesn’t look like a payment message.', 'Paste ISO 20022 XML (it starts with <) or a SWIFT MT message (fields like :20: and :32A:).');
            return;
        }
        if (!detected.code) {
            showNotice('warn', 'The message type isn’t recognised.', detected.std === 'MX'
                ? 'The XML needs an ISO 20022 namespace on <Document>, such as urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08.'
                : 'Include the MT block 2 header (for example {2:I103…}) or the message’s mandatory fields.', null);
            return;
        }
        const tgt = sel ? sel.value : '';
        if (!tgt) { showNotice('warn', 'Choose a format to translate into.', pairSentence(detected.code) || '', detected.std); return; }
        const verdict = checkPair(detected.code, tgt);
        if (!verdict.ok) { showNotice('err', verdict.title, verdict.body, verdict.focus); return; }

        // Catch broken XML here, with the validator's own wording, before a round trip.
        if (detected.std === 'MX' && window.SchemaValidator && SchemaValidator.validate) {
            const v = SchemaValidator.validate(text);
            if (v && v.parseError) { showNotice('err', 'This XML can’t be read.', v.parseError); return; }
        }

        const go = $('tr-go');
        if (go) go.disabled = true;
        setOut('<div class="tr-loading"><span class="tr-spin" aria-hidden="true"></span><div><strong>Translating on the live engine…</strong><br>The first run after a quiet spell can take about 30 seconds while the engine wakes up.</div></div>',
            '<span class="tr-badge-pill">' + esc(detected.code) + ' &rarr; ' + esc(tgt) + '</span>', false);

        if (!window.MsgTransformer || !MsgTransformer.callEngine) {
            if (go) go.disabled = false;
            setOut('<div class="tr-error">The translation engine isn’t available on this page.</div>', '', false);
            return;
        }
        MsgTransformer.callEngine(text, detected.std === 'MX' ? 'MX_TO_MT' : 'MT_TO_MX').then(function (r) {
            if (go) go.disabled = false;
            if (r && r.ok && r.result) {
                const flow = esc(r.sourceFormat || detected.code) + ' &rarr; ' + esc(r.targetFormat || tgt);
                const isExample = exampleXml && text === exampleXml.trim();
                setOut('<pre class="tr-result" id="tr-result">' + esc(r.result) + '</pre>'
                    + '<div class="tr-foot">Translated by the live Java&nbsp;+&nbsp;Prowide engine. '
                    + (isExample ? '<b>That was the example.</b> Now <button type="button" class="tr-inline" onclick="Translator.pasteOwn()">paste your own message</button> and translate it.' : 'Check every field before using it anywhere real.')
                    + '</div>',
                    '<span class="tr-badge-pill is-ok">Live engine &#10003;</span><span class="tr-flow">' + flow + '</span>', true);
            } else {
                setOut('<div class="tr-error"><strong>The engine couldn’t translate this message.</strong><p>' + esc((r && r.message) || 'It returned an error.') + '</p>'
                    + '<p>Check the message is complete. For XML, <button type="button" class="tr-inline" onclick="openValidator()">run it through the validator</button> to see what’s wrong.</p></div>',
                    '<span class="tr-badge-pill is-err">Not translated</span>', false);
            }
        }).catch(function (err) {
            if (go) go.disabled = false;
            setOut('<div class="tr-error"><strong>' + (err && err.timeout ? 'The engine took too long to wake up.' : 'Couldn’t reach the live engine.') + '</strong>'
                + '<p>It sleeps when nobody is using it. Wait a few seconds and press Translate again.</p></div>',
                '<span class="tr-badge-pill is-err">Not translated</span>', false);
        });
    }

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
            setOut(emptyOutHtml(), '', false);
        };
        if (exampleXml) { fill(); return; }
        fetch(EXAMPLE_URL).then(function (r) { return r.json(); }).then(function (j) {
            exampleXml = (j && j.xml) || '';
            fill();
        }).catch(function () { /* offline — the box simply stays empty */ });
    }

    function pasteOwn() {
        const src = $('tr-src');
        if (!src) return;
        src.value = '';
        onInput();
        const sel = $('tr-target'); if (sel) sel.value = '';
        setOut('<div class="tr-empty"><p><strong>Paste your message on the left.</strong></p><p>ISO 20022 XML or SWIFT MT. The type is detected as you paste, and the matching format is picked for you.</p></div>', '', false);
        src.focus();
    }

    function getSource() { const s = $('tr-src'); return s ? s.value : ''; }

    function init(id) {
        mountId = id || 'tr-root';
        render();
        loadExample();
        if (window.MsgTransformer && MsgTransformer.warmEngine) MsgTransformer.warmEngine();
    }

    return { init: init, onInput: onInput, onTarget: onTarget, translate: translate, copy: copy, loadExample: loadExample,
             pasteOwn: pasteOwn, showPairs: showPairs, getSource: getSource, detect: detect, checkPair: checkPair, FORMATS: FORMATS };
})();
window.Translator = Translator;
