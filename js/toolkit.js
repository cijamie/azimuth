// Analyst toolkit: IOC extraction, codecs, hashing, EXIF, timestamps. All local.
'use strict';

// ---------- EXIF ----------
const EXIF_TAGS = {
    0x010E: 'Description', 0x010F: 'Make', 0x0110: 'Model', 0x0112: 'Orientation', 0x0131: 'Software', 0x0132: 'Modified',
    0x013B: 'Artist', 0x8298: 'Copyright', 0x9003: 'Taken', 0x9004: 'Digitized', 0x9010: 'Offset time', 0x9011: 'Offset (original)',
    0x829A: 'Exposure', 0x829D: 'F-number', 0x8827: 'ISO', 0x920A: 'Focal length', 0xA002: 'Pixel width', 0xA003: 'Pixel height',
    0xA420: 'Image unique ID', 0xA430: 'Camera owner', 0xA431: 'Body serial', 0xA433: 'Lens make', 0xA434: 'Lens model', 0xA435: 'Lens serial',
    0x9C9B: 'XP title', 0x9C9C: 'XP comment', 0x9C9D: 'XP author', 0x9286: 'User comment', 0xA005: '_interop',
};
const GPS_TAGS = { 1: 'LatRef', 2: 'Lat', 3: 'LonRef', 4: 'Lon', 5: 'AltRef', 6: 'Alt', 7: 'Time', 0x11: 'Direction', 0x10: 'DirectionRef', 0x1D: 'Date', 0x12: 'Datum' };

function parseExif(buffer) {
    const view = new DataView(buffer);
    let tiff = -1;
    if (view.getUint16(0) === 0xFFD8) {
        let off = 2;
        while (off < view.byteLength - 4) {
            const marker = view.getUint16(off);
            const size = view.getUint16(off + 2);
            if (marker === 0xFFE1 && view.getUint32(off + 4) === 0x45786966) { tiff = off + 10; break; }
            if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
            off += 2 + size;
        }
    } else if (view.getUint16(0) === 0x4949 || view.getUint16(0) === 0x4D4D) {
        tiff = 0;
    }
    if (tiff < 0) return null;
    const le = view.getUint16(tiff) === 0x4949;
    const u16 = o => view.getUint16(o, le), u32 = o => view.getUint32(o, le), s32 = o => view.getInt32(o, le);
    const sizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

    function readValue(entry) {
        const type = u16(entry + 2), count = u32(entry + 4);
        const len = (sizes[type] || 1) * count;
        const at = len > 4 ? tiff + u32(entry + 8) : entry + 8;
        if (at + len > view.byteLength) return null;
        const vals = [];
        for (let i = 0; i < count && i < 256; i++) {
            const p = at + i * (sizes[type] || 1);
            if (type === 1 || type === 7) vals.push(view.getUint8(p));
            else if (type === 3) vals.push(u16(p));
            else if (type === 4) vals.push(u32(p));
            else if (type === 9) vals.push(s32(p));
            else if (type === 5) vals.push(u32(p) / (u32(p + 4) || 1));
            else if (type === 10) vals.push(s32(p) / (s32(p + 4) || 1));
        }
        if (type === 2) {
            let s = '';
            for (let i = 0; i < count; i++) { const c = view.getUint8(at + i); if (!c) break; s += String.fromCharCode(c); }
            return s.trim();
        }
        return vals.length === 1 ? vals[0] : vals;
    }

    function readIFD(start, dict) {
        const out = {};
        if (start + 2 > view.byteLength) return out;
        const n = u16(start);
        for (let i = 0; i < n; i++) {
            const e = start + 2 + i * 12;
            if (e + 12 > view.byteLength) break;
            const tag = u16(e);
            if (tag === 0x8769 || tag === 0x8825) { out[tag === 0x8769 ? '_exif' : '_gps'] = u32(e + 8); continue; }
            const name = dict[tag];
            if (!name || name.startsWith('_')) continue;
            try { out[name] = readValue(e); } catch { /* skip malformed tag */ }
        }
        return out;
    }

    const ifd0 = readIFD(tiff + u32(tiff + 4), EXIF_TAGS);
    const exif = ifd0._exif ? readIFD(tiff + ifd0._exif, EXIF_TAGS) : {};
    const gps = ifd0._gps ? readIFD(tiff + ifd0._gps, GPS_TAGS) : {};
    delete ifd0._exif; delete ifd0._gps;
    const res = { ...ifd0, ...exif };
    for (const k of ['XP title', 'XP comment', 'XP author']) {
        if (Array.isArray(res[k])) res[k] = new TextDecoder('utf-16le').decode(new Uint8Array(res[k])).replace(/\0+$/, '');
    }
    if (Array.isArray(res['User comment'])) res['User comment'] = String.fromCharCode(...res['User comment'].slice(8)).replace(/\0+/g, '').trim();
    if (Array.isArray(gps.Lat) && Array.isArray(gps.Lon)) {
        const dms = a => a[0] + a[1] / 60 + a[2] / 3600;
        let lat = dms(gps.Lat), lon = dms(gps.Lon);
        if (gps.LatRef === 'S') lat = -lat;
        if (gps.LonRef === 'W') lon = -lon;
        if (isFinite(lat) && isFinite(lon) && !(lat === 0 && lon === 0)) res.GPS = { lat: +lat.toFixed(6), lon: +lon.toFixed(6) };
        if (typeof gps.Alt === 'number') res.Altitude = `${gps.Alt.toFixed(1)} m${gps.AltRef === 1 ? ' below sea level' : ''}`;
        if (gps.Date) res['GPS date'] = `${gps.Date} ${Array.isArray(gps.Time) ? gps.Time.map(x => String(Math.floor(x)).padStart(2, '0')).join(':') : ''} UTC`;
        if (typeof gps.Direction === 'number') res['Camera bearing'] = `${gps.Direction.toFixed(0)}° ${gps.DirectionRef === 'M' ? 'magnetic' : 'true'}`;
    }
    if (typeof res.Exposure === 'number') res.Exposure = res.Exposure < 1 ? `1/${Math.round(1 / res.Exposure)} s` : `${res.Exposure} s`;
    if (typeof res['F-number'] === 'number') res['F-number'] = `f/${res['F-number'].toFixed(1)}`;
    if (typeof res['Focal length'] === 'number') res['Focal length'] = `${res['Focal length']} mm`;
    for (const k of Object.keys(res)) if (res[k] === '' || res[k] == null) delete res[k];
    return res;
}

