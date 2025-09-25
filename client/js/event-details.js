// client/js/event-details.js
document.addEventListener('DOMContentLoaded', async () => {
    const eventDetailsContainer = document.getElementById('event-details-container');
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    const loggedInUserId = localStorage.getItem('userId'); // Assuming you store userId in localStorage on login

    if (!eventId) {
        eventDetailsContainer.innerHTML = '<h1>Event not found</h1>';
        return;
    }

    eventDetailsContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        // Fetch event details and attendees in parallel
        const [event, attendees, rsvpStatus] = await Promise.all([
            window.api.get(`/events/${eventId}`),
            window.api.get(`/events/${eventId}/attendees`),
            window.api.get('/events/user/rsvps') // Get all RSVPs for the user
        ]);

        document.title = event.title;

        const isRsvpd = rsvpStatus.includes(parseInt(eventId));

        const eventDate = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        eventDetailsContainer.innerHTML = `
            <div class="event-details-card card">
                <h1>${sanitizeHTML(event.title)}</h1>
                <div class="event-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${eventDate}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${sanitizeHTML(event.location)}</span>
                    <span><i class="fas fa-user-tie"></i> Organized by ${sanitizeHTML(event.organizer)}</span>
                </div>
                <div class="event-full-description">
                    <p>${sanitizeHTML(event.description).replace(/\n/g, '<br>')}</p>
                </div>
                <div class="event-actions">
                    <button id="rsvp-btn" class="btn ${isRsvpd ? 'btn-danger' : 'btn-primary'}">
                        ${isRsvpd ? '<i class="fas fa-times-circle"></i> Cancel RSVP' : '<i class="fas fa-check-circle"></i> RSVP Now'}
                    </button>
                </div>
                <div class="attendees-section">
                    <h3>Who's Going (${attendees.length})</h3>
                    <div id="attendees-list" class="attendees-list"></div>
                </div>
            </div>
        `;

        const attendeesList = document.getElementById('attendees-list');
        if (attendees.length > 0) {
            attendeesList.innerHTML = attendees.map(attendee => `
                <a href="view-profile.html?email=${attendee.email}" class="attendee-item" title="${sanitizeHTML(attendee.full_name)}">
                    <img src="${attendee.profile_pic_url ? `http://localhost:3000/${attendee.profile_pic_url}` : createInitialsAvatar(attendee.full_name)}" alt="${sanitizeHTML(attendee.full_name)}" class="attendee-pic">
                    <span>${sanitizeHTML(attendee.full_name)}</span>
                </a>
            `).join('');
        } else {
            attendeesList.innerHTML = '<p>No one has RSVP\'d yet. Be the first!</p>';
        }

        const rsvpBtn = document.getElementById('rsvp-btn');
        rsvpBtn.addEventListener('click', async () => {
            try {
                if (isRsvpd) {
                    await window.api.del(`/events/${eventId}/rsvp`);
                    showToast('RSVP Canceled', 'info');
                } else {
                    await window.api.post(`/events/${eventId}/rsvp`);
                    showToast('RSVP Successful!', 'success');
                }
                // Reload the page to show the updated RSVP status and attendees
                window.location.reload();
            } catch (error) {
                showToast(error.message, 'error');
            }
        });

    } catch (error) {
        console.error('Error fetching event details:', error);
        eventDetailsContainer.innerHTML = '<h1>Error loading event</h1><p class="info-message error">The event could not be found or there was a server error.</p>';
    }
});