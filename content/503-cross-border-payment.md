---
title: "Cross-border Payment: When the Two Banks Have Never Met"
level: 500
category: Case Studies
summary: "Bob in Dubai pays Sweety in Bangalore. Their banks have no account with each other and don't even share a currency. Watch how correspondent banks, a cover payment, and an FX conversion stretch the simple transfer across borders without losing the thread."
minutes: 10
updated: 2026-06-29
tags: [case-study, cross-border, correspondent, pacs.008, pacs.009, cover-payment, FX]
related: [503-cross-border-payment, 501-customer-transfer, 302-pacs-family, 101-nostro-vostro]
earnedSkill: "Walk a cross-border payment through correspondent banks, explaining why intermediaries appear, the difference between the customer leg (pacs.008) and the cover leg (pacs.009 COV), where FX happens, and how the same UETR keeps a payment readable across a chain of banks that have never met."
num: 503
status: published
---

> **Dirhams out, rupees in.** Bob is in Dubai with dirhams; Sweety is in Bangalore expecting rupees. Their two banks have never dealt with each other: no shared account, no direct line, not even the same currency. In the domestic transfer, both banks plugged into one rail and were done in seconds. Here, the rail runs out at the border. So how does Bob's money cross from a bank in the UAE to a bank in India, get turned into rupees on the way, and still arrive as the *same* payment Sweety can match to Invoice 0042?

This is the customer transfer again (pain instructs, pacs settles, camt reports) but with the hard part of international banking dropped into the middle: the two banks at the ends have **no relationship**. Everything new in this case study exists to bridge that gap.

## Why intermediaries appear

A bank can only pay another bank it holds an account *with* (a nostro/vostro relationship). Bob's bank in Dubai doesn't hold an account with Sweety's bank in Bangalore. But both hold accounts with larger banks that *do* deal with each other. Those in-between banks are **correspondents**, and the route through them is the **payment chain**:

> Bob's bank (Dubai) → a correspondent that bridges AED and the international network → Sweety's bank (Bangalore)

Each link in the chain is a pair of banks that genuinely hold money for each other. String enough links together and money can travel between any two banks on earth, even ones that have never met.

## The two legs: customer and cover

Here's the idea that separates cross-border from domestic. When banks route serially through correspondents, the payment travels as **two parallel messages**, not one:

- **The customer leg, pacs.008.** The credit-transfer *information* (debtor, creditor, amount, references, remittance) passes hop by hop toward Sweety's bank so it knows who's being paid and why.
- **The cover leg, pacs.009 COV.** The *actual funds* are settled separately between the correspondents that hold accounts for each other. The COV variant carries the underlying customer details so the cover can be matched to the customer payment it's funding.

Two messages, one payment. The pacs.008 tells Sweety's bank *what* to credit and to *whom*; the pacs.009 COV makes sure the money is really there behind it. The single thread that lets the receiving bank reconcile the two is the **shared `UETR`** carried on both legs. Lose it and the cover can't be matched to the customer payment.

## Where the rupees come from

Somewhere along that chain, dirhams become rupees. **FX conversion** happens at the bank in the chain that holds both currencies, usually a correspondent, sometimes Sweety's bank itself. The message records it explicitly: the *instructed amount* (what Bob sent, in AED), the *exchange rate*, and the *settlement amount* (what arrives, in INR). Charges get deducted somewhere too, recorded in the charge information so everyone can see who paid the cost of the crossing.

## The flow, end to end

1. **pain.001: Bob instructs his bank**, in dirhams, reference `BOB-INV0042`, beneficiary Sweety in India. *(Family: pain.)*
2. **pain.002: accepted.** Bob sees a tick. *(Family: pain.)*
3. **pacs.008: the customer leg sets off.** Bob's bank sends the credit transfer toward Sweety's bank *through the correspondent chain*, stamped with a `UETR`. Each correspondent passes the information along. *(Family: pacs.)*
4. **pacs.009 COV: the cover leg.** In parallel, the correspondents settle the actual funds between the accounts they hold for each other, carrying the same `UETR`. FX is applied at the bank holding both currencies. *(Family: pacs.)*
5. **pacs.002: confirmation** travels back up the chain: settled. *(Family: pacs.)*
6. **camt.054: Sweety is notified.** Her bank credits the rupee amount and fires a notification carrying `BOB-INV0042`, so despite the currency change and the chain of strangers, she still matches it to Invoice 0042. *(Family: camt.)*
7. **camt.053: the books close** on both sides at end of day. *(Family: camt.)*

{{embed:explorer:PACS.009|Open the pacs.009 cover payment}}

## What changed from a single transfer

The shape is identical to the domestic customer transfer. Three things were added to cross the border:

- **A chain of correspondents** replaced the single shared rail, because the end banks have no direct relationship.
- **The funds split from the information**: a pacs.008 customer leg alongside a pacs.009 COV cover leg, reconciled by a shared `UETR`.
- **FX and charges entered the message**: instructed amount, rate, settlement amount, and who bore the cost.

And still, the thread held. The `EndToEndId` `BOB-INV0042` that Bob typed in Dubai surfaced in Sweety's notification in Bangalore, unchanged across borders, currencies, and a chain of banks that had never met. That is the whole point of a globally-shared reference standard: a payment can be handed between strangers and stay, from end to end, one payment.

{{embed:playground|Inspect the cross-border legs in the Playground}}

## So, what can you now do?

You can walk a cross-border payment through correspondent banks, explaining why intermediaries appear (the end banks hold no account with each other), how the customer leg (pacs.008) carries the information while the cover leg (pacs.009 COV) settles the funds, where FX turns one currency into another, and how the shared `UETR` lets the receiving bank reconcile the two legs. You can see that cross-border is the domestic transfer plus a chain, and that the `EndToEndId` survives the whole crossing, keeping it one traceable payment from Dubai to Bangalore.

{{check:Why do cross-border payments often pass through correspondent banks?|The sender’s and receiver’s banks may hold no direct relationship or shared currency accounts|International law requires at least three banks|To deliberately slow payments down for security}}

{{check:What lets a cross-border payment be tracked across every hop?|A globally unique end-to-end reference that every bank preserves|A paper trail posted between the banks|The exchange-rate stamp on the funds}}
