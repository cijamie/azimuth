// Bulk check (many selectors at once) and lookalike-domain discovery, plus the shared result summariser.
'use strict';

// Pulls the headline facts and red flags out of a set of lookup results.
function summarizeResults(results, sel) {
    const res = results.filter(Boolean);
    const hits = res.filter(r => r.status === 'hit'), misses = res.filter(r => r.status === 'miss'), errs = res.filter(r => r.status === 'err');
    const facts = [], flags = [];
    const find = (title, key) => res.find(r => r.title.startsWith(title))?.rows?.find(x => x[0] === key)?.[1];
    const add = (label, v) => { if (v !== undefined && v !== null && v !== '') facts.push([label, String(v)]); };
    const t = sel.type;
    const otx = find('Threat intel', 'Threat pulses');
    if (otx && otx !== '0') flags.push(`${otx} threat report(s)`);
    const vt = find('VirusTotal', 'Verdicts');
    if (vt && !/^0 malicious · 0 suspicious/.test(vt)) flags.push(`VirusTotal: ${vt.split(' · ').slice(0, 2).join(', ')}`);
    if (t === 'domain' || t === 'url') {
        add('Registered', find('Registration', 'Registered')?.slice(0, 10));
        add('Registrar', find('Registration', 'Registrar'));
        add('Email by', find('DNS records', 'Mail provider'));
        const subs = res.find(r => r.title.startsWith('Subdomains')); if (subs?.pivotable?.length) add('Subdomains', subs.pivotable.length);
        add('Archived since', find('Wayback', 'First capture')?.slice(0, 4));
        const br = res.find(r => r.title.startsWith('Breaches') && r.status === 'hit'); if (br) flags.push(`${br.rows.length} breach(es)`);
        const reg = find('Registration', 'Registered');
        if (reg && Date.now() - new Date(reg) < 90 * 864e5) flags.push('registered in the last 90 days');
        if (res.find(r => r.title === 'DNS records' && r.status === 'miss')) flags.push('does not resolve');
    }
    if (t === 'ip') {
        add('Owner', find('IP context', 'Org / ASN'));
        add('Location', [find('IP context', 'City'), find('IP context', 'Country')].filter(Boolean).join(', '));
        add('Open ports', find('Open ports', 'Open ports'));
        add('Reverse DNS', find('Reverse DNS', 'PTR'));
        if (res.find(r => r.title === 'Tor relay check' && r.status === 'hit')) flags.push('Tor relay');
        const vulns = res.find(r => r.title.startsWith('Open ports'))?.rows?.filter(r => r[0] === 'Vulnerability').length;
        if (vulns) flags.push(`${vulns} known CVE(s)`);
    }
    if (t === 'email') {
        if (res.find(r => r.title === 'Gravatar' && r.status === 'hit')) add('Gravatar', 'public profile');
        add('Mail by', find('DNS records', 'Mail provider'));
        const br = res.find(r => r.title.startsWith('Breaches') && r.status === 'hit'); if (br) flags.push(`domain breached ${br.rows.length}×`);
    }
    if (t === 'username') add('Accounts found', hits.map(r => r.title.replace(/ \(.*\)$/, '')).join(', ') || 'none');
    if (t === 'phone') { add('Country', find('Number analysis', 'Country')); add('Line type', find('Number analysis', 'Line type')); add('Valid', find('Number analysis', 'Valid number')); if (find('Number analysis', 'Line type') === 'VoIP (internet number)') flags.push('VoIP number'); }
    if (t === 'crypto') { add('Balance', res[0]?.rows?.find(x => x[0] === 'Balance')?.[1]); add('Transactions', res[0]?.rows?.find(x => x[0] === 'Transactions')?.[1]); }
    if (t === 'hash') { add('Type', sel.meta.kind); add('Malware', find('Threat intel', 'Malware families')); add('Known value', find('Hash summary', 'Known value')); }
    if (t === 'name') {
        if (res.find(r => r.title.startsWith('Wikipedia') && r.status === 'hit')) add('Wikipedia', 'mentioned');
        const co = res.find(r => r.title.startsWith('Companies') && r.status === 'hit');
        if (co) add('Companies (GLEIF)', co.rows.filter(r => !r[0].startsWith('↑')).length);
    }
    return { hits, misses, errs, facts, flags };
}

