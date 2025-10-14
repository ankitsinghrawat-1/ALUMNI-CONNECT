document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('group-creation-table-body');
    const logoutBtn = document.getElementById('admin-logout-btn');

    const fetchGroupCreationRequests = async () => {
        if (!tableBody) return;

        try {
            const requests = await window.api.get('/admin/group-creation-requests');
            renderTable(requests);
        } catch (error) {
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
                <tr data-request-id="${req.request_id}">
                    <td>${req.name}</td>
                    <td title="${req.description}">${req.description.substring(0, 50)}${req.description.length > 50 ? '...' : ''}</td>
                    <td>${req.creator_name}</td>
                    <td>${new Date(req.requested_at).toLocaleString()}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-success approve-btn" data-id="${req.request_id}">Approve</button>
                        <button class="btn btn-sm btn-danger reject-btn" data-id="${req.request_id}">Reject</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    };

    const handleUpdateRequest = async (requestId, status) => {
        try {
            // Note: For approval, the status is 'approve' not 'active'  
            const apiStatus = status === 'approved' ? 'approve' : 'reject';
            const response = await window.api.put(`/admin/group-creation-requests/${requestId}`, { status: apiStatus });
            
            showToast(response.message, 'success');
            
            // Remove the processed row from the table
            const rowToRemove = document.querySelector(`tr[data-request-id="${requestId}"]`);
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
        
        // Check if the clicked element is a button with the required classes
        if (!target.classList.contains('approve-btn') && !target.classList.contains('reject-btn')) {
            return; // Ignore clicks on non-button areas
        }
        
        const requestId = target.dataset.id;
        if (!requestId) return; // Ignore clicks if no request ID is present

        if (target.classList.contains('approve-btn')) {
            handleUpdateRequest(requestId, 'approved');
        } else if (target.classList.contains('reject-btn')) {
            handleUpdateRequest(requestId, 'rejected');
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