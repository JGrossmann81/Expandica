/* Expandica Power tab: off-grid power planner for a small cabin (EXP namespace).
   Math lives in EXP.calc (pure, tested by a node script). State: OA.S.ex.power = { cur: working plan, plans: [saved plans] }. */
window.EXP = window.EXP || {};
(function () {
  'use strict';
  const EXP = window.EXP, esc = OA.esc, D = () => window.EXP_DATA || { presets: [], sunStates: {}, winterCities: [], official: [], tilt: {}, lfp: { dod: 80 } };

  /* ---------- pure math ---------- */
  const num = (v, d) => { v = typeof v === 'string' ? parseFloat(v) : v; return (typeof v === 'number' && isFinite(v) && v >= 0) ? v : (d == null ? 0 : d); };
  const pos = v => { v = num(v, 0); return v > 0 ? v : null; };
  const ceilTo = (v, n) => Math.ceil(v / n - 1e-9) * n;
  const loadWatts = l => num(l.w) * num(l.q, 1);
  const loadWh = l => loadWatts(l) * num(l.h);
  EXP.loadWh = loadWh;
  /* c: plan {loads:[{w,q,h,ac,sim,surge}], sunW, sunS, eff (percent), days, dod (percent), panelW, ps:{wh,out,solar}} */
  EXP.calc = function (c) {
    c = c || {};
    const loads = c.loads || [];
    const eff = OA.clamp(num(c.eff, 70), 10, 100) / 100;
    const dod = OA.clamp(num(c.dod, 80), 10, 100) / 100;
    const days = num(c.days, 2);
    const whDay = loads.reduce((s, l) => s + loadWh(l), 0);
    const acWh = loads.reduce((s, l) => s + (l.ac ? loadWh(l) : 0), 0);
    const sunW = pos(c.sunW), sunS = pos(c.sunS);
    const panelFor = sun => sun ? whDay / (sun * eff) : null;
    const pw = panelFor(sunW), ps = panelFor(sunS);
    const battUsable = whDay * days, battNominal = battUsable / dod;
    /* inverter: AC loads only. peak = biggest of (sum of loads marked "runs together") and (any single AC load) */
    const ac = loads.filter(l => l.ac && loadWatts(l) > 0);
    const sim = ac.filter(l => l.sim);
    const peakSim = sim.reduce((s, l) => s + loadWatts(l), 0);
    const extraSim = sim.reduce((m, l) => Math.max(m, loadWatts(l) * (Math.max(1, num(l.surge, 1)) - 1)), 0);
    const peakOne = ac.reduce((m, l) => Math.max(m, loadWatts(l)), 0);
    const surgeOne = ac.reduce((m, l) => Math.max(m, loadWatts(l) * Math.max(1, num(l.surge, 1))), 0);
    const peakRun = Math.max(peakSim, peakOne);
    const surgePeak = Math.max(peakSim + extraSim, surgeOne);
    const invRec = ac.length ? ceilTo(peakRun * 1.25, 50) : 0;
    const r = {
      whDay, acWh, dcWh: whDay - acWh, eff, dod, days, sunW, sunS,
      panelWinter: pw, panelSummer: ps, panelWinterRound: pw == null ? null : ceilTo(pw, 10), panelSummerRound: ps == null ? null : ceilTo(ps, 10),
      battUsable, battNominal, battNominalRound: ceilTo(battNominal, 10), battAh12: battNominal / 12,
      acCount: ac.length, peakRun, surgePeak, invRec, station: null
    };
    /* portable power station check, against the worst (lowest) sun-hours the person entered */
    const stWh = pos(c.ps && c.ps.wh), stOut = pos(c.ps && c.ps.out), stSolar = pos(c.ps && c.ps.solar);
    if (stWh || stOut || stSolar) {
      const sun = (sunW && sunS) ? Math.min(sunW, sunS) : (sunW || sunS);
      const ownPanel = pos(c.panelW);
      const wantPanel = ownPanel || (sun ? ceilTo(whDay / (sun * eff), 10) : null);
      const checks = [];
      if (stWh) {
        const usable = stWh * dod;
        checks.push({ id: 'energy', ok: usable >= battUsable - 1e-9, usable, need: battUsable, maxDays: whDay > 0 ? usable / whDay : null, maxWh: days > 0 ? usable / days : null });
      }
      if (stOut) {
        checks.push({ id: 'out', ok: !ac.length || stOut >= peakRun - 1e-9, peak: peakRun, surge: surgePeak, out: stOut, surgeRisk: ac.length > 0 && surgePeak > stOut });
      }
      if (stSolar && sun && wantPanel) {
        const effW = Math.min(wantPanel, stSolar);
        const harvest = effW * sun * eff;
        const needPanel = ceilTo(whDay / (sun * eff), 10);
        checks.push({ id: 'solar', ok: harvest >= whDay - 1e-9, harvest, need: whDay, effW, wantPanel, needPanel, stSolar, capped: wantPanel > stSolar, ownPanel: !!ownPanel, sun, maxLoad: stSolar * sun * eff });
      }
      const fails = checks.filter(k => !k.ok).length;
      r.station = { checks, fails, level: !checks.length ? 'none' : fails === 0 ? 'ok' : fails === checks.length ? 'bad' : 'warn', sun, partial: !(stWh && stOut && stSolar && sun) };
    }
    return r;
  };
  EXP.tilt = lat => { lat = Math.abs(num(lat, 0)); const t = (D().tilt || {}); return { year: Math.round(lat), winter: Math.round(lat + (t.winterAdd || 15)), summer: Math.max(0, Math.round(lat - (t.summerSub || 15))) }; };

  /* ---------- state ---------- */
  const blank = () => ({ id: null, name: 'My cabin power plan', loads: [], sunW: 2, sunS: 5, eff: 70, days: 2, dod: 80, panelW: null, ps: { wh: null, out: null, solar: null }, state: '', winterCity: '', parcelId: '', lat: null });
  OA.defaults({ ex: { power: { cur: blank(), plans: [] } } });
  const P = () => {
    const ex = OA.S.ex = OA.S.ex || {};
    const p = ex.power = ex.power || {};
    if (!p.cur || typeof p.cur !== 'object') p.cur = blank();
    if (!Array.isArray(p.plans)) p.plans = [];
    const c = p.cur; if (!Array.isArray(c.loads)) c.loads = []; if (!c.ps || typeof c.ps !== 'object') c.ps = { wh: null, out: null, solar: null };
    return p;
  };
  const cur = () => P().cur;

  const f0 = n => n == null || !isFinite(n) ? '-' : Math.round(n).toLocaleString();
  const f1 = n => n == null || !isFinite(n) ? '-' : (Math.round(n * 10) / 10).toLocaleString();
  const f2 = n => n == null || !isFinite(n) ? '-' : (Math.round(n * 100) / 100).toLocaleString();

  /* ---------- little style block (namespaced) ---------- */
  function css() {
    if (document.getElementById('exp-css')) return;
    const s = document.createElement('style'); s.id = 'exp-css';
    s.textContent = '.exp-f{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.84rem;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:7px 9px;margin:6px 0;overflow-wrap:anywhere}' +
      '.exp-det{border-top:1px solid var(--line);padding:2px 0}.exp-det summary{min-height:44px;display:flex;align-items:center;cursor:pointer;font-weight:700;color:var(--gold)}.exp-det[open] summary{margin-bottom:4px}' +
      '.exp-row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.exp-name{font-weight:700}.exp-wh{color:var(--gold);font-weight:700;white-space:nowrap}' +
      '.exp-load{display:flex;gap:8px;align-items:center}.exp-load .in{flex:1}.exp-chk{display:flex;gap:14px;flex-wrap:wrap}.exp-x{flex:none;min-width:44px;min-height:44px}' +
      '.exp-ck{display:flex;align-items:center;gap:6px;min-height:36px;font-size:.88rem}.exp-ck input{width:20px;height:20px;accent-color:var(--gold2)}';
    document.head.appendChild(s);
  }

  /* ---------- results ---------- */
  function resHTML(r) {
    const c = cur();
    if (!r.whDay) return `<div class="card tip"><div class="ct">Results</div><p class="sm dim">Add at least one appliance with watts and hours to see the daily total and the sizing.</p></div>`;
    const sunLine = (label, sun, need, rnd) => sun
      ? `<div class="exp-f">${esc(label)} panel watts = ${f0(r.whDay)} Wh/day ÷ (${f1(sun)} sun h × ${f2(r.eff)}) = ${f0(need)} W</div><div class="kv"><span>Buy about</span><b class="gold">${f0(rnd)} W of panels</b></div>`
      : `<p class="sm dim">${esc(label)}: enter sun hours above to see the panel size.</p>`;
    let h = `<div class="card"><div class="ct"><span>Daily use</span></div>
      <div class="stat"><div><b>${f0(r.whDay)}</b><span>Wh PER DAY</span></div><div><b>${f2(r.whDay / 1000)}</b><span>kWh PER DAY</span></div><div><b>${f0(r.acWh)}</b><span>of it via inverter</span></div></div>
      <p class="xs dim">Total = sum of (watts × quantity × hours per day) for every row. Watts and hours are your estimates; read the label on each device.</p></div>`;
    h += `<div class="card"><div class="ct"><span>Solar panels</span></div>
      <div class="exp-f">Panel watts = Wh per day ÷ (sun hours × system efficiency)</div>
      ${sunLine('Winter / worst month', r.sunW, r.panelWinter, r.panelWinterRound)}
      ${sunLine('Summer', r.sunS, r.panelSummer, r.panelSummerRound)}
      <p class="xs dim">Efficiency ${f0(r.eff * 100)}% is a cautious rule of thumb for wiring, controller, battery and inverter losses, dirt and heat. Panels sized for summer will fall short in winter; size for the worst month you will actually stay.</p></div>`;
    h += `<div class="card"><div class="ct"><span>Battery</span></div>
      <div class="exp-f">Usable Wh = ${f0(r.whDay)} Wh/day × ${f1(r.days)} days = ${f0(r.battUsable)} Wh</div>
      <div class="exp-f">Battery capacity = usable ÷ depth of discharge = ${f0(r.battUsable)} ÷ ${f2(r.dod)} = ${f0(r.battNominal)} Wh</div>
      <div class="kv"><span>Buy about</span><b class="gold">${f0(r.battNominalRound)} Wh</b></div>
      <div class="kv"><span>Same thing at 12 V nominal</span><span>about ${f0(r.battAh12)} Ah</span></div>
      <p class="xs dim">Depth of discharge ${f0(r.dod * 100)}% is typical for lithium iron phosphate; check your battery's spec. Autonomy days = days you can run with no useful sun.</p></div>`;
    h += `<div class="card"><div class="ct"><span>Inverter</span></div>` + (r.acCount ? `
      <div class="kv"><span>Largest load running at once</span><b>${f0(r.peakRun)} W</b></div>
      <div class="kv"><span>Suggested continuous rating</span><b class="gold">${f0(r.invRec)} W or more</b></div>
      <div class="kv"><span>Estimated start-up surge</span><b>${f0(r.surgePeak)} W</b></div>
      <p class="xs dim">Continuous rating = largest simultaneous load × 1.25 for headroom, rounded up to 50 W. Motors (freezer, pumps, tools) pull a short surge when they start, often several times their running watts; the inverter's surge rating must cover it. Tick or untick "runs at the same time" on each row to match how you really use things.</p>` :
      `<p class="sm dim">No row is marked as needing an inverter (120 V AC). If everything runs on 12 V or USB ports you do not need one.</p>`) + `</div>`;
    h += stationHTML(r);
    return h;
  }

  function stationHTML(r) {
    const c = cur(), s = r.station;
    const inputs = `<div class="three"><label class="fl">Capacity (Wh)<input class="in" type="number" inputmode="decimal" min="0" step="any" data-bind="ex.power.cur.ps.wh" data-then="pwCalc" value="${esc(c.ps.wh == null ? '' : c.ps.wh)}"></label>
      <label class="fl">Max output (W)<input class="in" type="number" inputmode="decimal" min="0" step="any" data-bind="ex.power.cur.ps.out" data-then="pwCalc" value="${esc(c.ps.out == null ? '' : c.ps.out)}"></label>
      <label class="fl">Solar in (W)<input class="in" type="number" inputmode="decimal" min="0" step="any" data-bind="ex.power.cur.ps.solar" data-then="pwCalc" value="${esc(c.ps.solar == null ? '' : c.ps.solar)}"></label></div>
      <label class="fl">Panels you own or plan to buy (W, optional)<input class="in" type="number" inputmode="decimal" min="0" step="any" data-bind="ex.power.cur.panelW" data-then="pwCalc" value="${esc(c.panelW == null ? '' : c.panelW)}" placeholder="blank = use the size above"></label>`;
    let h = `<div class="card"><div class="ct"><span>Portable power station check</span></div>
      <p class="sm dim">Type the three numbers from the label or spec sheet of the portable power station you have or are considering. The check uses your lowest sun-hours entry (worst case).</p>`;
    h += `<div id="pw-st-in">${inputs}</div><div id="pw-st-out">`;
    if (!s) { h += `<p class="sm dim">Enter the numbers above to see a plain-language verdict.</p>`; }
    else {
      const lines = [], fix = [];
      s.checks.forEach(k => {
        if (k.id === 'energy') {
          lines.push(`<li>${k.ok ? '<span class="green">Enough battery.</span>' : '<span class="red">Not enough battery.</span>'} It gives about ${f0(k.usable)} Wh usable (capacity × ${f2(r.dod)}); ${f1(r.days)} days of use needs ${f0(k.need)} Wh.</li>`);
          if (!k.ok) fix.push(`Cut daily use to about ${f0(k.maxWh)} Wh or less, plan for ${Math.max(0, Math.floor((k.maxDays || 0) * 10) / 10)} autonomy days instead of ${f1(r.days)}, or add a second battery of at least ${f0((k.need - k.usable) / r.dod)} Wh.`);
        } else if (k.id === 'out') {
          if (!r.acCount) lines.push(`<li><span class="green">No inverter loads,</span> so output power is not a limit.</li>`);
          else {
            lines.push(`<li>${k.ok ? '<span class="green">Output is enough</span>' : '<span class="red">Output is too small</span>'} for your biggest simultaneous load: ${f0(k.peak)} W against a ${f0(k.out)} W limit.${k.ok && k.surgeRisk ? ' <span class="warn">Start-up surge (about ' + f0(k.surge) + ' W) may be above its surge rating: check the spec sheet.</span>' : ''}</li>`);
            if (!k.ok) fix.push(`Do not run ${f0(k.peak)} W at once on this unit: untick "runs at the same time" on rows you will stagger, or choose a unit with a higher output rating.`);
          }
        } else if (k.id === 'solar') {
          lines.push(`<li>${k.ok ? '<span class="green">Solar input can refill it.</span>' : '<span class="red">Solar input falls short.</span>'} ${f0(k.effW)} W of panels${k.capped ? ' (the station only accepts ' + f0(k.stSolar) + ' W of the ' + f0(k.wantPanel) + ' W wanted)' : ''} on a ${f1(k.sun)} sun-hour day makes about ${f0(k.harvest)} Wh against ${f0(k.need)} Wh used.</li>`);
          if (!k.ok) fix.push((k.capped || k.needPanel > k.stSolar) ? `The station's solar input limit (${f0(k.stSolar)} W) caps harvest near ${f0(k.maxLoad)} Wh per worst-case day. Cut daily use to that, add a second charge source, or choose a unit that accepts more solar.` : `Add panels: about ${f0(k.needPanel)} W in total (your ${f0(k.effW)} W is too small for the worst-case sun), still within the station's ${f0(k.stSolar)} W input limit.`);
        }
      });
      const head = { ok: ['ok', 'This unit covers the plan on paper'], warn: ['', 'This unit covers part of the plan'], bad: ['danger', 'This unit does not cover the plan'] }[s.level];
      h += `<div class="alert ${head[0]}"><b class="t">${head[1]}</b><ul class="ls">${lines.join('')}</ul>${s.partial ? '<p class="xs dim">Some numbers are blank, so only part of the check ran.</p>' : ''}</div>`;
      if (fix.length) h += `<div class="card inner"><b>What to change</b><ul class="ls">${fix.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
      h += `<p class="xs dim">Paper check only. Real output is lower in cold and shade, and labelled capacity is not all usable.</p>`;
    }
    return h + '</div></div>';
  }

  /* ---------- live updates (no re-render so typing focus is kept) ---------- */
  function live() {
    const r = EXP.calc(cur());
    const o = document.getElementById('pw-res'); if (o) o.innerHTML = resHTML(r);
    document.querySelectorAll('.pw-wh').forEach(s => { const l = cur().loads[+s.dataset.i]; if (l) s.textContent = f0(loadWh(l)) + ' Wh/day'; });
    const t = document.getElementById('pw-total'); if (t) t.textContent = f0(r.whDay) + ' Wh/day';
  }

  /* ---------- sections ---------- */
  function loadRow(l, i) {
    const b = k => `ex.power.cur.loads.${i}.${k}`;
    const val = k => esc(l[k] == null ? '' : l[k]);
    const rng = l.lo != null && l.hi != null ? `typical ${esc(l.lo)}-${esc(l.hi)} W` : '';
    return `<div class="card inner"><div class="exp-load"><input class="in" data-bind="${b('n')}" value="${esc(l.n)}" aria-label="Appliance name" maxlength="60"><button class="mini exp-x" data-act="pwDel" data-i="${i}" aria-label="Remove ${esc(l.n)}">${OA.icon('trash')}</button></div>
      <div class="three"><label class="fl">Watts each<input class="in" type="number" inputmode="decimal" min="0" step="any" data-bind="${b('w')}" data-then="pwCalc" value="${val('w')}"></label>
      <label class="fl">Quantity<input class="in" type="number" inputmode="decimal" min="0" step="any" data-bind="${b('q')}" data-then="pwCalc" value="${val('q')}"></label>
      <label class="fl">Hours a day<input class="in" type="number" inputmode="decimal" min="0" max="24" step="any" data-bind="${b('h')}" data-then="pwCalc" value="${val('h')}"></label></div>
      <div class="exp-chk"><label class="exp-ck"><input type="checkbox" data-bind="${b('ac')}" data-then="pwCalc" ${l.ac ? 'checked' : ''}> Needs inverter (120 V)</label>
      <label class="exp-ck"><input type="checkbox" data-bind="${b('sim')}" data-then="pwCalc" ${l.sim ? 'checked' : ''}> Runs at the same time</label></div>
      <div class="row between mid"><span class="xs dim">${rng}${rng ? ' · ' : ''}read your label</span><span class="exp-wh pw-wh" data-i="${i}">${f0(loadWh(l))} Wh/day</span></div></div>`;
  }

  function loadsHTML() {
    const c = cur(), tot = EXP.calc(c).whDay;
    const rows = c.loads.length ? c.loads.map(loadRow).join('') : `<div class="exp-empty center"><p class="dim">No appliances yet. Add a few from the list, or load the weekend-cabin example below and edit it.</p></div>`;
    return `<div class="card"><div class="ct"><span>${OA.icon('bolt')} Loads</span><span class="exp-wh" id="pw-total">${f0(tot)} Wh/day</span></div>
      <p class="sm dim">Every number is editable. The starting values are <b>typical ranges, not facts about your device: read the label</b> (watts, or volts × amps). For a fridge or freezer, enter hours the compressor actually runs, not 24.</p>
      ${rows}
      <div class="row"><button class="btn gold" data-act="pwPresets" data-smoke>Add appliance</button><button class="btn" data-act="pwCustom">Add custom</button></div></div>`;
  }

  function sunHTML() {
    const c = cur(), d = D();
    const st = c.state && d.sunStates[c.state];
    const stOpts = '<option value="">Choose a state (optional)</option>' + (window.EX && EX.states ? EX.states : Object.keys(d.sunStates)).map(s => `<option value="${esc(s)}" ${c.state === s ? 'selected' : ''}>${esc(s)}</option>`).join('');
    const wOpts = '<option value="">Winter examples (optional)</option>' + d.winterCities.map(w => `<option value="${esc(w.n)}" ${c.winterCity === w.n ? 'selected' : ''}>${esc(w.n)}: ${esc(w.v)} h</option>`).join('');
    const info = c.state ? (st ? `<div class="card inner"><b>${esc(c.state)} (rough guide)</b><div class="kv"><span>Yearly average</span><span>${f2(st[0])} sun h/day</span></div><div class="kv"><span>Best month (${esc(st[1])})</span><span>${f2(st[2])} sun h/day</span></div>
        <button class="mini" data-act="pwSummer" data-v="${esc(st[2])}">Use ${f2(st[2])} for summer</button>
        <p class="xs dim">${esc(d.sunStatesSrc.kind)}. Source: <a href="${esc(d.sunStatesSrc.url)}" target="_blank" rel="noopener">${esc(d.sunStatesSrc.cites)} via a summary page</a>, as of ${esc(d.sunStatesSrc.asof)}. Winter value for this state was not verified: use the examples or the official calculator.</p></div>` : `<p class="sm dim">No value for ${esc(c.state)}: check with the official calculator.</p>`) : '';
    return `<div class="card"><div class="ct"><span>${OA.icon('sun')} Sun hours</span></div>
      <p class="sm dim">"Sun hours" = hours a day of full-strength sun equivalent (1,000 W per square meter). It is far lower in winter. Design for the <b>worst month you will use the cabin</b>.</p>
      <div class="two"><label class="fl">Winter / worst month (h)<input class="in" type="number" inputmode="decimal" min="0" step="any" data-bind="ex.power.cur.sunW" data-then="pwCalc" value="${esc(c.sunW == null ? '' : c.sunW)}"></label>
      <label class="fl">Summer (h)<input class="in" type="number" inputmode="decimal" min="0" step="any" data-bind="ex.power.cur.sunS" data-then="pwCalc" value="${esc(c.sunS == null ? '' : c.sunS)}"></label></div>
      <p class="xs dim">Starting values (2 and 5) are cautious placeholders I picked, not data for your parcel.</p>
      <div class="two"><label class="fl">State<select class="in" data-bind="ex.power.cur.state" data-then="pwState">${stOpts}</select></label>
      <label class="fl">December example<select class="in" data-bind="ex.power.cur.winterCity" data-then="pwWinter">${wOpts}</select></label></div>
      ${info}
      <p class="xs dim">December examples (${esc(d.winterSrc.asof)}, tilt not stated) come from the same secondary page; they show how big the winter drop is in the north. Get a site number from the official <a href="${esc(d.official[0].url)}" target="_blank" rel="noopener">NREL PVWatts calculator</a> (needs signal) and enter it here.</p></div>`;
  }

  function settingsHTML() {
    const c = cur();
    return `<div class="card"><div class="ct"><span>Sizing settings</span></div><div class="three">
      <label class="fl">Efficiency %<input class="in" type="number" inputmode="decimal" min="10" max="100" step="any" data-bind="ex.power.cur.eff" data-then="pwCalc" value="${esc(c.eff == null ? '' : c.eff)}"></label>
      <label class="fl">Autonomy days<input class="in" type="number" inputmode="decimal" min="0" step="any" data-bind="ex.power.cur.days" data-then="pwCalc" value="${esc(c.days == null ? '' : c.days)}"></label>
      <label class="fl">Discharge depth %<input class="in" type="number" inputmode="decimal" min="10" max="100" step="any" data-bind="ex.power.cur.dod" data-then="pwCalc" value="${esc(c.dod == null ? '' : c.dod)}"></label></div>
      <p class="xs dim">Efficiency 70% = cautious rule of thumb for all losses. Autonomy = cloudy days in a row you want to cover. Depth of discharge 80% is typical for lithium iron phosphate (${esc(D().lfp.dod)}%); lead-acid is usually 50% or less. Check your battery spec.</p></div>`;
  }

  function det(title, body, open) { return `<details class="exp-det" ${open ? 'open' : ''}><summary>${esc(title)}</summary><div class="sm">${body}</div></details>`; }

  function tipsHTML() {
    const c = cur(), d = D();
    let lat = c.lat; const p = pickedParcel();
    if (lat == null && p && window.EX && EX.hasPos(p)) lat = p.lat;
    const t = lat != null ? EXP.tilt(lat) : null;
    const tiltOut = t ? `Latitude ${f1(Math.abs(lat))}°: about <b>${t.year}°</b> all year, <b>${t.winter}°</b> if you tilt for winter, <b>${t.summer}°</b> for summer.` : 'Enter a latitude to see the angles.';
    const tilt = `<label class="fl">Latitude of the parcel (degrees north)<input class="in" type="number" inputmode="decimal" step="any" min="0" max="90" data-bind="ex.power.cur.lat" data-then="pwTilt" value="${esc(lat == null ? '' : Math.round(lat * 100) / 100)}"></label>
      <p id="pw-tilt" class="sm">${tiltOut}</p>
      <ul class="ls"><li>Face panels true south (not magnetic south; in the US the difference can be 10 to 20 degrees, so check a compass app for declination).</li>
      <li>Rule of thumb: tilt about equal to your latitude for year-round use; add about ${esc(d.tilt.winterAdd)}° for a winter-heavy plan, subtract about ${esc(d.tilt.summerSub)}° for summer-only use (<a href="${esc(d.tilt.src)}" target="_blank" rel="noopener">source</a>, ${esc(d.tilt.asof)}). A steeper winter tilt also helps snow slide off.</li>
      <li>Keep at least a few degrees of tilt so rain washes off dust. Brush snow off gently with a soft tool, never chip ice.</li></ul>`;
    const place = `<ul class="ls"><li><b>Shade is the big killer.</b> Even a small shadow on one cell can cut a panel's output sharply. Check the spot at 9 am, noon and 3 pm, and in winter when the sun is low and shadows are long.</li>
      <li><b>Ground mount</b> is easier to tilt, clean and move toward the sun, keeps wiring away from the roof, and is kinder for small panels. Keep it clear of snow drifts and standing water.</li>
      <li><b>Roof mount</b> saves space but needs correct flashing and a structure that carries snow and wind. A licensed pro should assess it.</li>
      <li><b>Secure it.</b> Wind lifts panels like sails. Use rated mounting hardware, anchor it to the ground or structure, and lock it or hide it if it can be stolen. Do not lean loose panels against a wall.</li>
      <li>Keep panels away from the firepit smoke and sparks, and away from branches that rub or drop things on them.</li></ul>`;
    const wire = `<div class="alert danger"><b class="t">Licensed electrician required</b>A licensed electrician must do any wiring to a building and any battery bank beyond a plug-in portable power station. Permit and code rules differ by state and county: use your jurisdiction's rules and ask the county building department.</div>
      <ul class="ls"><li>Plug-in panels to a portable power station need no building wiring, but still follow the maker's manual.</li>
      <li>Wire gets hot if it is too thin for the current. Use cable rated for the amps and the length, keep runs short, and use outdoor (sunlight-resistant) rated cable for panels.</li>
      <li>Put a correctly rated fuse or breaker close to every battery, on the positive side. Never bypass a fuse, and never swap in a bigger one to stop it blowing; find out why it blew.</li>
      <li>Panel voltage rises in the cold. Check that the panels' open-circuit voltage at low temperature stays under the station's or controller's max input volts, or it can be damaged.</li>
      <li>Use matching connectors that click fully together. Mixed brands can overheat. Protect cable from rubbing and from being stepped on, and tie it so it does not hang on plugs.</li>
      <li>Never touch bare terminals with metal tools or jewelry (short circuit). Solar panels make power in daylight even when everything else is switched off.</li>
      <li>Never run a petrol or propane generator indoors or in a closed space: carbon monoxide kills. Fit a carbon monoxide alarm and a smoke alarm in the cabin.</li></ul>`;
    const li = `<ul class="ls"><li><b>Never charge indoors on soft surfaces</b> (bed, couch, carpet, clothes, cardboard). Charge on a hard, non-flammable surface with air around it, away from flammables, and not where you sleep.</li>
      <li>Do not charge unattended for long periods when you can help it, and keep a smoke alarm working nearby.</li>
      <li><b>Cold:</b> do not charge lithium iron phosphate batteries below 0 °C (32 °F) unless the maker says the unit is rated and heated for it. Charging when frozen can permanently damage the cells (<a href="https://www.redarcelectronics.com/us/resources/chargers-isolators-faqs/do-not-charge-lithium-battery-below-32-degrees/" target="_blank" rel="noopener">source</a>). Let it warm up, keep it in a warmer spot, or use a model with a battery-temperature display or low-temperature charge protection.</li>
      <li><b>Heat:</b> do not leave it in a hot car or in direct sun, and do not cover it while it is working.</li>
      <li>Stop using and move it outdoors if it is swollen, very hot, smells sweet or sharp, hisses, or is dented or wet. If it smokes or burns, leave, call emergency services, and do not use water-spray myths or reach for it.</li>
      <li>Use only the charger and cables made for it. Do not open it, crush it, or puncture it. Recycle damaged units at a battery drop-off; never put them in the trash.</li>
      <li>For long storage, follow the maker's advice (often a partial charge in a cool, dry place) and top it up now and then.</li></ul>`;
    return `<div class="card"><div class="ct"><span>${OA.icon('tool')} Placement and safety</span></div>
      ${det('Panel angle and direction', tilt)}${det('Where to put the panels', place)}${det('Cables, fuses and wiring safety', wire)}${det('Lithium battery safety', li)}</div>`;
  }

  function pickedParcel() { try { const id = cur().parcelId; return id && window.EX && EX.parcels ? EX.parcels.get(id) : null; } catch (e) { return null; } }

  function saveHTML() {
    const p = P(), c = p.cur;
    let list = []; try { list = (window.EX && EX.parcels) ? EX.parcels.list() : []; } catch (e) { }
    const pOpts = '<option value="">No parcel</option>' + list.map(x => `<option value="${esc(x.id)}" ${c.parcelId === x.id ? 'selected' : ''}>${esc(x.name)}${x.state ? ' (' + esc(x.state) + ')' : ''}</option>`).join('');
    const sel = pickedParcel();
    const has = sel && sel.cabin && sel.cabin.power;
    return `<div class="card"><div class="ct"><span>Save and share</span></div>
      <label class="fl">Plan name<input class="in" data-bind="ex.power.cur.name" maxlength="60" value="${esc(c.name)}"></label>
      <div class="row"><button class="btn gold" data-act="pwSave">Save plan</button><button class="btn" data-act="pwPlans" data-smoke>My plans (${p.plans.length})</button></div>
      <label class="fl" style="margin-top:12px">Attach a summary to a parcel<select class="in" data-bind="ex.power.cur.parcelId" data-then="pwParcel">${pOpts}</select></label>
      ${list.length ? '' : '<p class="xs dim">Add a parcel in the Land tab to attach this plan to it.</p>'}
      ${sel ? `<button class="btn block" data-act="pwAttach">Attach summary to ${esc(sel.name)}</button>${has ? `<p class="xs dim">Already attached ${esc(OA.ago(sel.cabin.power.saved || 0))}; attaching again replaces it.</p>` : ''}` : ''}
      <div class="row"><button class="btn danger" data-act="pwNew">Start a new plan</button></div></div>`;
  }

  /* ---------- worked example ---------- */
  const exLoads = () => [
    { n: 'LED lights', w: 8, q: 4, h: 4, ac: false, sim: true, surge: 1, lo: 4, hi: 12 },
    { n: 'Phone charging', w: 10, q: 2, h: 2, ac: false, sim: false, surge: 1, lo: 5, hi: 20 },
    { n: 'Laptop charging', w: 50, q: 1, h: 2, ac: false, sim: false, surge: 1, lo: 30, hi: 90 },
    { n: 'Small 12 V fan', w: 15, q: 1, h: 4, ac: false, sim: false, surge: 1, lo: 8, hi: 30 },
    { n: 'Router or hotspot', w: 12, q: 1, h: 6, ac: false, sim: true, surge: 1, lo: 5, hi: 20 }
  ];
  const exPlan = () => ({ loads: exLoads(), sunW: 3, sunS: 5, eff: 70, days: 2, dod: 80, ps: {} });
  EXP.example = exPlan;
  function exampleHTML() {
    const e = exPlan(), r = EXP.calc(e);
    const fr = EXP.calc(Object.assign(exPlan(), { loads: exLoads().concat([{ n: 'f', w: 45, q: 1, h: 9, ac: false, sim: true, surge: 1 }]) }));
    return `<div class="card tip"><div class="ct"><span>Worked example: weekend cabin</span></div>
      <p class="sm">A cabin used two or three days at a time: 4 LED bulbs for 4 h, 2 phones, a laptop for 2 h, a small 12 V fan for 4 h and a hotspot for 6 h. Sun hours in the example are made-up round numbers (3 in the worst month, 5 in summer), not your site.</p>
      <div class="kv"><span>Daily use</span><b>${f0(r.whDay)} Wh</b></div>
      <div class="exp-f">${f0(r.whDay)} ÷ (3 × 0.7) = ${f0(r.panelWinter)} W, so about ${f0(r.panelWinterRound)} W of panels in the worst month</div>
      <div class="exp-f">${f0(r.whDay)} × 2 days ÷ 0.8 = ${f0(r.battNominal)} Wh of battery</div>
      <p class="sm">No inverter is needed (everything is 12 V or USB). A typical portable power station of about ${f0(ceilTo(r.battNominal, 100))} Wh with 200 W or more of solar input would cover it on paper. Adding a 12 V fridge (+405 Wh a day) takes it to ${f0(fr.whDay)} Wh and about ${f0(fr.panelWinterRound)} W of panels, which shows why the fridge is the biggest decision.</p>
      <button class="btn block" data-act="pwExample">Load this example into the planner</button></div>`;
  }

  function frontHTML() {
    return `<div class="card hot"><div class="ct"><span>Read first</span></div><p class="sm">This planner gives estimates to help you ask better questions. It is not electrical, engineering or legal advice. Wattages are typical ranges, not facts about your devices. A licensed electrician must do any wiring to a building or any battery bank beyond a plug-in portable power station, and local rules decide what is allowed. Official tools: <a href="${esc(D().official[0].url)}" target="_blank" rel="noopener">NREL PVWatts</a>.</p></div>`;
  }

  function render() {
    css(); P();
    const r = EXP.calc(cur());
    return `${OA.header('Power', 'Off-grid power for a small cabin')}${frontHTML()}${loadsHTML()}${sunHTML()}${settingsHTML()}<div id="pw-res">${resHTML(r)}</div>${tipsHTML()}${saveHTML()}${exampleHTML()}`;
  }

  OA.tab({ id: 'power', label: 'Power', icon: 'bolt', order: 3, render: () => render() });

  /* ---------- actions ---------- */
  function addLoad(o) { cur().loads.push({ n: o.name || o.n || 'Appliance', w: o.w == null ? null : o.w, q: o.q == null ? 1 : o.q, h: o.h == null ? null : o.h, ac: !!o.ac, sim: !!o.sim, surge: o.surge || 1, lo: o.lo == null ? null : o.lo, hi: o.hi == null ? null : o.hi }); OA.save(); }
  function planSummary() {
    const c = cur(), r = EXP.calc(c);
    const st = r.station;
    return { name: c.name || 'Power plan', saved: Date.now(), whDay: Math.round(r.whDay), sunWinter: r.sunW, sunSummer: r.sunS, panelWinterW: r.panelWinterRound, panelSummerW: r.panelSummerRound, batteryWh: r.whDay ? r.battNominalRound : null, autonomyDays: r.days, dodPct: Math.round(r.dod * 100), inverterW: r.acCount ? r.invRec : null, station: (c.ps && (c.ps.wh || c.ps.out || c.ps.solar)) ? { wh: c.ps.wh, out: c.ps.out, solar: c.ps.solar, verdict: st ? st.level : 'none' } : null, note: 'Planning estimate, not engineering advice' };
  }
  OA.act({
    pwCalc() { live(); },
    pwState(el) { OA.render(true); },
    pwWinter(el) { const w = D().winterCities.find(x => x.n === el.value); if (w) { cur().sunW = w.v; OA.save(); } OA.render(true); },
    pwSummer(el) { const v = parseFloat(el.dataset.v); if (isFinite(v)) { cur().sunS = v; OA.save(); OA.render(true); } },
    pwTilt() { const o = document.getElementById('pw-tilt'); const lat = cur().lat; if (!o) return; if (lat == null) { o.textContent = 'Enter a latitude to see the angles.'; return; } const t = EXP.tilt(lat); o.innerHTML = `Latitude ${f1(Math.abs(lat))}°: about <b>${t.year}°</b> all year, <b>${t.winter}°</b> if you tilt for winter, <b>${t.summer}°</b> for summer.`; },
    pwParcel() { const p = pickedParcel(); if (p && window.EX && EX.hasPos(p) && cur().lat == null) cur().lat = Math.round(p.lat * 100) / 100; OA.save(); OA.render(true); },
    pwDel(el) { const i = +el.dataset.i; cur().loads.splice(i, 1); OA.save(); OA.render(true); },
    pwCustom() { addLoad({ name: 'My appliance', q: 1, w: null, h: null }); OA.render(true); },
    pwPresets() {
      const d = D();
      const rows = d.presets.map(p => `<div class="li"><div class="tx"><b>${esc(p.name)}</b><span>Typical ${esc(p.lo)}-${esc(p.hi)} W; start at ${esc(p.w)} W × ${esc(p.h)} h. ${p.v ? 'Range seen in a university extension table.' : 'Generic typical range.'} Read your label.</span><span>${esc(p.note)}</span></div><div class="end"><button class="mini" data-act="pwAddPreset" data-id="${esc(p.id)}">Add</button></div></div>`).join('');
      OA.sheet('Add appliances', `<p class="sm dim">These are typical ranges, not facts about your device. After adding, edit watts and hours to match the label. Source for rows marked as seen in a table: <a href="${esc(d.vt.url)}" target="_blank" rel="noopener">${esc(d.vt.n)}</a>, ${esc(d.vt.asof)}.</p>${rows}`);
    },
    pwAddPreset(el) { const p = D().presets.find(x => x.id === el.dataset.id); if (!p) return; addLoad(p); OA.toast(p.name + ' added'); },
    pwSave() { const P0 = P(), c = P0.cur; c.name = (c.name || '').trim() || ('Plan ' + (P0.plans.length + 1)); const copy = JSON.parse(JSON.stringify(c)); let ex = c.id && P0.plans.find(x => x.id === c.id);
      if (ex) { ex.name = c.name; ex.ts = Date.now(); ex.plan = copy; } else { c.id = OA.uid(); copy.id = c.id; P0.plans.unshift({ id: c.id, name: c.name, ts: Date.now(), plan: copy }); }
      OA.save(); OA.toast('Plan saved'); OA.render(true); },
    pwPlans() {
      const pl = P().plans;
      const rows = pl.length ? pl.map(x => { const r = EXP.calc(x.plan); return `<div class="li"><div class="tx"><b>${esc(x.name)}</b><span>${f0(r.whDay)} Wh/day · ${r.panelWinterRound ? f0(r.panelWinterRound) + ' W panels (winter)' : 'sun hours not set'} · saved ${esc(OA.ago(x.ts))}</span></div><div class="end"><button class="mini" data-act="pwOpen" data-id="${esc(x.id)}">Open</button> <button class="mini" data-act="pwRm" data-id="${esc(x.id)}" aria-label="Delete ${esc(x.name)}">${OA.icon('trash')}</button></div></div>`; }).join('') : '<p class="dim">No saved plans yet. Use "Save plan" on the Power screen.</p>';
      OA.sheet('My power plans', rows);
    },
    pwOpen(el) { const x = P().plans.find(y => y.id === el.dataset.id); if (!x) return; P().cur = JSON.parse(JSON.stringify(x.plan)); P().cur.id = x.id; OA.save(); OA.closeAllSheets(); OA.render(); window.scrollTo(0, 0); },
    async pwRm(el) { if (!await OA.confirm('Delete this saved plan?', 'Delete')) return; const P0 = P(); P0.plans = P0.plans.filter(y => y.id !== el.dataset.id); if (P0.cur.id === el.dataset.id) P0.cur.id = null; OA.save(); OA.closeSheet(); OA.acts.pwPlans(); },
    async pwNew() { if (cur().loads.length && !await OA.confirm('Start a new plan? Unsaved changes to this one will be lost.', 'Start new')) return; P().cur = blank(); OA.save(); OA.render(); window.scrollTo(0, 0); },
    async pwExample() { if (cur().loads.length && !await OA.confirm('Replace the current loads with the example?', 'Replace')) return; const e = exPlan(); const c = cur(); Object.assign(c, { loads: e.loads, sunW: e.sunW, sunS: e.sunS, eff: e.eff, days: e.days, dod: e.dod, name: 'Weekend cabin example', id: null }); OA.save(); OA.render(); window.scrollTo(0, 0); },
    pwAttach() {
      const p = pickedParcel(); if (!p) { OA.toast('Choose a parcel first'); return; }
      const r = EXP.calc(cur()); if (!r.whDay) { OA.toast('Add some appliances first'); return; }
      EX.parcels.update(p.id, { cabin: Object.assign({}, p.cabin || {}, { power: planSummary() }) });
      OA.toast('Summary attached to ' + p.name); OA.render(true);
    }
  });
})();
