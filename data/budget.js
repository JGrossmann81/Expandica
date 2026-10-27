/* Expandica budget: default planning assumptions and pure math for the Coast tab 'Budget' view.
   Every dollar figure below is the OWNER'S OWN PLANNING ASSUMPTION, not a quote and not researched data. Nothing here is a price list.
   The user edits all of them in the app (replace with county numbers and real quotes). Pure functions only, so node can test them. */
window.EXC_BUDGET = (function () {
  'use strict';
  const D = {
    asof: '2026-10',
    src: 'Owner planning assumptions (not quotes). Replace with your county numbers.',
    defaults: { mph: 60, hours: 10, land: 2000, miles: 3000, closing: 1500, kit: 2000, fire: 800, gate: 700, cabLo: 15000, cabHi: 35000, shedLo: 2000, shedHi: 8000, cont: 15, carry: null, mpg: 22, gas: 3.5, bareSize: '8x10', bareThk: 4, bareConc: 'none', bareShedFlat: 600, barePower: 'station', bareBatt: 2, bareRebar: false, bareShed: '8x10', barePs: 500 },
    shedNote: 'Shed or storage building per site: my planning assumption, not a quote (default 2000 to 8000). Replace with a real quote and check county permit rules.',
    limits: { hoursMin: 6, hoursMax: 12, mphMin: 20, mphMax: 80 }
  };
  const B = {};
  /* sites needed = ceil(roadMiles / (hours x mph)) + 1: legs are the ceiling, and one more site closes the last leg (both coasts included) */
  B.sites = (roadMiles, hours, mph) => {
    const cap = hours * mph; if (!(roadMiles > 0) || !(cap > 0)) return 0;
    return Math.ceil(roadMiles / cap - 1e-9) + 1;
  };
  /* evenly spaced legs: (sites - 1) legs of equal length */
  B.legs = (roadMiles, hours, mph) => {
    const n = B.sites(roadMiles, hours, mph), legs = Math.max(0, n - 1), mi = legs ? roadMiles / legs : 0;
    return { sites: n, legs, legMiles: mi, legHours: mph > 0 ? mi / mph : 0 };
  };
  /* per-site cost at three tiers; contingency % applies to the whole per-site subtotal.
     a = {land, closing, kit, fire, gate, cabLo, cabHi, cont} */
  B.perSite = a => {
    const n = v => (typeof v === 'number' && isFinite(v) && v > 0) ? v : 0, k = 1 + n(a.cont) / 100;
    const land = n(a.land) + n(a.closing), camp = land + n(a.kit) + n(a.fire) + n(a.gate);
    const lo = Math.min(n(a.cabLo), n(a.cabHi)), hi = Math.max(n(a.cabLo), n(a.cabHi));
    const sl = Math.min(n(a.shedLo), n(a.shedHi)), sh = Math.max(n(a.shedLo), n(a.shedHi));
    /* shed tier = camp-ready + shed. cabinShed = camp-ready + shed + cabin (the shed kept, as in the phase order) */
    return { land: land * k, camp: camp * k, cabinLo: (camp + lo) * k, cabinHi: (camp + hi) * k, shedLo: (camp + sl) * k, shedHi: (camp + sh) * k, cabinShedLo: (camp + sl + lo) * k, cabinShedHi: (camp + sh + hi) * k, contingency: n(a.cont) };
  };
  /* totals for all sites at one tier each */
  B.totals = (sites, ps) => ({ land: sites * ps.land, camp: sites * ps.camp, cabinLo: sites * ps.cabinLo, cabinHi: sites * ps.cabinHi, shedLo: sites * ps.shedLo, shedHi: sites * ps.shedHi, cabinShedLo: sites * ps.cabinShedLo, cabinShedHi: sites * ps.cabinShedHi });
  /* phasing: nCamp sites at camp-ready, nShed at shed (optional, default 0), nCabin at tiny cabin (no shed), the rest land only (counts are clamped in that order) */
  B.phase = (sites, nCamp, nCabin, ps, nShed) => {
    const c = Math.max(0, Math.min(sites, Math.floor(nCamp) || 0)), s = Math.max(0, Math.min(sites - c, Math.floor(nShed) || 0)), b = Math.max(0, Math.min(sites - c - s, Math.floor(nCabin) || 0)), l = sites - c - s - b;
    return { land: l, camp: c, shed: s, cabin: b, low: l * ps.land + c * ps.camp + s * ps.shedLo + b * ps.cabinLo, high: l * ps.land + c * ps.camp + s * ps.shedHi + b * ps.cabinHi };
  };
  /* fuel for one crossing (one way) */
  B.fuel = (roadMiles, mpg, gas) => (mpg > 0 && gas >= 0) ? roadMiles / mpg * gas : null;

  /* ---- Bare-bones tier: pad + prefab shed + solar kit + portable power station. Pure; X = window.EXB_BARE (sourced data).
     Only land, closing, firepit and contingency are the owner's assumptions (a.land, a.closing, a.fire, a.cont); everything else comes from X items
     (kind 'retail' = seller/news listing, 'guide' = cost guide) with src and asof. Null in X means not found, and counts as 0 with a flag. */
  const SIZES = { '8x10': [8, 10], '10x12': [10, 12], '12x16': [12, 16] };
  B.bareSizes = Object.keys(SIZES);
  B.bareThick = [4, 6];
  B.psClasses = [500, 1000, 2000];
  B.padDims = k => SIZES[k] || null;
  const cu = (w, l, t) => w * l * (t / 12) / 27;
  B.slabVolume = cu;
  const cents = v => Math.round(v * 100) / 100;
  B.bare = (a, X) => {
    const num = v => (typeof v === 'number' && isFinite(v) && v > 0) ? v : 0, k = 1 + num(a.cont) / 100;
    if (!X || !Array.isArray(X.items)) return null;
    const it = id => X.items.find(x => x.id === id) || null;
    const sizeKey = SIZES[a.bareSize] ? a.bareSize : '8x10', thk = a.bareThk === 6 ? 6 : 4, dims = SIZES[sizeKey];
    const slab = (X.slabs || []).find(s => s.size.indexOf(sizeKey + ' ') === 0 && s.thicknessIn === thk);
    if (!slab) return null;
    const waste = (X.assumptions && typeof X.assumptions.wasteFactor === 'number') ? X.assumptions.wasteFactor : 0.1;
    const yd = slab.cuYdWithWaste, area = slab.areaSqFt, missing = [];
    const ref = (i, extra) => Object.assign({ src: i ? i.src : null, asof: i ? i.asof : null, kind: i ? i.kind : 'guide' }, extra || {});
    /* three routes for the pad */
    const rm = ['rmx_yd_guide_a', 'rmx_yd_guide_b', 'rmx_yd_guide_c'].map(it), sl = ['short_load_a', 'short_load_b'].map(it), dl = it('delivery_fee'), pro = ['slab_pro_angi', 'slab_pro_shed'].map(it), bag = it('bag_concrete'), reb = it('rebar');
    const mn = (arr, f) => Math.min.apply(null, arr.filter(Boolean).map(x => x[f]).filter(v => typeof v === 'number')), mx = (arr, f) => Math.max.apply(null, arr.filter(Boolean).map(x => x[f]).filter(v => typeof v === 'number'));
    const parts = [
      { label: 'Ready-mix concrete, ' + cents(yd) + ' yd3 (with ' + Math.round(waste * 100) + '% extra) at ' + mn(rm, 'low') + ' to ' + mx(rm, 'high') + ' per yd3', low: cents(yd * mn(rm, 'low')), high: cents(yd * mx(rm, 'high')), src: rm.filter(Boolean).map(x => x.src), asof: '2025-02 to 2026-07', kind: 'guide' },
      { label: 'Short-load surcharge (small load), ' + mn(sl, 'low') + ' to ' + mx(sl, 'high') + ' per yd3', low: cents(yd * mn(sl, 'low')), high: cents(yd * mx(sl, 'high')), src: sl.filter(Boolean).map(x => x.src), asof: '2025-02 to 2026-09', kind: 'guide' },
      { label: 'Truck delivery fee', low: dl ? dl.low : 0, high: dl ? dl.high : 0, src: dl ? [dl.src] : [], asof: dl ? dl.asof : null, kind: 'guide' }
    ];
    const rmxLow = cents(parts[0].low + parts[1].low + parts[2].low), rmxHigh = cents(parts[0].high + parts[1].high + parts[2].high);
    const proLow = cents(area * mn(pro, 'low')), proHigh = cents(area * mx(pro, 'high'));
    const bags = Math.ceil(yd * 45 - 1e-9), bagCost = bag ? cents(bags * bag.low) : 0;
    const rebar = a.bareRebar === true && reb ? { low: cents(area * reb.low), high: cents(area * reb.high) } : { low: 0, high: 0 };
    const routes = {
      rmx: { id: 'rmx', label: 'Ready-mix truck, materials and delivery only (you place and finish it, or pay labor separately)', low: rmxLow, high: rmxHigh, parts },
      pro: { id: 'pro', label: 'Contractor installed slab, ' + mn(pro, 'low') + ' to ' + mx(pro, 'high') + ' per sq ft (materials and labor)', low: proLow, high: proHigh, parts: [{ label: area + ' sq ft x ' + mn(pro, 'low') + ' to ' + mx(pro, 'high'), low: proLow, high: proHigh, src: pro.filter(Boolean).map(x => x.src), asof: '2025-02 to 2026-04', kind: 'guide' }] },
      bag: { id: 'bag', label: 'DIY by the bag, ' + bags + ' bags of 80 lb mix (about ' + (bags * 80).toLocaleString('en-US') + ' lb to mix by hand)', low: bagCost, high: bagCost, bags, parts: [{ label: bags + ' bags x ' + (bag ? bag.low : 0), low: bagCost, high: bagCost, src: bag ? [bag.src] : [], asof: bag ? bag.asof : null, kind: 'guide' }] }
    };
    routes.none = { id: 'none', label: 'No concrete pour (shed set on gravel or blocks; gravel and blocks not priced)', low: 0, high: 0, parts: [] };
    const route = routes[a.bareConc] ? a.bareConc : 'rmx', R = routes[route];
    const padLow = cents(R.low + rebar.low), padHigh = cents(R.high + rebar.high);
    const lines = [];
    lines.push({ id: 'land', label: 'Land (your lot price)', low: num(a.land), high: num(a.land), kind: 'assumption', asof: D.asof, src: [], note: 'My assumption; replace with the real price. State farm-land averages are not lot prices.' });
    lines.push({ id: 'closing', label: 'Closing, title, recording, survey', low: num(a.closing), high: num(a.closing), kind: 'assumption', asof: D.asof, src: [], note: 'My assumption.' });
    lines.push({ id: 'pad', label: 'Concrete pad ' + sizeKey + ' ft, ' + thk + ' in (' + area + ' sq ft)', low: padLow, high: padHigh, kind: 'guide', asof: '2026-10', src: R.parts.reduce((s, p) => s.concat(p.src || []), []), note: R.label + (rebar.high ? '; includes rebar ' + reb.low + ' to ' + reb.high + ' per sq ft' : '') + '. Gravel base and form lumber: no price found, not counted.', parts: R.parts.concat(rebar.high ? [{ label: 'Rebar', low: rebar.low, high: rebar.high, src: [reb.src], asof: reb.asof, kind: 'guide' }] : []) });
    /* shed by size: every sourced item that matches the pad-size class */
    const shedIds = { '8x10': ['shed_8x10_guide', 'shed_resin_10x8'], '10x12': ['shed_wood_kit_10x12_b', 'shed_wood_kit_10x12_a', 'shed_wood_10x12_dealer'], '12x16': ['shed_12x16_wood_guide'] };
    const shedKey = SIZES[a.bareShed] ? a.bareShed : '8x10', shedItems = shedIds[shedKey].map(it).filter(Boolean);
    const shLow = shedItems.length ? Math.min.apply(null, shedItems.map(x => x.low)) : 0, shHigh = shedItems.length ? Math.max.apply(null, shedItems.map(x => x.high)) : 0;
    const kinds = shedItems.map(x => x.kind).filter((v, i, ar) => ar.indexOf(v) === i);
    const flat = num(a.bareShedFlat);
    if (flat) lines.push({ id: 'shed', label: 'Metal storage shed ' + shedKey + ' ft (your planning figure)', low: flat, high: flat, kind: 'assumption', asof: D.asof, src: [], note: 'Your figure of about ' + flat + ' per building, metal shed ordered online. Not a quote; shipping and assembly not included.', parts: [] });
    else lines.push({ id: 'shed', label: 'Prefab shed ' + shedKey + ' ft', low: shLow, high: shHigh, kind: kinds.length === 1 ? kinds[0] : 'retail', asof: shedItems.reduce((m, x) => (x.asof || '') > m ? x.asof : m, ''), src: shedItems.map(x => x.src), note: 'Lowest to highest of the sourced items below. Delivery fees, handling fees and assembly are not included (no amounts found); some listings include delivery.', parts: shedItems.map(x => ({ label: x.label, low: x.low, high: x.high, src: [x.src], asof: x.asof, kind: x.kind })) });
    const ps = B.psClasses.indexOf(a.barePs) >= 0 ? a.barePs : 500, kit = it('solar_kit_200w'), p5 = it('ps_500'), p1 = it('ps_1000_bundle'), p2 = it('ps_2000'), P = ps === 500 ? p5 : ps === 1000 ? p1 : p2;
    const bundle = ps === 1000;
    lines.push({ id: 'solar', label: 'Solar kit for the roof (200 W kit: 2 panels, controller, brackets, leads)', low: bundle ? 0 : (kit ? kit.low : 0), high: bundle ? 0 : (kit ? kit.high : 0), kind: kit ? kit.kind : 'retail', asof: kit ? kit.asof : null, src: kit ? [kit.src] : [], note: bundle ? 'The 1000 Wh bundle below already includes a 200 W panel, so this line is $0.' : 'One retailer listing; confirm the model on the page. Mounting hardware for your shed roof and any wiring to the power station are not covered.' });
    if (a.barePower === 'battery') {
      const nb = Math.max(1, Math.min(6, Math.round(num(a.bareBatt)) || 2)), bf = it('car_battery_flooded'), ba = it('car_battery_agm'), inv = it('inverter_1000_psw');
      lines.push({ id: 'ps', label: nb + ' car batteries (flooded low price to AGM high price)', low: bf ? cents(nb * bf.low) : 0, high: ba ? cents(nb * ba.high) : 0, kind: 'guide', asof: bf ? bf.asof : null, src: [bf, ba].filter(Boolean).map(x => x.src), note: 'Battery only, per-battery price range from a price research page. Starting batteries are not made for daily deep discharge. Batteries can vent gas: keep them out of the living space, fused, and have the wiring checked.', parts: [bf, ba].filter(Boolean).map(x => ({ label: x.label, low: x.low, high: x.high, src: [x.src], asof: x.asof, kind: x.kind })) });
      lines.push({ id: 'inv', label: 'Inverter, 1000 W pure sine (your 12 V battery bank to household power)', low: inv ? inv.low : 0, high: inv ? inv.high : 0, kind: inv ? inv.kind : 'retail', asof: inv ? inv.asof : null, src: inv ? [inv.src] : [], note: inv ? inv.note : '' });
    } else
    lines.push({ id: 'ps', label: 'Portable power station, about ' + ps + ' Wh' + (bundle ? ' (bundle with a 200 W panel)' : ''), low: P ? P.low : 0, high: P ? P.high : 0, kind: P ? P.kind : 'retail', asof: P ? P.asof : null, src: P ? [P.src] : [], note: P ? 'Low is a sale price, high is full price, as reported in a news article; sales may have ended.' : '' });
    lines.push({ id: 'fire', label: 'Basic fire-safe firepit (plus tools, water storage)', low: num(a.fire), high: num(a.fire), kind: 'assumption', asof: D.asof, src: [], note: 'My assumption.' });
    const subLow = cents(lines.reduce((s, l) => s + l.low, 0)), subHigh = cents(lines.reduce((s, l) => s + l.high, 0));
    const sd = [shedKey.split('x').map(Number).sort((x, y) => y - x), dims.slice().sort((x, y) => y - x)];
    return { sizeKey, thk, shedKey, ps, route, area, slab, cuYd: slab.cuYd, cuYdWithWaste: yd, routes, lines, subLow, subHigh, contingency: num(a.cont), low: cents(subLow * k), high: cents(subHigh * k), padSmallerThanShed: sd[1][0] < sd[0][0] || sd[1][1] < sd[0][1], minOrderNote: 'One supplier price list shows a minimum order of ' + ((it('min_order_cod') || {}).low || 820) + ' for small cash-on-delivery loads; ask your supplier, because a minimum can exceed the per-yard total.', missing: ['gravel base', 'form lumber', 'shed delivery and assembly', 'permits', 'taxes'].concat(a.barePower === 'battery' ? ['battery cables, fuses, battery box'] : []) };
  };
  B.D = D;
  return B;
})();
