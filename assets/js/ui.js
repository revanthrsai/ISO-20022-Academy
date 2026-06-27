// UI Module - Handle interactive elements and detail panel

// ---------------------------------------------------------------------------
// Message Explorer (Phase 6) — each message opens as a full Lesson-Spine node,
// concept BEFORE payload. The panel reads top-to-bottom as a story:
//   business story → why it exists → who creates/receives → business process
//   → visual flow → business components → message components → XML →
//   validation → what breaks → interview questions → related messages.
// The raw XML appears only after the business story, never first. Reuses
// existing detail / spotlight / lesson CSS classes — no new styles.
// ---------------------------------------------------------------------------
// Phase 7 — the explorer now opens as a centered POPUP (an "Outlook-style"
// reading window) over a dimmed backdrop, instead of the old slide-in side
// panel. Same renderMessageNode content; click-outside or Esc closes it.
function openDetailPanel(messageCode) {
    const message = getMessageByCode(messageCode);
    if (!message) return;
    let overlay = document.getElementById('msg-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'msg-modal-overlay';
        overlay.className = 'msg-modal-overlay';
        overlay.addEventListener('click', e => { if (e.target === overlay) closeDetailPanel(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetailPanel(); });
        document.body.appendChild(overlay);
    }
    overlay.dataset.messageCode = messageCode;
    overlay.innerHTML = `<div class="msg-modal" role="dialog" aria-modal="true" aria-label="${message.code} details">${renderMessageNode(message)}</div>`;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('open'));
    const body = overlay.querySelector('.detail-panel-content');
    if (body) body.scrollTop = 0;
    if (window.Motion) Motion.scan(overlay);
}

// A labelled block: monospace eyebrow label + free HTML body.
function renderDetailSection(label, bodyHtml) {
    if (!bodyHtml) return '';
    return `
        <div class="detail-section">
            <div class="detail-label">${label}</div>
            ${bodyHtml}
        </div>`;
}

// Plain-English left → meaning right rows (business / message components,
// validation). Reuses .spotlight-fields styling.
function renderMeaningRows(rows) {
    return `<div class="spotlight-fields">${rows.map(r => `
        <div class="spotlight-field">
            <span class="spotlight-field-tag">${r.tag}</span>
            <span class="spotlight-field-meaning">${r.meaning}</span>
        </div>`).join('')}</div>`;
}

