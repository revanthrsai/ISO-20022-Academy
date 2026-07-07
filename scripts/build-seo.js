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

// sitemap.xml + robots.txt
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`build-seo: ${pages.length} article pages → /library/, sitemap.xml (${urls.length} urls), robots.txt`);
