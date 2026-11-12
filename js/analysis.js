// Analysis & review: intelligence requirements, key judgments (ICD 203 language), ACH matrix,
// authority/necessity/proportionality record and peer review sign-off. All stored in the active case.
'use strict';

const WEP = [
    ['Almost no chance', '1–5%'], ['Very unlikely', '5–20%'], ['Unlikely', '20–45%'], ['Roughly even chance', '45–55%'],
    ['Likely', '55–80%'], ['Very likely', '80–95%'], ['Almost certain', '95–99%'],
];
const ACH_SCORES = ['', 'CC', 'C', 'N', 'I', 'II'];
const ACH_WEIGHT = { I: 1, II: 2 };

const Analysis = (() => {
    const c = () => CaseFile.data;
    const save = () => CaseFile.save();

    function achScores() {
        const out = {};
        for (const h of c().ach.hypotheses) out[h.id] = c().ach.rows.reduce((n, r) => n + (ACH_WEIGHT[r.scores?.[h.id]] || 0), 0);
        return out;
    }

    // ---------- requirements ----------
    function renderReqs() {
        const reqs = c().requirements;
        $('#req-list').innerHTML = reqs.length ? reqs.map((r, i) => {
            const ev = c().evidence.filter(e => e.reqs?.includes(r.id));
            return `<div class="req-row">
                <b class="mono">R${i + 1}</b>
                <div class="req-text">${esc(r.text)}<div class="muted tiny">${ev.length ? `Evidence: ${ev.map(e => `E${e.no}`).join(', ')}` : 'No evidence linked yet. Link evidence from its Edit dialog.'}</div></div>
                <select class="input input-sm" data-req-status="${esc(r.id)}">${['Open', 'Partly answered', 'Answered', 'Cannot be answered'].map(s => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
                <button class="icon-copy" data-req-del="${esc(r.id)}" title="Remove">✕</button>
            </div>`;
        }).join('') : '<p class="muted small">No requirements yet. Professional collection starts from the questions the customer needs answered.</p>';
    }

    // ---------- judgments ----------
    function renderJudgments() {
        const js = c().judgments;
        $('#judgment-list').innerHTML = js.length ? `<ol class="judgments">${js.map(j => `<li><b>${esc(j.prob)}</b> <span class="muted small">(${esc(WEP.find(w => w[0] === j.prob)?.[1] || '')}, ${esc(j.conf.toLowerCase())})</span>: ${esc(j.text)} <button class="icon-copy" data-jd-del="${esc(j.id)}" title="Remove">✕</button></li>`).join('')}</ol>` : '<p class="muted small">No judgments yet.</p>';
    }

    // ---------- ACH ----------
    function renderACH() {
        const a = c().ach;
        if (!a.hypotheses.length) { $('#ach').innerHTML = '<p class="muted small">Add at least two hypotheses (competing explanations), then add evidence rows and score each cell.</p>'; return; }
        const sc = achScores();
        const best = Math.min(...Object.values(sc));
        $('#ach').innerHTML = `<div class="ach-wrap"><table class="ach-table">
            <tr><th>Evidence</th>${a.hypotheses.map(h => `<th>${esc(h.text)} <button class="icon-copy" data-ach-hdel="${esc(h.id)}" title="Remove hypothesis">✕</button></th>`).join('')}<th></th></tr>
            ${a.rows.map(r => `<tr><td>${esc(r.label)}</td>${a.hypotheses.map(h => `<td><select class="ach-cell s-${esc(r.scores?.[h.id] || 'none')}" data-ach-row="${esc(r.id)}" data-ach-h="${esc(h.id)}">${ACH_SCORES.map(s => `<option ${s === (r.scores?.[h.id] || '') ? 'selected' : ''}>${s}</option>`).join('')}</select></td>`).join('')}<td><button class="icon-copy" data-ach-rdel="${esc(r.id)}" title="Remove row">✕</button></td></tr>`).join('')}
            <tr class="ach-total"><td><b>Inconsistency score</b></td>${a.hypotheses.map(h => `<td><b class="${a.rows.length && sc[h.id] === best ? 'ok' : ''}">${sc[h.id]}</b></td>`).join('')}<td></td></tr>
        </table></div>
        <form class="omni-inline" id="ach-r-form" style="margin-top:.5rem"><input class="input" id="ach-r" placeholder="Add an evidence row (or an assumption, or the absence of something expected)"><button class="btn">Add row</button></form>
        <p class="muted tiny">CC very consistent · C consistent · N neutral/not applicable · I inconsistent · II very inconsistent. Highlighted = least inconsistent so far.</p>`;
        $('#ach-r-form').onsubmit = e => {
            e.preventDefault();
            const v = $('#ach-r').value.trim();
            if (!v) return;
            a.rows.push({ id: uid(), label: v, scores: {} });
            save(); renderACH();
        };
    }

    // ---------- legal & review ----------
    function renderLegal() {
        $$('[data-legal]').forEach(el => { el.value = c().legal?.[el.dataset.legal] || ''; });
    }
    function renderReview() {
        const r = c().review;
        $('#review-status').innerHTML = r
            ? `<p class="small"><span class="status ${/Returned/.test(r.outcome) ? 'st-err' : 'st-ok'}">${esc(r.outcome)}</span> by <b>${esc(r.name)}</b> on ${esc(fmtTime(r.t))}${r.notes ? `<br><span class="muted">${esc(r.notes)}</span>` : ''}</p>`
            : '<p class="muted small">Not reviewed yet.</p>';
    }

    function render() {
        if (!c()) return;
        renderReqs(); renderJudgments(); renderACH(); renderLegal(); renderReview();
        AI.renderHint();
    }

    function setup() {
        $('#jd-prob').innerHTML = WEP.map(([w, p]) => `<option ${w === 'Likely' ? 'selected' : ''}>${w}</option>`).join('');
        $('#req-form').onsubmit = e => {
            e.preventDefault();
            const v = $('#req-text').value.trim();
            if (!v) return;
            c().requirements.push({ id: uid(), text: v, status: 'Open', t: new Date().toISOString() });
            $('#req-text').value = '';
            save(); renderReqs();
        };
        $('#req-list').addEventListener('change', e => {
            const s = e.target.closest('[data-req-status]');
            if (s) { c().requirements.find(r => r.id === s.dataset.reqStatus).status = s.value; save(); }
        });
        $('#req-list').addEventListener('click', e => {
            const d = e.target.closest('[data-req-del]');
            if (d) { c().requirements = c().requirements.filter(r => r.id !== d.dataset.reqDel); save(); renderReqs(); }
        });
        $('#judgment-form').onsubmit = e => {
            e.preventDefault();
            const v = $('#jd-text').value.trim();
            if (!v) return;
            c().judgments.push({ id: uid(), text: v, prob: $('#jd-prob').value, conf: $('#jd-conf').value });
            $('#jd-text').value = '';
            save(); renderJudgments();
        };
        $('#judgment-list').addEventListener('click', e => {
            const d = e.target.closest('[data-jd-del]');
            if (d) { c().judgments = c().judgments.filter(j => j.id !== d.dataset.jdDel); save(); renderJudgments(); }
        });
        $('#ach-h-form').onsubmit = e => {
            e.preventDefault();
            const v = $('#ach-h').value.trim();
            if (!v) return;
            c().ach.hypotheses.push({ id: uid(), text: v });
            $('#ach-h').value = '';
            save(); renderACH();
        };
        $('#ach-add-evidence').onclick = () => {
            const have = new Set(c().ach.rows.map(r => r.evidenceId).filter(Boolean));
            const add = c().evidence.filter(e => !have.has(e.id)).slice().reverse();
            add.forEach(e => c().ach.rows.push({ id: uid(), evidenceId: e.id, label: `E${e.no}: ${e.title}`, scores: {} }));
            save(); renderACH();
            toast(add.length ? `Added ${add.length} evidence row(s)` : 'All evidence is already in the matrix');
        };
        $('#ach').addEventListener('change', e => {
            const s = e.target.closest('[data-ach-row]');
            if (!s) return;
            const row = c().ach.rows.find(r => r.id === s.dataset.achRow);
            row.scores = { ...row.scores, [s.dataset.achH]: s.value };
            save(); renderACH();
        });
        $('#ach').addEventListener('click', e => {
            const h = e.target.closest('[data-ach-hdel]'), r = e.target.closest('[data-ach-rdel]');
            if (h) { c().ach.hypotheses = c().ach.hypotheses.filter(x => x.id !== h.dataset.achHdel); save(); renderACH(); }
            if (r) { c().ach.rows = c().ach.rows.filter(x => x.id !== r.dataset.achRdel); save(); renderACH(); }
        });
        $$('[data-legal]').forEach(el => el.addEventListener('input', debounce(() => { c().legal = { ...c().legal, [el.dataset.legal]: el.value }; save(); }, 300)));
        $('#rv-sign').onclick = () => {
            const name = $('#rv-name').value.trim();
            if (!name) return toast('Enter the reviewer’s name', 'err');
            if (name === c().analyst && !confirm('The reviewer is the same person as the analyst. Sign off anyway?')) return;
            c().review = { name, outcome: $('#rv-outcome').value, notes: $('#rv-notes').value.trim(), t: new Date().toISOString() };
            save(); renderReview();
            CaseFile.log('review', `Peer review: ${c().review.outcome} by ${name}`);
            toast('Review recorded');
        };
        document.addEventListener('azimuth:case-switched', render);
    }

    return { setup, render, achScores };
})();
