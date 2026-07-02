---
title: "Payment Systems: The Shared Roads Money Travels On"
level: 200
category: Architecture
summary: "Banks don't pay each other one-to-one across private wires. They plug into shared systems — public roads for money — and the kind of road decides the speed, the cost, and the rules."
minutes: 8
updated: 2026-06-29
tags: [payment systems, RTGS, ACH, rails, scheme]
related: [103-payment-lifecycle, 102-clearing-and-settlement, 105-payment-participants]
earnedSkill: "Tell the major kinds of payment system apart by how and when they settle, and predict which one a given payment will travel on from its size, speed, and direction."
num: 201
status: published
---

> **The problem first.** Bob's bank and Sweety's bank need to exchange value, but they can't each build a private cable to every other bank on earth — that's millions of cables. So how do thousands of banks reach each other without wiring themselves together one pair at a time? They share a small number of public roads. Those roads are payment systems, and which one a payment takes changes almost everything about it.

In the Fundamentals you met the cast of a payment — payer, payee, their banks, the intermediaries — and the five stages every payment passes through. This article is about the **infrastructure underneath all of them**: the shared systems banks join so that any member can reach any other member. Think of them as the road network. Once you can name the main kinds of road, you can look at any payment and guess, correctly, how fast it will move and what it will cost.

## Why a shared system at all

Picture the alternative. If every bank had to settle directly with every other bank, each would need a relationship — and an account — with all the rest. The number of relationships explodes as banks are added; it simply doesn't scale.

A payment system fixes this with a single shared hub everyone connects to **once**. A member joins the system, agrees to its rules, and can then reach every other member through that one connection. The system becomes the common ground where the banks from [Payment Participants](#) actually meet.

## The two jobs every system does

Strip any payment system down and it does two things, the two halves you met in [Clearing vs. Settlement](#):

- **It clears** — it carries the instructions and works out who owes whom.
- **It settles** — it moves the real value, or records that it has moved, usually across accounts the members hold at a central bank.

What separates one kind of system from another is mostly **how and when** they do that second job. That single choice — settle each payment instantly, or batch them up and settle the net later — is the fault line that the whole family of systems divides along.

## The three roads you'll meet most

Almost every payment you'll study travels on one of three kinds of system.

### 1. Real-time gross settlement — the motorway for big money

A **real-time gross settlement** system (RTGS) settles each payment **one at a time, immediately, and for the full amount**. "Gross" means no batching — every payment moves on its own; "real-time" means the value changes hands within seconds. These systems are run by central banks and carry the largest, most urgent, most irreversible payments. They are expensive and final: once a payment settles here, it is done.

When Bob's bank and Sweety's bank finally square up the real money behind a large transfer, an RTGS is usually where it happens.

### 2. Deferred net settlement — the shared bus for everyday payments

A **deferred net settlement** system does the opposite. It collects many payments over a period — an hour, a day — and at the end works out only the **net** position between each pair of banks, then settles that single figure. Automated clearing houses (the systems behind salaries, direct debits, and routine transfers) work this way. They are cheap and efficient because thousands of payments collapse into a handful of net movements, but they are slower: the value settles in a batch, later.

Most of the quiet, high-volume payments in your life — payroll, bills — ride a netting system like this.

### 3. Instant payment systems — the new express lane

A third kind has grown up recently: **instant payment systems** that settle small payments individually, around the clock, in seconds. They borrow the immediacy of an RTGS but open it to everyday, lower-value payments, every day of the year. They are important enough to get their own article — [Real-Time Payments](#) — later in this level.

## Domestic roads and the cross-border problem

Each of these systems is usually **domestic** — built for one currency, inside one country's rules. That's fine while Bob and Sweety bank in the same country. The moment a payment crosses a border, no single system reaches both ends.

This is exactly where the intermediaries from [Payment Participants](#) come back. A cross-border payment is stitched together from *several* domestic systems, linked by correspondent banks that are members of more than one. The payment hops from one country's road network to the next, changing systems at each border. Understanding that a cross-border payment is really a *chain of domestic systems* explains why it is slower, costlier, and harder to trace than a payment that never leaves home.

## Schemes: the rules of the road

One last piece. A road is no use if everyone drives by different rules. Sitting on top of (or beside) each system is a **scheme** — the rule-book every member agrees to. The scheme defines the message formats, the timing windows, the obligations, and what counts as a valid payment. The system is the road; the scheme is the highway code.

This matters for everything that follows in the Library: the strict ISO 20022 message standards you'll study later exist *because* a scheme demands that every member's message means exactly the same thing. The road only works if the rules are shared.

## So, what can you now do?

You can look at any payment and place it on the right road: large and urgent settles gross and immediately; routine and high-volume nets and settles later; small and instant rides an always-on express lane; and anything crossing a border is really a chain of domestic systems joined by correspondents. You also know that every road comes with a rule-book — a scheme — and that those rules are why the messages later in this Library are so precise. That mental map of the infrastructure is the floor the rest of the Architecture level is built on.

{{check:What distinguishes an RTGS from an ACH?|RTGS settles each payment individually in real time; an ACH settles batches in cycles|RTGS is only for small retail payments|An ACH settles instantly; RTGS waits for end of day}}

{{check:Why do high-value payments usually ride an RTGS?|Finality — each payment settles irrevocably, one by one, in central bank money|RTGS systems are cheaper per transaction|Batches cannot legally carry large amounts}}
