---
title: "Remittance Information: The Invoice Inside the Payment"
level: 600
num: 601
summary: "The field that says WHY money moved — and the closest thing ISO 20022 has to a reason for existing. Get it right and reconciliation is automatic; get it wrong and a human types it in by hand."
minutes: 8
updated: 2026-07-02
tags: [remittance, structured data, rmtinf, reconciliation]
related: [301-pacs-008, 303-camt-family]
earnedSkill: "Tell structured from unstructured remittance information at a glance, and explain why a 140-character free-text blob costs banks real money."
status: published
---

> **The problem first.** A building-materials supplier in Chennai receives about 4,000 payments a month. Every one of them arrives as two things: money, and a mystery. *Which invoice is this for?* Somewhere in the accounts-receivable team, a person is squinting at a bank statement line that reads `PAYMENT THX REF 88213/A INV` and guessing. If she guesses wrong, a customer who already paid gets a late-payment reminder — and an angry phone call comes back the other way.

The money arrived fine. The *meaning* didn't. The field that is supposed to carry that meaning is called **Remittance Information** — `RmtInf` in the message — and it is the single best place to see what ISO 20022 was actually built to fix.

## Two flavours that could not be more different

Open a `pacs.008` or a `pain.001` and `RmtInf` offers the sender a choice:

- **`Ustrd` — unstructured.** A free-text line. In the old SWIFT MT world this was field 70: four lines of 35 characters, everything from `INVOICE 4471` to `THX FOR LUNCH`. Machines cannot reliably parse it, so humans do.
- **`Strd` — structured.** The same information, broken into named, machine-readable elements: which document is being paid, its number, its date, the amount applied to it, discounts, a creditor's reference.

The difference sounds bureaucratic. It isn't. It is the difference between a payment that books itself and a payment that creates work.

## What the structured version actually holds

Inside `Strd`, the two workhorses are:

- **`CdtrRefInf` — the creditor's reference.** A reference the *receiver* issued (often an ISO 11649 code starting with `RF`, with a built-in check digit). The supplier printed it on the invoice; the payer sends it back unchanged. When it arrives, matching is a lookup, not a judgement call.
- **`RfrdDocInf` + `RfrdDocAmt` — the referred document.** "This pays **invoice** number `INV-2026-4471`, dated 3 June, amount applied **₹8,40,000**, cash discount **₹16,800**." One payment can list several documents — which is how a single transfer can settle five invoices and short-pay a sixth *with the reason attached*.

That last part is the quiet superpower. Real businesses don't pay one invoice at a time; they pay batches, take discounts, and dispute line items. Free text collapses all that nuance into `PART PAYMENT VARIOUS`. Structure keeps it.

{{flow:How the invoice reference travels|Payer ~ copies the RF reference from the invoice|-> pain.001|Payer's bank ~ carries RmtInf untouched|-> pacs.008|Supplier's bank ~ delivers it with the credit|-> camt.054|Supplier's ERP ~ matches and closes the invoice automatically}}

Notice who never touches the content: the banks. Remittance information is a **passenger**. The rulebooks oblige agents to pass it on unaltered — the payment carries its own paperwork from the payer's accounting system all the way into the receiver's.

## Why this field is the whole argument for ISO 20022

When people say ISO 20022 brings "rich, structured data," this field is what they mean. The business case is straight-through reconciliation:

- **Matched automatically**, a receipt costs effectively nothing and the invoice closes the moment the `camt.054` lands.
- **Matched by hand**, it costs minutes of a person's time, arrives a day late, and occasionally gets applied to the wrong account — which then costs a dispute.

Multiply by 4,000 payments a month and the free-text blob is not a formatting preference. It is headcount.

## What breaks

- **Truncation at a legacy hop.** The path crosses a system that still thinks in MT, and 9,000 characters of beautiful structure get squeezed into 140. The ERP receives `INVOICE 4471 AND OTH…` — the trailing invoices simply vanish.
- **The reference typed by a human.** The payer's clerk retypes the RF reference and misses a character. The ISO 11649 check digit catches it *if* someone validates; free text validates nothing.
- **Structure dropped on conversion.** An agent converts the message and quietly throws `Strd` away rather than mapping it. Technically the payment settled; commercially, the meaning was destroyed in transit.
- **The blob dressed as structure.** Lazy implementations stuff `INV 4471 THX` into a structured element. The XML validates. The problem survives.

The phrase to keep: **the payment carries its own paperwork.** When someone abuses `RmtInf`, they are making the money arrive without it.

## Where you'll meet it

`RmtInf` rides in the `pain.001` (the payer's instruction), is carried through the `pacs.008` (the interbank leg), and is handed to the receiver in the `camt.054` credit notification and the `camt.053` statement. Same passenger, four vehicles.

{{embed:explorer:PACS.008|See where RmtInf sits inside a live pacs.008}}
{{embed:article:303-camt-family|How the camt family delivers it to the receiver}}

{{check:What does structured remittance information eliminate?|Manual matching of payments to invoices|The need for a creditor reference|FX conversion costs}}
{{check:Who is allowed to alter RmtInf on its way through the chain?|No one — agents must pass it on unchanged|Each bank may rewrite it into its own format|Only the payer's bank may shorten it}}
{{check:A payment settles but its Strd block was dropped at a conversion hop. What was actually lost?|The business meaning — which invoices the money pays|The money itself|The debtor's consent to pay}}
