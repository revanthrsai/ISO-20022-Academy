---
title: "The New Investigations: camt.110, camt.111 and the End of the Free-Text Case"
level: 400
category: Exceptions
num: 409
summary: "The investigation you just learned is being rebuilt. Two new messages — camt.110 and camt.111 — replace a drawer full of narrow camt types and the free-text MT199 that quietly did the real work. Here's the new model, and the 2026/2027 dates that make it not optional."
minutes: 7
updated: 2026-07-13
tags: [investigations, camt.110, camt.111, case management, exceptions, R-transactions, mt199]
related: [405-investigations, 309-the-four-identifiers, 208-the-end-of-mt, 407-the-r-transactions-map]
earnedSkill: "Explain why ISO 20022 is rebuilding investigations, name the two new messages (camt.110, camt.111), describe how one generic typed request/response replaces the camt.026/027/028/029 set and the free-text MT199, place the November 2026 and 2027 milestones, and say what Swift Case Management adds."
status: published
---

> **The problem first.** You just learned the classic investigation: a camt.027 to claim non-receipt, a camt.026 for unable-to-apply, a camt.028 to add detail, a camt.029 to close. Tidy on paper. But walk onto a real payments-operations floor and you'll find something else doing most of the work: a free-format **MT199**, a human typing *"where is our payment ref BOB-INV0042, sent 1 July, please advise"* into a text box.

Structured messages existed. The industry still reached for the text box. That fact is the whole chapter — and if you can work out *why*, you've already worked out what's replacing it.

## Why did people abandon the structured messages?

{{think}}
The classic model gives you tidy, structured camt messages for investigations. Yet real ops floors ran on a free-text MT199 that no machine can read. Two things about the old design pushed people to the text box. What were they — and what single redesign fixes both?
{{reveal}}
Two problems:

1. **Fragmentation.** There was no one "ask a question" message — there was a *drawer* of narrow ones (camt.026, .027, .028, .029, and a long tail). To use them you had to know in advance exactly which kind of problem you had and pick the matching message. When the situation didn't fit a slot, people gave up and typed.
2. **The real workhorse was unstructured.** The free-text MT199 (and cousins) can't be read by a machine — so investigations stayed manual, slow, unsearchable, and invisible to tracking.

The fix is one move ISO 20022 makes everywhere: collapse the drawer into **one generic request and one generic response**, and push the specificity out of the *message type* into a **structured reason code inside**. That's **camt.110** (Investigation Request) and **camt.111** (Investigation Response).
{{/think}}

## The new idea: two messages, a type code, a case

Instead of *"which of a dozen messages do I need?"* the question becomes *"camt.110, with which reason code?"* A camt.110 asking *"where is this?"* and a camt.110 asking *"I can't apply this, help"* are the **same message** with different codes — so a machine can route, search, and age both without a human reading a sentence. Keep the envelope stable; put the meaning in structured fields.

| Classic model | New model |
|---|---|
| camt.027 Claim Non-Receipt | camt.110 with a non-receipt reason |
| camt.026 Unable To Apply | camt.110 with an unable-to-apply reason |
| camt.028 Additional Payment Information | camt.110 / camt.111 carrying the extra detail |
| camt.029 Resolution (for investigations) | camt.111 Investigation Response |
| Free-text MT199 / MT299 | camt.110 / camt.111 (structured) |

The `UETR` still does exactly what it did — the thread pinning every message in a case to one payment. What changes is that the conversation around it is now structured end to end, so *"where is my payment?"* becomes a query a system can answer, not an email a person writes.

> **Keep two tracks apart:** **cancellations** are separate. A recall still travels as **camt.056** answered by **camt.029** (the recall and camt.056 chapters). Investigations (*find out what happened*) and cancellations (*ask for money back*) are being modernised in parallel, not merged.

## What Case Management adds

The messages are only half of it. Swift wraps camt.110/111 in a service called **Case Management**: a shared place where a case is opened, routed to the right party on the payment's UETR, tracked, and aged — with APIs and a GUI so both large automated banks and smaller manual ones can take part. The message is the *what*; Case Management is *where the case lives*. That's why the industry says "case management 2.0," not just "new camt messages."

