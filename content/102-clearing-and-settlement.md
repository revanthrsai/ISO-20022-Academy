---
title: "Clearing vs. Settlement: The Two Halves of a Payment"
level: 100
category: Fundamentals
summary: "Everyone uses these two words interchangeably. They are not the same thing — and the difference is where most payment confusion lives."
minutes: 7
updated: 2026-06-28
tags: [clearing, settlement, RTGS, netting]
related: [103-payment-lifecycle, 101-nostro-vostro, 105-payment-participants]
earnedSkill: "Separate the 'agreeing what's owed' step from the 'actually moving the money' step, and know which systems do which — and why one is reversible and the other isn't."
num: 104
status: published
---

> **The problem first.** Two banks send each other thousands of payments a day. Do they really shove money back and forth for every single one? And at what exact instant is a payment *truly final* — past the point where anyone can claw it back?

Two words sit at the centre of every payment, and almost everyone uses them as if they meant the same thing. They don't. **Clearing** is agreeing who owes what. **Settlement** is actually moving the money. They happen at different moments, often by different systems, and the gap between them is where a surprising amount of payment confusion — and risk — lives. Tell them apart and a lot of the field suddenly makes sense.

## A simple picture: two friends and a tab

Imagine Bob and Sweety go out often and keep paying for each other's coffees. They could settle up at the till every single time — fish out exact change for every cup. Exhausting.

Instead they keep a running tab. *"You got mine yesterday, I'll get yours today, you owe me one."* That running tally is **clearing**: continuously agreeing on the net position, who's ahead and by how much. Then, at the end of the week, one of them hands over a single amount to make it even. *That* handover is **settlement** — the actual money, moved once, to discharge everything the tab had been tracking.

Banks do exactly this, millions of times a day.

## Clearing: agreeing what's owed

**Clearing** is everything that happens between a payment being accepted and the money actually moving. It's the matching and agreeing step:

- The payment instructions are exchanged and validated.
- Each side confirms it sees the same thing — same amount, same parties, same reference.
- The **obligations** are tallied up: Bank A owes Bank B this much, across all the payments between them.

At the end of clearing, **everyone agrees on the number.** But no value has moved yet. A cleared payment is a firm promise, not a finished one. This is why a payment can sit in a "pending" or "accepted" state — it has cleared but not yet settled.

## Settlement: actually moving the value

**Settlement** is the moment the agreed value really changes hands — one bank's account is debited and another's is credited, usually across accounts they hold at a central bank. This is the irreversible event. Before settlement you can often still stop a payment; after it, the money has genuinely left one side and arrived at the other, and undoing it requires a whole separate, deliberate process (a return or a recall — never a simple "undo").

The defining property of settlement is **finality.** When a payment is settled with finality, it is done — legally and practically. That single guarantee is what the entire system is built to protect, because everything downstream depends on being able to trust that settled money is truly there.

## Net vs. gross: the two ways to settle

There are two fundamentally different rhythms for settlement, and the choice between them is a trade-off between cost and risk.

- **Net settlement (netting).** Add up everything two banks owe each other over a period and move only the *difference*. If Bank A owes Bank B £10m and Bank B owes Bank A £9m, only £1m actually moves. This is cheap and frugal with cash — but during the day, before the net settles, the banks are carrying exposure to each other (if one fails mid-cycle, the other is owed money that never moved).
- **Gross settlement.** Settle every payment individually, in full, the moment it's ready — no waiting, no netting. This is what an **RTGS** system does (a *Real-Time Gross Settlement* system, the central-bank-run backbone for large and time-critical payments). It all but eliminates the in-between exposure because each payment is final on its own — but it demands far more cash on hand, since nothing is offset.

Big, urgent payments tend to go gross through RTGS, where finality matters most. High-volume, low-value payments tend to be netted, where efficiency matters more. Most countries run both, side by side.

## Where the money actually sits

Settlement has to move value *between accounts that really exist somewhere*. For banks in the same country, that's typically accounts at the central bank. Across borders, where there's no shared central bank, it's the **correspondent accounts** banks hold with each other — the nostro and vostro accounts from the next article. Clearing decides the number; settlement debits and credits one of these accounts to make the number real. (See [Nostro & Vostro](#) for where cross-border settlement actually lands.)

## Why this split matters for the messages

When you reach the ISO 20022 message families, you'll notice the standard is careful to talk about a **settlement date**, **settlement amount**, and **settlement method** as distinct things from the instruction itself. Now you know why: the message is the clearing-stage agreement, and it carries explicit details about the settlement that will follow. The standard separates "what we agreed" from "when and how the money lands" precisely because, in the real world, those are two different events.

## So, what can you now do?

You can stop using "clearing" and "settlement" as synonyms and explain the difference cleanly: clearing **agrees** the obligation, settlement **discharges** it with finality. You can say why net and gross settlement exist and which payments go which way. And you can answer the question that opened this article — a payment becomes truly final not when it's *sent*, not when it *clears*, but when it **settles.**

{{check:What is the difference between clearing and settlement?|Clearing agrees who owes what; settlement actually moves the funds|Clearing moves the funds; settlement checks them afterwards|They are two words for the same step}}

{{check:When is a payment truly final?|When settlement completes irrevocably|When the sender’s app shows a confirmation|When the instruction reaches the next bank}}
