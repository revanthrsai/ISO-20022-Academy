// UI Module - Handle interactive elements and detail panel

function openDetailPanel(messageCode) {
    const message = getMessageByCode(messageCode);
    if (!message) return;

    const panel = document.getElementById('detail-panel');
    panel.classList.add('open');
    panel.dataset.messageCode = messageCode;
    panel.innerHTML = renderDetailPanelTabs(message, 'business');
}

// Detail panel has two tabs: Business View (purpose, direction, use cases --
// understand the message before its payload) and Technical View (fields,
// XML structure -- the MDR-extraction layer surfaces here).
function renderDetailPanelTabs(message, activeTab) {
    return `
        <div class="detail-panel-content">
            <div class="detail-header">
                <div class="detail-title">${message.code}</div>
                <div class="detail-subtitle">${message.subtitle}</div>
            </div>

            <div class="detail-tabs">
                <button class="detail-tab ${activeTab === 'business' ? 'active' : ''}" onclick="switchDetailTab('${message.code}', 'business')">Business View</button>
                <button class="detail-tab ${activeTab === 'technical' ? 'active' : ''}" onclick="switchDetailTab('${message.code}', 'technical')">Technical View</button>
            </div>

            ${activeTab === 'business' ? renderDetailBusinessTab(message) : renderDetailTechnicalTab(message)}
        </div>
    `;
}

function renderDetailBusinessTab(message) {
    return `
        <div class="detail-section">
            <div class="detail-label">Purpose</div>
            <div class="detail-description">${message.purpose}</div>
        </div>

        <div class="detail-section">
            <div class="detail-label">Direction</div>
            <div class="detail-value">${message.direction}</div>
        </div>

        <div class="detail-section">
            <div class="detail-label">Category</div>
            <div class="detail-value">${message.category}</div>
        </div>

        <div class="detail-section">
            <div class="detail-label">Use Cases</div>
            <div class="tags">${message.useCases.map(uc => `<span class="tag">${uc}</span>`).join('')}</div>
        </div>
    `;
}

function renderDetailTechnicalTab(message) {
    return `
        <div class="detail-section">
            <div class="detail-label">Key Fields</div>
            <div class="tags">${message.fields.map(f => `<span class="tag">${f}</span>`).join('')}</div>
        </div>

        <div class="detail-section">
            <div class="detail-label">XML Example</div>
            <div class="xml-example">${escapeHtml(message.example)}</div>
        </div>
    `;
}

function switchDetailTab(messageCode, tab) {
    const message = getMessageByCode(messageCode);
    if (!message) return;
    const panel = document.getElementById('detail-panel');
    panel.innerHTML = renderDetailPanelTabs(message, tab);
}

function closeDetailPanel() {
    const panel = document.getElementById('detail-panel');
    panel.classList.remove('open');
    panel.innerHTML = '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Learning Journey: gamified roadmap. A linear roadmap of
// learningJourney modules (data.js) gates progress through ProgressEngine --
// each node unlocks only once the preceding module is marked complete.
// Clicking an unlocked node opens a split-screen lesson: a story panel
// (business-fiction narrative for *why* the pillar exists) on the left, and
// an interactive XML workshop on the right. Verifying the workshop challenge
// marks the module complete and returns to the (now-updated) roadmap.
// ---------------------------------------------------------------------------

function getModuleStatus(moduleId) {
    if (ProgressEngine.isComplete(moduleId)) return 'completed';
    if (ProgressEngine.isUnlocked(moduleId)) return 'unlocked';
    return 'locked';
}

// The "current" module is the first one that's unlocked but not yet
// completed. Returns null once every module is complete (journey finished).
function getCurrentModule() {
    return learningJourney.find(m => getModuleStatus(m.id) === 'unlocked') || null;
}

function getCompletedCount() {
    return learningJourney.filter(m => ProgressEngine.isComplete(m.id)).length;
}

// Narrative milestone copy keyed by completed-chapter count, written for the
// causal order: Foundations -> Payments -> FX -> Cards -> Trade -> Securities.
// Ties the abstract "X of 6" number back to where Bob's money actually is.
const MASTERY_MILESTONES = [
    'Bob hasn\'t hit send yet — let\'s begin.',
    'The shared language is set — next, watch Bob\'s transfer move.',
    'Bob\'s money has reached Sweety\'s bank — but it\'s still in the wrong currency.',
    'The currency\'s converted — next, watch Sweety actually spend it.',
    'Sweety\'s tapped her card — now rewind to see where Bob\'s salary came from.',
    'You\'ve traced the money all the way back — one chapter left: what Sweety saves.',
    'Bob\'s $400 reached Sweety, got spent, and traced back to its source. Journey complete.'
];

function getMilestoneMessage(completed) {
    return MASTERY_MILESTONES[Math.min(completed, MASTERY_MILESTONES.length - 1)];
}

// Apple-Activity-style circular progress ring: a continuous arc fill plus a
// small stop-marker at each chapter boundary, so the ring reads as both
// "62% there" and "4 distinct chapters behind you" at a glance.
function renderMasteryRing() {
    const total = learningJourney.length;
    const completed = getCompletedCount();
    const r = 54;
    const cx = 60;
    const cy = 60;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - completed / total);

    const stops = learningJourney.map((mod, i) => {
        const angle = -90 + ((i + 1) / total) * 360;
        const rad = angle * Math.PI / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        const filled = i < completed;
        return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4" class="mastery-ring-stop ${filled ? 'is-filled' : ''}"></circle>`;
    }).join('');

    return `
        <div class="mastery-strip">
            <div class="mastery-ring">
                <svg viewBox="0 0 120 120" class="mastery-ring-svg">
                    <circle cx="${cx}" cy="${cy}" r="${r}" class="mastery-ring-track"></circle>
                    <circle cx="${cx}" cy="${cy}" r="${r}" class="mastery-ring-fill"
                        style="stroke-dasharray: ${circumference.toFixed(2)}; stroke-dashoffset: ${offset.toFixed(2)};"></circle>
                    ${stops}
                </svg>
                <div class="mastery-ring-center">
                    <div class="mastery-ring-count">${completed}/${total}</div>
                    <div class="mastery-ring-unit">chapters</div>
                </div>
            </div>
            <p class="mastery-strip-message">${getMilestoneMessage(completed)}</p>
        </div>
    `;
}

