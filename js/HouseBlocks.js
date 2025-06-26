/* =========================================================================
 *  HouseBlocks.js ― a building-blocks kit for houses
 *  (c) 2025 LordTsarcasm- MIT
 * -------------------------------------------------------------------------
 *  ➤ Drop this file anywhere after THREE is loaded (module or script tag).
 *  ➤ Every factory function returns a ready-to-use THREE.Mesh / THREE.Group.
 *  ➤ ALL functions are exposed globally via `HouseBlocks` ⚙ and directly on
 *    `globalThis`, so you can call `createWall()` or `HouseBlocks.createWall`
 *    interchangeably without imports.
 * ========================================================================= */

import * as THREE from 'three';

/* === 1.  Low-level geometry helpers ==================================== */

function createBox(
  w = 1, h = 1, d = 1,
  color = 0xffffff,
  matOpts = {},
) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, ...matOpts });
  return new THREE.Mesh(geo, mat);
}

function createCylinder(
  rTop = 0.5, rBot = 0.5, height = 1,
  radialSeg = 12,
  color = 0xffffff,
  matOpts = {},
) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, height, radialSeg);
  const mat = new THREE.MeshStandardMaterial({ color, ...matOpts });
  return new THREE.Mesh(geo, mat);
}

/* === 2.  Structural - foundation & frame =============================== */

function createFoundationSlab(w = 4, d = 4, t = 0.2) {
  return createBox(w, t, d, 0x7a7a7a);
}

function createFooting(w = 0.6, h = 0.3, d = 0.6) {
  return createBox(w, h, d, 0x666666);
}

function createPillar(h = 3, r = 0.15) {
  return createCylinder(r, r, h, 18, 0x8d8d8d);
}

function createBeam(len = 3, thick = 0.15) {
  return createBox(len, thick, thick, 0x4d3722);
}

function createJoist(len = 3, thick = 0.1) {
  return createBox(len, thick, thick, 0x5a4027);
}

function createStud(h = 2.6, thick = 0.09) {
  return createBox(thick, h, thick, 0x5c442b);
}

function createRafter(len = 3, thick = 0.12) {
  const rafter = createBox(len, thick, thick, 0x553b1a);
  rafter.rotation.z = -Math.PI / 6; // 30° pitch
  return rafter;
}

function createTruss(span = 4, height = 1) {
  const group = new THREE.Group();
  const chordTop = createBeam(span, 0.12);
  chordTop.rotation.z = -Math.atan(height / (span / 2));
  chordTop.position.set(0, height, 0);

  const chordBot = createBeam(span, 0.12);
  chordBot.position.set(0, 0, 0);

  const strutL = createBeam(height, 0.1);
  strutL.rotation.z = Math.PI / 2;
  strutL.position.set(-span / 4, height / 2, 0);

  const strutR = strutL.clone();
  strutR.position.x = span / 4;

  group.add(chordTop, chordBot, strutL, strutR);
  return group;
}

/* === 3.  Walls & Openings ============================================= */

function createWall(width = 1, height = 2.5, thickness = 0.1, color = 0xc2a86b) {
  return createBox(width, height, thickness, color);
}

function createExteriorWall(width, height, thickness = 0.12) {
  return createWall(width, height, thickness, 0xbfa27b);
}

function createInteriorWall(width, height, thickness = 0.08) {
  return createWall(width, height, thickness, 0xd9c8a8);
}

function createCornerWall(height = 2.5, thickness = 0.12) {
  const group = new THREE.Group();
  const wall1 = createWall(thickness, height, thickness);
  const wall2 = wall1.clone();
  wall2.rotation.y = Math.PI / 2;
  group.add(wall1, wall2);
  return group;
}

function createWindow(
  w = 0.8, h = 1, d = 0.05,
  frameColor = 0x222222,
  glassColor = 0x99ccee,
) {
  const frame = createBox(w, h, d, frameColor);
  const glass = createBox(w * 0.85, h * 0.85, d * 0.4, glassColor, { transparent: true, opacity: 0.6 });
  glass.position.z += d * 0.1;
  frame.add(glass);
  return frame;
}

function createWindowFrame(w = 1, h = 1.2, depth = 0.075) {
  const frame = createBox(w, h, depth, 0x2b2b2b);
  frame.material.metalness = 0.5;
  return frame;
}

function createWindowShutter(w = 0.4, h = 1, d = 0.05) {
  const shutter = createBox(w, h, d, 0x403020);
  shutter.geometry.translate(0, 0, -d / 2);
  return shutter;
}

