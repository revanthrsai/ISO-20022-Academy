// App Module - Main application logic and navigation

// Clean-URL mode: routes still drive rendering through the hash internally, but
// the hash is stripped from the address bar right after each render. Incoming
// deep links (#/library etc.) still open correctly on load; the bar then always
// shows the bare site URL. Flip to false to restore shareable hash URLs.
window.CLEAN_URLS = true; // bar always shows the bare domain, no child routes
function stripHash() {
    if (!window.CLEAN_URLS || !location.hash) return;
    history.replaceState(null, '', location.pathname + location.search);
}

const PAGES = {
    history: `
        <div class="page">
            <section class="hero-stage" data-hero aria-label="ISO Academy introduction">
                <div class="hero-bg" aria-hidden="true">
                    <video class="hero-video" autoplay muted loop playsinline preload="auto" poster="assets/images/hero-poster.jpg"
                           src="content/videobyte/iso20022_cinematic_intro.mp4"></video>
                    <div class="hero-vignette"></div>
                </div>
            </section>

            <section class="story-section reveal-section">
                <div class="story-year" data-reveal="fade">The Origin</div>
                <h2 class="kinetic-headline"><span class="kinetic-word">Banks spoke</span> <span class="gradient-text kinetic-word">different languages.</span></h2>

                <div class="stats-strip">
                    <div class="stat">
                        <div class="stat-value"><span class="stat-number" data-target="11000">0</span><span class="stat-suffix">+</span></div>
                        <div class="stat-label">Financial institutions</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value"><span class="stat-number" data-target="200">0</span><span class="stat-suffix">+</span></div>
                        <div class="stat-label">Countries &amp; territories</div>
                    </div>
                </div>

                <p data-reveal="up">
                    International payments depended on telex networks, manual processing,
                    and fragmented standards. Every institution interpreted data differently.
                </p>
            </section>

            <section class="story-section reveal-section">
                <div class="story-year" data-reveal="fade">The Problem</div>
                <h2 data-reveal="up">Money could travel globally.<br>Information <span class="gradient-text">could not.</span></h2>
                <p data-reveal="up" data-reveal-delay="120">
                    Payments crossed borders every day, but their underlying data remained
                    inconsistent, incomplete, and difficult for machines to understand.
                </p>
            </section>

            <section class="story-section reveal-section">
                <div class="story-year" data-reveal="fade">The Need</div>
                <h2 data-reveal="up">The world needed a <span class="gradient-text">common financial language.</span></h2>
                <div class="iso-birth">
                    <div class="iso-year" data-parallax="0.08">2004</div>
                    <div class="iso-name">ISO 20022</div>
                    <div class="iso-tagline" data-reveal="up">A universal language for global finance</div>
                </div>
                <p data-reveal="up">
                    A language that every bank, clearing house, payment processor,
                    and regulator could understand.
                </p>
            </section>

            <div class="scrub-intro" data-reveal="up">
                <div class="eyebrow eyebrow-center">The longer story</div>
                <h2 class="scrub-intro-title">Five thousand years, one problem.</h2>
            </div>

            <div class="scrub-section" id="scrub-section">
                <div class="scrub-pin">
                    <div class="scrub-pin-eyebrow">The Story</div>
                    <div class="scrub-pin-year" id="scrub-pin-year">Trust</div>
                    <div class="scrub-pin-track"><div class="scrub-pin-progress" id="scrub-pin-progress"></div></div>
                    <div class="scrub-pin-count"><strong id="scrub-pin-index">01</strong> / 07</div>
                </div>

                <div class="scrub-entries" id="scrub-entries">
                    <div class="scrub-entry" data-history data-year="Trust">
                        <div class="scrub-entry-year">c. 3200 BCE</div>
                        <h3 class="scrub-entry-title">The History of Trust</h3>
                        <p class="scrub-entry-desc">How do you trust that a shipment of grain left a distant farm and arrived untouched, when you never saw it travel? Mesopotamian temples sealed clay tokens inside hollow clay balls — break the ball, count the tokens, verify the delivery. The moment they pressed each token's shape onto the outside, value became <strong>information you could read without opening anything</strong>. The first record was born.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="Trade">
                        <div class="scrub-entry-year">449 BCE</div>
                        <h3 class="scrub-entry-title">The History of Trade</h3>
                        <p class="scrub-entry-desc">How do you settle a debt across an empire without hauling heavy coin through bandit country? Roman merchants simply wrote it down: if A owed B and B owed C, a few <strong>ledger entries cleared the debt</strong> — no coin moved at all. The ledger itself had quietly become a binding promise of payment.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="Money">
                        <div class="scrub-entry-year">1494</div>
                        <h3 class="scrub-entry-title">The History of Money</h3>
                        <p class="scrub-entry-desc">How does a merchant catch one error hidden among thousands of transactions? A Venetian friar codified <strong>double-entry bookkeeping</strong> — every amount written twice, debits forced to equal credits, so the books simply could not hide a mistake. Centuries later, goldsmiths' paper notes turned that same trust into money you could carry in your pocket.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="Wires">
                        <div class="scrub-entry-year">1871</div>
                        <h3 class="scrub-entry-title">The History of Communication</h3>
                        <p class="scrub-entry-desc">How do you move money faster than a horse can carry it? The telegraph split information from the object — and a bank could finally wire funds as an <strong>authenticated message instead of a shipment of cash</strong>. Telex inherited the job for a century, but every transfer was still typed out, checked, and trusted by hand.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="Banking">
                        <div class="scrub-entry-year">1974</div>
                        <h3 class="scrub-entry-title">The History of Banking</h3>
                        <p class="scrub-entry-desc">What happens when one bank pays its side of a deal and the other collapses before paying back? When Herstatt Bank failed mid-settlement, counterparties lost everything they'd already sent — a disaster that forced the world to build <strong>real-time settlement and payment-versus-payment</strong>, where neither side of a trade moves unless both do.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="SWIFT">
                        <div class="scrub-entry-year">1973–1977</div>
                        <h3 class="scrub-entry-title">The History of SWIFT</h3>
                        <p class="scrub-entry-desc">How do hundreds of banks stop trusting insecure telex messages typed out by hand? 239 banks built <strong>SWIFT</strong> — a shared, secure network with one standard message format. It ran global banking for decades, but its tiny fixed-width fields truncated names and addresses, quietly breaking compliance checks every time a payment crossed a border.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="ISO">
                        <div class="scrub-entry-year">2004 →</div>
                        <h3 class="scrub-entry-title">The History of ISO 20022</h3>
                        <p class="scrub-entry-desc">What if the language banks speak could carry a payment's whole story — and never lose a word crossing a border? <strong>ISO 20022</strong> separated what a payment <em>means</em> from how it's written down, so rich, structured detail now survives end to end. By 2025 the old format was retired for cross-border payments. This is the language the world speaks now.</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="scroll-cue" id="scroll-cue">
            <span class="scroll-cue-label">Scroll</span>
            <span class="scroll-cue-chevron">&#8595;</span>
        </div>
    `,
    library: `
        <div class="page"><div id="learn-root"><!-- renderArticleIndex() fills this --></div></div>
    `,
    playground: `
        <div class="page">
            <div class="pg-layout">
            <div class="pg-stage">

            <!-- TOOL · XML Viewer / Reader (Session 4.1) — opened from the Sample Library -->
            <section class="pg-tool-panel" id="pg-tool-viewer" hidden>
                <button class="pg-back" onclick="setPlaygroundTool('samples', event)">&larr; Sample Library</button>
                <p class="pg-tool-intro">
                    Read the message as a collapsible tree &mdash; or paste your own over it. Flip
                    <strong>Plain English</strong> to rename every cryptic tag to what it actually means.
                </p>
                <div class="pg-flow" role="group" aria-label="Send this message to another tool">
                    <span class="pg-flow-lbl">Continue with this message</span>
                    <div class="pg-flow-btns">
                        <button class="pg-flow-btn" onclick="sendMessageTo('transformer', event)">Transform</button>
                    </div>
                </div>
                <div class="xv" id="xv-root"></div>
            </section>

            <!-- TOOL · Message Transformer (Session 4.2) — bidirectional MT103 ⇄ pacs.008 -->
            <section class="pg-tool-panel" id="pg-tool-transformer" hidden>
                <button class="pg-back" onclick="setPlaygroundTool('samples', event)">&larr; Sample Library</button>
                <p class="pg-tool-intro">
                    The same payment, two languages. Edit <strong>either</strong> side and the other rebuilds
                    <strong>live</strong> &mdash; the legacy SWIFT <strong>MT103</strong> and the
                    <strong>ISO&nbsp;20022 pacs.008</strong> stay locked to one shared meaning. Flip the direction to convert
                    each way, hover a field to see where it lands, and toggle plain English to read the ISO side without the tags.
                </p>
                <div class="pg-flow" role="group" aria-label="Send this message to another tool">
                    <span class="pg-flow-lbl">Continue with this pacs.008</span>
                    <div class="pg-flow-btns">
                        <button class="pg-flow-btn" onclick="sendMessageTo('viewer', event)">View</button>
                    </div>
                </div>
                <div class="mxt" id="mxt-root"></div>
            </section>

            <!-- TOOL · Sample Message Library (Session 4.5) — the ISO 20022 catalogue tree, the Playground home -->
            <section class="pg-tool-panel" id="pg-tool-samples" data-reveal="up">
                <p class="pg-tool-intro">
                    The <strong>ISO&nbsp;20022 catalogue</strong>, browsable as a tree &mdash;
                    <strong>Payments</strong>, <strong>Securities</strong>, <strong>Trade Finance</strong>,
                    <strong>Cards</strong>, and <strong>Foreign Exchange</strong>. Pick a business domain, pick a
                    message, and it opens in the reader with <strong>Transform</strong> one click
                    away &mdash; or paste your own message.
                </p>
                <div class="smp" id="smp-root"></div>
            </section>

            </div><!-- /pg-stage -->
            </div><!-- /pg-layout -->
        </div>
    `,
    glossary: `
        <div class="page">
            <div class="eyebrow" data-reveal="fade">Reference</div>
            <h2 class="section-title" data-reveal="up">The language, defined.</h2>
            <p class="section-description" data-reveal="up">
                Every term you'll meet across the journey &mdash; from IBAN to settlement &mdash; in one searchable encyclopedia.
            </p>
            <div class="glossary-toolbar" data-reveal="up">
                <input type="text" class="search-box" id="glossary-search" placeholder="Search terms and definitions…" oninput="filterGlossary(this.value)">
                <span class="glossary-count" id="glossary-count"></span>
            </div>
            <div class="filter-bar" id="glossary-filter" data-reveal="up"></div>
            <div class="glossary-grid" id="glossary-grid"></div>
        </div>
    `
};

