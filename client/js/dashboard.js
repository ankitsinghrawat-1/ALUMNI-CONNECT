document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = localStorage.getItem('loggedInUserEmail');
    const userRole = localStorage.getItem('userRole');

    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    if (userRole === 'admin') {
        window.location.href = 'admin.html';
        return;
    }

    const fetchUserProfile = async () => {
        try {
            // This is a public route, so it doesn't need the token
            const user = await window.api.get(`/users/profile/${userEmail}`);
            
            document.getElementById('profile-name').textContent = user.full_name;
            document.getElementById('profile-info').textContent = `${user.job_title || 'N/A'} at ${user.current_company || 'N/A'}`;
            
            const badgeContainer = document.getElementById('dashboard-verified-badge');
            if (user.verification_status === 'verified') {
                badgeContainer.innerHTML = '<span class="verified-badge-sm" title="Verified"><i class="fas fa-check-circle"></i></span>';
            }

            const profilePic = document.getElementById('profile-pic');
            profilePic.src = user.profile_pic_url 
                ? `http://localhost:3000/${user.profile_pic_url}` 
                : createInitialsAvatar(user.full_name);

            profilePic.onerror = () => {
                profilePic.onerror = null;
                profilePic.src = createInitialsAvatar(user.full_name);
            };

        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const fetchRecentEvents = async () => {
        try {
            const events = await window.api.get('/events/recent');
            const eventsList = document.getElementById('recent-events-list');
            eventsList.innerHTML = '';
            if (events.length > 0) {
                events.forEach(event => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${event.title}</strong> - ${event.location} <br><small>${new Date(event.date).toLocaleDateString()}</small>`;
                    eventsList.appendChild(li);
                });
            } else {
                eventsList.innerHTML = '<li>No recent events to display.</li>';
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchRecentJobs = async () => {
        try {
            const jobs = await window.api.get('/jobs/recent');
            const jobsList = document.getElementById('recent-jobs-list');
            jobsList.innerHTML = '';
            if (jobs.length > 0) {
                jobs.forEach(job => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${job.title}</strong> at ${job.company} <br><small>${job.location}</small>`;
                    jobsList.appendChild(li);
                });
            } else {
                jobsList.innerHTML = '<li>No recent job postings to display.</li>';
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    const fetchMyRsvps = async () => {
        const myEventsList = document.getElementById('my-events-list');
        try {
            const rsvpEventIds = await window.api.get('/events/user/rsvps');

            if (rsvpEventIds.length > 0) {
                const events = await window.api.post('/events/by-ids', { event_ids: rsvpEventIds });
                myEventsList.innerHTML = '';
                events.forEach(event => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${event.title}</strong> - ${event.location} <br><small>${event.date}</small>`;
                    myEventsList.appendChild(li);
                });
            } else {
                myEventsList.innerHTML = '<li>You have not responded to any upcoming events yet.</li>';
            }
        } catch (error) {
            console.error('Error fetching your RSVP\'d events:', error);
            myEventsList.innerHTML = '<li>Could not load your events.</li>';
        }
    };

    fetchUserProfile();
    fetchRecentEvents();
    fetchRecentJobs();
    fetchMyRsvps();
});