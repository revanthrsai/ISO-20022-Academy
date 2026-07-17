// =============================================================================
// THE ISO 20022 DICTIONARY — data
// -----------------------------------------------------------------------------
// A reference layer on top of the teaching Library: every message family, the
// messages we cover, and a shared dictionary of elements (localName → meaning,
// cardinality, code list, example). Message anatomy trees are derived live from
// the real sample XML in /samples, so structure is always accurate; this file
// supplies the *meaning* attached to each element by its localName.
//
// Definitions are curated (seeded from the plain-English maps in the viewer and
// transform engine, and the glossary). Cardinality is the typical usage in the
// payment/cash context, not a substitute for the official schema.
// =============================================================================

const DICTIONARY = (function () {

    // ── Business areas (families) ───────────────────────────────────────────
    const FAMILIES = [
        { id: 'pain', name: 'Payments Initiation', blurb: 'A customer talking to their own bank — the instruction and its receipt.' },
        { id: 'pacs', name: 'Payments Clearing & Settlement', blurb: 'Banks talking to each other — moving the money and reporting on it.' },
        { id: 'camt', name: 'Cash Management', blurb: 'Reporting and the exceptions corner — statements, notifications, investigations.' },
        { id: 'head', name: 'Business Application Header', blurb: 'The envelope wrapped around every business message.' },
        { id: 'admi', name: 'Administration', blurb: 'The network’s own housekeeping — no customer, no money.' },
        { id: 'sese', name: 'Securities Settlement', blurb: 'Instructing and reporting the settlement of securities trades.' },
        { id: 'semt', name: 'Securities Management', blurb: 'Securities positions, statements and holdings.' },
        { id: 'caaa', name: 'Cards — Acceptor to Acquirer', blurb: 'Card acceptance messages between terminal and acquirer.' },
        { id: 'fxtr', name: 'Foreign Exchange', blurb: 'FX trade instruction, confirmation and status.' },
        { id: 'tsin', name: 'Trade Services Initiation', blurb: 'Trade-finance initiation messages.' }
    ];

    // ── Messages (metadata; anatomy comes from the /samples XML) ─────────────
    const MESSAGES = {
        'pain.001': { family: 'pain', name: 'Customer Credit Transfer Initiation', version: 'pain.001.001.09', mt: 'MT101 (request for transfer)', dir: 'Customer → Bank', purpose: 'The instruction: a customer tells their bank to pay one or many people. Where every push payment is born.' },
        'pain.002': { family: 'pain', name: 'Customer Payment Status Report', version: 'pain.002.001.10', mt: 'MT199 (free-format)', dir: 'Bank → Customer', purpose: 'The receipt: accepted, rejected, or pending, with a reason code if something failed.' },
        'pain.008': { family: 'pain', name: 'Customer Direct Debit Initiation', version: 'pain.008.001.08', mt: 'MT104', dir: 'Customer → Bank', purpose: 'The pull: the creditor asks the bank to collect money, rather than the debtor pushing it.' },
        'pacs.008': { family: 'pacs', name: 'FI-to-FI Customer Credit Transfer', version: 'pacs.008.001.08', mt: 'MT103', dir: 'Bank → Bank', purpose: 'The interbank workhorse: moves a customer’s payment between banks. One of the most travelled messages in finance.' },
        'pacs.009': { family: 'pacs', name: 'Financial Institution Credit Transfer', version: 'pacs.009.001.08', mt: 'MT202 / MT202COV', dir: 'Bank → Bank', purpose: 'Banks moving their own money — treasury, liquidity, and the COV cover leg behind a customer payment.' },
        'pacs.002': { family: 'pacs', name: 'FI-to-FI Payment Status Report', version: 'pacs.002.001.10', mt: 'MT199 / MT299', dir: 'Bank → Bank', purpose: 'The interbank status: accepted / settled / rejected, tied back to the original by its references.' },
        'pacs.004': { family: 'pacs', name: 'Payment Return', version: 'pacs.004.001.09', mt: 'MT103 RETN / MT202 RETN', dir: 'Bank → Bank', purpose: 'Settled money making a U-turn: the receiver can’t apply it, so it sends the funds back with a reason.' },
        'camt.053': { family: 'camt', name: 'Bank-to-Customer Statement', version: 'camt.053.001.08', mt: 'MT940', dir: 'Bank → Customer', purpose: 'The authoritative end-of-day statement — every booked entry plus opening and closing balances. The workhorse of reconciliation.' },
        'camt.054': { family: 'camt', name: 'Bank-to-Customer Debit/Credit Notification', version: 'camt.054.001.08', mt: 'MT900 / MT910', dir: 'Bank → Customer', purpose: 'A single-event nudge: "one specific entry just hit your account."' },
        'camt.056': { family: 'camt', name: 'FI-to-FI Payment Cancellation Request', version: 'camt.056.001.08', mt: 'MT192 / MT292', dir: 'Bank → Bank', purpose: 'A request to cancel a payment already sent — a question, not a transfer. Moves no money and can be refused.' },
        'head.001': { family: 'head', name: 'Business Application Header (BAH)', version: 'head.001.001.02', mt: 'MT basic/application header', dir: 'Any', purpose: 'The addressed envelope around every message: from, to, message type, id — so a network can route without opening the letter.' },
        'admi.002': { family: 'admi', name: 'Message Reject', version: 'admi.002.001.01', mt: 'MT n95/n96', dir: 'Any', purpose: 'A transport-level rejection: "we couldn’t even process that envelope," before any business logic runs.' },
        'admi.004': { family: 'admi', name: 'System Event Notification', version: 'admi.004.001.02', mt: '—', dir: 'Network', purpose: 'Operational status the whole network needs to hear — service opening, closing, running late.' },
        'sese.023': { family: 'sese', name: 'Securities Settlement Transaction Instruction', version: 'sese.023.001.09', mt: 'MT540–543', dir: 'Any', purpose: 'Instructs the settlement of a securities trade (deliver/receive against or free of payment).' },
        'semt.002': { family: 'semt', name: 'Securities Balance Custody Report', version: 'semt.002.001.11', mt: 'MT535', dir: 'Any', purpose: 'Reports the holdings in a securities account at a point in time.' },
        'caaa.001': { family: 'caaa', name: 'Acceptor Authorisation Request', version: 'caaa.001.001.11', mt: 'ISO 8583', dir: 'Terminal → Acquirer', purpose: 'A card acceptance device asking the acquirer to authorise a card transaction.' },
        'fxtr.014': { family: 'fxtr', name: 'Foreign Exchange Trade Instruction Amendment', version: 'fxtr.014.001.05', mt: 'MT300', dir: 'Any', purpose: 'Amends a previously instructed FX trade.' },
        'tsin.001': { family: 'tsin', name: 'Trade Services Initiation', version: 'tsin.001.001.01', mt: 'MT7xx', dir: 'Any', purpose: 'Initiates a trade-finance service between banks and corporates.' }
    };

    // Which /samples file backs each message's anatomy (defaults to the code).
    const SAMPLE_FOR = { 'head.001': 'head.001-pacs' };

    // ── Element dictionary (keyed by XML localName) ─────────────────────────
    // c = typical cardinality · codes = valid code values · ex = example · note
    const ELEMENTS = {
        // envelope / document
        Document: { def: 'The ISO 20022 message root. Its namespace names the exact message and version.', c: '1..1', ex: 'xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08"' },
        AppHdr: { def: 'Business Application Header root — the envelope (see head.001).', c: '1..1' },
        Fr: { def: 'From — the institution sending this message.', c: '1..1' },
        To: { def: 'To — the institution this message is addressed to (the next hop).', c: '1..1' },
        FIId: { def: 'Financial-institution identification inside the header.', c: '1..1' },
        BizMsgIdr: { def: 'Business Message Identifier — a unique id for THIS message/envelope. Changes every hop. Not the payment’s id.', c: '1..1', ex: 'EBILAEAD-20260701-BAH-0042', note: 'Don’t confuse with EndToEndId / UETR, which identify the payment.' },
        MsgDefIdr: { def: 'Message Definition Identifier — exactly which message and version is inside, so the receiver picks the right schema before opening the body.', c: '1..1', ex: 'pacs.008.001.08' },
        BizSvc: { def: 'Business Service — which rulebook/usage guideline applies (e.g. CBPR+). Same message, different rules, decided on the envelope.', c: '0..1', ex: 'swift.cbprplus.02' },
        CreDt: { def: 'Creation date/time of the envelope.', c: '1..1' },
        Prty: { def: 'Priority of the message.', c: '0..1', codes: ['NORM — normal', 'HIGH — high'] },

        // group header
        GrpHdr: { def: 'Group Header — facts true of the whole message/transmission. Stated once.', c: '1..1' },
        MsgId: { def: 'Message identifier — point-to-point, changes each hop. Used for duplicate detection.', c: '1..1', ex: 'EBILAEAD-20260627-000400', note: 'The message’s id, not the payment’s. See EndToEndId / UETR.' },
        CreDtTm: { def: 'Creation date and time, with a UTC offset. A missing offset is a real rejection cause.', c: '1..1', ex: '2026-06-27T09:30:00+04:00' },
        NbOfTxs: { def: 'Number of transactions the message contains. Must match the actual count or the message is rejected.', c: '1..1', ex: '1' },
        CtrlSum: { def: 'Control sum — the total of all transaction amounts. Must equal the sum, or the file is rejected.', c: '0..1', ex: '33000.00' },
        InitgPty: { def: 'Initiating party — who created the initiation (often the debtor or their agent).', c: '0..1' },
        PmtInf: { def: 'Payment Information — one block per set of payments that share a debtor, account and date. The grouping layer.', c: '1..n' },
        PmtInfId: { def: 'Payment Information identifier — the batch id.', c: '1..1', ex: 'BOB-RUN-0042' },
        PmtMtd: { def: 'Payment method.', c: '1..1', codes: ['TRF — credit transfer', 'DD — direct debit', 'CHK — cheque', 'TRA — transfer advice'] },
        BtchBookg: { def: 'Batch booking — true books the whole batch as one debit; false books each payment separately.', c: '0..1', codes: ['true', 'false'] },
        ReqdExctnDt: { def: 'Requested execution date — when the payer wants the payment made.', c: '0..1', ex: '2026-06-27' },
        ReqdColltnDt: { def: 'Requested collection date — when a direct debit should be collected.', c: '1..1', ex: '2026-06-30' },

        // transaction
        CstmrCdtTrfInitn: { def: 'Customer Credit Transfer Initiation — the body of a pain.001.', c: '1..1' },
        CstmrDrctDbtInitn: { def: 'Customer Direct Debit Initiation — the body of a pain.008.', c: '1..1' },
        FIToFICstmrCdtTrf: { def: 'FI-to-FI Customer Credit Transfer — the body of a pacs.008.', c: '1..1' },
        CdtTrfTxInf: { def: 'Credit Transfer Transaction Information — one block per payment. The unique-per-payment layer.', c: '1..n' },
        DrctDbtTxInf: { def: 'Direct Debit Transaction Information — one block per collection.', c: '1..n' },
        PmtId: { def: 'Payment identification — the references that identify this payment.', c: '1..1' },
        InstrId: { def: 'Instruction identifier — meaningful between you and your bank only. Not guaranteed to travel onward.', c: '0..1', ex: 'BOB-INSTR-1', note: 'Local and disposable — use EndToEndId for a reference that must reach the creditor.' },
        EndToEndId: { def: 'End-to-end identifier — the customer’s own reference, carried unchanged from first tap to final statement.', c: '1..1', ex: 'BOB-INV0042', note: 'Sacred: no agent may rewrite it. ≤35 chars. Powers reconciliation.' },
        TxId: { def: 'Transaction identifier — the banks’ handle for the interbank transaction, set by the first agent.', c: '0..1' },
        UETR: { def: 'Unique End-to-end Transaction Reference — a globally-unique UUIDv4 stamped on the interbank leg. What powers "where is my payment?" tracking.', c: '0..1', ex: 'eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4', note: 'Never changes after it’s stamped. Lowercase UUIDv4.' },
        IntrBkSttlmAmt: { def: 'Interbank settlement amount — the amount that settles between the banks. Currency is the Ccy attribute.', c: '1..1', ex: '<IntrBkSttlmAmt Ccy="INR">33000.00</IntrBkSttlmAmt>' },
        IntrBkSttlmDt: { def: 'Interbank settlement date — when the value settles between banks.', c: '0..1', ex: '2026-06-27' },
        InstdAmt: { def: 'Instructed amount — the amount the payer instructed, before FX and charges.', c: '1..1', ex: '<InstdAmt Ccy="USD">400.00</InstdAmt>' },
        EqvtAmt: { def: 'Equivalent amount — an amount expressed in another currency at a stated rate.', c: '0..1' },
        Amt: { def: 'Amount — a monetary value with its currency as the Ccy attribute.', c: '1..1' },
        SttlmInf: { def: 'Settlement information — how the banks settle this payment.', c: '1..1' },
        SttlmMtd: { def: 'Settlement method — how settlement happens.', c: '1..1', codes: ['INDA — via the instructed agent’s account', 'INGA — via the instructing agent’s account', 'CLRG — through a clearing system', 'COVE — cover (a separate funds leg)'] },
        InstgAgt: { def: 'Instructing agent — the bank sending this message.', c: '0..1' },
        InstdAgt: { def: 'Instructed agent — the bank receiving this message.', c: '0..1' },
        ChrgBr: { def: 'Charge bearer — who pays the charges.', c: '1..1', codes: ['DEBT — all charges borne by the debtor', 'CRED — all charges borne by the creditor', 'SHAR — charges shared', 'SLEV — following the service level'], ex: 'SHAR' },

        // parties
        Dbtr: { def: 'Debtor — the party that owes the money and whose account is debited (the payer).', c: '1..1', ex: 'Bob Marsh' },
        Cdtr: { def: 'Creditor — the party to be paid, whose account is credited (the payee).', c: '1..1', ex: 'Sweety Rao' },
        DbtrAcct: { def: 'Debtor account — the account to be debited.', c: '0..1' },
        CdtrAcct: { def: 'Creditor account — the account to be credited.', c: '0..1' },
        DbtrAgt: { def: 'Debtor agent — the debtor’s bank.', c: '1..1' },
        CdtrAgt: { def: 'Creditor agent — the creditor’s bank.', c: '1..1' },
        IntrmyAgt1: { def: 'Intermediary agent — a bank in the path between the debtor and creditor agents (a correspondent).', c: '0..1' },
        FinInstnId: { def: 'Financial-institution identification — how a bank is named (usually a BIC).', c: '1..1' },
        BICFI: { def: 'Business Identifier Code — the bank’s BIC, 8 or 11 characters. Resolves to exactly one institution worldwide.', c: '0..1', ex: 'HDFCINBB' },
        Nm: { def: 'Name — of a party, account owner or institution.', c: '0..1', ex: 'Sweety Rao', note: 'Truncating a long name can trip sanctions screening on the wrong party.' },
        Ownr: { def: 'Account owner.', c: '0..1' },

        // address
        PstlAdr: { def: 'Postal address. From Nov 2026, town and country must be structured for in-scope CBPR+ messages.', c: '0..1' },
        AdrLine: { def: 'Address line — free-text. Being retired in favour of structured elements.', c: '0..n' },
        StrtNm: { def: 'Street name — structured.', c: '0..1' },
        BldgNb: { def: 'Building number — structured.', c: '0..1' },
        PstCd: { def: 'Post code — structured.', c: '0..1' },
        TwnNm: { def: 'Town name — the element screening systems care about most.', c: '0..1', ex: 'Bengaluru' },
        Ctry: { def: 'Country — a two-letter ISO country code that can’t be confused with a word.', c: '0..1', ex: 'IN' },

        // ids / accounts
        Id: { def: 'Identifier — a generic id wrapper (e.g. an account’s IBAN or Other id).', c: '1..1' },
        IBAN: { def: 'International Bank Account Number — the standard structured account number.', c: '0..1', ex: 'IN52HDFC0000123456789012' },
        Othr: { def: 'Other identification — a non-IBAN account or party id.', c: '0..1' },

        // remittance
        RmtInf: { def: 'Remittance information — WHY the money moved. Structured (Strd) is machine-matchable; unstructured (Ustrd) needs a human.', c: '0..1' },
        Ustrd: { def: 'Unstructured remittance — free text. A human can read it; a machine mostly can’t.', c: '0..n', ex: 'Invoice 0042 — June freelance' },
        Strd: { def: 'Structured remittance — named, machine-readable elements (creditor reference, referred document). The single biggest lever on auto-reconciliation.', c: '0..n' },
        CdtrRefInf: { def: 'Creditor reference information — a reference the creditor issued (often an ISO 11649 "RF…" code with a check digit).', c: '0..1', ex: 'RF18INV0042' },
        Purp: { def: 'Purpose — the payment’s declared reason, read at the far end (beneficiary bank, regulator).', c: '0..1', codes: ['SALA — salary', 'SUPP — supplier', 'DIVD — dividend', 'TAXS — tax', 'PENS — pension', 'INTC — intra-company'] },
        CtgyPurp: { def: 'Category purpose — a high-level category the banks in the middle read to trigger special processing (e.g. payroll).', c: '0..1' },

        // camt reporting
        BkToCstmrStmt: { def: 'Bank-to-Customer Statement — the body of a camt.053.', c: '1..1' },
        BkToCstmrDbtCdtNtfctn: { def: 'Bank-to-Customer Debit/Credit Notification — the body of a camt.054.', c: '1..1' },
        Stmt: { def: 'Statement — one account’s statement for the period.', c: '1..n' },
        Ntfctn: { def: 'Notification — one account’s notification.', c: '1..n' },
        Acct: { def: 'Account — the account being reported on.', c: '1..1' },
        Bal: { def: 'Balance — a typed balance (opening, closing, available…). Opening + entries must equal closing.', c: '0..n' },
        Ntry: { def: 'Entry — one booked movement on the account. May be a batch of many transactions.', c: '0..n' },
        NtryRef: { def: 'Entry reference — the bank’s handle for this statement line.', c: '0..1' },
        CdtDbtInd: { def: 'Credit/Debit indicator — whether the entry adds to or subtracts from the account.', c: '1..1', codes: ['CRDT — credit', 'DBIT — debit'] },
        Sts: { def: 'Status — of an entry (booked, pending, information).', c: '1..1' },
        Cd: { def: 'Code — a coded value drawn from a code set (the meaning depends on its parent).', c: '1..1' },
        BookgDt: { def: 'Booking date — when the entry hit the books. Reconciliation posts off this.', c: '0..1' },
        ValDt: { def: 'Value date — when the funds are actually available. Treasury forecasts off this. Not the same as booking date.', c: '0..1' },
        Dt: { def: 'Date (YYYY-MM-DD).', c: '1..1', ex: '2026-06-27' },
        DtTm: { def: 'Date and time.', c: '1..1' },
        NtryDtls: { def: 'Entry details — the transactions inside an entry (explode these to reconcile a batch).', c: '0..n' },
        TxDtls: { def: 'Transaction details — one transaction inside an entry. A batch-booked entry holds many.', c: '0..n' },
        Refs: { def: 'References — the identifiers (EndToEndId, UETR…) that tie an entry back to its payment.', c: '0..1' },
        AcctSvcrRef: { def: 'Account servicer reference — the bank’s own reference for the transaction.', c: '0..1' },
        BkTxCd: { def: 'Bank transaction code — a structured domain/family/sub-family code classifying what kind of movement this is.', c: '0..1', ex: 'PMNT / RCDT / ESCT' },

        // returns / cancellation / status
        TxInfAndSts: { def: 'Transaction information and status — one payment’s status inside a status report.', c: '0..n' },
        OrgnlGrpInfAndSts: { def: 'Original group information and status — the group-level status of the message being answered.', c: '0..1' },
        OrgnlMsgId: { def: 'Original message id — which message this report/return answers.', c: '1..1' },
        OrgnlMsgNmId: { def: 'Original message name id — the exact message type and version being reported on.', c: '1..1', ex: 'pacs.008.001.08' },
        OrgnlEndToEndId: { def: 'Original end-to-end id — ties a status, return or cancellation back to the customer’s reference.', c: '0..1', ex: 'BOB-INV0042' },
        OrgnlUETR: { def: 'Original UETR — the globally-unique reference of the payment being answered.', c: '0..1' },
        GrpSts: { def: 'Group status — one status for the whole original message. A PART value means "read the per-transaction statuses".', c: '0..1', codes: ['ACSP — accepted, settlement in process', 'ACSC — accepted, settlement completed', 'RJCT — rejected', 'PART — partially accepted'] },
        TxSts: { def: 'Transaction status — the status of one payment.', c: '0..1', codes: ['ACCP', 'ACSP', 'ACWP', 'ACSC', 'ACCC — creditor account credited', 'PDNG', 'RJCT'] },
        StsRsnInf: { def: 'Status reason information — carries the reason code when a payment is rejected.', c: '0..n' },
        Rsn: { def: 'Reason — a coded reason (rejection, return, cancellation), drawn from an external code set.', c: '0..1', ex: 'AC04' },
        AddtlInf: { def: 'Additional information — free-text detail accompanying a coded reason.', c: '0..n' },
        RtrId: { def: 'Return identifier — the id of a payment return (pacs.004).', c: '0..1' },
        RtrdIntrBkSttlmAmt: { def: 'Returned interbank settlement amount — the amount being sent back. Its presence is the tell that money is moving.', c: '1..1' },
        RtrRsnInf: { def: 'Return reason information — why the payment is being returned.', c: '0..n' },
        Assgnmt: { def: 'Assignment — who is asking whom, and when: the envelope of a cancellation/investigation request.', c: '1..1' },
        Case: { def: 'Case — the case id that threads a request and its answer into one investigation.', c: '0..1' },
        Undrlyg: { def: 'Underlying — which payment a cancellation/investigation refers to.', c: '1..1' },
        CxlRsnInf: { def: 'Cancellation reason information — why a payment is being recalled.', c: '0..1' },
        OrgnlIntrBkSttlmAmt: { def: 'Original interbank settlement amount — the amount of the payment being recalled. Identifies it; does not instruct a transfer.', c: '0..1' },
        UndrlygCstmrCdtTrf: { def: 'Underlying customer credit transfer — the customer details a pacs.009 COV must carry, so every correspondent can screen the real parties (the MT202COV transparency reform).', c: '0..1' },

        // admi
        SysEvtNtfctn: { def: 'System event notification — the body of an admi.004.', c: '1..1' },
        EvtInf: { def: 'Event information.', c: '1..1' },
        EvtCd: { def: 'Event code — what happened on the network.', c: '1..1', ex: 'CUSC' },
        EvtParam: { def: 'Event parameter — a value accompanying the event.', c: '0..n' },
        EvtDesc: { def: 'Event description — free text.', c: '0..1' },
        EvtTm: { def: 'Event time.', c: '0..1' }
    };

    return { FAMILIES: FAMILIES, MESSAGES: MESSAGES, ELEMENTS: ELEMENTS, SAMPLE_FOR: SAMPLE_FOR };
})();
window.DICTIONARY = DICTIONARY;
