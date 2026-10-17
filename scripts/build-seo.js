#!/usr/bin/env node
// ===========================================================================
// scripts/build-seo.js — generates crawlable static pages for every published
// Library article, plus sitemap.xml and robots.txt.
//
// Clean URLs (2026-10): every view of the app has a real address. For each one
// this writes a copy of the app shell (index.html) into that route's folder,
// with the page's own <title>, description, canonical URL, Open Graph tags and
// JSON-LD, plus the page's content pre-written inside <main> for search engines
// and no-JS readers. When the app starts it renders the same view over it.
// GitHub Pages then serves /library/301-pacs-008/ as a real 200 page.
//
// Zero-dependency (same ethos as build-toc.js). Runs in the Pages workflow
// after build-toc.js:   node scripts/build-seo.js
// ===========================================================================

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const OUT_DIR = path.join(ROOT, 'library');
const SITE = 'https://iso20022academy.in';

// ---- Frontmatter (mirrors build-toc.js) -----------------------------------
function unquote(s) {
    if ((s.startsWith('"') && s.endsWith('"')) ||
        (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
    return s;
}
function parseYaml(block) {
    const meta = {};
    block.split('\n').forEach(line => {
        if (!line.trim() || /^\s*#/.test(line)) return;
        const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!m) return;
        let val = m[2].trim();
        if (val.startsWith('[') && val.endsWith(']')) {
            val = val.slice(1, -1).split(',').map(s => unquote(s.trim())).filter(Boolean);
        } else {
            val = unquote(val);
            if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
        }
        meta[m[1]] = val;
    });
    return meta;
}
function splitFrontmatter(raw) {
    const text = raw.replace(/^﻿/, '');
    if (!text.startsWith('---')) return null;
    const end = text.indexOf('\n---', 3);
    if (end === -1) return null;
    return { meta: parseYaml(text.slice(3, end).trim()), body: text.slice(end + 4) };
}

// ---- token → URL mapping (keeps the internal link graph intact) -----------
function mapHref(spec) {
    const parts = String(spec).split(':');
    const kind = parts[0], arg = parts[1];
    if (kind === 'article' && arg) return `/library/${arg}/`;
    if (kind === 'page' && arg) return `/${arg}/`;
    if (kind === 'explorer') return `/playground/`;
    if (kind === 'playground') return `/playground/`;
    return `/library/`;
}

// ---- Tiny markdown → HTML (good enough for crawlers, keeps links) ---------
function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function inline(s) {
    let t = esc(s);
    // {{link:spec|text}} → internal link
    t = t.replace(/\{\{link:([^|}]+)\|([^}]+)\}\}/g,
        (m, spec, text) => `<a href="${mapHref(spec.trim())}">${text.trim()}</a>`);
    // markdown links [text](url) → keep as real links
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        (m, text, url) => `<a href="${url.trim()}">${text}</a>`);
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    return t;
}
function mdToHtml(md) {
    const out = [];
    const lines = md.split('\n');
    let i = 0, para = [], ul = null, ol = null, code = false, codeBuf = [];
    const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
    const flushUl = () => { if (ul) { out.push(`<ul>${ul.map(li => `<li>${inline(li)}</li>`).join('')}</ul>`); ul = null; } };
    const flushOl = () => { if (ol) { out.push(`<ol>${ol.map(li => `<li>${inline(li)}</li>`).join('')}</ol>`); ol = null; } };
    const flushAll = () => { flushPara(); flushUl(); flushOl(); };
    const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());

    while (i < lines.length) {
        const line = lines[i];
        if (code) {
            if (/^```/.test(line)) { out.push(`<pre><code>${esc(codeBuf.join('\n'))}</code></pre>`); code = false; codeBuf = []; }
            else codeBuf.push(line);
            i++; continue;
        }
        if (/^```/.test(line)) { flushAll(); code = true; i++; continue; }

        // block {{embed:spec|Label}} → a "keep reading" internal link
        const emb = line.trim().match(/^\{\{embed:([^|}]+)(?:\|([^}]+))?\}\}$/);
        if (emb) { flushAll(); const label = (emb[2] || 'Open').trim(); out.push(`<p class="more"><a href="${mapHref(emb[1].trim())}">${inline(label)} &rarr;</a></p>`); i++; continue; }

        // flow diagrams are interactive-only → skip on the static page
        if (/^\{\{flow:/.test(line.trim())) { i++; continue; }

        // {{check:Q|correct|...}} → question + correct answer (useful, FAQ-ish)
        const chk = line.trim().match(/^\{\{check:([^|]+)\|([^|]+)\|/);
        if (chk) { flushAll(); out.push(`<p class="qa"><strong>${inline(chk[1].trim())}</strong> ${inline(chk[2].trim())}</p>`); i++; continue; }

        // GFM table
        if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:\-|]+\|\s*$/.test(lines[i + 1])) {
            flushAll();
            const header = cells(line); i += 2; const rows = [];
            while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
            out.push(`<table><thead><tr>${header.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
            continue;
        }

        const h = line.match(/^(#{2,4})\s+(.*)$/);
        if (h) { flushAll(); const lv = h[1].length; out.push(`<h${lv}>${inline(h[2])}</h${lv}>`); i++; continue; }

        if (/^>\s?/.test(line)) {
            flushAll();
            const quote = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, '')); i++; }
            out.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`);
            continue;
        }

        const oli = line.match(/^\s*\d+\.\s+(.*)$/);
        if (oli) { flushPara(); flushUl(); if (!ol) ol = []; ol.push(oli[1]); i++; continue; }
        const uli = line.match(/^\s*[-*]\s+(.*)$/);
        if (uli) { flushPara(); flushOl(); if (!ul) ul = []; ul.push(uli[1]); i++; continue; }

        if (/^(---|\*\*\*)\s*$/.test(line)) { flushAll(); out.push('<hr>'); i++; continue; }
        if (!line.trim()) { flushAll(); i++; continue; }
        para.push(line.trim()); i++;
    }
    flushAll();
    return out.join('\n');
}

