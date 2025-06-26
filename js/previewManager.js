import * as THREE from 'three';

export class PreviewManager {
    constructor(scene, camera, buildMaterials, terrain) {
        this.scene = scene;
        this.camera = camera;
        this.buildMaterials = buildMaterials;
        this.terrain = terrain;

        this.previewMesh = null;
        this.currentMaterialIndex = 0;
        this.currentHeight = 0.5;

        this.shapes = [
            { geometry: new THREE.BoxGeometry(1, 1, 1), name: 'BoxGeometry' },
            { geometry: new THREE.SphereGeometry(0.5, 16, 16), name: 'SphereGeometry' },
            { geometry: new THREE.CylinderGeometry(0.5, 0.5, 1, 16), name: 'CylinderGeometry' },
            { geometry: new THREE.ConeGeometry(0.5, 1, 16), name: 'ConeGeometry' },
            { geometry: new THREE.TorusGeometry(0.5, 0.2, 16, 32), name: 'TorusGeometry' },
            { geometry: new THREE.ConeGeometry(0.5, 1, 4), name: 'Pyramid' }
        ];
        this.currentShapeIndex = 0;

        this.raycaster = new THREE.Raycaster();
        this.mousePosition = new THREE.Vector2();

        this.createPreviewMesh();
    }

    createPreviewMesh() {
        if (this.previewMesh) {
            this.scene.remove(this.previewMesh);
        }
        const geometry = this.shapes[this.currentShapeIndex].geometry.clone();
        const material = this.buildMaterials[this.currentMaterialIndex].clone();
        material.transparent = true;
        material.opacity = 0.5;

        this.previewMesh = new THREE.Mesh(geometry, material);
        this.previewMesh.castShadow = false;
        this.previewMesh.receiveShadow = false;
        this.previewMesh.userData.heightAdjusted = false;
        this.previewMesh.userData.shapeName = this.shapes[this.currentShapeIndex].name;
        this.scene.add(this.previewMesh);
    }

    updatePosition(mousePosition, buildObjects) {
        if (!this.previewMesh) return;

        this.mousePosition.copy(mousePosition);
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
        const intersects = this.raycaster.intersectObjects([...this.scene.children], true);

        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object === this.previewMesh || buildObjects.includes(intersects[i].object)) {
                continue;
            }

            const point = intersects[i].point;

            const gridSize = 1;
            point.x = Math.round(point.x / gridSize) * gridSize;
            point.z = Math.round(point.z / gridSize) * gridSize;

            if (!this.previewMesh.userData.heightAdjusted) {
                const terrainHeight = this.terrain ? this.terrain.userData.getHeight(point.x, point.z) : 0;
                point.y = terrainHeight + this.currentHeight;
                if (point.y < terrainHeight + 0.5) point.y = terrainHeight + 0.5;
            } else {
                this.previewMesh.position.x = point.x;
                this.previewMesh.position.z = point.z;
                return;
            }

            this.previewMesh.position.copy(point);
            break;
        }
    }

    changeShape() {
        if (!this.previewMesh) return;
        this.scene.remove(this.previewMesh);

        this.currentShapeIndex = (this.currentShapeIndex + 1) % this.shapes.length;

        const geometry = this.shapes[this.currentShapeIndex].geometry.clone();
        const material = this.buildMaterials[this.currentMaterialIndex].clone();
        material.transparent = true;
        material.opacity = 0.5;
        this.previewMesh = new THREE.Mesh(geometry, material);
        this.previewMesh.castShadow = false;
        this.previewMesh.receiveShadow = false;
        this.previewMesh.userData.shapeName = this.shapes[this.currentShapeIndex].name;
        this.scene.add(this.previewMesh);
    }

    changeMaterial() {
        if (!this.previewMesh) return;
        this.currentMaterialIndex = (this.currentMaterialIndex + 1) % this.buildMaterials.length;
        const material = this.buildMaterials[this.currentMaterialIndex].clone();
        material.transparent = true;
        material.opacity = 0.5;
        this.previewMesh.material = material;
    }

    changeSize() {
        if (!this.previewMesh) return;
        const scales = [
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(0.5, 0.5, 0.5),
            new THREE.Vector3(2, 2, 2),
            new THREE.Vector3(1, 2, 1),
            new THREE.Vector3(2, 1, 1),
            new THREE.Vector3(1, 1, 2)
        ];
        let nextScaleIndex = 0;
        for (let i = 0; i < scales.length; i++) {
            if (this.previewMesh.scale.equals(scales[i])) {
                nextScaleIndex = (i + 1) % scales.length;
                break;
            }
        }
        this.previewMesh.scale.copy(scales[nextScaleIndex]);
    }

    rotate() {
        if (!this.previewMesh) return;
        this.previewMesh.rotation.y += Math.PI / 2;
    }
    
    adjustHeight(delta) {
        if (!this.previewMesh) return;
        this.previewMesh.position.y += delta;
        const terrainHeight = this.terrain ? this.terrain.userData.getHeight(this.previewMesh.position.x, this.previewMesh.position.z) : 0;
        if (this.previewMesh.position.y < terrainHeight + 0.5) this.previewMesh.position.y = terrainHeight + 0.5;
        this.previewMesh.userData.heightAdjusted = true;
        return this.previewMesh.position.y;
    }

    setCurrentHeight(height) {
        this.currentHeight = height;
        if (this.previewMesh) {
            const terrainHeight = this.terrain ? this.terrain.userData.getHeight(this.previewMesh.position.x, this.previewMesh.position.z) : 0;
            this.previewMesh.position.y = terrainHeight + this.currentHeight;
            this.previewMesh.userData.heightAdjusted = false;
        }
    }

    getMesh() {
        return this.previewMesh;
    }

    show() {
        if (this.previewMesh) this.previewMesh.visible = true;
    }

    hide() {
        if (this.previewMesh) this.previewMesh.visible = false;
    }
    
    getCurrentMaterialIndex() {
        return this.currentMaterialIndex;
    }
}