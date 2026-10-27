/* Expandica Land tab: per-parcel due-diligence checklist, red flags, carrying-cost calculator, official lookups.
   Global: EXL. Data: window.EXD (data/diligence.js). Progress lives in parcel.diligence {itemId:true}; cost inputs in parcel.carry. */
window.EXL = window.EXL || {};
(function () {
  'use strict';
  const esc = OA.esc, EXL = window.EXL;
  EXL.ddItems = (window.EXD && Array.isArray(EXD.items)) ? EXD.items : [];
  OA.defaults({ exl: { view: 'list', sel: null, ack: false, cmp: { ids: [], by: '', dir: 'low' } } });
  const D = () => window.EXD || { groups: [], items: [], links: [] };
  const L = () => OA.S.exl;
  const parcels = () => (window.EX && EX.parcels) ? EX.parcels.list() : [];
  const cur = () => { const ps = parcels(); let p = ps.find(x => x.id === L().sel); if (!p && ps.length) { p = ps[0]; L().sel = p.id; } return p || null; };
  const done = (p, id) => !!(p.diligence && p.diligence[id]);
  const stats = p => { const it = D().items; const d = it.filter(i => done(p, i.id)).length; const c = it.filter(i => i.crit && !done(p, i.id)).length; return { n: it.length, done: d, critOpen: c, crit: it.filter(i => i.crit).length }; };
  const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
  const $m = v => v == null ? 'enter numbers' : OA.money(v);

  /* ---------- cost maths (pure; EXL.cost is testable) ---------- */
  EXL.pmt = (principal, ratePct, years) => {
    if (num(principal) == null || principal <= 0 || num(ratePct) == null || ratePct < 0 || num(years) == null || years <= 0) return null;
    const n = Math.round(years * 12), r = ratePct / 1200;
    return r === 0 ? principal / n : principal * r / (1 - Math.pow(1 + r, -n));
  };
  EXL.cost = p => {
    const c = p.carry || {}, base = num(c.assessed) != null ? c.assessed : num(p.priceUsd);
    const tax = (num(c.taxRate) != null && base != null) ? base * c.taxRate / 100 : null;
    const ins = num(c.insurance), road = num(c.road), util = num(c.util);
    const travel = (num(c.miles) != null && num(c.trips) != null && num(c.perMile) != null) ? c.miles * 2 * c.trips * c.perMile : null;
    const loanAmt = num(p.priceUsd) != null ? Math.max(0, p.priceUsd - (num(c.down) || 0)) : null;
    const pm = EXL.pmt(loanAmt, c.loanRate, c.loanYears);
    const loan = pm == null ? null : pm * 12;
    const parts = { tax, ins, road, util, travel, loan };
    const known = Object.keys(parts).filter(k => parts[k] != null);
    const annual = OA.sum(known, k => parts[k]);
    return { parts, annual, monthly: annual / 12, known: known.length, pm, loanAmt, base };
  };

  /* ---------- pieces ---------- */
  function front() {
    if (L().ack) return `<details class="card inner"><summary class="b">Not legal, tax or financial advice</summary><p class="sm dim">${notice()}</p></details>`;
    return `<div class="alert"><b class="t">Read first: this is a checklist, not advice</b><p class="sm">${notice()}</p><button class="btn gold" data-act="exlAck">Got it</button></div>`;
  }
  function notice() {
    return 'Expandica is not legal, tax, financial or engineering advice, and it cannot know your county. Rules on access, zoning, septic, water, taxes and tax sales differ place to place and change. Before you pay anything, talk to the county (planning, building, health, assessor, treasurer), a title company, a licensed surveyor, and a licensed local professional such as a real estate attorney or septic designer. A checked box here only means you asked and are satisfied, never that a parcel is a good buy.';
  }
  function picker() {
    const ps = parcels(), p = cur();
    if (!ps.length) return `<div class="card center"><div class="b">No parcels yet</div><p class="sm dim">Add the first piece of land you are looking at. You can also add parcels from the Map tab.</p>${addForm()}</div>`;
    const s = stats(p);
    return `<div class="card"><label class="fl">Parcel
      <select class="in" data-bind="exl.sel" data-then="exlSel">${ps.map(x => `<option value="${esc(x.id)}" ${x.id === p.id ? 'selected' : ''}>${esc(x.name)}${x.state ? ' (' + esc(x.state) + ')' : ''}</option>`).join('')}</select></label>
      <div class="sm dim" style="margin:6px 0">${esc([p.county ? p.county + ' County' : 'County not set', p.state || 'state not set', p.acres != null ? p.acres + ' acres' : ''].filter(Boolean).join(' · '))}</div>
      <div class="bar"><i id="exlBar" style="width:${Math.round(100 * s.done / s.n)}%"></i></div>
      <div class="sm" id="exlProg" style="margin-top:6px">${progText(s)}</div>
      <details><summary class="sm dim" style="padding:8px 0">Add another parcel</summary>${addForm()}</details></div>`;
  }
  function progText(s) { return `${s.done} of ${s.n} checked · <span class="${s.critOpen ? 'warn' : 'green'}">${s.critOpen} critical open</span>`; }
  function addForm() {
    return `<div class="two"><label class="fl">Name<input class="in" id="exlNm" placeholder="e.g. Pine Flat 5 acres"></label>
      <label class="fl">State<select class="in" id="exlSt"><option value="">State</option>${(window.EX ? EX.states : []).map(s => `<option>${s}</option>`).join('')}</select></label></div>
      <label class="fl">County<input class="in" id="exlCo" placeholder="County name"></label>
      <button class="btn block" data-act="exlAdd">Add parcel</button>`;
  }
  function chips() {
    const v = L().view;
    return `<div class="chips">${[['list', 'Checklist'], ['flags', 'Red flags'], ['cost', 'Costs'], ['look', 'Official lookup'], ['cmp', 'Compare']].map(x => `<button class="chip ${v === x[0] ? 'on' : ''}" data-act="exlView" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>`;
  }
  function itemRow(p, i) {
    return `<div class="exl-it" style="border-bottom:1px solid var(--line);padding:4px 0">
      <label class="chk"><input type="checkbox" data-act="exlTog" data-id="${i.id}" ${done(p, i.id) ? 'checked' : ''}><span>${esc(i.t)} ${i.crit ? '<span class="tag r">critical</span>' : ''}</span></label>
      <details style="margin:0 0 4px 31px"><summary class="xs dim" style="padding:4px 0;min-height:32px">Why and who to ask</summary>
        <p class="sm" style="margin:2px 0">${esc(i.why)}</p><p class="sm dim" style="margin:2px 0 6px"><b>Ask:</b> ${esc(i.who)}</p></details></div>`;
  }
  function checklist(p) {
    const d = D();
    return d.groups.map((g, gi) => {
      const its = d.items.filter(i => i.g === g.id), dn = its.filter(i => done(p, i.id)).length;
      return `<details class="card" ${gi === 0 ? 'open' : ''}><summary class="ct" style="min-height:44px"><b>${esc(g.label)}</b> <span class="tag exl-gc" data-g="${g.id}">${dn}/${its.length}</span></summary>${its.map(i => itemRow(p, i)).join('')}</details>`;
    }).join('');
  }
  function flags(p) {
    const d = D(), open = d.items.filter(i => i.crit && !done(p, i.id)), s = stats(p);
    const notes = [];
    if (!p.county || !p.state) notes.push('County or state is not set on this parcel. Nearly every answer comes from the county, so add them in the Map tab.');
    if (EX.stageIdx(p.stage) >= EX.stageIdx('contract') && open.length) notes.push('This parcel is under contract or owned and critical items are still open. Ask a title company or attorney what deadlines you have.');
    if (!open.length) return `<div class="alert ok"><b class="t">All ${s.crit} critical items are checked</b>That means you asked and are satisfied. It does not mean the parcel is a good buy; review the rest of the checklist and get professional advice.</div>`;
    return `<div class="alert danger"><b class="t">${open.length} of ${s.crit} critical items not yet confirmed</b>Unchecked is not proof of a problem. It means you have not confirmed it. Do not pay a deposit or sign until these are answered by the right office.</div>
      ${notes.map(n => `<div class="card tip sm">${esc(n)}</div>`).join('')}
      ${d.groups.map(g => { const its = open.filter(i => i.g === g.id); return its.length ? `<div class="card"><div class="ct"><b>${esc(g.label)}</b></div>${its.map(i => `<div style="padding:6px 0;border-bottom:1px solid var(--line)"><label class="chk"><input type="checkbox" data-act="exlTog" data-id="${i.id}"><span><b>${esc(i.t)}</b></span></label><p class="sm" style="margin:0 0 2px 31px">${esc(i.why)}</p><p class="sm dim" style="margin:0 0 4px 31px"><b>Ask:</b> ${esc(i.who)}</p></div>`).join('')}</div>` : ''; }).join('')}`;
  }
  function field(p, i, key, label, ph, step) {
    const v = p.carry && num(p.carry[key]) != null ? p.carry[key] : '';
    return `<label class="fl">${label}<input class="in" type="number" inputmode="decimal" step="${step || 'any'}" min="0" placeholder="${esc(ph || '')}" value="${esc(v)}" data-bind="ex.parcels.${i}.carry.${key}" data-then="exlCalc"></label>`;
  }
  function cost(p) {
    const i = parcels().indexOf(p);
    return `<div class="alert"><b class="t">Your numbers, not ours</b>Expandica fills in nothing here. Every figure comes from you. Get the tax rate from the county assessor, insurance from an agent, and loan terms from a lender. Blank means unknown and is left out of the total.</div>
      <div class="card"><div class="ct"><b>Yearly costs</b></div>
        <label class="fl">Purchase price ($)<input class="in" type="number" inputmode="decimal" min="0" value="${p.priceUsd == null ? '' : esc(p.priceUsd)}" placeholder="from the parcel" data-bind="ex.parcels.${i}.priceUsd" data-then="exlCalc"></label>
        <div class="two">${field(p, i, 'taxRate', 'Property tax rate (% of value)', 'ask county assessor', 0.001)}${field(p, i, 'assessed', 'Assessed value ($)', 'blank = use price')}</div>
        <p class="xs dim">Tax rate: ask the county assessor or treasurer. Some counties reassess after a sale, so ask what value they would use for you.</p>
        <div class="two">${field(p, i, 'insurance', 'Insurance ($ / year)', 'from an agent')}${field(p, i, 'road', 'Road and upkeep ($ / year)', 'dues, grading, plowing')}</div>
        ${field(p, i, 'util', 'Utilities and fees ($ / year)', 'power, water, fire district')}
      </div>
      <div class="card"><div class="ct"><b>Trips to visit</b></div><div class="three">${field(p, i, 'miles', 'Miles one way')}${field(p, i, 'trips', 'Round trips / year')}${field(p, i, 'perMile', 'Cost per mile ($)', 'your own', 0.01)}</div></div>
      <div class="card"><div class="ct"><b>Loan helper</b></div><p class="xs dim">Standard monthly payment on the price minus your down payment. Type the rate a lender actually quotes you.</p>
        <div class="two">${field(p, i, 'down', 'Down payment ($)')}${field(p, i, 'loanRate', 'Interest rate (% / year)', 'from lender', 0.01)}</div>${field(p, i, 'loanYears', 'Term (years)')}</div>
      <div class="card hot" id="exlOut">${costOut(p)}</div>`;
  }
  function costOut(p) {
    const c = EXL.cost(p), P = c.parts, row = (l, v) => `<div class="kv"><span>${l}</span><b>${v == null ? '<span class="dim">not entered</span>' : OA.money(v)}</b></div>`;
    return `<div class="ct"><b>Your estimate</b></div>
      ${row('Property tax / year', P.tax)}${row('Insurance / year', P.ins)}${row('Road and upkeep / year', P.road)}${row('Utilities and fees / year', P.util)}${row('Travel to visit / year', P.travel)}${row('Loan payments / year', P.loan)}
      ${c.pm != null ? `<p class="xs dim">Loan: ${OA.money(c.loanAmt)} financed, about ${OA.money(c.pm)} a month.</p>` : ''}
      <div class="stat"><div><b>${c.known ? OA.money(c.annual) : '–'}</b><span>PER YEAR</span></div><div><b>${c.known ? OA.money(c.monthly) : '–'}</b><span>PER MONTH</span></div></div>
      <p class="xs dim">Totals use only the ${c.known} of 6 parts you entered. This is your own arithmetic, not a quote. Costs not listed here (building, well, septic, surveys, closing) are extra.</p>`;
  }
  function stateCard(p) {
    const X = window.EXS_DATA; if (!X || !p || !p.state) return '';
    const r = (X.states || []).find(s => s.st === p.state); if (!r) return '';
    const a = (u, t) => `<a class="btn mini" target="_blank" rel="noopener" href="${esc(u)}">${esc(t)}</a>`;
    const row = (lab, txt, url, bt) => `<div class="sm" style="margin:8px 0"><b>${lab}:</b> ${txt ? esc(txt) : '<span class="dim">not verified: check with the county or state agency</span>'} ${url ? '<div>' + a(url, bt) + '</div>' : ''}</div>`;
    return `<div class="card"><div class="ct"><b>${esc(r.name)}: what we found</b><span class="xs dim">as of ${esc(r.asof || '')}</span></div>
      ${row('Fire and burn rules', r.fireNote, r.fireInfo, 'Official fire info')}
      ${row('Parcel lookup', r.assessorNote, r.countyGis, 'Open parcel viewer')}
      ${row('Land-buying note', r.landNote, r.landLink, 'Read more')}
      <p class="xs dim">Rules can change and vary by county. Confirm before you rely on any of this.</p></div>`;
  }
  function lookup(p) {
    const d = D(), q = t => 'https://duckduckgo.com/?q=' + encodeURIComponent(t);
    const place = p && p.county ? (p.county + ' County ' + (p.state || '')).trim() : '';
    return `<div class="card tip sm">These open in your browser and need signal. Maps help you screen a parcel but never replace the county or a licensed professional. Last checked ${esc(d.asof || '')}.</div>
      ${stateCard(p)}
      ${place ? `<div class="card"><div class="ct"><b>County offices for ${esc(place)}</b></div><p class="xs dim">Web searches, not official links. Confirm you reached the real county site (.gov or the county's own), then phone it.</p>
        ${['planning and zoning department', 'building department', 'environmental health septic', 'assessor', 'treasurer property tax', 'recorder'].map(t => `<a class="btn block" target="_blank" rel="noopener" href="${q(place + ' ' + t)}">${esc(t)}</a>`).join('')}</div>` : `<div class="card sm">Set the parcel's state and county to get office search links.</div>`}
      ${d.links.map(l => `<div class="card"><div class="b">${esc(l.t)}</div><p class="sm dim" style="margin:4px 0 8px">${esc(l.d)}</p><a class="btn" target="_blank" rel="noopener" href="${esc(l.u)}">Open</a><div class="xs dim" style="margin-top:6px">Source: ${esc(l.src.replace(/^https?:\/\//, '').split('/')[0])} · as of ${esc(l.asof)}</div></div>`).join('')}
      <div class="card sm dim">State and county land, parcel and GIS portals differ for every place and are not listed here because they are not verified. Search your county's assessor or GIS page.</div>`;
  }

  OA.tab({
    id: 'land', label: 'Land', icon: 'mountain', order: 2,
    render() {
      const p = cur(), v = L().view;
      let h = OA.header('Land', 'Check a parcel before you pay') + front() + picker();
      if (p) {
        h += chips();
        h += v === 'flags' ? flags(p) : v === 'cost' ? cost(p) : v === 'look' ? lookup(p) : v === 'cmp' ? EXL.compareView() : checklist(p) + `<button class="btn block" data-act="exlReset">Clear this parcel's checks</button>`;
      } else h += lookup(null);
      return h;
    }
  });


  /* ---------- Compare: a side-by-side sheet of the user's own entries. No score, no ranking verdict, no "best parcel". ---------- */
  const FACT_OPTS = {
    access: ['Paved public road', 'Gravel or dirt public road', 'Private road with recorded easement', 'Unrecorded or unclear access', 'No road access', 'Other'],
    water: ['County or public water', 'Existing well', 'Spring or creek', 'Haul or rainwater', 'None known', 'Other'],
    roadType: ['Paved', 'Gravel', 'Dirt or two-track', 'Seasonal or washes out', 'Other'],
    signal: ['None', 'Weak or patchy', 'Usable', 'Strong']
  };
  const NE = 'not entered';
  const fx = p => p.facts || {};
  const sfx = v => (typeof v === 'string' && v.trim()) ? v.trim() : null;
  const cmpState = () => { const c = L().cmp = L().cmp || { ids: [], by: '', dir: 'low' }; if (!Array.isArray(c.ids)) c.ids = []; return c; };
  const cmpParcels = () => { const c = cmpState(); return c.ids.map(id => EX.parcels.get(id)).filter(Boolean); };
  const numIn = (v) => num(v);
  /* each row: k, label, n(p) numeric value or null (for sorting/highlight), s(p) display text or null */
  EXL.cmpRows = [
    { k: 'price', label: 'Price', n: p => numIn(p.priceUsd), s: p => num(p.priceUsd) == null ? null : OA.money(p.priceUsd) },
    { k: 'acres', label: 'Acres', n: p => numIn(p.acres), s: p => num(p.acres) == null ? null : String(OA.round(p.acres, 2)) },
    { k: 'ppa', label: 'Price per acre (computed)', n: p => (num(p.priceUsd) != null && num(p.acres) != null && p.acres > 0) ? p.priceUsd / p.acres : null, s: function (p) { const v = this.n(p); return v == null ? null : OA.money(v); } },
    { k: 'place', label: 'County, state', n: () => null, s: p => (p.county || p.state) ? [p.county ? p.county + ' County' : '', p.state || ''].filter(Boolean).join(', ') : null },
    { k: 'access', label: 'Access type', n: () => null, s: p => sfx(fx(p).access) },
    { k: 'roadType', label: 'Road type', n: () => null, s: p => sfx(fx(p).roadType) },
    { k: 'water', label: 'Water source', n: () => null, s: p => sfx(fx(p).water) },
    { k: 'powerMi', label: 'Distance to power', n: p => numIn(fx(p).powerMi), s: p => num(fx(p).powerMi) == null ? null : OA.dist(fx(p).powerMi, 2) },
    { k: 'signal', label: 'Cell signal', n: () => null, s: p => sfx(fx(p).signal) },
    { k: 'flood', label: 'Flood zone note', n: () => null, s: p => sfx(fx(p).flood) },
    { k: 'annual', label: 'Annual carrying cost (your numbers)', n: p => { const c = EXL.cost(p); return c.known ? c.annual : null; }, s: p => { const c = EXL.cost(p); return c.known ? OA.money(c.annual) + ' / yr (' + c.known + ' of 6 parts)' : null; } },
    { k: 'ddDone', label: 'Due-diligence items checked', n: p => stats(p).done, s: p => { const s = stats(p); return s.done + ' of ' + s.n; } },
    { k: 'cleared', label: 'Critical items cleared', n: p => { const s = stats(p); return s.crit - s.critOpen; }, s: p => { const s = stats(p); return (s.crit - s.critOpen) + ' of ' + s.crit; } },
    { k: 'critOpen', label: 'Critical items still open', n: p => stats(p).critOpen, s: p => String(stats(p).critOpen) },
    { k: 'stage', label: 'Stage', n: p => EX.stageIdx(p.stage), s: p => EX.stageOf(p).label },
    { k: 'extra', label: 'Your notes on this parcel', n: () => null, s: p => sfx(fx(p).extra) },
    { k: 'notes', label: 'Parcel notes', n: () => null, s: p => sfx(p.notes) }
  ];
  const rowOf = k => EXL.cmpRows.find(r => r.k === k);
  const sortable = () => EXL.cmpRows.filter(r => ['price', 'acres', 'ppa', 'powerMi', 'annual', 'ddDone', 'cleared', 'critOpen', 'stage'].indexOf(r.k) >= 0);
  const cell = (r, p) => { const v = r.s(p); return v == null ? null : v; };
  /* parcels in the order the user asked for; missing values always last */
  function ordered() {
    const c = cmpState(), ps = cmpParcels(), r = c.by && rowOf(c.by);
    if (!r) return { ps, hi: new Set() };
    const val = p => r.n(p), sign = c.dir === 'high' ? -1 : 1;
    const arr = ps.map((p, i) => ({ p, i, v: val(p) }));
    arr.sort((a, b) => (a.v == null) - (b.v == null) || (a.v == null ? 0 : sign * (a.v - b.v)) || a.i - b.i);
    const known = arr.filter(x => x.v != null), hi = new Set();
    if (known.length > 1) known.filter(x => x.v === known[0].v).forEach(x => hi.add(x.p.id));
    return { ps: arr.map(x => x.p), hi };
  }
  function cmpText() {
    const o = ordered(), c = cmpState(), r = c.by && rowOf(c.by);
    const L2 = ['Parcel comparison from my own notes (Expandica)', ''];
    o.ps.forEach(p => {
      L2.push(p.name + (o.hi.has(p.id) ? '  [' + (c.dir === 'high' ? 'highest' : 'lowest') + ' ' + r.label.toLowerCase().replace(/ \(.*/, '') + ']' : ''));
      EXL.cmpRows.forEach(rw => { if (rw.k === 'notes' && !rw.s(p)) return; L2.push('  ' + rw.label + ': ' + (cell(rw, p) || NE)); });
      L2.push('');
    });
    L2.push('These are my own entries, sorted or marked only by the column I picked. There is no score and no best parcel. Not legal, tax or financial advice; confirm everything with the county.');
    return L2.join('\n');
  }
  function printHtml() {
    const o = ordered();
    return '<h2>Parcel comparison</h2><p>Your own entries. No score or ranking. Not legal, tax or financial advice; confirm with the county.</p><table class="exl-pt"><thead><tr><th></th>' + o.ps.map(p => '<th>' + esc(p.name) + '</th>').join('') + '</tr></thead><tbody>' +
      EXL.cmpRows.map(r => '<tr><th>' + esc(r.label) + '</th>' + o.ps.map(p => { const v = cell(r, p); return '<td>' + (v == null ? '<i>' + NE + '</i>' : esc(v)) + '</td>'; }).join('') + '</tr>').join('') + '</tbody></table>';
  }
  function cmpStyle() {
    if (document.getElementById('exlCmpCss')) return;
    const st = document.createElement('style'); st.id = 'exlCmpCss';
    st.textContent = '#exlPrint{display:none}.exl-ct{border-collapse:separate;border-spacing:0;font-size:.88rem;min-width:100%}.exl-ct th,.exl-ct td{padding:8px 8px;border-bottom:1px solid var(--line);vertical-align:top;text-align:left;min-width:128px;max-width:200px}.exl-ct thead th{color:var(--gold);font-size:.82rem}.exl-ct tbody th{position:sticky;left:0;background:var(--bg);z-index:1;min-width:112px;max-width:112px;font-size:.78rem;font-weight:600;color:var(--dim,#aaa)}.exl-ct td.hi{outline:2px solid var(--gold);outline-offset:-2px;background:rgba(212,175,55,.12)}.exl-ct i{opacity:.65}.exl-pt{border-collapse:collapse;width:100%;font-size:11pt}.exl-pt th,.exl-pt td{border:1px solid #888;padding:4px 6px;text-align:left;vertical-align:top}' +
      '@media print{body.exl-printing>*:not(#exlPrint){display:none!important}body.exl-printing #exlPrint{display:block!important;color:#000;background:#fff}}';
    document.head.appendChild(st);
  }
  EXL.compareView = function () {
    cmpStyle();
    const c = cmpState(), all = parcels();
    c.ids = c.ids.filter(id => all.some(p => p.id === id));
    let h = `<div class="alert"><b class="t">A side-by-side sheet, not a verdict</b>Everything here is what you typed in. Expandica never scores parcels, ranks them or names a best one. You choose which column to sort or highlight, and that marks only that one column.</div>`;
    h += `<div class="card"><div class="ct"><b>Pick 2 to 4 parcels</b><span class="tag">${c.ids.length} picked</span></div>
      ${all.map(p => `<label class="chk"><input type="checkbox" data-act="exlCmpPick" data-id="${esc(p.id)}" ${c.ids.indexOf(p.id) >= 0 ? 'checked' : ''}><span>${esc(p.name)} <span class="dim sm">${esc(p.state || '')}</span></span></label>`).join('')}</div>`;
    if (all.length < 2) return h + `<div class="card sm">Add at least two parcels (above, or in the Map tab) to compare them.</div>`;
    if (c.ids.length < 2) return h + `<div class="card sm">Tick two or more parcels to see the comparison.</div>`;
    const o = ordered(), r = c.by && rowOf(c.by);
    h += `<div class="card"><div class="ct"><b>Sort and highlight</b></div><div class="two">
      <label class="fl">Column<select class="in" data-bind="exl.cmp.by" data-then="exlCmpRedraw"><option value="">Keep my order</option>${sortable().map(x => `<option value="${x.k}" ${c.by === x.k ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></label>
      <label class="fl">Show first<select class="in" data-bind="exl.cmp.dir" data-then="exlCmpRedraw"><option value="low" ${c.dir !== 'high' ? 'selected' : ''}>Lowest</option><option value="high" ${c.dir === 'high' ? 'selected' : ''}>Highest</option></select></label></div>
      <p class="xs dim">${r ? 'Parcels are ordered by ' + esc(r.label.toLowerCase()) + ' only. Parcels with that value not entered go last. The outlined cell is just the ' + (c.dir === 'high' ? 'highest' : 'lowest') + ' entry in this one row, not a recommendation.' : 'Pick a column to order the parcels by it. Nothing is picked for you.'}</p></div>`;
    h += o.ps.map(p => {
      const s = stats(p), ppa = rowOf('ppa').s(p);
      return `<div class="card"><div class="ct"><b>${esc(p.name)}</b><span class="tag ${EX.stageOf(p).tag}">${esc(EX.stageOf(p).label)}</span></div>
        <div class="sm dim">${esc(cell(rowOf('place'), p) || 'County, state ' + NE)}</div>
        <div class="kv"><span>Price</span><b>${esc(cell(rowOf('price'), p) || NE)}</b></div>
        <div class="kv"><span>Acres</span><b>${esc(cell(rowOf('acres'), p) || NE)}</b></div>
        <div class="kv"><span>Price per acre</span><b>${esc(ppa || NE)}</b></div>
        <div class="kv"><span>Critical items open</span><b>${s.critOpen}</b></div>
        <button class="btn block" data-act="exlFacts" data-id="${esc(p.id)}">Edit facts for this parcel</button></div>`;
    }).join('');
    h += `<div class="card"><div class="ct"><b>Comparison table</b><span class="xs dim">swipe sideways</span></div><div class="scroll-x"><table class="exl-ct"><thead><tr><th></th>${o.ps.map(p => `<th>${esc(p.name)}</th>`).join('')}</tr></thead><tbody>
      ${EXL.cmpRows.map(rw => `<tr><th>${esc(rw.label)}</th>${o.ps.map(p => { const v = cell(rw, p); const hi = r && r.k === rw.k && o.hi.has(p.id); return `<td class="${hi ? 'hi' : ''}">${v == null ? '<i>' + NE + '</i>' : esc(v)}${hi ? `<div class="xs gold">${c.dir === 'high' ? 'highest' : 'lowest'} entry</div>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="xs dim">Annual cost comes from the Costs tab and counts only the parts you entered, so two parcels may not be comparable. Not legal, tax or financial advice.</p></div>
      <div class="row"><button class="btn gold" data-act="exlCmpShare">Share as text</button><button class="btn" data-act="exlCmpPrint">Print table</button></div>`;
    return h;
  }
  function factsForm(p) {
    const i = parcels().indexOf(p);
    const sel = (k, lab) => `<label class="fl">${lab}<select class="in" data-bind="ex.parcels.${i}.facts.${k}"><option value="">${NE}</option>${FACT_OPTS[k].map(o => `<option ${fx(p)[k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
    return `<p class="sm dim">Fill in only what you have confirmed. Blank shows as "${NE}". Saved on this parcel.</p>
      ${sel('access', 'Access type')}${sel('roadType', 'Road type')}${sel('water', 'Water source')}
      <label class="fl">Distance to power (miles)<input class="in" type="number" inputmode="decimal" min="0" step="any" value="${num(fx(p).powerMi) == null ? '' : esc(fx(p).powerMi)}" data-bind="ex.parcels.${i}.facts.powerMi"></label>
      ${sel('signal', 'Cell signal')}
      <label class="fl">Flood zone note<input class="in" maxlength="200" placeholder="e.g. map shows Zone X, checked 2026" value="${esc(fx(p).flood || '')}" data-bind="ex.parcels.${i}.facts.flood"></label>
      <label class="fl">Your notes<textarea class="in" rows="3" maxlength="600" data-bind="ex.parcels.${i}.facts.extra">${esc(fx(p).extra || '')}</textarea></label>
      <button class="btn gold block" data-act="exlFactsDone">Done</button>`;
  }
  OA.act({
    exlCmpPick(el) {
      const c = cmpState(), id = el.dataset.id, at = c.ids.indexOf(id);
      if (el.checked) { if (c.ids.length >= 4) { el.checked = false; OA.toast('Compare up to 4 parcels at a time'); return; } if (at < 0) c.ids.push(id); } else if (at >= 0) c.ids.splice(at, 1);
      OA.save(); OA.render(true);
    },
    exlCmpRedraw() { OA.save(); OA.render(true); },
    exlFacts(el) { const p = EX.parcels.get(el.dataset.id); if (!p) return; p.facts = p.facts || {}; OA.sheet('Facts: ' + p.name, factsForm(p)); },
    exlFactsDone() { OA.save(); OA.closeSheet(); },
    exlCmpShare() { OA.share.send({ title: 'Parcel comparison', text: cmpText() }); },
    exlCmpPrint() {
      let n = document.getElementById('exlPrint'); if (!n) { n = document.createElement('div'); n.id = 'exlPrint'; document.body.appendChild(n); }
      n.innerHTML = printHtml(); document.body.classList.add('exl-printing');
      const end = () => { document.body.classList.remove('exl-printing'); window.removeEventListener('afterprint', end); };
      window.addEventListener('afterprint', end);
      try { window.print(); } catch (e) { end(); OA.toast('Printing is not available here. Use Share as text.'); }
    }
  });

  /* ---------- actions ---------- */
  OA.act({
    exlAck() { L().ack = true; OA.save(); OA.render(true); },
    exlSel() { OA.saveSoon(); OA.render(true); },
    exlView(el) { L().view = el.dataset.v; OA.save(); OA.render(); window.scrollTo(0, 0); },
    exlTog(el) {
      const p = cur(); if (!p) return; p.diligence = p.diligence || {};
      if (el.checked) p.diligence[el.dataset.id] = true; else delete p.diligence[el.dataset.id];
      OA.saveSoon();
      if (L().view === 'flags') { OA.save(); OA.render(true); return; }
      const s = stats(p), pr = document.getElementById('exlProg'); if (pr) pr.innerHTML = progText(s);
      const b = document.getElementById('exlBar'); if (b) b.style.width = Math.round(100 * s.done / s.n) + '%';
      D().groups.forEach(g => { const t = document.querySelector('.exl-gc[data-g="' + g.id + '"]'); if (t) { const its = D().items.filter(i => i.g === g.id); t.textContent = its.filter(i => done(p, i.id)).length + '/' + its.length; } });
    },
    async exlReset() { const p = cur(); if (!p || !await OA.confirm('Clear all checks for "' + p.name + '"?', 'Clear')) return; p.diligence = {}; OA.save(); OA.render(true); },
    exlAdd() {
      const nm = (document.getElementById('exlNm').value || '').trim();
      if (!nm) { OA.toast('Give the parcel a name first'); return; }
      const p = EX.parcels.add({ name: nm, state: document.getElementById('exlSt').value, county: (document.getElementById('exlCo').value || '').trim() });
      L().sel = p.id; OA.save(); OA.render(); OA.toast('Parcel added');
    },
    exlCalc() { const p = cur(), o = document.getElementById('exlOut'); if (p && o) o.innerHTML = costOut(p); }
  });
})();
