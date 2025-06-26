export class CharacterCreatorUI {
    constructor(dependencies) {
        this.characterCreator = dependencies.characterCreator;
    }

    create() {
        const gameContainer = document.getElementById('game-container');

        const characterButton = document.createElement('div');
        characterButton.id = 'character-creator-button';
        characterButton.innerText = 'CHARACTER';
        gameContainer.appendChild(characterButton);

        const characterModal = document.createElement('div');
        characterModal.id = 'character-creator-modal';
        characterModal.innerHTML = `
            <h2>Character Creator</h2>
            <textarea id="character-description" placeholder="Describe your character (e.g. 'a red robot with glowing eyes')"></textarea>
            <div id="reference-image-container">
              <label for="reference-image" class="reference-upload-label">Upload Reference Image (Optional)</label>
              <input type="file" id="reference-image" accept="image/*">
              <div id="reference-preview"></div>
            </div>
            <div id="character-status"></div>
            <div id="character-preview"></div>
            <div class="buttons">
              <button id="generate-character-button">Generate</button>
              <button id="apply-character-button">Apply & Save</button>
              <button id="cancel-character-button">Cancel</button>
            </div>
            <h3>Preset Characters</h3>
            <div class="character-gallery" id="preset-gallery"></div>
            <h3>Community Characters</h3>
            <div class="character-gallery" id="character-gallery"></div>
        `;
        gameContainer.appendChild(characterModal);

        characterButton.addEventListener('click', () => this.characterCreator.open());
        document.getElementById('generate-character-button').addEventListener('click', () => this.characterCreator.generateCharacter());
        document.getElementById('apply-character-button').addEventListener('click', () => this.characterCreator.applyAndSaveCharacter());
        document.getElementById('cancel-character-button').addEventListener('click', () => this.characterCreator.close());
        document.getElementById('reference-image').addEventListener('change', (e) => this.characterCreator.handleReferenceImageUpload(e));
    }
}

