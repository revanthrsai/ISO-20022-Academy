---
title: "Payroll: One Instruction, Two Hundred Payments"
level: 500
category: Case Studies
summary: "Bob's company pays 200 staff on the last Friday of the month. Nobody builds 200 separate transfers. Watch how a single batch instruction fans out into hundreds of payments, and how the bank, and each employee, gets told what happened."
minutes: 9
updated: 2026-06-29
tags: [case-study, payroll, bulk, pain.001, batch-booking, pacs.008, camt.054]
related: [502-payroll, 501-customer-transfer, 301-pain-family, 303-camt-family]
earnedSkill: "Explain how a bulk payment differs from a single transfer: one pain.001 carrying many transactions, the choice between batch and single booking, the fan-out into one pacs.008 per employee, and how reporting (camt.053/054) ties hundreds of credits back to a single payroll run."
num: 502
status: published
---

> **The problem first.** It's the last Friday of the month and Bob's company has to pay 200 people. Building 200 separate transfers by hand would take all day and guarantee mistakes. The finance team uploads one file, approves it once, and by Monday morning 200 salaries have landed, each employee seeing their own clean credit, the company seeing one debit on its statement. How does *one* instruction become *two hundred* payments, and how does everyone still get told exactly what happened to their slice?

The customer transfer in the last case study was one payment. Payroll is the same machinery scaled up: still pain → pacs → camt, but now the very first message carries many payments at once. Almost everything corporate (supplier runs, dividend payments, pension disbursements) works exactly this way. Payroll is the cleanest example.

## One file, many payments

The whole trick lives in the structure of a single **pain.001**. The customer credit transfer initiation isn't limited to one payment. It nests:

- **Group Header**: one per file. *This is payroll run for June 2026, 200 payments, total ₹1.34 crore, from Bob's company.*
- **Payment Information**: one or more blocks. Each groups payments that share a debtor account, an execution date, and a charge-bearer. Payroll usually has one: *debit our salary account on the 30th.*
- **Credit Transfer Transaction**: one per employee. Each carries the employee's account, their net salary, and a per-payment reference (`PAYROLL-JUN26-0147`).

So the file is a tree: one header, one payment-information block, two hundred transactions hanging off it. The company approves the whole tree once.

## Batch booking vs single booking

Here's the decision that shapes everything downstream, a single flag in the Payment Information block, `BatchBooking`:

- **Batch booking (true)**: the company's account shows **one** debit of ₹1.34 crore. Clean for the company's books; the per-employee detail lives in the notifications and statement.
- **Single booking (false)**: the account shows **200** separate debits. Noisier, but each line reconciles on its own.

Payroll almost always chooses batch booking: one debit, one number to reconcile against the payroll register. The fan-out into individual payments still happens; it just doesn't clutter the company's own statement.

## The fan-out

The company sent one pain.001. The bank now does the multiplying:

1. **pain.002: the receipt.** Bob's company's bank validates the whole file and accepts it: 200 payments queued for the 30th. *(Family: pain.)*
2. **200 × pacs.008: execution.** On execution date, the bank generates **one interbank credit transfer per employee**, each routed to that employee's bank, each with its own `UETR`. One instruction became two hundred independent payments on the rail. *(Family: pacs.)*
3. **200 × pacs.002: confirmations.** Each receiving bank confirms its credit. Most settle; if one employee's account was closed, that single payment comes back as a **pacs.004 return**, *without affecting the other 199*. That isolation is the point of the fan-out. *(Family: pacs.)*
4. **camt.054: each employee is notified.** Every employee's bank fires a credit notification: *salary, ₹67,000, from Bob's company.* Two hundred people, two hundred separate notifications. *(Family: camt.)*
5. **camt.053: both sides reconcile.** The company's statement shows the single batch debit; the payroll team matches it to the register. Each employee's statement shows their one credit. *(Family: camt.)*

{{embed:explorer:PAIN.001|Open the pain.001 that carries the whole batch}}

## What changed from a single transfer

Everything you learned in the customer transfer still holds: the families, the order, the references. Three things scaled:

- **The instruction got a tree structure.** One pain.001 now nests many transactions under a shared header.
- **One became many on the rail.** The bank fans the batch out into one pacs.008 per beneficiary, each independently routed, settled, and (if needed) returned.
- **Reporting splits by audience.** The company sees one batch line; each employee sees their own credit. The same payment run is reported two ways for two different readers.

The thread still holds: each transaction's own reference (`PAYROLL-JUN26-0147`) rides its pacs.008 and surfaces in that employee's camt.054, so even inside a 200-payment run, any single salary is traceable end to end.

{{embed:playground|Edit a batch pain.001 in the Playground}}

## So, what can you now do?

You can explain how a bulk payment differs from a single transfer: one pain.001 carrying a header plus many credit-transfer transactions, the batch-vs-single booking choice that decides whether the debtor sees one debit or many, the fan-out into one independently-routed pacs.008 per beneficiary, and how a single failure returns on its own without touching the rest of the run. You can follow how reporting splits, one batch line for the payer and one credit notification per payee, while each payment's own reference keeps it individually traceable.

{{check:Why does payroll fit naturally into one batched instruction?|Many payments share one debtor, one account, and one date — the file states that once|Each salary legally needs its own file|Employees must be paid strictly one at a time}}

{{check:One employee’s account number is wrong in a 500-payment payroll file. The likely result?|That one payment fails and comes back with a reason; the rest go through|The whole month’s payroll is void|The bank pays the wrong person with no way back}}
