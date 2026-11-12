#!/usr/bin/env node
// One-shot registry curation, driven by a link report from check-links.mjs.
// Usage: node scripts/curate.mjs scripts/link-report-original.json
//
// - drops links the audit found dead or parked
// - follows "moved" links to their new home, or drops them when the redirect
//   lands somewhere unrelated (a reseller, a parent company, spam)
// - drops services known to be retired even though the domain still answers
// - fixes broken templates and adds modern tools the old list was missing
// - de-duplicates and prunes empty folders

import fs from 'node:fs';
import { loadRegistry, saveRegistry, walkTools } from './registry.mjs';

const DATA = 'js/data.js';
const reportFile = process.argv[2] || 'scripts/link-report-original.json';
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
const byUrl = new Map(report.results.map(r => [r.url, r]));

// Redirects that land somewhere that is no longer the tool.
const MOVED_DROP = new Set([
    'Tinder Usernames (M)', 'easyWhois', "Google's Certificate Transparency", 'AVG Threat Labs',
    'Webroot BrightCloud URL/IP Lookup', 'Visual Site Mapper', 'ChangeDetect', 'idGettr', 'Online OCR',
    'Skype Web Client', 'Mr. Number (M)', 'Death Check', 'Political MoneyLine', 'MelissaData - Campaign Contributions',
    'Businessweek Search', 'Data.com Connect', 'Cached Pages', 'IFTTT', 'Microsoft Flow', '#totalhash', 'Secunia',
    'Fake Identity Generator', 'VPN Comparisons - That One Privacy Site', 'Browserscope', 'Numberway', 'AYI.com',
]);

// Retired services whose domains still return 200 (or that the audit could not settle).
const RETIRED = new Set([
    'Panoramio', 'Delicious', 'LiveLeak', 'blinkx Video Search', 'Microsoft Academic', 'Webstigram', 'Mini Instagram',
    'BackTweets', 'Tweet Metadata', 'Twopcharts', 'SecurityFocus', 'Threatexpert.com Malicious URL', 'Skype Resolver 2019',
    'YikMap', 'Snapchat Leak Checker', 'Jobster', 'Every Politician', 'CamFind App', 'Ether', 'Hidden Wiki',
    'Alexa Site Statistics', 'Alexa Top 500 Global Sites', 'Hooktube', 'Faker.js', 'Print Storyboard from Youtube',
    'Print YouTube StoryBoard Instructions', 'WebCite', 'Netcraft', 'Cymon Open Threat Intelligence', 'hpHosts Online',
    'McAfee TrustedSource', 'WatchGuard ReputationAuthority', 'PassiveTotal', 'Malware Domain List',
    'Ransomware Tracker Abuse.ch', 'Cisco SenderBase', 'Asian Avenue', 'Reverse Genie', 'Reverse Genie People',
    'OpenCNAM API', 'Shodan Ship Tracker', 'AOL Search Database', 'MediaBugs', 'Browsershots', 'Tor Scan', 'Onion Cab',
    'OnionLink', 'Ether.Camp', 'Valkyrie File Analysis', 'Website Outlook', 'URL Expander', 'Lengthen Me', 'Ki.tc',
    'TopGainers', 'WhosTalkin', 'Yahoo Image Search', 'Image Raider', 'Facebook Live Map', 'FB Email Search',
    'Kik Username (M)', 'Share Secret Feedback (M)', 'Google Groups Search', 'Live Journal Seek', 'Lullar', 'Instya',
    'Tinfoleak Web', 'Web O Proxy', 'The Internet Privacy Handbook', 'Credit Freeze', 'Fake US Identities',
    'Privacy Tools', 'Scans.io', 'Internet Census Search', 'Wayback Machine - Beta Search', 'ProtonMail Domains (M)',
    'Metatube', 'DocJax', 'filessoo.com', 'Tumblr', 'Hubii', 'Domain Big Data', 'Twitter Image Search (M)',
    'Twitter Date Search', 'Twitter Location Search', 'Google Social Search', 'Plonked', 'CVGadget', 'Cubib',
]);