function renderMessageNode(message) {
    const n = message.node || {};

    const flowHtml = (n.flow && n.flow.length) ? `
        <div class="process-map">
            <div class="process-map-flow" data-flow>
                ${n.flow.map((step, i) => `${i > 0 ? '<span class="process-map-arrow">→</span>' : ''}<span class="process-map-step">${step}</span>`).join('')}
            </div>
        </div>` : '';

    const bizCompHtml = (n.businessComponents && n.businessComponents.length)
        ? renderMeaningRows(n.businessComponents.map(c => ({ tag: c.name, meaning: c.plain }))) : '';

    const msgCompRows = (n.messageComponents && n.messageComponents.length)
        ? n.messageComponents.map(c => ({ tag: c.tag, meaning: c.plain }))
        : (message.fields || []).map(f => ({ tag: f, meaning: '' }));
    const msgCompHtml = renderMeaningRows(msgCompRows);

    const validationHtml = (n.validation && n.validation.length)
        ? renderMeaningRows(n.validation.map(v => ({
            tag: v.tag,
            meaning: `${v.rule}<br><span style="opacity:.7"><strong>Fails when:</strong> ${v.fails}</span>`
        }))) : '';

    const breaksHtml = (n.breaks && n.breaks.length)
        ? renderWhyCards(n.breaks.map(b => ({ label: b.symptom, text: `<strong>Why:</strong> ${b.cause}<br><strong>Fix:</strong> ${b.fix}` }))) : '';

    const interviewHtml = (n.interview && n.interview.length) ? `
        <div class="lesson-why-section">${n.interview.map(it => `
            <div class="lesson-why-card">
                <div class="lesson-why-label">Q · ${it.q}</div>
                <p class="lesson-why-text">${it.a}</p>
            </div>`).join('')}</div>` : '';

    const relatedCodes = (n.related || []).filter(c => getMessageByCode(c));
    const relatedHtml = relatedCodes.length ? `
        <div class="tags">${relatedCodes.map(c => {
            const m = getMessageByCode(c);
            return `<span class="tag" style="cursor:pointer" title="${m.subtitle}" onclick="openDetailPanel('${c}')">${c} →</span>`;
        }).join('')}</div>` : '';

    return `
        <div class="detail-panel-content">
            <button onclick="closeDetailPanel()" aria-label="Close" style="cursor:pointer; background:transparent; border:1px solid var(--border); color:var(--text-muted); border-radius:8px; padding:6px 12px; font-size:12px; letter-spacing:0.04em; margin-bottom:20px;">✕ Close</button>

            <div class="detail-header">
                <div class="detail-title">${message.code}</div>
                <div class="detail-subtitle">${message.subtitle}</div>
            </div>

            ${renderDetailSection('The Story', n.story ? `<p class="detail-description">${n.story}</p>` : `<p class="detail-description">${message.purpose}</p>`)}
            ${renderDetailSection('Why This Message Exists', n.whyExists ? `<p class="detail-description">${n.whyExists}</p>` : '')}

            ${renderDetailSection('Who Creates It', n.createdBy ? `<div class="detail-value">${n.createdBy}</div>` : `<div class="detail-value">${message.direction}</div>`)}
            ${renderDetailSection('Who Receives It', n.receivedBy ? `<div class="detail-value">${n.receivedBy}</div>` : '')}

            ${flowHtml ? renderDetailSection('Business Process', flowHtml) : ''}
            ${bizCompHtml ? renderDetailSection('Business Components', bizCompHtml) : ''}
            ${renderDetailSection('Message Components', msgCompHtml)}

            <div class="detail-section">
                <div class="detail-label">The XML — only now</div>
                <div class="xml-editor-shell">
                    <div class="xml-editor-toolbar">
                        <span class="xml-editor-dot"></span>
                        <span class="xml-editor-dot"></span>
                        <span class="xml-editor-dot"></span>
                        <span class="xml-editor-filename">${message.code.toLowerCase()}.xml</span>
                    </div>
                    <pre class="xml-editor xml-readonly"><code>${escapeHtml(message.example)}</code></pre>
                </div>
            </div>

            ${validationHtml ? renderDetailSection('Validation Rules', validationHtml) : ''}
            ${breaksHtml ? renderDetailSection('What Breaks', breaksHtml) : ''}
            ${interviewHtml ? renderDetailSection('Interview Questions', interviewHtml) : ''}
            ${relatedHtml ? renderDetailSection('Related Messages', relatedHtml) : ''}
        </div>
    `;
}

function closeDetailPanel() {
    const overlay = document.getElementById('msg-modal-overlay');
    if (overlay) {
        overlay.classList.remove('open');
        setTimeout(() => { if (overlay && !overlay.classList.contains('open')) overlay.innerHTML = ''; }, 240);
    }
    document.body.style.overflow = '';
    // Legacy side panel (kept harmless): close it too if present.
    const panel = document.getElementById('detail-panel');
    if (panel) { panel.classList.remove('open'); panel.innerHTML = ''; }
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
    why: 'The CSS scene above is the live, zero-dependency version of this shot. Worth commissioning a proper custom motion graphic to replace it down the line.'
};

// No illustration, no scroll animation -- the Bob/Sweety story is told
// purely in big type.
function renderJourneyStory() {
    return `
        <div class="journey-story" aria-hidden="true">
            <span class="journey-story-line"><span class="journey-story-name">Bob</span> sends $400.</span>
            <span class="journey-story-line"><span class="journey-story-name">Sweety</span> receives it.</span>
        </div>
    `;
}

function renderJourneyHero() {
    const total = learningJourney.length;
    const completed = getCompletedCount();
    const current = getCurrentModule();

    return `
        <section class="journey-hero">
            <div class="journey-hero-eyebrow"><span class="journey-hero-eyebrow-dot"></span>${completed === 0 ? 'Chapter One of Your Journey' : `Chapter ${Math.min(completed + 1, total)} of ${total}`}</div>

            ${renderJourneyStory()}

            <h1 class="journey-hero-headline">
                <span class="hl-line hl-1">Bob just sent Sweety <span class="gradient-text">$400.</span></span><br>
                <span class="hl-line hl-2">Here's everywhere it goes before she sees it.</span>
            </h1>
            <p class="journey-hero-subhead">
                A payment looks instant. It isn't. Behind that single transfer, six financial systems hand the money to each other — speaking the exact language you just learned ISO 20022 created. Follow it, step by step, as Bob and Sweety would live it.
            </p>

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
    // Free-roam means every incomplete chapter is technically "unlocked", but
    // the page should still have ONE focal point: the current chapter (first
    // incomplete) reads as "current", the one right after it as "next", and
    // everything further out as the quiet "path ahead".
    const current = getCurrentModule();
    if (current && mod.id === current.id) return 'current';
    const index = learningJourney.findIndex(m => m.id === mod.id);
    const currentIndex = current ? learningJourney.findIndex(m => m.id === current.id) : completedIndex + 1;
    return index === currentIndex + 1 ? 'next' : 'ahead';
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

            ${renderDeeperLayers()}
        </div>
    `;

    if (window.Motion) Motion.scan(content);
}

