// client/js/mentors.js
document.addEventListener('DOMContentLoaded', async () => {
    const mentorsListContainer = document.getElementById('mentors-list-container');
    const mentorActionArea = document.getElementById('mentor-action-area');
    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    
    // Modals
    const requestModal = document.getElementById('request-modal');
    const editRequestModal = document.getElementById('edit-request-modal');

    // Helper function to generate star rating
    function generateStarRating(rating, reviewCount) {
        if (!rating || rating === 0) {
            return `
                <div class="stars">
                    <span class="no-rating">No rating yet</span>
                </div>
            `;
        }
        
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHtml = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star star-filled"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt star-filled"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star star-empty"></i>';
        }
        
        return `
            <div class="stars">
                ${starsHtml}
                <span class="rating-info">
                    <span class="rating-value">${rating.toFixed(1)}</span>
                    <span class="review-count">(${reviewCount} reviews)</span>
                </span>
            </div>
        `;
    }

    // Advanced Search and Filtering System
    const initializeSearchAndFilters = () => {
        const filtersToggle = document.getElementById('filters-toggle');
        const advancedFilters = document.getElementById('advanced-filters');
        const searchInput = document.getElementById('mentor-search');
        const searchBtn = document.getElementById('search-btn');
        const clearFiltersBtn = document.getElementById('clear-filters');
        const applyFiltersBtn = document.getElementById('apply-filters');
        const sortSelect = document.getElementById('sort-select');
        const viewToggleBtn = document.getElementById('view-toggle');
        const filterCount = document.getElementById('filter-count');
        const resultsCount = document.getElementById('results-count');
        
        let originalMentors = [];
        let filteredMentors = [];
        let activeFilters = {};
        let currentView = 'grid'; // 'grid' or 'list'
        
        // Toggle advanced filters
        if (filtersToggle && advancedFilters) {
            filtersToggle.addEventListener('click', () => {
                advancedFilters.classList.toggle('active');
                filtersToggle.classList.toggle('active');
            });
        }
        
        // Search functionality
        if (searchInput && searchBtn) {
            const performSearch = () => {
                const query = searchInput.value.toLowerCase().trim();
                activeFilters.search = query;
                applyAllFilters();
            };
            
            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
            
            // Real-time search (debounced)
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const query = searchInput.value.toLowerCase().trim();
                    if (query.length >= 2 || query.length === 0) {
                        activeFilters.search = query;
                        applyAllFilters();
                    }
                }, 300);
            });
        }
        
        // Filter event listeners
        const filterElements = [
            'industry-filter', 'experience-filter', 'style-filter', 
            'price-filter', 'rating-filter', 'availability-filter', 
            'response-filter', 'language-filter'
        ];
        
        filterElements.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    const filterKey = filterId.replace('-filter', '');
                    activeFilters[filterKey] = element.value;
                    updateFilterCount();
                    applyAllFilters();
                });
            }
        });
        
        // Clear filters
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                activeFilters = {};
                filterElements.forEach(filterId => {
                    const element = document.getElementById(filterId);
                    if (element) element.value = '';
                });
                if (searchInput) searchInput.value = '';
                updateFilterCount();
                applyAllFilters();
            });
        }
        
        // Apply filters manually
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                applyAllFilters();
                if (advancedFilters) advancedFilters.classList.remove('active');
                if (filtersToggle) filtersToggle.classList.remove('active');
            });
        }
        
        // Sort functionality
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                sortMentors(sortSelect.value);
            });
        }
        
        // View toggle
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => {
                currentView = currentView === 'grid' ? 'list' : 'grid';
                viewToggleBtn.innerHTML = currentView === 'grid' ? 
                    '<i class="fas fa-list"></i>' : '<i class="fas fa-th"></i>';
                updateMentorsLayout();
                renderMentors(filteredMentors);
            });
        }
        
        // Apply all active filters
        function applyAllFilters() {
            filteredMentors = originalMentors.filter(mentor => {
                // Search filter
                if (activeFilters.search) {
                    const searchTerms = activeFilters.search.toLowerCase();
                    const searchableText = `
                        ${mentor.full_name} 
                        ${mentor.company} 
                        ${mentor.expertise_areas} 
                        ${mentor.skills} 
                        ${mentor.industry}
                    `.toLowerCase();
                    
                    if (!searchableText.includes(searchTerms)) {
                        return false;
                    }
                }
                
                // Industry filter
                if (activeFilters.industry && mentor.industry !== activeFilters.industry) {
                    return false;
                }
                
                // Experience filter
                if (activeFilters.experience) {
                    const years = mentor.experience_years || 0;
                    switch (activeFilters.experience) {
                        case '1-3': if (years < 1 || years > 3) return false; break;
                        case '4-7': if (years < 4 || years > 7) return false; break;
                        case '8-15': if (years < 8 || years > 15) return false; break;
                        case '16+': if (years < 16) return false; break;
                    }
                }
                
                // Mentoring style filter
                if (activeFilters.style && mentor.mentoring_style !== activeFilters.style) {
                    return false;
                }
                
                // Price filter
                if (activeFilters.price) {
                    const rate = mentor.hourly_rate || 0;
                    switch (activeFilters.price) {
                        case 'free': if (rate > 0) return false; break;
                        case '1-50': if (rate < 1 || rate > 50) return false; break;
                        case '51-100': if (rate < 51 || rate > 100) return false; break;
                        case '101-200': if (rate < 101 || rate > 200) return false; break;
                        case '201+': if (rate < 201) return false; break;
                    }
                }
                
                // Rating filter
                if (activeFilters.rating) {
                    const rating = mentor.average_rating || 0;
                    const minRating = parseFloat(activeFilters.rating.replace('+', ''));
                    if (activeFilters.rating === 'unrated') {
                        if (rating > 0) return false;
                    } else if (rating < minRating) {
                        return false;
                    }
                }
                
                // Response time filter
                if (activeFilters.response) {
                    const responseTime = mentor.response_time_hours || 24;
                    const maxTime = parseInt(activeFilters.response.replace('+', ''));
                    if (activeFilters.response.includes('+')) {
                        if (responseTime < maxTime) return false;
                    } else {
                        if (responseTime > maxTime) return false;
                    }
                }
                
                // Language filter
                if (activeFilters.language) {
                    const languages = mentor.languages || 'English';
                    if (!languages.includes(activeFilters.language)) {
                        return false;
                    }
                }
                
                return true;
            });
            
            updateResultsCount();
            renderMentors(filteredMentors);
        }
        
        // Sort mentors
        function sortMentors(sortBy) {
            switch (sortBy) {
                case 'rating':
                    filteredMentors.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
                    break;
                case 'experience':
                    filteredMentors.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
                    break;
                case 'price-low':
                    filteredMentors.sort((a, b) => (a.hourly_rate || 0) - (b.hourly_rate || 0));
                    break;
                case 'price-high':
                    filteredMentors.sort((a, b) => (b.hourly_rate || 0) - (a.hourly_rate || 0));
                    break;
                case 'response-time':
                    filteredMentors.sort((a, b) => (a.response_time_hours || 24) - (b.response_time_hours || 24));
                    break;
                case 'newest':
                    filteredMentors.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                    break;
                default: // relevance/best match
                    // Keep original order or implement relevance scoring
                    break;
            }
            renderMentors(filteredMentors);
        }
        
        // Update filter count
        function updateFilterCount() {
            const count = Object.values(activeFilters).filter(value => value && value !== '').length;
            if (filterCount) {
                filterCount.textContent = count;
                filterCount.classList.toggle('visible', count > 0);
            }
        }
        
        // Update results count
        function updateResultsCount() {
            if (resultsCount) {
                const count = filteredMentors.length;
                resultsCount.textContent = `${count} mentor${count !== 1 ? 's' : ''} found`;
            }
        }
        
        // Initialize with original mentors
        window.initializeSearchResults = (mentors) => {
            originalMentors = mentors;
            filteredMentors = [...mentors];
            updateResultsCount();
        };
        
        // Render mentors function
        function renderMentors(mentorsToRender) {
            if (!mentorsToRender || mentorsToRender.length === 0) {
                mentorsListContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No mentors found</h3>
                        <p>Try adjusting your search criteria or filters to find more mentors that match your needs.</p>
                    </div>
                `;
                return;
            }
            
            mentorsListContainer.innerHTML = '';
            const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
            
            mentorsToRender.forEach(mentor => {
                if (mentor.email === loggedInUserEmail) return;
                
                // Use the existing mentor card generation logic
                const requestStatus = null; // Would need to be implemented
                let buttonsHtml = `<button class="btn btn-primary btn-sm request-mentor-btn" data-id="${mentor.user_id}" data-name="${sanitizeHTML(mentor.full_name)}">
                    <i class="fas fa-paper-plane"></i> Request Mentorship
                </button>`;
                
                const mentorItem = document.createElement('div');
                mentorItem.classList.add('enhanced-mentor-card');
                
                // Generate mentor card HTML (reuse existing logic)
                const profilePicUrl = mentor.profile_pic_url ? `http://localhost:3000/${mentor.profile_pic_url}` : createInitialsAvatar(mentor.full_name);
                const skillsArray = mentor.skills ? mentor.skills.split(',').map(s => s.trim()).slice(0, 4) : [];
                const skillsHtml = skillsArray.length > 0 ? skillsArray.map(skill => 
                    `<span class="skill-badge">${sanitizeHTML(skill)}</span>`
                ).join('') : '<span class="no-skills">No skills listed</span>';
                const moreSkillsCount = mentor.skills ? mentor.skills.split(',').length - 4 : 0;
                const moreSkillsHtml = moreSkillsCount > 0 ? `<span class="more-skills">+${moreSkillsCount} more</span>` : '';
                const industryBadge = mentor.industry ? `<span class="industry-badge">${sanitizeHTML(mentor.industry)}</span>` : '';
                const experienceBadge = mentor.experience_years ? `<span class="experience-badge">${mentor.experience_years}+ years</span>` : '';
                const rating = mentor.average_rating || 0;
                const reviewCount = mentor.total_reviews || 0;
                const starsHtml = generateStarRating(rating, reviewCount);
                const premiumBadge = mentor.is_premium ? '<span class="premium-badge"><i class="fas fa-crown"></i> Premium</span>' : '';
                const responseTime = mentor.response_time_hours ? `${mentor.response_time_hours}h response` : '24h response';
                const isOnline = Math.random() > 0.6;
                const onlineStatus = isOnline ? '<span class="online-indicator"></span>' : '';
                
                mentorItem.innerHTML = `
                    <div class="mentor-card-header">
                        <div class="mentor-avatar">
                            ${onlineStatus}
                            <img src="${profilePicUrl}" alt="${sanitizeHTML(mentor.full_name)}" 
                                 onerror="this.onerror=null; this.src=createInitialsAvatar('${mentor.full_name.replace(/'/g, "\\'")}');">
                        </div>
                        <div class="mentor-badges">
                            ${premiumBadge}
                            ${mentor.verification_status === 'verified' ? '<span class="verified-badge"><i class="fas fa-check-circle"></i></span>' : ''}
                        </div>
                    </div>
                    
                    <div class="mentor-card-body">
                        <div class="mentor-info">
                            <h3 class="mentor-name">${sanitizeHTML(mentor.full_name)}</h3>
                            <p class="mentor-title">${sanitizeHTML(mentor.job_title || 'Professional')}</p>
                            <p class="mentor-company">${sanitizeHTML(mentor.company || 'Independent')}</p>
                        </div>
                        
                        <div class="mentor-meta">
                            ${industryBadge}
                            ${experienceBadge}
                            <span class="response-time"><i class="fas fa-clock"></i> ${responseTime}</span>
                        </div>
                        
                        <div class="mentor-rating">
                            ${starsHtml}
                        </div>
                        
                        <div class="mentor-expertise">
                            <div class="expertise-label">
                                <i class="fas fa-lightbulb"></i>
                                <span>Expertise</span>
                            </div>
                            <p class="expertise-text">${sanitizeHTML(mentor.expertise_areas || 'General mentoring')}</p>
                        </div>
                        
                        <div class="mentor-skills">
                            <div class="skills-container">
                                ${skillsHtml}
                                ${moreSkillsHtml}
                            </div>
                        </div>
                        
                        ${mentor.bio ? `<div class="mentor-bio">
                            <p>${sanitizeHTML(mentor.bio).substring(0, 120)}${mentor.bio.length > 120 ? '...' : ''}</p>
                        </div>` : ''}
                    </div>
                    
                    <div class="mentor-card-footer">
                        <div class="mentor-stats">
                            <div class="stat-item">
                                <i class="fas fa-users"></i>
                                <span>${mentor.total_mentees || 0} mentees</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-calendar-check"></i>
                                <span>${mentor.total_sessions || 0} sessions</span>
                            </div>
                            ${mentor.is_premium ? `<div class="stat-item">
                                <i class="fas fa-dollar-sign"></i>
                                <span>$${mentor.hourly_rate || 50}/hr</span>
                            </div>` : '<div class="stat-item free-badge"><i class="fas fa-heart"></i><span>Free</span></div>'}
                        </div>
                        
                        <div class="mentor-actions">
                            <a href="view-profile.html?email=${mentor.email}" class="btn btn-secondary btn-sm">
                                <i class="fas fa-user"></i> Profile
                            </a>
                            ${buttonsHtml}
                        </div>
                    </div>
                `;
                
                mentorsListContainer.appendChild(mentorItem);
            });
        }
    };

    const checkMentorStatus = async () => {
        if (!loggedInUserEmail || !mentorActionArea) return;
        try {
            const data = await window.api.get('/mentors/status');
            if (data.isMentor) {
                mentorActionArea.innerHTML = `
                    <a href="mentor-requests.html" class="btn btn-primary"><i class="fas fa-inbox"></i> View Requests</a>
                    <a href="edit-mentor.html" class="btn btn-secondary"><i class="fas fa-edit"></i> Edit Profile</a>
                `;
            } else {
                mentorActionArea.innerHTML = `<a href="become-mentor.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Become a Mentor</a>`;
            }
        } catch (error) {
            console.error('Error checking mentor status:', error);
            mentorActionArea.innerHTML = `<a href="become-mentor.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Become a Mentor</a>`;
        }
    };

    // Update container class for enhanced layout
    const updateMentorsLayout = () => {
        if (mentorsListContainer.classList.contains('mentors-grid')) {
            mentorsListContainer.classList.remove('mentors-grid');
            mentorsListContainer.classList.add('enhanced-mentors-grid');
        }
    };

    const fetchAndRenderMentors = async () => {
        updateMentorsLayout();
        
        mentorsListContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p>Finding amazing mentors for you...</p>
            </div>
        `;
        try {
            const [mentors, sentRequests] = await Promise.all([
                window.api.get('/mentors'),
                loggedInUserEmail ? window.api.get('/mentors/requests/sent') : Promise.resolve([])
            ]);
            
            // Initialize search system with fetched mentors
            if (window.initializeSearchResults) {
                window.initializeSearchResults(mentors);
            }
            
            const sentRequestsMap = new Map(sentRequests.map(req => [req.mentor_user_id, {status: req.status, message: req.request_message}]));

            mentorsListContainer.innerHTML = '';

            if (mentors.length > 0) {
                mentors.forEach(mentor => {
                    if (mentor.email === loggedInUserEmail) return;

                    const requestStatus = sentRequestsMap.get(mentor.user_id);
                    let buttonsHtml = '';

                    if (requestStatus) {
                        switch (requestStatus.status) {
                            case 'pending':
                                buttonsHtml += `
                                    <button class="btn btn-warning btn-sm edit-request-btn" data-id="${mentor.user_id}" data-name="${sanitizeHTML(mentor.full_name)}" data-message="${sanitizeHTML(requestStatus.message)}">
                                        <i class="fas fa-edit"></i> Edit Request
                                    </button>
                                    <button class="btn btn-danger btn-sm cancel-request-btn" data-id="${mentor.user_id}">
                                        <i class="fas fa-times"></i> Cancel
                                    </button>
                                `;
                                break;
                            case 'accepted':
                                buttonsHtml += `<a href="messages.html" class="btn btn-success btn-sm">
                                    <i class="fas fa-comments"></i> Message
                                </a>`;
                                break;
                            case 'declined':
                                buttonsHtml += `<button class="btn btn-primary btn-sm request-mentor-btn" data-id="${mentor.user_id}" data-name="${sanitizeHTML(mentor.full_name)}">
                                    <i class="fas fa-redo"></i> Request Again
                                </button>`;
                                break;
                        }
                    } else {
                        buttonsHtml += `<button class="btn btn-primary btn-sm request-mentor-btn" data-id="${mentor.user_id}" data-name="${sanitizeHTML(mentor.full_name)}">
                            <i class="fas fa-paper-plane"></i> Request Mentorship
                        </button>`;
                    }

                    const mentorItem = document.createElement('div');
                    mentorItem.classList.add('enhanced-mentor-card');
                    const profilePicUrl = mentor.profile_pic_url ? `http://localhost:3000/${mentor.profile_pic_url}` : createInitialsAvatar(mentor.full_name);

                    // Format skills array
                    const skillsArray = mentor.skills ? mentor.skills.split(',').map(s => s.trim()).slice(0, 4) : [];
                    const skillsHtml = skillsArray.length > 0 ? skillsArray.map(skill => 
                        `<span class="skill-badge">${sanitizeHTML(skill)}</span>`
                    ).join('') : '<span class="no-skills">No skills listed</span>';

                    // More skills indicator
                    const moreSkillsCount = mentor.skills ? mentor.skills.split(',').length - 4 : 0;
                    const moreSkillsHtml = moreSkillsCount > 0 ? `<span class="more-skills">+${moreSkillsCount} more</span>` : '';

                    // Industry badge
                    const industryBadge = mentor.industry ? `<span class="industry-badge">${sanitizeHTML(mentor.industry)}</span>` : '';

                    // Experience badge  
                    const experienceBadge = mentor.experience_years ? `<span class="experience-badge">${mentor.experience_years}+ years</span>` : '';

                    // Rating display
                    const rating = mentor.average_rating || 0;
                    const reviewCount = mentor.total_reviews || 0;
                    const starsHtml = generateStarRating(rating, reviewCount);

                    // Premium badge
                    const premiumBadge = mentor.is_premium ? '<span class="premium-badge"><i class="fas fa-crown"></i> Premium</span>' : '';

                    // Response time
                    const responseTime = mentor.response_time_hours ? `${mentor.response_time_hours}h response` : '24h response';

                    // Online status (mock for now)
                    const isOnline = Math.random() > 0.6; // Mock online status
                    const onlineStatus = isOnline ? '<span class="online-indicator"></span>' : '';

                    mentorItem.innerHTML = `
                        <div class="mentor-card-header">
                            <div class="mentor-avatar">
                                ${onlineStatus}
                                <img src="${profilePicUrl}" alt="${sanitizeHTML(mentor.full_name)}" 
                                     onerror="this.onerror=null; this.src=createInitialsAvatar('${mentor.full_name.replace(/'/g, "\\'")}');">
                            </div>
                            <div class="mentor-badges">
                                ${premiumBadge}
                                ${mentor.verification_status === 'verified' ? '<span class="verified-badge"><i class="fas fa-check-circle"></i></span>' : ''}
                            </div>
                        </div>
                        
                        <div class="mentor-card-body">
                            <div class="mentor-info">
                                <h3 class="mentor-name">${sanitizeHTML(mentor.full_name)}</h3>
                                <p class="mentor-title">${sanitizeHTML(mentor.job_title || 'Professional')}</p>
                                <p class="mentor-company">${sanitizeHTML(mentor.company || 'Independent')}</p>
                            </div>
                            
                            <div class="mentor-meta">
                                ${industryBadge}
                                ${experienceBadge}
                                <span class="response-time"><i class="fas fa-clock"></i> ${responseTime}</span>
                            </div>
                            
                            <div class="mentor-rating">
                                ${starsHtml}
                            </div>
                            
                            <div class="mentor-expertise">
                                <div class="expertise-label">
                                    <i class="fas fa-lightbulb"></i>
                                    <span>Expertise</span>
                                </div>
                                <p class="expertise-text">${sanitizeHTML(mentor.expertise_areas || 'General mentoring')}</p>
                            </div>
                            
                            <div class="mentor-skills">
                                <div class="skills-container">
                                    ${skillsHtml}
                                    ${moreSkillsHtml}
                                </div>
                            </div>
                            
                            ${mentor.bio ? `<div class="mentor-bio">
                                <p>${sanitizeHTML(mentor.bio).substring(0, 120)}${mentor.bio.length > 120 ? '...' : ''}</p>
                            </div>` : ''}
                        </div>
                        
                        <div class="mentor-card-footer">
                            <div class="mentor-stats">
                                <div class="stat-item">
                                    <i class="fas fa-users"></i>
                                    <span>${mentor.total_mentees || 0} mentees</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-calendar-check"></i>
                                    <span>${mentor.total_sessions || 0} sessions</span>
                                </div>
                                ${mentor.is_premium ? `<div class="stat-item">
                                    <i class="fas fa-dollar-sign"></i>
                                    <span>$${mentor.hourly_rate || 50}/hr</span>
                                </div>` : '<div class="stat-item free-badge"><i class="fas fa-heart"></i><span>Free</span></div>'}
                            </div>
                            
                            <div class="mentor-actions">
                                <a href="view-profile.html?email=${mentor.email}" class="btn btn-secondary btn-sm">
                                    <i class="fas fa-user"></i> Profile
                                </a>
                                ${buttonsHtml}
                            </div>
                        </div>
                    `;
                    mentorsListContainer.appendChild(mentorItem);
                });
            } else {
                mentorsListContainer.innerHTML = `<div class="empty-state card"><i class="fas fa-users"></i><h3>No Mentors Available</h3><p>Be the first to help guide fellow alumni. Register to become a mentor!</p></div>`;
            }
        } catch (error) {
            console.error('Error fetching mentors:', error);
            mentorsListContainer.innerHTML = '<p class="info-message error">Failed to load mentors.</p>';
        }
    };

    // --- Modal Handling ---
    const setupModals = () => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.close-btn');
            closeBtn.onclick = () => modal.style.display = 'none';
        });
        window.onclick = (event) => {
            modals.forEach(modal => {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            });
        };
    };

    // --- Event Listeners ---
    mentorsListContainer.addEventListener('click', async (e) => {
        const target = e.target;

        if (target.matches('.request-mentor-btn')) {
            if (!loggedInUserEmail) {
                showToast('Please log in to request mentorship.', 'info');
                return;
            }
            document.getElementById('modal-title').textContent = `Send Mentorship Request to ${target.dataset.name}`;
            document.getElementById('mentor-id-input').value = target.dataset.id;
            requestModal.style.display = 'block';
        }

        if (target.matches('.edit-request-btn')) {
            document.getElementById('edit-modal-title').textContent = `Edit Mentorship Request to ${target.dataset.name}`;
            document.getElementById('edit-mentor-id-input').value = target.dataset.id;
            document.getElementById('edit-request-message').value = target.dataset.message;
            editRequestModal.style.display = 'block';
        }

        if (target.matches('.cancel-request-btn')) {
            if (confirm('Are you sure you want to cancel this mentorship request?')) {
                try {
                    await window.api.del(`/mentors/requests/sent/${target.dataset.id}`);
                    showToast('Request canceled.', 'success');
                    await fetchAndRenderMentors();
                } catch (error) {
                    showToast(`Error: ${error.message}`, 'error');
                }
            }
        }
    });

    // Handle NEW request submission
    document.getElementById('request-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const mentorId = document.getElementById('mentor-id-input').value;
        const message = document.getElementById('request-message').value;
        try {
            await window.api.post('/mentors/request', { mentor_id: mentorId, message });
            showToast('Request sent!', 'success');
            requestModal.style.display = 'none';
            await fetchAndRenderMentors();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    // Handle EDIT request submission
    document.getElementById('edit-request-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const mentorId = document.getElementById('edit-mentor-id-input').value;
        const message = document.getElementById('edit-request-message').value;
        try {
            await window.api.put(`/mentors/requests/sent/${mentorId}`, { message });
            showToast('Request updated!', 'success');
            editRequestModal.style.display = 'none';
            await fetchAndRenderMentors();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    // --- Initial Load ---
    setupModals();
    await checkMentorStatus();
    await fetchAndRenderMentors();
    initializeSearchAndFilters();
});
});