// Case files: several cases, each with selectors, evidence (screenshots in IndexedDB), links/leads for the chart,
// timeline, places, analysis (requirements, judgments, ACH, legal basis, review), activity log, sharing and reports.
'use strict';

const selKey = s => `${s.type}:${String(s.value).toLowerCase()}`;
const INDEX_KEY = 'azimuth_cases';
const ACTIVE_KEY = 'azimuth_active_case';
const caseKey = id => `azimuth_case_${id}`;

const CaseFile = (() => {
    let c = null;

    function blank() {
        return {
            id: `AZ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            subject: '', analyst: Settings.get('analyst') || '', summary: '', created: new Date().toISOString(),
            selectors: [], evidence: [], activity: [], links: [], leads: {}, timeline: [], places: [], nextNo: 1,
            requirements: [], judgments: [], ach: { hypotheses: [], rows: [] }, legal: {}, review: null,
        };
    }

    function normalise(x) {
        const out = { ...blank(), ...x };
        for (const k of ['selectors', 'evidence', 'activity', 'links', 'timeline', 'places', 'requirements', 'judgments']) if (!Array.isArray(out[k])) out[k] = [];
        if (!out.leads || typeof out.leads !== 'object') out.leads = {};
        if (!out.ach || !Array.isArray(out.ach.hypotheses)) out.ach = { hypotheses: [], rows: [] };
        if (!out.legal) out.legal = {};
        let n = 1;
        out.evidence.slice().reverse().forEach(e => { if (!e.no) e.no = n; n = Math.max(n, e.no + 1); e.comments ||= []; e.reqs ||= []; });
        out.nextNo = Math.max(out.nextNo || 1, n);
        return out;
    }

    // ---------- multi-case storage ----------
    const index = () => Secure.get(INDEX_KEY, []);
    const setIndex = list => Secure.set(INDEX_KEY, list);

    function indexEntry(x) {
        return { id: x.id, subject: x.subject, created: x.created, updated: new Date().toISOString(), evidence: x.evidence.length, selectors: x.selectors.length, retention: x.legal?.retention || '', archived: index().find(i => i.id === x.id)?.archived || false };
    }

    async function init() {
        // Migrate v3.1 single case and v2 notes.
        const legacy = store.get('azimuth_case_v3', null);
        let list = index();
        if (legacy && !list.some(i => i.id === legacy.id)) {
            const lc = normalise(legacy);
            await Secure.set(caseKey(lc.id), lc);
            list = [...list, indexEntry(lc)];
            await setIndex(list);
            localStorage.removeItem('azimuth_case_v3');
            localStorage.setItem(ACTIVE_KEY, lc.id);
        }
        const oldNotes = store.get('osint_notes', []);
        let active = localStorage.getItem(ACTIVE_KEY);
        let data = active && list.some(i => i.id === active) ? await Secure.load(caseKey(active)) : null;
        if (!data) {
            const first = list.find(i => !i.archived) || list[0];
            data = first ? await Secure.load(caseKey(first.id)) : null;
        }
        c = normalise(data || blank());
        if (Array.isArray(oldNotes) && oldNotes.length) {
            for (const n of oldNotes) {
                const id = uid();
                c.evidence.unshift({ id, no: c.nextNo++, title: n.title || 'Imported note', text: n.text || '', source: '', tags: ['v2-import'], confidence: '', created: new Date().toISOString(), hasImage: !!n.image, comments: [], reqs: [] });
                if (n.image) await blobStore.set(id, n.image).catch(() => {});
            }
            try { localStorage.removeItem('osint_notes'); } catch { /* ignore */ }
        }
        save();
        checkRetention();
    }

    const changed = () => document.dispatchEvent(new CustomEvent('azimuth:case'));
    function save() {
        Secure.set(caseKey(c.id), c);
        const list = index().filter(i => i.id !== c.id);
        list.unshift(indexEntry(c));
        setIndex(list);
        localStorage.setItem(ACTIVE_KEY, c.id);
        updateChip();
        changed();
    }

    function updateChip() {
        $('#case-chip-name').textContent = c.subject || 'Untitled case';
        $('#evidence-count').textContent = c.evidence.length;
    }

    async function switchCase(id) {
        if (id === c.id) return;
        await Secure.flush();
        const data = await Secure.load(caseKey(id));
        if (!data) return toast('That case could not be opened.', 'err');
        c = normalise(data);
        localStorage.setItem(ACTIVE_KEY, c.id);
        render();
        changed();
        document.dispatchEvent(new CustomEvent('azimuth:case-switched'));
        toast(`Switched to “${c.subject || c.id}”`);
    }

    async function newCase(subject = '') {
        await Secure.flush();
        c = blank();
        c.subject = subject;
        save();
        render();
        document.dispatchEvent(new CustomEvent('azimuth:case-switched'));
        toast('New case started. Your other cases are kept in the case list.');
    }

    async function deleteCase(id) {
        const entry = index().find(i => i.id === id);
        if (!entry || !confirm(`Permanently delete “${entry.subject || entry.id}” and all its evidence? This cannot be undone.`)) return;
        const data = id === c.id ? c : await Secure.load(caseKey(id));
        for (const e of data?.evidence || []) for (const k of [e.id, `${e.id}:orig`, `${e.id}:html`]) await blobStore.del(k).catch(() => {});
        Secure.remove(caseKey(id));
        setIndex(index().filter(i => i.id !== id));
        if (id === c.id) {
            const next = index().find(i => !i.archived);
            if (next) await switchCase(next.id); else await newCase();
        }
        renderSwitcher();
    }

    function checkRetention() {
        const today = new Date().toISOString().slice(0, 10);
        const due = index().filter(i => i.retention && i.retention < today && !i.archived);
        if (due.length) setTimeout(() => toast(`${due.length} case(s) are past their retention date. Open the case list to review and delete them.`, 'err'), 1500);
    }

    async function renderSwitcher() {
        const q = ($('#cases-search').value || '').trim().toLowerCase();
        const showArchived = $('#cases-archived').checked;
        const today = new Date().toISOString().slice(0, 10);
        let list = index().filter(i => showArchived || !i.archived);
        let hits = {};
        if (q) {
            const matched = [];
            for (const i of index()) {
                const data = i.id === c.id ? c : await Secure.load(caseKey(i.id));
                if (!data) continue;
                const hay = [data.subject, data.summary, ...data.selectors.map(s => s.value), ...data.evidence.map(e => `${e.title} ${e.text} ${e.source}`)];
                const found = hay.filter(h => String(h || '').toLowerCase().includes(q));
                if (found.length) { matched.push(i); hits[i.id] = found.slice(0, 3); }
            }
            list = matched;
        }
        $('#cases-list').innerHTML = list.length ? list.map(i => `
            <div class="case-row ${i.id === c.id ? 'current' : ''}">
                <div>
                    <button class="case-open" data-case-open="${esc(i.id)}"><b>${esc(i.subject || 'Untitled case')}</b></button>
                    <div class="muted tiny mono">${esc(i.id)} · ${i.evidence} evidence · ${i.selectors} selectors · updated ${esc((i.updated || '').slice(0, 10))}
                        ${i.retention ? ` · ${i.retention < today ? '<span class="bad">past retention date</span>' : `delete after ${esc(i.retention)}`}` : ''}${i.archived ? ' · archived' : ''}</div>
                    ${hits[i.id] ? `<div class="small muted">…${hits[i.id].map(h => esc(String(h).slice(0, 90))).join(' · ')}</div>` : ''}
                </div>
                <div class="btn-row" style="margin:0">
                    ${i.id === c.id ? '<span class="status st-ok">open</span>' : `<button class="btn small" data-case-open="${esc(i.id)}">Open</button>`}
                    <button class="btn small ghost" data-case-archive="${esc(i.id)}">${i.archived ? 'Unarchive' : 'Archive'}</button>
                    <button class="btn small ghost" data-case-del="${esc(i.id)}">Delete</button>
                </div>
            </div>`).join('') : `<p class="muted small">${q ? 'No case mentions that.' : 'No cases.'}</p>`;
    }

    function openSwitcher() {
        $('#cases-modal').classList.remove('hidden');
        renderSwitcher();
        setTimeout(() => $('#cases-search').focus(), 30);
    }

    // ---------- activity / selectors / graph data ----------
    function log(kind, label, url = '') {
        if (!c) return;
        c.activity.unshift({ t: new Date().toISOString(), kind, label, url });
        if (c.activity.length > 3000) c.activity.length = 3000;
        Secure.set(caseKey(c.id), c);
        if (!$('#view-case').classList.contains('hidden')) renderActivity();
    }

    function addSelector(sel) {
        if (!c.selectors.some(s => selKey(s) === selKey(sel))) {
            c.selectors.push({ value: sel.value, type: sel.type, added: new Date().toISOString() });
            delete c.leads[selKey(sel)];
            save();
        }
    }

    function addLink(from, to, label) {
        if (!from || !to) return;
        const a = selKey(from), b = selKey(to);
        if (a === b || c.links.some(l => (l.from === a && l.to === b) || (l.from === b && l.to === a))) return;
        c.links.push({ from: a, to: b, label, t: new Date().toISOString() });
        save();
    }

    function addLeads(from, leads) {
        const fk = selKey(from);
        for (const l of leads) {
            const k = selKey(l);
            if (!c.selectors.some(s => selKey(s) === k) && !c.leads[k]) c.leads[k] = { type: l.type, value: l.value, via: l.via, from: fk };
            if (!c.links.some(x => (x.from === fk && x.to === k) || (x.from === k && x.to === fk))) c.links.push({ from: fk, to: k, label: l.via, t: new Date().toISOString() });
        }
        save();
    }

    function addTimeline(facts) {
        const seen = new Set(c.timeline.map(f => `${f.t}|${f.label}|${f.selector}`));
        for (const f of facts) { const k = `${f.t}|${f.label}|${f.selector}`; if (!seen.has(k)) { c.timeline.push(f); seen.add(k); } }
        c.timeline.sort((a, b) => a.t.localeCompare(b.t));
        save();
    }

    function addPlace(p) {
        if (!isFinite(p.lat) || !isFinite(p.lon)) return;
        if (c.places.some(x => Math.abs(x.lat - p.lat) < 1e-5 && Math.abs(x.lon - p.lon) < 1e-5 && x.label === p.label)) return;
        c.places.push({ ...p, t: new Date().toISOString() });
        save();
    }

    // ---------- evidence ----------
    async function addEvidence({ title, text = '', source = '', tags = [], confidence = '', reliability = '', credibility = '', reqs = [], imageDataUrl = null, selector = null, extra = {} }) {
        const id = uid();
        const ev = { id, no: c.nextNo++, title, text, source, tags, confidence, reliability, credibility, reqs, created: new Date().toISOString(), hasImage: !!imageDataUrl, comments: [], selector: selector || undefined, ...extra };
        if (imageDataUrl) {
            ev.imageSha256 = await digest('SHA-256', dataURLToBytes(imageDataUrl));
            await blobStore.set(id, imageDataUrl);
        }
        c.evidence.unshift(ev);
        save();
        log('evidence', `Added E${ev.no}: ${title}`, source);
        renderEvidence();
        toast(`Saved to case as E${ev.no}`);
        if (source && /^https?:/.test(source) && Settings.get('captureContext') !== false && !Settings.get('privacy')) EvidenceTools.captureContext(ev);
        return ev;
    }

    async function updateEvidence(id, patch, imageDataUrl) {
        const ev = c.evidence.find(e => e.id === id);
        if (!ev) return;
        Object.assign(ev, patch, { updated: new Date().toISOString() });
        if (imageDataUrl === null) { ev.hasImage = false; delete ev.imageSha256; await blobStore.del(id); }
        else if (imageDataUrl) { ev.hasImage = true; ev.imageSha256 = await digest('SHA-256', dataURLToBytes(imageDataUrl)); await blobStore.set(id, imageDataUrl); }
        save();
        renderEvidence();
    }

    async function removeEvidence(id) {
        const ev = c.evidence.find(e => e.id === id);
        if (!ev || !confirm(`Delete E${ev.no} "${ev.title}"?`)) return;
        c.evidence = c.evidence.filter(e => e.id !== id);
        for (const k of [id, `${id}:orig`, `${id}:html`]) await blobStore.del(k).catch(() => {});
        save();
        log('evidence', `Deleted E${ev.no}: ${ev.title}`);
        renderEvidence();
    }

    function addComment(id, text) {
        const ev = c.evidence.find(e => e.id === id);
        if (!ev || !text.trim()) return;
        ev.comments.push({ author: c.analyst || 'Analyst', text: text.trim(), t: new Date().toISOString() });
        save();
        renderEvidence();
    }

    const grade = e => (e.reliability || e.credibility ? `${e.reliability || '?'}${e.credibility || '?'}` : '');

    // ---------- rendering ----------
    function render() {
        $('#case-subject').value = c.subject;
        $('#case-analyst').value = c.analyst;
        $('#case-summary').value = c.summary;
        $('#case-ref').value = c.id;
        renderSelectors();
        renderEvidence();
        renderActivity();
        updateChip();
    }

    function renderSelectors() {
        $('#case-selectors').innerHTML = c.selectors.length
            ? c.selectors.map(s => `<button class="chip" data-investigate="${esc(s.value)}" data-type="${esc(s.type)}"><span class="chip-type">${esc(SELECTOR_TYPES[s.type]?.label || s.type)}</span>${esc(s.value)}</button>`).join('')
            : '<p class="muted small">Everything you investigate is added here automatically.</p>';
    }

    async function renderEvidence() {
        const board = $('#pin-board');
        const f = ($('#evidence-filter').value || '').toLowerCase();
        const list = c.evidence.filter(e => !f || [e.title, e.text, e.source, ...(e.tags || [])].join(' ').toLowerCase().includes(f));
        if (!list.length) {
            board.innerHTML = `<p class="muted small">${c.evidence.length ? 'Nothing matches the filter.' : 'No evidence yet. Use “Save” on a finding, “Save all findings”, or “+ Add evidence” (shortcut N). You can paste screenshots straight into the dialog.'}</p>`;
            return;
        }
        const reqName = id => c.requirements.find(r => r.id === id);
        board.innerHTML = list.map(e => `
            <article class="evidence" data-id="${esc(e.id)}">
                <div class="evidence-img" data-img="${esc(e.id)}">${e.hasImage ? '<span class="muted small">loading…</span>' : ''}</div>
                <div class="evidence-body">
                    <header>
                        <span class="evidence-no">E${e.no}</span>
                        <h4>${esc(e.title)}</h4>
                        <button class="btn small ghost" data-edit="${esc(e.id)}">Edit</button>
                        <button class="btn small ghost" data-del="${esc(e.id)}">Delete</button>
                    </header>
                    <div class="evidence-meta">
                        <span class="mono">${esc(fmtTime(e.created))}</span>
                        ${grade(e) ? `<span class="grade" title="Admiralty grade: source reliability ${esc(e.reliability || '?')}, information credibility ${esc(e.credibility || '?')}">${esc(grade(e))}</span>` : ''}
                        ${e.confidence ? `<span class="conf conf-${esc(e.confidence.toLowerCase())}">${esc(e.confidence)}</span>` : ''}
                        ${(e.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}
                        ${(e.reqs || []).map(r => reqName(r) ? `<span class="status st-input" title="${esc(reqName(r).text)}">answers R${c.requirements.indexOf(reqName(r)) + 1}</span>` : '').join('')}
                        ${e.redacted ? '<span class="status st-blocked">redacted</span>' : ''}
                    </div>
                    ${e.source ? `<a class="mono small" href="${esc(safeUrl(e.source))}" target="_blank" rel="noopener noreferrer" style="word-break:break-all">${esc(e.source)}</a>` : ''}
                    ${e.text ? `<pre class="evidence-text">${esc(e.text)}</pre>` : ''}
                    ${e.context ? `<div class="tiny muted mono">at capture: ${esc(e.context.host)} → ${esc((e.context.ips || []).join(', ') || 'no A record')}${e.context.registrar ? ` · registrar ${esc(e.context.registrar)}` : ''}</div>` : ''}
                    ${e.imageSha256 ? `<div class="mono tiny muted">screenshot SHA-256 ${esc(e.imageSha256)}${e.origSha256 ? ` · original (sealed) ${esc(e.origSha256)}` : ''}</div>` : ''}
                    ${e.archives?.length ? `<div class="tiny">${e.archives.map(a => `<a href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener noreferrer">${esc(a.service)} ${esc(a.t.slice(0, 10))}</a>`).join(' · ')}</div>` : ''}
                    ${e.ots ? `<div class="tiny ok">⧗ Timestamped ${esc(e.ots.t.slice(0, 10))} via OpenTimestamps (hash ${esc(e.ots.hash.slice(0, 12))}…) · <button class="linklike" data-ots-dl="${esc(e.id)}">download proof</button></div>` : ''}
                    <div class="btn-row" style="margin:.2rem 0 0">
                        ${e.source ? `<button class="btn small" data-preserve="${esc(e.id)}" title="Save the source page to the Wayback Machine and archive.today">⛁ Preserve page</button>${e.preserveRequested && !e.archives?.length ? `<button class="btn small" data-check-archive="${esc(e.id)}">Check archive</button>` : ''}` : ''}
                        ${!e.ots ? `<button class="btn small" data-ots="${esc(e.id)}" title="Prove this evidence existed now, using the Bitcoin blockchain (free, via OpenTimestamps)">⧗ Timestamp</button>` : ''}
                    </div>
                    <div class="comments">
                        ${(e.comments || []).map(cm => `<div class="comment"><b>${esc(cm.author)}</b><span class="muted tiny">${esc(fmtTime(cm.t))}</span><div>${esc(cm.text)}</div></div>`).join('')}
                        <form class="comment-form" data-comment="${esc(e.id)}"><input class="input input-sm" placeholder="Add a comment…" style="flex:1"><button class="btn small">Post</button></form>
                    </div>
                </div>
            </article>`).join('');
        for (const e of list.filter(x => x.hasImage)) {
            const slot = board.querySelector(`[data-img="${CSS.escape(e.id)}"]`);
            const src = await blobStore.get(e.id).catch(() => null);
            if (slot) slot.innerHTML = src ? `<a href="#" data-zoom="${esc(e.id)}"><img src="${esc(src)}" alt=""></a>` : '<span class="muted small">image missing</span>';
        }
    }

    function renderActivity() {
        $('#activity-log').innerHTML = c.activity.length
            ? c.activity.slice(0, 400).map(a => `<div class="act"><span class="mono tiny muted">${esc(fmtTime(a.t))}</span><span class="act-kind">${esc(a.kind)}</span><span class="act-label">${a.url ? `<a href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener noreferrer">${esc(a.label)}</a>` : esc(a.label)}</span></div>`).join('')
            : '<p class="muted small">Nothing logged yet.</p>';
    }

    // ---------- reports ----------
    async function withImages() {
        const ev = [];
        for (const e of c.evidence.slice().sort((a, b) => a.no - b.no)) ev.push({ ...e, image: e.hasImage ? await blobStore.get(e.id).catch(() => null) : null });
        return ev;
    }

    const fileBase = () => `${(c.subject || 'case').replace(/[^a-z0-9]+/gi, '_').slice(0, 40)}_${c.id}`;
    const TEMPLATE_TITLES = { standard: 'Investigation report', le: 'Intelligence report: exhibits and chain of custody', journalism: 'Research file: sources and verification', dd: 'Due diligence report' };
    const isRisk = e => (e.tags || []).some(t => /risk|sanction|pep|adverse|fraud|red.?flag|litigation|criminal/i.test(t));
    const needsCheck = e => !e.confidence || /possible|doubtful/i.test(e.confidence);
    const toolsUsed = () => [...new Set(c.activity.filter(a => a.url).map(a => safeHost(a.url)).filter(Boolean))].sort();
    const sourcesOf = ev => [...new Set(ev.map(e => e.source).filter(Boolean))];

    function evidenceTable(ev, exhibit) {
        return `<table><tr><th>${exhibit ? 'Exhibit' : 'No.'}</th><th>Description</th><th>Captured (UTC)</th><th>Grade</th><th>Confidence</th><th>SHA-256 (screenshot)</th></tr>
            ${ev.map(e => `<tr><td>${exhibit ? `${esc(c.id)}-E${e.no}` : `E${e.no}`}</td><td>${esc(e.title)}${e.source ? `<br><span class="pdf-small">${esc(e.source)}</span>` : ''}</td><td>${esc(fmtTime(e.created))}</td><td>${esc(grade(e) || '-')}</td><td>${esc(e.confidence || '-')}</td><td class="pdf-small">${esc(e.imageSha256 || '-')}${e.ots ? '<br>⧗ OpenTimestamps' : ''}</td></tr>`).join('') || '<tr><td colspan="6">None</td></tr>'}</table>`;
    }
    function evidenceDetail(ev, exhibit) {
        return ev.map(e => `<div class="pdf-ev">
            <h3>${exhibit ? `Exhibit ${esc(c.id)}-E${e.no}` : `E${e.no}`}. ${esc(e.title)}</h3>
            <p class="pdf-small">${esc(fmtTime(e.created))}${grade(e) ? ` · Grade ${esc(grade(e))}` : ''}${e.confidence ? ` · Confidence: ${esc(e.confidence)}` : ''}${e.tags?.length ? ` · ${e.tags.map(t => '#' + esc(t)).join(' ')}` : ''}</p>
            ${e.source ? `<p class="pdf-small">Source: ${esc(e.source)}</p>` : ''}
            ${e.context ? `<p class="pdf-small">At capture: ${esc(e.context.host)} resolved to ${esc((e.context.ips || []).join(', ') || 'no address')}${e.context.registrar ? `; registrar ${esc(e.context.registrar)}` : ''} (${esc(fmtTime(e.context.t))})</p>` : ''}
            ${e.archives?.length ? `<p class="pdf-small">Archived copies: ${e.archives.map(a => esc(a.url)).join(' ; ')}</p>` : ''}
            ${e.image ? `<img src="${esc(e.image)}" alt=""><p class="pdf-small">SHA-256 ${esc(e.imageSha256 || '')}${e.redacted ? ` (redacted copy; sealed original SHA-256 ${esc(e.origSha256 || '')})` : ''}</p>` : ''}
            ${e.ots ? `<p class="pdf-small">Timestamp: SHA-256 ${esc(e.ots.hash)} submitted to OpenTimestamps at ${esc(fmtTime(e.ots.t))}; proof file retained.</p>` : ''}
            ${e.text ? `<p class="pdf-pre">${esc(e.text)}</p>` : ''}
            ${(e.comments || []).length ? `<p class="pdf-small"><b>Comments:</b> ${e.comments.map(cm => `${esc(cm.author)} (${esc(fmtTime(cm.t))}): ${esc(cm.text)}`).join(' | ')}</p>` : ''}
        </div>`).join('') || '<p>No evidence recorded.</p>';
    }
    const timelineTable = () => `<table><tr><th>Date (UTC)</th><th>Event</th><th>Selector</th></tr>${c.timeline.map(f => `<tr><td>${esc(f.t.slice(0, 10))}</td><td>${esc(f.label)}</td><td>${esc(f.selector)}</td></tr>`).join('') || '<tr><td colspan="3">No dated facts recorded.</td></tr>'}</table>`;
    const selectorsList = () => `<ul>${c.selectors.map(s => `<li><b>${esc(SELECTOR_TYPES[s.type]?.label || s.type)}:</b> <code>${esc(s.value)}</code></li>`).join('') || '<li>None</li>'}</ul>`;
    const activityTable = (n = 300) => `<table><tr><th>Time (UTC)</th><th>Type</th><th>Action</th></tr>${c.activity.slice().reverse().slice(-n).map(a => `<tr><td>${esc(fmtTime(a.t))}</td><td>${esc(a.kind)}</td><td>${esc(a.label)}${a.url ? `<br><span class="pdf-small">${esc(a.url)}</span>` : ''}</td></tr>`).join('')}</table>`;
    const judgmentsBlock = () => c.judgments.length ? `<ol>${c.judgments.map(j => `<li><b>${esc(j.prob)}</b> (${esc(j.conf.toLowerCase())}): ${esc(j.text)}</li>`).join('')}</ol>` : '';
    const reqTable = () => c.requirements.length ? `<table><tr><th>No.</th><th>Requirement</th><th>Status</th><th>Evidence</th></tr>${c.requirements.map((r, i) => `<tr><td>R${i + 1}</td><td>${esc(r.text)}</td><td>${esc(r.status)}</td><td>${c.evidence.filter(e => e.reqs?.includes(r.id)).map(e => `E${e.no}`).join(', ') || '-'}</td></tr>`).join('')}</table>` : '';
    const placesTable = () => c.places.length ? `<table><tr><th>Location</th><th>Coordinates</th><th>Source</th></tr>${c.places.map(p => `<tr><td>${esc(p.label)}</td><td>${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</td><td>${esc(p.source || '')}</td></tr>`).join('')}</table>` : '';
    function achTable() {
        const a = c.ach;
        if (!a.hypotheses.length || !a.rows.length) return '';
        const score = Analysis.achScores();
        return `<table><tr><th>Evidence</th>${a.hypotheses.map(h => `<th>${esc(h.text)}</th>`).join('')}</tr>
            ${a.rows.map(r => `<tr><td>${esc(r.label)}</td>${a.hypotheses.map(h => `<td>${esc(r.scores?.[h.id] || '-')}</td>`).join('')}</tr>`).join('')}
            <tr><th>Inconsistency score</th>${a.hypotheses.map(h => `<th>${score[h.id]}</th>`).join('')}</tr></table>
            <p class="pdf-small">CC = very consistent, C = consistent, N = neutral, I = inconsistent, II = very inconsistent. Lower inconsistency is stronger.</p>`;
    }
    function legalBlock() {
        const l = c.legal || {};
        if (!Object.values(l).some(Boolean)) return '';
        return `<table>${[['Authority / legal basis', l.basis], ['Approved by', l.approved], ['Necessity', l.necessity], ['Proportionality & collateral intrusion', l.proportionality], ['Scope', l.scope], ['Delete data after', l.retention]].filter(r => r[1]).map(([k, v]) => `<tr><th style="width:200px">${esc(k)}</th><td class="pdf-pre">${esc(v)}</td></tr>`).join('')}</table>`;
    }
    const reviewBlock = () => c.review ? `<div class="pdf-box"><b>Peer review:</b> ${esc(c.review.outcome)} by ${esc(c.review.name)} on ${esc(fmtTime(c.review.t))}.${c.review.notes ? `<br>${esc(c.review.notes)}` : ''}</div>` : '';

    async function buildReportHTML(template) {
        const ev = await withImages();
        const graphImg = window.Graph ? Graph.exportDataURL() : null;
        const head = `
            <div class="pdf-head"><div class="pdf-logo">AZ</div><div><h1>${esc(c.subject || 'Untitled case')}</h1><p>${esc(TEMPLATE_TITLES[template])}</p></div></div>
            <table>
                <tr><th style="width:160px">Case ID</th><td>${esc(c.id)}</td></tr>
                <tr><th>Analyst</th><td>${esc(c.analyst || '-')}</td></tr>
                <tr><th>Case opened</th><td>${esc(fmtTime(c.created))}</td></tr>
                <tr><th>Report generated</th><td>${esc(fmtTime(new Date().toISOString()))}</td></tr>
                <tr><th>Selectors / evidence</th><td>${c.selectors.length} / ${ev.length}</td></tr>
                ${c.review ? `<tr><th>Peer review</th><td>${esc(c.review.outcome)}: ${esc(c.review.name)}, ${esc(c.review.t.slice(0, 10))}</td></tr>` : ''}
            </table>`;
        const chart = graphImg ? `<img class="pdf-graph" src="${graphImg}" alt="">` : '<p>No chart.</p>';
        let s = 0;
        const h = t => `<h2>${++s}. ${t}</h2>`;
        const opt = (title, html) => (html ? `${h(title)}${html}` : '');
        let body = '';
        if (template === 'le') {
            body = `
                ${opt('Key judgments', judgmentsBlock())}
                ${h('Summary')}<p class="pdf-pre">${esc(c.summary || 'Not provided.')}</p>
                ${opt('Authority, necessity and proportionality', legalBlock())}
                ${opt('Intelligence requirements', reqTable())}
                ${h('Subjects / selectors')}${selectorsList()}
                ${h('Exhibit list')}${evidenceTable(ev, true)}
                ${h('Chain of custody and handling')}
                <div class="pdf-box">All exhibits were captured from publicly accessible sources by the analyst named above using AZIMUTH, a browser-based tool. Each item was recorded with a UTC timestamp at the moment of capture. A SHA-256 hash was calculated for every screenshot when it was captured; where an exhibit was redacted, the hash of the sealed original is also recorded. Exhibits marked with OpenTimestamps were independently timestamped in the Bitcoin blockchain; the proof files are retained. Source grading uses the Admiralty (NATO) system: reliability A–F, credibility 1–6. Case data was held only in the analyst’s browser storage until this report was generated. No accounts were created and no non-public systems were accessed by the tool.</div>
                ${h('Methodology and tools used')}<p>Services queried or opened during the investigation (from the activity log):</p><ul>${toolsUsed().map(t => `<li>${esc(t)}</li>`).join('') || '<li>None recorded</li>'}</ul>
                ${opt('Analysis of competing hypotheses', achTable())}
                ${h('Link chart')}${chart}
                ${opt('Locations', placesTable())}
                ${h('Timeline')}${timelineTable()}
                ${h('Exhibits')}${evidenceDetail(ev, true)}
                ${h('Activity log (audit trail)')}${activityTable(1000)}
                ${reviewBlock()}
                ${h('Analyst declaration')}
                <div class="pdf-box">I confirm that the information in this report was obtained from open sources as described, that the exhibits are true copies of what was observed at the times stated, and that the report is accurate to the best of my knowledge.<br><br>Name: ${esc(c.analyst || '______________________')}<br><br>Signature: ______________________ &nbsp;&nbsp; Date: ______________</div>`;
        } else if (template === 'journalism') {
            const unverified = ev.filter(needsCheck);
            body = `
                ${opt('Key judgments', judgmentsBlock())}
                ${h('Summary')}<p class="pdf-pre">${esc(c.summary || 'Not provided.')}</p>
                ${opt('Research questions', reqTable())}
                ${h('Verification status')}
                <table><tr><th>No.</th><th>Claim / finding</th><th>Status</th><th>Grade</th><th>Source</th></tr>${ev.map(e => `<tr><td>E${e.no}</td><td>${esc(e.title)}</td><td>${esc(e.confidence || 'Unverified')}</td><td>${esc(grade(e) || '-')}</td><td class="pdf-small">${esc(e.source || '-')}</td></tr>`).join('') || '<tr><td colspan="5">None</td></tr>'}</table>
                ${h('Still to verify')}<ul>${unverified.map(e => `<li>E${e.no}: ${esc(e.title)} (${esc(e.confidence || 'no confidence set')})</li>`).join('') || '<li>Everything has a confidence of Probable or Confirmed.</li>'}</ul>
                ${opt('Competing explanations', achTable())}
                ${h('Sources')}<ol>${sourcesOf(ev).map(u => `<li class="pdf-small">${esc(u)}</li>`).join('') || '<li>No source links recorded.</li>'}</ol>
                ${h('Timeline')}${timelineTable()}
                ${opt('Locations', placesTable())}
                ${h('Connections')}${chart}
                ${h('Evidence')}${evidenceDetail(ev)}
                ${reviewBlock()}
                ${h('Research log')}${activityTable(300)}`;
        } else if (template === 'dd') {
            const risks = ev.filter(isRisk);
            const sanctions = ev.filter(e => (e.tags || []).some(t => /sanction|pep/i.test(t)));
            const screened = c.activity.filter(a => /opensanctions|offshoreleaks|aleph|opencorporates|companies house|gleif|sanction/i.test(a.label + ' ' + a.url));
            body = `
                ${opt('Key judgments', judgmentsBlock())}
                ${h('Conclusion')}<p class="pdf-pre">${esc(c.summary || 'Not provided.')}</p>
                ${opt('Scope and questions', reqTable())}
                ${h('Subject identifiers')}${selectorsList()}
                ${h('Risk findings')}${risks.length ? evidenceTable(risks) : '<p>No findings were tagged as a risk (tags: risk, sanctions, pep, adverse, fraud, litigation, criminal).</p>'}
                ${h('Sanctions, PEP and leaks screening')}
                <p>${sanctions.length ? `${sanctions.length} item(s) tagged sanctions/PEP:` : 'No sanctions or PEP matches were recorded as evidence.'}</p>${sanctions.length ? evidenceTable(sanctions) : ''}
                <p class="pdf-small">Screening sources opened: ${screened.length ? esc([...new Set(screened.map(a => a.label))].slice(0, 20).join('; ')) : 'none recorded in the activity log'}.</p>
                ${h('Timeline')}${timelineTable()}
                ${h('Relationships')}${chart}
                ${opt('Locations', placesTable())}
                ${h('All findings')}${evidenceDetail(ev)}
                ${reviewBlock()}
                ${h('Sources consulted')}<ul>${toolsUsed().map(t => `<li>${esc(t)}</li>`).join('') || '<li>None recorded</li>'}</ul>`;
        } else {
            body = `
                ${opt('Key judgments', judgmentsBlock())}
                ${c.summary ? `${h('Summary')}<p class="pdf-pre">${esc(c.summary)}</p>` : ''}
                ${opt('Requirements', reqTable())}
                ${h('Selectors')}${selectorsList()}
                ${h('Evidence index')}${evidenceTable(ev)}
                ${opt('Analysis of competing hypotheses', achTable())}
                ${h('Link chart')}${chart}
                ${opt('Locations', placesTable())}
                ${h('Timeline')}${timelineTable()}
                ${h('Evidence')}${evidenceDetail(ev)}
                ${reviewBlock()}
                ${h('Activity log')}${activityTable(300)}`;
        }
        return `${head}${body}<p class="pdf-foot">Generated by AZIMUTH · times are UTC · source grades use the Admiralty Code</p>`;
    }

    async function exportPDF() {
        if (!window.html2pdf) return toast('The PDF library is still loading or was blocked. Try again, or use Markdown.', 'err');
        const template = $('#report-template').value;
        const el = document.createElement('div');
        el.className = 'pdf-report';
        el.innerHTML = await buildReportHTML(template);
        const btn = $('#export-pdf-btn');
        btn.disabled = true;
        btn.textContent = 'Building PDF…';
        try {
            await html2pdf().set({ margin: 10, filename: `${fileBase()}_${template}.pdf`, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4' }, pagebreak: { mode: ['css', 'legacy'], avoid: ['.pdf-ev', 'tr', '.pdf-box'] } }).from(el).save();
            log('export', `Exported PDF (${TEMPLATE_TITLES[template]})`);
        } catch (err) {
            console.error(err);
            toast('PDF generation failed. See the browser console.', 'err');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Download PDF';
        }
    }

    function exportMarkdown() {
        const template = $('#report-template').value;
        const ev = c.evidence.slice().sort((a, b) => a.no - b.no);
        const L = [`# ${c.subject || 'Untitled case'}`, '', `*${TEMPLATE_TITLES[template]}*`, '', '| | |', '|---|---|', `| Case ID | ${c.id} |`, `| Analyst | ${c.analyst || '-'} |`, `| Opened | ${fmtTime(c.created)} |`, `| Generated | ${fmtTime(new Date().toISOString())} |`, ...(c.review ? [`| Peer review | ${c.review.outcome}: ${c.review.name}, ${c.review.t.slice(0, 10)} |`] : []), ''];
        if (c.judgments.length) L.push('## Key judgments', '', ...c.judgments.map((j, i) => `${i + 1}. **${j.prob}** (${j.conf.toLowerCase()}): ${j.text}`), '');
        if (c.summary) L.push('## Summary', '', c.summary, '');
        if (c.requirements.length) L.push('## Requirements', '', ...c.requirements.map((r, i) => `- **R${i + 1}** [${r.status}] ${r.text}: ${c.evidence.filter(e => e.reqs?.includes(r.id)).map(e => `E${e.no}`).join(', ') || 'no evidence yet'}`), '');
        if (template === 'le' && Object.values(c.legal).some(Boolean)) L.push('## Authority, necessity and proportionality', '', ...Object.entries(c.legal).filter(([, v]) => v).map(([k, v]) => `- **${k}:** ${v}`), '');
        L.push('## Selectors', '', ...(c.selectors.length ? c.selectors.map(s => `- **${SELECTOR_TYPES[s.type]?.label || s.type}:** \`${s.value}\``) : ['- none']), '');
        if (template === 'dd') L.push('## Risk findings', '', ...(ev.filter(isRisk).map(e => `- E${e.no}: ${e.title}`)), ev.some(isRisk) ? '' : '- none tagged', '');
        if (template === 'journalism') L.push('## Still to verify', '', ...(ev.filter(needsCheck).map(e => `- E${e.no}: ${e.title} (${e.confidence || 'unverified'})`)), '', '## Sources', '', ...sourcesOf(ev).map(u => `- <${u}>`), '');
        L.push('## Evidence index', '', `| ${template === 'le' ? 'Exhibit' : 'No.'} | Description | Captured (UTC) | Grade | Confidence | Screenshot SHA-256 |`, '|---|---|---|---|---|---|',
            ...ev.map(e => `| ${template === 'le' ? `${c.id}-E${e.no}` : `E${e.no}`} | ${e.title.replace(/\|/g, '\\|')} | ${fmtTime(e.created)} | ${grade(e) || '-'} | ${e.confidence || '-'} | ${e.imageSha256 ? '`' + e.imageSha256 + '`' : '-'} |`), '');
        if (c.ach.hypotheses.length && c.ach.rows.length) {
            const sc = Analysis.achScores();
            L.push('## Competing hypotheses', '', `| Evidence | ${c.ach.hypotheses.map(x => x.text).join(' | ')} |`, `|---|${c.ach.hypotheses.map(() => '---').join('|')}|`, ...c.ach.rows.map(r => `| ${r.label} | ${c.ach.hypotheses.map(x => r.scores?.[x.id] || '-').join(' | ')} |`), `| **Inconsistency** | ${c.ach.hypotheses.map(x => sc[x.id]).join(' | ')} |`, '');
        }
        L.push('## Timeline', '', '| Date | Event | Selector |', '|---|---|---|', ...c.timeline.map(f => `| ${f.t.slice(0, 10)} | ${f.label} | \`${f.selector}\` |`), '');
        if (c.places.length) L.push('## Locations', '', ...c.places.map(p => `- ${p.label}: ${p.lat}, ${p.lon} (${p.source || ''})`), '');
        L.push('## Connections', '', ...c.links.map(l => `- \`${l.from}\` → \`${l.to}\`${l.label ? ` (${l.label})` : ''}`), '');
        L.push('## Evidence', '');
        ev.forEach(e => {
            L.push(`### E${e.no}. ${e.title}`, '', `- Captured: ${fmtTime(e.created)}`);
            if (grade(e)) L.push(`- Grade: ${grade(e)}`);
            if (e.confidence) L.push(`- Confidence: ${e.confidence}`);
            if (e.source) L.push(`- Source: <${e.source}>`);
            if (e.archives?.length) L.push(`- Archived: ${e.archives.map(a => `<${a.url}>`).join(', ')}`);
            if (e.tags?.length) L.push(`- Tags: ${e.tags.map(t => '#' + t).join(' ')}`);
            if (e.imageSha256) L.push(`- Screenshot SHA-256: \`${e.imageSha256}\``);
            if (e.ots) L.push(`- OpenTimestamps: submitted ${fmtTime(e.ots.t)} for \`${e.ots.hash}\``);
            if (e.text) L.push('', '```', e.text, '```');
            (e.comments || []).forEach(cm => L.push(`> **${cm.author}** (${fmtTime(cm.t)}): ${cm.text}`));
            L.push('');
        });
        if (c.review) L.push('## Peer review', '', `${c.review.outcome} by ${c.review.name} on ${fmtTime(c.review.t)}.`, c.review.notes || '', '');
        if (template === 'le') L.push('## Methodology and tools used', '', ...toolsUsed().map(t => `- ${t}`), '', '## Analyst declaration', '', 'I confirm that the information in this report was obtained from open sources as described and that the exhibits are true copies of what was observed at the times stated.', '', `Name: ${c.analyst || '________'}  Signature: ________  Date: ________`, '');
        L.push('## Activity log', '', '| Time (UTC) | Type | Action |', '|---|---|---|', ...c.activity.slice().reverse().map(a => `| ${fmtTime(a.t)} | ${a.kind} | ${a.label.replace(/\|/g, '\\|')}${a.url ? ` (<${a.url}>)` : ''} |`));
        download(`${fileBase()}_${template}.md`, L.join('\n'), 'text/markdown');
        log('export', `Exported Markdown (${TEMPLATE_TITLES[template]})`);
    }

    async function casePayload() {
        return { format: 'azimuth-case', version: 3, exported: new Date().toISOString(), case: { ...c, evidence: await withImages() }, favorites: store.get('azimuth_favs', []) };
    }

    async function exportJSON() {
        download(`${fileBase()}.json`, JSON.stringify(await casePayload(), null, 2), 'application/json');
        log('export', 'Exported JSON backup');
    }

    // ---------- file encryption for sharing (separate passphrase from the vault) ----------
    async function deriveKey(pass, salt) {
        const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    }
    const b64 = buf => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
    const unb64 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0));

    async function exportEncrypted() {
        const pass = prompt('Choose a passphrase for this file (share it separately, e.g. by phone). At least 10 characters:');
        if (!pass) return;
        if (pass.length < 10) return toast('Use at least 10 characters.', 'err');
        if (prompt('Type the passphrase again:') !== pass) return toast('Passphrases did not match.', 'err');
        const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(pass, salt);
        const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(await casePayload())));
        download(`${fileBase()}.azcase`, JSON.stringify({ format: 'azimuth-case-encrypted', v: 1, kdf: 'PBKDF2-SHA256-310000', cipher: 'AES-256-GCM', salt: b64(salt), iv: b64(iv), data: b64(data) }), 'application/json');
        log('export', 'Exported encrypted case');
    }

    async function readCaseFile(file) {
        let j = JSON.parse(await file.text());
        if (j.format === 'azimuth-case-encrypted') {
            const pass = prompt('This case file is encrypted. Enter the passphrase:');
            if (!pass) throw new Error('No passphrase given');
            try {
                const key = await deriveKey(pass, unb64(j.salt));
                const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(j.iv) }, key, unb64(j.data));
                j = JSON.parse(new TextDecoder().decode(plain));
            } catch { throw new Error('Wrong passphrase or damaged file'); }
        }
        return j;
    }

    async function importCase(file, merge) {
        try {
            const j = await readCaseFile(file);
            let incoming = j.format === 'azimuth-case' ? j.case : null;
            if (!incoming && Array.isArray(j.notes)) incoming = { subject: j.subject, analyst: j.analyst, evidence: j.notes.map(n => ({ id: uid(), title: n.title, text: n.text, image: n.image?.startsWith('data:') ? n.image : null, tags: ['v2-import'], created: new Date().toISOString() })) };
            if (!incoming) throw new Error('Not an Azimuth case file');
            if (merge) { await mergeIn(incoming); save(); render(); log('import', `Merged case ${incoming.id || ''}`); return; }
            // Open as its own case (never overwrites the current one).
            await Secure.flush();
            const exists = index().some(i => i.id === incoming.id);
            if (exists && !confirm(`A case with ID ${incoming.id} is already in this browser. Replace it with the file’s version?`)) return;
            for (const e of incoming.evidence || []) { if (e.image) await blobStore.set(e.id, e.image); e.hasImage = !!e.image; delete e.image; }
            c = normalise({ ...blank(), ...incoming });
            if (Array.isArray(j.favorites) && !store.get('azimuth_favs', []).length) store.set('azimuth_favs', j.favorites);
            save();
            render();
            document.dispatchEvent(new CustomEvent('azimuth:case-switched'));
            log('import', `Opened case ${incoming.id || ''} from file`);
            toast('Case opened');
        } catch (err) {
            toast(`Could not open: ${err.message}`, 'err');
        }
    }

    async function mergeIn(x) {
        let added = 0;
        for (const s of x.selectors || []) if (!c.selectors.some(y => selKey(y) === selKey(s))) c.selectors.push(s);
        for (const e of (x.evidence || []).slice().reverse()) {
            const mine = c.evidence.find(y => y.id === e.id);
            if (mine) {
                const have = new Set((mine.comments || []).map(cm => cm.t + cm.text));
                (e.comments || []).forEach(cm => { if (!have.has(cm.t + cm.text)) mine.comments.push(cm); });
                mine.comments.sort((a, b) => a.t.localeCompare(b.t));
                continue;
            }
            if (e.image) await blobStore.set(e.id, e.image);
            const copy = { ...e, hasImage: !!e.image, no: c.nextNo++, comments: e.comments || [], reqs: [], tags: [...new Set([...(e.tags || []), `from:${x.analyst || x.id || 'teammate'}`])] };
            delete copy.image;
            c.evidence.unshift(copy);
            added++;
        }
        for (const l of x.links || []) if (!c.links.some(y => y.from === l.from && y.to === l.to)) c.links.push(l);
        for (const [k, v] of Object.entries(x.leads || {})) if (!c.leads[k] && !c.selectors.some(s => selKey(s) === k)) c.leads[k] = v;
        for (const p of x.places || []) addPlace(p);
        for (const r of x.requirements || []) if (!c.requirements.some(y => y.id === r.id)) c.requirements.push(r);
        for (const jd of x.judgments || []) if (!c.judgments.some(y => y.id === jd.id)) c.judgments.push(jd);
        addTimeline(x.timeline || []);
        const seen = new Set(c.activity.map(a => a.t + a.label));
        (x.activity || []).forEach(a => { if (!seen.has(a.t + a.label)) c.activity.push({ ...a, label: `[${x.analyst || 'teammate'}] ${a.label}` }); });
        c.activity.sort((a, b) => b.t.localeCompare(a.t));
        toast(`${added} new evidence item(s) merged`);
    }

    function nameIfUntitled(v) {
        if (c.subject) return;
        c.subject = v;
        save();
        $('#case-subject').value = v;
    }

    // ---------- evidence modal ----------
    let editingId = null;
    let pendingImage;
    let pendingOriginal = null;

    function openModal(prefill = {}, id = null) {
        editingId = id;
        pendingImage = undefined;
        pendingOriginal = null;
        const ev = id ? c.evidence.find(e => e.id === id) : null;
        const d = ev || prefill;
        $('#modal-title').textContent = ev ? `Edit E${ev.no}` : 'Add evidence';
        $('#note-title').value = d.title || '';
        $('#note-source').value = d.source || '';
        $('#note-text').value = d.text || '';
        $('#note-tags').value = (d.tags || []).join(', ');
        $('#note-confidence').value = d.confidence || '';
        $('#note-reliability').value = d.reliability || '';
        $('#note-credibility').value = d.credibility || '';
        $('#note-reqs').innerHTML = c.requirements.map((r, i) => `<option value="${esc(r.id)}" ${(d.reqs || []).includes(r.id) ? 'selected' : ''}>R${i + 1}: ${esc(r.text.slice(0, 80))}</option>`).join('') || '<option disabled>No requirements yet (add them under Analysis &amp; review)</option>';
        $('#snapshot-preview-container').classList.add('hidden');
        if (ev?.hasImage) blobStore.get(ev.id).then(src => src && showPreview(src, ev.imageSha256));
        if (prefill.imageDataUrl) setImage(prefill.imageDataUrl);
        $('#note-modal').classList.remove('hidden');
        setTimeout(() => $('#note-title').focus(), 30);
    }
    function showPreview(src, sha) {
        $('#snapshot-preview').src = src;
        $('#snapshot-hash').textContent = sha ? `SHA-256 ${sha}` : '';
        $('#snapshot-preview-container').classList.remove('hidden');
    }
    async function setImage(dataUrl) { pendingImage = dataUrl; showPreview(dataUrl, await digest('SHA-256', dataURLToBytes(dataUrl))); }
    async function handleImageFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        if (file.size > 15e6) return toast('Image is over 15 MB. Crop or compress it first.', 'err');
        setImage(await fileToDataURL(file));
    }
    async function saveModal() {
        const title = $('#note-title').value.trim();
        if (!title) { $('#note-title').focus(); return toast('Give it a title', 'err'); }
        const data = {
            title, source: $('#note-source').value.trim(), text: $('#note-text').value,
            tags: $('#note-tags').value.split(',').map(t => t.trim()).filter(Boolean),
            confidence: $('#note-confidence').value, reliability: $('#note-reliability').value, credibility: $('#note-credibility').value,
            reqs: [...$('#note-reqs').selectedOptions].map(o => o.value).filter(Boolean),
        };
        let ev;
        if (editingId) { await updateEvidence(editingId, data, pendingImage); ev = c.evidence.find(e => e.id === editingId); }
        else ev = await addEvidence({ ...data, imageDataUrl: pendingImage || null });
        if (pendingOriginal && ev) {
            await blobStore.set(`${ev.id}:orig`, pendingOriginal.dataUrl);
            ev.redacted = true;
            ev.origSha256 = pendingOriginal.sha;
            save();
            renderEvidence();
        }
        closeModal();
    }
    const closeModal = () => $('#note-modal').classList.add('hidden');

    function setup() {
        render();
        $('#case-subject').addEventListener('input', debounce(e => { c.subject = e.target.value; save(); }, 300));
        $('#case-analyst').addEventListener('input', debounce(e => { c.analyst = e.target.value; Settings.set('analyst', e.target.value); save(); }, 300));
        $('#case-summary').addEventListener('input', debounce(e => { c.summary = e.target.value; save(); }, 400));
        $('#evidence-filter').addEventListener('input', debounce(renderEvidence, 150));
        $('#add-note-btn').onclick = () => openModal();
        $('#export-json-btn').onclick = exportJSON;
        $('#export-md-btn').onclick = exportMarkdown;
        $('#export-pdf-btn').onclick = exportPDF;
        $('#export-enc-btn').onclick = exportEncrypted;
        $('#import-case-input').onchange = e => { if (e.target.files[0]) importCase(e.target.files[0], false); e.target.value = ''; };
        $('#merge-case-input').onchange = e => { if (e.target.files[0]) importCase(e.target.files[0], true); e.target.value = ''; };
        $('#new-case-btn').textContent = '+ New case';
        $('#new-case-btn').classList.remove('danger');
        $('#new-case-btn').onclick = () => newCase();
        $('#clear-activity').onclick = () => { if (confirm('Clear the activity log?')) { c.activity = []; save(); renderActivity(); } };
        $('#report-template').value = store.get('azimuth_report_template', 'standard');
        $('#report-template').onchange = e => store.set('azimuth_report_template', e.target.value);

        // Case switcher
        $('#case-chip').onclick = openSwitcher;
        $('#cases-close').onclick = () => $('#cases-modal').classList.add('hidden');
        $('#cases-modal').addEventListener('click', e => { if (e.target.id === 'cases-modal') $('#cases-modal').classList.add('hidden'); });
        $('#cases-new').onclick = async () => { await newCase(); $('#cases-modal').classList.add('hidden'); showView('investigate'); };
        $('#cases-search').addEventListener('input', debounce(renderSwitcher, 250));
        $('#cases-archived').onchange = renderSwitcher;
        $('#cases-list').addEventListener('click', async e => {
            const o = e.target.closest('[data-case-open]'), a = e.target.closest('[data-case-archive]'), d = e.target.closest('[data-case-del]');
            if (o) { await switchCase(o.dataset.caseOpen); $('#cases-modal').classList.add('hidden'); }
            if (a) { setIndex(index().map(i => (i.id === a.dataset.caseArchive ? { ...i, archived: !i.archived } : i))); renderSwitcher(); }
            if (d) deleteCase(d.dataset.caseDel);
        });

        $('#pin-board').addEventListener('click', async e => {
            const t = e.target.closest('[data-edit],[data-del],[data-zoom]');
            if (!t) return;
            e.preventDefault();
            if (t.dataset.edit) openModal({}, t.dataset.edit);
            if (t.dataset.del) removeEvidence(t.dataset.del);
            if (t.dataset.zoom) {
                const src = await blobStore.get(t.dataset.zoom);
                const w = window.open();
                if (w) { w.document.title = 'Evidence'; w.document.body.style.cssText = 'margin:0;background:#111;display:flex;justify-content:center'; const img = w.document.createElement('img'); img.src = src; img.style.maxWidth = '100%'; w.document.body.appendChild(img); }
            }
        });
        $('#pin-board').addEventListener('submit', e => {
            const f = e.target.closest('[data-comment]');
            if (!f) return;
            e.preventDefault();
            addComment(f.dataset.comment, f.querySelector('input').value);
        });

        $('#close-modal').onclick = closeModal;
        $('#save-note').onclick = saveModal;
        $('#note-modal').addEventListener('click', e => { if (e.target.id === 'note-modal') closeModal(); });
        $('#note-image-file').onchange = e => handleImageFile(e.target.files[0]);
        $('#remove-snapshot-btn').onclick = () => { pendingImage = null; pendingOriginal = null; $('#snapshot-preview-container').classList.add('hidden'); };
        $('#redact-btn').onclick = async () => {
            const src = $('#snapshot-preview').src;
            if (!src) return;
            const result = await EvidenceTools.redact(src);
            if (!result) return;
            if (!pendingOriginal) pendingOriginal = { dataUrl: src, sha: await digest('SHA-256', dataURLToBytes(src)) };
            setImage(result);
        };
        $('#note-modal').addEventListener('paste', e => {
            for (const item of e.clipboardData?.items || []) if (item.kind === 'file') { handleImageFile(item.getAsFile()); e.preventDefault(); }
        });
        const drop = $('#note-drop');
        drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('over'));
        drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); handleImageFile(e.dataTransfer.files[0]); });
    }

    return {
        init, setup, log, save, nameIfUntitled, buildReportHTML, addSelector, addLink, addLeads, addTimeline, addPlace, addEvidence, updateEvidence,
        openModal, closeModal, saveModal, render, renderEvidence, exportPDF, exportMarkdown, exportJSON, openSwitcher, switchCase, newCase, grade,
        index, get data() { return c; },
    };
})();
