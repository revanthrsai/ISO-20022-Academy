#!/usr/bin/env node
// ===========================================================================
// scripts/build-samples.js — regenerates /samples/manifest.json from the
// per-message sample files (/samples/<code>.json).
//
// The Playground fetches the manifest to render its catalogue cards, then
// fetches each /samples/<code>.json on demand. Add a new sample file and this
// picks it up automatically — same ethos as build-toc.js / build-seo.js.
//
// Zero-dependency. Runs in the Pages workflow:  node scripts/build-samples.js
// ===========================================================================
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'samples');
if (!fs.existsSync(DIR)) { console.log('build-samples: no /samples dir, skipping'); process.exit(0); }

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json').sort();
const manifest = [];
for (const f of files) {
    try {
        const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
        if (!j.code) continue;
        manifest.push({
            code: j.code, family: j.family || '', label: j.label || j.code,
            kind: j.kind || '', sub: j.sub || '', note: j.note || '',
            dest: Array.isArray(j.dest) ? j.dest : ['viewer']
        });
    } catch (e) { console.warn('build-samples: skip ' + f + ' (' + e.message + ')'); }
}
fs.writeFileSync(path.join(DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('build-samples: manifest.json with ' + manifest.length + ' messages');
