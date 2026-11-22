// The three jobs of the night. Each map is one room: outer walls, interior
// walls, cover furniture (solid, blocks sight), doors, guard patrol loops,
// camera mounts, laser beams, loot, the thief's start and the getaway door.
// Coordinates are canvas pixels; the play area runs y 56..474, x 8..1272.
import { PLAY_TOP, PLAY_BOTTOM, PLAY_LEFT, PLAY_RIGHT } from './config.js';

function outerWalls() {
  return [
    { x: PLAY_LEFT, y: PLAY_TOP, w: PLAY_RIGHT - PLAY_LEFT, h: 10 },
    { x: PLAY_LEFT, y: PLAY_BOTTOM - 10, w: PLAY_RIGHT - PLAY_LEFT, h: 10 },
    { x: PLAY_LEFT, y: PLAY_TOP, w: 10, h: PLAY_BOTTOM - PLAY_TOP },
    { x: PLAY_RIGHT - 10, y: PLAY_TOP, w: 10, h: PLAY_BOTTOM - PLAY_TOP },
  ];
}

function exitDoor() {
  return { x: 600, y: PLAY_BOTTOM - 12, w: 80, h: 12, locked: true, exit: true };
}

export const JOBS = [
  {
    name: 'JOB 1 — THE GALLERY',
    place: 'Meridian Museum',
    target: 'the Meridian Star sapphire',
    targetValue: 1000,
    briefing:
      'Two guards walk the gallery floor and two cameras sweep the corners. ' +
      'Slip between the display cases, lift the Meridian Star, then walk out the south door.',
    parSeconds: 75,
    walls: outerWalls(),
    cover: [
      { x: 300, y: 150, w: 180, h: 40, label: 'display case' },
      { x: 800, y: 150, w: 180, h: 40, label: 'display case' },
      { x: 300, y: 320, w: 180, h: 40, label: 'display case' },
      { x: 800, y: 320, w: 180, h: 40, label: 'display case' },
      { x: 590, y: 190, w: 100, h: 56, label: 'pedestal' },
    ],
    doors: [exitDoor()],
    guards: [
      {
        name: 'Guard Mara',
        waypoints: [
          { x: 200, y: 120 },
          { x: 200, y: 420 },
          { x: 500, y: 420 },
          { x: 500, y: 120 },
        ],
      },
      {
        name: 'Guard Ivo',
        waypoints: [
          { x: 1080, y: 120 },
          { x: 1080, y: 420 },
          { x: 780, y: 420 },
          { x: 780, y: 120 },
        ],
      },
    ],
    cameras: [
      { x: 26, y: 74, base: Math.PI / 4, sweep: 0.9, speed: 0.45 },
      { x: 1254, y: 74, base: (3 * Math.PI) / 4, sweep: 0.9, speed: 0.45 },
    ],
    lasers: [],
    loot: [
      { x: 640, y: 140, kind: 'main', value: 1000, label: 'Meridian Star' },
      { x: 120, y: 120, kind: 'side', value: 150, label: 'Portrait of a Lady' },
      { x: 1160, y: 120, kind: 'side', value: 150, label: 'The Blue Hour' },
      { x: 120, y: 400, kind: 'side', value: 150, label: 'Harbour at Dusk' },
      { x: 1160, y: 400, kind: 'side', value: 150, label: 'Winter Garden' },
    ],
    thiefStart: { x: 640, y: 440 },
  },
  {
    name: 'JOB 2 — THE VAULT',
    place: 'Meridian Bank',
    target: "the vault's gold reserve",
    targetValue: 2000,
    briefing:
      'Three guards, four cameras and a laser grid guard the vault. The vault door is ' +
      'locked — pick it, mind the beam across the corridor, crack a safe if you dare.',
    parSeconds: 110,
    walls: outerWalls().concat([
      { x: 520, y: PLAY_TOP, w: 10, h: 140 },
      { x: 750, y: PLAY_TOP, w: 10, h: 140 },
      { x: 520, y: 196, w: 80, h: 10 },
      { x: 680, y: 196, w: 80, h: 10 },
    ]),
    cover: [
      { x: 200, y: 150, w: 220, h: 36, label: 'teller counter' },
      { x: 860, y: 150, w: 220, h: 36, label: 'teller counter' },
      { x: 200, y: 330, w: 220, h: 36, label: 'teller counter' },
      { x: 860, y: 330, w: 220, h: 36, label: 'teller counter' },
      { x: 470, y: 300, w: 120, h: 40, label: 'desk' },
      { x: 690, y: 300, w: 120, h: 40, label: 'desk' },
    ],
    doors: [
      exitDoor(),
      { x: 600, y: 196, w: 80, h: 10, locked: true, exit: false, label: 'vault door' },
    ],
    guards: [
      {
        name: 'Guard Mara',
        waypoints: [
          { x: 150, y: 120 },
          { x: 150, y: 420 },
          { x: 420, y: 420 },
          { x: 420, y: 120 },
        ],
      },
      {
        name: 'Guard Ivo',
        waypoints: [
          { x: 560, y: 250 },
          { x: 720, y: 250 },
          { x: 720, y: 400 },
          { x: 560, y: 400 },
        ],
      },
      {
        name: 'Guard Selin',
        waypoints: [
          { x: 1130, y: 120 },
          { x: 1130, y: 420 },
          { x: 860, y: 420 },
          { x: 860, y: 120 },
        ],
      },
    ],
    cameras: [
      { x: 26, y: 74, base: Math.PI / 4, sweep: 0.9, speed: 0.5 },
      { x: 1254, y: 74, base: (3 * Math.PI) / 4, sweep: 0.9, speed: 0.5 },
      { x: 26, y: 456, base: -Math.PI / 4, sweep: 0.9, speed: 0.5 },
      { x: 1254, y: 456, base: (-3 * Math.PI) / 4, sweep: 0.9, speed: 0.5 },
    ],
    lasers: [
      { x1: 560, y1: 232, x2: 720, y2: 232, period: 3.2, phase: 0 },
      { x1: 1000, y1: 210, x2: 1000, y2: 300, period: 2.6, phase: 1.3 },
    ],
    loot: [
      { x: 640, y: 120, kind: 'main', value: 2000, label: 'Gold reserve' },
      { x: 100, y: 250, kind: 'safe', value: 400, label: 'Wall safe' },
      { x: 1180, y: 250, kind: 'safe', value: 400, label: 'Wall safe' },
      { x: 300, y: 440, kind: 'side', value: 150, label: 'Ledger of Accounts' },
      { x: 980, y: 440, kind: 'side', value: 150, label: 'Founder’s Portrait' },
    ],
    thiefStart: { x: 640, y: 440 },
  },
  {
    name: 'JOB 3 — THE PENTHOUSE',
    place: 'Meridian Casino',
    target: 'the high-roller chip case',
    targetValue: 3000,
    briefing:
      'Four guards, five cameras, three laser beams and the tightest patrols of the night. ' +
      'The chip case sits on the bar. Take it, stay out of the light, and run for the van.',
    parSeconds: 130,
    walls: outerWalls(),
    cover: [
      { x: 250, y: 140, w: 200, h: 50, label: 'blackjack table' },
      { x: 830, y: 140, w: 200, h: 50, label: 'blackjack table' },
      { x: 250, y: 320, w: 200, h: 50, label: 'roulette table' },
      { x: 830, y: 320, w: 200, h: 50, label: 'roulette table' },
      { x: 560, y: 110, w: 160, h: 36, label: 'bar' },
      { x: 600, y: 330, w: 80, h: 60, label: 'poker table' },
    ],
    doors: [exitDoor()],
    guards: [
      {
        name: 'Guard Mara',
        waypoints: [
          { x: 150, y: 120 },
          { x: 150, y: 280 },
          { x: 380, y: 280 },
          { x: 380, y: 120 },
        ],
      },
      {
        name: 'Guard Ivo',
        waypoints: [
          { x: 1130, y: 120 },
          { x: 1130, y: 280 },
          { x: 900, y: 280 },
          { x: 900, y: 120 },
        ],
      },
      {
        name: 'Guard Selin',
        waypoints: [
          { x: 150, y: 420 },
          { x: 150, y: 300 },
          { x: 420, y: 300 },
          { x: 420, y: 420 },
        ],
      },
      {
        name: 'Guard Dario',
        waypoints: [
          { x: 1130, y: 420 },
          { x: 1130, y: 300 },
          { x: 860, y: 300 },
          { x: 860, y: 420 },
        ],
      },
    ],
    cameras: [
      { x: 26, y: 74, base: Math.PI / 4, sweep: 0.9, speed: 0.55 },
      { x: 1254, y: 74, base: (3 * Math.PI) / 4, sweep: 0.9, speed: 0.55 },
      { x: 26, y: 456, base: -Math.PI / 4, sweep: 0.9, speed: 0.55 },
      { x: 1254, y: 456, base: (-3 * Math.PI) / 4, sweep: 0.9, speed: 0.55 },
      { x: 640, y: 66, base: Math.PI / 2, sweep: 1.1, speed: 0.4 },
    ],
    lasers: [
      { x1: 560, y1: 168, x2: 720, y2: 168, period: 3.0, phase: 0 },
      { x1: 300, y1: 200, x2: 300, y2: 290, period: 2.4, phase: 0.8 },
      { x1: 980, y1: 200, x2: 980, y2: 290, period: 2.4, phase: 1.6 },
    ],
    loot: [
      { x: 640, y: 96, kind: 'main', value: 3000, label: 'Chip case' },
      { x: 150, y: 200, kind: 'side', value: 300, label: 'Chip stack' },
      { x: 1130, y: 200, kind: 'side', value: 300, label: 'Chip stack' },
      { x: 640, y: 430, kind: 'safe', value: 600, label: 'Cage safe' },
      { x: 150, y: 420, kind: 'side', value: 200, label: 'Gold watch' },
    ],
    thiefStart: { x: 640, y: 445 },
  },
];
