---
title: "Structured Addresses: The Field Where the Next Deadline Lives"
level: 600
category: Field Guides
num: 603
summary: "From November 2026, a cross-border payment whose addresses are just free-text lines stops being acceptable. One XML block, two permitted shapes, and a data-quality problem hiding in every bank's customer database."
minutes: 6
updated: 2026-07-13
tags: [structured address, pstladr, cbpr+, 2026 deadline, screening]
related: [301-pacs-008, 208-the-end-of-mt, 601-remittance-information]
earnedSkill: "Read a PstlAdr block on sight, tell a fully structured address from a hybrid from a soon-to-be-rejected one, and explain why regulators care where your town name lives."
status: published
---

> **The problem first.** A sanctions screening system is checking a payment against a watchlist. The address field says `24 KAREN ROAD FLAT 3B NAIROBI KENYA REF INV 22`. Is `KAREN` a street, a town, a person's name, or a reference someone jammed into the wrong line? A human can guess. The machine screening forty payments a second cannot — so it flags a genuine invoice settlement, and it sits in a compliance queue for two days. Multiply by an industry.

The address is the last great free-text swamp in payments. Names got identifiers, banks got BICs, accounts got IBANs — but the humble postal address spent fifty years as whatever a clerk typed into four lines. The field where ISO 20022 fixes it is **`PstlAdr`**, and you can reason out the fix from that screening machine's problem.

## What does the machine actually need?

{{think}}
The screening system can't tell which word in `NAIROBI KENYA` is the town and which the country, or whether `KAREN` is a street or a name. So it over-flags and good payments queue.

What single change to how the address is *stored* removes the guessing — and which parts of an address matter most to that machine?
{{reveal}}
Give every part of the address its own **named element**: `StrtNm` (street), `BldgNb` (building number), `PstCd` (postcode), `TwnNm` (town), `Ctry` (country, as a two-letter code that can never be mistaken for a word in the street). Now a machine reading `<TwnNm>Nairobi</TwnNm><Ctry>KE</Ctry>` knows, with zero guessing, which part is the town and which the country.

The intelligence isn't in any single element — it's that the meaning is *labelled*. And the two labels screening cares about most are **town and country**: they turn "flag anything containing this word" into "flag this town in this country."
{{/think}}

## The deadline: November 2026

The industry retired the MT language in November 2025; the next mandate targets this block. From **November 2026**, CBPR+ stops accepting addresses made only of free-text `AdrLine` elements for in-scope parties and agents. An address must then arrive in one of two shapes: **fully structured** (every component in its named element, no `AdrLine` at all — the destination the industry is steering toward) or **hybrid** (the pragmatic middle: `TwnNm` and `Ctry` must be structured, and up to two `AdrLine` elements of 70 characters may carry the rest). The floor for both is the same pair: **town and country, structured, always.** Scope covers the working messages (pacs.008/009/004/003) and the pain.001 flows that feed them — because an address that starts life unstructured in the instruction can't become structured on its own downstream.

{{flow:Where an address is born and judged|Customer record ~ the address lives in a bank's database|-> pain.001|Debtor's bank ~ carries it into the instruction|-> pacs.008|Screening systems ~ parse TwnNm and Ctry at every hop|-> verdict|Compliance ~ clean pass or a two-day queue}}

Why did regulators force it? Because screening quality is only as good as data quality. Global transparency standards require the parties to a payment to be identifiable, and a free-text blob defeats the tools that identify them. Structured town and country are the difference between hundreds of false positives a day and a handful — less about tidy XML than about making the whole industry's compliance machinery sharper and cheaper.

## Why isn't everyone ready?

{{think}}
A bank's payment engine can emit flawless structured XML. Yet with months to the deadline, industry surveys still found roughly two-thirds of messages carrying unstructured addresses. If the message format supports structure, why is the data still a blob — and what does that tell you the real project is?
{{reveal}}
Because the message can only emit what the **customer database** holds. If the customer master stores addresses as three untyped lines captured in 1998, there is *nothing structured to emit* — the engine faithfully outputs the blob it was given.

So the deadline isn't really a message-formatting task; it's a **data-cleansing** project across millions of stored customer records. The XML is easy. Having the structured data behind it is the hard, unglamorous part — the deadline is about databases wearing XML clothes.
{{/think}}

{{aside:model|The mental model}}
**The Nov 2026 deadline is about databases, not messages.** The floor is always *town + country, structured*. An address must arrive **fully structured** (no `AdrLine`) or **hybrid** (`TwnNm` + `Ctry` structured, plus ≤2 free-text lines). A structured address is easy to write and hard to *have* — the data has to exist upstream.
{{/aside}}

{{aside:chair|From the engineer's chair}}
`PstlAdr` elements: `StrtNm`, `BldgNb`, `PstCd`, `TwnNm`, `Ctry` (2-letter), with `AdrLine` as the legacy free-text escape. In scope: pacs.008/009/004/003 and the pain.001 that feeds them — fix the *instruction*, because an unstructured address can't self-structure downstream. And validate that `Ctry` is a real ISO country code, not a word hiding in a line.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **The database, not the message.** Perfect XML over a 1998 blob emits a blob. The real work is data cleansing.
- **Country hiding in a line.** `AdrLine` says "SINGAPORE" but `Ctry` is absent or wrong. After the deadline, absent = rejected; wrong = screened against the wrong rules.
- **Structure faked, not made.** A converter shovels the whole blob into `StrtNm` to pass validation — now screening confidently parses garbage.
- **Corporates left behind.** Banks fix their own channels, but corporate `pain.001` files keep arriving with blob addresses — each a repair, a delay, or a rejection.
{{/aside}}

{{aside:map|The map}}
The field with a deadline:

- Where it rides → {{link:article:301-pacs-008|pacs.008}}.
- The previous deadline this follows → {{link:article:208-the-end-of-mt|the end of MT}}.
- Its sibling structured-data field → {{link:article:601-remittance-information|remittance information}}.
{{/aside}}

{{aside:ref|Reference card}}
- **`PstlAdr`** gives every address part a named element: `StrtNm`, `BldgNb`, `PstCd`, `TwnNm`, `Ctry`.
- **Nov 2026 (CBPR+):** free-text-only addresses stop being accepted for in-scope parties/agents.
- **Two shapes:** fully structured (no `AdrLine`) or hybrid (`TwnNm`+`Ctry` structured + ≤2 lines).
- **Floor, always:** town + country, structured — the parts screening needs.
- **The real project is data cleansing** upstream, not message formatting.
{{/aside}}

{{embed:explorer:PACS.008|See PstlAdr in a live pacs.008}}
{{embed:article:208-the-end-of-mt|The previous deadline, and why this one follows it}}

{{check:What is the minimum that must be structured in every CBPR+ address from November 2026?|Town name and country|Street name and building number|The postal code}}
{{check:What distinguishes a hybrid address from a fully structured one?|Hybrid keeps up to two free-text AdrLine elements alongside structured town and country; fully structured has no AdrLine at all|Hybrid is only allowed for domestic payments|Hybrid addresses skip the country code}}
{{check:A converter stuffs an entire legacy address blob into StrtNm and the message validates. What's the problem?|Screening systems now parse wrong data with full confidence, defeating the purpose of the mandate|Nothing, validation passing means the address is fine|The message will be rejected by the schema}}
