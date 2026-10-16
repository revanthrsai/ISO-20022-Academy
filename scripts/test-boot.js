#!/usr/bin/env node
// ===========================================================================
// scripts/test-boot.js — boot + shell regression suite.
//
// jsdom does not execute <script defer> when parsing, so instead of trusting
// it we REPRODUCE defer semantics exactly: parse the document first, then run
// every script in document order with readyState='interactive', then fire
// DOMContentLoaded. That is precisely what a browser does with defer — and it
// is the only thing defer changes about this site's boot.
//
// Needs jsdom, which the deploy deliberately does not (the site stays
// zero-dependency). Run it by hand from anywhere in the repo:
//
//     npm i jsdom && node scripts/test-boot.js
//
// Exits non-zero on any failure.
// ===========================================================================
'use strict';

const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');   // repo root, wherever it is checked out

let JSDOM;
try {
    ({ JSDOM } = require('jsdom'));
} catch (e) {
    console.error('\n  test-boot needs jsdom. Install it first:\n\n      npm i jsdom\n');
    process.exit(2);
}

const html = fs.readFileSync(path.join(ROOT,'index.html'),'utf8');

const order = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
const deferred = [...html.matchAll(/<script([^>]*)\bsrc="([^"]+)"/g)].every(m => /\bdefer\b/.test(m[1]));

const dom = new JSDOM(html.replace(/<script[^>]*src="[^"]*"[^>]*>\s*<\/script>/g,''), {
  url:'https://iso20022academy.in/', runScripts:'dangerously', pretendToBeVisual:true
});
const w = dom.window;
w.matchMedia = q=>({matches:false,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
w.scrollTo=()=>{}; w.fetch=()=>Promise.reject(new Error('offline'));
w.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
w.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
const errs=[]; w.addEventListener('error', e=>errs.push(e.message));

// readyState is 'interactive' while deferred scripts run — the guards in
// motion.js / search.js / signup.js branch on exactly this.
Object.defineProperty(w.document,'readyState',{value:'interactive',configurable:true});
let ran = 0;
for (const rel of order) {
  if (!rel.startsWith('assets/js/')) continue;   // CDN marked.js stubbed below
  const el = w.document.createElement('script');
  el.textContent = fs.readFileSync(path.join(ROOT, rel),'utf8');
  w.document.body.appendChild(el); ran++;
}
w.document.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));

