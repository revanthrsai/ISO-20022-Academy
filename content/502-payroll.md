---
title: "Payroll: One Instruction, Two Hundred Payments"
level: 500
category: Case Studies
summary: "Bob's company pays 200 staff on the last Friday of the month. Nobody builds 200 separate transfers. Watch one batch instruction fan out into hundreds of payments — and how the company, and each employee, gets told what happened."
minutes: 9
updated: 2026-07-13
tags: [case-study, payroll, bulk, pain.001, batch-booking, pacs.008, camt.054]
related: [501-customer-transfer, 301-pain-family, 303-camt-family, 311-camt-053-reconciliation]
earnedSkill: "Explain how a bulk payment differs from a single transfer: one pain.001 carrying many transactions, batch vs single booking, the fan-out into one pacs.008 per employee, and how reporting ties hundreds of credits back to one payroll run."
num: 502
status: published
---

> **The problem first.** It's the last Friday of the month and Bob's company has to pay 200 people. Building 200 separate transfers by hand would take all day and guarantee mistakes. The finance team uploads one file, approves it once, and by Monday 200 salaries have landed — each employee seeing their own clean credit, the company seeing one debit.

The last case study was one payment. Payroll is the same machinery scaled up: still pain → pacs → camt, but the very first message now carries many payments at once. Work out *how* it carries them and the rest follows.

## How does one instruction become two hundred payments?

{{think}}
Two hundred salaries, all from the same company account, all on the same date — only the employee and the amount change. You've already met the pain.001 and its nested three-block shape.

Given that shape, how does *one* pain.001 carry all 200? And where in it would you put the choice of whether the company's account shows one debit or two hundred?
{{reveal}}
The pain.001 nests: **one Group Header** (*payroll run, June 2026, 200 payments, total ₹1.34 crore*), **one Payment Information block** (shared debtor, account, date — *debit our salary account on the 30th*), and **200 Credit Transfer Transactions** (one per employee: their account, their net salary, a per-payment reference like `PAYROLL-JUN26-0147`). One header, one shared block, two hundred leaves. The company approves the whole tree once.

And the one-debit-or-many choice is a single flag in that Payment Information block: `BatchBooking`.
{{/think}}

That flag shapes everything downstream: **batch booking (true)** shows the company's account *one* debit of ₹1.34 crore (clean for its books; the per-employee detail lives in notifications and the statement); **single booking (false)** shows *200* separate debits (noisier, but each reconciles on its own). Payroll almost always chooses batch booking: one number to match against the payroll register. The fan-out into individual payments still happens — it just doesn't clutter the company's statement.

## The fan-out

The company sent one pain.001; the bank does the multiplying: **pain.002** — the bank validates the whole file and accepts it (200 payments queued for the 30th); **200 × pacs.008** — on execution date the bank generates *one interbank credit transfer per employee*, each routed to that employee's bank, each with its own `UETR`; **200 × pacs.002** — each receiving bank confirms its credit; **camt.054** — every employee's bank fires a credit notification (*salary, ₹67,000, from Bob's company*); **camt.053** — the company's statement shows the single batch debit (matched to the register) while each employee's statement shows their one credit.

{{embed:explorer:PAIN.001|Open the pain.001 that carries the whole batch}}

## One bad account in two hundred

{{think}}
One employee changed banks last week and their old account is closed. Their salary is transaction 147 of 200 in the file. What happens to *that* payment — and, more importantly, to the other 199? And why is that outcome the whole point of the fan-out?
{{reveal}}
That single payment comes back as a **pacs.004 return**, with a reason (*account closed*). The other 199 settle normally. Nobody's payday is held hostage by one stale account number.

That *isolation* is exactly why the bank fans the batch out into independent pacs.008 payments. Each is its own transaction on the rail — routed, settled, and if necessary returned, on its own. A batch that settled as one indivisible lump would fail as one lump; fanned out, a failure is contained to the one payment it belongs to.
{{/think}}

Everything from the single transfer still holds — same families, same order, same references. Three things scaled: the instruction got a **tree structure** (one pain.001 nesting many transactions); **one became many on the rail** (independent pacs.008s); and **reporting split by audience** (the company sees one batch line, each employee sees their own credit). The thread still holds too — each transaction's reference (`PAYROLL-JUN26-0147`) rides its pacs.008 and surfaces in that employee's camt.054, so any single salary in a 200-payment run is traceable end to end.

{{aside:model|The mental model}}
**Payroll = one pain.001 tree fanning out into N independent pacs.008 payments.** `BatchBooking` decides whether the payer sees one debit or many; reporting splits by audience (one batch line for the company, one notification per employee); and every payment stays individually traceable by its own reference. The fan-out buys **failure isolation** — one bad account returns alone.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Reconciling a batch-booked run is the trap: the company's statement shows *one* ₹1.34 crore entry, but it's really 200 payments — you have to *explode* the batch-booked `Ntry` (its many `TxDtls`) to match each salary to each employee, exactly the lesson from the camt.053 chapter. And a `PART` group status on the payroll's `pacs.002` means "some failed" — drop to `TxSts` to find which.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Expecting the run to fail on one bad account.** Fanned out, only that payment returns; the rest go through. Don't void the batch.
- **Reconciling a batch-booked debit at entry level.** One headline entry is many payments — explode the `TxDtls`, or you mismatch all of them.
- **Confusing batch and single booking.** They change what the payer's statement looks like, not whether the payments fan out.
{{/aside}}

{{aside:map|The map}}
Volume on top of the base case:

- The single-payment spine → {{link:article:501-customer-transfer|customer transfer}}.
- The instruction's nested shape → {{link:article:301-pain-family|the pain family}}.
- Reconciling the batch → {{link:article:311-camt-053-reconciliation|camt.053, line by line}}.
{{/aside}}

{{aside:ref|Reference card}}
- **One pain.001** nests: 1 GrpHdr → 1 PmtInf (shared debtor/account/date) → N transactions.
- **`BatchBooking`** = one debit (true) vs N debits (false) on the payer's statement.
- **Fan-out:** the bank emits one independent `pacs.008` per employee — its own routing, settlement, and (if needed) `pacs.004` return.
- **Failure isolation:** one bad account returns alone; the rest settle.
- **Reconcile** the batch by exploding the batch-booked entry's `TxDtls`.
{{/aside}}

{{embed:playground|Edit a batch pain.001 in the Playground}}

## So what can you do now?

You can explain how a bulk payment differs from a single transfer: one pain.001 carrying a header plus many transactions, the batch-vs-single booking choice, the fan-out into one independently-routed pacs.008 per beneficiary, and how a single failure returns on its own without touching the rest. You can follow how reporting splits — one batch line for the payer, one notification per payee — while each payment's own reference keeps it individually traceable.

{{check:Why does payroll fit naturally into one batched instruction?|Many payments share one debtor, one account, and one date — the file states that once|Each salary legally needs its own file|Employees must be paid strictly one at a time}}

{{check:One employee's account number is wrong in a 500-payment payroll file. The likely result?|That one payment fails and comes back with a reason; the rest go through|The whole month's payroll is void|The bank pays the wrong person with no way back}}
