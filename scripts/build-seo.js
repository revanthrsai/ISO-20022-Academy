#!/usr/bin/env node
// ===========================================================================
// scripts/build-seo.js — generates crawlable static pages for every published
// Library article, plus sitemap.xml and robots.txt.
//
// Why: the app is a hash-routed SPA, so search engines see one URL. These
// stubs give every lesson a real URL (/library/<id>/) with full content,
// meta/OG tags and JSON-LD, and a CTA into the interactive app.
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

// ---- Tiny markdown → HTML (good enough for crawlers) ----------------------
function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function inline(s) {
    return esc(s)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]*)\)/g, '$1'); // links → text (stub pages keep it simple)
}
function mdToHtml(md) {
    const out = [];
    const lines = md.split('\n');
    let i = 0, para = [], list = null, code = false, codeBuf = [];
    const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
    const flushList = () => { if (list) { out.push(`<ul>${list.map(li => `<li>${inline(li)}</li>`).join('')}</ul>`); list = null; } };
    while (i < lines.length) {
        const line = lines[i];
        if (code) {
            if (/^```/.test(line)) { out.push(`<pre><code>${esc(codeBuf.join('\n'))}</code></pre>`); code = false; codeBuf = []; }
            else codeBuf.push(line);
            i++; continue;
        }
        if (/^```/.test(line)) { flushPara(); flushList(); code = true; i++; continue; }
        // skip app-only tokens: {{flow:..}}, {{embed:..}}
        if (/^\{\{(flow|embed):/.test(line.trim())) { i++; continue; }
        // quiz tokens → FAQ-ish plain text (question + correct answer)
        const chk = line.trim().match(/^\{\{check:([^|]+)\|([^|]+)\|/);
        if (chk) { flushPara(); flushList(); out.push(`<p><strong>${inline(chk[1].trim())}</strong> ${inline(chk[2].trim())}</p>`); i++; continue; }
        const h = line.match(/^(#{2,4})\s+(.*)$/);
        if (h) { flushPara(); flushList(); const lv = h[1].length; out.push(`<h${lv}>${inline(h[2])}</h${lv}>`); i++; continue; }
        if (/^>\s?/.test(line)) {
            flushPara(); flushList();
            const quote = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, '')); i++; }
            out.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`);
            continue;
        }
        const li = line.match(/^\s*[-*]\s+(.*)$/);
        if (li) { flushPara(); if (!list) list = []; list.push(li[1]); i++; continue; }
        if (!line.trim()) { flushPara(); flushList(); i++; continue; }
        para.push(line.trim()); i++;
    }
    flushPara(); flushList();
    return out.join('\n');
}

// ---- Stub page template ----------------------------------------------------
function stubHtml(meta, bodyHtml, id) {
    const url = `${SITE}/library/${id}/`;
    const app = `${SITE}/#/library/${id}`;
    const title = `${meta.title} · ISO 20022 Academy`;
    const desc = String(meta.summary || '').slice(0, 300);
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
  .brand { font-family:system-ui,sans-serif; font-weight:700; color:var(--ink); text-decoration:none; font-size:15px; }
  .brand em { color:var(--primary); font-style:normal; }
  .kicker { font-family:ui-monospace,monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--primary); margin:34px 0 8px; }
  h1 { font-family:system-ui,sans-serif; font-size:34px; line-height:1.15; letter-spacing:-.02em; margin:0 0 10px; }
  .meta { color:var(--muted); font-size:14px; font-family:system-ui,sans-serif; margin-bottom:26px; }
  .cta { display:inline-block; font-family:system-ui,sans-serif; font-weight:600; font-size:15px; color:#fff; background:var(--primary); padding:11px 20px; border-radius:10px; text-decoration:none; margin:6px 0 30px; }
  blockquote { margin:0 0 1em; padding:14px 18px; background:#EAF4EE; border-left:3px solid var(--primary); border-radius:8px; }
  h2 { font-family:system-ui,sans-serif; font-size:24px; margin-top:1.6em; letter-spacing:-.01em; }
  code { font-family:ui-monospace,monospace; font-size:.88em; background:#EFEEE7; padding:1px 5px; border-radius:4px; }
  pre { background:#10201A; color:#D9E6DE; padding:16px; border-radius:10px; overflow-x:auto; }
  pre code { background:none; color:inherit; }
  .foot { margin-top:48px; padding-top:18px; border-top:1px solid var(--border); color:var(--muted); font-family:system-ui,sans-serif; font-size:13px; }
  .foot a { color:var(--primary); }
</style>
</head>
<body>
<div class="wrap">
  <a class="brand" href="${SITE}/">ISO 20022 <em>Academy</em></a>
  <div class="kicker">${esc(String(meta.level))} · Library</div>
  <h1>${esc(meta.title)}</h1>
  <div class="meta">${meta.minutes ? meta.minutes + ' min read · ' : ''}free, no signup</div>
  <a class="cta" href="${app}">Read in the interactive Academy →</a>
  ${bodyHtml}
  <div class="foot">Part of <a href="${SITE}/">ISO 20022 Academy</a> — lessons, message playground, and glossary for the language of modern payments. Written by <a href="https://www.linkedin.com/in/revanth-sai-2002/">Revanth Sai Rayapati</a>.</div>
</div>
</body>
</html>`;
}

// ---- Build -----------------------------------------------------------------
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const urls = [`${SITE}/`];
let built = 0;

for (const file of fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md') && !f.startsWith('_')).sort()) {
    const id = file.replace(/\.md$/, '');
    const parsed = splitFrontmatter(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
    if (!parsed || !parsed.meta.title) continue;
    if (parsed.meta.status === 'draft') continue;
    const dir = path.join(OUT_DIR, id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), stubHtml(parsed.meta, mdToHtml(parsed.body), id));
    urls.push(`${SITE}/library/${id}/`);
    built++;
}

// sitemap.xml + robots.txt
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`build-seo: ${built} article pages → /library/, sitemap.xml (${urls.length} urls), robots.txt`);
