/* Expandica: Family Map tab (id 'map'). Offline SVG map of parcels, add/edit sheet with stage stepper, scouting from the loaded campground data, Family Circuit card.
   Global: window.EXM. Uses EX (10-core.js) and OA only. */
window.EXM = window.EXM || {};
(function () {
  'use strict';
  const EXM = window.EXM, esc = OA.esc, G = OA.geo;
  const COLORS = { scouted: '#8fa3b0', visited: '#5fa0c9', contract: '#e0a458', owned: '#6fa97b', cabinplan: '#c9d46a', cabinbuilt: '#e8b04a', stop: '#f2e6b8' };
  const col = id => COLORS[id] || '#8fa3b0';
  let draft = null;      // unsaved new parcel while the add sheet is open
  let editId = null;     // id of the parcel open in the sheet ('new' for draft)
  let scoutQ = '', scoutSt = '';

  /* ---------- map geometry (own simplified outline, lon/lat; hand-drawn, not survey grade) ---------- */
  const OUTLINE = [[-124.7, 48.4], [-123.2, 48.2], [-122.8, 49], [-95.15, 49], [-94.6, 48.7], [-93, 48.6], [-91.5, 48.1], [-89.6, 48], [-92.1, 46.75], [-90.4, 46.6], [-88.4, 47.4], [-87.4, 46.5], [-84.9, 46.8], [-84.5, 46.45], [-84.7, 45.8], [-83.4, 45.2], [-83.3, 44.3], [-83.9, 43.7], [-82.6, 43.9], [-82.4, 43], [-83.1, 42.2], [-83.4, 41.7], [-82.7, 41.5], [-81.7, 41.5], [-80.5, 42], [-79, 42.7], [-79.05, 43.25], [-77.5, 43.3], [-76.2, 43.55], [-76.3, 44.1], [-75, 45], [-71.5, 45], [-70.8, 45.4], [-70, 46.7], [-69.2, 47.45], [-68.3, 47.35], [-67.8, 47.07], [-67.8, 45.7], [-67.4, 45.2], [-67, 44.9], [-68.2, 44.3], [-69, 44], [-70.2, 43.65], [-70.7, 43.1], [-70.8, 42.65], [-70.9, 42.3], [-70, 41.7], [-71.1, 41.5], [-72, 41.3], [-73.6, 40.95], [-74, 40.6], [-74, 40.4], [-74.1, 39.7], [-74.9, 38.95], [-75.5, 39.4], [-75.1, 38.4], [-75.9, 37.1], [-76, 36.95], [-75.7, 36], [-75.5, 35.25], [-76.5, 34.7], [-77.9, 33.9], [-79, 33.3], [-80, 32.6], [-81.1, 31.9], [-81.4, 30.7], [-81.3, 29.9], [-80.6, 28.4], [-80.05, 26.8], [-80.15, 25.8], [-80.4, 25.2], [-81.1, 25.15], [-81.8, 26.1], [-82.2, 26.9], [-82.7, 27.8], [-82.8, 28.9], [-83.7, 29.9], [-84.3, 30.05], [-85.3, 29.7], [-86.5, 30.4], [-88, 30.25], [-89.3, 30.3], [-89.2, 29.0], [-90.2, 29.1], [-91.3, 29.3], [-92.3, 29.55], [-93.8, 29.7], [-94.7, 29.35], [-96.4, 28.4], [-97.2, 27.6], [-97.4, 26.8], [-97.15, 25.95], [-99.1, 26.4], [-99.5, 27.5], [-100.3, 28.3], [-101, 29.4], [-102.3, 29.85], [-103.1, 28.98], [-104.5, 29.65], [-104.9, 30.6], [-106.5, 31.77], [-108.2, 31.78], [-108.2, 31.33], [-111.07, 31.33], [-114.8, 32.5], [-117.1, 32.53], [-117.3, 33.1], [-118.4, 33.75], [-119.2, 34.15], [-120.5, 34.45], [-120.65, 35.15], [-121.9, 36.6], [-122.5, 37.5], [-123, 38], [-123.8, 39], [-124.4, 40.4], [-124.1, 41.8], [-124.5, 42.8], [-124, 44.5], [-123.95, 46.2], [-124.1, 46.9]];
  const LAKE_MI = [[-87.6, 41.85], [-87.85, 43], [-87.5, 44.6], [-86.6, 45.7], [-85.6, 46.0], [-85, 45.8], [-85.6, 45], [-86.3, 44.3], [-86.5, 43.5], [-86.3, 42.5], [-86.9, 41.75]];
  const W = 360, MAPH_PAD = 8;
  /* Albers equal-area conic, standard parallels 29.5/45.5, centre 96W 37.5N */
  const rad = d => d * Math.PI / 180, P1 = rad(29.5), P2 = rad(45.5), P0 = rad(37.5), L0 = rad(-96);
  const AN = (Math.sin(P1) + Math.sin(P2)) / 2, AC = Math.cos(P1) ** 2 + 2 * AN * Math.sin(P1), R0 = Math.sqrt(AC - 2 * AN * Math.sin(P0)) / AN;
  const alb = (lon, lat) => { const r = Math.sqrt(AC - 2 * AN * Math.sin(rad(lat))) / AN, t = AN * (rad(lon) - L0); return [r * Math.sin(t), -(R0 - r * Math.cos(t))]; };
  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const pts = OUTLINE.map(p => alb(p[0], p[1])), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys), k = (W - 2 * MAPH_PAD) / (x1 - x0), H = Math.round((y1 - y0) * k + 2 * MAPH_PAD);
    const pr = (lon, lat) => { const a = alb(lon, lat); return [MAPH_PAD + (a[0] - x0) * k, MAPH_PAD + (a[1] - y0) * k]; };
    GEO = { pr, H, total: H + 78 };
    return GEO;
  }
  const poly = pts => pts.map(p => { const q = geo().pr(p[0], p[1]); return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ');
  /* insets for Alaska and Hawaii: simple lon/lat boxes, labelled */
  const AK = { x: 10, w: 150, h: 66, lon0: -170, lon1: -129, lat0: 51, lat1: 72 }, HI = { x: 172, w: 96, h: 66, lon0: -161, lon1: -154, lat0: 18.5, lat1: 22.5 };
  function place(p) {
    if (!EX.hasPos(p)) return null;
    const g = geo(), y0 = g.H + 4;
    if (p.lat >= 24 && p.lat <= 50 && p.lon >= -125.5 && p.lon <= -66) { const q = g.pr(p.lon, p.lat); return { x: q[0], y: q[1], main: true }; }
    const ins = (b, name) => (p.lon >= b.lon0 && p.lon <= b.lon1 && p.lat >= b.lat0 && p.lat <= b.lat1) ? { x: b.x + (p.lon - b.lon0) / (b.lon1 - b.lon0) * b.w, y: y0 + (b.lat1 - p.lat) / (b.lat1 - b.lat0) * b.h, main: false, inset: name } : null;
    return ins(AK, 'AK') || ins(HI, 'HI');
  }

  /* ---------- helpers ---------- */
  const n = v => (v === '' || v == null || isNaN(parseFloat(v))) ? null : parseFloat(v);
  const fmtDay = ts => OA.fmtDate(OA.dkey(new Date(ts)), { month: 'short', day: 'numeric', year: 'numeric' });
  function camps() { const c = window.CAMPS; return c && Array.isArray(c.items) ? c.items.filter(x => x && x.id && x.name != null) : []; }
  const campHasPos = c => typeof c.lat === 'number' && typeof c.lon === 'number';
  function place2(p) { return [p.county ? p.county + ' County' : '', p.state].filter(Boolean).join(', '); }

  /* ---------- tab ---------- */
  function counts() { const m = EX.parcels.byStage(); return EX.STAGES.map(s => ({ s, n: m[s.id].length })); }
  /* Grossmann Crossing overlay: the rural chain from Coast, Our plan (planning aid only) */
  function crossing(second) { try { const Q = window.EXC && (second ? EXC.secondPath && EXC.secondPath() : EXC.ourPlan && EXC.ourPlan({ rural: true })); return Q && Q.zones && Q.zones.length ? Q : null; } catch (e) { return null; } }
  function crossingCard(Q, Q2) {
    if (!Q) return '';
    const rows = (q, off) => q.zones.map((z, i) => `<div class="row sm"><span><b>${i + 1 + off}.</b> ${esc(z.city)}, ${esc(z.st)}</span><span class="dim xs">${i ? esc(Math.round(z.legMiles)) + ' mi, ' + esc(Math.round(z.legHours * 10) / 10) + ' h' : 'start'}</span></div>`).join('');
    const hd = (q, t, c) => `<div class="ct"><b style="color:${c}">${t}: ${esc(q.zones.length)} stops</b><span class="xs dim">avg ${esc(Math.round(q.legHours * 10) / 10)} h, longest ${esc(Math.round(q.maxLegHours * 10) / 10)} h</span></div>`;
    return `<div class="card">${hd(Q, 'Path 1, Central (gold)', '#e8b04a')}<p class="sm dim">Small-town areas, straight-line miles x 1.25, so real drives differ. Land prices were NOT checked. Change it in Coast, Our plan.</p>${rows(Q, 0)}</div>` +
      (Q2 ? `<div class="card">${hd(Q2, 'Path 2, Southern (blue)', '#7ec4e8')}<p class="sm dim">I-40 direction through the southwest, Oklahoma, Arkansas, Tennessee and North Carolina. Towns picked from memory; sizes and positions are NOT checked. Land prices were NOT checked.</p>${rows(Q2, Q.zones.length)}</div>` : '');
  }
  function mapSvg(list, circuit) {
    const g = geo(), y0 = g.H + 4, stops = circuit.stops.map(place).filter(q => q && q.main);
    let s = `<svg viewBox="0 0 ${W} ${g.total}" role="img" aria-label="Map of the United States with your parcels">`;
    for (let lat = 30; lat <= 50; lat += 10) { const a = []; for (let lon = -125; lon <= -66; lon += 3) { const q = g.pr(lon, lat); a.push(q[0].toFixed(1) + ',' + q[1].toFixed(1)); } s += `<polyline class="exm-grat" points="${a.join(' ')}"/>`; }
    for (let lon = -120; lon <= -70; lon += 10) { const a = []; for (let lat = 25; lat <= 49; lat += 2) { const q = g.pr(lon, lat); a.push(q[0].toFixed(1) + ',' + q[1].toFixed(1)); } s += `<polyline class="exm-grat" points="${a.join(' ')}"/>`; }
    s += `<polygon class="exm-land" points="${poly(OUTLINE)}"/><polygon class="exm-lake" points="${poly(LAKE_MI)}"/>`;
    s += `<rect class="exm-inset" x="${AK.x}" y="${y0}" width="${AK.w}" height="${AK.h}" rx="6"/><text class="exm-lbl" x="${AK.x + 6}" y="${y0 + 11}">Alaska</text>`;
    s += `<rect class="exm-inset" x="${HI.x}" y="${y0}" width="${HI.w}" height="${HI.h}" rx="6"/><text class="exm-lbl" x="${HI.x + 6}" y="${y0 + 11}">Hawaii</text>`;
    if (stops.length > 1) s += `<polyline class="exm-route" points="${stops.map(q => q.x.toFixed(1) + ',' + q.y.toFixed(1)).join(' ')}"/>`;
    [[crossing(), '#e8b04a', 0], [crossing(true), '#7ec4e8', 13]].forEach(([gp, col2, off]) => {
      if (!gp) return;
      s += `<polyline class="exm-route" style="stroke:${col2};stroke-dasharray:none;opacity:.8" points="${gp.zones.map(z => { const q = g.pr(z.lon, z.lat); return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ')}"/>`;
      gp.zones.forEach((z, i) => { const q = g.pr(z.lon, z.lat); s += `<g><title>${esc(z.city + ', ' + z.st)}</title><circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="8.5" fill="${col2}" stroke="#14110a" stroke-width="1.2"/><text x="${q[0].toFixed(1)}" y="${(q[1] + 3.6).toFixed(1)}" text-anchor="middle" font-size="${i + 1 + off > 9 ? 8.5 : 10}" font-weight="700" fill="#14110a">${i + 1 + off}</text></g>`; });
    });
    list.slice().sort((a, b) => EX.stageIdx(a.stage) - EX.stageIdx(b.stage)).forEach(p => {
      const q = place(p); if (!q) return;
      s += `<g data-act="exmOpen" data-id="${esc(p.id)}"><title>${esc(p.name)}</title><circle class="exm-hit" cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="16"/><circle class="exm-pin" cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="7" fill="${col(p.stage)}"/></g>`;
    });
    return s + '</svg>';
  }
  function parcelRow(p) {
    const st = EX.stageOf(p), loc = place2(p);
    return `<div class="li" data-act="exmOpen" data-id="${esc(p.id)}"><span class="exm-dot" style="background:${col(st.id)}"></span><div class="tx"><b>${esc(p.name)}</b><span>${esc(loc || 'Location not set')}${p.acres != null ? ' · ' + esc(p.acres) + ' acres' : ''}</span></div><div class="end"><span class="tag ${st.tag}">${esc(st.label)}</span>${EX.hasPos(p) ? '' : '<br><span class="xs">no map pin</span>'}</div></div>`;
  }
  function circuitCard(c) {
    if (!c.stops.length) return `<div class="card"><div class="ct"><b>Family Circuit</b></div><p class="sm dim">Your circuit is the chain of parcels you own, in a sensible driving order. It starts once a parcel with a location reaches the Owned stage.</p></div>`;
    const name = id => { const p = EX.parcels.get(id); return p ? p.name : ''; };
    let rows = '', longest = null;
    c.stops.forEach((p, i) => {
      rows += `<div class="exm-stop" data-act="exmOpen" data-id="${esc(p.id)}"><span class="exm-num">${i + 1}</span><div class="tx"><b>${esc(p.name)}</b><div class="sm dim">${esc(place2(p) || '')} · ${esc(EX.stageOf(p).label)}</div></div></div>`;
      const leg = c.legs[i];
      if (leg) { rows += `<div class="exm-leg">${esc(OA.dist(leg.mi, 0))} to the next stop</div>`; if (!longest || leg.mi > longest.mi) longest = leg; }
    });
    let hint = '';
    if (longest) {
      const a = EX.parcels.get(longest.from), b = EX.parcels.get(longest.to);
      const mid = G.dest(a, G.bearing(a, b), G.km(a, b) / 2);
      const near = camps().filter(campHasPos).map(k => ({ k, d: G.mi(mid, k) })).sort((x, y) => x.d - y.d).slice(0, 3);
      hint = `<div class="card inner"><b class="gold">Where to look for the next stop</b><p class="sm">Your longest gap is ${esc(OA.dist(longest.mi, 0))} between ${esc(a.name)} and ${esc(b.name)}. Its midpoint is near ${esc(G.fmtCoord(mid.lat, mid.lon, 'dd'))}.</p>`;
      if (near.length) hint += `<p class="sm dim">Campgrounds in this app that are closest to that midpoint (a place to start scouting from, nothing more):</p>` + near.map(o => `<div class="li" data-act="exmScoutPick" data-id="${esc(o.k.id)}"><div class="tx"><b>${esc(o.k.name)}</b><span>${esc(o.k.state || '')}${o.k.parent ? ' · ' + esc(o.k.parent) : ''}</span></div><div class="end">${esc(OA.dist(o.d, 0))} away<br><span class="gold">Scout here</span></div></div>`).join('');
      else hint += `<p class="sm dim">No campground with coordinates is loaded near there, so open a map around that point and look for towns and public land.</p>`;
      hint += `<p class="xs dim">This only shows where your route is thinnest. It says nothing about whether land is for sale, its price, or whether it is suitable.</p></div>`;
    } else if (c.stops.length === 1) hint = `<p class="sm dim">One stop so far. Once a second parcel is owned, the gap between them will show here with a place to look for a stop in between.</p>`;
    return `<div class="card"><div class="ct"><b>Family Circuit</b><span class="tag g">${c.stops.length} ${c.stops.length === 1 ? 'stop' : 'stops'}</span></div>
      ${c.stops.length > 1 ? `<div class="stat"><div><b>${esc(OA.dist(c.miles, 0))}</b><span>TOTAL</span></div><div><b>${esc(OA.dist(longest.mi, 0))}</b><span>LONGEST GAP</span></div></div>` : ''}
      ${rows}<p class="xs dim">Distances are straight-line miles times 1.25 as a rough road estimate. Order is nearest-next, not an optimised route. Stops count once a parcel with a location is Owned or later.</p>${hint}</div>`;
  }
  function render() {
    const all = EX.parcels.list(), c = EX.circuit(), unpinned = all.filter(p => !place(p));
    const hdr = OA.header('Family Map', 'Where we are, where we are headed');
    const stats = `<div class="exm-stats">${counts().map(o => `<span class="exm-pill"><span class="exm-dot" style="background:${col(o.s.id)}"></span>${esc(o.s.label)} <b>${o.n}</b></span>`).join('')}</div>`;
    const bar = `<button class="btn gold" data-act="exmAdd" data-smoke>+ Add parcel</button><button class="btn" data-act="exmScout">Scout from a campground</button>${window.OCC && OCC.places && OCC.places.list().length ? '<button class="btn" data-act="exmPlaces">Scout from saved places</button>' : ''}`;
    let top;
    if (!all.length) top = `<div class="card exm-empty"><h2 class="big">Start the map</h2><p class="sm dim">Nothing here yet. Add the first place you are thinking about, or start from a campground you have stayed at: that is a real spot you already know.</p><div class="row">${bar}</div></div>`;
    else top = `<div class="exm-bar">${bar}</div>`;
    const list = all.slice().sort((a, b) => EX.stageIdx(b.stage) - EX.stageIdx(a.stage) || (b.created || 0) - (a.created || 0));
    let lists = '';
    if (unpinned.length) lists += `<div class="card"><div class="ct"><b>Not on the map yet</b></div><p class="sm dim">These have no usable coordinates. Open one and add latitude and longitude, or use your location.</p>${unpinned.slice(0, 80).map(parcelRow).join('')}</div>`;
    const pinned = list.filter(p => place(p));
    if (pinned.length) lists += `<div class="card"><div class="ct"><b>Parcels on the map</b><span class="xs dim">${pinned.length}</span></div>${pinned.slice(0, 80).map(parcelRow).join('')}${pinned.length > 80 ? '<p class="xs dim">Showing the first 80.</p>' : ''}</div>`;
    return hdr + stats + top + `<div class="exm-map">${mapSvg(all, c)}</div><p class="xs dim" style="margin:-6px 2px 12px">Simplified outline for orientation. Pins are only as exact as the coordinates you enter. Dashed line = Family Circuit. Gold = path 1, blue = path 2 (Grossmann Crossing, 26 stops).</p>` + crossingCard(crossing(), crossing(true)) + circuitCard(c) + lists + `<p class="xs dim" style="text-align:center;margin:18px 0">Expandica version ${esc((OA.meta && OA.meta.version) || '')}</p>`;
  }
  OA.tab({ id: 'map', label: 'Map', icon: 'map', order: 1, render: () => render() });

  /* ---------- parcel sheet ---------- */
  function cur() { return editId === 'new' ? draft : EX.parcels.get(editId); }
  function sheetHtml() {
    const p = cur(); if (!p) return '<p class="dim">This parcel is gone.</p>';
    const isNew = editId === 'new', id = esc(editId), st = EX.stageOf(p), si = EX.stageIdx(p.stage), next = EX.STAGES[si + 1];
    const f = (k, label, v, extra) => `<label class="fl">${label}<input class="in" data-onchange="exmField" data-f="${k}" data-id="${id}" value="${esc(v == null ? '' : v)}" ${extra || ''}></label>`;
    let h = `<div class="sh-sec"><label class="fl">Name<input class="in" data-onchange="exmField" data-f="name" data-id="${id}" value="${esc(p.name)}" maxlength="80" placeholder="e.g. Pine Ridge lot"></label>
      <div class="exm-two"><label class="fl">State<select class="in" data-onchange="exmField" data-f="state" data-id="${id}"><option value="">Choose</option>${EX.states.map(s => `<option ${s === p.state ? 'selected' : ''}>${s}</option>`).join('')}</select></label>${f('county', 'County', p.county, 'maxlength="60"')}</div>
      <div class="exm-two">${f('acres', 'Acres', p.acres, 'inputmode="decimal"')}${f('priceUsd', 'Asking price (optional)', p.priceUsd, 'inputmode="decimal" placeholder="optional"')}</div>
      <div class="exm-two">${f('lat', 'Latitude', p.lat, 'inputmode="decimal" placeholder="e.g. 38.58"')}${f('lon', 'Longitude', p.lon, 'inputmode="decimal" placeholder="e.g. -121.49"')}</div>
      <button class="btn block" data-act="exmLocate">Use my location for the coordinates</button>
      <p class="xs dim">Standing on the land gives the best pin. Coordinates are saved on this phone only.</p>
      <label class="fl">Notes<textarea class="in" rows="3" data-onchange="exmField" data-f="notes" data-id="${id}" placeholder="What you saw, who to call, questions to ask">${esc(p.notes)}</textarea></label></div>`;
    h += `<div class="sh-sec"><h3>Stage: ${esc(st.label)}</h3><div class="exm-steps">${EX.STAGES.map((s, i) => `<button class="chip ${i === si ? 'on' : ''}" data-act="exmStage" data-stage="${s.id}">${esc(s.label)}</button>`).join('')}</div>`;
    if (next && !isNew) h += `<button class="btn gold block" data-act="exmStage" data-stage="${next.id}">Move to: ${esc(next.label)}</button>`;
    if (!isNew && p.stageLog && p.stageLog.length) h += `<h3>History</h3><div class="exm-hist">${p.stageLog.slice().reverse().map(e => { const s = EX.STAGES[EX.stageIdx(e.stage)]; return `<div><span>${esc(s ? s.label : e.stage)}</span><span>${esc(fmtDay(e.ts))}</span></div>`; }).join('')}</div>`;
    h += `</div>`;
    if (EX.hasPos(p)) { const L = G.mapLinks(p.lat, p.lon, p.name); h += `<div class="sh-sec"><h3>Look at it</h3><p class="sm"><a href="${esc(L.osm)}" target="_blank" rel="noopener">OpenStreetMap</a> · <a href="${esc(L.apple)}" target="_blank" rel="noopener">Apple Maps</a> · <a href="${esc(L.google)}" target="_blank" rel="noopener">Google Maps</a></p><p class="xs dim">Opening these needs signal. Parcel boundaries and ownership come from the county assessor or recorder, not from this app.</p></div>`; }
    h += isNew ? `<div class="row"><button class="btn gold" data-act="exmSave">Save parcel</button></div>` : `<div class="row"><button class="btn" data-act="closeSheet">Done</button><button class="btn danger" data-act="exmDelete">Delete parcel</button></div>`;
    return h;
  }
  function openParcel(id) { editId = id; OA.sheet(id === 'new' ? 'New parcel' : 'Parcel', sheetHtml(), { onClose: () => { if (editId === 'new') draft = null; editId = null; } }); }
  function newDraft(over) { draft = Object.assign({ name: '', state: '', county: '', acres: null, priceUsd: null, lat: null, lon: null, stage: 'scouted', notes: '', links: {} }, over || {}); }

  OA.act({
    exmOpen(el) { openParcel(el.dataset.id); },
    exmAdd() { newDraft(); openParcel('new'); },
    exmField(el) {
      const k = el.dataset.f, p = el.dataset.id === 'new' ? draft : EX.parcels.get(el.dataset.id); if (!p) return;
      let v = el.value;
      if (k === 'acres' || k === 'priceUsd') { v = n(v); if (v != null && v < 0) v = null; }
      else if (k === 'lat' || k === 'lon') { v = n(v); if (v != null && (k === 'lat' ? Math.abs(v) > 90 : Math.abs(v) > 180)) { OA.toast('That is not a valid ' + (k === 'lat' ? 'latitude (-90 to 90)' : 'longitude (-180 to 180)') + '.'); v = null; el.value = ''; } }
      else v = String(v).trim();
      if (k === 'name' && !v && el.dataset.id !== 'new') { OA.toast('A parcel needs a name.'); el.value = p.name; return; }
      if (el.dataset.id === 'new') p[k] = v; else EX.parcels.update(p.id, { [k]: v });
    },
    exmLocate(el) {
      const p = cur(); if (!p) return;
      el.disabled = true; el.textContent = 'Finding you...';
      return G.position().then(pos => { p.lat = OA.round(pos.lat, 6); p.lon = OA.round(pos.lon, 6); if (editId !== 'new') EX.parcels.update(p.id, { lat: p.lat, lon: p.lon }); OA.redrawSheet(sheetHtml()); OA.toast('Coordinates set from your location (about ' + Math.round(pos.acc || 0) + ' m).'); })
        .catch(e => { el.disabled = false; el.textContent = 'Use my location for the coordinates'; OA.toast(e.message); });
    },
    exmStage(el) {
      const p = cur(); if (!p) return; const s = el.dataset.stage; if (s === p.stage) return;
      if (editId === 'new') { p.stage = s; } else EX.advance(p.id, s);
      OA.redrawSheet(sheetHtml());
    },
    exmSave() {
      if (!draft) return;
      if (!String(draft.name || '').trim()) { OA.toast('Give the parcel a name first.'); return; }
      const p = EX.parcels.add(draft); draft = null; editId = null; OA.toast('Saved ' + p.name + '.'); OA.closeSheet();
    },
    async exmDelete() {
      const p = cur(); if (!p) return;
      if (!await OA.confirm('Delete "' + p.name + '" and its history? This cannot be undone.', 'Delete')) return;
      const id = p.id; editId = null; EX.parcels.remove(id); OA.closeSheet(); OA.toast('Parcel deleted.');
    },
    exmScout() { scoutQ = ''; OA.sheet('Scout from a campground', scoutHtml(), { onOpen: root => { const i = root.querySelector('#exmq'); if (i) i.addEventListener('input', debounce(() => { scoutQ = i.value; fillResults(); }, 200)); const s = root.querySelector('#exms'); if (s) s.addEventListener('change', () => { scoutSt = s.value; fillResults(); }); fillResults(); } }); },
    exmPlaces() {
      const l = OCC.places.list().slice(0, 60);
      OA.sheet('Saved places', `<p class="sm dim">Places you saved in Campica or Roadtripica on this site. Picking one makes a scouted parcel there.</p>` + l.map(p => `<div class="li" data-act="exmPlacePick" data-id="${esc(p.id)}"><div class="tx"><b>${esc(p.name)}</b><span>${esc(p.state || '')}${p.lat == null ? ' · no map position' : ''}</span></div></div>`).join(''));
    },
    exmPlacePick(el) {
      const k = OCC.places.list().find(x => x.id === el.dataset.id); if (!k) return;
      const has = typeof k.lat === 'number' && typeof k.lon === 'number';
      const p = EX.parcels.add({ name: 'Near ' + k.name, state: k.state || '', lat: has ? k.lat : null, lon: has ? k.lon : null, stage: 'scouted', notes: 'from a saved place' + (has ? '' : ' (no coordinates yet; add them)'), links: k.ref ? { ref: k.ref } : {} });
      OA.closeAllSheets(); OA.toast('Scouted parcel created.'); OA.render(); openParcel(p.id);
    },
    exmScoutPick(el) {
      const k = camps().find(c => c.id === el.dataset.id); if (!k) { OA.toast('That campground is not in the loaded list.'); return; }
      const has = campHasPos(k);
      const p = EX.parcels.add({ name: 'Near ' + k.name, state: k.state || '', county: k.county || '', lat: has ? k.lat : null, lon: has ? k.lon : null, stage: 'scouted', notes: 'camped here' + (has ? '' : ' (campground has no coordinates on file; add them)') + (k.parent ? '. ' + k.parent : ''), links: { campId: k.id } });
      OA.closeAllSheets(); OA.toast('Scouted parcel created at ' + k.name + '.'); OA.render(); openParcel(p.id);
    }
  });
  function debounce(f, ms) { let t; return function () { clearTimeout(t); t = setTimeout(f, ms); }; }
  function scoutHtml() {
    const sts = Array.from(new Set(camps().map(c => c.state).filter(Boolean))).sort();
    return `<p class="sm dim">Pick a campground you have stayed at. This creates a scouted parcel at its position with the note "camped here". You can move the pin later.</p>
      <input class="in" id="exmq" type="search" placeholder="Search by name or park" value="${esc(scoutQ)}" autocomplete="off"><label class="fl">State<select class="in" id="exms"><option value="">All states</option>${sts.map(s => `<option ${s === scoutSt ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label><div id="exmres" class="exm-res"></div>`;
  }
  function fillResults() {
    const box = document.getElementById('exmres'); if (!box) return;
    const all = camps();
    if (!all.length) { box.innerHTML = '<div class="alert"><b class="t">No campground list loaded</b>You can still add a parcel by hand with the Add parcel button.</div>'; return; }
    const q = scoutQ.trim().toLowerCase();
    if (q.length < 2 && !scoutSt) { box.innerHTML = `<p class="sm dim">${all.length} campgrounds are loaded. Type at least two letters or choose a state.</p>`; return; }
    const m = all.filter(c => (!scoutSt || c.state === scoutSt) && (!q || (String(c.name) + ' ' + (c.parent || '')).toLowerCase().includes(q)));
    box.innerHTML = (m.length ? m.slice(0, 40).map(c => `<div class="li" data-act="exmScoutPick" data-id="${esc(c.id)}"><div class="tx"><b>${esc(c.name)}</b><span>${esc(c.state || '')}${c.parent ? ' · ' + esc(c.parent) : ''}</span></div><div class="end">${campHasPos(c) ? 'Use' : '<span class="xs">no coordinates</span>'}</div></div>`).join('') + (m.length > 40 ? `<p class="xs dim">${m.length} matches; showing 40. Narrow the search.</p>` : '') : '<p class="sm dim">No match. Try fewer letters.</p>');
  }
  EXM.place = place;
  /* read-only hook for the Coast tab (70-coast.js): same projection and outline as this map */
  EXM.proj = { pr: (lon, lat) => geo().pr(lon, lat), height: () => geo().H, width: W, outline: OUTLINE, lake: LAKE_MI, poly: poly };
})();
