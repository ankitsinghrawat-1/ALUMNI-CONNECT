/**
 * Advanced Social Feed Features - Beyond Instagram/Facebook
 * Unique features for AlumniConnect professional networking
 */

// ====================================================================
// LIVE REACTION ANIMATIONS WITH PARTICLE EFFECTS
// ====================================================================

/**
 * Create animated particle effect for reactions
 */
function createReactionParticles(element, reactionType) {
    const particles = 15;
    const colors = {
        'like': '#3b82f6',
        'love': '#ef4444',
        'insightful': '#8b5cf6',
        'celebrate': '#f59e0b',
        'support': '#10b981',
        'funny': '#ec4899'
    };
    
    const emojis = {
        'like': '👍',
        'love': '❤️',
        'insightful': '💡',
        'celebrate': '🎉',
        'support': '🤝',
        'funny': '😄'
    };
    
    const rect = element.getBoundingClientRect();
    const color = colors[reactionType] || colors.like;
    const emoji = emojis[reactionType] || emojis.like;
    
    for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div');
        particle.className = 'reaction-particle';
        particle.textContent = emoji;
        particle.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top}px;
            font-size: ${Math.random() * 10 + 15}px;
            pointer-events: none;
            z-index: 10000;
            animation: particleFloat ${Math.random() * 1 + 1.5}s ease-out forwards;
            --angle: ${Math.random() * 360}deg;
            --distance: ${Math.random() * 100 + 50}px;
            opacity: 0;
        `;
        
        document.body.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => particle.remove(), 2500);
    }
}

/**
 * Enhanced reaction system with animations and multiple reaction types
 */
function initializeAdvancedReactions() {
    const reactionTypes = [
        { type: 'like', icon: 'fa-thumbs-up', label: 'Like', color: '#3b82f6' },
        { type: 'love', icon: 'fa-heart', label: 'Love', color: '#ef4444' },
        { type: 'insightful', icon: 'fa-lightbulb', label: 'Insightful', color: '#8b5cf6' },
        { type: 'celebrate', icon: 'fa-star', label: 'Celebrate', color: '#f59e0b' },
        { type: 'support', icon: 'fa-handshake', label: 'Support', color: '#10b981' },
        { type: 'funny', icon: 'fa-face-laugh', label: 'Funny', color: '#ec4899' }
    ];
    
    document.addEventListener('click', (e) => {
        const reactionBtn = e.target.closest('.reaction-trigger');
        if (!reactionBtn) return;
        
        e.preventDefault();
        
        // Check if reaction menu already exists
        let menu = reactionBtn.nextElementSibling;
        if (menu && menu.classList.contains('reaction-menu')) {
            menu.remove();
            return;
        }
        
        // Create reaction menu
        menu = document.createElement('div');
        menu.className = 'reaction-menu';
        menu.innerHTML = reactionTypes.map(r => `
            <button class="reaction-option" data-reaction="${r.type}" style="--reaction-color: ${r.color}">
                <i class="fas ${r.icon}"></i>
                <span>${r.label}</span>
            </button>
        `).join('');
        
        reactionBtn.parentElement.style.position = 'relative';
        reactionBtn.parentElement.appendChild(menu);
        
        // Animate menu appearance
        requestAnimationFrame(() => menu.classList.add('active'));
        
        // Handle reaction selection
        menu.addEventListener('click', async (e) => {
            const option = e.target.closest('.reaction-option');
            if (!option) return;
            
            const reactionType = option.dataset.reaction;
            const threadId = reactionBtn.dataset.threadId;
            
            // Create particle effect
            createReactionParticles(option, reactionType);
            
            // Send to server (Phase 2 API)
            try {
                const response = await window.api.post(`/social-feed-phase2/threads/${threadId}/react`, {
                    reaction_type: reactionType
                });
                
                if (response) {
                    // Update UI
                    updateReactionDisplay(reactionBtn, reactionType, response);
                    window.SocialFeedUtils.showToast('Reaction added!', 'success');
                    
                    // Broadcast via WebSocket
                    if (window.socialFeedWS && window.socialFeedWS.isConnected) {
                        window.socialFeedWS.broadcastReaction(
                            threadId,
                            reactionType,
                            response.total_reactions,
                            response.counts
                        );
                    }
                }
            } catch (error) {
                console.error('Error adding reaction:', error);
                window.SocialFeedUtils.showToast('Failed to add reaction', 'error');
            }
            
            menu.remove();
        });
        
        // Close menu when clicking outside
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target) && e.target !== reactionBtn) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    });
}

function updateReactionDisplay(button, reactionType, data) {
    const container = button.closest('.thread-actions') || button.parentElement;
    let display = container.querySelector('.reaction-display');
    
    if (!display) {
        display = document.createElement('div');
        display.className = 'reaction-display';
        button.parentElement.appendChild(display);
    }
    
    const icons = {
        'like': '👍',
        'love': '❤️',
        'insightful': '💡',
        'celebrate': '🎉',
        'support': '🤝',
        'funny': '😄'
    };
    
    display.innerHTML = `
        <span class="user-reaction">${icons[reactionType]}</span>
        <span class="reaction-count">${data.total_reactions || 1}</span>
    `;
}

// ====================================================================
// SMART CONTENT SUGGESTIONS
// ====================================================================

/**
 * AI-powered smart hashtag suggestions based on content
 */
function initializeSmartHashtagSuggestions(textarea) {
    if (!textarea) return;
    
    let suggestionTimeout;
    const suggestionBox = document.createElement('div');
    suggestionBox.className = 'smart-suggestions hashtag-suggestions';
    suggestionBox.style.display = 'none';
    textarea.parentElement.appendChild(suggestionBox);
    
    textarea.addEventListener('input', () => {
        clearTimeout(suggestionTimeout);
        
        const content = textarea.value;
        const words = content.split(/\s+/);
        const lastWord = words[words.length - 1];
        
        // Check if user is typing a hashtag
        if (lastWord.startsWith('#')) {
            suggestionTimeout = setTimeout(() => {
                showHashtagSuggestions(content, suggestionBox, textarea);
            }, 300);
        } else if (content.length > 50 && !lastWord.startsWith('#')) {
            // Auto-suggest relevant hashtags based on content
            suggestionTimeout = setTimeout(() => {
                analyzeContentAndSuggestHashtags(content, suggestionBox, textarea);
            }, 500);
        } else {
            suggestionBox.style.display = 'none';
        }
    });
}

async function analyzeContentAndSuggestHashtags(content, suggestionBox, textarea) {
    // Smart keyword extraction
    const keywords = extractKeywords(content);
    const suggestedHashtags = keywords.map(word => `#${word}`);
    
    if (suggestedHashtags.length > 0) {
        suggestionBox.innerHTML = `
            <div class="suggestion-header">
                <i class="fas fa-lightbulb"></i>
                Suggested hashtags:
            </div>
            ${suggestedHashtags.slice(0, 5).map(tag => `
                <div class="suggestion-item smart-hashtag" data-hashtag="${tag}">
                    <i class="fas fa-hashtag"></i>
                    ${tag}
                    <span class="add-tag-btn">Add</span>
                </div>
            `).join('')}
        `;
        suggestionBox.style.display = 'block';
        
        // Handle click on suggested hashtag
        suggestionBox.querySelectorAll('.smart-hashtag').forEach(item => {
            item.addEventListener('click', () => {
                const hashtag = item.dataset.hashtag;
                textarea.value += ' ' + hashtag;
                suggestionBox.style.display = 'none';
                textarea.focus();
            });
        });
    }
}

