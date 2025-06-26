import * as THREE from "three";

// Simple seeded random number generator
class MathRandom {
  constructor(seed) {
    this.seed = seed;
  }
  
  random() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}

/* @tweakable The size of a single zone. The current play area is one zone. */
export const ZONE_SIZE = 150;
/* @tweakable The number of zones along one side of a chunk. A value of 5 means a 5x5 grid of zones per chunk. */
export const ZONES_PER_CHUNK_SIDE = 5;
/* @tweakable The number of chunks along one side of a cluster. A value of 5 means a 5x5 grid of chunks per cluster. */
export const CHUNKS_PER_CLUSTER_SIDE = 5;

const CHUNK_SIZE = ZONE_SIZE * ZONES_PER_CHUNK_SIDE;
const CLUSTER_SIZE = CHUNK_SIZE * CHUNKS_PER_CLUSTER_SIDE;
/* @tweakable Radius around the origin kept clear of objects for safe spawning */
export const SPAWN_SAFE_RADIUS = 10;

/* @tweakable The maximum height of the terrain. */
const TERRAIN_AMPLITUDE = 10;
/* @tweakable The scale of the terrain features. Larger values mean more spread out hills. */
const TERRAIN_SCALE = 80;
/* @tweakable How many times the ground texture should repeat across a single zone. */
const TERRAIN_TEXTURE_REPEAT_PER_ZONE = 50;
/* @tweakable The number of segments for the terrain geometry. Higher values are more detailed but less performant. */
const TERRAIN_SEGMENTS = 500;
/* @tweakable The number of barriers to generate per zone. */
const BARRIERS_PER_ZONE = 1;
/* @tweakable The number of pillars to generate per zone. */
const PILLARS_PER_ZONE = 0.6;
/* @tweakable The number of trees to generate per zone. */
const TREES_PER_ZONE = 1.2;
/* @tweakable The number of clouds to generate for the entire cluster. */
const CLOUD_COUNT = 200;

function simpleNoise(x, z) {
  // A simple noise function using sine waves for a rolling hills effect.
  let a = TERRAIN_AMPLITUDE;
  let f = 1 / TERRAIN_SCALE;
  let y = 0;
  for (let i = 0; i < 4; i++) {
      y += a * (Math.sin(f * x) * Math.cos(f * z));
      a *= 0.5;
      f *= 2.0;
  }
  return y;
}

export function createTerrain(scene) {
  const terrainSize = CLUSTER_SIZE;
  const segments = TERRAIN_SEGMENTS;

  const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const vertices = geometry.attributes.position.array;
  for (let i = 0, j = 0; i < vertices.length; i++, j += 3) {
      const x = vertices[j];
      const z = vertices[j + 2];
      vertices[j + 1] = simpleNoise(x, z);
  }
  geometry.computeVertexNormals();

  const textureLoader = new THREE.TextureLoader();
  const groundTexture = textureLoader.load('ground_texture.png');
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  const totalZonesSide = ZONES_PER_CHUNK_SIDE * CHUNKS_PER_CLUSTER_SIDE;
  groundTexture.repeat.set(TERRAIN_TEXTURE_REPEAT_PER_ZONE * totalZonesSide, TERRAIN_TEXTURE_REPEAT_PER_ZONE * totalZonesSide);

  const material = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.8,
      metalness: 0.2
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  terrain.userData.isTerrain = true;
  scene.add(terrain);

  const getHeight = (x, z) => {
      // Clamp x and z to be within terrain bounds
      const clampedX = Math.max(-terrainSize / 2, Math.min(terrainSize / 2, x));
      const clampedZ = Math.max(-terrainSize / 2, Math.min(terrainSize / 2, z));
      return simpleNoise(clampedX, clampedZ);
  };

  terrain.userData.getHeight = getHeight;
  return terrain;
}

