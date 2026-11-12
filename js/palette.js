// Command palette (Ctrl+K): investigate, jump to views, run actions, open tools.
'use strict';

const Palette = (() => {
    let items = [], active = 0;

    const COMMANDS = () => [
        ['Go to Investigate', 'view', () => showView('investigate')],
        ['Go to Link chart & timeline', 'view', () => showView('graph')],
        ['Go to Case file', 'view', () => showView('case')],
        ['Go to Watchlist', 'view', () => showView('watch')],
        ['Go to Tool directory', 'view', () => showView('registry')],
        ['Go to Search dorks', 'view', () => showView('dorks')],
        ['Go to Toolkit', 'view', () => showView('toolkit')],
        ['Go to Analysis & review', 'view', () => showView('analysis')],
        ['Go to Bulk check', 'view', () => showView('bulk')],
        ['Switch case / search all cases', 'action', () => CaseFile.openSwitcher()],
        ['New case', 'action', () => CaseFile.newCase()],
        ['Add evidence / note', 'action', () => CaseFile.openModal()],
        ['Analyse email headers', 'tool', () => { showView('toolkit'); switchToolkitTab('headers'); }],
        ['Name & email variants', 'tool', () => { showView('toolkit'); switchToolkitTab('variants'); }],
        ['Document metadata (PDF, Word, Excel)', 'tool', () => { showView('toolkit'); switchToolkitTab('docs'); }],
        ['Video keyframes', 'tool', () => { showView('toolkit'); switchToolkitTab('video'); }],
        ['Search a big file locally', 'tool', () => { showView('toolkit'); switchToolkitTab('bigfile'); }],
        ['Read a Telegram channel', 'tool', () => { showView('toolkit'); switchToolkitTab('telegram'); }],
        ['Research personas', 'tool', () => { showView('toolkit'); switchToolkitTab('personas'); }],
        ['AI: draft case summary', 'action', () => { showView('analysis'); AI.ask('summary'); }],
        ['AI: suggest next steps', 'action', () => { showView('analysis'); AI.ask('next'); }],
        ['Lock now', 'setting', () => (Vault.enabled() ? Vault.lockNow() : toast('Set a passphrase in Settings first'))],
        ['Re-check current selector', 'action', () => runLookups()],
        ['Save all findings to case', 'action', () => saveAllFindings()],
        ['Watch / unwatch current selector', 'action', () => state.selector && toggleWatch()],
        ['Username sweep (600 sites)', 'action', () => { if (state.selector?.type === 'username') { showView('investigate'); switchInvTab('sweep'); } else toast('Investigate a username first'); }],
        ['Download PDF report', 'action', () => CaseFile.exportPDF()],
        ['Download Markdown report', 'action', () => CaseFile.exportMarkdown()],
        ['Download JSON backup', 'action', () => CaseFile.exportJSON()],
        ['Extract indicators from text', 'tool', () => { showView('toolkit'); switchToolkitTab('ioc'); }],
        ['Photo check (metadata, ELA, reverse search)', 'tool', () => { showView('toolkit'); switchToolkitTab('image'); }],
        ['Sun & shadow calculator', 'tool', () => { showView('toolkit'); switchToolkitTab('sun'); }],
        ['Compare archived pages (Wayback)', 'tool', () => { showView('toolkit'); switchToolkitTab('wayback'); }],
        ['Encode / decode', 'tool', () => { showView('toolkit'); switchToolkitTab('codec'); }],
        ['Hash text or a file', 'tool', () => { showView('toolkit'); switchToolkitTab('hash'); }],
        ['Decode a timestamp or snowflake ID', 'tool', () => { showView('toolkit'); switchToolkitTab('time'); }],
        ['Toggle light / dark theme', 'setting', () => Settings.toggleTheme()],
        ['Open settings & API keys', 'setting', () => Settings.open()],
        ['Check my IP (OpSec)', 'setting', () => $('#opsec-check').click()],
    ];

    function compute(q) {
        const query = q.trim().toLowerCase();
        const out = [];
        if (query) {
            const d = detectSelector(q);
            if (d) out.push({ label: `Investigate “${d.value}”`, kind: SELECTOR_TYPES[d.type].label, run: () => runInvestigate(q) });
        }
        const cmds = COMMANDS().filter(([l]) => !query || l.toLowerCase().includes(query) || query.split(' ').every(w => l.toLowerCase().includes(w)));
        cmds.forEach(([label, kind, run]) => out.push({ label, kind, run }));
        if (query.length > 1 && fuse) {
            fuse.search(query).slice(0, 8).forEach(r => out.push({ label: `Open ${r.item.name}`, kind: r.item.category, run: () => { const u = fillRegistryUrl(r.item.url, state.selector); window.open(u, '_blank', 'noopener'); CaseFile.log('tool', `Opened ${r.item.name}`, u); } }));
        }
        return out.slice(0, 40);
    }

    function render() {
        $('#palette-list').innerHTML = items.map((it, i) => `<button class="palette-item ${i === active ? 'active' : ''}" data-i="${i}">${esc(it.label)}<span class="pi-kind">${esc(it.kind)}</span></button>`).join('') || '<p class="muted small" style="padding:.8rem">No matches</p>';
        $('#palette-list .active')?.scrollIntoView({ block: 'nearest' });
    }

    function open(prefill = '') {
        $('#palette').classList.remove('hidden');
        const inp = $('#palette-input');
        inp.value = prefill;
        items = compute(prefill);
        active = 0;
        render();
        setTimeout(() => inp.focus(), 10);
    }
    const close = () => $('#palette').classList.add('hidden');
    const isOpen = () => !$('#palette').classList.contains('hidden');

    function run(i) {
        const it = items[i];
        if (!it) return;
        close();
        it.run();
    }

    function setup() {
        $('#palette-btn').onclick = () => open();
        $('#palette-input').addEventListener('input', e => { items = compute(e.target.value); active = 0; render(); });
        $('#palette-input').addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { active = Math.min(items.length - 1, active + 1); render(); e.preventDefault(); }
            if (e.key === 'ArrowUp') { active = Math.max(0, active - 1); render(); e.preventDefault(); }
            if (e.key === 'Enter') { run(active); e.preventDefault(); }
            if (e.key === 'Escape') close();
        });
        $('#palette-list').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) run(+b.dataset.i); });
        $('#palette').addEventListener('click', e => { if (e.target.id === 'palette') close(); });
    }

    return { setup, open, close, isOpen };
})();
