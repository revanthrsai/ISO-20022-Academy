---
title: "Structured Addresses: The Field Where the Next Deadline Lives"
level: 600
num: 603
summary: "From November 2026, a cross-border payment whose addresses are just free-text lines stops being acceptable. One XML block, two permitted shapes, and a data-quality problem hiding in every bank's customer database."
minutes: 6
updated: 2026-07-03
tags: [structured address, pstladr, cbpr+, 2026 deadline, screening]
related: [301-pacs-008, 207-the-end-of-mt, 601-remittance-information]
earnedSkill: "Read a PstlAdr block on sight, tell a fully structured address from a hybrid one from a soon-to-be-rejected one, and explain why regulators care where your town name lives."
status: published
---

> **The problem first.** A sanctions screening system is checking a payment against a watchlist entry for an address in one country. The payment's address field says `24 KAREN ROAD FLAT 3B NAIROBI KENYA REF INV 22`. Is `KAREN` a street, a town, a person's name, or part of a reference someone jammed into the wrong line? A human can guess. The machine screening forty payments a second cannot, so it flags the payment, and a genuine invoice settlement sits in a compliance queue for two days. Multiply by an industry.

The address is the last great free-text swamp in payments. Names got identifiers, banks got BICs, accounts got IBANs, but the humble postal address spent fifty years as whatever a clerk typed into four lines of 35 characters. ISO 20022 was built to fix exactly this kind of ambiguity, and the field where it happens is **`PstlAdr`**, the Postal Address block, carried for every party and agent in the payment.

## What the structure looks like

Inside `PstlAdr`, every part of an address has a named home:

- **`StrtNm` / `BldgNb`**: street name and building number, each in its own element.
- **`PstCd`**: the postal code.
- **`TwnNm`**: the town or city, the element screening systems care about most.
- **`Ctry`**: the country, as a two-letter code that can never be confused with a word in the street name.
- **`AdrLine`**: the old world, a free-text line, still present in the schema for the long goodbye.

The intelligence isn't in any single element. It's in the fact that a machine reading `<TwnNm>Nairobi</TwnNm><Ctry>KE</Ctry>` knows, with zero guessing, which part is the town and which the country.

## The deadline: November 2026

The industry retired the MT language in November 2025; the next mandate is aimed at this block. From **November 2026**, CBPR+ stops accepting addresses made only of free-text `AdrLine` elements for in-scope parties and agents. From that point an address must arrive in one of two permitted shapes:

- **Fully structured.** Every component in its named element, and no `AdrLine` at all. The destination the industry is steering toward.
- **Hybrid.** The pragmatic middle: `TwnNm` and `Ctry` must be structured, and up to two `AdrLine` elements of 70 characters may carry the rest. Structure where screening needs it most; tolerance where legacy data is messiest.

The floor for both shapes is the same pair: **town and country, structured, always.** The scope covers the working messages you know (pacs.008, pacs.009, pacs.004, pacs.003) and the pain.001 flows that feed them, because an address that starts life unstructured in the instruction cannot become structured on its own downstream.

{{flow:Where an address is born and judged|Customer record ~ the address lives in a bank's database|-> pain.001|Debtor's bank ~ carries it into the instruction|-> pacs.008|Screening systems ~ parse TwnNm and Ctry at every hop|-> verdict|Compliance ~ clean pass or a two-day queue}}

## Why regulators forced the issue

Because screening quality is only as good as data quality. Global standards for payment transparency require the parties to a payment to be identifiable, and a free-text blob defeats the tools that do the identifying. Structured town and country turn "flag anything containing this word" into "flag this town in this country," which is the difference between hundreds of false positives a day and a handful. This mandate is less about tidy XML than about making the compliance machinery of the whole industry sharper and cheaper.

The uncomfortable part: with months to go, industry surveys still found roughly two-thirds of payment messages carrying unstructured addresses. The deadline is dated; the data mostly isn't ready.

## What breaks

- **The database, not the message.** The payment engine can emit perfect XML, but if the customer master stores addresses as three untyped lines captured in 1998, there is nothing structured to emit. The real project is data cleansing, not message formatting.
- **Country hiding in a line.** `AdrLine` says "SINGAPORE" while `Ctry` is absent or wrong. After the deadline, absent means rejected; wrong means screened against the wrong country's rules.
- **Structure faked, not made.** A lazy converter shovels the whole old blob into `StrtNm` to pass validation. The XML validates; the screening system now confidently parses garbage.
- **Corporates left behind.** Banks fix their own channels, but the pain.001 files from corporate customers keep arriving with blob addresses, and each one becomes a repair, a delay, or a rejection.

The phrase to keep: **the deadline is about databases wearing XML clothes.** A structured address is easy to write and hard to have.

{{embed:explorer:PACS.008|See PstlAdr in a live pacs.008}}
{{embed:article:207-the-end-of-mt|The previous deadline, and why this one follows it}}

{{check:What is the minimum that must be structured in every CBPR+ address from November 2026?|Town name and country|Street name and building number|The postal code}}
{{check:What distinguishes a hybrid address from a fully structured one?|Hybrid keeps up to two free-text AdrLine elements alongside structured town and country; fully structured has no AdrLine at all|Hybrid is only allowed for domestic payments|Hybrid addresses skip the country code}}
{{check:A converter stuffs an entire legacy address blob into StrtNm and the message validates. What's the problem?|Screening systems now parse wrong data with full confidence, defeating the purpose of the mandate|Nothing, validation passing means the address is fine|The message will be rejected by the schema}}
