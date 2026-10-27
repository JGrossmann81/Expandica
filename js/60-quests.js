/* Expandica 60-quests: the 'Quests' tab. Welcome, level and XP, badges, Stop Passport, savings meter,
   family names and scout cards, quest log, and the household card. Global: EXQ. Reads EX (10-core) defensively. */
window.EXQ = window.EXQ || {};
(function () {
  'use strict';
  const esc = OA.esc, D = window.EXQ_DATA || { quests: [], levels: [{ n: 1, name: 'Seedling', xp: 0 }], welcome: [], groups: {} };
  OA.defaults({ ex: { quests: { done: {}, custom: [] }, welcomed: false } });

  /* ---------- state helpers ---------- */
  const S = () => OA.S.ex;
  function ensure() {
    const s = S();
    s.goals = s.goals || {}; s.goals.savings = s.goals.savings || { goal: 0, saved: 0, log: [] };
    if (!Array.isArray(s.goals.savings.log)) s.goals.savings.log = [];
    s.goals.badges = s.goals.badges || {}; if (!Array.isArray(s.goals.passport)) s.goals.passport = [];
    s.family = s.family || { names: [] }; if (!Array.isArray(s.family.names)) s.family.names = [];
    s.quests = s.quests || { done: {}, custom: [] }; s.quests.done = s.quests.done || {}; if (!Array.isArray(s.quests.custom)) s.quests.custom = [];
    return s;
  }
  const parcels = () => (window.EX && EX.parcels ? EX.parcels.list() : []);
  const sidx = id => (window.EX && EX.stageIdx ? EX.stageIdx(id) : -1);
  const reached = (p, sid) => sidx(p.stage) >= sidx(sid);
  function reachTs(p, sid) {
    if (!reached(p, sid)) return 0;
    const t = (p.stageLog || []).filter(e => sidx(e.stage) >= sidx(sid)).map(e => e.ts).filter(Boolean);
    return t.length ? Math.min.apply(null, t) : (p.created || Date.now());
  }
  function firstStageTs(sid) { const t = parcels().map(p => reachTs(p, sid)).filter(Boolean); return t.length ? Math.min.apply(null, t) : 0; }
  const countAt = sid => parcels().filter(p => reached(p, sid)).length;
  const ddKeys = () => (window.EXL && Array.isArray(EXL.ddItems) ? EXL.ddItems.length : 0);
  function ddFull(p) {
    const v = Object.values(p.diligence || {}); if (!v.length) return false;
    const need = ddKeys() || 8; return v.length >= need && v.every(Boolean);
  }
  const questsAll = () => D.quests.concat(S().quests.custom.map(c => ({ id: c.id, grp: 'custom', kind: 'once', xp: 10, t: c.t, d: 'Your own quest.', custom: true })));
  const qDone = id => !!S().quests.done[id];
  const nightsN = () => S().goals.passport.length;

  /* ---------- badges (derived from state; the date is kept once earned) ---------- */
  const now = () => Date.now();
  const BADGES = [
    { id: 'scout1', ic: 'eye', t: 'First scout', d: 'Save your first parcel.', test: () => parcels().length ? Math.min.apply(null, parcels().map(p => p.created || now())) : 0 },
    { id: 'scout5', ic: 'list', t: 'Five on the list', d: 'Have five parcels saved.', test: () => parcels().length >= 5 ? now() : 0 },
    { id: 'visit1', ic: 'pin', t: 'Boots on the ground', d: 'Visit a parcel in person.', test: () => firstStageTs('visited') },
    { id: 'contract1', ic: 'book', t: 'Under contract', d: 'Reach the contract stage on a parcel.', test: () => firstStageTs('contract') },
    { id: 'owned1', ic: 'home', t: 'Landholder', d: 'Own your first parcel.', test: () => firstStageTs('owned') },
    { id: 'cabinplan', ic: 'tool', t: 'Blueprint', d: 'Plan a cabin on a parcel.', test: () => firstStageTs('cabinplan') },
    { id: 'cabinbuilt', ic: 'home', t: 'Roof overhead', d: 'Finish building a cabin.', test: () => firstStageTs('cabinbuilt') },
    { id: 'stop1', ic: 'star', t: 'Stop open', d: 'Open your first family road-trip stop.', test: () => firstStageTs('stop') },
    { id: 'owned3', ic: 'compass', t: 'Three stops', d: 'Own three parcels.', test: () => countAt('owned') >= 3 ? now() : 0 },
    { id: 'owned5', ic: 'compass', t: 'Five stops', d: 'Own five parcels.', test: () => countAt('owned') >= 5 ? now() : 0 },
    { id: 'states3', ic: 'map', t: 'Three states', d: 'Have parcels in three different states.', test: () => new Set(parcels().map(p => (p.state || '').trim()).filter(Boolean)).size >= 3 ? now() : 0 },
    { id: 'dd100', ic: 'check', t: 'Paperwork pro', d: 'Finish every due-diligence item on one parcel.', test: () => parcels().some(ddFull) ? now() : 0 },
    { id: 'power', ic: 'bolt', t: 'Power planner', d: 'Save a power plan.', test: () => { const pw = S().power; return pw && Object.keys(pw).length ? now() : 0; } },
    { id: 'night1', ic: 'moon', t: 'First night', d: 'Log a night in the Stop Passport.', test: () => { const e = S().goals.passport; return e.length ? Math.min.apply(null, e.map(x => x.ts || now())) : 0; } },
    { id: 'night5', ic: 'tent', t: 'Five nights', d: 'Log five nights in the passport.', test: () => nightsN() >= 5 ? now() : 0 },
    { id: 'photostamp', ic: 'camera', t: 'Picture perfect', d: 'Add a photo to a passport stamp.', test: () => S().goals.passport.some(x => x.photo) ? now() : 0 },
    { id: 'coin1', ic: 'cart', t: 'First coin', d: 'Log your first contribution to the savings goal.', test: () => S().goals.savings.log.length ? now() : 0 },
    { id: 'save50', ic: 'scale', t: 'Halfway there', d: 'Reach half of your savings goal.', test: () => { const g = S().goals.savings; return g.goal > 0 && g.saved >= g.goal / 2 ? now() : 0; } },
    { id: 'save100', ic: 'star', t: 'Goal reached', d: 'Reach your savings goal.', test: () => { const g = S().goals.savings; return g.goal > 0 && g.saved >= g.goal ? now() : 0; } },
    { id: 'crew', ic: 'heart', t: 'The crew', d: 'Add two or more family names.', test: () => S().family.names.length >= 2 ? now() : 0 },
    { id: 'lilscouts', ic: 'eye', t: 'Little scouts', d: 'Every family member fills a scout card on one parcel.', test: () => { const n = S().family.names; return n.length && parcels().some(p => n.every(x => p.scout && p.scout[x] && (p.scout[x].pro || p.scout[x].con || p.scout[x].vote))) ? now() : 0; } },
    { id: 'quest5', ic: 'list', t: 'Quest starter', d: 'Finish five family quests.', test: () => Object.keys(S().quests.done).length >= 5 ? now() : 0 },
    { id: 'quest15', ic: 'list', t: 'Quest keeper', d: 'Finish fifteen family quests.', test: () => Object.keys(S().quests.done).length >= 15 ? now() : 0 },
    { id: 'firesmart', ic: 'flame', t: 'Fire smart', d: 'Teach every child a fire safety rule.', test: () => S().quests.done.fire || 0 },
    { id: 'stargaze', ic: 'moon', t: 'Stargazers', d: 'Spend a night under the stars on the land.', test: () => S().quests.done.stars || 0 }
  ];
  EXQ.BADGES = BADGES;
  function syncBadges(quiet) {
    const s = ensure(), B = s.goals.badges, fresh = [];
    BADGES.forEach(b => { if (B[b.id]) return; let ts = 0; try { ts = b.test(); } catch (e) { } if (ts) { B[b.id] = ts; fresh.push(b); } });
    if (fresh.length) { OA.save(); if (!quiet) OA.toast(fresh.length === 1 ? 'Badge earned: ' + fresh[0].t : fresh.length + ' new badges earned'); }
    return fresh;
  }

  /* ---------- XP and level ---------- */
  const STAGE_XP = { scouted: 10, visited: 25, contract: 40, owned: 100, cabinplan: 50, cabinbuilt: 150, stop: 200 };
  function xp() {
    const s = ensure(), parts = []; let t = 0;
    const add = (label, v) => { if (v > 0) { parts.push({ label, v }); t += v; } };
    let stg = 0; parcels().forEach(p => Object.keys(STAGE_XP).forEach(k => { if (reached(p, k)) stg += STAGE_XP[k]; }));
    add('Parcel stages', stg);
    add('Due-diligence items', 3 * parcels().reduce((a, p) => a + Object.values(p.diligence || {}).filter(Boolean).length, 0));
    add('Scout cards', 5 * parcels().reduce((a, p) => a + Object.values(p.scout || {}).filter(c => c && (c.pro || c.con || c.vote)).length, 0));
    add('Passport nights', 40 * s.goals.passport.length);
    add('Savings entries', 5 * Math.min(20, s.goals.savings.log.length));
    const qs = questsAll(); add('Family quests', qs.reduce((a, q) => a + (s.quests.done[q.id] ? q.xp : 0), 0));
    add('Badges', 20 * Object.keys(s.goals.badges).length);
    const L = D.levels; let lv = L[0]; L.forEach(l => { if (t >= l.xp) lv = l; });
    const nx = L.find(l => l.xp > t) || null;
    return { total: t, parts, level: lv, next: nx, pct: nx ? Math.round((t - lv.xp) / (nx.xp - lv.xp) * 100) : 100 };
  }
  EXQ.xp = xp;

  /* ---------- small helpers ---------- */
  const dlabel = ts => { try { return OA.fmtDate(OA.dkey(new Date(ts)), { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } };
  const seasonNow = () => { const m = new Date().getMonth(); return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'fall' : 'winter'; };
  const hash = s => { let h = 0; String(s).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) | 0; }); return Math.abs(h); };
  const urlCache = {};
  async function photoUrl(id) {
    if (urlCache[id]) return urlCache[id];
    const rec = await OA.db.get('photos', id).catch(() => null); if (!rec) return null;
    return (urlCache[id] = OA.photo.url(rec));
  }
  function hydrate(root) {
    (root || document).querySelectorAll('img[data-ph]').forEach(im => { photoUrl(im.dataset.ph).then(u => { if (u) im.src = u; else im.closest('.exq-ph') && im.closest('.exq-ph').remove(); }).catch(() => { }); });
  }
  const fullPhoto = async id => { const rec = await OA.db.get('photos', id).catch(() => null); return rec ? OA.photo.fullUrl(rec) : null; };

  /* ---------- styles (injected: this module does not own css/app.css) ---------- */
  (function css() {
    if (document.getElementById('exq-css')) return;
    const st = document.createElement('style'); st.id = 'exq-css';
    st.textContent = `
.exq-nav{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;margin:0 -2px;-webkit-overflow-scrolling:touch}
.exq-nav button{flex:none;min-height:44px;padding:0 14px;border-radius:22px;border:1px solid var(--line);background:var(--panel);color:var(--dim);font:inherit;font-size:.92rem}
.exq-nav button.on{background:var(--gold2);color:#1a1405;border-color:var(--gold2);font-weight:700}
.exq-lv{display:flex;align-items:center;gap:14px}
.exq-lvn{flex:none;width:64px;height:64px;border-radius:50%;border:3px double var(--gold);display:grid;place-items:center;font-size:1.7rem;font-weight:700;color:var(--gold);background:var(--panel2)}
.exq-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.exq-b{border:1px solid var(--line);background:var(--panel2);border-radius:14px;padding:10px 4px 8px;text-align:center;font:inherit;color:var(--text);min-height:44px}
.exq-b .m{width:52px;height:52px;margin:0 auto 6px;border-radius:50%;display:grid;place-items:center;border:2px solid var(--gold);background:radial-gradient(circle at 35% 30%,#f3d98f,var(--gold2) 70%);color:#2a1f05}
.exq-b .m svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.exq-b b{display:block;font-size:.8rem;line-height:1.2}.exq-b span{display:block;font-size:.74rem;color:var(--dim);margin-top:2px;line-height:1.25}
.exq-b.lock{opacity:.55;border-style:dashed}.exq-b.lock .m{background:var(--panel);border-color:var(--line);color:var(--dim)}
.exq-shelf{border-bottom:5px solid #3a2a12;padding-bottom:4px;margin-bottom:12px;border-radius:2px}
.exq-stamps{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.exq-stamp{position:relative;text-align:center;padding:10px 6px;border-radius:12px;background:var(--panel2);border:1px solid var(--line);font:inherit;color:var(--text);width:100%}
.exq-ring{width:132px;height:132px;margin:2px auto 6px;border-radius:50%;border:3px double var(--gold);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--gold);padding:10px;box-shadow:inset 0 0 0 5px rgba(217,180,90,.12);opacity:.95}
.exq-ring .st{font-size:1.5rem;font-weight:700;letter-spacing:.08em;line-height:1}.exq-ring .nm{font-size:.78rem;line-height:1.15;margin:3px 0;max-width:100px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.exq-ring .dt{font-size:.74rem;letter-spacing:.04em;border-top:1px solid var(--gold2);padding-top:3px}
.exq-ph img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;border:1px solid var(--line);display:block;margin-top:4px}
.exq-q{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line);padding:11px 0;font:inherit;color:var(--text);min-height:48px}
.exq-q:last-child{border:0}.exq-q .bx{flex:none;width:26px;height:26px;border-radius:8px;border:2px solid var(--gold2);display:grid;place-items:center;margin-top:1px}
.exq-q .bx svg{width:18px;height:18px;fill:none;stroke:#1a1405;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;display:none}
.exq-q.done .bx{background:var(--gold2)}.exq-q.done .bx svg{display:block}.exq-q.done b{text-decoration:line-through;color:var(--dim)}
.exq-q .tx{flex:1;min-width:0}.exq-q b{display:block}.exq-q .tx>span{display:block;font-size:.84rem;color:var(--dim)}
.exq-vote{display:flex;gap:6px;margin:6px 0}.exq-vote button{flex:1;min-height:44px;border-radius:10px;border:1px solid var(--line);background:var(--panel);color:var(--dim);font:inherit;font-size:.86rem}
.exq-vote button.on{border-color:var(--gold2);background:var(--gold2);color:#1a1405;font-weight:700}
.exq-ban{border-color:var(--gold2)}.exq-ban ol{margin:6px 0 6px 18px;padding:0}.exq-ban li{margin:4px 0;font-size:.92rem}
.exq-log{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:.9rem}
`;
    document.head.appendChild(st);
  })();

  /* ---------- welcome ---------- */
  function welcomeBody() {
    return `<ol>${D.welcome.map(l => `<li>${esc(l)}</li>`).join('')}</ol>
      <div class="sm dim">${esc(D.note)}</div>
      ${D.noteLink ? `<div class="sm" style="margin-top:6px"><a class="lnk" href="${esc(D.noteLink.url)}" target="_blank" rel="noopener">${esc(D.noteLink.label)}</a></div>` : ''}`;
  }
  function welcomeBanner() {
    return `<section class="card exq-ban" id="exq-welcome"><div class="ct"><span>Welcome to Expandica</span><span class="sm dim">${OA.icon('home')}</span></div>
      <div class="sm dim">One small parcel at a time, your family grows a chain of places to stop.</div>${welcomeBody()}
      <button class="btn gold block" data-act="exqWelcomeOk">Got it, let's go</button></section>`;
  }
  OA.on('render', () => {
    try {
      const s = ensure(), v = OA.$('#view'); if (!v) return;
      if (!s.welcomed && !OA.$('#exq-welcome', v)) v.insertAdjacentHTML('afterbegin', welcomeBanner());
      hydrate(v);
    } catch (e) { console.error(e); }
  });

  /* ---------- household card ---------- */
  function householdHTML() {
    const O = window.OCC; if (!O || !O.get) return '';
    const g = k => { try { return O.get(k); } catch (e) { return null; } };
    const rows = [], miss = [], ago = o => o && o.ts ? ' <span class="xs dim">' + esc(O.ago ? O.ago(o.ts) : '') + '</span>' : '';
    const camp = g('campica'), rt = g('roadtripica'), bp = g('backpackica'), sat = g('saturnica'), hl = g('healthica');
    const nm = { campica: 'Campica', roadtripica: 'Roadtripica', backpackica: 'Backpackica', saturnica: 'Saturnica', healthica: 'Healthica' };
    if (camp && camp.data) {
      const n = camp.data.next;
      rows.push(`<div class="li" style="cursor:default"><span class="ic">${OA.icon('tent')}</span><div class="tx"><b>Campica</b><span>${n && n.place ? 'Next trip: ' + esc(n.place) + (n.from ? ', ' + esc(OA.fmtDate(n.from)) : '') + (n.nights ? ' · ' + esc(n.nights) + ' nights' : '') : 'No trip planned yet'}</span></div><span class="end">${ago(camp)}</span></div>`);
    } else miss.push('campica');
    if (rt && rt.data) {
      const t = rt.data.trip; let extra = '';
      try { const c = window.EX && EX.circuit ? EX.circuit() : null; if (c && c.stops.length > 1) extra = '<br>Your stops form a loop of about ' + esc(OA.dist(c.miles, 0)) + ' (straight-line estimate).'; } catch (e) { }
      rows.push(`<div class="li" style="cursor:default"><span class="ic">${OA.icon('car')}</span><div class="tx"><b>Roadtripica</b><span>${t && t.name ? esc(t.name) + (typeof t.miles === 'number' ? ' · ' + esc(OA.dist(t.miles, 0)) : '') + (t.days ? ' · ' + esc(t.days) + ' days' : '') : 'No trip planned yet'}${extra}</span></div><span class="end">${ago(rt)}</span></div>`);
    } else miss.push('roadtripica');
    if (bp && bp.data) {
      const d = bp.data;
      rows.push(`<div class="li" style="cursor:default"><span class="ic">${OA.icon('boot')}</span><div class="tx"><b>Backpackica</b><span>${d.trail ? esc(d.trail) + (typeof d.milesTotal === 'number' ? ' · ' + esc(OA.dist(d.milesTotal, 0)) + ' so far' : '') : 'No trail started'}</span></div><span class="end">${ago(bp)}</span></div>`);
    } else miss.push('backpackica');
    if (sat && sat.data && (typeof sat.data.groceryWeek === 'number' || typeof sat.data.diningWeek === 'number')) {
      const d = sat.data;
      rows.push(`<div class="li" style="cursor:default"><span class="ic">${OA.icon('scale')}</span><div class="tx"><b>Saturnica</b><span>Weekly food spending published: ${typeof d.groceryWeek === 'number' ? 'groceries ' + esc(OA.money(d.groceryWeek)) : ''}${typeof d.diningWeek === 'number' ? ' · dining out ' + esc(OA.money(d.diningWeek)) : ''}. Your budget lives in Saturnica; look there, not here, for what fits.</span></div><span class="end">${ago(sat)}</span></div>`);
    } else if (!sat) miss.push('saturnica');
    const people = hl && hl.data && Array.isArray(hl.data.people) ? hl.data.people.filter(x => typeof x === 'string' && x.trim()) : [];
    const have = S().family.names, add = people.filter(x => !have.includes(x));
    return `<section class="card"><div class="ct"><span>Household</span><span class="sm dim">sister apps</span></div>
      ${rows.length ? rows.join('') : '<div class="sm dim">Nothing from the sister apps yet.</div>'}
      ${add.length ? `<div class="sm" style="margin-top:8px">Names Healthica shares: ${add.map(x => `<button class="mini" data-act="exqAddName" data-n="${esc(x)}">+ ${esc(x)}</button>`).join(' ')}</div>` : ''}
      <div class="sm dim" style="margin-top:8px"><b>Link household:</b> ${miss.length ? 'not linked yet: ' + miss.map(k => nm[k]).join(', ') + '. ' : ''}Open the other app, go to Menu > Household, and copy its link code, then paste it here under Menu > Household link. Apps installed from the same Occultica Household launcher link by themselves. Only a small summary is shared, never your land notes.</div>
      <button class="btn block" data-act="occOpen">Household link</button></section>`;
  }

  /* ---------- views ---------- */
  const SUBS = [['home', 'Home'], ['quests', 'Quests'], ['badges', 'Badges'], ['passport', 'Passport'], ['save', 'Savings'], ['family', 'Family']];
  let sub = 'home', scoutPid = null, filter = 'open', draft = null;

  function levelCard() {
    const x = xp();
    return `<section class="hero"><div class="exq-lv"><div class="exq-lvn">${x.level.n}</div><div style="flex:1;min-width:0">
      <div class="sm dim">Family level</div><div style="font-size:1.25rem;font-weight:700;color:var(--gold)">${esc(x.level.name)}</div>
      <div class="bar" style="margin:6px 0 3px"><i style="width:${x.pct}%"></i></div>
      <div class="sm dim">${x.total} XP${x.next ? ' · ' + (x.next.xp - x.total) + ' to ' + esc(x.next.name) : ' · top level'}</div></div></div></section>`;
  }
  function nextQuests(n) {
    const se = seasonNow();
    return questsAll().filter(q => !qDone(q.id) && (q.kind !== 'season' || q.season === se)).sort((a, b) => (b.kind === 'season') - (a.kind === 'season')).slice(0, n);
  }
  function questRow(q) {
    const d = qDone(q.id), se = q.kind === 'season';
    return `<button class="exq-q ${d ? 'done' : ''}" data-act="exqQuest" data-id="${esc(q.id)}" aria-pressed="${d}"><span class="bx">${OA.icon('check')}</span><span class="tx"><b>${esc(q.t)}</b><span>${esc(q.d)}</span>
      <span><span class="tag g">+${q.xp} XP</span>${se ? `<span class="tag ${q.season === seasonNow() ? 'a' : ''}">${q.season === seasonNow() ? 'in season now' : esc(q.season)}</span>` : ''}${q.custom ? '<span class="tag">yours</span>' : ''}</span></span></button>`;
  }
  function homeView() {
    const s = ensure(), g = s.goals.savings, bd = Object.keys(s.goals.badges), last = bd.sort((a, b) => s.goals.badges[b] - s.goals.badges[a])[0];
    const lb = last ? BADGES.find(b => b.id === last) : null, nq = nextQuests(3), pp = s.goals.passport;
    const pc = g.goal > 0 ? OA.clamp(Math.round(g.saved / g.goal * 100), 0, 100) : 0;
    return `${levelCard()}
      <section class="card"><div class="ct"><span>Next quests</span><button class="mini" data-act="exqSub" data-v="quests">All quests</button></div>
        ${nq.length ? nq.map(questRow).join('') : '<div class="sm dim">Every open quest is done. Add your own on the Quests page.</div>'}</section>
      <section class="card"><div class="ct"><span>Trophy shelf</span><button class="mini" data-act="exqSub" data-v="badges">Open</button></div>
        <div class="sm">${bd.length} of ${BADGES.length} badges earned.${lb ? ' Latest: <b>' + esc(lb.t) + '</b>, ' + esc(dlabel(s.goals.badges[lb.id])) + '.' : ' Scout your first parcel to earn the first one.'}</div></section>
      <section class="card"><div class="ct"><span>Stop Passport</span><button class="mini" data-act="exqSub" data-v="passport">Open</button></div>
        <div class="sm">${pp.length ? pp.length + (pp.length === 1 ? ' night' : ' nights') + ' stamped.' : 'No nights stamped yet. When you sleep at a stop, stamp it here.'}</div></section>
      <section class="card"><div class="ct"><span>Savings goal</span><button class="mini" data-act="exqSub" data-v="save">Open</button></div>
        ${g.goal > 0 ? `<div class="meter"><div class="mt"><b>${esc(OA.money(g.saved))}</b><span>of ${esc(OA.money(g.goal))}</span></div><div class="bar"><i style="width:${pc}%"></i></div></div>` : '<div class="sm dim">No goal set. Pick a number together and a date.</div>'}</section>
      ${householdHTML()}
      <button class="btn block" data-act="exqHow">How Expandica works</button>
      ${window.OCC && OCC.ritualHTML ? (() => { try { return OCC.ritualHTML('expandica'); } catch (e) { return ''; } })() : ''}`;
  }
  function questsView() {
    const s = ensure(), all = questsAll(), done = all.filter(q => qDone(q.id)).length, se = seasonNow();
    const list = all.filter(q => filter === 'all' ? true : filter === 'done' ? qDone(q.id) : !qDone(q.id));
    const grpOrder = ['land', 'safe', 'build', 'trip', 'money', 'season', 'custom'], name = g => g === 'custom' ? 'Your own' : (D.groups[g] || g);
    const body = grpOrder.map(g => {
      const items = list.filter(q => q.grp === g).sort((a, b) => (b.kind === 'season' && b.season === se) - (a.kind === 'season' && a.season === se));
      return items.length ? `<section class="card"><div class="ct"><span>${esc(name(g))}</span><span class="sm dim">${items.length}</span></div>${items.map(questRow).join('')}</section>` : '';
    }).join('');
    return `<div class="sm dim" style="margin-bottom:8px">${done} of ${all.length} quests done. Tap a quest to check it off (tap again to undo).</div>
      <div class="chips" style="margin-bottom:10px">${[['open', 'To do'], ['done', 'Done'], ['all', 'All']].map(f => `<button class="chip ${filter === f[0] ? 'on' : ''}" data-act="exqFilter" data-v="${f[0]}">${f[1]}</button>`).join('')}</div>
      ${body || '<div class="card"><div class="sm dim">Nothing here yet.</div></div>'}
      <section class="card"><div class="ct"><span>Add your own quest</span></div><div class="row"><input class="in" id="exq-newq" maxlength="80" placeholder="e.g. Cook breakfast over the firepit" style="flex:1"><button class="btn gold" data-act="exqAddQuest">Add</button></div>
        ${s.quests.custom.length ? '<div class="sm dim" style="margin-top:6px">Your quests count for 10 XP each. To remove one, tap and hold: ' + s.quests.custom.map(c => `<button class="mini" data-act="exqDelQuest" data-id="${esc(c.id)}">remove "${esc(c.t.slice(0, 20))}"</button>`).join(' ') + '</div>' : ''}</section>`;
  }
  function badgesView() {
    const B = ensure().goals.badges, earned = BADGES.filter(b => B[b.id]).sort((a, b) => B[b.id] - B[a.id]), locked = BADGES.filter(b => !B[b.id]);
    const tile = (b, on) => `<div class="exq-b ${on ? '' : 'lock'}"><div class="m">${OA.icon(b.ic)}</div><b>${esc(b.t)}</b><span>${on ? esc(dlabel(B[b.id])) : esc(b.d)}</span></div>`;
    return `<div class="sm dim" style="margin-bottom:8px">${earned.length} of ${BADGES.length} earned. Badges come from what you do in the app, and each keeps the date you earned it.</div>
      <section class="card"><div class="ct"><span>Trophy shelf</span></div>${earned.length ? `<div class="exq-grid exq-shelf">${earned.map(b => tile(b, true)).join('')}</div>` : '<div class="sm dim">Empty for now. Save a parcel on the Map or Land tab to earn the first badge.</div>'}</section>
      <section class="card"><div class="ct"><span>Still to earn</span><span class="sm dim">${locked.length}</span></div>${locked.length ? `<div class="exq-grid">${locked.map(b => tile(b, false)).join('')}</div>` : '<div class="sm">You have every badge. Wow.</div>'}</section>`;
  }
  function stampHTML(e, i, total) {
    const rot = (hash(e.id) % 13) - 6, n = total - i;
    return `<button class="exq-stamp" data-act="exqStamp" data-id="${esc(e.id)}" aria-label="Stamp: ${esc(e.name)}"><div class="exq-ring" style="transform:rotate(${rot}deg)"><div class="st">${esc((e.state || '').slice(0, 3).toUpperCase() || 'NIGHT')}</div><div class="nm">${esc(e.name || 'A stop')}</div><div class="dt">${esc(e.d ? OA.fmtDate(e.d, { month: 'short', day: 'numeric', year: 'numeric' }) : '')}</div></div>
      <div class="xs dim">Night ${n}</div>${e.photo ? `<div class="exq-ph"><img data-ph="${esc(e.photo)}" alt="Photo from ${esc(e.name)}"></div>` : ''}</button>`;
  }
  function passportView() {
    const pp = ensure().goals.passport.slice().sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : (b.ts || 0) - (a.ts || 0)));
    const states = new Set(pp.map(e => e.state).filter(Boolean)).size, places = new Set(pp.map(e => e.pid || e.name)).size;
    return `<section class="card"><div class="ct"><span>Stop Passport</span></div>
      <div class="stat"><div><b>${pp.length}</b><span>nights</span></div><div><b>${places}</b><span>places</span></div><div><b>${states}</b><span>states</span></div></div>
      <button class="btn gold block" data-act="exqPassNew" data-smoke>Stamp a night</button></section>
      ${pp.length ? `<div class="exq-stamps">${pp.map((e, i) => stampHTML(e, i, pp.length)).join('')}</div>` : '<section class="card tip"><div class="sm">Nothing stamped yet. When the family sleeps at a stop (with the owner\'s permission, always), tap "Stamp a night" and add a photo and one line about it.</div></section>'}`;
  }
  function saveView() {
    const g = ensure().goals.savings, left = (g.goal || 0) - (g.saved || 0), pc = g.goal > 0 ? OA.clamp(Math.round(g.saved / g.goal * 100), 0, 100) : 0;
    let plan = '';
    if (!(g.goal > 0)) plan = 'Enter a goal to see the numbers.';
    else if (left <= 0) plan = 'You have reached the goal you set. Well done.';
    else if (!g.target) plan = 'Pick a target date to see a monthly figure.';
    else {
      const days = OA.daysBetween(OA.dkey(), g.target);
      if (days < 0) plan = 'The target date has passed. Pick a new date to see a monthly figure.';
      else { const months = Math.max(1, days / 30.44), per = Math.ceil(left / months); plan = `About <b>${esc(OA.money(per))} a month</b> for ${days < 31 ? 'the last stretch' : (Math.round(months * 10) / 10) + ' months'} to put away ${esc(OA.money(left))} more by ${esc(OA.fmtDate(g.target, { month: 'short', day: 'numeric', year: 'numeric' }))}.`; }
    }
    return `<section class="card"><div class="ct"><span>Land and cabin fund</span></div>
      ${g.goal > 0 ? `<div class="meter"><div class="mt"><b class="big-num" style="font-size:1.7rem">${esc(OA.money(g.saved))}</b><span>of ${esc(OA.money(g.goal))} · ${pc}%</span></div><div class="bar"><i style="width:${pc}%"></i></div></div>` : ''}
      <div class="alert ok" style="margin:8px 0"><b class="t">Monthly target</b>${plan}</div>
      <div class="two"><label class="fl">Goal ($)<input class="in" type="number" inputmode="decimal" min="0" data-bind="ex.goals.savings.goal" data-type="number" data-then="exqRefresh" value="${g.goal || ''}"></label>
      <label class="fl">Saved so far ($)<input class="in" type="number" inputmode="decimal" data-bind="ex.goals.savings.saved" data-type="number" data-then="exqRefresh" value="${g.saved || ''}"></label></div>
      <label class="fl">Target date<input class="in" type="date" data-bind="ex.goals.savings.target" data-then="exqRefresh" value="${esc(g.target || '')}"></label>
      <div class="sm dim" style="margin-top:6px">This is only the amount left divided by the months left. It ignores interest, fees, taxes and surprise costs, and it is not financial advice. Decide with your own budget.</div></section>
    <section class="card"><div class="ct"><span>Add to the fund</span></div>
      <div class="two"><label class="fl">Amount ($)<input class="in" id="exq-amt" type="number" inputmode="decimal" placeholder="25"></label><label class="fl">Note<input class="in" id="exq-note" maxlength="60" placeholder="birthday money"></label></div>
      <button class="btn gold block" data-act="exqContribute">Add to saved</button>
      <div class="xs dim" style="margin-top:4px">Use a minus sign to take money out.</div></section>
    <section class="card"><div class="ct"><span>Log</span><span class="sm dim">${g.log.length}</span></div>${g.log.length ? g.log.slice(0, 30).map(e => `<div class="exq-log"><div><b>${e.amt < 0 ? '-' : '+'}${esc(OA.money(Math.abs(e.amt)))}</b> <span class="sm dim">${esc(OA.fmtDate(e.d, { month: 'short', day: 'numeric' }))}${e.note ? ' · ' + esc(e.note) : ''}</span></div><button class="mini" data-act="exqDelContrib" data-id="${esc(e.id)}" aria-label="Remove entry">Remove</button></div>`).join('') : '<div class="sm dim">Nothing logged yet.</div>'}</section>`;
  }
  function familyView() {
    const s = ensure(), names = s.family.names, ps = parcels();
    if (!scoutPid || !ps.find(p => p.id === scoutPid)) scoutPid = ps[0] ? ps[0].id : null;
    const p = ps.find(x => x.id === scoutPid);
    const nameCard = `<section class="card"><div class="ct"><span>Our family</span><span class="sm dim">${names.length}</span></div>
      ${names.length ? names.map(n => `<div class="exq-log"><b>${esc(n)}</b><button class="mini" data-act="exqDelName" data-n="${esc(n)}">Remove</button></div>`).join('') : '<div class="sm dim">Add each family member\'s first name. Each one gets a scout card for every parcel.</div>'}
      <div class="row" style="margin-top:8px"><input class="in" id="exq-name" maxlength="24" placeholder="First name" style="flex:1"><button class="btn gold" data-act="exqAddName">Add</button></div></section>`;
    let scout;
    if (!ps.length) scout = '<section class="card tip"><div class="sm">Save a parcel on the Map or Land tab and it will show up here for scouting.</div></section>';
    else if (!names.length) scout = '<section class="card tip"><div class="sm">Add family names above to start the scout cards.</div></section>';
    else {
      const sc = p.scout || {}, tally = { love: 0, maybe: 0, pass: 0 }; names.forEach(n => { const v = sc[n] && sc[n].vote; if (tally[v] != null) tally[v]++; });
      scout = `<section class="card"><div class="ct"><span>Scout cards</span></div>
        <label class="fl">Parcel<select class="in" data-onchange="exqScoutPick" id="exq-sp">${ps.map(x => `<option value="${esc(x.id)}" ${x.id === scoutPid ? 'selected' : ''}>${esc(x.name)}${x.state ? ', ' + esc(x.state) : ''}</option>`).join('')}</select></label>
        <div class="sm" style="margin:6px 0">Family vote: <span class="tag g">${tally.love} love it</span><span class="tag w">${tally.maybe} maybe</span><span class="tag r">${tally.pass} not for us</span></div>
        <div class="sm dim">A friendly family vote, not a verdict on the land.</div></section>
        ${names.map(n => { const c = sc[n] || {}; return `<section class="card inner"><div class="ct"><span>${esc(n)}'s scout card</span></div>
          <div class="exq-vote">${[['love', 'Love it'], ['maybe', 'Maybe'], ['pass', 'Not for us']].map(v => `<button class="${c.vote === v[0] ? 'on' : ''}" data-act="exqVote" data-pid="${esc(p.id)}" data-n="${esc(n)}" data-v="${v[0]}">${v[1]}</button>`).join('')}</div>
          <label class="fl">${esc(D.scoutPrompts ? D.scoutPrompts[0] : 'Pros')}<textarea class="in" rows="2" maxlength="300" data-onchange="exqScoutText" data-pid="${esc(p.id)}" data-n="${esc(n)}" data-f="pro">${esc(c.pro || '')}</textarea></label>
          <label class="fl">${esc(D.scoutPrompts ? D.scoutPrompts[1] : 'Cons')}<textarea class="in" rows="2" maxlength="300" data-onchange="exqScoutText" data-pid="${esc(p.id)}" data-n="${esc(n)}" data-f="con">${esc(c.con || '')}</textarea></label></section>`; }).join('')}`;
    }
    return nameCard + scout;
  }

  OA.tab({
    id: 'quests', label: 'Quests', icon: 'star', order: 5,
    render() {
      syncBadges(); const x = xp();
      const nav = `<div class="exq-nav" role="tablist">${SUBS.map(t => `<button class="${sub === t[0] ? 'on' : ''}" data-act="exqSub" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>`;
      const body = ({ home: homeView, quests: questsView, badges: badgesView, passport: passportView, save: saveView, family: familyView }[sub] || homeView)();
      return OA.header('Quests', 'Level ' + x.level.n + ' · ' + x.level.name + ' · ' + x.total + ' XP') + nav + body;
    }
  });

  /* ---------- passport sheet ---------- */
  function passSheetHTML() {
    const ps = parcels(), d = draft;
    const sorted = ps.slice().sort((a, b) => sidx(b.stage) - sidx(a.stage));
    return `<label class="fl">Where did you sleep?<select class="in" id="exq-pp">${sorted.map(p => `<option value="${esc(p.id)}" ${d.pid === p.id ? 'selected' : ''}>${esc(p.name)}${p.state ? ', ' + esc(p.state) : ''}</option>`).join('')}<option value="" ${!d.pid ? 'selected' : ''}>Another place (type the name)</option></select></label>
      <label class="fl">Place name (if another place)<input class="in" id="exq-pn2" maxlength="40" value="${esc(d.place || '')}" placeholder="e.g. Lake campground"></label>
      <label class="fl">Date<input class="in" type="date" id="exq-pd" value="${esc(d.d)}"></label>
      <label class="fl">One line about the night<textarea class="in" id="exq-pt" rows="2" maxlength="200" placeholder="Saw the Milky Way. Marshmallows were perfect.">${esc(d.note || '')}</textarea></label>
      <div class="row" style="align-items:center"><button class="btn" data-act="exqPassPhoto">${d.photo ? 'Change photo' : 'Add a photo'}</button>${d.photo ? `<span class="exq-ph" style="width:90px"><img data-ph="${esc(d.photo)}" alt="Chosen photo"></span>` : ''}</div>
      <button class="btn gold block" data-act="exqPassSave" style="margin-top:12px">Save stamp</button>`;
  }
  function readDraft() {
    const r = OA.sheetBody(); if (!r || !draft) return;
    const v = id => { const e = r.querySelector('#' + id); return e ? e.value : ''; };
    draft.pid = v('exq-pp'); draft.place = v('exq-pn2'); draft.d = v('exq-pd') || draft.d; draft.note = v('exq-pt');
  }

  /* ---------- actions ---------- */
  const find = id => parcels().find(p => p.id === id);
  OA.act({
    exqSub(el) { sub = el.dataset.v || 'home'; OA.render(); window.scrollTo(0, 0); },
    exqFilter(el) { filter = el.dataset.v; OA.render(true); },
    exqRefresh() { syncBadges(); OA.render(true); },
    exqWelcomeOk() { const s = ensure(); s.welcomed = true; s.ack = true; OA.save(); OA.render(true); },
    exqHow() { OA.sheet('How Expandica works', welcomeBody()); },
    exqQuest(el) {
      const s = ensure(), id = el.dataset.id, q = questsAll().find(x => x.id === id); if (!q) return;
      if (s.quests.done[id]) { delete s.quests.done[id]; OA.save(); OA.toast('Unchecked'); }
      else { s.quests.done[id] = Date.now(); OA.save(); const f = syncBadges(true); OA.toast('+' + q.xp + ' XP: ' + q.t + (f.length ? ' · Badge: ' + f[0].t : '')); }
      OA.render(true);
    },
    exqAddQuest() {
      const i = OA.$('#exq-newq'), t = i && i.value.trim(); if (!t) { OA.toast('Type a quest first'); return; }
      ensure().quests.custom.push({ id: 'c' + OA.uid(), t: t.slice(0, 80) }); OA.save(); OA.render(true);
    },
    async exqDelQuest(el) {
      if (!await OA.confirm('Remove this quest of yours?', 'Remove')) return;
      const s = ensure(); s.quests.custom = s.quests.custom.filter(c => c.id !== el.dataset.id); delete s.quests.done[el.dataset.id]; OA.save(); OA.render(true);
    },
    exqAddName(el) {
      const s = ensure(); let n = el && el.dataset && el.dataset.n; if (!n) { const i = OA.$('#exq-name'); n = i && i.value; }
      n = String(n || '').trim().slice(0, 24); if (!n) { OA.toast('Type a first name'); return; }
      if (s.family.names.some(x => x.toLowerCase() === n.toLowerCase())) { OA.toast(n + ' is already on the list'); return; }
      s.family.names.push(n); OA.save(); syncBadges(); OA.render(true);
    },
    async exqDelName(el) {
      if (!await OA.confirm('Remove ' + el.dataset.n + '? Their scout cards stay saved if you add the name again.', 'Remove')) return;
      const s = ensure(); s.family.names = s.family.names.filter(x => x !== el.dataset.n); OA.save(); OA.render(true);
    },
    exqScoutPick(el) { scoutPid = el.value; OA.render(true); },
    exqVote(el) {
      const p = find(el.dataset.pid); if (!p) return; p.scout = p.scout || {}; const c = p.scout[el.dataset.n] = p.scout[el.dataset.n] || {};
      c.vote = c.vote === el.dataset.v ? '' : el.dataset.v; c.ts = Date.now(); OA.save(); syncBadges(); OA.render(true);
    },
    exqScoutText(el) {
      const p = find(el.dataset.pid); if (!p) return; p.scout = p.scout || {}; const c = p.scout[el.dataset.n] = p.scout[el.dataset.n] || {};
      c[el.dataset.f] = el.value.trim().slice(0, 300); c.ts = Date.now(); OA.save(); syncBadges();
    },
    exqContribute() {
      const a = OA.$('#exq-amt'), n = OA.$('#exq-note'), amt = a ? parseFloat(a.value) : NaN;
      if (!isFinite(amt) || amt === 0) { OA.toast('Enter an amount'); return; }
      const g = ensure().goals.savings; g.saved = Math.round(((g.saved || 0) + amt) * 100) / 100;
      g.log.unshift({ id: OA.uid(), ts: Date.now(), d: OA.dkey(), amt, note: n ? n.value.trim().slice(0, 60) : '' });
      OA.save(); syncBadges(); OA.toast(amt > 0 ? 'Added ' + OA.money(amt) : 'Took out ' + OA.money(-amt)); OA.render(true);
    },
    async exqDelContrib(el) {
      const g = ensure().goals.savings, e = g.log.find(x => x.id === el.dataset.id); if (!e) return;
      if (!await OA.confirm('Remove this entry and take ' + OA.money(e.amt) + ' off the saved total?', 'Remove')) return;
      g.saved = Math.round(((g.saved || 0) - e.amt) * 100) / 100; g.log = g.log.filter(x => x.id !== e.id); OA.save(); OA.render(true);
    },
    exqPassNew() {
      const ps = parcels().slice().sort((a, b) => sidx(b.stage) - sidx(a.stage));
      draft = { pid: ps[0] ? ps[0].id : '', place: '', d: OA.dkey(), note: '', photo: null };
      OA.sheet('Stamp a night', passSheetHTML(), { onOpen: hydrate });
    },
    async exqPassPhoto() {
      readDraft(); const rec = await OA.photo.pick({ tag: 'passport', note: 'Stop Passport' });
      if (rec) draft.photo = rec.id; OA.redrawSheet(passSheetHTML()); hydrate(OA.sheetBody());
    },
    exqPassSave() {
      readDraft(); const p = find(draft.pid), name = p ? p.name : draft.place.trim();
      if (!name) { OA.toast('Choose a parcel or type a place name'); return; }
      ensure().goals.passport.push({ id: OA.uid(), ts: Date.now(), pid: p ? p.id : '', name, state: p ? (p.state || '') : '', d: draft.d || OA.dkey(), note: draft.note.trim().slice(0, 200), photo: draft.photo || null });
      OA.save(); const f = syncBadges(true); draft = null; OA.closeSheet(); OA.toast('Stamped! +40 XP' + (f.length ? ' · Badge: ' + f[0].t : ''));
    },
    exqStamp(el) {
      const e = ensure().goals.passport.find(x => x.id === el.dataset.id); if (!e) return;
      OA.sheet('Passport stamp', `<div class="exq-stamps" style="grid-template-columns:1fr">${stampHTML(e, 0, 1).replace('data-act="exqStamp"', '')}</div>
        <div class="sm" style="margin:10px 0">${e.note ? esc(e.note) : '<span class="dim">No note.</span>'}</div>
        ${e.photo ? '<button class="btn block" data-act="exqPhotoBig" data-id="' + esc(e.photo) + '">View the photo larger</button>' : ''}
        <button class="btn danger block" data-act="exqDelStamp" data-id="${esc(e.id)}">Remove this stamp</button>`, { onOpen: hydrate });
    },
    async exqPhotoBig(el) { const u = await fullPhoto(el.dataset.id); if (u) OA.sheet('Photo', `<img src="${u}" alt="Stamp photo" style="width:100%;border-radius:10px">`); else OA.toast('Photo not found'); },
    async exqDelStamp(el) {
      if (!await OA.confirm('Remove this stamp? XP and any badge dates already earned stay.', 'Remove')) return;
      const s = ensure(), e = s.goals.passport.find(x => x.id === el.dataset.id);
      s.goals.passport = s.goals.passport.filter(x => x.id !== el.dataset.id);
      if (e && e.photo) { try { await OA.photo.del(e.photo); } catch (x) { } }
      OA.save(); OA.closeSheet();
    }
  });

  /* ---------- react to parcel changes ---------- */
  if (window.EX && EX.on) { const f = () => { try { ensure(); syncBadges(); } catch (e) { } }; EX.on('stage', f); EX.on('parcel', f); }
  OA.on('started', () => { try { syncBadges(true); } catch (e) { } });
})();
