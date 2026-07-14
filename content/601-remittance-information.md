---
title: "Remittance Information: The Invoice Inside the Payment"
level: 600
category: Field Guides
num: 601
summary: "The field that says WHY money moved — the closest thing ISO 20022 has to a reason for existing. Get it right and reconciliation is automatic; get it wrong and a human types it in by hand."
minutes: 8
updated: 2026-07-13
tags: [remittance, structured data, rmtinf, reconciliation]
related: [301-pacs-008, 303-camt-family, 311-camt-053-reconciliation]
earnedSkill: "Tell structured from unstructured remittance information at a glance, and explain why a 140-character free-text blob costs banks real money."
status: published
---

> **The problem first.** A building-materials supplier in Chennai receives about 4,000 payments a month. Every one arrives as two things: money, and a mystery — *which invoice is this for?* In accounts-receivable, a person squints at a statement line reading `PAYMENT THX REF 88213/A INV` and guesses. Guess wrong, and a customer who already paid gets a late-payment reminder and an angry phone call comes back.

The money arrived fine. The *meaning* didn't. And the field meant to carry that meaning — **Remittance Information** (`RmtInf`) — is the single best place to see what ISO 20022 was actually built to fix. Let's derive the fix before naming it.

## Make the invoice reference matchable

{{think}}
You're designing the payment format for that supplier's problem. The money always arrives; what fails is knowing *which invoice* it pays. Today the payer types free text and a human reads it.

What would you put in the message so the supplier's ERP matches the payment to the exact invoice with *zero* guessing — and, just as important, who along the bank chain should be allowed to change it?
{{reveal}}
Two moves:

- **Structure it.** Instead of one free-text line, give the reference a named, machine-readable home — a *structured* block (`Strd`) carrying the creditor's own reference, the document number, its date, the amount applied. Now matching is a **lookup**, not a judgement call.
- **Freeze it in transit.** Nobody in the chain may rewrite it. Remittance information is a **passenger** — carried untouched from the payer's accounting system all the way into the receiver's.

Get those two and the receipt books itself. Miss them and it creates work.
{{/think}}

## The two flavours

Open a `pacs.008` or `pain.001` and `RmtInf` offers a choice: **`Ustrd`** (unstructured — a free-text line, the old MT field 70, everything from `INVOICE 4471` to `THX FOR LUNCH`, which machines can't reliably parse, so humans do), or **`Strd`** (structured — the same facts in named elements). Inside `Strd`, the workhorses are **`CdtrRefInf`** (the creditor's reference, often an ISO 11649 code starting `RF` with a built-in check digit — the supplier prints it on the invoice, the payer sends it back unchanged, matching becomes a lookup) and **`RfrdDocInf` + `RfrdDocAmt`** (the referred document: *"this pays invoice `INV-2026-4471`, dated 3 June, ₹8,40,000 applied, ₹16,800 discount"*). One payment can list several documents — which is how a single transfer settles five invoices and short-pays a sixth *with the reason attached*. Free text collapses all that into `PART PAYMENT VARIOUS`; structure keeps it.

{{flow:How the invoice reference travels|Payer ~ copies the RF reference from the invoice|-> pain.001|Payer's bank ~ carries RmtInf untouched|-> pacs.008|Supplier's bank ~ delivers it with the credit|-> camt.054|Supplier's ERP ~ matches and closes the invoice automatically}}

When people say ISO 20022 brings "rich, structured data," this field is what they mean. Matched automatically, a receipt costs effectively nothing and the invoice closes the moment the `camt.054` lands; matched by hand, it costs minutes, arrives a day late, and occasionally lands on the wrong account and becomes a dispute. Multiply by 4,000 a month and the free-text blob isn't a formatting preference — it's headcount.

## "It settled" is no comfort

{{think}}
A payment crosses one legacy hop that still thinks in MT and squeezes 9,000 characters of beautiful structure into 140. Or a converter quietly drops the `Strd` block instead of mapping it. The money settles perfectly either way.

So what was actually lost — and why is "but it settled" cold comfort?
{{reveal}}
The *business meaning* — which invoices the money pays. The ERP now receives `INVOICE 4471 AND OTH…` (the rest vanished), or nothing structured at all, so the credit drops into an unapplied-cash queue for a human to solve.

"It settled" only means the money arrived. Reconciliation is a *different* success: money that arrives without its paperwork is a mystery with a balance. The whole point of `RmtInf` is that the payment carries its own paperwork — abuse it and you've made the money arrive without it.
{{/think}}

{{aside:model|The mental model}}
**The payment carries its own paperwork.** Structured `RmtInf` (`Strd`) is machine-matchable — invoice closes itself; unstructured (`Ustrd`) is human work. And it's a **passenger**: no agent in the chain may alter it, so the payer's accounting data reaches the receiver's intact.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Two elements do the heavy lifting: `CdtrRefInf/Ref` (an `RF…` ISO 11649 reference with a check digit — validate it) and `RfrdDocInf`/`RfrdDocAmt` (per-invoice detail, repeatable for multi-invoice payments). It's the single biggest lever on a corporate's auto-reconciliation rate (see the camt.053 chapter) — and the rulebooks oblige agents to pass it on unchanged, so never "normalise" it in a gateway.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Truncation at a legacy hop.** 9,000 chars of structure squeezed into 140 — trailing invoices vanish.
- **A human-typed reference.** A clerk retypes the `RF` and drops a character; the check digit catches it *only if* someone validates. Free text validates nothing.
- **Structure dropped on conversion.** An agent throws `Strd` away rather than mapping it — settled, but meaning destroyed in transit.
- **The blob dressed as structure.** `INV 4471 THX` stuffed into a structured element: the XML validates, the problem survives.
{{/aside}}

{{aside:map|The map}}
The passenger and its vehicles:

- Where it sits in the interbank message → {{link:article:301-pacs-008|pacs.008}}.
- How it's delivered to the receiver → {{link:article:303-camt-family|the camt family}}.
- The reconciliation it powers → {{link:article:311-camt-053-reconciliation|camt.053, line by line}}.
{{/aside}}

{{aside:ref|Reference card}}
- **`RmtInf`** = why the money moved. `Ustrd` (free text, human) vs `Strd` (structured, machine-matchable).
- **In `Strd`:** `CdtrRefInf` (the `RF…` creditor reference) + `RfrdDocInf`/`RfrdDocAmt` (per-invoice, repeatable).
- **It's a passenger:** carried unchanged; no agent may rewrite it.
- **Rides** pain.001 → pacs.008 → camt.054 → camt.053. Same passenger, four vehicles.
- **"Settled" ≠ "reconcilable":** losing `Strd` loses the meaning, not the money.
{{/aside}}

{{embed:explorer:PACS.008|See where RmtInf sits inside a live pacs.008}}
{{embed:article:303-camt-family|How the camt family delivers it to the receiver}}

{{check:What does structured remittance information eliminate?|Manual matching of payments to invoices|The need for a creditor reference|FX conversion costs}}
{{check:Who is allowed to alter RmtInf on its way through the chain?|No one — agents must pass it on unchanged|Each bank may rewrite it into its own format|Only the payer's bank may shorten it}}
{{check:A payment settles but its Strd block was dropped at a conversion hop. What was actually lost?|The business meaning — which invoices the money pays|The money itself|The debtor's consent to pay}}