// Ordered top-level sections, for the prev/next header arrows.
const NAV_ORDER = ['history', 'library', 'playground', 'glossary'];

// Which Playground tool is showing ('samples' | 'viewer' | 'transformer').
// 'samples' (the catalogue) is the Playground home; the viewer/reader is opened from it.
let playgroundTool = 'samples';

// Switch between Playground tools without leaving the section. Each tool's
// panel is a sibling <section>; we just toggle which one is visible and lazily
// (re)initialise it so its live state is fresh.
function setPlaygroundTool(tool, evt) {
    if (evt) evt.preventDefault();
    playgroundTool = tool;
    const viewer = document.getElementById('pg-tool-viewer');
    const transformer = document.getElementById('pg-tool-transformer');
    const samples = document.getElementById('pg-tool-samples');
    if (viewer) viewer.hidden = (tool !== 'viewer');
    if (transformer) transformer.hidden = (tool !== 'transformer');
    if (samples) samples.hidden = (tool !== 'samples');
    if (tool === 'viewer' && window.XmlViewer) XmlViewer.init('xv-root');
    if (tool === 'transformer' && window.MsgTransformer) MsgTransformer.init('mxt-root');
    if (tool === 'samples' && window.SampleLibrary) SampleLibrary.init('smp-root');

    // Keep the URL on the active tool so a chosen tool is shareable / reload-safe
    // (docs/HANDBOOK.md (IA) §2). Write-only (replaceState, no reload); routeOnLoad /
    // hashchange read it back.
    if (!window.CLEAN_URLS && typeof history !== 'undefined') {
        const slug = PG_TOOL_TO_SLUG[tool] || tool;
        const target = '#/playground/' + slug;
        if (location.hash !== target) history.replaceState(null, '', target);
    }
}

// Route slugs for the five Playground tools (docs/HANDBOOK.md (IA) §3) ⇄ the internal
// tool keys setPlaygroundTool understands.
const PG_TOOL_SLUGS = { 'xml-viewer': 'viewer', viewer: 'viewer', transformer: 'transformer', samples: 'samples' };
const PG_TOOL_TO_SLUG = { viewer: 'xml-viewer', transformer: 'transformer', samples: 'samples' };

// Open the Playground at a specific tool (from a deep link or a glossary
// cross-link). Ensures the Playground page is mounted, then switches tools.
function openPlaygroundTool(slug){
    const tool = PG_TOOL_SLUGS[slug] || 'samples';
    if (currentNavPage() !== 'playground' || !document.getElementById('pg-tool-viewer')) {
        navigate('playground');
    }
    setPlaygroundTool(tool);
}

// Carry the current message from the active tool into another, so the five
// Playground tools behave like one workspace, not five separate pastes
// (Session 4.6). Read the source tool's current XML first, switch tools (which
// re-initialises the destination), then load the message into it.
const PG_GET = {
    viewer:      () => (window.XmlViewer && XmlViewer.getXml()) || '',
    transformer: () => (window.MsgTransformer && MsgTransformer.getXml()) || ''
};
const PG_LOAD = {
    viewer:      (xml) => window.XmlViewer && XmlViewer.loadXml(xml),
    transformer: (xml) => window.MsgTransformer && MsgTransformer.loadXml(xml)
};
function sendMessageTo(dest, evt) {
    if (evt) evt.preventDefault();
    const from = playgroundTool;
    if (from === dest) return;
    const xml = (PG_GET[from] ? PG_GET[from]() : '').trim();
    if (!xml) return;                 // nothing loaded yet — no-op
    setPlaygroundTool(dest);          // switches + re-inits the destination
    if (PG_LOAD[dest]) PG_LOAD[dest](xml);
}

// Which section is currently active (falls back to the first).
function currentNavPage() {
    const active = document.querySelector('.nav-item.active');
    const page = active && active.getAttribute('data-page');
    return NAV_ORDER.includes(page) ? page : NAV_ORDER[0];
}

// The Library reading order: every article, level ascending, each level by num
// — the exact order the Library index renders them in.
function orderedArticleIds() {
    if (typeof ACADEMY_TOC === 'undefined') return [];
    const levels = Array.from(new Set(ACADEMY_TOC.map(function (x) { return x.level; }))).sort(function (m, n) { return m - n; });
    const ids = [];
    levels.forEach(function (l) { getArticlesByLevel(l).forEach(function (x) { ids.push(x.id); }); });
    return ids;
}

// Step the header arrows. Context-aware:
//   • reading a Library article  → prev / next article (past an end → the Library index)
//   • reading a History chapter  → prev / next ready chapter (past an end → the History landing)
//   • on a top-level page        → prev / next section through NAV_ORDER
function stepNav(dir) {
    if (window.__currentArticle) {
        const order = orderedArticleIds();
        const i = order.indexOf(window.__currentArticle);
        if (i !== -1) {
            const j = i + dir;
            if (j < 0 || j >= order.length) { navigate('library'); return; }
            openArticle(order[j]);
            return;
        }
    }
    if (window.__currentHistory && typeof HISTORY_CHAPTERS !== 'undefined') {
        const ready = HISTORY_CHAPTERS.filter(function (c) { return c.status === 'ready'; });
        const i = ready.findIndex(function (c) { return c.slug === window.__currentHistory; });
        if (i !== -1) {
            const j = i + dir;
            if (j < 0 || j >= ready.length) { navigate('history'); return; }
            openHistoryChapter(ready[j].slug);
            return;
        }
    }
    const i = NAV_ORDER.indexOf(currentNavPage());
    const next = i + dir;
    if (next < 0 || next >= NAV_ORDER.length) return;
    navigate(NAV_ORDER[next]);
}

