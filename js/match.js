// "Same person?" — compares the accounts found for a username: avatar image similarity (perceptual hash,
// where the image host allows it), display-name similarity, shared locations, links between profiles, dates.
'use strict';

const Match = (() => {
    function jaroWinkler(a, b) {
        a = a.toLowerCase(); b = b.toLowerCase();
        if (!a || !b) return 0;
        if (a === b) return 1;
        const md = Math.floor(Math.max(a.length, b.length) / 2) - 1;
        const am = new Array(a.length).fill(false), bm = new Array(b.length).fill(false);
        let m = 0;
        for (let i = 0; i < a.length; i++) for (let j = Math.max(0, i - md); j < Math.min(b.length, i + md + 1); j++) if (!bm[j] && a[i] === b[j]) { am[i] = bm[j] = true; m++; break; }
        if (!m) return 0;
        let t = 0, k = 0;
        for (let i = 0; i < a.length; i++) if (am[i]) { while (!bm[k]) k++; if (a[i] !== b[k]) t++; k++; }
        const jaro = (m / a.length + m / b.length + (m - t / 2) / m) / 3;
        let p = 0;
        while (p < 4 && a[p] === b[p]) p++;
        return jaro + p * 0.1 * (1 - jaro);
    }

    async function dHash(url) {
        const res = await fetch(url, { mode: 'cors', referrerPolicy: 'no-referrer' });
        if (!res.ok) throw new Error('image');
        const bmp = await createImageBitmap(await res.blob());
        const c = Object.assign(document.createElement('canvas'), { width: 9, height: 8 });
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(bmp, 0, 0, 9, 8);
        const d = ctx.getImageData(0, 0, 9, 8).data;
        const g = (x, y) => { const i = (y * 9 + x) * 4; return d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; };
        let bits = '';
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += g(x, y) > g(x + 1, y) ? '1' : '0';
        return bits;
    }
    const hamming = (a, b) => [...a].reduce((n, ch, i) => n + (ch !== b[i]), 0);

    function profilesFrom(results) {
        return results.filter(r => r && r.status === 'hit' && r.rows?.length).map(r => {
            const get = k => r.rows.find(x => x[0] === k)?.[1] || '';
            const all = r.rows.map(x => `${x[1]} ${x[2] || ''}`).join(' ');
            return {
                site: r.title.replace(/ \(.*\)$/, ''), url: get('Profile') || r.link, avatar: r.image,
                name: get('Name') || '', location: get('Location') || get('Country') || '',
                bio: get('Bio') || get('About') || '', created: get('Created') || get('Joined') || '',
                links: [...new Set((all.match(/https?:\/\/[^\s"]+/g) || []).map(u => u.replace(/\/$/, '')))],
            };
        });
    }

    async function run(results, username) {
        const box = $('#match-panel');
        const ps = profilesFrom(results);
        if (ps.length < 2) { box.innerHTML = '<p class="muted small">Need at least two accounts found by the live checks to compare. Run the checks first, or use the Username sweep to find more.</p>'; return; }
        box.innerHTML = '<p class="muted small"><span class="spinner"></span> Comparing profile pictures…</p>';
        await Promise.all(ps.map(async p => { if (p.avatar) try { p.hash = await dHash(p.avatar); } catch { p.hash = null; } }));
        const pairs = [];
        for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
            const a = ps[i], b = ps[j], reasons = [], against = [];
            let score = 0;
            if (a.hash && b.hash) {
                const d = hamming(a.hash, b.hash);
                if (d <= 6) { score += 45; reasons.push('same profile picture'); }
                else if (d <= 12) { score += 20; reasons.push('similar profile picture'); }
                else against.push('different profile pictures');
            }
            if (a.name && b.name) {
                const s = jaroWinkler(a.name.replace(/[^\p{L}\p{N} ]/gu, ''), b.name.replace(/[^\p{L}\p{N} ]/gu, ''));
                if (s > 0.93) { score += 25; reasons.push(`same display name (“${a.name}”)`); }
                else if (s > 0.82) { score += 12; reasons.push(`similar names (“${a.name}” / “${b.name}”)`); }
                else against.push(`different names (“${a.name}” / “${b.name}”)`);
            }
            if (a.location && b.location) {
                const ta = new Set(a.location.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2)), tb = b.location.toLowerCase().split(/[\s,]+/);
                if (tb.some(w => ta.has(w))) { score += 15; reasons.push(`shared location (${a.location} / ${b.location})`); }
                else against.push(`different locations (${a.location} / ${b.location})`);
            }
            const linkTo = (x, y) => x.links.some(l => y.url && (l.includes(new URL(y.url).hostname.replace(/^www\./, '')) && l.toLowerCase().includes(username.toLowerCase())));
            if (linkTo(a, b) || linkTo(b, a)) { score += 35; reasons.push('one profile links to the other'); }
            const shared = a.links.filter(l => b.links.includes(l) && !/github|gitlab|bsky|mastodon|keybase|lichess|chess\.com|ycombinator/.test(l));
            if (shared.length) { score += 25; reasons.push(`both link to ${shared[0]}`); }
            const verdict = score >= 60 ? 'Strong' : score >= 30 ? 'Some' : reasons.length ? 'Weak' : against.length ? 'Probably different' : 'Not enough data';
            pairs.push({ a, b, score: Math.min(100, score), verdict, reasons, against });
        }
        pairs.sort((x, y) => y.score - x.score);
        box.innerHTML = `
            <p class="small">Compared <b>${ps.length}</b> accounts called “${esc(username)}”. Matching usernames alone prove nothing: look for independent signs below.</p>
            <div class="profile-strip">${ps.map(p => `<a class="profile-card" href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">${p.avatar ? `<img src="${esc(safeUrl(p.avatar))}" alt="" referrerpolicy="no-referrer">` : '<span class="noavatar">?</span>'}<b>${esc(p.site)}</b><span class="tiny muted">${esc(p.name || '')}</span><span class="tiny muted">${esc(p.location || '')}</span><span class="tiny muted">${esc((p.created || '').slice(0, 10))}</span></a>`).join('')}</div>
            <table class="data-table"><thead><tr><th>Accounts</th><th>Link</th><th>Signs they’re the same person</th><th>Signs against</th></tr></thead><tbody>
            ${pairs.map(p => `<tr><td>${esc(p.a.site)} ↔ ${esc(p.b.site)}</td><td><span class="status ${p.verdict === 'Strong' ? 'st-ok' : p.verdict === 'Some' ? 'st-input' : p.verdict === 'Probably different' ? 'st-err' : 'st-blocked'}">${p.verdict}</span></td><td class="small">${p.reasons.map(esc).join('<br>') || '-'}</td><td class="small muted">${p.against.map(esc).join('<br>') || '-'}</td></tr>`).join('')}
            </tbody></table>
            <p class="muted tiny">Picture comparison works where the site allows it (GitHub, Gravatar and some others). Scores are a guide, not proof.</p>
            <div class="btn-row"><button class="btn primary" id="match-save">⊕ Save comparison to case</button></div>`;
        $('#match-save').onclick = () => CaseFile.addEvidence({
            title: `Same-person comparison: ${username}`,
            text: pairs.map(p => `${p.a.site} ↔ ${p.b.site}: ${p.verdict}${p.reasons.length ? ` (${p.reasons.join('; ')})` : ''}${p.against.length ? ` / against: ${p.against.join('; ')}` : ''}`).join('\n'),
            tags: ['attribution', 'username'], selector: username,
        });
    }

    return { run, jaroWinkler };
})();
