// client/js/group-details.js
document.addEventListener('DOMContentLoaded', async () => {
    const groupDetailsContainer = document.getElementById('group-details-container');
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('id');

    if (!groupId) {
        groupDetailsContainer.innerHTML = '<h1>Group not found</h1>';
        return;
    }

    groupDetailsContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const group = await window.api.get(`/groups/${groupId}`);
        document.title = group.name;

        groupDetailsContainer.innerHTML = `
            <div class="group-details-card card">
                <h1>${sanitizeHTML(group.name)}</h1>
                <p>${sanitizeHTML(group.description)}</p>
                <div class="group-actions">
                    <button id="join-request-btn" class="btn btn-primary">Request to Join</button>
                </div>
                <div class="members-section">
                    <h3>Members</h3>
                    <div id="members-list" class="members-list"></div>
                </div>
            </div>
        `;

        const joinRequestBtn = document.getElementById('join-request-btn');
        joinRequestBtn.addEventListener('click', async () => {
            try {
                await window.api.post(`/groups/${groupId}/request-join`);
                showToast('Your request to join has been sent!', 'success');
                joinRequestBtn.textContent = 'Request Sent';
                joinRequestBtn.disabled = true;
            } catch (error) {
                showToast(error.message, 'error');
            }
        });

        const membersList = document.getElementById('members-list');
        const members = await window.api.get(`/groups/${groupId}/members`);
        if (members.length > 0) {
            membersList.innerHTML = members.map(member => `
                <div class="member-item">
                    <img src="${member.profile_pic_url ? `http://localhost:3000/${member.profile_pic_url}` : createInitialsAvatar(member.full_name)}" alt="${member.full_name}" class="alumnus-pfp-round small">
                    <span>${sanitizeHTML(member.full_name)}</span>
                </div>
            `).join('');
        } else {
            membersList.innerHTML = '<p>No members yet.</p>';
        }

    } catch (error) {
        console.error('Error fetching group details:', error);
        groupDetailsContainer.innerHTML = '<h1>Error loading group</h1><p class="info-message error">The group could not be found or there was a server error.</p>';
    }
});