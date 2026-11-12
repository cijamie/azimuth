// Optional AI assistant using the analyst's own Anthropic API key (Settings). Calls go straight from the browser
// to Anthropic with the official SDK; nothing is sent unless the analyst clicks a button, and privacy mode blocks it.
'use strict';

const AI = (() => {
    const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.3.0/+esm';
    const MODEL = 'claude-opus-5-5';
    let sdkPromise = null;
    let busy = false;

    const loadSDK = () => (sdkPromise ||= import(SDK_URL).then(m => m.default || m.Anthropic).catch(e => { sdkPromise = null; throw e; }));

    function renderHint() {
        const has = !!Settings.key('anthropic');
        $('#ai-hint').innerHTML = privacyOn() ? 'Off: privacy mode is on.' : has
            ? 'Uses your Anthropic key (Claude Opus 5.5). The case text is sent to Anthropic only when you click.'
            : 'Add your Anthropic API key in ⚙ Settings to turn this on.';
        $$('[data-ai], #ai-form button').forEach(b => { b.disabled = !has || privacyOn(); });
    }

    function caseContext() {
        const c = CaseFile.data;
        const clip = (s, n) => (String(s || '').length > n ? String(s).slice(0, n) + '…' : String(s || ''));
        return [
            `CASE: ${c.subject || 'Untitled'} (${c.id}), analyst ${c.analyst || 'unknown'}`,
            c.summary ? `CURRENT SUMMARY:\n${c.summary}` : '',
            c.requirements.length ? `REQUIREMENTS:\n${c.requirements.map((r, i) => `R${i + 1} [${r.status}] ${r.text}`).join('\n')}` : '',
            `SELECTORS INVESTIGATED:\n${c.selectors.map(s => `- ${s.type}: ${s.value}`).join('\n') || '- none'}`,
            Object.keys(c.leads).length ? `UNFOLLOWED LEADS (${Object.keys(c.leads).length}):\n${Object.values(c.leads).slice(0, 60).map(l => `- ${l.type}: ${l.value} (via ${l.via})`).join('\n')}` : '',
            `EVIDENCE (${c.evidence.length}):\n${c.evidence.slice().sort((a, b) => a.no - b.no).slice(0, 80).map(e => `E${e.no}. ${e.title} [grade ${CaseFile.grade(e) || 'none'}, confidence ${e.confidence || 'unset'}]${e.source ? ` source ${e.source}` : ''}\n${clip(e.text, 1200)}`).join('\n\n') || 'none'}`,
            c.timeline.length ? `DATED FACTS:\n${c.timeline.slice(0, 60).map(f => `${f.t.slice(0, 10)} ${f.label} (${f.selector})`).join('\n')}` : '',
            c.judgments.length ? `KEY JUDGMENTS SO FAR:\n${c.judgments.map(j => `- ${j.prob} (${j.conf}): ${j.text}`).join('\n')}` : '',
        ].filter(Boolean).join('\n\n');
    }

    const SYSTEM = `You are assisting a professional open-source intelligence (OSINT) analyst inside AZIMUTH, a browser-based investigation workbench. The case data below was collected from public sources by the analyst.
Write for an experienced analyst: concise, specific, no filler. Distinguish what the evidence shows from what is inferred, cite evidence numbers (E1, E2…) for every factual claim, and point out single-source claims and gaps. Use the standard estimative terms (almost no chance, very unlikely, unlikely, roughly even chance, likely, very likely, almost certain) when expressing probability. Never invent facts, sources or evidence numbers. Suggest only lawful, ethical open-source methods; do not suggest accessing private accounts, breaching systems, or contacting or deceiving the subject.
Azimuth's tools you can point to: Investigate (live lookups for domains, IPs, emails, usernames, phones, hashes, wallets, names), username sweep, lookalike domains, same-person comparison, bulk check, dork builder, email header analyzer, name & email variants, document metadata, photo check, sun & shadow calculator, video frames, Wayback compare, Telegram channel reader, map, link chart, timeline and ACH.`;

    const TASKS = {
        summary: 'Draft the case summary / assessment: 1–3 short paragraphs: what was asked, what the evidence shows (with E-numbers), the overall assessment with estimative language, and the main caveats.',
        next: 'Suggest the next investigative steps, most valuable first (at most 8). For each: what to do, which selector or lead, which Azimuth tool or public source, and what it would confirm or rule out.',
        gaps: 'Review this case critically, as a peer reviewer would. List weak or single-source claims, ungraded or unverified evidence, alternative explanations that have not been ruled out, possible confirmation bias, and anything missing before this could be reported. Be direct.',
        judgments: 'Propose 2–5 key judgments this evidence supports. Output each on its own line in exactly this format and nothing else:\nJUDGMENT | <estimative term> | <Low|Moderate|High> confidence | <judgment text with E-numbers>',
    };

    async function ask(task, question) {
        if (busy) return;
        if (privacyOn()) return toast('Privacy mode is on: the AI assistant is disabled.', 'err');
        const key = Settings.key('anthropic');
        if (!key) return toast('Add your Anthropic API key in Settings first.', 'err');
        const consentKey = `azimuth_ai_ok_${CaseFile.data.id}`;
        if (!sessionStorage.getItem(consentKey)) {
            if (!confirm('This sends the text of this case (selectors, evidence text, sources) to Anthropic’s API to generate a response. Continue for this case?')) return;
            sessionStorage.setItem(consentKey, '1');
        }
        busy = true;
        const out = $('#ai-output');
        out.innerHTML = '<div class="ai-text"><span class="spinner"></span> Thinking…</div>';
        const textEl = out.querySelector('.ai-text');
        let text = '';
        try {
            const Anthropic = await loadSDK();
            const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
            const stream = client.beta.messages.stream({
                model: MODEL,
                max_tokens: 16000,
                betas: ['server-side-fallback-2026-07-01'],
                fallbacks: 'default',
                output_config: { effort: 'medium' },
                system: SYSTEM,
                messages: [{ role: 'user', content: `${caseContext()}\n\n---\nTASK: ${question || TASKS[task]}` }],
            });
            stream.on('text', delta => { text += delta; textEl.textContent = text; });
            const final = await stream.finalMessage();
            if (final.stop_reason === 'refusal') {
                textEl.innerHTML = `<p class="warn">The model declined this request${final.stop_details?.explanation ? `: ${esc(final.stop_details.explanation)}` : '.'}</p>`;
                return;
            }
            if (final.stop_reason === 'max_tokens') text += '\n\n[Response cut off at the length limit.]';
            textEl.textContent = text;
            const actions = [];
            if (task === 'summary') actions.push('<button class="btn small primary" id="ai-use-summary">Use as case summary</button>');
            const jds = task === 'judgments' ? text.split('\n').map(l => l.match(/^JUDGMENT\s*\|\s*([^|]+)\|\s*(Low|Moderate|High) confidence\s*\|\s*(.+)$/i)).filter(Boolean) : [];
            if (jds.length) {
                textEl.innerHTML = `<ol>${jds.map((m, i) => `<li><b>${esc(m[1].trim())}</b> (${esc(m[2])} confidence): ${esc(m[3].trim())} <button class="btn small" data-ai-jd="${i}">Add</button></li>`).join('')}</ol>`;
                textEl.onclick = e => {
                    const b = e.target.closest('[data-ai-jd]');
                    if (!b) return;
                    const m = jds[+b.dataset.aiJd];
                    const prob = WEP.find(w => w[0].toLowerCase() === m[1].trim().toLowerCase())?.[0] || 'Likely';
                    CaseFile.data.judgments.push({ id: uid(), text: m[3].trim(), prob, conf: `${m[2][0].toUpperCase()}${m[2].slice(1).toLowerCase()} confidence`, ai: true });
                    CaseFile.save(); Analysis.render();
                    b.disabled = true; b.textContent = 'Added';
                };
            }
            actions.push('<button class="btn small" id="ai-copy">Copy</button><button class="btn small" id="ai-note">⊕ Save as evidence note</button>');
            out.insertAdjacentHTML('beforeend', `<div class="btn-row">${actions.join('')}</div><p class="muted tiny">AI-generated from your case data. Check every claim against the evidence before relying on it.</p>`);
            $('#ai-use-summary')?.addEventListener('click', () => { CaseFile.data.summary = text.trim(); CaseFile.save(); $('#case-summary').value = text.trim(); toast('Summary updated (edit it in the Case file)'); });
            $('#ai-copy').onclick = () => copyText(text);
            $('#ai-note').onclick = () => CaseFile.addEvidence({ title: `AI assistant: ${question ? question.slice(0, 60) : task}`, text, tags: ['ai-generated'] });
            CaseFile.log('ai', `AI assistant: ${question ? `asked “${question.slice(0, 80)}”` : task}`);
        } catch (e) {
            const msg = e?.status === 401 ? 'The API key was rejected. Check it in Settings.' : e?.status === 429 ? 'Rate limited by the API. Wait a moment and try again.' : e?.message?.includes('Failed to fetch') || e?.message?.includes('import') ? 'Could not reach Anthropic or load the SDK (offline, or blocked by an extension).' : e.message;
            textEl.innerHTML = `<p class="warn">${esc(msg)}</p>`;
        } finally { busy = false; }
    }

    function setup() {
        document.addEventListener('click', e => { const b = e.target.closest('[data-ai]'); if (b) ask(b.dataset.ai); });
        $('#ai-form').onsubmit = e => { e.preventDefault(); const q = $('#ai-q').value.trim(); if (q) ask('question', q); };
        document.addEventListener('azimuth:settings', renderHint);
        renderHint();
    }

    return { setup, renderHint, ask };
})();
