// Guard patrol AI: PATROL the waypoint loop, SUSPICIOUS when the thief is
// glimpsed, ALERT to chase the last seen position, SEARCH the spot, then
// back to PATROL. A guard that reaches the thief while alert catches them.
import {
  GUARD_FOV_HALF,
  GUARD_RANGE,
  GUARD_SUSPICION_SECONDS,
  GUARD_CATCH_RADIUS,
  GUARD_SPEED,
  THIEF_RADIUS,
} from './config.js';
import { angleTo, angleDiff, distance, moveCircle } from './physics.js';
import { canSee } from './vision.js';

export function createGuard(def, jobIndex, rng) {
  const start = def.waypoints[0];
  const jitter = rng ? (rng() - 0.5) * 10 : 0;
  return {
    name: def.name,
    x: start.x + jitter,
    y: start.y + jitter,
    waypoints: def.waypoints,
    wpIndex: 1,
    pauseT: 0,
    speed: GUARD_SPEED[jobIndex],
    facing: Math.PI / 2,
    state: 'patrol',
    suspicion: 0,
    lastSeen: null,
    searchT: 0,
    scanT: 0,
  };
}

function walkToward(g, tx, ty, dt, solids) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 2) return true;
  const step = Math.min(dist, g.speed * dt);
  g.facing = angleTo(g.x, g.y, tx, ty);
  moveCircle(g, (dx / dist) * step, (dy / dist) * step, 12, solids);
  return dist - step < 2;
}

function investigate(g, x, y) {
  if (g.state === 'alert') return;
  g.lastSeen = { x, y };
  if (g.state !== 'suspicious') g.state = 'suspicious';
  g.suspicion = Math.max(g.suspicion, 0.4);
}

// A noise event draws every guard in earshot to look at the spot.
export function guardsHearNoise(guards, x, y, radius) {
  for (const g of guards) {
    if (distance(g.x, g.y, x, y) <= radius) investigate(g, x, y);
  }
}

export function updateGuard(g, state, dt) {
  const thief = state.thief;
  const solids = state.solids;
  const clouds = state.clouds;
  const sees = canSee(g, thief.x, thief.y, g.facing, GUARD_FOV_HALF, GUARD_RANGE, solids, clouds);

  if (sees) {
    g.suspicion += dt / GUARD_SUSPICION_SECONDS;
    g.lastSeen = { x: thief.x, y: thief.y };
    state.spotted = true;
    if (g.suspicion >= 1 && g.state !== 'alert') {
      g.state = 'alert';
      g.searchT = 0;
      state.alarm = Math.min(100, state.alarm + 20);
      state.message = g.name + ' raised the alarm!';
      state.messageT = 2.5;
      state.onAlert(g);
    }
  } else {
    g.suspicion = Math.max(0, g.suspicion - dt * 0.5);
  }

  if (g.state === 'patrol') {
    if (g.suspicion >= 0.4) {
      g.state = 'suspicious';
      g.scanT = 0;
    } else if (g.pauseT > 0) {
      g.pauseT -= dt;
      g.facing += dt * 0.9;
    } else {
      const target = g.waypoints[g.wpIndex];
      if (walkToward(g, target.x, target.y, dt, solids)) {
        g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
        g.pauseT = 0.8;
      }
    }
  } else if (g.state === 'suspicious') {
    if (g.suspicion >= 1) {
      g.state = 'alert';
    } else if (g.lastSeen) {
      const arrived = walkToward(g, g.lastSeen.x, g.lastSeen.y, dt, solids);
      if (arrived) {
        g.state = 'search';
        g.searchT = 3;
      }
    } else {
      g.scanT += dt;
      g.facing += dt * 1.4;
      if (g.scanT > 2) {
        g.state = 'patrol';
        g.suspicion = 0;
      }
    }
  } else if (g.state === 'alert') {
    if (g.lastSeen) {
      const arrived = walkToward(g, g.lastSeen.x, g.lastSeen.y, dt * 1.35, solids);
      if (arrived || !sees) {
        if (!sees) {
          g.state = 'search';
          g.searchT = 3;
        }
      }
    }
    if (distance(g.x, g.y, thief.x, thief.y) < GUARD_CATCH_RADIUS + THIEF_RADIUS) {
      state.caughtBy = g.name + ' caught Wren';
      state.screen = 'busted';
      state.onBusted();
    }
  } else if (g.state === 'search') {
    g.searchT -= dt;
    g.facing += dt * 2.2;
    if (g.searchT <= 0) {
      g.state = 'patrol';
      g.suspicion = 0;
      g.lastSeen = null;
    }
  }
}
