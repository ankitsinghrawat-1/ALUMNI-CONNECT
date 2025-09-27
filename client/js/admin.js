// client/js/admin.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Fetch and Display STATS ---
    const fetchAdminStats = async () => {
        try {
            const stats = await window.api.get('/admin/stats');
            document.getElementById('total-users').textContent = stats.totalUsers;
            document.getElementById('total-events').textContent = stats.totalEvents;
            document.getElementById('total-jobs').textContent = stats.totalJobs;
            document.getElementById('total-applications').textContent = stats.totalApplications;
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        }
    };

    // --- Fetch and Display PENDING REQUESTS ---
    const fetchPendingRequests = async () => {
        try {
            const requests = await window.api.get('/admin/pending-requests-summary');
            const container = document.getElementById('pending-requests-summary');
            container.innerHTML = `
                <a href="verification-requests.html" class="pending-item">
                    <span>User Verifications</span>
                    <span class="count">${requests.verifications}</span>
                </a>
                 <a href="approval-management.html" class="pending-item">
                    <span>Content Approvals</span>
                    <span class="count">${requests.pendingJobs + requests.pendingEvents + requests.pendingCampaigns}</span>
                </a>
                <a href="group-creation-management.html" class="pending-item">
                    <span>Group Creations</span>
                    <span class="count">${requests.groupCreations}</span>
                </a>
                <a href="group-join-management.html" class="pending-item">
                    <span>Group Join Requests</span>
                    <span class="count">${requests.groupJoins}</span>
                </a>
            `;
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        }
    };

    // --- Fetch and Render CHARTS ---
    const renderCharts = async () => {
        try {
            const signupsRes = await window.api.get('/admin/analytics/signups');

            const userSignupsCtx = document.getElementById('userSignupsChart').getContext('2d');
            const labels = signupsRes.map(item => new Date(item.date).toLocaleDateString());
            const data = signupsRes.map(item => item.count);

            new Chart(userSignupsCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'New Users per Day',
                        data: data,
                        backgroundColor: 'rgba(74, 144, 226, 0.2)',
                        borderColor: 'rgba(74, 144, 226, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching or rendering analytics charts:', error);
        }
    };

    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    fetchAdminStats();
    fetchPendingRequests();
    renderCharts();
});