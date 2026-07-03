---
title: "The End of MT: The Weekend the Old Language Retired"
level: 200
num: 207
summary: "On 22 November 2025, after a two-decade goodbye, the MT payment messages stopped being accepted for cross-border payments. What actually changed that weekend, what didn't, and why 'the migration is done' is only half true."
minutes: 5
updated: 2026-07-03
tags: [mt, mx, migration, coexistence, swift, deadline]
related: [206-cbpr-and-hvps, 301-pacs-008, 303-camt-family]
earnedSkill: "Say precisely what ended in November 2025 and what didn't, map the retired MT messages to their ISO 20022 successors, and explain why translation-at-the-edge means the migration isn't truly finished inside many banks."
status: published
---

> **The problem first.** For fifty years, a bank that typed `MT103` into the Swift network knew the whole world could read it. Then the industry announced that its own universal language would be switched off, while trillions of dollars a day kept flowing through it. You cannot close a motorway to rebuild it. So how do you retire the format underneath the world's money without stopping the world's money, and what actually happened on the weekend it finally ended?

Slowly, then all at once. The **MT** messages (the fixed-format telegrams you met in the History chapters) were always going to be replaced by ISO 20022's richer MX messages. The standard was published in 2004. The industry then spent two decades preparing, and three years in an awkward but necessary arrangement called **coexistence**: from March 2023, both languages were legal on the cross-border network at the same time, and every receiver had to cope with either.

Coexistence was the bridge, and bridges are meant to be crossed. On **22 November 2025**, it ended.

## What actually ended

Precision matters here, because "MT is dead" is a headline, not a fact. What ended in November 2025 was the acceptance of the **in-scope payment and cash-management MT messages** for cross-border payments under CBPR+: the MT 1xx customer payments, the MT 2xx bank-to-bank transfers, and the MT 9xx cash messages. The workhorses mapped to successors you already know:

- **MT103 → pacs.008.** The customer credit transfer, the single most travelled message on earth.
- **MT202 / MT205 → pacs.009.** Banks moving their own money, including the cover flavour.
- **MT940 / MT950 → camt.053.** The end-of-day statement.
- **MT900 / MT910 → camt.054.** The debit and credit advices.

What did *not* end: MT messages outside the payments scope (other business areas keep their own timelines), some reporting flows whose coexistence was deliberately extended, and everything happening *inside* banks, which is where the second half of this story lives.

{{flow:Two decades in one line|2004 ~ ISO 20022 published, the successor exists|-> 19 years|March 2023 ~ coexistence begins, both languages legal|-> 32 months|November 2025 ~ MT retired for cross-border payments|-> next|November 2026 ~ structured addresses become mandatory}}

## Why it took twenty years

Because nobody controls the whole network. A single bank could convert in a season; eleven thousand institutions in two hundred countries, each with layers of decades-old internal systems, cannot. Every bank had to be able to *receive* the new language before anyone could safely be forced to *send* it. That is what coexistence bought: three years where the cautious could translate while the ambitious went native.

And that word, native, is the honest test of whether the migration is really over.

## Done on the wire, not done in the basement

Here is what the headlines miss. November 2025 ended MT **between** banks. Inside many banks, core systems still think in MT, wrapped in translators that convert at the network's edge: MX in, MT internally, MX out again.

Translation keeps you compliant, but it quietly costs you the whole point of the new language. A pacs.008 can carry structured remittance data, longer names, richer references. Squeeze it through an MT-shaped internal pipe and the extra meaning has nowhere to go: the classic **truncation** problem from the remittance chapter, now happening inside a single institution. The industry calls the real finish line becoming **ISO-native**: systems that store and process the rich data end to end, not just speak it at the door.

## What breaks

- **The edge translator drops the riches.** Structured remittance and full-length names survive the network hop, then get clipped by an internal MT-era database column. The message was compliant; the data still died.
- **A stray MT after the deadline.** Legacy schedulers and contingency playbooks that still emit retired MT types now produce rejections instead of payments.
- **Half-mapped fields.** MT-to-MX mappings done field-by-field without business review, so a field that had three meanings in MT lands in the wrong one of three ISO elements.
- **Assuming the story is over.** The next mandate is already dated: from **November 2026**, unstructured addresses stop being acceptable in CBPR+ messages. Banks that treated November 2025 as the finish line meet the next deadline unprepared.

The phrase to keep: **the network moved; now the basements have to.** The weekend the old language retired was the end of the beginning, not the end.

{{embed:article:206-cbpr-and-hvps|The rulebook that governed the retirement: CBPR+}}
{{embed:article:601-remittance-information|What truncation destroys: the payment's own paperwork}}

{{check:What exactly ended on 22 November 2025?|Acceptance of in-scope MT payment and cash messages for cross-border payments|All use of MT messages anywhere, including inside banks|The ISO 20022 standard itself, replaced by a newer version}}
{{check:Which ISO 20022 message replaced the MT103?|pacs.008|camt.053|pain.002}}
{{check:A bank translates MX to MT at its network edge and back again. What does it lose?|The rich structured data that MT fields are too small to hold|Its Swift connection|Nothing, translation is lossless by design}}