function exifRows(exif) {
    const rows = [];
    for (const [k, v] of Object.entries(exif)) {
        if (k === 'GPS') {
            rows.push(['GPS', `${v.lat}, ${v.lon}`, `https://www.google.com/maps?q=${v.lat},${v.lon}`]);
            rows.push(['Map (OSM)', 'OpenStreetMap', `https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lon}#map=17/${v.lat}/${v.lon}`]);
        } else rows.push([k, Array.isArray(v) ? v.join(', ') : String(v)]);
    }
    return rows;
}

// ---------- Codecs ----------
const b64enc = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const b64dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0)));

const CODECS = [
    ['Base64 encode', s => b64enc(s)],
    ['Base64 decode', s => b64dec(s)],
    ['URL encode', s => encodeURIComponent(s)],
    ['URL decode', s => decodeURIComponent(s.replace(/\+/g, ' '))],
    ['Hex encode', s => [...new TextEncoder().encode(s)].map(b => b.toString(16).padStart(2, '0')).join('')],
    ['Hex decode', s => new TextDecoder().decode(Uint8Array.from(s.replace(/[^0-9a-f]/gi, '').match(/../g) || [], h => parseInt(h, 16)))],
    ['HTML entities decode', s => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; }],
    ['HTML entities encode', s => esc(s)],
    ['ROT13', s => s.replace(/[a-z]/gi, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26))],
    ['Binary → text', s => new TextDecoder().decode(Uint8Array.from((s.match(/[01]{8}/g) || []), b => parseInt(b, 2)))],
    ['Text → binary', s => [...new TextEncoder().encode(s)].map(b => b.toString(2).padStart(8, '0')).join(' ')],
    ['Unicode escape decode', s => s.replace(/\\u\{?([0-9a-f]{4,6})\}?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))],
    ['Unicode domain → Punycode', s => s.split(/\s+/).filter(Boolean).map(d => new URL('http://' + d).hostname).join('\n')],
    ['JWT decode', s => {
        const [h, p] = s.trim().split('.');
        return JSON.stringify({ header: JSON.parse(b64dec(h)), payload: JSON.parse(b64dec(p)) }, null, 2);
    }],
    ['Refang (hxxp, [.])', s => refang(s)],
    ['Defang', s => s.split(/\s+/).map(defang).join('\n')],
    ['Reverse', s => [...s].reverse().join('')],
];

// ---------- Timestamps ----------
function decodeTime(input) {
    const s = input.trim();
    const rows = [];
    const show = (label, d) => { if (d instanceof Date && !isNaN(d) && d.getUTCFullYear() > 1970 && d.getUTCFullYear() < 2200) rows.push([label, `${d.toISOString()}  (${d.toLocaleString()} local)`]); };
    if (/^\d+$/.test(s)) {
        const n = BigInt(s);
        if (s.length <= 11) show('Unix seconds', new Date(Number(n) * 1000));
        if (s.length >= 12 && s.length <= 14) show('Unix milliseconds', new Date(Number(n)));
        if (s.length >= 15 && s.length <= 20) {
            show('X/Twitter snowflake', new Date(Number((n >> 22n) + 1288834974657n)));
            show('Discord snowflake', new Date(Number((n >> 22n) + 1420070400000n)));
            show('Unix microseconds', new Date(Number(n / 1000n)));
        }
        if (s.length >= 17 && s.length <= 18) {
            show('Chrome / WebKit time', new Date(Number(n / 1000n - 11644473600000n)));
            show('Windows FILETIME', new Date(Number(n / 10000n - 11644473600000n)));
        }
    } else {
        const d = new Date(s);
        if (!isNaN(d)) {
            rows.push(['ISO (UTC)', d.toISOString()], ['Unix seconds', String(Math.floor(d / 1000))], ['Unix ms', String(+d)], ['Local', d.toLocaleString()]);
        }
    }
    if (!rows.length) rows.push(['Result', 'Not recognised. Try a 10-digit Unix time, ms, a snowflake ID or an ISO date.']);
    return rows;
}

