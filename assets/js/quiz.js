// =============================================================================
// quiz.js  —  Per-level knowledge quiz (Session: Track 2 / task 8)
// -----------------------------------------------------------------------------
// Renders a scenario-based quiz for a Library level from ACADEMY_QUIZ
// (assets/js/quiz.data.js). Self-contained: one global `Quiz` object plus a
// global `openQuiz(level)` entry point, its own injected styles (theme-aware via
// the shared CSS variables), and a small localStorage best-score store. No
// dependencies beyond the DOM and the quiz data.
//
// Question types handled: 'single', 'multi', 'boolean' (see quiz.data.js schema).
// Flow: intro -> question (select -> check -> explanation -> next) -> results.
// Results screen shows score, pass/fail (ACADEMY_QUIZ.meta.passPct), a per-
// question recap, a copy-to-clipboard share line, retake, and back-to-Library.
// =============================================================================

const Quiz = (function () {
    const STORE_KEY = 'iso-academy-quiz-v1';

    // ---- best-score store (defensive, degrades to {} like Progress) ---------
    function readStore() {
        try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
        catch (e) { return {}; }
    }
    function writeStore(s) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }
        catch (e) { /* private mode / quota — best score just won't persist */ }
    }
    function getBest(level) {
        const s = readStore();
        return s[String(level)] || null;
    }
    function saveBest(level, rec) {
        const s = readStore();
        const prev = s[String(level)];
        if (!prev || rec.pct > prev.pct) { s[String(level)] = rec; writeStore(s); }
    }

    // ---- data helpers -------------------------------------------------------
    function levelData(level) {
        if (typeof ACADEMY_QUIZ === 'undefined') return null;
        return (ACADEMY_QUIZ.levels || []).find(l => l.level === Number(level)) || null;
    }
    function hasQuestions(level) {
        const l = levelData(level);
        return !!(l && l.questions && l.questions.length);
    }
    function passPct() {
        return (typeof ACADEMY_QUIZ !== 'undefined' && ACADEMY_QUIZ.meta && ACADEMY_QUIZ.meta.passPct) || 70;
    }

    // ---- tiny escaper -------------------------------------------------------
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // ---- scoring ------------------------------------------------------------
    function isCorrect(q, sel) {
        if (q.type === 'boolean') return sel === q.answer;
        if (q.type === 'single') {
            if (!Array.isArray(sel) || sel.length !== 1) return false;
            return !!q.options[sel[0]] && q.options[sel[0]].correct === true;
        }
        if (q.type === 'multi') {
            if (!Array.isArray(sel)) return false;
            const want = q.options.map((o, i) => o.correct ? i : -1).filter(i => i >= 0).sort();
            const got = sel.slice().sort();
            return want.length === got.length && want.every((v, i) => v === got[i]);
        }
        return false;
    }

    // ---- live quiz state ----------------------------------------------------
    let root = null;           // container element
    let state = null;          // { level, meta, questions, idx, results[], sel, checked }

    function start(containerId, level) {
        root = document.getElementById(containerId);
        if (!root) return;
        const meta = levelData(level);
        if (!meta || !meta.questions || !meta.questions.length) {
            root.innerHTML = `<div class="quiz"><p class="quiz-empty">No quiz questions for this level yet — check back soon.</p></div>`;
            return;
        }
        state = { level: Number(level), meta, questions: meta.questions, idx: 0, results: [], sel: null, checked: false };
        bind();
        renderIntro();
    }

    // single delegated handler for the whole quiz
    let bound = false;
    function bind() {
        if (bound || !root) return;
        bound = true;
        root.addEventListener('click', onClick);
    }
    function onClick(e) {
        const el = e.target.closest('[data-action]');
        if (!el || !root.contains(el)) return;
        const action = el.getAttribute('data-action');
        if (action === 'begin') { state.idx = 0; state.results = []; renderQuestion(); }
        else if (action === 'opt') toggleOption(el.getAttribute('data-i'));
        else if (action === 'check') checkAnswer();
        else if (action === 'next') nextQuestion();
        else if (action === 'retake') { state.idx = 0; state.results = []; renderIntro(); }
        else if (action === 'library') { if (typeof navigate === 'function') navigate('library'); }
        else if (action === 'share') shareResult(el);
    }

    // ---- INTRO --------------------------------------------------------------
    function renderIntro() {
        const m = state.meta;
        const best = getBest(state.level);
        const n = state.questions.length;
        const bestHtml = best ? `
            <div class="quiz-best">Your best: <strong>${best.correct}/${best.total}</strong> (${best.pct}%)</div>` : '';
        root.innerHTML = `
        <div class="quiz">
            <button class="quiz-back" data-action="library">← Library</button>
            <div class="quiz-intro">
                <div class="quiz-eyebrow">Level ${state.level} · Knowledge check</div>
                <h2 class="quiz-title">${esc(m.title)}</h2>
                <p class="quiz-blurb">${esc(m.blurb || '')}</p>
                <div class="quiz-meta">
                    <span>${n} question${n === 1 ? '' : 's'}</span>
                    <span class="quiz-dot">·</span>
                    <span>Pass mark ${passPct()}%</span>
                    <span class="quiz-dot">·</span>
                    <span>Mixed formats</span>
                </div>
                ${bestHtml}
                <button class="quiz-btn quiz-btn-primary" data-action="begin">Start the quiz</button>
                <p class="quiz-fineprint">Fresh, scenario-based questions — harder than the inline checks. Your score is saved on this device only.</p>
            </div>
        </div>`;
        if (window.Motion) Motion.scan(root);
    }

    // ---- QUESTION -----------------------------------------------------------
    function renderQuestion() {
        const q = state.questions[state.idx];
        state.sel = (q.type === 'boolean') ? null : [];
        state.checked = false;
        const total = state.questions.length;
        const num = state.idx + 1;
        const pct = Math.round((state.idx) / total * 100);

        let optionsHtml = '';
        if (q.type === 'boolean') {
            optionsHtml = `
                <div class="quiz-options quiz-bool">
                    <button class="quiz-opt" data-action="opt" data-i="true"><span class="quiz-opt-mark"></span><span class="quiz-opt-text">True</span></button>
                    <button class="quiz-opt" data-action="opt" data-i="false"><span class="quiz-opt-mark"></span><span class="quiz-opt-text">False</span></button>
                </div>`;
        } else {
            const kind = q.type === 'multi' ? 'quiz-multi' : 'quiz-single';
            optionsHtml = `
                <div class="quiz-options ${kind}">
                    ${q.options.map((o, i) => `
                        <button class="quiz-opt" data-action="opt" data-i="${i}">
                            <span class="quiz-opt-mark"></span>
                            <span class="quiz-opt-text">${esc(o.text)}</span>
                        </button>`).join('')}
                </div>`;
        }

        const hint = q.type === 'multi'
            ? '<span class="quiz-hint">Select all that apply</span>'
            : q.type === 'boolean'
                ? '<span class="quiz-hint">True or false</span>'
                : '<span class="quiz-hint">Choose one</span>';

        root.innerHTML = `
        <div class="quiz">
            <button class="quiz-back" data-action="library">← Library</button>
            <div class="quiz-progress" aria-hidden="true"><span class="quiz-progress-fill" style="width:${pct}%"></span></div>
            <div class="quiz-qhead">
                <span class="quiz-qcount">Question ${num} of ${total}</span>
                ${hint}
            </div>
            <p class="quiz-prompt">${esc(q.prompt)}</p>
            ${optionsHtml}
            <div class="quiz-feedback" id="quiz-feedback" hidden></div>
            <div class="quiz-actions">
                <button class="quiz-btn quiz-btn-primary" id="quiz-check" data-action="check" disabled>Check answer</button>
                <button class="quiz-btn quiz-btn-ghost" id="quiz-next" data-action="next" hidden>${num === total ? 'See results' : 'Next question →'}</button>
            </div>
        </div>`;
        if (window.Motion) Motion.scan(root);
    }

    function toggleOption(iRaw) {
        if (state.checked) return;
        const q = state.questions[state.idx];
        const buttons = Array.from(root.querySelectorAll('.quiz-opt'));
        if (q.type === 'boolean') {
            state.sel = (String(iRaw) === 'true');
            buttons.forEach(b => b.classList.toggle('is-selected', b.getAttribute('data-i') === String(iRaw)));
        } else if (q.type === 'single') {
            state.sel = [Number(iRaw)];
            buttons.forEach(b => b.classList.toggle('is-selected', b.getAttribute('data-i') === String(iRaw)));
        } else { // multi
            const idx = Number(iRaw);
            const at = state.sel.indexOf(idx);
            if (at >= 0) state.sel.splice(at, 1); else state.sel.push(idx);
            buttons.forEach(b => b.classList.toggle('is-selected', state.sel.indexOf(Number(b.getAttribute('data-i'))) >= 0));
        }
        const hasSel = (q.type === 'boolean') ? (state.sel !== null) : (state.sel.length > 0);
        const checkBtn = root.querySelector('#quiz-check');
        if (checkBtn) checkBtn.disabled = !hasSel;
    }

    function checkAnswer() {
        if (state.checked) return;
        const q = state.questions[state.idx];
        const correct = isCorrect(q, state.sel);
        state.checked = true;
        state.results.push({ id: q.id, prompt: q.prompt, correct, ref: q.ref || null });

        // lock + mark options
        const buttons = Array.from(root.querySelectorAll('.quiz-opt'));
        buttons.forEach(b => {
            b.classList.add('is-locked');
            b.setAttribute('data-action', 'noop');
            const key = b.getAttribute('data-i');
            let isRight = false, isChosen = false;
            if (q.type === 'boolean') {
                isRight = (key === String(q.answer));
                isChosen = (state.sel !== null && key === String(state.sel));
            } else {
                const i = Number(key);
                isRight = !!(q.options[i] && q.options[i].correct);
                isChosen = state.sel.indexOf(i) >= 0;
            }
            if (isRight) b.classList.add('is-right');
            if (isChosen && !isRight) b.classList.add('is-wrong');
        });

        // feedback + explanation
        const fb = root.querySelector('#quiz-feedback');
        if (fb) {
            const reviewHtml = (!correct && q.ref)
                ? `<a class="quiz-review" href="javascript:void(0)" onclick="openArticle('${esc(q.ref)}')">Review the lesson →</a>`
                : '';
            fb.innerHTML = `
                <div class="quiz-verdict ${correct ? 'is-right' : 'is-wrong'}">${correct ? 'Correct' : 'Not quite'}</div>
                <p class="quiz-explain">${esc(q.explanation)}</p>
                ${reviewHtml}`;
            fb.hidden = false;
        }
        const checkBtn = root.querySelector('#quiz-check');
        const nextBtn = root.querySelector('#quiz-next');
        if (checkBtn) checkBtn.hidden = true;
        if (nextBtn) nextBtn.hidden = false;
    }

    function nextQuestion() {
        if (state.idx < state.questions.length - 1) { state.idx++; renderQuestion(); }
        else renderResults();
    }

    // ---- RESULTS ------------------------------------------------------------
    function renderResults() {
        const total = state.questions.length;
        const correct = state.results.filter(r => r.correct).length;
        const pct = Math.round(correct / total * 100);
        const passed = pct >= passPct();
        saveBest(state.level, { correct, total, pct, at: new Date().toISOString() });

        const verdict = passed
            ? { t: 'Passed', m: pctMessage(pct, true) }
            : { t: 'Keep going', m: pctMessage(pct, false) };

        const recap = state.results.map((r, i) => `
            <li class="quiz-recap-item ${r.correct ? 'is-right' : 'is-wrong'}">
                <span class="quiz-recap-ico" aria-hidden="true">${r.correct ? '✓' : '✕'}</span>
                <span class="quiz-recap-q">Q${i + 1}. ${esc(r.prompt)}</span>
                ${(!r.correct && r.ref) ? `<a class="quiz-recap-link" href="javascript:void(0)" onclick="openArticle('${esc(r.ref)}')">Review →</a>` : ''}
            </li>`).join('');

        const shareText = `I scored ${correct}/${total} (${pct}%) on the ISO 20022 Academy "${state.meta.title}" quiz. Test yourself: https://iso20022academy.in/`;

        root.innerHTML = `
        <div class="quiz">
            <button class="quiz-back" data-action="library">← Library</button>
            <div class="quiz-result ${passed ? 'is-pass' : 'is-fail'}">
                <div class="quiz-score-ring" style="--p:${pct}">
                    <span class="quiz-score-pct">${pct}%</span>
                    <span class="quiz-score-frac">${correct}/${total}</span>
                </div>
                <div class="quiz-result-body">
                    <div class="quiz-eyebrow">Level ${state.level} · ${esc(state.meta.title)}</div>
                    <h2 class="quiz-result-title">${verdict.t}</h2>
                    <p class="quiz-result-msg">${esc(verdict.m)}</p>
                    <div class="quiz-result-actions">
                        <button class="quiz-btn quiz-btn-primary" data-action="retake">Retake</button>
                        <button class="quiz-btn quiz-btn-ghost" data-action="share" data-share="${esc(shareText)}">Copy result to share</button>
                        <button class="quiz-btn quiz-btn-ghost" data-action="library">Back to Library</button>
                    </div>
                </div>
            </div>
            <div class="quiz-recap">
                <div class="quiz-recap-head">Review</div>
                <ul class="quiz-recap-list">${recap}</ul>
            </div>
        </div>`;
        if (window.Motion) Motion.scan(root);
    }

    function pctMessage(pct, passed) {
        if (pct === 100) return 'A perfect run. You could teach this level.';
        if (passed) return 'Solid — you have the fundamentals of this level down.';
        if (pct >= 50) return 'Close. Review the ones you missed and run it again.';
        return 'Worth another read through the level before you retake this.';
    }

    function shareResult(btn) {
        const text = btn.getAttribute('data-share') || '';
        const done = () => {
            const old = btn.textContent;
            btn.textContent = 'Copied ✓';
            setTimeout(() => { btn.textContent = old; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
        } else fallbackCopy(text, done);
    }
    function fallbackCopy(text, done) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta); done();
        } catch (e) { /* no-op */ }
    }

    // ---- styles (injected once) --------------------------------------------
    function injectStyles() {
        if (typeof document === 'undefined' || !document.head) return;
        if (document.getElementById('quiz-styles')) return;
        const css = `
        .quiz{max-width:760px;margin:0 auto;padding:var(--space-xl,32px) var(--content-pad,20px) var(--space-3xl,64px);font-family:var(--font-sans);color:var(--text)}
        .quiz-back{background:none;border:none;color:var(--text-muted);font:inherit;font-size:var(--fs-small,14px);cursor:pointer;padding:6px 0;margin-bottom:var(--space-lg,24px)}
        .quiz-back:hover{color:var(--primary)}
        .quiz-eyebrow{font-size:var(--fs-eyebrow,12px);letter-spacing:.08em;text-transform:uppercase;color:var(--primary);font-weight:var(--fw-semibold,600);margin-bottom:10px}
        .quiz-intro{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg,18px);padding:var(--space-2xl,40px);box-shadow:var(--shadow-sm)}
        .quiz-title{font-family:var(--font-display,var(--font-sans));font-size:var(--fs-h2,30px);line-height:var(--lh-tight,1.15);margin:0 0 12px}
        .quiz-blurb{color:var(--text-secondary,var(--text-muted));font-size:var(--fs-lead,17px);line-height:var(--lh-relaxed,1.6);margin:0 0 18px}
        .quiz-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;color:var(--text-muted);font-size:var(--fs-small,14px);margin-bottom:14px}
        .quiz-dot{opacity:.5}
        .quiz-best{display:inline-block;background:var(--surface-alt,rgba(0,0,0,.04));border:1px solid var(--border);border-radius:var(--radius-pill,999px);padding:6px 14px;font-size:var(--fs-small,14px);margin-bottom:20px}
        .quiz-fineprint{color:var(--text-faint,var(--text-muted));font-size:var(--fs-micro,12px);margin:16px 0 0;line-height:var(--lh-normal,1.5)}
        .quiz-empty{color:var(--text-muted);text-align:center;padding:40px}

        .quiz-progress{height:4px;background:var(--border);border-radius:var(--radius-pill,999px);overflow:hidden;margin-bottom:var(--space-lg,24px)}
        .quiz-progress-fill{display:block;height:100%;background:var(--primary);border-radius:inherit;transition:width var(--dur,.35s) var(--ease-out,ease)}
        .quiz-qhead{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:12px}
        .quiz-qcount{font-size:var(--fs-small,14px);color:var(--text-muted);font-weight:var(--fw-semibold,600)}
        .quiz-hint{font-size:var(--fs-micro,12px);color:var(--text-faint,var(--text-muted));text-transform:uppercase;letter-spacing:.06em}
        .quiz-prompt{font-size:var(--fs-h4,20px);line-height:var(--lh-snug,1.35);font-weight:var(--fw-semibold,600);margin:0 0 var(--space-lg,24px)}

        .quiz-options{display:flex;flex-direction:column;gap:10px;margin-bottom:var(--space-lg,24px)}
        .quiz-bool{flex-direction:row}
        .quiz-bool .quiz-opt{flex:1;justify-content:center}
        .quiz-opt{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-md,14px);padding:14px 16px;font:inherit;font-size:var(--fs-body,16px);color:var(--text);cursor:pointer;transition:border-color var(--dur-fast,.15s),background var(--dur-fast,.15s),transform var(--dur-fast,.15s)}
        .quiz-opt:hover:not(.is-locked){border-color:var(--primary);transform:translateY(-1px)}
        .quiz-opt-mark{flex:none;width:20px;height:20px;border:1.5px solid var(--border-hi,var(--border));border-radius:50%;position:relative;transition:all var(--dur-fast,.15s)}
        .quiz-multi .quiz-opt-mark{border-radius:6px}
        .quiz-opt.is-selected{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 7%,var(--surface))}
        .quiz-opt.is-selected .quiz-opt-mark{border-color:var(--primary);background:var(--primary)}
        .quiz-opt.is-selected .quiz-opt-mark::after{content:"";position:absolute;inset:0;margin:auto;width:7px;height:7px;border-radius:inherit;background:#fff}
        .quiz-multi .quiz-opt.is-selected .quiz-opt-mark::after{width:5px;height:9px;background:none;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg);top:-1px}
        .quiz-opt.is-locked{cursor:default}
        .quiz-opt.is-right{border-color:var(--success,#0B8A60);background:color-mix(in srgb,var(--success,#0B8A60) 10%,var(--surface))}
        .quiz-opt.is-right .quiz-opt-mark{border-color:var(--success,#0B8A60);background:var(--success,#0B8A60)}
        .quiz-opt.is-wrong{border-color:var(--danger,#C13543);background:color-mix(in srgb,var(--danger,#C13543) 8%,var(--surface))}
        .quiz-opt.is-wrong .quiz-opt-mark{border-color:var(--danger,#C13543);background:var(--danger,#C13543)}

        .quiz-feedback{background:var(--surface-alt,rgba(0,0,0,.03));border:1px solid var(--border);border-left-width:3px;border-radius:var(--radius-md,14px);padding:16px 18px;margin-bottom:var(--space-lg,24px)}
        .quiz-verdict{font-weight:var(--fw-bold,700);font-size:var(--fs-small,14px);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
        .quiz-verdict.is-right{color:var(--success,#0B8A60)}
        .quiz-verdict.is-wrong{color:var(--danger,#C13543)}
        .quiz-feedback:has(.is-right){border-left-color:var(--success,#0B8A60)}
        .quiz-feedback:has(.is-wrong){border-left-color:var(--danger,#C13543)}
        .quiz-explain{margin:0;font-size:var(--fs-body,16px);line-height:var(--lh-relaxed,1.6);color:var(--text-secondary,var(--text))}
        .quiz-review,.quiz-recap-link{display:inline-block;margin-top:10px;color:var(--primary);font-weight:var(--fw-semibold,600);font-size:var(--fs-small,14px);text-decoration:none}
        .quiz-review:hover,.quiz-recap-link:hover{text-decoration:underline}

        .quiz-actions{display:flex;gap:12px;align-items:center}
        .quiz-btn{font:inherit;font-weight:var(--fw-semibold,600);font-size:var(--fs-body,16px);border-radius:var(--radius-pill,999px);padding:12px 24px;cursor:pointer;border:1.5px solid transparent;transition:transform var(--dur-fast,.15s),background var(--dur-fast,.15s),box-shadow var(--dur-fast,.15s)}
        .quiz-btn:active{transform:scale(var(--press-scale,.98))}
        .quiz-btn-primary{background:var(--primary);color:#fff;box-shadow:var(--shadow-sm)}
        .quiz-btn-primary:hover{background:var(--primary-hover,var(--primary-deep,var(--primary)))}
        .quiz-btn-primary:disabled{opacity:.45;cursor:not-allowed}
        .quiz-btn-ghost{background:transparent;color:var(--text);border-color:var(--border-hi,var(--border))}
        .quiz-btn-ghost:hover{border-color:var(--primary);color:var(--primary)}

        .quiz-result{display:flex;gap:var(--space-xl,32px);align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg,18px);padding:var(--space-2xl,40px);box-shadow:var(--shadow-sm);margin-bottom:var(--space-xl,32px);flex-wrap:wrap}
        .quiz-score-ring{flex:none;width:132px;height:132px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:conic-gradient(var(--primary) calc(var(--p)*1%),var(--border) 0);position:relative}
        .quiz-score-ring::before{content:"";position:absolute;inset:10px;border-radius:50%;background:var(--surface)}
        .quiz-result.is-fail .quiz-score-ring{background:conic-gradient(var(--danger,#C13543) calc(var(--p)*1%),var(--border) 0)}
        .quiz-score-pct{position:relative;font-family:var(--font-display,var(--font-sans));font-size:var(--fs-h2,30px);font-weight:var(--fw-black,800);line-height:1}
        .quiz-score-frac{position:relative;font-size:var(--fs-small,14px);color:var(--text-muted);margin-top:2px}
        .quiz-result-body{flex:1;min-width:240px}
        .quiz-result-title{font-family:var(--font-display,var(--font-sans));font-size:var(--fs-h2,30px);margin:4px 0 8px}
        .quiz-result-msg{color:var(--text-secondary,var(--text-muted));font-size:var(--fs-lead,17px);line-height:var(--lh-relaxed,1.6);margin:0 0 18px}
        .quiz-result-actions{display:flex;flex-wrap:wrap;gap:10px}

        .quiz-recap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg,18px);padding:var(--space-xl,32px)}
        .quiz-recap-head{font-size:var(--fs-eyebrow,12px);text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);font-weight:var(--fw-semibold,600);margin-bottom:14px}
        .quiz-recap-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
        .quiz-recap-item{display:flex;align-items:flex-start;gap:10px;font-size:var(--fs-body,16px);line-height:var(--lh-snug,1.35)}
        .quiz-recap-ico{flex:none;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff}
        .quiz-recap-item.is-right .quiz-recap-ico{background:var(--success,#0B8A60)}
        .quiz-recap-item.is-wrong .quiz-recap-ico{background:var(--danger,#C13543)}
        .quiz-recap-q{flex:1;color:var(--text-secondary,var(--text))}
        .quiz-recap-link{margin-top:0;white-space:nowrap}
        @media (max-width:560px){.quiz-result{flex-direction:column;text-align:center}.quiz-result-actions{justify-content:center}.quiz-bool{flex-direction:column}}

        /* Library "Test yourself" CTA (rendered by Articles.indexHtml) */
        .quiz-cta{display:flex;align-items:center;gap:16px;width:100%;margin-top:var(--space-lg,24px);text-align:left;background:color-mix(in srgb,var(--primary) 5%,var(--surface));border:1.5px solid color-mix(in srgb,var(--primary) 25%,var(--border));border-radius:var(--radius-md,16px);padding:16px 20px;cursor:pointer;font:inherit;color:var(--text);transition:transform var(--dur-fast,.15s),border-color var(--dur-fast,.15s),box-shadow var(--dur-fast,.15s)}
        .quiz-cta:hover{transform:translateY(-2px);border-color:var(--primary);box-shadow:var(--shadow-sm)}
        .quiz-cta-ico{flex:none;width:40px;height:40px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:var(--fw-bold,700)}
        .quiz-cta-body{flex:1}
        .quiz-cta-title{display:block;font-weight:var(--fw-semibold,600);font-size:var(--fs-body,16px)}
        .quiz-cta-sub{display:block;color:var(--text-muted);font-size:var(--fs-small,14px);margin-top:2px}
        .quiz-cta-best{flex:none;font-size:var(--fs-small,14px);color:var(--primary);font-weight:var(--fw-semibold,600)}
        .quiz-cta-go{flex:none;color:var(--primary)}
        `;
        const style = document.createElement('style');
        style.id = 'quiz-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Inject styles eagerly so the Library "Test yourself" CTA is themed
    // before any quiz is opened.
    injectStyles();

    // ---- public API ---------------------------------------------------------
    return {
        hasQuestions,
        levelData,
        getBest,
        start(containerId, level) { injectStyles(); start(containerId, level); },
        ctaHtml(level) {
            // Only surface a level's quiz once it's "ready" (fully authored).
            // Task 9 raises the other levels above this threshold; until then
            // only the complete Level 300 pilot appears on the live Library.
            const READY_MIN = 5;
            const l = levelData(level);
            if (!l || !l.questions || l.questions.length < READY_MIN) return '';
            const n = l.questions.length;
            const best = getBest(level);
            const bestHtml = best ? `<span class="quiz-cta-best">Best ${best.pct}%</span>` : '';
            return `
                <button class="quiz-cta" data-reveal="up" onclick="openQuiz(${Number(level)})" aria-label="Take the Level ${Number(level)} quiz">
                    <span class="quiz-cta-ico" aria-hidden="true">?</span>
                    <span class="quiz-cta-body">
                        <span class="quiz-cta-title">Test yourself on Level ${Number(level)}</span>
                        <span class="quiz-cta-sub">${n} scenario-based question${n === 1 ? '' : 's'} — see how much stuck.</span>
                    </span>
                    ${bestHtml}
                    <span class="quiz-cta-go" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
                </button>`;
        }
    };
})();

// Global entry point — renders the quiz into the main content area.
function openQuiz(level) {
    const content = document.getElementById('content');
    if (!content) return;
    if (typeof closeDetailPanel === 'function') closeDetailPanel();
    window.scrollTo({ top: 0, behavior: 'auto' });
    window.__currentArticle = null;
    window.__currentHistory = null;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const libNav = document.querySelector('.nav-item[data-page="library"]');
    if (libNav) libNav.classList.add('active');
    if (typeof updateNavArrows === 'function') updateNavArrows();
    content.innerHTML = '<div class="page"><div id="quiz-root"></div></div>';
    Quiz.start('quiz-root', level);
}