{{flow:One case, structured end to end|Beneficiary bank ~ opens the case|-> camt.110|Case Management ~ routes it down the chain on the payment's UETR|-> investigate|Correspondent ~ finds the stuck payment, answers|-> camt.111|Resolution ~ status and outcome, case closed and searchable}}

## Predict the migration shape

{{think}}
This is a migration with a schedule. You already know the MT-to-MX pattern from the end-of-MT chapter. Predict the shape here — and, more usefully, where the operational surprises will cluster.
{{reveal}}
Same coexistence pattern, exactly:

- **Nov 2024** — camt.110/111 available **opt-in**. Early adopters start.
- **Nov 2026** — **mandatory to be able to receive** a camt.110 through Case Management. To cushion the long tail, the request can arrive **with an embedded MT199**, and **in-flow translation** lets institutions not yet on Case Management still process it through legacy FIN. Nobody's cut off overnight.
- **Nov 2027** — in-flow translation **ends**. Investigations are **ISO-only** (camt.110/111) through Case Management, and the legacy set (MT199/299, 195/295, 196/296, 198/298, 995/996) is **retired** for this purpose.

A three-year runway, an embedded-legacy bridge in the middle, a hard cutover at the end. And the surprises: "the investigation is modernised" is only half-true through the whole in-between window — which is precisely where the incidents will live, just as they did in the MT-to-MX coexistence.
{{/think}}

{{aside:model|The mental model}}
**Keep the envelope stable, put the meaning in a structured field.** One `camt.110` request + one `camt.111` response, with a *reason code* replacing a drawer of narrow message types and the unreadable free-text MT199. The `UETR` still pins the case; now the whole conversation is machine-readable.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Map by *intent*, not old message name — `camt.110` is a generic request whose meaning is its reason code, not a rename of `camt.027`. And the messages aren't enough on their own: the 2026 obligation is specifically to be *reachable* through Case Management (a letterbox, not just a letter). Keep the recall track separate — that's still `camt.056` → `camt.029`, not camt.110/111.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Treating camt.110 as "the new camt.027."** It's a *generic* request; map by the reason code, not one-to-one from old names.
- **Assuming the messages are enough.** Sending a camt.110 without being reachable through Case Management is posting a letter to a house with no letterbox.
- **Confusing investigations with cancellations.** camt.110/111 *find out what happened*; a recall (camt.056 → camt.029) *asks for money back*. Different track.
{{/aside}}

{{aside:map|The map}}
The forward half of the investigations story:

- The classic model this replaces → {{link:article:405-investigations|investigations}}.
- The same coexistence pattern, one migration earlier → {{link:article:208-the-end-of-mt|the end of MT}}.
- The thread that still pins every case → {{link:article:309-the-four-identifiers|the four identifiers}}.
{{/aside}}

{{aside:ref|Reference card}}
- **camt.110** = generic Investigation Request; **camt.111** = generic Investigation Response.
- **The move:** one message + a structured reason code replaces the fragmented camt.026/027/028/029 and free-text MT199.
- **Case Management** is where the case lives — opened, routed on `UETR`, tracked, aged.
- **Dates:** Nov 2024 opt-in → Nov 2026 mandatory-to-receive (embedded MT199 + in-flow translation bridge) → Nov 2027 ISO-only, legacy retired.
- **Cancellations stay separate:** recall is still `camt.056` → `camt.029`.
{{/aside}}

{{embed:article:405-investigations|The classic model this replaces: Investigations}}
{{embed:article:208-the-end-of-mt|The same coexistence pattern, one migration earlier: the end of MT}}

{{check:In the new model, how does one camt.110 cover many different investigation situations?|The kind of investigation is carried as a structured reason code inside the message, not as a different message type|It doesn't — you still pick a different message per situation|It attaches a free-text note the receiver reads}}
{{check:What is mandatory from November 2026?|Being able to receive a camt.110 investigation request through Swift Case Management, with an embedded MT199 and in-flow translation as a bridge|Sending every payment as a camt.110|Retiring pacs.008}}
{{check:A bank needs to recall a payment sent in error. Which track is that?|Cancellation — still camt.056 answered by camt.029, not the camt.110/111 investigations track|camt.110 with a recall reason code|An MT199 free-text message}}
