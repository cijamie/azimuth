// Shared helpers. Everything rendered with innerHTML goes through esc().
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(v) {
    return String(v ?? '').replace(/[&<>"'`]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]));
}

// Only allow http(s) links into href attributes.
function safeUrl(u) {
    try {
        const p = new URL(u, location.href);
        return /^https?:$/.test(p.protocol) ? p.href : '#';
    } catch { return '#'; }
}

function debounce(fn, ms = 200) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function toast(msg, kind = 'ok') {
    const el = $('#toast');
    el.textContent = msg;
    el.className = `toast ${kind}`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 2600);
}

// Copy synchronously inside the click (works on file://, http and before a new tab steals focus),
// falling back to the async Clipboard API.
function copyText(text, label = 'Copied') {
    const active = document.activeElement;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    if (active && active.focus) active.focus({ preventScroll: true });
    if (ok) { toast(label); return Promise.resolve(true); }
    const manual = () => {
        try { window.prompt('Your browser blocked copying. Copy it manually (Ctrl+C):', text); }
        catch { toast('Your browser blocked copying. Select the text and press Ctrl+C.', 'err'); }
        return false;
    };
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text).then(() => { toast(label); return true; }).catch(manual);
    }
    return Promise.resolve(manual());
}

// Open several URLs from one click. Browsers only allow pop-ups during the click itself,
// so everything is opened synchronously. Returns how many were blocked.
function openMany(urls) {
    let blocked = 0;
    for (const u of urls) {
        const w = window.open('about:blank', '_blank');
        if (!w) { blocked++; continue; }
        try { w.opener = null; w.location.replace(u); } catch { /* cross-origin after navigation */ }
    }
    return blocked;
}

function download(filename, content, type = 'application/octet-stream') {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const store = {
    get(key, fallback) {
        try {
            const v = localStorage.getItem(key);
            return v == null ? fallback : JSON.parse(v);
        } catch { return fallback; }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            toast('Browser storage is full. Export the case and remove some evidence.', 'err');
            console.error(e);
            return false;
        }
    },
};

// Tiny IndexedDB key/value store for screenshots (too big for localStorage).
const blobStore = (() => {
    let dbp;
    const db = () => dbp ||= new Promise((res, rej) => {
        const r = indexedDB.open('azimuth', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('blobs');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
    const tx = async (mode, fn) => {
        const d = await db();
        return new Promise((res, rej) => {
            const t = d.transaction('blobs', mode);
            const req = fn(t.objectStore('blobs'));
            t.oncomplete = () => res(req?.result);
            t.onerror = () => rej(t.error);
        });
    };
    const rawGet = k => tx('readonly', s => s.get(k));
    const rawSet = (k, v) => tx('readwrite', s => s.put(v, k));
    return {
        // Values are transparently encrypted when a passphrase lock is set (see vault.js).
        get: async k => { const v = await rawGet(k); return typeof v === 'string' && typeof Vault !== 'undefined' && Vault.isEnc(v) ? Vault.decrypt(v) : v; },
        set: async (k, v) => rawSet(k, typeof v === 'string' && typeof Vault !== 'undefined' && Vault.enabled() ? await Vault.encrypt(v) : v),
        del: k => tx('readwrite', s => s.delete(k)),
        clear: () => tx('readwrite', s => s.clear()),
        keys: () => tx('readonly', s => s.getAllKeys()),
        rawGet, rawSet,
    };
})();

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d) ? String(iso) : d.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

function toHex(buf) {
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function digest(algo, data) {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return toHex(await crypto.subtle.digest(algo, bytes));
}

// MD5 (SubtleCrypto does not provide it). Compact implementation operating on bytes.
function md5(input) {
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
    const K = new Uint32Array(64), S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32);
    const len = bytes.length, nBlocks = ((len + 8) >> 6) + 1;
    const w = new Uint32Array(nBlocks * 16);
    for (let i = 0; i < len; i++) w[i >> 2] |= bytes[i] << ((i % 4) * 8);
    w[len >> 2] |= 0x80 << ((len % 4) * 8);
    w[nBlocks * 16 - 2] = (len * 8) >>> 0;
    w[nBlocks * 16 - 1] = Math.floor(len / 0x20000000);
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (let blk = 0; blk < nBlocks; blk++) {
        let A = a0, B = b0, C = c0, D = d0;
        for (let i = 0; i < 64; i++) {
            let F, g;
            if (i < 16) { F = (B & C) | (~B & D); g = i; }
            else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
            else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
            else { F = C ^ (B | ~D); g = (7 * i) % 16; }
            F = (F + A + K[i] + w[blk * 16 + g]) >>> 0;
            A = D; D = C; C = B;
            const s = S[(i >> 4) * 4 + (i % 4)];
            B = (B + ((F << s) | (F >>> (32 - s)))) >>> 0;
        }
        a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    return [a0, b0, c0, d0].map(v => [0, 8, 16, 24].map(s => ((v >>> s) & 255).toString(16).padStart(2, '0')).join('')).join('');
}

function privacyOn() { return typeof Settings !== 'undefined' && Settings.get('privacy'); }

async function fetchJSON(url, opts = {}) {
    if (privacyOn() && !opts.allowInPrivacy) throw new Error('Privacy mode is on (Settings): no services are contacted');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), opts.timeout || 12000);
    try {
        const res = await fetch(url, { ...opts, signal: ctrl.signal, referrerPolicy: 'no-referrer' });
        if (res.status === 404) return { __notFound: true, status: 404 };
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(t);
    }
}

function fileToDataURL(file) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(file);
    });
}

function dataURLToBytes(dataUrl) {
    const b64 = dataUrl.split(',')[1] || '';
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}
