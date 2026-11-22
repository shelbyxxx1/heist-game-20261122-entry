// Deterministic screenshot scenes. Each shot plays the real rules forward
// from a fresh world for a fixed number of steps, steered by an autopilot
// that pathfinds to the next objective (a coarse grid BFS around the walls),
// sneaks near guards and grabs loot when safe — so the frame is what a
// short game really looks like, and the same seed always gives the same frame.
import { GUARD_FOV_HALF, GUARD_RANGE, CAMERA_FOV_HALF, CAMERA_RANGE } from './config.js';
import { distance, angleTo, circleHitsAny } from './physics.js';
import { inCone, canSee, segmentHitsRect } from './vision.js';
import { createJobState, stepGame, refreshSolids } from './game.js';
import { nearestLockedDoor, useTool } from './tools.js';

const STEP = 1 / 60;
const CELL = 40;
const COLS = 32;
const ROWS = 12;

function cellBlocked(state, cx, cy) {
  const x = cx * CELL + CELL / 2;
  const y = cy * CELL + CELL / 2;
  if (y < 56 || y > 474 || x < 8 || x > 1272) return true;
  return circleHitsAny(x, y, 13, state.solids);
}

// Can the thief walk the straight line between two cell centres? A wall
// between the cells blocks the step even when both centres are clear of it
// (a 10 px wall between 40 px cells), so test the segment against every
// solid grown by the thief's radius.
function stepBlocked(state, x1, y1, x2, y2) {
  for (const s of state.solids) {
    const grown = { x: s.x - 13, y: s.y - 13, w: s.w + 26, h: s.h + 26 };
    if (segmentHitsRect(x1, y1, x2, y2, grown)) return true;
  }
  return false;
}

function cellOf(x, y) {
  return { cx: Math.max(0, Math.min(COLS - 1, Math.floor(x / CELL))), cy: Math.max(0, Math.min(ROWS - 1, Math.floor(y / CELL))) };
}

// Shortest path (4-neighbourhood BFS) from the thief to (tx, ty) as a list
// of cell centres, or null when no route exists (a locked door in the way).
export function findPath(state, tx, ty) {
  const startCell = cellOf(state.thief.x, state.thief.y);
  const goal = cellOf(tx, ty);
  const key = (cx, cy) => cy * COLS + cx;
  const prev = new Map();
  // The start node sits at the thief's real position, not its cell centre:
  // a centre can sit inside a wall grown by the thief's radius (the spawn
  // is 4 px from the south wall), which would block every step out.
  const start = { cx: startCell.cx, cy: startCell.cy, x: state.thief.x, y: state.thief.y };
  const queue = [start];
  const seen = new Set([key(start.cx, start.cy)]);
  // Already in the target's cell: steer straight at the target point.
  if (startCell.cx === goal.cx && startCell.cy === goal.cy) return [{ x: tx, y: ty }];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur.cx === goal.cx && cur.cy === goal.cy) {
      const cells = [];
      let node = cur;
      while (node) {
        cells.unshift({ x: node.x, y: node.y });
        node = prev.get(key(node.cx, node.cy));
      }
      return cells;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.cx + dx;
      const ny = cur.cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      // The goal cell itself may be "blocked" (its centre sits against a
      // wall, as loot near the south wall does): the target point inside it
      // is still reachable, so the goal node carries the target point and
      // is only held to the step test, not the centre test.
      const isGoal = nx === goal.cx && ny === goal.cy;
      if (seen.has(key(nx, ny)) || (!isGoal && cellBlocked(state, nx, ny))) continue;
      const x2 = isGoal ? tx : nx * CELL + CELL / 2;
      const y2 = isGoal ? ty : ny * CELL + CELL / 2;
      if (stepBlocked(state, cur.x, cur.y, x2, y2)) continue;
      seen.add(key(nx, ny));
      prev.set(key(nx, ny), cur);
      queue.push({ cx: nx, cy: ny, x: x2, y: y2 });
    }
  }
  return null;
}

