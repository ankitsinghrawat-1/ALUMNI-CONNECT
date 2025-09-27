// client/js/group-management.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- FIX: Wait for the auth script to be ready ---
    await window.authReady;

    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('id');
    const currentUserId = parseInt(localStorage.getItem('loggedInUserId'), 10);

    // DOM Elements
    const editGroupForm = document.getElementById('edit-group-form');
    const membersListContainer = document.getElementById('members-list');
    const groupNameSidebar = document.getElementById('group-name-sidebar');
    const mainContainer = document.querySelector('.profile-container');

    // Initial Permission Check
    if (!groupId || !currentUserId) {
        window.location.href = 'groups.html';
        return;
    }

    try {
        // This API call will now reliably have the auth token
        const membership = await window.api.get(`/groups/${groupId}/membership-status`);
        if (membership.status !== 'admin') {
            showToast('You are not an admin of this group.', 'error');
            window.location.href = `group-details.html?id=${groupId}`;
            return;
        }
    } catch (error) {
        console.error('Permission check failed:', error);
        // This redirect will now only happen for legitimate errors, not race conditions.
        showToast('You do not have permission to access this page.', 'error');
        window.location.href = 'groups.html';
        return;
    }

    let groupData = null; // To store group data for use in other functions

    const loadGroupData = async () => {
        try {
            groupData = await window.api.get(`/groups/${groupId}`);
            groupNameSidebar.textContent = groupData.name;
            document.getElementById('name').value = groupData.name;
            document.getElementById('description').value = groupData.description;
        } catch (error) {
            console.error('Error fetching group data:', error);
            showToast('Could not load group data.', 'error');
        }
    };

    const loadMembers = async () => {
        if (!groupData) return; // Ensure group data is loaded first

        try {
            const members = await window.api.get(`/groups/${groupId}/members`);
            membersListContainer.innerHTML = members.map(member => {
                let roleBadge = '';
                if (member.user_id === groupData.created_by) {
                    roleBadge = `<span class="role-badge creator">Creator</span>`;
                } else if (member.role === 'admin') {
                    roleBadge = `<span class="role-badge admin">Admin</span>`;
                }

                let actionButtons = '';
                // Only the group creator can manage roles
                if (currentUserId === groupData.created_by && member.user_id !== currentUserId) {
                    if (member.role === 'member') {
                        actionButtons += `<button class="btn btn-success btn-sm promote-btn" data-id="${member.user_id}">Promote</button>`;
                    } else {
                        actionButtons += `<button class="btn btn-secondary btn-sm demote-btn" data-id="${member.user_id}">Demote</button>`;
                    }
                }

                // Any admin (creator or promoted) can remove members, but not the creator
                if (member.user_id !== groupData.created_by) {
                     actionButtons += `<button class="btn btn-danger btn-sm remove-member-btn" data-id="${member.user_id}">Remove</button>`;
                }


                return `
                    <div class="member-management-item">
                        <div class="member-info">
                            <img src="${member.profile_pic_url ? `http://localhost:3000/${member.profile_pic_url}` : createInitialsAvatar(member.full_name)}" alt="${member.full_name}" class="alumnus-pfp-round small">
                            <span>${sanitizeHTML(member.full_name)} ${roleBadge}</span>
                        </div>
                        <div class="member-actions">${actionButtons}</div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    editGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('description', document.getElementById('description').value);
        
        const logoFile = document.getElementById('group_logo').files[0];
        if (logoFile) {
            formData.append('group_logo', logoFile);
        }
        const backgroundFile = document.getElementById('group_background').files[0];
        if (backgroundFile) {
            formData.append('group_background', backgroundFile);
        }

        try {
            await window.api.putForm(`/groups/${groupId}`, formData);
            showToast('Group updated successfully!', 'success');
            await loadGroupData();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    membersListContainer.addEventListener('click', async (e) => {
        const target = e.target;
        const memberId = target.dataset.id;
        
        if (target.classList.contains('remove-member-btn')) {
            if (confirm('Are you sure you want to remove this member?')) {
                try {
                    await window.api.del(`/groups/${groupId}/members/${memberId}`);
                    showToast('Member removed.', 'success');
                    await loadMembers();
                } catch (error) {
                    showToast(`Error: ${error.message}`, 'error');
                }
            }
        }

        if (target.classList.contains('promote-btn')) {
            try {
                await window.api.post(`/groups/${groupId}/members/${memberId}/promote`);
                showToast('Member promoted.', 'success');
                await loadMembers();
            } catch(error) { showToast(`Error: ${error.message}`, 'error'); }
        }
        
        if (target.classList.contains('demote-btn')) {
            try {
                await window.api.post(`/groups/${groupId}/members/${memberId}/demote`);
                showToast('Admin demoted.', 'success');
                await loadMembers();
            } catch(error) { showToast(`Error: ${error.message}`, 'error'); }
        }
    });
    
    // Tab switching logic
    document.querySelectorAll('.profile-nav a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('.profile-nav a').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.profile-page').forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.tab).classList.add('active');
        });
    });

    // Initial Load
    await loadGroupData();
    await loadMembers();
});