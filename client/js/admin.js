// client/js/admin.js
document.addEventListener('DOMContentLoaded', () => {

    const fetchAdminStats = async () => {
        try {
            const stats = await window.api.get('/admin/stats');
            document.getElementById('new-users-stat').textContent = stats.newUsersLast30Days || 0;
            document.getElementById('pending-verifications-stat').textContent = stats.pendingVerifications || 0;
            document.getElementById('active-groups-stat').textContent = stats.activeGroups || 0;
            document.getElementById('new-blogs-stat').textContent = stats.newBlogsLast7Days || 0;
        } catch (error) {
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const requests = await window.api.get('/admin/pending-requests-summary');
            const container = document.getElementById('pending-requests-summary');
            if (!container) return;
            container.innerHTML = `
                <a href="verification-requests.html" class="pending-item">
                    <span>User Verifications</span>
                    <span class="count">${requests.verifications || 0}</span>
                </a>
                 <a href="approval-management.html" class="pending-item">
                    <span>Content Approvals</span>
                    <span class="count">${(requests.pendingJobs || 0) + (requests.pendingEvents || 0) + (requests.pendingCampaigns || 0)}</span>
                </a>
                <a href="group-creation-management.html" class="pending-item">
                    <span>Group Creations</span>
                    <span class="count">${requests.groupCreations || 0}</span>
                </a>
                <a href="group-join-management.html" class="pending-item">
                    <span>Group Join Requests</span>
                    <span class="count">${requests.groupJoins || 0}</span>
                </a>
            `;
        } catch (error) {
        }
    };

    // --- NEW: Upgraded Chart Rendering Function ---
    const renderCharts = async () => {
        // Chart.js Global Config
        Chart.defaults.font.family = "'Poppins', sans-serif";
        Chart.defaults.color = document.documentElement.classList.contains('dark-mode') ? '#ccc' : '#666';

        // 1. User Signups (Line Chart)
        try {
            const signupsData = await window.api.get('/admin/analytics/signups');
            const signupsCtx = document.getElementById('userSignupsChart')?.getContext('2d');
            if (signupsCtx && signupsData.length) {
                new Chart(signupsCtx, {
                    type: 'line',
                    data: {
                        labels: signupsData.map(d => new Date(d.date).toLocaleDateString()),
                        datasets: [{
                            label: 'New Users', data: signupsData.map(d => d.count),
                            borderColor: '#4A90E2', backgroundColor: 'rgba(74, 144, 226, 0.2)',
                            fill: true, tension: 0.4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        } catch (error) { console.error('Error rendering signup chart:', error); }

        // 2. User Roles (Doughnut Chart)
        try {
            const rolesData = await window.api.get('/admin/analytics/user-roles');
            const rolesCtx = document.getElementById('userRolesChart')?.getContext('2d');
            if (rolesCtx && rolesData.length) {
                new Chart(rolesCtx, {
                    type: 'doughnut',
                    data: {
                        labels: rolesData.map(d => d.role.charAt(0).toUpperCase() + d.role.slice(1)),
                        datasets: [{
                            label: 'User Roles', data: rolesData.map(d => d.count),
                            backgroundColor: ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#B8E986', '#7B68EE'],
                            borderWidth: 0
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
                });
            }
        } catch (error) { console.error('Error rendering roles chart:', error); }

        // 3. Content Trends (Bar Chart)
        try {
            const contentData = await window.api.get('/admin/analytics/content-trends');
            const contentCtx = document.getElementById('contentTrendsChart')?.getContext('2d');
            if (contentCtx && contentData.length) {
                new Chart(contentCtx, {
                    type: 'bar',
                    data: {
                        labels: contentData.map(d => d.type),
                        datasets: [{
                            label: 'Content Created', data: contentData.map(d => d.count),
                            backgroundColor: ['#F5A623', '#4A90E2', '#50E3C2'],
                            borderRadius: 4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }
        } catch (error) { console.error('Error rendering content chart:', error); }
    };

    const announcementForm = document.getElementById('announcement-form');
    if (announcementForm) {
        announcementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('announcement-title').value;
            const content = document.getElementById('announcement-content').value;
            try {
                await window.api.post('/admin/announcements', { title, content });
                showToast('Announcement posted successfully!', 'success');
                announcementForm.reset();
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
            }
        });
    }

    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    // Initial data load
    fetchAdminStats();
    fetchPendingRequests();
    renderCharts();
});