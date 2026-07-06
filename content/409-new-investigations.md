---
title: "The New Investigations: camt.110, camt.111 and the End of the Free-Text Case"
level: 400
category: Exceptions
num: 409
summary: "The investigation you just learned is being rebuilt. Two new messages — camt.110 and camt.111 — replace a drawer full of narrow camt types and the free-text MT199 that quietly did the real work. Here's the new model, and the 2026/2027 dates that make it not optional."
minutes: 7
updated: 2026-07-06
tags: [investigations, camt.110, camt.111, case management, exceptions, R-transactions, mt199]
related: [405-investigations, 309-the-four-identifiers, 208-the-end-of-mt, 407-the-r-transactions-map]
earnedSkill: "Explain why ISO 20022 is rebuilding exceptions-and-investigations, name the two new messages (camt.110 investigation request, camt.111 investigation response), describe how one generic typed request/response replaces the camt.026/027/028/029 set and the free-text MT199/299, place the November 2026 and November 2027 milestones, and say what Swift Case Management adds on top of the messages."
status: published
---

> **The problem first.** You just learned the classic investigation: a camt.027 to claim non-receipt, a camt.026 for unable-to-apply, a camt.028 to add detail, a camt.029 to close. Tidy on paper. But walk onto a real payments-operations floor and you'll find something else doing most of the work: a free-format **MT199**, a human typing *"where is our payment ref BOB-INV0042, sent 1 July, please advise"* into a text box, and another human reading it at the far end. Structured messages existed; the industry still reached for the text box. Why — and what is finally replacing it?

The classic model you met in the last chapter is not wrong. It is being **superseded**. This chapter is the forward half of the same story: the investigation layer of ISO 20022 is being rebuilt around two messages and a piece of shared infrastructure, on a clock with real deadlines. If the last chapter taught you how investigations work *today*, this one teaches you how they work *next* — and "next" is already in flight.

## Why the old model strained

The legacy exceptions-and-investigations set had two problems that pushed people back to free text.

First, it was **fragmented**. There wasn't one "ask a question" message; there was a drawer full of narrow ones — camt.026, camt.027, camt.028, camt.029, and a long tail beyond them — each for a specific situation. To use them well you had to know in advance exactly which kind of problem you had and pick the matching message. When the situation didn't fit a slot, people gave up and opened an MT199.

Second, the real workhorse — that **free-text MT199** (and its cousins MT299, MT195/295, MT196/296) — was **unstructured by design**. A machine can't read "please advise where this is." So investigations stayed manual: slow, unsearchable, impossible to automate, and invisible to any tracking system. The one place payments still ran on prose.

## The new idea: two messages, a type code, and a case

The redesign collapses the drawer into **one generic request and one generic response**, and moves the specificity out of the *message type* and into a **structured field inside it**:

- **camt.110 — Investigation Request.** One message to open or push any investigation. What *kind* of investigation it is (claim non-receipt, unable to apply, request for more information, and so on) is carried as a coded reason inside the message, not as a different message name.
- **camt.111 — Investigation Response.** One message to answer: status, findings, resolution.

That single change is the whole point. Instead of *"which of a dozen messages do I need?"* the question becomes *"camt.110, with which reason code?"* — the same move ISO 20022 makes everywhere: keep the envelope stable, put the meaning in structured, machine-readable fields. A camt.110 asking *"where is this?"* and a camt.110 asking *"I can't apply this, help"* are the same message with different codes, and a machine can route, search, and age both without a human reading a sentence.

> ISO has registered a broader investigations set as this area evolves; the two messages that carry the actual request-and-answer conversation through Swift's Case Management are **camt.110** and **camt.111**. Note also that **cancellations** are a separate track: a recall still travels as **camt.056** answered by **camt.029** (see the recall and camt.056 chapters). Investigations and cancellations are being modernised in parallel, not merged.

## What it maps to from the last chapter

| Classic model | New model |
|---|---|
| camt.027 Claim Non-Receipt | camt.110 with a non-receipt reason |
| camt.026 Unable To Apply | camt.110 with an unable-to-apply reason |
| camt.028 Additional Payment Information | camt.110 / camt.111 carrying the extra detail |
| camt.029 Resolution (for investigations) | camt.111 Investigation Response |
| Free-text MT199 / MT299 | camt.110 / camt.111 (structured) |

