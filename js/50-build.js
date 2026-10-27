/* Expandica Build tab (EXB): staged cabin checklist, permit path, fire safety, kits, cost planner.
   Progress is saved per parcel in p.cabin.{steps,kit,closing,costs,contingency,permit}; with no parcel a scratch copy is used (ex.buildScratch). */
window.EXB = window.EXB || {};
(function () {
  'use strict';
  const esc = OA.esc, D = () => window.EXB_DATA || { stages: [], links: {}, permit: { steps: [], ask: [], facts: [] }, fire: { beforeEvery: [], siteRules: [], out: [], pit: { steps: [] }, wood: [], ready: [], links: [] }, foundations: [], kit: [], closing: [], costNames: [], sources: [] };
  OA.defaults({ ex: { buildSel: '', buildSec: 'list', buildOpen: {}, buildAck: false, buildScratch: { steps: {}, kit: {}, closing: {}, costs: [], contingency: 15, permit: { office: '', phone: '', date: '', notes: '' } } } });
  const S = () => OA.S.ex;
  const SECS = [['list', 'Checklist'], ['permit', 'Permit path'], ['fire', 'Fire'], ['kits', 'Kits'], ['cost', 'Costs'], ['log', 'Log'], ['care', 'Care']];
  const parcels = () => (window.EX && EX.parcels) ? EX.parcels.list() : [];

  /* the cabin object being worked on */
  function cab() {
    const ps = parcels(); let p = ps.find(x => x.id === S().buildSel) || null;
    if (!p && S().buildSel !== '__none' && ps.length) {
      const own = ps.filter(x => EX.stageIdx(x.stage) >= EX.stageIdx('owned'));
      p = own[0] || ps[0];
    }
    let c, base;
    if (p) { p.cabin = p.cabin || {}; c = p.cabin; base = 'ex.parcels.' + ps.indexOf(p) + '.cabin'; }
    else { c = S().buildScratch; base = 'ex.buildScratch'; }
    c.steps = c.steps || {}; c.kit = c.kit || {}; c.closing = c.closing || {}; c.costs = c.costs || [];
    if (c.contingency == null) c.contingency = 15;
    c.log = c.log || []; c.materials = c.materials || [];
    c.permit = c.permit || { office: '', phone: '', date: '', notes: '' };
    return { p, c, base };
  }
  const lnk = (url, label, cls) => `<a class="${cls || ''}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
  function srcLine(key) {
    const l = D().links[key]; if (!l) return '';
    return `<div class="xs dim">Source: ${lnk(l.url, l.who)} · read ${esc(l.asof)}</div>`;
  }
  const money = n => '$' + (Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ---------- checklist ---------- */
  function stageCount(st, c) { const n = st.steps.length, d = st.steps.filter(s => c.steps[s.id]).length; return { n, d }; }
  function secList(cx) {
    const { c } = cx, data = D(); let tn = 0, td = 0;
    data.stages.forEach(st => { const k = stageCount(st, c); tn += k.n; td += k.d; });
    const open = S().buildOpen || {};
    return `<div class="card"><div class="ct"><b>Cabin build checklist</b><span class="tag ${td === tn && tn ? 'g' : ''}">${td} of ${tn}</span></div>
      <div class="bar"><i style="width:${tn ? Math.round(td / tn * 100) : 0}%"></i></div>
      <p class="sm dim" style="margin:8px 0 0">Work top to bottom. The gold "Ask first" lines are questions for the office that decides, not answers. Your ticks are saved on this phone for ${cx.p ? esc(cx.p.name) : 'this scratch list'}.</p>
      <div class="row"><button class="btn mini" data-act="exbFound" data-smoke>Foundation types</button><button class="btn mini" data-act="exbOpenAll">${Object.keys(open).length >= data.stages.length ? 'Collapse all' : 'Open all'}</button></div></div>` +
      data.stages.map(st => {
        const k = stageCount(st, c), isOpen = !!open[st.id];
        let h = `<div class="card"><button class="row" style="width:100%;background:none;border:0;color:inherit;font:inherit;text-align:left;padding:4px 0;min-height:44px;align-items:center" data-act="exbToggle" data-id="${esc(st.id)}" aria-expanded="${isOpen}">${OA.icon(st.ic || 'tools', 'sm')}<b style="flex:1;margin-left:8px">${esc(st.t)}</b><span class="tag ${k.d === k.n ? 'g' : ''}">${k.d}/${k.n}</span><span class="dim" style="margin-left:6px">${isOpen ? '▾' : '▸'}</span></button>`;
        if (isOpen) {
          if (st.link) h += `<div class="row"><button class="btn mini gold" data-go="${esc(st.link.go)}">${esc(st.link.label)}</button></div>`;
          h += st.steps.map(s => `<label class="chk" style="align-items:flex-start;border-top:1px solid var(--line);padding:10px 0"><input type="checkbox" data-onchange="exbStep" data-id="${esc(s.id)}" ${c.steps[s.id] ? 'checked' : ''}><span style="flex:1"><b>${esc(s.t)}</b>${s.typ ? ' <span class="tag w">typical, check local code</span>' : ''}${s.pro ? ` <span class="tag r">Licensed pro: ${esc(s.pro)}</span>` : ''}
            <span class="sm dim" style="display:block;margin-top:2px">${esc(s.d)}</span>${s.ask ? `<span class="sm gold" style="display:block;margin-top:3px"><b>Ask first:</b> ${esc(s.ask)}</span>` : ''}${s.src ? srcLine(s.src) : ''}</span></label>`).join('');
        }
        return h + '</div>';
      }).join('');
  }
  function foundSheet() {
    const f = D().foundations;
    return `<p class="sm dim">Typical trade-offs, written in general terms. Footing depth, accepted types and loads are set by your local building department, so ask before you choose.</p>` +
      f.map(x => `<div class="card inner"><b>${esc(x.t)}</b><p class="sm" style="margin:4px 0"><b class="green">Good for:</b> ${esc(x.good)}</p><p class="sm" style="margin:4px 0"><b class="warn">Watch for:</b> ${esc(x.watch)}</p><p class="sm" style="margin:4px 0"><b>Climate and ground:</b> ${esc(x.clim)}</p></div>`).join('') +
      `<div class="alert"><b class="t">Ask first: building department</b>Which foundation types are accepted for a small cabin here? What is the frost depth? Do I need an engineer?</div><p class="xs dim">Typical guidance, not verified for any place. Check local code.</p>`;
  }

  /* ---------- permit path ---------- */
  function secPermit(cx) {
    const P = D().permit, pm = cx.c.permit, b = cx.base + '.permit';
    return `<div class="card"><div class="ct"><b>Permit path</b></div><p class="sm">${esc(P.intro)}</p>
      <div class="alert"><b class="t">Ask the county</b>Phone or visit the building and planning offices for the exact parcel number or address. Get answers in writing. Rules for owner-builders, exemptions and septic differ from place to place.</div></div>
      <div class="card"><div class="ct"><b>How to find out</b></div>${P.steps.map((s, i) => `<div class="li" style="align-items:flex-start;padding:8px 0"><div class="ic"><span class="tag g">${i + 1}</span></div><div class="tx"><b>${esc(s.t)}</b><div class="sm dim">${esc(s.d)}</div></div></div>`).join('')}</div>
      <div class="card"><div class="ct"><b>Questions to ask</b></div><ol class="sm" style="padding-left:20px;margin:6px 0">${P.ask.map(q => `<li style="margin:4px 0">${esc(q)}</li>`).join('')}</ol>
        <div class="row"><button class="btn mini" data-act="exbShareQ" data-smoke>Share or copy this list</button></div></div>
      <div class="card"><div class="ct"><b>Two verified facts</b></div>${P.facts.map(f => `<div style="padding:6px 0"><b>${esc(f.t)}</b><div class="sm dim">${esc(f.d)}</div><div class="xs dim">Source: ${lnk(f.url, D().links[f.src].who)} · read ${esc(f.asof)}</div></div>`).join('')}</div>
      <div class="card"><div class="ct"><b>My notes for ${cx.p ? esc(cx.p.name) : 'this list'}</b></div>
        <label class="fl">Office or person asked<input class="in" data-bind="${b}.office" value="${esc(pm.office)}" placeholder="e.g. county building department"></label>
        <div class="two"><label class="fl">Phone<input class="in" type="tel" data-bind="${b}.phone" value="${esc(pm.phone)}" placeholder="from the county website"></label>
        <label class="fl">Date asked<input class="in" type="date" data-bind="${b}.date" value="${esc(pm.date)}"></label></div>
        <label class="fl">What they said (size limits, permits, who, fees)<textarea class="in" rows="4" data-bind="${b}.notes" placeholder="Write the answers and the code section here">${esc(pm.notes)}</textarea></label></div>`;
  }
  function permitText() {
    const P = D().permit;
    return 'Questions to ask the county about a small cabin:\n' + P.ask.map((q, i) => (i + 1) + '. ' + q).join('\n');
  }

  /* ---------- fire ---------- */
  function secFire() {
    const F = D().fire, L = D().links;
    return `<div class="alert danger"><b class="t">Before every fire</b><ul class="sm" style="padding-left:18px;margin:4px 0">${F.beforeEvery.map(x => `<li style="margin:3px 0">${esc(x)}</li>`).join('')}</ul></div>
      <div class="card"><div class="ct"><b>Check these before you light up</b></div><p class="sm dim">Fire rules are local and change quickly. These national pages need signal. Your county, state fire agency and fire district decide what is allowed today.</p>
      ${F.links.map(k => { const l = L[k]; return `<div style="padding:8px 0;border-top:1px solid var(--line)"><div>${lnk(l.url, l.label, 'b')}</div><div class="sm dim">${esc(l.note)}</div><div class="xs dim">${esc(l.who)} · read ${esc(l.asof)}${l.unread ? ' · link named by NIFC, not opened by me' : ''}</div></div>`; }).join('')}
      <p class="sm" style="margin-top:8px"><b>Burn bans and state agencies.</b> ${esc(F.stateAgencies)}</p></div>
      <div class="card"><div class="ct"><b>Fire site rules</b></div>${F.siteRules.map(r => `<div style="padding:6px 0"><b>${esc(r.t)}</b><div class="sm dim">${esc(r.d)}</div></div>`).join('')}${srcLine('smokey')}</div>
      <div class="card"><div class="ct"><b>Putting it out: drown, stir, feel</b></div>${F.out.map((r, i) => `<div class="li" style="align-items:flex-start;padding:6px 0"><div class="ic"><span class="tag g">${i + 1}</span></div><div class="tx"><b>${esc(r.t)}</b><div class="sm dim">${esc(r.d)}</div></div></div>`).join('')}<p class="sm">${esc(F.ember)}</p>${srcLine(F.outSrc)}</div>
      <div class="card"><div class="ct"><b>Build a fire pit</b><span class="tag w">check local code</span></div><p class="sm dim">${esc(F.pit.note)}</p>${F.pit.steps.map((r, i) => `<div class="li" style="align-items:flex-start;padding:6px 0"><div class="ic"><span class="tag">${i + 1}</span></div><div class="tx"><b>${esc(r.t)}</b><div class="sm dim">${esc(r.d)}</div></div></div>`).join('')}</div>
      <div class="card"><div class="ct"><b>Wood storage</b><span class="tag w">typical</span></div><ul class="sm" style="padding-left:18px;margin:4px 0">${F.wood.map(x => `<li style="margin:4px 0">${esc(x)}</li>`).join('')}</ul></div>
      <div class="card"><div class="ct"><b>Wildfire: defensible space, Ready, Set, Go</b></div>${F.ready.map(r => `<div style="padding:6px 0"><b>${esc(r.t)}</b><div class="sm dim">${esc(r.d)}</div><div class="xs dim">Source: ${lnk(r.url, L[r.src].who)} · read ${esc(L[r.src].asof)}</div></div>`).join('')}</div>`;
  }

  /* ---------- kits ---------- */
  function checkList(items, map, act) {
    return items.map(i => `<label class="chk" style="align-items:flex-start"><input type="checkbox" data-onchange="${act}" data-id="${esc(i.id)}" ${map[i.id] ? 'checked' : ''}><span>${esc(i.t)}</span></label>`).join('');
  }
  function secKits(cx) {
    const d = D(), c = cx.c, k1 = d.kit.filter(i => c.kit[i.id]).length, k2 = d.closing.filter(i => c.closing[i.id]).length;
    return `<div class="card"><div class="ct"><b>First weekend on the land</b><span class="tag ${k1 === d.kit.length ? 'g' : ''}">${k1} of ${d.kit.length}</span></div><p class="sm dim">Pack list for a first visit. Adjust for your season, your family and what the rules let you do.</p>${checkList(d.kit, c.kit, 'exbKit')}<div class="row"><button class="btn mini" data-act="exbReset" data-w="kit">Untick all</button></div></div>
      <div class="card"><div class="ct"><b>Closing up</b><span class="tag ${k2 === d.closing.length ? 'g' : ''}">${k2} of ${d.closing.length}</span></div><p class="sm dim">Run this every time you leave, and in full for a winter close.</p>${checkList(d.closing, c.closing, 'exbClose')}<div class="row"><button class="btn mini" data-act="exbReset" data-w="closing">Untick all</button></div></div>`;
  }

  /* ---------- costs ---------- */
  function totals(c) {
    const lines = c.costs, priced = lines.filter(x => typeof x.amt === 'number' && !isNaN(x.amt)), sub = priced.reduce((s, x) => s + x.amt, 0);
    const pct = typeof c.contingency === 'number' ? c.contingency : 0, cont = sub * pct / 100;
    return { sub, pct, cont, total: sub + cont, unpriced: lines.length - priced.length };
  }
  function totBlock(c) {
    const t = totals(c);
    return `<div class="kv"><span>Subtotal (${c.costs.length - t.unpriced} priced ${c.costs.length - t.unpriced === 1 ? 'line' : 'lines'})</span><b id="exb-sub">${money(t.sub)}</b></div>
      <div class="kv"><span>Contingency (<span id="exb-pct">${esc(t.pct)}</span>%)</span><b id="exb-cont">${money(t.cont)}</b></div>
      <div class="kv"><span><b>Total with contingency</b></span><b class="gold" id="exb-tot">${money(t.total)}</b></div>
      <div class="xs dim" id="exb-un">${t.unpriced ? t.unpriced + ' line' + (t.unpriced === 1 ? '' : 's') + ' with no amount yet are not counted.' : ''}</div>`;
  }
  function secCost(cx) {
    const { c, base, p } = cx, d = D(), used = c.costs.map(x => x.label);
    return `<div class="card"><div class="ct"><b>Cost planner</b></div><p class="sm dim">Type your own numbers from quotes, receipts or the county fee schedule. The app has no prices of its own and never guesses them.</p>
      ${c.costs.length ? c.costs.map((x, i) => `<div class="row" style="align-items:flex-end"><label class="fl" style="flex:2;margin:0">Item<input class="in" data-bind="${base}.costs.${i}.label" value="${esc(x.label)}"></label><label class="fl" style="flex:1;margin:0">Amount $<input class="in" type="number" inputmode="decimal" min="0" step="any" data-bind="${base}.costs.${i}.amt" data-then="exbTot" value="${x.amt == null ? '' : esc(x.amt)}" placeholder="0"></label><button class="btn mini danger" style="flex:none;min-width:44px;padding:0 10px" data-act="exbCostDel" data-i="${i}" aria-label="Remove ${esc(x.label)}">×</button></div>`).join('') : '<p class="sm dim">No lines yet. Tap a suggestion below, or type your own.</p>'}
      <div class="row" style="align-items:flex-end;margin-top:10px"><label class="fl" style="flex:2;margin:0">New item<input class="in" id="exbNewL" placeholder="e.g. Foundation"></label><label class="fl" style="flex:1;margin:0">Amount $<input class="in" id="exbNewA" type="number" inputmode="decimal" min="0" step="any" placeholder="optional"></label><button class="btn gold" data-act="exbCostAdd" data-smoke>Add</button></div>
      <div class="chips wrap">${d.costNames.filter(n => used.indexOf(n) < 0).map((n, i) => `<button class="chip" data-act="exbCostPick" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div></div>
      <div class="card"><div class="ct"><b>Contingency</b></div><label class="fl">Contingency %<input class="in" type="number" inputmode="decimal" min="0" max="100" step="1" data-bind="${base}.contingency" data-then="exbTot" value="${esc(c.contingency)}"></label><p class="xs dim">Default 15% is a common rule of thumb for building surprises, not a verified figure for your project or place. Raise it for remote sites, hand-built work or unknown ground.</p></div>
      <div class="card hot" id="exb-totbox"><div class="ct"><b>Totals</b></div>${totBlock(c)}${p && typeof p.priceUsd === 'number' ? `<div class="kv"><span>Land price on file (not included)</span><b>${money(p.priceUsd)}</b></div>` : ''}<p class="xs dim">A planning tool only. Permits, taxes and quotes are for you to confirm.</p></div>`;
  }

  /* ---------- tab ---------- */
  OA.tab({
    id: 'build', label: 'Build', icon: 'home', order: 4,
    render() {
      const cx = cab(), sec = SECS.find(s => s[0] === S().buildSec) ? S().buildSec : 'list', ps = parcels();
      let h = OA.header('Build', 'Cabin, fire and first weekend');
      if (!S().buildAck) h += `<div class="card tip"><b>Read first</b><p class="sm" style="margin:4px 0">This tab is a planning aid, not legal, engineering or safety certification. Codes, permits and fire rules differ by county, state and fire district, so every step names who to ask. Do not do electrical, gas, chimney or structural work beyond your skill, or without a licensed pro where one is required. Facts here carry a source and the month I read it; "typical" means general practice that you must check locally.</p><div class="row"><button class="btn gold" data-act="exbAck">Got it</button></div></div>`;
      h += `<label class="fl">Parcel<select class="in" data-onchange="exbSel"><option value="__none" ${!cx.p ? 'selected' : ''}>No parcel (scratch list)</option>${ps.map(p => `<option value="${esc(p.id)}" ${cx.p && cx.p.id === p.id ? 'selected' : ''}>${esc(p.name)}${p.state ? ', ' + esc(p.state) : ''}</option>`).join('')}</select></label>`;
      if (!ps.length) h += `<div class="alert"><b class="t">No parcels yet</b>You can use this tab as a scratch list now. To save progress per parcel, add one in the Land tab. <div class="row"><button class="btn mini gold" data-go="land">Open Land</button></div></div>`;
      h += `<div class="chips wrap">${SECS.map(s => `<button class="chip ${s[0] === sec ? 'on' : ''}" data-act="exbSec" data-s="${s[0]}">${s[1]}</button>`).join('')}</div>`;
      h += sec === 'list' ? secList(cx) : sec === 'permit' ? secPermit(cx) : sec === 'fire' ? secFire() : sec === 'kits' ? secKits(cx) : sec === 'log' ? secLog(cx) : sec === 'care' ? secCare(cx) : secCost(cx);
      return h;
    }
  });

  /* ---------- actions ---------- */
  OA.act({
    exbAck() { S().buildAck = true; OA.save(); OA.render(true); },
    exbSec(el) { S().buildSec = el.dataset.s; OA.save(); OA.render(); window.scrollTo(0, 0); },
    exbSel(el) { S().buildSel = el.value; OA.save(); OA.render(); },
    exbToggle(el) { const o = S().buildOpen = S().buildOpen || {}; if (o[el.dataset.id]) delete o[el.dataset.id]; else o[el.dataset.id] = 1; OA.save(); OA.render(true); },
    exbOpenAll() { const st = D().stages; const o = S().buildOpen = S().buildOpen || {}; if (Object.keys(o).length >= st.length) S().buildOpen = {}; else st.forEach(x => o[x.id] = 1); OA.save(); OA.render(true); },
    exbStep(el) { const c = cab().c; if (el.checked) c.steps[el.dataset.id] = Date.now(); else delete c.steps[el.dataset.id]; OA.save(); OA.render(true); },
    exbKit(el) { const c = cab().c; if (el.checked) c.kit[el.dataset.id] = 1; else delete c.kit[el.dataset.id]; OA.save(); OA.render(true); },
    exbClose(el) { const c = cab().c; if (el.checked) c.closing[el.dataset.id] = 1; else delete c.closing[el.dataset.id]; OA.save(); OA.render(true); },
    async exbReset(el) { const w = el.dataset.w; if (!await OA.confirm('Untick every item in this list?', 'Untick')) return; cab().c[w] = {}; OA.save(); OA.render(true); },
    exbFound() { OA.sheet('Foundation types', foundSheet()); },
    exbShareQ() { return OA.share.send({ title: 'Questions for the county', text: permitText() }); },
    exbCostPick(el) { const i = document.getElementById('exbNewL'); if (i) { i.value = el.dataset.n; const a = document.getElementById('exbNewA'); if (a) a.focus(); } },
    exbCostAdd() {
      const l = document.getElementById('exbNewL'), a = document.getElementById('exbNewA'), label = (l && l.value || '').trim();
      if (!label) { OA.toast('Type what the cost is for first.'); if (l) l.focus(); return; }
      let amt = a && a.value !== '' ? parseFloat(a.value) : null; if (amt != null && (isNaN(amt) || amt < 0)) amt = null;
      cab().c.costs.push({ id: OA.uid(), label: label.slice(0, 80), amt }); OA.save(); OA.render(true);
    },
    async exbCostDel(el) { const c = cab().c, i = +el.dataset.i, x = c.costs[i]; if (!x) return; if (!await OA.confirm('Remove "' + x.label + '" from the cost list?', 'Remove')) return; c.costs.splice(i, 1); OA.save(); OA.render(true); },
    exbTot() {
      const c = cab().c, t = totals(c), set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
      c.costs.forEach(x => { if (x.amt != null && (typeof x.amt !== 'number' || isNaN(x.amt))) x.amt = null; });
      set('exb-pct', t.pct); set('exb-sub', money(t.sub)); set('exb-cont', money(t.cont)); set('exb-tot', money(t.total));
      set('exb-un', t.unpriced ? t.unpriced + ' line' + (t.unpriced === 1 ? '' : 's') + ' with no amount yet are not counted.' : '');
    }
  });

  /* =====================================================================
     LOG: dated build log, photos + receipts, materials list (p.cabin.log, p.cabin.materials)
     CARE: seasonal maintenance and renewals (p.cabin.care), reminders across ALL parcels
     ===================================================================== */
  const M = () => window.EXB_MAINT || { every: [], presets: [] };
  const today = () => OA.dkey();
  const num = v => typeof v === 'number' && isFinite(v);
  const STEP = { once: 0, monthly: 1, '3': 3, '6': 6, '12': 12 };
  const everyLabel = e => { const f = M().every.find(x => x[0] === e); return f ? f[1] : 'One time'; };
  function addMonths(k, n) {
    const a = k.split('-').map(Number), t = new Date(a[0], a[1] - 1 + n, 1, 12), dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    t.setDate(Math.min(a[2], dim)); return OA.dkey(t);
  }
  /* the k-th repeat of a series that starts at anchor */
  const occ = (anchor, step, k) => step ? addMonths(anchor, step * k) : anchor;
  const goodKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
  const mlDate = (txt, max) => String(txt || '').trim().slice(0, max || 80);

  /* ---- photo thumbnails: <img data-ph="id"> is filled from the photo store after drawing ---- */
  const urls = new Map();
  function fillPhotos(root) {
    (root || document).querySelectorAll('img[data-ph]:not([src])').forEach(img => {
      const id = img.dataset.ph;
      if (urls.has(id)) { img.src = urls.get(id); return; }
      OA.photo.get(id).then(rec => {
        if (!rec) { img.replaceWith(Object.assign(document.createElement('span'), { className: 'xs dim', textContent: 'photo not on this phone' })); return; }
        const u = OA.photo.url(rec); urls.set(id, u); img.src = u;
      }).catch(() => { });
    });
  }
  OA.on('render', () => fillPhotos(document));
  const thumb = (id, cls) => `<img data-ph="${esc(id)}" data-act="exbPhoto" data-id="${esc(id)}" alt="${cls === 'r' ? 'Receipt photo' : 'Build photo'}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--line);background:var(--panel2);cursor:pointer;flex:none${cls === 'r' ? ';outline:2px solid var(--gold2);outline-offset:-2px' : ''}">`;

  /* ---------- log ---------- */
  function logOf(c) { c.log = c.log || []; c.materials = c.materials || []; return c.log; }
  let draft = null;   // entry being edited in the sheet
  function secLog(cx) {
    const c = cx.c, log = logOf(c).slice().sort((a, b) => (b.d || '').localeCompare(a.d || '') || (b.ts || 0) - (a.ts || 0));
    const spent = log.reduce((s, e) => s + (num(e.cost) ? e.cost : 0), 0), nph = log.reduce((s, e) => s + (e.photos || []).length + (e.receipts || []).length, 0);
    let h = `<div class="card"><div class="ct"><b>Build log${cx.p ? ': ' + esc(cx.p.name) : ''}</b><span class="tag">${log.length} ${log.length === 1 ? 'entry' : 'entries'}</span></div>
      <p class="sm dim">A dated diary of the build: what was done, photos, receipts and what it cost. Everything stays on this phone${cx.p ? '' : ' (no parcel chosen, so this goes in the scratch list)'}.</p>
      ${log.length ? `<div class="kv"><span>Spent, as logged</span><b>${money(spent)}</b></div><div class="kv"><span>Photos and receipts</span><b>${nph}</b></div>` : ''}
      <div class="row"><button class="btn gold" data-act="exbLogNew" data-smoke>Add log entry</button></div></div>`;
    if (!log.length) h += `<div class="alert"><b class="t">Nothing logged yet</b>Start with today: a note and a photo of the site. Later entries build a timeline you can scroll back through.</div>`;
    h += log.map(e => {
      const left = (e.photos || []).length + (e.receipts || []).length;
      return `<div class="card" style="border-left:3px solid var(--gold2)"><div class="ct"><b>${esc(OA.fmtDate(e.d, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }))}</b><button class="btn mini" data-act="exbLogEdit" data-id="${esc(e.id)}" aria-label="Edit entry">Edit</button></div>
        ${e.note ? `<p class="sm" style="margin:4px 0;white-space:pre-wrap">${esc(e.note)}</p>` : left ? '' : '<p class="sm dim">No note.</p>'}
        ${left ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">${(e.photos || []).map(id => thumb(id)).join('')}${(e.receipts || []).map(id => thumb(id, 'r')).join('')}</div>${(e.receipts || []).length ? '<div class="xs dim">Gold outline = receipt photo.</div>' : ''}` : ''}
        ${num(e.cost) ? `<div class="kv"><span>Cost</span><b>${money(e.cost)}</b></div>${e.costAdded ? '<span class="tag g">In Costs planner</span>' : `<div class="row"><button class="btn mini" data-act="exbLogCost" data-id="${esc(e.id)}">Add to Costs planner</button></div>`}` : ''}</div>`;
    }).join('');
    h += secMat(cx);
    return h;
  }
  function addToCosts(c, e) {
    if (!num(e.cost) || e.costAdded) return false;
    c.costs.push({ id: OA.uid(), label: ('Log ' + OA.fmtDate(e.d, { month: 'short', day: 'numeric' }) + ': ' + (e.note || 'entry').split('\n')[0]).slice(0, 80), amt: e.cost });
    e.costAdded = true; return true;
  }
  function entrySheet() {
    const d = draft, nPh = d.photos.length, nRc = d.receipts.length;
    const rm = (list, id) => `<span style="position:relative;display:inline-block">${thumb(id, list === 'receipts' ? 'r' : '')}<button class="btn mini danger" style="position:absolute;right:-6px;top:-6px;min-width:28px;min-height:28px;padding:0" data-act="exbEntryRm" data-l="${list}" data-id="${esc(id)}" aria-label="Remove photo">×</button></span>`;
    return `<label class="fl">Date<input class="in" type="date" id="exbED" value="${esc(d.d)}"></label>
      <label class="fl">What happened<textarea class="in" rows="4" id="exbEN" placeholder="Poured footings, 2 neighbours helped, rain at noon...">${esc(d.note)}</textarea></label>
      <div class="card inner"><b>Photos</b>${nPh ? `<div style="display:flex;gap:10px;flex-wrap:wrap;margin:8px 0">${d.photos.map(id => rm('photos', id)).join('')}</div>` : '<div class="sm dim">None yet.</div>'}
        <div class="row"><button class="btn mini" data-act="exbEntryPhoto" data-l="photos">Take or choose a photo</button></div></div>
      <div class="card inner"><b>Receipts</b>${nRc ? `<div style="display:flex;gap:10px;flex-wrap:wrap;margin:8px 0">${d.receipts.map(id => rm('receipts', id)).join('')}</div>` : '<div class="sm dim">None yet. Photograph receipts here so they stay with the entry.</div>'}
        <div class="row"><button class="btn mini" data-act="exbEntryPhoto" data-l="receipts">Photograph a receipt</button></div></div>
      <label class="fl">Cost for this entry, $ (optional, your own number)<input class="in" type="number" inputmode="decimal" min="0" step="any" id="exbEC" value="${d.cost == null ? '' : esc(d.cost)}" placeholder="0.00"></label>
      ${d.costAdded ? '<p class="xs dim">This cost is already in the Costs planner.</p>' : `<label class="chk"><input type="checkbox" id="exbEA" ${d.addCost ? 'checked' : ''}> Also add this cost as a line in the Costs planner</label>`}
      <div class="row"><button class="btn gold" data-act="exbEntrySave">Save entry</button>${d.isNew ? '' : '<button class="btn danger" data-act="exbEntryDel">Delete entry</button>'}</div>`;
  }
  function readEntry() {
    const g = id => document.getElementById(id), d = draft; if (!d) return;
    if (g('exbED') && goodKey(g('exbED').value)) d.d = g('exbED').value;
    if (g('exbEN')) d.note = g('exbEN').value.slice(0, 2000);
    if (g('exbEC')) { const v = g('exbEC').value === '' ? null : parseFloat(g('exbEC').value); d.cost = v != null && isFinite(v) && v >= 0 ? v : null; }
    if (g('exbEA')) d.addCost = g('exbEA').checked;
  }
  function openEntry(e) {
    draft = e ? { id: e.id, d: e.d, note: e.note || '', cost: num(e.cost) ? e.cost : null, photos: (e.photos || []).slice(), receipts: (e.receipts || []).slice(), costAdded: !!e.costAdded, ts: e.ts, isNew: false, added: [], removed: [], saved: false }
      : { id: OA.uid(), d: today(), note: '', cost: null, photos: [], receipts: [], costAdded: false, ts: Date.now(), isNew: true, added: [], removed: [], saved: false };
    const mine = draft;
    OA.sheet(e ? 'Edit log entry' : 'New log entry', entrySheet(), {
      onOpen: r => fillPhotos(r),
      onClose: () => { if (!mine.saved) mine.added.forEach(id => OA.photo.del(id).catch(() => { })); if (draft === mine) draft = null; }
    });
  }

  /* ---------- materials ---------- */
  function secMat(cx) {
    const c = cx.c, m = c.materials = c.materials || [], got = m.filter(x => x.bought).length;
    return `<div class="card"><div class="ct"><b>Materials list</b><span class="tag ${m.length && got === m.length ? 'g' : ''}">${got} of ${m.length} bought</span></div>
      <p class="sm dim">Quantities are yours; the app does not know what your cabin needs.</p>
      <div class="row" style="align-items:flex-end"><label class="fl" style="flex:3;margin:0">Item<input class="in" id="exbMI" placeholder="e.g. Deck screws" maxlength="80"></label><label class="fl" style="flex:1;margin:0">Qty<input class="in" id="exbMQ" type="number" inputmode="decimal" min="0" step="any" placeholder="1"></label><label class="fl" style="flex:1;margin:0">Unit<input class="in" id="exbMU" placeholder="box" maxlength="12"></label></div>
      <div class="row"><button class="btn gold" data-act="exbMatAdd" data-smoke>Add item</button></div>
      ${m.length ? m.map((x, i) => `<div class="row" style="align-items:center;border-top:1px solid var(--line);padding:2px 0"><label class="chk" style="flex:1;min-width:0"><input type="checkbox" data-onchange="exbMatTick" data-id="${esc(x.id)}" ${x.bought ? 'checked' : ''}><span style="${x.bought ? 'text-decoration:line-through;opacity:.65' : ''}">${esc(x.item)}${num(x.qty) ? ' <span class="dim">' + esc(x.qty) + (x.unit ? ' ' + esc(x.unit) : '') + '</span>' : x.unit ? ' <span class="dim">' + esc(x.unit) + '</span>' : ''}</span></label><button class="btn mini danger" style="flex:none;min-width:44px" data-act="exbMatDel" data-id="${esc(x.id)}" aria-label="Remove ${esc(x.item)}">×</button></div>`).join('') : '<p class="sm dim">Nothing on the list yet.</p>'}
      ${m.length ? '<div class="row"><button class="btn mini" data-act="exbMatShare">Share or copy what is left to buy</button>' + (got ? '<button class="btn mini" data-act="exbMatClear">Clear bought items</button>' : '') + '</div>' : ''}</div>`;
  }

  /* ---------- care ---------- */
  const careList = p => ((p.cabin && p.cabin.care) || []);
  function allCare() {
    const out = [];
    parcels().forEach(p => careList(p).forEach(t => out.push({ p, t })));
    return out;
  }
  const daysTo = k => OA.daysBetween(today(), k);
  const whenTxt = k => { const n = daysTo(k); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n === -1 ? '1 day overdue' : n < 0 ? (-n) + ' days overdue' : 'in ' + n + ' days'; };
  function careRow(x) {
    const { p, t } = x, bill = t.kind === 'bill', over = daysTo(t.due) < 0;
    return `<div style="border-top:1px solid var(--line);padding:8px 0"><div style="display:flex;gap:8px;align-items:flex-start"><div style="flex:1;min-width:0"><b>${esc(t.title)}</b>${bill ? ' <span class="tag a">bill</span>' : ''}
        <div class="sm dim">${esc(p.name)} · ${esc(OA.fmtDate(t.due, { month: 'short', day: 'numeric', year: 'numeric' }))} · <span class="${over ? 'red' : ''}">${esc(whenTxt(t.due))}</span></div>
        <div class="xs dim">${esc(everyLabel(t.every))}${bill && num(t.amt) ? ' · ' + esc(money(t.amt)) + ' (your figure)' : ''}</div></div></div>
      <div class="row"><button class="btn mini gold" data-act="exbCareDone" data-p="${esc(p.id)}" data-t="${esc(t.id)}">${t.every === 'once' ? 'Done' : 'Done, next date'}</button><button class="btn mini" data-act="exbCareSnooze" data-p="${esc(p.id)}" data-t="${esc(t.id)}" data-n="7">Snooze 1 week</button><button class="btn mini" data-act="exbCareEdit" data-p="${esc(p.id)}" data-t="${esc(t.id)}">Edit</button></div></div>`;
  }
  function secCare(cx) {
    const all = allCare(), open = all.filter(x => !x.t.done).sort((a, b) => a.t.due.localeCompare(b.t.due)), done = all.length - open.length;
    const over = open.filter(x => daysTo(x.t.due) < 0), soon = open.filter(x => { const n = daysTo(x.t.due); return n >= 0 && n <= 90; }), later = open.filter(x => daysTo(x.t.due) > 90);
    let h = `<div class="card"><div class="ct"><b>Care and renewals</b>${over.length ? `<span class="tag r">${over.length} overdue</span>` : `<span class="tag">${open.length} set</span>`}</div>
      <p class="sm dim">Reminders you set for each parcel, across all of them. Dates and amounts are yours: the app does not know your county's tax or insurance dates. Presets are general prompts; check the maker's guidance, your local fire district and your policy for the details.</p></div>`;
    if (!parcels().length) return h + `<div class="alert"><b class="t">Add a parcel first</b>Reminders belong to a parcel, so each cabin gets its own list. <div class="row"><button class="btn mini gold" data-go="land">Open Land</button></div></div>`;
    h += `<div class="card"><div class="ct"><b>Add for ${cx.p ? esc(cx.p.name) : 'a parcel'}</b></div>${cx.p ? '' : '<p class="sm dim">Choose a parcel at the top first.</p>'}`;
    if (cx.p) {
      const have = careList(cx.p).map(t => t.pre);
      h += `<div class="chips wrap">${M().presets.filter(pr => have.indexOf(pr.id) < 0).map(pr => `<button class="chip" data-act="exbCarePre" data-id="${esc(pr.id)}">${esc(pr.t)}</button>`).join('')}<button class="chip on" data-act="exbCareNew" data-smoke>+ Custom</button></div><p class="xs dim">A preset opens a form so you set the real date.</p>`;
    }
    h += '</div>';
    if (!open.length) h += `<div class="alert"><b class="t">No reminders yet</b>Pick a preset above, such as closing up for winter or an insurance renewal, and set when it is due.</div>`;
    const block = (title, list, cls) => list.length ? `<div class="card ${cls || ''}"><div class="ct"><b>${title}</b><span class="tag">${list.length}</span></div>${list.map(careRow).join('')}</div>` : '';
    h += block('Overdue', over, 'hot') + block('Next up (90 days)', soon) + block('Later', later);
    if (done) h += `<p class="xs dim center">${done} one-time ${done === 1 ? 'task' : 'tasks'} marked done.</p>`;
    return h;
  }
  let cdraft = null;
  function careSheet() {
    const d = cdraft;
    return `<label class="fl">What<input class="in" id="exbCT" maxlength="80" value="${esc(d.title)}" placeholder="e.g. Check the gate lock"></label>
      <label class="fl">Note<textarea class="in" rows="3" id="exbCN" maxlength="500">${esc(d.note)}</textarea></label>
      <div class="two"><label class="fl">Type<select class="in" id="exbCK" data-onchange="exbCareKind"><option value="task" ${d.kind === 'task' ? 'selected' : ''}>Task</option><option value="bill" ${d.kind === 'bill' ? 'selected' : ''}>Bill or renewal</option></select></label>
      <label class="fl">Repeats<select class="in" id="exbCE">${M().every.map(e => `<option value="${esc(e[0])}" ${e[0] === d.every ? 'selected' : ''}>${esc(e[1])}</option>`).join('')}</select></label></div>
      <label class="fl">Due date<input class="in" type="date" id="exbCD" value="${esc(d.due)}"></label>
      <label class="fl" id="exbCAw" style="${d.kind === 'bill' ? '' : 'display:none'}">Amount $ (optional, from your own notice)<input class="in" type="number" inputmode="decimal" min="0" step="any" id="exbCA" value="${d.amt == null ? '' : esc(d.amt)}"></label>
      <div class="row"><button class="btn gold" data-act="exbCareSave">Save</button>${d.isNew ? '' : '<button class="btn danger" data-act="exbCareDel">Delete</button>'}</div>`;
  }
  function openCare(p, t, pre) {
    let d;
    if (t) d = { pid: p.id, tid: t.id, title: t.title, note: t.note || '', kind: t.kind || 'task', every: t.every || 'once', due: t.due, amt: num(t.amt) ? t.amt : null, pre: t.pre || '', isNew: false };
    else {
      let due = today();
      if (pre && pre.m) { const n = new Date(), y = n.getFullYear(), cand = y + '-' + String(pre.m).padStart(2, '0') + '-01'; if (cand >= due) due = cand; else if (n.getMonth() + 1 !== pre.m) due = (y + 1) + '-' + String(pre.m).padStart(2, '0') + '-01'; }
      d = { pid: p.id, tid: OA.uid(), title: pre ? pre.t : '', note: pre ? pre.d : '', kind: pre ? pre.kind : 'task', every: pre ? pre.every : 'once', due, amt: null, pre: pre ? pre.id : '', isNew: true };
    }
    cdraft = d;
    OA.sheet(t ? 'Edit reminder' : pre ? 'Set up: ' + pre.t : 'New reminder', careSheet() + (pre && pre.m ? '<p class="xs dim">The date is only a starting guess for the month. Change it to suit your climate and your local rules.</p>' : ''), { onClose: () => { cdraft = null; } });
  }
  const careFind = (pid, tid) => { const p = EX.parcels.get(pid), t = p && careList(p).find(x => x.id === tid); return { p, t }; };

  /* the next 90 days of dated reminders, for the household calendar: [{t, d:'YYYY-MM-DD', kind:'bill'|'land', amt?}] */
  EXB.events = function () {
    const out = [], t0 = today(), t1 = OA.addDays(t0, 90);
    try {
      allCare().forEach(({ p, t }) => {
        if (t.done || !goodKey(t.due)) return;
        const step = STEP[t.every] || 0, anchor = goodKey(t.anchor) ? t.anchor : t.due, ds = [t.due];
        if (step) for (let k = 0; k < 400; k++) { const o = occ(anchor, step, k); if (o > t1) break; if (o > t.due) ds.push(o); }
        ds.forEach(d => {
          if (d < t0 || d > t1) return;
          const bill = t.kind === 'bill', e = { t: String(t.title).slice(0, 60) + ' (' + p.name + ')', d, kind: bill ? 'bill' : 'land' };
          if (bill && num(t.amt)) e.amt = t.amt;
          out.push(e);
        });
      });
    } catch (e) { }
    return out.sort((a, b) => a.d.localeCompare(b.d));
  };
  EXB.overdue = () => allCare().filter(x => !x.t.done && goodKey(x.t.due) && daysTo(x.t.due) < 0).length;

  OA.act({
    /* log */
    exbLogNew() { openEntry(null); },
    exbLogEdit(el) { const e = logOf(cab().c).find(x => x.id === el.dataset.id); if (e) openEntry(e); },
    exbLogCost(el) { const c = cab().c, e = logOf(c).find(x => x.id === el.dataset.id); if (e && addToCosts(c, e)) { OA.save(); OA.render(true); OA.toast('Added to the Costs planner.'); } },
    async exbPhoto(el) {
      const rec = await OA.photo.get(el.dataset.id); if (!rec) { OA.toast('That photo is not on this phone.'); return; }
      const u = OA.photo.fullUrl(rec);
      OA.sheet(rec.tag === 'receipt' ? 'Receipt' : 'Photo', `<img src="${u}" alt="${rec.tag === 'receipt' ? 'Receipt' : 'Build photo'}" style="width:100%;border-radius:8px"><p class="sm dim">${esc(new Date(rec.ts).toLocaleString())}</p>`, { onClose: () => URL.revokeObjectURL(u) });
    },
    async exbEntryPhoto(el) {
      if (!draft) return; readEntry(); const l = el.dataset.l === 'receipts' ? 'receipts' : 'photos', mine = draft;
      const rec = await OA.photo.pick({ tag: l === 'receipts' ? 'receipt' : 'build-log', note: 'Expandica build log' });
      if (!rec || draft !== mine) { if (rec) OA.photo.del(rec.id).catch(() => { }); return; }
      mine[l].push(rec.id); mine.added.push(rec.id); OA.redrawSheet(entrySheet());
    },
    exbEntryRm(el) { if (!draft) return; readEntry(); const l = el.dataset.l === 'receipts' ? 'receipts' : 'photos', id = el.dataset.id; draft[l] = draft[l].filter(x => x !== id); if (draft.added.indexOf(id) >= 0) { draft.added = draft.added.filter(x => x !== id); OA.photo.del(id).catch(() => { }); } else draft.removed.push(id); OA.redrawSheet(entrySheet()); },
    exbEntrySave() {
      if (!draft) return; readEntry(); const d = draft, c = cab().c, log = logOf(c);
      if (!d.note.trim() && !d.photos.length && !d.receipts.length && d.cost == null) { OA.toast('Add a note, photo or cost first.'); return; }
      let e = log.find(x => x.id === d.id); if (!e) { e = { id: d.id, ts: d.ts }; log.push(e); }
      Object.assign(e, { d: d.d, note: d.note.trim(), cost: d.cost, photos: d.photos, receipts: d.receipts, costAdded: d.costAdded });
      let msg = 'Entry saved.'; if (d.addCost && addToCosts(c, e)) msg = 'Entry saved and added to Costs.';
      d.removed.forEach(id => OA.photo.del(id).catch(() => { }));
      d.saved = true; OA.save(); OA.closeSheet(); OA.toast(msg);
    },
    async exbEntryDel() {
      if (!draft || draft.isNew) return; const d = draft;
      if (!await OA.confirm('Delete this log entry and its photos and receipts? A cost already added to the Costs planner stays there.', 'Delete')) return;
      const c = cab().c; c.log = logOf(c).filter(x => x.id !== d.id); d.photos.concat(d.receipts).forEach(id => OA.photo.del(id).catch(() => { }));
      d.added.filter(id => d.photos.concat(d.receipts).indexOf(id) < 0).forEach(id => OA.photo.del(id).catch(() => { }));
      d.saved = true; OA.save(); OA.closeSheet(); OA.toast('Entry deleted.');
    },
    /* materials */
    exbMatAdd() {
      const g = id => document.getElementById(id), item = mlDate(g('exbMI') && g('exbMI').value, 80);
      if (!item) { OA.toast('Type the item first.'); if (g('exbMI')) g('exbMI').focus(); return; }
      let q = g('exbMQ') && g('exbMQ').value !== '' ? parseFloat(g('exbMQ').value) : null; if (q != null && (!isFinite(q) || q < 0)) q = null;
      const c = cab().c; logOf(c); c.materials.push({ id: OA.uid(), item, qty: q, unit: mlDate(g('exbMU') && g('exbMU').value, 12), bought: false }); OA.save(); OA.render(true);
    },
    exbMatTick(el) { const c = cab().c; logOf(c); const x = c.materials.find(m => m.id === el.dataset.id); if (x) { x.bought = el.checked; OA.save(); OA.render(true); } },
    async exbMatDel(el) { const c = cab().c; logOf(c); const x = c.materials.find(m => m.id === el.dataset.id); if (!x) return; if (!await OA.confirm('Remove "' + x.item + '" from the materials list?', 'Remove')) return; c.materials = c.materials.filter(m => m !== x); OA.save(); OA.render(true); },
    async exbMatClear() { const c = cab().c; logOf(c); if (!await OA.confirm('Remove all bought items from the list?', 'Clear')) return; c.materials = c.materials.filter(m => !m.bought); OA.save(); OA.render(true); },
    exbMatShare() {
      const cx = cab(), c = cx.c; logOf(c); const left = c.materials.filter(m => !m.bought);
      if (!left.length) { OA.toast('Everything is marked bought.'); return; }
      return OA.share.send({ title: 'Materials to buy', text: 'Still to buy' + (cx.p ? ' for ' + cx.p.name : '') + ':\n' + left.map(m => '- ' + m.item + (num(m.qty) ? ' x ' + m.qty + (m.unit ? ' ' + m.unit : '') : m.unit ? ' (' + m.unit + ')' : '')).join('\n') });
    },
    /* care */
    exbCarePre(el) { const cx = cab(), pr = M().presets.find(x => x.id === el.dataset.id); if (cx.p && pr) openCare(cx.p, null, pr); },
    exbCareNew() { const cx = cab(); if (cx.p) openCare(cx.p, null, null); },
    exbCareEdit(el) { const r = careFind(el.dataset.p, el.dataset.t); if (r.t) openCare(r.p, r.t); },
    exbCareKind(el) { const w = document.getElementById('exbCAw'); if (w) w.style.display = el.value === 'bill' ? '' : 'none'; },
    exbCareSave() {
      if (!cdraft) return; const g = id => document.getElementById(id), d = cdraft, p = EX.parcels.get(d.pid); if (!p) return;
      const title = mlDate(g('exbCT').value, 80), due = g('exbCD').value;
      if (!title) { OA.toast('Say what the reminder is for.'); g('exbCT').focus(); return; }
      if (!goodKey(due)) { OA.toast('Pick a due date.'); return; }
      let amt = g('exbCA').value === '' ? null : parseFloat(g('exbCA').value); if (amt != null && (!isFinite(amt) || amt < 0)) amt = null;
      const kind = g('exbCK').value === 'bill' ? 'bill' : 'task', every = STEP[g('exbCE').value] != null ? g('exbCE').value : 'once';
      p.cabin = p.cabin || {}; p.cabin.care = p.cabin.care || [];
      let t = p.cabin.care.find(x => x.id === d.tid); if (!t) { t = { id: d.tid, pre: d.pre || '' }; p.cabin.care.push(t); }
      Object.assign(t, { title, note: g('exbCN').value.slice(0, 500), kind, every, due, anchor: due, amt: kind === 'bill' ? amt : null, done: null });
      OA.save(); OA.closeSheet(); OA.toast('Reminder saved.');
    },
    async exbCareDel() {
      if (!cdraft || cdraft.isNew) return; const d = cdraft; if (!await OA.confirm('Delete this reminder?', 'Delete')) return;
      const p = EX.parcels.get(d.pid); if (p) p.cabin.care = careList(p).filter(x => x.id !== d.tid); OA.save(); OA.closeSheet();
    },
    exbCareDone(el) {
      const r = careFind(el.dataset.p, el.dataset.t), t = r.t; if (!t) return;
      const step = STEP[t.every] || 0; t.last = today();
      if (!step) { t.done = today(); OA.toast('Marked done.'); }
      else {
        const anchor = goodKey(t.anchor) ? t.anchor : t.due; let k = 0, n = anchor;
        while (k < 600 && (n <= anchor || n <= today())) { k++; n = occ(anchor, step, k); }
        t.anchor = n; t.due = n; OA.toast('Done. Next: ' + OA.fmtDate(n, { month: 'short', day: 'numeric', year: 'numeric' }));
      }
      OA.save(); OA.render(true);
    },
    exbCareSnooze(el) {
      const r = careFind(el.dataset.p, el.dataset.t), t = r.t; if (!t) return;
      const base = daysTo(t.due) < 0 ? today() : t.due; t.due = OA.addDays(base, +el.dataset.n || 7); OA.save(); OA.render(true); OA.toast('Snoozed to ' + OA.fmtDate(t.due, { month: 'short', day: 'numeric' }) + '.');
    }
  });

  EXB.cabin = cab;
})();
