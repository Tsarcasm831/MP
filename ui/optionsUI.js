import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Downloader } from '../js/downloader.js';
import { setupAnimatedPlayer } from '../js/player.js';

export class OptionsUI {
    constructor(dependencies) {
        this.dependencies = dependencies;
        this.downloader = new Downloader();
        this.assets = null;
    }

    create() {
        const container = document.getElementById('game-container');
        const button = document.createElement('div');
        button.id = 'options-button';
        button.innerText = 'OPTIONS';
        container.appendChild(button);

        const modal = document.createElement('div');
        modal.id = 'options-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div id="close-options">✕</div>
            <button id="download-assets">Download Assets</button>
            <button id="replace-player-button">Use Animated Player</button>
            <div id="download-status"></div>
        `;
        container.appendChild(modal);

        button.addEventListener('click', () => {
            modal.style.display = 'block';
        });

        modal.querySelector('#close-options').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.querySelector('#download-assets').addEventListener('click', () => {
            this.downloadExternalAssets();
        });

        modal.querySelector('#replace-player-button').addEventListener('click', () => {
            this.replacePlayer();
        });
    }

    async downloadExternalAssets() {
        const status = document.getElementById('download-status');
        const replaceBtn = document.getElementById('replace-player-button');
        status.textContent = 'Loading asset list...';
        try {
            const response = await fetch('assets.json');
            const data = await response.json();
            const external = data.assets.filter(a => /^https?:/.test(a.url));
            this.assets = await this.downloader.preloadAssets(external, (asset, p) => {
                status.textContent = `Downloading ${asset.name} ${(p * 100).toFixed(0)}%`;
            });
            status.textContent = 'All assets downloaded.';
            replaceBtn.style.display = 'block';
        } catch (e) {
            status.textContent = 'Failed to download assets.';
            console.error(e);
        }
    }

    async replacePlayer() {
        if (!this.assets) {
            document.getElementById('download-status').textContent = 'Please download assets first.';
            return;
        }

        const idleAsset = this.assets['Player idle animation'];
        const walkAsset = this.assets['Player walking animation'];
        const runAsset = this.assets['Player running animation'];

        if (!idleAsset || !walkAsset || !runAsset) {
            document.getElementById('download-status').textContent = 'Animation assets missing.';
            console.error("One or more player animation assets are missing.");
            return;
        }

        const status = document.getElementById('download-status');
        status.textContent = 'Loading animated player...';

        const loader = new GLTFLoader();

        const idleUrl = URL.createObjectURL(idleAsset);
        const walkUrl = URL.createObjectURL(walkAsset);
        const runUrl = URL.createObjectURL(runAsset);

        try {
            const [gltfIdle, gltfWalk, gltfRun] = await Promise.all([
                loader.loadAsync(idleUrl),
                loader.loadAsync(walkUrl),
                loader.loadAsync(runUrl),
            ]);

            const model = gltfIdle.scene;
            setupAnimatedPlayer(model, gltfIdle.animations[0], gltfWalk.animations[0], gltfRun.animations[0]);

            const scene = this.dependencies.playerControls.scene;
            const controls = this.dependencies.playerControls;

            if (controls.playerModel) {
                scene.remove(controls.playerModel);
            }

            model.traverse(c => { c.castShadow = true; });
            scene.add(model);
            controls.playerModel = model;
            controls.playerModel.userData.isGLB = true; // Flag for multiplayer presence

            // Reset currentAction on playerControls
            controls.currentAction = 'idle';

            status.textContent = 'Player model replaced with animated version.';

        } catch (error) {
            console.error('Error loading player animations:', error);
            status.textContent = 'Failed to load animated player.';
        } finally {
             // Ensure urls are revoked even if something fails
             URL.revokeObjectURL(idleUrl);
             URL.revokeObjectURL(walkUrl);
             URL.revokeObjectURL(runUrl);
        }
    }
}