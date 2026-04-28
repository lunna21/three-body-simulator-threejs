/**
 * Escena 3D con Three.js: Sol, Tierra, Luna, estrellas y trayectorias.
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { bodies } from "./bodies.js";

// ── Escala de renderizado ──
// 1 UA (1.496e11 m) = 100 unidades de Three.js
const AU = 1.496e11;
const SCALE = 100 / AU;

// Factor de exageración para la distancia Tierra-Luna en la visualización.
// Sin esto, la Luna aparece pegada a la Tierra porque la distancia real
// Tierra-Luna es ~400× menor que la distancia Sol-Tierra.
const MOON_EXAGGERATION = 20;

// Configuración de las trayectorias (trails)
const MAX_TRAIL_POINTS = 8000;

let scene, camera, renderer, controls;
let sunMesh, earthMesh, moonMesh;
let earthTrailData, moonTrailData;
let cachedRenderPositions = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

/** Convierte posición SI → Three.js (exagera la Luna) */
export function toRenderPos(bodyIndex) {
  const pos = bodies[bodyIndex].position;

  if (bodyIndex === 2) {
    // Luna: exagerar el offset desde la Tierra
    const ep = bodies[1].position;
    return new THREE.Vector3(
      ep[0] * SCALE + (pos[0] - ep[0]) * SCALE * MOON_EXAGGERATION,
      ep[1] * SCALE + (pos[1] - ep[1]) * SCALE * MOON_EXAGGERATION,
      ep[2] * SCALE + (pos[2] - ep[2]) * SCALE * MOON_EXAGGERATION
    );
  }

  return new THREE.Vector3(pos[0] * SCALE, pos[1] * SCALE, pos[2] * SCALE);
}

export function getScene() { return scene; }

export function getRenderPositions() { return cachedRenderPositions; }

function createStarfield() {
  const count = 3000;
  const v = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    const r = 800 + Math.random() * 400;
    v[i * 3] = r * Math.sin(p) * Math.cos(t);
    v[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
    v[i * 3 + 2] = r * Math.cos(p);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(v, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true })));
}

function createSunGlow() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const cx = c.getContext("2d");
  const g = cx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,220,80,0.5)");
  g.addColorStop(0.25, "rgba(255,180,40,0.25)");
  g.addColorStop(1, "rgba(255,150,0,0)");
  cx.fillStyle = g;
  cx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(25, 25, 1);
  return sprite;
}

function createTrail(color) {
  const positions = new Float32Array(MAX_TRAIL_POINTS * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setDrawRange(0, 0);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  return { line, positions, geo, index: 0, count: 0 };
}

function pushTrailPoint(trail, x, y, z) {
  const i = trail.index;
  trail.positions[i * 3] = x;
  trail.positions[i * 3 + 1] = y;
  trail.positions[i * 3 + 2] = z;
  trail.index = (i + 1) % MAX_TRAIL_POINTS;
  if (trail.count < MAX_TRAIL_POINTS) trail.count++;
  trail.geo.attributes.position.needsUpdate = true;
  trail.geo.setDrawRange(0, trail.count);
}

export function initScene() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000005);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.set(0, 180, 180);
  camera.lookAt(0, 0, 0);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 10;
  controls.maxDistance = 2000;

  scene.add(new THREE.AmbientLight(0x333344, 0.4));
  const sl = new THREE.PointLight(0xfff5dd, 2.0, 0, 0.1);
  sl.position.set(0, 0, 0);
  scene.add(sl);

  createStarfield();

  sunMesh = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffdd44 }));
  scene.add(sunMesh);
  sunMesh.add(createSunGlow());

  earthMesh = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), new THREE.MeshPhongMaterial({ color: 0x4488ff, shininess: 30 }));
  scene.add(earthMesh);

  moonMesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 24), new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 10 }));
  scene.add(moonMesh);

  earthTrailData = createTrail(0x6688aa);
  moonTrailData = createTrail(0xff88aa);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export function updateVisuals() {
  cachedRenderPositions[0] = toRenderPos(0);
  cachedRenderPositions[1] = toRenderPos(1);
  cachedRenderPositions[2] = toRenderPos(2);

  sunMesh.position.copy(cachedRenderPositions[0]);
  earthMesh.position.copy(cachedRenderPositions[1]);
  moonMesh.position.copy(cachedRenderPositions[2]);

  pushTrailPoint(earthTrailData, cachedRenderPositions[1].x, cachedRenderPositions[1].y, cachedRenderPositions[1].z);
  pushTrailPoint(moonTrailData, cachedRenderPositions[2].x, cachedRenderPositions[2].y, cachedRenderPositions[2].z);
}

export function clearTrails() {
  for (const t of [earthTrailData, moonTrailData]) {
    t.index = 0; t.count = 0;
    t.geo.setDrawRange(0, 0);
  }
}

export function render() {
  controls.update();
  renderer.render(scene, camera);
}
