---
title: "camt.053 Up Close: Reconciliation, Line by Line"
level: 300
category: Message Deep Dives
num: 311
summary: "The end-of-day statement is where ISO 20022 earns its keep for corporates. Open a camt.053 the way an ERP does: balances that must tie out, entries that carry their own references, and the one field that decides whether reconciliation is automatic or a human typing all afternoon."
minutes: 9
updated: 2026-07-13
tags: [camt.053, reconciliation, statement, balances, NtryRef, structured remittance, ERP]
related: [303-camt-family, 601-remittance-information, 309-the-four-identifiers, 502-payroll, 310-status-reports]
earnedSkill: "Read a camt.053 as an ERP does: check the balance chain, read status and dates, match a credit to a receivable via structured reference or EndToEndId, explode a batch-booked entry, and explain what moves an auto-reconciliation rate."
status: published
---

> **The problem first.** It's 6am. Overnight, Sweety's company received 43 payments and made 88. Nobody's eyeballing 131 lines. Her accounting system opens one file, and by the time she has coffee it should have matched every incoming payment to an open invoice, flagged the three it couldn't, and confirmed the closing balance — untouched by human hands.

The camt-family chapter told you *what* a camt.053 is: the authoritative end-of-day statement. This one is about *using* it, because "statement" undersells it. It's the input to reconciliation, and the best argument for ISO 20022 that exists. Let's read it the way the machine does — starting from what the machine actually needs.

## What has to be in the file for the morning to be quiet?

{{think}}
The ERP has one job before Sweety's coffee: match every incoming credit to an open invoice automatically, and prove the statement is trustworthy. It never asks a human anything unless it's stuck.

For that to work, what does the file have to carry — and what one thing, if it's missing, drops an entry into a human's queue?
{{reveal}}
Three things, and one that decides everything:

- **Balances that tie out.** An opening figure and a closing figure, so the statement can prove it's whole: opening + all entries = closing.
- **Entries that describe themselves.** Each with a status, dates, a transaction code, and references.
- **A machine-readable reference on each entry** — the reason the ERP can find the exact invoice.

And the one thing that decides auto-vs-manual: whether the money arrived with a **structured** remittance reference or just free text. That single choice is most of the auto-reconciliation rate.
{{/think}}

## The two things a statement must do

Every camt.053 answers two questions, with a part for each: **"what was the balance?"** — the `Bal` blocks (at least an opening and a closing) — and **"what moved?"** — the `Ntry` blocks (one booked entry per movement). And they must agree: **opening balance + the sum of entries = closing balance.** That equation is the first thing a reconciliation engine checks; if it doesn't hold, the statement is incomplete or corrupt and nothing downstream can be trusted. It's the statement proving it's whole.

## Balances: read the type code, not just the number

A balance is an amount *of a type*, carried in a coded field: **`OPBD`** opening booked (where it started), **`CLBD`** closing booked (where it ended — the figure your ledger must match), **`PRCD`** previously closed (yesterday's close, should equal today's `OPBD` — a continuity check), and **`CLAV`** closing available (what you can actually spend — booked minus holds and value-dating). Booked and available are not the same thing; money can be booked but not yet available, and treasury cares about the gap every day.

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

Read the entry as a sentence: a **booked credit** of 33,000 INR hit the account on 1 July, filed under *received credit transfer*, carrying three ways to identify what it pays — an `EndToEndId`, a `UETR`, and a **structured creditor reference**.

## The one field that decides your morning

`RmtInf` appears in two shapes, and the shape is everything. **`Ustrd`** is unstructured free text — *"payment for June invoice thx"* — which a human can read and a machine mostly can't, so the entry drops into an "unapplied cash" queue. **`Strd`** is structured, with a `CdtrRefInf/Ref` like `RF18INV0042` (an ISO 11649 creditor reference) the ERP reads, matches to the exact open invoice, and clears — no human. A finance team's auto-reconciliation rate rises and falls almost entirely on which shape the money arrived in.

## The batch trap

{{think}}
Sweety's company runs payroll: 200 salaries. The bank posts the whole debit as **one** entry — a single 4,400,000 INR line — not 200. A reconciliation system that matches at entry level sees one giant payment.