// Reusable placeholder for a not-yet-produced short-form video (Shorts/Reels
// style, 9:16 or 16:9). Renders the intended spec directly on the page --
// aspect ratio, duration, concept, and *why* it's a placeholder -- so a real
// clip can be dropped into the same slot later with zero further dev work.
function renderVideoFiller(spec, label) {
    if (!spec) return '';
    return `
        <div class="video-filler" style="aspect-ratio: ${spec.aspect.replace(':', ' / ')};">
            <div class="video-filler-icon">🎬</div>
            <div class="video-filler-label">${label || 'Video slot'} — ${spec.aspect} · ${spec.duration}</div>
            <p class="video-filler-concept">${spec.concept}</p>
            <p class="video-filler-why"><strong>Why it's a placeholder:</strong> ${spec.why}</p>
        </div>
    `;
}

// Glossy "Apple-style" squircle icons, one per chapter, built entirely in
// CSS + inline SVG (no icon library/dependency). Each chapter id maps to a
// hand-drawn glyph and a CSS class (icon-<id>) that supplies its gradient --
// the gloss highlight itself is a single shared ::after rule in style.css.
const ICON_GLYPHS = {
    foundations: '<rect x="6" y="6" width="9" height="9" rx="2" fill="#fff" opacity="0.95"/><rect x="17" y="6" width="9" height="9" rx="2" fill="#fff" opacity="0.55"/><rect x="6" y="17" width="9" height="9" rx="2" fill="#fff" opacity="0.55"/><rect x="17" y="17" width="9" height="9" rx="2" fill="#fff" opacity="0.95"/>',
    payments: '<path d="M5 17 L25 6 L18 27 L14 18 Z" fill="#fff"/><path d="M5 17 L14 18 L25 6" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1.2"/>',
    fx: '<path d="M9 13 a9 9 0 0 1 14-5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M22 9 l3 -3 l1 4" fill="#fff"/><path d="M23 19 a9 9 0 0 1 -14 5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M10 23 l-3 3 l-1 -4" fill="#fff"/>',
    cards: '<rect x="5" y="9" width="22" height="15" rx="3" fill="#fff" opacity="0.95"/><rect x="5" y="13" width="22" height="3" fill="rgba(0,0,0,0.22)"/><rect x="8" y="20" width="7" height="2" rx="1" fill="rgba(0,0,0,0.22)"/>',
    trade: '<path d="M5 22 L27 22 L23 27 L9 27 Z" fill="#fff" opacity="0.95"/><rect x="15" y="6" width="2" height="14" fill="#fff" opacity="0.85"/><path d="M17 7 L24 11 L17 13 Z" fill="#fff" opacity="0.75"/>',
    securities: '<path d="M5 23 L12 16 L17 19 L26 8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26" cy="8" r="2.4" fill="#fff"/>'
};

