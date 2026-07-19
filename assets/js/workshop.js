// =============================================================================
// WORKSHOP · THE HANDS-ON HALF
// -----------------------------------------------------------------------------
// The Library teaches by explanation. This teaches by consequence: you are given
// a situation with a definite right answer, you work, and you are graded — by
// the same rules engine the Playground validator uses, so a workshop can never
// disagree with a tool the learner already trusts.
//
// State machine per workshop:  brief → work → verdict → (retry | debrief)
//
// Grading is two-sided, which matters more than it sounds:
//   1. the message must pass every validation rule, AND
//   2. the business facts must survive (integrity assertions)
// Without (2) the winning move is to delete whatever the validator complains
// about — which is exactly the instinct a payments engineer must not learn.
//
// Data lives in workshops.data.js. This file owns state, rendering, and grading.
// =============================================================================

const Workshop = (function () {

    // Which validator rule name signals which planted defect. Binding lives here,
    // not in the data file — it couples two module implementations.
    const RULE_TO_DEFECT = {
        'Bad BIC': 'bic',
        'Bad IBAN': 'iban',
        'Count mismatch': 'count',
        'Overlong field': 'length',
        'Missing required element': 'missing',
        'Amount problem': 'amount',
        'Bad currency code': 'currency',
        'Reference problem': 'reference',
        'Date problem': 'date'
    };

    let mountId = 'ws-root';
    let current = null;      // active workshop id
    let hintsUsed = 0;       // escalating hints, per attempt
    let attempts = 0;
    let solved = false;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function root() { return document.getElementById(mountId); }

    // Paragraph-split plain text that uses \n\n as a break.
    function paras(text, cls) {
        return String(text || '').split(/\n\n+/)
            .map(p => `<p class="${cls || ''}">${esc(p)}</p>`).join('');
    }

    // -------------------------------------------------------------------------
    // LANDING
    // -------------------------------------------------------------------------
    function cardHtml(w) {
        const locked = !w.ready;
        return `
        <article class="ws-card${locked ? ' is-locked' : ''}"
                 ${locked ? '' : `onclick="openWorkshop('${w.id}', event)"`}
                 ${locked ? '' : 'tabindex="0" role="link"'}>
            <div class="ws-card-top">
                <span class="ws-card-n">${esc(w.n)}</span>
                <span class="ws-card-kicker">${esc(w.kicker)}</span>
                ${locked ? '<span class="ws-card-soon">in build</span>' : ''}
            </div>
            <h3 class="ws-card-title">${esc(w.title)}</h3>
            <p class="ws-card-blurb">${esc(w.blurb)}</p>
            <div class="ws-card-skills">
                ${w.skills.map(s => `<span class="ws-skill">${esc(s)}</span>`).join('')}
            </div>
            <div class="ws-card-foot">
                <span class="ws-card-meta">${esc(w.difficulty)} &middot; ~${w.minutes} min</span>
                ${locked ? '<span class="ws-card-cta is-off">Coming soon</span>'
                         : '<span class="ws-card-cta">Start the workshop &rarr;</span>'}
            </div>
        </article>`;
    }

    function showLanding() {
        const el = root();
        if (!el || !window.WORKSHOPS) return;
        current = null;
        el.innerHTML = `
        <header class="ws-hero">
            <div class="eyebrow">The Workshop</div>
            <h2 class="ws-hero-title">Now do it yourself.</h2>
            <p class="ws-hero-sub">
                Every lesson in the Library explains something. Here you get a situation instead:
                a broken message, a migration with a deadline, a payment that has to come back.
                You work it, and you get checked &mdash; by the same engine that runs the
                Playground validator. No multiple choice, no marking your own homework.
            </p>
        </header>
        <div class="ws-grid">${WORKSHOPS.LIST.map(cardHtml).join('')}</div>
        <p class="ws-foot-note">
            More workshops are being built. If there's a scenario that keeps biting you at work,
            that's exactly the kind of thing that should be in here.
        </p>`;
        if (window.Motion) Motion.scan(el);
    }

    // -------------------------------------------------------------------------
    // GRADING — validator rules + integrity assertions
    // -------------------------------------------------------------------------
    function gradeText(def, txt) {
        const out = {
            parseError: null,
            errors: [],
            warnings: [],
            integrityFails: [],
            remainingDefects: [],
            pass: false
        };

        if (!window.SchemaValidator || !SchemaValidator.validate) {
            out.parseError = 'The validation engine did not load — reload the page and try again.';
            return out;
        }

        const res = SchemaValidator.validate(txt);
        if (res.parseError) { out.parseError = res.parseError; return out; }

        out.errors = res.findings.filter(f => f.sev === 'error');
        out.warnings = res.findings.filter(f => f.sev === 'warn');

        // Which of the planted defects are still detectable?
        const stillBroken = new Set();
        out.errors.forEach(f => {
            const d = RULE_TO_DEFECT[f.rule];
            if (d) stillBroken.add(d);
        });
        out.remainingDefects = (def.defects || [])
            .filter(d => stillBroken.has(d.id))
            .map(d => d.id);

        // Integrity — did the meaning of the payment survive the repair?
        let doc = null;
        try { doc = new DOMParser().parseFromString(txt, 'application/xml'); } catch (e) { doc = null; }
        if (doc && !doc.querySelector('parsererror')) {
            (def.integrity || []).forEach(function (rule) {
                let ok = false;
                try { ok = !!rule.test(doc, txt); } catch (e) { ok = false; }
                if (!ok) out.integrityFails.push(rule.msg);
            });
        }

        out.pass = out.errors.length === 0 && out.integrityFails.length === 0;
        return out;
    }

    // -------------------------------------------------------------------------
    // WORKSHOP VIEW
    // -------------------------------------------------------------------------
    function open(id) {
        const el = root();
        if (!el || !window.WORKSHOPS) return;
        const def = WORKSHOPS.DEFS[id];
        if (!def) { showLanding(); return; }

        current = id;
        hintsUsed = 0;
        attempts = 0;
        solved = false;

        // Three-pane workspace: brief on the left, editor top-right, results
        // bottom-right. The brief stays visible while you work — a workshop where
        // you have to scroll away from the task to edit is a workshop people quit.
        el.innerHTML = `
        <div class="ws-ide">
            <header class="ws-ide-top">
                <button class="ws-back" onclick="workshopHome(event)">&larr; All workshops</button>
                <div class="ws-ide-id">
                    <span class="ws-ide-kicker">${esc(def.kicker)}</span>
                    <h2 class="ws-ide-title">${esc(def.title)}</h2>
                </div>
                <span class="ws-ide-progress" id="ws-progress">
                    ${def.defectCount} defect${def.defectCount === 1 ? '' : 's'} &middot; none cleared
                </span>
            </header>

            <div class="ws-ide-body">
                <!-- LEFT · the brief -->
                <section class="ws-pane ws-pane-brief">
                    <div class="ws-pane-bar"><span class="ws-pane-name">Brief</span></div>
                    <div class="ws-pane-scroll">
                        <div class="ws-brief-label">The situation</div>
                        ${paras(def.brief, 'ws-brief-p')}

                        <div class="ws-given-label">What you know</div>
                        <ul class="ws-given-list">
                            ${def.given.map(g => `<li>${esc(g)}</li>`).join('')}
                        </ul>

                        <div class="ws-task">
                            <div class="ws-task-label">Your job</div>
                            <p>${esc(def.task)}</p>
                        </div>
                    </div>
                </section>

                <!-- RIGHT · editor over results -->
                <section class="ws-pane ws-pane-work">
                    <div class="ws-pane-bar">
                        <span class="ws-pane-name">message.xml</span>
                        <button class="ws-mini" onclick="Workshop.reset()">reset</button>
                    </div>
                    <textarea id="ws-src" class="ws-src" spellcheck="false">${esc(def.start)}</textarea>

                    <div class="ws-out">
                        <div class="ws-out-tabs" role="tablist">
                            <button class="ws-tab is-on" id="ws-tab-result" role="tab"
                                    onclick="Workshop.pane('result')">Result</button>
                            <button class="ws-tab" id="ws-tab-hints" role="tab"
                                    onclick="Workshop.pane('hints')">Hints<span class="ws-tab-n" id="ws-hint-n" hidden>0</span></button>
                            <div class="ws-out-actions">
                                <button class="ws-hint-btn" onclick="Workshop.hint()">Hint</button>
                                <button class="ws-run-btn" onclick="Workshop.check()">Run the checks</button>
                            </div>
                        </div>
                        <div class="ws-out-body" id="ws-out-result">
                            <div class="ws-idle">
                                Repair the message, then run the checks. You're graded by the same
                                rules engine the Playground validator uses &mdash; and the payment
                                still has to mean what it meant when you started.
                            </div>
                        </div>
                        <div class="ws-out-body" id="ws-out-hints" hidden>
                            <div class="ws-idle">
                                No hints yet. See if you can find all ${def.defectCount} without them.
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>`;
    }

    // -------------------------------------------------------------------------
    // CHECK
    // -------------------------------------------------------------------------
    // Switch the bottom pane between the run result and the hint log.
    function pane(which) {
        const isHints = which === 'hints';
        const r = document.getElementById('ws-out-result');
        const h = document.getElementById('ws-out-hints');
        const tr = document.getElementById('ws-tab-result');
        const th = document.getElementById('ws-tab-hints');
        if (!r || !h) return;
        r.hidden = isHints;
        h.hidden = !isHints;
        if (tr) tr.classList.toggle('is-on', !isHints);
        if (th) th.classList.toggle('is-on', isHints);
    }

    function check() {
        const def = WORKSHOPS.DEFS[current];
        const ta = document.getElementById('ws-src');
        const out = document.getElementById('ws-out-result');
        if (!def || !ta || !out) return;
        pane('result');

        attempts++;
        const g = gradeText(def, ta.value);

        // Progress line
        const prog = document.getElementById('ws-progress');
        if (prog) {
            const cleared = def.defectCount - g.remainingDefects.length;
            prog.textContent = g.parseError
                ? 'the message will not parse'
                : `${def.defectCount} defect${def.defectCount === 1 ? '' : 's'} · ${cleared} cleared`;
        }

        if (g.parseError) {
            out.innerHTML = block('fail', 'The message will not parse',
                esc(g.parseError),
                '<p class="ws-note">Fix the XML itself first — none of the other checks can run until the document is well-formed. A stray tag or an unclosed element is usually the cause.</p>');
            out.scrollTop = 0;
            return;
        }

        if (g.pass) {
            solved = true;
            out.innerHTML = passHtml(def);
            out.scrollTop = 0;
            return;
        }

        // Still broken — show what, without saying how.
        let body = '';

        if (g.integrityFails.length) {
            body += `<div class="ws-integrity">
                <div class="ws-integrity-label">You changed what the payment means</div>
                <ul>${g.integrityFails.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
                <p class="ws-note">Removing the element the validator complains about makes the error
                go away and the payment wrong. Repair the value instead.</p>
            </div>`;
        }

        if (g.errors.length) {
            body += `<div class="ws-findings">
                ${g.errors.map(f => `
                <div class="ws-finding">
                    <div class="ws-finding-top">
                        <span class="ws-finding-rule">${esc(f.rule)}</span>
                        <span class="ws-finding-where">${esc(f.where)}</span>
                    </div>
                    <div class="ws-finding-msg">${esc(f.msg)}</div>
                </div>`).join('')}
            </div>`;
        }

        const n = g.errors.length + g.integrityFails.length;
        out.innerHTML = block('fail',
            `${n} thing${n === 1 ? '' : 's'} still wrong`,
            `Attempt ${attempts}. Keep going — you don't need the spec for any of these.`,
            body);
        out.scrollTop = 0;
    }

    function block(kind, title, sub, body) {
        return `
        <div class="ws-v ws-v-${kind}">
            <div class="ws-v-head">
                <span class="ws-v-badge">${kind === 'pass' ? '&#10003;' : '!'}</span>
                <div>
                    <div class="ws-v-title">${title}</div>
                    <div class="ws-v-sub">${sub}</div>
                </div>
            </div>
            ${body || ''}
        </div>`;
    }

    function passHtml(def) {
        const usedHints = hintsUsed > 0
            ? `You used ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'} across ${attempts} attempt${attempts === 1 ? '' : 's'}.`
            : `No hints, ${attempts} attempt${attempts === 1 ? '' : 's'}. That's the real thing.`;

        const defects = (def.defects || []).map(d => `
            <div class="ws-solved">
                <div class="ws-solved-top">
                    <span class="ws-solved-label">${esc(d.label)}</span>
                    <span class="ws-solved-where">${esc(d.where)}</span>
                </div>
                <p class="ws-solved-reveal">${esc(d.reveal)}</p>
            </div>`).join('');

        const next = (def.next || []).map(x => `
            <li><a href="#/library/${x.id}" onclick="openArticle('${x.id}'); return false;">
                ${esc(lessonTitle(x.id))}</a> <span>${esc(x.why)}</span></li>`).join('');

        return `
        <div class="ws-v ws-v-pass">
            <div class="ws-v-head">
                <span class="ws-v-badge">&#10003;</span>
                <div>
                    <div class="ws-v-title">Clean. Every check passes.</div>
                    <div class="ws-v-sub">${esc(usedHints)}</div>
                </div>
            </div>
            <div class="ws-debrief">
                <div class="ws-debrief-label">What was actually wrong</div>
                ${defects}
                <div class="ws-debrief-label">Why this one mattered</div>
                ${paras(def.debrief, 'ws-debrief-p')}
                ${next ? `<div class="ws-debrief-label">Read next</div><ul class="ws-next">${next}</ul>` : ''}
                <div class="ws-again">
                    <button class="ws-mini" onclick="Workshop.reset()">Run it again from scratch</button>
                    <button class="ws-mini" onclick="workshopHome(event)">Back to all workshops</button>
                </div>
            </div>
        </div>`;
    }

    function lessonTitle(id) {
        if (typeof getArticle === 'function') {
            const a = getArticle(id);
            if (a && a.title) return a.title;
        }
        return id;
    }

    // -------------------------------------------------------------------------
    // HINTS — escalating, and only for defects still present.
    // -------------------------------------------------------------------------
    function hint() {
        const def = WORKSHOPS.DEFS[current];
        const ta = document.getElementById('ws-src');
        const wrap = document.getElementById('ws-out-hints');
        if (!def || !ta || !wrap) return;

        pane('hints');

        const g = gradeText(def, ta.value);
        const remaining = (def.defects || []).filter(d => g.remainingDefects.indexOf(d.id) !== -1);

        // Clear the idle placeholder the first time a real hint lands.
        const idle = wrap.querySelector('.ws-idle');
        if (idle) idle.remove();

        if (!remaining.length) {
            wrap.insertAdjacentHTML('beforeend', `
            <div class="ws-hint">
                <span class="ws-hint-n">nothing left to hint at</span>
                <p>Every planted defect is already cleared. If the checks still fail it's an
                integrity problem &mdash; something about the payment's meaning changed. Run the
                checks and read the block at the top of the Result tab.</p>
            </div>`);
            wrap.scrollTop = wrap.scrollHeight;
            return;
        }

        hintsUsed++;
        const target = remaining[0];
        wrap.insertAdjacentHTML('beforeend', `
        <div class="ws-hint">
            <span class="ws-hint-n">hint ${hintsUsed}</span>
            <p>${esc(target.hint)}</p>
        </div>`);

        const badge = document.getElementById('ws-hint-n');
        if (badge) { badge.hidden = false; badge.textContent = String(hintsUsed); }
        wrap.scrollTop = wrap.scrollHeight;
    }

    function reset() {
        if (current) open(current);
    }

    // -------------------------------------------------------------------------
    // STYLES
    // -------------------------------------------------------------------------
    function injectStyles() {
        if (document.getElementById('ws-styles')) return;
        const css = `
        .ws-hero { max-width: 760px; margin-bottom: 40px; }
        .ws-hero-title { font-family: var(--font-display); font-weight: 800; font-size: clamp(34px, 5vw, 54px);
            line-height: 1.05; letter-spacing: -0.02em; color: var(--text); margin: 10px 0 16px; }
        .ws-hero-sub { font-size: 16px; line-height: 1.7; color: var(--text-muted); margin: 0; }

        .ws-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }

        .ws-card { display: flex; flex-direction: column; gap: 12px; padding: 24px;
            background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md);
            cursor: pointer; transition: border-color var(--dur-fast) var(--ease-out),
            transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out); }
        .ws-card:hover { border-color: var(--primary); transform: translateY(-3px); box-shadow: var(--shadow-md, 0 12px 32px rgba(0,0,0,0.07)); }
        .ws-card.is-locked { cursor: default; opacity: 0.62; }
        .ws-card.is-locked:hover { border-color: var(--border); transform: none; box-shadow: none; }
        .ws-card-top { display: flex; align-items: center; gap: 10px; }
        .ws-card-n { font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--primary); }
        .ws-card-kicker { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em;
            text-transform: uppercase; color: var(--text-faint); }
        .ws-card-soon { margin-left: auto; font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.07em;
            text-transform: uppercase; padding: 3px 8px; border-radius: var(--radius-pill);
            background: var(--surface-alt); border: 1px solid var(--border); color: var(--text-faint); }
        .ws-card-title { font-family: var(--font-display); font-weight: 700; font-size: 21px; color: var(--text); margin: 0; }
        .ws-card-blurb { font-size: 14px; line-height: 1.65; color: var(--text-muted); margin: 0; flex: 1; }
        .ws-card-skills { display: flex; flex-wrap: wrap; gap: 6px; }
        .ws-skill { font-family: var(--font-mono); font-size: 10.5px; padding: 3px 9px;
            border-radius: var(--radius-pill); background: var(--surface-alt);
            border: 1px solid var(--border); color: var(--text-muted); }
        .ws-card-foot { display: flex; align-items: center; justify-content: space-between;
            gap: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
        .ws-card-meta { font-family: var(--font-mono); font-size: 11px; color: var(--text-faint); }
        .ws-card-cta { font-size: 13px; font-weight: 600; color: var(--primary); }
        .ws-card-cta.is-off { color: var(--text-faint); }
        .ws-foot-note { margin-top: 32px; font-size: 13.5px; line-height: 1.7;
            color: var(--text-faint); max-width: 620px; }

        /* ---- IDE shell: brief | (editor over results) ---- */
        .ws-ide {
            display: flex; flex-direction: column;
            height: calc(100vh - 190px); min-height: 600px;
        }
        .ws-ide-top {
            display: flex; align-items: center; gap: 18px;
            padding-bottom: 14px; margin-bottom: 14px;
            border-bottom: 1px solid var(--border);
        }
        .ws-back {
            background: transparent; border: 1px solid var(--border); cursor: pointer;
            padding: 7px 14px; border-radius: var(--radius-pill);
            font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted);
            transition: border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }
        .ws-back:hover { border-color: var(--primary); color: var(--primary); }
        .ws-ide-id { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .ws-ide-kicker {
            font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em;
            text-transform: uppercase; color: var(--primary);
        }
        .ws-ide-title {
            font-family: var(--font-display); font-weight: 800; font-size: 20px;
            letter-spacing: -0.01em; color: var(--text); margin: 0;
        }
        .ws-ide-progress {
            margin-left: auto; flex-shrink: 0;
            font-family: var(--font-mono); font-size: 11px; color: var(--primary);
            padding: 5px 12px; border-radius: var(--radius-pill);
            background: var(--glass-tint, rgba(16,185,129,0.08)); border: 1px solid var(--border);
        }

        .ws-ide-body {
            flex: 1; min-height: 0;
            display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); gap: 16px;
        }
        .ws-pane {
            display: flex; flex-direction: column; min-width: 0; min-height: 0;
            background: var(--surface); border: 1px solid var(--border);
            border-radius: var(--radius-md); overflow: hidden;
        }
        .ws-pane-bar {
            display: flex; align-items: center; gap: 10px; flex-shrink: 0;
            padding: 10px 14px; border-bottom: 1px solid var(--border); background: var(--bg-deep);
        }
        .ws-pane-name { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-faint); }
        .ws-mini {
            margin-left: auto; background: transparent; border: 1px solid var(--border);
            color: var(--text-muted); font-family: var(--font-mono); font-size: 10.5px;
            padding: 4px 10px; border-radius: var(--radius-xs); cursor: pointer;
        }
        .ws-mini:hover { border-color: var(--border-hi); color: var(--text); }
        .ws-pane-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 20px; }

        /* ---- Left pane: the brief ---- */
        .ws-brief-label, .ws-given-label, .ws-task-label,
        .ws-integrity-label, .ws-debrief-label {
            font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em;
            text-transform: uppercase; color: var(--text-faint); margin: 20px 0 9px;
        }
        .ws-pane-scroll > .ws-brief-label:first-child { margin-top: 0; }
        .ws-brief-p { font-size: 14px; line-height: 1.75; color: var(--text); margin: 0 0 12px; }
        .ws-given-list { margin: 0; padding-left: 17px; }
        .ws-given-list li { font-size: 13.5px; line-height: 1.7; color: var(--text-muted); }
        .ws-task {
            margin-top: 20px; padding: 14px 16px; border-radius: var(--radius-sm);
            background: var(--glass-tint, rgba(16,185,129,0.06));
            border: 1px solid var(--primary-deep, var(--border));
        }
        .ws-task .ws-task-label { margin-top: 0; }
        .ws-task p { margin: 0; font-size: 13.5px; line-height: 1.7; color: var(--text); }

        /* ---- Right pane: editor over output ---- */
        .ws-src {
            flex: 1 1 55%; min-height: 180px; resize: none; border: 0; outline: 0; display: block;
            width: 100%; padding: 14px; background: transparent; color: var(--primary-bright);
            font-family: var(--font-mono); font-size: 12px; line-height: 1.6;
            white-space: pre; overflow: auto; tab-size: 2;
        }
        .ws-out {
            flex: 1 1 45%; min-height: 0; display: flex; flex-direction: column;
            border-top: 1px solid var(--border);
        }
        .ws-out-tabs {
            display: flex; align-items: center; gap: 4px; flex-shrink: 0;
            padding: 8px 10px; background: var(--bg-deep); border-bottom: 1px solid var(--border);
        }
        .ws-tab {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 6px 14px; border: 0; border-radius: var(--radius-pill);
            background: transparent; cursor: pointer;
            font-family: var(--font-display); font-weight: 600; font-size: 12.5px;
            color: var(--text-faint);
        }
        .ws-tab:hover { color: var(--text); }
        .ws-tab.is-on { background: var(--surface); color: var(--primary); }
        .ws-tab-n {
            font-family: var(--font-mono); font-size: 9.5px; padding: 1px 6px;
            border-radius: var(--radius-pill); background: var(--warning, #e3b341); color: #3a2c00;
        }
        .ws-out-actions { margin-left: auto; display: flex; gap: 8px; }
        .ws-run-btn {
            padding: 7px 18px; border-radius: var(--radius-pill); border: 0; cursor: pointer;
            background: var(--primary); color: #fff; font-weight: 700; font-size: 12.5px;
        }
        .ws-run-btn:hover { background: var(--primary-bright); }
        .ws-hint-btn {
            padding: 7px 14px; border-radius: var(--radius-pill); cursor: pointer;
            background: transparent; border: 1px solid var(--border);
            color: var(--text-muted); font-size: 12.5px;
        }
        .ws-hint-btn:hover { border-color: var(--border-hi); color: var(--text); }
        .ws-out-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; }
        .ws-idle { font-size: 13px; line-height: 1.7; color: var(--text-faint); }

        .ws-hint {
            padding: 12px 14px; border-radius: var(--radius-sm); background: var(--surface-alt);
            border: 1px solid var(--border); border-left: 3px solid var(--warning, #e3b341);
            margin-bottom: 10px;
        }
        .ws-hint-n {
            font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.07em;
            text-transform: uppercase; color: var(--text-faint);
        }
        .ws-hint p { margin: 6px 0 0; font-size: 13.5px; line-height: 1.7; color: var(--text-muted); }

        .ws-v { border-radius: var(--radius-sm); border: 1px solid var(--border); padding: 16px; }
        .ws-v-fail { border-color: var(--danger, #f1707a); background: rgba(241,112,122,0.06); }
        .ws-v-pass { border-color: var(--success, #4ad6a0); background: rgba(74,214,160,0.07); }
        .ws-v-head { display: flex; align-items: center; gap: 12px; }
        .ws-v-badge {
            flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; color: #fff;
            display: flex; align-items: center; justify-content: center;
            font-family: var(--font-display); font-weight: 800; font-size: 14px;
        }
        .ws-v-fail .ws-v-badge { background: var(--danger, #C13543); }
        .ws-v-pass .ws-v-badge { background: var(--success, #4ad6a0); }
        .ws-v-title { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--text); }
        .ws-v-sub { margin-top: 2px; font-size: 12.5px; color: var(--text-muted); }

        .ws-integrity {
            margin-top: 14px; padding: 13px 15px; border-radius: var(--radius-sm);
            background: var(--surface); border: 1px solid var(--danger, #f1707a);
        }
        .ws-integrity ul { margin: 0; padding-left: 17px; }
        .ws-integrity li { font-size: 13px; line-height: 1.7; color: var(--text); }
        .ws-note { margin: 9px 0 0; font-size: 12px; line-height: 1.65; color: var(--text-muted); }

        .ws-findings { display: flex; flex-direction: column; gap: 9px; margin-top: 14px; }
        .ws-finding {
            padding: 12px 14px; border-radius: var(--radius-sm); background: var(--surface);
            border: 1px solid var(--border); border-left: 3px solid var(--danger, #f1707a);
        }
        .ws-finding-top { display: flex; align-items: center; gap: 10px; }
        .ws-finding-rule { font-family: var(--font-display); font-weight: 700; font-size: 13px; color: var(--text); }
        .ws-finding-where { margin-left: auto; font-family: var(--font-mono); font-size: 10.5px; color: var(--primary); }
        .ws-finding-msg { margin-top: 6px; font-size: 12.5px; line-height: 1.6; color: var(--text-muted); }

        .ws-debrief { margin-top: 22px; padding-top: 20px; border-top: 1px solid var(--border); }
        .ws-solved { padding: 14px 16px; border-radius: var(--radius-sm); background: var(--surface);
            border: 1px solid var(--border); margin-bottom: 10px; }
        .ws-solved-top { display: flex; align-items: center; gap: 10px; }
        .ws-solved-label { font-family: var(--font-display); font-weight: 700; font-size: 14px; color: var(--text); }
        .ws-solved-where { margin-left: auto; font-family: var(--font-mono); font-size: 11px; color: var(--primary); }
        .ws-solved-reveal { margin: 8px 0 0; font-size: 13.5px; line-height: 1.7; color: var(--text-muted); }
        .ws-debrief-p { font-size: 14.5px; line-height: 1.75; color: var(--text); margin: 0 0 14px; }
        .ws-next { margin: 0 0 20px; padding-left: 18px; }
        .ws-next li { font-size: 14px; line-height: 1.8; color: var(--text-muted); }
        .ws-next a { color: var(--primary); font-weight: 600; text-decoration: none; }
        .ws-next a:hover { text-decoration: underline; }
        .ws-next span { color: var(--text-faint); }
        .ws-again { display: flex; gap: 10px; flex-wrap: wrap; }

        /* Below ~1040px the side-by-side stops being usable: the editor gets too
           narrow for XML lines. Drop to a single column with natural page scroll
           rather than trying to squeeze three panes into a phone. */
        @media (max-width: 1040px) {
            .ws-ide { height: auto; min-height: 0; }
            .ws-ide-body { grid-template-columns: 1fr; }
            .ws-pane-brief .ws-pane-scroll { max-height: 340px; }
            .ws-pane-work { min-height: 620px; }
        }
        @media (max-width: 720px) {
            .ws-grid { grid-template-columns: 1fr; }
            .ws-ide-top { flex-wrap: wrap; gap: 10px; }
            .ws-ide-progress { margin-left: 0; }
            .ws-src { font-size: 11.5px; }
            .ws-out-tabs { flex-wrap: wrap; }
            .ws-out-actions { margin-left: 0; width: 100%; }
            .ws-run-btn { flex: 1; }
        }
        `;
        const style = document.createElement('style');
        style.id = 'ws-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function init(id) {
        mountId = id || 'ws-root';
        injectStyles();
    }

    // Styles are needed the moment any view renders.
    injectStyles();

    return { init, showLanding, open, check, hint, reset, pane };
})();

window.Workshop = Workshop;
