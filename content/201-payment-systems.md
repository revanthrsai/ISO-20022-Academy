---
title: "Payment Systems: The Shared Roads Money Travels On"
level: 200
category: Architecture
summary: "Banks don't wire a private cable to every other bank. They plug into a few shared roads, and which road a payment takes decides its speed, its cost, and its rules."
minutes: 8
updated: 2026-07-13
tags: [payment systems, RTGS, ACH, rails, scheme]
related: [103-payment-lifecycle, 102-clearing-and-settlement, 105-payment-participants]
earnedSkill: "Tell the major kinds of payment system apart by how and when they settle, and predict which one a payment rides from its size, speed, and direction."
num: 201
status: published
---

> **Do the math.** Bob's bank and Sweety's bank need to swap value. But no bank can lay a private cable to every other bank on earth — that's millions of cables. So how do thousands of banks reach each other without wiring themselves together one pair at a time?

In Fundamentals you met the cast of a payment and the five stages it runs through. Now we go under all of it, to the shared infrastructure the banks actually plug into. And the cleanest way to understand why it exists is to try building it without it first.

## Try to connect every bank to every bank

{{think}}
You're setting up money movement for a country with 1,000 banks. The obvious plan: every bank opens an account and a relationship with every other bank, so anyone can pay anyone directly.

Count the relationships that needs. Then ask what happens when bank number 1,001 shows up.
{{reveal}}
Connect everyone to everyone and you need roughly *n²* links — for 1,000 banks that's around half a million relationships, each with its own account, contract, and reconciliation. Add one more bank and it has to strike a thousand new deals before it can pay anybody. It collapses under its own weight.

So nobody builds it that way. Instead everyone connects *once* to a single shared thing in the middle. Join it, agree its rules, and you can now reach every other member through that one connection. That shared thing in the middle is a **payment system**.
{{/think}}

A payment system is the common ground where the banks you met in {{link:article:105-payment-participants|participants}} actually meet. One connection each, everybody reachable.

## Every system does two jobs

Strip any payment system down and it does the two halves you already know from {{link:article:102-clearing-and-settlement|clearing vs. settlement}}:

- **It clears** — carries the instructions and works out who owes whom.
- **It settles** — moves the real value (or records that it moved), usually across accounts the members hold at a central bank.

What makes one system different from another is almost entirely *how and when* it does that second job.

## The choice that splits the whole family

{{think}}
You're designing the settlement half. Two options are on the table. Option A: move real money for every single payment, the instant it happens. Option B: keep a tally all day and move only the net between each pair of banks at the end.

Neither is free. What are you actually trading when you pick one?
{{reveal}}
- **Move every payment now (gross).** Each payment is final on its own the moment it lands, so there's almost no risk hanging in the air. But it's cash-hungry — nothing gets offset, so banks need a lot of money on hand.
- **Batch and net (deferred net).** Thousands of payments collapse into a handful of net movements, so it's cheap and light on cash. But it's slower, and until the net settles the banks carry exposure to each other.

That single choice — settle now and gross, or later and net — is the fault line the entire family of systems divides along.
{{/think}}

## The three roads you'll meet most

Almost every payment you'll study rides one of three.

**Real-time gross settlement (RTGS)** is the motorway for big money. Each payment settles one at a time, immediately, for the full amount, in central-bank money. Run by central banks, it carries the largest, most urgent, most irreversible payments. Expensive, and final — once it settles here, it's done. When Bob's and Sweety's banks square up the real money behind a large transfer, an RTGS is usually where it lands.

**Deferred net settlement (an ACH)** is the shared bus for everyday payments. It collects payments over an hour or a day, works out only the net between each pair of banks, and settles that one figure. Salaries, direct debits, routine transfers ride here. Cheap and efficient because thousands of payments become a few net moves, but slower — the value lands in a batch, later.

