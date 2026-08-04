// Preloader Module — retired (2026-08 cleanup).
// The intro animation (currency cycle -> eyelid reveal) delayed first content
// with no lasting benefit, so it was removed. This stub survives only to fire
// the signals downstream code still gates on: the `kinetic-ready` body class
// (CSS entrance animations) and the `iso:intro-done` event (app.js, motion.js).

(function () {
    document.body.classList.remove('preloader-active');
    document.body.classList.add('kinetic-ready');
    document.dispatchEvent(new CustomEvent('iso:intro-done'));
    sessionStorage.setItem('iso-intro-played', '1');
})();
