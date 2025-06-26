export class BuildUI {
    constructor(dependencies) {
        this.playerControls = dependencies.playerControls;
        this.buildTool = dependencies.buildTool;
        this.advancedBuildTool = dependencies.advancedBuildTool;
        this.renderer = dependencies.renderer;
    }

    create() {
        this.createBuildUI();
        this.createAIBuildUI();
    }

    createBuildUI() {
        const gameContainer = document.getElementById('game-container');
        
        // Create build tool UI
        const buildButton = document.createElement('div');
        buildButton.id = 'build-button';
        buildButton.innerText = 'BUILD';
        gameContainer.appendChild(buildButton);
        
        const uselessButton = document.createElement('div');
        uselessButton.id = 'useless-button';
        uselessButton.innerText = 'USELESS';
        uselessButton.style.display = 'none';
        gameContainer.appendChild(uselessButton);
        
        const buildControls = document.createElement('div');
        buildControls.id = 'build-controls';
        buildControls.innerHTML = `
            <button id="shape-button">Change Shape</button>
            <button id="material-button">Change Material</button>
            <button id="size-button">Change Size</button>
            <button id="rotate-button">Rotate</button>
            <button id="undo-button">Undo</button>
            <button id="advanced-mode-button">Advanced Mode</button>
            <button id="ai-build-button">AI Build</button>
            <button id="lifespan-extender-button">Extend Lifespan</button>
            <button id="exit-build-button">Exit Build Mode</button>
        `;
        buildControls.style.display = 'none';
        gameContainer.appendChild(buildControls);

        buildButton.addEventListener('click', () => {
            const isBuildEnabled = this.buildTool.toggleBuildMode();
            buildControls.style.display = isBuildEnabled ? 'flex' : 'none';
            buildButton.classList.toggle('active', isBuildEnabled);
            
            const charButton = document.getElementById('character-creator-button');
            const chatButton = document.getElementById('chat-button');

            if (isBuildEnabled) {
                charButton.style.pointerEvents = 'none';
                charButton.style.opacity = '0.5';
                chatButton.style.pointerEvents = 'none';
                chatButton.style.opacity = '0.5';
                document.getElementById('ai-build-button').style.display = 'block';
            } else {
                charButton.style.pointerEvents = 'auto';
                charButton.style.opacity = '1';
                chatButton.style.pointerEvents = 'auto';
                chatButton.style.opacity = '1';
                if(this.advancedBuildTool.enabled) {
                    this.advancedBuildTool.toggleAdvancedBuildMode();
                    document.getElementById('advanced-mode-button').classList.remove('active');
                }
            }
        });

        document.getElementById('shape-button').addEventListener('click', () => this.buildTool.changeShape());
        document.getElementById('material-button').addEventListener('click', () => this.buildTool.changeMaterial());
        document.getElementById('size-button').addEventListener('click', () => this.buildTool.changeSize());
        document.getElementById('rotate-button').addEventListener('click', () => this.buildTool.rotatePreview());
        document.getElementById('undo-button').addEventListener('click', () => this.buildTool.undoLastObject());

        document.getElementById('exit-build-button').addEventListener('click', () => {
            this.buildTool.toggleBuildMode();
            buildControls.style.display = 'none';
            buildButton.classList.remove('active');
            
            if (this.buildTool.extendingLifespan) {
                this.buildTool.toggleLifespanExtender();
            }
            document.getElementById('lifespan-extender-button').classList.remove('active');
            
            const charButton = document.getElementById('character-creator-button');
            const chatButton = document.getElementById('chat-button');
            charButton.style.pointerEvents = 'auto';
            charButton.style.opacity = '1';
            chatButton.style.pointerEvents = 'auto';
            chatButton.style.opacity = '1';
        });

        document.getElementById('advanced-mode-button').addEventListener('click', (e) => {
            buildControls.style.display = 'none';
            const isActive = this.advancedBuildTool.toggleAdvancedBuildMode();
            e.target.classList.toggle('active', isActive);
        });

        document.getElementById('lifespan-extender-button').addEventListener('click', () => {
            const isExtenderActive = this.buildTool.toggleLifespanExtender();
            document.getElementById('lifespan-extender-button').classList.toggle('active', isExtenderActive);
            const buttonsToToggle = ['shape-button', 'material-button', 'size-button', 'rotate-button', 'undo-button', 'advanced-mode-button', 'ai-build-button'];
            buttonsToToggle.forEach(id => {
              document.getElementById(id).style.display = isExtenderActive ? 'none' : 'block';
            });
        });

        this.renderer.domElement.addEventListener('click', (event) => {
            if (this.buildTool.extendingLifespan) {
                const playerPosition = this.playerControls.getPlayerModel().position.clone();
                this.buildTool.extendObjectLifespans(playerPosition);
            }
        });

        uselessButton.addEventListener('click', () => {
            alert("This button does absolutely nothing... but you found it!");
        });

        this.createAIBuildUI();
    }

    createAIBuildUI() {
        const gameContainer = document.getElementById('game-container');
        const aiBuildModal = document.createElement('div');
        aiBuildModal.id = 'ai-build-modal';
        aiBuildModal.innerHTML = `
            <h3>AI Structure Generator</h3>
            <textarea id="ai-build-prompt" placeholder="Describe what you want to build (e.g. 'a castle with towers', 'an obstacle course with jumps', 'a cozy cottage')"></textarea>
            <div class="buttons">
            <button class="generate">Generate Structure</button>
            <button class="cancel">Cancel</button>
            </div>
            <div id="ai-build-examples">
            <p>Examples:</p>
            <div class="ai-example">A castle with four towers and a drawbridge</div>
            <div class="ai-example">An obstacle course with platforms of varying heights</div>
            <div class="ai-example">A cozy cottage with a chimney and windows</div>
            </div>
        `;
        gameContainer.appendChild(aiBuildModal);

        document.getElementById('ai-build-button').addEventListener('click', () => {
            document.getElementById('ai-build-modal').style.display = 'block';
        });

        document.querySelector('#ai-build-modal button.generate').addEventListener('click', async () => {
            const prompt = document.getElementById('ai-build-prompt').value.trim();
            if (prompt.length < 3) {
                alert('Please enter a longer description');
                return;
            }
            document.getElementById('ai-build-modal').style.display = 'none';
            await this.buildTool.aiGenerateStructure(prompt);
        });

        document.querySelector('#ai-build-modal button.cancel').addEventListener('click', () => {
            document.getElementById('ai-build-modal').style.display = 'none';
        });

        document.querySelectorAll('.ai-example').forEach(example => {
            example.addEventListener('click', () => {
                document.getElementById('ai-build-prompt').value = example.textContent;
            });
        });
    }
}

