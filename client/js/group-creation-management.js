document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('group-creation-table-body');
    const logoutBtn = document.getElementById('admin-logout-btn');

    const fetchGroupCreationRequests = async () => {
        if (!tableBody) return;

        try {
            const requests = await window.api.get('/admin/group-creation-requests');
            renderTable(requests);
        } catch (error) {
            console.error('Error fetching group creation requests:', error);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center error-message">Failed to load requests. ${error.message}</td></tr>`;
        }
    };

    const renderTable = (requests) => {
        tableBody.innerHTML = '';

        if (requests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No pending group creation requests found.</td></tr>';
            return;
        }

        requests.forEach(req => {
            const row = `
                <tr data-request-id="${req.group_id}">
                    <td>${req.name}</td>
                    <td title="${req.description}">${req.description.substring(0, 50)}${req.description.length > 50 ? '...' : ''}</td>
                    <td>${req.creator_name}</td>
                    <td>${new Date(req.created_at).toLocaleString()}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-success approve-btn" data-id="${req.group_id}">Approve</button>
                        <button class="btn btn-sm btn-danger reject-btn" data-id="${req.group_id}">Reject</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    };

    const handleUpdateRequest = async (groupId, status) => {
        try {
            // Note: For approval, the status is 'active'
            const apiStatus = status === 'approved' ? 'active' : 'rejected';
            const response = await window.api.put(`/admin/group-creation-requests/${groupId}`, { status: apiStatus });
            
            showToast(response.message, 'success');
            
            // Remove the processed row from the table
            const rowToRemove = document.querySelector(`tr[data-request-id="${groupId}"]`);
            if (rowToRemove) {
                rowToRemove.remove();
            }

            // Check if the table is now empty
            if (tableBody.children.length === 0) {
                 renderTable([]); // Re-render to show the "No pending requests" message
            }

        } catch (error) {
            console.error(`Error updating group to ${status}:`, error);
            showToast(`Error: ${error.message}`, 'error');
        }
    };


    // --- Event Listeners ---
    tableBody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('approve-btn')) {
            const groupId = target.dataset.id;
            handleUpdateRequest(groupId, 'approved');
        } else if (target.classList.contains('reject-btn')) {
            const groupId = target.dataset.id;
            handleUpdateRequest(groupId, 'rejected');
        }
    });
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    // --- Initial Load ---
    fetchGroupCreationRequests();
});