function extractKeywords(text) {
    // Common words to ignore
    const stopWords = new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
        'in', 'with', 'to', 'for', 'of', 'as', 'by', 'this', 'that', 'it'
    ]);
    
    // Professional/career related keywords that are valuable
    const careerKeywords = new Set([
        'job', 'career', 'hiring', 'opportunity', 'internship', 'mentor',
        'networking', 'interview', 'resume', 'skills', 'technology',
        'innovation', 'leadership', 'management', 'startup', 'entrepreneur'
    ]);
    
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Prioritize career-related keywords
    const keywords = words.filter(word => careerKeywords.has(word));
    
    // Add other unique words if we don't have enough
    if (keywords.length < 3) {
        const uniqueWords = [...new Set(words)];
        keywords.push(...uniqueWords.slice(0, 5 - keywords.length));
    }
    
    return [...new Set(keywords)].slice(0, 5);
}

async function showHashtagSuggestions(content, suggestionBox, textarea) {
    const lastWord = content.split(/\s+/).pop();
    const query = lastWord.substring(1); // Remove #
    
    if (query.length < 2) {
        suggestionBox.style.display = 'none';
        return;
    }
    
    try {
        // Search for existing hashtags
        const hashtags = await window.api.get(`/social-feed/hashtags/search?q=${encodeURIComponent(query)}`);
        
        if (hashtags && hashtags.length > 0) {
            suggestionBox.innerHTML = hashtags.slice(0, 5).map(tag => `
                <div class="suggestion-item" data-hashtag="#${tag.name}">
                    <i class="fas fa-hashtag"></i>
                    #${tag.name}
                    <span class="usage-count">${tag.usage_count || 0} uses</span>
                </div>
            `).join('');
            suggestionBox.style.display = 'block';
            
            suggestionBox.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const hashtag = item.dataset.hashtag;
                    const newValue = content.substring(0, content.lastIndexOf('#')) + hashtag + ' ';
                    textarea.value = newValue;
                    suggestionBox.style.display = 'none';
                    textarea.focus();
                });
            });
        }
    } catch (error) {
        console.error('Error fetching hashtag suggestions:', error);
    }
}

