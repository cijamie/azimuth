// JavaScript port of Maigret's username search engine (https://github.com/soxoj/maigret, MIT License).
// Used by the Azimuth extension's background worker and by scripts/maigret.mjs.
//
// Ported from maigret/sites.py, checking.py, errors.py, error_detection.py and permutator.py:
//   - site database with engine templates merged into sites (update_from_engine)
//   - ranking by popularity, tag / engine filters, disabled sites (ranked_sites_dict)
//   - per-site requests: url / urlProbe / urlSubpath, regexCheck, requestMethod, requestPayload, headers,
//     requestHeadOnly, encoding, no redirects for response_url checks (make_site_result)
//   - error pages: site-specific errors, common bot-protection signatures, 401/403/429/999/5xx (detect_error_page)
//   - verdicts for status_code / message / response_url checks (process_site_result)
//   - recursive search on identifiers found in claimed profiles, and username permutations (Permute)
// Not ported: Tor/I2P/DNS gateways, Cloudflare bypass / TLS impersonation, token "activation" for six sites,
// and the socid_extractor library (replaced by a smaller built-in profile extractor below).

export const MAIGRET_DATA_URL = 'https://raw.githubusercontent.com/soxoj/maigret/main/maigret/resources/data.json';
export const SUPPORTED_IDS = ['username', 'yandex_public_id', 'gaia_id', 'vk_id', 'ok_id', 'wikimapia_uid', 'steam_id', 'uidme_uguid', 'yelp_userid', 'orcid', 'qq_id', 'bilibili_id'];
export const STATUS = { CLAIMED: 'claimed', AVAILABLE: 'available', UNKNOWN: 'unknown', ILLEGAL: 'illegal' };

const UNSUPPORTED_PROTOCOLS = new Set(['tor', 'i2p', 'dns']);
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
];

// ---------------- database ----------------
export function prepareDb(json, commonErrors = {}) {
    const engines = json.engines || {};
    const sites = [];
    for (const [name, raw] of Object.entries(json.sites || {})) {
        const s = { name, ...JSON.parse(JSON.stringify(raw)) };
        const stated = new Set(Object.keys(raw));
        if (!s.checkType && !raw.engine) s.checkType = 'status_code';
        const eng = raw.engine && engines[raw.engine];
        if (eng) {
            for (const [k, v] of Object.entries(eng.site || {})) {
                if (v && typeof v === 'object' && !Array.isArray(v)) s[k] = { ...(s[k] || {}), ...v };
                else if (Array.isArray(v)) s[k] = [...(s[k] || []), ...v];
                else if (!(stated.has(k) && s[k] !== v)) s[k] = v;
            }
        }
        s.checkType ||= 'status_code';
        s.rank = s.alexaRank && s.alexaRank > 0 ? s.alexaRank : Infinity;
        s.tags ||= [];
        s.urlSubpath ||= '';
        s.presenseStrs ||= [];
        s.absenceStrs ||= [];
        s.headers ||= {};
        s.errors ||= {};
        s.type ||= 'username';
        sites.push(s);
    }
    return { sites, tags: json.tags || [], engines: Object.keys(engines), commonErrors };
}

export function rankedSites(db, { top = 500, tags = [], excludedTags = [], idType = 'username', includeDisabled = false } = {}) {
    const want = tags.map(t => t.toLowerCase()), not = excludedTags.map(t => t.toLowerCase());
    const disabledOk = includeDisabled || want.includes('disabled');
    const matches = (s, list) => (s.engine && list.includes(s.engine.toLowerCase())) || s.tags.some(t => list.includes(String(t).toLowerCase())) || (s.protocol && list.includes(s.protocol));
    const list = db.sites.filter(s =>
        (s.type === idType) &&
        (disabledOk || !s.disabled) &&
        (!want.length || matches(s, want)) &&
        (!not.length || !matches(s, not)) &&
        !UNSUPPORTED_PROTOCOLS.has(s.protocol));
    list.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
    return list.slice(0, top === 0 || top === Infinity ? list.length : top);
}

// ---------------- requests ----------------
const quote = u => encodeURIComponent(u).replace(/%2F/g, '/');
const fill = (tpl, site, username) => tpl.split('{urlMain}').join(site.urlMain || '').split('{urlSubpath}').join(site.urlSubpath || '').split('{username}').join(quote(username));
const collapseSlashes = url => url.replace(/(?<!:)\/+/g, '/');

