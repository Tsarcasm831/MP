import * as THREE from 'three';

export class LifespanExtender {
    constructor(scene, buildTool) {
        this.scene = scene;
        this.buildTool = buildTool;
        this.room = buildTool.room;
        this.enabled = false;
    }

    toggle() {
        this.enabled = !this.enabled;

        if (this.enabled) {
            this.showNotification("Lifespan Extender active. Click to extend object lifespans.", false);
        } else {
            this.hideNotification();
        }

        return this.enabled;
    }

    extendObjects(playerPosition, buildObjects) {
        const currentTime = Date.now();
        const extendedTime = currentTime + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
        const radius = 10;
        let extendedCount = 0;

        for (let i = 0; i < buildObjects.length; i++) {
            const object = buildObjects[i];
            const distance = playerPosition.distanceTo(object.position);

            if (distance <= radius) {
                object.userData.extendedUntil = extendedTime;
                extendedCount++;
                this.showExtensionEffect(object.position.clone());

                if (this.room && object.userData.id) {
                    const buildData = {
                        type: 'extend_lifespan',
                        objectId: object.userData.id,
                        extendedUntil: extendedTime
                    };

                    this.room.send(buildData);

                    if (this.room.roomState.buildObjects && this.room.roomState.buildObjects[object.userData.id]) {
                        const updatedBuildObjects = { ...(this.room.roomState.buildObjects) };
                        updatedBuildObjects[object.userData.id].extendedUntil = extendedTime;
                        this.room.updateRoomState({ buildObjects: updatedBuildObjects });
                    }
                }
            }
        }

        if (extendedCount > 0) {
            this.showNotification(`Extended lifespan of ${extendedCount} objects for 24 hours!`, true);
        } else {
            this.showNotification("No objects found within range to extend.", true);
        }
        setTimeout(() => this.hideNotification(), 3000);
    }

    receiveExtension(object, extensionData) {
        object.userData.extendedUntil = extensionData.extendedUntil;
        this.showExtensionEffect(object.position.clone());
    }

    showExtensionEffect(position) {
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 });
        const effect = new THREE.Mesh(geometry, material);
        effect.position.copy(position);
        this.scene.add(effect);

        const startTime = Date.now();
        const duration = 1000;

        const animateEffect = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            effect.scale.set(1 + progress * 2, 1 + progress * 2, 1 + progress * 2);
            effect.material.opacity = 0.7 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animateEffect);
            } else {
                this.scene.remove(effect);
            }
        };
        animateEffect();
    }

    showNotification(message, isComplete = false) {
        let notification = document.getElementById('lifespan-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'lifespan-notification';
            document.getElementById('game-container').appendChild(notification);
        }
        notification.innerHTML = `<div>${isComplete ? '' : '<div class="ai-loading-spinner"></div>'} ${message}</div>`;
        notification.style.display = 'block';
    }

    hideNotification() {
        const notification = document.getElementById('lifespan-notification');
        if (notification) {
            notification.style.display = 'none';
        }
    }
}