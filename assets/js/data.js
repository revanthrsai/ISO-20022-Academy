// Data Module - Loads all content from JSON files

const DATA = {
    messages: {
        'CAMT': [
            {
                code: 'CAMT.052',
                family: 'CAMT',
                title: 'CAMT.052',
                subtitle: 'Bank to Customer - Report',
                purpose: 'Interim report on account transactions and balances before monthly statement',
                direction: 'Bank → Customer',
                category: 'Cash Management',
                useCases: ['Interim Reports', 'Daily Balance Reports', 'Account Summaries'],
                fields: ['Rpt (Report)', 'Bal (Balance)', 'Ntry (Entries)', 'TtlCdtDbtAmt'],
                example: '<Document>\n  <BkToCstmrReport>\n    <Rpt>\n      <Acct><IBAN>DE89370400440532013000</IBAN></Acct>\n      <Bal>9500.00</Bal>\n    </Rpt>\n  </BkToCstmrReport>\n</Document>',
                node: {
                    story: "Mid-morning, Sweety's treasurer wants to know what landed overnight — not at month-end, now. camt.052 is the intraday read on the account.",
                    whyExists: "Businesses can't wait for the end-of-day statement to reconcile. An interim report gives a running view of balances and entries during the day.",
                    createdBy: "The account servicer — Sweety's bank.",
                    receivedBy: "The account owner or their treasury / ERP system.",
                    flow: ['Account Servicer (Bank)', 'Interim Report', 'Account Owner / Treasury'],
                    businessComponents: [
                        { name: 'Report', plain: 'A snapshot of activity so far today' },
                        { name: 'Balance', plain: 'Running balance at the moment of the report' },
                        { name: 'Entries', plain: 'Individual movements booked since the last report' }
                    ],
                    messageComponents: [
                        { tag: 'Rpt', plain: "Report — the container for this account's intraday view" },
                        { tag: 'Bal', plain: 'Balance figures' },
                        { tag: 'Ntry', plain: 'Each booked entry, with NtryRef' }
                    ],
                    breaks: [
                        { symptom: 'Duplicate entries across two interim reports', cause: 'Pulling overlapping time windows without de-duplicating', fix: 'Reconcile on NtryRef, not on amount + time' }
                    ],
                    interview: [
                        { q: "What's the difference between camt.052, camt.053 and camt.054?", a: '052 is the intraday / interim report, 053 is the end-of-day statement (the legal record), and 054 is a real-time debit/credit notification of a single movement.' }
                    ],
                    related: ['CAMT.053', 'CAMT.054']
                }
            },
            {
                code: 'CAMT.053',
                family: 'CAMT',
                title: 'CAMT.053',
                subtitle: 'Bank to Customer - Statement',
                purpose: 'Provides complete account statement with opening/closing balances and all transactions',
                direction: 'Bank → Customer',
                category: 'Cash Management',
                useCases: ['Monthly Statements', 'Account Reconciliation', 'Balance Verification', 'Audit Reports'],
                fields: ['Stmt (Statement)', 'Bal (Balance)', 'OpeningBalance', 'ClosingBalance'],
                example: '<Document>\n  <BkToCstmrStmt>\n    <Stmt>\n      <AcctStmt>\n        <Acct><IBAN>DE89370400440532013000</IBAN></Acct>\n        <OpeningBalance>10000.00</OpeningBalance>\n        <ClosingBalance>10000.00</ClosingBalance>\n      </AcctStmt>\n    </Stmt>\n  </BkToCstmrStmt>\n</Document>',
                node: {
                    story: "At the end of the day, Sweety's bank closes the books and sends the official statement: opening balance, every transaction, closing balance. This is the record auditors trust.",
                    whyExists: 'Reconciliation and audit need one authoritative end-of-day record per account — structured, complete, machine-readable. camt.053 is the ISO 20022 replacement for the old MT940 (the legacy end-of-day statement).',
                    createdBy: 'The account servicer (the bank), once per business day.',
                    receivedBy: 'The account owner / corporate ERP, for automatic reconciliation.',
                    flow: ['Bank closes books', 'camt.053 Statement', 'Corporate ERP reconciles'],
                    businessComponents: [
                        { name: 'Statement', plain: "The day's complete account record" },
                        { name: 'Opening / Closing Balance', plain: 'Where the account started and ended' },
                        { name: 'Entries', plain: 'Every booked transaction, with references' }
                    ],
                    messageComponents: [
                        { tag: 'Stmt', plain: 'Statement container' },
                        { tag: 'Bal (OPBD / CLBD)', plain: 'Opening and closing booked balances' },
                        { tag: 'Ntry', plain: 'Booked entries with NtryRef and AcctSvcrRef' }
                    ],
                    validation: [
                        { tag: '<Bal>', rule: 'Opening + sum(entries) must equal closing balance', fails: "A closing balance that doesn't foot — usually a missing or duplicated entry" }
                    ],
                    breaks: [
                        { symptom: "ERP won't auto-reconcile", cause: 'Entries lack structured references (EndToEndId / AcctSvcrRef), forcing manual matching', fix: 'Ensure each entry carries its original payment references end to end' }
                    ],
                    interview: [
                        { q: 'Which MT message did camt.053 replace, and why is the MX version better?', a: 'It replaces the MT940 statement. The MX version carries structured balances and references, so reconciliation can be fully automated instead of parsing free text.' },
                        { q: 'camt.053 vs camt.052?', a: '053 is the definitive end-of-day statement; 052 is an interim, intraday view that is not the legal record.' }
                    ],
                    related: ['CAMT.052', 'CAMT.054', 'PACS.008']
                }
            },
            {
                code: 'CAMT.054',
                family: 'CAMT',
                title: 'CAMT.054',
                subtitle: 'Bank to Customer - Debit/Credit Notification',
                purpose: 'Notifies customers about debit or credit entries on their accounts in real-time',
                direction: 'Bank → Customer',
                category: 'Cash Management',
                useCases: ['Salary Credits', 'Refunds', 'Settlements', 'Interest Payments'],
                fields: ['Amt (Amount)', 'CdtDbtInd (Credit/Debit)', 'BkgDt (Booking Date)', 'NtryRef'],
                example: '<Document>\n  <BkToCstmrDebitCreditNotifctn>\n    <Notfctn>\n      <Acct><Id><IBAN>DE89370400440532013000</IBAN></Id></Acct>\n      <Ntry>\n        <Amt>1000.00</Amt>\n        <CdtDbtInd>CRDT</CdtDbtInd>\n        <BkgDt>2024-06-18</BkgDt>\n      </Ntry>\n    </Notfctn>\n  </BkToCstmrDebitCreditNotifctn>\n</Document>',
                node: {
                    story: "The instant Bob's $400 hits Sweety's account, her bank fires a notification: credit, 400, here's the reference. She doesn't wait for the statement to know the money arrived.",
                    whyExists: 'Real-time reconciliation. A single credit or debit needs to be announced the moment it books, so the receiver can release goods, mark an invoice paid, or update cash position immediately.',
                    createdBy: "The account servicer (creditor's bank), at the moment of booking.",
                    receivedBy: 'The account owner — the beneficiary or their treasury system.',
                    flow: ['Funds book at Creditor Agent', 'camt.054 Notification', 'Beneficiary updates ledger'],
                    businessComponents: [
                        { name: 'Notification', plain: 'A heads-up about one movement, not a full statement' },
                        { name: 'Amount', plain: 'How much moved' },
                        { name: 'Credit / Debit Indicator', plain: 'Money in or money out' }
                    ],
                    messageComponents: [
                        { tag: 'Ntfctn', plain: 'Notification container' },
                        { tag: 'Amt', plain: 'Amount booked' },
                        { tag: 'CdtDbtInd', plain: 'CRDT = credit, DBIT = debit' },
                        { tag: 'BkgDt', plain: 'Booking date' }
                    ],
                    validation: [
                        { tag: '<CdtDbtInd>', rule: 'Must be CRDT or DBIT', fails: 'Free text or a wrong indicator breaks downstream reconciliation logic' }
                    ],
                    breaks: [
                        { symptom: 'Beneficiary credits the wrong invoice', cause: "Remittance reference not carried through, so the notification can't be tied to the open item", fix: 'Preserve EndToEndId / structured remittance from the originating payment' }
                    ],
                    interview: [
                        { q: 'When would you use camt.054 instead of camt.053?', a: 'camt.054 notifies a single debit/credit in near real time; camt.053 is the batched end-of-day statement. Use 054 when you need to react to one movement immediately.' }
                    ],
                    related: ['CAMT.053', 'PACS.008']
                }
            },
            {
                code: 'CAMT.060',
                family: 'CAMT',
                title: 'CAMT.060',
                subtitle: 'Account Management - Information Request',
                purpose: 'Customers request information about their accounts, balances, or transaction history',
                direction: 'Customer → Bank',
                category: 'Cash Management',
                useCases: ['Account Inquiry', 'Balance Request', 'Transaction History Query'],
                fields: ['ReqId (Request ID)', 'AcctId (Account ID)', 'QueryType', 'DateRange'],
                example: '<Document>\n  <AcctMgmtInfoRequest>\n    <ReqId>REQ001</ReqId>\n    <AcctId>DE89370400440532013000</AcctId>\n  </AcctMgmtInfoRequest>\n</Document>',
                node: {
                    story: "Sweety's treasury system needs yesterday's detail again — so it asks the bank for it, instead of waiting for the next scheduled file.",
                    whyExists: 'Account owners sometimes need to pull a report or statement on demand. camt.060 is the request that triggers the bank to send a camt.052 / 053 / 054.',
                    createdBy: 'The account owner (customer / treasury).',
                    receivedBy: 'The account servicer (the bank).',
                    flow: ['Account Owner', 'camt.060 Request', 'Bank responds with camt.05x'],
                    businessComponents: [
                        { name: 'Request', plain: 'The ask: which report, which account, which window' },
                        { name: 'Account', plain: 'Which account it concerns' }
                    ],
                    messageComponents: [
                        { tag: 'ReqId', plain: 'Reference for this request' },
                        { tag: 'AcctId', plain: 'The account being queried' }
                    ],
                    breaks: [
                        { symptom: 'Bank returns nothing', cause: "Requested date range is outside retention, or the account id doesn't match servicer records", fix: 'Validate the account id and stay within the supported reporting window' }
                    ],
                    interview: [
                        { q: 'What does camt.060 trigger?', a: 'It requests an account report / statement; the bank answers with a camt.052, camt.053 or camt.054.' }
                    ],
                    related: ['CAMT.053', 'CAMT.052']
                }
            }
        ],
        'PACS': [
            {
                code: 'PACS.002',
                family: 'PACS',
                title: 'PACS.002',
                subtitle: 'Payment Status Report',
                purpose: 'Status report on payment instruction - accepted, rejected, pending, or completed',
                direction: 'Bank → Bank',
                category: 'Payments & Settlement',
                useCases: ['Payment Confirmation', 'Rejection Notification', 'Status Updates'],
                fields: ['PmtSts (Payment Status)', 'PmtId (Payment ID)', 'StsRsnInf'],
                example: '<Document>\n  <FIPaymentStatusReport>\n    <PmtSts>ACCC</PmtSts>\n    <PmtId>PMT001</PmtId>\n  </FIPaymentStatusReport>\n</Document>',
                node: {
                    story: "Bob's bank sent the transfer onward. Did the next bank accept it? pacs.002 is the answer coming back: accepted, rejected, or pending — with a reason code if it failed.",
                    whyExists: 'Interbank payments need a confirmation channel. Without a status report, the sending bank never knows if the instruction was accepted or why it bounced.',
                    createdBy: 'The instructed / receiving financial institution.',
                    receivedBy: 'The instructing financial institution that sent the original payment.',
                    flow: ['Receiving FI evaluates payment', 'pacs.002 Status Report', 'Sending FI updates status'],
                    businessComponents: [
                        { name: 'Payment Status', plain: 'Accepted, rejected, or pending' },
                        { name: 'Status Reason', plain: 'The code explaining a rejection' },
                        { name: 'Original Reference', plain: 'Which payment this status is about' }
                    ],
                    messageComponents: [
                        { tag: 'TxSts', plain: 'Transaction status — e.g. ACCC, ACSP, RJCT, PDNG' },
                        { tag: 'StsRsnInf', plain: 'Reason information when rejected' },
                        { tag: 'OrgnlEndToEndId', plain: 'Link back to the original payment' }
                    ],
                    validation: [
                        { tag: '<TxSts>', rule: 'Must be a valid ISO status code (ACCC, ACSP, RJCT, PDNG…)', fails: "Custom status strings downstream systems can't interpret" }
                    ],
                    breaks: [
                        { symptom: "Sender can't match the status to a payment", cause: 'OrgnlEndToEndId / OrgnlTxId not echoed back correctly', fix: 'Always return the original identifiers unchanged' }
                    ],
                    interview: [
                        { q: 'What do status codes ACCC, ACSP and RJCT mean?', a: 'ACCC = accepted and settlement completed, ACSP = accepted, settlement in process, RJCT = rejected. RJCT is always paired with a reason code.' }
                    ],
                    related: ['PACS.008', 'PAIN.002', 'PACS.004']
                }
            },
            {
                code: 'PACS.004',
                family: 'PACS',
                title: 'PACS.004',
                subtitle: 'Payment Return',
                purpose: 'Return of failed or rejected payments back to originating bank',
                direction: 'Bank → Bank',
                category: 'Payments & Settlement',
                useCases: ['Payment Rejection', 'Failed Transfers', 'Return Processing'],
                fields: ['OrgnlPmtId (Original Payment ID)', 'RtrRsn (Return Reason)', 'ReturnAmt'],
                example: '<Document>\n  <PaymentReturn>\n    <OrgnlPmtId>PMT001</OrgnlPmtId>\n    <RtrRsn>NOOR</RtrRsn>\n  </PaymentReturn>\n</Document>',
                node: {
                    story: "The account was closed. The receiving bank can't deliver Bob's money — so it sends it back, with a reason, using pacs.004.",
                    whyExists: "When a settled payment can't be applied, the funds must be returned cleanly and traceably to the originator, not just dropped.",
                    createdBy: "The receiving bank that can't apply the funds.",
                    receivedBy: 'The original sending bank.',
                    flow: ['Receiving bank cannot apply funds', 'pacs.004 Return', 'Original sender re-credits debtor'],
                    businessComponents: [
                        { name: 'Return Reason', plain: 'Why the money is coming back (account closed, etc.)' },
                        { name: 'Returned Amount', plain: 'How much is returned (may net charges)' },
                        { name: 'Original Reference', plain: 'The payment being reversed' }
                    ],
                    messageComponents: [
                        { tag: 'RtrId', plain: 'Identifier for this return' },
                        { tag: 'RtrRsnInf', plain: 'Return reason code, e.g. AC04 account closed' },
                        { tag: 'OrgnlUETR', plain: 'Ties the return to the original tracked payment' }
                    ],
                    breaks: [
                        { symptom: "Return can't be auto-matched", cause: 'Original UETR / EndToEndId not preserved on the return', fix: 'Carry the original identifiers so the sender can reverse the right transaction' }
                    ],
                    interview: [
                        { q: "pacs.004 (return) vs camt.056 (recall) — what's the difference?", a: "pacs.004 returns funds that were settled but can't be applied; camt.056 requests cancellation / recall of a payment and may not result in returned funds." }
                    ],
                    related: ['PACS.008', 'PACS.002']
                }
            },
            {
                code: 'PACS.008',
                family: 'PACS',
                title: 'PACS.008',
                subtitle: 'Credit Transfer - Interbank',
                purpose: 'Bank-to-bank message for credit transfer of customer payments between institutions',
                direction: 'Bank → Bank',
                category: 'Payments & Settlement',
                useCases: ['Cross-bank Transfers', 'International Payments', 'Settlement Processing'],
                fields: ['PmtId (Payment ID)', 'Amt (Amount)', 'Cdtr (Creditor)', 'Dbtr (Debtor)'],
                example: '<Document>\n  <FIToFICstmrCdtTrf>\n    <CdtTrfTxInf>\n      <PmtId>PMT001</PmtId>\n      <Amt>1000.00</Amt>\n      <Cdtr><Nm>Creditor Bank</Nm></Cdtr>\n    </CdtTrfTxInf>\n  </FIToFICstmrCdtTrf>\n</Document>',
                node: {
                    story: "This is the message that actually moves Bob's $400 between banks. Bob's bank (the debtor agent) hands it to Sweety's bank (the creditor agent), possibly through an intermediary — each hop preserving who pays whom.",
                    whyExists: "It's the interbank workhorse for customer payments — the MX replacement for MT103. It carries the debtor, creditor, agents, amount and the references that let a payment be tracked end to end across the world.",
                    createdBy: "The debtor agent (sender's bank), after receiving the customer's pain.001.",
                    receivedBy: "The creditor agent (beneficiary's bank), directly or via intermediary agents.",
                    flow: ['Debtor Agent', 'Intermediary Agent', 'Creditor Agent', 'Beneficiary credited'],
                    businessComponents: [
                        { name: 'Debtor / Creditor', plain: 'Who pays and who is paid' },
                        { name: 'Debtor Agent / Creditor Agent', plain: 'The sending and receiving banks' },
                        { name: 'Interbank Settlement Amount', plain: 'What settles between the banks' }
                    ],
                    messageComponents: [
                        { tag: 'PmtId / UETR', plain: 'Payment identifiers, including the global tracking reference' },
                        { tag: 'IntrBkSttlmAmt', plain: 'Interbank settlement amount' },
                        { tag: 'Dbtr / Cdtr', plain: 'Debtor and creditor parties' },
                        { tag: 'DbtrAgt / CdtrAgt', plain: 'Debtor and creditor banks, identified by their BIC (Bank Identifier Code)' }
                    ],
                    validation: [
                        { tag: '<UETR>', rule: 'RFC 4122 UUIDv4, lowercase hex, version bit 4 and variant 8/9/a/b', fails: 'Uppercase letters or wrong version / variant bits → rejected' },
                        { tag: '<EndToEndId>', rule: '≤35 chars, must survive every hop unchanged', fails: "Placeholder values like 'NOT PROVIDED' or 'NO REF'" },
                        { tag: '<CreDtTm>', rule: 'ISO-8601 date-time with UTC offset', fails: 'Omitting the timezone offset' }
                    ],
                    breaks: [
                        { symptom: 'Payment NAKed at a domestic network', cause: 'Missing the required RTGS codeword (e.g. TARGET2) for that leg', fix: "Apply the network's HVPS+ market-practice rules before routing" },
                        { symptom: 'Sanctions-screening false hit', cause: 'Name and address crammed unstructured when a BIC is already given', fix: "Use structured address; don't duplicate identification in free text" }
                    ],
                    interview: [
                        { q: "What's the difference between MsgId, EndToEndId and UETR?", a: 'MsgId is point-to-point (rotates each hop). EndToEndId is the customer reference, unchanged end to end. UETR is the globally unique UUIDv4 that tracks the whole payment across every bank.' },
                        { q: 'Which MT message does pacs.008 replace?', a: 'MT103, the single customer credit transfer. pacs.008 is its ISO 20022 equivalent on FINplus / CBPR+.' }
                    ],
                    related: ['PAIN.001', 'PACS.002', 'PACS.009', 'CAMT.054']
                }
            },
            {
                code: 'PACS.009',
                family: 'PACS',
                title: 'PACS.009',
                subtitle: 'Settlement Transaction',
                purpose: 'Settlement of interbank payment transactions at clearing house level',
                direction: 'Settlement Agency → Banks',
                category: 'Payments & Settlement',
                useCases: ['Batch Settlement', 'Clearing House Reports', 'Daily Settlement'],
                fields: ['SettlmtInfId (Settlement ID)', 'SettlmtDt (Settlement Date)', 'SttlmAmt'],
                example: '<Document>\n  <SettlementTransaction>\n    <SettlmtInfId>SETTL001</SettlmtInfId>\n    <SettlmtDt>2024-06-18</SettlmtDt>\n    <SttlmAmt>50000.00</SttlmAmt>\n  </SettlementTransaction>\n</Document>',
                node: {
                    story: 'Banks also move their own money — to settle positions or manage liquidity. pacs.009 is the financial-institution credit transfer, including the COV variant that settles the cover leg behind a customer payment.',
                    whyExists: 'Wholesale funds movement between institutions: treasury, liquidity, and the cover payment that funds a pacs.008 routed serially through correspondents.',
                    createdBy: 'The ordering financial institution (or its correspondent).',
                    receivedBy: 'The beneficiary financial institution / its agent.',
                    flow: ['Ordering FI', 'Intermediary / Correspondent', 'Beneficiary FI'],
                    businessComponents: [
                        { name: 'Institution Debtor / Creditor', plain: 'The banks themselves, not customers' },
                        { name: 'Settlement Amount', plain: 'The funds moving between institutions' },
                        { name: 'Underlying Customer Payment (COV)', plain: 'In the cover variant, the customer payment being funded' }
                    ],
                    messageComponents: [
                        { tag: 'InstgAgt / InstdAgt', plain: 'Instructing and instructed agents' },
                        { tag: 'IntrBkSttlmAmt', plain: 'Interbank settlement amount' },
                        { tag: 'UndrlygCstmrCdtTrf', plain: 'COV only — the underlying pacs.008 details' }
                    ],
                    validation: [
                        { tag: '<SttlmMtd>', rule: 'Valid settlement method (INDA, INGA, CLRG, COVE)', fails: 'Wrong or missing settlement method for the routing scenario' }
                    ],
                    breaks: [
                        { symptom: "Cover and customer legs don't reconcile", cause: 'UETR not shared between the pacs.008 and its pacs.009 COV', fix: 'Carry the same UETR on both legs so the cover can be matched' }
                    ],
                    interview: [
                        { q: 'pacs.008 vs pacs.009?', a: "pacs.008 moves a customer's funds between banks; pacs.009 moves a bank's own funds. The pacs.009 COV variant funds the cover leg behind a serial pacs.008." },
                        { q: 'What is a cover payment?', a: 'When banks have no direct relationship, the customer message (pacs.008) routes one way while a separate pacs.009 COV settles the actual funds through correspondents.' }
                    ],
                    related: ['PACS.008', 'PACS.002']
                }
            }
        ],
        'PAIN': [
            {
                code: 'PAIN.001',
                family: 'PAIN',
                title: 'PAIN.001',
                subtitle: 'Credit Transfer Initiation',
                purpose: 'Customer initiates credit transfer payment request to their bank',
                direction: 'Customer → Bank',
                category: 'Customer Initiation',
                useCases: ['Bill Payments', 'Salary Payouts', 'Invoice Settlements'],
                fields: ['PmtId (Payment ID)', 'Debtor', 'Creditor', 'InstrAmt'],
                example: '<Document>\n  <CstmrCdtTrfInitn>\n    <PmtInf>\n      <PmtId>PMT001</PmtId>\n      <CdtTrfTxInf>\n        <Amt>500.00</Amt>\n      </CdtTrfTxInf>\n    </PmtInf>\n  </CstmrCdtTrfInitn>\n</Document>',
                node: {
                    story: "It all begins here. Bob tells his bank 'pay Sweety $400.' That instruction — from a customer to their own bank — is pain.001. No money has moved yet; this is the request.",
                    whyExists: 'Corporates and individuals need one structured way to instruct their bank to make payments — single or batched — replacing the old MT101 (the legacy SWIFT request format) and a zoo of proprietary bank formats.',
                    createdBy: 'The debtor (Bob) or their ERP / accounting system.',
                    receivedBy: "The debtor's bank (debtor agent).",
                    flow: ['Debtor / ERP', 'pain.001 Initiation', 'Debtor Agent validates & executes'],
                    businessComponents: [
                        { name: 'Group Header', plain: 'Metadata for the whole file — id, timestamp, control sum' },
                        { name: 'Payment Information', plain: 'Shared instructions: execution date, debtor account, charge bearer' },
                        { name: 'Credit Transfer Transaction', plain: 'One block per individual payment' }
                    ],
                    messageComponents: [
                        { tag: 'GrpHdr', plain: 'Level 1 — message id, creation time, number of txns, control sum' },
                        { tag: 'PmtInf', plain: 'Level 2 — shared payment parameters' },
                        { tag: 'CdtTrfTxInf', plain: 'Level 3 — per-transaction detail incl. EndToEndId, amount, creditor' }
                    ],
                    validation: [
                        { tag: '<CtrlSum>', rule: 'Must equal the sum of all transaction amounts', fails: "A control sum that doesn't match → the whole file is rejected" },
                        { tag: '<ReqdExctnDt>', rule: 'Valid, well-formed execution date', fails: 'Past dates or a bad date format' }
                    ],
                    breaks: [
                        { symptom: 'Entire batch rejected', cause: "GrpHdr control sum or number-of-transactions doesn't match the actual transactions", fix: 'Compute GrpHdr totals from the transaction list — never hand-enter them' }
                    ],
                    interview: [
                        { q: 'Walk me through the three levels of a pain.001.', a: 'Level 1 Group Header (file-wide metadata), Level 2 Payment Information (shared params like debtor account and execution date), Level 3 Credit Transfer Transaction Information (per-payment detail).' },
                        { q: 'pain.001 vs pacs.008?', a: 'pain.001 is customer-to-bank (the request). pacs.008 is bank-to-bank (the execution). The bank turns the pain.001 it receives into a pacs.008 it sends.' }
                    ],
                    related: ['PACS.008', 'PAIN.002', 'CAMT.054']
                }
            },
            {
                code: 'PAIN.002',
                family: 'PAIN',
                title: 'PAIN.002',
                subtitle: 'Credit Transfer Status Report',
                purpose: 'Status report from bank to customer about their credit transfer request',
                direction: 'Bank → Customer',
                category: 'Customer Initiation',
                useCases: ['Payment Confirmation', 'Transaction Status', 'Error Notification'],
                fields: ['PmtId (Payment ID)', 'PmtSts (Payment Status)', 'StsRsnInf'],
                example: '<Document>\n  <CstmrPaymentStatusReport>\n    <PmtId>PMT001</PmtId>\n    <PmtSts>ACCC</PmtSts>\n  </CstmrPaymentStatusReport>\n</Document>',
                node: {
                    story: "Bob's bank received his pain.001. Was it accepted? pain.002 is the bank telling Bob: accepted, rejected, or pending — and if rejected, exactly which transaction and why.",
                    whyExists: 'Initiators need confirmation that their instruction was understood and accepted, with a precise reason when something fails — before assuming the money is on its way.',
                    createdBy: "The debtor's bank (debtor agent).",
                    receivedBy: 'The debtor / originating system that sent the pain.001.',
                    flow: ['Debtor Agent evaluates pain.001', 'pain.002 Status Report', 'Debtor / ERP updates status'],
                    businessComponents: [
                        { name: 'Group Status', plain: 'Status of the whole file' },
                        { name: 'Transaction Status', plain: 'Status of each individual payment' },
                        { name: 'Status Reason', plain: 'Why a payment was rejected' }
                    ],
                    messageComponents: [
                        { tag: 'GrpSts', plain: 'Status for the whole original message' },
                        { tag: 'TxInfAndSts', plain: 'Per-transaction status' },
                        { tag: 'StsRsnInf', plain: 'Reason code for rejections' }
                    ],
                    breaks: [
                        { symptom: "Bob can't tell which payment failed", cause: 'OrgnlEndToEndId not echoed per transaction', fix: 'Return original references at the transaction level, not just the group level' }
                    ],
                    interview: [
                        { q: 'pain.002 vs pacs.002?', a: 'pain.002 is bank-to-customer status (about a pain.001). pacs.002 is bank-to-bank status (about a pacs.008). Same idea, different leg of the journey.' }
                    ],
                    related: ['PAIN.001', 'PACS.002']
                }
            },
            {
                code: 'PAIN.008',
                family: 'PAIN',
                title: 'PAIN.008',
                subtitle: 'Direct Debit Initiation',
                purpose: 'Customer initiates direct debit collection request - recurring or one-time debits',
                direction: 'Customer → Bank',
                category: 'Customer Initiation',
                useCases: ['Recurring Payments', 'Subscription Collection', 'Loan Repayments'],
                fields: ['PmtId (Payment ID)', 'Creditor', 'Debtor', 'MndtId (Mandate ID)'],
                example: '<Document>\n  <CstmrDrctDebitInitn>\n    <PmtInf>\n      <MndtId>MNDT001</MndtId>\n      <Debtor>Customer Name</Debtor>\n    </PmtInf>\n  </CstmrDrctDebitInitn>\n</Document>',
                node: {
                    story: "Instead of Bob pushing money, a company pulls it — Sweety's gym collects her monthly fee. pain.008 is the creditor instructing its bank to collect from the debtor, backed by a mandate the debtor signed.",
                    whyExists: 'Recurring collections (subscriptions, utilities, loans) need a standard, mandate-controlled way for a creditor to debit a payer account.',
                    createdBy: 'The creditor (the company collecting) or its system.',
                    receivedBy: "The creditor's bank, which then collects via the debtor's bank.",
                    flow: ['Creditor', 'pain.008 Direct Debit Initiation', 'Creditor Agent', 'Debtor Agent debits payer'],
                    businessComponents: [
                        { name: 'Mandate', plain: "The debtor's signed authorization to be debited" },
                        { name: 'Creditor / Debtor', plain: 'Who collects and who pays' },
                        { name: 'Collection Amount', plain: 'How much is pulled' }
                    ],
                    messageComponents: [
                        { tag: 'MndtId', plain: 'Mandate identifier — proof of authorization' },
                        { tag: 'DrctDbtTxInf', plain: 'Direct debit transaction detail' },
                        { tag: 'CdtrSchmeId', plain: 'Creditor scheme identifier' }
                    ],
                    breaks: [
                        { symptom: 'Collection rejected as unauthorized', cause: 'Missing or expired MndtId / mandate details', fix: 'Reference a valid, current mandate for every collection' }
                    ],
                    interview: [
                        { q: 'What makes a direct debit (pain.008) different from a credit transfer (pain.001)?', a: "Direction of the pull: pain.001 pushes money out at the debtor's instruction; pain.008 pulls money in at the creditor's instruction, and it requires a mandate." }
                    ],
                    related: ['PAIN.001', 'PACS.008']
                }
            }
        ],
        'Others': [
            {
                code: 'SEEV.001',
                family: 'SEEV',
                title: 'SEEV.001',
                subtitle: 'Securities Event Notification',
                purpose: 'Notifies about securities-related events like corporate actions, dividends, stock splits',
                direction: 'CSD/Securities Agent → Participants',
                category: 'Securities',
                useCases: ['Corporate Actions', 'Dividend Notifications', 'Stock Splits'],
                fields: ['EventId (Event ID)', 'EventType', 'EffectiveDate', 'SecurityId'],
                example: '<Document>\n  <SecuritiesEventNotification>\n    <EventId>EVT001</EventId>\n    <EventType>DIVD</EventType>\n    <SecurityId>US0378331005</SecurityId>\n  </SecuritiesEventNotification>\n</Document>',
                node: {
                    story: 'Sweety invested some savings. The company declares a dividend — and every holder must be told the same thing, the same way. seev.001 announces that corporate event to participants.',
                    whyExists: 'Corporate-action terms used to live in free-text MT564 (the legacy corporate-action notice) narrative, so every custodian read them differently. Structured seev messages let entitlements be calculated automatically.',
                    createdBy: "The issuer's agent / CSD.",
                    receivedBy: 'Custodians, investment managers, and ultimately holders.',
                    flow: ['Issuer / CSD', 'seev.001 Event Notification', 'Custodian', 'Investment Manager'],
                    businessComponents: [
                        { name: 'Event', plain: "What's happening — dividend, split, merger" },
                        { name: 'Security', plain: 'Which instrument is affected (ISIN)' },
                        { name: 'Effective Date', plain: 'When it takes effect' }
                    ],
                    messageComponents: [
                        { tag: 'EvtId', plain: 'Event identifier' },
                        { tag: 'EvtTp', plain: 'Event type, e.g. DIVD' },
                        { tag: 'FinInstrmId / ISIN', plain: 'The security' }
                    ],
                    breaks: [
                        { symptom: 'Holders compute different entitlements', cause: 'Key terms left in unstructured narrative (the old MT564 problem)', fix: 'Carry rates and dates as structured fields, not free text' }
                    ],
                    interview: [
                        { q: 'Why did structured seev messages replace MT564 free text?', a: 'Free-text narrative forced manual interpretation across custodians, causing mismatched entitlements and operational risk. Structured data enables straight-through, automated processing.' }
                    ],
                    related: ['CAMT.053']
                }
            },
            {
                code: 'ACMT.002',
                family: 'ACMT',
                title: 'ACMT.002',
                subtitle: 'Account Opening Instruction',
                purpose: 'Instructions for opening new bank accounts and account configuration',
                direction: 'Customer → Bank',
                category: 'Account Management',
                useCases: ['New Account Setup', 'Account Configuration', 'Customer Onboarding'],
                fields: ['AcctOpenngInstrId (ID)', 'AcctOwnr (Owner)', 'AcctType'],
                example: '<Document>\n  <AcctOpnngInstr>\n    <AcctOpenngInstrId>ACCTOPEN001</AcctOpenngInstrId>\n    <AcctOwnr>John Doe</AcctOwnr>\n  </AcctOpnngInstr>\n</Document>',
                node: {
                    story: 'Before any of this works, Sweety needs an account. acmt.002 carries the instruction to open and configure one — owner, type, and settings.',
                    whyExists: 'Account management itself needs to be standardized so onboarding and configuration can flow between parties without bespoke forms.',
                    createdBy: 'The customer / account owner (or an agent acting for them).',
                    receivedBy: 'The bank that will open and service the account.',
                    flow: ['Customer', 'acmt.002 Account Opening Instruction', 'Bank configures account'],
                    businessComponents: [
                        { name: 'Account Owner', plain: 'Whose account it is' },
                        { name: 'Account Type', plain: 'What kind of account' },
                        { name: 'Instruction', plain: 'The open / configure request' }
                    ],
                    messageComponents: [
                        { tag: 'AcctOpngInstrId', plain: 'Identifier for the opening instruction' },
                        { tag: 'AcctOwnr', plain: 'The owner party' },
                        { tag: 'Acct', plain: 'Account configuration details' }
                    ],
                    breaks: [
                        { symptom: 'Onboarding stalls', cause: 'Owner identification incomplete for KYC (Know Your Customer checks)', fix: 'Provide full structured party identification up front' }
                    ],
                    interview: [
                        { q: 'Which domain do acmt messages belong to?', a: 'Account Management — they standardize opening, maintaining and reporting on accounts, separate from the payment flows themselves.' }
                    ],
                    related: ['CAMT.053']
                }
            }
        ]
    },
    // GLOSSARY (Phase 5)
    // Schema (locked Session 5.1): every term carries
    //   term        — the display headword
    //   slug         — stable, lowercase-hyphenated id (filter/search + #/glossary/<slug>)
    //   category     — exactly one of the five GLOSSARY_CATEGORIES slugs
    //   definition   — one plain-English sentence or two
    //   related      — array of OTHER glossary slugs ("See also"); 5.2 extends these
    //                  and adds cross-links out to Library/Playground.
    // 5.1 seeds a handful per category so category-filtering + search can be built
    // and verified; 5.2 populates the full set.
    glossary: [
        // -- Business Terms --
        { term: 'Settlement', slug: 'settlement', category: 'business-terms', definition: 'The final, irrevocable transfer of funds between accounts after clearing — the moment the money actually moves.', related: ['clearing', 'liquidity', 'value-date', 'rtgs'] },
        { term: 'Clearing', slug: 'clearing', category: 'business-terms', definition: 'Validating, routing, and reconciling a payment between banks before it settles — agreeing who owes whom, and how much.', related: ['settlement', 'reconciliation', 'csm'] },
        { term: 'Counterparty', slug: 'counterparty', category: 'business-terms', definition: 'The other party in a transaction — sender or receiver, depending on whose books you are reading.', related: ['creditor', 'debtor'] },
        { term: 'Reconciliation', slug: 'reconciliation', category: 'business-terms', definition: 'Matching incoming payment messages against the transactions actually booked, so both sides agree the money arrived as described.', related: ['clearing', 'remittance-information', 'camt'] },
        { term: 'Liquidity', slug: 'liquidity', category: 'business-terms', definition: 'Having funds available, in the right account, at the moment settlement is due.', related: ['settlement', 'nostro-vostro', 'treasury'] },
        { term: 'Creditor', slug: 'creditor', category: 'business-terms', definition: 'The party receiving the payment — also called the beneficiary or payee.', related: ['debtor', 'counterparty', 'beneficiary'] },
        { term: 'Debtor', slug: 'debtor', category: 'business-terms', definition: 'The party making the payment — also called the payer or originator.', related: ['creditor', 'counterparty', 'originator'] },
        { term: 'Cover Payment', slug: 'cover-payment', category: 'business-terms', definition: 'A separate interbank transfer (pacs.009 COV) that moves the real funds behind a customer payment routed through correspondent banks.', related: ['settlement', 'correspondent-banking'] },
        { term: 'Correspondent Banking', slug: 'correspondent-banking', category: 'business-terms', definition: 'The arrangement where one bank holds an account with another to move money in a currency or country it cannot reach directly — the backbone of cross-border payments.', related: ['nostro-vostro', 'cover-payment', 'bic-swift-code'] },
        { term: 'Nostro & Vostro', slug: 'nostro-vostro', category: 'business-terms', definition: '"Our account with you" (nostro) and "your account with us" (vostro) — two views of the same correspondent account that must always reconcile.', related: ['correspondent-banking', 'liquidity', 'treasury'] },
        { term: 'Credit Transfer', slug: 'credit-transfer', category: 'business-terms', definition: 'A push payment: the payer instructs their bank to send money to the payee. The pain.001 / pacs.008 family carries it.', related: ['direct-debit', 'pacs', 'pain'] },
        { term: 'Direct Debit', slug: 'direct-debit', category: 'business-terms', definition: 'A pull payment: the payee collects funds from the payer under a stored mandate. The pain.008 message carries it.', related: ['credit-transfer', 'mandate', 'pain'] },
        { term: 'Beneficiary', slug: 'beneficiary', category: 'business-terms', definition: 'The end party a payment is meant for — the same role ISO 20022 labels the Creditor (Cdtr).', related: ['creditor', 'originator'] },
        { term: 'Originator', slug: 'originator', category: 'business-terms', definition: 'The party who starts a payment — the same role ISO 20022 labels the Debtor (Dbtr).', related: ['debtor', 'beneficiary', 'endtoendid'] },
        { term: 'Value Date', slug: 'value-date', category: 'business-terms', definition: 'The date on which funds are actually available to the receiver — as distinct from the date the instruction was sent.', related: ['settlement', 'intrbksttlmdt'] },
        { term: 'Real-Time Payments', slug: 'real-time-payments', category: 'business-terms', definition: 'Payments that clear and settle in seconds, around the clock — versus batch systems that settle in cycles. ISO 20022 is their native message format.', related: ['payment-rail', 'settlement', 'iso-20022'] },
        { term: 'Payment Rail', slug: 'payment-rail', category: 'business-terms', definition: 'The underlying scheme or infrastructure a payment travels on — an RTGS system, an ACH, or an instant-payment network.', related: ['real-time-payments', 'rtgs', 'ach'] },
        { term: 'Treasury', slug: 'treasury', category: 'business-terms', definition: 'The function inside a bank or company that manages its own cash and liquidity — moving a firm’s own money rather than a customer’s.', related: ['liquidity', 'nostro-vostro', 'camt'] },

        // -- ISO 20022 Terms --
        { term: 'ISO 20022', slug: 'iso-20022', category: 'iso-20022-terms', definition: 'The open, global standard for financial messaging — a shared business dictionary plus an XML grammar that every modern payment message is built from.', related: ['mx', 'data-dictionary', 'migration'] },
        { term: 'MX', slug: 'mx', category: 'iso-20022-terms', definition: 'The shorthand for ISO 20022 messages (pain, pacs, camt…), as opposed to the legacy "MT" SWIFT messages they replace.', related: ['mt-format', 'iso-20022', 'coexistence'] },
        { term: 'MT Format', slug: 'mt-format', category: 'iso-20022-terms', definition: 'SWIFT Message Type — the older, fixed text format (e.g. MT103) being replaced by ISO 20022 / MX messages.', related: ['mx', 'swift', 'coexistence'] },
        { term: 'Data Dictionary', slug: 'data-dictionary', category: 'iso-20022-terms', definition: 'The shared store of ISO 20022 business meanings, elements, and components reused across every message type.', related: ['iso-20022', 'namespace', 'business-component'] },
        { term: 'Structured Address', slug: 'structured-address', category: 'iso-20022-terms', definition: 'A postal address split into labelled fields (street, town, country) instead of free-text lines — mandated by SWIFT from November 2026.', related: ['iso-20022', 'migration'] },
        { term: 'Business Application Header', slug: 'business-application-header', category: 'iso-20022-terms', definition: 'head.001 — the envelope wrapped around each message, carrying sender, receiver, message type, and version.', related: ['iso-20022', 'message-identifier'] },
        { term: 'pain', slug: 'pain', category: 'iso-20022-terms', definition: 'Payments Initiation — the message family a customer uses to instruct its bank (pain.001 credit transfer, pain.008 direct debit, pain.002 status).', related: ['pacs', 'camt', 'credit-transfer'], links: [{ label: 'Read: the pain family', article: '301-pain-family' }] },
        { term: 'pacs', slug: 'pacs', category: 'iso-20022-terms', definition: 'Payments Clearing & Settlement — the bank-to-bank family that actually moves money (pacs.008 credit transfer, pacs.002 status, pacs.004 return).', related: ['pain', 'camt', 'settlement'], links: [{ label: 'Read: the pacs family', article: '302-pacs-family' }] },
        { term: 'camt', slug: 'camt', category: 'iso-20022-terms', definition: 'Cash Management — the reporting family: statements (camt.053), intraday reports (camt.052), notifications (camt.054), and cancellations (camt.056).', related: ['pain', 'pacs', 'reconciliation'], links: [{ label: 'Read: the camt family', article: '303-camt-family' }] },
        { term: 'Message Definition', slug: 'message-definition', category: 'iso-20022-terms', definition: 'The formal specification of one message type — which business components it uses and how they are arranged — registered under ISO 20022.', related: ['message-component', 'business-component', 'message-identifier'] },
        { term: 'Message Identifier', slug: 'message-identifier', category: 'iso-20022-terms', definition: 'The dotted name that pins down a message’s exact type and version, e.g. pacs.008.001.08 — family.number.variant.version.', related: ['namespace', 'message-definition', 'business-application-header'] },
        { term: 'Business Component', slug: 'business-component', category: 'iso-20022-terms', definition: 'A reusable, business-level building block in the ISO 20022 dictionary (e.g. Party, Account, Amount) shared across many messages.', related: ['data-dictionary', 'message-component', 'message-definition'] },
        { term: 'Message Component', slug: 'message-component', category: 'iso-20022-terms', definition: 'The concrete XML realisation of a business component inside a specific message — the elements you actually see in the file.', related: ['business-component', 'element', 'message-definition'] },
        { term: 'Market Practice', slug: 'market-practice', category: 'iso-20022-terms', definition: 'Agreed usage guidelines (CBPR+, HVPS+) that narrow the broad ISO 20022 standard down to exactly how a given community must fill each field.', related: ['cbpr-plus', 'hvps-plus', 'coexistence'] },
        { term: 'Coexistence', slug: 'coexistence', category: 'iso-20022-terms', definition: 'The transition window in which legacy MT and ISO 20022 MX messages both run, so a payment can be translated between them without loss.', related: ['migration', 'mt-format', 'mx'] },
        { term: 'ISO 20022 Migration', slug: 'migration', category: 'iso-20022-terms', definition: 'The industry-wide move from MT to ISO 20022, phased by scheme with hard cut-over dates (SWIFT cross-border by November 2025).', related: ['coexistence', 'iso-20022', 'structured-address'] },

        // -- Message Elements --
        { term: 'EndToEndId', slug: 'endtoendid', category: 'message-elements', definition: 'A reference the originator assigns to a payment and that every bank passes along unchanged, so the two ends can recognise the same transaction.', related: ['uetr', 'instrid', 'originator'] },
        { term: 'IntrBkSttlmAmt', slug: 'intrbksttlmamt', category: 'message-elements', definition: 'Interbank Settlement Amount — the exact amount and currency that settles between the banks for a given transaction.', related: ['settlement', 'iso-4217', 'intrbksttlmdt'] },
        { term: 'ChrgBr', slug: 'chrgbr', category: 'message-elements', definition: 'Charge Bearer — who pays the fees: the debtor (DEBT), the creditor (CRED), or a shared split (SHAR / SLEV).', related: ['cover-payment', 'purp'] },
        { term: 'Remittance Information', slug: 'remittance-information', category: 'message-elements', definition: 'The "what this payment is for" field (RmtInf) — an invoice number or free-text note the creditor uses to reconcile the money.', related: ['reconciliation', 'purp'] },
        { term: 'InstrId', slug: 'instrid', category: 'message-elements', definition: 'Instruction Id — a reference meaningful only between two adjacent parties in the chain, unlike the end-to-end EndToEndId.', related: ['endtoendid', 'msgid'] },
        { term: 'CRDT/DBIT', slug: 'crdt-dbit', category: 'message-elements', definition: 'The credit/debit indicator: CRDT means money in, DBIT means money out — direction depends on whose account you are reading.', related: ['creditor', 'debtor'] },
        { term: 'Mandate', slug: 'mandate', category: 'message-elements', definition: 'A stored authorisation that lets a creditor collect recurring direct-debit payments from a debtor’s account.', related: ['debtor', 'direct-debit'] },
        { term: 'GrpHdr', slug: 'grphdr', category: 'message-elements', definition: 'Group Header — the once-per-message block carrying the MsgId, creation time, and totals that apply to every transaction inside.', related: ['msgid', 'nboftxs', 'ctrlsum'] },
        { term: 'PmtInf', slug: 'pmtinf', category: 'message-elements', definition: 'Payment Information — the pain.001 block grouping one debtor’s payments that share a debit account and execution date.', related: ['cdttrftxinf', 'batch', 'pain'] },
        { term: 'CdtTrfTxInf', slug: 'cdttrftxinf', category: 'message-elements', definition: 'Credit Transfer Transaction Information — one individual payment inside a message: its amount, creditor, and references.', related: ['pmtinf', 'endtoendid', 'nboftxs'] },
        { term: 'DbtrAgt', slug: 'dbtr-agt', category: 'message-elements', definition: 'Debtor Agent — the bank of the party sending the money, identified by its BIC.', related: ['cdtr-agt', 'debtor', 'bic-swift-code'] },
        { term: 'CdtrAgt', slug: 'cdtr-agt', category: 'message-elements', definition: 'Creditor Agent — the bank of the party receiving the money, identified by its BIC.', related: ['dbtr-agt', 'creditor', 'bic-swift-code'] },
        { term: 'MsgId', slug: 'msgid', category: 'message-elements', definition: 'Message Id — a sender-assigned reference identifying the whole message (not one transaction inside it).', related: ['grphdr', 'instrid'] },
        { term: 'NbOfTxs', slug: 'nboftxs', category: 'message-elements', definition: 'Number of Transactions — the declared count of individual payments in the message; a validator checks it against the real number found.', related: ['ctrlsum', 'cdttrftxinf', 'schema-validation'] },
        { term: 'CtrlSum', slug: 'ctrlsum', category: 'message-elements', definition: 'Control Sum — the total of all transaction amounts, declared once so the receiver can prove nothing was dropped or altered.', related: ['nboftxs', 'grphdr'] },
        { term: 'TxSts', slug: 'txsts', category: 'message-elements', definition: 'Transaction Status — the code in a status report (pacs.002 / pain.002) saying whether a payment was accepted (ACSP/ACSC) or rejected (RJCT).', related: ['reason-code', 'pacs'] },
        { term: 'Reason Code', slug: 'reason-code', category: 'message-elements', definition: 'A standard code (e.g. AC01 wrong account, RR04 regulatory) that explains why a payment was rejected, returned, or recalled.', related: ['txsts', 'chrgbr'] },
        { term: 'IntrBkSttlmDt', slug: 'intrbksttlmdt', category: 'message-elements', definition: 'Interbank Settlement Date — the date the banks settle the transaction, formatted as an ISO 8601 date.', related: ['value-date', 'intrbksttlmamt', 'iso-8601'] },
        { term: 'SvcLvl', slug: 'svclvl', category: 'message-elements', definition: 'Service Level — the scheme or agreement a payment runs under (e.g. SEPA), telling every bank which rulebook applies.', related: ['sepa', 'purp'] },
        { term: 'Purp', slug: 'purp', category: 'message-elements', definition: 'Purpose — a coded reason for the payment (salary, tax, supplier) that downstream systems can act on without reading free text.', related: ['remittance-information', 'reason-code'] },

        // -- Technical Terms --
        { term: 'XML Schema', slug: 'xml-schema', category: 'technical-terms', definition: 'The XSD rulebook that defines which elements a message may contain, in what order, and of what type — what makes a message "valid".', related: ['namespace', 'xsd', 'schema-validation'] },
        { term: 'Namespace', slug: 'namespace', category: 'technical-terms', definition: 'The identifier (e.g. urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08) that names a message’s exact type and version.', related: ['xml-schema', 'mx', 'message-identifier'] },
        { term: 'Batch', slug: 'batch', category: 'technical-terms', definition: 'Many individual transactions grouped inside one message for efficiency — e.g. a single payroll pain.001 carrying every employee.', related: ['instruction', 'pmtinf'] },
        { term: 'Instruction', slug: 'instruction', category: 'technical-terms', definition: 'A request to move money, sent and recorded before the funds actually settle.', related: ['settlement', 'credit-transfer'] },
        { term: 'Check Digits', slug: 'check-digits', category: 'technical-terms', definition: 'Two digits inside an IBAN, computed by an ISO 7064 mod-97 sum, that let a system catch a typo before sending money to the wrong account.', related: ['iban', 'mod-97'] },
        { term: 'Well-Formed XML', slug: 'well-formed', category: 'technical-terms', definition: 'XML whose tags are correctly opened, closed, and nested — the minimum a parser needs before schema validity can even be checked.', related: ['parser', 'element', 'schema-validation'] },
        { term: 'Element', slug: 'element', category: 'technical-terms', definition: 'A single tagged node in an XML message, e.g. <IntrBkSttlmAmt> — the unit a schema constrains and a validator reports against.', related: ['attribute', 'message-component', 'well-formed'], links: [{ label: 'Try it: the XML Viewer', tool: 'viewer' }] },
        { term: 'Attribute', slug: 'attribute', category: 'technical-terms', definition: 'A name=value pair on an element, e.g. Ccy="EUR" on an amount — used in ISO 20022 mainly for currency and a few qualifiers.', related: ['element', 'iso-4217'] },
        { term: 'Schema Validation', slug: 'schema-validation', category: 'technical-terms', definition: 'Checking a message against its XSD and market-practice rules — required elements present, codes legal, lengths and formats correct.', related: ['xml-schema', 'well-formed', 'market-practice'], links: [{ label: 'Try it: the Validator', tool: 'validator' }] },
        { term: 'Parser', slug: 'parser', category: 'technical-terms', definition: 'The software that reads XML text into a tree of elements; a parser error means the message isn’t even well-formed yet.', related: ['well-formed', 'element'] },
        { term: 'Mod-97 Checksum', slug: 'mod-97', category: 'technical-terms', definition: 'The ISO 7064 division-by-97 test behind IBAN check digits: a valid IBAN, rearranged and read as one big number, leaves remainder 1.', related: ['check-digits', 'iban'] },
        { term: 'Character Set', slug: 'character-set', category: 'technical-terms', definition: 'The restricted set of characters SWIFT allows in a message (the "x" charset) — reject anything outside it to avoid corrupting a name or reference downstream.', related: ['utf-8', 'schema-validation'] },
        { term: 'ISO 4217', slug: 'iso-4217', category: 'technical-terms', definition: 'The standard list of three-letter currency codes (EUR, USD, JPY) — and how many decimal places each currency’s minor unit allows.', related: ['iso-3166', 'intrbksttlmamt'] },
        { term: 'ISO 3166', slug: 'iso-3166', category: 'technical-terms', definition: 'The standard two-letter country codes (GB, DE, US) used in addresses, IBANs, and BICs.', related: ['iso-4217', 'iban', 'structured-address'] },
        { term: 'ISO 8601', slug: 'iso-8601', category: 'technical-terms', definition: 'The date/time format ISO 20022 uses everywhere — YYYY-MM-DD for dates, with an offset for timestamps — so ordering is unambiguous worldwide.', related: ['intrbksttlmdt'] },
        { term: 'UTF-8', slug: 'utf-8', category: 'technical-terms', definition: 'The character encoding ISO 20022 messages are written in, letting one file carry every language’s scripts unambiguously.', related: ['character-set', 'well-formed'] },

        // -- Acronyms --
        { term: 'IBAN', slug: 'iban', category: 'acronyms', definition: 'International Bank Account Number — a single string identifying both the bank and the account, with built-in check digits.', related: ['check-digits', 'bic-swift-code', 'mod-97'] },
        { term: 'BIC/SWIFT Code', slug: 'bic-swift-code', category: 'acronyms', definition: 'Bank Identifier Code — 8 or 11 characters that uniquely identify a bank (and branch) for international routing.', related: ['iban', 'swift', 'lei'] },
        { term: 'UETR', slug: 'uetr', category: 'acronyms', definition: 'Unique End-to-end Transaction Reference — a globally unique UUIDv4 (lowercase) that tracks one payment across every bank in the chain.', related: ['endtoendid', 'uuid'] },
        { term: 'CBPR+', slug: 'cbpr-plus', category: 'acronyms', definition: 'Cross-Border Payments and Reporting Plus — the market-practice guidelines for using ISO 20022 on cross-border SWIFT payments.', related: ['hvps-plus', 'market-practice', 'swift'] },
        { term: 'HVPS+', slug: 'hvps-plus', category: 'acronyms', definition: 'High-Value Payment Systems Plus — market-practice guidelines aligning how high-value market infrastructures use ISO 20022.', related: ['cbpr-plus', 'market-practice', 'rtgs'] },
        { term: 'SWIFT', slug: 'swift', category: 'acronyms', definition: 'Society for Worldwide Interbank Financial Telecommunication — the co-operative that runs the global messaging network and stewards the MT and CBPR+ standards.', related: ['bic-swift-code', 'mt-format', 'cbpr-plus'] },
        { term: 'STP', slug: 'stp', category: 'acronyms', definition: 'Straight-Through Processing — a payment that flows end to end with no manual intervention, the payoff of clean, structured ISO 20022 data.', related: ['schema-validation', 'structured-address'] },
        { term: 'RTGS', slug: 'rtgs', category: 'acronyms', definition: 'Real-Time Gross Settlement — a system that settles high-value payments one by one, in real time, with finality (e.g. TARGET2, Fedwire).', related: ['settlement', 'payment-rail', 'hvps-plus'] },
        { term: 'ACH', slug: 'ach', category: 'acronyms', definition: 'Automated Clearing House — a system that clears and settles low-value payments in batches on a cycle, rather than one at a time.', related: ['payment-rail', 'batch', 'csm'] },
        { term: 'CSM', slug: 'csm', category: 'acronyms', definition: 'Clearing & Settlement Mechanism — the shared infrastructure (an ACH or RTGS) that stands between banks to clear and settle their payments.', related: ['clearing', 'ach', 'rtgs'] },
        { term: 'FI', slug: 'fi', category: 'acronyms', definition: 'Financial Institution — any bank or regulated payment provider that can send and receive interbank messages.', related: ['psp', 'bic-swift-code'] },
        { term: 'PSP', slug: 'psp', category: 'acronyms', definition: 'Payment Service Provider — a bank or non-bank firm authorised to move money on a customer’s behalf.', related: ['fi', 'lei'] },
        { term: 'LEI', slug: 'lei', category: 'acronyms', definition: 'Legal Entity Identifier — a 20-character global code identifying a legal party in a transaction, increasingly carried alongside the BIC.', related: ['bic-swift-code', 'fi'] },
        { term: 'MI', slug: 'mi', category: 'acronyms', definition: 'Market Infrastructure — a system that whole markets depend on to clear or settle, such as an RTGS or a securities depository.', related: ['rtgs', 'csm', 'hvps-plus'] },
        { term: 'XSD', slug: 'xsd', category: 'acronyms', definition: 'XML Schema Definition — the machine-readable rulebook file a message is validated against.', related: ['xml-schema', 'schema-validation'] },
        { term: 'UUID', slug: 'uuid', category: 'acronyms', definition: 'Universally Unique Identifier — a 128-bit value with a near-zero collision chance; the UETR is a lowercase version-4 UUID.', related: ['uetr'] },
        { term: 'SEPA', slug: 'sepa', category: 'acronyms', definition: 'Single Euro Payments Area — the scheme that standardises euro credit transfers and direct debits across Europe on ISO 20022.', related: ['svclvl', 'credit-transfer', 'direct-debit'] }
    ]
};

