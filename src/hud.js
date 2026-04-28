/**
 * HUD: controles de reproducción, sliders de configuración,
 * tarjetas de datos y alerta de colisión.
 */

import {
  DEFAULT_EARTH_V, DEFAULT_MOON_V,
  DEFAULT_SUN_MASS, DEFAULT_EARTH_MASS, DEFAULT_MOON_MASS,
} from "./bodies.js";

// ── Estado de reproducción ──
let paused = false;
let speedIndex = 2;
const SPEED_LEVELS = [0.25, 0.5, 1, 2, 4];

// ── DOM refs ──
let hudDays, hudEnergy, hudError, hudE0;
let solVel, tierraVel, tierraDist, lunaVel, lunaDist;
let slEarthV, slMoonV, slSunM, slEarthM, slMoonM;
let vEarthV, vMoonV, vSunM, vEarthM, vMoonM;
let btnPause, playbackLabel, collisionAlert;

function logToMass(v) { return Math.pow(10, v); }
function massToLog(m) { return Math.log10(m); }

function updateSliderTexts() {
  vEarthV.textContent = `${parseInt(slEarthV.value).toLocaleString()} m/s`;
  vMoonV.textContent = `${parseInt(slMoonV.value).toLocaleString()} m/s`;
  vSunM.textContent = `${logToMass(parseFloat(slSunM.value)).toExponential(2)} kg`;
  vEarthM.textContent = `${logToMass(parseFloat(slEarthM.value)).toExponential(2)} kg`;
  vMoonM.textContent = `${logToMass(parseFloat(slMoonM.value)).toExponential(2)} kg`;
}

function updatePauseBtn() {
  btnPause.textContent = paused ? "▶" : "⏸";
}

export function initHUD({ onReset }) {
  // Data cards
  hudDays = document.getElementById("hud-days");
  hudEnergy = document.getElementById("hud-energy");
  hudError = document.getElementById("hud-error");
  hudE0 = document.getElementById("hud-e0");
  solVel = document.getElementById("sol-vel");
  tierraVel = document.getElementById("tierra-vel");
  tierraDist = document.getElementById("tierra-dist");
  lunaVel = document.getElementById("luna-vel");
  lunaDist = document.getElementById("luna-dist");

  // Sliders
  slEarthV = document.getElementById("slider-earth-v");
  slMoonV = document.getElementById("slider-moon-v");
  slSunM = document.getElementById("slider-sun-mass");
  slEarthM = document.getElementById("slider-earth-mass");
  slMoonM = document.getElementById("slider-moon-mass");
  vEarthV = document.getElementById("val-earth-v");
  vMoonV = document.getElementById("val-moon-v");
  vSunM = document.getElementById("val-sun-mass");
  vEarthM = document.getElementById("val-earth-mass");
  vMoonM = document.getElementById("val-moon-mass");

  // Defaults
  slEarthV.value = DEFAULT_EARTH_V;
  slMoonV.value = DEFAULT_MOON_V;
  slSunM.value = massToLog(DEFAULT_SUN_MASS);
  slEarthM.value = massToLog(DEFAULT_EARTH_MASS);
  slMoonM.value = massToLog(DEFAULT_MOON_MASS);
  updateSliderTexts();

  slEarthV.oninput = slMoonV.oninput =
    slSunM.oninput = slEarthM.oninput = slMoonM.oninput = updateSliderTexts;

  // Reset
  document.getElementById("btn-reset").addEventListener("click", () => {
    if (onReset) onReset();
    hideCollisionAlert();
    paused = false;
    updatePauseBtn();
  });

  // Defaults
  document.getElementById("btn-defaults").addEventListener("click", () => {
    slEarthV.value = DEFAULT_EARTH_V;
    slMoonV.value = DEFAULT_MOON_V;
    slSunM.value = massToLog(DEFAULT_SUN_MASS);
    slEarthM.value = massToLog(DEFAULT_EARTH_MASS);
    slMoonM.value = massToLog(DEFAULT_MOON_MASS);
    updateSliderTexts();
  });

  // Playback
  btnPause = document.getElementById("btn-pause");
  playbackLabel = document.getElementById("playback-label");

  btnPause.addEventListener("click", () => {
    paused = !paused;
    updatePauseBtn();
  });

  document.getElementById("btn-slower").addEventListener("click", () => {
    if (speedIndex > 0) speedIndex--;
    playbackLabel.textContent = `${SPEED_LEVELS[speedIndex]}×`;
  });

  document.getElementById("btn-faster").addEventListener("click", () => {
    if (speedIndex < SPEED_LEVELS.length - 1) speedIndex++;
    playbackLabel.textContent = `${SPEED_LEVELS[speedIndex]}×`;
  });

  updatePauseBtn();
  playbackLabel.textContent = `${SPEED_LEVELS[speedIndex]}×`;

  // Collision alert
  collisionAlert = document.getElementById("collision-alert");
}

export function updateHUD(s) {
  hudDays.textContent = s.elapsedDays.toFixed(1);
  hudEnergy.textContent = s.totalEnergy.toExponential(4);
  hudError.textContent = s.relativeError.toExponential(3);
  hudE0.textContent = s.initialEnergy.toExponential(4);

  if (s.bodyData) {
    solVel.textContent = `${s.bodyData[0].speed.toFixed(1)} m/s`;
    tierraVel.textContent = `${s.bodyData[1].speed.toFixed(0)} m/s`;
    tierraDist.textContent = `${(s.distSunEarth / 1.496e11).toFixed(4)} AU`;
    lunaVel.textContent = `${s.bodyData[2].speed.toFixed(0)} m/s`;
    lunaDist.textContent = `${(s.distEarthMoon / 1000).toFixed(0)} km`;
  }
}

export function getControlValues() {
  return {
    earthV: parseFloat(slEarthV.value) || DEFAULT_EARTH_V,
    moonV: parseFloat(slMoonV.value) || DEFAULT_MOON_V,
    sunMass: logToMass(parseFloat(slSunM.value)),
    earthMass: logToMass(parseFloat(slEarthM.value)),
    moonMass: logToMass(parseFloat(slMoonM.value)),
  };
}

export function isPaused() { return paused; }
export function setPaused(v) { paused = v; updatePauseBtn(); }
export function getSpeedMultiplier() { return SPEED_LEVELS[speedIndex]; }

export function showCollisionAlert(a, b) {
  const n = ["Sol", "Tierra", "Luna"];
  collisionAlert.textContent = `⚠ COLISIÓN: ${n[a]} ↔ ${n[b]}`;
  collisionAlert.classList.add("visible");
}

export function hideCollisionAlert() {
  collisionAlert.classList.remove("visible");
}
