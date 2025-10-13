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

    async function initializePage() {
        // Check if mentor ID is provided
        if (!mentorId) {
            showError('No mentor ID provided');
            return;
        }

        // Get current user info
        const token = localStorage.getItem('alumniConnectToken');
        if (token) {
            try {
                const userData = await window.api.get('/auth/me');
                currentUserId = userData.userId;
            } catch (error) {
                console.log('Not logged in');
            }
        }

        // Load mentor profile
        await loadMentorProfile();
    }

    async function loadMentorProfile() {
        showLoading(true);
        
        try {
            // Fetch mentor data
            currentMentor = await window.api.get(`/mentors/${mentorId}`);
            
            // Check if current user is the profile owner
            isOwner = currentUserId && currentUserId === currentMentor.user_id;
            
            // Display profile
            displayProfile(currentMentor);
            
            // Show appropriate actions
            renderProfileActions();
            
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
        if (isOwner) {
            // Show Edit Profile button for owner
            profileActions.innerHTML = `
                <button id="edit-profile-btn" class="btn btn-primary">
                    <i class="fas fa-edit"></i> Edit Profile
                </button>
                <a href="mentor-requests.html" class="btn btn-secondary">
                    <i class="fas fa-inbox"></i> View Requests
                </a>
            `;
            document.getElementById('edit-profile-btn').addEventListener('click', switchToEditMode);
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
                document.getElementById('send-request-btn').addEventListener('click', () => {
                    showToast('Request functionality coming soon!', 'info');
                });
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
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const updates = {};

        for (const [key, value] of formData.entries()) {
            if (value && value.trim()) {
                updates[key] = value.trim();
            }
        }

        try {
            showToast('Updating profile...', 'info');
            
            const result = await window.api.put('/mentors/profile', updates);
            
            showToast('Profile updated successfully!', 'success');
            
            // Reload profile to get fresh data
            await loadMentorProfile();
            
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
