window.OSINT_DATA = {
  "name": "Azimuth Registry",
  "type": "folder",
  "children": [
    {
      "name": "Username",
      "type": "folder",
      "children": [
        {
          "name": "Username Search Engines",
          "type": "folder",
          "children": [
            {
              "name": "WhatsMyName",
              "type": "url",
              "url": "https://whatsmyname.app/?q={target}",
              "description": "Comprehensive username enumeration across hundreds of websites.",
              "tags": [
                "username",
                "enumeration",
                "social-media"
              ],
              "input": "username",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Namechk",
              "type": "url",
              "url": "https://namechk.com/?q={target}",
              "description": "Check username and domain availability across multiple platforms.",
              "tags": [
                "username",
                "domain",
                "availability"
              ],
              "input": "username",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "UserSearch.org",
              "type": "url",
              "url": "https://usersearch.org/?q={target}",
              "input": "username",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Thats Them",
              "type": "url",
              "url": "https://thatsthem.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "NameCheckup",
              "type": "url",
              "url": "https://namecheckup.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Instant Username Search",
              "type": "url",
              "url": "https://instantusername.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "IDCrawl Username Search",
              "type": "url",
              "url": "https://www.idcrawl.com/username",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Names Directory",
              "type": "url",
              "url": "https://namesdir.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Sherlock (CLI)",
              "type": "url",
              "url": "https://github.com/sherlock-project/sherlock",
              "description": "Open-source username hunt across 400+ sites. Run locally.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Maigret (CLI)",
              "type": "url",
              "url": "https://github.com/soxoj/maigret",
              "description": "Sherlock fork that also parses profile pages for extra identifiers. Run locally.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Blackbird (CLI)",
              "type": "url",
              "url": "https://github.com/p1ngul1n0/blackbird",
              "description": "Username and email search across 600+ sites.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Specific Sites",
          "type": "folder",
          "children": [
            {
              "name": "Amazon Profiles (Google)",
              "type": "url",
              "url": "https://www.google.com/search?q=site%3Aamazon.com+%22{target}%22",
              "input": "username",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Keybase",
              "type": "url",
              "url": "https://keybase.io/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "MIT PGP Key Server",
              "type": "url",
              "url": "http://pgp.mit.edu/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Proton Mail Key Lookup",
              "type": "url",
              "url": "https://api.protonmail.ch/pks/lookup?op=index&search={target}",
              "input": "email",
              "description": "Returns a PGP key if the address is a Proton Mail account.",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Email Address",
      "type": "folder",
      "children": [
        {
          "name": "Email Search",
          "type": "folder",
          "children": [
            {
              "name": "ThatsThem",
              "type": "url",
              "url": "https://thatsthem.com/reverse-email-lookup",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Hunter",
              "type": "url",
              "url": "https://hunter.io/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "VoilaNorbert",
              "type": "url",
              "url": "https://www.voilanorbert.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "OSINT Industries",
              "type": "url",
              "url": "https://osint.industries/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Skymem",
              "type": "url",
              "url": "http://www.skymem.info/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Epieos",
              "type": "url",
              "url": "https://epieos.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Holehe (CLI)",
              "type": "url",
              "url": "https://github.com/megadose/holehe",
              "description": "Checks which sites an email is registered on via password-reset flows. Run locally.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "GHunt (CLI)",
              "type": "url",
              "url": "https://github.com/mxrch/GHunt",
              "description": "Investigates Google accounts from an email address.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Epieos",
              "type": "url",
              "url": "https://epieos.com/?q={target}&t=email",
              "description": "Reverse email lookup: linked Google account, registered services.",
              "added": "2026-11",
              "input": "email",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Common Email Formats",
          "type": "folder",
          "children": [
            {
              "name": "Email Format",
              "type": "url",
              "url": "https://www.email-format.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Email Permutator",
              "type": "url",
              "url": "http://metricsparrow.com/toolkit/email-permutator/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "OneLook Reverse Dictionary and Thesaurus",
              "type": "url",
              "url": "http://www.onelook.com/reverse-dictionary.shtml",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Email Verification",
          "type": "folder",
          "children": [
            {
              "name": "Reacher Demo",
              "type": "url",
              "url": "https://reacher.email",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "MailScrap",
              "type": "url",
              "url": "https://mailscrap.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Read Notify",
              "type": "url",
              "url": "http://www.readnotify.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Email Reputation",
              "type": "url",
              "url": "https://emailrep.io/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "MailboxValidator",
              "type": "url",
              "url": "https://www.mailboxvalidator.com/demo",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Breach Data",
          "type": "folder",
          "children": [
            {
              "name": "Have I been pwned?",
              "type": "url",
              "url": "https://haveibeenpwned.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Hudson Rock",
              "type": "url",
              "url": "https://www.hudsonrock.com/threat-intelligence-cybercrime-tools",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Vigilante.pw",
              "type": "url",
              "url": "https://www.vigilante.pw/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Ashley Madison Emails",
              "type": "url",
              "url": "https://ashley.cynic.al/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "DeHashed",
              "type": "url",
              "url": "https://dehashed.com/search?query={target}",
              "description": "Search breach records by email, username, name, IP, phone. Paid for full results.",
              "added": "2026-11",
              "input": "any",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "LeakCheck",
              "type": "url",
              "url": "https://leakcheck.io/",
              "description": "Breach search by email, username or phone.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Intelligence X",
              "type": "url",
              "url": "https://intelx.io/?s={target}",
              "description": "Search leaks, pastes, darknet and historical web data.",
              "added": "2026-11",
              "input": "any",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "h8mail (CLI)",
              "type": "url",
              "url": "https://github.com/khast3x/h8mail",
              "description": "Email OSINT and breach hunting from the command line.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Mail Blacklists",
          "type": "folder",
          "children": [
            {
              "name": "MxToolbox",
              "type": "url",
              "url": "http://mxtoolbox.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Domain Name",
      "type": "folder",
      "children": [
        {
          "name": "Whois Records",
          "type": "folder",
          "children": [
            {
              "name": "Domain Dossier",
              "type": "url",
              "url": "http://centralops.net/co/DomainDossier.aspx",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "domainIQ",
              "type": "url",
              "url": "https://www.domainiq.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "DomainTools Whois",
              "type": "url",
              "url": "http://whois.domaintools.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Whoisology",
              "type": "url",
              "url": "https://whoisology.com/#advanced",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "DNSstuff",
              "type": "url",
              "url": "https://tools.dnsstuff.com/",
              "status": "error",
              "checked": "2026-11-12"
            },
            {
              "name": "Domaincrawler.com",
              "type": "url",
              "url": "http://www.domaincrawler.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "MarkMonitor Whois Search",
              "type": "url",
              "url": "https://domains.markmonitor.com/whois/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Website Informer",
              "type": "url",
              "url": "http://website.informer.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Who.is",
              "type": "url",
              "url": "https://who.is/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ViewDNS.info",
              "type": "url",
              "url": "http://viewdns.info/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Daily DNS Changes",
              "type": "url",
              "url": "https://dailychanges.domaintools.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "IP2WHOIS",
              "type": "url",
              "url": "https://www.ip2whois.com",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Netlas.io",
              "type": "url",
              "url": "https://app.netlas.io/whois_domains/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "ICANN Lookup (RDAP)",
              "type": "url",
              "url": "https://lookup.icann.org/en/lookup?name={target}",
              "description": "Official registration data via RDAP.",
              "added": "2026-11",
              "input": "domain",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "WhoisXML API",
              "type": "url",
              "url": "https://whois.whoisxmlapi.com/lookup?q={target}",
              "description": "Current and historic WHOIS, reverse WHOIS.",
              "added": "2026-11",
              "input": "domain",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Subdomains",
          "type": "folder",
          "children": [
            {
              "name": "SynapsInt",
              "type": "url",
              "url": "https://synapsint.com",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Pentest-tools.com Subdomains",
              "type": "url",
              "url": "https://pentest-tools.com/information-gathering/find-subdomains-of-domain",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Netlas.io",
              "type": "url",
              "url": "https://app.netlas.io/domains/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Subdomain Center",
              "type": "url",
              "url": "https://api.subdomain.center/?domain={target}",
              "description": "Free subdomain API (JSON).",
              "added": "2026-11",
              "input": "domain",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "crt.sh subdomains",
              "type": "url",
              "url": "https://crt.sh/?q=%25.{target}",
              "description": "Every certificate ever logged for *.domain.",
              "added": "2026-11",
              "input": "domain",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "subfinder (CLI)",
              "type": "url",
              "url": "https://github.com/projectdiscovery/subfinder",
              "description": "Passive subdomain enumeration from dozens of sources.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "OWASP Amass (CLI)",
              "type": "url",
              "url": "https://github.com/owasp-amass/amass",
              "description": "In-depth attack-surface mapping and asset discovery.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Discovery",
          "type": "folder",
          "children": [
            {
              "name": "Shodan",
              "type": "url",
              "url": "https://www.shodan.io/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Netlas.io",
              "type": "url",
              "url": "https://app.netlas.io/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Online Nikto scanner",
              "type": "url",
              "url": "https://nikto.online/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "urlscan.io",
              "type": "url",
              "url": "https://urlscan.io/search/#*",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Redirect Detective",
              "type": "url",
              "url": "http://redirectdetective.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "BuiltWith",
              "type": "url",
              "url": "https://builtwith.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Wappalyzer",
              "type": "url",
              "url": "https://www.wappalyzer.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "AnalyzeID",
              "type": "url",
              "url": "http://analyzeid.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Criminal IP Search",
              "type": "url",
              "url": "https://www.criminalip.io/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "urlDNA",
              "type": "url",
              "url": "https://urldna.io",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "SecurityTrails",
              "type": "url",
              "url": "https://securitytrails.com/domain/{target}/dns",
              "description": "Historical DNS, subdomains, associated domains.",
              "added": "2026-11",
              "input": "domain",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Validin",
              "type": "url",
              "url": "https://app.validin.com/",
              "description": "Passive DNS, host responses and pivots for threat hunting.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "LeakIX",
              "type": "url",
              "url": "https://leakix.net/search?scope=leak&q={target}",
              "description": "Search exposed services and leaks.",
              "added": "2026-11",
              "input": "any",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "theHarvester (CLI)",
              "type": "url",
              "url": "https://github.com/laramies/theHarvester",
              "description": "Gathers emails, subdomains, hosts and names for a domain.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "SpiderFoot (CLI)",
              "type": "url",
              "url": "https://github.com/smicallef/spiderfoot",
              "description": "Automated OSINT recon with 200+ modules.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Certificate Search",
          "type": "folder",
          "children": [
            {
              "name": "Censys",
              "type": "url",
              "url": "https://search.censys.io/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "crt.sh - Certificate Search",
              "type": "url",
              "url": "https://crt.sh/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Netlas.io",
              "type": "url",
              "url": "https://app.netlas.io/certs/",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "PassiveDNS",
          "type": "folder",
          "children": [
            {
              "name": "Mnemonic",
              "type": "url",
              "url": "http://passivedns.mnemonic.no/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "DNS History",
              "type": "url",
              "url": "http://dnshistory.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "PTRarchive.com",
              "type": "url",
              "url": "http://ptrarchive.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "DNS Dumpster",
              "type": "url",
              "url": "https://dnsdumpster.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Reputation",
          "type": "folder",
          "children": [
            {
              "name": "AbuseIPDB (Webpage and API)",
              "type": "url",
              "url": "https://www.abuseipdb.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "UrlQuery.net",
              "type": "url",
              "url": "http://urlquery.net/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "URL Void",
              "type": "url",
              "url": "http://www.urlvoid.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "FortiGuard Reputation Service",
              "type": "url",
              "url": "http://fortiguard.com/iprep",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Trend Micro Site Safety Center",
              "type": "url",
              "url": "https://global.sitesafety.trendmicro.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Sucuri SiteCheck",
              "type": "url",
              "url": "https://sitecheck.sucuri.net/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ThreatMiner.org",
              "type": "url",
              "url": "https://www.threatminer.org/",
              "status": "error",
              "checked": "2026-11-12"
            },
            {
              "name": "BlueCoat WebPulse",
              "type": "url",
              "url": "https://sitereview.bluecoat.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Zscaler Zulu URL Risk Analyzer",
              "type": "url",
              "url": "http://zulu.zscaler.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Joe Sandbox Url Analyzer",
              "type": "url",
              "url": "https://www.url-analyzer.net/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "AlienVault Open Threat Exchange",
              "type": "url",
              "url": "https://otx.alienvault.com/browse/pulses/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Web Inspector Online Scan",
              "type": "url",
              "url": "http://app.webinspector.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Safe Browsing API",
              "type": "url",
              "url": "https://developers.google.com/safe-browsing/?csw=1",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Domain Blacklists",
          "type": "folder",
          "children": [
            {
              "name": "Threatexpert.com Malicious URLs",
              "type": "url",
              "url": "http://www.networksec.org/grabbho/block.txt",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "scumware.org",
              "type": "url",
              "url": "https://www.scumware.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Shadowserver Foundation",
              "type": "url",
              "url": "https://www.shadowserver.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Email Domain Validation",
              "type": "url",
              "url": "https://www.mailboxvalidator.com/domain",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Typosquatting",
          "type": "folder",
          "children": [
            {
              "name": "dnstwister",
              "type": "url",
              "url": "https://dnstwister.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Analytics",
          "type": "folder",
          "children": [
            {
              "name": "BuiltWith",
              "type": "url",
              "url": "http://builtwith.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "SEMrush",
              "type": "url",
              "url": "https://www.semrush.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Moonsearch",
              "type": "url",
              "url": "http://moonsearch.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "StackShare",
              "type": "url",
              "url": "https://stackshare.io/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Ewhois",
              "type": "url",
              "url": "https://ewhois.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "StatsCrop",
              "type": "url",
              "url": "http://www.statscrop.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Open Site Explorer",
              "type": "url",
              "url": "https://moz.com/researchtools/ose/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "SecurityHeaders.io",
              "type": "url",
              "url": "https://securityheaders.io/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Keyword Density",
              "type": "url",
              "url": "http://tools.seobook.com/general/keyword-density/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Cisco Umbrella Popularity List",
              "type": "url",
              "url": "http://s3-us-west-1.amazonaws.com/umbrella-static/index.html",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "W3bin.com",
              "type": "url",
              "url": "https://w3bin.com/",
              "status": "error",
              "checked": "2026-11-12"
            },
            {
              "name": "Sitedossier",
              "type": "url",
              "url": "http://www.sitedossier.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ClearWebStats.com",
              "type": "url",
              "url": "https://www.clearwebstats.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "PubDB",
              "type": "url",
              "url": "http://pub-db.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "WWW Domain Tools",
              "type": "url",
              "url": "https://w3dt.net/",
              "status": "error",
              "checked": "2026-11-12"
            },
            {
              "name": "SimilarWeb",
              "type": "url",
              "url": "https://www.similarweb.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Siteliner",
              "type": "url",
              "url": "http://siteliner.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "WebPagetest",
              "type": "url",
              "url": "https://www.webpagetest.org/",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "URL Expanders",
          "type": "folder",
          "children": [
            {
              "name": "GetLinkInfo",
              "type": "url",
              "url": "http://www.getlinkinfo.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "CheckShortURL",
              "type": "url",
              "url": "http://checkshorturl.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "URL Unshortener",
              "type": "url",
              "url": "http://www.urlunshortener.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Where Does This Link Go?",
              "type": "url",
              "url": "https://wheregoes.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "KnowURL",
              "type": "url",
              "url": "http://www.knowurl.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Change Detection",
          "type": "folder",
          "children": [
            {
              "name": "VisualPing",
              "type": "url",
              "url": "http://visualping.io/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Check site availability Online",
              "type": "url",
              "url": "https://upcheck.online/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Follow That Page",
              "type": "url",
              "url": "https://www.followthatpage.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "WatchThatPage",
              "type": "url",
              "url": "http://watchthatpage.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Social Analysis",
          "type": "folder",
          "children": [
            {
              "name": "Google Trends",
              "type": "url",
              "url": "https://www.google.com/trends/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "DNSSEC",
          "type": "folder",
          "children": [
            {
              "name": "DNSSEC Analyzer",
              "type": "url",
              "url": "http://dnssec-debugger.verisignlabs.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "DNSViz",
              "type": "url",
              "url": "http://dnsviz.net/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Cloud Resources",
          "type": "folder",
          "children": [
            {
              "name": "Public Buckets",
              "type": "url",
              "url": "https://buckets.grayhatwarfare.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Online Port scanner",
              "type": "url",
              "url": "https://portscanner.online/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Vulnerabilities",
          "type": "folder",
          "children": [
            {
              "name": "Disclosure Sites",
              "type": "folder",
              "children": [
                {
                  "name": "Zone-H.org",
                  "type": "url",
                  "url": "http://zone-h.org/archive",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            }
          ]
        },
        {
          "name": "Tools",
          "type": "folder",
          "children": [
            {
              "name": "International Domain Name Conversion Tool",
              "type": "url",
              "url": "http://mct.verisign-grs.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Report Malicious Sites",
          "type": "folder",
          "children": [
            {
              "name": "Microsoft",
              "type": "url",
              "url": "https://www.microsoft.com/en-us/wdsi/support/report-unsafe-site-guest",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Google",
              "type": "url",
              "url": "https://safebrowsing.google.com/safebrowsing/report_phish/?hl=en",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "IP & MAC Address",
      "type": "folder",
      "children": [
        {
          "name": "Geolocation",
          "type": "folder",
          "children": [
            {
              "name": "MaxMind Demo",
              "type": "url",
              "url": "https://www.maxmind.com/en/home",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "IPv4/IPv6 lists by country code",
              "type": "url",
              "url": "https://github.com/ipverse/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "IP2Location.com",
              "type": "url",
              "url": "https://www.ip2location.com/demo",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "IP Fingerprints",
              "type": "url",
              "url": "http://www.ipfingerprints.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "DB-IP",
              "type": "url",
              "url": "https://db-ip.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "IP Location Finder",
              "type": "url",
              "url": "https://www.iplocation.net/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Info Sniper",
              "type": "url",
              "url": "http://www.infosniper.net/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "utrace",
              "type": "url",
              "url": "http://en.utrace.de/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "InfobyIP.com",
              "type": "url",
              "url": "https://www.infobyip.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "ipTRACKERonline",
              "type": "url",
              "url": "https://www.iptrackeronline.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "My IP Address",
              "type": "url",
              "url": "https://www.ipaddress.my/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ipinfo.io",
              "type": "url",
              "url": "https://ipinfo.io/{target}",
              "description": "Geolocation, ASN, company and privacy detection for an IP.",
              "added": "2026-11",
              "input": "ip",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Host / Port Discovery",
          "type": "folder",
          "children": [
            {
              "name": "Netlas.io",
              "type": "url",
              "url": "https://netlas.io/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ZoomEye",
              "type": "url",
              "url": "https://www.zoomeye.ai/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "FOFA",
              "type": "url",
              "url": "https://en.fofa.info/",
              "description": "Internet-wide asset search engine.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Hunter.how",
              "type": "url",
              "url": "https://hunter.how/",
              "description": "Internet asset search engine.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "IPv4",
          "type": "folder",
          "children": [
            {
              "name": "Onyphe",
              "type": "url",
              "url": "https://www.onyphe.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "IPv4 CIDR Report",
              "type": "url",
              "url": "http://www.cidr-report.org/as2.0/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Team Cymru IP to ASN",
              "type": "url",
              "url": "https://asn.cymru.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "IP to ASN DB",
              "type": "url",
              "url": "https://iptoasn.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Hacker Target - Reverse DNS",
              "type": "url",
              "url": "https://hackertarget.com/reverse-dns-lookup/",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "IPv6",
          "type": "folder",
          "children": [
            {
              "name": "IPv6 CIDR Report",
              "type": "url",
              "url": "http://www.cidr-report.org/v6/as2.0/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "BGP",
          "type": "folder",
          "children": [
            {
              "name": "Hurricane Electric BGP Toolkit",
              "type": "url",
              "url": "http://bgp.he.net/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "BGP Malicious Content Ranking",
              "type": "url",
              "url": "http://bgpranking.circl.lu/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "BGPStream",
              "type": "url",
              "url": "https://bgpstream.com/",
              "status": "error",
              "checked": "2026-11-12"
            },
            {
              "name": "PeeringDB",
              "type": "url",
              "url": "https://www.peeringdb.com/advanced_search",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Reputation",
          "type": "folder",
          "children": [
            {
              "name": "IP Void",
              "type": "url",
              "url": "http://www.ipvoid.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ExoneraTor",
              "type": "url",
              "url": "https://exonerator.torproject.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Grey Noise",
              "type": "url",
              "url": "https://viz.greynoise.io/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "LiveIPMap IP Check",
              "type": "url",
              "url": "https://www.liveipmap.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Spur",
              "type": "url",
              "url": "https://spur.us/context/{target}",
              "description": "Identifies VPN, residential proxy and anonymization infrastructure.",
              "added": "2026-11",
              "input": "ip",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "AbuseIPDB check",
              "type": "url",
              "url": "https://www.abuseipdb.com/check/{target}",
              "description": "Community abuse reports for an IP.",
              "added": "2026-11",
              "input": "ip",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Blacklists",
          "type": "folder",
          "children": [
            {
              "name": "Blocklist.de",
              "type": "url",
              "url": "http://www.blocklist.de/en/index.html",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "DShield API",
              "type": "url",
              "url": "https://isc.sans.edu/api/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "FireHOL IP Lists ",
              "type": "url",
              "url": "http://iplists.firehol.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Project Honey Pot",
              "type": "url",
              "url": "http://www.projecthoneypot.org/list_of_ips.php",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Neighbor Domains",
          "type": "folder",
          "children": [
            {
              "name": "IP Fingerprints - Reverse IP Lookup",
              "type": "url",
              "url": "http://www.ipfingerprints.com/reverseip.php",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "TCP/IP Utils - Domain Neighbors",
              "type": "url",
              "url": "https://dnslytics.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "MyIPNeighbors",
              "type": "url",
              "url": "http://www.my-ip-neighbors.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Protected by Cloud Services",
          "type": "folder",
          "children": [
            {
              "name": "CloudFlare Watch",
              "type": "url",
              "url": "http://www.crimeflare.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Wireless Network Info",
          "type": "folder",
          "children": [
            {
              "name": "WiGLE: Wireless Network Mapping",
              "type": "url",
              "url": "https://wigle.net/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "OpenCellid: Database of Cell Towers",
              "type": "url",
              "url": "https://opencellid.org/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Network Analysis Tools",
          "type": "folder",
          "children": [
            {
              "name": "Wireshark",
              "type": "url",
              "url": "https://www.wireshark.org/download.html",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "NetworkMiner",
              "type": "url",
              "url": "https://www.netresec.com/?page=Networkminer",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "NetworkTotal",
              "type": "url",
              "url": "https://www.networktotal.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "IP Loggers",
          "type": "folder",
          "children": [
            {
              "name": "Grabify",
              "type": "url",
              "url": "https://grabify.link",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "IP Logger",
              "type": "url",
              "url": "https://iplogger.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Images / Videos / Docs",
      "type": "folder",
      "children": [
        {
          "name": "Images",
          "type": "folder",
          "children": [
            {
              "name": "Search",
              "type": "folder",
              "children": [
                {
                  "name": "Google Images",
                  "type": "url",
                  "url": "https://images.google.com/?gws_rd=ssl",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Bing Images",
                  "type": "url",
                  "url": "http://www.bing.com/images",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "FaceCheck Facial Recognition Search",
                  "type": "url",
                  "url": "https://facecheck.id/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "TinEye Reverse Image Search",
                  "type": "url",
                  "url": "http://tineye.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "PimEyes Face Search Engine",
                  "type": "url",
                  "url": "https://pimeyes.com/en",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Yandex Images",
                  "type": "url",
                  "url": "https://www.yandex.com/images/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Baidu Images",
                  "type": "url",
                  "url": "http://shitu.baidu.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Imgur Search",
                  "type": "url",
                  "url": "https://imgur.com/search",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Photobucket",
                  "type": "url",
                  "url": "http://photobucket.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Karma Decay",
                  "type": "url",
                  "url": "http://karmadecay.com/",
                  "status": "error",
                  "checked": "2026-11-12"
                },
                {
                  "name": "7Photos.net",
                  "type": "url",
                  "url": "http://7photos.net/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Current Location",
                  "type": "url",
                  "url": "http://current-location.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Lakako Photo Search",
                  "type": "url",
                  "url": "http://www.lakako.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "CC Search",
                  "type": "url",
                  "url": "https://ccsearch.creativecommons.org/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "SmugMug Search",
                  "type": "url",
                  "url": "https://www.smugmug.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "ImageNet",
                  "type": "url",
                  "url": "http://image-net.org/",
                  "status": "error",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Places2",
                  "type": "url",
                  "url": "http://places2.csail.mit.edu/explore.html",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Image Identification Project",
                  "type": "url",
                  "url": "https://www.imageidentify.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "SauceNAO",
                  "type": "url",
                  "url": "https://saucenao.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Picarta",
                  "type": "url",
                  "url": "https://picarta.ai/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "FaceSeek Face Search Engine",
                  "type": "url",
                  "url": "https://faceseek.online",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Google Lens",
                  "type": "url",
                  "url": "https://lens.google.com/",
                  "description": "Reverse image and object search.",
                  "added": "2026-11",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "Instagram",
              "type": "folder",
              "children": [
                {
                  "name": "Instagram",
                  "type": "url",
                  "url": "https://www.instagram.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Imgrab",
                  "type": "url",
                  "url": "https://imgrab.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "Flickr",
              "type": "folder",
              "children": [
                {
                  "name": "Flickr",
                  "type": "url",
                  "url": "https://www.flickr.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Flickr Map",
                  "type": "url",
                  "url": "https://www.flickr.com/map/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "My Pics Map",
                  "type": "url",
                  "url": "http://www.mypicsmap.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Flickr Hive Mind",
                  "type": "url",
                  "url": "http://flickrhivemind.net/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "Metadata",
              "type": "folder",
              "children": [
                {
                  "name": "ExifEditor",
                  "type": "url",
                  "url": "https://exifeditor.io",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Jeffrey's Exif Viewer",
                  "type": "url",
                  "url": "http://exif.regex.info/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Search by Exif",
                  "type": "url",
                  "url": "http://www.exif-search.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "ImgOps",
                  "type": "url",
                  "url": "http://imgops.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Metapicz",
                  "type": "url",
                  "url": "http://metapicz.com/#landing",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "GeoSetter",
                  "type": "url",
                  "url": "http://www.geosetter.de/en/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "Forensics",
              "type": "folder",
              "children": [
                {
                  "name": "FotoForensics",
                  "type": "url",
                  "url": "http://fotoforensics.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Forensically",
                  "type": "url",
                  "url": "https://29a.ch/photo-forensics/",
                  "description": "In-browser error level analysis, clone detection, metadata.",
                  "added": "2026-11",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "InVID-WeVerify plugin",
                  "type": "url",
                  "url": "https://www.invid-project.eu/tools-and-services/invid-verification-plugin/",
                  "description": "Browser plugin for video and image verification: keyframes, reverse search, forensics.",
                  "added": "2026-11",
                  "status": "blocked",
                  "checked": "2026-11-12"
                },
                {
                  "name": "ExifTool",
                  "type": "url",
                  "url": "https://exiftool.org/",
                  "description": "The definitive metadata reader and writer.",
                  "added": "2026-11",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "OCR",
              "type": "folder",
              "children": [
                {
                  "name": "i2OCR",
                  "type": "url",
                  "url": "http://www.i2ocr.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "New OCR",
                  "type": "url",
                  "url": "https://www.newocr.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Online OCR",
                  "type": "url",
                  "url": "http://www.onlineocr.net/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            }
          ]
        },
        {
          "name": "Videos",
          "type": "folder",
          "children": [
            {
              "name": "Search",
              "type": "folder",
              "children": [
                {
                  "name": "Google Videos",
                  "type": "url",
                  "url": "https://www.google.com/videohp?gws_rd=ssl",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Bing Videos",
                  "type": "url",
                  "url": "http://www.bing.com/videos",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Vimeo Search",
                  "type": "url",
                  "url": "https://vimeo.com/search?",
                  "status": "blocked",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Internet Archive Videos",
                  "type": "url",
                  "url": "https://archive.org/details/opensource_movies",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Dogpile Web Search",
                  "type": "url",
                  "url": "http://www.dogpile.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Geo Search Tool",
                  "type": "url",
                  "url": "http://www.geosearchtool.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Yahoo Video Search",
                  "type": "url",
                  "url": "http://video.search.yahoo.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "Analyze / Record",
              "type": "folder",
              "children": [
                {
                  "name": "DetURL",
                  "type": "url",
                  "url": "http://deturl.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "YouTube Metadata",
                  "type": "url",
                  "url": "http://www.amnestyusa.org/citizenevidence/",
                  "status": "blocked",
                  "checked": "2026-11-12"
                },
                {
                  "name": "TubeChop",
                  "type": "url",
                  "url": "http://www.tubechop.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "YouTube Data Tools",
                  "type": "url",
                  "url": "https://ytdt.digitalmethods.net/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "yasiv-youtube",
                  "type": "url",
                  "url": "https://yasiv.com/youtube",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            }
          ]
        },
        {
          "name": "Webcams",
          "type": "folder",
          "children": [
            {
              "name": "Insecam",
              "type": "url",
              "url": "http://insecam.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "EarthCam",
              "type": "url",
              "url": "http://www.earthcam.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Documents",
          "type": "folder",
          "children": [
            {
              "name": "Search",
              "type": "folder",
              "children": [
                {
                  "name": "Scribd",
                  "type": "url",
                  "url": "https://www.scribd.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "WikiLeaks Search",
                  "type": "url",
                  "url": "https://search.wikileaks.org/advanced",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Leaked Cables",
                  "type": "url",
                  "url": "https://search.wikileaks.org/plusd/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "Paste Sites",
              "type": "folder",
              "children": [
                {
                  "name": "Just Paste It",
                  "type": "url",
                  "url": "https://justpaste.it/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            }
          ]
        },
        {
          "name": "Fonts",
          "type": "folder",
          "children": [
            {
              "name": "What The Font",
              "type": "url",
              "url": "https://www.myfonts.com/WhatTheFont/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Font Squirrel",
              "type": "url",
              "url": "https://www.fontsquirrel.com/matcherator",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "IdentiFont",
              "type": "url",
              "url": "http://www.identifont.com/index.html",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Font Spring",
              "type": "url",
              "url": "https://www.fontspring.com/matcherator",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "What Font Is",
              "type": "url",
              "url": "https://www.whatfontis.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Social Networks",
      "type": "folder",
      "children": [
        {
          "name": "Facebook",
          "type": "folder",
          "children": [
            {
              "name": "Search",
              "type": "folder",
              "children": [
                {
                  "name": "Recover FB Account",
                  "type": "url",
                  "url": "https://www.facebook.com/login/identify?ctx=recover",
                  "status": "blocked",
                  "checked": "2026-11-12"
                },
                {
                  "name": "FB Lookup ID",
                  "type": "url",
                  "url": "https://lookup-id.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "FB Identify (Requires Logout)",
                  "type": "url",
                  "url": "https://www.facebook.com/login/identify",
                  "status": "blocked",
                  "checked": "2026-11-12"
                }
              ]
            }
          ]
        },
        {
          "name": "Instagram",
          "type": "folder",
          "children": [
            {
              "name": "Inflact Instagram Viewer (Anonymous)",
              "type": "url",
              "url": "https://inflact.com/profiles/instagram-viewer/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Twitter",
          "type": "folder",
          "children": [
            {
              "name": "Search",
              "type": "folder",
              "children": [
                {
                  "name": "X Advanced Search",
                  "type": "url",
                  "url": "https://x.com/search-advanced",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "TweeterID",
                  "type": "url",
                  "url": "https://tweeterid.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "Analytics",
              "type": "folder",
              "children": [
                {
                  "name": "Profile",
                  "type": "folder",
                  "children": [
                    {
                      "name": "Tweepsect",
                      "type": "url",
                      "url": "http://tweepsect.com/",
                      "status": "ok",
                      "checked": "2026-11-12"
                    },
                    {
                      "name": "Twitonomy",
                      "type": "url",
                      "url": "http://www.twitonomy.com/",
                      "status": "ok",
                      "checked": "2026-11-12"
                    },
                    {
                      "name": "Foller.me Analytics",
                      "type": "url",
                      "url": "https://foller.me/",
                      "status": "ok",
                      "checked": "2026-11-12"
                    }
                  ]
                },
                {
                  "name": "Hashtag",
                  "type": "folder",
                  "children": [
                    {
                      "name": "RiteTag",
                      "type": "url",
                      "url": "https://ritetag.com/",
                      "status": "ok",
                      "checked": "2026-11-12"
                    },
                    {
                      "name": "TAGSExplorer",
                      "type": "url",
                      "url": "https://tags.hawksey.info/tagsexplorer/",
                      "status": "ok",
                      "checked": "2026-11-12"
                    }
                  ]
                }
              ]
            },
            {
              "name": "Location / Mapping",
              "type": "folder",
              "children": [
                {
                  "name": "GeoSocial Footprint",
                  "type": "url",
                  "url": "http://geosocialfootprint.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Fedica",
                  "type": "url",
                  "url": "https://fedica.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            }
          ]
        },
        {
          "name": "Reddit",
          "type": "folder",
          "children": [
            {
              "name": "Reddit Metis",
              "type": "url",
              "url": "https://redditmetis.com/#",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "subreddits",
              "type": "url",
              "url": "http://subreddits.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Reddit Comment History",
              "type": "url",
              "url": "https://roadtolarissa.com/javascript/reddit-comment-visualizer/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Tiktok",
          "type": "folder",
          "children": [
            {
              "name": "TikTok Viewer",
              "type": "url",
              "url": "https://urlebird.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Other Social Networks",
          "type": "folder",
          "children": [
            {
              "name": "Myspace",
              "type": "url",
              "url": "https://myspace.com/",
              "status": "error",
              "checked": "2026-11-12"
            },
            {
              "name": "TheHoodUp (NSFW)",
              "type": "url",
              "url": "http://thehoodup.com/board/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "MiGente (Latino)",
              "type": "url",
              "url": "http://www.migente.com/user_search/index.html",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Odnoklassniki",
              "type": "url",
              "url": "http://ok.ru/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "VK",
              "type": "url",
              "url": "https://vk.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "TikTok",
              "type": "url",
              "url": "https://www.tiktok.com/@{target}",
              "input": "username",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Bluesky profile",
              "type": "url",
              "url": "https://bsky.app/profile/{target}",
              "description": "Open a Bluesky handle (handle.bsky.social or custom domain).",
              "added": "2026-11",
              "input": "username",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Threads profile",
              "type": "url",
              "url": "https://www.threads.com/@{target}",
              "description": "Meta Threads profile.",
              "added": "2026-11",
              "input": "username",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Mastodon search",
              "type": "url",
              "url": "https://mastodon.social/search?q={target}",
              "description": "Search the fediverse from mastodon.social.",
              "added": "2026-11",
              "input": "any",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Search",
          "type": "folder",
          "children": [
            {
              "name": "Social Searcher",
              "type": "url",
              "url": "http://www.social-searcher.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "SocialBlade.com",
              "type": "url",
              "url": "http://socialblade.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "PinGroupie",
              "type": "url",
              "url": "http://pingroupie.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Google CSE for Telegram links",
              "type": "url",
              "url": "https://cse.google.com/cse?cx=006368593537057042503:efxu7xprihg",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Instant Messaging",
      "type": "folder",
      "children": [
        {
          "name": "Telegram",
          "type": "folder",
          "children": [
            {
              "name": "TGStat",
              "type": "url",
              "url": "https://tgstat.com/",
              "description": "Telegram channel and chat catalogue with stats and search.",
              "added": "2026-11",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Telemetr.io",
              "type": "url",
              "url": "https://telemetr.io/",
              "description": "Telegram channel analytics and post search.",
              "added": "2026-11",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "People Search Engines",
      "type": "folder",
      "children": [
        {
          "name": "General People Search",
          "type": "folder",
          "children": [
            {
              "name": "Family Tree Now",
              "type": "url",
              "url": "http://www.familytreenow.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "CyberBackgroundChecks",
              "type": "url",
              "url": "https://www.cyberbackgroundchecks.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "InfoFlow Public People Search In Chilean",
              "type": "url",
              "url": "https://infoflow.cloud/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "ThatsThem",
              "type": "url",
              "url": "https://thatsthem.com/name-address-search",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Zaba Search",
              "type": "url",
              "url": "http://www.zabasearch.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "USSearch.com",
              "type": "url",
              "url": "http://www.ussearch.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Advanced Background Checks",
              "type": "url",
              "url": "https://www.advancedbackgroundchecks.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "PeekYou",
              "type": "url",
              "url": "http://www.peekyou.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Wink People Search",
              "type": "url",
              "url": "http://itools.com/tool/wink-people-search",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Radaris",
              "type": "url",
              "url": "http://radaris.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Intelius",
              "type": "url",
              "url": "http://www.intelius.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "InfoSpace",
              "type": "url",
              "url": "http://infospace.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Webmii",
              "type": "url",
              "url": "http://webmii.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Snitch.name",
              "type": "url",
              "url": "http://snitch.name/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Yasni",
              "type": "url",
              "url": "http://www.yasni.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "findmypast.com",
              "type": "url",
              "url": "http://search.findmypast.com/search-world-records",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "FamilySearch.org",
              "type": "url",
              "url": "https://familysearch.org/search/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Ancestry.com",
              "type": "url",
              "url": "http://search.ancestry.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Nuwber",
              "type": "url",
              "url": "https://nuwber.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Genealogy.com",
              "type": "url",
              "url": "http://www.genealogy.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "My Life",
              "type": "url",
              "url": "https://www.mylife.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Addresses.com",
              "type": "url",
              "url": "http://www.addresses.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Sorted By Name",
              "type": "url",
              "url": "http://sortedbyname.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "True People Search",
              "type": "url",
              "url": "https://www.truepeoplesearch.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Fast People Search",
              "type": "url",
              "url": "https://www.fastpeoplesearch.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "IDCrawl",
              "type": "url",
              "url": "https://www.idcrawl.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Registries",
          "type": "folder",
          "children": [
            {
              "name": "The Knot",
              "type": "url",
              "url": "https://www.theknot.com/registry/couplesearch",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Registry Finder",
              "type": "url",
              "url": "https://www.registryfinder.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "My Registry",
              "type": "url",
              "url": "https://www.myregistry.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "The Bump",
              "type": "url",
              "url": "https://registry.thebump.com/babyregistrysearch",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Dating",
      "type": "folder",
      "children": [
        {
          "name": "Match.com",
          "type": "url",
          "url": "http://www.match.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "Plenty Of Fish.com",
          "type": "url",
          "url": "http://www.pof.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "eHarmony",
          "type": "url",
          "url": "http://www.eharmony.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Farmers Only",
          "type": "url",
          "url": "http://www.farmersonly.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Zoosk",
          "type": "url",
          "url": "https://www.zoosk.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "OkCupid",
          "type": "url",
          "url": "https://www.okcupid.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "Wamba.com",
          "type": "url",
          "url": "http://wamba.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "AdultFriendFinder",
          "type": "url",
          "url": "http://adultfriendfinder.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Ashley Madison",
          "type": "url",
          "url": "https://www.ashleymadison.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "Badoo",
          "type": "url",
          "url": "https://badoo.us/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Spark.com",
          "type": "url",
          "url": "https://www.spark.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Meetup",
          "type": "url",
          "url": "http://www.meetup.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "BlackPeopleMeet",
          "type": "url",
          "url": "http://www.blackpeoplemeet.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "Bumble",
          "type": "url",
          "url": "https://bumble.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Hinge",
          "type": "url",
          "url": "https://hinge.co/en-gb",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Telephone Numbers",
      "type": "folder",
      "children": [
        {
          "name": "Voicemail",
          "type": "folder",
          "children": [
            {
              "name": "Slydial",
              "type": "url",
              "url": "https://www.slydial.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "International",
          "type": "folder",
          "children": [
            {
              "name": "Numbering Plans",
              "type": "url",
              "url": "https://www.numberingplans.com/?page=analysis&sub=phonenr",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "411",
          "type": "url",
          "url": "http://www.411.com/reverse_phone",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "CallerID Test",
          "type": "url",
          "url": "http://www.calleridtest.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "ThatsThem - Reverse Phone Lookup",
          "type": "url",
          "url": "https://thatsthem.com/reverse-phone-lookup",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "Twilio Lookup",
          "type": "url",
          "url": "https://www.twilio.com/lookup",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Fone Finder",
          "type": "url",
          "url": "http://www.fonefinder.net/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "True Caller",
          "type": "url",
          "url": "http://www.truecaller.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "SpyDialer",
          "type": "url",
          "url": "http://www.spydialer.com/default.aspx",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "Phone Validator",
          "type": "url",
          "url": "http://www.phonevalidator.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Free Carrier Lookup",
          "type": "url",
          "url": "http://freecarrierlookup.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "OpenCNAM",
          "type": "url",
          "url": "https://www.opencnam.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "USPhoneBook",
          "type": "url",
          "url": "https://www.usphonebook.com",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "Family Tree Now (phone)",
          "type": "url",
          "url": "https://www.familytreenow.com/search/genealogy/results?phoneno={target}",
          "input": "phone",
          "status": "blocked",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Public Records",
      "type": "folder",
      "children": [
        {
          "name": "Property Records",
          "type": "folder",
          "children": [
            {
              "name": "Regrid (US Only)",
              "type": "url",
              "url": "https://app.regrid.com/us/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Zillow",
              "type": "url",
              "url": "http://www.zillow.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Homefacts",
              "type": "url",
              "url": "https://www.homefacts.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Neighbor Report",
              "type": "url",
              "url": "https://neighbor.report/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Redfin",
              "type": "url",
              "url": "https://www.redfin.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Court / Criminal Records",
          "type": "folder",
          "children": [
            {
              "name": "Nationwide County Court Records",
              "type": "url",
              "url": "http://www.blackbookonline.info/USA-County-Court-Records.aspx",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "World Legal Information Institute",
              "type": "url",
              "url": "http://worldlii.org/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Canadian Legal Information Institute",
              "type": "url",
              "url": "http://www.canlii.org/en/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Black Book Online - Criminal Search",
              "type": "url",
              "url": "http://www.blackbookonline.info/criminalsearch.aspx",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Familywatchdog - Sex Offender Search",
              "type": "url",
              "url": "http://www.familywatchdog.us/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Felon Spy",
              "type": "url",
              "url": "http://www.felonspy.com/search.html",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "The Inmate Locator",
              "type": "url",
              "url": "http://www.theinmatelocator.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Criminal Searches",
              "type": "url",
              "url": "http://www.criminalsearches.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "National Sex Offender Search",
              "type": "url",
              "url": "https://www.nsopw.gov/en/Search",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Mugshots.com",
              "type": "url",
              "url": "http://mugshots.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "judyrecords",
              "type": "url",
              "url": "https://www.judyrecords.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Caselaw Access Project",
              "type": "url",
              "url": "https://case.law/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "CourtListener",
              "type": "url",
              "url": "https://www.courtlistener.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Docket Alarm",
              "type": "url",
              "url": "https://www.docketalarm.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Scholar Case Law",
              "type": "url",
              "url": "https://scholar.google.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "PACER",
              "type": "url",
              "url": "https://pacer.uscourts.gov/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Free Law RECAP Archive",
              "type": "url",
              "url": "https://www.courtlistener.com/recap/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "UniCourt",
              "type": "url",
              "url": "https://unicourt.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Federal Inmate Locator",
              "type": "url",
              "url": "https://www.bop.gov/inmateloc/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Government Records",
          "type": "folder",
          "children": [
            {
              "name": "NC Salary DB",
              "type": "url",
              "url": "http://www.newsobserver.com/news/databases/state-pay/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "CA Salary DB",
              "type": "url",
              "url": "http://www.sacbee.com/site-services/databases/state-pay/article2642161.html",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Financial / Tax Resources",
          "type": "folder",
          "children": [
            {
              "name": "BIN Base",
              "type": "url",
              "url": "http://www.binbase.com/search.html",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "VAT Research",
              "type": "url",
              "url": "https://vat-search.eu/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "NETR Online",
              "type": "url",
              "url": "http://publicrecords.netronline.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Death Records",
          "type": "folder",
          "children": [
            {
              "name": "Find A Grave",
              "type": "url",
              "url": "http://www.findagrave.com/index.html",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "GraveInfo",
              "type": "url",
              "url": "http://www.graveinfo.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "US County Data",
          "type": "folder",
          "children": [
            {
              "name": "NACo County Explorer",
              "type": "url",
              "url": "http://explorer.naco.org/index.html",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "US Voter Records",
          "type": "folder",
          "children": [
            {
              "name": "Voter Records",
              "type": "url",
              "url": "https://voterrecords.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Voter Registration Data",
              "type": "url",
              "url": "http://www.blackbookonline.info/USA-Voter-Records.aspx",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Patent Records",
          "type": "folder",
          "children": [
            {
              "name": "US Patent Office Search",
              "type": "url",
              "url": "https://www.uspto.gov/patents/search",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Patent Search",
              "type": "url",
              "url": "https://www.google.com/advanced_patent_search",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "US Political Records",
          "type": "folder",
          "children": [
            {
              "name": "FollowTheMoney.org",
              "type": "url",
              "url": "http://www.followthemoney.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "OpenSecrets.org",
              "type": "url",
              "url": "http://www.opensecrets.org/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "US Federal Election Commission",
              "type": "url",
              "url": "http://www.fec.gov/finance/disclosure/norindsea.shtml",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Public Records?",
          "type": "url",
          "url": "http://publicrecords.searchsystems.net/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "The World Bank Open Data Catalog",
          "type": "url",
          "url": "http://datacatalog.worldbank.org/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "BRB Public Records",
          "type": "url",
          "url": "http://www.brbpub.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "GOVDATA - Das Datenportal für Deutschland (German)",
          "type": "url",
          "url": "https://www.govdata.de/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Open-Data-Portal München (German)",
          "type": "url",
          "url": "https://opendata.muenchen.de/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Searchable FCC ID Database",
          "type": "url",
          "url": "https://fccid.io/",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Business Records",
      "type": "folder",
      "children": [
        {
          "name": "Annual Reports",
          "type": "folder",
          "children": [
            {
              "name": "AnnualReports.com",
              "type": "url",
              "url": "http://www.annualreports.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Public Register Online",
              "type": "url",
              "url": "http://www.annualreportservice.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Public Register's Annual Report Service",
              "type": "url",
              "url": "http://www.prars.com/search/alpha/A",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "International Registries",
              "type": "url",
              "url": "https://www.gov.uk/government/publications/overseas-registries/overseas-registries",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "General Info & News",
          "type": "folder",
          "children": [
            {
              "name": "Corporation Wiki",
              "type": "url",
              "url": "http://www.corporationwiki.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Commercial Register - Worldwide",
              "type": "url",
              "url": "http://www.commercial-register.sg.ch/home/worldwide.html",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "SEC.gov - EDGAR",
              "type": "url",
              "url": "http://www.sec.gov/edgar.shtml",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "International White Pages",
              "type": "url",
              "url": "http://www.wayp.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "UK Companies",
              "type": "url",
              "url": "https://www.gov.uk/get-information-about-a-company",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Global EDGE Resource Directory",
              "type": "url",
              "url": "http://globaledge.msu.edu/global-resources",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Ripoff Report",
              "type": "url",
              "url": "http://www.ripoffreport.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Finance",
              "type": "url",
              "url": "https://www.google.com/finance",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Company Profiles",
          "type": "folder",
          "children": [
            {
              "name": "OpenCorporates",
              "type": "url",
              "url": "https://opencorporates.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Corporation Wiki",
              "type": "url",
              "url": "https://www.corporationwiki.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Kompass International",
              "type": "url",
              "url": "http://www.kompass.com/selectcountry/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Infobel",
              "type": "url",
              "url": "http://www.infobel.com/en/world/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "AIHIT",
              "type": "url",
              "url": "https://www.aihitdata.com/",
              "status": "error",
              "checked": "2026-11-12"
            },
            {
              "name": "Buzzfile",
              "type": "url",
              "url": "http://www.buzzfile.com/Home/Basic",
              "status": "error",
              "checked": "2026-11-12"
            },
            {
              "name": "LittleSis",
              "type": "url",
              "url": "http://littlesis.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Companies House",
              "type": "url",
              "url": "https://find-and-update.company-information.service.gov.uk/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Hoovers",
              "type": "url",
              "url": "http://www.hoovers.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Corporate Information",
              "type": "url",
              "url": "http://corporateinformation.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Company Data Rex (EU)",
              "type": "url",
              "url": "http://cdrex.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Europages",
              "type": "url",
              "url": "http://www.europages.co.uk/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Glassdoor Company Reviews",
              "type": "url",
              "url": "https://www.glassdoor.com/Reviews/index.htm",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Vault",
              "type": "url",
              "url": "http://www.vault.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Companies In The UK",
              "type": "url",
              "url": "https://www.companiesintheuk.co.uk/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "UK Companies list",
              "type": "url",
              "url": "https://www.companieslist.co.uk/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "UK Data",
              "type": "url",
              "url": "http://ukdata.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Manta Small Business Directory",
              "type": "url",
              "url": "https://www.manta.com/business-directory",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Crunchbase",
              "type": "url",
              "url": "https://www.crunchbase.com/#/home/index",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Employee Profiles & Resumes",
          "type": "folder",
          "children": [
            {
              "name": "RecruitEm",
              "type": "url",
              "url": "http://recruitin.net/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "LinkedIn",
              "type": "url",
              "url": "https://www.linkedin.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Indeed",
              "type": "url",
              "url": "http://www.indeed.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Additional Resources",
          "type": "folder",
          "children": [
            {
              "name": "RBA - Business Information Resources",
              "type": "url",
              "url": "http://www.rba.co.uk/sources/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "VAT Number Validation",
              "type": "url",
              "url": "http://ec.europa.eu/taxation_customs/vies/?locale=en",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Sanctions & Leaks",
          "type": "folder",
          "children": [
            {
              "name": "OpenSanctions",
              "type": "url",
              "url": "https://www.opensanctions.org/search/?q={target}",
              "description": "Sanctions, PEPs and persons of interest.",
              "added": "2026-11",
              "input": "name",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "OCCRP Aleph",
              "type": "url",
              "url": "https://aleph.occrp.org/",
              "description": "Investigative data: company registries, leaks, court records.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ICIJ Offshore Leaks",
              "type": "url",
              "url": "https://offshoreleaks.icij.org/search?q={target}",
              "description": "Panama, Paradise, Pandora Papers entities and officers.",
              "added": "2026-11",
              "input": "name",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "GLEIF LEI Search",
              "type": "url",
              "url": "https://search.gleif.org/",
              "description": "Legal entity identifiers and corporate ownership.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "OpenCorporates officers",
              "type": "url",
              "url": "https://opencorporates.com/officers?q={target}",
              "description": "Find company directors and officers by name.",
              "added": "2026-11",
              "input": "name",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Transportation",
      "type": "folder",
      "children": [
        {
          "name": "Vehicle Records",
          "type": "folder",
          "children": [
            {
              "name": "VIN Decoderz",
              "type": "url",
              "url": "http://www.vindecoderz.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "That's Them VIN Search",
              "type": "url",
              "url": "https://thatsthem.com/vin-search",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "TRAVIC - Public Transportation Tracking",
              "type": "url",
              "url": "https://mobility.portal.geops.io/world.geops.transit",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "MyAccident - traffic accident map",
              "type": "url",
              "url": "https://myaccident.org/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "NHTSA Vehicle API",
              "type": "url",
              "url": "https://vpic.nhtsa.dot.gov/api/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Air Traffic Records",
          "type": "folder",
          "children": [
            {
              "name": "FlightAware - Live Flight Tracker",
              "type": "url",
              "url": "http://flightaware.com/live/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Flightradar24.com",
              "type": "url",
              "url": "https://www.flightradar24.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "World Aeronautical Database",
              "type": "url",
              "url": "http://worldaerodata.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ADS-B Exchange",
              "type": "url",
              "url": "https://www.adsbexchange.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ADS-B.NL",
              "type": "url",
              "url": "https://www.ads-b.nl/index.php?pageno=9999",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Marine Records",
          "type": "folder",
          "children": [
            {
              "name": "Marine Traffic",
              "type": "url",
              "url": "http://www.marinetraffic.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Vessel Tracker",
              "type": "url",
              "url": "https://www.vesseltracker.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Ship AIS",
              "type": "url",
              "url": "https://shipais.uk/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "OpenSeaMap - The free nautical chart",
              "type": "url",
              "url": "http://www.openseamap.org",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Vessel Finder",
              "type": "url",
              "url": "https://www.vesselfinder.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Global Fishing Watch",
              "type": "url",
              "url": "https://globalfishingwatch.org/map",
              "description": "Vessel activity and AIS gap analysis.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Railway Records",
          "type": "folder",
          "children": [
            {
              "name": "Deutsche Bahn Open-Data-Portal (German)",
              "type": "url",
              "url": "http://data.deutschebahn.com/",
              "status": "error",
              "checked": "2026-11-12"
            },
            {
              "name": "OpenRailwayMap",
              "type": "url",
              "url": "https://www.openrailwaymap.org/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Transportation & Train Tracking",
          "type": "url",
          "url": "https://mobility.portal.geops.io/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Satellite Tracking",
          "type": "url",
          "url": "http://www.n2yo.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Track-Trace",
          "type": "url",
          "url": "http://www.track-trace.com/",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Geolocation Tools / Maps",
      "type": "folder",
      "children": [
        {
          "name": "Geolocation Tools",
          "type": "folder",
          "children": [
            {
              "name": "Astrometry",
              "type": "url",
              "url": "https://nova.astrometry.net/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "SunCalc",
              "type": "url",
              "url": "http://suncalc.net/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "SunCalc",
              "type": "url",
              "url": "http://suncalc.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Overpass Turbo",
              "type": "url",
              "url": "https://overpass-turbo.eu/",
              "description": "Query OpenStreetMap features: find every place matching a description.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Bellingcat OSM Search",
              "type": "url",
              "url": "https://osm-search.bellingcat.com/",
              "description": "Find locations where specific OSM features appear near each other.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "PeakVisor",
              "type": "url",
              "url": "https://peakvisor.com/",
              "description": "3D mountain identification, useful for matching skylines.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Coordinates",
          "type": "folder",
          "children": [
            {
              "name": "Military Grid Reference System Coordinates",
              "type": "url",
              "url": "https://dominoc925-pages.appspot.com/mapplets/cs_mgrs.html",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Batch Geocoding",
              "type": "url",
              "url": "https://www.doogal.co.uk/BatchGeocoding.php",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Batch Reverse Geocoding",
              "type": "url",
              "url": "https://www.doogal.co.uk/BatchReverseGeocoding.php",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Map Reporting Tools",
          "type": "folder",
          "children": [
            {
              "name": "BatchGeo",
              "type": "url",
              "url": "https://batchgeo.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Maps Streetview Player",
              "type": "url",
              "url": "http://brianfolts.com/driver/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ScribbleMaps",
              "type": "url",
              "url": "http://scribblemaps.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Mobile Coverage",
          "type": "folder",
          "children": [
            {
              "name": "OpenSignal",
              "type": "url",
              "url": "https://opensignal.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "AntennaSearch",
              "type": "url",
              "url": "http://www.antennasearch.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Google Maps",
          "type": "url",
          "url": "https://www.google.com/maps/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Bing Maps",
          "type": "url",
          "url": "http://www.bing.com/maps/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "HERE Maps",
          "type": "url",
          "url": "https://maps.here.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "Dual Maps",
          "type": "url",
          "url": "http://data.mashedworld.com/dualmaps/map.htm",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Instant Google Street View",
          "type": "url",
          "url": "http://www.instantstreetview.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Wikimapia",
          "type": "url",
          "url": "http://wikimapia.org/#lang=en&lat=40.078071&lon=-100.458984&z=5&m=b",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "OpenStreetMap",
          "type": "url",
          "url": "http://www.openstreetmap.org/#map=5/40.614/-100.679",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Zoom Earth",
          "type": "url",
          "url": "https://zoom.earth/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Historic Aerials",
          "type": "url",
          "url": "http://www.historicaerials.com/?javascript=&",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Google Earth Overlays",
          "type": "url",
          "url": "http://www.mgmaps.com/kml/#view",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Yandex.Maps",
          "type": "url",
          "url": "https://yandex.com/maps/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Google Earth",
          "type": "url",
          "url": "https://www.google.com/earth/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Baidu Maps",
          "type": "url",
          "url": "http://map.baidu.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Corona",
          "type": "url",
          "url": "http://corona.cast.uark.edu/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Daum (Korean)",
          "type": "url",
          "url": "https://map.kakao.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Naver (Korean)",
          "type": "url",
          "url": "http://map.naver.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "OpenStreetMap",
          "type": "url",
          "url": "http://www.openstreetmap.org/#map=5/51.500/-0.100",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "EarthExplorer",
          "type": "url",
          "url": "https://earthexplorer.usgs.gov/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "KartaView",
          "type": "url",
          "url": "https://kartaview.org/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Travel by Drone",
          "type": "url",
          "url": "http://travelbydrone.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Hivemapper",
          "type": "url",
          "url": "https://hivemapper.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "LandsatLook Viewer",
          "type": "url",
          "url": "https://landsatlook.usgs.gov/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Sentinel2Look Viewer",
          "type": "url",
          "url": "https://landsatlook.usgs.gov/sentinel2/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "NEXRAD Data Inventory Search",
          "type": "url",
          "url": "https://www.ncdc.noaa.gov/nexradinv/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "MapQuest",
          "type": "url",
          "url": "https://www.mapquest.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "OpenRailwayMap",
          "type": "url",
          "url": "http://www.openrailwaymap.org/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "OpenInfrastructureMap",
          "type": "url",
          "url": "https://openinframap.org/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "OpenStreetMap Routing Service",
          "type": "url",
          "url": "http://www.yournavigation.org/",
          "status": "error",
          "checked": "2026-11-12"
        },
        {
          "name": "Hiking & Biking Map",
          "type": "url",
          "url": "http://hikebikemap.org/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Wayback Imagery",
          "type": "url",
          "url": "https://livingatlas.arcgis.com/wayback/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Satellite Imagery",
          "type": "folder",
          "children": [
            {
              "name": "Copernicus Browser",
              "type": "url",
              "url": "https://browser.dataspace.copernicus.eu/",
              "description": "Free Sentinel satellite imagery with time slider.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "NASA FIRMS",
              "type": "url",
              "url": "https://firms.modaps.eosdis.nasa.gov/map/",
              "description": "Near-real-time fire and thermal anomaly map.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Search Engines",
      "type": "folder",
      "children": [
        {
          "name": "General Search",
          "type": "folder",
          "children": [
            {
              "name": "Google",
              "type": "url",
              "url": "https://www.google.com/?gws_rd=ssl",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Bing",
              "type": "url",
              "url": "http://www.bing.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "DuckDuckGo",
              "type": "url",
              "url": "https://duckduckgo.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "StartPage",
              "type": "url",
              "url": "https://www.startpage.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Yandex",
              "type": "url",
              "url": "https://www.yandex.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Baidu",
              "type": "url",
              "url": "http://www.baidu.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Advanced Search",
              "type": "url",
              "url": "https://www.google.com/advanced_search",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "iBoogie",
              "type": "url",
              "url": "http://www.iboogie.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "iZito",
              "type": "url",
              "url": "http://www.izito.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Bing vs. Google",
              "type": "url",
              "url": "http://bvsg.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Advangle",
              "type": "url",
              "url": "http://advangle.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Hulbee",
              "type": "url",
              "url": "https://hulbee.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Mojeek",
              "type": "url",
              "url": "https://mojeek.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Swisscows",
              "type": "url",
              "url": "https://swisscows.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Brave",
              "type": "url",
              "url": "https://search.brave.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Stract",
              "type": "url",
              "url": "https://stract.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Meta Search",
          "type": "folder",
          "children": [
            {
              "name": "eTools.ch",
              "type": "url",
              "url": "https://www.etools.ch/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "AnswerThePublic.com",
              "type": "url",
              "url": "http://answerthepublic.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Code Search",
          "type": "folder",
          "children": [
            {
              "name": "PublicWWW",
              "type": "url",
              "url": "https://publicwww.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Searchcode",
              "type": "url",
              "url": "https://searchcode.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "NerdyData",
              "type": "url",
              "url": "https://nerdydata.com/search",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "FTP Search",
          "type": "folder",
          "children": [
            {
              "name": "Napalm FTP",
              "type": "url",
              "url": "http://www.searchftps.net/",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Academic / Publication Search",
          "type": "folder",
          "children": [
            {
              "name": "PubPeer",
              "type": "url",
              "url": "https://pubpeer.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Bielefeld Academic Search Engine",
              "type": "url",
              "url": "https://www.base-search.net/Search/Advanced",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "PubMed - National Center for Biotechnology Information",
              "type": "url",
              "url": "https://pubmed.ncbi.nlm.nih.gov/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Social Science Research Network",
              "type": "url",
              "url": "http://ssrn.com/en/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Open Library",
              "type": "url",
              "url": "https://openlibrary.org/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "World Digital Library",
              "type": "url",
              "url": "https://www.wdl.org/en/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "HathiTrust Digital Library",
              "type": "url",
              "url": "https://www.hathitrust.org/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "UK National Archives",
              "type": "url",
              "url": "http://discovery.nationalarchives.gov.uk/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "OpenGrey EU Papers",
              "type": "url",
              "url": "http://opengrey.eu/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "US Gov Publishing Office - FDsys",
              "type": "url",
              "url": "https://www.govinfo.gov/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Science Direct",
              "type": "url",
              "url": "http://www.sciencedirect.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Think Tank Search",
              "type": "url",
              "url": "http://guides.library.harvard.edu/hks/think_tank_search",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Library Databases",
              "type": "url",
              "url": "http://guides.uflib.ufl.edu/az.php",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Copyscape Plagiarism Checker",
              "type": "url",
              "url": "http://copyscape.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Open Access Scholarly Journals",
              "type": "url",
              "url": "http://www.pagepress.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "The Open Syllabus Project",
              "type": "url",
              "url": "https://www.opensyllabus.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Science Publications",
              "type": "url",
              "url": "http://www.thescipub.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "arXiv.org",
              "type": "url",
              "url": "https://arxiv.org/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "News Search",
          "type": "folder",
          "children": [
            {
              "name": "Paperboy Online Newspapers",
              "type": "url",
              "url": "http://www.thepaperboy.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Google News Search",
              "type": "url",
              "url": "https://news.google.com/news/advanced_news_search?",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Flipboard",
              "type": "url",
              "url": "https://flipboard.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "YouGotTheNews",
              "type": "url",
              "url": "http://www.yougotthenews.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "NewspaperARCHIVE.com",
              "type": "url",
              "url": "http://newspaperarchive.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "PressReader.com",
              "type": "url",
              "url": "http://www.pressreader.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Newspaper Map",
              "type": "url",
              "url": "http://newspapermap.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "NewsBrief",
              "type": "url",
              "url": "https://media-monitor.europa.eu/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "AllYouCanRead.com",
              "type": "url",
              "url": "http://www.allyoucanread.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "World News",
              "type": "url",
              "url": "https://wn.com/#/search",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "NewsNow.co.uk",
              "type": "url",
              "url": "http://www.newsnow.co.uk/h/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Inshorts",
              "type": "url",
              "url": "https://www.inshorts.com/en/read",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Other Search",
          "type": "folder",
          "children": [
            {
              "name": "Colossus International Engine List",
              "type": "url",
              "url": "http://www.searchenginecolossus.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Zenodo",
              "type": "url",
              "url": "https://zenodo.org/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Search Tools",
          "type": "folder",
          "children": [
            {
              "name": "Million Short",
              "type": "url",
              "url": "https://millionshort.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Alerts",
              "type": "url",
              "url": "https://www.google.com/alerts#",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Custom Search Engine",
              "type": "url",
              "url": "https://cse.google.com/cse/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Talkwalker Alerts",
              "type": "url",
              "url": "http://www.talkwalker.com/alerts",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Trends",
              "type": "url",
              "url": "https://trends.google.com/trends/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Search Engine Guides",
          "type": "folder",
          "children": [
            {
              "name": "Google Hacking Database",
              "type": "url",
              "url": "https://www.exploit-db.com/google-hacking-database/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Search Operators Guide",
              "type": "url",
              "url": "http://googleguide.com/advanced_operators_reference.html",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Guide Cheat Sheet",
              "type": "url",
              "url": "http://googleguide.com/help/calculator.html",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Fact Checking",
          "type": "folder",
          "children": [
            {
              "name": "Africa Check",
              "type": "url",
              "url": "https://africacheck.org/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "PolitiFact",
              "type": "url",
              "url": "http://www.politifact.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "SciCheck",
              "type": "url",
              "url": "http://www.factcheck.org/scicheck/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Duke Reporters' Lab",
              "type": "url",
              "url": "http://reporterslab.org/fact-checking/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Stop Fake Tools",
              "type": "url",
              "url": "http://www.stopfake.org/en/category/tools/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Snopes",
              "type": "url",
              "url": "http://www.snopes.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Verification Handbook",
              "type": "url",
              "url": "http://verificationhandbook.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Verification Junkie",
              "type": "url",
              "url": "http://verificationjunkie.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Forums / Blogs / IRC",
      "type": "folder",
      "children": [
        {
          "name": "Forum Search Engines",
          "type": "folder",
          "children": [
            {
              "name": "BoardReader",
              "type": "url",
              "url": "http://boardreader.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Omgili",
              "type": "url",
              "url": "http://omgili.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Craigslist Forums",
              "type": "url",
              "url": "https://forums.craigslist.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Delphi Forum Search",
              "type": "url",
              "url": "http://www.delphiforums.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "IRC Search",
          "type": "folder",
          "children": [
            {
              "name": "Mibbit",
              "type": "url",
              "url": "http://search.mibbit.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Archives",
      "type": "folder",
      "children": [
        {
          "name": "Web",
          "type": "folder",
          "children": [
            {
              "name": "Internet Archive: Wayback Machine",
              "type": "url",
              "url": "https://web.archive.org/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "archive.today",
              "type": "url",
              "url": "https://archive.ph/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Cached View",
              "type": "url",
              "url": "http://cachedview.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Textfiles.com",
              "type": "url",
              "url": "http://textfiles.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "UK Web Archive",
              "type": "url",
              "url": "http://www.webarchive.org.uk/ukwa/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Common Crawl",
              "type": "url",
              "url": "http://commoncrawl.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Wayback Machine Chrome Extension",
              "type": "url",
              "url": "https://chrome.google.com/webstore/detail/wayback-machine/fpnmgdkabkmnadcjpehmlllkndpkmiak",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "PDF My URL",
              "type": "url",
              "url": "http://pdfmyurl.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Web Archive-RU",
              "type": "url",
              "url": "https://web-arhive.ru/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Ghostarchive",
              "type": "url",
              "url": "https://ghostarchive.org/",
              "description": "Web and video archive; good for preserving social posts.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "archive.today newest",
              "type": "url",
              "url": "https://archive.ph/newest/{target}",
              "description": "Latest archive.today snapshot of a URL.",
              "added": "2026-11",
              "input": "url",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Wayback Machine (all captures)",
              "type": "url",
              "url": "https://web.archive.org/web/*/{target}*",
              "description": "Every capture under a domain or URL.",
              "added": "2026-11",
              "input": "domain",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Data Leaks",
          "type": "folder",
          "children": [
            {
              "name": "Snusbase",
              "type": "url",
              "url": "https://snusbase.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Cryptome",
              "type": "url",
              "url": "http://cryptome.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "WikiLeaks",
              "type": "url",
              "url": "https://wikileaks.org/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Public Datasets",
          "type": "folder",
          "children": [
            {
              "name": "VisualGenome",
              "type": "url",
              "url": "http://visualgenome.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "UCI Spambase Data Set",
              "type": "url",
              "url": "https://archive.ics.uci.edu/ml/datasets/Spambase",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Stanford Large Network Dataset Collection",
              "type": "url",
              "url": "http://snap.stanford.edu/data/#amazon",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Other Media",
          "type": "folder",
          "children": [
            {
              "name": "Library of Congress: Digitized Newspapers - 1836-1922",
              "type": "url",
              "url": "http://chroniclingamerica.loc.gov/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Library of Congress: Newspaper Directory - 1690-Present",
              "type": "url",
              "url": "http://chroniclingamerica.loc.gov/search/titles/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "TV Closed Caption Search",
              "type": "url",
              "url": "https://archive.org/details/tv",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Language Translation",
      "type": "folder",
      "children": [
        {
          "name": "Text",
          "type": "folder",
          "children": [
            {
              "name": "DeepL Translator",
              "type": "url",
              "url": "https://www.deepl.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Translate",
              "type": "url",
              "url": "https://translate.google.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Google Input Tools",
              "type": "url",
              "url": "https://www.google.com/inputtools/try/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Bing Translate",
              "type": "url",
              "url": "http://www.bing.com/translator/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Word Reference",
              "type": "url",
              "url": "https://www.wordreference.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Wiktionary",
              "type": "url",
              "url": "https://www.wiktionary.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Slangit - The Slang Dictionary",
              "type": "url",
              "url": "https://slang.net/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Slang Dictionary & Translator",
              "type": "url",
              "url": "http://www.noslang.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Urban Dictionary",
              "type": "url",
              "url": "http://www.urbandictionary.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Videos",
          "type": "folder",
          "children": [
            {
              "name": "Eleven Labs Dubbing",
              "type": "url",
              "url": "https://elevenlabs.io/dubbing",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Mobile Emulation",
      "type": "folder",
      "children": [
        {
          "name": "Android",
          "type": "folder",
          "children": [
            {
              "name": "Emulation Tools",
              "type": "folder",
              "children": [
                {
                  "name": "Nox App Player",
                  "type": "url",
                  "url": "https://www.bignox.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "Terrorism",
      "type": "folder",
      "children": [
        {
          "name": "Global Terrorism Database",
          "type": "url",
          "url": "http://www.start.umd.edu/gtd/",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Dark Web",
      "type": "folder",
      "children": [
        {
          "name": "General Info",
          "type": "folder",
          "children": [
            {
              "name": "Reddit Deep Web",
              "type": "url",
              "url": "https://www.reddit.com/r/deepweb",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Reddit Onions",
              "type": "url",
              "url": "https://www.reddit.com/r/onions",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Reddit Darknet",
              "type": "url",
              "url": "https://www.reddit.com/r/darknet",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "TOR Search",
          "type": "folder",
          "children": [
            {
              "name": "Candle",
              "type": "url",
              "url": "http://gjobqjj7wyczbqie.onion/",
              "status": "tor",
              "checked": "2026-11-12"
            },
            {
              "name": "Not Evil",
              "type": "url",
              "url": "http://hss3uro2hsxfogfq.onion/",
              "status": "tor",
              "checked": "2026-11-12"
            },
            {
              "name": "Tor66",
              "type": "url",
              "url": "http://tor66sezptuu2nta.onion/",
              "status": "tor",
              "checked": "2026-11-12"
            },
            {
              "name": "dark.fail",
              "type": "url",
              "url": "http://darkfailllnkf4vf.onion/",
              "status": "tor",
              "checked": "2026-11-12"
            },
            {
              "name": "Ahmia",
              "type": "url",
              "url": "https://ahmia.fi/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "TOR Directories",
          "type": "folder",
          "children": [
            {
              "name": "Core.onion",
              "type": "url",
              "url": "http://eqt5g4fuenphqinx.onion/",
              "status": "tor",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "IACA Dark Web Investigation Support",
          "type": "url",
          "url": "https://iaca-darkweb-tools.com/",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Digital Currency",
      "type": "folder",
      "children": [
        {
          "name": "Bitcoin",
          "type": "folder",
          "children": [
            {
              "name": "OXT",
              "type": "url",
              "url": "https://oxt.me",
              "status": "error",
              "checked": "2026-11-12"
            },
            {
              "name": "Blockchain.info",
              "type": "url",
              "url": "https://blockchain.info/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Block Explorer",
              "type": "url",
              "url": "https://blockexplorer.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "BitRef",
              "type": "url",
              "url": "https://bitref.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Wallet Explorer",
              "type": "url",
              "url": "https://www.walletexplorer.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Graphsense",
              "type": "url",
              "url": "https://graphsense.info/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Blockonomics",
              "type": "url",
              "url": "https://www.blockonomics.co/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Bitcoin Who's Who",
              "type": "url",
              "url": "http://bitcoinwhoswho.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "mempool.space",
              "type": "url",
              "url": "https://mempool.space/address/{target}",
              "description": "Bitcoin explorer: address history and transactions.",
              "added": "2026-11",
              "input": "crypto",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Ethereum",
          "type": "folder",
          "children": [
            {
              "name": "etherchain.org",
              "type": "url",
              "url": "https://etherchain.org/accounts/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Etherscan",
              "type": "url",
              "url": "https://etherscan.io/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Monero",
          "type": "folder",
          "children": [
            {
              "name": "XMRChain.net",
              "type": "url",
              "url": "https://xmrchain.net/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Monero Blocks",
              "type": "url",
              "url": "http://moneroblocks.info/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Multi-chain",
          "type": "folder",
          "children": [
            {
              "name": "Blockchair",
              "type": "url",
              "url": "https://blockchair.com/search?q={target}",
              "description": "Search 40+ blockchains.",
              "added": "2026-11",
              "input": "crypto",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Arkham Intelligence",
              "type": "url",
              "url": "https://intel.arkm.com/",
              "description": "Entity attribution for blockchain addresses.",
              "added": "2026-11",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Chainabuse",
              "type": "url",
              "url": "https://www.chainabuse.com/address/{target}",
              "description": "Community reports of scam and fraud addresses.",
              "added": "2026-11",
              "input": "crypto",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Breadcrumbs",
              "type": "url",
              "url": "https://www.breadcrumbs.app/",
              "description": "Visual blockchain investigation.",
              "added": "2026-11",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Classifieds",
      "type": "folder",
      "children": [
        {
          "name": "Craigslist",
          "type": "url",
          "url": "http://craigslist.org/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Kijiji - Canada Classifieds",
          "type": "url",
          "url": "http://www.kijiji.ca/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Quikr - India Classifieds",
          "type": "url",
          "url": "http://www.quikr.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "eBay",
          "type": "url",
          "url": "http://www.ebay.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "OfferUp",
          "type": "url",
          "url": "https://offerup.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "Flippity",
          "type": "url",
          "url": "http://www.flippity.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "SearchAllJunk",
          "type": "url",
          "url": "http://www.searchalljunk.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "TotalCraigSearch",
          "type": "url",
          "url": "http://www.totalcraigsearch.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Search Tempest",
          "type": "url",
          "url": "http://www.searchtempest.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Oodle",
          "type": "url",
          "url": "http://www.oodle.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "Claz.org",
          "type": "url",
          "url": "http://claz.org/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "francais-a-londres.org - French Classifieds",
          "type": "url",
          "url": "https://francaisalondres.com/",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Encoding / Decoding",
      "type": "folder",
      "children": [
        {
          "name": "Barcodes / QR",
          "type": "folder",
          "children": [
            {
              "name": "ClearImage Barcode Reader",
              "type": "url",
              "url": "http://online-barcode-reader.inliteresearch.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Javascript",
          "type": "folder",
          "children": [
            {
              "name": "JS Beautifier",
              "type": "url",
              "url": "https://beautifier.io/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "JS NICE",
              "type": "url",
              "url": "http://jsnice.org/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Functions Online",
          "type": "url",
          "url": "https://www.functions-online.com/",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Tools",
      "type": "folder",
      "children": [
        {
          "name": "OSINT Automation",
          "type": "folder",
          "children": [
            {
              "name": "IntelligenceX",
              "type": "url",
              "url": "https://intelx.io/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Analyst Research Tools",
              "type": "url",
              "url": "https://analystresearchtools.com",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Wordlist",
          "type": "folder",
          "children": [
            {
              "name": "W Generator",
              "type": "url",
              "url": "https://app.wgen.io/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Overview",
          "type": "url",
          "url": "https://github.com/overview/overview-local",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "AI Tools",
      "type": "folder",
      "children": [
        {
          "name": "Duck.ai",
          "type": "url",
          "url": "https://duck.ai/",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Malicious File Analysis",
      "type": "folder",
      "children": [
        {
          "name": "Search",
          "type": "folder",
          "children": [
            {
              "name": "InQuest Labs DFI/MalDoc Search",
              "type": "url",
              "url": "https://labs.inquest.net/dfi",
              "status": "error",
              "checked": "2026-11-12"
            },
            {
              "name": "VirusShare.com",
              "type": "url",
              "url": "https://virusshare.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "VX Vault",
              "type": "url",
              "url": "http://vxvault.net/ViriList.php",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ID Ransomware",
              "type": "url",
              "url": "https://id-ransomware.malwarehunterteam.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "MalwareBazaar",
              "type": "url",
              "url": "https://bazaar.abuse.ch/browse/",
              "description": "Malware sample sharing by abuse.ch.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Triage",
              "type": "url",
              "url": "https://tria.ge/",
              "description": "Malware sandbox with public reports.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "ThreatFox",
              "type": "url",
              "url": "https://threatfox.abuse.ch/browse/",
              "description": "IOC sharing by abuse.ch.",
              "added": "2026-11",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Hosted Automated Analysis",
          "type": "folder",
          "children": [
            {
              "name": "Office Files",
              "type": "folder",
              "children": [
                {
                  "name": "TYLabs QuickSand Framework",
                  "type": "url",
                  "url": "https://scan.tylabs.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "JoeSandbox Document Analyzer",
                  "type": "url",
                  "url": "http://www.document-analyzer.net/",
                  "status": "blocked",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "Android",
              "type": "folder",
              "children": [
                {
                  "name": "Joe APK Analyzer",
                  "type": "url",
                  "url": "https://www.apk-analyzer.net/",
                  "status": "blocked",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "VirusTotal",
              "type": "url",
              "url": "https://www.virustotal.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "OPSWAT Meta Defender",
              "type": "url",
              "url": "https://metadefender.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Hybrid Analysis",
              "type": "url",
              "url": "https://www.hybrid-analysis.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Jotti's Malware Scanner",
              "type": "url",
              "url": "https://virusscan.jotti.org/en-US/scan-file",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "detux Linux Sandbox",
              "type": "url",
              "url": "https://detux.org/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Joe File Analyzer",
              "type": "url",
              "url": "https://www.file-analyzer.net/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Pikker.ee Cuckoo Sandbox",
              "type": "url",
              "url": "http://sandbox.pikker.ee/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Koodous",
              "type": "url",
              "url": "https://koodous.com",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Any Run",
              "type": "url",
              "url": "https://app.any.run/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Uncover It",
              "type": "url",
              "url": "https://www.uncoverit.org/",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "PCAPs",
          "type": "folder",
          "children": [
            {
              "name": "Malware-Traffic-Analysis.net",
              "type": "url",
              "url": "http://www.malware-traffic-analysis.net/index.html",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Malware Analysis Tools",
          "type": "url",
          "url": "http://malwareanalysis.tools/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "virustotal",
          "type": "url",
          "url": "https://www.virustotal.com/gui/home/upload",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Exploits & Advisories",
      "type": "folder",
      "children": [
        {
          "name": "Default Passwords",
          "type": "folder",
          "children": [
            {
              "name": "Default Passwords DB",
              "type": "url",
              "url": "https://cirt.net/passwords",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Default passwords list",
              "type": "url",
              "url": "https://default-password.info/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Default Password Lookup Utility",
              "type": "url",
              "url": "http://www.fortypoundhead.com/tools_dpw.asp",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Default Router Passwords",
              "type": "url",
              "url": "http://routerpasswords.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Open Sez Me Default Passwords",
              "type": "url",
              "url": "http://open-sez.me/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Vulert: Updated Open Source Vulnerability Database",
          "type": "url",
          "url": "https://vulertsecurity.com/vuln-db",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "MITRE ATT&CK",
          "type": "url",
          "url": "https://attack.mitre.org/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Exploit DB",
          "type": "url",
          "url": "https://www.exploit-db.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Packet Storm",
          "type": "url",
          "url": "https://packetstorm.news/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "NVD - NIST",
          "type": "url",
          "url": "https://nvd.nist.gov/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "OSV Vulnerability Library",
          "type": "url",
          "url": "https://osv.dev/list",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Mend Vulnerability Database",
          "type": "url",
          "url": "https://www.mend.io/vulnerability-database/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "CVE Details",
          "type": "url",
          "url": "http://www.cvedetails.com/",
          "status": "blocked",
          "checked": "2026-11-12"
        },
        {
          "name": "CVE Program",
          "type": "url",
          "url": "https://www.cve.org/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "OWASP",
          "type": "url",
          "url": "https://owasp.org/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Australian Cyber Security Centre",
          "type": "url",
          "url": "https://www.cyber.gov.au/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Canadian Centre for Cyber Security",
          "type": "url",
          "url": "https://cyber.gc.ca/",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Threat Intelligence",
      "type": "folder",
      "children": [
        {
          "name": "Phishing",
          "type": "folder",
          "children": [
            {
              "name": "SecAI.ai",
              "type": "url",
              "url": "https://secai.ai/research",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "https://openphish.com/feed.txt",
              "type": "url",
              "url": "https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "PhishTank",
              "type": "url",
              "url": "https://www.phishtank.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "PhishStats",
              "type": "url",
              "url": "https://phishstats.info/",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "IBM X-Force Exchange",
          "type": "url",
          "url": "https://exchange.xforce.ibmcloud.com/new",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Malware Information Sharing Platform",
          "type": "url",
          "url": "http://www.misp-project.org/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Malware Patrol",
          "type": "url",
          "url": "https://www.malwarepatrol.net/open-source.shtml",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "AlienVault OTX",
          "type": "url",
          "url": "https://otx.alienvault.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Maltiverse",
          "type": "url",
          "url": "https://maltiverse.com/start",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Malpedia",
          "type": "url",
          "url": "https://malpedia.caad.fkie.fraunhofer.de/library",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Project Honey Pot",
          "type": "url",
          "url": "http://www.projecthoneypot.org/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Bot Scout",
          "type": "url",
          "url": "http://botscout.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "HoneyDB",
          "type": "url",
          "url": "https://honeydb.io/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Pulsedive",
          "type": "url",
          "url": "https://pulsedive.com",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Mr.Looquer IOC Feed - 1st Dual Stack Threat Feed",
          "type": "url",
          "url": "https://iocfeed.mrlooquer.com",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "OpSec",
      "type": "folder",
      "children": [
        {
          "name": "Persona Creation",
          "type": "folder",
          "children": [
            {
              "name": "Fake Name Generator",
              "type": "url",
              "url": "http://www.fakenamegenerator.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "This Person Does Not Exist",
              "type": "url",
              "url": "https://thispersondoesnotexist.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Random User Generator",
              "type": "url",
              "url": "https://randomuser.me/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Pexels",
              "type": "url",
              "url": "https://www.pexels.com/",
              "status": "blocked",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Anonymous Browsing",
          "type": "folder",
          "children": [
            {
              "name": "Spoof User-Agent",
              "type": "folder",
              "children": [
                {
                  "name": "UserAgentString.com",
                  "type": "url",
                  "url": "http://www.useragentstring.com/pages/useragentstring.php",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "WhatIsMyBrowser.com",
                  "type": "url",
                  "url": "https://www.whatismybrowser.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "User Agent String Decoder",
                  "type": "url",
                  "url": "http://tools.tracemyip.org/user-agent-string-decoder/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "VPN Tests",
              "type": "folder",
              "children": [
                {
                  "name": "IP / DNS Leak Detection",
                  "type": "url",
                  "url": "https://ipleak.net/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "JonDonym",
                  "type": "url",
                  "url": "http://ip-check.info/?lang=en",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "DNS leak test",
                  "type": "url",
                  "url": "https://www.dnsleaktest.com/",
                  "status": "blocked",
                  "checked": "2026-11-12"
                },
                {
                  "name": "DNS Leak Tests",
                  "type": "url",
                  "url": "http://dnsleak.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "TorGuard",
                  "type": "url",
                  "url": "https://torguard.net/vpn-dns-leak-test.php",
                  "status": "blocked",
                  "checked": "2026-11-12"
                },
                {
                  "name": "IPv6 Leak Tests",
                  "type": "url",
                  "url": "http://ipv6leak.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Email Leak Tests",
                  "type": "url",
                  "url": "http://emailipleak.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Perfect Privacy",
                  "type": "url",
                  "url": "https://www.perfect-privacy.com/check-ip/",
                  "status": "blocked",
                  "checked": "2026-11-12"
                },
                {
                  "name": "WebRTC Leak Test",
                  "type": "url",
                  "url": "https://www.perfect-privacy.com/webrtc-leaktest/",
                  "status": "blocked",
                  "checked": "2026-11-12"
                },
                {
                  "name": "Trace My IP",
                  "type": "url",
                  "url": "http://www.tracemyip.org/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "Browser Tests",
              "type": "folder",
              "children": [
                {
                  "name": "Browser Statistics",
                  "type": "url",
                  "url": "https://www.w3schools.com/browsers/default.asp",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "WhatsMyBrowser.org",
                  "type": "url",
                  "url": "http://www.whatsmybrowser.org/",
                  "status": "ok",
                  "checked": "2026-11-12"
                },
                {
                  "name": "What browser am I using.co",
                  "type": "url",
                  "url": "http://www.whatbrowseramiusing.co/",
                  "status": "error",
                  "checked": "2026-11-12"
                },
                {
                  "name": "BrowserSpy.dk Browser Information",
                  "type": "url",
                  "url": "http://browserspy.dk/browser.php",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "Proxy Tests",
              "type": "folder",
              "children": [
                {
                  "name": "IP2Proxy",
                  "type": "url",
                  "url": "https://www.ip2proxy.com/",
                  "status": "ok",
                  "checked": "2026-11-12"
                }
              ]
            },
            {
              "name": "Browser Leaks",
              "type": "url",
              "url": "https://browserleaks.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "BrowserSpy.dk",
              "type": "url",
              "url": "http://browserspy.dk/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "LocaBrowser.com",
              "type": "url",
              "url": "http://www.locabrowser.com",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Privacy / Clean Up",
          "type": "folder",
          "children": [
            {
              "name": "Privacy Guides",
              "type": "url",
              "url": "https://www.privacyguides.org/en/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Just Delete Me",
              "type": "url",
              "url": "http://backgroundchecks.org/justdeleteme/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "OptOut Credit Prescreen",
              "type": "url",
              "url": "https://www.optoutprescreen.com/?rf=t",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Cover Your Tracks (EFF)",
              "type": "url",
              "url": "https://coveryourtracks.eff.org/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Intel Techniques - Hiding from the Internet",
              "type": "url",
              "url": "https://inteltechniques.com/data/workbook.pdf",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        }
      ]
    },
    {
      "name": "Documentation / Evidence Capture",
      "type": "folder",
      "children": [
        {
          "name": "Web Browsing",
          "type": "folder",
          "children": [
            {
              "name": "archive.today",
              "type": "url",
              "url": "https://archive.ph/",
              "status": "blocked",
              "checked": "2026-11-12"
            },
            {
              "name": "Web Page Saver",
              "type": "url",
              "url": "https://www.magnetforensics.com/free-tool-web-page-saver/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Map Locations",
          "type": "folder",
          "children": [
            {
              "name": "ZeeMaps",
              "type": "url",
              "url": "https://www.zeemaps.com/",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Timeline JS3",
          "type": "url",
          "url": "http://timeline.knightlab.com/",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    },
    {
      "name": "Training",
      "type": "folder",
      "children": [
        {
          "name": "Games",
          "type": "folder",
          "children": [
            {
              "name": "GeoGuesser",
              "type": "url",
              "url": "https://geoguessr.com/",
              "status": "ok",
              "checked": "2026-11-12"
            },
            {
              "name": "Verif!cation Quiz Bot",
              "type": "url",
              "url": "https://x.com/quiztime",
              "status": "ok",
              "checked": "2026-11-12"
            }
          ]
        },
        {
          "name": "Forensic OSINT KB Guides",
          "type": "url",
          "url": "https://www.forensicosint.com/osint-guide",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Open Source Intelligence Techniques",
          "type": "url",
          "url": "https://inteltechniques.com/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "SANS SEC497 Practical OSINT",
          "type": "url",
          "url": "https://www.sans.org/cyber-security-courses/practical-open-source-intelligence/",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Smart Questions",
          "type": "url",
          "url": "http://www.catb.org/esr/faqs/smart-questions.html",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "Bellingcat Online Investigation Toolkit",
          "type": "url",
          "url": "https://bellingcat.gitbook.io/toolkit",
          "description": "Maintained, annotated catalogue of investigation tools.",
          "added": "2026-11",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "OSINT Framework",
          "type": "url",
          "url": "https://osintframework.com/",
          "description": "The original tree-style OSINT resource map.",
          "added": "2026-11",
          "status": "ok",
          "checked": "2026-11-12"
        },
        {
          "name": "IntelTechniques Tools",
          "type": "url",
          "url": "https://inteltechniques.com/tools/",
          "description": "Michael Bazzell’s search tools and workbook resources.",
          "added": "2026-11",
          "status": "ok",
          "checked": "2026-11-12"
        }
      ]
    }
  ]
};