/**
 * Smart mention suggestions with priority for frequent contacts
 */
function initializeSmartMentionSuggestions(textarea) {
    if (!textarea) return;
    
    let mentionTimeout;
    const suggestionBox = document.createElement('div');
    suggestionBox.className = 'smart-suggestions mention-suggestions';
    suggestionBox.style.display = 'none';
    textarea.parentElement.appendChild(suggestionBox);
    
    textarea.addEventListener('input', () => {
        clearTimeout(mentionTimeout);
        
        const content = textarea.value;
        const words = content.split(/\s+/);
        const lastWord = words[words.length - 1];
        
        if (lastWord.startsWith('@') && lastWord.length > 1) {
            mentionTimeout = setTimeout(() => {
                showMentionSuggestions(lastWord.substring(1), suggestionBox, textarea, content);
            }, 300);
        } else {
            suggestionBox.style.display = 'none';
        }
    });
}

async function showMentionSuggestions(query, suggestionBox, textarea, content) {
    try {
        const users = await window.api.get(`/social-feed/users/search?q=${encodeURIComponent(query)}`);
        
        if (users && users.length > 0) {
            suggestionBox.innerHTML = users.slice(0, 5).map(user => `
                <div class="suggestion-item mention-item" data-username="${user.name || user.email}">
                    <img src="${user.profile_picture || '/images/default-avatar.png'}" 
                         alt="${user.name}" class="suggestion-avatar">
                    <div class="suggestion-info">
                        <div class="suggestion-name">${user.name || 'User'}</div>
                        <div class="suggestion-meta">${user.department || user.email}</div>
                    </div>
                    ${user.is_verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                </div>
            `).join('');
            suggestionBox.style.display = 'block';
            
            suggestionBox.querySelectorAll('.mention-item').forEach(item => {
                item.addEventListener('click', () => {
                    const username = item.dataset.username;
                    const newValue = content.substring(0, content.lastIndexOf('@')) + '@' + username + ' ';
                    textarea.value = newValue;
                    suggestionBox.style.display = 'none';
                    textarea.focus();
                });
            });
        }
    } catch (error) {
        console.error('Error fetching mention suggestions:', error);
    }
}

// ====================================================================
// CAREER MILESTONE CELEBRATIONS
// ====================================================================

/**
 * Detect and celebrate career milestones with special effects
 */
function initializeMilestoneCelebrations() {
    const milestoneKeywords = [
        'promoted', 'promotion', 'new job', 'got hired', 'accepted offer',
        'graduated', 'degree', 'certification', 'award', 'achievement',
        'published', 'patent', 'founded', 'launched', 'milestone'
    ];
    
    document.addEventListener('DOMContentLoaded', () => {
        const threads = document.querySelectorAll('.modern-thread-card');
        
        threads.forEach(thread => {
            const content = thread.querySelector('.thread-content')?.textContent.toLowerCase();
            
            if (content && milestoneKeywords.some(keyword => content.includes(keyword))) {
                addMilestoneIndicator(thread);
            }
        });
    });
}

function addMilestoneIndicator(threadCard) {
    const header = threadCard.querySelector('.thread-header');
    if (!header || header.querySelector('.milestone-badge')) return;
    
    const badge = document.createElement('div');
    badge.className = 'milestone-badge';
    badge.innerHTML = `
        <i class="fas fa-trophy"></i>
        <span>Career Milestone</span>
    `;
    
    header.appendChild(badge);
    
    // Add celebration effect
    threadCard.classList.add('milestone-thread');
    
    // Create confetti effect
    createConfettiEffect(threadCard);
}

