// client/js/messages.js
document.addEventListener('DOMContentLoaded', async () => {
    const conversationsList = document.getElementById('conversations-list');
    const chatWelcome = document.getElementById('chat-welcome');
    const chatArea = document.getElementById('chat-area');
    const chatHeader = document.getElementById('chat-header');
    const messagesDisplay = document.getElementById('messages-display');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const searchInput = document.getElementById('user-search-input');
    const searchResultsContainer = document.getElementById('search-results');
    const typingIndicator = document.getElementById('typing-indicator');
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.querySelector('emoji-picker');
    const attachBtn = document.getElementById('attach-btn');
    const imageUploadInput = document.getElementById('image-upload-input');

    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    let activeConversation = null;
    let loggedInUser = null;
    let searchTimeout;
    let typingTimeout;

    const socket = io("http://localhost:3000");

    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return;
    }

    const fetchLoggedInUser = async () => {
        try {
            // This is a public route, but we need the user's full details
            const response = await fetch(`http://localhost:3000/api/users/profile/${loggedInUserEmail}`);
            if (response.ok) {
                loggedInUser = await response.json();
                socket.emit("addUser", loggedInUser.user_id);
            } else {
                throw new Error('Could not fetch user profile');
            }
        } catch (error) {
            console.error(error);
            // If the profile can't be fetched, logout
            localStorage.clear();
            window.location.href = 'login.html';
        }
    };
    
    // ... rest of the file is large, so I'll provide it in full.
    
    socket.on("connect", () => {
        console.log("Connected to WebSocket server.");
    });

    socket.on("getMessage", (data) => {
        if (activeConversation && data.conversation_id === activeConversation.id) {
            appendMessage(data, false);
            messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
        }
    });

    socket.on("getTyping", ({ isTyping }) => {
        if (activeConversation && isTyping) {
            typingIndicator.textContent = `${activeConversation.receiverName} is typing...`;
        } else {
            typingIndicator.textContent = '';
        }
    });

    const loadConversations = async () => {
        try {
            const conversations = await window.api.get('/users/conversations');
            conversationsList.innerHTML = '';
            if (conversations.length > 0) {
                conversations.forEach(conv => {
                    const convElement = document.createElement('div');
                    convElement.className = 'conversation-item';
                    convElement.dataset.id = conv.conversation_id;
                    convElement.dataset.receiverEmail = conv.other_user_email;
                    convElement.dataset.receiverId = conv.user_id;
                    convElement.dataset.receiverName = conv.full_name;
                    convElement.innerHTML = `
                        <img src="${conv.profile_pic_url ? `http://localhost:3000/${conv.profile_pic_url}` : createInitialsAvatar(conv.full_name)}" alt="${conv.full_name}" onerror="this.onerror=null; this.src=createInitialsAvatar('${conv.full_name.replace(/'/g, "\\'")}');">
                        <div class="conv-details">
                            <h4>${conv.full_name}</h4>
                            <p>${sanitizeHTML(conv.last_message) || 'No messages yet'}</p>
                        </div>
                    `;
                    conversationsList.appendChild(convElement);
                });
            } else {
                conversationsList.innerHTML = '<p class="info-message">You have no conversations.</p>';
            }
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    };
    
    const appendMessage = (msg, isSentByMe) => {
        const messageElement = document.createElement('div');
        messageElement.className = `message-bubble ${isSentByMe ? 'sent' : 'received'}`;
    
        let messageContent;
        if (msg.message_type === 'image') {
            messageContent = `<img src="http://localhost:3000/${sanitizeHTML(msg.content)}" alt="Chat Image" class="chat-image">`;
        } else {
            messageContent = `<p class="message-content">${sanitizeHTML(msg.content)}</p>`;
        }
    
        messageElement.innerHTML = `
            ${messageContent}
            <span class="message-timestamp">${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        `;
        messagesDisplay.appendChild(messageElement);
    };

    const loadMessages = async (conversationId) => {
        try {
            const messages = await window.api.get(`/messages/conversations/${conversationId}/messages`);
            messagesDisplay.innerHTML = '';
            messages.forEach(msg => {
                appendMessage(msg, msg.sender_id === loggedInUser.user_id);
            });
            messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const startConversation = async (receiverEmail) => {
        if (receiverEmail === loggedInUserEmail) {
            showToast("You cannot start a conversation with yourself.", "error");
            return;
        }
        try {
            await window.api.post('/messages', { receiver_email: receiverEmail, content: 'Hello!' });
            await loadConversations();
            const newConvElement = conversationsList.querySelector(`[data-receiver-email="${receiverEmail}"]`);
            if (newConvElement) {
                newConvElement.click();
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            showToast('Could not start conversation.', 'error');
        }
    };

    const handleImageUpload = async (file) => {
        if (!activeConversation) {
            showToast('Please select a conversation before sending an image.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('chat_image', file);

        try {
            const tempId = `temp_${Date.now()}`;
            const loadingBubble = `<div class="message-bubble sent" id="${tempId}"><div class="loading-spinner small"><div class="spinner"></div></div><span class="message-timestamp">Sending...</span></div>`;
            messagesDisplay.innerHTML += loadingBubble;
            messagesDisplay.scrollTop = messagesDisplay.scrollHeight;

            const response = await window.api.postForm('/messages/upload-image', formData);
            if (!response.ok) {
                throw new Error('Image upload failed.');
            }
            const result = await response.json();
            const imageUrl = result.imageUrl;

            const messageData = {
                senderId: loggedInUser.user_id,
                receiverId: activeConversation.receiverId,
                content: imageUrl,
                conversationId: activeConversation.id,
                messageType: 'image'
            };

            socket.emit("sendMessage", messageData);

            await window.api.post('/messages', {
                receiver_email: activeConversation.receiverEmail,
                content: imageUrl,
                message_type: 'image'
            });

            document.getElementById(tempId).remove();
            appendMessage({ content: imageUrl, created_at: new Date().toISOString(), message_type: 'image' }, true);
            messagesDisplay.scrollTop = messagesDisplay.scrollHeight;

        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Failed to send image. Please try again.', 'error');
            const tempBubble = document.getElementById(tempId);
            if(tempBubble) tempBubble.remove();
        }
    };

    conversationsList.addEventListener('click', (e) => {
        const conversationItem = e.target.closest('.conversation-item');
        if (conversationItem) {
            activeConversation = {
                id: parseInt(conversationItem.dataset.id),
                receiverEmail: conversationItem.dataset.receiverEmail,
                receiverId: parseInt(conversationItem.dataset.receiverId),
                receiverName: conversationItem.dataset.receiverName,
            };
            document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
            conversationItem.classList.add('active');
            chatWelcome.style.display = 'none';
            chatArea.style.display = 'flex';
            chatHeader.innerHTML = `<div class="chat-header-info"><h3>Chat with ${activeConversation.receiverName}</h3><span class="online-status" id="online-status-indicator">Offline</span></div>`;
            socket.on("getUsers", users => {
                 const isOnline = users.some(u => u.userId === activeConversation.receiverId);
                 const statusIndicator = document.getElementById('online-status-indicator');
                 if(statusIndicator) {
                     statusIndicator.textContent = isOnline ? 'Online' : 'Offline';
                     statusIndicator.className = isOnline ? 'online-status online' : 'online-status';
                 }
            });
            loadMessages(activeConversation.id);
        }
    });

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = messageInput.value.trim();
        if (!content || !activeConversation) return;
        
        const messageData = {
            senderId: loggedInUser.user_id,
            receiverId: activeConversation.receiverId,
            content: content,
            conversationId: activeConversation.id,
            messageType: 'text'
        };
        
        socket.emit("sendMessage", messageData);
        
        await window.api.post('/messages', {
            receiver_email: activeConversation.receiverEmail,
            content: content,
            message_type: 'text'
        });

        appendMessage({ content, created_at: new Date().toISOString(), message_type: 'text' }, true);
        messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
        messageInput.value = '';
    });

    messageInput.addEventListener('input', () => {
        if (!activeConversation) return;
        socket.emit("typing", { receiverId: activeConversation.receiverId, isTyping: true });
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit("typing", { receiverId: activeConversation.receiverId, isTyping: false });
        }, 2000);
    });

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();
        
        if (query.length < 2) {
            searchResultsContainer.innerHTML = '';
            searchResultsContainer.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(async () => {
            try {
                const users = await window.api.get(`/users/directory?query=${encodeURIComponent(query)}`);
                searchResultsContainer.innerHTML = '';
                if (users.length > 0) {
                    users.forEach(user => {
                        if (user.email === loggedInUserEmail) return; 
                        const userElement = document.createElement('div');
                        userElement.className = 'search-result-item';
                        userElement.dataset.email = user.email;
                        userElement.innerHTML = `
                            <img src="${user.profile_pic_url ? `http://localhost:3000/${user.profile_pic_url}` : createInitialsAvatar(user.full_name)}" alt="${user.full_name}">
                            <span>${user.full_name}</span>
                        `;
                        searchResultsContainer.appendChild(userElement);
                    });
                    searchResultsContainer.style.display = 'block';
                } else {
                    searchResultsContainer.innerHTML = '<div class="info-message" style="padding: 1rem;">No users found.</div>';
                    searchResultsContainer.style.display = 'block';
                }
            } catch (error) {
                console.error('Error searching users:', error);
            }
        }, 300);
    });

    searchResultsContainer.addEventListener('click', (e) => {
        const userItem = e.target.closest('.search-result-item');
        if (userItem) {
            const receiverEmail = userItem.dataset.email;
            startConversation(receiverEmail);
            searchInput.value = '';
            searchResultsContainer.style.display = 'none';
        }
    });

    emojiBtn.addEventListener('click', () => {
        emojiPicker.classList.toggle('visible');
    });

    emojiPicker.addEventListener('emoji-click', event => {
        messageInput.value += event.detail.unicode;
        emojiPicker.classList.remove('visible');
    });

    if (attachBtn) {
        attachBtn.addEventListener('click', () => {
            imageUploadInput.click();
        });
    }

    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file);
            }
            e.target.value = null; 
        });
    }

    const initialize = async () => {
        await fetchLoggedInUser();
        await loadConversations();
    };
    
    initialize();
});