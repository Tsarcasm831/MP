import * as THREE from 'three';
import { ZONE_SIZE, ZONES_PER_CHUNK_SIDE, CHUNKS_PER_CLUSTER_SIDE } from '../js/worldGeneration.js';

/* @tweakable The base size of the map display in pixels. */
const MAP_SIZE = 400;
/* @tweakable The background color of the map. */
const MAP_BG_COLOR = 'rgba(20, 30, 40, 0.8)';
/* @tweakable The color of the grid lines on the map. */
const GRID_COLOR = 'rgba(255, 255, 255, 0.2)';
/* @tweakable The color of the player's marker on the map. */
const PLAYER_MARKER_COLOR = '#44aaff';
/* @tweakable The size of the player's marker on the map. */
const PLAYER_MARKER_SIZE = 8;
/* @tweakable The color of other players' markers on the map. */
const OTHER_PLAYER_MARKER_COLOR = '#ff4444';
/* @tweakable The size of other players' markers on the map. */
const OTHER_PLAYER_MARKER_SIZE = 5;
/* @tweakable The color of built objects' markers on the map. */
const BUILD_OBJECT_MARKER_COLOR = '#aaffaa';
/* @tweakable The size of built objects' markers on the map. */
const BUILD_OBJECT_MARKER_SIZE = 2;
/* @tweakable The color of the terrain's lowest parts. */
const TERRAIN_LOW_COLOR = '#1a2a40';
/* @tweakable The color of the terrain's highest parts. */
const TERRAIN_HIGH_COLOR = '#99aa88';
/* @tweakable The minimum height considered when coloring the terrain. */
const TERRAIN_MIN_HEIGHT = -10;
/* @tweakable The maximum height considered when coloring the terrain. */
const TERRAIN_MAX_HEIGHT = 10;
/* @tweakable The color of tree markers on the map. */
const TREE_MARKER_COLOR = '#228b22';
/* @tweakable The size of tree markers on the map. */
const TREE_MARKER_SIZE = 2;
/* @tweakable The color of barrier markers on the map. */
const BARRIER_MARKER_COLOR = '#888888';
/* @tweakable The size of barrier markers on the map. */
const BARRIER_MARKER_SIZE = 2;

export class MapUI {
    constructor(dependencies) {
        this.playerControls = dependencies.playerControls;
        this.buildTool = dependencies.buildTool;
        this.advancedBuildTool = dependencies.advancedBuildTool;
        this.multiplayerManager = dependencies.multiplayerManager;

        this.mapContainer = null;
        this.mapCanvas = null;
        this.ctx = null;
        this.isOpen = false;

        this.scene = this.playerControls.scene;
        this.staticObjects = { trees: [], barriers: [] };
        
        this.CHUNK_SIZE = ZONE_SIZE * ZONES_PER_CHUNK_SIDE;
        this.CLUSTER_SIZE = this.CHUNK_SIZE * CHUNKS_PER_CLUSTER_SIDE;

        // Order zoom levels from most zoomed-in to widest view
        this.zoomLevels = [
            { name: 'Zone', scale: ZONE_SIZE },
            { name: 'Chunk', scale: this.CHUNK_SIZE },
            { name: 'Cluster', scale: this.CLUSTER_SIZE }
        ];
        // Start at Chunk view
        this.currentZoomIndex = 1;

        this.terrainCanvas = null; // for pre-rendering terrain
    }

