// jsdom does not execute <script defer> when parsing, so instead of trusting it
// we REPRODUCE defer semantics exactly: parse the document first, then execute
// every script in document order with readyState='interactive', then fire
// DOMContentLoaded. That is precisely what a browser does with defer — and it
// is the only thing defer changes about this site's boot.
const { JSDOM } = require('/tmp/node_modules/jsdom');
const fs = require('fs'), path = require('path');
const ROOT = '/sessions/lucid-elegant-mendel/mnt/ISO-20022-Academy';
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
  const d=w.document, t=(l,ok)=>console.log((ok?' ok  ':'FAIL ')+l);
  t(`every <script src> carries defer (${order.length} tags)`, deferred);
  t(`all ${ran} local scripts executed in document order`, ran === order.length-1);
  t('skip link is the first body element', d.body.firstElementChild.classList.contains('skip-link'));
  t('skip link targets #content', d.querySelector('.skip-link').getAttribute('href')==='#content');
  t('main is a focus target', d.getElementById('content').getAttribute('tabindex')==='-1');
  t('app boots with readyState=interactive', typeof w.navigate==='function');
  t('landed on Library', !!d.getElementById('learn-root'));
  t('hero H1 rendered', !!d.querySelector('.learn-head-copy h1'));
  t('two CTAs rendered', d.querySelectorAll('.learn-hero-cta').length===2);
  t('proof shows 4 workshops', /4 workshops/.test((d.querySelector('.learn-hero-proof')||{}).textContent||''));
  t('spine mounted, 44 lessons', d.body.classList.contains('has-spine') && d.querySelectorAll('.spine-item').length===44);
  t('workshop 4 wired', w.WORKSHOPS.LIST.length===4 && !!w.WORKSHOPS.DEFS['address-deadline']);
  w.navigate('workshop'); t('nav to Workshop works', !!d.getElementById('ws-root'));
  w.navigate('library');  t('nav back to Library works', !!d.getElementById('learn-root'));
  t('no runtime errors', errs.length===0);
  if (errs.length) console.log('  ', errs.slice(0,4));
  process.exit(0);
},400);
