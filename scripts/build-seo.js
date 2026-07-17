#!/usr/bin/env node
// ===========================================================================
// scripts/build-seo.js — generates crawlable static pages for every published
// Library article, plus sitemap.xml and robots.txt.
//
// Why: the app is a hash-routed SPA, so search engines see one URL. These
// pages give every lesson a real URL (/library/<id>/) with full content,
// meta/OG tags, JSON-LD, internal links to related lessons, and a CTA into
// the interactive app.
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
    if (kind === 'page' && arg) return `/#/${arg}`;
    if (kind === 'explorer') return `/#/playground`;
    if (kind === 'playground') return `/#/playground`;
    return `/#/library`;
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

// ---- Page template ---------------------------------------------------------
function pageHtml(meta, bodyHtml, id, titleById) {
    const url = `${SITE}/library/${id}/`;
    const app = `${SITE}/#/library/${id}`;
    const title = `${meta.title} · ISO 20022 Academy`;
    const desc = String(meta.summary || '').slice(0, 300);
    const rel = (Array.isArray(meta.related) ? meta.related : [])
        .filter(rid => rid !== id && titleById[rid]);
    const relatedHtml = rel.length ? `<div class="related"><h2>Related lessons</h2><ul>${rel.map(rid => `<li><a href="/library/${rid}/">${esc(titleById[rid])}</a></li>`).join('')}</ul></div>` : '';
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
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/images/favicon-192.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="ISO 20022 Academy">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/images/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>
  :root { --bg:#FAF9F5; --ink:#1A211C; --muted:#5C685F; --primary:#0E9F70; --border:#E4E2DA; }
  body { margin:0; background:var(--bg); color:var(--ink); font:17px/1.7 Georgia,'Times New Roman',serif; }
  .wrap { max-width:720px; margin:0 auto; padding:40px 20px 80px; }
  a { color:var(--primary); }
  .brand { font-family:system-ui,sans-serif; font-weight:700; color:var(--ink); text-decoration:none; font-size:15px; }
  .brand em { color:var(--primary); font-style:normal; }
  .kicker { font-family:ui-monospace,monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--primary); margin:34px 0 8px; }
  h1 { font-family:system-ui,sans-serif; font-size:34px; line-height:1.15; letter-spacing:-.02em; margin:0 0 10px; }
  .standfirst { color:var(--muted); font-size:19px; font-style:italic; margin:0 0 14px; }
  .meta { color:var(--muted); font-size:14px; font-family:system-ui,sans-serif; margin-bottom:26px; }
  .cta { display:inline-block; font-family:system-ui,sans-serif; font-weight:600; font-size:15px; color:#fff; background:var(--primary); padding:11px 20px; border-radius:10px; text-decoration:none; margin:6px 0 30px; }
  blockquote { margin:0 0 1em; padding:14px 18px; background:#EAF4EE; border-left:3px solid var(--primary); border-radius:8px; }
  h2 { font-family:system-ui,sans-serif; font-size:24px; margin-top:1.6em; letter-spacing:-.01em; }
  h3 { font-family:system-ui,sans-serif; font-size:19px; margin-top:1.4em; }
  code { font-family:ui-monospace,monospace; font-size:.88em; background:#EFEEE7; padding:1px 5px; border-radius:4px; }
  pre { background:#10201A; color:#D9E6DE; padding:16px; border-radius:10px; overflow-x:auto; }
  pre code { background:none; color:inherit; padding:0; }
  table { border-collapse:collapse; width:100%; margin:0 0 1.4em; font-family:system-ui,sans-serif; font-size:15px; }
  th, td { border:1px solid var(--border); padding:8px 12px; text-align:left; vertical-align:top; }
  th { background:#EFEEE7; font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); }
  ol, ul { padding-left:1.3em; }
  .more a { font-family:system-ui,sans-serif; font-weight:600; text-decoration:none; }
  .qa { background:#F3F1EA; border-radius:8px; padding:12px 16px; font-family:system-ui,sans-serif; font-size:15px; }
  .related { margin-top:44px; padding-top:20px; border-top:1px solid var(--border); }
  .related h2 { font-size:15px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); }
  .related ul { list-style:none; padding:0; font-family:system-ui,sans-serif; }
  .related li { margin:8px 0; }
  .foot { margin-top:48px; padding-top:18px; border-top:1px solid var(--border); color:var(--muted); font-family:system-ui,sans-serif; font-size:13px; }
</style>
</head>
<body>
<div class="wrap">
  <a class="brand" href="${SITE}/">ISO 20022 <em>Academy</em></a>
  <div class="kicker">${esc(String(meta.level))} · Library</div>
  <h1>${esc(meta.title)}</h1>
  ${meta.summary ? `<p class="standfirst">${esc(meta.summary)}</p>` : ''}
  <div class="meta">${meta.minutes ? meta.minutes + ' min read · ' : ''}free, no signup</div>
  <a class="cta" href="${app}">Read in the interactive Academy &rarr;</a>
  ${bodyHtml}
  ${relatedHtml}
  <div class="foot">Part of <a href="${SITE}/">ISO 20022 Academy</a> — lessons, a message playground, quizzes, and a glossary for the language of modern payments. Written by <a href="https://www.linkedin.com/in/revanth-sai-2002/">Revanth Sai Rayapati</a>.</div>
</div>
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "11b2bff9a0f84f4a83a1bccdc1da12df"}'></script>
</body>
</html>`;
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

// Pass 2: render each page.
const urls = [`${SITE}/`];
for (const p of pages) {
    const dir = path.join(OUT_DIR, p.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), pageHtml(p.meta, mdToHtml(p.body), p.id, titleById));
    urls.push(`${SITE}/library/${p.id}/`);
}

// ---------------------------------------------------------------------------
// REFERENCE PAGES — dictionary messages/elements, code sets/codes, the
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

// sample XML per message (for anatomy + appears-in)
const SAMPLES = {};
const SAMPLE_DIR = path.join(ROOT, 'samples');
if (fs.existsSync(SAMPLE_DIR)) {
    for (const f of fs.readdirSync(SAMPLE_DIR).filter(x => x.endsWith('.json') && x !== 'manifest.json')) {
        try { SAMPLES[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, f), 'utf8')).xml || ''; } catch (e) {}
    }
}
function sampleXml(code) { return SAMPLES[(DICT.SAMPLE_FOR && DICT.SAMPLE_FOR[code]) || code] || ''; }
function elemsIn(xml) {
    const out = [], seen = {}, re = /<([A-Za-z][A-Za-z0-9]*)/g; let m;
    while ((m = re.exec(xml))) { if (!seen[m[1]]) { seen[m[1]] = 1; out.push(m[1]); } }
    return out;
}
const APPEARS = {};
Object.keys(DICT.MESSAGES).forEach(code => { elemsIn(sampleXml(code)).forEach(n => { (APPEARS[n] = APPEARS[n] || []).push(code); }); });

fs.rmSync(path.join(ROOT, 'dictionary'), { recursive: true, force: true });
fs.rmSync(path.join(ROOT, 'glossary'), { recursive: true, force: true });

function writePage(rel, html) {
    const dir = path.join(ROOT, rel);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    urls.push(`${SITE}/${rel}/`);
}
function refPage(o) {
    const url = `${SITE}/${o.rel}/`;
    const d = (o.desc || '').replace(/\s+/g, ' ').slice(0, 300);
    const jsonld = { '@context': 'https://schema.org', '@type': o.type || 'DefinedTerm', name: o.term || o.title, description: d, url, inDefinedTermSet: `${SITE}/#/dictionary`, isAccessibleForFree: true, publisher: { '@type': 'Organization', name: 'ISO 20022 Academy', url: SITE } };
    return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(o.title)} · ISO 20022 Academy</title>
<meta name="description" content="${esc(d)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<meta property="og:type" content="website"><meta property="og:site_name" content="ISO 20022 Academy">
<meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(d)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/assets/images/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>
 :root{--bg:#FAF9F5;--ink:#1A211C;--muted:#5C685F;--primary:#0E9F70;--border:#E4E2DA}
 body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.7 Georgia,'Times New Roman',serif}
 .wrap{max-width:720px;margin:0 auto;padding:40px 20px 80px}
 a{color:var(--primary)}
 .brand{font-family:system-ui,sans-serif;font-weight:700;color:var(--ink);text-decoration:none;font-size:15px}
 .brand em{color:var(--primary);font-style:normal}
 .kicker{font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--primary);margin:34px 0 8px}
 h1{font-family:ui-monospace,monospace;font-size:30px;margin:0 0 12px;letter-spacing:-.01em}
 h1.txt{font-family:system-ui,sans-serif;letter-spacing:-.02em;font-size:34px}
 .standfirst{color:var(--muted);font-size:18px;margin:0 0 16px}
 .cta{display:inline-block;font-family:system-ui,sans-serif;font-weight:600;font-size:15px;color:#fff;background:var(--primary);padding:11px 20px;border-radius:10px;text-decoration:none;margin:6px 0 26px}
 h2{font-family:system-ui,sans-serif;font-size:20px;margin-top:1.6em}
 code{font-family:ui-monospace,monospace;font-size:.9em;background:#EFEEE7;padding:1px 5px;border-radius:4px}
 pre{background:#10201A;color:#D9E6DE;padding:16px;border-radius:10px;overflow-x:auto;font-size:13px;line-height:1.5}
 pre code{background:none;color:inherit;padding:0}
 table{border-collapse:collapse;width:100%;margin:0 0 1.4em;font-family:system-ui,sans-serif;font-size:15px}
 th,td{border:1px solid var(--border);padding:8px 12px;text-align:left;vertical-align:top}
 th{background:#EFEEE7;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
 dl{font-family:system-ui,sans-serif;margin:0 0 1em}dt{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-top:12px}dd{margin:2px 0 0;font-size:16px}
 .chips a{display:inline-block;font-family:ui-monospace,monospace;font-size:13px;background:#EFEEE7;border-radius:999px;padding:3px 11px;margin:0 6px 7px 0;text-decoration:none}
 .foot{margin-top:48px;padding-top:18px;border-top:1px solid var(--border);color:var(--muted);font-family:system-ui,sans-serif;font-size:13px}
</style></head>
<body><div class="wrap">
<a class="brand" href="${SITE}/">ISO 20022 <em>Academy</em></a>
<div class="kicker">${esc(o.kicker)}</div>
<h1${o.titleClass ? ' class="' + o.titleClass + '"' : ''}>${esc(o.title)}</h1>
${o.standfirst ? `<p class="standfirst">${o.standfirst}</p>` : ''}
${o.appUrl ? `<a class="cta" href="${o.appUrl}">Open in the interactive Academy &rarr;</a>` : ''}
${o.body}
<div class="foot">Part of the <a href="${SITE}/#/dictionary">ISO 20022 Dictionary</a> — the reference layer of <a href="${SITE}/">ISO 20022 Academy</a>. Written by <a href="https://www.linkedin.com/in/revanth-sai-2002/">Revanth Sai Rayapati</a>.</div>
</div>
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "11b2bff9a0f84f4a83a1bccdc1da12df"}'></script>
</body></html>`;
}

let refCount = 0;
// Dictionary landing
writePage('dictionary', refPage({ rel: 'dictionary', type: 'WebPage', kicker: 'Reference', title: 'The ISO 20022 Dictionary', titleClass: 'txt',
    standfirst: 'Every message and element — definitions, cardinality, valid codes, and a live example.',
    desc: 'The ISO 20022 dictionary: message families, elements, and code sets (reason, purpose, status, settlement).', appUrl: `${SITE}/#/dictionary`,
    body: `<p>Browse ${Object.keys(DICT.MESSAGES).length} messages, ${Object.keys(DICT.ELEMENTS).length} elements, and ${CODES.SETS.length} code sets — definitions, cardinality, valid codes, and examples.</p>` }));
refCount++;

// Messages
Object.keys(DICT.MESSAGES).forEach(code => {
    const m = DICT.MESSAGES[code], xml = sampleXml(code);
    const els = elemsIn(xml).filter(n => DICT.ELEMENTS[n]);
    const elChips = els.length ? `<h2>Elements</h2><p class="chips">${els.map(n => `<a href="/dictionary/field/${n}/">${esc(n)}</a>`).join('')}</p>` : '';
    const xmlBlock = xml ? `<h2>Sample</h2><pre><code>${esc(xml)}</code></pre>` : '';
    writePage(`dictionary/${code}`, refPage({ rel: `dictionary/${code}`, type: 'TechArticle', kicker: `${m.family} · ISO 20022 message`, title: code,
        standfirst: `${esc(m.name)} — ${esc(m.purpose)}`, desc: `${code} (${m.name}): ${m.purpose} Version ${m.version}; replaces ${m.mt}.`, appUrl: `${SITE}/#/dictionary/${code}`,
        body: `<dl><dt>Full identifier</dt><dd><code>${esc(m.version)}</code></dd><dt>MT predecessor</dt><dd>${esc(m.mt)}</dd><dt>Direction</dt><dd>${esc(m.dir)}</dd></dl>${elChips}${xmlBlock}` }));
    refCount++;
});

// Elements
Object.keys(DICT.ELEMENTS).forEach(name => {
    const e = DICT.ELEMENTS[name];
    const codesBlock = (e.codes && e.codes.length) ? `<h2>Valid codes</h2><table><tbody>${e.codes.map(c => { const p = String(c).split(' — '); return `<tr><td><code>${esc(p[0])}</code></td><td>${esc(p.slice(1).join(' — '))}</td></tr>`; }).join('')}</tbody></table>` : '';
    const exBlock = e.ex ? `<h2>Example</h2><pre><code>${esc(e.ex)}</code></pre>` : '';
    const app = (APPEARS[name] || []).slice().sort();
    const appBlock = app.length ? `<h2>Appears in</h2><p class="chips">${app.map(c => `<a href="/dictionary/${c}/">${esc(c)}</a>`).join('')}</p>` : '';
    const noteBlock = e.note ? `<p><strong>Watch out.</strong> ${esc(e.note)}</p>` : '';
    writePage(`dictionary/field/${name}`, refPage({ rel: `dictionary/field/${name}`, type: 'DefinedTerm', kicker: 'ISO 20022 element', title: `<${name}>`, term: name,
        standfirst: esc(e.def), desc: `${name} — ${e.def}`, appUrl: `${SITE}/#/dictionary/_/${name}`,
        body: `<dl><dt>Cardinality (typical)</dt><dd><code>${esc(e.c || '—')}</code></dd></dl>${noteBlock}${codesBlock}${exBlock}${appBlock}` }));
    refCount++;
});

// Code sets + individual codes
CODES.SETS.forEach(s => {
    const rows = s.codes.map(c => `<tr><td><code><a href="/dictionary/codes/${s.id}/${c.code}/">${esc(c.code)}</a></code></td><td>${esc(c.name)}</td><td>${esc(c.desc)}</td></tr>`).join('');
    writePage(`dictionary/codes/${s.id}`, refPage({ rel: `dictionary/codes/${s.id}`, type: 'DefinedTermSet', kicker: 'ISO 20022 code set', title: s.name,
        standfirst: esc(s.blurb), desc: `${s.name}: ${s.blurb} Carried in ${s.field}.`, appUrl: `${SITE}/#/dictionary/codes/${s.id}`,
        body: `<p><strong>Carried in:</strong> ${esc(s.field)}</p>${s.note ? `<p><em>${esc(s.note)}</em></p>` : ''}<table><thead><tr><th>Code</th><th>Name</th><th>Meaning</th></tr></thead><tbody>${rows}</tbody></table>` }));
    refCount++;
    s.codes.forEach(c => {
        writePage(`dictionary/codes/${s.id}/${c.code}`, refPage({ rel: `dictionary/codes/${s.id}/${c.code}`, type: 'DefinedTerm', kicker: `${s.name} · ISO 20022 code`, title: c.code, term: c.code,
            standfirst: `<strong>${esc(c.name)}</strong> — ${esc(c.desc)}`, desc: `${c.code} (${c.name}) — ${c.desc} An ISO 20022 code from the ${s.name.toLowerCase()}, carried in ${s.field}.`, appUrl: `${SITE}/#/dictionary/codes/${s.id}`,
            body: `<dl><dt>Code</dt><dd><code>${esc(c.code)}</code></dd><dt>Name</dt><dd>${esc(c.name)}</dd><dt>Code set</dt><dd><a href="/dictionary/codes/${s.id}/">${esc(s.name)}</a></dd><dt>Carried in</dt><dd>${esc(s.field)}</dd></dl>` }));
        refCount++;
    });
});

// What's changing
if (CHG.MILESTONES.length) {
    const tl = CHG.MILESTONES.map(m => `<tr><td><strong>${esc(m.when)}</strong></td><td>${esc(m.title)}<br>${esc(m.body)}</td></tr>`).join('');
    const map = CHG.MAP.map(r => `<tr><td><code>${esc(r.mt)}</code></td><td><code>${esc(r.mx)}</code></td><td>${esc(r.what)}</td></tr>`).join('');
    writePage('dictionary/changes', refPage({ rel: 'dictionary/changes', type: 'WebPage', kicker: 'ISO 20022', title: "What's changing", titleClass: 'txt',
        standfirst: 'Migration deadlines, the MT&nbsp;&#8644;&nbsp;MX map, and how versions move.', desc: 'ISO 20022 migration timeline (MT retirement, structured addresses, Case Management) plus the MT to MX message mapping and the version cycle.', appUrl: `${SITE}/#/dictionary/changes`,
        body: `<h2>Migration timeline</h2><table><tbody>${tl}</tbody></table><h2>MT &#8644; MX map</h2><table><thead><tr><th>Legacy MT</th><th>ISO 20022</th><th>What it is</th></tr></thead><tbody>${map}</tbody></table>` }));
    refCount++;
}

// Glossary terms
GLOSS.forEach(t => {
    if (!t.slug || !t.term) return;
    writePage(`glossary/${t.slug}`, refPage({ rel: `glossary/${t.slug}`, type: 'DefinedTerm', kicker: 'ISO 20022 glossary', title: t.term, titleClass: 'txt', term: t.term,
        standfirst: '', desc: t.definition || t.term, appUrl: `${SITE}/#/glossary/${t.slug}`,
        body: `<p>${esc(t.definition || '')}</p>` }));
    refCount++;
});

// sitemap.xml + robots.txt
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`build-seo: ${pages.length} article pages → /library/, ${refCount} reference pages → /dictionary/ & /glossary/, sitemap.xml (${urls.length} urls), robots.txt`);
