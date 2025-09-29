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

    // Load and display stories
    const loadStories = async () => {
        try {
            const storyFeed = await window.api.get('/stories/feed');
            const storiesScroll = document.querySelector('.stories-scroll');
            
            if (!storiesScroll) return;

            // Keep only the "All" filter story item and build fresh content
            let storiesHTML = `
                <div class="story-item active" data-category="">
                    <div class="story-ring">
                        <div class="story-avatar">
                            <i class="fas fa-fire"></i>
                        </div>
                    </div>
                    <span>All</span>
                </div>
            `;

            // Add "Add Story" button for current user if logged in
            if (currentUser) {
                storiesHTML += `
                    <div class="story-item add-story" onclick="openAddStoryModal()">
                        <div class="story-ring add-story-ring">
                            <div class="story-avatar add-story-avatar">
                                <i class="fas fa-plus"></i>
                            </div>
                        </div>
                        <span>Add Story</span>
                    </div>
                `;
            }

            // Create user story items
            const userStoryItems = storyFeed.map(user => {
                const profilePicUrl = user.profile_pic_url 
                    ? `http://localhost:3000/${user.profile_pic_url}` 
                    : null;
                
                const avatarContent = profilePicUrl 
                    ? `<img src="${profilePicUrl}" alt="${user.full_name}">`
                    : user.full_name.charAt(0).toUpperCase();

                return `
                    <div class="story-item user-story" data-user-id="${user.user_id}" onclick="openUserStories(${user.user_id}, '${user.full_name.replace("'", "\\'")}')">
                        <div class="story-ring ${user.story_count > 0 ? 'has-stories' : ''}">
                            <div class="story-avatar user-avatar">
                                ${avatarContent}
                            </div>
                        </div>
                        <span>${user.full_name.split(' ')[0]}</span>
                    </div>
                `;
            }).join('');

            // Only add category filters if there are no user stories
            if (storyFeed.length === 0) {
                storiesHTML += `
                    <div class="story-item" data-category="career">
                        <div class="story-ring">
                            <div class="story-avatar career">
                                <i class="fas fa-briefcase"></i>
                            </div>
                        </div>
                        <span>Career</span>
                    </div>
                    <div class="story-item" data-category="networking">
                        <div class="story-ring">
                            <div class="story-avatar networking">
                                <i class="fas fa-handshake"></i>
                            </div>
                        </div>
                        <span>Network</span>
                    </div>
                `;
            }

            // Set the complete stories scroll content
            storiesScroll.innerHTML = storiesHTML + userStoryItems;
            
        } catch (error) {
            console.error('Error loading stories:', error);
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

    // Close thread modal
    window.closeThreadModal = () => {
        threadModal.style.display = 'none';
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
        await loadStories();
        await loadSidebarData();
        initializeModernFeatures();
    };

    // Load sidebar data (stats, trending hashtags, top contributors)
    const loadSidebarData = async () => {
        try {
            // Load trending hashtags
            const trendingHashtags = await window.api.get('/threads/hashtags/trending');
            const trendingContainer = document.getElementById('trending-tags');
            
            if (trendingHashtags.length > 0) {
                trendingContainer.innerHTML = trendingHashtags.slice(0, 5).map(hashtag => `
                    <div class="trend-item">
                        <span class="hashtag">#${hashtag.tag_name}</span>
                        <span class="trend-count">${hashtag.usage_count} posts</span>
                    </div>
                `).join('');
            } else {
                trendingContainer.innerHTML = '<div class="no-data">No trending topics yet</div>';
            }

            // Load community stats (placeholder - would need actual API endpoints)
            const statsContainer = document.getElementById('community-stats');
            statsContainer.innerHTML = `
                <div class="stat-box">
                    <div class="stat-number">--</div>
                    <div class="stat-label">Active Today</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">--</div>
                    <div class="stat-label">Total Members</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">--</div>
                    <div class="stat-label">New Posts</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">--</div>
                    <div class="stat-label">Discussions</div>
                </div>
            `;

            // Load top contributors (placeholder - would need actual API endpoints)
            const contributorsContainer = document.getElementById('contributors-list');
            contributorsContainer.innerHTML = '<div class="no-data">No contributor data available</div>';

        } catch (error) {
            console.error('Error loading sidebar data:', error);
            
            // Fallback content
            document.getElementById('trending-tags').innerHTML = '<div class="no-data">Unable to load trending topics</div>';
            document.getElementById('community-stats').innerHTML = '<div class="no-data">Stats unavailable</div>';
            document.getElementById('contributors-list').innerHTML = '<div class="no-data">Contributors unavailable</div>';
        }
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

    // Story viewing functionality
    window.openUserStories = async (userId, userName) => {
        if (!currentUser) {
            showToast('Please log in to view stories', 'error');
            return;
        }

        try {
            const userStories = await window.api.get(`/stories/user/${userId}`);
            if (userStories.length === 0) {
                showToast('No active stories from this user', 'info');
                return;
            }

            openStoryViewer(userStories, userName);
        } catch (error) {
            console.error('Error loading user stories:', error);
            showToast('Error loading stories', 'error');
        }
    };

    const openStoryViewer = (stories, userName) => {
        let currentStoryIndex = 0;
        const storyModal = document.createElement('div');
        storyModal.className = 'story-modal';
        
        const updateStoryContent = () => {
            const story = stories[currentStoryIndex];
            let mediaContent = '';
            
            if (story.media_url) {
                const mediaUrl = `http://localhost:3000/${story.media_url}`;
                if (story.media_type === 'image') {
                    mediaContent = `<img src="${mediaUrl}" alt="Story media" class="story-media-img">`;
                } else if (story.media_type === 'video') {
                    mediaContent = `<video autoplay muted class="story-media-video"><source src="${mediaUrl}" type="video/mp4"></video>`;
                }
            }

            const textContent = story.content ? `<div class="story-text" style="color: ${story.text_color || '#ffffff'}">${story.content}</div>` : '';
            const backgroundColor = story.background_color || '#4a90e2';

            storyModal.innerHTML = `
                <div class="story-overlay" style="background: ${backgroundColor}">
                    <div class="story-header">
                        <div class="story-user-info">
                            <div class="story-user-avatar">${userName.charAt(0)}</div>
                            <span class="story-user-name">${userName}</span>
                            <span class="story-time">${timeAgo(story.created_at)}</span>
                        </div>
                        <button class="story-close" onclick="closeStoryViewer()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="story-progress">
                        ${stories.map((_, index) => `
                            <div class="story-progress-bar ${index <= currentStoryIndex ? 'active' : ''}"></div>
                        `).join('')}
                    </div>
                    <div class="story-content" onclick="nextStory()">
                        ${mediaContent}
                        ${textContent}
                    </div>
                    <div class="story-navigation">
                        <div class="story-nav-left" onclick="prevStory()"></div>
                        <div class="story-nav-right" onclick="nextStory()"></div>
                    </div>
                </div>
            `;

            // Mark story as viewed
            if (currentUser.userId !== story.user_id) {
                window.api.post(`/stories/${story.story_id}/view`).catch(console.error);
            }
        };

        window.nextStory = () => {
            if (currentStoryIndex < stories.length - 1) {
                currentStoryIndex++;
                updateStoryContent();
            } else {
                closeStoryViewer();
            }
        };

        window.prevStory = () => {
            if (currentStoryIndex > 0) {
                currentStoryIndex--;
                updateStoryContent();
            }
        };

        window.closeStoryViewer = () => {
            storyModal.remove();
            document.body.style.overflow = '';
        };

        // Add story modal styles
        if (!document.querySelector('#story-modal-styles')) {
            const storyStyles = document.createElement('style');
            storyStyles.id = 'story-modal-styles';
            storyStyles.textContent = `
                .story-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0, 0, 0, 0.9);
                }

                .story-overlay {
                    position: relative;
                    width: 400px;
                    height: 600px;
                    border-radius: 12px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .story-header {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 10;
                    padding: 1rem;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
                    display: flex;
                    justify-content: between;
                    align-items: center;
                }

                .story-user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex: 1;
                }

                .story-user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .story-user-name {
                    color: white;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .story-time {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.75rem;
                }

                .story-close {
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .story-progress {
                    position: absolute;
                    top: 60px;
                    left: 1rem;
                    right: 1rem;
                    z-index: 10;
                    display: flex;
                    gap: 0.25rem;
                }

                .story-progress-bar {
                    flex: 1;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 1px;
                }

                .story-progress-bar.active {
                    background: white;
                }

                .story-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem 2rem 2rem;
                    cursor: pointer;
                }

                .story-media-img, .story-media-video {
                    max-width: 100%;
                    max-height: 100%;
                    border-radius: 8px;
                }

                .story-text {
                    text-align: center;
                    font-size: 1.2rem;
                    font-weight: 600;
                    line-height: 1.4;
                    margin-top: 1rem;
                }

                .story-navigation {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                }

                .story-nav-left, .story-nav-right {
                    flex: 1;
                    cursor: pointer;
                }

                /* Story items enhanced styles */
                .user-story .story-ring.has-stories {
                    background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
                    padding: 3px;
                    border-radius: 50%;
                }

                .user-avatar img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .add-story-ring {
                    background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
                    padding: 3px;
                }

                .add-story-avatar {
                    background: var(--surface-color) !important;
                    color: var(--primary-color) !important;
                }

                @media (max-width: 500px) {
                    .story-overlay {
                        width: 100vw;
                        height: 100vh;
                        border-radius: 0;
                    }
                }
            `;
            document.head.appendChild(storyStyles);
        }

        updateStoryContent();
        document.body.appendChild(storyModal);
        document.body.style.overflow = 'hidden';

        // Auto-advance story after 5 seconds (for text-only stories)
        const currentStory = stories[currentStoryIndex];
        if (!currentStory.media_url) {
            setTimeout(() => {
                if (document.body.contains(storyModal)) {
                    nextStory();
                }
            }, 5000);
        }
    };

    // Add story modal
    window.openAddStoryModal = () => {
        if (!currentUser) {
            showToast('Please log in to add stories', 'error');
            return;
        }

        // Redirect to add-thread page with story flag
        window.location.href = 'add-thread.html';
    };

    init();
});