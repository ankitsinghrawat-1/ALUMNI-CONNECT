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

            // Add "Add Story" button for current user if logged in - positioned prominently at the start
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

            // Get user data for profile picture
            const storyFeed = await window.api.get('/stories/feed');
            const userData = storyFeed.find(user => user.user_id === userId);
            
            openStoryViewer(userStories, userName, userData);
        } catch (error) {
            console.error('Error loading user stories:', error);
            showToast('Error loading stories', 'error');
        }
    };

    const openStoryViewer = (stories, userName, userData = null) => {
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
            
            // Create avatar content with proper circular styling
            let avatarContent = userName.charAt(0).toUpperCase();
            if (userData && userData.profile_pic_url) {
                avatarContent = `<img src="http://localhost:3000/${userData.profile_pic_url}" alt="${userName}">`;
            }

            storyModal.innerHTML = `
                <div class="story-overlay" style="background: ${backgroundColor}">
                    <div class="story-header">
                        <div class="story-user-info">
                            <div class="story-user-avatar">${avatarContent}</div>
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
                    overflow: hidden;
                    flex-shrink: 0;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                }

                .story-user-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 50%;
                    display: block;
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
            // Use fallback if showToast is not available
            if (typeof showToast === 'function') {
                showToast('Please log in to add stories', 'error');
            } else {
                alert('Please log in to add stories');
            }
            return;
        }

        createStoryModal();
    };

    const createStoryModal = () => {
        // Remove existing modal if any
        const existingModal = document.querySelector('.add-story-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'add-story-modal';
        
        modal.innerHTML = `
            <div class="story-modal-overlay" onclick="closeAddStoryModal()">
                <div class="story-modal-content" onclick="event.stopPropagation()">
                    <div class="story-modal-header">
                        <h3>Create Story</h3>
                        <button class="modal-close-btn" onclick="closeAddStoryModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="story-creation-area">
                        <!-- Story Type Selection -->
                        <div class="story-type-selector">
                            <button class="story-type-btn active" data-type="text" onclick="selectStoryType('text')">
                                <i class="fas fa-font"></i>
                                <span>Text</span>
                            </button>
                            <button class="story-type-btn" data-type="photo" onclick="selectStoryType('photo')">
                                <i class="fas fa-image"></i>
                                <span>Photo</span>
                            </button>
                            <button class="story-type-btn" data-type="video" onclick="selectStoryType('video')">
                                <i class="fas fa-video"></i>
                                <span>Video</span>
                            </button>
                        </div>

                        <!-- Story Content Area -->
                        <div class="story-content-area" id="story-content-area">
                            <!-- Text Story Content -->
                            <div class="story-text-content active" id="text-content">
                                <div class="story-preview" id="story-preview">
                                    <div class="story-preview-text" id="preview-text">Your text will appear here...</div>
                                </div>
                                <div class="story-controls">
                                    <textarea 
                                        id="story-text-input" 
                                        placeholder="What's on your mind?"
                                        maxlength="200"
                                        rows="3"
                                    ></textarea>
                                    <div class="story-styling-controls">
                                        <div class="color-control">
                                            <label>Background:</label>
                                            <input type="color" id="story-bg-color" value="#4a90e2" onchange="updateStoryPreview()">
                                        </div>
                                        <div class="color-control">
                                            <label>Text:</label>
                                            <input type="color" id="story-text-color" value="#ffffff" onchange="updateStoryPreview()">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Photo/Video Story Content -->
                            <div class="story-media-content" id="media-content">
                                <div class="media-upload-area" onclick="document.getElementById('story-media-input').click()">
                                    <div class="upload-placeholder">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                        <p>Click to upload media</p>
                                        <small>Images and videos up to 10MB</small>
                                    </div>
                                </div>
                                <input type="file" id="story-media-input" accept="image/*,video/*" style="display: none;" onchange="handleStoryMediaUpload(event)">
                                <div class="media-preview" id="media-preview" style="display: none;">
                                    <div class="media-preview-content" id="media-preview-content"></div>
                                    <button class="remove-media-btn" onclick="removeStoryMedia()">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="media-caption-area">
                                    <textarea 
                                        id="story-caption-input" 
                                        placeholder="Add a caption..."
                                        maxlength="150"
                                        rows="2"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="story-modal-footer">
                        <button class="btn-secondary" onclick="closeAddStoryModal()">Cancel</button>
                        <button class="btn-primary" id="publish-story-btn" onclick="publishStory()">
                            <i class="fas fa-paper-plane"></i>
                            Share Story
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        const styles = document.createElement('style');
        styles.textContent = `
            .add-story-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }

            .story-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
            }

            .story-modal-content {
                background: var(--surface-color);
                border-radius: 20px;
                width: 90vw;
                max-width: 500px;
                max-height: 90vh;
                overflow: hidden;
                position: relative;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }

            .story-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem 2rem;
                border-bottom: 1px solid var(--border-color);
                background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
                color: white;
            }

            .story-modal-header h3 {
                margin: 0;
                color: white;
                font-size: 1.2rem;
                font-weight: 600;
            }

            .modal-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.3s ease;
            }

            .modal-close-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .story-creation-area {
                padding: 2rem;
            }

            .story-type-selector {
                display: flex;
                gap: 1rem;
                margin-bottom: 2rem;
                justify-content: center;
            }

            .story-type-btn {
                flex: 1;
                padding: 1rem;
                border: 2px solid var(--border-color);
                background: var(--background-color);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-color);
            }

            .story-type-btn:hover {
                border-color: var(--primary-color);
                background: rgba(74, 144, 226, 0.05);
            }

            .story-type-btn.active {
                border-color: var(--primary-color);
                background: rgba(74, 144, 226, 0.1);
                color: var(--primary-color);
            }

            .story-type-btn i {
                font-size: 1.5rem;
            }

            .story-type-btn span {
                font-weight: 500;
                font-size: 0.9rem;
            }

            .story-content-area {
                min-height: 300px;
            }

            .story-text-content,
            .story-media-content {
                display: none;
            }

            .story-text-content.active,
            .story-media-content.active {
                display: block;
            }

            .story-preview {
                background: #4a90e2;
                border-radius: 12px;
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 1.5rem;
                position: relative;
                overflow: hidden;
            }

            .story-preview-text {
                color: white;
                font-size: 1.1rem;
                font-weight: 600;
                text-align: center;
                padding: 2rem;
                line-height: 1.4;
                max-width: 100%;
                word-break: break-word;
            }

            .story-controls {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            #story-text-input {
                width: 100%;
                padding: 1rem;
                border: 2px solid var(--border-color);
                border-radius: 10px;
                background: var(--background-color);
                color: var(--text-color);
                font-size: 1rem;
                resize: vertical;
                outline: none;
                transition: border-color 0.3s ease;
            }

            #story-text-input:focus {
                border-color: var(--primary-color);
            }

            .story-styling-controls {
                display: flex;
                gap: 2rem;
                justify-content: center;
            }

            .color-control {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .color-control label {
                font-weight: 500;
                color: var(--text-color);
                font-size: 0.9rem;
            }

            .color-control input[type="color"] {
                width: 40px;
                height: 32px;
                border: 2px solid var(--border-color);
                border-radius: 6px;
                cursor: pointer;
                background: transparent;
            }

            .media-upload-area {
                border: 2px dashed var(--border-color);
                border-radius: 12px;
                padding: 3rem 2rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-bottom: 1rem;
            }

            .media-upload-area:hover {
                border-color: var(--primary-color);
                background: rgba(74, 144, 226, 0.05);
            }

            .upload-placeholder i {
                font-size: 3rem;
                color: var(--primary-color);
                margin-bottom: 1rem;
            }

            .upload-placeholder p {
                color: var(--text-color);
                font-weight: 600;
                margin-bottom: 0.5rem;
            }

            .upload-placeholder small {
                color: var(--subtle-text-color);
            }

            .media-preview {
                position: relative;
                border-radius: 12px;
                overflow: hidden;
                margin-bottom: 1rem;
            }

            .media-preview-content img,
            .media-preview-content video {
                width: 100%;
                max-height: 250px;
                object-fit: cover;
                border-radius: 12px;
            }

            .remove-media-btn {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: rgba(231, 76, 60, 0.9);
                color: white;
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            .remove-media-btn:hover {
                background: #e74c3c;
                transform: scale(1.1);
            }

            .media-caption-area textarea {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                background: var(--background-color);
                color: var(--text-color);
                resize: vertical;
                outline: none;
                transition: border-color 0.3s ease;
            }

            .media-caption-area textarea:focus {
                border-color: var(--primary-color);
            }

            .story-modal-footer {
                padding: 1.5rem 2rem;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
            }

            .btn-secondary {
                padding: 0.75rem 1.5rem;
                border: 2px solid var(--border-color);
                background: var(--background-color);
                color: var(--text-color);
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .btn-secondary:hover {
                border-color: var(--subtle-text-color);
                background: var(--border-color);
            }

            .btn-primary {
                padding: 0.75rem 1.5rem;
                border: none;
                background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
                color: white;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.3s ease;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(74, 144, 226, 0.3);
            }

            .btn-primary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            @media (max-width: 768px) {
                .story-modal-content {
                    width: 95vw;
                    max-height: 95vh;
                }

                .story-creation-area {
                    padding: 1.5rem;
                }

                .story-type-selector {
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .story-styling-controls {
                    flex-direction: column;
                    gap: 1rem;
                }

                .story-modal-footer {
                    padding: 1rem 1.5rem;
                    flex-direction: column;
                }
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Initialize story text input listener
        const storyTextInput = document.getElementById('story-text-input');
        storyTextInput.addEventListener('input', updateStoryPreview);

        // Set initial preview
        updateStoryPreview();
    };

    // Global functions for story modal
    window.closeAddStoryModal = () => {
        const modal = document.querySelector('.add-story-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    };

    window.selectStoryType = (type) => {
        // Update active button
        document.querySelectorAll('.story-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // Show appropriate content area
        document.querySelectorAll('.story-text-content, .story-media-content').forEach(area => {
            area.classList.remove('active');
        });

        if (type === 'text') {
            document.getElementById('text-content').classList.add('active');
        } else {
            document.getElementById('media-content').classList.add('active');
        }
    };

    window.updateStoryPreview = () => {
        const textInput = document.getElementById('story-text-input');
        const previewText = document.getElementById('preview-text');
        const storyPreview = document.getElementById('story-preview');
        const bgColor = document.getElementById('story-bg-color');
        const textColor = document.getElementById('story-text-color');

        if (textInput && previewText && storyPreview) {
            const text = textInput.value.trim();
            previewText.textContent = text || 'Your text will appear here...';
            previewText.style.color = textColor.value;
            storyPreview.style.background = bgColor.value;
        }
    };

    window.handleStoryMediaUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            if (typeof showToast === 'function') {
                showToast('File size must be less than 10MB', 'error');
            } else {
                alert('File size must be less than 10MB');
            }
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/avi'];
        if (!allowedTypes.includes(file.type)) {
            if (typeof showToast === 'function') {
                showToast('Only images and videos are allowed', 'error');
            } else {
                alert('Only images and videos are allowed');
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const mediaPreview = document.getElementById('media-preview');
            const mediaPreviewContent = document.getElementById('media-preview-content');

            if (file.type.startsWith('image/')) {
                mediaPreviewContent.innerHTML = `<img src="${e.target.result}" alt="Story preview">`;
            } else if (file.type.startsWith('video/')) {
                mediaPreviewContent.innerHTML = `<video controls><source src="${e.target.result}" type="${file.type}"></video>`;
            }

            mediaPreview.style.display = 'block';
            document.querySelector('.media-upload-area').style.display = 'none';
        };

        reader.readAsDataURL(file);
    };

    window.removeStoryMedia = () => {
        document.getElementById('story-media-input').value = '';
        document.getElementById('media-preview').style.display = 'none';
        document.querySelector('.media-upload-area').style.display = 'block';
    };

    window.publishStory = async () => {
        const publishBtn = document.getElementById('publish-story-btn');
        const activeType = document.querySelector('.story-type-btn.active').dataset.type;

        try {
            publishBtn.disabled = true;
            publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

            const formData = new FormData();

            if (activeType === 'text') {
                const text = document.getElementById('story-text-input').value.trim();
                if (!text) {
                    if (typeof showToast === 'function') {
                        showToast('Please enter some text for your story', 'error');
                    } else {
                        alert('Please enter some text for your story');
                    }
                    return;
                }
                formData.append('content', text);
                formData.append('background_color', document.getElementById('story-bg-color').value);
                formData.append('text_color', document.getElementById('story-text-color').value);
            } else {
                const mediaInput = document.getElementById('story-media-input');
                const caption = document.getElementById('story-caption-input').value.trim();
                
                if (!mediaInput.files[0]) {
                    if (typeof showToast === 'function') {
                        showToast('Please select media for your story', 'error');
                    } else {
                        alert('Please select media for your story');
                    }
                    return;
                }
                
                formData.append('story_media', mediaInput.files[0]);
                if (caption) {
                    formData.append('content', caption);
                }
            }

            const result = await window.api.postForm('/stories', formData);
            if (typeof showToast === 'function') {
                showToast('Story published successfully!', 'success');
            } else {
                alert('Story published successfully!');
            }
            closeAddStoryModal();
            
            // Reload stories to show the new one
            if (typeof loadStories === 'function') {
                loadStories();
            }
            
        } catch (error) {
            console.error('Error publishing story:', error);
            if (typeof showToast === 'function') {
                showToast(`Error: ${error.message}`, 'error');
            } else {
                alert(`Error: ${error.message}`);
            }
        } finally {
            publishBtn.disabled = false;
            publishBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Share Story';
        }
    };

    init();
});