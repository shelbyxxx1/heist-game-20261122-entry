// Deterministic screenshot scenes. Each shot plays the real rules forward
// from a fresh world for a fixed number of steps, steered by a simple
// autopilot (head for the next objective, keep out of the cones, grab loot
// when safe), so the frame is what a short game really looks like — and the
// same seed always gives the same frame.
import { GUARD_FOV_HALF, GUARD_RANGE, CAMERA_FOV_HALF, CAMERA_RANGE } from './config.js';
import { distance, angleTo } from './physics.js';
import { inCone, canSee } from './vision.js';
import { createJobState, stepGame, refreshSolids } from './game.js';
import { nearestLoot } from './loot.js';
import { nearestLockedDoor, useTool } from './tools.js';

const STEP = 1 / 60;

function dangerAt(state, x, y) {
  let danger = 0;
  for (const g of state.guards) {
    if (inCone(x, y, g, g.facing, GUARD_FOV_HALF, GUARD_RANGE)) danger += 2;
    if (canSee(g, x, y, g.facing, GUARD_FOV_HALF, GUARD_RANGE, state.solids, state.clouds)) danger += 5;
  }
  for (const cam of state.cameras) {
    if (cam.disabled <= 0 && inCone(x, y, cam, cam.facing, CAMERA_FOV_HALF, CAMERA_RANGE)) danger += 2;
  }
  return danger;
}

// Steer toward the next objective, preferring steps that stay out of cones.
export function autopilotInput(state) {
  const thief = state.thief;
  const target = nearestLoot(state) || { x: 640, y: 460 };
  const input = { up: false, down: false, left: false, right: false, sneak: false, e: false, useTool: false };

  const door = nearestLockedDoor(state);
  if (door) {
    const cx = door.x + door.w / 2;
    const cy = door.y + door.h / 2;
    if (distance(thief.x, thief.y, cx, cy) < 52 && state.tools.lockpick > 0) {
      input.useTool = true;
      state.selectedTool = 'lockpick';
      return input;
    }
  }

  if (distance(thief.x, thief.y, target.x, target.y) < 40) {
    input.e = true;
    return input;
  }

  const want = angleTo(thief.x, thief.y, target.x, target.y);
  let bestAngle = want;
  let bestScore = -Infinity;
  for (let k = -4; k <= 4; k += 1) {
    const a = want + (k * Math.PI) / 8;
    const nx = thief.x + Math.cos(a) * 24;
    const ny = thief.y + Math.sin(a) * 24;
    const progress = Math.cos(a - want);
    const score = progress * 2 - dangerAt(state, nx, ny);
    if (score > bestScore) {
      bestScore = score;
      bestAngle = a;
    }
  }
  const dx = Math.cos(bestAngle);
  const dy = Math.sin(bestAngle);
  if (dx > 0.3) input.right = true;
  if (dx < -0.3) input.left = true;
  if (dy > 0.3) input.down = true;
  if (dy < -0.3) input.up = true;

  const nearGuard = state.guards.some((g) => distance(g.x, g.y, thief.x, thief.y) < 170);
  input.sneak = nearGuard;
  return input;
}

export const SHOTS = [
  { name: 'cover', job: 1, seconds: 26 },
  { name: 'brief', job: 0, seconds: 0 },
  { name: 'close', job: 1, until: 'suspicion' },
  { name: 'escape', job: 1, until: 'exit' },
];

export function stageShot(name, seed) {
  const shot = SHOTS.find((s) => s.name === name) || SHOTS[0];
  const state = createJobState(shot.job, seed);
  if (shot.name === 'brief') {
    state.screen = 'brief';
    return state;
  }
  state.screen = 'play';
  const maxSteps = shot.until ? 60 * 95 : Math.round(shot.seconds * 60);
  for (let i = 0; i < maxSteps; i += 1) {
    if (state.screen !== 'play') break;
    if (shot.until === 'suspicion' && state.guards.some((g) => g.suspicion >= 0.45)) break;
    if (shot.until === 'exit') {
      const mainTaken = state.loot.some((l) => l.kind === 'main' && l.taken);
      if (mainTaken && distance(state.thief.x, state.thief.y, 640, 462) < 150) break;
    }
    const input = autopilotInput(state);
    if (input.useTool && useTool(state)) refreshSolids(state);
    stepGame(state, input, STEP);
  }
  return state;
}
