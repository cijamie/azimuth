// Username sweep across ~600 sites (WhatsMyName data). A web page can't read other sites' responses,
// so the checks run inside the Azimuth browser extension; this file is the page side of that bridge.
'use strict';

window.AzimuthExtension = { ready: false, version: null };

const Sweep = (() => {
    let current = null;     // { id, username, total, done, hits: [] }
    const listeners = {};

    window.addEventListener('message', e => {
        if (e.source !== window || !e.data || e.data.__azimuth !== 'ext') return;
        const m = e.data;
        if (m.type === 'hello') {
            window.AzimuthExtension = { ready: true, version: m.version };
            document.dispatchEvent(new CustomEvent('azimuth:extension'));
        }
        if (!current || m.id !== current.id) return;
        if (m.type === 'sweep-start') { current.total = m.total; render(); }
        if (m.type === 'sweep-result') {
            current.done++;
            if (m.result.found) current.hits.push(m.result);
            throttledRender();
        }
        if (m.type === 'sweep-done') { current.finished = true; render(); CaseFile.log('sweep', `Username sweep for ${current.username}: found on ${current.hits.length} of ${current.total} sites`); }
        if (m.type === 'sweep-error') { current.error = m.error; render(); }
    });
    // Ask the extension to announce itself (in case its script loaded before ours).
    window.postMessage({ __azimuth: 'page', type: 'ping' }, '*');

    const throttledRender = debounce(() => render(), 120);

    function start(username) {
        if (!window.AzimuthExtension.ready) return render(username);
        const nsfw = $('#sweep-nsfw')?.checked || false;
        current = { id: uid(), username, total: 0, done: 0, hits: [], finished: false };
        window.postMessage({ __azimuth: 'page', type: 'sweep', id: current.id, username, includeNsfw: nsfw }, '*');
        render(username);
    }

    function stop() {
        if (current) window.postMessage({ __azimuth: 'page', type: 'sweep-cancel', id: current.id }, '*');
        if (current) current.finished = true;
        render();
    }

    function render(username = state?.selector?.value) {
        const box = $('#sweep-panel');
        if (!box) return;
        if (!window.AzimuthExtension.ready) {
            box.innerHTML = `
                <p>Checks <b>${esc(username || 'this username')}</b> on about 600 sites (the WhatsMyName list). A web page isn’t allowed to read other sites, so this needs one of:</p>
                <h4 style="margin-top:.8rem">Option 1: the Azimuth browser extension (recommended)</h4>
                <p class="muted small">Chrome / Edge / Brave: open <code>chrome://extensions</code>, turn on Developer mode, click “Load unpacked” and choose the <code>extension</code> folder inside Azimuth. Then reload this page. It also adds “Investigate in Azimuth” to your right-click menu.</p>
                <h4 style="margin-top:.8rem">Option 2: the command line (needs Node.js 18+)</h4>
                <pre class="cmd">node scripts/sweep.mjs ${esc(username || 'username')}</pre>
                <p class="muted small">It writes a JSON file you can open under Toolkit → Extract indicators, or attach to the case.</p>`;
            return;
        }
        if (!current || current.username !== username) {
            box.innerHTML = `<p>Check <b>${esc(username)}</b> on about 600 sites. Requests go from your browser to each site.</p>
                <div class="btn-row"><button class="btn primary" id="sweep-start">Start sweep</button><label class="toggle"><input type="checkbox" id="sweep-nsfw"> include adult sites</label></div>`;
            $('#sweep-start').onclick = () => start(username);
            return;
        }
        const pct = current.total ? Math.round((current.done / current.total) * 100) : 0;
        box.innerHTML = `
            <div class="card-head" style="margin-bottom:0"><b>${current.finished ? 'Finished' : 'Sweeping…'}</b><span class="muted small">${current.done} / ${current.total || '?'} sites checked · found on ${current.hits.length}</span><span class="spacer"></span>
                ${current.finished ? '<button class="btn small" id="sweep-again">Run again</button>' : '<button class="btn small" id="sweep-stop">Stop</button>'}
                ${current.hits.length ? '<button class="btn small primary" id="sweep-save">⊕ Save results to case</button>' : ''}</div>
            ${current.error ? `<p class="warn small">${esc(current.error)}</p>` : ''}
            <div class="progress"><div style="width:${pct}%"></div></div>
            <p class="muted small">Matches are based on each site’s page content; a few may be false positives, so open them to confirm.</p>
            <div class="sweep-results">${current.hits.sort((a, b) => a.site.localeCompare(b.site)).map(h => `<a class="sweep-hit" href="${esc(safeUrl(h.url))}" target="_blank" rel="noopener noreferrer"><span>${esc(h.site)}</span><span class="muted tiny">${esc(h.cat || '')}</span></a>`).join('')}</div>`;
        $('#sweep-stop')?.addEventListener('click', stop);
        $('#sweep-again')?.addEventListener('click', () => start(username));
        $('#sweep-save')?.addEventListener('click', () => CaseFile.addEvidence({
            title: `Username sweep: ${current.username} found on ${current.hits.length} sites`,
            text: current.hits.map(h => `${h.site} (${h.cat}): ${h.url}`).join('\n'),
            tags: ['username', 'sweep'],
            selector: current.username,
        }));
    }

    return { start, stop, render };
})();
