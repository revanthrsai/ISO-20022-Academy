---
title: "Cross-border Payment: When the Two Banks Have Never Met"
level: 500
category: Case Studies
summary: "Bob in Dubai pays Sweety in Bangalore. Their banks have no account with each other and don't even share a currency. Watch correspondent banks, a cover payment, and an FX conversion stretch the simple transfer across borders without losing the thread."
minutes: 10
updated: 2026-07-13
tags: [case-study, cross-border, correspondent, pacs.008, pacs.009, cover-payment, FX]
related: [501-customer-transfer, 302-pacs-family, 101-nostro-vostro, 312-pacs-009-cover]
earnedSkill: "Walk a cross-border payment through correspondent banks, explain why intermediaries appear, tell the customer leg (pacs.008) from the cover leg (pacs.009 COV), see where FX happens, and follow the shared UETR that keeps it readable across banks that have never met."
num: 503
status: published
---

> **Dirhams out, rupees in.** Bob is in Dubai with dirhams; Sweety is in Bangalore expecting rupees. Their two banks have never dealt with each other — no shared account, no direct line, not even the same currency. In the domestic transfer both banks plugged into one rail and were done in seconds. Here, the rail runs out at the border.

This is the customer transfer again — pain instructs, pacs settles, camt reports — with the hard part of international banking dropped in the middle: the two end banks have *no relationship*. Everything new here exists to bridge that gap, and you can reason out each piece.

## How do you pay a bank you've never met?

{{think}}
Bob's bank in Dubai holds no account with Sweety's bank in Bangalore. A bank can only pay another bank it holds an account *with* (a nostro/vostro relationship). The domestic rail that connected them last time doesn't reach across the border.

So how does the money get from one to the other?
{{reveal}}
Through banks they *both* deal with. Bob's bank and Sweety's bank each hold accounts with larger banks that hold accounts with *each other* — **correspondents**. Chain those links and money can travel between any two banks on earth, even ones that have never met:

> Bob's bank (Dubai) → a correspondent bridging AED and the international network → Sweety's bank (Bangalore)

Each link is a pair of banks that genuinely hold money for each other. The chain *is* the route.
{{/think}}

## Why the payment splits into two messages

{{think}}
Now the subtle part. When banks route serially through correspondents, the payment travels as *two parallel messages*, not one. Why would you separate the payment's *information* from its *funds* — and what stops the two from drifting apart?
{{reveal}}
Because the information needs to reach Sweety's bank *directly and fast* (so it knows who to credit and why), while the actual money settles *between the correspondents* that hold accounts for each other. So:

- **Customer leg — pacs.008.** The credit-transfer *information* (debtor, creditor, amount, references, remittance) passes toward Sweety's bank.
- **Cover leg — pacs.009 COV.** The *funds* settle between the correspondents; the COV variant carries the underlying customer details so the cover can be matched to the payment it funds.

Two messages, one payment. What stops them drifting apart is the **shared `UETR`** on both legs. Lose it and the cover can't be matched to the customer payment.
{{/think}}

