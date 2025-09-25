// client/js/auth.js
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
        let userName = 'Alumni';
        let userId = null;

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
                    <img src="" alt="Profile" class="nav-profile-pic">
                </a>
                <ul class="dropdown-menu">
                    <li><a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
                    <li><a href="profile.html"><i class="fas fa-user-edit"></i> Edit Profile</a></li>
                    <li><a href="my-blogs.html"><i class="fas fa-feather-alt"></i> My Blogs</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button id="theme-toggle-btn" class="theme-toggle-button"><i class="fas fa-moon"></i><span>Toggle Theme</span></button></li>
                    <li><button id="logout-btn" class="logout-button"><i class="fas fa-sign-out-alt"></i> Logout</button></li>
                </ul>
            </li>
        `;
        
        // --- Fetch initial data and set up real-time listeners ---
        try {
            // Use the protected route to get the logged-in user's own profile data
            const loggedInUser = await window.api.get('/users/profile');
            
            userId = loggedInUser.user_id;
            userName = loggedInUser.full_name;
            localStorage.setItem('loggedInUserName', userName);
            localStorage.setItem('userId', userId); // Store userId for later use

            profilePicUrl = loggedInUser.profile_pic_url 
                ? `http://localhost:3000/${loggedInUser.profile_pic_url}` 
                : createInitialsAvatar(userName);

            const notifications = await window.api.get('/notifications');
            unreadCount = notifications.filter(n => !n.is_read).length;
            if (unreadCount > 0) {
                const bell = navItems.querySelector('#notification-bell');
                bell.innerHTML += `<span class="notification-badge">${unreadCount}</span>`;
            }

            const navImg = navItems.querySelector('.nav-profile-pic');
            if (navImg) {
                navImg.src = profilePicUrl;
                navImg.onerror = function() {
                    this.onerror = null;
                    this.src = createInitialsAvatar(localStorage.getItem('loggedInUserName') || 'Alumni');
                };
            }
            
            // --- REAL-TIME NOTIFICATION LOGIC ---
            const socket = io("http://localhost:3000");

            socket.on('connect', () => {
                console.log('Connected to socket for notifications.');
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
            console.error('Could not fetch initial nav data:', error);
            const navImg = navItems.querySelector('.nav-profile-pic');
             if (navImg) {
                navImg.src = createInitialsAvatar(userName);
            }
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
                // The api wrapper will automatically add the token
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
            // No need to await fetch for logout, just redirect
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