export class InventoryUI {
    constructor(dependencies) {
        this.objectCreator = dependencies.objectCreator;
        this.inventoryManager = dependencies.inventoryManager;
        this.panel = null;
    }

    create() {
        const inventoryPanel = document.createElement('div');
        inventoryPanel.id = 'inventory-panel';
        inventoryPanel.classList.add('modal-container');
        inventoryPanel.innerHTML = `
            <h2>Inventory</h2>
            <div class="inventory-grid"></div>
            <button id="close-inventory-button">Close</button>
        `;
        document.getElementById('game-container').appendChild(inventoryPanel);
        this.panel = inventoryPanel;

        const objectGrid = this.panel.querySelector('.inventory-grid');
        if (this.objectCreator && this.objectCreator.objectLibrary) {
            this.objectCreator.objectLibrary.forEach(obj => {
                const itemEl = document.createElement('div');
                itemEl.className = 'inventory-item';
                itemEl.textContent = obj.name;
                itemEl.addEventListener('click', () => {
                    this.objectCreator.createObject(obj.name);
                    this.inventoryManager.toggle(); // Close inventory after creating an item
                });
                objectGrid.appendChild(itemEl);
            });
        }

        document.getElementById('close-inventory-button').addEventListener('click', () => {
            this.inventoryManager.toggle();
        });
    }

    toggle(visible) {
        if (this.panel) {
            this.panel.style.display = visible ? 'block' : 'none';
        }
    }
}