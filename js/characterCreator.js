import { createPlayerModel } from "./player.js";
import { presetCharacters } from "./presetCharacters.js";

export class CharacterCreator {
    constructor(THREE, room, playerControls, onApplyCharacter) {
        this.THREE = THREE;
        this.room = room;
        this.playerControls = playerControls;
        this.onApplyCharacter = onApplyCharacter;

        this.characterCollection = this.room.collection('characters');
        this.modal = null;
        this.previewContainer = null;
        this.statusEl = null;
        this.descriptionInput = null;

        this.previewScene = null;
        this.previewCamera = null;
        this.previewRenderer = null;
        this.previewModel = null;
        this.previewAnimationId = null;

        this.currentCharacterDescription = "";
        window.tempCharacterSpec = null;
        window.referenceImageUrl = null;
    }

    open() {
        this.modal = document.getElementById('character-creator-modal');
        this.previewContainer = document.getElementById('character-preview');
        this.statusEl = document.getElementById('character-status');
        this.descriptionInput = document.getElementById('character-description');

        if (!this.modal) {
            console.error("Character creator modal not found in DOM!");
            return;
        }

        this.modal.style.display = 'block';
        this.descriptionInput.value = this.currentCharacterDescription;

        document.getElementById('reference-preview').innerHTML = '';
        document.getElementById('reference-image').value = '';
        window.referenceImageUrl = null;

        if (this.playerControls) {
            this.playerControls.enabled = false;
        }

        this.setupPreviewRenderer();
        this.populatePresetCharacters();
        this.loadCommunityCharacters();
    }

