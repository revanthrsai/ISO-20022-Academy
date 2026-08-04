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
        }
    };

    return { LIST, DEFS };
})();

window.WORKSHOPS = WORKSHOPS;
