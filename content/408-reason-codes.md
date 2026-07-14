---
title: "Reason Codes: The Four Letters That Explain Every Failure"
level: 400
category: Exceptions
num: 408
summary: "AC04. AM04. RR04. When a payment fails, the explanation arrives as four letters from a shared external list. Learn how the codes are organised and a rejection stops being a mystery and becomes a diagnosis."
minutes: 6
updated: 2026-07-13
tags: [reason codes, ac04, am04, external code sets, rejections]
related: [407-the-r-transactions-map, 401-reject, 604-purpose-codes]
earnedSkill: "Read a reason code by its family prefix, look any code up in the external code set, and route a failed payment to the right fix (and the right team) from the code alone."
status: published
---

> **The problem first.** A rejection lands at 4:55 pm: a supplier payment, due today, bounced. The pacs.002 offers exactly one clue, four characters long: `AC04`. To the intern, it's a shrug in Morse code. To the analyst two desks over, it's a complete diagnosis: *account closed; no retry will fix this; call the supplier for new details; you'll make the cut-off if you move now.*

Same four letters, two completely different outcomes. The difference is knowing how to read them — so let's work out what four characters could possibly have to *be* to carry a whole diagnosis.

## Why not just write the reason?

{{think}}
A bank rejects a payment and needs to tell the sender *why*. But the rejecting bank might run on Portuguese, or on forty-year-old COBOL. The sender's system has to read the reason *identically*, and ideally act on it without a human.

Free text clearly won't do. So what does the rejecting bank send instead — and where does the actual *meaning* live?
{{reveal}}
It sends a **code** — but not an abbreviation. It's a set of *coordinates into a shared, published dictionary*. Every bank picks the one entry from an industry-wide list (on iso20022.org) that names the situation, and sends that entry's code. The receiver looks up the *same* list and reads the *same* meaning. No translation, no ambiguity.

So `AC04` isn't shorthand for "account closed" — it's the address of the "account closed" entry that everyone shares. Meaning lives in the list, not the letters.
{{/think}}

## Where the codes live, and how to read them

The list is one of the **external code sets** (the same machinery behind purpose codes): catalogues kept deliberately *outside* the message schemas, so codes can be added quarterly without changing any message. That placement is why a schema validator can tell you the field is *shaped* right but never whether the code is *correct* — meaning lives in the list, not the XSD.

And you never memorise hundreds of them. The first two letters name the family, and the family tells you where the problem lives:

- **`AC**` — account.** `AC01` incorrect number, `AC04` closed, `AC06` blocked. Fix lives with the *beneficiary's details*.
- **`AM**` — amount.** `AM04` insufficient funds, `AM05` duplicate. Fix lives with the *money or the instruction*.
- **`AG**` — agent.** `AG01` forbidden for this agent, `AG02` invalid operation. Fix lives in the *routing*.
- **`RR**` — regulatory.** `RR04` regulatory reason: compliance has questions. Fix lives with *documents and lawyers*, and won't be quick.
- **`MD**` — mandate.** `MD01` no mandate, `MD07` deceased debtor. Fix lives with the *authority to pull*.
- **`NARR` — narrative.** The escape hatch: free text. Sometimes necessary, and a smell when a proper code existed.

Two letters in, you already know which team owns the problem. That's triage at reading speed.

