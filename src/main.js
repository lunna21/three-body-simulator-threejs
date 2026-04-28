/**
 * Punto de entrada principal.
 * Conecta física (RK4), escena 3D, HUD, gráfica y colisiones.
 */

import { initScene, updateVisuals, clearTrails, render, getRenderPositions, getScene } from "./scene.js";
import { initBodies, updateBodies, getSimState, resetSimulation } from "./physics/gravity.js";
import { initHUD, updateHUD, getControlValues, isPaused, setPaused, getSpeedMultiplier, showCollisionAlert, hideCollisionAlert } from "./hud.js";
import { initChart, pushChartData, renderChart, clearChartData } from "./chart.js";
import { checkCollisions, spawnExplosion, updateExplosions, clearExplosions } from "./collision.js";

const BASE_STEPS = 50;
let lastTime = 0;
let chartFrame = 0;

initScene();
initBodies();
initChart();
initHUD({
  onReset: () => {
    const v = getControlValues();
    resetSimulation(v.earthV, v.moonV, v.sunMass, v.earthMass, v.moonMass);
    clearTrails();
    clearChartData();
    clearExplosions();
    hideCollisionAlert();
  },
});

function animate(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  if (!isPaused()) {
    const steps = Math.max(1, Math.round(BASE_STEPS * getSpeedMultiplier()));
    updateBodies(steps);
    updateVisuals();

    // Colisiones
    const collision = checkCollisions(getRenderPositions());
    if (collision) {
      setPaused(true);
      spawnExplosion(getScene(), collision.position, collision.scale);
      showCollisionAlert(collision.bodyA, collision.bodyB);
    }

    // Gráfica (cada 3 frames)
    chartFrame++;
    if (chartFrame % 3 === 0) {
      const s = getSimState();
      pushChartData(s.elapsedDays, s.totalEnergy, s.relativeError);
    }
  }

  // Explosiones se actualizan aunque esté en pausa
  updateExplosions(delta);
  updateHUD(getSimState());
  renderChart();
  render();

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);