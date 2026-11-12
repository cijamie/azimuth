const $ = s => document.querySelector(s);
let base = 'https://jamies.dev/azimuth/';
const refresh = () => chrome.runtime.sendMessage({ type: 'popup-state' }, st => {
    if (!st) return;
    base = st.base;
    $('#rec').checked = st.recording;
    $('#rec-label').classList.toggle('on', st.recording);
    $('#count').textContent = st.count ? `${st.count} page(s) captured and waiting to be imported.` : 'No captured pages waiting.';
});
$('#rec').onchange = e => chrome.runtime.sendMessage({ type: 'popup-record', on: e.target.checked }, refresh);
$('#cap').onclick = () => { $('#cap').textContent = 'Capturing…'; chrome.runtime.sendMessage({ type: 'popup-capture' }, () => { $('#cap').textContent = 'Captured ✓'; refresh(); }); };
$('#open').onclick = () => chrome.tabs.create({ url: base });
refresh();
