// Story Viewer - Comprehensive Functionality
class StoryViewer {
    constructor() {
        this.currentStories = [];
        this.currentIndex = 0;
        this.currentUser = null;
        this.storyTimer = null;
        this.storyDuration = 15000; // 15 seconds
        this.isPaused = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.loadStories();
        this.bindEvents();
        
        // Add fade-in animation
        setTimeout(() => {
            document.querySelector('.stories-container')?.classList.add('fade-in');
        }, 100);
    }

    async loadCurrentUser() {
        try {
            this.currentUser = await window.api.get('/users/profile');
        } catch (error) {
        }
    }

    async loadStories() {
        const loadingElement = document.getElementById('loading-stories');
        const storiesGrid = document.getElementById('stories-grid');
        const emptyState = document.getElementById('empty-stories');
        
        try {
            loadingElement.style.display = 'block';
            storiesGrid.innerHTML = '';
            
            const stories = await window.api.get('/stories');
            
            if (stories.length === 0) {
                loadingElement.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }
            
            this.currentStories = stories;
            this.renderStoriesGrid(stories);
            
            loadingElement.style.display = 'none';
            emptyState.style.display = 'none';
            
        } catch (error) {
            loadingElement.style.display = 'none';
            this.showNotification('Failed to load stories', 'error');
        }
    }

