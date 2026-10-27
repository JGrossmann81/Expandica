/* Expandica 'Our plan' data (window.EXC_PLAN). Written for this app by the owner's planning team.
   NOTHING HERE IS RESEARCHED PRICE DATA OR A RULE: starts, kit lists and phases are the family's own planning assumptions.
   City coordinates are APPROXIMATE CITY CENTRES rounded to 0.1 degree (about 7 miles), well-known cities only, used to NAME a point on the planning line.
   Not legal, tax, financial or engineering advice. Planning aid, not a purchase recommendation; nothing here is a price quote. */
window.EXC_PLAN = {
  asof: '2026-10',
  honesty: 'Planning aid, not a purchase recommendation. Nothing here is a price quote, and every dollar figure is my planning assumption. Not legal, tax, financial or engineering advice.',
  family: 'the Grossmann family',
  corridor: 'central',
  hoursChoices: [8, 10, 12],
  hoursDefault: 10,
  /* the west end is an ASSUMPTION the family can change */
  startNote: 'The start is an assumption: the Grossmanns live on the Northern California side, so the line begins near Sacramento. Change it to any other Northern California point you like.',
  starts: [
    { id: 'sac', name: 'Sacramento', st: 'CA', lat: 38.6, lon: -121.5 },
    { id: 'sf', name: 'San Francisco (Bay Area)', st: 'CA', lat: 37.8, lon: -122.4 },
    { id: 'sj', name: 'San Jose', st: 'CA', lat: 37.3, lon: -121.9 },
    { id: 'red', name: 'Redding', st: 'CA', lat: 40.6, lon: -122.4 }
  ],
  /* a typed start must be on the west side of Reno so the line still runs west to east */
  startLimits: { lonMax: -119.5, lonMin: -125, latMin: 35.5, latMax: 42 },
  /* extra well-known cities along the central line, only used to name each zone (nearest city; the state is a proxy, so confirm it) */
  cities: [
    ['Sacramento', 'CA', 38.6, -121.5], ['San Francisco', 'CA', 37.8, -122.4], ['San Jose', 'CA', 37.3, -121.9], ['Redding', 'CA', 40.6, -122.4],
    ['Truckee', 'CA', 39.3, -120.2], ['Reno', 'NV', 39.5, -119.8], ['Winnemucca', 'NV', 41.0, -117.7], ['Elko', 'NV', 40.8, -115.8],
    ['Salt Lake City', 'UT', 40.8, -111.9], ['Evanston', 'WY', 41.3, -111.0], ['Rock Springs', 'WY', 41.6, -109.2], ['Rawlins', 'WY', 41.8, -107.2],
    ['Laramie', 'WY', 41.3, -105.6], ['Cheyenne', 'WY', 41.1, -104.8], ['North Platte', 'NE', 41.1, -100.8], ['Kearney', 'NE', 40.7, -99.1],
    ['Grand Island', 'NE', 40.9, -98.3], ['Lincoln', 'NE', 40.8, -96.7], ['Omaha', 'NE', 41.3, -96.0], ['Des Moines', 'IA', 41.6, -93.6],
    ['Iowa City', 'IA', 41.7, -91.5], ['Davenport', 'IA', 41.5, -90.6], ['Chicago', 'IL', 41.9, -87.6], ['South Bend', 'IN', 41.7, -86.3],
    ['Toledo', 'OH', 41.7, -83.6], ['Cleveland', 'OH', 41.5, -81.7], ['Youngstown', 'OH', 41.1, -80.7], ['Pittsburgh', 'PA', 40.4, -80.0],
    ['State College', 'PA', 40.8, -77.9], ['Scranton', 'PA', 41.4, -75.7], ['New York', 'NY', 40.7, -74.0]
  ],
  /* ---- RURAL CHAIN (13 small-town sites) ----
     ruralTowns: small towns and rural-area anchors along and near the central corridor, west to east (60 places, all thought to be under about 25,000 people).
     lat/lon are APPROXIMATE TOWN CENTRES rounded to 0.1 degree (about 7 miles), written from the planning team's memory of the map: coordVerified is false for every place except Susanville
     (its coordinates were read on its Wikipedia page, 2026-10). Do not drive to these numbers; they only NAME a point on the planning line.
     pop = a population figure that was READ on a Wikipedia page in 2026-10 (popNote says which census or estimate); pop null and popVerified false = not checked, and the app then says "size not checked".
     band = 1 (under 2,500), 2 (2,500 to 9,999), 3 (10,000 to 24,999): derived from pop when it is known, otherwise the planning team's guess. The band only decides which town wins a tie-break (smaller is preferred); the app never prints a guessed band as a fact.
     county = shown only where a Wikipedia list page gave it or the planning team is sure; otherwise null. verified = popVerified AND coordVerified.
     Nothing here says anything about land prices, rules or road access. */
  ruralTowns: [
    { id: "jackson-ca", name: "Jackson", st: "CA", lat: 38.3, lon: -120.8, county: "Amador", pop: 5019, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "placerville-ca", name: "Placerville", st: "CA", lat: 38.7, lon: -120.8, county: "El Dorado", pop: 10747, popNote: "2020 census, Wikipedia list page", band: 3, popVerified: true, coordVerified: false, verified: false },
    { id: "colusa-ca", name: "Colusa", st: "CA", lat: 39.2, lon: -122.0, county: "Colusa", pop: 6411, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "oroville-ca", name: "Oroville", st: "CA", lat: 39.5, lon: -121.6, county: "Butte", pop: 20042, popNote: "2020 census, Wikipedia list page", band: 3, popVerified: true, coordVerified: false, verified: false },
    { id: "susanville-ca", name: "Susanville", st: "CA", lat: 40.4, lon: -120.7, county: "Lassen", pop: 16728, popNote: "2020 census, Wikipedia article; a large share of the counted residents are in prisons", band: 3, popVerified: true, coordVerified: true, verified: true },
    { id: "fallon-nv", name: "Fallon", st: "NV", lat: 39.5, lon: -118.8, county: "Churchill", pop: 9327, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "lovelock-nv", name: "Lovelock", st: "NV", lat: 40.2, lon: -118.5, county: "Pershing", pop: 1805, popNote: "2020 census, Wikipedia list page", band: 1, popVerified: true, coordVerified: false, verified: false },
    { id: "winnemucca-nv", name: "Winnemucca", st: "NV", lat: 41.0, lon: -117.7, county: "Humboldt", pop: 8431, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "battle-mountain-nv", name: "Battle Mountain", st: "NV", lat: 40.6, lon: -116.9, county: "Lander", pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "carlin-nv", name: "Carlin", st: "NV", lat: 40.7, lon: -116.1, county: "Elko", pop: 2050, popNote: "2020 census, Wikipedia list page", band: 1, popVerified: true, coordVerified: false, verified: false },
    { id: "wells-nv", name: "Wells", st: "NV", lat: 41.1, lon: -115.0, county: "Elko", pop: 1237, popNote: "2020 census, Wikipedia list page", band: 1, popVerified: true, coordVerified: false, verified: false },
    { id: "west-wendover-nv", name: "West Wendover", st: "NV", lat: 40.7, lon: -114.1, county: "Elko", pop: 4512, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "coalville-ut", name: "Coalville", st: "UT", lat: 40.9, lon: -111.4, county: "Summit", pop: 1915, popNote: "2023 figure on Wikipedia list page (not the 2020 census)", band: 1, popVerified: true, coordVerified: false, verified: false },
    { id: "evanston-wy", name: "Evanston", st: "WY", lat: 41.3, lon: -111.0, county: "Uinta", pop: 11747, popNote: "2020 census, Wikipedia list page", band: 3, popVerified: true, coordVerified: false, verified: false },
    { id: "lyman-wy", name: "Lyman", st: "WY", lat: 41.3, lon: -110.3, county: "Uinta", pop: 2135, popNote: "2020 census, Wikipedia list page", band: 1, popVerified: true, coordVerified: false, verified: false },
    { id: "rock-springs-wy", name: "Rock Springs", st: "WY", lat: 41.6, lon: -109.2, county: "Sweetwater", pop: 23526, popNote: "2020 census, Wikipedia list page; close to the size cap", band: 3, popVerified: true, coordVerified: false, verified: false },
    { id: "rawlins-wy", name: "Rawlins", st: "WY", lat: 41.8, lon: -107.2, county: "Carbon", pop: 8221, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "saratoga-wy", name: "Saratoga", st: "WY", lat: 41.5, lon: -106.8, county: "Carbon", pop: 1702, popNote: "2020 census, Wikipedia list page", band: 1, popVerified: true, coordVerified: false, verified: false },
    { id: "encampment-wy", name: "Encampment", st: "WY", lat: 41.2, lon: -106.8, county: "Carbon", pop: 452, popNote: "2020 census, Wikipedia list page", band: 1, popVerified: true, coordVerified: false, verified: false },
    { id: "wheatland-wy", name: "Wheatland", st: "WY", lat: 42.1, lon: -105.0, county: "Platte", pop: 3588, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "kimball-ne", name: "Kimball", st: "NE", lat: 41.2, lon: -103.7, county: "Kimball", pop: 2290, popNote: "2020 census, Wikipedia list page", band: 1, popVerified: true, coordVerified: false, verified: false },
    { id: "sidney-ne", name: "Sidney", st: "NE", lat: 41.1, lon: -103.0, county: "Cheyenne", pop: 6410, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "ogallala-ne", name: "Ogallala", st: "NE", lat: 41.1, lon: -101.7, county: "Keith", pop: 4878, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "gothenburg-ne", name: "Gothenburg", st: "NE", lat: 40.9, lon: -100.2, county: "Dawson", pop: 3478, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "cozad-ne", name: "Cozad", st: "NE", lat: 40.9, lon: -100.0, county: "Dawson", pop: 3988, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "elm-creek-ne", name: "Elm Creek", st: "NE", lat: 40.7, lon: -99.4, county: "Buffalo", pop: 979, popNote: "2020 census, Wikipedia list page", band: 1, popVerified: true, coordVerified: false, verified: false },
    { id: "gibbon-ne", name: "Gibbon", st: "NE", lat: 40.7, lon: -98.9, county: "Buffalo", pop: 1878, popNote: "2020 census, Wikipedia list page", band: 1, popVerified: true, coordVerified: false, verified: false },
    { id: "st-paul-ne", name: "St. Paul", st: "NE", lat: 41.2, lon: -98.5, county: "Howard", pop: 2416, popNote: "2020 census, Wikipedia list page", band: 1, popVerified: true, coordVerified: false, verified: false },
    { id: "central-city-ne", name: "Central City", st: "NE", lat: 41.1, lon: -98.0, county: "Merrick", pop: 3039, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "david-city-ne", name: "David City", st: "NE", lat: 41.3, lon: -97.1, county: "Butler", pop: 2995, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "atlantic-ia", name: "Atlantic", st: "IA", lat: 41.4, lon: -95.0, county: "Cass", pop: 6792, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "stuart-ia", name: "Stuart", st: "IA", lat: 41.5, lon: -94.3, county: null, pop: null, popNote: null, band: 1, popVerified: false, coordVerified: false, verified: false },
    { id: "newton-ia", name: "Newton", st: "IA", lat: 41.7, lon: -93.0, county: "Jasper", pop: 15760, popNote: "2020 census, Wikipedia list page", band: 3, popVerified: true, coordVerified: false, verified: false },
    { id: "grinnell-ia", name: "Grinnell", st: "IA", lat: 41.7, lon: -92.7, county: "Poweshiek", pop: 9564, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "west-liberty-ia", name: "West Liberty", st: "IA", lat: 41.6, lon: -91.3, county: "Muscatine", pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "morrison-il", name: "Morrison", st: "IL", lat: 41.8, lon: -90.0, county: "Whiteside", pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "princeton-il", name: "Princeton", st: "IL", lat: 41.4, lon: -89.5, county: "Bureau", pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "mendota-il", name: "Mendota", st: "IL", lat: 41.5, lon: -89.1, county: "LaSalle", pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "plymouth-in", name: "Plymouth", st: "IN", lat: 41.3, lon: -86.3, county: "Marshall", pop: 10214, popNote: "2020 census, Wikipedia list page", band: 3, popVerified: true, coordVerified: false, verified: false },
    { id: "warsaw-in", name: "Warsaw", st: "IN", lat: 41.2, lon: -85.9, county: "Kosciusko", pop: 15804, popNote: "2020 census, Wikipedia list page", band: 3, popVerified: true, coordVerified: false, verified: false },
    { id: "ligonier-in", name: "Ligonier", st: "IN", lat: 41.5, lon: -85.6, county: "Noble", pop: 4411, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "lagrange-in", name: "LaGrange", st: "IN", lat: 41.6, lon: -85.4, county: "LaGrange", pop: 2715, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "bryan-oh", name: "Bryan", st: "OH", lat: 41.5, lon: -84.6, county: "Williams", pop: 8729, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "wauseon-oh", name: "Wauseon", st: "OH", lat: 41.5, lon: -84.1, county: "Fulton", pop: 7568, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "wellington-oh", name: "Wellington", st: "OH", lat: 41.2, lon: -82.2, county: "Lorain", pop: 4799, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "orrville-oh", name: "Orrville", st: "OH", lat: 40.8, lon: -81.8, county: "Wayne", pop: 8452, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "millersburg-oh", name: "Millersburg", st: "OH", lat: 40.6, lon: -81.9, county: "Holmes", pop: 3151, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "east-palestine-oh", name: "East Palestine", st: "OH", lat: 40.8, lon: -80.5, county: "Columbiana", pop: 4761, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "kittanning-pa", name: "Kittanning", st: "PA", lat: 40.8, lon: -79.5, county: "Armstrong", pop: 3980, popNote: "2018 estimate, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "clearfield-pa", name: "Clearfield", st: "PA", lat: 41.0, lon: -78.4, county: "Clearfield", pop: 6132, popNote: "2018 estimate, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "philipsburg-pa", name: "Philipsburg", st: "PA", lat: 40.9, lon: -78.2, county: "Centre", pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "tyrone-pa", name: "Tyrone", st: "PA", lat: 40.7, lon: -78.2, county: "Blair", pop: 5451, popNote: "2018 estimate, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "huntingdon-pa", name: "Huntingdon", st: "PA", lat: 40.5, lon: -78.0, county: "Huntingdon", pop: 7073, popNote: "2018 estimate, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "mount-union-pa", name: "Mount Union", st: "PA", lat: 40.4, lon: -77.9, county: "Huntingdon", pop: null, popNote: null, band: 1, popVerified: false, coordVerified: false, verified: false },
    { id: "lewistown-pa", name: "Lewistown", st: "PA", lat: 40.6, lon: -77.6, county: "Mifflin", pop: 8360, popNote: "2018 estimate, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "honesdale-pa", name: "Honesdale", st: "PA", lat: 41.6, lon: -75.3, county: "Wayne", pop: 4341, popNote: "2018 estimate, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "milford-pa", name: "Milford", st: "PA", lat: 41.3, lon: -74.8, county: "Pike", pop: null, popNote: null, band: 1, popVerified: false, coordVerified: false, verified: false },
    { id: "newton-nj", name: "Newton", st: "NJ", lat: 41.1, lon: -74.8, county: "Sussex", pop: 8374, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    { id: "hackettstown-nj", name: "Hackettstown", st: "NJ", lat: 40.9, lon: -74.8, county: "Warren", pop: 10248, popNote: "2020 census, Wikipedia list page", band: 3, popVerified: true, coordVerified: false, verified: false },
    { id: "flemington-nj", name: "Flemington", st: "NJ", lat: 40.5, lon: -74.9, county: "Hunterdon", pop: 4876, popNote: "2020 census, Wikipedia list page", band: 2, popVerified: true, coordVerified: false, verified: false },
    /* ---- SECOND PATH towns (I-40 direction, Mid-southern corridor): written from memory, population NOT checked, county not given; coordinates approximate to 0.1 degree. ---- */
    { id: "boron-ca", name: "Boron", st: "CA", lat: 35.0, lon: -117.7, county: null, pop: null, popNote: null, band: 1, popVerified: false, coordVerified: false, verified: false },
    { id: "needles-ca", name: "Needles", st: "CA", lat: 34.8, lon: -114.6, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "seligman-az", name: "Seligman", st: "AZ", lat: 35.3, lon: -112.9, county: null, pop: null, popNote: null, band: 1, popVerified: false, coordVerified: false, verified: false },
    { id: "williams-az", name: "Williams", st: "AZ", lat: 35.2, lon: -112.2, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "holbrook-az", name: "Holbrook", st: "AZ", lat: 34.9, lon: -110.2, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "grants-nm", name: "Grants", st: "NM", lat: 35.1, lon: -107.9, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "santa-rosa-nm", name: "Santa Rosa", st: "NM", lat: 34.9, lon: -104.7, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "tucumcari-nm", name: "Tucumcari", st: "NM", lat: 35.2, lon: -103.7, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "vega-tx", name: "Vega", st: "TX", lat: 35.2, lon: -102.4, county: null, pop: null, popNote: null, band: 1, popVerified: false, coordVerified: false, verified: false },
    { id: "shamrock-tx", name: "Shamrock", st: "TX", lat: 35.2, lon: -100.2, county: null, pop: null, popNote: null, band: 1, popVerified: false, coordVerified: false, verified: false },
    { id: "elk-city-ok", name: "Elk City", st: "OK", lat: 35.4, lon: -99.4, county: null, pop: null, popNote: null, band: 3, popVerified: false, coordVerified: false, verified: false },
    { id: "weatherford-ok", name: "Weatherford", st: "OK", lat: 35.5, lon: -98.7, county: null, pop: null, popNote: null, band: 3, popVerified: false, coordVerified: false, verified: false },
    { id: "henryetta-ok", name: "Henryetta", st: "OK", lat: 35.4, lon: -96.0, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "sallisaw-ok", name: "Sallisaw", st: "OK", lat: 35.5, lon: -94.8, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "ozark-ar", name: "Ozark", st: "AR", lat: 35.5, lon: -93.8, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "morrilton-ar", name: "Morrilton", st: "AR", lat: 35.2, lon: -92.7, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "brinkley-ar", name: "Brinkley", st: "AR", lat: 34.9, lon: -91.2, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "lexington-tn", name: "Lexington", st: "TN", lat: 35.7, lon: -88.4, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "camden-tn", name: "Camden", st: "TN", lat: 36.1, lon: -88.1, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "dickson-tn", name: "Dickson", st: "TN", lat: 36.1, lon: -87.4, county: null, pop: null, popNote: null, band: 3, popVerified: false, coordVerified: false, verified: false },
    { id: "crossville-tn", name: "Crossville", st: "TN", lat: 36.0, lon: -85.0, county: null, pop: null, popNote: null, band: 3, popVerified: false, coordVerified: false, verified: false },
    { id: "kingston-tn", name: "Kingston", st: "TN", lat: 35.9, lon: -84.5, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "marion-nc", name: "Marion", st: "NC", lat: 35.7, lon: -82.0, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "mocksville-nc", name: "Mocksville", st: "NC", lat: 35.9, lon: -80.6, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
    { id: "smithfield-nc", name: "Smithfield", st: "NC", lat: 35.5, lon: -78.3, county: null, pop: null, popNote: null, band: 3, popVerified: false, coordVerified: false, verified: false },
    { id: "benson-nc", name: "Benson", st: "NC", lat: 35.4, lon: -78.5, county: null, pop: null, popNote: null, band: 2, popVerified: false, coordVerified: false, verified: false },
  ],
  ruralSrc: ['https://en.wikipedia.org/wiki/List_of_cities_in_Nevada', 'https://en.wikipedia.org/wiki/List_of_municipalities_in_Wyoming', 'https://en.wikipedia.org/wiki/List_of_municipalities_in_Nebraska', 'https://en.wikipedia.org/wiki/List_of_municipalities_in_California', 'https://en.wikipedia.org/wiki/List_of_municipalities_in_Indiana', 'https://en.wikipedia.org/wiki/List_of_municipalities_in_Utah', 'https://en.wikipedia.org/wiki/List_of_cities_in_Iowa', 'https://en.wikipedia.org/wiki/List_of_municipalities_in_Ohio', 'https://en.wikipedia.org/wiki/List_of_towns_and_boroughs_in_Pennsylvania', 'https://en.wikipedia.org/wiki/List_of_municipalities_in_New_Jersey', 'https://en.wikipedia.org/wiki/Susanville,_California'],
  ruralAsof: '2026-10',
  /* rules of the chain (the app shows them to the user) */
  rural: { sites: 13, radiusMi: 60, warnHours: 6, penalty: { 1: 1.5, 2: 6, 3: 15 } },
  /* second path: Mid-southern corridor (I-40 direction) through the southwest, Oklahoma, Arkansas, Tennessee and North Carolina. The start is an assumption. */
  path2: { id: 'mid', label: 'Southern path (I-40 direction)', start: { id: 'boron', name: 'Boron', st: 'CA', lat: 35.0, lon: -117.7 }, note: 'Second path: a line along the I-40 direction, west to east, from the southern California desert to North Carolina. Every town was picked from memory as a small town, populations and coordinates are NOT checked, and land prices were NOT checked.' },
  ruralLabel: 'Rural chain (13 sites, shorter drives)',
  ruralLand: 'Small town; land prices NOT checked. A $2,000 parcel is rare and usually has access, water or building-rule problems. Ask the county.',
  ruralHow: 'How the towns are chosen: 13 points are spaced evenly along the corridor line, both ends included, and each is moved to the nearest small town on the list within 60 miles (smaller towns get a small head start, and a town is never used twice). Leg miles are the straight line between towns x 1.25, at the mph in the Budget. These are rural, low-density areas to scout, not places known to have land for sale.',
  ruralEndNote: 'Both ends are small-town anchors too. The east end sits in the New York commuter belt, where land is often dearer than farther west: you can swap it for a town on the Pennsylvania side (for example Milford or Honesdale) and accept a longer last leg.',
  endNote: 'Both ends of the line sit at big-city centres. Land close to a big city is usually far more expensive than the planning assumption, so the family may shift the first and last site to the nearest rural zone.',
  tiers: [
    { id: 'land', label: 'Land only', d: 'The parcel is yours and legally reachable. Nothing is built.' },
    { id: 'bare', label: 'Bare-bones', d: 'The cheapest possible site: a small poured concrete pad, a prefab shed on it with a solar kit on the roof, a portable power station inside, and a basic fire-safe firepit. No gate, no cabin. Prices come from sourced snapshots, except land, closing and firepit, which are my assumptions.' },
    { id: 'camp', label: 'Camp-ready', d: 'Gate and sign, firepit, portable power station with solar panel, water, safe storage, first aid, camera. Tents or a trailer where the county allows.' },
    { id: 'shed', label: 'Shed', d: 'Camp-ready plus a lockable shed or storage building, so gear stays on site.' },
    { id: 'cabin', label: 'Tiny cabin', d: 'Camp-ready plus a tiny cabin (shell, permits, sanitation). Many parcels and counties do not allow one: check first.' }
  ],
  /* Standard site kit. tier = first tier where the item is needed. line = which budget line pays for it (null = no separate budget line: use the contingency or your own list). */
  kit: [
    { id: 'land', tier: 'land', line: 'land', t: 'Land (the parcel)', d: 'Price is your own assumption until the county and a seller say otherwise. Parcels around $2,000 are often remote, with problems of legal access, water or building rules.' },
    { id: 'closing', tier: 'land', line: 'closing', t: 'Closing costs, title, recording and survey', d: 'Ask a title company or real estate attorney what applies in that state. A boundary survey shows where the corners are and whether the road really reaches the parcel.' },
    { id: 'gate', tier: 'camp', line: 'gate', t: 'Access gate and signage', d: 'A lockable gate or cable where the county allows it, plus a plain "private property" sign. Never block a road other people have a right to use.' },
    { id: 'fire', tier: 'camp', line: 'fire', t: 'Firepit with spark screen and clearance', d: 'Use a ring with a spark screen, clear the ground around it and keep water and a shovel beside it. See the Build tab, Fire section, for the clearance steps. Check local rules and burn bans before every fire.' },
    { id: 'power', tier: 'camp', line: 'kit', t: 'Portable power station and solar panel', d: '__POWER__' },
    { id: 'water', tier: 'camp', line: 'fire', t: 'Water storage', d: 'Food-grade containers with lids. A common emergency-planning rule is about a gallon per person per day for drinking and basic cleaning, so a weekend for four needs roughly 8 to 12 gallons. Treat water of unknown quality before you drink it.' },
    { id: 'critter', tier: 'camp', line: null, t: 'Bear and critter-proof storage', d: 'Food, trash and scented items never stay out. Where bears live, use a bear box or an approved bear-resistant container; elsewhere a locking hard-sided bin keeps raccoons and mice out. Check the state wildlife agency for local advice.' },
    { id: 'firstaid', tier: 'camp', line: null, t: 'First-aid kit', d: 'Stocked for your family, checked for expired items every visit. Know your signal situation and the nearest hospital before the first night.' },
    { id: 'camera', tier: 'camp', line: null, t: 'Trail camera and basic security', d: 'A camera that stores to a card works without signal. Mount it on your own land only and check local rules about cameras. A camera does not stop a theft or call for help.' },
    { id: 'closeup', tier: 'camp', line: null, t: 'Closing-up checklist', d: 'Fire dead out and cold to the touch; food, trash and scented items removed; water drained if freezing is likely; panel and power station stored as the maker says; shed and gate locked; a photo of the site; log the visit in the Passport.' },
    { id: 'shed', tier: 'shed', line: 'shed', t: 'Lockable shed or storage building', d: 'Check with the county whether a shed needs a permit, how big it can be and how far from the property line. Anchored, lockable, off the ground, and clear of vegetation.' },
    { id: 'cabin', tier: 'cabin', line: 'cabin', t: 'Tiny cabin (shell, permits, sanitation)', d: 'Only where the county allows it. Use the Build tab permit path and ask about septic or other sanitation before you count on one.' }
  ],
  /* county questions for the bare-bones site, from SOURCES-barebones.md. No local rule is stated here: every answer comes from the county. */
  permitQuestions: [
    { t: 'Foundation and accessory-structure permits', q: 'Is a building permit needed for a shed of this size, for the concrete slab, or both? Is a separate inspection needed for the foundation?' },
    { t: 'Size thresholds', q: 'What floor-area and height limits apply before a permit is required? Is a shed allowed on a parcel with no main building (zoning for an accessory structure, storage-only or no-habitation limits)?' },
    { t: 'Setbacks and lot limits', q: 'How far must it sit from property lines, septic, wells, easements and floodplain? What is the maximum lot coverage? Frost depth and wind or snow load rules for the foundation and a roof-mounted panel?' },
    { t: 'Solar rules', q: 'Does a solar panel on the shed roof, or a panel wired to a portable power station, need an electrical permit or inspection, even if it is off-grid? Any rules on where a battery or power station may be kept?' },
    { t: 'Fire rules', q: 'Are there fire-district or wildfire-zone rules, burn bans or firepit rules for the parcel? Are any inspections or fees required?' },
    { t: 'Private restrictions', q: 'Do deed restrictions or an HOA limit sheds, solar panels or fires on this parcel?' }
  ],
  lineLabel: { bare: 'Bare-bones site (pad, shed, solar kit, power station)', land: 'Land price', closing: 'Closing, title, recording, survey', gate: 'Gate, signage, access', fire: 'Firepit, tools, water storage', kit: 'Power station + solar panel', shed: 'Shed or storage building (my planning assumption, not a quote)', cabin: 'Tiny cabin shell, permits, sanitation' },
  /* phases: the family's own order of work. link = tab to jump to. */
  phases: [
    { id: 'p0', t: 'Phase 0: Pick the corridor and the savings goal', d: 'Agree on the line, the longest drive day and a number to save toward.', steps: [
      { id: 's1', t: 'Pick the central corridor and a longest drive day (8, 10 or 12 hours)', link: 'coast', lt: 'Coast' },
      { id: 's2', t: 'Agree where the west end starts, and change it if the family wants', link: 'coast', lt: 'Coast' },
      { id: 's3', t: 'Set a savings goal from the Costs numbers (replace the assumptions with real ones as you learn them)', link: 'quests', lt: 'Savings meter' },
      { id: 's4', t: 'Decide who does what: who researches counties, who plans power, who plans meals and safety', link: null }
    ] },
    { id: 'p1', t: 'Phase 1: Scout and visit zones', d: 'Look at the nearest zones from the west end with your own eyes before you buy anything.', steps: [
      { id: 's1', t: 'Scout the first two zones on a map (the Scout here buttons are only starting points)', link: 'map', lt: 'Map' },
      { id: 's2', t: 'Read the state fire and land notes for each zone and call the county with the questions on the Land checklist', link: 'land', lt: 'Land checklist' },
      { id: 's3', t: 'Visit at least one parcel in daylight with the family; check the road, the neighbours and the signal', link: 'land', lt: 'Land checklist' },
      { id: 's4', t: 'Write down what you learned and update the price and closing assumptions', link: 'coast', lt: 'Budget' }
    ] },
    { id: 'p2', t: 'Phase 2: Buy the first parcel near home', d: 'One parcel at the west end, bought slowly and checked carefully.', steps: [
      { id: 's1', t: 'Work through the whole Land checklist for the parcel (access, water, flood, rules, taxes)', link: 'land', lt: 'Land checklist' },
      { id: 's2', t: 'Ask a title company or real estate attorney to explain the closing before you sign anything', link: null },
      { id: 's3', t: 'Close, record, and move the parcel to Owned on the Map tab', link: 'map', lt: 'Map' },
      { id: 's4', t: 'Log the real costs in the savings meter and fix the budget assumptions', link: 'quests', lt: 'Savings meter' }
    ] },
    { id: 'p3', t: 'Phase 3: Camp-ready kit', d: 'Make the site safe and usable for a weekend, with fire safety first.', steps: [
      { id: 's1', t: 'Gate, sign and a clear spot for the tent or trailer', link: null },
      { id: 's2', t: 'Build the firepit with spark screen and clearance; check local rules and burn bans before every fire', link: 'build', lt: 'Build: Fire' },
      { id: 's3', t: 'Size and set up the portable power station and solar panel', link: 'power', lt: 'Power' },
      { id: 's4', t: 'Water, critter-proof storage, first-aid kit and trail camera in place', link: null },
      { id: 's5', t: 'Do a first family weekend and use the closing-up checklist when you leave', link: 'quests', lt: 'Passport' }
    ] },
    { id: 'p4', t: 'Phase 4: Shed', d: 'A lockable place to leave gear so each trip is lighter.', steps: [
      { id: 's1', t: 'Ask the county whether a shed needs a permit and what size and setback rules apply', link: 'build', lt: 'Build: Permit path' },
      { id: 's2', t: 'Place or build a lockable, anchored shed and stock it', link: null },
      { id: 's3', t: 'Update the site checklist and the cost log', link: 'coast', lt: 'Site kit' }
    ] },
    { id: 'p5', t: 'Phase 5: Repeat zone by zone, west to east', d: 'The same steps at the next zone along the line, one at a time.', steps: [
      { id: 's1', t: 'Pick the next open zone on the Coast tab and scout it', link: 'coast', lt: 'Coast' },
      { id: 's2', t: 'Repeat phases 1 to 4 there (scout, buy, camp-ready, shed)', link: 'land', lt: 'Land checklist' },
      { id: 's3', t: 'Drive between sites on a family road trip and log each night in the Passport', link: 'quests', lt: 'Passport' },
      { id: 's4', t: 'Keep going until the line reaches the east end, or stop wherever the family is happy', link: null }
    ] },
    { id: 'p6', t: 'Phase 6: Cabins, one at a time', d: 'Only where the land and county allow it, and only when the savings are ready.', steps: [
      { id: 's1', t: 'Choose the site where a cabin is allowed and the family visits most', link: 'build', lt: 'Build: Permit path' },
      { id: 's2', t: 'Get the permit and sanitation answers in writing before you spend on materials', link: 'build', lt: 'Build' },
      { id: 's3', t: 'Build one cabin, stay in it, and fix what you learn before starting the next', link: 'build', lt: 'Build' }
    ] }
  ]
};