Somewhere along the chain, dirhams become rupees. **FX** happens at the bank holding both currencies (usually a correspondent, sometimes Sweety's bank), and the message records it explicitly: the *instructed amount* (what Bob sent, AED), the *exchange rate*, and the *settlement amount* (what arrives, INR). Charges get deducted somewhere too, recorded in the charge information so everyone sees who paid the cost of the crossing.

## The flow, end to end

1. **pain.001** — Bob instructs his bank, in dirhams, ref `BOB-INV0042`, beneficiary Sweety in India.
2. **pain.002** — accepted. Bob's tick.
3. **pacs.008** — the customer leg sets off toward Sweety's bank *through the correspondent chain*, stamped with a `UETR`; each correspondent passes the information along.
4. **pacs.009 COV** — in parallel, the correspondents settle the actual funds between the accounts they hold for each other, carrying the same `UETR`; FX is applied at the bank holding both currencies.
5. **pacs.002** — confirmation travels back up the chain: settled.
6. **camt.054** — Sweety's bank credits the rupee amount and notifies her, carrying `BOB-INV0042`, so despite the currency change and the chain of strangers she still matches Invoice 0042.
7. **camt.053** — the books close on both sides at end of day.

{{embed:explorer:PACS.009|Open the pacs.009 cover payment}}
{{embed:article:312-pacs-009-cover|The cover leg, field by field: pacs.009 up close}}

The shape is identical to the domestic transfer; three things were added to cross the border — a **chain of correspondents** (the end banks have no direct link), the **funds split from the information** (pacs.008 + pacs.009 COV, reconciled by a shared `UETR`), and **FX and charges** entering the message. And still the thread held: the `EndToEndId` Bob typed in Dubai surfaced in Sweety's notification in Bangalore, unchanged across borders, currencies, and a chain of banks that had never met. That is the whole point of a globally-shared reference — a payment can be handed between strangers and stay, end to end, one payment.

{{aside:model|The mental model}}
**Cross-border = the domestic transfer plus a correspondent chain.** The end banks have no relationship, so the payment splits: a `pacs.008` customer leg (the information) and a `pacs.009 COV` cover leg (the funds), reconciled by a **shared `UETR`**. FX and charges enter the message; the `EndToEndId` survives the whole crossing.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Two routing methods exist: *serial* (one pacs.008 hand-to-hand) and *cover* (pacs.008 direct + pacs.009 COV behind), and only the shared `UETR` links the cover to the customer leg — reconcile on it. FX shows up as three fields (instructed amount, rate, settlement amount); charges are recorded so `SHAR`/`DEBT`/`CRED` is auditable. (Our Playground engine transforms the pacs.008 customer leg today; the pacs.009 cover leg is a natural next mapping.)
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Losing the shared `UETR`.** Then the cover funds and the customer payment can't be matched — money with no story, straight to an investigation.
- **Assuming one message.** Serial-vs-cover matters: the funds and the information may travel as two legs, not one.
- **Truncating names across the chain.** A clipped name trips sanctions screening on the wrong party at some correspondent — the classic cross-border reject.
{{/aside}}

{{aside:map|The map}}
A border on top of the base case:

- The single-rail version → {{link:article:501-customer-transfer|customer transfer}}.
- Where the money rests between banks → {{link:article:101-nostro-vostro|nostro & vostro}}.
- The cover leg field by field → {{link:article:312-pacs-009-cover|pacs.009 & cover}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Cross-border** = domestic transfer + a chain of **correspondents** (the end banks hold no shared account).
- **Two legs:** `pacs.008` (customer info) + `pacs.009 COV` (funds), reconciled by a **shared `UETR`**.
- **FX** at the bank holding both currencies: instructed amount → rate → settlement amount.
- **Charges** recorded (who bore the cost of the crossing).
- **`EndToEndId` survives** borders and currencies — still one traceable payment.
{{/aside}}

{{embed:playground|Inspect the cross-border legs in the Playground}}

## So what can you do now?

You can walk a cross-border payment through correspondent banks, explain why intermediaries appear, tell the customer leg (pacs.008) from the cover leg (pacs.009 COV), see where FX turns one currency into another, and follow the shared `UETR` that reconciles the two legs. You can see that cross-border is the domestic transfer plus a chain, and that the `EndToEndId` survives the whole crossing, keeping it one payment from Dubai to Bangalore.

{{check:Why do cross-border payments often pass through correspondent banks?|The sender's and receiver's banks may hold no direct relationship or shared currency accounts|International law requires at least three banks|To deliberately slow payments down for security}}

{{check:What lets a cross-border payment be tracked across every hop?|A globally unique end-to-end reference that every bank preserves|A paper trail posted between the banks|The exchange-rate stamp on the funds}}
