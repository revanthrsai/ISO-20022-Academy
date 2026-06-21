// App Module - Main application logic and navigation

const PAGES = {
    history: `
        <div class="page">
			<section class="story-section reveal-section">
				<div class="story-year">1970s</div>
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

				<p>
					International payments depended on telex networks, manual processing,
					and fragmented standards. Every institution interpreted data differently.
				</p>
			</section>

			<section class="story-section reveal-section">
				<div class="story-year">The Problem</div>
				<h2>Money could travel globally.<br>Information <span class="gradient-text">could not.</span></h2>
				<p>
					Payments crossed borders every day, but their underlying data remained
					inconsistent, incomplete, and difficult for machines to understand.
				</p>
			</section>

			<section class="story-section reveal-section">
				<div class="story-year">The Need</div>
				<h2>The world needed a <span class="gradient-text">common financial language.</span></h2>
				<section class="iso-birth reveal-section">
				<div class="iso-year">
					2004
				</div>
				<div class="iso-name">
					ISO 20022
				</div>
				<div class="iso-tagline">
					A universal language for global finance
				</div>
			</section>
				<p>
					A language that every bank, clearing house, payment processor,
					and regulator could understand.
				</p>
			</section>

            <div class="scrub-section" id="scrub-section">
                <div class="scrub-pin">
                    <div class="scrub-pin-eyebrow">Timeline</div>
                    <div class="scrub-pin-year" id="scrub-pin-year">1973</div>
                    <div class="scrub-pin-track"><div class="scrub-pin-progress" id="scrub-pin-progress"></div></div>
                    <div class="scrub-pin-count"><strong id="scrub-pin-index">01</strong> / 07</div>
                </div>

                <div class="scrub-entries" id="scrub-entries">
                    <div class="scrub-entry" data-history data-year="1973">
                        <div class="scrub-entry-year">1973</div>
                        <h3 class="scrub-entry-title">SWIFT is founded</h3>
                        <p class="scrub-entry-desc">239 banks across 15 countries agree on one thing: telex messaging for international payments is slow, insecure, and impossible to scale. <strong>SWIFT</strong> is born to replace it with a shared electronic network.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="1977">
                        <div class="scrub-entry-year">1977</div>
                        <h3 class="scrub-entry-title">SWIFT MT goes live</h3>
                        <p class="scrub-entry-desc">The first SWIFT messages flow between banks using the <strong>MT (Message Type)</strong> format — fixed-width, terse, and built for the bandwidth of its era. It becomes the backbone of global banking for the next 40+ years.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="2004">
                        <div class="scrub-entry-year">2004</div>
                        <h3 class="scrub-entry-title">ISO 20022 is introduced</h3>
                        <p class="scrub-entry-desc">As payment volumes and complexity grow, the industry needs more than fixed fields. <strong>ISO 20022</strong> arrives as an XML-based standard — structured, extensible, and readable by both machines and humans.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="2018">
                        <div class="scrub-entry-year">2018</div>
                        <h3 class="scrub-entry-title">Migration is announced</h3>
                        <p class="scrub-entry-desc">SWIFT formally announces the industry-wide shift from MT to <strong>ISO 20022 MX</strong> for cross-border payments — beginning the largest coordinated messaging migration in banking history.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="2022">
                        <div class="scrub-entry-year">2022</div>
                        <h3 class="scrub-entry-title">Coexistence period begins</h3>
                        <p class="scrub-entry-desc">Banks run <strong>MT and MX side by side</strong>. Translation layers, mapping engines, and transformation adapters — like the ones built at companies such as Volante — become critical infrastructure during this window.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="2023&ndash;25">
                        <div class="scrub-entry-year">2023&ndash;2025</div>
                        <h3 class="scrub-entry-title">CBPR+ becomes mandatory</h3>
                        <p class="scrub-entry-desc"><strong>CBPR+</strong> (Cross-Border Payments and Reporting Plus) sets the rulebook for how ISO 20022 is implemented globally for correspondent banking, with phased mandatory adoption across major currencies.</p>
                    </div>

                    <div class="scrub-entry" data-history data-year="2025+">
                        <div class="scrub-entry-year">2025+</div>
                        <h3 class="scrub-entry-title">Legacy MT is phased out</h3>
                        <p class="scrub-entry-desc">SWIFT MT messages for cross-border payments are retired. <strong>ISO 20022</strong> becomes the de facto global language for CAMT, PACS, PAIN and beyond — not an upgrade anymore, but the standard itself.</p>
                    </div>
                </div>
            </div>

            <div class="history-video-section">
                <div class="history-video-eyebrow">Watch &amp; Listen</div>
                <div class="history-video-title">The Story of ISO 20022</div>
                <p class="history-video-sub">A short visual narration of how global payment messaging evolved — coming soon.</p>

                <div class="video-theatre">
                    <span class="video-badge">Coming Soon</span>
                    <button class="video-play-btn" onclick="alert('This episode is being produced. Check back soon.')" aria-label="Play">
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <span class="video-caption">Episode 1 &middot; The Origins of SWIFT &middot; ~4 min</span>
                </div>
            </div>
        </div>

        <div class="scroll-cue" id="scroll-cue">
            <span class="scroll-cue-label">Scroll</span>
            <span class="scroll-cue-chevron">&#8595;</span>
        </div>
    `,
    explorer: `
        <div class="page">
            <h2 class="section-title">Message Explorer</h2>
            <p class="section-description">
                Select a message family to explore. Click any message to view full details, use cases, and real XML examples.
            </p>
            <!-- Explorer content inserted by renderExplorer() -->
        </div>
    `,
    transformer: `
        <div class="page">
            <h2 class="section-title">Message Transformer</h2>
            <p class="section-description">
                Convert payment messages between different formats. Select source and destination formats to begin transformation.
            </p>

            <div style="max-width: 800px; margin-top: 40px;">
                <div class="grid-2" style="margin-bottom: 32px;">
                    <div>
                        <label style="display: block; font-weight: 600; font-size: 13px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.5px;">Source Format</label>
                        <select class="control-select" style="width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; background-color: var(--surface); color: var(--text); font-size: 14px; cursor: pointer;">
                            <option>Select source format...</option>
                            <option>XML (ISO 20022)</option>
                            <option>JSON</option>
                            <option>CSV</option>
                            <option>SWIFT MT</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-weight: 600; font-size: 13px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.5px;">Destination Format</label>
                        <select class="control-select" style="width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; background-color: var(--surface); color: var(--text); font-size: 14px; cursor: pointer;">
                            <option>Select destination format...</option>
                            <option>XML (ISO 20022)</option>
                            <option>JSON</option>
                            <option>CSV</option>
                            <option>SWIFT MT</option>
                        </select>
                    </div>
                </div>

                <div style="background-color: var(--surface); border: 2px dashed var(--border); border-radius: 12px; padding: 60px 40px; text-align: center; min-height: 300px; display: flex; align-items: center; justify-content: center;">
                    <div>
                        <div style="font-size: 32px; margin-bottom: 16px;">🔄</div>
                        <p style="font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 8px;">Message Transformation</p>
                        <p style="font-size: 14px; color: var(--text-muted);">Select source and destination formats to begin field-by-field mapping.</p>
                    </div>
                </div>

                <div class="highlight-box" style="margin-top: 32px; border-left-color: var(--primary);">
                    <strong style="color: var(--primary);">⏳ Coming Soon</strong> — Full transformer with field-by-field mapping, validation, and real-time conversion between formats.
                </div>
            </div>
        </div>
    `,
    glossary: `
        <div class="page">
            <h2 class="section-title">Glossary</h2>
            <p class="section-description">
                Key terms and definitions for ISO 20022 and payment messaging. Search to find definitions.
            </p>
            <input type="text" class="search-box" id="glossary-search" placeholder="Search glossary..." onkeyup="filterGlossary(this.value)" style="margin-bottom: 32px;">
            <div class="glossary-grid" id="glossary-grid"></div>
        </div>
    `,
    learning: `
        <div class="page">
            <h2 class="section-title">Learning Path</h2>
            <p class="section-description">
                Structured learning modules to master ISO 20022. Each module includes interactive lessons and real-world examples.
            </p>
            <div class="grid-3" style="margin-top: 32px;">
                <div class="card">
                    <div style="font-size: 32px; margin-bottom: 12px;">🌱</div>
                    <div class="card-title">Foundations</div>
                    <div class="card-description">What ISO 20022 is and why it exists.</div>
                    <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Coming Soon</div>
                </div>

                <div class="card">
                    <div style="font-size: 32px; margin-bottom: 12px;">📚</div>
                    <div class="card-title">Message Families</div>
                    <div class="card-description">Deep dive into CAMT, PACS, PAIN, and more.</div>
                    <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Coming Soon</div>
                </div>

                <div class="card">
                    <div style="font-size: 32px; margin-bottom: 12px;">🔧</div>
                    <div class="card-title">Technical Deep Dive</div>
                    <div class="card-description">XML structure and field mappings.</div>
                    <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Coming Soon</div>
                </div>

                <div class="card">
                    <div style="font-size: 32px; margin-bottom: 12px;">💡</div>
                    <div class="card-title">Real-World Scenarios</div>
                    <div class="card-description">Case studies from actual banking systems.</div>
                    <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Coming Soon</div>
                </div>

                <div class="card">
                    <div style="font-size: 32px; margin-bottom: 12px;">🎯</div>
                    <div class="card-title">Implementation</div>
                    <div class="card-description">Build your first ISO 20022 parser.</div>
                    <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Coming Soon</div>
                </div>

                <div class="card">
                    <div style="font-size: 32px; margin-bottom: 12px;">🚀</div>
                    <div class="card-title">Advanced Topics</div>
                    <div class="card-description">Multi-currency and enterprise-scale systems.</div>
                    <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Coming Soon</div>
                </div>
            </div>
        </div>
    `
};

