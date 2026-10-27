/* Expandica family quests, levels and welcome text. Written for this app (no outside facts).
   Quest: {id, t: title, d: how, xp, kind:'once'|'season', season?:'spring'|'summer'|'fall'|'winter', grp} */
window.EXQ_DATA = {
  groups: { land: 'On the land', safe: 'Safety and skills', money: 'Money habits', build: 'Cabin and stop', trip: 'Road trip', season: 'Seasonal' },
  levels: [
    { n: 1, name: 'Seedling', xp: 0 }, { n: 2, name: 'Trail Scout', xp: 60 }, { n: 3, name: 'Surveyor', xp: 160 },
    { n: 4, name: 'Landholder', xp: 340 }, { n: 5, name: 'Cabin Builder', xp: 620 }, { n: 6, name: 'Stop Keeper', xp: 980 },
    { n: 7, name: 'Pathfinder', xp: 1450 }, { n: 8, name: 'Land Steward', xp: 2100 }, { n: 9, name: 'Homestead Legend', xp: 3000 }
  ],
  welcome: [
    'Scout: find small parcels you might love and save them on the Map and Land tabs.',
    'Visit: walk each one as a family and finish the due-diligence checklist.',
    'Own: only after the county, the paperwork and a licensed professional agree, then size the power.',
    'Build: plan the small cabin with a firepit, a solar panel and a portable power station.',
    'Open a stop: spend a night, stamp the passport, and link it into your family road trip.'
  ],
  note: 'Expandica is a family planning tool and a game. It is not legal, tax, financial, surveying or engineering advice, and it never says a parcel is a good buy. Prices, taxes and rules come from your county and licensed professionals, so check there first.',
  noteLink: { label: 'Find your county and state offices (USA.gov)', url: 'https://www.usa.gov/local-governments' },
  quests: [
    { id: 'visit3', grp: 'land', kind: 'once', xp: 40, t: 'Visit 3 candidate parcels', d: 'Walk each one with the family and take photos.' },
    { id: 'county', grp: 'land', kind: 'once', xp: 30, t: 'Take the kids to the county planning office', d: 'Ask what a small cabin on a parcel like yours would need. Write down who you spoke to.' },
    { id: 'assessor', grp: 'land', kind: 'once', xp: 20, t: 'Find a parcel on the county map together', d: 'Look it up on the county parcel viewer and spot the boundaries and the road.' },
    { id: 'neighbor', grp: 'land', kind: 'once', xp: 25, t: 'Say hello to a neighbor near a parcel', d: 'Ask what the area is like in every season.' },
    { id: 'road', grp: 'land', kind: 'once', xp: 25, t: 'Drive the access road and think about rainy days', d: 'Could you still get in and out after heavy rain or snow?' },
    { id: 'stars', grp: 'land', kind: 'once', xp: 60, t: 'Spend a night under the stars on the land', d: 'Only where you have the owner\'s permission. Log it in the Stop Passport.' },
    { id: 'sunwalk', grp: 'land', kind: 'once', xp: 30, t: 'Walk the lot at sunrise and sunset', d: 'Mark where the sun lands and where the shade falls.' },
    { id: 'drawmap', grp: 'land', kind: 'once', xp: 30, t: 'Draw a hand map of a parcel', d: 'Each child adds one thing: a tree, a rock, a view.' },
    { id: 'nameit', grp: 'land', kind: 'once', xp: 15, t: 'Let every child give a parcel a nickname', d: 'Add the nickname in the parcel notes.' },
    { id: 'photos10', grp: 'land', kind: 'once', xp: 20, t: 'Take 10 photos of one parcel from different spots', d: 'Include the road, the neighbors\' view and the ground.' },
    { id: 'fire', grp: 'safe', kind: 'once', xp: 40, t: 'Teach each child a fire safety rule', d: 'For example: never leave a fire alone, and keep water close by.' },
    { id: 'aid', grp: 'safe', kind: 'once', xp: 30, t: 'Pack and check a first-aid kit together', d: 'Everyone learns where it is and what is in it.' },
    { id: 'firepit', grp: 'safe', kind: 'once', xp: 35, t: 'Choose the firepit spot together', d: 'Talk about what must be cleared around it and what the local fire rules say.' },
    { id: 'meet', grp: 'safe', kind: 'once', xp: 20, t: 'Pick a family meeting spot and a whistle signal', d: 'Practice it once, at a park if you like.' },
    { id: 'compass', grp: 'safe', kind: 'once', xp: 30, t: 'Teach each child to find north', d: 'Use a compass, then check it against the sun.' },
    { id: 'water', grp: 'safe', kind: 'once', xp: 25, t: 'Plan the water for a night', d: 'How much would you carry, and how would you treat more?' },
    { id: 'tools', grp: 'safe', kind: 'once', xp: 25, t: 'Teach a child to use one hand tool safely', d: 'An adult supervises the whole time.' },
    { id: 'solar', grp: 'build', kind: 'once', xp: 35, t: 'Let a child set up the solar panel in the sun', d: 'Watch the portable power station charge and read its screen.' },
    { id: 'watts', grp: 'build', kind: 'once', xp: 25, t: 'Add up the watts you would run', d: 'A child reads the labels while you total them on the Power tab.' },
    { id: 'floor', grp: 'build', kind: 'once', xp: 35, t: 'Sketch the cabin floor plan with the kids', d: 'Each child draws one room or corner they want.' },
    { id: 'bunks', grp: 'build', kind: 'once', xp: 15, t: 'Decide who sleeps where in the cabin', d: 'Argue politely, then vote.' },
    { id: 'sign', grp: 'build', kind: 'once', xp: 25, t: 'Make a welcome sign for your first stop', d: 'Paint it, carve it or print it.' },
    { id: 'logbook', grp: 'build', kind: 'once', xp: 20, t: 'Start a guest logbook for the stop', d: 'A notebook kept in a dry box is enough.' },
    { id: 'goal', grp: 'money', kind: 'once', xp: 30, t: 'Set a savings goal and a target date as a family', d: 'Use the Savings page in this tab.' },
    { id: 'jar', grp: 'money', kind: 'once', xp: 20, t: 'Start a land fund jar', d: 'Each child adds a coin or a chore reward, then log it.' },
    { id: 'budget', grp: 'money', kind: 'once', xp: 20, t: 'Look at your own monthly budget together', d: 'See what fits comfortably. Only you know that.' },
    { id: 'route', grp: 'trip', kind: 'once', xp: 40, t: 'Plan a road trip route linking two parcels', d: 'Check the circuit on the Map tab and share it with Roadtripica.' },
    { id: 'firstnight', grp: 'trip', kind: 'once', xp: 40, t: 'Log your first night in the Stop Passport', d: 'Take a photo and write one line about it.' },
    { id: 'constel', grp: 'trip', kind: 'once', xp: 25, t: 'Name three constellations from a stop', d: 'Any clear night will do.' },
    { id: 'spring', grp: 'season', kind: 'season', season: 'spring', xp: 30, t: 'Spring: see where the water runs', d: 'Walk a parcel after rain or snowmelt and note low, wet spots.' },
    { id: 'summer', grp: 'season', kind: 'season', season: 'summer', xp: 30, t: 'Summer: find the midday shade', d: 'Note where the family would rest when it is hot, and how the sun moves.' },
    { id: 'fall', grp: 'season', kind: 'season', season: 'fall', xp: 30, t: 'Fall: notice the wind and the dry brush', d: 'Where does the wind come from, and where do leaves and dry growth collect?' },
    { id: 'winter', grp: 'season', kind: 'season', season: 'winter', xp: 30, t: 'Winter: look at the access in mud or snow', d: 'Photograph the road and note how you would get in and out.' }
  ],
  scoutPrompts: ['What I like', 'What worries me']
};
