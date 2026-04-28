/**
 * Motor de simulación gravitacional.
 * Gestiona el estado del sistema, ejecuta pasos de integración RK4,
 * y calcula la energía mecánica total para monitorear la conservación.
 *
 * Soporta N cuerpos dinámicos (3 base + asteroides).
 */

import {
  bodies,
  DEFAULT_EARTH_V,
  DEFAULT_MOON_V,
  DEFAULT_SUN_MASS,
  DEFAULT_EARTH_MASS,
  DEFAULT_MOON_MASS,
  DEFAULT_ASTEROID_MASS,
} from "../bodies.js";
import { rk4Step, createRK4Temp } from "./rk4.js";

const G = 6.674e-11; // Constante gravitacional
const DT = 3600;     // Paso de integración: 1 hora en segundos

let N = 3;           // Número de cuerpos (dinámico)
let state;           // Float64Array(N*6) — vector de estado plano
let masses;          // Float64Array(N)   — masas
let temp;            // Temporales pre-asignados para RK4
let elapsedTime = 0; // Tiempo transcurrido en segundos
let E0 = 0;          // Energía total inicial (para calcular error relativo)

/**
 * Empaqueta los datos de los cuerpos en arrays planos para el integrador.
 * Calcula la energía total inicial E₀.
 */
export function initBodies() {
  N = bodies.length;
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

    // Tracking para slingshot (solo asteroides, i >= 3)
    if (i >= 3) {
      const distToMoon = bodyDist(i, 2);
      const distToEarth = bodyDist(i, 1);
      
      if (distToMoon < 1e7 || distToEarth < 2e7) {
        if (!bodies[i]._slingshotActive) {
          console.log(`%c🚀 ASISTENCIA GRAVITATORIA: ${bodies[i].name} entrando en zona de influencia.`, "color: #ff44ff; font-weight: bold;");
          bodies[i]._slingshotActive = true;
        }
      } else if (bodies[i]._slingshotActive) {
        console.log(`%c✨ SLINGSHOT COMPLETADO: ${bodies[i].name} ha sido arrojado a una nueva trayectoria.`, "color: #ffaa00; font-weight: bold;");
        bodies[i]._slingshotActive = false;
      }
    }
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

  const bodyData = [];
  for (let i = 0; i < N; i++) {
    bodyData.push({
      name: bodies[i].name,
      speed: bodySpeed(i),
      mass: masses[i],
    });
  }

  return {
    elapsedDays: elapsedTime / 86400,
    totalEnergy,
    initialEnergy: E0,
    relativeError,
    earthSpeed: bodySpeed(1),
    bodyData,
    bodyCount: N,
    distSunEarth: bodyDist(0, 1),
    distEarthMoon: bodyDist(1, 2),
    distSunMoon: bodyDist(0, 2),
  };
}

/**
 * Reinicia la simulación con nuevas velocidades iniciales.
 * Elimina todos los asteroides al reiniciar.
 */
