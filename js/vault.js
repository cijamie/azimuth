// Passphrase lock (encryption at rest) and the Secure storage layer.
// When a lock is set, everything sensitive (cases, screenshots, watchlist, history, personas) is stored
// AES-256-GCM encrypted with a key derived from the passphrase (PBKDF2-SHA256, 310k rounds).
// The key lives only in memory; reloading or "Lock now" requires the passphrase again.
'use strict';

const Vault = (() => {
    const META = 'azimuth_vault';
    let key = null;
    const meta = () => store.get(META, null);
    const enc = new TextEncoder(), dec = new TextDecoder();
    const b64 = buf => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
    const unb64 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0));

    async function derive(pass, salt) {
        const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    }
    async function encryptWith(k, text) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(text));
        return `enc:v1:${b64(iv)}:${b64(ct)}`;
    }
    async function decryptWith(k, s) {
        const [, , iv, ct] = s.split(':');
        return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, k, unb64(ct)));
    }

    const enabled = () => !!meta();
    const isEnc = s => typeof s === 'string' && s.startsWith('enc:v1:');

    async function unlock(pass) {
        const m = meta();
        const k = await derive(pass, unb64(m.salt));
        try { if (await decryptWith(k, m.check) !== 'azimuth-ok') throw 0; } catch { throw new Error('Wrong passphrase'); }
        key = k;
        return true;
    }

    // Re-encrypt (or decrypt) every protected value. oldKey/newKey null = plain.
    async function rewriteAll(oldKey, newKey) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (Secure.isProtected(k)) keys.push(k); }
        for (const k of keys) {
            const raw = localStorage.getItem(k);
            const plain = isEnc(raw) ? await decryptWith(oldKey, raw) : raw;
            localStorage.setItem(k, newKey ? await encryptWith(newKey, plain) : plain);
        }
        for (const id of await blobStore.keys()) {
            const raw = await blobStore.rawGet(id);
            if (typeof raw !== 'string') continue;
            const plain = isEnc(raw) ? await decryptWith(oldKey, raw) : raw;
            await blobStore.rawSet(id, newKey ? await encryptWith(newKey, plain) : plain);
        }
    }

    async function enable(pass) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const k = await derive(pass, salt);
        await rewriteAll(null, k);
        store.set(META, { salt: b64(salt), check: await encryptWith(k, 'azimuth-ok'), since: new Date().toISOString() });
        key = k;
    }

    async function change(oldPass, newPass) {
        await unlock(oldPass);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const k = await derive(newPass, salt);
        await rewriteAll(key, k);
        store.set(META, { salt: b64(salt), check: await encryptWith(k, 'azimuth-ok'), since: new Date().toISOString() });
        key = k;
    }

    async function disable(pass) {
        await unlock(pass);
        await rewriteAll(key, null);
        localStorage.removeItem(META);
        key = null;
    }

    // Shows the unlock screen if needed; resolves once data can be read.
    function ready() {
        if (!enabled() || key) return Promise.resolve();
        return new Promise(res => {
            const box = $('#unlock');
            box.classList.remove('hidden');
            setTimeout(() => $('#unlock-pass').focus(), 50);
            $('#unlock-form').onsubmit = async e => {
                e.preventDefault();
                $('#unlock-err').textContent = 'Unlocking…';
                try {
                    await unlock($('#unlock-pass').value);
                    $('#unlock-pass').value = '';
                    box.classList.add('hidden');
                    res();
                } catch { $('#unlock-err').textContent = 'Wrong passphrase.'; }
            };
        });
    }

    function lockNow() {
        key = null;
        location.reload();
    }

    // Auto-lock after 15 minutes without interaction.
    let idleTimer;
    function armIdleLock() {
        if (!enabled()) return;
        const reset = () => { clearTimeout(idleTimer); idleTimer = setTimeout(lockNow, 15 * 60e3); };
        ['pointerdown', 'keydown', 'wheel'].forEach(ev => document.addEventListener(ev, reset, { passive: true }));
        reset();
    }

    async function promptPass(label, confirmIt) {
        const p = prompt(label);
        if (!p) return null;
        if (p.length < 10) { toast('Use at least 10 characters.', 'err'); return null; }
        if (confirmIt && prompt('Type it again:') !== p) { toast('The two entries didn’t match.', 'err'); return null; }
        return p;
    }

    function renderSettings() {
        const on = enabled();
        $('#vault-status').innerHTML = on
            ? `<span class="ok">● Locked with a passphrase</span> since ${esc((meta().since || '').slice(0, 10))}. Cases, screenshots, personas, watchlist and history are encrypted in this browser. Auto-locks after 15 minutes idle.`
            : 'Not set. Anyone using this browser profile can open your cases.';
        $('#vault-enable').classList.toggle('hidden', on);
        $('#vault-change').classList.toggle('hidden', !on);
        $('#vault-disable').classList.toggle('hidden', !on);
        $('#lock-now').classList.toggle('hidden', !on);
    }

    function setup() {
        renderSettings();
        $('#lock-now').onclick = lockNow;
        $('#vault-enable').onclick = async () => {
            const p = await promptPass('Choose a passphrase (at least 10 characters). It cannot be recovered if you forget it:', true);
            if (!p) return;
            toast('Encrypting…');
            await enable(p);
            renderSettings();
            armIdleLock();
            toast('Locked with a passphrase. Your data is now encrypted.');
        };
        $('#vault-change').onclick = async () => {
            const old = prompt('Current passphrase:');
            if (!old) return;
            const p = await promptPass('New passphrase (at least 10 characters):', true);
            if (!p) return;
            try { await change(old, p); toast('Passphrase changed'); } catch { toast('Wrong current passphrase', 'err'); }
            renderSettings();
        };
        $('#vault-disable').onclick = async () => {
            const old = prompt('Enter your passphrase to remove the lock (data will be stored unencrypted):');
            if (!old) return;
            try { await disable(old); toast('Lock removed'); } catch { toast('Wrong passphrase', 'err'); }
            renderSettings();
        };
        armIdleLock();
    }

    return {
        ready, setup, lockNow, enabled, isEnc,
        get unlocked() { return !!key; },
        encrypt: s => (key ? encryptWith(key, s) : Promise.resolve(s)),
        decrypt: s => (isEnc(s) ? (key ? decryptWith(key, s) : Promise.reject(new Error('locked'))) : Promise.resolve(s)),
    };
})();

