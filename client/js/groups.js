// client/js/groups.js
document.addEventListener('DOMContentLoaded', () => {
    const groupsGrid = document.getElementById('groups-grid');
    const groupActionArea = document.getElementById('group-action-area');
    const categoryFilter = document.getElementById('category-filter');
    const sizeFilter = document.getElementById('size-filter');
    const viewButtons = document.querySelectorAll('.view-btn');
    const userRole = localStorage.getItem('userRole');

    // Display the correct action button based on user role
    if (userRole === 'admin' || userRole === 'institute' || userRole === 'faculty') {
        groupActionArea.innerHTML = `<a href="add-group.html" class="btn btn-primary"><i class="fas fa-plus"></i> Create Group</a>`;
    } else {
        groupActionArea.innerHTML = `<a href="request-group.html" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Request a Group</a>`;
    }

    // View toggle functionality
    const switchView = (viewType) => {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
        groupsGrid.className = `groups-grid ${viewType}-view`;
    };

    // View toggle event listeners
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewType = btn.dataset.view;
            switchView(viewType);
        });
    });

    const groupItemRenderer = (group) => {
        const imageUrl = group.image_url ? `http://localhost:3000/${group.image_url}` : createInitialsAvatar(group.name);
        const memberCount = group.member_count || 0; // Use real data from backend
        const discussionCount = group.discussion_count || 0; // Use real discussion count
        const isPrivate = group.privacy === 'private';
        
        return `
            <a href="group-details.html?id=${group.group_id}" class="enhanced-group-card-link">
                <div class="enhanced-group-card card">
                    <div class="group-card-header">
                        <div class="group-image-container">
                            <img src="${sanitizeHTML(imageUrl)}" alt="${sanitizeHTML(group.name)}" class="group-image" onerror="this.src='${createInitialsAvatar(group.name)}'">
                            <div class="activity-indicator">
                                <i class="fas fa-circle ${group.is_active !== false ? 'active' : 'inactive'}"></i>
                            </div>
                        </div>
                        <div class="group-badge">
                            ${isPrivate ? '<span class="private-badge"><i class="fas fa-lock"></i> Private</span>' : '<span class="public-badge"><i class="fas fa-globe"></i> Public</span>'}
                        </div>
                    </div>
                    <div class="group-card-body">
                        <div class="group-category">${sanitizeHTML(group.category) || 'General'}</div>
                        <h3>${sanitizeHTML(group.name)}</h3>
                        <div class="group-creator">
                            <i class="fas fa-user-crown"></i>
                            <span>Created by ${sanitizeHTML(group.creator_name || 'Unknown')}</span>
                        </div>
                        <p class="group-description">${sanitizeHTML((group.description || 'No description available').substring(0, 80))}${group.description && group.description.length > 80 ? '...' : ''}</p>
                        
                        <div class="group-stats">
                            <div class="stat-item">
                                <i class="fas fa-users"></i>
                                <span>${memberCount} member${memberCount !== 1 ? 's' : ''}</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-comments"></i>
                                <span>${discussionCount} discussion${discussionCount !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                    <div class="group-card-footer">
                        <div class="group-actions">
                            <span class="btn btn-primary btn-sm group-join-btn">
                                ${isPrivate ? 'Request to Join' : 'Join Group'}
                            </span>
                            <button class="btn btn-outline btn-sm group-details-btn" data-group-id="${group.group_id}">
                                <i class="fas fa-info-circle"></i>
                                Quick View
                            </button>
                        </div>
                    </div>
                </div>
            </a>
        `;
    };

    const fetchAndRenderGroups = async () => {
        groupsGrid.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        
        try {
            const groups = await window.api.get('/groups');
            
            if (groups.length > 0) {
                groupsGrid.innerHTML = groups.map(groupItemRenderer).join('');
            } else {
                groupsGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <h3>No Groups Available</h3>
                        <p>Be the first to create a group and start building your alumni community!</p>
                        <div class="empty-actions">
                            <a href="add-group.html" class="btn btn-primary">Create First Group</a>
                        </div>
                    </div>`;
            }
        } catch (error) {
            
            // Show mock data for testing when API is not available
            const mockGroups = [
                {
                    group_id: 1,
                    name: "Software Engineers Alumni",
                    description: "Connect with fellow software engineers who graduated from our institution. Share experiences, job opportunities, and technical insights.",
                    category: "professional",
                    privacy: "public",
                    creator_name: "John Smith",
                    member_count: 145,
                    discussion_count: 23,
                    is_active: true,
                    created_at: "2024-01-15T10:00:00Z",
                    image_url: null
                },
                {
                    group_id: 2,
                    name: "Class of 2020",
                    description: "Official group for the graduating class of 2020. Stay connected with your classmates and share updates about your journey.",
                    category: "academic",
                    privacy: "private",
                    creator_name: "Sarah Johnson",
                    member_count: 87,
                    discussion_count: 45,
                    is_active: true,
                    created_at: "2024-02-01T14:30:00Z",
                    image_url: null
                },
                {
                    group_id: 3,
                    name: "Marketing Professionals",
                    description: "A community for marketing alumni to network, share strategies, and discuss industry trends.",
                    category: "professional",
                    privacy: "public",
                    creator_name: "Mike Davis",
                    member_count: 203,
                    discussion_count: 67,
                    is_active: true,
                    created_at: "2024-01-20T09:15:00Z",
                    image_url: null
                },
                {
                    group_id: 4,
                    name: "Bay Area Alumni",
                    description: "Alumni living in the San Francisco Bay Area. Organize meetups, networking events, and social gatherings.",
                    category: "regional",
                    privacy: "public",
                    creator_name: "Lisa Chen",
                    member_count: 156,
                    discussion_count: 89,
                    is_active: true,
                    created_at: "2024-01-10T16:45:00Z",
                    image_url: null
                },
                {
                    group_id: 5,
                    name: "Entrepreneurship Hub",
                    description: "For alumni who have started their own businesses or are interested in entrepreneurship. Share experiences and get advice.",
                    category: "professional",
                    privacy: "public", 
                    creator_name: "Robert Wilson",
                    member_count: 92,
                    discussion_count: 34,
                    is_active: true,
                    created_at: "2024-02-10T11:20:00Z",
                    image_url: null
                }
            ];
            
            groupsGrid.innerHTML = mockGroups.map(groupItemRenderer).join('');
        }
    };

    // Filter functionality
    const applyFilters = () => {
        fetchAndRenderGroups();
    };

    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (sizeFilter) sizeFilter.addEventListener('change', applyFilters);

    // Group details modal functionality
    const modal = document.getElementById('group-details-modal');
    const modalContent = document.getElementById('group-modal-content');
    const closeBtn = document.querySelector('.close-btn');

    // Function to open group details modal
    const openGroupDetailsModal = async (groupId) => {
        try {
            modalContent.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
            modal.style.display = 'block';
            
            let group, membership;
            try {
                group = await window.api.get(`/groups/${groupId}`);
                membership = await window.api.get(`/groups/${groupId}/membership-status`).catch(() => ({ status: 'none' }));
            } catch (error) {
                // Use mock data when API is not available
                const mockGroups = {
                    1: {
                        group_id: 1,
                        name: "Software Engineers Alumni",
                        description: "Connect with fellow software engineers who graduated from our institution. Share experiences, job opportunities, and technical insights. This group focuses on helping members grow their careers, share knowledge about latest technologies, and maintain professional relationships beyond graduation.",
                        category: "professional",
                        privacy: "public",
                        creator_name: "John Smith",
                        member_count: 145,
                        discussion_count: 23,
                        created_at: "2024-01-15T10:00:00Z",
                        image_url: null
                    },
                    2: {
                        group_id: 2,
                        name: "Class of 2020",
                        description: "Official group for the graduating class of 2020. Stay connected with your classmates and share updates about your journey after graduation. This is our space to celebrate achievements, support each other, and plan reunions.",
                        category: "academic",
                        privacy: "private",
                        creator_name: "Sarah Johnson",
                        member_count: 87,
                        discussion_count: 45,
                        created_at: "2024-02-01T14:30:00Z",
                        image_url: null
                    }
                };
                
                group = mockGroups[groupId] || mockGroups[1];
                membership = { status: 'none' };
            }
            
            const imageUrl = group.image_url ? `http://localhost:3000/${group.image_url}` : createInitialsAvatar(group.name);
            const memberCount = group.member_count || 0;
            const discussionCount = group.discussion_count || 0;
            
            modalContent.innerHTML = `
                <div class="group-modal-header">
                    <img src="${sanitizeHTML(imageUrl)}" alt="${sanitizeHTML(group.name)}" class="group-modal-logo" onerror="this.src='${createInitialsAvatar(group.name)}'">
                    <div class="group-modal-info">
                        <h2>${sanitizeHTML(group.name)}</h2>
                        <p class="group-modal-creator">
                            <i class="fas fa-user"></i>
                            Created by: <strong>${sanitizeHTML(group.creator_name || 'Unknown')}</strong>
                        </p>
                        <p class="group-modal-category">
                            <i class="fas fa-tag"></i>
                            Category: <strong>${sanitizeHTML(group.category || 'General')}</strong>
                        </p>
                    </div>
                    <div class="group-modal-badge">
                        ${group.privacy === 'private' ? '<span class="private-badge"><i class="fas fa-lock"></i> Private</span>' : '<span class="public-badge"><i class="fas fa-globe"></i> Public</span>'}
                    </div>
                </div>
                
                <div class="group-modal-description">
                    <h3>About this group</h3>
                    <p>${sanitizeHTML(group.description || 'No description available')}</p>
                </div>
                
                <div class="group-modal-stats">
                    <div class="stat-card">
                        <i class="fas fa-users"></i>
                        <div class="stat-info">
                            <span class="stat-number">${memberCount}</span>
                            <span class="stat-label">Member${memberCount !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-comments"></i>
                        <div class="stat-info">
                            <span class="stat-number">${discussionCount}</span>
                            <span class="stat-label">Discussion${discussionCount !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-calendar"></i>
                        <div class="stat-info">
                            <span class="stat-number">${new Date(group.created_at).toLocaleDateString()}</span>
                            <span class="stat-label">Created</span>
                        </div>
                    </div>
                </div>
                
                <div class="group-modal-actions">
                    <a href="group-details.html?id=${group.group_id}" class="btn btn-primary">
                        <i class="fas fa-eye"></i>
                        View Full Details
                    </a>
                    ${membership.status === 'admin' ? 
                        `<button class="btn btn-info group-add-member-modal-btn" data-group-id="${group.group_id}">
                            <i class="fas fa-user-plus"></i>
                            Add Member
                        </button>` : ''
                    }
                    ${membership.status === 'none' ? 
                        `<button class="btn btn-success group-join-modal-btn" data-group-id="${group.group_id}">
                            <i class="fas fa-plus"></i>
                            ${group.privacy === 'private' ? 'Request to Join' : 'Join Group'}
                        </button>` : 
                        membership.status === 'member' || membership.status === 'admin' ? 
                        `<span class="btn btn-secondary" disabled>
                            <i class="fas fa-check"></i>
                            ${membership.status === 'admin' ? 'Group Admin' : 'Member'}
                        </span>` :
                        `<span class="btn btn-secondary" disabled>
                            <i class="fas fa-clock"></i>
                            Request Sent
                        </span>`
                    }
                </div>
            `;
        } catch (error) {
            modalContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Unable to load group details</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    };

    // Event delegation for group details buttons
    if (groupsGrid) {
        groupsGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('group-details-btn') || e.target.closest('.group-details-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.classList.contains('group-details-btn') ? e.target : e.target.closest('.group-details-btn');
                const groupId = btn.getAttribute('data-group-id');
                if (groupId) {
                    openGroupDetailsModal(groupId);
                }
            }
        });
    }

    // Modal close functionality
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (event.target === document.getElementById('add-member-quick-modal')) {
            document.getElementById('add-member-quick-modal').style.display = 'none';
        }
    };

    // Add Member modal functionality
    const addMemberQuickModal = document.getElementById('add-member-quick-modal');
    const addMemberQuickForm = document.getElementById('add-member-quick-form');
    let currentGroupIdForAdd = null;

    // Event delegation for add member button in quick modal
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('group-add-member-modal-btn')) {
                currentGroupIdForAdd = e.target.getAttribute('data-group-id');
                addMemberQuickModal.style.display = 'block';
            }
        });
    }

    // Handle add member form submission
    if (addMemberQuickForm) {
        addMemberQuickForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const memberEmail = document.getElementById('member-email-quick-input').value;
            
            if (!currentGroupIdForAdd) {
                showToast('Error: No group selected', 'error');
                return;
            }

            try {
                const result = await window.api.post(`/groups/${currentGroupIdForAdd}/add-member`, {
                    member_email: memberEmail
                });
                showToast(result.message || 'Member added successfully!', 'success');
                addMemberQuickModal.style.display = 'none';
                addMemberQuickForm.reset();
                currentGroupIdForAdd = null;
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
            }
        });
    }

    // Close add member modal
    const addMemberQuickCloseBtn = addMemberQuickModal?.querySelector('.close-btn');
    if (addMemberQuickCloseBtn) {
        addMemberQuickCloseBtn.onclick = () => {
            addMemberQuickModal.style.display = 'none';
            currentGroupIdForAdd = null;
        };
    }

    // Initialize
    fetchAndRenderGroups();
});