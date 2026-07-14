---
title: "Purpose Codes: Telling the System Why"
level: 600
category: Field Guides
num: 604
summary: "SALA means salary. DIVD means dividend. Four letters that decide how a payment is processed, taxed, screened, and reported — and one of the easiest fields to get quietly wrong."
minutes: 6
updated: 2026-07-13
tags: [purpose codes, purp, ctgypurp, external code sets, compliance]
related: [302-pain-001, 502-payroll, 408-reason-codes]
earnedSkill: "Tell Purp from CtgyPurp, know where purpose codes come from and who sets them, and explain why some corridors reject a payment that arrives without one."
status: published
---

> **The problem first.** Two payments leave the same company account on the same afternoon, for the same amount, to two people with the same surname. One is an employee's salary. The other settles an invoice from a family-run supplier. The receiving bank must treat them differently — one may get payroll handling and privacy conventions, the other feeds trade statistics, and in several countries the tax treatment differs. Nothing in the amount, the names, or the accounts reveals which is which.

Where does a payment say *why* it exists? Work out what's missing and you've found the field.

## What's the one thing that distinguishes them?

{{think}}
The two payments are identical on every field you'd normally look at: amount, date, account, even the surname. Yet they must be processed, taxed, and reported differently.

What does the message need to carry to tell them apart — and who is in a position to set it?
{{reveal}}
A dedicated field declaring the payment's *reason*: the **purpose code**, `Purp`. Inside it, a four-letter code from a published list — `SALA` (salary), `SUPP` (supplier), `DIVD` (dividend), `TAXS` (tax), `PENS` (pension), `INTC` (intra-company). It's set by whoever *initiates* the payment (only the payer knows why they're paying), and carried untouched through the chain, exactly like the customer's `EndToEndId`.

Where remittance information tells the *receiver's ERP* which invoice the money pays, the purpose code tells the *machinery in between* what kind of event this is.
{{/think}}

The code comes from the **external purpose code list** ISO 20022 maintains *outside* the message schemas, so new codes can be added without changing the messages. It's the customer speaking, in a vocabulary every machine on the route understands.

## Purp's confusing sibling

{{think}}
Right next to `Purp` lives `CtgyPurp` (Category Purpose), and swapping them is one of the commonest field mistakes. Here's the clue: `Purp` is *fine-grained* and aimed at the far end — the beneficiary's bank, the regulator, the statistics office ("this specific payment is a dividend").

So what would a *coarse-grained* code, aimed at the banks in the **middle**, be for?
{{reveal}}
Triggering **processing**. `CtgyPurp` is a high-level category the intermediary banks read to decide *how to handle* a payment: a `SALA` category can route a whole batch into payroll handling; a treasury category can claim priority settlement.

So: `Purp` = *what this payment is* (read at the far end); `CtgyPurp` = *how to handle it* (read in the middle). A payroll run uses both — a salary category so banks process the batch as payroll, and `SALA` on each transaction so the far end knows what each credit is.
{{/think}}

{{flow:Who reads which code|Corporate ERP ~ sets Purp and CtgyPurp in the pain.001|-> pain.001|Banks in the chain ~ read CtgyPurp for processing decisions|-> pacs.008|Beneficiary bank ~ applies local rules to Purp|-> reporting|Regulator and statistics ~ consume Purp downstream}}

In much of the world `Purp` is good practice; in a growing set of corridors it is *law*. Several jurisdictions — across the Middle East, South Asia, and East Asia — require an approved purpose code on incoming or outgoing cross-border payments and will **reject or hold** one that arrives without it (the lists are sometimes national, published by the central bank, not the ISO external list). There, the purpose code isn't metadata — it's a condition of the money arriving at all. Even where it's voluntary, a correctly coded payment sails past filters that would otherwise stop it for a human question, because the question — *what is this payment for?* — was answered before anyone had to ask.

{{aside:model|The mental model}}
**The purpose code answers "why?" before it's asked.** `Purp` = fine-grained, read at the far end (beneficiary bank, regulator, statistics). `CtgyPurp` = coarse category, read by the banks in the middle to trigger *processing*. Set by the initiator, carried untouched, drawn from an external code list.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Both codes come from external code sets (evolve without a schema change), so validate against the current list, not a hard-coded enum — and in mandatory corridors, against the *national* list. Keep `Purp` and `CtgyPurp` in their own lanes: put a fine-grained code in the category field and intermediary banks make processing decisions on data meant for the far end, while the far end loses the detail entirely.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **No code in a mandatory corridor.** Complete, funded, correct — and it still bounces or queues, because the one four-letter answer a regulator demands is missing.
- **The default nobody chose.** An ERP template ships with a placeholder and nobody changes it — a year of supplier, tax, and salary payments all claim to be the same thing. Statistics polluted, audits uncomfortable.
- **`Purp` treated as free text.** An invented code that isn't on the list: schema-valid where the code set isn't checked, meaningless or rejected everywhere else.
- **`Purp` and `CtgyPurp` swapped.** Middle banks act on far-end information, and the far end loses the detail.
{{/aside}}

{{aside:map|The map}}
The field that says why — and the end of the Library:

- Where the customer sets it → {{link:article:302-pain-001|pain.001, field by field}}.
- `CtgyPurp` doing real work → {{link:article:502-payroll|the payroll batch}}.
- The same external-code machinery, pointed at failure → {{link:article:408-reason-codes|reason codes}}.
{{/aside}}

{{aside:ref|Reference card}}
- **`Purp`** = the payment's declared reason (SALA, SUPP, DIVD, TAXS, PENS, INTC…). Fine-grained, far end.
- **`CtgyPurp`** = a coarse category the middle banks read to trigger *processing* (e.g. payroll handling, priority).
- **Set by the initiator**, carried untouched, from the **external purpose code list** (outside the schema).
- **Mandatory in some corridors** — a payment without one can be rejected or held.
- **Don't swap them:** what-it-is (far end) vs how-to-handle-it (middle).
{{/aside}}

{{embed:article:302-pain-001|Where the customer sets it: pain.001 field by field}}
{{embed:article:502-payroll|CtgyPurp doing real work: the payroll batch}}

{{check:What is the difference between Purp and CtgyPurp?|Purp is the fine-grained reason read at the far end; CtgyPurp is a high-level category that can trigger special processing by banks in the chain|They are interchangeable synonyms|CtgyPurp is mandatory and Purp is deprecated}}
{{check:Where does the purpose code list live?|In an external code set maintained outside the message schemas, so codes can change without changing messages|Hard-coded into the pacs.008 schema|Each bank invents its own list}}
{{check:A payment into a purpose-code-mandatory corridor arrives without one. What happens?|It can be rejected or held until the code is supplied|Nothing, purpose codes are always optional|The receiving bank invents a code on the sender's behalf}}
