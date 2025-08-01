// AI Chatbot functionality for LibroLink
class AIChatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createChatButton();
        this.createChatModal();
        this.bindEvents();
        this.addWelcomeMessage();
    }

    createChatButton() {
        const chatBtn = document.createElement('button');
        chatBtn.className = 'ai-chat-btn';
        chatBtn.innerHTML = '<i class="fas fa-robot"></i>';
        chatBtn.title = 'AI Assistant';
        chatBtn.id = 'aiChatBtn';
        document.body.appendChild(chatBtn);
    }

    createChatModal() {
        const modal = document.createElement('div');
        modal.className = 'ai-chat-modal';
        modal.id = 'aiChatModal';
        
        modal.innerHTML = `
            <div class="ai-chat-container">
                <div class="ai-chat-header">
                    <h3>
                        <i class="fas fa-robot"></i>
                        LibroLink AI Assistant
                    </h3>
                    <button class="ai-chat-close" id="aiChatClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="ai-chat-messages" id="aiChatMessages">
                    <!-- Messages will be added here -->
                </div>
                
                <div class="ai-chat-typing" id="aiChatTyping">
                    <div class="ai-chat-typing-dots">
                        <div class="ai-chat-typing-dot"></div>
                        <div class="ai-chat-typing-dot"></div>
                        <div class="ai-chat-typing-dot"></div>
                    </div>
                </div>
                
                <div class="ai-chat-input">
                    <div class="ai-chat-input-container">
                        <input type="text" id="aiChatInput" placeholder="Ask me anything about books...">
                        <button class="ai-chat-send-btn" id="aiChatSend">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    bindEvents() {
        // Open chat
        document.getElementById('aiChatBtn').addEventListener('click', () => {
            this.openChat();
        });

        // Close chat
        document.getElementById('aiChatClose').addEventListener('click', () => {
            this.closeChat();
        });

        // Send message
        document.getElementById('aiChatSend').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        document.getElementById('aiChatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Close on outside click
        document.getElementById('aiChatModal').addEventListener('click', (e) => {
            if (e.target.id === 'aiChatModal') {
                this.closeChat();
            }
        });
    }

    addWelcomeMessage() {
        const welcomeMessage = {
            type: 'bot',
            content: "Hello! I'm your LibroLink AI assistant. I can help you find books, answer questions, and provide recommendations. How can I assist you today?"
        };
        
        this.addQuickActions();
        this.addMessage(welcomeMessage);
    }

    addQuickActions() {
        const quickActions = [
            { text: '📚 Fiction', message: 'Recommend me some fiction books' },
            { text: '🔍 Mystery', message: 'Show me mystery books' },
            { text: '👤 Account Help', message: 'I need help with my account' },
            { text: '⭐ Best Sellers', message: 'What are the best sellers?' }
        ];

        const actionsHtml = quickActions.map(action => 
            `<div class="ai-chat-quick-action" data-message="${action.message}">${action.text}</div>`
        ).join('');

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'ai-chat-quick-actions';
        actionsDiv.innerHTML = actionsHtml;
        
        // Add click events to quick actions
        actionsDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('ai-chat-quick-action')) {
                const message = e.target.getAttribute('data-message');
                document.getElementById('aiChatInput').value = message;
                this.sendMessage();
            }
        });

        document.getElementById('aiChatMessages').appendChild(actionsDiv);
    }

    openChat() {
        this.isOpen = true;
        document.getElementById('aiChatModal').classList.add('active');
        document.getElementById('aiChatInput').focus();
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById('aiChatModal').classList.remove('active');
    }

    async sendMessage() {
        const input = document.getElementById('aiChatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message
        this.addMessage({
            type: 'user',
            content: message
        });

        input.value = '';
        this.showTyping();

        try {
            const response = await fetch('/api/ai/chatbot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            this.hideTyping();

            if (data.success) {
                const aiResponse = data.response;
                
                if (aiResponse.type === 'recommendation' && aiResponse.recommendations) {
                    // Display recommendations
                    this.addMessage({
                        type: 'bot',
                        content: aiResponse.message,
                        recommendations: aiResponse.recommendations
                    });
                } else {
                    this.addMessage({
                        type: 'bot',
                        content: aiResponse.message
                    });
                }
            } else {
                this.addMessage({
                    type: 'bot',
                    content: 'Sorry, I encountered an error. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            this.hideTyping();
            this.addMessage({
                type: 'bot',
                content: 'Sorry, I\'m having trouble connecting. Please check your internet connection.'
            });
        }
    }

    addMessage(messageData) {
        const messagesContainer = document.getElementById('aiChatMessages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-chat-message ${messageData.type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'ai-chat-message-avatar';
        avatar.textContent = messageData.type === 'user' ? 'You' : 'AI';
        
        const content = document.createElement('div');
        content.className = 'ai-chat-message-content';
        
        if (messageData.recommendations) {
            // Handle recommendations
            let recommendationsHtml = '<div style="margin-bottom: 10px;">' + messageData.content + '</div>';
            
            messageData.recommendations.forEach((book, index) => {
                recommendationsHtml += `
                    <div class="ai-chat-recommendation-item" onclick="aiChatbot.viewBook('${book._id}')">
                        <div class="ai-chat-recommendation-title">${book.title}</div>
                        <div class="ai-chat-recommendation-details">
                            by ${book.author} • ${book.category} • ₹${book.price}
                        </div>
                    </div>
                `;
            });
            
            content.innerHTML = recommendationsHtml;
        } else {
            content.textContent = messageData.content;
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping() {
        document.getElementById('aiChatTyping').classList.add('active');
        document.getElementById('aiChatMessages').scrollTop = document.getElementById('aiChatMessages').scrollHeight;
    }

    hideTyping() {
        document.getElementById('aiChatTyping').classList.remove('active');
    }

    viewBook(bookId) {
        // Navigate to book details page
        window.open(`/book-details.html?id=${bookId}`, '_blank');
    }
}

// Initialize AI Chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiChatbot = new AIChatbot();
}); 