The `UETR` still does what it did in the last chapter: it is the thread that pins every message in a case to one payment. That doesn't change. What changes is that the conversation around it is now structured end to end, so *"where is my payment?"* is a query a system can answer, not an email a person has to write.

## What Case Management adds on top

The messages are only half of it. Swift wraps camt.110/111 in a service called **Case Management** (its orchestration engine is sometimes called Case Orchestrator): a shared place where a case is opened, routed to the right party in the chain, tracked, and aged — with APIs and a GUI so both large automated banks and smaller manual ones can take part. The message is the *what*; Case Management is the *where the case lives*. This is why the industry talks about "case management 2.0" rather than just "new camt messages."

{{flow:One case, structured end to end|Beneficiary bank ~ opens the case|-> camt.110|Case Management ~ routes it down the chain on the payment's UETR|-> investigate|Correspondent ~ finds the stuck payment, answers|-> camt.111|Resolution ~ status and outcome, case closed and searchable}}

## The dates that make it not optional

This is a migration with a schedule, and it is the part an interviewer or an auditor will ask about:

- **November 2024** — camt.110/111 available on an **opt-in** basis. Early adopters start.
- **November 2026** — it becomes **mandatory to be able to receive** a camt.110 investigation request through Case Management. To cushion the long tail, the request can arrive **with an embedded MT199**, and **in-flow translation** lets institutions not yet on Case Management still process the investigation through their legacy FIN channel. Nobody is cut off overnight.
- **November 2027** — in-flow translation **ends**. The whole community sends and receives investigations in **ISO 20022 only** (camt.110/111) through Case Management, and the legacy exceptions-and-investigations formats — the free-text MT199/299, MT195/295, MT196/296, MT198/298, MT995/996 — are **retired** for this purpose.

Notice the shape: it is the exact same coexistence pattern as the MT-to-MX migration you read about. A three-year runway, an embedded-legacy bridge in the middle, and a hard cutover at the end. "The investigation is modernised" will be only half-true for the whole window in between — which is precisely where the operational surprises will live.

## What breaks (and what to keep straight)

- **Treating camt.110 as "just the new camt.027."** It isn't a one-to-one rename. It's a *generic* request whose meaning lives in a reason code. Map by intent, not by old message name.
- **Assuming the messages are enough.** Sending a camt.110 without being reachable through Case Management is like posting a letter to a house with no letterbox. The 2026 obligation is specifically about being able to **receive** through the service.
- **Confusing investigations with cancellations.** A recall is still camt.056 → camt.029. camt.110/111 are for *finding out what happened*, not for *asking for money back*. Different track, different messages.

## So, what can you now do?

You can explain why the industry is rebuilding exceptions-and-investigations (a fragmented message set plus a free-text MT199 that machines couldn't read); name the two new messages (**camt.110** investigation request, **camt.111** investigation response) and the reason-code idea that lets one message do many jobs; map the classic camt.026/027/028/029 conversation onto the new pair; say what Swift Case Management adds on top of the raw messages; and place the **November 2026** (mandatory receive, with embedded MT199 and in-flow translation) and **November 2027** (ISO-only, legacy retired) milestones on the same coexistence pattern as the MT-to-MX migration.

{{embed:article:405-investigations|The classic model this replaces: Investigations}}
{{embed:article:208-the-end-of-mt|The same coexistence pattern, one migration earlier: the end of MT}}

{{check:In the new model, how does one camt.110 cover many different investigation situations?|The kind of investigation is carried as a structured reason code inside the message, not as a different message type|It doesn't — you still pick a different message per situation|It attaches a free-text note the receiver reads}}
{{check:What is mandatory from November 2026?|Being able to receive a camt.110 investigation request through Swift Case Management, with an embedded MT199 and in-flow translation as a bridge|Sending every payment as a camt.110|Retiring pacs.008}}
{{check:A bank needs to recall a payment sent in error. Which track is that?|Cancellation — still camt.056 answered by camt.029, not the camt.110/111 investigations track|camt.110 with a recall reason code|An MT199 free-text message}}
