---
title: "The Payment Hub: The Brain That Routes Every Payment"
level: 200
category: Architecture
summary: "A bank handles many kinds of payment over many systems. The hub is the central engine that takes each clean payment and decides where it goes, how, and on which road."
minutes: 8
updated: 2026-07-13
tags: [payment hub, orchestration, routing, processing, core]
related: [103-payment-lifecycle, 201-payment-systems, 105-payment-participants]
earnedSkill: "Explain why a bank centralises payment processing into a hub, and trace how one payment is orchestrated — routed, processed, dispatched — from the moment it clears the gateway."
num: 203
status: published
---

> **The payment is inside. Now what?** A clean payment just came through the bank's front door. Something has to decide: fast expensive road, or cheap overnight one? Fraud check, currency conversion, compliance hold? And which of the bank's many systems should actually handle it?

Last article, the gateway got a payment inside the bank in one clean format. Now something has to decide what happens to it. Before we name that something, let's watch what goes wrong if you *don't* build it.

## Let every channel decide for itself

{{think}}
Your bank grew up the way most did. Domestic transfers have their own processing system. Cross-border has another. Salaries a third. Cards a fourth. Each was built by a different team, at a different time, with its own rules and its own copy of "should we screen this? which road does it take? does it need FX?"

A payment comes in. Each silo answers those questions its own way. What's the problem you've just baked in — and what would you build to fix it?
{{reveal}}
The same customer payment gets handled *differently* depending on which silo it happened to fall into. The screening logic lives in four places and slowly drifts apart. A rule change has to be made four times, and someone always misses one. Adding a fifth payment type means building a fifth silo from scratch.

The fix is to pull all that decision-making into *one* central engine that every channel feeds into and every road leads out of. One brain, deciding consistently for every payment. That engine is the **payment hub.**
{{/think}}

The hub replaces the pile of silos with a single place where every payment, whatever its origin, flows through the same logic. The bank behaves consistently, and a new payment type or a new system plugs into one place instead of being rebuilt everywhere.

## What "orchestration" actually means

Orchestration is the hub's core word, and it's a good one. The hub is the conductor; a payment's journey is a short piece of music whose movements must happen in the right order. For each payment the hub works through:

- **Which road?** Large and urgent, or routine and batched? Domestic or cross-border? It picks the right system from {{link:article:201-payment-systems|payment systems}}.
- **What checks are left?** Sanctions screening, fraud scoring, a compliance hold, a limit check — whichever apply.
- **Anything to convert or add?** A currency conversion, a fee, an enrichment from the bank's own records.
- **In what order?** Many steps depend on each other, so the hub sequences them.

It doesn't necessarily *perform* each step itself — it often calls out to specialist systems (a fraud engine, a screening service) and waits for the answer. Its job is to *coordinate*: make sure each step happens, in the right order, for every payment, and carry the payment from one step to the next. It also holds a single trustworthy record of every payment in flight — the raw material for {{link:article:103-payment-lifecycle|reconciliation}} later.

## But not everything belongs in the hub

{{think}}
The hub is careful and thorough. It can take a beat to route a payment through all those steps in the right order. Now a card tap lands: Sweety's at a shop, card on the reader, and her bank has to answer *yes or no* before she lifts her hand — well under a second.

Do you send that through the same careful hub?
{{reveal}}
No. The hub's strength — running many steps in careful order — is exactly the wrong thing when a customer is standing there waiting for a light to go green. That job needs a different engine, one built for raw speed through a single step, not thoroughness through many.

That engine is the **switch**, and it's the next article. The hub and the switch are two answers to two different questions: *route this correctly* versus *route this instantly.*
{{/think}}

## Door, brain, road

Three words from this level blur together, so pin them with one sentence:

> The **gateway** is the door a payment comes *in* through. The **hub** is the brain that decides what to *do* with it and where to send it. The **payment system** is the road it travels *out* on to reach another bank.

A payment enters through the gateway, is orchestrated by the hub, and leaves on a system.

{{aside:model|The mental model}}
**The hub is one central brain all payments flow through, instead of a silo per channel.** It orchestrates: pick the road, run the checks, do the conversions, in the right order — coordinating specialist systems rather than doing everything itself — and it keeps one trusted record of every payment in flight.
{{/aside}}

{{aside:chair|From the engineer's chair}}
The hub is usually where the bank's *canonical* payment lives — very often an ISO 20022 model — from the moment the gateway hands it over until it's dispatched. The status messages a sender gets back (`pacs.002`: accepted, rejected, pending) are emitted as the payment moves through the hub's steps. And the `UETR` that tracks a payment end to end is the key the hub uses to keep its single record straight.
{{/aside}}

{{aside:breaks|Where it breaks}}
The failure the hub was invented to kill: the same logic living in many silos and drifting apart. When screening or routing rules are copied per channel, every change has to be made everywhere at once — and the one that gets missed becomes the payment that behaves differently depending on where it came in. Inconsistent behaviour across channels is almost always duplicated logic that fell out of sync.
{{/aside}}

{{aside:map|The map}}
The hub is the middle of the bank, between the door and the road:

- The door that feeds it → {{link:article:202-payment-gateway|the payment gateway}}.
- The split-second router for payments it's too slow for → {{link:article:204-payment-switch|the payment switch}}.
- The roads it dispatches onto → {{link:article:201-payment-systems|payment systems}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Hub** = one central engine that orchestrates every payment, replacing per-channel silos.
- **Orchestrate** = pick the road, run the checks/conversions, in the right order, and carry the payment step to step.
- **It coordinates** specialist systems; it doesn't do every check itself.
- **It holds** a single record of everything in flight (feeds reconciliation).
- **Door / brain / road** = gateway / hub / payment system.
{{/aside}}

## So what can you do now?

You can explain why a modern bank funnels all its payments through one central engine instead of a pile of silos, and what that engine does: route each payment to the right system, run it through the checks and conversions it needs, in the right order, and dispatch it — all while holding one trusted record of everything in flight. And you can keep the gateway, the hub, and the payment system cleanly apart as door, brain, and road.

{{check:Why do banks build a payment hub?|One central brain for all payment flows, instead of a silo per channel and scheme|To hold customer deposits in a single place|Because regulators require a separate system per country}}

{{check:What problem do per-scheme silos create that a hub solves?|The same logic is duplicated and drifts apart — every change must be made many times over|Silos process payments too quickly to monitor|Silos cannot connect to a network}}
