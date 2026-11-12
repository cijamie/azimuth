# AZIMUTH v3.2 — OSINT Workbench

Paste a username, email, domain, IP, link, phone number, file hash, crypto wallet or name. Azimuth works out what it is, checks free public sources straight away, tells you in plain English what it found, surfaces new leads you can follow with one click, and builds a link chart, map, timeline and a professional report as you go.

It is a static web app: no server, no build step, no account, nothing to pay for. Use it at **[jamies.dev/azimuth](https://jamies.dev/azimuth/)**, install it as an app from the browser menu, or open `index.html` locally.

---

## Using it

1. **Type or paste into the box at the top** (or paste anywhere on the page). Pasting a whole email, report or log pulls every indicator out of it; pasting a screenshot opens it in Photo check.
2. **Read the summary.** Live checks run automatically (switch off in ⚙ Settings, or turn on **privacy mode** to never contact any service).
3. **Follow leads.** “New leads found” lists IPs, domains, emails, subdomains and handles the checks uncovered. Clicking one investigates it and links it on the chart.
4. **Start here** gives the 4–7 best manual sources, already filled in; “More places to look” has ~200 more.
5. **Save** findings, grade them, link them to requirements, then export a report from the **Case file**.

`Ctrl+K` opens the command palette (any action, any tool, or investigate what you type). Other keys: `/` search box · `N` add evidence · `1`–`9` switch sections · `Esc` close.

## Sections

| Section | What it does |
|---|---|
| **Investigate** | Detection, live checks, summary, leads, “Start here”, all links. Extra tabs: **username search** (Maigret, 9,000+ sites), **same person?** (compares the accounts found: profile-picture similarity, names, locations, cross-links), **lookalike domains** (typos, homoglyphs, other endings; checks which are registered and can receive email). |
| **Link chart & timeline** | How everything connects (drag, zoom, click; SVG download), a **map** of every location (IP geolocation, photo/video GPS, places you click), and a timeline of every date found. |
| **Case file** | **Multiple cases** with a switcher and search across all cases. Evidence numbered E1, E2… with screenshots, SHA-256 hashes, **Admiralty grading** (reliability A–F, credibility 1–6), confidence, tags, comments, **redaction**, **page preservation** (Wayback + archive.today), **OpenTimestamps** proofs and automatic **capture context** (server IP and registrar at the time). Reports, sharing, exports and imports. |
| **Analysis & review** | **Intelligence requirements** linked to evidence, **key judgments** in standard probability language (ICD 203), an **ACH** (analysis of competing hypotheses) matrix, **authority/necessity/proportionality** record with a retention date, **peer review** sign-off, and an optional **AI assistant** (your own Anthropic key). |
| **Watchlist** | Re-checks watched selectors on a schedule while Azimuth is open and shows exactly what changed. |
| **Bulk check** | Up to 500 selectors at once (or paste any text): key facts and red flags per row, CSV export, add to case. |
| **Tool directory** | ~750 curated tools, health-checked every week by a GitHub Action. |
| **Search dorks** | 40+ dorks for five engines, plus your own saved ones. |
| **Toolkit** | Extract indicators · **Email header analyzer** (route, real sending servers, SPF/DKIM/DMARC, spoofing signs) · **Name & email variants** (transliteration, nicknames, username and address patterns) · **Document metadata** (PDF, Word, Excel, PowerPoint, OpenDocument: authors, company, software, dates, comment authors, file-path usernames) · **Video frames** (scene-change keyframes, recording time, phone GPS) · **Search a big file** locally (multi-GB leaks, logs) · **Telegram channel** reader · **Research personas** tracker · Photo check (EXIF/GPS, error level analysis, reverse search) · Sun & shadows · Compare archived pages · Encode/decode · Hash · Timestamps. |

## Live checks (free, run in your browser)

| Selector | Sources | With your key |
|---|---|---|
| Domain | DNS (SPF, DMARC, mail provider), RDAP, certificate-log subdomains, Wayback, AlienVault OTX, HIBP breaches of the site | VirusTotal |
| IP | Owner/location (ipinfo), open ports & CVEs (Shodan InternetDB), RDAP, reverse DNS, Tor relays, OTX | Shodan, VirusTotal |
| Email | Gravatar profile, domain DNS & breaches, GitHub for the name part | |
| Username | GitHub, GitLab, Bluesky, Mastodon, Keybase, Hacker News, Chess.com, Lichess | |
| Phone | Country, validity, line type (libphonenumber) | |
| Hash | Known test files, OTX threat reports | VirusTotal |
| URL / image | Wayback, host DNS & RDAP, OTX, image EXIF where allowed | VirusTotal |
| Wallet | mempool.space (BTC), BlockCypher (ETH) | |
| Name | Wikipedia, Wikidata, **GLEIF company register** with parent companies | |

Lookups go straight from your browser to each service, so they see your IP; check it with **Check my IP** in the sidebar. Have I Been Pwned (per account), Hunter, SecurityTrails, GreyNoise, urlscan and Reddit don’t allow calls from web pages, so they are links instead.

## Security and privacy

- Everything is stored only in your browser. **⚙ Settings → Lock with a passphrase** encrypts cases, screenshots, personas, watchlist and history at rest (AES-256-GCM, PBKDF2 310k). It auto-locks after 15 minutes idle; **Lock now** is in the sidebar. A forgotten passphrase can’t be recovered.
- **Privacy mode** stops every automatic request (lookups, watchlist, timestamps, IP check, AI); links still work.
- Shared case files can be encrypted with their own passphrase (`.azcase`). *Merge a teammate’s case* combines evidence, comments, links and timelines.

## Exports and imports

Export to **Maltego** (CSV), **Gephi/Maltego** (GraphML), **i2 Analyst’s Notebook** (CSV), **STIX 2.1**, **MISP**, **CASE/UCO** (digital-forensics standard) and evidence CSV. Import results from **Sherlock**, **Maigret**, **SpiderFoot**, **theHarvester**, **Holehe** and the Azimuth sweep; findings become leads on the chart.

Report templates: **Standard**, **Law enforcement** (exhibit list, chain of custody, legal basis, methodology, audit trail, declaration), **Journalism** (verification status, sources, open questions), **Due diligence** (risk findings, sanctions/PEP screening). Every template includes key judgments, requirements, ACH, map locations, peer review and Admiralty grades where present.

## Browser extension (free; Chrome, Edge, Brave)

Open `chrome://extensions`, turn on *Developer mode*, click *Load unpacked* and choose the `extension` folder. It adds:

- **Investigate in Azimuth** on the right-click menu (text, links, images, pages) and **Capture this page**.
- **Record pages**: while switched on (toolbar popup), every page you open is saved with a screenshot, its HTML and SHA-256 hashes of both. Import them into a case from the Case file.
- **Maigret username search** across 9,000+ sites, and the **Telegram channel** reader (web pages can’t read other sites; the extension can).

Set where Azimuth lives in the extension’s options (default `https://jamies.dev/azimuth/`).

## Maigret username search

Azimuth includes a JavaScript port of [Maigret](https://github.com/soxoj/maigret) (MIT) and its database of 9,345 sites (`extension/maigret-data.json`, refreshed from Maigret’s GitHub daily by the extension, or with `--update` on the command line). What’s ported:

- every site and engine template (XenForo, phpBB, Discourse, MediaWiki, Mastodon…), ranked by popularity, filterable by category tags and engines, with disabled sites optional;
- Maigret’s three detection methods (status code, page text, redirect), username format rules, probe URLs, POST payloads, custom headers and character sets;
- its error detection (bot protection, captchas, censorship pages, 401/403/429/5xx), so a blocked request is reported as “couldn’t check”, never as “not found”;
- **recursive search**: usernames a profile links to (declared with `rel="me"` or structured data, or linked from two or more different sites and not part of that site’s own template) are searched too;
- **permutations** of name parts (`john doe 1990` → `john.doe`, `doe_john`, …) and other identifier types (`gaia_id`, `vk_id`, `steam_id`…).

Not ported: Tor/I2P gateways, Cloudflare bypass and TLS impersonation, token activation for six sites, and the `socid_extractor` library (Azimuth has its own smaller profile extractor). Results export as Maigret-compatible JSON, CSV or an HTML report.

## Command line

```bash
node scripts/maigret.mjs someusername                    # Maigret search, top 500 sites (Node 18+)
node scripts/maigret.mjs someusername -a --json out.json # all 8,500+ enabled sites, JSON report
node scripts/maigret.mjs john doe 1990 --permute         # search permutations of name parts
node scripts/maigret.mjs someusername --tags social,coding --html report.html
node scripts/check-links.mjs --apply                     # re-check every tool link
```

Run `node scripts/maigret.mjs --help` for every option (`--top-sites`, `--exclude-tags`, `--use-disabled-sites`, `--id-type`, `--no-recursion`, `--timeout`, `-n`, `--update`, `--csv`, `--print-errors`…). The older WhatsMyName sweep is still available as `scripts/sweep.mjs` and as a choice in the app.

A GitHub Action (`.github/workflows/link-check.yml`) runs the link check every Monday and commits updated health badges.

## Files

```text
index.html  manifest.webmanifest  sw.js        app shell, install manifest, offline cache
css/arf.css                                    styles (dark and light)
js/data.js                                     tool directory with link health
js/util.js js/vault.js js/settings.js          helpers, encryption at rest, settings
js/selectors.js js/pivots.js js/lookups.js     detection, links, live checks, leads, GLEIF
js/case.js js/analysis.js js/evidencetools.js  cases, analysis & review, evidence integrity
js/graph.js js/mapview.js js/watch.js          link chart & timeline, map, watchlist
js/bulk.js js/match.js js/sweep.js             bulk check & lookalikes, same-person, sweep
js/toolkit.js js/imagetools.js js/forensics.js js/research.js   toolkit tabs
js/interop.js js/ai.js js/palette.js js/app.js  exports/imports, AI assistant, palette, wiring
extension/                                      browser extension
scripts/                                        link checker, curation, command-line sweep
```

## Disclaimer

For lawful research, security work and journalism. You are responsible for following the law and the terms of the services you use.
