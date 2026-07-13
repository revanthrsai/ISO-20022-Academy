// =============================================================================
// PLAYGROUND TOOL · MESSAGE TRANSFORMER  (Session 4.2)
// -----------------------------------------------------------------------------
// A live, BIDIRECTIONAL format converter: the legacy SWIFT MT103 on one side,
// the ISO 20022 pacs.008 on the other, both editable, both kept in sync through
// a single canonical payment model.
//
//   • Edit any MT103 field  → the pacs.008 rebuilds live, field by field.
//   • Edit any pacs.008 value → the MT103 rebuilds live, the other direction.
//   • A direction toggle (MT103 → pacs.008  /  pacs.008 → MT103) reframes which
//     side is the "source" so both real-world conversions are taught — the
//     modernisation path and the fallback path — without ever desyncing.
//   • Hover a field on either side and its counterpart lights up across the
//     wire; a "Plain English" toggle renames every cryptic ISO tag.
//
// Self-contained: one global `MsgTransformer` object + its own injected styles,
// so it drops into the Playground page without touching the shared stylesheet.
// No dependencies beyond the DOM.
//
// Threaded to the Library: the default payment is the same Bob → Sweety $400
// transfer (EndToEndId BOB-INV0042, the shared UETR) the 300/500 lessons follow.
// =============================================================================

