/**
 * Motor de simulación gravitacional.
 * Gestiona el estado del sistema, ejecuta pasos de integración RK4,
 * y calcula la energía mecánica total para monitorear la conservación.
 */

import {
  bodies,
  DEFAULT_EARTH_V,
  DEFAULT_MOON_V,
  DEFAULT_SUN_MASS,
  DEFAULT_EARTH_MASS,
  DEFAULT_MOON_MASS,
} from "../bodies.js";
import { rk4Step, createRK4Temp } from "./rk4.js";

const G = 6.674e-11; // Constante gravitacional
const N = 3;         // Número de cuerpos
const DT = 3600;     // Paso de integración: 1 hora en segundos

let state;           // Float64Array(18) — vector de estado plano
let masses;          // Float64Array(3)  — masas
let temp;            // Temporales pre-asignados para RK4
let elapsedTime = 0; // Tiempo transcurrido en segundos
let E0 = 0;          // Energía total inicial (para calcular error relativo)

/**
 * Empaqueta los datos de los cuerpos en arrays planos para el integrador.
 * Calcula la energía total inicial E₀.
 */
export function initBodies() {
  state = new Float64Array(N * 6);
  masses = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    const b = bodies[i];
    masses[i] = b.mass;
    state[i * 6 + 0] = b.position[0];
    state[i * 6 + 1] = b.position[1];
    state[i * 6 + 2] = b.position[2];
    state[i * 6 + 3] = b.velocity[0];
    state[i * 6 + 4] = b.velocity[1];
    state[i * 6 + 5] = b.velocity[2];
  }

  temp = createRK4Temp(N);
  elapsedTime = 0;
  E0 = computeTotalEnergy();
}

/**
 * Avanza la simulación `steps` pasos de integración RK4.
 * Después de integrar, desempaqueta las posiciones/velocidades
 * de vuelta al array `bodies[]` para que la escena pueda renderizarlas.
 *
 * @param {number} steps - Número de pasos RK4 a ejecutar por frame
 */
export function updateBodies(steps) {
  for (let s = 0; s < steps; s++) {
    rk4Step(state, masses, N, DT, temp);
  }
  elapsedTime += steps * DT;

  // Desempaquetar posiciones/velocidades → array de bodies
  for (let i = 0; i < N; i++) {
    const off = i * 6;
    bodies[i].position[0] = state[off + 0];
    bodies[i].position[1] = state[off + 1];
    bodies[i].position[2] = state[off + 2];
    bodies[i].velocity[0] = state[off + 3];
    bodies[i].velocity[1] = state[off + 4];
    bodies[i].velocity[2] = state[off + 5];
  }
}

/**
 * Calcula la energía mecánica total del sistema:
 *   E = KE + PE
 *   KE = Σ ½·m·v²              (energía cinética)
 *   PE = Σ_{i<j} −G·mᵢ·mⱼ/|rᵢⱼ|  (energía potencial gravitacional)
 *
 * @returns {number} Energía total en Joules
 */
export function computeTotalEnergy() {
  let ke = 0;
  let pe = 0;

  for (let i = 0; i < N; i++) {
    const off = i * 6;
    const vx = state[off + 3];
    const vy = state[off + 4];
    const vz = state[off + 5];
    ke += 0.5 * masses[i] * (vx * vx + vy * vy + vz * vz);
  }

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const iOff = i * 6;
      const jOff = j * 6;
      const dx = state[jOff + 0] - state[iOff + 0];
      const dy = state[jOff + 1] - state[iOff + 1];
      const dz = state[jOff + 2] - state[iOff + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      pe -= (G * masses[i] * masses[j]) / dist;
    }
  }

  return ke + pe;
}

/** Distancia entre dos cuerpos (metros) */
function bodyDist(a, b) {
  const aOff = a * 6,
    bOff = b * 6;
  const dx = state[bOff] - state[aOff];
  const dy = state[bOff + 1] - state[aOff + 1];
  const dz = state[bOff + 2] - state[aOff + 2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Velocidad escalar de un cuerpo (m/s) */
function bodySpeed(i) {
  const off = i * 6;
  const vx = state[off + 3],
    vy = state[off + 4],
    vz = state[off + 5];
  return Math.sqrt(vx * vx + vy * vy + vz * vz);
}

/**
 * Devuelve el estado completo de la simulación para el HUD y la gráfica.
 */
export function getSimState() {
  const totalEnergy = computeTotalEnergy();
  const relativeError = Math.abs((totalEnergy - E0) / E0);

  return {
    elapsedDays: elapsedTime / 86400,
    totalEnergy,
    initialEnergy: E0,
    relativeError,
    earthSpeed: bodySpeed(1),
    bodyData: [
      { name: "Sol", speed: bodySpeed(0), mass: masses[0] },
      { name: "Tierra", speed: bodySpeed(1), mass: masses[1] },
      { name: "Luna", speed: bodySpeed(2), mass: masses[2] },
    ],
    distSunEarth: bodyDist(0, 1),
    distEarthMoon: bodyDist(1, 2),
    distSunMoon: bodyDist(0, 2),
  };
}

/**
 * Reinicia la simulación con nuevas velocidades iniciales.
 *
 * @param {number} earthV - Velocidad inicial de la Tierra (m/s)
 * @param {number} moonV  - Velocidad inicial de la Luna relativa a la Tierra (m/s)
 */
export function resetSimulation(earthV, moonV, sunMass, earthMass, moonMass) {
  bodies[0].position = [0, 0, 0];
  bodies[0].velocity = [0, 0, 0];
  bodies[0].mass = sunMass ?? DEFAULT_SUN_MASS;

  bodies[1].position = [1.496e11, 0, 0];
  bodies[1].velocity = [0, 0, earthV];
  bodies[1].mass = earthMass ?? DEFAULT_EARTH_MASS;

  bodies[2].position = [1.496e11 + 3.844e8, 0, 0];
  bodies[2].velocity = [0, 0, earthV + moonV];
  bodies[2].mass = moonMass ?? DEFAULT_MOON_MASS;

  initBodies();
}
