// ===========================================================================
// quiz.data.js  —  Per-level knowledge-check questions for the Library.
// ===========================================================================
// Fresh, scenario-based retrieval practice — deliberately harder than the
// inline {{check}} gut-checks embedded in lessons. One quiz per Library level.
//
// All content data lives here (per project convention); the quiz UI in
// assets/js/quiz.js reads this object and never hardcodes questions.
//
// -------------------------- SCHEMA -----------------------------------------
// const ACADEMY_QUIZ = {
//   meta: { passPct: <number> },            // % correct needed to "pass"
//   levels: [
//     {
//       level:  <number>,                    // 100..600, matches TOC `level`
//       title:  <string>,                    // shown as the quiz heading
//       blurb:  <string>,                    // one-line description
//       questions: [ <Question>, ... ]
//     }, ...
//   ]
// };
//
// A <Question> is one of THREE types, discriminated by `type`:
//
//   // 1) single — exactly one correct option
//   { id, type:'single', prompt, ref?, tags?,
//     options: [ { text, correct:true|false }, ... ],
//     explanation }
//
//   // 2) multi — one or more correct options; the learner must pick ALL
//   //            correct and NO incorrect ones to score the point
//   { id, type:'multi', prompt, ref?, tags?,
//     options: [ { text, correct:true|false }, ... ],
//     explanation }
//
//   // 3) boolean — a statement judged true or false
//   { id, type:'boolean', prompt, ref?, tags?,
//     answer: true|false,
//     explanation }
//
// Field notes:
//   id           unique, stable ("q-<level>-<n>"). Used for scoring + storage.
//   ref          optional lesson id (a file in /content) the question tests,
//                so the UI can offer "review this lesson" on a wrong answer.
//   tags         optional, for future filtering / weak-area analysis.
//   explanation  ALWAYS present — shown after answering, right or wrong.
// ---------------------------------------------------------------------------

