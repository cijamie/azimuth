// AZIMUTH v3 controller.
'use strict';

const REGISTRY = window.OSINT_DATA;
const TOOLS = [];
(function flatten(node, path) {
    for (const ch of node.children || []) {
        if (ch.type === 'url') TOOLS.push({ ...ch, path, category: path[0] });
        else flatten(ch, [...path, ch.name]);
    }
})(REGISTRY, []);

const STATUS_META = {
    ok: { label: 'online', cls: 'st-ok', title: 'Responded normally at the last check' },
    blocked: { label: 'bot-protected', cls: 'st-blocked', title: 'Blocks automated checks; normally fine in a browser' },
    error: { label: 'unverified', cls: 'st-err', title: 'Timed out or errored at the last check; may be down or region-blocked' },
    tor: { label: 'onion', cls: 'st-tor', title: 'Tor hidden service: needs Tor Browser' },
};

const state = {
    view: 'investigate',
    selector: null,
    trail: [],
    category: null,
    favorites: store.get('azimuth_favs', null) ?? migrateFavs(),
    recent: [],
    lookupResults: [],
    dorkTouched: false,
    blockedUrls: [],
    topLinks: [],
};

function migrateFavs() {
    const old = store.get('osint_favs', []);
    const favs = (Array.isArray(old) ? old : []).map(f => ({ name: f.name, url: f.url }));
    store.set('azimuth_favs', favs);
    return favs;
}

let fuse = null;

document.addEventListener('DOMContentLoaded', async () => {
    fuse = window.Fuse ? new Fuse(TOOLS, { keys: [{ name: 'name', weight: 3 }, { name: 'description', weight: 1.5 }, { name: 'tags', weight: 1.5 }, { name: 'path', weight: 1 }], threshold: 0.35, ignoreLocation: true }) : null;
    Settings.setup();
    // Unlock (if a passphrase is set), then load encrypted data before anything renders it.
    await Vault.ready();
    await Secure.preload(['azimuth_cases', 'azimuth_recent', 'azimuth_watch', 'azimuth_personas']);
    state.recent = Secure.get('azimuth_recent', []);
    await CaseFile.init();
    Vault.setup();
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
    setupNav();
    setupOmnibox();
    setupInvestigate();
    setupRegistry();
    setupDorks();
    setupToolkit();
    ImageTools.setup();
    CaseFile.setup();
    Graph.setupInteraction();
    Watch.setup();
    Palette.setup();
    Analysis.setup();
    Bulk.setup();
    Forensics.setup();
    Research.setup();
    MapView.setup();
    Interop.setup();
    EvidenceTools.setup();
    AI.setup();
    document.addEventListener('azimuth:case-switched', () => { state.selector = null; $('#inv-active').classList.add('hidden'); $('#inv-empty').classList.remove('hidden'); if (state.view !== 'investigate') showView(state.view); });
    setupGlobalClicks();
    setupShortcuts();
    setupPasteAnywhere();
    setupOpsec();
    renderRecent();
    document.addEventListener('azimuth:case', debounce(() => { if (state.view === 'graph') { Graph.render(); Graph.renderTimeline(); } }, 200));
    document.addEventListener('azimuth:extension', () => { if (state.selector?.type === 'username') Sweep.render(); });
    document.addEventListener('azimuth:settings', () => { renderRecent(); });
    const fromHash = () => {
        const hash = decodeURIComponent(location.hash.slice(1));
        if (hash.startsWith('q=') && hash.slice(2) !== state.selector?.value) runInvestigate(hash.slice(2));
    };
    window.addEventListener('hashchange', fromHash);
    // Text shared to the installed app (Android share sheet etc.) arrives as ?text=/url=/title=.
    const params = new URLSearchParams(location.search);
    const shared = params.get('url') || params.get('text') || params.get('title');
    if (shared) {
        history.replaceState(null, '', location.pathname);
        const iocs = extractIOCs(shared);
        const first = iocs.url?.[0] || iocs.email?.[0] || iocs.domain?.[0] || iocs.ipv4?.[0] || shared.trim();
        runInvestigate(first);
    } else fromHash();
});

// ---------------- Navigation ----------------
const VIEWS = ['investigate', 'graph', 'case', 'analysis', 'watch', 'bulk', 'registry', 'dorks', 'toolkit'];

