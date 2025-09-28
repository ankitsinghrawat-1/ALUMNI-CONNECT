// client/js/mobile-navigation.js
// Advanced mobile navigation with touch gestures and responsive behavior

class MobileNavigation {
    constructor(options = {}) {
        this.options = {
            breakpoint: 768,
            swipeThreshold: 50,
            animationDuration: 300,
            enableSwipeGestures: true,
            enablePullToRefresh: true,
            enableBottomNavigation: true,
            ...options
        };
        
        this.isOpen = false;
        this.touchStart = null;
        this.touchEnd = null;
        this.pullToRefreshDistance = 0;
        this.isPullToRefreshActive = false;
        
        this.init();
    }

    init() {
        this.createMobileNavigation();
        this.setupEventListeners();
        this.setupGestureHandlers();
        this.setupPullToRefresh();
        this.checkViewport();
        
        // Initialize on resize
        this.handleResize();
    }

    createMobileNavigation() {
        // Enhance existing navigation for mobile
        this.enhanceMainNavigation();
        
        // Create mobile-specific elements
        this.createHamburgerMenu();
        this.createMobileOverlay();
        this.createBottomNavigation();
        this.createPullToRefreshIndicator();
        
        this.elements = {
            hamburger: document.querySelector('.nav-hamburger'),
            overlay: document.querySelector('.nav-mobile-overlay'),
            mainNav: document.querySelector('.main-nav'),
            navLinks: document.querySelector('.nav-links'),
            bottomNav: document.querySelector('.bottom-navigation'),
            pullIndicator: document.querySelector('.pull-to-refresh-indicator'),
            body: document.body
        };
    }

    enhanceMainNavigation() {
        const mainNav = document.querySelector('.main-nav');
        if (mainNav && !mainNav.classList.contains('mobile-enhanced')) {
            mainNav.classList.add('mobile-enhanced');
            
            // Add mobile classes to nav links
            const navLinks = mainNav.querySelector('.nav-links');
            if (navLinks) {
                navLinks.classList.add('mobile-nav-links');
            }
        }
    }

    createHamburgerMenu() {
        const existingHamburger = document.querySelector('.nav-hamburger');
        if (existingHamburger) return;

        const hamburgerHTML = `
            <button class="nav-hamburger" aria-label="Toggle navigation menu" aria-expanded="false">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-text">Menu</span>
            </button>
        `;

        const mainNav = document.querySelector('.main-nav');
        if (mainNav) {
            mainNav.insertAdjacentHTML('beforeend', hamburgerHTML);
        }
    }

