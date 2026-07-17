// =============================================================================
// WHAT'S CHANGING — data
// -----------------------------------------------------------------------------
// The standard doesn't stand still. This backs the "What's changing" hub: the
// migration milestones (with dates for a live countdown), the MT ↔ MX mapping
// table every engineer looks up, and the facts about versions.
//
// November dates use the SWIFT Standards Release weekend (mid/late November).
// The years are firm; treat exact days as approximate except 22 Nov 2025.
// =============================================================================

const CHANGES = (function () {
    // Migration milestones — status is computed from today at render time.
    const MILESTONES = [
        { date: '2004-01-01', when: '2004', title: 'ISO 20022 is published',
          body: 'The standard exists — a shared data dictionary plus a method for building messages. The successor to MT is defined nearly two decades before it’s enforced.',
          link: '209-what-is-iso-20022' },
        { date: '2023-03-20', when: 'March 2023', title: 'Coexistence begins',
          body: 'MT and MX both become legal on the cross-border network. Every receiver must cope with either — the three-year bridge that lets the cautious translate while the ambitious go native.',
          link: '208-the-end-of-mt' },
        { date: '2025-11-22', when: '22 Nov 2025', title: 'MT retired for cross-border payments',
          body: 'Acceptance of the in-scope payment & cash MT messages (MT 1xx/2xx/9xx) ends for cross-border under CBPR+. MT103 → pacs.008 and friends are now the only way across.',
          link: '208-the-end-of-mt' },
        { date: '2026-11-21', when: 'November 2026', title: 'Structured addresses mandatory',
          body: 'CBPR+ stops accepting free-text-only addresses for in-scope parties and agents. Town and country must be structured — the field where the next deadline lives.',
          link: '603-structured-addresses' },
        { date: '2026-11-21', when: 'November 2026', title: 'Case Management: mandatory to receive',
          body: 'You must be able to receive a camt.110 investigation request through Case Management — with an embedded MT199 and in-flow translation as a bridge for the long tail.',
          link: '409-new-investigations' },
        { date: '2027-11-20', when: 'November 2027', title: 'ISO-only: legacy retired',
          body: 'In-flow translation ends. Investigations go ISO-only (camt.110/111), and the legacy exceptions-&-investigations MT (MT192/195/196/199 and cousins) are retired for that purpose.',
          link: '409-new-investigations' }
    ];

    // MT ↔ MX mapping — the lookup engineers reach for constantly.
    // engine:true = our live Playground transform covers it.
    const MAP = [
        { mt: 'MT103', mx: 'pacs.008', what: 'Customer credit transfer (the workhorse)', engine: true },
        { mt: 'MT103 RETN', mx: 'pacs.004', what: 'Payment return', engine: true },
        { mt: 'MT101', mx: 'pain.001', what: 'Request for transfer / credit transfer initiation', engine: true },
        { mt: 'MT104', mx: 'pain.008', what: 'Direct debit (pull)', engine: true },
        { mt: 'MT202 / MT205', mx: 'pacs.009', what: 'FI-to-FI transfer (bank’s own money)', engine: false },
        { mt: 'MT202COV', mx: 'pacs.009 COV', what: 'Cover payment behind a customer transfer', engine: false },
        { mt: 'MT940', mx: 'camt.053', what: 'End-of-day statement', engine: true },
        { mt: 'MT950', mx: 'camt.053', what: 'Statement (no customer detail)', engine: true },
        { mt: 'MT942', mx: 'camt.052', what: 'Intraday / interim report', engine: false },
        { mt: 'MT900', mx: 'camt.054', what: 'Debit confirmation', engine: true },
        { mt: 'MT910', mx: 'camt.054', what: 'Credit confirmation', engine: true },
        { mt: 'MT192 / MT292', mx: 'camt.056', what: 'Cancellation request (recall)', engine: true },
        { mt: 'MT196 / MT296', mx: 'camt.029', what: 'Resolution of investigation (answer)', engine: false },
        { mt: 'MT199 / MT299', mx: 'camt.110 / .111', what: 'Free-format → structured investigation', engine: false },
        { mt: 'n/a (status)', mx: 'pacs.002 / pain.002', what: 'Payment status report', engine: true }
    ];

    // Version facts.
    const VERSION_FACTS = [
        'A message id is a catalogue reference: <code>pacs.008.001.08</code> = business area · message · variant · <b>version</b>.',
        'The standard runs an <b>annual maintenance cycle</b>. Accepted change requests ship as new versions: <code>.08</code> → <code>.09</code> → <code>.10</code>. The meaning is stable; the schema around it is not.',
        'You don’t pick your version — your <b>usage guideline does</b>. CBPR+ pins a version and uplifts the whole network together on the SWIFT release weekend; HVPS+ and domestic infrastructures pin their own.',
        'The complete sentence isn’t “we support pacs.008” — it’s “we support <code>pacs.008.001.08</code> under the CBPR+ usage guideline”: message, <b>version</b>, and rulebook.',
        'The riskiest window is the annual uplift, when senders and receivers cross the version boundary minutes apart — where migration incidents cluster.'
    ];

    return { MILESTONES: MILESTONES, MAP: MAP, VERSION_FACTS: VERSION_FACTS };
})();
window.CHANGES = CHANGES;