**Instant payment systems** are the new express lane: small payments, settled individually, around the clock, in seconds. They borrow the immediacy of an RTGS but open it to everyday, lower-value payments every day of the year. They earn their own article, {{link:article:205-real-time-payments|real-time payments}}, later in this level.

## The cross-border catch

Each of these systems is usually *domestic* — one currency, one country's rules. That's fine while Bob and Sweety bank in the same place. The moment a payment crosses a border, no single system reaches both ends.

Which is exactly where the intermediaries from {{link:article:105-payment-participants|participants}} come back. A cross-border payment is stitched together from *several* domestic systems, linked by correspondent banks that belong to more than one. The payment hops from one country's road network to the next, changing systems at each border. Once you see that a cross-border payment is really a *chain of domestic systems*, its slowness, cost, and poor traceability stop being mysteries.

## Schemes: the rules of the road

One last piece. A road is useless if everyone drives by different rules. Sitting on or beside each system is a **scheme** — the rule-book every member signs up to. It defines the message formats, the timing windows, the obligations, and what counts as a valid payment. The system is the road; the scheme is the highway code.

{{aside:model|The mental model}}
**A payment system is a shared road banks join once to reach everyone. Its settlement rhythm — gross vs net — sets its speed, cost, and risk.** Gross/RTGS: instant, final, cash-hungry. Net/ACH: cheap, batched, slower. Instant: small, always-on. And a *scheme* is the rule-book that makes any member's message mean the same thing to every other member.
{{/aside}}

{{aside:chair|From the engineer's chair}}
The road a payment takes shows up right inside the message. A `pacs.008` carries a settlement method (`SttlmMtd`) — values like `INDA`/`INGA` (settle across an account at an agent) or `CLRG` (settle through a clearing system). And the *scheme* is named on the envelope: the `BizSvc` in the header says whether CBPR+ or an HVPS+ market-infrastructure rulebook applies. The infrastructure isn't hidden behind the message — it's declared in it.
{{/aside}}

{{aside:breaks|Where it breaks}}
The assumption that quietly bites: *"there's one system, and it reaches everywhere."* There isn't. Systems are mostly domestic and single-currency, so a cross-border payment is a relay across several of them joined by correspondents. Every hand-off is a place to lose time, add cost, or drop the trail — which is why "why is this international payment slow and hard to track?" almost always answers itself once you count the systems it had to cross.
{{/aside}}

{{aside:map|The map}}
Systems are the roads; the next articles are the buildings on them:

- The bank's front door onto these roads → {{link:article:202-payment-gateway|the payment gateway}}.
- The always-on express lane → {{link:article:205-real-time-payments|real-time payments}}.
- The rule-books for cross-border and high-value → {{link:article:207-cbpr-and-hvps|CBPR+ and HVPS+}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Payment system** = a shared hub banks join once, instead of ~n² private links.
- **Every system clears and settles**; the difference is *how and when* it settles.
- **RTGS** = gross, instant, final, cash-hungry (big/urgent). **ACH** = net, batched, cheap, slower (bulk/retail). **Instant** = small, individual, 24/7.
- **Cross-border** = a chain of domestic systems joined by correspondents.
- **Scheme** = the rule-book on top of the road (formats, timing, validity).
{{/aside}}

## So what can you do now?

You can look at any payment and drop it on the right road: large and urgent settles gross and now; routine and bulk nets and settles later; small and instant rides an always-on lane; anything crossing a border is really a chain of domestic systems joined by correspondents. And you know every road comes with a rule-book — a scheme — which is exactly why the messages later in the Library are so precise. That map of the infrastructure is the floor the rest of Architecture stands on.

{{check:What separates an RTGS from an ACH?|RTGS settles each payment individually in real time; an ACH settles batches in cycles|RTGS is only for small retail payments|An ACH settles instantly; RTGS waits for end of day}}

{{check:Why do high-value payments usually ride an RTGS?|Finality — each payment settles irrevocably, one by one, in central-bank money|RTGS systems are cheaper per transaction|Batches can't legally carry large amounts}}
