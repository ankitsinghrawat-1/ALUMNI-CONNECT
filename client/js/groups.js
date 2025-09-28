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
        const imageUrl = group.image_url || createInitialsAvatar(group.name);
        const memberCount = group.member_count || Math.floor(Math.random() * 100) + 5;
        const isPrivate = group.privacy === 'private';
        
        return `
            <a href="group-details.html?id=${group.group_id}" class="enhanced-group-card-link">
                <div class="enhanced-group-card card">
                    <div class="group-card-header">
                        <img src="${sanitizeHTML(imageUrl)}" alt="${sanitizeHTML(group.name)}" class="group-image">
                        <div class="group-badge">
                            ${isPrivate ? '<span class="private-badge"><i class="fas fa-lock"></i> Private</span>' : '<span class="public-badge"><i class="fas fa-globe"></i> Public</span>'}
                        </div>
                    </div>
                    <div class="group-card-body">
                        <div class="group-category">${group.category || 'General'}</div>
                        <h3>${sanitizeHTML(group.name)}</h3>
                        <p class="group-description">${sanitizeHTML(group.description.substring(0, 120))}...</p>
                        
                        <div class="group-stats">
                            <div class="stat-item">
                                <i class="fas fa-users"></i>
                                <span>${memberCount} members</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-comments"></i>
                                <span>${Math.floor(Math.random() * 20) + 1} discussions</span>
                            </div>
                        </div>
                    </div>
                    <div class="group-card-footer">
                        <div class="group-actions">
                            <span class="btn btn-primary btn-sm group-join-btn">
                                ${isPrivate ? 'Request to Join' : 'Join Group'}
                            </span>
                            <div class="activity-indicator">
                                <i class="fas fa-circle active"></i>
                                <span>Active</span>
                            </div>
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
            console.error('Error fetching groups:', error);
            groupsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Unable to Load Groups</h3>
                    <p>The groups database is not connected. Real group data will be displayed once the database connection is established.</p>
                    <div class="empty-actions">
                        <button onclick="window.location.reload()" class="btn btn-primary">Retry</button>
                    </div>
                </div>`;
        }
    };

    // Filter functionality
    const applyFilters = () => {
        fetchAndRenderGroups();
    };

    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (sizeFilter) sizeFilter.addEventListener('change', applyFilters);

    // Initialize
    fetchAndRenderGroups();
});