// Phase 7 — the five gap nodes surfaced as a discovery rail beneath the route
// line, so the deeper layers aren't reachable ONLY by stumbling on a related
// link. Reuses the existing .card component (design freeze respected).
const GAP_NODE_IDS = ['metamodel', 'networks', 'routing', 'identifiers', 'payload'];
function renderDeeperLayers() {
    if (typeof getKnowledgeNode !== 'function') return '';
    const nodes = GAP_NODE_IDS.map(getKnowledgeNode).filter(Boolean);
    if (!nodes.length) return '';
    return `
        <div class="lesson-process-section" style="margin-top:48px">
            <div class="journey-eyebrow">Go Deeper — Follow Your Curiosity</div>
            <p class="section-description" style="margin-bottom:20px">The six chapters trace Bob's money. These five layers explain the machinery underneath — open any one, then follow where it links.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px">
                ${nodes.map(n => {
                    const layer = (typeof IA_LAYERS !== 'undefined' && IA_LAYERS[n.layer]) ? IA_LAYERS[n.layer].title : '';
                    return `<button class="card" style="cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:10px;align-items:flex-start" onclick="openKnowledgeNode('${n.id}')">
                        <div style="display:flex;align-items:center;gap:12px">
                            <span style="font-size:26px">${n.icon || '🔗'}</span>
                            <span class="journey-eyebrow">${layer}</span>
                        </div>
                        <div style="font-weight:700;font-size:17px;color:var(--text)">${n.title}</div>
                        <div style="font-size:13px;line-height:1.5;color:var(--text-muted)">${n.humanQuestion}</div>
                        <span class="tag" style="margin-top:4px">Open →</span>
                    </button>`;
                }).join('')}
            </div>
        </div>`;
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
                    <div class="process-map-flow" data-flow>
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
                <h3 class="spotlight-title">${spotlight.title}${spotlight.code ? ` <span class="spotlight-code" style="cursor:pointer" onclick="openDetailPanel('${spotlight.code}')">${spotlight.code} →</span>` : ''}</h3>
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

// ---------------------------------------------------------------------------
// Phase 3 — Knowledge-node lessons (semantic-first).
// When a chapter has a node in `knowledgeNodes` (knowledge-nodes.js), render it
// in strict 9-beat Lesson Spine order (PHILOSOPHY.md): the HUMAN QUESTION first,
// the raw XML only at beat 7. Reuses existing lesson CSS classes -- no new
// styles. Gated by KNOWLEDGE_LESSON_IDS so nodes roll in one phase at a time:
//   Phase 3 -> foundations;  Phase 5 adds the five domains;  etc.
// ---------------------------------------------------------------------------
const KNOWLEDGE_LESSON_IDS = ['foundations', 'payments', 'fx', 'cards', 'trade', 'securities'];

function hasKnowledgeLesson(moduleId) {
    return typeof getKnowledgeNode === 'function'
        && KNOWLEDGE_LESSON_IDS.indexOf(moduleId) !== -1
        && !!getKnowledgeNode(moduleId);
}

// Small reusable rows: a monospace label (concept/tag/role) + a plain meaning.
// Reuses the existing .spotlight-fields / .spotlight-field styling.
function renderFieldRows(rows) {
    return `<div class="spotlight-fields">${rows.map(r => `
        <div class="spotlight-field">
            <span class="spotlight-field-tag">${r.tag}</span>
            <span class="spotlight-field-meaning">${r.meaning}</span>
        </div>`).join('')}</div>`;
}

// Stacked labelled cards (who-feels-it, what-breaks). Reuses .lesson-why-*.
function renderWhyCards(cards) {
    return `<div class="lesson-why-section">${cards.map(c => `
        <div class="lesson-why-card ${c.solution ? 'lesson-why-card-solution' : ''}">
            <div class="lesson-why-label">${c.label}</div>
            <p class="lesson-why-text">${c.text}</p>
        </div>`).join('')}</div>`;
}

function renderKnowledgeLesson(node, mod) {
    const content = document.getElementById('content');
    const wp = node.worldProcess || {};
    const sm = node.semanticModel || {};
    const xml = node.xml || {};

    // Beat 4 -- participants (icon + role / plain) and the flow as a process map.
    const participantsHtml = (wp.participants && wp.participants.length)
        ? renderFieldRows(wp.participants.map(p => ({ tag: `${p.icon || ''} ${p.role}`.trim(), meaning: p.plain })))
        : '';
    const flowHtml = (wp.flow && wp.flow.length) ? `
        <div class="process-map">
            <div class="process-map-flow" data-flow>
                ${wp.flow.map((step, i) => `${i > 0 ? '<span class="process-map-arrow">→</span>' : ''}<span class="process-map-step">${step}</span>`).join('')}
            </div>
        </div>` : '';

    // Beat 5 -- semantic roles as CONCEPTS (still no tags).
    const rolesHtml = (sm.roles && sm.roles.length)
        ? renderFieldRows(sm.roles.map(r => ({ tag: r.concept, meaning: r.plain })))
        : '';

    // Beat 6 -- the messages, named in business terms first.
    const msgsHtml = (node.messages && node.messages.length) ? `
        <div class="lesson-process-section">
            <div class="journey-eyebrow">The Messages</div>
            <div class="spotlight-fields">
                ${node.messages.map(m => {
                    const exists = typeof getMessageByCode === 'function' && getMessageByCode(m.code);
                    return `<div class="spotlight-field"${exists ? ` style="cursor:pointer" onclick="openDetailPanel('${m.code}')"` : ''}>
                        <span class="spotlight-field-tag">${m.code}</span>
                        <span class="spotlight-field-meaning"><strong>${m.businessName}</strong> — ${m.plainRole}${exists ? ' <span style="opacity:.55">· open in explorer →</span>' : ''}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>` : '';

    // Beat 7 -- tag glossary (each tag translated to plain English on sight).
    const tagGlossaryHtml = (xml.tagGlossary && xml.tagGlossary.length)
        ? renderFieldRows(xml.tagGlossary.map(t => ({ tag: t.tag, meaning: t.plain })))
        : '';

    // Beat 8 -- concrete real failures.
    const breaksHtml = (node.breaks && node.breaks.length)
        ? renderWhyCards(node.breaks.map(b => ({ label: b.symptom, text: `<strong>Why:</strong> ${b.cause}<br><strong>Fix:</strong> ${b.fix}` })))
        : '';

    // Beat 9 -- related ideas, now CLICKABLE (Phase 7). Related NODES open the
    // node; glossary TERMS jump to the glossary filtered to that word. Splitting
    // them lets each tag carry the right action — "links through ideas, not menus".
    const relatedNodeLinks = (node.relatedNodes || [])
        .map(id => (typeof getKnowledgeNode === 'function' ? getKnowledgeNode(id) : null))
        .filter(Boolean);
    const glossaryLinks = (node.glossaryTerms || []).filter(t =>
        typeof DATA !== 'undefined' && DATA.glossary && DATA.glossary.some(g => g.term === t));
    const relatedHtml = (relatedNodeLinks.length || glossaryLinks.length) ? `
        <div class="lesson-process-section">
            <div class="journey-eyebrow">Where This Connects</div>
            ${relatedNodeLinks.length ? `<p class="lesson-story-text" style="margin-bottom:10px">You'll want to understand…</p>
            <div class="tags" style="margin-bottom:18px">${relatedNodeLinks.map(n => `<span class="tag" style="cursor:pointer" title="${(n.humanQuestion || '').replace(/"/g, '&quot;')}" onclick="openKnowledgeNode('${n.id}')">${n.icon ? n.icon + ' ' : ''}${n.title} →</span>`).join('')}</div>` : ''}
            ${glossaryLinks.length ? `<p class="lesson-story-text" style="margin-bottom:10px">Look up</p>
            <div class="tags">${glossaryLinks.map(t => `<span class="tag" style="cursor:pointer" onclick="lookupGlossary('${t.replace(/'/g, "\\'")}')">${t}</span>`).join('')}</div>` : ''}
        </div>` : '';

    const layerInfo = (typeof IA_LAYERS !== 'undefined' && IA_LAYERS[node.layer]) || null;
    const headerIcon = mod
        ? renderGlossyIcon(mod.id, 64)
        : `<div class="glossy-icon" style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-size:30px;border-radius:18px;background:var(--surface-alt,rgba(255,255,255,0.06));border:1px solid var(--border)">${node.icon || '🔗'}</div>`;
    const headerLabel = mod ? mod.name : (layerInfo ? layerInfo.title : node.title);

    content.innerHTML = `
        <div class="page lesson-article">
            <div class="lesson-panel-top">
                <button class="btn-back-roadmap" onclick="renderRoadmapView()">← Back to Roadmap</button>
                ${mod ? renderLessonProgress(mod) : (layerInfo ? `<div class="lesson-progress-label">${layerInfo.title} · a deeper layer</div>` : '')}
            </div>

            <div class="lesson-article-header" data-reveal="up">
                ${headerIcon}
                <div class="journey-eyebrow">${headerLabel}</div>
            </div>

            <!-- BEAT 1 — The Human Question -->
            <div class="journey-eyebrow" data-reveal="up">The Question</div>
            <h2 class="lesson-title" data-reveal="up">${node.humanQuestion}</h2>

            <!-- BEAT 2 — Who Feels This -->
            <div class="lesson-process-section">
                <div class="journey-eyebrow">Who Feels This</div>
                ${renderWhyCards((node.whoFeelsIt || []).map(w => ({ label: w.who, text: w.pain })))}
            </div>

            <!-- BEAT 3 — The Story -->
            <div class="lesson-process-section">
                <div class="journey-eyebrow">The Story</div>
                <p class="lesson-story-text" data-reveal="up">${node.story.lead}</p>
                ${node.story.beats.map((p, i) => `<p class="lesson-story-text" data-reveal="up" data-reveal-delay="${(i + 1) * 70}">${p}</p>`).join('')}
                ${node.story.castPayoff ? `<div class="lesson-unlocked-skill" data-reveal="up"><strong>Recap.</strong> ${node.story.castPayoff}</div>` : ''}
                ${(node.story.rolesLearned && node.story.rolesLearned.length) ? `
                <div class="lesson-unlocked-skill" data-reveal="up" style="margin-top:14px">
                    <strong>Congratulations — you just learned:</strong>
                    <div class="spotlight-fields" style="margin-top:12px">
                        ${node.story.rolesLearned.map(r => `<div class="spotlight-field"><span class="spotlight-field-tag">${r.term}</span><span class="spotlight-field-meaning">${r.who}</span></div>`).join('')}
                    </div>
                </div>` : ''}
            </div>

            <!-- BEAT 4 — How the World Solved It -->
            <div class="lesson-process-section">
                <div class="journey-eyebrow">How the World Solved It</div>
                <p class="lesson-story-text">${wp.summary || ''}</p>
                ${participantsHtml}
                ${flowHtml}
            </div>

            <!-- BEAT 5 — How ISO Models It (concepts, not tags) -->
            <div class="lesson-process-section">
                <div class="journey-eyebrow">How ISO Models It</div>
                <p class="lesson-story-text">${sm.summary || ''}</p>
                ${rolesHtml}
            </div>

            <!-- BEAT 6 — The Messages -->
            ${msgsHtml}

            ${mod ? renderVideoFiller(mod.videoFiller, `${mod.name} — scene`) : ''}

            <!-- BEAT 7 — Only now, the XML -->
            <div class="lesson-spotlight-section">
                <div class="journey-eyebrow">Only Now — How It's Written</div>
                <p class="lesson-story-text">${xml.intro || ''}</p>
                <div class="xml-editor-shell">
                    <div class="xml-editor-toolbar">
                        <span class="xml-editor-dot"></span>
                        <span class="xml-editor-dot"></span>
                        <span class="xml-editor-dot"></span>
                        <span class="xml-editor-filename">sample.xml</span>
                    </div>
                    <pre class="xml-editor xml-readonly"><code>${escapeHtml(xml.code || '')}</code></pre>
                </div>
                ${tagGlossaryHtml}
            </div>

            <!-- BEAT 8 — What Breaks -->
            ${breaksHtml ? `<div class="lesson-process-section"><div class="journey-eyebrow">What Breaks</div>${breaksHtml}</div>` : ''}

            <!-- BEAT 9 — You Can Now… -->
            <div class="lesson-unlocked-skill" data-reveal="up"><strong>Skill unlocked.</strong> ${node.earnedSkill}</div>
            ${relatedHtml}
        </div>
    `;

    window.scrollTo({ top: 0, behavior: 'auto' });
    if (window.Motion) Motion.scan(content);
}

