// Case file: selectors, evidence (screenshots in IndexedDB), links/leads for the chart, timeline,
// activity log, comments, merge/encrypted sharing, and report templates.
'use strict';

const CASE_KEY = 'azimuth_case_v3';
const selKey = s => `${s.type}:${String(s.value).toLowerCase()}`;

const CaseFile = (() => {
    let c = normalise(load());

    function blank() {
        return { id: `AZ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, subject: '', analyst: '', summary: '', created: new Date().toISOString(), selectors: [], evidence: [], activity: [], links: [], leads: {}, timeline: [], nextNo: 1 };
    }

    function normalise(x) {
        const b = blank();
        const out = { ...b, ...x };
        for (const k of ['selectors', 'evidence', 'activity', 'links', 'timeline']) if (!Array.isArray(out[k])) out[k] = [];
        if (!out.leads || typeof out.leads !== 'object') out.leads = {};
        // Number evidence (oldest first) if older data has no numbers.
        let n = 1;
        out.evidence.slice().reverse().forEach(e => { if (!e.no) e.no = n; n = Math.max(n, e.no + 1); e.comments ||= []; });
        out.nextNo = Math.max(out.nextNo || 1, n);
        return out;
    }

    function load() {
        const saved = store.get(CASE_KEY, null);
        if (saved) return saved;
        const fresh = blank();
        const old = store.get('osint_notes', []);
        if (Array.isArray(old) && old.length) {
            for (const n of old) {
                const id = uid();
                fresh.evidence.unshift({ id, title: n.title || 'Imported note', text: n.text || '', source: '', tags: ['v2-import'], confidence: '', created: new Date().toISOString(), hasImage: !!n.image });
                if (n.image) blobStore.set(id, n.image).catch(() => {});
            }
            try { localStorage.removeItem('osint_notes'); } catch { /* ignore */ }
        }
        return fresh;
    }

    const changed = () => document.dispatchEvent(new CustomEvent('azimuth:case'));
    const save = () => { store.set(CASE_KEY, c); updateChip(); changed(); };

    function updateChip() {
        $('#case-chip-name').textContent = c.subject || 'Untitled case';
        $('#evidence-count').textContent = c.evidence.length;
    }

    function log(kind, label, url = '') {
        c.activity.unshift({ t: new Date().toISOString(), kind, label, url });
        if (c.activity.length > 3000) c.activity.length = 3000;
        store.set(CASE_KEY, c);
        if (!$('#view-case').classList.contains('hidden')) renderActivity();
    }

    // ---------- selectors, links, leads, timeline ----------
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
        let n = 0;
        for (const l of leads) {
            const k = selKey(l);
            if (!c.selectors.some(s => selKey(s) === k) && !c.leads[k]) { c.leads[k] = { type: l.type, value: l.value, via: l.via, from: fk }; n++; }
            if (!c.links.some(x => (x.from === fk && x.to === k) || (x.from === k && x.to === fk))) c.links.push({ from: fk, to: k, label: l.via, t: new Date().toISOString() });
        }
        save();
        return n;
    }

    function addTimeline(facts) {
        const seen = new Set(c.timeline.map(f => `${f.t}|${f.label}|${f.selector}`));
        for (const f of facts) {
            const k = `${f.t}|${f.label}|${f.selector}`;
            if (!seen.has(k)) { c.timeline.push(f); seen.add(k); }
        }
        c.timeline.sort((a, b) => a.t.localeCompare(b.t));
        save();
    }

    // ---------- evidence ----------
    async function addEvidence({ title, text = '', source = '', tags = [], confidence = '', imageDataUrl = null, selector = null }) {
        const id = uid();
        const ev = { id, no: c.nextNo++, title, text, source, tags, confidence, created: new Date().toISOString(), hasImage: !!imageDataUrl, comments: [], selector: selector || undefined };
        if (imageDataUrl) {
            ev.imageSha256 = await digest('SHA-256', dataURLToBytes(imageDataUrl));
            await blobStore.set(id, imageDataUrl);
        }
        c.evidence.unshift(ev);
        save();
        log('evidence', `Added E${ev.no}: ${title}`, source);
        renderEvidence();
        toast(`Saved to case as E${ev.no}`);
        return ev;
    }

    async function updateEvidence(id, patch, imageDataUrl) {
        const ev = c.evidence.find(e => e.id === id);
        if (!ev) return;
        Object.assign(ev, patch, { updated: new Date().toISOString() });
        if (imageDataUrl === null) { ev.hasImage = false; delete ev.imageSha256; await blobStore.del(id); }
        else if (imageDataUrl) { ev.hasImage = true; ev.imageSha256 = await digest('SHA-256', dataURLToBytes(imageDataUrl)); await blobStore.set(id, imageDataUrl); }
        save();
        log('evidence', `Edited E${ev.no}: ${ev.title}`);
        renderEvidence();
    }

    async function removeEvidence(id) {
        const ev = c.evidence.find(e => e.id === id);
        if (!ev || !confirm(`Delete E${ev.no} "${ev.title}"?`)) return;
        c.evidence = c.evidence.filter(e => e.id !== id);
        await blobStore.del(id).catch(() => {});
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
                        ${e.confidence ? `<span class="conf conf-${esc(e.confidence.toLowerCase())}">${esc(e.confidence)}</span>` : ''}
                        ${(e.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}
                    </div>
                    ${e.source ? `<a class="mono small" href="${esc(safeUrl(e.source))}" target="_blank" rel="noopener noreferrer" style="word-break:break-all">${esc(e.source)}</a>` : ''}
                    ${e.text ? `<pre class="evidence-text">${esc(e.text)}</pre>` : ''}
                    ${e.imageSha256 ? `<div class="mono tiny muted">screenshot SHA-256 ${esc(e.imageSha256)}</div>` : ''}
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
        return `<table><tr><th>${exhibit ? 'Exhibit' : 'No.'}</th><th>Description</th><th>Captured (UTC)</th><th>Confidence</th><th>SHA-256 (screenshot)</th></tr>
            ${ev.map(e => `<tr><td>${exhibit ? `${esc(c.id)}-E${e.no}` : `E${e.no}`}</td><td>${esc(e.title)}${e.source ? `<br><span class="pdf-small">${esc(e.source)}</span>` : ''}</td><td>${esc(fmtTime(e.created))}</td><td>${esc(e.confidence || '-')}</td><td class="pdf-small">${esc(e.imageSha256 || '-')}</td></tr>`).join('') || '<tr><td colspan="5">None</td></tr>'}</table>`;
    }
    function evidenceDetail(ev, exhibit) {
        return ev.map(e => `<div class="pdf-ev">
            <h3>${exhibit ? `Exhibit ${esc(c.id)}-E${e.no}` : `E${e.no}`}. ${esc(e.title)}</h3>
            <p class="pdf-small">${esc(fmtTime(e.created))}${e.confidence ? ` · Confidence: ${esc(e.confidence)}` : ''}${e.tags?.length ? ` · ${e.tags.map(t => '#' + esc(t)).join(' ')}` : ''}</p>
            ${e.source ? `<p class="pdf-small">Source: ${esc(e.source)}</p>` : ''}
            ${e.image ? `<img src="${esc(e.image)}" alt=""><p class="pdf-small">SHA-256 ${esc(e.imageSha256 || '')}</p>` : ''}
            ${e.text ? `<p class="pdf-pre">${esc(e.text)}</p>` : ''}
            ${(e.comments || []).length ? `<p class="pdf-small"><b>Comments:</b> ${e.comments.map(cm => `${esc(cm.author)} (${esc(fmtTime(cm.t))}): ${esc(cm.text)}`).join(' | ')}</p>` : ''}
        </div>`).join('') || '<p>No evidence recorded.</p>';
    }
    const timelineTable = () => `<table><tr><th>Date (UTC)</th><th>Event</th><th>Selector</th></tr>${c.timeline.map(f => `<tr><td>${esc(f.t.slice(0, 10))}</td><td>${esc(f.label)}</td><td>${esc(f.selector)}</td></tr>`).join('') || '<tr><td colspan="3">No dated facts recorded.</td></tr>'}</table>`;
    const selectorsList = () => `<ul>${c.selectors.map(s => `<li><b>${esc(SELECTOR_TYPES[s.type]?.label || s.type)}:</b> <code>${esc(s.value)}</code></li>`).join('') || '<li>None</li>'}</ul>`;
    const activityTable = (n = 300) => `<table><tr><th>Time (UTC)</th><th>Type</th><th>Action</th></tr>${c.activity.slice().reverse().slice(-n).map(a => `<tr><td>${esc(fmtTime(a.t))}</td><td>${esc(a.kind)}</td><td>${esc(a.label)}${a.url ? `<br><span class="pdf-small">${esc(a.url)}</span>` : ''}</td></tr>`).join('')}</table>`;

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
            </table>`;
        const chart = graphImg ? `<img class="pdf-graph" src="${graphImg}" alt="">` : '<p>No chart.</p>';
        let body = '';
        let s = 0;
        const h = t => `<h2>${++s}. ${t}</h2>`;
        if (template === 'le') {
            body = `
                ${h('Summary')}<p class="pdf-pre">${esc(c.summary || 'Not provided.')}</p>
                ${h('Subjects / selectors')}${selectorsList()}
                ${h('Exhibit list')}${evidenceTable(ev, true)}
                ${h('Chain of custody and handling')}
                <div class="pdf-box">All exhibits were captured from publicly accessible sources by the analyst named above using AZIMUTH, a browser-based tool. Each item was recorded with a UTC timestamp at the moment of capture. A SHA-256 hash was calculated for every screenshot when it was captured; the hashes listed here allow later verification that images have not been altered. Case data was held only in the analyst’s browser storage until this report was generated. No accounts were created and no non-public systems were accessed by the tool.</div>
                ${h('Methodology and tools used')}<p>Services queried or opened during the investigation (from the activity log):</p><ul>${toolsUsed().map(t => `<li>${esc(t)}</li>`).join('') || '<li>None recorded</li>'}</ul>
                ${h('Link chart')}${chart}
                ${h('Timeline')}${timelineTable()}
                ${h('Exhibits')}${evidenceDetail(ev, true)}
                ${h('Activity log (audit trail)')}${activityTable(1000)}
                ${h('Analyst declaration')}
                <div class="pdf-box">I confirm that the information in this report was obtained from open sources as described, that the exhibits are true copies of what was observed at the times stated, and that the report is accurate to the best of my knowledge.<br><br>Name: ${esc(c.analyst || '______________________')}<br><br>Signature: ______________________ &nbsp;&nbsp; Date: ______________</div>`;
        } else if (template === 'journalism') {
            const unverified = ev.filter(needsCheck);
            body = `
                ${h('Summary')}<p class="pdf-pre">${esc(c.summary || 'Not provided.')}</p>
                ${h('Verification status')}
                <table><tr><th>No.</th><th>Claim / finding</th><th>Status</th><th>Source</th></tr>${ev.map(e => `<tr><td>E${e.no}</td><td>${esc(e.title)}</td><td>${esc(e.confidence || 'Unverified')}</td><td class="pdf-small">${esc(e.source || '-')}</td></tr>`).join('') || '<tr><td colspan="4">None</td></tr>'}</table>
                ${h('Still to verify')}<ul>${unverified.map(e => `<li>E${e.no}: ${esc(e.title)} (${esc(e.confidence || 'no confidence set')})</li>`).join('') || '<li>Everything has a confidence of Probable or Confirmed.</li>'}</ul>
                ${h('Sources')}<ol>${sourcesOf(ev).map(u => `<li class="pdf-small">${esc(u)}</li>`).join('') || '<li>No source links recorded.</li>'}</ol>
                ${h('Timeline')}${timelineTable()}
                ${h('Connections')}${chart}
                ${h('Evidence')}${evidenceDetail(ev)}
                ${h('Research log')}${activityTable(300)}`;
        } else if (template === 'dd') {
            const risks = ev.filter(isRisk);
            const sanctions = ev.filter(e => (e.tags || []).some(t => /sanction|pep/i.test(t)));
            const screened = c.activity.filter(a => /opensanctions|offshoreleaks|aleph|opencorporates|companies house|sanction/i.test(a.label + ' ' + a.url));
            body = `
                ${h('Conclusion')}<p class="pdf-pre">${esc(c.summary || 'Not provided.')}</p>
                ${h('Subject identifiers')}${selectorsList()}
                ${h('Risk findings')}${risks.length ? evidenceTable(risks) : '<p>No findings were tagged as a risk (tags: risk, sanctions, pep, adverse, fraud, litigation, criminal).</p>'}
                ${h('Sanctions, PEP and leaks screening')}
                <p>${sanctions.length ? `${sanctions.length} item(s) tagged sanctions/PEP:` : 'No sanctions or PEP matches were recorded as evidence.'}</p>${sanctions.length ? evidenceTable(sanctions) : ''}
                <p class="pdf-small">Screening sources opened: ${screened.length ? esc([...new Set(screened.map(a => a.label))].slice(0, 20).join('; ')) : 'none recorded in the activity log'}.</p>
                ${h('Timeline')}${timelineTable()}
                ${h('Relationships')}${chart}
                ${h('All findings')}${evidenceDetail(ev)}
                ${h('Sources consulted')}<ul>${toolsUsed().map(t => `<li>${esc(t)}</li>`).join('') || '<li>None recorded</li>'}</ul>`;
        } else {
            body = `
                ${c.summary ? `${h('Summary')}<p class="pdf-pre">${esc(c.summary)}</p>` : ''}
                ${h('Selectors')}${selectorsList()}
                ${h('Evidence index')}${evidenceTable(ev)}
                ${h('Link chart')}${chart}
                ${h('Timeline')}${timelineTable()}
                ${h('Evidence')}${evidenceDetail(ev)}
                ${h('Activity log')}${activityTable(300)}`;
        }
        return `${head}${body}<p class="pdf-foot">Generated by AZIMUTH · times are UTC</p>`;
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
        const L = [`# ${c.subject || 'Untitled case'}`, '', `*${TEMPLATE_TITLES[template]}*`, '', '| | |', '|---|---|', `| Case ID | ${c.id} |`, `| Analyst | ${c.analyst || '-'} |`, `| Opened | ${fmtTime(c.created)} |`, `| Generated | ${fmtTime(new Date().toISOString())} |`, ''];
        if (c.summary) L.push('## Summary', '', c.summary, '');
        L.push('## Selectors', '', ...(c.selectors.length ? c.selectors.map(s => `- **${SELECTOR_TYPES[s.type]?.label || s.type}:** \`${s.value}\``) : ['- none']), '');
        if (template === 'dd') L.push('## Risk findings', '', ...(ev.filter(isRisk).map(e => `- E${e.no}: ${e.title}`)), ev.some(isRisk) ? '' : '- none tagged', '');
        if (template === 'journalism') L.push('## Still to verify', '', ...(ev.filter(needsCheck).map(e => `- E${e.no}: ${e.title} (${e.confidence || 'unverified'})`)), '', '## Sources', '', ...sourcesOf(ev).map(u => `- <${u}>`), '');
        L.push('## Evidence index', '', `| ${template === 'le' ? 'Exhibit' : 'No.'} | Description | Captured (UTC) | Confidence | Screenshot SHA-256 |`, '|---|---|---|---|---|',
            ...ev.map(e => `| ${template === 'le' ? `${c.id}-E${e.no}` : `E${e.no}`} | ${e.title.replace(/\|/g, '\\|')} | ${fmtTime(e.created)} | ${e.confidence || '-'} | ${e.imageSha256 ? '`' + e.imageSha256 + '`' : '-'} |`), '');
        L.push('## Timeline', '', '| Date | Event | Selector |', '|---|---|---|', ...c.timeline.map(f => `| ${f.t.slice(0, 10)} | ${f.label} | \`${f.selector}\` |`), '');
        L.push('## Connections', '', ...c.links.map(l => `- \`${l.from}\` → \`${l.to}\`${l.label ? ` (${l.label})` : ''}`), '');
        L.push('## Evidence', '');
        ev.forEach(e => {
            L.push(`### E${e.no}. ${e.title}`, '', `- Captured: ${fmtTime(e.created)}`);
            if (e.confidence) L.push(`- Confidence: ${e.confidence}`);
            if (e.source) L.push(`- Source: <${e.source}>`);
            if (e.tags?.length) L.push(`- Tags: ${e.tags.map(t => '#' + t).join(' ')}`);
            if (e.imageSha256) L.push(`- Screenshot SHA-256: \`${e.imageSha256}\``);
            if (e.text) L.push('', '```', e.text, '```');
            (e.comments || []).forEach(cm => L.push(`> **${cm.author}** (${fmtTime(cm.t)}): ${cm.text}`));
            L.push('');
        });
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

    // ---------- encryption (AES-GCM, key from passphrase with PBKDF2) ----------
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
            if (merge) await mergeIn(incoming);
            else {
                if (!confirm(`Replace the current case with "${incoming.subject || incoming.id}"? Download a backup first if you need the current one.`)) return;
                await blobStore.clear();
                for (const e of incoming.evidence || []) { if (e.image) await blobStore.set(e.id, e.image); e.hasImage = !!e.image; delete e.image; }
                c = normalise({ ...blank(), ...incoming });
                if (Array.isArray(j.favorites)) store.set('azimuth_favs', j.favorites);
            }
            save();
            render();
            log('import', merge ? `Merged case ${incoming.id || ''}` : `Opened case ${incoming.id || ''}`);
            toast(merge ? 'Case merged' : 'Case opened');
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
            const copy = { ...e, hasImage: !!e.image, no: c.nextNo++, comments: e.comments || [], tags: [...new Set([...(e.tags || []), `from:${x.analyst || x.id || 'teammate'}`])] };
            delete copy.image;
            c.evidence.unshift(copy);
            added++;
        }
        for (const l of x.links || []) if (!c.links.some(y => y.from === l.from && y.to === l.to)) c.links.push(l);
        for (const [k, v] of Object.entries(x.leads || {})) if (!c.leads[k] && !c.selectors.some(s => selKey(s) === k)) c.leads[k] = v;
        addTimeline(x.timeline || []);
        const seen = new Set(c.activity.map(a => a.t + a.label));
        (x.activity || []).forEach(a => { if (!seen.has(a.t + a.label)) c.activity.push({ ...a, label: `[${x.analyst || 'teammate'}] ${a.label}` }); });
        c.activity.sort((a, b) => b.t.localeCompare(a.t));
        toast(`${added} new evidence item(s) merged`);
    }

    async function newCase() {
        if (!confirm('Start a new case? The current case will be cleared from this browser. Download a backup first if you need it.')) return;
        await blobStore.clear().catch(() => {});
        c = blank();
        save();
        render();
        toast('New case started');
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

    function openModal(prefill = {}, id = null) {
        editingId = id;
        pendingImage = undefined;
        const ev = id ? c.evidence.find(e => e.id === id) : null;
        const d = ev || prefill;
        $('#modal-title').textContent = ev ? `Edit E${ev.no}` : 'Add evidence';
        $('#note-title').value = d.title || '';
        $('#note-source').value = d.source || '';
        $('#note-text').value = d.text || '';
        $('#note-tags').value = (d.tags || []).join(', ');
        $('#note-confidence').value = d.confidence || '';
        $('#snapshot-preview-container').classList.add('hidden');
        if (ev?.hasImage) blobStore.get(ev.id).then(src => src && showPreview(src, ev.imageSha256));
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
        const data = { title, source: $('#note-source').value.trim(), text: $('#note-text').value, tags: $('#note-tags').value.split(',').map(t => t.trim()).filter(Boolean), confidence: $('#note-confidence').value };
        if (editingId) await updateEvidence(editingId, data, pendingImage);
        else await addEvidence({ ...data, imageDataUrl: pendingImage || null });
        closeModal();
    }
    const closeModal = () => $('#note-modal').classList.add('hidden');

    function setup() {
        render();
        $('#case-subject').addEventListener('input', debounce(e => { c.subject = e.target.value; save(); }, 300));
        $('#case-analyst').addEventListener('input', debounce(e => { c.analyst = e.target.value; save(); }, 300));
        $('#case-summary').addEventListener('input', debounce(e => { c.summary = e.target.value; save(); }, 400));
        $('#evidence-filter').addEventListener('input', debounce(renderEvidence, 150));
        $('#add-note-btn').onclick = () => openModal();
        $('#export-json-btn').onclick = exportJSON;
        $('#export-md-btn').onclick = exportMarkdown;
        $('#export-pdf-btn').onclick = exportPDF;
        $('#export-enc-btn').onclick = exportEncrypted;
        $('#import-case-input').onchange = e => { if (e.target.files[0]) importCase(e.target.files[0], false); e.target.value = ''; };
        $('#merge-case-input').onchange = e => { if (e.target.files[0]) importCase(e.target.files[0], true); e.target.value = ''; };
        $('#new-case-btn').onclick = newCase;
        $('#clear-activity').onclick = () => { if (confirm('Clear the activity log?')) { c.activity = []; save(); renderActivity(); } };
        $('#report-template').value = store.get('azimuth_report_template', 'standard');
        $('#report-template').onchange = e => store.set('azimuth_report_template', e.target.value);

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
        $('#remove-snapshot-btn').onclick = () => { pendingImage = null; $('#snapshot-preview-container').classList.add('hidden'); };
        $('#note-modal').addEventListener('paste', e => {
            for (const item of e.clipboardData?.items || []) if (item.kind === 'file') { handleImageFile(item.getAsFile()); e.preventDefault(); }
        });
        const drop = $('#note-drop');
        drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('over'));
        drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); handleImageFile(e.dataTransfer.files[0]); });
    }

    return { setup, log, nameIfUntitled, buildReportHTML, addSelector, addLink, addLeads, addTimeline, addEvidence, openModal, closeModal, saveModal, render, exportPDF, exportMarkdown, exportJSON, get data() { return c; } };
})();
