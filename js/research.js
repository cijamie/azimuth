// Research helpers: name/username/email variants with transliteration, Telegram channel reader (via the
// extension), and research persona ("sock puppet") tracking.
'use strict';

// Messages to the Azimuth browser extension (request/response), used by Telegram and auto-capture.
const ExtBridge = (() => {
    const pending = new Map();
    window.addEventListener('message', e => {
        if (e.source !== window || e.data?.__azimuth !== 'ext' || !e.data.reqId) return;
        const p = pending.get(e.data.reqId);
        if (!p) return;
        pending.delete(e.data.reqId);
        e.data.error ? p.rej(new Error(e.data.error)) : p.res(e.data.result);
    });
    return {
        request(type, payload = {}, timeout = 30000) {
            if (!window.AzimuthExtension?.ready) return Promise.reject(new Error('The Azimuth browser extension is not installed or not enabled for this page.'));
            const reqId = uid();
            return new Promise((res, rej) => {
                pending.set(reqId, { res, rej });
                window.postMessage({ __azimuth: 'page', type, reqId, ...payload }, '*');
                setTimeout(() => { if (pending.delete(reqId)) rej(new Error('The extension did not answer in time.')); }, timeout);
            });
        },
    };
})();

const Research = (() => {
    // ================= Name variants =================
    const NICK = {
        alexander: ['alex', 'alec', 'sasha', 'xander', 'lex'], aleksandr: ['sasha', 'alex', 'shura'], alexandra: ['alex', 'sasha', 'lexi'], andrew: ['andy', 'drew'], anthony: ['tony', 'ant'],
        benjamin: ['ben', 'benji'], catherine: ['cathy', 'kate', 'katie', 'cat'], katherine: ['kate', 'katie', 'kathy', 'kat'], charles: ['charlie', 'chuck', 'chas'], christopher: ['chris', 'kit'],
        daniel: ['dan', 'danny'], david: ['dave', 'davy'], dmitry: ['dima', 'dmitri', 'dimitri'], edward: ['ed', 'eddie', 'ted'], elizabeth: ['liz', 'beth', 'lizzie', 'eliza', 'betty'],
        francis: ['frank'], frederick: ['fred', 'freddie'], gregory: ['greg'], henry: ['harry', 'hank'], ivan: ['vanya'], jacob: ['jake'], james: ['jim', 'jimmy', 'jamie'], jennifer: ['jen', 'jenny'],
        john: ['jack', 'johnny', 'jon'], jonathan: ['jon', 'jonny'], joseph: ['joe', 'joey'], kenneth: ['ken', 'kenny'], margaret: ['maggie', 'meg', 'peggy'], matthew: ['matt'], michael: ['mike', 'mick', 'mikey'],
        mikhail: ['misha', 'mike'], nicholas: ['nick', 'nicky'], nikolai: ['kolya', 'nick'], patrick: ['pat', 'paddy'], peter: ['pete'], pyotr: ['petya', 'peter'], rebecca: ['becky', 'becca'],
        richard: ['rich', 'rick', 'dick'], robert: ['rob', 'bob', 'bobby', 'robbie'], samuel: ['sam'], sergei: ['seryozha', 'sergey', 'serge'], stephen: ['steve'], steven: ['steve'], susan: ['sue', 'susie'],
        thomas: ['tom', 'tommy'], timothy: ['tim'], vladimir: ['vova', 'volodya', 'vlad'], william: ['will', 'bill', 'billy', 'liam'], yevgeny: ['zhenya', 'eugene', 'evgeny'], muhammad: ['mo', 'moe', 'hamoudi'],
        abdullah: ['abdul'], olga: ['olya'], natalia: ['natasha', 'nata'], tatiana: ['tanya'], ekaterina: ['katya', 'kate'], maria: ['masha', 'mary'], anna: ['anya', 'ann'], elena: ['lena', 'helen'],
    };
    // Spelling families that the same name is commonly written in.
    const FAMILIES = [
        ['muhammad', 'mohammed', 'mohammad', 'mohamed', 'muhammed', 'mohamad', 'mehmet'], ['ahmed', 'ahmad', 'ahmet'], ['hussein', 'hussain', 'husayn', 'hossein', 'husein'],
        ['yusuf', 'youssef', 'yousef', 'yusef', 'joseph'], ['ibrahim', 'ebrahim', 'abraham'], ['abdul', 'abd al', 'abdel', 'abdal'], ['omar', 'umar'], ['osama', 'usama'], ['khalid', 'khaled'],
        ['aleksandr', 'alexander', 'aleksander', 'alexandr', 'oleksandr', 'olexandr'], ['sergei', 'sergey', 'serhiy', 'serhii', 'sergiy'], ['dmitry', 'dmitri', 'dmitriy', 'dimitri', 'dmytro'],
        ['yevgeny', 'evgeny', 'evgeniy', 'yevgeniy', 'eugene', 'yevhen'], ['yuri', 'yury', 'yuriy', 'iurii', 'georgy'], ['andrei', 'andrey', 'andriy', 'andrii', 'andrew'], ['mikhail', 'mykhailo', 'michael'],
        ['nikolai', 'nikolay', 'mykola', 'nicholas'], ['vladimir', 'volodymyr', 'wladimir'], ['pyotr', 'petr', 'petro', 'peter'], ['ivanov', 'ivanoff'], ['petrov', 'petroff'], ['smirnov', 'smirnoff'],
        ['zhang', 'chang', 'cheung', 'cheong'], ['wang', 'wong', 'vuong'], ['li', 'lee', 'lei'], ['liu', 'lau', 'lao'], ['chen', 'chan', 'chin', 'tan'], ['huang', 'wong', 'hwang'], ['zhao', 'chao', 'chiu'],
        ['wu', 'ng', 'woo'], ['zhou', 'chow', 'chau', 'chou'], ['xu', 'hsu', 'tsui'], ['kim', 'gim'], ['park', 'pak', 'bak'], ['choi', 'choe', 'chey'], ['nguyen', 'nguyễn', 'nguyen'],
        ['catherine', 'katherine', 'kathryn', 'katharine', 'catharine'], ['steven', 'stephen'], ['jon', 'john'], ['sara', 'sarah'], ['ann', 'anne', 'anna'], ['jeffrey', 'geoffrey'], ['philip', 'phillip'],
    ];
    const RU2LAT = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ї: 'yi', є: 'ye', ґ: 'g' };
    const LAT2RU = [['shch', 'щ'], ['zh', 'ж'], ['kh', 'х'], ['ts', 'ц'], ['ch', 'ч'], ['sh', 'ш'], ['yu', 'ю'], ['ya', 'я'], ['yo', 'ё'], ['iy', 'ий'], ['a', 'а'], ['b', 'б'], ['v', 'в'], ['g', 'г'], ['d', 'д'], ['e', 'е'], ['z', 'з'], ['i', 'и'], ['y', 'й'], ['k', 'к'], ['l', 'л'], ['m', 'м'], ['n', 'н'], ['o', 'о'], ['p', 'п'], ['r', 'р'], ['s', 'с'], ['t', 'т'], ['u', 'у'], ['f', 'ф'], ['x', 'кс'], ['h', 'х'], ['c', 'к'], ['w', 'в'], ['j', 'дж'], ['q', 'к']];
    const SPELL = [[/ks/g, 'x'], [/x/g, 'ks'], [/iy$/g, 'y'], [/y$/g, 'iy'], [/iy$/g, 'ii'], [/ya/g, 'ia'], [/yu/g, 'iu'], [/zh/g, 'j'], [/kh/g, 'h'], [/kh/g, 'ch'], [/ts/g, 'tz'], [/shch/g, 'sch'], [/^e/g, 'ye'], [/ov$/g, 'off'], [/ev$/g, 'ieff'], [/ei$/g, 'ey'], [/ey$/g, 'ei'], [/ph/g, 'f'], [/f/g, 'ph'], [/oo/g, 'u'], [/ou/g, 'u'], [/ee/g, 'i']];

    const cyrToLat = s => [...s.toLowerCase()].map(ch => RU2LAT[ch] ?? ch).join('');
    function latToCyr(s) {
        let out = '', i = 0;
        const low = s.toLowerCase();
        while (i < low.length) {
            const hit = LAT2RU.find(([l]) => low.startsWith(l, i));
            if (hit) { out += hit[1]; i += hit[0].length; } else { out += low[i]; i++; }
        }
        return out;
    }
    const cap = s => s.replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

    function wordVariants(w) {
        const low = w.toLowerCase();
        const set = new Set([low]);
        if (/[а-яёіїєґ]/i.test(low)) set.add(cyrToLat(low));
        const latin = [...set].find(x => /^[a-z' -]+$/.test(x)) || low;
        for (const f of FAMILIES) if (f.includes(latin)) f.forEach(v => set.add(v));
        for (const [re, rep] of SPELL) { const v = latin.replace(re, rep); if (v !== latin) set.add(v); }
        if (/^[a-z]+$/.test(latin)) set.add(latToCyr(latin));
        return [...set].filter(Boolean);
    }

    function variants(full, domain, year) {
        const parts = full.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return null;
        const first = parts[0], last = parts.length > 1 ? parts[parts.length - 1] : '';
        const firstV = wordVariants(first), lastV = last ? wordVariants(last) : [''];
        const latinOnly = a => a.filter(x => /^[a-z' -]+$/.test(x)).map(x => x.replace(/[' -]/g, ''));
        const fl = latinOnly(firstV), ll = last ? latinOnly(lastV) : [''];
        const nick = [...new Set(fl.flatMap(f => NICK[f] || []))];
        // Name variants for searching
        const names = new Set();
        for (const f of firstV) for (const l of lastV) names.add(cap(`${f} ${l}`.trim()));
        for (const n of nick) for (const l of lastV.slice(0, 3)) names.add(cap(`${n} ${l}`.trim()));
        if (last) { names.add(cap(`${last} ${first}`)); names.add(`${cap(last)}, ${cap(first)}`); names.add(`${cap(first)[0]}. ${cap(last)}`); }
        // Usernames
        const users = new Set();
        const yy = year ? String(year).slice(-2) : '';
        const firsts = [...new Set([fl[0], ...nick.slice(0, 2), ...fl.slice(1, 3)].filter(Boolean))];
        const lasts = [...new Set(ll.slice(0, 3))];
        for (const f of firsts) for (const l of lasts) {
            const base = l ? [`${f}${l}`, `${f}.${l}`, `${f}_${l}`, `${f}-${l}`, `${f[0]}${l}`, `${f[0]}.${l}`, `${f}${l[0]}`, `${l}${f}`, `${l}.${f}`, `${l}${f[0]}`, `${l}_${f}`] : [f];
            base.forEach(u => users.add(u));
            if (year) base.slice(0, 5).forEach(u => { users.add(`${u}${year}`); users.add(`${u}${yy}`); });
        }
        if (!last) firsts.forEach(f => users.add(f));
        const userList = [...users].filter(u => u.length >= 3).slice(0, 80);
        // Emails
        const emailPatterns = userList.filter(u => !/-/.test(u)).slice(0, 25);
        const domains = domain ? [domain.replace(/^@/, '').toLowerCase()] : ['gmail.com', 'outlook.com', 'yahoo.com', 'proton.me', 'icloud.com'];
        const emails = [];
        for (const d of domains) for (const u of (domain ? emailPatterns : emailPatterns.slice(0, 6))) emails.push(`${u}@${d}`);
        return { names: [...names].slice(0, 60), users: userList, emails: emails.slice(0, 120) };
    }

    function renderVariants() {
        const v = variants($('#var-name').value, $('#var-domain').value.trim(), $('#var-year').value.trim());
        const out = $('#var-output');
        if (!v) { out.innerHTML = ''; return; }
        const block = (title, list, type, note) => `<div class="ioc-group"><h4>${esc(title)} <span class="muted">${list.length}</span> <button class="btn small ghost" data-var-copy="${esc(type)}">Copy</button>${type !== 'name' ? ` <button class="btn small ghost" data-var-bulk="${esc(type)}">Check all in Bulk</button>` : ''}</h4>${note ? `<p class="muted tiny">${note}</p>` : ''}
            <div class="chip-row">${list.map(x => `<button class="chip" data-investigate="${esc(x)}" data-type="${esc(type)}">${esc(x)}</button>`).join('')}</div></div>`;
        out.innerHTML = block('Name spellings & transliterations', v.names, 'name', 'Use these for sanctions screening, court records and news searches.') + block('Likely usernames', v.users, 'username') + block('Possible email addresses', v.emails, 'email', $('#var-domain').value ? '' : 'Add the company domain above for work addresses. Shown here: the most common patterns at big providers.');
        out.onclick = e => {
            const c = e.target.closest('[data-var-copy]'), b = e.target.closest('[data-var-bulk]');
            const list = t => (t === 'name' ? v.names : t === 'username' ? v.users : v.emails);
            if (c) copyText(list(c.dataset.varCopy).join('\n'), 'Copied');
            if (b) Bulk.load(list(b.dataset.varBulk));
        };
    }

    // ================= Telegram =================
    let tg = { channel: '', posts: [], info: null, oldest: null };
    function parseTelegram(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const info = {
            title: doc.querySelector('.tgme_channel_info_header_title')?.textContent.trim(),
            username: doc.querySelector('.tgme_channel_info_header_username')?.textContent.trim(),
            description: doc.querySelector('.tgme_channel_info_description')?.textContent.trim(),
            counters: [...doc.querySelectorAll('.tgme_channel_info_counter')].map(c => `${c.querySelector('.counter_value')?.textContent} ${c.querySelector('.counter_type')?.textContent}`).join(' · '),
        };
        const posts = [...doc.querySelectorAll('.tgme_widget_message')].map(m => {
            const id = m.getAttribute('data-post') || '';
            const textEl = m.querySelector('.tgme_widget_message_text');
            return {
                id, num: +id.split('/').pop(),
                url: `https://t.me/${id}`,
                date: m.querySelector('time')?.getAttribute('datetime') || '',
                text: textEl ? textEl.innerText || textEl.textContent : '',
                views: m.querySelector('.tgme_widget_message_views')?.textContent.trim() || '',
                forwarded: m.querySelector('.tgme_widget_message_forwarded_from_name')?.textContent.trim() || '',
                links: [...(textEl?.querySelectorAll('a[href]') || [])].map(a => a.getAttribute('href')).filter(h => /^https?:/.test(h)),
                media: m.querySelector('.tgme_widget_message_photo_wrap, .tgme_widget_message_video_player') ? 'media' : '',
            };
        }).filter(p => p.id);
        return { info, posts };
    }

    async function loadTelegram(older = false) {
        let ch = $('#tg-channel').value.trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\/(s\/)?/, '').split(/[/?#]/)[0];
        if (!/^[A-Za-z0-9_]{3,64}$/.test(ch)) return toast('Enter a public channel name (letters, numbers, underscores)', 'err');
        if (!older || ch !== tg.channel) tg = { channel: ch, posts: [], info: null, oldest: null };
        $('#tg-status').textContent = 'Loading…';
        try {
            const html = await ExtBridge.request('telegram', { channel: ch, before: older ? tg.oldest : null });
            const { info, posts } = parseTelegram(html);
            if (!posts.length && !tg.posts.length) throw new Error('No public posts found (private channel, a user rather than a channel, or the name is wrong).');
            tg.info ||= info;
            const have = new Set(tg.posts.map(p => p.id));
            tg.posts.push(...posts.filter(p => !have.has(p.id)));
            tg.posts.sort((a, b) => b.num - a.num);
            tg.oldest = Math.min(...tg.posts.map(p => p.num));
            $('#tg-status').textContent = `${tg.posts.length} posts loaded`;
            $('#tg-more').disabled = $('#tg-csv').disabled = $('#tg-case').disabled = false;
            renderTelegram();
            CaseFile.log('telegram', `Read Telegram channel ${ch} (${tg.posts.length} posts)`, `https://t.me/s/${ch}`);
        } catch (e) {
            $('#tg-status').textContent = '';
            $('#tg-output').innerHTML = `<p class="warn small">${esc(e.message)}</p>${/extension/.test(e.message) ? '<p class="muted small">Install it from the <code>extension</code> folder (see Settings → Browser extension). Meanwhile you can open <a target="_blank" rel="noopener noreferrer" href="https://t.me/s/' + esc(ch) + '">t.me/s/' + esc(ch) + '</a> directly.</p>' : ''}`;
        }
    }

    function renderTelegram() {
        const f = ($('#tg-filter').value || '').toLowerCase();
        const list = tg.posts.filter(p => !f || (p.text + ' ' + p.forwarded).toLowerCase().includes(f));
        const i = tg.info || {};
        $('#tg-output').innerHTML = `
            <div class="summary-card"><b>${esc(i.title || tg.channel)}</b> <span class="muted">${esc(i.username || '')}</span><div class="small">${esc(i.counters || '')}</div>${i.description ? `<div class="small muted">${esc(i.description)}</div>` : ''}</div>
            <div class="tg-list">${list.map(p => `<article class="tg-post"><div class="tiny muted"><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">#${p.num}</a> · ${esc(p.date.replace('T', ' ').slice(0, 16))} · ${esc(p.views)} views${p.forwarded ? ` · forwarded from <b>${esc(p.forwarded)}</b>` : ''}${p.media ? ' · 🖼' : ''}</div>
                <div class="small" style="white-space:pre-wrap">${esc(p.text.slice(0, 1500))}</div>
                ${p.links.length ? `<div class="tiny">${p.links.slice(0, 5).map(l => `<button class="chip" data-investigate="${esc(l)}">${esc(l.slice(0, 60))}</button>`).join(' ')}</div>` : ''}</article>`).join('') || '<p class="muted small">No posts match.</p>'}</div>`;
    }

    // ================= Personas =================
    const personas = () => Secure.get('azimuth_personas', []);
    function renderPersonas() {
        const list = personas();
        const now = Date.now();
        $('#persona-list').innerHTML = list.length ? list.map((p, i) => {
            const ageDays = Math.floor((now - new Date(p.created)) / 864e5);
            const idle = p.lastUsed ? Math.floor((now - new Date(p.lastUsed)) / 864e5) : null;
            const warn = p.status === 'Burned' ? 'Burned: do not reuse.' : ageDays < 30 ? `Only ${ageDays} days old: new accounts are more likely to be flagged.` : idle !== null && idle > 60 ? `Not used for ${idle} days: log in and act normally before using it for research.` : '';
            return `<div class="persona"><div><b>${esc(p.name)}</b> <span class="status ${p.status === 'Active' ? 'st-ok' : p.status === 'Burned' ? 'st-err' : 'st-blocked'}">${esc(p.status)}</span>
                <div class="muted small">${esc(p.profile || 'no browser profile noted')} · created ${esc(p.created.slice(0, 10))} · ${p.lastUsed ? `last used ${esc(p.lastUsed.slice(0, 10))}` : 'never used'}</div>
                ${warn ? `<div class="small warn">${esc(warn)}</div>` : ''}
                <pre class="evidence-text">${esc(p.accounts || '')}</pre>${p.notes ? `<div class="small muted">${esc(p.notes)}</div>` : ''}</div>
                <div class="btn-row" style="margin:0"><button class="btn small" data-p-used="${i}">Used today</button><select class="input input-sm" data-p-status="${i}">${['Active', 'Aging (not yet used)', 'Burned', 'Retired'].map(s => `<option ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="btn small ghost" data-p-del="${i}">Delete</button></div></div>`;
        }).join('') : '<p class="muted small">No personas yet.</p>';
    }

    function setup() {
        ['#var-name', '#var-domain', '#var-year'].forEach(id => $(id).addEventListener('input', debounce(renderVariants, 200)));
        $('#tg-load').onclick = () => loadTelegram(false);
        $('#tg-channel').addEventListener('keydown', e => { if (e.key === 'Enter') loadTelegram(false); });
        $('#tg-more').onclick = () => loadTelegram(true);
        $('#tg-filter').addEventListener('input', debounce(renderTelegram, 150));
        $('#tg-csv').onclick = () => {
            const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
            download(`telegram_${tg.channel}.csv`, ['id,url,date,views,forwarded_from,text,links', ...tg.posts.map(p => [p.num, p.url, p.date, p.views, p.forwarded, p.text, p.links.join(' ')].map(q).join(','))].join('\n'), 'text/csv');
        };
        $('#tg-case').onclick = () => {
            const f = ($('#tg-filter').value || '').toLowerCase();
            const list = tg.posts.filter(p => !f || p.text.toLowerCase().includes(f));
            CaseFile.addSelector({ type: 'username', value: tg.channel });
            CaseFile.addEvidence({ title: `Telegram channel ${tg.channel}: ${list.length} posts${f ? ` matching “${f}”` : ''}`, text: list.map(p => `[${p.date}] ${p.url}${p.forwarded ? ` (fwd from ${p.forwarded})` : ''}\n${p.text}`).join('\n\n'), source: `https://t.me/s/${tg.channel}`, tags: ['telegram'] });
        };
        $('#persona-save').onclick = () => {
            const get = k => $(`[data-pf="${k}"]`).value.trim();
            if (!get('name')) return toast('Give the persona a name', 'err');
            Secure.set('azimuth_personas', [...personas(), { name: get('name'), profile: get('profile'), status: get('status'), accounts: get('accounts'), notes: get('notes'), created: new Date().toISOString(), lastUsed: null }]);
            $$('[data-pf]').forEach(el => { if (el.tagName !== 'SELECT') el.value = ''; });
            renderPersonas();
        };
        $('#persona-list').addEventListener('click', e => {
            const u = e.target.closest('[data-p-used]'), d = e.target.closest('[data-p-del]');
            const list = personas();
            if (u) { list[+u.dataset.pUsed].lastUsed = new Date().toISOString(); Secure.set('azimuth_personas', list); renderPersonas(); }
            if (d && confirm('Delete this persona record?')) { list.splice(+d.dataset.pDel, 1); Secure.set('azimuth_personas', list); renderPersonas(); }
        });
        $('#persona-list').addEventListener('change', e => {
            const s = e.target.closest('[data-p-status]');
            if (s) { const list = personas(); list[+s.dataset.pStatus].status = s.value; Secure.set('azimuth_personas', list); renderPersonas(); }
        });
        renderPersonas();
    }

    return { setup, variants, parseTelegram };
})();
