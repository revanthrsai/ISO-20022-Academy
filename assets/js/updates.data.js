// ===========================================================================
// updates.data.js  —  What's New: the site's changelog, written for readers
// ===========================================================================
//
// WHAT THIS IS
//   A returning visitor has no way to tell what changed since June, and the
//   footer signup promises "an email when a new lesson or tool lands" — which
//   needs somewhere to point. This file is that record.
//
// HOW TO ADD AN ENTRY
//   Put the newest first. Every entry needs a date (ISO), a kind, a title and
//   a body. `links` are optional and route into the app.
//
//     kind:  'workshop' | 'lesson' | 'tool' | 'improvement'
//     links: [{ label, route }]   route is a hash route, e.g. '#/workshop'
//
//   Write the body the way you'd tell a colleague what changed and why it
//   matters to them — not the way a commit message reads. If an entry can't
//   be described as something a visitor can now *do*, it probably doesn't
//   belong here.
//
//   Nothing else needs editing: the page, the counts and the newest-update
//   date all derive from this list.
// ---------------------------------------------------------------------------

const ACADEMY_UPDATES = [
    {
        date: '2026-10-12',
        kind: 'tool',
        title: 'The Playground is now a Live Translator',
        body: 'Paste any ISO 20022 or SWIFT MT message and the Playground tells you what it is, picks the format it maps to, and translates it on the live Java engine. Ask for a pair that doesn’t exist, like MT103 to pain.001, and it explains why and shows the translations that do. The Library is also a course outline now: six sections that open to their numbered chapters.',
        links: [{ label: 'Open the Translator', route: '#/playground' }, { label: 'Browse the course', route: '#/library' }]
    },
    {
        date: '2026-08-07',
        kind: 'workshop',
        title: 'Two more workshops: reconciliation and cover payments',
        body: 'The Reconciliation Desk puts you on a corporate finance desk at 6am with a camt.053 that will not tie out and three entries stuck in the exception queue — a batch entry read at the wrong level, a free-text remittance, and two dates that disagree perfectly correctly. The Cover Payment drops you at the receiving bank holding a customer instruction with no funds, and funds with no instruction, and walks you to the shared UETR and the block that exists because of a real money-laundering reform.',
        links: [{ label: 'Open the workshops', route: '#/workshop' }]
    },
    {
        date: '2026-08-05',
        kind: 'workshop',
        title: 'Workshop: The Address Deadline',
        body: 'Run the tape forward to the first Monday after CBPR+ stops accepting free-text addresses. A payment has bounced: work out what the rule actually requires, what the minimum legal repair is, and where the fix has to live so next month’s run does not bounce too. The trap most people fall into is the one that makes the validator go green.',
        links: [
            { label: 'Start the workshop', route: '#/workshop/address-deadline' },
            { label: 'Read the lesson', route: '#/library/603-structured-addresses' }
        ]
    },
    {
        date: '2026-08-05',
        kind: 'improvement',
        title: 'A faster, lighter site',
        body: 'The intro animation is gone, the hero video is a third of its old size, and scripts no longer block the page from rendering. On a phone on a slow connection the difference is the point.',
        links: []
    },
    {
        date: '2026-08-04',
        kind: 'improvement',
        title: 'A new front door — and links you can actually share',
        body: 'The Library is now the landing page, with a curriculum rail that stays beside you while you read so 44 lessons feel like a path rather than a pile. Every lesson, tool and dictionary entry has a real address again, so you can bookmark one or send it to a colleague. The lesson pages that search engines land on carry the site’s design instead of looking like a bare document.',
        links: [{ label: 'Browse the Library', route: '#/library' }]
    },
    {
        date: '2026-07-28',
        kind: 'improvement',
        title: 'Built for reading on a phone',
        body: 'Navigation, lesson layout and the workshop views reworked for small screens.',
        links: []
    },
    {
        date: '2026-07-19',
        kind: 'workshop',
        title: 'The Workshop opens: three hands-on challenges',
        body: 'Every lesson in the Library explains something. The Workshop gives you a situation instead — a broken pacs.008 with three planted defects, an MT103 that has to become a pacs.008 before the cut-off, and money that arrived at a closed account. You work it, you get checked, and when you get it wrong you are told why that answer was tempting.',
        links: [{ label: 'Try a workshop', route: '#/workshop' }]
    },
    {
        date: '2026-07-17',
        kind: 'tool',
        title: 'Message dictionary, code sets, and the deadline clock',
        body: 'A browsable dictionary of the messages and their elements, the code sets behind the fields, and a running countdown of what the industry has to have done by when. Plus The Life of a Payment: one payment from Dubai to Bangalore as a single cinematic scroll.',
        links: [
            { label: 'Open the Dictionary', route: '#/dictionary' },
            { label: 'Watch The Life of a Payment', route: '#/journey' }
        ]
    },
    {
        date: '2026-07-14',
        kind: 'lesson',
        title: 'All 44 lessons rewritten',
        body: 'Every shelf reworked so the lessons derive the standard instead of reciting it: you meet the problem first, work out what has to be true, and only then see the XML. Fundamentals, architecture, the message deep dives, exceptions, case studies and the field guides.',
        links: [{ label: 'Start with Lesson 1', route: '#/library/101-what-is-money' }]
    }
];

window.ACADEMY_UPDATES = ACADEMY_UPDATES;
