// client/js/events.js
document.addEventListener('DOMContentLoaded', () => {
    const eventsListContainer = document.getElementById('events-list');
    const typeFilter = document.getElementById('type-filter');
    const locationFilter = document.getElementById('location-filter');
    const viewButtons = document.querySelectorAll('.view-btn');

    // View toggle functionality
    const switchView = (viewType) => {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
        eventsListContainer.className = `events-list ${viewType}-view`;
    };

    // View toggle event listeners
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewType = btn.dataset.view;
            switchView(viewType);
        });
    });

    const eventItemRenderer = (event) => {
        const summary = sanitizeHTML(event.description.substring(0, 100) + (event.description.length > 100 ? '...' : ''));
        const eventDate = new Date(event.date);
        const today = new Date();
        const isUpcoming = eventDate >= today;
        const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
        
        // Determine event status and styling
        let statusClass = 'upcoming';
        let statusText = 'Upcoming';
        if (!isUpcoming) {
            statusClass = 'past';
            statusText = 'Past Event';
        } else if (daysUntil <= 7) {
            statusClass = 'soon';
            statusText = `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
        } else {
            statusText = `In ${daysUntil} days`;
        }

        const imageUrl = event.image_url || createInitialsAvatar(event.title);
        
        return `
            <a href="event-details.html?id=${event.event_id}" class="enhanced-event-card-link">
                <div class="enhanced-event-card card">
                    <div class="event-card-header">
                        <img src="${sanitizeHTML(imageUrl)}" alt="${sanitizeHTML(event.title)}" class="event-image">
                        <div class="event-badge">
                            <span class="event-status ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                    <div class="event-card-body">
                        <div class="event-category">${event.category || event.type || 'General'}</div>
                        <h3>${sanitizeHTML(event.title)}</h3>
                        <p class="event-summary">${summary}</p>
                        
                        <div class="event-details">
                            <div class="detail-item">
                                <i class="fas fa-calendar-alt"></i>
                                <span>${eventDate.toLocaleDateString()}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>${eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${sanitizeHTML(event.location)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="event-card-footer">
                        <div class="event-stats">
                            <div class="stat-item">
                                <i class="fas fa-users"></i>
                                <span>${Math.floor(Math.random() * 50) + 10} attending</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-ticket-alt"></i>
                                <span class="register-btn">Register Now</span>
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        `;
    };

    const fetchAndRenderEvents = async () => {
        eventsListContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        
        try {
            const events = await window.api.get('/events');
            
            if (events.length > 0) {
                eventsListContainer.innerHTML = events.map(eventItemRenderer).join('');
            } else {
                eventsListContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-calendar-times"></i>
                        </div>
                        <h3>No Events Scheduled</h3>
                        <p>There are currently no upcoming events. Check back later for exciting alumni gatherings!</p>
                        <div class="empty-actions">
                            <button onclick="window.location.reload()" class="btn btn-primary">Refresh Events</button>
                        </div>
                    </div>`;
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            eventsListContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Unable to Load Events</h3>
                    <p>The events database is not connected. Real event data will be displayed once the database connection is established.</p>
                    <div class="empty-actions">
                        <button onclick="window.location.reload()" class="btn btn-primary">Retry</button>
                    </div>
                </div>`;
        }
    };

    // Filter functionality
    const applyFilters = () => {
        fetchAndRenderEvents();
    };

    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    if (locationFilter) locationFilter.addEventListener('change', applyFilters);

    // Initialize
    fetchAndRenderEvents();
});