document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = localStorage.getItem('loggedInUserEmail');
    const userRole = localStorage.getItem('userRole');

    // --- This is the only check we need ---
    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Personalized Greeting
    const greetingElement = document.getElementById('dashboard-greeting');
    const hour = new Date().getHours();
    let greeting = '';
    if (hour < 12) {
        greeting = 'Good Morning';
    } else if (hour < 18) {
        greeting = 'Good Afternoon';
    } else {
        greeting = 'Good Evening';
    }
    greetingElement.textContent = `${greeting}, ${localStorage.getItem('loggedInUserName') || 'Alumni'}!`;

    // Weather Widget
    const weatherWidget = document.getElementById('weather-widget');
    weatherWidget.innerHTML = `<i class="fas fa-sun"></i> 34°C, Sunny in New Delhi`;

    // Fetch and render dashboard data
    const fetchDashboardData = async () => {
        try {
            const [stats, recommendations, activity, announcements] = await Promise.all([
                window.api.get('/users/dashboard-stats'),
                window.api.get('/users/dashboard-recommendations'),
                window.api.get('/users/dashboard-activity'),
                window.api.get('/users/announcements')
            ]);

            // Profile Picture
            const userProfile = await window.api.get(`/users/profile/${userEmail}`);
            const profilePic = document.getElementById('profile-pic');
            profilePic.src = userProfile.profile_pic_url
                ? `http://localhost:3000/${userProfile.profile_pic_url}`
                : createInitialsAvatar(userProfile.full_name);

            // Profile Completion
            const progressBar = document.getElementById('profile-progress-bar');
            const progressText = document.getElementById('profile-progress-text');
            progressBar.style.width = `${stats.profileCompletion}%`;
            progressText.textContent = `${stats.profileCompletion}% Complete`;

            // Recommendations
            const recommendationsContainer = document.getElementById('recommendations-container');
            recommendationsContainer.innerHTML = '';

            if (recommendations.featuredMentor) {
                const mentor = recommendations.featuredMentor;
                recommendationsContainer.innerHTML += `
                    <div class="recommendation-item">
                        <h5>Mentor Spotlight</h5>
                        <div class="mentor-recommendation">
                            <img src="${mentor.profile_pic_url ? `http://localhost:3000/${mentor.profile_pic_url}` : createInitialsAvatar(mentor.full_name)}" alt="${mentor.full_name}">
                            <div>
                                <strong>${sanitizeHTML(mentor.full_name)}</strong>
                                <p>${sanitizeHTML(mentor.job_title)}</p>
                            </div>
                        </div>
                        <a href="mentors.html" class="btn btn-secondary btn-sm">Connect</a>
                    </div>
                `;
            }
            if (recommendations.recommendedEvent) {
                const event = recommendations.recommendedEvent;
                recommendationsContainer.innerHTML += `
                    <div class="recommendation-item">
                        <h5>Upcoming Event</h5>
                        <strong>${sanitizeHTML(event.title)}</strong>
                        <p>${new Date(event.date).toLocaleDateString()}</p>
                        <a href="event-details.html?id=${event.event_id}" class="btn btn-secondary btn-sm">View Details</a>
                    </div>
                `;
            }

            // User Activity Chart
            renderActivityChart(activity);

            // Announcements
            const announcementsList = document.getElementById('announcements-list');
            if (announcements.length > 0) {
                announcementsList.innerHTML = announcements.map(announcement => `
                    <li>
                        <strong>${sanitizeHTML(announcement.title)}</strong>
                        <p>${sanitizeHTML(announcement.content)}</p>
                    </li>
                `).join('');
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const renderActivityChart = (activityData) => {
        const ctx = document.getElementById('userActivityChart').getContext('2d');

        const labels = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            labels.push(d.toLocaleString('default', { month: 'short' }));
        }

        const blogCounts = new Array(6).fill(0);
        const rsvpCounts = new Array(6).fill(0);

        activityData.blogs.forEach(item => {
            const monthIndex = (new Date(item.month + '-01').getMonth() - new Date().getMonth() + 5 + 12) % 12;
            blogCounts[monthIndex] = item.count;
        });

        activityData.rsvps.forEach(item => {
            const monthIndex = (new Date(item.month + '-01').getMonth() - new Date().getMonth() + 5 + 12) % 12;
            rsvpCounts[monthIndex] = item.count;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Blogs Posted',
                    data: blogCounts,
                    backgroundColor: 'rgba(74, 144, 226, 0.7)',
                    borderColor: 'rgba(74, 144, 226, 1)',
                    borderWidth: 1
                }, {
                    label: 'Events RSVP\'d',
                    data: rsvpCounts,
                    backgroundColor: 'rgba(245, 166, 35, 0.7)',
                    borderColor: 'rgba(245, 166, 35, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    };

    fetchDashboardData();
});