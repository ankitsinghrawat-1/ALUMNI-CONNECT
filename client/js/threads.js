// client/js/threads.js
document.addEventListener('DOMContentLoaded', () => {
    const threadsFeed = document.getElementById('threads-feed-container');
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
                    <img src="${mediaUrl}" alt="Thread media" class="modern-thread-image" onclick="openImageModal('${mediaUrl}')">
                `;
            } else if (thread.media_type === 'video') {
                mediaContent = `
                    <video controls class="modern-thread-video">
                        <source src="${mediaUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                `;
            }
        }

        return `
            <article class="modern-thread-card" data-thread-id="${thread.thread_id}">
                <div class="modern-thread-header">
                    <div class="modern-thread-author">
                        <img src="${profilePicUrl}" alt="${sanitizeHTML(thread.author)}" class="modern-author-avatar">
                        <div class="modern-author-details">
                            <h4>
                                <a href="view-profile.html?email=${thread.author_email}">${sanitizeHTML(thread.author)}</a>
                            </h4>
                            <span class="modern-thread-time">${timeAgo(thread.created_at)}</span>
                        </div>
                    </div>
                    ${currentUser && currentUser.user_id === thread.user_id ? `
                        <div class="modern-thread-actions">
                            <button class="modern-action-btn" onclick="editThread(${thread.thread_id})" title="Edit thread">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="modern-action-btn" onclick="deleteThread(${thread.thread_id})" title="Delete thread">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : `
                        <div class="modern-thread-actions">
                            <button class="modern-action-btn" onclick="window.location.href='thread-detail.html?id=${thread.thread_id}'" title="View details">
                                <i class="fas fa-external-link-alt"></i>
                            </button>
                        </div>
                    `}
                </div>

                <div class="modern-thread-content" onclick="window.location.href='thread-detail.html?id=${thread.thread_id}'" style="cursor: pointer;">
                    ${thread.content ? `<p class="modern-thread-text">${sanitizeHTML(thread.content).replace(/\n/g, '<br>')}</p>` : ''}
                    ${mediaContent ? `<div class="modern-thread-media">${mediaContent}</div>` : ''}
                </div>

                <div class="modern-thread-stats">
                    <button class="modern-stat-btn like-btn" data-thread-id="${thread.thread_id}" data-liked="false">
                        <i class="far fa-heart"></i>
                        <span class="stat-count like-count">${thread.like_count || 0}</span>
                        <span class="stat-label">Likes</span>
                    </button>
                    <button class="modern-stat-btn comment-btn" onclick="window.location.href='thread-detail.html?id=${thread.thread_id}'">
                        <i class="far fa-comment"></i>
                        <span class="stat-count">${thread.comment_count || 0}</span>
                        <span class="stat-label">Comments</span>
                    </button>
                    <button class="modern-stat-btn share-btn" onclick="openShareModal(${thread.thread_id})">
                        <i class="far fa-share-square"></i>
                        <span class="stat-count share-count">${thread.share_count || 0}</span>
                        <span class="stat-label">Shares</span>
                    </button>
                    <button class="modern-stat-btn bookmark-btn" onclick="bookmarkThread(${thread.thread_id})" title="Save for later">
                        <i class="far fa-bookmark"></i>
                        <span class="stat-count">0</span>
                        <span class="stat-label">Save</span>
                    </button>
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
        initializeModernFeatures();
    };

    // Initialize modern features
    const initializeModernFeatures = () => {
        // Filter toggle functionality
        const filterToggle = document.getElementById('filter-toggle');
        const filterPanel = document.getElementById('filter-panel');
        
        if (filterToggle && filterPanel) {
            filterToggle.addEventListener('click', () => {
                filterPanel.classList.toggle('active');
                filterToggle.classList.toggle('active');
            });
        }

        // Story items filtering
        const storyItems = document.querySelectorAll('.story-item');
        storyItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all items
                storyItems.forEach(story => story.classList.remove('active'));
                // Add active class to clicked item
                item.classList.add('active');
                
                // Filter threads based on category
                const category = item.dataset.category;
                filterThreadsByCategory(category);
            });
        });

        // Initialize smooth scrolling for stories
        const storiesScroll = document.querySelector('.stories-scroll');
        if (storiesScroll) {
            let isDown = false;
            let startX;
            let scrollLeft;

            storiesScroll.addEventListener('mousedown', (e) => {
                isDown = true;
                startX = e.pageX - storiesScroll.offsetLeft;
                scrollLeft = storiesScroll.scrollLeft;
            });

            storiesScroll.addEventListener('mouseleave', () => {
                isDown = false;
            });

            storiesScroll.addEventListener('mouseup', () => {
                isDown = false;
            });

            storiesScroll.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - storiesScroll.offsetLeft;
                const walk = (x - startX) * 2;
                storiesScroll.scrollLeft = scrollLeft - walk;
            });
        }
    };

    // Filter threads by category
    const filterThreadsByCategory = (category) => {
        const threadCards = document.querySelectorAll('.modern-thread-card');
        threadCards.forEach(card => {
            if (!category) {
                // Show all threads
                card.style.display = 'block';
            } else {
                // Filter by category - this would need thread category data
                // For now, just show all since we don't have category data in threads
                card.style.display = 'block';
            }
        });
    };

    // Bookmark functionality
    window.bookmarkThread = async (threadId) => {
        try {
            const result = await window.api.post(`/threads/${threadId}/bookmark`);
            showToast(result.bookmarked ? 'Thread bookmarked!' : 'Bookmark removed', 'success');
            
            // Update bookmark button
            const bookmarkBtn = document.querySelector(`[data-thread-id="${threadId}"] .bookmark-btn`);
            if (bookmarkBtn) {
                const icon = bookmarkBtn.querySelector('i');
                if (result.bookmarked) {
                    icon.className = 'fas fa-bookmark';
                    bookmarkBtn.classList.add('bookmarked');
                } else {
                    icon.className = 'far fa-bookmark';
                    bookmarkBtn.classList.remove('bookmarked');
                }
            }
        } catch (error) {
            console.error('Error bookmarking thread:', error);
            showToast('Error bookmarking thread', 'error');
        }
    };

    // Image modal functionality
    window.openImageModal = (imageUrl) => {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-overlay" onclick="closeImageModal()">
                <div class="image-modal-content" onclick="event.stopPropagation()">
                    <img src="${imageUrl}" alt="Thread image" />
                    <button class="image-modal-close" onclick="closeImageModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add modal styles if not already present
        if (!document.querySelector('#image-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'image-modal-styles';
            styles.textContent = `
                .image-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }
                
                .image-modal-overlay {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }
                
                .image-modal-content {
                    position: relative;
                    max-width: 90vw;
                    max-height: 90vh;
                }
                
                .image-modal-content img {
                    max-width: 100%;
                    max-height: 100%;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                }
                
                .image-modal-close {
                    position: absolute;
                    top: -40px;
                    right: 0;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                
                .image-modal-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    };

    window.closeImageModal = () => {
        const modal = document.querySelector('.image-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    };

    init();
});