/* Expandica 70-coast: the 'Coast' tab. Carries the family's expansion from the west coast to the east coast:
   corridor presets, stop-zone planner with coverage, a mini map (same projection as the Map tab), States collected, expansion path,
   plus three badges and four quests that this file adds to the Quests module at load (EXQ.BADGES / EXQ_DATA.quests, no edits to its files).
   Global: window.EXC. Reads EX (10-core), EXM.proj (20-map), EXC_DATA (data/corridors.js), window.CAMPS and OCC.places defensively.
   Pure math lives in EXC.calc so it can be tested in node (tools/test-coast.js style test in the scratchpad). */
window.EXC = window.EXC || {};
(function () {
  'use strict';
  const EXC = window.EXC, esc = OA.esc, D = window.EXC_DATA || { corridors: [], states: [], regions: [], pacific: [], atlantic: [], coastMiles: 150, roadFactor: 1.25, defaults: { spacing: 300, radius: 75 }, limits: { spacingMin: 100, spacingMax: 600 }, quests: [] };
  const R_MI = 3958.8, rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;

  /* =====================  PURE MATH (no DOM, no state)  ===================== */
  const calc = {};
  /* great-circle miles between {lat,lon} points (haversine, earth radius 3958.8 mi) */
  calc.mi = (a, b) => {
    const dLa = rad(b.lat - a.lat), dLo = rad(b.lon - a.lon), h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLo / 2) ** 2;
    return 2 * R_MI * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  /* great-circle interpolation, f in 0..1 */
  calc.lerp = (a, b, f) => {
    const d = calc.mi(a, b) / R_MI; if (d < 1e-9) return { lat: a.lat, lon: a.lon };
    const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(rad(a.lat)) * Math.cos(rad(a.lon)) + B * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon));
    const y = A * Math.cos(rad(a.lat)) * Math.sin(rad(a.lon)) + B * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon));
    const z = A * Math.sin(rad(a.lat)) + B * Math.sin(rad(b.lat));
    return { lat: deg(Math.atan2(z, Math.sqrt(x * x + y * y))), lon: deg(Math.atan2(y, x)) };
  };
  /* waypoint polyline: straight-line miles (sum of legs) and road estimate (x roadFactor) */
  calc.length = (wps, factor) => {
    let s = 0; for (let i = 1; i < wps.length; i++) s += calc.mi(wps[i - 1], wps[i]);
    return { straight: s, road: s * (factor || D.roadFactor || 1.25) };
  };
  /* point at `roadMi` road-miles along the polyline (road miles = straight miles x factor) */
  calc.pointAt = (wps, roadMi, factor) => {
    const f = factor || D.roadFactor || 1.25; let want = Math.max(0, roadMi) / f;
    for (let i = 1; i < wps.length; i++) {
      const L = calc.mi(wps[i - 1], wps[i]);
      if (want <= L || i === wps.length - 1) { const t = L ? Math.min(1, want / L) : 0; return calc.lerp(wps[i - 1], wps[i], t); }
      want -= L;
    }
    return { lat: wps[0].lat, lon: wps[0].lon };
  };
  /* nearest listed city (from `cities`: [{name,st,lat,lon}]) */
  calc.nearestCity = (p, cities) => {
    let best = null; (cities || []).forEach(c => { const d = calc.mi(p, c); if (!best || d < best.mi) best = { name: c.name, st: c.st, mi: d }; });
    return best;
  };
  /* stop zones: n = ceil(road / spacing), centred in n equal slices, so no slice is longer than the spacing */
  calc.zones = (wps, spacing, cities, factor) => {
    const len = calc.length(wps, factor), sp = Math.max(1, spacing), n = Math.max(1, Math.ceil(len.road / sp - 1e-9)), out = [];
    for (let i = 0; i < n; i++) {
      const at = (i + 0.5) * len.road / n, pt = calc.pointAt(wps, at, factor), c = calc.nearestCity(pt, cities || wps);
      out.push({ i: i + 1, at, lat: pt.lat, lon: pt.lon, city: c ? c.name : '', st: c ? c.st : '', cityMi: c ? c.mi : null });
    }
    return { zones: out, n, road: len.road, straight: len.straight, slice: len.road / n };
  };
  /* status: 'covered' = a parcel at rank >= ownedRank within radius; 'progress' = any other located parcel within radius; else 'open'.
     parcels: [{lat,lon,rank}] where rank is the stage index. */
  calc.cover = (zones, parcels, radius, ownedRank) => {
    const pos = (parcels || []).filter(p => typeof p.lat === 'number' && typeof p.lon === 'number');
    return zones.map(z => {
      let st = 'open', near = 0;
      pos.forEach(p => { if (calc.mi(z, p) <= radius) { near++; if (p.rank >= ownedRank) st = 'covered'; else if (st === 'open') st = 'progress'; } });
      return Object.assign({}, z, { status: st, near });
    });
  };
  /* longest stretch (road miles) between covered points, counting the route's two ends as boundaries */
  calc.longestGap = (zs, road) => {
    const pts = [0].concat(zs.filter(z => z.status === 'covered').map(z => z.at), [road]); let g = 0;
    for (let i = 1; i < pts.length; i++) g = Math.max(g, pts[i] - pts[i - 1]);
    return g;
  };
  calc.summary = (zs, road) => {
    const n = zs.length, cov = zs.filter(z => z.status === 'covered').length, prog = zs.filter(z => z.status === 'progress').length;
    return { n, covered: cov, progress: prog, open: n - cov - prog, pct: n ? Math.round(cov / n * 100) : 0, gap: calc.longestGap(zs, road), next: zs.find(z => z.status === 'open') || null };
  };
  /* distance in miles from point p to a lat/lon polyline [[lat,lon],...] (local flat projection around p; fine for a 150 mile test) */
  calc.distToLine = (p, line) => {
    const k = 69.17, cx = Math.cos(rad(p.lat)), xy = q => [(q[1] - p.lon) * cx * k, (q[0] - p.lat) * k]; let best = Infinity;
    for (let i = 1; i < line.length; i++) {
      const a = xy(line[i - 1]), b = xy(line[i]), dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
      let t = L2 ? -(a[0] * dx + a[1] * dy) / L2 : 0; t = Math.max(0, Math.min(1, t));
      best = Math.min(best, Math.hypot(a[0] + t * dx, a[1] + t * dy));
    }
    return best;
  };
  /* COAST RULES (documented, approximate): a point is on the "west coast side" when it is within coastMiles (150) of the
     simplified Pacific line in D.pacific, and on the "east coast side" when within 150 miles of the Atlantic line in D.atlantic
     (Gulf coast does not count). Both lines are hand-simplified outlines, so treat the result as a game rule, not a survey. */
  calc.coastSide = p => {
    const lim = D.coastMiles || 150;
    return { west: calc.distToLine(p, D.pacific) <= lim, east: calc.distToLine(p, D.atlantic) <= lim, westMi: calc.distToLine(p, D.pacific), eastMi: calc.distToLine(p, D.atlantic) };
  };
  /* Grossmann path: sites at both ends and evenly spaced between (same rule as EXC_BUDGET.legs).
     wps = [{name,st,lat,lon}], B = EXC_BUDGET, cities = [{name,st,lat,lon}] used only to name each point. Pure, node-testable. */
  calc.sitePlan = (wps, hours, mph, cities, B, factor) => {
    const len = calc.length(wps, factor), L = B.legs(len.road, hours, mph), out = [];
    for (let k = 0; k < L.sites; k++) {
      const at = L.sites > 1 ? Math.min(len.road, k * L.legMiles) : 0, pt = calc.pointAt(wps, at, factor), c = calc.nearestCity(pt, cities || wps);
      out.push({ i: k + 1, at, lat: pt.lat, lon: pt.lon, city: c ? c.name : '', st: c ? c.st : '', cityMi: c ? c.mi : null, legMiles: k ? L.legMiles : 0, legHours: k ? L.legHours : 0 });
    }
    return { road: len.road, straight: len.straight, sites: L.sites, legs: L.legs, legMiles: L.legMiles, legHours: L.legHours, zones: out };
  };
  /* RURAL CHAIN: n evenly spaced targets along the corridor polyline (both ends at the corridor ends), each snapped to the nearest small town
     within `radius` miles that is not used yet. Score = straight miles + a small head start for smaller towns (penalty by size band), and a town must lie east of the
     previous pick, so the chain runs west to east. If nothing is in range the nearest unused town is taken and flagged outOfRange.
     swaps = { siteNumber: { id } | { name, st, lat, lon } } are the user's own choices; they win and reserve their town first.
     Leg miles = great-circle between consecutive chosen sites x factor; hours = miles / mph. Pure, node-testable. */
  calc.ruralChain = (wps, towns, o) => {
    o = o || {};
    const n = Math.max(2, o.n || 13), radius = o.radius || 60, f = o.factor || D.roadFactor || 1.25, mph = o.mph > 0 ? o.mph : 60, warnH = o.warnHours || 6;
    const pen = o.penalty || { 1: 1.5, 2: 6, 3: 15 }, swaps = o.swaps || {}, list = (towns || []).filter(t => t && typeof t.lat === 'number' && typeof t.lon === 'number');
    const len = calc.length(wps, f), targets = [], used = {}, pick = new Array(n).fill(null);
    for (let k = 0; k < n; k++) { const at = k * len.road / (n - 1), p = calc.pointAt(wps, at, f); targets.push({ at, lat: p.lat, lon: p.lon }); }
    const typedOk = w => w && typeof w.lat === 'number' && typeof w.lon === 'number' && isFinite(w.lat) && isFinite(w.lon) && w.lat >= 24 && w.lat <= 50 && w.lon >= -125 && w.lon <= -66;
    for (let i = 0; i < n; i++) {
      const sw = swaps[i + 1]; if (!sw) continue;
      if (sw.id) { const t = list.find(x => x.id === sw.id); if (t && !used[t.id]) { used[t.id] = 1; pick[i] = Object.assign({}, t, { swapped: true }); } }
      else if (typedOk(sw)) pick[i] = { id: 'typed-' + (i + 1), name: String(sw.name || 'My point').slice(0, 40), st: String(sw.st || '').slice(0, 2).toUpperCase(), lat: sw.lat, lon: sw.lon, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false, typed: true, swapped: true };
    }
    let prevLon = -Infinity;
    for (let i = 0; i < n; i++) {
      if (pick[i]) continue;   /* the user's own picks do not move the west-to-east marker for the automatic ones */
      const tg = targets[i]; let best = null, near = null;
      list.forEach(t => {
        if (used[t.id]) return;
        const d = calc.mi(tg, t), east = t.lon > prevLon;
        if (east && d <= radius) { const sc = d + (pen[t.band] != null ? pen[t.band] : pen[2]); if (!best || sc < best.sc) best = { t, d, sc }; }
        if (east && (!near || d < near.d)) near = { t, d };
      });
      const c = best || near;
      if (!c) { const any = list.filter(t => !used[t.id]).map(t => ({ t, d: calc.mi(tg, t) })).sort((a, b) => a.d - b.d)[0]; if (!any) continue; pick[i] = Object.assign({}, any.t); }
      else pick[i] = Object.assign({}, c.t);
      used[pick[i].id] = 1; prevLon = pick[i].lon;
    }
    const sites = [], warnings = []; let sum = 0, maxMi = 0, maxI = 0;
    pick.forEach((t, i) => {
      if (!t) return;
      const prev = sites[sites.length - 1], mi = prev ? calc.mi(prev, t) * f : 0, tg = targets[i], snap = calc.mi(tg, t);
      if (prev) { sum += mi; if (mi > maxMi) { maxMi = mi; maxI = sites.length; } }
      sites.push(Object.assign({}, t, { i: sites.length + 1, targetLat: tg.lat, targetLon: tg.lon, at: tg.at, snapMi: snap, legMiles: mi, legHours: mi / mph, outOfRange: snap > radius + 1e-9 }));
    });
    sites.forEach((z, k) => {
      if (z.legHours > warnH) warnings.push('Leg ' + k + ' to ' + (k + 1) + ' (' + sites[k - 1].name + ' to ' + z.name + ') is about ' + (Math.round(z.legHours * 10) / 10) + ' h of driving, over ' + warnH + ' h. Swap a town to shorten it.');
      if (z.outOfRange) warnings.push('Site ' + z.i + ' (' + z.name + ') is ' + Math.round(z.snapMi) + ' miles from its target point, more than ' + radius + '. ' + (z.typed || z.swapped ? 'It is your own choice.' : 'No listed town is closer on the east side of the last site.'));
      if (k > 0 && z.lon <= sites[k - 1].lon) warnings.push('Site ' + z.i + ' (' + z.name + ') is not east of site ' + k + ': the chain no longer runs west to east.');
    });
    const legs = Math.max(0, sites.length - 1);
    return { n, radius, warnHours: warnH, road: len.road, straight: len.straight, targets, sites, legs, roadMiles: sum, legMiles: legs ? sum / legs : 0, legHours: legs ? sum / legs / mph : 0, maxLegMiles: maxMi, maxLegHours: maxMi / mph, maxLegAt: maxI, warnings };
  };
  EXC.calc = calc;

  /* =====================  STATE  ===================== */
  if (typeof OA.defaults === 'function') OA.defaults({ ex: { coast: { corr: '', spacing: D.defaults.spacing, radius: D.defaults.radius, a: null, b: null } } });
  const S = () => OA.S.ex;
  const BAREDIM = { '8x10': 1, '10x12': 1, '12x16': 1 };
  const PLN = () => window.EXC_PLAN || { hoursChoices: [8, 10, 12], hoursDefault: 10, starts: [{ id: 'sac', name: 'Sacramento', st: 'CA', lat: 38.6, lon: -121.5 }], cities: [], kit: [], phases: [], tiers: [], startLimits: { lonMax: -119.5, lonMin: -125, latMin: 35.5, latMax: 42 }, lineLabel: {} };
  function ensurePlan(c) {
    const P = PLN(); let p = c.plan; if (!p || typeof p !== 'object') p = c.plan = {};
    if (P.hoursChoices.indexOf(p.hours) < 0) p.hours = P.hoursDefault;
    if (typeof p.start !== 'string' || (p.start !== 'custom' && !P.starts.some(x => x.id === p.start))) p.start = (P.starts[0] || {}).id || 'sac';
    if (p.start === 'custom' && !(p.startPt && typeof p.startPt.lat === 'number' && typeof p.startPt.lon === 'number')) p.start = (P.starts[0] || {}).id || 'sac';
    if (['land', 'bare', 'camp', 'shed', 'cabin'].indexOf(p.tier) < 0) p.tier = 'camp';
    if (typeof p.rural !== 'boolean') p.rural = true;
    ['done', 'dates', 'sites', 'swaps'].forEach(k => { if (!p[k] || typeof p[k] !== 'object' || Array.isArray(p[k])) p[k] = {}; });
    (P.phases || []).forEach(ph => { if (typeof p.dates[ph.id] !== 'string') p.dates[ph.id] = ''; });
    if (typeof p.siteSel !== 'number' || p.siteSel < 1) p.siteSel = 1;
    return p;
  }
  function ensure() {
    const s = S(); s.coast = s.coast || {};
    const c = s.coast, L = D.limits;
    if (typeof c.spacing !== 'number' || !isFinite(c.spacing)) c.spacing = D.defaults.spacing;
    c.spacing = Math.max(L.spacingMin, Math.min(L.spacingMax, c.spacing));
    if (typeof c.radius !== 'number' || !isFinite(c.radius) || c.radius <= 0) c.radius = D.defaults.radius;
    c.radius = Math.max(10, Math.min(300, c.radius));
    if (typeof c.corr !== 'string') c.corr = '';
    const BD = window.EXC_BUDGET ? EXC_BUDGET.D.defaults : {};
    if (!c.bud || typeof c.bud !== 'object') c.bud = Object.assign({ src: 'corr', nCamp: 0, nCabin: 0 }, BD);
    ['shedLo', 'shedHi'].forEach(k => { if (typeof c.bud[k] !== 'number' && BD[k] != null) c.bud[k] = BD[k]; });
    ['bareSize', 'bareConc', 'bareShed'].forEach(k => { if (typeof c.bud[k] !== 'string' || (k === 'bareConc' ? ['none', 'rmx', 'pro', 'bag'].indexOf(c.bud[k]) < 0 : !BAREDIM[c.bud[k]])) c.bud[k] = BD[k] || (k === 'bareConc' ? 'none' : '8x10'); });
    if (typeof c.bud.bareShedFlat !== 'number' || c.bud.bareShedFlat < 0) c.bud.bareShedFlat = BD.bareShedFlat != null ? BD.bareShedFlat : 600;
    if (c.bud.bareThk !== 4 && c.bud.bareThk !== 6) c.bud.bareThk = 4;
    if ([500, 1000, 2000].indexOf(c.bud.barePs) < 0) c.bud.barePs = 500;
    if (c.bud.barePower !== 'battery') c.bud.barePower = 'station';
    if (typeof c.bud.bareBatt !== 'number' || c.bud.bareBatt < 1 || c.bud.bareBatt > 6) c.bud.bareBatt = 2;
    if (typeof c.bud.bareRebar !== 'boolean') c.bud.bareRebar = false;
    if (!c.bud.stateLot || typeof c.bud.stateLot !== 'object' || Array.isArray(c.bud.stateLot)) c.bud.stateLot = {};
    ensurePlan(c);
    if (!c.plan.stSort || typeof c.plan.stSort !== 'object') c.plan.stSort = { k: 'first', dir: 1 };
    return c;
  }
  const hasEX = () => !!(window.EX && EX.parcels);
  const parcels = () => hasEX() ? EX.parcels.list() : [];
  const ownedRank = () => hasEX() ? EX.stageIdx('owned') : 3;
  const rankOf = p => hasEX() ? EX.stageIdx(p.stage) : 0;
  const located = p => typeof p.lat === 'number' && typeof p.lon === 'number';
  const camps = () => { const c = window.CAMPS; return c && Array.isArray(c.items) ? c.items.filter(x => x && x.id && x.name != null && typeof x.lat === 'number' && typeof x.lon === 'number') : []; };
  const allCities = (() => { const m = {}; D.corridors.forEach(c => c.wp.forEach(w => { m[w[0] + w[1]] = { name: w[0], st: w[1], lat: w[2], lon: w[3] }; })); return Object.keys(m).map(k => m[k]); })();
  const wpObj = w => ({ name: w[0], st: w[1], lat: w[2], lon: w[3] });

  /* current route as waypoints [{name,st,lat,lon}] (custom: two points, west one first) */
  function route() {
    const c = ensure();
    if (c.corr === 'custom') {
      if (!(c.a && c.b)) return null;
      const pts = [c.a, c.b].map(x => ({ name: x.name || 'Point', st: x.st || '', lat: x.lat, lon: x.lon }));
      if (pts[0].lon > pts[1].lon) pts.reverse();
      if (calc.mi(pts[0], pts[1]) < 50) return null;
      return { id: 'custom', name: 'Choose my own', hint: 'A straight line between your two points (west to east).', wps: pts, cities: allCities };
    }
    const k = D.corridors.find(x => x.id === c.corr); if (!k) return null;
    const w = k.wp.map(wpObj); return { id: k.id, name: k.name, hint: k.hint, wps: w, cities: w };
  }
  let memo = null;
  function plan() {
    const c = ensure(), r = route(); if (!r) return null;
    const ps = parcels().map(p => ({ id: p.id, lat: p.lat, lon: p.lon, rank: rankOf(p) }));
    const key = JSON.stringify([c.corr, c.spacing, c.radius, c.a, c.b, ps.map(p => [p.id, p.lat, p.lon, p.rank])]);
    if (memo && memo.key === key) return memo.v;
    const z = calc.zones(r.wps, c.spacing, r.cities), zs = calc.cover(z.zones, ps, c.radius, ownedRank()), sm = calc.summary(zs, z.road);
    const v = Object.assign({ r, zs, road: z.road, straight: z.straight, slice: z.slice }, sm);
    memo = { key, v }; return v;
  }
  EXC.plan = plan;

  /* =====================  BADGES AND QUESTS (pushed into the Quests module)  ===================== */
  const now = () => Date.now();
  function bothCoasts() {
    let w = false, e = false;
    parcels().forEach(p => { if (!located(p)) return; const s = calc.coastSide(p); if (s.west) w = true; if (s.east) e = true; });
    return { west: w, east: e };
  }
  EXC.bothCoasts = bothCoasts;
  const MY_BADGES = [
    { id: 'coastscout', ic: 'route', t: 'Coast to coast scout', d: 'Every stop zone on your corridor has at least one parcel nearby (scouted or better).', test: () => { const p = plan(); return p && p.n > 0 && p.open === 0 ? now() : 0; } },
    { id: 'bothcoasts', ic: 'compass', t: 'Both coasts', d: 'A scouted or owned parcel within 150 miles of the Pacific side and another within 150 miles of the Atlantic side.', test: () => { const b = bothCoasts(); return b.west && b.east ? now() : 0; } },
    { id: 'crosschain', ic: 'star', t: 'Cross-country chain', d: 'Every stop zone on your corridor covered by an owned stop (100 percent).', test: () => { const p = plan(); return p && p.n > 0 && p.pct === 100 ? now() : 0; } }
  ];
  (function addToQuests() {
    try {
      if (window.EXQ && Array.isArray(EXQ.BADGES)) MY_BADGES.forEach(b => { if (!EXQ.BADGES.some(x => x.id === b.id)) EXQ.BADGES.push(b); });
      const Q = window.EXQ_DATA && window.EXQ_DATA.quests;
      if (Array.isArray(Q)) (D.quests || []).forEach(q => { if (!Q.some(x => x.id === q.id)) Q.push(q); });
    } catch (e) { }
  })();
  const nudge = () => { try { if (window.EX && EX.ev) EX.ev('parcel', null); } catch (e) { } };

  /* =====================  STYLES  ===================== */
  if (typeof document !== 'undefined' && !document.getElementById('exc-css')) {
    const st = document.createElement('style'); st.id = 'exc-css';
    st.textContent = `
.exc-nav{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;-webkit-overflow-scrolling:touch}
.exc-nav button{flex:none;min-height:44px;padding:0 14px;border-radius:22px;border:1px solid var(--line);background:var(--panel);color:var(--dim);font:inherit;font-size:.92rem}
.exc-nav button.on{background:var(--gold2);color:#1a1405;border-color:var(--gold2);font-weight:700}
.exc-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}
.exc-chips .chip{min-height:44px}
.exc-set{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.exc-big{font-size:2rem;font-weight:700;color:var(--gold);line-height:1}
.exc-bar{height:10px;border-radius:6px;background:var(--panel2);border:1px solid var(--line);overflow:hidden;margin:8px 0}
.exc-bar i{display:block;height:100%;background:#6fa97b}
.exc-bar i.p{background:#e0a458}
.exc-z{display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line);padding:8px 0;font:inherit;color:var(--text);min-height:48px}
.exc-z:last-child{border:0}
.exc-n{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:.82rem;color:#14110a}
.exc-n.covered{background:#6fa97b}.exc-n.progress{background:#e0a458}.exc-n.open{background:#8fa3b0}
.exc-z .tx{flex:1;min-width:0}.exc-z .tx span{display:block;font-size:.8rem;color:var(--dim)}
.exc-z.sel{background:#e8b04a14}
.exc-tbl tr.sel td,.t tr.sel td{background:#e8b04a14}
.exc-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:.8rem;color:var(--dim);margin:2px 0 8px}
.exc-legend span{display:inline-flex;align-items:center;gap:5px}
.exc-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.exc-st{min-height:48px;border-radius:10px;border:1px solid var(--line);background:var(--panel);color:var(--dim);font:inherit;padding:4px 2px;text-align:center;line-height:1.1}
.exc-st b{display:block;font-size:.95rem}.exc-st span{display:block;font-size:.74rem}
.exc-st.sc{border-color:#e0a458;color:var(--text);background:#e0a45822}
.exc-st.ow{border-color:#6fa97b;color:#14110a;background:#6fa97b}
.exc-reg{display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid var(--line)}
.exc-reg:last-child{border:0}
.exc-tl{border-left:2px solid var(--line);margin-left:13px;padding-left:0}
.exc-tl .it{position:relative;padding:4px 0 10px 22px}
.exc-tl .it:before{content:'';position:absolute;left:-8px;top:8px;width:14px;height:14px;border-radius:50%;background:var(--gold);border:2px solid var(--bg)}
.exc-tl .leg{font-size:.8rem;color:var(--dim);padding:0 0 8px 22px}
.exc-corr{display:block;width:100%;text-align:left;font:inherit;color:var(--text);background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px;margin:0 0 8px;min-height:48px}
.exc-corr b{display:block;color:var(--gold)}.exc-corr span{display:block;font-size:.82rem;color:var(--dim);margin-top:2px}
.exc-map .exm-pin{cursor:default}
.exc-zt{font-size:9px;font-weight:700;fill:#14110a;text-anchor:middle;dominant-baseline:central;font-family:Lora,Georgia,serif;pointer-events:none}
.exc-city{fill:#f0e3c0;font-size:8px;font-family:Lora,Georgia,serif}
`;
    document.head.appendChild(st);
  }

  /* =====================  VIEWS  ===================== */
  let sub = 'our', focus = null;
  const SUBS = [['our', 'Our plan'], ['plan', 'Plan'], ['states', 'States'], ['path', 'Path'], ['budget', 'Budget']];
  const COL = { covered: '#6fa97b', progress: '#e0a458', open: '#8fa3b0' };
  const STAGE_COL = { scouted: '#8fa3b0', visited: '#5fa0c9', contract: '#e0a458', owned: '#6fa97b', cabinplan: '#c9d46a', cabinbuilt: '#e8b04a', stop: '#f2e6b8' };
  const LBL = { covered: 'Covered', progress: 'In progress', open: 'Open' };
  const TAG = { covered: 'g', progress: 'a', open: '' };
  const mi0 = v => OA.dist(v, 0);

  function chooser(c) {
    return `<div class="exc-chips">${D.corridors.map(k => `<button class="chip ${c.corr === k.id ? 'on' : ''}" data-act="excCorr" data-id="${esc(k.id)}">${esc(k.name)}</button>`).join('')}<button class="chip ${c.corr === 'custom' ? 'on' : ''}" data-act="excCorr" data-id="custom">Choose my own</button></div>`;
  }
  function frontCard() {
    return `<div class="card tip"><b class="gold">How to read this tab</b><p class="sm">Corridors are straight lines between well-known city centres (approximate, rounded to 0.1 degree), stretched by ${esc(D.roadFactor)} as a rough road factor. They are a planning game, not a driving route: check real roads, weather and conditions yourself. Stop zones and the Scout here buttons give a place to start looking, nothing more. They say nothing about price, whether land is for sale, or whether it is suitable. This is not legal, tax, financial or engineering advice.</p></div>`;
  }
  function emptyPlan(c) {
    return frontCard() + `<div class="card"><div class="ct"><b>Pick your coast-to-coast corridor</b></div><p class="sm dim">Choose a line from the west coast to the east coast. The app then spaces stop zones along it (about one day's drive with kids) and shows which ones your parcels already cover.</p>
      ${D.corridors.map(k => { const w = k.wp.map(wpObj), L = calc.length(w).road; return `<button class="exc-corr" data-act="excCorr" data-id="${esc(k.id)}" ${k.id === D.corridors[0].id ? 'data-smoke' : ''}><b>${esc(k.name)}: ${esc(w[0].name)} to ${esc(w[w.length - 1].name)}</b><span>${esc(k.hint)} About ${esc(mi0(L))} by the road factor. ${esc(w.map(x => x.name).join(', '))}.</span></button>`; }).join('')}
      <button class="exc-corr" data-act="excCorr" data-id="custom"><b>Choose my own</b><span>Pick any two points: a parcel, a saved place, or typed latitude and longitude.</span></button></div>`;
  }
  function customCard(c) {
    const pt = x => x ? `<b>${esc(x.name || 'Point')}</b><div class="xs dim">${esc(OA.geo.fmtCoord ? OA.geo.fmtCoord(x.lat, x.lon, 'dd') : x.lat + ', ' + x.lon)}</div>` : '<span class="dim">Not chosen yet</span>';
    let h = `<div class="card"><div class="ct"><b>Your two points</b></div><div class="two"><div><div class="xs dim">WEST COAST START</div>${pt(c.a)}<button class="btn block" data-act="excPick" data-end="a" ${c.a ? '' : 'data-smoke'}>${c.a ? 'Change' : 'Choose start'}</button></div><div><div class="xs dim">EAST COAST END</div>${pt(c.b)}<button class="btn block" data-act="excPick" data-end="b">${c.b ? 'Change' : 'Choose end'}</button></div></div>`;
    if (c.a && c.b) {
      const r = route(); if (!r) h += `<p class="sm warn">The two points are under 50 miles apart, so there is no route to plan. Pick points farther apart.</p>`;
      else {
        const s0 = calc.coastSide(r.wps[0]), s1 = calc.coastSide(r.wps[1]);
        if (!s0.west) h += `<p class="xs dim">Your western point is ${esc(mi0(s0.westMi))} from the simplified Pacific line. The route still works; it just does not start on the coast.</p>`;
        if (!s1.east) h += `<p class="xs dim">Your eastern point is ${esc(mi0(s1.eastMi))} from the simplified Atlantic line. The route still works; it just does not end on the coast.</p>`;
      }
    } else h += `<p class="sm dim">Choose both points to see the route.</p>`;
    return h + '</div>';
  }
  function settingsCard(c) {
    return `<div class="card"><div class="ct"><b>Stop spacing</b></div><div class="exc-set">
      <label class="fl">Spacing (miles)<input class="in" type="number" inputmode="numeric" min="${D.limits.spacingMin}" max="${D.limits.spacingMax}" step="10" value="${esc(c.spacing)}" data-onchange="excSet" data-f="spacing"></label>
      <label class="fl">Coverage radius (miles)<input class="in" type="number" inputmode="numeric" min="10" max="300" step="5" value="${esc(c.radius)}" data-onchange="excSet" data-f="radius"></label></div>
      <p class="xs dim">${D.defaults.spacing} miles is about one day's drive with kids, so edit it to suit your family. A zone counts as covered when an owned stop (or any parcel at Owned or later) is within the radius, and in progress when a scouted, visited or under-contract parcel is. Parcels without coordinates cannot count.</p></div>`;
  }
  function statsCard(P) {
    const pc = P.n ? P.covered / P.n * 100 : 0, pp = P.n ? P.progress / P.n * 100 : 0;
    return `<div class="card"><div class="ct"><b>${esc(P.r.name)} corridor</b><span class="tag ${P.pct === 100 ? 'g' : ''}">${esc(P.pct)}% covered</span></div>
      <p class="sm dim">${esc(P.r.hint)} ${esc(P.r.wps.map(w => w.name).join(' to '))}.</p>
      <div class="stat"><div><b>${esc(P.pct)}%</b><span>COAST TO COAST</span></div><div><b>${esc(P.n)}</b><span>ZONES</span></div><div><b>${esc(mi0(P.gap))}</b><span>LONGEST GAP</span></div></div>
      <div class="exc-bar" role="img" aria-label="${esc(P.covered)} covered, ${esc(P.progress)} in progress, ${esc(P.open)} open"><i style="width:${pc.toFixed(1)}%;float:left"></i><i class="p" style="width:${pp.toFixed(1)}%;float:left"></i></div>
      <p class="sm">${esc(P.covered)} covered, ${esc(P.progress)} in progress, ${esc(P.open)} open. Route length about ${esc(mi0(P.road))} by road (${esc(mi0(P.straight))} along the waypoint line x ${esc(D.roadFactor)}). Zones are about ${esc(mi0(P.slice))} apart.</p>
      <p class="xs dim">Longest gap = the longest stretch of the route between covered zones, counting the two coast ends as boundaries.</p></div>`;
  }
  function mapSvg(P) {
    const X = window.EXM && EXM.proj; if (!X) return '<p class="sm dim">The Map tab drawing is not loaded, so the mini map is unavailable. The zone list below still works.</p>';
    const pr = (lat, lon) => X.pr(lon, lat), H = X.height(), f1 = q => q[0].toFixed(1) + ',' + q[1].toFixed(1);
    let s = `<svg viewBox="0 0 ${X.width} ${H}" role="img" aria-label="Map of the ${esc(P.r.name)} corridor with ${esc(P.n)} stop zones">`;
    s += `<polygon class="exm-land" points="${X.poly(X.outline)}"/><polygon class="exm-lake" points="${X.poly(X.lake)}"/>`;
    const line = []; const step = 40 * (D.roadFactor || 1.25); for (let d = 0; d < P.road; d += step) { const q = calc.pointAt(P.r.wps, d); line.push(f1(pr(q.lat, q.lon))); }
    const last = P.r.wps[P.r.wps.length - 1]; line.push(f1(pr(last.lat, last.lon)));
    s += `<polyline class="exm-route" points="${line.join(' ')}"/>`;
    P.r.wps.forEach(w => { const q = pr(w.lat, w.lon); s += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="2" fill="#f0e3c0"/>`; });
    [P.r.wps[0], last].forEach((w, i) => { const q = pr(w.lat, w.lon); s += `<text class="exc-city" x="${(q[0] + (i ? -4 : 4)).toFixed(1)}" y="${(q[1] - 5).toFixed(1)}" text-anchor="${i ? 'end' : 'start'}">${esc(w.name)}</text>`; });
    const c = ensure(), rpx = z => { const a = pr(z.lat, z.lon), b = pr(z.lat, z.lon + c.radius / (69.17 * Math.max(0.2, Math.cos(rad(z.lat))))); return Math.max(3, Math.hypot(b[0] - a[0], b[1] - a[1])); };
    P.zs.forEach(z => { const q = pr(z.lat, z.lon); s += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${rpx(z).toFixed(1)}" fill="${COL[z.status]}" fill-opacity=".18" stroke="${COL[z.status]}" stroke-width="1"${z.status === 'open' ? ' stroke-dasharray="3 2"' : ''}/>`; });
    P.zs.forEach(z => { const q = pr(z.lat, z.lon); s += `<g data-act="excZone" data-i="${z.i}"><circle class="exm-hit" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="14"/><circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="6.5" fill="${COL[z.status]}" stroke="#14110a" stroke-width="1.2"/><text class="exc-zt" x="${q[0].toFixed(1)}" y="${q[1].toFixed(1)}">${z.i}</text></g>`; });
    parcels().forEach(p => { if (!located(p)) return; const q = pr(p.lat, p.lon); if (q[0] < 0 || q[0] > X.width || q[1] < 0 || q[1] > H) return; s += `<rect x="${(q[0] - 3.2).toFixed(1)}" y="${(q[1] - 3.2).toFixed(1)}" width="6.4" height="6.4" transform="rotate(45 ${q[0].toFixed(1)} ${q[1].toFixed(1)})" fill="${STAGE_COL[p.stage] || '#8fa3b0'}" stroke="#14110a" stroke-width="1.2"><title>${esc(p.name)}</title></rect>`; });
    return s + '</svg>';
  }
  function mapCard(P) {
    return `<div class="exm-map exc-map">${mapSvg(P)}</div>
      <div class="exc-legend"><span><i class="exm-dot" style="background:${COL.covered}"></i>Covered</span><span><i class="exm-dot" style="background:${COL.progress}"></i>In progress</span><span><i class="exm-dot" style="background:${COL.open}"></i>Open</span><span>Diamonds = your parcels</span></div>
      <p class="xs dim" style="margin:-4px 2px 12px">Numbered circles are stop zones; the faint ring is the coverage radius. Simplified outline for orientation only; the dashed line is the corridor, not a road.</p>`;
  }
  function zoneList(P) {
    const f = focus && P.zs.find(z => z.i === focus) || P.next || P.zs[0];
    return `<div class="card"><div class="ct"><b>Stop zones</b><span class="xs dim">west to east</span></div>${P.zs.map(z => `<button class="exc-z ${f && f.i === z.i ? 'sel' : ''}" data-act="excZone" data-i="${z.i}"><span class="exc-n ${z.status}">${z.i}</span><div class="tx"><b>Near ${esc(z.city)}${z.st ? ', ' + esc(z.st) : ''}</b><span>${esc(mi0(z.at))} along the route${z.near ? ' · ' + esc(z.near) + ' parcel' + (z.near === 1 ? '' : 's') + ' within ' + esc(mi0(ensure().radius)) : ''}</span></div><span class="tag ${TAG[z.status]}">${esc(LBL[z.status])}</span></button>`).join('')}
      <p class="xs dim">"Near" names the closest city on the corridor list; the zone itself is just a point on the line (${D.roadFactor} road factor applied).</p></div>`;
  }
  function nextCard(P) {
    const f = focus && P.zs.find(z => z.i === focus) || P.next;
    if (!f) return `<div class="card"><div class="ct"><b>Next open zone</b></div><p class="sm">${P.covered === P.n ? 'Every zone is covered. The chain is complete.' : 'No zone is open: each has a parcel nearby already. Keep moving them toward Owned.'}</p></div>`;
    const near = camps().map(k => ({ k, d: calc.mi(f, k) })).sort((a, b) => a.d - b.d).slice(0, 3), rad_ = ensure().radius;
    let h = `<div class="card hot"><div class="ct"><b>${focus && focus === f.i ? 'Zone ' + f.i : 'Next open zone: ' + f.i}</b><span class="tag ${TAG[f.status]}">${esc(LBL[f.status])}</span></div>
      <p class="sm">Near ${esc(f.city)}${f.st ? ', ' + esc(f.st) : ''} (about ${esc(mi0(f.cityMi || 0))} from that city), ${esc(mi0(f.at))} along the route. Point: ${esc(OA.geo.fmtCoord ? OA.geo.fmtCoord(f.lat, f.lon, 'dd') : f.lat.toFixed(2) + ', ' + f.lon.toFixed(2))}.</p>`;
    if (near.length) h += `<p class="sm dim">Campgrounds loaded in this app that are closest to the zone. These are starting points for scouting, nothing about price or suitability. One counts for this zone only if it is within ${esc(mi0(rad_))}.</p>` + near.map(o => `<div class="li"><div class="tx"><b>${esc(o.k.name)}</b><span>${esc(o.k.state || '')}${o.k.parent ? ' · ' + esc(o.k.parent) : ''} · ${esc(mi0(o.d))} from the zone point${o.d > rad_ ? ' (outside the radius)' : ''}</span></div><div class="end"><button class="mini" data-act="excScout" data-id="${esc(o.k.id)}" data-i="${f.i}" data-smoke>Scout here</button></div></div>`).join('');
    else h += `<p class="sm dim">No campground with coordinates is loaded, so open a map around the zone point and look for towns and public land.</p>`;
    h += `<button class="btn block" data-act="excScoutPoint" data-i="${f.i}">Scout at the zone point instead</button><p class="xs dim">Creates a scouted parcel at the zone point so you can move the pin later. It does not mean anything is for sale there.</p></div>`;
    return h;
  }
  function badgeCard() {
    const B = (OA.S.ex.goals && OA.S.ex.goals.badges) || {}, b = bothCoasts();
    return `<div class="card"><div class="ct"><b>Coast badges</b></div>${MY_BADGES.map(x => `<div class="li"><div class="tx"><b>${esc(x.t)}</b><span>${esc(x.d)}</span></div><div class="end"><span class="tag ${B[x.id] ? 'g' : ''}">${B[x.id] ? 'Earned' : 'Not yet'}</span></div></div>`).join('')}
      <p class="xs dim">Both coasts right now: Pacific side ${b.west ? 'yes' : 'not yet'}, Atlantic side ${b.east ? 'yes' : 'not yet'}. Rule: within ${esc(D.coastMiles)} miles of a simplified coast line; the Gulf coast does not count as the east coast.</p></div>`;
  }
  function planView() {
    const c = ensure(); let h = chooser(c);
    if (!c.corr) return h + emptyPlan(c);
    if (c.corr === 'custom') h += customCard(c);
    const P = plan();
    if (!P) return h + (c.corr === 'custom' ? '' : '<p class="sm dim">That corridor is not available.</p>');
    return h + settingsCard(c) + statsCard(P) + mapCard(P) + nextCard(P) + zoneList(P) + badgeCard() + (parcels().some(p => !located(p)) ? `<p class="xs dim">${parcels().filter(p => !located(p)).length} parcel(s) have no coordinates and cannot count toward coverage. Add them on the Map tab.</p>` : '');
  }

  /* ----- states ----- */
  const NAME2CODE = (() => { const m = {}; D.states.forEach(s => { m[s[0]] = s[0]; m[s[1].toUpperCase()] = s[0]; }); return m; })();
  const codeOf = v => NAME2CODE[String(v || '').trim().toUpperCase()] || '';
  function stateData() {
    const by = {}; D.states.forEach(s => { by[s[0]] = { code: s[0], name: s[1], region: s[2], own: [], sc: [] }; });
    parcels().forEach(p => { const k = codeOf(p.state); if (!k) return; (rankOf(p) >= ownedRank() ? by[k].own : by[k].sc).push(p); });
    return by;
  }
  function firstOnCoast() {
    const out = { west: null, east: null };
    parcels().filter(located).slice().sort((a, b) => (a.created || 0) - (b.created || 0)).forEach(p => { const s = calc.coastSide(p); if (s.west && !out.west) out.west = p; if (s.east && !out.east) out.east = p; });
    return out;
  }
  const dayLbl = ts => { try { return OA.fmtDate(OA.dkey(new Date(ts)), { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } };
  function statesView() {
    const by = stateData(), arr = Object.keys(by).map(k => by[k]), any = arr.filter(s => s.own.length || s.sc.length), own = arr.filter(s => s.own.length);
    const fc = firstOnCoast();
    let h = `<div class="card"><div class="ct"><b>States collected</b><span class="tag ${own.length ? 'g' : ''}">${any.length} of 50</span></div>
      <p class="sm">${own.length} with an owned stop, ${any.length - own.length} more with a scouted or in-progress parcel. Tap a state to see its parcels.</p>`;
    if (!any.length) h += `<p class="sm dim">Nothing collected yet. Pick a corridor on the Plan tab, then scout your first stop to light up a state.</p><button class="btn gold block" data-act="excGoPlan">Pick a corridor</button>`;
    h += `<div class="exc-grid">${arr.map(s => `<button class="exc-st ${s.own.length ? 'ow' : s.sc.length ? 'sc' : ''}" data-act="excState" data-id="${s.code}" aria-label="${esc(s.name)}: ${s.own.length} owned, ${s.sc.length} scouted or in progress"><b>${s.code}</b><span>${s.own.length || s.sc.length ? (s.own.length ? s.own.length + ' own' : s.sc.length + ' scout') : '&nbsp;'}</span></button>`).join('')}</div>
      <div class="exc-legend" style="margin-top:8px"><span><i class="exm-dot" style="background:#6fa97b"></i>Owned stop</span><span><i class="exm-dot" style="background:#e0a458"></i>Scouted or in progress</span></div></div>`;
    h += `<div class="card"><div class="ct"><b>Regions</b></div>${D.regions.map(r => { const list = arr.filter(s => s.region === r), got = list.filter(s => s.own.length || s.sc.length).length, ow = list.filter(s => s.own.length).length; return `<div class="exc-reg"><div><b>${esc(r)}</b><div class="xs dim">${esc(list.map(s => s.code).join(' '))}</div></div><div class="right"><b>${got}/${list.length}</b><div class="xs dim">${ow} owned</div></div></div>`; }).join('')}<p class="xs dim">Regions are this app's own simple grouping, for the game only.</p></div>`;
    const mk = (side, p) => `<div class="li"><div class="tx"><b>${side}</b><span>${p ? esc(p.name) + (p.state ? ', ' + esc(p.state) : '') + ' · ' + esc(EX.stageOf(p).label) + ' · saved ' + esc(dayLbl(p.created || Date.now())) : 'No parcel within ' + esc(D.coastMiles) + ' miles of this coast yet.'}</span></div><div class="end"><span class="tag ${p ? 'g' : ''}">${p ? 'First' : 'Open'}</span></div></div>`;
    h += `<div class="card"><div class="ct"><b>First on each coast</b></div>${mk('Pacific side', fc.west)}${mk('Atlantic side', fc.east)}<p class="xs dim">The earliest saved parcel within ${esc(D.coastMiles)} miles of a simplified coast line (Pacific, Atlantic; the Gulf coast does not count).</p></div>`;
    return h;
  }
  /* ----- path ----- */
  function pathView() {
    const own = parcels().filter(p => rankOf(p) >= ownedRank());
    const pos = own.filter(located).sort((a, b) => a.lon - b.lon), nopos = own.filter(p => !located(p));
    let h = `<div class="card"><div class="ct"><b>Family expansion path</b><span class="tag ${own.length ? 'g' : ''}">${own.length} owned</span></div>`;
    if (!own.length) return h + `<p class="sm dim">The path lists your owned stops from west to east. It starts when a parcel reaches the Owned stage on the Map tab. Until then, plan the line you are heading along.</p><button class="btn gold block" data-act="excGoPlan">Pick a corridor</button></div>`;
    h += `<div class="exc-tl">`;
    pos.forEach((p, i) => {
      h += `<div class="it"><b>${esc(p.name)}</b><div class="sm dim">${esc([p.county ? p.county + ' County' : '', p.state].filter(Boolean).join(', ') || 'Location not named')} · ${esc(EX.stageOf(p).label)}${p.ownedDate ? ' · owned ' + esc(OA.fmtDate(p.ownedDate, { month: 'short', day: 'numeric', year: 'numeric' })) : ''}</div></div>`;
      const nx = pos[i + 1]; if (nx) h += `<div class="leg">${esc(mi0(Math.round(calc.mi(p, nx) * (D.roadFactor || 1.25))))} to the next stop east</div>`;
    });
    h += `</div>`;
    if (pos.length > 1) { const span = Math.round(calc.mi(pos[0], pos[pos.length - 1]) * (D.roadFactor || 1.25)); h += `<p class="sm">West-most to east-most owned stop: about ${esc(mi0(span))}.</p>`; }
    if (nopos.length) h += `<p class="sm dim">Owned but with no coordinates (cannot be placed west to east): ${esc(nopos.map(p => p.name).join(', '))}.</p>`;
    return h + `<p class="xs dim">Ordered by longitude. Distances are straight-line miles x ${esc(D.roadFactor)} as a rough road estimate, and not a route.</p></div>`;
  }

  /* ----- budget ----- */
  const BUD = () => window.EXC_BUDGET;
  const eff = (v, d) => (typeof v === 'number' && isFinite(v) && v > 0) ? v : d;
  const nIn = (f, lbl, b, o) => `<label class="fl">${lbl}<input class="in" type="number" inputmode="decimal" min="0" ${o && o.step ? 'step="' + o.step + '"' : ''} data-bind="ex.coast.bud.${f}" data-type="number" data-then="excBudRefresh" value="${b[f] == null ? '' : esc(b[f])}" ${o && o.ph ? 'placeholder="' + esc(o.ph) + '"' : ''}></label>`;
  function budgetView() {
    const B = BUD(); if (!B) return '<div class="card"><p class="sm dim">The budget data is not loaded.</p></div>';
    const c = ensure(), b = c.bud, L = B.D.limits, def = B.D.defaults, P = c.corr ? plan() : null;
    const useCorr = !!(P && b.src !== 'typed');
    const miles = useCorr ? P.road : eff(b.miles, def.miles), mph = eff(b.mph, def.mph), hours = OA.clamp(eff(b.hours, def.hours), L.hoursMin, L.hoursMax);
    const L0 = B.legs(miles, hours, mph), ps = B.perSite(b), T = B.totals(L0.sites, ps), mpg = eff(b.mpg, def.mpg), gas = (typeof b.gas === 'number' && b.gas >= 0) ? b.gas : def.gas;
    const fuel = B.fuel(miles, mpg, gas), carry = (typeof b.carry === 'number' && b.carry > 0) ? b.carry : null;
    const m = v => esc(OA.money(v)), bareB = bareOf(b);
    let h = `<div class="card tip"><b class="gold">Read this first</b><p class="sm">Every dollar figure on this screen is <b>my planning assumption, not a quote</b>: replace each one with your county numbers and real quotes. Nothing here is researched price data. Not legal, tax, financial or engineering advice.</p>
      <p class="sm">Honest cautions: parcels around $2,000 are typically remote, and often have problems with legal access, water and power (and sometimes with building rules or flood and fire risk). Land in the east usually costs more than land in the west or the plains. Ask the county (assessor, planning or building office, and the tax collector) before you count on any price.</p></div>`;
    h += `<div class="card"><div class="ct"><b>1. The drive</b></div>`;
    if (P) h += `<div class="exc-chips"><button class="chip ${useCorr ? 'on' : ''}" data-act="excBudSrc" data-v="corr">${esc(P.r.name)} route: ${esc(mi0(P.road))}</button><button class="chip ${useCorr ? '' : 'on'}" data-act="excBudSrc" data-v="typed">Type my own miles</button></div>`;
    else h += `<p class="xs dim">No corridor chosen on the Plan view, so type the road miles. (Choose a corridor and its road estimate can be used here.)</p>`;
    h += `<div class="exc-set">${useCorr ? `<div class="fl">Road miles<div class="b" style="min-height:44px;display:flex;align-items:center">${esc(mi0(miles))}</div></div>` : nIn('miles', 'Road miles', b, { ph: String(def.miles) })}${nIn('mph', 'Average speed (mph)', b, { ph: String(def.mph) })}</div>
      <label class="fl">Longest drive per leg: <b class="gold">${esc(hours)} hours</b><input type="range" min="${L.hoursMin}" max="${L.hoursMax}" step="1" value="${esc(hours)}" data-bind="ex.coast.bud.hours" data-type="number" data-then="excBudRefresh" style="width:100%;min-height:44px"></label>
      <p class="xs dim">Corridor miles are a straight-line estimate times ${esc(D.roadFactor)}, not a routed distance. Real roads, stops, weather and kids make real days slower than the average speed.</p></div>`;
    h += `<div class="card hot"><div class="ct"><b>2. Sites needed</b><span class="tag g">${esc(L0.sites)} sites</span></div>
      <div class="stat"><div><b>${esc(L0.sites)}</b><span>SITES</span></div><div><b>${esc(mi0(L0.legMiles))}</b><span>PER LEG</span></div><div><b>${esc(OA.hm(L0.legHours))}</b><span>DRIVE PER LEG</span></div></div>
      <p class="sm">Formula: sites = ceil(road miles / (hours x mph)) + 1. Here: ceil(${esc(Math.round(miles))} / (${esc(hours)} x ${esc(mph)})) + 1 = ${esc(L0.sites)}. The +1 puts a site on each coast, so ${esc(L0.legs)} legs are spaced evenly at about ${esc(mi0(L0.legMiles))} (${esc(OA.hm(L0.legHours))} at ${esc(mph)} mph), no leg longer than ${esc(hours)} hours.</p></div>`;
    h += `<div class="card"><div class="ct"><b>3. What 8 / 10 / 12 hours means</b></div><div class="scroll-x"><table class="t"><tr><th></th>${[8, 10, 12].map(x => `<th>${x} h</th>`).join('')}</tr>`;
    const cols = [8, 10, 12].map(x => { const l = B.legs(miles, x, mph), t = B.totals(l.sites, ps); return { l, t }; });
    h += `<tr><td>Sites</td>${cols.map(x => `<td><b>${esc(x.l.sites)}</b></td>`).join('')}</tr><tr><td>Leg</td>${cols.map(x => `<td>${esc(mi0(x.l.legMiles))}<br><span class="xs dim">${esc(OA.hm(x.l.legHours))}</span></td>`).join('')}</tr>`;
    h += `<tr><td>Land only</td>${cols.map(x => `<td>${m(x.t.land)}</td>`).join('')}</tr>${bareB ? `<tr><td>Bare-bones</td>${cols.map(x => `<td>${m(bareB.low * x.l.sites)}<br><span class="xs dim">to ${m(bareB.high * x.l.sites)}</span></td>`).join('')}</tr>` : ''}<tr><td>Camp-ready</td>${cols.map(x => `<td>${m(x.t.camp)}</td>`).join('')}</tr><tr><td>Shed</td>${cols.map(x => `<td>${m(x.t.shedLo)}<br><span class="xs dim">to ${m(x.t.shedHi)}</span></td>`).join('')}</tr><tr><td>Tiny cabin</td>${cols.map(x => `<td>${m(x.t.cabinLo)}<br><span class="xs dim">to ${m(x.t.cabinHi)}</span></td>`).join('')}</tr></table></div>
      <p class="xs dim">Same miles and ${esc(mph)} mph; includes the contingency below. Fewer sites means longer driving days.</p></div>`;
    h += `<div class="card"><div class="ct"><b>4. Per-site assumptions</b></div><p class="sm dim">My planning assumptions, not quotes: replace with your county numbers.</p>
      <div class="exc-set">${nIn('land', 'Land price per site ($)', b)}${nIn('closing', 'Closing, title, recording, survey ($)', b)}${nIn('kit', 'Camp-ready kit: portable power station + solar panel ($)', b)}${nIn('fire', 'Firepit, tools, water storage ($)', b)}${nIn('gate', 'Gate, signage, access ($)', b)}${nIn('cont', 'Contingency (%)', b)}${nIn('shedLo', 'Shed or storage building, low ($)', b)}${nIn('shedHi', 'Shed, high ($)', b)}${nIn('cabLo', 'Tiny cabin shell + permits + sanitation, low ($)', b)}${nIn('cabHi', 'Same, high ($)', b)}</div>
      <p class="xs dim">The shed range is my planning assumption, not a quote (default $2,000 to $8,000).</p>
      <p class="xs dim">Per site with ${esc(ps.contingency)}% contingency on the whole subtotal: land only ${m(ps.land)} (land + closing); camp-ready ${m(ps.camp)} (adds the kit, firepit and gate); shed ${m(ps.shedLo)} to ${m(ps.shedHi)} (camp-ready plus the shed); tiny cabin ${m(ps.cabinLo)} to ${m(ps.cabinHi)} (adds the cabin shell). Permit, septic and building rules vary a lot by county and some parcels cannot take a cabin at all.</p></div>`;
    h += `<div class="card"><div class="ct"><b>5. Totals for all ${esc(L0.sites)} sites</b></div><div class="scroll-x"><table class="t"><tr><th>Tier</th><th>Per site</th><th>All sites</th></tr>
      <tr><td>Land only</td><td>${m(ps.land)}</td><td><b>${m(T.land)}</b></td></tr>${bareB ? `<tr><td>Bare-bones</td><td>${m(bareB.low)} to ${m(bareB.high)}</td><td><b>${m(bareB.low * L0.sites)} to ${m(bareB.high * L0.sites)}</b></td></tr>` : ''}<tr><td>Camp-ready</td><td>${m(ps.camp)}</td><td><b>${m(T.camp)}</b></td></tr><tr><td>Shed</td><td>${m(ps.shedLo)} to ${m(ps.shedHi)}</td><td><b>${m(T.shedLo)} to ${m(T.shedHi)}</b></td></tr><tr><td>Tiny cabin</td><td>${m(ps.cabinLo)} to ${m(ps.cabinHi)}</td><td><b>${m(T.cabinLo)} to ${m(T.cabinHi)}</b></td></tr></table></div>
      <div class="exc-set" style="margin-top:10px">${nIn('carry', 'Yearly carrying cost per site ($): taxes, insurance, fees', b, { ph: 'blank' })}<div class="fl">Yearly carrying, all sites<div class="b" style="min-height:44px;display:flex;align-items:center">${carry ? m(carry * L0.sites) + ' / year' : 'enter a number'}</div></div></div>
      <p class="xs dim">Carrying costs (property tax, insurance, road or HOA fees, upkeep) are left blank on purpose: ask the county tax office. They repeat every year and can outweigh a $2,000 price over time.</p>
      <div class="exc-set">${nIn('mpg', 'Vehicle mpg (assumption)', b)}${nIn('gas', 'Fuel price per gallon (assumption)', b, { step: '0.01' })}</div>
      <p class="sm">Fuel for one crossing (${esc(Math.round(miles))} road miles one way): <b>${fuel == null ? 'unknown' : esc(OA.money(fuel))}</b> at ${esc(mpg)} mpg and $${esc(gas.toFixed(2))} a gallon${fuel == null ? '' : '; about ' + esc(OA.money(fuel * 2)) + ' there and back'}. Lodging, food, repairs and your time are not counted.</p></div>`;
    const nc = OA.clamp(Math.floor(b.nCamp) || 0, 0, L0.sites), ns = OA.clamp(Math.floor(b.nShed) || 0, 0, L0.sites - nc), nb = OA.clamp(Math.floor(b.nCabin) || 0, 0, L0.sites - nc - ns), ph = B.phase(L0.sites, nc, nb, ps, ns);
    h += `<div class="card"><div class="ct"><b>6. Tier per stage</b></div><p class="sm dim">Phase it: choose how many of the ${esc(L0.sites)} sites get each tier. Sites you leave out are land only.</p>
      <div class="exc-set">${nIn('nCamp', 'Camp-ready sites', b, { ph: '0' })}${nIn('nShed', 'Shed sites', b, { ph: '0' })}${nIn('nCabin', 'Tiny cabin sites', b, { ph: '0' })}</div>
      <div class="stat"><div><b>${esc(ph.land)}</b><span>LAND ONLY</span></div><div><b>${esc(ph.camp)}</b><span>CAMP-READY</span></div><div><b>${esc(ph.shed)}</b><span>SHED</span></div><div><b>${esc(ph.cabin)}</b><span>TINY CABIN</span></div></div>
      <p class="sm">Grand total: <b>${m(ph.low)}</b> to <b>${m(ph.high)}</b>${ph.low === ph.high ? '' : ' (low to high)'}.</p>
      <div class="row"><button class="btn" data-act="excBudFeed" data-v="low">Set savings goal to ${m(ph.low)}</button>${ph.high !== ph.low ? `<button class="btn" data-act="excBudFeed" data-v="high">Set savings goal to ${m(ph.high)}</button>` : ''}</div>
      <p class="xs dim">Feed to savings goal: replaces the goal on the Quests tab (Savings). You confirm first.</p>
      ${bareB ? `<div class="row"><button class="btn" data-act="excBareFeed" data-v="low" data-n="${esc(L0.sites)}">Bare-bones, all ${esc(L0.sites)} sites: ${m(bareB.low * L0.sites)}</button><button class="btn" data-act="excBareFeed" data-v="high" data-n="${esc(L0.sites)}">${m(bareB.high * L0.sites)}</button></div><p class="xs dim">Pick the pad, shed and power station on Our plan, Costs.</p>` : ''}</div>`;
    return h;
  }
  /* ----- Our plan: the Grossmann path (data in EXC_PLAN, math in calc.sitePlan + EXC_BUDGET) ----- */
  const r0 = v => Math.round(v), r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
  const TIER_ORDER = ['land', 'bare', 'camp', 'shed', 'cabin'];
  let ourSec = 'path';
  const OSEC = [['path', 'Path'], ['kit', 'Site kit'], ['cost', 'Costs'], ['phases', 'Phases']];
  function startPt() {
    const p = ensure().plan, P = PLN();
    if (p.start === 'custom' && p.startPt) return { id: 'custom', name: p.startPt.name || 'My start', st: p.startPt.st || '', lat: p.startPt.lat, lon: p.startPt.lon, custom: true };
    return Object.assign({ custom: false }, P.starts.find(x => x.id === p.start) || P.starts[0]);
  }
  /* paths 3 and 4 (EXC_PLAN.extraPaths): pass 'north' or 'south'. path === true is the older path 2. */
  const xPath = path => (typeof path === 'string' && PLN().extraPaths) ? (PLN().extraPaths.find(x => x.id === path) || null) : null;
  function ourRoute(path) {
    const X = xPath(path); if (X) return X.wp.map(wpObj);
    const P2 = PLN().path2;
    if (path && P2) { const k2 = D.corridors.find(x => x.id === P2.id); if (!k2) return null; return [{ name: P2.start.name, st: P2.start.st, lat: P2.start.lat, lon: P2.start.lon }].concat(k2.wp.map(wpObj).slice(1)); }
    const k = D.corridors.find(x => x.id === (PLN().corridor || 'central')); if (!k) return null;
    const s = startPt();
    return [{ name: s.name, st: s.st, lat: s.lat, lon: s.lon }].concat(k.wp.map(wpObj).slice(1));
  }
  const stateRow = st => { const X = window.EXS_DATA; return X && Array.isArray(X.states) ? (X.states.find(s => s.st === st) || null) : null; };
  const sunOf = st => { const d = window.EXP_DATA; const v = d && d.sunStates && d.sunStates[st]; return v ? v[0] : null; };
  const nearCamps = (pt, n) => camps().map(k => ({ id: k.id, name: String(k.name), state: k.state || '', parent: k.parent || '', mi: calc.mi(pt, k) })).sort((a, b) => a.mi - b.mi).slice(0, n);
  /* power sizing: ask the Power tab's own math (EXP.calc on its worked example) when it is loaded, otherwise cite its worked-example numbers */
  function powerSizing() {
    try {
      if (window.EXP && typeof EXP.calc === 'function' && typeof EXP.example === 'function') {
        const r = EXP.calc(EXP.example());
        if (r && r.whDay > 0 && r.panelWinterRound > 0) return { whDay: r0(r.whDay), panelW: r.panelWinterRound, battWh: Math.ceil(r.battNominal / 100 - 1e-9) * 100, live: true };
      }
    } catch (e) { }
    return { whDay: 400, panelW: 200, battWh: 1000, live: false };
  }
  const powerText = () => { const s = powerSizing(); return 'Sized from the Power tab worked example, a weekend cabin using about ' + s.whDay + ' Wh a day: a solar panel of about ' + s.panelW + ' W and a portable power station of about ' + s.battWh + ' Wh with at least 200 W of solar input (' + (s.live ? 'computed live by the Power tab' : 'numbers quoted from that example') + '). The example uses made-up round sun hours, so size your own loads in the Power tab with the sun hours for the real site. Do not rely on solar alone for medical equipment.'; };
  const kitText = it => it.d === '__POWER__' ? powerText() : it.d;
  const TIER_LBL = id => { const t = (PLN().tiers || []).find(x => x.id === id); return t ? t.label : id; };

  /* Bare-bones tier (see EXC_BUDGET.bare): lot price may be overridden per state */
  const bareOf = (b, lot) => { const B = BUD(), X = window.EXB_BARE; if (!B || !B.bare || !X) return null; return B.bare(lot == null ? b : Object.assign({}, b, { land: lot }), X); };
  const KIND = { retail: 'retail listing', guide: 'cost guide', assumption: 'my assumption' };
  const lotFor = (b, st) => { const v = b.stateLot && b.stateLot[st]; return (typeof v === 'number' && isFinite(v) && v > 0) ? v : eff(b.land, 0); };
  function stateCostsOf(zones, b, bare) {
    const V = (window.EXL_VALUES && window.EXL_VALUES.states) || {}, order = [], by = {};
    zones.forEach(z => { if (!by[z.st]) { by[z.st] = { st: z.st, sites: 0, siteNumbers: [] }; order.push(z.st); } by[z.st].sites++; by[z.st].siteNumbers.push(z.i); });
    return order.map((st, k) => {
      const e = by[st], v = V[st] || null, lot = lotFor(b, st), bb = bareOf(b, lot), pas = v && typeof v.pasturePerAcre === 'number' ? v.pasturePerAcre : null, fre = v && typeof v.farmRealEstatePerAcre === 'number' ? v.farmRealEstatePerAcre : null;
      const nm = (D.states.find(x => x[0] === st) || [])[1];
      return { st, name: v ? v.name : (nm || st), order: k + 1, sites: e.sites, siteNumbers: e.siteNumbers, pasturePerAcre: pas, farmRealEstatePerAcre: fre, oneAcreAtPasture: pas, oneAcreLabel: 'ag reference, not a lot price',
        lotPrice: lot, lotIsOverride: lot !== eff(b.land, 0), perSiteBare: bb ? [r0(bb.low), r0(bb.high)] : null, landTotal: r0(e.sites * lot), landBaselineTotal: r0(e.sites * eff(b.land, 0)),
        checkWithSource: pas == null || fre == null, src: v ? v.src || [] : [], asof: v ? v.asof || null : null, caution: v ? v.caution || null : null };
    });
  }
  function ourPlan(o) {
    o = o || {};
    const B = BUD(), P = PLN(), wps = ourRoute(o.path); if (!B || !wps) return null;
    const c = ensure(), p = c.plan, b = c.bud, def = B.D.defaults;
    const hours = P.hoursChoices.indexOf(o.hours) >= 0 ? o.hours : p.hours, mph = eff(b.mph, def.mph);
    const XP = xPath(o.path), DR = PLN().drive || { targetH: 2.5, radiusMi: 30, warnHours: 3.3 };
    const rural = o.path ? true : typeof o.rural === 'boolean' ? o.rural : p.rural !== false, RR = P.rural || { sites: 13, radiusMi: 60, warnHours: 6, penalty: { 1: 1.5, 2: 6, 3: 15 } };
    const cities = P.cities.map(w => ({ name: w[0], st: w[1], lat: w[2], lon: w[3] })).concat(wps.slice(1).map(w => ({ name: w.name, st: w.st, lat: w.lat, lon: w.lon })), [{ name: wps[0].name, st: wps[0].st, lat: wps[0].lat, lon: wps[0].lon }]);
    const corr = calc.length(wps, D.roadFactor);
    let sp, rc = null;
    if (rural && ((XP ? XP.towns : P.ruralTowns) || []).length >= 2) {
      const nX = XP ? Math.max(2, Math.ceil(corr.road / (DR.targetH * mph)) + 1) : RR.sites;
      rc = calc.ruralChain(wps, XP ? XP.towns : P.ruralTowns, { n: nX, radius: XP ? DR.radiusMi : RR.radiusMi, penalty: RR.penalty, warnHours: XP ? DR.warnHours : RR.warnHours, mph, factor: D.roadFactor, swaps: o.path ? {} : (o.swaps || p.swaps) });
      sp = { road: rc.roadMiles, straight: corr.straight, sites: rc.sites.length, legs: rc.legs, legMiles: rc.legMiles, legHours: rc.legHours,
        zones: rc.sites.map(z => ({ i: z.i, at: z.at, lat: z.lat, lon: z.lon, city: z.name, st: z.st, cityMi: null, legMiles: z.legMiles, legHours: z.legHours })) };
    } else sp = calc.sitePlan(wps, hours, mph, cities, B, D.roadFactor);
    const ps = B.perSite(b), T = B.totals(sp.sites, ps), s0 = XP ? Object.assign({ custom: false }, XP.start) : o.path ? Object.assign({ custom: false }, PLN().path2.start) : startPt();
    const zones = sp.zones.map((z, k) => {
      const row = stateRow(z.st), pt = { lat: z.lat, lon: z.lon }, rs = rc ? rc.sites[k] : null;
      return {
        i: z.i, city: z.city, st: z.st, cityMi: z.cityMi == null ? null : r1(z.cityMi), lat: r2(z.lat), lon: r2(z.lon), atMiles: r1(z.at), legMiles: r1(z.legMiles), legHours: r2(z.legHours),
        end: z.i === 1 ? 'west' : z.i === sp.sites ? 'east' : null,
        sunHours: sunOf(z.st),
        town: rs ? { id: rs.id, name: rs.name, st: rs.st, county: rs.county || null, pop: rs.pop == null ? null : rs.pop, popNote: rs.popNote || null, popVerified: !!rs.popVerified, coordVerified: !!rs.coordVerified, verified: !!rs.verified, typed: !!rs.typed, swapped: !!rs.swapped,
          targetLat: r2(rs.targetLat), targetLon: r2(rs.targetLon), snapMi: r1(rs.snapMi), outOfRange: !!rs.outOfRange, coordNote: 'approx town centre, rounded to 0.1 degree', landNote: P.ruralLand || null } : null,
        fire: { known: !!(row && row.fireNote), note: row && row.fireNote ? row.fireNote : null, url: row && row.fireInfo ? row.fireInfo : null, landNote: row && row.landNote ? row.landNote : null, landUrl: row && row.landLink ? row.landLink : null, asof: row ? row.asof || null : null, advice: row && row.fireNote ? null : 'check with the county' },
        camps: nearCamps(pt, 3).map(k2 => ({ id: k2.id, name: k2.name, state: k2.state, miles: r1(k2.mi) }))
      };
    });
    const bare = bareOf(b), bareT = bare ? [r0(bare.low * sp.sites), r0(bare.high * sp.sites)] : null;
    const stateCosts = stateCostsOf(zones, b, bare);
    const mk = (id, lo, hi, tlo, thi) => ({ id, label: id === 'cabinshed' ? 'Tiny cabin plus shed' : TIER_LBL(id), perSite: [r0(lo), r0(hi)], chain: [r0(tlo), r0(thi)] });
    const tiers = [mk('land', ps.land, ps.land, T.land, T.land)].concat(bare ? [mk('bare', bare.low, bare.high, bareT[0], bareT[1])] : [], [mk('camp', ps.camp, ps.camp, T.camp, T.camp), mk('shed', ps.shedLo, ps.shedHi, T.shedLo, T.shedHi), mk('cabin', ps.cabinLo, ps.cabinHi, T.cabinLo, T.cabinHi), mk('cabinshed', ps.cabinShedLo, ps.cabinShedHi, T.cabinShedLo, T.cabinShedHi)]);
    const byHours = P.hoursChoices.map(h => { const l = B.legs(corr.road, h, mph), t = B.totals(l.sites, ps); return { hours: h, sites: l.sites, legMiles: r1(l.legMiles), legHours: r2(l.legHours), chain: { land: r0(t.land), bare: bare ? [r0(bare.low * l.sites), r0(bare.high * l.sites)] : null, camp: r0(t.camp), shed: [r0(t.shedLo), r0(t.shedHi)], cabin: [r0(t.cabinLo), r0(t.cabinHi)] } }; });
    if (rc) byHours.push({ rural: true, id: 'rural', hours: r2(rc.maxLegHours), sites: sp.sites, legMiles: r1(rc.legMiles), legHours: r2(rc.legHours), maxLegMiles: r1(rc.maxLegMiles), maxLegHours: r2(rc.maxLegHours), chain: { land: r0(T.land), bare: bareT, camp: r0(T.camp), shed: [r0(T.shedLo), r0(T.shedHi)], cabin: [r0(T.cabinLo), r0(T.cabinHi)] } });
    const legs = zones.slice(1).map(z => ({ from: z.i - 1, to: z.i, miles: z.legMiles, hours: z.legHours }));
    const phases = (P.phases || []).map(ph => { const n = ph.steps.length, d = ph.steps.filter(s => p.done[ph.id + s.id]).length; return { id: ph.id, title: ph.t, target: p.dates[ph.id] || null, stepsDone: d, steps: n, items: ph.steps.map(s => ({ id: ph.id + s.id, text: s.t, done: !!p.done[ph.id + s.id] })) }; });
    const first = zones[0], last = zones[zones.length - 1];
    const startO = rc ? { id: rc.sites[0].id, name: rc.sites[0].name, st: rc.sites[0].st, lat: first.lat, lon: first.lon, assumption: true } : { id: s0.id, name: s0.name, st: s0.st, lat: s0.lat, lon: s0.lon, assumption: true };
    const endO = rc ? { name: last.city, st: last.st, lat: last.lat, lon: last.lon } : { name: wps[wps.length - 1].name, st: wps[wps.length - 1].st, lat: wps[wps.length - 1].lat, lon: wps[wps.length - 1].lon };
    return {
      app: 'Expandica', kind: 'grossmann-path', mode: rc ? 'rural' : 'city', rural: !!rc, asof: P.asof, note: P.honesty, startNote: P.startNote, endNote: rc ? (P.ruralEndNote || P.endNote) : P.endNote,
      corridor: XP ? XP.id : o.path ? PLN().path2.id : (P.corridor || 'central'), path: XP ? XP.id : o.path ? 'second' : 'first', start: startO, end: endO,
      corridorStart: { name: s0.name, st: s0.st, lat: s0.lat, lon: s0.lon, assumption: true }, corridorEnd: { name: wps[wps.length - 1].name, st: wps[wps.length - 1].st, lat: wps[wps.length - 1].lat, lon: wps[wps.length - 1].lon },
      hours, mph, roadFactor: D.roadFactor, roadMiles: r1(sp.road), straightMiles: r1(sp.straight), corridorRoadMiles: r1(corr.road), sites: sp.sites, legCount: sp.legs, legMiles: r1(sp.legMiles), legHours: r2(sp.legHours),
      maxLegMiles: r1(rc ? rc.maxLegMiles : sp.legMiles), maxLegHours: r2(rc ? rc.maxLegHours : sp.legHours), warnHours: XP ? DR.warnHours : RR.warnHours, warnings: rc ? rc.warnings.slice() : [],
      ruralLand: rc ? (P.ruralLand || null) : null, ruralHow: rc ? (P.ruralHow || null) : null, citySites: rc ? B.legs(corr.road, hours, mph).sites : sp.sites,
      zones, legs, tierSelected: p.tier, tiers, contingencyPct: ps.contingency, byHours,
      assumptions: { bareSize: b.bareSize, bareThk: b.bareThk, bareConc: b.bareConc, bareShedFlat: b.bareShedFlat, barePower: b.barePower, bareBatt: b.bareBatt, bareShed: b.bareShed, barePs: b.barePs, land: b.land, closing: b.closing, kit: b.kit, fire: b.fire, gate: b.gate, shedLo: b.shedLo, shedHi: b.shedHi, cabLo: b.cabLo, cabHi: b.cabHi, cont: b.cont, mph, shedLabel: 'Shed or storage building: my planning assumption, not a quote' },
      bareBones: bare ? { perSite: [r0(bare.low), r0(bare.high)], chain: bareT, sites: sp.sites, pad: { size: bare.sizeKey + ' ft', thicknessIn: bare.thk, areaSqFt: bare.area, cuYd: bare.cuYd, cuYdWithWaste: bare.cuYdWithWaste, route: bare.route, routes: { rmx: [r0(bare.routes.rmx.low), r0(bare.routes.rmx.high)], contractor: [r0(bare.routes.pro.low), r0(bare.routes.pro.high)], bags: { count: bare.routes.bag.bags, cost: r0(bare.routes.bag.low) } } }, shed: bare.shedKey + ' ft', powerStationWh: bare.ps, padSmallerThanShed: bare.padSmallerThanShed, contingencyPct: bare.contingency,
        lines: bare.lines.map(l => ({ id: l.id, label: l.label, low: r0(l.low), high: r0(l.high), kind: l.kind, kindLabel: KIND[l.kind] || l.kind, asof: l.asof || null, src: l.src || [], parts: l.parts ? l.parts.map(q => ({ label: q.label, low: r0(q.low), high: r0(q.high), kind: q.kind, asof: q.asof || null, src: q.src || [] })) : [] })),
        notIncluded: bare.missing, warning: 'Prices are snapshots (see each line asof). Shipping, delivery, taxes and permits are not included unless a line says so.', permitQuestions: (P.permitQuestions || []).map(x => ({ topic: x.t, ask: x.q })) } : null,
      stateCosts, stateCostNote: 'USDA figures are averages for working farm and ranch land, an ag reference only, not small-lot prices. The lowest-priced land usually has access, water or building-rule problems. No state is ranked or recommended.',
      chainLandTotal: r0(stateCosts.reduce((a, x) => a + x.landTotal, 0)), chainLandBaseline: r0(sp.sites * eff(b.land, 0)),
      power: powerSizing(),
      kit: P.kit.map(it => ({ id: it.id, tier: it.tier, title: it.t, text: kitText(it), budgetLine: it.line ? (P.lineLabel[it.line] || it.line) : null })),
      phases, started: p.started || null
    };
  }
  EXC.ourPlan = ourPlan;

  const money = v => OA.money(v);
  const range = (a, bb) => a === bb ? money(a) : money(a) + ' to ' + money(bb);
  const clip = (t, n) => { t = String(t || ''); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '...' : t; };
  const fmtD = k => { try { return k ? OA.fmtDate(k, { month: 'short', day: 'numeric', year: 'numeric' }) : 'no date'; } catch (e) { return k || 'no date'; } };

  function planText(Q) {
    const P = PLN(), p = ensure().plan, L = [];
    if (Q.rural) {
      L.push('OUR PLAN: ' + (P.family || 'family') + ' RURAL CHAIN, ' + Q.sites + ' small-town sites from ' + Q.start.name + ', ' + Q.start.st + ' to ' + Q.end.name + ', ' + Q.end.st + ' (Central corridor)');
      L.push(Q.note); L.push('The line starts near ' + Q.corridorStart.name + ' (an assumption we can change). Every site is a small town in a rural, low-density area; ' + (P.ruralLand || ''));
      L.push(Q.sites + ' sites, ' + Q.legCount + ' legs averaging ' + OA.dist(Q.legMiles, 0) + ' (' + OA.hm(Q.legHours) + '), longest leg ' + OA.dist(Q.maxLegMiles, 0) + ' (' + OA.hm(Q.maxLegHours) + '). About ' + OA.dist(Q.roadMiles, 0) + ' by a rough road estimate (straight line between towns x ' + Q.roadFactor + ') at ' + Q.mph + ' mph. Town coordinates are approximate, rounded to 0.1 degree. City points would be ' + Q.citySites + ' sites.');
      (Q.warnings || []).forEach(w => L.push('WARNING: ' + w));
    } else {
      L.push('OUR PLAN: ' + (P.family || 'family') + ' path from ' + Q.start.name + ', ' + Q.start.st + ' to ' + Q.end.name + ', ' + Q.end.st + ' (Central corridor)');
      L.push(Q.note); L.push('Start is an assumption we can change: ' + Q.start.name + '.');
      L.push(Q.sites + ' sites, longest drive ' + Q.hours + ' h a day at ' + Q.mph + ' mph. About ' + OA.dist(Q.roadMiles, 0) + ' by a rough road estimate (straight line x ' + Q.roadFactor + '), ' + Q.legCount + ' legs of about ' + OA.dist(Q.legMiles, 0) + ' (' + OA.hm(Q.legHours) + ').');
    }
    L.push(''); L.push('SITES, west to east');
    Q.zones.forEach(z => {
      const t = z.town;
      L.push(z.i + '. ' + (t ? z.city + ', ' + z.st + (t.county ? ' (' + t.county + ' County)' : '') + ', ' + (t.popVerified && t.pop != null ? 'about ' + t.pop.toLocaleString('en-US') + ' people' : 'size not checked') : 'near ' + z.city + ', ' + z.st) + (z.legMiles ? ' - ' + OA.dist(z.legMiles, 0) + ' and about ' + OA.hm(z.legHours) + ' from site ' + (z.i - 1) : ' - west end'));
      if (t) L.push('   Approx town centre ' + z.lat + ', ' + z.lon + (t.typed ? ' (typed by us, not checked)' : '') + '. Land prices NOT checked; ask the county.');
      L.push('   Fire: ' + (z.fire.known ? clip(z.fire.note, 220) : 'check with the county') + (z.fire.url ? ' ' + z.fire.url : ''));
      if (z.camps.length) L.push('   Campgrounds to scout from: ' + z.camps.map(k => k.name + ' (' + OA.dist(k.miles, 0) + ')').join('; '));
    });
    L.push(''); L.push('COSTS (my planning assumptions, not quotes; ' + Q.contingencyPct + '% contingency included)');
    Q.tiers.forEach(t => L.push('- ' + t.label + ': ' + range(t.perSite[0], t.perSite[1]) + ' per site; all ' + Q.sites + ' sites ' + range(t.chain[0], t.chain[1])));
    L.push('Shed or storage building (Shed tier): my planning assumption, not a quote (' + money(Q.assumptions.shedLo || 0) + ' to ' + money(Q.assumptions.shedHi || 0) + ' per site).');
    const bb = Q.bareBones;
    if (bb) {
      L.push(''); L.push('BARE-BONES SITE: ' + range(bb.perSite[0], bb.perSite[1]) + ' per site; all ' + Q.sites + ' sites ' + range(bb.chain[0], bb.chain[1]));
      L.push(bb.pad.size + ' concrete pad, ' + bb.pad.thicknessIn + ' in (' + bb.pad.cuYdWithWaste + ' yd3 with 10% extra), ' + bb.shed + ' prefab shed, solar kit on the roof, ' + bb.powerStationWh + ' Wh portable power station, firepit. ' + bb.contingencyPct + '% contingency included.');
      bb.lines.forEach(l => L.push('- ' + l.label + ': ' + range(l.low, l.high) + ' [' + l.kindLabel + ', ' + (l.asof || 'no date') + ']'));
      L.push(bb.warning + ' Not counted: ' + bb.notIncluded.join(', ') + '.');
      L.push('Ask the county:'); bb.permitQuestions.forEach(x => L.push('  ' + x.topic + ': ' + x.ask));
      L.push(''); L.push('STATE COSTS (USDA 2026 averages for working farm land: an ag reference, not small-lot prices; the cheapest land usually has access, water or building-rule problems)');
      Q.stateCosts.forEach(x => L.push('- ' + x.name + ' (' + x.sites + (x.sites === 1 ? ' site' : ' sites') + '): pasture ' + (x.pasturePerAcre == null ? 'check with the source' : money(x.pasturePerAcre) + '/acre') + ', farm real estate ' + (x.farmRealEstatePerAcre == null ? 'check with the source' : money(x.farmRealEstatePerAcre) + '/acre') + '; bare-bones per site ' + (x.perSiteBare ? range(x.perSiteBare[0], x.perSiteBare[1]) : 'check with the source') + ' at a ' + money(x.lotPrice) + ' lot'));
      L.push('Land for all sites at our lot prices ' + money(Q.chainLandTotal) + ' (baseline ' + money(Q.chainLandBaseline) + ').');
    }
    L.push(''); L.push('STANDARD SITE KIT');
    Q.kit.forEach(it => L.push('- [' + TIER_LBL(it.tier) + '] ' + it.title));
    L.push('Check local rules and burn bans before every fire.');
    L.push(''); L.push('PHASES');
    Q.phases.forEach(ph => { L.push(ph.title + ' (target ' + fmtD(ph.target) + ', ' + ph.stepsDone + '/' + ph.steps + ' done)'); ph.items.forEach(i => L.push('  ' + (i.done ? '[x] ' : '[ ] ') + i.text)); });
    L.push(''); L.push(Q.note);
    return L.join('\n');
  }
  function planPrintHtml(Q) {
    const e = esc, P = PLN();
    let h = `<h1>Our plan: ${e(P.family || 'family')} ${Q.rural ? 'rural chain' : 'path'}</h1><p><b>${e(Q.note)}</b></p><p>Start (an assumption we can change): ${e(Q.start.name)}, ${e(Q.start.st)}. End: ${e(Q.end.name)}, ${e(Q.end.st)}. ${e(Q.sites)} sites, ${Q.rural ? 'longest leg ' + e(OA.hm(Q.maxLegHours)) : 'longest drive ' + e(Q.hours) + ' h a day'}, about ${e(OA.dist(Q.roadMiles, 0))} by a rough road estimate.</p>`;
    h += `<h2>Sites, west to east</h2><table><tr><th>#</th><th>${Q.rural ? 'Town' : 'Near'}</th><th>From previous</th><th>Fire and land notes</th></tr>${Q.zones.map(z => `<tr><td>${z.i}</td><td>${e(z.city)}, ${e(z.st)}${z.town ? '<br>' + e(z.town.popVerified && z.town.pop != null ? 'about ' + z.town.pop.toLocaleString('en-US') + ' people' : 'size not checked') : ''}</td><td>${z.legMiles ? e(OA.dist(z.legMiles, 0)) + '<br>' + e(OA.hm(z.legHours)) : 'west end'}</td><td>${z.fire.known ? e(clip(z.fire.note, 260)) : 'check with the county'}</td></tr>`).join('')}</table>`;
    h += `${Q.rural ? '<p>' + e(Q.ruralLand || '') + ' Town coordinates are approximate, rounded to 0.1 degree.</p>' : ''}<h2>Costs (my planning assumptions, not quotes)</h2><table><tr><th>Tier</th><th>Per site</th><th>All ${e(Q.sites)} sites</th></tr>${Q.tiers.map(t => `<tr><td>${e(t.label)}</td><td>${e(range(t.perSite[0], t.perSite[1]))}</td><td>${e(range(t.chain[0], t.chain[1]))}</td></tr>`).join('')}</table><p>Shed or storage building: my planning assumption, not a quote.</p>${Q.bareBones ? `<h2>Bare-bones site</h2><p>${e(range(Q.bareBones.perSite[0], Q.bareBones.perSite[1]))} per site, ${e(range(Q.bareBones.chain[0], Q.bareBones.chain[1]))} for all ${e(Q.sites)} sites. ${e(Q.bareBones.warning)}</p><table><tr><th>Line</th><th>Low</th><th>High</th><th>Source</th></tr>${Q.bareBones.lines.map(l => `<tr><td>${e(l.label)}</td><td>${e(money(l.low))}</td><td>${e(money(l.high))}</td><td>${e(l.kindLabel)}, ${e(l.asof || '')}</td></tr>`).join('')}</table>` : ''}`;
    h += `<h2>Standard site kit</h2><ul>${Q.kit.map(it => `<li><b>${e(it.title)}</b> (${e(TIER_LBL(it.tier))}): ${e(it.text)}</li>`).join('')}</ul><p>Check local rules and burn bans before every fire.</p>`;
    h += `<h2>Phases</h2>${Q.phases.map(ph => `<h3>${e(ph.title)}: target ${e(fmtD(ph.target))}</h3><ul style="list-style:none;padding-left:0">${ph.items.map(i => `<li>${i.done ? '&#9745;' : '&#9744;'} ${e(i.text)}</li>`).join('')}</ul>`).join('')}`;
    return h + `<p><i>${e(Q.note)}</i></p>`;
  }

  function savingsCard() {
    const g = (OA.S.ex.goals && OA.S.ex.goals.savings) || { goal: 0, saved: 0 }, pc = g.goal > 0 ? OA.clamp(Math.round(g.saved / g.goal * 100), 0, 100) : 0;
    return `<div class="card"><div class="ct"><b>Savings meter</b><button class="mini" data-go="quests">Open</button></div>
      <div class="exc-bar" role="img" aria-label="${pc} percent of the savings goal"><i style="width:${pc}%;float:left"></i></div>
      <p class="sm">${g.goal > 0 ? esc(money(g.saved || 0)) + ' saved of ' + esc(money(g.goal)) + ' (' + pc + '%)' : 'No savings goal yet. Set one from the Costs view, or on the Quests tab.'}</p></div>`;
  }
  function bothCard() {
    const B2 = EXC.bothPaths(); if (!B2) return '';
    const b = B2.second, bb = B2.bareChain, m = v => esc(money(v));
    return `<div class="card"><div class="ct"><b>Both paths: ${esc(B2.sites)} sites</b><span class="tag g">${bb ? m(bb[0]) + ' to ' + m(bb[1]) : ''}</span></div>
      <p class="sm">Path 1 is the Central line above. Path 2 is the Southern line (I-40 direction), ${esc(b.sites)} small-town sites from ${esc(b.start.name)}, ${esc(b.start.st)} to ${esc(b.end.name)}, ${esc(b.end.st)}: about ${esc(mi0(b.roadMiles))}, average leg ${esc(OA.hm(b.legHours))}, longest ${esc(OA.hm(b.maxLegHours))}. Totals use the bare-bones tier (your pad, shed and power choices on Costs) for all ${esc(B2.sites)} sites.</p>
      <p class="xs dim">${esc((PLN().path2 || {}).note || '')} Path 2 is read-only here: see its towns on the Map tab. ${(b.warnings || []).map(w => esc(w)).join(' ')}</p>
      <ol class="sm">${b.zones.map(z => `<li>${esc(z.city)}, ${esc(z.st)} <span class="dim xs">${z.i === 1 ? 'start' : esc(mi0(z.legMiles)) + ', ' + esc(OA.hm(z.legHours))}</span></li>`).join('')}</ol></div>`;
  }
  function legsCard() {
    const A = EXC.allPaths(); if (!A) return '';
    const m = v => esc(money(v)), xs = (PLN().extraPaths || []);
    const one = (q, x) => `<details class="card"><summary><b style="color:${x.color}">Path ${x.num}: ${esc(x.label)}</b> <span class="tag g">${esc(q.sites)} sites</span></summary>
      <p class="sm">${esc(q.sites)} small-town sites from ${esc(q.start.name)}, ${esc(q.start.st)} to ${esc(q.end.name)}, ${esc(q.end.st)}: about ${esc(mi0(q.roadMiles))}, average leg ${esc(OA.hm(q.legHours))}, longest ${esc(OA.hm(q.maxLegHours))}. ${q.bareBones ? 'Bare-bones tier: ' + m(q.bareBones.chain[0]) + ' to ' + m(q.bareBones.chain[1]) + ' for the whole path.' : ''}</p>
      <p class="xs dim">${esc(x.note)} ${(q.warnings || []).map(w => esc(w)).join(' ')}</p>
      <ol class="sm">${q.zones.map(z => `<li>${esc(z.city)}, ${esc(z.st)} <span class="dim xs">${z.i === 1 ? 'start' : esc(mi0(z.legMiles)) + ', ' + esc(OA.hm(z.legHours))}</span></li>`).join('')}</ol></details>`;
    return `<div class="card hot"><div class="ct"><b>North and south legs (paths 3 and 4)</b><span class="tag g">${esc(A.paths[2].sites + A.paths[3].sites)} sites</span></div>
      <p class="sm">Shorter hops: a stop about every 2 to 3 hours of driving, so a family can add a new spot without a long travel day. Same idea as before: a metal shed and power, nothing more. All four paths together: ${esc(A.sites)} sites${A.bareChain ? ', ' + m(A.bareChain[0]) + ' to ' + m(A.bareChain[1]) + ' on the bare-bones tier' : ''}.</p>
      <p class="xs dim">Towns were picked from memory and are NOT checked; land prices and county rules are NOT checked. Read only here: see the stops on the Map tab.</p></div>` + A.paths.slice(2).map((q, i) => one(q, xs[i])).join('');
  }
  function ourHeader(Q) {
    const p = ensure().plan, P = PLN(), s0 = startPt();
    const R = Q.rural, wrn = Q.warnings || [];
    return `<div class="card tip"><b class="gold">Our plan</b><p class="sm">${esc(P.honesty)}</p></div>
      <div class="card hot"><div class="ct"><b>Grossmann path: ${esc(Q.start.name)}, ${esc(Q.start.st)} to ${esc(Q.end.name)}, ${esc(Q.end.st)}</b><span class="tag g">${esc(Q.sites)} sites</span></div>
      <div class="exc-chips" role="group" aria-label="Plan mode"><button class="chip ${R ? 'on' : ''}" data-act="excMode" data-v="rural" aria-pressed="${R}">${esc(P.ruralLabel || 'Rural chain (13 sites, shorter drives)')}</button><button class="chip ${R ? '' : 'on'}" data-act="excMode" data-v="city" aria-pressed="${!R}">City points (${esc(Q.citySites)} sites)</button></div>
      <p class="sm">${R ? 'Every site, both ends included, is a small-town anchor in a rural, low-density area, so the drives between sites stay short.' : 'The Central corridor (roughly the I-80 direction), west to east, with sites at big-city points.'} <b>The line starts near ${esc(s0.name)}${s0.st ? ', ' + esc(s0.st) : ''}.</b> ${esc(P.startNote || '')}</p>
      <button class="btn block" data-act="excStartSheet" data-smoke>Change the start</button>
      ${R ? `<p class="xs dim" style="margin-top:10px">The longest-drive-day choice (8, 10, 12 hours) only applies to City points. The rural chain always uses ${esc(Q.sites)} sites.</p>` : `<label class="fl" style="margin-top:10px">Longest drive day</label>
      <div class="exc-chips">${P.hoursChoices.map(h => `<button class="chip ${p.hours === h ? 'on' : ''}" data-act="excHours" data-v="${h}" aria-pressed="${p.hours === h}">${h} hours</button>`).join('')}</div>`}
      <div class="stat"><div><b>${esc(Q.sites)}</b><span>SITES</span></div><div><b>${esc(mi0(Q.legMiles))}</b><span>${R ? 'AVERAGE LEG' : 'PER LEG'}</span></div><div><b>${esc(OA.hm(R ? Q.maxLegHours : Q.legHours))}</b><span>${R ? 'LONGEST LEG' : 'DRIVE PER LEG'}</span></div></div>
      ${wrn.length ? `<div class="alert danger"><b class="t">Check these legs</b>${wrn.map(w => esc(w)).join('<br>')}</div>` : (R ? `<p class="xs green">Longest leg is about ${esc(OA.hm(Q.maxLegHours))}, under the ${esc(Q.warnHours)} hour warning line.</p>` : '')}
      <p class="xs dim">${R ? `About ${esc(mi0(Q.roadMiles))} by a rough road estimate (straight lines between the towns x ${esc(D.roadFactor)}), at ${esc(Q.mph)} mph. ${esc(P.ruralHow || '')} Town coordinates are approximate town centres, rounded to 0.1 degree. Real days are slower: stops, weather and kids.` : `About ${esc(mi0(Q.roadMiles))} by a rough road estimate (straight lines between city centres x ${esc(D.roadFactor)}), at ${esc(Q.mph)} mph. ${esc(Q.sites)} sites = ceil(${esc(Math.round(Q.roadMiles))} / (${esc(Q.hours)} x ${esc(Q.mph)})) + 1, one at each end and the rest evenly spaced. Real days are slower: stops, weather and kids. ${Q.hours === 12 ? 'Twelve hours is a very long day with children: plan a motel or a stop on the way.' : ''}`}</p>
      ${p.started ? `<div class="alert ok"><b class="t">Plan started</b>The Coast tab is set to the Central corridor${R ? '' : ' and ' + esc(Q.hours) + ' hours'}.${p.prev ? ' <button class="mini" data-act="excStartUndo">Restore my earlier settings</button>' : ''}</div>` : ''}
      <button class="btn gold block" data-act="excStart">Start this plan</button>
      <p class="xs dim">Only selects the corridor, spacing${R ? '' : ' and drive hours'} and adds one item to your quests. It does not create or change any parcel.</p></div>
      ${bothCard()}
      ${legsCard()}
      <div class="exc-nav" style="padding-top:0">${OSEC.map(s => `<button class="${ourSec === s[0] ? 'on' : ''}" data-act="excOurSec" data-v="${s[0]}">${esc(s[1])}</button>`).join('')}</div>`;
  }
  const popLine = t => t.popVerified && t.pop != null ? 'About ' + t.pop.toLocaleString('en-US') + ' people (' + (t.popNote || 'source on file') + ').' : 'Size not checked (thought to be a small town; look it up).';
  function swapBtns(z) { return `<div class="row"><button class="btn" data-act="excSwapSheet" data-i="${z.i}" data-smoke>Swap this town</button>${z.town && z.town.swapped ? `<button class="btn" data-act="excSwapReset" data-i="${z.i}">Back to automatic</button>` : ''}</div>`; }
  function pathBody(Q) {
    const P0 = PLN(), hasR = Q.byHours.some(x => x.rural);
    let h = `<div class="card"><div class="ct"><b>8, 10, 12 hours${hasR ? ' or the rural chain' : ''}</b></div><div class="scroll-x"><table class="t"><tr><th></th>${Q.byHours.map(x => `<th>${x.rural ? 'Rural' : esc(x.hours) + ' h'}</th>`).join('')}</tr>
      <tr><td>Sites</td>${Q.byHours.map(x => `<td><b>${esc(x.sites)}</b></td>`).join('')}</tr><tr><td>Per leg</td>${Q.byHours.map(x => `<td>${esc(mi0(x.legMiles))}<br><span class="xs dim">${esc(OA.hm(x.legHours))}${x.rural ? '<br>longest ' + esc(OA.hm(x.maxLegHours)) : ''}</span></td>`).join('')}</tr></table></div>
      <p class="xs dim">Fewer sites means longer driving days. Same road estimate and speed in every column; the rural column uses the real distances between the chosen towns.</p></div>`;
    if (Q.rural) h += `<div class="card"><p class="sm"><b>${esc(PLN().ruralLabel || 'Rural chain')}.</b> ${esc(Q.ruralLand || '')}</p><p class="xs dim">Population figures marked "size not checked" were not looked up. Coordinates are approximate town centres rounded to 0.1 degree, so check each place on a map.</p></div>`;
    Q.zones.forEach(z => {
      const t = z.town;
      h += `<div class="card"><div class="ct"><b>Site ${z.i}: ${t ? esc(z.city) + ', ' + esc(z.st) : 'near ' + esc(z.city) + ', ' + esc(z.st)}</b><span class="tag ${z.end ? 'a' : ''}">${z.i} of ${Q.sites}</span></div>
        <p class="sm">${z.legMiles ? '<b>' + esc(mi0(z.legMiles)) + '</b> by road from site ' + (z.i - 1) + ', about <b>' + esc(OA.hm(z.legHours)) + '</b> of driving' : '<b>West end of the line</b> (the start is an assumption you can change)'}.</p>
        ${t ? `<p class="sm">Rural, low-density area${t.county ? ' in ' + esc(t.county) + ' County' : ''}. ${esc(popLine(t))}${t.typed ? ' <span class="tag w">typed by you, not checked</span>' : ''}${t.swapped && !t.typed ? ' <span class="tag">your swap</span>' : ''}${t.outOfRange ? ' <span class="tag a">far from its target point</span>' : ''}</p>
        <p class="xs dim">Approx town centre ${esc(z.lat.toFixed(1))}, ${esc(z.lon.toFixed(1))} (rounded to 0.1 degree${t.coordVerified ? '; checked on a reference page' : '; not checked'}). ${esc(mi0(t.snapMi))} from its evenly spaced target point.</p>
        <p class="xs warn">${esc(t.landNote || '')}</p>` : `<p class="xs dim">Point ${esc(OA.geo.fmtCoord ? OA.geo.fmtCoord(z.lat, z.lon, 'dd') : z.lat + ', ' + z.lon)}, ${esc(mi0(z.atMiles))} along the line, about ${esc(mi0(z.cityMi || 0))} from ${esc(z.city)}. The state comes from the nearest city: confirm it on a map.</p>
        ${z.end ? `<p class="xs warn">${esc(PLN().endNote || '')}</p>` : ''}`}
        ${t && z.end === 'east' && Q.endNote ? `<p class="xs warn">${esc(Q.endNote)}</p>` : ''}
        ${t ? swapBtns(z) : ''}
        <div class="sm" style="margin:8px 0"><b>Fire and burn rules (${esc(z.st)}):</b> ${z.fire.known ? esc(z.fire.note) : '<span class="dim">not verified: check with the county and the state fire agency</span>'}${z.fire.url ? ` <a class="btn mini" target="_blank" rel="noopener" href="${esc(z.fire.url)}">Official fire info</a>` : ''}</div>
        <div class="sm" style="margin:8px 0"><b>Land note:</b> ${z.fire.landNote ? esc(z.fire.landNote) : '<span class="dim">not verified: check with the county</span>'}${z.fire.landUrl ? ` <a class="btn mini" target="_blank" rel="noopener" href="${esc(z.fire.landUrl)}">Read more</a>` : ''}</div>
        ${z.sunHours != null ? `<p class="xs dim">Rough yearly average sun for ${esc(z.st)}: ${esc(z.sunHours)} peak sun hours a day (one city per state, winter is lower). Use the Power tab for your site.</p>` : ''}
        <div class="sm"><b>Nearest loaded campgrounds</b> (scouting starting points only: nothing about price, availability or suitability)</div>
        ${z.camps.length ? z.camps.map(k => `<div class="li"><div class="tx"><b>${esc(k.name)}</b><span>${esc(k.state)} · ${esc(mi0(k.miles))} from the site point</span></div><div class="end"><button class="mini" data-act="excScout" data-id="${esc(k.id)}" data-i="${z.i}">Scout here</button></div></div>`).join('') : '<p class="sm dim">No campground with coordinates is loaded. Open a map around the point and look for towns and public land.</p>'}</div>`;
    });
    return h;
  }
  function kitBody(Q) {
    const p = ensure().plan, P = PLN(), site = OA.clamp(p.siteSel, 1, Q.sites), done = p.sites[site] || {}, upto = TIER_ORDER.indexOf(p.tier);
    const items = P.kit.filter(it => TIER_ORDER.indexOf(it.tier) <= upto), nd = items.filter(it => done[it.id]).length;
    let h = `<div class="card"><div class="ct"><b>Standard site kit</b><span class="tag ${nd === items.length ? 'g' : ''}">${nd} of ${items.length}</span></div>
      <p class="sm dim">The same checklist for every site. Pick a site, then the tier you are working toward. Ticks are saved per site.</p>
      <div class="exc-chips">${Q.zones.map(z => `<button class="chip ${z.i === site ? 'on' : ''}" data-act="excSite" data-v="${z.i}">${z.i}: ${esc(z.city)}</button>`).join('')}</div>
      <div class="exc-chips">${P.tiers.map(t => `<button class="chip ${p.tier === t.id ? 'on' : ''}" data-act="excTier" data-v="${t.id}">${esc(t.label)}</button>`).join('')}</div>
      <p class="xs dim">${esc((P.tiers.find(t => t.id === p.tier) || {}).d || '')}</p></div>`;
    P.tiers.forEach(t => {
      const its = P.kit.filter(it => it.tier === t.id); if (!its.length || TIER_ORDER.indexOf(t.id) > upto) return;
      const tt = Q.tiers.find(x => x.id === t.id);
      h += `<div class="card"><div class="ct"><b>${esc(t.label)}</b><span class="xs dim">tier total ${esc(range(tt.perSite[0], tt.perSite[1]))} per site</span></div>${its.map(it => `<label class="chk" style="align-items:flex-start"><input type="checkbox" data-act="excKit" data-site="${site}" data-id="${esc(it.id)}" ${done[it.id] ? 'checked' : ''}><span><b>${esc(it.t)}</b>${it.line ? ' <span class="tag">' + esc((P.lineLabel[it.line] || it.line).split(' (')[0]) + '</span>' : ' <span class="tag w">no budget line</span>'}<div class="sm dim">${esc(kitText(it))}</div>${it.id === 'power' ? '<button class="mini" type="button" data-go="power">Open the Power tab</button>' : ''}${it.id === 'fire' ? '<button class="mini" type="button" data-go="build">Open the Build tab</button>' : ''}</span></label>`).join('')}</div>`;
    });
    h += `<div class="alert danger"><b class="t">Before every fire</b>Check local rules and burn bans before every fire. Fire rules change quickly and differ by county; see the Build tab, Fire section.</div>
      <p class="xs dim">Items marked "no budget line" are not in the cost numbers: pay for them from the contingency or add your own line. The shed's price range is my planning assumption, not a quote.</p>`;
    return h;
  }
  const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return 'source'; } };
  const srcLinks = a => (a || []).filter((u, i, ar) => u && ar.indexOf(u) === i).map(u => `<a class="xs" target="_blank" rel="noopener" href="${esc(u)}">${esc(hostOf(u))}</a>`).join(', ');
  const optChips = (k, vals, cur, lbl) => `<div class="exc-chips" role="group">${vals.map(v => `<button class="chip ${String(cur) === String(v) ? 'on' : ''}" data-act="excBare" data-k="${k}" data-v="${esc(v)}" aria-pressed="${String(cur) === String(v)}">${esc(lbl ? lbl(v) : v)}</button>`).join('')}</div>`;
  function bareCard(Q) {
    const bb = Q.bareBones, a = Q.assumptions; if (!bb) return `<div class="card"><p class="sm dim">The bare-bones price data is not loaded.</p></div>`;
    const r = bb.pad.routes, rt = bb.pad.route;
    let h = `<div class="card hot"><div class="ct"><b>Bare-bones site</b><span class="tag g">${esc(range(bb.perSite[0], bb.perSite[1]))} per site</span></div>
      <p class="sm">The cheapest possible site: just enough land for a small poured concrete pad, a prefab shed on it with a solar kit on the roof, and a portable power station inside, plus a basic fire-safe firepit.</p>
      <div class="alert"><b class="t">Prices are snapshots</b>Every line shows where it comes from and the month it was read. Shipping, delivery, taxes and permits are not included unless a line says so. Gravel base, form lumber and shed assembly had no price found and are not counted.</div>
      <label class="fl">Concrete pad size (ft)</label>${optChips('bareSize', ['8x10', '10x12', '12x16'], a.bareSize)}
      <label class="fl">Thickness</label>${optChips('bareThk', [4, 6], a.bareThk, v => v + ' in')}
      <p class="xs dim">${esc(bb.pad.areaSqFt)} sq ft x ${esc(bb.pad.thicknessIn)} in = ${esc(bb.pad.cuYd)} yd3 of concrete; with 10% extra (my planning assumption) ${esc(bb.pad.cuYdWithWaste)} yd3.</p>
      <label class="fl">How the pad is made</label>${optChips('bareConc', ['none', 'rmx', 'pro', 'bag'], a.bareConc, v => ({ none: 'No pour', rmx: 'Ready-mix truck', pro: 'Contractor', bag: 'DIY by the bag' })[v])}
      <label class="chk"><input type="checkbox" data-act="excBareRebar" ${a.bareRebar ? 'checked' : ''}><span>Add rebar ($0.50 to $1 per sq ft, cost guide)</span></label>
      <label class="fl">Prefab shed size (ft)</label>${optChips('bareShed', ['8x10', '10x12', '12x16'], a.bareShed)}
      ${bb.padSmallerThanShed ? `<div class="alert danger"><b class="t">Pad is smaller than the shed</b>The ${esc(bb.shed)} shed will not fit on a ${esc(bb.pad.size)} pad. Pick a bigger pad or a smaller shed.</div>` : ''}
      <label class="fl">Power source</label>${optChips('barePower', ['station', 'battery'], a.barePower, v => v === 'station' ? 'Portable power station' : 'Car batteries + inverter')}
      ${a.barePower === 'battery' ? nIn('bareBatt', 'Number of car batteries (1 to 6)', ensure().bud) + '<p class="xs dim">Priced from a battery price page and one inverter listing. The solar kit stays. Cables, fuses and a battery box had no price found. A licensed electrician should check the wiring.</p>' : `<label class="fl">Portable power station class</label>${optChips('barePs', [500, 1000, 2000], a.barePs, v => v + ' Wh')}`}
      ${a.barePs === 1000 ? '<p class="xs dim">The 1000 Wh price is a bundle with a 200 W panel, so the separate solar kit line is $0.</p>' : ''}
      <div class="exc-set">${nIn('bareShedFlat', 'Shed per building ($; 0 = use sourced range)', ensure().bud)}${nIn('land', 'Lot price ($, my assumption)', ensure().bud)}${nIn('closing', 'Closing ($, my assumption)', ensure().bud)}${nIn('fire', 'Firepit etc. ($, my assumption)', ensure().bud)}${nIn('cont', 'Contingency (%)', ensure().bud)}</div></div>`;
    h += `<div class="card"><div class="ct"><b>Cost lines, per site</b></div><div class="scroll-x"><table class="t"><tr><th>Line</th><th>Low</th><th>High</th><th>Source</th></tr>${bb.lines.map(l => `<tr><td>${esc(l.label)}</td><td>${esc(money(l.low))}</td><td>${esc(money(l.high))}</td><td><span class="tag ${l.kind === 'assumption' ? 'w' : 'g'}">${esc(l.kindLabel)}</span><br><span class="xs dim">${esc(l.asof || 'no date')}</span></td></tr>`).join('')}
      <tr><td>Contingency ${esc(bb.contingencyPct)}% on the subtotal</td><td colspan="3" class="xs dim">included in the totals below</td></tr>
      <tr><td><b>Per site</b></td><td><b>${esc(money(bb.perSite[0]))}</b></td><td><b>${esc(money(bb.perSite[1]))}</b></td><td></td></tr>
      <tr><td><b>All ${esc(Q.sites)} sites</b></td><td><b>${esc(money(bb.chain[0]))}</b></td><td><b>${esc(money(bb.chain[1]))}</b></td><td></td></tr></table></div>
      <p class="xs dim">Low is the cheapest sourced figure for each line, high is the dearest. Land, closing and firepit are my planning assumptions, not quotes. Your real total can fall outside this range.</p></div>`;
    h += `<div class="card"><div class="ct"><b>Three ways to make the pad</b><span class="xs dim">${esc(bb.pad.size)}, ${esc(bb.pad.thicknessIn)} in</span></div><div class="scroll-x"><table class="t"><tr><th>Route</th><th>Cost</th></tr>
      <tr class="${rt === 'rmx' ? 'sel' : ''}"><td>Ready-mix truck: ${esc(bb.pad.cuYdWithWaste)} yd3 at $110 to $195 per yd3, plus a short-load surcharge of $40 to $60 per yd3, plus a $85 to $350 delivery fee (materials only, no labor)</td><td>${esc(range(r.rmx[0], r.rmx[1]))}</td></tr>
      <tr class="${rt === 'pro' ? 'sel' : ''}"><td>Contractor, installed slab, $4 to $12 per sq ft for ${esc(bb.pad.areaSqFt)} sq ft (two guides: $4 to $8 and $6 to $12). Small jobs often cost more per sq ft than this.</td><td>${esc(range(r.contractor[0], r.contractor[1]))}</td></tr>
      <tr class="${rt === 'bag' ? 'sel' : ''}"><td>DIY by the bag: ${esc(r.bags.count)} bags of 80 lb mix at $6 (about ${esc((r.bags.count * 80).toLocaleString('en-US'))} lb to mix and move by hand)</td><td>${esc(money(r.bags.cost))}</td></tr></table></div>
      <p class="xs dim">Slabs this small are far under a 10 yd truck, so short-load fees or a minimum order almost certainly apply. One supplier price list shows an $820 minimum for small cash-on-delivery loads; ask yours. The highlighted route is the one counted in the totals.</p></div>`;
    h += `<details class="card"><summary class="b">Where each number comes from</summary>${bb.lines.filter(l => l.parts.length || l.src.length).map(l => `<div class="sm" style="margin-top:10px"><b>${esc(l.label)}</b> <span class="xs dim">(${esc(l.kindLabel)}, ${esc(l.asof || '')})</span>${l.parts.length ? '<ul style="margin:4px 0 0 18px;padding:0">' + l.parts.map(q => `<li class="xs">${esc(q.label)}: ${esc(range(q.low, q.high))} <span class="dim">(${esc(KIND[q.kind] || q.kind)}${q.asof ? ', ' + esc(q.asof) : ''})</span> ${srcLinks(q.src)}</li>`).join('') + '</ul>' : `<div class="xs">${srcLinks(l.src)}</div>`}</div>`).join('')}</details>`;
    return h;
  }
  function stateCostCard(Q) {
    const p = ensure().plan, b = ensure().bud, so = p.stSort, rows = Q.stateCosts.slice();
    const KEYS = { first: x => x.order, name: x => x.name, sites: x => x.sites, pasture: x => x.pasturePerAcre, farm: x => x.farmRealEstatePerAcre, bare: x => x.perSiteBare ? x.perSiteBare[0] : null, land: x => x.landTotal };
    const kf = KEYS[so.k] || KEYS.first, dir = so.dir === -1 ? -1 : 1;
    rows.sort((x, y) => { const a = kf(x), c = kf(y); if (a == null && c == null) return 0; if (a == null) return 1; if (c == null) return -1; return (a < c ? -1 : a > c ? 1 : 0) * dir; });
    const cell = v => v == null ? '<span class="dim">check with the source</span>' : esc(money(v));
    const sortChips = [['first', 'Route order'], ['name', 'State'], ['sites', 'Sites'], ['pasture', 'Pasture'], ['farm', 'Farm real estate'], ['bare', 'Bare-bones'], ['land', 'Land total']];
    let h = `<div class="card"><div class="ct"><b>State costs</b><span class="tag">${esc(Q.stateCosts.length)} states</span></div>
      <div class="alert"><b class="t">Ag reference, not a lot price</b>The USDA numbers are 2026 averages for working farm and ranch land, usually big tracts. They are not prices for a small lot, and small parcels often cost more per acre. The lowest-priced land usually has access, water or building-rule problems. Nothing here ranks the states or says where to buy.</div>
      <label class="fl">Sort by (tap again to reverse)</label><div class="exc-chips">${sortChips.map(c => `<button class="chip ${so.k === c[0] ? 'on' : ''}" data-act="excStSort" data-v="${c[0]}" aria-pressed="${so.k === c[0]}">${esc(c[1])}${so.k === c[0] ? (dir === 1 ? ' (up)' : ' (down)') : ''}</button>`).join('')}</div>
      <div class="scroll-x"><table class="t"><tr><th>State</th><th>Sites</th><th>Pasture $/acre</th><th>Farm real estate $/acre</th><th>One acre at the pasture rate (ag reference, not a lot price)</th><th>Bare-bones per site</th><th>Land for these sites</th></tr>
      ${rows.map(x => `<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.sites)}</td><td>${cell(x.pasturePerAcre)}</td><td>${cell(x.farmRealEstatePerAcre)}</td><td>${cell(x.oneAcreAtPasture)}</td><td>${x.perSiteBare ? esc(range(x.perSiteBare[0], x.perSiteBare[1])) : '<span class="dim">check with the source</span>'}</td><td>${esc(money(x.landTotal))}${x.lotIsOverride ? `<br><span class="xs dim">at ${esc(money(x.lotPrice))} a lot; baseline ${esc(money(x.landBaselineTotal))}</span>` : ''}</td></tr>`).join('')}
      <tr><td><b>Chain</b></td><td><b>${esc(Q.sites)}</b></td><td colspan="4" class="xs dim">Chain land total at your lot prices</td><td><b>${esc(money(Q.chainLandTotal))}</b><br><span class="xs dim">baseline at ${esc(money(a0(b)))} a lot: ${esc(money(Q.chainLandBaseline))}</span></td></tr></table></div>
      <p class="xs dim">USDA NASS Land Values 2026 Summary (released 2026-07-31). Small-lot prices by state: check with the county and listings; none were found. The bare-bones per-site figure uses your lot price (below) with the same sourced pad, shed, solar and power station prices in every state, so the only thing that changes it is the lot price you enter.</p>
      <label class="fl">Your lot price for one state (optional, blank uses ${esc(money(a0(b)))})</label>
      <div class="exc-set">${Q.stateCosts.map(x => `<label class="fl">${esc(x.name)} ($)<input class="in" type="number" inputmode="decimal" min="0" placeholder="${esc(a0(b))}" data-bind="ex.coast.bud.stateLot.${esc(x.st)}" data-type="number" data-then="excBudRefresh" value="${b.stateLot && b.stateLot[x.st] != null ? esc(b.stateLot[x.st]) : ''}"></label>`).join('')}</div></div>`;
    return h;
  }
  const a0 = b => eff(b.land, 0);
  function permitCard(Q) {
    const L = (Q.bareBones && Q.bareBones.permitQuestions) || [];
    return `<div class="card"><div class="ct"><b>Ask the county before you pour or build</b></div><p class="sm dim">No local rule is stated here. These are the questions to put to the county planning or building office (and the fire district).</p>
      <ul style="margin:0 0 0 18px;padding:0">${L.map(x => `<li class="sm" style="margin-bottom:8px"><b>${esc(x.topic)}.</b> ${esc(x.ask)}</li>`).join('')}</ul></div>`;
  }
  function costBody(Q) {
    const p = ensure().plan, b = ensure().bud, P = PLN();
    let h = `<div class="card"><div class="ct"><b>Cost per tier</b><span class="tag">${esc(Q.contingencyPct)}% contingency</span></div>
      <p class="sm">Every dollar figure is <b>my planning assumption, not a quote</b>. Replace each with county numbers and real quotes.</p>
      <div class="scroll-x"><table class="t"><tr><th>Tier</th><th>Per site</th><th>All ${esc(Q.sites)} sites</th></tr>${Q.tiers.map(t => `<tr class="${t.id === p.tier ? 'sel' : ''}"><td>${esc(t.label)}</td><td>${esc(range(t.perSite[0], t.perSite[1]))}</td><td><b>${esc(range(t.chain[0], t.chain[1]))}</b></td></tr>`).join('')}</table></div>
      <p class="xs dim">Tiny cabin = camp-ready plus the cabin. "Tiny cabin plus shed" keeps the shed too, as the phases do. Counties often limit cabins in rural, low-density areas, and carrying costs (tax, insurance, fees) are not counted here.</p></div>`;
    h += bareCard(Q) + stateCostCard(Q) + permitCard(Q);
    h += `<div class="card"><div class="ct"><b>All sites, by plan</b></div><div class="scroll-x"><table class="t"><tr><th></th>${Q.byHours.map(x => `<th>${x.rural ? 'Rural' : esc(x.hours) + ' h'}</th>`).join('')}</tr><tr><td>Sites</td>${Q.byHours.map(x => `<td><b>${esc(x.sites)}</b></td>`).join('')}</tr>
      <tr><td>Land only</td>${Q.byHours.map(x => `<td>${esc(money(x.chain.land))}</td>`).join('')}</tr>${Q.byHours[0].chain.bare ? `<tr><td>Bare-bones</td>${Q.byHours.map(x => `<td>${esc(money(x.chain.bare[0]))}<br><span class="xs dim">to ${esc(money(x.chain.bare[1]))}</span></td>`).join('')}</tr>` : ''}<tr><td>Camp-ready</td>${Q.byHours.map(x => `<td>${esc(money(x.chain.camp))}</td>`).join('')}</tr>
      <tr><td>Shed</td>${Q.byHours.map(x => `<td>${esc(money(x.chain.shed[0]))}<br><span class="xs dim">to ${esc(money(x.chain.shed[1]))}</span></td>`).join('')}</tr><tr><td>Tiny cabin</td>${Q.byHours.map(x => `<td>${esc(money(x.chain.cabin[0]))}<br><span class="xs dim">to ${esc(money(x.chain.cabin[1]))}</span></td>`).join('')}</tr></table></div>
      <p class="xs dim">More, shorter legs mean more sites to buy and carry. Same per-site assumptions in every column. ${Q.rural ? 'The rural column counts ' + esc(Q.sites) + ' sites; the land price is still only my assumption for a rural, low-density area and has NOT been checked.' : 'Switch to the rural chain at the top to see its column.'}</p></div>`;
    h += `<div class="card"><div class="ct"><b>Shed or storage building, per site</b><span class="tag w">my planning assumption</span></div>
      <div class="exc-set">${nIn('shedLo', 'Shed low ($)', b)}${nIn('shedHi', 'Shed high ($)', b)}</div>
      <p class="xs dim">My planning assumption, not a quote (default ${esc(money(2000))} to ${esc(money(8000))}). Get a real quote and ask the county about permits.</p>
      <button class="btn block" data-act="excSub" data-v="budget">Edit all other assumptions in Budget</button></div>`;
    const t = Q.tiers.find(x => x.id === p.tier) || Q.tiers.find(x => x.id === 'camp') || Q.tiers[0];
    h += `<div class="card"><div class="ct"><b>Savings goal for the whole chain</b></div><p class="sm dim">Pick the tier every site will reach.</p>
      <div class="exc-chips">${P.tiers.map(x => `<button class="chip ${p.tier === x.id ? 'on' : ''}" data-act="excTier" data-v="${x.id}">${esc(x.label)}</button>`).join('')}</div>
      <p class="sm">${esc(t.label)} at all ${esc(Q.sites)} sites: <b>${esc(range(t.chain[0], t.chain[1]))}</b>.</p>
      <div class="row"><button class="btn" data-act="excPlanFeed" data-v="low">Set savings goal to ${esc(money(t.chain[0]))}</button>${t.chain[1] !== t.chain[0] ? `<button class="btn" data-act="excPlanFeed" data-v="high">Set savings goal to ${esc(money(t.chain[1]))}</button>` : ''}</div></div>` + savingsCard();
    return h;
  }
  function phaseHint(ph, Q) {
    const ps = parcels(), n = f => ps.filter(f).length, p = ensure().plan, g = (OA.S.ex.goals && OA.S.ex.goals.savings) || {};
    const rk = x => rankOf(x), own = n(x => rk(x) >= ownedRank());
    switch (ph.id) {
      case 'p0': return g.goal > 0 ? 'Savings goal is ' + money(g.goal) + '.' : 'No savings goal yet.';
      case 'p1': return n(x => rk(x) < ownedRank()) + ' parcel(s) scouted, visited or under contract.';
      case 'p2': return own + ' parcel(s) owned.';
      case 'p3': return 'Site 1 camp-ready items ticked: ' + P_kitCount(1, 'camp') + '.';
      case 'p4': return 'Sites with the shed ticked: ' + Object.keys(p.sites).filter(k => p.sites[k] && p.sites[k].shed).length + ' of ' + Q.sites + '.';
      case 'p5': { const P = ensure().corr ? plan() : null; return P ? P.covered + ' of ' + P.n + ' zones covered on the Coast plan.' : 'Pick the corridor on the Plan view to see coverage.'; }
      case 'p6': return n(x => x.stage === 'cabinbuilt' || x.stage === 'stop') + ' cabin(s) built.';
    }
    return '';
  }
  function P_kitCount(site, tier) { const p = ensure().plan, d = p.sites[site] || {}, its = PLN().kit.filter(it => TIER_ORDER.indexOf(it.tier) <= TIER_ORDER.indexOf(tier)); return its.filter(it => d[it.id]).length + ' of ' + its.length; }
  const goBtn = s => {
    if (!s.link) return '';
    if (s.link === 'coast') { const m = { Coast: 'our:path', Budget: 'sub:budget', 'Site kit': 'our:kit' }[s.lt] || 'our:path'; return `<button class="mini" type="button" data-act="excLinkCoast" data-v="${m}">${esc(s.lt)}</button>`; }
    return `<button class="mini" type="button" data-go="${esc(s.link)}">${esc(s.lt)}</button>`;
  };
  function phasesBody(Q) {
    const p = ensure().plan, P = PLN(), today = OA.dkey(); let prevDate = '';
    let h = savingsCard();
    P.phases.forEach(ph => {
      const n = ph.steps.length, d = ph.steps.filter(s => p.done[ph.id + s.id]).length, dt = p.dates[ph.id] || '';
      const late = dt && dt < today && d < n, order = dt && prevDate && dt < prevDate; if (dt) prevDate = dt;
      h += `<div class="card"><div class="ct"><b>${esc(ph.t)}</b><span class="tag ${d === n ? 'g' : ''}">${d} of ${n}</span></div>
        <p class="sm dim">${esc(ph.d)}</p><p class="xs gold">${esc(phaseHint(ph, Q))}</p>
        ${ph.steps.map(s => `<label class="chk" style="align-items:flex-start"><input type="checkbox" data-act="excStep" data-id="${esc(ph.id + s.id)}" ${p.done[ph.id + s.id] ? 'checked' : ''}><span>${esc(s.t)}${s.link ? '<div style="margin-top:4px">' + goBtn(s) + '</div>' : ''}</span></label>`).join('')}
        <label class="fl">Target date (yours to change)<input class="in" type="date" data-bind="ex.coast.plan.dates.${ph.id}" data-then="excBudRefresh" value="${esc(dt)}"></label>
        ${late ? '<span class="tag a">past the target date</span> ' : ''}${order ? '<span class="tag w">earlier than the previous phase date</span>' : ''}</div>`;
    });
    return h;
  }
  function ourView() {
    const Q = ourPlan(); if (!Q) return '<div class="card"><p class="sm dim">The plan data is not loaded.</p></div>';
    const body = ({ path: pathBody, kit: kitBody, cost: costBody, phases: phasesBody }[ourSec] || pathBody)(Q);
    return ourHeader(Q) + body + `<div class="card"><div class="ct"><b>Share this plan</b></div><div class="row"><button class="btn gold" data-act="excPlanShare">Share as text</button><button class="btn" data-act="excPlanPrint">Print the whole plan</button></div><p class="xs dim">${esc(PLN().honesty)}</p></div>`;
  }
  function render() {
    if (!hasEX()) return OA.header('Coast to Coast', 'West to east') + '<div class="card"><p class="sm dim">The parcel list is not loaded, so this tab cannot work yet.</p></div>';
    ensure();
    const body = ({ our: ourView, plan: planView, states: statesView, path: pathView, budget: budgetView }[sub] || ourView)();
    return OA.header('Coast to Coast', 'From one ocean to the other, one stop at a time') + `<div class="exc-nav">${SUBS.map(s => `<button class="${sub === s[0] ? 'on' : ''}" data-act="excSub" data-v="${s[0]}">${esc(s[1])}</button>`).join('')}</div>` + body;
  }
  OA.tab({ id: 'coast', label: 'Coast', icon: 'route', order: 6, render: () => render() });

  /* =====================  ACTIONS  ===================== */
  const num = v => (v === '' || v == null || isNaN(parseFloat(v))) ? null : parseFloat(v);
  function setEnd(end, pt) { const c = ensure(); c[end] = pt; OA.save(); nudge(); }
  function pickHtml(end) {
    const ps = parcels().filter(located), pl = (window.OCC && OCC.places && OCC.places.list) ? OCC.places.list().filter(p => typeof p.lat === 'number' && typeof p.lon === 'number').slice(0, 40) : [];
    let h = `<p class="sm dim">${end === 'a' ? 'Choose the start, ideally near the west coast.' : 'Choose the end, ideally near the east coast.'} The app orders the two points west to east itself.</p>`;
    h += `<div class="sh-sec"><h3>Your parcels</h3>${ps.length ? ps.slice(0, 60).map(p => `<div class="li" data-act="excUseParcel" data-end="${end}" data-id="${esc(p.id)}"><div class="tx"><b>${esc(p.name)}</b><span>${esc(p.state || '')} · ${esc(EX.stageOf(p).label)}</span></div></div>`).join('') : '<p class="sm dim">No parcel with coordinates yet.</p>'}</div>`;
    h += `<div class="sh-sec"><h3>Saved places</h3>${pl.length ? pl.map(p => `<div class="li" data-act="excUsePlace" data-end="${end}" data-id="${esc(p.id)}"><div class="tx"><b>${esc(p.name)}</b><span>${esc(p.state || '')}</span></div></div>`).join('') : '<p class="sm dim">No saved places with coordinates (Campica and Roadtripica share them).</p>'}</div>`;
    h += `<div class="sh-sec"><h3>Type a point</h3><label class="fl">Label<input class="in" id="excLbl" maxlength="40" placeholder="e.g. Grandma's town"></label><div class="two"><label class="fl">Latitude<input class="in" id="excLat" inputmode="decimal" placeholder="e.g. 47.6"></label><label class="fl">Longitude<input class="in" id="excLon" inputmode="decimal" placeholder="e.g. -122.3"></label></div><button class="btn gold block" data-act="excUseTyped" data-end="${end}">Use this point</button></div>`;
    return h;
  }
  function createParcel(over, note) {
    const p = EX.parcels.add(Object.assign({ stage: 'scouted' }, over, { notes: note }));
    memo = null; return p;
  }
  OA.act({
    excBudRefresh() { OA.render(true); },
    excBudSrc(el) { ensure().bud.src = el.dataset.v; OA.save(); OA.render(true); },
    async excBudFeed(el) {
      const B = BUD(), b = ensure().bud, def = B.D.defaults, P = ensure().corr ? plan() : null;
      const miles = (P && b.src !== 'typed') ? P.road : eff(b.miles, def.miles), L0 = B.legs(miles, OA.clamp(eff(b.hours, def.hours), B.D.limits.hoursMin, B.D.limits.hoursMax), eff(b.mph, def.mph)), ps = B.perSite(b);
      const nc = OA.clamp(Math.floor(b.nCamp) || 0, 0, L0.sites), ns = OA.clamp(Math.floor(b.nShed) || 0, 0, L0.sites - nc), nb = OA.clamp(Math.floor(b.nCabin) || 0, 0, L0.sites - nc - ns), ph = B.phase(L0.sites, nc, nb, ps, ns), v = Math.round(el.dataset.v === 'high' ? ph.high : ph.low);
      if (!await OA.confirm('Set your savings goal to ' + OA.money(v) + '? This replaces the current goal on the Quests tab.', 'Set goal')) return;
      const g = (OA.S.ex.goals = OA.S.ex.goals || {}).savings = OA.S.ex.goals.savings || { goal: 0, saved: 0, log: [] };
      g.goal = v; OA.save(); OA.toast('Savings goal set to ' + OA.money(v) + '.'); OA.render(true);
    },
    excBare(el) {
      const b = ensure().bud, k = el.dataset.k, v = el.dataset.v;
      if (k === 'bareSize' || k === 'bareShed') { if (!BAREDIM[v]) return; b[k] = v; } else if (k === 'bareThk') { b[k] = v === '6' ? 6 : 4; } else if (k === 'barePs') { const n = parseInt(v, 10); if ([500, 1000, 2000].indexOf(n) < 0) return; b[k] = n; } else if (k === 'barePower') { if (v !== 'station' && v !== 'battery') return; b[k] = v; } else if (k === 'bareConc') { if (['none', 'rmx', 'pro', 'bag'].indexOf(v) < 0) return; b[k] = v; } else return;
      OA.save(); OA.render(true);
    },
    excBareRebar(el) { ensure().bud.bareRebar = !!el.checked; OA.save(); OA.render(true); },
    excStSort(el) { const so = ensure().plan.stSort, k = el.dataset.v; if (so.k === k) so.dir = -so.dir; else { so.k = k; so.dir = (k === 'name' || k === 'first' || k === 'bare' || k === 'pasture' || k === 'farm') ? 1 : -1; } OA.save(); OA.render(true); },
    async excBareFeed(el) {
      const b = ensure().bud, bb = bareOf(b), n = parseInt(el.dataset.n, 10) || 0; if (!bb || !n) return;
      const v = Math.round((el.dataset.v === 'high' ? bb.high : bb.low) * n);
      if (!await OA.confirm('Set your savings goal to ' + OA.money(v) + ' (Bare-bones at all ' + n + ' sites, sourced snapshots plus my assumptions)? This replaces the current goal on the Quests tab.', 'Set goal')) return;
      const g = (OA.S.ex.goals = OA.S.ex.goals || {}).savings = OA.S.ex.goals.savings || { goal: 0, saved: 0, log: [] };
      g.goal = v; OA.save(); OA.toast('Savings goal set to ' + OA.money(v) + '.'); OA.render(true);
    },
    excSub(el) { sub = el.dataset.v; OA.render(); },
    excGoPlan() { sub = 'plan'; OA.render(); },
    excCorr(el) {
      const c = ensure(); c.corr = el.dataset.id; focus = null; OA.save(); nudge(); sub = 'plan'; OA.render(true);
    },
    excSet(el) {
      const c = ensure(), f = el.dataset.f, v = num(el.value);
      if (f === 'spacing') { if (v == null || v < D.limits.spacingMin || v > D.limits.spacingMax) { OA.toast('Spacing must be ' + D.limits.spacingMin + ' to ' + D.limits.spacingMax + ' miles.'); } c.spacing = v == null ? D.defaults.spacing : Math.max(D.limits.spacingMin, Math.min(D.limits.spacingMax, v)); }
      else { if (v == null || v < 10 || v > 300) OA.toast('Radius must be 10 to 300 miles.'); c.radius = v == null ? D.defaults.radius : Math.max(10, Math.min(300, v)); }
      focus = null; OA.save(); nudge(); OA.render(true);
    },
    excZone(el) { focus = parseInt(el.dataset.i, 10) || null; OA.render(true); },
    excPick(el) { OA.sheet(el.dataset.end === 'a' ? 'Choose the start' : 'Choose the end', pickHtml(el.dataset.end)); },
    excUseParcel(el) { const p = EX.parcels.get(el.dataset.id); if (!p || !located(p)) return; setEnd(el.dataset.end, { name: p.name, st: p.state || '', lat: p.lat, lon: p.lon }); OA.closeAllSheets && OA.closeAllSheets(); OA.render(true); },
    excUsePlace(el) { const k = (OCC.places.list() || []).find(x => x.id === el.dataset.id); if (!k || typeof k.lat !== 'number') return; setEnd(el.dataset.end, { name: k.name, st: k.state || '', lat: k.lat, lon: k.lon }); OA.closeAllSheets && OA.closeAllSheets(); OA.render(true); },
    excUseTyped(el) {
      const g = id => document.getElementById(id), la = num(g('excLat') && g('excLat').value), lo = num(g('excLon') && g('excLon').value);
      if (la == null || lo == null || Math.abs(la) > 90 || Math.abs(lo) > 180) { OA.toast('Enter a latitude (-90 to 90) and a longitude (-180 to 180).'); return; }
      setEnd(el.dataset.end, { name: (g('excLbl').value || '').trim().slice(0, 40) || 'My point', st: '', lat: OA.round(la, 4), lon: OA.round(lo, 4) });
      OA.closeAllSheets && OA.closeAllSheets(); OA.render(true);
    },
    excScout(el) {
      const k = camps().find(c => c.id === el.dataset.id); if (!k) { OA.toast('That campground is not in the loaded list.'); return; }
      const p = createParcel({ name: 'Near ' + k.name, state: k.state || '', county: k.county || '', lat: k.lat, lon: k.lon, links: { campId: k.id } }, 'Scouted from the Coast tab, zone ' + el.dataset.i + '. A starting point only: nothing is known about price, availability or suitability.');
      OA.toast('Scouted parcel created near ' + k.name + '.'); focus = null; OA.render(true); return p;
    },
    excScoutPoint(el) {
      const P = plan(), z = P && P.zs.find(q => q.i === parseInt(el.dataset.i, 10)); if (!z) return;
      createParcel({ name: 'Coast zone ' + z.i + ' near ' + z.city, state: '', lat: OA.round(z.lat, 3), lon: OA.round(z.lon, 3), links: {} }, 'Scouted from the Coast tab at the zone point near ' + z.city + (z.st ? ', ' + z.st : '') + '. State not set: check it. A starting point only, nothing about price or suitability.');
      OA.toast('Scouted parcel created at the zone point.'); focus = null; OA.render(true);
    },
    excState(el) {
      const s = stateData()[el.dataset.id]; if (!s) return;
      const list = s.own.concat(s.sc);
      OA.sheet(s.name, `<p class="sm dim">${esc(s.region)} region · ${s.own.length} owned, ${s.sc.length} scouted or in progress.</p>` + (list.length ? list.map(p => `<div class="li"><div class="tx"><b>${esc(p.name)}</b><span>${esc(p.county ? p.county + ' County · ' : '')}${esc(EX.stageOf(p).label)}</span></div></div>`).join('') : `<p class="sm">No parcel in ${esc(s.name)} yet. Add one from the Map tab, or scout a stop in a zone that crosses it.</p>`));
    }
  });
  /* ----- Our plan actions ----- */
  let swapSite = 0;
  function swapSheetHtml(Q, i) {
    const z = Q.zones[i - 1], t = z.town, usedIds = {}; Q.zones.forEach(x => { if (x.town && x.i !== i) usedIds[x.town.id] = 1; });
    const tg = { lat: t.targetLat, lon: t.targetLon }, prev = Q.zones[i - 2], next = Q.zones[i];
    const list = PLN().ruralTowns.filter(x => !usedIds[x.id]).map(x => ({ x, d: calc.mi(tg, x) })).sort((a, b) => a.d - b.d).slice(0, 14);
    return `<p class="sm dim">Site ${i} now: <b>${esc(z.city)}, ${esc(z.st)}</b>. The towns below are the nearest ones on the list to its target point, not used elsewhere. After a swap the legs and costs are worked out again; a leg over ${esc(Q.warnHours)} hours gets a warning.</p>
      <div class="sh-sec"><h3>Pick a town from the list</h3>${list.map(o => {
        const x = o.x, dPrev = prev ? Math.round(calc.mi(prev, x) * D.roadFactor) : null, dNext = next ? Math.round(calc.mi(x, next) * D.roadFactor) : null;
        return `<div class="li" data-act="excSwapPick" data-id="${esc(x.id)}"><div class="tx"><b>${esc(x.name)}, ${esc(x.st)}${x.id === t.id ? ' (current)' : ''}</b><span>${Math.round(o.d)} mi from the target point${x.popVerified !== false && x.pop != null ? ' · about ' + esc(x.pop.toLocaleString('en-US')) + ' people' : ' · size not checked'}${dPrev != null ? ' · ' + dPrev + ' mi from site ' + (i - 1) : ''}${dNext != null ? ' · ' + dNext + ' mi to site ' + (i + 1) : ''}</span></div></div>`;
      }).join('')}</div>
      <div class="sh-sec"><h3>Or type your own point</h3><p class="xs dim">Any place in the lower 48 states. It is saved as typed by you and not checked; coordinates are rounded to 0.1 degree.</p>
        <label class="fl">Name<input class="in" id="excWName" maxlength="40" placeholder="Town name"></label>
        <label class="fl">State (2 letters)<input class="in" id="excWSt" maxlength="2" placeholder="PA"></label>
        <div class="two"><label class="fl">Latitude<input class="in" id="excWLat" inputmode="decimal" placeholder="41.3"></label><label class="fl">Longitude<input class="in" id="excWLon" inputmode="decimal" placeholder="-74.8"></label></div>
        <button class="btn gold block" data-act="excSwapTyped">Use this point</button></div>
      ${t.swapped ? `<button class="btn block" data-act="excSwapReset" data-i="${i}">Back to the automatic town</button>` : ''}`;
  }
  function startSheetHtml() {
    const p = ensure().plan, P = PLN(), L = P.startLimits;
    return `<p class="sm dim">${esc(P.startNote)}</p><div class="sh-sec"><h3>Pick a start</h3>${P.starts.map(s => `<div class="li" data-act="excStartPick" data-id="${esc(s.id)}"><div class="tx"><b>${esc(s.name)}, ${esc(s.st)}</b><span>${p.start === s.id ? 'Current start' : 'Use this start'}</span></div></div>`).join('')}</div>
      <div class="sh-sec"><h3>Type my own</h3><p class="xs dim">Must be west of Reno (longitude ${L.lonMin} to ${L.lonMax}, latitude ${L.latMin} to ${L.latMax}) so the line still runs west to east.</p><label class="fl">Label<input class="in" id="excSLbl" maxlength="40" placeholder="e.g. Our house"></label>
      <div class="two"><label class="fl">Latitude<input class="in" id="excSLat" inputmode="decimal" placeholder="e.g. 38.6"></label><label class="fl">Longitude<input class="in" id="excSLon" inputmode="decimal" placeholder="e.g. -121.5"></label></div><button class="btn gold block" data-act="excStartTyped">Use this point</button></div>`;
  }
  function addPlanQuest() {
    const s = OA.S.ex; s.quests = s.quests || { done: {}, custom: [] }; if (!Array.isArray(s.quests.custom)) s.quests.custom = [];
    if (s.quests.custom.some(x => x.id === 'cgrossmann')) return false;
    s.quests.custom.push({ id: 'cgrossmann', t: 'Start our Grossmann path: scout the first zone near home' }); return true;
  }
  const printCss = () => {
    if (typeof document === 'undefined' || document.getElementById('excPrintCss')) return;
    const st = document.createElement('style'); st.id = 'excPrintCss';
    st.textContent = '#excPrint{display:none}@media print{body.exc-printing>*:not(#excPrint){display:none!important}body.exc-printing #excPrint{display:block!important;color:#000;background:#fff;font:12pt Georgia,serif;padding:12px}#excPrint table{border-collapse:collapse;width:100%}#excPrint th,#excPrint td{border:1px solid #888;padding:4px;text-align:left;vertical-align:top;font-size:10pt}}';
    document.head.appendChild(st);
  };
  OA.act({
    excOurSec(el) { ourSec = el.dataset.v; OA.render(); },
    excLinkCoast(el) { const v = String(el.dataset.v || ''); if (v.indexOf('sub:') === 0) sub = v.slice(4); else { sub = 'our'; ourSec = v.slice(4) || 'path'; } OA.render(); window.scrollTo(0, 0); },
    excMode(el) { const p = ensure().plan; p.rural = el.dataset.v !== 'city'; OA.save(); OA.render(true); },
    excSwapSheet(el) {
      const Q = ourPlan(), i = parseInt(el.dataset.i, 10), z = Q && Q.zones[i - 1]; if (!z || !z.town) return;
      swapSite = i; OA.sheet('Swap site ' + i, swapSheetHtml(Q, i));
    },
    excSwapPick(el) {
      const p = ensure().plan, i = swapSite, Q = ourPlan(); if (!i || !Q) return;
      const id = el.dataset.id, used = Q.zones.some(z => z.town && z.town.id === id && z.i !== i);
      if (used || !PLN().ruralTowns.some(t => t.id === id)) { OA.toast('That town is already a site in the chain.'); return; }
      p.swaps[i] = { id }; OA.save(); OA.closeAllSheets && OA.closeAllSheets(); OA.render(true);
    },
    excSwapTyped() {
      const g = id => document.getElementById(id), la = num(g('excWLat') && g('excWLat').value), lo = num(g('excWLon') && g('excWLon').value), i = swapSite;
      if (!i) return;
      if (la == null || lo == null || la < 24 || la > 50 || lo < -125 || lo > -66) { OA.toast('Use a point in the lower 48 states: latitude 24 to 50, longitude -125 to -66.'); return; }
      const p = ensure().plan; p.swaps[i] = { name: (g('excWName').value || '').trim().slice(0, 40) || 'My point', st: (g('excWSt').value || '').trim().slice(0, 2).toUpperCase(), lat: OA.round(la, 1), lon: OA.round(lo, 1) };
      OA.save(); OA.closeAllSheets && OA.closeAllSheets(); OA.render(true);
    },
    excSwapReset(el) { const p = ensure().plan, i = parseInt(el.dataset.i, 10) || swapSite; if (!i) return; delete p.swaps[i]; OA.save(); OA.closeAllSheets && OA.closeAllSheets(); OA.render(true); },
    excHours(el) { const h = parseInt(el.dataset.v, 10); if (PLN().hoursChoices.indexOf(h) < 0) return; ensure().plan.hours = h; OA.save(); OA.render(true); },
    excTier(el) { if (TIER_ORDER.indexOf(el.dataset.v) < 0) return; ensure().plan.tier = el.dataset.v; OA.save(); OA.render(true); },
    excSite(el) { ensure().plan.siteSel = parseInt(el.dataset.v, 10) || 1; OA.save(); OA.render(true); },
    excStep(el) { const p = ensure().plan; if (el.checked) p.done[el.dataset.id] = Date.now(); else delete p.done[el.dataset.id]; OA.save(); OA.render(true); },
    excKit(el) { const p = ensure().plan, k = String(el.dataset.site); p.sites[k] = p.sites[k] || {}; if (el.checked) p.sites[k][el.dataset.id] = Date.now(); else delete p.sites[k][el.dataset.id]; OA.save(); OA.render(true); },
    excStartSheet() { OA.sheet('Change the start', startSheetHtml()); },
    excStartPick(el) { const p = ensure().plan; if (!PLN().starts.some(s => s.id === el.dataset.id)) return; p.start = el.dataset.id; OA.save(); OA.closeAllSheets && OA.closeAllSheets(); OA.render(true); },
    excStartTyped() {
      const g = id => document.getElementById(id), la = num(g('excSLat') && g('excSLat').value), lo = num(g('excSLon') && g('excSLon').value), L = PLN().startLimits;
      if (la == null || lo == null || la < L.latMin || la > L.latMax || lo < L.lonMin || lo > L.lonMax) { OA.toast('Use a point west of Reno: latitude ' + L.latMin + ' to ' + L.latMax + ', longitude ' + L.lonMin + ' to ' + L.lonMax + '.'); return; }
      const p = ensure().plan; p.startPt = { name: (g('excSLbl').value || '').trim().slice(0, 40) || 'My start', st: 'CA', lat: OA.round(la, 3), lon: OA.round(lo, 3) }; p.start = 'custom';
      OA.save(); OA.closeAllSheets && OA.closeAllSheets(); OA.render(true);
    },
    async excStart() {
      const c = ensure(), p = c.plan, Q = ourPlan(); if (!Q) return;
      const lim = D.limits, spacing = OA.clamp(Math.ceil(Q.legMiles), lim.spacingMin, lim.spacingMax);
      const corrName = (D.corridors.find(k => k.id === c.corr) || { name: c.corr === 'custom' ? 'Choose my own' : 'none' }).name;
      const keepHours = Q.rural, hrsTxt = keepHours ? 'leaves the Budget drive limit as it is (the rural chain sets its own legs)' : 'sets the Budget drive limit to ' + Q.hours + ' hours';
      const msg = 'Start the Grossmann path' + (Q.rural ? ' (rural chain)' : '') + '? This sets the Coast tab to the Central corridor with stop spacing ' + spacing + ' miles, ' + hrsTxt + ', and adds one item to your Quests list. Right now: ' + corrName + ' corridor, spacing ' + c.spacing + ' miles, ' + (c.bud.hours || 'default') + ' hours (you can restore these). No parcel is created or changed.';
      if (!await OA.confirm(msg, 'Start plan')) return;
      p.prev = { corr: c.corr, spacing: c.spacing, hours: c.bud.hours == null ? null : c.bud.hours, src: c.bud.src || 'corr' };
      c.corr = PLN().corridor || 'central'; c.spacing = spacing; if (!keepHours) { c.bud.hours = Q.hours; c.bud.src = 'corr'; } focus = null; p.started = Date.now(); p.done.p0s1 = p.done.p0s1 || Date.now();
      const q = addPlanQuest(); OA.save(); nudge(); memo = null;
      OA.toast('Plan started' + (q ? ' and added to your quests' : '') + '. No parcel was created.'); OA.render(true);
    },
    excStartUndo() {
      const c = ensure(), p = c.plan, v = p.prev; if (!v) return;
      c.corr = v.corr || ''; c.spacing = v.spacing; if (v.hours == null) delete c.bud.hours; else c.bud.hours = v.hours; c.bud.src = v.src || 'corr'; p.prev = null; p.started = null;
      OA.save(); nudge(); memo = null; OA.toast('Earlier settings restored.'); OA.render(true);
    },
    async excPlanFeed(el) {
      const Q = ourPlan(), p = ensure().plan, t = Q && Q.tiers.find(x => x.id === p.tier); if (!t) return;
      const v = Math.round(el.dataset.v === 'high' ? t.chain[1] : t.chain[0]);
      if (!await OA.confirm('Set your savings goal to ' + OA.money(v) + ' (' + t.label + ' at all ' + Q.sites + ' sites, my planning assumptions)? This replaces the current goal on the Quests tab.', 'Set goal')) return;
      const g = (OA.S.ex.goals = OA.S.ex.goals || {}).savings = OA.S.ex.goals.savings || { goal: 0, saved: 0, log: [] };
      g.goal = v; OA.save(); OA.toast('Savings goal set to ' + OA.money(v) + '.'); OA.render(true);
    },
    excPlanShare() { const Q = ourPlan(); if (Q) OA.share.send({ title: 'Our plan: Grossmann path', text: planText(Q) }); },
    excPlanPrint() {
      const Q = ourPlan(); if (!Q) return; printCss();
      let n = document.getElementById('excPrint'); if (!n) { n = document.createElement('div'); n.id = 'excPrint'; document.body.appendChild(n); }
      n.innerHTML = planPrintHtml(Q); document.body.classList.add('exc-printing');
      const end = () => { document.body.classList.remove('exc-printing'); window.removeEventListener('afterprint', end); };
      window.addEventListener('afterprint', end);
      try { window.print(); } catch (e) { end(); OA.toast('Printing is not available here. Use Share as text.'); }
    }
  });
  /* second path (read only): the I-40 direction chain; both paths share the same cost assumptions */
  EXC.secondPath = () => { const Q = ourPlan({ path: true }); return Q; };
  EXC.bothPaths = () => { const a = ourPlan({ rural: true }), b = ourPlan({ path: true }); if (!a || !b) return null; const sum = (x, y) => [x[0] + y[0], x[1] + y[1]]; return { sites: a.sites + b.sites, first: a, second: b, bareChain: a.bareBones && b.bareBones ? sum(a.bareBones.chain, b.bareBones.chain) : null, perSiteBare: a.bareBones ? a.bareBones.perSite : null }; };
  /* paths 3 (north) and 4 (south): 2 to 3 hour spacing, same bare-bones site; read only */
  EXC.thirdPath = () => ourPlan({ path: 'north' });
  EXC.fourthPath = () => ourPlan({ path: 'south' });
  EXC.allPaths = () => {
    const L = [ourPlan({ rural: true }), ourPlan({ path: true }), ourPlan({ path: 'north' }), ourPlan({ path: 'south' })]; if (L.some(x => !x)) return null;
    const sites = L.reduce((n, q) => n + q.sites, 0), ok = L.every(q => q.bareBones), chain = ok ? [0, 1].map(i => L.reduce((n, q) => n + q.bareBones.chain[i], 0)) : null;
    return { sites, paths: L, bareChain: chain, perSiteBare: L[0].bareBones ? L[0].bareBones.perSite : null };
  };
  EXC.planText = () => { const Q = ourPlan(); return Q ? planText(Q) : ''; };
})();
