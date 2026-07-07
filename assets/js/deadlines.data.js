// ===========================================================================
// deadlines.data.js  —  The ISO 20022 compliance calendar (Track 2 / task 10)
// ===========================================================================
// The live, dated migration milestones the industry is working toward. The
// widget (task 11) computes past / upcoming / imminent from `date` vs "now",
// so status is NEVER hardcoded here and the calendar can't go stale.
//
// All content data lives here (per project convention). Dates are verified
// against Swift / CBPR+ published guidance (see the linked lessons).
//
// -------------------------- SCHEMA -----------------------------------------
// const ACADEMY_DEADLINES = {
//   meta: { updated: "<YYYY-MM-DD>" },
//   items: [
//     {
//       id:        <string>,             // stable slug
//       date:      "<YYYY-MM-DD>",       // the effective date (used for countdown)
//       precision: "day" | "month",      // "month" => display "November 2027",
//                                        //   date is the best-known point in that month
//       title:     <string>,             // short headline
//       scope:     <string>,             // who / which network it binds
//       summary:   <string>,             // one or two plain sentences
//       ref:       <string|null>,        // lesson id in /content to "learn more"
//       tags:      [<string>, ...]
//     }, ...
//   ]
// };
//
// The widget derives, per item:
//   past      — date < today            (show "Completed" / historical)
//   imminent  — 0..90 days away         (highlight)
//   upcoming  — > 90 days away
// ---------------------------------------------------------------------------

const ACADEMY_DEADLINES = {
    meta: { updated: "2026-07-06" },

    items: [
        {
            id: "mt-cross-border-retirement",
            date: "2025-11-22",
            precision: "day",
            title: "MT cross-border messages retired",
            scope: "Swift FINplus · CBPR+",
            summary: "MT payment messages (MT103, MT202/COV and friends) stopped being accepted for cross-border payments; the pacs equivalents took over. The end of the coexistence period that began in 2022.",
            ref: "208-the-end-of-mt",
            tags: ["mt", "mx", "migration", "coexistence"]
        },
        {
            id: "structured-address-mandate",
            date: "2026-11-14",
            precision: "day",
            title: "Unstructured addresses removed",
            scope: "CBPR+ · key market infrastructures",
            summary: "From this date, cross-border payments carrying a party address must use a fully structured or hybrid format — town and country structured, at minimum. Purely free-text (AdrLine-only) addresses are no longer accepted, and there is no Swift contingency: non-compliant messages may be rejected or delayed.",
            ref: "603-structured-addresses",
            tags: ["structured address", "pstladr", "cbpr+", "screening"]
        },
        {
            id: "case-management-mandatory-receive",
            date: "2026-11-14",
            precision: "month",
            title: "Case Management: mandatory to receive investigations",
            scope: "Swift · Exceptions & Investigations",
            summary: "Institutions must be able to receive camt.110 investigation requests through Swift Case Management (an embedded MT199 and in-flow translation bridge the long tail). The first hard step in retiring free-text investigation messages.",
            ref: "409-new-investigations",
            tags: ["camt.110", "camt.111", "investigations", "case management"]
        },
        {
            id: "eni-iso-only",
            date: "2027-11-20",
            precision: "month",
            title: "Investigations go ISO-only; legacy E&I retired",
            scope: "Swift · Exceptions & Investigations",
            summary: "In-flow translation to MT199 ends and the whole community must send and receive investigations in ISO 20022 only (camt.110 / camt.111) through Case Management. The legacy free-text E&I formats (MT199/299, MT195/295, MT196/296, MT198/298, MT995/996) are retired for this purpose.",
            ref: "409-new-investigations",
            tags: ["camt.110", "camt.111", "investigations", "mt199", "retirement"]
        }
    ]
};
