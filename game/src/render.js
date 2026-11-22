// Canvas drawing: the room, the cones, the crew, the loot and the screens.
// The look is "neon-noir blueprint": dark floors with a faint grid, teal
// walls with gold trim, red cones, gold loot, a green getaway door.
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  HUD_HEIGHT,
  COLORS,
  GUARD_FOV_HALF,
  GUARD_RANGE,
  CAMERA_FOV_HALF,
  CAMERA_RANGE,
} from './config.js';
import { drawHud } from './hud.js';

function drawCone(ctx, x, y, facing, halfFov, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfFov, facing + halfFov);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawRoom(ctx, state) {
  // Floor + blueprint grid.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
  ctx.strokeStyle = COLORS.floorGrid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, HUD_HEIGHT);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = HUD_HEIGHT; y <= CANVAS_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  // Cover furniture.
  for (const c of state.job.cover) {
    ctx.fillStyle = COLORS.cover;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = COLORS.coverTrim;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2);
  }

  // Walls.
  for (const w of state.job.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTrim;
    if (w.h <= 12) ctx.fillRect(w.x, w.y, w.w, 2);
    else ctx.fillRect(w.x, w.y, 2, w.h);
  }

  // Doors: the getaway door is green, a locked vault door is gold.
  for (const door of state.doors) {
    if (door.exit) {
      ctx.fillStyle = door.locked ? '#3a5a44' : COLORS.exit;
      ctx.fillRect(door.x, door.y, door.w, door.h);
      ctx.fillStyle = '#eafff1';
      ctx.font = 'bold 11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(door.locked ? 'GETAWAY — LOCKED' : 'GETAWAY', door.x + door.w / 2, door.y - 12);
    } else if (door.locked) {
      ctx.fillStyle = COLORS.loot;
      ctx.fillRect(door.x, door.y, door.w, door.h);
      ctx.fillStyle = COLORS.hudText;
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LOCKED — pick it [Q+Space]', door.x + door.w / 2, door.y + 22);
    }
  }

  // Loot.
  for (const item of state.loot) {
    if (item.taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(state.time * 3 + item.x);
    ctx.fillStyle = COLORS.lootGlow;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 26 * pulse + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath();
    ctx.moveTo(item.x, item.y - 10);
    ctx.lineTo(item.x + 8, item.y);
    ctx.lineTo(item.x, item.y + 10);
    ctx.lineTo(item.x - 8, item.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label + ' $' + item.value, item.x, item.y - 22);
    if (item.channel > 0) {
      const need = item.kind === 'safe' ? 3 : 1.5;
      ctx.strokeStyle = COLORS.loot;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 18, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * item.channel) / need);
      ctx.stroke();
    }
  }

  // Lasers.
  for (const laser of state.lasers) {
    if (laser.disabled > 0 || !laser.on) {
      ctx.strokeStyle = 'rgba(255, 46, 77, 0.25)';
      ctx.setLineDash([4, 6]);
    } else {
      ctx.strokeStyle = COLORS.laser;
      ctx.setLineDash([]);
    }
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(laser.x1, laser.y1);
    ctx.lineTo(laser.x2, laser.y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Cameras: cone first, then the mount.
  for (const cam of state.cameras) {
    if (cam.disabled <= 0) {
      drawCone(ctx, cam.x, cam.y, cam.facing, CAMERA_FOV_HALF, CAMERA_RANGE, COLORS.coneCamera, COLORS.coneCameraEdge);
    }
    ctx.fillStyle = cam.disabled > 0 ? '#3a4456' : '#e08a28';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a1020';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Guards: cone first, then the body, then the suspicion bar.
  for (const g of state.guards) {
    const coneFill = g.state === 'alert' ? COLORS.coneGuard : g.state === 'suspicious' ? COLORS.coneSuspicious : COLORS.coneGuard;
    drawCone(ctx, g.x, g.y, g.facing, GUARD_FOV_HALF, GUARD_RANGE, coneFill, COLORS.coneGuardEdge);
  }
  for (const g of state.guards) {
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.guardTrim;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#e8eef8';
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * 16, g.y + Math.sin(g.facing) * 16);
    ctx.stroke();
    if (g.suspicion > 0.05) {
      ctx.fillStyle = '#1a2438';
      ctx.fillRect(g.x - 14, g.y - 24, 28, 5);
      ctx.fillStyle = g.suspicion >= 1 ? COLORS.alarmHigh : COLORS.alarmMid;
      ctx.fillRect(g.x - 14, g.y - 24, 28 * Math.min(1, g.suspicion), 5);
    }
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y + 24);
  }

  // Smoke clouds.
  for (const cloud of state.clouds) {
    ctx.fillStyle = COLORS.smoke;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // The thief: cream hood, red scarf, facing tick.
  const t = state.thief;
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefScarf;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(t.x, t.y, 13, t.dir - 0.7, t.dir + 0.7);
  ctx.stroke();
  ctx.strokeStyle = '#0a1020';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.dir) * 17, t.y + Math.sin(t.dir) * 17);
  ctx.stroke();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 10px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WREN', t.x, t.y + 24);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(6, 12, 24, 0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

