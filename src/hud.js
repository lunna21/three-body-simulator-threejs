/**
 * HUD: controles de reproducción, sliders de configuración,
 * tarjetas de datos, alerta de colisión y controles de asteroides.
 */

import {
  DEFAULT_EARTH_V, DEFAULT_MOON_V,
  DEFAULT_SUN_MASS, DEFAULT_EARTH_MASS, DEFAULT_MOON_MASS,
  DEFAULT_ASTEROID_MASS,
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
let asteroidCountEl;

// Asteroid sliders
let slAstSpeed, slAstDir, slAstMass;
let vAstSpeed, vAstDir, vAstMass;
let chkRandomDir;

function logToMass(v) { return Math.pow(10, v); }
function massToLog(m) { return Math.log10(m); }

function updateSliderTexts() {
  vEarthV.textContent = `${parseInt(slEarthV.value).toLocaleString()} m/s`;
  vMoonV.textContent = `${parseInt(slMoonV.value).toLocaleString()} m/s`;
  vSunM.textContent = `${logToMass(parseFloat(slSunM.value)).toExponential(2)} kg`;
  vEarthM.textContent = `${logToMass(parseFloat(slEarthM.value)).toExponential(2)} kg`;
  vMoonM.textContent = `${logToMass(parseFloat(slMoonM.value)).toExponential(2)} kg`;
}

function updateAsteroidSliderTexts() {
  vAstSpeed.textContent = `${(parseInt(slAstSpeed.value) / 1000).toFixed(1)} km/s`;
  vAstDir.textContent = chkRandomDir.checked ? "Aleatorio" : `${parseInt(slAstDir.value)}°`;
  vAstMass.textContent = `${logToMass(parseFloat(slAstMass.value)).toExponential(2)} kg`;

  // Dim the direction slider when random is checked
  slAstDir.style.opacity = chkRandomDir.checked ? "0.35" : "1";
}

function updatePauseBtn() {
  btnPause.textContent = paused ? "▶" : "⏸";
}

export function initHUD({ onReset, onAddAsteroid, onClearAsteroids, onSlingshot }) {
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

  // Sliders — System
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

  // Sliders — Asteroids
  slAstSpeed = document.getElementById("slider-ast-speed");
  slAstDir = document.getElementById("slider-ast-dir");
  slAstMass = document.getElementById("slider-ast-mass");
  vAstSpeed = document.getElementById("val-ast-speed");
  vAstDir = document.getElementById("val-ast-dir");
  vAstMass = document.getElementById("val-ast-mass");
  chkRandomDir = document.getElementById("chk-ast-random-dir");

  // Asteroid count
  asteroidCountEl = document.getElementById("asteroid-count");

  // Defaults — System
  slEarthV.value = DEFAULT_EARTH_V;
  slMoonV.value = DEFAULT_MOON_V;
  slSunM.value = massToLog(DEFAULT_SUN_MASS);
  slEarthM.value = massToLog(DEFAULT_EARTH_MASS);
  slMoonM.value = massToLog(DEFAULT_MOON_MASS);
  updateSliderTexts();

  // Defaults — Asteroids
  slAstSpeed.value = 30000;
  slAstDir.value = 0;
  slAstMass.value = massToLog(DEFAULT_ASTEROID_MASS);
  chkRandomDir.checked = true;
  updateAsteroidSliderTexts();

  slEarthV.oninput = slMoonV.oninput =
    slSunM.oninput = slEarthM.oninput = slMoonM.oninput = updateSliderTexts;

  slAstSpeed.oninput = slAstDir.oninput = slAstMass.oninput = updateAsteroidSliderTexts;
  chkRandomDir.onchange = updateAsteroidSliderTexts;

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

  // ── Asteroids ──
  document.getElementById("btn-add-asteroid").addEventListener("click", () => {
    if (onAddAsteroid) {
      const params = getAsteroidParams();
      onAddAsteroid(params);
    }
  });

  document.getElementById("btn-clear-asteroids").addEventListener("click", () => {
    if (onClearAsteroids) onClearAsteroids();
  });

  document.getElementById("btn-slingshot").addEventListener("click", () => {
    if (onSlingshot) onSlingshot();
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

/**
 * Lee los parámetros configurados para el próximo asteroide.
 * Si "Dirección aleatoria" está marcado, genera un ángulo aleatorio.
 */
function getAsteroidParams() {
  const speed = parseFloat(slAstSpeed.value) || 30000;
  const mass = logToMass(parseFloat(slAstMass.value));
  const directionDeg = chkRandomDir.checked
    ? Math.random() * 360
    : parseFloat(slAstDir.value) || 0;

  return { speed, directionDeg, mass };
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

  // Actualizar conteo de asteroides
  if (asteroidCountEl) {
    const count = (s.bodyCount || 3) - 3;
    asteroidCountEl.textContent = count;
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

export function showCollisionAlert(nameA, nameB) {
  collisionAlert.textContent = `⚠ COLISIÓN: ${nameA} ↔ ${nameB}`;
  collisionAlert.classList.add("visible");
}

/**
 * Muestra un aviso de colisión que se oculta automáticamente (para asteroides vs Sol).
 */
export function showWarningAlert(nameA, nameB) {
  collisionAlert.textContent = `☄ CONSUMIDO: ${nameA} absorbido por ${nameB}`;
  collisionAlert.classList.add("visible");
  
  // Auto-ocultar después de 3 segundos
  setTimeout(() => {
    hideCollisionAlert();
  }, 3000);
}

export function hideCollisionAlert() {
  collisionAlert.classList.remove("visible");
}
