// ClassLingo — trade/safety vocabulary presets.
// Loaded as a classic <script> by teach.html (exposes window.VOCAB_PRESETS).
//
// When the instructor picks a mode, teach.html sends the mode id + terms to
// POST /api/session {action:"mode"}; the server stores them on the session
// doc and injects them into every OpenAI translation prompt for the class:
//   "You are translating for a [MODE] training class. Use accurate trade
//    terminology in [TARGET_LANGUAGE]. Key terms: [TERM_LIST]."
//
// To add a mode: add an entry here AND add an <option> to the mode <select>
// in teach.html. To extend a mode, just add terms to its list.
window.VOCAB_PRESETS = {
  general: {
    label: 'General',
    prompt: 'workforce training',
    terms: [],
  },
  osha: {
    label: 'OSHA / Safety',
    prompt: 'OSHA workplace safety',
    terms: [
      'PPE (personal protective equipment)', 'hazard', 'incident report',
      'lockout/tagout (LOTO)', 'SDS / MSDS (safety data sheet)',
      'fall protection', 'confined space', 'guardrail', 'harness', 'lanyard',
      'anchor point', 'scaffold', 'ladder safety', 'trench', 'excavation',
      'competent person', 'near miss', 'OSHA', 'citation', 'housekeeping',
      'fire extinguisher', 'first aid', 'evacuation route', 'hearing protection',
      'respirator', 'silica dust', 'asbestos', 'hazcom (hazard communication)',
      'permit-required', 'toolbox talk', 'jobsite', 'exposure limit',
    ],
  },
  trades: {
    label: 'Construction / Trades',
    prompt: 'construction trades',
    terms: [
      'scaffold', 'foreman', 'blueprint', 'conduit', 'rebar', 'plumb',
      'level', 'grade', 'stud', 'joist', 'beam', 'footing', 'formwork',
      'aggregate', 'slab', 'sheathing', 'drywall', 'framing', 'truss',
      'apprentice', 'journeyman', 'punch list', 'change order', 'RFI',
      'square (check for square)', 'chalk line', 'circular saw', 'drill',
      'fastener', 'torque', 'caulk', 'flashing', 'vapor barrier',
      'load-bearing', 'on center (OC)', 'elevation', 'site plan',
    ],
  },
  forklift: {
    label: 'Forklift / BFET',
    prompt: 'forklift operation and warehouse (BFET)',
    terms: [
      'counterbalance', 'load capacity', 'tilt', 'mast', 'pallet', 'dock',
      'spotter', 'forks', 'load center', 'data plate', 'stability triangle',
      'overhead guard', 'pallet jack', 'dock plate', 'trailer', 'racking',
      'aisle', 'pedestrian', 'horn', 'pre-operation inspection', 'propane',
      'battery charging', 'tip-over', 'seat belt', 'attachment', 'side shift',
      'travel with load low', 'blind corner', 'wheel chock', 'certification',
    ],
  },
  flagging: {
    label: 'Flagging',
    prompt: 'traffic control flagging',
    terms: [
      'flagger', 'traffic control', 'stop/slow paddle', 'cone', 'work zone',
      'pilot car', 'taper', 'buffer zone', 'advance warning sign',
      'high-visibility vest', 'hard hat', 'two-way radio', 'escape route',
      'lane closure', 'shoulder', 'oncoming traffic', 'queue', 'detour',
      'barricade', 'channelizing device', 'MUTCD', 'night work', 'flagging station',
      'stop position', 'release traffic', 'one-lane road', 'posted speed',
    ],
  },
};