    create() {
        const gameContainer = document.getElementById('game-container');
        this.mapContainer = document.createElement('div');
        this.mapContainer.id = 'map-container';

        this.mapContainer.innerHTML = `
            <div id="map-header">
                <h2>World Map</h2>
                <div id="map-zoom-controls">
                    <button id="zoom-out-btn">-</button>
                    <span id="zoom-level-label"></span>
                    <button id="zoom-in-btn">+</button>
                </div>
            </div>
        `;

        this.mapCanvas = document.createElement('canvas');
        this.mapCanvas.id = 'map-canvas';
        this.mapCanvas.width = MAP_SIZE;
        this.mapCanvas.height = MAP_SIZE;
        this.mapContainer.appendChild(this.mapCanvas);
        
        this.ctx = this.mapCanvas.getContext('2d');

        gameContainer.appendChild(this.mapContainer);

        window.addEventListener('keydown', (e) => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;
            }
            if (e.key.toLowerCase() === 'm') {
                this.toggle();
            }
        });

        document.getElementById('zoom-in-btn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out-btn').addEventListener('click', () => this.zoomOut());

        this.preRenderTerrain();
        this.gatherStaticObjects();
    }

    preRenderTerrain() {
        this.terrainCanvas = document.createElement('canvas');
        this.terrainCanvas.width = MAP_SIZE;
        this.terrainCanvas.height = MAP_SIZE;
        const terrainCtx = this.terrainCanvas.getContext('2d');
        const terrain = this.playerControls.terrain;
        if (!terrain || !terrain.material || !terrain.material.map) return;

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('ground_texture.png', (texture) => {
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = texture.image.width;
            tmpCanvas.height = texture.image.height;
            const tmpCtx = tmpCanvas.getContext('2d');
            tmpCtx.drawImage(texture.image, 0, 0);
            const texData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height).data;

            const imageData = terrainCtx.createImageData(MAP_SIZE, MAP_SIZE);
            const data = imageData.data;

            const repeat = terrain.material.map.repeat;

            const lowRgb = this.hexToRgb(TERRAIN_LOW_COLOR);
            const highRgb = this.hexToRgb(TERRAIN_HIGH_COLOR);

            for (let y = 0; y < MAP_SIZE; y++) {
                for (let x = 0; x < MAP_SIZE; x++) {
                    const worldX = (x / MAP_SIZE - 0.5) * this.CLUSTER_SIZE;
                    const worldZ = (y / MAP_SIZE - 0.5) * this.CLUSTER_SIZE;

                    let u = ((worldX / this.CLUSTER_SIZE) + 0.5) * repeat.x;
                    let v = ((worldZ / this.CLUSTER_SIZE) + 0.5) * repeat.y;
                    u = ((u % 1) + 1) % 1;
                    v = ((v % 1) + 1) % 1;

                    const texX = Math.floor(u * tmpCanvas.width);
                    const texY = Math.floor(v * tmpCanvas.height);
                    const texIndex = (texY * tmpCanvas.width + texX) * 4;
                    const index = (y * MAP_SIZE + x) * 4;

                    const height = terrain.userData.getHeight(worldX, worldZ);
                    let t = (height - TERRAIN_MIN_HEIGHT) / (TERRAIN_MAX_HEIGHT - TERRAIN_MIN_HEIGHT);
                    t = Math.max(0, Math.min(1, t));
                    const shadeR = lowRgb.r + (highRgb.r - lowRgb.r) * t;
                    const shadeG = lowRgb.g + (highRgb.g - lowRgb.g) * t;
                    const shadeB = lowRgb.b + (highRgb.b - lowRgb.b) * t;

                    data[index] = texData[texIndex] * 0.6 + shadeR * 0.4;
                    data[index + 1] = texData[texIndex + 1] * 0.6 + shadeG * 0.4;
                    data[index + 2] = texData[texIndex + 2] * 0.6 + shadeB * 0.4;
                    data[index + 3] = 255;
                }
            }
            terrainCtx.putImageData(imageData, 0, 0);
        });
    }

    gatherStaticObjects() {
        if (!this.scene) return;
        this.staticObjects.trees = [];
        this.staticObjects.barriers = [];
        this.scene.traverse(obj => {
            if (!obj.userData) return;
            if (obj.userData.isTree) {
                this.staticObjects.trees.push(obj);
            } else if (obj.userData.isBarrier) {
                this.staticObjects.barriers.push(obj);
            }
        });
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    zoomIn() {
        this.currentZoomIndex = Math.max(0, this.currentZoomIndex - 1);
        this.update();
    }

    zoomOut() {
        this.currentZoomIndex = Math.min(this.zoomLevels.length - 1, this.currentZoomIndex + 1);
        this.update();
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.mapContainer.style.display = this.isOpen ? 'flex' : 'none';
        this.playerControls.enabled = !this.isOpen;

        if (this.isOpen) {
            this.update();
        }
    }
    
    worldToMap(pos, mapCenter, mapScale) {
        const mapX = (pos.x - mapCenter.x) * mapScale + MAP_SIZE / 2;
        const mapY = (pos.z - mapCenter.z) * mapScale + MAP_SIZE / 2;
        return { x: mapX, y: mapY };
    }

    update() {
        if (!this.isOpen || !this.ctx) {
            return;
        }

        const zoomLevel = this.zoomLevels[this.currentZoomIndex];
        document.getElementById('zoom-level-label').textContent = zoomLevel.name;

        const playerPos = this.playerControls.getPlayerModel().position;
        const mapCenter = playerPos;

        const mapScale = MAP_SIZE / zoomLevel.scale;
        
        // Draw background
        this.ctx.fillStyle = MAP_BG_COLOR;
        this.ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
        
        // Draw pre-rendered terrain
        if (this.terrainCanvas) {
            const terrainScale = zoomLevel.scale / this.CLUSTER_SIZE;
            const srcSize = MAP_SIZE * terrainScale;
            const srcX = MAP_SIZE / 2 + (mapCenter.x / this.CLUSTER_SIZE) * MAP_SIZE - srcSize / 2;
            const srcY = MAP_SIZE / 2 + (mapCenter.z / this.CLUSTER_SIZE) * MAP_SIZE - srcSize / 2;
            
            this.ctx.drawImage(this.terrainCanvas, srcX, srcY, srcSize, srcSize, 0, 0, MAP_SIZE, MAP_SIZE);
        }

        // Draw grid
        this.ctx.strokeStyle = GRID_COLOR;
        this.ctx.lineWidth = 1;
        
        const worldTopLeft = {
            x: mapCenter.x - zoomLevel.scale / 2,
            z: mapCenter.z - zoomLevel.scale / 2
        };

        let gridSize;
        if (zoomLevel.name === 'Cluster') gridSize = this.CHUNK_SIZE;
        else if (zoomLevel.name === 'Chunk') gridSize = ZONE_SIZE;
        else gridSize = ZONE_SIZE / 5; // Finer grid for zone view

        const startX = Math.floor(worldTopLeft.x / gridSize) * gridSize;
        const startZ = Math.floor(worldTopLeft.z / gridSize) * gridSize;

        for(let x = startX; x < worldTopLeft.x + zoomLevel.scale; x += gridSize) {
            const linePos = this.worldToMap({x: x, z: 0}, mapCenter, mapScale);
            this.ctx.beginPath();
            this.ctx.moveTo(linePos.x, 0);
            this.ctx.lineTo(linePos.x, MAP_SIZE);
            this.ctx.stroke();
        }

        for(let z = startZ; z < worldTopLeft.z + zoomLevel.scale; z += gridSize) {
            const linePos = this.worldToMap({x: 0, z: z}, mapCenter, mapScale);
            this.ctx.beginPath();
            this.ctx.moveTo(0, linePos.y);
            this.ctx.lineTo(MAP_SIZE, linePos.y);
            this.ctx.stroke();
        }

        // Draw static objects
        const tempPos = new THREE.Vector3();

        this.ctx.fillStyle = TREE_MARKER_COLOR;
        this.staticObjects.trees.forEach(obj => {
            obj.getWorldPosition(tempPos);
            const mapPos = this.worldToMap(tempPos, mapCenter, mapScale);
            if (mapPos.x >= 0 && mapPos.x <= MAP_SIZE && mapPos.y >= 0 && mapPos.y <= MAP_SIZE) {
                this.ctx.fillRect(mapPos.x - TREE_MARKER_SIZE / 2, mapPos.y - TREE_MARKER_SIZE / 2, TREE_MARKER_SIZE, TREE_MARKER_SIZE);
            }
        });

        this.ctx.fillStyle = BARRIER_MARKER_COLOR;
        this.staticObjects.barriers.forEach(obj => {
            obj.getWorldPosition(tempPos);
            const mapPos = this.worldToMap(tempPos, mapCenter, mapScale);
            if (mapPos.x >= 0 && mapPos.x <= MAP_SIZE && mapPos.y >= 0 && mapPos.y <= MAP_SIZE) {
                this.ctx.fillRect(mapPos.x - BARRIER_MARKER_SIZE / 2, mapPos.y - BARRIER_MARKER_SIZE / 2, BARRIER_MARKER_SIZE, BARRIER_MARKER_SIZE);
            }
        });

        // Draw build objects
        const allObjects = [...this.buildTool.buildObjects, ...this.advancedBuildTool.advancedBuildObjects];
        this.ctx.fillStyle = BUILD_OBJECT_MARKER_COLOR;
        allObjects.forEach(obj => {
            const mapPos = this.worldToMap(obj.position, mapCenter, mapScale);
            if (mapPos.x >= 0 && mapPos.x <= MAP_SIZE && mapPos.y >= 0 && mapPos.y <= MAP_SIZE) {
                this.ctx.fillRect(mapPos.x - BUILD_OBJECT_MARKER_SIZE / 2, mapPos.y - BUILD_OBJECT_MARKER_SIZE / 2, BUILD_OBJECT_MARKER_SIZE, BUILD_OBJECT_MARKER_SIZE);
            }
        });

        // Draw other players
        if (this.multiplayerManager) {
            this.ctx.fillStyle = OTHER_PLAYER_MARKER_COLOR;
            this.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            this.ctx.lineWidth = 1;
            for (const id in this.multiplayerManager.otherPlayers) {
                const otherPlayer = this.multiplayerManager.otherPlayers[id];
                const mapPos = this.worldToMap(otherPlayer.position, mapCenter, mapScale);
                if (mapPos.x >= 0 && mapPos.x <= MAP_SIZE && mapPos.y >= 0 && mapPos.y <= MAP_SIZE) {
                    this.ctx.beginPath();
                    this.ctx.arc(mapPos.x, mapPos.y, OTHER_PLAYER_MARKER_SIZE, 0, 2 * Math.PI);
                    this.ctx.fill();
                    this.ctx.stroke();
                }
            }
        }

        // Draw player marker (arrow/triangle)
        const playerMapPos = this.worldToMap(playerPos, mapCenter, mapScale);
        const playerRotationY = this.playerControls.getPlayerModel().rotation.y;

        this.ctx.save();
        this.ctx.translate(playerMapPos.x, playerMapPos.y);
        this.ctx.rotate(playerRotationY);
        
        this.ctx.fillStyle = PLAYER_MARKER_COLOR;
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1.5;

        this.ctx.beginPath();
        // The tip of the triangle points 'up' in the rotated context, which corresponds to player's forward direction.
        this.ctx.moveTo(0, -PLAYER_MARKER_SIZE); // Tip
        this.ctx.lineTo(-PLAYER_MARKER_SIZE * 0.7, PLAYER_MARKER_SIZE * 0.7); // Bottom-left
        this.ctx.lineTo(PLAYER_MARKER_SIZE * 0.7, PLAYER_MARKER_SIZE * 0.7); // Bottom-right
        this.ctx.closePath();
        
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
}