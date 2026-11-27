export const STATE_KEY = 'popaProgressV1';
export const LEGACY_KEY = 'popaWorldV1';
export const FIRST_QUEST_STEPS = ['meet-milli', 'grow-strawberries', 'bake-with-bonnie', 'deliver-cake'];
const clone = value => structuredClone(value);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const identifier = value => typeof value === 'string' && !['constructor', 'prototype', '__proto__'].includes(value) && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,149}$/.test(value);
const count = value => Number.isSafeInteger(value) && value >= 0 && value < 10000000;
const timestamp = value => Number.isSafeInteger(value) && value >= 0;
function require(condition, message) { if (!condition) throw Error(message); }
function quantities(value) {
 require(record(value), 'Invalid inventory');
 for (const [id, amount] of Object.entries(value)) require(identifier(id) && count(amount), 'Invalid item quantity');
}
export function initialState() {
 return {
  version: 1, revision: 0, updatedAt: 0,
  wallet: {coins: 0}, inventory: {},
  home: {rug: false}, appearance: {outfit: 'default'},
  activities: {garden: {best: 0, rounds: 0}, manicure: {lastRewardId: null}},
  story: {
   firstCake: {status: 'not-started', step: 'meet-milli'},
   npcs: {milli: {met: false, dialogues: []}, bonnie: {met: false, dialogues: []}},
  },
  farming: {plots: {}}, recipes: {completed: {}}, receipts: {},
 };
}
export function validateState(state) {
 require(record(state) && state.version === 1, 'Unsupported progress version');
 require(count(state.revision) && timestamp(state.updatedAt), 'Invalid progress revision');
 require(record(state.wallet) && count(state.wallet.coins), 'Invalid wallet');
 quantities(state.inventory);
 require(typeof state.home?.rug === 'boolean' && identifier(state.appearance?.outfit), 'Invalid home or outfit');
 const garden = state.activities?.garden, manicure = state.activities?.manicure;
 require(count(garden?.best) && count(garden?.rounds), 'Invalid garden progress');
 require(manicure && (manicure.lastRewardId === null || identifier(manicure.lastRewardId)), 'Invalid manicure progress');
 const quest = state.story?.firstCake;
 require(quest && ['not-started', 'active', 'completed'].includes(quest.status), 'Invalid quest status');
 require(quest.status === 'completed' ? quest.step === 'completed' : FIRST_QUEST_STEPS.includes(quest.step), 'Invalid quest step');
 require(quest.status !== 'not-started' || quest.step === FIRST_QUEST_STEPS[0], 'Invalid initial quest');
 for (const id of ['milli', 'bonnie']) {
  const npc = state.story.npcs?.[id];
  require(typeof npc?.met === 'boolean' && Array.isArray(npc.dialogues) && npc.dialogues.every(identifier) && new Set(npc.dialogues).size === npc.dialogues.length, 'Invalid NPC progress');
 }
 require(record(state.farming?.plots), 'Invalid farming progress');
 for (const [id, plot] of Object.entries(state.farming.plots)) {
  require(identifier(id) && record(plot) && (plot.crop === null || identifier(plot.crop)), 'Invalid crop');
  require(['empty', 'planted', 'growing', 'ready', 'harvested'].includes(plot.stage), 'Invalid crop stage');
  for (const key of ['plantedAt', 'wateredAt', 'readyAt', 'harvestedAt']) require(plot[key] === null || timestamp(plot[key]), 'Invalid crop timestamp');
  require(plot.stage === 'empty' ? plot.crop === null : identifier(plot.crop) && timestamp(plot.plantedAt), 'Crop state does not match planting data');
  for (const key of ['wateredAt', 'readyAt', 'harvestedAt']) if (plot[key] !== null) require(plot.plantedAt !== null && plot[key] >= plot.plantedAt, 'Crop dates are out of order');
  if (plot.stage === 'harvested') require(timestamp(plot.harvestedAt), 'Harvest timestamp missing');
 }
 if(state.baking!==undefined){
  const b=state.baking;
  require(record(b)&&['prep','mixed','baking','baked','decorated','packed'].includes(b.stage),'Invalid baking stage');
  require(Number.isInteger(b.strawberries)&&b.strawberries>=0&&b.strawberries<=3&&Number.isInteger(b.mixes)&&b.mixes>=0&&b.mixes<=3,'Invalid baking ingredients');
  require(b.readyAt===null||timestamp(b.readyAt),'Invalid baking timer');
  require(b.decoration===null||b.decoration==='strawberry','Invalid cake decoration');
  require(record(b.ingredients)&&['flour','egg','milk'].every(key=>typeof b.ingredients[key]==='boolean'),'Invalid pantry ingredients');
  require((b.mixes===0||b.strawberries===3&&Object.values(b.ingredients).every(Boolean))&&(b.stage!=='prep'||b.mixes<3),'Invalid mixing state');
  require(b.stage==='prep'||b.strawberries===3&&b.mixes===3&&Object.values(b.ingredients).every(Boolean),'Incomplete cake ingredients');
  require(!['baking','baked','decorated','packed'].includes(b.stage)||timestamp(b.readyAt),'Missing oven timer');
  require(!['decorated','packed'].includes(b.stage)||b.decoration==='strawberry','Missing cake decoration');
 }
 quantities(state.recipes?.completed);
 require(record(state.receipts) && Object.entries(state.receipts).every(([id, date]) => identifier(id) && timestamp(date)), 'Invalid reward receipts');
 return state;
}
export function profileOf(state) {
 return {coins: state.wallet.coins, best: state.activities.garden.best, rounds: state.activities.garden.rounds,
  rug: state.home.rug, outfit: state.appearance.outfit, ...(state.activities.manicure.lastRewardId ? {manicureReward: state.activities.manicure.lastRewardId} : {})};
}
export function migrateLegacy(legacy = {}) {
 const state = initialState();
 if (!record(legacy)) return state;
 for (const key of ['coins', 'best', 'rounds']) if (count(legacy[key])) {
  if (key === 'coins') state.wallet.coins = legacy[key]; else state.activities.garden[key] = legacy[key];
 }
 state.home.rug = legacy.rug === true;
 if (identifier(legacy.outfit)) state.appearance.outfit = legacy.outfit;
 if (identifier(legacy.manicureReward) && identifier('manicure:' + legacy.manicureReward)) {
  state.activities.manicure.lastRewardId = legacy.manicureReward;
  state.receipts['manicure:' + legacy.manicureReward] = 0;
 }
 return state;
}
function exchange(state, consume = {}, grant = {}) {
 quantities(consume); quantities(grant);
 for (const [id, amount] of Object.entries(consume)) require((state.inventory[id] ?? 0) >= amount, 'Not enough items: ' + id);
 for (const [id, amount] of Object.entries(consume)) state.inventory[id] -= amount;
 for (const [id, amount] of Object.entries(grant)) state.inventory[id] = (state.inventory[id] ?? 0) + amount;
 for (const id of Object.keys(state.inventory)) if (!state.inventory[id]) delete state.inventory[id];
}
export function applyCommand(state, command) {
 require(record(command), 'Invalid progress command');
 const keys = ['baking', 'consume', 'grant', 'coins', 'npc', 'plot', 'quest', 'recipe', 'manicureReward'];
 require(Object.keys(command).every(key => keys.includes(key)), 'Unknown progress command');
 exchange(state, command.consume, command.grant);
 if (command.coins !== undefined) { require(Number.isSafeInteger(command.coins), 'Invalid coin change'); state.wallet.coins += command.coins; }
 if (command.npc) {
  const {id, dialogue} = command.npc;
  require(['milli', 'bonnie'].includes(id), 'Unknown NPC');
  state.story.npcs[id].met = true;
  if (dialogue !== undefined) {
   require(identifier(dialogue), 'Invalid dialogue');
   if (!state.story.npcs[id].dialogues.includes(dialogue)) state.story.npcs[id].dialogues.push(dialogue);
  }
 }
 if (command.plot) {
  const {id, ...plot} = command.plot; require(identifier(id), 'Invalid plot ID');
  state.farming.plots[id] = clone(plot);
 }
 if (command.baking !== undefined) state.baking=clone(command.baking);
 if (command.recipe !== undefined) {
  require(identifier(command.recipe), 'Invalid recipe');
  state.recipes.completed[command.recipe] = (state.recipes.completed[command.recipe] ?? 0) + 1;
 }
 if (command.quest) {
  const quest = state.story.firstCake;
  if (command.quest.action === 'accept-invitation') {
   require((quest.status === 'not-started' || (quest.status === 'active' && quest.step === 'meet-milli')) && state.story.npcs.milli.met && state.story.npcs.milli.dialogues.includes('first-meeting'), 'First meeting is not complete');
   quest.status = 'active'; quest.step = 'grow-strawberries';
  } else if (command.quest.action === 'start') {
   require(quest.status === 'not-started', 'Quest already started'); quest.status = 'active';
  } else {
   require(command.quest.action === 'complete-step' && quest.status === 'active' && command.quest.expectedStep === quest.step, 'Quest step does not match');
   const next = FIRST_QUEST_STEPS.indexOf(quest.step) + 1;
   quest.step = FIRST_QUEST_STEPS[next] ?? 'completed';
   if (quest.step === 'completed') quest.status = 'completed';
  }
 }
 if (command.manicureReward !== undefined) state.activities.manicure.lastRewardId = command.manicureReward;
 return validateState(state);
}

