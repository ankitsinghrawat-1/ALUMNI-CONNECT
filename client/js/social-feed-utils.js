/**
 * Professional Social Feed - Enhanced Utilities
 * Common functionality for all social feed pages
 */

// ====================================================================
// SEARCH AND FILTERING
// ====================================================================

/**
 * Debounce function for search input
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Initialize search functionality with debouncing
 */
function initializeSearch(searchInput, searchCallback) {
    if (!searchInput) return;
    
    const debouncedSearch = debounce((query) => {
        searchCallback(query);
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
}

/**
 * Initialize filter panel toggle
 */
function initializeFilterPanel() {
    const filterToggle = document.getElementById('filter-toggle');
    const filterPanel = document.getElementById('filter-panel');
    
    if (filterToggle && filterPanel) {
        filterToggle.addEventListener('click', () => {
            filterPanel.classList.toggle('active');
        });
    }
}

// ====================================================================
// INFINITE SCROLL
// ====================================================================

/**
 * Initialize infinite scroll for feed
 */
function initializeInfiniteScroll(loadMoreCallback) {
    let isLoading = false;
    let hasMore = true;
    
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !isLoading && hasMore) {
                    isLoading = true;
                    loadMoreCallback().then((result) => {
                        isLoading = false;
                        hasMore = result.hasMore;
                    });
                }
            });
        },
        { rootMargin: '100px' }
    );
    
    const sentinel = document.createElement('div');
    sentinel.className = 'infinite-scroll-sentinel';
    document.querySelector('.modern-feed')?.appendChild(sentinel);
    observer.observe(sentinel);
    
    return observer;
}

// ====================================================================
// SKELETON LOADERS
// ====================================================================

/**
 * Create skeleton loader for thread card
 */
function createThreadSkeleton() {
    return `
        <div class="skeleton-thread-card">
            <div class="skeleton-header">
                <div class="skeleton-avatar skeleton-loader"></div>
                <div class="skeleton-info">
                    <div class="skeleton-line short skeleton-loader"></div>
                    <div class="skeleton-line medium skeleton-loader"></div>
                </div>
            </div>
            <div class="skeleton-line long skeleton-loader"></div>
            <div class="skeleton-line long skeleton-loader"></div>
            <div class="skeleton-line medium skeleton-loader"></div>
        </div>
    `;
}

/**
 * Show skeleton loaders
 */
function showSkeletonLoaders(container, count = 3) {
    if (!container) return;
    
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        container.innerHTML += createThreadSkeleton();
    }
}

// ====================================================================
// EMPTY STATES
// ====================================================================

/**
 * Show empty state
 */
function showEmptyState(container, options = {}) {
    const {
        icon = 'fa-comments',
        title = 'No threads found',
        description = 'Be the first to start a discussion!',
        actionText = 'Create Thread',
        actionLink = 'add-thread.html'
    } = options;
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="fas ${icon}"></i>
            </div>
            <h3 class="empty-state-title">${title}</h3>
            <p class="empty-state-description">${description}</p>
            <a href="${actionLink}" class="empty-state-action">
                <i class="fas fa-plus"></i>
                ${actionText}
            </a>
        </div>
    `;
}

// ====================================================================
// REACTION SYSTEM
// ====================================================================

/**
 * Initialize reaction menu
 */
function initializeReactions(element) {
    if (!element) return;
    
    const reactionTypes = ['like', 'love', 'insightful', 'celebrate', 'support', 'funny'];
    
    element.addEventListener('click', async (e) => {
        const btn = e.target.closest('.modern-stat-btn[data-action="like"]');
        if (!btn) return;
        
        const threadId = btn.dataset.threadId;
        const currentReaction = btn.dataset.reaction;
        
        // Toggle like for now (can be extended to show reaction menu)
        try {
            const response = await fetch(`/api/threads/${threadId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                btn.classList.toggle('liked');
                const countSpan = btn.querySelector('span');
                const currentCount = parseInt(countSpan.textContent) || 0;
                countSpan.textContent = btn.classList.contains('liked') 
                    ? currentCount + 1 
                    : currentCount - 1;
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    });
}

// ====================================================================
// BOOKMARK FUNCTIONALITY
// ====================================================================

/**
 * Initialize bookmark functionality
 */