// ---- The app shell, specialised per page -----------------------------------
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
function attr(s) { return esc(String(s || '')).replace(/\s+/g, ' ').trim(); }
function shell(o) {
    // o: { path:'/library/x/', title, desc, canonical?, ogType?, jsonld?, prerender, noindex? }
    const url = SITE + (o.canonical || o.path);
    let h = TEMPLATE;
    const swap = (re, val) => { if (!re.test(h)) throw new Error('build-seo: template is missing ' + re); h = h.replace(re, val); };
    swap(/<title>[\s\S]*?<\/title>/, `<title>${esc(o.title)}</title>`);
    swap(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(o.desc).slice(0, 300)}">`);
    swap(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">` + (o.noindex ? '\n    <meta name="robots" content="noindex">' : ''));
    swap(/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="${o.ogType || 'website'}">`);
    swap(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(o.ogTitle || o.title)}">`);
    swap(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(o.desc).slice(0, 300)}">`);
    swap(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
    if (o.jsonld) swap(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(o.jsonld)}</script>`);
    swap(/(<main class="content-area" id="content" tabindex="-1">)[\s\S]*?(<\/main>)/,
        `$1\n            <div class="prerender">${o.prerender || ''}</div>\n        $2`);
    return h;
}
function writeShell(rel, o, inSitemap) {
    const dir = path.join(ROOT, rel);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), shell({ ...o, path: '/' + rel + '/' }));
    if (inSitemap !== false) urls.push(`${SITE}/${rel}/`);
}

// ---- Page template ---------------------------------------------------------
function pageHtml(meta, bodyHtml, id, titleById, neighbors) {
    const url = `${SITE}/library/${id}/`;
    const title = `${meta.title} · ISO 20022 Academy`;
    const desc = String(meta.summary || '').slice(0, 300);
    const rel = (Array.isArray(meta.related) ? meta.related : [])
        .filter(rid => rid !== id && titleById[rid]);
    const relatedHtml = rel.length ? `<div class="related"><h2>Related lessons</h2><ul>${rel.map(rid => `<li><a href="/library/${rid}/">${esc(titleById[rid])}</a></li>`).join('')}</ul></div>` : '';
    // Prev / next walk the curriculum in reading order — for readers and for
    // crawlers (every page links its neighbours, so the whole library is
    // reachable from any entry point).
    const { prev, next } = neighbors || {};
    const pagerHtml = (prev || next) ? `<nav class="pager" aria-label="Lesson order">
      ${prev ? `<a class="pager-prev" href="/library/${prev.id}/" rel="prev"><span>&larr; Previous</span>${esc(titleById[prev.id].split(':')[0])}</a>` : '<span></span>'}
      ${next ? `<a class="pager-next" href="/library/${next.id}/" rel="next"><span>Next &rarr;</span>${esc(titleById[next.id].split(':')[0])}</a>` : ''}
    </nav>` : '';
    const jsonld = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: meta.title,
        description: desc,
        dateModified: meta.updated || undefined,
        author: { '@type': 'Person', name: 'Revanth Sai Rayapati', url: 'https://www.linkedin.com/in/revanth-sai-2002/' },
        publisher: { '@type': 'Organization', name: 'ISO 20022 Academy', url: SITE },
        mainEntityOfPage: url,
        isAccessibleForFree: true
    };
    return shell({
        path: `/library/${id}/`, title, desc, ogType: 'article', ogTitle: meta.title, jsonld,
        prerender: `<article class="prerender-article">
  <p class="prerender-kicker">${esc(String(meta.level))} · Library</p>
  <h1>${esc(meta.title)}</h1>
  ${meta.summary ? `<p class="prerender-standfirst">${esc(meta.summary)}</p>` : ''}
  <p class="prerender-meta">${meta.minutes ? meta.minutes + ' min read · ' : ''}free, no signup</p>
  ${bodyHtml}
  ${pagerHtml}
  ${relatedHtml}
</article>`
    });
}

// ---- Build -----------------------------------------------------------------
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

// Pass 1: collect published lessons + a title map (for related-link anchors).
const pages = [];
const titleById = {};
for (const file of fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md') && !f.startsWith('_')).sort()) {
    const id = file.replace(/\.md$/, '');
    const parsed = splitFrontmatter(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
    if (!parsed || !parsed.meta.title) continue;
    if (parsed.meta.status === 'draft') continue;
    pages.push({ id, meta: parsed.meta, body: parsed.body });
    titleById[id] = String(parsed.meta.title);
}

// Pass 2: render each page. Filename sort == numeric prefix == reading order,
// so each page's neighbours are simply the adjacent entries.
const urls = [`${SITE}/`];
pages.forEach((p, i) => {
    const dir = path.join(OUT_DIR, p.id);
    fs.mkdirSync(dir, { recursive: true });
    const neighbors = { prev: pages[i - 1] || null, next: pages[i + 1] || null };
    fs.writeFileSync(path.join(dir, 'index.html'), pageHtml(p.meta, mdToHtml(p.body), p.id, titleById, neighbors));
    // (each lesson folder now holds the full app, opened on that lesson)
    urls.push(`${SITE}/library/${p.id}/`);
});

// ---------------------------------------------------------------------------
// REFERENCE PAGES — dictionary elements, code sets/codes, the
// what's-changing hub, and glossary terms. Loaded from the browser data files
// via a vm shim so there is one source of truth. Each gets a real crawlable
// URL with meta/OG/JSON-LD, and joins the sitemap.
// ---------------------------------------------------------------------------
const vm = require('vm');
function loadGlobal(relFile, name) {
    try {
        const src = fs.readFileSync(path.join(ROOT, relFile), 'utf8');
        const noop = function () {};
        const stubEl = { style: {}, classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop, setAttribute: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [] };
        const sandbox = {
            window: {}, console,
            document: { createElement: () => stubEl, head: stubEl, body: stubEl, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop },
            localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
            navigator: { userAgent: '' }, location: { href: '', hash: '' }, setTimeout: noop, requestAnimationFrame: noop
        };
        const ctx = vm.createContext(sandbox);
        vm.runInContext(src, ctx, { timeout: 5000 });
        return vm.runInContext('typeof ' + name + ' !== "undefined" ? ' + name + ' : (window.' + name + ' || null)', ctx);
    } catch (e) { console.warn('build-seo: skip ' + relFile + ' (' + e.message + ')'); return null; }
}

const DICT = loadGlobal('assets/js/dictionary.data.js', 'DICTIONARY') || { FAMILIES: [], MESSAGES: {}, ELEMENTS: {}, SAMPLE_FOR: {} };
const CODES = loadGlobal('assets/js/codesets.data.js', 'CODESETS') || { SETS: [] };
const CHG = loadGlobal('assets/js/changes.data.js', 'CHANGES') || { MILESTONES: [], MAP: [], VERSION_FACTS: [] };
const DATAOBJ = loadGlobal('assets/js/data.js', 'DATA') || {};
const GLOSS = Array.isArray(DATAOBJ.glossary) ? DATAOBJ.glossary : [];

fs.rmSync(path.join(ROOT, 'dictionary'), { recursive: true, force: true });
fs.rmSync(path.join(ROOT, 'glossary'), { recursive: true, force: true });
fs.rmSync(path.join(ROOT, 'workshop'), { recursive: true, force: true });

function writePage(rel, html) {
    const dir = path.join(ROOT, rel);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    urls.push(`${SITE}/${rel}/`);
}
function refPage(o) {
    const url = `${SITE}/${o.rel}/`;
    const d = (o.desc || '').replace(/\s+/g, ' ').slice(0, 300);
    const jsonld = { '@context': 'https://schema.org', '@type': o.type || 'DefinedTerm', name: o.term || o.title, description: d, url, inDefinedTermSet: `${SITE}/dictionary/`, isAccessibleForFree: true, publisher: { '@type': 'Organization', name: 'ISO 20022 Academy', url: SITE } };
    return shell({
        path: `/${o.rel}/`, title: `${o.title} · ISO 20022 Academy`, ogTitle: o.title, desc: d, jsonld,
        prerender: `<section class="prerender-ref">
  <p class="prerender-kicker">${esc(o.kicker)}</p>
  <h1>${esc(o.title)}</h1>
  ${o.standfirst ? `<p class="prerender-standfirst">${o.standfirst}</p>` : ''}
  ${o.body}
</section>`
    });
}

let refCount = 0;
// Dictionary landing
writePage('dictionary', refPage({ rel: 'dictionary', type: 'WebPage', kicker: 'Reference', title: 'The ISO 20022 Dictionary', titleClass: 'txt',
    standfirst: 'Every element and code set — definitions, cardinality, valid codes, and an example.',
    desc: 'The ISO 20022 dictionary: message elements and code sets (reason, purpose, status, settlement).',
    body: `<p>Browse ${Object.keys(DICT.ELEMENTS).length} elements and ${CODES.SETS.length} code sets — definitions, cardinality, valid codes, and examples. To work with a whole message, use the <a href="${SITE}/playground/">Live Translator</a>.</p>` }));
refCount++;

// Retired message pages (2026-10). Whole messages now live in the Live
// Translator, so each old /dictionary/<code>/ URL becomes a noindex redirect
// stub instead of a 404. Not added to the sitemap.
Object.keys(DICT.MESSAGES).forEach(code => {
    const dir = path.join(ROOT, 'dictionary', code);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(code)} · ISO 20022 Academy</title><meta name="robots" content="noindex"><link rel="canonical" href="${SITE}/dictionary/"><meta http-equiv="refresh" content="0; url=/playground/"></head><body><p>${esc(code)} now lives in the <a href="/playground/">Live Translator</a>.</p></body></html>`);
});

