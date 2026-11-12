// Username search across 9,000+ sites using Azimuth's port of Maigret (or the smaller WhatsMyName list).
// A web page can't read other sites' responses, so the checks run inside the Azimuth browser extension;
// this file is the page side: options, live results, reports and saving to the case.
'use strict';

window.AzimuthExtension = { ready: false, version: null };

const Sweep = (() => {
    let current = null;   // { id, username, source, total, done, results: [], usernames: [], finished }
    let meta = null;      // Maigret database info from the extension
    let mount = '#sweep-panel';   // where the panel is shown: the Investigate tab or the Maigret section
    let lastUsername = '';
    let presetPermute = '';

    // Show the panel in another container (only one is live at a time, so element ids stay unique).
    function setMount(sel) {
        if (sel !== mount && $(mount)) $(mount).innerHTML = '';
        mount = sel;
    }
    const prefs = () => ({ source: 'maigret', top: '500', tags: [], includeDisabled: false, recursive: true, nsfw: false, ...store.get('azimuth_sweep_prefs', {}) });

    window.addEventListener('message', e => {
        if (e.source !== window || !e.data || e.data.__azimuth !== 'ext') return;
        const m = e.data;
        if (m.type === 'hello') {
            const was = window.AzimuthExtension.ready;
            window.AzimuthExtension = { ready: true, version: m.version };
            document.dispatchEvent(new CustomEvent('azimuth:extension'));
            if (!was && lastUsername && $(mount)?.offsetParent) render(lastUsername);
        }
        if (!current || m.id !== current.id) return;
        if (m.type === 'sweep-start') { current.total = m.total; if (m.sites) current.sites = m.sites; if (m.added) current.recursions.push(m.added); throttled(); }
        if (m.type === 'sweep-username') { current.usernames.push({ username: m.username, via: m.via }); throttled(); }
        if (m.type === 'sweep-result') { current.done++; current.results.push(m.result); throttled(); }
        if (m.type === 'sweep-done') {
            current.finished = true;
            render();
            const found = current.results.filter(r => r.found);
            CaseFile.log('sweep', `Username search (${current.source === 'wmn' ? 'WhatsMyName' : 'Maigret'}) for ${current.username}: found on ${found.length} of ${current.sites || current.total} sites${current.usernames.length > 1 ? `, plus ${current.usernames.length - 1} linked username(s)` : ''}`);
        }
        if (m.type === 'sweep-error') { current.error = m.error; current.finished = true; render(); }
    });
    window.postMessage({ __azimuth: 'page', type: 'ping' }, '*');

    const throttled = debounce(() => render(), 150);

    async function loadMeta() {
        if (meta || !window.AzimuthExtension.ready) return meta;
        try { meta = await ExtBridge.request('maigret-meta', {}, 20000); } catch { meta = null; }
        return meta;
    }

    function start(username) {
        const p = readForm();
        store.set('azimuth_sweep_prefs', p);
        current = { id: uid(), username, source: p.source, total: 0, sites: 0, done: 0, results: [], usernames: [], recursions: [], finished: false };
        const query = p.permute && p.permuteText.trim() ? p.permuteText.trim() : username;
        window.postMessage({ __azimuth: 'page', type: 'sweep', id: current.id, username: query, source: p.source, includeNsfw: p.nsfw, options: { top: p.top, tags: p.tags, includeDisabled: p.includeDisabled, recursive: p.recursive, permute: !!(p.permute && p.permuteText.trim()) } }, '*');
        render(username);
    }

    function stop() {
        if (current) { window.postMessage({ __azimuth: 'page', type: 'sweep-cancel', id: current.id }, '*'); current.finished = true; }
        render();
    }

    function readForm() {
        const p = prefs();
        const get = id => $(id);
        if (!get('#sw-source')) return p;
        return {
            source: get('#sw-source').value, top: get('#sw-top').value, tags: [...get('#sw-tags').selectedOptions].map(o => o.value),
            includeDisabled: get('#sw-disabled').checked, recursive: get('#sw-recursive').checked, nsfw: get('#sw-nsfw').checked,
            permute: get('#sw-permute').checked, permuteText: get('#sw-permute-text').value,
        };
    }

    async function renderForm(box, username) {
        const p = prefs();
        await loadMeta();
        const tags = meta?.tags || [];
        box.innerHTML = `
            <p>Search for <b>${esc(username)}</b> across ${meta ? `<b>${meta.enabled.toLocaleString()}</b> sites from Maigret’s database` : 'Maigret’s 9,000+ sites'}. Requests go from your browser to each site.</p>
            <div class="grid-3">
                <label class="field"><span>Site list</span><select id="sw-source" class="input"><option value="maigret">Maigret (${meta ? meta.enabled.toLocaleString() : '9,000+'} sites)</option><option value="wmn">WhatsMyName (~600 sites)</option></select></label>
                <label class="field"><span>How many sites</span><select id="sw-top" class="input"><option value="100">Top 100 (fast)</option><option value="500">Top 500 (Maigret default)</option><option value="1500">Top 1,500</option><option value="3000">Top 3,000</option><option value="all">All sites (slow, ~10 min)</option></select></label>
                <label class="field"><span>Only these categories (optional)</span><select id="sw-tags" class="input" multiple size="4">${tags.map(([t, n]) => `<option value="${esc(t)}">${esc(t)} (${n})</option>`).join('')}</select></label>
            </div>
            <div class="btn-row" style="gap:1rem">
                <label class="toggle"><input type="checkbox" id="sw-recursive"> follow usernames found in profiles</label>
                <label class="toggle"><input type="checkbox" id="sw-disabled"> include sites Maigret marks unreliable</label>
                <label class="toggle"><input type="checkbox" id="sw-nsfw"> include adult &amp; dating sites</label>
            </div>
            <div class="btn-row" style="gap:.5rem;align-items:center">
                <label class="toggle"><input type="checkbox" id="sw-permute"> search permutations of:</label>
                <input id="sw-permute-text" class="input input-sm" style="flex:1" placeholder="name parts, e.g. john doe 1990 (john.doe, doe_john, johndoe1990…)">
            </div>
            <div class="btn-row"><button class="btn primary" id="sweep-start">Start search</button><span class="muted small">${meta?.updated ? `Site database refreshed ${esc(new Date(meta.updated).toISOString().slice(0, 10))}` : 'Uses the bundled site database until it can refresh from Maigret’s GitHub.'}</span></div>`;
        $('#sw-source').value = p.source; $('#sw-top').value = p.top;
        [...$('#sw-tags').options].forEach(o => { o.selected = p.tags.includes(o.value); });
        $('#sw-recursive').checked = p.recursive; $('#sw-disabled').checked = p.includeDisabled; $('#sw-nsfw').checked = p.nsfw;
        if (presetPermute) { $('#sw-permute').checked = true; $('#sw-permute-text').value = presetPermute; }
        $('#sweep-start').onclick = () => start(username);
    }

    function render(username = lastUsername || state?.selector?.value) {
        const box = $(mount);
        if (!box) return;
        lastUsername = username || '';
        if (!window.AzimuthExtension.ready) {
            box.innerHTML = `
                <p>Searches <b>${esc(username || 'a username')}</b> across <b>9,000+ sites</b> using Azimuth’s built-in port of <a href="https://github.com/soxoj/maigret" target="_blank" rel="noopener noreferrer">Maigret</a>. Web pages aren’t allowed to read other websites, so the checks run in the free Azimuth browser extension.</p>
                <h4 style="margin-top:.8rem">Install the extension (one time, about a minute)</h4>
                <ol class="setup-steps">
                    <li><a class="btn primary" href="azimuth-extension.zip" download>⬇ Download the extension</a> and unzip it (right-click → Extract All).</li>
                    <li>In Chrome, Edge or Brave, open <code>chrome://extensions</code> <button class="btn small" data-copy="chrome://extensions">⧉ copy</button></li>
                    <li>Turn on <b>Developer mode</b> (top right).</li>
                    <li>Click <b>Load unpacked</b> and choose the unzipped <code>azimuth-extension</code> folder.</li>
                    <li>Come back here and <a href="#" id="sw-reload">reload this page</a>. This panel turns into the search form.</li>
                </ol>
                <h4 style="margin-top:.8rem">Or use the command line (Node.js 18+)</h4>
                <pre class="cmd">node scripts/maigret.mjs ${esc(username || 'username')} --json result.json</pre>
                <p class="muted small">Run it in the downloaded Azimuth folder from <a href="https://github.com/cijamie/azimuth" target="_blank" rel="noopener noreferrer">GitHub</a>. Add <code>-a</code> for all sites, <code>--tags social,coding</code> to filter, <code>--permute</code> for name parts. Import <code>result.json</code> under Case file → Import results from other tools.</p>`;
            $('#sw-reload')?.addEventListener('click', e => { e.preventDefault(); location.reload(); });
            return;
        }
        if (!username) { box.innerHTML = '<p class="muted small">Enter a username above.</p>'; return; }
        if (!current || current.username !== username) { renderForm(box, username); return; }
        const res = current.results;
        const found = res.filter(r => r.found);
        const unknown = res.filter(r => r.status === 'unknown');
        const pct = current.total ? Math.min(100, Math.round(current.done / current.total * 100)) : 0;
        const errs = {};
        unknown.forEach(r => { const k = (r.error || 'error').split(':')[0]; errs[k] = (errs[k] || 0) + 1; });
        const byUser = {};
        found.forEach(r => (byUser[r.username || current.username] ||= []).push(r));
        const showMore = $('#sw-show')?.value || 'found';
        const extra = showMore === 'errors' ? unknown : showMore === 'notfound' ? res.filter(r => r.status === 'available') : [];
        box.innerHTML = `
            <div class="card-head" style="margin-bottom:0"><b>${current.finished ? 'Finished' : 'Searching…'}</b>
                <span class="muted small">${current.done.toLocaleString()} / ${(current.total || '?').toLocaleString()} checks · found on <b class="ok">${found.length}</b>${unknown.length ? ` · couldn’t check ${unknown.length}` : ''}</span><span class="spacer"></span>
                ${current.finished ? '<button class="btn small" id="sweep-again">New search</button>' : '<button class="btn small" id="sweep-stop">Stop</button>'}
                ${found.length ? '<button class="btn small primary" id="sweep-save">⊕ Save to case</button><button class="btn small" id="sweep-json" title="Maigret-compatible JSON">JSON</button><button class="btn small" id="sweep-csv">CSV</button><button class="btn small" id="sweep-html">HTML report</button>' : ''}</div>
            ${current.error ? `<p class="warn small">${esc(current.error)}</p>` : ''}
            <div class="progress"><div style="width:${pct}%"></div></div>
            ${current.recursions.length ? `<p class="small">↳ Found linked username${current.recursions.length > 1 ? 's' : ''} in profiles and searched ${current.recursions.length > 1 ? 'them' : 'it'} too: ${current.recursions.map(u => `<button class="chip" data-follow="${esc(u)}" data-type="username">${esc(u)}</button>`).join(' ')}</p>` : ''}
            ${Object.entries(byUser).map(([u, list]) => `
                <h4 style="margin:.8rem 0 .3rem">${esc(u)} <span class="muted small">${list.length} account(s)${current.usernames.find(x => x.username === u)?.via ? ` · linked from ${esc(current.usernames.find(x => x.username === u).via)}` : ''}</span></h4>
                <div class="sweep-results">${list.sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9)).map(r => `
                    <div class="sweep-hit"><div><a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer"><b>${esc(r.site)}</b></a>${r.similar ? ' <span class="muted tiny" title="This site only offers a search page; check it by hand">search page</span>' : ''}
                        <div class="muted tiny">${esc((r.tags || []).slice(0, 3).join(', ') || r.cat || '')}</div>
                        ${r.ids ? `<div class="tiny">${[r.ids.fullname && `name: ${esc(r.ids.fullname)}`, r.ids.emails && `email: ${r.ids.emails.map(esc).join(', ')}`, r.ids.links && `${r.ids.links.length} linked profile(s)`].filter(Boolean).join(' · ')}</div>` : ''}</div></div>`).join('')}</div>`).join('') || (current.finished ? '<p class="muted small">No accounts found.</p>' : '')}
            ${current.finished && res.length ? `<div class="btn-row"><label class="small muted">Also show <select id="sw-show" class="input input-sm"><option value="found">nothing else</option><option value="errors">sites that couldn’t be checked (${unknown.length})</option><option value="notfound">sites where it wasn’t found</option></select></label>
                ${Object.keys(errs).length ? `<span class="muted tiny">Couldn’t check: ${Object.entries(errs).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${esc(k)} ${v}`).join(' · ')}</span>` : ''}</div>
                ${extra.length ? `<table class="data-table"><tbody>${extra.slice(0, 400).map(r => `<tr><td>${esc(r.site)}</td><td class="small"><a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer">${esc(r.url)}</a></td><td class="small muted">${esc(r.error || r.httpStatus || '')}</td></tr>`).join('')}</tbody></table>` : ''}` : ''}
            <p class="muted tiny">Detection rules from <a href="https://github.com/soxoj/maigret" target="_blank" rel="noopener noreferrer">Maigret</a> (MIT). A match means the site’s page looks like a profile; open it to confirm. “Search page” results need checking by hand.</p>`;
        if ($('#sw-show')) { $('#sw-show').value = showMore; $('#sw-show').onchange = () => render(username); }
        $('#sweep-stop')?.addEventListener('click', stop);
        $('#sweep-again')?.addEventListener('click', () => { current = null; render(username); });
        $('#sweep-save')?.addEventListener('click', save);
        $('#sweep-json')?.addEventListener('click', () => download(`maigret_${current.username}.json`, JSON.stringify(maigretJSON(), null, 2), 'application/json'));
        $('#sweep-csv')?.addEventListener('click', () => {
            const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
            download(`maigret_${current.username}.csv`, ['username,site,url,status,http_status,tags,error,found_via', ...current.results.filter(r => r.status !== 'illegal').map(r => [r.username, r.site, r.url, r.status || (r.found ? 'claimed' : 'available'), r.httpStatus, (r.tags || []).join(' '), r.error, r.via].map(q).join(','))].join('\n'), 'text/csv');
        });
        $('#sweep-html')?.addEventListener('click', () => download(`maigret_${current.username}.html`, htmlReport(), 'text/html'));
    }

    function maigretJSON() {
        const out = {};
        for (const r of current.results.filter(x => x.found)) {
            const key = r.username && r.username !== current.username ? `${r.site} (${r.username})` : r.site;
            out[key] = { username: r.username || current.username, url_user: r.url, url_main: r.urlMain, rank: r.rank, http_status: r.httpStatus, status: { status: 'Claimed', url: r.url, tags: r.tags, ids: { ...(r.ids?.fullname && { fullname: r.ids.fullname }), ...(r.ids?.emails && { email: r.ids.emails[0] }), ...(r.ids?.links && { links: JSON.stringify(r.ids.links) }) } } };
        }
        return out;
    }

    function htmlReport() {
        const found = current.results.filter(r => r.found);
        return `<!doctype html><meta charset="utf-8"><title>Username search: ${esc(current.username)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:1000px;margin:2rem auto;padding:0 1rem;color:#111}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left;font-size:14px;vertical-align:top}.t{color:#666;font-size:12px}</style>
<h1>Username search: ${esc(current.username)}</h1>
<p>${found.length} accounts found · ${current.sites || current.total} sites checked · ${new Date().toISOString()} · case ${esc(CaseFile.data.id)} · generated by Azimuth (Maigret port)</p>
<table><tr><th>Site</th><th>Username</th><th>Profile</th><th>Tags</th><th>Extracted</th></tr>
${found.map(r => `<tr><td>${esc(r.site)}</td><td>${esc(r.username)}</td><td><a href="${esc(r.url)}">${esc(r.url)}</a></td><td class="t">${esc((r.tags || []).join(', '))}</td><td class="t">${r.ids ? esc(Object.entries(r.ids).filter(([k]) => !['image', 'siteBrand'].includes(k)).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ')) : ''}</td></tr>`).join('')}
</table><p class="t">Detection rules from Maigret (https://github.com/soxoj/maigret, MIT). Matches indicate a profile-like page; verify before relying on them.</p>`;
    }

    async function save() {
        const found = current.results.filter(r => r.found);
        const root = { type: 'username', value: current.username };
        CaseFile.addSelector(root);
        const leads = [];
        for (const r of found) {
            leads.push({ type: 'url', value: r.url, via: `${r.site} account` });
            for (const u of Object.keys(r.ids?.usernames || {})) if (u.toLowerCase() !== (r.username || '').toLowerCase()) leads.push({ type: 'username', value: u, via: `linked from ${r.site}` });
            for (const e of r.ids?.emails || []) leads.push({ type: 'email', value: e, via: `listed on ${r.site}` });
        }
        for (const u of current.usernames.slice(1)) leads.push({ type: 'username', value: u.username, via: u.via || 'linked profile' });
        CaseFile.addLeads(root, leads.slice(0, 500));
        await CaseFile.addEvidence({
            title: `Username search: ${current.username} found on ${found.length} sites`,
            text: found.map(r => `${r.site}${r.username !== current.username ? ` [${r.username}]` : ''}: ${r.url}${r.ids?.fullname ? ` (name: ${r.ids.fullname})` : ''}`).join('\n'),
            tags: ['username', 'maigret'], selector: current.username,
        });
        $('#sweep-save').disabled = true;
        $('#sweep-save').textContent = '✓ Saved';
    }

    // The standalone "Maigret username search" section.
    function setupView() {
        $('#maigret-form').onsubmit = e => {
            e.preventDefault();
            const v = $('#maigret-user').value.trim().replace(/^@/, '');
            if (!v) return $('#maigret-user').focus();
            const parts = v.split(/\s+/);
            presetPermute = parts.length > 1 ? v : '';
            setMount('#maigret-panel');
            if (current && current.username !== (parts.length > 1 ? parts.join('') : v)) current = current.finished ? null : current;
            render(parts.length > 1 ? parts.join('') : v);
            CaseFile.addSelector({ type: 'username', value: parts.length > 1 ? parts.join('') : v });
        };
    }

    function showInView() {
        setMount('#maigret-panel');
        if (state.selector?.type === 'username' && !$('#maigret-user').value) $('#maigret-user').value = state.selector.value;
        render(lastUsername || $('#maigret-user').value.trim() || '');
        setTimeout(() => $('#maigret-user').focus(), 30);
    }

    function showInTab(username) {
        setMount('#sweep-panel');
        presetPermute = '';
        render(username);
    }

    return { start, stop, render, setupView, showInView, showInTab };
})();
