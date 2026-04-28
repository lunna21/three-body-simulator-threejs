/**
 * Detección de colisiones y efecto visual de explosión con partículas.
 */

import * as THREE from "three";

const PARTICLE_COUNT = 250;
const EXPLOSION_DURATION = 2.5; // segundos
const VISUAL_RADII = [5, 2, 0.8]; // Sol, Tierra, Luna (render units)
const BODY_NAMES = ["Sol", "Tierra", "Luna"];

let explosions = [];
let lastCollision = null;

/**
 * Revisa colisiones entre todos los pares de cuerpos en espacio de render.
 * @param {THREE.Vector3[]} renderPositions — posiciones renderizadas de los 3 cuerpos
 * @returns {{ bodyA: number, bodyB: number, position: THREE.Vector3, scale: number } | null}
 */
export function checkCollisions(renderPositions) {
  if (!renderPositions || renderPositions.length < 3) return null;

  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const dist = renderPositions[i].distanceTo(renderPositions[j]);
      const threshold = VISUAL_RADII[i] + VISUAL_RADII[j];
      if (dist < threshold) {
        const midpoint = new THREE.Vector3()
          .addVectors(renderPositions[i], renderPositions[j])
          .multiplyScalar(0.5);
        const scale = threshold / 5;
        lastCollision = { bodyA: i, bodyB: j, position: midpoint, scale };
        return lastCollision;
      }
    }
  }
  return null;
}

/**
 * Genera la explosión visual: partículas + onda de choque + flash de luz.
 */
export function spawnExplosion(scene, position, scale) {
  // ── Partículas ──
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = position.x;
    positions[i3 + 1] = position.y;
    positions[i3 + 2] = position.z;

    // Dirección aleatoria esférica
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = (0.5 + Math.random() * 1.5) * scale * 30;
    velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
    velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    velocities[i3 + 2] = Math.cos(phi) * speed;

    // Color: blanco → naranja → rojo
    const t = Math.random();
    colors[i3] = 1;
    colors[i3 + 1] = 0.3 + t * 0.7;
    colors[i3 + 2] = t * 0.3;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.8 * scale,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // ── Onda de choque ──
  const ringGeo = new THREE.RingGeometry(0.1, 0.6, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff8844,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(position);
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);

  // ── Flash de luz ──
  const light = new THREE.PointLight(0xff6600, 5, 200);
  light.position.copy(position);
  scene.add(light);

  explosions.push({
    points, geo, mat, velocities, positions,
    ring, ringGeo, ringMat,
    light, scene,
    elapsed: 0,
    duration: EXPLOSION_DURATION,
    scale,
  });
}

/**
 * Actualiza todas las explosiones activas (llamar cada frame, incluso en pausa).
 */
export function updateExplosions(delta) {
  for (let e = explosions.length - 1; e >= 0; e--) {
    const exp = explosions[e];
    exp.elapsed += delta;
    const t = exp.elapsed / exp.duration;

    if (t >= 1) {
      // Limpiar explosión terminada
      exp.scene.remove(exp.points);
      exp.scene.remove(exp.ring);
      exp.scene.remove(exp.light);
      exp.geo.dispose();
      exp.mat.dispose();
      exp.ringGeo.dispose();
      exp.ringMat.dispose();
      explosions.splice(e, 1);
      continue;
    }

    // Mover partículas
    const posAttr = exp.geo.attributes.position;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      posAttr.array[i3] += exp.velocities[i3] * delta;
      posAttr.array[i3 + 1] += exp.velocities[i3 + 1] * delta;
      posAttr.array[i3 + 2] += exp.velocities[i3 + 2] * delta;
      exp.velocities[i3] *= 0.97;
      exp.velocities[i3 + 1] *= 0.97;
      exp.velocities[i3 + 2] *= 0.97;
    }
    posAttr.needsUpdate = true;

    // Fade out partículas
    exp.mat.opacity = 1 - t;

    // Expandir onda de choque
    const rs = 1 + t * 40 * exp.scale;
    exp.ring.scale.set(rs, rs, rs);
    exp.ringMat.opacity = 0.8 * (1 - t);

    // Parpadeo de luz
    exp.light.intensity = 5 * (1 - t) * (1 + Math.sin(t * 20) * 0.3);
  }
}

export function getLastCollision() {
  return lastCollision;
}

export function clearExplosions() {
  for (const exp of explosions) {
    exp.scene.remove(exp.points);
    exp.scene.remove(exp.ring);
    exp.scene.remove(exp.light);
    exp.geo.dispose();
    exp.mat.dispose();
    exp.ringGeo.dispose();
    exp.ringMat.dispose();
  }
  explosions = [];
  lastCollision = null;
}