const ACADEMY_QUIZ = {
    meta: { passPct: 70 },

    levels: [
        // =================================================================
        {
            level: 100,
            title: "Fundamentals: How Money Moves",
            blurb: "Ledgers, clearing vs settlement, participants, and correspondent accounts.",
            questions: [
                {
                    id: "q-100-1",
                    type: "single",
                    prompt: "Two banks exchange payment instructions all morning and net down what each owes the other; at 4pm the central bank actually moves the net funds between their accounts. Which step is settlement?",
                    ref: "102-clearing-and-settlement",
                    tags: ["clearing", "settlement"],
                    options: [
                        { text: "The 4pm movement of funds with finality", correct: true },
                        { text: "The morning exchange of instructions", correct: false },
                        { text: "Both steps together are called settlement", correct: false },
                        { text: "Neither — this describes reconciliation", correct: false }
                    ],
                    explanation: "Clearing is exchanging instructions and calculating obligations; settlement is the final, irrevocable transfer of funds. The 4pm net movement is settlement."
                },
                {
                    id: "q-100-2",
                    type: "boolean",
                    prompt: "From Bob's bank's point of view, a 'nostro' account is the account it holds in its own books on behalf of a foreign bank.",
                    ref: "101-nostro-vostro",
                    tags: ["nostro", "vostro", "correspondent"],
                    answer: false,
                    explanation: "Reversed. A nostro is 'our account held at another bank' (our money, over there). The account a bank holds in its own books for a foreign bank is the vostro ('your account, here')."
                }
            ]
        },

        // =================================================================
        {
            level: 200,
            title: "Payment Architecture & the Standard",
            blurb: "Rails, gateways, hubs, switches, the BAH, CBPR+ vs HVPS+, and what ISO 20022 actually is.",
            questions: [
                {
                    id: "q-200-1",
                    type: "boolean",
                    prompt: "The same, schema-valid pacs.008 can be accepted on one network and rejected on another, without anything being wrong with the ISO 20022 standard itself.",
                    ref: "207-cbpr-and-hvps",
                    tags: ["cbpr+", "hvps+", "usage guidelines"],
                    answer: true,
                    explanation: "Correct. The standard gives shared meaning; the rulebooks (CBPR+, HVPS+) decide how it's actually used on each network. A message valid under one usage guideline can breach another."
                }
            ]
        },

        // =================================================================
        {
            level: 300,
            title: "The Message Families, Up Close",
            blurb: "pain, pacs, camt and head — the identifiers, the status codes, and the fields that bite.",
            questions: [
                {
                    id: "q-300-1",
                    type: "single",
                    prompt: "A message moves a customer's funds between two banks: the Debtor is a person, the Creditor is a company, and no customer is instructing their own bank inside it. Which message is it?",
                    ref: "301-pacs-008",
                    tags: ["pacs.008", "pain.001"],
                    options: [
                        { text: "pacs.008 — the interbank customer credit transfer", correct: true },
                        { text: "pain.001 — because a customer's money is moving", correct: false },
                        { text: "pacs.009 — any bank-to-bank message", correct: false },
                        { text: "camt.053 — it reports the movement", correct: false }
                    ],
                    explanation: "pacs.008 is the FI-to-FI customer credit transfer: a customer's money, moving between banks. pain.001 would be the customer instructing their OWN bank; pacs.009 moves a bank's own money; camt.053 only reports."
                },
                {
                    id: "q-300-2",
                    type: "boolean",
                    prompt: "A pacs.002 carrying the status ACSP means the funds have been credited to the beneficiary's account.",
                    ref: "310-status-reports",
                    tags: ["pacs.002", "status", "ACSP"],
                    answer: false,
                    explanation: "ACSP = Accepted, Settlement In Process — it's moving, not arrived. The money is the beneficiary's only at ACSC (settlement completed) / ACCC (creditor account credited)."
                },
                {
                    id: "q-300-3",
                    type: "multi",
                    prompt: "Which of the following are true of the UETR? (Select all that apply.)",
                    ref: "309-the-four-identifiers",
                    tags: ["uetr", "identifiers"],
                    options: [
                        { text: "It is a globally unique UUIDv4", correct: true },
                        { text: "It stays fixed for the payment's whole life", correct: true },
                        { text: "It ties a pacs.009 COV cover leg back to its pacs.008 customer leg", correct: true },
                        { text: "It changes at every hop, like MsgId", correct: false }
                    ],
                    explanation: "The UETR is a fixed UUIDv4 that rides the payment end to end and threads separate legs (like a cover) together. MsgId is the disposable, per-hop identifier — that's the one that changes."
                },
                {
                    id: "q-300-4",
                    type: "single",
                    prompt: "A camt.053 shows an opening booked balance (OPBD) of 120,000 and a closing booked balance (CLBD) of 153,000, with exactly one booked entry. For the statement to be internally consistent, that entry must be:",
                    ref: "311-camt-053-reconciliation",
                    tags: ["camt.053", "balances", "reconciliation"],
                    options: [
                        { text: "A credit of 33,000", correct: true },
                        { text: "A debit of 33,000", correct: false },
                        { text: "A credit of 153,000", correct: false },
                        { text: "Impossible to tell from balances alone", correct: false }
                    ],
                    explanation: "Opening balance + sum of entries = closing balance. 120,000 + X = 153,000, so X = +33,000, a credit. That balance-chain check is the first thing a reconciliation engine runs."
                },
                {
                    id: "q-300-5",
                    type: "single",
                    prompt: "What is the single distinction that separates a pacs.008 from a pacs.009?",
                    ref: "312-pacs-009-cover",
                    tags: ["pacs.008", "pacs.009"],
                    options: [
                        { text: "Whose money moves — a customer's (008) vs a financial institution's own (009)", correct: true },
                        { text: "The size of the amount — pacs.009 is for large values", correct: false },
                        { text: "The syntax — pacs.008 is XML, pacs.009 is JSON", correct: false },
                        { text: "Domestic vs cross-border", correct: false }
                    ],
                    explanation: "It's about whose money it is. pacs.008 moves a customer's funds (the banks are agents); pacs.009 moves the bank's own funds (the bank is the party). Amount, syntax and geography are irrelevant to the choice."
                },
                {
                    id: "q-300-6",
                    type: "boolean",
                    prompt: "A pacs.009 COV must carry the underlying customer credit transfer details so that every correspondent in the funds chain can screen the real originator and beneficiary.",
                    ref: "312-pacs-009-cover",
                    tags: ["pacs.009", "cover", "MT202COV", "screening"],
                    answer: true,
                    explanation: "True — this is the transparency fix behind MT202COV (2009). Without the underlying block, a cover payment would move funds while hiding the actual parties from the banks handling the cash."
                }
            ]
        },

        // =================================================================
        {
            level: 400,
            title: "Exceptions & Investigations",
            blurb: "Reject, return, recall, reversal, and the old and new investigation models.",
            questions: [
                {
                    id: "q-400-1",
                    type: "single",
                    prompt: "One question sorts a reject from a return. Which is it?",
                    ref: "401-reject",
                    tags: ["reject", "return", "R-transactions"],
                    options: [
                        { text: "Has the money settled yet?", correct: true },
                        { text: "Is the amount above a threshold?", correct: false },
                        { text: "Is it domestic or cross-border?", correct: false },
                        { text: "Did a human or a machine catch it?", correct: false }
                    ],
                    explanation: "A reject happens BEFORE settlement (no money moved, nothing to send back). A return happens AFTER settlement (money moved and must be physically sent back with a pacs.004)."
                },
                {
                    id: "q-400-2",
                    type: "boolean",
                    prompt: "Under the new investigations model, camt.110 replaces the old camt.026/027/028 set by carrying the kind of investigation as a structured reason code inside one generic request, rather than using a different message per situation.",
                    ref: "409-new-investigations",
                    tags: ["camt.110", "investigations"],
                    answer: true,
                    explanation: "That's the core idea: one generic Investigation Request (camt.110) plus a reason code, instead of a drawer full of narrow message types. The response is camt.111."
                }
            ]
        },

        // =================================================================
        {
            level: 500,
            title: "End-to-End Case Studies",
            blurb: "One payment pulling every family together — customer, payroll, cross-border, treasury.",
            questions: [
                {
                    id: "q-500-1",
                    type: "single",
                    prompt: "In a cover-method cross-border payment, the pacs.008 carries the information straight to the creditor agent. What settles the actual funds behind it, and what ties the two together?",
                    ref: "503-cross-border-payment",
                    tags: ["cross-border", "cover", "uetr"],
                    options: [
                        { text: "A pacs.009 COV chain between correspondents, reconciled by the shared UETR", correct: true },
                        { text: "A second pacs.008, matched by amount", correct: false },
                        { text: "A camt.053 statement at day's end", correct: false },
                        { text: "Nothing — the pacs.008 settles the funds itself", correct: false }
                    ],
                    explanation: "In the cover method, information (pacs.008) and funds (pacs.009 COV) travel as parallel legs. The shared UETR is what lets the creditor agent match the cover funds to the customer payment."
                }
            ]
        },

        // =================================================================
        {
            level: 600,
            title: "Data Quality & the Fields That Matter",
            blurb: "Remittance, structured addresses, purpose codes — the fields regulators and reconciliation care about.",
            questions: [
                {
                    id: "q-600-1",
                    type: "boolean",
                    prompt: "From November 2026, a cross-border CBPR+ payment whose party addresses are made only of free-text AdrLine elements stops being acceptable for in-scope parties.",
                    ref: "603-structured-addresses",
                    tags: ["structured address", "2026 deadline"],
                    answer: true,
                    explanation: "True. From Nov 2026 an address must be fully structured, or hybrid with town and country structured at minimum. Purely free-text AdrLine addresses are no longer accepted for in-scope parties and agents."
                }
            ]
        }
    ]
};
