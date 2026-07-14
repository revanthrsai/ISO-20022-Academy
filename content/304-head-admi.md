---
title: "head & admi: The Envelope and the Housekeeping"
level: 300
category: Message Deep Dives
summary: "Before a bank reads what a message says, it reads who sent it and who it's for. The head family is the envelope around every message; the admi family is the network's quiet housekeeping that keeps the post office running."
minutes: 7
updated: 2026-07-13
tags: [head, admi, head.001, BAH, business-application-header, admi.004, housekeeping]
related: [305-message-lifecycle, 302-pacs-family, 201-business-application-header]
earnedSkill: "Explain what the Business Application Header (head.001) does and why it sits outside the message, tell the head family from the admi family, and recognise an admi message as network housekeeping rather than a payment."
num: 304
status: published
---

> **The problem first.** Bob's bank wants to send Sweety's payment onward, but the network it's handing to is enormous — thousands of banks, millions of instructions a day. The payment itself says *who pays whom*, but it doesn't say *which institution is sending this envelope, to which institution, right now, and whether it's a copy or the real thing*.

Two small but essential families answer that. And the first one you can rederive from a mail room.

## Where does the address go?

{{think}}
A `pacs.008` says Bob pays Sweety. But hand it to a network of thousands of banks and something's missing: the mail room can't sort a letter with no address on the *outside*. It shouldn't have to open and parse the whole payment just to decide where to forward it.

So where does the routing information go, and what does it need to carry?
{{reveal}}
On the outside, in a small header wrapped around the message — **head.001, the Business Application Header** (the BAH). It carries the operational facts a router needs: **From** (sender BIC), **To** (recipient), **message type** (e.g. `pacs.008.001.08`, so the receiver knows how to parse before opening), a **business message id** for this envelope, a **creation timestamp**, and a **possible-duplicate flag** ("you may have seen this one").

The whole point is that a routing layer reads the BAH and forwards the message *without parsing the payment inside it.* Address on the outside, contents on the inside — the reason the postal service works.
{{/think}}

> The BAH gets its own field-by-field deep dive in the Architecture level; this page is about where it sits in the family.

## The other family: the post office's own memos

{{think}}
The head-wrapped pain, pacs, and camt messages need a *working network* to travel on. Somebody has to announce "the service is opening," "we couldn't even read that envelope," "please resend." These messages carry no customer and no money. What family are they, and what's the one line to remember about them?
{{reveal}}
That's **admi** (administration) — the post office's internal memos:

- **admi.004, System Event Notification** — "the service is opening / closing / running late."
- **admi.002, Message Reject** — "we couldn't even process that envelope," a *transport-level* rejection before any business logic runs.
- **admi.006 / admi.007** and friends — resend requests and acknowledgements: "send that again," "got it."

The line to hold: **admi is plumbing.** No payment, no customer. It's the system talking to itself so the money-moving messages have rails to run on.
{{/think}}

## Where they sit in a payment

Take Sweety's ₹33,000 once more. Bob's bank builds the **pacs.008** (the letter), wraps it in a **head.001 BAH** addressed from Bob's bank to the next bank (the envelope), and hands it to the network. Meanwhile **admi.004** events quietly tell every participant the clearing system is open and processing normally. The payment never touches an admi message, but it depends on the network those messages keep alive.

So every real message on the wire is really *two* things stacked: an **envelope** (head) around a **document** (pain / pacs / camt), travelling over rails that **admi** keeps running.

{{aside:model|The mental model}}
**Every message on the wire = an envelope (head) around a document (pain/pacs/camt), over rails that admi keeps running.** The head.001 BAH carries routing and identity on the *outside* so a router never opens the letter. admi carries no money — it's the network's housekeeping.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Keep two "rejects" apart: **admi.002** is a *transport-level* reject — "we couldn't even parse this envelope" — before any business logic runs. **pacs.002** is a *business* reject — the payment was understood and declined (bad account, no funds). Different layers, different fixes. And the BAH's possible-duplicate flag is what separates a genuine second payment from a harmless resend — ignore it and you risk double-processing.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Confusing admi.002 with pacs.002.** A transport reject means the message never entered business processing; treating it like a business decline sends you debugging the wrong layer.
- **Treating an admi message as a payment.** It carries no customer and no funds — never reconcile against one.
- **Ignoring the duplicate flag.** A resend read as a fresh payment is a double-processing incident waiting to happen.
{{/aside}}

{{aside:map|The map}}
The envelope and the plumbing around every message:

- The BAH field by field → {{link:article:201-business-application-header|the Business Application Header}}.
- The documents it wraps → {{link:article:302-pacs-family|the pacs family}}.
- Where these sit in a message's life → {{link:article:305-message-lifecycle|the message lifecycle}}.
{{/aside}}

{{aside:ref|Reference card}}
- **head.001 (BAH)** = the envelope: From, To, message type, business message id, timestamp, duplicate flag. Routes without opening the letter.
- **admi** = network housekeeping, no money: admi.004 (system events), admi.002 (transport reject), admi.006/007 (resend/ack).
- **admi.002 ≠ pacs.002:** transport reject vs business decline.
- **On the wire:** envelope (head) + document (pain/pacs/camt) over admi-kept rails.
{{/aside}}

## So what can you do now?

You can explain what the Business Application Header does and why it lives *outside* the business message, list the routing facts it carries (from, to, message type, id, timestamp, duplicate flag), tell the head family (the envelope on every message) from the admi family (the network's own housekeeping), and recognise an admi message as plumbing, never a payment.

{{check:head.001 wraps a payment like…|An envelope around a letter — addressing it without opening the contents|A padlock around a vault|A receipt stapled to an invoice}}

{{check:What do the admi messages handle?|System-level administration — the notifications that keep the network itself running|Customer refunds and disputes|Currency conversion between legs}}
