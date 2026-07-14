---
title: "Investigations: When a Payment Just Goes Quiet"
level: 400
category: Exceptions
summary: "Sometimes nothing is rejected, returned, or reversed. The payment simply vanishes or arrives wrong, and someone has to open a case. Investigations are the structured conversation that finds the money."
minutes: 8
updated: 2026-07-13
tags: [investigations, camt.026, camt.027, camt.028, camt.029, case-management, R-transactions]
related: [403-recall, 402-return, 305-message-lifecycle, 409-new-investigations]
earnedSkill: "Explain what an investigation is and when it's needed, name the case-management messages (camt.027, camt.026, camt.028, camt.029), describe how a case opens and closes, and tell an investigation from the clean exceptions."
num: 405
status: published
---

> **The problem first.** Bob's payment to Sweety left his account three days ago. It wasn't rejected — no red cross. It wasn't returned — no money came back. It just... never arrived. Somewhere among the intermediary banks it's sitting, mislabelled or stuck, and the trail shows it reached a correspondent and then went silent.

The last three chapters were tidy — each exception has a clear cause and one message that fixes it. This one is the messy reality, and it starts with a payment that didn't fail cleanly.

## How do you hunt a payment that just vanished?

{{think}}
The payment wasn't rejected, returned, or reversed. Nobody obviously did anything wrong, so none of the clean exceptions fired. It's simply *somewhere* — late, or stuck, or applied to the wrong account — and you don't yet know why.

Before you can act, you have to find out what happened. How do banks do that across a dozen institutions, without picking up the phone or trading emails?
{{reveal}}
You open a **case**. Structured case management for payments: open a case, ask a precise question, exchange the missing detail, close with a resolution — all machine-to-machine. ISO 20022 gives that conversation its own family of camt messages so it happens as data, not free-text email.

That's an **investigation**: not one message with one fix, but a conversation whose job is to answer *what actually happened* before anyone acts.
{{/think}}

> **Heads up: this model is being rebuilt.** The camt.026/027/028/029 conversation below is the *classic* investigation, and the right place to learn the mechanics. But the industry is replacing this fragmented set (and the free-text MT199 that quietly did most of the real work) with two new messages, **camt.110** and **camt.111**, on a 2026/2027 clock. Learn the classic model here; the {{link:article:409-new-investigations|next chapter}} covers what's replacing it and why.

## When you need one, and the messages that carry it

You open an investigation when a payment is wrong or missing but *none of the clean exceptions apply*: the money never arrived (beneficiary claims non-receipt); it arrived but can't be applied (the account reference is ambiguous, so funds sit unposted); it arrived short or without the info needed to reconcile it; or a previous request needs more detail. The **camt** case-management messages carry it: **camt.027 (Claim Non Receipt)** — *"our customer says the money never arrived, where is it?"*; **camt.026 (Unable To Apply)** — *"we got the money but can't post it, help us apply it"*; **camt.028 (Additional Payment Information)** — either side supplying the missing detail; and **camt.029 (Resolution of Investigation)** — the message that *closes the case* (the same camt.029 that answers a recall — the universal "here's how it ended").

The flow: Bob's bank opens a case with a **camt.027** three days on, referencing `BOB-INV0042` and the `UETR`; a correspondent finds the pacs.008 sitting unposted and raises a **camt.026** asking for clarification; Bob's bank answers with a **camt.028** confirming Sweety's correct account; the correspondent applies the funds and sends a **camt.029**: resolved, credited, case closed. (If the money genuinely can't be delivered, the camt.029 might instead resolve the case by triggering a **pacs.004 return** — the investigation hands off to the clean exception that fits.) The thread through all of it is the same `UETR` from the original pacs.008 — the globally-unique id that makes "where is my payment?" answerable across a dozen banks, quoted on every message so the whole case stays pinned to one payment.

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

{{think}}
Reject, return, recall, reversal each answer one question: *what's the right action?* An investigation is different in kind. What prior question does it answer — and how does it usually *end*?
{{reveal}}
It answers *what actually happened?* — the question you must settle *before* you can pick an action. So it's a **conversation**, not a single message, and it often *ends* by triggering one of the clean exceptions: a camt.029 that authorises a pacs.004 return, say.

Think of investigations as the layer sitting *above* reject/return/recall/reversal — the tool you reach for whenever the situation is too unclear to act on directly.
{{/think}}

That completes the exceptions map. Every payment that doesn't sail through cleanly lands as one of these: **reject** (refused before settlement, `pacs.002`/`pain.002` `RJCT`); **return** (settled but undeliverable, sent back by the receiver, `pacs.004`); **recall** (settled, the sender asks, `camt.056` → `camt.029`); **reversal** (settled, the originator undoes its own collection by right, `pacs.007`); **investigation** (unclear or missing — open a case, find out, then act, `camt.026/027/028` → `camt.029`).

{{aside:model|The mental model}}
**An investigation answers "what happened?", not "what's the right action?"** It's case management — open a case, ask, exchange detail, resolve — and it sits *above* the clean exceptions, often ending by triggering one of them. Not a single message: a conversation pinned to one payment.
{{/aside}}

{{aside:chair|From the engineer's chair}}
The `UETR` is what makes a case tractable — every message quotes it, so a payment a dozen banks touched stays one thread. camt.026/camt.027 *open*, camt.028 carries *detail*, camt.029 *closes* (and can hand off to a pacs.004). Build your case store keyed on UETR, and treat camt.029 as terminal. Note the whole set is being superseded by camt.110/111 — the next chapter.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Trying to act before you know.** Reaching for a return or recall on a payment you haven't located yet — investigate first, then act.
- **Losing the `UETR` thread.** Without it, a case can't be pinned to one payment across banks, and it fragments into disconnected messages.
- **Treating an investigation as one message.** It's a conversation with an open, a middle, and a close; modelling it as a single request/response misses the exchange.
{{/aside}}

{{aside:map|The map}}
The layer above the clean exceptions:

- Where a resolved case often hands off → {{link:article:402-return|return}} / {{link:article:403-recall|recall}}.
- What's replacing this whole model → {{link:article:409-new-investigations|the new investigations model}}.
- The journey a lost payment took → {{link:article:305-message-lifecycle|the message lifecycle}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Investigation** = case management for a payment that's wrong/missing but fits no clean exception.
- **Open:** `camt.027` (claim non-receipt) / `camt.026` (unable to apply). **Detail:** `camt.028`. **Close:** `camt.029`.
- **Pinned by the `UETR`** — every message quotes it.
- **Answers "what happened?"** then hands off to a clean exception (e.g. a pacs.004).
- **Being replaced** by `camt.110` / `camt.111` on a 2026/2027 clock.
{{/aside}}

{{embed:playground|Trace a payment end-to-end in the Playground}}
{{embed:article:409-new-investigations|What's replacing all of this: camt.110, camt.111 and Case Management}}

## So what can you do now?

You can explain what an investigation is and when it's the right tool, name the case-management messages (`camt.027`, `camt.026`, `camt.028`, `camt.029`), describe how a case opens with a question and closes with a resolution, follow the `UETR` that keeps the case pinned to one payment, and explain how an investigation can hand off to a return or recall once the facts are known.

{{check:A payment seems lost mid-chain. What makes it findable?|Its unique end-to-end tracking reference, quoted in the investigation|Guessing which bank might hold it|Waiting for the monthly statement}}

{{check:What is the goal of an investigation exchange?|Asking a precise, structured question about one payment instead of trading free-text emails|Penalising the bank that caused the delay|Automatically re-sending the payment}}
