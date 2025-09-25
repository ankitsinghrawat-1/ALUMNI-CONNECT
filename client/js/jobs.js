// client/js/jobs.js
document.addEventListener('DOMContentLoaded', () => {
    const jobsGrid = document.getElementById('jobs-grid');

    const jobItemRenderer = (job) => {
        const applyUrl = `apply.html?job_id=${job.job_id}&title=${encodeURIComponent(job.title)}`;
        return `
            <div class="job-card">
                <h3>${sanitizeHTML(job.title)}</h3>
                <p class="job-company"><i class="fas fa-building"></i> ${sanitizeHTML(job.company)}</p>
                <p class="job-location"><i class="fas fa-map-marker-alt"></i> ${sanitizeHTML(job.location)}</p>
                <p class="job-description">${sanitizeHTML(job.description)}</p>
                <a href="${applyUrl}" class="btn btn-primary apply-btn">Apply Now</a>
            </div>
        `;
    };

    renderData('/jobs', jobsGrid, jobItemRenderer, {
        gridClass: 'jobs-grid',
        emptyMessage: `
            <div class="empty-state">
                <i class="fas fa-briefcase"></i>
                <h3>No Jobs Available</h3>
                <p>There are no job opportunities posted at the moment. Check back soon!</p>
            </div>`
    });
});