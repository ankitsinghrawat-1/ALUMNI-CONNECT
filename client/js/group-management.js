// client/js/group-management.js
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('id');
    if (!groupId) {
        window.location.href = 'groups.html';
        return;
    }

    const editGroupForm = document.getElementById('edit-group-form');
    const membersListContainer = document.getElementById('members-list');

    const loadGroupData = async () => {
        try {
            const group = await window.api.get(`/groups/${groupId}`);
            document.getElementById('group-name-sidebar').textContent = group.name;
            document.getElementById('name').value = group.name;
            document.getElementById('description').value = group.description;
        } catch (error) {
            console.error('Error fetching group data:', error);
        }
    };

    const loadMembers = async () => {
        try {
            const members = await window.api.get(`/groups/${groupId}/members`);
            membersListContainer.innerHTML = members.map(member => `
                <div class="request-item">
                    <span>${sanitizeHTML(member.full_name)}</span>
                    <button class="btn btn-danger btn-sm remove-member-btn" data-id="${member.user_id}">Remove</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    editGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('description', document.getElementById('description').value);
        const imageFile = document.getElementById('group_image').files[0];
        if (imageFile) {
            formData.append('group_image', imageFile);
        }

        try {
            await window.api.putForm(`/groups/${groupId}`, formData);
            showToast('Group updated successfully!', 'success');
            loadGroupData();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    membersListContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('remove-member-btn')) {
            const memberId = e.target.dataset.id;
            if (confirm('Are you sure you want to remove this member?')) {
                try {
                    await window.api.del(`/groups/${groupId}/members/${memberId}`);
                    showToast('Member removed.', 'success');
                    loadMembers();
                } catch (error) {
                    showToast(`Error: ${error.message}`, 'error');
                }
            }
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

    await loadGroupData();
    await loadMembers();
});