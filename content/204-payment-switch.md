---
title: "The Payment Switch: The Split-Second Router"
level: 200
category: Architecture
summary: "Some payments can't wait for orchestration. A card tap needs an answer in under a second. The switch is the router built for pure speed: receive, route, authorise, reply, now."
minutes: 7
updated: 2026-07-13
tags: [payment switch, routing, authorisation, real-time, cards]
related: [203-payment-hub, 201-payment-systems, 103-payment-lifecycle]
earnedSkill: "Tell a switch from a hub by what each optimises for, and explain why an authorisation switch must answer in real time, what it does in that instant, and why its 'yes' isn't the money moving."
num: 204
status: published
---

> **The problem first.** Sweety taps her card at a shop. Before she's lifted it off the reader, a decision has raced to her bank and back: is this card real, does she have the money, is it allowed — yes or no? No time to batch it, no time to think it over. Millions of times an hour, an answer in well under a second.

Last article you built the hub — careful, thorough, happy to take a beat to route a payment right. This article starts where the hub runs out of time. And the fastest way to see why the switch exists is to try to do this job with the hub you just built.

## The tap that can't wait

{{think}}
Sweety's card is on the reader. Her bank has one job in this instant: answer *real card? funds there? allowed?* with a yes or no, before she lifts her hand. You've already got the hub, which screens, enriches, and carefully routes through many steps.

Can you use the hub here? If not, what do you build instead — and what's the least it has to do?
{{reveal}}
You can't. The hub's whole strength — many steps, careful order — is dead weight when a customer is standing there waiting for the light to go green. Every extra step is time you don't have.

So you build the opposite: a lean router that does *one* thing as fast as physically possible. Receive the request off the network, route it to the system that can decide, get the answer back, reply down the same path — all in a blink. That's a **payment switch.** It deliberately does *less* so it can do that one thing faster than anything else in the bank.
{{/think}}

The name comes from telephone exchanges, and the analogy is exact. An old telephone switch took an incoming call and connected it to the right outgoing line, instantly, without caring what was said. A payment switch does the same with payment requests: connect each one to the right destination, now. Where the hub asks many questions, the switch asks essentially one — *where does this go?* — and answers in milliseconds.

## The classic job: authorisation

The clearest example is the card authorisation behind Sweety's tap. In that instant, a request races from the shop's terminal, across a card network, to Sweety's bank, and a yes/no races back. The switch stands in the middle of that round trip. At her bank it must, in real time:

- **Receive** the authorisation request off the network.
- **Route** it to the internal system that can make the call.
- Get back **approve or decline** — is the card valid, are the funds there, is it allowed?
- **Reply** down the same path in time for the terminal to show "approved."

## But has the shop been paid?

{{think}}
The switch flashes "approved." Sweety pockets her card and walks out with her coffee. Question: has the shop actually received any money?
{{reveal}}
No. Not yet. That "approved" was a *promise*, not a payment. Sweety's funds are earmarked — the bank is saying "this is good for it" — but the real value changes hands later, settled in a batch over one of the systems from {{link:article:201-payment-systems|payment systems}}.

It's the same message-versus-money split from Fundamentals, just at high speed. The switch handles the urgent *decision*. Settlement follows at its own pace.
{{/think}}

## Why it can't just be the hub

Fair question: why a whole separate engine? Because the two optimise for opposite things.

> The **hub** is built to route a payment *correctly* through many steps, and can afford to take its time. The **switch** is built to route a request *instantly* through one step, and cannot afford any.

A payment that can wait a few seconds — a salary, a transfer — belongs in the hub, where it can be screened, enriched, and carefully routed. A payment that must be answered before a customer lifts their finger belongs in the switch. Most banks run both, side by side, each doing the job the other can't.

## Where the switch shows up

Authorisation is the oldest example, but the pattern repeats wherever a payment needs a real-time answer. The instant payment systems from {{link:article:201-payment-systems|payment systems}}, where a transfer must clear in seconds day or night, lean on switch-style routing for the same reason a card network does: a customer is waiting, right now, for a yes or no. See a payment that has to be answered *while someone waits*, and there's almost certainly a switch in the middle.

{{aside:model|The mental model}}
**Hub and switch are two answers to two questions.** Route this *correctly* through many steps → hub, takes its time. Route this *instantly* through one step → switch, can't afford a beat. The switch does less on purpose, so it can be the fastest thing in the bank.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Authorisation is a different event from clearing and settlement — worth keeping straight when you meet card messages (the `caaa` acceptor-to-acquirer family in ISO 20022, historically ISO 8583). The switch's job is the real-time auth decision. The `pacs`-style clearing and settlement that actually moves the money is a separate, later flow. One says "good for it now"; the other says "money's moved."
{{/aside}}

{{aside:breaks|Where it breaks}}
Treat the switch's "approved" as settled money and you're exposed. The auth is a promise on earmarked funds, not a completed payment — settlement can still fail, and cards add chargebacks on top. Systems that ship goods or release onward value on the *authorisation* alone, as if it were final, are trusting a promise. "Approved" means good-for-it, not paid.
{{/aside}}

{{aside:map|The map}}
The switch is the fast lane beside the hub:

- The careful engine it takes load off → {{link:article:203-payment-hub|the payment hub}}.
- The rails that settle what it authorised → {{link:article:201-payment-systems|payment systems}}.
- The always-on world it powers → {{link:article:205-real-time-payments|real-time payments}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Switch** = a lean router optimised for speed: receive → route → decide → reply, in milliseconds.
- **Named for** the telephone exchange: connect the call, instantly, don't care what's said.
- **Classic job:** card authorisation — a yes/no before the customer lifts their hand.
- **Its "yes" is a promise** (funds earmarked), not settlement. Money moves later, in batch.
- **Hub vs switch:** correct-through-many-steps vs instant-through-one.
{{/aside}}

## So what can you do now?

You can tell a switch from a hub by what each is built for: the hub routes payments correctly through many steps and can take its time; the switch routes one request instantly and cannot. You can walk what an authorisation switch does in the split second of a tap — receive, route, decide, reply — and explain that its "yes" is a promise, with real settlement following later over a payment system. And you can spot the switch pattern anywhere a payment needs an answer while a customer waits, which is exactly the world {{link:article:205-real-time-payments|real-time payments}} is built around.

{{check:What does a payment switch do?|Routes each transaction to the right destination network or processor in real time|Converts currencies between countries|Stores customer account balances}}

{{check:Where would you most expect to find a switch?|In card and instant-payment networks, where traffic must route in milliseconds|In monthly batch payroll runs|Inside a customer's mobile app}}
