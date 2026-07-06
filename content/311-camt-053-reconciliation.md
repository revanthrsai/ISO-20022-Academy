---
title: "camt.053 Up Close: Reconciliation, Line by Line"
level: 300
category: Message Deep Dives
num: 311
summary: "The end-of-day statement is where ISO 20022 earns its keep for corporates. Open a camt.053 the way an ERP does: balances that must tie out, entries that carry their own references, and the one field that decides whether reconciliation is automatic or a human typing all afternoon."
minutes: 9
updated: 2026-07-06
tags: [camt.053, reconciliation, statement, balances, NtryRef, structured remittance, ERP]
related: [303-camt-family, 601-remittance-information, 309-the-four-identifiers, 502-payroll, 310-status-reports]
earnedSkill: "Read a camt.053 as an ERP does: check the balance chain (OPBD + entries = CLBD), read an entry's status, booking vs value date, bank transaction code and references, match a booked credit to an open receivable via EndToEndId or a structured creditor reference, explode a batch-booked entry into its transactions, and explain what makes an auto-reconciliation rate rise or fall."
status: published
---

> **The problem first.** It's 6am. Overnight, Sweety's company received 43 payments and made 88. Nobody is going to eyeball 131 lines. Her accounting system will open one file, and by the time she has coffee it should have matched every incoming payment to an open invoice, flagged the three it couldn't, and confirmed the closing balance equals what the ledger expected — untouched by human hands. That file is a **camt.053**, and whether the morning is quiet or a fire depends entirely on how well the fields inside it were populated. So let's read one the way the machine does.