export function buildRequest(site, username) {
    const url = collapseSlashes(fill(site.url || '', site, username));
    if (site.regexCheck) {
        try { if (!new RegExp(site.regexCheck).test(username)) return { url, illegal: `username format not accepted (${site.regexCheck})` }; }
        catch { /* Python-only regex syntax: let the request decide */ }
    }
    const probe = site.urlProbe ? fill(site.urlProbe, site, username) : url;
    const method = site.requestMethod ? site.requestMethod.toUpperCase() : site.checkType === 'status_code' && site.requestHeadOnly ? 'HEAD' : 'GET';
    let body;
    const headers = { ...site.headers };
    if (site.requestPayload && method === 'POST') {
        const payload = {};
        for (const [k, v] of Object.entries(site.requestPayload)) payload[k] = typeof v === 'string' ? v.split('{username}').join(username) : v;
        if (headers['Content-Type'] === 'application/x-www-form-urlencoded') body = new URLSearchParams(payload).toString();
        else { body = JSON.stringify(payload); headers['Content-Type'] ||= 'application/json'; }
    }
    return { url, probe, method, headers, body, redirect: site.checkType === 'response_url' ? 'manual' : 'follow' };
}

export function detectError(html, status, site, commonErrors) {
    if (html) {
        for (const [flag, msg] of Object.entries(site.errors || {})) if (html.includes(flag)) return ['Site-specific', msg];
        for (const [flag, err] of Object.entries(commonErrors || {})) if (html.includes(flag)) return err;
    }
    if (status === 403 && !site.ignore403) return ['Access denied', '403'];
    if (status === 401) return ['Login required', '401'];
    if (status === 429) return ['Rate limited', '429'];
    if (status === 999) return ['Access denied', '999'];
    if (status >= 500) return ['Server', String(status)];
    return null;
}

export function verdict(site, username, html, status, error) {
    if (error) return STATUS.UNKNOWN;
    let presence = false;
    if (html) {
        if (!site.presenseStrs.length) {
            presence = true;
            if ([...username].some(ch => ch.charCodeAt(0) > 127) && !html.includes(username)) presence = false;
        } else presence = site.presenseStrs.some(p => html.includes(p));
    }
    if (site.checkType === 'message') {
        const absence = site.absenceStrs.some(a => html.includes(a));
        return !absence && presence ? STATUS.CLAIMED : STATUS.AVAILABLE;
    }
    if (site.checkType === 'status_code') return status >= 200 && status < 300 ? STATUS.CLAIMED : STATUS.AVAILABLE;
    if (site.checkType === 'response_url') return status >= 200 && status < 300 && presence ? STATUS.CLAIMED : STATUS.AVAILABLE;
    return STATUS.UNKNOWN;
}