// ---------- UI wiring ----------
function renderKV(rows) {
    return rows.map(([k, v, href]) => `<div class="kv-row"><span class="k">${esc(k)}</span><span class="v">${href ? `<a href="${esc(safeUrl(href))}" target="_blank" rel="noopener noreferrer">${esc(v)}</a>` : esc(v)}</span><button class="icon-copy" data-copy="${esc(v)}" title="Copy">⧉</button></div>`).join('');
}

function switchToolkitTab(tab) {
    $$('#toolkit-tabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    $$('#view-toolkit .tabpane').forEach(p => p.classList.toggle('hidden', p.dataset.pane !== tab));
}

const IOC_LABELS = { url: 'URLs', email: 'Emails', ipv4: 'IPv4', ipv6: 'IPv6', domain: 'Domains', sha256: 'SHA-256', sha1: 'SHA-1', md5: 'MD5', btc: 'Bitcoin', eth: 'Ethereum', cve: 'CVEs' };

function setupToolkit() {
    $$('#toolkit-tabs .tab').forEach(btn => btn.addEventListener('click', () => switchToolkitTab(btn.dataset.tab)));

    // IOC extractor
    let lastIocs = {};
    const iocIn = $('#ioc-input');
    const renderIocs = () => {
        lastIocs = extractIOCs(iocIn.value);
        const keys = Object.keys(lastIocs);
        $('#ioc-output').innerHTML = keys.length ? keys.map(k => `
            <div class="ioc-group"><h4>${esc(IOC_LABELS[k])} <span class="muted">${lastIocs[k].length}</span></h4>
            <div class="chip-row">${lastIocs[k].map(v => `<button class="chip" data-investigate="${esc(v)}" title="Investigate">${esc(v)}</button>`).join('')}</div></div>`).join('')
            : (iocIn.value.trim() ? '<p class="muted small">No indicators found.</p>' : '');
    };
    iocIn.addEventListener('input', debounce(renderIocs, 250));
    $('#ioc-copy').onclick = () => copyText(Object.entries(lastIocs).map(([k, v]) => `# ${IOC_LABELS[k]}\n${v.join('\n')}`).join('\n\n'), 'Indicators copied');
    $('#ioc-defang').onclick = () => copyText(Object.values(lastIocs).flat().map(defang).join('\n'), 'Defanged list copied');

    // Codecs
    $('#codec-buttons').innerHTML = CODECS.map(([name], i) => `<button class="btn small" data-codec="${i}">${esc(name)}</button>`).join('');
    $('#codec-buttons').addEventListener('click', e => {
        const i = e.target.dataset.codec;
        if (i == null) return;
        try { $('#codec-output').value = CODECS[i][1]($('#codec-input').value); }
        catch (err) { $('#codec-output').value = `Error: ${err.message}`; }
    });

    // Hashing
    const showHashes = async (bytes, label) => {
        const [sha1, sha256, sha384, sha512] = await Promise.all(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map(a => digest(a, bytes)));
        const rows = [['MD5', md5(bytes)], ['SHA-1', sha1], ['SHA-256', sha256], ['SHA-384', sha384], ['SHA-512', sha512]];
        $('#hash-output').innerHTML = renderKV(rows) + (label ? `<div class="btn-row"><button class="btn small" data-investigate="${esc(sha256)}">Investigate SHA-256</button></div>` : '');
    };
    $('#hash-input').addEventListener('input', debounce(e => {
        $('#hash-file-name').textContent = '';
        if (e.target.value) showHashes(new TextEncoder().encode(e.target.value));
        else $('#hash-output').innerHTML = '';
    }, 150));
    $('#hash-file').addEventListener('change', async e => {
        const f = e.target.files[0];
        if (!f) return;
        $('#hash-file-name').textContent = `${f.name} (${f.size.toLocaleString()} bytes)`;
        showHashes(new Uint8Array(await f.arrayBuffer()), f.name);
    });

    // Time
    $('#time-input').addEventListener('input', debounce(e => {
        $('#time-output').innerHTML = e.target.value.trim() ? renderKV(decodeTime(e.target.value)) : '';
    }, 150));
}
