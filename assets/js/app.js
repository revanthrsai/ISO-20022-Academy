// App Module - Main application logic and navigation

const PAGES = {
    history: `
        <div class="page">
            <section class="hero-stage" data-hero data-mouse-parallax aria-label="ISO Academy introduction">
                <div class="hero-bg" aria-hidden="true">
                    <div class="hero-glow" data-mp-depth="18"></div>
                    <svg class="hero-net" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" data-mp-depth="34">
                        <defs>
                            <radialGradient id="heroNode" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#5EEAD4"/>
                                <stop offset="100%" stop-color="#059669"/>
                            </radialGradient>
                            <linearGradient id="heroFlow" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stop-color="#10B981" stop-opacity="0"/>
                                <stop offset="50%" stop-color="#5EEAD4" stop-opacity="0.9"/>
                                <stop offset="100%" stop-color="#10B981" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                        <g class="hero-rings">
                            <circle cx="600" cy="400" r="250"/>
                            <circle cx="600" cy="400" r="410"/>
                            <circle cx="600" cy="400" r="580"/>
                        </g>
                        <g class="hero-edges">
                            <line x1="150" y1="180" x2="380" y2="120"/>
                            <line x1="150" y1="180" x2="300" y2="360"/>
                            <line x1="380" y1="120" x2="560" y2="300"/>
                            <line x1="300" y1="360" x2="560" y2="300"/>
                            <line x1="300" y1="360" x2="180" y2="560"/>
                            <line x1="560" y1="300" x2="520" y2="540"/>
                            <line x1="560" y1="300" x2="760" y2="180"/>
                            <line x1="520" y1="540" x2="680" y2="640"/>
                            <line x1="760" y1="180" x2="820" y2="440"/>
                            <line x1="760" y1="180" x2="940" y2="120"/>
                            <line x1="820" y1="440" x2="1000" y2="300"/>
                            <line x1="1000" y1="300" x2="1060" y2="560"/>
                            <line x1="820" y1="440" x2="680" y2="640"/>
                            <line x1="1000" y1="300" x2="940" y2="120"/>
                            <line x1="520" y1="540" x2="820" y2="440"/>
                            <line x1="180" y1="560" x2="520" y2="540"/>
                        </g>
                        <g class="hero-flows" stroke="url(#heroFlow)">
                            <line x1="150" y1="180" x2="380" y2="120" class="hero-flow"/>
                            <line x1="380" y1="120" x2="560" y2="300" class="hero-flow" style="animation-delay:1.1s"/>
                            <line x1="560" y1="300" x2="760" y2="180" class="hero-flow" style="animation-delay:2.3s"/>
                            <line x1="760" y1="180" x2="820" y2="440" class="hero-flow" style="animation-delay:0.6s"/>
                            <line x1="820" y1="440" x2="1000" y2="300" class="hero-flow" style="animation-delay:3.1s"/>
                            <line x1="520" y1="540" x2="820" y2="440" class="hero-flow" style="animation-delay:1.8s"/>
                        </g>
                        <g class="hero-nodes">
                            <circle cx="150" cy="180" r="4"/>
                            <circle cx="380" cy="120" r="5" class="node-pulse"/>
                            <circle cx="300" cy="360" r="4"/>
                            <circle cx="560" cy="300" r="6" class="node-pulse" style="animation-delay:1.4s"/>
                            <circle cx="520" cy="540" r="4"/>
                            <circle cx="760" cy="180" r="5" class="node-pulse" style="animation-delay:0.7s"/>
                            <circle cx="820" cy="440" r="5" class="node-pulse" style="animation-delay:2.1s"/>
                            <circle cx="1000" cy="300" r="6" class="node-pulse" style="animation-delay:2.8s"/>
                            <circle cx="1060" cy="560" r="4"/>
                            <circle cx="180" cy="560" r="4"/>
                            <circle cx="680" cy="640" r="5" class="node-pulse" style="animation-delay:3.4s"/>
                            <circle cx="940" cy="120" r="4"/>
                        </g>
                    </svg>
                    <div class="hero-vignette"></div>
                </div>

                <div class="hero-inner">
                    <div class="hero-eyebrow hl-line"><span class="hero-eyebrow-dot"></span>Interactive Academy &middot; ISO&nbsp;20022</div>
                    <h1 class="hero-headline">
                        <span class="hl-line">How money moves</span>
                        <span class="hl-line">around the <span class="gradient-text">world.</span></span>
                    </h1>
                    <p class="hero-sub hl-line">
                        Not documentation &mdash; an interactive documentary. Follow a single payment across
                        banks, borders and systems, and discover the hidden language that lets the world&rsquo;s
                        financial system speak as one: <strong>ISO&nbsp;20022</strong>.
                    </p>
                    <div class="hero-cta hl-line">
                        <button class="btn" data-magnetic onclick="navigate('journey', event)">Start the Journey <span class="btn-arrow">&rarr;</span></button>
                        <button class="btn btn-ghost" onclick="window.scrollTo({top: (document.querySelector('.story-section')||{}).offsetTop - 60, behavior:'smooth'})">Explore the story</button>
                    </div>
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

            <section class="story-section reveal-section">
                <p class="pullquote" data-reveal="blur">&ldquo;Imagine a world that never learned to speak the same financial language.&rdquo;</p>
            </section>

            <div class="history-cinematic-break cinematic-scene reveal-section" id="history-cinematic-break">
                <div class="cinematic-flow" aria-hidden="true">
                    <span class="cinematic-node">London</span>
                    <span class="cinematic-wire"><i class="cinematic-pulse"></i></span>
                    <span class="cinematic-node">New York</span>
                    <span class="cinematic-wire"><i class="cinematic-pulse" style="animation-delay:1.1s"></i></span>
                    <span class="cinematic-node">Singapore</span>
                    <span class="cinematic-wire"><i class="cinematic-pulse" style="animation-delay:2.2s"></i></span>
                    <span class="cinematic-node">Mumbai</span>
                </div>

                <figure class="cinematic-video is-loading" id="cinematic-video">
                    <video class="cinematic-video-el" id="history-break-video"
                           muted loop playsinline preload="metadata" disablepictureinpicture
                           poster="assets/video/iso-history-poster.jpg"
                           data-src="assets/video/iso-history.mp4"></video>
                    <div class="cinematic-video-tint" aria-hidden="true"></div>
                    <div class="cinematic-video-vignette" aria-hidden="true"></div>
                    <div class="cinematic-video-feather" aria-hidden="true"></div>
                    <div class="cinematic-video-fallback" aria-hidden="true">
                        <span class="cinematic-fallback-pulse"></span>
                        <span class="cinematic-slot-note">Cinematic footage appears here once <code>assets/video/iso-history.mp4</code> is added</span>
                    </div>
                </figure>

                <div class="cinematic-caption">
                    <div class="eyebrow eyebrow-center">Establishing shot</div>
                    <p>Money moving across the world, in real time.</p>
                </div>
            </div>

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

            <section class="story-section reveal-section">
                <div class="story-year" data-reveal="fade">Today</div>
                <h2 data-reveal="up">You've seen how we got here.<br>Now see how it <span class="gradient-text">runs today.</span></h2>
                <p class="pullquote" data-reveal="blur" style="margin-top:24px;">&ldquo;2004 gave the industry one shared language. Below, that language is organized into the core domains running the world's financial system right now.&rdquo;</p>
                <div data-reveal="up" data-reveal-delay="160" style="margin-top:36px;">
                    <button class="btn" data-magnetic onclick="navigate('journey', event)">Start the Learning Journey <span class="btn-arrow">&rarr;</span></button>
                </div>
            </section>

        </div>

        <div class="scroll-cue" id="scroll-cue">
            <span class="scroll-cue-label">Scroll</span>
            <span class="scroll-cue-chevron">&#8595;</span>
        </div>
    `,
    journey: `
        <!-- Roadmap pipeline, or the split-screen lesson once a pillar is opened, is rendered by renderRoadmapView() / loadLessonModule() in ui.js -->
    `,
    playground: `
        <div class="page">
            <div class="pg-head" data-reveal-group>
                <div class="eyebrow" data-reveal="fade">Playground</div>
                <h2 class="section-title" data-reveal="up">Watch one message become another.</h2>
                <p class="section-description" data-reveal="up">
                    The same payment, two languages. Edit the old SWIFT <strong>MT103</strong> on the left and the
                    <strong>ISO&nbsp;20022 pacs.008</strong> rebuilds live on the right &mdash; field by field, meaning preserved.
                    Flip it to plain English, hover a field to see where it lands, and watch the validator catch exactly
                    what breaks.
                </p>
            </div>

            <div class="pg-lab" id="pg-lab" data-reveal="up"></div>

            <div class="pg-soon" data-reveal="up">
                <span class="pg-soon-badge">Coming next</span>
                <p>This is Bob&rsquo;s real $400 transfer, converted live. Next up: serial vs. cover-payment routing across
                multiple banks, and broken-payload &ldquo;schema repair&rdquo; challenges.</p>
            </div>
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
            <div class="glossary-grid" id="glossary-grid"></div>
        </div>
    `
};

