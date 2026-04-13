# 📡 AZIMUTH | Intelligence Management System (IMS)

[![Status](https://img.shields.io/badge/Status-Operational-10b981?style=flat-square&logo=statuspage)](https://cijamie.github.io/Azimuth/)
[![Version](https://img.shields.io/badge/Version-2.5.0-white?style=flat-square&logo=github)](https://github.com/cijamie/azimuth/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](https://github.com/cijamie/azimuth/blob/542581d7a39efb56eab3588420be44bf0b6a4d7a/LICENSE.txt)

**AZIMUTH** is a high-performance, browser-based Intelligence Management System (IMS) designed for rapid OSINT discovery, evidence logging, and automated reporting. It provides a centralized, enterprise-grade interface for intelligence analysts to navigate complex registries and compile findings into standardized documentation.

---

## ⚡ Core Capabilities

### 1. Unified Intelligence Registry
Access a recursive, hierarchical database of OSINT tools and resources. From **Username Search Engines** and **IP Geolocation** to **Dark Web Links** and **Forensic Metadata** tools, everything is organized for split-second retrieval.

### 2. OMNI-SEARCH (Recursive Discovery)
The custom-built search engine doesn't just match names—it crawls the entire registry tree. Instantly find tools for "Email Verification" or "Satellite Imagery" even if they are buried four folders deep.

### 3. Case Evidence Pin-Board
A dedicated **Report Builder** workspace using a persistent "Sticky Note" metaphor. Log text intelligence, attach visual evidence, and track utilized resources in real-time. Data persists across sessions via encrypted local storage.

### 4. Automated PDF Compiler
Generate formal investigation reports with a single click. The system compiles:
- **Analyst Metadata** (Identity & Case Subject)
- **Log Resources** (Audit trail of tools used)
- **Intelligence Findings** (Evidence cards with images and timestamps)

---

## 🛠️ Technical Architecture

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Engine** | Vanilla JavaScript (ES6+) | Zero-dependency core logic for maximum speed and portability. |
| **UI/UX** | CSS3 Grid & Flexbox | Modern "Enterprise-Theme" with a responsive, high-contrast dark mode. |
| **Storage** | Browser LocalStorage | Secure, client-side persistence for favorites and evidence logs. |
| **PDF Engine** | html2pdf.js | Client-side DOM-to-PDF generation for report compilation. |
| **Data Structure** | Recursive JSON Object | Flexible, tree-based registry for easy expansion and updates. |

---

## 📂 Project Structure

```text
C:\Users\jamie\Desktop\Azimuth\
├── index.html          # Core Application Entry Point
├── 404.html            # Themed "Connection Terminated" Error Page
├── logo.png            # Brand Identity Asset
├── css/
│   └── arf.css         # Enterprise-Theme Design System
└── js/
    ├── arf.js          # Core Controller & Event Logic
    ├── data.js         # Intelligence Registry Database (JSON)
    ├── d3.v3.min.js    # Visualization Support Library
    └── html2pdf.js     # PDF Generation Library (External CDN)
```

---

## ⚖️ Disclaimer

**AZIMUTH is intended for ethical research, security auditing, and professional intelligence gathering only.** The developers assume no liability and are not responsible for any misuse or damage caused by this program. Users are responsible for complying with all local, state, and federal laws regarding digital privacy and data collection.
 
---

<p align="center">
  <i>Developed for Rapid Discovery & Secure Intelligence Management.</i><br>
  <b>[ CONNECTION SECURE // END OF FILE ]</b>
</p>
