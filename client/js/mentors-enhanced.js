// Enhanced Mentors Landing Page JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const featuredMentorsContainer = document.getElementById('featured-mentors-preview');
    const mentorActionArea = document.getElementById('mentor-action-area');
    const categoryCards = document.querySelectorAll('.category-card');
    
    // State
    let sentRequests = [];
    let featuredMentors = [];

    // Initialize
    await initializePage();

    // Event Listeners
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            window.location.href = `browse-mentors.html?industry=${encodeURIComponent(category)}`;
        });
    });

    // Initialize page
    async function initializePage() {
        try {
            // Check mentor status and load action area
            await checkMentorStatus();
            
            // Load featured mentors preview
            await loadFeaturedMentors();
            
        } catch (error) {
            showError('Failed to load mentors data');
        }
    }

    // Check if user is a mentor and set action area
    async function checkMentorStatus() {
        const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
        
        if (!loggedInUserEmail) {
            mentorActionArea.innerHTML = `
                <a href="login.html" class="btn btn-primary">
                    <i class="fas fa-sign-in-alt"></i>
                    Sign In to Connect
                </a>
            `;
            return;
        }

        try {
            const data = await window.api.get('/mentors/status');
            
            if (data.isMentor) {
                mentorActionArea.innerHTML = `
                    <a href="mentor-requests.html" class="btn btn-primary">
                        <i class="fas fa-inbox"></i>
                        View Requests
                    </a>
                    <a href="edit-mentor.html" class="btn btn-secondary">
                        <i class="fas fa-edit"></i>
                        Edit Profile
                    </a>
                `;
            } else {
                mentorActionArea.innerHTML = `
                    <a href="become-mentor.html" class="btn btn-primary">
                        <i class="fas fa-user-plus"></i>
                        Become a Mentor
                    </a>
                `;

                // Load sent requests for non-mentors
                try {
                    const requestsData = await window.api.get('/mentors/requests/sent');
                    sentRequests = requestsData.map(req => ({
                        mentor_id: req.mentor_user_id,
                        status: req.status,
                        message: req.request_message
                    }));
                } catch (error) {
                }
            }
        } catch (error) {
            mentorActionArea.innerHTML = `
                <a href="become-mentor.html" class="btn btn-primary">
                    <i class="fas fa-user-plus"></i>
                    Become a Mentor
                </a>
            `;
        }
    }

    // Load featured mentors preview
    async function loadFeaturedMentors() {
        try {
            // Load top 6 mentors for preview
            const response = await window.api.get('/mentors', { 
                params: { 
                    limit: 6, 
                    sort: 'rating', 
                    order: 'desc' 
                } 
            });
            
            featuredMentors = response.mentors || [];
            displayFeaturedMentors(featuredMentors);
            
        } catch (error) {
            featuredMentorsContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Unable to load mentors</h3>
                    <p>Please try refreshing the page or check back later.</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        <i class="fas fa-refresh"></i>
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Display featured mentors
    function displayFeaturedMentors(mentors) {
        if (!mentors || mentors.length === 0) {
            featuredMentorsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>No mentors available</h3>
                    <p>Be the first to join our mentorship community!</p>
                    <a href="become-mentor.html" class="btn btn-primary">
                        <i class="fas fa-user-plus"></i>
                        Become a Mentor
                    </a>
                </div>
            `;
            return;
        }

        featuredMentorsContainer.innerHTML = '';
        
        mentors.forEach(mentor => {
            const mentorCard = createMentorCard(mentor);
            featuredMentorsContainer.appendChild(mentorCard);
        });
    }

    // Create mentor card
    function createMentorCard(mentor) {
        const card = document.createElement('div');
        card.className = 'mentor-card';
        card.setAttribute('data-mentor-id', mentor.mentor_id);
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View ${mentor.full_name}'s profile`);

        // Get request status
        const requestStatus = getRequestStatus(mentor.user_id);
        
        // Process specializations
        const specializations = mentor.specializations ? 
            mentor.specializations.split(',').slice(0, 3) : [];

        card.innerHTML = `
            <div class="mentor-header">
                <div class="mentor-status">
                    ${mentor.verification_level === 'verified' ? '<span class="status-badge verified"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
                    ${mentor.is_premium ? '<span class="status-badge premium"><i class="fas fa-crown"></i> Premium</span>' : ''}
                </div>
                <div class="mentor-avatar">
                    <img src="${mentor.profile_pic_url || createInitialsAvatar(mentor.full_name)}" 
                         alt="${sanitizeHTML(mentor.full_name)}" 
                         onerror="this.src=createInitialsAvatar('${mentor.full_name.replace(/'/g, "\\\\'")}')" />
                </div>
                <h3 class="mentor-name">
                    ${sanitizeHTML(mentor.full_name)}
                    ${mentor.verification_status === 'verified' ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                </h3>
                <p class="mentor-title">${sanitizeHTML(mentor.job_title || 'Professional')}</p>
                <p class="mentor-company">${sanitizeHTML(mentor.company || 'Independent')}</p>
            </div>

            <div class="mentor-body">
                <div class="mentor-rating">
                    <div class="rating-stars">
                        ${generateStarRating(mentor.average_rating)}
                    </div>
                    <span class="rating-value">${parseFloat(mentor.average_rating || 0).toFixed(1)}</span>
                    <span class="rating-count">(${mentor.total_reviews || 0})</span>
                </div>

                <div class="mentor-stats">
                    <div class="stat">
                        <span class="stat-value">${mentor.experience_years || 0}</span>
                        <span class="stat-label">Years</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${mentor.total_sessions || 0}</span>
                        <span class="stat-label">Sessions</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${mentor.total_mentees || 0}</span>
                        <span class="stat-label">Mentees</span>
                    </div>
                </div>

                ${mentor.bio ? `<p class="mentor-bio">${sanitizeHTML(mentor.bio)}</p>` : ''}

                ${specializations.length > 0 ? `
                    <div class="mentor-specializations">
                        <span class="specializations-label">Specializations</span>
                        <div class="specialization-tags">
                            ${specializations.map(spec => `
                                <span class="specialization-tag">${sanitizeHTML(spec.trim())}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Mentor Badges -->
                <div class="mentor-badges" id="badges-${mentor.mentor_id}"></div>
            </div>

            <div class="mentor-footer">
                <div class="mentor-actions">
                    ${generateActionButtons(mentor, requestStatus)}
                </div>
                <div class="response-time">
                    <span class="response-indicator"></span>
                    <span>~${mentor.response_time_hours || 24}h response</span>
                </div>
            </div>
        `;

        // Load and display badges asynchronously
        if (window.mentorFeatures) {
            window.mentorFeatures.loadMentorBadges(mentor.mentor_id).then(badges => {
                const container = document.getElementById(`badges-${mentor.mentor_id}`);
                if (container && badges.length > 0) {
                    window.mentorFeatures.renderMentorBadges(badges.slice(0, 3), container);
                }
            }).catch(err => console.error('Error loading badges:', err));
        }

        // Add click handler for viewing full profile
        card.addEventListener('click', (e) => {
            // Don't navigate if clicking on action buttons
            if (!e.target.closest('.mentor-btn')) {
                window.location.href = `browse-mentors.html#mentor-${mentor.mentor_id}`;
            }
        });

        // Add action button handlers
        const actionBtns = card.querySelectorAll('.mentor-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleMentorAction(btn.dataset.action, mentor, btn);
            });
        });

        return card;
    }

    // Generate star rating HTML
    function generateStarRating(rating) {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

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

    // Get request status for mentor
    function getRequestStatus(mentorUserId) {
        const request = sentRequests.find(req => req.mentor_id === mentorUserId);
        return request ? request.status : null;
    }

    // Generate action buttons
    function generateActionButtons(mentor, requestStatus) {
        const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
        
        if (!loggedInUserEmail) {
            return `
                <button class="mentor-btn primary" data-action="login">
                    <i class="fas fa-sign-in-alt"></i>
                    Sign In
                </button>
            `;
        }

        if (requestStatus === 'pending') {
            return `
                <button class="mentor-btn success disabled">
                    <i class="fas fa-clock"></i>
                    Request Sent
                </button>
            `;
        }

        if (requestStatus === 'accepted') {
            return `
                <button class="mentor-btn success" data-action="message">
                    <i class="fas fa-comments"></i>
                    Message
                </button>
            `;
        }

        return `
            <button class="mentor-btn primary" data-action="request">
                <i class="fas fa-paper-plane"></i>
                Send Request
            </button>
        `;
    }

    // Handle mentor actions
    async function handleMentorAction(action, mentor, button) {
        switch (action) {
            case 'login':
                window.location.href = 'login.html';
                break;
            case 'request':
                openRequestModal(mentor);
                break;
            case 'message':
                // Implement messaging functionality
                showToast('Messaging feature coming soon!', 'info');
                break;
        }
    }

    // Open request modal
    function openRequestModal(mentor) {
        const modal = document.getElementById('request-modal');
        const mentorIdInput = document.getElementById('mentor-id-input');
        const modalTitle = document.getElementById('modal-title');
        
        mentorIdInput.value = mentor.user_id;
        modalTitle.textContent = `Send Request to ${mentor.full_name}`;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Modal close handlers
    document.querySelectorAll('.modal .close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
            document.body.style.overflow = '';
        });
    });

    // Request form handling
    const requestForm = document.getElementById('request-form');
    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const mentorId = document.getElementById('mentor-id-input').value;
            const message = document.getElementById('request-message').value;
            const submitBtn = document.getElementById('modal-submit-btn');
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                
                await window.api.post('/mentors/request', {
                    mentor_id: mentorId,
                    message: message
                });
                
                showToast('Mentorship request sent successfully!', 'success');
                
                // Update sent requests
                sentRequests.push({
                    mentor_id: parseInt(mentorId),
                    status: 'pending',
                    message: message
                });
                
                // Refresh featured mentors to update buttons
                displayFeaturedMentors(featuredMentors);
                
                // Close modal
                document.getElementById('request-modal').style.display = 'none';
                document.body.style.overflow = '';
                
                // Reset form
                requestForm.reset();
                
            } catch (error) {
                showToast(error.message || 'Failed to send request', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Request';
            }
        });
    }

    // Utility functions
    function sanitizeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function createInitialsAvatar(name) {
        if (!name) return '';
        const initials = name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const color = colors[name.length % colors.length];
        
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="40" fill="${color}"/>
                <text x="40" y="48" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
                      fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
            </svg>
        `)}`;
    }

    function showError(message) {
        showToast(message, 'error');
    }

    // Toast notifications
    function showToast(message, type = 'info') {
        if (window.Toastify) {
            const backgrounds = {
                success: 'linear-gradient(to right, #00b09b, #96c93d)',
                error: 'linear-gradient(to right, #ff5f6d, #ffc371)',
                info: 'linear-gradient(to right, #667eea, #764ba2)',
                warning: 'linear-gradient(to right, #f093fb, #f5576c)'
            };

            window.Toastify({
                text: message,
                duration: 3000,
                gravity: 'top',
                position: 'right',
                background: backgrounds[type] || backgrounds.info,
                stopOnFocus: true
            }).showToast();
        }
    }

    // Add CSS for enhanced styling
    const additionalStyles = document.createElement('style');
    additionalStyles.textContent = `
        /* Success Stories Section */
        .success-stories-section {
            padding: 4rem 0;
            background: var(--mentor-gray-50);
        }

        html.dark-mode .success-stories-section {
            background: var(--mentor-gray-900);
        }

        .stories-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .story-card {
            background: var(--surface-color);
            border-radius: var(--mentor-border-radius-lg);
            padding: 2rem;
            box-shadow: var(--mentor-shadow);
            border: 1px solid var(--border-color);
            transition: var(--mentor-transition);
        }

        .story-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--mentor-shadow-lg);
        }

        .story-quote {
            margin-bottom: 2rem;
        }

        .story-quote i {
            color: var(--mentor-primary);
            font-size: 1.5rem;
            margin-bottom: 1rem;
            display: block;
        }

        .story-quote p {
            font-style: italic;
            font-size: 1.125rem;
            line-height: 1.6;
            color: var(--text-color);
        }

        .story-author {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .author-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
        }

        .author-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .author-info h4 {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-color);
            margin-bottom: 0.25rem;
        }

        .author-info p {
            font-size: 0.875rem;
            color: var(--mentor-gray-600);
        }

        /* Mentors CTA */
        .mentors-cta {
            margin-top: 3rem;
            text-align: center;
            padding: 3rem;
            background: linear-gradient(135deg, var(--mentor-primary) 0%, var(--mentor-primary-dark) 100%);
            border-radius: var(--mentor-border-radius-lg);
            color: white;
        }

        .cta-content h3 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }

        .cta-content p {
            font-size: 1.125rem;
            opacity: 0.9;
            margin-bottom: 2rem;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
        }

        .cta-content .btn {
            background: white;
            color: var(--mentor-primary);
            font-weight: 600;
            padding: 1rem 2rem;
            border-radius: 8px;
            transition: var(--mentor-transition);
        }

        .cta-content .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        /* Error State */
        .error-state {
            text-align: center;
            padding: 3rem 2rem;
            background: var(--surface-color);
            border-radius: var(--mentor-border-radius-lg);
            border: 2px dashed var(--border-color);
        }

        .error-icon {
            width: 60px;
            height: 60px;
            background: var(--mentor-accent);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: white;
            font-size: 1.5rem;
        }

        .error-state h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-color);
            margin-bottom: 1rem;
        }

        .error-state p {
            color: var(--mentor-gray-600);
            margin-bottom: 2rem;
        }

        /* Category Card Hover Effects */
        .category-card {
            cursor: pointer;
            transition: var(--mentor-transition);
        }

        .category-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--mentor-shadow-lg);
            border-color: var(--mentor-primary);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .stories-grid {
                grid-template-columns: 1fr;
            }
            
            .mentors-cta {
                padding: 2rem 1rem;
            }
            
            .cta-content h3 {
                font-size: 1.5rem;
            }
        }
    `;
    document.head.appendChild(additionalStyles);
});