// The five Glossary categories (docs/HANDBOOK.md (IA) section 3). Order here is the order
// the filter chips render in. Every glossary term's category is one of these slugs.
const GLOSSARY_CATEGORIES = [
    { slug: 'business-terms',   label: 'Business Terms' },
    { slug: 'iso-20022-terms',  label: 'ISO 20022 Terms' },
    { slug: 'message-elements', label: 'Message Elements' },
    { slug: 'technical-terms',  label: 'Technical Terms' },
    { slug: 'acronyms',         label: 'Acronyms' }
];

// slug -> category label (for the badge on each card).
function glossaryCategoryLabel(slug) {
    const c = GLOSSARY_CATEGORIES.find(c => c.slug === slug);
    return c ? c.label : slug;
}

// Look up a single term by its slug (used by "See also" related chips).
function getGlossaryTerm(slug) {
    return (DATA.glossary || []).find(t => t.slug === slug) || null;
}

// Helper function to get message count by family
function getMessageCountByFamily(family) {
    return (DATA.messages[family] || []).length;
}

// Helper function to get all messages by family
function getMessagesByFamily(family) {
    return DATA.messages[family] || [];
}

// Helper function to get single message by code
function getMessageByCode(code) {
    for (const family in DATA.messages) {
        const msg = DATA.messages[family].find(m => m.code === code);
        if (msg) return msg;
    }
    return null;
}