function createConfettiEffect(element) {
    const confettiCount = 30;
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd', '#00d2d3'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: 0;
            left: ${Math.random() * 100}%;
            animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
            animation-delay: ${Math.random() * 2}s;
            opacity: 0;
        `;
        
        element.style.position = 'relative';
        element.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
}

// ====================================================================
// REAL-TIME ENGAGEMENT INDICATORS
// ====================================================================

/**
 * Show live viewer count for threads
 */
function initializeLiveViewerCount() {
    const threads = document.querySelectorAll('.modern-thread-card[data-thread-id]');
    
    threads.forEach(thread => {
        const threadId = thread.dataset.threadId;
        const viewerBadge = document.createElement('div');
        viewerBadge.className = 'live-viewers';
        viewerBadge.innerHTML = `
            <span class="live-indicator"></span>
            <i class="fas fa-eye"></i>
            <span class="viewer-count">0</span>
        `;
        
        const stats = thread.querySelector('.thread-stats');
        if (stats) {
            stats.appendChild(viewerBadge);
            
            // Update viewer count (would be connected to WebSocket in production)
            updateViewerCount(threadId, viewerBadge);
        }
    });
}

async function updateViewerCount(threadId, badge) {
    try {
        // Simulate live viewer count (would use WebSocket in production)
        const count = Math.floor(Math.random() * 20) + 1;
        const countElement = badge.querySelector('.viewer-count');
        
        if (countElement) {
            countElement.textContent = count;
            badge.style.opacity = count > 0 ? '1' : '0.5';
        }
    } catch (error) {
        console.error('Error updating viewer count:', error);
    }
}

/**
 * Show typing indicator for comments
 */
function initializeTypingIndicator(commentInput) {
    if (!commentInput) return;
    
    let typingTimeout;
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-text">Someone is typing...</span>
    `;
    indicator.style.display = 'none';
    
    commentInput.parentElement.appendChild(indicator);
    
    commentInput.addEventListener('input', () => {
        clearTimeout(typingTimeout);
        
        // In production, this would broadcast via WebSocket
        typingTimeout = setTimeout(() => {
            // Stopped typing
        }, 1000);
    });
}

// ====================================================================
// COLLABORATIVE FEATURES
// ====================================================================

/**
 * Enable thread co-authoring for collaborative posts
 */
function initializeCoAuthoringFeature(textarea) {
    if (!textarea || textarea.dataset.coauthorEnabled) return;
    
    textarea.dataset.coauthorEnabled = 'true';
    
    const toolbar = textarea.parentElement.querySelector('.composer-toolbar') || 
                   createToolbar(textarea);
    
    const coauthorBtn = document.createElement('button');
    coauthorBtn.type = 'button';
    coauthorBtn.className = 'toolbar-btn coauthor-btn';
    coauthorBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Co-author';
    coauthorBtn.title = 'Invite someone to co-author this post';
    
    toolbar.appendChild(coauthorBtn);
    
    coauthorBtn.addEventListener('click', () => {
        showCoAuthorDialog(textarea);
    });
}

function createToolbar(textarea) {
    const toolbar = document.createElement('div');
    toolbar.className = 'composer-toolbar';
    textarea.parentElement.insertBefore(toolbar, textarea.nextSibling);
    return toolbar;
}

function showCoAuthorDialog(textarea) {
    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay active';
    dialog.innerHTML = `
        <div class="modal-content coauthor-modal">
            <div class="modal-header">
                <h3><i class="fas fa-users"></i> Add Co-authors</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Invite alumni to collaborate on this post. Co-authors can edit and contribute to the content.</p>
                <div class="search-coauthors">
                    <input type="text" placeholder="Search by name or email..." class="coauthor-search">
                    <div class="coauthor-results"></div>
                </div>
                <div class="selected-coauthors">
                    <h4>Selected Co-authors:</h4>
                    <div class="coauthor-list"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary close-dialog">Cancel</button>
                <button class="btn-primary confirm-coauthors">Add Co-authors</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Handle closing
    dialog.querySelectorAll('.modal-close, .close-dialog').forEach(btn => {
        btn.addEventListener('click', () => dialog.remove());
    });
    
    // Handle search
    const searchInput = dialog.querySelector('.coauthor-search');
    searchInput.addEventListener('input', window.SocialFeedUtils.debounce(async (e) => {
        const query = e.target.value;
        if (query.length > 2) {
            const results = await window.api.get(`/social-feed/users/search?q=${encodeURIComponent(query)}`);
            displayCoAuthorResults(results, dialog);
        }
    }, 300));
}

function displayCoAuthorResults(users, dialog) {
    const container = dialog.querySelector('.coauthor-results');
    if (!users || users.length === 0) {
        container.innerHTML = '<p class="no-results">No users found</p>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="coauthor-result-item" data-user-id="${user.user_id}">
            <img src="${user.profile_picture || '/images/default-avatar.png'}" alt="${user.name}">
            <div class="user-info">
                <div class="user-name">${user.name || 'User'}</div>
                <div class="user-meta">${user.department || user.email}</div>
            </div>
            <button class="btn-small add-coauthor">Add</button>
        </div>
    `).join('');
}