const MsgTransformer = (function () {
    // Stable per-session identifiers so the messages don't churn on every keypress.
    const UETR = 'eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4';
    const MSG_ID = 'EBILAEAD-20260627-000400';
    const INSTR_ID = 'EBILAEAD-INSTR-0400';

    // ── Phase 4 · the live transform engine (Spring Boot + Prowide, on Render).
    // Swap to 'http://localhost:8080' to test against a local server.
    const TRANSFORM_API = 'https://iso20022academy-transform-api.onrender.com';

    // The canonical payment — the meaning both formats agree on. Each key is the
    // single source of truth; both renderings (MT103 and pacs.008) read from here,
    // and every editable control on either side writes back here.
    const DEFAULTS = {
        ref: 'BOB-INV0042',
        valDate: '2026-06-27',
        ccy: 'USD',
        amount: '400.00',
        dbtrNm: 'Bob Marsh',
        dbtrAdr: '14 Marina View, Dubai, AE',
        dbtrAgt: 'EBILAEAD',
        cdtrAgt: 'HDFCINBB',
        cdtrNm: 'Sweety Rao',
        cdtrAdr: '22 MG Road, Bengaluru, IN',
        rmt: 'Invoice 0042 — June freelance',
        chrg: 'SHAR'
    };

    let state = Object.assign({}, DEFAULTS);
    let direction = 'mt2mx';   // 'mt2mx' | 'mx2mt' — which side is framed as source
    let plain = false;         // plain-English labels on the pacs.008 side
    let mountId = 'mxt-root';

    // Upper-cased keys (rendered upper-case, edits forced upper-case).
    const UPPER = { ccy: 1, dbtrAgt: 1, cdtrAgt: 1 };

    // -------------------------------------------------------------------------
    // MT103 source layout — the real SWIFT field tags, each tied to model keys.
    // -------------------------------------------------------------------------
    const MT_FIELDS = [
        { tag: ':20:', label: "Sender's Reference", keys: ['ref'] },
        { tag: ':32A:', label: 'Value Date / Currency / Amount', keys: ['valDate', 'ccy', 'amount'] },
        { tag: ':50K:', label: 'Ordering Customer (who pays)', keys: ['dbtrNm', 'dbtrAdr'] },
        { tag: ':52A:', label: "Ordering Institution (payer's bank)", keys: ['dbtrAgt'] },
        { tag: ':57A:', label: "Account With Institution (payee's bank)", keys: ['cdtrAgt'] },
        { tag: ':59:', label: 'Beneficiary Customer (who is paid)', keys: ['cdtrNm', 'cdtrAdr'] },
        { tag: ':70:', label: 'Remittance Information', keys: ['rmt'] },
        { tag: ':71A:', label: 'Details of Charges', keys: ['chrg'] }
    ];

    const FIELD_META = {
        ref:     { ph: 'Reference' },
        valDate: { type: 'date', width: 150 },
        ccy:     { ph: 'CCY', maxlength: 3, width: 64 },
        amount:  { ph: 'Amount', width: 108 },
        dbtrNm:  { ph: 'Name' },
        dbtrAdr: { ph: 'Address' },
        dbtrAgt: { ph: 'BIC' },
        cdtrAgt: { ph: 'BIC' },
        cdtrNm:  { ph: 'Name' },
        cdtrAdr: { ph: 'Address' },
        rmt:     { ph: 'What it pays for' },
        chrg:    { ph: 'Charges', options: ['SHAR', 'OUR', 'BEN'] }
    };

    // Plain-English name for every pacs.008 tag we emit.
    const PLAIN = {
        Document: 'ISO 20022 document',
        FIToFICstmrCdtTrf: 'Bank-to-bank customer credit transfer',
        GrpHdr: 'Group header — file-wide info',
        MsgId: 'Message ID — point-to-point, changes each hop',
        CreDtTm: 'Created date & time',
        NbOfTxs: 'Number of transactions',
        SttlmInf: 'Settlement info',
        SttlmMtd: 'Settlement method',
        InstgAgt: 'Instructing agent — bank sending this',
        InstdAgt: 'Instructed agent — bank receiving this',
        CdtTrfTxInf: 'The transaction itself',
        PmtId: 'Payment identifiers',
        InstrId: 'Instruction ID — this hop only',
        EndToEndId: 'End-to-end reference — unchanged the whole way',
        UETR: 'Unique tracking ID — global, every hop',
        IntrBkSttlmAmt: 'Interbank settlement amount',
        IntrBkSttlmDt: 'Settlement date',
        ChrgBr: 'Who pays the charges',
        Dbtr: 'Debtor — who pays (Bob)',
        Cdtr: 'Creditor — who is paid (Sweety)',
        DbtrAgt: "Debtor agent — Bob's bank",
        CdtrAgt: "Creditor agent — Sweety's bank",
        FinInstnId: 'Financial-institution ID',
        BICFI: 'Bank Identifier Code (BIC)',
        Nm: 'Name',
        PstlAdr: 'Postal address',
        AdrLine: 'Address line',
        RmtInf: 'Remittance info — what the payment is for',
        Ustrd: 'Unstructured remittance text'
    };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function creDtTm() {
        return (state.valDate || '2026-06-27') + 'T09:30:00+04:00';
    }

    // -------------------------------------------------------------------------
    // MT103 RENDER — the SWIFT side. Field 32A packs date+ccy+amount; 50K/59 pack
    // name+address. Mapped values render as live editable controls.
    // -------------------------------------------------------------------------
    function mtControl(key) {
        const m = FIELD_META[key] || {};
        const val = esc(state[key]);
        const common = `data-key="${key}" data-side="mt"
            onfocus="MsgTransformer.hover('${key}', true)" onblur="MsgTransformer.hover('${key}', false)"
            onmouseenter="MsgTransformer.hover('${key}', true)" onmouseleave="MsgTransformer.hover('${key}', false)"`;
        if (m.options) {
            const opts = m.options.map(o => `<option value="${o}"${state[key] === o ? ' selected' : ''}>${o}</option>`).join('');
            return `<select class="mxt-in mxt-sel" ${common} onchange="MsgTransformer.edit('${key}', this.value)">${opts}</select>`;
        }
        const type = m.type === 'date' ? 'date' : 'text';
        const style = m.width ? ` style="max-width:${m.width}px"` : '';
        const ml = m.maxlength ? ` maxlength="${m.maxlength}"` : '';
        const ph = m.ph ? ` placeholder="${m.ph}"` : '';
        return `<input class="mxt-in" type="${type}" value="${val}"${style}${ml}${ph} ${common}
            oninput="MsgTransformer.edit('${key}', this.value)">`;
    }

    function mtFieldHtml(f) {
        const inputs = f.keys.map(mtControl).join('<span class="mxt-sep"></span>');
        return `<div class="mxt-field" data-keys="${f.keys.join(',')}">
            <div class="mxt-field-head">
                <span class="mxt-mt-tag">${f.tag}</span>
                <span class="mxt-mt-label">${f.label}</span>
            </div>
            <div class="mxt-field-ins">${inputs}</div>
        </div>`;
    }

    function renderMt() {
        return `<div class="mxt-fields">${MT_FIELDS.map(mtFieldHtml).join('')}</div>`;
    }

    // -------------------------------------------------------------------------
    // pacs.008 RENDER — built as a flat line list so the same data renders as raw
    // XML or as a plain-English tree. Mapped leaf values (and the Ccy attribute)
    // become live, editable spans that write straight back to the model.
    // -------------------------------------------------------------------------
    function buildLines() {
        const L = [];
        const open = (d, tag, from, attr) => L.push({ d, kind: 'open', tag, from, attr });
        const close = (d, tag, from) => L.push({ d, kind: 'close', tag, from });
        // editKey → the value is editable and bound to that model key.
        const leaf = (d, tag, value, from, opt) => L.push(Object.assign({ d, kind: 'leaf', tag, value, from }, opt || {}));

        open(0, 'Document', null, 'xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08"');
        open(1, 'FIToFICstmrCdtTrf');
        open(2, 'GrpHdr');
        leaf(3, 'MsgId', MSG_ID, 'auto');
        leaf(3, 'CreDtTm', creDtTm(), 'valDate');
        leaf(3, 'NbOfTxs', '1', 'auto');
        open(3, 'SttlmInf');
        leaf(4, 'SttlmMtd', 'INDA', 'auto');
        close(3, 'SttlmInf');
        open(3, 'InstgAgt'); open(4, 'FinInstnId', 'dbtrAgt');
        leaf(5, 'BICFI', state.dbtrAgt, 'dbtrAgt', { editKey: 'dbtrAgt' });
        close(4, 'FinInstnId', 'dbtrAgt'); close(3, 'InstgAgt');
        open(3, 'InstdAgt'); open(4, 'FinInstnId', 'cdtrAgt');
        leaf(5, 'BICFI', state.cdtrAgt, 'cdtrAgt', { editKey: 'cdtrAgt' });
        close(4, 'FinInstnId', 'cdtrAgt'); close(3, 'InstdAgt');
        close(2, 'GrpHdr');

        open(2, 'CdtTrfTxInf');
        open(3, 'PmtId');
        leaf(4, 'InstrId', INSTR_ID, 'auto');
        leaf(4, 'EndToEndId', state.ref, 'ref', { editKey: 'ref' });
        leaf(4, 'UETR', UETR, 'auto');
        close(3, 'PmtId');
        leaf(3, 'IntrBkSttlmAmt', state.amount, 'amount', { editKey: 'amount', ccyKey: 'ccy' });
        leaf(3, 'IntrBkSttlmDt', state.valDate, 'valDate', { editKey: 'valDate', dateType: true });
        leaf(3, 'ChrgBr', state.chrg, 'chrg', { editKey: 'chrg', options: ['SHAR', 'OUR', 'BEN'] });

        open(3, 'Dbtr', 'dbtrNm');
        leaf(4, 'Nm', state.dbtrNm, 'dbtrNm', { editKey: 'dbtrNm' });
        open(4, 'PstlAdr', 'dbtrAdr');
        leaf(5, 'AdrLine', state.dbtrAdr, 'dbtrAdr', { editKey: 'dbtrAdr' });
        close(4, 'PstlAdr', 'dbtrAdr');
        close(3, 'Dbtr', 'dbtrNm');

        open(3, 'DbtrAgt', 'dbtrAgt'); open(4, 'FinInstnId', 'dbtrAgt');
        leaf(5, 'BICFI', state.dbtrAgt, 'dbtrAgt', { editKey: 'dbtrAgt' });
        close(4, 'FinInstnId', 'dbtrAgt'); close(3, 'DbtrAgt', 'dbtrAgt');

        open(3, 'CdtrAgt', 'cdtrAgt'); open(4, 'FinInstnId', 'cdtrAgt');
        leaf(5, 'BICFI', state.cdtrAgt, 'cdtrAgt', { editKey: 'cdtrAgt' });
        close(4, 'FinInstnId', 'cdtrAgt'); close(3, 'CdtrAgt', 'cdtrAgt');

        open(3, 'Cdtr', 'cdtrNm');
        leaf(4, 'Nm', state.cdtrNm, 'cdtrNm', { editKey: 'cdtrNm' });
        open(4, 'PstlAdr', 'cdtrAdr');
        leaf(5, 'AdrLine', state.cdtrAdr, 'cdtrAdr', { editKey: 'cdtrAdr' });
        close(4, 'PstlAdr', 'cdtrAdr');
        close(3, 'Cdtr', 'cdtrNm');

        open(3, 'RmtInf', 'rmt');
        leaf(4, 'Ustrd', state.rmt, 'rmt', { editKey: 'rmt' });
        close(3, 'RmtInf', 'rmt');
        close(2, 'CdtTrfTxInf');
        close(1, 'FIToFICstmrCdtTrf');
        close(0, 'Document');
        return L;
    }

    function pad(d) { return '  '.repeat(d); }

    // An editable bound value span (writes back to the model on input).
    function editSpan(key, value, extraCls) {
        return `<span class="mxt-edit ${extraCls || ''}" contenteditable="true" spellcheck="false"
            data-key="${key}" data-side="mx"
            onfocus="MsgTransformer.hover('${key}', true)" onblur="MsgTransformer.hover('${key}', false)"
            onmouseenter="MsgTransformer.hover('${key}', true)" onmouseleave="MsgTransformer.hover('${key}', false)"
            oninput="MsgTransformer.editFromMx('${key}', this.textContent)">${esc(value)}</span>`;
    }

    function renderXmlLine(ln) {
        const ind = pad(ln.d);
        const from = ln.from ? ` data-from="${ln.from}"` : '';

        if (plain) {
            if (ln.kind === 'close') return '';
            const name = PLAIN[ln.tag] || ln.tag;
            let val = '';
            if (ln.kind === 'leaf') {
                if (ln.editKey) {
                    val = '  ' + editSpan(ln.editKey, ln.value, 'mxt-tree-val');
                    if (ln.ccyKey) val += ' ' + editSpan(ln.ccyKey, state[ln.ccyKey], 'mxt-tree-ccy');
                } else if (ln.value !== undefined && ln.value !== '') {
                    val = `  <span class="mxt-tree-val mxt-auto">${esc(ln.value)}</span>`;
                }
            }
            return `<div class="mxt-line"${from}>${ind}<span class="mxt-tree-name">${name}</span>${val}</div>`;
        }

        // raw XML
        if (ln.kind === 'open') {
            const attr = ln.attr ? ` <span class="mxt-x-at">${esc(ln.attr)}</span>` : '';
            return `<div class="mxt-line"${from}>${ind}<span class="mxt-x-pt">&lt;</span><span class="mxt-x-tg">${ln.tag}</span>${attr}<span class="mxt-x-pt">&gt;</span></div>`;
        }
        if (ln.kind === 'close') {
            return `<div class="mxt-line"${from}>${ind}<span class="mxt-x-pt">&lt;/</span><span class="mxt-x-tg">${ln.tag}</span><span class="mxt-x-pt">&gt;</span></div>`;
        }
        // leaf
        let attr = '';
        if (ln.ccyKey) {
            attr = ` <span class="mxt-x-at">Ccy="</span>${editSpan(ln.ccyKey, state[ln.ccyKey], 'mxt-x-vl')}<span class="mxt-x-at">"</span>`;
        }
        const v = ln.editKey
            ? editSpan(ln.editKey, ln.value, 'mxt-x-vl')
            : `<span class="mxt-x-vl mxt-auto">${esc(ln.value)}</span>`;
        return `<div class="mxt-line"${from}>${ind}<span class="mxt-x-pt">&lt;</span><span class="mxt-x-tg">${ln.tag}</span>${attr}<span class="mxt-x-pt">&gt;</span>${v}<span class="mxt-x-pt">&lt;/</span><span class="mxt-x-tg">${ln.tag}</span><span class="mxt-x-pt">&gt;</span></div>`;
    }

    function renderMx() {
        return `<div class="mxt-xml" id="mxt-xml">${buildLines().map(renderXmlLine).join('')}</div>`;
    }

    // -------------------------------------------------------------------------
    // FULL RENDER — the whole console. Direction decides which pane sits left.
    // -------------------------------------------------------------------------
    function paneMt() {
        return `<div class="mxt-pane mxt-pane-mt" data-pane="mt">
            <div class="mxt-bar">
                <span class="mxt-dot"></span><span class="mxt-dot"></span><span class="mxt-dot"></span>
                <span class="mxt-bar-name">message.mt103</span>
                <span class="mxt-flag mxt-flag-legacy">SWIFT MT &middot; legacy</span>
            </div>
            <div class="mxt-body">${renderMt()}</div>
        </div>`;
    }

    function paneMx() {
        return `<div class="mxt-pane mxt-pane-mx" data-pane="mx">
            <div class="mxt-bar">
                <span class="mxt-dot"></span><span class="mxt-dot"></span><span class="mxt-dot"></span>
                <span class="mxt-bar-name">pacs.008.xml</span>
                <span class="mxt-flag mxt-flag-iso">ISO 20022</span>
                <div class="mxt-toggle" role="tablist">
                    <button class="mxt-toggle-btn ${!plain ? 'is-on' : ''}" onclick="MsgTransformer.setPlain(false)">XML</button>
                    <button class="mxt-toggle-btn ${plain ? 'is-on' : ''}" onclick="MsgTransformer.setPlain(true)">Plain English</button>
                </div>
            </div>
            <div class="mxt-body">${renderMx()}</div>
        </div>`;
    }

    function wire() {
        const rev = direction === 'mx2mt';
        return `<div class="mxt-wire" aria-hidden="true">
            <span class="mxt-wire-arrow">${rev ? '←' : '→'}</span>
            <span class="mxt-wire-dot"></span>
            <span class="mxt-wire-dot" style="animation-delay:.45s"></span>
            <span class="mxt-wire-dot" style="animation-delay:.9s"></span>
            <span class="mxt-wire-label">transform</span>
        </div>`;
    }

    function render() {
        const root = document.getElementById(mountId);
        if (!root) return;
        const mt2mx = direction === 'mt2mx';
        const note = mt2mx
            ? '<strong>Modernising.</strong> Edit the legacy MT103 &mdash; the ISO&nbsp;20022 pacs.008 rebuilds live, meaning preserved.'
            : '<strong>Fallback.</strong> Edit the ISO&nbsp;20022 pacs.008 &mdash; the legacy MT103 rebuilds live for a counterparty still on the old format.';

        root.innerHTML = `
            <div class="mxt-controls">
                <div class="mxt-dir" role="tablist" aria-label="Conversion direction">
                    <button class="mxt-dir-btn ${mt2mx ? 'is-on' : ''}" onclick="MsgTransformer.setDir('mt2mx')">MT103 &rarr; pacs.008</button>
                    <button class="mxt-dir-btn ${!mt2mx ? 'is-on' : ''}" onclick="MsgTransformer.setDir('mx2mt')">pacs.008 &rarr; MT103</button>
                </div>
                <span class="mxt-note">${note}</span>
                <button class="mxt-reset" onclick="MsgTransformer.reset()">&#8635; Reset to Bob &rarr; Sweety</button>
                <button class="mxt-engine-btn" id="mxt-engine-btn" onclick="MsgTransformer.runLiveEngine()">&#9889; Run through the live engine &rarr;</button>
            </div>

            <div class="mxt-grid">
                ${mt2mx ? paneMt() : paneMx()}
                ${wire()}
                ${mt2mx ? paneMx() : paneMt()}
            </div>

            <div class="mxt-foot">
                <span class="mxt-foot-k">12</span> business fields, one meaning &mdash; both formats stay in lock-step. Edit either side; the other follows.
            </div>

            <div class="mxt-engine" id="mxt-engine-out" hidden></div>
        `;
    }

    // -------------------------------------------------------------------------
    // EDIT HANDLERS — single source of truth in `state`; re-render only the
    // OPPOSITE pane so the caret on the side you're typing in never jumps.
    // -------------------------------------------------------------------------
    function applyEdit(key, value) {
        if (UPPER[key]) value = value.toUpperCase();
        state[key] = value;
    }

    // From an MT103 control → rebuild the pacs.008 pane.
    function edit(key, value) {
        applyEdit(key, value);
        const xml = document.getElementById('mxt-xml');
        if (xml) xml.innerHTML = buildLines().map(renderXmlLine).join('');
        hover(key, true);
        flash(key, 'mx');
    }

    // From a pacs.008 editable span → rebuild the MT103 pane.
    function editFromMx(key, value) {
        applyEdit(key, value);
        const fields = document.querySelector('.mxt-pane-mt .mxt-fields');
        if (fields) fields.innerHTML = MT_FIELDS.map(mtFieldHtml).join('');
        hover(key, true);
        flash(key, 'mt');
    }

    // Light up a key's controls/lines on BOTH sides.
    function hover(key, on) {
        document.querySelectorAll(`[data-key="${key}"]`).forEach(el => {
            const host = el.closest('.mxt-field') || el;
            host.classList.toggle('is-linked', !!on);
            el.classList.toggle('is-linked', !!on);
        });
        document.querySelectorAll(`.mxt-line[data-from="${key}"]`).forEach(el => {
            el.classList.toggle('is-linked', !!on);
        });
    }

    // Briefly pulse the just-synced counterpart on the target side.
    function flash(key, side) {
        const sel = side === 'mx'
            ? `.mxt-pane-mx .mxt-line[data-from="${key}"]`
            : `.mxt-pane-mt [data-key="${key}"]`;
        document.querySelectorAll(sel).forEach(el => {
            const host = side === 'mt' ? (el.closest('.mxt-field') || el) : el;
            host.classList.remove('is-synced');
            // force reflow so the animation restarts on rapid edits
            void host.offsetWidth;
            host.classList.add('is-synced');
        });
    }

    function setDir(d) { direction = d; render(); }
    function setPlain(v) {
        plain = !!v;
        const xml = document.getElementById('mxt-xml');
        if (xml) xml.innerHTML = buildLines().map(renderXmlLine).join('');
        document.querySelectorAll('.mxt-toggle-btn').forEach((b, i) => b.classList.toggle('is-on', i === (plain ? 1 : 0)));
    }
    function reset() { state = Object.assign({}, DEFAULTS); render(); }

    // Load a (partial) canonical model from outside — used by the Sample Library
    // (Session 4.5) to drop a pacs.008 straight in. Missing keys keep DEFAULTS,
    // so the two panes stay coherent. Additive: existing flows are untouched.
    function loadModel(partial) {
        state = Object.assign({}, DEFAULTS, partial || {});
        direction = 'mt2mx';
        render();
    }

    // Workspace handoff (Session 4.6) — serialise the live model to a real pacs.008
    // XML string so the Viewer / Validator / Comparator can pick it up unchanged.
    function getXml() {
        const head = '<?xml version="1.0" encoding="UTF-8"?>\n';
        const body = buildLines().map(ln => {
            const ind = pad(ln.d);
            if (ln.kind === 'open')  return ind + '<' + ln.tag + (ln.attr ? ' ' + ln.attr : '') + '>';
            if (ln.kind === 'close') return ind + '</' + ln.tag + '>';
            const ccy = ln.ccyKey ? ' Ccy="' + esc(state[ln.ccyKey]) + '"' : '';
            return ind + '<' + ln.tag + ccy + '>' + esc(ln.value) + '</' + ln.tag + '>';
        }).join('\n');
        return head + body;
    }

    // The inverse: take a pacs.008 from another tool and hydrate the model. Reads
    // the same fields loadModel expects; unknown/absent fields keep DEFAULTS. A
    // non-pacs message (nothing recognised) is left for the user rather than
    // silently resetting the panes to the default payment.
    function loadXml(xml) {
        const doc = new DOMParser().parseFromString(xml || '', 'application/xml');
        if (doc.querySelector('parsererror') || !doc.documentElement) return;
        const get = (sel) => { const n = doc.querySelector(sel); return n ? (n.textContent || '').trim() : ''; };
        const amt = doc.querySelector('IntrBkSttlmAmt');
        const partial = {
            ref: get('CdtTrfTxInf > PmtId > EndToEndId') || get('EndToEndId'),
            valDate: get('IntrBkSttlmDt'),
            ccy: amt ? (amt.getAttribute('Ccy') || '') : '',
            amount: amt ? (amt.textContent || '').trim() : '',
            dbtrNm: get('Dbtr > Nm'),
            dbtrAdr: get('Dbtr AdrLine'),
            dbtrAgt: get('DbtrAgt BICFI'),
            cdtrAgt: get('CdtrAgt BICFI'),
            cdtrNm: get('Cdtr > Nm'),
            cdtrAdr: get('Cdtr AdrLine'),
            rmt: get('RmtInf > Ustrd'),
            chrg: get('ChrgBr')
        };
        Object.keys(partial).forEach(k => { if (!partial[k]) delete partial[k]; });
        if (Object.keys(partial).length === 0) return;  // not a pacs.008 — leave as-is
        loadModel(partial);
    }

    // -------------------------------------------------------------------------
    // STYLES — injected once, theme-aware (reads the global CSS variables).
    // -------------------------------------------------------------------------
    function injectStyles() {
        if (document.getElementById('mxt-styles')) return;
        const css = `
        .mxt { display: flex; flex-direction: column; gap: 18px; }

        .mxt-controls { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .mxt-dir { display: inline-flex; background: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-pill); padding: 3px; }
        .mxt-dir-btn {
            background: transparent; border: 0; cursor: pointer; color: var(--text-faint);
            font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.02em;
            padding: 6px 14px; border-radius: var(--radius-pill);
            transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }
        .mxt-dir-btn.is-on { background: var(--primary); color: #FFFFFF; font-weight: 700; }
        .mxt-note { font-size: 13px; color: var(--text-muted); line-height: 1.5; max-width: 46ch; }
        .mxt-note strong { color: var(--text); font-weight: 600; }
        .mxt-reset {
            margin-left: auto; background: transparent; border: 1px solid var(--border);
            color: var(--text-muted); font-family: var(--font-mono); font-size: 11px;
            letter-spacing: 0.02em; padding: 6px 12px; border-radius: var(--radius-xs); cursor: pointer;
            transition: border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }
        .mxt-reset:hover { border-color: var(--border-hi); color: var(--text); }

        .mxt-grid { display: grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr); align-items: stretch; gap: 14px; }
        @media (max-width: 900px) { .mxt-grid { grid-template-columns: 1fr; } .mxt-wire { flex-direction: row !important; padding: 6px 0 !important; } }

        .mxt-pane { display: flex; flex-direction: column; min-width: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
        .mxt-bar { display: flex; align-items: center; gap: 7px; padding: 11px 14px; border-bottom: 1px solid var(--border); background: var(--bg-deep); }
        .mxt-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--border-hi); }
        .mxt-bar-name { margin-left: 6px; font-family: var(--font-mono); font-size: 12px; color: var(--text-faint); letter-spacing: 0.02em; }
        .mxt-flag { margin-left: auto; font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 8px; border-radius: var(--radius-pill); }
        .mxt-flag-legacy { color: var(--warning); background: rgba(214,158,46,0.10); border: 1px solid rgba(214,158,46,0.30); }
        .mxt-flag-iso { color: var(--primary-bright); background: var(--glass-tint-strong); border: 1px solid var(--primary-deep); }
        .mxt-body { flex: 1; min-height: 420px; max-height: 620px; overflow: auto; padding: 14px; }

        /* MT103 editable fields */
        .mxt-fields { display: flex; flex-direction: column; gap: 12px; }
        .mxt-field { padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-deep); transition: border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out); }
        .mxt-field.is-linked { border-color: var(--primary-deep); background: var(--glass-tint-strong); }
        .mxt-field.is-synced { animation: mxtPulse 0.6s var(--ease-out); }
        .mxt-field-head { display: flex; align-items: baseline; gap: 9px; margin-bottom: 7px; }
        .mxt-mt-tag { font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--warning); }
        .mxt-mt-label { font-size: 11.5px; color: var(--text-faint); letter-spacing: 0.01em; }
        .mxt-field-ins { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
        .mxt-sep { width: 1px; align-self: stretch; }
        .mxt-in {
            flex: 1; min-width: 90px; background: var(--surface); border: 1px solid var(--border);
            color: var(--text); font-family: var(--font-mono); font-size: 12.5px;
            padding: 7px 10px; border-radius: var(--radius-xs); outline: none;
            transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
        }
        .mxt-in:focus { border-color: var(--primary); box-shadow: var(--ring); }
        .mxt-sel { cursor: pointer; flex: 0 0 auto; min-width: 84px; }

        /* WIRE */
        .mxt-wire { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; padding: 0 4px; }
        .mxt-wire-arrow { font-size: 22px; color: var(--primary); font-weight: 700; }
        .mxt-wire-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--primary); opacity: 0.35; animation: mxtFlow 1.5s var(--ease-in-out) infinite; }
        .mxt-wire-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-faint); writing-mode: vertical-rl; margin-top: 4px; }
        @media (max-width: 900px) { .mxt-wire-label { writing-mode: horizontal-tb; } .mxt-wire-arrow { transform: rotate(90deg); } }

        /* pacs.008 lines */
        .mxt-xml { font-family: var(--font-mono); font-size: 12.5px; line-height: 1.55; white-space: pre-wrap; }
        .mxt-line { padding: 1px 6px; border-radius: var(--radius-xs); transition: background var(--dur-fast) var(--ease-out); }
        .mxt-line.is-linked { background: var(--glass-tint-strong); }
        .mxt-line.is-synced { animation: mxtPulse 0.6s var(--ease-out); }
        .mxt-x-pt { color: var(--text-faint); }
        .mxt-x-tg { color: var(--primary-bright); }
        .mxt-x-at { color: var(--warning); font-size: 11px; }
        .mxt-x-vl { color: var(--text); }
        .mxt-tree-name { color: var(--text); font-weight: 600; }
        .mxt-tree-val { color: var(--primary-bright); }
        .mxt-tree-ccy { color: var(--warning); }
        .mxt-auto { opacity: 0.55; }

        /* editable bound values */
        .mxt-edit {
            outline: none; border-radius: 3px; padding: 0 3px; margin: 0 -1px;
            cursor: text; border-bottom: 1px dashed var(--border-hi);
            transition: background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
        }
        .mxt-edit:hover { background: var(--surface-alt); }
        .mxt-edit:focus { background: var(--surface-alt); border-bottom-color: var(--primary); box-shadow: 0 1px 0 0 var(--primary); }
        .mxt-edit.is-linked { background: var(--surface-alt); border-bottom-color: var(--primary); }

        .mxt-foot { font-size: 12px; color: var(--text-faint); line-height: 1.6; padding-top: 4px; border-top: 1px solid var(--border); }
        .mxt-foot-k { color: var(--primary); font-family: var(--font-mono); font-weight: 700; }

        @keyframes mxtFlow { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.9; } }
        @keyframes mxtPulse { 0% { background: var(--primary); } 100% { background: transparent; } }

        /* Live engine (Phase 4) */
        .mxt-engine-btn { margin-left: auto; background: var(--primary); color: #fff; border: none; border-radius: var(--radius-pill); padding: 8px 16px; font: inherit; font-size: var(--fs-small); font-weight: 700; cursor: pointer; transition: background .15s, transform .15s; }
        .mxt-engine-btn:hover { background: var(--primary-hover, var(--primary-deep, var(--primary))); }
        .mxt-engine-btn:active { transform: scale(.97); }
        .mxt-engine-btn:disabled { opacity: .55; cursor: default; }
        .mxt-engine { border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; background: var(--surface); }
        .mxt-engine.is-loading { border-color: color-mix(in srgb, var(--primary) 40%, var(--border)); }
        .mxt-engine.is-ok { border-color: color-mix(in srgb, var(--success, #0B8A60) 45%, var(--border)); }
        .mxt-engine.is-err { border-color: color-mix(in srgb, var(--danger, #C13543) 45%, var(--border)); }
        .mxt-engine-head { display: flex; align-items: center; gap: 12px; padding: 12px 16px; flex-wrap: wrap; border-bottom: 1px solid var(--border); }
        .mxt-engine.is-loading .mxt-engine-head, .mxt-engine.is-err .mxt-engine-head { border-bottom: none; }
        .mxt-engine-badge { font-size: var(--fs-micro, 11px); font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #fff; background: var(--primary); border-radius: var(--radius-pill); padding: 3px 10px; white-space: nowrap; }
        .mxt-engine-badge.is-ok { background: var(--success, #0B8A60); }
        .mxt-engine-badge.is-err { background: var(--danger, #C13543); }
        .mxt-engine-status { flex: 1; min-width: 160px; font-size: var(--fs-small, 13px); color: var(--text-muted); }
        .mxt-engine-copy, .mxt-engine-retry { background: none; border: 1px solid var(--border-hi, var(--border)); border-radius: var(--radius-pill); padding: 4px 12px; font: inherit; font-size: var(--fs-small, 13px); font-weight: 600; color: var(--text); cursor: pointer; }
        .mxt-engine-copy:hover, .mxt-engine-retry:hover { border-color: var(--primary); color: var(--primary); }
        .mxt-engine-body { margin: 0; padding: 16px; overflow-x: auto; font-family: var(--font-mono); font-size: 13px; line-height: 1.6; color: var(--text); white-space: pre; background: var(--bg-deep, var(--surface-alt)); }
        `;
        const style = document.createElement('style');
        style.id = 'mxt-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // -------------------------------------------------------------------------
    // LIVE ENGINE (Phase 4) — send the current source message to the real
    // Spring Boot + Prowide service and show its result. The instant client
    // transform above is untouched; this is an explicit "run the real engine"
    // action, with a warming state for cold starts and a graceful fallback.
    // -------------------------------------------------------------------------
    function getMtText() {
        const d = state.valDate || '';
        const ymd = d.length === 10 ? d.slice(2, 4) + d.slice(5, 7) + d.slice(8, 10) : '';
        const amt = String(state.amount || '').replace('.', ',');
        const chrgMt = state.chrg === 'SHAR' ? 'SHA' : (state.chrg || 'SHA');
        const L = [];
        L.push(':20:' + (state.ref || ''));
        L.push(':23B:CRED');
        L.push(':32A:' + ymd + (state.ccy || '') + amt);
        L.push(':50K:' + (state.dbtrNm || ''));
        if (state.dbtrAgt) L.push(':52A:' + state.dbtrAgt);
        if (state.cdtrAgt) L.push(':57A:' + state.cdtrAgt);
        L.push(':59:' + (state.cdtrNm || ''));
        if (state.rmt) L.push(':70:' + state.rmt);
        L.push(':71A:' + chrgMt);
        return L.join('\n');
    }

    function engineError(out, msg) {
        out.className = 'mxt-engine is-err';
        out.innerHTML = '<div class="mxt-engine-head"><span class="mxt-engine-badge is-err">Live engine</span>'
            + '<span class="mxt-engine-status">' + esc(msg) + '</span>'
            + '<button class="mxt-engine-retry" onclick="MsgTransformer.runLiveEngine()">Retry</button></div>';
    }

    function runLiveEngine() {
        const out = document.getElementById('mxt-engine-out');
        const btn = document.getElementById('mxt-engine-btn');
        if (!out) return;
        const mt2mx = direction === 'mt2mx';
        const source = mt2mx ? getMtText() : getXml();
        const apiDir = mt2mx ? 'MT_TO_MX' : 'MX_TO_MT';
        out.hidden = false;
        out.className = 'mxt-engine is-loading';
        out.innerHTML = '<div class="mxt-engine-head"><span class="mxt-engine-badge">Live engine</span>'
            + '<span class="mxt-engine-status">Waking the engine&hellip; the first run can take ~30s.</span></div>';
        if (btn) btn.disabled = true;

        const url = TRANSFORM_API.replace(/\/+$/, '') + '/api/transform';
        const ctrl = new AbortController();
        const timer = setTimeout(function () { ctrl.abort(); }, 75000);
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: source, direction: apiDir }),
            signal: ctrl.signal
        }).then(function (r) { return r.json(); }).then(function (j) {
            clearTimeout(timer);
            if (btn) btn.disabled = false;
            if (!j || j.ok === false || !j.result) { engineError(out, (j && j.message) || 'The engine returned an error.'); return; }
            out.className = 'mxt-engine is-ok';
            out.innerHTML = '<div class="mxt-engine-head">'
                + '<span class="mxt-engine-badge is-ok">Live engine &#10003;</span>'
                + '<span class="mxt-engine-status">' + esc(j.sourceFormat || '') + ' &rarr; ' + esc(j.targetFormat || '')
                + ' &middot; transformed by a live Java + Prowide server</span>'
                + '<button class="mxt-engine-copy" onclick="MsgTransformer.copyEngine()">Copy</button></div>'
                + '<pre class="mxt-engine-body" id="mxt-engine-pre">' + esc(j.result) + '</pre>';
        }).catch(function (err) {
            clearTimeout(timer);
            if (btn) btn.disabled = false;
            const msg = (err && err.name === 'AbortError')
                ? 'The engine is waking up and took too long &mdash; give it a few seconds and hit Retry.'
                : 'Couldn&rsquo;t reach the live engine (it may be asleep). The instant preview above still works.';
            engineError(out, msg);
        });
    }

    // Reusable, UI-agnostic call to the live Spring Boot + Prowide engine. Takes
    // any source string + an API direction ('MT_TO_MX' | 'MX_TO_MT') and resolves
    // { ok, result, sourceFormat, targetFormat, message }. Rejects only on a
    // network failure or timeout (the abort case carries err.timeout = true), so
    // the caller can tell "engine said no" from "engine unreachable / asleep".
    // Used by the Playground's slide-over Transform panel.
    function callEngine(source, apiDir) {
        const url = TRANSFORM_API.replace(/\/+$/, '') + '/api/transform';
        const ctrl = new AbortController();
        const timer = setTimeout(function () { ctrl.abort(); }, 75000);
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: source, direction: apiDir }),
            signal: ctrl.signal
        }).then(function (r) {
            clearTimeout(timer);
            return r.json();
        }).then(function (j) {
            j = j || {};
            return {
                ok: j.ok !== false && !!j.result,
                result: j.result || '',
                sourceFormat: j.sourceFormat || '',
                targetFormat: j.targetFormat || '',
                message: j.message || ''
            };
        }).catch(function (err) {
            clearTimeout(timer);
            const e = new Error(err && err.name === 'AbortError' ? 'timeout' : 'network');
            e.timeout = !!(err && err.name === 'AbortError');
            throw e;
        });
    }

    function copyEngine() {
        const pre = document.getElementById('mxt-engine-pre');
        if (!pre) return;
        const txt = pre.textContent || '';
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
        const b = document.querySelector('.mxt-engine-copy');
        if (b) { const o = b.textContent; b.textContent = 'Copied ✓'; setTimeout(function () { b.textContent = o; }, 1500); }
    }

    // -------------------------------------------------------------------------
    // INIT — call after the mount container exists.
    // -------------------------------------------------------------------------
    function init(id) {
        mountId = id || 'mxt-root';
        state = Object.assign({}, DEFAULTS);
        direction = 'mt2mx';
        plain = false;
        injectStyles();
        render();
    }

    return { init, edit, editFromMx, hover, setDir, setPlain, reset, loadModel, getXml, loadXml, runLiveEngine, copyEngine, callEngine };
})();

window.MsgTransformer = MsgTransformer;
