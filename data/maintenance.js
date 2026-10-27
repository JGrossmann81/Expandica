/* Expandica Care presets (EXB). General reminders written for this app in conservative wording; they are prompts, not instructions
   for any particular building, and carry no prices, tax rules or legal deadlines. "m" is only a starting month the person is asked to confirm. */
window.EXB_MAINT = {
  every: [['once', 'One time'], ['monthly', 'Every month'], ['3', 'Every 3 months'], ['6', 'Every 6 months'], ['12', 'Every year']],
  presets: [
    { id: 'close', t: 'Close up for winter', kind: 'task', every: '12', m: 10, d: 'Run the Closing up list in Kits. Anything that can freeze, hold water or attract animals needs a plan. Follow the advice for your climate and building.' },
    { id: 'open', t: 'Spring open-up', kind: 'task', every: '12', m: 4, d: 'Walk the site and the cabin before first use. Look for storm, water, animal and tree damage. Re-test alarms and look over the fire pit area.' },
    { id: 'alarms', t: 'Smoke and CO alarm test', kind: 'task', every: 'monthly', m: null, d: 'Press the test button on every alarm. Replace batteries and any alarm past the date printed on it, following the maker\'s instructions.' },
    { id: 'battery', t: 'Battery care and storage charge level', kind: 'task', every: '3', m: null, d: 'Check the manufacturer\'s guidance for the portable power station and any other batteries: storage charge level, how often to top up, and safe storage temperatures. Store them as the maker says.' },
    { id: 'wood', t: 'Firewood stack check', kind: 'task', every: '6', m: null, d: 'Check the stack is stable, off the ground and kept clear of the cabin, as your local fire guidance asks. Look for rot, mold and pests.' },
    { id: 'defensible', t: 'Defensible-space clearing before fire season', kind: 'task', every: '12', m: 4, d: 'Ask your local fire district when fire season starts and what clearance they expect around buildings, then clear dry brush and debris before it. The month here is only a starting point.' },
    { id: 'road', t: 'Road and gate check', kind: 'task', every: '6', m: null, d: 'Check the access road, culverts, gate and lock after storms and thaws. Make sure a fire truck or tow could still get in.' },
    { id: 'tax', t: 'Property tax due', kind: 'bill', every: '12', m: null, d: 'Take the due date from your county tax notice or website and type it in. The amount is optional and is yours to enter.' },
    { id: 'insurance', t: 'Insurance renewal', kind: 'bill', every: '12', m: null, d: 'Set this to your policy renewal date. Read the notice and compare coverage before it renews. The amount is optional and is yours to enter.' },
    { id: 'firepit', t: 'Fire pit and spark screen check', kind: 'task', every: '12', m: 4, d: 'Check the ring or pit for cracks, the spark screen for holes, and the ground around it for fuel. Check what fires are allowed now before you light one.' }
  ]
};
