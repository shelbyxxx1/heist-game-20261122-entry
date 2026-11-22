// Shared constants for Midnight at the Meridian. One job: the numbers every
// other module agrees on — canvas size, movement, vision and alarm rates.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 480;
export const HUD_HEIGHT = 46;
export const PLAY_TOP = 56;
export const PLAY_BOTTOM = 474;
export const PLAY_LEFT = 8;
export const PLAY_RIGHT = 1272;

export const THIEF_RADIUS = 13;
export const THIEF_SPEED = 165;
export const SNEAK_MULTIPLIER = 0.5;
export const GUARD_CATCH_RADIUS = 26;

export const GUARD_FOV_HALF = (35 * Math.PI) / 180;
export const GUARD_RANGE = 230;
export const GUARD_SUSPICION_SECONDS = 0.9;
export const CAMERA_RANGE = 260;
export const CAMERA_FOV_HALF = (32 * Math.PI) / 180;
export const CAMERA_ALARM_PER_SECOND = 12;

export const ALARM_MAX = 100;
export const ALARM_DECAY = [1.5, 1.0, 0.7];
export const ALARM_ON_ALERT = 20;
export const ALARM_ON_LASER = 15;
export const ALARM_ON_TOOL = 5;
export const GUARD_SPEED = [55, 65, 75];

export const GRAB_SECONDS = 1.5;
export const SAFE_SECONDS = 3.0;
export const SMOKE_SECONDS = 6;
export const SMOKE_RADIUS = 110;
export const EMP_SECONDS = 8;
export const NOISE_RUN_RADIUS = 90;
export const NOISE_GRAB_RADIUS = 140;
export const NOISE_SAFE_RADIUS = 180;

export const COLORS = {
  floor: '#0a1020',
  floorGrid: '#101a30',
  wall: '#1e5f6e',
  wallTrim: '#c9a227',
  cover: '#16233a',
  coverTrim: '#2e4a6b',
  thief: '#f2ead8',
  thiefScarf: '#e5484d',
  guard: '#2b3a55',
  guardTrim: '#8fa8c8',
  coneGuard: 'rgba(229, 72, 77, 0.20)',
  coneGuardEdge: 'rgba(229, 72, 77, 0.55)',
  coneSuspicious: 'rgba(240, 180, 60, 0.28)',
  coneCamera: 'rgba(240, 140, 40, 0.18)',
  coneCameraEdge: 'rgba(240, 140, 40, 0.5)',
  laser: '#ff2e4d',
  loot: '#ffd34d',
  lootGlow: 'rgba(255, 211, 77, 0.35)',
  exit: '#2fbf71',
  smoke: 'rgba(180, 190, 205, 0.45)',
  hudBar: '#0d1526',
  hudText: '#dfe8f5',
  hudDim: '#7fa3c7',
  alarmLow: '#2fbf71',
  alarmMid: '#f0b43c',
  alarmHigh: '#e5484d',
};
