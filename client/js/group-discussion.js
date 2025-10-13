// client/js/group-discussion.js
document.addEventListener('DOMContentLoaded', async () => {
    const discussionContainer = document.getElementById('discussion-page-container');
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('id');

    if (!groupId) {
        discussionContainer.innerHTML = '<h1>Group not found</h1>';
        return;
    }

    const loadDiscussionPage = async () => {
        discussionContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        try {
            const group = await window.api.get(`/groups/${groupId}`);
            const membership = await window.api.get(`/groups/${groupId}/membership-status`);
            
            document.title = `${group.name} - Discussion`;

            discussionContainer.innerHTML = `
                <div class="discussion-header">
                    <h2>${sanitizeHTML(group.name)}</h2>
                    <p>Discussion Board</p>
                    <a href="group-details.html?id=${groupId}" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Back to Group
                    </a>
                </div>
                <div class="discussion-feed">
                    ${membership.status === 'member' || membership.status === 'admin' ? `
                    <form id="new-post-form" class="new-post-form card">
                        <div class="input-group">
                            <textarea id="post-content" placeholder="Share something with the group..." required rows="2"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Post</button>
                    </form>
                    ` : '<p class="info-message card">You must be a member to post in this group.</p>'}
                    <div id="posts-container" class="posts-container"></div>
                </div>
            `;
            
            loadPosts();
            attachEventListeners(membership.status);

        } catch (error) {
            discussionContainer.innerHTML = '<h1>Error loading discussion</h1><p class="info-message error">The group could not be found or there was a server error.</p>';
        }
    };

    const loadPosts = async () => {
        const postsContainer = document.getElementById('posts-container');
        try {
            const posts = await window.api.get(`/groups/${groupId}/posts`);
            if (posts.length > 0) {
                postsContainer.innerHTML = posts.map(post => `
                    <div class="discussion-post card">
                        <div class="post-header">
                             <img class="post-author-pic" src="${post.profile_pic_url ? `http://localhost:3000/${post.profile_pic_url}` : createInitialsAvatar(post.author)}" alt="${post.author}">
                            <div class="post-author-info">
                                <strong>${sanitizeHTML(post.author)}</strong>
                                <small class="post-timestamp">${new Date(post.created_at).toLocaleString()}</small>
                            </div>
                        </div>
                        <p class="post-body">${sanitizeHTML(post.content)}</p>
                    </div>
                `).join('');
            } else {
                postsContainer.innerHTML = '<p class="info-message card">No posts in this group yet. Be the first to share something!</p>';
            }
        } catch (error) {
            postsContainer.innerHTML = '<p class="info-message error card">Could not load posts.</p>';
        }
    };

    const attachEventListeners = (membershipStatus) => {
        if (membershipStatus === 'member' || membershipStatus === 'admin') {
            const newPostForm = document.getElementById('new-post-form');
            if(newPostForm) {
                newPostForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const contentEl = document.getElementById('post-content');
                    const content = contentEl.value;
                    if (!content.trim()) return;
                    try {
                        await window.api.post(`/groups/${groupId}/posts`, { content });
                        contentEl.value = '';
                        loadPosts();
                    } catch(error) {
                        showToast('Failed to create post.', 'error');
                    }
                });
            }
        }
    };
    
    loadDiscussionPage();
});