---
title: "Nostro & Vostro: How Banks Hold Money for Each Other"
level: 100
category: Fundamentals
summary: "Before a single message format matters, money has to physically sit somewhere. This is the account trick that lets a bank in Dubai pay a bank in Bangalore without shipping cash."
minutes: 7
updated: 2026-06-27
tags: [correspondent banking, accounts, settlement]
related: [101-nostro-vostro, 301-pacs-008]
earnedSkill: "Explain why a cross-border payment needs a correspondent account, and tell a nostro from a vostro without thinking twice."
num: 106
status: published
---

> **The problem first.** Bob, in Dubai, wants to send $400 to Sweety in Bangalore. His bank has never met her bank. There is no pipe between them, no shared vault, no truck driving dollars across the Arabian Sea. So how does the money actually get there?

It doesn't — not the way you'd think. **No physical money crosses the border at all.** What moves is a *promise*, and that promise only works because the two banks already keep money parked with each other, ahead of time, in named accounts. Those accounts have two old Latin names: **nostro** and **vostro**. Learn what they are and most of cross-border payments stops being mysterious.

## Start with the awkward truth

Banks don't have branches in every country. Bob's bank in Dubai cannot walk up to a counter in India and hand over rupees. So banks do what travellers do: they keep a little money with a *local friend* who can.

That "local friend" is called a **correspondent bank** — a bank in another country that agrees to hold an account for you and make local payments on your behalf.

The whole of correspondent banking is just this favour, formalised and repeated millions of times a day.

## Nostro and vostro are the same account, named from two sides

Here's the part that trips everyone up. A nostro and a vostro are not two different accounts. They are often the *same* account, described by whichever bank is talking.

- **Nostro** — Latin for *"ours"*. The account **we** hold **at another bank**, usually in that bank's local currency. From Bob's bank's point of view: *"our money, sitting over there in India."*
- **Vostro** — Latin for *"yours"*. The **same** account, seen by the bank that hosts it. From the Indian bank's point of view: *"your money, that you've parked here with us."*

It's one pot of money. Bob's bank calls it *our nostro*. Sweety's bank calls it *your vostro*. The trick to never confusing them: **whose books are you reading?** The account always lives on the *host* bank's books — to the host it is a vostro; to the owner it is a nostro.

## Walk Bob's $400 through it

Bob's bank keeps a **nostro account in rupees** at an Indian correspondent. It topped that account up weeks ago. So when Bob taps "send":

1. Bob's bank debits Bob's account in Dubai (his dollars are now spoken for).
2. Bob's bank instructs its Indian correspondent: *"Pay Sweety ₹33,000 out of our nostro with you."*
3. The Indian correspondent moves the rupees locally to Sweety's bank — a domestic payment it makes every day.
4. Sweety's account is credited. She sees the money.

Notice what never happened: **nothing crossed the border.** Dollars stayed in Dubai. Rupees that were *already in India* moved a short hop. The cross-border "payment" was really a local payment funded by money pre-positioned in a nostro.

## Why this matters before you touch a single message

Every ISO 20022 payment message you will ever read — the `pacs.008`, the `pacs.009`, the cover payment — is ultimately an *instruction about these accounts*. The "Debtor Agent" and "Creditor Agent" you'll meet later are just the banks that own and host the nostro/vostro. The "settlement" the messages keep talking about is the moment one of these accounts is debited and another credited.

If you understand the accounts, the messages are just paperwork describing moves between them. If you don't, the messages feel like alphabet soup.

{{embed:article:505-end-to-end-payment-flow|Walk the full Bob → Sweety journey}}

## The catches, in plain terms

- **Pre-funding costs money.** Cash sitting idle in a nostro earns little and ties up capital. Banks constantly balance "enough to pay" against "not a penny more."
- **You can't pay where you have no friend.** No correspondent in a country means no nostro means no easy way to pay there — which is exactly why some corridors are slow or expensive.
- **Trust is the real asset.** Holding each other's money requires due diligence, sanctions checks, and a relationship. When a bank "de-risks" and closes correspondent lines, whole regions can lose cheap access to payments.

## So, what can you now do?

You can explain — to a colleague or an interviewer — why a cross-border payment needs no physical cash to cross any border, what a correspondent bank is for, and the one-line test for nostro vs vostro: *whose books am I reading?* That single idea is the floor everything else in this academy is built on.

{{check:Your bank holds an account at a foreign bank to pay in that country. From your bank’s point of view, that account is…|A nostro — our money, held with you|A vostro — your money, held with us|An escrow account held by the regulator}}

{{check:Why must nostro and vostro records always reconcile?|They are two views of the same account, so any difference means an error|Regulators require identical wording in both banks’ statements|They are separate pools of money that must be kept equal in size}}
