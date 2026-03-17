let arfData = null;
let currentCategory = null;
let favorites = JSON.parse(localStorage.getItem('osint_favs')) || [];
let boardNotes = JSON.parse(localStorage.getItem('osint_notes')) || [];
let utilizedTools = [];
let editingNoteIndex = null;
let fuse = null;

document.addEventListener('DOMContentLoaded', () => {
    if (window.OSINT_DATA) {
        arfData = window.OSINT_DATA;
        initDashboard();
    }
});

function initDashboard() {
    initFuse();
    renderSidebarCategories();
    renderFavorites();
    renderBoard();
    setupNav();
    setupModal();
    setupToolLogger();
    setupOmniSearch();
    setupCaseManagement();
    setupDorkGenerator();
    setupKeyboardShortcuts();
    setupMobileNav();
    setupMobileBottomNav();
    fetchOpsecStatus();
    document.getElementById('purge-session-btn').onclick = purgeSession;
    showLandingPage(); // Show guide on start
}

function fetchOpsecStatus() {
    const ipLabel = document.getElementById('opsec-ip');
    const statusLabel = document.getElementById('opsec-status');
    
    // Using a free, CORS-friendly IP API
    fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
            ipLabel.textContent = data.ip;
            const isVpn = data.org.toLowerCase().includes('vpn') || 
                          data.org.toLowerCase().includes('proxy') || 
                          data.org.toLowerCase().includes('hosting') ||
                          data.org.toLowerCase().includes('google') ||
                          data.org.toLowerCase().includes('cloudflare');
            
            if (isVpn) {
                statusLabel.textContent = 'SECURE (VPN/PROXY)';
                statusLabel.style.color = '#10b981';
            } else {
                statusLabel.textContent = 'POTENTIAL LEAK (ISP)';
                statusLabel.style.color = '#ef4444';
            }
        })
        .catch(() => {
            ipLabel.textContent = 'OFFLINE/BLOCKED';
            statusLabel.textContent = 'ERROR VERIFYING';
        });
}

function setupKeyboardShortcuts() {
    document.onkeydown = (e) => {
        // Search: / or Ctrl+K
        if ((e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') || 
            (e.ctrlKey && e.key === 'k')) {
            e.preventDefault();
            const search = document.getElementById('omni-search');
            search.focus();
            search.select();
        }
        
        // Escape: Clear search or close modal
        if (e.key === 'Escape') {
            const search = document.getElementById('omni-search');
            if (search === document.activeElement) {
                search.value = '';
                search.dispatchEvent(new Event('input'));
                search.blur();
            }
            document.getElementById('note-modal').classList.add('hidden');
        }

        // Save note: Ctrl+Enter or Ctrl+S in modal
        if ((e.ctrlKey && e.key === 'Enter' || e.ctrlKey && e.key === 's') && !document.getElementById('note-modal').classList.contains('hidden')) {
            e.preventDefault();
            document.getElementById('save-note').click();
        }
    };
}

function purgeSession() {
    if (confirm('CRITICAL: THIS WILL PURGE ALL EVIDENCE, FAVORITES, AND CASE DATA PERMANENTLY. CONTINUE?')) {
        localStorage.clear();
        window.location.reload();
    }
}

function highlightMatches(text, matches, key) {
    if (!matches || !text) return text;
    const match = matches.find(m => m.key === key);
    if (!match) return text;

    let result = '';
    let lastIndex = 0;
    // Sort indices just in case
    const indices = [...match.indices].sort((a, b) => a[0] - b[0]);

    indices.forEach(([start, end]) => {
        result += text.slice(lastIndex, start);
        result += `<span style="background: rgba(16, 185, 129, 0.4); color: #fff; border-radius: 2px;">${text.slice(start, end + 1)}</span>`;
        lastIndex = end + 1;
    });
    result += text.slice(lastIndex);
    return result;
}

window.searchByTag = (tag) => {
    const search = document.getElementById('omni-search');
    search.value = tag;
    search.dispatchEvent(new Event('input'));
    document.getElementById('nav-dashboard').click();
};

function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            alert('Storage Quota Exceeded! Your evidence snapshots (Base64 images) are too large. Please export your case, clear notes, and start a new case.');
        } else {
            console.error('Error saving to localStorage', e);
        }
    }
}

