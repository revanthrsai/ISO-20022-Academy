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
            blurb: 'The beneficiary account is closed. Choose the right R-transaction, the right reason code, and the right direction — then defend the choice.',
            minutes: 25,
            difficulty: 'Advanced',
            skills: ['Return vs. recall vs. reject', 'Reason codes', 'camt.056'],
            ready: false
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
        }
    };

    return { LIST, DEFS };
})();

window.WORKSHOPS = WORKSHOPS;
