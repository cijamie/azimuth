#!/usr/bin/env node
// Azimuth link auditor.
// Usage: node scripts/check-links.mjs [--data js/data.js] [--out scripts/link-report.json] [--concurrency 24] [--apply]
//
// Classifies every URL in the registry as:
//   ok        2xx, content looks real
//   moved     redirected to a different site (final URL recorded)
//   blocked   site answered but refuses bots (401/403/429/503 behind a WAF) - usually fine in a browser
//   parked    domain answers but serves a parking / for-sale / suspended page
//   dead      404/410, DNS failure, connection refused, TLS mismatch
//   error     timeout or 5xx after retry - inconclusive
//   tor       .onion address, not checked
// With --apply, writes a `status` (and `checked`) field onto each node in data.js.

import fs from 'node:fs';
import path from 'node:path';
import { loadRegistry, saveRegistry, walkTools } from './registry.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => {
    const i = args.indexOf(`--${name}`);
    return i > -1 ? args[i + 1] : def;
};
const DATA = opt('data', 'js/data.js');
const OUT = opt('out', 'scripts/link-report.json');
const CONCURRENCY = Number(opt('concurrency', 24));
const APPLY = args.includes('--apply');
const TIMEOUT = 15000;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const SAMPLE = {
    username: 'johndoe', email: 'test@example.com', domain: 'example.com', ip: '8.8.8.8',
    phone: '15555550123', hash: 'd41d8cd98f00b204e9800998ecf8427e', url: 'https://example.com', any: 'test',
};

const PARKED_HOSTS = /(hugedomains|sedo\.com|sedoparking|dan\.com|afternic|bodis|parkingcrew|above\.com|undeveloped\.com|godaddy\.com\/domainsearch|domainmarket|buydomains|namecheap\.com\/domains|squadhelp|atom\.com|porkbun\.com\/checkout|spaceship\.com|domain\.com\/domains|parklogic|uniregistry)/i;
const PARKED_BODY = /(this domain (is|may be) for sale|buy this domain|domain is for sale|the domain .{0,40} is for sale|parked free|domain parking|this domain has expired|domain has been suspended|account has been suspended|this site can.t be reached|website is no longer available|parkingcrew|sedoparking|is available for purchase|future home of something quite cool|related searches|domain name is registered)/i;
const WAF_HINT = /(cloudflare|cf-ray|akamai|incapsula|sucuri|ddos-guard|perimeterx|datadome|captcha|just a moment|attention required)/i;

function sampleUrl(u, type) {
    const v = SAMPLE[type] || SAMPLE.any;
    return u
        .replace(/\{target\}/g, encodeURIComponent(v))
        .replace(/%3C[^%]*%3E/gi, 'test')
        .replace(/<[^>]+>/g, 'test')
        .replace(/\*/g, '');
}

function baseDomain(h) {
    const p = h.replace(/^www\./, '').split('.');
    const twoPart = /^(co|com|org|net|gov|ac|edu)\.[a-z]{2}$/i.test(p.slice(-2).join('.'));
    return p.slice(twoPart ? -3 : -2).join('.');
}

async function probe(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
        const res = await fetch(url, {
            redirect: 'follow',
            signal: ctrl.signal,
            headers: {
                'User-Agent': UA,
                Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });
        let body = '';
        try {
            const reader = res.body.getReader();
            let total = 0;
            while (total < 60000) {
                const { done, value } = await reader.read();
                if (done) break;
                body += Buffer.from(value).toString('utf8');
                total += value.length;
            }
            reader.cancel().catch(() => {});
        } catch { /* body read failure is not fatal */ }
        const headers = [...res.headers.entries()].map(([k, v]) => `${k}: ${v}`).join('\n');
        return { status: res.status, finalUrl: res.url, body, headers };
    } catch (e) {
        const code = e.cause?.code || e.name || 'ERR';
        return { error: code, message: e.cause?.message || e.message };
    } finally {
        clearTimeout(t);
    }
}

