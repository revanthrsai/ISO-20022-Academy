---
title: "Payment Participants: Who's Actually Involved When You Pay"
level: 100
category: Fundamentals
summary: "A simple payment hides a surprising cast of characters. Learn their roles once and the sender/receiver names inside every message stop being a riddle."
minutes: 7
updated: 2026-06-28
tags: [participants, debtor, creditor, agent, intermediary]
related: [102-what-is-a-payment, 102-clearing-and-settlement, 101-nostro-vostro]
earnedSkill: "Name the parties in a payment by their roles (payer, payee, their banks, any intermediaries, and the systems behind them) and map a real transfer onto that cast."
num: 105
status: published
---

> **The problem first.** Bob sends Sweety $400. It feels like a two-person event: Bob and Sweety. But the money passes through at least four organisations to get there, and each one has a precise name and a precise job. If you think it's just "sender and receiver," everything that moves the money will read like it's full of strangers.

A payment seems like a private affair between two people. Behind the scenes it's a small **relay team**, each member with a defined job and a defined name. The good news: the cast is short, the roles are logical, and once you can name them, the otherwise-cryptic party fields inside every payment message become obvious. This article introduces the players. Everything later just refers back to them.

## Start with the two people

At the ends of every payment are the two parties you'd expect:

- **The payer.** The one whose account the money leaves. In bank language, the **debtor** (because their account is *debited*).
- **The payee.** The one whose account the money arrives in. In bank language, the **creditor** (because their account is *credited*).

Bob is the debtor. Sweety is the creditor. That's it for the humans. But neither of them can move money directly, because neither of them runs a ledger. For that, each needs a bank acting on their behalf.

## The banks acting for them: "agents"

In payments, a bank acting on behalf of a customer is called an **agent**. The word is doing real work: the bank is the *agent* that carries out its customer's instruction.

- **The debtor agent.** The payer's bank. Bob's bank. It debits Bob and starts the payment moving.
- **The creditor agent.** The payee's bank. Sweety's bank. It receives the payment and credits Sweety.

So the basic cast is four: **debtor → debtor agent → creditor agent → creditor.** Bob, his bank, her bank, Sweety. Read that chain in either direction and you've described the spine of almost every payment ever made.

## The helpers in the middle: intermediaries

Often the debtor agent and creditor agent don't have a direct relationship, especially across borders. Bob's bank in Dubai may have never dealt with Sweety's bank in Bangalore. They need a mutual friend in between: an **intermediary agent** (or **correspondent bank**).

An intermediary is a bank that *both* sides trust and that sits in the path to pass the payment along, holding the accounts that the value actually moves through. A payment might hop through one intermediary, or two, or none if the banks deal directly. (Where the money physically rests as it passes through is the subject of [Nostro & Vostro](#).)

This is why a payment message has slots not just for "the two banks" but for a *chain* of agents: real payments routinely travel through more hands than the sender ever sees.

## The infrastructure behind them: systems and schemes

The agents don't shout instructions across the world freely. They move through shared **infrastructure** that almost no customer ever names but everyone relies on:

- **Clearing and settlement systems**: the central plumbing where obligations are agreed and value finally moves (the RTGS and netting systems from [Clearing vs. Settlement](#)).
- **Payment schemes**: the rule-books and networks the banks all agree to follow, so that a message Bob's bank sends means exactly the same thing when Sweety's bank reads it.

You can think of schemes as the *referees* and systems as the *field*: one sets the rules everyone plays by, the other is where the actual moves happen.

## The full cast, in one line

Put it all together and a single $400 transfer looks like this:

> **Bob** (debtor) → **Bob's bank** (debtor agent) → **an intermediary or two** (correspondents) → **Sweety's bank** (creditor agent) → **Sweety** (creditor), all moving across shared **clearing/settlement systems**, under the rules of a **scheme.**

Five named roles plus the infrastructure. That's the entire ensemble. No real-world payment, however complex, introduces a *kind* of participant beyond these. It just adds more of the same (more intermediaries, more systems).

## Why this is the key that unlocks the messages

Here is the payoff. When you open an ISO 20022 payment message later in this academy, it will be full of party blocks with names like *Debtor*, *Debtor Agent*, *Creditor Agent*, *Creditor*, *Intermediary Agent*. Those aren't new jargon. **They are exactly the cast you just met.** The message is simply a structured form with one labelled slot for each role on the relay team.

Learn the roles here, in plain language, and the messages stop being walls of unfamiliar fields. They become a roll-call of people and banks you already know.

## So, what can you now do?

You can take any payment and name everyone involved by their role: debtor and creditor, their two agents, any intermediaries between them, and the systems and scheme underneath. And you'll recognise those same roles the instant you open a real message, because the message is built out of exactly this cast. That recognition is the bridge from *fundamentals* to the *architecture* and *messages* that the rest of the Library is built on.

{{check:Who are the two end parties in a typical payment?|The debtor (payer) and the creditor (payee)|The two banks in the middle|The clearing house and the central bank}}

{{check:What role does an intermediary (correspondent) bank play?|It bridges two banks that have no direct relationship|It holds the payment until both end parties confirm|It sets the exchange rate for the whole market}}
