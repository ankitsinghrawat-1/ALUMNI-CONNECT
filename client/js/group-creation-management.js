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
            // FIX: Add user_id to the data-request-id for easier removal
            const rowId = `request-${req.group_id}-${req.created_by}`;
            const row = `
                <tr id="${rowId}">
                    <td>${req.name}</td>
                    <td title="${req.description}">${req.description.substring(0, 50)}${req.description.length > 50 ? '...' : ''}</td>
                    <td>${req.creator_name}</td>
                    <td>${new Date(req.created_at).toLocaleString()}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-success approve-btn" data-group-id="${req.group_id}" data-user-id="${req.created_by}">Approve</button>
                        <button class="btn btn-sm btn-danger reject-btn" data-group-id="${req.group_id}" data-user-id="${req.created_by}">Reject</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    };

    const handleUpdateRequest = async (groupId, userId, status) => {
        try {
            // Note: For approval, the status is 'active'
            const apiStatus = status === 'approved' ? 'active' : 'rejected';
            // FIX: The API endpoint needs both groupId and userId
            const response = await window.api.put(`/admin/group-creation-requests/${groupId}/${userId}`, { status: apiStatus });
            
            showToast(response.message, 'success');
            
            // Remove the processed row from the table
            const rowId = `request-${groupId}-${userId}`;
            const rowToRemove = document.getElementById(rowId);
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
        // FIX: Get both groupId and userId from the button's data attributes
        const groupId = target.dataset.groupId;
        const userId = target.dataset.userId;

        if (!groupId || !userId) return; // Ignore clicks on non-button areas

        if (target.classList.contains('approve-btn')) {
            handleUpdateRequest(groupId, userId, 'approved');
        } else if (target.classList.contains('reject-btn')) {
            handleUpdateRequest(groupId, userId, 'rejected');
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