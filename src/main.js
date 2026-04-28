/**
 * Punto de entrada principal.
 * Conecta física (RK4), escena 3D, HUD, gráfica, colisiones y asteroides.
 */

import { initBodies, updateBodies, getSimState, resetSimulation, addAsteroid, removeAllAsteroids, addSlingshotAsteroid, removeAsteroid } from "./physics/gravity.js";
import { initHUD, updateHUD, getControlValues, isPaused, setPaused, getSpeedMultiplier, showCollisionAlert, hideCollisionAlert, showWarningAlert } from "./hud.js";
import { initChart, pushChartData, renderChart, clearChartData } from "./chart.js";
import { checkCollisions, spawnExplosion, updateExplosions, clearExplosions, getCollisionNames, getBodyName } from "./collision.js";
import { initScene, updateVisuals, clearTrails, render, getRenderPositions, getScene, addAsteroidVisual, removeAllAsteroidVisuals, removeAsteroidVisual } from "./scene.js";

const BASE_STEPS = 50;
let lastTime = 0;
let chartFrame = 0;
let asteroidLocalCount = 0;

initScene();
initBodies();
initChart();
initHUD({
  onReset: () => {
    const v = getControlValues();
    removeAllAsteroidVisuals();
    asteroidLocalCount = 0;
    resetSimulation(v.earthV, v.moonV, v.sunMass, v.earthMass, v.moonMass);
    clearTrails();
    clearChartData();
    clearExplosions();
    hideCollisionAlert();
  },
  onAddAsteroid: (params) => {
    const { index, body } = addAsteroid(params);
    addAsteroidVisual(asteroidLocalCount);
    asteroidLocalCount++;
  },
  onClearAsteroids: () => {
    const removed = removeAllAsteroids();
    if (removed > 0) {
      removeAllAsteroidVisuals();
      asteroidLocalCount = 0;
      clearTrails();
    }
  },
  onSlingshot: () => {
    const { index, body } = addSlingshotAsteroid();
    addAsteroidVisual(asteroidLocalCount);
    asteroidLocalCount++;
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
      const { nameA, nameB } = getCollisionNames(collision.bodyA, collision.bodyB);
      
      // Caso especial: Asteroide colisiona con el Sol
      const isSunA = collision.bodyA === 0;
      const isSunB = collision.bodyB === 0;
      const isAstA = collision.bodyA >= 3;
      const isAstB = collision.bodyB >= 3;

      if ((isSunA && isAstB) || (isSunB && isAstA)) {
        const asteroidIdx = isAstA ? collision.bodyA : collision.bodyB;
        
        // Efecto visual
        spawnExplosion(getScene(), collision.position, collision.scale);
        showWarningAlert(getBodyName(asteroidIdx), "Sol");
        
        // Eliminar asteroide
        removeAsteroid(asteroidIdx);
        removeAsteroidVisual(asteroidIdx - 3);
      } else {
        // Colisión normal (Tierra, Luna o entre astros principales) -> PAUSA
        setPaused(true);
        spawnExplosion(getScene(), collision.position, collision.scale);
        showCollisionAlert(nameA, nameB);
      }
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