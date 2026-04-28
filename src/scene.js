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

/**
 * Convierte la posición en metros (SI) a coordenadas de Three.js.
 * Para la Luna, exagera el desplazamiento respecto a la Tierra.
 */
function toRenderPos(bodyIndex) {
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

/** Crea el campo de estrellas de fondo */
function createStarfield() {
  const count = 3000;
  const verts = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 800 + Math.random() * 400;
    verts[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    verts[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    verts[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true });
  scene.add(new THREE.Points(geo, mat));
}

/** Crea el sprite de resplandor para el Sol */
function createSunGlow() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,220,80,0.5)");
  g.addColorStop(0.25, "rgba(255,180,40,0.25)");
  g.addColorStop(1, "rgba(255,150,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(25, 25, 1);
  return sprite;
}

/** Crea una línea de trayectoria */
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

/** Añade un punto a una trayectoria */
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

// ── API Pública ──

export function initScene() {
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  // Escena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000005);

  // Cámara
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.set(0, 180, 180);
  camera.lookAt(0, 0, 0);

  // Controles de órbita
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 10;
  controls.maxDistance = 2000;

  // Iluminación
  scene.add(new THREE.AmbientLight(0x333344, 0.4));
  const sunLight = new THREE.PointLight(0xfff5dd, 2.0, 0, 0.1);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // Estrellas
  createStarfield();

  // Sol
  const sunGeo = new THREE.SphereGeometry(5, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
  sunMesh = new THREE.Mesh(sunGeo, sunMat);
  scene.add(sunMesh);
  sunMesh.add(createSunGlow());

  // Tierra
  const earthGeo = new THREE.SphereGeometry(2, 32, 32);
  const earthMat = new THREE.MeshPhongMaterial({ color: 0x4488ff, shininess: 30 });
  earthMesh = new THREE.Mesh(earthGeo, earthMat);
  scene.add(earthMesh);

  // Luna
  const moonGeo = new THREE.SphereGeometry(0.8, 24, 24);
  const moonMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 10 });
  moonMesh = new THREE.Mesh(moonGeo, moonMat);
  scene.add(moonMesh);

  // Trayectorias
  earthTrailData = createTrail(0x6688aa); // gris-azulado
  moonTrailData = createTrail(0xff88aa);  // rosado

  // Resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/** Actualiza las posiciones visuales y añade puntos a las trayectorias */
export function updateVisuals() {
  const sunPos = toRenderPos(0);
  const earthPos = toRenderPos(1);
  const moonPos = toRenderPos(2);

  sunMesh.position.copy(sunPos);
  earthMesh.position.copy(earthPos);
  moonMesh.position.copy(moonPos);

  // Agregar puntos a las trayectorias
  pushTrailPoint(earthTrailData, earthPos.x, earthPos.y, earthPos.z);
  pushTrailPoint(moonTrailData, moonPos.x, moonPos.y, moonPos.z);
}

/** Limpia las trayectorias (al reiniciar) */
export function clearTrails() {
  earthTrailData.index = 0;
  earthTrailData.count = 0;
  earthTrailData.geo.setDrawRange(0, 0);
  moonTrailData.index = 0;
  moonTrailData.count = 0;
  moonTrailData.geo.setDrawRange(0, 0);
}

/** Renderiza la escena */
export function render() {
  controls.update();
  renderer.render(scene, camera);
}
