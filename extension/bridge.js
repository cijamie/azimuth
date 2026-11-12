// Runs on pages that could host Azimuth. Only activates on an actual Azimuth page,
// then relays sweep requests between the page and the extension's background worker.
(() => {
    const meta = document.querySelector('meta[name="application-name"][content="azimuth"]');
    if (!meta) return;
    let port = null;
    const toPage = msg => window.postMessage({ __azimuth: 'ext', ...msg }, '*');
    const getPort = () => {
        if (port) return port;
        port = chrome.runtime.connect({ name: 'azimuth' });
        port.onMessage.addListener(toPage);
        port.onDisconnect.addListener(() => { port = null; });
        return port;
    };
    const hello = () => toPage({ type: 'hello', version: chrome.runtime.getManifest().version });
    window.addEventListener('message', e => {
        if (e.source !== window || !e.data || e.data.__azimuth !== 'page') return;
        const m = e.data;
        if (m.type === 'ping') hello();
        if (m.type === 'sweep' || m.type === 'sweep-cancel') getPort().postMessage(m);
    });
    hello();
})();
