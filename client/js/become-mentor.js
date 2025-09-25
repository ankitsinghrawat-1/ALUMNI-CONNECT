document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('become-mentor-form');
    const messageDiv = document.getElementById('message');
    
    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const expertise_areas = document.getElementById('expertise_areas').value;

        try {
            const result = await window.api.post('/mentors', { expertise_areas });
            messageDiv.textContent = result.message;
            messageDiv.className = 'form-message success';
            setTimeout(() => window.location.href = 'mentors.html', 2000);
        } catch (error) {
            messageDiv.className = 'form-message error';
            messageDiv.textContent = `Error: ${error.message}`;
            console.error('Error registering as mentor:', error);
        }
    });
});