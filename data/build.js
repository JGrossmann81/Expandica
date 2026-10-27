/* Expandica Build tab data. Own words. Typical guidance is flagged typ:true ("check local code"); verified facts carry src + asof.
   Nothing here is a code requirement for any place: codes, fire rules and permits vary by county, state and fire district. */
window.EXB_DATA = (function () {
  var ASOF = '2026-10';
  var L = {
    smokey: { id: 'smokey', label: 'Smokey Bear: build, maintain and put out a campfire', url: 'https://smokeybear.com/en/prevention-how-tos/campfire-safety/how-to-maintain-and-extinguish-your-campfire', who: 'US Forest Service / Ad Council', asof: ASOF, note: 'Plan ahead, spot and pit, maintain, drown-stir-drown-feel.' },
    nifc: { id: 'nifc', label: 'NIFC Fire Information: national situation, maps, outlooks', url: 'https://nifc.gov/fire-information', who: 'National Interagency Fire Center', asof: ASOF, note: 'Nationwide situation report, current large-fire maps, seasonal outlooks. It does not list local fire restrictions.' },
    inciweb: { id: 'inciweb', label: 'InciWeb: active wildfire incident pages', url: 'https://inciweb.wildfire.gov/', who: 'Interagency incident information', asof: ASOF, note: 'Named on the NIFC page as the most current source for active incidents. (My tool could not open the site itself.)', unread: true },
    nws: { id: 'nws', label: 'NWS: wildfire warnings and watches explained', url: 'https://www.weather.gov/safety/wildfire-ww', who: 'National Weather Service', asof: ASOF, note: 'A Red Flag Warning means critical fire weather is happening or about to. A Fire Weather Watch means it is possible soon.' },
    calfire: { id: 'calfire', label: 'CAL FIRE Ready for Wildfire: defensible space', url: 'https://www.readyforwildfire.org/prepare-for-wildfire/defensible-space', who: 'CAL FIRE (California)', asof: ASOF, note: 'California rules. Useful anywhere as a model, but the legal requirements are California-specific and local rules can be stricter.' },
    rsg: { id: 'rsg', label: 'Ready, Set, Go! wildfire action guide', url: 'https://iafc.org/topics-and-tools/resources/resource/rsg-action-guide', who: 'International Association of Fire Chiefs', asof: ASOF, note: 'Prepare early, stay aware when a fire starts, leave early when officials say so. Local fire departments hand it out.' },
    cdc: { id: 'cdc', label: 'CDC: carbon monoxide poisoning basics', url: 'https://www.cdc.gov/carbon-monoxide/about/index.html', who: 'CDC', asof: ASOF, note: 'Sources, symptoms and prevention. Updated Jan 2026 per the page.' },
    epa: { id: 'epa', label: 'EPA: septic systems, frequent questions', url: 'https://www.epa.gov/septic/frequent-questions-septic-systems', who: 'US EPA', asof: ASOF, note: 'Says single-home septic systems are regulated by states, tribes and local governments, and that in most states local health departments issue the permits.' },
    npsCook: { id: 'npsCook', label: 'NPS: cooking and food storage in camp', url: 'https://www.nps.gov/subjects/camping/cooking-in-camp.htm', who: 'National Park Service', asof: ASOF, note: 'Never leave food unattended, never feed wildlife, keep a clean camp.' },
    npsBear: { id: 'npsBear', label: 'NPS Yosemite: bears and food storage', url: 'https://www.nps.gov/yose/planyourvisit/bears.htm', who: 'National Park Service', asof: ASOF, note: 'Anything with a scent counts as food: toiletries, trash, even empty coolers. A park example; your area may have its own rules.' },
    icc: { id: 'icc', label: 'ICC: the optional tiny-house appendix in the model residential code', url: 'https://iccsafe.org/?p=319005', who: 'International Code Council', asof: ASOF, note: 'The tiny-house appendix is optional: it only applies where the local ordinance adopts it.' },
    stove: { id: 'stove', label: 'Univ. of Delaware Extension: wood stove installation (1991)', url: 'https://nasdonline.org/1248/d001052/wood-stove-installation-and-operation.html', who: 'Univ. of Delaware Cooperative Extension', asof: ASOF, note: 'Old publication. Used only to show typical numbers. Always follow the stove label and local code.' }
  };

  /* ---------- checklist stages ---------- */
  var stages = [
    { id: 'access', t: 'Site prep and access', ic: 'route', steps: [
      { id: 'a1', t: 'Confirm legal access to the parcel', d: 'Make sure there is a recorded road or easement to the land, and that you can get a vehicle (and emergency vehicles) in all year.', ask: 'Ask the county: is there legal access, and who maintains the road?' },
      { id: 'a2', t: 'Ask about a driveway or road-access permit', d: 'Many places require approval where a new driveway meets a public road. Fire districts often have rules for width and turn-around.', ask: 'Ask the building or public-works department: do I need a driveway permit? Does the fire district have access rules?' },
      { id: 'a3', t: 'Mark the corners and setbacks before you clear anything', d: 'Setbacks are the required distances from property lines, roads, water and slopes. Find the real boundary first (survey pins), then lay out the cabin spot with string or flags.', ask: 'Ask planning/zoning: what are the setbacks, and is a survey needed?' },
      { id: 'a4', t: 'Choose the spot: drainage, slope, sun, wind, falling trees', d: 'Look for well-drained ground that is not in a wash or low spot, away from dead standing trees, with winter sun if you plan solar. Watch the site through a rain.' },
      { id: 'a5', t: 'Clear only what you need', d: 'Check rules on cutting trees and disturbing soil near water, wetlands or steep slopes before you start.', ask: 'Ask the county or conservation district: any limits on clearing, grading or work near water?' }
    ] },
    { id: 'water', t: 'Water', ic: 'drop', steps: [
      { id: 'w1', t: 'Decide how you will get water', d: 'Common options are hauled water in containers, a rainwater system, a spring, or a drilled well. Each has different permits and treatment needs.', ask: 'Ask the county health or environmental department: what is allowed for drinking water on a parcel like this?' },
      { id: 'w2', t: 'If you want a well, ask before you pay a driller', d: 'Wells are usually permitted and must be done by a licensed driller in many places. Some areas have water-rights rules or limits.', ask: 'Ask the health department and the state water agency: is a well permit required, and are there water-right limits here?', pro: 'Licensed driller where required' },
      { id: 'w3', t: 'Treat and test drinking water', d: 'Treat any water you did not get from a tested, approved source. Have well or spring water tested through a certified lab recommended by the health department.', ask: 'Ask the health department which tests they recommend for this area.' },
      { id: 'w4', t: 'Plan for freezing', d: 'Anything holding water can freeze and split. Plan to drain, insulate or keep water in a place that stays above freezing (see Winterizing).' }
    ] },
    { id: 'waste', t: 'Waste and sanitation', ic: 'tool', steps: [
      { id: 's1', t: 'Find out what toilet systems are legal on your parcel', d: 'Rules range from a septic system to composting or other alternatives, and some places allow none for an unpermitted structure. Do not dig or install anything first.', ask: 'Ask the county health department: what sanitation is allowed for a small cabin here, and what permits does it need?' },
      { id: 's2', t: 'Know who permits septic', d: 'Federal EPA does not regulate single-home septic systems; in most states the local health department permits them, usually after a soil or percolation evaluation.', ask: 'Ask: do I need a soil evaluation first, and who is allowed to design and install the system?', pro: 'Designer/installer as required locally', src: 'epa' },
      { id: 's3', t: 'Plan greywater and trash', d: 'Dishwater and sink water often have their own rules. Plan trash storage that animals cannot reach and a way to haul it out.', ask: 'Ask the health department: is greywater allowed and how must it be handled?' }
    ] },
    { id: 'found', t: 'Foundation', ic: 'home', steps: [
      { id: 'f1', t: 'Learn the local frost depth, soil and flood rules', d: 'The depth that footings must reach below frost, and the design values for snow and wind, are set locally. Ask the building department rather than guessing from a map.', ask: 'Ask the building department: what are the frost depth and the design snow and wind loads here? Any flood or fault zone?' },
      { id: 'f2', t: 'Pick a foundation type that fits the ground and the rules', d: 'Piers, skids or a slab each suit different soil, slope and climate (tap "Foundation types" above). Some places do not allow skids for a permitted dwelling.', ask: 'Ask the building department: which foundation types are accepted for a small cabin?' },
      { id: 'f3', t: 'Get engineered plans or a stamped design if required', d: 'Many jurisdictions want plans for anything permitted, and a licensed engineer for slopes, high snow, high wind or poor soil.', pro: 'Engineer/architect where required' },
      { id: 'f4', t: 'Get the inspection before covering anything', d: 'Footings and similar work are usually inspected before concrete or backfill. Do not bury what an inspector needs to see.', ask: 'Ask: which inspections happen when, and how do I request one?' }
    ] },
    { id: 'shell', t: 'Framing and shell', ic: 'tools', steps: [
      { id: 'h1', t: 'Start from a real plan', d: 'Use a stock plan or a stamped design that matches your local snow, wind and seismic needs. Build lists and cut lists come from the plan, not from memory.', ask: 'Ask: do you accept stock plans, or do they need to be stamped locally?' },
      { id: 'h2', t: 'Check owner-builder rules and your own limits', d: 'Many places let owners build their own home, often with conditions, and some require licensed trades for certain parts. Be honest about what you can do safely: lifting, heights and structure are where people get hurt.', ask: 'Ask: what may an owner-builder do themselves, and what needs a licensed contractor?', pro: 'Licensed pros for work beyond your skill or where required' },
      { id: 'h3', t: 'Work safely', d: 'Wear eye, ear and hand protection, use fall protection above ladder height rules, never work alone at heights, and keep a first-aid kit and a way to call for help (see Kits).' },
      { id: 'h4', t: 'Keep the frame dry and braced during construction', d: 'Cover lumber, brace walls before the roof goes on, and do not leave an unfinished frame in a storm without checking bracing.' }
    ] },
    { id: 'roof', t: 'Roof and snow load', ic: 'snow', steps: [
      { id: 'r1', t: 'Get the roof design loads from the building department', d: 'Snow load can differ a lot between nearby sites because of elevation. Use the figure the authority gives you, not a generic one.', ask: 'Ask the building department: what is the ground snow load and wind speed for this exact parcel?' },
      { id: 'r2', t: 'Match pitch, rafters and roofing to those loads', d: 'Steeper roofs shed snow; flat roofs hold it. Span tables and fastener patterns depend on the load. Use the plan or an engineer.', pro: 'Engineer for heavy snow, long spans or unusual roofs' },
      { id: 'r3', t: 'Plan where snow and ice will slide', d: 'Metal roofs can drop sheets of snow suddenly. Keep doors, walkways, the stove chimney and propane tanks out of the slide path.' },
      { id: 'r4', t: 'Use fall protection or hire the roof', d: 'Roofing is a leading cause of serious falls. If you are not equipped and practised, hire it out.' }
    ] },
    { id: 'weather', t: 'Weatherproofing, moisture and pests', ic: 'cloud', steps: [
      { id: 'm1', t: 'Water-shed detail: wrap, flash, overhang', d: 'Water gets in at windows, doors, roof edges and where the wall meets the ground. Flashing and a proper weather barrier matter more than any one product.' },
      { id: 'm2', t: 'Keep wood off the ground and the ground away from wood', d: 'Lift the structure on piers or a base so the lowest framing stays dry and ventilated; slope soil away from the walls.' },
      { id: 'm3', t: 'Close the gaps mice and insects use', d: 'Seal around pipes, vents and door sweeps with metal or rodent-resistant materials. Store no food in the cabin when it is empty.' },
      { id: 'm4', t: 'Ask about local termites and wood-rot rules', d: 'Some regions require termite protection or treated wood near the ground.', ask: 'Ask the building department: any termite, treated-wood or wildfire-ignition-resistant material rules here?' }
    ] },
    { id: 'heat', t: 'Insulation, heating and alarms', ic: 'flame', steps: [
      { id: 'i1', t: 'Insulate and air-seal to suit your climate', d: 'The right amount depends on your climate zone and how you will heat. Ask what the local energy code expects for a small structure.', ask: 'Ask: what insulation or energy-code rules apply to a small cabin?' },
      { id: 'i2', t: 'Wood stove: use a listed stove, follow the label, and ask about permit/inspection', d: 'Typical guidance: clearances to walls are large (an old extension guide shows 36 in for an unshielded stove) and you need a non-combustible floor pad extending well beyond the stove. A listed stove\'s label and manual set the real numbers, and the local authority may require a permit and inspection. Installing a stove and chimney is a fire-safety job: use a certified installer unless local rules and your skill clearly allow otherwise.', ask: 'Ask the building department and fire marshal: permit, clearance and inspection for a wood stove here?', pro: 'Certified installer/inspection where required', typ: true, src: 'stove' },
      { id: 'i3', t: 'Chimney: listed pipe, correct height, sweep it', d: 'Use listed insulated chimney pipe through roofs and walls, never single-wall pipe outdoors or through a wall. The old extension guide gives a 3 ft above the roof and 2 ft above anything within 10 ft rule of thumb; check local code. Clean the chimney regularly: creosote burns.', typ: true, src: 'stove' },
      { id: 'i4', t: 'Carbon monoxide alarms', d: 'CDC advises battery or battery-backup CO alarms near every sleeping area, testing them regularly, and replacing them per the maker\'s schedule or about every 5 years. Never run a generator, gas stove, grill or charcoal inside, and keep generators well away from windows, doors and vents (CDC says over 20 ft).', src: 'cdc' },
      { id: 'i5', t: 'Smoke alarms', d: 'Typical guidance: a working smoke alarm in or near each sleeping area and on each level, tested monthly, plus a fire extinguisher by the exit. Check local code for the exact type.', typ: true },
      { id: 'i6', t: 'Propane: licensed install, leak awareness, outdoors', d: 'Have propane tanks, regulators and any gas lines or appliances installed and tested by a licensed propane pro where required. Keep cylinders outdoors, upright and secured, never in the living space. If you smell gas: leave, do not touch switches, call the supplier or emergency services from outside.', pro: 'Licensed propane/gas pro', typ: true, ask: 'Ask the fire marshal: any tank location or clearance rules?' }
    ] },
    { id: 'vent', t: 'Ventilation', ic: 'wifi', steps: [
      { id: 'v1', t: 'Plan fresh air in and moist air out', d: 'A tight small cabin gets damp fast from breathing, cooking and drying clothes. Plan vents, a window that opens and a way to run an exhaust.' },
      { id: 'v2', t: 'Combustion appliances need their own air and venting', d: 'Follow the appliance manual. Never block a flue or vent, and never use an unvented fuel heater in a sleeping space unless it is listed for it and ventilation is provided.', pro: 'Licensed pro for gas appliance venting', typ: true },
      { id: 'v3', t: 'Ventilate the crawl space or underfloor', d: 'Trapped moisture under a cabin invites rot and mold. Keep underfloor space open or vented as the plan says.' }
    ] },
    { id: 'power', t: 'Off-grid power', ic: 'bolt', link: { go: 'power', label: 'Open the Power tab' }, steps: [
      { id: 'p1', t: 'Start with a load list in the Power tab', d: 'Work out what you want to run and how many watt-hours you use before choosing a solar panel or portable power station.' },
      { id: 'p2', t: 'Portable power stations: keep them out of the cold and wet', d: 'Charge and store them per the maker\'s manual, away from heaters, and ventilated. Do not leave one discharged in a freezing cabin all winter without checking the manual.' },
      { id: 'p3', t: 'Fixed wiring, batteries and panel mounts: licensed electrician where required', d: 'Cabin wiring, a permanent battery bank or a roof-mounted array are usually permitted work and can start fires or shock. Plug-in portable gear is a different thing from wiring a building.', ask: 'Ask the building department: is an electrical permit needed for an off-grid system?', pro: 'Licensed electrician where required' }
    ] },
    { id: 'secure', t: 'Security', ic: 'eye', steps: [
      { id: 'x1', t: 'Slow thieves down', d: 'Solid doors, quality locks, window shutters or bars you can open from inside in an emergency, and no valuables left. A power station or panel is theft bait: lock it up or take it with you.' },
      { id: 'x2', t: 'Look occupied from the road', d: 'Keep the approach clear of overgrowth, avoid leaving signs of what is inside, and tell a neighbor or friend your plan.' },
      { id: 'x3', t: 'Keep an escape route', d: 'Whatever you add to windows and doors, every sleeping space needs a way out that opens from the inside without a key.', ask: 'Ask the building department: what emergency-exit rules apply?' }
    ] },
    { id: 'wild', t: 'Wildlife and bear-proofing', ic: 'bear', steps: [
      { id: 'b1', t: 'Anything with a scent is food to a bear', d: 'The National Park Service lists food, drinks, toiletries, trash and even empty coolers. Do not keep them in a tent or an unattended cabin; use locked bear-resistant storage where bears live.', src: 'npsBear' },
      { id: 'b2', t: 'Never feed wildlife, never leave food unattended', d: 'Fed animals lose their fear of people and can become dangerous. Keep camp clean after meals.', src: 'npsCook' },
      { id: 'b3', t: 'Ask what lives there and what is required', d: 'Local wildlife agencies know which animals matter and may have rules about food storage and trash.', ask: 'Ask the state wildlife agency or the county: are there bear, rodent or other wildlife rules for this area?' }
    ] },
    { id: 'insure', t: 'Insurance', ic: 'doc', steps: [
      { id: 'n1', t: 'Ask an agent before you build', d: 'Standard policies often exclude unoccupied or seasonal buildings, wood stoves or owner-built structures unless you ask. Wildfire areas can be hard to insure.', ask: 'Ask an insurance agent: what covers a seasonal cabin, vacancy, wood stove and liability for guests?' },
      { id: 'n2', t: 'Photograph and list what is there', d: 'Take dated photos of the structure and anything of value, and keep receipts. Store copies off the phone too.' },
      { id: 'n3', t: 'Think about liability', d: 'If guests or road-trip visitors will use the cabin, ask about liability coverage and whether renting it changes anything.', ask: 'Ask the agent and the county: does hosting guests change coverage or zoning?' }
    ] },
    { id: 'winter', t: 'Winterizing and closing for the season', ic: 'snow', steps: [
      { id: 'c1', t: 'Run the closing-up checklist', d: 'The "Closing up" list in the Kits tab covers water, power, gas, food, doors and the fire pit.' },
      { id: 'c2', t: 'Plan for snow while you are away', d: 'Roofs hold snow all winter. Know whether anyone can check the cabin, and avoid leaving a heavy snow load on a roof not designed for it.' },
      { id: 'c3', t: 'Tell someone your return plan', d: 'Share when you will be back so someone notices if you are not.' }
    ] }
  ];

  /* ---------- foundations (typical, flagged) ---------- */
  var foundations = [
    { id: 'piers', t: 'Piers (posts or pads)', good: 'Fits slopes and uneven ground; keeps the floor off damp soil; less digging.', watch: 'Needs correct depth and footing size; lateral bracing for wind or seismic; skirting needs to resist animals.', clim: 'Cold climates: footings usually have to be placed below the local frost depth so freezing ground does not lift them. Wet or clay soils and floods need an engineer\'s view.' },
    { id: 'skids', t: 'Skids (beams on the ground or on blocks)', good: 'Simple and movable; low cost; common for sheds and tiny cabins.', watch: 'Not accepted for a permitted dwelling in some places; can shift with frost or settle in soft soil; wood close to the ground rots faster.', clim: 'Frost heave can move skids; wet ground shortens their life. Treated or rot-resistant timber and drainage matter.' },
    { id: 'slab', t: 'Slab on grade', good: 'Solid, low to the ground, good thermal mass; accessible.', watch: 'Needs level, well-drained ground and proper prep; harder to fix later; concrete work is skilled.', clim: 'Cold climates use frost-protected or deeper edges designed for local frost depth; hot climates handle heat well. Ask about radon and vapor barriers.' }
  ];

  /* ---------- permit path ---------- */
  var permit = {
    intro: 'Whether a small cabin needs a building permit depends on the exact place: the county, the city if you are inside one, the zone, and sometimes the fire district or an HOA. Exemptions for small or accessory buildings exist in many places, but the size limit, and whether sleeping in it changes the rule, is set locally. This app cannot tell you; the county can.',
    steps: [
      { t: 'Find the right office', d: 'Start with the county (or city) building department and the planning/zoning department. Parcels inside a town use the town. Ask whether a fire district, health department or road agency also signs off.' },
      { t: 'Ask whether a structure under a certain size is exempt', d: 'Ask for the exemption in writing: the maximum floor area, height, whether a loft or sleeping use removes it, and what still applies even if it is exempt (setbacks, septic, fire).' },
      { t: 'Ask about the uses you actually want', d: 'Weekend stays, long stays, guests, short-term rentals and living there year-round are often treated differently. Zoning may allow a cabin but not full-time living.' },
      { t: 'Ask what each permit usually involves', d: 'Building permits often ask for a site plan, drawings and inspections. Septic permits often start with a soil evaluation. Well permits often need a licensed driller and sometimes a water-rights check. Fees and timelines vary a lot: ask for the current fee schedule.' },
      { t: 'Ask about owner-builder rules', d: 'Many places allow owner-builders, often with conditions: you may need to live in it, sign an affidavit, or hire licensed trades for electrical, gas or plumbing. The rules differ.' },
      { t: 'Check private restrictions too', d: 'Deeds, HOA or association covenants, and easements can be stricter than the county. A title company or the recorder can show recorded documents.' },
      { t: 'Write down who said what', d: 'Note the name, date and answer for each question, ask for the code section, and get approvals in writing.' }
    ],
    ask: [
      'Is a building permit required for a structure of this size and use on this parcel?',
      'What are the size, height and use limits for an exempt or accessory building, and does sleeping in it change them?',
      'What are the setbacks, and do I need a survey?',
      'What sanitation (septic, composting, other) is allowed, and who permits it?',
      'What water source is allowed, and is a well permit needed?',
      'What are the frost depth, snow load and wind speed for this parcel?',
      'Are there wildfire, flood, slope, wetland or other overlay rules?',
      'What may an owner-builder do themselves, and what needs a licensed pro?',
      'What does the fire district require (access, address sign, defensible space)?',
      'Do I need an electrical, gas or wood-stove permit?',
      'Are there limits on how long I may camp or stay here in a trailer or tent while I build?',
      'What are the current fees and typical timeline?'
    ],
    facts: [
      { t: 'Septic is a state and local matter', d: 'EPA says it does not regulate single-family home septic systems; states, tribes and local governments do, and in most states local health departments issue the permits.', src: 'epa', url: L.epa.url, asof: ASOF },
      { t: 'Tiny-house building-code appendix is optional', d: 'The model residential code has an adoptable tiny-house appendix with relaxed loft, ceiling-height and egress provisions. It applies only where a jurisdiction adopts it, so a cabin may or may not be treated this way.', src: 'icc', url: L.icc.url, asof: ASOF }
    ]
  };

  /* ---------- fire ---------- */
  var fire = {
    beforeEvery: [
      'Check today\'s fire restrictions or burn ban with the county, the state fire or forestry agency and the local fire district. They can change daily.',
      'Check the National Weather Service forecast for a Red Flag Warning or Fire Weather Watch for your area.',
      'Look at wind: if it is gusty, do not light a fire.',
      'Have water and a shovel at the fire before you light it.',
      'If any of those say no, or you are unsure, do not have a fire. Use a stove that is allowed where you are, or go without.'
    ],
    siteRules: [
      { t: 'Clearance', d: 'Smokey Bear says to stay at least 15 ft from tents, brush and low branches, to keep overhead clear for at least three times the flame height, and to clear a circle about 10 ft across.', src: 'smokey' },
      { t: 'Wind and dryness', d: 'No fire in hazardous, dry or windy conditions.', src: 'smokey' },
      { t: 'Water and a shovel on hand', d: 'A bucket or hose within reach and a shovel to stir the ashes.', src: 'smokey' },
      { t: 'Keep it small and keep it attended', d: 'Never leave a fire alone, even for a minute; keep children and pets supervised and back from the ring.', src: 'smokey' },
      { t: 'Burn only wood', d: 'No trash, aerosols, pressurized cans, batteries or glass. Never use fuel to light a fire.', src: 'smokey' },
      { t: 'Embers travel', d: 'Sparks can blow beyond the ring. Do not burn under or near overhanging branches, dry grass or a roof.' }
    ],
    out: [
      { t: 'Drown', d: 'Pour water until the hissing stops. Dirt or sand alone is not enough.' },
      { t: 'Stir', d: 'Mix water into the embers and ash with the shovel; scrape sticks and logs so no ember is left, including dark ones.' },
      { t: 'Drown again, then feel', d: 'Add water until everything is cool, then hold the back of your hand over the ashes. If it is too hot to touch, it is too hot to leave.' }
    ],
    outSrc: 'smokey',
    ember: 'Ember cleanup: before you leave or go to bed, the pit must be cold to the touch. Check again in the morning. Dump no hot ashes anywhere, not even in a metal can near the cabin; use a closed metal bucket on bare ground until fully cold.',
    pit: {
      note: 'Build guide. These are common practice figures; the real rules (distances, fire-ring types, whether open fires are allowed at all) are set by your county, fire district and any burn ban. Check local code.',
      steps: [
        { t: 'Pick the place', d: 'Flat, open ground away from the wind, from the cabin and from trees. Use the Smokey Bear figures as a floor: 15 ft or more from anything flammable and clear overhead. Many local codes ask for more distance from a structure: check.' },
        { t: 'Clear to bare dirt', d: 'Remove grass, leaves, needles and roots in a circle about 10 ft wide (Smokey Bear). Rake the debris well away.' },
        { t: 'Dig a shallow bowl', d: 'About a foot deep (Smokey Bear) with the dirt piled for ring support or smothering. Do not dig into roots or over buried utilities; call the local utility locate service if unsure.' },
        { t: 'Lay a gravel base', d: 'A layer of gravel or sand makes drainage and a stable floor. Avoid river rocks and wet or porous stone: trapped water can make stones burst when heated.' },
        { t: 'Build the ring', d: 'Use a metal fire ring or a single or double course of dry, dense stones, set tight so logs cannot roll out. Keep the pit low and small.' },
        { t: 'Add a clear zone and a screen', d: 'Keep the ground around the ring clear for several feet and keep a spark screen or lid for windy-ish evenings where fires are allowed.' },
        { t: 'Store tools at the ring', d: 'A shovel, a rake, and a bucket (or hose) always live at the pit.' }
      ]
    },
    wood: [
      'Stack firewood well away from the cabin and from the fire pit. Typical wildfire guidance is a good distance from the cabin (often 30 ft or more in fire country, and not uphill of it). This is not verified for your place: ask your fire district.',
      'Keep the stack off the ground and off the cabin wall, and cover the top only.',
      'Do not store wood under the deck, against the cabin or on a porch in fire country.',
      'Keep chainsaw gas, propane and other fuels in approved containers away from the cabin and away from the fire pit.',
      'Dry wood burns cleaner: smoke and creosote come from wet wood.'
    ],
    ready: [
      { t: 'Ready: prepare the property', d: 'Keep the zone right around the cabin free of things that burn (no wood stack, dry leaves or mulch against the walls); keep roofs and gutters free of needles and leaves; thin and trim vegetation further out. California\'s rules describe three zones to about 5 ft, 30 ft and 100 ft; they are California law, but a good model. Ask your local fire district for the rules where you are.', src: 'calfire', url: L.calfire.url },
      { t: 'Set: stay aware', d: 'When a fire starts near you, watch official alerts, have the vehicle ready and know the way out. Cell signal can fail: learn the local alert system and keep a battery radio.', src: 'rsg', url: L.rsg.url },
      { t: 'Go: leave early', d: 'When officials tell you to go, go. Do not wait to see the fire. Have a family meeting point and a second route out.', src: 'rsg', url: L.rsg.url }
    ],
    links: ['smokey', 'nws', 'nifc', 'inciweb', 'calfire', 'rsg'],
    stateAgencies: 'There is no single national page for burn bans. Search your state\'s name plus "forestry" or "fire" with "fire restrictions", and call the local fire district or county sheriff\'s non-emergency number. Write the numbers you find in your parcel notes.'
  };

  /* ---------- kits ---------- */
  var kit = [
    { id: 'k1', t: 'Water: a few days\' worth plus a way to treat more' },
    { id: 'k2', t: 'Food that needs no refrigeration, and a bear-resistant way to store it where required' },
    { id: 'k3', t: 'First-aid kit and a printed first-aid reference' },
    { id: 'k4', t: 'Paper map and parcel boundary printout; the Map tab\'s offline copy' },
    { id: 'k5', t: 'Headlamps, spare batteries, a lantern' },
    { id: 'k6', t: 'Fully charged portable power station and cables; phone charger' },
    { id: 'k7', t: 'Shelter: tent or other approved sleeping setup, sleeping bags rated for the lowest night temperature' },
    { id: 'k8', t: 'Toilet plan: whatever the rules allow, plus hand-washing and trash bags' },
    { id: 'k9', t: 'Fire tools: bucket, shovel, rake, extinguisher (never light a fire before the fire check)' },
    { id: 'k10', t: 'CO alarm and smoke alarm (battery) for wherever you sleep' },
    { id: 'k11', t: 'Hand tools, work gloves, eye and ear protection' },
    { id: 'k12', t: 'Notebook, tape measure, phone camera: record the site, soil, sun and where the corners are' },
    { id: 'k13', t: 'Offline contacts: county offices, fire district, nearest hospital; tell someone your plan and return time' },
    { id: 'k14', t: 'Vehicle: full tank, spare tire, tow strap, and a way to get unstuck' }
  ];
  var closing = [
    { id: 'z1', t: 'Cold, fully out fire pit; ashes cold and cleared' },
    { id: 'z2', t: 'All food, drink, toiletries and trash removed or locked in animal-proof storage' },
    { id: 'z3', t: 'Water shut off and drained if it could freeze; containers emptied' },
    { id: 'z4', t: 'Propane valves closed; gas appliances off; cylinders secured outdoors' },
    { id: 'z5', t: 'Wood stove cold, ash removed, flue and damper checked' },
    { id: 'z6', t: 'Power: switch off and unplug; portable power station stored per the maker\'s cold-weather instructions or taken with you' },
    { id: 'z7', t: 'Valuables, panels and stations locked up or taken home' },
    { id: 'z8', t: 'Windows and doors locked; shutters closed; mouse gaps checked' },
    { id: 'z9', t: 'Roof and gutters cleared of leaves and needles; firewood stacked away from the cabin' },
    { id: 'z10', t: 'Photos of the inside and outside, dated; note any repairs for next time' },
    { id: 'z11', t: 'Tell someone you are leaving and when you will be back; check the insurance vacancy terms' }
  ];

  /* ---------- cost line suggestions: names only, never amounts ---------- */
  var costNames = ['Permits and fees', 'Survey', 'Access / driveway', 'Water (well, tank or hauling)', 'Septic or composting system', 'Foundation', 'Lumber and framing', 'Roofing', 'Windows and doors', 'Insulation', 'Stove and chimney', 'Propane install', 'Solar panel and power station', 'Wiring (licensed pro)', 'Security', 'Insurance', 'Tools and delivery', 'Fire pit and wood storage'];

  var sources = [L.smokey, L.nws, L.nifc, L.inciweb, L.calfire, L.rsg, L.cdc, L.epa, L.npsCook, L.npsBear, L.icc, L.stove];
  return { asof: ASOF, links: L, stages: stages, foundations: foundations, permit: permit, fire: fire, kit: kit, closing: closing, costNames: costNames, sources: sources };
})();
