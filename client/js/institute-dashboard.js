// client/js/institute-dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = localStorage.getItem('loggedInUserEmail');
    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Personalized Greeting
    const greetingElement = document.getElementById('dashboard-greeting');
    greetingElement.textContent = `Welcome, ${localStorage.getItem('loggedInUserName') || 'Institute'}!`;

    try {
        const userProfile = await window.api.get(`/users/profile`);
        document.getElementById('profile-pic').src = userProfile.profile_pic_url 
            ? `http://localhost:3000/${userProfile.profile_pic_url}` 
            : createInitialsAvatar(userProfile.full_name);
    } catch (error) {
        console.error('Error fetching profile picture:', error);
    }

    const statsContainer = document.getElementById('stats-grid');
    const chartCtx = document.getElementById('engagementChart').getContext('2d');

    try {
        // A new endpoint for institute-specific stats
        const stats = await window.api.get('/admin/stats'); 
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-card-icon"><i class="fas fa-users"></i></div>
                <div class="stat-card-info"><h4>Total Alumni</h4><p>${stats.totalUsers}</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-card-info"><h4>Total Events</h4><p>${stats.totalEvents}</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon"><i class="fas fa-briefcase"></i></div>
                <div class="stat-card-info"><h4>Total Jobs Posted</h4><p>${stats.totalJobs}</p></div>
            </div>
             <div class="stat-card">
                <div class="stat-card-icon"><i class="fas fa-bullhorn"></i></div>
                <div class="stat-card-info"><h4>Active Campaigns</h4><p>5</p></div>
            </div>
        `;

        // This is example data. A real implementation would fetch this from the backend.
        new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'New Signups',
                    data: [12, 19, 3, 5, 2, 3],
                    borderColor: 'rgba(74, 144, 226, 1)',
                    backgroundColor: 'rgba(74, 144, 226, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } }
            }
        });

    } catch (error) {
        console.error('Error fetching institute data:', error);
        statsContainer.innerHTML = '<p class="info-message error">Could not load statistics.</p>';
    }
});