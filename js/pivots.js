// Pivot catalogue: deep links that take a selector as input.
// Tokens: {t} url-encoded value, {raw} value as typed, {domain} host (email/URL),
//         {local} email local part, {digits} phone digits, {e164} +digits, {q} encoded "exact phrase".
// `copy: true` means the site has no query parameter, so launch copies the selector to the clipboard first.
'use strict';

const PIVOTS = {
    username: {
        'Discovery engines': [
            ['WhatsMyName', 'https://whatsmyname.app/?q={t}'],
            ['IDCrawl', 'https://www.idcrawl.com/u/{t}'],
            ['Instant Username Search', 'https://instantusername.com/?q={t}'],
            ['Namechk', 'https://namechk.com/?q={t}'],
            ['Google exact match', 'https://www.google.com/search?q={q}'],
            ['DuckDuckGo exact', 'https://duckduckgo.com/?q={q}'],
        ],
        'Social & media': [
            ['X / Twitter', 'https://x.com/{t}'],
            ['Instagram', 'https://www.instagram.com/{t}/'],
            ['TikTok', 'https://www.tiktok.com/@{t}'],
            ['Facebook', 'https://www.facebook.com/{t}'],
            ['Threads', 'https://www.threads.com/@{t}'],
            ['Bluesky', 'https://bsky.app/profile/{t}.bsky.social'],
            ['Mastodon (social)', 'https://mastodon.social/@{t}'],
            ['Reddit', 'https://www.reddit.com/user/{t}'],
            ['YouTube', 'https://www.youtube.com/@{t}'],
            ['Twitch', 'https://www.twitch.tv/{t}'],
            ['Pinterest', 'https://www.pinterest.com/{t}/'],
            ['Snapchat', 'https://www.snapchat.com/add/{t}'],
            ['Telegram', 'https://t.me/{t}'],
            ['Tumblr', 'https://{t}.tumblr.com/'],
            ['Medium', 'https://medium.com/@{t}'],
            ['Linktree', 'https://linktr.ee/{t}'],
            ['SoundCloud', 'https://soundcloud.com/{t}'],
            ['Flickr', 'https://www.flickr.com/people/{t}/'],
            ['DeviantArt', 'https://www.deviantart.com/{t}'],
            ['Patreon', 'https://www.patreon.com/{t}'],
            ['VK', 'https://vk.com/{t}'],
        ],
        'Tech & gaming': [
            ['GitHub', 'https://github.com/{t}'],
            ['GitLab', 'https://gitlab.com/{t}'],
            ['Keybase', 'https://keybase.io/{t}'],
            ['Hacker News', 'https://news.ycombinator.com/user?id={t}'],
            ['Stack Overflow (search)', 'https://stackoverflow.com/users?tab=Reputation&filter=all&search={t}'],
            ['Docker Hub', 'https://hub.docker.com/u/{t}'],
            ['npm', 'https://www.npmjs.com/~{t}'],
            ['PyPI', 'https://pypi.org/user/{t}/'],
            ['Steam (vanity URL)', 'https://steamcommunity.com/id/{t}'],
            ['Chess.com', 'https://www.chess.com/member/{t}'],
            ['Lichess', 'https://lichess.org/@/{t}'],
            ['Gravatar', 'https://gravatar.com/{t}'],
        ],
        'Archives & leaks': [
            ['Wayback: X profile', 'https://web.archive.org/web/*/x.com/{t}*'],
            ['Wayback: Instagram', 'https://web.archive.org/web/*/instagram.com/{t}*'],
            ['Intelligence X', 'https://intelx.io/?s={t}'],
            ['DeHashed', 'https://dehashed.com/search?query={t}'],
            ['GitHub code mentions', 'https://github.com/search?q={q}&type=code'],
        ],
    },

    email: {
        'Account discovery': [
            ['Epieos', 'https://epieos.com/?q={t}&t=email'],
            ['OSINT Industries', 'https://osint.industries/', true],
            ['Hunter email verifier', 'https://hunter.io/email-verifier/{t}'],
            ['Proton Mail key lookup', 'https://api.protonmail.ch/pks/lookup?op=index&search={t}'],
            ['keys.openpgp.org', 'https://keys.openpgp.org/search?q={t}'],
            ['GitHub commits by email', 'https://github.com/search?q={t}&type=commits'],
            ['Google exact match', 'https://www.google.com/search?q={q}'],
            ['Bing exact match', 'https://www.bing.com/search?q={q}'],
        ],
        'Breaches & leaks': [
            ['Have I Been Pwned', 'https://haveibeenpwned.com/', true],
            ['DeHashed', 'https://dehashed.com/search?query={t}'],
            ['Intelligence X', 'https://intelx.io/?s={t}'],
            ['LeakCheck', 'https://leakcheck.io/', true],
            ['Hudson Rock (infostealers)', 'https://www.hudsonrock.com/threat-intelligence-cybercrime-tools', true],
        ],
        'Email domain': [
            ['MXToolbox (MX)', 'https://mxtoolbox.com/SuperTool.aspx?action=mx%3a{domain}&run=toolpage'],
            ['WHOIS (who.is)', 'https://who.is/whois/{domain}'],
            ['Email format (domain)', 'https://www.email-format.com/d/{domain}/'],
        ],
    },

    domain: {
        'Registration': [
            ['ICANN RDAP lookup', 'https://lookup.icann.org/en/lookup?name={t}'],
            ['who.is', 'https://who.is/whois/{t}'],
            ['DomainTools WHOIS', 'https://whois.domaintools.com/{t}'],
            ['WhoisXML', 'https://whois.whoisxmlapi.com/lookup?q={t}'],
        ],
        'DNS & infrastructure': [
            ['SecurityTrails', 'https://securitytrails.com/domain/{t}/dns'],
            ['DNSDumpster', 'https://dnsdumpster.com/', true],
            ['ViewDNS IP history', 'https://viewdns.info/iphistory/?domain={t}'],
            ['ViewDNS reverse IP', 'https://viewdns.info/reverseip/?host={t}&t=1'],
            ['Robtex', 'https://www.robtex.com/dns-lookup/{t}'],
            ['DNSViz (DNSSEC)', 'https://dnsviz.net/d/{t}/dnssec/'],
            ['MXToolbox', 'https://mxtoolbox.com/SuperTool.aspx?action=mx%3a{t}&run=toolpage'],
            ['Shodan (hostname)', 'https://www.shodan.io/search?query=hostname%3A{t}'],
            ['Censys', 'https://search.censys.io/search?resource=hosts&q={t}'],
            ['BuiltWith', 'https://builtwith.com/{t}'],
            ['Netcraft site report', 'https://sitereport.netcraft.com/?url={t}'],
        ],
        'Subdomains & certs': [
            ['crt.sh (all subdomains)', 'https://crt.sh/?q=%25.{t}'],
            ['Subdomain Center API', 'https://api.subdomain.center/?domain={t}'],
            ['Censys certificates', 'https://search.censys.io/certificates?q={t}'],
        ],
        'Reputation & scans': [
            ['VirusTotal', 'https://www.virustotal.com/gui/domain/{t}'],
            ['urlscan.io', 'https://urlscan.io/search/#domain%3A{t}'],
            ['AlienVault OTX', 'https://otx.alienvault.com/indicator/domain/{t}'],
            ['URLVoid', 'https://www.urlvoid.com/scan/{t}/'],
            ['Google Safe Browsing', 'https://transparencyreport.google.com/safe-browsing/search?url={t}'],
            ['SSL Labs', 'https://www.ssllabs.com/ssltest/analyze.html?d={t}&hideResults=on'],
        ],
        'History & content': [
            ['Wayback (all captures)', 'https://web.archive.org/web/*/{t}*'],
            ['archive.today', 'https://archive.ph/{raw}'],
            ['Google site:', 'https://www.google.com/search?q=site%3A{t}'],
            ['Google documents', 'https://www.google.com/search?q=site%3A{t}+filetype%3Apdf+OR+filetype%3Adocx+OR+filetype%3Axlsx'],
            ['GitHub code mentions', 'https://github.com/search?q={q}&type=code'],
            ['Similarweb', 'https://www.similarweb.com/website/{t}/'],
        ],
    },

    ip: {
        'Ownership & location': [
            ['ipinfo.io', 'https://ipinfo.io/{t}'],
            ['Hurricane Electric BGP', 'https://bgp.he.net/ip/{t}'],
            ['RDAP (registry record)', 'https://rdap.org/ip/{t}'],
            ['Spur (VPN / proxy)', 'https://spur.us/context/{t}'],
        ],
        'Exposure': [
            ['Shodan host', 'https://www.shodan.io/host/{t}'],
            ['Censys host', 'https://search.censys.io/hosts/{t}'],
            ['Criminal IP', 'https://www.criminalip.io/asset/report/{t}'],
            ['LeakIX', 'https://leakix.net/host/{t}'],
            ['ViewDNS reverse IP', 'https://viewdns.info/reverseip/?host={t}&t=1'],
        ],
        'Reputation': [
            ['GreyNoise', 'https://viz.greynoise.io/ip/{t}'],
            ['AbuseIPDB', 'https://www.abuseipdb.com/check/{t}'],
            ['VirusTotal', 'https://www.virustotal.com/gui/ip-address/{t}'],
            ['AlienVault OTX', 'https://otx.alienvault.com/indicator/ip/{t}'],
            ['Cisco Talos', 'https://talosintelligence.com/reputation_center/lookup?search={t}'],
            ['urlscan.io', 'https://urlscan.io/search/#ip%3A{t}'],
            ['Tor ExoneraTor', 'https://metrics.torproject.org/exonerator.html?ip={t}'],
        ],
    },

    url: {
        'Analyse': [
            ['urlscan.io (search)', 'https://urlscan.io/search/#page.url%3A%22{t}%22'],
            ['VirusTotal', 'https://www.virustotal.com/gui/search/{t}'],
            ['Google Safe Browsing', 'https://transparencyreport.google.com/safe-browsing/search?url={t}'],
            ['WhereGoes (redirects)', 'https://wheregoes.com/trace/?url={t}'],
        ],
        'Archive & preserve': [
            ['Wayback captures', 'https://web.archive.org/web/*/{raw}'],
            ['Save to Wayback now', 'https://web.archive.org/save/{raw}'],
            ['archive.today newest', 'https://archive.ph/newest/{raw}'],
            ['archive.today save', 'https://archive.ph/?url={t}'],
            ['Ghostarchive search', 'https://ghostarchive.org/search?term={t}'],
        ],
        'Host': [
            ['VirusTotal (host)', 'https://www.virustotal.com/gui/domain/{domain}'],
            ['WHOIS (host)', 'https://who.is/whois/{domain}'],
            ['crt.sh (host)', 'https://crt.sh/?q={domain}'],
        ],
    },

    image: {
        'Reverse image search': [
            ['Google Lens', 'https://lens.google.com/uploadbyurl?url={t}'],
            ['Bing Visual Search', 'https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:{t}'],
            ['Yandex', 'https://yandex.com/images/search?rpt=imageview&url={t}'],
            ['TinEye', 'https://tineye.com/search?url={t}'],
            ['SauceNAO', 'https://saucenao.com/search.php?url={t}'],
        ],
        'Forensics': [
            ['Jeffrey’s EXIF viewer', 'https://exif.regex.info/exif.cgi?imgurl={t}'],
            ['FotoForensics', 'https://fotoforensics.com/?url={t}'],
            ['Forensically', 'https://29a.ch/photo-forensics/', true],
        ],
    },

    phone: {
        'Lookup': [
            ['Google exact', 'https://www.google.com/search?q={q}'],
            ['Google digits', 'https://www.google.com/search?q=%22{digits}%22'],
            ['Epieos', 'https://epieos.com/?q={e164}&t=phone'],
            ['Truecaller', 'https://www.truecaller.com/search/us/{digits}'],
            ['Sync.ME', 'https://sync.me/search/?number={e164}'],
            ['NumLookup', 'https://www.numlookup.com/', true],
            ['Free Carrier Lookup', 'https://freecarrierlookup.com/', true],
        ],
        'Messaging apps': [
            ['WhatsApp chat', 'https://wa.me/{digits}'],
            ['Telegram (by number)', 'https://t.me/+{digits}'],
        ],
    },

    hash: {
        'Malware intel': [
            ['VirusTotal', 'https://www.virustotal.com/gui/file/{t}'],
            ['MalwareBazaar', 'https://bazaar.abuse.ch/browse.php?search={t}'],
            ['Hybrid Analysis', 'https://www.hybrid-analysis.com/search?query={t}'],
            ['Triage', 'https://tria.ge/s?q={t}'],
            ['AlienVault OTX', 'https://otx.alienvault.com/indicator/file/{t}'],
            ['ThreatFox', 'https://threatfox.abuse.ch/browse.php?search=ioc%3A{t}'],
            ['Google exact', 'https://www.google.com/search?q={q}'],
        ],
        'Password hashes': [
            ['CrackStation', 'https://crackstation.net/', true],
            ['Hashes.com', 'https://hashes.com/en/decrypt/hash', true],
        ],
    },

    crypto: {
        'Explorers': [
            ['Blockchair', 'https://blockchair.com/search?q={t}'],
            ['mempool.space (BTC)', 'https://mempool.space/address/{t}'],
            ['Etherscan (ETH)', 'https://etherscan.io/address/{t}'],
            ['WalletExplorer (BTC)', 'https://www.walletexplorer.com/address/{t}'],
        ],
        'Attribution': [
            ['Chainabuse', 'https://www.chainabuse.com/address/{t}'],
            ['Arkham', 'https://intel.arkm.com/explorer/address/{t}'],
            ['Breadcrumbs', 'https://www.breadcrumbs.app/reports/{t}'],
            ['Google exact', 'https://www.google.com/search?q={q}'],
        ],
    },

    name: {
        'Search engines': [
            ['Google exact', 'https://www.google.com/search?q={q}'],
            ['Bing exact', 'https://www.bing.com/search?q={q}'],
            ['DuckDuckGo exact', 'https://duckduckgo.com/?q={q}'],
            ['Yandex exact', 'https://yandex.com/search/?text={q}'],
            ['Google News', 'https://news.google.com/search?q={q}'],
        ],
        'People & social': [
            ['LinkedIn (via Google)', 'https://www.google.com/search?q=site%3Alinkedin.com%2Fin+{q}'],
            ['Facebook people', 'https://www.facebook.com/search/people/?q={t}'],
            ['X search', 'https://x.com/search?q={q}&f=user'],
            ['Instagram (via Google)', 'https://www.google.com/search?q=site%3Ainstagram.com+{q}'],
            ['Reddit', 'https://www.reddit.com/search/?q={q}'],
            ['IDCrawl', 'https://www.idcrawl.com/search?q={t}'],
            ['Webmii', 'https://webmii.com/people?n={q}'],
        ],
        'Companies, courts & sanctions': [
            ['OpenCorporates (companies)', 'https://opencorporates.com/companies?q={t}'],
            ['OpenCorporates (officers)', 'https://opencorporates.com/officers?q={t}'],
            ['UK Companies House', 'https://find-and-update.company-information.service.gov.uk/search?q={t}'],
            ['SEC EDGAR full-text', 'https://www.sec.gov/edgar/search/#/q={q}'],
            ['OpenSanctions', 'https://www.opensanctions.org/search/?q={t}'],
            ['ICIJ Offshore Leaks', 'https://offshoreleaks.icij.org/search?q={t}'],
            ['OCCRP Aleph', 'https://aleph.occrp.org/search?q={t}'],
            ['CourtListener', 'https://www.courtlistener.com/?q={q}'],
            ['Wikipedia', 'https://en.wikipedia.org/w/index.php?search={t}'],
        ],
    },
};

