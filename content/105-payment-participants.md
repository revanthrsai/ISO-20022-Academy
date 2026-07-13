---
title: "Payment Participants: Who's Actually Involved When You Pay"
level: 100
category: Fundamentals
summary: "A simple payment hides a surprising cast. Work out who they are once and the sender/receiver names inside every message stop being a riddle."
minutes: 7
updated: 2026-07-13
tags: [participants, debtor, creditor, agent, intermediary]
related: [102-what-is-a-payment, 102-clearing-and-settlement, 101-nostro-vostro]
earnedSkill: "Name every party in a payment by its role — payer, payee, their banks, any intermediaries, and the systems behind them — and map a real transfer onto that cast."
num: 105
status: published
---

> **The problem first.** Bob sends Sweety $400. It feels like a two-person thing: Bob and Sweety. But that money passes through at least four organisations to get there, and each one has a precise name and a precise job. Think it's just "sender and receiver" and every message that moves the money will read like it's full of strangers.

You already know a payment is an instruction that edits two ledgers. So here's the question that gives you the cast: whose ledgers, and who's allowed to edit them? Let's reason it out rather than memorise a list.

## Work out who has to be there

{{think}}
Bob's in Dubai. Sweety's in Bangalore. Bob wants his $400 to land in her account.

Here's the constraint: neither Bob nor Sweety runs a ledger. They can't debit or credit anything themselves. Given that, list everyone who *must* be involved for the money to actually move, and say what each one does.
{{reveal}}
Four, minimum:

- **Bob** — the one the money leaves. His account gets *debited*, so in bank language he's the **debtor**.
- **Bob's bank** — it holds Bob's ledger and acts on his instruction. It's the **debtor agent** (an "agent" is just a bank acting for a customer).
- **Sweety's bank** — it holds Sweety's ledger and credits her. The **creditor agent**.
- **Sweety** — the one the money arrives for. Her account is *credited*, so she's the **creditor**.

Read the chain in order: **debtor → debtor agent → creditor agent → creditor.** Bob, his bank, her bank, Sweety. That spine sits under almost every payment ever made.
{{/think}}

Those role names aren't jargon for its own sake. Debtor and creditor come straight from which side of the ledger moves: debited, credited. Agent just means "a bank carrying out its customer's instruction." Once the words earn their keep, they stop feeling like code.

## The missing link in the middle

{{think}}
There's a snag in that neat four-party chain. Bob's bank in Dubai has quite possibly never dealt with Sweety's bank in Bangalore. No account between them, no relationship, no direct pipe. So how does the payment actually cross the gap?
{{reveal}}
The same way you'd get money to a stranger in another city: through someone you *both* trust. A bank that sits in the path, has a relationship with both sides, and holds the accounts the value passes through. That's an **intermediary agent**, or **correspondent bank**.

A payment might hop through one intermediary, or two, or none if the banks deal directly. This is exactly why a payment message has slots for a whole *chain* of agents, not just two banks — real payments routinely pass through more hands than the sender ever sees. (Where the money physically rests as it passes through is {{link:article:101-nostro-vostro|nostro & vostro}}.)
{{/think}}

## The infrastructure nobody names

The agents don't just shout instructions across the world. They move through shared plumbing that almost no customer could name but everyone leans on:

- **Clearing and settlement systems** — the central machinery where obligations get agreed and value finally moves (the RTGS and netting systems from {{link:article:102-clearing-and-settlement|clearing vs. settlement}}).
- **Payment schemes** — the rule-books and networks all the banks agree to follow, so a message Bob's bank sends means exactly the same thing when Sweety's bank reads it.

Think of schemes as the referees and systems as the field. One sets the rules everyone plays by; the other is where the moves actually happen.

## The whole cast, in one line

Put it together and a single $400 transfer looks like this:

> **Bob** (debtor) → **Bob's bank** (debtor agent) → **an intermediary or two** (correspondents) → **Sweety's bank** (creditor agent) → **Sweety** (creditor), all moving across shared **clearing/settlement systems**, under the rules of a **scheme.**

Five named roles plus the infrastructure. That's the entire ensemble. No real payment, however hairy, invents a new *kind* of participant beyond these — it just adds more of the same. More intermediaries, more systems.

{{aside:model|The mental model}}
Here's the payoff you're building toward: **a payment message is just a form with one labelled slot per role.** Debtor here, debtor agent there, creditor agent, creditor, intermediary agent. Learn the cast in plain language now and the "walls of fields" later are only a roll-call of people and banks you already know.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Open a `pacs.008` and the party blocks read `Dbtr`, `DbtrAgt`, `CdtrAgt`, `Cdtr`, and `IntrmyAgt1`. That's not new vocabulary — it's the exact cast you just derived, abbreviated. Each block is one slot on the relay team. The moment you can look at `DbtrAgt` and think "payer's bank" without pausing, the message stops being cryptic.
{{/aside}}

{{aside:breaks|Where it breaks}}
Mix up the roles and you misroute real money. The classic slip is swapping debtor agent and creditor agent — put the payer's bank where the payee's bank belongs and the payment heads back the way it came, or stalls. The other one that bites: dropping an intermediary the payment actually needed, so a message that should have chained through a correspondent has nowhere to go. The roles are precise because the routing depends on them being right.
{{/aside}}

{{aside:map|The map}}
This cast is the bridge from fundamentals into the real messages:

- What the cast is actually *doing* — moving an instruction → {{link:article:102-what-is-a-payment|what a payment is}}.
- Where the intermediaries hold the money → {{link:article:101-nostro-vostro|nostro & vostro}}.
- The systems the agents settle across → {{link:article:102-clearing-and-settlement|clearing vs. settlement}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Debtor** = payer (account debited). **Creditor** = payee (account credited).
- **Agent** = a bank acting for a customer. **Debtor agent** = payer's bank; **creditor agent** = payee's bank.
- **Intermediary / correspondent** = a bank both sides trust, sitting in the path when there's no direct link.
- **The spine:** debtor → debtor agent → (intermediaries) → creditor agent → creditor.
- **Underneath it all:** clearing/settlement systems (the field) + schemes (the referees).
{{/aside}}

## So what can you do now?

You can take any payment and name everyone in it by role: debtor and creditor, their two agents, any intermediaries between, and the systems and scheme underneath. And you'll spot those same roles the instant you open a real message, because the message is built out of exactly this cast. That recognition is the bridge from *fundamentals* to the *architecture* and *messages* the rest of the Library is built on.

{{check:Who are the two end parties in a typical payment?|The debtor (payer) and the creditor (payee)|The two banks in the middle|The clearing house and the central bank}}

{{check:What does an intermediary (correspondent) bank do?|It bridges two banks that have no direct relationship|It holds the payment until both end parties confirm|It sets the exchange rate for the whole market}}
