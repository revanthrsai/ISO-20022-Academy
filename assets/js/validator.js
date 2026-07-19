// =============================================================================
// PLAYGROUND TOOL · SCHEMA VALIDATOR  (Session 4.3)
// -----------------------------------------------------------------------------
// Standalone validator: paste or load an ISO 20022 message and have it checked
// against the failure modes that actually bite in production — not a full XSD,
// but the named, concrete mistakes a learner needs to recognise:
//
//   1. Malformed XML            — won't even parse (caught before any rule runs)
//   2. Missing required element — a mandatory field (Amount, EndToEndId, …) absent
//   3. Bad BIC                  — wrong length / illegal characters for a BIC
//   4. Bad IBAN                 — fails the ISO 7064 mod-97 checksum
//   5. Truncated / overlong     — a field past its ISO maxLength (Name 140, Ustrd 140)
//   6. Amount problem           — non-numeric, negative, missing Ccy, too many decimals
//   7. Bad currency code        — not a 3-letter ISO 4217 code
//   8. Reference / count issues — UETR not a UUID, NbOfTxs ≠ actual transactions
//
// Each finding names the rule, points at the element, quotes the offending value,
// and says in one plain sentence what is wrong and what good looks like.
//
// Self-contained: one global `SchemaValidator` object + its own injected styles,
// theme-aware via the shared CSS variables. No dependencies beyond DOMParser.
//
// Threaded to the Library: the clean sample is the Bob → Sweety pacs.008
// (EndToEndId BOB-INV0042, the shared UETR); the broken samples are that same
// message with one thing wrong, so the learner sees exactly what each rule
// catches against a message they already know.
// =============================================================================

