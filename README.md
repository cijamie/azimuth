# AZIMUTH v3.1 — OSINT Workbench

Paste a username, email, domain, IP, link, phone number, file hash, crypto wallet or name. Azimuth works out what it is, checks free public sources straight away, tells you in plain English what it found, surfaces new leads you can follow with one click, and builds a link chart, timeline and report as you go.

It is one static web page: no server, no build step, no account. Open `index.html`, serve the folder locally, or host it on GitHub Pages.

---

## Using it

1. **Type or paste into the box at the top** (or paste anywhere on the page). Pasting a whole email, report or log pulls every indicator out of it; pasting a screenshot opens it in Photo check.
2. **Read the summary.** Live checks run automatically (you can switch that off in ⚙ Settings).
3. **Follow leads.** “New leads found” lists IPs, domains, emails, subdomains and handles that the checks uncovered. Clicking one investigates it and links it on the chart.
4. **Start here** gives the 4–7 best manual sources, already filled in; “More places to look” has ~200 more.
5. **Save** findings (⊕ Save, or *Save all findings*), then open the **Case file** to export a report.

`Ctrl+K` opens the command palette (any action, any tool, or investigate what you type). Other keys: `/` search box · `N` add evidence · `1`–`7` switch sections · `Esc` close.

## Sections

| Section | What it does |
|---|---|
| **Investigate** | Detection, live checks, summary, leads, “Start here”, all links, and the username sweep tab. |
| **Link chart & timeline** | Everything you investigated and how it connects: drag, zoom, click to investigate, download as SVG. The timeline collects every date the checks found (registrations, account creation, archive captures, breach dates, photo dates) plus your evidence. |
| **Case file** | Evidence (numbered E1, E2…, with screenshots, SHA-256 hashes, confidence, tags, comments), selectors, the activity log, reports, sharing. |
| **Watchlist** | ☆ Watch anything; Azimuth re-checks it on a schedule while it is open and shows exactly what changed (new subdomains, DNS, ports, registration, accounts, wallet activity), with optional desktop notifications. |
| **Tool directory** | ~750 curated tools in 32 categories, search, favorites and a health badge on every link. |
| **Search dorks** | 40+ ready-made Google/Bing/DuckDuckGo/Yandex/Brave dorks for sites, people, emails and usernames; save your own with `{T}`. |
| **Toolkit** | Extract indicators · Photo check (metadata/GPS, error level analysis, one-click reverse image search) · Sun & shadows (sun position, shadow direction and length, times matching a shadow) · Compare archived pages (Wayback captures side by side) · Encode/decode · Hash · Timestamps. |

## Live checks

| Selector | Free, no key | With your key (⚙ Settings) |
|---|---|---|
| Domain | DNS (incl. SPF, DMARC, mail provider), RDAP registration, certificate-log subdomains (crt.sh / Cert Spotter), Wayback first & last capture, AlienVault OTX threat reports, Have I Been Pwned breaches of the site | VirusTotal |
| IP | Owner/ASN/location (ipinfo), open ports and known CVEs (Shodan InternetDB), RDAP, reverse DNS, Tor relay list, OTX | Shodan full host, VirusTotal |
| Email | Gravatar profile & linked accounts, the domain’s DNS and breaches, GitHub for the name part | |
| Username | GitHub, GitLab, Bluesky, Mastodon, Keybase, Hacker News, Chess.com, Lichess (+ the 600-site sweep) | |
| Phone | Country, validity, line type (mobile/landline/VoIP…) and formats via libphonenumber | |
| Hash | Known test files, OTX threat reports and malware families | VirusTotal |
| URL / image | Wayback, host DNS & RDAP, OTX, image size and EXIF when the host allows it | VirusTotal (URL) |
| Wallet | mempool.space (BTC), BlockCypher (ETH) | |
| Name | Wikipedia, Wikidata | |

