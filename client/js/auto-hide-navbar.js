// Auto-Hide Navbar with Smooth Scroll Transitions
// This script handles auto-hiding navigation on all pages except homepage

(function() {
    // Check if we're on the homepage
    const isHomepage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    
    // Don't apply auto-hide on homepage
    if (isHomepage) {
        return;
    }

    // Get the header element
    const header = document.querySelector('.main-header');
    if (!header) return;

    // Scroll tracking variables
    let lastScrollTop = 0;
    let scrollThreshold = 5; // Minimum scroll difference to trigger
    let ticking = false;
    let hoverTimer = null;
    let isHovering = false;

    // Add auto-hide class to header for styling
    header.classList.add('auto-hide-navbar');

    // Calculate navbar height for precise transitions
    const getNavbarHeight = () => header.offsetHeight;

    // Smooth scroll handler with progressive hiding
    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const navbarHeight = getNavbarHeight();
        
        // Calculate scroll difference
        const scrollDiff = scrollTop - lastScrollTop;
        
        // Only proceed if scroll difference is significant
        if (Math.abs(scrollDiff) < scrollThreshold) {
            lastScrollTop = scrollTop;
            return;
        }

        // Don't hide if hovering
        if (isHovering) {
            lastScrollTop = scrollTop;
            return;
        }

        if (scrollTop > lastScrollTop && scrollTop > navbarHeight) {
            // Scrolling DOWN - Hide navbar
            const hideAmount = Math.min(scrollTop - lastScrollTop, navbarHeight);
            const currentTransform = header.style.transform || 'translateY(0px)';
            const currentY = parseInt(currentTransform.match(/-?\d+/) || [0])[0];
            const newY = Math.max(-navbarHeight, currentY - hideAmount);
            
            header.style.transform = `translateY(${newY}px)`;
            header.classList.add('navbar-hidden');
        } else if (scrollTop < lastScrollTop) {
            // Scrolling UP - Show navbar
            const showAmount = Math.min(lastScrollTop - scrollTop, navbarHeight);
            const currentTransform = header.style.transform || 'translateY(0px)';
            const currentY = parseInt(currentTransform.match(/-?\d+/) || [0])[0];
            const newY = Math.min(0, currentY + showAmount);
            
            header.style.transform = `translateY(${newY}px)`;
            
            if (newY === 0) {
                header.classList.remove('navbar-hidden');
            }
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }

    // Optimized scroll listener using requestAnimationFrame
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Hover detection area (top 100px of viewport)
    let hoverArea = document.createElement('div');
    hoverArea.className = 'navbar-hover-area';
    hoverArea.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100px;
        z-index: 999;
        pointer-events: auto;
    `;
    document.body.appendChild(hoverArea);

    // Show navbar on hover
    function showNavbarOnHover() {
        isHovering = true;
        header.style.transform = 'translateY(0)';
        header.classList.remove('navbar-hidden');
        header.classList.add('navbar-hover-visible');

        // Clear existing timer
        if (hoverTimer) {
            clearTimeout(hoverTimer);
        }
    }

    // Hide navbar after hover ends (with 5 second delay)
    function hideNavbarAfterHover() {
        isHovering = false;
        header.classList.remove('navbar-hover-visible');
        
        // Set 5 second timer before hiding
        hoverTimer = setTimeout(() => {
            // Only hide if still not hovering
            if (!isHovering) {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const navbarHeight = getNavbarHeight();
                
                if (scrollTop > navbarHeight) {
                    header.style.transform = `translateY(-${navbarHeight}px)`;
                    header.classList.add('navbar-hidden');
                }
            }
        }, 5000); // 5 seconds
    }

    // Hover area events
    hoverArea.addEventListener('mouseenter', showNavbarOnHover);
    hoverArea.addEventListener('mouseleave', hideNavbarAfterHover);

    // Also detect hover on navbar itself
    header.addEventListener('mouseenter', () => {
        isHovering = true;
        if (hoverTimer) {
            clearTimeout(hoverTimer);
        }
    });

    header.addEventListener('mouseleave', () => {
        hideNavbarAfterHover();
    });

    // Initial setup - ensure navbar is visible at page load
    header.style.transform = 'translateY(0)';
    header.classList.remove('navbar-hidden');

    // Add CSS for smooth transitions
    const style = document.createElement('style');
    style.textContent = `
        .auto-hide-navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform;
        }

        .auto-hide-navbar.navbar-hidden {
            box-shadow: none;
        }

        .auto-hide-navbar.navbar-hover-visible {
            transform: translateY(0) !important;
        }

        /* Ensure body has proper padding to account for fixed navbar */
        body {
            padding-top: var(--navbar-height, 70px);
        }

        /* Smooth transitions for all states */
        .auto-hide-navbar * {
            transition: opacity 0.3s ease;
        }

        /* Hover area styling (invisible but functional) */
        .navbar-hover-area {
            background: transparent;
        }

        /* Add subtle shadow when navbar is visible during scroll */
        .auto-hide-navbar:not(.navbar-hidden) {
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        /* Dark mode adjustments */
        .dark-mode .auto-hide-navbar:not(.navbar-hidden) {
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
    `;
    document.head.appendChild(style);

    // Set CSS variable for navbar height
    const setNavbarHeight = () => {
        document.documentElement.style.setProperty('--navbar-height', `${getNavbarHeight()}px`);
    };
    
    setNavbarHeight();
    window.addEventListener('resize', setNavbarHeight);

})();