function navigate(page, evt) {
    const content = document.getElementById('content');
    const navItems = document.querySelectorAll('.nav-item');
    const triggerEl = (evt && evt.target) || document.querySelector(`.nav-item[data-page="${page}"]`);

    // Update active nav
    navItems.forEach(item => item.classList.remove('active'));
    if (triggerEl) triggerEl.classList.add('active');

    // Close detail panel
    closeDetailPanel();

    // Load page
    content.innerHTML = PAGES[page];

    // Run page-specific initialization
    if (page === 'explorer') {
        renderExplorer();
    } else if (page === 'glossary') {
        renderGlossary();
    } else if (page === 'history') {
        initScrubTimeline();
		initRevealAnimations();
        initStatCounters();
        initScrollCue();
    }
}

// Scroll cue: a bouncing "scroll" hint pinned to the bottom of the
// viewport on first load. Fades out once the user starts scrolling,
// and clicking it nudges the content area down by one screen.
function initScrollCue() {
    const cue = document.getElementById('scroll-cue');
    const scrollContainer = document.querySelector('.content-area');
    if (!cue || !scrollContainer) return;

    function updateVisibility() {
        const activeCue = document.getElementById('scroll-cue');
        if (!activeCue) return;
        if (scrollContainer.scrollTop > 80) {
            activeCue.classList.add('is-hidden');
        } else {
            activeCue.classList.remove('is-hidden');
        }
    }

    if (!scrollContainer.dataset.scrollCueBound) {
        scrollContainer.dataset.scrollCueBound = '1';
        scrollContainer.addEventListener('scroll', updateVisibility, { passive: true });
    }

    updateVisibility();

    cue.addEventListener('click', function () {
        scrollContainer.scrollBy({ top: scrollContainer.clientHeight * 0.85, behavior: 'smooth' });
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
});

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
