// client/js/auth.js

// --- HELPER FUNCTION: Returns the correct dashboard URL based on role ---
function getDashboardUrl(role) {
    switch (role) {
        case 'student':
            return 'student-dashboard.html';
        case 'faculty':
            return 'faculty-dashboard.html';
        case 'institute':
            return 'institute-dashboard.html';
        case 'employer':
            return 'employer-dashboard.html';
        case 'admin':
            return 'admin-dashboard.html';
        case 'alumni':
        default:
            return 'dashboard.html';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const navLinks = document.getElementById('nav-links');

    if (!navLinks) {
        console.error("Error: Navigation element with ID 'nav-links' was not found.");
        return;
    }

    const token = localStorage.getItem('alumniConnectToken');
    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    const userRole = localStorage.getItem('userRole');

    const navItems = document.createElement('ul');
    navItems.className = 'nav-links';

    if (token && loggedInUserEmail) {
        let profilePicUrl = '';
        let unreadCount = 0;
        let userName = localStorage.getItem('loggedInUserName') || 'Alumni';

        // --- Nav Bar HTML Structure ---
        navItems.innerHTML = `
            <li><a href="about.html">About</a></li>
            <li class="nav-dropdown">
                <a href="#" class="dropdown-toggle">Connect <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="directory.html">Directory</a></li>
                    <li><a href="mentors.html">Mentors</a></li>
                    <li><a href="events.html">Events</a></li>
                    <li><a href="groups.html">Groups</a></li>
                </ul>
            </li>
            <li class="nav-dropdown">
                <a href="#" class="dropdown-toggle">Resources <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="blogs.html">Blog</a></li>
                    <li><a href="threads.html">Social Feed</a></li>
                    <li><a href="stories.html">Stories</a></li>
                    <li><a href="jobs.html">Job Board</a></li>
                    <li><a href="campaigns.html">Campaigns</a></li>
                </ul>
            </li>
            ${userRole === 'admin' ? `<li><a href="admin.html" class="btn btn-secondary">Admin Dashboard</a></li>` : ''}
            <li>
                <a href="messages.html" id="messages-link" class="notification-bell" title="Messages">
                    <i class="fas fa-envelope"></i>
                </a>
            </li>
            <li>
                <a href="notifications.html" id="notification-bell" class="notification-bell" title="Notifications">
                    <i class="fas fa-bell"></i>
                </a>
            </li>
            <li class="profile-dropdown nav-dropdown">
                <a href="#" class="dropdown-toggle profile-toggle">
                    <img src="" alt="Profile" id="nav-profile-pic-img" class="nav-profile-pic">
                </a>
                <ul class="dropdown-menu">
                    <li><a href="${getDashboardUrl(userRole)}"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
                    <li><a href="profile.html"><i class="fas fa-user-edit"></i> Edit Profile</a></li>
                    <li><a href="my-blogs.html"><i class="fas fa-feather-alt"></i> My Blogs</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button id="theme-toggle-btn" class="theme-toggle-button"><i class="fas fa-moon"></i><span>Toggle Theme</span></button></li>
                    <li><button id="logout-btn" class="logout-button"><i class="fas fa-sign-out-alt"></i> Logout</button></li>
                </ul>
            </li>
        `;

        // --- Set the profile picture immediately from localStorage if available ---
        const navImg = navItems.querySelector('#nav-profile-pic-img');
        const storedPfpUrl = localStorage.getItem('userPfpUrl');

        if (storedPfpUrl) {
            navImg.src = `http://localhost:3000/${storedPfpUrl}?t=${new Date().getTime()}`;
        } else {
            navImg.src = createInitialsAvatar(userName);
        }

        // Add the error handler
        navImg.onerror = function() {
            this.onerror = null;
            this.src = createInitialsAvatar(localStorage.getItem('loggedInUserName') || 'Alumni');
        };

        // Asynchronously fetch latest data to keep localStorage and notifications fresh
        try {
            const loggedInUser = await window.api.get('/users/profile');
            localStorage.setItem('loggedInUserName', loggedInUser.full_name);
            if (loggedInUser.profile_pic_url) {
                localStorage.setItem('userPfpUrl', loggedInUser.profile_pic_url);
            } else {
                localStorage.removeItem('userPfpUrl');
            }
            
            // This ensures that even if localStorage was out of sync, it gets corrected.
            const freshPfpUrl = localStorage.getItem('userPfpUrl');
            if (freshPfpUrl) {
                 navImg.src = `http://localhost:3000/${freshPfpUrl}?t=${new Date().getTime()}`;
            } else {
                 navImg.src = createInitialsAvatar(loggedInUser.full_name);
            }

            const notifications = await window.api.get('/notifications');
            const unreadCount = notifications.filter(n => !n.is_read).length;
            if (unreadCount > 0) {
                const bell = navItems.querySelector('#notification-bell');
                bell.innerHTML += `<span class="notification-badge">${unreadCount}</span>`;
            }
            
            const userId = loggedInUser.user_id;
            const socket = io("http://localhost:3000");

            socket.on('connect', () => {
                if (userId) {
                    socket.emit('addUser', userId);
                }
            });

            socket.on('getNotification', ({ senderName, message }) => {
                showToast(`New message from ${senderName}: "${message.substring(0, 30)}..."`, 'info');
                
                const messagesLink = document.getElementById('messages-link');
                let badge = messagesLink.querySelector('.notification-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'notification-badge';
                    messagesLink.appendChild(badge);
                }
            });

        } catch (error) {
            console.error('Could not fetch latest profile data for navbar:', error);
        }

    } else {
        // --- Logged-out view ---
        navItems.innerHTML = `
            <li><a href="about.html">About</a></li>
            <li><a href="blogs.html">Blog</a></li>
            <li><a href="login.html" class="btn btn-secondary">Log In</a></li>
            <li><a href="signup.html" class="btn btn-primary">Sign Up</a></li>
            <li><button id="theme-toggle-btn" class="theme-toggle-button"><i class="fas fa-moon"></i></button></li>
        `;
    }

    navLinks.innerHTML = '';
    navLinks.appendChild(navItems);
    
    // --- Event Listeners (Dropdown, Logout, Theme, etc.) ---
    const messagesLink = document.getElementById('messages-link');
    if (messagesLink) {
        messagesLink.addEventListener('click', () => {
             const badge = messagesLink.querySelector('.notification-badge');
             if (badge) {
                 badge.style.display = 'none';
             }
        });
    }

    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', async (e) => {
            try {
                await window.api.post('/notifications/mark-read', {});
                const badge = notificationBell.querySelector('.notification-badge');
                if (badge) {
                    badge.style.display = 'none';
                }
            } catch (error) {
                console.error('Failed to mark notifications as read:', error);
            }
        });
    }

    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const parentDropdown = e.currentTarget.closest('.nav-dropdown');
            
            document.querySelectorAll('.nav-dropdown').forEach(dd => {
                if (dd !== parentDropdown) {
                    dd.classList.remove('dropdown-active');
                }
            });

            parentDropdown.classList.toggle('dropdown-active');
        });
    });
    
    window.addEventListener('click', () => {
        document.querySelectorAll('.nav-dropdown').forEach(dd => {
            dd.classList.remove('dropdown-active');
        });
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            localStorage.removeItem('alumniConnectToken');
            localStorage.removeItem('loggedInUserEmail');
            localStorage.removeItem('userRole');
            localStorage.removeItem('loggedInUserName');
            localStorage.removeItem('userId');
            localStorage.removeItem('userPfpUrl');
            window.location.href = 'index.html';
        });
    }
    
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    if (themeToggleButton) {
        const themeIcon = themeToggleButton.querySelector('i');
        
        if (document.documentElement.classList.contains('dark-mode')) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        }
        
        themeToggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            document.documentElement.classList.toggle('dark-mode');
            
            let theme = 'light-mode';
            if (document.documentElement.classList.contains('dark-mode')) {
                theme = 'dark-mode';
                themeIcon.classList.replace('fa-moon', 'fa-sun');
            } else {
                themeIcon.classList.replace('fa-sun', 'fa-moon');
            }
            localStorage.setItem('theme', theme);
        });
    }

    const path = window.location.pathname;
    const isIndexPage = path.endsWith('/') || path.endsWith('/index.html');
    if (isIndexPage) {
        const loggedInHeader = document.getElementById('loggedIn-header');
        const loggedOutHeader = document.getElementById('loggedOut-header');
        if (loggedInHeader && loggedOutHeader) {
            loggedInHeader.style.display = token ? 'block' : 'none';
            loggedOutHeader.style.display = token ? 'none' : 'block';
        }
    }
});