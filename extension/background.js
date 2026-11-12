// Azimuth extension background worker: right-click menu, username sweep, Telegram reader and page capture.
import { loadSites, sweep } from './sweep-core.js';

const DEFAULT_BASE = 'https://jamies.dev/azimuth/';
const getBase = async () => (await chrome.storage.sync.get({ base: DEFAULT_BASE })).base || DEFAULT_BASE;

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({ id: 'az-selection', title: 'Investigate “%s” in Azimuth', contexts: ['selection'] });
        chrome.contextMenus.create({ id: 'az-link', title: 'Investigate this link in Azimuth', contexts: ['link'] });
        chrome.contextMenus.create({ id: 'az-image', title: 'Investigate this image in Azimuth', contexts: ['image'] });
        chrome.contextMenus.create({ id: 'az-page', title: 'Investigate this page’s site in Azimuth', contexts: ['page'] });
        chrome.contextMenus.create({ id: 'az-capture', title: 'Capture this page for Azimuth', contexts: ['page'] });
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'az-capture') { if (tab) await capture(tab, true); return; }
    const value = { 'az-selection': info.selectionText, 'az-link': info.linkUrl, 'az-image': info.srcUrl, 'az-page': tab?.url && new URL(tab.url).hostname }[info.menuItemId];
    if (!value) return;
    const base = await getBase();
    chrome.tabs.create({ url: `${base}#q=${encodeURIComponent(value.trim())}`, index: tab ? tab.index + 1 : undefined });
});

// ---------------- Page capture (IndexedDB in the extension) ----------------
let dbp;
const db = () => dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('azimuth-captures', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('captures', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
});
const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('captures', mode); const r = fn(t.objectStore('captures')); t.oncomplete = () => res(r?.result); t.onerror = () => rej(t.error); }); };
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async data => hex(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? new TextEncoder().encode(data) : data));

const recent = new Map();
async function capture(tab, manual = false) {
    if (!tab?.url || !/^https?:/.test(tab.url)) return;
    const base = await getBase();
    if (tab.url.startsWith(base) || /\/\/(127\.0\.0\.1|localhost)[:/]/.test(tab.url)) return; // don't capture Azimuth itself
    const key = `${tab.id}|${tab.url}`;
    if (!manual && Date.now() - (recent.get(key) || 0) < 15000) return;
    recent.set(key, Date.now());
    try {
        const shot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 80 });
        let html = '', title = tab.title || '';
        try {
            const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => ({ html: document.documentElement.outerHTML.slice(0, 3_000_000), title: document.title }) });
            html = r?.result?.html || ''; title = r?.result?.title || title;
        } catch { /* some pages block scripting */ }
        const bytes = Uint8Array.from(atob(shot.split(',')[1]), c => c.charCodeAt(0));
        const rec = { id: crypto.randomUUID(), url: tab.url, title, t: new Date().toISOString(), screenshot: shot, html, shotSha256: await sha256(bytes), htmlSha256: html ? await sha256(html) : '' };
        await tx('readwrite', s => s.put(rec));
        const n = await tx('readonly', s => s.count());
        chrome.action.setBadgeText({ text: String(n) });
        chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    } catch (e) { console.warn('capture failed', e); }
}

chrome.tabs.onUpdated.addListener(async (tabId, change, tab) => {
    if (change.status !== 'complete' || !tab.active) return;
    const { recording } = await chrome.storage.local.get({ recording: false });
    if (recording) capture(tab);
});

chrome.runtime.onMessage.addListener((m, _sender, reply) => {
    (async () => {
        if (m.type === 'popup-state') reply({ recording: (await chrome.storage.local.get({ recording: false })).recording, count: await tx('readonly', s => s.count()), base: await getBase() });
        if (m.type === 'popup-record') { await chrome.storage.local.set({ recording: m.on }); reply({ ok: true }); }
        if (m.type === 'popup-capture') { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); await capture(tab, true); reply({ ok: true }); }
    })();
    return true;
});

// ---------------- Telegram (public channel previews) ----------------
async function telegram(channel, before) {
    if (!/^[A-Za-z0-9_]{3,64}$/.test(channel || '')) throw new Error('Invalid channel name');
    const url = `https://t.me/s/${channel}${before ? `?before=${Number(before)}` : ''}`;
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) throw new Error(`Telegram returned HTTP ${res.status}`);
    return res.text();
}

// ---------------- Username sweep ----------------
async function sites() {
    const { wmn, wmnAt } = await chrome.storage.local.get(['wmn', 'wmnAt']);
    if (wmn && Date.now() - wmnAt < 864e5) return wmn;
    const fresh = await loadSites();
    await chrome.storage.local.set({ wmn: fresh, wmnAt: Date.now() });
    return fresh;
}

const running = new Map();

chrome.runtime.onConnect.addListener(port => {
    if (port.name !== 'azimuth') return;
    const answer = (m, fn) => fn().then(result => port.postMessage({ reqId: m.reqId, result }), e => port.postMessage({ reqId: m.reqId, error: e.message }));
    port.onMessage.addListener(async m => {
        if (m.type === 'telegram') return answer(m, () => telegram(m.channel, m.before));
        if (m.type === 'captures-list') return answer(m, async () => (await tx('readonly', s => s.getAll())).sort((a, b) => b.t.localeCompare(a.t)).map(({ id, url, title, t }) => ({ id, url, title, t })));
        if (m.type === 'captures-get') return answer(m, async () => (await tx('readonly', s => s.getAll())).filter(c => (m.ids || []).includes(c.id)));
        if (m.type === 'captures-clear') return answer(m, async () => { await tx('readwrite', s => s.clear()); chrome.action.setBadgeText({ text: '' }); return true; });
        if (m.type === 'sweep-cancel') { running.get(m.id)?.abort(); return; }
        if (m.type !== 'sweep' || typeof m.username !== 'string' || !m.username.trim() || m.username.length > 100) return;
        const ctrl = new AbortController();
        running.set(m.id, ctrl);
        const send = msg => { try { port.postMessage({ id: m.id, ...msg }); } catch { ctrl.abort(); } };
        try {
            const list = await sites();
            await sweep(m.username.trim(), list, {
                includeNsfw: !!m.includeNsfw,
                signal: ctrl.signal,
                onStart: total => send({ type: 'sweep-start', total }),
                onResult: result => send({ type: 'sweep-result', result }),
            });
            send({ type: 'sweep-done' });
        } catch (e) {
            send({ type: 'sweep-error', error: e.message });
        } finally {
            running.delete(m.id);
        }
    });
    port.onDisconnect.addListener(() => running.forEach(c => c.abort()));
});