export function drawScreens(ctx, state) {
  if (state.screen === 'play') return;
  ctx.textBaseline = 'middle';

  if (state.screen === 'brief') {
    panel(ctx, 240, 70, 800, 340);
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 26px ui-monospace, monospace';
    ctx.fillText(state.job.name, 270, 105);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '15px ui-monospace, monospace';
    ctx.fillText(state.job.place + ' — steal ' + state.job.target + ' ($' + state.job.targetValue + ')', 270, 135);
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '14px ui-monospace, monospace';
    const lines = wrapText(ctx, state.job.briefing, 740);
    lines.forEach((line, i) => ctx.fillText(line, 270, 165 + i * 20));
    let ly = 165 + lines.length * 20 + 14;
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 13px ui-monospace, monospace';
    ctx.fillText('LOOT IN THE ROOM', 270, ly);
    ly += 20;
    ctx.font = '13px ui-monospace, monospace';
    for (const item of state.loot) {
      ctx.fillText('- ' + item.label + '  $' + item.value + (item.kind === 'main' ? '  ★ main target' : item.kind === 'safe' ? '  (safe — 3s, loud)' : ''), 270, ly);
      ly += 18;
    }
    ly += 8;
    ctx.fillStyle = COLORS.hudDim;
    ctx.fillText('WASD move · Shift sneak · E grab · Q tool · Space use tool · R restart · Esc pause', 270, ly);
    ly += 22;
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 15px ui-monospace, monospace';
    ctx.fillText('Press ENTER or click to start the job', 270, ly);
    return;
  }

  if (state.screen === 'paused') {
    panel(ctx, 440, 170, 400, 140);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 24px ui-monospace, monospace';
    ctx.fillText('PAUSED', 640, 210);
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText('Esc to resume · R to restart the job', 640, 250);
    ctx.fillText('M to mute', 640, 278);
    return;
  }

  if (state.screen === 'busted') {
    ctx.fillStyle = 'rgba(40, 4, 8, 0.82)';
    ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.alarmHigh;
    ctx.font = 'bold 44px ui-monospace, monospace';
    ctx.fillText('BUSTED', 640, 190);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '16px ui-monospace, monospace';
    ctx.fillText(state.caughtBy || 'The crew walks — the Meridian job is blown.', 640, 240);
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText('Press R to retry the job · Esc back to the briefing', 640, 280);
    return;
  }

  if (state.screen === 'complete') {
    panel(ctx, 340, 110, 600, 260);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.exit;
    ctx.font = 'bold 30px ui-monospace, monospace';
    ctx.fillText('JOB COMPLETE', 640, 150);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '15px ui-monospace, monospace';
    ctx.fillText('Loot  $' + state.lootValue.toLocaleString('en-US'), 640, 195);
    ctx.fillText('Time  ' + state.time.toFixed(1) + 's  (par ' + state.job.parSeconds + 's)', 640, 222);
    ctx.fillText(state.spotted ? 'Spotted — no ghost bonus' : 'Ghost bonus  +$500  (never spotted)', 640, 249);
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText('Job score  $' + state.jobScore.toLocaleString('en-US'), 640, 285);
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText('Press ENTER for the next job', 640, 330);
    return;
  }

  if (state.screen === 'campaign') {
    panel(ctx, 300, 100, 680, 280);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 30px ui-monospace, monospace';
    ctx.fillText('THE MERIDIAN JOB IS DONE', 640, 150);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '15px ui-monospace, monospace';
    ctx.fillText('Three rooms, three scores, one clean getaway.', 640, 195);
    ctx.font = 'bold 20px ui-monospace, monospace';
    ctx.fillStyle = COLORS.loot;
    ctx.fillText("Night's total  $" + state.totalScore.toLocaleString('en-US'), 640, 240);
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText('Press R to run the night again', 640, 300);
  }
}

export function draw(ctx, state) {
  drawRoom(ctx, state);
  drawHud(ctx, state);
  drawScreens(ctx, state);
  if (state.alarm >= 70 && state.screen === 'play') {
    ctx.strokeStyle = 'rgba(229, 72, 77,' + (0.25 + 0.2 * Math.sin(state.time * 6)) + ')';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, HUD_HEIGHT + 3, CANVAS_WIDTH - 6, CANVAS_HEIGHT - HUD_HEIGHT - 6);
  }
}