The [camt family chapter](#/library) told you *what* a camt.053 is: the authoritative end-of-day statement, the replacement for MT940. This chapter is about *using* it — because "statement" undersells it. A camt.053 is the input to **reconciliation**, the single process that decides whether a finance team spends its morning on exceptions or on coffee. It is also, quietly, the best argument for ISO 20022 that exists: get the structure right and the reconciliation is free.

## The two things a statement must do

Every camt.053 has to answer two questions, and it has a distinct part for each:

- **"What was the balance?"** — the **`Bal`** blocks. At minimum an opening and a closing figure.
- **"What moved?"** — the **`Ntry`** blocks. One booked entry per movement on the account.

And the two must agree. **Opening balance + the sum of entries = closing balance.** That equation is the first thing a reconciliation engine checks, because if it doesn't hold, the statement is incomplete or corrupt and nothing downstream can be trusted. This is the statement proving it is whole.

## Balances: read the type code, not just the number

A balance isn't just an amount; it's an amount *of a type*, carried in a coded field. The ones that matter:

- **`OPBD`** — Opening **Booked** balance. Where the account stood at the start.
- **`CLBD`** — Closing **Booked** balance. Where it ended. This is the figure your ledger must match.
- **`PRCD`** — Previously Closed Booked. Yesterday's close; it should equal today's `OPBD`, a built-in continuity check.
- **`CLAV`** — Closing **Available** balance. What you can actually spend — booked minus holds, plus/minus value-dating. Often *different* from `CLBD`, and confusing the two is a classic error.

Booked and available are not the same thing. Money can be booked (on the statement) but not yet available (still value-dated forward), and treasury cares about the difference every single day.

## An entry, field by field

Here is a camt.053 fragment: two balances and one incoming credit — Bob's payment to Sweety, now landing as a booked entry.

```xml
<Stmt>
  <Id>HDFCINBB-STMT-20260701</Id>
  <Acct><Id><IBAN>INHDFC0SWEETY00033445</IBAN></Id></Acct>

  <Bal>
    <Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp>
    <Amt Ccy="INR">120000.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
  </Bal>
  <Bal>
    <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
    <Amt Ccy="INR">153000.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
  </Bal>

  <Ntry>
    <NtryRef>NTRY-20260701-0007</NtryRef>            <!-- the bank's handle for THIS line -->
    <Amt Ccy="INR">33000.00</Amt>
    <CdtDbtInd>CRDT</CdtDbtInd>
    <Sts><Cd>BOOK</Cd></Sts>                          <!-- booked, not pending -->
    <BookgDt><Dt>2026-07-01</Dt></BookgDt>            <!-- when it hit the books -->
    <ValDt><Dt>2026-07-01</Dt></ValDt>               <!-- when the funds are available -->
    <AcctSvcrRef>HDFC-8827361</AcctSvcrRef>          <!-- bank's own transaction ref -->
    <BkTxCd>
      <Domn><Cd>PMNT</Cd>                             <!-- payment... -->
        <Fmly><Cd>RCDT</Cd>                           <!-- ...received credit transfer... -->
          <SubFmlyCd>ESCT</SubFmlyCd></Fmly>          <!-- ...specifically this scheme -->
      </Domn>
    </BkTxCd>
    <NtryDtls><TxDtls>
      <Refs>
        <EndToEndId>BOB-INV0042</EndToEndId>          <!-- the thread back to the invoice -->
        <UETR>eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4</UETR>
      </Refs>
      <RltdPties><Dbtr><Nm>Bob Marsh</Nm></Dbtr></RltdPties>
      <RmtInf>
        <Strd><CdtrRefInf><Ref>RF18INV0042</Ref></CdtrRefInf></Strd>  <!-- structured! -->
      </RmtInf>
    </TxDtls></NtryDtls>
  </Ntry>
</Stmt>
```

Read the entry as a sentence: a **booked credit** of 33,000 INR hit the account on 1 July, the bank filed it under *received credit transfer*, and it carries three ways to identify what it pays — an `EndToEndId`, a `UETR`, and a **structured creditor reference**.

## The one field that decides your morning

Notice `RmtInf`. It appears in two shapes, and the shape is everything:

- **`Ustrd`** — unstructured, free text: *"payment for June invoice thx"*. A human can read it. A machine mostly can't, so the entry drops into an "unapplied cash" queue for someone to match by hand.
- **`Strd`** — structured, with a `CdtrRefInf/Ref` like `RF18INV0042` (an ISO 11649 creditor reference). The ERP reads it, finds the exact open invoice, marks it paid. No human involved.

This is the whole ballgame. A finance team's **auto-reconciliation rate** — the percentage of entries matched without a human — rises and falls almost entirely on whether the money arrived with a structured reference. That's why the [remittance chapter](#/library) calls this the field closest to ISO 20022's reason for existing.

## How the match actually happens

An ERP reconciling this statement runs, per entry, roughly:

1. **Prove the statement is whole.** OPBD (120,000) + entries (+33,000) = CLBD (153,000). ✓ Proceed.
2. **Find the invoice.** Try the structured `CdtrRefInf/Ref` first, then `EndToEndId`, then `UETR`, then amount + debtor name as a fuzzy fallback.
3. **Match and clear.** Reference `RF18INV0042` hits open invoice 0042 for the exact amount → mark paid, close the receivable.
4. **Or, no confident match → exception.** Wrong amount, missing reference, or a payment for two invoices at once lands in a review queue. Every entry here is human minutes.

The metric that matters is how few reach step 4. Everything about good statement data — structured remittance, preserved `EndToEndId`, correct `BkTxCd` — exists to keep that queue short.

## The batch trap: one entry, many payments

When Sweety's company runs [payroll](#/library), the bank may post the whole debit as **one** entry — a single 4,400,000 INR line — rather than 200 separate ones. That single `Ntry` then carries a **batch**: `NtryDtls` with an entry-level summary (`Btch` with `NbOfTxs` and total) and **many `TxDtls`**, one per employee. Reconciliation has to **explode** that entry into its components to match each salary to each staff record. A system that reconciles at entry level only will see one giant payment and mismatch all 200. Read to the transaction level, always — the same lesson the `PART` status taught in the [status-reports chapter](#/library), now on the reporting side.

## Why camt.053 beats the statement it replaced

MT940 carried reconciliation data in a cramped, semi-structured `:86:` field — narrow, truncated, every bank filling it differently. camt.053 gives every reference a **named home**: the creditor reference is in `CdtrRefInf`, the counterparty in `RltdPties`, the bank's code in `BkTxCd`. Same event, but now machine-readable by design instead of by lucky parsing. That is the corporate case for the whole migration in one message: not "more room," but *structure where the ERP needs it*.

## What breaks

- **CLBD ≠ ledger.** If the closing booked balance doesn't match your books, stop — don't reconcile a broken statement. Usually a missing entry or a value-date confusion.
- **Reading Ustrd as if it were Strd.** Free-text remittance can't be reliably parsed; forcing it produces wrong matches, which are worse than no match.
- **Ignoring the batch level.** One batch-booked entry is many payments; reconcile the `TxDtls`, not the headline line.
- **Confusing BookgDt and ValDt.** Booked ≠ available. Treasury forecasts off value date; reconciliation posts off booking date. They are not interchangeable.

## So, what can you now do?

You can open a camt.053 the way an ERP does: verify the balance chain (`OPBD` + entries = `CLBD`), read an entry's status, booking and value dates, bank transaction code, and references; match a booked credit to an open invoice via a **structured creditor reference** first and `EndToEndId`/`UETR` next; explode a **batch-booked** entry into its transactions; explain why structured remittance is the single biggest lever on an auto-reconciliation rate; and make the corporate case for ISO 20022 in one sentence — structure where the ERP needs it.

{{embed:explorer:CAMT.053|Open camt.053, the statement, in the Message Explorer}}
{{embed:article:601-remittance-information|The field that makes it all work: Remittance Information}}

{{check:First thing a reconciliation engine checks on a camt.053?|That opening balance + the sum of entries equals the closing balance — proof the statement is whole|The colour of the bank's logo|Whether the file is under 1 MB}}
{{check:Two entries are identical except one has Strd remittance and one has Ustrd. Which reconciles automatically?|The Strd one — a structured creditor reference the ERP can match to an invoice without a human|The Ustrd one|Neither can be reconciled automatically}}
{{check:A payroll debit posts as a single batch-booked entry. How do you reconcile it?|Explode it: read the many TxDtls inside the entry and match each to its employee record|Match the one headline entry to one employee|Reject the statement}}
