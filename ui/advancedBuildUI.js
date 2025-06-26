import * as THREE from 'three';

export class AdvancedBuildUI {
    constructor(dependencies) {
        this.advancedBuildTool = dependencies.advancedBuildTool;
        this.buildTool = dependencies.buildTool;
    }

    create() {
        const advancedBuildControls = document.createElement('div');
        advancedBuildControls.id = 'advanced-build-controls';
        advancedBuildControls.innerHTML = `
          <button id="translate-button" class="transform-button active">Move (G)</button>
          <button id="rotate-button" class="transform-button">Rotate (R)</button>
          <button id="scale-button" class="transform-button">Scale (S)</button>
          <button id="color-button">Color</button>
          <button id="color-pick-button">Pick Color</button>
          <button id="duplicate-button">Duplicate (Ctrl+D)</button>
          <button id="delete-button">Delete</button>
          <button id="exit-advanced-build-button">Exit</button>
        `;
        document.getElementById('game-container').appendChild(advancedBuildControls);

        const objectLibrary = document.createElement('div');
        objectLibrary.id = 'object-library';
        objectLibrary.innerHTML = `
          <h3>Object Library</h3>
          <div class="object-grid"></div>
        `;
        document.getElementById('game-container').appendChild(objectLibrary);

        const selectionControls = document.createElement('div');
        selectionControls.id = 'selection-controls';
        selectionControls.innerHTML = `
          <div class="selection-info">Object Selected</div>
        `;
        document.getElementById('game-container').appendChild(selectionControls);

        const colorPicker = document.createElement('div');
        colorPicker.id = 'color-picker';
        colorPicker.innerHTML = `
          <h3>Color Picker</h3>
          <div class="color-controls">
            <div id="color-preview"></div>
            <div class="color-inputs">
              <div class="color-input">
                <label for="color-r">R</label>
                <input type="number" id="color-r" min="0" max="255" value="255">
              </div>
              <div class="color-input">
                <label for="color-g">G</label>
                <input type="number" id="color-g" min="0" max="255" value="0">
              </div>
              <div class="color-input">
                <label for="color-b">B</label>
                <input type="number" id="color-b" min="0" max="255" value="0">
              </div>
            </div>
          </div>
          <button id="apply-color-button">Apply Color</button>
          <button id="close-color-picker">Close</button>
        `;
        colorPicker.style.display = 'none';
        document.getElementById('game-container').appendChild(colorPicker);

        const objectGrid = document.querySelector('#object-library .object-grid');
        this.advancedBuildTool.objectCreator.objectLibrary.forEach(obj => {
          const objectButton = document.createElement('div');
          objectButton.className = 'object-item';
          objectButton.textContent = obj.name;
          objectButton.addEventListener('click', () => {
            this.advancedBuildTool.createObjectFromLibrary(obj.name);
          });
          objectGrid.appendChild(objectButton);
        });

        document.getElementById('translate-button').addEventListener('click', () => this.advancedBuildTool.setTransformMode('translate'));
        document.getElementById('rotate-button').addEventListener('click', () => this.advancedBuildTool.setTransformMode('rotate'));
        document.getElementById('scale-button').addEventListener('click', () => this.advancedBuildTool.setTransformMode('scale'));

        document.getElementById('color-button').addEventListener('click', () => {
            if (this.advancedBuildTool.selectedObject) {
                document.getElementById('color-picker').style.display = 'block';
                const color = this.advancedBuildTool.selectedObject.material.color;
                const r = Math.round(color.r * 255);
                const g = Math.round(color.g * 255);
                const b = Math.round(color.b * 255);
                document.getElementById('color-r').value = r;
                document.getElementById('color-g').value = g;
                document.getElementById('color-b').value = b;
                document.getElementById('color-preview').style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            }
        });

        document.getElementById('color-pick-button').addEventListener('click', () => this.advancedBuildTool.toggleColorPicker());
        document.getElementById('apply-color-button').addEventListener('click', () => {
            const r = parseInt(document.getElementById('color-r').value) / 255;
            const g = parseInt(document.getElementById('color-g').value) / 255;
            const b = parseInt(document.getElementById('color-b').value) / 255;
            this.advancedBuildTool.changeObjectColor(new THREE.Color(r, g, b));
        });
        document.getElementById('close-color-picker').addEventListener('click', () => {
            document.getElementById('color-picker').style.display = 'none';
        });

        document.getElementById('color-r').addEventListener('input', () => this.advancedBuildTool.updateColorPreview());
        document.getElementById('color-g').addEventListener('input', () => this.advancedBuildTool.updateColorPreview());
        document.getElementById('color-b').addEventListener('input', () => this.advancedBuildTool.updateColorPreview());

        document.getElementById('delete-button').addEventListener('click', () => this.advancedBuildTool.deleteSelectedObject());
        document.getElementById('duplicate-button').addEventListener('click', () => this.advancedBuildTool.duplicateSelectedObject());

        document.getElementById('exit-advanced-build-button').addEventListener('click', () => {
            this.advancedBuildTool.toggleAdvancedBuildMode();
            document.getElementById('advanced-mode-button').classList.remove('active');
            document.getElementById('build-controls').style.display = 'flex';
            this.buildTool.previewManager.show();
        });
    }
}

