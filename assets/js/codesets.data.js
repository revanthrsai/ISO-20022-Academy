// =============================================================================
// ISO 20022 CODE-SET EXPLORER — data
// -----------------------------------------------------------------------------
// The external code sets a payments engineer looks up constantly: reason codes,
// purpose codes, status codes, settlement methods, and the small closed lists
// (charge bearer, credit/debit, payment method, balance types…).
//
// The big external lists (purpose, reason) run to hundreds of entries and are
// refreshed quarterly on iso20022.org — those sets are marked "selection" and
// carry the most common, stable codes. The small lists are complete.
// =============================================================================

const CODESETS = (function () {
    const SETS = [
        {
            id: 'reason',
            name: 'Reason codes',
            field: 'Rsn/Cd — in reject, return, status and cancellation messages',
            blurb: 'Why a payment was rejected, returned or refused. The family prefix (AC/AM/AG/RR/MD) tells you where the problem lives.',
            note: 'A common selection of the External Status/Return/Cancellation reason sets. The full lists are larger and updated quarterly.',
            codes: [
                { code: 'AC01', name: 'IncorrectAccountNumber', desc: 'The account number is invalid or malformed.' },
                { code: 'AC03', name: 'InvalidCreditorAccountNumber', desc: 'The creditor account number is invalid.' },
                { code: 'AC04', name: 'ClosedAccountNumber', desc: 'The account is closed. Terminal — no retry will succeed.' },
                { code: 'AC06', name: 'BlockedAccount', desc: 'The account is blocked; posting is not allowed.' },
                { code: 'AG01', name: 'TransactionForbidden', desc: 'This transaction type is not allowed for the agent.' },
                { code: 'AG02', name: 'InvalidBankOperationCode', desc: 'The bank operation / transaction code is invalid.' },
                { code: 'AM04', name: 'InsufficientFunds', desc: 'Not enough money on the account to make the payment.' },
                { code: 'AM05', name: 'Duplication', desc: 'Duplicate payment — do not blindly retry, it may already exist.' },
                { code: 'AM09', name: 'WrongAmount', desc: 'The amount is not the amount that was agreed or expected.' },
                { code: 'BE01', name: 'InconsistentWithEndCustomer', desc: 'Debtor/creditor details are inconsistent with the end customer.' },
                { code: 'BE04', name: 'MissingCreditorAddress', desc: 'The creditor address is missing or incomplete.' },
                { code: 'BE06', name: 'UnknownEndCustomer', desc: 'The end customer is not known to the bank.' },
                { code: 'DT01', name: 'InvalidDate', desc: 'A date (e.g. requested execution/settlement) is invalid.' },
                { code: 'FF01', name: 'InvalidFileFormat', desc: 'The file or message format is not valid.' },
                { code: 'MD01', name: 'NoMandate', desc: 'No valid mandate exists for the direct debit.' },
                { code: 'MD07', name: 'EndCustomerDeceased', desc: 'The debtor is deceased.' },
                { code: 'RC01', name: 'BankIdentifierIncorrect', desc: 'The BIC / bank identifier is incorrect.' },
                { code: 'RR01', name: 'MissingDebtorAccountOrId', desc: 'Regulatory: debtor account or identification is missing.' },
                { code: 'RR03', name: 'MissingCreditorNameOrAddress', desc: 'Regulatory: creditor name or address is missing.' },
                { code: 'RR04', name: 'RegulatoryReason', desc: 'Held or rejected for a regulatory/compliance reason. Slow to resolve.' },
                { code: 'TM01', name: 'CutOffTime', desc: 'Received after the cut-off time for the requested settlement.' },
                { code: 'NOOR', name: 'NoOriginalTransaction', desc: 'No original transaction found (e.g. for a return) / not our customer.' },
                { code: 'NARR', name: 'Narrative', desc: 'Reason given as free text — the escape hatch. A smell when a real code existed.' },
                // cancellation reasons (camt.056)
                { code: 'DUPL', name: 'DuplicatePayment', desc: 'Cancellation: a duplicate payment was sent.' },
                { code: 'FRAD', name: 'FraudulentOrigin', desc: 'Cancellation: fraud suspected — freeze and return.' },
                { code: 'TECH', name: 'TechnicalProblem', desc: 'Cancellation: a technical error in the original instruction.' },
                { code: 'CUST', name: 'RequestedByCustomer', desc: 'Cancellation: the customer requested it.' },
                { code: 'AGNT', name: 'IncorrectAgent', desc: 'Cancellation: wrong agent / routing error.' },
                { code: 'UPAY', name: 'UnduePayment', desc: 'Cancellation: the payment should not have been made.' }
            ]
        },
        {
            id: 'status',
            name: 'Status codes',
            field: 'GrpSts / TxSts — in pain.002 & pacs.002',
            blurb: 'Where a payment sits on the timeline: received → validated → accepted → settlement in process → completed → credited. Not yes/no — a snapshot.',
            note: 'The External Payment Transaction Status set. These are the ones you meet constantly.',
            codes: [
                { code: 'RCVD', name: 'Received', desc: 'The message arrived; nothing checked yet.' },
                { code: 'ACTC', name: 'AcceptedTechnicalValidation', desc: 'Structure valid: schema passed, mandatory fields present.' },
                { code: 'ACCP', name: 'AcceptedCustomerProfile', desc: 'Technical and customer-profile checks passed.' },
                { code: 'ACSP', name: 'AcceptedSettlementInProcess', desc: 'Accepted and settlement is underway. "It’s moving" — not yet arrived.' },
                { code: 'ACWP', name: 'AcceptedWithoutPosting', desc: 'Accepted, but not yet credited to the creditor. Common cross-border.' },
                { code: 'ACSC', name: 'AcceptedSettlementCompleted', desc: 'Settlement on the debtor side is completed.' },
                { code: 'ACCC', name: 'AcceptedCreditorAccountCredited', desc: 'The strongest yes: the money is in the beneficiary’s account.' },
                { code: 'ACWC', name: 'AcceptedWithChange', desc: 'Accepted, but the bank altered something (a repaired field).' },
                { code: 'PDNG', name: 'Pending', desc: 'Accepted but waiting — a cut-off, a check, a business hour.' },
                { code: 'PART', name: 'PartiallyAccepted', desc: 'A batch: some accepted, some rejected. Read the per-transaction statuses.' },
                { code: 'RJCT', name: 'Rejected', desc: 'Refused — carries a reason code.' }
            ]
        },
        {
            id: 'purpose',
            name: 'Purpose codes',
            field: 'Purp/Cd — the payment’s declared reason',
            blurb: 'What a payment is for, read at the far end (beneficiary bank, regulator, statistics). Mandatory in some corridors.',
            note: 'A common selection of the External Purpose set (hundreds of codes, updated quarterly).',
            codes: [
                { code: 'SALA', name: 'SalaryPayment', desc: 'Payment of salary/wages.' },
                { code: 'PENS', name: 'PensionPayment', desc: 'Payment of a pension.' },
                { code: 'SSBE', name: 'SocialSecurityBenefit', desc: 'A social-security or state benefit payment.' },
                { code: 'SUPP', name: 'SupplierPayment', desc: 'Payment to a supplier.' },
                { code: 'GDDS', name: 'PurchaseSaleOfGoods', desc: 'Payment for goods.' },
                { code: 'SCVE', name: 'PurchaseSaleOfServices', desc: 'Payment for services.' },
                { code: 'TRAD', name: 'TradeServices', desc: 'Trade-finance settlement.' },
                { code: 'DIVD', name: 'Dividend', desc: 'Payment of a dividend.' },
                { code: 'INTE', name: 'Interest', desc: 'Payment of interest.' },
                { code: 'LOAN', name: 'Loan', desc: 'Loan disbursement or repayment.' },
                { code: 'RENT', name: 'Rent', desc: 'Payment of rent.' },
                { code: 'TAXS', name: 'TaxPayment', desc: 'Payment of tax.' },
                { code: 'VATX', name: 'ValueAddedTaxPayment', desc: 'Payment of VAT.' },
                { code: 'INTC', name: 'IntraCompanyPayment', desc: 'A transfer between entities of the same group.' },
                { code: 'TREA', name: 'TreasuryPayment', desc: 'A treasury movement.' },
                { code: 'CASH', name: 'CashManagementTransfer', desc: 'A cash-management transfer.' },
                { code: 'CORT', name: 'TradeSettlement', desc: 'Settlement of a trade, e.g. against an FX or securities deal.' },
                { code: 'HEDG', name: 'Hedging', desc: 'A hedging-related payment.' },
                { code: 'CBFF', name: 'CapitalBuilding', desc: 'Capital building / savings.' },
                { code: 'PHON', name: 'MobileP2B', desc: 'Mobile person-to-business payment.' }
            ]
        },
        {
            id: 'category-purpose',
            name: 'Category purpose',
            field: 'CtgyPurp/Cd — a high-level category read by banks in the chain',
            blurb: 'The coarse category that can trigger special processing (e.g. route a batch into payroll handling, claim priority settlement).',
            note: 'A common selection of the External Category Purpose set.',
            codes: [
                { code: 'SALA', name: 'SalaryPayment', desc: 'Handle as payroll.' },
                { code: 'PENS', name: 'PensionPayment', desc: 'Handle as pension disbursement.' },
                { code: 'SUPP', name: 'SupplierPayment', desc: 'A supplier payment batch.' },
                { code: 'TAXS', name: 'TaxPayment', desc: 'A tax payment.' },
                { code: 'TRAD', name: 'Trade', desc: 'Trade settlement.' },
                { code: 'TREA', name: 'TreasuryPayment', desc: 'Treasury / interbank position.' },
                { code: 'CASH', name: 'CashManagementTransfer', desc: 'Cash management.' },
                { code: 'CORT', name: 'TradeSettlement', desc: 'Settlement of an FX or securities trade (often priority).' },
                { code: 'DIVI', name: 'Dividend', desc: 'Dividend run.' },
                { code: 'GOVT', name: 'GovernmentPayment', desc: 'A government payment.' },
                { code: 'HEDG', name: 'Hedging', desc: 'Hedging.' },
                { code: 'INTC', name: 'IntraCompanyPayment', desc: 'Intra-group transfer.' },
                { code: 'SECU', name: 'Securities', desc: 'Securities-related.' },
                { code: 'SSBE', name: 'SocialSecurityBenefit', desc: 'Social-security benefit run.' }
            ]
        },
        {
            id: 'settlement-method',
            name: 'Settlement method',
            field: 'SttlmMtd — in the settlement information',
            blurb: 'How the banks settle this payment. A closed, complete list of four.',
            codes: [
                { code: 'INDA', name: 'InstructedAgent', desc: 'Settle across an account the instructed agent services.' },
                { code: 'INGA', name: 'InstructingAgent', desc: 'Settle across an account the instructing agent services.' },
                { code: 'CLRG', name: 'ClearingSystem', desc: 'Settle through a clearing system (the system’s own books). Used by HVPS+/RTGS, not CBPR+.' },
                { code: 'COVE', name: 'CoverMethod', desc: 'A separate cover payment (pacs.009 COV) settles the funds behind the customer leg.' }
            ]
        },
        {
            id: 'charge-bearer',
            name: 'Charge bearer',
            field: 'ChrgBr — who pays the charges',
            blurb: 'Who bears the charges on the payment. A closed, complete list of four.',
            codes: [
                { code: 'DEBT', name: 'BorneByDebtor', desc: 'All transaction charges are borne by the debtor (the payer).' },
                { code: 'CRED', name: 'BorneByCreditor', desc: 'All transaction charges are borne by the creditor (the payee).' },
                { code: 'SHAR', name: 'Shared', desc: 'Charges are shared — debtor pays their side, creditor pays theirs.' },
                { code: 'SLEV', name: 'FollowingServiceLevel', desc: 'Charges follow the rules of the agreed service level (e.g. a scheme).' }
            ]
        },
        {
            id: 'credit-debit',
            name: 'Credit / Debit indicator',
            field: 'CdtDbtInd — direction of an amount or entry',
            blurb: 'Whether an amount or statement entry adds to or subtracts from the account. Two values.',
            codes: [
                { code: 'CRDT', name: 'Credit', desc: 'A credit — money added to the account.' },
                { code: 'DBIT', name: 'Debit', desc: 'A debit — money taken from the account.' }
            ]
        },
        {
            id: 'payment-method',
            name: 'Payment method',
            field: 'PmtMtd — in pain.001 payment information',
            blurb: 'How the payment is made. A short closed list.',
            codes: [
                { code: 'TRF', name: 'CreditTransfer', desc: 'A normal credit transfer (push).' },
                { code: 'TRA', name: 'CreditTransferAdvice', desc: 'A credit transfer with an advice.' },
                { code: 'CHK', name: 'Cheque', desc: 'Payment by cheque.' },
                { code: 'DD', name: 'DirectDebit', desc: 'A direct debit (pull).' }
            ]
        },
        {
            id: 'balance-type',
            name: 'Balance types',
            field: 'Bal/Tp/CdOrPrtry/Cd — in camt.052 / camt.053',
            blurb: 'The kinds of balance on a statement. Opening + entries must equal closing; booked is not the same as available.',
            note: 'A common selection of the External Balance Type set.',
            codes: [
                { code: 'OPBD', name: 'OpeningBooked', desc: 'Booked balance at the start of the period.' },
                { code: 'CLBD', name: 'ClosingBooked', desc: 'Booked balance at the end — the figure your ledger must match.' },
                { code: 'PRCD', name: 'PreviouslyClosedBooked', desc: 'Yesterday’s close; should equal today’s opening (a continuity check).' },
                { code: 'CLAV', name: 'ClosingAvailable', desc: 'What you can actually spend — booked minus holds and value-dating.' },
                { code: 'OPAV', name: 'OpeningAvailable', desc: 'Available balance at the start of the period.' },
                { code: 'ITBD', name: 'InterimBooked', desc: 'A booked balance during the day (intraday, camt.052).' },
                { code: 'FWAV', name: 'ForwardAvailable', desc: 'Funds available on a future value date.' }
            ]
        },
        {
            id: 'bank-tx-domain',
            name: 'Bank transaction domains',
            field: 'BkTxCd/Domn/Cd — the top level of a bank transaction code',
            blurb: 'The domain that classifies what kind of movement a statement entry is (payments, account management, securities…).',
            note: 'The top-level domains only; each has its own families and sub-families.',
            codes: [
                { code: 'PMNT', name: 'Payments', desc: 'Payment transactions (credit transfers, direct debits, cards).' },
                { code: 'ACMT', name: 'AccountManagement', desc: 'Account-management movements (fees, interest, adjustments).' },
                { code: 'CAMT', name: 'CashManagement', desc: 'Cash-management operations.' },
                { code: 'SECU', name: 'Securities', desc: 'Securities transactions.' },
                { code: 'FORX', name: 'ForeignExchange', desc: 'FX transactions.' },
                { code: 'TRAD', name: 'TradeServices', desc: 'Trade-finance transactions.' },
                { code: 'DERV', name: 'Derivatives', desc: 'Derivatives transactions.' },
                { code: 'LDAS', name: 'LoansDepositsAdvances', desc: 'Loans, deposits and advances.' }
            ]
        }
    ];
    return { SETS: SETS };
})();
window.CODESETS = CODESETS;
