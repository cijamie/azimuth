// Watchlist: re-runs live checks for saved selectors and reports what changed.
// Runs while Azimuth is open in a tab (there is no server to do it in the background).
'use strict';

const Watch = (() => {
    const KEY = 'azimuth_watch';
    let items = [];
    let running = false;
    const save = () => { Secure.set(KEY, items); badge(); };

    function badge() {
        const unseen = items.reduce((n, i) => n + (i.changes || []).filter(c => !c.seen).length, 0);
        $('#watch-count').textContent = unseen ? `${unseen} new` : items.length;
        $('#watch-count').classList.toggle('ok', unseen > 0);
    }

    const has = sel => items.some(i => i.type === sel.type && i.value === sel.value);

    async function toggle(sel) {
        if (has(sel)) {
            items = items.filter(i => !(i.type === sel.type && i.value === sel.value));
            save();
            toast('Removed from watchlist');
        } else {
            items.push({ type: sel.type, value: sel.value, meta: sel.meta, added: new Date().toISOString(), lastRun: null, fp: null, changes: [] });
            save();
            toast(`Watching. Azimuth re-checks it every ${hoursLabel()} while it’s open.`);
            check(items[items.length - 1]);
        }
        render();
        return has(sel);
    }

    const hoursLabel = () => ({ 1: 'hour', 6: '6 hours', 24: 'day', 168: 'week' }[Settings.get('watchHours')] || `${Settings.get('watchHours')} hours`);

    async function check(item) {
        const sel = { type: item.type, value: item.value, meta: item.meta || detectSelector(item.value)?.meta || {} };
        const plan = LOOKUP_PLAN[sel.type];
        if (!plan) return;
        const res = (await Promise.allSettled(plan(sel))).map(r => (r.status === 'fulfilled' ? r.value : null));
        const fp = fingerprint(res);
        if (item.fp) {
            const diff = [];
            for (const title of new Set([...Object.keys(fp), ...Object.keys(item.fp)])) {
                if (!fp[title] || !item.fp[title]) continue; // a source that failed this time is not a change
                const before = new Set(item.fp[title]), after = new Set(fp[title]);
                const added = [...after].filter(x => !before.has(x)), removed = [...before].filter(x => !after.has(x));
                if (added.length || removed.length) diff.push({ title, added: added.slice(0, 30), removed: removed.slice(0, 30) });
            }
            if (diff.length) {
                item.changes.unshift({ t: new Date().toISOString(), diff, seen: false });
                item.changes = item.changes.slice(0, 20);
                notify(item, diff);
                CaseFile.log('watch', `Change detected for ${item.value}: ${diff.map(d => d.title).join(', ')}`);
            }
        }
        // Merge so a source that failed this run keeps its previous fingerprint.
        item.fp = { ...(item.fp || {}), ...fp };
        item.lastRun = new Date().toISOString();
        save();
        render();
    }

    function notify(item, diff) {
        const msg = `${item.value}: ${diff.map(d => d.title.replace(/ \(.*\)$/, '')).join(', ')} changed`;
        toast(`Watchlist: ${msg}`);
        if ('Notification' in window && Notification.permission === 'granted') {
            try { new Notification('Azimuth watchlist', { body: msg, icon: 'logo.png' }); } catch { /* ignore */ }
        }
    }

    async function runDue(force = false) {
        if (running || privacyOn()) return;
        running = true;
        const ms = Settings.get('watchHours') * 3600e3;
        try {
            for (const item of items) {
                if (force || !item.lastRun || Date.now() - new Date(item.lastRun) > ms) await check(item);
            }
        } finally { running = false; }
    }

    function render() {
        badge();
        $('#watch-hint').textContent = `Re-checked every ${hoursLabel()} while Azimuth is open in a tab (change this in Settings).`;
        const box = $('#watch-list');
        if (!box) return;
        if (!items.length) { box.innerHTML = '<p class="muted small">Nothing watched yet. Open an investigation and press “☆ Watch” to get told when its DNS, subdomains, registration, ports, accounts or wallet activity change.</p>'; return; }
        box.innerHTML = items.map((i, n) => `
            <div class="watch-item">
                <div>
                    <span class="type-pill">${esc(SELECTOR_TYPES[i.type]?.label || i.type)}</span>
                    <button class="mono" data-investigate="${esc(i.value)}" data-type="${esc(i.type)}">${esc(i.value)}</button>
                    <div class="muted small">${i.lastRun ? `last checked ${esc(fmtTime(i.lastRun))}` : 'checking…'} · watching since ${esc(i.added.slice(0, 10))} · ${i.changes.length} change(s)</div>
                </div>
                <div class="btn-row" style="margin:0"><button class="btn small" data-wcheck="${n}">Check now</button>${i.changes.some(c => !c.seen) ? `<button class="btn small" data-wseen="${n}">Mark seen</button>` : ''}<button class="btn small ghost" data-wdel="${n}">Stop watching</button></div>
                <div class="watch-changes">${i.changes.slice(0, 5).map(c => `<div class="change ${c.seen ? '' : 'unseen'}"><b>${esc(fmtTime(c.t))}</b>${c.diff.map(d => `<div><b>${esc(d.title)}</b> ${d.added.map(a => `<div class="diff-add">+ ${esc(a)}</div>`).join('')}${d.removed.map(r => `<div class="diff-del">− ${esc(r)}</div>`).join('')}</div>`).join('')}</div>`).join('')}</div>
            </div>`).join('');
    }

    function setup() {
        items = Secure.get(KEY, []);
        $('#watch-list').addEventListener('click', e => {
            const t = e.target.closest('[data-wcheck],[data-wdel],[data-wseen]');
            if (!t) return;
            const i = items[+(t.dataset.wcheck ?? t.dataset.wdel ?? t.dataset.wseen)];
            if (t.dataset.wcheck) { t.textContent = 'Checking…'; check(i); }
            if (t.dataset.wdel) { items.splice(items.indexOf(i), 1); save(); render(); }
            if (t.dataset.wseen) { i.changes.forEach(c => (c.seen = true)); save(); render(); }
        });
        $('#watch-run-all').onclick = () => { toast('Checking everything on the watchlist…'); runDue(true); };
        $('#watch-notify').onclick = async () => {
            if (!('Notification' in window)) return toast('This browser does not support notifications.', 'err');
            const p = await Notification.requestPermission();
            toast(p === 'granted' ? 'Notifications on' : 'Notifications were not allowed', p === 'granted' ? 'ok' : 'err');
            render();
        };
        render();
        setTimeout(() => runDue(), 4000);
        setInterval(() => runDue(), 10 * 60e3);
    }

    return { setup, toggle, has, render, runDue };
})();
