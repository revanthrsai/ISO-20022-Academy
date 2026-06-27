---
title: "The Business Application Header: The Envelope Around Every Message"
level: 200
category: Architecture
summary: "Before a bank reads what a message says, it reads the envelope: who sent it, who it's for, what's inside. That envelope is the BAH."
minutes: 8
updated: 2026-06-27
tags: [BAH, head.001, routing, namespaces]
related: [201-business-application-header, 301-pacs-008]
status: draft
earnedSkill: "Explain what the Business Application Header carries, why it's separate from the message body, and how it drives routing."
---

> **The problem first.** A `pacs.008` says *what* to do. But who is it from? Who should receive it? Which network rules apply? If all of that lived inside the payment, every routing system would have to parse the whole message just to forward it.

**This deep dive is being written.** It will open the **Business Application Header** (`head.001`) — the standard wrapper that rides in front of every ISO 20022 business message — and show how `Fr`, `To`, `BizMsgIdr`, and `MsgDefIdr` let networks route and validate a message *without reading its contents*.

In the meantime, the [pacs.008 deep dive](#) shows the body that this envelope wraps.