const SchemaValidator = (function () {
    const UETR = 'eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4';

    // -------------------------------------------------------------------------
    // SAMPLES — one clean, the rest each break exactly one rule.
    // -------------------------------------------------------------------------
    function pacs008(over) {
        over = over || {};
        const d = {
            instgBic: 'EBILAEAD',
            instdBic: 'HDFCINBB',
            dbtrAgtBic: 'EBILAEAD',
            cdtrAgtBic: 'HDFCINBB',
            e2e: 'BOB-INV0042',
            uetr: UETR,
            amt: '400.00',
            ccy: 'USD',
            dbtr: 'Bob Marsh',
            cdtr: 'Sweety Rao',
            cdtrIban: 'IN46HDFC0000123456789012',
            ustrd: 'Invoice 0042 - June freelance',
            nbOfTxs: '1',
            sttlmDt: '2026-06-27'
        };
        Object.assign(d, over);
        return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>EBILAEAD-20260627-000400</MsgId>
      <CreDtTm>2026-06-27T09:30:00+04:00</CreDtTm>
      <NbOfTxs>${d.nbOfTxs}</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>INDA</SttlmMtd>
      </SttlmInf>
      <InstgAgt>
        <FinInstnId>
          <BICFI>${d.instgBic}</BICFI>
        </FinInstnId>
      </InstgAgt>
      <InstdAgt>
        <FinInstnId>
          <BICFI>${d.instdBic}</BICFI>
        </FinInstnId>
      </InstdAgt>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>EBILAEAD-INSTR-0400</InstrId>
        <EndToEndId>${d.e2e}</EndToEndId>
        <UETR>${d.uetr}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="${d.ccy}">${d.amt}</IntrBkSttlmAmt>
      <IntrBkSttlmDt>${d.sttlmDt}</IntrBkSttlmDt>
      <ChrgBr>SHAR</ChrgBr>
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

    // A pacs.008 with the EndToEndId element removed entirely (missing-required demo).
    function pacs008NoE2E() {
        return pacs008().replace(/\s*<EndToEndId>[^<]*<\/EndToEndId>/, '');
    }

    const SAMPLES = {
        clean: {
            label: 'Valid message',
            tag: 'clean',
            sub: 'The Bob → Sweety pacs.008, exactly as it should be — passes every check',
            xml: pacs008()
        },
        bic: {
            label: 'Bad BIC',
            tag: 'broken',
            sub: "Creditor agent BIC is 'HDFC0INB' — a digit where only letters are allowed",
            xml: pacs008({ cdtrAgtBic: 'HDFC0INB' })
        },
        iban: {
            label: 'Bad IBAN',
            tag: 'broken',
            sub: "Creditor IBAN fails its mod-97 checksum (one digit transposed)",
            xml: pacs008({ cdtrIban: 'IN46HDFC0000123456789021' })
        },
        amount: {
            label: 'Amount problem',
            tag: 'broken',
            sub: "Interbank amount is '400.005' (USD allows 2 decimals) with currency 'US'",
            xml: pacs008({ amt: '400.005', ccy: 'US' })
        },
        truncated: {
            label: 'Overlong field',
            tag: 'broken',
            sub: 'Remittance text runs past the 140-character ISO limit',
            xml: pacs008({ ustrd: 'Invoice 0042 - June freelance work covering design, build, revisions, hosting setup, content migration, QA, and the extended support retainer agreed for the quarter' })
        },
        missing: {
            label: 'Missing required',
            tag: 'broken',
            sub: 'The EndToEndId — mandatory on every transaction — is gone',
            xml: pacs008NoE2E()
        },
        count: {
            label: 'Count mismatch',
            tag: 'broken',
            sub: "NbOfTxs says '2' but the message carries one transaction",
            xml: pacs008({ nbOfTxs: '2' })
        }
    };

    const SAMPLE_ORDER = ['clean', 'bic', 'iban', 'amount', 'truncated', 'missing', 'count'];

    // ISO 4217 codes we recognise (a working subset — enough for the lessons).
    const CCY = new Set([
        'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY', 'HKD', 'SGD',
        'INR', 'AED', 'SAR', 'ZAR', 'SEK', 'NOK', 'DKK', 'NZD', 'MXN', 'BRL',
        'RUB', 'TRY', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'PLN', 'CZK', 'HUF'
    ]);
    // Currencies whose minor unit isn't 2 decimals (subset that matters here).
    const CCY_DECIMALS = { JPY: 0, KRW: 0, CLP: 0, BHD: 3, KWD: 3, OMR: 3, TND: 3 };

    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    let activeSample = 'clean';
    let mountId = 'val-root';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function source() {
        const ta = document.getElementById('val-src');
        return ta ? ta.value : (SAMPLES[activeSample] ? SAMPLES[activeSample].xml : '');
    }

    // -------------------------------------------------------------------------
    // CHECK HELPERS
    // -------------------------------------------------------------------------
    function localName(el) { return el.localName; }

    // Collect every element with a given localName, namespace-agnostically.
    function allByName(root, name) {
        const out = [];
        const walk = (el) => {
            if (el.nodeType === 1) {
                if (el.localName === name) out.push(el);
                for (const c of el.childNodes) walk(c);
            }
        };
        walk(root);
        return out;
    }
    function firstByName(root, name) {
        const a = allByName(root, name);
        return a.length ? a[0] : null;
    }
    function textOf(el) { return el ? (el.textContent || '').trim() : ''; }

    // BIC: 6 letters (bank + country) + 2 alphanumeric (location) + optional 3 (branch).
    function bicValid(v) {
        return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v) && (v.length === 8 || v.length === 11);
    }

    // IBAN: ISO 7064 mod-97-10. Move first 4 chars to the end, letters → numbers, mod 97 === 1.
    function ibanValid(v) {
        const raw = v.replace(/\s+/g, '').toUpperCase();
        if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(raw)) return false;
        const rearranged = raw.slice(4) + raw.slice(0, 4);
        let remainder = 0;
        for (const ch of rearranged) {
            const code = ch >= 'A' && ch <= 'Z' ? (ch.charCodeAt(0) - 55).toString() : ch;
            for (const digit of code) {
                remainder = (remainder * 10 + (digit.charCodeAt(0) - 48)) % 97;
            }
        }
        return remainder === 1;
    }

    function isUuid(v) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    }

    function isIsoDate(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
    }

    // -------------------------------------------------------------------------
    // THE RULES — return an array of findings.
    // Each finding: { sev:'error'|'warn'|'ok', rule, where, value, msg }
    // -------------------------------------------------------------------------
    function runRules(root) {
        const f = [];
        const add = (sev, rule, where, value, msg) => f.push({ sev, rule, where, value, msg });

        // -- Rule: required elements present --------------------------------
        const REQUIRED = [
            ['EndToEndId', 'every transaction must carry an end-to-end reference that survives the whole journey'],
            ['IntrBkSttlmAmt', 'the interbank settlement amount is what actually moves — it cannot be missing'],
            ['Dbtr', 'the debtor (who pays) is mandatory'],
            ['Cdtr', 'the creditor (who is paid) is mandatory'],
            ['ChrgBr', 'the charge-bearer (who pays the fees) is required on a pacs.008']
        ];
        for (const [name, why] of REQUIRED) {
            if (allByName(root, name).length === 0) {
                add('error', 'Missing required element', '<' + name + '>', '—',
                    'Required element <' + name + '> is absent — ' + why + '.');
            }
        }

        // -- Rule: BIC format ------------------------------------------------
        const bics = allByName(root, 'BICFI').concat(allByName(root, 'BIC'));
        for (const el of bics) {
            const v = textOf(el);
            if (v && !bicValid(v)) {
                let why = 'a BIC is 8 or 11 characters: 4-letter bank code, 2-letter country, 2 alphanumeric location, optional 3-character branch';
                add('error', 'Bad BIC', '<' + localName(el) + '>', v,
                    "'" + v + "' is not a valid BIC — " + why + '.');
            }
        }

        // -- Rule: IBAN checksum --------------------------------------------
        for (const el of allByName(root, 'IBAN')) {
            const v = textOf(el);
            if (v && !ibanValid(v)) {
                add('error', 'Bad IBAN', '<IBAN>', v,
                    "'" + v + "' fails the ISO 7064 mod-97 checksum — a transposed or wrong digit. A valid IBAN's check digits must reconcile.");
            }
        }

        // -- Rule: amount + currency ----------------------------------------
        const amts = allByName(root, 'IntrBkSttlmAmt')
            .concat(allByName(root, 'InstdAmt'))
            .concat(allByName(root, 'Amt'));
        for (const el of amts) {
            const v = textOf(el);
            const ccy = el.getAttribute('Ccy');
            if (!ccy) {
                add('error', 'Amount problem', '<' + localName(el) + '>', v || '—',
                    'Amount is missing its Ccy currency attribute — an amount without a currency is meaningless.');
            } else if (!/^[A-Z]{3}$/.test(ccy)) {
                add('error', 'Bad currency code', '<' + localName(el) + ' Ccy>', ccy,
                    "'" + ccy + "' is not a 3-letter code — ISO 4217 currency codes are exactly three uppercase letters (e.g. USD).");
            } else if (!CCY.has(ccy)) {
                add('warn', 'Bad currency code', '<' + localName(el) + ' Ccy>', ccy,
                    "'" + ccy + "' isn't a currency this validator recognises — check it's a real ISO 4217 code.");
            }
            if (v === '' || isNaN(Number(v))) {
                add('error', 'Amount problem', '<' + localName(el) + '>', v || '(empty)',
                    "'" + v + "' is not a number — an amount must be a plain decimal like 400.00.");
            } else if (Number(v) < 0) {
                add('error', 'Amount problem', '<' + localName(el) + '>', v,
                    'Amount is negative — a settlement amount must be zero or positive; direction is carried elsewhere, not by sign.');
            } else if (ccy && /^[A-Z]{3}$/.test(ccy)) {
                const dp = (v.split('.')[1] || '').length;
                const max = ccy in CCY_DECIMALS ? CCY_DECIMALS[ccy] : 2;
                if (dp > max) {
                    add('error', 'Amount problem', '<' + localName(el) + '>', v,
                        max === 0
                            ? ccy + ' has no minor unit — ' + v + ' must be a whole number, no decimal places.'
                            : ccy + ' allows ' + max + ' decimal place' + (max === 1 ? '' : 's') + ' — ' + v + ' has ' + dp + '.');
                }
            }
        }

        // -- Rule: field length (truncation / overlong) --------------------
        const MAXLEN = [['Nm', 140], ['Ustrd', 140], ['EndToEndId', 35], ['InstrId', 35], ['MsgId', 35]];
        for (const [name, max] of MAXLEN) {
            for (const el of allByName(root, name)) {
                const v = textOf(el);
                if (v.length > max) {
                    add('error', 'Overlong field', '<' + name + '>', v.slice(0, 28) + '…',
                        '<' + name + '> is ' + v.length + ' characters — the ISO maximum is ' + max + '. It will be truncated or rejected downstream.');
                }
            }
        }

        // -- Rule: UETR is a UUID -------------------------------------------
        for (const el of allByName(root, 'UETR')) {
            const v = textOf(el);
            if (v && !isUuid(v)) {
                add('error', 'Reference problem', '<UETR>', v,
                    'The UETR must be a UUID (8-4-4-4-12 hex) — it is the one tracking ID that stays constant across every hop.');
            }
        }

        // -- Rule: settlement date format -----------------------------------
        for (const el of allByName(root, 'IntrBkSttlmDt')) {
            const v = textOf(el);
            if (v && !isIsoDate(v)) {
                add('error', 'Date problem', '<IntrBkSttlmDt>', v,
                    "'" + v + "' is not an ISO date (YYYY-MM-DD) — settlement dates use the calendar-date format.");
            }
        }

        // -- Rule: NbOfTxs matches the real transaction count ---------------
        const nb = firstByName(root, 'NbOfTxs');
        if (nb) {
            const stated = textOf(nb);
            const actual = allByName(root, 'CdtTrfTxInf').length;
            if (/^\d+$/.test(stated) && actual > 0 && Number(stated) !== actual) {
                add('error', 'Count mismatch', '<NbOfTxs>', stated,
                    'NbOfTxs says ' + stated + ' but the message actually carries ' + actual + ' transaction' + (actual === 1 ? '' : 's') + ' — the count must match.');
            }
        }

        return f;
    }

    // -------------------------------------------------------------------------
    // VALIDATE — parse first, then run rules.
    // Returns { parseError, findings }
    // -------------------------------------------------------------------------
    function validate(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return { parseError: 'Nothing to check yet — paste a message or pick a sample.', findings: [] };
        let doc;
        try {
            doc = new DOMParser().parseFromString(trimmed, 'application/xml');
        } catch (e) {
            return { parseError: 'Could not parse: ' + e.message, findings: [] };
        }
        const perr = doc.querySelector('parsererror');
        if (perr) {
            const msg = (perr.textContent || 'Malformed XML').replace(/\s+/g, ' ').trim();
            return { parseError: msg.length > 220 ? msg.slice(0, 220) + '…' : msg, findings: [] };
        }
        if (!doc.documentElement) return { parseError: 'No root element found.', findings: [] };
        return { parseError: null, findings: runRules(doc.documentElement) };
    }

    // -------------------------------------------------------------------------
    // RENDER REPORT
    // -------------------------------------------------------------------------
    function reportHtml(text) {
        const { parseError, findings } = validate(text != null ? text : source());

        if (parseError) {
            return `<div class="val-verdict val-verdict-fail">
                <span class="val-verdict-badge">XML</span>
                <div class="val-verdict-body">
                    <div class="val-verdict-title">Won't parse</div>
                    <div class="val-verdict-sub">${esc(parseError)}</div>
                </div>
            </div>
            <p class="val-hint">Fix the XML itself before the schema checks can run — every other rule needs a well-formed tree first.</p>`;
        }

        const errors = findings.filter(x => x.sev === 'error');
        const warns = findings.filter(x => x.sev === 'warn');

        let verdict;
        if (errors.length === 0 && warns.length === 0) {
            verdict = `<div class="val-verdict val-verdict-pass">
                <span class="val-verdict-badge">✓</span>
                <div class="val-verdict-body">
                    <div class="val-verdict-title">Passes every check</div>
                    <div class="val-verdict-sub">No failures across ${RULE_COUNT} rule groups — BICs, IBAN checksum, amounts, currency, field lengths, references, and counts all reconcile.</div>
                </div>
            </div>`;
        } else {
            const bits = [];
            if (errors.length) bits.push(errors.length + ' error' + (errors.length === 1 ? '' : 's'));
            if (warns.length) bits.push(warns.length + ' warning' + (warns.length === 1 ? '' : 's'));
            verdict = `<div class="val-verdict val-verdict-fail">
                <span class="val-verdict-badge">${errors.length || warns.length}</span>
                <div class="val-verdict-body">
                    <div class="val-verdict-title">${bits.join(' · ')}</div>
                    <div class="val-verdict-sub">Each one below names the rule, the element, and the value that broke it.</div>
                </div>
            </div>`;
        }

        const rows = findings.length
            ? findings.map(findingHtml).join('')
            : '';

        return verdict + (rows ? `<div class="val-findings">${rows}</div>` : '');
    }

    function findingHtml(x) {
        const sevLabel = x.sev === 'error' ? 'error' : (x.sev === 'warn' ? 'warning' : 'ok');
        return `<div class="val-finding val-sev-${x.sev}">
            <div class="val-finding-top">
                <span class="val-sev-pill">${sevLabel}</span>
                <span class="val-rule">${esc(x.rule)}</span>
                <span class="val-where">${esc(x.where)}</span>
            </div>
            <div class="val-finding-msg">${esc(x.msg)}</div>
            ${x.value && x.value !== '—' ? `<div class="val-finding-val"><span class="val-val-k">value</span><code>${esc(x.value)}</code></div>` : ''}
        </div>`;
    }

    // How many rule groups we advertise on a clean pass.
    const RULE_COUNT = 8;

    // -------------------------------------------------------------------------
    // FULL RENDER
    // -------------------------------------------------------------------------
    function chipHtml(key) {
        const s = SAMPLES[key];
        const on = key === activeSample ? ' is-on' : '';
        return `<button class="val-chip val-chip-${s.tag}${on}" onclick="SchemaValidator.load('${key}')">
            <span class="val-chip-dot"></span>
            <span class="val-chip-name">${esc(s.label)}</span>
        </button>`;
    }

    function render() {
        const root = document.getElementById(mountId);
        if (!root) return;
        const active = SAMPLES[activeSample];
        root.innerHTML = `
            <div class="val-samplebar">
                <span class="val-samplebar-label">Load a message</span>
                <div class="val-chips">${SAMPLE_ORDER.map(chipHtml).join('')}</div>
            </div>

            <div class="val-grid">
                <div class="val-pane val-pane-src">
                    <div class="val-pane-bar">
                        <span class="val-dot"></span><span class="val-dot"></span><span class="val-dot"></span>
                        <span class="val-pane-name">message.xml</span>
                        <button class="val-mini" onclick="SchemaValidator.clear()" title="Clear">clear</button>
                    </div>
                    <textarea id="val-src" class="val-src" spellcheck="false"
                        oninput="SchemaValidator.onInput()"
                        placeholder="Paste any ISO 20022 message to validate…">${esc(active ? active.xml : '')}</textarea>
                    <div class="val-src-meta">${active ? `<span class="val-src-sub">${esc(active.sub)}</span>` : '<span class="val-src-sub">Pasted message</span>'}</div>
                </div>

                <div class="val-pane val-pane-report">
                    <div class="val-pane-bar">
                        <span class="val-pane-name">validation report</span>
                        <span class="val-live">live</span>
                    </div>
                    <div class="val-reportwrap" id="val-reportwrap">${reportHtml(active ? active.xml : '')}</div>
                </div>
            </div>
        `;
    }

    function refreshReport() {
        const wrap = document.getElementById('val-reportwrap');
        const ta = document.getElementById('val-src');
        if (wrap) wrap.innerHTML = reportHtml(ta ? ta.value : '');
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
        activeSample = null;
        const meta = document.querySelector('.val-src-sub');
        if (meta) meta.textContent = 'Pasted message';
        document.querySelectorAll('.val-chip').forEach(c => c.classList.remove('is-on'));
        refreshReport();
    }

    function clear() {
        const ta = document.getElementById('val-src');
        if (ta) { ta.value = ''; ta.focus(); }
        onInput();
    }

    // Workspace handoff (Session 4.6).
    function getXml() { const ta = document.getElementById('val-src'); return ta ? ta.value : ''; }
    function loadXml(xml) {
        const ta = document.getElementById('val-src');
        if (ta) { ta.value = xml || ''; onInput(); }
    }

    // -------------------------------------------------------------------------
    // STYLES — injected once, theme-aware.
    // -------------------------------------------------------------------------
    function injectStyles() {
        if (document.getElementById('val-styles')) return;
        const css = `
        .val { display: flex; flex-direction: column; gap: 18px; }
        .val-samplebar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .val-samplebar-label {
            font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em;
            text-transform: uppercase; color: var(--text-faint);
        }
        .val-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .val-chip {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 7px 13px; border-radius: var(--radius-pill);
            background: var(--surface); border: 1px solid var(--border);
            color: var(--text-muted); cursor: pointer; font-family: var(--font-mono);
            transition: border-color var(--dur-fast) var(--ease-out),
                        color var(--dur-fast) var(--ease-out),
                        background var(--dur-fast) var(--ease-out);
        }
        .val-chip:hover { border-color: var(--border-hi); color: var(--text); }
        .val-chip-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border-hi); flex-shrink: 0; }
        .val-chip-clean .val-chip-dot { background: var(--success, #4ad6a0); }
        .val-chip-broken .val-chip-dot { background: var(--danger, #f1707a); }
        .val-chip-name { font-size: 12.5px; font-weight: 600; }
        .val-chip.is-on { border-color: var(--primary-deep); background: var(--glass-tint-strong); color: var(--text); }

        .val-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; }
        @media (max-width: 880px) { .val-grid { grid-template-columns: 1fr; } }

        .val-pane {
            display: flex; flex-direction: column; min-width: 0;
            background: var(--surface); border: 1px solid var(--border);
            border-radius: var(--radius-md); overflow: hidden;
        }
        .val-pane-bar {
            display: flex; align-items: center; gap: 7px;
            padding: 11px 14px; border-bottom: 1px solid var(--border);
            background: var(--bg-deep);
        }
        .val-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--border-hi); }
        .val-pane-name {
            margin-left: 6px; font-family: var(--font-mono); font-size: 12px;
            color: var(--text-faint); letter-spacing: 0.02em;
        }
        .val-mini {
            margin-left: auto; background: transparent; border: 1px solid var(--border); color: var(--text-muted);
            font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.03em;
            padding: 4px 9px; border-radius: var(--radius-xs); cursor: pointer;
            transition: border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }
        .val-mini:hover { border-color: var(--border-hi); color: var(--text); }
        .val-live {
            margin-left: auto; display: inline-flex; align-items: center; gap: 6px;
            font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em;
            text-transform: uppercase; color: var(--primary);
        }
        .val-live::before {
            content: ''; width: 6px; height: 6px; border-radius: 50%;
            background: var(--primary); box-shadow: 0 0 0 0 var(--primary);
            animation: val-pulse 2s var(--ease-out) infinite;
        }
        @keyframes val-pulse {
            0% { box-shadow: 0 0 0 0 rgba(80, 200, 150, 0.5); }
            70% { box-shadow: 0 0 0 6px rgba(80, 200, 150, 0); }
            100% { box-shadow: 0 0 0 0 rgba(80, 200, 150, 0); }
        }

        .val-src {
            flex: 1; min-height: 420px; resize: vertical; border: 0; outline: 0;
            padding: 16px; background: transparent; color: var(--primary-bright);
            font-family: var(--font-mono); font-size: 12.5px; line-height: 1.6;
            white-space: pre; tab-size: 2;
        }
        .val-src-meta { padding: 9px 14px; border-top: 1px solid var(--border); background: var(--bg-deep); }
        .val-src-sub { font-family: var(--font-mono); font-size: 11px; color: var(--text-faint); letter-spacing: 0.02em; }

        .val-reportwrap { flex: 1; min-height: 420px; max-height: 660px; overflow: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }

        .val-verdict {
            display: flex; align-items: center; gap: 14px; padding: 16px 18px;
            border-radius: var(--radius-sm); border: 1px solid var(--border);
        }
        .val-verdict-pass { border-color: var(--success, #4ad6a0); background: rgba(74, 214, 160, 0.07); }
        .val-verdict-fail { border-color: var(--danger, #f1707a); background: rgba(241, 112, 122, 0.07); }
        .val-verdict-badge {
            flex-shrink: 0; width: 38px; height: 38px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-family: var(--font-display); font-weight: 800; font-size: 17px; color: #FFFFFF;
        }
        .val-verdict-pass .val-verdict-badge { background: var(--success, #4ad6a0); }
        .val-verdict-fail .val-verdict-badge { background: var(--danger, #C13543); color: #FFFFFF; }
        .val-verdict-title { font-family: var(--font-display); font-weight: 700; font-size: 16px; color: var(--text); }
        .val-verdict-sub { margin-top: 3px; font-size: 12.5px; line-height: 1.5; color: var(--text-muted); }

        .val-hint { font-family: var(--font-mono); font-size: 11.5px; line-height: 1.6; color: var(--text-faint); margin: 0; }

        .val-findings { display: flex; flex-direction: column; gap: 10px; }
        .val-finding {
            padding: 13px 15px; border-radius: var(--radius-sm);
            background: var(--surface-alt); border: 1px solid var(--border);
            border-left-width: 3px;
        }
        .val-sev-error { border-left-color: var(--danger, #f1707a); }
        .val-sev-warn { border-left-color: var(--warning, #e3b341); }
        .val-finding-top { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .val-sev-pill {
            font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.06em;
            text-transform: uppercase; padding: 2px 8px; border-radius: var(--radius-pill);
            font-weight: 700;
        }
        .val-sev-error .val-sev-pill { background: var(--danger, #C13543); color: #FFFFFF; }
        .val-sev-warn .val-sev-pill { background: var(--warning, #A96B00); color: #FFFFFF; }
        .val-rule { font-family: var(--font-display); font-weight: 700; font-size: 13.5px; color: var(--text); }
        .val-where {
            margin-left: auto; font-family: var(--font-mono); font-size: 11px;
            color: var(--primary); letter-spacing: 0.01em;
        }
        .val-finding-msg { margin-top: 7px; font-size: 13px; line-height: 1.6; color: var(--text-muted); }
        .val-finding-val { margin-top: 8px; display: flex; align-items: baseline; gap: 9px; }
        .val-val-k {
            font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.06em;
            text-transform: uppercase; color: var(--text-faint);
        }
        .val-finding-val code {
            font-family: var(--font-mono); font-size: 12px; color: var(--text);
            background: var(--bg-deep); border: 1px solid var(--border);
            padding: 2px 8px; border-radius: var(--radius-xs); word-break: break-all;
        }
        `;
        const style = document.createElement('style');
        style.id = 'val-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // -------------------------------------------------------------------------
    // INIT
    // -------------------------------------------------------------------------
    function init(id) {
        mountId = id || 'val-root';
        if (!activeSample) activeSample = 'clean';
        injectStyles();
        render();
    }

    // `validate` is exported so the Workshop can grade with the exact same rules
    // the Playground shows — one engine, so a workshop can never disagree with
    // the validator a learner just used.
    return { init, load, onInput, clear, getXml, loadXml, validate };
})();

window.SchemaValidator = SchemaValidator;
