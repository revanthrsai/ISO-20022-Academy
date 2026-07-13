---
title: "Nostro & Vostro: How Banks Hold Money for Each Other"
level: 100
category: Fundamentals
summary: "Before a single message format matters, money has to physically sit somewhere. This is the account trick that lets a bank in Dubai pay a bank in Bangalore without shipping any cash."
minutes: 7
updated: 2026-07-13
tags: [correspondent banking, accounts, settlement]
related: [105-payment-participants, 102-clearing-and-settlement, 301-pacs-008]
earnedSkill: "Explain why a cross-border payment needs a correspondent account, and tell a nostro from a vostro without hesitating — by asking whose books you're reading."
num: 106
status: published
---

> **The problem first.** Bob, in Dubai, wants to send $400 to Sweety in Bangalore. His bank has never met her bank. There's no pipe between them, no shared vault, no truck driving dollars across the Arabian Sea. So how does the money actually get there?

You already know money is numbers on ledgers and nothing physical really "travels." Fine. But those ledgers sit in different countries, run by banks that don't know each other. Let's work out how you'd bridge that gap yourself, because the answer is the whole of correspondent banking.

## You run a bank with no branch abroad

{{think}}
You run a bank in Dubai. A customer wants to pay someone in India, in rupees. You have no branch there. You can't walk up to a counter in Bangalore and hand over cash. And you're not allowed to ship money across the border.

So how do you make rupees land in an Indian account?
{{reveal}}
You do what a traveller does. You make a *local friend* — a bank in India that agrees to hold an account for you and make payments there on your behalf. You park some rupees with them ahead of time. When your customer wants to pay someone in India, you don't move anything across the border. You just tell your friend: *"pay this person out of the money I've already got with you."*

That local friend is a **correspondent bank**. Correspondent banking is just this one favour — hold my money, pay locally for me — formalised and repeated millions of times a day.
{{/think}}

## One account, two names

{{think}}
So your Dubai bank holds an account of rupees at that Indian bank. Here's the wrinkle: you call that account one thing, and the Indian bank hosting it calls it something else. But it's the *same* pot of money.

What could possibly decide which name is the "right" one?
{{reveal}}
Whose books you're reading. That's the entire trick.

- **Nostro** — Latin for *"ours."* The account **we** hold **at another bank**, in their local currency. From your Dubai bank's side: *"our money, sitting over there in India."*
- **Vostro** — Latin for *"yours."* The **same** account, seen by the bank hosting it. From the Indian bank's side: *"your money, that you've parked here with us."*

One pot. Your bank calls it *our nostro*. The Indian bank calls it *your vostro*. Never confuse them again with a single question: **whose books am I reading?** The account lives on the *host's* books — to the host it's a vostro, to the owner it's a nostro.
{{/think}}

## Walk Bob's $400 through it

Bob's bank keeps a nostro account in rupees at an Indian correspondent, topped up weeks ago. So when Bob taps "send":

1. Bob's bank debits Bob's account in Dubai. His dollars are now spoken for.
2. Bob's bank tells its Indian correspondent: *"pay Sweety ₹33,000 out of our nostro with you."*
3. The Indian correspondent moves the rupees locally to Sweety's bank — an ordinary domestic payment it makes all day.
4. Sweety's account is credited. She sees the money.

Look at what never happened: nothing crossed the border. Dollars stayed in Dubai. Rupees that were *already in India* took a short hop. The big scary "cross-border payment" was really a local payment, funded by money someone had the foresight to park in a nostro.

{{aside:model|The mental model}}
The line to keep: **a cross-border payment is a local payment funded by money pre-positioned in a nostro.** No cash crosses anything. And the "settlement" the whole system keeps talking about is just the moment one of these accounts gets debited and another credited.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Every cross-border ISO 20022 message — `pacs.008`, `pacs.009`, the cover payment — is ultimately an instruction *about these accounts*. The `DbtrAgt` and `CdtrAgt` you met in the last article are the banks that own and host the nostro/vostro. When a message carries settlement details, it's describing a move between exactly these accounts. Know the accounts and the message is just paperwork describing moves between them. Don't, and it reads like alphabet soup.
{{/aside}}

{{aside:breaks|Where it breaks}}
Three real catches, in plain terms:

- **Pre-funding costs money.** Cash sitting idle in a nostro earns almost nothing and ties up capital. Banks are forever balancing "enough to pay" against "not a penny more."
- **No friend, no corridor.** No correspondent in a country means no nostro means no easy way to pay there. That's exactly why some routes are slow or expensive — and when banks "de-risk" and close correspondent lines, whole regions can lose cheap access to payments.
- **The two views must match.** A nostro and a vostro are one account seen twice, so the two banks' records have to reconcile to the penny. Any gap between them is an error, by definition.
{{/aside}}

{{aside:map|The map}}
The accounts are where all the earlier ideas physically land:

- The banks that own and host these accounts → {{link:article:105-payment-participants|the participants}}.
- The settlement event that debits and credits them → {{link:article:102-clearing-and-settlement|clearing vs. settlement}}.
- The first real message that instructs a move between them → {{link:article:301-pacs-008|pacs.008, the bank-to-bank transfer}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Correspondent bank** = a bank abroad that holds an account for you and pays locally on your behalf.
- **Nostro** = "ours" — the account we hold at another bank. **Vostro** = "yours" — the same account, seen by the host.
- **The test:** whose books am I reading? Host's books → vostro. Owner's books → nostro.
- **A cross-border payment** = a local payment funded by money pre-positioned in a nostro. No cash crosses.
- **Settlement** = one of these accounts debited, the other credited.
{{/aside}}

{{embed:article:505-end-to-end-payment-flow|Walk the full Bob → Sweety journey}}

## So what can you do now?

You can explain why a cross-border payment needs no cash to cross any border, what a correspondent bank is for, and the one-line test for nostro vs vostro: *whose books am I reading?* That's the floor a huge amount of cross-border payments stands on — and the last piece of groundwork before the real messages start.

{{check:Your bank holds an account at a foreign bank to pay in that country. From your bank's point of view, that account is…|A nostro — our money, held with you|A vostro — your money, held with us|An escrow account held by the regulator}}

{{check:Why must nostro and vostro records always reconcile?|They're two views of the same account, so any difference means an error|Regulators require identical wording in both banks' statements|They're separate pools of money that must be kept equal in size}}
