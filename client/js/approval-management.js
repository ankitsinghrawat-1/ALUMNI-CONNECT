// client/js/approval-management.js
document.addEventListener('DOMContentLoaded', () => {

    const loadPendingItems = async () => {
        try {
            const [jobs, events, campaigns] = await Promise.all([
                window.api.get('/admin/pending-jobs'),
                window.api.get('/admin/pending-events'),
                window.api.get('/admin/pending-campaigns')
            ]);

            renderTable('pending-jobs-list', jobs, renderJobRow);
            renderTable('pending-events-list', events, renderEventRow);
            renderTable('pending-campaigns-list', campaigns, renderCampaignRow);

        } catch (error) {
        }
    };

    const renderTable = (tbodyId, items, rowRenderer) => {
        const tbody = document.getElementById(tbodyId);
        if (items.length > 0) {
            tbody.innerHTML = items.map(rowRenderer).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="4" class="info-message">No pending items.</td></tr>`;
        }
    };

    const renderJobRow = (job) => `
        <tr>
            <td>${sanitizeHTML(job.title)}</td>
            <td>${sanitizeHTML(job.company)}</td>
            <td>${new Date(job.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-success btn-sm approve-btn" data-id="${job.job_id}" data-type="job">Approve</button>
                <button class="btn btn-danger btn-sm reject-btn" data-id="${job.job_id}" data-type="job">Reject</button>
            </td>
        </tr>
    `;

    const renderEventRow = (event) => `
         <tr>
            <td>${sanitizeHTML(event.title)}</td>
            <td>${sanitizeHTML(event.organizer)}</td>
            <td>${new Date(event.date).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-success btn-sm approve-btn" data-id="${event.event_id}" data-type="event">Approve</button>
                <button class="btn btn-danger btn-sm reject-btn" data-id="${event.event_id}" data-type="event">Reject</button>
            </td>
        </tr>
    `;

    const renderCampaignRow = (campaign) => `
         <tr>
            <td>${sanitizeHTML(campaign.title)}</td>
            <td>$${parseFloat(campaign.goal_amount).toLocaleString()}</td>
            <td>${new Date(campaign.end_date).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-success btn-sm approve-btn" data-id="${campaign.campaign_id}" data-type="campaign">Approve</button>
                <button class="btn btn-danger btn-sm reject-btn" data-id="${campaign.campaign_id}" data-type="campaign">Reject</button>
            </td>
        </tr>
    `;

    document.body.addEventListener('click', async (e) => {
        const button = e.target;
        const id = button.dataset.id;
        const type = button.dataset.type;

        if (button.classList.contains('approve-btn')) {
            try {
                await window.api.post(`/admin/approve/${type}/${id}`);
                showToast(`${type} approved!`, 'success');
                loadPendingItems();
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
            }
        }

        if (button.classList.contains('reject-btn')) {
             try {
                await window.api.post(`/admin/reject/${type}/${id}`);
                showToast(`${type} rejected.`, 'info');
                loadPendingItems();
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
            }
        }
    });

    loadPendingItems();
});