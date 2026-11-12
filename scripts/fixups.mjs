// Post-audit fix-ups applied after check-links.mjs --apply (kept for reproducibility).
import { loadRegistry, saveRegistry, walkTools } from './registry.mjs';
const DATA = 'js/data.js';
const data = loadRegistry(DATA);
const DROP = new Set(['ExifViewer', 'HowManyOfMe', 'Most Wanted Criminal Pages', 'Sorted by Birth Date', 'DDecode - PHP Decoder',
  'Phenoelit Default Password List', 'Scam Database', 'LetMeCheck.it', 'The Hitchhiker’s Guide to Online Anonymity']);
const URLFIX = { 'crt.sh - Certificate Search': 'https://crt.sh/', 'Threads profile': 'https://www.threads.com/@{target}' };
function prune(f) {
  if (!f.children) return;
  f.children = f.children.filter(n => !(n.type === 'url' && DROP.has(n.name)));
  f.children.forEach(prune);
  f.children = f.children.filter(n => n.type === 'url' || n.children?.length);
}
prune(data);
for (const { node } of walkTools(data)) {
  if (URLFIX[node.name]) { node.url = URLFIX[node.name]; node.status = 'ok'; delete node.moved_to; }
  if (node.status === 'error' && /^https?:\/\/(www\.)?(facebook|wordreference|whatsmyname|emailrep)/.test(node.url)) node.status = 'blocked';
  if (node.status === 'error' && /archive\.ph|crt\.sh|openlibrary|invid-project|perfect-privacy|dnsleaktest/.test(node.url)) node.status = 'blocked';
  delete node.last_verified;
}
saveRegistry(DATA, data);
const counts = {};
for (const { node } of walkTools(data)) counts[node.status] = (counts[node.status] || 0) + 1;
console.log([...walkTools(data)].length, counts);