function getProcessedUrl(url) {
    const target = document.getElementById('global-target').value.trim();
    if (!target) return url.replace('{target}', '');
    return url.replace(/{target}/g, encodeURIComponent(target));
}

function setupDorkGenerator() {
    const targetInput = document.getElementById('dork-target');
    const templateSelect = document.getElementById('dork-template');
    const engineSelect = document.getElementById('dork-engine');
    const resultDiv = document.getElementById('dork-result');
    const launchBtn = document.getElementById('launch-dork-btn');
    const copyBtn = document.getElementById('copy-dork-btn');

    const dorks = {
        docs: 'site:{target} filetype:pdf OR filetype:doc OR filetype:docx OR filetype:xls OR filetype:xlsx',
        login: 'site:{target} inurl:login OR inurl:signin OR intitle:login',
        config: 'site:{target} filetype:env OR filetype:conf OR filetype:config OR filetype:log OR filetype:bak',
        social: '"{target}" site:linkedin.com OR site:twitter.com OR site:facebook.com OR site:instagram.com',
        index: 'site:{target} intitle:"index of"',
        paste: '"{target}" site:pastebin.com OR site:ghostbin.com OR site:justpaste.it'
    };

    const engines = {
        google: 'https://www.google.com/search?q=',
        bing: 'https://www.bing.com/search?q=',
        duck: 'https://duckduckgo.com/?q='
    };

    const updateDork = () => {
        const target = targetInput.value.trim() || '[TARGET]';
        const template = dorks[templateSelect.value];
        const finalDork = template.replace(/{target}/g, target);
        resultDiv.textContent = finalDork;
    };

    targetInput.oninput = updateDork;
    templateSelect.onchange = updateDork;

    launchBtn.onclick = () => {
        const dork = resultDiv.textContent;
        const engine = engines[engineSelect.value];
        window.open(engine + encodeURIComponent(dork), '_blank');
    };

    copyBtn.onclick = () => {
        navigator.clipboard.writeText(resultDiv.textContent).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'COPIED';
            copyBtn.style.color = 'var(--accent)';
            copyBtn.style.borderColor = 'var(--accent)';
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.color = '';
                copyBtn.style.borderColor = '';
            }, 1500);
        });
    };
}

function initFuse() {
    const allTools = [];
    const collect = (n, p) => {
        if (n.children) {
            n.children.forEach(c => collect(c, [...p, n.name]));
        } else {
            allTools.push({ ...n, path: p.join(' / ') });
        }
    };
    arfData.children.forEach(cat => collect(cat, []));
    
    fuse = new Fuse(allTools, {
        keys: ['name', 'path', 'tags', 'description'],
        threshold: 0.3,
        distance: 100,
        includeMatches: true
    });
}