function navigate(page, evt) {
    const content = document.getElementById('content');
    const navItems = document.querySelectorAll('.nav-item');
    const triggerEl = (evt && evt.target.closest('.nav-item')) || document.querySelector(`.nav-item[data-page="${page}"]`);

    if (evt) evt.preventDefault();

    // Update active nav + slide the indicator
    navItems.forEach(item => item.classList.remove('active'));
    if (triggerEl) triggerEl.classList.add('active');
    moveNavIndicator();

    // Close detail panel
    closeDetailPanel();

    // Scroll to top for a clean scene change (the page fades in)
    window.scrollTo({ top: 0, behavior: 'auto' });

    // Load page
    content.innerHTML = PAGES[page];

    // Run page-specific initialization
    if (page === 'journey') {
        renderRoadmapView();
    } else if (page === 'glossary') {
        renderGlossary();
    } else if (page === 'playground') {
        initPlayground();
    } else if (page === 'history') {
        initScrubTimeline();
        initRevealAnimations();
        initStatCounters();
        initScrollCue();
        initBackgroundVideos();
    }

    // Hand the freshly-rendered subtree to the shared motion engine.
    if (window.Motion) Motion.scan(content);
}

// Full-bleed background video (mid-page cinematic break): plays only while
// the section is actually on screen, starting once the user scrolls it into
// view and pausing once scrolled past -- no need for a separate timer-based
// fade.
// Cinematic establishing-shot video. Loads lazily from data-src, blends into
// the page (the fallback CSS scene shows until/unless the file is available),
// plays only while in view, and respects reduced-motion (first frame, no
// autoplay). If the file is missing, the layout is untouched — the ambient
// fallback scene simply remains.
function initBackgroundVideos() {
    const figure = document.getElementById('cinematic-video');
    const video = document.getElementById('history-break-video');
    if (!figure || !video) return;

    const reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Wire the source from data-src (kept off `src` so nothing fetches until
    // we decide to). preload="metadata" so only headers/first frame load now.
    const src = video.getAttribute('data-src');
    if (src && !video.src) video.src = src;

    let ready = false;

    function markReady() {
        if (ready) return;
        ready = true;
        figure.classList.remove('is-loading');
        figure.classList.add('has-video');     // fades the real video in over the fallback
    }
    function markFailed() {
        // File missing/unsupported — keep the graceful fallback scene.
        figure.classList.remove('has-video');
        figure.classList.add('is-loading', 'no-video');
    }

    // A frame is available to show.
    video.addEventListener('loadeddata', markReady, { once: true });
    video.addEventListener('canplay', markReady, { once: true });
    // Missing file or decode failure → fallback.
    video.addEventListener('error', markFailed, { once: true });
    video.addEventListener('stalled', () => { if (!ready) markFailed(); });

    if (reduce) {
        // Reduced motion: show the first frame, never autoplay.
        video.removeAttribute('loop');
        video.addEventListener('loadeddata', () => {
            try { video.currentTime = 0.05; } catch (e) {}
            video.pause();
        }, { once: true });
        video.load();
        return;
    }

    // Play only while the establishing shot is on screen.
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (ready) figure.classList.add('is-revealed');
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.3 });
    observer.observe(figure);

    // Reveal the figure when it enters view even before the video is ready
    // (the fallback scene gets the same gentle fade-in / scale settle).
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.25 });
    revealObs.observe(figure);

    // Kick off the load.
    video.load();
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
function initScrubTimeline() {
    const entries = document.querySelectorAll('.scrub-entry[data-history]');
    if (!entries.length) return;

    const pinYear = document.getElementById('scrub-pin-year');
    const pinIndex = document.getElementById('scrub-pin-index');
    const pinProgress = document.getElementById('scrub-pin-progress');
    const total = entries.length;

    function setActive(target) {
        entries.forEach(el => el.classList.remove('active'));
        target.classList.add('active');

        const idx = Array.prototype.indexOf.call(entries, target);
        if (pinYear) pinYear.textContent = target.dataset.year || '';
        if (pinIndex) pinIndex.textContent = String(idx + 1).padStart(2, '0');
        if (pinProgress) pinProgress.style.width = `${((idx + 1) / total) * 100}%`;
    }

    const observer = new IntersectionObserver((items) => {
        items.forEach(item => {
            if (item.isIntersecting) {
                setActive(item.target);
            }
        });
    }, { threshold: 0, rootMargin: '-45% 0px -45% 0px' });

    entries.forEach(el => observer.observe(el));

    // Make sure the first entry is active immediately on load.
    setActive(entries[0]);
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    navigate('history');
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
