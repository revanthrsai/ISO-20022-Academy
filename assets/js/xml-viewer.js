// =============================================================================
// PLAYGROUND TOOL · XML VIEWER  (Session 4.1)
// -----------------------------------------------------------------------------
// Standalone viewer: paste or load an ISO 20022 XML message and read it as a
// collapsible tree, with a "Plain English" toggle that renames every cryptic
// tag to a human label. Ships with one real sample from each 300-level family
// (pain · pacs · camt · head · admi) so it can be opened with nothing to paste.
//
// Self-contained: one global `XmlViewer` object + its own injected styles, so
// it can be dropped into the Playground page (or any container) without
// touching the shared stylesheet. No dependencies beyond the DOM + DOMParser.
//
// Threaded to the Library: the samples reuse the same Bob → Sweety payment
// (EndToEndId BOB-INV0042, the shared UETR) the 300/500 lessons follow, so a
// learner recognises the message they just read about.
// =============================================================================

const XmlViewer = (function () {
    // -------------------------------------------------------------------------
    // SAMPLES — one per 300-level family. Compact but well-formed and real.
    // -------------------------------------------------------------------------
    const UETR = 'eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4';

    const SAMPLES = {
        'pain.001': {
            label: 'pain.001',
            family: 'pain',
            sub: 'Customer Credit Transfer Initiation — Bob tells his bank to pay',
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>BOB-MSG-20260627-0001</MsgId>
      <CreDtTm>2026-06-27T09:28:14+04:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>400.00</CtrlSum>
      <InitgPty>
        <Nm>Bob Marsh</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>BOB-PMT-0042</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>false</BtchBookg>
      <ReqdExctnDt>
        <Dt>2026-06-27</Dt>
      </ReqdExctnDt>
      <Dbtr>
        <Nm>Bob Marsh</Nm>
        <PstlAdr>
          <StrtNm>Marina View</StrtNm>
          <TwnNm>Dubai</TwnNm>
          <Ctry>AE</Ctry>
        </PstlAdr>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>AE070331234567890123456</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BICFI>EBILAEAD</BICFI>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SHAR</ChrgBr>
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>BOB-INV0042</EndToEndId>
          <UETR>${UETR}</UETR>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="USD">400.00</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BICFI>HDFCINBB</BICFI>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>Sweety Rao</Nm>
          <PstlAdr>
            <StrtNm>MG Road</StrtNm>
            <TwnNm>Bengaluru</TwnNm>
            <Ctry>IN</Ctry>
          </PstlAdr>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>IN52HDFC0000123456789012</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>Invoice 0042 - June freelance</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`
        },

        'pacs.008': {
            label: 'pacs.008',
            family: 'pacs',
            sub: 'FI-to-FI Customer Credit Transfer — bank to bank, on the wire',
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>EBILAEAD-20260627-000400</MsgId>
      <CreDtTm>2026-06-27T09:30:00+04:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>INDA</SttlmMtd>
      </SttlmInf>
      <InstgAgt>
        <FinInstnId>
          <BICFI>EBILAEAD</BICFI>
        </FinInstnId>
      </InstgAgt>
      <InstdAgt>
        <FinInstnId>
          <BICFI>HDFCINBB</BICFI>
        </FinInstnId>
      </InstdAgt>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>EBILAEAD-INSTR-0400</InstrId>
        <EndToEndId>BOB-INV0042</EndToEndId>
        <UETR>${UETR}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="USD">400.00</IntrBkSttlmAmt>
      <IntrBkSttlmDt>2026-06-27</IntrBkSttlmDt>
      <ChrgBr>SHAR</ChrgBr>
      <Dbtr>
        <Nm>Bob Marsh</Nm>
      </Dbtr>
      <DbtrAgt>
        <FinInstnId>
          <BICFI>EBILAEAD</BICFI>
        </FinInstnId>
      </DbtrAgt>
      <CdtrAgt>
        <FinInstnId>
          <BICFI>HDFCINBB</BICFI>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>Sweety Rao</Nm>
      </Cdtr>
      <RmtInf>
        <Ustrd>Invoice 0042 - June freelance</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`
        },

        'camt.054': {
            label: 'camt.054',
            family: 'camt',
            sub: 'Bank-to-Customer Notification — Sweety\u2019s bank tells her she was paid',
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08">
  <BkToCstmrDbtCdtNtfctn>
    <GrpHdr>
      <MsgId>HDFCINBB-NTF-20260627-77</MsgId>
      <CreDtTm>2026-06-27T15:02:11+05:30</CreDtTm>
    </GrpHdr>
    <Ntfctn>
      <Id>NTF-77-0042</Id>
      <Acct>
        <Id>
          <IBAN>IN52HDFC0000123456789012</IBAN>
        </Id>
        <Ownr>
          <Nm>Sweety Rao</Nm>
        </Ownr>
      </Acct>
      <Ntry>
        <Amt Ccy="USD">400.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts>
          <Cd>BOOK</Cd>
        </Sts>
        <BookgDt>
          <DtTm>2026-06-27T15:02:00+05:30</DtTm>
        </BookgDt>
        <ValDt>
          <Dt>2026-06-27</Dt>
        </ValDt>
        <NtryDtls>
          <TxDtls>
            <Refs>
              <EndToEndId>BOB-INV0042</EndToEndId>
              <UETR>${UETR}</UETR>
            </Refs>
            <RmtInf>
              <Ustrd>Invoice 0042 - June freelance</Ustrd>
            </RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
    </Ntfctn>
  </BkToCstmrDbtCdtNtfctn>
</Document>`
        },

        'head.001': {
            label: 'head.001',
            family: 'head',
            sub: 'Business Application Header — the envelope wrapped around a message',
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<AppHdr xmlns="urn:iso:std:iso:20022:tech:xsd:head.001.001.02">
  <Fr>
    <FIId>
      <FinInstnId>
        <BICFI>EBILAEAD</BICFI>
      </FinInstnId>
    </FIId>
  </Fr>
  <To>
    <FIId>
      <FinInstnId>
        <BICFI>HDFCINBB</BICFI>
      </FinInstnId>
    </FIId>
  </To>
  <BizMsgIdr>EBILAEAD-20260627-000400</BizMsgIdr>
  <MsgDefIdr>pacs.008.001.08</MsgDefIdr>
  <BizSvc>swift.cbprplus.02</BizSvc>
  <CreDt>2026-06-27T09:30:00+04:00</CreDt>
  <Prty>NORM</Prty>
</AppHdr>`
        },

        'admi.004': {
            label: 'admi.004',
            family: 'admi',
            sub: 'System Event Notification — the network doing its housekeeping',
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:admi.004.001.02">
  <SysEvtNtfctn>
    <EvtInf>
      <EvtCd>CUSC</EvtCd>
      <EvtParam>2026-06-27</EvtParam>
      <EvtParam>17:00:00+01:00</EvtParam>
      <EvtDesc>Same-day value cut-off reached; later items value tomorrow</EvtDesc>
      <EvtTm>2026-06-27T17:00:00+01:00</EvtTm>
    </EvtInf>
  </SysEvtNtfctn>
</Document>`
        }
    };

    const SAMPLE_ORDER = ['pain.001', 'pacs.008', 'camt.054', 'head.001', 'admi.004'];

    // -------------------------------------------------------------------------
    // PLAIN-ENGLISH DICTIONARY — keyed by element localName, across families.
    // -------------------------------------------------------------------------
    const PLAIN = {
        // envelope / document
        Document: 'ISO 20022 message',
        AppHdr: 'Business Application Header (the envelope)',
        // head.001 (BAH)
        Fr: 'From',
        To: 'To',
        FIId: 'Financial institution',
        BizMsgIdr: 'Business message ID',
        MsgDefIdr: 'Which message this is',
        BizSvc: 'Business service / rulebook',
        CreDt: 'Created date',
        Prty: 'Priority',
        // group header
        GrpHdr: 'Group header — file-wide info',
        MsgId: 'Message ID — point-to-point, changes each hop',
        CreDtTm: 'Created date & time',
        NbOfTxs: 'Number of transactions',
        CtrlSum: 'Control sum — total of all amounts',
        InitgPty: 'Initiating party',
        // pain.001 payment information
        CstmrCdtTrfInitn: 'Customer credit transfer initiation',
        PmtInf: 'Payment information block',
        PmtInfId: 'Payment information ID',
        PmtMtd: 'Payment method',
        BtchBookg: 'Book as one batch?',
        ReqdExctnDt: 'Requested execution date',
        // pacs.008
        FIToFICstmrCdtTrf: 'Bank-to-bank customer credit transfer',
        SttlmInf: 'Settlement info',
        SttlmMtd: 'Settlement method',
        InstgAgt: 'Instructing agent — bank sending this',
        InstdAgt: 'Instructed agent — bank receiving this',
        IntrBkSttlmAmt: 'Interbank settlement amount',
        IntrBkSttlmDt: 'Settlement date',
        // transaction
        CdtTrfTxInf: 'The transaction itself',
        PmtId: 'Payment identifiers',
        InstrId: 'Instruction ID — this hop only',
        EndToEndId: 'End-to-end reference — unchanged the whole way',
        UETR: 'Unique tracking ID — global, every hop',
        Amt: 'Amount',
        InstdAmt: 'Instructed amount',
        EqvtAmt: 'Equivalent amount',
        ChrgBr: 'Who pays the charges',
        // parties
        Dbtr: 'Debtor — who pays (Bob)',
        Cdtr: 'Creditor — who is paid (Sweety)',
        DbtrAcct: 'Debtor account',
        CdtrAcct: 'Creditor account',
        DbtrAgt: "Debtor agent — Bob's bank",
        CdtrAgt: "Creditor agent — Sweety's bank",
        FinInstnId: 'Financial-institution ID',
        BICFI: 'Bank Identifier Code (BIC)',
        Nm: 'Name',
        Ownr: 'Account owner',
        PstlAdr: 'Postal address',
        AdrLine: 'Address line',
        StrtNm: 'Street',
        BldgNb: 'Building number',
        PstCd: 'Postcode',
        TwnNm: 'Town / city',
        Ctry: 'Country',
        Id: 'Identifier',
        IBAN: 'IBAN — international account number',
        Othr: 'Other identifier',
        // remittance
        RmtInf: 'Remittance info — what the payment is for',
        Ustrd: 'Free-text description',
        Strd: 'Structured remittance',
        // camt.054
        BkToCstmrDbtCdtNtfctn: 'Bank-to-customer debit/credit notification',
        Ntfctn: 'Notification',
        Acct: 'Account',
        Ntry: 'Entry — one line on the statement',
        CdtDbtInd: 'Credit or debit?',
        Sts: 'Status',
        Cd: 'Code',
        BookgDt: 'Booking date',
        ValDt: 'Value date',
        Dt: 'Date',
        DtTm: 'Date & time',
        NtryDtls: 'Entry details',
        TxDtls: 'Transaction details',
        Refs: 'References',
        AcctSvcrRef: "Account servicer's reference",
        // admi.004
        SysEvtNtfctn: 'System event notification',
        EvtInf: 'Event information',
        EvtCd: 'Event code',
        EvtParam: 'Event parameter',
        EvtDesc: 'Event description',
        EvtTm: 'Event time'
    };

    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    let plain = false;            // plain-English labels on?
    let activeSample = 'pacs.008';
    let parseError = null;        // last parse error message, or null
    let mountId = 'xv-root';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function source() {
        const ta = document.getElementById('xv-src');
        return ta ? ta.value : (SAMPLES[activeSample] ? SAMPLES[activeSample].xml : '');
    }

    // -------------------------------------------------------------------------
    // PARSE — DOMParser, with a real error surfaced (not a silent blank).
    // -------------------------------------------------------------------------
    function parse(text) {
        parseError = null;
        const trimmed = (text || '').trim();
        if (!trimmed) { parseError = 'Nothing to read yet — paste a message or pick a sample.'; return null; }
        let doc;
        try {
            doc = new DOMParser().parseFromString(trimmed, 'application/xml');
        } catch (e) {
            parseError = 'Could not parse: ' + e.message;
            return null;
        }
        const err = doc.querySelector('parsererror');
        if (err) {
            // Browsers stuff a human message in the <parsererror> text.
            const msg = (err.textContent || 'Malformed XML').replace(/\s+/g, ' ').trim();
            parseError = msg.length > 200 ? msg.slice(0, 200) + '…' : msg;
            return null;
        }
        if (!doc.documentElement) { parseError = 'No root element found.'; return null; }
        return doc.documentElement;
    }

    // -------------------------------------------------------------------------
    // RENDER TREE — recursive, every branch collapsible.
    // -------------------------------------------------------------------------
    function attrsHtml(el) {
        const out = [];
        for (const a of Array.from(el.attributes || [])) {
            // xmlns is noise in plain mode; keep it dimmed in raw mode.
            const isNs = a.name === 'xmlns' || a.name.indexOf('xmlns:') === 0;
            if (plain && isNs) continue;
            const cls = isNs ? 'xv-attr xv-attr-ns' : 'xv-attr';
            out.push(`<span class="${cls}"><span class="xv-attr-k">${esc(a.name)}</span>=<span class="xv-attr-v">"${esc(a.value)}"</span></span>`);
        }
        return out.length ? `<span class="xv-attrs">${out.join('')}</span>` : '';
    }

    function nameHtml(el) {
        const tag = el.localName;
        const human = PLAIN[tag];
        if (plain) {
            const label = human || tag;
            const hint = human ? `<span class="xv-rawtag">${esc(tag)}</span>` : '';
            return `<span class="xv-name xv-name-plain">${esc(label)}</span>${hint}`;
        }
        const hint = human ? `<span class="xv-hint" title="${esc(human)}">?</span>` : '';
        return `<span class="xv-name xv-tag">${esc(tag)}</span>${hint}`;
    }

    function elementChildren(el) {
        return Array.from(el.childNodes).filter(n => n.nodeType === 1);
    }

    function textValue(el) {
        // A "leaf" with text content and no element children.
        const t = (el.textContent || '').trim();
        return t;
    }

    function renderNode(el, depth) {
        const kids = elementChildren(el);
        if (kids.length === 0) {
            // leaf
            const val = textValue(el);
            const valHtml = val !== '' ? `<span class="xv-val">${esc(val)}</span>` : `<span class="xv-empty">(empty)</span>`;
            return `<div class="xv-row xv-leaf" style="--d:${depth}">
                <span class="xv-twist xv-twist-none"></span>
                <span class="xv-label">${nameHtml(el)}${attrsHtml(el)}</span>
                <span class="xv-colon">:</span>
                ${valHtml}
            </div>`;
        }
        const childHtml = kids.map(k => renderNode(k, depth + 1)).join('');
        const count = `<span class="xv-count">${kids.length}</span>`;
        return `<div class="xv-node" style="--d:${depth}">
            <div class="xv-row xv-branch" onclick="XmlViewer.toggle(this)" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();XmlViewer.toggle(this);}">
                <span class="xv-twist">▸</span>
                <span class="xv-label">${nameHtml(el)}${attrsHtml(el)}</span>
                ${count}
            </div>
            <div class="xv-children">${childHtml}</div>
        </div>`;
    }

    function renderTree(xmlText) {
        const text = xmlText != null ? xmlText : source();
        const root = parse(text);
        if (!root) {
            return `<div class="xv-error">
                <span class="xv-error-icon">!</span>
                <span class="xv-error-msg">${esc(parseError)}</span>
            </div>`;
        }
        return `<div class="xv-tree" id="xv-tree">${renderNode(root, 0)}</div>`;
    }

    // -------------------------------------------------------------------------
    // FULL RENDER
    // -------------------------------------------------------------------------
    function chipHtml(key) {
        const s = SAMPLES[key];
        const on = key === activeSample ? ' is-on' : '';
        return `<button class="xv-chip${on}" data-fam="${s.family}" onclick="XmlViewer.load('${key}')">
            <span class="xv-chip-fam">${esc(s.family)}</span>
            <span class="xv-chip-name">${esc(s.label)}</span>
        </button>`;
    }

    function render() {
        const root = document.getElementById(mountId);
        if (!root) return;
        const active = SAMPLES[activeSample];
        root.innerHTML = `
            <div class="xv-samplebar">
                <span class="xv-samplebar-label">Load a message</span>
                <div class="xv-chips">${SAMPLE_ORDER.map(chipHtml).join('')}</div>
            </div>

            <div class="xv-grid">
                <div class="xv-pane xv-pane-src">
                    <div class="xv-pane-bar">
                        <span class="xv-dot"></span><span class="xv-dot"></span><span class="xv-dot"></span>
                        <span class="xv-pane-name">source.xml</span>
                        <button class="xv-mini" onclick="XmlViewer.clear()" title="Clear">clear</button>
                    </div>
                    <textarea id="xv-src" class="xv-src" spellcheck="false"
                        oninput="XmlViewer.onInput()"
                        placeholder="Paste any ISO 20022 XML here…">${esc(active ? active.xml : '')}</textarea>
                    <div class="xv-src-meta">${active ? `<span class="xv-src-sub">${esc(active.sub)}</span>` : '<span class="xv-src-sub">Pasted message</span>'}</div>
                </div>

                <div class="xv-pane xv-pane-tree">
                    <div class="xv-pane-bar">
                        <span class="xv-pane-name">readable tree</span>
                        <div class="xv-tools">
                            <button class="xv-mini" onclick="XmlViewer.expandAll(true)">expand all</button>
                            <button class="xv-mini" onclick="XmlViewer.expandAll(false)">collapse all</button>
                            <div class="xv-toggle" role="tablist">
                                <button class="xv-toggle-btn ${!plain ? 'is-on' : ''}" onclick="XmlViewer.setPlain(false)">Tags</button>
                                <button class="xv-toggle-btn ${plain ? 'is-on' : ''}" onclick="XmlViewer.setPlain(true)">Plain English</button>
                            </div>
                        </div>
                    </div>
                    <div class="xv-treewrap" id="xv-treewrap">${renderTree(active ? active.xml : '')}</div>
                </div>
            </div>
        `;
    }

    // Re-render only the tree pane (keeps the textarea + caret untouched).
    // Reads the live textarea, which is settled by the time this is called.
    function refreshTree() {
        const wrap = document.getElementById('xv-treewrap');
        const ta = document.getElementById('xv-src');
        if (wrap) wrap.innerHTML = renderTree(ta ? ta.value : '');
    }

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------
    function load(key) {
        if (!SAMPLES[key]) return;
        activeSample = key;
        render();
    }

    function onInput() {
        // Typing/pasting means it's no longer one of the named samples.
        activeSample = null;
        const meta = document.querySelector('.xv-src-sub');
        if (meta) meta.textContent = 'Pasted message';
        document.querySelectorAll('.xv-chip').forEach(c => c.classList.remove('is-on'));
        refreshTree();
    }

    function clear() {
        const ta = document.getElementById('xv-src');
        if (ta) { ta.value = ''; ta.focus(); }
        onInput();
    }

    function setPlain(v) {
        plain = !!v;
        const btns = document.querySelectorAll('.xv-toggle-btn');
        if (btns[0]) btns[0].classList.toggle('is-on', !plain);
        if (btns[1]) btns[1].classList.toggle('is-on', plain);
        refreshTree();
    }

    function toggle(rowEl) {
        const node = rowEl.closest('.xv-node');
        if (node) node.classList.toggle('is-collapsed');
    }

    function expandAll(open) {
        document.querySelectorAll('#xv-tree .xv-node').forEach(n => {
            n.classList.toggle('is-collapsed', !open);
        });
    }

    // -------------------------------------------------------------------------
    // STYLES — injected once, theme-aware (reads the global CSS variables).
    // -------------------------------------------------------------------------
    function injectStyles() {
        if (document.getElementById('xv-styles')) return;
        const css = `
        .xv { display: flex; flex-direction: column; gap: 18px; }
        .xv-samplebar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .xv-samplebar-label {
            font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em;
            text-transform: uppercase; color: var(--text-faint);
        }
        .xv-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .xv-chip {
            display: inline-flex; align-items: baseline; gap: 7px;
            padding: 7px 13px; border-radius: var(--radius-pill);
            background: var(--surface); border: 1px solid var(--border);
            color: var(--text-muted); cursor: pointer; font-family: var(--font-mono);
            transition: border-color var(--dur-fast) var(--ease-out),
                        color var(--dur-fast) var(--ease-out),
                        background var(--dur-fast) var(--ease-out);
        }
        .xv-chip:hover { border-color: var(--border-hi); color: var(--text); }
        .xv-chip.is-on { border-color: var(--primary-deep); background: var(--glass-tint-strong); color: var(--text); }
        .xv-chip-fam { font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--primary); }
        .xv-chip.is-on .xv-chip-fam { color: var(--primary-bright); }
        .xv-chip-name { font-size: 12.5px; font-weight: 600; }

        .xv-grid { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 18px; }
        @media (max-width: 880px) { .xv-grid { grid-template-columns: 1fr; } }

        .xv-pane {
            display: flex; flex-direction: column; min-width: 0;
            background: var(--surface); border: 1px solid var(--border);
            border-radius: var(--radius-md); overflow: hidden;
        }
        .xv-pane-bar {
            display: flex; align-items: center; gap: 7px;
            padding: 11px 14px; border-bottom: 1px solid var(--border);
            background: var(--bg-deep);
        }
        .xv-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--border-hi); }
        .xv-pane-name {
            margin-left: 6px; font-family: var(--font-mono); font-size: 12px;
            color: var(--text-faint); letter-spacing: 0.02em;
        }
        .xv-tools { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .xv-mini {
            background: transparent; border: 1px solid var(--border); color: var(--text-muted);
            font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.03em;
            padding: 4px 9px; border-radius: var(--radius-xs); cursor: pointer;
            transition: border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }
        .xv-mini:hover { border-color: var(--border-hi); color: var(--text); }

        .xv-src {
            flex: 1; min-height: 360px; resize: vertical; border: 0; outline: 0;
            padding: 16px; background: transparent; color: var(--primary-bright);
            font-family: var(--font-mono); font-size: 12.5px; line-height: 1.6;
            white-space: pre; tab-size: 2;
        }
        .xv-src-meta { padding: 9px 14px; border-top: 1px solid var(--border); background: var(--bg-deep); }
        .xv-src-sub { font-family: var(--font-mono); font-size: 11px; color: var(--text-faint); letter-spacing: 0.02em; }

        .xv-toggle { display: inline-flex; background: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-pill); padding: 2px; }
        .xv-toggle-btn {
            background: transparent; border: 0; cursor: pointer; color: var(--text-faint);
            font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.02em;
            padding: 4px 11px; border-radius: var(--radius-pill);
            transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }
        .xv-toggle-btn.is-on { background: var(--primary); color: #04130D; font-weight: 600; }

        .xv-treewrap { flex: 1; min-height: 360px; max-height: 620px; overflow: auto; padding: 14px 14px 18px; }
        .xv-tree { font-family: var(--font-mono); font-size: 12.5px; line-height: 1.5; }

        .xv-row {
            display: flex; align-items: baseline; gap: 7px;
            padding: 2.5px 6px; padding-left: calc(6px + var(--d) * 18px);
            border-radius: var(--radius-xs);
        }
        .xv-branch { cursor: pointer; }
        .xv-branch:hover { background: var(--surface-alt); }
        .xv-branch:focus-visible { outline: none; box-shadow: var(--ring); }
        .xv-twist {
            flex-shrink: 0; width: 12px; color: var(--text-faint); font-size: 10px;
            transition: transform var(--dur-fast) var(--ease-out); transform: rotate(90deg);
            line-height: 1.5;
        }
        .xv-twist-none { visibility: hidden; }
        .xv-node.is-collapsed > .xv-branch > .xv-twist { transform: rotate(0deg); }
        .xv-node.is-collapsed > .xv-children { display: none; }

        .xv-label { flex-shrink: 0; }
        .xv-name { font-weight: 600; }
        .xv-tag { color: var(--primary-bright); }
        .xv-name-plain { color: var(--text); }
        .xv-rawtag {
            margin-left: 7px; font-size: 10px; color: var(--primary); opacity: 0.7;
            font-weight: 500; letter-spacing: 0.02em;
        }
        .xv-hint {
            display: inline-flex; align-items: center; justify-content: center;
            width: 13px; height: 13px; margin-left: 6px; border-radius: 50%;
            background: var(--surface-hi); color: var(--text-faint);
            font-size: 9px; font-weight: 700; cursor: help; vertical-align: middle;
        }
        .xv-hint:hover { color: var(--primary-bright); }
        .xv-count {
            font-size: 10px; color: var(--text-faint); background: var(--surface-alt);
            border-radius: var(--radius-pill); padding: 1px 7px; line-height: 1.4;
        }
        .xv-colon { color: var(--text-faint); }
        .xv-val { color: var(--text); word-break: break-word; }
        .xv-empty { color: var(--text-faint); font-style: italic; }
        .xv-attrs { margin-left: 8px; }
        .xv-attr { font-size: 11px; margin-left: 6px; }
        .xv-attr-k { color: var(--warning); }
        .xv-attr-v { color: var(--text-muted); }
        .xv-attr-ns { opacity: 0.45; }

        .xv-error {
            display: flex; align-items: flex-start; gap: 11px; padding: 18px;
            border: 1px dashed var(--danger); border-radius: var(--radius-sm);
            background: rgba(241, 112, 122, 0.06); color: var(--text-muted);
        }
        .xv-error-icon {
            flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            background: var(--danger); color: #fff; font-weight: 700; font-size: 12px;
        }
        .xv-error-msg { font-family: var(--font-mono); font-size: 12.5px; line-height: 1.6; }

        /* Playground tool switcher (shared chrome for the tool panels) */
        .pg-tools {
            display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
            margin: 34px 0 22px; padding-bottom: 14px; border-bottom: 1px solid var(--border);
        }
        .pg-tool-tab {
            display: flex; flex-direction: column; gap: 1px; text-align: left;
            padding: 9px 16px; border-radius: var(--radius-sm);
            background: var(--surface); border: 1px solid var(--border);
            color: var(--text-muted); cursor: pointer;
            transition: border-color var(--dur-fast) var(--ease-out),
                        background var(--dur-fast) var(--ease-out),
                        color var(--dur-fast) var(--ease-out);
        }
        .pg-tool-tab:hover { border-color: var(--border-hi); color: var(--text); }
        .pg-tool-tab.is-on { border-color: var(--primary-deep); background: var(--glass-tint-strong); color: var(--text); }
        .pg-tool-tab-name { font-family: var(--font-display); font-weight: 700; font-size: 15px; }
        .pg-tool-tab-sub { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.03em; color: var(--text-faint); }
        .pg-tool-tab.is-on .pg-tool-tab-sub { color: var(--primary); }
        .pg-tool-soon {
            margin-left: auto; font-family: var(--font-mono); font-size: 10.5px;
            letter-spacing: 0.04em; color: var(--text-faint);
        }
        @media (max-width: 640px) { .pg-tool-soon { display: none; } }
        .pg-tool-intro {
            max-width: 70ch; margin: 0 0 22px; color: var(--text-muted);
            font-size: var(--fs-body); line-height: 1.7;
        }
        .pg-tool-intro strong { color: var(--text); font-weight: 600; }
        `;
        const style = document.createElement('style');
        style.id = 'xv-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // -------------------------------------------------------------------------
    // INIT — call after the mount container exists.
    // -------------------------------------------------------------------------
    function init(id) {
        mountId = id || 'xv-root';
        plain = false;
        if (!activeSample) activeSample = 'pacs.008';
        injectStyles();
        render();
    }

    return { init, load, onInput, clear, setPlain, toggle, expandAll };
})();

window.XmlViewer = XmlViewer;
