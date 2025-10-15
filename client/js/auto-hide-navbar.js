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
    let scrollUpThreshold = 100; // Amount user must scroll up before navbar shows
    let scrollUpAccumulator = 0; // Tracks accumulated scroll up distance
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
        
        // If we're at the top of the page, ensure navbar is fully visible
        if (scrollTop <= 0) {
            header.style.transform = 'translateY(0)';
            header.classList.remove('navbar-hidden');
            scrollUpAccumulator = 0;
            lastScrollTop = 0;
            return;
        }
        
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
            // Scrolling DOWN - Hide navbar progressively at the same rate as scroll
            scrollUpAccumulator = 0; // Reset scroll up counter
            
            const hideAmount = Math.min(scrollTop - lastScrollTop, navbarHeight);
            const currentTransform = header.style.transform || 'translateY(0px)';
            const currentY = parseInt(currentTransform.match(/-?\d+/) || [0])[0];
            const newY = Math.max(-navbarHeight, currentY - hideAmount);
            
            header.style.transform = `translateY(${newY}px)`;
            header.classList.add('navbar-hidden');
        } else if (scrollTop < lastScrollTop) {
            // Scrolling UP - Accumulate scroll distance before showing
            const scrollUpAmount = lastScrollTop - scrollTop;
            scrollUpAccumulator += scrollUpAmount;
            
            // Only show navbar after scrolling up the threshold distance
            if (scrollUpAccumulator >= scrollUpThreshold) {
                const currentTransform = header.style.transform || 'translateY(0px)';
                const currentY = parseInt(currentTransform.match(/-?\d+/) || [0])[0];
                
                // Show navbar progressively at the same rate as scroll (matching hide behavior)
                const showAmount = Math.min(scrollUpAmount, navbarHeight);
                const newY = Math.min(0, currentY + showAmount);
                
                header.style.transform = `translateY(${newY}px)`;
                
                if (newY === 0) {
                    header.classList.remove('navbar-hidden');
                    scrollUpAccumulator = 0; // Reset after fully shown
                }
            }
        }

        lastScrollTop = scrollTop;
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
            transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            will-change: transform;
        }

        .auto-hide-navbar.navbar-hidden {
            box-shadow: none;
            transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1);
        }

        .auto-hide-navbar.navbar-hover-visible {
            transform: translateY(0) !important;
            transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* Ensure body has proper padding to account for fixed navbar */
        body {
            padding-top: var(--navbar-height, 70px);
        }

        /* Smooth transitions for navbar contents */
        .auto-hide-navbar * {
            transition: opacity 0.2s ease;
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

        /* Smooth reveal animation when showing */
        .auto-hide-navbar:not(.navbar-hidden):not(.navbar-hover-visible) {
            animation: navbar-slide-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        @keyframes navbar-slide-in {
            from {
                transform: translateY(-100%);
                opacity: 0.8;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
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
