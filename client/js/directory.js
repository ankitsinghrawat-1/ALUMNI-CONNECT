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

    // Mock data for demonstration
    const generateMockAlumni = () => {
        return [
            {
                full_name: "Sarah Chen",
                email: "sarah.chen@example.com",
                current_position: "Senior Software Engineer",
                current_company: "Google",
                major: "Computer Science",
                graduation_year: "2018",
                city: "San Francisco, CA",
                industry: "Technology",
                skills: "Python, Machine Learning, Data Analysis",
                bio: "Passionate about AI and machine learning. Currently working on large-scale distributed systems at Google.",
                is_online: true
            },
            {
                full_name: "Michael Rodriguez",
                email: "michael.r@example.com",
                current_position: "Product Manager",
                current_company: "Microsoft",
                major: "Business Administration",
                graduation_year: "2017",
                city: "Seattle, WA", 
                industry: "Technology",
                skills: "Product Strategy, Data Analytics, Leadership",
                bio: "Leading product development for cloud services. Love mentoring students and new graduates.",
                is_online: false
            },
            {
                full_name: "Emily Johnson",
                email: "emily.j@example.com",
                current_position: "Marketing Director",
                current_company: "Tesla",
                major: "Marketing",
                graduation_year: "2016",
                city: "Austin, TX",
                industry: "Automotive",
                skills: "Digital Marketing, Brand Strategy, Analytics",
                bio: "Driving brand awareness and customer engagement for Tesla's innovative products.",
                is_online: true
            },
            {
                full_name: "David Kim",
                email: "david.kim@example.com",
                current_position: "Investment Analyst",
                current_company: "Goldman Sachs",
                major: "Finance",
                graduation_year: "2019",
                city: "New York, NY",
                industry: "Finance",
                skills: "Financial Modeling, Risk Analysis, Investment Strategy",
                bio: "Analyzing investment opportunities in tech and healthcare sectors.",
                is_online: false
            },
            {
                full_name: "Jennifer Liu",
                email: "jennifer.liu@example.com", 
                current_position: "UX Designer",
                current_company: "Airbnb",
                major: "Design",
                graduation_year: "2020",
                city: "San Francisco, CA",
                industry: "Technology",
                skills: "User Experience, Design Thinking, Prototyping",
                bio: "Creating intuitive and delightful user experiences for millions of travelers worldwide.",
                is_online: true
            },
            {
                full_name: "Robert Thompson",
                email: "robert.t@example.com",
                current_position: "Management Consultant",
                current_company: "McKinsey & Company",
                major: "Economics",
                graduation_year: "2015",
                city: "Chicago, IL",
                industry: "Consulting",
                skills: "Strategy, Operations, Change Management",
                bio: "Helping Fortune 500 companies transform their operations and strategy.",
                is_online: false
            }
        ];
    };

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
                    <i class="fas fa-search"></i>
                </div>
                <h3>No Alumni Found</h3>
                <p>No alumni matched your search criteria. Try broadening your search or using different filters.</p>
                <div class="empty-actions">
                    <button onclick="window.clearAllFilters()" class="btn btn-outline">Clear Filters</button>
                    <button onclick="window.switchTab('smart')" class="btn btn-primary">Try AI Matching</button>
                </div>
            </div>`;
    };

    const getConnectionStatus = (alumnus) => {
        const statuses = [
            { class: 'connected', icon: 'fas fa-check-circle', text: 'Connected' },
            { class: 'pending', icon: 'fas fa-clock', text: 'Pending' },
            { class: 'not-connected', icon: 'fas fa-user-plus', text: 'Connect' }
        ];
        return statuses[Math.floor(Math.random() * statuses.length)];
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

    const createEnhancedAlumnusCard = (alumnus) => {
        const alumnusCard = document.createElement('div');
        alumnusCard.classList.add('enhanced-alumnus-card', 'card');
        
        const skills = alumnus.skills ? alumnus.skills.split(',').slice(0, 3) : [];
        const skillsHtml = skills.map(skill => 
            `<span class="skill-tag">${skill.trim()}</span>`
        ).join('');

        const connectionStatus = getConnectionStatus(alumnus);
        const actionButton = getActionButton(alumnus, connectionStatus);

        alumnusCard.innerHTML = `
            <div class="alumnus-card-header">
                <div class="alumnus-avatar">
                    <div class="avatar-placeholder">
                        ${alumnus.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
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
        messageBtn.addEventListener('click', () => {
            alert(`Opening message conversation with ${alumnus.full_name}`);
        });

        const viewProfileBtn = alumnusCard.querySelector('.view-profile-btn');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', () => {
                window.location.href = `view-profile.html?email=${alumnus.email}`;
            });
        }

        const connectBtn = alumnusCard.querySelector('.connect-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                alert(`Sending connection request to ${alumnus.full_name}`);
            });
        }

        return alumnusCard;
    };

    // Core functionality
    const fetchAndRenderAlumni = () => {
        showLoading();

        setTimeout(() => {
            const mockAlumni = generateMockAlumni();
            alumniListContainer.innerHTML = '';

            if (mockAlumni.length > 0) {
                resultsTitle.textContent = `${mockAlumni.length} Alumni Found`;
                
                mockAlumni.forEach(alumnus => {
                    const alumnusCard = createEnhancedAlumnusCard(alumnus);
                    alumniListContainer.appendChild(alumnusCard);
                });
            } else {
                showEmptyState();
            }
        }, 500);
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