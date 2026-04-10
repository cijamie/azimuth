const fs = require('fs');
const https = require('https');
const http = require('http');

const data = fs.readFileSync('js/data.js', 'utf8');
const urls = [...new Set([...data.matchAll(/"url":\s*"([^"]+)"/g)].map(m => m[1]))];

console.log(`Found ${urls.length} unique URLs. Starting checks...`);

let active = [];
let errors = [];
let redirects = [];

const checkUrl = (originalUrl) => {
    return new Promise((resolve) => {
        let url = originalUrl;
        if (url.includes('{target}') || url.includes('<') || url.includes('*')) {
             url = url.replace(/{target}/g, 'example').replace(/<[^>]+>/g, 'test').replace(/\*/g, '');
        }
        if (!url.startsWith('http')) {
            resolve();
            return;
        }
        
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            res.on('data', () => {}); 
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    active.push(originalUrl);
                } else if (res.statusCode >= 300 && res.statusCode < 400) {
                    redirects.push(originalUrl);
                } else {
                    errors.push({url: originalUrl, status: res.statusCode});
                }
                resolve();
            });
        }).on('error', (err) => {
            errors.push({url: originalUrl, err: err.message});
            resolve();
        }).on('timeout', () => {
            req.destroy();
        });
    });
};

async function run() {
    const batchSize = 50;
    for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        await Promise.all(batch.map(checkUrl));
    }
    console.log(`\nResults: ${active.length} Active, ${redirects.length} Redirects, ${errors.length} Errors/Inactive`);
    
    // Save broken links to a file for review
    fs.writeFileSync('broken_links.json', JSON.stringify(errors, null, 2));
    console.log('Saved broken links to broken_links.json');
}

run();