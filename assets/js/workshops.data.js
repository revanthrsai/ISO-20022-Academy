// =============================================================================
// WORKSHOPS · DATA
// -----------------------------------------------------------------------------
// The Library explains. The Workshop makes you do it under a little pressure.
//
// Each workshop is a scenario with a definite right answer that is CHECKED, not
// self-assessed — the learner types, we grade, they iterate. Everything
// structural lives here; assets/js/workshop.js owns the state machine and UI.
//
// Shape:
//   LIST  — cards on the Workshop landing, in the order they should be attempted
//   DEFS  — the full definition of each workshop, keyed by id
//
// A DEFS entry:
//   kind        'debug'  — repair a broken message until it validates clean
//   brief       the situation, in the voice of someone handing you a ticket
//   given       what the learner is told up front
//   start       the message they begin with (broken)
//   defects     what's actually wrong — drives escalating hints and the debrief
//   integrity   assertions that stop "fix by deletion"; the business facts must survive
//   debrief     what they just learned, and where to read more
// =============================================================================

const WORKSHOPS = (function () {

    // -------------------------------------------------------------------------
    // WORKSHOP 1 · THE BROKEN PAYMENT
    // Three planted defects, deliberately from three different families:
    //   • a format error      (BIC with a digit where letters are required)
    //   • a consistency error (NbOfTxs disagrees with the actual transaction count)
    //   • a checksum error    (IBAN that fails ISO 7064 mod-97)
    // A junior who can find all three can find most of what breaks in production.
    // -------------------------------------------------------------------------
    const BROKEN_PACS008 =
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>EBILAEAD-20260627-000400</MsgId>
      <CreDtTm>2026-06-27T09:30:00+04:00</CreDtTm>
      <NbOfTxs>2</NbOfTxs>
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
        <UETR>eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4</UETR>
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
          <BICFI>HDFC0INB</BICFI>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>Sweety Rao</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>IN46HDFC0000123456789021</IBAN>
        </Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>Invoice 0042 - June freelance</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;

    const LIST = [
        {
            id: 'broken-payment',
            n: '01',
            title: 'The Broken Payment',
            kicker: 'Debugging challenge',
            blurb: 'A pacs.008 came back rejected and nobody can say why. You get the message and twenty minutes. Find every defect and repair it without changing what the payment means.',
            minutes: 20,
            difficulty: 'Core',
            skills: ['Reading a pacs.008', 'BIC format', 'IBAN checksums', 'Group-header consistency'],
            ready: true
        },
        {
            id: 'mt-migration',
            n: '02',
            title: 'The Migration Desk',
            kicker: 'Translation challenge',
            blurb: 'An MT103 has to become a pacs.008 before the cut-off. Draw the mapping field by field — and work out which ones split in two, and which one has no home at all.',
            minutes: 25,
            difficulty: 'Core',
            skills: ['MT ↔ MX mapping', 'One-to-many fields', 'InstdAmt vs settlement amount'],
            ready: true
        },
        {
            id: 'r-transaction',
            n: '03',
            title: 'The Money Comes Back',
            kicker: 'Exception flow',
            blurb: 'The money arrived and the account was closed. Work out which R-transaction this is, which message carries it, which reason code it quotes, and what Bob actually gets back.',
            minutes: 20,
            difficulty: 'Advanced',
            skills: ['Return vs. reject vs. recall', 'pacs.004', 'Reason codes', 'Return charges'],
            ready: true
        },
        {
            id: 'address-deadline',
            n: '04',
            title: 'The Address Deadline',
            kicker: 'Compliance deadline',
            blurb: 'Run the tape forward to the first Monday after CBPR+ stops accepting free-text addresses. A payment bounced. Work out why, what the minimum legal repair is, and where the real fix has to live.',
            minutes: 20,
            difficulty: 'Core',
            skills: ['PstlAdr anatomy', 'Hybrid vs fully structured', 'ISO country codes', 'Root-causing data quality'],
            ready: true
        },
        {
            id: 'reconciliation-desk',
            n: '05',
            title: 'The Reconciliation Desk',
            kicker: 'Reconciliation challenge',
            blurb: 'Sweety’s statement will not tie out and three entries are stuck in the exception queue. Prove the statement first, then work out why each entry failed to match — and which failure is not the bank’s fault.',
            minutes: 25,
            difficulty: 'Core',
            skills: ['Balance chain (OPBD/CLBD)', 'Batch-booked entries', 'Strd vs Ustrd matching', 'BookgDt vs ValDt'],
            ready: true
        },
        {
            id: 'cover-payment',
            n: '06',
            title: 'The Cover Payment',
            kicker: 'Routing challenge',
            blurb: 'HDFC has a customer payment it was told about and cover funds it cannot tie to anything. Work out which routing was used, which leg went missing, and what the message was legally required to carry.',
            minutes: 25,
            difficulty: 'Advanced',
            skills: ['Serial vs cover routing', 'pacs.009 CORE vs COV', 'UndrlygCstmrCdtTrf', 'Reconciling on UETR'],
            ready: true
        }
    ];

    const DEFS = {
        'broken-payment': {
            kind: 'debug',
            title: 'The Broken Payment',
            kicker: 'Debugging challenge',

            brief:
                "It's 09:40 on a Tuesday. Operations escalate a payment that left your bank yesterday " +
                "evening and came straight back from the beneficiary bank's gateway. No useful error, " +
                "just a rejection and an angry corporate customer who says his contractor hasn't been paid.\n\n" +
                "You have the exact pacs.008 that went out. Nobody has looked at it properly yet.",

            given: [
                'Bob Marsh is paying Sweety Rao USD 400.00',
                'Emirates NBD (EBILAEAD) → HDFC Bank India (HDFCINBB)',
                'One transaction. Reference BOB-INV0042',
                'The payment itself is legitimate — the instruction is fine, the message is not'
            ],

            task:
                'Repair the message until every check passes. The payment must still mean exactly ' +
                'what it meant before — same parties, same amount, same references. Deleting an ' +
                'offending element is not a fix, and the checks will say so.',

            start: BROKEN_PACS008,

            // How many distinct defects were planted — shown as a target, and used
            // to keep hints honest ("you have found 2 of 3").
            defectCount: 3,

            defects: [
                {
                    id: 'bic',
                    label: 'Creditor agent BIC is malformed',
                    where: '<CdtrAgt> → <BICFI>',
                    hint: 'Compare the two BICs in the group header with the two on the transaction. One of the four does not look like the others.',
                    reveal: "The creditor agent carries HDFC0INB. A BIC's first four characters are the bank code and must be letters — there is a zero sitting where the letter C belongs. The correct BIC is HDFCINBB, exactly as it appears in <InstdAgt>.",
                    lesson: '309-the-four-identifiers'
                },
                {
                    id: 'count',
                    label: 'Group header disagrees with the message body',
                    where: '<GrpHdr> → <NbOfTxs>',
                    hint: 'The group header makes a claim about the message. Count the transactions yourself and see whether the claim holds.',
                    reveal: 'NbOfTxs says 2, but the message carries a single <CdtTrfTxInf>. Receiving engines reconcile that count before they process anything — a mismatch is an immediate structural reject, and it is one of the most common causes of a payment bouncing with no useful error text.',
                    lesson: '306-anatomy-of-a-message'
                },
                {
                    id: 'iban',
                    label: 'Creditor IBAN fails its checksum',
                    where: '<CdtrAcct> → <IBAN>',
                    hint: 'One field in this message can be proven wrong with arithmetic alone, without knowing anything about the account.',
                    reveal: 'The IBAN ends ...789021 where it should end ...789012 — two digits transposed. Every IBAN carries check digits (positions 3 and 4) that must reconcile under ISO 7064 mod-97. That is exactly why the standard has them: a typo is caught before the money moves, not after.',
                    lesson: '309-the-four-identifiers'
                }
            ],

            // Guards against "fixing" the message by deleting the broken parts.
            // Each returns true when the business fact has survived intact.
            integrity: [
                {
                    msg: 'The settlement amount must still be USD 400.00.',
                    test: function (doc, txt) {
                        const el = doc.querySelector('IntrBkSttlmAmt');
                        return !!el && el.textContent.trim() === '400.00' && el.getAttribute('Ccy') === 'USD';
                    }
                },
                {
                    msg: 'The end-to-end reference BOB-INV0042 must survive — it is how Bob and Sweety reconcile.',
                    test: function (doc, txt) { return /BOB-INV0042/.test(txt); }
                },
                {
                    msg: 'The UETR must survive unchanged — it is the one ID that tracks this payment across every hop.',
                    test: function (doc, txt) { return /eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4/.test(txt); }
                },
                {
                    msg: 'Sweety Rao must still be the creditor.',
                    test: function (doc, txt) { return /Sweety Rao/.test(txt); }
                },
                {
                    msg: 'The creditor account IBAN must still be present — you were asked to correct it, not remove it.',
                    test: function (doc, txt) { return !!doc.querySelector('IBAN'); }
                },
                {
                    msg: 'The creditor agent must still be identified by a BIC.',
                    test: function (doc, txt) {
                        const agents = doc.querySelectorAll('CdtrAgt BICFI');
                        return agents.length > 0;
                    }
                },
                {
                    msg: 'The message must still carry exactly one transaction.',
                    test: function (doc, txt) { return doc.querySelectorAll('CdtTrfTxInf').length === 1; }
                }
            ],

            debrief:
                "Three defects, three different families — and that is the point. A format error, a " +
                "consistency error, and a checksum error fail for completely different reasons, and " +
                "you catch them with completely different instincts.\n\n" +
                "None of them needed the spec. The BIC was wrong by shape, the count was wrong by " +
                "arithmetic you could do in your head, and the IBAN was wrong by a checksum whose " +
                "whole purpose is to catch a typed digit. This is most of what real message debugging " +
                "actually is: not obscure knowledge, but knowing which things are checkable and " +
                "refusing to trust any of them.",

            next: [
                { id: '306-anatomy-of-a-message', why: 'Why the group header and the body must agree' },
                { id: '309-the-four-identifiers', why: 'BIC, IBAN, UETR, EndToEndId — what each one is for' },
                { id: '401-reject', why: 'What actually happens when a message fails on the far side' }
            ]
        },

        // ---------------------------------------------------------------------
        // WORKSHOP 2 · THE MIGRATION DESK
        // A mapping exercise, not a typing one. The whole lesson is that MT → MX
        // is not one-to-one: :32A: explodes into three values, :59: carries both
        // a name and an account, :33B: is a different amount from :32A:, and
        // :23B: has nowhere to go at all. You cannot learn that from a table you
        // are reading — you learn it the moment you try to draw the lines.
        // ---------------------------------------------------------------------
        'mt-migration': {
            kind: 'map',
            title: 'The Migration Desk',
            kicker: 'Translation challenge',

            brief:
                "Your bank retires MT103 on this corridor at the end of the month. Everything that " +
                "goes out after that has to be a pacs.008.\n\n" +
                "Here is a real MT103 — the same Bob → Sweety payment you already know — and the " +
                "pacs.008 skeleton it has to become. The migration tool your vendor sold you wants " +
                "a field map, and it wants it today.",

            given: [
                'Drag from an MT field to the ISO element it becomes',
                'Or tap one side then the other, if you prefer clicking',
                'A field can feed more than one element — some do',
                'One MT field has no ISO equivalent at all. Find it.'
            ],

            task:
                'Map every MT field to its pacs.008 destination. Twelve links in total, which is ' +
                'more than the ten fields on the left — that gap is the whole point of the exercise.',

            // -- LEFT: what came in ------------------------------------------
            source: {
                label: 'MT103 · incoming',
                fields: [
                    { id: 'mt20',  tag: ':20:',  name: "Sender's Reference",        value: 'EBILAEAD-INSTR-0400' },
                    { id: 'mt23b', tag: ':23B:', name: 'Bank Operation Code',       value: 'CRED' },
                    { id: 'mt32a', tag: ':32A:', name: 'Value Date / Ccy / Amount', value: '260627USD400,00' },
                    { id: 'mt33b', tag: ':33B:', name: 'Currency / Instructed Amt', value: 'USD400,00' },
                    { id: 'mt50k', tag: ':50K:', name: 'Ordering Customer',         value: 'Bob Marsh' },
                    { id: 'mt52a', tag: ':52A:', name: 'Ordering Institution',      value: 'EBILAEAD' },
                    { id: 'mt57a', tag: ':57A:', name: 'Account With Institution',  value: 'HDFCINBB' },
                    { id: 'mt59',  tag: ':59:',  name: 'Beneficiary Customer',      value: '/IN46HDFC0000123456789012 Sweety Rao' },
                    { id: 'mt70',  tag: ':70:',  name: 'Remittance Information',    value: 'Invoice 0042 - June freelance' },
                    { id: 'mt71a', tag: ':71A:', name: 'Details of Charges',        value: 'SHA' }
                ]
            },

            // -- RIGHT: what has to go out -----------------------------------
            target: {
                label: 'pacs.008 · outgoing',
                fields: [
                    { id: 'instrid',   path: '<InstrId>',            note: 'the instructing party’s own reference' },
                    { id: 'sttlmdt',   path: '<IntrBkSttlmDt>',      note: 'when the banks settle' },
                    { id: 'sttlmamt',  path: '<IntrBkSttlmAmt Ccy>', note: 'what actually moves between banks' },
                    { id: 'instdamt',  path: '<InstdAmt Ccy>',       note: 'what the customer originally asked to send' },
                    { id: 'dbtr',      path: '<Dbtr><Nm>',           note: 'who is paying' },
                    { id: 'dbtragt',   path: '<DbtrAgt><BICFI>',     note: 'the payer’s bank' },
                    { id: 'cdtragt',   path: '<CdtrAgt><BICFI>',     note: 'the payee’s bank' },
                    { id: 'cdtr',      path: '<Cdtr><Nm>',           note: 'who is paid' },
                    { id: 'cdtracct',  path: '<CdtrAcct><IBAN>',     note: 'the account the money lands in' },
                    { id: 'ustrd',     path: '<RmtInf><Ustrd>',      note: 'what the payment is for' },
                    { id: 'chrgbr',    path: '<ChrgBr>',             note: 'who pays the fees' },
                    { id: 'none',      path: '(no ISO equivalent)',  note: 'some MT fields simply do not survive' }
                ]
            },

            // The answer key. A source may legitimately feed several targets.
            answer: {
                mt20:  ['instrid'],
                mt23b: ['none'],
                mt32a: ['sttlmdt', 'sttlmamt'],
                mt33b: ['instdamt'],
                mt50k: ['dbtr'],
                mt52a: ['dbtragt'],
                mt57a: ['cdtragt'],
                mt59:  ['cdtr', 'cdtracct'],
                mt70:  ['ustrd'],
                mt71a: ['chrgbr']
            },

            // Wrong links that are wrong for an *interesting* reason. Keyed
            // "source>target" — when the learner draws one of these, say why.
            traps: {
                'mt33b>sttlmamt':
                    ':33B: is the amount the customer instructed, before any charges are deducted. ' +
                    ':32A: is what actually settles between the banks. When a fee is taken along the ' +
                    'way the two differ, and collapsing them loses the evidence of that deduction — ' +
                    'which is exactly what the beneficiary needs to reconcile.',
                'mt32a>instdamt':
                    'The wrong way round. :32A: is the interbank settlement amount; <InstdAmt> is the ' +
                    'original instructed amount, which comes from :33B:.',
                'mt52a>cdtragt':
                    ':52A: is the Ordering Institution — the payer’s side. <CdtrAgt> is the payee’s bank. ' +
                    'You have swapped the two agents, which sends the payment back where it came from.',
                'mt57a>dbtragt':
                    ':57A: is the Account With Institution — the bank that holds the beneficiary’s ' +
                    'account, so it becomes <CdtrAgt>, not <DbtrAgt>.',
                'mt20>none':
                    ':20: does have a home. Every pacs.008 needs a reference from the instructing ' +
                    'party — that is <InstrId>.',
                'mt59>dbtr':
                    ':59: is the Beneficiary Customer — the party being paid. That is <Cdtr>. ' +
                    '<Dbtr> is the payer, which comes from :50K:.'
            },

            // One hint per source field, offered only for fields still unsolved.
            hints: [
                { id: 'mt32a', hint: 'Read :32A: character by character: 260627 USD 400,00. That is three separate facts crammed into one field. How many ISO elements does it take to hold them?' },
                { id: 'mt59',  hint: ':59: carries a slash-prefixed account line and a name. ISO 20022 refuses to mix those two — it has a distinct element for each.' },
                { id: 'mt33b', hint: 'You have two amounts on the left and two amount elements on the right. One pair is what the customer asked to send; the other is what the banks actually settle. They are not the same number when a fee is taken.' },
                { id: 'mt23b', hint: 'CRED means "this is a credit transfer". In ISO 20022 that fact is carried by the choice of message itself. So what is left for the field to map to?' },
                { id: 'mt52a', hint: 'Ordering Institution and Account With Institution sit on opposite ends of the payment. One is the payer’s bank, one is the payee’s. Do not let the order on the page fool you.' },
                { id: 'mt20',  hint: 'A sender’s reference identifies the instruction, not the end-to-end payment. ISO has separate elements for those two ideas — you want the instruction one.' }
            ],

            debrief:
                "Ten fields became twelve links, and that gap is the entire migration problem in " +
                "miniature.\n\n" +
                ":32A: split into a date and an amount. :59: split into a name and an account, because " +
                "ISO 20022 refuses to keep shoving structured data into free text the way MT did. " +
                ":33B: and :32A: stayed apart, because the instructed amount and the settled amount are " +
                "genuinely different numbers the moment a charge is deducted. And :23B: went nowhere, " +
                "because \"this is a credit transfer\" is now said by which message you chose to send.\n\n" +
                "This is why migration is hard and why it is worth doing. The information was always " +
                "there in the MT — it was just jammed into fields that no machine could read reliably.",

            next: [
                { id: '208-the-end-of-mt', why: 'Why MT is being retired, and what replaces it' },
                { id: '603-structured-addresses', why: 'The same fight over free text, one field further on' },
                { id: '601-remittance-information', why: 'What :70: becomes when it grows up' }
            ]
        },

        // ---------------------------------------------------------------------
        // WORKSHOP 3 · THE MONEY COMES BACK
        // A triage exercise. Every step is a decision a real operator makes under
        // time pressure, and each wrong option is wrong for a reason worth
        // hearing. The steps are sequential because that is how the decision
        // actually works: get the first one wrong and everything after it is
        // wrong too, no matter how confidently you answer.
        // ---------------------------------------------------------------------
        'r-transaction': {
            kind: 'decide',
            title: 'The Money Comes Back',
            kicker: 'Exception flow',

            brief:
                "The pacs.008 settled cleanly at 09:41. Emirates NBD is out USD 400.00, HDFC has it, " +
                "and everybody's day was going fine.\n\n" +
                "At 11:15 HDFC's booking engine tries to credit Sweety's account and finds it closed — " +
                "she moved banks three weeks ago and nobody told Bob. The money is sitting in a " +
                "suspense account in Mumbai and somebody has to decide what happens to it.",

            given: [
                'The payment settled — HDFC genuinely holds the funds',
                'Original UETR eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4',
                'EndToEndId BOB-INV0042, ChrgBr was SHAR',
                'Nobody has asked for the money back — HDFC simply cannot deliver it'
            ],

            task:
                'Five decisions, in order. Each one follows from the last, so get the first right ' +
                'before you worry about the rest.',

            steps: [
                {
                    id: 'kind',
                    q: 'What has happened here, in ISO 20022 terms?',
                    type: 'pick',
                    options: [
                        { id: 'reject',   label: 'A Reject',   sub: 'the message was refused before it settled' },
                        { id: 'return',   label: 'A Return',   sub: 'settled funds are being sent back' },
                        { id: 'recall',   label: 'A Recall',   sub: 'the sender is asking for the money back' },
                        { id: 'reversal', label: 'A Reversal', sub: 'an erroneous instruction is being undone' }
                    ],
                    answer: 'return',
                    wrong: {
                        reject: 'A Reject happens *before* settlement — the receiving bank or CSM refuses the message and no money ever moves. Here the payment settled at 09:41 and HDFC is holding real funds. You cannot reject money you have already been paid.',
                        recall: 'A Recall is initiated by the *sender*, asking for the money back — wrong payee, duplicate, fraud. Nobody at Emirates NBD has asked for anything. HDFC is the one who cannot deliver, so HDFC initiates.',
                        reversal: 'A Reversal undoes an instruction the originator should never have sent. The instruction here was perfectly valid — Bob genuinely meant to pay Sweety. What failed was delivery at the far end.'
                    },
                    why: 'The payment settled and cannot be delivered, so the receiving bank sends it back on its own initiative. That is a Return — and the trigger being *delivery failure* rather than *sender regret* is what separates it from a Recall.'
                },
                {
                    id: 'msg',
                    q: 'Which message carries it?',
                    type: 'pick',
                    options: [
                        { id: 'pacs002', label: 'pacs.002', sub: 'FIToFIPaymentStatusReport' },
                        { id: 'pacs004', label: 'pacs.004', sub: 'PaymentReturn' },
                        { id: 'camt056', label: 'camt.056', sub: 'FIToFIPaymentCancellationRequest' },
                        { id: 'pacs007', label: 'pacs.007', sub: 'FIToFIPaymentReversal' }
                    ],
                    answer: 'pacs004',
                    wrong: {
                        pacs002: 'A pacs.002 reports status — ACCP, ACSP, RJCT. It moves information, never money. A returned payment has to actually move USD 400.00 back across the border, and a status report cannot do that.',
                        camt056: 'camt.056 is how you *ask* for a cancellation — it is the Recall message. HDFC is not asking anyone for permission; it already knows it cannot deliver and is sending the funds back.',
                        pacs007: 'pacs.007 is a Reversal, used to undo an instruction that was wrong at source — most often on the direct debit side. This instruction was correct; only the destination account failed.'
                    },
                    why: 'pacs.004 PaymentReturn is the only message in the family that both moves funds and says why. It carries <RtrdIntrBkSttlmAmt> — the amount going back — alongside the reason.'
                },
                {
                    id: 'code',
                    q: 'Which reason code does the return quote?',
                    type: 'code',
                    set: 'reason',
                    answer: 'AC04',
                    shortlist: ['AC01', 'AC04', 'AC06', 'BE04', 'MS03', 'AM04'],
                    wrong: {
                        AC01: 'AC01 IncorrectAccountNumber means the number is malformed or does not exist. Sweety’s account number was perfectly valid — it simply is not open any more. The distinction matters, because AC01 suggests Bob mistyped something and AC04 tells him the truth.',
                        AC06: 'AC06 BlockedAccount means the account exists and is frozen — a sanction, a court order, a fraud hold. A closed account is not blocked, it is gone. Sending AC06 would imply something legally serious that is not happening.',
                        BE04: 'BE04 MissingCreditorAddress is about incomplete party data. The address was never the problem here.',
                        MS03: 'MS03 NotSpecified is the code you use when you cannot say why — often for privacy. Using it when you know exactly why guarantees the sending bank has to open an investigation to learn what you already knew.',
                        AM04: 'AM04 InsufficientFunds is about the *debtor* not having the money. The money arrived fine; it is the destination that failed.'
                    },
                    why: 'AC04 ClosedAccountNumber says precisely what went wrong, which lets Emirates NBD tell Bob something useful — "her account is closed, get new details" — instead of "it bounced".'
                },
                {
                    id: 'dir',
                    q: 'Where does the pacs.004 go?',
                    type: 'pick',
                    options: [
                        { id: 'back',   label: 'HDFC → Emirates NBD', sub: 'back along the chain it came down' },
                        { id: 'fwd',    label: 'Emirates NBD → HDFC', sub: 'the same direction as the original' },
                        { id: 'direct', label: 'HDFC → Bob',          sub: 'straight to the payer' },
                        { id: 'cust',   label: 'HDFC → Sweety',       sub: 'to the intended beneficiary' }
                    ],
                    answer: 'back',
                    wrong: {
                        fwd: 'That is the direction the original travelled. A return retraces the chain — the bank holding the money sends it to the bank that sent it.',
                        direct: 'HDFC has no relationship with Bob and no way to credit him. Banks settle with the banks they hold accounts with; the money has to walk back the way it came.',
                        cust: 'Sweety is precisely who cannot be credited — that is the whole problem.'
                    },
                    why: 'Returns retrace the settlement chain in reverse, hop by hop. Each leg unwinds the leg that created it, which is what keeps every nostro/vostro pair reconciling.'
                },
                {
                    id: 'amount',
                    q: 'Bob asks whether he gets his USD 400.00 back. What do you tell him?',
                    type: 'pick',
                    options: [
                        { id: 'full',    label: 'Yes — the full 400.00',      sub: 'a return always restores the original amount' },
                        { id: 'net',     label: 'Probably not the full 400',  sub: 'return charges can be deducted along the way' },
                        { id: 'nothing', label: 'Nothing — the funds are stuck', sub: 'the money stays in suspense' },
                        { id: 'plus',    label: 'The full 400 plus compensation', sub: 'the receiving bank owes interest' }
                    ],
                    answer: 'net',
                    wrong: {
                        full: 'Tempting, and often wrong. The returned amount travels in <RtrdIntrBkSttlmAmt>, which is a separate element from the original <IntrBkSttlmAmt> precisely because the two can differ. Banks in the chain may deduct their return charges, declared in <ChrgsInf>.',
                        nothing: 'The funds are not stuck — that is exactly what the return exists to prevent. Money sitting in suspense is a problem for HDFC too, not a resting state.',
                        plus: 'Compensation and interest claims are a separate process with their own rules and thresholds. A plain return does not carry them.'
                    },
                    why: 'The returned amount is its own element — <RtrdIntrBkSttlmAmt> — with <ChrgsInf> alongside it to declare what was taken. If returns always restored the original amount exactly, ISO would not have needed a second element to hold the figure.'
                }
            ],

            debrief:
                "Five decisions, and the first one determined all four that followed. Get \"is this a " +
                "reject or a return\" wrong and you spend the afternoon building a message that " +
                "cannot move money.\n\n" +
                "The distinction is always the same question: had it settled, and who is unhappy? " +
                "Not settled yet — reject. Settled but undeliverable — return. Settled and the " +
                "sender wants it back — recall. Settled and the instruction itself was wrong — reversal.\n\n" +
                "And the reason code is not paperwork. AC04 instead of MS03 is the difference between " +
                "Bob learning \"her account is closed, ask her for new details\" today, and an " +
                "investigation that takes two weeks to reach the same sentence.",

            next: [
                { id: '402-return', why: 'The return, in full' },
                { id: '407-the-r-transactions-map', why: 'All four R-transactions on one map' },
                { id: '408-reason-codes', why: 'Why the code you pick decides what the customer is told' }
            ]
        },

        // ---------------------------------------------------------------------
        // WORKSHOP 4 · THE ADDRESS DEADLINE
        // The November 2026 structured-address mandate, worked as five decisions.
        // The trap sequence mirrors how this goes wrong in real remediation
        // projects: people misdiagnose *what* the rule requires (step 1), then
        // over- or under-repair (step 2), then get the town/country pair subtly
        // wrong (step 3), then patch the message instead of the database
        // (step 4) — and never learn why the rule exists at all (step 5).
        // Facts align with lesson 603 and the deadlines calendar (2026-11-14).
        // ---------------------------------------------------------------------
        'address-deadline': {
            kind: 'decide',
            title: 'The Address Deadline',
            kicker: 'Compliance deadline',

            brief:
                "Run the tape forward to Monday 16 November 2026 — the first business day after " +
                "CBPR+ stops accepting free-text-only addresses on cross-border payments.\n\n" +
                "Bob's monthly payment to Sweety went out the way it has all year. This time it " +
                "bounced at the first screening hop. The creditor's PstlAdr block carries exactly " +
                "two AdrLine elements — “FLAT 3B LOTUS HEIGHTS” and “KORAMANGALA " +
                "BENGALURU INDIA” — and nothing else. No structured elements at all.\n\n" +
                "Operations want it repaired and re-sent this morning — and want to know why " +
                "December's run won't do the same thing.",

            given: [
                'The mandate took effect 14 November 2026 (CBPR+ · key market infrastructures)',
                'In scope: pacs.008/009/004/003 and the pain.001 flows that feed them',
                'There is no Swift contingency for non-compliant addresses',
                'Sweety lives at Flat 3B, Lotus Heights, Koramangala, Bengaluru, India'
            ],

            task:
                'Five decisions, in order. The first is a diagnosis — get it right or every ' +
                'repair that follows fixes the wrong thing.',

            steps: [
                {
                    id: 'why-rejected',
                    q: 'What exactly makes this address non-compliant?',
                    type: 'pick',
                    options: [
                        { id: 'adrline-dead', label: 'AdrLine is no longer a legal element', sub: 'free-text lines were removed from the schema' },
                        { id: 'no-floor',     label: 'No structured town and country',        sub: 'the address is free-text only' },
                        { id: 'too-long',     label: 'The lines exceed the length limit',     sub: '70 characters per AdrLine' },
                        { id: 'no-pstcd',     label: 'The postcode is missing',               sub: 'PstCd became mandatory' }
                    ],
                    answer: 'no-floor',
                    wrong: {
                        'adrline-dead': 'Tempting — but AdrLine survives the deadline. The hybrid shape explicitly permits up to two 70-character AdrLine elements, as long as town and country are structured beside them. The element is not dead; travelling *alone* is what stopped being legal.',
                        'too-long': 'Both lines are comfortably inside 70 characters — and length was never the November rule. A short blob is still a blob: the screening machine cannot tell KORAMANGALA is a neighbourhood, BENGALURU a town, or INDIA a country.',
                        'no-pstcd': 'PstCd is a nice-to-have, not the floor. The mandate’s minimum is the pair screening actually needs: town and country in their own named elements. An address can pass with no postcode at all.'
                    },
                    why: 'The floor is always the same pair: TwnNm and Ctry, structured. This address carries everything as free text, so the machine reading it is back to guessing which word is the town — which is precisely what the mandate exists to end.'
                },
                {
                    id: 'min-repair',
                    q: 'Operations want the minimum compliant repair, this morning. Which is it?',
                    type: 'pick',
                    options: [
                        { id: 'full',    label: 'Fully structured, every component', sub: 'StrtNm, BldgNb, PstCd, TwnNm, Ctry — no AdrLine' },
                        { id: 'hybrid',  label: 'Hybrid: structure town + country', sub: 'TwnNm + Ctry, keep ≤2 AdrLine for the rest' },
                        { id: 'shovel',  label: 'Move the whole text into StrtNm',  sub: 'one structured element, validation passes' },
                        { id: 'drop',    label: 'Drop the address block entirely',  sub: 'no address, nothing to reject' }
                    ],
                    answer: 'hybrid',
                    wrong: {
                        full: 'The destination, not the minimum. Fully structured is where the industry is steering — but it demands you already know which fragment is the street and which the building, and that certainty lives in the customer record, not in this morning’s queue. The mandate’s pragmatic middle exists for exactly this repair.',
                        shovel: 'This passes schema validation and is the worst option on the card. Screening now *confidently* parses garbage — a neighbourhood, a town and a country all filed as a street name. Structure faked is worse than structure absent, because nothing downstream knows to distrust it.',
                        drop: 'Global transparency rules require the parties to a payment to be identifiable — an address is part of how. Deleting data to dodge a data-quality rule trades a format rejection for a compliance investigation.'
                    },
                    why: 'Hybrid is the deadline’s deliberate escape valve: TwnNm and Ctry structured — the parts screening needs — with up to two AdrLine elements carrying what you cannot yet decompose. Minimum repair, honest data.'
                },
                {
                    id: 'right-block',
                    q: 'Which repaired block is actually correct?',
                    type: 'pick',
                    options: [
                        { id: 'kora',    label: '<TwnNm>Koramangala</TwnNm> <Ctry>IN</Ctry>', sub: 'the line before the city name' },
                        { id: 'india',   label: '<TwnNm>Bengaluru</TwnNm> <Ctry>INDIA</Ctry>', sub: 'country written out in full' },
                        { id: 'correct', label: '<TwnNm>Bengaluru</TwnNm> <Ctry>IN</Ctry>',    sub: 'town, plus the two-letter code' },
                        { id: 'both',    label: '<TwnNm>Koramangala Bengaluru</TwnNm> <Ctry>IN</Ctry>', sub: 'keep both words to be safe' }
                    ],
                    answer: 'correct',
                    wrong: {
                        kora: 'Koramangala is a neighbourhood of Bengaluru, not the town. File it as TwnNm and screening now checks the wrong geography — the machine believes you, which is exactly why feeding it a plausible-looking wrong value is dangerous. The district can stay in an AdrLine.',
                        india: 'Ctry is an ISO 3166 two-letter code, not a word. INDIA fails validation; IN cannot be mistaken for a word in the street. That unmistakability is the whole reason the element is a code.',
                        both: '"Both to be safe" puts a compound blob back inside a structured element — the swamp reforming one field down. TwnNm holds the town. The rest of the address has a legal home: the remaining AdrLine.'
                    },
                    why: 'Bengaluru is the town; IN is the code. The precision matters because downstream nobody re-checks it: structured elements are *believed*. That trust is the feature — and the responsibility.'
                },
                {
                    id: 'real-fix',
                    q: 'This payment now passes. Where must the fix live so December’s doesn’t bounce too?',
                    type: 'pick',
                    options: [
                        { id: 'formatter', label: 'The bank’s outbound formatter',      sub: 'auto-structure every address at send time' },
                        { id: 'master',    label: 'The customer record, and the pain.001', sub: 'fix the data where the address is born' },
                        { id: 'swift',     label: 'Swift in-flight enrichment',            sub: 'let the network repair it in transit' },
                        { id: 'inbound',   label: 'HDFC’s inbound parser',             sub: 'the receiver can reassemble the blob' }
                    ],
                    answer: 'master',
                    wrong: {
                        formatter: 'A formatter can only emit what it is given — perfect XML over a 1998 blob emits a blob. Worse, an auto-structurer that guesses is the shovel from step two running at industrial scale. Some banks do run parsing assists, but as a bridge while the data is cleansed, never as the fix.',
                        swift: 'There is no Swift contingency for this mandate — that is stated policy, not an oversight. Nothing in transit will repair the address; non-compliant messages are rejected or delayed, which is how this morning started.',
                        inbound: 'The receiver is the one party who *cannot* know Sweety’s address better than the sender. An unstructured address cannot self-structure downstream — that is why the mandate reaches back to pain.001, where the instruction is born.'
                    },
                    why: 'The deadline is a data project wearing XML clothes. The address lives in a customer master; the pain.001 carries it into the world; every message after that inherits it. Fix the record once and every future payment is born compliant.'
                },
                {
                    id: 'why-rule',
                    q: 'Compliance asks: why did regulators actually force this?',
                    type: 'pick',
                    options: [
                        { id: 'screening', label: 'Sanctions screening precision', sub: 'labelled town + country sharpen every check' },
                        { id: 'tidy',      label: 'Data hygiene',                  sub: 'structured XML is simply better practice' },
                        { id: 'speed',     label: 'Settlement speed',              sub: 'structured payments clear faster' },
                        { id: 'fees',      label: 'Cost reduction',                sub: 'free-text repair fees were adding up' }
                    ],
                    answer: 'screening',
                    wrong: {
                        tidy: 'Nobody mandates an industry-wide, deadline-backed migration for tidiness. The structure is the means; the end is what a machine can now do with it.',
                        speed: 'Settlement timing is set by rails and cut-offs, not address shape. A structured address does not clear faster — it *screens* cleaner, which is a different bottleneck.',
                        fees: 'Repair fees are real but incidental. The cost that moved regulators is measured in compliance queues and missed hits, not repair charges.'
                    },
                    why: 'A watchlist check against KORAMANGALA BENGALURU INDIA is word-matching; against <TwnNm>Bengaluru</TwnNm><Ctry>IN</Ctry> it is a precise geographic test. Fewer false positives, fewer missed true ones — the entire industry’s screening machinery gets sharper because the data finally says what it means.'
                }
            ],

            debrief:
                "Five decisions, and the shape repeats what every real remediation desk learns: the " +
                "rule is not \"AdrLine is dead\", it is \"town and country must be labelled\". The " +
                "minimum repair is hybrid, the correct repair names the *actual* town with the " +
                "*actual* code — and the lasting repair is not in the message at all.\n\n" +
                "The step most people fail in production is the shovel: moving the blob into " +
                "StrtNm because it makes the validator go green. Remember what structure means " +
                "downstream — structured elements are believed. Faking them does not hide bad " +
                "data; it launders it.\n\n" +
                "And the deadline itself? A data-cleansing project with an XML costume. If your " +
                "customer master holds addresses as three untyped lines from 1998, that is where " +
                "November 2026 actually lives.",

            next: [
                { id: '603-structured-addresses', why: 'The field, both legal shapes, and the deadline in full' },
                { id: '301-pacs-008', why: 'Where PstlAdr rides in the message that moves the money' },
                { id: '208-the-end-of-mt', why: 'The previous deadline this one follows' }
            ]
        },

        // ---------------------------------------------------------------------
        // WORKSHOP 5 · THE RECONCILIATION DESK
        // The corporate side of the standard, worked as a morning triage. The
        // sequence is deliberately the ERP's own order of operations: prove the
        // statement is whole BEFORE trusting any line in it (step 1), then work
        // the exception queue one failure-family at a time — a batch entry read
        // at the wrong level (2), a free-text remittance that cannot be parsed
        // (3), a date confusion that is not an error at all (4) — and finally
        // name the single lever that shortens the queue for good (5).
        // Facts, references and the balance chain align with lesson 311.
        // ---------------------------------------------------------------------
        'reconciliation-desk': {
            kind: 'decide',
            title: 'The Reconciliation Desk',
            kicker: 'Reconciliation challenge',

            brief:
                "06:10, Bengaluru. Sweety's finance system has pulled last night's camt.053 for " +
                "the company account and stopped with a red banner: the statement did not tie out, " +
                "and three entries are sitting in the exception queue.\n\n" +
                "The statement says opening booked 120,000.00 INR and closing booked 153,000.00 INR. " +
                "The entries it carries add up to +28,000.00.\n\n" +
                "The queue holds: a single 4,400,000.00 debit posted the night payroll ran; a " +
                "33,000.00 credit whose remittance information reads “payment for June invoice thx”; " +
                "and a 5,000.00 credit that the ledger insists arrived yesterday, not today.\n\n" +
                "Sweety wants her coffee. Work the desk.",

            given: [
                'Opening booked (OPBD) 120,000.00 INR · Closing booked (CLBD) 153,000.00 INR',
                'The entries present sum to +28,000.00 INR',
                'Payroll that night paid 200 salaries totalling 4,400,000.00',
                'The company issues ISO 11649 creditor references (RF…) on every invoice'
            ],

            task:
                'Five decisions, in the order an ERP actually takes them. The first is not a ' +
                'matching question — it is whether the file can be trusted at all.',

            steps: [
                {
                    id: 'whole',
                    q: 'The banner fired before a single entry was matched. What did the system check, and what does the result mean?',
                    type: 'pick',
                    options: [
                        { id: 'chain',  label: 'The balance chain — and an entry is missing', sub: 'OPBD + entries ≠ CLBD, so the statement is incomplete' },
                        { id: 'dupe',   label: 'Duplicate detection — an entry is counted twice', sub: 'the file over-reports' },
                        { id: 'queue',  label: 'The exception queue — three unmatched entries', sub: 'matching failed first' },
                        { id: 'nothing',label: 'Nothing is wrong — 5,000 is simply pending',  sub: 'the gap resolves itself tomorrow' }
                    ],
                    answer: 'chain',
                    wrong: {
                        dupe: 'A duplicate would push the entry sum *past* the closing balance, not leave it short. Here 120,000 + 28,000 = 148,000 against a stated close of 153,000 — the file reports 5,000 less movement than it claims to have ended with. Something is absent, not doubled.',
                        queue: 'The queue is a *matching* problem, and matching happens after the statement is trusted. The banner fired first because the arithmetic failed first — and reconciling entries inside a statement that cannot prove it is whole is how you build confidently wrong books.',
                        nothing: 'Pending items are exactly why the check exists. A booked closing balance must be reconcilable from booked entries; if 5,000 is missing from the movements but present in CLBD, that gap has to be explained before anything downstream is trusted — not waved through.'
                    },
                    why: 'Opening + entries must equal closing: 120,000 + 28,000 = 148,000, but CLBD says 153,000. The statement is short by exactly 5,000 — the same figure as the disputed credit. The equation is the first thing a reconciliation engine checks, because it is the statement proving it is whole.'
                },
                {
                    id: 'batch',
                    q: 'Payroll paid 200 people, but the statement carries one 4,400,000.00 entry. What must the system do with it?',
                    type: 'pick',
                    options: [
                        { id: 'explode', label: 'Read down to the TxDtls', sub: 'one entry, 200 transactions inside it' },
                        { id: 'split',   label: 'Ask the bank to re-issue it unbatched', sub: 'one entry per employee' },
                        { id: 'headline',label: 'Match the headline against the payroll run', sub: 'one payment, one total' },
                        { id: 'ignore',  label: 'Exclude it from reconciliation', sub: 'payroll reconciles in the HR system' }
                    ],
                    answer: 'explode',
                    wrong: {
                        split: 'The bank is not doing anything wrong. Batch booking is a legitimate, normal posting choice — a batch-booked entry carries a Btch summary (NbOfTxs and total) precisely so it can be posted as one line and still be reconciled. Asking for a re-issue outsources your own parsing gap.',
                        headline: 'Tempting, and it will even appear to work — the total matches. But you have then reconciled one payment where there are two hundred, so no individual salary is ever confirmed and a single failed credit inside the batch is invisible. It is the same trap as accepting a PART status without reading the transactions underneath.',
                        ignore: 'The money left the bank account, so it belongs to the bank reconciliation whether or not HR tracks it separately. Excluding it also breaks the balance chain you just validated.'
                    },
                    why: 'A batch-booked entry is a summary with many TxDtls beneath it — one per employee. Always reconcile at transaction level: the headline figure tells you the batch settled, not that every person in it got paid.'
                },
                {
                    id: 'ustrd',
                    q: 'The 33,000.00 credit says “payment for June invoice thx”. Why did it fail, and what is the right move now?',
                    type: 'pick',
                    options: [
                        { id: 'unstructured', label: 'It arrived as Ustrd — match on fallbacks, then fix upstream', sub: 'free text cannot be reliably parsed' },
                        { id: 'parse',        label: 'Parse the text for “June” and the amount',  sub: 'the invoice is inferable' },
                        { id: 'bankfault',    label: 'The bank stripped the reference — raise it with them', sub: 'the Strd block was dropped in transit' },
                        { id: 'writeoff',     label: 'Leave it in unapplied cash indefinitely',  sub: 'nothing more can be done' }
                    ],
                    answer: 'unstructured',
                    wrong: {
                        parse: 'This is the single most expensive habit on a reconciliation desk. Free text can be *guessed* at, never parsed reliably — and a wrong automatic match is far worse than no match, because it clears the wrong invoice silently and someone chases a customer who already paid. If you cannot match confidently, the queue is the correct destination.',
                        bankfault: 'Nothing was stripped. The entry still carries EndToEndId and UETR in Refs — what is missing is a structured CdtrRefInf, and it is missing because the *payer* never supplied one. Blaming the bank hides the actual fix.',
                        writeoff: 'The entry has more identifiers than the remittance line: EndToEndId BOB-INV0042 and a UETR are both present. There is a confident match available before any human types anything.'
                    },
                    why: 'Ustrd is free text; Strd carries a machine-readable reference like RF18INV0042. The documented match order still saves this one — structured reference, then EndToEndId, then UETR, then amount-plus-name as a fuzzy last resort. EndToEndId BOB-INV0042 resolves it cleanly.'
                },
                {
                    id: 'dates',
                    q: 'The 5,000.00 credit shows BookgDt today and ValDt yesterday. The ledger booked it yesterday. Who is wrong?',
                    type: 'pick',
                    options: [
                        { id: 'nobody',  label: 'Nobody — the two dates mean different things', sub: 'reconcile on BookgDt, forecast on ValDt' },
                        { id: 'bank',    label: 'The bank — the dates should match',            sub: 'a posting error' },
                        { id: 'ledger',  label: 'The ledger — it should always use ValDt',      sub: 'value date is authoritative' },
                        { id: 'both',    label: 'Both — the entry is a duplicate',              sub: 'the same credit posted twice' }
                    ],
                    answer: 'nobody',
                    wrong: {
                        bank: 'They routinely differ, entirely legitimately — back-valued credits, weekend and holiday value dating, correspondent timing. Two separate elements exist precisely because the two facts are separate; if they always matched, ISO would only have needed one.',
                        ledger: 'Value date tells treasury when funds are *available* to spend, which is a forecasting question. Reconciliation posts off the booking date — when the movement actually hit the books. Swap them and your bank reconciliation drifts against your cash position every time a value date is back-dated.',
                        both: 'Nothing here suggests duplication: one entry, one AcctSvcrRef. Reaching for "duplicate" whenever two dates disagree manufactures exceptions out of normal banking.'
                    },
                    why: 'BookgDt is when it hit the books; ValDt is when the money is usable. Booked ≠ available. This entry is fine — and it is the 5,000 that closes the balance-chain gap from step one, which is why proving the statement first told you exactly where to look.'
                },
                {
                    id: 'lever',
                    q: 'Sweety asks what actually shortens this queue for good. What do you tell her?',
                    type: 'pick',
                    options: [
                        { id: 'strd',   label: 'Get payers to send structured references', sub: 'RF-format creditor reference on every payment' },
                        { id: 'fuzzier',label: 'Loosen the fuzzy matching rules',          sub: 'match more entries automatically' },
                        { id: 'staff',  label: 'Staff the exception queue properly',       sub: 'clear it faster each morning' },
                        { id: 'daily',  label: 'Ask the bank for intraday camt.052s',      sub: 'see the entries sooner' }
                    ],
                    answer: 'strd',
                    wrong: {
                        fuzzier: 'Loosening thresholds converts unmatched entries into *wrongly* matched ones — clearing the wrong invoice, chasing a customer who has already paid, and a queue that looks shorter while the books get worse. Precision is the point of the reference.',
                        staff: 'That makes the symptom survivable, permanently. Every entry in that queue is human minutes that a structured reference would have made unnecessary — you would be hiring to do what one field does for free.',
                        daily: 'Intraday reporting tells you about movements *earlier*; it does not make them more matchable. An unstructured credit at 11:00 is exactly as unmatchable as the same credit at 06:00.'
                    },
                    why: 'The company already issues RF-format references on its invoices — the gap is payers not quoting them back in Strd. A finance team’s auto-reconciliation rate rises and falls almost entirely on which shape the money arrives in, which is the corporate case for the whole standard in one field.'
                }
            ],

            debrief:
                "Notice the order you just worked in: prove the statement, then match. That sequence " +
                "is not fussiness — the missing 5,000 in step one turned out to be the perfectly " +
                "healthy entry in step four, and you would never have found it by starting with the " +
                "exception queue.\n\n" +
                "Three exceptions, three different families. A batch entry read at the wrong level " +
                "is a parsing failure. A free-text remittance is an upstream data failure. Two dates " +
                "disagreeing is not a failure at all — it is two different facts being reported " +
                "correctly. Most reconciliation pain is one of those three, and telling them apart " +
                "is most of the skill.\n\n" +
                "And the lasting fix is never in the reconciliation engine. It is one field, " +
                "supplied by whoever sends the money.",

            next: [
                { id: '311-camt-053-reconciliation', why: 'The statement read line by line, the way an ERP does' },
                { id: '601-remittance-information', why: 'The field that decides whether matching is automatic' },
                { id: '303-camt-family', why: 'Where the statement sits among the reporting messages' }
            ]
        },

        // ---------------------------------------------------------------------
        // WORKSHOP 6 · THE COVER PAYMENT
        // Serial vs cover routing, from the receiving end — the seat where the
        // distinction actually bites. The learner reasons from symptom (an
        // instruction with no matching funds) to routing model (2), to the leg
        // that ties them (3), to the block that exists because of a real
        // money-laundering reform (4), and finally to the CORE/COV distinction
        // being about whose money moves, not how much (5).
        // Facts, BICs and the shared UETR align with lesson 312.
        // ---------------------------------------------------------------------
        'cover-payment': {
            kind: 'decide',
            title: 'The Cover Payment',
            kicker: 'Routing challenge',

            brief:
                "You are on the payments desk at HDFC Bank in Mumbai.\n\n" +
                "At 09:31 a pacs.008 arrived directly from Emirates NBD in Dubai: Bob Marsh is " +
                "paying Sweety Rao USD 400.00, UETR eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4. It is a " +
                "clean, complete customer instruction — and no money came with it.\n\n" +
                "At 09:44 USD 400.00 landed in your nostro from a correspondent, CORRINBB. The " +
                "message that carried it names two banks, quotes no customer, and carries a " +
                "different UETR.\n\n" +
                "Sweety is waiting. Operations want to know whether to credit her.",

            given: [
                'The pacs.008 came straight from EBILAEAD — no intermediary touched it',
                'The funds arrived separately, via CORRINBB',
                'The instruction and the funds do not share a UETR',
                'Amounts match exactly: USD 400.00 on both'
            ],

            task:
                'Five decisions. Start by naming what you are looking at — the rest follows from ' +
                'the routing model.',

            steps: [
                {
                    id: 'routing',
                    q: 'Information arrived direct; funds arrived separately. Which routing is this?',
                    type: 'pick',
                    options: [
                        { id: 'cover',  label: 'Cover',  sub: 'instruction direct, funds behind it through correspondents' },
                        { id: 'serial', label: 'Serial', sub: 'passed hand to hand, each bank relaying and settling' },
                        { id: 'onus',   label: 'On-us',  sub: 'both parties bank with the same institution' },
                        { id: 'broken', label: 'A broken serial chain', sub: 'an intermediary dropped the message' }
                    ],
                    answer: 'cover',
                    wrong: {
                        serial: 'In serial routing the pacs.008 is relayed hop by hop, each bank settling with the next — so the information and the money arrive together, from the same place. Here the instruction came straight from Dubai while the money came from a different bank entirely. Two paths means cover.',
                        onus: 'On-us means both parties hold accounts at the same bank, so nothing crosses a border and no correspondent is involved. There are three institutions in this story and an ocean between two of them.',
                        broken: 'Nothing is broken yet — this is the *designed* behaviour of cover routing. Two flows arriving separately, minutes apart, is exactly what you should expect. The problem is narrower than "the chain failed", and jumping there hides it.'
                    },
                    why: 'Cover routing splits a cross-border payment into two parallel flows: the pacs.008 goes straight to the creditor agent so the information arrives fast, and the funds are reimbursed separately through a chain of pacs.009 COV messages. Serial keeps them together; cover deliberately does not.'
                },
                {
                    id: 'funds-msg',
                    q: 'What is the message that brought the funds?',
                    type: 'pick',
                    options: [
                        { id: 'pacs009cov',  label: 'A pacs.009 COV',  sub: 'FI transfer covering a customer payment' },
                        { id: 'pacs009core', label: 'A pacs.009 CORE', sub: 'the bank moving its own money' },
                        { id: 'pacs008',     label: 'A second pacs.008', sub: 'the same customer payment again' },
                        { id: 'camt054',     label: 'A camt.054',      sub: 'a credit notification' }
                    ],
                    answer: 'pacs009cov',
                    wrong: {
                        pacs009core: 'This is the answer the evidence in front of you *supports* — and that is exactly the finding. It names only banks and carries no customer, which is what a CORE looks like. Hold that thought: it should have been a COV, and the next two steps are about what is missing.',
                        pacs008: 'A pacs.008 carries a customer payment, with human parties as Dbtr and Cdtr. The message that brought the funds names two financial institutions and no customer — different message, different job. And you would not fund a payment by sending the same instruction twice.',
                        camt054: 'A camt.054 *notifies* you of a credit; it reports, it does not settle. Something had to actually move the USD 400.00 into your nostro, and a reporting message cannot do that.'
                    },
                    why: 'The funds leg behind a customer payment is a pacs.009 COV — SttlmMtd COVE, and an UndrlygCstmrCdtTrf block naming the customer it funds. What you received behaves like a CORE: bank parties only, no underlying block. That gap is the whole case.'
                },
                {
                    id: 'link',
                    q: 'What was supposed to prove these two are one payment?',
                    type: 'pick',
                    options: [
                        { id: 'uetr',   label: 'A shared UETR on both legs', sub: 'the same value on instruction and cover' },
                        { id: 'amount', label: 'The matching amount and currency', sub: 'USD 400.00 on both' },
                        { id: 'e2e',    label: 'The EndToEndId',            sub: 'BOB-INV0042 carried through' },
                        { id: 'time',   label: 'Arrival within the same window', sub: 'thirteen minutes apart' }
                    ],
                    answer: 'uetr',
                    wrong: {
                        amount: 'Amount is not identity. Every USD 400.00 payment you receive today matches on amount and currency — that is a coincidence filter, not proof, and reconciling on it is how you credit the wrong customer with someone else’s money.',
                        e2e: 'EndToEndId is real and useful, but it is the *customer’s* reference, assigned by the debtor and meaningful between Bob and Sweety. It is not guaranteed unique across the interbank world, which is precisely the gap the UETR was created to close.',
                        time: 'Proximity in time is a hint, never evidence. On a busy corridor several payments of the same amount arrive in the same window, and end-of-day the correlation collapses entirely.'
                    },
                    why: 'The cover leg and the customer leg are one payment only because they carry the same UETR — a globally unique value, deliberately copied onto both. It is the single thread tying funds to instruction, which is why a mismatched one leaves you holding money you cannot attribute.'
                },
                {
                    id: 'underlying',
                    q: 'The cover names no customer. Why does that matter beyond your reconciliation?',
                    type: 'pick',
                    options: [
                        { id: 'screening', label: 'The funds chain cannot screen the real parties', sub: 'the block is mandatory for exactly this reason' },
                        { id: 'nicety',    label: 'It is a helpful convention, not a requirement',  sub: 'useful for matching only' },
                        { id: 'billing',   label: 'Charges cannot be allocated correctly',          sub: 'ChrgBr needs the customer' },
                        { id: 'nothing',   label: 'It does not — the pacs.008 already has them',    sub: 'the details exist elsewhere' }
                    ],
                    answer: 'screening',
                    wrong: {
                        nicety: 'It is an obligation, not a courtesy. A cover message is *required* to carry the underlying customer details — the requirement was created deliberately, after the industry discovered what happens without it.',
                        billing: 'Charge handling rides on the customer leg and does not depend on the cover naming anyone. This is a real field, but the wrong problem.',
                        nothing: 'That is precisely the pre-2009 assumption, and precisely the hole. *You* hold the pacs.008 — the correspondents in the funds chain do not. Every bank that touches the cash needs to see who is really paying whom, and they only have the cover message.'
                    },
                    why: 'Under the old MT202 a cover named only banks, so the correspondents moving the actual cash could not see the originator or beneficiary — a genuine money-laundering blind spot. After FATF pressure, MT202COV made the underlying details mandatory; UndrlygCstmrCdtTrf is the ISO 20022 form of that rule. A COV without it recreates the gap the reform closed.'
                },
                {
                    id: 'core-cov',
                    q: 'A colleague says “it is a CORE because it is only 400 dollars — COV is for the big ones.” Is that right?',
                    type: 'pick',
                    options: [
                        { id: 'whose',  label: 'No — it is about whose money moves and whether a customer sits behind it', sub: 'amount is irrelevant' },
                        { id: 'yes',    label: 'Yes — COV is used above scheme thresholds',        sub: 'value decides the form' },
                        { id: 'partly', label: 'Partly — small covers may omit the underlying block', sub: 'a de minimis exemption applies' },
                        { id: 'corridor', label: 'No — the corridor decides it',                   sub: 'some routes mandate COV' }
                    ],
                    answer: 'whose',
                    wrong: {
                        yes: 'There is no value threshold. A pacs.009 is used whenever the *bank’s* own money moves, and it is a COV whenever that movement is covering a customer payment — at 400 dollars or 400 million.',
                        partly: 'No de minimis exemption exists for the underlying block, and this is a dangerous belief to hold: the screening rationale applies at every amount, and structuring below a threshold is exactly the behaviour the rule was written to defeat.',
                        corridor: 'Corridors and market practice shape *whether cover routing is used at all*, but once a cover funds a customer payment, the form of the message follows from that fact, not from geography.'
                    },
                    why: 'Whose money is moving? Customer’s → pacs.008. Bank’s own → pacs.009. And a pacs.009 is COV rather than CORE when it funds an underlying customer payment — identified by SttlmMtd COVE and the UndrlygCstmrCdtTrf block. Amount never enters the decision.'
                }
            ],

            debrief:
                "The answer to “do I credit Sweety” is yes — you hold a complete, valid customer " +
                "instruction and USD 400.00 in your nostro. What you do not hold is proof they are " +
                "the same payment, and that is a defect in the cover leg, not in the instruction.\n\n" +
                "Two things went wrong upstream, and they are different in kind. The missing shared " +
                "UETR is an operational failure: it costs you a manual investigation today. The " +
                "missing UndrlygCstmrCdtTrf is a compliance failure: it means correspondents moved " +
                "money without being able to see whose it was — the exact blind spot MT202COV was " +
                "created to close in 2009, and that pacs.009 COV inherits.\n\n" +
                "The thing worth carrying out of this: cover routing is not a broken serial chain. " +
                "It is two flows by design, and it only works because one value appears on both.",

            next: [
                { id: '312-pacs-009-cover', why: 'pacs.009 CORE and COV, field by field' },
                { id: '503-cross-border-payment', why: 'Both legs running in parallel, end to end' },
                { id: '309-the-four-identifiers', why: 'Why the UETR is the one that ties legs together' }
            ]
        }
    };

    return { LIST, DEFS };
})();

window.WORKSHOPS = WORKSHOPS;