function createDoor(
  w = 0.9, h = 2, d = 0.08,
  color = 0x633220,
) {
  return createBox(w, h, d, color);
}

function createDoorFrame(w = 1, h = 2.1, d = 0.1) {
  const frame = createBox(w, h, d, 0x2b2b2b);
  frame.material.metalness = 0.5;
  return frame;
}

function createArchway(w = 1.2, h = 2.2, d = 0.15) {
  const arch = createBox(w, h, d, 0xa88a6d);
  const cut = createBox(w * 0.9, h * 0.9, d * 1.1, 0x000000);
  cut.position.y = h * 0.05;
  arch.updateMatrix();
  cut.updateMatrix();
  arch.geometry = THREE.CSG.subtract(arch.geometry, cut.geometry); // assumes CSG lib
  return arch;
}

/* === 4.  Floors & Ceilings ============================================ */

function createFloor(width = 4, depth = 4, thickness = 0.12, color = 0x8b6d52) {
  return createBox(width, thickness, depth, color);
}

function createCeilingPanel(width = 4, depth = 4, thickness = 0.08) {
  return createBox(width, thickness, depth, 0xdedede);
}

function createSubfloor(width = 4, depth = 4, thickness = 0.1) {
  return createBox(width, thickness, depth, 0x76604b);
}

function createFloorBoard(length = 1, width = 0.2, thickness = 0.02) {
  return createBox(length, thickness, width, 0x815e3c);
}

function createLoftFloor(width = 3, depth = 3) {
  return createFloor(width, depth, 0.1, 0x7d5f45);
}

/* === 5.  Roof systems ================================================== */

function createRoof(width = 4.2, height = 1.2, depth = 4.2, color = 0x992222) {
  const roof = createBox(width, height, depth, color);
  roof.rotation.x = Math.PI / 4;
  return roof;
}

function createRoofFlat(width = 4, depth = 4, thickness = 0.15) {
  return createBox(width, thickness, depth, 0x5c5c5c);
}

function createRoofGable(span = 4, pitch = 0.4, depth = 4, color = 0x883333) {
  const group = new THREE.Group();
  const half = createRoof(span, pitch, depth, color);
  half.rotation.z = Math.PI / 4;
  half.position.x = -span / 4;
  const half2 = half.clone();
  half2.rotation.z = -Math.PI / 4;
  half2.position.x = span / 4;
  group.add(half, half2);
  return group;
}

function createRoofHip(span = 4, pitch = 0.4, depth = 4) {
  const group = new THREE.Group();
  const roof = createRoof(span + 0.2, pitch, depth + 0.2, 0x774141);
  group.add(roof);
  return group;
}

function createDormer(w = 1.2, h = 0.8, d = 1.5) {
  const dormer = createRoof(w, h, d, 0x7a3a3a);
  dormer.position.y = h / 2;
  return dormer;
}

function createSkylight(w = 1, h = 0.1, d = 1) {
  return createBox(w, h, d, 0x99ccee, { transparent: true, opacity: 0.5 });
}

function createChimney(w = 0.4, h = 1, d = 0.4) {
  return createBox(w, h, d, 0x6b4e3a);
}

function createGutter(len = 4, radius = 0.05) {
  const gutter = createCylinder(radius, radius, len, 12, 0x444444);
  gutter.rotation.z = Math.PI / 2;
  return gutter;
}

function createDownspout(h = 3, radius = 0.04) {
  return createCylinder(radius, radius, h, 10, 0x444444);
}

function createFascia(len = 4, height = 0.15, thickness = 0.025) {
  return createBox(len, height, thickness, 0x4d4d4d);
}

function createSoffit(len = 4, depth = 0.5, thickness = 0.025) {
  return createBox(len, thickness, depth, 0xd8d8d8);
}

function createEave(len = 4, width = 0.3, thickness = 0.06) {
  return createBox(len, thickness, width, 0x5c5c5c);
}

/* === 6.  Stair systems ================================================= */

function createStairs(stepCount = 10, w = 1, h = 0.18, d = 0.3) {
  const group = new THREE.Group();
  for (let i = 0; i < stepCount; i++) {
    const step = createBox(w, h, d, 0x444444);
    step.position.set(0, i * h, i * d);
    group.add(step);
  }
  return group;
}

function createStairStringer(len = 3, thick = 0.12, color = 0x554433) {
  return createBox(len, thick, thick, color);
}

function createStairRiser(w = 1, h = 0.18, t = 0.02) {
  return createBox(w, h, t, 0x5b5b5b);
}

