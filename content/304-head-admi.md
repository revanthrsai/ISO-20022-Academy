---
title: "head & admi: The Envelope and the Housekeeping"
level: 300
category: Message Deep Dives
summary: "Before a bank reads what a message says, it reads who sent it and who it's for. The head family is the envelope around every message; the admi family is the network's quiet housekeeping that keeps the post office running."
minutes: 7
updated: 2026-06-29
tags: [head, admi, head.001, BAH, business-application-header, admi.004, housekeeping]
related: [304-head-admi, 305-message-lifecycle, 302-pacs-family, 201-business-application-header]
earnedSkill: "Explain what the Business Application Header (head.001) does and why it sits outside the message, tell the head family from the admi family, and recognise an admi message as network housekeeping rather than a payment."
num: 304
status: published
---

> **The problem first.** Bob's bank wants to send Sweety's payment onward, but the network it's handing to is enormous — thousands of banks, millions of instructions a day. The payment itself says *who pays whom*, but it doesn't say *which institution is sending this envelope, to which institution, right now, and whether it's a copy or the real thing*. A mail room can't sort a letter with no address on the outside. So where does that routing information live — and what keeps the whole postal network itself running?

Two small but essential families answer that: **head** — the *header* that wraps every business message — and **admi** — short for **administration**, the network's own housekeeping. Neither moves money. Both are what let the messages that *do* move money actually get where they're going.

## head: the envelope around the message

The star of the head family is **head.001 — the Business Application Header**, usually just called the **BAH**. Think of every ISO 20022 business message — a pacs.008, a camt.053 — as a letter. The BAH is the addressed envelope wrapped around it.

The payment document says *Bob pays Sweety*. The BAH, sitting outside it, says the operational facts the network needs to route and process the envelope:

- **From** — the institution sending this message (a sender BIC).
- **To** — the institution it's addressed to.
- **Message type** — what's inside (e.g. `pacs.008.001.08`), so the receiver knows how to parse it before opening it.
- **Business message identifier** — a unique id for *this envelope*, distinct from any id inside the payment.
- **Creation timestamp**, and a **possible-duplicate flag** that warns "you may have seen this one already" — the difference between a real second payment and a harmless resend.

Separating the envelope from the letter is the whole point: a bank's routing layer can read the BAH and decide where to send the message **without parsing the payment inside it**. Address on the outside, contents on the inside — same reason the postal service works.

> The BAH gets its own field-by-field deep dive elsewhere in the Library — this page is about where it sits in the family, not every element it carries.

## admi: the network's housekeeping

If head is the envelope on each letter, **admi** is the post office's own internal memos — messages *about the network*, not about any customer's money. You rarely see them as a learner, but they keep the rails healthy:

- **admi.004 — System Event Notification.** "The service is opening / closing / running late." Operational status the whole network needs to hear.
- **admi.002 — Message Reject.** "We couldn't even process that envelope" — a technical rejection at the transport level, before any business logic runs. (Different from a *business* rejection like pacs.002, which understood the payment and declined it.)
- **admi.006 / admi.007** and friends — resend requests and receipt acknowledgements: "please send that again," "got it."

The line to hold: **admi is plumbing.** It carries no payment and no customer. It's the system talking to itself so that the head-wrapped pain, pacs, and camt messages have a working network to travel on.

## Where they sit in a payment

Take Sweety's ₹33,000 one more time. Bob's bank builds the **pacs.008** (the letter), wraps it in a **head.001 BAH** addressed from Bob's bank to the next bank in the chain (the envelope), and hands it to the network. Meanwhile, **admi.004** events quietly tell every participant the clearing system is open for business and processing normally. The payment never touches an admi message — but it depends on the network those messages keep alive.

So every real message on the wire is really *two* things stacked: an **envelope** (head) around a **document** (pain / pacs / camt), travelling over rails that **admi** keeps running.

## So, what can you now do?

You can explain what the Business Application Header does and why it lives *outside* the business message, list the routing facts it carries (from, to, message type, id, timestamp, duplicate flag), tell the head family (the envelope on every message) from the admi family (the network's own housekeeping), and recognise an admi message as plumbing — never a payment.

{{check:head.001 wraps a payment like…|An envelope around a letter — addressing it without opening the contents|A padlock around a vault|A receipt stapled to an invoice}}

{{check:What do the admi messages handle?|System-level administration — the notifications that keep the network itself running|Customer refunds and disputes|Currency conversion between legs}}
