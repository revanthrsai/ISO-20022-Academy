#!/usr/bin/env node
// ===========================================================================
// scripts/build-toc.js  —  Generates assets/js/toc.data.js from /content
// ===========================================================================
//
// Zero-dependency. Runs on every Netlify deploy (see netlify.toml) and can be
// run locally after adding an article:  node scripts/build-toc.js
//
// It reads the YAML frontmatter of every content/*.md file (same subset the
// runtime parser in markdown.js understands) and emits the ACADEMY_TOC
// registry. Publish an article in the CMS → it appears on the right shelf.
//
// Frontmatter contract (see docs/HANDBOOK.md §6):
//   required : title, level (100|200|300|400|500|600)
//   ordering : num   (position on the shelf; defaults to the filename prefix)
//   optional : summary, minutes, tags, status ('published'|'draft'), updated
// ---------------------------------------------------------------------------

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const OUT_FILE = path.join(ROOT, 'assets', 'js', 'toc.data.js');
const KNOWN_LEVELS = [100, 200, 300, 400, 500, 600];

// ---- Frontmatter parsing (mirrors markdown.js) ----------------------------
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
        const key = m[1];
        let val = m[2].trim();
        if (val.startsWith('[') && val.endsWith(']')) {
            val = val.slice(1, -1).split(',')
                .map(s => unquote(s.trim())).filter(Boolean);
        } else {
            val = unquote(val);
            if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
        }
        meta[key] = val;
    });
    return meta;
}

function splitFrontmatter(raw) {
    const text = raw.replace(/^﻿/, '');
    if (!text.startsWith('---')) return null;
    const end = text.indexOf('\n---', 3);
    if (end === -1) return null;
    return parseYaml(text.slice(3, end).trim());
}

// ---- Scan ------------------------------------------------------------------
const warnings = [];
const entries = [];

const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .sort();

for (const file of files) {
    const id = file.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const meta = splitFrontmatter(raw);

    if (!meta) { warnings.push(`SKIP ${file}: no frontmatter block`); continue; }
    if (!meta.title) { warnings.push(`SKIP ${file}: missing "title"`); continue; }
    if (!meta.level || !KNOWN_LEVELS.includes(Number(meta.level))) {
        warnings.push(`SKIP ${file}: missing/unknown "level" (${meta.level}) — must be one of ${KNOWN_LEVELS.join(', ')}`);
        continue;
    }

    // Ordering: explicit `num` wins; otherwise the filename's numeric prefix.
    let num = Number(meta.num);
    if (!num) {
        const m = file.match(/^(\d+)/);
        num = m ? Number(m[1]) : 999;
        warnings.push(`NOTE ${file}: no "num" in frontmatter — using filename prefix ${num}`);
    }

    entries.push({
        id,
        num,
        level: Number(meta.level),
        file,
        title: String(meta.title),
        summary: meta.summary ? String(meta.summary) : '',
        minutes: Number(meta.minutes) || 5,
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        status: meta.status === 'draft' ? 'draft' : 'published'
    });
}

// ---- Sanity checks ---------------------------------------------------------
const seenNum = {};
for (const e of entries) {
    const key = e.level + ':' + e.num;
    if (seenNum[key]) warnings.push(`WARN duplicate num ${e.num} on shelf ${e.level}: ${seenNum[key]} and ${e.id}`);
    seenNum[key] = e.id;
}

entries.sort((a, b) => (a.level - b.level) || (a.num - b.num));

// ---- Emit ------------------------------------------------------------------
const stamp = new Date().toISOString().slice(0, 10);
const body = entries.map(e => '    ' + JSON.stringify(e)).join(',\n');

const out = `// ===========================================================================
// toc.data.js  —  GENERATED FILE. DO NOT EDIT BY HAND.
// ===========================================================================
// Built by scripts/build-toc.js on ${stamp} from ${entries.length} files in /content.
// To change an article's listing, edit its frontmatter and rebuild
// (Netlify does this automatically on deploy; locally: node scripts/build-toc.js).
// ---------------------------------------------------------------------------

const ACADEMY_TOC = [
${body}
];
`;

fs.writeFileSync(OUT_FILE, out);

console.log(`build-toc: wrote ${entries.length} articles → assets/js/toc.data.js`);
warnings.forEach(w => console.warn('build-toc: ' + w));
