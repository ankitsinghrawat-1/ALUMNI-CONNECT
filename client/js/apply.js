document.addEventListener('DOMContentLoaded', () => {
    const applyForm = document.getElementById('apply-form');
    const messageDiv = document.getElementById('message');
    const jobTitleHeader = document.getElementById('job-title-header');
    
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job_id');
    const jobTitle = urlParams.get('title');

    if (!jobId || !jobTitle) {
        document.querySelector('.form-container').innerHTML = '<h2>Invalid Job Link</h2><p>This job application link is missing required information.</p>';
        return;
    }

    jobTitleHeader.textContent = `Apply for: ${jobTitle}`;

    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    if (loggedInUserEmail) {
        document.getElementById('email').value = loggedInUserEmail;
    }

    applyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('full_name', document.getElementById('full_name').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('cover_letter', document.getElementById('cover_letter').value);
        formData.append('resume', document.getElementById('resume').files[0]);

        messageDiv.textContent = 'Submitting...';
        messageDiv.className = 'form-message info';

        try {
            // Using the special postForm for multipart/form-data
            const response = await window.api.postForm(`/jobs/${jobId}/apply`, formData);
            const result = await response.json();

            if (response.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = 'form-message success';
                applyForm.reset();
            } else {
                messageDiv.textContent = `Error: ${result.message}`;
                messageDiv.className = 'form-message error';
            }
        } catch (error) {
            console.error('Application submission error:', error);
            messageDiv.textContent = 'An unexpected error occurred. Please try again.';
            messageDiv.className = 'form-message error';
        }
    });
});