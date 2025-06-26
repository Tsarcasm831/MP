export class InventoryManager {
    constructor(dependencies) {
        this.playerControls = dependencies.playerControls;
        this.inventoryUI = null; // Will be set after UIManager initializes it
        this.isOpen = false;
    }

    init() {
        window.addEventListener('keydown', (e) => {
            // Do not toggle if user is typing in an input
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;
            }
            if (e.key.toLowerCase() === 'i') {
                this.toggle();
            }
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.inventoryUI) {
            this.inventoryUI.toggle(this.isOpen);
        }
        if (this.playerControls) {
            this.playerControls.enabled = !this.isOpen;
        }
    }
}