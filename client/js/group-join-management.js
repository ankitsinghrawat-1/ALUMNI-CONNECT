document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('group-join-table-body');
    const logoutBtn = document.getElementById('admin-logout-btn');

    const fetchGroupJoinRequests = async () => {
        if (!tableBody) return;

        try {
            const requests = await window.api.get('/admin/group-join-requests');
            renderTable(requests);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center error-message">Failed to load requests. ${error.message}</td></tr>`;
        }
    };

    const renderTable = (requests) => {
        tableBody.innerHTML = '';

        if (requests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No pending group join requests found.</td></tr>';
            return;
        }

        requests.forEach(req => {
            // Create a unique but simple ID for the row itself for easy DOM manipulation
            const rowId = `request-${req.group_id}-${req.user_id}`;

            const row = `
                <tr id="${rowId}">
                    <td>${req.user_name}</td>
                    <td>${req.group_name}</td>
                    <td>${new Date(req.joined_at).toLocaleString()}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-success approve-btn" data-group-id="${req.group_id}" data-user-id="${req.user_id}">Approve</button>
                        <button class="btn btn-sm btn-danger reject-btn" data-group-id="${req.group_id}" data-user-id="${req.user_id}">Reject</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    };

    const handleUpdateRequest = async (groupId, userId, status) => {
        try {
            // The API now requires a PUT request to /admin/group-join-requests/:groupId/:userId
            const response = await window.api.put(`/admin/group-join-requests/${groupId}/${userId}`, { status });
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
            showToast(`Error: ${error.message}`, 'error');
        }
    };


    // --- Event Listeners ---
    tableBody.addEventListener('click', (e) => {
        const target = e.target;
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
    fetchGroupJoinRequests();
});