function renderIconGlyph(moduleId, glyphSize) {
    return `<svg viewBox="0 0 32 32" width="${glyphSize}" height="${glyphSize}">${ICON_GLYPHS[moduleId] || ''}</svg>`;
}

// Standalone glossy squircle (its own gradient tile + gloss), for spots that
// aren't already a styled container -- e.g. the resume banner.
function renderGlossyIcon(moduleId, size = 56) {
    return `
        <div class="glossy-icon icon-${moduleId}" style="width: ${size}px; height: ${size}px;">
            ${renderIconGlyph(moduleId, Math.round(size * 0.56))}
        </div>
    `;
}

const HERO_VIDEO_FILLER = {
    aspect: '16:9',
    duration: '20–30s',
    concept: 'A single establishing shot: Bob (offshore, evening) on one side of the screen, Sweety (back home, daytime) on the other, with a thin animated line of light traveling between them through small bank/clearing icons as the headline copy types in. Sets up the whole journey in one look.',
    why: 'This is the page\'s signature shot — worth commissioning a proper custom motion graphic rather than stock footage once the route-line visual direction (see redesign doc) is finalized.'
};

function renderJourneyHero() {
    const total = learningJourney.length;
    const completed = getCompletedCount();
    const current = getCurrentModule();

    return `
        <section class="journey-hero">
            <div class="journey-hero-eyebrow">${completed === 0 ? 'Chapter One of Your Journey' : `Chapter ${Math.min(completed + 1, total)} of ${total}`}</div>
            <h1 class="journey-hero-headline">
                Bob just sent Sweety <span class="gradient-text">$400.</span><br>
                Here's everywhere it goes before she sees it.
            </h1>
            <p class="journey-hero-subhead">
                A payment looks instant. It isn't. Behind that single transfer, six financial systems hand the money to each other — speaking the exact language you just learned ISO 20022 created. Follow it, step by step, as Bob and Sweety would live it.
            </p>

            <div class="journey-hero-line" aria-hidden="true">
                <span class="journey-hero-avatar">🧑‍💼<small>Bob</small></span>
                <span class="journey-hero-line-track"><span class="journey-hero-line-dot"></span></span>
                <span class="journey-hero-avatar">👩<small>Sweety</small></span>
            </div>

            ${renderVideoFiller(HERO_VIDEO_FILLER, 'Hero video')}

            ${!current ? '' : `<button class="btn" onclick="document.getElementById('roadmap-pipeline').scrollIntoView({behavior:'smooth'})">Follow the Money →</button>`}
        </section>
    `;
}

function renderResumeBanner() {
    const total = learningJourney.length;
    const completed = getCompletedCount();
    const current = getCurrentModule();

    if (completed === 0) return '';

    if (!current) {
        return `
            <div class="resume-banner resume-banner-complete">
                <div class="resume-banner-icon">🏁</div>
                <div class="resume-banner-text">
                    <div class="resume-banner-title">You've followed Bob's $400 all the way to Sweety.</div>
                    <div class="resume-banner-subtitle">You now see the financial system the way the people who built it do.</div>
                </div>
            </div>
        `;
    }

    return `
        <div class="resume-banner">
            ${renderGlossyIcon(current.id, 44)}
            <div class="resume-banner-text">
                <div class="resume-banner-title">Continue with Bob — ${current.name}</div>
                <div class="resume-banner-subtitle">${current.chapterHook || ''}</div>
            </div>
            <button class="btn resume-banner-cta" onclick="loadLessonModule('${current.id}')">Resume →</button>
        </div>
    `;
}

// Learning Journey tab: hero, resume banner, mastery ring, then the route-
// line journey map (and, once a pillar is opened, the split-screen lesson).
// Returning from a lesson via "Back to Roadmap" always lands the user right
// back here, never at a scrolled-away video block.
//
// Route line: a single horizontal line connecting one "stop" per chapter.
// Segment N (between stop N and stop N+1) is styled by how far the learner
// has actually traveled -- solid/primary if fully crossed, dashed + pulsing
// if it's the edge currently being crossed, dotted/faint if still ahead --
// so the line itself communicates progress without reading any label.
// Three-tier visual weight so attention is guided, not split evenly across
// six equal cards: the one chapter actually in progress ("current") reads as
// the obvious focal point; the chapter right after it ("next") is a visible
// but quieter preview; everything further out ("ahead") is compact and dim
// on purpose -- still titled (no dead ends), just not competing for
// attention. Completed chapters ("done") shrink too, since the page should
// point forward, not linger on what's already behind the learner.
function getStopTier(mod, completedIndex) {
    const status = getModuleStatus(mod.id);
    if (status === 'completed') return 'done';
    if (status === 'unlocked') return 'current';
    const index = learningJourney.findIndex(m => m.id === mod.id);
    return index === completedIndex + 1 ? 'next' : 'ahead';
}

