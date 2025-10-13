// Mentor Profile Page - Combined View/Edit Mode
document.addEventListener('DOMContentLoaded', async () => {
    // Get mentor ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const mentorId = urlParams.get('id');
    
    // DOM Elements
    const loadingState = document.getElementById('loading-state');
    const profileContainer = document.getElementById('profile-container');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const viewMode = document.getElementById('view-mode');
    const editMode = document.getElementById('edit-mode');
    const profileActions = document.getElementById('profile-actions');
    const editProfileForm = document.getElementById('edit-profile-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const previewChangesBtn = document.getElementById('preview-changes-btn');
    const previewModal = document.getElementById('preview-modal');
    const closePreviewModal = document.getElementById('close-preview-modal');
    const backToEditBtn = document.getElementById('back-to-edit-btn');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');
    const requestModal = document.getElementById('request-modal');
    const closeRequestModal = document.getElementById('close-request-modal');
    const cancelRequestBtn = document.getElementById('cancel-request-btn');
    const requestForm = document.getElementById('request-form');
    const profileCompletionBar = document.getElementById('profile-completion-bar');

    // State
    let currentMentor = null;
    let isOwner = false;
    let currentUserId = null;

    // Initialize
    await initializePage();

    // Event Listeners
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', switchToViewMode);
    }
    if (previewChangesBtn) {
        previewChangesBtn.addEventListener('click', showPreview);
    }
    if (closePreviewModal) {
        closePreviewModal.addEventListener('click', closePreview);
    }
    if (backToEditBtn) {
        backToEditBtn.addEventListener('click', closePreview);
    }
    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', confirmAndSave);
    }
    if (closeRequestModal) {
        closeRequestModal.addEventListener('click', closeRequestModalFn);
    }
    if (cancelRequestBtn) {
        cancelRequestBtn.addEventListener('click', closeRequestModalFn);
    }
    if (requestForm) {
        requestForm.addEventListener('submit', handleSendRequest);
    }

    // Availability checkbox handlers
    document.querySelectorAll('.availability-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const day = this.closest('.availability-day').dataset.day;
            const startInput = document.querySelector(`input[name="${day}_start"]`);
            const endInput = document.querySelector(`input[name="${day}_end"]`);
            
            if (this.checked) {
                startInput.disabled = false;
                endInput.disabled = false;
                startInput.required = true;
                endInput.required = true;
            } else {
                startInput.disabled = true;
                endInput.disabled = true;
                startInput.required = false;
                endInput.required = false;
                startInput.value = '';
                endInput.value = '';
            }
        });
    });

    async function initializePage() {
        // Get mentor ID from URL or fetch current user's mentor ID
        let targetMentorId = mentorId;
        
        // Get current user info
        const token = localStorage.getItem('alumniConnectToken');
        if (token) {
            try {
                const userData = await window.api.get('/auth/me');
                currentUserId = userData.userId;
                
                // If no mentor ID provided, try to fetch current user's mentor profile
                if (!targetMentorId) {
                    try {
                        const statusData = await window.api.get('/mentors/status');
                        if (statusData.isMentor && statusData.mentorId) {
                            targetMentorId = statusData.mentorId;
                        } else {
                            showError('You are not registered as a mentor');
                            return;
                        }
                    } catch (error) {
                        showError('Unable to load your mentor profile');
                        return;
                    }
                }
            } catch (error) {
                console.log('Not logged in');
                if (!targetMentorId) {
                    showError('Please sign in to view your profile');
                    return;
                }
            }
        } else if (!targetMentorId) {
            showError('No mentor ID provided');
            return;
        }

        // Load mentor profile with the determined ID
        await loadMentorProfile(targetMentorId);
    }

    async function loadMentorProfile(profileMentorId) {
        showLoading(true);
        
        try {
            // Fetch mentor data
            currentMentor = await window.api.get(`/mentors/${profileMentorId}`);
            
            console.log('Loaded mentor profile:', currentMentor);
            console.log('Current user ID:', currentUserId);
            console.log('Mentor user_id:', currentMentor.user_id);
            
            // Check if current user is the profile owner
            isOwner = currentUserId && currentUserId === currentMentor.user_id;
            
            console.log('isOwner determined as:', isOwner);
            
            // Display profile
            displayProfile(currentMentor);
            
            // Show appropriate actions
            renderProfileActions();
            
            // Calculate and display profile completion (owner only)
            if (isOwner) {
                calculateProfileCompletion(currentMentor);
            }
            
            // Show profile container
            profileContainer.style.display = 'block';
            
        } catch (error) {
            console.error('Error loading mentor profile:', error);
            showError(error.message || 'Failed to load mentor profile');
        } finally {
            showLoading(false);
        }
    }

    function displayProfile(mentor) {
        // Profile Header
        document.getElementById('profile-avatar').src = mentor.profile_pic_url || createInitialsAvatar(mentor.full_name);
        document.getElementById('profile-name').innerHTML = sanitizeHTML(mentor.full_name) + 
            (mentor.verification_status === 'verified' ? ' <i class="fas fa-check-circle verified-badge"></i>' : '');
        document.getElementById('profile-title').textContent = `${mentor.job_title || 'Professional'} at ${mentor.company || 'Independent'}`;
        
        // Rating
        const ratingHTML = `
            <div class="rating-stars">${generateStarRating(mentor.average_rating)}</div>
            <span class="rating-value">${parseFloat(mentor.average_rating || 0).toFixed(1)}</span>
            <span class="rating-count">(${mentor.total_reviews || 0} reviews)</span>
        `;
        document.getElementById('profile-rating').innerHTML = ratingHTML;

        // About
        document.getElementById('view-bio').textContent = mentor.bio || 'No bio available.';

        // Specializations
        displaySpecializations(mentor.specializations);

        // Skills
        displaySkills(mentor.skills);

        // Achievements
        displayAchievements(mentor.achievements);

        // Reviews
        displayReviews(mentor.reviews);

        // Stats
        document.getElementById('view-total-mentees').textContent = mentor.total_mentees || 0;
        document.getElementById('view-total-sessions').textContent = mentor.total_sessions || 0;
        document.getElementById('view-response-time').textContent = `${mentor.response_time_hours || 24}h`;
        document.getElementById('view-success-rate').textContent = `${mentor.success_rate || 100}%`;

        // Details
        document.getElementById('view-industry').textContent = mentor.industry || 'N/A';
        document.getElementById('view-experience').textContent = mentor.experience_years ? `${mentor.experience_years} years` : 'N/A';
        document.getElementById('view-hourly-rate').textContent = mentor.hourly_rate ? `$${mentor.hourly_rate}/hour` : 'Free';
        document.getElementById('view-timezone').textContent = mentor.timezone || 'N/A';
        document.getElementById('view-mentoring-style').textContent = formatMentoringStyle(mentor.mentoring_style);

        // Availability
        displayAvailability(mentor.availability);

        // Languages
        displayLanguages(mentor.languages);

        // Social Links
        displaySocialLinks(mentor);
        
        // Add inline edit buttons if owner
        if (isOwner) {
            addInlineEditButtons();
        }
    }
    
    function addInlineEditButtons() {
        console.log('addInlineEditButtons called');
        // Add edit button to each section header
        const sections = document.querySelectorAll('#view-mode .profile-section h2');
        console.log('Found sections:', sections.length);
        sections.forEach(section => {
            if (!section.querySelector('.edit-section-btn')) {
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-section-btn';
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = 'Edit this section';
                editBtn.onclick = switchToEditMode;
                section.appendChild(editBtn);
                console.log('Added edit button to section:', section.textContent);
            }
        });
        
        // Add edit button to sidebar sections
        const sidebarSections = document.querySelectorAll('#view-mode .sidebar-card h3');
        console.log('Found sidebar sections:', sidebarSections.length);
        sidebarSections.forEach(section => {
            if (!section.querySelector('.edit-section-btn')) {
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-section-btn';
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = 'Edit this section';
                editBtn.onclick = switchToEditMode;
                section.appendChild(editBtn);
                console.log('Added edit button to sidebar section:', section.textContent);
            }
        });
    }

    function displaySpecializations(specializations) {
        const container = document.getElementById('view-specializations');
        if (!specializations || specializations.length === 0) {
            container.innerHTML = '<p class="empty-text">No specializations listed</p>';
            return;
        }

        const html = specializations.map(spec => `
            <div class="specialization-item">
                <div class="spec-header">
                    <span class="spec-name">${sanitizeHTML(spec.specialization)}</span>
                    <span class="spec-level ${spec.proficiency_level}">${spec.proficiency_level || 'intermediate'}</span>
                </div>
                <div class="spec-experience">${spec.years_experience || 0} years</div>
            </div>
        `).join('');
        container.innerHTML = html;
    }

    function displaySkills(skillsString) {
        const container = document.getElementById('view-skills');
        if (!skillsString) {
            container.innerHTML = '<p class="empty-text">No skills listed</p>';
            return;
        }

        const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean);
        const html = skills.map(skill => `<span class="skill-tag">${sanitizeHTML(skill)}</span>`).join('');
        container.innerHTML = html;
    }

    function displayAchievements(achievements) {
        const container = document.getElementById('view-achievements');
        if (!achievements || achievements.length === 0) {
            container.innerHTML = '<p class="empty-text">No achievements listed</p>';
            return;
        }

        const html = achievements.map(achievement => `
            <div class="achievement-item">
                <div class="achievement-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="achievement-content">
                    <h4>${sanitizeHTML(achievement.title)}</h4>
                    <p>${sanitizeHTML(achievement.description || '')}</p>
                    ${achievement.issuer_organization ? `<span class="achievement-issuer">${sanitizeHTML(achievement.issuer_organization)}</span>` : ''}
                </div>
            </div>
        `).join('');
        container.innerHTML = html;
    }

    function displayReviews(reviews) {
        const container = document.getElementById('view-reviews');
        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<p class="empty-text">No reviews yet</p>';
            return;
        }

        const html = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <img src="${review.reviewer_photo || createInitialsAvatar(review.reviewer_name)}" 
                         alt="${sanitizeHTML(review.reviewer_name)}" class="reviewer-avatar">
                    <div class="reviewer-info">
                        <h4>${sanitizeHTML(review.reviewer_name)}</h4>
                        <div class="review-rating">${generateStarRating(review.rating)}</div>
                    </div>
                    <span class="review-date">${formatDate(review.created_at)}</span>
                </div>
                ${review.review_text ? `<p class="review-text">${sanitizeHTML(review.review_text)}</p>` : ''}
            </div>
        `).join('');
        container.innerHTML = html;
    }

    function displayAvailability(availability) {
        const container = document.getElementById('view-availability');
        if (!availability || availability.length === 0) {
            container.innerHTML = '<p class="empty-text">Availability not specified</p>';
            return;
        }

        const html = availability.map(avail => `
            <div class="availability-item">
                <span class="day-name">${capitalizeFirst(avail.day_of_week)}</span>
                <span class="time-range">${avail.start_time} - ${avail.end_time}</span>
            </div>
        `).join('');
        container.innerHTML = html;
    }

    function displayLanguages(languagesString) {
        const container = document.getElementById('view-languages');
        if (!languagesString) {
            container.innerHTML = '<p class="empty-text">No languages listed</p>';
            return;
        }

        const languages = languagesString.split(',').map(l => l.trim()).filter(Boolean);
        const html = languages.map(lang => `<span class="language-tag">${sanitizeHTML(lang)}</span>`).join('');
        container.innerHTML = html;
    }

    function displaySocialLinks(mentor) {
        const container = document.getElementById('view-social-links');
        const links = [];

        if (mentor.linkedin_url) {
            links.push(`<a href="${mentor.linkedin_url}" target="_blank" rel="noopener noreferrer" class="social-link linkedin">
                <i class="fab fa-linkedin"></i> LinkedIn
            </a>`);
        }
        if (mentor.github_url) {
            links.push(`<a href="${mentor.github_url}" target="_blank" rel="noopener noreferrer" class="social-link github">
                <i class="fab fa-github"></i> GitHub
            </a>`);
        }
        if (mentor.portfolio_url) {
            links.push(`<a href="${mentor.portfolio_url}" target="_blank" rel="noopener noreferrer" class="social-link portfolio">
                <i class="fas fa-briefcase"></i> Portfolio
            </a>`);
        }
        if (mentor.email) {
            links.push(`<a href="mailto:${mentor.email}" class="social-link email">
                <i class="fas fa-envelope"></i> Email
            </a>`);
        }

        container.innerHTML = links.length > 0 ? links.join('') : '<p class="empty-text">No links available</p>';
    }

    function renderProfileActions() {
        console.log('renderProfileActions called - isOwner:', isOwner);
        if (isOwner) {
            // Show Edit Profile button for owner - redirects to edit page
            profileActions.innerHTML = `
                <a href="edit-mentor-profile.html" class="btn btn-primary">
                    <i class="fas fa-edit"></i> Edit Profile
                </a>
                <a href="mentor-requests.html" class="btn btn-secondary">
                    <i class="fas fa-inbox"></i> View Requests
                </a>
                <button id="delete-profile-btn" class="btn btn-danger">
                    <i class="fas fa-trash"></i> Delete Profile
                </button>
            `;
            document.getElementById('delete-profile-btn').addEventListener('click', handleDeleteProfile);
        } else {
            // Show Send Request button for others
            const loggedIn = localStorage.getItem('alumniConnectToken');
            if (loggedIn) {
                profileActions.innerHTML = `
                    <button id="send-request-btn" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Send Request
                    </button>
                    <button id="message-btn" class="btn btn-secondary">
                        <i class="fas fa-comments"></i> Message
                    </button>
                `;
                // Add event listeners for these buttons
                document.getElementById('send-request-btn').addEventListener('click', openRequestModal);
                document.getElementById('message-btn').addEventListener('click', () => {
                    showToast('Messaging functionality coming soon!', 'info');
                });
            } else {
                profileActions.innerHTML = `
                    <a href="login.html" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i> Sign In to Connect
                    </a>
                `;
            }
        }
    }

    function switchToEditMode() {
        if (!isOwner) return;

        // Populate edit form with current data
        populateEditForm(currentMentor);

        // Hide view mode, show edit mode
        viewMode.style.display = 'none';
        editMode.style.display = 'block';

        // Update action buttons
        profileActions.innerHTML = `
            <span class="edit-mode-indicator">
                <i class="fas fa-edit"></i> Editing Profile
            </span>
        `;
    }

    function switchToViewMode() {
        // Hide edit mode, show view mode
        editMode.style.display = 'none';
        viewMode.style.display = 'grid';

        // Restore action buttons
        renderProfileActions();
    }

    function populateEditForm(mentor) {
        document.getElementById('edit-bio').value = mentor.bio || '';
        document.getElementById('edit-industry').value = mentor.industry || '';
        document.getElementById('edit-experience-years').value = mentor.experience_years || '';
        document.getElementById('edit-hourly-rate').value = mentor.hourly_rate || '';
        document.getElementById('edit-timezone').value = mentor.timezone || 'UTC';
        document.getElementById('edit-skills').value = mentor.skills || '';
        document.getElementById('edit-languages').value = mentor.languages || '';
        document.getElementById('edit-mentoring-style').value = mentor.mentoring_style || 'one_on_one';
        document.getElementById('edit-linkedin-url').value = mentor.linkedin_url || '';
        document.getElementById('edit-github-url').value = mentor.github_url || '';
        document.getElementById('edit-portfolio-url').value = mentor.portfolio_url || '';
        
        // Populate availability
        if (mentor.availability && mentor.availability.length > 0) {
            mentor.availability.forEach(avail => {
                const day = avail.day_of_week.toLowerCase();
                const checkbox = document.querySelector(`input[name="availability_${day}"]`);
                const startInput = document.querySelector(`input[name="${day}_start"]`);
                const endInput = document.querySelector(`input[name="${day}_end"]`);
                
                if (checkbox) {
                    checkbox.checked = true;
                    if (startInput) {
                        startInput.disabled = false;
                        startInput.required = true;
                        startInput.value = avail.start_time || '';
                    }
                    if (endInput) {
                        endInput.disabled = false;
                        endInput.required = true;
                        endInput.value = avail.end_time || '';
                    }
                }
            });
        }
    }

    // Profile Completion Calculation
    function calculateProfileCompletion(mentor) {
        const fields = [
            { key: 'bio', weight: 15 },
            { key: 'industry', weight: 10 },
            { key: 'experience_years', weight: 10 },
            { key: 'skills', weight: 15 },
            { key: 'languages', weight: 10 },
            { key: 'hourly_rate', weight: 5 },
            { key: 'linkedin_url', weight: 10 },
            { key: 'github_url', weight: 5 },
            { key: 'portfolio_url', weight: 5 },
            { key: 'specializations', weight: 10, isArray: true },
            { key: 'availability', weight: 5, isArray: true }
        ];

        let totalScore = 0;
        let maxScore = 0;
        const missingFields = [];

        fields.forEach(field => {
            maxScore += field.weight;
            if (field.isArray) {
                if (mentor[field.key] && mentor[field.key].length > 0) {
                    totalScore += field.weight;
                } else {
                    missingFields.push(field.key);
                }
            } else {
                if (mentor[field.key]) {
                    totalScore += field.weight;
                } else {
                    missingFields.push(field.key);
                }
            }
        });

        const percentage = Math.round((totalScore / maxScore) * 100);
        
        // Display completion bar
        if (profileCompletionBar) {
            profileCompletionBar.style.display = 'block';
            document.getElementById('completion-percentage').textContent = `${percentage}%`;
            document.getElementById('completion-fill').style.width = `${percentage}%`;
            
            // Set color based on percentage
            const fill = document.getElementById('completion-fill');
            if (percentage >= 80) {
                fill.style.background = 'var(--mentor-success, #50C878)';
            } else if (percentage >= 50) {
                fill.style.background = 'var(--mentor-warning, #FFB347)';
            } else {
                fill.style.background = 'var(--mentor-accent, #FF6B6B)';
            }
            
            // Show tip
            const tipElement = document.getElementById('completion-tip');
            if (percentage < 100) {
                const nextField = missingFields[0];
                const fieldNames = {
                    'bio': 'bio',
                    'skills': 'skills',
                    'specializations': 'specializations',
                    'availability': 'availability schedule',
                    'linkedin_url': 'LinkedIn profile',
                    'github_url': 'GitHub profile',
                    'portfolio_url': 'portfolio URL'
                };
                tipElement.textContent = `💡 Add your ${fieldNames[nextField] || nextField} to complete your profile!`;
            } else {
                tipElement.textContent = '🎉 Your profile is complete!';
            }
        }
    }

    // Preview Changes
    function showPreview() {
        const formData = new FormData(editProfileForm);
        const previewData = {};
        
        for (const [key, value] of formData.entries()) {
            if (value && value.trim()) {
                previewData[key] = value.trim();
            }
        }
        
        // Build preview HTML
        let previewHTML = `
            <div class="preview-content">
                <h3>Profile Preview</h3>
                <div class="preview-section">
                    <h4><i class="fas fa-user"></i> Basic Information</h4>
                    <p><strong>Bio:</strong> ${sanitizeHTML(previewData.bio || currentMentor.bio || 'Not provided')}</p>
                    <p><strong>Industry:</strong> ${sanitizeHTML(previewData.industry || currentMentor.industry || 'Not provided')}</p>
                    <p><strong>Experience:</strong> ${previewData.experience_years || currentMentor.experience_years || 'Not provided'} years</p>
                    <p><strong>Hourly Rate:</strong> $${previewData.hourly_rate || currentMentor.hourly_rate || 'Not set'}/hour</p>
                    <p><strong>Timezone:</strong> ${previewData.timezone || currentMentor.timezone || 'UTC'}</p>
                    <p><strong>Mentoring Style:</strong> ${formatMentoringStyle(previewData.mentoring_style || currentMentor.mentoring_style)}</p>
                </div>
                
                <div class="preview-section">
                    <h4><i class="fas fa-tools"></i> Skills & Languages</h4>
                    <p><strong>Skills:</strong> ${sanitizeHTML(previewData.skills || currentMentor.skills || 'Not provided')}</p>
                    <p><strong>Languages:</strong> ${sanitizeHTML(previewData.languages || currentMentor.languages || 'Not provided')}</p>
                </div>
                
                <div class="preview-section">
                    <h4><i class="fas fa-link"></i> Social Links</h4>
                    <p><strong>LinkedIn:</strong> ${previewData.linkedin_url || currentMentor.linkedin_url || 'Not provided'}</p>
                    <p><strong>GitHub:</strong> ${previewData.github_url || currentMentor.github_url || 'Not provided'}</p>
                    <p><strong>Portfolio:</strong> ${previewData.portfolio_url || currentMentor.portfolio_url || 'Not provided'}</p>
                </div>
                
                <div class="preview-section">
                    <h4><i class="fas fa-calendar-alt"></i> Availability</h4>
                    ${generateAvailabilityPreview(formData)}
                </div>
            </div>
        `;
        
        document.getElementById('preview-modal-body').innerHTML = previewHTML;
        previewModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function generateAvailabilityPreview(formData) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const availDays = [];
        
        days.forEach(day => {
            if (formData.get(`availability_${day}`)) {
                const start = formData.get(`${day}_start`);
                const end = formData.get(`${day}_end`);
                if (start && end) {
                    availDays.push(`<p>${capitalizeFirst(day)}: ${start} - ${end}</p>`);
                }
            }
        });
        
        return availDays.length > 0 ? availDays.join('') : '<p>No availability set</p>';
    }

    function closePreview() {
        previewModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    async function confirmAndSave() {
        closePreview();
        await handleProfileUpdate(new Event('submit'));
    }

    // Send Request Modal
    function openRequestModal() {
        requestModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeRequestModalFn() {
        requestModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('request-message').value = '';
    }

    async function handleSendRequest(e) {
        e.preventDefault();
        
        const message = document.getElementById('request-message').value.trim();
        
        if (!message) {
            showToast('Please enter a message', 'error');
            return;
        }
        
        try {
            showToast('Sending request...', 'info');
            
            await window.api.post('/mentors/request', {
                mentor_id: currentMentor.mentor_id,
                message: message
            });
            
            showToast('Request sent successfully!', 'success');
            closeRequestModalFn();
            
            // Optionally update UI to show request sent
            if (profileActions) {
                profileActions.innerHTML = `
                    <button class="btn btn-success" disabled>
                        <i class="fas fa-check"></i> Request Sent
                    </button>
                `;
            }
            
        } catch (error) {
            console.error('Error sending request:', error);
            showToast(error.message || 'Failed to send request', 'error');
        }
    }

    // Handle Delete Profile
    async function handleDeleteProfile() {
        if (!isOwner) {
            showToast('You can only delete your own profile', 'error');
            return;
        }

        const confirmDelete = confirm(
            'Are you sure you want to delete your mentor profile?\n\n' +
            'This will permanently remove:\n' +
            '• Your mentor profile\n' +
            '• All your specializations\n' +
            '• Your availability schedule\n' +
            '• All mentorship requests\n' +
            '• Your reviews and ratings\n\n' +
            'This action cannot be undone!'
        );

        if (!confirmDelete) {
            return;
        }

        // Double confirmation for such a critical action
        const doubleConfirm = confirm('This is your FINAL WARNING. Delete mentor profile permanently?');
        
        if (!doubleConfirm) {
            return;
        }

        try {
            showToast('Deleting profile...', 'info');
            
            await window.api.del('/mentors/profile');
            
            showToast('Mentor profile deleted successfully!', 'success');
            
            // Redirect to browse mentors page after 2 seconds
            setTimeout(() => {
                window.location.href = 'browse-mentors.html';
            }, 2000);
            
        } catch (error) {
            console.error('Error deleting profile:', error);
            showToast(error.message || 'Failed to delete profile', 'error');
        }
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();

        const formData = new FormData(e.target.tagName === 'FORM' ? e.target : editProfileForm);
        const updates = {};
        const availability = [];

        // Process regular form fields
        for (const [key, value] of formData.entries()) {
            // Skip availability fields, we'll process them separately
            if (key.startsWith('availability_') || key.includes('_start') || key.includes('_end')) {
                continue;
            }
            if (value && value.trim()) {
                updates[key] = value.trim();
            }
        }

        // Process availability
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            if (formData.get(`availability_${day}`)) {
                const start = formData.get(`${day}_start`);
                const end = formData.get(`${day}_end`);
                if (start && end) {
                    availability.push({
                        day_of_week: day,
                        start_time: start,
                        end_time: end
                    });
                }
            }
        });

        if (availability.length > 0) {
            updates.availability = availability;
        }

        try {
            showToast('Updating profile...', 'info');
            
            const result = await window.api.put('/mentors/profile', updates);
            
            showToast('Profile updated successfully!', 'success');
            
            // Reload profile to get fresh data
            const targetMentorId = currentMentor.mentor_id;
            await loadMentorProfile(targetMentorId);
            
            // Switch back to view mode
            switchToViewMode();
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast(error.message || 'Failed to update profile', 'error');
        }
    }

    // Helper Functions
    function showLoading(show) {
        loadingState.style.display = show ? 'flex' : 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorState.style.display = 'flex';
        loadingState.style.display = 'none';
        profileContainer.style.display = 'none';
    }

    function generateStarRating(rating) {
        const stars = [];
        const fullStars = Math.floor(rating || 0);
        const hasHalfStar = (rating || 0) % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push('<i class="fas fa-star star"></i>');
            } else if (i === fullStars && hasHalfStar) {
                stars.push('<i class="fas fa-star-half-alt star"></i>');
            } else {
                stars.push('<i class="far fa-star star"></i>');
            }
        }

        return stars.join('');
    }

    function formatMentoringStyle(style) {
        if (!style) return 'N/A';
        const styles = {
            'one_on_one': 'One-on-One',
            'group': 'Group Sessions',
            'workshop': 'Workshops',
            'mixed': 'Mixed Approach'
        };
        return styles[style] || style;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function sanitizeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function createInitialsAvatar(name) {
        if (!name) return '';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#4A90E2"/>
                <text x="50" y="50" font-size="40" text-anchor="middle" dy=".35em" fill="white" font-family="Arial">${initials}</text>
            </svg>
        `)}`;
    }
});
