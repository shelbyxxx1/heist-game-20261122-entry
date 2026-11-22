// The thief's tools, each with limited charges per job and a cost: smoke and
// EMP are loud, so using one raises the alarm a little. Q cycles the
// selected tool, Space uses it.
import { ALARM_ON_TOOL, SMOKE_SECONDS, SMOKE_RADIUS, EMP_SECONDS } from './config.js';
import { distance } from './physics.js';

export const TOOL_ORDER = ['lockpick', 'smoke', 'emp'];

export const TOOL_NAMES = {
  lockpick: 'Lockpick',
  smoke: 'Smoke pellet',
  emp: 'EMP burst',
};

export function initialTools() {
  return { lockpick: 3, smoke: 2, emp: 1 };
}

export function cycleTool(state) {
  const idx = TOOL_ORDER.indexOf(state.selectedTool);
  state.selectedTool = TOOL_ORDER[(idx + 1) % TOOL_ORDER.length];
}

// A locked door (not the getaway door) within reach of the thief.
export function nearestLockedDoor(state) {
  let best = null;
  let bestDist = 52;
  for (const door of state.doors) {
    if (!door.locked || door.exit) continue;
    const cx = door.x + door.w / 2;
    const cy = door.y + door.h / 2;
    const d = distance(state.thief.x, state.thief.y, cx, cy);
    if (d < bestDist) {
      best = door;
      bestDist = d;
    }
  }
  return best;
}

export function useTool(state) {
  const tool = state.selectedTool;
  const thief = state.thief;
  if (state.tools[tool] <= 0) {
    state.message = TOOL_NAMES[tool] + ' — none left';
    state.messageT = 1.5;
    return false;
  }
  if (tool === 'lockpick') {
    const door = nearestLockedDoor(state);
    if (!door) {
      state.message = 'No locked door in reach';
      state.messageT = 1.5;
      return false;
    }
    door.locked = false;
    state.tools.lockpick -= 1;
    state.message = 'Door picked — silent';
    state.messageT = 2;
    state.onTool('lockpick');
    return true;
  }
  if (tool === 'smoke') {
    state.clouds.push({ x: thief.x, y: thief.y, r: SMOKE_RADIUS, ttl: SMOKE_SECONDS });
    state.tools.smoke -= 1;
    state.alarm = Math.min(100, state.alarm + ALARM_ON_TOOL);
    state.message = 'Smoke out — eyes off you';
    state.messageT = 2;
    state.onTool('smoke');
    return true;
  }
  // EMP: every camera and laser goes dark for a while.
  for (const cam of state.cameras) cam.disabled = EMP_SECONDS;
  for (const laser of state.lasers) laser.disabled = EMP_SECONDS;
  state.tools.emp -= 1;
  state.alarm = Math.min(100, state.alarm + ALARM_ON_TOOL);
  state.message = 'EMP burst — cameras dark for ' + EMP_SECONDS + 's';
  state.messageT = 2;
  state.onTool('emp');
  return true;
}