function renderRouteStop(mod, tier) {
    const status = getModuleStatus(mod.id);
    const isClickable = status !== 'locked';
    const isCurrent = tier === 'current';

    const showHook = tier === 'current' || tier === 'next';
    const eyebrow = tier === 'current' ? 'In Progress' : tier === 'next' ? 'Up Next' : '';

    return `
        <div class="route-stop tier-${tier}">
            <div class="route-stop-eyebrow">${eyebrow}</div>
            <div class="route-marker-slot">
                <button
                    class="route-marker glossy-icon icon-${mod.id} status-${status} ${isCurrent ? 'is-current' : ''}"
                    ${isClickable ? `onclick="loadLessonModule('${mod.id}')"` : 'disabled'}
                    aria-disabled="${!isClickable}"
                    title="${mod.name}"
                >
                    ${renderIconGlyph(mod.id, 26)}
                    ${status === 'completed' ? '<span class="route-marker-check">✓</span>' : ''}
                </button>
            </div>
            <div class="route-stop-label">${mod.name}</div>
            ${showHook ? `<p class="route-stop-hook">${mod.chapterHook || ''}</p>` : ''}
        </div>
    `;
}

function renderRouteLine() {
    const completed = getCompletedCount();
    const completedIndex = completed - 1;
    const pieces = [];

    learningJourney.forEach((mod, i) => {
        const tier = getStopTier(mod, completedIndex);
        pieces.push(renderRouteStop(mod, tier));
        if (i < learningJourney.length - 1) {
            const state = i < completed ? 'traveled' : (i === completed ? 'active' : 'ahead');
            pieces.push(`<div class="route-segment ${state}"></div>`);
        }
    });

    return `<div class="route-line">${pieces.join('')}</div>`;
}

function renderRoadmapView() {
    const content = document.getElementById('content');
    closeDetailPanel();

    content.innerHTML = `
        <div class="page">
            ${renderJourneyHero()}
            ${renderResumeBanner()}
            ${renderMasteryRing()}

            <div class="roadmap-track" id="roadmap-pipeline">
                ${renderRouteLine()}
            </div>
        </div>
    `;
}

function renderLessonProgress(mod) {
    const total = learningJourney.length;
    const index = learningJourney.findIndex(m => m.id === mod.id);
    const pct = total > 1 ? Math.round((index / (total - 1)) * 100) : 100;
    return `
        <div class="lesson-progress">
            <div class="lesson-progress-track">
                <div class="lesson-progress-fill" style="width: ${pct}%;"></div>
            </div>
            <div class="lesson-progress-label">Module ${index + 1} of ${total}</div>
        </div>
    `;
}

function renderLessonWhy(pillar) {
    if (!pillar || !pillar.why) return '';
    return `
        <div class="lesson-why-section">
            <div class="lesson-why-card">
                <div class="lesson-why-label">The Problem</div>
                <p class="lesson-why-text">${pillar.why.problem}</p>
            </div>
            <div class="lesson-why-card lesson-why-card-solution">
                <div class="lesson-why-label">The ISO 20022 Fix</div>
                <p class="lesson-why-text">${pillar.why.solution}</p>
            </div>
        </div>
    `;
}

