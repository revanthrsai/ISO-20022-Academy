---
title: "CBPR+ and HVPS+: One Standard, Two Rulebooks"
level: 200
num: 206
summary: "The same pacs.008 can be perfectly valid on one network and rejected on another. That's not a bug in ISO 20022. It's the difference between the standard and the rulebooks that govern how it's actually used."
minutes: 5
updated: 2026-07-03
tags: [cbpr+, hvps+, usage guidelines, rulebooks, market infrastructure]
related: [201-payment-systems, 201-business-application-header, 301-pacs-008]
earnedSkill: "Tell the standard apart from its usage guidelines, know when a payment follows CBPR+ and when it follows a market infrastructure's HVPS+ flavour, and explain why the same message can validate differently on different rails."
status: published
---

> **The problem first.** An operations engineer builds a pacs.008 that passes every schema check in her test suite. She sends it into the local RTGS system and it sails through. Two weeks later the identical construction, pointed at a correspondent across the border, bounces. Same message type, same fields, same standard. How can one message be right and wrong at the same time?

Because ISO 20022 is a *language*, and languages get spoken with house rules. The published standard is deliberately generous: a pacs.008 has hundreds of optional elements so that every community on earth can express what it needs. No real network wants all of that generosity. So each community publishes a **usage guideline**: a narrowed-down version of the message that says which fields *its* members must use, which they may use, and which are forbidden.

Two of those rulebooks matter more than all the others combined: **CBPR+** and **HVPS+**.

## CBPR+: the rulebook for correspondent banking

**CBPR+** stands for *Cross-Border Payments and Reporting Plus*. It is the usage guideline for payments that travel bank-to-bank over Swift, the many-to-many world where any of eleven thousand institutions might message any other. Every cross-border payment you've followed in this Library (Bob's dirhams becoming Sweety's rupees) lives under CBPR+ rules.

A many-to-many network has a particular problem: nobody controls both ends. So CBPR+ has to be precise about things a closed club could leave loose, like which settlement methods are allowed (`INDA`, `INGA`, and the `COVE` cover method you met in the cross-border case study) and exactly how agents, amounts, and addresses must be expressed so that any receiver, anywhere, can process the message unseen.

## HVPS+: the rulebook template for the big domestic rails

**HVPS+** stands for *High Value Payment Systems Plus*. It is the base guideline for **market infrastructures**: the central-bank-run RTGS systems from the Architecture level. The Eurosystem's T2, the UK's CHAPS, the US Fedwire and CHIPS, Singapore's MEPS+ and their peers all start from HVPS+ and then tune it to local law and practice.

A market infrastructure is one-to-many: one operator, a defined set of participants, one rule-setter. That changes what the rulebook can demand. A clearing system settles on its own books, so HVPS+ flavours use the `CLRG` settlement method that CBPR+ has no use for. Each infrastructure then publishes its own final specification, which is why T2's guideline and CHAPS's guideline are cousins rather than twins.

{{flow:One payment, two rulebooks|Debtor's bank ~ builds a CBPR+ pacs.008 for the border crossing|-> Swift|Correspondent ~ converts to the local flavour|-> HVPS+ rules|Domestic RTGS ~ settles under its own guideline|-> camt confirmation|Creditor's bank ~ credits the customer}}

Notice what that flow implies: a single end-to-end payment can legitimately pass through **both** rulebooks. The cross-border leg obeys CBPR+; the final domestic leg obeys the local HVPS+ flavour. The correspondent in the middle is translating not between languages but between dialects of the same one.

## How a message declares its rulebook

You've already met the mechanism. The **Business Application Header** carries a `BizSvc` (Business Service) element, and that is where a message says which service and rulebook it is travelling under. The receiver reads it on the envelope, before parsing anything, and knows which validation profile to apply. Same letter, different postal regulations, declared on the outside.

## What breaks

- **Valid here, rejected there.** A field combination that CBPR+ permits but the local RTGS forbids (or the reverse). The schema passes; the *usage* validation fails. Testing against the raw ISO schema alone is the classic rookie mistake.
- **The settlement method mismatch.** A `CLRG` settlement method arriving on a correspondent leg, or `COVE` pointed at a clearing system. Each is meaningful only inside its own rulebook.
- **Version drift.** The rulebooks are living documents with annual maintenance cycles. A bank validating against last year's CBPR+ guideline can reject messages that are perfectly correct this year.
- **Assuming the infrastructures are identical.** T2, CHAPS, and Fedwire all descend from HVPS+, but each diverges where local regulation demands. A payment engine configured for one and pointed at another fails in quiet, corner-case ways.

The phrase to keep: **the standard is the language; the rulebook is the accent.** A message is never just "valid ISO 20022." It is valid *under a guideline*, and knowing which guideline applies is the first question of every integration.

{{embed:article:201-business-application-header|Where BizSvc lives: the envelope that names the rulebook}}
{{embed:article:301-pacs-008|The message both rulebooks constrain: pacs.008 field by field}}

{{check:What is CBPR+?|The usage guideline for ISO 20022 in correspondent banking over Swift|A replacement message format for pacs.008|The central bank settlement system for Europe}}
{{check:Why do market infrastructures use the CLRG settlement method while CBPR+ does not?|A clearing system settles on its own books, an option that doesn't exist bank-to-bank|CLRG is newer and CBPR+ hasn't caught up|CLRG is only valid for direct debits}}
{{check:A pacs.008 passes ISO schema validation but is rejected by the receiving network. What most likely happened?|It violated the network's usage guideline, which is stricter than the base standard|The XML was malformed|Schema validation and network validation are the same, so this can't happen}}
