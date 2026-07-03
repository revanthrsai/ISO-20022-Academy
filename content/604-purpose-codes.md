---
title: "Purpose Codes: Telling the System Why"
level: 600
num: 604
summary: "SALA means salary. DIVD means dividend. Four letters that decide how a payment is processed, taxed, screened, and reported, and one of the easiest fields to get quietly wrong."
minutes: 6
updated: 2026-07-03
tags: [purpose codes, purp, ctgypurp, external code sets, compliance]
related: [302-pain-001, 301-pacs-008, 502-payroll]
earnedSkill: "Tell Purp from CtgyPurp, know where purpose codes come from and who sets them, and explain why some corridors reject a payment that arrives without one."
status: published
---

> **The problem first.** Two payments leave the same company account on the same afternoon, for the same amount, to two people with the same surname. One is an employee's salary. The other settles an invoice from a family-run supplier. The receiving bank must treat them differently: one may enjoy payroll handling and privacy conventions, the other feeds into trade statistics, and in several countries the tax treatment of each is different. Nothing in the amount, the names, or the accounts reveals which is which. Where does a payment say *why* it exists?

In a small field with a short answer. ISO 20022 gives every payment a dedicated place to declare its reason: the **purpose code**. Where remittance information tells the *receiver's accounting system* which invoice the money pays, the purpose code tells the *machinery in between* what kind of event this payment is.

## Purp: the payment's declared reason

The element is **`Purp`**, carried in the transaction block of the pain.001 and travelling untouched into the pacs.008, exactly like the customer's `EndToEndId`. Inside it, `Cd` holds a four-letter code drawn from a published list: the **external purpose code list** that ISO 20022 maintains outside the message schemas, so codes can be added without changing the messages themselves. A few you will meet constantly:

- **`SALA`**: salary payment.
- **`SUPP`**: supplier payment.
- **`DIVD`**: dividend.
- **`TAXS`**: tax payment.
- **`PENS`**: pension.
- **`INTC`**: an intra-company transfer between related entities.

The code is set by whoever initiates the payment, and the agents in the chain carry it without altering it. It is the customer speaking, in a vocabulary every machine on the route understands.

## CtgyPurp: the same question at a different altitude

Nearby lives a sibling that trips almost everyone: **`CtgyPurp`**, the Category Purpose. The difference is altitude, and who is listening.

- **`Purp`** is *fine-grained* and aimed at the far end: the beneficiary's bank, the regulator, the statistics office. "This specific payment is a dividend."
- **`CtgyPurp`** is *coarse-grained* and aimed at the banks in the middle: it can trigger special **processing**. A category of `SALA` can route a whole batch into payroll handling; a treasury category can claim priority settlement.

A payroll run shows both at work: the file carries a salary category so banks process the batch as payroll, and each transaction carries `SALA` so the far end knows what each credit is.

{{flow:Who reads which code|Corporate ERP ~ sets Purp and CtgyPurp in the pain.001|-> pain.001|Banks in the chain ~ read CtgyPurp for processing decisions|-> pacs.008|Beneficiary bank ~ applies local rules to Purp|-> reporting|Regulator and statistics ~ consume Purp downstream}}

## Where purpose codes stop being optional

In much of the world, `Purp` is good practice. In a growing set of corridors it is law. Several jurisdictions, particularly across the Middle East, South Asia, and East Asia, require an approved purpose code on incoming or outgoing cross-border payments and will **reject or hold** a payment arriving without one. The lists are sometimes national rather than the ISO external list, published by the central bank. For anyone operating those corridors, the purpose code is not metadata: it is a condition of the money arriving at all.

Even where it's voluntary, the incentive is straight-through processing. A correctly coded payment sails past filters that would otherwise stop it for a human question, because the question ("what is this payment for?") was answered before anyone had to ask it.

## What breaks

- **No code in a mandatory corridor.** The payment is complete, funded, and correct, and it still bounces or sits in a queue, because the one four-letter answer a regulator demands is missing.
- **The default nobody chose.** An ERP template ships with a placeholder code and nobody changes it, so a year of mixed supplier, tax, and salary payments all claim to be the same thing. Statistics are polluted; audits get uncomfortable.
- **Purp treated as free text.** A creative implementer invents a code that isn't on the list. Schema-valid in structures that don't validate the code set, meaningless or rejected everywhere else.
- **Purp and CtgyPurp swapped.** The fine-grained code lands in the category field, so intermediary banks make processing decisions on information meant for the far end, and the far end loses the detail entirely.

The phrase to keep: **the purpose code answers the question before it's asked.** Every payment eventually has to explain itself; the coded ones explain themselves at machine speed.

{{embed:article:302-pain-001|Where the customer sets it: pain.001 field by field}}
{{embed:article:502-payroll|CtgyPurp doing real work: the payroll batch}}

{{check:What is the difference between Purp and CtgyPurp?|Purp is the fine-grained reason read at the far end; CtgyPurp is a high-level category that can trigger special processing by banks in the chain|They are interchangeable synonyms|CtgyPurp is mandatory and Purp is deprecated}}
{{check:Where does the purpose code list live?|In an external code set maintained outside the message schemas, so codes can change without changing messages|Hard-coded into the pacs.008 schema|Each bank invents its own list}}
{{check:A payment into a purpose-code-mandatory corridor arrives without one. What happens?|It can be rejected or held until the code is supplied|Nothing, purpose codes are always optional|The receiving bank invents a code on the sender's behalf}}
