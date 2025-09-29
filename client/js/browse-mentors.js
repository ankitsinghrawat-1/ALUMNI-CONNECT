// Enhanced Browse Mentors JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const searchInput = document.getElementById('mentor-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const searchBtn = document.getElementById('search-btn');
    const filterToggle = document.getElementById('filter-toggle');
    const filtersPanel = document.getElementById('filters-panel');
    const filterCount = document.getElementById('filter-count');
    const viewBtns = document.querySelectorAll('.view-btn');
    const sortSelect = document.getElementById('sort-select');
    const mentorsGrid = document.getElementById('mentors-grid');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const resultsTitle = document.getElementById('results-title');
    const resultsCount = document.getElementById('results-count');
    const paginationContainer = document.getElementById('pagination-container');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const mentorActionArea = document.getElementById('mentor-action-area');
    const resetSearchBtn = document.getElementById('reset-search');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const applyFiltersBtn = document.getElementById('apply-filters');

    // Filter Elements
    const industryFilter = document.getElementById('industry-filter');
    const experienceMinFilter = document.getElementById('experience-min');
    const experienceMaxFilter = document.getElementById('experience-max');
    const ratingStars = document.querySelectorAll('#rating-filter .star');
    const ratingText = document.getElementById('rating-text');
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-value');
    const mentoringStyleFilter = document.getElementById('mentoring-style-filter');
    const languagesFilter = document.getElementById('languages-filter');
    const specializationFilter = document.getElementById('specialization-filter');
    const verificationFilter = document.getElementById('verification-filter');

    // State
    let currentPage = 1;
    let currentFilters = {};
    let currentView = 'grid';
    let currentSort = 'rating_desc';
    let totalPages = 1;
    let isLoading = false;
    let sentRequests = [];
    let mentorStats = {};
    let selectedRating = 0;

    // Initialize
    await initializePage();

    // Event Listeners
    searchInput.addEventListener('input', handleSearchInput);
    clearSearchBtn.addEventListener('click', clearSearch);
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    filterToggle.addEventListener('click', toggleFilters);
    viewBtns.forEach(btn => btn.addEventListener('click', handleViewChange));
    sortSelect.addEventListener('change', handleSortChange);
    resetSearchBtn.addEventListener('click', resetSearch);
    clearFiltersBtn.addEventListener('click', clearAllFilters);
    applyFiltersBtn.addEventListener('click', applyFilters);

    // Filter Event Listeners
    ratingStars.forEach((star, index) => {
        star.addEventListener('click', () => setRating(index + 1));
        star.addEventListener('mouseenter', () => highlightStars(index + 1));
        star.addEventListener('mouseleave', () => highlightStars(selectedRating));
    });

    priceRange.addEventListener('input', updatePriceDisplay);

    // Pagination
    prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));

    // Initialize page
    async function initializePage() {
        showLoading(true);
        
        try {
            // Check mentor status
            await checkMentorStatus();
            
            // Load mentor stats and populate filters
            await loadMentorStats();
            
            // Load initial mentors
            await loadMentors();
            
        } catch (error) {
            console.error('Error initializing page:', error);
            showError('Failed to load mentors. Please refresh the page.');
        } finally {
            showLoading(false);
        }
    }

    // Check if user is a mentor
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
            }

            // Load sent requests
            if (!data.isMentor) {
                const requestsData = await window.api.get('/mentors/requests/sent');
                sentRequests = requestsData.map(req => ({
                    mentor_id: req.mentor_user_id,
                    status: req.status,
                    message: req.request_message
                }));
            }
        } catch (error) {
            console.error('Error checking mentor status:', error);
            mentorActionArea.innerHTML = `
                <a href="become-mentor.html" class="btn btn-primary">
                    <i class="fas fa-user-plus"></i>
                    Become a Mentor
                </a>
            `;
        }
    }

    // Load mentor statistics and populate filter dropdowns
    async function loadMentorStats() {
        try {
            const stats = await window.api.get('/mentors/stats/overview');
            mentorStats = stats;

            // Update stats display
            updateStatsDisplay(stats.overview);

            // Populate industry filter
            populateFilter(industryFilter, stats.top_industries, 'industry', 'mentor_count');

            // Populate specialization filter
            populateFilter(specializationFilter, stats.top_specializations, 'specialization', 'mentor_count');

        } catch (error) {
            console.error('Error loading mentor stats:', error);
        }
    }

    // Update stats display
    function updateStatsDisplay(stats) {
        const totalMentors = document.querySelector('[data-stat="total_mentors"]');
        const avgRating = document.querySelector('[data-stat="avg_rating"]');
        const totalSessions = document.querySelector('[data-stat="total_sessions"]');

        if (totalMentors) totalMentors.textContent = formatNumber(stats.total_mentors);
        if (avgRating) avgRating.textContent = parseFloat(stats.avg_rating).toFixed(1);
        if (totalSessions) totalSessions.textContent = formatNumber(stats.total_sessions_completed);
    }

    // Populate filter dropdowns
    function populateFilter(selectElement, data, valueKey, countKey) {
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = `${item[valueKey]} (${item[countKey]})`;
            selectElement.appendChild(option);
        });
    }

    // Load mentors with current filters
    async function loadMentors(resetPage = false) {
        if (isLoading) return;
        
        isLoading = true;
        showLoading(true);

        if (resetPage) {
            currentPage = 1;
        }

        try {
            const params = buildQueryParams();
            const data = await window.api.get('/mentors', { params });

            displayMentors(data.mentors);
            updatePagination(data.pagination);
            updateResultsInfo(data);

            if (data.mentors.length === 0) {
                showEmpty(true);
            } else {
                showEmpty(false);
            }

        } catch (error) {
            console.error('Error loading mentors:', error);
            showError('Failed to load mentors. Please try again.');
        } finally {
            isLoading = false;
            showLoading(false);
        }
    }

    // Build query parameters
    function buildQueryParams() {
        const params = {
            page: currentPage,
            limit: 12,
            sort: currentSort.split('_')[0],
            order: currentSort.split('_')[1]
        };

        // Add search
        if (searchInput.value.trim()) {
            params.search = searchInput.value.trim();
        }

        // Add filters
        Object.entries(currentFilters).forEach(([key, value]) => {
            if (value !== null && value !== '' && value !== undefined) {
                params[key] = value;
            }
        });

        return params;
    }

    // Display mentors
    function displayMentors(mentors) {
        mentorsGrid.innerHTML = '';

        mentors.forEach(mentor => {
            const mentorCard = createMentorCard(mentor);
            mentorsGrid.appendChild(mentorCard);
        });
    }

    // Create mentor card
    function createMentorCard(mentor) {
        const card = document.createElement('div');
        card.className = `mentor-card ${currentView}-view`;
        card.setAttribute('data-mentor-id', mentor.mentor_id);
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View ${mentor.full_name}'s profile`);

        // Get request status
        const requestStatus = getRequestStatus(mentor.user_id);
        
        // Generate specializations
        const specializations = mentor.specializations ? 
            mentor.specializations.split(',').slice(0, 3) : [];

        card.innerHTML = `
            <div class="mentor-header">
                <div class="mentor-status">
                    ${mentor.verification_level === 'verified' ? '<span class="status-badge verified"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
                    ${mentor.is_premium ? '<span class="status-badge premium"><i class="fas fa-crown"></i> Premium</span>' : ''}
                    <span class="status-badge online"><i class="fas fa-circle"></i> Online</span>
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
                    <span class="rating-count">(${mentor.total_reviews || 0} reviews)</span>
                </div>

                <div class="mentor-stats">
                    <div class="stat">
                        <span class="stat-value">${mentor.experience_years || 0}</span>
                        <span class="stat-label">Years Exp</span>
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
                            ${specializations.map(spec => `<span class="specialization-tag">${sanitizeHTML(spec.trim())}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${mentor.hourly_rate > 0 ? `
                    <div class="mentor-pricing">
                        <div class="pricing-info">
                            <span class="price-amount">$${mentor.hourly_rate}</span>
                            <span class="price-period">per hour</span>
                        </div>
                        <span class="pricing-type">${mentor.mentoring_style}</span>
                    </div>
                ` : ''}
            </div>

            <div class="mentor-footer">
                <div class="mentor-actions">
                    ${generateActionButtons(mentor, requestStatus)}
                </div>
                <div class="response-time">
                    <span class="response-indicator"></span>
                    <span>Responds in ${mentor.response_time_hours || 24}h</span>
                </div>
            </div>
        `;

        // Add click handlers
        card.addEventListener('click', () => showMentorProfile(mentor.mentor_id));
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showMentorProfile(mentor.mentor_id);
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
                    Sign In to Connect
                </button>
            `;
        }

        if (requestStatus === 'pending') {
            return `
                <button class="mentor-btn success disabled">
                    <i class="fas fa-clock"></i>
                    Request Sent
                </button>
                <button class="mentor-btn secondary" data-action="view-profile">
                    <i class="fas fa-eye"></i>
                    View Profile
                </button>
            `;
        }

        if (requestStatus === 'accepted') {
            return `
                <button class="mentor-btn success" data-action="message">
                    <i class="fas fa-comments"></i>
                    Message
                </button>
                <button class="mentor-btn secondary" data-action="view-profile">
                    <i class="fas fa-eye"></i>
                    View Profile
                </button>
            `;
        }

        return `
            <button class="mentor-btn primary" data-action="request">
                <i class="fas fa-paper-plane"></i>
                Send Request
            </button>
            <button class="mentor-btn secondary" data-action="view-profile">
                <i class="fas fa-eye"></i>
                View Profile
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
            case 'view-profile':
                showMentorProfile(mentor.mentor_id);
                break;
        }
    }

    // Show mentor profile modal
    async function showMentorProfile(mentorId) {
        const modal = document.getElementById('mentor-profile-modal');
        const content = document.getElementById('mentor-profile-content');
        
        try {
            content.innerHTML = '<div class="loading-container"><div class="loading-spinner"><div class="spinner"></div></div><p>Loading profile...</p></div>';
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';

            const mentor = await window.api.get(`/mentors/${mentorId}`);
            content.innerHTML = generateMentorProfileHTML(mentor);

        } catch (error) {
            console.error('Error loading mentor profile:', error);
            content.innerHTML = '<div class="error-state"><h3>Error loading profile</h3><p>Please try again later.</p></div>';
        }
    }

    // Generate mentor profile HTML
    function generateMentorProfileHTML(mentor) {
        return `
            <div class="mentor-profile-full">
                <div class="profile-header">
                    <div class="profile-hero">
                        <div class="profile-avatar-large">
                            <img src="${mentor.profile_pic_url || createInitialsAvatar(mentor.full_name)}" 
                                 alt="${sanitizeHTML(mentor.full_name)}" />
                        </div>
                        <div class="profile-info">
                            <h1>${sanitizeHTML(mentor.full_name)} ${mentor.verification_status === 'verified' ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}</h1>
                            <p class="profile-title">${sanitizeHTML(mentor.job_title || 'Professional')} at ${sanitizeHTML(mentor.company || 'Independent')}</p>
                            <div class="profile-rating">
                                <div class="rating-stars">${generateStarRating(mentor.average_rating)}</div>
                                <span class="rating-value">${parseFloat(mentor.average_rating || 0).toFixed(1)}</span>
                                <span class="rating-count">(${mentor.total_reviews || 0} reviews)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="profile-content">
                    <div class="profile-section">
                        <h3>About</h3>
                        <p>${sanitizeHTML(mentor.bio || 'No bio available.')}</p>
                    </div>

                    ${mentor.specializations && mentor.specializations.length > 0 ? `
                        <div class="profile-section">
                            <h3>Specializations</h3>
                            <div class="specialization-list">
                                ${mentor.specializations.map(spec => `
                                    <div class="specialization-item">
                                        <span class="spec-name">${sanitizeHTML(spec.specialization)}</span>
                                        <span class="spec-level">${spec.proficiency_level}</span>
                                        <span class="spec-experience">${spec.years_experience} years</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${mentor.achievements && mentor.achievements.length > 0 ? `
                        <div class="profile-section">
                            <h3>Achievements</h3>
                            <div class="achievements-grid">
                                ${mentor.achievements.slice(0, 6).map(achievement => `
                                    <div class="achievement-card">
                                        <div class="achievement-icon">
                                            <i class="fas fa-trophy"></i>
                                        </div>
                                        <div class="achievement-info">
                                            <h4>${sanitizeHTML(achievement.title)}</h4>
                                            <p>${sanitizeHTML(achievement.issuer_organization || '')}</p>
                                            <span class="achievement-date">${formatDate(achievement.achievement_date)}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${mentor.reviews && mentor.reviews.length > 0 ? `
                        <div class="profile-section">
                            <h3>Recent Reviews</h3>
                            <div class="reviews-list">
                                ${mentor.reviews.map(review => `
                                    <div class="review-card">
                                        <div class="review-header">
                                            <div class="reviewer-info">
                                                <img src="${review.reviewer_photo || createInitialsAvatar(review.reviewer_name)}" 
                                                     alt="${sanitizeHTML(review.reviewer_name)}" class="reviewer-avatar" />
                                                <div>
                                                    <h5>${sanitizeHTML(review.reviewer_name)}</h5>
                                                    <div class="review-rating">${generateStarRating(review.rating)}</div>
                                                </div>
                                            </div>
                                            <span class="review-date">${formatDate(review.created_at)}</span>
                                        </div>
                                        <p class="review-text">${sanitizeHTML(review.review_text || '')}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Search handling
    function handleSearchInput() {
        const value = searchInput.value.trim();
        clearSearchBtn.style.display = value ? 'block' : 'none';
    }

    function clearSearch() {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        loadMentors(true);
    }

    function performSearch() {
        loadMentors(true);
    }

    function resetSearch() {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        clearAllFilters();
        loadMentors(true);
    }

    // Filter handling
    function toggleFilters() {
        const isActive = filtersPanel.classList.toggle('active');
        filterToggle.classList.toggle('active', isActive);
    }

    function setRating(rating) {
        selectedRating = selectedRating === rating ? 0 : rating;
        highlightStars(selectedRating);
        updateRatingText();
        currentFilters.rating_min = selectedRating || null;
        updateFilterCount();
    }

    function highlightStars(rating) {
        ratingStars.forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }

    function updateRatingText() {
        if (selectedRating === 0) {
            ratingText.textContent = 'Any Rating';
        } else {
            ratingText.textContent = `${selectedRating}+ Stars`;
        }
    }

    function updatePriceDisplay() {
        const value = priceRange.value;
        priceValue.textContent = value >= 500 ? '$500+' : `$${value}`;
        currentFilters.hourly_rate_max = value >= 500 ? null : parseInt(value);
        updateFilterCount();
    }

    function clearAllFilters() {
        // Reset all filter inputs
        industryFilter.value = '';
        experienceMinFilter.value = '';
        experienceMaxFilter.value = '';
        mentoringStyleFilter.value = '';
        languagesFilter.value = '';
        specializationFilter.value = '';
        verificationFilter.value = '';
        priceRange.value = 500;
        
        // Reset rating
        selectedRating = 0;
        highlightStars(0);
        updateRatingText();
        updatePriceDisplay();
        
        // Clear filters object
        currentFilters = {};
        updateFilterCount();
    }

    function applyFilters() {
        // Collect all filter values
        currentFilters = {
            industry: industryFilter.value || null,
            experience_min: experienceMinFilter.value ? parseInt(experienceMinFilter.value) : null,
            experience_max: experienceMaxFilter.value ? parseInt(experienceMaxFilter.value) : null,
            rating_min: selectedRating || null,
            hourly_rate_max: priceRange.value >= 500 ? null : parseInt(priceRange.value),
            mentoring_style: mentoringStyleFilter.value || null,
            languages: languagesFilter.value || null,
            specialization: specializationFilter.value || null,
            verification_level: verificationFilter.value || null
        };

        updateFilterCount();
        loadMentors(true);
        
        // Hide filters panel on mobile
        if (window.innerWidth <= 768) {
            toggleFilters();
        }
    }

    function updateFilterCount() {
        const activeFilters = Object.values(currentFilters).filter(value => 
            value !== null && value !== '' && value !== undefined
        ).length;
        
        if (activeFilters > 0) {
            filterCount.textContent = activeFilters;
            filterCount.style.display = 'flex';
        } else {
            filterCount.style.display = 'none';
        }
    }

    // View and sorting
    function handleViewChange(e) {
        const newView = e.target.dataset.view;
        if (newView === currentView) return;

        viewBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        currentView = newView;
        mentorsGrid.className = `mentors-grid ${currentView}-view`;
    }

    function handleSortChange() {
        currentSort = sortSelect.value;
        loadMentors(true);
    }

    // Pagination
    function updatePagination(pagination) {
        if (!pagination) return;

        totalPages = pagination.pages;
        currentPage = pagination.page;

        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
        
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        
        paginationContainer.style.display = totalPages > 1 ? 'flex' : 'none';
    }

    function changePage(newPage) {
        if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
        
        currentPage = newPage;
        loadMentors();
        
        // Scroll to top of results
        document.querySelector('.results-section').scrollIntoView({ behavior: 'smooth' });
    }

    function updateResultsInfo(data) {
        if (!data.pagination) return;

        const { total, page, limit } = data.pagination;
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);

        if (total === 0) {
            resultsCount.textContent = 'No mentors found';
        } else {
            resultsCount.textContent = `Showing ${start}-${end} of ${total} mentors`;
        }

        // Update title based on search/filters
        const hasSearch = searchInput.value.trim();
        const hasFilters = Object.values(currentFilters).some(v => v !== null && v !== '' && v !== undefined);

        if (hasSearch) {
            resultsTitle.textContent = `Search Results for "${searchInput.value.trim()}"`;
        } else if (hasFilters) {
            resultsTitle.textContent = 'Filtered Mentors';
        } else {
            resultsTitle.textContent = 'Featured Mentors';
        }
    }

    // UI State Management
    function showLoading(show) {
        loadingState.style.display = show ? 'flex' : 'none';
        if (show) {
            emptyState.style.display = 'none';
            paginationContainer.style.display = 'none';
        }
    }

    function showEmpty(show) {
        emptyState.style.display = show ? 'flex' : 'none';
        if (show) {
            paginationContainer.style.display = 'none';
        }
    }

    function showError(message) {
        showToast(message, 'error');
    }

    // Utility functions
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

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

    // Modal handling
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
                
                // Refresh mentors to update buttons
                loadMentors();
                
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
});