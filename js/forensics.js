// Local forensics: email header analysis, document metadata, video keyframes, searching large files.
'use strict';

const Forensics = (() => {
    // ================= Email headers =================
    function parseHeaders(raw) {
        const lines = raw.replace(/\r/g, '').split('\n');
        const out = [];
        for (const line of lines) {
            if (/^[ \t]/.test(line) && out.length) out[out.length - 1][1] += ' ' + line.trim();
            else { const m = line.match(/^([\w-]+):\s*(.*)$/); if (m) out.push([m[1], m[2]]); else if (!line.trim() && out.length > 3) break; }
        }
        return out;
    }
    const hget = (h, name) => h.filter(([k]) => k.toLowerCase() === name.toLowerCase()).map(([, v]) => v);
    const addrDomain = s => (String(s || '').match(/@([a-z0-9.-]+\.[a-z]{2,})/i)?.[1] || '').toLowerCase();
    const org = d => (d ? registrable(d) : '');

    function parseReceived(v) {
        const seg = (key) => v.match(new RegExp(`\\b${key}\\s+(.+?)(?=\\s+(?:from|by|with|id|for|via)\\b|;|$)`, 'i'))?.[1]?.trim();
        const from = seg('from') || '';
        const ips = [...from.matchAll(/\[?((?:\d{1,3}\.){3}\d{1,3}|[0-9a-f:]{6,}:[0-9a-f:]+)\]?/gi)].map(m => m[1].replace(/^IPv6:/i, '')).filter(ip => RE.ipv4.test(ip) || RE.ipv6.test(ip));
        const dateStr = v.includes(';') ? v.slice(v.lastIndexOf(';') + 1).trim() : '';
        const date = dateStr ? new Date(dateStr.replace(/\s*\([^)]*\)\s*$/, '')) : null;
        return { from, by: seg('by') || '', with: seg('with') || '', ips: [...new Set(ips)], date: date && !isNaN(date) ? date : null, raw: v };
    }

    function analyzeHeaders(raw) {
        const h = parseHeaders(raw);
        if (!h.length) return null;
        const hops = hget(h, 'Received').map(parseReceived).reverse(); // oldest first
        hops.forEach((x, i) => { x.delay = i && x.date && hops[i - 1].date ? (x.date - hops[i - 1].date) / 1000 : null; });
        const from = hget(h, 'From')[0] || '', returnPath = hget(h, 'Return-Path')[0] || '', replyTo = hget(h, 'Reply-To')[0] || '', sender = hget(h, 'Sender')[0] || '';
        const msgId = hget(h, 'Message-ID')[0] || hget(h, 'Message-Id')[0] || '';
        const auth = hget(h, 'Authentication-Results').join(' ; ') + ' ' + hget(h, 'ARC-Authentication-Results').join(' ; ');
        const result = k => (auth.match(new RegExp(`\\b${k}=(\\w+)`, 'i'))?.[1] || '').toLowerCase();
        const spf = result('spf') || (hget(h, 'Received-SPF')[0] || '').split(/\s/)[0].toLowerCase();
        const dkim = result('dkim'), dmarc = result('dmarc');
        const dkimSigs = hget(h, 'DKIM-Signature').map(v => ({ d: (v.match(/\bd=([^;\s]+)/)?.[1] || '').toLowerCase(), s: v.match(/\bs=([^;\s]+)/)?.[1] || '' }));
        const fromDomain = addrDomain(from);
        const flags = [], good = [];
        const fail = r => /fail|softfail|none|neutral|temperror|permerror/.test(r);
        if (spf) (fail(spf) ? flags : good).push(`SPF: ${spf}`); else flags.push('No SPF result recorded');
        if (dkim) (fail(dkim) ? flags : good).push(`DKIM: ${dkim}`); else if (!dkimSigs.length) flags.push('Not DKIM-signed');
        if (dmarc) (fail(dmarc) ? flags : good).push(`DMARC: ${dmarc}`);
        if (dkimSigs.length && fromDomain && !dkimSigs.some(s => org(s.d) === org(fromDomain))) flags.push(`DKIM signature is for ${dkimSigs.map(s => s.d).join(', ')}, not the sender’s domain ${fromDomain}`);
        const rpDomain = addrDomain(returnPath);
        if (rpDomain && fromDomain && org(rpDomain) !== org(fromDomain)) flags.push(`Bounce address (Return-Path) is at ${rpDomain}, not ${fromDomain}`);
        const rtDomain = addrDomain(replyTo);
        if (rtDomain && fromDomain && org(rtDomain) !== org(fromDomain)) flags.push(`Replies go to ${rtDomain}, a different domain from the sender (${fromDomain})`);
        const display = from.replace(/<[^>]*>/, '');
        const displayAddr = addrDomain(display);
        if (displayAddr && org(displayAddr) !== org(fromDomain)) flags.push(`The display name contains a different address (${displayAddr}) than the real sender (${fromDomain})`);
        if (/(paypal|apple|microsoft|amazon|google|netflix|bank|dhl|fedex|ups|royal mail|hmrc|irs|docusign|office ?365)/i.test(display) && fromDomain && !new RegExp(display.match(/(paypal|apple|microsoft|amazon|google|netflix|dhl|fedex|ups|docusign)/i)?.[1] || '^$', 'i').test(fromDomain)) flags.push(`Display name mentions a well-known brand, but the address is at ${fromDomain}`);
        const midDomain = (msgId.match(/@([^>\s]+)/)?.[1] || '').toLowerCase();
        if (midDomain && fromDomain && org(midDomain) !== org(fromDomain) && !/google|outlook|prod\.outlook|amazonses|sendgrid|mailgun|mailchimp|mcsv|sparkpost|mandrill/.test(midDomain)) flags.push(`Message-ID was created at ${midDomain}, not the sender’s domain`);
        const dateHdr = new Date(hget(h, 'Date')[0] || '');
        if (!isNaN(dateHdr) && hops[0]?.date && Math.abs(hops[0].date - dateHdr) > 3600e3) flags.push(`The Date header differs from the first server timestamp by ${Math.round(Math.abs(hops[0].date - dateHdr) / 3600e3)} hours`);
        const origIp = hget(h, 'X-Originating-IP')[0] || hget(h, 'X-Sender-IP')[0] || hget(h, 'X-Forwarded-For')[0] || '';
        const publicHops = hops.filter(x => x.ips.some(ip => !(RE.ipv4.test(ip) && isPrivateIPv4(ip))));
        const firstExternal = publicHops[0];
        const fields = [['From', from], ['Reply-To', replyTo], ['Return-Path', returnPath], ['Sender', sender], ['Subject', hget(h, 'Subject')[0]], ['Date', hget(h, 'Date')[0]], ['Message-ID', msgId], ['Mail software', hget(h, 'X-Mailer')[0] || hget(h, 'User-Agent')[0]], ['Originating IP (sender’s own)', origIp.replace(/[[\]]/g, '')], ['Sending server', firstExternal ? `${firstExternal.from} (${firstExternal.ips.join(', ')})` : ''], ['DKIM signers', dkimSigs.map(s => `${s.d} (selector ${s.s})`).join(', ')]].filter(r => r[1]);
        return { hops, flags, good, fields, fromDomain, origIp: origIp.replace(/[[\]]/g, '').trim(), ips: [...new Set(hops.flatMap(x => x.ips).filter(ip => !(RE.ipv4.test(ip) && isPrivateIPv4(ip))))] };
    }

    function renderHeaders() {
        const raw = $('#hdr-input').value;
        const out = $('#hdr-output');
        if (!raw.trim()) { out.innerHTML = ''; return; }
        const a = analyzeHeaders(raw);
        if (!a) { out.innerHTML = '<p class="muted small">No headers recognised.</p>'; return; }
        const verdict = a.flags.length ? `<div class="notice"><b>${a.flags.length} warning sign${a.flags.length > 1 ? 's' : ''}</b><ul>${a.flags.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : '<div class="summary-card"><b class="ok">No spoofing signs found.</b> Authentication passed and the addresses line up.</div>';
        out.innerHTML = `${verdict}
            ${a.good.length ? `<p class="small ok">✓ ${a.good.map(esc).join(' · ')}</p>` : ''}
            <div class="kv-table">${renderKV(a.fields)}</div>
            <h4 style="margin:1rem 0 .4rem">Route (${a.hops.length} hops, oldest first)</h4>
            <table class="data-table"><thead><tr><th>#</th><th>From</th><th>By</th><th>Time (UTC)</th><th>Delay</th></tr></thead><tbody>
            ${a.hops.map((x, i) => `<tr><td>${i + 1}</td><td class="small mono">${esc(x.from.slice(0, 120))} ${x.ips.map(ip => `<button class="chip" data-investigate="${esc(ip)}">${esc(ip)}</button>`).join(' ')}</td><td class="small mono">${esc(x.by.slice(0, 80))}</td><td class="small mono">${x.date ? esc(x.date.toISOString().replace('T', ' ').slice(0, 19)) : '-'}</td><td class="small ${x.delay > 3600 ? 'warn' : ''}">${x.delay == null ? '' : x.delay < 0 ? `<span class="warn">${Math.round(x.delay)}s (clock skew)</span>` : `${Math.round(x.delay)}s`}</td></tr>`).join('')}
            </tbody></table>
            <div class="btn-row">
                ${a.fromDomain ? `<button class="btn" data-investigate="${esc(a.fromDomain)}">Investigate ${esc(a.fromDomain)}</button>` : ''}
                ${a.origIp ? `<button class="btn" data-investigate="${esc(a.origIp)}">Investigate sender IP ${esc(a.origIp)}</button>` : ''}
                <button class="btn primary" id="hdr-save">⊕ Save analysis to case</button>
            </div>`;
        $('#hdr-save').onclick = () => {
            CaseFile.addEvidence({
                title: `Email header analysis: ${a.fields.find(f => f[0] === 'Subject')?.[1] || a.fromDomain || 'message'}`,
                text: [...a.flags.map(f => `⚠ ${f}`), ...a.good.map(g => `✓ ${g}`), '', ...a.fields.map(([k, v]) => `${k}: ${v}`), '', 'Route:', ...a.hops.map((x, i) => `${i + 1}. ${x.from} [${x.ips.join(', ')}] → ${x.by} ${x.date ? x.date.toISOString() : ''}`)].join('\n'),
                tags: ['email', 'headers', ...(a.flags.length ? ['risk'] : [])],
            });
            if (a.fromDomain) CaseFile.addSelector({ type: 'domain', value: a.fromDomain });
            const parent = a.fromDomain ? { type: 'domain', value: a.fromDomain } : null;
            if (parent) CaseFile.addLeads(parent, a.ips.map(ip => ({ type: 'ip', value: ip, via: 'email route' })));
        };
    }

    // ================= Document metadata =================
    let jszipPromise = null;
    function loadJSZip() {
        if (window.JSZip) return Promise.resolve(window.JSZip);
        return jszipPromise ||= new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            s.onload = () => res(window.JSZip);
            s.onerror = () => { jszipPromise = null; rej(new Error('Could not load the ZIP reader')); };
            document.head.appendChild(s);
        });
    }

    const xmlText = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'g'))].map(m => decodeXml(m[1].replace(/<[^>]+>/g, '').trim())).filter(Boolean);
    const decodeXml = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
    const pathUsers = text => [...new Set([...text.matchAll(/(?:[A-Z]:\\(?:Users|Documents and Settings)\\|\/Users\/|\/home\/)([^\\/\s"'<>]+)/gi)].map(m => m[1]))].filter(u => !/^(public|default|all users|shared)$/i.test(u));

    async function officeMeta(file) {
        const JSZip = await loadJSZip();
        const zip = await JSZip.loadAsync(file);
        const read = async p => (zip.file(p) ? zip.file(p).async('string') : '');
        const rows = [];
        const core = await read('docProps/core.xml'), app = await read('docProps/app.xml'), custom = await read('docProps/custom.xml'), odf = await read('meta.xml');
        const put = (k, v) => { if (v && (!Array.isArray(v) || v.length)) rows.push([k, Array.isArray(v) ? [...new Set(v)].join(', ') : v]); };
        put('Author', xmlText(core, 'dc:creator'));
        put('Last edited by', xmlText(core, 'cp:lastModifiedBy'));
        put('Created', xmlText(core, 'dcterms:created'));
        put('Last saved', xmlText(core, 'dcterms:modified'));
        put('Last printed', xmlText(core, 'cp:lastPrinted'));
        put('Revision number', xmlText(core, 'cp:revision'));
        put('Title', xmlText(core, 'dc:title'));
        put('Subject', xmlText(core, 'dc:subject'));
        put('Keywords', xmlText(core, 'cp:keywords'));
        put('Comments field', xmlText(core, 'dc:description'));
        put('Category', xmlText(core, 'cp:category'));
        put('Application', [xmlText(app, 'Application')[0], xmlText(app, 'AppVersion')[0]].filter(Boolean).join(' '));
        put('Company', xmlText(app, 'Company'));
        put('Manager', xmlText(app, 'Manager'));
        put('Template', xmlText(app, 'Template'));
        const mins = xmlText(app, 'TotalTime')[0];
        if (mins) put('Total editing time', `${mins} minutes`);
        put('Pages / words', [xmlText(app, 'Pages')[0], xmlText(app, 'Words')[0]].filter(Boolean).join(' / '));
        for (const m of custom.matchAll(/<property[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/property>/g)) put(`Custom: ${m[1]}`, m[2].replace(/<[^>]+>/g, '').trim());
        // OpenDocument
        put('Initial author', xmlText(odf, 'meta:initial-creator'));
        put('Author', xmlText(odf, 'dc:creator'));
        put('Created', xmlText(odf, 'meta:creation-date'));
        put('Last saved', xmlText(odf, 'dc:date'));
        put('Application', xmlText(odf, 'meta:generator'));
        put('Times edited', xmlText(odf, 'meta:editing-cycles'));
        put('Editing time', xmlText(odf, 'meta:editing-duration'));
        // People who commented or tracked changes
        const authors = new Set();
        for (const p of Object.keys(zip.files).filter(n => /(comments|commentAuthors|people|document)\d*\.xml$/i.test(n) || /^xl\/comments/.test(n) || /^ppt\/comments/.test(n))) {
            const x = await read(p);
            for (const m of x.matchAll(/(?:w:author|author|w15:author)="([^"]+)"/g)) authors.add(decodeXml(m[1]));
            for (const m of x.matchAll(/<(?:author|p:cmAuthor)[^>]*?(?:name="([^"]+)")?[^>]*>(?:([^<]+)<\/author>)?/g)) { if (m[1]) authors.add(decodeXml(m[1])); if (m[2]) authors.add(decodeXml(m[2])); }
        }
        put('Comment / tracked-change authors', [...authors]);
        // External links and file paths (often leak usernames and internal servers)
        let rels = '';
        for (const p of Object.keys(zip.files).filter(n => n.endsWith('.rels'))) rels += await read(p);
        const ext = [...new Set([...rels.matchAll(/Target="([^"]+)"[^>]*TargetMode="External"/g)].map(m => decodeXml(m[1])))];
        put('External links', ext.slice(0, 30));
        const docText = (await read('word/document.xml')) + rels + app;
        put('Usernames in file paths', pathUsers(docText));
        put('Embedded media', Object.keys(zip.files).filter(n => /\/media\//.test(n)).map(n => n.split('/').pop()).slice(0, 30));
        return rows;
    }

    function pdfString(raw) {
        if (raw.startsWith('<')) {
            const hex = raw.slice(1, -1).replace(/\s/g, '');
            const bytes = hex.match(/../g)?.map(h => parseInt(h, 16)) || [];
            if (bytes[0] === 0xfe && bytes[1] === 0xff) { let s = ''; for (let i = 2; i + 1 < bytes.length; i += 2) s += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]); return s; }
            return String.fromCharCode(...bytes);
        }
        let s = raw.slice(1, -1).replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, e) => ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' }[e] ?? String.fromCharCode(parseInt(e, 8))));
        if (s.charCodeAt(0) === 0xfe && s.charCodeAt(1) === 0xff) { let o = ''; for (let i = 2; i + 1 < s.length; i += 2) o += String.fromCharCode((s.charCodeAt(i) << 8) | s.charCodeAt(i + 1)); return o; }
        return s;
    }
    const pdfDate = s => { const m = String(s).match(/D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([Z+-])?(\d{2})?'?(\d{2})?/); return m ? `${m[1]}-${m[2] || '01'}-${m[3] || '01'} ${m[4] || '00'}:${m[5] || '00'}:${m[6] || '00'}${m[7] && m[7] !== 'Z' ? ` ${m[7]}${m[8]}:${m[9] || '00'}` : m[7] === 'Z' ? ' UTC' : ''}` : s; };

    async function inflate(bytes) {
        const ds = new DecompressionStream('deflate');
        const out = new Response(new Blob([bytes]).stream().pipeThrough(ds));
        return new Uint8Array(await out.arrayBuffer());
    }

    async function pdfMeta(file) {
        const buf = new Uint8Array(await file.arrayBuffer());
        const latin = new TextDecoder('latin1').decode(buf);
        let text = latin;
        // Also look inside compressed object streams and metadata streams (PDF 1.5+ hides /Info there).
        const streams = [...latin.matchAll(/\/Type\s*\/(ObjStm|Metadata)[\s\S]{0,400}?stream\r?\n/g)].slice(0, 60);
        for (const m of streams) {
            const start = m.index + m[0].length;
            const end = latin.indexOf('endstream', start);
            if (end < 0) continue;
            const dict = latin.slice(Math.max(0, m.index - 300), start);
            const len = +(m[0].match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/)?.[1] || 0);
            let stop = len && start + len <= end ? start + len : end;
            while (stop > start && (buf[stop - 1] === 0x0a || buf[stop - 1] === 0x0d)) stop--;
            const bytes = buf.subarray(start, stop);
            try { text += '\n' + new TextDecoder('latin1').decode(/FlateDecode/.test(dict) ? await inflate(bytes) : bytes); } catch { /* skip unreadable stream */ }
        }
        const rows = [];
        const info = k => [...text.matchAll(new RegExp(`/${k}\\s*(\\((?:\\\\.|[^\\\\)])*\\)|<[0-9A-Fa-f\\s]+>)`, 'g'))].map(m => pdfString(m[1]).trim()).filter(Boolean);
        const put = (k, v) => { const arr = [...new Set((Array.isArray(v) ? v : [v]).filter(Boolean))]; if (arr.length) rows.push([k, arr.join(' | ')]); };
        put('PDF version', latin.slice(0, 16).match(/%PDF-(\d\.\d)/)?.[1]);
        put('Title', info('Title'));
        put('Author', info('Author'));
        put('Subject', info('Subject'));
        put('Keywords', info('Keywords'));
        put('Created with', info('Creator'));
        put('Converted by', info('Producer'));
        put('Created', info('CreationDate').map(pdfDate));
        put('Modified', info('ModDate').map(pdfDate));
        const xmp = text.match(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/)?.[0] || '';
        if (xmp) {
            put('XMP: author', xmlText(xmp.match(/<dc:creator>[\s\S]*?<\/dc:creator>/)?.[0] || '', 'rdf:li'));
            put('XMP: creator tool', xmlText(xmp, 'xmp:CreatorTool'));
            put('XMP: created', xmlText(xmp, 'xmp:CreateDate'));
            put('XMP: modified', xmlText(xmp, 'xmp:ModifyDate'));
            put('XMP: document ID', xmlText(xmp, 'xmpMM:DocumentID'));
            put('XMP: history', xmlText(xmp, 'stEvt:softwareAgent'));
        }
        const eofs = (latin.match(/%%EOF/g) || []).length;
        if (eofs > 1) rows.push(['Saved after creation', `${eofs - 1} incremental update(s): the file was edited after it was first created`]);
        put('Pages', String((latin.match(/\/Type\s*\/Page[^s]/g) || []).length || ''));
        put('Usernames in file paths', pathUsers(text));
        if (/\/Encrypt\b/.test(latin)) rows.push(['Encrypted', 'yes (some metadata may be unreadable)']);
        if (/\/JavaScript|\/JS\b/.test(latin)) rows.push(['⚠ Contains JavaScript', 'yes: treat as potentially malicious']);
        if (/\/Launch|\/EmbeddedFile/.test(latin)) rows.push(['⚠ Embedded files or launch actions', 'yes']);
        return rows;
    }

    async function docFiles(files) {
        const out = $('#doc-output');
        out.innerHTML = '<p class="muted small"><span class="spinner"></span> Reading…</p>';
        const blocks = [];
        for (const f of files) {
            let rows = [];
            try {
                if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') rows = await pdfMeta(f);
                else rows = await officeMeta(f);
            } catch (e) { rows = [['Error', e.message]]; }
            const sha = await digest('SHA-256', await f.arrayBuffer());
            rows.unshift(['File', `${f.name} (${f.size.toLocaleString()} bytes)`], ['SHA-256', sha]);
            blocks.push({ f, rows });
        }
        out.innerHTML = blocks.map((b, i) => `<div class="card" style="margin-top:1rem"><div class="card-head"><h2>${esc(b.f.name)}</h2><span class="spacer"></span><button class="btn small primary" data-doc-save="${i}">⊕ Save to case</button></div><div class="kv-table">${renderKV(b.rows)}</div></div>`).join('');
        out.onclick = e => {
            const s = e.target.closest('[data-doc-save]');
            if (!s) return;
            const b = blocks[+s.dataset.docSave];
            CaseFile.addEvidence({ title: `Document metadata: ${b.f.name}`, text: b.rows.map(([k, v]) => `${k}: ${v}`).join('\n'), tags: ['document', 'metadata'] });
            s.disabled = true; s.textContent = '✓ Saved';
        };
        CaseFile.log('tool', `Document metadata: ${files.map(f => f.name).join(', ')}`);
    }

    // ================= Video keyframes =================
    async function mp4Info(file) {
        // Walk top-level boxes to find 'moov', then read mvhd creation time and any ISO 6709 location string.
        const rows = [];
        let off = 0;
        const view = async (o, n) => new DataView(await file.slice(o, o + n).arrayBuffer());
        try {
            while (off < file.size) {
                const h = await view(off, 16);
                let size = h.getUint32(0);
                const type = String.fromCharCode(h.getUint8(4), h.getUint8(5), h.getUint8(6), h.getUint8(7));
                if (size === 1) size = Number(h.getBigUint64(8));
                if (size === 0) size = file.size - off;
                if (size < 8) break;
                if (type === 'moov') {
                    const moov = new Uint8Array(await file.slice(off, off + Math.min(size, 64e6)).arrayBuffer());
                    const s = new TextDecoder('latin1').decode(moov);
                    const i = s.indexOf('mvhd');
                    if (i > 0) {
                        const dv = new DataView(moov.buffer, i + 4);
                        const v = dv.getUint8(0);
                        const secs = v === 1 ? Number(dv.getBigUint64(4)) : dv.getUint32(4);
                        if (secs > 0) rows.push(['Recorded (from file)', new Date((secs - 2082844800) * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC']);
                    }
                    const loc = s.match(/([+-]\d{1,2}\.\d{3,})([+-]\d{1,3}\.\d{3,})([+-]\d+\.?\d*)?\//);
                    if (loc) rows.push(['GPS location', `${+loc[1]}, ${+loc[2]}`, `https://www.google.com/maps?q=${+loc[1]},${+loc[2]}`]);
                    const make = s.match(/com\.apple\.quicktime\.(?:make|model)[\s\S]{0,80}?([A-Za-z][\w .-]{2,30})/g);
                    if (make) rows.push(['Device (QuickTime tags)', make.map(m => m.replace(/[\s\S]*data[\s\S]{0,8}/, '').replace(/[^\w .-]/g, '')).filter(Boolean).join(' / ')]);
                    const enc = s.match(/(?:©too|encoder)[\s\S]{0,24}?([A-Za-z][\w .-]{3,40})/);
                    if (enc) rows.push(['Encoder', enc[1]]);
                    break;
                }
                off += size;
            }
        } catch { /* not an MP4/MOV */ }
        return rows;
    }

    async function videoFrames(file) {
        const out = $('#vid-output');
        out.innerHTML = '<p class="muted small"><span class="spinner"></span> Loading video…</p>';
        const url = URL.createObjectURL(file);
        const v = document.createElement('video');
        v.muted = true; v.preload = 'auto'; v.src = url;
        try { await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error('This browser can’t decode that video format. Try converting it to MP4.')); }); }
        catch (e) { out.innerHTML = `<p class="warn small">${esc(e.message)}</p>`; return; }
        // Some WebM files (screen recordings) report an infinite duration until you seek to the end.
        if (!isFinite(v.duration)) {
            await new Promise(res => { v.ondurationchange = () => isFinite(v.duration) && res(); v.currentTime = 1e101; setTimeout(res, 3000); });
            v.currentTime = 0;
            if (!isFinite(v.duration)) { out.innerHTML = '<p class="warn small">Could not determine the video’s length. Try converting it to MP4.</p>'; return; }
        }
        const seek = t => new Promise(res => { v.onseeked = res; v.currentTime = Math.min(t, v.duration - 0.05); });
        const W = Math.min(960, v.videoWidth), H = Math.round(v.videoHeight * W / v.videoWidth);
        const cv = Object.assign(document.createElement('canvas'), { width: W, height: H });
        const small = Object.assign(document.createElement('canvas'), { width: 32, height: 18 });
        const ctx = cv.getContext('2d'), sctx = small.getContext('2d', { willReadFrequently: true });
        const max = Math.max(4, Math.min(120, +$('#vid-max').value || 24));
        const stepSel = $('#vid-step').value;
        const frames = [];
        let prev = null;
        const step = stepSel === 'auto' ? Math.max(0.5, v.duration / 300) : +stepSel;
        for (let t = 0; t < v.duration && frames.length < max; t += step) {
            await seek(t);
            sctx.drawImage(v, 0, 0, 32, 18);
            const px = sctx.getImageData(0, 0, 32, 18).data;
            let diff = 0;
            if (prev) for (let i = 0; i < px.length; i += 4) diff += Math.abs(px[i] - prev[i]) + Math.abs(px[i + 1] - prev[i + 1]) + Math.abs(px[i + 2] - prev[i + 2]);
            const change = prev ? diff / (32 * 18 * 3 * 255) : 1;
            if (stepSel !== 'auto' || change > 0.12) {
                ctx.drawImage(v, 0, 0, W, H);
                frames.push({ t, data: cv.toDataURL('image/jpeg', 0.85) });
                prev = px;
            } else if (!prev) prev = px;
            out.innerHTML = `<p class="muted small"><span class="spinner"></span> ${Math.round(t / v.duration * 100)}% · ${frames.length} frames</p>`;
        }
        URL.revokeObjectURL(url);
        const meta = [['File', `${file.name} (${file.size.toLocaleString()} bytes)`], ['Duration', `${v.duration.toFixed(1)} s`], ['Resolution', `${v.videoWidth} × ${v.videoHeight}`], ['File last modified', new Date(file.lastModified).toISOString()], ...(await mp4Info(file))];
        const ts = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(1).padStart(4, '0')}`;
        out.innerHTML = `<div class="kv-table" style="margin:1rem 0">${renderKV(meta)}</div>
            <p class="small muted">${frames.length} keyframes. Use “Search” to copy a frame and open a reverse image search (press Ctrl+V there).</p>
            <div class="frame-grid">${frames.map((f, i) => `<figure><img src="${f.data}" alt=""><figcaption><span class="mono tiny">${ts(f.t)}</span>
                <button class="btn small" data-frame-search="${i}" data-site="https://lens.google.com/">Lens</button><button class="btn small" data-frame-search="${i}" data-site="https://yandex.com/images/">Yandex</button><button class="btn small" data-frame-save="${i}">⊕</button></figcaption></figure>`).join('')}</div>`;
        out.onclick = async e => {
            const s = e.target.closest('[data-frame-search]'), sv = e.target.closest('[data-frame-save]');
            if (s) {
                try { const blob = await (await fetch(frames[+s.dataset.frameSearch].data)).blob(); const png = await toPngBlob(blob); await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]); toast('Frame copied: press Ctrl+V on the search page'); }
                catch { toast('Could not copy the frame; right-click it and copy instead.', 'err'); }
                window.open(s.dataset.site, '_blank', 'noopener');
            }
            if (sv) {
                const f = frames[+sv.dataset.frameSave];
                CaseFile.addEvidence({ title: `Video frame ${ts(f.t)} from ${file.name}`, text: meta.map(([k, v]) => `${k}: ${v}`).join('\n'), tags: ['video'], imageDataUrl: f.data });
                sv.disabled = true;
            }
        };
        const gps = meta.find(m => m[0] === 'GPS location');
        if (gps) { const [lat, lon] = gps[1].split(',').map(Number); CaseFile.addPlace({ lat, lon, label: `Video: ${file.name}`, source: 'video metadata' }); }
        CaseFile.log('tool', `Video keyframes: ${file.name} (${frames.length} frames)`);
    }

    async function toPngBlob(blob) {
        const bmp = await createImageBitmap(blob);
        const c = Object.assign(document.createElement('canvas'), { width: bmp.width, height: bmp.height });
        c.getContext('2d').drawImage(bmp, 0, 0);
        return new Promise(r => c.toBlob(r, 'image/png'));
    }

    // ================= Search a big file =================
    let bfStop = false, bfMatches = [];
    async function bigFileSearch() {
        const f = $('#bf-file').files[0], q = $('#bf-q').value;
        if (!f || !q) return toast('Choose a file and enter what to find', 'err');
        const mode = $('#bf-mode').value;
        let test;
        try {
            if (mode === 're') { const re = new RegExp(q, 'i'); test = l => re.test(l); }
            else if (mode === 'cs') test = l => l.includes(q);
            else { const ql = q.toLowerCase(); test = l => l.toLowerCase().includes(ql); }
        } catch (e) { return toast(`Invalid regular expression: ${e.message}`, 'err'); }
        bfStop = false; bfMatches = [];
        $('#bf-run').disabled = true; $('#bf-stop').disabled = false; $('#bf-save').disabled = true;
        const t0 = performance.now();
        const reader = f.stream().pipeThrough(new TextDecoderStream()).getReader();
        let buf = '', lineNo = 0, bytes = 0, lastPaint = 0;
        while (!bfStop) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.length;
            buf += value;
            const lines = buf.split('\n');
            buf = lines.pop();
            for (const l of lines) { lineNo++; if (bfMatches.length < 2000 && test(l)) bfMatches.push([lineNo, l.slice(0, 500)]); }
            if (performance.now() - lastPaint > 250) { lastPaint = performance.now(); $('#bf-status').textContent = `${Math.min(100, Math.round(bytes / f.size * 100))}% · ${lineNo.toLocaleString()} lines · ${bfMatches.length} matches`; }
        }
        if (buf && !bfStop) { lineNo++; if (bfMatches.length < 2000 && test(buf)) bfMatches.push([lineNo, buf.slice(0, 500)]); }
        reader.cancel().catch(() => {});
        const secs = ((performance.now() - t0) / 1000).toFixed(1);
        $('#bf-status').textContent = `${bfStop ? 'Stopped' : 'Done'} · ${lineNo.toLocaleString()} lines in ${secs}s · ${bfMatches.length}${bfMatches.length >= 2000 ? '+' : ''} matches`;
        $('#bf-output').innerHTML = bfMatches.length ? `<table class="data-table"><tbody>${bfMatches.slice(0, 500).map(([n, l]) => `<tr><td class="muted mono tiny">${n}</td><td class="mono small">${esc(l)}</td></tr>`).join('')}</tbody></table>${bfMatches.length > 500 ? `<p class="muted small">First 500 shown; “Save matches” keeps up to 2,000.</p>` : ''}` : '<p class="muted small">No matches.</p>';
        $('#bf-run').disabled = false; $('#bf-stop').disabled = true; $('#bf-save').disabled = !bfMatches.length;
        CaseFile.log('tool', `Searched ${f.name} for “${q}”: ${bfMatches.length} matches`);
    }

    function setup() {
        $('#hdr-input').addEventListener('input', debounce(renderHeaders, 300));
        $('#doc-file').addEventListener('change', e => e.target.files.length && docFiles([...e.target.files]));
        const drop = $('#doc-drop');
        drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('over'));
        drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files.length) docFiles([...e.dataTransfer.files]); });
        $('#vid-file').addEventListener('change', e => e.target.files[0] && videoFrames(e.target.files[0]));
        $('#bf-run').onclick = bigFileSearch;
        $('#bf-q').addEventListener('keydown', e => { if (e.key === 'Enter') bigFileSearch(); });
        $('#bf-stop').onclick = () => { bfStop = true; };
        $('#bf-save').onclick = () => {
            const f = $('#bf-file').files[0];
            CaseFile.addEvidence({ title: `Matches for “${$('#bf-q').value}” in ${f.name}`, text: bfMatches.map(([n, l]) => `${n}: ${l}`).join('\n'), tags: ['file-search'] });
        };
    }

    return { setup, analyzeHeaders, pdfMeta, officeMeta, mp4Info };
})();
