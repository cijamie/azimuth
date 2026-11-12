// Shared helpers for reading/writing the registry file (js/data.js).
import fs from 'node:fs';

const PREFIX = 'window.OSINT_DATA = ';

export function loadRegistry(file) {
    const src = fs.readFileSync(file, 'utf8').trim();
    const json = src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1);
    return JSON.parse(json);
}

export function saveRegistry(file, data) {
    fs.writeFileSync(file, PREFIX + JSON.stringify(data, null, 2) + ';\n');
}

// Yields { node, parent, path } for every url node. `path` is the list of
// folder names below the root, e.g. ['Domain Name', 'Whois Records'].
export function* walkTools(root) {
    function* walk(node, trail, parent) {
        if (node.type === 'url') {
            yield { node, parent, path: trail };
            return;
        }
        const next = node === root ? trail : [...trail, node.name];
        for (const c of node.children || []) yield* walk(c, next, node);
    }
    yield* walk(root, [], null);
}
