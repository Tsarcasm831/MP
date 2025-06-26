import * as THREE from "three";
import { PlayerControls } from "./controls.js";
import { createPlayerModel } from "./player.js";
import { createBarriers, createTrees, createClouds, createTerrain, ZONE_SIZE } from "./worldGeneration.js";
import { BuildTool } from "./buildTool.js";
import { AdvancedBuildTool } from "./advancedBuildTool.js";
import { UIManager } from './uiManager.js';
import { CharacterCreator } from './characterCreator.js';
import { MultiplayerManager } from './multiplayerManager.js';
import { ObjectCreator } from './objectCreator.js';
import { InventoryManager } from './inventoryManager.js';
import './previewManager.js'; // Ensure it's part of the context

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

let collectedRemotes = {};

async function main() {
  // Initialize WebsimSocket for multiplayer functionality
  const room = new WebsimSocket();
  await room.initialize();
  
  // Generate a player name if not available
  const playerInfo = room.peers[room.clientId] || {};
  const playerName = playerInfo.username || `Player${Math.floor(Math.random() * 1000)}`;
  
  // Safe initial position values
  const playerX = (Math.random() * 10) - 5;
  const playerZ = (Math.random() * 10) - 5;

  // Setup Three.js scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Light sky blue background
  
  // Create terrain from heightmap
  const terrain = createTerrain(scene);

  // Create barriers, trees, clouds and platforms
  createBarriers(scene, terrain.userData.getHeight);
  createTrees(scene, terrain.userData.getHeight);
  createClouds(scene);
  
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('game-container').appendChild(renderer.domElement);
  
  // Create player model with default appearance
  let playerModel = createPlayerModel(THREE, playerName);
  scene.add(playerModel);
  
  // Initialize player controls
  const playerControls = new PlayerControls(scene, room, {
    renderer: renderer,
    initialPosition: {
      x: playerX,
      y: 0.70,
      z: playerZ
    },
    playerModel: playerModel,
    terrain: terrain,
  });
  const camera = playerControls.getCamera();
  
  // Initialize build tool
  const buildTool = new BuildTool(scene, camera, playerControls, terrain);
  buildTool.setRoom(room); // Pass room to buildTool for multiplayer sync
  
  // Initialize advanced build tool
  const objectCreator = new ObjectCreator(scene, camera, room, buildTool);
  const advancedBuildTool = new AdvancedBuildTool(scene, camera, renderer, buildTool, objectCreator);
  advancedBuildTool.setRoom(room);
  advancedBuildTool.setOrbitControls(playerControls.controls);
  
  // Load existing build objects from room state
  if (room.roomState && room.roomState.buildObjects) {
    Object.values(room.roomState.buildObjects || {}).forEach(buildData => {
      if (buildData.isAdvanced) {
        advancedBuildTool.receiveBuildObject(buildData);
      } else {
        buildTool.receiveBuildObject(buildData);
      }
    });
  }

  const multiplayerManager = new MultiplayerManager({
    room,
    scene,
    camera,
    renderer,
    buildTool,
    advancedBuildTool,
    createPlayerModel: (three, username, spec) => createPlayerModel(three, username, spec),
    playerControls
  });
  multiplayerManager.init();

  const characterCreator = new CharacterCreator(
    THREE,
    room,
    playerControls,
    (newSpec) => {
      // Remove old player model
      scene.remove(playerModel);
      
      // Create new player model with the character spec
      playerModel = createPlayerModel(THREE, playerName, newSpec);
      scene.add(playerModel);
      
      // Update player controls with new model
      playerControls.playerModel = playerModel;

      return playerModel;
    }
  );

  const inventoryManager = new InventoryManager({
      playerControls,
  });

  const uiManager = new UIManager({
      playerControls,
      buildTool,
      advancedBuildTool,
      characterCreator,
      objectCreator,
      inventoryManager,
      multiplayerManager,
      room,
      renderer,
      playerModel
  });
  const { inventoryUI, mapUI } = uiManager.init();
  
  inventoryManager.inventoryUI = inventoryUI;
  inventoryManager.init();
  
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Directional light (sun)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -25;
  dirLight.shadow.camera.right = 25;
  dirLight.shadow.camera.top = 25;
  dirLight.shadow.camera.bottom = -25;
  scene.add(dirLight);
  
  // Grid helper for better spatial awareness
  const gridHelper = new THREE.GridHelper(ZONE_SIZE, ZONE_SIZE);
  gridHelper.visible = false; // Hidden by default
  scene.add(gridHelper);
  
  // Add a global keydown listener for toggling the grid
  window.addEventListener('keydown', (event) => {
    // Prevent toggling if an input is focused
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    // Toggle grid visibility with 'G' key
    if (event.key.toLowerCase() === 'g' && !advancedBuildTool.enabled) {
      gridHelper.visible = !gridHelper.visible;
    }
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001; // Current time in seconds
    const currentTime = Date.now(); // Current time in milliseconds
    
    playerControls.update();
    
    if(mapUI) mapUI.update();

    // Update custom animations for player model
    if (playerModel && playerModel.userData.updateAnimations) {
        playerModel.userData.updateAnimations(time);
    }

    multiplayerManager.updatePlayerLabels();
    
    // Check for remote collisions
    const playerPosition = playerModel.position.clone();
    scene.traverse((object) => {
      if (object.userData && object.userData.isRemote) {
        const worldPosition = new THREE.Vector3();
        object.getWorldPosition(worldPosition);
        
        const distance = playerPosition.distanceTo(worldPosition);
        if (distance < 1 && !multiplayerManager.collectedRemotes[object.userData.remoteId]) {
          multiplayerManager.collectRemote(object.userData.remoteId, object);
        }
      }
    });
    
    // Check for expired build objects (older than 50 minutes)
    const expirationTime = 50 * 60 * 1000; // 50 minutes in milliseconds
    buildTool.checkExpiredObjects(currentTime, expirationTime);
    advancedBuildTool.checkExpiredObjects(currentTime, expirationTime);
    
    renderer.render(scene, camera);
  }
  
  animate();
}

main();