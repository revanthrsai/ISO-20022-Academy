---
title: "Clearing vs. Settlement: The Two Halves of a Payment"
level: 100
category: Fundamentals
summary: "Everyone uses these two words as if they mean the same thing. They don't, and the gap between them is where most payment confusion and risk lives."
minutes: 7
updated: 2026-07-13
tags: [clearing, settlement, RTGS, netting]
related: [103-payment-lifecycle, 101-nostro-vostro, 105-payment-participants]
earnedSkill: "Split the 'agreeing what's owed' step from the 'actually moving the money' step, say why net and gross settlement both exist, and pin the exact moment a payment becomes final."
num: 104
status: published
---

> **The problem first.** Two banks send each other thousands of payments a day. Do they really shove money back and forth for every single one? And when is a payment *truly* final, past the point where anyone can claw it back?

You already know a payment splits into two things: the message that asks, and the money that actually moves. This article is about that money half, and the two words people constantly mix up describing it. Instead of defining them, let's put you in charge of a bank and let you invent the answer.

## You run the bank. Do the math.

{{think}}
You run Bank A. Bank B is across town. By the end of today your customers have sent theirs 8,000 payments worth £10m, and their customers have sent yours 7,500 payments worth £9m.

Actually moving central-bank money is slow and ties up cash you'd rather not have sitting idle. So: what's the least amount of money you can actually move to make everyone square?
{{reveal}}
You don't move £19m back and forth. You keep a running tally all day — *you owe me this, I owe you that* — and at the end you move only the **difference**: £1m, once, from A to B. Done.

You just split a payment into its two real halves without being told to. The all-day tallying, agreeing who owes what, is **clearing**. The single £1m handover at the end, the actual money changing hands, is **settlement**. They're different jobs, they happen at different times, and often different systems do them.
{{/think}}

Two friends who keep buying each other coffees do the same thing. They don't fish out exact change every time. They keep a mental tab and one of them squares it up at the end of the week. Banks just do it millions of times a day with more zeros.

## Clearing agrees. Settlement moves.

Now the two words have real edges:

**Clearing** is everything between a payment being accepted and the money actually moving. The instructions get exchanged and checked, both sides confirm they see the same thing (same amount, same parties, same reference), and the obligations get tallied up. At the end of clearing everyone agrees on the number. But not a penny has moved. A cleared payment is a firm promise, not a finished one. That's why a payment can sit there marked "accepted" or "pending": it's cleared, not settled.

**Settlement** is the moment the agreed value really changes hands. One account is debited, another credited, usually across accounts the banks hold at a central bank. This is the part you can't take back. Before it, you can often still stop a payment. After it, the money has genuinely left one side and arrived at the other, and undoing it means a whole separate, deliberate process, never a quiet "undo."

{{aside:model|The mental model}}
Two words, two jobs, and it's worth branding them into muscle memory:

**Clearing agrees the obligation. Settlement discharges it, with finality.**

Finality is the whole point of settlement. Once a payment settles with finality, it's done — legally and practically. Everything downstream is built on being able to trust that settled money is truly, actually there.
{{/aside}}

## The risk hiding in "settle up later"

{{think}}
Netting felt free. Move £1m instead of £19m, everybody wins. But you're Bank A, and it's 3pm, and the net won't settle until 5pm. Bank B has been receiving value from your customers all day on the promise you'll square up at close.

What happens to you if Bank B goes bust at 4pm?
{{reveal}}
You're exposed. Value went to Bank B's customers all day, but the money to cover it never actually moved, and now the counterparty that owed you is gone. That in-between window, where obligations are agreed but not yet settled, is real risk sitting on your books.

So for big, urgent payments, banks don't wait. They settle each one **individually, in full, the instant it's ready**, with no netting. That's what an **RTGS** system does — Real-Time Gross Settlement, the central-bank-run backbone for large and time-critical payments. Every payment is final on its own, so the in-between exposure basically vanishes. The cost is that it eats far more cash, because nothing gets offset.
{{/think}}

So there are two rhythms, and it's a straight trade of cost against risk:

- **Net settlement.** Add up what everyone owes over a period, move only the difference. Cheap and frugal with cash. But you carry exposure to each other until the net lands.
- **Gross settlement.** Settle every payment on its own, in full, immediately, through RTGS. Almost no in-between risk. But it demands a lot more cash on hand.

Big, urgent payments go gross through RTGS, where finality matters most. High-volume, low-value payments get netted, where efficiency wins. Most countries run both, side by side, and don't think twice about it.

## Where the money actually sits

Settlement has to move value between accounts that genuinely exist somewhere. For banks in the same country, that's usually accounts at the central bank. Across borders, where there's no shared central bank, it's the accounts banks hold *with each other* — the nostro and vostro accounts from {{link:article:101-nostro-vostro|the next article}}. Clearing decides the number; settlement debits and credits one of these real accounts to make the number true.

{{aside:chair|From the engineer's chair}}
Open an ISO 20022 payment later and you'll notice the standard is fussy about talking about a `IntrBkSttlmDt` (settlement date), `IntrBkSttlmAmt` (settlement amount), and a settlement method, all as distinct things from the instruction itself. Now you know why. The message is the clearing-stage agreement, and it carries explicit details about the settlement that hasn't happened yet. The standard keeps "what we agreed" and "when and how the money lands" in separate fields on purpose, because in real life they're separate events.
{{/aside}}

{{aside:breaks|Where it breaks}}
The costly assumption: *"it's cleared, so it's basically done."* It isn't. A cleared payment is agreed, not paid. Systems that treat "accepted" as "final" and release goods or onward payments against it are exposed if settlement then fails, and settlement can fail — a bank runs short of funds, a cut-off is missed, a counterparty defaults. The only status you can fully build on is settled-with-finality. Everything before that is a promise.
{{/aside}}

{{aside:map|The map}}
Clearing and settlement are the middle of a longer journey, moving across real accounts:

- The full run of stages this sits inside → {{link:article:103-payment-lifecycle|the payment lifecycle}}.
- The accounts settlement actually lands in, across borders → {{link:article:101-nostro-vostro|nostro & vostro}}.
- The banks and systems doing the clearing and settling → {{link:article:105-payment-participants|the participants}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Clearing** = agree who owes what. No money has moved yet.
- **Settlement** = actually move the value, finally and irreversibly.
- **Final** means final: a payment is truly done at settlement, not when it's sent or cleared.
- **Net** settlement moves only the difference (cheap, carries exposure). **Gross**/RTGS settles each payment in full, instantly (safe, cash-hungry).
- Value settles across real accounts: at a central bank domestically, in nostro/vostro across borders.
{{/aside}}

## So what can you do now?

You can stop treating "clearing" and "settlement" as the same word and say the difference cleanly: clearing *agrees* the obligation, settlement *discharges* it with finality. You can explain why net and gross both exist and which payments go which way. And you can answer the question we opened with — a payment becomes truly final not when it's sent, not when it clears, but when it **settles.**

{{check:What's the difference between clearing and settlement?|Clearing agrees who owes what; settlement actually moves the funds|Clearing moves the funds; settlement checks them afterwards|They're two words for the same step}}

{{check:When is a payment truly final?|When settlement completes irrevocably|When the sender's app shows a confirmation|When the instruction reaches the next bank}}
