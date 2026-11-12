// Selector detection, normalisation, refanging and IOC extraction.
'use strict';

const SELECTOR_TYPES = {
    username: { label: 'Username', icon: '@' },
    email: { label: 'Email', icon: '✉' },
    domain: { label: 'Domain', icon: '◍' },
    ip: { label: 'IP address', icon: '⌖' },
    url: { label: 'URL', icon: '⛓' },
    image: { label: 'Image URL', icon: '▧' },
    phone: { label: 'Phone', icon: '☏' },
    hash: { label: 'File hash', icon: '#' },
    crypto: { label: 'Crypto wallet', icon: '₿' },
    name: { label: 'Person / keyword', icon: '☺' },
};

const RE = {
    email: /^[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
    ipv4: /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/,
    ipv6: /^(([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:(:[0-9a-f]{1,4}){1,6}|:((:[0-9a-f]{1,4}){1,7}|:))$/i,
    domain: /^(?=.{4,253}$)((?!-)[a-z0-9-]{1,63}(?<!-)\.)+(xn--[a-z0-9-]{2,59}|[a-z]{2,63})$/i,
    hash: /^([a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64}|[a-f0-9]{128})$/i,
    btc: /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
    eth: /^0x[a-fA-F0-9]{40}$/,
    xmr: /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/,
    phone: /^\+?[\d\s().-]{7,22}$/,
    username: /^@?[a-z0-9._-]{2,40}$/i,
    image: /\.(jpe?g|png|gif|webp|bmp|tiff?|heic|avif)(\?.*)?$/i,
};

function refang(s) {
    return String(s)
        .replace(/h[xX]{2}p(s?)/g, 'http$1')
        .replace(/\[\s*(\.|dot)\s*\]|\(\s*(\.|dot)\s*\)|\{\s*(\.|dot)\s*\}/gi, '.')
        .replace(/\[\s*(@|at)\s*\]|\(\s*(@|at)\s*\)/gi, '@')
        .replace(/\[:\]/g, ':')
        .replace(/\[\/\]/g, '/');
}

function defang(s) {
    return String(s).replace(/^http/i, 'hxxp').replace(/\./g, '[.]').replace(/@/g, '[@]');
}

function hashKind(h) {
    return { 32: 'MD5', 40: 'SHA-1', 64: 'SHA-256', 128: 'SHA-512' }[h.length] || 'hash';
}

// Returns { type, value, meta } for a raw selector string.
function detectSelector(raw) {
    let v = refang(String(raw || '').trim()).replace(/^["']|["']$/g, '');
    if (!v) return null;

    if (/^https?:\/\//i.test(v) || /^www\./i.test(v)) {
        if (!/^https?:/i.test(v)) v = 'https://' + v;
        try {
            const u = new URL(v);
            if (RE.image.test(u.pathname)) return { type: 'image', value: u.href, meta: { host: u.hostname } };
            return { type: 'url', value: u.href, meta: { host: u.hostname } };
        } catch { /* fall through */ }
    }
    if (/^mailto:/i.test(v)) v = v.slice(7);
    if (RE.email.test(v)) {
        const [local, domain] = v.toLowerCase().split('@');
        return { type: 'email', value: v.toLowerCase(), meta: { local, domain } };
    }
    if (RE.ipv4.test(v)) return { type: 'ip', value: v, meta: { version: 4, private: isPrivateIPv4(v) } };
    if (v.includes(':') && RE.ipv6.test(v)) return { type: 'ip', value: v.toLowerCase(), meta: { version: 6 } };
    if (RE.hash.test(v)) return { type: 'hash', value: v.toLowerCase(), meta: { kind: hashKind(v) } };
    if (RE.eth.test(v)) return { type: 'crypto', value: v, meta: { chain: 'ethereum' } };
    if (RE.btc.test(v)) return { type: 'crypto', value: v, meta: { chain: 'bitcoin' } };
    if (RE.xmr.test(v)) return { type: 'crypto', value: v, meta: { chain: 'monero' } };
    if (RE.domain.test(v) && !/^\d+(\.\d+)+$/.test(v) && plausibleTld(v)) {
        const d = v.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
        return { type: 'domain', value: d, meta: {} };
    }
    const digits = v.replace(/\D/g, '');
    if (RE.phone.test(v) && digits.length >= 7 && digits.length <= 15 && /\d{3}/.test(v)) {
        return { type: 'phone', value: v, meta: { digits, e164: (v.trim().startsWith('+') ? '+' : '+') + digits } };
    }
    if (/\s/.test(v) && /[a-z]/i.test(v)) return { type: 'name', value: v, meta: {} };
    if (RE.username.test(v)) return { type: 'username', value: v.replace(/^@/, ''), meta: {} };
    return { type: 'name', value: v, meta: {} };
}

// Re-derive meta when the analyst overrides the detected type.
function coerceSelector(value, type) {
    const auto = detectSelector(value);
    if (auto && auto.type === type) return auto;
    const v = refang(String(value).trim());
    const meta = {};
    if (type === 'email' && v.includes('@')) Object.assign(meta, { local: v.split('@')[0], domain: v.split('@')[1] });
    if (type === 'phone') { meta.digits = v.replace(/\D/g, ''); meta.e164 = '+' + meta.digits; }
    if (type === 'url' || type === 'image') { try { meta.host = new URL(v).hostname; } catch { /* ignore */ } }
    if (type === 'hash') meta.kind = hashKind(v);
    if (type === 'crypto') meta.chain = RE.eth.test(v) ? 'ethereum' : 'bitcoin';
    return { type, value: type === 'username' ? v.replace(/^@/, '') : v, meta };
}

function isPrivateIPv4(ip) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || a === 0 || a >= 224;
}

// Common TLDs used to keep the domain extractor from matching file names.
const IOC_TLDS = new Set(('com net org edu gov mil int io co uk us ca au de fr nl ru cn jp in br it es se no fi dk pl ch at be cz ' +
    'info biz xyz top online site shop store app dev ai me tv cc ws su ly to gg sh so is ir kp ua by kz tr il sa ae eg za ng ke ' +
    'mx ar cl pe ve nz sg hk tw kr vn th my id ph pk bd lk np onion bit link click club live news world tech cloud icu buzz ' +
    'cyou rest monster quest sbs lol pw tk ml ga cf gq mobi pro name asia eu page blog art agency media studio design digital ' +
    'global group company email social network systems solutions services finance money bank law legal health care travel ' +
    'games game fun space today city zone works wiki team life love one center support tools security host website web ' +
    'church school academy college university museum gallery photo photos video tube music radio market shop shopping ' +
    'sale deals coupons auction trade capital fund ventures partners consulting expert cash loan credit insure ' +
    'download software codes chat forum community events ltd inc llc gmbh').split(' '));

// A bare "a.b" with a TLD we don't recognise (john.doe) is more likely a handle than a domain.
function plausibleTld(v) {
    const parts = v.toLowerCase().split('.');
    const tld = parts[parts.length - 1];
    return IOC_TLDS.has(tld) || tld.length === 2 || tld.startsWith('xn--') || parts.length > 2;
}

function extractIOCs(text) {
    const t = refang(text);
    const out = { url: new Set(), email: new Set(), ipv4: new Set(), ipv6: new Set(), domain: new Set(), md5: new Set(), sha1: new Set(), sha256: new Set(), btc: new Set(), eth: new Set(), cve: new Set() };
    const urlRe = /\bhttps?:\/\/[^\s"'<>()\]\[{}|\\^`]+/gi;
    for (const m of t.matchAll(urlRe)) out.url.add(m[0].replace(/[.,;:!?]+$/, ''));
    for (const m of t.matchAll(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi)) out.email.add(m[0].toLowerCase());
    for (const m of t.matchAll(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g)) out.ipv4.add(m[0]);
    for (const m of t.matchAll(/\b(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}\b/gi)) if (RE.ipv6.test(m[0])) out.ipv6.add(m[0].toLowerCase());
    for (const m of t.matchAll(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,24})\b/gi)) {
        if (IOC_TLDS.has(m[1].toLowerCase())) out.domain.add(m[0].toLowerCase());
    }
    for (const m of t.matchAll(/\b[a-f0-9]{64}\b/gi)) out.sha256.add(m[0].toLowerCase());
    for (const m of t.matchAll(/\b[a-f0-9]{40}\b/gi)) out.sha1.add(m[0].toLowerCase());
    for (const m of t.matchAll(/\b[a-f0-9]{32}\b/gi)) out.md5.add(m[0].toLowerCase());
    for (const m of t.matchAll(/\b(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g)) out.btc.add(m[0]);
    for (const m of t.matchAll(/\b0x[a-fA-F0-9]{40}\b/g)) out.eth.add(m[0]);
    for (const m of t.matchAll(/\bCVE-\d{4}-\d{4,7}\b/gi)) out.cve.add(m[0].toUpperCase());

    // Drop hash matches that are only substrings of a longer hash.
    for (const h of out.sha256) { for (const s of out.sha1) if (h.includes(s)) out.sha1.delete(s); for (const m of out.md5) if (h.includes(m)) out.md5.delete(m); }
    for (const h of out.sha1) for (const m of out.md5) if (h.includes(m)) out.md5.delete(m);
    const res = {};
    for (const [k, v] of Object.entries(out)) if (v.size) res[k] = [...v];
    return res;
}