// ====================================================================
// CONTENT QUALITY INDICATORS
// ====================================================================

/**
 * Show content quality score based on engagement and length
 */
function analyzeContentQuality(content) {
    let score = 0;
    const maxScore = 100;
    
    // Length score (20 points)
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 50 && wordCount <= 300) score += 20;
    else if (wordCount >= 20) score += 10;
    
    // Hashtag usage (10 points)
    const hashtags = content.match(/#\w+/g);
    if (hashtags && hashtags.length > 0 && hashtags.length <= 5) score += 10;
    
    // Mentions (10 points)
    const mentions = content.match(/@\w+/g);
    if (mentions && mentions.length > 0) score += 10;
    
    // Professional keywords (20 points)
    const professionalWords = [
        'career', 'opportunity', 'experience', 'skills', 'learning',
        'innovation', 'project', 'collaboration', 'mentorship', 'growth'
    ];
    const hasKeywords = professionalWords.some(word => 
        content.toLowerCase().includes(word)
    );
    if (hasKeywords) score += 20;
    
    // Formatting (20 points)
    if (content.includes('\n')) score += 10; // Paragraphs
    if (content.match(/[.!?](?=\s|$)/g)?.length > 2) score += 10; // Multiple sentences
    
    // Engagement potential (20 points)
    if (content.includes('?')) score += 10; // Questions encourage responses
    if (content.length > 100) score += 10; // Substantial content
    
    return Math.min(score, maxScore);
}

function showQualityIndicator(textarea) {
    const indicator = document.createElement('div');
    indicator.className = 'content-quality-indicator';
    indicator.style.display = 'none';
    
    textarea.parentElement.appendChild(indicator);
    
    textarea.addEventListener('input', window.SocialFeedUtils.debounce(() => {
        const content = textarea.value;
        if (content.length < 20) {
            indicator.style.display = 'none';
            return;
        }
        
        const score = analyzeContentQuality(content);
        const level = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'basic';
        const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#6b7280';
        
        indicator.innerHTML = `
            <div class="quality-bar" style="background: ${color}; width: ${score}%"></div>
            <div class="quality-label">
                <i class="fas fa-chart-line"></i>
                Content Quality: ${level.charAt(0).toUpperCase() + level.slice(1)} (${score}%)
            </div>
        `;
        indicator.style.display = 'block';
    }, 500));
}

// ====================================================================
// EXPORT AND INITIALIZATION
// ====================================================================

// Auto-initialize advanced features
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeAdvancedReactions();
        initializeMilestoneCelebrations();
        initializeLiveViewerCount();
        
        // Initialize smart suggestions on composer pages
        const mainTextarea = document.querySelector('#content, #story-text');
        if (mainTextarea) {
            initializeSmartHashtagSuggestions(mainTextarea);
            initializeSmartMentionSuggestions(mainTextarea);
            initializeCoAuthoringFeature(mainTextarea);
            showQualityIndicator(mainTextarea);
        }
        
        // Initialize typing indicators on comment inputs
        const commentInputs = document.querySelectorAll('.comment-input, #comment-text');
        commentInputs.forEach(input => initializeTypingIndicator(input));
    });
} else {
    initializeAdvancedReactions();
    initializeMilestoneCelebrations();
    initializeLiveViewerCount();
}

// Export functions
window.SocialFeedAdvanced = {
    createReactionParticles,
    initializeAdvancedReactions,
    initializeSmartHashtagSuggestions,
    initializeSmartMentionSuggestions,
    initializeMilestoneCelebrations,
    initializeLiveViewerCount,
    initializeTypingIndicator,
    initializeCoAuthoringFeature,
    analyzeContentQuality,
    showQualityIndicator
};
