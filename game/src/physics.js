// Circle-versus-rectangle movement. Walls, cover furniture and locked doors
// are solid; the thief and the guards slide along them instead of sticking.
export function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

export function circleHitsAny(x, y, r, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    if (circleHitsRect(x, y, r, solids[i])) return true;
  }
  return false;
}

// Move a circle by (dx, dy) against solid rects, axis by axis so it slides.
export function moveCircle(ent, dx, dy, r, solids) {
  const nx = ent.x + dx;
  if (!circleHitsAny(nx, ent.y, r, solids)) ent.x = nx;
  const ny = ent.y + dy;
  if (!circleHitsAny(ent.x, ny, r, solids)) ent.y = ny;
}

export function distance(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
