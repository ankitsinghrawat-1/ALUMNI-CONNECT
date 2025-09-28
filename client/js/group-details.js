// client/js/group-details.js
document.addEventListener('DOMContentLoaded', async () => {
    const groupDetailsContainer = document.getElementById('group-details-container');
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('id');

    if (!groupId) {
        groupDetailsContainer.innerHTML = '<h1>Group not found</h1>';
        return;
    }
    
    const inviteModal = document.getElementById('invite-modal');
    const inviteForm = document.getElementById('invite-form');

    const loadGroupDetails = async () => {
        groupDetailsContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        try {
            const group = await window.api.get(`/groups/${groupId}`);
            const membership = await window.api.get(`/groups/${groupId}/membership-status`);
            
            document.title = group.name;

            let actionButtons = `<a href="group-discussion.html?id=${groupId}" class="btn btn-primary">View Discussion</a>`;
            if (membership.status === 'admin') {
                actionButtons += `<a href="group-management.html?id=${groupId}" class="btn btn-secondary">Manage Group</a>`;
                actionButtons += `<button id="invite-btn" class="btn btn-secondary">Invite Members</button>`;
            } else if (membership.status === 'member') {
                 actionButtons += `<button id="invite-btn" class="btn btn-secondary">Invite Members</button>`;
            } else if (membership.status === 'none') {
                actionButtons = `<button id="join-request-btn" class="btn btn-primary">Request to Join</button>`;
            } else if (membership.status === 'pending') {
                actionButtons = `<button class="btn btn-secondary" disabled>Request Sent</button>`;
            }

            const groupLogoUrl = group.image_url || createInitialsAvatar(group.name);

            groupDetailsContainer.innerHTML = `
                <div class="group-details-layout">
                    <!-- Left Column -->
                    <div class="group-main-content">
                        <div class="group-header-card card">
                            <img src="${sanitizeHTML(groupLogoUrl)}" alt="${group.name} Logo" class="group-logo-large">
                            <div class="group-info-text">
                                <h1>${sanitizeHTML(group.name)}</h1>
                                <p class="group-creator">Created by: ${sanitizeHTML(group.creator_name)}</p>
                            </div>
                        </div>
                        <div class="group-description-card card">
                            <h3>About this group</h3>
                            <p>${sanitizeHTML(group.description)}</p>
                        </div>
                        <div class="group-actions-card card">
                            <h3>Actions</h3>
                            <div class="group-actions">${actionButtons}</div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class="group-sidebar">
                        <div class="group-members-card card">
                            <h3>Members (<span id="member-count">0</span>)</h3>
                            <div id="members-list" class="members-list-sidebar"></div>
                        </div>
                    </div>
                </div>
            `;
            
            loadMembers();
            attachEventListeners();
            
        } catch (error) {
            console.error('Error fetching group details:', error);
            groupDetailsContainer.innerHTML = '<h1>Error loading group</h1><p class="info-message error">The group could not be found or there was a server error.</p>';
        }
    };
    
    const loadMembers = async () => {
        const membersList = document.getElementById('members-list');
        const memberCount = document.getElementById('member-count');
        try {
            const members = await window.api.get(`/groups/${groupId}/members`);
            memberCount.textContent = members.length;
            if (members.length > 0) {
                membersList.innerHTML = members.map(member => `
                    <a href="view-profile.html?email=${member.email}" class="member-item-sidebar">
                        <img src="${member.profile_pic_url ? `http://localhost:3000/${member.profile_pic_url}` : createInitialsAvatar(member.full_name)}" alt="${member.full_name}" class="alumnus-pic">
                        <span>${sanitizeHTML(member.full_name)}</span>
                    </a>
                `).join('');
            } else {
                 membersList.innerHTML = '<p class="info-message">No members yet.</p>';
            }
        } catch (error) {
             console.error('Error loading members:', error);
        }
    };

    const attachEventListeners = () => {
        groupDetailsContainer.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            
            if (target.id === 'join-request-btn') {
                 try {
                    await window.api.post(`/groups/${groupId}/request-join`);
                    showToast('Your request to join has been sent!', 'success');
                    target.textContent = 'Request Sent';
                    target.disabled = true;
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }
            
            if (target.id === 'invite-btn') {
                inviteModal.style.display = 'block';
            }
        });
        
        inviteModal.querySelector('.close-btn').onclick = () => inviteModal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == inviteModal) {
                inviteModal.style.display = 'none';
            }
        };

        inviteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const invitee_email = document.getElementById('user-search-input').value;
            try {
                const result = await window.api.post(`/groups/${groupId}/invites`, { invitee_email });
                showToast(result.message, 'success');
                inviteModal.style.display = 'none';
                inviteForm.reset();
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
            }
        });
    };
    
    loadGroupDetails();
});