function showView(view) {
    state.view = view;
    VIEWS.forEach(v => $(`#view-${v}`).classList.toggle('hidden', v !== view));
    $$('[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === view));
    if (view === 'case') CaseFile.render();
    if (view === 'registry') renderRegistry();
    if (view === 'graph') { Graph.setCurrent(state.selector); Graph.render(); Graph.renderTimeline(); MapView.render(); }
    if (view === 'analysis') Analysis.render();
    if (view === 'case') EvidenceTools.checkCaptures();
    if (view === 'watch') Watch.render();
    if (view === 'dorks') syncDorkTarget();
    closeRail();
    $(`#view-${view}`).scrollTop = 0;
}

function setupNav() {
    $$('[data-view]').forEach(el => el.addEventListener('click', () => {
        if (el.dataset.view === 'registry') { state.category = null; $('#omni-search').value = ''; }
        showView(el.dataset.view);
    }));
    $('#rail-toggle').onclick = () => { $('#rail').classList.toggle('open'); $('#rail-overlay').classList.toggle('open'); };
    $('#rail-overlay').onclick = closeRail;
    $('#brand-home').onclick = e => { e.preventDefault(); showView('investigate'); };
    $('#purge-session-btn').onclick = async () => {
        if (!confirm('Delete ALL Azimuth data in this browser: case, evidence, screenshots, watchlist, favorites, keys and history? This cannot be undone.')) return;
        try { localStorage.clear(); sessionStorage.clear(); } catch { /* ignore */ }
        await blobStore.clear().catch(() => {});
        location.href = location.pathname;
    };
}
function closeRail() { $('#rail').classList.remove('open'); $('#rail-overlay').classList.remove('open'); }

// ---------------- Omnibox (one search box for everything) ----------------
function setupOmnibox() {
    const q = $('#q'), typeSel = $('#q-type');
    typeSel.innerHTML = `<option value="auto">Auto-detect</option>` + Object.entries(SELECTOR_TYPES).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('');
    q.addEventListener('input', () => {
        const d = detectSelector(q.value);
        $('#q-detected').textContent = d && typeSel.value === 'auto' ? SELECTOR_TYPES[d.type].label : '';
    });
    $('#omnibox').addEventListener('submit', e => {
        e.preventDefault();
        if (!q.value.trim()) return q.focus();
        runInvestigate(q.value, typeSel.value === 'auto' ? null : typeSel.value);
        typeSel.value = 'auto';
    });
}

// ---------------- Investigate ----------------
function setupInvestigate() {
    $('#run-lookups').onclick = runLookups;
    $('#subj-copy').onclick = () => state.selector && copyText(state.selector.value);
    $('#subj-note').onclick = () => CaseFile.openModal({ tags: state.selector ? [state.selector.type] : [] });
    $('#subj-watch').onclick = toggleWatch;
    $('#open-top').onclick = () => openLinks(state.topLinks, 'Start here');
    $$('#inv-tabs .tab').forEach(t => t.onclick = () => switchInvTab(t.dataset.tab));

    // Clicking a pivot link logs it; a "copy" pivot copies the selector first (synchronously, before the tab opens).
    document.addEventListener('click', e => {
        const a = e.target.closest('a[data-pivot]');
        if (!a || !state.selector) return;
        if (a.dataset.copy === '1') copyText(state.selector.value, 'Copied. Paste it on the site.');
        if ($('#pivot-log').checked) CaseFile.log('link', `${a.dataset.pivot} ← ${state.selector.value}`, a.href);
    });
    $('#pivot-groups').addEventListener('click', e => {
        const g = e.target.closest('[data-open-group]');
        if (!g) return;
        e.preventDefault();
        openLinks($$('a[data-pivot]', g.closest('.pivot-group')).map(l => l.href), g.dataset.openGroup);
    });
    $('#popup-notice').addEventListener('click', e => {
        if (e.target.closest('[data-copy-links]')) copyText(state.blockedUrls.join('\n'), `Copied ${state.blockedUrls.length} links`);
    });
    $('#lookup-results').addEventListener('click', e => {
        const pin = e.target.closest('[data-pin]');
        if (!pin) return;
        const r = state.lookupResults[pin.dataset.pin];
        if (!r || r.saved) return;
        pinResult(r);
        pin.textContent = '✓ Saved';
        pin.disabled = true;
    });
    $('#lookup-summary').addEventListener('click', e => { if (e.target.closest('#save-all-findings')) saveAllFindings(); });
}

function switchInvTab(tab) {
    $$('#inv-tabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    $$('#view-investigate .tabpane').forEach(p => p.classList.toggle('hidden', p.dataset.pane !== tab));
    if (tab === 'sweep') Sweep.render(state.selector?.value);
    if (tab === 'match') Match.run(state.lookupResults, state.selector.value);
    if (tab === 'lookalikes') Lookalikes.show(state.selector.type === 'domain' ? registrable(state.selector.value) : registrable(state.selector.meta.domain || state.selector.meta.host || ''));
}

function openLinks(urls, label) {
    if (!urls.length) return;
    const blocked = openMany(urls);
    if ($('#pivot-log').checked) CaseFile.log('link', `Opened ${urls.length - blocked} of ${urls.length} links (${label}) ← ${state.selector?.value || ''}`);
    state.blockedUrls = urls;
    const box = $('#popup-notice');
    if (!blocked) { box.classList.add('hidden'); toast(`Opened ${urls.length} tab${urls.length > 1 ? 's' : ''}`); return; }
    box.innerHTML = `<b>Your browser blocked ${blocked} of ${urls.length} tabs.</b> To open them all with one click, allow pop-ups for this page: click the blocked pop-up icon at the right of the address bar, choose <i>Always allow</i>, then click again.
        <div class="btn-row"><button class="btn small" data-copy-links>Copy all ${urls.length} links instead</button></div>`;
    box.classList.remove('hidden');
}

function toggleWatch() {
    if (!state.selector) return;
    Watch.toggle(state.selector).then(updateWatchButton);
}
function updateWatchButton() {
    const on = state.selector && Watch.has(state.selector);
    $('#subj-watch').textContent = on ? '★ Watching' : '☆ Watch';
    $('#subj-watch').classList.toggle('on', !!on);
}

function renderRecent() {
    $('#recent-selectors').innerHTML = state.recent.length
        ? '<span class="muted small">Recent:</span>' + state.recent.map(r => `<button class="chip" data-investigate="${esc(r.value)}" data-type="${esc(r.type)}"><span class="chip-type">${esc(SELECTOR_TYPES[r.type]?.label || '')}</span>${esc(r.value)}</button>`).join('') + '<button class="chip ghost" id="clear-recent">clear</button>'
        : '';
    const c = $('#clear-recent');
    if (c) c.onclick = () => { state.recent = []; Secure.set('azimuth_recent', []); renderRecent(); };
}

// Investigate something reached from another selector (a lead, a chart node, a subdomain…).
function investigateFrom(value, type, parent) {
    runInvestigate(value, type || null, parent || state.selector);
}

function runInvestigate(raw, forcedType, parent) {
    raw = String(raw ?? $('#q').value);
    if (!raw.trim()) return;
    const sel = forcedType ? coerceSelector(raw, forcedType) : detectSelector(raw);
    if (!sel) return;
    if (parent && selKey(parent) !== selKey(sel)) {
        CaseFile.addLink(parent, sel, CaseFile.data.leads[selKey(sel)]?.via || 'followed');
        state.trail = [...state.trail.filter(t => selKey(t) !== selKey(sel)).slice(-4), parent];
    } else if (!parent) state.trail = [];
    state.selector = sel;
    $('#q').value = sel.value;
    $('#q-detected').textContent = '';
    state.recent = [{ value: sel.value, type: sel.type }, ...state.recent.filter(r => r.value !== sel.value)].slice(0, 10);
    Secure.set('azimuth_recent', state.recent);
    renderRecent();
    CaseFile.addSelector(sel);
    CaseFile.nameIfUntitled(sel.value);
    CaseFile.log('investigate', `${SELECTOR_TYPES[sel.type].label}: ${sel.value}`);
    history.replaceState(null, '', `#q=${encodeURIComponent(sel.value)}`);
    document.title = `${sel.value} · AZIMUTH`;

    $('#inv-empty').classList.add('hidden');
    $('#inv-active').classList.remove('hidden');
    $('#subj-type').textContent = SELECTOR_TYPES[sel.type].label + (sel.meta.kind ? ` · ${sel.meta.kind}` : '') + (sel.meta.chain ? ` · ${sel.meta.chain}` : '') + (sel.meta.private ? ' · private' : '');
    $('#subj-value').textContent = sel.value;
    $('#subj-trail').innerHTML = state.trail.length ? 'Reached from: ' + state.trail.map(t => `<button data-investigate="${esc(t.value)}" data-type="${esc(t.type)}">${esc(t.value)}</button>`).join(' → ') + ' →' : '';
    updateWatchButton();
    $('#discovered-card').classList.add('hidden');
    $('#popup-notice').classList.add('hidden');
    $('#lookup-results').innerHTML = '';
    $('#lookup-summary').innerHTML = privacyOn()
        ? '<div>🛡 <b>Privacy mode is on</b>: live checks are not sent. Use the links below, or turn privacy mode off in Settings.</div>'
        : `<div class="muted">Live checks are switched off. <button class="btn small" onclick="runLookups()">Run them now</button></div>`;
    state.lookupResults = [];
    $('#tab-sweep').classList.toggle('hidden', sel.type !== 'username');
    $('#tab-match').classList.toggle('hidden', sel.type !== 'username');
    $('#tab-lookalikes').classList.toggle('hidden', !['domain', 'email', 'url'].includes(sel.type) || (sel.type === 'email' && /^(gmail|googlemail|outlook|hotmail|live|yahoo|icloud|me|aol|proton|protonmail|gmx|yandex|mail)\./.test(sel.meta.domain)));
    renderPivots(sel);
    switchInvTab('findings');
    if (state.view !== 'investigate') showView('investigate');
    $('#view-investigate').scrollTop = 0;
    if (Settings.get('autoLookups')) runLookups();
}

function lookupSourcesText(type) {
    return {
        domain: 'DNS, registration, certificate logs, Wayback, threat intel and breach records',
        email: 'Gravatar, the email domain and its breach history, and GitHub',
        ip: 'owner & location, open ports, registration, reverse DNS, Tor list and threat intel',
        url: 'the Wayback Machine, the site’s DNS and registration, and threat intel',
        image: 'the image itself and the Wayback Machine',
        username: '8 sites with open profiles (GitHub, GitLab, Bluesky, Mastodon, Keybase, Hacker News, Chess.com, Lichess)',
        crypto: 'a public blockchain explorer',
        hash: 'threat intel (AlienVault OTX)',
        phone: 'a phone-number database (country, validity, line type)',
        name: 'Wikipedia and Wikidata',
    }[type];
}

function renderPivots(sel) {
    const groups = pivotsFor(sel);
    const reg = TOOLS.filter(t => t.input && (t.input === sel.type || (t.input === 'any' && sel.type !== 'image')) && t.status !== 'error')
        .map(t => ({ name: t.name, url: fillRegistryUrl(t.url, sel), copy: false }));
    const seen = new Set(groups.flatMap(g => g.items.map(i => i.url)));
    const extra = reg.filter(r => !seen.has(r.url));
    if (extra.length) groups.push({ group: 'From the tool directory', items: extra });
    const link = i => `<a class="pivot" href="${esc(safeUrl(i.url))}" target="_blank" rel="noopener noreferrer" data-pivot="${esc(i.name)}" data-copy="${i.copy ? 1 : 0}" title="${esc(i.copy ? 'This site has no search link: your search is copied so you can paste it there' : i.url)}">${esc(i.name)}${i.copy ? ' <span class="muted">⧉</span>' : ''}</a>`;
    const top = groups.find(g => g.top);
    state.topLinks = top ? top.items.map(i => i.url) : [];
    $('#start-here').innerHTML = top ? top.items.map(link).join('') : '';
    $('#start-here-card').classList.toggle('hidden', !top);
    $('#open-top').textContent = top ? `Open all ${top.items.length}` : 'Open all';
    const rest = groups.filter(g => !g.top);
    $('#tab-links-count').textContent = rest.reduce((n, g) => n + g.items.length, 0);
    $('#pivot-groups').innerHTML = rest.map(g => `
        <details class="pivot-group">
            <summary><h3>${esc(g.group)}</h3><span class="muted small">${g.items.length}</span><span class="spacer"></span><button class="btn small ghost" data-open-group="${esc(g.group)}">Open all</button></summary>
            <div class="pivot-list">${g.items.map(link).join('')}</div>
        </details>`).join('');
}

function fillRegistryUrl(url, sel) {
    return url.replace(/\{target\}/g, sel ? encodeURIComponent(sel.value) : '');
}

async function runLookups() {
    const sel = state.selector;
    if (!sel) return;
    const plan = LOOKUP_PLAN[sel.type];
    if (!plan) return;
    if (privacyOn()) {
        $('#lookup-summary').innerHTML = '<div>🛡 <b>Privacy mode is on</b>: live checks are not sent. Use the links below, or turn privacy mode off in Settings.</div>';
        $('#lookup-results').innerHTML = '';
        return;
    }
    const btn = $('#run-lookups');
    btn.disabled = true;
    const box = $('#lookup-results');
    box.innerHTML = '';
    state.lookupResults = [];
    CaseFile.log('lookup', `Ran live checks for ${sel.value}`);
    const promises = plan(sel);
    $('#tab-findings-count').textContent = '';
    $('#lookup-summary').innerHTML = `<div><span class="spinner"></span> Checking ${esc(lookupSourcesText(sel.type))}…</div>`;
    const run = promises.map((p, i) => {
        const card = document.createElement('div');
        card.className = 'lookup-card';
        card.innerHTML = '<div class="lookup-head"><span class="spinner"></span><span class="muted small">checking…</span></div>';
        box.appendChild(card);
        return Promise.resolve(p)
            .then(r => r, err => ({ title: 'Check failed', status: 'err', rows: [], note: `${err.name === 'AbortError' ? 'Timed out' : err.message}. The service may be rate-limiting, or blocked by a browser extension.` }))
            .then(r => { state.lookupResults[i] = r; card.outerHTML = renderLookupCard(r, i); });
    });
    await Promise.all(run);
    btn.disabled = false;
    if (state.selector !== sel) return;
    const results = state.lookupResults.filter(Boolean);
    // Order: found first, then info, then nothing, then errors.
    const order = { hit: 0, info: 1, miss: 2, err: 3 };
    box.innerHTML = state.lookupResults.map((r, i) => [r, i]).sort((a, b) => order[a[0].status] - order[b[0].status]).map(([r, i]) => renderLookupCard(r, i)).join('');
    $('#tab-findings-count').textContent = results.filter(r => r.status === 'hit').length;
    renderLookupSummary();
    // Auto-chaining: new leads, and dated facts for the timeline.
    const leads = discoverLeads(results, sel);
    CaseFile.addLeads(sel, leads);
    CaseFile.addTimeline(datedFacts(results, sel));
    const coords = results.find(r => r.title.startsWith('IP context'))?.rows?.find(x => x[0] === 'Coordinates')?.[1];
    if (coords) { const [lat, lon] = coords.split(',').map(Number); CaseFile.addPlace({ lat, lon, label: `${sel.value} (IP location)`, source: 'IP geolocation (approximate)', selector: sel.value }); }
    renderLeads(leads);
}

function renderLeads(leads) {
    const card = $('#discovered-card');
    if (!leads.length) { card.classList.add('hidden'); return; }
    const byType = {};
    leads.forEach(l => (byType[l.type] ||= []).push(l));
    $('#discovered').innerHTML = Object.entries(byType).map(([t, list]) => `
        <div class="disc-group"><b>${esc(SELECTOR_TYPES[t]?.label || t)} (${list.length})</b>
        <div class="chip-row">${list.slice(0, 40).map(l => `<button class="chip" data-follow="${esc(l.value)}" data-type="${esc(l.type)}" title="Found via ${esc(l.via)}">${esc(l.value)}</button>`).join('')}</div></div>`).join('');
    card.classList.remove('hidden');
}

function renderLookupSummary() {
    const res = state.lookupResults.filter(Boolean);
    const hits = res.filter(r => r.status === 'hit');
    const misses = res.filter(r => r.status === 'miss');
    const errs = res.filter(r => r.status === 'err');
    const facts = [];
    const find = (title, key) => res.find(r => r.title.startsWith(title))?.rows?.find(x => x[0] === key)?.[1];
    const t = state.selector.type;
    const add = (label, v) => v && facts.push([label, v]);
    if (t === 'domain' || t === 'url') {
        add('Registered', find('Registration', 'Registered')?.slice(0, 10));
        add('Registrar', find('Registration', 'Registrar'));
        add('Email by', find('DNS records', 'Mail provider'));
        const subs = res.find(r => r.title.startsWith('Subdomains')); if (subs?.pivotable?.length) add('Subdomains', subs.pivotable.length);
        add('Archived since', find('Wayback', 'First capture')?.slice(0, 4));
        const otx = find('Threat intel', 'Threat pulses'); if (otx && otx !== '0') add('⚠ Threat reports', otx);
        const br = res.find(r => r.title.startsWith('Breaches') && r.status === 'hit'); if (br) add('⚠ Breaches', br.rows.length);
    }
    if (t === 'ip') {
        add('Owner', find('IP context', 'Org / ASN'));
        add('Location', [find('IP context', 'City'), find('IP context', 'Country')].filter(Boolean).join(', '));
        add('Open ports', find('Open ports', 'Open ports'));
        if (res.find(r => r.title === 'Tor relay check' && r.status === 'hit')) add('⚠ Tor', 'this is a Tor relay');
        const otx = find('Threat intel', 'Threat pulses'); if (otx && otx !== '0') add('⚠ Threat reports', otx);
    }
    if (t === 'email') {
        if (res.find(r => r.title === 'Gravatar' && r.status === 'hit')) add('Gravatar', 'has a public profile');
        add('Mail by', find('DNS records', 'Mail provider'));
        const br = res.find(r => r.title.startsWith('Breaches') && r.status === 'hit'); if (br) add('⚠ Domain breached', `${br.rows.length} time(s)`);
    }
    if (t === 'phone') { add('Country', find('Number analysis', 'Country')); add('Line type', find('Number analysis', 'Line type')); add('Valid', find('Number analysis', 'Valid number')); }
    if (t === 'crypto') { add('Balance', res[0]?.rows?.find(x => x[0] === 'Balance')?.[1]); add('Transactions', res[0]?.rows?.find(x => x[0] === 'Transactions')?.[1]); }
    if (t === 'hash') { add('Type', state.selector.meta.kind); const otx = find('Threat intel', 'Threat pulses'); if (otx) add('Threat reports', otx); add('Malware', find('Threat intel', 'Malware families')); add('Known value', find('Hash summary', 'Known value')); }
    const names = list => list.map(r => esc(r.title.replace(/ \(.*\)$/, ''))).join(', ');
    $('#lookup-summary').innerHTML = `
        ${t === 'username'
            ? `<div><b class="ok">Account found on ${hits.length} of ${res.length} sites:</b> ${names(hits) || 'none'}</div>${misses.length ? `<div class="muted small">Not found on: ${names(misses)}${t === 'username' ? '. Use the “Username search” tab to check 9,000+ more sites (Maigret).' : ''}</div>` : ''}`
            : `<div><b class="ok">${hits.length} of ${res.length} sources returned data.</b></div>${facts.length ? `<div class="facts">${facts.map(([k, v]) => `<span><b>${esc(k)}</b>${esc(v)}</span>`).join('')}</div>` : ''}`}
        ${errs.length ? `<div class="warn small">${errs.length} source(s) failed or were rate-limited. “↻ Re-check” retries.</div>` : ''}
        <div class="summary-actions">
            <button class="btn small primary" id="save-all-findings" ${hits.length ? '' : 'disabled'}>⊕ Save all findings to case</button>
            <span class="muted small">Findings are below; the chart and timeline update automatically.</span>
        </div>`;
}

function renderLookupCard(r, i) {
    const pill = { hit: ['found', 'st-ok'], miss: ['nothing found', 'st-blocked'], info: ['info', 'st-tor'], err: ['error', 'st-err'] }[r.status] || ['', ''];
    const rows = (r.rows || []).filter(row => row[1] !== undefined && row[1] !== null && row[1] !== '');
    const subdomainChips = r.pivotable ? `<div class="chip-row" style="max-height:240px;overflow:auto">${r.pivotable.map(s => `<button class="chip" data-follow="${esc(s)}" data-type="domain">${esc(s)}</button>`).join('')}</div>` : '';
    return `<div class="lookup-card st-${esc(r.status)}">
        <div class="lookup-head">
            <h4>${esc(r.title)}</h4>
            <span class="status ${pill[1]}">${pill[0]}</span>
            <span class="spacer"></span>
            ${r.link ? `<a class="btn small ghost" href="${esc(safeUrl(r.link))}" target="_blank" rel="noopener noreferrer">Open ↗</a>` : ''}
            ${r.status === 'hit' || (r.status === 'info' && rows.length) ? `<button class="btn small" data-pin="${i}" ${r.saved ? 'disabled' : ''}>${r.saved ? '✓ Saved' : '⊕ Save'}</button>` : ''}
        </div>
        ${r.image ? `<img class="lookup-img" src="${esc(safeUrl(r.image))}" alt="" referrerpolicy="no-referrer">` : ''}
        ${r.pivotable ? subdomainChips : rows.length ? `<div class="kv-table">${renderKV(rows.slice(0, 8))}</div>${rows.length > 8 ? `<details class="more"><summary>Show ${rows.length - 8} more</summary><div class="kv-table">${renderKV(rows.slice(8))}</div></details>` : ''}` : ''}
        ${r.note ? `<p class="muted small" style="margin-top:.4rem">${esc(r.note)}</p>` : ''}
    </div>`;
}

function pinResult(r) {
    r.saved = true;
    return CaseFile.addEvidence({
        title: `${r.title}: ${state.selector.value}`,
        text: (r.rows || []).map(([k, v]) => `${k ? k + ': ' : ''}${v}`).join('\n') + (r.pivotable ? r.pivotable.join('\n') : '') + (r.note ? `\n\n${r.note}` : ''),
        source: r.link || '',
        tags: ['lookup', state.selector.type],
        selector: state.selector.value,
    });
}

async function saveAllFindings() {
    const hits = state.lookupResults.filter(r => r && r.status === 'hit' && !r.saved);
    if (!hits.length) return toast('Nothing new to save.');
    for (const r of hits) await pinResult(r);
    $$('#lookup-results [data-pin]').forEach(b => { if (state.lookupResults[b.dataset.pin]?.saved) { b.textContent = '✓ Saved'; b.disabled = true; } });
    toast(`Saved ${hits.length} finding(s) to the case`);
}

// ---------------- Tool directory ----------------
function setupRegistry() {
    $('#omni-search').addEventListener('input', debounce(renderRegistry, 120));
    $('#omni-search').addEventListener('keydown', e => { if (e.key === 'Escape') { e.target.value = ''; renderRegistry(); } });
    ['#filter-hide-down', '#filter-input'].forEach(id => $(id).addEventListener('change', renderRegistry));
    $('#registry-crumbs').addEventListener('click', e => { if (e.target.dataset.crumb === 'root') { state.category = null; $('#omni-search').value = ''; renderRegistry(); } });
    $('#results-grid').addEventListener('click', e => {
        const fav = e.target.closest('[data-fav]');
        if (fav) { toggleFav(fav.dataset.fav); return; }
        const cat = e.target.closest('[data-category]');
        if (cat) { state.category = cat.dataset.category; $('#omni-search').value = ''; renderRegistry(); $('#view-registry').scrollTop = 0; return; }
        const launch = e.target.closest('a[data-tool]');
        if (launch) CaseFile.log('tool', `Opened ${launch.dataset.tool}`, launch.href);
    });
    $('#favorites-row').addEventListener('click', e => { const a = e.target.closest('a[data-tool]'); if (a) CaseFile.log('tool', `Opened ${a.dataset.tool}`, a.href); });
}

function visibleTools(list) {
    const hideDown = $('#filter-hide-down').checked, onlyInput = $('#filter-input').checked;
    return list.filter(t => (!hideDown || t.status !== 'error') && (!onlyInput || t.input));
}

function renderRegistry() {
    const q = $('#omni-search').value.trim();
    const grid = $('#results-grid'), crumbs = $('#registry-crumbs');
    renderStats();
    renderFavorites();
    if (q) {
        crumbs.innerHTML = `<button data-crumb="root">All categories</button> / results for “${esc(q)}”`;
        const hits = fuse ? fuse.search(q).map(r => r.item) : TOOLS.filter(t => (t.name + t.description + t.path.join(' ')).toLowerCase().includes(q.toLowerCase()));
        const list = visibleTools(hits).slice(0, 150);
        grid.innerHTML = list.length ? list.map(toolCard).join('') : `<p class="muted">No tools match “${esc(q)}”.</p>`;
        return;
    }
    if (!state.category) {
        crumbs.textContent = 'Pick a category, or search above.';
        grid.innerHTML = REGISTRY.children.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => {
            const n = TOOLS.filter(t => t.category === c.name).length;
            const subs = (c.children || []).filter(x => x.type === 'folder').map(x => x.name);
            return `<button class="cat-card" data-category="${esc(c.name)}"><h3>${esc(c.name)}</h3><p class="muted small">${n} tools${subs.length ? ` · ${esc(subs.slice(0, 3).join(', '))}${subs.length > 3 ? '…' : ''}` : ''}</p></button>`;
        }).join('');
        return;
    }
    crumbs.innerHTML = `<button data-crumb="root">All categories</button> / ${esc(state.category)}`;
    const tools = visibleTools(TOOLS.filter(t => t.category === state.category));
    const bySub = {};
    tools.forEach(t => { const k = t.path.slice(1).join(' / ') || 'General'; (bySub[k] ||= []).push(t); });
    grid.innerHTML = Object.entries(bySub).map(([sub, list]) => `<h3 class="grid-heading">${esc(sub)} <span class="muted">${list.length}</span></h3>${list.map(toolCard).join('')}`).join('') || '<p class="muted">Everything here is hidden by the filters.</p>';
}

function renderStats() {
    const c = { ok: 0, blocked: 0, error: 0, tor: 0 };
    TOOLS.forEach(t => (c[t.status] = (c[t.status] || 0) + 1));
    const checked = TOOLS.find(t => t.checked)?.checked;
    $('#registry-stats').innerHTML = `<span><b>${TOOLS.length}</b> tools</span>
        <span class="status st-ok">${c.ok} online</span>
        <span class="status st-blocked" title="${esc(STATUS_META.blocked.title)}">${c.blocked} bot-protected</span>
        <span class="status st-err" title="${esc(STATUS_META.error.title)}">${c.error} unverified</span>
        ${checked ? `<span class="muted small">links checked ${esc(checked)}</span>` : ''}
        ${state.selector ? `<span class="muted small">· tools marked <span class="status st-input">fills in</span> open with <b class="mono">${esc(state.selector.value)}</b></span>` : ''}`;
}

function toolCard(t) {
    const isFav = state.favorites.some(f => f.url === t.url);
    const st = STATUS_META[t.status];
    const url = fillRegistryUrl(t.url, state.selector && (t.input === state.selector.type || t.input === 'any') ? state.selector : null);
    let host = '';
    try { host = new URL(t.url.replace(/\{target\}/g, 'x')).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
    return `<div class="tool-card">
        <div class="tool-top"><h3>${esc(t.name.replace(/\s*\(M\)$/, ''))}</h3><button class="star ${isFav ? 'on' : ''}" data-fav="${esc(t.url)}" title="${isFav ? 'Remove from' : 'Add to'} favorites">★</button></div>
        ${t.description ? `<p class="tool-desc">${esc(t.description)}</p>` : ''}
        <p class="tool-path">${esc(t.path.join(' › '))}</p>
        <div class="tool-meta"><span class="host">${esc(host)}</span>
            ${st ? `<span class="status ${st.cls}" title="${esc(st.title)}">${st.label}</span>` : ''}
            ${t.input ? `<span class="status st-input" title="Fills in what you’re investigating">fills in</span>` : ''}
            ${t.added ? '<span class="status st-new">new</span>' : ''}</div>
        <div class="tool-actions"><a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer" class="btn" data-tool="${esc(t.name)}">Open ↗</a><button class="icon-copy" data-copy="${esc(url)}" title="Copy link">⧉</button></div>
    </div>`;
}

function toggleFav(url) {
    const i = state.favorites.findIndex(f => f.url === url);
    if (i > -1) state.favorites.splice(i, 1);
    else { const t = TOOLS.find(x => x.url === url); state.favorites.push({ name: t?.name || url, url }); }
    store.set('azimuth_favs', state.favorites);
    renderRegistry();
}

function renderFavorites() {
    $('#favorites-row').innerHTML = state.favorites.length
        ? '<span class="muted small">★ Favorites:</span>' + state.favorites.map(f => `<a class="chip" href="${esc(safeUrl(fillRegistryUrl(f.url, state.selector)))}" target="_blank" rel="noopener noreferrer" data-tool="${esc(f.name)}">${esc(f.name)}</a>`).join('')
        : '';
}

// ---------------- Dorks ----------------
const DORK_ENGINES = { google: 'https://www.google.com/search?q=', bing: 'https://www.bing.com/search?q=', duck: 'https://duckduckgo.com/?q=', yandex: 'https://yandex.com/search/?text=', brave: 'https://search.brave.com/search?q=' };
const PASTE_SITES = '(site:pastebin.com OR site:paste.ee OR site:rentry.co OR site:justpaste.it OR site:controlc.com OR site:ghostbin.site)';
const CODE_SITES = '(site:github.com OR site:gitlab.com OR site:bitbucket.org OR site:gist.github.com)';
const SOCIAL_SITES = '(site:linkedin.com OR site:facebook.com OR site:instagram.com OR site:x.com OR site:tiktok.com OR site:reddit.com)';
const DORKS = {
    domain: [
        ['Documents', 'site:{T} (filetype:pdf OR filetype:doc OR filetype:docx OR filetype:xls OR filetype:xlsx OR filetype:ppt OR filetype:pptx OR filetype:csv)'],
        ['Config & secrets files', 'site:{T} (ext:env OR ext:ini OR ext:conf OR ext:cfg OR ext:yml OR ext:yaml OR ext:toml OR ext:properties)'],
        ['Backups & database dumps', 'site:{T} (ext:bak OR ext:old OR ext:backup OR ext:sql OR ext:db OR ext:sqlite OR ext:zip OR ext:tar OR ext:gz)'],
        ['Log files', 'site:{T} (ext:log OR ext:txt) (intext:error OR intext:password OR intext:exception)'],
        ['Open directory listings', 'site:{T} intitle:"index of"'],
        ['Login & admin pages', 'site:{T} (inurl:login OR inurl:signin OR inurl:admin OR inurl:portal OR intitle:"log in")'],
        ['Subdomains', 'site:*.{T} -site:www.{T}'],
        ['Error & debug pages', 'site:{T} ("sql syntax" OR "warning: mysql" OR "stack trace" OR "Traceback (most recent call last)" OR "Whoops!")'],
        ['API docs & endpoints', 'site:{T} (inurl:swagger OR inurl:api-docs OR inurl:openapi OR inurl:graphql OR inurl:/api/)'],
        ['Email addresses at the domain', '"@{T}" -site:{T}'],
        ['Mentions on other sites', '"{T}" -site:{T}'],
        ['Pastes', '"{T}" ' + PASTE_SITES],
        ['Source code mentions', '"{T}" ' + CODE_SITES],
        ['Cloud storage & shared docs', '"{T}" (site:s3.amazonaws.com OR site:blob.core.windows.net OR site:storage.googleapis.com OR site:docs.google.com OR site:drive.google.com)'],
        ['Project boards & wikis', '"{T}" (site:trello.com OR site:atlassian.net OR site:notion.site OR site:miro.com)'],
        ['Employees (LinkedIn)', 'site:linkedin.com/in "{T}"'],
    ],
    person: [
        ['Exact name', '"{T}"'],
        ['Social profiles', '"{T}" ' + SOCIAL_SITES],
        ['CVs & resumes', '"{T}" (intitle:resume OR intitle:cv OR inurl:resume OR inurl:cv) (filetype:pdf OR filetype:docx)'],
        ['Documents mentioning', '"{T}" (filetype:pdf OR filetype:docx OR filetype:xlsx OR filetype:pptx)'],
        ['Contact details', '"{T}" ("email" OR "e-mail" OR "phone" OR "tel" OR "contact")'],
        ['Company roles', '"{T}" (director OR founder OR CEO OR officer OR owner) (site:opencorporates.com OR site:find-and-update.company-information.service.gov.uk OR site:bloomberg.com)'],
        ['Court & legal', '"{T}" (site:courtlistener.com OR site:justia.com OR site:casetext.com OR site:unicourt.com OR site:judyrecords.com)'],
        ['Forums & discussions', '"{T}" (site:reddit.com OR inurl:forum OR inurl:thread OR inurl:topic)'],
        ['Photos', '"{T}" (site:flickr.com OR site:pinterest.com OR site:imgur.com OR site:instagram.com)'],
        ['News coverage', '"{T}" (inurl:news OR inurl:article OR inurl:story)'],
        ['Pastes & leaks', '"{T}" ' + PASTE_SITES],
    ],
    email: [
        ['Exact address', '"{T}"'],
        ['On social & forums', '"{T}" ' + SOCIAL_SITES],
        ['In documents & spreadsheets', '"{T}" (filetype:pdf OR filetype:xlsx OR filetype:xls OR filetype:csv OR filetype:txt OR filetype:docx)'],
        ['Pastes & leaks', '"{T}" ' + PASTE_SITES],
        ['Source code & commits', '"{T}" ' + CODE_SITES],
        ['Name part as a username', '"{LOCAL}" -"{T}"'],
        ['Other addresses at the domain', '"@{DOMAIN}" -"{T}"'],
    ],
    username: [
        ['Exact handle', '"{T}"'],
        ['@ mentions', '"@{T}"'],
        ['Profile pages', 'inurl:"{T}" ' + SOCIAL_SITES],
        ['Forum member pages', '"{T}" (inurl:member OR inurl:profile OR inurl:user OR inurl:u/)'],
        ['Gaming & streaming', '"{T}" (site:steamcommunity.com OR site:twitch.tv OR site:kick.com OR site:youtube.com OR site:discord.com)'],
        ['Source code', '"{T}" ' + CODE_SITES],
        ['Pastes & leaks', '"{T}" ' + PASTE_SITES],
    ],
};

function setupDorks() {
    let custom = store.get('azimuth_custom_dorks', []);
    const render = () => {
        const raw = $('#dork-target').value.trim().replace(/^"|"$/g, '');
        const mode = $('#dork-mode').value, extra = $('#dork-extra').value.trim(), engine = DORK_ENGINES[$('#dork-engine').value];
        const T = raw || ({ domain: 'example.com', email: 'name@example.com', username: 'handle', person: 'Jane Doe' }[mode]);
        const [LOCAL, DOMAIN] = T.includes('@') ? T.split('@') : [T, T];
        const list = [...custom.map((c, i) => [c.label, c.tpl, i]).filter((_, i) => custom[i].mode === mode), ...DORKS[mode]];
        $('#dork-list').innerHTML = list.map(([label, tpl, ci]) => {
            const q = (tpl.replace(/\{T\}/g, T).replace(/\{LOCAL\}/g, LOCAL).replace(/\{DOMAIN\}/g, DOMAIN) + (extra ? ' ' + extra : '')).trim();
            return `<div class="dork-row ${raw ? '' : 'placeholder'}">
                <div class="dork-label">${esc(label)}${ci !== undefined ? `<span class="mine">mine</span>` : ''}</div>
                <code class="dork-q">${esc(q)}</code>
                <div class="dork-actions"><a class="btn small primary" href="${esc(engine + encodeURIComponent(q))}" target="_blank" rel="noopener noreferrer" data-dork="${esc(label)}">Search ↗</a><button class="icon-copy" data-copy="${esc(q)}" title="Copy">⧉</button>${ci !== undefined ? `<button class="icon-copy" data-del-dork="${ci}" title="Delete">✕</button>` : ''}</div>
            </div>`;
        }).join('');
    };
    ['#dork-target', '#dork-extra'].forEach(id => $(id).addEventListener('input', debounce(render, 100)));
    $('#dork-target').addEventListener('input', e => { if (e.isTrusted) state.dorkTouched = !!e.target.value; });
    ['#dork-mode', '#dork-engine'].forEach(id => $(id).addEventListener('change', render));
    $('#dork-list').addEventListener('click', e => {
        const a = e.target.closest('a[data-dork]');
        if (a) CaseFile.log('dork', `${a.dataset.dork}: ${$('#dork-target').value}`, a.href);
        const d = e.target.closest('[data-del-dork]');
        if (d) { custom.splice(+d.dataset.delDork, 1); store.set('azimuth_custom_dorks', custom); render(); }
    });
    $('#cd-save').onclick = () => {
        const label = $('#cd-label').value.trim(), tpl = $('#cd-query').value.trim();
        if (!label || !tpl) return toast('Give it a name and a query', 'err');
        if (!tpl.includes('{T}')) return toast('Put {T} where the target should go', 'err');
        custom.push({ mode: $('#dork-mode').value, label, tpl });
        store.set('azimuth_custom_dorks', custom);
        $('#cd-label').value = $('#cd-query').value = '';
        render();
        toast('Saved. It appears at the top for this target type.');
    };
    window.renderDorks = render;
    render();
}

function syncDorkTarget() {
    const s = state.selector;
    if (!s || state.dorkTouched) return;
    const mode = { domain: 'domain', url: 'domain', email: 'email', username: 'username', name: 'person' }[s.type];
    if (!mode) return;
    $('#dork-target').value = s.type === 'url' ? s.meta.host.replace(/^www\./, '') : s.value;
    $('#dork-mode').value = mode;
    window.renderDorks?.();
}

// ---------------- Global behaviours ----------------
function setupGlobalClicks() {
    document.addEventListener('click', e => {
        const follow = e.target.closest('[data-follow]');
        if (follow) { e.preventDefault(); investigateFrom(follow.dataset.follow, follow.dataset.type || null, state.selector); return; }
        const inv = e.target.closest('[data-investigate]');
        if (inv) { e.preventDefault(); runInvestigate(inv.dataset.investigate, inv.dataset.type || null); return; }
        const cp = e.target.closest('[data-copy]');
        if (cp) { e.preventDefault(); copyText(cp.dataset.copy); }
    });
}

function setupShortcuts() {
    document.addEventListener('keydown', e => {
        const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
        const modalOpen = !$('#note-modal').classList.contains('hidden');
        if (e.key === 'Escape') {
            if (Palette.isOpen()) return Palette.close();
            if (modalOpen) return CaseFile.closeModal();
            if (!$('#settings-modal').classList.contains('hidden')) return Settings.close();
            if (!$('#cases-modal').classList.contains('hidden')) return $('#cases-modal').classList.add('hidden');
        }
        if (modalOpen && e.ctrlKey && (e.key === 'Enter' || e.key === 's')) { e.preventDefault(); CaseFile.saveModal(); return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); Palette.isOpen() ? Palette.close() : Palette.open(); return; }
        if (typing || modalOpen || Palette.isOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === '/') { e.preventDefault(); $('#q').focus(); $('#q').select(); }
        if (e.key === 'n') { e.preventDefault(); CaseFile.openModal(state.selector ? { tags: [state.selector.type] } : {}); }
        const v = { 1: 'investigate', 2: 'graph', 3: 'case', 4: 'analysis', 5: 'watch', 6: 'bulk', 7: 'registry', 8: 'dorks', 9: 'toolkit' }[e.key];
        if (v) showView(v);
    });
}

// Paste a selector anywhere to investigate it; paste a block of text to extract its indicators.
function setupPasteAnywhere() {
    document.addEventListener('paste', e => {
        const el = document.activeElement;
        if (/INPUT|TEXTAREA|SELECT/.test(el?.tagName) || el?.isContentEditable || !$('#note-modal').classList.contains('hidden') || Palette.isOpen()) return;
        const files = [...(e.clipboardData?.files || [])];
        if (files.length && files[0].type.startsWith('image/')) {
            e.preventDefault();
            showView('toolkit'); switchToolkitTab('image'); ImageTools.photoCheck(files[0]);
            return;
        }
        const text = e.clipboardData?.getData('text') || '';
        if (!text.trim()) return;
        e.preventDefault();
        const iocs = extractIOCs(text);
        const count = Object.values(iocs).reduce((n, v) => n + v.length, 0);
        if (text.trim().split(/\s+/).length > 4 && count > 1) {
            showView('toolkit'); switchToolkitTab('ioc');
            $('#ioc-input').value = text;
            $('#ioc-input').dispatchEvent(new Event('input'));
            toast(`Found ${count} indicators in the pasted text. Click one to investigate it.`);
        } else runInvestigate(text.trim());
    });
}

function setupOpsec() {
    $('#opsec-check').onclick = async () => {
        if (privacyOn()) return toast('Privacy mode is on: the IP check is disabled.', 'err');
        $('#opsec-text').textContent = 'Checking…';
        try {
            const j = await fetchJSON('https://ipinfo.io/json');
            const org = j.org || 'unknown network';
            const vpnish = /vpn|proxy|hosting|cloud|datacenter|data center|server|m247|ovh|hetzner|digitalocean|linode|vultr|amazon|google|microsoft|mullvad|proton|nord|express|private internet|choopa|leaseweb|cdn77|datacamp/i.test(org);
            $('#opsec-dot').className = `dot ${vpnish ? 'ok' : 'warn'}`;
            $('#opsec-text').textContent = `${j.ip} · ${vpnish ? 'VPN/hosting' : 'home ISP?'}`;
            $('#opsec-check').title = `${org}${j.country ? ' (' + j.country + ')' : ''}. ${vpnish ? 'Looks like a VPN or hosting network.' : 'Looks like a regular ISP: sites you open and lookups you run can see this network.'}`;
            toast(`Sites see you as ${j.ip}, ${org}`);
            CaseFile.log('opsec', `IP check: ${j.ip} (${org})`);
        } catch { $('#opsec-text').textContent = 'Check failed'; }
    };
}
