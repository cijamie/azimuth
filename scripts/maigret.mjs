#!/usr/bin/env node
// Maigret-style username search from the command line, using Azimuth's JavaScript port of Maigret
// (extension/maigret-core.js) and Maigret's site database (extension/maigret-data.json, MIT License).
//
// Usage: node scripts/maigret.mjs <username> [more usernames] [options]
//   --top-sites N        check the N most popular sites (default 500)
//   -a, --all-sites      check every site (~8,600 enabled)
//   --tags a,b           only sites with these tags (e.g. social,coding,ru) or engines (e.g. xenforo)
//   --exclude-tags a,b   skip sites with these tags
//   --use-disabled-sites include sites Maigret marks as disabled
//   --id-type TYPE       search an identifier other than a username (gaia_id, vk_id, steam_id, ...)
//   --no-recursion       don't follow usernames found in profiles
//   --permute            treat the words as name parts and search their permutations
//   --timeout S          per-request timeout in seconds (default 15)
//   -n N                 parallel requests (default 50)
//   --update             download the latest site database from Maigret's GitHub first
//   --json FILE / --csv FILE / --html FILE   write reports (JSON is importable into Azimuth)
//   --print-not-found / --print-errors       also list sites where the account was not found / could not be checked
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareDb, search, permute, MAIGRET_DATA_URL, SUPPORTED_IDS } from '../extension/maigret-core.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (...names) => names.some(n => argv.includes(n));
const opt = (name, def) => { const i = argv.indexOf(name); return i > -1 ? argv[i + 1] : def; };
const valued = new Set(['--top-sites', '--tags', '--exclude-tags', '--id-type', '--timeout', '-n', '--json', '--csv', '--html']);
const names = argv.filter((a, i) => !a.startsWith('-') && !valued.has(argv[i - 1]));

if (!names.length || flag('-h', '--help')) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 21).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
    process.exit(names.length ? 0 : 1);
}

const dataPath = path.join(here, '..', 'extension', 'maigret-data.json');
if (flag('--update')) {
    process.stdout.write('Downloading the latest Maigret site database… ');
    const res = await fetch(MAIGRET_DATA_URL);
    if (!res.ok) { console.log(`failed (HTTP ${res.status})`); process.exit(1); }
    fs.writeFileSync(dataPath, await res.text());
    console.log('done');
}
const db = prepareDb(JSON.parse(fs.readFileSync(dataPath, 'utf8')), JSON.parse(fs.readFileSync(path.join(here, '..', 'extension', 'maigret-errors.json'), 'utf8')));

const idType = opt('--id-type', 'username');
if (!SUPPORTED_IDS.includes(idType)) { console.log(`Unknown --id-type. Supported: ${SUPPORTED_IDS.join(', ')}`); process.exit(1); }
const usernames = flag('--permute') ? permute(names) : names;
const top = flag('-a', '--all-sites') ? Infinity : Number(opt('--top-sites', 500));
const list = s => (s ? s.split(',').map(x => x.trim()).filter(Boolean) : []);

