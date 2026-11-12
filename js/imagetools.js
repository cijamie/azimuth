// Photo check (EXIF, error level analysis, reverse-search helper), sun & shadow calculator, Wayback compare.
'use strict';

const ImageTools = (() => {
    let lastPhoto = null; // { file, dataUrl, exif, lat, lon, taken }

    // ---------- Sun position (standard astronomical formulas, as used by SunCalc) ----------
    const rad = Math.PI / 180, J1970 = 2440588, J2000 = 2451545, obliq = rad * 23.4397;
    const toDays = date => date / 864e5 - 0.5 + J1970 - J2000;
    function sunPosition(date, lat, lon) {
        const d = toDays(date), lw = rad * -lon, phi = rad * lat;
        const M = rad * (357.5291 + 0.98560028 * d);
        const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
        const L = M + C + rad * 102.9372 + Math.PI;
        const dec = Math.asin(Math.sin(0) * Math.cos(obliq) + Math.cos(0) * Math.sin(obliq) * Math.sin(L));
        const ra = Math.atan2(Math.sin(L) * Math.cos(obliq), Math.cos(L));
        const H = rad * (280.16 + 360.9856235 * d) - lw - ra;
        const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
        const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
        return { azimuth: (az / rad + 180 + 360) % 360, altitude: alt / rad }; // azimuth clockwise from north
    }
    const compass = deg => ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(deg / 22.5) % 16];

    function sunDial(az, alt) {
        const sx = 90 + 70 * Math.sin(az * rad), sy = 90 - 70 * Math.cos(az * rad);
        const len = alt > 0 ? Math.min(70, 25 / Math.tan(Math.max(alt, 3) * rad)) : 0;
        const shx = 90 - len * Math.sin(az * rad), shy = 90 + len * Math.cos(az * rad);
        return `<svg viewBox="0 0 180 180"><circle cx="90" cy="90" r="80" fill="none" stroke="var(--border-strong)"/>
            ${['N', 'E', 'S', 'W'].map((t, i) => `<text x="${90 + 88 * Math.sin(i * 90 * rad) - 4}" y="${90 - 88 * Math.cos(i * 90 * rad) + 4}" font-size="10" fill="var(--text-dim)">${t}</text>`).join('')}
            ${alt > 0 ? `<line x1="90" y1="90" x2="${shx}" y2="${shy}" stroke="var(--text-dim)" stroke-width="5" stroke-linecap="round" opacity=".6"/>` : ''}
            <line x1="90" y1="90" x2="${sx}" y2="${sy}" stroke="#f59e0b" stroke-dasharray="3 3"/>
            <circle cx="${sx}" cy="${sy}" r="9" fill="${alt > 0 ? '#facc15' : '#64748b'}"/><circle cx="90" cy="90" r="3" fill="var(--text)"/></svg>`;
    }

    function parseLL(s) {
        const m = String(s).match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
        return m ? { lat: +m[1], lon: +m[2] } : null;
    }

    function renderSun() {
        const ll = parseLL($('#sun-ll').value);
        const dtv = $('#sun-dt').value;
        const out = $('#sun-output');
        if (!ll || !dtv) { out.innerHTML = '<p class="muted small">Enter coordinates and a date/time.</p>'; return; }
        const tz = $('#sun-tz').value;
        // "place": solar-ish local time from longitude (15° per hour). Ignores daylight saving and political borders.
        const placeOffsetH = Math.round(ll.lon / 15);
        const date = tz === 'utc' ? new Date(dtv + 'Z') : tz === 'place' ? new Date(new Date(dtv + 'Z').getTime() - placeOffsetH * 3600e3) : new Date(dtv);
        const p = sunPosition(date, ll.lat, ll.lon);
        const rows = [['Sun direction', `${p.azimuth.toFixed(1)}° (${compass(p.azimuth)})`], ['Sun height', `${p.altitude.toFixed(1)}° ${p.altitude < 0 ? '(below the horizon: night)' : ''}`]];
        if (p.altitude > 0) {
            rows.push(['Shadows point', `${((p.azimuth + 180) % 360).toFixed(0)}° (${compass((p.azimuth + 180) % 360)})`]);
            rows.push(['Shadow length', `${(1 / Math.tan(p.altitude * rad)).toFixed(2)} × the object’s height`]);
        }
        const h = parseFloat($('#sun-h').value), s = parseFloat($('#sun-s').value);
        if (h > 0 && s > 0) {
            const target = Math.atan(h / s) / rad;
            rows.push(['Sun height from your shadow', `${target.toFixed(1)}°`]);
            // Scan the calendar day in the chosen time zone and show times in that zone.
            const offMs = tz === 'utc' ? 0 : tz === 'place' ? placeOffsetH * 3600e3 : -new Date(date).getTimezoneOffset() * 60e3;
            const day = new Date(new Date(dtv.slice(0, 10) + 'T00:00:00Z').getTime() - offMs);
            const fmtT = t => new Date(t.getTime() + offMs).toISOString().slice(11, 16);
            const matches = [];
            let prev = null;
            for (let m = 0; m <= 1440; m += 2) {
                const t = new Date(day.getTime() + m * 60e3);
                const a = sunPosition(t, ll.lat, ll.lon).altitude - target;
                if (prev && Math.sign(a) !== Math.sign(prev.a)) matches.push(t);
                prev = { a };
            }
            rows.push(['Times that match that day', matches.length ? matches.map(t => `${fmtT(t)} (sun at ${compass(sunPosition(t, ll.lat, ll.lon).azimuth)})`).join(' or ') : 'none: the sun never gets that high that day']);
            rows.push(['At the time you entered', Math.abs(p.altitude - target) < 3 ? '✓ consistent (within 3°)' : `✗ off by ${Math.abs(p.altitude - target).toFixed(1)}°`]);
        }
        const dstr = date.toISOString();
        rows.push(['Check on a map', 'SunCalc.org', `https://www.suncalc.org/#/${ll.lat},${ll.lon},17/${dstr.slice(0, 10).replace(/-/g, '.')}/${dstr.slice(11, 16)}/1/3`]);
        out.innerHTML = `<div class="sun-dial">${sunDial(p.azimuth, p.altitude)}<div class="kv-table" style="flex:1;min-width:260px">${renderKV(rows)}</div></div>
            <p class="muted small">Grey bar = shadow direction, yellow = sun. Results assume flat ground and a vertical object.
            ${tz === 'place' ? `Time is treated as local time at the location (UTC${placeOffsetH >= 0 ? '+' : ''}${placeOffsetH}, estimated from longitude). If daylight saving was in effect, the real offset is usually one hour more; switch to UTC for exact times.` : tz === 'local' ? 'Time is read in your computer’s time zone.' : ''}</p>`;
    }

    // ---------- Error level analysis ----------
    function loadImage(src) {
        return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    }
    async function ela(img, quality = 0.9, scale = 20) {
        const w = Math.min(img.naturalWidth, 1600), h = Math.round(img.naturalHeight * (w / img.naturalWidth));
        const a = Object.assign(document.createElement('canvas'), { width: w, height: h });
        const ctx = a.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const orig = ctx.getImageData(0, 0, w, h);
        const re = await loadImage(a.toDataURL('image/jpeg', quality));
        ctx.drawImage(re, 0, 0, w, h);
        const comp = ctx.getImageData(0, 0, w, h);
        const out = ctx.createImageData(w, h);
        for (let i = 0; i < orig.data.length; i += 4) {
            for (let c = 0; c < 3; c++) out.data[i + c] = Math.min(255, Math.abs(orig.data[i + c] - comp.data[i + c]) * scale);
            out.data[i + 3] = 255;
        }
        ctx.putImageData(out, 0, 0);
        return a;
    }

    async function copyImageToClipboard(img) {
        const c = Object.assign(document.createElement('canvas'), { width: img.naturalWidth, height: img.naturalHeight });
        c.getContext('2d').drawImage(img, 0, 0);
        const blob = await new Promise(r => c.toBlob(r, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    }

    async function photoCheck(file) {
        if (!file || !file.type.startsWith('image/')) return toast('Choose an image file', 'err');
        const buf = await file.arrayBuffer();
        const dataUrl = await fileToDataURL(file);
        const exif = parseExif(buf.slice(0)) || {};
        const sha = await digest('SHA-256', buf);
        const img = await loadImage(dataUrl);
        lastPhoto = { file, dataUrl, exif, lat: exif.GPS?.lat, lon: exif.GPS?.lon, taken: exif.Taken };
        if (exif.GPS) CaseFile.addPlace({ lat: exif.GPS.lat, lon: exif.GPS.lon, label: `Photo: ${file.name}`, source: 'photo GPS (EXIF)' });
        $('#sun-from-photo').disabled = !(lastPhoto.lat && lastPhoto.taken);
        const base = [['File', file.name], ['Size', `${file.size.toLocaleString()} bytes · ${img.naturalWidth}×${img.naturalHeight}`], ['SHA-256', sha]];
        const exRows = exifRows(exif);
        const verdict = exRows.length
            ? `<p class="small"><b class="ok">Metadata found.</b> ${exif.GPS ? 'It includes a GPS location. ' : ''}${exif.Software ? `Last saved with <b>${esc(exif.Software)}</b>${/photoshop|gimp|lightroom|snapseed|picsart|canva/i.test(exif.Software) ? ' (an editor: the image may have been changed)' : ''}. ` : ''}</p>`
            : '<p class="small muted">No metadata: most social networks and messaging apps strip it. Originals from email, cloud drives or forums are more likely to have it.</p>';
        $('#img-output').innerHTML = `
            <div class="img-grid">
                <div><h4>Photo</h4><img src="${dataUrl}" alt="">
                    <div class="btn-row">
                        <button class="btn primary" data-rev="https://lens.google.com/">Search Google Lens</button>
                        <button class="btn" data-rev="https://yandex.com/images/">Yandex</button>
                        <button class="btn" data-rev="https://www.bing.com/visualsearch">Bing</button>
                        <button class="btn" data-rev="https://tineye.com/">TinEye</button>
                    </div>
                    <p class="muted tiny">Copies the photo, then opens the site: press Ctrl+V there to search. (Web pages can’t upload to other sites for you.)</p>
                </div>
                <div><h4>Error level analysis <span class="muted small">bright, blocky patches can mean edited areas</span></h4><div id="ela-slot"><span class="spinner"></span></div>
                    <label class="toggle" style="margin-top:.5rem">Brightness <input type="range" id="ela-scale" min="5" max="60" value="20"></label>
                    <p class="muted tiny">ELA works best on JPEGs. Edges and text are always bright; look for areas that differ from similar surroundings.</p>
                </div>
            </div>
            <div class="card" style="margin-top:1rem">
                ${verdict}
                <div class="kv-table">${renderKV(base)}${renderKV(exRows)}</div>
                <div class="btn-row">
                    ${exif.GPS ? `<button class="btn" id="photo-investigate-gps">Show location</button>` : ''}
                    ${lastPhoto.lat && lastPhoto.taken ? '<button class="btn" id="photo-sun">Check the shadows for this photo</button>' : ''}
                    <button class="btn primary" id="photo-to-case">⊕ Save to case</button>
                </div>
            </div>`;
        const draw = async () => { const c = await ela(img, 0.9, +$('#ela-scale').value); const slot = $('#ela-slot'); slot.innerHTML = ''; slot.appendChild(c); };
        draw();
        $('#ela-scale').oninput = debounce(draw, 150);
        $$('#img-output [data-rev]').forEach(b => b.onclick = async () => {
            try { await copyImageToClipboard(img); toast('Photo copied: press Ctrl+V on the search page'); } catch { toast('Could not copy the image. Save it and upload it on the site instead.', 'err'); }
            window.open(b.dataset.rev, '_blank', 'noopener');
            CaseFile.log('tool', `Reverse image search (${new URL(b.dataset.rev).hostname}) for ${file.name}`, b.dataset.rev);
        });
        $('#photo-investigate-gps')?.addEventListener('click', () => window.open(`https://www.google.com/maps?q=${exif.GPS.lat},${exif.GPS.lon}`, '_blank', 'noopener'));
        $('#photo-sun')?.addEventListener('click', usePhotoForSun);
        $('#photo-to-case').onclick = () => CaseFile.addEvidence({
            title: `Photo: ${file.name}`,
            text: [...base, ...exRows].map(r => `${r[0]}: ${r[1]}`).join('\n'),
            tags: ['photo', ...(exif.GPS ? ['gps'] : [])],
            imageDataUrl: file.size < 10e6 ? dataUrl : null,
        });
        CaseFile.log('tool', `Photo check: ${file.name} (SHA-256 ${sha.slice(0, 16)}…)`);
    }

    function usePhotoForSun() {
        if (!lastPhoto?.lat) return;
        $('#sun-ll').value = `${lastPhoto.lat}, ${lastPhoto.lon}`;
        const m = String(lastPhoto.taken).match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/);
        if (m) $('#sun-dt').value = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
        $('#sun-tz').value = 'place';
        switchToolkitTab('sun');
        renderSun();
        toast('Camera clocks usually show local time where the photo was taken.');
    }

    // ---------- Wayback compare ----------
    async function waybackCaptures(url) {
        const avail = ts => fetchJSON(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}${ts ? `&timestamp=${ts}` : ''}`).then(j => j.archived_snapshots?.closest).catch(() => null);
        const first = await avail('19960101');
        if (!first) return [];
        const startYear = +first.timestamp.slice(0, 4), now = new Date().getFullYear();
        const stamps = [];
        for (let y = startYear; y <= now; y++) stamps.push(`${y}0101`, `${y}0701`);
        const found = new Map([[first.timestamp, first]]);
        for (let i = 0; i < stamps.length; i += 8) {
            const batch = await Promise.all(stamps.slice(i, i + 8).map(avail));
            batch.filter(Boolean).forEach(s => found.set(s.timestamp, s));
            $('#wb-output').innerHTML = `<p class="muted small"><span class="spinner"></span> Looking through ${startYear}–${now}… ${found.size} captures so far</p>`;
        }
        const latest = await avail('');
        if (latest) found.set(latest.timestamp, latest);
        return [...found.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    async function waybackCompare() {
        let url = $('#wb-url').value.trim();
        if (!url) return;
        if (!/^https?:/i.test(url)) url = 'https://' + url;
        $('#wb-output').innerHTML = '<p class="muted small"><span class="spinner"></span> Finding captures…</p>';
        const caps = await waybackCaptures(url);
        if (!caps.length) { $('#wb-output').innerHTML = '<p class="muted">The Wayback Machine has no captures of this page.</p>'; return; }
        let a = caps[0].timestamp, b = caps[caps.length - 1].timestamp;
        const fmt = ts => `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
        const paint = () => {
            $('#wb-output').innerHTML = `
                <p class="small">${caps.length} sample captures (about two a year). Click one to set the <b class="ok">left</b> view, Shift+click for the <b style="color:var(--blue)">right</b>.</p>
                <div class="wb-years">${caps.map(c => `<button class="btn small ${c.timestamp === a ? 'sel-a' : ''} ${c.timestamp === b ? 'sel-b' : ''}" data-ts="${c.timestamp}">${fmt(c.timestamp)}</button>`).join('')}</div>
                <div class="btn-row"><a class="btn primary" target="_blank" rel="noopener noreferrer" href="https://web.archive.org/web/diff/${a}/${b}/${encodeURIComponent(url)}">Highlight text changes (Wayback “Changes”) ↗</a>
                <a class="btn" target="_blank" rel="noopener noreferrer" href="https://web.archive.org/web/*/${encodeURIComponent(url)}">All captures ↗</a></div>
                <div class="wb-frames" style="margin-top:.8rem">
                    <div><div class="small ok">${fmt(a)}</div><iframe src="https://web.archive.org/web/${a}if_/${url}" loading="lazy" sandbox="allow-same-origin" referrerpolicy="no-referrer"></iframe></div>
                    <div><div class="small" style="color:var(--blue)">${fmt(b)}</div><iframe src="https://web.archive.org/web/${b}if_/${url}" loading="lazy" sandbox="allow-same-origin" referrerpolicy="no-referrer"></iframe></div>
                </div>`;
            $$('#wb-output [data-ts]').forEach(btn => btn.onclick = e => { if (e.shiftKey) b = btn.dataset.ts; else a = btn.dataset.ts; paint(); });
        };
        paint();
        CaseFile.log('tool', `Wayback comparison for ${url}`);
    }

    function setup() {
        $('#img-file').addEventListener('change', e => photoCheck(e.target.files[0]));
        const drop = $('#img-drop');
        drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('over'));
        drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); photoCheck(e.dataTransfer.files[0]); });
        ['#sun-ll', '#sun-dt', '#sun-tz', '#sun-h', '#sun-s'].forEach(id => $(id).addEventListener('input', debounce(renderSun, 150)));
        $('#sun-from-photo').onclick = usePhotoForSun;
        const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60e3);
        $('#sun-dt').value = now.toISOString().slice(0, 16);
        $('#wb-load').onclick = waybackCompare;
        $('#wb-url').addEventListener('keydown', e => { if (e.key === 'Enter') waybackCompare(); });
    }

    return { setup, photoCheck, sunPosition, renderSun };
})();
