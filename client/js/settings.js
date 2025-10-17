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
    const profileLinks = document.querySelectorAll('.profile-link[data-tab]');
    const tabContents = document.querySelectorAll('.profile-tab-content');

    profileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');

            // Update active link
            profileLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show corresponding tab
            tabContents.forEach(tab => {
                tab.style.display = 'none';
            });
            const targetTab = document.getElementById(`${tabId}-tab`);
            if (targetTab) {
                targetTab.style.display = 'block';
            }
        });
    });

    // Check if user is a mentor and show/hide mentor profile link
    try {
        const userData = await window.api.get('/users/profile');
        const isMentor = userData.is_mentor;
        const mentorLink = document.getElementById('mentor-profile-nav-link');
        if (mentorLink && isMentor) {
            mentorLink.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
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
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

                await window.api.post('/users/change-password', {
                    currentPassword,
                    newPassword
                });

                showToast('Password updated successfully!', 'success');
                passwordForm.reset();

                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Update Password';
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
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

                await window.api.put('/users/privacy', privacyData);

                showToast('Privacy settings updated successfully!', 'success');

                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Privacy Settings';
            } catch (error) {
                showToast(error.message || 'Failed to update privacy settings', 'error');
                const submitBtn = privacyForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Privacy Settings';
            }
        });
    }
});
