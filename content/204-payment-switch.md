---
title: "The Payment Switch: The Split-Second Router"
level: 200
category: Architecture
summary: "Some payments can't wait for orchestration. A card tap needs an answer in under a second. The switch is the specialised router built for speed: receive, route, authorise, reply, now."
minutes: 7
updated: 2026-06-29
tags: [payment switch, routing, authorisation, real-time, cards]
related: [203-payment-hub, 201-payment-systems, 103-payment-lifecycle]
earnedSkill: "Distinguish a payment switch from a payment hub by what each optimises for, and explain why an authorisation switch must answer in real time and what it does in that instant."
num: 204
status: published
---

> **The problem first.** Sweety taps her card at a shop. Before she's lifted it off the reader, a decision has had to travel to her bank and back: is this card real, does she have the money, is it allowed: yes or no? There's no time to batch this, no time to think it over. A whole class of payment needs an answer in well under a second, every time, millions of times an hour. The hub's careful orchestration is too slow for that. A different kind of engine handles it: the switch.

The [Payment Hub](#) is built for thoroughness. It can take its time to route a payment correctly through many steps. But some payments live and die in a fraction of a second, and for those, thoroughness must give way to **speed**. The **payment switch** is the specialist built for exactly that: a lean, blisteringly fast router whose entire job is to receive a request, send it to the right place, get an answer, and reply, right now.

## Routing, stripped down for speed

The word *switch* is borrowed from telephone exchanges, and the analogy is exact. An old telephone switch had one job: take an incoming call and connect it to the right outgoing line, instantly, without caring what was said. A payment switch does the same with payment requests. It takes each one and connects it to the right destination, as fast as physically possible.

That narrow focus is the whole point. Where the hub asks many questions and runs many steps, the switch asks essentially one, *where does this go?*, and answers it in a blink. It deliberately does **less** so it can do that one thing faster than anything else in the bank.

## The classic job: authorisation switching

The clearest example is the **card authorisation** that happens when Sweety taps to pay. In that instant, an authorisation request races from the shop's terminal across a card network to Sweety's bank, and a yes-or-no answer races back, all before she's put her card away. The switch is the engine standing in the middle of that round trip.

When the request reaches Sweety's bank, the switch must, in real time:

- **Receive** the authorisation request off the network.
- **Route** it to the right internal system that can make the decision.
- Get back the answer, **approve or decline**, based on whether the card is valid, the funds are there, and the payment is allowed.
- **Reply** down the same path, in time for the terminal to show "approved."

Crucially, this is just a **promise**, not the money moving. The switch's yes means *"this payment is good for it"*: Sweety's funds are earmarked. The actual value changes hands later, settled in a batch over one of the systems from [Payment Systems](#). The switch handles the urgent decision; settlement follows at its own pace.

## Why it can't be the hub

It's fair to ask why a bank needs a separate engine at all. Why not let the hub handle this too? Because the two optimise for opposite things:

> The **hub** is built to route a payment *correctly* through many steps and can afford to take its time. The **switch** is built to route a request *instantly* through one step and cannot afford to take any.

A payment that can wait a few seconds, a salary or a transfer, belongs in the hub, where it can be screened, enriched, and carefully routed. A payment that must be answered before a customer lifts their finger belongs in the switch. Many banks run both, side by side, each doing the job the other can't.

## Where the switch shows up

Authorisation is the oldest example, but the pattern reappears wherever a payment needs a real-time answer. The instant payment systems from [Payment Systems](#), where a transfer must clear in seconds, day or night, lean on switch-style routing for the same reason a card network does: there is a customer waiting, right now, for a yes or no. Whenever you see a payment that must be answered *while someone waits*, there's almost certainly a switch in the middle of it.

## So, what can you now do?

You can tell a switch from a hub by what each is built for: the hub routes payments correctly through many steps and can take its time; the switch routes one request instantly and cannot. You can walk through what an authorisation switch does in the split second of a card tap (receive, route, decide, reply) and explain that its "yes" is a promise, with real settlement following later over a payment system. And you can spot the switch pattern anywhere a payment needs an answer while a customer is still waiting, which is exactly the world the final article in this level, [Real-Time Payments](#), is built around.

{{check:What does a payment switch do?|Routes each transaction to the right destination network or processor in real time|Converts currencies between countries|Stores customer account balances}}

{{check:Where would you most expect to find a switch?|In card and instant-payment networks, where traffic must route in milliseconds|In monthly batch payroll runs|Inside a customer’s mobile app}}
