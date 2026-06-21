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
                example: '<Document>\n  <BkToCstmrReport>\n    <Rpt>\n      <Acct><IBAN>DE89370400440532013000</IBAN></Acct>\n      <Bal>9500.00</Bal>\n    </Rpt>\n  </BkToCstmrReport>\n</Document>'
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
                example: '<Document>\n  <BkToCstmrStmt>\n    <Stmt>\n      <AcctStmt>\n        <Acct><IBAN>DE89370400440532013000</IBAN></Acct>\n        <OpeningBalance>10000.00</OpeningBalance>\n        <ClosingBalance>10000.00</ClosingBalance>\n      </AcctStmt>\n    </Stmt>\n  </BkToCstmrStmt>\n</Document>'
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
                example: '<Document>\n  <BkToCstmrDebitCreditNotifctn>\n    <Notfctn>\n      <Acct><Id><IBAN>DE89370400440532013000</IBAN></Id></Acct>\n      <Ntry>\n        <Amt>1000.00</Amt>\n        <CdtDbtInd>CRDT</CdtDbtInd>\n        <BkgDt>2024-06-18</BkgDt>\n      </Ntry>\n    </Notfctn>\n  </BkToCstmrDebitCreditNotifctn>\n</Document>'
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
                example: '<Document>\n  <AcctMgmtInfoRequest>\n    <ReqId>REQ001</ReqId>\n    <AcctId>DE89370400440532013000</AcctId>\n  </AcctMgmtInfoRequest>\n</Document>'
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
                example: '<Document>\n  <FIPaymentStatusReport>\n    <PmtSts>ACCC</PmtSts>\n    <PmtId>PMT001</PmtId>\n  </FIPaymentStatusReport>\n</Document>'
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
                example: '<Document>\n  <PaymentReturn>\n    <OrgnlPmtId>PMT001</OrgnlPmtId>\n    <RtrRsn>NOOR</RtrRsn>\n  </PaymentReturn>\n</Document>'
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
                example: '<Document>\n  <FIToFICstmrCdtTrf>\n    <CdtTrfTxInf>\n      <PmtId>PMT001</PmtId>\n      <Amt>1000.00</Amt>\n      <Cdtr><Nm>Creditor Bank</Nm></Cdtr>\n    </CdtTrfTxInf>\n  </FIToFICstmrCdtTrf>\n</Document>'
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
                example: '<Document>\n  <SettlementTransaction>\n    <SettlmtInfId>SETTL001</SettlmtInfId>\n    <SettlmtDt>2024-06-18</SettlmtDt>\n    <SttlmAmt>50000.00</SttlmAmt>\n  </SettlementTransaction>\n</Document>'
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
                example: '<Document>\n  <CstmrCdtTrfInitn>\n    <PmtInf>\n      <PmtId>PMT001</PmtId>\n      <CdtTrfTxInf>\n        <Amt>500.00</Amt>\n      </CdtTrfTxInf>\n    </PmtInf>\n  </CstmrCdtTrfInitn>\n</Document>'
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
                example: '<Document>\n  <CstmrPaymentStatusReport>\n    <PmtId>PMT001</PmtId>\n    <PmtSts>ACCC</PmtSts>\n  </CstmrPaymentStatusReport>\n</Document>'
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
                example: '<Document>\n  <CstmrDrctDebitInitn>\n    <PmtInf>\n      <MndtId>MNDT001</MndtId>\n      <Debtor>Customer Name</Debtor>\n    </PmtInf>\n  </CstmrDrctDebitInitn>\n</Document>'
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
                example: '<Document>\n  <SecuritiesEventNotification>\n    <EventId>EVT001</EventId>\n    <EventType>DIVD</EventType>\n    <SecurityId>US0378331005</SecurityId>\n  </SecuritiesEventNotification>\n</Document>'
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
                example: '<Document>\n  <AcctOpnngInstr>\n    <AcctOpenngInstrId>ACCTOPEN001</AcctOpenngInstrId>\n    <AcctOwnr>John Doe</AcctOwnr>\n  </AcctOpnngInstr>\n</Document>'
            }
        ]
    },
    glossary: [
        { term: 'IBAN', definition: 'International Bank Account Number - unique identifier for bank accounts worldwide.' },
        { term: 'BIC/SWIFT Code', definition: 'Bank Identifier Code - identifies banks for international transactions.' },
        { term: 'CRDT/DBIT', definition: 'Credit = money in, Debit = money out. Direction depends on perspective.' },
        { term: 'Settlement', definition: 'Final transfer of funds between accounts after clearing. When money actually moves.' },
        { term: 'Clearing', definition: 'Process of validating, routing, and reconciling payments between banks.' },
        { term: 'Counterparty', definition: 'The other party in a transaction - sender or receiver depending on perspective.' },
        { term: 'Reconciliation', definition: 'Matching payment messages with actual transactions to ensure accuracy.' },
        { term: 'Batch', definition: 'Multiple transactions grouped in one message for efficiency.' },
        { term: 'Mandate', definition: 'Authorization for recurring debit collections from an account.' },
        { term: 'XML Schema', definition: 'Defines structure and rules for ISO 20022 messages.' },
        { term: 'Instruction', definition: 'Request to move money, sent before actual settlement occurs.' },
        { term: 'Creditor', definition: 'Party receiving payment - also called beneficiary or payee.' },
        { term: 'Debtor', definition: 'Party making/initiating payment - also called payer or originator.' },
        { term: 'Liquidity', definition: 'Availability of funds for settlement activities.' },
        { term: 'CBPR+', definition: 'Cross Border Payments and Reporting Plus - standard for international payments.' },
        { term: 'MT Format', definition: 'SWIFT Message Type (legacy) - old text-based format being replaced by ISO 20022.' }
    ]
};

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
