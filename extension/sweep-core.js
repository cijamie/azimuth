// Shared username-sweep engine (used by the extension's background worker and by scripts/sweep.mjs).
// Site rules come from the WhatsMyName project (CC BY-SA 4.0): https://github.com/WebBreacher/WhatsMyName

export const WMN_URL = 'https://raw.githubusercontent.com/WebBreacher/WhatsMyName/main/wmn-data.json';

export async function loadSites(fetchImpl = fetch) {
    const res = await fetchImpl(WMN_URL);
    if (!res.ok) throw new Error(`Could not download the WhatsMyName site list (HTTP ${res.status})`);
    const j = await res.json();
    return j.sites || [];
}

function fill(template, name) {
    return template.split('{account}').join(name);
}

async function checkSite(site, username, { fetchImpl, timeout, signal, userAgent }) {
    let name = username;
    if (site.strip_bad_char) name = [...name].filter(ch => !site.strip_bad_char.includes(ch)).join('');
    const url = fill(site.uri_check, encodeURIComponent(name));
    const pretty = fill(site.uri_pretty || site.uri_check, encodeURIComponent(name));
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    signal?.addEventListener('abort', onAbort);
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
        const headers = { ...(site.headers || {}) };
        if (userAgent) headers['User-Agent'] = userAgent;
        const res = await fetchImpl(url, {
            method: site.post_body ? 'POST' : 'GET',
            body: site.post_body ? fill(site.post_body, name) : undefined,
            headers,
            redirect: 'manual',
            credentials: 'omit',
            signal: ctrl.signal,
        });
        const status = res.type === 'opaqueredirect' ? 302 : res.status;
        const text = res.type === 'opaqueredirect' ? '' : await res.text();
        const codeOk = status === site.e_code;
        const stringOk = site.e_string ? text.includes(site.e_string) : true;
        const missing = (site.m_string && text.includes(site.m_string)) || (site.m_code && status === site.m_code && site.m_code !== site.e_code);
        return { site: site.name, cat: site.cat, url: pretty, status, found: codeOk && stringOk && !missing };
    } catch (e) {
        return { site: site.name, cat: site.cat, url: pretty, error: e.name === 'AbortError' ? 'timeout' : e.message, found: false };
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
    }
}

export async function sweep(username, sites, { fetchImpl = fetch, concurrency = 24, timeout = 12000, includeNsfw = false, signal, onStart, onResult, userAgent } = {}) {
    const list = sites.filter(s => s.valid !== false && (includeNsfw || !/nsfw/i.test(s.cat || '')));
    onStart?.(list.length);
    const queue = [...list];
    const results = [];
    await Promise.all(Array.from({ length: concurrency }, async () => {
        while (queue.length && !signal?.aborted) {
            const r = await checkSite(queue.shift(), username, { fetchImpl, timeout, signal, userAgent });
            results.push(r);
            onResult?.(r);
        }
    }));
    return results;
}
