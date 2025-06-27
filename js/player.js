import * as THREE from 'three';

export function setupAnimatedPlayer(model, idleClip, walkClip, runClip) {
    // Rename clips for easier access
    idleClip.name = 'idle';
    walkClip.name = 'walk';
    runClip.name = 'run';
    model.animations = [idleClip, walkClip, runClip];

    const mixer = new THREE.AnimationMixer(model);
    const actions = {
        idle: mixer.clipAction(idleClip),
        walk: mixer.clipAction(walkClip),
        run: mixer.clipAction(runClip),
    };
    
    /* @tweakable Duration for fading between animations in seconds. */
    const animationFadeDuration = 0.5;

    actions.idle.play();

    // Apply a rotation offset so the GLB faces the same direction as procedural models
    const rotationOffset = -Math.PI / 2;
    model.rotation.y = rotationOffset;
    model.userData.rotationOffset = rotationOffset;

    model.userData.mixer = mixer;
    model.userData.actions = actions;
    model.userData.isAnimatedGLB = true;
    model.userData.animationFadeDuration = animationFadeDuration;

    return model;
}

function _createCustomPlayerModel(playerGroup, characterSpec) {
    if (!characterSpec.features || !Array.isArray(characterSpec.features)) {
        return;
    }

    let minY = Infinity;
    const animatedFeatures = [];

    characterSpec.features.forEach(feature => {
        let geometry;
        switch (feature.type.toLowerCase()) {
            case 'box': geometry = new THREE.BoxGeometry(1, 1, 1); break;
            case 'sphere': geometry = new THREE.SphereGeometry(0.5, 16, 16); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16); break;
            case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 16); break;
            case 'torus': geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32); break;
            default: geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        let material;
        if (feature.texture) {
            if (feature.texture.textureUrl) {
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load(feature.texture.textureUrl);
                const materialParams = {
                    map: texture,
                    roughness: feature.roughness || feature.texture.roughness || 0.7,
                    metalness: feature.metalness || feature.texture.metalness || 0.2,
                    transparent: feature.transparent || false,
                    opacity: feature.opacity !== undefined ? feature.opacity : 1.0
                };
                if (feature.texture.normalMap) {
                    materialParams.normalMap = textureLoader.load(feature.texture.normalMap);
                }
                material = new THREE.MeshStandardMaterial(materialParams);
            } else {
                material = new THREE.MeshStandardMaterial({
                    color: feature.color || feature.texture.color || 0xffffff,
                    roughness: feature.roughness || feature.texture.roughness || 0.7,
                    metalness: feature.metalness || feature.texture.metalness || 0.2,
                    transparent: feature.transparent || feature.texture.transparent || false,
                    opacity: feature.opacity !== undefined ? feature.opacity :
                           (feature.texture.opacity !== undefined ? feature.texture.opacity : 1.0)
                });
            }
        } else {
            material = new THREE.MeshStandardMaterial({
                color: feature.color || 0xffffff,
                roughness: feature.roughness || 0.7,
                metalness: feature.metalness || 0.2,
                transparent: feature.transparent || false,
                opacity: feature.opacity !== undefined ? feature.opacity : 1.0
            });
        }

        const mesh = new THREE.Mesh(geometry, material);

        if (feature.position) {
            mesh.position.set(
                Math.max(-1, Math.min(1, feature.position.x || 0)),
                Math.max(-1, Math.min(1, feature.position.y || 0)),
                Math.max(-1, Math.min(1, feature.position.z || 0))
            );
        }

        if (feature.position && feature.scale) {
            const halfHeight = (feature.scale.y || 1) / 2;
            const bottomY = (feature.position.y || 0) - halfHeight;
            minY = Math.min(minY, bottomY);
        } else if (feature.position) {
            minY = Math.min(minY, (feature.position.y || 0) - 0.5);
        }

        if (feature.scale) {
            mesh.scale.set(
                Math.min(2, feature.scale.x || 1),
                Math.min(2, feature.scale.y || 1),
                Math.min(2, feature.scale.z || 1)
            );
        }

        if (feature.rotation) {
            mesh.rotation.set(
                feature.rotation.x || 0,
                feature.rotation.y || 0,
                feature.rotation.z || 0
            );
        }
        
        if (feature.animation) {
            animatedFeatures.push({
                mesh: mesh,
                animation: feature.animation,
                initialPosition: feature.position ? {...feature.position} : {x: 0, y: 0, z: 0},
                initialRotation: feature.rotation ? {...feature.rotation} : {x: 0, y: 0, z: 0},
                initialScale: feature.scale ? {...feature.scale} : {x: 1, y: 1, z: 1}
            });
        }
        
        if (feature.name === "leftLeg" || feature.name === "rightLeg") {
            mesh.name = feature.name;
            const legHeight = feature.scale?.y || 1;
            mesh.geometry.translate(0, -legHeight / 2, 0); // Set pivot to top of leg
        }
        
        mesh.castShadow = true;
        playerGroup.add(mesh);
    });

    if (minY !== Infinity && minY < 0) {
        playerGroup.position.y = -minY;
    } else if (minY > 0) {
        const hitboxGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
        const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 });
        const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        hitbox.position.y = 0;
        playerGroup.add(hitbox);
    }
    
    if (animatedFeatures.length > 0) {
        playerGroup.userData.animatedFeatures = animatedFeatures;
        playerGroup.userData.updateAnimations = (time) => {
            animatedFeatures.forEach(feature => {
                const { mesh, animation, initialPosition, initialRotation, initialScale } = {
                    mesh: feature.mesh,
                    animation: feature.animation,
                    initialPosition: feature.initialPosition || {x:0,y:0,z:0},
                    initialRotation: feature.initialRotation || {x:0,y:0,z:0},
                    initialScale: feature.initialScale || {x:1,y:1,z:1}
                };
                
                switch(animation.type) {
                    case 'jiggly':
                        mesh.position.x = initialPosition.x + (Math.sin(time * 10) * 0.03);
                        mesh.position.y = initialPosition.y + (Math.cos(time * 8) * 0.03);
                        mesh.position.z = initialPosition.z + (Math.sin(time * 12) * 0.03);
                        break;
                    case 'bobUpDown':
                        mesh.position.y = initialPosition.y + (Math.sin(time * 2) * 0.1);
                        break;
                    case 'spinY': mesh.rotation.y = initialRotation.y + time * 2; break;
                    case 'spinX': mesh.rotation.x = initialRotation.x + time * 2; break;
                    case 'spinZ': mesh.rotation.z = initialRotation.z + time * 2; break;
                    case 'pulse':
                        const scaleFactor = 1 + (Math.sin(time * 3) * 0.1);
                        mesh.scale.set(initialScale.x * scaleFactor, initialScale.y * scaleFactor, initialScale.z * scaleFactor);
                        break;
                }
            });
        };
    }
}

