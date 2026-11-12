const DEFAULT_BASE = 'https://jamies.dev/azimuth/';
chrome.storage.sync.get({ base: DEFAULT_BASE }, ({ base }) => { document.getElementById('base').value = base; });
document.getElementById('save').onclick = () => {
    let base = document.getElementById('base').value.trim() || DEFAULT_BASE;
    if (!/^(https?|file):/.test(base)) base = 'https://' + base;
    if (!base.endsWith('/') && !/\.html?$/.test(base)) base += '/';
    chrome.storage.sync.set({ base }, () => { document.getElementById('msg').textContent = 'Saved.'; });
};
