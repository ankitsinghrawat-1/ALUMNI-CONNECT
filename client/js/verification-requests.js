document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('verification-table-body');
    const logoutBtn = document.getElementById('admin-logout-btn');

    const fetchVerificationRequests = async () => {
        if (!tableBody) return;

        try {
            const requests = await window.api.get('/admin/verification-requests');
            renderTable(requests);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center error-message">Failed to load items. ${error.message}</td></tr>`;
        }
    };

    const renderTable = (requests) => {
        tableBody.innerHTML = '';

        if (requests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No pending verification requests found.</td></tr>';
            return;
        }

        requests.forEach(req => {
            // Ensure document_path is a valid URL or provide a link to a download endpoint
            // For now, assuming it's a direct link. If it's a file path, you might need an endpoint to serve it.
            const documentLink = req.document_path 
                ? `<a href="${req.document_path}" target="_blank" rel="noopener noreferrer">View Document</a>`
                : '<span>No Document</span>';

            const row = `
                <tr data-request-id="${req.request_id}">
                    <td>${req.full_name}</td>
                    <td>${req.email}</td>
                    <td>${new Date(req.created_at).toLocaleString()}</td>
                    <td>${documentLink}</td>
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
            const response = await window.api.put(`/admin/verification-requests/${requestId}`, { status });
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
        if (target.classList.contains('approve-btn')) {
            const requestId = target.dataset.id;
            handleUpdateRequest(requestId, 'approved');
        } else if (target.classList.contains('reject-btn')) {
            const requestId = target.dataset.id;
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
    fetchVerificationRequests();
});