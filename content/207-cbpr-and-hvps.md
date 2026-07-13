---
title: "CBPR+ and HVPS+: One Standard, Two Rulebooks"
level: 200
category: Architecture
num: 207
summary: "The same pacs.008 can be perfectly valid on one network and rejected on another. That's not a bug in ISO 20022. It's the gap between the standard and the rulebooks that govern how it's actually used."
minutes: 6
updated: 2026-07-13
tags: [cbpr+, hvps+, usage guidelines, rulebooks, market infrastructure]
related: [201-payment-systems, 201-business-application-header, 301-pacs-008]
earnedSkill: "Tell the standard apart from its usage guidelines, know when a payment follows CBPR+ and when it follows a market infrastructure's HVPS+ flavour, and explain why the same message validates differently on different rails."
status: published
---

> **The problem first.** An engineer builds a pacs.008 that passes every schema check in her test suite. She sends it into the local RTGS and it sails through. Two weeks later the identical construction, pointed at a correspondent across the border, bounces. Same message type, same fields, same standard.

By now you can read a pacs.008 and you know the header names a rulebook. This article is about a puzzle that trips up nearly everyone once, and it's cleaner to solve it than to be told the answer.

## How is one message both right and wrong?

{{think}}
Same message. Same fields. Passes the ISO schema. Green light on one network, rejected on the next. Nothing about the XML changed between the two sends.

If the standard says it's valid, how can a network say it isn't?
{{reveal}}
Because "valid ISO 20022" isn't the bar the network actually checks against. The published standard is deliberately *generous* — a pacs.008 has hundreds of optional elements so every community on earth can say what it needs. No real network wants all that generosity. So each community publishes a **usage guideline**: a narrowed-down version that says which fields *its* members must use, may use, and must not use.

Your message passed the base schema and then failed a *stricter* rulebook the second network enforces. Schema-valid and guideline-valid are two different tests.
{{/think}}

Two of those rulebooks matter more than all the rest combined: **CBPR+** and **HVPS+**.

## CBPR+: the rulebook for correspondent banking

**CBPR+** — *Cross-Border Payments and Reporting Plus* — is the usage guideline for payments travelling bank-to-bank over Swift, the many-to-many world where any of eleven thousand institutions might message any other. Every cross-border payment you've followed in this Library — Bob's dirhams becoming Sweety's rupees — lives under CBPR+.

A many-to-many network has a particular problem: nobody controls both ends. So CBPR+ has to be precise about things a closed club could leave loose — which settlement methods are allowed (`INDA`, `INGA`, and the `COVE` cover method), and exactly how agents, amounts, and addresses must be written so any receiver, anywhere, can process the message unseen.

## HVPS+: the template for the big domestic rails

**HVPS+** — *High Value Payment Systems Plus* — is the base guideline for **market infrastructures**: the central-bank-run RTGS systems from earlier in this level. The Eurosystem's T2, the UK's CHAPS, the US Fedwire and CHIPS, Singapore's MEPS+ and their peers all start from HVPS+ and tune it to local law.

{{think}}
A market infrastructure is *one-to-many*: one operator, a defined set of participants, one rule-setter. Correspondent banking is *many-to-many*: no shared operator, no shared book. Given only that difference, why can an RTGS use a `CLRG` settlement method that CBPR+ has no use for?
{{reveal}}
Because a clearing system settles on *its own books*. Every participant holds an account with the one operator, so "settle through the clearing system" (`CLRG`) is a meaningful instruction. Bank-to-bank across a border has no shared book to settle on, so it leans on `INDA`/`INGA` (settle across an account at an agent) or the `COVE` cover method instead. The rulebook can only offer what the network's shape makes real.
{{/think}}

{{flow:One payment, two rulebooks|Debtor's bank ~ builds a CBPR+ pacs.008 for the border crossing|-> Swift|Correspondent ~ converts to the local flavour|-> HVPS+ rules|Domestic RTGS ~ settles under its own guideline|-> camt confirmation|Creditor's bank ~ credits the customer}}

That flow implies something worth saying out loud: a single end-to-end payment can legitimately pass through *both* rulebooks. The cross-border leg obeys CBPR+; the final domestic leg obeys the local HVPS+ flavour. The correspondent in the middle isn't translating between languages — it's translating between dialects of the same one.

## How a message declares its rulebook

You've already met the mechanism. The Business Application Header carries a `BizSvc` (Business Service) element, and that's where a message says which service and rulebook it's travelling under. The receiver reads it off the envelope, before parsing anything, and knows which validation profile to apply. Same letter, different postal regulations, declared on the outside.

{{aside:model|The mental model}}
**The standard is the language; the rulebook is the accent.** A message is never just "valid ISO 20022." It's valid *under a guideline* — CBPR+ for cross-border over Swift, an HVPS+ flavour for a domestic RTGS. Which guideline applies is the first question of every integration, not the last.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Read `BizSvc` on the header (e.g. `swift.cbprplus.02`) to know which profile to validate against — and validate against the *usage guideline*, not just the raw schema. If you only test against the base ISO XSD, you'll pass messages the network will reject. The generosity of the standard is exactly the gap a rulebook exists to close.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Valid here, rejected there.** A field combination CBPR+ permits but the local RTGS forbids (or the reverse). Schema passes; *usage* validation fails. Testing against the raw ISO schema alone is the classic rookie mistake.
- **Settlement-method mismatch.** A `CLRG` arriving on a correspondent leg, or `COVE` pointed at a clearing system. Each is meaningful only inside its own rulebook.
- **Version drift.** The rulebooks are living documents on annual cycles. Validate against last year's CBPR+ and you'll reject messages that are perfectly correct this year.
- **Assuming the infrastructures are identical.** T2, CHAPS, and Fedwire all descend from HVPS+, but each diverges where local regulation demands. Configure for one, point at another, and it fails in quiet corner cases.
{{/aside}}

{{aside:map|The map}}
Rulebooks sit on top of the standard and the roads:

- Where the rulebook is declared → {{link:article:201-business-application-header|the Business Application Header}}.
- The message both rulebooks constrain → {{link:article:301-pacs-008|pacs.008, field by field}}.
- The roads the rulebooks govern → {{link:article:201-payment-systems|payment systems}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Base standard** = generous, hundreds of optional fields. **Usage guideline** = narrows it to must/may/must-not.
- **CBPR+** = cross-border, bank-to-bank over Swift (many-to-many). Methods: `INDA`, `INGA`, `COVE`.
- **HVPS+** = template for central-bank RTGS (one-to-many). Adds `CLRG` (settle on the system's own books).
- **One end-to-end payment can pass through both** — cross-border leg CBPR+, domestic leg HVPS+.
- **The rulebook is named on the envelope** (`BizSvc`). Validate against the guideline, not just the schema.
{{/aside}}

{{embed:article:201-business-application-header|Where BizSvc lives: the envelope that names the rulebook}}
{{embed:article:301-pacs-008|The message both rulebooks constrain: pacs.008 field by field}}

{{check:What is CBPR+?|The usage guideline for ISO 20022 in correspondent banking over Swift|A replacement message format for pacs.008|The central bank settlement system for Europe}}
{{check:Why do market infrastructures use the CLRG settlement method while CBPR+ does not?|A clearing system settles on its own books, an option that doesn't exist bank-to-bank|CLRG is newer and CBPR+ hasn't caught up|CLRG is only valid for direct debits}}
{{check:A pacs.008 passes ISO schema validation but is rejected by the receiving network. What most likely happened?|It violated the network's usage guideline, which is stricter than the base standard|The XML was malformed|Schema validation and network validation are the same, so this can't happen}}