    close() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        this.stopPreviewAnimation();
        if (this.playerControls) {
            this.playerControls.enabled = true;
        }
    }

    setupPreviewRenderer() {
        this.previewContainer.innerHTML = '';
        this.previewScene = new this.THREE.Scene();
        this.previewScene.background = new this.THREE.Color(0x333333);

        this.previewCamera = new this.THREE.PerspectiveCamera(50, 2, 0.1, 1000);
        this.previewCamera.position.set(0, 1, 3);
        this.previewCamera.lookAt(0, 0.5, 0);

        this.previewRenderer = new this.THREE.WebGLRenderer({ antialias: true });
        this.previewRenderer.setSize(this.previewContainer.clientWidth, 150);
        this.previewRenderer.shadowMap.enabled = true;
        this.previewContainer.appendChild(this.previewRenderer.domElement);

        const ambLight = new this.THREE.AmbientLight(0xffffff, 0.5);
        this.previewScene.add(ambLight);
        const dirLight = new this.THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 5, 5);
        this.previewScene.add(dirLight);
        
        const grid = new this.THREE.GridHelper(4, 4);
        this.previewScene.add(grid);
    }

    animatePreview() {
        if (!this.previewScene || !this.previewCamera || !this.previewRenderer) return;

        const time = performance.now() * 0.001;
        this.previewAnimationId = requestAnimationFrame(this.animatePreview.bind(this));

        if (this.previewModel) {
            this.previewModel.rotation.y += 0.01;
            if (this.previewModel.userData.updateAnimations) {
                this.previewModel.userData.updateAnimations(time);
            }
        }
        this.previewRenderer.render(this.previewScene, this.previewCamera);
    }

    stopPreviewAnimation() {
        if (this.previewAnimationId !== null) {
            cancelAnimationFrame(this.previewAnimationId);
            this.previewAnimationId = null;
        }
    }

    updatePreviewModel(characterSpec) {
        if (this.previewModel) {
            this.previewScene.remove(this.previewModel);
        }
        this.previewModel = createPlayerModel(this.THREE, "preview", characterSpec);
        this.previewModel.position.set(0, 0, 0);
        this.previewScene.add(this.previewModel);

        if (this.previewAnimationId === null) {
            this.animatePreview();
        }
    }
    
    async handleReferenceImageUpload(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const previewDiv = document.getElementById('reference-preview');
        previewDiv.innerHTML = '<p>Uploading image...</p>';

        try {
            const imageUrl = await websim.upload(file);
            previewDiv.innerHTML = `
                <img src="${imageUrl}" alt="Reference" id="reference-image-preview">
                <button id="remove-reference-image">Remove</button>
            `;
            window.referenceImageUrl = imageUrl;

            document.getElementById('remove-reference-image').addEventListener('click', () => {
                previewDiv.innerHTML = ''; window.referenceImageUrl = null; document.getElementById('reference-image').value = '';
            });

        } catch (error) {
            console.error('Error uploading image:', error);
            previewDiv.innerHTML = '<p>Error uploading image. Please try again.</p>';
        }
    }

    async generateCharacter() {
        const description = this.descriptionInput.value.trim();
        if (description.length < 3) {
            this.statusEl.textContent = 'Please enter a longer description';
            return;
        }

        this.statusEl.textContent = 'Generating your character...';
        document.getElementById('generate-character-button').disabled = true;

        try {
            const messages = [{
                role: "system",
                content: `Convert the user's character description into a structured 3D character model description.
                The model should reflect what they describe - not necessarily humanoid.
                SIZE CONSTRAINT: No dimension should exceed 2x2 units. Keep all features within a 2x2x2 cube.
                Respond with ONLY JSON, following this schema:
                {
                  "customMode": true,
                  "features": [
                    {
                      "type": "box|sphere|cylinder|cone|torus", 
                      "color": "hexcolor",
                      "position": {"x": number, "y": number, "z": number},
                      "scale": {"x": number, "y": number, "z": number},
                      "rotation": {"x": number, "y": number, "z": number},
                      "roughness": number, "metalness": number, "transparent": boolean, "opacity": number,
                      "name": "string",
                      "texture": { "id": "brick|wood|skin|metal|water|glass", "textureUrl": "url" },
                      "animation": { "type": "jiggly|bobUpDown|spinY|spinX|spinZ|pulse" }
                    }
                  ],
                  "description": "brief description of the character"
                }
                Create a fully custom design using multiple primitive shapes.
                Place at least one feature near Y=0 as the 'base' for proper collision.
                IMPORTANT: Keep all shapes within a 2x2x2 area centered on the character.
                If legs should animate, name them "leftLeg" and "rightLeg".
                CRITICAL: Ensure at least one component extends to Y=0 or below for ground anchor.
                Be creative and interpret the user's description freely while respecting size constraints.`
            }];

            const userMessage = { role: "user", content: [] };
            userMessage.content.push({ type: "text", text: description });
            if (window.referenceImageUrl) {
                userMessage.content.push({ type: "image_url", image_url: { url: window.referenceImageUrl } });
            }
            messages.push(userMessage);

            const completion = await websim.chat.completions.create({ messages, json: true });
            const characterSpec = JSON.parse(completion.content);

            this.currentCharacterDescription = description;
            this.updatePreviewModel(characterSpec);
            this.statusEl.textContent = 'Ready to apply!';
            document.getElementById('apply-character-button').style.display = 'block';
            window.tempCharacterSpec = characterSpec;
        } catch (error) {
            console.error('Error generating character:', error);
            this.statusEl.textContent = 'Error generating character. Please try again.';
        } finally {
            document.getElementById('generate-character-button').disabled = false;
        }
    }

    async applyAndSaveCharacter() {
        if (!window.tempCharacterSpec) {
            this.statusEl.textContent = 'Please generate a character first';
            return;
        }

        try {
            const playerModel = this.onApplyCharacter(window.tempCharacterSpec);
            
            await this.characterCollection.create({
                description: this.currentCharacterDescription,
                spec: window.tempCharacterSpec,
                creator: this.room.peers[this.room.clientId]?.username || 'player',
                referenceImage: window.referenceImageUrl || null
            });

            this.room.updatePresence({
                characterSpec: window.tempCharacterSpec
            });

            this.statusEl.textContent = 'Character applied and saved!';
            await this.loadCommunityCharacters();
            setTimeout(() => this.close(), 1500);
        } catch (error) {
            console.error('Error applying character:', error);
            this.statusEl.textContent = 'Error saving character. Please try again.';
        }
    }

    loadCommunityCharacters() {
        const gallery = document.getElementById('character-gallery');
        gallery.innerHTML = '';
        const characters = this.characterCollection.getList();

        if (characters.length === 0) {
            gallery.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">No characters yet. Be the first!</div>';
            return;
        }
        
        characters.forEach(character => {
            const charEl = document.createElement('div');
            charEl.className = 'character-option';
            
            if (character.referenceImage) {
                charEl.innerHTML = `
                    <div class="character-thumbnail"><img src="${character.referenceImage}" alt="Ref"></div>
                    <div class="character-name">${character.description.slice(0, 15) + (character.description.length > 15 ? '...' : '')}</div>
                `;
            } else {
                charEl.textContent = character.description.slice(0, 30) + (character.description.length > 30 ? '...' : '');
            }
            charEl.title = `${character.description} (by ${character.username})`;

            charEl.addEventListener('click', () => {
                document.querySelectorAll('.character-option').forEach(el => el.classList.remove('selected'));
                charEl.classList.add('selected');
                this.descriptionInput.value = character.description;
                this.updatePreviewModel(character.spec);
                window.tempCharacterSpec = character.spec;
                
                const previewDiv = document.getElementById('reference-preview');
                if (character.referenceImage) {
                    previewDiv.innerHTML = `<img src="${character.referenceImage}" id="reference-image-preview"><button id="remove-reference-image">Remove</button>`;
                    window.referenceImageUrl = character.referenceImage;
                    document.getElementById('remove-reference-image').addEventListener('click', () => {
                        previewDiv.innerHTML = ''; window.referenceImageUrl = null; document.getElementById('reference-image').value = '';
                    });
                } else {
                    previewDiv.innerHTML = ''; window.referenceImageUrl = null;
                }
                document.getElementById('apply-character-button').style.display = 'block';
            });
            gallery.appendChild(charEl);
        });
    }

    populatePresetCharacters() {
        const gallery = document.getElementById('preset-gallery');
        gallery.innerHTML = '';
        presetCharacters.forEach(preset => {
            const presetEl = document.createElement('div');
            presetEl.className = 'character-option';
            presetEl.textContent = preset.name;
            presetEl.title = preset.description;
            presetEl.addEventListener('click', () => {
                document.querySelectorAll('.character-option').forEach(el => el.classList.remove('selected'));
                presetEl.classList.add('selected');
                this.descriptionInput.value = preset.description;
                this.updatePreviewModel(preset.spec);
                window.tempCharacterSpec = preset.spec;
                document.getElementById('apply-character-button').style.display = 'block';
                this.statusEl.textContent = 'Preset character selected!';
            });
            gallery.appendChild(presetEl);
        });
    }
}