function setupCaseManagement() {
    document.getElementById('export-case-btn').onclick = () => {
        const caseData = {
            favorites: favorites,
            notes: boardNotes,
            analyst: document.getElementById('report-analyst-name').value,
            subject: document.getElementById('report-case-subject').value,
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(caseData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AZIMUTH_CASE_${new Date().getTime()}.json`;
        a.click();
    };

    document.getElementById('import-case-btn').onclick = () => {
        document.getElementById('import-case-input').click();
    };

    document.getElementById('import-case-input').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.favorites) {
                    favorites = data.favorites;
                    safeSetItem('osint_favs', JSON.stringify(favorites));
                }
                if (data.notes) {
                    boardNotes = data.notes;
                    safeSetItem('osint_notes', JSON.stringify(boardNotes));
                }
                if (data.analyst) document.getElementById('report-analyst-name').value = data.analyst;
                if (data.subject) document.getElementById('report-case-subject').value = data.subject;
                
                renderFavorites();
                renderBoard();
                alert('Case imported successfully.');
            } catch (err) {
                alert('Error importing case file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
}

function setupMobileBottomNav() {
    const mDash = document.getElementById('m-nav-dashboard');
    const mDorks = document.getElementById('m-nav-dorks');
    const mReg = document.getElementById('m-nav-registries');
    const mBoard = document.getElementById('m-nav-board');
    
    const dashLink = document.getElementById('nav-dashboard');
    const dorksLink = document.getElementById('nav-dorks');
    const boardLink = document.getElementById('nav-board');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const searchTrigger = document.getElementById('mobile-search-btn');

    const updateActiveMobileTab = (id) => {
        document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    };

    mDash.onclick = () => {
        dashLink.click();
        updateActiveMobileTab('m-nav-dashboard');
        window.scrollTo(0,0);
    };

    mDorks.onclick = () => {
        dorksLink.click();
        updateActiveMobileTab('m-nav-dorks');
        window.scrollTo(0,0);
    };

    mReg.onclick = () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        toggleBtn.classList.add('active');
        updateActiveMobileTab('m-nav-registries');
    };

    mBoard.onclick = () => {
        boardLink.click();
        updateActiveMobileTab('m-nav-board');
        window.scrollTo(0,0);
    };

    searchTrigger.onclick = () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        toggleBtn.classList.add('active');
        document.getElementById('omni-search').focus();
    };

    // FAB for mobile notes
    document.getElementById('mobile-add-note-btn').onclick = () => {
        document.getElementById('add-note-btn').click();
    };
}

function setupMobileNav() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    const toggleSidebar = () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        toggleBtn.classList.toggle('active');
    };

    toggleBtn.onclick = toggleSidebar;
    overlay.onclick = toggleSidebar;

    // Close sidebar when clicking any navigation link on mobile
    document.querySelectorAll('.nav-link, .nav-item').forEach(el => {
        el.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                toggleBtn.classList.remove('active');
            }
        });
    });
}

function showLandingPage() {
    const grid = document.getElementById('results-grid');
    grid.innerHTML = `
        <div class="guide-container" style="grid-column: 1/-1; padding: 2rem; max-width: 900px; margin: 0 auto; color: var(--text-main);">
            <div style="border-left: 4px solid var(--accent); padding-left: 2rem; margin-bottom: 4rem; background: linear-gradient(90deg, var(--accent-dim) 0%, transparent 100%); padding-top: 1.5rem; padding-bottom: 1.5rem; border-radius: 0 8px 8px 0;">
                <h2 style="font-size: 2.5rem; font-weight: 900; letter-spacing: 2px; margin-bottom: 0.5rem; color: #fff;">OPERATIONAL GUIDANCE</h2>
                <p style="color: var(--text-dim); font-family: 'Roboto Mono', monospace; font-size: 0.85rem; letter-spacing: 1px;">SYSTEM VERSION: AZIMUTH_IMS_v2.5 // SECURE_NODE</p>
            </div>

            <div class="guide-steps" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 3rem;">
                <div style="background: #050505; padding: 2rem; border-radius: 12px; border: 1px solid var(--border); transition: var(--transition);" onmouseover="this.style.borderColor='var(--accent)';" onmouseout="this.style.borderColor='var(--border)';">
                    <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 1.25rem; color: var(--accent); letter-spacing: 1px;">01 // ASSET DISCOVERY</h3>
                    <p style="font-size: 0.95rem; color: var(--text-dim); line-height: 1.7;">Use the <strong style="color: #fff;">REGISTRIES</strong> section in the sidebar to browse categorized intelligence nodes. For rapid discovery, use the <strong style="color: #fff;">OMNI-SEARCH</strong> bar to search all modules simultaneously with fuzzy-matching technology.</p>
                </div>
                <div style="background: #050505; padding: 2rem; border-radius: 12px; border: 1px solid var(--border); transition: var(--transition);" onmouseover="this.style.borderColor='var(--accent)';" onmouseout="this.style.borderColor='var(--border)';">
                    <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 1.25rem; color: var(--accent); letter-spacing: 1px;">02 // TARGET INJECTION</h3>
                    <p style="font-size: 0.95rem; color: var(--text-dim); line-height: 1.7;">Enter a <strong style="color: #fff;">GLOBAL TARGET</strong> (Username, IP, or Email) in the sidebar. Supported nodes will automatically inject this target into their search parameters upon launch, accelerating your workflow.</p>
                </div>
                <div style="background: #050505; padding: 2rem; border-radius: 12px; border: 1px solid var(--border); transition: var(--transition);" onmouseover="this.style.borderColor='var(--accent)';" onmouseout="this.style.borderColor='var(--border)';">
                    <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 1.25rem; color: var(--accent); letter-spacing: 1px;">03 // EVIDENCE CAPTURE</h3>
                    <p style="font-size: 0.95rem; color: var(--text-dim); line-height: 1.7;">Navigate to the <strong style="color: #fff;">REPORT BUILDER</strong> to log findings. Capture text and visual snapshots using the <strong style="color: #fff;">BASE64 SNAPSHOT</strong> system. You can paste screenshots directly into the evidence modal.</p>
                </div>
                <div style="background: #050505; padding: 2rem; border-radius: 12px; border: 1px solid var(--border); transition: var(--transition);" onmouseover="this.style.borderColor='var(--accent)';" onmouseout="this.style.borderColor='var(--border)';">
                    <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 1.25rem; color: var(--accent); letter-spacing: 1px;">04 // DOCUMENT COMPILATION</h3>
                    <p style="font-size: 0.95rem; color: var(--text-dim); line-height: 1.7;">Finalize your investigation by generating a <strong style="color: #fff;">FORMAL PDF REPORT</strong>. The system compiles your logs, utilized resources, and case identity into a standardized, professional intelligence document.</p>
                </div>
            </div>

            <div style="margin-top: 5rem; padding: 2rem; background: #050505; border: 1px solid var(--border); border-radius: 12px; text-align: center;">
                <p style="font-size: 0.8rem; color: var(--text-dim); font-family: 'Roboto Mono', monospace; letter-spacing: 2px;">[ STATUS: AWAITING INPUT // SELECT REGISTRY OR SEARCH ]</p>
            </div>
        </div>
    `;
}

function setupNav() {
    const dashLink = document.getElementById('nav-dashboard');
    const boardLink = document.getElementById('nav-board');
    const dorksLink = document.getElementById('nav-dorks');
    const toolsView = document.getElementById('view-tools');
    const boardView = document.getElementById('view-board');
    const dorksView = document.getElementById('view-dorks');
    const viewTitle = document.getElementById('current-view-name');

    dashLink.onclick = () => {
        toolsView.classList.remove('hidden');
        boardView.classList.add('hidden');
        dorksView.classList.add('hidden');
        dashLink.classList.add('active');
        boardLink.classList.remove('active');
        dorksLink.classList.remove('active');
        viewTitle.textContent = 'Dashboard';
        if (window.innerWidth <= 768) {
            document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
            document.getElementById('m-nav-dashboard').classList.add('active');
        }
        if (!currentCategory && !document.getElementById('omni-search').value) showLandingPage();
    };

    boardLink.onclick = () => {
        toolsView.classList.add('hidden');
        boardView.classList.remove('hidden');
        dorksView.classList.add('hidden');
        dashLink.classList.remove('active');
        boardLink.classList.add('active');
        dorksLink.classList.remove('active');
        viewTitle.textContent = 'Report Builder';
        if (window.innerWidth <= 768) {
            document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
            document.getElementById('m-nav-board').classList.add('active');
        }
    };

    dorksLink.onclick = () => {
        toolsView.classList.add('hidden');
        boardView.classList.add('hidden');
        dorksView.classList.remove('hidden');
        dashLink.classList.remove('active');
        boardLink.classList.remove('active');
        dorksLink.classList.add('active');
        viewTitle.textContent = 'Dork Generator';
    };

    document.getElementById('export-report-btn').onclick = generateReport;
    document.getElementById('clear-links-btn').onclick = () => {
        boardNotes = [];
        safeSetItem('osint_notes', JSON.stringify(boardNotes));
        renderBoard();
    };
}

function setupOmniSearch() {
    const omniInput = document.getElementById('omni-search');
    omniInput.oninput = (e) => {
        const query = e.target.value.toLowerCase().trim();
        const grid = document.getElementById('results-grid');
        
        if (!query) {
            if (currentCategory) renderTools();
            else showLandingPage();
            return;
        }

        const results = fuse.search(query);
        document.getElementById('nav-dashboard').click();
        
        grid.innerHTML = '';
        results.slice(0, 100).forEach(result => {
            const t = result.item;
            const matches = result.matches;
            const card = document.createElement('div');
            card.className = 'tool-card';
            const isFav = favorites.some(f => f.url === t.url);
            
            const highlightedName = highlightMatches(t.name.replace(' (M)', ''), matches, 'name');
            const highlightedPath = highlightMatches(t.path, matches, 'path');
            const highlightedDesc = t.description ? highlightMatches(t.description, matches, 'description') : '';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h3 style="color:#fff;">${highlightedName}</h3>
                    <div style="display:flex; gap: 8px;">
                        <span class="btn-copy-tiny" onclick="copyToClipboard(event, '${t.url}')">COPY</span>
                        <span onclick="toggleFav(event, ${JSON.stringify(t).replace(/"/g, '&quot;')})" style="cursor:pointer; color:${isFav?'#fff':'#444'}">★</span>
                    </div>
                </div>
                <p class="tool-path" style="color:#666; font-size:0.6rem;">${highlightedPath}</p>
                ${t.description ? `<p style="font-size:0.75rem; color:#aaa; margin-top:0.5rem; line-height:1.4;">${highlightedDesc}</p>` : ''}
                ${t.tags ? `<div style="display:flex; gap:5px; margin-top:0.5rem; flex-wrap:wrap;">${t.tags.map(tag => `<span class="clickable-tag" onclick="searchByTag('${tag}')" style="font-size:0.6rem; background:#222; padding:2px 5px; border-radius:3px; color:#10b981; cursor:pointer; border: 1px solid transparent;" onmouseover="this.style.borderColor='#10b981'" onmouseout="this.style.borderColor='transparent'">#${tag}</span>`).join('')}</div>` : ''}
                ${t.last_verified ? `<p style="font-size:0.6rem; color:#444; margin-top:0.5rem;">VERIFIED: ${t.last_verified}</p>` : ''}
                <a href="${getProcessedUrl(t.url)}" target="_blank" class="btn-launch">Launch Node</a>
            `;
            grid.appendChild(card);
        });

        if (results.length === 0) {
            grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:4rem; color:#444;">NO GLOBAL MATCHES FOR "${query.toUpperCase()}"</p>`;
        }
    };
}

function setupToolLogger() {
    const input = document.getElementById('utilized-tool-name');
    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim();
            if (val && !utilizedTools.includes(val)) {
                utilizedTools.push(val);
                renderToolTags();
                input.value = '';
            }
        }
    };
}

