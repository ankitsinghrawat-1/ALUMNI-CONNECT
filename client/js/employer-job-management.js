// client/js/employer-job-management.js
document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('management-list');
    const userEmail = localStorage.getItem('loggedInUserEmail');

    if (!userEmail || localStorage.getItem('userRole') !== 'employer') {
        window.location.href = 'login.html';
        return;
    }

    const renderJobs = (jobs) => {
        if (jobs.length > 0) {
            listContainer.innerHTML = jobs.map(job => `
                <tr>
                    <td>${sanitizeHTML(job.title)}</td>
                    <td>${sanitizeHTML(job.company)}</td>
                    <td>${sanitizeHTML(job.location)}</td>
                    <td>
                        <a href="edit-job.html?id=${job.job_id}" class="btn btn-secondary btn-sm">Edit</a>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${job.job_id}">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            listContainer.innerHTML = '<tr><td colspan="4" class="info-message">You have not posted any jobs yet. <a href="add-job.html">Post one now!</a></td></tr>';
        }
    };

    const loadJobs = async () => {
        try {
            const jobs = await window.api.get(`/jobs/employer/${userEmail}`);
            renderJobs(jobs);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            listContainer.innerHTML = '<tr><td colspan="4" class="info-message error">Could not load your jobs. Please try again.</td></tr>';
        }
    };

    listContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const jobId = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this job posting?')) {
                try {
                    await window.api.del(`/jobs/${jobId}`);
                    showToast('Job posting deleted successfully.', 'success');
                    await loadJobs();
                } catch (error) {
                    console.error('Error deleting job:', error);
                    showToast(`Error: ${error.message}`, 'error');
                }
            }
        }
    });

    loadJobs();
});