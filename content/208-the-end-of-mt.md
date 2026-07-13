---
title: "The End of MT: The Weekend the Old Language Retired"
level: 200
category: Architecture
num: 208
summary: "On 22 November 2025, after a two-decade goodbye, the MT payment messages stopped being accepted for cross-border payments. What changed that weekend, what didn't, and why 'the migration is done' is only half true."
minutes: 6
updated: 2026-07-13
tags: [mt, mx, migration, coexistence, swift, deadline]
related: [207-cbpr-and-hvps, 301-pacs-008, 303-camt-family]
earnedSkill: "Say precisely what ended in November 2025 and what didn't, map the retired MT messages to their ISO 20022 successors, and explain why translation-at-the-edge means the migration isn't truly finished inside many banks."
status: published
---

> **The problem first.** For fifty years, a bank that typed `MT103` into the Swift network knew the whole world could read it. Then the industry announced it would switch off its own universal language — while trillions of dollars a day kept flowing through it. You can't close a motorway to rebuild it.

You met MT in the History chapters and MX everywhere since. This article is about the handover between them — and it opens with a genuinely hard engineering problem worth chewing on before we tell you how it was solved.

## Retire the language without stopping the money

{{think}}
Trillions of dollars a day move over MT messages. You have to retire MT and move everyone to ISO 20022's MX. But you cannot pause the payments to do it, and you don't control the eleven thousand banks involved — each on its own timeline, each with decades of old internal systems.

If you just pick a date and flip everyone at once, what breaks? So what do you do instead?
{{reveal}}
Flip everyone at once and any bank not ready to *read* MX on that morning simply stops receiving payments. Catastrophe. The only safe order is: make sure everyone can *receive* the new language before you force anyone to *send* it.

So you build a bridge called **coexistence**. From March 2023, both languages were legal on the cross-border network at the same time, and every receiver had to cope with either. The cautious translated; the ambitious went native. Then, once receiving was universal, you end the bridge. That end came on **22 November 2025.**
{{/think}}

## What actually ended

Precision matters, because "MT is dead" is a headline, not a fact. What ended was acceptance of the **in-scope payment and cash-management MT messages** for cross-border payments under CBPR+ — the MT 1xx customer payments, MT 2xx bank-to-bank transfers, and MT 9xx cash messages. The workhorses mapped to successors you already know:

- **MT103 → pacs.008** — the customer credit transfer, the single most travelled message on earth.
- **MT202 / MT205 → pacs.009** — banks moving their own money, including the cover flavour.
- **MT940 / MT950 → camt.053** — the end-of-day statement.
- **MT900 / MT910 → camt.054** — the debit and credit advices.

What did *not* end: MT messages outside the payments scope, some reporting flows whose coexistence was deliberately extended, and everything happening *inside* banks — which is where the second half of this story lives.

{{flow:Two decades in one line|2004 ~ ISO 20022 published, the successor exists|-> 19 years|March 2023 ~ coexistence begins, both languages legal|-> 32 months|November 2025 ~ MT retired for cross-border payments|-> next|November 2026 ~ structured addresses become mandatory}}

## Done on the wire, not done in the basement

{{think}}
A bank proudly reports it's compliant: MX comes in off the network, MX goes out. Green ticks everywhere. But peek inside and its core systems still think in MT — there's a translator at the edge doing MX in, MT internally, MX out again.

It passes every external test. So what has it quietly thrown away?
{{reveal}}
The whole point of the new language. A pacs.008 can carry structured remittance data, longer names, richer references. Squeeze it through an MT-shaped internal pipe and the extra meaning has nowhere to go — the classic **truncation** problem, now happening inside a single institution. The message was compliant on the wire; the data still died in the basement.

The real finish line is becoming **ISO-native**: storing and processing the rich data end to end, not just speaking it at the door. Translation keeps you legal. It doesn't make you done.
{{/think}}

Why did the whole thing take twenty years? Because nobody controls the whole network. One bank could convert in a season; eleven thousand institutions across two hundred countries, each layered with decades-old systems, cannot. Coexistence bought the three years where everyone got ready to receive.

{{aside:model|The mental model}}
**The network moved; now the basements have to.** November 2025 ended MT *between* banks. It said nothing about the MT-shaped databases *inside* them. Compliant-on-the-wire and ISO-native are two different milestones, and the gap between them is where the value of the migration is quietly won or lost.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Edge translation is exactly the MX↔MT mapping you can run in the Playground — and running it shows you the loss directly: a rich pacs.008 collapsed into an MT103's fixed fields drops structured remittance and clips long names, because the MT field simply isn't big enough. That's not a bug in the mapping; it's the shape of MT. It's why "translate at the edge forever" is a debt, not a destination.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **The edge translator drops the riches.** Structured remittance and full-length names survive the network hop, then get clipped by an internal MT-era column. Compliant message, dead data.
- **A stray MT after the deadline.** Legacy schedulers and contingency playbooks still emitting retired MT types now produce rejections instead of payments.
- **Half-mapped fields.** MT→MX mappings done field-by-field with no business review, so a field that had three meanings in MT lands in the wrong one of three ISO elements.
- **Assuming the story is over.** The next mandate is already dated: from **November 2026**, unstructured addresses stop being acceptable in CBPR+. Treating 2025 as the finish line means meeting 2026 unprepared.
{{/aside}}

{{aside:map|The map}}
The retirement is one milestone on a longer road:

- The rulebook that governed it → {{link:article:207-cbpr-and-hvps|CBPR+ and HVPS+}}.
- The successor to the MT103 → {{link:article:301-pacs-008|pacs.008}}.
- What truncation destroys → {{link:article:601-remittance-information|remittance information}}.
{{/aside}}

{{aside:ref|Reference card}}
- **22 Nov 2025** = end of acceptance of in-scope MT payment/cash messages for *cross-border* under CBPR+.
- **Coexistence** (Mar 2023 → Nov 2025) = both languages legal, so everyone could receive MX before being forced to send it.
- **Mappings:** MT103 → pacs.008 · MT202/205 → pacs.009 · MT940/950 → camt.053 · MT900/910 → camt.054.
- **ISO-native ≠ compliant.** Translating at the edge keeps you legal but truncates the rich data internally.
- **Next deadline:** Nov 2026, structured addresses become mandatory.
{{/aside}}

{{embed:article:207-cbpr-and-hvps|The rulebook that governed the retirement: CBPR+}}
{{embed:article:601-remittance-information|What truncation destroys: the payment's own paperwork}}

{{check:What exactly ended on 22 November 2025?|Acceptance of in-scope MT payment and cash messages for cross-border payments|All use of MT messages anywhere, including inside banks|The ISO 20022 standard itself, replaced by a newer version}}
{{check:Which ISO 20022 message replaced the MT103?|pacs.008|camt.053|pain.002}}
{{check:A bank translates MX to MT at its network edge and back again. What does it lose?|The rich structured data that MT fields are too small to hold|Its Swift connection|Nothing, translation is lossless by design}}
