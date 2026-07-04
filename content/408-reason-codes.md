---
title: "Reason Codes: The Four Letters That Explain Every Failure"
level: 400
num: 408
summary: "AC04. AM04. RR04. When a payment fails, the explanation arrives as four letters from a shared external list. Learn how the codes are organized and a rejection stops being a mystery and becomes a diagnosis."
minutes: 6
updated: 2026-07-04
tags: [reason codes, ac04, am04, external code sets, rejections]
related: [407-the-r-transactions-map, 401-reject, 604-purpose-codes]
earnedSkill: "Read a reason code by its family prefix, look any code up in the external code set, and route a failed payment to the right fix (and the right team) from the code alone."
status: published
---

> **The problem first.** A rejection lands at 4:55 pm: a supplier payment, due today, bounced. The pacs.002 offers exactly one clue, four characters long: `AC04`. To the intern, it's a shrug in Morse code. To the analyst two desks over, it's a complete diagnosis: *account closed; no retry will fix this; call the supplier for new details; you'll make the cut-off if you move now.* Same four letters. The difference is knowing how to read them. What are these codes, and why can four characters carry a whole diagnosis?

Because they're not abbreviations; they're **coordinates into a shared dictionary**. When any bank in the world rejects, returns, or refuses a payment, it doesn't write a sentence in its own words (its words might be Portuguese, or COBOL). It picks the one entry from a published, industry-wide list that names the situation, and sends the entry's code. The receiver looks up the same list and reads the same meaning. No translation, no ambiguity, no phone call, in the happy case.

## Where the codes live

The list is one of the **external code sets** you met with purpose codes: catalogues published on iso20022.org, deliberately kept *outside* the message schemas so codes can be added quarterly without changing any message. The same governance that lets `SALA` mean salary everywhere lets `AC04` mean *account closed* everywhere, in every pacs.002, pacs.004, and camt.056 that quotes it.

That placement (in the code set, not the schema) is why a schema validator can't tell you whether a reason code is *right*, only whether the field is shaped correctly. Meaning lives in the list.

## Reading a code: the family prefix

You will never memorize hundreds of codes, and you don't need to. The first two letters name the family, and the family tells you where the problem lives:

- **`AC**`, account.** Something about the account itself: `AC01` incorrect number, `AC04` closed, `AC06` blocked. Fix lives with the *beneficiary's details*.
- **`AM**`, amount.** `AM04` insufficient funds, `AM05` duplicate. Fix lives with the *money or the instruction*.
- **`AG**`, agent.** The banks in the chain: `AG01` transaction forbidden for this agent, `AG02` invalid operation code. Fix lives in the *routing*.
- **`RR**`, regulatory.** `RR04` regulatory reason: compliance has questions, or the corridor demands data that's missing. Fix lives with *documents and lawyers*, and it will not be quick.
- **`MD**`, mandate.** The direct-debit family: `MD01` no mandate, `MD07` deceased debtor. Fix lives with the *authority to pull*.
- **`NARR`, narrative.** The escape hatch: "explanation in free text." Necessary sometimes, and a smell when a proper code existed.

Two letters in, you already know which team owns the problem. That is triage at reading speed.

{{flow:From failure to fix|Something fails ~ receiver picks the one code that names it|-> four letters|pacs.002 / pacs.004 ~ carries the code back up the chain|-> lookup|Sender's system ~ reads the same external list|-> triage|AC to details · AM to funds · RR to compliance ~ routed without a human guessing}}

## Codes as automation, not just explanation

Here is why this matters beyond tidy vocabulary. Because the codes are machine-readable and shared, the *response* can be automated. A smart payment engine maps codes to actions: `AC01` → repair the account number and resubmit; `AM04` → retry after the next funding cycle; `AC04` → don't retry, flag for new beneficiary details; `RR04` → open a case and attach documents. Ops teams that build this table turn thousands of monthly exceptions into a queue a small team can run. Ops teams that don't, read rejections one at a time, forever.

The same codes also ride the R-transactions you mapped in the last chapter: a return carries its reason (`RtrRsn`), a recall carries its cancellation reason (`DUPL`, `FRAD`, `CUST`), an answer carries its refusal reason. One vocabulary, spoken in every direction.

## What breaks

- **The lazy default.** A system that maps every internal failure to one catch-all code (or to `NARR` free text) is legal and useless: the counterparty's automation can't route it, so a human must, defeating the entire design.
- **Reading the code, skipping the list.** Codes get added and refined; a team working from a stale cheat-sheet misreads new codes or misses better ones. The published list is the truth, not the laminated card from 2019.
- **Treating all codes as retryable.** Blind auto-retry turns `AC04` (closed; will never work) into a loop of guaranteed failures, and can turn `AM05` (duplicate!) into *sending the payment a third time*. The action table must respect what each code means.
- **Losing the code in translation.** A gateway that converts formats but drops the reason code delivers a failure with no diagnosis: the four letters were the payload.

The phrase to keep: **the code is the diagnosis; the list is the doctor.** Four letters, one shared dictionary, and a failed payment arrives already explaining how to fix itself.

{{embed:article:407-the-r-transactions-map|The vehicles these codes ride: the R-transactions map}}
{{embed:article:604-purpose-codes|The same external-code machinery, pointed at success instead of failure}}

{{check:Why do reason codes live in an external code set instead of the message schema?|So the list can evolve without changing the messages that carry the codes|To keep the codes secret from customers|Because XML cannot contain codes}}
{{check:What does the family prefix of a code (AC, AM, RR...) tell you?|Where the problem lives and roughly which team owns the fix|The country the payment came from|How urgent the payment was}}
{{check:Why is blind auto-retry on every reason code dangerous?|Some codes mean the payment can never succeed (AC04) or is a duplicate (AM05), so retrying makes things worse|Retries are always forbidden by the standard|Because reason codes expire after one hour}}