// Elements
Object.keys(DICT.ELEMENTS).forEach(name => {
    const e = DICT.ELEMENTS[name];
    const codesBlock = (e.codes && e.codes.length) ? `<h2>Valid codes</h2><table><tbody>${e.codes.map(c => { const p = String(c).split(' — '); return `<tr><td><code>${esc(p[0])}</code></td><td>${esc(p.slice(1).join(' — '))}</td></tr>`; }).join('')}</tbody></table>` : '';
    const exBlock = e.ex ? `<h2>Example</h2><pre><code>${esc(e.ex)}</code></pre>` : '';
    const noteBlock = e.note ? `<p><strong>Watch out.</strong> ${esc(e.note)}</p>` : '';
    writePage(`dictionary/field/${name}`, refPage({ rel: `dictionary/field/${name}`, type: 'DefinedTerm', kicker: 'ISO 20022 element', title: `<${name}>`, term: name,
        standfirst: esc(e.def), desc: `${name} — ${e.def}`,
        body: `<dl><dt>Cardinality (typical)</dt><dd><code>${esc(e.c || '—')}</code></dd></dl>${noteBlock}${codesBlock}${exBlock}` }));
    refCount++;
});

// Code sets + individual codes
CODES.SETS.forEach(s => {
    const rows = s.codes.map(c => `<tr><td><code><a href="/dictionary/codes/${s.id}/${c.code}/">${esc(c.code)}</a></code></td><td>${esc(c.name)}</td><td>${esc(c.desc)}</td></tr>`).join('');
    writePage(`dictionary/codes/${s.id}`, refPage({ rel: `dictionary/codes/${s.id}`, type: 'DefinedTermSet', kicker: 'ISO 20022 code set', title: s.name,
        standfirst: esc(s.blurb), desc: `${s.name}: ${s.blurb} Carried in ${s.field}.`,
        body: `<p><strong>Carried in:</strong> ${esc(s.field)}</p>${s.note ? `<p><em>${esc(s.note)}</em></p>` : ''}<table><thead><tr><th>Code</th><th>Name</th><th>Meaning</th></tr></thead><tbody>${rows}</tbody></table>` }));
    refCount++;
    s.codes.forEach(c => {
        writePage(`dictionary/codes/${s.id}/${c.code}`, refPage({ rel: `dictionary/codes/${s.id}/${c.code}`, type: 'DefinedTerm', kicker: `${s.name} · ISO 20022 code`, title: c.code, term: c.code,
            standfirst: `<strong>${esc(c.name)}</strong> — ${esc(c.desc)}`, desc: `${c.code} (${c.name}) — ${c.desc} An ISO 20022 code from the ${s.name.toLowerCase()}, carried in ${s.field}.`,
            body: `<dl><dt>Code</dt><dd><code>${esc(c.code)}</code></dd><dt>Name</dt><dd>${esc(c.name)}</dd><dt>Code set</dt><dd><a href="/dictionary/codes/${s.id}/">${esc(s.name)}</a></dd><dt>Carried in</dt><dd>${esc(s.field)}</dd></dl>` }));
        refCount++;
    });
});

