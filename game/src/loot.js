// Loot: the main target, side loot and safes. Grabbing is a channel — hold E
// near an item and a progress ring fills. Safes take longer and make noise.
// Taking the main target unlocks the getaway door.
import { GRAB_SECONDS, SAFE_SECONDS, NOISE_GRAB_RADIUS, NOISE_SAFE_RADIUS } from './config.js';
import { distance } from './physics.js';
import { guardsHearNoise } from './guards.js';

export function createLoot(def) {
  return {
    x: def.x,
    y: def.y,
    kind: def.kind,
    value: def.value,
    label: def.label,
    taken: false,
    channel: 0,
  };
}

export function nearestLoot(state) {
  let best = null;
  let bestDist = 46;
  for (const item of state.loot) {
    if (item.taken) continue;
    const d = distance(state.thief.x, state.thief.y, item.x, item.y);
    if (d < bestDist) {
      best = item;
      bestDist = d;
    }
  }
  return best;
}

function channelSeconds(item) {
  return item.kind === 'safe' ? SAFE_SECONDS : GRAB_SECONDS;
}

// Advance the grab channel while E is held near `item`. Returns true when
// the item is taken on this step.
export function updateLootChannel(state, item, eHeld, dt) {
  if (!item || item.taken) return false;
  if (!eHeld) {
    item.channel = 0;
    return false;
  }
  item.channel += dt;
  const need = channelSeconds(item);
  if (item.channel < need) return false;
  item.taken = true;
  item.channel = 0;
  state.lootValue += item.value;
  state.message = '+' + item.value + ' — ' + item.label;
  state.messageT = 2;
  const radius = item.kind === 'safe' ? NOISE_SAFE_RADIUS : NOISE_GRAB_RADIUS;
  guardsHearNoise(state.guards, item.x, item.y, radius);
  state.onPickup(item);
  if (item.kind === 'main') {
    for (const door of state.doors) {
      if (door.exit) door.locked = false;
    }
    state.message = 'Got ' + item.label + ' — reach the GETAWAY door!';
    state.messageT = 3;
  }
  return true;
}
