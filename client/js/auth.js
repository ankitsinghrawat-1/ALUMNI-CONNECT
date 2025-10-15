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
        let userId = localStorage.getItem('loggedInUserId');
        
        // Fetch mentor status to determine if mentor profile link should be shown
        let mentorProfileLink = '';
        let isMentor = false;
        let mentorId = null;
        
        // Check if window.api is available
        if (!window.api) {
            console.error('✗ window.api is not defined! Make sure api.js is loaded before auth.js');
        } else {
            console.log('✓ window.api is available');
            console.log('Auth token present:', !!token);
            
            try {
                console.log('🔄 Fetching mentor status from /api/mentors/status...');
                const response = await window.api.get('/mentors/status');
                console.log('✓ Mentor status API response received:');
                console.log('  └─ Raw response type:', typeof response);
                console.log('  └─ Raw response:', response);
                console.log('  └─ Full JSON response:', JSON.stringify(response, null, 2));
                
                // Handle both direct response and nested data response
                const mentorStatus = response.data || response;
                console.log('  └─ Processed mentorStatus:', mentorStatus);
                
                if (mentorStatus) {
                    // Check if response has the expected fields
                    const hasIsMentor = 'isMentor' in mentorStatus;
                    const hasMentorId = 'mentorId' in mentorStatus;
                    console.log('  └─ Has isMentor field:', hasIsMentor);
                    console.log('  └─ Has mentorId field:', hasMentorId);
                    console.log('  └─ mentorStatus.isMentor:', mentorStatus.isMentor);
                    console.log('  └─ mentorStatus.mentorId:', mentorStatus.mentorId);
                    
                    isMentor = mentorStatus.isMentor === true;
                    mentorId = mentorStatus.mentorId;
                    console.log('  └─ Final isMentor value:', isMentor);
                    console.log('  └─ Final mentorId value:', mentorId);
                    
                    if (isMentor && mentorId) {
                        mentorProfileLink = `<li><a href="mentor-profile.html?id=${mentorId}"><i class="fas fa-chalkboard-teacher"></i> Mentor Profile</a></li>`;
                        console.log('✓ SUCCESS: Mentor profile link created!');
                        console.log('  └─ Mentor ID:', mentorId);
                        console.log('  └─ Link HTML:', mentorProfileLink.substring(0, 80) + '...');
                    } else {
                        console.log('✗ NOT creating mentor link:');
                        if (!isMentor) {
                            console.log('  └─ Reason: isMentor is', isMentor, '(expected true)');
                        }
                        if (!mentorId) {
                            console.log('  └─ Reason: mentorId is', mentorId, '(expected a number)');
                        }
                    }
                } else {
                    console.log('✗ API returned null/undefined/empty response');
                }
            } catch (error) {
                console.error('✗ ERROR fetching mentor status:');
                console.error('  └─ Error type:', error.constructor.name);
                console.error('  └─ Error name:', error.name);
                console.error('  └─ Error message:', error.message);
                console.error('  └─ Full error object:', error);
                if (error.stack) {
                    console.error('  └─ Stack trace:', error.stack);
                }
            }
        }

        // --- Nav Bar HTML Structure ---
        navItems.innerHTML = `
            <li><a href="about.html">About</a></li>
            <li class="nav-dropdown">
                <a href="#" class="dropdown-toggle">Connect <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="featured-directory.html">Directory</a></li>
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
                    <li class="nav-dropdown profile-submenu">
                        <a href="#" class="dropdown-toggle"><i class="fas fa-user"></i> My Profiles <i class="fas fa-chevron-left"></i></a>
                        <ul class="dropdown-menu">
                            <li><a href="view-profile.html?email=${loggedInUserEmail}"><i class="fas fa-user"></i> Main Profile</a></li>
                            <li><a href="social-profile.html?userId=${userId}"><i class="fas fa-id-card"></i> Social Profile</a></li>
                            ${mentorProfileLink}
                        </ul>
                    </li>
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
            
            // Initialize socket.io only if the library is loaded
            if (typeof io !== 'undefined') {
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
            }

        } catch (error) {
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
            }
        });
    }

    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const parentDropdown = e.currentTarget.closest('.nav-dropdown');
            
            // Handle nested dropdowns (profile submenu)
            if (parentDropdown.classList.contains('profile-submenu')) {
                // Toggle only this submenu
                parentDropdown.classList.toggle('dropdown-active');
            } else {
                // Close all other main dropdowns
                document.querySelectorAll('.nav-dropdown').forEach(dd => {
                    if (dd !== parentDropdown && !dd.classList.contains('profile-submenu')) {
                        dd.classList.remove('dropdown-active');
                    }
                });
                
                parentDropdown.classList.toggle('dropdown-active');
            }
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