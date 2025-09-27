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

            let actionButtons = '';
            if (membership.status === 'admin') {
                actionButtons += `<a href="group-management.html?id=${groupId}" class="btn btn-secondary">Manage Group</a>`;
            }
             if (membership.status === 'member' || membership.status === 'admin') {
                actionButtons += `<button id="invite-btn" class="btn btn-primary">Invite Members</button>`;
            } else if (membership.status === 'none') {
                actionButtons += `<button id="join-request-btn" class="btn btn-primary">Request to Join</button>`;
            } else if (membership.status === 'pending') {
                actionButtons += `<button class="btn btn-secondary" disabled>Request Sent</button>`;
            }

            groupDetailsContainer.innerHTML = `
                <div class="group-details-card card">
                    <div class="group-header">
                        <img src="${group.image_url || 'https://via.placeholder.com/800x200?text=Group+Banner'}" alt="${group.name}" class="group-cover-image">
                        <h1>${sanitizeHTML(group.name)}</h1>
                        <p class="group-creator">Created by: ${sanitizeHTML(group.creator_name)}</p>
                        <p>${sanitizeHTML(group.description)}</p>
                        <div class="group-actions">${actionButtons}</div>
                    </div>

                    <div class="group-tabs">
                        <button class="tab-link active" data-tab="discussion">Discussion</button>
                        <button class="tab-link" data-tab="members">Members</button>
                        ${membership.status === 'admin' ? `<button class="tab-link" data-tab="requests">Join Requests</button>` : ''}
                    </div>

                    <div id="discussion" class="tab-content active">
                        ${membership.status === 'member' || membership.status === 'admin' ? `
                        <form id="new-post-form">
                            <div class="input-group">
                                <textarea id="post-content" placeholder="Share something with the group..." required></textarea>
                                <button type="submit" class="btn btn-primary">Post</button>
                            </div>
                        </form>
                        ` : '<p class="info-message">You must be a member to post in this group.</p>'}
                        <div id="posts-container" class="posts-container"></div>
                    </div>

                    <div id="members" class="tab-content">
                        <div id="members-list" class="members-list"></div>
                    </div>
                    
                    ${membership.status === 'admin' ? `
                    <div id="requests" class="tab-content">
                        <div id="requests-list" class="requests-list"></div>
                    </div>
                    ` : ''}
                </div>
            `;
            
            attachEventListeners();
            loadTabData('discussion');
            
        } catch (error) {
            console.error('Error fetching group details:', error);
            groupDetailsContainer.innerHTML = '<h1>Error loading group</h1><p class="info-message error">The group could not be found or there was a server error.</p>';
        }
    };
    
    const loadTabData = (tab) => {
        switch(tab) {
            case 'discussion':
                loadPosts();
                break;
            case 'members':
                loadMembers();
                break;
            case 'requests':
                loadJoinRequests();
                break;
        }
    };

    const loadPosts = async () => {
        const postsContainer = document.getElementById('posts-container');
        try {
            const posts = await window.api.get(`/groups/${groupId}/posts`);
            if (posts.length > 0) {
                postsContainer.innerHTML = posts.map(post => `
                    <div class="group-post card">
                        <div class="post-author">
                            <img src="${post.profile_pic_url ? `http://localhost:3000/${post.profile_pic_url}` : createInitialsAvatar(post.author)}" alt="${post.author}">
                            <div>
                                <strong>${sanitizeHTML(post.author)}</strong>
                                <small>${new Date(post.created_at).toLocaleString()}</small>
                            </div>
                        </div>
                        <p>${sanitizeHTML(post.content)}</p>
                    </div>
                `).join('');
            } else {
                postsContainer.innerHTML = '<p class="info-message">No posts in this group yet. Be the first to share something!</p>';
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    };
    
    const loadMembers = async () => {
         const membersList = document.getElementById('members-list');
        try {
            const members = await window.api.get(`/groups/${groupId}/members`);
            if (members.length > 0) {
                membersList.innerHTML = members.map(member => `
                    <a href="view-profile.html?email=${member.email}" class="member-item">
                        <img src="${member.profile_pic_url ? `http://localhost:3000/${member.profile_pic_url}` : createInitialsAvatar(member.full_name)}" alt="${member.full_name}" class="alumnus-pfp-round small">
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
    
    const loadJoinRequests = async () => {
        const requestsList = document.getElementById('requests-list');
        if (!requestsList) return;
        try {
            const requests = await window.api.get(`/groups/${groupId}/join-requests`);
             if (requests.length > 0) {
                requestsList.innerHTML = requests.map(req => `
                    <div class="request-item">
                        <span>${sanitizeHTML(req.full_name)}</span>
                        <div>
                            <button class="btn btn-success btn-sm approve-join-btn" data-id="${req.request_id}">Approve</button>
                            <button class="btn btn-danger btn-sm reject-join-btn" data-id="${req.request_id}">Reject</button>
                        </div>
                    </div>
                `).join('');
            } else {
                 requestsList.innerHTML = '<p class="info-message">No pending join requests.</p>';
            }
        } catch(error) {
            console.error('Error loading join requests:', error);
        }
    };

    const attachEventListeners = () => {
        groupDetailsContainer.addEventListener('click', async (e) => {
            const target = e.target;
            
            if (target && target.id === 'join-request-btn') {
                 try {
                    await window.api.post(`/groups/${groupId}/request-join`);
                    showToast('Your request to join has been sent!', 'success');
                    target.textContent = 'Request Sent';
                    target.disabled = true;
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }
            
            if (target && target.matches('.tab-link')) {
                document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
                target.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                const tabName = target.dataset.tab;
                document.getElementById(tabName).classList.add('active');
                
                loadTabData(tabName);
            }

            if (target && (target.matches('.approve-join-btn') || target.matches('.reject-join-btn'))) {
                const requestId = target.dataset.id;
                const action = target.matches('.approve-join-btn') ? 'approve' : 'reject';
                
                 try {
                    await window.api.post(`/groups/${groupId}/join-requests/${requestId}`, { action });
                    showToast(`Request ${action}d.`, 'success');
                    loadJoinRequests();
                } catch(error) {
                     showToast('Action failed.', 'error');
                }
            }
            
            if (target && target.id === 'invite-btn') {
                inviteModal.style.display = 'block';
            }
        });
        
        const newPostForm = document.getElementById('new-post-form');
        if(newPostForm) {
            newPostForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const content = document.getElementById('post-content').value;
                try {
                    await window.api.post(`/groups/${groupId}/posts`, { content });
                    document.getElementById('post-content').value = '';
                    loadPosts();
                } catch(error) {
                    showToast('Failed to create post.', 'error');
                }
            });
        }
        
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