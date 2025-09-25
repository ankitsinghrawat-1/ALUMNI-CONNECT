document.addEventListener('DOMContentLoaded', () => {
    const addEventForm = document.getElementById('add-event-form');
    const messageDiv = document.getElementById('message');

    if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = 'events.html';
        return;
    }

    if (addEventForm) {
        addEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const eventData = {
                title: document.getElementById('title').value,
                date: document.getElementById('date').value,
                location: document.getElementById('location').value,
                organizer: document.getElementById('organizer').value,
                description: document.getElementById('description').value,
            };

            try {
                const result = await window.api.post('/events', eventData);
                messageDiv.textContent = 'Event added successfully!';
                messageDiv.className = 'form-message success';
                addEventForm.reset();
            } catch (error) {
                console.error('Error adding event:', error);
                messageDiv.textContent = `Error: ${error.message}`;
                messageDiv.className = 'form-message error';
            }
        });
    }
});