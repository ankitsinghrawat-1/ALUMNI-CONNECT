// client/js/admin-dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    // Role check - redirect if not an admin
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
        showToast('Access Denied. Admins only.', 'error');
        window.location.href = 'dashboard.html'; // Redirect to their default dashboard
        return;
    }

    // Fetch and display dashboard stats
    const loadDashboardStats = async () => {
        try {
            const stats = await window.api.get('/admin/stats');
            document.getElementById('total-users').textContent = stats.totalUsers || 0;
            document.getElementById('total-groups').textContent = stats.totalGroups || 0;
            document.getElementById('total-events').textContent = stats.totalEvents || 0;
            document.getElementById('total-jobs').textContent = stats.totalJobs || 0;
        } catch (error) {
            showToast('Could not load platform statistics.', 'error');
        }
    };

    // Fetch and display recent activity
    const loadRecentActivity = async () => {
        const activityList = document.getElementById('recent-activity-list');
        try {
            const activity = await window.api.get('/admin/recent-activity');
            if (activity && activity.length > 0) {
                activityList.innerHTML = activity.map(item => `
                    <li>
                        <i class="fas ${getActivityIcon(item.type)}"></i>
                        <div>
                            <p>${sanitizeHTML(item.description)}</p>
                            <small>${new Date(item.created_at).toLocaleString()}</small>
                        </div>
                    </li>
                `).join('');
            } else {
                activityList.innerHTML = '<li>No recent activity to show.</li>';
            }
        } catch (error) {
            activityList.innerHTML = '<li>Could not load activity.</li>';
        }
    };

    function getActivityIcon(type) {
        switch (type) {
            case 'new_user': return 'fa-user-plus';
            case 'new_group': return 'fa-users';
            case 'new_post': return 'fa-comment-alt';
            default: return 'fa-info-circle';
        }
    }

    // Initial data load
    loadDashboardStats();
    loadRecentActivity();
});