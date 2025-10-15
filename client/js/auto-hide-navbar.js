// Auto-Hide Navbar with Hover Detection
// This script handles navbar hover behavior on all pages except homepage

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

    let hideTimer = null;
    let isHovering = false;

    // Calculate navbar height
    const getNavbarHeight = () => header.offsetHeight;

    // Create a hover detection area at the top of the viewport
    const hoverArea = document.createElement('div');
    hoverArea.className = 'navbar-hover-trigger';
    hoverArea.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 80px;
        z-index: 999;
        pointer-events: auto;
    `;
    document.body.appendChild(hoverArea);

    // Create clone of navbar that appears on hover
    const navbarClone = header.cloneNode(true);
    navbarClone.className = header.className + ' navbar-hover-overlay';
    navbarClone.style.display = 'none';
    document.body.appendChild(navbarClone);

    // Show navbar overlay on hover
    function showNavbar() {
        isHovering = true;
        navbarClone.style.display = 'block';
        
        // Clear any existing timer
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }

        // Re-populate navigation links in clone (in case they were loaded dynamically)
        const originalLinks = header.querySelector('#nav-links');
        const cloneLinks = navbarClone.querySelector('#nav-links');
        if (originalLinks && cloneLinks) {
            cloneLinks.innerHTML = originalLinks.innerHTML;
        }
    }

    // Hide navbar overlay after delay
    function hideNavbar() {
        isHovering = false;
        
        // Set timer to hide after 3 seconds
        hideTimer = setTimeout(() => {
            if (!isHovering) {
                navbarClone.style.display = 'none';
            }
        }, 3000);
    }

    // Hover area events
    hoverArea.addEventListener('mouseenter', showNavbar);
    hoverArea.addEventListener('mouseleave', hideNavbar);

    // Navbar clone events
    navbarClone.addEventListener('mouseenter', () => {
        isHovering = true;
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
    });

    navbarClone.addEventListener('mouseleave', hideNavbar);

    // Add CSS for the overlay navbar
    const style = document.createElement('style');
    style.textContent = `
        /* Original navbar scrolls naturally with page */
        .main-header {
            position: relative;
            z-index: 100;
        }

        /* Hover overlay navbar */
        .navbar-hover-overlay {
            position: fixed !important;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }

        @keyframes slideDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        /* Dark mode adjustments */
        .dark-mode .navbar-hover-overlay {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
    `;
    document.head.appendChild(style);

})();
