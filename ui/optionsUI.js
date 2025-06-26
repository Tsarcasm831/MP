import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Downloader } from '../js/downloader.js';

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
        button.classList.add('fixed-button');
        button.innerText = 'OPTIONS';
        container.appendChild(button);

        const modal = document.createElement('div');
        modal.id = 'options-modal';
        modal.classList.add('modal-container');
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
        }
    }

    replacePlayer() {
        if (!this.assets) return;

        const idle = this.assets['Player idle animation'];
        if (!idle) return;

        const url = URL.createObjectURL(idle);
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
            const scene = this.dependencies.playerControls.scene;
            const controls = this.dependencies.playerControls;
            if (controls.playerModel) {
                scene.remove(controls.playerModel);
            }
            const model = gltf.scene;
            model.traverse(c => { c.castShadow = true; });
            scene.add(model);
            controls.playerModel = model;
            URL.revokeObjectURL(url);
        });
    }
}
