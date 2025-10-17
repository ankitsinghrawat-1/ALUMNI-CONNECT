// client/js/settings.js
// Settings page functionality

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const token = localStorage.getItem('alumniConnectToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Tab switching logic
    const navLinks = document.querySelectorAll('.settings-nav-link[data-tab]');
    const tabContents = document.querySelectorAll('.settings-tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');

            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show corresponding tab
            tabContents.forEach(tab => {
                tab.classList.remove('active');
                tab.style.display = 'none';
            });
            const targetTab = document.getElementById(`${tabId}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
                targetTab.style.display = 'block';
            }
        });
    });

    // Load user data and populate account info
    try {
        const userData = await window.api.get('/users/profile');
        
        // Populate account info
        const accountAvatar = document.getElementById('account-avatar');
        const accountName = document.getElementById('account-name');
        const accountEmail = document.getElementById('account-email');
        const accountEmailInput = document.getElementById('account-email-input');
        const accountRole = document.getElementById('account-role');
        const accountJoined = document.getElementById('account-joined');

        if (accountAvatar && userData.profile_pic_url) {
            accountAvatar.src = `http://localhost:3000/${userData.profile_pic_url}`;
        } else if (accountAvatar) {
            accountAvatar.src = createInitialsAvatar(userData.full_name || 'User');
        }

        if (accountName) accountName.textContent = userData.full_name || 'User';
        if (accountEmail) accountEmail.textContent = userData.email || '';
        if (accountEmailInput) accountEmailInput.value = userData.email || '';
        if (accountRole) {
            const roleDisplay = {
                'alumni': 'Alumni',
                'student': 'Student',
                'faculty': 'Faculty',
                'employer': 'Employer',
                'admin': 'Administrator'
            };
            accountRole.value = roleDisplay[userData.role] || userData.role || 'User';
        }
        if (accountJoined && userData.created_at) {
            const joinedDate = new Date(userData.created_at);
            accountJoined.value = joinedDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        // Check if user is a mentor and show/hide mentor profile link
        const isMentor = userData.is_mentor;
        const mentorLink = document.getElementById('mentor-profile-nav-link');
        if (mentorLink && isMentor) {
            mentorLink.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        showToast('Failed to load account information', 'error');
    }

    // Handle password change form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                showToast('New passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }

            try {
                const submitBtn = passwordForm.querySelector('button[type="submit"]');
                const originalHTML = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

                await window.api.post('/users/change-password', {
                    currentPassword,
                    newPassword
                });

                showToast('Password updated successfully!', 'success');
                passwordForm.reset();

                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            } catch (error) {
                showToast(error.message || 'Failed to update password', 'error');
                const submitBtn = passwordForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Update Password';
            }
        });
    }

    // Handle privacy settings form
    const privacyForm = document.getElementById('privacy-form');
    if (privacyForm) {
        // Load current privacy settings
        try {
            const privacySettings = await window.api.get('/users/privacy');
            document.getElementById('is_profile_public').checked = privacySettings.is_profile_public;
            document.getElementById('is_email_visible').checked = privacySettings.is_email_visible;
            document.getElementById('is_company_visible').checked = privacySettings.is_company_visible;
            document.getElementById('is_location_visible').checked = privacySettings.is_location_visible;
        } catch (error) {
            console.error('Error loading privacy settings:', error);
        }

        privacyForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const privacyData = {
                is_profile_public: document.getElementById('is_profile_public').checked,
                is_email_visible: document.getElementById('is_email_visible').checked,
                is_company_visible: document.getElementById('is_company_visible').checked,
                is_location_visible: document.getElementById('is_location_visible').checked
            };

            try {
                const submitBtn = privacyForm.querySelector('button[type="submit"]');
                const originalHTML = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

                await window.api.put('/users/privacy', privacyData);

                showToast('Privacy settings updated successfully!', 'success');

                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            } catch (error) {
                showToast(error.message || 'Failed to update privacy settings', 'error');
                const submitBtn = privacyForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Privacy Settings';
            }
        });
    }

    // Handle theme toggle
    const themeToggleSetting = document.getElementById('theme-toggle-setting');
    if (themeToggleSetting) {
        // Set initial state based on current theme
        const currentTheme = localStorage.getItem('theme');
        themeToggleSetting.checked = currentTheme === 'dark-mode';

        themeToggleSetting.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark-mode');
                showToast('Dark mode enabled', 'success');
            } else {
                document.documentElement.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light-mode');
                showToast('Light mode enabled', 'success');
            }
        });
    }

    // Show first tab by default if none are active
    const activeTab = document.querySelector('.settings-tab-content.active');
    if (!activeTab && tabContents.length > 0) {
        tabContents[0].classList.add('active');
        tabContents[0].style.display = 'block';
    }
});
