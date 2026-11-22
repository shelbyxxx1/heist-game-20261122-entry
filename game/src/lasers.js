// Laser beams: thin red lines across a doorway or corridor that blink on a
// timer. Crossing a live beam trips the alarm and pings the nearest guard.
// EMP switches them off with the cameras.
import { ALARM_ON_LASER } from './config.js';
import { distance } from './physics.js';
import { guardsHearNoise } from './guards.js';

export function createLaser(def) {
  return {
    x1: def.x1,
    y1: def.y1,
    x2: def.x2,
    y2: def.y2,
    period: def.period,
    phase: def.phase,
    t: def.phase,
    on: true,
    disabled: 0,
    cooldown: 0,
  };
}

function pointNearSegment(px, py, x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  const ox = px - cx;
  const oy = py - cy;
  return ox * ox + oy * oy < r * r;
}

export function updateLaser(laser, state, dt) {
  if (laser.disabled > 0) {
    laser.disabled -= dt;
    laser.on = false;
    return;
  }
  laser.t += dt;
  laser.on = (laser.t % laser.period) < laser.period * 0.6;
  if (laser.cooldown > 0) laser.cooldown -= dt;
  if (!laser.on || laser.cooldown > 0) return;
  const thief = state.thief;
  if (pointNearSegment(thief.x, thief.y, laser.x1, laser.y1, laser.x2, laser.y2, 14)) {
    laser.cooldown = 1.5;
    state.alarm = Math.min(100, state.alarm + ALARM_ON_LASER);
    state.message = 'Laser tripped!';
    state.messageT = 2;
    state.spotted = true;
    guardsHearNoise(state.guards, thief.x, thief.y, 220);
  }
}

export function nearestGuardDistance(state, x, y) {
  let best = Infinity;
  for (const g of state.guards) best = Math.min(best, distance(g.x, g.y, x, y));
  return best;
}
