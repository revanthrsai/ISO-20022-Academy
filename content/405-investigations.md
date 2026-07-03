---
title: "Investigations: When a Payment Just Goes Quiet"
level: 400
category: Exceptions
summary: "Sometimes nothing is rejected, returned, or reversed. The payment simply vanishes or arrives wrong, and someone has to open a case. Investigations are the structured conversation that finds the money."
minutes: 8
updated: 2026-06-29
tags: [investigations, camt.026, camt.027, camt.028, camt.029, case-management, R-transactions]
related: [405-investigations, 403-recall, 402-return, 305-message-lifecycle]
earnedSkill: "Explain what an investigation is and when it's needed, name the case-management messages (camt.027 claim non-receipt, camt.026 unable to apply, camt.028 additional info, camt.029 resolution), describe how a case opens and closes, and tell an investigation apart from the clean exceptions."
num: 405
status: published
---

> **The problem first.** Bob's payment to Sweety left his account three days ago. It wasn't rejected; no red cross. It wasn't returned; no money came back. It just... never arrived. Somewhere among the intermediary banks the payment is sitting, mislabelled or stuck, and the tracking trail shows it reached a correspondent and then went silent. Nobody did anything obviously wrong, so none of the clean exceptions fired. How do banks *hunt down* a payment that simply disappeared, without phoning each other up?

The last three chapters were tidy. A reject, a return, a reversal each has a clear cause and a single message that puts it right. **Investigations** are the messy reality: a payment that didn't fail cleanly. It's late, lost, applied to the wrong account, missing its remittance information, or stuck at a correspondent, and finding out *why* takes a back-and-forth conversation between banks.

An investigation is **case management for payments**: open a case, ask a question, get an answer, close the case. ISO 20022 gives that conversation its own family of messages so it can happen machine-to-machine instead of over email.

## When you need an investigation

You open an investigation when a payment is wrong or missing but **none of the clean exceptions apply**, when there's nothing to simply reject, return, or reverse, because first you have to find out what happened:

- **The money never arrived** (the beneficiary claims non-receipt).
- **It arrived but can't be applied.** The account reference is wrong or ambiguous, so the receiving bank is holding funds it can't post.
- **It arrived short, or without the information** needed to reconcile it (missing invoice reference).
- **A previous request needs more detail** before anyone can act.

## Which messages carry an investigation

These are the **camt** case-management messages, the exceptions-and-investigations corner of the camt family:

- **camt.027, Claim Non Receipt.** The beneficiary's bank: *"Our customer says the money never arrived. Where is it?"*
- **camt.026, Unable To Apply.** The receiving bank: *"We got the money but can't post it; the account reference doesn't match anyone. Help us apply it."*
- **camt.028, Additional Payment Information.** Either side supplying the missing detail the other asked for.
- **camt.029, Resolution of Investigation.** The message that **closes the case**: *resolved this way, here's the outcome.* (The same camt.029 you met answering a recall: it's the universal "here's how it ended" message.)

A case opens with a question (camt.026 or camt.027), exchanges detail (camt.028), and closes with a resolution (camt.029).

## The resolution flow

1. **Bob's bank opens a case.** Three days on with no credit, it sends a **camt.027 Claim Non Receipt** referencing `BOB-INV0042` and the `UETR`, addressed down the chain.
2. **The correspondent investigates.** It finds the pacs.008 sitting unposted (the creditor account reference was ambiguous), so it raises a **camt.026 Unable To Apply** asking for clarification.
3. **Bob's bank answers with a camt.028 Additional Payment Information**, confirming Sweety's correct account.
4. **The correspondent applies the funds** and sends a **camt.029 Resolution of Investigation**: resolved, credited, case closed.
5. **If the money genuinely can't be delivered**, the camt.029 might instead resolve the case by triggering a **pacs.004 return**; the investigation hands off to the clean exception that fits.

The thread through all of it is the same `UETR` (`eb6305c9-…`) from the original pacs.008. That single globally-unique id is what makes "where is my payment?" answerable across a dozen banks. Every investigation message quotes it, so the whole case stays pinned to one payment.

```xml
<RsltnOfInvstgtn>
  <Assgnmt>
    <Id>EBILAEAD-INV-0042</Id>
    <CreDtTm>2026-07-02T10:00:00+04:00</CreDtTm>
  </Assgnmt>
  <Sts><Conf>CNCL</Conf></Sts>
  <CxlDtls>
    <TxInfAndSts>
      <OrgnlEndToEndId>BOB-INV0042</OrgnlEndToEndId>
      <OrgnlUETR>eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4</OrgnlUETR>
      <CxlStsRsnInf>
        <AddtlInf>Funds applied to corrected account, case closed</AddtlInf>
      </CxlStsRsnInf>
    </TxInfAndSts>
  </CxlDtls>
</RsltnOfInvstgtn>
```

## How investigations differ from the clean exceptions

The other four exceptions answer *"what's the right action?"* An investigation answers the prior question: *"what actually happened?"* It's a **conversation**, not a single message, and it often **ends** by triggering one of the clean exceptions (a camt.029 that authorises a pacs.004 return, say). Think of investigations as the layer that sits above reject/return/recall/reversal, used whenever the situation is too unclear to act on directly.

{{embed:playground|Trace a payment end-to-end in the Playground}}

## Where Level 400 leaves you

You now have the full exceptions map. Every payment that doesn't sail through cleanly ends up as one of these:

- **Reject**: refused before settlement (`pacs.002` / `pain.002`, status `RJCT`).
- **Return**: settled but undeliverable, sent back by the receiver (`pacs.004`).
- **Recall** — settled, the sender asks for it back (`camt.056` → `camt.029`).
- **Reversal** — settled, the originator undoes its own collection by right (`pacs.007`).
- **Investigation** — unclear or missing; open a case, find out, then act (`camt.026/027/028` → `camt.029`).

## So, what can you now do?

You can explain what an investigation is and when it's the right tool (a payment that's wrong or missing but doesn't fit a clean exception), name the case-management messages (`camt.027` claim non-receipt, `camt.026` unable to apply, `camt.028` additional info, `camt.029` resolution), describe how a case opens with a question and closes with a resolution, follow the `UETR` that keeps the whole case pinned to one payment, and explain how an investigation can hand off to a return or recall once the facts are known.

{{check:A payment seems lost mid-chain. What makes it findable?|Its unique end-to-end tracking reference, quoted in the investigation|Guessing which bank might hold it|Waiting for the monthly statement}}

{{check:What is the goal of an investigation exchange?|Asking a precise, structured question about one payment instead of trading free-text emails|Penalising the bank that caused the delay|Automatically re-sending the payment}}
