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
            blurb: 'An MT103 has to become a pacs.008 before the window closes. Map every field, and decide what to do with the three that have nowhere obvious to go.',
            minutes: 25,
            difficulty: 'Core',
            skills: ['MT ↔ MX mapping', 'Structured addresses', 'Data truncation'],
            ready: false
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
        }
    };

    return { LIST, DEFS };
})();

window.WORKSHOPS = WORKSHOPS;
