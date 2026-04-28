/**
 * Punto de entrada principal.
 * Conecta el motor de física (RK4), la escena 3D (Three.js) y el HUD.
 */

import { initScene, updateVisuals, clearTrails, render } from "./scene.js";
import {
  initBodies,
  updateBodies,
  getSimState,
  resetSimulation,
} from "./physics/gravity.js";
import { initHUD, updateHUD, getControlValues } from "./hud.js";

// ── Inicialización ──
initScene();
initBodies();
initHUD({
  onReset: () => {
    const { earthV, moonV } = getControlValues();
    resetSimulation(earthV, moonV);
    clearTrails();
  },
});

// ── Bucle de animación ──
function animate() {
  const { steps } = getControlValues();
  updateBodies(steps);
  updateVisuals();
  updateHUD(getSimState());
  render();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);