// Enable/disable the arrows. While reading an article or chapter both stay live
// (a step past either end drops back to that section's index); on a top-level
// page they dim at the ends of NAV_ORDER.
function updateNavArrows() {
    const prev = document.getElementById('nav-prev');
    const next = document.getElementById('nav-next');
    if (!prev || !next) return;
    if (window.__currentArticle || window.__currentHistory) {
        prev.disabled = false;
        next.disabled = false;
        return;
    }
    const i = NAV_ORDER.indexOf(currentNavPage());
    prev.disabled = (i <= 0);
    next.disabled = (i >= NAV_ORDER.length - 1);
}

function navigate(page, evt) {
    const content = document.getElementById('content');
    const navItems = document.querySelectorAll('.nav-item');
    const triggerEl = (evt && evt.target.closest('.nav-item')) || document.querySelector(`.nav-item[data-page="${page}"]`);

    if (evt) evt.preventDefault();

    // Leaving any article/chapter reading view for a top-level section.
    window.__currentArticle = null;
    window.__currentHistory = null;

    // Update active nav + slide the indicator
    navItems.forEach(item => item.classList.remove('active'));
    if (triggerEl) triggerEl.classList.add('active');
    moveNavIndicator();
    updateNavArrows();

    // Close detail panel
    closeDetailPanel();

    // Scroll to top for a clean scene change (the page fades in)
    window.scrollTo({ top: 0, behavior: 'auto' });

    // Load page
    content.innerHTML = PAGES[page];

    // Run page-specific initialization
    if (page === 'glossary') {
        applyGlossaryHash();
        renderGlossary();
    } else if (page === 'playground') {
        if (window.SampleLibrary) SampleLibrary.init('smp-root');
        playgroundTool = 'samples';
    } else if (page === 'library') {
        renderArticleIndex();
    } else if (page === 'history') {
        initScrubTimeline();
        initRevealAnimations();
        initStatCounters();
        initScrollCue();
        renderHistoryChapterIndex();
    }

    // Reflect the section into the URL so every top-level view is shareable and
    // reload-safe (docs/HANDBOOK.md (IA) §2). Glossary owns its own query-string hash
    // (category / q / term); the rest are the bare section route. Write-only
    // (replaceState, no reload) so this never re-enters the hashchange router.
    if (page === 'glossary') {
        if (typeof syncGlossaryHash === 'function') syncGlossaryHash();
    } else if (!window.CLEAN_URLS && typeof history !== 'undefined') {
        const secTarget = '#/' + page;
        if (location.hash !== secTarget) history.replaceState(null, '', secTarget);
    }

    // Hand the freshly-rendered subtree to the shared motion engine.
    if (window.Motion) Motion.scan(content);
}

// Scroll cue: a bouncing "scroll" hint pinned to the bottom of the
// viewport on first load. Fades out once the user starts scrolling,
// and clicking it nudges the page down by one screen. The whole document
// scrolls (not an inner pane), so this watches window scroll position.
function initScrollCue() {
    const cue = document.getElementById('scroll-cue');
    if (!cue) return;

    function updateVisibility() {
        const activeCue = document.getElementById('scroll-cue');
        if (!activeCue) return;
        if (window.scrollY > 80) {
            activeCue.classList.add('is-hidden');
        } else {
            activeCue.classList.remove('is-hidden');
        }
    }

    if (!window.__scrollCueBound) {
        window.__scrollCueBound = true;
        window.addEventListener('scroll', updateVisibility, { passive: true });
    }

    updateVisibility();

    cue.addEventListener('click', function () {
        window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    });
}

// Pinned-scrub timeline: as each entry crosses the vertical center of the
// viewport, mark it active and sync the pinned year/progress display.
// Build the chronometer dial into the sticky "The Story" pin. A slender hand
// sweeps to the active era as the reader scrolls; the year shows in the centre.
// (Desktop only — CSS hides it on narrow screens, where the text pin remains.)
function buildChronometer(pin, items){
    const n = items.length, per = 360 / n, cx = 150, cy = 150, tickR = 116, labR = 138;
    function pt(i, r){ const a = (-90 + i * per) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    let ticks = '', labels = '';
    for (let i = 0; i < n; i++){
        const p1 = pt(i, tickR - 10), p2 = pt(i, tickR);
        ticks += '<line class="chrono-tick" data-i="' + i + '" x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) + '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '"/>';
        const lp = pt(i, labR);
        const anchor = lp[0] > cx + 4 ? 'start' : (lp[0] < cx - 4 ? 'end' : 'middle');
        labels += '<text class="chrono-label" data-i="' + i + '" x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 4).toFixed(1) + '" text-anchor="' + anchor + '">' + (items[i].label || '') + '</text>';
    }
    const svg =
        '<svg class="chrono-svg" viewBox="0 0 300 300" role="img" aria-label="Timeline chronometer">' +
        '<circle class="chrono-ring" cx="150" cy="150" r="140"/>' +
        '<circle class="chrono-ring2" cx="150" cy="150" r="120"/>' +
        '<g class="chrono-ticks">' + ticks + '</g>' +
        '<g class="chrono-labels">' + labels + '</g>' +
        '<g class="chrono-hand" id="chrono-hand"><line x1="150" y1="150" x2="150" y2="44" class="chrono-hand-main"/><line x1="150" y1="150" x2="150" y2="172" class="chrono-hand-tail"/></g>' +
        '<circle class="chrono-hub" cx="150" cy="150" r="6.5"/><circle class="chrono-hub-dot" cx="150" cy="150" r="2.6"/>' +
        '<text class="chrono-eyebrow" x="150" y="206" text-anchor="middle">The Story</text>' +
        '<text class="chrono-year" id="chrono-year" x="150" y="233" text-anchor="middle">' + (items[0] ? (items[0].year || '') : '') + '</text>' +
        '<text class="chrono-count" id="chrono-count" x="150" y="252" text-anchor="middle">01 / ' + String(n).padStart(2, '0') + '</text>' +
        '</svg>';
    const wrap = document.createElement('div');
    wrap.className = 'scrub-chrono';
    wrap.innerHTML = svg;
    pin.insertBefore(wrap, pin.firstChild);
    const hand = wrap.querySelector('#chrono-hand');
    const yearEl = wrap.querySelector('#chrono-year');
    const countEl = wrap.querySelector('#chrono-count');
    const labelEls = wrap.querySelectorAll('.chrono-label');
    const tickEls = wrap.querySelectorAll('.chrono-tick');
    return {
        set: function(i){
            if (hand) hand.style.transform = 'rotate(' + (i * per) + 'deg)';
            if (yearEl) yearEl.textContent = (items[i] && items[i].year) || '';
            if (countEl) countEl.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
            labelEls.forEach(function(el){ el.classList.toggle('is-active', +el.getAttribute('data-i') === i); });
            tickEls.forEach(function(el){ el.classList.toggle('is-active', +el.getAttribute('data-i') === i); });
        }
    };
}

function initScrubTimeline() {
    const entries = document.querySelectorAll('.scrub-entry[data-history]');
    if (!entries.length) return;

    const pinYear = document.getElementById('scrub-pin-year');
    const pinIndex = document.getElementById('scrub-pin-index');
    const pinProgress = document.getElementById('scrub-pin-progress');
    const total = entries.length;

    // Build the chronometer once, into the sticky pin (desktop shows it via CSS).
    const pin = document.querySelector('.scrub-pin');
    let chrono = null;
    if (pin && !pin.querySelector('.scrub-chrono')) {
        const items = Array.prototype.map.call(entries, function (e) {
            const y = e.querySelector('.scrub-entry-year');
            // Strip a leading "circa" (c.) so the dial reads a clean year;
            // the article body keeps the precise "c. 3200 BCE".
            const yr = y ? y.textContent.trim().replace(/^c\.\s*/i, '') : '';
            return { label: e.dataset.year || '', year: yr };
        });
        chrono = buildChronometer(pin, items);
    }

    function setActive(target) {
        entries.forEach(el => el.classList.remove('active'));
        target.classList.add('active');

        const idx = Array.prototype.indexOf.call(entries, target);
        if (pinYear) pinYear.textContent = target.dataset.year || '';
        if (pinIndex) pinIndex.textContent = String(idx + 1).padStart(2, '0');
        if (pinProgress) pinProgress.style.width = `${((idx + 1) / total) * 100}%`;
        if (chrono) chrono.set(idx);
    }

    // Drive the focused entry from scroll position: the active (unblurred)
    // entry is always the one whose vertical center sits closest to the
    // viewport center, so the in-focus copy and the pinned year stay in sync
    // with what the reader is actually looking at.
    let raf = 0;
    let currentIdx = -1;
    function pick() {
        raf = 0;
        const mid = window.innerHeight / 2;
        let bestIdx = 0, bestDist = Infinity;
        for (let i = 0; i < entries.length; i++) {
            const r = entries[i].getBoundingClientRect();
            const dist = Math.abs((r.top + r.bottom) / 2 - mid);
            if (dist < bestDist) { bestDist = dist; bestIdx = i; }
        }
        if (bestIdx !== currentIdx) {
            currentIdx = bestIdx;
            setActive(entries[bestIdx]);
        }
    }
    function onScroll() {
        if (!raf) raf = requestAnimationFrame(pick);
    }
    // Replace any listener left by a previous History mount (avoids stacking
    // handlers that reference detached entries across navigations).
    if (window.__scrubOnScroll) {
        window.removeEventListener('scroll', window.__scrubOnScroll);
        window.removeEventListener('resize', window.__scrubOnScroll);
    }
    window.__scrubOnScroll = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Focus whatever is nearest the viewport center on load.
    pick();
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    routeOnLoad();
    initHeaderAutoHide();
    initNavIndicator();
});

