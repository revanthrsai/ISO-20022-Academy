---
title: "camt.056: Calling a Payment Back"
level: 400
category: Exceptions
summary: "Sometimes a payment is sent in error and has to be recalled. camt.056 is the polite, structured way one bank asks another to cancel."
minutes: 7
updated: 2026-06-27
tags: [camt.056, cancellation, recall, R-transactions]
related: [401-camt-056-cancellation, 301-pacs-008]
status: draft
earnedSkill: "Tell a cancellation request (camt.056) apart from a return (pacs.004), and know which one gets the money back."
---

> **The problem first.** Bob's bank just sent $400 — and then realised it was a duplicate. The money is already in flight. There's no "undo." So how do you *ask* the receiving bank to stop or reverse it, in a way it can act on automatically?

**This deep dive is being written.** It will cover **camt.056** (*FI to FI Payment Cancellation Request*) — the first of the **R-transactions** (recalls, returns, rejects) — and the crucial distinction every practitioner must know: a `camt.056` *requests* cancellation and may get nothing back, while a [pacs.004](#) actually *returns* settled funds.

This is where the happy path ends and real-world payment operations begin.
