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
                },
                {
                    id: "q-100-3",
                    type: "single",
                    prompt: "Stripped to its essence, what IS money?",
                    ref: "101-what-is-money",
                    tags: ["money", "trust", "ledgers"],
                    options: [
                        { text: "A promise — an IOU — that everyone agrees to trust", correct: true },
                        { text: "The physical coins and banknotes themselves", correct: false },
                        { text: "Gold sitting in a national vault", correct: false },
                        { text: "A fixed quantity set once by a government", correct: false }
                    ],
                    explanation: "Money isn't the token; it's a promise of value that a community agrees to trust and record. That's why moving it is really about updating trusted ledgers, not shipping objects."
                },
                {
                    id: "q-100-4",
                    type: "boolean",
                    prompt: "A payment, at its core, is information updating two ledgers plus everyone agreeing it really happened.",
                    ref: "102-what-is-a-payment",
                    tags: ["payment", "ledgers"],
                    answer: true,
                    explanation: "That's the whole game: one ledger goes down, another goes up, and the parties agree it's final. No physical cash has to move for value to move."
                },
                {
                    id: "q-100-5",
                    type: "single",
                    prompt: "In a simple credit transfer, the party who ultimately receives the funds is called the:",
                    ref: "105-payment-participants",
                    tags: ["participants", "creditor", "debtor"],
                    options: [
                        { text: "Creditor", correct: true },
                        { text: "Debtor", correct: false },
                        { text: "Debtor Agent", correct: false },
                        { text: "Instructing Agent", correct: false }
                    ],
                    explanation: "The Creditor is paid; the Debtor pays. Their banks are the Creditor Agent and Debtor Agent. Learn this cast once and the party names inside every message stop being a riddle."
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
                },
                {
                    id: "q-200-2",
                    type: "single",
                    prompt: "A card tap needs an authorised answer in well under a second. Which piece of bank infrastructure is purpose-built for that?",
                    ref: "204-payment-switch",
                    tags: ["switch", "real-time", "cards"],
                    options: [
                        { text: "The payment switch", correct: true },
                        { text: "The payment hub", correct: false },
                        { text: "The payment gateway", correct: false },
                        { text: "The Business Application Header", correct: false }
                    ],
                    explanation: "The switch is the specialised, split-second router: receive, route, authorise, reply — now. The hub orchestrates; the gateway is the front door; neither is built for sub-second card authorisation."
                },
                {
                    id: "q-200-3",
                    type: "single",
                    prompt: "Which component is best described as the central engine that takes each clean payment and decides where it goes, how, and on which rail?",
                    ref: "203-payment-hub",
                    tags: ["hub", "orchestration", "routing"],
                    options: [
                        { text: "The payment hub", correct: true },
                        { text: "The payment gateway", correct: false },
                        { text: "The payment switch", correct: false },
                        { text: "The correspondent bank", correct: false }
                    ],
                    explanation: "The hub is the orchestration brain. The gateway is the guarded front door where payments arrive and get validated; the switch is the real-time card router."
                },
                {
                    id: "q-200-4",
                    type: "boolean",
                    prompt: "The Business Application Header (head.001 / BAH) lets a network route a message without opening the business payload inside.",
                    ref: "201-business-application-header",
                    tags: ["BAH", "head.001", "routing"],
                    answer: true,
                    explanation: "True. The BAH is the envelope: who sent it, who it's for, what's inside. The network routes on the envelope, just like a postal system delivers without reading the letter."
                },
                {
                    id: "q-200-5",
                    type: "single",
                    prompt: "What is ISO 20022, most precisely?",
                    ref: "209-what-is-iso-20022",
                    tags: ["iso 20022", "standard", "data dictionary"],
                    options: [
                        { text: "A shared data dictionary of financial concepts plus a method for building messages from it", correct: true },
                        { text: "A messaging network operated by Swift", correct: false },
                        { text: "A single XML file format for payments", correct: false },
                        { text: "A Swift software product banks buy", correct: false }
                    ],
                    explanation: "It's a dictionary and a method, not a network or one format. Messages like pacs.008 are products of the standard; Swift merely carries them, and TARGET2/Fedwire speak it without Swift at all."
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
                },
                {
                    id: "q-400-3",
                    type: "single",
                    prompt: "Money has already settled at the beneficiary's bank, but it can't be applied and has to be physically sent back. Which exception is this?",
                    ref: "402-return",
                    tags: ["return", "pacs.004", "settlement"],
                    options: [
                        { text: "A return (pacs.004)", correct: true },
                        { text: "A reject", correct: false },
                        { text: "A recall (camt.056)", correct: false },
                        { text: "A reversal (pacs.007)", correct: false }
                    ],
                    explanation: "Settled but undeliverable = a return, sent back by the receiver with a pacs.004. A reject happens before settlement; a recall is the sender asking; a reversal is the originator undoing its own collection by right."
                },
                {
                    id: "q-400-4",
                    type: "single",
                    prompt: "After settlement, the SENDER realises its own mistake and asks for the money back — a request the receiver can grant or refuse. Which exception?",
                    ref: "403-recall",
                    tags: ["recall", "camt.056", "cancellation"],
                    options: [
                        { text: "A recall (camt.056, answered by camt.029)", correct: true },
                        { text: "A return (pacs.004)", correct: false },
                        { text: "A reversal (pacs.007)", correct: false },
                        { text: "A reject (pacs.002)", correct: false }
                    ],
                    explanation: "A recall is the sender politely asking for its money back — it can be granted or refused, never assumed. A return is the receiver volunteering it back; a reversal is undoing your own collection by right."
                },
                {
                    id: "q-400-5",
                    type: "multi",
                    prompt: "Which statements about reason codes (like AC04, AM04) are true? (Select all that apply.)",
                    ref: "408-reason-codes",
                    tags: ["reason codes", "external code sets"],
                    options: [
                        { text: "They are drawn from a shared external code set, not invented per bank", correct: true },
                        { text: "A failure should carry one, explaining exactly why", correct: true },
                        { text: "The prefix groups the cause (e.g. AC = account, AM = amount)", correct: true },
                        { text: "Each bank writes them as free text in its own words", correct: false }
                    ],
                    explanation: "Reason codes come from shared external lists, are grouped by prefix (AC04 = account closed, AM04 = insufficient funds), and turn a rejection from a mystery into a diagnosis. They're codes, not free text."
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
                },
                {
                    id: "q-500-2",
                    type: "single",
                    prompt: "A company pays 200 staff in one payroll run. How is that pain.001 structured?",
                    ref: "502-payroll",
                    tags: ["payroll", "batch", "pain.001"],
                    options: [
                        { text: "One GrpHdr, one PmtInf (shared debtor/date), and 200 CdtTrfTxInf blocks — one per employee", correct: true },
                        { text: "200 separate pain.001 files, one per employee", correct: false },
                        { text: "One PmtInf per employee, each with a single transaction", correct: false },
                        { text: "One pacs.008 sent by each employee to the company", correct: false }
                    ],
                    explanation: "Shared facts once, one transaction per payee: a single file fans out into hundreds of payments. That nesting is exactly what lets pain.001 scale from one tap to a whole payroll."
                },
                {
                    id: "q-500-3",
                    type: "boolean",
                    prompt: "In a domestic customer transfer, the EndToEndId set in Bob's pain.001 surfaces unchanged in Sweety's camt.054 notification — which is how her system matches the credit to the invoice.",
                    ref: "501-customer-transfer",
                    tags: ["end-to-end", "EndToEndId", "reconciliation"],
                    answer: true,
                    explanation: "True. The EndToEndId is sacred — preserved untouched across pain.001 → pacs.008 → camt.054 — so 'Invoice 0042' reaches the beneficiary's reconciliation the whole way through."
                },
                {
                    id: "q-500-4",
                    type: "single",
                    prompt: "At day's end a bank moves its OWN money to top up a nostro account so tomorrow's payments can flow. Which message carries this?",
                    ref: "504-treasury",
                    tags: ["treasury", "liquidity", "pacs.009"],
                    options: [
                        { text: "pacs.009 — no customer is attached; the bank is the party", correct: true },
                        { text: "pain.001 — the bank instructs itself", correct: false },
                        { text: "pacs.008 — the interbank workhorse", correct: false },
                        { text: "camt.053 — the end-of-day statement", correct: false }
                    ],
                    explanation: "Treasury moves the bank's own funds, so it's a pacs.009 (FI credit transfer) with no underlying customer. pacs.008 would be a customer's money; camt.053 only reports."
                },
                {
                    id: "q-500-5",
                    type: "boolean",
                    prompt: "In a cross-border payment, FX conversion happens at the bank in the chain that holds both currencies, and the message records the instructed amount, the exchange rate, and the settlement amount.",
                    ref: "503-cross-border-payment",
                    tags: ["cross-border", "FX"],
                    answer: true,
                    explanation: "True. FX is applied where both currencies are held (often a correspondent), and it's recorded explicitly — instructed amount, rate, settlement amount — so everyone can see how one currency became the other."
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
                },
                {
                    id: "q-600-2",
                    type: "single",
                    prompt: "Which field is the closest thing ISO 20022 has to a reason for existing — the one that makes reconciliation automatic when it's populated well?",
                    ref: "601-remittance-information",
                    tags: ["remittance", "reconciliation"],
                    options: [
                        { text: "Remittance information (why the money moved)", correct: true },
                        { text: "The BIC of the creditor agent", correct: false },
                        { text: "The UETR", correct: false },
                        { text: "The settlement method", correct: false }
                    ],
                    explanation: "Remittance information says WHY money moved. Get it right and reconciliation is automatic; get it wrong and a human types the match by hand. The UETR tracks the payment, but remittance is what closes the invoice."
                },
                {
                    id: "q-600-3",
                    type: "boolean",
                    prompt: "A structured creditor reference (e.g. an ISO 11649 'RF' reference) inside RmtInf/Strd lets an ERP match a payment to the exact open invoice without a human.",
                    ref: "601-remittance-information",
                    tags: ["structured remittance", "creditor reference"],
                    answer: true,
                    explanation: "True. Structured (Strd) remittance is machine-readable, so the ERP reconciles automatically. Unstructured (Ustrd) free text mostly can't be parsed and drops into an 'unapplied cash' queue for a human."
                },
                {
                    id: "q-600-4",
                    type: "single",
                    prompt: "Purpose codes such as SALA (salary) and DIVD (dividend) primarily affect how a payment is:",
                    ref: "604-purpose-codes",
                    tags: ["purpose codes", "compliance"],
                    options: [
                        { text: "Processed, taxed, screened and reported", correct: true },
                        { text: "Encrypted on the wire", correct: false },
                        { text: "Priced by the sending customer", correct: false },
                        { text: "Split across multiple networks", correct: false }
                    ],
                    explanation: "Four letters tell downstream systems why a payment is being made, which drives processing, tax treatment, screening and regulatory reporting — and it's one of the easiest fields to get quietly wrong."
                },
                {
                    id: "q-600-5",
                    type: "multi",
                    prompt: "From November 2026, which address shapes are permitted for in-scope CBPR+ parties? (Select all that apply.)",
                    ref: "603-structured-addresses",
                    tags: ["structured address", "cbpr+", "2026 deadline"],
                    options: [
                        { text: "Fully structured — every component in its named element, no AdrLine", correct: true },
                        { text: "Hybrid — town and country structured, plus up to two AdrLine lines", correct: true },
                        { text: "Purely free-text AdrLine only", correct: false },
                        { text: "No address at all", correct: false }
                    ],
                    explanation: "Two shapes are allowed — fully structured, or hybrid — and both share the same floor: town and country, structured, always. Addresses made only of free-text AdrLine stop being acceptable."
                }
            ]
        }
    ]
};