function initializeBookmarks(element) {
    if (!element) return;
    
    element.addEventListener('click', async (e) => {
        const btn = e.target.closest('.modern-stat-btn[data-action="bookmark"]');
        if (!btn) return;
        
        const threadId = btn.dataset.threadId;
        
        try {
            const response = await fetch(`/api/threads/${threadId}/bookmark`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                btn.classList.toggle('bookmarked');
                showToast(
                    btn.classList.contains('bookmarked') 
                        ? 'Thread bookmarked!' 
                        : 'Bookmark removed',
                    'success'
                );
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            showToast('Failed to bookmark thread', 'error');
        }
    });
}

// ====================================================================
// TOAST NOTIFICATIONS
// ====================================================================

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// ====================================================================
// DARK MODE TOGGLE
// ====================================================================

/**
 * Initialize dark mode toggle
 */
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (!darkModeToggle) return;
    
    const isDarkMode = localStorage.getItem('theme') === 'dark-mode';
    if (isDarkMode) {
        document.documentElement.classList.add('dark-mode');
    }
    
    darkModeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark-mode');
        const theme = document.documentElement.classList.contains('dark-mode') 
            ? 'dark-mode' 
            : 'light-mode';
        localStorage.setItem('theme', theme);
    });
}

// ====================================================================
// KEYBOARD SHORTCUTS
// ====================================================================

/**
 * Initialize keyboard shortcuts
 */
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.querySelector('.modern-search')?.focus();
        }
        
        // Ctrl/Cmd + N: New thread
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            window.location.href = 'add-thread.html';
        }
        
        // Ctrl/Cmd + Shift + S: New story
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
            e.preventDefault();
            window.location.href = 'add-story.html';
        }
    });
}

// ====================================================================
// IMAGE LAZY LOADING
// ====================================================================

/**
 * Initialize lazy loading for images
 */
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach((img) => {
            imageObserver.observe(img);
        });
    }
}

// ====================================================================
// HASHTAG AND MENTION PARSING
// ====================================================================

/**
 * Parse and linkify hashtags and mentions in text
 */
function parseContentLinks(text) {
    if (!text) return '';
    
    // Parse hashtags
    text = text.replace(/#(\w+)/g, '<a href="#" class="thread-hashtag" data-hashtag="$1">#$1</a>');
    
    // Parse mentions
    text = text.replace(/@(\w+)/g, '<a href="#" class="thread-mention" data-username="$1">@$1</a>');
    
    return text;
}

// ====================================================================
// TIME AGO FORMATTER
// ====================================================================

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'Just now';
}

// ====================================================================
// NUMBER FORMATTER
// ====================================================================

/**
 * Format large numbers (e.g., 1500 -> 1.5K)
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ====================================================================
// MEDIA LIGHTBOX
// ====================================================================

/**
 * Initialize media lightbox
 */
function initializeMediaLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'media-lightbox';
    lightbox.innerHTML = `
        <button class="lightbox-close">
            <i class="fas fa-times"></i>
        </button>
        <div class="lightbox-content"></div>
    `;
    document.body.appendChild(lightbox);
    
    document.addEventListener('click', (e) => {
        const media = e.target.closest('.modern-thread-media img, .modern-thread-media video');
        if (media) {
            const content = lightbox.querySelector('.lightbox-content');
            const clone = media.cloneNode(true);
            clone.style.cursor = 'default';
            content.innerHTML = '';
            content.appendChild(clone);
            lightbox.classList.add('active');
        }
    });
    
    lightbox.querySelector('.lightbox-close').addEventListener('click', () => {
        lightbox.classList.remove('active');
    });
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
}

// ====================================================================
// SHARE FUNCTIONALITY
// ====================================================================

/**
 * Initialize share functionality
 */
function initializeShareButtons() {
    document.addEventListener('click', async (e) => {
        const shareBtn = e.target.closest('[data-action="share"]');
        if (!shareBtn) return;
        
        const threadId = shareBtn.dataset.threadId;
        const url = `${window.location.origin}/thread-detail.html?id=${threadId}`;
        const title = 'Check out this thread on AlumniConnect';
        
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch (error) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(url);
                showToast('Link copied to clipboard!', 'success');
            } catch (error) {
                showToast('Failed to copy link', 'error');
            }
        }
    });
}

// ====================================================================
// INITIALIZATION
// ====================================================================

/**
 * Initialize all professional features
 */
function initializeProfessionalFeatures() {
    initializeFilterPanel();
    initializeDarkMode();
    initializeKeyboardShortcuts();
    initializeLazyLoading();
    initializeMediaLightbox();
    initializeShareButtons();
}

// Auto-initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProfessionalFeatures);
} else {
    initializeProfessionalFeatures();
}

// Export functions for use in other scripts
window.SocialFeedUtils = {
    debounce,
    initializeSearch,
    initializeFilterPanel,
    initializeInfiniteScroll,
    showSkeletonLoaders,
    showEmptyState,
    initializeReactions,
    initializeBookmarks,
    showToast,
    parseContentLinks,
    formatTimeAgo,
    formatNumber
};
