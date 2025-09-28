// client/js/threads.js
document.addEventListener('DOMContentLoaded', () => {
    const threadsFeed = document.getElementById('threads-feed');
    const threadModal = document.getElementById('thread-modal');
    const shareModal = document.getElementById('share-modal');
    let currentThreadForShare = null;
    let allThreads = [];
    let currentUser = null;

    // Get current user info
    const initializeUser = async () => {
        try {
            currentUser = await window.api.get('/users/profile');
        } catch (error) {
            console.error('Error getting user profile:', error);
        }
    };

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

    // Create thread HTML
    const createThreadHTML = (thread) => {
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

        return `
            <article class="thread-item card" data-thread-id="${thread.thread_id}">
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
                    ${currentUser && currentUser.user_id === thread.user_id ? `
                        <div class="thread-actions">
                            <button class="btn-icon" onclick="editThread(${thread.thread_id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="deleteThread(${thread.thread_id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>

                <div class="thread-content" onclick="window.location.href='thread-detail.html?id=${thread.thread_id}'" style="cursor: pointer;">
                    ${thread.content ? `<p class="thread-text">${sanitizeHTML(thread.content).replace(/\n/g, '<br>')}</p>` : ''}
                    ${mediaContent}
                </div>

                <div class="thread-stats">
                    <div class="stat-item">
                        <button class="stat-btn like-btn" data-thread-id="${thread.thread_id}" data-liked="false">
                            <i class="far fa-heart"></i>
                            <span class="like-count">${thread.like_count || 0}</span>
                        </button>
                    </div>
                    <div class="stat-item">
                        <button class="stat-btn comment-btn" onclick="window.location.href='thread-detail.html?id=${thread.thread_id}'">
                            <i class="far fa-comment"></i>
                            <span>${thread.comment_count || 0}</span>
                        </button>
                    </div>
                    <div class="stat-item">
                        <button class="stat-btn share-btn" onclick="openShareModal(${thread.thread_id})">
                            <i class="far fa-share-square"></i>
                            <span class="share-count">${thread.share_count || 0}</span>
                        </button>
                    </div>
                    <div class="stat-item">
                        <button class="stat-btn view-btn" onclick="window.location.href='thread-detail.html?id=${thread.thread_id}'" title="View full thread">
                            <i class="fas fa-eye"></i>
                            <span>View</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    };

    // Load threads
    const loadThreads = async () => {
        try {
            const threads = await window.api.get('/threads');
            allThreads = threads;
            
            if (threads.length === 0) {
                threadsFeed.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-comments"></i>
                        <h3>No Threads Yet</h3>
                        <p>Be the first to start a conversation! Share your thoughts, experiences, or ask questions to connect with the alumni community.</p>
                        <div class="empty-state-actions">
                            <a href="add-thread.html" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Create First Thread
                            </a>
                            <a href="directory.html" class="btn btn-secondary">
                                <i class="fas fa-users"></i> Browse Alumni
                            </a>
                        </div>
                    </div>
                `;
                return;
            }

            threadsFeed.innerHTML = threads.map(createThreadHTML).join('');
            
            // Initialize like status for all threads
            await updateLikeStatuses();
            
        } catch (error) {
            console.error('Error loading threads:', error);
            threadsFeed.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Unable to Load Threads</h3>
                    <p>We're having trouble connecting to the server. This might be because:</p>
                    <ul class="error-reasons">
                        <li>You're not logged in</li>
                        <li>The server is temporarily unavailable</li>
                        <li>Your internet connection is unstable</li>
                    </ul>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="fas fa-refresh"></i> Try Again
                        </button>
                        <a href="login.html" class="btn btn-secondary">
                            <i class="fas fa-sign-in-alt"></i> Log In
                        </a>
                    </div>
                </div>
            `;
        }
    };

    // Update like statuses for current user
    const updateLikeStatuses = async () => {
        if (!currentUser) return;
        
        for (const thread of allThreads) {
            try {
                const status = await window.api.get(`/threads/${thread.thread_id}/like-status`);
                const likeBtn = document.querySelector(`[data-thread-id="${thread.thread_id}"]`);
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
                console.error(`Error getting like status for thread ${thread.thread_id}:`, error);
            }
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
            } else {
                icon.className = 'far fa-heart';
                likeBtn.classList.remove('liked');
                countSpan.textContent = Math.max(0, parseInt(countSpan.textContent) - 1);
            }
            
        } catch (error) {
            console.error('Error toggling like:', error);
            showToast('Error updating like status', 'error');
        }
    };

    // Open thread detail modal
    window.openThreadModal = async (threadId) => {
        try {
            const thread = await window.api.get(`/threads/${threadId}`);
            const comments = await window.api.get(`/threads/${threadId}/comments`);
            
            const profilePicUrl = thread.profile_pic_url 
                ? `http://localhost:3000/${thread.profile_pic_url}` 
                : createInitialsAvatar(thread.author);

            let mediaContent = '';
            if (thread.media_url) {
                const mediaUrl = `http://localhost:3000/${thread.media_url}`;
                if (thread.media_type === 'image') {
                    mediaContent = `<div class="thread-media"><img src="${mediaUrl}" alt="Thread media" class="thread-image"></div>`;
                } else if (thread.media_type === 'video') {
                    mediaContent = `<div class="thread-media"><video controls class="thread-video"><source src="${mediaUrl}" type="video/mp4"></video></div>`;
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

            document.getElementById('thread-modal-body').innerHTML = `
                <div class="thread-detail">
                    <div class="thread-header">
                        <div class="thread-author">
                            <img src="${profilePicUrl}" alt="${sanitizeHTML(thread.author)}" class="author-avatar">
                            <div class="author-info">
                                <h4><a href="view-profile.html?email=${thread.author_email}">${sanitizeHTML(thread.author)}</a></h4>
                                <span>${timeAgo(thread.created_at)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="thread-content">
                        ${thread.content ? `<p>${sanitizeHTML(thread.content).replace(/\n/g, '<br>')}</p>` : ''}
                        ${mediaContent}
                    </div>
                    
                    <div class="thread-stats">
                        <span><i class="fas fa-heart"></i> ${thread.like_count || 0}</span>
                        <span><i class="fas fa-comment"></i> ${thread.comment_count || 0}</span>
                        <span><i class="fas fa-share"></i> ${thread.share_count || 0}</span>
                    </div>
                    
                    <div class="comments-section">
                        <h4>Comments</h4>
                        <form id="comment-form" data-thread-id="${threadId}">
                            <textarea placeholder="Write a comment..." required></textarea>
                            <button type="submit" class="btn btn-primary">Post Comment</button>
                        </form>
                        <div class="comments-list">
                            ${commentsHTML || '<p class="no-comments">No comments yet. Be the first to comment!</p>'}
                        </div>
                    </div>
                </div>
            `;
            
            threadModal.style.display = 'block';
            
        } catch (error) {
            console.error('Error loading thread details:', error);
            showToast('Error loading thread details', 'error');
        }
    };

    // Open share modal
    window.openShareModal = (threadId) => {
        currentThreadForShare = threadId;
        const threadLink = `${window.location.origin}/thread-detail.html?id=${threadId}`;
        document.getElementById('thread-link-input').value = threadLink;
        shareModal.style.display = 'block';
    };

    // Copy thread link
    window.copyThreadLink = () => {
        const linkInput = document.getElementById('thread-link-input');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile devices
        navigator.clipboard.writeText(linkInput.value);
        showToast('Link copied to clipboard!', 'success');
        shareModal.style.display = 'none';
    };

    // Share to messages
    window.shareToMessages = () => {
        const threadLink = document.getElementById('thread-link-input').value;
        // This would open the messages page with the link pre-filled
        window.open(`messages.html?share=${encodeURIComponent(threadLink)}`, '_blank');
        shareModal.style.display = 'none';
    };

    // Delete thread
    window.deleteThread = async (threadId) => {
        if (!confirm('Are you sure you want to delete this thread?')) return;
        
        try {
            await window.api.delete(`/threads/${threadId}`);
            showToast('Thread deleted successfully', 'success');
            loadThreads(); // Reload threads
        } catch (error) {
            console.error('Error deleting thread:', error);
            showToast('Error deleting thread', 'error');
        }
    };

    // Event listeners
    document.addEventListener('click', (e) => {
        // Like button clicks
        if (e.target.closest('.like-btn')) {
            const likeBtn = e.target.closest('.like-btn');
            const threadId = likeBtn.dataset.threadId;
            handleLikeClick(threadId, likeBtn);
        }
        
        // Modal close buttons
        if (e.target.classList.contains('close')) {
            threadModal.style.display = 'none';
            shareModal.style.display = 'none';
        }
        
        // Click outside modal to close
        if (e.target === threadModal) {
            threadModal.style.display = 'none';
        }
        if (e.target === shareModal) {
            shareModal.style.display = 'none';
        }
    });

    // Handle comment form submission
    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'comment-form') {
            e.preventDefault();
            const threadId = e.target.dataset.threadId;
            const content = e.target.querySelector('textarea').value;
            
            if (!content.trim()) return;
            
            try {
                await window.api.post(`/threads/${threadId}/comments`, { content });
                showToast('Comment posted successfully!', 'success');
                openThreadModal(threadId); // Refresh modal with new comment
            } catch (error) {
                console.error('Error posting comment:', error);
                showToast('Error posting comment', 'error');
            }
        }
    });

    // Initialize page
    const init = async () => {
        await initializeUser();
        await loadThreads();
    };

    init();
});