// Known-good sites that refuse automated checks; never auto-drop these.
const KEEP = new Set(['Archive.is', 'WhatsMyName', 'Myspace', 'Word Reference', 'Email Reputation', 'OXT', 'ImageNet',
    'Karma Decay', 'Smart Questions', 'InQuest Labs DFI/MalDoc Search', 'BGPStream', 'Phenoelit Default Password List',
    'ThreatMiner.org', 'DNSstuff', 'WWW Domain Tools', 'Perfect Privacy', 'WebRTC Leak Test', 'Most Wanted Criminal Pages',
    'Sorted by Birth Date', 'HowManyOfMe', 'Deutsche Bahn Open-Data-Portal (German)', 'OpenStreetMap Routing Service',
    'AIHIT', 'DDecode - PHP Decoder', 'Scam Database', 'LetMeCheck.it', 'What browser am I using.co']);

// Manual URL fixes (name -> new url / fields).
const FIX = {
    'Amazon Usernames (M)': { name: 'Amazon Profiles (Google)', url: 'https://www.google.com/search?q=site%3Aamazon.com+%22{target}%22', input: 'username' },
    'ProtonMail users (M)': { name: 'Proton Mail Key Lookup', url: 'https://api.protonmail.ch/pks/lookup?op=index&search={target}', input: 'email', description: 'Returns a PGP key if the address is a Proton Mail account.' },
    'Tiktok (M)': { name: 'TikTok', url: 'https://www.tiktok.com/@{target}', input: 'username' },
    'Family Tree Now (M)': { name: 'Family Tree Now (phone)', url: 'https://www.familytreenow.com/search/genealogy/results?phoneno={target}', input: 'phone' },
    'WhatsMyName': { input: 'username' },
    'Namechk': { input: 'username' },
    'UserSearch.org': { input: 'username' },
    'OpenInfrastructureMap': { url: 'https://openinframap.org/' },
    'Archive.is': { name: 'archive.today', url: 'https://archive.ph/' },
    'Epieos Email Tool': { name: 'Epieos', url: 'https://epieos.com/' },
    'Censys': { url: 'https://search.censys.io/' },
    'Twitter Advanced Search': { name: 'X Advanced Search', url: 'https://x.com/search-advanced' },
    'Verif!cation Quiz Bot': { url: 'https://x.com/quiztime' },
    'Packet Storm': { url: 'https://packetstorm.news/' },
    'CVE - MITRE': { name: 'CVE Program', url: 'https://www.cve.org/' },
    'Internet Archive: Wayback Machine': { url: 'https://web.archive.org/' },
    'PubMed - National Center for Biotechnology Information': { url: 'https://pubmed.ncbi.nlm.nih.gov/' },
    'Panopticlick': { name: 'Cover Your Tracks (EFF)', url: 'https://coveryourtracks.eff.org/' },
    'ZoomEye': { url: 'https://www.zoomeye.ai/' },
    'Databases.Today': { name: 'Snusbase', url: 'https://snusbase.com/' },
    'The Hitchhiker’s Guide to Online Anonymity': { url: 'https://anonymousplanet.org/' },
    'SANS SEC487 OSINT Class': { name: 'SANS SEC497 Practical OSINT', url: 'https://www.sans.org/cyber-security-courses/practical-open-source-intelligence/' },
    'Change Detection': { name: 'Visualping', url: 'https://visualping.io/' },
    'Flash Earth': { name: 'Zoom Earth', url: 'https://zoom.earth/' },
    'OpenStreetCam': { name: 'KartaView', url: 'https://kartaview.org/' },
    'Companies House': { url: 'https://find-and-update.company-information.service.gov.uk/' },
    'DuckDuckGo AI Chat': { name: 'Duck.ai', url: 'https://duck.ai/' },
};