function renderToolTags() {
    const container = document.getElementById('utilized-tools-tags');
    container.innerHTML = utilizedTools.map((t, i) => `
        <div class="tool-tag">${t} <span class="tool-tag-remove" onclick="utilizedTools.splice(${i},1); renderToolTags();">&times;</span></div>
    `).join('');
}

function generateReport() {
    const timestamp = new Date().toLocaleString();
    const dateStr = new Date().toISOString().split('T')[0];
    const analyst = document.getElementById('report-analyst-name').value || 'ANALYST';
    const subject = document.getElementById('report-case-subject').value || 'GENERAL';
    let resourcesHtml = utilizedTools.map(t => `<li style="margin-bottom: 5px;">${t}</li>`).join('') || '<li>None</li>';
    let notesHtml = boardNotes.map((n, i) => `
        <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #ccc; background: #fff9c4; color: #1a1a1a; page-break-inside: avoid; border-radius: 4px;">
            <div style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px; font-size: 16px;">[RECORD #${i+1}] ${n.title}</div>
            ${n.image ? `<img src="${n.image}" style="width: 100%; max-height: 400px; object-fit: contain; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;">` : ''}
            <div style="font-size: 14px; line-height: 1.5; white-space: pre-wrap; font-family: monospace;">${n.text}</div>
        </div>
    `).join('') || '<p style="color: #666; font-style: italic;">No evidence records attached to this case.</p>';

    const reportElement = document.createElement('div');
    reportElement.style.padding = '40px';
    reportElement.style.fontFamily = 'Helvetica, Arial, sans-serif';
    reportElement.style.color = '#111';
    reportElement.style.lineHeight = '1.4';
    reportElement.style.backgroundColor = '#fff';
    
    reportElement.innerHTML = `
        <div style="border-bottom: 4px solid #111; padding-bottom: 15px; margin-bottom: 30px; display: flex; align-items: center; gap: 20px;">
            <div style="width: 60px; height: 60px; background: #111; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 24px; border-radius: 4px;">AZ</div>
            <div>
                <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">AZIMUTH</h1>
                <p style="margin: 0; font-size: 10px; color: #666; font-weight: bold; letter-spacing: 1px;">INTELLIGENCE MANAGEMENT SYSTEM</p>
            </div>
        </div>
        <div style="background: #f0f0f0; padding: 8px 12px; border-left: 5px solid #111; font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0; font-size: 14px;">I. CASE IDENTITY</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tr><td style="font-weight:bold; width: 150px; padding: 8px; border-bottom: 1px solid #eee; font-size: 13px;">ANALYST:</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 13px;">${analyst.toUpperCase()}</td></tr>
            <tr><td style="font-weight:bold; padding: 8px; border-bottom: 1px solid #eee; font-size: 13px;">SUBJECT:</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 13px;">${subject.toUpperCase()}</td></tr>
            <tr><td style="font-weight:bold; padding: 8px; border-bottom: 1px solid #eee; font-size: 13px;">TIMESTAMP:</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 13px;">${timestamp}</td></tr>
            <tr><td style="font-weight:bold; padding: 8px; border-bottom: 1px solid #eee; font-size: 13px;">REPORT ID:</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 13px; font-family: monospace;">AZ-${new Date().getTime()}</td></tr>
        </table>
        <div style="background: #f0f0f0; padding: 8px 12px; border-left: 5px solid #111; font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0; font-size: 14px;">II. UTILIZED RESOURCES</div>
        <ul style="font-size: 13px; font-family: monospace; color: #333; margin-bottom: 30px;">${resourcesHtml}</ul>
        <div style="background: #f0f0f0; padding: 8px 12px; border-left: 5px solid #111; font-weight: bold; text-transform: uppercase; margin: 20px 0 15px 0; font-size: 14px;">III. EVIDENCE LOG</div>
        ${notesHtml}
        <div style="margin-top:50px; border-top:1px solid #111; padding-top:10px; font-size:10px; text-align:center; color:#888; letter-spacing: 2px;">CONFIDENTIAL CASE FILE</div>
    `;

    const opt = {
        margin:       10,
        filename:     `AZIMUTH_REPORT_${subject.replace(/[^a-z0-9]/gi, '_').toUpperCase()}_${dateStr}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const btn = document.getElementById('export-report-btn');
    const originalText = btn.textContent;
    btn.textContent = 'GENERATING PDF...';
    btn.disabled = true;

    html2pdf().set(opt).from(reportElement).save().then(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    }).catch(err => {
        console.error('PDF Generation Error:', err);
        alert('Error generating PDF. Please check console.');
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

function renderSidebarCategories() {
    const list = document.getElementById('category-list');
    const mobileList = document.getElementById('mobile-category-list');
    list.innerHTML = '';
    mobileList.innerHTML = '';
    const sorted = [...arfData.children].sort((a, b) => a.name.localeCompare(b.name));
    
    sorted.forEach(cat => {
        // Desktop/Sidebar
        const div = document.createElement('div');
        div.className = 'nav-link';
        div.textContent = cat.name;
        div.onclick = () => {
            currentCategory = cat.name;
            document.querySelectorAll('#category-list .nav-link').forEach(el => el.classList.toggle('active', el.textContent === cat.name));
            document.querySelectorAll('.mobile-cat-item').forEach(el => el.classList.toggle('active', el.textContent === cat.name));
            document.getElementById('nav-dashboard').click();
            renderTools();
        };
        list.appendChild(div);

        // Mobile Scroller
        const mDiv = document.createElement('div');
        mDiv.className = 'mobile-cat-item';
        mDiv.textContent = cat.name;
        mDiv.onclick = () => {
            div.click();
            mDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        };
        mobileList.appendChild(mDiv);
    });
}

function renderFavorites() {
    const favList = document.getElementById('favorites-list');
    favList.innerHTML = favorites.length ? '' : '<span class="no-assets">None</span>';
    favorites.forEach(tool => {
        const div = document.createElement('div');
        div.className = 'nav-link';
        div.textContent = tool.name;
        div.onclick = () => window.open(getProcessedUrl(tool.url), '_blank');
        favList.appendChild(div);
    });
}

function renderTools() {
    const grid = document.getElementById('results-grid');
    if (!currentCategory) return;
    const cat = arfData.children.find(c => c.name === currentCategory);
    const tools = [];
    const collect = (n, p) => n.children ? n.children.forEach(c => collect(c, [...p, c.name])) : tools.push({ ...n, path: p.join(' / ') });
    collect(cat, [currentCategory]);
    
    grid.innerHTML = '';
    tools.forEach(t => {
        const card = document.createElement('div');
        card.className = 'tool-card';
        const isFav = favorites.some(f => f.url === t.url);
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h3>${t.name.replace(' (M)', '')}</h3>
                <div style="display:flex; gap: 8px;">
                    <span class="btn-copy-tiny" onclick="copyToClipboard(event, '${t.url}')">COPY</span>
                    <span onclick="toggleFav(event, ${JSON.stringify(t).replace(/"/g, '&quot;')})" style="cursor:pointer; color:${isFav?'#fff':'#444'}">★</span>
                </div>
            </div>
            <p class="tool-path">${t.path}</p>
            ${t.description ? `<p style="font-size:0.75rem; color:#aaa; margin-top:0.5rem; line-height:1.4;">${t.description}</p>` : ''}
            ${t.tags ? `<div style="display:flex; gap:5px; margin-top:0.5rem; flex-wrap:wrap;">${t.tags.map(tag => `<span class="clickable-tag" onclick="searchByTag('${tag}')" style="font-size:0.6rem; background:#222; padding:2px 5px; border-radius:3px; color:#10b981; cursor:pointer; border: 1px solid transparent;" onmouseover="this.style.borderColor='#10b981'" onmouseout="this.style.borderColor='transparent'">#${tag}</span>`).join('')}</div>` : ''}
            ${t.last_verified ? `<p style="font-size:0.6rem; color:#444; margin-top:0.5rem;">VERIFIED: ${t.last_verified}</p>` : ''}
            <a href="${getProcessedUrl(t.url)}" target="_blank" class="btn-launch">Launch Node</a>
        `;
        grid.appendChild(card);
    });
}

