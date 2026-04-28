/**
 * Definiciones de los 3 cuerpos celestes: Sol, Tierra, Luna
 * con masas reales, posiciones iniciales y velocidades orbitales.
 *
 * Las órbitas se dan en el plano XZ (Y = arriba en Three.js).
 * La Tierra empieza sobre el eje X positivo y se mueve en dirección Z.
 * La Luna empieza un poco más allá de la Tierra en X.
 */

// Velocidades iniciales por defecto (m/s)
export const DEFAULT_EARTH_V = 29783; // velocidad orbital de la Tierra (~29.78 km/s)
export const DEFAULT_MOON_V = 1022;   // velocidad orbital de la Luna relativa a la Tierra (~1.02 km/s)

export const bodies = [
  {
    name: "Sol",
    mass: 1.989e30,       // kg
    position: [0, 0, 0],  // m — origen del sistema
    velocity: [0, 0, 0],  // m/s — estacionario (aprox.)
    color: 0xffdd44,
  },
  {
    name: "Tierra",
    mass: 5.972e24,                    // kg
    position: [1.496e11, 0, 0],        // m — 1 UA del Sol
    velocity: [0, 0, DEFAULT_EARTH_V], // m/s — tangencial en Z
    color: 0x4488ff,
  },
  {
    name: "Luna",
    mass: 7.342e22,                                  // kg
    position: [1.496e11 + 3.844e8, 0, 0],            // m — 384,400 km más allá de la Tierra
    velocity: [0, 0, DEFAULT_EARTH_V + DEFAULT_MOON_V], // m/s — velocidad Tierra + orbital Luna
    color: 0xcccccc,
  },
];