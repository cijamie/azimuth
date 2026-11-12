// Live lookups against free, keyless, CORS-enabled public APIs.
// Each lookup resolves to { title, status: 'hit'|'miss'|'info'|'err', rows: [[label, value, href?]], link?, note? }.
'use strict';

const DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'CAA', 'SOA'];

async function dnsQuery(name, type) {
    const j = await fetchJSON(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`, { headers: { accept: 'application/dns-json' } });
    return (j.Answer || []).filter(a => a.name.replace(/\.$/, '').toLowerCase() === name.toLowerCase() || type === 'CNAME' || a.type !== 5)
        .map(a => String(a.data).replace(/^"|"$/g, '').replace(/"\s"/g, ''));
}

const MX_PROVIDERS = [
    [/google\.com|googlemail\.com/i, 'Google Workspace / Gmail'],
    [/outlook\.com|protection\.outlook/i, 'Microsoft 365 / Outlook'],
    [/protonmail\.ch|proton\.me/i, 'Proton Mail'],
    [/zoho\./i, 'Zoho Mail'],
    [/yandex\./i, 'Yandex Mail'],
    [/icloud\.com|me\.com/i, 'Apple iCloud'],
    [/yahoodns|yahoo\./i, 'Yahoo Mail'],
    [/mimecast/i, 'Mimecast (filter)'],
    [/pphosted|proofpoint/i, 'Proofpoint (filter)'],
    [/barracuda/i, 'Barracuda (filter)'],
    [/messagingengine\.com/i, 'Fastmail'],
    [/mail\.ru/i, 'Mail.ru'],
    [/secureserver\.net/i, 'GoDaddy'],
    [/tutanota|tuta\.io/i, 'Tuta'],
];

const LOOKUPS = {
    async dns(domain) {
        const rows = [];
        const results = await Promise.allSettled(DNS_TYPES.map(t => dnsQuery(domain, t)));
        results.forEach((r, i) => {
            if (r.status === 'fulfilled' && r.value.length) r.value.forEach(v => rows.push([DNS_TYPES[i], v]));
        });
        try {
            const dmarc = await dnsQuery(`_dmarc.${domain}`, 'TXT');
            dmarc.filter(v => /v=DMARC1/i.test(v)).forEach(v => rows.push(['DMARC', v]));
        } catch { /* optional */ }
        const mx = rows.filter(r => r[0] === 'MX').map(r => r[1]).join(' ');
        const prov = MX_PROVIDERS.find(([re]) => re.test(mx));
        if (prov) rows.unshift(['Mail provider', prov[1]]);
        const spf = rows.find(r => r[0] === 'TXT' && /^v=spf1/i.test(r[1]));
        if (spf) rows.unshift(['SPF', spf[1]]);
        return { title: `DNS records`, status: rows.length ? 'hit' : 'miss', rows, link: `https://dnsviz.net/d/${domain}/dnssec/`, note: rows.length ? '' : 'No records. The domain may not exist (NXDOMAIN).' };
    },

    async rdapDomain(domain) {
        const j = await fetchJSON(`https://rdap.org/domain/${encodeURIComponent(domain)}`);
        if (j.__notFound) return { title: 'Registration (RDAP)', status: 'miss', rows: [], note: 'Not found in RDAP. Unregistered, or the TLD has no RDAP service.' };
        return { title: 'Registration (RDAP)', status: 'hit', rows: rdapRows(j), link: `https://lookup.icann.org/en/lookup?name=${domain}` };
    },

    async rdapIp(ip) {
        const j = await fetchJSON(`https://rdap.org/ip/${encodeURIComponent(ip)}`);
        if (j.__notFound) return { title: 'IP registration (RDAP)', status: 'miss', rows: [] };
        const rows = [['Network', j.name || ''], ['Range', j.startAddress && `${j.startAddress} - ${j.endAddress}`], ['Country', j.country || ''], ['Type', j.type || ''], ...rdapRows(j)];
        return { title: 'IP registration (RDAP)', status: 'hit', rows: rows.filter(r => r[1]), link: `https://rdap.org/ip/${ip}` };
    },

    async certs(domain) {
        let names = [];
        let source = 'crt.sh';
        try {
            const j = await fetchJSON(`https://crt.sh/?q=${encodeURIComponent('%.' + domain)}&output=json`, { timeout: 15000 });
            names = (Array.isArray(j) ? j : []).flatMap(c => String(c.name_value).split('\n'));
        } catch {
            // crt.sh is often overloaded; Cert Spotter is keyless and CORS-enabled (rate limited per IP).
            source = 'Cert Spotter';
            const j = await fetchJSON(`https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=true&expand=dns_names`, { timeout: 20000 });
            names = (Array.isArray(j) ? j : []).flatMap(c => c.dns_names || []);
        }
        const subs = [...new Set(names.map(n => n.trim().toLowerCase().replace(/^\*\./, '')).filter(n => n.endsWith(domain)))].sort();
        return {
            title: `Subdomains (${source})`,
            status: subs.length ? 'hit' : 'miss',
            rows: subs.slice(0, 300).map(s => ['', s, `https://${s}`]),
            note: subs.length > 300 ? `${subs.length} found, first 300 shown.` : `${subs.length} unique name(s).`,
            link: `https://crt.sh/?q=%25.${domain}`,
            pivotable: subs.slice(0, 300),
        };
    },

    async wayback(target) {
        // The CDX API blocks browsers; the "available" API returns the capture closest to a timestamp,
        // so asking for 1996 gives the first capture and no timestamp gives the latest.
        const [first, latest] = await Promise.all([
            fetchJSON(`https://archive.org/wayback/available?url=${encodeURIComponent(target)}&timestamp=19960101`).catch(() => null),
            fetchJSON(`https://archive.org/wayback/available?url=${encodeURIComponent(target)}`).catch(() => null),
        ]);
        const rows = [];
        const f = first?.archived_snapshots?.closest, l = latest?.archived_snapshots?.closest;
        if (f) rows.push(['First capture', waybackDate(f.timestamp), f.url]);
        if (l && l.timestamp !== f?.timestamp) rows.push(['Latest capture', waybackDate(l.timestamp), l.url]);
        return { title: 'Wayback Machine', status: rows.length ? 'hit' : 'miss', rows, link: `https://web.archive.org/web/*/${target}*`, note: rows.length ? '' : 'Never archived.' };
    },

    async internetdb(ip) {
        const j = await fetchJSON(`https://internetdb.shodan.io/${encodeURIComponent(ip)}`);
        if (j.__notFound || j.detail) return { title: 'Open ports (Shodan InternetDB)', status: 'miss', rows: [], note: 'No scan data for this IP.' };
        const rows = [['Open ports', (j.ports || []).join(', ')], ['Hostnames', (j.hostnames || []).join(', ')], ['Tags', (j.tags || []).join(', ')], ['Software (CPE)', (j.cpes || []).join(', ')]];
        (j.vulns || []).slice(0, 30).forEach(v => rows.push(['Vulnerability', v, `https://nvd.nist.gov/vuln/detail/${v}`]));
        return { title: 'Open ports (Shodan InternetDB)', status: (j.ports || []).length ? 'hit' : 'miss', rows: rows.filter(r => r[1]), link: `https://www.shodan.io/host/${ip}`, note: (j.vulns || []).length ? `${j.vulns.length} known vulnerabilities from banner matching (unverified).` : '' };
    },

    async otx(kind, value) {
        const j = await fetchJSON(`https://otx.alienvault.com/api/v1/indicators/${kind}/${encodeURIComponent(value)}/general`);
        const p = j.pulse_info || {};
        const whitelisted = (j.validation || []).map(v => v.message).filter(Boolean);
        const rows = [['Threat pulses', String(p.count || 0)]];
        (p.pulses || []).slice(0, 6).forEach(x => rows.push(['Pulse', `${x.name}${x.created ? ` (${x.created.slice(0, 10)})` : ''}`, `https://otx.alienvault.com/pulse/${x.id}`]));
        const fams = [...new Set((p.related?.alienvault?.malware_families || []).concat(p.related?.other?.malware_families || []))];
        if (fams.length) rows.push(['Malware families', fams.join(', ')]);
        if (whitelisted.length) rows.push(['Allow-listed', whitelisted.join('; ')]);
        const link = `https://otx.alienvault.com/indicator/${kind === 'IPv4' || kind === 'IPv6' ? 'ip' : kind === 'file' ? 'file' : kind}/${value}`;
        return { title: 'Threat intel (AlienVault OTX)', status: p.count ? 'hit' : 'miss', rows, link, note: p.count ? 'Listed in community threat reports. Check the pulses: big shared services are often listed too.' : 'Not in any OTX threat report.' };
    },

    async hibpDomain(domain) {
        const j = await fetchJSON(`https://haveibeenpwned.com/api/v3/breaches?domain=${encodeURIComponent(domain)}`);
        const list = Array.isArray(j) ? j : [];
        return {
            title: 'Breaches of this site (HIBP)',
            status: list.length ? 'hit' : 'miss',
            rows: list.map(b => [b.BreachDate, `${b.Title}: ${b.PwnCount.toLocaleString()} accounts (${(b.DataClasses || []).slice(0, 5).join(', ')})`, `https://haveibeenpwned.com/PwnedWebsites#${b.Name}`]),
            note: list.length ? 'This site’s own user data was breached.' : 'No known breach of this site.',
            link: 'https://haveibeenpwned.com/PwnedWebsites',
        };
    },

    async shodanHost(ip) {
        const j = await fetchJSON(`https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${encodeURIComponent(Settings.key('shodan'))}`);
        if (j.__notFound) return { title: 'Shodan host (API)', status: 'miss', rows: [], note: 'No information available for this IP.' };
        const rows = [['Organisation', j.org], ['ISP', j.isp], ['OS', j.os], ['Last update', j.last_update], ['Domains', (j.domains || []).join(', ')]];
        (j.data || []).slice(0, 20).forEach(s => rows.push([`Port ${s.port}/${s.transport}`, [s.product, s.version, s.http?.title && `"${s.http.title}"`].filter(Boolean).join(' ') || (s.data || '').split('\n')[0].slice(0, 80)]));
        return { title: 'Shodan host (API)', status: 'hit', rows: rows.filter(r => r[1]), link: `https://www.shodan.io/host/${ip}` };
    },

    async virustotal(kind, value) {
        const path = { domain: `domains/${value}`, ip: `ip_addresses/${value}`, hash: `files/${value}`, url: `urls/${btoa(value).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}` }[kind];
        const j = await fetchJSON(`https://www.virustotal.com/api/v3/${path}`, { headers: { 'x-apikey': Settings.key('virustotal') } });
        if (j.__notFound) return { title: 'VirusTotal (API)', status: 'miss', rows: [], note: 'VirusTotal has never seen this.' };
        const a = j.data?.attributes || {};
        const st = a.last_analysis_stats || {};
        const rows = [['Verdicts', `${st.malicious || 0} malicious · ${st.suspicious || 0} suspicious · ${st.harmless || 0} harmless · ${st.undetected || 0} undetected`], ['Reputation', a.reputation], ['Categories', Object.values(a.categories || {}).slice(0, 4).join(', ')], ['Name', a.meaningful_name], ['Type', a.type_description], ['Size', a.size], ['First seen', a.first_submission_date && new Date(a.first_submission_date * 1000).toISOString()], ['Tags', (a.tags || []).join(', ')]];
        const gui = { domain: 'domain', ip: 'ip-address', hash: 'file', url: 'url' }[kind];
        return { title: 'VirusTotal (API)', status: (st.malicious || st.suspicious) ? 'hit' : 'info', rows: rows.filter(r => r[1] !== undefined && r[1] !== ''), link: `https://www.virustotal.com/gui/${gui}/${kind === 'url' ? j.data?.id : value}` };
    },

    async ipinfo(ip) {
        const j = await fetchJSON(`https://ipinfo.io/${encodeURIComponent(ip)}/json`);
        if (j.bogon) return { title: 'IP context', status: 'info', rows: [['Note', 'Private / reserved address (bogon)']] };
        const rows = [['Hostname', j.hostname], ['Org / ASN', j.org], ['City', j.city], ['Region', j.region], ['Country', j.country], ['Coordinates', j.loc, j.loc && `https://www.openstreetmap.org/?mlat=${j.loc.split(',')[0]}&mlon=${j.loc.split(',')[1]}#map=11/${j.loc.replace(',', '/')}`], ['Timezone', j.timezone], ['Anycast', j.anycast ? 'yes' : '']];
        return { title: 'IP context (ipinfo.io)', status: 'hit', rows: rows.filter(r => r[1]), link: `https://ipinfo.io/${ip}` };
    },

    async ptr(ip) {
        const rev = ip.includes(':')
            ? ip6Expand(ip).replace(/:/g, '').split('').reverse().join('.') + '.ip6.arpa'
            : ip.split('.').reverse().join('.') + '.in-addr.arpa';
        const r = await dnsQuery(rev, 'PTR');
        return { title: 'Reverse DNS (PTR)', status: r.length ? 'hit' : 'miss', rows: r.map(v => ['PTR', v.replace(/\.$/, '')]) };
    },

    async tor(ip) {
        const j = await fetchJSON(`https://onionoo.torproject.org/details?search=${encodeURIComponent(ip)}&fields=nickname,flags,running,last_seen,exit_addresses,or_addresses`);
        const relays = j.relays || [];
        if (!relays.length) return { title: 'Tor relay check', status: 'miss', rows: [], note: 'Not a known Tor relay or exit.' };
        return { title: 'Tor relay check', status: 'hit', rows: relays.slice(0, 5).flatMap(r => [['Relay', r.nickname], ['Flags', (r.flags || []).join(', ')], ['Running', String(r.running)], ['Last seen', r.last_seen]]), link: `https://metrics.torproject.org/rs.html#search/${ip}` };
    },

    async gravatar(email) {
        const hash = await digest('SHA-256', email.trim().toLowerCase());
        const exists = await new Promise(res => {
            const img = new Image();
            img.referrerPolicy = 'no-referrer';
            img.onload = () => res(true);
            img.onerror = () => res(false);
            img.src = `https://gravatar.com/avatar/${hash}?d=404&s=160`;
            setTimeout(() => res(false), 10000);
        });
        const rows = [];
        if (exists) {
            rows.push(['Avatar', `https://gravatar.com/avatar/${hash}?s=400`, `https://gravatar.com/avatar/${hash}?s=400`]);
            try {
                const p = await fetchJSON(`https://api.gravatar.com/v3/profiles/${hash}`);
                if (!p.__notFound) {
                    [['Name', p.display_name], ['Location', p.location], ['Bio', p.description], ['Job', [p.job_title, p.company].filter(Boolean).join(' @ ')], ['Profile', p.profile_url, p.profile_url]]
                        .forEach(r => r[1] && rows.push(r));
                    (p.verified_accounts || []).forEach(a => rows.push([a.service_label || a.service_type, a.url, a.url]));
                }
            } catch { /* profile API may be rate limited */ }
        }
        return { title: 'Gravatar', status: exists ? 'hit' : 'miss', rows, image: exists ? `https://gravatar.com/avatar/${hash}?s=160` : null, note: exists ? '' : 'No Gravatar for this address.' };
    },

    async github(u) {
        const j = await fetchJSON(`https://api.github.com/users/${encodeURIComponent(u)}`);
        if (j.__notFound) return accountMiss('GitHub');
        return accountHit('GitHub', j.html_url, j.avatar_url, [['Name', j.name], ['Bio', j.bio], ['Company', j.company], ['Location', j.location], ['Blog', j.blog, j.blog && safeUrl(/^https?:/.test(j.blog) ? j.blog : 'https://' + j.blog)], ['Email', j.email], ['X/Twitter', j.twitter_username, j.twitter_username && `https://x.com/${j.twitter_username}`], ['Repos / followers', `${j.public_repos} / ${j.followers}`], ['Created', j.created_at], ['Updated', j.updated_at], ['Account ID', j.id]]);
    },

    async gitlab(u) {
        const j = await fetchJSON(`https://gitlab.com/api/v4/users?username=${encodeURIComponent(u)}`);
        if (!Array.isArray(j) || !j.length) return accountMiss('GitLab');
        const x = j[0];
        return accountHit('GitLab', x.web_url, x.avatar_url, [['Name', x.name], ['State', x.state], ['User ID', x.id]]);
    },

    async hackernews(u) {
        const j = await fetchJSON(`https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(u)}.json`);
        if (!j || j.__notFound) return accountMiss('Hacker News');
        return accountHit('Hacker News', `https://news.ycombinator.com/user?id=${u}`, null, [['Karma', j.karma], ['Created', new Date(j.created * 1000).toISOString()], ['About', stripTags(j.about || '')]]);
    },

    async keybase(u) {
        const j = await fetchJSON(`https://keybase.io/_/api/1.0/user/lookup.json?usernames=${encodeURIComponent(u)}&fields=basics,profile,proofs_summary`);
        const t = j?.them?.[0];
        if (!t) return accountMiss('Keybase');
        const rows = [['Name', t.profile?.full_name], ['Location', t.profile?.location], ['Bio', t.profile?.bio]];
        (t.proofs_summary?.all || []).forEach(p => rows.push([`Proof: ${p.proof_type}`, p.nametag, p.service_url]));
        return accountHit('Keybase', `https://keybase.io/${u}`, null, rows);
    },

    async bluesky(u) {
        const handle = u.includes('.') ? u : `${u}.bsky.social`;
        const j = await fetchJSON(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`).catch(e => ({ __notFound: /400/.test(e.message) }));
        if (!j || j.__notFound || !j.did) return accountMiss(`Bluesky (${handle})`);
        return accountHit('Bluesky', `https://bsky.app/profile/${j.handle}`, j.avatar, [['Handle', j.handle], ['Name', j.displayName], ['Bio', j.description], ['DID', j.did], ['Posts / followers', `${j.postsCount} / ${j.followersCount}`], ['Created', j.createdAt]]);
    },

    async mastodon(u) {
        const j = await fetchJSON(`https://mastodon.social/api/v1/accounts/lookup?acct=${encodeURIComponent(u)}`);
        if (j.__notFound || !j.id) return accountMiss('Mastodon (mastodon.social)');
        return accountHit('Mastodon (mastodon.social)', j.url, j.avatar, [['Name', j.display_name], ['Bio', stripTags(j.note || '')], ['Created', j.created_at], ['Posts / followers', `${j.statuses_count} / ${j.followers_count}`]]);
    },

    async chess(u) {
        const j = await fetchJSON(`https://api.chess.com/pub/player/${encodeURIComponent(u.toLowerCase())}`);
        if (j.__notFound || !j.username) return accountMiss('Chess.com');
        return accountHit('Chess.com', j.url, j.avatar, [['Name', j.name], ['Country', (j.country || '').split('/').pop()], ['Location', j.location], ['Joined', j.joined && new Date(j.joined * 1000).toISOString()], ['Last online', j.last_online && new Date(j.last_online * 1000).toISOString()]]);
    },

    async lichess(u) {
        const j = await fetchJSON(`https://lichess.org/api/user/${encodeURIComponent(u)}`);
        if (j.__notFound || !j.id || j.disabled) return accountMiss('Lichess');
        return accountHit('Lichess', j.url, null, [['Bio', j.profile?.bio], ['Location', j.profile?.location], ['Created', j.createdAt && new Date(j.createdAt).toISOString()], ['Seen', j.seenAt && new Date(j.seenAt).toISOString()]]);
    },

    async btc(addr) {
        const j = await fetchJSON(`https://mempool.space/api/address/${encodeURIComponent(addr)}`);
        const c = j.chain_stats || {};
        const bal = (c.funded_txo_sum - c.spent_txo_sum) / 1e8;
        return { title: 'Bitcoin address (mempool.space)', status: c.tx_count ? 'hit' : 'miss', rows: [['Balance', `${bal} BTC`], ['Received', `${c.funded_txo_sum / 1e8} BTC`], ['Transactions', c.tx_count], ['Unconfirmed tx', j.mempool_stats?.tx_count]], link: `https://mempool.space/address/${addr}` };
    },

    async eth(addr) {
        const j = await fetchJSON(`https://api.blockcypher.com/v1/eth/main/addrs/${encodeURIComponent(addr.replace(/^0x/, ''))}/balance`);
        return { title: 'Ethereum address (BlockCypher)', status: j.n_tx ? 'hit' : 'miss', rows: [['Balance', `${j.balance / 1e18} ETH`], ['Received', `${j.total_received / 1e18} ETH`], ['Transactions', j.n_tx]], link: `https://etherscan.io/address/${addr}` };
    },

    // No keyless malware/known-file API allows browser (CORS) access, so this is a local summary.
    async hashInfo(sel) {
        const h = sel.value;
        const KNOWN = {
            d41d8cd98f00b204e9800998ecf8427e: 'MD5 of an empty file',
            da39a3ee5e6b4b0d3255bfef95601890afd80709: 'SHA-1 of an empty file',
            e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855: 'SHA-256 of an empty file',
            '44d88612fea8a8f36de82e1278abb02f': 'MD5 of the EICAR antivirus test file',
            '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f': 'SHA-256 of the EICAR antivirus test file',
        };
        const rows = [['Algorithm', sel.meta.kind], ['Length', `${h.length} hex chars`]];
        if (KNOWN[h]) rows.push(['Known value', KNOWN[h]]);
        return {
            title: 'Hash summary',
            status: KNOWN[h] ? 'hit' : 'info',
            rows,
            note: 'Malware and known-file databases (VirusTotal, MalwareBazaar, CIRCL) do not allow keyless browser lookups. Use the pivots below; VirusTotal and MalwareBazaar are the first stops.',
            link: `https://www.virustotal.com/gui/file/${h}`,
        };
    },

    async phone(sel) {
        const lib = await loadPhoneLib().catch(() => null);
        const region = Settings.get('region') || undefined;
        if (lib) {
            try {
                const p = lib.parsePhoneNumber(sel.value, region);
                const typeNames = { MOBILE: 'Mobile', FIXED_LINE: 'Landline', FIXED_LINE_OR_MOBILE: 'Landline or mobile', TOLL_FREE: 'Toll-free', PREMIUM_RATE: 'Premium rate', SHARED_COST: 'Shared cost', VOIP: 'VoIP (internet number)', PERSONAL_NUMBER: 'Personal number', PAGER: 'Pager', UAN: 'Company number (UAN)', VOICEMAIL: 'Voicemail' };
                const country = p.country ? `${regionName(p.country)} (${p.country})` : `+${p.countryCallingCode} (shared / non-geographic)`;
                const rows = [['Valid number', p.isValid() ? 'yes' : 'no (wrong length or unassigned range)'], ['Country', country], ['Line type', typeNames[p.getType()] || 'Unknown'], ['International', p.formatInternational()], ['National', p.formatNational()], ['E.164', p.number], ['Dial link', p.getURI(), p.getURI()]];
                if (p.getType() === 'VOIP') rows.push(['Note', 'VoIP numbers are often used for throwaway or burner accounts.']);
                return { title: 'Number analysis', status: p.isValid() ? 'hit' : 'miss', rows, note: 'Carrier names are not public data; a carrier lookup site (below) can show the current carrier.' };
            } catch { /* fall back to simple parsing */ }
        }
        const d = sel.meta.digits;
        const cc = callingCode(d);
        const rows = [['E.164', sel.meta.e164], ['Digits', d]];
        if (cc) rows.push(['Calling code', `+${cc[0]} (${cc[1]})`], ['National number', d.slice(cc[0].length)]);
        else rows.push(['Calling code', 'Unknown: add the country code with a leading +, or set a default country in Settings']);
        return { title: 'Number breakdown', status: cc ? 'info' : 'miss', rows, note: 'Basic parsing only (the phone-number library could not load).' };
    },

    async wikipedia(q) {
        const j = await fetchJSON(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`"${q}"`)}&srlimit=6&format=json&origin=*`);
        const hits = j.query?.search || [];
        return { title: 'Wikipedia mentions', status: hits.length ? 'hit' : 'miss', rows: hits.map(h => [h.title, stripTags(h.snippet), `https://en.wikipedia.org/wiki/${encodeURIComponent(h.title.replace(/ /g, '_'))}`]), note: `${j.query?.searchinfo?.totalhits || 0} article(s) mention it.` };
    },

    async wikidata(q) {
        const j = await fetchJSON(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=en&limit=6&format=json&origin=*`);
        const hits = j.search || [];
        return { title: 'Wikidata entities', status: hits.length ? 'hit' : 'miss', rows: hits.map(h => [h.label, h.description || h.id, h.concepturi]) };
    },

    async imageProbe(url) {
        const meta = await new Promise(res => {
            const img = new Image();
            img.referrerPolicy = 'no-referrer';
            img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => res(null);
            img.src = url;
            setTimeout(() => res(null), 12000);
        });
        if (!meta) return { title: 'Image', status: 'err', rows: [], note: 'Could not load the image.' };
        const rows = [['Dimensions', `${meta.w} × ${meta.h}`], ['Preview', url, url]];
        let exifNote = 'EXIF: the host does not allow cross-origin reads. Download the file and use Toolkit → Image metadata.';
        try {
            const res = await fetch(url, { referrerPolicy: 'no-referrer' });
            const buf = await res.arrayBuffer();
            const exif = parseExif(buf);
            if (exif && Object.keys(exif).length) {
                exifRows(exif).forEach(r => rows.push(r));
                exifNote = '';
            } else exifNote = 'No EXIF data in the file.';
        } catch { /* CORS */ }
        return { title: 'Image', status: 'hit', rows, image: url, note: exifNote };
    },
};

// Which lookups run for which selector type. Keyed lookups are added only when a key is set.
const withKey = (name, fn) => (Settings.key(name) ? [fn()] : []);
const LOOKUP_PLAN = {
    domain: s => [LOOKUPS.dns(s.value), LOOKUPS.rdapDomain(s.value), LOOKUPS.certs(s.value), LOOKUPS.wayback(s.value), LOOKUPS.otx('domain', s.value), LOOKUPS.hibpDomain(s.value), ...withKey('virustotal', () => LOOKUPS.virustotal('domain', s.value))],
    email: s => [LOOKUPS.gravatar(s.value), LOOKUPS.dns(s.meta.domain), LOOKUPS.hibpDomain(s.meta.domain).then(r => ({ ...r, title: `Breaches of ${s.meta.domain} (HIBP)` })), LOOKUPS.github(s.meta.local).then(r => ({ ...r, title: `GitHub "${s.meta.local}" (from the email name)` }))],
    ip: s => [LOOKUPS.ipinfo(s.value), LOOKUPS.internetdb(s.value), LOOKUPS.rdapIp(s.value), LOOKUPS.ptr(s.value), LOOKUPS.tor(s.value), LOOKUPS.otx(s.value.includes(':') ? 'IPv6' : 'IPv4', s.value), ...withKey('shodan', () => LOOKUPS.shodanHost(s.value)), ...withKey('virustotal', () => LOOKUPS.virustotal('ip', s.value))],
    url: s => [LOOKUPS.wayback(s.value), LOOKUPS.dns(s.meta.host), LOOKUPS.rdapDomain(registrable(s.meta.host)), LOOKUPS.otx('url', s.value), ...withKey('virustotal', () => LOOKUPS.virustotal('url', s.value))],
    image: s => [LOOKUPS.imageProbe(s.value), LOOKUPS.wayback(s.value)],
    username: s => [LOOKUPS.github(s.value), LOOKUPS.gitlab(s.value), LOOKUPS.bluesky(s.value), LOOKUPS.mastodon(s.value), LOOKUPS.keybase(s.value), LOOKUPS.hackernews(s.value), LOOKUPS.chess(s.value), LOOKUPS.lichess(s.value)],
    crypto: s => [s.meta.chain === 'ethereum' ? LOOKUPS.eth(s.value) : s.meta.chain === 'bitcoin' ? LOOKUPS.btc(s.value) : Promise.resolve({ title: 'Wallet', status: 'info', rows: [['Chain', s.meta.chain]], note: 'No free API for this chain. Use the explorer links.' })],
    hash: s => [LOOKUPS.hashInfo(s), LOOKUPS.otx('file', s.value), ...withKey('virustotal', () => LOOKUPS.virustotal('hash', s.value))],
    phone: s => [LOOKUPS.phone(s)],
    name: s => [LOOKUPS.wikipedia(s.value), LOOKUPS.wikidata(s.value)],
};

// ---- phone library (loaded on first use) ----
let phoneLibPromise = null;
function loadPhoneLib() {
    if (window.libphonenumber) return Promise.resolve(window.libphonenumber);
    return phoneLibPromise ||= new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/libphonenumber-js@1.11.18/bundle/libphonenumber-max.js';
        s.onload = () => (window.libphonenumber ? res(window.libphonenumber) : rej(new Error('phone library missing')));
        s.onerror = () => { phoneLibPromise = null; rej(new Error('phone library failed to load')); };
        document.head.appendChild(s);
    });
}
function regionName(code) {
    try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code); } catch { return code; }
}

// ---- Leads: new selectors uncovered by lookup results (auto-chaining) ----
const LEAD_NOISE = /(^|\.)(gravatar\.com|github\.com|gitlab\.com|bsky\.app|bsky\.social|mastodon\.social|keybase\.io|lichess\.org|chess\.com|ycombinator\.com|wikipedia\.org|wikidata\.org|archive\.org|openstreetmap\.org|google\.com|ipinfo\.io|shodan\.io|virustotal\.com|alienvault\.com|haveibeenpwned\.com|nist\.gov|torproject\.org|mempool\.space|etherscan\.io|crt\.sh|icann\.org|rdap\.org|dnsviz\.net|w3\.org|schema\.org|example\.com)$/i;
const LEAD_ROW_SKIP = /^(Avatar|Preview|Profile|Pulse|Vulnerability|Map|Dial link|Coordinates|Status|DNSSEC|Created|Registered|Expires|Last changed|First capture|Latest capture|SOA|CAA|Nameserver|Registrar|Registrar IANA ID|Abuse|Abuse email|Registrar email|Allow-listed|Malware families|Range|Network)$/i;
// Big shared infrastructure (DNS hosts, CAs, mail and cloud giants) is almost never a useful lead.
const INFRA_NOISE = /(awsdns|nsone\.net|cloudflare|azure-dns|akam|domaincontrol|registrar-servers|googledomains|dnsmadeeasy|ultradns|dynect|letsencrypt|digicert|sectigo|globalsign|comodoca|amazonaws|amazon\.com|outlook\.com|office365|microsoft|googlemail|google\.com|gmail\.com|zoho|protonmail|mimecast|pphosted|markmonitor|godaddy|namecheap|gandi\.net|ovh\.net|hetzner|digitalocean|fastly|cloudfront|azureedge|edgekey|edgesuite|iana\.org|verisign)/i;

function discoverLeads(results, sel) {
    const leads = new Map();
    const ownDomain = registrable(sel.type === 'domain' ? sel.value : sel.meta.domain || sel.meta.host || '') || null;
    const add = (type, value, via) => {
        if (!value) return;
        value = String(value).trim().replace(/\.$/, '');
        const k = `${type}:${value.toLowerCase()}`;
        if (value.toLowerCase() === sel.value.toLowerCase() || leads.has(k)) return;
        const host = (type === 'email' ? value.split('@')[1] : type === 'url' ? safeHost(value) : value).toLowerCase();
        const own = ownDomain && (host === ownDomain || host.endsWith('.' + ownDomain));
        if ((type === 'domain' || type === 'email' || type === 'url') && !own && (LEAD_NOISE.test(host) || INFRA_NOISE.test(host))) return;
        if (type === 'ip' && isPrivateIPv4(value)) return;
        leads.set(k, { type, value, via });
    };
    for (const r of results) {
        if (!r || r.status === 'err') continue;
        const via = r.title.replace(/ \(.*\)$/, '');
        if (r.pivotable) { r.pivotable.slice(0, 40).forEach(d => add('domain', d, 'certificate log')); continue; }
        for (const [k, v, href] of r.rows || []) {
            if (LEAD_ROW_SKIP.test(k) || !v) continue;
            const text = String(v);
            if (/^(A|AAAA)$/.test(k) && /^[\d.:a-f]+$/i.test(text)) { add('ip', text, `DNS ${k}`); continue; }
            if (/^(MX|NS|CNAME)$/.test(k)) { const h = text.split(/\s+/).pop().replace(/\.$/, ''); add('domain', registrable(h), `DNS ${k}`); continue; }
            if (k === 'TXT' || k === 'SPF' || k === 'DMARC') { (text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || []).forEach(e => add('email', e.toLowerCase(), `DNS ${k}`)); continue; }
            if (/X\/Twitter/i.test(k)) { add('username', text.replace(/^@/, ''), via); continue; }
            if (/^Proof: /.test(k)) { add('username', text.replace(/^@/, ''), `${via} ${k.slice(7)}`); continue; }
            const iocs = extractIOCs(text + (href && !/^https?:\/\/(www\.)?(github|gitlab|bsky|mastodon|keybase|lichess|chess)\./.test(href) ? ' ' + href : ''));
            (iocs.email || []).forEach(e => add('email', e, via));
            (iocs.ipv4 || []).forEach(ip => add('ip', ip, via));
            (iocs.domain || []).forEach(d => add('domain', d, via));
            (iocs.btc || []).forEach(a => add('crypto', a, via));
            (iocs.eth || []).forEach(a => add('crypto', a, via));
        }
    }
    // Structural relations
    if (sel.type === 'email') add('domain', sel.meta.domain, 'email domain');
    if (sel.type === 'url' || sel.type === 'image') add('domain', registrable(sel.meta.host), 'link host');
    if (sel.type === 'domain' && registrable(sel.value) !== sel.value) add('domain', registrable(sel.value), 'parent domain');
    return [...leads.values()].slice(0, 80);
}

function safeHost(u) { try { return new URL(u).hostname; } catch { return ''; } }

// ---- Dated facts for the timeline ----
const DATE_LABELS = /^(Registered|Expires|Last changed|Created|Joined|Updated|First capture|Latest capture|Last seen|Seen|Last online|First seen|Last update|Taken|Digitized|Modified|GPS date)$/i;
function datedFacts(results, sel) {
    const out = [];
    for (const r of results) {
        if (!r || r.status === 'err') continue;
        const src = r.title.replace(/ \(.*\)$/, '');
        for (const [k, v] of r.rows || []) {
            if (!v) continue;
            if (DATE_LABELS.test(k) || (/^\d{4}-\d{2}-\d{2}$/.test(k) && r.title.includes('Breach'))) {
                const raw = /^\d{4}-\d{2}-\d{2}$/.test(k) ? k : String(v);
                const d = new Date(raw.replace(/^(\d{4}):(\d{2}):(\d{2}) /, '$1-$2-$3T').replace(' UTC', 'Z'));
                if (isNaN(d) || d.getFullYear() < 1980 || d.getFullYear() > 2100) continue;
                out.push({ t: d.toISOString(), label: /^\d{4}-/.test(k) ? `${src}: ${String(v).split(':')[0]}` : `${src}: ${k.toLowerCase()}`, selector: sel.value, type: sel.type });
            }
        }
    }
    return out;
}

// ---- Fingerprint used by the watchlist to detect changes ----
const VOLATILE = /^(Latest capture|Last seen|Seen|Last online|Last update|Updated|Posts \/ followers|Repos \/ followers|Karma|Unconfirmed tx|Anycast|Timezone)$/i;
function fingerprint(results) {
    const fp = {};
    for (const r of results) {
        if (!r || r.status === 'err') continue;
        const lines = r.pivotable ? r.pivotable : (r.rows || []).filter(([k]) => !VOLATILE.test(k)).map(([k, v]) => `${k}: ${v}`);
        fp[r.title] = [...new Set(lines)].sort();
    }
    return fp;
}

// ---- helpers ----

function accountHit(site, url, avatar, rows) {
    return { title: site, status: 'hit', rows: [['Profile', url, url], ...rows.filter(r => r[1] !== undefined && r[1] !== null && r[1] !== '')], image: avatar || null, link: url };
}
function accountMiss(site) {
    return { title: site, status: 'miss', rows: [], note: 'No account with this exact username.' };
}

function rdapRows(j) {
    const rows = [];
    const ev = Object.fromEntries((j.events || []).map(e => [e.eventAction, e.eventDate]));
    if (j.ldhName) rows.push(['Domain', j.ldhName.toLowerCase()]);
    if (ev.registration) rows.push(['Registered', ev.registration]);
    if (ev.expiration) rows.push(['Expires', ev.expiration]);
    if (ev['last changed']) rows.push(['Last changed', ev['last changed']]);
    for (const e of j.entities || []) {
        const fn = (e.vcardArray?.[1] || []).find(v => v[0] === 'fn')?.[3];
        const org = (e.vcardArray?.[1] || []).find(v => v[0] === 'org')?.[3];
        const email = (e.vcardArray?.[1] || []).find(v => v[0] === 'email')?.[3];
        const label = (e.roles || []).join(', ');
        if (fn || org) rows.push([cap(label), [fn, org].filter(Boolean).join(' / ')]);
        if (email) rows.push([`${cap(label)} email`, email]);
        const ianaId = (e.publicIds || []).find(p => /IANA/i.test(p.type))?.identifier;
        if (ianaId) rows.push(['Registrar IANA ID', ianaId]);
    }
    (j.nameservers || []).forEach(n => rows.push(['Nameserver', (n.ldhName || '').toLowerCase()]));
    if (j.status?.length) rows.push(['Status', j.status.join(', ')]);
    if (j.secureDNS) rows.push(['DNSSEC', j.secureDNS.delegationSigned ? 'signed' : 'unsigned']);
    return rows;
}

function waybackDate(ts) {
    return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(8, 10)}:${ts.slice(10, 12)}`;
}

function stripTags(s) {
    const d = document.createElement('div');
    d.innerHTML = s;
    return d.textContent.trim();
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function registrable(host = '') {
    const p = host.replace(/^www\./, '').split('.');
    const two = /^(co|com|org|net|gov|ac|edu)\.[a-z]{2}$/i.test(p.slice(-2).join('.'));
    return p.slice(two ? -3 : -2).join('.');
}

function ip6Expand(ip) {
    const [h, t = ''] = ip.split('::');
    const head = h ? h.split(':') : [], tail = t ? t.split(':') : [];
    const mid = Array(8 - head.length - tail.length).fill('0');
    return [...head, ...(ip.includes('::') ? mid : []), ...tail].map(x => x.padStart(4, '0')).join(':');
}

const CALLING_CODES = {
    1: 'US / Canada / NANP', 7: 'Russia / Kazakhstan', 20: 'Egypt', 27: 'South Africa', 30: 'Greece', 31: 'Netherlands', 32: 'Belgium', 33: 'France', 34: 'Spain', 36: 'Hungary', 39: 'Italy', 40: 'Romania', 41: 'Switzerland', 43: 'Austria', 44: 'United Kingdom', 45: 'Denmark', 46: 'Sweden', 47: 'Norway', 48: 'Poland', 49: 'Germany', 51: 'Peru', 52: 'Mexico', 53: 'Cuba', 54: 'Argentina', 55: 'Brazil', 56: 'Chile', 57: 'Colombia', 58: 'Venezuela', 60: 'Malaysia', 61: 'Australia', 62: 'Indonesia', 63: 'Philippines', 64: 'New Zealand', 65: 'Singapore', 66: 'Thailand', 81: 'Japan', 82: 'South Korea', 84: 'Vietnam', 86: 'China', 90: 'Turkey', 91: 'India', 92: 'Pakistan', 93: 'Afghanistan', 94: 'Sri Lanka', 95: 'Myanmar', 98: 'Iran',
    211: 'South Sudan', 212: 'Morocco', 213: 'Algeria', 216: 'Tunisia', 218: 'Libya', 220: 'Gambia', 221: 'Senegal', 233: 'Ghana', 234: 'Nigeria', 237: 'Cameroon', 249: 'Sudan', 250: 'Rwanda', 251: 'Ethiopia', 252: 'Somalia', 254: 'Kenya', 255: 'Tanzania', 256: 'Uganda', 260: 'Zambia', 263: 'Zimbabwe', 351: 'Portugal', 352: 'Luxembourg', 353: 'Ireland', 354: 'Iceland', 355: 'Albania', 356: 'Malta', 357: 'Cyprus', 358: 'Finland', 359: 'Bulgaria', 370: 'Lithuania', 371: 'Latvia', 372: 'Estonia', 373: 'Moldova', 374: 'Armenia', 375: 'Belarus', 380: 'Ukraine', 381: 'Serbia', 385: 'Croatia', 386: 'Slovenia', 387: 'Bosnia', 389: 'North Macedonia', 420: 'Czechia', 421: 'Slovakia', 852: 'Hong Kong', 853: 'Macau', 855: 'Cambodia', 856: 'Laos', 880: 'Bangladesh', 886: 'Taiwan', 960: 'Maldives', 961: 'Lebanon', 962: 'Jordan', 963: 'Syria', 964: 'Iraq', 965: 'Kuwait', 966: 'Saudi Arabia', 967: 'Yemen', 968: 'Oman', 970: 'Palestine', 971: 'UAE', 972: 'Israel', 973: 'Bahrain', 974: 'Qatar', 976: 'Mongolia', 977: 'Nepal', 992: 'Tajikistan', 993: 'Turkmenistan', 994: 'Azerbaijan', 995: 'Georgia', 996: 'Kyrgyzstan', 998: 'Uzbekistan',
};

function callingCode(digits) {
    for (const n of [3, 2, 1]) {
        const p = digits.slice(0, n);
        if (CALLING_CODES[p]) return [p, CALLING_CODES[p]];
    }
    return null;
}