// ===========================================================================
// Progress store (Session 7.5) — lightweight localStorage replacement for the
// deleted ProgressEngine. Shape: { "<lesson-id>": { learned, learnedAt,
//   checks: { "<qIndex>": { correct, at } } } } under one versioned key.
// All reads are defensive: a corrupt or blocked localStorage degrades to {}.
// ===========================================================================
const Progress = (function () {
    const KEY = 'iso-academy-progress-v1';
    function read() {
        try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
        catch (e) { return {}; }
    }
    function write(state) {
        try { localStorage.setItem(KEY, JSON.stringify(state)); }
        catch (e) { /* private mode / quota — progress just won\u2019t persist */ }
    }
    return {
        isLearned(id) {
            const s = read();
            return !!(s[id] && s[id].learned);
        },
        setLearned(id, val) {
            const s = read();
            s[id] = s[id] || {};
            s[id].learned = !!val;
            s[id].learnedAt = val ? new Date().toISOString() : null;
            write(s);
        },
        recordCheck(id, qIndex, correct) {
            const s = read();
            s[id] = s[id] || {};
            s[id].checks = s[id].checks || {};
            s[id].checks[qIndex] = { correct: !!correct, at: new Date().toISOString() };
            write(s);
        },
        learnedCount() {
            const s = read();
            return Object.keys(s).filter(k => s[k] && s[k].learned).length;
        }
    };
})();
