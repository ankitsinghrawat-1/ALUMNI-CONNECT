// client/js/employer-dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = localStorage.getItem('loggedInUserEmail');
    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Personalized Greeting
    const greetingElement = document.getElementById('dashboard-greeting');
    greetingElement.textContent = `Welcome, ${localStorage.getItem('loggedInUserName') || 'Employer'}!`;

     try {
        const userProfile = await window.api.get(`/users/profile`);
        document.getElementById('profile-pic').src = userProfile.profile_pic_url 
            ? `http://localhost:3000/${userProfile.profile_pic_url}` 
            : createInitialsAvatar(userProfile.full_name);
    } catch (error) {
    }

    const jobContainer = document.getElementById('job-postings');

    try {
        // This is a new endpoint we need to create
        const jobs = await window.api.get(`/jobs/employer/${userEmail}`);

        if (jobs.length > 0) {
            jobContainer.innerHTML = jobs.map(job => `
                <div class="recommendation-item">
                    <strong>${sanitizeHTML(job.title)}</strong>
                    <p>${sanitizeHTML(job.company)} - ${sanitizeHTML(job.location)}</p>
                    <a href="job-management.html" class="btn btn-secondary btn-sm">Manage</a>
                </div>
            `).join('');
        } else {
            jobContainer.innerHTML = '<p>You have not posted any jobs yet.</p>';
        }

    } catch (error) {
        jobContainer.innerHTML = '<p class="info-message error">Could not load your job postings.</p>';
    }
});