    renderStoriesGrid(stories) {
        const storiesGrid = document.getElementById('stories-grid');
        
        storiesGrid.innerHTML = stories.map((story, index) => `
            <div class="story-card" onclick="storyViewer.openStory(${index})">
                <div class="story-card-preview ${story.story_type}-story" 
                     style="${this.getStoryPreviewStyle(story)}">
                    ${this.getStoryPreviewContent(story)}
                    <div class="story-type-badge">
                        <i class="fas fa-${this.getStoryTypeIcon(story.story_type)}"></i>
                    </div>
                </div>
                <div class="story-card-info">
                    <div class="story-card-author">
                        <div class="story-card-avatar">
                            ${story.profile_pic_url ? 
                                `<img src="http://localhost:3000/${story.profile_pic_url}" alt="${story.author}">` :
                                story.author.charAt(0).toUpperCase()
                            }
                        </div>
                        <div class="story-card-author-info">
                            <h4>${story.author}</h4>
                            <span>${this.formatTimeAgo(story.created_at)}</span>
                        </div>
                    </div>
                    <div class="story-card-stats">
                        <div class="story-card-stat">
                            <i class="fas fa-eye"></i>
                            <span>${story.view_count || 0}</span>
                        </div>
                        <div class="story-card-stat">
                            <i class="fas fa-heart"></i>
                            <span>${story.like_count || 0}</span>
                        </div>
                        ${story.story_type === 'poll' ? `
                            <div class="story-card-stat">
                                <i class="fas fa-poll"></i>
                                <span>Poll</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getStoryPreviewStyle(story) {
        if (story.story_type === 'text') {
            return `background: ${this.createGradient(story.background_color || '#667eea')};`;
        }
        return '';
    }

    getStoryPreviewContent(story) {
        switch (story.story_type) {
            case 'text':
                return `<div class="story-text" style="color: ${story.text_color || '#ffffff'}">${story.content || 'Text Story'}</div>`;
            case 'photo':
                return story.media_url ? 
                    `<img src="http://localhost:3000/${story.media_url}" alt="Story photo">` :
                    '<div class="story-text">📷 Photo Story</div>';
            case 'video':
                return story.media_url ? 
                    `<video muted><source src="http://localhost:3000/${story.media_url}"></video>` :
                    '<div class="story-text">🎥 Video Story</div>';
            case 'poll':
                return `
                    <div class="poll-icon">
                        <i class="fas fa-poll"></i>
                    </div>
                    <div class="poll-question">${story.poll_question || 'Poll Question'}</div>
                `;
            default:
                return '<div class="story-text">Story</div>';
        }
    }

    getStoryTypeIcon(type) {
        const icons = {
            text: 'font',
            photo: 'image',
            video: 'video',
            poll: 'poll'
        };
        return icons[type] || 'circle';
    }

    createGradient(baseColor) {
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        return `linear-gradient(135deg, ${baseColor} 0%, rgba(${r}, ${g}, ${b}, 0.8) 50%, rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}, 0.9) 100%)`;
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const storyTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - storyTime) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }

    openStory(index) {
        this.currentIndex = index;
        this.showStoryViewer();
        this.displayStory();
        this.startStoryTimer();
        this.markAsViewed();
    }

    showStoryViewer() {
        document.getElementById('story-viewer').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add animation class
        setTimeout(() => {
            document.querySelector('.story-viewer-container')?.classList.add('slide-up');
        }, 50);
    }

    hideStoryViewer() {
        document.getElementById('story-viewer').style.display = 'none';
        document.body.style.overflow = '';
        this.stopStoryTimer();
        this.isPaused = false;
        
        // Hide reply input if visible
        document.getElementById('story-reply-input').style.display = 'none';
    }

    displayStory() {
        const story = this.currentStories[this.currentIndex];
        if (!story) return;

        // Update header
        document.getElementById('story-username').textContent = story.author;
        document.getElementById('story-timestamp').textContent = this.formatTimeAgo(story.created_at);
        
        const userImage = document.getElementById('story-user-image');
        if (story.profile_pic_url) {
            userImage.src = `http://localhost:3000/${story.profile_pic_url}`;
            userImage.style.display = 'block';
        } else {
            userImage.style.display = 'none';
            userImage.parentElement.innerHTML = story.author.charAt(0).toUpperCase();
        }

        // Update content
        const contentContainer = document.getElementById('story-content-container');
        contentContainer.className = `story-content-container ${story.story_type}-story`;
        
        contentContainer.innerHTML = this.getStoryViewerContent(story);

        // Update stats
        document.querySelector('#story-view-count span').textContent = story.view_count || 0;

        // Update like button state
        this.updateLikeButton();

        // Reset progress bar
        this.resetProgressBar();

        // Show delete option if owner
        const deleteOption = document.getElementById('delete-story-option');
        if (this.currentUser && story.user_id === this.currentUser.user_id) {
            deleteOption.style.display = 'flex';
        } else {
            deleteOption.style.display = 'none';
        }
    }

    getStoryViewerContent(story) {
        switch (story.story_type) {
            case 'text':
                return `
                    <div class="story-text" style="color: ${story.text_color || '#ffffff'}; ${this.getTextEffectStyle(story.text_effect)}">
                        ${story.content}
                    </div>
                `;
            case 'photo':
                return story.media_url ? 
                    `<img src="http://localhost:3000/${story.media_url}" alt="Story photo">` : '';
            case 'video':
                return story.media_url ? 
                    `<video autoplay muted controls><source src="http://localhost:3000/${story.media_url}"></video>` : '';
            case 'poll':
                return this.renderPollContent(story);
            default:
                return `<div class="story-text">${story.content || 'Story content'}</div>`;
        }
    }

    getTextEffectStyle(effect) {
        switch (effect) {
            case 'shadow':
                return 'text-shadow: 2px 2px 4px rgba(0,0,0,0.5);';
            case 'outline':
                return '-webkit-text-stroke: 1px rgba(0,0,0,0.5);';
            case 'glow':
                return 'text-shadow: 0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.6);';
            default:
                return '';
        }
    }

    renderPollContent(story) {
        const pollOptions = JSON.parse(story.poll_options || '[]');
        const pollVotes = story.poll_votes || [];
        
        const totalVotes = pollVotes.reduce((sum, vote) => sum + vote.vote_count, 0);
        
        return `
            <div class="poll-story-content">
                <div class="poll-question">${story.poll_question}</div>
                <div class="poll-options">
                    ${pollOptions.map((option, index) => {
                        const voteCount = pollVotes.find(v => v.option_index === index)?.vote_count || 0;
                        const percentage = totalVotes > 0 ? (voteCount / totalVotes * 100) : 0;
                        
                        return `
                            <div class="poll-option" onclick="storyViewer.votePoll(${index})">
                                ${option}
                            </div>
                        `;
                    }).join('')}
                </div>
                ${totalVotes > 0 ? `
                    <div class="poll-results">
                        <p>Results (${totalVotes} votes):</p>
                        ${pollOptions.map((option, index) => {
                            const voteCount = pollVotes.find(v => v.option_index === index)?.vote_count || 0;
                            const percentage = totalVotes > 0 ? (voteCount / totalVotes * 100) : 0;
                            
                            return `
                                <div class="poll-result-item">
                                    <span>${option}</span>
                                    <span>${percentage.toFixed(1)}%</span>
                                    <div class="poll-result-bar">
                                        <div class="poll-result-fill" style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    async votePoll(optionIndex) {
        const story = this.currentStories[this.currentIndex];
        
        try {
            await window.api.post(`/stories/${story.story_id}/vote`, {
                option_index: optionIndex
            });
            
            this.showNotification('Vote recorded!', 'success');
            
            // Refresh story data
            const updatedStory = await window.api.get(`/stories/${story.story_id}`);
            this.currentStories[this.currentIndex] = updatedStory;
            this.displayStory();
            
        } catch (error) {
            this.showNotification(error.message || 'Failed to record vote', 'error');
        }
    }

    startStoryTimer() {
        this.stopStoryTimer(); // Clear any existing timer
        
        this.storyTimer = setTimeout(() => {
            this.nextStory();
        }, this.storyDuration);
    }

    stopStoryTimer() {
        if (this.storyTimer) {
            clearTimeout(this.storyTimer);
            this.storyTimer = null;
        }
    }

    resetProgressBar() {
        const progressBar = document.getElementById('story-progress-bar');
        progressBar.style.animation = 'none';
        
        setTimeout(() => {
            progressBar.style.animation = `storyProgress ${this.storyDuration}ms linear forwards`;
        }, 10);
    }

    pauseStory() {
        this.isPaused = true;
        this.stopStoryTimer();
        
        const progressBar = document.getElementById('story-progress-bar');
        progressBar.style.animationPlayState = 'paused';
    }

    resumeStory() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        this.startStoryTimer();
        
        const progressBar = document.getElementById('story-progress-bar');
        progressBar.style.animationPlayState = 'running';
    }

    nextStory() {
        if (this.currentIndex < this.currentStories.length - 1) {
            this.currentIndex++;
            this.displayStory();
            this.startStoryTimer();
            this.markAsViewed();
        } else {
            this.hideStoryViewer();
        }
    }

    prevStory() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayStory();
            this.startStoryTimer();
            this.markAsViewed();
        }
    }

    async markAsViewed() {
        const story = this.currentStories[this.currentIndex];
        if (!story) return;
        
        try {
            await window.api.post(`/stories/${story.story_id}/view`);
            
            // Update view count
            story.view_count = (story.view_count || 0) + 1;
            document.querySelector('#story-view-count span').textContent = story.view_count;
            
        } catch (error) {
        }
    }

    async toggleLike() {
        const story = this.currentStories[this.currentIndex];
        if (!story) return;
        
        try {
            const response = await window.api.post(`/stories/${story.story_id}/like`);
            
            story.liked = response.liked;
            story.like_count = response.liked ? 
                (story.like_count || 0) + 1 : 
                Math.max(0, (story.like_count || 0) - 1);
            
            this.updateLikeButton();
            this.showNotification(response.liked ? 'Liked!' : 'Unliked', 'success');
            
        } catch (error) {
            this.showNotification('Failed to update like', 'error');
        }
    }

    updateLikeButton() {
        const story = this.currentStories[this.currentIndex];
        const likeBtn = document.getElementById('like-story-btn');
        
        if (story.liked) {
            likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
            likeBtn.classList.add('liked');
        } else {
            likeBtn.innerHTML = '<i class="far fa-heart"></i>';
            likeBtn.classList.remove('liked');
        }
    }

    toggleReplyInput() {
        const replyInput = document.getElementById('story-reply-input');
        const isVisible = replyInput.style.display !== 'none';
        
        replyInput.style.display = isVisible ? 'none' : 'flex';
        
        if (!isVisible) {
            document.getElementById('reply-text-input').focus();
        }
    }

    async sendReply() {
        const replyText = document.getElementById('reply-text-input').value.trim();
        if (!replyText) return;
        
        const story = this.currentStories[this.currentIndex];
        
        try {
            await window.api.post(`/stories/${story.story_id}/reply`, {
                content: replyText
            });
            
            document.getElementById('reply-text-input').value = '';
            document.getElementById('story-reply-input').style.display = 'none';
            
            this.showNotification('Reply sent!', 'success');
            
        } catch (error) {
            this.showNotification('Failed to send reply', 'error');
        }
    }

    async showStoryLikes() {
        const story = this.currentStories[this.currentIndex];
        
        try {
            const likes = await window.api.get(`/stories/${story.story_id}/likes`);
            this.renderLikesModal(likes);
        } catch (error) {
            this.showNotification('Failed to load likes', 'error');
        }
    }

    renderLikesModal(likes) {
        const likesList = document.getElementById('likes-list');
        
        if (likes.length === 0) {
            likesList.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--subtle-text-color);">No likes yet</p>';
        } else {
            likesList.innerHTML = likes.map(like => `
                <div class="like-item">
                    <div class="like-avatar">
                        ${like.profile_pic_url ? 
                            `<img src="http://localhost:3000/${like.profile_pic_url}" alt="${like.full_name}">` :
                            like.full_name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="like-info">
                        <h4>${like.full_name}</h4>
                        <span>${this.formatTimeAgo(like.created_at)}</span>
                    </div>
                </div>
            `).join('');
        }
        
        document.getElementById('story-likes-modal').style.display = 'flex';
    }

    async showStoryViewers() {
        const story = this.currentStories[this.currentIndex];
        
        // Check if current user owns the story
        if (!this.currentUser || story.user_id !== this.currentUser.user_id) {
            this.showNotification('You can only view your own story viewers', 'error');
            return;
        }
        
        try {
            const viewers = await window.api.get(`/stories/${story.story_id}/viewers`);
            this.renderViewersModal(viewers);
        } catch (error) {
            this.showNotification('Failed to load viewers', 'error');
        }
    }

    renderViewersModal(viewers) {
        const viewersList = document.getElementById('viewers-list');
        
        if (viewers.length === 0) {
            viewersList.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--subtle-text-color);">No views yet</p>';
        } else {
            viewersList.innerHTML = viewers.map(viewer => `
                <div class="viewer-item">
                    <div class="viewer-avatar">
                        ${viewer.profile_pic_url ? 
                            `<img src="http://localhost:3000/${viewer.profile_pic_url}" alt="${viewer.full_name}">` :
                            viewer.full_name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="viewer-info">
                        <h4>${viewer.full_name}</h4>
                        <span>${this.formatTimeAgo(viewer.viewed_at)}</span>
                    </div>
                </div>
            `).join('');
        }
        
        document.getElementById('story-viewers-modal').style.display = 'flex';
    }

    filterStories(filterType) {
        // Update active filter button
        document.querySelectorAll('.filter-option').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filterType}"]`).classList.add('active');
        
        let filteredStories;
        if (filterType === 'all') {
            filteredStories = this.currentStories;
        } else {
            filteredStories = this.currentStories.filter(story => story.story_type === filterType);
        }
        
        this.renderStoriesGrid(filteredStories);
    }

    showContextMenu(event, storyIndex) {
        event.preventDefault();
        event.stopPropagation();
        
        const contextMenu = document.getElementById('story-context-menu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        
        // Store current story index for context actions
        this.contextStoryIndex = storyIndex;
    }

    hideContextMenu() {
        document.getElementById('story-context-menu').style.display = 'none';
    }

    async deleteStory() {
        const story = this.currentStories[this.currentIndex];
        
        if (!this.currentUser || story.user_id !== this.currentUser.user_id) {
            this.showNotification('You can only delete your own stories', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this story?')) {
            return;
        }
        
        try {
            await window.api.delete(`/stories/${story.story_id}`);
            
            // Remove from current stories array
            this.currentStories.splice(this.currentIndex, 1);
            
            if (this.currentStories.length === 0) {
                this.hideStoryViewer();
                this.loadStories(); // Reload to show empty state
            } else {
                // Adjust index if needed
                if (this.currentIndex >= this.currentStories.length) {
                    this.currentIndex = this.currentStories.length - 1;
                }
                this.displayStory();
                this.startStoryTimer();
            }
            
            this.showNotification('Story deleted successfully', 'success');
            
        } catch (error) {
            this.showNotification('Failed to delete story', 'error');
        }
    }

    bindEvents() {
        // Filter buttons
        document.querySelectorAll('.filter-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterStories(btn.dataset.filter);
            });
        });

        // Filter toggle
        document.getElementById('filter-btn')?.addEventListener('click', () => {
            const filterSection = document.getElementById('stories-filter');
            const isVisible = filterSection.style.display !== 'none';
            filterSection.style.display = isVisible ? 'none' : 'block';
        });

        // Story viewer controls
        document.getElementById('close-story-btn')?.addEventListener('click', () => {
            this.hideStoryViewer();
        });

        document.getElementById('prev-story-btn')?.addEventListener('click', () => {
            this.prevStory();
        });

        document.getElementById('next-story-btn')?.addEventListener('click', () => {
            this.nextStory();
        });

        document.getElementById('like-story-btn')?.addEventListener('click', () => {
            this.toggleLike();
        });

        document.getElementById('reply-story-btn')?.addEventListener('click', () => {
            this.toggleReplyInput();
        });

        document.getElementById('send-reply-btn')?.addEventListener('click', () => {
            this.sendReply();
        });

        document.getElementById('story-view-count')?.addEventListener('click', () => {
            this.showStoryViewers();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('story-viewer').style.display === 'flex') {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.prevStory();
                        break;
                    case 'ArrowRight':
                    case ' ':
                        e.preventDefault();
                        this.nextStory();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.hideStoryViewer();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (document.getElementById('story-reply-input').style.display === 'flex') {
                            this.sendReply();
                        }
                        break;
                }
            }
        });

        // Touch/mouse controls for story viewer
        const storyContainer = document.getElementById('story-content-container');
        
        // Touch events
        storyContainer?.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.pauseStory();
        });

        storyContainer?.addEventListener('touchend', (e) => {
            this.resumeStory();
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            // Swipe detection
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.prevStory(); // Swipe right
                } else {
                    this.nextStory(); // Swipe left
                }
            } else if (Math.abs(deltaY) > 100) {
                if (deltaY < 0) {
                    // Swipe up - could trigger additional actions
                    this.showStoryLikes();
                } else {
                    // Swipe down - close story
                    this.hideStoryViewer();
                }
            } else {
                // Tap - pause/resume or advance
                this.nextStory();
            }
        });

        // Mouse events for desktop
        storyContainer?.addEventListener('mousedown', () => {
            this.pauseStory();
        });

        storyContainer?.addEventListener('mouseup', () => {
            this.resumeStory();
        });

        storyContainer?.addEventListener('click', () => {
            this.nextStory();
        });

        // Context menu
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.story-card')) {
                const storyCard = e.target.closest('.story-card');
                const storyIndex = Array.from(document.querySelectorAll('.story-card')).indexOf(storyCard);
                this.showContextMenu(e, storyIndex);
            }
        });

        document.addEventListener('click', () => {
            this.hideContextMenu();
        });

        // Reply input enter key
        document.getElementById('reply-text-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendReply();
            }
        });
    }

    showNotification(message, type = 'info') {
        // Use existing showToast function or fallback
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    }
}

// Global functions
window.closeLikesModal = () => {
    document.getElementById('story-likes-modal').style.display = 'none';
};

window.closeViewersModal = () => {
    document.getElementById('story-viewers-modal').style.display = 'none';
};

window.shareStory = () => {
    const story = window.storyViewer.currentStories[window.storyViewer.currentIndex];
    if (navigator.share) {
        navigator.share({
            title: `Story by ${story.author}`,
            text: story.content || 'Check out this story!',
            url: window.location.href
        });
    } else {
        // Fallback to copy URL
        navigator.clipboard.writeText(window.location.href);
        window.storyViewer.showNotification('Story URL copied to clipboard!', 'success');
    }
    window.storyViewer.hideContextMenu();
};

window.reportStory = () => {
    // Implement reporting functionality
    window.storyViewer.showNotification('Story reported. Thank you for helping keep our community safe.', 'success');
    window.storyViewer.hideContextMenu();
};

window.deleteStory = () => {
    window.storyViewer.deleteStory();
    window.storyViewer.hideContextMenu();
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.storyViewer = new StoryViewer();
});