// ---------------------------------------------------------------------------
// Sliding nav indicator: a single glass pill glides under the active item,
// and previews the hovered item — "hover indicators glide naturally."
// ---------------------------------------------------------------------------
function moveNavIndicator(target) {
    const nav = document.getElementById('nav');
    const indicator = document.getElementById('nav-indicator');
    if (!nav || !indicator) return;
    const el = target || nav.querySelector('.nav-item.active');
    if (!el) return;
    indicator.style.transform = `translate(${el.offsetLeft}px, -50%)`;
    indicator.style.width = `${el.offsetWidth}px`;
    indicator.classList.add('is-ready');

    // On the mobile horizontal scroller (indicator hidden) keep the active
    // item comfortably in view without using scrollIntoView.
    if (!target && nav.scrollWidth > nav.clientWidth + 4) {
        const active = nav.querySelector('.nav-item.active');
        if (active) {
            const desired = active.offsetLeft - 16;
            nav.scrollTo({ left: Math.max(0, desired), behavior: 'smooth' });
        }
    }
}

function initNavIndicator() {
    const nav = document.getElementById('nav');
    const indicator = document.getElementById('nav-indicator');
    if (!nav || !indicator) return;

    nav.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            indicator.classList.add('is-hovering');
            moveNavIndicator(item);
        });
    });
    nav.addEventListener('mouseleave', () => {
        indicator.classList.remove('is-hovering');
        moveNavIndicator();
    });

    // Make the active pill visible from the first paint, then re-measure once
    // fonts/layout settle so its position/width are exact.
    indicator.classList.add('is-ready');
    requestAnimationFrame(() => moveNavIndicator());
    setTimeout(() => moveNavIndicator(), 350);
    window.addEventListener('resize', () => moveNavIndicator());
}

// Auto-hiding header that also crystallizes into glass once scrolled away
// from the top: transparent over the hero, frosted while reading.
function initHeaderAutoHide() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
        const currentY = window.scrollY;
        const delta = currentY - lastY;

        // glass state
        if (currentY > 24) header.classList.add('header-scrolled');
        else header.classList.remove('header-scrolled');

        // auto-hide
        if (currentY <= 16) {
            header.classList.remove('header-hidden');
        } else if (delta > 4) {
            header.classList.add('header-hidden');
        } else if (delta < -4) {
            header.classList.remove('header-hidden');
        }

        lastY = currentY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    onScroll();
}

// Count-up stat strip: starts the instant the preloader's eyelids finish
// opening (or immediately if the intro already played this session).
function initStatCounters() {
    const numbers = document.querySelectorAll('.stat-number');
    if (!numbers.length) return;

    function run() {
        numbers.forEach(el => {
            if (el.dataset.counted) return;
            el.dataset.counted = '1';

            const target = parseInt(el.dataset.target, 10) || 0;
            const duration = 4000;
            const start = performance.now();

            function tick(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(target * eased).toLocaleString();
                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    el.textContent = target.toLocaleString();
                }
            }
            requestAnimationFrame(tick);
        });
    }

    if (document.body.classList.contains('kinetic-ready')) {
        run();
    } else {
        document.addEventListener('iso:intro-done', run, { once: true });
    }
}

// ===========================================================================
// Phase 2 · History chapters  (Session 2.1)
// ---------------------------------------------------------------------------
// PAGES.history is the opening scene; this module appends a chapter index to it
// and renders each chapter as a long-form reading view into #content, routed at
// #/history/<chapter-slug> (route scheme finalized in 1.3, docs/HANDBOOK.md (IA) §3), so
// a chapter is shareable and survives reload. Chapters read in order via the
// shared `pager` control (added 1.4). Authored this session: chapters 01-02.
// Chapters 03-05 are `status:'soon'` placeholders for 2.2/2.3 — listed in the
// index, not yet routable. All views reuse existing reading-surface styles
// (.article-page / .md-body / .article-earned / .pager); no new CSS this session.
// ===========================================================================

