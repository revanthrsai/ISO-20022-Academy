// =============================================================================
// PLAYGROUND TOOL · MESSAGE COMPARATOR  (Session 4.4)
// -----------------------------------------------------------------------------
// Side-by-side diff of two ISO 20022 messages — but a *field-level* diff, not a
// raw text diff. Both messages are parsed into a flat map of structural paths
// (element tree position + attributes, namespace-agnostic), then the two maps
// are aligned by path. Every difference is reported as one of:
//
//   changed  — same field exists in both, value (or attribute) differs
//   added    — field present in B only
//   removed  — field present in A only
//   identical— same field, same value (hidden by default)
//
// Because the diff keys on the document tree rather than line numbers, a
// reordered or reformatted message produces zero false differences, and a
// renamed/added element is reported against its real path — the thing a learner
// actually needs to see (e.g. "ChrgBr changed SHAR → DEBT", not "line 24 differs").
//
// Self-contained: one global `MsgComparator` object + its own injected styles,
// theme-aware via the shared CSS variables. No dependencies beyond DOMParser.
//
// Threaded to the Library: every pair is a variation of the Bob → Sweety
// pacs.008 (EndToEndId BOB-INV0042, the shared UETR), so the diffs land on a
// message the learner already knows from the 300/500 lessons.
// =============================================================================

