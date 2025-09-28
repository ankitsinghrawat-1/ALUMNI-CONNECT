// client/js/profile.js
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('profile-form');
    const userEmail = localStorage.getItem('loggedInUserEmail');
    const userRole = localStorage.getItem('userRole');
    const navLinks = document.querySelectorAll('.profile-nav a');
    const pages = document.querySelectorAll('.profile-page');
    const profilePic = document.getElementById('profile-pic');
    const uploadBtn = document.getElementById('upload-btn');
    const pfpUpload = document.getElementById('profile_picture');
    const privacyForm = document.getElementById('privacy-form');
    const passwordForm = document.getElementById('password-form');
    const verificationSection = document.getElementById('verification-status-section');

    // Role-specific field configurations that match user needs
    const roleFieldsConfig = {
        alumni: ['full_name', 'bio', 'city', 'phone_number', 'linkedin_profile', 'company', 'job_title', 'industry', 'skills', 'institute_name', 'major', 'graduation_year', 'department'],
        student: ['full_name', 'bio', 'city', 'phone_number', 'linkedin_profile', 'skills', 'institute_name', 'major', 'graduation_year', 'department'],
        faculty: ['full_name', 'bio', 'city', 'phone_number', 'linkedin_profile', 'company', 'job_title', 'industry', 'skills', 'department'],
        employer: ['full_name', 'bio', 'city', 'phone_number', 'industry', 'website'],
        institute: ['full_name', 'bio', 'city', 'phone_number', 'website']
    };

    // Profile section tab functionality
    const profileSectionTabs = document.querySelectorAll('.profile-section-tab');
    const profileSectionContents = document.querySelectorAll('.profile-section-content');

    // Profile section tab switching
    profileSectionTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.currentTarget.getAttribute('data-section');
            
            // Remove active class from all tabs and contents
            profileSectionTabs.forEach(t => t.classList.remove('active'));
            profileSectionContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to current tab and content
            e.currentTarget.classList.add('active');
            const targetContent = document.getElementById(`${targetSection}-info`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    const displayMessage = (message, type = 'error', containerId = 'message') => {
        const messageContainer = document.getElementById(containerId);
        if (messageContainer) {
            messageContainer.textContent = message;
            messageContainer.className = `form-message ${type}`;
            setTimeout(() => {
                messageContainer.textContent = '';
                messageContainer.className = 'form-message';
            }, 5000);
        }
    };

    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.hasAttribute('data-tab')) {
                e.preventDefault();
                const targetTab = e.currentTarget.getAttribute('data-tab');
                window.location.hash = targetTab;
            }
        });
    });

    const handleTabSwitching = () => {
        const hash = window.location.hash.substring(1) || 'edit-profile';
        document.querySelectorAll('.profile-nav a').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.profile-page').forEach(page => page.classList.remove('active'));
        document.querySelector(`.profile-nav a[data-tab="${hash}"]`)?.classList.add('active');
        document.getElementById(hash)?.classList.add('active');
    };
    
    window.addEventListener('hashchange', handleTabSwitching);
    handleTabSwitching();

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => pfpUpload.click());
    }

    if (pfpUpload) {
        pfpUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => { profilePic.src = event.target.result; };
                reader.readAsDataURL(file);
            }
        });
    }

    const renderVerificationStatus = (status) => {
        if (!verificationSection) return;
        let content = '';
        switch(status) {
            case 'verified':
                content = `
                    <div class="account-status-card verified">
                        <div class="status-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="status-content">
                            <span class="status-label">Account Status</span>
                            <span class="status-value verified">Verified</span>
                            <button class="btn btn-outline btn-sm" onclick="openAccountStatusModal()">View Details</button>
                        </div>
                    </div>`;
                break;
            case 'pending':
                content = `
                    <div class="account-status-card pending">
                        <div class="status-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="status-content">
                            <span class="status-label">Account Status</span>
                            <span class="status-value pending">Verification Pending</span>
                            <button class="btn btn-outline btn-sm" onclick="openAccountStatusModal()">View Status</button>
                        </div>
                    </div>`;
                break;
            default:
                content = `
                    <div class="account-status-card unverified">
                        <div class="status-icon">
                            <i class="fas fa-exclamation-circle"></i>
                        </div>
                        <div class="status-content">
                            <span class="status-label">Account Status</span>
                            <span class="status-value unverified">Unverified</span>
                            <button id="account-status-btn" class="btn btn-outline btn-sm" onclick="openAccountStatusModal()">Manage Status</button>
                        </div>
                    </div>`;
                break;
        }
        verificationSection.innerHTML = content;
    };

    const updateProfileViewForRole = (role) => {
        const profilePage = document.getElementById('edit-profile');
        if (!profilePage) return;

        // Hide all role-specific fields
        profilePage.querySelectorAll('[data-role]').forEach(el => {
            el.style.display = 'none';
        });

        // Show fields relevant to the current user's role
        profilePage.querySelectorAll(`[data-role*="${role}"]`).forEach(el => {
            el.style.display = 'flex'; // Use flex for profile-field
        });
        
        // Adjust labels based on role
        const nameLabel = document.getElementById('full_name_label');
        if (role === 'employer') {
            nameLabel.innerHTML = '<i class="fas fa-building"></i> Company Name';
        } else if (role === 'institute') {
            nameLabel.innerHTML = '<i class="fas fa-university"></i> Institute Name';
        } else {
            nameLabel.innerHTML = '<i class="fas fa-user"></i> Full Name';
        }

        // Show profile completion status for role-specific fields only
        updateProfileCompletionDisplay(role);
    };

    const updateProfileCompletionDisplay = (role) => {
        // Get role-specific fields
        const requiredFields = roleFieldsConfig[role] || roleFieldsConfig.alumni;
        const completionContainer = document.getElementById('profile-completion-status');
        
        if (!completionContainer) {
            // Create completion status container if it doesn't exist
            const statusContainer = document.createElement('div');
            statusContainer.id = 'profile-completion-status';
            statusContainer.className = 'profile-completion-status';
            
            // Insert after verification section
            const profileForm = document.getElementById('profile-form');
            if (profileForm && verificationSection) {
                verificationSection.parentNode.insertBefore(statusContainer, profileForm);
            }
        }
        
        // This will be updated after profile data is loaded
        showProfileCompletion();
    };

    const showProfileCompletion = async () => {
        try {
            const stats = await window.api.get('/users/dashboard-stats');
            const completionContainer = document.getElementById('profile-completion-status');
            if (completionContainer) {
                const completion = stats.profileCompletion;
                const statusClass = completion >= 80 ? 'complete' : completion >= 50 ? 'partial' : 'incomplete';
                
                completionContainer.innerHTML = `
                    <div class="completion-widget">
                        <div class="completion-header">
                            <h4><i class="fas fa-chart-pie"></i> Profile Completion</h4>
                            <span class="completion-percentage ${statusClass}">${completion}%</span>
                        </div>
                        <div class="completion-bar">
                            <div class="completion-fill" style="width: ${completion}%"></div>
                        </div>
                        <p class="completion-text">
                            ${completion >= 80 ? 'Great! Your profile is well-completed.' : 
                              completion >= 50 ? 'Good progress! Add more details to improve visibility.' : 
                              'Complete your profile to increase visibility and opportunities.'}
                        </p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error fetching profile completion:', error);
        }
    };

    const openEditModal = (field, currentValue, fieldType = 'text') => {
        const modal = document.getElementById('edit-field-modal');
        if (!modal) {
            createEditModal();
            return openEditModal(field, currentValue, fieldType);
        }
        
        const modalTitle = modal.querySelector('.modal-title');
        const modalInput = modal.querySelector('.modal-input');
        const saveBtn = modal.querySelector('.save-field-btn');
        
        // Set modal content based on field
        const fieldLabels = {
            'full_name': 'Full Name',
            'bio': 'Bio',
            'company': 'Company/Institution',
            'job_title': 'Job Title',
            'city': 'City',
            'linkedin_profile': 'LinkedIn Profile',
            'institute_name': 'Institute Name',
            'major': 'Major',
            'graduation_year': 'Graduation Year',
            'department': 'Department',
            'industry': 'Industry',
            'skills': 'Skills',
            'website': 'Website'
        };
        
        modalTitle.textContent = `Edit ${fieldLabels[field] || field}`;
        
        if (fieldType === 'textarea') {
            modalInput.outerHTML = '<textarea class="modal-input" rows="4"></textarea>';
        } else {
            modalInput.outerHTML = `<input type="${fieldType}" class="modal-input">`;
        }
        
        const newInput = modal.querySelector('.modal-input');
        newInput.value = currentValue || '';
        newInput.focus();
        
        // Clear previous event listeners and add new one
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        newSaveBtn.addEventListener('click', () => {
            saveFieldValue(field, newInput.value);
            modal.style.display = 'none';
        });
        
        modal.style.display = 'flex';
    };

    const createEditModal = () => {
        const modal = document.createElement('div');
        modal.id = 'edit-field-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Edit Field</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <input type="text" class="modal-input">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                    <button type="button" class="btn btn-primary save-field-btn">Save</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    };

    const saveFieldValue = async (field, value) => {
        try {
            const formData = new FormData();
            formData.append(field, value);
            
            const result = await window.api.putForm('/users/profile', formData);
            
            // Update the display
            const displayElement = document.querySelector(`.display-field[data-field="${field}"]`);
            if (displayElement) {
                displayElement.textContent = value || 'Not set';
            }
            
            // Update profile completion
            showProfileCompletion();
            
            showToast('Profile updated successfully!', 'success');
        } catch (error) {
            showToast('Error updating profile: ' + error.message, 'error');
        }
    };


    const populateProfileData = (data) => {
        const fields = ['full_name', 'bio', 'company', 'job_title', 'city', 'linkedin_profile', 'institute_name', 'major', 'graduation_year', 'department', 'industry', 'skills', 'website'];
        fields.forEach(id => {
            const displayElement = document.querySelector(`.display-field[data-field="${id}"]`);
            const inputElement = document.querySelector(`.edit-field[name="${id}"]`);
            if (displayElement) displayElement.textContent = data[id] || 'Not set';
            if (inputElement) inputElement.value = data[id] || '';
        });

        const badgeContainer = document.getElementById('profile-verified-badge');
        if(badgeContainer) {
            badgeContainer.innerHTML = data.verification_status === 'verified' ? '<span class="verified-badge-sm" title="Verified"><i class="fas fa-check-circle"></i></span>' : '';
        }
        
        renderVerificationStatus(data.verification_status);
        document.getElementById('email').textContent = data.email || 'Not set';

        profilePic.src = data.profile_pic_url ? `http://localhost:3000/${data.profile_pic_url}` : createInitialsAvatar(data.full_name);
        profilePic.onerror = () => { profilePic.src = createInitialsAvatar(data.full_name); };
        
        // Update the view based on the user's role
        updateProfileViewForRole(userRole);
        
        // Show profile completion after data is loaded
        setTimeout(() => showProfileCompletion(), 100);
    };

    const fetchUserProfile = async () => {
        try {
            const data = await window.api.get(`/users/profile`);
            populateProfileData(data);
        } catch (error) {
            displayMessage('An error occurred while fetching profile data.');
        }
    };

    const fetchPrivacySettings = async () => {
        try {
            const settings = await window.api.get(`/users/privacy`);
            document.getElementById('is_profile_public').checked = settings.is_profile_public;
            document.getElementById('is_email_visible').checked = settings.is_email_visible;
            document.getElementById('is_company_visible').checked = settings.is_company_visible;
            document.getElementById('is_location_visible').checked = settings.is_location_visible;
        } catch (error) {
            console.error('Error fetching privacy settings:', error);
        }
    };

    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const parent = e.target.closest('.profile-field');
            const displayField = parent.querySelector('.display-field');
            const fieldName = displayField.getAttribute('data-field');
            const currentValue = displayField.textContent === 'Not set' ? '' : displayField.textContent;
            
            // Determine field type based on field name
            let fieldType = 'text';
            if (fieldName === 'bio' || fieldName === 'skills') {
                fieldType = 'textarea';
            } else if (fieldName === 'linkedin_profile' || fieldName === 'website') {
                fieldType = 'url';
            } else if (fieldName === 'graduation_year') {
                fieldType = 'number';
            }
            
            openEditModal(fieldName, currentValue, fieldType);
        });
    });

    document.querySelectorAll('.edit-field').forEach(field => {
        field.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.nextElementSibling.click();
            }
        });
    });

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            try {
                const result = await window.api.putForm(`/users/profile`, formData);
                showToast(result.message, 'success');

                const updatedProfile = result.user;
                
                if (updatedProfile.profile_pic_url) {
                    localStorage.setItem('userPfpUrl', updatedProfile.profile_pic_url);
                } else {
                    localStorage.removeItem('userPfpUrl');
                }
                
                setTimeout(() => window.location.reload(), 1500);
                
            } catch (error) {
                displayMessage(`Error: ${error.message}`);
            }
        });
    }

    if(privacyForm) {
        privacyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const settings = {
                is_profile_public: document.getElementById('is_profile_public').checked,
                is_email_visible: document.getElementById('is_email_visible').checked,
                is_company_visible: document.getElementById('is_company_visible').checked,
                is_location_visible: document.getElementById('is_location_visible').checked
            };
            try {
                const result = await window.api.put(`/users/privacy`, settings);
                displayMessage(result.message, 'success', 'privacy-message');
            } catch (error) {
                displayMessage(error.message, 'error', 'privacy-message');
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                displayMessage('New passwords do not match.', 'error', 'password-message');
                return;
            }

            try {
                const result = await window.api.post('/users/change-password', { currentPassword, newPassword });
                displayMessage(result.message, 'success', 'password-message');
                passwordForm.reset();
            } catch (error) {
                displayMessage(error.message, 'error', 'password-message');
            }
        });
    }

    if(verificationSection) {
        verificationSection.addEventListener('click', async (e) => {
            if (e.target.id === 'request-verification-btn') {
                e.target.disabled = true;
                e.target.textContent = 'Submitting...';
                try {
                    const result = await window.api.post('/users/request-verification', {});
                    showToast(result.message, 'success');
                    renderVerificationStatus('pending');
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    e.target.disabled = false;
                    e.target.textContent = 'Request Verification';
                }
            }
        });
    }

    // Account Status Modal Functions
    window.openAccountStatusModal = async () => {
        const modal = document.getElementById('account-status-modal');
        const content = document.getElementById('account-status-content');
        
        try {
            const data = await window.api.get(`/users/profile`);
            let statusContent = '';
            
            switch(data.verification_status) {
                case 'verified':
                    statusContent = `
                        <div class="status-info verified">
                            <div class="status-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h4>Account Verified</h4>
                            <p>Your account has been successfully verified by our administrators.</p>
                            <div class="status-benefits">
                                <h5>Benefits of verified status:</h5>
                                <ul>
                                    <li>Verified badge on your profile</li>
                                    <li>Higher visibility in searches</li>
                                    <li>Access to exclusive verified-only groups</li>
                                    <li>Increased trust from other users</li>
                                </ul>
                            </div>
                        </div>
                    `;
                    break;
                case 'pending':
                    statusContent = `
                        <div class="status-info pending">
                            <div class="status-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <h4>Verification Pending</h4>
                            <p>Your verification request is currently being reviewed by our administrators.</p>
                            <div class="status-timeline">
                                <div class="timeline-item completed">
                                    <i class="fas fa-check"></i>
                                    <span>Documents submitted</span>
                                </div>
                                <div class="timeline-item active">
                                    <i class="fas fa-eye"></i>
                                    <span>Under review</span>
                                </div>
                                <div class="timeline-item">
                                    <i class="fas fa-trophy"></i>
                                    <span>Verification complete</span>
                                </div>
                            </div>
                            <p><small>Review typically takes 2-3 business days.</small></p>
                        </div>
                    `;
                    break;
                default:
                    statusContent = `
                        <div class="status-info unverified">
                            <div class="status-icon">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                            <h4>Account Not Verified</h4>
                            <p>Verify your account to gain additional privileges and increase your credibility in the alumni network.</p>
                            <div class="verification-steps">
                                <h5>To get verified:</h5>
                                <ol>
                                    <li>Upload a verification document (ID, diploma, etc.)</li>
                                    <li>Wait for admin review (2-3 business days)</li>
                                    <li>Receive verified status upon approval</li>
                                </ol>
                            </div>
                            <button class="btn btn-primary" onclick="showVerificationUpload()">
                                <i class="fas fa-upload"></i> Start Verification Process
                            </button>
                        </div>
                    `;
                    break;
            }
            
            content.innerHTML = statusContent;
            modal.style.display = 'block';
        } catch (error) {
            console.error('Error loading account status:', error);
            content.innerHTML = `
                <div class="status-info error">
                    <div class="status-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h4>Error Loading Status</h4>
                    <p>Unable to load account status. Please try again later.</p>
                </div>
            `;
            modal.style.display = 'block';
        }
    };

    window.closeAccountStatusModal = () => {
        document.getElementById('account-status-modal').style.display = 'none';
        document.getElementById('verification-upload-section').style.display = 'none';
    };

    window.showVerificationUpload = () => {
        document.getElementById('verification-upload-section').style.display = 'block';
    };

    window.hideVerificationUpload = () => {
        document.getElementById('verification-upload-section').style.display = 'none';
    };

    // Handle verification upload form
    document.getElementById('verification-upload-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        const fileInput = document.getElementById('verification-document');
        
        if (fileInput.files.length === 0) {
            showToast('Please select a verification document', 'error');
            return;
        }
        
        formData.append('verification_document', fileInput.files[0]);
        
        try {
            const result = await window.api.post('/users/request-verification', formData);
            showToast(result.message, 'success');
            closeAccountStatusModal();
            renderVerificationStatus('pending');
        } catch (error) {
            showToast(error.message || 'Error uploading verification document', 'error');
        }
    });

    await fetchUserProfile();
    await fetchPrivacySettings();
});