// Secure storage: a synchronous in-memory cache in front of (optionally encrypted) localStorage.
const Secure = (() => {
    const cache = new Map();
    const PROTECTED = /^azimuth_(case_|cases$|recent$|watch$|personas$)/;
    const writes = new Map();

    async function read(key) {
        const raw = localStorage.getItem(key);
        if (raw == null) return undefined;
        try { return JSON.parse(await Vault.decrypt(raw)); } catch { return undefined; }
    }

    return {
        isProtected: k => PROTECTED.test(k || ''),
        async preload(keys) { for (const k of keys) cache.set(k, await read(k)); },
        async load(key) { if (!cache.has(key)) cache.set(key, await read(key)); return cache.get(key); },
        get(key, fallback) { const v = cache.get(key); return v === undefined ? fallback : v; },
        set(key, value) {
            cache.set(key, value);
            // Serialise writes per key so an older encryption can't land after a newer one.
            const prev = writes.get(key) || Promise.resolve();
            const p = prev.then(async () => {
                try { localStorage.setItem(key, await Vault.encrypt(JSON.stringify(value))); }
                catch (e) { console.error(e); toast('Browser storage is full. Download a backup and remove old cases or screenshots.', 'err'); }
            });
            writes.set(key, p);
            return p;
        },
        remove(key) { cache.delete(key); localStorage.removeItem(key); },
        flush: () => Promise.all(writes.values()),
    };
})();
