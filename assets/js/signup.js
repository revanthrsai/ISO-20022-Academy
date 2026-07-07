// =============================================================================
// signup.js  —  Email capture (Track 2 / task 13)
// -----------------------------------------------------------------------------
// A no-backend "notify me when new lessons drop" form, wired to Formspree.
// Self-contained: injected styles (theme-aware) + a submit handler bound to the
// footer form present in index.html. Validates the address, POSTs JSON to
// Formspree, and shows inline success / error states.
//
//   >>> TO ACTIVATE: create a free form at https://formspree.io and paste its
//       form ID below (the bit after /f/ in your endpoint). One line. <<<
// =============================================================================

const FORMSPREE_ID = 'xkolankb'; // active — https://formspree.io/f/xkolankb

const Signup = (function () {
    function endpoint() {
        return FORMSPREE_ID ? ('https://formspree.io/f/' + FORMSPREE_ID) : '';
    }
    function validEmail(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
    }

    function setState(form, kind, msg) {
        const note = form.querySelector('.su-note');
        if (note) {
            note.textContent = msg || '';
            note.className = 'su-note' + (kind ? ' su-' + kind : '');
        }
        form.classList.toggle('is-busy', kind === 'busy');
    }

    async function onSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.querySelector('.su-input');
        const email = input ? input.value.trim() : '';
        if (!validEmail(email)) { setState(form, 'err', 'That email doesn’t look right — mind checking it?'); if (input) input.focus(); return; }

        const url = endpoint();
        if (!url) {
            // Not configured yet — fail honestly rather than pretend to capture.
            setState(form, 'err', 'Signups aren’t switched on yet — check back shortly.');
            console.warn('[signup] Set FORMSPREE_ID in assets/js/signup.js to enable email capture.');
            return;
        }

        setState(form, 'busy', 'Adding you…');
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, _subject: 'New ISO 20022 Academy subscriber' })
            });
            if (res.ok) {
                form.innerHTML = '<div class="su-done"><span class="su-check" aria-hidden="true">✓</span> You’re on the list. New lessons and tools, now and then — no spam.</div>';
            } else {
                const data = await res.json().catch(() => ({}));
                const m = (data && data.errors && data.errors[0] && data.errors[0].message) || 'Something went wrong. Please try again.';
                setState(form, 'err', m);
            }
        } catch (err) {
            setState(form, 'err', 'Network hiccup — please try again.');
        }
    }

    function init() {
        injectStyles();
        const form = document.getElementById('signup-form');
        if (!form || form.__bound) return;
        form.__bound = true;
        form.addEventListener('submit', onSubmit);
    }

    function injectStyles() {
        if (typeof document === 'undefined' || !document.head) return;
        if (document.getElementById('signup-styles')) return;
        const css = `
        .site-footer-signup{max-width:360px}
        .su-label{font-size:var(--fs-eyebrow,12px);text-transform:uppercase;letter-spacing:.08em;color:var(--primary);font-weight:var(--fw-semibold,600);margin-bottom:8px}
        .su-title{font-size:var(--fs-h4,19px);font-weight:var(--fw-semibold,600);color:var(--text);margin:0 0 6px;line-height:var(--lh-snug,1.3)}
        .su-sub{font-size:var(--fs-small,14px);color:var(--text-muted);margin:0 0 14px;line-height:var(--lh-normal,1.5)}
        .su-row{display:flex;gap:8px}
        .su-input{flex:1;min-width:0;background:var(--surface,#fff);border:1.5px solid var(--border);border-radius:var(--radius-md,12px);padding:11px 14px;font:inherit;font-size:var(--fs-body,15px);color:var(--text)}
        .su-input:focus{outline:none;border-color:var(--primary)}
        .su-btn{flex:none;background:var(--primary);color:#fff;border:none;border-radius:var(--radius-md,12px);padding:11px 18px;font:inherit;font-weight:var(--fw-semibold,600);font-size:var(--fs-body,15px);cursor:pointer;transition:background var(--dur-fast,.15s),transform var(--dur-fast,.15s)}
        .su-btn:hover{background:var(--primary-hover,var(--primary-deep,var(--primary)))}
        .su-btn:active{transform:scale(var(--press-scale,.98))}
        .is-busy .su-btn{opacity:.6;pointer-events:none}
        .su-note{margin:10px 0 0;font-size:var(--fs-small,13px);min-height:1em}
        .su-note.su-err{color:var(--danger,#C13543)}
        .su-note.su-busy{color:var(--text-muted)}
        .su-done{font-size:var(--fs-body,15px);color:var(--text);line-height:var(--lh-relaxed,1.6)}
        .su-check{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--success,#0B8A60);color:#fff;font-weight:700;font-size:13px;margin-right:6px;vertical-align:-4px}
        @media (max-width:640px){.site-footer-signup{max-width:none}}
        @media (max-width:400px){.su-row{flex-direction:column}.su-btn{width:100%}}
        `;
        const style = document.createElement('style');
        style.id = 'signup-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    return { init, injectStyles };
})();

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', Signup.init);
    else Signup.init();
}