/** Local adapter. The canonical snapshot is written once per action; legacy is a compatibility mirror. */
export function createProgressStore({storage, now = Date.now} = {}) {
 if (storage === undefined) { try { storage = globalThis.localStorage; } catch { storage = null; } }
 let memory, volatile = false, protectedSave = false;
 const listeners = new Set();
 function read() {
  if (volatile) return clone(memory);
  try {
   const raw = storage?.getItem(STATE_KEY);
   if (raw !== null && raw !== undefined) {
    try { memory = validateState(JSON.parse(raw)); }
    catch { protectedSave = true; volatile = true; memory ??= initialState(); }
   } else {
    let legacy = {}; try { legacy = JSON.parse(storage?.getItem(LEGACY_KEY) ?? '{}'); } catch {}
    memory = migrateLegacy(legacy);
   }
  } catch { protectedSave = true; volatile = true; memory ??= initialState(); }
  return clone(memory);
 }
 function persist(state) {
  memory = clone(state); let persisted = false;
  if (!protectedSave) {
   try { if (storage) { storage.setItem(STATE_KEY, JSON.stringify(state)); persisted = true; volatile = false; } } catch {}
  }
  if (!persisted) volatile = true;
  if (persisted) {
   try {
    let legacy = {}; try { legacy = JSON.parse(storage.getItem(LEGACY_KEY) ?? '{}'); } catch {}
    if (!record(legacy)) legacy = {};
    storage.setItem(LEGACY_KEY, JSON.stringify({...legacy, ...profileOf(state)}));
   } catch { /* The canonical save remains valid if the compatibility mirror fails. */ }
  }
  for (const listener of listeners) { try { listener(clone(state)); } catch {} }
  return persisted;
 }
 function commit(id, mutate) {
  require(identifier(id), 'Invalid action ID'); const state = read();
  if (Object.hasOwn(state.receipts, id)) return {applied: false, persisted: !volatile, state};
  const next = clone(state); mutate(next); next.receipts[id] = now(); next.revision++; next.updatedAt = now(); validateState(next);
  return {applied: true, persisted: persist(next), state: clone(next)};
 }
 return {
  read,
  initialize() { const state = read(); return {state, persisted: persist(state)}; },
  commit(id, command) { return commit(id, state => applyCommand(state, command)); },
  updateProfile(id, update) {
   return commit(id, state => {
    const profile = profileOf(state); update(profile);
    state.wallet.coins = profile.coins; state.activities.garden = {best: profile.best, rounds: profile.rounds};
    state.home.rug = profile.rug; state.appearance.outfit = profile.outfit;
   });
  },
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  exportJSON() { return JSON.stringify(read(), null, 2); },
  importJSON(json) {
   const state = validateState(JSON.parse(json)); read();
   require(!protectedSave, 'Existing save is corrupt or from a newer version; it was not overwritten');
   return {state: clone(state), persisted: persist(state)};
  },
 };
}