// Modern tools missing from the old list. [category path, name, url, description, input?]
const ADD = [
    ['Username > Username Search Engines', 'OSINT Industries', 'https://osint.industries/', 'Paid account-discovery engine for email, phone and username.'],
    ['Username > Username Search Engines', 'Sherlock (CLI)', 'https://github.com/sherlock-project/sherlock', 'Open-source username hunt across 400+ sites. Run locally.'],
    ['Username > Username Search Engines', 'Maigret (CLI)', 'https://github.com/soxoj/maigret', 'Sherlock fork that also parses profile pages for extra identifiers. Run locally.'],
    ['Username > Username Search Engines', 'Blackbird (CLI)', 'https://github.com/p1ngul1n0/blackbird', 'Username and email search across 600+ sites.'],
    ['Email Address > Email Search', 'Holehe (CLI)', 'https://github.com/megadose/holehe', 'Checks which sites an email is registered on via password-reset flows. Run locally.'],
    ['Email Address > Email Search', 'GHunt (CLI)', 'https://github.com/mxrch/GHunt', 'Investigates Google accounts from an email address.'],
    ['Email Address > Email Search', 'Epieos', 'https://epieos.com/?q={target}&t=email', 'Reverse email lookup: linked Google account, registered services.', 'email'],
    ['Email Address > Breach Data', 'Have I Been Pwned', 'https://haveibeenpwned.com/', 'Check whether an email appears in known breaches.'],
    ['Email Address > Breach Data', 'DeHashed', 'https://dehashed.com/search?query={target}', 'Search breach records by email, username, name, IP, phone. Paid for full results.', 'any'],
    ['Email Address > Breach Data', 'LeakCheck', 'https://leakcheck.io/', 'Breach search by email, username or phone.'],
    ['Email Address > Breach Data', 'Intelligence X', 'https://intelx.io/?s={target}', 'Search leaks, pastes, darknet and historical web data.', 'any'],
    ['Email Address > Breach Data', 'h8mail (CLI)', 'https://github.com/khast3x/h8mail', 'Email OSINT and breach hunting from the command line.'],
    ['Domain Name > Subdomains', 'Subdomain Center', 'https://api.subdomain.center/?domain={target}', 'Free subdomain API (JSON).', 'domain'],
    ['Domain Name > Subdomains', 'crt.sh subdomains', 'https://crt.sh/?q=%25.{target}', 'Every certificate ever logged for *.domain.', 'domain'],
    ['Domain Name > Subdomains', 'subfinder (CLI)', 'https://github.com/projectdiscovery/subfinder', 'Passive subdomain enumeration from dozens of sources.'],
    ['Domain Name > Subdomains', 'OWASP Amass (CLI)', 'https://github.com/owasp-amass/amass', 'In-depth attack-surface mapping and asset discovery.'],
    ['Domain Name > Whois Records', 'ICANN Lookup (RDAP)', 'https://lookup.icann.org/en/lookup?name={target}', 'Official registration data via RDAP.', 'domain'],
    ['Domain Name > Whois Records', 'WhoisXML API', 'https://whois.whoisxmlapi.com/lookup?q={target}', 'Current and historic WHOIS, reverse WHOIS.', 'domain'],
    ['Domain Name > Discovery', 'SecurityTrails', 'https://securitytrails.com/domain/{target}/dns', 'Historical DNS, subdomains, associated domains.', 'domain'],
    ['Domain Name > Discovery', 'Validin', 'https://app.validin.com/', 'Passive DNS, host responses and pivots for threat hunting.'],
    ['Domain Name > Discovery', 'LeakIX', 'https://leakix.net/search?scope=leak&q={target}', 'Search exposed services and leaks.', 'any'],
    ['Domain Name > Discovery', 'theHarvester (CLI)', 'https://github.com/laramies/theHarvester', 'Gathers emails, subdomains, hosts and names for a domain.'],
    ['Domain Name > Discovery', 'SpiderFoot (CLI)', 'https://github.com/smicallef/spiderfoot', 'Automated OSINT recon with 200+ modules.'],
    ['IP & MAC Address > Host / Port Discovery', 'FOFA', 'https://en.fofa.info/', 'Internet-wide asset search engine.'],
    ['IP & MAC Address > Host / Port Discovery', 'Hunter.how', 'https://hunter.how/', 'Internet asset search engine.'],
    ['IP & MAC Address > Geolocation', 'ipinfo.io', 'https://ipinfo.io/{target}', 'Geolocation, ASN, company and privacy detection for an IP.', 'ip'],
    ['IP & MAC Address > Reputation', 'Spur', 'https://spur.us/context/{target}', 'Identifies VPN, residential proxy and anonymization infrastructure.', 'ip'],
    ['IP & MAC Address > Reputation', 'AbuseIPDB check', 'https://www.abuseipdb.com/check/{target}', 'Community abuse reports for an IP.', 'ip'],
    ['Social Networks > Other Social Networks', 'Bluesky profile', 'https://bsky.app/profile/{target}', 'Open a Bluesky handle (handle.bsky.social or custom domain).', 'username'],
    ['Social Networks > Other Social Networks', 'Threads profile', 'https://www.threads.net/@{target}', 'Meta Threads profile.', 'username'],
    ['Social Networks > Other Social Networks', 'Mastodon search', 'https://mastodon.social/search?q={target}', 'Search the fediverse from mastodon.social.', 'any'],
    ['Instant Messaging > Telegram', 'TGStat', 'https://tgstat.com/', 'Telegram channel and chat catalogue with stats and search.'],
    ['Instant Messaging > Telegram', 'Telemetr.io', 'https://telemetr.io/', 'Telegram channel analytics and post search.'],
    ['Images / Videos / Docs > Images > Search', 'Google Lens', 'https://lens.google.com/', 'Reverse image and object search.'],
    ['Images / Videos / Docs > Images > Forensics', 'Forensically', 'https://29a.ch/photo-forensics/', 'In-browser error level analysis, clone detection, metadata.'],
    ['Images / Videos / Docs > Images > Forensics', 'InVID-WeVerify plugin', 'https://www.invid-project.eu/tools-and-services/invid-verification-plugin/', 'Browser plugin for video and image verification: keyframes, reverse search, forensics.'],
    ['Images / Videos / Docs > Images > Forensics', 'ExifTool', 'https://exiftool.org/', 'The definitive metadata reader and writer.'],
    ['Geolocation Tools / Maps > Geolocation Tools', 'Overpass Turbo', 'https://overpass-turbo.eu/', 'Query OpenStreetMap features: find every place matching a description.'],
    ['Geolocation Tools / Maps > Geolocation Tools', 'Bellingcat OSM Search', 'https://osm-search.bellingcat.com/', 'Find locations where specific OSM features appear near each other.'],
    ['Geolocation Tools / Maps > Geolocation Tools', 'PeakVisor', 'https://peakvisor.com/', '3D mountain identification, useful for matching skylines.'],
    ['Geolocation Tools / Maps > Satellite Imagery', 'Copernicus Browser', 'https://browser.dataspace.copernicus.eu/', 'Free Sentinel satellite imagery with time slider.'],
    ['Geolocation Tools / Maps > Satellite Imagery', 'NASA FIRMS', 'https://firms.modaps.eosdis.nasa.gov/map/', 'Near-real-time fire and thermal anomaly map.'],
    ['Geolocation Tools / Maps > Satellite Imagery', 'Esri Wayback Imagery', 'https://livingatlas.arcgis.com/wayback/', 'Historical versions of Esri world imagery.'],
    ['Business Records > Sanctions & Leaks', 'OpenSanctions', 'https://www.opensanctions.org/search/?q={target}', 'Sanctions, PEPs and persons of interest.', 'name'],
    ['Business Records > Sanctions & Leaks', 'OCCRP Aleph', 'https://aleph.occrp.org/', 'Investigative data: company registries, leaks, court records.'],
    ['Business Records > Sanctions & Leaks', 'ICIJ Offshore Leaks', 'https://offshoreleaks.icij.org/search?q={target}', 'Panama, Paradise, Pandora Papers entities and officers.', 'name'],
    ['Business Records > Sanctions & Leaks', 'GLEIF LEI Search', 'https://search.gleif.org/', 'Legal entity identifiers and corporate ownership.'],
    ['Business Records > Sanctions & Leaks', 'OpenCorporates officers', 'https://opencorporates.com/officers?q={target}', 'Find company directors and officers by name.', 'name'],
    ['Transportation > Marine Records', 'Global Fishing Watch', 'https://globalfishingwatch.org/map', 'Vessel activity and AIS gap analysis.'],
    ['Digital Currency > Bitcoin', 'mempool.space', 'https://mempool.space/address/{target}', 'Bitcoin explorer: address history and transactions.', 'crypto'],
    ['Digital Currency > Multi-chain', 'Blockchair', 'https://blockchair.com/search?q={target}', 'Search 40+ blockchains.', 'crypto'],
    ['Digital Currency > Multi-chain', 'Arkham Intelligence', 'https://intel.arkm.com/', 'Entity attribution for blockchain addresses.'],
    ['Digital Currency > Multi-chain', 'Chainabuse', 'https://www.chainabuse.com/address/{target}', 'Community reports of scam and fraud addresses.', 'crypto'],
    ['Digital Currency > Multi-chain', 'Breadcrumbs', 'https://www.breadcrumbs.app/', 'Visual blockchain investigation.'],
    ['Archives > Web', 'Ghostarchive', 'https://ghostarchive.org/', 'Web and video archive; good for preserving social posts.'],
    ['Archives > Web', 'archive.today newest', 'https://archive.ph/newest/{target}', 'Latest archive.today snapshot of a URL.', 'url'],
    ['Archives > Web', 'Wayback Machine (all captures)', 'https://web.archive.org/web/*/{target}*', 'Every capture under a domain or URL.', 'domain'],
    ['Malicious File Analysis > Search', 'MalwareBazaar', 'https://bazaar.abuse.ch/browse/', 'Malware sample sharing by abuse.ch.'],
    ['Malicious File Analysis > Search', 'Triage', 'https://tria.ge/', 'Malware sandbox with public reports.'],
    ['Malicious File Analysis > Search', 'ThreatFox', 'https://threatfox.abuse.ch/browse/', 'IOC sharing by abuse.ch.'],
    ['Training', 'Bellingcat Online Investigation Toolkit', 'https://bellingcat.gitbook.io/toolkit', 'Maintained, annotated catalogue of investigation tools.'],
    ['Training', 'OSINT Framework', 'https://osintframework.com/', 'The original tree-style OSINT resource map.'],
    ['Training', 'IntelTechniques Tools', 'https://inteltechniques.com/tools/', 'Michael Bazzell’s search tools and workbook resources.'],
];

