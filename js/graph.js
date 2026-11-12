// Link chart (small force-directed SVG graph) and timeline.
'use strict';

const TYPE_COLORS = { more: '#64748b', username: '#10b981', email: '#60a5fa', domain: '#f59e0b', ip: '#ef4444', url: '#a78bfa', image: '#ec4899', phone: '#14b8a6', hash: '#94a3b8', crypto: '#eab308', name: '#f472b6' };

const Graph = (() => {
    let nodes = [], edges = [], view = { x: 0, y: 0, k: 1 }, current = null;
    const svg = () => $('#graph');

    function build() {
        const c = CaseFile.data;
        const showLeads = $('#graph-leads').checked;
        const prev = new Map(nodes.map(n => [n.id, n]));
        const map = new Map();
        c.selectors.forEach(s => map.set(selKey(s), { id: selKey(s), type: s.type, value: s.value, lead: false }));
        const extraLinks = [];
        if (showLeads) {
            // At most 8 leads per node on the chart; the rest collapse into a "+N more" node.
            const perParent = {};
            Object.entries(c.leads).forEach(([k, l]) => { if (!map.has(k)) (perParent[l.from] ||= []).push([k, l]); });
            for (const [from, list] of Object.entries(perParent)) {
                list.slice(0, 8).forEach(([k, l]) => map.set(k, { id: k, type: l.type, value: l.value, lead: true, from: l.from }));
                if (list.length > 8 && map.has(from)) {
                    const id = `more:${from}`;
                    map.set(id, { id, type: 'more', value: `+${list.length - 8} more leads`, lead: true, more: true, from });
                    extraLinks.push({ from, to: id, label: '' });
                }
            }
        }
        nodes = [...map.values()].map(n => {
            const p = prev.get(n.id);
            return { ...n, x: p?.x ?? (Math.random() - 0.5) * 400, y: p?.y ?? (Math.random() - 0.5) * 300, vx: 0, vy: 0, fixed: p?.fixed };
        });
        edges = [...c.links, ...extraLinks].filter(l => map.has(l.from) && map.has(l.to)).map(l => ({ a: l.from, b: l.to, label: map.get(l.to).lead || map.get(l.from).lead ? '' : l.label }));
    }

    function simulate(iter = 300) {
        const idx = new Map(nodes.map(n => [n.id, n]));
        for (let i = 0; i < iter; i++) {
            const alpha = 1 - i / iter;
            for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
                const A = nodes[a], B = nodes[b];
                let dx = A.x - B.x, dy = A.y - B.y, d2 = dx * dx + dy * dy || 0.01;
                const f = 2400 / d2;
                const d = Math.sqrt(d2);
                dx /= d; dy /= d;
                A.vx += dx * f; A.vy += dy * f; B.vx -= dx * f; B.vy -= dy * f;
            }
            for (const e of edges) {
                const A = idx.get(e.a), B = idx.get(e.b);
                const dx = B.x - A.x, dy = B.y - A.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
                const f = (d - 110) * 0.04;
                A.vx += dx / d * f; A.vy += dy / d * f; B.vx -= dx / d * f; B.vy -= dy / d * f;
            }
            for (const n of nodes) {
                n.vx -= n.x * 0.004; n.vy -= n.y * 0.004;
                if (!n.fixed) { n.x += Math.max(-30, Math.min(30, n.vx)) * alpha; n.y += Math.max(-30, Math.min(30, n.vy)) * alpha; }
                n.vx *= 0.5; n.vy *= 0.5;
            }
        }
    }

    function fit() {
        const el = svg();
        const w = el.clientWidth || 800, h = el.clientHeight || 500;
        if (!nodes.length) return;
        const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
        const minX = Math.min(...xs) - 80, maxX = Math.max(...xs) + 80, minY = Math.min(...ys) - 50, maxY = Math.max(...ys) + 50;
        const k = Math.min(1.6, w / (maxX - minX), h / (maxY - minY));
        view = { k, x: w / 2 - ((minX + maxX) / 2) * k, y: h / 2 - ((minY + maxY) / 2) * k };
    }

    const short = v => (v.length > 28 ? v.slice(0, 26) + '…' : v);

    function svgMarkup({ forExport = false } = {}) {
        const idx = new Map(nodes.map(n => [n.id, n]));
        const edgeSvg = edges.map(e => {
            const A = idx.get(e.a), B = idx.get(e.b);
            return `<line class="edge" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" ${forExport ? 'stroke="#bbb" stroke-width="1.2"' : ''}/>` +
                (e.label && nodes.length < 60 ? `<text class="edge-label" x="${(A.x + B.x) / 2}" y="${(A.y + B.y) / 2 - 3}" text-anchor="middle" ${forExport ? 'font-size="9" fill="#888" font-family="Arial"' : ''}>${esc(e.label)}</text>` : '');
        }).join('');
        const nodeSvg = nodes.map(n => {
            const r = n.lead ? 7 : 11;
            const col = TYPE_COLORS[n.type] || '#888';
            return `<g class="node${n.lead ? ' lead' : ''}${current && n.id === current ? ' current' : ''}" data-id="${esc(n.id)}" transform="translate(${n.x},${n.y})">
                <circle r="${r}" fill="${col}" ${forExport ? `stroke="#fff" stroke-width="2" ${n.lead ? 'fill-opacity="0.35"' : ''}` : ''}/>
                <text x="${r + 5}" y="4" ${forExport ? 'font-size="11" font-family="monospace" fill="#111"' : ''}>${esc(short(n.value))}</text>
                <title>${esc(SELECTOR_TYPES[n.type]?.label || n.type)}: ${esc(n.value)}${n.lead ? ' (lead – click to investigate)' : ''}</title></g>`;
        }).join('');
        return `${edgeSvg}${nodeSvg}`;
    }

    function draw() {
        const el = svg();
        $('#graph-empty').classList.toggle('hidden', nodes.length > 0);
        el.innerHTML = `<g id="graph-root" transform="translate(${view.x},${view.y}) scale(${view.k})">${svgMarkup()}</g>`;
        const types = [...new Set(nodes.map(n => n.type))].filter(t => t !== 'more');
        $('#graph-legend').innerHTML = types.map(t => `<span><i style="background:${TYPE_COLORS[t]}"></i>${esc(SELECTOR_TYPES[t]?.label || t)}</span>`).join('') + (nodes.some(n => n.lead) ? '<span><i style="border:1px dashed var(--text-dim)"></i>lead not yet followed</span>' : '');
    }

    function render(relayout = false) {
        build();
        if (relayout) nodes.forEach(n => { n.x = (Math.random() - 0.5) * 400; n.y = (Math.random() - 0.5) * 300; n.fixed = false; });
        simulate(relayout || nodes.some(n => n.vx === 0) ? 300 : 80);
        fit();
        draw();
    }

    function setupInteraction() {
        const el = svg();
        let drag = null, pan = null, moved = false;
        const pt = e => { const r = el.getBoundingClientRect(); return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k }; };
        el.addEventListener('pointerdown', e => {
            moved = false;
            const g = e.target.closest('.node');
            if (g) { drag = nodes.find(n => n.id === g.dataset.id); }
            else pan = { x: e.clientX - view.x, y: e.clientY - view.y };
            el.setPointerCapture(e.pointerId);
        });
        el.addEventListener('pointermove', e => {
            if (drag) { const p = pt(e); drag.x = p.x; drag.y = p.y; drag.fixed = true; moved = true; draw(); }
            else if (pan) { view.x = e.clientX - pan.x; view.y = e.clientY - pan.y; moved = true; $('#graph-root').setAttribute('transform', `translate(${view.x},${view.y}) scale(${view.k})`); }
        });
        el.addEventListener('pointerup', e => {
            if (drag && !moved) {
                const n = drag;
                const from = n.lead && n.from ? CaseFile.data.selectors.find(s => selKey(s) === n.from) : null;
                if (n.more) { if (from) runInvestigate(from.value, from.type); }
                else investigateFrom(n.value, n.type, from);
            }
            drag = null; pan = null;
        });
        el.addEventListener('wheel', e => {
            e.preventDefault();
            const r = el.getBoundingClientRect();
            const mx = e.clientX - r.left, my = e.clientY - r.top;
            const k2 = Math.max(0.2, Math.min(4, view.k * (e.deltaY < 0 ? 1.12 : 0.89)));
            view.x = mx - (mx - view.x) * (k2 / view.k);
            view.y = my - (my - view.y) * (k2 / view.k);
            view.k = k2;
            $('#graph-root')?.setAttribute('transform', `translate(${view.x},${view.y}) scale(${view.k})`);
        }, { passive: false });
        $('#graph-relayout').onclick = () => render(true);
        $('#graph-leads').onchange = () => render(false);
        $('#graph-download').onclick = () => download(`${(CaseFile.data.subject || 'case').replace(/[^a-z0-9]+/gi, '_')}_link_chart.svg`, standaloneSVG(), 'image/svg+xml');
    }

    function standaloneSVG() {
        if (!nodes.length) build(), simulate(300);
        const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
        const minX = Math.min(0, ...xs) - 40, minY = Math.min(0, ...ys) - 30, w = Math.max(...xs, 0) - minX + 220, h = Math.max(...ys, 0) - minY + 40;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${w} ${h}" width="${Math.round(w)}" height="${Math.round(h)}"><rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="#ffffff"/>${svgMarkup({ forExport: true })}</svg>`;
    }

    function exportDataURL() {
        build();
        if (!nodes.length) return null;
        simulate(300);
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(standaloneSVG());
    }

    function setCurrent(sel) { current = sel ? selKey(sel) : null; }

    // ---- Timeline ----
    function renderTimeline() {
        const c = CaseFile.data;
        const items = [
            ...c.timeline.map(f => ({ ...f, kind: 'fact' })),
            ...c.evidence.map(e => ({ t: e.created, label: `Evidence E${e.no}: ${e.title}`, selector: '', kind: 'ev' })),
        ].sort((a, b) => a.t.localeCompare(b.t));
        if (!items.length) { $('#timeline').innerHTML = '<p class="muted small">No dates yet. Investigate something: registration dates, account creation, archive captures and photo dates appear here automatically.</p>'; return; }
        let year = '';
        $('#timeline').innerHTML = items.map(i => {
            const y = i.t.slice(0, 4);
            const head = y !== year ? `<div class="tl-year">${esc(y)}</div>` : '';
            year = y;
            return `${head}<div class="tl-item ${i.kind === 'ev' ? 'ev' : ''}"><span class="tl-date">${esc(i.t.slice(0, 10))}</span><span>${esc(i.label)} ${i.selector ? `<button class="tl-sel" data-investigate="${esc(i.selector)}" data-type="${esc(i.type || '')}">${esc(i.selector)}</button>` : ''}</span></div>`;
        }).join('');
    }

    return { render, renderTimeline, setupInteraction, exportDataURL, setCurrent };
})();
