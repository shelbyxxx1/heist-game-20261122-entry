// Line of sight and vision cones. A guard or a camera sees the thief only
// when the thief is inside its cone AND no solid rectangle crosses the line
// between them. Smoke clouds block sight the same way walls do.
import { angleDiff } from './physics.js';

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export function segmentHitsRect(x1, y1, x2, y2, rect) {
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  const rx = rect.x;
  const ry = rect.y;
  const rw = rect.x + rect.w;
  const rh = rect.y + rect.h;
  return (
    segmentsCross(x1, y1, x2, y2, rx, ry, rw, ry) ||
    segmentsCross(x1, y1, x2, y2, rw, ry, rw, rh) ||
    segmentsCross(x1, y1, x2, y2, rw, rh, rx, rh) ||
    segmentsCross(x1, y1, x2, y2, rx, rh, rx, ry)
  );
}

export function lineBlocked(x1, y1, x2, y2, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, solids[i])) return true;
  }
  return false;
}

function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const ox = px - cx;
  const oy = py - cy;
  return ox * ox + oy * oy < r * r;
}

// True when the segment crosses a smoke cloud (vision is blocked through it).
export function lineThroughSmoke(x1, y1, x2, y2, clouds) {
  for (let i = 0; i < clouds.length; i += 1) {
    const c = clouds[i];
    if (segmentHitsCircle(x1, y1, x2, y2, c.x, c.y, c.r)) return true;
  }
  return false;
}

// Can `eye` see point (px, py)? Inside the cone, in range, line of sight
// clear of solids and smoke.
export function canSee(eye, px, py, facing, halfFov, range, solids, clouds) {
  const dx = px - eye.x;
  const dy = py - eye.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > range) return false;
  if (dist > 1 && Math.abs(angleDiff(Math.atan2(dy, dx), facing)) > halfFov) return false;
  if (lineBlocked(eye.x, eye.y, px, py, solids)) return false;
  if (clouds && lineThroughSmoke(eye.x, eye.y, px, py, clouds)) return false;
  return true;
}

// Is the point inside the cone ignoring walls (used by the autopilot to
// judge danger before it moves)?
export function inCone(px, py, eye, facing, halfFov, range) {
  const dx = px - eye.x;
  const dy = py - eye.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > range) return false;
  return Math.abs(angleDiff(Math.atan2(dy, dx), facing)) <= halfFov;
}