export function createBarriers(scene, getHeight) {
  // Use a deterministic random number generator based on a fixed seed
  const barrierSeed = 12345; // Fixed seed for deterministic generation
  let rng = new MathRandom(barrierSeed);
  const totalZones = ZONES_PER_CHUNK_SIDE * CHUNKS_PER_CLUSTER_SIDE * ZONES_PER_CHUNK_SIDE * CHUNKS_PER_CLUSTER_SIDE;
  const worldRadius = CLUSTER_SIZE / 2;
  
  // Wall material
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x888888,
    roughness: 0.7,
    metalness: 0.2
  });
  
  // Create some random barriers
  for (let i = 0; i < totalZones * BARRIERS_PER_ZONE; i++) {  
    const width = 1 + rng.random() * 3;
    const height = 1 + rng.random() * 3;
    const depth = 1 + rng.random() * 3;
    
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    
    // Random position outside the spawn safe area
    const angle = rng.random() * Math.PI * 2;
    const distance = SPAWN_SAFE_RADIUS + rng.random() * (worldRadius - SPAWN_SAFE_RADIUS);
    wall.position.x = Math.cos(angle) * distance;
    wall.position.z = Math.sin(angle) * distance;
    const terrainHeight = getHeight ? getHeight(wall.position.x, wall.position.z) : 0;
    wall.position.y = terrainHeight + height / 2;
    
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.userData.isBarrier = true;
    
    scene.add(wall);
  }
  
  // Add decorative pillars throughout the scene
  const pillarCount = totalZones * PILLARS_PER_ZONE;
  for (let i = 0; i < pillarCount; i++) {
    const angle = rng.random() * Math.PI * 2;
    const distance = SPAWN_SAFE_RADIUS + rng.random() * (worldRadius - SPAWN_SAFE_RADIUS);
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    // Create a tall, thin pillar with much more height variation
    const pillarHeight = 2 + rng.random() * 15; 
    const pillarWidth = 0.8 + rng.random() * 0.6;
    const pillarGeo = new THREE.BoxGeometry(pillarWidth, pillarHeight, pillarWidth);
    
    // Use a slightly different material for pillars
    const pillarMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xaaaaaa,
      roughness: 0.6,
      metalness: 0.3
    });
    
    const pillar = new THREE.Mesh(pillarGeo, pillarMaterial);
    const terrainPillarHeight = getHeight ? getHeight(x, z) : 0;
    pillar.position.set(x, terrainPillarHeight + pillarHeight/2, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    pillar.userData.isBarrier = true;
    
    // Add a decorative cap to the pillar
    const capSize = pillarWidth * 1.5;
    const capHeight = 0.5;
    const capGeo = new THREE.BoxGeometry(capSize, capHeight, capSize);
    const cap = new THREE.Mesh(capGeo, wallMaterial);
    cap.position.y = pillarHeight/2 + capHeight/2;
    pillar.add(cap);
    
    // 25% chance to spawn a remote on tall pillars
    if (rng.random() < 0.25) {
      // Create a remote object
      const remoteGeo = new THREE.BoxGeometry(0.3, 0.1, 0.15);
      const remoteMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0xff0000,
        emissiveIntensity: 0.3
      });
      
      const remote = new THREE.Mesh(remoteGeo, remoteMaterial);
      remote.position.y = pillarHeight/2 + capHeight + 0.1;
      remote.rotation.y = Math.PI * rng.random();
      remote.castShadow = true;
      remote.userData.isRemote = true;
      remote.userData.remoteId = `remote_${i}`;
      pillar.add(remote);
      
      // Add a button to the remote
      const buttonGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8);
      const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const button = new THREE.Mesh(buttonGeo, buttonMaterial);
      button.position.set(0, 0.06, 0);
      button.rotation.x = Math.PI / 2;
      remote.add(button);
    }
    
    scene.add(pillar);
  }
}

