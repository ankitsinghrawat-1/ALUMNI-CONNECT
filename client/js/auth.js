// client/js/auth.js
document.addEventListener('DOMContentLoaded', async () => {
    const navLinks = document.getElementById('nav-links');

    if (!navLinks) {
        console.error("Error: Navigation element with ID 'nav-links' was not found.");
        return;
    }

    // Check for the token in localStorage now
    const token = localStorage.getItem('alumniConnectToken');
    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    const userRole = localStorage.getItem('userRole');

    const navItems = document.createElement('ul');
    navItems.className = 'nav-links';

    if (token && loggedInUserEmail) { // Check for token to confirm login
        let profilePicUrl = '';
        let unreadCount = 0;
        let userName = 'Alumni';

        // --- Nav Bar HTML Structure ---
        navItems.innerHTML = `
            <li><a href="about.html">About</a></li>
            <li class="nav-dropdown">
                <a href="#" class="dropdown-toggle">Connect <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="directory.html">Directory</a></li>
                    <li><a href="mentors.html">Mentors</a></li>
                    <li><a href="events.html">Events</a></li>
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
            const [profileRes, notificationsRes] = await Promise.all([
                fetch(`http://localhost:3000/api/users/profile/${loggedInUserEmail}`),
                fetch(`http://localhost:3000/api/notifications?email=${encodeURIComponent(loggedInUserEmail)}`)
            ]);

            let loggedInUser = null;
            if (profileRes.ok) {
                loggedInUser = await profileRes.json();
                userName = loggedInUser.full_name;
                localStorage.setItem('loggedInUserName', userName); // Use localStorage
                profilePicUrl = loggedInUser.profile_pic_url 
                    ? `http://localhost:3000/${loggedInUser.profile_pic_url}` 
                    : createInitialsAvatar(userName);
            } else {
                 profilePicUrl = createInitialsAvatar(userName);
            }

            if (notificationsRes.ok) {
                const notifications = await notificationsRes.json();
                unreadCount = notifications.filter(n => !n.is_read).length;
                if (unreadCount > 0) {
                    const bell = navItems.querySelector('#notification-bell');
                    bell.innerHTML += `<span class="notification-badge">${unreadCount}</span>`;
                }
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
                if (loggedInUser) {
                    socket.emit('addUser', loggedInUser.user_id);
                }
            });

            socket.on('getNotification', ({ senderName, message }) => {
                // Show a toast
                showToast(`New message from ${senderName}: "${message.substring(0, 30)}..."`, 'info');
                
                // Update the message icon with a badge
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
                 badge.style.display = 'none'; // Hide badge on click
             }
        });
    }

    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', async (e) => {
            try {
                // We will need to add the auth token here later
                await fetch('http://localhost:3000/api/notifications/mark-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loggedInUserEmail })
                });
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
            // Clear localStorage on logout
            localStorage.removeItem('alumniConnectToken');
            localStorage.removeItem('loggedInUserEmail');
            localStorage.removeItem('userRole');
            localStorage.removeItem('loggedInUserName');
            await fetch('http://localhost:3000/api/users/logout', { method: 'POST' });
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
            loggedInHeader.style.display = token ? 'block' : 'none'; // Check for token
            loggedOutHeader.style.display = token ? 'none' : 'block'; // Check for token
        }
    }
});