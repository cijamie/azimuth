// Settings and API keys (localStorage only).
'use strict';

const Settings = (() => {
    const KEY = 'azimuth_settings';
    const defaults = { autoLookups: true, theme: 'dark', region: '', watchHours: 24, privacy: false, captureContext: true, analyst: '', keys: { shodan: '', virustotal: '', anthropic: '' } };
    let s = { ...defaults, ...store.get(KEY, {}) };
    s.keys = { ...defaults.keys, ...(s.keys || {}) };

    const save = () => store.set(KEY, s);
    const get = k => s[k];
    const set = (k, v) => { s[k] = v; save(); };
    const key = name => (s.keys[name] || '').trim();

    function applyTheme() {
        document.documentElement.dataset.theme = s.theme === 'light' ? 'light' : 'dark';
    }

    function open() {
        $('#set-auto').checked = s.autoLookups;
        $('#set-theme-light').checked = s.theme === 'light';
        $('#set-region').value = s.region || '';
        $('#set-watch-hours').value = String(s.watchHours);
        $('#key-shodan').value = s.keys.shodan;
        $('#key-virustotal').value = s.keys.virustotal;
        $('#key-anthropic').value = s.keys.anthropic;
        $('#set-privacy').checked = !!s.privacy;
        $('#set-capture-context').checked = s.captureContext !== false;
        $('#ext-status').innerHTML = window.AzimuthExtension?.ready
            ? '<span class="ok">● Extension connected.</span> Right-click menu and username sweep are on.'
            : '<span class="muted">○ Extension not detected.</span>';
        $('#settings-modal').classList.remove('hidden');
    }

    function close() {
        s.autoLookups = $('#set-auto').checked;
        s.theme = $('#set-theme-light').checked ? 'light' : 'dark';
        s.region = $('#set-region').value.trim().toUpperCase().slice(0, 2);
        s.watchHours = Number($('#set-watch-hours').value) || 24;
        s.keys.shodan = $('#key-shodan').value.trim();
        s.keys.virustotal = $('#key-virustotal').value.trim();
        s.keys.anthropic = $('#key-anthropic').value.trim();
        s.privacy = $('#set-privacy').checked;
        s.captureContext = $('#set-capture-context').checked;
        save();
        applyTheme();
        applyPrivacy();
        $('#settings-modal').classList.add('hidden');
        document.dispatchEvent(new CustomEvent('azimuth:settings'));
    }

    function toggleTheme() {
        s.theme = s.theme === 'light' ? 'dark' : 'light';
        save();
        applyTheme();
    }

    function applyPrivacy() {
        $('#privacy-pill').classList.toggle('hidden', !s.privacy);
    }

    function setup() {
        applyTheme();
        applyPrivacy();
        $('#settings-btn').onclick = open;
        $('#settings-close').onclick = close;
        $('#settings-modal').addEventListener('click', e => { if (e.target.id === 'settings-modal') close(); });
        $('#set-theme-light').onchange = e => { s.theme = e.target.checked ? 'light' : 'dark'; applyTheme(); };
    }

    return { setup, get, set, key, open, close, toggleTheme };
})();