// The handful of pivots worth opening first for each type (names must match PIVOTS above).
const TOP_PIVOTS = {
    username: ['WhatsMyName', 'Google exact match', 'X / Twitter', 'Instagram', 'TikTok', 'Reddit', 'GitHub'],
    email: ['Epieos', 'Have I Been Pwned', 'Intelligence X', 'Google exact match', 'GitHub commits by email'],
    domain: ['ICANN RDAP lookup', 'VirusTotal', 'urlscan.io', 'SecurityTrails', 'Wayback (all captures)', 'Google site:'],
    ip: ['ipinfo.io', 'Shodan host', 'GreyNoise', 'AbuseIPDB', 'VirusTotal'],
    url: ['urlscan.io (search)', 'VirusTotal', 'Wayback captures', 'archive.today newest'],
    image: ['Google Lens', 'Yandex', 'Bing Visual Search', 'TinEye'],
    phone: ['Google exact', 'Epieos', 'Truecaller', 'WhatsApp chat'],
    hash: ['VirusTotal', 'MalwareBazaar', 'Hybrid Analysis', 'Triage'],
    crypto: ['Blockchair', 'Chainabuse', 'mempool.space (BTC)', 'Etherscan (ETH)'],
    name: ['Google exact', 'LinkedIn (via Google)', 'Facebook people', 'OpenCorporates (officers)', 'OpenSanctions'],
};