export function createTrees(scene, getHeight) {
  // Use a deterministic random number generator for consistent tree placement
  const treeSeed = 54321; // Different seed than barriers
  let rng = new MathRandom(treeSeed);
  const totalZones = ZONES_PER_CHUNK_SIDE * CHUNKS_PER_CLUSTER_SIDE * ZONES_PER_CHUNK_SIDE * CHUNKS_PER_CLUSTER_SIDE;
  const worldRadius = CLUSTER_SIZE / 2;
  
  // Tree trunk materials (varying browns)
  const trunkMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: 0x6B4423, roughness: 0.9, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.8, metalness: 0.1 })
  ];
  
  // Tree leaves materials (varying greens)
  const leavesMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.8, metalness: 0.0 }),
    new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8, metalness: 0.0 }),
    new THREE.MeshStandardMaterial({ color: 0x006400, roughness: 0.7, metalness: 0.0 })
  ];
  
  // Create different types of trees
  for (let i = 0; i < totalZones * TREES_PER_ZONE; i++) {  
    // Select random materials
    const trunkMaterial = trunkMaterials[Math.floor(rng.random() * trunkMaterials.length)];
    const leavesMaterial = leavesMaterials[Math.floor(rng.random() * leavesMaterials.length)];
    
    // Create tree group
    const tree = new THREE.Group();
    
    // Create tree trunk
    const trunkHeight = 5 + rng.random() * 7;
    const trunkRadius = 0.3 + rng.random() * 0.3;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius * 1.2, trunkHeight, 8);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    
    // Determine tree type (pine or broad-leaf)
    const isPine = rng.random() > 0.5;
    
    if (isPine) {
      // Pine tree (multiple cones stacked)
      const layers = 2 + Math.floor(rng.random() * 3);
      const baseRadius = trunkRadius * 6;
      const layerHeight = trunkHeight * 0.4;
      
      for (let j = 0; j < layers; j++) {
        const layerRadius = baseRadius * (1 - j * 0.2);
        const coneGeometry = new THREE.ConeGeometry(layerRadius, layerHeight, 8);
        const cone = new THREE.Mesh(coneGeometry, leavesMaterial);
        cone.position.y = trunkHeight * 0.5 + j * (layerHeight * 0.6);
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);
      }
    } else {
      // Broad-leaf tree (ellipsoidQuestion of and also a sphere
      const leafShape = rng.random() > 0.5 ? 'ellipsoid' : 'sphere';
      const leavesRadius = trunkRadius * (4 + rng.random() * 2);
      
      if (leafShape === 'ellipsoid') {
        // Create ellipsoid using scaled sphere
        const leavesGeometry = new THREE.SphereGeometry(leavesRadius, 8, 8);
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = trunkHeight * 0.7;
        leaves.scale.set(1, 1.2 + rng.random() * 0.5, 1);
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        tree.add(leaves);
      } else {
        // Create multiple spheres for a more natural canopy
        const sphereCount = 2 + Math.floor(rng.random() * 3);
        for (let j = 0; j < sphereCount; j++) {
          const sphereSize = leavesRadius * (0.7 + rng.random() * 0.5);
          const leavesGeometry = new THREE.SphereGeometry(sphereSize, 8, 8);
          const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
          leaves.position.y = trunkHeight * 0.7;
          leaves.position.x = (rng.random() - 0.5) * trunkRadius * 2;
          leaves.position.z = (rng.random() - 0.5) * trunkRadius * 2;
          leaves.castShadow = true;
          leaves.receiveShadow = true;
          tree.add(leaves);
        }
      }
    }
    
    // Random position outside the spawn safe area and existing barriers
    const angle = rng.random() * Math.PI * 2;
    const distance = SPAWN_SAFE_RADIUS + rng.random() * (worldRadius - SPAWN_SAFE_RADIUS);
    tree.position.x = Math.cos(angle) * distance;
    tree.position.z = Math.sin(angle) * distance;
    tree.position.y = getHeight ? getHeight(tree.position.x, tree.position.z) : 0;
    
    // Add some random rotation and scale variation
    tree.rotation.y = rng.random() * Math.PI * 2;
    const treeScale = 0.8 + rng.random() * 0.5;
    tree.scale.set(treeScale, treeScale, treeScale);
    
    // Add custom property for collision detection - move barrier detection to the whole tree instead
    tree.userData.isTree = true;
    tree.userData.isBarrier = true;
    
    scene.add(tree);
  }
}

export function createClouds(scene) {
  const cloudSeed = 67890; // Different seed for clouds
  let rng = new MathRandom(cloudSeed);
  const worldRadius = CLUSTER_SIZE / 2;
  
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Pure white
    opacity: 0.95, // Slightly increased opacity
    transparent: true,
    roughness: 0.9, // Increased roughness to make it less shiny
    metalness: 0.0,
    emissive: 0xcccccc, // Add slight emissive color to make it brighter
    emissiveIntensity: 0.2 // Subtle emission to enhance whiteness
  });
  
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const cloudGroup = new THREE.Group();
    
    // Create cloud with multiple spheres
    const puffCount = 3 + Math.floor(rng.random() * 5);
    for (let j = 0; j < puffCount; j++) {
      const puffSize = 2 + rng.random() * 3;
      const puffGeometry = new THREE.SphereGeometry(puffSize, 7, 7);
      const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
      
      puff.position.x = (rng.random() - 0.5) * 5;
      puff.position.y = (rng.random() - 0.5) * 2;
      puff.position.z = (rng.random() - 0.5) * 5;
      
      cloudGroup.add(puff);
    }
    
    // Position the cloud
    const angle = rng.random() * Math.PI * 2;
    const distance = rng.random() * worldRadius * 1.5; // Allow clouds to go beyond terrain edge
    cloudGroup.position.x = Math.cos(angle) * distance;
    cloudGroup.position.z = Math.sin(angle) * distance;
    cloudGroup.position.y = 20 + rng.random() * 15;
    
    // Random rotation
    cloudGroup.rotation.y = rng.random() * Math.PI * 2;
    
    // Add to scene
    scene.add(cloudGroup);
  }
}