// ---------------- profile extraction (replacement for socid_extractor) ----------------
const PROFILE_PATTERNS = [
    [/^(?:www\.)?(?:twitter|x)\.com\/(?!home|search|intent|share|i\/|hashtag)@?([A-Za-z0-9_]{2,15})\/?$/i, 'twitter'],
    [/^(?:www\.)?instagram\.com\/(?!p\/|reel|explore|accounts)([A-Za-z0-9_.]{2,30})\/?$/i, 'instagram'],
    [/^(?:www\.)?github\.com\/(?!orgs|topics|sponsors|features|about|login)([A-Za-z0-9-]{1,39})\/?$/i, 'github'],
    [/^(?:www\.)?gitlab\.com\/([A-Za-z0-9_.-]{2,40})\/?$/i, 'gitlab'],
    [/^(?:www\.)?t\.me\/(?!s\/|joinchat|\+)([A-Za-z0-9_]{5,32})\/?$/i, 'telegram'],
    [/^(?:www\.)?tiktok\.com\/@([A-Za-z0-9_.]{2,24})\/?$/i, 'tiktok'],
    [/^(?:www\.)?youtube\.com\/@([A-Za-z0-9_.-]{3,30})\/?$/i, 'youtube'],
    [/^(?:www\.)?reddit\.com\/(?:u|user)\/([A-Za-z0-9_-]{3,20})\/?$/i, 'reddit'],
    [/^(?:www\.)?twitch\.tv\/([A-Za-z0-9_]{4,25})\/?$/i, 'twitch'],
    [/^(?:www\.)?medium\.com\/@([A-Za-z0-9_.]{2,40})\/?$/i, 'medium'],
    [/^(?:www\.)?facebook\.com\/(?!pages|groups|sharer|profile\.php|events|watch)([A-Za-z0-9.]{5,50})\/?$/i, 'facebook'],
    [/^(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9_-]{3,100})\/?$/i, 'linkedin'],
    [/^(?:www\.)?pinterest\.[a-z.]+\/([A-Za-z0-9_]{3,30})\/?$/i, 'pinterest'],
    [/^(?:www\.)?keybase\.io\/([A-Za-z0-9_]{2,16})\/?$/i, 'keybase'],
    [/^(?:www\.)?steamcommunity\.com\/id\/([A-Za-z0-9_-]{2,32})\/?$/i, 'steam'],
    [/^bsky\.app\/profile\/([A-Za-z0-9.-]{3,253})\/?$/i, 'bluesky'],
    [/^(?:www\.)?(?:vk\.com)\/(?!id\d)([A-Za-z0-9_.]{3,32})\/?$/i, 'vk'],
    [/^(?:www\.)?soundcloud\.com\/([A-Za-z0-9_-]{3,25})\/?$/i, 'soundcloud'],
    [/^(?:www\.)?patreon\.com\/([A-Za-z0-9_]{3,64})\/?$/i, 'patreon'],
    [/^(?:www\.)?linktr\.ee\/([A-Za-z0-9_.]{3,30})\/?$/i, 'linktree'],
];

export function plausibleUsername(s) {
    if (typeof s !== 'string') return false;
    const v = s.trim();
    return !!v && !v.includes('://') && !/^(www\.|\/\/)/.test(v) && !v.includes('/') && !/\s/.test(v) && !(v.includes('@') && v.includes('.'));
}

