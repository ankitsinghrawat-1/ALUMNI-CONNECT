// server/websocket/social-feed-realtime.js
// WebSocket handlers for real-time social feed features
// Handles live viewers, typing indicators, and real-time reactions

const activeViewers = new Map(); // threadId -> Set of userIds
const typingUsers = new Map(); // threadId -> Set of userIds

/**
 * Initialize WebSocket handlers for social feed
 */
function initializeSocialFeedWebSocket(io) {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        /**
         * User starts viewing a thread
         */
        socket.on('thread:viewing', (data) => {
            const { threadId, userId, userName } = data;

            // Join thread room
            socket.join(`thread:${threadId}`);

            // Track viewer
            if (!activeViewers.has(threadId)) {
                activeViewers.set(threadId, new Set());
            }
            activeViewers.get(threadId).add(userId);

            // Broadcast updated viewer count to everyone in the thread
            const viewerCount = activeViewers.get(threadId).size;
            io.to(`thread:${threadId}`).emit('thread:viewer-update', {
                threadId,
                viewerCount,
                viewers: Array.from(activeViewers.get(threadId))
            });

            console.log(`User ${userId} viewing thread ${threadId}. Total viewers: ${viewerCount}`);
        });

        /**
         * User stops viewing a thread
         */
        socket.on('thread:leave', (data) => {
            const { threadId, userId } = data;

            // Leave thread room
            socket.leave(`thread:${threadId}`);

            // Remove from active viewers
            if (activeViewers.has(threadId)) {
                activeViewers.get(threadId).delete(userId);

                if (activeViewers.get(threadId).size === 0) {
                    activeViewers.delete(threadId);
                }
            }

            // Broadcast updated viewer count
            const viewerCount = activeViewers.has(threadId) ? activeViewers.get(threadId).size : 0;
            io.to(`thread:${threadId}`).emit('thread:viewer-update', {
                threadId,
                viewerCount,
                viewers: activeViewers.has(threadId) ? Array.from(activeViewers.get(threadId)) : []
            });

            console.log(`User ${userId} left thread ${threadId}. Remaining viewers: ${viewerCount}`);
        });

        // ================================================================
        // TYPING INDICATORS
        // ================================================================

        /**
         * User starts typing a comment
         */
        socket.on('thread:typing-start', (data) => {
            const { threadId, userId, userName } = data;

            // Track typing user
            if (!typingUsers.has(threadId)) {
                typingUsers.set(threadId, new Map());
            }
            typingUsers.get(threadId).set(userId, userName);

            // Broadcast to others in the thread (exclude sender)
            socket.to(`thread:${threadId}`).emit('thread:user-typing', {
                threadId,
                userId,
                userName,
                typingCount: typingUsers.get(threadId).size
            });

            // Auto-clear typing indicator after 3 seconds
            setTimeout(() => {
                if (typingUsers.has(threadId) && typingUsers.get(threadId).has(userId)) {
                    typingUsers.get(threadId).delete(userId);
                    
                    const remainingCount = typingUsers.get(threadId).size;
                    if (remainingCount === 0) {
                        typingUsers.delete(threadId);
                    }

                    io.to(`thread:${threadId}`).emit('thread:typing-update', {
                        threadId,
                        typingCount: remainingCount
                    });
                }
            }, 3000);
        });

        /**
         * User stops typing a comment
         */
        socket.on('thread:typing-stop', (data) => {
            const { threadId, userId } = data;

            // Remove from typing users
            if (typingUsers.has(threadId)) {
                typingUsers.get(threadId).delete(userId);

                const remainingCount = typingUsers.get(threadId).size;
                if (remainingCount === 0) {
                    typingUsers.delete(threadId);
                }

                // Broadcast update
                io.to(`thread:${threadId}`).emit('thread:typing-update', {
                    threadId,
                    typingCount: remainingCount
                });
            }
        });

        // ================================================================
        // REAL-TIME REACTIONS
        // ================================================================

        /**
         * User adds a reaction to a thread
         */
        socket.on('thread:reaction-added', (data) => {
            const { threadId, userId, userName, reactionType, totalReactions, counts } = data;

            // Broadcast to all users in the thread
            io.to(`thread:${threadId}`).emit('thread:reaction-update', {
                threadId,
                userId,
                userName,
                reactionType,
                totalReactions,
                counts,
                action: 'added'
            });

            console.log(`User ${userId} reacted to thread ${threadId} with ${reactionType}`);
        });

        /**
         * User removes a reaction from a thread
         */
        socket.on('thread:reaction-removed', (data) => {
            const { threadId, userId, reactionType, totalReactions, counts } = data;

            // Broadcast to all users in the thread
            io.to(`thread:${threadId}`).emit('thread:reaction-update', {
                threadId,
                userId,
                reactionType,
                totalReactions,
                counts,
                action: 'removed'
            });
        });

        // ================================================================
        // REAL-TIME COMMENTS
        // ================================================================

        /**
         * New comment added to a thread
         */
        socket.on('thread:comment-added', (data) => {
            const { threadId, comment } = data;

            // Broadcast new comment to all users in the thread
            socket.to(`thread:${threadId}`).emit('thread:new-comment', {
                threadId,
                comment
            });

            console.log(`New comment added to thread ${threadId} by user ${comment.user_id}`);
        });

        // ================================================================
        // MILESTONE CELEBRATIONS
        // ================================================================

        /**
         * Broadcast milestone celebration
         */
        socket.on('thread:milestone-detected', (data) => {
            const { threadId, userId, userName, milestoneType } = data;

            // Broadcast celebration to all connected users
            io.emit('feed:milestone-celebration', {
                threadId,
                userId,
                userName,
                milestoneType,
                timestamp: new Date()
            });

            console.log(`Milestone celebration for user ${userId}: ${milestoneType}`);
        });

        // ================================================================
        // CONNECTION CLEANUP
        // ================================================================

        /**
         * Handle client disconnect
         */
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            // Clean up viewer tracking
            // Note: In production, you'd want to track socket.id -> userId mapping
            // to properly clean up viewers when a specific socket disconnects
        });

        /**
         * Error handling
         */
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    console.log('Social Feed WebSocket handlers initialized');
}

/**
 * Get current viewer count for a thread
 */
function getViewerCount(threadId) {
    return activeViewers.has(threadId) ? activeViewers.get(threadId).size : 0;
}

/**
 * Get current typing count for a thread
 */
function getTypingCount(threadId) {
    return typingUsers.has(threadId) ? typingUsers.get(threadId).size : 0;
}

/**
 * Broadcast notification to specific user
 */
function notifyUser(io, userId, notification) {
    io.to(`user:${userId}`).emit('notification', notification);
}

/**
 * Broadcast feed update to all users
 */
function broadcastFeedUpdate(io, update) {
    io.emit('feed:update', update);
}

module.exports = {
    initializeSocialFeedWebSocket,
    getViewerCount,
    getTypingCount,
    notifyUser,
    broadcastFeedUpdate
};
