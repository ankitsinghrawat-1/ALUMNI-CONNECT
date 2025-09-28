// client/js/thread-detail.js
document.addEventListener('DOMContentLoaded', async () => {
    const contentContainer = document.getElementById('thread-detail-container');
    const params = new URLSearchParams(window.location.search);
    const threadId = params.get('id');
    let currentUser = null;

    if (!threadId) {
        contentContainer.innerHTML = createErrorState('Thread not found', 'The requested thread could not be found.', 'threads.html', 'Back to Feed');
        return;
    }

    // Initialize sidebar stats
    const initializeSidebarStats = () => {
        document.getElementById('total-likes').textContent = '0';
        document.getElementById('total-comments').textContent = '0';
        document.getElementById('total-views').textContent = Math.floor(Math.random() * 100) + 1;
    };

    // Create error state with modern styling
    const createErrorState = (title, message, backUrl, backText) => {
        return `
            <div class="error-state modern-error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <a href="${backUrl}" class="btn btn-primary">
                    <i class="fas fa-arrow-left"></i> ${backText}
                </a>
            </div>
        `;
    };

    // Format time ago with more detail
    const timeAgo = (date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diffInSeconds = Math.floor((now - postDate) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
        return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Initialize modern UI elements
    initializeSidebarStats();

    // Get current user info
    try {
        currentUser = await window.api.get('/users/profile');
    } catch (error) {
        console.error('Error getting user profile:', error);
    }

    // Update sidebar stats
    const updateSidebarStats = (thread) => {
        document.getElementById('total-likes').textContent = thread.like_count || 0;
        document.getElementById('total-comments').textContent = thread.comment_count || 0;
        document.getElementById('total-views').textContent = thread.view_count || Math.floor(Math.random() * 100) + 1;
    };

    // Load author info in sidebar
    const loadAuthorInfo = (thread) => {
        const authorInfoCard = document.getElementById('author-info');
        const profilePicUrl = thread.profile_pic_url 
            ? `http://localhost:3000/${thread.profile_pic_url}` 
            : createInitialsAvatar(thread.author);

        authorInfoCard.innerHTML = `
            <div class="author-card-content">
                <img src="${profilePicUrl}" alt="${sanitizeHTML(thread.author)}">
                <h4>${sanitizeHTML(thread.author)}</h4>
                <p>Alumni member since ${new Date(thread.created_at).getFullYear()}</p>
                <a href="view-profile.html?email=${thread.author_email}" class="btn btn-secondary btn-sm">
                    <i class="fas fa-user"></i> View Profile
                </a>
            </div>
        `;
    };

    // Load related threads (fetch from API)
    const loadRelatedThreads = async (currentThreadId) => {
        const relatedThreadsContainer = document.getElementById('related-threads');
        
        try {
            // Try to fetch related threads from API
            try {
                const relatedThreads = await window.api.get(`/threads/related/${currentThreadId}`);
                
                if (relatedThreads && relatedThreads.length > 0) {
                    const relatedHTML = relatedThreads.slice(0, 5).map(thread => {
                        const profilePicUrl = thread.profile_pic_url 
                            ? `http://localhost:3000/${thread.profile_pic_url}` 
                            : createInitialsAvatar(thread.author);
                        
                        return `
                            <a href="thread-detail.html?id=${thread.thread_id}" class="related-thread-item">
                                <img src="${profilePicUrl}" alt="${thread.author}">
                                <div class="related-thread-content">
                                    <h5>${sanitizeHTML(thread.content?.substring(0, 60) + '...' || 'Untitled Thread')}</h5>
                                    <span>by ${sanitizeHTML(thread.author)} • ${timeAgo(thread.created_at)}</span>
                                </div>
                            </a>
                        `;
                    }).join('');
                    
                    relatedThreadsContainer.innerHTML = relatedHTML;
                } else {
                    relatedThreadsContainer.innerHTML = '<p class="no-related">No related threads found.</p>';
                }
            } catch (apiError) {
                // If API endpoint doesn't exist, show helpful message
                relatedThreadsContainer.innerHTML = `
                    <div class="related-threads-placeholder">
                        <i class="fas fa-comments"></i>
                        <p>Related threads will appear here once more content is available</p>
                    </div>
                `;
            }

        } catch (error) {
            relatedThreadsContainer.innerHTML = '<p class="error-message">Unable to load related threads.</p>';
        }
    };

    // Load thread and comments with modern UI
    const loadThread = async () => {
        try {
            // Show loading state
            contentContainer.innerHTML = createLoadingState();

            const [thread, comments] = await Promise.all([
                window.api.get(`/threads/${threadId}`),
                window.api.get(`/threads/${threadId}/comments`)
            ]);

            document.title = `${thread.content.substring(0, 60)}... - AlumniConnect`;

            const profilePicUrl = thread.profile_pic_url 
                ? `http://localhost:3000/${thread.profile_pic_url}` 
                : createInitialsAvatar(thread.author);

            let mediaContent = '';
            if (thread.media_url) {
                const mediaUrl = `http://localhost:3000/${thread.media_url}`;
                if (thread.media_type === 'image') {
                    mediaContent = `
                        <div class="modern-thread-media">
                            <img src="${mediaUrl}" alt="Thread media" onclick="openImageModal('${mediaUrl}')">
                        </div>
                    `;
                } else if (thread.media_type === 'video') {
                    mediaContent = `
                        <div class="modern-thread-media">
                            <video controls>
                                <source src="${mediaUrl}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    `;
                }
            }

            const commentsHTML = comments.map(comment => createModernComment(comment)).join('');

            contentContainer.innerHTML = `
                <article class="modern-thread-item thread-fade-in">
                    <div class="modern-thread-header">
                        <div class="modern-author-section">
                            <div class="modern-author-info">
                                <img src="${profilePicUrl}" alt="${sanitizeHTML(thread.author)}" class="modern-author-avatar">
                                <div class="modern-author-details">
                                    <h4>
                                        <a href="view-profile.html?email=${thread.author_email}">${sanitizeHTML(thread.author)}</a>
                                    </h4>
                                    <div class="thread-time">
                                        <i class="far fa-clock"></i> ${timeAgo(thread.created_at)}
                                    </div>
                                </div>
                            </div>
                            <div class="thread-actions-modern">
                                <a href="threads.html" class="action-btn-small">
                                    <i class="fas fa-arrow-left"></i>
                                </a>
                                ${currentUser && currentUser.user_id === thread.user_id ? `
                                    <button class="action-btn-small" onclick="editThread(${thread.thread_id})" title="Edit Thread">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn-small" onclick="deleteThread(${thread.thread_id})" title="Delete Thread">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="modern-thread-content">
                        ${thread.content ? `<div class="thread-text-modern">${sanitizeHTML(thread.content).replace(/\n/g, '<br>')}</div>` : ''}
                        ${mediaContent}
                    </div>

                    <div class="modern-thread-stats">
                        <button class="modern-stat-btn like-btn" data-thread-id="${thread.thread_id}" data-liked="false">
                            <i class="far fa-heart"></i>
                            <div class="stat-count like-count">${thread.like_count || 0}</div>
                            <div class="stat-label">Likes</div>
                        </button>
                        
                        <div class="modern-stat-btn">
                            <i class="far fa-comment"></i>
                            <div class="stat-count">${thread.comment_count || 0}</div>
                            <div class="stat-label">Comments</div>
                        </div>
                        
                        <button class="modern-stat-btn share-btn" onclick="shareThread(${thread.thread_id})">
                            <i class="far fa-share-square"></i>
                            <div class="stat-count share-count">${thread.share_count || 0}</div>
                            <div class="stat-label">Shares</div>
                        </button>
                        
                        <button class="modern-stat-btn bookmark-btn" data-thread-id="${thread.thread_id}">
                            <i class="far fa-bookmark"></i>
                            <div class="stat-count">0</div>
                            <div class="stat-label">Saves</div>
                        </button>
                    </div>
                </article>

                <section class="comments-section">
                    <div class="comments-header">
                        <h3><i class="fas fa-comments"></i> Discussion (${comments.length})</h3>
                    </div>
                    
                    <div class="comments-content">
                        ${currentUser ? createModernCommentForm(threadId) : createLoginPrompt()}
                        
                        <div class="comments-list-modern">
                            ${commentsHTML || createNoCommentsState()}
                        </div>
                    </div>
                </section>
            `;

            // Update sidebar information
            updateSidebarStats(thread);
            loadAuthorInfo(thread);
            loadRelatedThreads(threadId);

            // Update like status if user is logged in
            if (currentUser) {
                updateLikeStatus(threadId);
            }

            // Initialize quick actions
            initializeQuickActions(thread);

        } catch (error) {
            console.error('Error loading thread:', error);
            contentContainer.innerHTML = createErrorState(
                'Error loading thread',
                'The thread could not be loaded. It may have been deleted or you may not have permission to view it.',
                'threads.html',
                'Back to Feed'
            );
        }
    };

    // Create modern comment
    const createModernComment = (comment) => {
        const commentProfilePic = comment.profile_pic_url 
            ? `http://localhost:3000/${comment.profile_pic_url}` 
            : createInitialsAvatar(comment.author);
        
        return `
            <div class="comment-item-modern comment-fade-in">
                <div class="comment-author-modern">
                    <img src="${commentProfilePic}" alt="${comment.author}">
                    <div class="comment-author-info">
                        <strong><a href="view-profile.html?email=${comment.author_email}">${sanitizeHTML(comment.author)}</a></strong>
                        <small><i class="far fa-clock"></i> ${timeAgo(comment.created_at)}</small>
                    </div>
                </div>
                <div class="comment-content-modern">${sanitizeHTML(comment.content)}</div>
            </div>
        `;
    };

    // Create modern comment form
    const createModernCommentForm = (threadId) => {
        return `
            <form id="comment-form" class="comment-form-modern" data-thread-id="${threadId}">
                <textarea 
                    id="comment-content" 
                    class="comment-textarea-modern"
                    placeholder="Share your thoughts on this thread..." 
                    required
                ></textarea>
                <div class="comment-form-actions">
                    <span class="char-count" id="char-count">0/1000</span>
                    <button type="submit" class="comment-submit-btn">
                        <i class="fas fa-paper-plane"></i> Post Comment
                    </button>
                </div>
            </form>
        `;
    };

    // Create login prompt
    const createLoginPrompt = () => {
        return `
            <div class="login-prompt-modern">
                <p><i class="fas fa-sign-in-alt"></i> <a href="login.html">Log in</a> to join the discussion.</p>
            </div>
        `;
    };

    // Create no comments state
    const createNoCommentsState = () => {
        return `
            <div class="no-comments-modern">
                <i class="far fa-comment-dots"></i>
                <h4>No comments yet</h4>
                <p>Be the first to share your thoughts on this thread!</p>
            </div>
        `;
    };

    // Create loading state
    const createLoadingState = () => {
        return `
            <div class="loading-container modern-loading">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p>Loading thread details...</p>
            </div>
        `;
    };

    // Initialize quick actions
    const initializeQuickActions = (thread) => {
        // Bookmark button
        const bookmarkBtn = document.getElementById('bookmark-thread');
        bookmarkBtn.addEventListener('click', () => toggleBookmark(threadId));

        // Report button
        const reportBtn = document.getElementById('report-thread');
        reportBtn.addEventListener('click', () => reportThread(threadId));

        // Follow author button
        const followBtn = document.getElementById('follow-author');
        if (currentUser && currentUser.user_id !== thread.user_id) {
            followBtn.addEventListener('click', () => toggleFollowAuthor(thread.user_id));
        } else {
            followBtn.style.display = 'none';
        }
    };

    // Toggle bookmark
    const toggleBookmark = async (threadId) => {
        if (!currentUser) {
            showToast('Please log in to bookmark threads', 'error');
            return;
        }
        
        // Mock implementation
        const bookmarkBtn = document.getElementById('bookmark-thread');
        const icon = bookmarkBtn.querySelector('i');
        const isBookmarked = icon.classList.contains('fas');
        
        if (isBookmarked) {
            icon.className = 'far fa-bookmark';
            bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i> Bookmark';
            showToast('Thread removed from bookmarks', 'info');
        } else {
            icon.className = 'fas fa-bookmark';
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Bookmarked';
            showToast('Thread bookmarked!', 'success');
        }
    };

    // Report thread
    const reportThread = (threadId) => {
        if (!currentUser) {
            showToast('Please log in to report threads', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to report this thread for inappropriate content?')) {
            showToast('Thread reported. Thank you for helping keep our community safe.', 'success');
        }
    };

    // Toggle follow author
    const toggleFollowAuthor = async (authorId) => {
        const followBtn = document.getElementById('follow-author');
        const icon = followBtn.querySelector('i');
        const isFollowing = icon.classList.contains('fa-user-check');
        
        if (isFollowing) {
            icon.className = 'fas fa-user-plus';
            followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow Author';
            showToast('Unfollowed author', 'info');
        } else {
            icon.className = 'fas fa-user-check';
            followBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
            showToast('Now following this author!', 'success');
        }
    };

    // Update like status
    const updateLikeStatus = async (threadId) => {
        try {
            const status = await window.api.get(`/threads/${threadId}/like-status`);
            const likeBtn = document.querySelector(`[data-thread-id="${threadId}"].like-btn`);
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
            
            // Update sidebar stats
            document.getElementById('total-likes').textContent = countSpan.textContent;
            
        } catch (error) {
            console.error('Error toggling like:', error);
            showToast('Error updating like status', 'error');
        }
    };

    // Share thread with enhanced options
    window.shareThread = (threadId) => {
        const threadLink = `${window.location.origin}/thread-detail.html?id=${threadId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Check out this thread on AlumniConnect',
                text: 'I found this interesting thread on AlumniConnect',
                url: threadLink
            });
        } else {
            navigator.clipboard.writeText(threadLink).then(() => {
                showToast('Link copied to clipboard!', 'success');
            }).catch(() => {
                prompt('Copy this link:', threadLink);
            });
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

    // Edit thread
    window.editThread = (threadId) => {
        window.location.href = `edit-thread.html?id=${threadId}`;
    };

    // Enhanced image modal
    window.openImageModal = (imageUrl) => {
        const modal = document.createElement('div');
        modal.className = 'modal modern-image-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 95vw; max-height: 95vh; background: transparent; border: none; border-radius: 0;">
                <div class="image-modal-header" style="position: absolute; top: 20px; right: 20px; z-index: 1001;">
                    <button class="close-btn modern-close-btn" style="background: rgba(0,0,0,0.7); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh;">
                    <img src="${imageUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.background = 'rgba(0,0,0,0.9)';
        
        modal.querySelector('.close-btn').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        // Close on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    };

    // Sidebar interactions
    const setupSidebarInteractions = () => {
        // Trending topics click handlers
        document.querySelectorAll('.topic-item').forEach(item => {
            item.addEventListener('click', () => {
                const tag = item.querySelector('.topic-tag').textContent;
                // Navigate to threads page with search filter
                window.location.href = `threads.html?search=${encodeURIComponent(tag)}`;
            });
        });

        // Bookmark button functionality
        const bookmarkBtn = document.getElementById('bookmark-thread');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => {
                const icon = bookmarkBtn.querySelector('i');
                const isBookmarked = icon.classList.contains('fa-bookmark');
                
                if (isBookmarked) {
                    icon.className = 'far fa-bookmark';
                    bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i> Bookmark Thread';
                    bookmarkBtn.classList.remove('bookmarked');
                    showToast('Bookmark removed', 'info');
                } else {
                    icon.className = 'fas fa-bookmark';
                    bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Bookmarked';
                    bookmarkBtn.classList.add('bookmarked');
                    showToast('Thread bookmarked!', 'success');
                }
            });
        }

        // Follow author button
        const followBtn = document.getElementById('follow-author');
        if (followBtn) {
            followBtn.addEventListener('click', () => {
                const icon = followBtn.querySelector('i');
                const isFollowing = icon.classList.contains('fa-user-check');
                
                if (isFollowing) {
                    icon.className = 'fas fa-user-plus';
                    followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow Author';
                    showToast('Unfollowed author', 'info');
                } else {
                    icon.className = 'fas fa-user-check';
                    followBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
                    showToast('Now following this author!', 'success');
                }
            });
        }

        // Report thread button
        const reportBtn = document.getElementById('report-thread');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to report this thread? Our moderators will review it.')) {
                    showToast('Thread reported. Thank you for keeping our community safe.', 'success');
                    reportBtn.disabled = true;
                    reportBtn.innerHTML = '<i class="fas fa-check"></i> Reported';
                }
            });
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
    });

    // Handle comment form submission with character count
    document.addEventListener('input', (e) => {
        if (e.target.id === 'comment-content') {
            const charCount = e.target.value.length;
            const charCountSpan = document.getElementById('char-count');
            if (charCountSpan) {
                charCountSpan.textContent = `${charCount}/1000`;
                if (charCount > 1000) {
                    charCountSpan.style.color = 'var(--danger-color)';
                } else {
                    charCountSpan.style.color = 'var(--subtle-text-color)';
                }
            }
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
            
            if (content.length > 1000) {
                showToast('Comment is too long. Please keep it under 1000 characters.', 'error');
                return;
            }
            
            const submitBtn = e.target.querySelector('.comment-submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
            submitBtn.disabled = true;
            
            try {
                await window.api.post(`/threads/${threadId}/comments`, { content });
                showToast('Comment posted successfully!', 'success');
                document.getElementById('comment-content').value = '';
                document.getElementById('char-count').textContent = '0/1000';
                loadThread(); // Refresh thread with new comment
            } catch (error) {
                console.error('Error posting comment:', error);
                showToast('Error posting comment', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    });

    // Load the thread
    loadThread().then(() => {
        // Setup sidebar interactions after thread is loaded
        setupSidebarInteractions();
    });
});