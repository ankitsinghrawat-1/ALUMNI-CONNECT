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
    let scrollThreshold = 10; // Minimum scroll difference to trigger
    let scrollUpThreshold = 100; // Amount user must scroll up before navbar shows
    let scrollUpAccumulator = 0; // Tracks accumulated scroll up distance
    let ticking = false;

    // Add auto-hide class to header for styling
    header.classList.add('auto-hide-navbar');

    // Calculate navbar height for precise transitions
    const getNavbarHeight = () => header.offsetHeight;

    // Smooth scroll handler
    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const navbarHeight = getNavbarHeight();
        
        // If we're at the top of the page, ensure navbar is fully visible
        if (scrollTop <= 0) {
            header.classList.remove('navbar-hidden');
            scrollUpAccumulator = 0;
            lastScrollTop = 0;
            return;
        }
        
        // Calculate scroll difference
        const scrollDiff = scrollTop - lastScrollTop;
        
        // Only proceed if scroll difference is significant
        if (Math.abs(scrollDiff) < scrollThreshold) {
            return;
        }

        if (scrollTop > lastScrollTop && scrollTop > navbarHeight) {
            // Scrolling DOWN - Hide navbar with smooth transition
            scrollUpAccumulator = 0; // Reset scroll up counter
            header.classList.add('navbar-hidden');
        } else if (scrollTop < lastScrollTop) {
            // Scrolling UP - Accumulate scroll distance before showing
            const scrollUpAmount = lastScrollTop - scrollTop;
            scrollUpAccumulator += scrollUpAmount;
            
            // Only show navbar after scrolling up the threshold distance
            if (scrollUpAccumulator >= scrollUpThreshold) {
                header.classList.remove('navbar-hidden');
                scrollUpAccumulator = 0; // Reset after showing
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
            transform: translateY(-100%);
        }

        /* Add subtle shadow when navbar is visible */
        .auto-hide-navbar:not(.navbar-hidden) {
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        /* Dark mode adjustments */
        .dark-mode .auto-hide-navbar:not(.navbar-hidden) {
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
    `;
    document.head.appendChild(style);

})();
