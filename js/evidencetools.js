// Evidence integrity: page preservation (Wayback + archive.today), OpenTimestamps proofs, capture context
// (server IP / registrar at capture time), screenshot redaction, and import of pages auto-captured by the extension.
'use strict';

const EvidenceTools = (() => {
    const c = () => CaseFile.data;
    const find = id => c().evidence.find(e => e.id === id);

    // ---------- preservation ----------
    function preserve(ev) {
        const u = ev.source;
        const blocked = openMany([`https://web.archive.org/save/${u}`, `https://archive.ph/?url=${encodeURIComponent(u)}`]);
        ev.preserveRequested = new Date().toISOString();
        ev.archives ||= [];
        if (!ev.archives.some(a => a.service === 'archive.today')) ev.archives.push({ service: 'archive.today', url: `https://archive.ph/newest/${u}`, t: ev.preserveRequested });
        CaseFile.save(); CaseFile.renderEvidence();
        CaseFile.log('preserve', `Requested archiving of ${u}`, u);
        toast(blocked ? 'Allow pop-ups to open both archive pages, then press “Check archive” in a minute.' : 'Two archive pages opened. Complete any prompts there, then press “Check archive”.');
    }

    async function checkArchive(ev) {
        try {
            const ts = ev.preserveRequested.replace(/\D/g, '').slice(0, 14);
            const j = await fetchJSON(`https://archive.org/wayback/available?url=${encodeURIComponent(ev.source)}&timestamp=${ts}`);
            const snap = j.archived_snapshots?.closest;
            if (snap && snap.timestamp >= ts.slice(0, 8)) {
                ev.archives = (ev.archives || []).filter(a => a.service !== 'Wayback');
                ev.archives.unshift({ service: 'Wayback', url: snap.url, t: new Date().toISOString() });
                CaseFile.save(); CaseFile.renderEvidence();
                toast('Wayback capture found and attached');
            } else toast('No Wayback capture yet. It can take a few minutes.');
        } catch (e) { toast(`Check failed: ${e.message}`, 'err'); }
    }

    // ---------- OpenTimestamps ----------
    // The record below is what gets timestamped; it is saved alongside the proof so anyone can verify it with the `ots` tool.
    function record(ev) {
        return JSON.stringify({ case: c().id, evidence: `E${ev.no}`, title: ev.title, source: ev.source || null, captured: ev.created, text: ev.text || '', screenshotSha256: ev.imageSha256 || null }, null, 2);
    }
    const MAGIC = [0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94];
    const hexToBytes = h => Uint8Array.from(h.match(/../g), x => parseInt(x, 16));
    const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };

    async function timestamp(ev) {
        if (privacyOn()) return toast('Privacy mode is on: timestamping is disabled.', 'err');
        const rec = record(ev);
        const hash = await digest('SHA-256', rec);
        const calendars = ['https://a.pool.opentimestamps.org/digest', 'https://b.pool.opentimestamps.org/digest', 'https://alice.btc.calendar.opentimestamps.org/digest'];
        for (const cal of calendars) {
            try {
                const res = await fetch(cal, { method: 'POST', body: hexToBytes(hash), referrerPolicy: 'no-referrer' });
                if (!res.ok) continue;
                const proof = new Uint8Array(await res.arrayBuffer());
                // Detached .ots file: magic, version 1, SHA-256 op (0x08), digest, then the calendar's timestamp.
                const file = new Uint8Array(MAGIC.length + 2 + 32 + proof.length);
                file.set(MAGIC, 0); file[MAGIC.length] = 0x01; file[MAGIC.length + 1] = 0x08;
                file.set(hexToBytes(hash), MAGIC.length + 2); file.set(proof, MAGIC.length + 34);
                ev.ots = { hash, t: new Date().toISOString(), calendar: new URL(cal).hostname, proof: b64(file), record: rec };
                CaseFile.save(); CaseFile.renderEvidence();
                CaseFile.log('timestamp', `E${ev.no} timestamped via OpenTimestamps (${new URL(cal).hostname})`);
                toast('Timestamped. The proof is confirmed in the Bitcoin blockchain within a few hours.');
                return;
            } catch { /* try next calendar */ }
        }
        toast('Could not reach an OpenTimestamps server. Try again later.', 'err');
    }

    function downloadProof(ev) {
        const name = `${c().id}-E${ev.no}-record.json`;
        download(name, ev.ots.record, 'application/json');
        setTimeout(() => download(`${name}.ots`, Uint8Array.from(atob(ev.ots.proof), ch => ch.charCodeAt(0)), 'application/octet-stream'), 400);
        toast('Downloaded the record and its .ots proof. Verify later with: ots upgrade, then ots verify');
    }

    // ---------- capture context ----------
    async function captureContext(ev) {
        try {
            const host = new URL(ev.source).hostname;
            const dns = await fetchJSON(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`);
            const ips = (dns.Answer || []).filter(a => a.type === 1).map(a => a.data);
            let registrar = '';
            try {
                const r = await fetchJSON(`https://rdap.org/domain/${encodeURIComponent(registrable(host))}`);
                const ent = (r.entities || []).find(e => (e.roles || []).includes('registrar'));
                registrar = (ent?.vcardArray?.[1] || []).find(v => v[0] === 'fn')?.[3] || '';
            } catch { /* optional */ }
            const target = find(ev.id);
            if (!target) return;
            target.context = { host, ips, registrar, t: new Date().toISOString() };
            CaseFile.save(); CaseFile.renderEvidence();
        } catch { /* context is best-effort */ }
    }

    // ---------- redaction ----------
    function redact(src) {
        return new Promise(resolve => {
            const modal = $('#redact-modal'), cv = $('#rd-canvas'), ctx = cv.getContext('2d');
            const img = new Image();
            const boxes = [];
            let start = null, cur = null;
            const draw = () => {
                ctx.drawImage(img, 0, 0);
                for (const b of [...boxes, ...(cur ? [cur] : [])]) {
                    const [x, y, w, h] = [Math.min(b.x1, b.x2), Math.min(b.y1, b.y2), Math.abs(b.x2 - b.x1), Math.abs(b.y2 - b.y1)];
                    if (!w || !h) continue;
                    if (b.mode === 'blur') {
                        ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
                        ctx.filter = `blur(${Math.max(8, Math.round(Math.max(img.width, img.height) / 80))}px)`;
                        ctx.drawImage(img, 0, 0); ctx.restore(); ctx.filter = 'none';
                        // Pixelate on top so blur can’t be reversed by sharpening.
                        const s = 12, tmp = document.createElement('canvas'); tmp.width = Math.max(1, w / s); tmp.height = Math.max(1, h / s);
                        tmp.getContext('2d').drawImage(cv, x, y, w, h, 0, 0, tmp.width, tmp.height);
                        ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, x, y, w, h); ctx.imageSmoothingEnabled = true;
                    } else { ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h); }
                    if (b === cur) { ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); }
                }
            };
            const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
            img.onload = () => {
                cv.width = img.naturalWidth; cv.height = img.naturalHeight;
                draw();
                modal.classList.remove('hidden');
            };
            img.src = src;
            cv.onpointerdown = e => { start = pos(e); cur = { x1: start.x, y1: start.y, x2: start.x, y2: start.y, mode: document.querySelector('[name="rd-mode"]:checked').value }; cv.setPointerCapture(e.pointerId); };
            cv.onpointermove = e => { if (!cur) return; const p = pos(e); cur.x2 = p.x; cur.y2 = p.y; draw(); };
            cv.onpointerup = () => { if (cur && Math.abs(cur.x2 - cur.x1) > 3) boxes.push(cur); cur = null; draw(); };
            $('#rd-undo').onclick = () => { boxes.pop(); draw(); };
            const done = v => { modal.classList.add('hidden'); cv.onpointerdown = cv.onpointermove = cv.onpointerup = null; resolve(v); };
            $('#rd-cancel').onclick = () => done(null);
            $('#rd-apply').onclick = () => done(boxes.length ? cv.toDataURL('image/png') : null);
        });
    }

    // ---------- extension auto-capture ----------
    async function checkCaptures() {
        const host = $('#captures-banner');
        if (!window.AzimuthExtension?.ready || !host) return;
        try {
            const list = await ExtBridge.request('captures-list', {}, 10000);
            if (!list?.length) { host.classList.add('hidden'); return; }
            host.innerHTML = `<b>The extension captured ${list.length} page${list.length > 1 ? 's' : ''}</b> while recording (latest: ${esc(list[0].title || list[0].url)}).
                <div class="btn-row" style="margin:.4rem 0 0"><button class="btn small primary" id="cap-import">Import into this case</button><button class="btn small" id="cap-discard">Discard</button></div>`;
            host.classList.remove('hidden');
            $('#cap-import').onclick = async () => {
                $('#cap-import').disabled = true;
                const full = await ExtBridge.request('captures-get', { ids: list.map(x => x.id) }, 120000);
                for (const cap of full) {
                    const ev = await CaseFile.addEvidence({ title: `Page capture: ${cap.title || cap.url}`, source: cap.url, text: `Captured by the Azimuth extension at ${cap.t}\nURL: ${cap.url}\nPage HTML SHA-256: ${cap.htmlSha256}\nScreenshot SHA-256: ${cap.shotSha256}`, tags: ['auto-capture'], imageDataUrl: cap.screenshot });
                    if (cap.html) await blobStore.set(`${ev.id}:html`, cap.html);
                }
                await ExtBridge.request('captures-clear');
                host.classList.add('hidden');
                toast(`Imported ${full.length} captured pages`);
            };
            $('#cap-discard').onclick = async () => { if (confirm('Discard all pages captured by the extension?')) { await ExtBridge.request('captures-clear'); host.classList.add('hidden'); } };
        } catch { /* extension too old or unavailable */ }
    }

    function setup() {
        const board = $('#pin-board');
        // Banner for extension captures sits above the evidence list.
        const banner = document.createElement('div');
        banner.id = 'captures-banner';
        banner.className = 'notice hidden';
        board.parentElement.insertBefore(banner, board);
        board.addEventListener('click', e => {
            const p = e.target.closest('[data-preserve]'), ca = e.target.closest('[data-check-archive]'), o = e.target.closest('[data-ots]'), d = e.target.closest('[data-ots-dl]');
            if (p) preserve(find(p.dataset.preserve));
            if (ca) checkArchive(find(ca.dataset.checkArchive));
            if (o) { o.disabled = true; o.textContent = 'Timestamping…'; timestamp(find(o.dataset.ots)); }
            if (d) downloadProof(find(d.dataset.otsDl));
        });
        document.addEventListener('azimuth:extension', checkCaptures);
    }

    return { setup, redact, captureContext, checkCaptures, timestamp, record };
})();