const HISTORY_CHAPTERS = [
  {
    num: '01', slug: 'evolution-of-payments', status: 'ready', minutes: 7,
    youtube: '', // paste a YouTube video ID here to show an illustration player atop this chapter
    title: 'The Evolution of Payments',
    hook: 'Hand cash to someone standing in front of you and the payment is finished before you let go. Send the same amount to someone you will never meet, on the other side of the world, and it still has to arrive — and you both have to know that it did. How?',
    summary: 'Money stopped being a thing you move and became information you describe. Coins, ledgers, the telegraph — five thousand years of pulling value and its proof apart, and why the description matters as much as the money.',
    earned: 'You can now explain why a modern payment is really a piece of information about value — and why moving that information cleanly, with the right who-pays-whom intact, matters every bit as much as moving the money.',
    body: `<blockquote><p>Hand cash to someone standing in front of you and the payment is finished before you let go. Send the same amount to someone you will never meet, in a country you have never been to, and it still has to arrive — and you both have to <strong>know</strong> that it did. Everything in this academy sits downstream of that one problem.</p></blockquote>

<p>For most of human history, paying someone meant handing them a thing. A coin. A sack of grain. A bar of metal whose weight you could feel in your hand. Value and the proof of value were the same object, in the same place, and trust was easy because you could see it.</p>

<p>The whole story of payments is the story of pulling those two apart — the value, and the information about the value — and learning to move the information faster, further, and more reliably than the thing itself could ever travel.</p>

<h2>First, value travelled as a thing</h2>
<p>A merchant in the ancient world settled a debt by moving the metal. To pay someone three towns away, somebody had to carry the coins down the road, past the bandits, and put them in the right hands. The money <em>was</em> the cargo. Lose the cargo and you lost the payment, with nothing left to prove it had ever existed.</p>

<h2>Then it became a promise</h2>
<p>Long before banks, traders worked out that you did not actually have to move the metal at all. If one merchant owed a second, and the second owed a third, a few strokes in a ledger could cancel the whole chain without a single coin changing hands. The written record had quietly become the payment.</p>
<p>In 1494 a Venetian friar wrote down the method merchants had used for generations — every amount recorded twice, what comes in set against what goes out, so the books could not hide a mistake. <strong>Double-entry bookkeeping</strong> turned money into something you could audit. Centuries later, the paper notes handed out by goldsmiths turned that same trust into something you could fold into a pocket. The promise had become the money.</p>

<h2>Then it learned to travel without the thing</h2>
<p>In 1871 a bank could, for the first time, move money faster than a horse could carry it. The telegraph split the information clean away from the object: instead of shipping cash, a bank sent an <strong>authenticated instruction</strong> — pay this person, this amount, on our word — and trusted the bank at the other end to act on it. The telex inherited that job for the next hundred years. The money never moved. Only the instruction did.</p>
<p>This is the quiet turning point the rest of this story depends on. From here on, a payment is not a thing that travels. <em>A payment is a piece of information about value, moving between people who trust the system enough to act on it.</em></p>

<h2>Every payment is the same three questions</h2>
<p>Strip away the centuries and every payment ever made asks the same three things: <strong>who is paying, who is being paid, and who carries the value between them.</strong> A coin handed across a table answers all three at once — you, them, nobody in between. A transfer between continents answers them across a chain of institutions, each one standing in for that handshake.</p>
<p>The harder the payment, the more those answers have to be written down, passed along, and understood identically by everyone who touches them. Get the information right and the money follows. Garble it and the money stalls — or lands in the wrong place.</p>

<h2>What that looks like today</h2>
<p>A worker in one country sends four hundred dollars home to her family in another. On her phone it takes one tap and looks instant. Underneath, that payment crosses two currencies and passes through three banks, none of which has ever met her — and each one has to be told, precisely and unambiguously, who is paying, who is being paid, how much, and what it is for.</p>
<p>Not one of those banks moves a physical thing. They move <em>information</em>, and settle up between themselves afterwards. The entire job — the job five thousand years of this story has been building toward — is making sure that information arrives complete, in a form every institution reads the same way.</p>

<p class="pullquote" style="margin:36px 0;">&ldquo;Money stopped being something you move. It became something you describe — and the description has to survive the journey.&rdquo;</p>

<p>That is what the rest of this history is really about: not how to move money, but how to describe it so well that it never gets lost in translation. The next chapter is about the first time the whole industry tried to agree on that description — and the network they built to carry it.</p>`
  },
  {
    num: '02', slug: 'swift-and-mt-messages', status: 'ready', minutes: 8,
    title: 'SWIFT and the MT Message',
    hook: 'For most of the last century, moving money between two banks meant a person typing the instruction out by hand and trusting that the bank at the other end would read it exactly the same way. What finally got hundreds of rival banks, in dozens of countries, to agree on one way of saying “pay this”?',
    summary: 'How two hundred and thirty-nine rival banks agreed on one way to say “pay this” — the secure network and the MT103 that moved the world’s money for a generation, and the tiny fixed field that started breaking it.',
    earned: 'You can now explain what SWIFT actually is — a shared secure network and a single message format — why getting rival banks to agree on it was a genuine breakthrough, and how a format built for the telex age started breaking the moment a payment needed to carry more than a few fixed characters.',
    body: `<blockquote><p>For most of the last century, moving money between two banks meant a person typing the instruction out by hand and trusting that the bank at the other end would read it exactly the same way. What finally got hundreds of rival banks, in dozens of countries, to agree on one way of saying <strong>&ldquo;pay this&rdquo;</strong>?</p></blockquote>

<p>By the middle of the twentieth century, banks could already send payment instructions to one another electronically. The trouble was <em>how</em>. The workhorse was the telex — a machine that sent typed messages down a phone line — and every bank wrote its instructions a little differently.</p>

<h2>The age of typing it out by hand</h2>
<p>A telex payment was a paragraph of free text, composed by a clerk and read by another clerk at the far end. There was no fixed shape to it. One bank’s &ldquo;beneficiary&rdquo; was another bank’s &ldquo;payee&rdquo; was a third’s &ldquo;in favour of.&rdquo; To prove a message was genuine, the two banks shared a secret <strong>test key</strong> — a number worked out by hand from the amount and the date — because otherwise anyone could type a convincing fake.</p>
<p>It was slow. It was easy to get wrong. And it did not scale: every new banking relationship meant another pair of clerks learning to read each other’s habits. As cross-border trade exploded, the typing could not keep up.</p>

<h2>The agreement that became a network</h2>
<p>In 1973, two hundred and thirty-nine banks from fifteen countries did something rival institutions almost never do: they agreed on a shared standard, together, and built a cooperative to run it. They named it the Society for Worldwide Interbank Financial Telecommunication — <strong>SWIFT</strong>. By 1977 the first live messages were moving across it.</p>
<p>SWIFT was two things at once. It was a <strong>secure network</strong>, so banks no longer leaned on a hand-worked test key — the network itself vouched for the message. And it was a single <strong>message format</strong>, so &ldquo;pay this&rdquo; finally looked the same whether it left Frankfurt, São Paulo, or Singapore. For the first time, a machine could read a payment instruction without a clerk in the loop.</p>

<h2>The message with a number for a name</h2>
<p>SWIFT’s messages were built from numbered fields, each with one fixed job, grouped into types. Bankers stopped describing a payment in prose and started filling in the same labelled boxes every time. Each message type got a number — and the one that carried a customer’s money from one bank to another, across borders, was the <strong>MT103</strong>.</p>
<p>If you sent money overseas at any point in the last forty years, an MT103 almost certainly carried it. It named the payer, the payee, the banks in between, the amount, and a line for what the payment was for. For a generation, this was how the world moved money. It worked, at enormous scale, for decades.</p>

<h2>The crack already built into it</h2>
<p>But the format had been designed in the telex age, and it carried that age’s biggest limitation: the fields were <strong>small and fixed</strong>. The box for a name was capped at thirty-five characters. A long company name, a name with an address attached, a name in a script that needed more room — all of it got <em>truncated</em>, chopped off at the edge of the box.</p>
<p>On a domestic payment that was an annoyance. On a cross-border payment it was dangerous. Every international payment is screened against sanctions lists, and that screening matches on names. Chop a name in half and the screen can flag the wrong person entirely — or wave through someone it should have stopped. A format built to save space had started quietly breaking the one check a cross-border payment cannot afford to get wrong.</p>

<p class="pullquote" style="margin:36px 0;">&ldquo;The breakthrough and the flaw were the same decision: pack a payment into a handful of tiny, fixed boxes, and make the whole world fill them in the same way.&rdquo;</p>

<p>SWIFT solved the problem this chapter opened with — it got the world to agree on one way to say &ldquo;pay this.&rdquo; But the agreement was frozen in the shape of a 1970s machine, and money was about to start asking it to carry far more than a few fixed characters. The next chapter is about everything that shape could not hold.</p>`
  },
  {
    num: '03', slug: 'problems-with-legacy-standards', status: 'ready', minutes: 8,
    title: 'Problems with Legacy Standards',
    hook: 'A payment for a real, law-abiding company gets stopped at a bank it has never dealt with, held for two days, and finally released by a human reading it line by line — all because the company’s name was a few characters too long for the box it had to fit in. Multiply that by millions of payments a day. What does a format quietly running out of room actually cost?',
    summary: 'The thirty-five-character box, the free-text fields a machine couldn’t read, and the dialects that splintered one standard into many — the real, expensive failures that made patching the old format pointless and a new language unavoidable.',
    earned: 'You can now name the specific, structural reasons the old message format could not be saved — too little room, too little structure, and too many local dialects — and explain why each one cost real money and could not be fixed by widening a field. You understand why the industry concluded it had to change what a financial message <em>is</em>, not just make the boxes bigger.',
    body: `<blockquote><p>A payment for a real, law-abiding company gets stopped at a bank it has never dealt with, held for two days, and finally released by a human reading it line by line — all because the company&rsquo;s name was a few characters too long for the box it had to fit in. Multiply that by millions of payments a day. What does a format quietly running out of room actually <strong>cost</strong>?</p></blockquote>

<p>The last chapter ended on a crack: a message format designed in the telex age, built from small, fixed boxes, just as money was starting to ask it to carry far more. This chapter is about what happened when that crack was put under load — billions of payments a day, every one of them squeezed into a shape designed when a name was thirty-five characters and nothing more.</p>

<h2>The box was always too small</h2>
<p>Start with the limit we already met. A name field capped at thirty-five characters is fine for &ldquo;John Smith&rdquo; and useless for a real corporate payee with a legal name, a trading name, and an address. So the name got <em>chopped</em> — truncated at the edge of the box, or smeared across whatever spare lines a clerk could find.</p>
<p>That is not a cosmetic problem. Every cross-border payment is screened against sanctions lists, and that screening matches on names. A chopped name can flag an innocent party as a suspected match, freezing a legitimate payment for manual review — or, worse, sail a name past the screen because the part that mattered got cut off. A box built to save space was actively breaking the one check a cross-border payment cannot afford to get wrong.</p>

<h2>The machine could not read what the human wrote</h2>
<p>The deeper failure was not size — it was <strong>structure</strong>, or the lack of it. Much of what a payment needs to say got dumped into a few lines of free text: what the payment was for, which invoices it settled, the payer&rsquo;s full address. A person could read those lines and understand them. A computer could not.</p>
<p>So a payment would arrive, the money would land, and the receiving company&rsquo;s system still could not tell <em>which</em> of forty open invoices it had just paid. Someone had to read the remittance line by eye and reconcile it by hand. The information was technically present and practically invisible — written in prose when the world had started running on data.</p>

<h2>One standard, splintered into dialects</h2>
<p>The original promise was a single way to say &ldquo;pay this&rdquo; the whole world over. But because the format could not grow, every market that needed something it lacked bolted on its own workaround — extra codes hidden in a free-text field, a local convention for cramming an address somewhere it would fit, a national variant with its own private rules.</p>
<p>The shared standard quietly fragmented into <em>dialects</em>. A message leaving one country was technically valid and still misread in another, because the two ends had each patched the same gaps in different ways. The one thing the format existed to prevent — banks reading the same instruction differently — had crept back in through the patches.</p>

<h2>The hidden tax nobody chose to pay</h2>
<p>Every one of these gaps was paid for, just not on any invoice. Banks ran whole departments — <strong>repair desks</strong> — whose job was to catch the payments a machine could not process and fix them by hand. The industry measured its own health by <em>straight-through processing</em>: the share of payments that made it end to end without a human touching them. Every truncated name, every unreadable remittance line, every dialect mismatch was a payment that fell out of automation and onto someone&rsquo;s desk — slower, costlier, and more error-prone with every touch.</p>

<h2>Why you couldn&rsquo;t just make the boxes bigger</h2>
<p>The obvious fix — widen the name field, add a structured address, leave room for an invoice list — was the one fix that could not be made. The old messages were rigid by design: systems all over the world parsed them by counting characters and trusting that a given field sat in a given place. Make one box bigger and you shift everything after it, breaking every system downstream that expected the old shape.</p>
<p>The format had no room to grow because growth was the one thing it was built to forbid. You could not evolve it. You could only replace it — and to replace it, the industry first had to admit the problem was never the size of the boxes.</p>

<p class="pullquote" style="margin:36px 0;">&ldquo;The flaw was never that the boxes were too small. It was that a payment had been treated as text to type, when it had become data to process.&rdquo;</p>

<p>That was the realisation that ended the era of patching. The trouble was not a field here or a limit there; it was the whole idea of describing money as a few lines of fixed text. Fixing that meant rethinking what a financial message fundamentally <em>is</em>. The next chapter is about the moment the industry finally did.</p>`
  },
  {
    num: '04', slug: 'birth-of-iso-20022', status: 'ready', minutes: 9,
    title: 'The Birth of ISO 20022',
    hook: 'By the early 2000s the industry faced a choice it had spent a decade avoiding: keep patching a message format built for a 1970s machine, or stop, and design the thing properly — once, for everyone, for good. What does it actually look like when an entire industry decides to start over?',
    summary: 'Not a bigger box but a different idea: separate what a payment means from how it is written down, agree the meaning once in a shared dictionary, and let any message be built from it. The structured answer to every limit the last two chapters named.',
    earned: 'You can now explain what ISO 20022 actually is — not merely a new message format but a shared way of agreeing what financial information <em>means</em>, kept in a central dictionary and reused everywhere — and you can trace each of its core ideas back to a specific failure of the old standard it was built to fix.',
    body: `<blockquote><p>By the early 2000s the industry faced a choice it had spent a decade avoiding: keep patching a message format built for a 1970s machine, or stop, and design the thing properly — once, for everyone, for good. What does it actually look like when an entire industry decides to <strong>start over</strong>?</p></blockquote>

<p>Every problem in the last chapter pointed the same way. The truncated name, the remittance no machine could read, the dialects that splintered one standard into many — none of them could be fixed by making a box bigger, because they were all symptoms of the same root cause. A payment had been treated as a few lines of text to type, when it had long since become structured data to process. So in 2004 the industry stopped patching the text and published something different in kind: <strong>ISO 20022</strong>.</p>

<h2>Fix the meaning, not the syntax</h2>
<p>The breakthrough was an idea so simple it is easy to miss. Pull apart two things the old standard had welded together: <em>what a payment means</em>, and <em>how it is written down</em>.</p>
<p>The old format fused them — the meaning of a field <em>was</em> its position and length in the message. Change the writing and you changed the meaning; you couldn&rsquo;t touch one without breaking the other. ISO 20022 separates them. First the industry agrees, in plain business terms, what a payment <em>is</em> — a debtor, a creditor, an amount, a purpose, a structured address. Only then is that meaning written down. Get the meaning right once, and the way it&rsquo;s written can change without the meaning shifting underneath it.</p>

<h2>A shared dictionary before a single message</h2>
<p>So ISO 20022 is not, at heart, a message. It is a <strong>dictionary</strong>. Every concept finance uses — a party, an account, an amount, a date, a purpose — is defined once, precisely, in a central repository everyone draws from. A &ldquo;creditor&rdquo; means the same thing in a payment, a securities trade, and a direct debit, because all three reach for the same definition in the same shared book.</p>
<p>This is the direct answer to the dialects of the last chapter. When everyone builds from one agreed dictionary, a message leaving one country means exactly what it means arriving in another — not because the two ends patched the gaps the same way by luck, but because there were no gaps to patch.</p>

<h2>A recipe for messages, not one message</h2>
<p>Because it starts from shared definitions, ISO 20022 is really a <em>method</em> for building messages, not a single message format. The same dictionary that describes a customer credit transfer also describes a bank-to-bank settlement, a securities trade, a card transaction, a cash-management report. One way of working, spanning the whole financial industry — where the old standard had really only ever been about payments.</p>
<p>That is why the messages have those structured family names — <strong>pacs</strong>, <strong>pain</strong>, <strong>camt</strong> and the rest. Each name is not an arbitrary code but an address into the dictionary: a family, a function, a version. Later chapters in the Library take each family apart; here, the point is only that they all descend from one shared model rather than a pile of separate formats.</p>

<h2>Finally, room to say what you mean</h2>
<p>Everything the old format could not hold, ISO 20022 makes a first-class citizen. A name has room to be a full legal name. An address is <em>structured</em> — street, town, country in their own labelled fields — instead of smeared across free text. The reason for a payment is a defined purpose, not a hopeful note. The invoices being settled are listed as data a machine can read and reconcile on its own.</p>
<p>Written out, a single payment becomes far longer and more verbose than its terse predecessor — and that verbosity is the entire point. Every piece of meaning is labelled and in its own place, so a computer at the far end can read it without a clerk translating. The richness the old repair desks supplied by hand is now carried inside the message itself.</p>

<h2>A standard that is allowed to grow</h2>
<p>And because meaning and writing are separate, the standard can finally <em>evolve</em>. New needs are added to the dictionary and new versions of a message published, in the open, through a governed central registry — without shattering everything downstream the way widening a fixed box once did. The frozen format that could only be replaced was succeeded by a living one designed to change. That is not a footnote; it is the property the old world lacked most.</p>

<p class="pullquote" style="margin:36px 0;">&ldquo;ISO 20022 was never a bigger box. It was the decision to agree what money <em>means</em> before arguing about how to write it down.&rdquo;</p>

<p>So ISO 20022 is best understood not as a new file to send, but as a shared language with a shared dictionary behind it — the structured answer to every limit the last two chapters laid out. Inventing the language, though, is not the same as the world actually speaking it. The final chapter of this history is about the slow, deadline-driven migration of the entire planet&rsquo;s payments onto it — and why, after twenty years, the moment finally arrived.</p>`
  },
  {
    num: '05', slug: 'global-migration-timeline', status: 'ready', minutes: 9,
    title: 'The Global Migration Timeline',
    hook: 'A finished language can sit on a shelf for twenty years and change nothing — because a language only works when the person on the other end speaks it too. So how do you get every bank, every market, and every central system on the planet to start speaking the same one, all at roughly the same time?',
    summary: 'Inventing the language was the easy part; getting the whole world to speak it took two decades and a wall of hard deadlines. Why a standard is worthless until everyone adopts it, how the migration rolled out market by market, and why the cutover finally became unavoidable.',
    earned: 'You can now explain why a finished standard still took twenty years to take hold — the network effect that leaves a payment language worthless until everyone speaks it — and you can trace how the migration actually happened: the systems born fluent, the coordinated cutover of the world’s big payment infrastructures, and why running two languages at once eventually cost more than switching to one.',
    body: `<blockquote><p>A finished language can sit on a shelf for twenty years and change nothing — because a language only works when the person on the other end speaks it too. So how do you get every bank, every market, and every central system on the planet to start speaking the same one, all at roughly the same <strong>time</strong>?</p></blockquote>

<p>The last chapter ended with a language invented: a shared dictionary, structured meaning, room to say what a payment actually is. But inventing a language and getting the world to speak it are not the same act. The dictionary was published in 2004. For most of the next decade, almost nothing visibly changed — and that gap, between a standard existing and a standard being <em>used</em>, is the whole subject of this final chapter.</p>

<h2>A language nobody else speaks is just noise</h2>
<p>The reason adoption was slow is the same reason it was always going to be slow: a payment language is worth nothing until the other end speaks it too. If one bank sends a rich, structured message to a bank that can only read the old format, the richness is wasted — or the message bounces. The value of the new standard does not arrive gradually as each bank joins. It arrives all at once, when <strong>enough</strong> of them have joined that you can count on the other end understanding you.</p>
<p>This is the trap every shared standard sits in. No single bank gains much by going first, and going first is expensive — new systems, retrained staff, years of testing. So for a long time the rational move for everyone was to wait. The language existed; the incentive to actually switch did not.</p>

<h2>The early speakers: systems born fluent</h2>
<p>The first real momentum came not from old banks converting, but from <em>new</em> systems built fluent in the language from day one. As countries stood up modern instant-payment schemes — money moving between people in seconds, at any hour — they had a blank slate and no legacy format to protect. They simply adopted ISO 20022 as their native tongue from the start.</p>
<p>That mattered out of proportion to its size. Every system born fluent raised the number of institutions that could already speak the new language, and so lowered the cost — and the risk — for the next one deciding whether to follow. The network was quietly filling up with speakers before the giants had moved at all.</p>

<h2>Then the big infrastructures switched</h2>
<p>The turning point was the core market infrastructures — the central, high-value settlement systems that whole economies route their largest payments through. Around 2023 the dominoes started to fall together: the eurozone moved its main settlement system onto the standard, the United Kingdom migrated its high-value payment system, and the global cross-border network opened a <strong>coexistence window</strong> in which banks could send either the old format or the new one while everyone finished moving.</p>
<p>Coexistence sounds gentle, and it is the only safe way to migrate something this critical — you cannot switch the entire planet overnight. But it is also a deliberate trap with a closing date. Running both languages at once is the most expensive state of all: every institution has to maintain two systems, and a payment in the new format still loses its richness the moment it has to be translated down for someone who hasn’t moved. Coexistence is tolerable only because everyone knows it ends.</p>

<h2>The deadline did the work</h2>
<p>That is why this story is really a story about <em>deadlines</em>. A standard cannot rely on goodwill to cross the finish line, because the laggards have every reason to keep waiting. So the industry did the one thing that breaks the stalemate: it set hard dates and made them stick. The cross-border coexistence window was given a firm end — late 2025 — after which the old format would no longer be accepted for those payments. National infrastructures set their own cutover dates and held them; the United States moved its main high-value system onto the standard in 2025.</p>
<p>A deadline changes the arithmetic for everyone. The day the end date became real, waiting stopped being the cheap option and became the expensive one — the bank that hadn’t moved was now the bank about to be unable to send a payment. Two decades of rational hesitation collapsed into a few coordinated years, because a date on a calendar finally made going last more costly than going early.</p>

<h2>Why now, and not in 2004</h2>
<p>So why did the deadlines finally bite, after years of being quietly slipped? Three pressures that weren’t there at the start had converged. The <strong>cost of the old world</strong> had compounded — every repair desk, every truncated name, every reconciliation done by hand was a bill the industry had been paying for decades, and it finally outweighed the cost of changing. <strong>Regulation and compliance</strong> had hardened: sanctions screening depends on complete, structured names and addresses — exactly what the old format mangled and the new one carries cleanly — so richer data stopped being a nicety and became a requirement. And the <strong>technology to handle it</strong> had become cheap: the verbose, structured messages that would have strained a 1970s system are trivial for modern infrastructure to store and process.</p>
<p>None of those forces existed in 2004. The language had to wait for the world to need it badly enough — and to be able to afford it — before the world would agree, all at once, to speak it.</p>

<p class="pullquote" style="margin:36px 0;">&ldquo;A standard doesn’t win by being better. It wins the day staying on the old one costs more than moving to the new one — and a deadline is how the industry made that day arrive.&rdquo;</p>

<p>And that is where the history closes, and the rest of this academy begins. Five chapters, one continuous problem: value learned to travel as information, the world agreed on one way to write that information down, the first agreement aged into a cage, a richer language was invented to replace it, and — finally, on a deadline — the world actually started speaking it. That language is no longer the future. It is the system running underneath the payment you’ll make today. From here, the Library takes it apart piece by piece, and the Playground lets you work with it directly — because now that you know <em>why</em> it exists, you’re ready to see <em>how</em> it works.</p>`
  }
];

