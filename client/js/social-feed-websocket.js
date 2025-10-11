/**
 * Social Feed WebSocket Client - Phase 2
 * Real-time features for reactions, viewers, typing indicators
 */

class SocialFeedWebSocket {
    constructor() {
        this.socket = null;
        this.currentThreadId = null;
        this.currentUserId = null;
        this.currentUserName = null;
        this.isConnected = false;
        this.viewingThreads = new Set();
    }

    /**
     * Initialize WebSocket connection
     */
    connect() {
        if (this.socket && this.socket.connected) {
            console.log('WebSocket already connected');
            return;
        }

        // Connect to Socket.IO server
        this.socket = io('http://localhost:3000', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.onConnected();
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            this.isConnected = false;
            this.viewingThreads.clear();
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });

        this.setupEventListeners();
    }

    /**
     * Setup event listeners for real-time updates
     */
    setupEventListeners() {
        // Live viewer updates
        this.socket.on('thread:viewer-update', (data) => {
            this.handleViewerUpdate(data);
        });

        // Typing indicators
        this.socket.on('thread:user-typing', (data) => {
            this.handleUserTyping(data);
        });

        this.socket.on('thread:typing-update', (data) => {
            this.handleTypingUpdate(data);
        });

        // Real-time reactions
        this.socket.on('thread:reaction-update', (data) => {
            this.handleReactionUpdate(data);
        });

        // Real-time comments
        this.socket.on('thread:new-comment', (data) => {
            this.handleNewComment(data);
        });

        // Milestone celebrations
        this.socket.on('feed:milestone-celebration', (data) => {
            this.handleMilestoneCelebration(data);
        });
    }

    /**
     * Set current user information
     */
    setUser(userId, userName) {
        this.currentUserId = userId;
        this.currentUserName = userName;
    }

    /**
     * Start viewing a thread
     */
    startViewingThread(threadId) {
        if (!this.isConnected || !this.currentUserId) {
            console.warn('Cannot start viewing: Not connected or no user set');
            return;
        }

        if (this.viewingThreads.has(threadId)) {
            return; // Already viewing
        }

        this.currentThreadId = threadId;
        this.viewingThreads.add(threadId);

        this.socket.emit('thread:viewing', {
            threadId,
            userId: this.currentUserId,
            userName: this.currentUserName
        });

        console.log(`Started viewing thread ${threadId}`);
    }

    /**
     * Stop viewing a thread
     */
    stopViewingThread(threadId) {
        if (!this.isConnected || !this.viewingThreads.has(threadId)) {
            return;
        }

        this.socket.emit('thread:leave', {
            threadId,
            userId: this.currentUserId
        });

        this.viewingThreads.delete(threadId);

        if (this.currentThreadId === threadId) {
            this.currentThreadId = null;
        }

        console.log(`Stopped viewing thread ${threadId}`);
    }

    /**
     * Signal that user is typing a comment
     */
    startTyping(threadId) {
        if (!this.isConnected || !this.currentUserId) return;

        this.socket.emit('thread:typing-start', {
            threadId,
            userId: this.currentUserId,
            userName: this.currentUserName
        });
    }

    /**
     * Signal that user stopped typing
     */
    stopTyping(threadId) {
        if (!this.isConnected || !this.currentUserId) return;

        this.socket.emit('thread:typing-stop', {
            threadId,
            userId: this.currentUserId
        });
    }

    /**
     * Broadcast that a reaction was added
     */
    broadcastReaction(threadId, reactionType, totalReactions, counts) {
        if (!this.isConnected) return;

        this.socket.emit('thread:reaction-added', {
            threadId,
            userId: this.currentUserId,
            userName: this.currentUserName,
            reactionType,
            totalReactions,
            counts
        });
    }

    /**
     * Broadcast that a comment was added
     */
    broadcastComment(threadId, comment) {
        if (!this.isConnected) return;

        this.socket.emit('thread:comment-added', {
            threadId,
            comment
        });
    }

    /**
     * Broadcast milestone detection
     */
    broadcastMilestone(threadId, milestoneType) {
        if (!this.isConnected) return;

        this.socket.emit('thread:milestone-detected', {
            threadId,
            userId: this.currentUserId,
            userName: this.currentUserName,
            milestoneType
        });
    }

    /**
     * Handle viewer count update
     */
    handleViewerUpdate(data) {
        const { threadId, viewerCount } = data;

        // Update viewer badge in UI
        const viewerBadge = document.querySelector(`[data-thread-id="${threadId}"] .live-viewers .viewer-count`);
        if (viewerBadge) {
            viewerBadge.textContent = viewerCount;
            
            // Show/hide badge based on count
            const badge = viewerBadge.closest('.live-viewers');
            if (badge) {
                badge.style.opacity = viewerCount > 0 ? '1' : '0.5';
            }
        }

        console.log(`Thread ${threadId} viewers: ${viewerCount}`);
    }

    /**
     * Handle user typing notification
     */
    handleUserTyping(data) {
        const { threadId, userName, typingCount } = data;

        // Show typing indicator
        const indicator = document.querySelector(`[data-thread-id="${threadId}"] .typing-indicator`);
        if (indicator) {
            indicator.style.display = 'flex';
            const text = indicator.querySelector('.typing-text');
            if (text) {
                if (typingCount === 1) {
                    text.textContent = `${userName} is typing...`;
                } else {
                    text.textContent = `${typingCount} people are typing...`;
                }
            }
        }
    }

    /**
     * Handle typing update (count changed or stopped)
     */
    handleTypingUpdate(data) {
        const { threadId, typingCount } = data;

        const indicator = document.querySelector(`[data-thread-id="${threadId}"] .typing-indicator`);
        if (indicator) {
            if (typingCount === 0) {
                indicator.style.display = 'none';
            } else {
                const text = indicator.querySelector('.typing-text');
                if (text) {
                    text.textContent = `${typingCount} ${typingCount === 1 ? 'person' : 'people'} typing...`;
                }
            }
        }
    }

    /**
     * Handle real-time reaction update
     */
    handleReactionUpdate(data) {
        const { threadId, reactionType, totalReactions, counts, action } = data;

        // Update reaction counts in UI
        const threadCard = document.querySelector(`[data-thread-id="${threadId}"]`);
        if (!threadCard) return;

        // Update total reactions
        const totalBadge = threadCard.querySelector('.reaction-count');
        if (totalBadge) {
            totalBadge.textContent = totalReactions;
        }

        // Update individual reaction counts
        Object.keys(counts).forEach(type => {
            const badge = threadCard.querySelector(`[data-reaction="${type}"] .count`);
            if (badge) {
                badge.textContent = counts[type];
            }
        });

        // Show animation if it's from another user
        if (action === 'added' && data.userId !== this.currentUserId) {
            this.showReactionAnimation(threadCard, reactionType);
        }
    }

    /**
     * Show reaction animation
     */
    showReactionAnimation(element, reactionType) {
        const emojis = {
            'like': '👍',
            'love': '❤️',
            'insightful': '💡',
            'celebrate': '🎉',
            'support': '🤝',
            'funny': '😄'
        };

        const particle = document.createElement('div');
        particle.className = 'reaction-notification';
        particle.textContent = emojis[reactionType] || '👍';
        particle.style.cssText = `
            position: absolute;
            font-size: 24px;
            animation: floatUp 2s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
        `;

        element.style.position = 'relative';
        element.appendChild(particle);

        setTimeout(() => particle.remove(), 2000);
    }

    /**
     * Handle new comment notification
     */
    handleNewComment(data) {
        const { threadId, comment } = data;

        // If we're viewing this thread, add the comment to the UI
        if (this.currentThreadId === threadId) {
            this.addCommentToUI(comment);
        }

        // Update comment count
        const countBadge = document.querySelector(`[data-thread-id="${threadId}"] .comment-count`);
        if (countBadge) {
            const currentCount = parseInt(countBadge.textContent) || 0;
            countBadge.textContent = currentCount + 1;
        }
    }

    /**
     * Add comment to UI (for thread detail page)
     */
    addCommentToUI(comment) {
        const commentsList = document.querySelector('.comments-list');
        if (!commentsList) return;

        const commentHTML = `
            <div class="comment-card" data-comment-id="${comment.comment_id}">
                <img src="${comment.user_avatar || '/images/default-avatar.png'}" alt="${comment.user_name}">
                <div class="comment-content">
                    <div class="comment-header">
                        <strong>${comment.user_name}</strong>
                        <span class="comment-time">Just now</span>
                    </div>
                    <p>${comment.content}</p>
                </div>
            </div>
        `;

        commentsList.insertAdjacentHTML('beforeend', commentHTML);

        // Scroll to new comment
        commentsList.scrollTop = commentsList.scrollHeight;
    }

    /**
     * Handle milestone celebration
     */
    handleMilestoneCelebration(data) {
        const { userName, milestoneType } = data;

        // Show celebration toast
        if (window.SocialFeedUtils && window.SocialFeedUtils.showToast) {
            window.SocialFeedUtils.showToast(
                `🎉 ${userName} achieved a milestone: ${milestoneType}!`,
                'success'
            );
        }
    }

    /**
     * Called when connection is established
     */
    onConnected() {
        // Re-join any threads we were viewing before disconnect
        this.viewingThreads.forEach(threadId => {
            this.socket.emit('thread:viewing', {
                threadId,
                userId: this.currentUserId,
                userName: this.currentUserName
            });
        });
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.socket) {
            // Leave all threads
            this.viewingThreads.forEach(threadId => {
                this.stopViewingThread(threadId);
            });

            this.socket.disconnect();
            this.isConnected = false;
            this.socket = null;
        }
    }
}

// Create global instance
window.socialFeedWS = new SocialFeedWebSocket();

// Auto-connect when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Get user info from localStorage
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('loggedInUserName');
        
        if (userId && userName) {
            window.socialFeedWS.setUser(userId, userName);
            window.socialFeedWS.connect();
        }
    });
} else {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('loggedInUserName');
    
    if (userId && userName) {
        window.socialFeedWS.setUser(userId, userName);
        window.socialFeedWS.connect();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.socialFeedWS) {
        window.socialFeedWS.disconnect();
    }
});

// Add CSS for notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 0;
            transform: translateY(0) scale(0);
        }
        20% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(-100px) scale(1.5);
        }
    }
    
    .reaction-notification {
        position: absolute !important;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
`;
document.head.appendChild(style);
