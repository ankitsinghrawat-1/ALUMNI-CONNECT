// client/js/student-dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = localStorage.getItem('loggedInUserEmail');
    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Personalized Greeting
    const greetingElement = document.getElementById('dashboard-greeting');
    const hour = new Date().getHours();
    let greeting = (hour < 12) ? 'Good Morning' : (hour < 18) ? 'Good Afternoon' : 'Good Evening';
    greetingElement.textContent = `${greeting}, ${localStorage.getItem('loggedInUserName') || 'Student'}!`;

    try {
        const userProfile = await window.api.get(`/users/profile`);
        document.getElementById('profile-pic').src = userProfile.profile_pic_url 
            ? `http://localhost:3000/${userProfile.profile_pic_url}` 
            : createInitialsAvatar(userProfile.full_name);
    } catch (error) {
        console.error('Error fetching profile picture:', error);
    }

    const mentorContainer = document.getElementById('mentor-recommendations');
    const jobContainer = document.getElementById('job-recommendations');
    const eventContainer = document.getElementById('event-recommendations');

    try {
        const [mentors, jobs, events] = await Promise.all([
            window.api.get('/mentors'),
            window.api.get('/jobs/recent'),
            window.api.get('/events/recent')
        ]);

        // Render Mentors
        if (mentors.length > 0) {
            mentorContainer.innerHTML = mentors.slice(0, 3).map(mentor => `
                <div class="recommendation-item">
                    <div class="mentor-recommendation">
                        <img src="${mentor.profile_pic_url ? `http://localhost:3000/${mentor.profile_pic_url}` : createInitialsAvatar(mentor.full_name)}" alt="${mentor.full_name}">
                        <div>
                            <strong>${sanitizeHTML(mentor.full_name)}</strong>
                            <p>${sanitizeHTML(mentor.job_title)}</p>
                        </div>
                    </div>
                    <a href="mentors.html" class="btn btn-secondary btn-sm">Connect</a>
                </div>
            `).join('');
        } else {
            mentorContainer.innerHTML = '<p>No mentors available right now.</p>';
        }

        // Render Jobs
        if (jobs.length > 0) {
            jobContainer.innerHTML = jobs.map(job => `
                <div class="recommendation-item">
                    <strong>${sanitizeHTML(job.title)}</strong>
                    <p>${sanitizeHTML(job.company)} - ${sanitizeHTML(job.location)}</p>
                    <a href="jobs.html" class="btn btn-secondary btn-sm">View Job</a>
                </div>
            `).join('');
        } else {
            jobContainer.innerHTML = '<p>No recent jobs posted.</p>';
        }

        // Render Events
        if (events.length > 0) {
            eventContainer.innerHTML = events.map(event => `
                <div class="recommendation-item">
                    <strong>${sanitizeHTML(event.title)}</strong>
                    <p>${new Date(event.date).toLocaleDateString()}</p>
                    <a href="event-details.html?id=${event.event_id}" class="btn btn-secondary btn-sm">View Details</a>
                </div>
            `).join('');
        } else {
            eventContainer.innerHTML = '<p>No upcoming events.</p>';
        }

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        mentorContainer.innerHTML = '<p class="info-message error">Could not load recommendations.</p>';
        jobContainer.innerHTML = '<p class="info-message error">Could not load jobs.</p>';
        eventContainer.innerHTML = '<p class="info-message error">Could not load events.</p>';
    }
});