document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('users-table-body');
    const searchInput = document.getElementById('user-search-input');
    const paginationControls = document.getElementById('pagination-controls');
    const modal = document.getElementById('edit-user-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const editForm = document.getElementById('edit-user-form');
    const logoutBtn = document.getElementById('admin-logout-btn');

    let currentPage = 1;
    let totalPages = 1;
    let currentSearch = '';
    let debounceTimer;

    // --- Data Fetching and Rendering ---

    const fetchUsers = async (page = 1, search = '') => {
        try {
            const response = await window.api.get(`/admin/users?page=${page}&limit=10&search=${search}`);
            renderTable(response.data);
            renderPagination(response.total, response.page, response.limit);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center error-message">Failed to load users. ${error.message}</td></tr>`;
        }
    };

    const renderTable = (users) => {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No users found.</td></tr>';
            return;
        }

        users.forEach(user => {
            const verificationStatus = user.verification_status || 'not_submitted';
            let statusBadge;
            
            // *** CORRECTED SWITCH STATEMENT ***
            switch (verificationStatus) {
                case 'verified': // Was 'approved'
                    statusBadge = `<span class="badge badge-success">Verified</span>`;
                    break;
                case 'pending':
                    statusBadge = `<span class="badge badge-warning">Pending</span>`;
                    break;
                case 'unverified': // Was 'rejected'
                    statusBadge = `<span class="badge badge-danger">Unverified</span>`;
                    break;
                default:
                    statusBadge = `<span class="badge badge-secondary">Not Submitted</span>`;
            }

            const row = `
                <tr>
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${statusBadge}</td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${user.user_id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    };

    const renderPagination = (totalItems, page, limit) => {
        if (!paginationControls) return;
        paginationControls.innerHTML = '';
        totalPages = Math.ceil(totalItems / limit);
        currentPage = page;

        if (totalPages <= 1) return;

        // Previous Button
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo; Prev';
        prevButton.className = 'btn btn-secondary';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => fetchUsers(currentPage - 1, currentSearch));
        paginationControls.appendChild(prevButton);

        // Page Info
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        pageInfo.className = 'page-info';
        paginationControls.appendChild(pageInfo);

        // Next Button
        const nextButton = document.createElement('button');
        nextButton.innerHTML = 'Next &raquo;';
        nextButton.className = 'btn btn-secondary';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => fetchUsers(currentPage + 1, currentSearch));
        paginationControls.appendChild(nextButton);
    };


    // --- Modal Handling ---

    const openModal = async (userId) => {
        try {
            const user = await window.api.get(`/admin/users/${userId}`);
            document.getElementById('edit-user-id').value = user.user_id;
            document.getElementById('edit-user-name').textContent = user.full_name;
            document.getElementById('edit-user-email').textContent = user.email;
            document.getElementById('edit-user-role').value = user.role;
            modal.style.display = 'flex';
        } catch (error) {
            showToast(`Failed to load user details: ${error.message}`, 'error');
        }
    };

    const closeModal = () => {
        modal.style.display = 'none';
        editForm.reset();
    };

    const handleSaveChanges = async () => {
        const userId = document.getElementById('edit-user-id').value;
        const newRole = document.getElementById('edit-user-role').value;
        
        try {
            await window.api.put(`/admin/users/${userId}/role`, { role: newRole });
            showToast('User role updated successfully!', 'success');
            closeModal();
            fetchUsers(currentPage, currentSearch); // Refresh table
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleVerificationAction = async (e) => {
        if (!e.target.matches('.verification-actions .btn')) return;

        const userId = document.getElementById('edit-user-id').value;
        const status = e.target.dataset.status;

        try {
            await window.api.put(`/admin/users/${userId}/verification`, { status });
            showToast(`User verification set to ${status}.`, 'success');
            closeModal();
            fetchUsers(currentPage, currentSearch); // Refresh table
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };


    // --- Event Listeners ---

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearch = e.target.value;
            fetchUsers(1, currentSearch);
        }, 300); // Debounce to avoid excessive API calls
    });

    tableBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-btn');
        if (editButton) {
            openModal(editButton.dataset.id);
        }
    });

    modalCloseBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);
    modalSaveBtn.addEventListener('click', handleSaveChanges);
    document.querySelector('.verification-actions').addEventListener('click', handleVerificationAction);

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    // --- Initial Load ---
    fetchUsers();
});