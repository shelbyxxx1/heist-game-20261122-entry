// The game itself, DOM-free: build a job's state and step it forward. The
// browser shell (main.js) and the screenshot stager (shots.js) both run on
// this module, and a node smoke test can import it too.
import {
  ALARM_MAX,
  ALARM_DECAY,
  NOISE_RUN_RADIUS,
  THIEF_RADIUS,
  THIEF_SPEED,
  SNEAK_MULTIPLIER,
} from './config.js';
import { makeRng } from './random.js';
import { JOBS } from './levels.js';
import { moveCircle, distance } from './physics.js';
import { createGuard, updateGuard, guardsHearNoise } from './guards.js';
import { createCamera, updateCamera } from './cameras.js';
import { createLaser, updateLaser } from './lasers.js';
import { createLoot, nearestLoot, updateLootChannel } from './loot.js';
import { initialTools } from './tools.js';

export function createJobState(jobIndex, seed) {
  const job = JOBS[jobIndex];
  const rng = makeRng(seed);
  const state = {
    jobIndex,
    job,
    seed,
    rng,
    thief: {
      x: job.thiefStart.x,
      y: job.thiefStart.y,
      dir: -Math.PI / 2,
      sneaking: false,
    },
    guards: job.guards.map((g) => createGuard(g, jobIndex, rng)),
    cameras: job.cameras.map((c) => createCamera(c)),
    lasers: job.lasers.map((l) => createLaser(l)),
    loot: job.loot.map((l) => createLoot(l)),
    doors: job.doors.map((d) => ({ ...d })),
    clouds: [],
    alarm: 0,
    lootValue: 0,
    time: 0,
    tools: initialTools(),
    selectedTool: 'lockpick',
    spotted: false,
    mainTaken: false,
    screen: 'brief',
    caughtBy: '',
    message: '',
    messageT: 0,
    jobScore: 0,
    totalScore: 0,
    jobScores: [],
    noiseT: 0,
    // Sound hooks: the browser shell replaces these; the smoke test leaves
    // them as no-ops so the logic stays DOM-free.
    onAlert: () => {},
    onPickup: () => {},
    onTool: () => {},
    onBusted: () => {},
    onWin: () => {},
  };
  state.solids = computeSolids(state);
  return state;
}

export function computeSolids(state) {
  const solids = state.job.walls.concat(state.job.cover);
  for (const door of state.doors) {
    if (door.locked && !door.exit) solids.push(door);
  }
  return solids;
}

function jobScore(state) {
  const timeBonus = Math.max(0, Math.round((state.job.parSeconds - state.time) * 10));
  const ghostBonus = state.spotted ? 0 : 500;
  return state.lootValue + timeBonus + ghostBonus;
}

export function stepGame(state, input, dt) {
  if (state.screen !== 'play') return;
  state.time += dt;
  if (state.messageT > 0) state.messageT -= dt;

  // Smoke clouds burn down.
  for (let i = state.clouds.length - 1; i >= 0; i -= 1) {
    state.clouds[i].ttl -= dt;
    if (state.clouds[i].ttl <= 0) state.clouds.splice(i, 1);
  }

  // Move the thief.
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const moving = dx !== 0 || dy !== 0;
  if (moving) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
    const speed = THIEF_SPEED * (input.sneak ? SNEAK_MULTIPLIER : 1) * dt;
    state.thief.dir = Math.atan2(dy, dx);
    state.thief.sneaking = !!input.sneak;
    moveCircle(state.thief, dx * speed, dy * speed, THIEF_RADIUS, state.solids);
    if (!input.sneak) {
      state.noiseT += dt;
      if (state.noiseT >= 0.4) {
        state.noiseT = 0;
        guardsHearNoise(state.guards, state.thief.x, state.thief.y, NOISE_RUN_RADIUS);
      }
    }
  } else {
    state.thief.sneaking = !!input.sneak;
  }

  // Grab channel: hold E near loot.
  const loot = nearestLoot(state);
  updateLootChannel(state, loot, !!input.e, dt);
  state.mainTaken = state.loot.some((l) => l.kind === 'main' && l.taken);

  // The crew.
  for (const guard of state.guards) {
    updateGuard(guard, state, dt);
    if (state.screen !== 'play') return;
  }
  let cameraSees = false;
  for (const cam of state.cameras) {
    if (updateCamera(cam, state, dt)) cameraSees = true;
  }
  for (const laser of state.lasers) updateLaser(laser, state, dt);

  // The alarm decays only while nobody is watching.
  const anyAlert = state.guards.some((g) => g.state === 'alert');
  if (!anyAlert && !cameraSees) {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY[state.jobIndex] * dt);
  }

  // Lockdown at full alarm.
  if (state.alarm >= ALARM_MAX) {
    state.alarm = ALARM_MAX;
    state.caughtBy = 'Lockdown — the alarm hit 100';
    state.screen = 'busted';
    state.onBusted();
    return;
  }

  // Getaway: main loot taken and the thief reaches the open exit door.
  if (state.mainTaken) {
    for (const door of state.doors) {
      if (!door.exit || door.locked) continue;
      const cx = door.x + door.w / 2;
      const cy = door.y + door.h / 2;
      if (distance(state.thief.x, state.thief.y, cx, cy) < 34) {
        state.jobScore = jobScore(state);
        state.jobScores.push(state.jobScore);
        state.totalScore = state.jobScores.reduce((a, b) => a + b, 0);
        state.screen = 'complete';
        state.onWin();
        return;
      }
    }
  }
}

// Recompute which doors are solid after a lockpick (the vault door opens).
export function refreshSolids(state) {
  state.solids = computeSolids(state);
}