// What's changing
if (CHG.MILESTONES.length) {
    const tl = CHG.MILESTONES.map(m => `<tr><td><strong>${esc(m.when)}</strong></td><td>${esc(m.title)}<br>${esc(m.body)}</td></tr>`).join('');
    const map = CHG.MAP.map(r => `<tr><td><code>${esc(r.mt)}</code></td><td><code>${esc(r.mx)}</code></td><td>${esc(r.what)}</td></tr>`).join('');
    writePage('dictionary/changes', refPage({ rel: 'dictionary/changes', type: 'WebPage', kicker: 'ISO 20022', title: "What's changing", titleClass: 'txt',
        standfirst: 'Migration deadlines, the MT&nbsp;&#8644;&nbsp;MX map, and how versions move.', desc: 'ISO 20022 migration timeline (MT retirement, structured addresses, Case Management) plus the MT to MX message mapping and the version cycle.',
        body: `<h2>Migration timeline</h2><table><tbody>${tl}</tbody></table><h2>MT &#8644; MX map</h2><table><thead><tr><th>Legacy MT</th><th>ISO 20022</th><th>What it is</th></tr></thead><tbody>${map}</tbody></table>` }));
    refCount++;
}

// Glossary terms
GLOSS.forEach(t => {
    if (!t.slug || !t.term) return;
    writePage(`glossary/${t.slug}`, refPage({ rel: `glossary/${t.slug}`, type: 'DefinedTerm', kicker: 'ISO 20022 glossary', title: t.term, titleClass: 'txt', term: t.term,
        standfirst: '', desc: t.definition || t.term,
        body: `<p>${esc(t.definition || '')}</p>` }));
    refCount++;
});