const MsgComparator = (function () {
    const UETR = 'eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4';

    // -------------------------------------------------------------------------
    // SAMPLE BUILDERS
    // -------------------------------------------------------------------------
    function pacs008(over) {
        over = over || {};
        const d = {
            ns: 'urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08',
            msgId: 'EBILAEAD-20260627-000400',
            instgBic: 'EBILAEAD',
            instdBic: 'HDFCINBB',
            dbtrAgtBic: 'EBILAEAD',
            cdtrAgtBic: 'HDFCINBB',
            e2e: 'BOB-INV0042',
            uetr: UETR,
            amt: '400.00',
            ccy: 'USD',
            chrgBr: 'SHAR',
            chrgsInf: '',
            dbtr: 'Bob Marsh',
            cdtr: 'Sweety Rao',
            cdtrIban: 'IN46HDFC0000123456789012',
            ustrd: 'Invoice 0042 - June freelance',
            sttlmDt: '2026-06-27'
        };
        Object.assign(d, over);
        return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="${d.ns}">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${d.msgId}</MsgId>
      <CreDtTm>2026-06-27T09:30:00+04:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>INDA</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>${d.e2e}</EndToEndId>
        <UETR>${d.uetr}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="${d.ccy}">${d.amt}</IntrBkSttlmAmt>
      <IntrBkSttlmDt>${d.sttlmDt}</IntrBkSttlmDt>
      <ChrgBr>${d.chrgBr}</ChrgBr>${d.chrgsInf}
      <Dbtr>
        <Nm>${d.dbtr}</Nm>
      </Dbtr>
      <DbtrAgt>
        <FinInstnId>
          <BICFI>${d.dbtrAgtBic}</BICFI>
        </FinInstnId>
      </DbtrAgt>
      <CdtrAgt>
        <FinInstnId>
          <BICFI>${d.cdtrAgtBic}</BICFI>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>${d.cdtr}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${d.cdtrIban}</IBAN>
        </Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>${d.ustrd}</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
    }

    // A pacs.004 Payment Return — same payment coming back. Debtor/creditor
    // swap roles, the original reference is carried, a return reason is added.
    function pacs004() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.004.001.09">
  <PmtRtr>
    <GrpHdr>
      <MsgId>HDFCINBB-20260628-RTR042</MsgId>
      <CreDtTm>2026-06-28T11:05:00+05:30</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>INDA</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <TxInf>
      <RtrId>HDFCINBB-RTR-0042</RtrId>
      <OrgnlEndToEndId>BOB-INV0042</OrgnlEndToEndId>
      <OrgnlUETR>${UETR}</OrgnlUETR>
      <RtrdIntrBkSttlmAmt Ccy="USD">400.00</RtrdIntrBkSttlmAmt>
      <IntrBkSttlmDt>2026-06-28</IntrBkSttlmDt>
      <RtrRsnInf>
        <Rsn>
          <Cd>AC04</Cd>
        </Rsn>
        <AddtlInf>Closed account - funds returned</AddtlInf>
      </RtrRsnInf>
      <RtrChain>
        <Dbtr>
          <Nm>Sweety Rao</Nm>
        </Dbtr>
        <Cdtr>
          <Nm>Bob Marsh</Nm>
        </Cdtr>
      </RtrChain>
    </TxInf>
  </PmtRtr>
</Document>`;
    }

    const CHRGS = `
      <ChrgsInf>
        <Amt Ccy="USD">5.00</Amt>
        <Agt>
          <FinInstnId>
            <BICFI>HDFCINBB</BICFI>
          </FinInstnId>
        </Agt>
      </ChrgsInf>`;

    // -------------------------------------------------------------------------
    // PAIRS — each is a real before/after a learner would actually meet.
    // -------------------------------------------------------------------------
    const PAIRS = {
        amount: {
            label: 'Amount corrected',
            sub: 'Same pacs.008 — the invoice grew, so the amount and remittance were re-issued',
            aLabel: 'Original · $400',
            bLabel: 'Corrected · $450',
            a: pacs008(),
            b: pacs008({ amt: '450.00', ustrd: 'Invoice 0042 - June freelance + expenses' })
        },
        charges: {
            label: 'Charges renegotiated',
            sub: 'Charge bearer moved SHAR → DEBT, and an explicit charges block was added',
            aLabel: 'Shared charges',
            bLabel: 'Debtor pays',
            a: pacs008(),
            b: pacs008({ chrgBr: 'DEBT', chrgsInf: CHRGS })
        },
        version: {
            label: 'Version upgrade',
            sub: 'Identical payment, re-stamped from pacs.008.001.08 to .09 — only the namespace moves',
            aLabel: '.001.08',
            bLabel: '.001.09',
            a: pacs008(),
            b: pacs008({ ns: 'urn:iso:std:iso:20022:tech:xsd:pacs.008.001.09' })
        },
        rerouted: {
            label: 'Creditor re-routed',
            sub: 'Same debtor, new beneficiary bank — name, BIC and IBAN all change together',
            aLabel: 'To HDFC',
            bLabel: 'To ICICI',
            a: pacs008(),
            b: pacs008({ cdtr: 'Sweety Rao', cdtrAgtBic: 'ICICINBB', instdBic: 'ICICINBB', cdtrIban: 'IN82ICIC0000456712340987' })
        },
        returned: {
            label: 'Sent vs returned',
            sub: 'The pacs.008 that went out vs the pacs.004 that came back — a real structural diff',
            aLabel: 'pacs.008 sent',
            bLabel: 'pacs.004 return',
            a: pacs008(),
            b: pacs004()
        }
    };

    const PAIR_ORDER = ['amount', 'charges', 'version', 'rerouted', 'returned'];

    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    let activePair = 'amount';
    let showSame = true;   // WinMerge-style: identical lines visible (dimmed) so
                           // differences appear in their real document position.
    let mountId = 'cmp-root';
    let editing = false;                 // false → aligned A/B diff panes; true → paste boxes
    let srcA = PAIRS[activePair] ? PAIRS[activePair].a : '';
    let srcB = PAIRS[activePair] ? PAIRS[activePair].b : '';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function valA() { const el = document.getElementById('cmp-a'); return el ? el.value : srcA; }
    function valB() { const el = document.getElementById('cmp-b'); return el ? el.value : srcB; }

    // -------------------------------------------------------------------------
    // FLATTEN — parse XML into an ordered map of structural path -> value.
    // Leaves contribute their text; every element contributes its attributes
    // (as "<path> @attr"). Repeated siblings are indexed ([1],[2]) so a real
    // structural position is the key, never a line number.
    // -------------------------------------------------------------------------
    function flatten(root) {
        const entries = []; // preserve document order
        const seenKeys = new Set();
        const push = (key, val) => {
            // de-dupe defensively; first occurrence wins document order
            if (!seenKeys.has(key)) { seenKeys.add(key); entries.push({ key, val }); }
        };

        function walk(el, path) {
            // attributes (skip the default xmlns noise on every node except root,
            // where the namespace genuinely identifies the message version)
            for (const attr of el.attributes) {
                if (attr.name === 'xmlns' && el !== root) continue;
                push(path + ' @' + attr.name, attr.value);
            }
            const kids = Array.from(el.children);
            if (kids.length === 0) {
                push(path, (el.textContent || '').trim());
                return;
            }
            const total = {};
            kids.forEach(c => { total[c.localName] = (total[c.localName] || 0) + 1; });
            const seen = {};
            for (const c of kids) {
                const ln = c.localName;
                seen[ln] = (seen[ln] || 0) + 1;
                const seg = total[ln] > 1 ? ln + '[' + seen[ln] + ']' : ln;
                walk(c, path ? path + '/' + seg : seg);
            }
        }
        walk(root, root.localName);

        const map = new Map();
        entries.forEach(e => map.set(e.key, e.val));
        return { map, order: entries.map(e => e.key) };
    }

    function parse(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return { error: 'empty', doc: null };
        const doc = new DOMParser().parseFromString(trimmed, 'application/xml');
        const perr = doc.querySelector('parsererror');
        if (perr) {
            const msg = (perr.textContent || 'Malformed XML').replace(/\s+/g, ' ').trim();
            return { error: msg.length > 200 ? msg.slice(0, 200) + '…' : msg, doc: null };
        }
        if (!doc.documentElement) return { error: 'No root element.', doc: null };
        return { error: null, doc };
    }

    // -------------------------------------------------------------------------
    // DIFF — align two flattened maps by path.
    // -------------------------------------------------------------------------
    function diff(a, b) {
        const rows = [];
        const fa = flatten(a);
        const fb = flatten(b);
        const counts = { changed: 0, added: 0, removed: 0, same: 0 };

        // A's keys in document order: identical | changed | removed
        for (const key of fa.order) {
            const va = fa.map.get(key);
            if (fb.map.has(key)) {
                const vb = fb.map.get(key);
                if (va === vb) { rows.push({ status: 'same', key, a: va, b: vb }); counts.same++; }
                else { rows.push({ status: 'changed', key, a: va, b: vb }); counts.changed++; }
            } else {
                rows.push({ status: 'removed', key, a: va, b: null }); counts.removed++;
            }
        }
        // B-only keys, in B's document order: added
        for (const key of fb.order) {
            if (!fa.map.has(key)) { rows.push({ status: 'added', key, a: null, b: fb.map.get(key) }); counts.added++; }
        }
        return { rows, counts };
    }

    // Split a path key into { field, trail } for display.
    function nameOf(key) {
        // attribute keys: "path @attr"
        const at = key.indexOf(' @');
        if (at !== -1) {
            const base = key.slice(0, at);
            const attr = key.slice(at + 2);
            const segs = base.split('/');
            return { field: '@' + attr, trail: segs.join(' › ') };
        }
        const segs = key.split('/');
        const field = segs[segs.length - 1];
        return { field, trail: segs.slice(0, -1).join(' › ') };
    }

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    // One aligned diff line, WinMerge-style: the field rendered as a document
    // line on each side, full-row tint by status, identical lines dimmed.
    // Hover a line to see its full structural path (title attribute).
    function rowHtml(r) {
        if (r.status === 'same' && !showSame) return '';
        const nm = nameOf(r.key);
        const isAttr = nm.field.charAt(0) === '@';
        const depth = r.key.split('/').length - 1 + (isAttr ? 1 : 0);
        const pad = `padding-left:${10 + depth * 13}px`;
        const line = (v) => isAttr
            ? `<span class="cmp-ln-tag">${esc(nm.field)}</span><span class="cmp-ln-eq">=</span><span class="cmp-ln-val">"${esc(v)}"</span>`
            : `<span class="cmp-ln-tag">&lt;${esc(nm.field)}&gt;</span><span class="cmp-ln-val">${esc(v) || '<em>(empty)</em>'}</span><span class="cmp-ln-tag">&lt;/${esc(nm.field)}&gt;</span>`;
        const mark = { changed: '&#8800;', added: '+', removed: '&minus;', same: '' }[r.status];
        return `<div class="cmp-line cmp-${r.status}" title="${esc(r.key)}">
            <div class="cmp-cell cmp-cell-a" style="${pad}">${r.a == null ? '' : line(r.a)}</div>
            <div class="cmp-gutter">${mark}</div>
            <div class="cmp-cell cmp-cell-b" style="${pad}">${r.b == null ? '' : line(r.b)}</div>
        </div>`;
    }

    function reportHtml() {
        const pa = parse(valA());
        const pb = parse(valB());

        if (pa.error || pb.error) {
            const which = [];
            if (pa.error) which.push('A');
            if (pb.error) which.push('B');
            const msg = pa.error && pa.error !== 'empty' ? pa.error : (pb.error && pb.error !== 'empty' ? pb.error : null);
            return `<div class="cmp-verdict cmp-verdict-fail">
                <span class="cmp-verdict-badge">XML</span>
                <div class="cmp-verdict-body">
                    <div class="cmp-verdict-title">Message ${which.join(' &amp; ')} ${which.length > 1 ? "won't parse" : "won't parse"}</div>
                    <div class="cmp-verdict-sub">${msg ? esc(msg) : 'Paste a message into each side to compare.'}</div>
                </div>
            </div>`;
        }

        const { rows, counts } = diff(pa.doc.documentElement, pb.doc.documentElement);
        const totalDiff = counts.changed + counts.added + counts.removed;

        let verdict;
        if (totalDiff === 0) {
            verdict = `<div class="cmp-verdict cmp-verdict-pass">
                <span class="cmp-verdict-badge">=</span>
                <div class="cmp-verdict-body">
                    <div class="cmp-verdict-title">Field-for-field identical</div>
                    <div class="cmp-verdict-sub">Every one of the ${counts.same} fields matches — even if the formatting or ordering differs, the meaning is the same.</div>
                </div>
            </div>`;
        } else {
            const bits = [];
            if (counts.changed) bits.push(`<span class="cmp-tally cmp-t-changed">${counts.changed} changed</span>`);
            if (counts.added) bits.push(`<span class="cmp-tally cmp-t-added">${counts.added} added</span>`);
            if (counts.removed) bits.push(`<span class="cmp-tally cmp-t-removed">${counts.removed} removed</span>`);
            verdict = `<div class="cmp-verdict cmp-verdict-diff">
                <span class="cmp-verdict-badge">${totalDiff}</span>
                <div class="cmp-verdict-body">
                    <div class="cmp-verdict-title">${totalDiff} field-level difference${totalDiff === 1 ? '' : 's'}</div>
                    <div class="cmp-verdict-tallies">${bits.join('')}<span class="cmp-tally cmp-t-same">${counts.same} identical</span></div>
                </div>
            </div>`;
        }

        const body = rows.map(rowHtml).join('');
        const hasHidden = counts.same > 0;
        const toggle = hasHidden
            ? `<button class="cmp-toggle${showSame ? ' is-on' : ''}" onclick="MsgComparator.toggleSame()">
                 ${showSame ? 'Hide' : 'Show'} ${counts.same} identical field${counts.same === 1 ? '' : 's'}
               </button>`
            : '';

        const aLbl = 'Original' + (PAIRS[activePair] && PAIRS[activePair].aLabel ? ' · ' + PAIRS[activePair].aLabel : '');
        const bLbl = 'Corrected' + (PAIRS[activePair] && PAIRS[activePair].bLabel ? ' · ' + PAIRS[activePair].bLabel : '');
        const colhead = `<div class="cmp-colhead">
            <span class="cmp-colhead-a"><span class="cmp-side-tag cmp-tag-a">A</span> ${esc(aLbl)}</span>
            <span></span>
            <span class="cmp-colhead-b"><span class="cmp-side-tag cmp-tag-b">B</span> ${esc(bLbl)}</span>
        </div>`;

        return verdict + colhead + (body ? `<div class="cmp-diffview">${body}</div>` : '<p class="cmp-hint">No differences to show.</p>') + toggle;
    }

    function chipHtml(key) {
        const p = PAIRS[key];
        const on = key === activePair ? ' is-on' : '';
        return `<button class="cmp-chip${on}" onclick="MsgComparator.load('${key}')">
            <span class="cmp-chip-name">${esc(p.label)}</span>
        </button>`;
    }

    function render() {
        const root = document.getElementById(mountId);
        if (!root) return;
        const p = PAIRS[activePair];
        const editView = `
            <div class="cmp-grid">
                <div class="cmp-pane">
                    <div class="cmp-pane-bar">
                        <span class="cmp-side-tag cmp-tag-a">A</span>
                        <span class="cmp-pane-name">Original${p && p.aLabel ? ' · ' + esc(p.aLabel) : ''}</span>
                    </div>
                    <textarea id="cmp-a" class="cmp-src" spellcheck="false"
                        oninput="MsgComparator.onEdit()"
                        placeholder="Paste the original message…">${esc(srcA)}</textarea>
                </div>
                <div class="cmp-pane">
                    <div class="cmp-pane-bar">
                        <span class="cmp-side-tag cmp-tag-b">B</span>
                        <span class="cmp-pane-name">Corrected${p && p.bLabel ? ' · ' + esc(p.bLabel) : ''}</span>
                    </div>
                    <textarea id="cmp-b" class="cmp-src" spellcheck="false"
                        oninput="MsgComparator.onEdit()"
                        placeholder="Paste the corrected message…">${esc(srcB)}</textarea>
                </div>
            </div>`;
        root.innerHTML = `
            <div class="cmp-samplebar">
                <span class="cmp-samplebar-label">Compare a pair</span>
                <div class="cmp-chips">${PAIR_ORDER.map(chipHtml).join('')}</div>
            </div>
            ${p ? `<p class="cmp-pair-sub">${esc(p.sub)}</p>` : ''}
            <div class="cmp-modebar">
                <span class="cmp-mode-hint">${editing ? 'Edit or paste each message, then Compare.' : 'Differences show in the A (Original) vs B (Corrected) panes below.'}</span>
                <button class="cmp-editbtn" onclick="MsgComparator.toggleEdit()">${editing ? 'Compare &rarr;' : 'Edit messages'}</button>
            </div>
            ${editing ? editView : `<div class="cmp-reportwrap" id="cmp-reportwrap">${reportHtml()}</div>`}
        `;
    }

    function refreshReport() {
        const wrap = document.getElementById('cmp-reportwrap');
        if (wrap) wrap.innerHTML = reportHtml();
    }

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------
    function load(key) {
        if (!PAIRS[key]) return;
        activePair = key;
        srcA = PAIRS[key].a; srcB = PAIRS[key].b;
        showSame = true; editing = false;
        render();
    }

    function onEdit() {
        const a = document.getElementById('cmp-a'); if (a) srcA = a.value;
        const b = document.getElementById('cmp-b'); if (b) srcB = b.value;
    }
    function onInput() { onEdit(); }
    function toggleEdit() {
        if (editing) onEdit();
        editing = !editing;
        render();
    }

    // Workspace handoff (Session 4.6) — a message arriving from another tool lands
    // in A (Original) and leaves B free to diff against.
    function getXml() { return valA(); }
    function loadXml(xml) {
        srcA = xml || ''; activePair = null;
        editing = !(srcA.trim() && (srcB || '').trim());
        render();
    }

    function toggleSame() {
        showSame = !showSame;
        refreshReport();
    }

    // -------------------------------------------------------------------------
    // STYLES — injected once, theme-aware.
    // -------------------------------------------------------------------------
    function injectStyles() {
        if (document.getElementById('cmp-styles')) return;
        const css = `
        .cmp { display: flex; flex-direction: column; gap: 16px; }
        .cmp-modebar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .cmp-mode-hint { font-size: 12.5px; color: var(--text-muted); }
        .cmp-editbtn {
            margin-left: auto; font-family: var(--font-mono); font-size: 12px; cursor: pointer;
            padding: 7px 14px; border-radius: var(--radius-md);
            border: 1px solid var(--border); background: transparent; color: var(--text-muted);
        }
        .cmp-editbtn:hover { color: var(--text); border-color: var(--border-hi); }
        .cmp-samplebar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .cmp-samplebar-label {
            font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em;
            text-transform: uppercase; color: var(--text-faint);
        }
        .cmp-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .cmp-chip {
            display: inline-flex; align-items: center;
            padding: 7px 14px; border-radius: var(--radius-pill);
            background: var(--surface); border: 1px solid var(--border);
            color: var(--text-muted); cursor: pointer; font-family: var(--font-mono);
            transition: border-color var(--dur-fast) var(--ease-out),
                        color var(--dur-fast) var(--ease-out),
                        background var(--dur-fast) var(--ease-out);
        }
        .cmp-chip:hover { border-color: var(--border-hi); color: var(--text); }
        .cmp-chip-name { font-size: 12.5px; font-weight: 600; }
        .cmp-chip.is-on { border-color: var(--primary-deep); background: var(--glass-tint-strong); color: var(--text); }
        .cmp-pair-sub { margin: -4px 0 0; font-size: 13px; line-height: 1.5; color: var(--text-muted); }

        .cmp-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; }
        @media (max-width: 880px) { .cmp-grid { grid-template-columns: 1fr; } }

        .cmp-pane {
            display: flex; flex-direction: column; min-width: 0;
            background: var(--surface); border: 1px solid var(--border);
            border-radius: var(--radius-md); overflow: hidden;
        }
        .cmp-pane-bar {
            display: flex; align-items: center; gap: 9px;
            padding: 10px 14px; border-bottom: 1px solid var(--border);
            background: var(--bg-deep);
        }
        .cmp-side-tag {
            display: inline-flex; align-items: center; justify-content: center;
            width: 20px; height: 20px; border-radius: var(--radius-xs);
            font-family: var(--font-display); font-weight: 800; font-size: 12px;
        }
        .cmp-tag-a { background: var(--glass-tint-strong); color: var(--primary-bright); border: 1px solid var(--primary-deep); }
        .cmp-tag-b { background: rgba(227, 179, 65, 0.14); color: var(--warning, #e3b341); border: 1px solid var(--warning, #e3b341); }
        .cmp-pane-name {
            font-family: var(--font-mono); font-size: 12px;
            color: var(--text-faint); letter-spacing: 0.02em;
        }
        .cmp-src {
            flex: 1; min-height: 300px; resize: vertical; border: 0; outline: 0;
            padding: 14px; background: transparent; color: var(--primary-bright);
            font-family: var(--font-mono); font-size: 12px; line-height: 1.6;
            white-space: pre; tab-size: 2;
        }

        .cmp-report-head {
            display: flex; align-items: center; gap: 10px;
            padding-top: 4px;
        }
        .cmp-report-title {
            font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--text);
        }
        .cmp-live {
            margin-left: auto; display: inline-flex; align-items: center; gap: 6px;
            font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em;
            text-transform: uppercase; color: var(--primary);
        }
        .cmp-live::before {
            content: ''; width: 6px; height: 6px; border-radius: 50%;
            background: var(--primary); box-shadow: 0 0 0 0 var(--primary);
            animation: cmp-pulse 2s var(--ease-out) infinite;
        }
        @keyframes cmp-pulse {
            0% { box-shadow: 0 0 0 0 rgba(80, 200, 150, 0.5); }
            70% { box-shadow: 0 0 0 6px rgba(80, 200, 150, 0); }
            100% { box-shadow: 0 0 0 0 rgba(80, 200, 150, 0); }
        }

        .cmp-reportwrap {
            background: var(--surface); border: 1px solid var(--border);
            border-radius: var(--radius-md); padding: 16px;
            display: flex; flex-direction: column; gap: 12px;
        }

        .cmp-verdict {
            display: flex; align-items: center; gap: 14px; padding: 14px 16px;
            border-radius: var(--radius-sm); border: 1px solid var(--border);
        }
        .cmp-verdict-pass { border-color: var(--success, #4ad6a0); background: rgba(74, 214, 160, 0.07); }
        .cmp-verdict-diff { border-color: var(--primary-deep); background: var(--glass-tint); }
        .cmp-verdict-fail { border-color: var(--danger, #f1707a); background: rgba(241, 112, 122, 0.07); }
        .cmp-verdict-badge {
            flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-family: var(--font-display); font-weight: 800; font-size: 16px; color: #FFFFFF;
        }
        .cmp-verdict-pass .cmp-verdict-badge { background: var(--success, #4ad6a0); }
        .cmp-verdict-diff .cmp-verdict-badge { background: var(--primary); }
        .cmp-verdict-fail .cmp-verdict-badge { background: var(--danger, #C13543); color: #FFFFFF; }
        .cmp-verdict-title { font-family: var(--font-display); font-weight: 700; font-size: 15.5px; color: var(--text); }
        .cmp-verdict-sub { margin-top: 3px; font-size: 12.5px; line-height: 1.5; color: var(--text-muted); }
        .cmp-verdict-tallies { margin-top: 6px; display: flex; gap: 8px; flex-wrap: wrap; }
        .cmp-tally {
            font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.02em;
            padding: 2px 9px; border-radius: var(--radius-pill); font-weight: 600;
            border: 1px solid var(--border);
        }
        .cmp-t-changed { color: var(--warning, #e3b341); border-color: rgba(227, 179, 65, 0.4); }
        .cmp-t-added { color: var(--success, #4ad6a0); border-color: rgba(74, 214, 160, 0.4); }
        .cmp-t-removed { color: var(--danger, #f1707a); border-color: rgba(241, 112, 122, 0.4); }
        .cmp-t-same { color: var(--text-faint); }

        .cmp-colhead {
            display: grid; grid-template-columns: 1fr 26px 1fr; gap: 10px;
            padding: 0 13px; align-items: center;
        }
        .cmp-colhead span { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-faint); }
        .cmp-colhead-b { text-align: right; }

        /* WinMerge-style aligned diff: two document columns + a marker gutter.
           Full-line tints; identical lines dimmed; hover shows the full path. */
        .cmp-diffview {
            display: flex; flex-direction: column;
            border: 1px solid var(--border); border-radius: var(--radius-sm);
            background: var(--bg-deep); overflow-x: auto;
            font-family: var(--font-mono); font-size: 12px; line-height: 1.75;
        }
        .cmp-line { display: grid; grid-template-columns: 1fr 26px 1fr; align-items: stretch; }
        .cmp-cell { min-width: 0; padding: 1px 10px; word-break: break-all; }
        .cmp-gutter {
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 12px; color: var(--text-faint);
            background: var(--surface-alt);
            border-left: 1px solid var(--border); border-right: 1px solid var(--border);
        }
        .cmp-ln-tag { color: var(--primary); }
        .cmp-ln-eq { color: var(--text-faint); padding: 0 2px; }
        .cmp-ln-val { color: var(--text); padding: 0 3px; }
        .cmp-line.cmp-same { opacity: 0.5; }
        .cmp-line.cmp-changed .cmp-cell-a { background: rgba(227, 179, 65, 0.10); }
        .cmp-line.cmp-changed .cmp-cell-b { background: rgba(227, 179, 65, 0.18); }
        .cmp-line.cmp-changed .cmp-gutter { color: var(--warning, #e3b341); }
        .cmp-line.cmp-changed .cmp-cell-a .cmp-ln-val { color: var(--text-muted); text-decoration: line-through; }
        .cmp-line.cmp-changed .cmp-cell-b .cmp-ln-val { color: var(--warning, #b58326); font-weight: 700; }
        .cmp-line.cmp-added .cmp-cell-b { background: rgba(74, 214, 160, 0.15); }
        .cmp-line.cmp-added .cmp-cell-b .cmp-ln-val { color: var(--success, #0B8A60); font-weight: 700; }
        .cmp-line.cmp-added .cmp-gutter { color: var(--success, #4ad6a0); }
        .cmp-line.cmp-added .cmp-cell-a { background: var(--surface-alt); }
        .cmp-line.cmp-removed .cmp-cell-a { background: rgba(241, 112, 122, 0.15); }
        .cmp-line.cmp-removed .cmp-cell-a .cmp-ln-val { color: var(--danger, #C13543); font-weight: 700; text-decoration: line-through; }
        .cmp-line.cmp-removed .cmp-gutter { color: var(--danger, #f1707a); }
        .cmp-line.cmp-removed .cmp-cell-b { background: var(--surface-alt); }
        @media (max-width: 620px) {
            .cmp-line { grid-template-columns: 1fr 20px 1fr; }
            .cmp-cell { font-size: 10.5px; }
        }

        .cmp-toggle {
            align-self: flex-start; background: transparent; border: 1px solid var(--border);
            color: var(--text-muted); font-family: var(--font-mono); font-size: 11px;
            letter-spacing: 0.03em; padding: 6px 12px; border-radius: var(--radius-pill); cursor: pointer;
            transition: border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }
        .cmp-toggle:hover { border-color: var(--border-hi); color: var(--text); }
        .cmp-toggle.is-on { border-color: var(--primary-deep); color: var(--text); }
        .cmp-hint { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-faint); margin: 0; }
        `;
        const style = document.createElement('style');
        style.id = 'cmp-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // -------------------------------------------------------------------------
    // INIT
    // -------------------------------------------------------------------------
    function init(id) {
        mountId = id || 'cmp-root';
        if (!PAIRS[activePair]) activePair = 'amount';
        injectStyles();
        render();
    }

    return { init, load, onInput, onEdit, toggleEdit, toggleSame, getXml, loadXml };
})();

window.MsgComparator = MsgComparator;
