// client/js/events.js
document.addEventListener('DOMContentLoaded', () => {
    const eventsListContainer = document.getElementById('events-list');

    const eventItemRenderer = (event) => {
        const summary = sanitizeHTML(event.description.substring(0, 100) + (event.description.length > 100 ? '...' : ''));
        const eventDate = new Date(event.date).toLocaleDateString();
        return `
            <a href="event-details.html?id=${event.event_id}" class="event-card card event-card-link">
                <h3>${sanitizeHTML(event.title)}</h3>
                <p><i class="fas fa-calendar-alt"></i> ${sanitizeHTML(eventDate)}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${sanitizeHTML(event.location)}</p>
                <p class="event-summary">${summary}</p>
                <span class="view-details-link">View Details &rarr;</span>
            </a>
        `;
    };

    renderData('/events', eventsListContainer, eventItemRenderer, {
        emptyMessage: `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No Events Scheduled</h3>
                <p>There are currently no upcoming events. Please check back later!</p>
            </div>`
    });
});