{{flow:From failure to fix|Something fails ~ receiver picks the one code that names it|-> four letters|pacs.002 / pacs.004 ~ carries the code back up the chain|-> lookup|Sender's system ~ reads the same external list|-> triage|AC to details · AM to funds · RR to compliance ~ routed without a human guessing}}

## Codes as automation, not just explanation

Because the codes are machine-readable and shared, the *response* can be automated. A smart engine maps codes to actions: `AC01` → repair the account number and resubmit; `AM04` → retry after the next funding cycle; `AC04` → don't retry, flag for new beneficiary details; `RR04` → open a case and attach documents. Teams that build this table turn thousands of monthly exceptions into a queue a few people can run; teams that don't read rejections one at a time, forever. The same codes ride every R-transaction from the last chapter: a return carries `RtrRsn`, a recall carries its cancellation reason (`DUPL`, `FRAD`, `CUST`), an answer carries its refusal reason. One vocabulary, spoken in every direction.

## The danger in "just retry it"

{{think}}
A team wires up auto-retry: any failed payment, try it again on the next cycle. Sounds efficient. On which reason codes does that quietly make things *worse* — and how badly?
{{reveal}}
Two kinds bite hard. `AC04` (account *closed*) will never succeed — blind retry turns it into an infinite loop of guaranteed failures. And `AM05` (*duplicate!*) is the standard warning you that this payment already exists — retrying it can *send the payment a third time*, turning a detection into a fresh incident.

The lesson: the action table must respect what each code *means*. Some codes are retryable, some are terminal, and at least one is actively telling you to stop. "Retry everything" ignores the diagnosis the code was carrying.
{{/think}}

{{aside:model|The mental model}}
**The code is the diagnosis; the list is the doctor.** Four letters are coordinates into a shared external dictionary — meaning lives in the list, not the abbreviation. Read the two-letter family prefix (`AC`/`AM`/`AG`/`RR`/`MD`) and you've triaged the failure before reading the rest.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Codes live in an *external code set* that evolves without schema changes — so cache the current list, don't hard-code a laminated 2019 cheat-sheet. Build a code → action table (repair / retry / stop / open-case) and respect terminal codes (`AC04`) and duplicate warnings (`AM05`). And if your gateway reformats messages, carry the reason code through — dropping it delivers a failure with no diagnosis.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **The lazy default.** Mapping every internal failure to one catch-all code (or `NARR` free text) is legal and useless — the counterparty's automation can't route it, so a human must.
- **Reading the code, skipping the list.** Codes get added and refined; a stale cheat-sheet misreads new ones.
- **Blind auto-retry.** `AC04` loops forever; `AM05` can send a third copy. Respect what each code means.
- **Losing the code in translation.** A gateway that drops the reason code delivers a failure with no diagnosis — the four letters *were* the payload.
{{/aside}}

{{aside:map|The map}}
The vocabulary the whole shelf speaks:

- The vehicles these codes ride → {{link:article:407-the-r-transactions-map|the R-transactions map}}.
- The cheapest failure they explain → {{link:article:401-reject|reject}}.
- The same machinery, pointed at success → {{link:article:604-purpose-codes|purpose codes}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Reason code** = coordinates into a shared external code set (on iso20022.org), not an abbreviation.
- **Outside the schema** so it can evolve quarterly — a validator checks shape, not correctness.
- **Family prefix triages:** `AC` account · `AM` amount · `AG` agent · `RR` regulatory · `MD` mandate · `NARR` free text.
- **Automate** with a code → action table; respect terminal (`AC04`) and duplicate (`AM05`) codes.
- **Rides every R-transaction:** `RtrRsn`, `CxlRsnInf`, refusal reasons — one vocabulary, all directions.
{{/aside}}

{{embed:article:407-the-r-transactions-map|The vehicles these codes ride: the R-transactions map}}
{{embed:article:604-purpose-codes|The same external-code machinery, pointed at success instead of failure}}

{{check:Why do reason codes live in an external code set instead of the message schema?|So the list can evolve without changing the messages that carry the codes|To keep the codes secret from customers|Because XML cannot contain codes}}
{{check:What does the family prefix of a code (AC, AM, RR...) tell you?|Where the problem lives and roughly which team owns the fix|The country the payment came from|How urgent the payment was}}
{{check:Why is blind auto-retry on every reason code dangerous?|Some codes mean the payment can never succeed (AC04) or is a duplicate (AM05), so retrying makes things worse|Retries are always forbidden by the standard|Because reason codes expire after one hour}}
