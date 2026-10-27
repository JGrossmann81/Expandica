/* Expandica power planner data. Plain script: sets window.EXP_DATA.
   Honesty notes: appliance watts marked v:true were read in a university extension table (see SOURCES-power.md); the rest are generic typical ranges that must be checked against the device label (v:false).
   Sun-hour numbers come from ONE secondary page that cites NREL PVWatts v8 / NSRDB (the NREL sites were not reachable when this was built), so they are rough planning numbers, not site data. */
window.EXP_DATA = {
  asof: '2026-10',
  formulaNote: 'Panel watts = daily watt-hours / (sun hours x system efficiency). 0.7 is a cautious rule of thumb that covers wiring, charge controller, battery and inverter losses, dirt and heat. It is not a measured value for your system.',
  /* editable starting loads. w = watts while ON (typical), lo..hi = typical range, h = hours per day the load is actually drawing power
     (for a fridge or freezer use compressor-running hours, not 24), q = quantity, ac = needs an inverter (120 V), sim = tends to run at the same time as other loads, surge = starting-surge multiple for motors */
  presets: [
    { id: 'led', name: 'LED lights (each bulb)', w: 8, lo: 4, hi: 12, h: 5, q: 4, ac: false, sim: true, surge: 1, v: false, note: 'Typical LED bulb. A 12 V LED strip or lantern is often lower.' },
    { id: 'phone', name: 'Phone charging (each)', w: 10, lo: 5, hi: 20, h: 2, q: 2, ac: false, sim: false, surge: 1, v: false, note: 'Fast chargers draw more while charging.' },
    { id: 'laptop', name: 'Laptop charging', w: 50, lo: 30, hi: 90, h: 4, q: 1, ac: false, sim: false, surge: 1, v: true, src: 'vt', note: 'A university extension table lists about 50 W for a laptop. Read the charger label.' },
    { id: 'fridge12', name: '12 V compressor fridge', w: 45, lo: 35, hi: 65, h: 9, q: 1, ac: false, sim: true, surge: 1, v: false, note: 'Watts while the compressor runs; it cycles, so about 8 to 10 hours of running a day is common in mild weather and more in heat. The spec sheet may give amp-hours per 24 h (multiply by 12 for Wh).' },
    { id: 'freezer', name: 'Small chest freezer (AC)', w: 80, lo: 50, hi: 120, h: 8, q: 1, ac: true, sim: true, surge: 4, v: false, note: 'Running watts. The compressor starts with a surge of several times its running watts. Label or energy guide shows kWh per year (divide by 365 for kWh per day).' },
    { id: 'pump12', name: 'Water pressure pump (12 V)', w: 50, lo: 30, hi: 80, h: 0.5, q: 1, ac: false, sim: false, surge: 1, v: false, note: 'Runs only while water is flowing.' },
    { id: 'pumpwell', name: 'Well or deep pump (AC)', w: 750, lo: 250, hi: 1100, h: 0.5, q: 1, ac: true, sim: false, surge: 3, v: true, src: 'vt', note: 'Extension table range for a deep-well pump is 250 to 1100 W. A big start-up surge: check the pump label.' },
    { id: 'fan12', name: 'Small 12 V fan', w: 15, lo: 8, hi: 30, h: 6, q: 1, ac: false, sim: false, surge: 1, v: false, note: 'Small desk or tent fan.' },
    { id: 'fanwin', name: 'Window or box fan (AC)', w: 100, lo: 55, hi: 250, h: 6, q: 1, ac: true, sim: false, surge: 2, v: true, src: 'vt', note: 'Extension table range 55 to 250 W for a window fan.' },
    { id: 'cpap', name: 'CPAP machine', w: 50, lo: 30, hi: 90, h: 8, q: 1, ac: false, sim: true, surge: 1, v: false, note: 'Typical range only. A heated humidifier or heated hose can raise it a lot. READ YOUR DEVICE LABEL and manual. If this is medical equipment, plan extra battery reserve and a backup plan; do not depend on solar alone.' },
    { id: 'router', name: 'Router or cell hotspot', w: 12, lo: 5, hi: 20, h: 24, q: 1, ac: false, sim: true, surge: 1, v: false, note: 'Always on unless you switch it off at night.' },
    { id: 'tv', name: 'Small TV (AC)', w: 60, lo: 30, hi: 130, h: 2, q: 1, ac: true, sim: false, surge: 1, v: false, note: 'The extension table lists older sets at 65 to 133 W; many small modern LED TVs use less. Read the label.' },
    { id: 'blanket', name: 'Electric blanket (AC)', w: 60, lo: 60, hi: 100, h: 4, q: 1, ac: true, sim: false, surge: 1, v: true, src: 'vt', note: 'Extension table: about 60 W single, 100 W double. Thermostat cycling lowers real use. Use only as the maker directs; never leave on unattended.' },
    { id: 'tools', name: 'Corded power tool, occasional (AC)', w: 1200, lo: 400, hi: 1800, h: 0.25, q: 1, ac: true, sim: false, surge: 2.5, v: false, note: 'A circular saw or similar often needs more than a small inverter or portable power station can supply. Battery-powered tools charged from the system are easier.' },
    { id: 'heater', name: 'Electric heater or kettle (AC)', w: 1500, lo: 750, hi: 1800, h: 0.1, q: 1, ac: true, sim: false, surge: 1, v: true, src: 'vt', note: 'Heating loads (portable heater 750 to 1500 W per the extension table, kettle 1500 W on a DOE example) use huge amounts of energy. Small solar systems are the wrong tool for heat; use wood, propane or a stove designed for the cabin.' }
  ],
  /* Annual average and best-month "peak sun hours" per day (kWh/m2/day) at ONE representative city per state, fixed ~20 degree tilt, from a secondary page citing NREL PVWatts v8 (NSRDB 1998-2024). Not winter. */
  sunStates: {
    AZ: [6.54, 'June', 8.18], NM: [6.42, 'June', 8.07], NV: [6.41, 'June', 8.23], CA: [6.08, 'August', 7.61], HI: [5.82, 'September', 6.55],
    CO: [5.66, 'June', 7.24], OK: [5.50, 'June', 7.25], FL: [5.48, 'May', 6.60], KS: [5.39, 'June', 7.02], UT: [5.39, 'June', 7.77],
    WY: [5.36, 'June', 7.30], SC: [5.33, 'May', 6.57], LA: [5.32, 'May', 6.46], MS: [5.26, 'June', 6.47], NC: [5.25, 'June', 6.63],
    ID: [5.22, 'July', 7.97], TX: [5.22, 'July', 6.31], AL: [5.21, 'May', 6.57], AR: [5.18, 'June', 6.77], GA: [5.17, 'June', 6.63],
    MO: [5.03, 'July', 6.65], VA: [5.01, 'June', 6.48], NE: [4.98, 'June', 6.90], MD: [4.88, 'July', 6.53], SD: [4.86, 'July', 7.13],
    TN: [4.82, 'July', 6.18], DE: [4.80, 'July', 6.37], KY: [4.79, 'June', 6.39], PA: [4.79, 'July', 6.39], MT: [4.76, 'July', 7.44],
    IA: [4.75, 'June', 6.66], MA: [4.70, 'July', 6.46], RI: [4.70, 'July', 6.30], IN: [4.66, 'June', 6.48], NJ: [4.66, 'June', 6.32],
    MN: [4.61, 'July', 6.83], NH: [4.58, 'July', 6.22], WI: [4.58, 'July', 6.71], WV: [4.57, 'June', 6.54], ME: [4.55, 'July', 6.13],
    OH: [4.54, 'June', 6.34], CT: [4.53, 'July', 6.35], IL: [4.51, 'July', 6.77], NY: [4.50, 'July', 6.15], MI: [4.47, 'July', 6.60],
    ND: [4.45, 'July', 6.94], VT: [4.36, 'July', 6.12], OR: [4.06, 'July', 7.17], WA: [3.95, 'July', 6.37], AK: [3.17, 'June', 5.89]
  },
  sunStatesSrc: { url: 'https://thegreenwatt.com/average-peak-sun-hours-by-state/', asof: '2026-04', cites: 'NREL PVWatts v8 / NSRDB', kind: 'secondary; one city per state; the page has small internal inconsistencies; use as a rough guide only' },
  /* December (winter worst-case) examples for a few cities from the same page. Tilt not stated on the page. These are the only winter numbers that could be read. */
  winterCities: [
    { n: 'Phoenix, AZ', v: 4.75 }, { n: 'Los Angeles, CA', v: 4.05 }, { n: 'Austin, TX', v: 3.0 }, { n: 'Boston, MA', v: 2.33 },
    { n: 'Chicago, IL', v: 2.0 }, { n: 'Seattle, WA', v: 1.4 }, { n: 'Anchorage, AK', v: 0.39 }
  ],
  winterSrc: { url: 'https://thegreenwatt.com/average-peak-sun-hours-by-state/', asof: '2026-04' },
  official: [
    { n: 'NREL PVWatts calculator (free, by address)', url: 'https://pvwatts.nrel.gov/' },
    { n: 'NREL solar resource maps', url: 'https://www.nrel.gov/gis/solar-resource-maps.html' }
  ],
  tilt: { winterAdd: 15, summerSub: 15, src: 'https://sinovoltaics.com/learning-center/system-design/solar-panel-angle-tilt-calculation', asof: '2015-07' },
  lfp: { dod: 80, note: 'Typical for lithium iron phosphate (LiFePO4). Makers vary: check your battery or power station spec. Lead-acid batteries are usually planned at 50% or less.' },
  vt: { n: 'Virginia Cooperative Extension BSE-301NP, Estimating Appliance and Home Electronic Energy Use', url: 'https://www.pubs.ext.vt.edu/2901/2901-9014/2901-9014.html', asof: '2020-02' }
};
