document.addEventListener('DOMContentLoaded', async () => {
    const editJobForm = document.getElementById('edit-job-form');
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('id');

    if (localStorage.getItem('userRole') !== 'admin' || !jobId) {
        window.location.href = 'index.html';
        return;
    }

    const fetchJobData = async () => {
        try {
            const job = await window.api.get(`/jobs/${jobId}`);
            document.getElementById('title').value = job.title;
            document.getElementById('description').value = job.description;
            document.getElementById('company').value = job.company;
            document.getElementById('location').value = job.location;
            document.getElementById('contact_email').value = job.contact_email;
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    editJobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const jobData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            company: document.getElementById('company').value,
            location: document.getElementById('location').value,
            contact_email: document.getElementById('contact_email').value,
        };

        try {
            const result = await window.api.put(`/jobs/${jobId}`, jobData);
            showToast(result.message, 'success');
            setTimeout(() => window.location.href = 'job-management.html', 1500);
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    await fetchJobData();
});