function getHistoryChapter(slug){
    return HISTORY_CHAPTERS.find(function(c){ return c.slug === slug; }) || null;
}

function historyChapterCardsHtml(){
    const arrow = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    return HISTORY_CHAPTERS.map(function(ch){
        const ready = ch.status === 'ready';
        const watch = ch.youtube ? '<span class="learn-card-watch">&#9654; Watch</span>' : '';
        const top = ready
            ? '<span class="learn-card-min">' + ch.minutes + ' min read</span>'
            : '<span class="learn-card-status">Coming soon</span>';
        const open = ready ? "openHistoryChapter('" + ch.slug + "')" : '';
        const handlers = ready
            ? ' role="button" tabindex="0" onclick="' + open + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + open + '}"'
            : ' aria-disabled="true"';
        return '<article class="learn-card' + (ready ? '' : ' is-draft') + '"' + handlers + '>'
            + '<div class="learn-card-top"><span class="learn-card-num">' + ch.num + '</span>' + top + '</div>'
            + '<h4 class="learn-card-title">' + ch.title + '</h4>'
            + '<p class="learn-card-summary">' + ch.summary + '</p>'
            + '<div class="learn-card-foot"><div class="learn-tags"><span class="learn-tag">Chapter ' + ch.num + '</span>' + watch + '</div>'
            + (ready ? '<span class="learn-card-go" aria-hidden="true">' + arrow + '</span>' : '')
            + '</div></article>';
    }).join('');
}