// Open ANY knowledge node by id — a journey chapter (uses its module for the
// header/progress/video) or a Phase-7 gap node (rendered with its IA-layer
// label, no progress). This is how related-idea links and the roadmap's
// "deeper layers" rail navigate the graph.
function openKnowledgeNode(id) {
    const node = (typeof getKnowledgeNode === 'function') ? getKnowledgeNode(id) : null;
    if (!node) return;
    closeDetailPanel();
    const mod = (typeof learningJourney !== 'undefined') ? learningJourney.find(m => m.id === id) : null;
    if (mod && typeof ProgressEngine !== 'undefined') ProgressEngine.markComplete(id);
    renderKnowledgeLesson(node, mod || null);
}

// Jump to the glossary, filtered to one term (related-idea "Look up" chips).
function lookupGlossary(term) {
    if (typeof navigate === 'function') navigate('glossary');
    const box = document.getElementById('glossary-search');
    if (box) box.value = term;
    if (typeof filterGlossary === 'function') filterGlossary(term);
    window.scrollTo({ top: 0, behavior: 'auto' });
}

function loadLessonModule(moduleId) {
    const mod = learningJourney.find(m => m.id === moduleId);
    if (!mod) return;

    // Free-roam: opening a chapter is what marks it "viewed" -- there's no
    // separate verify step gating it anymore.
    ProgressEngine.markComplete(moduleId);

    // Phase 3: chapters with a knowledge node render semantic-first.
    if (hasKnowledgeLesson(moduleId)) {
        renderKnowledgeLesson(getKnowledgeNode(moduleId), mod);
        return;
    }

    const pillar = getPillar(mod.pillarId);
    const content = document.getElementById('content');

    content.innerHTML = `
        <div class="page lesson-article">
            <div class="lesson-panel-top">
                <button class="btn-back-roadmap" onclick="renderRoadmapView()">← Back to Roadmap</button>
                ${renderLessonProgress(mod)}
            </div>

            <div class="lesson-article-header" data-reveal="up">
                ${renderGlossyIcon(mod.id, 64)}
                <div class="journey-eyebrow">${mod.name}</div>
            </div>
            <h2 class="lesson-title" data-reveal="up">${mod.storyTitle}</h2>
            ${mod.story.map((p, i) => `<p class="lesson-story-text" data-reveal="up" data-reveal-delay="${i * 70}">${p}</p>`).join('')}

            ${renderVideoFiller(mod.videoFiller, `${mod.name} — scene`)}

            ${mod.unlockedSkill ? `<div class="lesson-unlocked-skill" data-reveal="up"><strong>You now know:</strong> ${mod.unlockedSkill}</div>` : ''}

            ${renderLessonWhy(pillar)}
            ${renderProcessMaps(pillar, mod.roleMap)}
            ${renderLessonWho(pillar, mod.roleMap)}
            ${renderMessageSpotlight(mod.messageSpotlight)}
        </div>
    `;

    window.scrollTo({ top: 0, behavior: 'auto' });
    if (window.Motion) Motion.scan(content);
}

// Render glossary
function renderGlossary(items = DATA.glossary) {
    const glossaryGrid = document.getElementById('glossary-grid') || document.querySelector('.glossary-grid');
    const countEl = document.getElementById('glossary-count');

    if (!glossaryGrid) return;

    if (countEl) {
        countEl.textContent = `${items.length} of ${DATA.glossary.length} terms`;
    }

    if (items.length === 0) {
        glossaryGrid.innerHTML = '<div class="glossary-empty">No terms match your search.</div>';
    } else {
        glossaryGrid.innerHTML = items.map((item, i) => `
            <div class="glossary-card" data-reveal="up" data-reveal-delay="${Math.min(i, 8) * 55}" data-tilt>
                <div class="glossary-term">${item.term}</div>
                <div class="glossary-definition">${item.definition}</div>
            </div>
        `).join('');
    }

    if (window.Motion) Motion.scan(glossaryGrid);
}

function filterGlossary(query) {
    const q = query.trim().toLowerCase();
    const filtered = DATA.glossary.filter(item =>
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q)
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
