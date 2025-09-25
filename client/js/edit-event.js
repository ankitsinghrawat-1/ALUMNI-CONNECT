document.addEventListener('DOMContentLoaded', async () => {
    const editEventForm = document.getElementById('edit-event-form');
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    if (localStorage.getItem('userRole') !== 'admin' || !eventId) {
        window.location.href = 'index.html';
        return;
    }

    const fetchEventData = async () => {
        try {
            const event = await window.api.get(`/events/${eventId}`);
            document.getElementById('title').value = event.title;
            document.getElementById('description').value = event.description;
            document.getElementById('location').value = event.location;
            document.getElementById('organizer').value = event.organizer;
            document.getElementById('date').value = new Date(event.date).toISOString().split('T')[0];
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    editEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
            location: document.getElementById('location').value,
            organizer: document.getElementById('organizer').value,
        };

        try {
            const result = await window.api.put(`/events/${eventId}`, eventData);
            showToast(result.message, 'success');
            setTimeout(() => window.location.href = 'event-management.html', 1500);
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    await fetchEventData();
});