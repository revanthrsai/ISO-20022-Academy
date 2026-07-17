// =============================================================================
// LIFE OF A PAYMENT — a scroll-driven, cinematic walk of one payment
// -----------------------------------------------------------------------------
// Bob's ₹33,000 crosses from Dubai to Bangalore. A sticky stage (the arc, a
// travelling comet, two live ledgers, and the pain→pacs→camt rail) is driven by
// scroll across six scenes. Everything is deterministic on scroll position, so
// there are no fragile timers; reduced-motion just lands on the final frame.
//
// Self-contained: one global `PaymentJourney` + injected styles. Public: init().
// =============================================================================

const PaymentJourney = (function () {
    let mountId = 'journey-root';
    let onScroll = null;
    let raf = 0;

    // Bob starts with ₹1,00,000; the ₹33,000 moves to Sweety at settlement (scene 3).
    const START = 100000, AMT = 33000;
    const fmt = function (n) { return '₹' + n.toLocaleString('en-IN'); };

    // scene → { code, family, title, text, marker(0..1), settled }
    const SCENES = [
        { code: 'pain.001', family: 'pain', title: 'Bob taps send', marker: 0.0, settled: false,
          text: 'In his app, Bob instructs <b>his own bank</b>: pay ₹33,000 to Sweety, reference <code>BOB-INV0042</code>. The only message a customer ever touches. <b>No money has moved.</b>' },
        { code: 'pain.002', family: 'pain', title: 'His bank says yes', marker: 0.06, settled: false,
          text: 'His bank validates it — funds present, details well-formed — and replies <b>accepted</b>. Bob sees a tick. Still, not a rupee has moved. The tick is agreement, not settlement.' },
        { code: 'pacs.008', family: 'pacs', title: 'On the wire', marker: 0.44, settled: false,
          text: 'His bank becomes the debtor agent, turns the instruction into an <b>interbank</b> credit transfer, stamps it with a <code>UETR</code>, and sends it toward Bangalore. <i>pain ends, pacs begins.</i>' },
        { code: 'pacs.002', family: 'pacs', title: 'Settled', marker: 0.78, settled: true,
          text: 'Sweety’s bank applies the funds and confirms: <b>settled</b>. Now the money has <i>genuinely</i> moved — Bob’s bank down, Sweety’s bank up, across the settlement system. This is the irreversible instant.' },
        { code: 'camt.054', family: 'camt', title: 'She’s told', marker: 1.0, settled: true,
          text: 'A credit notification fires: <b>₹33,000 arrived</b>, reference <code>BOB-INV0042</code>. Her accounting system matches Invoice 0042 on the spot — the reference she never sees survived every hop.' },
        { code: 'camt.053', family: 'camt', title: 'Booked, and closed', marker: 1.0, settled: true,
          text: 'At end of day, the authoritative statement records the credit. Reconciliation — the final stage — is complete. Six messages, four institutions, <b>one payment</b>.' }
    ];

    function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function render() {
        const el = document.getElementById(mountId);
        if (!el) return;
        const scenes = SCENES.map(function (s, i) {
            return '<section class="jn-scene" data-scene="' + i + '" data-fam="' + s.family + '">'
                + '<div class="jn-scene-inner">'
                + '<div class="jn-scene-step">' + (i + 1) + ' / ' + SCENES.length + '</div>'
                + '<div class="jn-scene-code jn-' + s.family + '">' + esc(s.code) + '</div>'
                + '<h3 class="jn-scene-title">' + esc(s.title) + '</h3>'
                + '<p class="jn-scene-text">' + s.text + '</p>'
                + '</div></section>';
        }).join('');

        el.innerHTML =
            '<div class="jn-head">'
            + '<button class="dict-back" onclick="navigate(\'history\')">&larr; Back</button>'
            + '<div class="eyebrow">The capstone, in motion</div>'
            + '<h2 class="section-title">Life of a Payment</h2>'
            + '<p class="section-description">Scroll, and follow one ordinary ₹33,000 from a tap in Dubai to a booked entry in Bangalore — every message, every ledger, one continuous motion.</p>'
            + '</div>'
            + '<div class="jn">'
            + '<div class="jn-stage-wrap"><div class="jn-stage">' + stageHtml() + '</div></div>'
            + '<div class="jn-scenes">' + scenes + '</div>'
            + '</div>'
            + '<div class="jn-foot"><a class="jn-cta" href="#/playground" onclick="navigate(\'playground\', event)">Now open the real pacs.008 in the Playground &rarr;</a></div>';

        // measure the arc, then start the scroll driver
        const path = document.getElementById('jn-arc');
        const len = path ? path.getTotalLength() : 0;
        wireScroll(len);
        apply(0, 0); // initial frame
    }

    function stageHtml() {
        return ''
            + '<svg class="jn-map" viewBox="0 0 600 260" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'
            + '<defs><radialGradient id="jn-glow" cx="50%" cy="50%" r="50%">'
            + '<stop class="jn-stop-a" offset="0%"/><stop class="jn-stop-b" offset="100%"/></radialGradient></defs>'
            + '<path id="jn-arc" class="jn-arc-base" d="M110,158 Q300,8 490,104" fill="none" stroke-dasharray="3 6"/>'
            + '<path id="jn-arc-lit" d="M110,158 Q300,8 490,104" fill="none"/>'
            + '<g class="jn-node" transform="translate(110,158)"><circle class="jn-glow-c" r="18"/><circle class="jn-dot" r="6"/><text x="0" y="34" text-anchor="middle" class="jn-city">Dubai</text></g>'
            + '<g class="jn-node" transform="translate(490,104)"><circle class="jn-glow-c jn-glow-dest" r="18" id="jn-dest-glow"/><circle class="jn-dot jn-dot-dest" r="6" id="jn-dest-dot"/><text x="0" y="34" text-anchor="middle" class="jn-city">Bangalore</text></g>'
            + '<g id="jn-comet"><circle class="jn-glow-c" r="9"/><circle class="jn-comet-core" r="4.5"/></g>'
            + '</svg>'
            + '<div class="jn-rail">'
            + '<span class="jn-rail-seg jn-rail-pain" data-fam="pain">pain</span>'
            + '<span class="jn-rail-arrow">&rarr;</span>'
            + '<span class="jn-rail-seg jn-rail-pacs" data-fam="pacs">pacs</span>'
            + '<span class="jn-rail-arrow">&rarr;</span>'
            + '<span class="jn-rail-seg jn-rail-camt" data-fam="camt">camt</span>'
            + '</div>'
            + '<div class="jn-ledgers">'
            + '<div class="jn-ledger" id="jn-led-bob"><div class="jn-ledger-who">Bob · Dubai</div><div class="jn-ledger-bal" id="jn-bal-bob">' + fmt(START) + '</div></div>'
            + '<div class="jn-ledger" id="jn-led-sweety"><div class="jn-ledger-who">Sweety · Bangalore</div><div class="jn-ledger-bal" id="jn-bal-sweety">' + fmt(0) + '</div></div>'
            + '</div>'
            + '<div class="jn-caption" id="jn-caption"></div>';
    }

    function wireScroll(len) {
        const scenesWrap = document.querySelector('.jn-scenes');
        const litPath = document.getElementById('jn-arc-lit');
        if (litPath && len) { litPath.style.strokeDasharray = len; litPath.style.strokeDashoffset = len; }

        onScroll = function () {
            if (raf) return;
            raf = requestAnimationFrame(function () {
                raf = 0;
                const scenes = document.querySelectorAll('.jn-scene');
                if (!scenes.length) return;
                const vh = window.innerHeight || 800;
                const line = vh * 0.5;
                // active scene = last whose top has passed the line
                let active = 0;
                for (let i = 0; i < scenes.length; i++) {
                    if (scenes[i].getBoundingClientRect().top <= line) active = i;
                }
                // continuous progress across the whole scenes block
                const first = scenes[0].getBoundingClientRect();
                const last = scenes[scenes.length - 1].getBoundingClientRect();
                const span = (last.top - first.top) || 1;
                let p = (line - first.top) / span;
                p = p < 0 ? 0 : (p > 1 ? 1 : p);
                apply(active, p, len);
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
    }

    let lastActive = -1;
    function apply(active, p, len) {
        // marker position along the arc
        const path = document.getElementById('jn-arc');
        const comet = document.getElementById('jn-comet');
        const lit = document.getElementById('jn-arc-lit');
        if (path && comet && (len || path.getTotalLength)) {
            const L = len || path.getTotalLength();
            const pt = path.getPointAtLength(p * L);
            comet.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')');
            if (lit) lit.style.strokeDashoffset = (1 - p) * L;
        }
        const destGlow = document.getElementById('jn-dest-glow');
        const destDot = document.getElementById('jn-dest-dot');
        if (destGlow) destGlow.style.opacity = p > 0.98 ? '0.9' : (0.35 + p * 0.4).toFixed(2);
        if (destDot) destDot.classList.toggle('is-lit', p > 0.7);

        if (active === lastActive) return;
        lastActive = active;
        const s = SCENES[active] || SCENES[0];

        // scenes highlight
        document.querySelectorAll('.jn-scene').forEach(function (el, i) {
            el.classList.toggle('is-active', i === active);
        });
        // rail highlight
        document.querySelectorAll('.jn-rail-seg').forEach(function (seg) {
            const fam = seg.getAttribute('data-fam');
            const order = { pain: 0, pacs: 1, camt: 2 };
            seg.classList.toggle('is-on', order[fam] <= order[s.family]);
            seg.classList.toggle('is-now', fam === s.family);
        });
        // ledgers
        const bob = document.getElementById('jn-bal-bob');
        const sweety = document.getElementById('jn-bal-sweety');
        const ledBob = document.getElementById('jn-led-bob');
        const ledSw = document.getElementById('jn-led-sweety');
        if (bob && sweety) {
            bob.textContent = fmt(s.settled ? START - AMT : START);
            sweety.textContent = fmt(s.settled ? AMT : 0);
        }
        if (ledBob) ledBob.classList.toggle('is-flip', s.settled);
        if (ledSw) ledSw.classList.toggle('is-flip', s.settled);
        // caption
        const cap = document.getElementById('jn-caption');
        if (cap) cap.innerHTML = '<span class="jn-cap-code jn-' + s.family + '">' + esc(s.code) + '</span> ' + esc(s.title);
    }

    function injectStyles() {
        if (typeof document === 'undefined' || !document.head || document.getElementById('jn-styles')) return;
        const css = ''
            + '.jn-head{max-width:760px;margin:0 auto 26px;text-align:center}'
            + '.jn-head .dict-back{display:inline-flex;margin-bottom:16px}'
            + '.jn{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:36px;align-items:start}'
            + '.jn-stage-wrap{position:sticky;top:96px}'
            + '.jn-stage{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg,18px);padding:22px 22px 18px;box-shadow:var(--shadow-sm)}'
            + '.jn-map{width:100%;height:auto;display:block}'
            + '.jn-map .jn-stop-a{stop-color:var(--primary-bright,#10B981);stop-opacity:.9}'
            + '.jn-map .jn-stop-b{stop-color:var(--primary,#0E9F70);stop-opacity:0}'
            + '.jn-map .jn-glow-c{fill:url(#jn-glow)}'
            + '.jn-map .jn-glow-dest{opacity:.35}'
            + '.jn-map .jn-arc-base{stroke:var(--border-hi,#D8D3C4);stroke-width:2}'
            + '.jn-map #jn-arc-lit{stroke:var(--primary,#0E9F70);stroke-width:2.5}'
            + '.jn-map .jn-dot{fill:var(--primary,#0E9F70)}'
            + '.jn-map .jn-dot-dest{fill:var(--border-hi,#D8D3C4);transition:fill .4s var(--ease-out,ease)}'
            + '.jn-map .jn-dot-dest.is-lit{fill:var(--primary,#0E9F70)}'
            + '.jn-map .jn-comet-core{fill:#fff;stroke:var(--primary,#0E9F70);stroke-width:2}'
            + '.jn-city{fill:var(--text-muted);font-family:var(--font-mono,monospace);font-size:13px;letter-spacing:.03em}'
            + '#jn-comet{transition:transform .5s var(--ease-out,cubic-bezier(.2,.7,.3,1))}'
            + '.jn-rail{display:flex;align-items:center;justify-content:center;gap:9px;margin:14px 0 4px}'
            + '.jn-rail-seg{font-family:var(--font-mono,monospace);font-size:12.5px;font-weight:700;color:var(--text-faint);background:var(--surface-alt);border:1px solid var(--border);border-radius:999px;padding:4px 14px;transition:all .3s var(--ease-out,ease)}'
            + '.jn-rail-seg.is-on{color:var(--primary-deep,var(--primary));border-color:var(--primary)}'
            + '.jn-rail-seg.is-now{background:var(--primary);color:#fff;border-color:var(--primary);transform:scale(1.06)}'
            + '.jn-rail-arrow{color:var(--text-faint)}'
            + '.jn-ledgers{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}'
            + '.jn-ledger{background:var(--bg-deep,var(--surface-alt));border:1px solid var(--border);border-radius:var(--radius-md,14px);padding:13px 15px;transition:border-color .3s,background .3s}'
            + '.jn-ledger.is-flip{border-color:var(--primary);background:var(--glass-tint,rgba(16,185,129,.06))}'
            + '.jn-ledger-who{font-size:11.5px;color:var(--text-muted);margin-bottom:6px}'
            + '.jn-ledger-bal{font-family:var(--font-mono,monospace);font-weight:700;font-size:19px;color:var(--text);font-variant-numeric:tabular-nums}'
            + '.jn-ledger.is-flip .jn-ledger-bal{color:var(--primary-deep,var(--primary))}'
            + '.jn-caption{margin-top:14px;text-align:center;font-size:13px;color:var(--text-muted);min-height:20px}'
            + '.jn-cap-code{font-family:var(--font-mono,monospace);font-weight:700}'
            + '.jn-pain{color:var(--warning,#C98A2B)}.jn-pacs{color:var(--primary-deep,#0B7A54)}.jn-camt{color:var(--info,#2B6CB0)}'
            + '.jn-scenes{display:flex;flex-direction:column}'
            + '.jn-scene{min-height:78vh;display:flex;align-items:center}'
            + '.jn-scene:last-child{min-height:60vh}'
            + '.jn-scene-inner{opacity:.4;transform:translateY(8px);transition:opacity .4s var(--ease-out,ease),transform .4s var(--ease-out,ease);border-left:3px solid var(--border);padding-left:22px}'
            + '.jn-scene.is-active .jn-scene-inner{opacity:1;transform:none;border-left-color:var(--primary)}'
            + '.jn-scene-step{font-family:var(--font-mono,monospace);font-size:11px;letter-spacing:.06em;color:var(--text-faint);margin-bottom:10px}'
            + '.jn-scene-code{font-family:var(--font-mono,monospace);font-weight:700;font-size:20px;margin-bottom:8px}'
            + '.jn-scene-title{margin:0 0 10px;font-size:22px;color:var(--text)}'
            + '.jn-scene-text{margin:0;font-size:16px;line-height:1.7;color:var(--text-muted);max-width:46ch}'
            + '.jn-scene-text code{font-family:var(--font-mono,monospace);color:var(--primary-deep,var(--primary));font-size:.9em}'
            + '.jn-scene-text b{color:var(--text);font-weight:600}'
            + '.jn-foot{text-align:center;margin:30px 0 10px}'
            + '.jn-cta{display:inline-block;font-family:var(--font-display,var(--font-sans));font-weight:700;font-size:15px;color:#fff;background:var(--primary);border-radius:999px;padding:12px 24px;text-decoration:none;transition:background .15s}'
            + '.jn-cta:hover{background:var(--primary-hover,var(--primary-deep))}'
            + '@media (max-width:860px){.jn{grid-template-columns:1fr;gap:0}.jn-stage-wrap{position:sticky;top:64px;z-index:5;margin-bottom:10px}.jn-scene{min-height:66vh}.jn-scene-text{font-size:15px}}'
            + '@media (prefers-reduced-motion:reduce){#jn-comet{transition:none}.jn-scene-inner{opacity:1;transform:none}}';
        const st = document.createElement('style');
        st.id = 'jn-styles';
        st.textContent = css;
        document.head.appendChild(st);
    }

    function init(id) {
        mountId = id || 'journey-root';
        injectStyles();
        render();
    }

    function teardown() {
        if (onScroll) {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            onScroll = null;
        }
        lastActive = -1;
    }

    return { init: init, teardown: teardown };
})();
window.PaymentJourney = PaymentJourney;
