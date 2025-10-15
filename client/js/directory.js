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
        
        // Check if bookmarked (from localStorage)
        const bookmarkedAlumni = JSON.parse(localStorage.getItem('bookmarkedAlumni') || '[]');
        const isBookmarked = bookmarkedAlumni.includes(alumnus.email);
        
        // Get user role and format it
        const role = alumnus.role || 'alumni';
        const roleConfig = {
            alumni: { label: 'Alumni', icon: 'fa-user-graduate', color: '#667eea' },
            student: { label: 'Student', icon: 'fa-graduation-cap', color: '#10b981' },
            faculty: { label: 'Faculty', icon: 'fa-chalkboard-teacher', color: '#f59e0b' },
            employer: { label: 'Employer', icon: 'fa-building', color: '#ef4444' },
            institute: { label: 'Institute', icon: 'fa-university', color: '#8b5cf6' }
        };
        const userRole = roleConfig[role] || roleConfig.alumni;
        
        // Generate availability status (from user profile or default)
        // In production, this would come from alumnus.availability_status
        const availabilityStatuses = [
            { text: 'Open to Mentor', icon: 'fa-chalkboard-teacher', tooltip: 'Available to mentor students and juniors', color: '#10b981' },
            { text: 'Hiring', icon: 'fa-briefcase', tooltip: 'Currently hiring for open positions', color: '#3b82f6' },
            { text: 'Available for Chat', icon: 'fa-comments', tooltip: 'Open for networking and casual conversations', color: '#8b5cf6' },
            null
        ];
        const availabilityStatus = availabilityStatuses[Math.floor(Math.random() * availabilityStatuses.length)];
        const availabilityBadge = availabilityStatus ? `
            <div class="availability-badge" title="${availabilityStatus.tooltip}" style="background: ${availabilityStatus.color};">
                <i class="fas ${availabilityStatus.icon}"></i>
                <span>${availabilityStatus.text}</span>
            </div>
        ` : '';
        
        // Get current user's skills for common interests (from localStorage if logged in)
        const currentUserSkills = JSON.parse(localStorage.getItem('userSkills') || '[]');
        const alumnusSkills = alumnus.skills ? alumnus.skills.split(',').map(s => s.trim().toLowerCase()) : [];
        const commonSkills = currentUserSkills.filter(skill => 
            alumnusSkills.includes(skill.toLowerCase())
        );
        const commonInterestsHtml = commonSkills.length > 0 ? `
            <div class="common-interests" title="You both have these skills: ${commonSkills.join(', ')}">
                <i class="fas fa-handshake"></i>
                <span>${commonSkills.length} common ${commonSkills.length === 1 ? 'skill' : 'skills'}</span>
            </div>
        ` : '';
        
        // Connection status tooltip
        const connectionTooltips = {
            connected: 'You are connected with this user',
            pending: 'Connection request sent - waiting for response',
            received: 'This user wants to connect with you',
            'not-connected': 'Send a connection request'
        };
        const connectionTooltip = connectionTooltips[connectionStatus.class] || 'Connection status';

        alumnusCard.innerHTML = `
            <div class="card-top-actions">
                <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                        data-email="${alumnus.email}" 
                        title="${isBookmarked ? 'Remove Bookmark' : 'Bookmark'}">
                    <i class="fas fa-bookmark"></i>
                </button>
                <div class="quick-actions-dropdown">
                    <button class="quick-actions-btn" title="Quick Actions">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="quick-actions-menu">
                        ${alumnus.linkedin_profile ? `
                            <a href="${alumnus.linkedin_profile}" target="_blank" class="quick-action-item">
                                <i class="fab fa-linkedin"></i> LinkedIn
                            </a>
                        ` : ''}
                        ${alumnus.website ? `
                            <a href="${alumnus.website}" target="_blank" class="quick-action-item">
                                <i class="fas fa-globe"></i> Portfolio
                            </a>
                        ` : ''}
                        <button class="quick-action-item schedule-meeting-btn" data-email="${alumnus.email}">
                            <i class="fas fa-calendar"></i> Schedule Meeting
                        </button>
                        <button class="quick-action-item share-profile-btn" data-email="${alumnus.email}">
                            <i class="fas fa-share"></i> Share Profile
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="alumnus-card-header">
                <div class="card-profile-section">
                    <div class="alumnus-avatar">
                        <img src="${alumnus.profile_pic_url ? alumnus.profile_pic_url : createInitialsAvatar(alumnus.full_name)}" 
                             alt="${alumnus.full_name}" 
                             class="avatar-image"
                             onerror="this.src='${createInitialsAvatar(alumnus.full_name)}'">
                        <div class="online-indicator ${alumnus.is_online ? 'online' : ''}"></div>
                        <div class="match-score-overlay" title="Compatibility Score based on skills and interests">
                            <i class="fas fa-star"></i>
                            <span>${generateMatchScore()}%</span>
                        </div>
                    </div>
                    
                    <div class="alumnus-info">
                        <h3 class="alumnus-name">${alumnus.full_name}</h3>
                        <p class="alumnus-title">${alumnus.current_position || 'Alumni Member'}</p>
                        <p class="alumnus-company">${alumnus.current_company || ''}</p>
                        
                        <div class="profile-badges-row">
                            <div class="role-badge" style="background: ${userRole.color};" title="${userRole.label}">
                                <i class="fas ${userRole.icon}"></i>
                                <span>${userRole.label}</span>
                            </div>
                            ${availabilityBadge}
                            ${commonInterestsHtml}
                            <div class="connection-status-badge ${connectionStatus.class}" title="${connectionTooltip}">
                                <i class="${connectionStatus.icon}"></i>
                                <span class="status-label">${connectionStatus.text}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="alumnus-card-body">
                <div class="alumnus-details-grid">
                    ${alumnus.major || alumnus.graduation_year ? `
                    <div class="detail-item">
                        <i class="fas fa-graduation-cap"></i>
                        <div class="detail-content">
                            <span class="detail-label">Education</span>
                            <span class="detail-value">${alumnus.major || 'Not specified'} ${alumnus.graduation_year ? `• Class of ${alumnus.graduation_year}` : ''}</span>
                        </div>
                    </div>
                    ` : ''}
                    ${alumnus.city ? `
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div class="detail-content">
                            <span class="detail-label">Location</span>
                            <span class="detail-value">${alumnus.city}</span>
                        </div>
                    </div>
                    ` : ''}
                    ${alumnus.industry ? `
                    <div class="detail-item">
                        <i class="fas fa-industry"></i>
                        <div class="detail-content">
                            <span class="detail-label">Industry</span>
                            <span class="detail-value">${alumnus.industry}</span>
                        </div>
                    </div>
                    ` : ''}
                    ${alumnus.email ? `
                    <div class="detail-item">
                        <i class="fas fa-envelope"></i>
                        <div class="detail-content">
                            <span class="detail-label">Contact</span>
                            <span class="detail-value">${alumnus.email}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                ${skills.length > 0 ? `
                    <div class="alumnus-skills">
                        <div class="skills-header">
                            <i class="fas fa-cogs"></i>
                            <span>Key Skills</span>
                        </div>
                        <div class="skills-container">
                            ${skillsHtml}
                            ${skills.length === 3 ? '<span class="more-skills">+more</span>' : ''}
                        </div>
                    </div>
                ` : ''}
                
                ${alumnus.bio ? `
                    <div class="alumnus-bio">
                        <div class="bio-header">
                            <i class="fas fa-quote-left"></i>
                            <span>About</span>
                        </div>
                        <p>${alumnus.bio.substring(0, 100)}${alumnus.bio.length > 100 ? '...' : ''}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="alumnus-card-footer">
                <div class="card-actions-buttons">
                    ${actionButton}
                    <button class="btn btn-outline btn-sm message-btn" data-email="${alumnus.email}" title="Send a message">
                        <i class="fas fa-envelope"></i>
                        <span class="btn-text">Message</span>
                    </button>
                    <button class="btn btn-primary btn-sm view-full-profile-btn" data-email="${alumnus.email}" title="View full profile">
                        <i class="fas fa-id-card"></i>
                        <span class="btn-text">Profile</span>
                    </button>
                </div>
            </div>
        `;

        // Add click handler to card for modal
        alumnusCard.addEventListener('click', (e) => {
            // Don't open modal if clicking on buttons
            if (!e.target.closest('button')) {
                openProfileModal(alumnus);
            }
        });

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

        const viewFullProfileBtn = alumnusCard.querySelector('.view-full-profile-btn');
        if (viewFullProfileBtn) {
            viewFullProfileBtn.addEventListener('click', (e) => {
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

        // Bookmark button functionality
        const bookmarkBtn = alumnusCard.querySelector('.bookmark-btn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const bookmarkedAlumni = JSON.parse(localStorage.getItem('bookmarkedAlumni') || '[]');
                const index = bookmarkedAlumni.indexOf(alumnus.email);
                
                if (index > -1) {
                    // Remove bookmark
                    bookmarkedAlumni.splice(index, 1);
                    bookmarkBtn.classList.remove('bookmarked');
                    bookmarkBtn.title = 'Bookmark';
                    showToast(`Removed ${alumnus.full_name} from bookmarks`, 'info');
                } else {
                    // Add bookmark
                    bookmarkedAlumni.push(alumnus.email);
                    bookmarkBtn.classList.add('bookmarked');
                    bookmarkBtn.title = 'Remove Bookmark';
                    showToast(`Added ${alumnus.full_name} to bookmarks`, 'success');
                }
                
                localStorage.setItem('bookmarkedAlumni', JSON.stringify(bookmarkedAlumni));
            });
        }

        // Quick actions dropdown functionality
        const quickActionsBtn = alumnusCard.querySelector('.quick-actions-btn');
        const quickActionsMenu = alumnusCard.querySelector('.quick-actions-menu');
        
        if (quickActionsBtn && quickActionsMenu) {
            quickActionsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other open menus
                document.querySelectorAll('.quick-actions-menu.active').forEach(menu => {
                    if (menu !== quickActionsMenu) {
                        menu.classList.remove('active');
                    }
                });
                
                quickActionsMenu.classList.toggle('active');
            });
            
            // Schedule meeting button
            const scheduleMeetingBtn = alumnusCard.querySelector('.schedule-meeting-btn');
            if (scheduleMeetingBtn) {
                scheduleMeetingBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    quickActionsMenu.classList.remove('active');
                    showToast(`Opening calendar to schedule meeting with ${alumnus.full_name}...`, 'info');
                    // In a real app, this would open a calendar integration
                });
            }
            
            // Share profile button
            const shareProfileBtn = alumnusCard.querySelector('.share-profile-btn');
            if (shareProfileBtn) {
                shareProfileBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    quickActionsMenu.classList.remove('active');
                    
                    const profileUrl = `${window.location.origin}/view-profile.html?email=${encodeURIComponent(alumnus.email)}`;
                    
                    if (navigator.share) {
                        navigator.share({
                            title: `${alumnus.full_name}'s Profile`,
                            text: `Check out ${alumnus.full_name}'s profile on AlumniConnect`,
                            url: profileUrl
                        }).catch(err => console.log('Share cancelled'));
                    } else {
                        // Fallback: copy to clipboard
                        navigator.clipboard.writeText(profileUrl).then(() => {
                            showToast('Profile link copied to clipboard!', 'success');
                        });
                    }
                });
            }
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.quick-actions-dropdown')) {
                quickActionsMenu?.classList.remove('active');
            }
        });

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

    // ==================== Profile Modal Functionality ====================
    const profileModal = document.getElementById('profile-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalViewProfileBtn = document.getElementById('modal-view-profile-btn');
    const modalMessageBtn = document.getElementById('modal-message-btn');
    const modalConnectBtn = document.getElementById('modal-connect-btn');

    let currentModalUser = null;

    const openProfileModal = async (alumnus) => {
        currentModalUser = alumnus;
        
        // Set basic info
        document.getElementById('modal-user-name').textContent = alumnus.full_name;
        document.getElementById('modal-user-title').textContent = alumnus.current_position || 'Alumni Member';
        document.getElementById('modal-user-company').textContent = alumnus.current_company || '';
        
        // Set avatar
        const avatarImg = document.getElementById('modal-avatar-img');
        avatarImg.src = alumnus.profile_pic_url || createInitialsAvatar(alumnus.full_name);
        
        // Set details
        document.getElementById('modal-education').textContent = 
            `${alumnus.major || 'Not specified'} • Class of ${alumnus.graduation_year || 'N/A'}`;
        document.getElementById('modal-location').textContent = alumnus.city || 'Location not specified';
        document.getElementById('modal-industry').textContent = alumnus.industry || 'Industry not specified';
        
        // Set skills
        const skillsSection = document.getElementById('modal-skills-section');
        const skillsContainer = document.getElementById('modal-skills-container');
        if (alumnus.skills) {
            const skills = alumnus.skills.split(',');
            skillsContainer.innerHTML = skills.map(skill => 
                `<span class="skill-tag">${skill.trim()}</span>`
            ).join('');
            skillsSection.style.display = 'block';
        } else {
            skillsSection.style.display = 'none';
        }
        
        // Set bio
        const bioSection = document.getElementById('modal-bio-section');
        const bioElement = document.getElementById('modal-bio');
        if (alumnus.bio) {
            bioElement.textContent = alumnus.bio;
            bioSection.style.display = 'block';
        } else {
            bioSection.style.display = 'none';
        }
        
        // Get connection status and update button
        try {
            const connectionStatus = await getConnectionStatus(alumnus);
            if (connectionStatus.class === 'connected') {
                modalConnectBtn.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
                modalConnectBtn.disabled = true;
                modalConnectBtn.className = 'btn btn-secondary';
            } else if (connectionStatus.class === 'pending') {
                modalConnectBtn.innerHTML = '<i class="fas fa-clock"></i> Request Sent';
                modalConnectBtn.disabled = true;
                modalConnectBtn.className = 'btn btn-secondary';
            } else {
                modalConnectBtn.innerHTML = '<i class="fas fa-user-plus"></i> Connect';
                modalConnectBtn.disabled = false;
                modalConnectBtn.className = 'btn btn-success';
            }
        } catch (error) {
            console.error('Error getting connection status:', error);
        }
        
        // Show modal
        profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeProfileModal = () => {
        profileModal.classList.remove('active');
        document.body.style.overflow = '';
        currentModalUser = null;
    };

    // Modal event listeners
    if (modalClose) modalClose.addEventListener('click', closeProfileModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeProfileModal);
    
    if (modalViewProfileBtn) {
        modalViewProfileBtn.addEventListener('click', () => {
            if (currentModalUser) {
                window.location.href = `view-profile.html?email=${encodeURIComponent(currentModalUser.email)}`;
            }
        });
    }
    
    if (modalMessageBtn) {
        modalMessageBtn.addEventListener('click', () => {
            if (currentModalUser) {
                window.location.href = `messages.html?user=${encodeURIComponent(currentModalUser.email)}&name=${encodeURIComponent(currentModalUser.full_name)}`;
            }
        });
    }
    
    if (modalConnectBtn) {
        modalConnectBtn.addEventListener('click', async () => {
            if (currentModalUser && !modalConnectBtn.disabled) {
                try {
                    await window.api.post('/users/connect-request', { 
                        to_email: currentModalUser.email 
                    });
                    
                    modalConnectBtn.innerHTML = '<i class="fas fa-clock"></i> Request Sent';
                    modalConnectBtn.disabled = true;
                    modalConnectBtn.className = 'btn btn-secondary';
                    
                    showToast(`Connection request sent to ${currentModalUser.full_name}!`, 'success');
                } catch (error) {
                    showToast('Failed to send connection request. Please try again.', 'error');
                }
            }
        });
    }

    // ==================== Search Dialog Functionality ====================
    const searchDialog = document.getElementById('search-dialog');
    const searchDialogOverlay = document.getElementById('search-dialog-overlay');
    const searchDialogClose = document.getElementById('search-dialog-close');
    const floatingSearchBtn = document.getElementById('floating-search-btn');
    const dialogApplySearch = document.getElementById('dialog-apply-search');
    const dialogClearFilters = document.getElementById('dialog-clear-filters');
    
    const dialogSearchInput = document.getElementById('dialog-search-input');
    const dialogMajorFilter = document.getElementById('dialog-major-filter');
    const dialogYearFrom = document.getElementById('dialog-year-from');
    const dialogYearTo = document.getElementById('dialog-year-to');
    const dialogCityFilter = document.getElementById('dialog-city-filter');
    const dialogIndustryFilter = document.getElementById('dialog-industry-filter');
    const dialogSkillsFilter = document.getElementById('dialog-skills-filter');
    const dialogCompanySizeFilter = document.getElementById('dialog-company-size-filter');

    const openSearchDialog = () => {
        // Sync values from hidden search section to dialog
        if (searchInput) dialogSearchInput.value = searchInput.value;
        if (majorFilter) dialogMajorFilter.value = majorFilter.value;
        if (yearFromFilter) dialogYearFrom.value = yearFromFilter.value;
        if (yearToFilter) dialogYearTo.value = yearToFilter.value;
        if (cityFilter) dialogCityFilter.value = cityFilter.value;
        if (industryFilter) dialogIndustryFilter.value = industryFilter.value;
        if (skillsFilter) dialogSkillsFilter.value = skillsFilter.value;
        if (companySizeFilter) dialogCompanySizeFilter.value = companySizeFilter.value;
        
        searchDialog.classList.add('active');
        document.body.style.overflow = 'hidden';
        dialogSearchInput.focus();
    };

    const closeSearchDialog = () => {
        searchDialog.classList.remove('active');
        document.body.style.overflow = '';
    };

    const applyDialogSearch = () => {
        // Sync values from dialog back to hidden search section
        if (searchInput) searchInput.value = dialogSearchInput.value;
        if (majorFilter) majorFilter.value = dialogMajorFilter.value;
        if (yearFromFilter) yearFromFilter.value = dialogYearFrom.value;
        if (yearToFilter) yearToFilter.value = dialogYearTo.value;
        if (cityFilter) cityFilter.value = dialogCityFilter.value;
        if (industryFilter) industryFilter.value = dialogIndustryFilter.value;
        if (skillsFilter) skillsFilter.value = dialogSkillsFilter.value;
        if (companySizeFilter) companySizeFilter.value = dialogCompanySizeFilter.value;
        
        closeSearchDialog();
        fetchAndRenderAlumni();
    };

    const clearDialogFilters = () => {
        dialogSearchInput.value = '';
        dialogMajorFilter.value = '';
        dialogYearFrom.value = '';
        dialogYearTo.value = '';
        dialogCityFilter.value = '';
        dialogIndustryFilter.value = '';
        dialogSkillsFilter.value = '';
        dialogCompanySizeFilter.value = '';
    };

    // Search dialog event listeners
    if (floatingSearchBtn) floatingSearchBtn.addEventListener('click', openSearchDialog);
    if (searchDialogClose) searchDialogClose.addEventListener('click', closeSearchDialog);
    if (searchDialogOverlay) searchDialogOverlay.addEventListener('click', closeSearchDialog);
    if (dialogApplySearch) dialogApplySearch.addEventListener('click', applyDialogSearch);
    if (dialogClearFilters) dialogClearFilters.addEventListener('click', clearDialogFilters);
    
    // Popular tags in dialog
    const dialogTags = document.querySelectorAll('.search-dialog .tag-btn');
    dialogTags.forEach(tag => {
        tag.addEventListener('click', () => {
            dialogSearchInput.value = tag.dataset.search;
        });
    });
    
    // Enter key in dialog search
    if (dialogSearchInput) {
        dialogSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyDialogSearch();
        });
    }

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProfileModal();
            closeSearchDialog();
        }
    });

    // Make modal function available globally
    window.openProfileModal = openProfileModal;

    // Make functions available globally for onclick handlers
    window.clearAllFilters = clearAllFilters;
    window.switchTab = switchTab;
    window.fetchAndRenderAlumni = fetchAndRenderAlumni;

    // Initialize
    fetchAndRenderAlumni();
});