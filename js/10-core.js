/* Expandica core: state, parcel records, stages, shared API `EX`. Other modules call it defensively.
   EX.parcels.list() / get(id) / add(p) / update(id, patch) / remove(id) / byStage()
   Parcel: {id,name,state,county,acres,priceUsd,lat,lon,stage,notes,created,stageLog:[{stage,ts}],diligence:{itemId:bool},cabin:{...},links:{campId?},ownedDate?}
   EX.STAGES = ordered stage list [{id,label,ic,tag}]; EX.stageOf(p); EX.advance(id, stage)
   EX.circuit() -> owned/planned parcels ordered by nearest-neighbour with miles between (straight line x1.25)
   EX.ev(name, payload) fires a small in-app event; modules may listen via EX.on(name, fn). */
window.EX = window.EX || {};
(function () {
  'use strict';
  const EX = window.EX, esc = OA.esc;
  OA.defaults({ ex: { parcels: [], goals: { savings: { goal: 0, saved: 0, log: [] }, badges: {}, passport: [] }, family: { names: [] }, power: {}, ack: false } });
  const S = () => OA.S.ex;
  EX.STAGES = [
    { id: 'scouted', label: 'Scouted', ic: 'eye', tag: '' },
    { id: 'visited', label: 'Visited', ic: 'pin', tag: 'a' },
    { id: 'contract', label: 'Under contract', ic: 'list', tag: 'a' },
    { id: 'owned', label: 'Owned', ic: 'home', tag: 'g' },
    { id: 'cabinplan', label: 'Cabin planned', ic: 'tool', tag: 'g' },
    { id: 'cabinbuilt', label: 'Cabin built', ic: 'home', tag: 'g' },
    { id: 'stop', label: 'Stop open', ic: 'star', tag: 'g' }
  ];
  const idx = id => EX.STAGES.findIndex(s => s.id === id);
  EX.stageIdx = idx;
  EX.stageOf = p => EX.STAGES[Math.max(0, idx(p && p.stage))];
  const ev = {}; EX.on = (n, f) => (ev[n] = ev[n] || []).push(f);
  EX.ev = (n, d) => (ev[n] || []).forEach(f => { try { f(d); } catch (e) { } });
  EX.parcels = {
    list() { return S().parcels; },
    get(id) { return S().parcels.find(p => p.id === id) || null; },
    add(p) {
      const o = Object.assign({ id: OA.uid(), name: 'New parcel', state: '', county: '', acres: null, priceUsd: null, lat: null, lon: null, stage: 'scouted', notes: '', created: Date.now(), stageLog: [], diligence: {}, cabin: {}, links: {} }, p || {});
      if (!o.stageLog.length) o.stageLog.push({ stage: o.stage, ts: Date.now() });
      S().parcels.push(o); OA.save(); EX.ev('parcel', o); return o;
    },
    update(id, patch) { const p = EX.parcels.get(id); if (!p) return null; Object.assign(p, patch); OA.save(); EX.ev('parcel', p); return p; },
    remove(id) { S().parcels = S().parcels.filter(p => p.id !== id); OA.save(); EX.ev('parcel', null); },
    byStage() { const m = {}; EX.STAGES.forEach(s => m[s.id] = []); S().parcels.forEach(p => (m[p.stage] || m.scouted).push(p)); return m; }
  };
  EX.advance = (id, stage) => {
    const p = EX.parcels.get(id); if (!p || idx(stage) < 0) return null;
    p.stage = stage; p.stageLog.push({ stage, ts: Date.now() }); if (stage === 'owned' && !p.ownedDate) p.ownedDate = OA.dkey();
    OA.save(); EX.ev('stage', p); return p;
  };
  EX.hasPos = p => p && typeof p.lat === 'number' && typeof p.lon === 'number';
  EX.circuit = () => {
    const pts = S().parcels.filter(p => EX.hasPos(p) && idx(p.stage) >= idx('owned'));
    if (!pts.length) return { stops: [], miles: 0, legs: [] };
    const left = pts.slice(), out = [left.shift()], legs = []; let tot = 0;
    while (left.length) {
      const a = out[out.length - 1]; let bi = 0, bd = Infinity;
      left.forEach((p, i) => { const d = OA.geo.mi(a, p); if (d < bd) { bd = d; bi = i; } });
      const mi = Math.round(bd * 1.25); legs.push({ from: a.id, to: left[bi].id, mi }); tot += mi; out.push(left.splice(bi, 1)[0]);
    }
    return { stops: out, miles: tot, legs };
  };
  EX.money = v => v == null ? 'unknown' : OA.money(v);
  EX.states = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
  OA.publisher = () => {
    const ps = S().parcels, own = ps.filter(p => idx(p.stage) >= idx('owned')), nx = ps.filter(p => idx(p.stage) < idx('owned')).sort((a, b) => idx(b.stage) - idx(a.stage))[0];
    const g = S().goals.savings;
    return { stops: own.map(p => ({ name: p.name, state: p.state, stage: p.stage, lat: p.lat, lon: p.lon })), owned: own.length, next: nx ? { name: nx.name, state: nx.state, stage: nx.stage } : null, savings: { goal: g.goal || 0, saved: g.saved || 0 }, coast: (() => { try { const q = window.EXC && EXC.plan && EXC.plan(); return q ? { corridor: q.name || null, pct: q.pct == null ? null : q.pct, zones: q.zones ? q.zones.length : null } : null; } catch (e) { return null; } })(), events: (() => { try { return window.EXB && EXB.events ? EXB.events().slice(0, 60) : []; } catch (e) { return []; } })() };
  };
})();
