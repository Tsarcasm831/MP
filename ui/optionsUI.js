import { Downloader } from '../js/downloader.js';

export class OptionsUI {
    constructor() {
        this.downloader = new Downloader();
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
    }

    async downloadExternalAssets() {
        const status = document.getElementById('download-status');
        status.textContent = 'Loading asset list...';
        try {
            const response = await fetch('assets.json');
            const data = await response.json();
            const external = data.assets.filter(a => /^https?:/.test(a.url));
            await this.downloader.preloadAssets(external, (asset, p) => {
                status.textContent = `Downloading ${asset.name} ${(p * 100).toFixed(0)}%`;
            });
            status.textContent = 'All assets downloaded.';
        } catch (e) {
            status.textContent = 'Failed to download assets.';
        }
    }
}
