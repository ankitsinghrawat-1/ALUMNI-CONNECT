// client/js/group-creation-management.js
document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('creation-requests-list');

    const loadRequests = async () => {
        listContainer.innerHTML = '<tr><td colspan="4"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>';
        try {
            const requests = await window.api.get('/admin/group-creation-requests');
            if (requests.length > 0) {
                listContainer.innerHTML = requests.map(req => `
                    <tr>
                        <td>${sanitizeHTML(req.group_name)}</td>
                        <td>${sanitizeHTML(req.group_description.substring(0, 100))}...</td>
                        <td>${sanitizeHTML(req.full_name)}</td>
                        <td>
                            <button class="btn btn-success btn-sm approve-btn" data-id="${req.request_id}">Approve</button>
                            <button class="btn btn-danger btn-sm reject-btn" data-id="${req.request_id}">Reject</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                listContainer.innerHTML = '<tr><td colspan="4" class="info-message">No pending group creation requests.</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            listContainer.innerHTML = '<tr><td colspan="4" class="info-message error">Could not load requests.</td></tr>';
        }
    };

    listContainer.addEventListener('click', async (e) => {
        const target = e.target;
        const requestId = target.dataset.id;
        let action = null;

        if (target.classList.contains('approve-btn')) {
            action = 'approve';
        } else if (target.classList.contains('reject-btn')) {
            action = 'reject';
        }

        if (action) {
            try {
                await window.api.post(`/admin/group-creation-requests/${requestId}`, { action });
                showToast(`Request has been ${action}d.`, 'success');
                loadRequests(); // Refresh the list
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
            }
        }
    });

    loadRequests();
});