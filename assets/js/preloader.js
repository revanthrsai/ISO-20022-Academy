// Preloader Module - one-time intro animation (currency cycle -> eyelid reveal)
// Runs once per browser session; skips instantly on repeat visits within the
// same session and for users who prefer reduced motion.

(function () {
    var preloader = document.getElementById('preloader');
    if (!preloader) return;

    var alreadyPlayed = sessionStorage.getItem('iso-intro-played') === '1';
    var reducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function finish() {
        preloader.classList.add('is-done');
        document.body.classList.remove('preloader-active');
        document.body.classList.add('kinetic-ready');
        document.dispatchEvent(new CustomEvent('iso:intro-done'));
        sessionStorage.setItem('iso-intro-played', '1');
    }

    if (alreadyPlayed || reducedMotion) {
        finish();
        return;
    }

    document.body.classList.add('preloader-active');

    var symbols = preloader.querySelectorAll('.currency-symbol');
    var eyelidTop = preloader.querySelector('.eyelid-top');
    var finished = false;

    function finishOnce() {
        if (finished) return;
        finished = true;
        finish();
    }

    // Cycle through the currency symbols one at a time -- each one pops
    // forward out of the screen into focus, then recedes as the next
    // takes its place. Starts with the rupee.
    var slot = 320;
    var startDelay = 120;
    symbols.forEach(function (el, i) {
        var onAt = startDelay + i * slot;
        var offAt = onAt + slot - 40;
        setTimeout(function () { el.classList.add('is-active'); }, onAt);
        setTimeout(function () { el.classList.remove('is-active'); }, offAt);
    });

    var cycleEnd = startDelay + symbols.length * slot;

    // Once the cycle finishes, fade the currency stack out, then peel
    // the eyelids open.
    setTimeout(function () {
        preloader.classList.add('is-exiting');
    }, cycleEnd);

    setTimeout(function () {
        preloader.classList.add('is-opening');
    }, cycleEnd + 150);

    if (eyelidTop) {
        eyelidTop.addEventListener('transitionend', function onEnd(e) {
            if (e.propertyName === 'transform') {
                eyelidTop.removeEventListener('transitionend', onEnd);
                finishOnce();
            }
        });
    }

    // Safety net in case a transitionend event never fires.
    setTimeout(finishOnce, cycleEnd + 1100);
})();