const data = loadRegistry(DATA);
const log = { dropped: [], updated: [], fixed: [], added: [] };

function findOrCreate(root, pathStr) {
    let node = root;
    for (const part of pathStr.split(' > ')) {
        let child = (node.children ||= []).find(c => c.type === 'folder' && c.name === part);
        if (!child) {
            child = { name: part, type: 'folder', children: [] };
            node.children.push(child);
        }
        node = child;
    }
    return node;
}

function processFolder(folder) {
    if (!folder.children) return;
    folder.children = folder.children.filter(n => {
        if (n.type !== 'url') return true;
        if (RETIRED.has(n.name)) { log.dropped.push(`${n.name} (retired)`); return false; }
        if (FIX[n.name]) {
            Object.assign(n, FIX[n.name]);
            log.fixed.push(n.name);
            return true;
        }
        const r = byUrl.get(n.url);
        if (!r || KEEP.has(n.name)) return true;
        if (r.status === 'dead' || r.status === 'parked') { log.dropped.push(`${n.name} (${r.reason})`); return false; }
        if (r.status === 'moved') {
            if (MOVED_DROP.has(n.name) || !r.finalUrl) { log.dropped.push(`${n.name} (${r.reason})`); return false; }
            if (!n.url.includes('{target}')) {
                log.updated.push(`${n.name}: ${n.url} -> ${r.finalUrl}`);
                n.url = r.finalUrl;
            }
        }
        if (r.status === 'error' && /DNS|EAI_AGAIN/.test(r.reason)) { log.dropped.push(`${n.name} (${r.reason})`); return false; }
        return true;
    });
    folder.children.forEach(processFolder);
}

