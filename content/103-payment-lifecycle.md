---
title: "The Payment Lifecycle: What Happens Between Tap and Done"
level: 100
category: Fundamentals
summary: "A payment isn't one event — it's a short journey with named stages. Learn the stages once and you'll recognise them inside every message and every error."
minutes: 8
updated: 2026-06-28
tags: [lifecycle, initiation, clearing, settlement, reconciliation]
related: [102-what-is-a-payment, 104-clearing-and-settlement, 105-payment-participants]
earnedSkill: "Name the stages a payment passes through from initiation to reconciliation, and point to where things most often go wrong."
num: 103
status: published
---

> **The problem first.** Bob taps "send" and, after a pause, Sweety gets the money. That pause isn't dead time — a lot happens in it. If you can't name the steps inside the pause, every delayed or failed payment will feel like an unexplained black box.

A payment looks instant from the outside, but inside it's a relay race with distinct legs, each handed off to a different runner. The legs have names, they always happen in the same order, and **once you know them you can locate any problem** — a stuck payment, a rejected one, a missing one — by asking a single question: *which leg was it on when it stopped?*

## The five stages, once and for all

Almost every payment, simple or complex, domestic or cross-border, moves through these five stages in order:

1. **Initiation** — someone asks for the payment to happen.
2. **Validation** — the bank checks whether it *can and should* happen.
3. **Clearing** — the banks involved agree on exactly who owes whom, and how much.
4. **Settlement** — the real value actually moves, finally and irreversibly.
5. **Reconciliation** — everyone confirms their records match and the books are square.

Hold that list. Everything below is just a closer look at each leg, following Bob's $400 to Sweety.

{{flow:The relay, leg by leg|Initiation ~ Someone asks for the payment|Validation ~ The bank checks it can happen|Clearing ~ The banks agree who owes what|Settlement ~ The value actually moves|Reconciliation ~ Everyone's books agree}}

## 1. Initiation — the ask

This is the tap. Bob tells his bank, in effect, *"pay Sweety $400."* The instruction can come from a person on a phone, a company's payroll file, a card terminal, or another bank passing along a payment it received.

Initiation is purely a request. Nothing has moved, nothing is promised yet — Bob has simply put a well-formed instruction in front of his bank. (If you've read [What Is a Payment?](#), this is that instruction being born.)

## 2. Validation — the checks before anything moves

Before a bank acts on Bob's instruction, it asks a series of careful questions:

- **Does Bob actually have the money?** No funds, no payment.
- **Is the instruction complete and well-formed?** A missing reference or a malformed account number gets it bounced here.
- **Is this allowed?** Sanctions screening, fraud checks, and compliance rules all run at this stage.
- **Can it be routed?** Is there a path — a correspondent, a scheme — that reaches Sweety's bank?

Validation is where the **largest share of failures happens**, and where they're cheapest to catch. A payment rejected here never moved any money, so nothing has to be unwound. This is exactly why the message standards later in this academy are so strict about field formats: most of validation is a machine checking that the instruction says what it must, precisely.

## 3. Clearing — agreeing who owes what

If validation passes, the instruction is relayed toward Sweety's bank, and the banks involved work out the **obligation**: Bob's bank now owes value to Sweety's bank. Clearing is the matching, sorting, and agreeing step — confirming both sides have the same understanding of what's owed before any real money is committed.

Crucially, **clearing is not the money moving.** It's the agreement *about* the money. Two banks with thousands of payments a day may clear each one but settle them all together later. (The next article, [Clearing vs. Settlement](#), is entirely about this split.)

## 4. Settlement — the moment it's real

Settlement is when the agreed value **actually changes hands** between the banks — one bank's account is debited, the other's credited, usually across accounts held at a central bank or with each other. This is the irreversible moment. Before settlement, a payment can often still be stopped. After it, the money is genuinely gone from one side and arrived at the other.

For Bob and Sweety, settlement is the quiet back-office event where their two banks square up. Sweety may already *see* her money before this happens — banks often credit the customer on the strength of the agreement and settle between themselves afterward.

## 5. Reconciliation — checking the books match

Finally, each party compares its own records against what actually settled. *Did the money we expected arrive? Do our ledgers agree with theirs?* Reconciliation is the audit that closes the loop — catching anything that drifted, duplicated, or went missing, so that tomorrow everyone starts from a shared, trusted truth.

It's the least glamorous stage and the one that keeps the whole system honest.

## A map for every payment problem

The reason this lifecycle is worth memorising: **failures have addresses.** When a payment misbehaves, the stage tells you almost everything:

- Bounced instantly with an error? **Validation.**
- Accepted but "pending," not yet final? Sitting between **clearing and settlement.**
- Money left but never arrived, or arrived twice? A **settlement or reconciliation** problem.
- Needs to be undone after the fact? That's a whole separate world of *exception* messages — recalls, returns, reversals — which only exist *because* settlement is so hard to undo.

{{embed:article:505-end-to-end-payment-flow|Walk the full Bob → Sweety lifecycle, stage by stage}}

## So, what can you now do?

You can take any payment — instant or slow, local or cross-border — and place it on a five-stage map: **initiation, validation, clearing, settlement, reconciliation.** And you can do the thing experts do without thinking: when something goes wrong, ask *which stage?* before asking *why?* That instinct is what the rest of this academy sharpens.

{{check:Which order matches a payment’s life?|Initiation, then interbank clearing and settlement, then reporting|Reporting, then settlement, then initiation|Settlement first, then the customer’s instruction}}

{{check:Why do banks send status updates along the way?|So the sender knows whether the instruction was accepted, rejected, or still pending|To charge additional fees at each step|Because the funds cannot move without them}}
