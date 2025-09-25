// client/js/groups.js
document.addEventListener('DOMContentLoaded', () => {
    const groupsGrid = document.getElementById('groups-grid');
    const groupActionArea = document.getElementById('group-action-area');
    const userRole = localStorage.getItem('userRole');

    // Display the correct action button based on user role
    if (userRole === 'admin') {
        groupActionArea.innerHTML = `<a href="add-group.html" class="btn btn-primary"><i class="fas fa-plus"></i> Create Group</a>`;
    } else {
        groupActionArea.innerHTML = `<a href="request-group.html" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Request a Group</a>`;
    }

    const groupItemRenderer = (group) => {
        const imageUrl = group.image_url || 'https://via.placeholder.com/400x200?text=Alumni+Group';
        return `
            <div class="group-card card">
                <img src="${sanitizeHTML(imageUrl)}" alt="${sanitizeHTML(group.name)}" class="group-image">
                <div class="group-content">
                    <h3>${sanitizeHTML(group.name)}</h3>
                    <p>${sanitizeHTML(group.description.substring(0, 120))}...</p>
                    <a href="group-details.html?id=${group.group_id}" class="btn btn-primary group-cta">View Group</a>
                </div>
            </div>
        `;
    };

    renderData('/groups', groupsGrid, groupItemRenderer, {
        gridClass: 'groups-grid',
        emptyMessage: '<p class="info-message">No active groups at this time.</p>'
    });
});