These requests go straight from your browser to each service, so they see your IP; use the **Check my IP** button and a VPN if that matters. Have I Been Pwned (per-account), Hunter, SecurityTrails, GreyNoise, urlscan and Reddit block requests from web pages, so they are links rather than live checks. Keys are stored only in your browser and sent only to their own service.

## Username sweep (≈600 sites)

Web pages can’t read other websites, so the big sweep needs one of these:

**Browser extension** (Chrome, Edge, Brave): open `chrome://extensions`, turn on *Developer mode*, click *Load unpacked* and pick the `extension` folder. Reload Azimuth; the *Username sweep* tab now runs in the browser. The extension also adds **“Investigate in Azimuth”** to the right-click menu for selected text, links, images and pages. In the extension’s options, set the address where you run Azimuth (default `https://jamies.dev/azimuth/`). To use Azimuth from a file on disk, also enable *Allow access to file URLs*.

**Command line** (Node.js 18+):

```bash
node scripts/sweep.mjs someusername
```

Site rules come from the [WhatsMyName](https://github.com/WebBreacher/WhatsMyName) project (CC BY-SA 4.0). Matches are based on page content, so open them to confirm.

## Reports and sharing

Pick a template in the Case file, then download PDF or Markdown:

- **Standard:** summary, selectors, evidence index, link chart, timeline, evidence, activity log.
- **Law enforcement:** exhibit list (case-ID-numbered with screenshot hashes), chain-of-custody statement, methodology and tools used, full audit trail, analyst declaration with signature lines.
- **Journalism:** verification status per finding, what still needs verifying (Possible/Doubtful/unset), numbered source list.
- **Due diligence:** conclusion, risk findings (evidence tagged `risk`, `sanctions`, `pep`, `adverse`, `fraud`, `litigation` or `criminal`), sanctions/PEP screening section, sources consulted.

**Sharing without a server:** *Download encrypted case* (AES-256-GCM, key derived from your passphrase with PBKDF2, 310,000 rounds) creates a `.azcase` file; send the passphrase separately. *Merge a teammate’s case* adds their evidence (tagged `from:<name>`), comments, links, timeline and activity to yours without duplicating anything. Comments on evidence carry the analyst’s name, so a case can go back and forth. Real-time co-editing would need a server, which Azimuth deliberately doesn’t have.

## Keeping the tool directory healthy

```bash
node scripts/check-links.mjs --apply   # re-check every link and write its status into js/data.js
node scripts/fixups.mjs                 # manual corrections after an audit
```

The checker follows redirects and sorts links into ok, bot-protected, moved, parked/for-sale, dead and unverified. The 2026-11 audit of the old list: 860 links checked; 160 removed (dead, parked, hijacked, or shut-down services such as Panoramio, LiveLeak, Alexa and Skype tools); 28 moved links updated; 60 current tools added. See `scripts/link-report.json` and `scripts/curation-log.json`.

## Files

```text
index.html            the app
css/arf.css           styles (dark and light themes)
js/data.js            tool directory with link health
js/util.js            escaping, storage, IndexedDB, hashing, clipboard, opening tabs
js/settings.js        settings and API keys
js/selectors.js       type detection, refang/defang, indicator extraction
js/pivots.js          link templates per type and the "Start here" picks
js/lookups.js         live checks, lead discovery, dated facts, change fingerprints
js/toolkit.js         indicators, codecs, hashes, EXIF parser, timestamps
js/imagetools.js      photo check, error level analysis, sun & shadows, Wayback compare
js/case.js            case file, evidence, reports, encryption, merge
js/graph.js           link chart and timeline
js/watch.js           watchlist
js/sweep.js           page side of the username sweep
js/palette.js         command palette
js/app.js             wiring and UI
extension/            browser extension (right-click menu + sweep engine)
scripts/              link checker, curation scripts, command-line sweep
```

Everything you do is stored only in this browser (localStorage, plus IndexedDB for screenshots). ⚙ Settings → *Delete all Azimuth data* wipes it.

## Disclaimer

For lawful research, security work and journalism. You are responsible for following the law and the terms of the services you use.
