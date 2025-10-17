// client/js/blog-post.js
document.addEventListener('DOMContentLoaded', async () => {
    const postContainer = document.getElementById('blog-post-content');
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        postContainer.innerHTML = '<h1>Post not found</h1>';
        return;
    }

    const fetchComments = async () => {
        try {
            const comments = await window.api.get(`/blogs/${postId}/comments`);
            if (comments.length > 0) {
                commentsList.innerHTML = comments.map(comment => `
                    <div class="comment-item">
                        <div class="comment-author">
                            <img src="${comment.profile_pic_url ? `http://localhost:3000/${comment.profile_pic_url}` : createInitialsAvatar(comment.author)}" alt="${comment.author}">
                            <div>
                                <strong>${sanitizeHTML(comment.author)}</strong>
                                <small>${new Date(comment.created_at).toLocaleString()}</small>
                            </div>
                        </div>
                        <p>${sanitizeHTML(comment.content)}</p>
                    </div>
                `).join('');
            } else {
                commentsList.innerHTML = '<p class="info-message">No comments yet. Be the first to share your thoughts!</p>';
            }
        } catch (error) {
            commentsList.innerHTML = '<p class="info-message error">Could not load comments.</p>';
        }
    };

    const fetchPost = async () => {
        postContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        try {
            const post = await window.api.get(`/blogs/${postId}`);
            document.title = post.title;

            const postDate = new Date(post.created_at).toLocaleDateString();
            const imageUrl = post.image_url ? `http://localhost:3000/${post.image_url}` : '';

            postContainer.innerHTML = `
                <article class="blog-post-full card">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${sanitizeHTML(post.title)}" class="blog-post-image">` : ''}
                    <h1>${sanitizeHTML(post.title)}</h1>
                    <p class="post-meta">By <a href="profile.html?email=${post.author_email}">${sanitizeHTML(post.author)}</a> on ${postDate}</p>
                    <div class="post-content">${sanitizeHTML(post.content).replace(/\n/g, '<br>')}</div>
                </article>
            `;
            
            // After fetching the post, fetch the comments
            await fetchComments();
        } catch (error) {
            postContainer.innerHTML = '<h1>Error loading post</h1><p class="info-message error">The post could not be found or there was a server error.</p>';
        }
    };

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = document.getElementById('comment-content').value;

        try {
            await window.api.post(`/blogs/${postId}/comments`, { content });
            document.getElementById('comment-content').value = ''; // Clear the textarea
            showToast('Comment posted successfully!', 'success');
            await fetchComments(); // Refresh the comments list
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    fetchPost();
});