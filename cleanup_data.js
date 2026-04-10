const fs = require('fs');

// 1. Load broken links
const brokenLinks = JSON.parse(fs.readFileSync('broken_links.json', 'utf8'));

// 2. Identify "Full Dead" URLs
// Criteria: 404, 410, or ENOTFOUND (domain doesn't exist)
const deadUrls = new Set();
brokenLinks.forEach(link => {
    if (link.status === 404 || link.status === 410) {
        deadUrls.add(link.url);
    } else if (link.err && link.err.includes('ENOTFOUND')) {
        // Exclude .onion addresses as they require Tor
        if (!link.url.includes('.onion')) {
            deadUrls.add(link.url);
        }
    }
});

console.log(`Identified ${deadUrls.size} URLs as definitively dead.`);

// 3. Load and parse data.js
let dataContent = fs.readFileSync('js/data.js', 'utf8');
// Strip "window.OSINT_DATA = " and trailing semicolon
const jsonString = dataContent.replace('window.OSINT_DATA = ', '').replace(/;$/, '');
const data = JSON.parse(jsonString);

// 4. Recursive removal function
function removeDeadNodes(node) {
    if (node.children) {
        node.children = node.children.filter(child => {
            if (child.type === 'url') {
                return !deadUrls.has(child.url);
            }
            return true; // Keep folders for now
        });
        
        // Recursively clean children
        node.children.forEach(removeDeadNodes);
        
        // Remove empty folders (except the root)
        node.children = node.children.filter(child => {
            if (child.type === 'folder') {
                return child.children && child.children.length > 0;
            }
            return true;
        });
    }
}

removeDeadNodes(data);

// 5. Write back to data.js
const newContent = 'window.OSINT_DATA = ' + JSON.stringify(data, null, 2) + ';';
fs.writeFileSync('js/data.js', newContent);

console.log('Successfully cleaned js/data.js');