// Append the chapter index to the History landing (idempotent). Reuses the
// existing learn-head + learn-grid + learn-card styling — no new CSS.
function renderHistoryChapterIndex(){
    const pageEl = document.querySelector('#content .page');
    if (!pageEl || document.getElementById('history-chapter-grid')) return;
    const section = document.createElement('section');
    section.className = 'reveal-section';
    section.style.cssText = 'max-width:1180px; margin:clamp(90px,16vw,160px) auto 0;';
    section.innerHTML =
        '<div class="learn-head" data-reveal-group>'
        + '<div class="eyebrow" data-reveal="fade">The History, in chapters</div>'
        + '<h2 class="section-title" data-reveal="up">Read it as a story, in order.</h2>'
        + '<p class="section-description" data-reveal="up">Five chapters, each one the consequence of the last — from the first time value had to travel without the thing itself, to the language the world speaks now. Two are ready to read; the rest are landing soon.</p>'
        + '</div>'
        + '<div class="learn-grid" style="margin-top:32px;" id="history-chapter-grid">' + historyChapterCardsHtml() + '</div>';
    pageEl.appendChild(section);
    // Compliance calendar is the LAST section — the "what's next" coda after the history.
    if (typeof Deadlines !== 'undefined' && Deadlines.mount) Deadlines.mount(pageEl);
}