const c = { g: s => `\x1b[32m${s}\x1b[0m`, y: s => `\x1b[33m${s}\x1b[0m`, d: s => `\x1b[2m${s}\x1b[0m`, b: s => `\x1b[1m${s}\x1b[0m` };
const results = [];
let done = 0, total = 0;
const t0 = Date.now();
console.log(c.b(`Searching ${usernames.length > 1 ? `${usernames.length} usernames` : `"${usernames[0]}"`}…`));
const summary = await search(usernames, db, {
    top, tags: list(opt('--tags')), excludedTags: list(opt('--exclude-tags')), idType,
    includeDisabled: flag('--use-disabled-sites'), recursive: !flag('--no-recursion'),
    concurrency: Number(opt('-n', 50)), timeout: Number(opt('--timeout', 15)) * 1000, setUserAgent: true,
    onStart: ({ total: t, added }) => { total = t; if (added) console.log(c.y(`\n↳ found a new username in a profile: ${added}, searching it too`)); },
    onUsername: u => console.log(c.b(`\n[${u.username}]${u.via ? c.d(` from ${u.via}`) : ''}`)),
    onResult: r => {
        done++;
        results.push(r);
        if (r.status === 'claimed') {
            console.log(`  ${c.g('[+]')} ${r.site.padEnd(28)} ${r.url}${r.similar ? c.d(' (search page, check manually)') : ''}`);
            if (r.ids) for (const [k, v] of Object.entries(r.ids)) if (k !== 'image') console.log(c.d(`        ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`));
        } else if (r.status === 'available' && flag('--print-not-found')) console.log(c.d(`  [-] ${r.site}`));
        else if (r.status === 'unknown' && flag('--print-errors')) console.log(c.y(`  [?] ${r.site}: ${r.error}`));
        if (done % 250 === 0) process.stderr.write(c.d(`  … ${done}/${total}\n`));
    },
});

const secs = ((Date.now() - t0) / 1000).toFixed(0);
console.log(c.b(`\nFound ${summary.claimed} accounts across ${summary.usernames.length} username(s) on ${summary.sites} sites in ${secs}s.`));
console.log(c.d(`Not found: ${summary.available} · could not check: ${summary.unknown} · skipped (format not accepted): ${summary.illegal}`));
if (Object.keys(summary.errors).length) console.log(c.d(`Errors: ${Object.entries(summary.errors).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`));

const claimed = results.filter(r => r.status === 'claimed');
const out = opt('--json');
if (out) {
    // Maigret's "simple" JSON layout, keyed by site, so Azimuth's importer and other tools can read it.
    const json = {};
    for (const r of claimed) json[`${r.site}${r.username !== usernames[0] ? ` (${r.username})` : ''}`] = { username: r.username, url_user: r.url, url_main: r.urlMain, status: { status: 'Claimed', url: r.url, tags: r.tags, ids: { ...(r.ids?.fullname && { fullname: r.ids.fullname }), ...(r.ids?.links && { links: JSON.stringify(r.ids.links) }), ...(r.ids?.emails && { email: r.ids.emails[0] }) } }, rank: r.rank, http_status: r.httpStatus };
    fs.writeFileSync(out, JSON.stringify(json, null, 2));
    console.log(`JSON report: ${out}`);
}
if (opt('--csv')) {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    fs.writeFileSync(opt('--csv'), ['username,site,url,status,http_status,tags,rank,error,found_via', ...results.filter(r => r.status !== 'illegal').map(r => [r.username, r.site, r.url, r.status, r.httpStatus, r.tags.join(' '), r.rank, r.error, r.via].map(q).join(','))].join('\n'));
    console.log(`CSV report: ${opt('--csv')}`);
}
if (opt('--html')) {
    const e = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const html = `<!doctype html><meta charset="utf-8"><title>Username search: ${e(usernames.join(', '))}</title>
<style>body{font-family:system-ui,sans-serif;max-width:1000px;margin:2rem auto;padding:0 1rem}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left;font-size:14px}.t{color:#666;font-size:12px}</style>
<h1>Username search: ${e(usernames.join(', '))}</h1><p>${summary.claimed} accounts on ${summary.sites} sites · ${new Date().toISOString()} · Azimuth (Maigret port)</p>
<table><tr><th>Site</th><th>Username</th><th>Profile</th><th>Tags</th><th>Details</th></tr>${claimed.map(r => `<tr><td>${e(r.site)}</td><td>${e(r.username)}</td><td><a href="${e(r.url)}">${e(r.url)}</a></td><td class="t">${e(r.tags.join(', '))}</td><td class="t">${r.ids ? e(Object.entries(r.ids).filter(([k]) => k !== 'image').map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ')) : ''}</td></tr>`).join('')}</table>`;
    fs.writeFileSync(opt('--html'), html);
    console.log(`HTML report: ${opt('--html')}`);
}
