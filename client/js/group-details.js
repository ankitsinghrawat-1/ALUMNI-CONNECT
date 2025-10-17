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

            const groupLogoUrl = group.image_url ? `http://localhost:3000/${group.image_url}` : createInitialsAvatar(group.name);

            groupDetailsContainer.innerHTML = `
                <div class="group-details-layout">
                    <!-- Left Column -->
                    <div class="group-main-content">
                        <div class="group-header-card card">
                            <img src="${sanitizeHTML(groupLogoUrl)}" alt="${group.name} Logo" class="group-logo-large" onerror="this.src='${createInitialsAvatar(group.name)}'">
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
                        ${membership.status === 'admin' ? `
                        <div class="group-join-requests-card card">
                            <h3>Join Requests (<span id="join-request-count">0</span>)</h3>
                            <div id="join-requests-list" class="join-requests-list"></div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            loadMembers(group);
            if (membership.status === 'admin') {
                loadJoinRequests();
            }
            attachEventListeners();
            
        } catch (error) {
            groupDetailsContainer.innerHTML = '<h1>Error loading group</h1><p class="info-message error">The group could not be found or there was a server error.</p>';
        }
    };
    
    const loadMembers = async (group) => {
        const membersList = document.getElementById('members-list');
        const memberCount = document.getElementById('member-count');
        try {
            const members = await window.api.get(`/groups/${groupId}/members`);
            memberCount.textContent = members.length;
            if (members.length > 0) {
                membersList.innerHTML = members.map(member => {
                    let roleBadge = '';
                    if (member.user_id === group.created_by) {
                        roleBadge = `<span class="role-badge creator">Creator</span>`;
                    } else if (member.role === 'admin') {
                        roleBadge = `<span class="role-badge admin">Admin</span>`;
                    } else {
                        roleBadge = `<span class="role-badge member">Member</span>`;
                    }
                    
                    return `
                    <a href="profile.html?email=${member.email}" class="member-item-sidebar">
                        <img src="${member.profile_pic_url ? `http://localhost:3000/${member.profile_pic_url}` : createInitialsAvatar(member.full_name)}" alt="${member.full_name}" class="alumnus-pic">
                        <div class="member-sidebar-info">
                            <span>${sanitizeHTML(member.full_name)}</span>
                            ${roleBadge}
                        </div>
                    </a>
                `;
                }).join('');
            } else {
                 membersList.innerHTML = '<p class="info-message">No members yet.</p>';
            }
        } catch (error) {
        }
    };

    const loadJoinRequests = async () => {
        const joinRequestsList = document.getElementById('join-requests-list');
        const joinRequestCount = document.getElementById('join-request-count');
        
        if (!joinRequestsList) return; // Only load if the element exists (admin users)
        
        try {
            const requests = await window.api.get(`/groups/${groupId}/join-requests`);
            joinRequestCount.textContent = requests.length;
            
            if (requests.length > 0) {
                joinRequestsList.innerHTML = requests.map(request => `
                    <div class="join-request-item" data-request-id="${request.request_id}">
                        <div class="request-info">
                            <span class="requester-name">${sanitizeHTML(request.full_name)}</span>
                            <span class="request-date">${new Date(request.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div class="request-actions">
                            <button class="btn btn-sm btn-success approve-request-btn" data-request-id="${request.request_id}">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn btn-sm btn-danger reject-request-btn" data-request-id="${request.request_id}">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                joinRequestsList.innerHTML = '<p class="info-message">No pending join requests.</p>';
            }
        } catch (error) {
            if (joinRequestsList) {
                joinRequestsList.innerHTML = '<p class="info-message error">Failed to load join requests.</p>';
            }
        }
    };

    const handleJoinRequest = async (requestId, action) => {
        try {
            await window.api.post(`/groups/${groupId}/join-requests/${requestId}`, { action });
            showToast(`Join request ${action}d successfully!`, 'success');
            
            // Reload both join requests and members (in case someone was approved)
            loadJoinRequests();
            loadMembers();
        } catch (error) {
            showToast(`Failed to ${action} join request: ${error.message}`, 'error');
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
            
            // Handle join request approval/rejection
            if (target.classList.contains('approve-request-btn')) {
                const requestId = target.dataset.requestId;
                await handleJoinRequest(requestId, 'approve');
            }
            
            if (target.classList.contains('reject-request-btn')) {
                const requestId = target.dataset.requestId;
                await handleJoinRequest(requestId, 'reject');
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