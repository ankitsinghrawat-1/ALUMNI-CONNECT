document.addEventListener('DOMContentLoaded', () => {
    const addJobForm = document.getElementById('add-job-form');
    const messageDiv = document.getElementById('message');
    
    if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = 'jobs.html';
        return;
    }

    if (addJobForm) {
        addJobForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const jobData = {
                title: document.getElementById('title').value,
                company: document.getElementById('company').value,
                location: document.getElementById('location').value,
                description: document.getElementById('description').value,
                contact_email: document.getElementById('contact-email').value,
            };

            try {
                await window.api.post('/jobs', jobData);
                messageDiv.textContent = 'Job added successfully!';
                messageDiv.className = 'form-message success';
                addJobForm.reset();
            } catch (error) {
                console.error('Error adding job:', error);
                messageDiv.textContent = `Error: ${error.message}`;
                messageDiv.className = 'form-message error';
            }
        });
    }
});