// Workshops — the hands-on half. Only the ones that are actually playable get a
// page; an indexed "coming soon" is a thin-content penalty waiting to happen.
const WS = loadGlobal('assets/js/workshops.data.js', 'WORKSHOPS') || { LIST: [], DEFS: {} };
if (WS.LIST.length) {
    const cards = WS.LIST.filter(w => w.ready).map(w =>
        `<h2>${esc(w.title)}</h2><p><em>${esc(w.kicker)} &middot; ~${w.minutes} min</em></p><p>${esc(w.blurb)}</p>` +
        `<p>What it exercises: ${(w.skills || []).map(esc).join(', ')}.</p>`).join('');
    writePage('workshop', refPage({
        rel: 'workshop', type: 'WebPage', kicker: 'Hands-on', title: 'ISO 20022 Workshops', titleClass: 'txt',
        standfirst: 'Practise on real broken messages, not multiple choice.',
        desc: 'Hands-on ISO 20022 workshops: debug a broken pacs.008, migrate an MT103, and handle R-transactions. Checked automatically against real validation rules.',
        body: cards
    }));
    refCount++;

    WS.LIST.filter(w => w.ready).forEach(w => {
        const d = WS.DEFS[w.id] || {};
        const skills = (w.skills || []).map(s => `<li>${esc(s)}</li>`).join('');
        writePage(`workshop/${w.id}`, refPage({
            rel: `workshop/${w.id}`, type: 'LearningResource', kicker: `Workshop &middot; ${esc(w.kicker)}`,
            title: w.title, titleClass: 'txt',
            standfirst: esc(w.blurb),
            desc: `${w.blurb} A hands-on ISO 20022 workshop, checked automatically.`,
            body: `<p>${esc(w.blurb)}</p><h2>What you practise</h2><ul>${skills}</ul>` +
                  (d.task ? `<h2>The task</h2><p>${esc(d.task)}</p>` : '')
        }));
        refCount++;
    });
}