setTimeout(()=>{
  const d = w.document;
  let pass = 0, fail = 0;
  const t = (label, ok) => { ok ? pass++ : fail++; console.log((ok ? '  ok  ' : ' FAIL ') + label); };

  // Counts come from the data files, never typed in here — otherwise this
  // suite starts failing the day a lesson or workshop is added.
  // NB: a top-level `const` in a classic script lands in the global LEXICAL
  // scope, not on window (the same trap spine.js documents), so these are read
  // with w.eval rather than w.<name>.
  const g = expr => w.eval(expr);
  const lessons   = g('ACADEMY_TOC').filter(a => a.status === 'published').length;
  const workshops = g('WORKSHOPS').LIST.length;
  const terms     = g('DATA').glossary.length;

  console.log('\n── shell ────────────────────────────────────────────────');
  t(`every <script src> carries defer (${order.length} tags)`, deferred);
  t(`all ${ran} local scripts executed in document order`, ran === order.length - 1);
  t('skip link is the first body element', d.body.firstElementChild.classList.contains('skip-link'));
  t('skip link targets #content', d.querySelector('.skip-link').getAttribute('href') === '#content');
  t('main is a focus target', d.getElementById('content').getAttribute('tabindex') === '-1');
  t('no preloader markup left behind', !d.getElementById('preloader'));

  console.log('\n── boot ─────────────────────────────────────────────────');
  t('app boots with readyState=interactive', typeof w.navigate === 'function');
  t('shareable routes enabled (CLEAN_URLS off)', w.CLEAN_URLS === false);
  t('lands on the Library, not History', !!d.getElementById('learn-root'));

  console.log('\n── hero ─────────────────────────────────────────────────');
  t('H1 rendered', !!d.querySelector('.learn-head-copy h1'));
  t('two CTAs rendered', d.querySelectorAll('.learn-hero-cta').length === 2);
  const proof = (d.querySelector('.learn-hero-proof') || {}).textContent || '';
  t(`proof strip matches data (${lessons} lessons)`,   proof.includes(lessons + ' lessons'));
  t(`proof strip matches data (${workshops} workshops)`, proof.includes(workshops + ' workshops'));
  t(`proof strip matches data (${terms} terms)`,       proof.includes(terms + ' glossary terms'));

  console.log('\n── spine + navigation ───────────────────────────────────');
  t(`outline lists all ${lessons} lessons`, d.querySelectorAll('.cs-lesson').length === lessons);
  t('outline sections start collapsed', [...d.querySelectorAll('.course-sec')].every(s => !s.open));
  t('chapters link to crawlable /library/ pages', d.querySelectorAll('a.cs-lesson-row[href^="/library/"]').length === lessons);
  t('no spine beside the outline', !d.body.classList.contains('has-spine'));
  w.navigate('workshop');
  t('nav to Workshop works', !!d.getElementById('ws-root'));
  t('no spine on the Workshop', !d.body.classList.contains('has-spine'));
  w.navigate('library');
  t('nav back to Library works', !!d.getElementById('learn-root'));
  t('outline re-renders', d.querySelectorAll('.course-sec').length > 0);

  console.log('\n── content wiring ───────────────────────────────────────');
  t('every workshop in LIST has a definition',
    g('WORKSHOPS').LIST.every(x => !!g('WORKSHOPS').DEFS[x.id]));

  console.log('\n── playground ───────────────────────────────────────────');
  w.navigate('playground');
  t('Playground opens the Live Translator', !!d.getElementById('tr-root') && !!d.getElementById('tr-src'));
  t('Playground has no mode switch', d.querySelectorAll('.pg-mode').length === 0);
  t('translations table lists both directions', d.querySelectorAll('.tr-sec').length === 2 && d.querySelectorAll('.tr-row').length >= 15);
  t('only direct equivalents: MT103 → pain.001 is refused', w.Translator.checkPair('MT103', 'pain.001').ok === false);
  t('pacs.008 → MT103 is a direct translation', w.Translator.checkPair('pacs.008', 'MT103').direct === true);
  w.navigate('reference');
  t('Reference tab opens the Glossary', !!d.getElementById('glossary-grid') && d.querySelector('.nav-item.active').dataset.page === 'reference');
  t('Reference modes: Glossary | Dictionary', [...d.querySelectorAll('.pg-mode-name')].map(x => x.textContent.trim()).join('|') === 'Glossary|Dictionary');
  w.navigate('dictionary');
  t('Dictionary lights the Reference tab', d.querySelector('.nav-item.active').dataset.page === 'reference');
  t('Dictionary has search and code sets, no message or element lists', !!d.getElementById('dict-search') && !d.querySelector('.dict-msg') && !d.querySelector('.dict-elements') && d.querySelectorAll('.dict-cset').length > 0);
  t('Translator toolbar: Source, auto Destination (MT103), one AI button, Copy', (w.navigate('playground'), !!d.getElementById('tr-source') && !!d.getElementById('tr-target') && !!d.getElementById('tr-go') && !d.getElementById('tr-repair') && !!d.getElementById('tr-copy') && d.getElementById('tr-target').textContent.indexOf('MT103') === 0));
  w.navigate('library');
  t('no runtime errors', errs.length === 0);
  if (errs.length) console.log('   ', errs.slice(0, 4));

  console.log(`\n${fail ? 'FAILED' : 'PASSED'} — ${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
}, 400);