window.toggleFav = (e, tool) => {
    e.stopPropagation();
    const idx = favorites.findIndex(f => f.url === tool.url);
    idx > -1 ? favorites.splice(idx, 1) : favorites.push(tool);
    safeSetItem('osint_favs', JSON.stringify(favorites));
    renderFavorites();
    const omniVal = document.getElementById('omni-search').value;
    if (omniVal) document.getElementById('omni-search').dispatchEvent(new Event('input'));
    else renderTools();
};

window.copyToClipboard = (e, url) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
        const btn = e.target;
        const originalText = btn.textContent;
        btn.textContent = 'COPIED';
        btn.style.color = '#10b981';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '';
        }, 1500);
    });
};

function renderBoard() {
    const board = document.getElementById('pin-board');
    board.innerHTML = '';
    boardNotes.forEach((n, i) => {
        const div = document.createElement('div');
        div.className = 'sticky-note';
        div.innerHTML = `
            <h4>${n.title}</h4>
            ${n.image ? `<img src="${n.image}" class="note-img" onerror="this.style.display='none'">` : ''}
            <p>${n.text}</p>
            <div class="note-actions">
                <button class="btn-note-icon" onclick="editNote(${i})">✎</button>
                <button class="btn-note-icon" onclick="boardNotes.splice(${i},1); safeSetItem('osint_notes', JSON.stringify(boardNotes)); renderBoard();">🗑</button>
            </div>
        `;
        board.appendChild(div);
    });
}

