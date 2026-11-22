// The HUD: a top bar with the job name, the big labelled ALARM meter, the
// loot total and the tool charges, plus the objective line and a transient
// message toast. Everything is drawn on the canvas so screenshots show it.
import { CANVAS_WIDTH, HUD_HEIGHT, COLORS, ALARM_MAX, TOOL_ORDER, TOOL_NAMES } from './config.js';

function alarmColor(alarm) {
  if (alarm >= 70) return COLORS.alarmHigh;
  if (alarm >= 40) return COLORS.alarmMid;
  return COLORS.alarmLow;
}

export function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hudBar;
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, HUD_HEIGHT - 2, CANVAS_WIDTH, 2);

  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(state.job.name, 14, 24);

  // Alarm meter.
  const barX = 330;
  const barW = 380;
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillText('ALARM', barX, 14);
  ctx.fillStyle = '#1a2438';
  ctx.fillRect(barX, 22, barW, 14);
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(barX, 22, (barW * state.alarm) / ALARM_MAX, 14);
  ctx.strokeStyle = COLORS.hudDim;
  ctx.strokeRect(barX, 22, barW, 14);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillText(Math.round(state.alarm) + '', barX + barW + 8, 29);

  // Heat word.
  const heat = state.alarm >= 70 || state.guards.some((g) => g.state === 'alert')
    ? 'HUNTED'
    : state.alarm >= 35 || state.guards.some((g) => g.state !== 'patrol')
      ? 'SUSPICIOUS'
      : 'CALM';
  ctx.fillStyle = heat === 'HUNTED' ? COLORS.alarmHigh : heat === 'SUSPICIOUS' ? COLORS.alarmMid : COLORS.alarmLow;
  ctx.font = 'bold 13px ui-monospace, monospace';
  ctx.fillText('HEAT ' + heat, barX + barW + 52, 24);

  // Loot total.
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 15px ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.fillText('$' + state.lootValue.toLocaleString('en-US'), CANVAS_WIDTH - 14, 16);

  // Tool charges, bottom-left of the bar.
  ctx.textAlign = 'left';
  ctx.font = '12px ui-monospace, monospace';
  let tx = 14;
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText('TOOLS', tx, 38);
  tx += 48;
  for (const key of TOOL_ORDER) {
    const selected = state.selectedTool === key;
    ctx.fillStyle = selected ? COLORS.loot : COLORS.hudDim;
    ctx.fillText((selected ? '>' : ' ') + TOOL_NAMES[key] + ' x' + state.tools[key], tx, 38);
    tx += key === 'lockpick' ? 130 : 130;
  }

  // Objective line, top-right under the loot total.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px ui-monospace, monospace';
  const objective = state.mainTaken
    ? 'Main loot secured — reach the green GETAWAY door!'
    : 'Steal ' + state.job.target + ' — then reach the GETAWAY door.';
  ctx.fillText(objective, CANVAS_WIDTH - 14, 38);

  // Transient message toast, bottom-centre.
  if (state.messageT > 0 && state.message) {
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 14px ui-monospace, monospace';
    ctx.fillText(state.message, CANVAS_WIDTH / 2, 436);
  }
}