function renderProcessMaps(pillar, roleMap) {
    if (!pillar || !pillar.processMaps || !pillar.processMaps.length) return '';
    const label = step => (roleMap && roleMap[step]) || step;
    return `
        <div class="lesson-process-section">
            <div class="journey-eyebrow">How It Flows</div>
            ${pillar.processMaps.map(map => `
                <div class="process-map">
                    <div class="process-map-title">${map.title}</div>
                    <div class="process-map-flow">
                        ${map.steps.map((step, i) => `
                            ${i > 0 ? '<span class="process-map-arrow">→</span>' : ''}
                            <span class="process-map-step">${label(step)}</span>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderLessonWho(pillar, roleMap) {
    if (!pillar || !pillar.who || !pillar.who.length) return '';
    const label = role => (roleMap && roleMap[role]) || role;
    return `
        <div class="lesson-who-section">
            <div class="journey-eyebrow">Who's Involved</div>
            <div class="participant-cards">
                ${pillar.who.map(w => `
                    <div class="participant-card">
                        <div class="participant-icon">${w.icon}</div>
                        <div class="participant-role">${label(w.role)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderMessageSpotlight(spotlight) {
    if (!spotlight) return '';
    return `
        <div class="lesson-spotlight-section">
            <div class="spotlight-header">
                <div class="journey-eyebrow">Message Spotlight</div>
                <h3 class="spotlight-title">${spotlight.title}${spotlight.code ? ` <span class="spotlight-code">${spotlight.code}</span>` : ''}</h3>
                <p class="spotlight-subtitle">${spotlight.subtitle}</p>
            </div>

            <div class="xml-editor-shell">
                <div class="xml-editor-toolbar">
                    <span class="xml-editor-dot"></span>
                    <span class="xml-editor-dot"></span>
                    <span class="xml-editor-dot"></span>
                    <span class="xml-editor-filename">sample.xml</span>
                </div>
                <pre class="xml-editor xml-readonly"><code>${escapeHtml(spotlight.xml)}</code></pre>
            </div>

            ${spotlight.fields && spotlight.fields.length ? `
                <div class="spotlight-fields">
                    ${spotlight.fields.map(f => `
                        <div class="spotlight-field">
                            <span class="spotlight-field-tag">${f.tag}</span>
                            <span class="spotlight-field-meaning">${f.meaning}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <button class="btn spotlight-cta" onclick="navigate('playground', event)">Try it in the Playground →</button>
        </div>
    `;
}

function loadLessonModule(moduleId) {
    const mod = learningJourney.find(m => m.id === moduleId);
    if (!mod) return;

    // Free-roam: opening a chapter is what marks it "viewed" -- there's no
    // separate verify step gating it anymore.
    ProgressEngine.markComplete(moduleId);

    const pillar = getPillar(mod.pillarId);
    const content = document.getElementById('content');

    content.innerHTML = `
        <div class="page lesson-article">
            <div class="lesson-panel-top">
                <button class="btn-back-roadmap" onclick="renderRoadmapView()">← Back to Roadmap</button>
                ${renderLessonProgress(mod)}
            </div>

            <div class="lesson-article-header">
                ${renderGlossyIcon(mod.id, 64)}
                <div class="journey-eyebrow">${mod.name}</div>
            </div>
            <h2 class="lesson-title">${mod.storyTitle}</h2>
            ${mod.story.map(p => `<p class="lesson-story-text">${p}</p>`).join('')}

            ${renderVideoFiller(mod.videoFiller, `${mod.name} — scene`)}

            ${mod.unlockedSkill ? `<div class="lesson-unlocked-skill"><strong>You now know:</strong> ${mod.unlockedSkill}</div>` : ''}

            ${renderLessonWhy(pillar)}
            ${renderProcessMaps(pillar, mod.roleMap)}
            ${renderLessonWho(pillar, mod.roleMap)}
            ${renderMessageSpotlight(mod.messageSpotlight)}
        </div>
    `;
}

// Render glossary
function renderGlossary(items = DATA.glossary) {
    const glossaryGrid = document.getElementById('glossary-grid') || document.querySelector('.glossary-grid');
    
    if (!glossaryGrid) return;

    if (items.length === 0) {
        glossaryGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 32px; color: var(--text-muted);">No terms found</div>';
    } else {
        glossaryGrid.innerHTML = items.map(item => `
            <div class="glossary-card">
                <div class="glossary-term">${item.term}</div>
                <div class="glossary-definition">${item.definition}</div>
            </div>
        `).join('');
    }
}

function filterGlossary(query) {
    const filtered = DATA.glossary.filter(item =>
        item.term.toLowerCase().includes(query.toLowerCase()) ||
        item.definition.toLowerCase().includes(query.toLowerCase())
    );
    renderGlossary(filtered);
}

// Theme management
function toggleTheme() {
    const toggle = document.querySelector('.theme-toggle');
    const isDark = toggle.classList.contains('active');
    
    if (isDark) {
        setTheme('light');
        toggle.classList.remove('active');
    } else {
        setTheme('dark');
        toggle.classList.add('active');
    }
}

function setTheme(theme) {
    const toggle = document.querySelector('.theme-toggle');
    
    if (theme === 'dark') {
        document.body.classList.remove('light-mode');
        toggle.classList.add('active');
        localStorage.setItem('iso-theme', 'dark');
    } else {
        document.body.classList.add('light-mode');
        toggle.classList.remove('active');
        localStorage.setItem('iso-theme', 'light');
    }
}

// Initialize theme from localStorage
if (localStorage.getItem('iso-theme') === 'light') {
    setTheme('light');
} else {
    setTheme('dark');
}

// Initialize theme from localStorage
if (localStorage.getItem('iso-theme') === 'light') {
    setTheme('light');
} else {
    setTheme('dark');
}
