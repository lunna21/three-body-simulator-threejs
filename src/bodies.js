/**
 * Definiciones de los 3 cuerpos celestes: Sol, Tierra, Luna
 * con masas reales, posiciones iniciales y velocidades orbitales.
 *
 * Las órbitas se dan en el plano XZ (Y = arriba en Three.js).
 * La Tierra empieza sobre el eje X positivo y se mueve en dirección Z.
 * La Luna empieza un poco más allá de la Tierra en X.
 */

// Velocidades iniciales por defecto (m/s)
/* Definiciones de los 3 cuerpos celestes con constantes por defecto.
 */

export const DEFAULT_SUN_MASS = 1.989e30;
export const DEFAULT_EARTH_MASS = 5.972e24;
export const DEFAULT_MOON_MASS = 7.342e22;
export const DEFAULT_ASTEROID_MASS = DEFAULT_MOON_MASS * 0.10; // 10% de la Luna
// export const DEFAULT_ASTEROID_MASS = 1.989e30; // Igual a la masa del Sol (como pidió el usuario)
export const DEFAULT_EARTH_V = 29783;
export const DEFAULT_MOON_V = 1022;
export const bodies = [
  {
    name: "Sol",
    mass: DEFAULT_SUN_MASS,
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    color: 0xffdd44,
    radius: 5,
  },
  {
    name: "Tierra",
    mass: DEFAULT_EARTH_MASS,
    position: [1.496e11, 0, 0],
    velocity: [0, 0, DEFAULT_EARTH_V],
    color: 0x4488ff,
    radius: 2,
  },
  {
    name: "Luna",
    mass: DEFAULT_MOON_MASS,
    position: [1.496e11 + 3.844e8, 0, 0],
    velocity: [0, 0, DEFAULT_EARTH_V + DEFAULT_MOON_V],
    color: 0xcccccc,
    radius: 0.8,
  },
];