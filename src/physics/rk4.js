/**
 * ============================================================
 * Runge-Kutta 4th Order (RK4) Integrator
 * ============================================================
 *
 * Resuelve sistemas de ecuaciones diferenciales ordinarias (EDOs):
 *   dy/dt = f(t, y)
 *
 * El método RK4 usa 4 evaluaciones intermedias (etapas) por paso
 * temporal para lograr precisión de 4to orden, es decir, el error
 * de truncamiento local es O(dt^5).
 *
 * Vector de estado para N cuerpos (6 componentes por cuerpo):
 *   [x₀, y₀, z₀, vx₀, vy₀, vz₀, x₁, y₁, z₁, vx₁, vy₁, vz₁, ...]
 *
 * Vector de derivadas:
 *   [vx₀, vy₀, vz₀, ax₀, ay₀, az₀, vx₁, vy₁, vz₁, ax₁, ay₁, az₁, ...]
 * ============================================================
 */

const G = 6.674e-11; // Constante gravitacional (m³ kg⁻¹ s⁻²)

/**
 * Calcula las derivadas (lado derecho) de las ecuaciones de movimiento
 * para un sistema gravitacional de N cuerpos.
 *
 * Para cada cuerpo i:
 *   d(posición)/dt = velocidad           → se copian las componentes de velocidad
 *   d(velocidad)/dt = aceleración        → se calcula por la ley de gravitación de Newton
 *
 * Aceleración del cuerpo i debida al cuerpo j:
 *   a_ij = G · m_j · (r_j − r_i) / |r_j − r_i|³
 *
 * @param {Float64Array} state  - Vector de estado actual
 * @param {Float64Array} masses - Masas de los cuerpos
 * @param {number} n            - Número de cuerpos
 * @param {Float64Array} out    - Vector de derivadas (pre-asignado)
 */
export function computeDerivatives(state, masses, n, out) {
  for (let i = 0; i < n; i++) {
    const iOff = i * 6;

    // ── d(posición)/dt = velocidad ──
    // Simplemente copiamos las componentes de velocidad como derivadas de posición
    out[iOff + 0] = state[iOff + 3]; // dx/dt = vx
    out[iOff + 1] = state[iOff + 4]; // dy/dt = vy
    out[iOff + 2] = state[iOff + 5]; // dz/dt = vz

    // Inicializamos la aceleración en cero antes de sumar contribuciones
    out[iOff + 3] = 0; // ax
    out[iOff + 4] = 0; // ay
    out[iOff + 5] = 0; // az

    // ── d(velocidad)/dt = aceleración gravitacional ──
    // Sumamos la contribución gravitacional de cada cuerpo j ≠ i
    // Ley de Newton en forma vectorial: a_i += G · m_j · (r_j − r_i) / |r_j − r_i|³
    for (let j = 0; j < n; j++) {
      if (i === j) continue;

      const jOff = j * 6;

      // Vector de desplazamiento del cuerpo i al cuerpo j
      const dx = state[jOff + 0] - state[iOff + 0];
      const dy = state[jOff + 1] - state[iOff + 1];
      const dz = state[jOff + 2] - state[iOff + 2];

      // Distancia |r_j − r_i| con suavizado (softening)
      // El softening evita que la fuerza se vuelva infinita cuando dist → 0
      // lo cual causaría inestabilidad numérica en colisiones cercanas
      const SOFTENING_SQ = 1e14; // (1e7 m)² ≈ (10,000 km)²
      const rawDistSq = dx * dx + dy * dy + dz * dz;
      const distSq = rawDistSq + SOFTENING_SQ;
      const dist = Math.sqrt(distSq);

      // Magnitud de la aceleración: G · m_j / |r|³
      // Usamos dist³ = dist · distSq por eficiencia
      const accel = G * masses[j] / (dist * distSq);

      // Sumamos las componentes de la aceleración
      out[iOff + 3] += accel * dx;
      out[iOff + 4] += accel * dy;
      out[iOff + 5] += accel * dz;
    }
  }
}

/**
 * Ejecuta un paso del método RK4.
 *
 * Fórmula RK4:
 *   k₁ = f(tₙ, yₙ)                        ← derivada al inicio del paso
 *   k₂ = f(tₙ + dt/2, yₙ + (dt/2)·k₁)     ← derivada en el punto medio usando k₁
 *   k₃ = f(tₙ + dt/2, yₙ + (dt/2)·k₂)     ← derivada en el punto medio usando k₂
 *   k₄ = f(tₙ + dt, yₙ + dt·k₃)            ← derivada al final del paso usando k₃
 *
 *   yₙ₊₁ = yₙ + (dt/6)(k₁ + 2k₂ + 2k₃ + k₄)
 *
 * Esto da precisión de 4to orden: error por paso O(dt⁵),
 * error global sobre un intervalo fijo O(dt⁴).
 *
 * @param {Float64Array} state  - Vector de estado (se modifica in-place)
 * @param {Float64Array} masses - Masas de los cuerpos
 * @param {number} n            - Número de cuerpos
 * @param {number} dt           - Paso temporal en segundos
 * @param {object} temp         - Arrays temporales pre-asignados
 */
export function rk4Step(state, masses, n, dt, temp) {
  const len = n * 6;
  const { k1, k2, k3, k4, tmpState } = temp;

  // ── Etapa 1: k₁ = f(tₙ, yₙ) ──
  // Evaluamos las derivadas en el estado actual
  computeDerivatives(state, masses, n, k1);

  // ── Etapa 2: k₂ = f(tₙ + dt/2, yₙ + (dt/2)·k₁) ──
  // Construimos el estado intermedio avanzando medio paso con k₁
  for (let i = 0; i < len; i++) {
    tmpState[i] = state[i] + 0.5 * dt * k1[i];
  }
  // Evaluamos las derivadas en este punto medio
  computeDerivatives(tmpState, masses, n, k2);

  // ── Etapa 3: k₃ = f(tₙ + dt/2, yₙ + (dt/2)·k₂) ──
  // Construimos otro estado intermedio usando k₂ en vez de k₁
  for (let i = 0; i < len; i++) {
    tmpState[i] = state[i] + 0.5 * dt * k2[i];
  }
  // Evaluamos las derivadas en este segundo punto medio
  computeDerivatives(tmpState, masses, n, k3);

  // ── Etapa 4: k₄ = f(tₙ + dt, yₙ + dt·k₃) ──
  // Construimos el estado al final del paso completo usando k₃
  for (let i = 0; i < len; i++) {
    tmpState[i] = state[i] + dt * k3[i];
  }
  // Evaluamos las derivadas al final del paso
  computeDerivatives(tmpState, masses, n, k4);

  // ── Combinación final ──
  // yₙ₊₁ = yₙ + (dt/6)(k₁ + 2k₂ + 2k₃ + k₄)
  // Este promedio ponderado es lo que da la precisión de 4to orden
  const dt6 = dt / 6;
  for (let i = 0; i < len; i++) {
    state[i] += dt6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
}

/**
 * Asigna los arrays temporales necesarios para el integrador RK4.
 * La pre-asignación evita la recolección de basura durante el bucle de simulación.
 *
 * @param {number} n - Número de cuerpos
 * @returns {object} Almacenamiento temporal { k1, k2, k3, k4, tmpState }
 */
export function createRK4Temp(n) {
  const len = n * 6;
  return {
    k1: new Float64Array(len),
    k2: new Float64Array(len),
    k3: new Float64Array(len),
    k4: new Float64Array(len),
    tmpState: new Float64Array(len),
  };
}