export function extractIds(html, pageUrl) {
    if (!html) return null;
    const out = { links: new Set(), usernames: new Map(), emails: new Set() };
    const host = (() => { try { return new URL(pageUrl).hostname.replace(/^www\./, ''); } catch { return ''; } })();
    // "strong" = the profile itself declares the link (rel="me", JSON-LD sameAs); plain <a> links may be site footers.
    const consider = (href, strong) => {
        if (!href || !/^https?:\/\//i.test(href)) return;
        let u;
        try { u = new URL(href.replace(/&amp;/g, '&')); } catch { return; }
        const path = (u.hostname.replace(/^www\./, '') + u.pathname).replace(/\/+$/, '');
        for (const [re, platform] of PROFILE_PATTERNS) {
            const m = path.match(re);
            if (m && !u.hostname.replace(/^www\./, '').endsWith(host || '\u0000')) {
                out.links.add(`https://${path}`);
                const prev = out.usernames.get(m[1]);
                out.usernames.set(m[1], { platform, strong: strong || prev?.strong || false });
                return;
            }
        }
    };
    for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) consider(m[1], /\brel=["'][^"']*\bme\b/i.test(m[0]));
    for (const m of html.matchAll(/"sameAs"\s*:\s*(\[[^\]]*\]|"[^"]+")/g)) { try { [].concat(JSON.parse(m[1])).forEach(h => consider(h, true)); } catch { /* ignore */ } }
    for (const m of html.matchAll(/<link\b[^>]*rel=["']me["'][^>]*href=["']([^"']+)["']/gi)) consider(m[1], true);
    for (const m of html.matchAll(/mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)) out.emails.add(m[1].toLowerCase());
    const meta = name => html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']{1,300})["']`, 'i'))?.[1];
    const fullname = html.match(/"@type"\s*:\s*"Person"[\s\S]{0,400}?"name"\s*:\s*"([^"]{2,80})"/)?.[1]
        || (/^profile$/i.test(meta('og:type') || '') ? meta('og:title') : undefined);
    const data = {};
    if (fullname) data.fullname = fullname;
    const bio = meta('og:description') || meta('description');
    if (bio) data.bio = bio.slice(0, 300);
    const image = meta('og:image');
    if (image) data.image = image;
    if (out.links.size) data.links = [...out.links].slice(0, 30);
    if (out.emails.size) data.emails = [...out.emails].slice(0, 10);
    const usernames = {};
    for (const [u, p] of out.usernames) if (plausibleUsername(u)) usernames[u] = p;
    data.siteBrand = host.split('.').slice(-2, -1)[0] || '';
    if (Object.keys(usernames).length) data.usernames = usernames;
    return Object.keys(data).length > 1 ? data : null;
}

// Character set from the Content-Type header or the page's <meta charset>, as aiohttp's response.charset does.
function decodeBody(buf, contentType, forced) {
    let cs = forced || (contentType || '').match(/charset=["']?([\w-]+)/i)?.[1];
    if (!cs) {
        const head = new TextDecoder('latin1').decode(buf.slice(0, 4096));
        cs = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
    }
    try { return new TextDecoder(cs || 'utf-8').decode(buf); } catch { return new TextDecoder().decode(buf); }
}

// ---------------- checking ----------------
export async function checkSite(site, username, { fetchImpl = fetch, timeout = 15000, signal, setUserAgent = false, commonErrors = {}, parse = true } = {}) {
    const base = { site: site.name, username, tags: site.tags, rank: site.rank === Infinity ? null : site.rank, urlMain: site.urlMain || '', similar: !!site.similarSearch };
    const req = buildRequest(site, username);
    if (req.illegal) return { ...base, url: req.url, status: STATUS.ILLEGAL, error: req.illegal };
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    signal?.addEventListener('abort', onAbort);
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const t0 = Date.now();
    try {
        const headers = { ...req.headers };
        if (setUserAgent && !Object.keys(headers).some(h => h.toLowerCase() === 'user-agent')) headers['User-Agent'] = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        const res = await fetchImpl(req.probe, { method: req.method, headers, body: req.body, redirect: req.redirect, credentials: 'omit', signal: ctrl.signal });
        const status = res.type === 'opaqueredirect' ? 302 : res.status;
        let html = '';
        if (res.type !== 'opaqueredirect' && req.method !== 'HEAD') {
            html = decodeBody(await res.arrayBuffer(), res.headers.get('content-type'), site.encoding);
        }
        const err = detectError(html, status, site, commonErrors);
        const st = verdict(site, username, html, status, err);
        const result = { ...base, url: req.url, probe: req.probe !== req.url ? req.probe : undefined, status: st, httpStatus: status, ms: Date.now() - t0 };
        if (err) result.error = `${err[0]}${err[1] ? `: ${err[1]}` : ''}`;
        if (st === STATUS.CLAIMED && parse) { const ids = extractIds(html, req.url); if (ids) result.ids = ids; }
        return result;
    } catch (e) {
        const msg = e.name === 'AbortError' ? (signal?.aborted ? 'Cancelled' : 'Request timeout') : /certificate|SSL|TLS/i.test(e.message) ? 'SSL error' : /ENOTFOUND|getaddrinfo|DNS/i.test(e.cause?.code || e.message) ? 'Connecting failure (DNS)' : 'Connecting failure';
        return { ...base, url: req.url, status: STATUS.UNKNOWN, error: msg, ms: Date.now() - t0 };
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
    }
}

// Searches one or more usernames; follows usernames found in claimed profiles (recursive search).
export async function search(usernames, db, opts = {}) {
    const { top = 500, tags = [], excludedTags = [], idType = 'username', includeDisabled = false, recursive = true, maxRecursive = 8,
        concurrency = 40, timeout = 15000, signal, onStart, onResult, onUsername, fetchImpl = fetch, setUserAgent = false } = opts;
    const sites = rankedSites(db, { top, tags, excludedTags, idType, includeDisabled });
    const queue = usernames.map(u => ({ username: u, idType, via: null }));
    const seen = new Set(usernames.map(u => u.toLowerCase()));
    const summary = { sites: sites.length, usernames: [], claimed: 0, available: 0, unknown: 0, illegal: 0, errors: {} };
    let added = 0;
    onStart?.({ sites: sites.length, total: sites.length * queue.length });
    while (queue.length && !signal?.aborted) {
        const item = queue.shift();
        summary.usernames.push(item);
        onUsername?.(item);
        const list = item.idType === idType ? sites : rankedSites(db, { top, tags, excludedTags, idType: item.idType, includeDisabled });
        const work = [...list];
        const found = [];
        await Promise.all(Array.from({ length: concurrency }, async () => {
            while (work.length && !signal?.aborted) {
                const site = work.shift();
                const r = await checkSite(site, item.username, { fetchImpl, timeout, signal, setUserAgent, commonErrors: db.commonErrors });
                r.via = item.via;
                summary[r.status]++;
                if (r.status === STATUS.UNKNOWN && r.error) { const k = r.error.split(':')[0]; summary.errors[k] = (summary.errors[k] || 0) + 1; }
                if (r.status === STATUS.CLAIMED) found.push(r);
                onResult?.(r);
            }
        }));
        if (!recursive) continue;
        // Follow a handle when a profile declares it (rel="me" / sameAs), or when it is linked from two or more
        // different sites' profiles. A handle linked once, or matching the site's own brand, is usually a footer link.
        const candidates = new Map();
        for (const r of found) for (const [u, info] of Object.entries(r.ids?.usernames || {})) {
            const brand = (r.ids.siteBrand || '').toLowerCase();
            if (brand && (u.toLowerCase().includes(brand) || brand.includes(u.toLowerCase()))) continue;
            if (r.site.toLowerCase().replace(/[^a-z0-9]/g, '').includes(u.toLowerCase().replace(/[^a-z0-9]/g, ''))) continue;
            const c = candidates.get(u.toLowerCase()) || { u, platform: info.platform, strong: false, sites: new Set() };
            c.strong ||= info.strong;
            c.sites.add(r.site);
            candidates.set(u.toLowerCase(), c);
        }
        // Weak candidates must come from two different domains and must not appear on the same site's page for a
        // username that doesn't exist (Maigret's usernameUnclaimed): links present there are site boilerplate.
        const bySite = new Map(found.map(r => [r.site, r]));
        const domainOf = name => { try { return new URL(bySite.get(name).url).hostname.split('.').slice(-2).join('.'); } catch { return name; } };
        const baselineCache = new Map();
        const baseline = async siteName => {
            if (baselineCache.has(siteName)) return baselineCache.get(siteName);
            const site = db.sites.find(s => s.name === siteName);
            let handles = new Set();
            if (site?.usernameUnclaimed) {
                try {
                    const req = buildRequest(site, site.usernameUnclaimed);
                    const res = await fetchImpl(req.url, { credentials: 'omit', signal });
                    const ids = extractIds(decodeBody(await res.arrayBuffer(), res.headers.get('content-type'), site.encoding), req.url);
                    handles = new Set(Object.keys(ids?.usernames || {}).map(x => x.toLowerCase()));
                } catch { /* treat as no baseline */ }
            }
            baselineCache.set(siteName, handles);
            return handles;
        };
        for (const c of candidates.values()) {
            if (!c.strong) {
                const domains = new Set([...c.sites].map(domainOf));
                if (domains.size < 2) continue;
                let boilerplate = false;
                for (const s of c.sites) if ((await baseline(s)).has(c.u.toLowerCase())) { boilerplate = true; break; }
                if (boilerplate) continue;
            }
            if (added >= maxRecursive || seen.has(c.u.toLowerCase())) continue;
            seen.add(c.u.toLowerCase());
            queue.push({ username: c.u, idType: 'username', via: `${[...c.sites].slice(0, 3).join(', ')} (${c.platform} link)` });
            added++;
            onStart?.({ sites: sites.length, total: sites.length * (summary.usernames.length + queue.length), added: c.u });
        }
    }
    return summary;
}

// Port of maigret/permutator.py (by balestek, MIT): combine name parts into likely usernames.
export function permute(elements, method = 'strict') {
    const parts = elements.filter(Boolean);
    const out = new Set();
    const perms = (arr, k) => {
        if (k === 1) return arr.map(x => [x]);
        const res = [];
        arr.forEach((x, i) => perms(arr.filter((_, j) => j !== i), k - 1).forEach(p => res.push([x, ...p])));
        return res;
    };
    for (let i = 1; i <= parts.length; i++) {
        for (const subset of perms(parts, i)) {
            if (i === 1) {
                if (method === 'all') { out.add(subset[0]); out.add('_' + subset[0]); out.add(subset[0] + '_'); }
            } else {
                for (const sep of ['', '_', '-', '.']) {
                    const p = subset.join(sep);
                    out.add(p);
                    if (sep === '') { out.add('_' + p); out.add(p + '_'); }
                }
            }
        }
    }
    return [...out];
}
