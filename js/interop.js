// Exports to professional tools (Maltego, Gephi/GraphML, i2, STIX 2.1, MISP, CASE/UCO, CSV) and imports of
// results from common OSINT tools (Sherlock, Maigret, SpiderFoot, theHarvester, Holehe, Azimuth sweep).
'use strict';

const Interop = (() => {
    const c = () => CaseFile.data;
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const base = () => `${(c().subject || 'case').replace(/[^a-z0-9]+/gi, '_').slice(0, 40)}_${c().id}`;

    function entities() {
        const map = new Map();
        c().selectors.forEach(s => map.set(selKey(s), { key: selKey(s), type: s.type, value: s.value, lead: false }));
        Object.entries(c().leads).forEach(([k, l]) => { if (!map.has(k)) map.set(k, { key: k, type: l.type, value: l.value, lead: true }); });
        return map;
    }

    const MALTEGO = { domain: 'maltego.Domain', ip: 'maltego.IPv4Address', email: 'maltego.EmailAddress', url: 'maltego.URL', image: 'maltego.Image', username: 'maltego.Alias', phone: 'maltego.PhoneNumber', hash: 'maltego.Hash', crypto: 'maltego.CryptocurrencyAddress', name: 'maltego.Person' };
    const I2 = { domain: 'Domain', ip: 'IP Address', email: 'Email Address', url: 'Website', image: 'Image', username: 'Online Account', phone: 'Telephone', hash: 'File', crypto: 'Cryptocurrency Wallet', name: 'Person' };

    function maltegoCSV() {
        const ents = entities();
        const rows = [['source_entity_type', 'source_value', 'link_label', 'target_entity_type', 'target_value'].join(',')];
        const linked = new Set();
        for (const l of c().links) {
            const a = ents.get(l.from), b = ents.get(l.to);
            if (!a || !b) continue;
            linked.add(a.key); linked.add(b.key);
            rows.push([MALTEGO[a.type], a.value, l.label || '', MALTEGO[b.type], b.value].map(q).join(','));
        }
        for (const e of ents.values()) if (!linked.has(e.key)) rows.push([MALTEGO[e.type], e.value, '', '', ''].map(q).join(','));
        download(`${base()}_maltego.csv`, rows.join('\n'), 'text/csv');
        toast('Maltego: Import → Import Graph from Table, then map the columns to entities and the link label.');
    }

    function graphML() {
        const ents = entities();
        const x = s => esc(String(s));
        const ids = new Map([...ents.keys()].map((k, i) => [k, `n${i}`]));
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="type" for="node" attr.name="type" attr.type="string"/>
  <key id="value" for="node" attr.name="value" attr.type="string"/>
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="lead" for="node" attr.name="lead" attr.type="boolean"/>
  <key id="maltego" for="node" attr.name="maltego_type" attr.type="string"/>
  <key id="elabel" for="edge" attr.name="label" attr.type="string"/>
  <graph id="${x(c().id)}" edgedefault="undirected">
${[...ents.values()].map(e => `    <node id="${ids.get(e.key)}"><data key="type">${x(e.type)}</data><data key="value">${x(e.value)}</data><data key="label">${x(e.value)}</data><data key="lead">${e.lead}</data><data key="maltego">${x(MALTEGO[e.type])}</data></node>`).join('\n')}
${c().links.filter(l => ids.has(l.from) && ids.has(l.to)).map((l, i) => `    <edge id="e${i}" source="${ids.get(l.from)}" target="${ids.get(l.to)}"><data key="elabel">${x(l.label || '')}</data></edge>`).join('\n')}
  </graph>
</graphml>`;
        download(`${base()}.graphml`, xml, 'application/xml');
    }

    function i2CSV() {
        const ents = entities();
        const rows = [['Entity1 Type', 'Entity1 Identity', 'Link Type', 'Link Date', 'Entity2 Type', 'Entity2 Identity', 'Source'].join(',')];
        for (const l of c().links) {
            const a = ents.get(l.from), b = ents.get(l.to);
            if (a && b) rows.push([I2[a.type], a.value, l.label || 'Associated with', (l.t || '').slice(0, 10), I2[b.type], b.value, 'Azimuth'].map(q).join(','));
        }
        download(`${base()}_i2.csv`, rows.join('\n'), 'text/csv');
        toast('i2 Analyst’s Notebook: use the Import Wizard with “Entity – Link – Entity” rows.');
    }

    function stixObjectFor(e) {
        const id = t => `${t}--${crypto.randomUUID()}`;
        const sel = e.value;
        switch (e.type) {
            case 'domain': return { type: 'domain-name', spec_version: '2.1', id: id('domain-name'), value: sel };
            case 'ip': return { type: sel.includes(':') ? 'ipv6-addr' : 'ipv4-addr', spec_version: '2.1', id: id(sel.includes(':') ? 'ipv6-addr' : 'ipv4-addr'), value: sel };
            case 'email': return { type: 'email-addr', spec_version: '2.1', id: id('email-addr'), value: sel };
            case 'url': case 'image': return { type: 'url', spec_version: '2.1', id: id('url'), value: sel };
            case 'hash': return { type: 'file', spec_version: '2.1', id: id('file'), hashes: { [{ 32: 'MD5', 40: 'SHA-1', 64: 'SHA-256', 128: 'SHA-512' }[sel.length] || 'SHA-256']: sel } };
            case 'username': return { type: 'user-account', spec_version: '2.1', id: id('user-account'), account_login: sel };
            case 'name': return { type: 'identity', spec_version: '2.1', id: id('identity'), name: sel, identity_class: 'individual', created: new Date().toISOString(), modified: new Date().toISOString() };
            case 'phone': return { type: 'x-phone-number', spec_version: '2.1', id: id('x-phone-number'), value: sel };
            case 'crypto': return { type: 'x-cryptocurrency-wallet', spec_version: '2.1', id: id('x-cryptocurrency-wallet'), value: sel };
            default: return null;
        }
    }

    function stix() {
        const now = new Date().toISOString();
        const author = { type: 'identity', spec_version: '2.1', id: `identity--${crypto.randomUUID()}`, created: now, modified: now, name: c().analyst || 'Azimuth analyst', identity_class: 'individual' };
        const ents = entities();
        const sco = new Map();
        for (const e of ents.values()) { const o = stixObjectFor(e); if (o) sco.set(e.key, o); }
        const rels = c().links.filter(l => sco.has(l.from) && sco.has(l.to)).map(l => ({ type: 'relationship', spec_version: '2.1', id: `relationship--${crypto.randomUUID()}`, created: now, modified: now, created_by_ref: author.id, relationship_type: 'related-to', description: l.label || '', source_ref: sco.get(l.from).id, target_ref: sco.get(l.to).id }));
        const refsFor = e => {
            const own = e.selector && [...ents.values()].find(x => x.value === e.selector);
            if (own && sco.has(own.key)) return [sco.get(own.key).id];
            const all = [...sco.values()].slice(0, 50).map(o => o.id);
            return all.length ? all : [author.id];
        };
        const notes = c().evidence.map(e => ({ type: 'note', spec_version: '2.1', id: `note--${crypto.randomUUID()}`, created: e.created, modified: e.updated || e.created, created_by_ref: author.id, abstract: `E${e.no}: ${e.title}`, content: [e.text, e.source && `Source: ${e.source}`, CaseFile.grade(e) && `Admiralty grade: ${CaseFile.grade(e)}`, e.imageSha256 && `Screenshot SHA-256: ${e.imageSha256}`].filter(Boolean).join('\n\n') || e.title, object_refs: refsFor(e) }));
        const report = { type: 'report', spec_version: '2.1', id: `report--${crypto.randomUUID()}`, created: now, modified: now, created_by_ref: author.id, name: c().subject || c().id, description: c().summary || '', report_types: ['threat-report'], published: now, object_refs: [...sco.values(), ...rels, ...notes].map(o => o.id) };
        if (!report.object_refs.length) report.object_refs = [author.id];
        const bundle = { type: 'bundle', id: `bundle--${crypto.randomUUID()}`, objects: [author, report, ...sco.values(), ...rels, ...notes] };
        download(`${base()}_stix.json`, JSON.stringify(bundle, null, 2), 'application/json');
    }

    function misp() {
        const T = e => {
            if (e.type === 'hash') return ['Payload delivery', { 32: 'md5', 40: 'sha1', 64: 'sha256', 128: 'sha512' }[e.value.length] || 'sha256'];
            return { domain: ['Network activity', 'domain'], ip: ['Network activity', 'ip-dst'], email: ['Payload delivery', 'email-src'], url: ['Network activity', 'url'], image: ['External analysis', 'link'], username: ['Social network', 'text'], phone: ['Person', 'phone-number'], crypto: ['Financial fraud', /^0x/.test(e.value) ? 'text' : 'btc'], name: ['Person', 'full-name'] }[e.type];
        };
        const attrs = [...entities().values()].map(e => { const [category, type] = T(e); return { category, type, value: e.value, to_ids: false, comment: `${e.lead ? 'Lead' : 'Investigated'} (${SELECTOR_TYPES[e.type].label}) – Azimuth ${c().id}` }; });
        const event = { Event: { info: c().subject || c().id, date: c().created.slice(0, 10), threat_level_id: '4', analysis: c().review ? '2' : '1', distribution: '0', Attribute: attrs, Tag: [{ name: 'tlp:amber' }, { name: 'osint:source-type="automatic-analysis"' }], EventReport: [{ name: 'Azimuth summary', content: [c().summary, ...c().evidence.map(e => `### E${e.no}. ${e.title}\n${e.text || ''}\n${e.source || ''}`)].filter(Boolean).join('\n\n') }] } };
        download(`${base()}_misp.json`, JSON.stringify(event, null, 2), 'application/json');
        toast('MISP: Add Event → Populate from → JSON import. Marked TLP:AMBER by default.');
    }

    function caseUco() {
        const ns = 'kb:';
        const id = p => `${ns}${p}-${crypto.randomUUID()}`;
        const analyst = { '@id': id('identity'), '@type': 'uco-identity:Person', 'uco-core:name': c().analyst || 'Analyst' };
        const tool = { '@id': id('tool'), '@type': 'uco-tool:Tool', 'uco-core:name': 'AZIMUTH', 'uco-tool:version': '3.2' };
        const graph = [analyst, tool];
        const invId = id('investigation');
        const objs = [];
        for (const e of c().evidence) {
            const fileId = id('file');
            const fileObj = { '@id': fileId, '@type': 'uco-observable:ObservableObject', 'uco-core:hasFacet': [{ '@type': 'uco-observable:URLFacet', 'uco-observable:fullValue': e.source || '' }] };
            if (e.imageSha256) fileObj['uco-core:hasFacet'].push({ '@type': 'uco-observable:ContentDataFacet', 'uco-observable:hash': [{ '@type': 'uco-types:Hash', 'uco-types:hashMethod': { '@type': 'uco-vocabulary:HashNameVocab', '@value': 'SHA256' }, 'uco-types:hashValue': { '@type': 'xsd:hexBinary', '@value': e.imageSha256 } }] });
            const prov = { '@id': id('provenance-record'), '@type': 'case-investigation:ProvenanceRecord', 'case-investigation:exhibitNumber': `${c().id}-E${e.no}`, 'uco-core:description': e.title, 'uco-core:object': [{ '@id': fileId }] };
            const action = { '@id': id('investigative-action'), '@type': 'case-investigation:InvestigativeAction', 'uco-core:name': 'collected', 'uco-action:startTime': { '@type': 'xsd:dateTime', '@value': e.created }, 'uco-action:performer': { '@id': analyst['@id'] }, 'uco-action:instrument': { '@id': tool['@id'] }, 'uco-action:result': [{ '@id': fileId }, { '@id': prov['@id'] }] };
            graph.push(fileObj, prov, action);
            objs.push(prov['@id'], action['@id']);
        }
        graph.unshift({ '@id': invId, '@type': 'case-investigation:Investigation', 'uco-core:name': c().subject || c().id, 'case-investigation:focus': c().selectors.map(s => s.value).join(', '), 'uco-core:description': c().summary || '', 'uco-core:object': objs.map(o => ({ '@id': o })) });
        const doc = {
            '@context': { kb: 'http://example.org/kb/', 'case-investigation': 'https://ontology.caseontology.org/case/investigation/', 'uco-core': 'https://ontology.unifiedcyberontology.org/uco/core/', 'uco-observable': 'https://ontology.unifiedcyberontology.org/uco/observable/', 'uco-types': 'https://ontology.unifiedcyberontology.org/uco/types/', 'uco-vocabulary': 'https://ontology.unifiedcyberontology.org/uco/vocabulary/', 'uco-identity': 'https://ontology.unifiedcyberontology.org/uco/identity/', 'uco-tool': 'https://ontology.unifiedcyberontology.org/uco/tool/', 'uco-action': 'https://ontology.unifiedcyberontology.org/uco/action/', xsd: 'http://www.w3.org/2001/XMLSchema#' },
            '@graph': graph,
        };
        download(`${base()}_case-uco.jsonld`, JSON.stringify(doc, null, 2), 'application/ld+json');
    }

    function evidenceCSV() {
        const rows = [['no', 'title', 'captured_utc', 'source', 'grade', 'confidence', 'tags', 'screenshot_sha256', 'text'].join(',')];
        c().evidence.slice().sort((a, b) => a.no - b.no).forEach(e => rows.push([`E${e.no}`, e.title, e.created, e.source, CaseFile.grade(e), e.confidence, (e.tags || []).join(' '), e.imageSha256, e.text].map(q).join(',')));
        download(`${base()}_evidence.csv`, rows.join('\n'), 'text/csv');
    }

    const EXPORTS = { 'maltego-csv': maltegoCSV, graphml: graphML, i2: i2CSV, stix, misp, 'case-uco': caseUco, csv: evidenceCSV };

    // ---------------- Imports ----------------
    function parseCSV(text) {
        const rows = [];
        let row = [], cell = '', inQ = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (inQ) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') inQ = false; else cell += ch; }
            else if (ch === '"') inQ = true;
            else if (ch === ',') { row.push(cell); cell = ''; }
            else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
            else cell += ch;
        }
        if (cell || row.length) { row.push(cell); rows.push(row); }
        const head = (rows.shift() || []).map(h => h.trim());
        return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
    }

    const SF_TYPES = { INTERNET_NAME: 'domain', DOMAIN_NAME: 'domain', CO_HOSTED_SITE: 'domain', AFFILIATE_INTERNET_NAME: 'domain', SIMILARDOMAIN: 'domain', IP_ADDRESS: 'ip', IPV6_ADDRESS: 'ip', AFFILIATE_IPADDR: 'ip', EMAILADDR: 'email', AFFILIATE_EMAILADDR: 'email', PHONE_NUMBER: 'phone', USERNAME: 'username', ACCOUNT_EXTERNAL_OWNED: 'url', SOCIAL_MEDIA: 'url', HUMAN_NAME: 'name', BITCOIN_ADDRESS: 'crypto', ETHEREUM_ADDRESS: 'crypto', LINKED_URL_EXTERNAL: 'url', HASH: 'hash' };

    function detectAndParse(name, text) {
        const t = text.trim();
        let json = null;
        try { json = JSON.parse(t); } catch { /* not JSON */ }
        if (json?.username && Array.isArray(json.found)) return { tool: 'Azimuth sweep', subject: { type: 'username', value: json.username }, found: json.found.map(f => ({ type: 'url', value: f.url, via: f.site })) };
        if (json && !Array.isArray(json) && Object.values(json).some(v => v?.status?.status || v?.url_user)) {
            const user = Object.values(json).find(v => v?.username)?.username || name.match(/report_(.+?)_/)?.[1] || '';
            const found = [];
            for (const [site, v] of Object.entries(json)) {
                const st = v?.status?.status || v?.status;
                if (/claimed/i.test(st) && (v.url_user || v.status?.url)) {
                    found.push({ type: 'url', value: v.url_user || v.status.url, via: site });
                    for (const [k, val] of Object.entries(v.status?.ids || {})) {
                        if (typeof val !== 'string' || !/email|username|fullname|links|website/i.test(k)) continue;
                        let values = [val];
                        if (/^\s*\[/.test(val)) { try { values = JSON.parse(val.replace(/'/g, '"')); } catch { values = val.match(/https?:\/\/[^\s'",\]]+/g) || []; } }
                        for (const one of values) { const d = detectSelector(String(one)); if (d) found.push({ type: d.type, value: d.value, via: `${site} ${k}` }); }
                    }
                }
            }
            return { tool: 'Maigret', subject: user ? { type: 'username', value: user } : null, found };
        }
        if (json && (json.emails || json.hosts || json.ips)) {
            const found = [];
            (json.emails || []).forEach(e => found.push({ type: 'email', value: e, via: 'theHarvester' }));
            (json.hosts || []).forEach(h => { const [host, ip] = String(h).split(':'); found.push({ type: 'domain', value: host, via: 'theHarvester' }); if (ip) found.push({ type: 'ip', value: ip, via: 'theHarvester' }); });
            (json.ips || []).forEach(ip => found.push({ type: 'ip', value: ip, via: 'theHarvester' }));
            (json.interesting_urls || []).forEach(u => found.push({ type: 'url', value: u, via: 'theHarvester' }));
            const dom = found.find(f => f.type === 'domain')?.value;
            return { tool: 'theHarvester', subject: dom ? { type: 'domain', value: registrable(dom) } : null, found };
        }
        if (/^"?Scan Name"?,/m.test(t) || /"Module"/.test(t.split('\n')[0])) {
            const rows = parseCSV(t);
            const found = rows.map(r => ({ type: SF_TYPES[r.Type], value: (r.Data || '').split('\n')[0].trim(), via: `SpiderFoot ${r.Module || ''}`.trim() })).filter(f => f.type && f.value && f.value.length < 300);
            return { tool: 'SpiderFoot', subject: null, found };
        }
        if (/^username,name,url_main,url_user,exists/m.test(t)) {
            const rows = parseCSV(t);
            const user = rows[0]?.username;
            return { tool: 'Sherlock', subject: user ? { type: 'username', value: user } : null, found: rows.filter(r => /claimed/i.test(r.exists)).map(r => ({ type: 'url', value: r.url_user, via: r.name })) };
        }
        if (/^name,domain,method/m.test(t)) {
            const rows = parseCSV(t);
            return { tool: 'Holehe', subject: null, found: rows.filter(r => /true/i.test(r.exists)).map(r => ({ type: 'domain', value: r.domain, via: 'registered (Holehe)' })) };
        }
        const urls = t.split(/\r?\n/).map(l => l.trim()).filter(l => /^https?:\/\//.test(l));
        if (urls.length && /Total Websites Username Detected On/i.test(t) || urls.length > 3 && urls.length >= t.split('\n').length * 0.6) {
            return { tool: 'Sherlock', subject: { type: 'username', value: name.replace(/\.txt$/i, '') }, found: urls.map(u => ({ type: 'url', value: u, via: new URL(u).hostname })) };
        }
        const iocs = extractIOCs(t);
        return { tool: 'text', subject: null, found: Object.entries(iocs).flatMap(([k, v]) => v.map(x => { const d = detectSelector(x); return d && { type: d.type, value: d.value, via: 'imported text' }; })).filter(Boolean) };
    }

    async function importTool(file) {
        const status = $('#import-tool-status');
        try {
            const r = detectAndParse(file.name, await file.text());
            if (!r.found.length) throw new Error('No findings recognised in that file');
            const parent = r.subject || state.selector || CaseFile.data.selectors[0] || null;
            if (r.subject) CaseFile.addSelector(r.subject);
            const leads = r.found.filter(f => f.value).slice(0, 2000);
            if (parent) CaseFile.addLeads(parent, leads);
            else leads.slice(0, 200).forEach(l => CaseFile.addSelector(l));
            await CaseFile.addEvidence({ title: `${r.tool} results${r.subject ? ` for ${r.subject.value}` : ''}: ${leads.length} findings`, text: leads.map(l => `${l.via}: ${l.value}`).join('\n'), tags: ['import', r.tool.toLowerCase().replace(/\s+/g, '-')] });
            status.textContent = `Imported ${leads.length} findings from ${r.tool}.`;
            CaseFile.log('import', `Imported ${r.tool} results (${leads.length})`);
        } catch (e) { status.textContent = ''; toast(`Import failed: ${e.message}`, 'err'); }
    }

    function setup() {
        document.addEventListener('click', e => {
            const b = e.target.closest('[data-export]');
            if (!b) return;
            EXPORTS[b.dataset.export]();
            CaseFile.log('export', `Exported ${b.textContent.trim()}`);
        });
        $('#import-tool-input').onchange = e => { if (e.target.files[0]) importTool(e.target.files[0]); e.target.value = ''; };
    }

    return { setup, detectAndParse, EXPORTS };
})();
