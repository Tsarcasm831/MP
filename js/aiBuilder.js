export class AIBuilder {
    constructor(buildTool) {
        this.buildTool = buildTool;
        this.scene = buildTool.scene;
        this.room = buildTool.room;
    }

    async generateStructure(prompt) {
        if (!this.room || this.buildTool.aiBuilding) return;

        this.buildTool.aiBuilding = true;
        try {
            this.showIndicator("Generating your structure...");
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a 3D structure generator for a multiplayer game.
                        Create structured 3D object placements from the user's description.
                        Respond with ONLY JSON in this format:
                        {
                          "objects": [
                            {
                              "type": "box|sphere|cylinder|cone|torus",
                              "position": {"x": number, "y": number, "z": number},
                              "scale": {"x": number, "y": number, "z": number},
                              "rotation": {"x": number, "y": number, "z": number},
                              "materialIndex": number (0-5)
                            }
                          ],
                          "description": "brief description of the created structure"
                        }
                        IMPORTANT CONSTRAINTS:
                        - Keep all Y positions >= 0.5
                        - Keep all objects within reasonable game bounds (-50 to 50 for X and Z)
                        - Ensure structures are playable and make logical sense
                        - Use a maximum of 50 objects for performance reasons`
                    },
                    { role: "user", content: `Create a 3D structure: ${prompt}` }
                ],
                json: true
            });

            const structureData = JSON.parse(completion.content);
            if (structureData.objects && Array.isArray(structureData.objects)) {
                this.showIndicator(`Building: ${structureData.description}...`);
                for (const objectData of structureData.objects) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    this.placeObject(objectData);
                }
                this.showIndicator(`Created: ${structureData.description}`, true);
                setTimeout(() => this.hideIndicator(), 3000);
            }
        } catch (error) {
            console.error('Error generating structure:', error);
            this.showIndicator("Error creating structure. Please try again.", true);
            setTimeout(() => this.hideIndicator(), 3000);
        } finally {
            this.buildTool.aiBuilding = false;
        }
    }

    placeObject(objectData) {
        if (!objectData || !objectData.type) return;

        let geometry;
        switch (objectData.type.toLowerCase()) {
            case 'box': geometry = new THREE.BoxGeometry(1, 1, 1); break;
            case 'sphere': geometry = new THREE.SphereGeometry(0.5, 16, 16); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16); break;
            case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 16); break;
            case 'torus': geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32); break;
            default: geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        const materialIndex = Math.min(objectData.materialIndex || 0, this.buildTool.buildMaterials.length - 1);
        const material = this.buildTool.buildMaterials[materialIndex].clone();
        const buildObject = new THREE.Mesh(geometry, material);

        const position = objectData.position || { x: 0, y: 0.5, z: 0 };
        buildObject.position.set(
            Math.max(-50, Math.min(50, position.x || 0)) / 5,
            Math.max(0.5, position.y || 0.5) / 5,
            Math.max(-50, Math.min(50, position.z || 0)) / 5
        );

        if (this.buildTool.isLocationOccupiedByPlayer(buildObject.position)) return;
        const scale = objectData.scale || { x: 1, y: 1, z: 1 };
        buildObject.scale.set(
            Math.max(0.1, Math.min(10, scale.x || 1)) / 5,
            Math.max(0.1, Math.min(10, scale.y || 1)) / 5,
            Math.max(0.1, Math.min(10, scale.z || 1)) / 5
        );
        const rotation = objectData.rotation || { x: 0, y: 0, z: 0 };
        buildObject.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);

        buildObject.castShadow = true;
        buildObject.receiveShadow = true;
        buildObject.userData.isBarrier = true;

        const objectId = 'build_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        buildObject.userData.id = objectId;
        buildObject.userData.createdAt = Date.now();

        this.scene.add(buildObject);
        this.buildTool.buildObjects.push(buildObject);

        if (this.room) {
            const buildData = {
                objectId,
                position: buildObject.position,
                scale: buildObject.scale,
                rotation: {x: buildObject.rotation.x, y: buildObject.rotation.y, z: buildObject.rotation.z},
                materialIndex: materialIndex,
                geometryType: buildObject.geometry.type,
                createdAt: buildObject.userData.createdAt
            };
            this.room.send({ type: 'build_object', ...buildData });
            
            const updatedBuildObjects = { ...(this.room.roomState.buildObjects || {}) };
            updatedBuildObjects[objectId] = buildData;
            this.room.updateRoomState({ buildObjects: updatedBuildObjects });
        }
    }

    showIndicator(message, isComplete = false) {
        let indicator = document.getElementById('ai-building-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'ai-building-indicator';
            document.getElementById('game-container').appendChild(indicator);
        }
        indicator.innerHTML = `
            <div class="ai-building-message">
                ${isComplete ? '' : '<div class="ai-loading-spinner"></div>'}
                ${message}
            </div>
        `;
        indicator.style.display = 'flex';
    }

    hideIndicator() {
        const indicator = document.getElementById('ai-building-indicator');
        if (indicator) indicator.style.display = 'none';
    }
}