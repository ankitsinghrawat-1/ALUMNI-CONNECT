// client/js/thread-detail.js
document.addEventListener('DOMContentLoaded', async () => {
    const contentContainer = document.getElementById('thread-detail-content');
    const params = new URLSearchParams(window.location.search);
    const threadId = params.get('id');
    let currentUser = null;

    if (!threadId) {
        contentContainer.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><h3>Thread not found</h3><p>The requested thread could not be found.</p><a href="threads.html" class="btn btn-primary">Back to Feed</a></div>';
        return;
    }

    // Get current user info
    try {
        currentUser = await window.api.get('/users/profile');
    } catch (error) {
        console.error('Error getting user profile:', error);
    }

    // Format time ago
    const timeAgo = (date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diffInSeconds = Math.floor((now - postDate) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return postDate.toLocaleDateString();
    };

    // Load thread and comments
    const loadThread = async () => {
        try {
            const [thread, comments] = await Promise.all([
                window.api.get(`/threads/${threadId}`),
                window.api.get(`/threads/${threadId}/comments`)
            ]);

            document.title = `Thread by ${thread.author} - AlumniConnect`;

            const profilePicUrl = thread.profile_pic_url 
                ? `http://localhost:3000/${thread.profile_pic_url}` 
                : createInitialsAvatar(thread.author);

            let mediaContent = '';
            if (thread.media_url) {
                const mediaUrl = `http://localhost:3000/${thread.media_url}`;
                if (thread.media_type === 'image') {
                    mediaContent = `
                        <div class="thread-media">
                            <img src="${mediaUrl}" alt="Thread media" class="thread-image" onclick="openImageModal('${mediaUrl}')">
                        </div>
                    `;
                } else if (thread.media_type === 'video') {
                    mediaContent = `
                        <div class="thread-media">
                            <video controls class="thread-video">
                                <source src="${mediaUrl}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    `;
                }
            }

            const commentsHTML = comments.map(comment => {
                const commentProfilePic = comment.profile_pic_url 
                    ? `http://localhost:3000/${comment.profile_pic_url}` 
                    : createInitialsAvatar(comment.author);
                return `
                    <div class="comment-item">
                        <div class="comment-author">
                            <img src="${commentProfilePic}" alt="${comment.author}">
                            <div>
                                <strong><a href="view-profile.html?email=${comment.author_email}">${sanitizeHTML(comment.author)}</a></strong>
                                <small>${timeAgo(comment.created_at)}</small>
                            </div>
                        </div>
                        <p class="comment-content">${sanitizeHTML(comment.content)}</p>
                    </div>
                `;
            }).join('');

            contentContainer.innerHTML = `
                <article class="thread-item card">
                    <div class="thread-header">
                        <div class="thread-author">
                            <img src="${profilePicUrl}" alt="${sanitizeHTML(thread.author)}" class="author-avatar">
                            <div class="author-info">
                                <h4 class="author-name">
                                    <a href="view-profile.html?email=${thread.author_email}">${sanitizeHTML(thread.author)}</a>
                                </h4>
                                <span class="thread-time">${timeAgo(thread.created_at)}</span>
                            </div>
                        </div>
                        <div class="thread-actions">
                            <a href="threads.html" class="btn btn-secondary">
                                <i class="fas fa-arrow-left"></i> Back to Feed
                            </a>
                            ${currentUser && currentUser.user_id === thread.user_id ? `
                                <button class="btn btn-primary" onclick="editThread(${thread.thread_id})">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-danger" onclick="deleteThread(${thread.thread_id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <div class="thread-content">
                        ${thread.content ? `<p class="thread-text">${sanitizeHTML(thread.content).replace(/\n/g, '<br>')}</p>` : ''}
                        ${mediaContent}
                    </div>

                    <div class="thread-stats">
                        <div class="stat-item">
                            <button class="stat-btn like-btn" data-thread-id="${thread.thread_id}" data-liked="false">
                                <i class="far fa-heart"></i>
                                <span class="like-count">${thread.like_count || 0}</span>
                                <span class="stat-label">Likes</span>
                            </button>
                        </div>
                        <div class="stat-item">
                            <span class="stat-display">
                                <i class="far fa-comment"></i>
                                <span>${thread.comment_count || 0}</span>
                                <span class="stat-label">Comments</span>
                            </span>
                        </div>
                        <div class="stat-item">
                            <button class="stat-btn share-btn" onclick="shareThread(${thread.thread_id})">
                                <i class="far fa-share-square"></i>
                                <span class="share-count">${thread.share_count || 0}</span>
                                <span class="stat-label">Shares</span>
                            </button>
                        </div>
                    </div>
                </article>

                <section class="comments-section card">
                    <h3><i class="fas fa-comments"></i> Comments</h3>
                    
                    ${currentUser ? `
                        <form id="comment-form" data-thread-id="${threadId}">
                            <div class="input-group">
                                <textarea id="comment-content" rows="3" placeholder="Write a comment..." required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i> Post Comment
                            </button>
                        </form>
                    ` : `
                        <p class="login-prompt">
                            <a href="login.html">Log in</a> to leave a comment.
                        </p>
                    `}
                    
                    <div class="comments-list">
                        ${commentsHTML || '<p class="no-comments">No comments yet. Be the first to comment!</p>'}
                    </div>
                </section>
            `;

            // Update like status if user is logged in
            if (currentUser) {
                updateLikeStatus(threadId);
            }

        } catch (error) {
            console.error('Error loading thread:', error);
            contentContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading thread</h3>
                    <p>The thread could not be loaded. It may have been deleted or you may not have permission to view it.</p>
                    <a href="threads.html" class="btn btn-primary">Back to Feed</a>
                </div>
            `;
        }
    };

    // Update like status
    const updateLikeStatus = async (threadId) => {
        try {
            const status = await window.api.get(`/threads/${threadId}/like-status`);
            const likeBtn = document.querySelector(`[data-thread-id="${threadId}"]`);
            if (likeBtn) {
                likeBtn.dataset.liked = status.liked;
                const icon = likeBtn.querySelector('i');
                if (status.liked) {
                    icon.className = 'fas fa-heart';
                    likeBtn.classList.add('liked');
                } else {
                    icon.className = 'far fa-heart';
                    likeBtn.classList.remove('liked');
                }
            }
        } catch (error) {
            console.error('Error getting like status:', error);
        }
    };

    // Handle like button clicks
    const handleLikeClick = async (threadId, likeBtn) => {
        if (!currentUser) {
            showToast('Please log in to like threads', 'error');
            return;
        }

        try {
            const result = await window.api.post(`/threads/${threadId}/like`);
            const isLiked = result.liked;
            const icon = likeBtn.querySelector('i');
            const countSpan = likeBtn.querySelector('.like-count');
            
            likeBtn.dataset.liked = isLiked;
            
            if (isLiked) {
                icon.className = 'fas fa-heart';
                likeBtn.classList.add('liked');
                countSpan.textContent = parseInt(countSpan.textContent) + 1;
                showToast('Thread liked!', 'success');
            } else {
                icon.className = 'far fa-heart';
                likeBtn.classList.remove('liked');
                countSpan.textContent = Math.max(0, parseInt(countSpan.textContent) - 1);
                showToast('Thread unliked', 'info');
            }
            
        } catch (error) {
            console.error('Error toggling like:', error);
            showToast('Error updating like status', 'error');
        }
    };

    // Share thread
    window.shareThread = (threadId) => {
        const threadLink = `${window.location.origin}/thread-detail.html?id=${threadId}`;
        if (navigator.share) {
            navigator.share({
                title: 'Check out this thread',
                url: threadLink
            });
        } else {
            navigator.clipboard.writeText(threadLink);
            showToast('Link copied to clipboard!', 'success');
        }
    };

    // Delete thread
    window.deleteThread = async (threadId) => {
        if (!confirm('Are you sure you want to delete this thread? This action cannot be undone.')) return;
        
        try {
            await window.api.delete(`/threads/${threadId}`);
            showToast('Thread deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = 'threads.html';
            }, 1500);
        } catch (error) {
            console.error('Error deleting thread:', error);
            showToast('Error deleting thread', 'error');
        }
    };

    // Edit thread (redirect to edit page - could be implemented later)
    window.editThread = (threadId) => {
        window.location.href = `edit-thread.html?id=${threadId}`;
    };

    // Image modal (simple implementation)
    window.openImageModal = (imageUrl) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 90%; max-height: 90%; text-align: center;">
                <div class="modal-header">
                    <h3>Image</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <img src="${imageUrl}" style="max-width: 100%; max-height: 80vh; object-fit: contain;">
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        modal.querySelector('.close').onclick = () => {
            modal.remove();
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    };

    // Event listeners
    document.addEventListener('click', (e) => {
        // Like button clicks
        if (e.target.closest('.like-btn')) {
            const likeBtn = e.target.closest('.like-btn');
            const threadId = likeBtn.dataset.threadId;
            handleLikeClick(threadId, likeBtn);
        }
    });

    // Handle comment form submission
    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'comment-form') {
            e.preventDefault();
            const content = document.getElementById('comment-content').value.trim();
            
            if (!content) {
                showToast('Please enter a comment', 'error');
                return;
            }
            
            try {
                await window.api.post(`/threads/${threadId}/comments`, { content });
                showToast('Comment posted successfully!', 'success');
                document.getElementById('comment-content').value = '';
                loadThread(); // Refresh thread with new comment
            } catch (error) {
                console.error('Error posting comment:', error);
                showToast('Error posting comment', 'error');
            }
        }
    });

    // Load the thread
    loadThread();
});