    createMobileOverlay() {
        const existingOverlay = document.querySelector('.nav-mobile-overlay');
        if (existingOverlay) return;

        const overlayHTML = `
            <div class="nav-mobile-overlay" aria-hidden="true"></div>
        `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);
    }

    createBottomNavigation() {
        if (!this.options.enableBottomNavigation) return;
        
        const existingBottomNav = document.querySelector('.bottom-navigation');
        if (existingBottomNav) return;

        const bottomNavHTML = `
            <nav class="bottom-navigation" role="navigation" aria-label="Bottom navigation">
                <div class="bottom-nav-items">
                    <a href="dashboard.html" class="bottom-nav-item" data-tooltip="Dashboard">
                        <i class="fas fa-home"></i>
                        <span>Home</span>
                    </a>
                    <a href="directory.html" class="bottom-nav-item" data-tooltip="Directory">
                        <i class="fas fa-users"></i>
                        <span>People</span>
                    </a>
                    <a href="jobs.html" class="bottom-nav-item" data-tooltip="Jobs">
                        <i class="fas fa-briefcase"></i>
                        <span>Jobs</span>
                    </a>
                    <a href="messages.html" class="bottom-nav-item" data-tooltip="Messages">
                        <i class="fas fa-envelope"></i>
                        <span>Messages</span>
                        <div class="bottom-nav-badge">3</div>
                    </a>
                    <a href="profile.html" class="bottom-nav-item" data-tooltip="Profile">
                        <i class="fas fa-user"></i>
                        <span>Profile</span>
                    </a>
                </div>
            </nav>
        `;

        document.body.insertAdjacentHTML('beforeend', bottomNavHTML);
    }

    createPullToRefreshIndicator() {
        if (!this.options.enablePullToRefresh) return;

        const existingIndicator = document.querySelector('.pull-to-refresh-indicator');
        if (existingIndicator) return;

        const indicatorHTML = `
            <div class="pull-to-refresh-indicator">
                <div class="ptr-spinner">
                    <div class="ptr-arrow">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                    <div class="ptr-loading">
                        <div class="spinner"></div>
                    </div>
                </div>
                <div class="ptr-text">Pull to refresh</div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', indicatorHTML);
    }

    setupEventListeners() {
        // Hamburger menu toggle
        const hamburger = document.querySelector('.nav-hamburger');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                this.toggleMobileNav();
            });
        }

        // Overlay click to close
        const overlay = document.querySelector('.nav-mobile-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeMobileNav();
            });
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMobileNav();
            }
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Bottom navigation active state
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        bottomNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.setActiveBottomNavItem(e.currentTarget);
            });
        });

        // Prevent body scroll when nav is open
        document.addEventListener('touchmove', (e) => {
            if (this.isOpen && !e.target.closest('.nav-links')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    setupGestureHandlers() {
        if (!this.options.enableSwipeGestures) return;

        let startX, startY, currentX, currentY;

        // Touch start
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            this.touchStart = { x: startX, y: startY };
        });

        // Touch move
        document.addEventListener('touchmove', (e) => {
            if (!this.touchStart) return;

            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;

            // Handle pull to refresh
            if (this.options.enablePullToRefresh && window.pageYOffset === 0) {
                this.handlePullToRefresh(e, currentY - startY);
            }

            // Handle navigation swipes
            this.handleNavigationSwipe(currentX - startX, currentY - startY);
        }, { passive: false });

        // Touch end
        document.addEventListener('touchend', (e) => {
            if (!this.touchStart) return;

            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            // Determine swipe direction and handle
            this.handleSwipeEnd(deltaX, deltaY);

            // Reset touch tracking
            this.touchStart = null;
            this.touchEnd = { x: currentX, y: currentY };
        });
    }

    handleNavigationSwipe(deltaX, deltaY) {
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        // Only handle horizontal swipes
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;

        // Swipe from left edge to open nav
        if (this.touchStart.x < 50 && deltaX > this.options.swipeThreshold && !this.isOpen) {
            this.openMobileNav();
        }

        // Swipe left to close nav
        if (this.isOpen && deltaX < -this.options.swipeThreshold) {
            this.closeMobileNav();
        }

        // Visual feedback during swipe
        if (this.isOpen && deltaX < 0) {
            const progress = Math.min(1, Math.abs(deltaX) / 200);
            navLinks.style.transform = `translateX(${deltaX}px)`;
            navLinks.style.opacity = 1 - progress * 0.5;
        }
    }

    handleSwipeEnd(deltaX, deltaY) {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.style.transform = '';
            navLinks.style.opacity = '';
        }

        // Handle pull to refresh completion
        if (this.isPullToRefreshActive) {
            this.completePullToRefresh();
        }
    }

    setupPullToRefresh() {
        if (!this.options.enablePullToRefresh) return;

        // Only enable on mobile devices
        if (!this.isMobile()) return;

        this.pullToRefreshEnabled = true;
    }

    handlePullToRefresh(e, deltaY) {
        if (!this.pullToRefreshEnabled || deltaY < 0) return;

        const indicator = document.querySelector('.pull-to-refresh-indicator');
        if (!indicator) return;

        e.preventDefault();

        this.pullToRefreshDistance = Math.min(deltaY, 120);
        const progress = this.pullToRefreshDistance / 80;

        // Update indicator position and state
        indicator.style.transform = `translateY(${this.pullToRefreshDistance}px)`;
        indicator.style.opacity = Math.min(progress, 1);

        const arrow = indicator.querySelector('.ptr-arrow');
        const text = indicator.querySelector('.ptr-text');

        if (this.pullToRefreshDistance > 80) {
            arrow.style.transform = 'rotate(180deg)';
            text.textContent = 'Release to refresh';
            this.isPullToRefreshActive = true;
        } else {
            arrow.style.transform = 'rotate(0deg)';
            text.textContent = 'Pull to refresh';
            this.isPullToRefreshActive = false;
        }
    }

    completePullToRefresh() {
        const indicator = document.querySelector('.pull-to-refresh-indicator');
        if (!indicator) return;

        if (this.isPullToRefreshActive) {
            // Show loading state
            indicator.classList.add('loading');
            indicator.querySelector('.ptr-text').textContent = 'Refreshing...';

            // Trigger refresh
            this.triggerPageRefresh();

            // Hide after delay
            setTimeout(() => {
                this.resetPullToRefresh();
            }, 2000);
        } else {
            this.resetPullToRefresh();
        }
    }

    resetPullToRefresh() {
        const indicator = document.querySelector('.pull-to-refresh-indicator');
        if (!indicator) return;

        indicator.style.transform = 'translateY(-100%)';
        indicator.style.opacity = '0';
        indicator.classList.remove('loading');
        
        setTimeout(() => {
            indicator.style.transform = '';
            indicator.style.opacity = '';
            indicator.querySelector('.ptr-text').textContent = 'Pull to refresh';
            indicator.querySelector('.ptr-arrow').style.transform = '';
        }, 300);

        this.pullToRefreshDistance = 0;
        this.isPullToRefreshActive = false;
    }

    triggerPageRefresh() {
        // Emit custom refresh event
        const refreshEvent = new CustomEvent('pullToRefresh');
        document.dispatchEvent(refreshEvent);

        // Default behavior - reload current page data
        if (window.location.reload) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    toggleMobileNav() {
        if (this.isOpen) {
            this.closeMobileNav();
        } else {
            this.openMobileNav();
        }
    }

    openMobileNav() {
        this.isOpen = true;
        
        document.body.classList.add('mobile-nav-open');
        
        const hamburger = document.querySelector('.nav-hamburger');
        const overlay = document.querySelector('.nav-mobile-overlay');
        
        if (hamburger) {
            hamburger.setAttribute('aria-expanded', 'true');
            hamburger.classList.add('active');
        }
        
        if (overlay) {
            overlay.setAttribute('aria-hidden', 'false');
        }

        // Focus management
        const firstNavLink = document.querySelector('.nav-links a');
        if (firstNavLink) {
            firstNavLink.focus();
        }

        // Announce to screen readers
        this.announceToScreenReader('Navigation menu opened');
    }

    closeMobileNav() {
        this.isOpen = false;
        
        document.body.classList.remove('mobile-nav-open');
        
        const hamburger = document.querySelector('.nav-hamburger');
        const overlay = document.querySelector('.nav-mobile-overlay');
        
        if (hamburger) {
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.classList.remove('active');
        }
        
        if (overlay) {
            overlay.setAttribute('aria-hidden', 'true');
        }

        // Return focus to hamburger
        if (hamburger) {
            hamburger.focus();
        }

        // Announce to screen readers
        this.announceToScreenReader('Navigation menu closed');
    }

    setActiveBottomNavItem(activeItem) {
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        bottomNavItems.forEach(item => {
            item.classList.remove('active');
        });
        
        activeItem.classList.add('active');
    }

    handleResize() {
        const isMobile = window.innerWidth <= this.options.breakpoint;
        
        document.body.classList.toggle('is-mobile', isMobile);
        document.body.classList.toggle('is-desktop', !isMobile);

        // Close mobile nav on desktop
        if (!isMobile && this.isOpen) {
            this.closeMobileNav();
        }

        // Update bottom navigation visibility
        const bottomNav = document.querySelector('.bottom-navigation');
        if (bottomNav) {
            bottomNav.style.display = isMobile ? 'flex' : 'none';
        }
    }

    checkViewport() {
        // Initial viewport setup
        this.handleResize();
        
        // Set active bottom nav item based on current page
        this.setActiveBottomNavBasedOnPath();
    }

    setActiveBottomNavBasedOnPath() {
        const currentPath = window.location.pathname;
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        
        bottomNavItems.forEach(item => {
            const href = item.getAttribute('href');
            if (currentPath.includes(href.replace('.html', '')) || 
                (currentPath === '/' && href === 'dashboard.html')) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    isMobile() {
        return window.innerWidth <= this.options.breakpoint ||
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Public API methods
    open() {
        this.openMobileNav();
    }

    close() {
        this.closeMobileNav();
    }

    toggle() {
        this.toggleMobileNav();
    }

    destroy() {
        // Remove event listeners and elements
        const elementsToRemove = [
            '.nav-hamburger',
            '.nav-mobile-overlay',
            '.bottom-navigation',
            '.pull-to-refresh-indicator'
        ];

        elementsToRemove.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.remove();
            }
        });

        // Remove classes
        document.body.classList.remove(
            'mobile-nav-open',
            'is-mobile',
            'is-desktop'
        );
    }
}

// Auto-initialize mobile navigation
document.addEventListener('DOMContentLoaded', () => {
    window.mobileNavigation = new MobileNavigation();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileNavigation;
}