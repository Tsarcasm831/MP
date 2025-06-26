import { BuildUI } from '../ui/buildUI.js';
import { AdvancedBuildUI } from '../ui/advancedBuildUI.js';
import { ChatUI } from '../ui/chatUI.js';
import { ChangelogUI } from '../ui/changelogUI.js';
import { CharacterCreatorUI } from '../ui/characterCreatorUI.js';
import { AdModal } from '../ui/adModal.js';
import { InventoryUI } from '../ui/inventoryUI.js';
import { MapUI } from '../ui/mapUI.js';
import { OptionsUI } from '../ui/optionsUI.js';

export class UIManager {
    constructor(dependencies) {
        this.dependencies = dependencies;
        this.inventoryUI = null;
        this.mapUI = null;
    }

    init() {
        new BuildUI(this.dependencies).create();
        new AdvancedBuildUI(this.dependencies).create();
        new ChangelogUI(this.dependencies).create();
        new ChatUI(this.dependencies).create();
        new CharacterCreatorUI(this.dependencies).create();
        new OptionsUI(this.dependencies).create();
        new AdModal(this.dependencies).setup();

        this.inventoryUI = new InventoryUI(this.dependencies);
        this.inventoryUI.create();
        
        this.mapUI = new MapUI(this.dependencies);
        this.mapUI.create();
        // This subscription is to ensure the map updates when the character collection changes
        this.dependencies.characterCreator.characterCollection.subscribe(() => {
            if (this.mapUI.isOpen) this.mapUI.update();
        });

        return { inventoryUI: this.inventoryUI, mapUI: this.mapUI };
    }

    // removed function createBuildUI() {}
    // removed function createAIBuildUI() {}
    // removed function createAdvancedBuildUI() {}
    // removed function createChatUI() {}
    // removed function createCharacterCreatorUI() {}
    // removed function setupAdModal() {}
}