/**
 * Módulo HUD: controla la interfaz de información en pantalla
 * y los controles del usuario (velocidades iniciales, reinicio).
 */

import { DEFAULT_EARTH_V, DEFAULT_MOON_V } from "./bodies.js";

let hudDays, hudEnergy, hudError, hudSpeed;
let inputEarthV, inputMoonV, inputSteps;

/**
 * Inicializa el HUD: obtiene referencias a los elementos del DOM
 * y configura el evento del botón de reinicio.
 *
 * @param {object} opts
 * @param {Function} opts.onReset - Callback al presionar "Reiniciar"
 */
export function initHUD({ onReset }) {
  hudDays = document.getElementById("hud-days");
  hudEnergy = document.getElementById("hud-energy");
  hudError = document.getElementById("hud-error");
  hudSpeed = document.getElementById("hud-speed");

  inputEarthV = document.getElementById("input-earth-v");
  inputMoonV = document.getElementById("input-moon-v");
  inputSteps = document.getElementById("input-steps");

  // Valores por defecto
  inputEarthV.value = DEFAULT_EARTH_V;
  inputMoonV.value = DEFAULT_MOON_V;
  inputSteps.value = 50;

  document.getElementById("btn-reset").addEventListener("click", () => {
    if (onReset) onReset();
  });
}

/**
 * Actualiza los valores del HUD con el estado actual de la simulación.
 *
 * @param {object} simState
 * @param {number} simState.elapsedDays
 * @param {number} simState.totalEnergy
 * @param {number} simState.relativeError
 * @param {number} simState.earthSpeed
 */
export function updateHUD(simState) {
  hudDays.textContent = simState.elapsedDays.toFixed(1);
  hudEnergy.textContent = simState.totalEnergy.toExponential(4);
  hudError.textContent = simState.relativeError.toExponential(3);
  hudSpeed.textContent = simState.earthSpeed.toFixed(0);
}

/**
 * Lee los valores actuales de los controles del usuario.
 */
export function getControlValues() {
  return {
    earthV: parseFloat(inputEarthV.value) || DEFAULT_EARTH_V,
    moonV: parseFloat(inputMoonV.value) || DEFAULT_MOON_V,
    steps: parseInt(inputSteps.value) || 50,
  };
}