function classify(orig, r) {
    if (r.error) {
        if (/ENOTFOUND|EAI_NONAME|ERR_INVALID_URL/.test(r.error)) return { status: 'dead', reason: 'DNS: domain does not resolve' };
        if (/ECONNREFUSED/.test(r.error)) return { status: 'dead', reason: 'connection refused' };
        if (/CERT|SSL|TLS|ERR_TLS|UNABLE_TO_VERIFY|DEPTH_ZERO|SELF_SIGNED|ALTNAME/i.test(r.error + r.message)) return { status: 'dead', reason: `TLS: ${r.message}` };
        return { status: 'error', reason: `${r.error}: ${r.message}` };
    }
    const { status, finalUrl, body, headers } = r;
    let origHost, finalHost;
    try { origHost = new URL(orig).hostname; finalHost = new URL(finalUrl).hostname; } catch { /* ignore */ }

    if (PARKED_HOSTS.test(finalUrl) || (body && PARKED_BODY.test(body.slice(0, 30000)) && body.length < 40000)) {
        return { status: 'parked', reason: `parked / for sale (${finalHost})`, finalUrl };
    }
    if (status === 404 || status === 410) return { status: 'dead', reason: `HTTP ${status}`, finalUrl };
    if ([401, 403, 405, 406, 429, 451, 503, 520, 521, 522, 523, 525, 526].includes(status)) {
        const waf = WAF_HINT.test(headers) || WAF_HINT.test(body.slice(0, 5000));
        if ([521, 522, 523, 525, 526].includes(status)) return { status: 'dead', reason: `HTTP ${status} (origin down behind CDN)`, finalUrl };
        return { status: 'blocked', reason: `HTTP ${status}${waf ? ' (bot protection)' : ''}`, finalUrl };
    }
    if (status >= 500) return { status: 'error', reason: `HTTP ${status}`, finalUrl };
    if (status >= 200 && status < 400) {
        if (origHost && finalHost && baseDomain(origHost) !== baseDomain(finalHost)) {
            return { status: 'moved', reason: `redirects to ${finalHost}`, finalUrl };
        }
        // Redirected from a deep path to the site root often means the tool page is gone.
        try {
            const o = new URL(orig), f = new URL(finalUrl);
            if (o.pathname.length > 1 && (f.pathname === '/' || f.pathname === '') && o.pathname !== f.pathname) {
                return { status: 'moved', reason: 'deep link now redirects to homepage', finalUrl };
            }
        } catch { /* ignore */ }
        return { status: 'ok', reason: `HTTP ${status}`, finalUrl };
    }
    return { status: 'error', reason: `HTTP ${status}`, finalUrl };
}

async function check(tool) {
    if (/\.onion(\/|$)/.test(tool.url)) return { status: 'tor', reason: 'onion service (needs Tor)' };
    if (!/^https?:/.test(tool.url)) return { status: 'error', reason: 'not an http(s) url' };
    const url = sampleUrl(tool.url, tool.input);
    let r = await probe(url);
    let c = classify(url, r);
    if (c.status === 'error') { // one retry for flaky hosts
        r = await probe(url);
        c = classify(url, r);
    }
    return c;
}

async function main() {
    const data = loadRegistry(DATA);
    const tools = [...walkTools(data)];
    const unique = new Map();
    for (const t of tools) if (!unique.has(t.node.url)) unique.set(t.node.url, t.node);
    console.log(`Checking ${unique.size} unique URLs (${tools.length} entries), concurrency ${CONCURRENCY}...`);

    const results = new Map();
    const queue = [...unique.values()];
    let done = 0;
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
        while (queue.length) {
            const node = queue.shift();
            const res = await check(node);
            results.set(node.url, res);
            if (++done % 50 === 0) process.stdout.write(`  ${done}/${unique.size}\n`);
        }
    }));

    const today = new Date().toISOString().slice(0, 10);
    const report = tools.map(({ node, path: p }) => ({ name: node.name, category: p.join(' / '), url: node.url, ...results.get(node.url) }));
    const counts = report.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({ checked: today, counts, results: report }, null, 2));
    console.log('Summary:', counts);
    console.log(`Report written to ${OUT}`);

    if (APPLY) {
        for (const { node } of tools) {
            const r = results.get(node.url);
            node.status = r.status;
            node.checked = today;
            if (r.status === 'moved' && r.finalUrl) node.moved_to = r.finalUrl; else delete node.moved_to;
        }
        saveRegistry(DATA, data);
        console.log(`Applied status fields to ${DATA}`);
    }
}

main();
