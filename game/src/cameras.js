// Wall cameras: they sweep a fixed arc, and while the thief stands in a
// live camera's cone the alarm climbs. EMP switches them off for a while.
import { CAMERA_ALARM_PER_SECOND, CAMERA_FOV_HALF, CAMERA_RANGE } from './config.js';
import { canSee } from './vision.js';

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    speed: def.speed,
    phase: 0,
    facing: def.base,
    disabled: 0,
  };
}

export function updateCamera(cam, state, dt) {
  if (cam.disabled > 0) {
    cam.disabled -= dt;
    return false;
  }
  cam.phase += dt * cam.speed;
  cam.facing = cam.base + Math.sin(cam.phase) * cam.sweep;
  const thief = state.thief;
  const sees = canSee(
    cam,
    thief.x,
    thief.y,
    cam.facing,
    CAMERA_FOV_HALF,
    CAMERA_RANGE,
    state.solids,
    state.clouds,
  );
  if (sees) {
    state.alarm = Math.min(100, state.alarm + CAMERA_ALARM_PER_SECOND * dt);
    state.spotted = true;
    return true;
  }
  return false;
}
