import * as THREE from 'three';

export class ObjectCreator {
    constructor(scene, camera, room, buildTool) {
        this.scene = scene;
        this.camera = camera;
        this.room = room;
        this.buildTool = buildTool;

        this.objectLibrary = [
            { name: 'Box', geometry: 'BoxGeometry', params: [1, 1, 1] },
            { name: 'Sphere', geometry: 'SphereGeometry', params: [0.5, 16, 16] },
            { name: 'Cylinder', geometry: 'CylinderGeometry', params: [0.5, 0.5, 1, 16] },
            { name: 'Cone', geometry: 'ConeGeometry', params: [0.5, 1, 16] },
            { name: 'Torus', geometry: 'TorusGeometry', params: [0.5, 0.2, 16, 32] },
            { name: 'Pyramid', geometry: 'ConeGeometry', params: [0.5, 1, 4] }
        ];
    }

    createObject(objectType) {
        const objectDef = this.objectLibrary.find(obj => obj.name === objectType);
        if (!objectDef) return null;

        const geometry = new THREE[objectDef.geometry](...objectDef.params);
        const materialIndex = this.buildTool.currentMaterialIndex;
        const material = this.buildTool.buildMaterials[materialIndex].clone();
        const mesh = new THREE.Mesh(geometry, material);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isBarrier = true;

        const distance = 5;
        const vector = new THREE.Vector3(0, 0, -distance);
        vector.applyQuaternion(this.camera.quaternion);
        vector.add(this.camera.position);
        mesh.position.copy(vector);

        const objectId = 'adv_build_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        mesh.userData.id = objectId;
        mesh.userData.createdAt = Date.now();
        this.scene.add(mesh);
        
        this.syncObjectWithRoom(mesh, true);
        return mesh;
    }

    duplicateObject(objectToDuplicate) {
        const geometry = objectToDuplicate.geometry.clone();
        const material = objectToDuplicate.material.clone();
        const duplicatedObject = new THREE.Mesh(geometry, material);

        duplicatedObject.position.copy(objectToDuplicate.position).add(new THREE.Vector3(0.5, 0, 0.5));
        duplicatedObject.rotation.copy(objectToDuplicate.rotation);
        duplicatedObject.scale.copy(objectToDuplicate.scale);

        duplicatedObject.castShadow = true;
        duplicatedObject.receiveShadow = true;
        duplicatedObject.userData.isBarrier = true;

        const objectId = 'adv_build_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        duplicatedObject.userData.id = objectId;
        duplicatedObject.userData.createdAt = Date.now();
        
        this.scene.add(duplicatedObject);
        this.syncObjectWithRoom(duplicatedObject, true);

        return duplicatedObject;
    }

    createFromData(buildData) {
        let geometry;
        switch (buildData.geometryType) {
            case 'BoxGeometry': geometry = new THREE.BoxGeometry(1, 1, 1); break;
            case 'SphereGeometry': geometry = new THREE.SphereGeometry(0.5, 16, 16); break;
            case 'CylinderGeometry': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16); break;
            case 'ConeGeometry': geometry = new THREE.ConeGeometry(0.5, 1, 16); break;
            case 'TorusGeometry': geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32); break;
            default: geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        const materialIndex = Math.min(buildData.materialIndex || 0, this.buildTool.buildMaterials.length - 1);
        const material = this.buildTool.buildMaterials[materialIndex].clone();
        
        if (buildData.color) {
            material.color.setRGB(buildData.color.r, buildData.color.g, buildData.color.b);
        }

        const buildObject = new THREE.Mesh(geometry, material);
        buildObject.position.set(buildData.position.x, buildData.position.y, buildData.position.z);
        buildObject.scale.set(buildData.scale.x, buildData.scale.y, buildData.scale.z);
        buildObject.rotation.set(buildData.rotation.x, buildData.rotation.y, buildData.rotation.z);
        
        buildObject.castShadow = true;
        buildObject.receiveShadow = true;
        buildObject.userData.isBarrier = true;
        buildObject.userData.id = buildData.objectId;
        buildObject.userData.createdAt = buildData.createdAt || Date.now();
        if(buildData.extendedUntil) buildObject.userData.extendedUntil = buildData.extendedUntil;

        return buildObject;
    }

    syncObjectWithRoom(object, isNew = false) {
        if (!this.room) return;

        const buildData = {
            objectId: object.userData.id,
            position: { x: object.position.x, y: object.position.y, z: object.position.z },
            scale: { x: object.scale.x, y: object.scale.y, z: object.scale.z },
            rotation: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z },
            materialIndex: this.buildTool.buildMaterials.findIndex(m => m.color.equals(object.material.color)),
            color: { r: object.material.color.r, g: object.material.color.g, b: object.material.color.b },
            geometryType: object.geometry.type,
            createdAt: object.userData.createdAt,
            isAdvanced: true
        };
        
        if(isNew) {
            this.room.send({ type: 'build_object', ...buildData });
        }

        const updatedBuildObjects = { ...(this.room.roomState.buildObjects || {}) };
        updatedBuildObjects[object.userData.id] = buildData;
        this.room.updateRoomState({ buildObjects: updatedBuildObjects });
    }
}