function setupModal() {
    const modal = document.getElementById('note-modal');
    const previewContainer = document.getElementById('snapshot-preview-container');
    const previewImg = document.getElementById('snapshot-preview');
    const imageInput = document.getElementById('note-image');
    const fileInput = document.getElementById('note-image-file');
    const uploadBtn = document.getElementById('upload-snapshot-btn');
    const removeBtn = document.getElementById('remove-snapshot-btn');

    const showPreview = (src) => {
        previewImg.src = src;
        previewContainer.style.display = 'block';
        imageInput.value = src.startsWith('data:') ? '[BASE64 SNAPSHOT]' : src;
    };

    const handleFile = (file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => showPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    document.getElementById('add-note-btn').onclick = () => {
        editingNoteIndex = null;
        document.getElementById('modal-title').textContent = 'LOG EVIDENCE';
        document.getElementById('note-title').value = '';
        document.getElementById('note-text').value = '';
        imageInput.value = '';
        previewContainer.style.display = 'none';
        modal.classList.remove('hidden');
    };

    uploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = (e) => e.target.files[0] && handleFile(e.target.files[0]);
    removeBtn.onclick = () => {
        previewContainer.style.display = 'none';
        previewImg.src = '';
        imageInput.value = '';
    };

    // Paste handling
    modal.onpaste = (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let item of items) {
            if (item.kind === 'file') handleFile(item.getAsFile());
        }
    };

    document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
    document.getElementById('save-note').onclick = () => {
        const title = document.getElementById('note-title').value;
        const text = document.getElementById('note-text').value;
        const image = previewImg.src.startsWith('data:') ? previewImg.src : imageInput.value;
        
        if (!title || !text) return;
        const noteObj = { title, text, image };
        editingNoteIndex !== null ? (boardNotes[editingNoteIndex] = noteObj) : boardNotes.push(noteObj);
        safeSetItem('osint_notes', JSON.stringify(boardNotes));
        renderBoard();
        modal.classList.add('hidden');
    };
}

window.editNote = (i) => {
    editingNoteIndex = i;
    const n = boardNotes[i];
    document.getElementById('modal-title').textContent = 'EDIT EVIDENCE';
    document.getElementById('note-title').value = n.title;
    document.getElementById('note-text').value = n.text;
    
    const previewContainer = document.getElementById('snapshot-preview-container');
    const previewImg = document.getElementById('snapshot-preview');
    const imageInput = document.getElementById('note-image');

    if (n.image) {
        previewImg.src = n.image;
        previewContainer.style.display = 'block';
        imageInput.value = n.image.startsWith('data:') ? '[BASE64 SNAPSHOT]' : n.image;
    } else {
        previewContainer.style.display = 'none';
        imageInput.value = '';
    }
    
    document.getElementById('note-modal').classList.remove('hidden');
};
