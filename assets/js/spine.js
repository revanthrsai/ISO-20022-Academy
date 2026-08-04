// ===========================================================================
// spine.js  —  The curriculum spine (persistent left rail)
// ===========================================================================
//
// WHAT THIS IS
//   The audit's Information Architecture finding: "There is no persistent
//   curriculum map, so 44 lessons don't feel like a path." The Library index
//   already listed everything, but only while you were standing on it — the
//   moment you opened a lesson the map vanished and you were in a document
//   with no sense of where it sat or what came next.
//
//   This rail is that map, kept on screen the whole time you're reading: six
//   levels, every published lesson, where you are now, and what you've already
//   finished.
//
// WHAT IT DOESN'T DO
//   It invents no data and no storage. Levels come from ACADEMY_LEVELS
//   (toc.js), lessons from ACADEMY_TOC (toc.data.js, generated from
//   frontmatter), completion from the existing Progress store (data.js). A
//   lesson added to /content appears here on the next build with no edit.
//
// WHERE IT SHOWS
//   The Library index and the article reading view — the two places you are
//   actually walking the path. Deliberately NOT on History (a cinematic scroll
//   that owns the full width), the Playground or the Workshop (dense tools that
//   need their canvas). The empty <aside class="sidebar"> in index.html was
//   reserved for exactly this.
//
// The rail is ordinary <a> links whose hrefs are the same #/library/<id> hash
// routes the router resolves, so middle-click / copy-link behave; clicks are
// intercepted for an instant in-app render.
// ---------------------------------------------------------------------------

const Spine = (function () {
    'use strict';

    const MOUNT = 'spine-root';
    let activeId = null;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function learned(id) {
        return (typeof Progress !== 'undefined') && Progress.isLearned(id);
    }

    // Published lessons only, grouped by level, each group in reading order.
    function shelves() {
        if (typeof ACADEMY_TOC === 'undefined' || typeof ACADEMY_LEVELS === 'undefined') return [];
        const published = ACADEMY_TOC.filter(a => a.status === 'published');
        return Object.keys(ACADEMY_LEVELS)
            .map(Number)
            .sort((a, b) => a - b)
            .map(lvl => ({
                level: lvl,
                meta: ACADEMY_LEVELS[lvl],
                items: published.filter(a => a.level === lvl).sort((a, b) => a.num - b.num)
            }))
            .filter(s => s.items.length);
    }

    function levelHtml(shelf) {
        const done = shelf.items.filter(a => learned(a.id)).length;
        const total = shelf.items.length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        const hasActive = shelf.items.some(a => a.id === activeId);
        // A shelf opens when you're inside it. Everything else stays folded so
        // six levels fit one screen.
        const open = hasActive ? ' open' : '';

        const items = shelf.items.map(a => {
            const isDone = learned(a.id);
            const isHere = a.id === activeId;
            return `<li class="spine-item${isHere ? ' is-here' : ''}${isDone ? ' is-done' : ''}">
                <a href="#/library/${esc(a.id)}" onclick="Spine.go('${esc(a.id)}', event)"${isHere ? ' aria-current="page"' : ''}>
                    <span class="spine-mark" aria-hidden="true"></span>
                    <span class="spine-item-title">${esc(a.title.split(':')[0])}</span>
                    <span class="spine-item-min">${esc(a.minutes)}m</span>
                </a>
            </li>`;
        }).join('');

        return `<details class="spine-level"${open}>
            <summary class="spine-level-head">
                <span class="spine-level-tag">${esc(shelf.level)}</span>
                <span class="spine-level-name">${esc(shelf.meta.name)}</span>
                <span class="spine-level-count">${done}/${total}</span>
            </summary>
            <div class="spine-level-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
            <ul class="spine-list">${items}</ul>
        </details>`;
    }

    function render() {
        const root = document.getElementById(MOUNT);
        if (!root) return;
        const list = shelves();
        if (!list.length) { root.innerHTML = ''; return; }

        const all = list.reduce((n, s) => n + s.items.length, 0);
        const done = list.reduce((n, s) => n + s.items.filter(a => learned(a.id)).length, 0);
        const pct = all ? Math.round((done / all) * 100) : 0;

        root.innerHTML = `
            <nav class="spine" aria-label="Curriculum">
                <a class="spine-top" href="#/library" onclick="navigate('library', event)">
                    <span class="spine-eyebrow">The path</span>
                    <span class="spine-total">${done} <span>of ${all} lessons</span></span>
                </a>
                <div class="spine-bar" role="img" aria-label="${pct}% of the curriculum complete">
                    <i style="width:${pct}%"></i>
                </div>
                <div class="spine-levels">${list.map(levelHtml).join('')}</div>
                <a class="spine-ref" href="#/glossary" onclick="navigate('glossary', event)">
                    Reference &amp; glossary
                </a>
            </nav>`;
    }

    return {
        // Show the rail, optionally with one lesson marked as "you are here".
        mount(id) {
            activeId = id || null;
            document.body.classList.add('has-spine');
            render();
        },
        // Leave the reading surfaces — the rail collapses and the content area
        // reclaims the full width via the .has-spine flag on <body>.
        unmount() {
            activeId = null;
            document.body.classList.remove('has-spine');
            const root = document.getElementById(MOUNT);
            if (root) root.innerHTML = '';
        },
        // Re-read the Progress store (a lesson was just marked learned).
        refresh() {
            if (document.body.classList.contains('has-spine')) render();
        },
        go(id, evt) {
            if (evt) evt.preventDefault();
            if (typeof openArticle === 'function') openArticle(id);
        }
    };
})();

// A top-level `const` lands in the global lexical scope, not on window — so
// without this line every `if (window.Spine)` guard in app.js and markdown.js
// reads undefined and the rail silently never mounts. Same convention as
// Workshop, AcademyDictionary, PaymentJourney and XmlViewer.
window.Spine = Spine;