// Build the prev/next reader nav (shared `pager` control, added 1.4).
function historyPagerHtml(index){
    const prev = HISTORY_CHAPTERS[index - 1];
    const next = HISTORY_CHAPTERS[index + 1];
    function side(ch, dir){
        const dirLabel = dir === 'prev' ? '← Previous' : 'Next →';
        const cls = 'pager-link pager-' + dir;
        if (!ch){
            const label = dir === 'prev' ? 'You’re at the beginning' : 'More chapters soon';
            return '<span class="' + cls + ' pager-disabled"><span class="pager-dir">' + dirLabel + '</span><span class="pager-label">' + label + '</span></span>';
        }
        if (ch.status !== 'ready'){
            return '<span class="' + cls + ' pager-disabled"><span class="pager-dir">' + dirLabel + '</span><span class="pager-label">' + ch.title + ' &middot; Coming soon</span></span>';
        }
        return '<a class="' + cls + '" href="#/history/' + ch.slug + '" onclick="openHistoryChapter(\'' + ch.slug + '\', event)"><span class="pager-dir">' + dirLabel + '</span><span class="pager-label">' + ch.title + '</span></a>';
    }
    return '<nav class="pager" aria-label="History chapters">' + side(prev, 'prev') + side(next, 'next') + '</nav>';
}

// A chapter can carry an illustration video. Set `youtube: '<videoId>'` on the
// chapter in HISTORY_CHAPTERS and a privacy-friendly player appears at the top.
function historyVideoHtml(ch){
    if (!ch.youtube) return '';
    const id = String(ch.youtube).trim();
    return '<div class="chapter-video">'
        + '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '" title="' + ch.title + ' — illustrated"'
        + ' loading="lazy" frameborder="0"'
        + ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"'
        + ' referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>';
}

function historyChapterHtml(ch, index){
    const back = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
    return ''
        + '<div class="page">'
        +   '<article class="article-page">'
        +     '<button class="article-back" onclick="goToHistoryLanding(event)">' + back + ' The History</button>'
        +     '<header class="article-head">'
        +       '<div class="article-kicker"><span class="article-level-pill">Chapter ' + ch.num + ' &middot; History</span>'
        +         '<span class="article-min">' + ch.minutes + ' min read</span></div>'
        +       '<h1 class="article-title">' + ch.title + '</h1>'
        +       '<p class="article-standfirst">' + ch.hook + '</p>'
        +     '</header>'
        +     historyVideoHtml(ch)
        +     '<div class="md-body">' + ch.body + '</div>'
        +     '<div class="article-earned"><div class="article-earned-badge">You can now</div><p>' + ch.earned + '</p></div>'
        +     historyPagerHtml(index)
        +   '</article>'
        + '</div>';
}

function renderHistoryChapter(slug){
    const content = document.getElementById('content');
    const index = HISTORY_CHAPTERS.findIndex(function(c){ return c.slug === slug; });
    const ch = HISTORY_CHAPTERS[index];
    if (!content) return;
    if (!ch || ch.status !== 'ready'){ navigate('history'); return; }

    closeDetailPanel();
    window.scrollTo({ top: 0, behavior: 'auto' });

    // Record reading context so the header arrows step between chapters.
    window.__currentHistory = slug;
    window.__currentArticle = null;

    // Keep History lit in the global nav while reading a chapter.
    document.querySelectorAll('.nav-item').forEach(function(i){ i.classList.remove('active'); });
    const hNav = document.querySelector('.nav-item[data-page="history"]');
    if (hNav) hNav.classList.add('active');
    if (typeof moveNavIndicator === 'function') moveNavIndicator();
    if (typeof updateNavArrows === 'function') updateNavArrows();

    content.innerHTML = historyChapterHtml(ch, index);
    initRevealAnimations();
    if (window.Motion) Motion.scan(content);
}

// Open a chapter. Drives the URL hash so the view is shareable; the hashchange
// listener is the single renderer, except on a same-hash re-open (deep link).
function openHistoryChapter(slug, evt){
    if (evt) evt.preventDefault();
    const ch = getHistoryChapter(slug);
    if (!ch || ch.status !== 'ready') return;
    const target = '#/history/' + slug;
    if (location.hash === target) renderHistoryChapter(slug);
    else location.hash = target;
}

// Leave a chapter for the History landing. navigate('history') clears the hash.
function goToHistoryLanding(evt){
    if (evt) evt.preventDefault();
    navigate('history');
}

// Single hash router for browser-driven changes (manual URL edit, back/forward,
// and the location.hash assignments in openHistoryChapter / gotoGlossaryTerm).
// navigate() and the sync helpers use replaceState, so they never land here —
// no render loop.
window.addEventListener('hashchange', function(){
    setTimeout(stripHash, 0); // scrub the bar after this handler finishes rendering
    const h = location.hash || '';
    const mh = h.match(/^#\/history\/([a-z0-9-]+)$/);
    if (mh) { renderHistoryChapter(mh[1]); return; }
    if (/^#\/history$/.test(h)) {
        if (currentNavPage() !== 'history' || document.querySelector('.article-page')) navigate('history');
        return;
    }
    if (/^#\/glossary(\/|\?|$)/.test(h)) {
        if (currentNavPage() !== 'glossary') navigate('glossary');
        else { applyGlossaryHash(); renderGlossary(); }
        return;
    }
    const mp = h.match(/^#\/playground\/([a-z0-9-]+)$/);
    if (mp) { openPlaygroundTool(mp[1]); return; }
    if (/^#\/playground(\?|$)/.test(h)) { if (currentNavPage() !== 'playground') navigate('playground'); return; }
    const ml = h.match(/^#\/library\/([a-z0-9-]+)$/);
    if (ml && typeof getArticle === 'function' && getArticle(ml[1])) { openArticle(ml[1]); return; }
    if (/^#\/library(\/|\?|$)/.test(h)) { if (currentNavPage() !== 'library') navigate('library'); return; }
});

// First paint: honor a deep-linked chapter, otherwise open the History landing.
function routeOnLoad(){
    setTimeout(stripHash, 0); // honor the deep link below, then scrub the bar
    const h = location.hash || '';
    const mh = h.match(/^#\/history\/([a-z0-9-]+)$/);
    const ch = mh && getHistoryChapter(mh[1]);
    if (ch && ch.status === 'ready') { renderHistoryChapter(mh[1]); return; }
    if (/^#\/glossary(\/|\?|$)/.test(h)) { navigate('glossary'); return; }
    const mp = h.match(/^#\/playground\/([a-z0-9-]+)$/);
    if (mp) { openPlaygroundTool(mp[1]); return; }
    if (/^#\/playground(\?|$)/.test(h)) { navigate('playground'); return; }
    const ml = h.match(/^#\/library\/([a-z0-9-]+)$/);
    if (ml && typeof getArticle === 'function' && getArticle(ml[1])) { openArticle(ml[1]); return; }
    if (/^#\/library(\/|\?|$)/.test(h)) { navigate('library'); return; }
    navigate('history');
}

function initRevealAnimations() {
    const sections =
        document.querySelectorAll('.reveal-section');
    const observer =
        new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                    } else {
                        entry.target.classList.remove('in-view');
                    }
                });
            },
            {
                threshold: 0.25
            }
        );
    sections.forEach(section => {
        observer.observe(section);
    });
}