// Turn a selector into the concrete URL for one pivot template.
function fillTemplate(tpl, sel) {
    const v = sel.value;
    const m = sel.meta || {};
    const domain = m.domain || m.host || '';
    return tpl
        .replace(/\{t\}/g, encodeURIComponent(v))
        .replace(/\{raw\}/g, v)
        .replace(/\{q\}/g, encodeURIComponent(`"${v}"`))
        .replace(/\{domain\}/g, encodeURIComponent(domain))
        .replace(/\{local\}/g, encodeURIComponent(m.local || ''))
        .replace(/\{digits\}/g, m.digits || v.replace(/\D/g, ''))
        .replace(/\{e164\}/g, encodeURIComponent(m.e164 || v));
}

// Pivots for a selector, including derived ones (an email's domain, a URL's host).
function pivotsFor(sel) {
    const groups = [];
    const add = (type, prefix = '') => {
        for (const [group, items] of Object.entries(PIVOTS[type] || {})) {
            groups.push({
                group: prefix + group,
                items: items.map(([name, tpl, copy]) => ({ name, url: fillTemplate(tpl, sel), copy: !!copy })),
            });
        }
    };
    add(sel.type);
    if (sel.type === 'crypto') {
        // Hide chain-specific explorers that do not apply.
        for (const g of groups) g.items = g.items.filter(i => !(sel.meta.chain === 'ethereum' && /BTC/.test(i.name)) && !(sel.meta.chain !== 'ethereum' && /ETH/.test(i.name)));
    }
    if (sel.type === 'email' || sel.type === 'url' || sel.type === 'image') {
        const host = sel.meta.domain || sel.meta.host;
        if (host && !/^(gmail|googlemail|outlook|hotmail|live|yahoo|icloud|me|aol|proton|protonmail|gmx|yandex|mail)\./.test(host)) {
            const dsel = { type: 'domain', value: host.replace(/^www\./, ''), meta: {} };
            for (const [group, items] of Object.entries(PIVOTS.domain)) {
                if (group === 'Registration' || group === 'Reputation & scans' || group === 'Subdomains & certs') {
                    groups.push({ group: `Domain: ${group}`, items: items.map(([name, tpl, copy]) => ({ name, url: fillTemplate(tpl, dsel), copy: !!copy })) });
                }
            }
        }
    }
    if (sel.type === 'email') {
        // The local part is often reused as a username.
        const usel = { type: 'username', value: sel.meta.local, meta: {} };
        groups.push({ group: `Username "${sel.meta.local}"`, items: PIVOTS.username['Discovery engines'].map(([name, tpl]) => ({ name, url: fillTemplate(tpl, usel), copy: false })) });
    }
    // "Start here" group first.
    const top = (TOP_PIVOTS[sel.type] || [])
        .map(n => groups.flatMap(g => g.items).find(i => i.name === n))
        .filter(Boolean);
    if (top.length) groups.unshift({ group: 'Start here', items: top, top: true });
    return groups;
}
