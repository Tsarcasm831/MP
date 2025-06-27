export class ChangelogUI {
    create() {
        const gameContainer = document.getElementById('game-container');
        const changelogButton = document.createElement('div');
        changelogButton.id = 'changelog-button';
        changelogButton.classList.add('circle-button');
        changelogButton.innerText = 'CHANGELOG';
        gameContainer.appendChild(changelogButton);

        const changelogModal = document.createElement('div');
        changelogModal.id = 'changelog-modal';
        changelogModal.innerHTML = `
            <div id="close-changelog">✕</div>
            <pre id="changelog-content"></pre>
        `;
        gameContainer.appendChild(changelogModal);

        changelogButton.addEventListener('click', async () => {
            changelogModal.style.display = 'block';
            const contentEl = changelogModal.querySelector('#changelog-content');
            try {
                const text = await fetch('CHANGELOG.md').then(r => r.text());
                contentEl.textContent = text;
            } catch (e) {
                contentEl.textContent = 'Failed to load changelog.';
            }
        });

        changelogModal.querySelector('#close-changelog').addEventListener('click', () => {
            changelogModal.style.display = 'none';
        });
    }
}
