let arfData = null;
let currentCategory = null;
let favorites = JSON.parse(localStorage.getItem('osint_favs')) || [];
let boardNotes = JSON.parse(localStorage.getItem('osint_notes')) || [];
let utilizedTools = [];
let editingNoteIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    if (window.OSINT_DATA) {
        arfData = window.OSINT_DATA;
        initDashboard();
    }
});

function initDashboard() {
    renderSidebarCategories();
    renderFavorites();
    renderBoard();
    setupNav();
    setupModal();
    setupToolLogger();
    setupOmniSearch();
    setupMobileNav();
    showLandingPage(); // Show guide on start
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
        <div class="guide-container" style="grid-column: 1/-1; padding: 2rem; max-width: 800px; margin: 0 auto; color: #f8fafc;">
            <div style="border-left: 4px solid #fff; padding-left: 1.5rem; margin-bottom: 3rem;">
                <h2 style="font-size: 2rem; font-weight: 800; letter-spacing: 1px; margin-bottom: 0.5rem;">OPERATIONAL GUIDANCE</h2>
                <p style="color: #888; font-family: monospace; font-size: 0.8rem;">SYSTEM VERSION: AZIMUTH_IMS_v2.4</p>
            </div>

            <div class="guide-steps">
                <div>
                    <h3 style="font-size: 0.9rem; font-weight: 800; margin-bottom: 1rem; color: #fff;">01 // ASSET DISCOVERY</h3>
                    <p style="font-size: 0.85rem; color: #aaa; line-height: 1.6;">Use the <strong>REGISTRIES</strong> section in the sidebar to browse categorized intelligence nodes. For rapid discovery, use the <strong>OMNI-SEARCH</strong> bar to search all modules simultaneously.</p>
                </div>
                <div>
                    <h3 style="font-size: 0.9rem; font-weight: 800; margin-bottom: 1rem; color: #fff;">02 // OPERATIONAL PRIORITY</h3>
                    <p style="font-size: 0.85rem; color: #aaa; line-height: 1.6;">Click the <strong>STAR (★)</strong> icon on any registry node to prioritize it. Prioritized assets are pinned to the top of your sidebar for instant deployment across sessions.</p>
                </div>
                <div>
                    <h3 style="font-size: 0.9rem; font-weight: 800; margin-bottom: 1rem; color: #fff;">03 // EVIDENCE LOGGING</h3>
                    <p style="font-size: 0.85rem; color: #aaa; line-height: 1.6;">Navigate to the <strong>REPORT BUILDER</strong> to log findings. Capture text and visual intelligence using the <strong>NEW EVIDENCE</strong> system. Records are stored locally and encrypted in transit.</p>
                </div>
                <div>
                    <h3 style="font-size: 0.9rem; font-weight: 800; margin-bottom: 1rem; color: #fff;">04 // DOCUMENT COMPILATION</h3>
                    <p style="font-size: 0.85rem; color: #aaa; line-height: 1.6;">Finalize your investigation by generating a <strong>FORMAL PDF REPORT</strong>. The system will compile your logs, utilized resources, and case identity into a standardized document.</p>
                </div>
            </div>

            <div style="margin-top: 4rem; padding: 1.5rem; background: #111; border: 1px solid #1a1a1a; border-radius: 4px;">
                <p style="font-size: 0.75rem; color: #666; text-align: center; font-family: monospace;">SELECT A REGISTRY TO BEGIN DATA RETRIEVAL</p>
            </div>
        </div>
    `;
}

function setupNav() {
    const dashLink = document.getElementById('nav-dashboard');
    const boardLink = document.getElementById('nav-board');
    const toolsView = document.getElementById('view-tools');
    const boardView = document.getElementById('view-board');
    const viewTitle = document.getElementById('current-view-name');

    dashLink.onclick = () => {
        toolsView.classList.remove('hidden');
        boardView.classList.add('hidden');
        dashLink.classList.add('active');
        boardLink.classList.remove('active');
        viewTitle.textContent = 'Dashboard';
        if (!currentCategory && !document.getElementById('omni-search').value) showLandingPage();
    };

    boardLink.onclick = () => {
        toolsView.classList.add('hidden');
        boardView.classList.remove('hidden');
        dashLink.classList.remove('active');
        boardLink.classList.add('active');
        viewTitle.textContent = 'Report Builder';
    };

    document.getElementById('export-report-btn').onclick = generateReport;
    document.getElementById('clear-links-btn').onclick = () => {
        boardNotes = [];
        localStorage.setItem('osint_notes', JSON.stringify(boardNotes));
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

        const matches = [];
        const searchAll = (n, p) => {
            if (n.children) n.children.forEach(c => searchAll(c, [...p, c.name]));
            else if (n.name.toLowerCase().includes(query)) matches.push({ ...n, path: p.join(' / ') });
        };

        arfData.children.forEach(cat => searchAll(cat, [cat.name]));
        document.getElementById('nav-dashboard').click();
        
        grid.innerHTML = '';
        matches.slice(0, 100).forEach(t => {
            const card = document.createElement('div');
            card.className = 'tool-card';
            const isFav = favorites.some(f => f.url === t.url);
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h3 style="color:#fff;">${t.name.replace(' (M)', '')}</h3>
                    <div style="display:flex; gap: 8px;">
                        <span class="btn-copy-tiny" onclick="copyToClipboard(event, '${t.url}')">COPY</span>
                        <span onclick="toggleFav(event, ${JSON.stringify(t).replace(/"/g, '&quot;')})" style="cursor:pointer; color:${isFav?'#fff':'#444'}">★</span>
                    </div>
                </div>
                <p class="tool-path" style="color:#666; font-size:0.6rem;">${t.path}</p>
                <a href="${t.url}" target="_blank" class="btn-launch">Launch Node</a>
            `;
            grid.appendChild(card);
        });

        if (matches.length === 0) {
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
    const reportWindow = window.open('', '_blank', 'width=900,height=800');
    let resourcesHtml = utilizedTools.map(t => `<li>${t}</li>`).join('') || '<li>None</li>';
    let notesHtml = boardNotes.map((n, i) => `
        <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #ccc; background: #fff9c4; color: #1a1a1a; page-break-inside: avoid;">
            <div style="font-weight: bold; border-bottom: 1px solid #ddd; margin-bottom: 10px; font-size: 16px;">[RECORD #${i+1}] ${n.title}</div>
            ${n.image ? `<img src="${n.image}" style="width: 100%; max-height: 300px; object-fit: contain; margin-bottom: 15px; border: 1px solid #ddd;">` : ''}
            <div style="font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${n.text}</div>
        </div>
    `).join('') || '<p>No evidence records.</p>';

    reportWindow.document.write(`
        <html><head><title>AZIMUTH REPORT</title><style>
            body { font-family: -apple-system, sans-serif; padding: 40px; color: #111; line-height: 1.4; }
            .header { border-bottom: 4px solid #111; padding-bottom: 15px; margin-bottom: 30px; display: flex; align-items: center; gap: 20px; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .meta-table td { padding: 8px; border-bottom: 1px solid #eee; font-size: 13px; }
            .section-title { background: #f0f0f0; padding: 8px; border-left: 5px solid #111; font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0; }
        </style></head><body>
            <div class="header"><img src="logo.png" style="width: 60px;"><div><h1>AZIMUTH</h1><p style="margin:0; font-size:10px; color:#666; font-weight:bold;">INTELLIGENCE MANAGEMENT SYSTEM</p></div></div>
            <div class="section-title">I. CASE IDENTITY</div>
            <table class="meta-table">
                <tr><td style="font-weight:bold; width: 150px;">ANALYST:</td><td>${analyst.toUpperCase()}</td></tr>
                <tr><td style="font-weight:bold;">SUBJECT:</td><td>${subject.toUpperCase()}</td></tr>
                <tr><td style="font-weight:bold;">TIMESTAMP:</td><td>${timestamp}</td></tr>
                <tr><td style="font-weight:bold;">REPORT ID:</td><td>AZ-${new Date().getTime()}</td></tr>
            </table>
            <div class="section-title">II. UTILIZED RESOURCES</div>
            <ul style="font-size: 13px;">${resourcesHtml}</ul>
            <div class="section-title">III. EVIDENCE LOG</div>
            ${notesHtml}
            <div style="margin-top:50px; border-top:1px solid #111; padding-top:10px; font-size:10px; text-align:center; color:#888;">CONFIDENTIAL CASE FILE</div>
            <script>window.onload = function() { setTimeout(() => { window.print(); }, 1000); };</script>
        </body></html>
    `);
    reportWindow.document.close();
}