// ---------------- Bulk check ----------------
const Bulk = (() => {
    let rows = [], stopFlag = false, running = false;

    function parseInput(text) {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const looksLikeList = lines.length > 1 && lines.every(l => l.split(/\s+/).length <= 4);
        let items = [];
        if (looksLikeList) items = lines;
        else {
            const iocs = extractIOCs(text);
            items = Object.entries(iocs).filter(([k]) => k !== 'cve').flatMap(([, v]) => v);
            if (!items.length) items = lines;
        }
        const seen = new Set();
        return items.map(v => detectSelector(v)).filter(s => s && !seen.has(selKey(s)) && seen.add(selKey(s))).slice(0, 500);
    }

    function render() {
        const f = ($('#bulk-filter').value || '').toLowerCase();
        const list = rows.filter(r => !f || JSON.stringify([r.sel.value, r.facts, r.flags]).toLowerCase().includes(f));
        $('#bulk-table').innerHTML = rows.length ? `<table class="data-table"><thead><tr><th>#</th><th>Selector</th><th>Type</th><th>Key facts</th><th>Red flags</th><th>Sources</th><th></th></tr></thead><tbody>
            ${list.map(r => `<tr class="${r.flags?.length ? 'flagged' : ''}">
                <td class="muted">${r.n}</td>
                <td class="mono"><button class="linklike" data-investigate="${esc(r.sel.value)}" data-type="${esc(r.sel.type)}">${esc(r.sel.value)}</button></td>
                <td>${esc(SELECTOR_TYPES[r.sel.type].label)}</td>
                <td class="small">${r.state === 'done' ? r.facts.map(([k, v]) => `<span class="muted">${esc(k)}:</span> ${esc(v)}`).join('<br>') : r.state === 'running' ? '<span class="spinner"></span>' : '<span class="muted">queued</span>'}</td>
                <td class="small warn">${(r.flags || []).map(esc).join('<br>')}</td>
                <td class="small muted">${r.state === 'done' ? `${r.hits}/${r.total} found${r.errs ? `, ${r.errs} failed` : ''}` : ''}</td>
                <td>${r.state === 'done' ? `<button class="btn small" data-bulk-save="${r.n}">⊕</button>` : ''}</td>
            </tr>`).join('')}</tbody></table>` : '<p class="muted small">Results appear here.</p>';
    }

    async function run() {
        if (running) return;
        if (Settings.get('privacy')) return toast('Privacy mode is on: bulk checks are disabled.', 'err');
        const sels = parseInput($('#bulk-input').value);
        if (!sels.length) return toast('Nothing to check', 'err');
        rows = sels.map((sel, i) => ({ n: i + 1, sel, state: 'queued' }));
        stopFlag = false; running = true;
        $('#bulk-run').disabled = true; $('#bulk-stop').disabled = false;
        CaseFile.log('bulk', `Bulk check of ${rows.length} selectors`);
        render();
        const queue = [...rows];
        let done = 0;
        await Promise.all(Array.from({ length: 3 }, async () => {
            while (queue.length && !stopFlag) {
                const r = queue.shift();
                r.state = 'running'; render();
                const results = (await Promise.allSettled(LOOKUP_PLAN[r.sel.type](r.sel))).map(x => (x.status === 'fulfilled' ? x.value : { title: 'failed', status: 'err', rows: [] }));
                const s = summarizeResults(results, r.sel);
                Object.assign(r, { state: 'done', results, facts: s.facts, flags: s.flags, hits: s.hits.length, total: results.length, errs: s.errs.length });
                done++;
                $('#bulk-status').textContent = `${done} / ${rows.length} checked`;
                render();
            }
        }));
        running = false;
        $('#bulk-run').disabled = false; $('#bulk-stop').disabled = true;
        $('#bulk-csv').disabled = $('#bulk-to-case').disabled = false;
        $('#bulk-status').textContent = `${done} / ${rows.length} checked${stopFlag ? ' (stopped)' : ''} · ${rows.filter(r => r.flags?.length).length} with red flags`;
    }

    function csv() {
        const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const lines = [['selector', 'type', 'facts', 'red_flags', 'sources_with_data', 'sources_checked'].join(',')];
        rows.filter(r => r.state === 'done').forEach(r => lines.push([r.sel.value, r.sel.type, r.facts.map(([k, v]) => `${k}: ${v}`).join('; '), r.flags.join('; '), r.hits, r.total].map(q).join(',')));
        download(`azimuth_bulk_${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'), 'text/csv');
    }

    function saveRow(r) {
        CaseFile.addSelector(r.sel);
        return CaseFile.addEvidence({
            title: `Bulk check: ${r.sel.value}`,
            text: [...r.facts.map(([k, v]) => `${k}: ${v}`), ...(r.flags.length ? ['', 'Red flags: ' + r.flags.join('; ')] : [])].join('\n'),
            tags: ['bulk', r.sel.type, ...(r.flags.length ? ['risk'] : [])],
            selector: r.sel.value,
        });
    }

    function setup() {
        $('#bulk-run').onclick = run;
        $('#bulk-stop').onclick = () => { stopFlag = true; };
        $('#bulk-csv').onclick = csv;
        $('#bulk-filter').addEventListener('input', debounce(render, 150));
        $('#bulk-to-case').onclick = async () => {
            const done = rows.filter(r => r.state === 'done');
            done.forEach(r => CaseFile.addSelector(r.sel));
            for (const r of done.filter(x => x.flags.length)) await saveRow(r);
            toast(`Added ${done.length} selectors to the case (${done.filter(x => x.flags.length).length} with red flags saved as evidence)`);
        };
        $('#bulk-table').addEventListener('click', e => {
            const b = e.target.closest('[data-bulk-save]');
            if (b) { saveRow(rows.find(r => r.n === +b.dataset.bulkSave)); b.disabled = true; b.textContent = '✓'; }
        });
        render();
    }

    function load(list) {
        $('#bulk-input').value = list.join('\n');
        showView('bulk');
    }

    return { setup, load };
})();

// ---------------- Lookalike domains ----------------
const Lookalikes = (() => {
    const KEYS = ['1234567890-', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    const near = {};
    KEYS.forEach((row, r) => [...row].forEach((ch, i) => {
        const n = [row[i - 1], row[i + 1], KEYS[r - 1]?.[i], KEYS[r + 1]?.[i]].filter(Boolean);
        near[ch] = n;
    }));
    const GLYPH = { o: ['0'], l: ['1', 'i'], i: ['1', 'l'], e: ['3'], a: ['4'], s: ['5'], g: ['9', 'q'], b: ['6'], m: ['rn', 'nn'], w: ['vv'], d: ['cl'], u: ['v'], c: ['e'], q: ['g'] };
    const CYR = { a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у', i: 'і' };
    const TLDS = ['com', 'net', 'org', 'co', 'io', 'info', 'biz', 'xyz', 'online', 'site', 'app', 'shop', 'store', 'top', 'cc', 'us', 'uk', 'co.uk', 'de', 'eu', 'live', 'support', 'help', 'services', 'cloud', 'tech', 'me', 'ai'];
    const AFFIX = ['login', 'secure', 'support', 'account', 'verify', 'my', 'online', 'help', 'mail', 'auth', 'portal', 'pay', 'billing', 'update', 'service'];

    function split(domain) {
        const p = domain.toLowerCase().split('.');
        const two = /^(co|com|org|net|gov|ac|edu)\.[a-z]{2}$/.test(p.slice(-2).join('.'));
        const tldParts = two ? 2 : 1;
        return { name: p.slice(-(tldParts + 1), -tldParts).join('.'), tld: p.slice(-tldParts).join('.') };
    }

    function generate(domain) {
        const { name, tld } = split(domain);
        const out = new Map();
        const add = (n, technique, t = tld) => {
            if (!n || n === name && t === tld || n.startsWith('-') || n.endsWith('-') || n.length < 2) return;
            const d = `${n}.${t}`;
            if (!out.has(d)) out.set(d, technique);
        };
        for (let i = 0; i < name.length; i++) {
            add(name.slice(0, i) + name.slice(i + 1), 'missing letter');
            add(name.slice(0, i) + name[i] + name.slice(i), 'doubled letter');
            if (i < name.length - 1) add(name.slice(0, i) + name[i + 1] + name[i] + name.slice(i + 2), 'swapped letters');
            for (const k of near[name[i]] || []) { add(name.slice(0, i) + k + name.slice(i + 1), 'typo (nearby key)'); add(name.slice(0, i) + k + name.slice(i), 'extra key'); }
            for (const g of GLYPH[name[i]] || []) add(name.slice(0, i) + g + name.slice(i + 1), 'lookalike characters');
            if (i > 0) add(name.slice(0, i) + '-' + name.slice(i), 'hyphen added');
            if ('aeiou'.includes(name[i])) for (const v of 'aeiou') if (v !== name[i]) add(name.slice(0, i) + v + name.slice(i + 1), 'vowel swapped');
            for (let b = 0; b < 8; b++) { const ch = String.fromCharCode(name.charCodeAt(i) ^ (1 << b)); if (/[a-z0-9]/.test(ch)) add(name.slice(0, i) + ch + name.slice(i + 1), 'bit flip'); }
        }
        for (const [two, one] of [['rn', 'm'], ['vv', 'w'], ['cl', 'd']]) if (name.includes(two)) add(name.replace(two, one), 'lookalike characters');
        for (const t of TLDS) if (t !== tld) add(name, 'different ending', t);
        for (const a of AFFIX) { add(`${name}-${a}`, 'added word'); add(`${a}-${name}`, 'added word'); add(`${name}${a}`, 'added word'); }
        add(`www${name}`, 'missing dot'); add(`www-${name}`, 'missing dot');
        // Internationalised (Cyrillic) homographs, converted to punycode.
        for (let i = 0; i < name.length; i++) {
            const cy = CYR[name[i]];
            if (!cy) continue;
            try { const host = new URL(`http://${name.slice(0, i)}${cy}${name.slice(i + 1)}.${tld}`).hostname; out.set(host, `homograph (Cyrillic “${cy}”)`); } catch { /* skip */ }
        }
        out.delete(domain);
        return [...out.entries()].slice(0, 450).map(([d, technique]) => ({ domain: d, technique }));
    }

    let state = { domain: null, list: [], running: false, stop: false };

    async function check(domain) {
        if (Settings.get('privacy')) return toast('Privacy mode is on: DNS checks are disabled.', 'err');
        state = { domain, list: generate(domain).map(x => ({ ...x, status: 'queued' })), running: true, stop: false };
        render();
        const queue = [...state.list];
        let done = 0;
        await Promise.all(Array.from({ length: 8 }, async () => {
            while (queue.length && !state.stop && state.domain === domain) {
                const x = queue.shift();
                try {
                    const j = await fetchJSON(`https://dns.google/resolve?name=${encodeURIComponent(x.domain)}&type=A`, { timeout: 8000 });
                    if (j.Status === 3) x.status = 'free';
                    else {
                        x.status = 'registered';
                        x.a = (j.Answer || []).filter(a => a.type === 1).map(a => a.data);
                        const mx = await fetchJSON(`https://dns.google/resolve?name=${encodeURIComponent(x.domain)}&type=MX`, { timeout: 8000 }).catch(() => ({}));
                        x.mx = (mx.Answer || []).map(a => a.data.split(' ').pop().replace(/\.$/, ''));
                    }
                } catch { x.status = 'error'; }
                done++;
                if (done % 10 === 0 || !queue.length) render();
            }
        }));
        state.running = false;
        render();
        const reg = state.list.filter(x => x.status === 'registered');
        CaseFile.log('lookalikes', `Lookalike check for ${domain}: ${reg.length} of ${state.list.length} variants registered`);
    }

    function render() {
        const box = $('#lookalike-panel');
        if (!box) return;
        const s = state;
        if (!s.domain) { box.innerHTML = ''; return; }
        const reg = s.list.filter(x => x.status === 'registered');
        const withMail = reg.filter(x => x.mx?.length);
        const done = s.list.filter(x => x.status !== 'queued').length;
        box.innerHTML = `
            <div class="card-head" style="margin-bottom:.4rem"><b>${s.running ? 'Checking' : 'Checked'} ${done} / ${s.list.length} lookalikes of ${esc(s.domain)}</b>
                <span class="muted small">${reg.length} registered, ${withMail.length} can receive email (common for phishing)</span><span class="spacer"></span>
                ${s.running ? '<button class="btn small" id="la-stop">Stop</button>' : ''}
                ${reg.length && !s.running ? '<button class="btn small primary" id="la-leads">Add registered ones as leads</button><button class="btn small" id="la-bulk">Check them all in Bulk</button><button class="btn small" id="la-csv">CSV</button>' : ''}</div>
            <div class="progress"><div style="width:${s.list.length ? Math.round(done / s.list.length * 100) : 0}%"></div></div>
            ${reg.length ? `<table class="data-table"><thead><tr><th>Domain</th><th>Trick used</th><th>Points to</th><th>Mail servers</th><th></th></tr></thead><tbody>
                ${reg.sort((a, b) => (b.mx?.length || 0) - (a.mx?.length || 0)).map(x => `<tr class="${x.mx?.length ? 'flagged' : ''}"><td class="mono">${esc(x.domain)}</td><td class="small">${esc(x.technique)}</td><td class="mono small">${esc((x.a || []).join(', ') || '-')}</td><td class="mono small">${esc((x.mx || []).join(', ') || '-')}</td><td><button class="btn small" data-follow="${esc(x.domain)}" data-type="domain">Investigate</button></td></tr>`).join('')}
            </tbody></table>` : `<p class="muted small">${s.running ? 'No registered lookalikes yet…' : 'None of the variants are registered.'}</p>`}`;
        $('#la-stop')?.addEventListener('click', () => { state.stop = true; });
        $('#la-leads')?.addEventListener('click', () => {
            CaseFile.addLeads(state.selector || { type: 'domain', value: s.domain }, reg.map(x => ({ type: 'domain', value: x.domain, via: `lookalike: ${x.technique}` })));
            toast(`${reg.length} lookalikes added to the link chart as leads`);
        });
        $('#la-bulk')?.addEventListener('click', () => Bulk.load(reg.map(x => x.domain)));
        $('#la-csv')?.addEventListener('click', () => download(`lookalikes_${s.domain}.csv`, ['domain,technique,a_records,mx_records', ...reg.map(x => [x.domain, x.technique, (x.a || []).join(' '), (x.mx || []).join(' ')].map(v => `"${v}"`).join(','))].join('\n'), 'text/csv'));
    }

    function show(domain) {
        if (state.domain === domain && state.list.length) return render();
        $('#lookalike-panel').innerHTML = `<p>Generate about ${generate(domain).length} misspellings, lookalike characters and other endings of <b>${esc(domain)}</b>, then check which exist (one DNS query each, via Google DNS).</p><div class="btn-row"><button class="btn primary" id="la-run">Find registered lookalikes</button></div>`;
        $('#la-run').onclick = () => check(domain);
    }

    return { show, generate };
})();