// ---------------------------------------------------------------------------
// THE REST OF THE APP'S VIEWS — each gets its folder too, so a reload or a
// shared link on any clean URL lands on a real page instead of a 404.
// ---------------------------------------------------------------------------
const appSrc = fs.readFileSync(path.join(ROOT, 'assets/js/app.js'), 'utf8');
const chapters = [];
appSrc.replace(/slug: '([a-z0-9-]+)', status: 'ready'[\s\S]*?title: '([^']+)'[\s\S]*?summary: '([^']+)'/g, (m, slug, title, summary) => { chapters.push({ slug, title, summary }); return m; });
const simple = (rel, title, desc, body, extra) => writeShell(rel, {
    title: `${title} · ISO 20022 Academy`, ogTitle: title, desc,
    prerender: `<section class="prerender-ref"><h1>${esc(title)}</h1><p class="prerender-standfirst">${esc(desc)}</p>${body || ''}</section>`, ...(extra || {})
}, !(extra && extra.canonical));
const lessonList = pages.map(p => `<li><a href="/library/${p.id}/">${esc(p.meta.title)}</a></li>`).join('');
simple('library', 'The Library', 'A free ISO 20022 course in six sections, from what money is to reading a real pacs.008.',
    `<ol>${lessonList}</ol>`, { canonical: '/' });
simple('playground', 'Live Translator', 'Translate between ISO 20022 (MX) and SWIFT MT: pacs.008 and MT103, pain.001 and MT101, camt.053 and MT940 and more, checked field by field.');
simple('history', 'History', 'How money became information: five chapters from the first ledgers to ISO 20022.',
    `<ol>${chapters.map(c => `<li><a href="/history/${c.slug}/">${esc(c.title)}</a></li>`).join('')}</ol>`);
chapters.forEach(c => simple(`history/${c.slug}`, c.title, c.summary));
simple('whats-new', "What's new", 'Every new lesson, workshop and tool on ISO 20022 Academy, newest first.');
simple('journey', 'The life of a payment', 'Follow one payment end to end, from the customer instruction to the final credit.');
simple('reference', 'Reference', 'The ISO 20022 glossary and dictionary.', '', { canonical: '/glossary/' });
simple('glossary', 'Glossary', `${GLOSS.length} ISO 20022 and payments terms, explained in plain English.`,
    `<ul>${GLOSS.filter(t => t.slug && t.term).map(t => `<li><a href="/glossary/${t.slug}/">${esc(t.term)}</a></li>`).join('')}</ul>`);
simple('dictionary/codes', 'ISO 20022 code sets', 'Reason, purpose, status and other ISO 20022 code sets with every code explained.',
    `<ul>${CODES.SETS.map(c => `<li><a href="/dictionary/codes/${c.id}/">${esc(c.name)}</a></li>`).join('')}</ul>`);

// Anything else (a mistyped or retired address): GitHub Pages serves 404.html,
// which is the app too, so the visitor lands in the Library rather than a dead end.
fs.writeFileSync(path.join(ROOT, '404.html'), shell({ path: '/404/', canonical: '/', title: 'Page not found · ISO 20022 Academy',
    desc: 'That page has moved or never existed.', noindex: true,
    prerender: '<section class="prerender-ref"><h1>Page not found</h1><p>That address has moved or never existed. <a href="/library/">Go to the Library</a>.</p></section>' }));

// sitemap.xml + robots.txt
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`build-seo: ${pages.length} article pages → /library/, ${refCount} reference pages → /dictionary/ & /glossary/, sitemap.xml (${urls.length} urls), robots.txt`);
