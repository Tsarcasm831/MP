export class ChangelogUI {
    create() {
        const gameContainer = document.getElementById('game-container');
        const changelogButton = document.createElement('div');
        changelogButton.id = 'changelog-button';
        changelogButton.innerText = 'CHANGELOG';
        gameContainer.appendChild(changelogButton);

        changelogButton.addEventListener('click', () => {
            window.open('CHANGELOG.md', '_blank');
        });
    }
}