function nearestLootAny(state) {
  let best = null;
  let bestDist = Infinity;
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

// Steer along the BFS path to the current objective. Once the main loot is
// taken the objective is the getaway door; a locked door with no route past
// it becomes the objective until it is picked. A bold autopilot walks the
// path straight through the cones (used for the close-call shot).
export function autopilotInput(state, bold) {
  const thief = state.thief;
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

  const mainTaken = state.loot.some((l) => l.kind === 'main' && l.taken);
  const loot = nearestLootAny(state);
  // The getaway point sits 16 px clear of the south wall: the thief's own
  // radius is 13, so y 460 would put the circle inside the wall.
  let target = mainTaken ? { x: 640, y: 448 } : loot || { x: 640, y: 448 };
  if (loot && distance(thief.x, thief.y, loot.x, loot.y) < 40) {
    input.e = true;
    return input;
  }

  let path = findPath(state, target.x, target.y);
  if (!path) {
    // No route: a locked door is in the way. Walk to the nearest locked
    // door anywhere in the room and pick it (the near-door check above
    // fires once the thief is in reach).
    const locked = state.doors.find((d) => d.locked && !d.exit);
    if (locked) {
      target = { x: locked.x + locked.w / 2, y: locked.y + locked.h / 2 + 30 };
      path = findPath(state, target.x, target.y);
    }
  }
  if (!path || path.length === 0) return input;

  // Follow the path, skipping cells already reached; step toward the next
  // one, sidestepping a little when it sits inside a live cone.
  let next = path[0];
  while (path.length > 1 && distance(thief.x, thief.y, next.x, next.y) < 14) {
    path.shift();
    next = path[0];
  }
  let want = angleTo(thief.x, thief.y, next.x, next.y);
  if (!bold && dangerAt(state, next.x, next.y) > 0) {
    let bestAngle = want;
    let bestScore = -Infinity;
    for (let k = -2; k <= 2; k += 1) {
      const a = want + (k * Math.PI) / 6;
      const nx = thief.x + Math.cos(a) * 24;
      const ny = thief.y + Math.sin(a) * 24;
      const score = Math.cos(a - want) * 2 - dangerAt(state, nx, ny);
      if (score > bestScore) {
        bestScore = score;
        bestAngle = a;
      }
    }
    want = bestAngle;
  }
  const dx = Math.cos(want);
  const dy = Math.sin(want);
  if (dx > 0.3) input.right = true;
  if (dx < -0.3) input.left = true;
  if (dy > 0.3) input.down = true;
  if (dy < -0.3) input.up = true;

  const nearGuard = state.guards.some((g) => distance(g.x, g.y, thief.x, thief.y) < 170);
  input.sneak = nearGuard;
  return input;
}

export const SHOTS = [
  { name: 'cover', job: 1, seconds: 3 },
  { name: 'brief', job: 0, seconds: 0 },
  { name: 'close', job: 1, until: 'close-call', bold: true },
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
    if (shot.until === 'close-call') {
      // A close call means the thief is inside a guard's cone, close up:
      // the frame then shows the cone over the thief and the suspicion bar
      // climbing — not just a guard somewhere nearby.
      const inHotCone = state.guards.some(
        (g) =>
          distance(g.x, g.y, state.thief.x, state.thief.y) < 130 &&
          inCone(state.thief.x, state.thief.y, g, g.facing, GUARD_FOV_HALF, GUARD_RANGE),
      );
      if (state.guards.some((g) => g.suspicion >= 0.45) || inHotCone) break;
    }
    if (shot.until === 'exit') {
      const mainTaken = state.loot.some((l) => l.kind === 'main' && l.taken);
      if (mainTaken && distance(state.thief.x, state.thief.y, 640, 462) < 100) break;
    }
    const input = autopilotInput(state, shot.bold);
    if (input.useTool && useTool(state)) refreshSolids(state);
    stepGame(state, input, STEP);
  }
  return state;
}
