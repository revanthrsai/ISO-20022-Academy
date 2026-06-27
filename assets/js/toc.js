// ===========================================================================
// toc.js  —  The Academy Table of Contents (article registry)
// ===========================================================================
//
// WHAT THIS IS
//   The index of every long-form article in /content. This is the Markdown
//   architecture's answer to the old hardcoded lists: articles live as .md
//   files; this file just orders and describes them so the Learn index can be
//   built WITHOUT fetching every article up front.
//
// HOW IT RELATES TO data.js (Hybrid model — see ACADEMY_BLUEPRINT_PLAN.md)
//   data.js still powers the *interactive* surfaces (Playground, Message
//   Explorer, Glossary, Journey). toc.js + /content power *reading* — the
//   long-form articles. An article can hand off to an interactive surface via
//   an {{embed:...}} token (handled in markdown.js).
//
// THE NUMBERING (university-style difficulty × domain)
//   100  Fundamentals  — banking concepts, money movement, clearing,
//                         correspondent banking. No XML yet.
//   200  Architecture  — the ISO 20022 standard itself: the Business
//                         Application Header, namespaces, structure.
//   300  Message Deep Dives — the happy-path messages, field by field
//                         (pain.001, pacs.008, camt.054, …).
//   400  Exceptions    — R-transactions: cancellations (camt.056),
//                         returns (pacs.004), routing failures.
//
// ADDING AN ARTICLE
//   1. Drop  content/<num>-<slug>.md  with a YAML frontmatter block.
//   2. Add one entry below. `id` MUST equal the filename without .md.
//   The listing metadata here should mirror the file's frontmatter; the file
//   is the source of truth once an article is opened.
// ---------------------------------------------------------------------------

const ACADEMY_LEVELS = {
    100: {
        name: 'Fundamentals',
        tag: '100 · Fundamentals',
        blurb: 'How money actually moves — value, trust, clearing, settlement, correspondent banking. No XML yet.'
    },
    200: {
        name: 'Architecture',
        tag: '200 · Architecture',
        blurb: 'The ISO 20022 standard itself — the Business Application Header, XML namespaces, and message structure.'
    },
    300: {
        name: 'Message Deep Dives',
        tag: '300 · Message Deep Dives',
        blurb: 'The happy-path messages, opened field by field — pain.001, pacs.008, camt.054, and friends.'
    },
    400: {
        name: 'Exceptions',
        tag: '400 · Exceptions',
        blurb: 'R-transactions — cancellations, returns, and the routing failures behind a payment that goes wrong.'
    }
};

// Each entry: { id, num, level, file, title, summary, minutes, tags, status }
//   status: 'published' (default) | 'draft' (a stub that still opens)
const ACADEMY_TOC = [
    {
        id: '101-nostro-vostro',
        num: 101, level: 100,
        file: '101-nostro-vostro.md',
        title: 'Nostro & Vostro: How Banks Hold Money for Each Other',
        summary: "The account trick that lets a bank in Dubai pay a bank in Bangalore without shipping any cash across the border.",
        minutes: 7,
        tags: ['correspondent banking', 'accounts', 'settlement'],
        status: 'published'
    },
    {
        id: '102-clearing-and-settlement',
        num: 102, level: 100,
        file: '102-clearing-and-settlement.md',
        title: 'Clearing vs. Settlement: The Two Halves of a Payment',
        summary: "Two words everyone uses interchangeably — and the difference is where most payment confusion lives.",
        minutes: 6,
        tags: ['clearing', 'settlement', 'RTGS'],
        status: 'draft'
    },
    {
        id: '201-business-application-header',
        num: 201, level: 200,
        file: '201-business-application-header.md',
        title: 'The Business Application Header: The Envelope Around Every Message',
        summary: "Before a bank reads what a message says, it reads the envelope — who sent it, who it's for, what's inside.",
        minutes: 8,
        tags: ['BAH', 'head.001', 'routing'],
        status: 'draft'
    },
    {
        id: '301-pacs-008',
        num: 301, level: 300,
        file: '301-pacs-008.md',
        title: 'pacs.008: The Message That Actually Moves the Money',
        summary: "The interbank workhorse, opened field by field — then edit a live one in the Playground.",
        minutes: 11,
        tags: ['pacs.008', 'credit transfer', 'CBPR+'],
        status: 'published'
    },
    {
        id: '302-pain-001',
        num: 302, level: 300,
        file: '302-pain-001.md',
        title: 'pain.001: The Instruction That Starts It All',
        summary: "Before banks talk to each other, a customer talks to their bank. This is that first instruction.",
        minutes: 9,
        tags: ['pain.001', 'initiation'],
        status: 'draft'
    },
    {
        id: '401-camt-056-cancellation',
        num: 401, level: 400,
        file: '401-camt-056-cancellation.md',
        title: 'camt.056: Calling a Payment Back',
        summary: "Sometimes a payment is sent in error and must be recalled. The polite, structured way one bank asks another to cancel.",
        minutes: 7,
        tags: ['camt.056', 'cancellation', 'R-transactions'],
        status: 'draft'
    }
];

// Convenience lookups used by markdown.js / app.js
function getArticle(id) { return ACADEMY_TOC.find(a => a.id === id) || null; }
function getArticlesByLevel(level) {
    return ACADEMY_TOC.filter(a => a.level === level).sort((a, b) => a.num - b.num);
}