function createStairTread(w = 1, d = 0.3, t = 0.04) {
  return createBox(w, t, d, 0x675c4d);
}

function createBaluster(h = 0.9, r = 0.03) {
  return createCylinder(r, r, h, 12, 0x3a2518);
}

function createHandrail(len = 1, r = 0.05) {
  const rail = createCylinder(r, r, len, 14, 0x3a2518);
  rail.rotation.z = Math.PI / 2;
  return rail;
}

function createNewelPost(h = 1, r = 0.08) {
  return createCylinder(r, r, h, 16, 0x3a2518);
}

function createLanding(w = 1, d = 1, t = 0.1) {
  return createBox(w, t, d, 0x5a5a5a);
}

/* === 7.  Exterior decks & fences ====================================== */

function createPorchFloor(w = 3, d = 2, t = 0.12) {
  return createBox(w, t, d, 0x705a3a);
}

function createPorchRoof(w = 3.2, h = 0.6, d = 2.2) {
  return createRoof(w, h, d, 0x884433);
}

function createDeckPlank(len = 1, w = 0.25, t = 0.05) {
  return createBox(len, t, w, 0x7d6040);
}

function createBalconyFloor(w = 2, d = 1, t = 0.12) {
  return createBox(w, t, d, 0x705a3a);
}

function createFencePanel(w = 2, h = 1, t = 0.08) {
  return createBox(w, h, t, 0x53412c);
}

function createGate(w = 1, h = 1.2, t = 0.08) {
  return createBox(w, h, t, 0x53412c);
}

/* === 8.  Decorative/finish panels ===================================== */

function createSidingPanel(w = 1, h = 0.3, t = 0.015) {
  return createBox(w, h, t, 0xcfbba8);
}

function createBrick(w = 0.2, h = 0.06, d = 0.09) {
  return createBox(w, h, d, 0x9c4a31);
}

function createStoneBlock(w = 0.4, h = 0.2, d = 0.25) {
  return createBox(w, h, d, 0x6f6f6f);
}

function createTile(w = 0.3, h = 0.02, d = 0.3) {
  return createBox(w, h, d, 0xd3d3d3);
}

function createGableVent(w = 0.6, h = 0.4, d = 0.05) {
  return createBox(w, h, d, 0x4b4b4b);
}

/* === 9.  Railings & balcony kit (simple) =============================== */

function createRail(length = 1, height = 1, thickness = 0.05) {
  const post1 = createBox(thickness, height, thickness, 0x3a2518);
  const post2 = post1.clone();
  const bar = createBox(length, thickness, thickness, 0x3a2518);

  post1.position.x = -length / 2;
  post2.position.x = length / 2;
  bar.position.y = height / 2;

  const group = new THREE.Group();
  group.add(post1, post2, bar);
  return group;
}

/* =========================================================================
 * 10.  Global exposure
 * ------------------------------------------------------------------------- */

const HouseBlocks = {
  /* helpers */
  createBox,
  createCylinder,
  /* foundation */
  createFoundationSlab,
  createFooting,
  createPillar,
  createBeam,
  createJoist,
  createStud,
  createRafter,
  createTruss,
  /* walls & openings */
  createWall,
  createExteriorWall,
  createInteriorWall,
  createCornerWall,
  createWindow,
  createWindowFrame,
  createWindowShutter,
  createDoor,
  createDoorFrame,
  createArchway,
  /* floors & ceilings */
  createFloor,
  createCeilingPanel,
  createSubfloor,
  createFloorBoard,
  createLoftFloor,
  /* roofs */
  createRoof,
  createRoofFlat,
  createRoofGable,
  createRoofHip,
  createDormer,
  createSkylight,
  createChimney,
  createGutter,
  createDownspout,
  createFascia,
  createSoffit,
  createEave,
  /* stairs */
  createStairs,
  createStairStringer,
  createStairRiser,
  createStairTread,
  createBaluster,
  createHandrail,
  createNewelPost,
  createLanding,
  /* decks & fences */
  createPorchFloor,
  createPorchRoof,
  createDeckPlank,
  createBalconyFloor,
  createFencePanel,
  createGate,
  /* finish panels */
  createSidingPanel,
  createBrick,
  createStoneBlock,
  createTile,
  createGableVent,
  /* rail */
  createRail,
};

/* Attach everything to the global scope for easy access */
globalThis.HouseBlocks = HouseBlocks;
Object.assign(globalThis, HouseBlocks);   // e.g. createWall(), createRoof(), ...

export default HouseBlocks;
