#!/usr/bin/env node
// Username sweep from the command line (no browser extension needed).
// Usage: node scripts/sweep.mjs <username> [--nsfw] [--concurrency 24] [--out file.json]
import fs from 'node:fs';
import { loadSites, sweep } from '../extension/sweep-core.js';

const args = process.argv.slice(2);
const username = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--concurrency' && args[args.indexOf(a) - 1] !== '--out');
if (!username) {
    console.log('Usage: node scripts/sweep.mjs <username> [--nsfw] [--concurrency 24] [--out results.json]');
    process.exit(1);
}
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };
const out = opt('out', `sweep_${username.replace(/[^\w.-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`);

console.log('Downloading the WhatsMyName site list…');
const sites = await loadSites();
let total = 0, done = 0;
const hits = [];
const results = await sweep(username, sites, {
    includeNsfw: args.includes('--nsfw'),
    concurrency: Number(opt('concurrency', 24)),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    onStart: n => { total = n; console.log(`Checking "${username}" on ${n} sites…\n`); },
    onResult: r => {
        done++;
        if (r.found) { hits.push(r); console.log(`  [+] ${r.site.padEnd(28)} ${r.url}`); }
        if (done % 100 === 0) console.log(`  … ${done}/${total}`);
    },
});
const errors = results.filter(r => r.error).length;
console.log(`\nFound on ${hits.length} of ${total} sites (${errors} could not be checked).`);
fs.writeFileSync(out, JSON.stringify({ username, checked: new Date().toISOString(), total, found: hits, source: 'WhatsMyName (CC BY-SA 4.0)' }, null, 2));
console.log(`Saved to ${out}. Matches come from page content; open them to confirm.`);