export function resetSimulation(earthV, moonV, sunMass, earthMass, moonMass) {
  // Eliminar asteroides del array de bodies
  bodies.length = 3;

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

/**
 * Añade un asteroide que "cruza" el sistema.
 * El asteroide aparece a una distancia lejana (2.5 AU) y se mueve
 * hacia el sistema desde el ángulo especificado.
 *
 * @param {object} params - Parámetros del asteroide { speed, directionDeg, mass }
 * @returns {{ index: number, body: object }} Índice y datos del asteroide
 */
export function addAsteroid(params = {}) {
  const {
    speed = 30000,
    directionDeg = Math.random() * 360,
    mass = DEFAULT_ASTEROID_MASS,
  } = params;

  const AU = 1.496e11;
  const R_START = 2.5 * AU; // Distancia de inicio (fuera de la órbita terrestre)

  // Interpretamos directionDeg como el ÁNGULO DE ORIGEN (de dónde viene)
  const phi = directionDeg * (Math.PI / 180);

  // Posición inicial en el círculo exterior
  const startX = Math.cos(phi);
  const startZ = Math.sin(phi);

  // Vector perpendicular para el desplazamiento lateral
  const lateralOffset = (Math.random() - 0.5) * 1.2 * AU; // +/- 0.6 AU
  const perpX = -startZ;
  const perpZ = startX;

  const px = R_START * startX + lateralOffset * perpX;
  const pz = R_START * startZ + lateralOffset * perpZ;

  // La velocidad apunta hacia el origen (opuesto al vector de posición base)
  // pero mantenemos la dirección paralela al radio para que "cruce" el centro.
  const vx = -speed * startX;
  const vz = -speed * startZ;

  // Crear el cuerpo asteroide
  const asteroidIndex = bodies.length;
  const body = {
    name: `Asteroide ${asteroidIndex - 2}`,
    mass: mass,
    position: [px, 0, pz],
    velocity: [vx, 0, vz],
    color: 0xff8844,
    radius: 0.4,
  };
  bodies.push(body);

  // Reconstruir arrays del integrador preservando el estado actual
  _rebuildState();

  return { index: asteroidIndex, body };
}

/**
 * Añade un asteroide "quemado" (hardcoded) diseñado para pasar cerca de la Luna
 * y demostrar el efecto de asistencia gravitatoria (slingshot).
 */
export function addSlingshotAsteroid() {
  const AU = 1.496e11;
  const MOON_DIST = 3.844e8;
  
  // Posición de la Tierra en t=0
  const ex = AU;
  const ez = 0;
  
  // Posición de la Luna en t=0
  const mx = ex + MOON_DIST;
  const mz = 0;

  // Queremos que el asteroide pase cerca de la luna.
  // Lo lanzamos desde "abajo" (Z negativo) para que alcance a la Luna.
  // La Luna se mueve a ~30.8 km/s en Z.
  // Lanzamos el asteroide a 35 km/s en Z.
  
  const asteroidIndex = bodies.length;
  const body = {
    name: `Slinger ${asteroidIndex - 2}`,
    mass: DEFAULT_MOON_MASS * 0.001, // 0.1% de la Luna (masa pequeña como pide el usuario)
    position: [mx + 1e7, 0, -3e8],  // 10,000 km a la derecha, 300,000 km atrás
    velocity: [0, 0, 36000],        // 36 km/s (alcanza a la Luna que va a 30.8 km/s)
    color: 0xff44ff,
    radius: 0.6,
  };
  
  bodies.push(body);
  _rebuildState();
  
  return { index: asteroidIndex, body };
}

/**
 * Elimina todos los asteroides del sistema, dejando solo Sol, Tierra y Luna.
 * @returns {number} Número de asteroides eliminados
 */
export function removeAllAsteroids() {
  const removed = bodies.length - 3;
  if (removed <= 0) return 0;

  bodies.length = 3;
  _rebuildState();

  return removed;
}

/**
 * Elimina un asteroide específico del sistema.
 * @param {number} index - Índice del cuerpo en el array `bodies`.
 */
export function removeAsteroid(index) {
  if (index < 3 || index >= bodies.length) return;
  bodies.splice(index, 1);

  // Re-inicializar arrays planos preservando el tiempo transcurrido
  N = bodies.length;
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
  E0 = computeTotalEnergy();
}

/** Devuelve la cantidad actual de cuerpos en la simulación */
export function getBodyCount() {
  return N;
}

/**
 * Reconstruye los arrays de estado, masas y temporales RK4
 * preservando los datos de los cuerpos existentes.
 * Se llama internamente cuando se añaden o eliminan cuerpos.
 */
function _rebuildState() {
  const oldN = N;
  N = bodies.length;

  const newState = new Float64Array(N * 6);
  const newMasses = new Float64Array(N);

  // Copiar datos existentes (min de oldN y N para no desbordar)
  const copyCount = Math.min(oldN, N);
  for (let i = 0; i < copyCount; i++) {
    const off = i * 6;
    newState[off + 0] = state[off + 0];
    newState[off + 1] = state[off + 1];
    newState[off + 2] = state[off + 2];
    newState[off + 3] = state[off + 3];
    newState[off + 4] = state[off + 4];
    newState[off + 5] = state[off + 5];
    newMasses[i] = masses[i];
  }

  // Escribir datos de los cuerpos nuevos (si hay)
  for (let i = copyCount; i < N; i++) {
    const b = bodies[i];
    const off = i * 6;
    newState[off + 0] = b.position[0];
    newState[off + 1] = b.position[1];
    newState[off + 2] = b.position[2];
    newState[off + 3] = b.velocity[0];
    newState[off + 4] = b.velocity[1];
    newState[off + 5] = b.velocity[2];
    newMasses[i] = b.mass;
  }

  state = newState;
  masses = newMasses;
  temp = createRK4Temp(N);

  // Recalcular E0 para que el error relativo se mida desde el sistema actual
  E0 = computeTotalEnergy();
}
