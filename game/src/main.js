// Browser shell: input, the animation loop, the screens, and the ?shot=
// screenshot mode. All game rules live in game.js; this file only wires the
// DOM around them.
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import { JOBS } from './levels.js';
import { createJobState, stepGame, refreshSolids } from './game.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';
import { cycleTool, useTool } from './tools.js';
import {
  ensureAudio,
  toggleMute,
  playPickup,
  playAlert,
  playLaser,
  playTool,
  playBusted,
  playWin,
} from './audio.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 7);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let state = null;
let lastAlertAt = 0;

function wireSounds(s) {
  s.onAlert = () => {
    if (s.time - lastAlertAt > 1) {
      lastAlertAt = s.time;
      playAlert();
    }
  };
  s.onPickup = () => playPickup();
  s.onTool = (tool) => {
    if (tool === 'emp') playLaser();
    else playTool();
  };
  s.onBusted = () => playBusted();
  s.onWin = () => playWin();
}

function startJob(jobIndex) {
  state = createJobState(jobIndex, seed);
  wireSounds(state);
  state.screen = 'brief';
}

function restartJob() {
  startJob(state.jobIndex);
}

// ---- Screenshot mode: stage one deterministic scene, paint it twice, and
// signal readiness. No animation loop, no wall clock, no audio.
if (shotName) {
  state = stageShot(shotName, seed);
  wireSounds(state);
  draw(ctx, state);
  draw(ctx, state);
  window.__shotReady = true;
} else {
  startJob(0);

  const keys = {};
  const input = { up: false, down: false, left: false, right: false, sneak: false, e: false };

  function readInput() {
    input.up = !!(keys.ArrowUp || keys.KeyW);
    input.down = !!(keys.ArrowDown || keys.KeyS);
    input.left = !!(keys.ArrowLeft || keys.KeyA);
    input.right = !!(keys.ArrowRight || keys.KeyD);
    input.sneak = !!keys.ShiftLeft || !!keys.ShiftRight;
    input.e = !!keys.KeyE;
  }

  window.addEventListener('keydown', (event) => {
    ensureAudio();
    keys[event.code] = true;
    if (event.code === 'KeyM') {
      toggleMute();
      return;
    }
    if (!state) return;
    if (event.code === 'KeyQ' && state.screen === 'play') cycleTool(state);
    if (event.code === 'Space' && state.screen === 'play') {
      event.preventDefault();
      if (useTool(state)) refreshSolids(state);
    }
    if (event.code === 'KeyR' && (state.screen === 'play' || state.screen === 'paused' || state.screen === 'busted' || state.screen === 'campaign')) {
      restartJob();
    }
    if (event.code === 'Escape') {
      if (state.screen === 'play') state.screen = 'paused';
      else if (state.screen === 'paused') state.screen = 'play';
      else if (state.screen === 'busted') state.screen = 'brief';
    }
    if (event.code === 'Enter') {
      if (state.screen === 'brief') state.screen = 'play';
      else if (state.screen === 'complete') {
        const next = state.jobIndex + 1;
        if (next < JOBS.length) {
          const scores = state.jobScores;
          const total = state.totalScore;
          startJob(next);
          state.jobScores = scores;
          state.totalScore = total;
        } else {
          state.screen = 'campaign';
        }
      }
    }
  });

  window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
  });

  canvas.addEventListener('click', () => {
    ensureAudio();
    if (!state) return;
    if (state.screen === 'brief') state.screen = 'play';
    else if (state.screen === 'complete') {
      const next = state.jobIndex + 1;
      if (next < JOBS.length) {
        const scores = state.jobScores;
        const total = state.totalScore;
        startJob(next);
        state.jobScores = scores;
        state.totalScore = total;
      } else {
        state.screen = 'campaign';
      }
    }
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    readInput();
    stepGame(state, input, dt);
    draw(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