processFolder(data);

// Infer input type for any remaining {target} templates.
for (const { node } of walkTools(data)) {
    if (node.url.includes('{target}') && !node.input) node.input = 'any';
}

// Additions (skip if the URL already exists).
const existing = new Set([...walkTools(data)].map(t => t.node.url.replace(/\/$/, '')));
for (const [p, name, url, description, input] of ADD) {
    if (existing.has(url.replace(/\/$/, ''))) continue;
    const folder = findOrCreate(data, p);
    const node = { name, type: 'url', url, description, added: '2026-11' };
    if (input) node.input = input;
    folder.children.push(node);
    existing.add(url);
    log.added.push(name);
}

// De-duplicate identical URLs within a folder; prune empty folders.
function tidy(folder) {
    if (!folder.children) return;
    const seen = new Set();
    folder.children = folder.children.filter(n => {
        if (n.type !== 'url') return true;
        const k = n.url.replace(/\/$/, '').replace(/^http:/, 'https:');
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
    folder.children.forEach(tidy);
    folder.children = folder.children.filter(n => n.type === 'url' || (n.children && n.children.length));
}
tidy(data);
data.name = 'Azimuth Registry';

saveRegistry(DATA, data);
fs.writeFileSync('scripts/curation-log.json', JSON.stringify(log, null, 2));
const total = [...walkTools(data)].length;
console.log(`dropped ${log.dropped.length}, updated ${log.updated.length}, fixed ${log.fixed.length}, added ${log.added.length}; ${total} tools remain.`);
