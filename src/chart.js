/**
 * Gráfica en tiempo real de Energía Total y Error Relativo.
 * Usa Canvas 2D puro (sin librerías externas).
 */

const MAX_POINTS = 600;
let canvas, ctx;
let energyData = [];
let errorData = [];
let daysData = [];

export function initChart() {
  canvas = document.getElementById("chart-canvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
}

export function pushChartData(days, energy, error) {
  daysData.push(days);
  energyData.push(energy);
  errorData.push(error);
  if (daysData.length > MAX_POINTS) {
    daysData.shift();
    energyData.shift();
    errorData.shift();
  }
}

export function renderChart() {
  if (!ctx || daysData.length < 2) return;

  const W = canvas.width;
  const H = canvas.height;
  const pad = { top: 22, right: 58, bottom: 28, left: 68 };
  const pW = W - pad.left - pad.right;
  const pH = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "rgba(100,140,255,0.07)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (pH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + pW, y);
    ctx.stroke();
  }

  // Data ranges
  const d0 = daysData[0],
    d1 = daysData[daysData.length - 1];
  let eMin = Infinity, eMax = -Infinity;
  for (const v of energyData) { eMin = Math.min(eMin, v); eMax = Math.max(eMax, v); }
  if (eMin === eMax) { eMin -= 1; eMax += 1; }

  let rMin = Infinity, rMax = -Infinity;
  for (const v of errorData) { rMin = Math.min(rMin, v); rMax = Math.max(rMax, v); }
  if (rMin === rMax) { rMin = 0; rMax = rMax || 1; }

  const mx = (d) => pad.left + ((d - d0) / (d1 - d0 || 1)) * pW;
  const myE = (e) => pad.top + pH - ((e - eMin) / (eMax - eMin || 1)) * pH;
  const myR = (r) => pad.top + pH - ((r - rMin) / (rMax - rMin || 1)) * pH;

  // Energy line (yellow)
  ctx.strokeStyle = "#ffcc44";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < daysData.length; i++) {
    const x = mx(daysData[i]), y = myE(energyData[i]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Error line (green)
  ctx.strokeStyle = "#66eebb";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < daysData.length; i++) {
    const x = mx(daysData[i]), y = myR(errorData[i]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Labels
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = "center";
  ctx.fillStyle = "#8899bb";
  ctx.fillText(`${d0.toFixed(0)}d`, pad.left, H - 4);
  ctx.fillText(`${d1.toFixed(0)}d`, pad.left + pW, H - 4);

  ctx.textAlign = "right";
  ctx.fillStyle = "#ffcc44";
  ctx.fillText(eMax.toExponential(1), pad.left - 4, pad.top + 10);
  ctx.fillText(eMin.toExponential(1), pad.left - 4, pad.top + pH);

  ctx.textAlign = "left";
  ctx.fillStyle = "#66eebb";
  ctx.fillText(rMax.toExponential(1), pad.left + pW + 4, pad.top + 10);
  ctx.fillText(rMin.toExponential(1), pad.left + pW + 4, pad.top + pH);

  // Legend
  ctx.font = "10px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffcc44";
  ctx.fillText("■ Energía", pad.left + 4, pad.top + 12);
  ctx.fillStyle = "#66eebb";
  ctx.fillText("■ Error", pad.left + 80, pad.top + 12);
}

export function clearChartData() {
  energyData = [];
  errorData = [];
  daysData = [];
}
