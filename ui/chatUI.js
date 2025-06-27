export class ChatUI {
    constructor(dependencies) {
        this.playerControls = dependencies.playerControls;
        this.room = dependencies.room;
        this.multiplayerManager = dependencies.multiplayerManager;
    }

    create() {
        const gameContainer = document.getElementById('game-container');

        const chatInputContainer = document.createElement('div');
        chatInputContainer.id = 'chat-input-container';

        const chatLog = document.createElement('div');
        chatLog.id = 'chat-log';
        chatInputContainer.appendChild(chatLog);

        const chatInput = document.createElement('input');
        chatInput.id = 'chat-input';
        chatInput.type = 'text';
        chatInput.maxLength = 100;
        chatInput.placeholder = 'Type a message...';
        chatInputContainer.appendChild(chatInput);
        
        const closeChat = document.createElement('div');
        closeChat.id = 'close-chat';
        closeChat.innerHTML = '✕';
        chatInputContainer.appendChild(closeChat);
        gameContainer.appendChild(chatInputContainer);
        
        const chatButton = document.createElement('div');
        chatButton.id = 'chat-button';
        chatButton.innerText = 'CHAT';
        gameContainer.appendChild(chatButton);


        const openChatInput = () => {
            chatInputContainer.style.display = 'block';
            chatInput.focus();
            if (this.playerControls) this.playerControls.enabled = false;
        }

        const closeChatInput = () => {
            chatInputContainer.style.display = 'none';
            chatInput.value = '';
            if (this.playerControls) this.playerControls.enabled = true;
        }

        const sendChatMessage = () => {
            const message = chatInput.value.trim();
            if (message) {
                this.room.updatePresence({ chat: { message, timestamp: Date.now() } });
                if (this.multiplayerManager) {
                    this.multiplayerManager.displayChatMessage(this.room.clientId, message);
                }
                closeChatInput();
            }
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && chatInputContainer.style.display !== 'block') {
                e.preventDefault();
                openChatInput();
            } else if (e.key === 'Escape' && chatInputContainer.style.display === 'block') {
                closeChatInput();
            } else if (e.key === 'Enter' && chatInputContainer.style.display === 'block') {
                sendChatMessage();
            }
        });
        
        closeChat.addEventListener('click', closeChatInput);
        chatButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (chatInputContainer.style.display === 'block') closeChatInput();
            else openChatInput();
        });

        chatInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') sendChatMessage();
            else if (e.key === 'Escape') closeChatInput();
        });
    }
}