function renderSidebarCategories() {
    const list = document.getElementById('category-list');
    list.innerHTML = '';
    const sorted = [...arfData.children].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'nav-link';
        div.textContent = cat.name;
        div.onclick = () => {
            currentCategory = cat.name;
            document.querySelectorAll('#category-list .nav-link').forEach(el => el.classList.toggle('active', el.textContent === cat.name));
            document.getElementById('nav-dashboard').click();
            renderTools();
        };
        list.appendChild(div);
    });
}

function renderFavorites() {
    const favList = document.getElementById('favorites-list');
    favList.innerHTML = favorites.length ? '' : '<span class="no-assets">None</span>';
    favorites.forEach(tool => {
        const div = document.createElement('div');
        div.className = 'nav-link';
        div.textContent = tool.name;
        div.onclick = () => window.open(tool.url, '_blank');
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
            <a href="${t.url}" target="_blank" class="btn-launch">Launch Node</a>
        `;
        grid.appendChild(card);
    });
}

window.toggleFav = (e, tool) => {
    e.stopPropagation();
    const idx = favorites.findIndex(f => f.url === tool.url);
    idx > -1 ? favorites.splice(idx, 1) : favorites.push(tool);
    localStorage.setItem('osint_favs', JSON.stringify(favorites));
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
                <button class="btn-note-icon" onclick="boardNotes.splice(${i},1); localStorage.setItem('osint_notes', JSON.stringify(boardNotes)); renderBoard();">🗑</button>
            </div>
        `;
        board.appendChild(div);
    });
}

function setupModal() {
    const modal = document.getElementById('note-modal');
    document.getElementById('add-note-btn').onclick = () => {
        editingNoteIndex = null;
        document.getElementById('modal-title').textContent = 'LOG EVIDENCE';
        document.getElementById('note-title').value = '';
        document.getElementById('note-text').value = '';
        document.getElementById('note-image').value = '';
        modal.classList.remove('hidden');
    };
    document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
    document.getElementById('save-note').onclick = () => {
        const title = document.getElementById('note-title').value;
        const text = document.getElementById('note-text').value;
        const image = document.getElementById('note-image').value;
        if (!title || !text) return;
        const noteObj = { title, text, image };
        editingNoteIndex !== null ? (boardNotes[editingNoteIndex] = noteObj) : boardNotes.push(noteObj);
        localStorage.setItem('osint_notes', JSON.stringify(boardNotes));
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
    document.getElementById('note-image').value = n.image || '';
    document.getElementById('note-modal').classList.remove('hidden');
};
