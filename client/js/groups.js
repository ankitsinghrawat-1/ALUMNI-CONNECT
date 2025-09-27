// client/js/groups.js
document.addEventListener('DOMContentLoaded', () => {
    const groupsGrid = document.getElementById('groups-grid');
    const groupActionArea = document.getElementById('group-action-area');
    const userRole = localStorage.getItem('userRole');

    // Display the correct action button based on user role
    if (userRole === 'admin' || userRole === 'institute' || userRole === 'faculty') {
        groupActionArea.innerHTML = `<a href="add-group.html" class="btn btn-primary"><i class="fas fa-plus"></i> Create Group</a>`;
    } else {
        groupActionArea.innerHTML = `<a href="request-group.html" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Request a Group</a>`;
    }

    const groupItemRenderer = (group) => {
        const imageUrl = group.image_url || createInitialsAvatar(group.name);
        return `
            <a href="group-details.html?id=${group.group_id}" class="card-link">
                <div class="group-card card">
                    <img src="${sanitizeHTML(imageUrl)}" alt="${sanitizeHTML(group.name)}" class="group-image">
                    <div class="group-content">
                        <h3>${sanitizeHTML(group.name)}</h3>
                        <p>${sanitizeHTML(group.description.substring(0, 100))}...</p>
                        <span class="btn btn-secondary btn-sm group-cta">View Group</span>
                    </div>
                </div>
            </a>
        `;
    };

    renderData('/groups', groupsGrid, groupItemRenderer, {
        gridClass: 'groups-grid',
        emptyMessage: '<p class="info-message">No active groups at this time.</p>'
    });
});