What does it need to do instead, and what happens if it doesn't?
{{reveal}}
It has to **explode** the entry. A batch-booked `Ntry` carries a summary (`Btch` with `NbOfTxs` and total) and **many `TxDtls`**, one per employee. The system must read down to the `TxDtls` and match each salary to each staff record. Reconcile at the headline-entry level only and you mismatch all 200 — one payment where there are two hundred. Always read to the transaction level, the same lesson the `PART` status taught on the messaging side.
{{/think}}

## How the match actually happens

Per entry, an ERP runs roughly: **(1)** prove the statement is whole — OPBD (120,000) + entries (+33,000) = CLBD (153,000) ✓; **(2)** find the invoice — try the structured `CdtrRefInf/Ref` first, then `EndToEndId`, then `UETR`, then amount + debtor name as a fuzzy fallback; **(3)** match and clear — `RF18INV0042` hits open invoice 0042 for the exact amount → mark paid; **(4)** or, no confident match → exception queue, where every entry is human minutes. The whole game is keeping step 4 short.

And that's the corporate case for the migration in one message: MT940 crammed reconciliation data into a narrow, semi-structured `:86:` field that every bank filled differently; camt.053 gives every reference a named home (`CdtrRefInf`, `RltdPties`, `BkTxCd`). Not "more room" — *structure where the ERP needs it.*

{{aside:model|The mental model}}
**A camt.053 proves it's whole, then hands each entry a way to match itself.** Whole: `OPBD` + entries = `CLBD` — check it first, always. Match: the biggest lever on your auto-reconciliation rate is one field — structured (`Strd`) remittance versus free-text (`Ustrd`).
{{/aside}}

{{aside:chair|From the engineer's chair}}
The match order that keeps the exception queue short: structured `CdtrRefInf/Ref` → `EndToEndId` → `UETR` → amount+name fuzzy. And keep two date fields apart: `BookgDt` (when it hit the books — reconciliation posts off this) and `ValDt` (when funds are available — treasury forecasts off this). `BkTxCd` (domain/family/sub-family) tells you *what kind* of movement each entry is before you even read the references.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **CLBD ≠ ledger.** Don't reconcile a broken statement — usually a missing entry or a value-date confusion.
- **Reading `Ustrd` as if it were `Strd`.** Free text can't be reliably parsed; forcing it produces wrong matches, worse than none.
- **Ignoring the batch level.** One batch-booked entry is many payments — reconcile the `TxDtls`, not the headline line.
- **Confusing `BookgDt` and `ValDt`.** Booked ≠ available; they're not interchangeable.
{{/aside}}

{{aside:map|The map}}
The statement in the wider picture:

- What the whole family reports → {{link:article:303-camt-family|the camt family}}.
- The field that makes matching automatic → {{link:article:601-remittance-information|remittance information}}.
- The references it matches on → {{link:article:309-the-four-identifiers|the four identifiers}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Prove it's whole first:** `OPBD` + sum of entries = `CLBD`, or stop.
- **Balances are typed:** OPBD/CLBD (booked) vs CLAV (available); PRCD = continuity check.
- **Match order:** structured `CdtrRefInf/Ref` → `EndToEndId` → `UETR` → fuzzy amount+name.
- **`Strd` vs `Ustrd`** is the single biggest lever on the auto-reconciliation rate.
- **Batch entries** carry many `TxDtls` — explode them; and `BookgDt` ≠ `ValDt`.
{{/aside}}

{{embed:explorer:CAMT.053|Open camt.053, the statement, in the Message Explorer}}
{{embed:article:601-remittance-information|The field that makes it all work: Remittance Information}}

{{check:First thing a reconciliation engine checks on a camt.053?|That opening balance + the sum of entries equals the closing balance — proof the statement is whole|The colour of the bank's logo|Whether the file is under 1 MB}}
{{check:Two entries are identical except one has Strd remittance and one has Ustrd. Which reconciles automatically?|The Strd one — a structured creditor reference the ERP can match to an invoice without a human|The Ustrd one|Neither can be reconciled automatically}}
{{check:A payroll debit posts as a single batch-booked entry. How do you reconcile it?|Explode it: read the many TxDtls inside the entry and match each to its employee record|Match the one headline entry to one employee|Reject the statement}}
