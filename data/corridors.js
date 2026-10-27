/* Expandica coast-to-coast corridors. Written for this app.
   Coordinates are APPROXIMATE CITY CENTRES rounded to 0.1 degree (about 7 miles), well-known cities only.
   They draw a planning line for family scouting. They are not navigation, and nothing here says anything about road conditions.
   Interstate names are only a hint about the general direction of each corridor. */
window.EXC_DATA = {
  asof: '2026-10',
  note: 'Corridors are straight lines between well-known city centres (approximate, rounded to 0.1 degree). Real roads wind, so the app multiplies by 1.25 as a rough road factor. Use a proper map or router for driving, and check road and weather conditions yourself.',
  roadFactor: 1.25,
  defaults: { spacing: 300, radius: 75 },
  limits: { spacingMin: 100, spacingMax: 600 },
  corridors: [
    { id: 'north', name: 'Northern', hint: 'Roughly the I-90 / I-94 direction, Seattle to Boston.', wp: [
      ['Seattle', 'WA', 47.6, -122.3], ['Spokane', 'WA', 47.7, -117.4], ['Missoula', 'MT', 46.9, -114.0], ['Billings', 'MT', 45.8, -108.5], ['Fargo', 'ND', 46.9, -96.8],
      ['Minneapolis', 'MN', 45.0, -93.3], ['Chicago', 'IL', 41.9, -87.6], ['Cleveland', 'OH', 41.5, -81.7], ['Albany', 'NY', 42.7, -73.8], ['Boston', 'MA', 42.4, -71.1]] },
    { id: 'central', name: 'Central', hint: 'Roughly the I-80 direction, San Francisco to New York.', wp: [
      ['San Francisco', 'CA', 37.8, -122.4], ['Reno', 'NV', 39.5, -119.8], ['Salt Lake City', 'UT', 40.8, -111.9], ['Cheyenne', 'WY', 41.1, -104.8], ['Omaha', 'NE', 41.3, -96.0],
      ['Chicago', 'IL', 41.9, -87.6], ['Pittsburgh', 'PA', 40.4, -80.0], ['New York', 'NY', 40.7, -74.0]] },
    { id: 'south', name: 'Southern', hint: 'Roughly the I-10 direction, San Diego to Jacksonville.', wp: [
      ['San Diego', 'CA', 32.7, -117.2], ['Phoenix', 'AZ', 33.4, -112.1], ['Las Cruces', 'NM', 32.3, -106.8], ['El Paso', 'TX', 31.8, -106.5], ['San Antonio', 'TX', 29.4, -98.5],
      ['Houston', 'TX', 29.8, -95.4], ['New Orleans', 'LA', 30.0, -90.1], ['Mobile', 'AL', 30.7, -88.0], ['Tallahassee', 'FL', 30.4, -84.3], ['Jacksonville', 'FL', 30.3, -81.7]] },
    { id: 'mid', name: 'Mid-southern', hint: 'Roughly the I-40 direction, Los Angeles to Raleigh.', wp: [
      ['Los Angeles', 'CA', 34.1, -118.2], ['Flagstaff', 'AZ', 35.2, -111.7], ['Albuquerque', 'NM', 35.1, -106.7], ['Amarillo', 'TX', 35.2, -101.8], ['Oklahoma City', 'OK', 35.5, -97.5],
      ['Memphis', 'TN', 35.1, -90.0], ['Nashville', 'TN', 36.2, -86.8], ['Asheville', 'NC', 35.6, -82.6], ['Raleigh', 'NC', 35.8, -78.6]] }
  ],
  /* Simplified coast lines (lon/lat taken from the same hand-drawn outline as the Map tab) used ONLY by the "both coasts" rule:
     a stop is "on the west coast side" when it is within coastMiles of the Pacific line, "east coast side" when within coastMiles of the Atlantic line.
     The Gulf coast is not counted as the east coast. */
  coastMiles: 150,
  pacific: [[48.4, -124.7], [47.0, -124.1], [46.2, -123.95], [44.5, -124.0], [42.8, -124.5], [41.8, -124.1], [40.4, -124.4], [39.0, -123.8], [38.0, -123.0], [37.5, -122.5], [36.6, -121.9], [35.15, -120.65], [34.45, -120.5], [34.15, -119.2], [33.75, -118.4], [33.1, -117.3], [32.53, -117.1]],
  atlantic: [[44.9, -67.0], [44.3, -68.2], [43.65, -70.2], [42.3, -70.9], [41.5, -71.1], [41.3, -72.0], [40.95, -73.6], [40.4, -74.0], [39.7, -74.1], [38.95, -74.9], [38.4, -75.1], [37.1, -75.9], [36.0, -75.7], [35.25, -75.5], [34.7, -76.5], [33.9, -77.9], [33.3, -79.0], [32.6, -80.0], [31.9, -81.1], [30.7, -81.4], [29.9, -81.3], [28.4, -80.6], [26.8, -80.05], [25.8, -80.15]],
  /* 50 states: code, name, region. Regions are this app's own simple grouping (not Census regions). */
  regions: ['West', 'Mountain', 'Plains', 'Midwest', 'South', 'Northeast'],
  states: [
    ['WA', 'Washington', 'West'], ['OR', 'Oregon', 'West'], ['CA', 'California', 'West'], ['AK', 'Alaska', 'West'], ['HI', 'Hawaii', 'West'],
    ['ID', 'Idaho', 'Mountain'], ['MT', 'Montana', 'Mountain'], ['WY', 'Wyoming', 'Mountain'], ['NV', 'Nevada', 'Mountain'], ['UT', 'Utah', 'Mountain'], ['CO', 'Colorado', 'Mountain'], ['AZ', 'Arizona', 'Mountain'], ['NM', 'New Mexico', 'Mountain'],
    ['ND', 'North Dakota', 'Plains'], ['SD', 'South Dakota', 'Plains'], ['NE', 'Nebraska', 'Plains'], ['KS', 'Kansas', 'Plains'],
    ['MN', 'Minnesota', 'Midwest'], ['IA', 'Iowa', 'Midwest'], ['MO', 'Missouri', 'Midwest'], ['WI', 'Wisconsin', 'Midwest'], ['IL', 'Illinois', 'Midwest'], ['IN', 'Indiana', 'Midwest'], ['MI', 'Michigan', 'Midwest'], ['OH', 'Ohio', 'Midwest'],
    ['TX', 'Texas', 'South'], ['OK', 'Oklahoma', 'South'], ['AR', 'Arkansas', 'South'], ['LA', 'Louisiana', 'South'], ['MS', 'Mississippi', 'South'], ['AL', 'Alabama', 'South'], ['TN', 'Tennessee', 'South'], ['KY', 'Kentucky', 'South'],
    ['GA', 'Georgia', 'South'], ['FL', 'Florida', 'South'], ['SC', 'South Carolina', 'South'], ['NC', 'North Carolina', 'South'], ['VA', 'Virginia', 'South'], ['WV', 'West Virginia', 'South'], ['MD', 'Maryland', 'South'], ['DE', 'Delaware', 'South'],
    ['ME', 'Maine', 'Northeast'], ['NH', 'New Hampshire', 'Northeast'], ['VT', 'Vermont', 'Northeast'], ['MA', 'Massachusetts', 'Northeast'], ['RI', 'Rhode Island', 'Northeast'], ['CT', 'Connecticut', 'Northeast'], ['NY', 'New York', 'Northeast'], ['NJ', 'New Jersey', 'Northeast'], ['PA', 'Pennsylvania', 'Northeast']
  ],
  quests: [
    { id: 'coastpick', grp: 'trip', kind: 'once', xp: 30, t: 'Pick your coast-to-coast corridor', d: 'Open the Coast tab, look at the four corridors together and choose the one the family likes best.' },
    { id: 'coastday', grp: 'trip', kind: 'once', xp: 20, t: 'Agree on one day of driving', d: 'Ask each child how long they can ride happily, then set the stop spacing on the Coast tab to match.' },
    { id: 'coastscout', grp: 'trip', kind: 'once', xp: 40, t: 'Scout a stop in the open zone', d: 'Use Scout here on the next open zone and look at it on a map together. It is only a starting point.' },
    { id: 'coaststates', grp: 'trip', kind: 'once', xp: 25, t: 'Name the states on your corridor', d: 'Find every state your chosen line crosses on the States panel and say one thing you would like to see in each.' }
  ]
};
