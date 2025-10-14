// client/js/directory.js - Enhanced Alumni Directory with Advanced Features
document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const alumniListContainer = document.getElementById('directory-list');
    const searchInput = document.getElementById('directory-search-input');
    const majorFilter = document.getElementById('major-filter');
    const yearFromFilter = document.getElementById('year-from');
    const yearToFilter = document.getElementById('year-to');
    const cityFilter = document.getElementById('city-filter');
    const industryFilter = document.getElementById('industry-filter');
    const companySizeFilter = document.getElementById('company-size-filter');
    const skillsFilter = document.getElementById('skills-filter');
    const searchButton = document.getElementById('directory-search-button');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const resultsTitle = document.getElementById('results-title');
    
    // Tab System
    const searchTabs = document.querySelectorAll('.search-tab');
    const searchTabContents = document.querySelectorAll('.search-tab-content');
    
    // View Toggle
    const viewButtons = document.querySelectorAll('.view-btn');
    const sortSelect = document.getElementById('sort-select');
    
    // Popular Search Tags
    const searchTags = document.querySelectorAll('.search-tag');
    
    // AI Matching buttons
    const aiMatchButtons = document.querySelectorAll('.match-type .btn');

    // Helper functions
    const showLoading = () => {
        alumniListContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p>Finding amazing alumni connections...</p>
            </div>`;
    };

    const showEmptyState = () => {
        alumniListContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-database"></i>
                </div>
                <h3>No Alumni Data Available</h3>
                <p>The alumni database is currently not configured. Please contact an administrator to set up the database connection.</p>
                <div class="empty-actions">
                    <button onclick="window.location.reload()" class="btn btn-primary">Retry</button>
                </div>
            </div>`;
    };

    const getConnectionStatus = async (alumnus) => {
        try {
            const token = localStorage.getItem('alumniConnectToken');
            if (!token) {
                // If not logged in, show connect button by default
                return { class: 'not-connected', icon: 'fas fa-user-plus', text: 'Connect' };
            }
            
            const response = await window.api.get(`/users/connection-status/${encodeURIComponent(alumnus.email)}`);
            
            if (response.status === 'connected') {
                return { class: 'connected', icon: 'fas fa-check-circle', text: 'Connected' };
            } else if (response.status === 'pending') {
                return { class: 'pending', icon: 'fas fa-clock', text: 'Pending' };
            } else if (response.status === 'received') {
                return { class: 'received', icon: 'fas fa-user-check', text: 'Respond' };
            } else {
                return { class: 'not-connected', icon: 'fas fa-user-plus', text: 'Connect' };
            }
        } catch (error) {
            console.error('Error fetching connection status:', error);
            // Default to not connected on error
            return { class: 'not-connected', icon: 'fas fa-user-plus', text: 'Connect' };
        }
    };

    const getActionButton = (alumnus, connectionStatus) => {
        if (connectionStatus.class === 'connected') {
            return `<button class="btn btn-primary btn-sm view-profile-btn">
                        <i class="fas fa-user"></i>
                        View Profile
                    </button>`;
        } else if (connectionStatus.class === 'pending') {
            return `<button class="btn btn-secondary btn-sm" disabled>
                        <i class="fas fa-clock"></i>
                        Request Sent
                    </button>`;
        } else if (connectionStatus.class === 'received') {
            return `<button class="btn btn-success btn-sm view-profile-btn">
                        <i class="fas fa-user-check"></i>
                        View Request
                    </button>`;
        } else {
            return `<button class="btn btn-primary btn-sm connect-btn" data-email="${alumnus.email}">
                        <i class="fas fa-user-plus"></i>
                        Connect
                    </button>`;
        }
    };

    const generateMatchScore = () => {
        return Math.floor(Math.random() * 30) + 70; // 70-100% match score
    };

    const createEnhancedAlumnusCard = async (alumnus) => {
        const alumnusCard = document.createElement('div');
        alumnusCard.classList.add('enhanced-alumnus-card', 'card');
        
        const skills = alumnus.skills ? alumnus.skills.split(',').slice(0, 3) : [];
        const skillsHtml = skills.map(skill => 
            `<span class="skill-tag">${skill.trim()}</span>`
        ).join('');

        const connectionStatus = await getConnectionStatus(alumnus);
        const actionButton = getActionButton(alumnus, connectionStatus);

        alumnusCard.innerHTML = `
            <div class="alumnus-card-header">
                <div class="alumnus-avatar">
                    <img src="${alumnus.profile_pic_url ? alumnus.profile_pic_url : createInitialsAvatar(alumnus.full_name)}" 
                         alt="${alumnus.full_name}" 
                         class="avatar-image"
                         onerror="this.src='${createInitialsAvatar(alumnus.full_name)}'">
                    <div class="online-indicator ${alumnus.is_online ? 'online' : ''}"></div>
                </div>
                <div class="alumnus-info">
                    <h3 class="alumnus-name">${alumnus.full_name}</h3>
                    <p class="alumnus-title">${alumnus.current_position || 'Alumni Member'}</p>
                    <p class="alumnus-company">${alumnus.current_company || ''}</p>
                </div>
                <div class="connection-badge ${connectionStatus.class}">
                    <i class="${connectionStatus.icon}"></i>
                </div>
            </div>
            
            <div class="alumnus-card-body">
                <div class="alumnus-details">
                    <div class="detail-item">
                        <i class="fas fa-graduation-cap"></i>
                        <span>${alumnus.major || 'Not specified'} • Class of ${alumnus.graduation_year || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${alumnus.city || 'Location not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-industry"></i>
                        <span>${alumnus.industry || 'Industry not specified'}</span>
                    </div>
                </div>
                
                ${skills.length > 0 ? `
                    <div class="alumnus-skills">
                        <div class="skills-label">
                            <i class="fas fa-cogs"></i>
                            <span>Skills:</span>
                        </div>
                        <div class="skills-container">
                            ${skillsHtml}
                            ${skills.length === 3 ? '<span class="more-skills">+more</span>' : ''}
                        </div>
                    </div>
                ` : ''}
                
                ${alumnus.bio ? `
                    <div class="alumnus-bio">
                        <p>${alumnus.bio.substring(0, 120)}${alumnus.bio.length > 120 ? '...' : ''}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="alumnus-card-footer">
                <div class="card-actions">
                    ${actionButton}
                    <button class="btn btn-outline btn-sm message-btn" data-email="${alumnus.email}">
                        <i class="fas fa-envelope"></i>
                        Message
                    </button>
                </div>
                <div class="match-score" title="Compatibility Score">
                    <i class="fas fa-star"></i>
                    <span>${generateMatchScore()}%</span>
                </div>
            </div>
        `;

        // Add event listeners
        const messageBtn = alumnusCard.querySelector('.message-btn');
        messageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Redirect to messages page with user parameter
            window.location.href = `messages.html?user=${encodeURIComponent(alumnus.email)}&name=${encodeURIComponent(alumnus.full_name)}`;
            showToast(`Opening message conversation with ${alumnus.full_name}`, 'info');
        });

        const viewProfileBtn = alumnusCard.querySelector('.view-profile-btn');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `view-profile.html?email=${encodeURIComponent(alumnus.email)}`;
            });
        }

        const connectBtn = alumnusCard.querySelector('.connect-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                try {
                    // Send actual connection request
                    await window.api.post('/users/connect-request', { 
                        to_email: alumnus.email 
                    });
                    
                    // Update button state
                    connectBtn.innerHTML = `<i class="fas fa-clock"></i> Request Sent`;
                    connectBtn.disabled = true;
                    connectBtn.className = 'btn btn-secondary btn-sm';
                    
                    showToast(`Connection request sent to ${alumnus.full_name}!`, 'success');
                } catch (error) {
                    showToast('Failed to send connection request. Please try again.', 'error');
                }
            });
        }

        return alumnusCard;
    };

    // Core functionality
    const fetchAndRenderAlumni = async () => {
        showLoading();

        try {
            // Get search parameters
            const query = searchInput ? searchInput.value.trim() : '';
            const major = majorFilter ? majorFilter.value : '';
            const graduation_year = yearFromFilter ? yearFromFilter.value : '';
            const city = cityFilter ? cityFilter.value : '';
            const industry = industryFilter ? industryFilter.value : '';
            const skills = skillsFilter ? skillsFilter.value : '';

            // Build query parameters
            const params = new URLSearchParams();
            if (query) params.append('query', query);
            if (major) params.append('major', major);
            if (graduation_year) params.append('graduation_year', graduation_year);
            if (city) params.append('city', city);
            if (industry) params.append('industry', industry);
            if (skills) params.append('skills', skills);

            // Fetch real data from API
            const alumni = await window.api.get(`/users/directory?${params.toString()}`);
            
            alumniListContainer.innerHTML = '';

            if (alumni && alumni.length > 0) {
                resultsTitle.textContent = `${alumni.length} Alumni Found`;
                
                // Process alumni cards asynchronously
                for (const alumnus of alumni) {
                    // Map API response to expected format
                    const mappedAlumnus = {
                        full_name: alumnus.full_name,
                        email: alumnus.email,
                        current_position: alumnus.job_title || 'Alumni Member',
                        current_company: alumnus.current_company || '',
                        major: alumnus.major,
                        graduation_year: alumnus.graduation_year,
                        city: '', // API doesn't return city in public profiles for privacy
                        industry: '', // API doesn't return industry in public profiles 
                        skills: '', // API doesn't return skills in public profiles
                        bio: '', // API doesn't return bio in public profiles
                        is_online: Math.random() > 0.5, // Random online status for demo
                        profile_pic_url: alumnus.profile_pic_url,
                        verification_status: alumnus.verification_status
                    };
                    
                    const alumnusCard = await createEnhancedAlumnusCard(mappedAlumnus);
                    alumniListContainer.appendChild(alumnusCard);
                }
            } else {
                showEmptyState();
            }
        } catch (error) {
            
            // Show appropriate error message based on the error type
            if (error.message.includes('server')) {
                alumniListContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3>Database Not Connected</h3>
                        <p>The alumni database is not configured. Real alumni data will be displayed once the database connection is established.</p>
                        <div class="empty-actions">
                            <button onclick="window.location.reload()" class="btn btn-primary">Retry Connection</button>
                        </div>
                    </div>`;
            } else {
                showEmptyState();
            }
        }
    };

    const switchTab = (tabType) => {
        searchTabs.forEach(tab => tab.classList.remove('active'));
        searchTabContents.forEach(content => content.classList.remove('active'));

        document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');
        document.getElementById(`${tabType}-search`).classList.add('active');

        switch(tabType) {
            case 'quick':
                resultsTitle.textContent = 'Search Results';
                break;
            case 'advanced':
                resultsTitle.textContent = 'Filtered Results';
                break;
            case 'smart':
                resultsTitle.textContent = 'AI Matched Alumni';
                break;
        }
    };

    const switchView = (viewType) => {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
        alumniListContainer.className = `directory-list ${viewType}-view`;
    };

    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            resultsTitle.textContent = `Search Results for "${query}"`;
            fetchAndRenderAlumni();
        }
    };

    const applyAdvancedFilters = () => {
        resultsTitle.textContent = 'Filtered Results';
        fetchAndRenderAlumni();
    };

    const clearAllFilters = () => {
        searchInput.value = '';
        if (majorFilter) majorFilter.value = '';
        if (yearFromFilter) yearFromFilter.value = '';
        if (yearToFilter) yearToFilter.value = '';
        if (cityFilter) cityFilter.value = '';
        if (industryFilter) industryFilter.value = '';
        if (companySizeFilter) companySizeFilter.value = '';
        if (skillsFilter) skillsFilter.value = '';
        
        resultsTitle.textContent = 'All Alumni';
        fetchAndRenderAlumni();
    };

    // Event listeners
    searchTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;
            switchTab(tabType);
        });
    });

    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewType = btn.dataset.view;
            switchView(viewType);
        });
    });

    searchTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const searchTerm = tag.dataset.search;
            searchInput.value = searchTerm;
            performSearch();
        });
    });

    // AI Matching buttons functionality
    aiMatchButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active state from all buttons
            aiMatchButtons.forEach(b => b.classList.remove('active'));
            // Add active state to clicked button
            btn.classList.add('active');
            
            // Get button text to determine search type
            const buttonText = btn.textContent.trim();
            let searchTerm = '';
            
            switch(buttonText) {
                case 'Find Mentors':
                    searchTerm = 'mentor senior experienced';
                    resultsTitle.textContent = 'Mentors Found';
                    break;
                case 'Find Peers':
                    searchTerm = 'peer colleague graduate';
                    resultsTitle.textContent = 'Peer Connections Found';
                    break;
                case 'Explore Careers':
                    searchTerm = 'career opportunity hiring recruiter';
                    resultsTitle.textContent = 'Career Opportunities Found';
                    break;
                case 'Meet Experts':
                    searchTerm = 'expert leader specialist industry';
                    resultsTitle.textContent = 'Industry Experts Found';
                    break;
            }
            
            // Set search term and perform search
            if (searchTerm) {
                searchInput.value = searchTerm;
                performSearch();
            }
        });
    });

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyAdvancedFilters);
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAllFilters);
    if (sortSelect) sortSelect.addEventListener('change', fetchAndRenderAlumni);

    // Make functions available globally for onclick handlers
    window.clearAllFilters = clearAllFilters;
    window.switchTab = switchTab;
    window.fetchAndRenderAlumni = fetchAndRenderAlumni;

    // Initialize
    fetchAndRenderAlumni();
});