function _createDefaultPlayerModel(playerGroup, username, characterSpec, defaultColor) {
    const bodyColor = characterSpec?.bodyColor ? new THREE.Color(characterSpec.bodyColor) : defaultColor;
    const legColor = characterSpec?.legColor ? new THREE.Color(characterSpec.legColor) : defaultColor.clone().multiplyScalar(0.8);
    const eyeColor = characterSpec?.eyeColor ? new THREE.Color(characterSpec.eyeColor) : 0xffffff;
    
    const bodyGeometry = new THREE.BoxGeometry(0.6 * 0.7, 1.4 * 0.7, 0.3 * 0.7);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.1 * 0.7;
    body.castShadow = true;
    playerGroup.add(body);
    
    const eyeGeometry = new THREE.SphereGeometry(0.08 * 0.7, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: eyeColor });
    const eyePupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15 * 0.7, 1.6 * 0.7, 0.15 * 0.7);
    playerGroup.add(leftEye);
    
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04 * 0.7, 8, 8), eyePupilMaterial);
    leftPupil.position.set(0, 0, 0.05 * 0.7);
    leftEye.add(leftPupil);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15 * 0.7, 1.6 * 0.7, 0.15 * 0.7);
    playerGroup.add(rightEye);
    
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04 * 0.7, 8, 8), eyePupilMaterial);
    rightPupil.position.set(0, 0, 0.05 * 0.7);
    rightEye.add(rightPupil);
    
    const legGeometry = new THREE.BoxGeometry(0.2 * 0.7, 0.5 * 0.7, 0.2 * 0.7);
    const legMaterial = new THREE.MeshStandardMaterial({ color: legColor });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2 * 0.7, 0.45 * 0.7, 0); // Adjusted Y position
    leftLeg.geometry.translate(0, -0.25 * 0.7, 0);
    leftLeg.name = "leftLeg";
    playerGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2 * 0.7, 0.45 * 0.7, 0); // Adjusted Y position
    rightLeg.geometry.translate(0, -0.25 * 0.7, 0);
    rightLeg.name = "rightLeg";
    playerGroup.add(rightLeg);
    
    if (characterSpec && characterSpec.features && Array.isArray(characterSpec.features)) {
        characterSpec.features.forEach(feature => {
            let geometry;
            switch (feature.type.toLowerCase()) {
                case 'box': geometry = new THREE.BoxGeometry(1, 1, 1); break;
                case 'sphere': geometry = new THREE.SphereGeometry(0.5, 16, 16); break;
                case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16); break;
                default: geometry = new THREE.BoxGeometry(1, 1, 1);
            }
            const material = new THREE.MeshStandardMaterial({ color: feature.color || 0xffffff, roughness: 0.7, metalness: 0.2 });
            const mesh = new THREE.Mesh(geometry, material);
            if (feature.position) mesh.position.set(feature.position.x || 0, feature.position.y || 0, feature.position.z || 0);
            if (feature.scale) mesh.scale.set(feature.scale.x || 1, feature.scale.y || 1, feature.scale.z || 1);
            if (feature.rotation) mesh.rotation.set(feature.rotation.x || 0, feature.rotation.y || 0, feature.rotation.z || 0);
            mesh.castShadow = true;
            playerGroup.add(mesh);
        });
    }
}

export function createPlayerModel(three, username, characterSpec) {
    const playerGroup = new THREE.Group();
    playerGroup.userData.isPlayer = true;
    
    // Store character spec in userData for reference
    if (characterSpec) {
        playerGroup.userData.characterSpec = characterSpec;
    }
    
    // Generate consistent color from username for default appearance
    const hash = username.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    const defaultColor = new THREE.Color(Math.abs(hash) % 0xffffff);
    
    // If there's a character spec and it includes a custom mode flag, create a fully custom character
    if (characterSpec && characterSpec.customMode) {
        _createCustomPlayerModel(playerGroup, characterSpec);
    } else {
        _createDefaultPlayerModel(playerGroup, username, characterSpec, defaultColor);
    }
    
    // Add a billboarded text plane for chat messages (not visible by default)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(0, 0, 0, 0)'; // Transparent background
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const chatMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    const chatGeometry = new THREE.PlaneGeometry(1, 0.25);
    const chatMesh = new THREE.Mesh(chatGeometry, chatMaterial);
    chatMesh.position.y = 2.3 * 0.7; 
    chatMesh.rotation.x = Math.PI / 12;
    chatMesh.visible = false;
    chatMesh.name = "chatBillboard";
    playerGroup.add(chatMesh);
    
    return playerGroup;
}