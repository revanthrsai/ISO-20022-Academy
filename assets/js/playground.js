// =============================================================================
// PLAYGROUND — the live MT103 → ISO 20022 (pacs.008) transformer.
// -----------------------------------------------------------------------------
// Phase 10, Slices A + B of the staged sandbox (ACADEMY_BLUEPRINT_PLAN.md):
//   A. Edit the old SWIFT MT103 on the left; the pacs.008 rebuilds live on the
//      right, field by field, meaning preserved. A "Plain English" toggle
//      renames every cryptic tag to a human label (the logical-tree view), and
//      hovering a source field lights up exactly where it lands in the XML.
//   B. A live validator runs the CONCRETE failure modes the academy teaches —
//      truncated names, placeholder references, missing UTC offset, bad BIC,
//      malformed UETR — and "what breaks" injectors let the learner trigger
//      each one and watch the check fail in real time.
//
// Self-contained: one global `Playground` object, mounted by initPlayground()
// after navigate() swaps in the page shell. No dependencies beyond the DOM.
// =============================================================================

const Playground = (function () {
    // The Bob → Sweety payment, expressed as the MT103 a sender's bank would
    // type out. Each field is editable; everything downstream recomputes.
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
    let view = 'xml';          // 'xml' | 'plain'
    let faultTz = false;       // drop the UTC offset from CreDtTm
    let faultUetr = false;     // corrupt the UETR variant bits
    // Stable per-session identifiers so the XML doesn't churn on every keypress.
    const UETR = 'eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4';
    const BAD_UETR = 'EB6305C9-1F7C-1A9B-7B1E-2C2F4E7A91D4'; // uppercase + wrong version/variant
    const MSG_ID = 'BNKAUS33-20260627-000400';

    // The MT103 source layout — grouped fields, each tied to a state key. The
    // `:NN:` tags are the real SWIFT field identifiers; the label is the plain
    // meaning we already taught.
    const MT_FIELDS = [
        { tag: ':20:', label: "Sender's Reference", key: 'ref' },
        { tag: ':32A:', label: 'Value Date / Currency / Amount', composite: ['valDate', 'ccy', 'amount'] },
        { tag: ':50K:', label: 'Ordering Customer (who pays)', composite: ['dbtrNm', 'dbtrAdr'] },
        { tag: ':52A:', label: "Ordering Institution (payer's bank, BIC)", key: 'dbtrAgt' },
        { tag: ':57A:', label: "Account With Institution (payee's bank, BIC)", key: 'cdtrAgt' },
        { tag: ':59:', label: 'Beneficiary Customer (who is paid)', composite: ['cdtrNm', 'cdtrAdr'] },
        { tag: ':70:', label: 'Remittance Information', key: 'rmt' },
        { tag: ':71A:', label: 'Details of Charges', key: 'chrg', options: ['SHAR', 'OUR', 'BEN'] }
    ];

    const FIELD_META = {
        ref: { label: 'Reference', hint: '≤35 chars · no placeholders' },
        valDate: { label: 'Value date', type: 'date' },
        ccy: { label: 'Currency', hint: '3-letter ISO code', maxlength: 3, upper: true, width: 70 },
        amount: { label: 'Amount', width: 110 },
        dbtrNm: { label: 'Name' },
        dbtrAdr: { label: 'Address' },
        dbtrAgt: { label: 'BIC', hint: '8 or 11 chars', upper: true },
        cdtrAgt: { label: 'BIC', hint: '8 or 11 chars', upper: true },
        cdtrNm: { label: 'Name' },
        cdtrAdr: { label: 'Address' },
        rmt: { label: 'What it pays for' },
        chrg: { label: 'Charges' }
    };

    // Plain-English name for every tag we emit — the logical-tree dictionary.
    const PLAIN = {
        Document: 'ISO 20022 document',
        FIToFICstmrCdtTrf: 'Bank-to-bank customer credit transfer',
        GrpHdr: 'Group header — file-wide info',
        MsgId: 'Message ID — point-to-point, changes each hop',
        CreDtTm: 'Created date & time',
        NbOfTxs: 'Number of transactions',
        SttlmInf: 'Settlement info',
        SttlmMtd: 'Settlement method',
        CdtTrfTxInf: 'The transaction itself',
        PmtId: 'Payment identifiers',
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
        // 2026-06-27T09:30:00 plus a real offset — the offset is the teachable bit.
        const base = (state.valDate || '2026-06-27') + 'T09:30:00';
        return faultTz ? base : base + '+04:00';
    }

    // -------------------------------------------------------------------------
    // Build the pacs.008 as a flat list of lines so we can render it two ways
    // (raw XML / plain tree) and tag each line with the source field it maps
    // from (for the hover-link highlight).
    // -------------------------------------------------------------------------
    function buildLines() {
        const L = [];
        const open = (depth, tag, from, attr) => L.push({ depth, kind: 'open', tag, from, attr });
        const close = (depth, tag, from) => L.push({ depth, kind: 'close', tag, from });
        const leaf = (depth, tag, value, from, attr) => L.push({ depth, kind: 'leaf', tag, value, from, attr });

        open(0, 'Document', null, 'xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08"');
        open(1, 'FIToFICstmrCdtTrf');
        open(2, 'GrpHdr');
        leaf(3, 'MsgId', MSG_ID, 'auto');
        leaf(3, 'CreDtTm', creDtTm(), 'date');
        leaf(3, 'NbOfTxs', '1');
        open(3, 'SttlmInf');
        leaf(4, 'SttlmMtd', 'INDA');
        close(3, 'SttlmInf');
        close(2, 'GrpHdr');

        open(2, 'CdtTrfTxInf');
        open(3, 'PmtId');
        leaf(4, 'EndToEndId', state.ref, 'ref');
        leaf(4, 'UETR', faultUetr ? BAD_UETR : UETR, 'auto');
        close(3, 'PmtId');
        leaf(3, 'IntrBkSttlmAmt', state.amount, 'amount', `Ccy="${esc(state.ccy)}"`);
        leaf(3, 'IntrBkSttlmDt', state.valDate, 'valDate');
        leaf(3, 'ChrgBr', state.chrg, 'chrg');

        open(3, 'Dbtr', 'dbtrNm');
        leaf(4, 'Nm', state.dbtrNm, 'dbtrNm');
        open(4, 'PstlAdr', 'dbtrAdr');
        leaf(5, 'AdrLine', state.dbtrAdr, 'dbtrAdr');
        close(4, 'PstlAdr', 'dbtrAdr');
        close(3, 'Dbtr', 'dbtrNm');

        open(3, 'DbtrAgt', 'dbtrAgt');
        open(4, 'FinInstnId', 'dbtrAgt');
        leaf(5, 'BICFI', state.dbtrAgt, 'dbtrAgt');
        close(4, 'FinInstnId', 'dbtrAgt');
        close(3, 'DbtrAgt', 'dbtrAgt');

        open(3, 'CdtrAgt', 'cdtrAgt');
        open(4, 'FinInstnId', 'cdtrAgt');
        leaf(5, 'BICFI', state.cdtrAgt, 'cdtrAgt');
        close(4, 'FinInstnId', 'cdtrAgt');
        close(3, 'CdtrAgt', 'cdtrAgt');

        open(3, 'Cdtr', 'cdtrNm');
        leaf(4, 'Nm', state.cdtrNm, 'cdtrNm');
        open(4, 'PstlAdr', 'cdtrAdr');
        leaf(5, 'AdrLine', state.cdtrAdr, 'cdtrAdr');
        close(4, 'PstlAdr', 'cdtrAdr');
        close(3, 'Cdtr', 'cdtrNm');

        open(3, 'RmtInf', 'rmt');
        leaf(4, 'Ustrd', state.rmt, 'rmt');
        close(3, 'RmtInf', 'rmt');
        close(2, 'CdtTrfTxInf');
        close(1, 'FIToFICstmrCdtTrf');
        close(0, 'Document');
        return L;
    }

    function pad(depth) { return '  '.repeat(depth); }

    function renderXmlLine(ln) {
        const ind = pad(ln.depth);
        const from = ln.from ? ` data-from="${ln.from}"` : '';
        if (view === 'plain') {
            const name = PLAIN[ln.tag] || ln.tag;
            if (ln.kind === 'close') return '';
            const val = (ln.kind === 'leaf' && ln.value !== undefined && ln.value !== '')
                ? `<span class="pg-tree-val">${esc(ln.value)}</span>` : '';
            const ccy = ln.attr && /Ccy="([^"]*)"/.exec(ln.attr);
            const ccyTxt = ccy ? `<span class="pg-tree-ccy">${esc(ccy[1])}</span>` : '';
            return `<div class="pg-xml-line"${from}>${ind}<span class="pg-tree-name">${name}</span>${ccyTxt ? ' ' + ccyTxt : ''}${val ? '  ' + val : ''}</div>`;
        }
        // raw XML
        if (ln.kind === 'open') {
            const attr = ln.attr ? ` <span class="x-at">${esc(ln.attr)}</span>` : '';
            return `<div class="pg-xml-line"${from}>${ind}<span class="x-pt">&lt;</span><span class="x-tg">${ln.tag}</span>${attr}<span class="x-pt">&gt;</span></div>`;
        }
        if (ln.kind === 'close') {
            return `<div class="pg-xml-line"${from}>${ind}<span class="x-pt">&lt;/</span><span class="x-tg">${ln.tag}</span><span class="x-pt">&gt;</span></div>`;
        }
        // leaf
        const attr = ln.attr ? ` <span class="x-at">${esc(ln.attr)}</span>` : '';
        const v = `<span class="x-vl">${esc(ln.value)}</span>`;
        return `<div class="pg-xml-line"${from}>${ind}<span class="x-pt">&lt;</span><span class="x-tg">${ln.tag}</span>${attr}<span class="x-pt">&gt;</span>${v}<span class="x-pt">&lt;/</span><span class="x-tg">${ln.tag}</span><span class="x-pt">&gt;</span></div>`;
    }

    function renderXml() {
        return buildLines().map(renderXmlLine).join('');
    }

    // -------------------------------------------------------------------------
    // VALIDATION — the concrete failure modes the message lessons name.
    // Each rule returns {ok, fail} so the panel can show pass AND the exact
    // "fails when" reason the learner should recognise.
    // -------------------------------------------------------------------------
    const PLACEHOLDERS = ['', 'NOTPROVIDED', 'NOT PROVIDED', 'NA', 'N/A', 'NONE', 'NOREF', 'NO REF'];
    const BIC_RE = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    const UETR_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

    function validate() {
        const s = state;
        const ref = (s.ref || '').trim();
        const checks = [];

        checks.push({
            label: 'End-to-end reference',
            field: 'ref',
            ok: ref.length > 0 && ref.length <= 35 && PLACEHOLDERS.indexOf(ref.toUpperCase()) === -1,
            detail: ref.length > 35
                ? `${ref.length} chars — over the 35-char limit, rejected at the gateway`
                : PLACEHOLDERS.indexOf(ref.toUpperCase()) !== -1
                    ? `"${ref || '(empty)'}" is a placeholder — banks reject NOTPROVIDED / NA / empty`
                    : `"${ref}" travels unchanged, every hop`
        });

        const amtOk = /^\d+(\.\d{1,2})?$/.test((s.amount || '').trim()) && parseFloat(s.amount) > 0;
        const ccyOk = /^[A-Z]{3}$/.test((s.ccy || '').trim());
        checks.push({
            label: 'Amount & currency',
            field: 'amount',
            ok: amtOk && ccyOk,
            detail: !ccyOk ? `"${s.ccy}" isn't a 3-letter ISO currency code`
                : !amtOk ? `"${s.amount}" must be a positive number with ≤2 decimals`
                    : `${s.amount} ${s.ccy} — well-formed`
        });

        ['dbtrAgt', 'cdtrAgt'].forEach((k, i) => {
            const bic = (s[k] || '').trim();
            checks.push({
                label: i === 0 ? "Debtor agent BIC" : "Creditor agent BIC",
                field: k,
                ok: BIC_RE.test(bic),
                detail: BIC_RE.test(bic)
                    ? `${bic} — valid ${bic.length}-character BIC`
                    : `"${bic}" isn't a valid BIC (6 letters + 2, optional +3)`
            });
        });

        [['dbtrNm', 'Debtor'], ['cdtrNm', 'Creditor']].forEach(([k, who]) => {
            const nm = (s[k] || '').trim();
            const wouldTruncate = nm.length > 35;
            checks.push({
                label: `${who} name`,
                field: k,
                ok: nm.length > 0,
                warn: wouldTruncate,
                detail: nm.length === 0 ? 'Missing — a party must be named'
                    : wouldTruncate ? `${nm.length} chars — survives in ISO 20022, but the old MT103 would clip it to 35 and break screening`
                        : `"${nm}" — fits, nothing lost`
            });
        });

        checks.push({
            label: 'Created timestamp',
            field: 'date',
            ok: !faultTz,
            detail: faultTz
                ? 'No UTC offset — the receiver can\'t place the payment in time'
                : `${creDtTm()} — carries its UTC offset`
        });

        checks.push({
            label: 'UETR format',
            field: 'auto',
            ok: !faultUetr && UETR_RE.test(UETR),
            detail: faultUetr
                ? 'Uppercase + wrong version/variant bits — not a valid RFC 4122 UUIDv4'
                : 'Lowercase UUIDv4, version 4, variant 8/9/a/b — valid'
        });

        return checks;
    }

    function renderChecks() {
        const checks = validate();
        const passing = checks.filter(c => c.ok && !c.warn).length;
        const issues = checks.filter(c => !c.ok).length;
        const warns = checks.filter(c => c.ok && c.warn).length;

        const rows = checks.map(c => {
            const cls = !c.ok ? 'is-fail' : c.warn ? 'is-warn' : 'is-pass';
            const icon = !c.ok ? '✕' : c.warn ? '!' : '✓';
            return `<div class="pg-check ${cls}" data-from="${c.field}">
                <span class="pg-check-icon">${icon}</span>
                <span class="pg-check-body">
                    <span class="pg-check-label">${c.label}</span>
                    <span class="pg-check-detail">${c.detail}</span>
                </span>
            </div>`;
        }).join('');

        const summary = issues > 0
            ? `<span class="pg-sum-fail">${issues} blocking ${issues === 1 ? 'issue' : 'issues'}</span>`
            : warns > 0
                ? `<span class="pg-sum-warn">Valid — ${warns} legacy-MT warning${warns === 1 ? '' : 's'}</span>`
                : `<span class="pg-sum-ok">All checks pass — ready to send</span>`;

        return { rows, passing, total: checks.length, issues, summary };
    }

    // -------------------------------------------------------------------------
    // RENDER — the whole console. Re-rendered wholesale on edit; cheap enough,
    // and keeps source-of-truth in `state` only.
    // -------------------------------------------------------------------------
    function mtFieldHtml(f) {
        const keys = f.composite || [f.key];
        const inputs = keys.map(k => {
            const m = FIELD_META[k] || {};
            const val = esc(state[k]);
            if (f.options) {
                const opts = f.options.map(o => `<option value="${o}"${state[k] === o ? ' selected' : ''}>${o}</option>`).join('');
                return `<select class="pg-input pg-select" data-field="${k}" onchange="Playground.set('${k}', this.value)">${opts}</select>`;
            }
            const type = m.type === 'date' ? 'date' : 'text';
            const style = m.width ? ` style="max-width:${m.width}px"` : '';
            const ml = m.maxlength ? ` maxlength="${m.maxlength}"` : '';
            const ph = m.label ? ` placeholder="${m.label}"` : '';
            const upper = m.upper ? ' data-upper="1"' : '';
            return `<input class="pg-input" type="${type}" value="${val}" data-field="${k}"${style}${ml}${ph}${upper}
                oninput="Playground.set('${k}', this.value)"
                onfocus="Playground.link('${k}', true)" onblur="Playground.link('${k}', false)"
                onmouseenter="Playground.link('${k}', true)" onmouseleave="Playground.link('${k}', false)">`;
        }).join('<span class="pg-field-sep"></span>');

        return `<div class="pg-field-row" data-field-row="${f.key || (f.composite || []).join(',')}">
            <div class="pg-field-head">
                <span class="pg-mt-tag">${f.tag}</span>
                <span class="pg-mt-label">${f.label}</span>
            </div>
            <div class="pg-field-inputs">${inputs}</div>
        </div>`;
    }

    function render() {
        const root = document.getElementById('pg-lab');
        if (!root) return;
        const v = renderChecks();

        root.innerHTML = `
            <div class="pg-lab-grid">
                <!-- SOURCE: editable MT103 -->
                <div class="pg-pane pg-pane-edit">
                    <div class="pg-pane-bar">
                        <span class="pg-dot"></span><span class="pg-dot"></span><span class="pg-dot"></span>
                        <span class="pg-pane-name">message.mt103</span>
                        <span class="pg-pane-flag is-legacy">SWIFT MT · legacy</span>
                    </div>
                    <div class="pg-fields">
                        ${MT_FIELDS.map(mtFieldHtml).join('')}
                    </div>
                </div>

                <!-- WIRE -->
                <div class="pg-lab-wire" aria-hidden="true">
                    <span class="pg-wire-arrow">→</span>
                    <span class="pg-wire-dot"></span>
                    <span class="pg-wire-dot" style="animation-delay:.5s"></span>
                    <span class="pg-wire-dot" style="animation-delay:1s"></span>
                    <span class="pg-wire-label">transform</span>
                </div>

                <!-- DEST: generated pacs.008 -->
                <div class="pg-pane pg-pane-out">
                    <div class="pg-pane-bar">
                        <span class="pg-dot"></span><span class="pg-dot"></span><span class="pg-dot"></span>
                        <span class="pg-pane-name">pacs.008.xml</span>
                        <span class="pg-pane-flag is-iso">ISO 20022</span>
                        <div class="pg-view-toggle" role="tablist">
                            <button class="pg-view-btn ${view === 'xml' ? 'is-on' : ''}" onclick="Playground.view('xml')">XML</button>
                            <button class="pg-view-btn ${view === 'plain' ? 'is-on' : ''}" onclick="Playground.view('plain')">Plain English</button>
                        </div>
                    </div>
                    <div class="pg-xml-tree" id="pg-xml">${renderXml()}</div>
                </div>
            </div>

            <!-- VALIDATION -->
            <div class="pg-valid">
                <div class="pg-valid-head">
                    <div>
                        <div class="pg-valid-title">Live validation</div>
                        <div class="pg-valid-sum">${v.summary}</div>
                    </div>
                    <div class="pg-valid-score"><span>${v.passing}</span><span class="pg-valid-score-of">/ ${v.total} clean</span></div>
                </div>
                <div class="pg-checks">${v.rows}</div>
                <div class="pg-faults">
                    <span class="pg-faults-label">What breaks →</span>
                    <button class="pg-fault-btn" onclick="Playground.fault('truncate')">Truncate the name (like MT did)</button>
                    <button class="pg-fault-btn" onclick="Playground.fault('placeholder')">Use a placeholder reference</button>
                    <button class="pg-fault-btn" onclick="Playground.fault('tz')">Drop the timezone${faultTz ? ' ✓' : ''}</button>
                    <button class="pg-fault-btn" onclick="Playground.fault('uetr')">Corrupt the UETR${faultUetr ? ' ✓' : ''}</button>
                    <button class="pg-fault-btn pg-fault-reset" onclick="Playground.fault('reset')">↺ Reset to Bob → Sweety</button>
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------------------
    // Public handlers
    // -------------------------------------------------------------------------
    function set(key, value) {
        const m = FIELD_META[key] || {};
        if (m.upper) value = value.toUpperCase();
        state[key] = value;
        // Surgical update: rebuild only the XML + validation, keep inputs (and
        // caret) untouched so typing is smooth.
        const xml = document.getElementById('pg-xml');
        if (xml) xml.innerHTML = renderXml();
        updateValidation();
        link(key, true); // keep the just-edited field's mapping lit
    }

    function updateValidation() {
        const v = renderChecks();
        const checks = document.querySelector('.pg-checks');
        const sum = document.querySelector('.pg-valid-sum');
        const score = document.querySelector('.pg-valid-score');
        if (checks) checks.innerHTML = v.rows;
        if (sum) sum.innerHTML = v.summary;
        if (score) score.innerHTML = `<span>${v.passing}</span><span class="pg-valid-score-of">/ ${v.total} clean</span>`;
    }

    function link(key, on) {
        document.querySelectorAll('.pg-xml-line[data-from], .pg-check[data-from]').forEach(el => {
            if (el.getAttribute('data-from') === key) el.classList.toggle('is-linked', !!on);
        });
        const row = document.querySelector(`.pg-field-row [data-field="${key}"]`);
        const rowEl = row && row.closest('.pg-field-row');
        if (rowEl) rowEl.classList.toggle('is-linked', !!on);
    }

    function setView(v) { view = v; render(); }

    function fault(kind) {
        if (kind === 'truncate') state.dbtrNm = 'Robert Alexander Marshall-Henderson III';
        else if (kind === 'placeholder') state.ref = 'NOTPROVIDED';
        else if (kind === 'tz') faultTz = !faultTz;
        else if (kind === 'uetr') faultUetr = !faultUetr;
        else if (kind === 'reset') { state = Object.assign({}, DEFAULTS); faultTz = false; faultUetr = false; }
        render();
    }

    function init() {
        state = Object.assign({}, DEFAULTS);
        view = 'xml';
        faultTz = false;
        faultUetr = false;
        render();
    }

    return { init, set, view: setView, link, fault };
})();

window.Playground = Playground;
function initPlayground() { Playground.init(); }
