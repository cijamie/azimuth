// Azimuth extension background worker: right-click menu + username sweep.
import { loadSites, sweep } from './sweep-core.js';

const DEFAULT_BASE = 'https://jamies.dev/azimuth/';
const getBase = async () => (await chrome.storage.sync.get({ base: DEFAULT_BASE })).base || DEFAULT_BASE;

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({ id: 'az-selection', title: 'Investigate “%s” in Azimuth', contexts: ['selection'] });
        chrome.contextMenus.create({ id: 'az-link', title: 'Investigate this link in Azimuth', contexts: ['link'] });
        chrome.contextMenus.create({ id: 'az-image', title: 'Investigate this image in Azimuth', contexts: ['image'] });
        chrome.contextMenus.create({ id: 'az-page', title: 'Investigate this page’s site in Azimuth', contexts: ['page'] });
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const value = { 'az-selection': info.selectionText, 'az-link': info.linkUrl, 'az-image': info.srcUrl, 'az-page': tab?.url && new URL(tab.url).hostname }[info.menuItemId];
    if (!value) return;
    const base = await getBase();
    chrome.tabs.create({ url: `${base}#q=${encodeURIComponent(value.trim())}`, index: tab ? tab.index + 1 : undefined });
});

chrome.action.onClicked.addListener(async () => chrome.tabs.create({ url: await getBase() }));

// Site list cached for a day.
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
    port.onMessage.addListener(async m => {
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
